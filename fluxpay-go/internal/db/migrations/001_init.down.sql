-- Rollback: Remove initial schema

DROP TRIGGER IF EXISTS wallets_updated_at_trigger ON wallets;
DROP FUNCTION IF EXISTS update_wallets_updated_at();

DROP TRIGGER IF EXISTS users_updated_at_trigger ON users;
DROP FUNCTION IF EXISTS update_users_updated_at();

DROP TABLE IF EXISTS refresh_tokens;
DROP TABLE IF EXISTS transactions;
DROP TABLE IF EXISTS wallets;
DROP TABLE IF EXISTS users;

DROP TYPE IF EXISTS transaction_status;

DROP EXTENSION IF EXISTS "pgcrypto";
DROP EXTENSION IF EXISTS "uuid-ossp";
