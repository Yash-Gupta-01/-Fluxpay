package cache

import (
	"context"
	"encoding/json"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
	"github.com/yourusername/fluxpay-go/pkg/logger"
	"go.uber.org/zap"
)

// IdempotencyCache handles idempotency key caching
type IdempotencyCache struct {
	client *redis.Client
	ttl    time.Duration
}

// CachedResponse represents a cached transaction response
type CachedResponse struct {
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

// NewIdempotencyCache creates a new idempotency cache
func NewIdempotencyCache(client *redis.Client, ttl time.Duration) *IdempotencyCache {
	return &IdempotencyCache{
		client: client,
		ttl:    ttl,
	}
}

// Get retrieves a cached response for an idempotency key
func (ic *IdempotencyCache) Get(ctx context.Context, key string) (*CachedResponse, error) {
	val, err := ic.client.Get(ctx, fmt.Sprintf("idempotency:%s", key)).Result()
	if err == redis.Nil {
		return nil, nil // Key not found
	}
	if err != nil {
		logger.Error("cache.IdempotencyCache.Get: redis error",
			zap.String("key", key),
			zap.Error(err),
		)
		return nil, fmt.Errorf("cache.Get: redis error: %w", err)
	}

	var resp CachedResponse
	if err := json.Unmarshal([]byte(val), &resp); err != nil {
		logger.Error("cache.IdempotencyCache.Get: unmarshal error",
			zap.String("key", key),
			zap.Error(err),
		)
		return nil, fmt.Errorf("cache.Get: unmarshal error: %w", err)
	}

	return &resp, nil
}

// Set caches a response for an idempotency key
func (ic *IdempotencyCache) Set(ctx context.Context, key string, resp *CachedResponse) error {
	data, err := json.Marshal(resp)
	if err != nil {
		return fmt.Errorf("cache.Set: marshal error: %w", err)
	}

	if err := ic.client.Set(ctx, fmt.Sprintf("idempotency:%s", key), data, ic.ttl).Err(); err != nil {
		logger.Error("cache.IdempotencyCache.Set: redis error",
			zap.String("key", key),
			zap.Error(err),
		)
		return fmt.Errorf("cache.Set: redis error: %w", err)
	}

	return nil
}

// Delete removes a cached response
func (ic *IdempotencyCache) Delete(ctx context.Context, key string) error {
	if err := ic.client.Del(ctx, fmt.Sprintf("idempotency:%s", key)).Err(); err != nil {
		return fmt.Errorf("cache.Delete: redis error: %w", err)
	}
	return nil
}

// Analytics counters for transaction metrics
type Analytics struct {
	client *redis.Client
}

// NewAnalytics creates a new analytics service
func NewAnalytics(client *redis.Client) *Analytics {
	return &Analytics{client: client}
}

// IncrementTransactionCount increments the total transaction count
func (a *Analytics) IncrementTransactionCount(ctx context.Context) error {
	if err := a.client.Incr(ctx, "metrics:transaction_count").Err(); err != nil {
		logger.Warn("cache.Analytics.IncrementTransactionCount: redis error", zap.Error(err))
		return nil // Don't fail the main operation
	}
	return nil
}

// IncrementTransactionVolume increments the total transaction volume
func (a *Analytics) IncrementTransactionVolume(ctx context.Context, amount string) error {
	if err := a.client.IncrByFloat(ctx, "metrics:transaction_volume", parseFloat(amount)).Err(); err != nil {
		logger.Warn("cache.Analytics.IncrementTransactionVolume: redis error", zap.Error(err))
		return nil // Don't fail the main operation
	}
	return nil
}

// parseFloat converts string to float64, returning 0 on error
func parseFloat(s string) float64 {
	var f float64
	fmt.Sscanf(s, "%f", &f)
	return f
}
