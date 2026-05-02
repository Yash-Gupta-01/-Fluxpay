package health

import (
	"context"
	"encoding/json"
	"net/http"
	"time"

	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/redis/go-redis/v9"
	"github.com/segmentio/kafka-go"
	"github.com/yourusername/fluxpay-go/pkg/logger"
	"go.uber.org/zap"
)

// HealthChecker checks the health of all service dependencies
type HealthChecker struct {
	db      *pgxpool.Pool
	redis   *redis.Client
	brokers []string
}

// NewHealthChecker creates a new health checker
func NewHealthChecker(db *pgxpool.Pool, redis *redis.Client, brokers []string) *HealthChecker {
	return &HealthChecker{
		db:      db,
		redis:   redis,
		brokers: brokers,
	}
}

// HealthResponse represents the health check response
type HealthResponse struct {
	Status   string `json:"status"`
	Database string `json:"database"`
	Redis    string `json:"redis"`
	Kafka    string `json:"kafka"`
}

// Check handles the health check endpoint
func (hc *HealthChecker) Check(w http.ResponseWriter, r *http.Request) {
	ctx, cancel := context.WithTimeout(r.Context(), 5*time.Second)
	defer cancel()

	response := HealthResponse{
		Status:   "healthy",
		Database: "healthy",
		Redis:    "healthy",
		Kafka:    "healthy",
	}

	// Check database
	if err := hc.db.Ping(ctx); err != nil {
		logger.Error("Health check: database ping failed", zap.Error(err))
		response.Database = "unhealthy"
		response.Status = "degraded"
	}

	// Check Redis
	if err := hc.redis.Ping(ctx).Err(); err != nil {
		logger.Error("Health check: redis ping failed", zap.Error(err))
		response.Redis = "unhealthy"
		response.Status = "degraded"
	}

	// Check Kafka
	if len(hc.brokers) == 0 {
		response.Kafka = "unhealthy"
		response.Status = "degraded"
	} else {
		conn, err := kafka.DialContext(ctx, "tcp", hc.brokers[0])
		if err != nil {
			logger.Error("Health check: kafka dial failed", zap.Error(err), zap.String("broker", hc.brokers[0]))
			response.Kafka = "unhealthy"
			response.Status = "degraded"
		} else {
			_ = conn.Close()
		}
	}

	// Determine HTTP status code
	httpStatus := http.StatusOK
	if response.Status == "degraded" {
		httpStatus = http.StatusServiceUnavailable
	}

	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(httpStatus)
	_ = json.NewEncoder(w).Encode(response)
}
