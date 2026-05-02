package wallet

import (
	"encoding/json"
	"net/http"

	"github.com/yourusername/fluxpay-go/internal/auth"
	"github.com/yourusername/fluxpay-go/internal/common"
	"github.com/yourusername/fluxpay-go/pkg/logger"
	"go.uber.org/zap"
)

// Handler handles wallet HTTP requests
type Handler struct {
	service   *Service
	validator *common.Validator
}

// NewHandler creates a new wallet handler
func NewHandler(service *Service, validator *common.Validator) *Handler {
	return &Handler{
		service:   service,
		validator: validator,
	}
}

// GetWallet handles GET /api/wallet
func (h *Handler) GetWallet(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r)
	if userID == "" {
		logger.Warn("wallet.Handler.GetWallet: missing user_id in context")
		common.Unauthorized(w, "Missing user context")
		return
	}

	resp, err := h.service.GetWallet(r.Context(), userID)
	if err != nil {
		logger.Error("wallet.Handler.GetWallet: service error",
			zap.String("user_id", userID),
			zap.Error(err),
		)
		common.NotFound(w, "Wallet not found")
		return
	}

	logger.Info("wallet.Handler.GetWallet: success",
		zap.String("user_id", userID),
	)
	common.OK(w, resp)
}

// TopUp handles POST /api/wallet/topup
func (h *Handler) TopUp(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r)
	if userID == "" {
		logger.Warn("wallet.Handler.TopUp: missing user_id in context")
		common.Unauthorized(w, "Missing user context")
		return
	}

	var req TopUpRequest

	// Parse request body
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		logger.Warn("wallet.Handler.TopUp: invalid request body",
			zap.String("user_id", userID),
			zap.Error(err),
		)
		common.BadRequest(w, "Invalid request body")
		return
	}

	// Validate request
	if errs := h.validator.Struct(req); len(errs) > 0 {
		logger.Warn("wallet.Handler.TopUp: validation failed",
			zap.String("user_id", userID),
			zap.Int("errors", len(errs)),
		)
		common.ValidationErrors(w, errs)
		return
	}

	// Call service
	resp, err := h.service.TopUp(r.Context(), userID, req)
	if err != nil {
		logger.Error("wallet.Handler.TopUp: service error",
			zap.String("user_id", userID),
			zap.Error(err),
		)
		common.InternalServerError(w, "Failed to top up wallet")
		return
	}

	logger.Info("wallet.Handler.TopUp: success",
		zap.String("user_id", userID),
		zap.String("amount", req.Amount),
	)
	common.OK(w, resp)
}
