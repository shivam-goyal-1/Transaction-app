const express = require("express");
const router = express.Router();
const { authmiddleware } = require("../middleware");
const { Account } = require("../db");

router.post("/transfer", authmiddleware, async (req, res) => {
  try {
    const { amount, to } = req.body;
    const transferAmount = Number(amount);

    // Find sender's account
    const fromAccount = await Account.findOne({ userid: req.userId });
    if (!fromAccount || fromAccount.balance < transferAmount) {
      return res.status(400).json({ message: "Insufficient balance" });
    }

    // Find receiver's account
    const toAccount = await Account.findOne({ userid: to });
    if (!toAccount) {
      return res.status(400).json({ message: "Recipient account not found" });
    }

    // Perform transfer
    await Account.updateOne(
      { userid: req.userId },
      { $inc: { balance: -transferAmount } },
    );
    await Account.updateOne(
      { userid: to },
      { $inc: { balance: transferAmount } },
    );

    res.json({ message: "Transfer successful" });
  } catch (err) {
    console.log("Transfer error:", err);
    res.status(500).json({ message: "Transfer failed" });
  }
});

router.get("/balance", authmiddleware, async (req, res) => {
  const account = await Account.findOne({ userid: req.userId });
  res.json({ balance: account.balance.toFixed(2) });
});

module.exports = router;
