require("dotenv").config();
const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("BillBuddy backend is running");
});

app.use("/users", require("./routes/userRoutes"));
app.use("/groups", require("./routes/groupRoutes"));
app.use("/expenses", require("./routes/expenseRoutes"));
app.use("/balances", require("./routes/balanceRoutes"));
app.use("/simplify", require("./routes/simplifyRoutes"));
app.use("/settle", require("./routes/settlementRoutes"));



const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
