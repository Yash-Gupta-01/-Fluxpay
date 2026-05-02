package transaction

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/yourusername/fluxpay-go/internal/auth"
	"github.com/yourusername/fluxpay-go/internal/common"
	"github.com/yourusername/fluxpay-go/pkg/logger"
	"go.uber.org/zap"
)

// Handler handles transaction HTTP requests
type Handler struct {
	service   *Service
	validator *common.Validator
}

// NewHandler creates a new transaction handler
func NewHandler(service *Service, validator *common.Validator) *Handler {
	return &Handler{
		service:   service,
		validator: validator,
	}
}

// Transfer handles POST /api/transactions/transfer
func (h *Handler) Transfer(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r)
	if userID == "" {
		logger.Warn("transaction.Handler.Transfer: missing user_id in context")
		common.Unauthorized(w, "Missing user context")
		return
	}

	var req TransferRequest

	// Parse request body
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		logger.Warn("transaction.Handler.Transfer: invalid request body",
			zap.String("user_id", userID),
			zap.Error(err),
		)
		common.BadRequest(w, "Invalid request body")
		return
	}

	// Validate request
	if errs := h.validator.Struct(req); len(errs) > 0 {
		logger.Warn("transaction.Handler.Transfer: validation failed",
			zap.String("user_id", userID),
			zap.Int("errors", len(errs)),
		)
		common.ValidationErrors(w, errs)
		return
	}

	// Call service
	resp, err := h.service.Transfer(r.Context(), userID, req)
	if err != nil {
		logger.Error("transaction.Handler.Transfer: service error",
			zap.String("user_id", userID),
			zap.Error(err),
		)

		// Handle specific error cases
		switch err.Error() {
		case "transaction.Transfer: cannot transfer to self":
			common.BadRequest(w, "Cannot transfer to yourself")
			return
		case "transaction.Transfer: only USD supported":
			common.BadRequest(w, "Only USD currency is supported")
			return
		case "transaction.Transfer: insufficient balance":
			common.BadRequest(w, "Insufficient balance for this transfer")
			return
		case "transaction.Transfer: sender wallet not found":
			common.NotFound(w, "Your wallet not found")
			return
		case "transaction.Transfer: receiver not found":
			common.BadRequest(w, "Receiver wallet not found")
			return
		default:
			common.InternalServerError(w, "Failed to process transfer")
			return
		}
	}

	logger.Info("transaction.Handler.Transfer: success",
		zap.String("user_id", userID),
		zap.String("transaction_id", resp.TransactionID),
		zap.String("receiver_id", resp.ReceiverID),
	)
	common.Created(w, resp)
}

// ListTransactions handles GET /api/transactions
func (h *Handler) ListTransactions(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r)
	if userID == "" {
		logger.Warn("transaction.Handler.ListTransactions: missing user_id in context")
		common.Unauthorized(w, "Missing user context")
		return
	}

	// Parse pagination parameters
	limit := 20
	offset := 0

	if limitStr := r.URL.Query().Get("limit"); limitStr != "" {
		if l, err := strconv.Atoi(limitStr); err == nil && l > 0 && l <= 100 {
			limit = l
		}
	}

	if offsetStr := r.URL.Query().Get("offset"); offsetStr != "" {
		if o, err := strconv.Atoi(offsetStr); err == nil && o >= 0 {
			offset = o
		}
	}

	// Call service
	resp, err := h.service.ListTransactions(r.Context(), userID, limit, offset)
	if err != nil {
		logger.Error("transaction.Handler.ListTransactions: service error",
			zap.String("user_id", userID),
			zap.Error(err),
		)
		common.InternalServerError(w, "Failed to retrieve transactions")
		return
	}

	logger.Info("transaction.Handler.ListTransactions: success",
		zap.String("user_id", userID),
		zap.Int("count", len(resp.Transactions)),
	)
	common.OK(w, resp)
}

// GetTransaction handles GET /api/transactions/:id
func (h *Handler) GetTransaction(w http.ResponseWriter, r *http.Request) {
	userID := auth.GetUserID(r)
	if userID == "" {
		logger.Warn("transaction.Handler.GetTransaction: missing user_id in context")
		common.Unauthorized(w, "Missing user context")
		return
	}

	txnID := chi.URLParam(r, "id")
	if txnID == "" {
		logger.Warn("transaction.Handler.GetTransaction: missing transaction id")
		common.BadRequest(w, "Missing transaction ID")
		return
	}

	// Call service
	resp, err := h.service.GetTransaction(r.Context(), userID, txnID)
	if err != nil {
		logger.Warn("transaction.Handler.GetTransaction: service error",
			zap.String("user_id", userID),
			zap.String("transaction_id", txnID),
			zap.Error(err),
		)

		if err.Error() == "transaction.GetTransaction: unauthorized" {
			common.Forbidden(w, "You don't have permission to view this transaction")
			return
		}

		common.NotFound(w, "Transaction not found")
		return
	}

	logger.Info("transaction.Handler.GetTransaction: success",
		zap.String("user_id", userID),
		zap.String("transaction_id", txnID),
	)
	common.OK(w, resp)
}
