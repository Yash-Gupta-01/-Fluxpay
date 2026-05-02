package transaction

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	kafkago "github.com/segmentio/kafka-go"
	ktopics "github.com/yourusername/fluxpay-go/internal/kafka"
	"github.com/yourusername/fluxpay-go/pkg/logger"
	"go.uber.org/zap"
)

// TransactionEvent represents a transaction event for Kafka
type TransactionEvent struct {
	TransactionID string `json:"transaction_id"`
	SenderID      string `json:"sender_id"`
	ReceiverID    string `json:"receiver_id"`
	Amount        string `json:"amount"`
	Fee           string `json:"fee"`
	CreatedAt     string `json:"created_at"`
}

// KafkaProducer handles Kafka event production
type KafkaProducer struct {
	writer *kafkago.Writer
}

// NewKafkaProducer creates a new Kafka producer
func NewKafkaProducer(brokers []string) (*KafkaProducer, error) {
	writer := &kafkago.Writer{
		Addr:                   kafkago.TCP(brokers...),
		Topic:                  ktopics.TransactionCompletedTopic,
		RequiredAcks:           kafkago.RequireOne, // Fire and forget
		Compression:            kafkago.Gzip,
		MaxAttempts:            3,
		WriteBackoffMin:        100 * time.Millisecond,
		WriteBackoffMax:        time.Second,
		AllowAutoTopicCreation: true,
	}

	return &KafkaProducer{writer: writer}, nil
}

// ProduceTransactionCompleted publishes a transaction completed event
func (kp *KafkaProducer) ProduceTransactionCompleted(ctx context.Context, event *TransactionEvent) error {
	eventJSON, err := json.Marshal(event)
	if err != nil {
		return fmt.Errorf("kafka.ProduceTransactionCompleted: marshal error: %w", err)
	}

	msg := kafkago.Message{
		Key:   []byte(event.TransactionID),
		Value: eventJSON,
	}

	if err := kp.writer.WriteMessages(ctx, msg); err != nil {
		logger.Error("kafka.ProduceTransactionCompleted: write message failed",
			zap.String("transaction_id", event.TransactionID),
			zap.Error(err),
		)
		return fmt.Errorf("kafka.ProduceTransactionCompleted: write message failed: %w", err)
	}

	logger.Debug("kafka.ProduceTransactionCompleted: event published",
		zap.String("transaction_id", event.TransactionID),
	)

	return nil
}

// Close closes the Kafka writer
func (kp *KafkaProducer) Close() error {
	if kp.writer != nil {
		return kp.writer.Close()
	}
	return nil
}
