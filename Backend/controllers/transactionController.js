const { Transaction, User, Account, sequelize } = require("../Database/db");
const { Op } = require('sequelize');
const { createTransactionNotifications } = require("./notificationController");
const { emitNotification } = require("../sse");
const crypto = require('crypto');
// Helper function to validate and get accounts for a transaction
const validateTransactionAccounts = async (senderUserId, receiverVPA, amount) => {
    try {
        const senderAccount = await Account.findOne({ where: { userId: senderUserId } });
        if (!senderAccount) {
            const error = new Error("Sender account not found");
            error.statusCode = 404;
            throw error;
        }

        const receiverAccount = await Account.findOne({ where: { vpaAddress: receiverVPA } });
        if (!receiverAccount) {
            const error = new Error("Receiver VPA not found");
            error.statusCode = 404;
            throw error;
        }

        if (senderAccount.userId === receiverAccount.userId) {
            const error = new Error("Cannot transfer to yourself");
            error.statusCode = 400;
            throw error;
        }

        if (senderAccount.balance < amount) {
            const error = new Error("Insufficient balance");
            error.statusCode = 400;
            throw error;
        }

        return { senderAccount, receiverAccount };
    } catch (error) {
        // Add status code if not already present
        if (!error.statusCode) {
            error.statusCode = 500;
        }
        throw error;
    }
};

// Helper function to process transaction
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
        if (description === "Welcome bonus") {
            await sequelize.transaction(async (t) => {
                await Account.update(
                    { balance: sequelize.literal(`balance + ${amount}`) },
                    { where: { userId: receiverUserId }, transaction: t }
                );
                await transaction.update(
                    { status: 'completed' },
                    { transaction: t }
                );
            });
        }
        else {
            // Using transaction to ensure atomic updates
            await sequelize.transaction(async (t) => {
                await Account.update(
                    { balance: sequelize.literal(`balance - ${amount}`) },
                    { where: { userId: senderUserId }, transaction: t }
                );
                await Account.update(
                    { balance: sequelize.literal(`balance + ${amount}`) },
                    { where: { userId: receiverUserId }, transaction: t }
                );
                await transaction.update(
                    { status: 'completed' },
                    { transaction: t }
                );
            });
        }

        return transaction;
    } catch (error) {
        // Mark transaction as failed if it was created
        if (transaction) {
            await transaction.update({ status: 'failed' }).catch(console.error);
        }

        const txError = new Error("Transaction failed: " + error.message);
        txError.statusCode = 500;
        throw txError;
    }
};

// Fetch transaction history for a user
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
                {
                    model: User,
                    as: 'sender',
                    attributes: ['firstName', 'lastName']
                },
                {
                    model: User,
                    as: 'receiver',
                    attributes: ['firstName', 'lastName']
                }
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
        res.status(500).json({
            message: "Error fetching transaction history",
            error: error.message
        });
    }
};

// Create a new transaction (transfer between users)
const createTransaction = async (req, res) => {
    const { receiverVPA, amount, description } = req.body;

    try {
        // Input validation
        if (!receiverVPA) {
            return res.status(400).json({ message: "Receiver VPA is required" });
        }
        if (!amount || typeof amount !== 'number') {
            return res.status(400).json({ message: "Valid amount is required" });
        }
        if (amount <= 0) {
            return res.status(400).json({ message: "Amount must be greater than 0" });
        }

        // Validate accounts and get account details
        const { senderAccount, receiverAccount } = await validateTransactionAccounts(req.userId, receiverVPA, amount);

        // Process the transaction
        const transaction = await processTransaction(
            req.userId,
            receiverAccount.userId,
            amount,
            description
        );

        let notificationError;
        try {
            // Create notifications for both parties
            await createTransactionNotifications(
                req.userId,
                receiverAccount.userId,
                transaction.id,
                senderAccount.vpaAddress,
                receiverVPA,
                amount
            );

            // Emit real-time notifications
            emitNotification(req.userId, { message: `You sent ${amount} to ${receiverVPA}`, type: 'debit' });
            emitNotification(receiverAccount.userId, { message: `You received ${amount} from ${senderAccount.vpaAddress}`, type: 'credit' });
        } catch (err) {
            notificationError = err;
            // Log notification error but don't fail the transaction
            console.error('Failed to create notifications:', notificationError);
            // Transaction was successful, but notifications failed
        }

        res.status(200).json({
            message: "Transaction successful",
            transaction,
            warnings: notificationError ? ["Transaction successful but notifications may be delayed"] : undefined
        });
    } catch (error) {
        console.log(error);
        const statusCode = error.statusCode || 500;
        const message = statusCode === 500 ?
            "An unexpected error occurred while processing the transaction" :
            error.message;

        res.status(statusCode).json({
            message,
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    getTransactionHistory,
    createTransaction,
    processTransaction,
};
