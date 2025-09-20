const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead } = require('../controllers/notificationController');
const { authMiddleware } = require('../Middlewares/auth');

// Get all notifications for logged in user
router.get('/', authMiddleware, getNotifications);

// Mark a notification as read
router.put('/:id/read', authMiddleware, markAsRead);

module.exports = router;
