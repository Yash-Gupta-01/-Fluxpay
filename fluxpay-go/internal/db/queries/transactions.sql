-- Transactions queries

-- name: CreateTransaction :one
INSERT INTO transactions (sender_id, receiver_id, amount, fee, status, idempotency_key, note)
VALUES ($1, $2, $3, $4, $5, $6, $7)
RETURNING id, sender_id, receiver_id, amount, fee, status, idempotency_key, note, created_at;

-- name: GetTransactionByID :one
SELECT id, sender_id, receiver_id, amount, fee, status, idempotency_key, note, created_at
FROM transactions
WHERE id = $1;

-- name: GetTransactionByIdempotencyKey :one
SELECT id, sender_id, receiver_id, amount, fee, status, idempotency_key, note, created_at
FROM transactions
WHERE idempotency_key = $1;

-- name: UpdateTransactionStatus :one
UPDATE transactions
SET status = $2
WHERE id = $1
RETURNING id, sender_id, receiver_id, amount, fee, status, idempotency_key, note, created_at;

-- name: ListTransactionsBySenderID :many
SELECT id, sender_id, receiver_id, amount, fee, status, idempotency_key, note, created_at
FROM transactions
WHERE sender_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: ListTransactionsByReceiverID :many
SELECT id, sender_id, receiver_id, amount, fee, status, idempotency_key, note, created_at
FROM transactions
WHERE receiver_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: ListTransactionsByUserID :many
SELECT id, sender_id, receiver_id, amount, fee, status, idempotency_key, note, created_at
FROM transactions
WHERE sender_id = $1 OR receiver_id = $1
ORDER BY created_at DESC
LIMIT $2 OFFSET $3;

-- name: CountTransactionsBySenderID :one
SELECT COUNT(*) as count
FROM transactions
WHERE sender_id = $1;

-- name: CountTransactionsByReceiverID :one
SELECT COUNT(*) as count
FROM transactions
WHERE receiver_id = $1;

-- name: CountTransactionsByUserID :one
SELECT COUNT(*) as count
FROM transactions
WHERE sender_id = $1 OR receiver_id = $1;
