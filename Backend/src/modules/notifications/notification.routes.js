const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../../core/middlewares/auth');
const { getNotifications, markAsRead } = require('./notification.controller');

router.get('/', authMiddleware, getNotifications);
router.put('/:id/read', authMiddleware, markAsRead);

module.exports = router;
