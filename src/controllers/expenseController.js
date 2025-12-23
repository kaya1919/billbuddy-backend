const pool = require("../db");

const createExpenseEqual = async (req, res) => {
  const client = await pool.connect();

  try {
    const { groupId, payerId, amount } = req.body;

    if (!groupId || !payerId || !amount) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const amountCents = Math.round(amount * 100);

    await client.query("BEGIN");

    const usersResult = await client.query(
      "SELECT user_id FROM group_members WHERE group_id = $1",
      [groupId]
    );

    const users = usersResult.rows.map((row) => row.user_id);

    if (users.length === 0) {
      await client.query("ROLLBACK");
      return res.status(400).json({ error: "Group has no users" });
    }

    const splitAmount = Math.floor(amountCents / users.length);

    const expenseResult = await client.query(
      `INSERT INTO expenses (group_id, payer_id, amount_cents, split_type)
       VALUES ($1, $2, $3, 'EQUAL')
       RETURNING id`,
      [groupId, payerId, amountCents]
    );

    const expenseId = expenseResult.rows[0].id;

    for (let userId of users) {
      await client.query(
        `INSERT INTO splits (expense_id, user_id, amount_cents)
         VALUES ($1, $2, $3)`,
        [expenseId, userId, splitAmount]
      );

      if (userId !== payerId) {
        await client.query(
          `INSERT INTO balances (from_user, to_user, amount_cents)
           VALUES ($1, $2, $3)
           ON CONFLICT (from_user, to_user)
           DO UPDATE SET amount_cents = balances.amount_cents + $3`,
          [userId, payerId, splitAmount]
        );
      }
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Expense added with equal split",
      expenseId,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
};
const createExpenseExact = async (req, res) => {
  const client = await pool.connect();

  try {
    const { groupId, payerId, splits } = req.body;
    // splits = [{ userId: 2, amount: 100 }, { userId: 3, amount: 200 }]

    if (!groupId || !payerId || !splits || splits.length === 0) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    await client.query("BEGIN");

    // calculate total amount
    let totalCents = 0;
    for (let s of splits) {
      totalCents += Math.round(s.amount * 100);
    }

    // insert expense
    const expenseResult = await client.query(
      `INSERT INTO expenses (group_id, payer_id, amount_cents, split_type)
       VALUES ($1, $2, $3, 'EXACT')
       RETURNING id`,
      [groupId, payerId, totalCents]
    );

    const expenseId = expenseResult.rows[0].id;

    // insert splits + balances
    for (let s of splits) {
      const splitCents = Math.round(s.amount * 100);

      await client.query(
        `INSERT INTO splits (expense_id, user_id, amount_cents)
         VALUES ($1, $2, $3)`,
        [expenseId, s.userId, splitCents]
      );

      if (s.userId !== payerId) {
        await client.query(
          `INSERT INTO balances (from_user, to_user, amount_cents)
           VALUES ($1, $2, $3)
           ON CONFLICT (from_user, to_user)
           DO UPDATE SET amount_cents = balances.amount_cents + $3`,
          [s.userId, payerId, splitCents]
        );
      }
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Expense added with exact split",
      expenseId,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
};
const createExpensePercentage = async (req, res) => {
  const client = await pool.connect();

  try {
    const { groupId, payerId, amount, splits } = req.body;
    // splits = [{ userId: 2, percent: 40 }, { userId: 3, percent: 60 }]

    if (!groupId || !payerId || !amount || !splits || splits.length === 0) {
      return res.status(400).json({ error: "Invalid request body" });
    }

    const amountCents = Math.round(amount * 100);

    // validate percentage total = 100
    const totalPercent = splits.reduce((sum, s) => sum + s.percent, 0);
    if (totalPercent !== 100) {
      return res.status(400).json({ error: "Percentages must total 100" });
    }

    await client.query("BEGIN");

    // insert expense
    const expenseResult = await client.query(
      `INSERT INTO expenses (group_id, payer_id, amount_cents, split_type)
       VALUES ($1, $2, $3, 'PERCENT')
       RETURNING id`,
      [groupId, payerId, amountCents]
    );

    const expenseId = expenseResult.rows[0].id;

    let allocated = 0;

    for (let i = 0; i < splits.length; i++) {
      const s = splits[i];
      let splitCents;

      if (i === splits.length - 1) {
        // last user gets remaining cents (rounding fix)
        splitCents = amountCents - allocated;
      } else {
        splitCents = Math.floor((amountCents * s.percent) / 100);
        allocated += splitCents;
      }

      await client.query(
        `INSERT INTO splits (expense_id, user_id, amount_cents)
         VALUES ($1, $2, $3)`,
        [expenseId, s.userId, splitCents]
      );

      if (s.userId !== payerId) {
        await client.query(
          `INSERT INTO balances (from_user, to_user, amount_cents)
           VALUES ($1, $2, $3)
           ON CONFLICT (from_user, to_user)
           DO UPDATE SET amount_cents = balances.amount_cents + $3`,
          [s.userId, payerId, splitCents]
        );
      }
    }

    await client.query("COMMIT");

    res.status(201).json({
      message: "Expense added with percentage split",
      expenseId,
    });
  } catch (err) {
    await client.query("ROLLBACK");
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  } finally {
    client.release();
  }
};


module.exports = {
  createExpenseEqual,
  createExpenseExact,
  createExpensePercentage
};
