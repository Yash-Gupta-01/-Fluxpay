package transaction

import (
	"context"
	"fmt"
	"math/big"

	"github.com/yourusername/fluxpay-go/internal/cache"
	"github.com/yourusername/fluxpay-go/internal/wallet"
	"github.com/yourusername/fluxpay-go/pkg/logger"
	"go.uber.org/zap"
)

// Service handles transaction business logic
type Service struct {
	repo             *Repository
	walletRepo       *wallet.Repository
	idempotencyCache *cache.IdempotencyCache
	analytics        *cache.Analytics
	kafkaProducer    *KafkaProducer
}

// NewService creates a new transaction service
func NewService(
	repo *Repository,
	walletRepo *wallet.Repository,
	idempotencyCache *cache.IdempotencyCache,
	analytics *cache.Analytics,
	kafkaProducer *KafkaProducer,
) *Service {
	return &Service{
		repo:             repo,
		walletRepo:       walletRepo,
		idempotencyCache: idempotencyCache,
		analytics:        analytics,
		kafkaProducer:    kafkaProducer,
	}
}

// Transfer performs a money transfer between two users
func (s *Service) Transfer(ctx context.Context, senderID string, req TransferRequest) (*TransferResponse, error) {
	// Validate request
	if senderID == req.ReceiverID {
		return nil, fmt.Errorf("transaction.Transfer: cannot transfer to self")
	}

	if req.Currency != "USD" {
		return nil, fmt.Errorf("transaction.Transfer: only USD supported")
	}

	// Parse amount
	amount, err := ParseAmount(req.Amount)
	if err != nil {
		logger.Warn("transaction.Service.Transfer: invalid amount",
			zap.String("sender_id", senderID),
			zap.String("amount", req.Amount),
			zap.Error(err),
		)
		return nil, fmt.Errorf("transaction.Transfer: invalid amount: %w", err)
	}

	// Check idempotency - return cached response if exists
	cachedResp, err := s.idempotencyCache.Get(ctx, req.IdempotencyKey)
	if err == nil && cachedResp != nil {
		logger.Info("transaction.Service.Transfer: idempotency cache hit",
			zap.String("sender_id", senderID),
			zap.String("idempotency_key", req.IdempotencyKey),
		)
		return &TransferResponse{
			TransactionID: cachedResp.TransactionID,
			SenderID:      cachedResp.SenderID,
			ReceiverID:    cachedResp.ReceiverID,
			Amount:        cachedResp.Amount,
			Fee:           cachedResp.Fee,
			Total:         cachedResp.Total,
			Status:        cachedResp.Status,
			CreatedAt:     cachedResp.CreatedAt,
			Message:       cachedResp.Message,
		}, nil
	}

	// Calculate fee
	fee := CalculateFee(amount)
	totalDebit := new(big.Float).Add(amount, fee)

	// Begin transaction
	tx, err := s.repo.BeginTx(ctx)
	if err != nil {
		logger.Error("transaction.Service.Transfer: begin transaction failed",
			zap.String("sender_id", senderID),
			zap.Error(err),
		)
		return nil, fmt.Errorf("transaction.Transfer: begin transaction failed: %w", err)
	}
	defer tx.Rollback(ctx)

	// Lock sender's wallet
	senderWallet, err := wallet.GetWalletByUserIDForUpdateTx(ctx, tx, senderID)
	if err != nil {
		logger.Error("transaction.Service.Transfer: get sender wallet failed",
			zap.String("sender_id", senderID),
			zap.Error(err),
		)
		return nil, fmt.Errorf("transaction.Transfer: sender wallet not found: %w", err)
	}

	// Check sufficient balance
	if senderWallet.Balance.Cmp(totalDebit) < 0 {
		logger.Warn("transaction.Service.Transfer: insufficient balance",
			zap.String("sender_id", senderID),
			zap.String("balance", FormatAmount(senderWallet.Balance)),
			zap.String("required", FormatAmount(totalDebit)),
		)
		return nil, fmt.Errorf("transaction.Transfer: insufficient balance")
	}

	// Check receiver exists and lock receiver's wallet
	receiverWallet, err := wallet.GetWalletByUserIDForUpdateTx(ctx, tx, req.ReceiverID)
	if err != nil {
		logger.Error("transaction.Service.Transfer: get receiver wallet failed",
			zap.String("receiver_id", req.ReceiverID),
			zap.Error(err),
		)
		return nil, fmt.Errorf("transaction.Transfer: receiver not found: %w", err)
	}

	// Deduct from sender
	newSenderBalance := new(big.Float).Sub(senderWallet.Balance, totalDebit)
	_, err = wallet.UpdateWalletBalanceTx(ctx, tx, senderID, newSenderBalance)
	if err != nil {
		logger.Error("transaction.Service.Transfer: update sender balance failed",
			zap.String("sender_id", senderID),
			zap.Error(err),
		)
		return nil, fmt.Errorf("transaction.Transfer: update sender balance failed: %w", err)
	}

	// Credit to receiver
	newReceiverBalance := new(big.Float).Add(receiverWallet.Balance, amount)
	_, err = wallet.UpdateWalletBalanceTx(ctx, tx, req.ReceiverID, newReceiverBalance)
	if err != nil {
		logger.Error("transaction.Service.Transfer: update receiver balance failed",
			zap.String("receiver_id", req.ReceiverID),
			zap.Error(err),
		)
		return nil, fmt.Errorf("transaction.Transfer: update receiver balance failed: %w", err)
	}

	// Create transaction record
	txnRecord, err := s.repo.CreateTransaction(ctx, tx, senderID, req.ReceiverID, amount, fee, TransactionStatusCompleted, req.IdempotencyKey, req.Note)
	if err != nil {
		logger.Error("transaction.Service.Transfer: create transaction record failed",
			zap.String("sender_id", senderID),
			zap.Error(err),
		)
		return nil, fmt.Errorf("transaction.Transfer: create transaction failed: %w", err)
	}

	// Commit transaction
	if err := tx.Commit(ctx); err != nil {
		logger.Error("transaction.Service.Transfer: commit transaction failed",
			zap.String("sender_id", senderID),
			zap.Error(err),
		)
		return nil, fmt.Errorf("transaction.Transfer: commit failed: %w", err)
	}

	// Build response
	resp := &TransferResponse{
		TransactionID: txnRecord.ID,
		SenderID:      txnRecord.SenderID,
		ReceiverID:    txnRecord.ReceiverID,
		Amount:        FormatAmount(txnRecord.Amount),
		Fee:           FormatAmount(txnRecord.Fee),
		Total:         FormatAmount(totalDebit),
		Status:        string(txnRecord.Status),
		CreatedAt:     txnRecord.CreatedAt.Format("2006-01-02T15:04:05Z"),
		Message:       "Transfer completed successfully",
	}

	// Cache response for idempotency
	_ = s.idempotencyCache.Set(ctx, req.IdempotencyKey, &cache.CachedResponse{
		TransactionID: resp.TransactionID,
		SenderID:      resp.SenderID,
		ReceiverID:    resp.ReceiverID,
		Amount:        resp.Amount,
		Fee:           resp.Fee,
		Total:         resp.Total,
		Status:        resp.Status,
		CreatedAt:     resp.CreatedAt,
		Message:       resp.Message,
	})

	// Emit Kafka event asynchronously (fire-and-forget)
	go func() {
		if err := s.kafkaProducer.ProduceTransactionCompleted(context.Background(), &TransactionEvent{
			TransactionID: txnRecord.ID,
			SenderID:      txnRecord.SenderID,
			ReceiverID:    txnRecord.ReceiverID,
			Amount:        FormatAmount(txnRecord.Amount),
			Fee:           FormatAmount(txnRecord.Fee),
			CreatedAt:     txnRecord.CreatedAt.Format("2006-01-02T15:04:05Z"),
		}); err != nil {
			logger.Error("transaction.Service.Transfer: produce kafka event failed",
				zap.String("transaction_id", txnRecord.ID),
				zap.Error(err),
			)
		}
	}()

	// Increment analytics
	_ = s.analytics.IncrementTransactionCount(ctx)
	_ = s.analytics.IncrementTransactionVolume(ctx, resp.Amount)

	logger.Info("transaction.Service.Transfer: success",
		zap.String("transaction_id", txnRecord.ID),
		zap.String("sender_id", senderID),
		zap.String("receiver_id", req.ReceiverID),
		zap.String("amount", FormatAmount(amount)),
	)

	return resp, nil
}

