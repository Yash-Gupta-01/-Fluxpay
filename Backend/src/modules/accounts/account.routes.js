const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../core/middlewares/auth');
const { getBalance, transfer, getUserName } = require('./account.controller');

router.get('/balance', authMiddleware, getBalance);
router.post('/transfer', authMiddleware, transfer);
router.get('/user/:id', authMiddleware, getUserName);

module.exports = router;
