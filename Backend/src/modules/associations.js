/**
 * associations.js
 * Defines all Sequelize model associations in one place.
 * This avoids circular dependency issues that occur when models import each other.
 * This file must be required once — at app bootstrap (app.js) — before syncing the DB.
 */
const sequelize = require('../core/database/db');
const User = require('./users/user.model');
const Account = require('./accounts/account.model');
const Transaction = require('./transactions/transaction.model');
const Notification = require('./notifications/notification.model');

// User <-> Account
User.hasOne(Account, { foreignKey: 'userId' });
Account.belongsTo(User, { foreignKey: 'userId' });

// User <-> Transaction
User.hasMany(Transaction, { foreignKey: 'senderId', as: 'sentTransactions' });
User.hasMany(Transaction, { foreignKey: 'receiverId', as: 'receivedTransactions' });
Transaction.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
Transaction.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });

// Transaction <-> Notification
Transaction.hasMany(Notification, { foreignKey: 'transactionId' });
Notification.belongsTo(Transaction, { foreignKey: 'transactionId', as: 'transaction' });

// User <-> Notification
User.hasMany(Notification, { foreignKey: 'userId' });
Notification.belongsTo(User, { foreignKey: 'userId' });

// Sync all models to the database
const syncDatabase = async () => {
    try {
        await sequelize.sync({ alter: true });
        console.log('Database synced');
    } catch (err) {
        console.error('Error syncing database:', err);
    }
};

module.exports = { sequelize, User, Account, Transaction, Notification, syncDatabase };
