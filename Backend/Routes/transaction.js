const express = require('express');
const router = express.Router();
const { getTransactionHistory, createTransaction } = require('../controllers/transactionController');
const { authMiddleware } = require('../Middlewares/auth');

// Route to fetch transaction history
router.get('/history', authMiddleware, getTransactionHistory);

// Route to create a new transaction
router.post('/transfer', authMiddleware, createTransaction);

module.exports = router;