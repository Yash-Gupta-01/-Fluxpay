const { User, Account, Transaction } = require("../Database/db");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");

const signup = async (req, res) => {
    const { userName, password, firstName, lastName } = req.body; // Change 'username' to 'userName'

    const existingUser = await User.findOne({ userName }); // Change 'username' to 'userName'
    if (existingUser) {
        return res.status(411).json({ message: "Email already taken/Incorrect inputs" });
    }

    const user = await User.create({ userName, password, firstName, lastName }); // Change 'username' to 'userName'
    const userId = user._id;

    // Create account with initial balance
    await Account.create({ userId, balance: 0 });

    // Simulate welcome bonus
    const initialDeposit = 1000;
    await Transaction.create({
        userId,
        type: "credit",
        amount: initialDeposit,
        description: "Welcome bonus",
    });

    await Account.updateOne({ userId }, { $inc: { balance: initialDeposit } });

    const token = jwt.sign({ userId }, JWT_SECRET);
    res.json({ message: "User created successfully with a welcome bonus", token });
};

const signin = async (req, res) => {
    const { userName, password } = req.body;

    try {
        const user = await User.findOne({ userName: userName, password }); // Match username and password
        if (!user) {
            return res.status(411).json({ message: "Error while logging in" });
        }

        const account = await Account.findOne({ userId: user._id }); // Fetch user's account details
        if (!account) {
            return res.status(404).json({ message: "Account not found" });
        }

        const token = jwt.sign({ userId: user._id }, JWT_SECRET);

        res.json({
            token,
            name: `${user.firstName} ${user.lastName || ""}`,
            email: user.userName, // Assuming `userName` is the email
            balance: account.balance,
        });
    } catch (error) {
        res.status(500).json({ message: "Error during login", error: error.message });
    }
};

const updateUser = async (req, res) => {
    const { userId } = req;
    const updates = req.body;

    await User.updateOne({ _id: userId }, updates);
    res.json({ message: "Updated successfully" });
};

const getUsers = async (req, res) => {
    try {
        const filter = req.query.filter || "";
        const currentUserId = req.userId; // Get current user's ID from auth middleware

        const users = await User.find({
            $and: [
                {
                    $or: [
                        { firstName: { $regex: filter, $options: "i" } },
                        { lastName: { $regex: filter, $options: "i" } },
                    ]
                },
                { _id: { $ne: currentUserId } } // Exclude current user
            ]
        }).select('firstName lastName _id');

        res.json({
            users: users.map(user => ({
                firstName: user.firstName,
                lastName: user.lastName,
                _id: user._id,
            }))
        });
    } catch (error) {
        res.status(500).json({ message: "Error fetching users", error: error.message });
    }
};

const getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.userId);
        const account = await Account.findOne({ userId: req.userId });

        if (!user || !account) {
            return res.status(404).json({ message: "User or account not found" });
        }

        res.json({
            name: `${user.firstName} ${user.lastName || ""}`,
            email: user.userName, // Assuming `userName` is the email
            balance: account.balance,
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