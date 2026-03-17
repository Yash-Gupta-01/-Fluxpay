const express = require('express');
const router = express.Router();

const userRoutes = require('./modules/users/user.routes');
const accountRoutes = require('./modules/accounts/account.routes');
const transactionRoutes = require('./modules/transactions/transaction.routes');
const notificationRoutes = require('./modules/notifications/notification.routes');

router.use('/user', userRoutes);
router.use('/account', accountRoutes);
router.use('/transaction', transactionRoutes);
router.use('/notification', notificationRoutes);

module.exports = router;
