const { Transaction, User, Account, sequelize } = require('../associations');
const { Op } = require('sequelize');
const { createTransactionNotifications } = require('../notifications/notification.controller');
const { cacheDel, keys } = require('../../core/cache/redis');
const { publishTransactionEvent } = require('../../core/kafka/producer');
const crypto = require('crypto');

// Helper: validate accounts and ensure sufficient balance
const validateTransactionAccounts = async (senderUserId, receiverVPA, amount) => {
    try {
        const senderAccount = await Account.findOne({ where: { userId: senderUserId } });
        if (!senderAccount) {
            const error = new Error('Sender account not found');
            error.statusCode = 404;
            throw error;
        }

        const receiverAccount = await Account.findOne({ where: { vpaAddress: receiverVPA } });
        if (!receiverAccount) {
            const error = new Error('Receiver VPA not found');
            error.statusCode = 404;
            throw error;
        }

        if (senderAccount.userId === receiverAccount.userId) {
            const error = new Error('Cannot transfer to yourself');
            error.statusCode = 400;
            throw error;
        }

        if (senderAccount.balance < amount) {
            const error = new Error('Insufficient balance');
            error.statusCode = 400;
            throw error;
        }

        return { senderAccount, receiverAccount };
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        throw error;
    }
};

// Helper: atomically create and process a transaction record
const processTransaction = async (senderUserId, receiverUserId, amount, description) => {
    let transaction;
    try {
        const transactionId = crypto.randomUUID();
        transaction = await Transaction.create({
            transactionId,
            senderId: senderUserId,
            receiverId: receiverUserId,
            amount,
            description,
            status: 'pending'
        });

        if (description === 'Welcome bonus') {
            await sequelize.transaction(async (t) => {
                await Account.update(
                    { balance: sequelize.literal(`balance + ${amount}`) },
                    { where: { userId: receiverUserId }, transaction: t }
                );
                await transaction.update({ status: 'completed' }, { transaction: t });
            });
        } else {
            await sequelize.transaction(async (t) => {
                await Account.update(
                    { balance: sequelize.literal(`balance - ${amount}`) },
                    { where: { userId: senderUserId }, transaction: t }
                );
                await Account.update(
                    { balance: sequelize.literal(`balance + ${amount}`) },
                    { where: { userId: receiverUserId }, transaction: t }
                );
                await transaction.update({ status: 'completed' }, { transaction: t });
            });
        }

        // Invalidate cached balances for both parties
        await Promise.all([
            cacheDel(keys.balance(senderUserId)),
            cacheDel(keys.balance(receiverUserId)),
        ]);

        // Publish domain event to Kafka for async processing
        await publishTransactionEvent({
            transactionId: transaction.transactionId,
            senderId: senderUserId,
            receiverId: receiverUserId,
            amount,
            status: 'completed',
        });

        return transaction;
    } catch (error) {
        if (transaction) {
            await transaction.update({ status: 'failed' }).catch(console.error);
            await publishTransactionEvent({
                transactionId: transaction.transactionId,
                senderId: senderUserId,
                receiverId: receiverUserId,
                amount,
                status: 'failed',
            }).catch(() => {});
        }
        const txError = new Error('Transaction failed: ' + error.message);
        txError.statusCode = 500;
        throw txError;
    }
};

// GET /transaction/history
const getTransactionHistory = async (req, res) => {
    try {
        const transactions = await Transaction.findAll({
            where: {
                [Op.or]: [
                    { senderId: req.userId },
                    { receiverId: req.userId }
                ]
            },
            include: [
                { model: User, as: 'sender', attributes: ['firstName', 'lastName'] },
                { model: User, as: 'receiver', attributes: ['firstName', 'lastName'] }
            ],
            order: [['createdAt', 'DESC']]
        });

        const formattedTransactions = transactions.map(t => ({
            transactionId: t.transactionId,
            sender: t.sender,
            receiver: t.receiver,
            amount: t.amount,
            description: t.description,
            type: t.senderId === req.userId ? 'debit' : 'credit',
            timestamp: t.createdAt,
            status: t.status
        }));

        res.json({ transactions: formattedTransactions });
    } catch (error) {
        console.error('Transaction fetch error:', error);
        res.status(500).json({ message: 'Error fetching transaction history', error: error.message });
    }
};

// POST /transaction/transfer
const createTransaction = async (req, res) => {
    const { receiverVPA, amount, description } = req.body;

    try {
        if (!receiverVPA) {
            return res.status(400).json({ message: 'Receiver VPA is required' });
        }
        if (!amount || typeof amount !== 'number') {
            return res.status(400).json({ message: 'Valid amount is required' });
        }
        if (amount <= 0) {
            return res.status(400).json({ message: 'Amount must be greater than 0' });
        }

        const { senderAccount, receiverAccount } = await validateTransactionAccounts(req.userId, receiverVPA, amount);

        const transaction = await processTransaction(req.userId, receiverAccount.userId, amount, description);

        let notificationError;
        try {
            await createTransactionNotifications(
                req.userId,
                receiverAccount.userId,
                transaction.id,
                senderAccount.vpaAddress,
                receiverVPA,
                amount
            );
        } catch (err) {
            notificationError = err;
            console.error('Failed to create notifications:', notificationError);
        }

        res.status(200).json({
            message: 'Transaction successful',
            transaction,
            warnings: notificationError ? ['Transaction successful but notifications may be delayed'] : undefined
        });
    } catch (error) {
        console.log(error);
        const statusCode = error.statusCode || 500;
        const message = statusCode === 500
            ? 'An unexpected error occurred while processing the transaction'
            : error.message;

        res.status(statusCode).json({
            message,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = { getTransactionHistory, createTransaction, processTransaction };
