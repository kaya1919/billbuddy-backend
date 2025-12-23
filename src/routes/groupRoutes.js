const express = require("express");
const router = express.Router();
const {
  createGroup,
  addUserToGroup,
} = require("../controllers/groupController");

router.post("/", createGroup);
router.post("/add-user", addUserToGroup);

module.exports = router;
