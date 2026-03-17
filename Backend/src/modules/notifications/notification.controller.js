const { Notification, Transaction } = require('../associations');
const { publishNotificationEvent } = require('../../core/kafka/producer');

// Helper: create a single notification record
const createTransactionNotification = async (userId, transactionId, message, vpaAddress, type) => {
    try {
        if (!userId || !transactionId || !message || !vpaAddress) {
            const error = new Error('Missing required parameters for notification creation');
            error.statusCode = 400;
            throw error;
        }

        const notification = await Notification.create({ userId, transactionId, message });

        await publishNotificationEvent({
            vpa: vpaAddress,
            userId,
            notificationId: notification.id,
            transactionId,
            message,
            type,
            createdAt: notification.createdAt,
        });

        return notification;
    } catch (error) {
        console.error('Error creating notification:', error);
        if (!error.statusCode) {
            error.statusCode = error.name === 'ValidationError' ? 400 : 500;
        }
        throw error;
    }
};

// Helper: create notifications for both sender and receiver
const createTransactionNotifications = async (senderUserId, receiverUserId, transactionId, senderVPA, receiverVPA, amount) => {
    try {
        if (!senderUserId || !receiverUserId || !transactionId || !senderVPA || !receiverVPA || amount === undefined) {
            const error = new Error('Missing required parameters for transaction notifications');
            error.statusCode = 400;
            throw error;
        }

        const senderType = senderUserId === receiverUserId ? 'credit' : 'debit';
        const receiverType = 'credit';

        const results = await Promise.allSettled([
            createTransactionNotification(
                senderUserId,
                transactionId,
                `You sent ${amount} to ${receiverVPA}`,
                senderVPA,
                senderType
            ),
            createTransactionNotification(
                receiverUserId,
                transactionId,
                `You received ${amount} from ${senderVPA}`,
                receiverVPA,
                receiverType
            )
        ]);

        const failures = results.filter(r => r.status === 'rejected');
        if (failures.length > 0) {
            console.error('Some notifications failed:', failures);
            const error = new Error('Some notifications failed to create');
            error.statusCode = 500;
            error.failures = failures;
            throw error;
        }

        return results.map(r => r.value);
    } catch (error) {
        console.error('Error creating transaction notifications:', error);
        if (!error.statusCode) error.statusCode = 500;
        throw error;
    }
};

// GET /notification
const getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.findAll({
            where: { userId: req.userId },
            include: [
                {
                    model: Transaction,
                    as: 'transaction',
                    attributes: ['transactionId', 'amount', 'description']
                }
            ],
            order: [['createdAt', 'DESC']]
        });

        res.json({ notifications });
    } catch (error) {
        console.error('Notification fetch error:', error);
        res.status(500).json({ message: 'Error fetching notifications', error: error.message });
    }
};

// PUT /notification/:id/read
const markAsRead = async (req, res) => {
    const { id } = req.params;
    const notificationId = parseInt(id);

    if (isNaN(notificationId)) {
        return res.status(400).json({ message: 'Invalid notification ID' });
    }

    try {
        const [affectedRows] = await Notification.update(
            { read: true },
            { where: { id: notificationId, userId: req.userId } }
        );

        if (affectedRows === 0) {
            return res.status(404).json({ message: 'Notification not found' });
        }

        const notification = await Notification.findByPk(notificationId);
        res.json({ message: 'Notification marked as read', notification });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ message: 'Error marking notification as read', error: error.message });
    }
};

module.exports = { getNotifications, markAsRead, createTransactionNotification, createTransactionNotifications };
