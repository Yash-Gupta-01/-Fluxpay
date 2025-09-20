const { User, Account, Transaction, sequelize } = require("../Database/db");
const { Op } = require('sequelize');
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");
const { createTransactionNotifications } = require("./notificationController");

const { createTransaction, processTransaction } = require("./transactionController");

const signup = async (req, res) => {
    const { userName, password, firstName, lastName , email } = req.body;

    // Check if username is already taken
    const existingUser = await User.findOne({ where: { userName } });
    if (existingUser) {
        return res.status(409).json({ message: "Username already taken" });
    }

    // Check if email is already taken
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
        return res.status(409).json({ message: "Email already taken" });
    }

    const user = await User.create({ userName, password, firstName, lastName , email});
    const userId = user.id;

    // Generate VPA as username@fluxpay
    const vpaAddress = `${userName}@fluxpay`;

    // Create account with initial balance and VPA
    await Account.create({ userId, balance: 0 , vpaAddress });

    // Simulate welcome bonus
    const initialDeposit = 1000;

    // Use processTransaction to create welcome bonus transaction and update balances atomically
    let transaction;
    try {
        transaction = await processTransaction(userId, userId, initialDeposit, "Welcome bonus");
    } catch (error) {
        console.error('Failed to process welcome bonus transaction:', error);
        return res.status(500).json({ message: "Failed to process welcome bonus", error: error.message });
    }

    // Create notification for the welcome bonus
    try {
        await createTransactionNotifications(
            userId,
            userId,
            transaction.id,
            vpaAddress,
            vpaAddress,
            initialDeposit
        );
    } catch (err) {
        console.error('Failed to create welcome bonus notification:', err);
        // Don't fail signup if notification fails
    }

    const token = jwt.sign({ userId }, JWT_SECRET);
    res.json({ message: "User created successfully with a welcome bonus", token });
};

const signin = async (req, res) => {
    const { userName, password } = req.body;

    try {
        const user = await User.findOne({ where: { userName, password } }); // Match username and password
        if (!user) {
            return res.status(409).json({ message: "Error while logging in" });
        }

        const account = await Account.findOne({ where: { userId: user.id } }); // Fetch user's account details
        if (!account) {
            return res.status(404).json({ message: "Account not found" });
        }

        const token = jwt.sign({ userId: user.id }, JWT_SECRET);

        res.json({
            token,
            name: `${user.firstName} ${user.lastName || ""}`,
            userName: user.userName,
            email : user.email,
            balance: parseInt(account.balance),
        });
    } catch (error) {
        res.status(500).json({ message: "Error during login", error: error.message });
    }
};

const updateUser = async (req, res) => {
    const { userId } = req;
    const updates = req.body;

    await User.update(updates, { where: { id: parseInt(userId) } });
    res.json({ message: "Updated successfully" });
};

const getUsers = async (req, res) => {
    try {
        const filter = req.query.filter || "";
        const currentUserId = req.userId; // Get current user's ID from auth middleware

        const users = await User.findAll({
            where: {
                [Op.and]: [
                    {
                        [Op.or]: [
                            { firstName: { [Op.iLike]: `%${filter}%` } },
                            { lastName: { [Op.iLike]: `%${filter}%` } },
                        ]
                    },
                    { id: { [Op.ne]: currentUserId } } // Exclude current user
                ]
            },
            attributes: ['firstName', 'lastName', 'id']
        });

        res.json({
            users: users.map(user => ({
                firstName: user.firstName,
                lastName: user.lastName,
                id: user.id,
            }))
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching users", error: error.message });
    }
};

const getProfile = async (req, res) => {
    try {
        const user = await User.findByPk(req.userId);
        const account = await Account.findOne({ where: { userId: req.userId } });

        if (!user || !account) {
            return res.status(404).json({ message: "User or account not found" });
        }

        res.json({
            name: `${user.firstName} ${user.lastName || ""}`,
            email: user.email,
            balance: parseInt(account.balance),
            vpa: account.vpaAddress,
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching profile", error: error.message });
    }
};

module.exports = {
    signup,
    signin,
    updateUser,
    getUsers,
    getProfile,
};