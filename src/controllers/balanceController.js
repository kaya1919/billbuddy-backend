const pool = require("../db");

// Get balances for a user
const getUserBalances = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await pool.query(
      `SELECT from_user, to_user, amount_cents
       FROM balances
       WHERE from_user = $1 OR to_user = $1`,
      [userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  getUserBalances,
};
