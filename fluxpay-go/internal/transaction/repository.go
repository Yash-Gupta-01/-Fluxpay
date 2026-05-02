package transaction

import (
	"context"
	"fmt"
	"math/big"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
)

// Repository handles transaction database operations
type Repository struct {
	db *pgxpool.Pool
}

// NewRepository creates a new transaction repository
func NewRepository(db *pgxpool.Pool) *Repository {
	return &Repository{db: db}
}

// CreateTransaction creates a new transaction record
func (r *Repository) CreateTransaction(ctx context.Context, tx pgx.Tx, senderID, receiverID string, amount, fee *big.Float, status TransactionStatus, idempotencyKey string, note *string) (*Transaction, error) {
	amountStr := FormatAmount(amount)
	feeStr := FormatAmount(fee)

	var txn Transaction
	var balanceStr string
	err := tx.QueryRow(ctx,
		`INSERT INTO transactions (sender_id, receiver_id, amount, fee, status, idempotency_key, note)
		 VALUES ($1, $2, $3, $4, $5, $6, $7)
		 RETURNING id, sender_id, receiver_id, amount, fee, status, idempotency_key, note, created_at`,
		senderID, receiverID, amountStr, feeStr, status, idempotencyKey, note,
	).Scan(&txn.ID, &txn.SenderID, &txn.ReceiverID, &balanceStr, &feeStr, &txn.Status, &txn.IdempotencyKey, &txn.Note, &txn.CreatedAt)

	if err != nil {
		return nil, fmt.Errorf("transaction.CreateTransaction: insert failed: %w", err)
	}

	txn.Amount, _ = ParseAmount(balanceStr)
	txn.Fee, _ = ParseAmount(feeStr)

	return &txn, nil
}

// GetTransactionByID retrieves a transaction by ID
func (r *Repository) GetTransactionByID(ctx context.Context, txnID string) (*Transaction, error) {
	var txn Transaction
	var amountStr, feeStr string

	err := r.db.QueryRow(ctx,
		`SELECT id, sender_id, receiver_id, amount, fee, status, idempotency_key, note, created_at
		 FROM transactions WHERE id = $1`,
		txnID,
	).Scan(&txn.ID, &txn.SenderID, &txn.ReceiverID, &amountStr, &feeStr, &txn.Status, &txn.IdempotencyKey, &txn.Note, &txn.CreatedAt)

	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("transaction.GetTransactionByID: not found")
	}
	if err != nil {
		return nil, fmt.Errorf("transaction.GetTransactionByID: query failed: %w", err)
	}

	txn.Amount, _ = ParseAmount(amountStr)
	txn.Fee, _ = ParseAmount(feeStr)

	return &txn, nil
}

// GetTransactionByIdempotencyKey retrieves a transaction by idempotency key
func (r *Repository) GetTransactionByIdempotencyKey(ctx context.Context, key string) (*Transaction, error) {
	var txn Transaction
	var amountStr, feeStr string

	err := r.db.QueryRow(ctx,
		`SELECT id, sender_id, receiver_id, amount, fee, status, idempotency_key, note, created_at
		 FROM transactions WHERE idempotency_key = $1`,
		key,
	).Scan(&txn.ID, &txn.SenderID, &txn.ReceiverID, &amountStr, &feeStr, &txn.Status, &txn.IdempotencyKey, &txn.Note, &txn.CreatedAt)

	if err == pgx.ErrNoRows {
		return nil, fmt.Errorf("transaction.GetTransactionByIdempotencyKey: not found")
	}
	if err != nil {
		return nil, fmt.Errorf("transaction.GetTransactionByIdempotencyKey: query failed: %w", err)
	}

	txn.Amount, _ = ParseAmount(amountStr)
	txn.Fee, _ = ParseAmount(feeStr)

	return &txn, nil
}

// ListTransactionsByUserID retrieves user's transactions with pagination
func (r *Repository) ListTransactionsByUserID(ctx context.Context, userID string, limit int, offset int) ([]Transaction, error) {
	rows, err := r.db.Query(ctx,
		`SELECT id, sender_id, receiver_id, amount, fee, status, idempotency_key, note, created_at
		 FROM transactions
		 WHERE sender_id = $1 OR receiver_id = $1
		 ORDER BY created_at DESC
		 LIMIT $2 OFFSET $3`,
		userID, limit, offset,
	)
	if err != nil {
		return nil, fmt.Errorf("transaction.ListTransactionsByUserID: query failed: %w", err)
	}
	defer rows.Close()

	var txns []Transaction
	for rows.Next() {
		var txn Transaction
		var amountStr, feeStr string

		if err := rows.Scan(&txn.ID, &txn.SenderID, &txn.ReceiverID, &amountStr, &feeStr, &txn.Status, &txn.IdempotencyKey, &txn.Note, &txn.CreatedAt); err != nil {
			return nil, fmt.Errorf("transaction.ListTransactionsByUserID: scan failed: %w", err)
		}

		txn.Amount, _ = ParseAmount(amountStr)
		txn.Fee, _ = ParseAmount(feeStr)
		txns = append(txns, txn)
	}

	if err := rows.Err(); err != nil {
		return nil, fmt.Errorf("transaction.ListTransactionsByUserID: rows error: %w", err)
	}

	return txns, nil
}

// UpdateTransactionStatus updates a transaction's status
func (r *Repository) UpdateTransactionStatus(ctx context.Context, txnID string, status TransactionStatus) error {
	commandTag, err := r.db.Exec(ctx,
		"UPDATE transactions SET status = $1 WHERE id = $2",
		status, txnID,
	)
	if err != nil {
		return fmt.Errorf("transaction.UpdateTransactionStatus: update failed: %w", err)
	}

	if commandTag.RowsAffected() == 0 {
		return fmt.Errorf("transaction.UpdateTransactionStatus: no rows affected")
	}

	return nil
}

// BeginTx begins a new transaction
func (r *Repository) BeginTx(ctx context.Context) (pgx.Tx, error) {
	tx, err := r.db.Begin(ctx)
	if err != nil {
		return nil, fmt.Errorf("transaction.BeginTx: begin failed: %w", err)
	}
	return tx, nil
}
