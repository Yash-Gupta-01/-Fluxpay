/**
 * Kafka notifications consumer — subscribes to per-VPA notification topics
 * and streams them to connected SSE clients.
 */
const { Kafka, logLevel } = require('kafkajs');
const { KAFKA_BROKERS, KAFKA_CLIENT_ID, KAFKA_GROUP_ID } = require('../config');
const { emitNotificationByVpa } = require('../sse');

const kafka = new Kafka({
    clientId: `${KAFKA_CLIENT_ID}-notifications`,
    brokers: KAFKA_BROKERS,
    logLevel: logLevel.WARN,
    retry: { retries: 3 },
});

const consumer = kafka.consumer({ groupId: `${KAFKA_GROUP_ID}-notifications` });

const TOPIC_PREFIX = 'fluxpay.notifications.';
const TOPIC_REGEX = /^fluxpay\.notifications\./;

const parseVpaFromTopic = (topic) => {
    if (!topic || !topic.startsWith(TOPIC_PREFIX)) return null;
    return topic.slice(TOPIC_PREFIX.length);
};

const startNotificationConsumer = async () => {
    try {
        await consumer.connect();
        await consumer.subscribe({ topic: TOPIC_REGEX, fromBeginning: false });

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                let event;
                try {
                    event = JSON.parse(message.value.toString());
                } catch (err) {
                    console.warn('[Kafka][Notifications] Invalid message payload:', err.message);
                    return;
                }

                const vpa = event.vpa || parseVpaFromTopic(topic);
                if (!vpa) return;

                emitNotificationByVpa(vpa, {
                    id: event.notificationId,
                    message: event.message,
                    type: event.type,
                    transactionId: event.transactionId,
                    read: false,
                    createdAt: event.createdAt || event.timestamp,
                });

                const offset = message.offset;
                console.log(`[Kafka][${topic}][p${partition}][off:${offset}] notification for ${vpa}`);
            },
        });

        console.log('[Kafka] Notification consumer running for topics: fluxpay.notifications.*');
    } catch (err) {
        console.warn('[Kafka] Notification consumer failed to start (running without Kafka):', err.message);
    }
};

const stopNotificationConsumer = async () => {
    try {
        await consumer.disconnect();
    } catch (err) {
        console.warn('[Kafka] Notification consumer disconnect error:', err.message);
    }
};

module.exports = { startNotificationConsumer, stopNotificationConsumer };
