const pool = require("../db");

const settleBalance = async (req, res) => {
  const client = await pool.connect();

  try {
    const { fromUser, toUser, amount } = req.body;

    if (!fromUser || !toUser || !amount) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    const amountCents = Math.round(amount * 100);

    await client.query("BEGIN");

    // reduce balance
    const result = await client.query(
      `UPDATE balances
       SET amount_cents = amount_cents - $3
       WHERE from_user = $1 AND to_user = $2
       RETURNING amount_cents`,
      [fromUser, toUser, amountCents]
    );

    if (result.rowCount === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "No such balance exists" });
    }

    // delete if fully settled
    if (result.rows[0].amount_cents <= 0) {
      await client.query(
        `DELETE FROM balances
         WHERE from_user = $1 AND to_user = $2`,
        [fromUser, toUser]
      );
    }

    await client.query("COMMIT");

    res.json({ message: "Balance settled successfully" });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
};

module.exports = {
  settleBalance,
};
