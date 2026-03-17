/**
 * seed.js — Bulk user seeder for load testing and demo environments.
 *
 * Creates 500 simulated users with accounts and cross-user transactions
 * to generate realistic transaction history data. Designed to be
 * idempotent: re-running will skip existing usernames.
 *
 * Usage:  npm run seed
 *         NODE_ENV=development npm run seed
 */
require('dotenv').config();
const { sequelize, User, Account, Transaction, syncDatabase } = require('../src/modules/associations');
const crypto = require('crypto');

const TOTAL_USERS = 500;
const TRANSACTIONS_PER_USER = 5;
const WELCOME_BONUS = 1000;
const SEED_PASSWORD = 'SeedPass@123'; // plain-text (demo only — not for production)

const firstNames = [
    'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh',
    'Priya', 'Ananya', 'Isha', 'Neha', 'Sakshi', 'Pooja', 'Kavya',
    'Rohan', 'Karan', 'Rahul', 'Amit', 'Sanjay', 'Deepak',
    'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia',
    'James', 'Isabella', 'Lucas', 'Mia', 'Mason', 'Charlotte', 'Logan',
];

const lastNames = [
    'Sharma', 'Verma', 'Patel', 'Singh', 'Kumar', 'Mehta', 'Joshi',
    'Reddy', 'Nair', 'Iyer', 'Bhat', 'Pillai', 'Gupta', 'Malhotra',
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller',
    'Davis', 'Wilson', 'Anderson', 'Taylor', 'Thomas', 'Jackson', 'White',
];

const randomFrom = (arr) => arr[Math.floor(Math.random() * arr.length)];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function seedUsers() {
    console.log(`\n[Seeder] Starting — will create up to ${TOTAL_USERS} users...\n`);
    await syncDatabase();

    const createdUserIds = [];

    for (let i = 1; i <= TOTAL_USERS; i++) {
        const firstName = randomFrom(firstNames);
        const lastName = randomFrom(lastNames);
        const userName = `user_${i}_${firstName.toLowerCase()}`;
        const email = `${userName}@fluxpay.local`;

        try {
            const [user, created] = await User.findOrCreate({
                where: { userName },
                defaults: { userName, password: SEED_PASSWORD, firstName, lastName, email },
            });

            if (created) {
                const vpaAddress = `${userName}@fluxpay`;
                await Account.findOrCreate({
                    where: { userId: user.id },
                    defaults: { userId: user.id, balance: WELCOME_BONUS, vpaAddress },
                });
                createdUserIds.push(user.id);
            } else {
                const acct = await Account.findOne({ where: { userId: user.id } });
                if (acct) createdUserIds.push(user.id);
            }

            if (i % 50 === 0) process.stdout.write(`[Seeder] ${i}/${TOTAL_USERS} users processed\n`);
        } catch (err) {
            console.error(`[Seeder] Error creating user ${userName}:`, err.message);
        }
    }

    console.log(`\n[Seeder] ${createdUserIds.length} users ready. Seeding transactions...\n`);

    let txCount = 0;
    for (let i = 0; i < Math.min(createdUserIds.length, TOTAL_USERS); i++) {
        const senderId = createdUserIds[i];

        for (let j = 0; j < TRANSACTIONS_PER_USER; j++) {
            // Pick a random receiver that is not the sender
            let receiverIdx;
            do { receiverIdx = Math.floor(Math.random() * createdUserIds.length); }
            while (createdUserIds[receiverIdx] === senderId);

            const receiverId = createdUserIds[receiverIdx];
            const amount = parseFloat((Math.random() * 490 + 10).toFixed(2));

            try {
                await sequelize.transaction(async (t) => {
                    const senderAcct = await Account.findOne({ where: { userId: senderId }, transaction: t });
                    if (!senderAcct || senderAcct.balance < amount) return;

                    const txId = crypto.randomUUID();
                    await Transaction.create({
                        transactionId: txId,
                        senderId,
                        receiverId,
                        amount,
                        description: `Seeded transaction ${txCount + 1}`,
                        status: 'completed',
                    }, { transaction: t });

                    await Account.update(
                        { balance: sequelize.literal(`balance - ${amount}`) },
                        { where: { userId: senderId }, transaction: t }
                    );
                    await Account.update(
                        { balance: sequelize.literal(`balance + ${amount}`) },
                        { where: { userId: receiverId }, transaction: t }
                    );
                });
                txCount++;
            } catch (err) {
                // Skip failed individual transactions silently
            }
        }

        if (i % 50 === 0 && i > 0) process.stdout.write(`[Seeder] ${i}/${createdUserIds.length} users transacted\n`);
    }

    console.log(`\n[Seeder] Done.`);
    console.log(`  Users created/verified : ${createdUserIds.length}`);
    console.log(`  Transactions seeded    : ${txCount}`);
    console.log(`\n[Seeder] Database is ready for load testing.\n`);

    await sequelize.close();
}

seedUsers().catch((err) => {
    console.error('[Seeder] Fatal error:', err);
    process.exit(1);
});
