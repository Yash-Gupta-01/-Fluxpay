require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();

// Bootstrap DB associations and sync (must happen before any routes are used)
const { syncDatabase } = require('./modules/associations');
syncDatabase();

const { PORT } = require('./core/config');
const { setupSSE } = require('./core/sse');
const { authMiddleware } = require('./core/middlewares/auth');
const mainRouter = require('./routes');
const { connectProducer } = require('./core/kafka/producer');
const { startConsumer } = require('./core/kafka/consumer');
const { startNotificationConsumer } = require('./core/kafka/notification-consumer');

app.use(cors());
app.use(express.json());

// Mount all API routes
app.use('/api/v1', mainRouter);

// Setup SSE endpoint for real-time notifications
setupSSE(app, authMiddleware);

app.listen(PORT, async () => {
    console.log(`live on http://localhost:${PORT}`);

    // Connect Kafka producer (non-blocking — app works if Kafka is unavailable)
    await connectProducer();

    // Start Kafka consumer for transaction event processing
    await startConsumer();

    // Start Kafka consumer for notification streaming
    await startNotificationConsumer();
});
