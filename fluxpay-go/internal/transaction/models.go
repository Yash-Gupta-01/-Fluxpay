package transaction

import (
	"fmt"
	"math/big"
	"time"
)

// TransactionStatus represents the status of a transaction
type TransactionStatus string

const (
	TransactionStatusPending   TransactionStatus = "pending"
	TransactionStatusCompleted TransactionStatus = "completed"
	TransactionStatusFailed    TransactionStatus = "failed"
)

// Transaction represents a transaction between two users
type Transaction struct {
	ID             string
	SenderID       string
	ReceiverID     string
	Amount         *big.Float
	Fee            *big.Float
	Status         TransactionStatus
	IdempotencyKey string
	Note           *string
	CreatedAt      time.Time
}

// TransferRequest represents a transfer request
type TransferRequest struct {
	ReceiverID     string  `json:"receiver_id" validate:"required"`
	Amount         string  `json:"amount" validate:"required"`
	Currency       string  `json:"currency" validate:"required,len=3"`
	Note           *string `json:"note" validate:"omitempty,max=500"`
	IdempotencyKey string  `json:"idempotency_key" validate:"required,min=10,max=255"`
}

// TransferResponse represents the transfer response
type TransferResponse struct {
	TransactionID string `json:"transaction_id"`
	SenderID      string `json:"sender_id"`
	ReceiverID    string `json:"receiver_id"`
	Amount        string `json:"amount"`
	Fee           string `json:"fee"`
	Total         string `json:"total"`
	Status        string `json:"status"`
	CreatedAt     string `json:"created_at"`
	Message       string `json:"message"`
}

// TransactionDetail represents detailed transaction information
type TransactionDetail struct {
	ID         string  `json:"id"`
	SenderID   string  `json:"sender_id"`
	ReceiverID string  `json:"receiver_id"`
	Amount     string  `json:"amount"`
	Fee        string  `json:"fee"`
	Status     string  `json:"status"`
	Note       *string `json:"note,omitempty"`
	CreatedAt  string  `json:"created_at"`
}

// TransactionListResponse represents paginated transaction list
type TransactionListResponse struct {
	Transactions []TransactionDetail `json:"transactions"`
	HasMore      bool                `json:"has_more"`
	Cursor       *string             `json:"cursor,omitempty"`
}

// FeeCalculation calculates the transaction fee (0.5% minimum $0.10)
func CalculateFee(amount *big.Float) *big.Float {
	fee := new(big.Float)
	fee.Mul(amount, big.NewFloat(0.005)) // 0.5%

	minFee := big.NewFloat(0.10)
	if fee.Cmp(minFee) < 0 {
		return minFee
	}

	return fee
}

// FormatAmount formats big.Float to string with 2 decimal places
func FormatAmount(bf *big.Float) string {
	return bf.Text('f', 2)
}

// ParseAmount parses a string amount to big.Float
func ParseAmount(amount string) (*big.Float, error) {
	bf := new(big.Float)
	bf.SetPrec(256)

	_, ok := bf.SetString(amount)
	if !ok {
		return nil, fmt.Errorf("transaction: invalid amount format")
	}

	if bf.Cmp(big.NewFloat(0)) <= 0 {
		return nil, fmt.Errorf("transaction: amount must be positive")
	}

	return bf, nil
}
