package middleware

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5/middleware"
	"github.com/yourusername/fluxpay-go/internal/auth"
	"github.com/yourusername/fluxpay-go/pkg/logger"
	"go.uber.org/zap"
)

// RequestLogger logs HTTP requests with structured logging
func RequestLogger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()

		// Get request ID from context
		requestID := middleware.GetReqID(r.Context())

		// Get user ID if authenticated
		var userID string
		if uid := auth.GetUserID(r); uid != "" {
			userID = uid
		}

		// Create a response writer wrapper to capture status code
		ww := &responseWriter{ResponseWriter: w, statusCode: http.StatusOK}

		next.ServeHTTP(ww, r)

		duration := time.Since(start)

		logger.Info("HTTP request completed",
			zap.String("request_id", requestID),
			zap.String("method", r.Method),
			zap.String("path", r.RequestURI),
			zap.Int("status", ww.statusCode),
			zap.Duration("latency", duration),
			zap.String("user_id", userID),
		)
	})
}

// RecoveryLogger recovers from panics and logs with structured logging
func RecoveryLogger(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				logger.Error("Panic recovered",
					zap.String("request_id", middleware.GetReqID(r.Context())),
					zap.String("method", r.Method),
					zap.String("path", r.RequestURI),
					zap.Any("panic", err),
				)
				w.WriteHeader(http.StatusInternalServerError)
				w.Write([]byte(`{"success":false,"code":"internal_server_error","message":"Internal server error"}`))
			}
		}()
		next.ServeHTTP(w, r)
	})
}

// responseWriter wraps http.ResponseWriter to capture status code
type responseWriter struct {
	http.ResponseWriter
	statusCode int
}

func (rw *responseWriter) WriteHeader(code int) {
	rw.statusCode = code
	rw.ResponseWriter.WriteHeader(code)
}
