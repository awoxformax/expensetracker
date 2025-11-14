const express = require("express");
const Transaction = require("../models/Transaction");
const {
  sanitizeRepeatRule,
  computeNextTriggerAt,
  toBoolean,
} = require("../utils/dates");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const { type, category, amount, note, date, repeatRule, notify } = req.body || {};

    if (!type || !["income", "expense"].includes(type)) {
      return res.status(400).json({ ok: false, error: "Invalid type" });
    }

    if (!category) {
      return res.status(400).json({ ok: false, error: "Category required" });
    }

    if (typeof amount !== "number" || amount < 0) {
      return res.status(400).json({ ok: false, error: "Amount must be positive" });
    }

    let parsedDate = new Date();
    if (date) {
      parsedDate = new Date(date);
      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({ ok: false, error: "Invalid date" });
      }
    }

    const rulePayload = sanitizeRepeatRule(repeatRule);
    const nextTriggerAt = computeNextTriggerAt(parsedDate, rulePayload);

    const transaction = await Transaction.create({
      userId: req.user.id,
      type,
      category,
      amount,
      note,
      date: parsedDate,
      isRecurring: true,
      repeatRule: rulePayload,
      notify: toBoolean(notify),
      nextTriggerAt,
    });

    return res.status(201).json({ ok: true, data: transaction });
  } catch (err) {
    console.error("Create recurring error:", err);
    return res.status(500).json({ ok: false, error: "Could not create recurring transaction" });
  }
});

router.get("/", async (req, res) => {
  try {
    const items = await Transaction.find({
      userId: req.user.id,
      isRecurring: true,
    }).sort({ nextTriggerAt: 1 });

    return res.json({ ok: true, data: items });
  } catch (err) {
    console.error("List recurring error:", err);
    return res.status(500).json({ ok: false, error: "Could not fetch recurring" });
  }
});

module.exports = router;
