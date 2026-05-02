package auth

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"golang.org/x/crypto/bcrypt"
)

// RegisterRequest represents a registration request
type RegisterRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required,min=8"`
	Name     string `json:"name" validate:"required,min=2"`
}

// LoginRequest represents a login request
type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

// RefreshRequest represents a refresh token request
type RefreshRequest struct {
	RefreshToken string `json:"refresh_token" validate:"required"`
}

// AuthResponse represents an authentication response with tokens
type AuthResponse struct {
	AccessToken  string `json:"access_token"`
	RefreshToken string `json:"refresh_token"`
	ExpiresIn    int64  `json:"expires_in"`
	TokenType    string `json:"token_type"`
	UserID       string `json:"user_id"`
	Email        string `json:"email"`
}

// Service handles authentication business logic
type Service struct {
	db            *pgxpool.Pool
	tokenManager  *TokenManager
	tokenConfig   TokenConfig
}

// NewService creates a new authentication service
func NewService(db *pgxpool.Pool, tokenManager *TokenManager, tokenConfig TokenConfig) *Service {
	return &Service{
		db:           db,
		tokenManager: tokenManager,
		tokenConfig:  tokenConfig,
	}
}

// Register registers a new user
func (s *Service) Register(ctx context.Context, req RegisterRequest) (*AuthResponse, error) {
	// Check if user already exists
	var existingUserID string
	err := s.db.QueryRow(ctx, "SELECT id FROM users WHERE email = $1", req.Email).Scan(&existingUserID)
	if err == nil {
		return nil, fmt.Errorf("auth.Register: email already exists")
	}
	if err != pgx.ErrNoRows {
		return nil, fmt.Errorf("auth.Register: query user: %w", err)
	}

	// Hash password
	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return nil, fmt.Errorf("auth.Register: hash password: %w", err)
	}

	// Begin transaction
	tx, err := s.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("auth.Register: begin tx: %w", err)
	}
	defer tx.Rollback(ctx)

	// Create user
	var userID string
	err = tx.QueryRow(ctx,
		"INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id",
		req.Email, string(hashedPassword), req.Name,
	).Scan(&userID)
	if err != nil {
		return nil, fmt.Errorf("auth.Register: create user: %w", err)
	}

	// Create wallet for user with 0 balance
	_, err = tx.Exec(ctx,
		"INSERT INTO wallets (user_id, balance, currency) VALUES ($1, $2, $3)",
		userID, "0", "USD",
	)
	if err != nil {
		return nil, fmt.Errorf("auth.Register: create wallet: %w", err)
	}

	// Commit transaction
	if err := tx.Commit(ctx); err != nil {
		return nil, fmt.Errorf("auth.Register: commit tx: %w", err)
	}

	// Generate tokens
	accessToken, err := s.tokenManager.GenerateAccessToken(ctx, userID, req.Email)
	if err != nil {
		return nil, fmt.Errorf("auth.Register: generate access token: %w", err)
	}

	refreshToken, err := s.tokenManager.GenerateRefreshToken(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("auth.Register: generate refresh token: %w", err)
	}

	// Store refresh token hash
	tokenHash := HashToken(refreshToken)
	_, err = s.db.Exec(ctx,
		"INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
		userID, tokenHash, time.Now().Add(s.tokenConfig.RefreshTTL),
	)
	if err != nil {
		return nil, fmt.Errorf("auth.Register: store refresh token: %w", err)
	}

	return &AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    int64(s.tokenConfig.AccessTTL.Seconds()),
		TokenType:    "Bearer",
		UserID:       userID,
		Email:        req.Email,
	}, nil
}

// Login authenticates a user and returns tokens
func (s *Service) Login(ctx context.Context, req LoginRequest) (*AuthResponse, error) {
	// Get user by email
	var userID, passwordHash string
	err := s.db.QueryRow(ctx,
		"SELECT id, password_hash FROM users WHERE email = $1",
		req.Email,
	).Scan(&userID, &passwordHash)
	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("auth.Login: invalid credentials")
	}
	if err != nil {
		return nil, fmt.Errorf("auth.Login: query user: %w", err)
	}

	// Verify password
	if err := bcrypt.CompareHashAndPassword([]byte(passwordHash), []byte(req.Password)); err != nil {
		return nil, fmt.Errorf("auth.Login: invalid credentials")
	}

	// Generate tokens
	accessToken, err := s.tokenManager.GenerateAccessToken(ctx, userID, req.Email)
	if err != nil {
		return nil, fmt.Errorf("auth.Login: generate access token: %w", err)
	}

	refreshToken, err := s.tokenManager.GenerateRefreshToken(ctx, userID)
	if err != nil {
		return nil, fmt.Errorf("auth.Login: generate refresh token: %w", err)
	}

	// Store refresh token hash
	tokenHash := HashToken(refreshToken)
	_, err = s.db.Exec(ctx,
		"INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)",
		userID, tokenHash, time.Now().Add(s.tokenConfig.RefreshTTL),
	)
	if err != nil {
		return nil, fmt.Errorf("auth.Login: store refresh token: %w", err)
	}

	return &AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    int64(s.tokenConfig.AccessTTL.Seconds()),
		TokenType:    "Bearer",
		UserID:       userID,
		Email:        req.Email,
	}, nil
}

// Refresh issues a new access token
func (s *Service) Refresh(ctx context.Context, refreshToken string) (*AuthResponse, error) {
	// Validate refresh token
	claims, err := s.tokenManager.ValidateRefreshToken(refreshToken)
	if err != nil {
		return nil, fmt.Errorf("auth.Refresh: validate token: %w", err)
	}

	// Check if refresh token exists and is not revoked
	var revoked bool
	tokenHash := HashToken(refreshToken)
	err = s.db.QueryRow(ctx,
		"SELECT revoked FROM refresh_tokens WHERE token_hash = $1 AND expires_at > NOW()",
		tokenHash,
	).Scan(&revoked)
	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("auth.Refresh: token not found or expired")
	}
	if err != nil {
		return nil, fmt.Errorf("auth.Refresh: query token: %w", err)
	}

	if revoked {
		return nil, fmt.Errorf("auth.Refresh: token revoked")
	}

	// Get user email
	var email string
	err = s.db.QueryRow(ctx, "SELECT email FROM users WHERE id = $1", claims.UserID).Scan(&email)
	if err != nil {
		return nil, fmt.Errorf("auth.Refresh: query user: %w", err)
	}

	// Generate new access token
	accessToken, err := s.tokenManager.GenerateAccessToken(ctx, claims.UserID, email)
	if err != nil {
		return nil, fmt.Errorf("auth.Refresh: generate access token: %w", err)
	}

	return &AuthResponse{
		AccessToken:  accessToken,
		RefreshToken: refreshToken,
		ExpiresIn:    int64(s.tokenConfig.AccessTTL.Seconds()),
		TokenType:    "Bearer",
		UserID:       claims.UserID,
		Email:        email,
	}, nil
}

// Logout revokes a refresh token
func (s *Service) Logout(ctx context.Context, refreshToken string) error {
	tokenHash := HashToken(refreshToken)
	_, err := s.db.Exec(ctx,
		"UPDATE refresh_tokens SET revoked = TRUE WHERE token_hash = $1",
		tokenHash,
	)
	if err != nil {
		return fmt.Errorf("auth.Logout: revoke token: %w", err)
	}
	return nil
}
