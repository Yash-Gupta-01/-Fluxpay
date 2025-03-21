const { Account, User, Transaction } = require("../Database/db");
const mongoose = require("mongoose");

const getBalance = async (req, res) => {
    try {
        const account = await Account.findOne({ userId: req.userId });

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

        // Validate amount
        if (!amount || amount <= 0) {
            return res.status(400).json({ message: "Invalid amount" });
        }

        // Find sender and receiver accounts
        const fromAccount = await Account.findOne({ userId: req.userId });
        const toAccount = await Account.findOne({ userId: to });

        // Validate accounts
        if (!fromAccount) {
            return res.status(404).json({ message: "Sender account not found" });
        }
        if (!toAccount) {
            return res.status(404).json({ message: "Receiver account not found" });
        }
        if (fromAccount.balance < amount) {
            return res.status(400).json({ message: "Insufficient balance" });
        }

        // Update sender's balance
        const updateSender = await Account.updateOne(
            { userId: req.userId },
            { $inc: { balance: -amount } }
        );

        // Update receiver's balance
        const updateReceiver = await Account.updateOne(
            { userId: to },
            { $inc: { balance: amount } }
        );

        // Get receiver's name for better description
        const receiver = await User.findById(to);
        const sender = await User.findById(req.userId);

        // Create transaction records
        await Transaction.create([
            {
                userId: req.userId,
                type: 'debit',
                amount: amount,
                description: `Transfer to ${receiver.firstName} ${receiver.lastName}`,
                relatedUserId: to,
                status: 'completed'
            },
            {
                userId: to,
                type: 'credit',
                amount: amount,
                description: `Transfer from ${sender.firstName} ${sender.lastName}`,
                relatedUserId: req.userId,
                status: 'completed'
            }
        ]);

        // Get updated sender balance
        const updatedFromAccount = await Account.findOne({ userId: req.userId });

        res.json({
            message: "Transfer successful",
            balance: updatedFromAccount.balance,
            transactionDetails: {
                amount,
                receiver: `${receiver.firstName} ${receiver.lastName}`,
                timestamp: new Date()
            }
        });

    } catch (error) {
        console.error('Transfer error:', error);
        res.status(400).json({ 
            message: error.message || "Transfer failed",
            error: error.toString()
        });
    }
};

const getUserName = async (req, res) => {
    const user = await User.findById(req.userId);
    res.json({ name: user.firstName });
};

module.exports = {
    getBalance,
    transfer,
    getUserName,
};