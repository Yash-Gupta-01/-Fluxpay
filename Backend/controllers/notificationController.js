const { Notification, Transaction } = require("../Database/db");

// Helper function to create transaction notifications
const createTransactionNotification = async (userId, transactionId, message) => {
    try {
        if (!userId || !transactionId || !message) {
            const error = new Error("Missing required parameters for notification creation");
            error.statusCode = 400;
            throw error;
        }

        return await Notification.create({
            userId,
            transactionId,
            message
        });
    } catch (error) {
        console.error('Error creating notification:', error);
        // Add status code if not already present
        if (!error.statusCode) {
            error.statusCode = 500;
            if (error.name === 'ValidationError') {
                error.statusCode = 400;
            }
        }
        throw error;
    }
};

// Helper function to create notifications for both parties in a transaction
const createTransactionNotifications = async (senderUserId, receiverUserId, transactionId, senderVPA, receiverVPA, amount) => {
    try {
        // Validate inputs
        if (!senderUserId || !receiverUserId || !transactionId || !senderVPA || !receiverVPA || amount === undefined) {
            const error = new Error("Missing required parameters for transaction notifications");
            error.statusCode = 400;
            throw error;
        }

        // Create notifications in parallel but handle errors for each
        const results = await Promise.allSettled([
            createTransactionNotification(
                senderUserId,
                transactionId,
                `You sent ${amount} to ${receiverVPA}`
            ),
            createTransactionNotification(
                receiverUserId,
                transactionId,
                `You received ${amount} from ${senderVPA}`
            )
        ]);

        // Check for any failures
        const failures = results.filter(r => r.status === 'rejected');
        if (failures.length > 0) {
            console.error('Some notifications failed:', failures);
            const error = new Error("Some notifications failed to create");
            error.statusCode = 500;
            error.failures = failures;
            throw error;
        }

        return results.map(r => r.value);
    } catch (error) {
        console.error('Error creating transaction notifications:', error);
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        throw error;
    }
};

// Get notifications for a user
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
        res.status(500).json({
            message: "Error fetching notifications",
            error: error.message
        });
    }
};

// Mark notification as read
const markAsRead = async (req, res) => {
    const { id } = req.params;

    const notificationId = parseInt(id);
    if (isNaN(notificationId)) {
        return res.status(400).json({ message: "Invalid notification ID" });
    }

    try {
        const [affectedRows] = await Notification.update(
            { read: true },
            { where: { id: notificationId, userId: req.userId } }
        );

        if (affectedRows === 0) {
            return res.status(404).json({ message: "Notification not found" });
        }

        const notification = await Notification.findByPk(notificationId);

        res.json({ message: "Notification marked as read", notification });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({
            message: "Error marking notification as read",
            error: error.message
        });
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    createTransactionNotification,
    createTransactionNotifications,
};
