const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../core/middlewares/auth');
const { getTransactionHistory, createTransaction } = require('./transaction.controller');

router.get('/history', authMiddleware, getTransactionHistory);
router.post('/transfer', authMiddleware, createTransaction);

module.exports = router;
