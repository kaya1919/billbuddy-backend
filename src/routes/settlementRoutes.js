const express = require("express");
const router = express.Router();
const { settleBalance } = require("../controllers/settlementController");

// POST /settle
router.post("/", settleBalance);

module.exports = router;
