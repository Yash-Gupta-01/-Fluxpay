const { Account, User, Transaction, sequelize } = require("../Database/db");
const { createTransactionNotifications } = require("./notificationController");
const { processTransaction } = require("./transactionController");
const crypto = require('crypto');

const getBalance = async (req, res) => {
    try {
        const account = await Account.findOne({ where: { userId: req.userId } });

        if (!account) {
            return res.status(404).json({ message: "Account not found" });
        }

        res.json({ balance: account.balance });
    } catch (error) {
        res.status(500).json({ message: "Error fetching balance", error: error.message });
    }
};

const transfer = async (req, res) => {
    try {
        const { amount, to } = req.body;

        // Input validation
        if (!to) {
            return res.status(400).json({ message: "Receiver ID is required" });
        }
        if (!amount || typeof amount !== 'number') {
            return res.status(400).json({ message: "Valid amount is required" });
        }
        if (amount <= 0) {
            return res.status(400).json({ message: "Amount must be greater than 0" });
        }
        if (to === req.userId) {
            return res.status(400).json({ message: "Cannot transfer to yourself" });
        }

        // Use processTransaction for atomic transaction processing
        const transaction = await processTransaction(req.userId, to, amount, `Transfer from user ${req.userId} to user ${to}`);

        // Fetch updated balance
        const updatedFromAccount = await Account.findOne({ where: { userId: req.userId } });

        // Try to create notifications
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
            // Log notification error but don't fail the transaction
            console.error('Failed to create notifications:', notificationError);
        }

        res.json({
            message: "Transfer successful",
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
            message: statusCode === 500 ? "An unexpected error occurred during transfer" : error.message,
            error: process.env.NODE_ENV === 'development' ? error.toString() : undefined
        });
    }
};

const getUserName = async (req, res) => {
    try {
        const user = await User.findByPk(req.userId);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.json({ name: user.firstName });
    } catch (error) {
        console.error('Error fetching user:', error);
        res.status(500).json({
            message: "Error fetching user details",
            error: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
};

module.exports = {
    getBalance,
    transfer,
    getUserName,
};