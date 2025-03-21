const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../Middlewares/auth");
const {
    signup,
    signin,
    updateUser,
    getUsers,
    getProfile, // Import the new function
} = require("../controllers/userController");

router.post("/signup", signup);
router.post("/signin", signin);
router.put("/", authMiddleware, updateUser);
router.get("/bulk", authMiddleware, getUsers); // Add authMiddleware
router.get("/profile", authMiddleware, getProfile); // Add the new route

module.exports = router;