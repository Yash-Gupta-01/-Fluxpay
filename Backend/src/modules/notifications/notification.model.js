const { DataTypes } = require('sequelize');
const sequelize = require('../../core/database/db');

const Notification = sequelize.define('Notification', {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    transactionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    message: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    read: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    }
}, {
    tableName: 'notifications',
    timestamps: true,
    indexes: [
        {
            fields: ['userId']
        },
        {
            fields: ['transactionId']
        }
    ]
});

module.exports = Notification;
