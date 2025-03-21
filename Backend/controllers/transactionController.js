const { Transaction, User } = require("../Database/db");

// Fetch transaction history for a user
const getTransactionHistory = async (req, res) => {
    try {
        const transactions = await Transaction.find({ userId: req.userId })
            .sort({ timestamp: -1 });

        const formattedTransactions = transactions.map(t => ({
            _id: t._id,
            type: t.type,
            amount: t.amount,
            description: t.description,
            timestamp: t.timestamp,
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

// Create a new transaction (credit or debit)
const createTransaction = async (req, res) => {
    const { type, amount, description } = req.body;

    if (!["credit", "debit"].includes(type)) {
        return res.status(400).json({ message: "Invalid transaction type" });
    }

    try {
        const account = await Account.findOne({ userId: req.userId });
        if (!account) {
            return res.status(404).json({ message: "Account not found" });
        }

        if (type === "debit" && account.balance < amount) {
            return res.status(400).json({ message: "Insufficient balance" });
        }

        // Create the transaction
        const transaction = await Transaction.create({
            userId: req.userId,
            type,
            amount,
            description,
        });

        // Update the account balance
        const balanceUpdate = type === "credit" ? amount : -amount;
        await Account.updateOne({ userId: req.userId }, { $inc: { balance: balanceUpdate } });

        res.json({ message: "Transaction successful", transaction });
    } catch (error) {
        res.status(500).json({ message: "Error creating transaction", error: error.message });
    }
};

module.exports = {
    getTransactionHistory,
    createTransaction,
};