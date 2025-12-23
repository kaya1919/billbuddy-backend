const express = require("express");
const router = express.Router();
const {
  createExpenseEqual,
  createExpenseExact,
  createExpensePercentage,
} = require("../controllers/expenseController");

router.post("/equal", createExpenseEqual);
router.post("/exact", createExpenseExact);
router.post("/percentage", createExpensePercentage);

module.exports = router;
