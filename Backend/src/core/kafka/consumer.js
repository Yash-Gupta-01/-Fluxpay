/**
 * Kafka consumer — subscribes to `fluxpay.transactions` and processes
 * domain events in real time.
 *
 * Responsibilities handled here:
 *   - Structured audit logging for every transaction event
 *   - Hook points for fraud-detection rules and analytics aggregation
 *
 * Run standalone: `npm run kafka:consumer`
 * Or it can be started as part of the main process via startConsumer().
 */
const { Kafka, logLevel } = require('kafkajs');
const { KAFKA_BROKERS, KAFKA_CLIENT_ID, KAFKA_GROUP_ID } = require('../config');

const kafka = new Kafka({
    clientId: `${KAFKA_CLIENT_ID}-consumer`,
    brokers: KAFKA_BROKERS,
    logLevel: logLevel.WARN,
    retry: { retries: 3 },
});

const consumer = kafka.consumer({ groupId: KAFKA_GROUP_ID });

const TOPIC = 'fluxpay.transactions';

const startConsumer = async () => {
    try {
        await consumer.connect();
        await consumer.subscribe({ topic: TOPIC, fromBeginning: false });

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                const event = JSON.parse(message.value.toString());
                const offset = message.offset;

                console.log(
                    `[Kafka][${topic}][p${partition}][off:${offset}] ` +
                    `txn=${event.transactionId} status=${event.status} ` +
                    `amount=${event.amount} sender=${event.senderId} → receiver=${event.receiverId}`
                );

                // ── Fraud detection hook ──────────────────────────────────────
                if (event.amount > 50000) {
                    console.warn(`[Kafka][FraudAlert] Large transaction detected: ${event.transactionId}`);
                    // TODO: integrate with fraud-detection microservice
                }

                // ── Analytics hook ────────────────────────────────────────────
                // TODO: forward to ClickHouse / BigQuery for real-time dashboards
            },
        });

        console.log(`[Kafka] Consumer running on topic: ${TOPIC}`);
    } catch (err) {
        console.warn('[Kafka] Consumer failed to start (running without Kafka):', err.message);
    }
};

const stopConsumer = async () => {
    try {
        await consumer.disconnect();
    } catch (err) {
        console.warn('[Kafka] Consumer disconnect error:', err.message);
    }
};

module.exports = { startConsumer, stopConsumer };

// Allow running as a standalone worker process
if (require.main === module) {
    startConsumer().catch(console.error);

    process.on('SIGTERM', async () => {
        await stopConsumer();
        process.exit(0);
    });
}
