const express = require("express");
const router = express.Router();

const userRouter = require("./User");
const accountRouter = require("./account");
const notificationRoutes = require("./notification");
const transactionRoutes = require ("../Routes/transaction");

router.use("/user" , userRouter);
router.use("/account", accountRouter);
router.use("/transaction", transactionRoutes);
router.use("/notification", notificationRoutes);

module.exports = router;
