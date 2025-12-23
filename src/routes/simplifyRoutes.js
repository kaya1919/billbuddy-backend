const express = require("express");
const router = express.Router();
const { simplifyBalances } = require("../controllers/simplifyController");

// GET /simplify
router.get("/", simplifyBalances);

module.exports = router;
