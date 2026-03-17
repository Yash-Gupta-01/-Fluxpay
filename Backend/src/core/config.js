require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET || "e2f3b8c9a1d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0";
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const DB_CONFIG = {
    name: process.env.DB_NAME || 'fluxpay',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'root',
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
};

// Redis config — used for balance caching and hot-path read acceleration
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = parseInt(process.env.REDIS_PORT, 10) || 6379;
const REDIS_TTL = parseInt(process.env.REDIS_TTL, 10) || 60; // seconds

// Kafka config — used for async transaction event streaming
const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
const KAFKA_CLIENT_ID = process.env.KAFKA_CLIENT_ID || 'fluxpay-backend';
const KAFKA_GROUP_ID = process.env.KAFKA_GROUP_ID || 'fluxpay-consumers';

module.exports = {
    JWT_SECRET,
    PORT,
    NODE_ENV,
    DB_CONFIG,
    REDIS_HOST,
    REDIS_PORT,
    REDIS_TTL,
    KAFKA_BROKERS,
    KAFKA_CLIENT_ID,
    KAFKA_GROUP_ID,
};
