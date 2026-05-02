package wallet

import (
	"context"
	"fmt"
	"math/big"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Repository handles wallet database operations
type Repository struct {
	db *pgxpool.Pool
}

// NewRepository creates a new wallet repository
func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

// GetWalletByUserID retrieves a wallet without locking
func (r *Repository) GetWalletByUserID(ctx context.Context, userID string) (*Wallet, error) {
	var wallet Wallet
	var balanceStr string

	err := r.db.QueryRow(ctx,
		"SELECT id, user_id, balance, currency FROM wallets WHERE user_id = $1",
		userID,
	).Scan(&wallet.ID, &wallet.UserID, &balanceStr, &wallet.Currency)

	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("wallet.GetWalletByUserID: wallet not found")
	}
	if err != nil {
		return nil, fmt.Errorf("wallet.GetWalletByUserID: query failed: %w", err)
	}

	// Parse balance
	balance, err := ParseAmount(balanceStr)
	if err != nil {
		return nil, fmt.Errorf("wallet.GetWalletByUserID: parse balance: %w", err)
	}
	wallet.Balance = balance

	return &wallet, nil
}

// GetWalletByUserIDForUpdate retrieves a wallet with row-level locking (FOR UPDATE)
func (r *Repository) GetWalletByUserIDForUpdate(ctx context.Context, userID string) (*Wallet, error) {
	var wallet Wallet
	var balanceStr string

	err := r.db.QueryRow(ctx,
		"SELECT id, user_id, balance, currency FROM wallets WHERE user_id = $1 FOR UPDATE",
		userID,
	).Scan(&wallet.ID, &wallet.UserID, &balanceStr, &wallet.Currency)

	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("wallet.GetWalletByUserIDForUpdate: wallet not found")
	}
	if err != nil {
		return nil, fmt.Errorf("wallet.GetWalletByUserIDForUpdate: query failed: %w", err)
	}

	// Parse balance
	balance, err := ParseAmount(balanceStr)
	if err != nil {
		return nil, fmt.Errorf("wallet.GetWalletByUserIDForUpdate: parse balance: %w", err)
	}
	wallet.Balance = balance

	return &wallet, nil
}

// UpdateWalletBalance updates a wallet's balance (requires transaction context)
func (r *Repository) UpdateWalletBalance(ctx context.Context, userID string, newBalance *big.Float) (*Wallet, error) {
	balanceStr := FormatAmount(newBalance)

	var wallet Wallet
	err := r.db.QueryRow(ctx,
		"UPDATE wallets SET balance = $1 WHERE user_id = $2 RETURNING id, user_id, balance, currency",
		balanceStr, userID,
	).Scan(&wallet.ID, &wallet.UserID, &balanceStr, &wallet.Currency)

	if err != nil {
		return nil, fmt.Errorf("wallet.UpdateWalletBalance: update failed: %w", err)
	}

	wallet.Balance, _ = ParseAmount(balanceStr)
	return &wallet, nil
}

// BeginTx begins a new transaction
func (r *Repository) BeginTx(ctx context.Context) (pgx.Tx, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("wallet.BeginTx: begin failed: %w", err)
	}
	return tx, nil
}

// GetWalletByUserIDForUpdateTx retrieves wallet with lock within a transaction
func GetWalletByUserIDForUpdateTx(ctx context.Context, tx pgx.Tx, userID string) (*Wallet, error) {
	var wallet Wallet
	var balanceStr string

	err := tx.QueryRow(ctx,
		"SELECT id, user_id, balance, currency FROM wallets WHERE user_id = $1 FOR UPDATE",
		userID,
	).Scan(&wallet.ID, &wallet.UserID, &balanceStr, &wallet.Currency)

	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("wallet.GetWalletByUserIDForUpdateTx: wallet not found")
	}
	if err != nil {
		return nil, fmt.Errorf("wallet.GetWalletByUserIDForUpdateTx: query failed: %w", err)
	}

	balance, err := ParseAmount(balanceStr)
	if err != nil {
		return nil, fmt.Errorf("wallet.GetWalletByUserIDForUpdateTx: parse balance: %w", err)
	}
	wallet.Balance = balance

	return &wallet, nil
}

// UpdateWalletBalanceTx updates wallet balance within a transaction
func UpdateWalletBalanceTx(ctx context.Context, tx pgx.Tx, userID string, newBalance *big.Float) (*Wallet, error) {
	balanceStr := FormatAmount(newBalance)

	var wallet Wallet
	err := tx.QueryRow(ctx,
		"UPDATE wallets SET balance = $1 WHERE user_id = $2 RETURNING id, user_id, balance, currency",
		balanceStr, userID,
	).Scan(&wallet.ID, &wallet.UserID, &balanceStr, &wallet.Currency)

	if err != nil {
		return nil, fmt.Errorf("wallet.UpdateWalletBalanceTx: update failed: %w", err)
	}

	wallet.Balance, _ = ParseAmount(balanceStr)
	return &wallet, nil
}
