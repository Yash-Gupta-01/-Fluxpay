package auth

import (
	"encoding/json"
	"net/http"

	"github.com/yourusername/fluxpay-go/internal/common"
	"github.com/yourusername/fluxpay-go/pkg/logger"
	"go.uber.org/zap"
)

// Handler handles authentication HTTP requests
type Handler struct {
	service   *Service
	validator *common.Validator
}

// NewHandler creates a new authentication handler
func NewHandler(service *Service, validator *common.Validator) *Handler {
	return &Handler{
		service:   service,
		validator: validator,
	}
}

// Register handles POST /api/auth/register
func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	var req RegisterRequest

	// Parse request body
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		logger.Warn("auth.Register: invalid request body", zap.Error(err))
		common.BadRequest(w, "Invalid request body")
		return
	}

	// Validate request
	if errs := h.validator.Struct(req); len(errs) > 0 {
		logger.Warn("auth.Register: validation failed", zap.Int("errors", len(errs)))
		common.ValidationErrors(w, errs)
		return
	}

	// Call service
	resp, err := h.service.Register(r.Context(), req)
	if err != nil {
		logger.Error("auth.Register: service error", zap.Error(err))
		if err.Error() == "auth.Register: email already exists" {
			common.Conflict(w, "Email already exists")
			return
		}
		common.InternalServerError(w, "Failed to register user")
		return
	}

	logger.Info("auth.Register: success", zap.String("user_id", resp.UserID))
	common.Created(w, resp)
}

// Login handles POST /api/auth/login
func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req LoginRequest

	// Parse request body
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		logger.Warn("auth.Login: invalid request body", zap.Error(err))
		common.BadRequest(w, "Invalid request body")
		return
	}

	// Validate request
	if errs := h.validator.Struct(req); len(errs) > 0 {
		logger.Warn("auth.Login: validation failed", zap.Int("errors", len(errs)))
		common.ValidationErrors(w, errs)
		return
	}

	// Call service
	resp, err := h.service.Login(r.Context(), req)
	if err != nil {
		logger.Warn("auth.Login: authentication failed", zap.String("email", req.Email))
		common.Unauthorized(w, "Invalid email or password")
		return
	}

	logger.Info("auth.Login: success", zap.String("user_id", resp.UserID))
	common.OK(w, resp)
}

// Refresh handles POST /api/auth/refresh
func (h *Handler) Refresh(w http.ResponseWriter, r *http.Request) {
	var req RefreshRequest

	// Parse request body
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		logger.Warn("auth.Refresh: invalid request body", zap.Error(err))
		common.BadRequest(w, "Invalid request body")
		return
	}

	// Validate request
	if errs := h.validator.Struct(req); len(errs) > 0 {
		logger.Warn("auth.Refresh: validation failed", zap.Int("errors", len(errs)))
		common.ValidationErrors(w, errs)
		return
	}

	// Call service
	resp, err := h.service.Refresh(r.Context(), req.RefreshToken)
	if err != nil {
		logger.Warn("auth.Refresh: token refresh failed", zap.Error(err))
		common.Unauthorized(w, "Invalid or expired refresh token")
		return
	}

	logger.Info("auth.Refresh: success", zap.String("user_id", resp.UserID))
	common.OK(w, resp)
}

// Logout handles POST /api/auth/logout
func (h *Handler) Logout(w http.ResponseWriter, r *http.Request) {
	userID := GetUserID(r)
	if userID == "" {
		logger.Warn("auth.Logout: missing user_id in context")
		common.Unauthorized(w, "Missing user context")
		return
	}

	// Get refresh token from request body
	var req RefreshRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		logger.Warn("auth.Logout: invalid request body", zap.Error(err))
		common.BadRequest(w, "Invalid request body")
		return
	}

	if req.RefreshToken == "" {
		logger.Warn("auth.Logout: missing refresh token")
		common.BadRequest(w, "Missing refresh token")
		return
	}

	// Call service
	if err := h.service.Logout(r.Context(), req.RefreshToken); err != nil {
		logger.Error("auth.Logout: service error", zap.Error(err))
		common.InternalServerError(w, "Failed to logout")
		return
	}

	logger.Info("auth.Logout: success", zap.String("user_id", userID))
	common.OK(w, map[string]string{"message": "Logged out successfully"})
}
