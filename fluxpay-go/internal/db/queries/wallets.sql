-- Wallets queries

-- name: CreateWallet :one
INSERT INTO wallets (user_id, balance, currency)
VALUES ($1, $2, $3)
RETURNING id, user_id, balance, currency, updated_at;

-- name: GetWalletByUserID :one
SELECT id, user_id, balance, currency, updated_at
FROM wallets
WHERE user_id = $1;

-- name: GetWalletByUserIDForUpdate :one
SELECT id, user_id, balance, currency, updated_at
FROM wallets
WHERE user_id = $1
FOR UPDATE;

-- name: UpdateWalletBalance :one
UPDATE wallets
SET balance = $2
WHERE user_id = $1
RETURNING id, user_id, balance, currency, updated_at;

-- name: AddToWalletBalance :one
UPDATE wallets
SET balance = balance + $2
WHERE user_id = $1
RETURNING id, user_id, balance, currency, updated_at;

-- name: SubtractFromWalletBalance :one
UPDATE wallets
SET balance = balance - $2
WHERE user_id = $1 AND balance >= $2
RETURNING id, user_id, balance, currency, updated_at;
