const { DataTypes } = require('sequelize');
const sequelize = require('../../core/database/db');

// User is imported lazy to avoid circular dependency — associations are set up in associations.js
const Account = sequelize.define('Account', {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
    },
    balance: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 100.00
    },
    vpaAddress: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    }
}, {
    tableName: 'accounts',
    timestamps: true,
    indexes: [
        {
            unique: true,
            fields: ['userId']
        },
        {
            fields: ['vpaAddress']
        }
    ]
});

module.exports = Account;
