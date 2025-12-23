const pool = require("../db");

const simplifyBalances = async (req, res) => {
  try {
    // 1. Read all balances
    const { rows } = await pool.query(
      "SELECT from_user, to_user, amount_cents FROM balances"
    );

    // 2. Compute net balance per user
    const net = {};

    for (let b of rows) {
      net[b.from_user] = (net[b.from_user] || 0) - b.amount_cents;
      net[b.to_user] = (net[b.to_user] || 0) + b.amount_cents;
    }

    // 3. Separate debtors and creditors
    const debtors = [];
    const creditors = [];

    for (let userId in net) {
      if (net[userId] < 0) {
        debtors.push({ userId: Number(userId), amount: -net[userId] });
      } else if (net[userId] > 0) {
        creditors.push({ userId: Number(userId), amount: net[userId] });
      }
    }

    // 4. Greedy settlement
    const simplified = [];
    let i = 0, j = 0;

    while (i < debtors.length && j < creditors.length) {
      const pay = Math.min(debtors[i].amount, creditors[j].amount);

      simplified.push({
        from_user: debtors[i].userId,
        to_user: creditors[j].userId,
        amount_cents: pay
      });

      debtors[i].amount -= pay;
      creditors[j].amount -= pay;

      if (debtors[i].amount === 0) i++;
      if (creditors[j].amount === 0) j++;
    }

    res.json(simplified);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
  }
};

module.exports = {
  simplifyBalances,
};
