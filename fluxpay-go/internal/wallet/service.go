package wallet

import (
	"context"
	"fmt"
	"math/big"

	"github.com/yourusername/fluxpay-go/pkg/logger"
	"go.uber.org/zap"
)

// Service handles wallet business logic
type Service struct {
	repo *Repository
}

// NewService creates a new wallet service
func NewService(repo *Repository) *Service {
	return &Service{repo: repo}
}

// GetWallet retrieves the authenticated user's wallet
func (s *Service) GetWallet(ctx context.Context, userID string) (*GetWalletResponse, error) {
	wallet, err := s.repo.GetWalletByUserID(ctx, userID)
	if err != nil {
		logger.Error("wallet.Service.GetWallet: repository error",
			zap.String("user_id", userID),
			zap.Error(err),
		)
		return nil, fmt.Errorf("wallet.GetWallet: failed to retrieve wallet: %w", err)
	}

	return &GetWalletResponse{
		ID:       wallet.ID,
		UserID:   wallet.UserID,
		Balance:  FormatAmount(wallet.Balance),
		Currency: wallet.Currency,
	}, nil
}

// TopUp adds funds to the user's wallet (admin/test only)
func (s *Service) TopUp(ctx context.Context, userID string, req TopUpRequest) (*TopUpResponse, error) {
	// Validate currency
	if req.Currency != "USD" {
		return nil, fmt.Errorf("wallet.TopUp: only USD supported")
	}

	// Parse and validate amount
	amount, err := ParseAmount(req.Amount)
	if err != nil {
		logger.Warn("wallet.Service.TopUp: invalid amount",
			zap.String("user_id", userID),
			zap.String("amount", req.Amount),
			zap.Error(err),
		)
		return nil, fmt.Errorf("wallet.TopUp: invalid amount: %w", err)
	}

	// Check amount is positive
	if amount.Cmp(big.NewFloat(0)) <= 0 {
		return nil, fmt.Errorf("wallet.TopUp: amount must be positive")
	}

	// Begin transaction
	tx, err := s.repo.BeginTx(ctx)
	if err != nil {
		logger.Error("wallet.Service.TopUp: begin transaction failed",
			zap.String("user_id", userID),
			zap.Error(err),
		)
		return nil, fmt.Errorf("wallet.TopUp: failed to begin transaction: %w", err)
	}
	defer tx.Rollback(ctx)

	// Lock and retrieve current wallet
	wallet, err := GetWalletByUserIDForUpdateTx(ctx, tx, userID)
	if err != nil {
		logger.Error("wallet.Service.TopUp: get wallet failed",
			zap.String("user_id", userID),
			zap.Error(err),
		)
		return nil, fmt.Errorf("wallet.TopUp: failed to retrieve wallet: %w", err)
	}

	// Calculate new balance
	newBalance := new(big.Float)
	newBalance.Add(wallet.Balance, amount)

	// Update wallet
	updated, err := UpdateWalletBalanceTx(ctx, tx, userID, newBalance)
	if err != nil {
		logger.Error("wallet.Service.TopUp: update balance failed",
			zap.String("user_id", userID),
			zap.Error(err),
		)
		return nil, fmt.Errorf("wallet.TopUp: failed to update balance: %w", err)
	}

	// Commit transaction
	if err := tx.Commit(ctx); err != nil {
		logger.Error("wallet.Service.TopUp: commit transaction failed",
			zap.String("user_id", userID),
			zap.Error(err),
		)
		return nil, fmt.Errorf("wallet.TopUp: failed to commit transaction: %w", err)
	}

	logger.Info("wallet.Service.TopUp: success",
		zap.String("user_id", userID),
		zap.String("amount", FormatAmount(amount)),
		zap.String("new_balance", FormatAmount(updated.Balance)),
	)

	return &TopUpResponse{
		ID:         updated.ID,
		UserID:     updated.UserID,
		NewBalance: FormatAmount(updated.Balance),
		Currency:   updated.Currency,
		Amount:     FormatAmount(amount),
		Message:    "Top-up successful",
	}, nil
}
