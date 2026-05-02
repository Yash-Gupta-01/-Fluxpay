package auth

import (
	"context"
	"crypto/sha256"
	"fmt"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
)

// TokenClaims represents JWT claims
type TokenClaims struct {
	UserID string `json:"user_id"`
	Email  string `json:"email"`
	Type   string `json:"type"` // "access" or "refresh"
	jwt.RegisteredClaims
}

// TokenConfig holds token configuration
type TokenConfig struct {
	AccessSecret   string
	RefreshSecret  string
	AccessTTL      time.Duration
	RefreshTTL     time.Duration
}

// TokenManager handles JWT token operations
type TokenManager struct {
	cfg TokenConfig
}

// NewTokenManager creates a new token manager
func NewTokenManager(cfg TokenConfig) *TokenManager {
	return &TokenManager{cfg: cfg}
}

// GenerateAccessToken generates a new access token
func (tm *TokenManager) GenerateAccessToken(ctx context.Context, userID, email string) (string, error) {
	claims := &TokenClaims{
		UserID: userID,
		Email:  email,
		Type:   "access",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(tm.cfg.AccessTTL)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ID:        uuid.New().String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(tm.cfg.AccessSecret))
	if err != nil {
		return "", fmt.Errorf("auth.GenerateAccessToken: sign token: %w", err)
	}

	return tokenString, nil
}

// GenerateRefreshToken generates a new refresh token
func (tm *TokenManager) GenerateRefreshToken(ctx context.Context, userID string) (string, error) {
	claims := &TokenClaims{
		UserID: userID,
		Type:   "refresh",
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(tm.cfg.RefreshTTL)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			ID:        uuid.New().String(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString([]byte(tm.cfg.RefreshSecret))
	if err != nil {
		return "", fmt.Errorf("auth.GenerateRefreshToken: sign token: %w", err)
	}

	return tokenString, nil
}

// ValidateAccessToken validates an access token and returns claims
func (tm *TokenManager) ValidateAccessToken(tokenString string) (*TokenClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &TokenClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("auth.ValidateAccessToken: unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(tm.cfg.AccessSecret), nil
	})

	if err != nil {
		return nil, fmt.Errorf("auth.ValidateAccessToken: parse token: %w", err)
	}

	claims, ok := token.Claims.(*TokenClaims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("auth.ValidateAccessToken: invalid token")
	}

	if claims.Type != "access" {
		return nil, fmt.Errorf("auth.ValidateAccessToken: invalid token type")
	}

	return claims, nil
}

// ValidateRefreshToken validates a refresh token and returns claims
func (tm *TokenManager) ValidateRefreshToken(tokenString string) (*TokenClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &TokenClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("auth.ValidateRefreshToken: unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(tm.cfg.RefreshSecret), nil
	})

	if err != nil {
		return nil, fmt.Errorf("auth.ValidateRefreshToken: parse token: %w", err)
	}

	claims, ok := token.Claims.(*TokenClaims)
	if !ok || !token.Valid {
		return nil, fmt.Errorf("auth.ValidateRefreshToken: invalid token")
	}

	if claims.Type != "refresh" {
		return nil, fmt.Errorf("auth.ValidateRefreshToken: invalid token type")
	}

	return claims, nil
}

// HashToken returns a SHA256 hash of the token for storage
func HashToken(token string) string {
	hash := sha256.Sum256([]byte(token))
	return fmt.Sprintf("%x", hash)
}
