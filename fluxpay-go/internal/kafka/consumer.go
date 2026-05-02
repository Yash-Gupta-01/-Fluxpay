package kafka

import (
	"context"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	"github.com/segmentio/kafka-go"
	"github.com/yourusername/fluxpay-go/internal/cache"
	"github.com/yourusername/fluxpay-go/pkg/logger"
	"go.uber.org/zap"
)

// TransactionCompletedEvent represents a transaction completed event from Kafka
type TransactionCompletedEvent struct {
	TransactionID string `json:"transaction_id"`
	SenderID      string `json:"sender_id"`
	ReceiverID    string `json:"receiver_id"`
	Amount        string `json:"amount"`
	Fee           string `json:"fee"`
	CreatedAt     string `json:"created_at"`
}

// Consumer handles Kafka message consumption
type Consumer struct {
	reader    *kafka.Reader
	analytics *cache.Analytics
	wg        sync.WaitGroup
	done      chan struct{}
}

// NewConsumer creates a new Kafka consumer
func NewConsumer(brokers []string, groupID string, analytics *cache.Analytics) (*Consumer, error) {
	reader := kafka.NewReader(kafka.ReaderConfig{
		Brokers:          brokers,
		Topic:            TransactionCompletedTopic,
		GroupID:          groupID,
		StartOffset:      kafka.LastOffset,
		CommitInterval:   time.Second,
		SessionTimeout:   10 * time.Second,
		RebalanceTimeout: 60 * time.Second,
		MaxBytes:         10e6, // 10MB
	})

	return &Consumer{
		reader:    reader,
		analytics: analytics,
		done:      make(chan struct{}),
	}, nil
}

// Start starts consuming messages from Kafka
func (c *Consumer) Start(ctx context.Context) {
	c.wg.Add(1)
	go func() {
		defer c.wg.Done()
		c.consume(ctx)
	}()

	logger.Info("kafka.Consumer.Start: consumer started",
		zap.String("topic", TransactionCompletedTopic),
	)
}

// consume reads messages from Kafka and processes them
func (c *Consumer) consume(ctx context.Context) {
	for {
		select {
		case <-c.done:
			logger.Info("kafka.Consumer.consume: shutting down consumer")
			return
		default:
		}

		// Set a read deadline to avoid blocking forever
		msg, err := c.reader.FetchMessage(ctx)
		if err != nil {
			if err == context.Canceled {
				logger.Info("kafka.Consumer.consume: context canceled")
				return
			}
			logger.Error("kafka.Consumer.consume: fetch message error",
				zap.Error(err),
			)
			continue
		}

		// Process message
		if err := c.processMessage(ctx, msg); err != nil {
			logger.Error("kafka.Consumer.consume: process message error",
				zap.String("key", string(msg.Key)),
				zap.Error(err),
			)
			// Log error but continue processing
			continue
		}

		// Commit offset
		if err := c.reader.CommitMessages(ctx, msg); err != nil {
			logger.Error("kafka.Consumer.consume: commit message error",
				zap.String("key", string(msg.Key)),
				zap.Error(err),
			)
			// Continue anyway - next consumer will reprocess
		}
	}
}

// processMessage processes a single Kafka message
func (c *Consumer) processMessage(ctx context.Context, msg kafka.Message) error {
	var event TransactionCompletedEvent

	// Unmarshal message
	if err := json.Unmarshal(msg.Value, &event); err != nil {
		return fmt.Errorf("kafka.processMessage: unmarshal error: %w", err)
	}

	// Log transaction summary
	logger.Info("kafka.Consumer.processMessage: transaction completed",
		zap.String("transaction_id", event.TransactionID),
		zap.String("sender_id", event.SenderID),
		zap.String("receiver_id", event.ReceiverID),
		zap.String("amount", event.Amount),
		zap.String("fee", event.Fee),
	)

	// Update analytics
	if err := c.analytics.IncrementTransactionCount(ctx); err != nil {
		logger.Warn("kafka.processMessage: increment count error", zap.Error(err))
	}

	if err := c.analytics.IncrementTransactionVolume(ctx, event.Amount); err != nil {
		logger.Warn("kafka.processMessage: increment volume error", zap.Error(err))
	}

	return nil
}

// Shutdown gracefully stops the consumer
func (c *Consumer) Shutdown(ctx context.Context) error {
	close(c.done)

	// Wait for consumer goroutine to finish
	done := make(chan struct{})
	go func() {
		c.wg.Wait()
		close(done)
	}()

	// Wait with timeout
	select {
	case <-done:
		logger.Info("kafka.Consumer.Shutdown: consumer shutdown complete")
	case <-ctx.Done():
		logger.Warn("kafka.Consumer.Shutdown: shutdown timeout exceeded")
		return fmt.Errorf("kafka.Consumer.Shutdown: timeout")
	}

	// Close reader
	if err := c.reader.Close(); err != nil {
		logger.Error("kafka.Consumer.Shutdown: close reader error", zap.Error(err))
		return fmt.Errorf("kafka.Consumer.Shutdown: close reader error: %w", err)
	}

	return nil
}
