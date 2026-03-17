/**
 * Redis cache client — provides read-through caching for hot-path data
 * (account balances, user sessions). Fails gracefully: if Redis is
 * unavailable the app continues operating against the primary DB.
 */
const Redis = require('ioredis');
const { REDIS_HOST, REDIS_PORT } = require('../config');

let client = null;

const getRedisClient = () => {
    if (client) return client;

    client = new Redis({
        host: REDIS_HOST,
        port: REDIS_PORT,
        lazyConnect: true,
        enableOfflineQueue: false,
        retryStrategy: (times) => {
            if (times > 3) return null; // stop retrying after 3 attempts
            return Math.min(times * 300, 2000);
        },
    });

    client.on('connect', () => console.log('[Redis] Connected'));
    client.on('error', (err) => console.warn('[Redis] Error:', err.message));

    client.connect().catch((err) =>
        console.warn('[Redis] Could not connect:', err.message)
    );

    return client;
};

/**
 * Get a cached JSON value. Returns null on miss or error.
 */
const cacheGet = async (key) => {
    try {
        const val = await getRedisClient().get(key);
        return val ? JSON.parse(val) : null;
    } catch {
        return null;
    }
};

/**
 * Set a JSON value with an optional TTL (seconds, default 60).
 */
const cacheSet = async (key, value, ttlSeconds = 60) => {
    try {
        await getRedisClient().set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch {
        // fail silently — cache is non-critical
    }
};

/**
 * Invalidate a cache key.
 */
const cacheDel = async (key) => {
    try {
        await getRedisClient().del(key);
    } catch {
        // fail silently
    }
};

/** Cache key helpers */
const keys = {
    balance: (userId) => `balance:${userId}`,
    userProfile: (userId) => `user:${userId}`,
};

module.exports = { getRedisClient, cacheGet, cacheSet, cacheDel, keys };
