const clients = new Map();

const setupSSE = (app, authMiddleware) => {
  app.get('/api/v1/notifications/stream', authMiddleware, (req, res) => {
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
    });
    clients.set(req.userId, res);
    res.write('event: connected\ndata: {}\n\n');

    req.on('close', () => clients.delete(req.userId));
  });
};

const emitNotification = (userId, notification) => {
  const client = clients.get(userId);
  if (client) {
    client.write(`event: notification\n`);
    client.write(`data: ${JSON.stringify(notification)}\n\n`);
  }
};

module.exports = { setupSSE, emitNotification };
