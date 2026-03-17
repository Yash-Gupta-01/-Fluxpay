const { DataTypes } = require('sequelize');
const sequelize = require('../../core/database/db');

const Transaction = sequelize.define('Transaction', {
    transactionId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    senderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    receiverId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT
    },
    status: {
        type: DataTypes.ENUM('pending', 'completed', 'failed'),
        allowNull: false
    }
}, {
    tableName: 'transactions',
    timestamps: true,
    indexes: [
        {
            fields: ['senderId']
        },
        {
            fields: ['receiverId']
        }
    ]
});

module.exports = Transaction;
