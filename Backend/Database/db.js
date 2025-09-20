require('dotenv').config();
const { Sequelize, DataTypes } = require('sequelize');

const sequelize = new Sequelize(process.env.DB_NAME || 'fluxpay', process.env.DB_USER || 'postgres', process.env.DB_PASSWORD || 'root', {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
    logging: false,
});

sequelize.authenticate()
    .then(() => console.log('Connected to PostgreSQL'))
    .catch(err => console.error('Error connecting to PostgreSQL:', err));

const User = sequelize.define('User', {
    userName: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isLowercase: true
        }
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            len: [8, 100]
        }
    },
    firstName: {
        type: DataTypes.STRING,
        allowNull: false
    },
    lastName: {
        type: DataTypes.STRING
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true
        }
    }
}, {
    tableName: 'users',
    timestamps: true
});

const Account = sequelize.define('Account', {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
        references: {
            model: User,
            key: 'id'
        }
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

const Transaction = sequelize.define('Transaction', {
    transactionId: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    senderId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    receiverId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
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

const Notification = sequelize.define('Notification', {
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    transactionId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: Transaction,
            key: 'id'
        }
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

// Define associations
User.hasOne(Account, { foreignKey: 'userId' });
Account.belongsTo(User, { foreignKey: 'userId' });

User.hasMany(Transaction, { foreignKey: 'senderId', as: 'sentTransactions' });
User.hasMany(Transaction, { foreignKey: 'receiverId', as: 'receivedTransactions' });
Transaction.belongsTo(User, { foreignKey: 'senderId', as: 'sender' });
Transaction.belongsTo(User, { foreignKey: 'receiverId', as: 'receiver' });

Transaction.hasMany(Notification, { foreignKey: 'transactionId' });
Notification.belongsTo(Transaction, { foreignKey: 'transactionId', as: 'transaction' });

User.hasMany(Notification, { foreignKey: 'userId' });
Notification.belongsTo(User, { foreignKey: 'userId' });

// Sync database
sequelize.sync({ alter: true })
    .then(() => console.log('Database synced'))
    .catch(err => console.error('Error syncing database:', err));

module.exports = {
    sequelize,
    User,
    Account,
    Transaction,
    Notification
};
