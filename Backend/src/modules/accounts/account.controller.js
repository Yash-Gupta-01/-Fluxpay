const { Account, User } = require('../associations');
const { createTransactionNotifications } = require('../notifications/notification.controller');
const { processTransaction } = require('../transactions/transaction.controller');
const { cacheGet, cacheSet, cacheDel, keys } = require('../../core/cache/redis');
const { REDIS_TTL } = require('../../core/config');

const getBalance = async (req, res) => {
    try {
        // Redis read-through cache — avoids hitting the primary DB on every balance check
        const cacheKey = keys.balance(req.userId);
        const cached = await cacheGet(cacheKey);
        if (cached !== null) {
            return res.json({ balance: cached.balance, fromCache: true });
        }

        const account = await Account.findOne({ where: { userId: req.userId } });

        if (!account) {
            return res.status(404).json({ message: 'Account not found' });
        }

        await cacheSet(cacheKey, { balance: account.balance }, REDIS_TTL || 60);
        res.json({ balance: account.balance });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching balance', error: error.message });
    }
};

const transfer = async (req, res) => {
    try {
        const { amount, to } = req.body;

        if (!to) {
            return res.status(400).json({ message: 'Receiver ID is required' });
        }
        if (!amount || typeof amount !== 'number') {
            return res.status(400).json({ message: 'Valid amount is required' });
        }
        if (amount <= 0) {
            return res.status(400).json({ message: 'Amount must be greater than 0' });
        }
        if (to === req.userId) {
            return res.status(400).json({ message: 'Cannot transfer to yourself' });
        }

        const transaction = await processTransaction(req.userId, to, amount, `Transfer from user ${req.userId} to user ${to}`);

        const updatedFromAccount = await Account.findOne({ where: { userId: req.userId } });

        try {
            await createTransactionNotifications(
                req.userId,
                to,
                transaction.id,
                updatedFromAccount.vpaAddress,
                (await Account.findOne({ where: { userId: to } })).vpaAddress,
                amount
            );
        } catch (notificationError) {
            console.error('Failed to create notifications:', notificationError);
        }

        res.json({
            message: 'Transfer successful',
            balance: updatedFromAccount.balance,
            transactionDetails: {
                amount,
                receiver: `User ID ${to}`,
                timestamp: new Date(),
                transactionId: transaction.transactionId
            }
        });
    } catch (error) {
        console.error('Transfer error:', error);
        const statusCode = error.statusCode || 500;
        res.status(statusCode).json({
            message: statusCode === 500 ? 'An unexpected error occurred during transfer' : error.message,
            error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
        });
    }
};

const getUserName = async (req, res) => {
    try {
        const user = await User.findByPk(req.userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json({ name: user.firstName });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({
            message: 'Error fetching user details',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = { getBalance, transfer, getUserName };
