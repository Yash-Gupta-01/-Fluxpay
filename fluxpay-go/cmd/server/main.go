package main

import (
	"context"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"strings"
	"syscall"
	"time"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/redis/go-redis/v9"
	"github.com/yourusername/fluxpay-go/internal/auth"
	"github.com/yourusername/fluxpay-go/internal/cache"
	"github.com/yourusername/fluxpay-go/internal/common"
	"github.com/yourusername/fluxpay-go/internal/db"
	"github.com/yourusername/fluxpay-go/internal/health"
	"github.com/yourusername/fluxpay-go/internal/kafka"
	mw "github.com/yourusername/fluxpay-go/internal/middleware"
	"github.com/yourusername/fluxpay-go/internal/transaction"
	"github.com/yourusername/fluxpay-go/internal/wallet"
	"github.com/yourusername/fluxpay-go/pkg/logger"
	"go.uber.org/zap"
)

func main() {
	// Load configuration
	cfg, err := common.LoadConfig()
	if err != nil {
		log.Fatalf("Failed to load config: %v", err)
	}

	// Initialize logger
	if err := logger.Init(cfg.LogLevel, cfg.Env); err != nil {
		log.Fatalf("Failed to initialize logger: %v", err)
	}
	defer logger.Sync()

	logger.Info("Starting Fluxpay server",
		zap.Int("port", cfg.Port),
		zap.String("env", cfg.Env),
	)

	// Initialize database
	pool, err := db.New(context.Background(), db.Config{
		URL:             cfg.DatabaseURL,
		MaxConns:        cfg.DBMaxConns,
		MinConns:        cfg.DBMinIdleConns,
		MaxConnIdleTime: cfg.DBMaxConnIdleTime,
	})
	if err != nil {
		logger.Error("Failed to connect to database", zap.Error(err))
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close(pool)

	logger.Info("Database connected successfully")

	// Initialize Redis
	redisClient := redis.NewClient(&redis.Options{
		Addr: parseRedisURL(cfg.RedisURL),
	})

	// Test Redis connection
	if err := redisClient.Ping(context.Background()).Err(); err != nil {
		logger.Error("Failed to connect to Redis", zap.Error(err))
		log.Fatalf("Failed to connect to Redis: %v", err)
	}
	defer redisClient.Close()

	logger.Info("Redis connected successfully")

	// Initialize Kafka producer
	kafkaProducer, err := transaction.NewKafkaProducer(cfg.KafkaBrokers)
	if err != nil {
		logger.Error("Failed to initialize Kafka producer", zap.Error(err))
		log.Fatalf("Failed to initialize Kafka producer: %v", err)
	}
	defer kafkaProducer.Close()

	logger.Info("Kafka producer initialized successfully")

	// Initialize services
	validator := common.NewValidator()

	tokenConfig := auth.TokenConfig{
		AccessSecret:  cfg.JWTAccessTokenSecret,
		RefreshSecret: cfg.JWTRefreshTokenSecret,
		AccessTTL:     cfg.JWTAccessTokenTTL,
		RefreshTTL:    cfg.JWTRefreshTokenTTL,
	}
	tokenManager := auth.NewTokenManager(tokenConfig)
	authService := auth.NewService(pool, tokenManager, tokenConfig)
	authHandler := auth.NewHandler(authService, validator)

	// Initialize wallet service
	walletRepo := wallet.NewRepository(pool)
	walletService := wallet.NewService(walletRepo)
	walletHandler := wallet.NewHandler(walletService, validator)

	// Initialize transaction service
	transactionRepo := transaction.NewRepository(pool)
	analytics := cache.NewAnalytics(redisClient)
	idempotencyCache := cache.NewIdempotencyCache(redisClient, 24*time.Hour)
	transactionService := transaction.NewService(transactionRepo, walletRepo, idempotencyCache, analytics, kafkaProducer)
	transactionHandler := transaction.NewHandler(transactionService, validator)

	// Initialize Kafka consumer
	kafkaConsumer, err := kafka.NewConsumer(cfg.KafkaBrokers, cfg.KafkaConsumerGroup, analytics)
	if err != nil {
		logger.Error("Failed to initialize Kafka consumer", zap.Error(err))
		log.Fatalf("Failed to initialize Kafka consumer: %v", err)
	}

	logger.Info("Kafka consumer initialized successfully")

	// Initialize health checker
	healthChecker := health.NewHealthChecker(pool, redisClient, cfg.KafkaBrokers)

	// Create router
	r := chi.NewRouter()

	// Global middleware
	r.Use(chimw.RequestID)
	r.Use(chimw.RealIP)
	r.Use(mw.RequestLogger)
	r.Use(mw.RecoveryLogger)
	r.Use(chimw.Timeout(60 * time.Second))

	// Health check
	r.Get("/health", healthChecker.Check)

	// Auth routes
	r.Route("/api/auth", func(r chi.Router) {
		r.Post("/register", authHandler.Register)
		r.Post("/login", authHandler.Login)
		r.Post("/refresh", authHandler.Refresh)
		r.Post("/logout", func(w http.ResponseWriter, r *http.Request) {
			// Logout doesn't require authentication header validation
			authHandler.Logout(w, r)
		})
	})

	// Wallet routes (require auth)
	r.Route("/api/wallet", func(r chi.Router) {
		r.Use(auth.AuthMiddleware(tokenManager))
		r.Get("/", walletHandler.GetWallet)
		r.Post("/topup", walletHandler.TopUp)
	})

	// Transaction routes (require auth)
	r.Route("/api/transactions", func(r chi.Router) {
		r.Use(auth.AuthMiddleware(tokenManager))
		r.Post("/transfer", transactionHandler.Transfer)
		r.Get("/", transactionHandler.ListTransactions)
		r.Get("/{id}", transactionHandler.GetTransaction)
	})

	// Start Kafka consumer
	kafkaConsumer.Start(context.Background())

	// Create HTTP server
	srv := &http.Server{
		Addr:         fmt.Sprintf(":%d", cfg.Port),
		Handler:      r,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 15 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in a goroutine
	go func() {
		logger.Info("Server starting", zap.String("addr", srv.Addr))
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			logger.Error("Server error", zap.Error(err))
		}
	}()

	// Wait for interrupt signal
	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, syscall.SIGINT, syscall.SIGTERM)

	<-sigChan
	logger.Info("Shutting down server")

	// Graceful shutdown with timeout
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer cancel()

	// Shutdown Kafka consumer
	if err := kafkaConsumer.Shutdown(shutdownCtx); err != nil {
		logger.Error("Kafka consumer shutdown error", zap.Error(err))
	}

	// Shutdown HTTP server
	if err := srv.Shutdown(shutdownCtx); err != nil {
		logger.Error("HTTP server shutdown error", zap.Error(err))
	}

	logger.Info("Server shut down successfully")
}

// parseRedisURL extracts the address from a Redis URL
func parseRedisURL(redisURL string) string {
	// Handle both "redis://localhost:6379/0" and "localhost:6379" formats
	if strings.HasPrefix(redisURL, "redis://") {
		redisURL = strings.TrimPrefix(redisURL, "redis://")
		// Remove database number if present
		if idx := strings.Index(redisURL, "/"); idx != -1 {
			redisURL = redisURL[:idx]
		}
	}
	return redisURL
}
