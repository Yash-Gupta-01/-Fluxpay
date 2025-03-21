const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../Middlewares/auth");
const { getTransactionHistory, createTransaction } = require("../controllers/transactionController");

// Route to fetch transaction history
router.get("/", authMiddleware, getTransactionHistory);

// Route to create a new transaction
router.post("/", authMiddleware, createTransaction);

module.exports = router;