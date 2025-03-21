const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../Middlewares/auth");
const { getBalance, transfer, getUserName } = require("../controllers/accountController");

router.get("/balance", authMiddleware, getBalance);
router.post("/transfer", authMiddleware, transfer);
router.get("/user/:id", authMiddleware, getUserName);

module.exports = router;