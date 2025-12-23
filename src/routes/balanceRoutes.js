const express = require("express");
const router = express.Router();
const { getUserBalances } = require("../controllers/balanceController");

// GET /balances/user/:userId
router.get("/user/:userId", getUserBalances);

module.exports = router;
