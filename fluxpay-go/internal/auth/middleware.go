package auth

import (
	"context"
	"net/http"
	"strings"

	"github.com/yourusername/fluxpay-go/internal/common"
	"github.com/yourusername/fluxpay-go/pkg/logger"
	"go.uber.org/zap"
)

// UserIDKey is used to inject user_id into request context
type UserIDKey struct{}

// UserEmailKey is used to inject email into request context
type UserEmailKey struct{}

// AuthMiddleware validates JWT tokens and injects user context
func AuthMiddleware(tokenManager *TokenManager) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			authHeader := r.Header.Get("Authorization")
			if authHeader == "" {
				logger.Error("auth middleware: missing authorization header")
				common.Unauthorized(w, "Missing authorization header")
				return
			}

			// Extract bearer token
			parts := strings.SplitN(authHeader, " ", 2)
			if len(parts) != 2 || parts[0] != "Bearer" {
				logger.Error("auth middleware: invalid authorization header format")
				common.Unauthorized(w, "Invalid authorization header format")
				return
			}

			token := parts[1]

			// Validate token
			claims, err := tokenManager.ValidateAccessToken(token)
			if err != nil {
				logger.Error("auth middleware: invalid token", zap.Error(err))
				common.Unauthorized(w, "Invalid or expired token")
				return
			}

			// Inject user_id and email into request context
			ctx := context.WithValue(r.Context(), UserIDKey{}, claims.UserID)
			ctx = context.WithValue(ctx, UserEmailKey{}, claims.Email)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// GetUserID retrieves user_id from request context
func GetUserID(r *http.Request) string {
	userID, ok := r.Context().Value(UserIDKey{}).(string)
	if !ok {
		return ""
	}
	return userID
}

// GetUserEmail retrieves email from request context
func GetUserEmail(r *http.Request) string {
	email, ok := r.Context().Value(UserEmailKey{}).(string)
	if !ok {
		return ""
	}
	return email
}
