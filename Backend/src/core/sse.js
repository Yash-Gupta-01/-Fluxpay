const { Account } = require('../modules/associations');

const clientsByUser = new Map();
const clientsByVpa = new Map();

const addClient = (map, key, res) => {
    if (!map.has(key)) map.set(key, new Set());
    map.get(key).add(res);
};

const removeClient = (map, key, res) => {
    const set = map.get(key);
    if (!set) return;
    set.delete(res);
    if (set.size === 0) map.delete(key);
};

const setupSSE = (app, authMiddleware) => {
    app.get('/api/v1/notifications/stream', authMiddleware, async (req, res) => {
        try {
            const account = await Account.findOne({ where: { userId: req.userId } });
            if (!account) {
                return res.status(404).json({ message: 'Account not found' });
            }

            res.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
                'Access-Control-Allow-Origin': '*',
            });

            addClient(clientsByUser, req.userId, res);
            addClient(clientsByVpa, account.vpaAddress, res);

            res.write(`event: connected\n`);
            res.write(`data: ${JSON.stringify({ vpa: account.vpaAddress })}\n\n`);

            req.on('close', () => {
                removeClient(clientsByUser, req.userId, res);
                removeClient(clientsByVpa, account.vpaAddress, res);
            });
        } catch (err) {
            console.error('SSE setup error:', err);
            res.status(500).json({ message: 'Failed to setup notification stream' });
        }
    });
};

const emitNotificationToUser = (userId, notification) => {
    const clients = clientsByUser.get(userId);
    if (!clients) return;
    for (const client of clients) {
        client.write(`event: notification\n`);
        client.write(`data: ${JSON.stringify(notification)}\n\n`);
    }
};

const emitNotificationByVpa = (vpa, notification) => {
    const clients = clientsByVpa.get(vpa);
    if (!clients) return;
    for (const client of clients) {
        client.write(`event: notification\n`);
        client.write(`data: ${JSON.stringify(notification)}\n\n`);
    }
};

module.exports = { setupSSE, emitNotificationToUser, emitNotificationByVpa };
