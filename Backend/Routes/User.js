const express = require('express');

const router = express.Router();
const zod = require("zod");
const { User, Account } = require("../Database/db");
const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config");
const  { authMiddleware } = require("../Middlewares/auth");
const signupBody = zod.object({ //zod is a library for data validation in javascript used here for validating the user inputs
    username: zod.string().email(),
	firstName: zod.string(),
	lastName: zod.string(),
	password: zod.string()
})
router.post("/signup", async (req, res) => {
    const { success } = signupBody.safeParse(req.body)
    if (!success) {
        return res.status(411).json({
            message: "Email already taken / Incorrect inputs"
        })
    }
    //console.log(User); This should log the User model or an error if undefinedconsole.log(User); // This should log the User model or an error if undefined
    const existingUser = await User.findOne({
        username: req.body.username
    })
    if (existingUser) {
        return res.status(411).json({
            message: "Email already taken/Incorrect inputs"
        })
    }
    const user = await User.create({
        username: req.body.username,
        password: req.body.password,
        firstName: req.body.firstName, //this is for signing up the user 
        lastName: req.body.lastName,
    })
    const userId = user._id;
    await Account.create({
        userId,
        balance: 1 + Math.random() * 10005
    })
    const token = jwt.sign({
        userId
    }, JWT_SECRET);
    res.json({
        message: "User created successfully",
        token: token
    })
})
const signinBody = zod.object({
    username: zod.string().email(),
	password: zod.string()
})
router.post("/signin", async (req, res) => {
    const { success } = signinBody.safeParse(req.body)
    if (!success) {
        return res.status(411).json({ //this is for signing in the user with the correct credentials
            message: " Incorrect inputs"
        })
    }
    const user = await User.findOne({
        username: req.body.username,
        password: req.body.password //this is for signing in the user
    });
    if (user) {
        const token = jwt.sign({
            userId: user._id
        }, JWT_SECRET);
        res.json({
            token: token
        })
        return;
    }
    res.status(411).json({
        message: "Error while logging in"
    })
})
const updateBody = zod.object({
	password: zod.string().optional(),
    firstName: zod.string().optional(),
    lastName: zod.string().optional(),
})
router.put("/",authMiddleware, async (req, res) => {
    const { success } = updateBody.safeParse(req.body)
    if (!success) {  //this is for updating the user information
        res.status(411).json({
            message: "Error while updating information"
        })
    }

    await User.updateOne(req.body, {
        id: req.userId
    })
    res.json({
        message: "Updated successfully"
    })
})
router.get("/bulk", async (req, res) => {
    const filter = req.query.filter || "";

    const users = await User.find({
        $or: [{                     //these queries is for finding user by first name or last name from the database
            firstName: {
                "$regex": filter
            }
        }, {
            lastName: {
                "$regex": filter
            }
        }]
    })
    res.json({
        user: users.map(user => ({
            username: user.username,
            firstName: user.firstName, //this is for getting the user information
            lastName: user.lastName,
            _id: user._id
        }))
    })
})
module.exports = router; //exporting the router