// GetTransaction retrieves a transaction by ID
func (s *Service) GetTransaction(ctx context.Context, userID, txnID string) (*TransactionDetail, error) {
	txn, err := s.repo.GetTransactionByID(ctx, txnID)
	if err != nil {
		logger.Warn("transaction.Service.GetTransaction: transaction not found",
			zap.String("user_id", userID),
			zap.String("transaction_id", txnID),
			zap.Error(err),
		)
		return nil, fmt.Errorf("transaction.GetTransaction: not found")
	}

	// Check if user is involved in the transaction
	if txn.SenderID != userID && txn.ReceiverID != userID {
		logger.Warn("transaction.Service.GetTransaction: unauthorized",
			zap.String("user_id", userID),
			zap.String("transaction_id", txnID),
		)
		return nil, fmt.Errorf("transaction.GetTransaction: unauthorized")
	}

	return &TransactionDetail{
		ID:         txn.ID,
		SenderID:   txn.SenderID,
		ReceiverID: txn.ReceiverID,
		Amount:     FormatAmount(txn.Amount),
		Fee:        FormatAmount(txn.Fee),
		Status:     string(txn.Status),
		Note:       txn.Note,
		CreatedAt:  txn.CreatedAt.Format("2006-01-02T15:04:05Z"),
	}, nil
}

// ListTransactions retrieves paginated transactions for a user
func (s *Service) ListTransactions(ctx context.Context, userID string, limit, offset int) (*TransactionListResponse, error) {
	// Fetch limit+1 to determine if there are more results
	txns, err := s.repo.ListTransactionsByUserID(ctx, userID, limit+1, offset)
	if err != nil {
		logger.Error("transaction.Service.ListTransactions: query failed",
			zap.String("user_id", userID),
			zap.Error(err),
		)
		return nil, fmt.Errorf("transaction.ListTransactions: query failed: %w", err)
	}

	hasMore := len(txns) > limit
	if hasMore {
		txns = txns[:limit]
	}

	details := make([]TransactionDetail, 0, len(txns))
	for _, txn := range txns {
		details = append(details, TransactionDetail{
			ID:         txn.ID,
			SenderID:   txn.SenderID,
			ReceiverID: txn.ReceiverID,
			Amount:     FormatAmount(txn.Amount),
			Fee:        FormatAmount(txn.Fee),
			Status:     string(txn.Status),
			Note:       txn.Note,
			CreatedAt:  txn.CreatedAt.Format("2006-01-02T15:04:05Z"),
		})
	}

	var cursor *string
	if hasMore && len(txns) > 0 {
		lastTxn := txns[len(txns)-1]
		cursor = &lastTxn.ID
	}

	return &TransactionListResponse{
		Transactions: details,
		HasMore:      hasMore,
		Cursor:       cursor,
	}, nil
}
