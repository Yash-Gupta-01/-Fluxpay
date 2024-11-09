const express = require("express");
const userRouter = require("./User");
const accountRouter = require("./account");
const router = express.Router();

router.use("/user" , userRouter);
router.use("/account", accountRouter);

module.exports = router;