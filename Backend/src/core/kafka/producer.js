/**
 * Kafka producer — publishes transaction domain events to the
 * `fluxpay.transactions` topic.  Downstream consumers can use these
 * events for fraud detection, analytics, and audit pipelines.
 *
 * Fails gracefully: if the Kafka broker is unreachable the transaction
 * still completes and the app logs a warning.
 */
const { Kafka, CompressionTypes, Partitioners, logLevel } = require('kafkajs');
const { KAFKA_BROKERS, KAFKA_CLIENT_ID } = require('../config');

const kafka = new Kafka({
    clientId: KAFKA_CLIENT_ID,
    brokers: KAFKA_BROKERS,
    logLevel: logLevel.WARN,
    retry: { retries: 3 },
});

const producer = kafka.producer({
    allowAutoTopicCreation: true,
    compression: CompressionTypes.GZIP,
    createPartitioner: Partitioners.LegacyPartitioner,
});

let connected = false;
const NOTIFICATIONS_TOPIC_PREFIX = 'fluxpay.notifications';

const sanitizeVpaForTopic = (vpa) => {
    if (!vpa) return 'unknown';
    return vpa.toString().toLowerCase().replace(/[^a-z0-9._-]/g, '_');
};

const notificationTopicForVpa = (vpa) => `${NOTIFICATIONS_TOPIC_PREFIX}.${sanitizeVpaForTopic(vpa)}`;

const connectProducer = async () => {
    if (connected) return;
    try {
        await producer.connect();
        connected = true;
        console.log('[Kafka] Producer connected');
    } catch (err) {
        console.warn('[Kafka] Producer connection failed (running without Kafka):', err.message);
    }
};

/**
 * Publish a transaction event.
 * @param {'completed'|'failed'|'pending'} status
 */
const publishTransactionEvent = async ({
    transactionId,
    senderId,
    receiverId,
    amount,
    status,
    timestamp = new Date().toISOString(),
}) => {
    if (!connected) return;
    try {
        await producer.send({
            topic: 'fluxpay.transactions',
            messages: [
                {
                    key: transactionId,
                    value: JSON.stringify({ transactionId, senderId, receiverId, amount, status, timestamp }),
                    headers: { source: 'fluxpay-backend' },
                },
            ],
        });
    } catch (err) {
        console.warn('[Kafka] Failed to publish transaction event:', err.message);
    }
};

/**
 * Publish a notification event to a VPA-scoped topic.
 * @param {string} vpa
 */
const publishNotificationEvent = async ({
    vpa,
    userId,
    notificationId,
    transactionId,
    message,
    type,
    timestamp = new Date().toISOString(),
    createdAt,
}) => {
    if (!connected) return;
    try {
        await producer.send({
            topic: notificationTopicForVpa(vpa),
            messages: [
                {
                    key: notificationId ? notificationId.toString() : `${userId || 'unknown'}-${Date.now()}`,
                    value: JSON.stringify({
                        vpa,
                        userId,
                        notificationId,
                        transactionId,
                        message,
                        type,
                        timestamp,
                        createdAt,
                    }),
                    headers: { source: 'fluxpay-backend' },
                },
            ],
        });
    } catch (err) {
        console.warn('[Kafka] Failed to publish notification event:', err.message);
    }
};

const disconnectProducer = async () => {
    if (!connected) return;
    await producer.disconnect();
    connected = false;
};

module.exports = {
    connectProducer,
    publishTransactionEvent,
    publishNotificationEvent,
    disconnectProducer,
    notificationTopicForVpa,
};
