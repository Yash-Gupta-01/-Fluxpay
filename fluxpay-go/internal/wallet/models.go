package wallet

import (
	"fmt"
	"math/big"
)

// Wallet represents a user's wallet
type Wallet struct {
	ID        string
	UserID    string
	Balance   *big.Float
	Currency  string
}

// GetWalletRequest is the request for getting wallet info
type GetWalletRequest struct {
	// Empty - uses authenticated user context
}

// GetWalletResponse represents the wallet information
type GetWalletResponse struct {
	ID       string `json:"id"`
	UserID   string `json:"user_id"`
	Balance  string `json:"balance"`
	Currency string `json:"currency"`
}

// TopUpRequest represents a top-up request
type TopUpRequest struct {
	Amount   string `json:"amount" validate:"required"`
	Currency string `json:"currency" validate:"required,len=3"`
}

// TopUpResponse represents the top-up response
type TopUpResponse struct {
	ID           string `json:"id"`
	UserID       string `json:"user_id"`
	NewBalance   string `json:"new_balance"`
	Currency     string `json:"currency"`
	Amount       string `json:"amount"`
	Message      string `json:"message"`
}

// ParseAmount parses a string amount to big.Float
func ParseAmount(amount string) (*big.Float, error) {
	bf := new(big.Float)
	bf.SetPrec(256) // 256-bit precision for financial calculations

	_, ok := bf.SetString(amount)
	if !ok {
		return nil, fmt.Errorf("wallet: invalid amount format")
	}

	// Check if amount is non-negative
	if bf.Cmp(big.NewFloat(0)) < 0 {
		return nil, fmt.Errorf("wallet: amount must be non-negative")
	}

	return bf, nil
}

// FormatAmount formats big.Float to string with 2 decimal places
func FormatAmount(bf *big.Float) string {
	return fmt.Sprintf("%.2f", bf)
}
