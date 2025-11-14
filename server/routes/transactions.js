const express = require("express");
const Transaction = require("../models/Transaction");
const {
  parseMonthQuery,
  toBoolean,
  sanitizeRepeatRule,
  computeNextTriggerAt,
} = require("../utils/dates");

const router = express.Router();

router.post("/", async (req, res) => {
  try {
    const {
      type,
      category,
      amount,
      note,
      date,
      isRecurring,
      repeatRule,
      notify,
      nextTriggerAt,
    } = req.body || {};

    if (!type || !["income", "expense"].includes(type)) {
      return res.status(400).json({ ok: false, error: "Field 'type' must be income or expense" });
    }

    if (!category) {
      return res.status(400).json({ ok: false, error: "Field 'category' is required" });
    }

    if (typeof amount !== "number" || amount < 0) {
      return res.status(400).json({ ok: false, error: "Amount must be a positive number" });
    }

    let parsedDate = date ? new Date(date) : undefined;
    if (parsedDate && Number.isNaN(parsedDate.getTime())) {
      return res.status(400).json({ ok: false, error: "Invalid date provided" });
    }

    let repeatPayload = null;
    if (repeatRule) {
      repeatPayload = sanitizeRepeatRule(repeatRule);
    }

    const isRecurringFlag = toBoolean(isRecurring);
    if (isRecurringFlag && !repeatPayload) {
      return res.status(400).json({ ok: false, error: "repeatRule required when recurring" });
    }

    let triggerDate = nextTriggerAt ? new Date(nextTriggerAt) : null;
    if (triggerDate && Number.isNaN(triggerDate.getTime())) {
      return res.status(400).json({ ok: false, error: "Invalid nextTriggerAt" });
    }

    if (!triggerDate && isRecurringFlag) {
      triggerDate = computeNextTriggerAt(parsedDate || new Date(), repeatPayload);
    }

    const transaction = await Transaction.create({
      userId: req.user.id,
      type,
      category,
      amount,
      note,
      date: parsedDate,
      isRecurring: isRecurringFlag,
      repeatRule: repeatPayload,
      notify: toBoolean(notify),
      nextTriggerAt: triggerDate,
    });

    return res.status(201).json({ ok: true, data: transaction });
  } catch (err) {
    console.error("Create transaction error:", err);
    return res.status(500).json({ ok: false, error: "Could not create transaction" });
  }
});

router.get("/", async (req, res) => {
  try {
    const { month } = req.query;

    const filter = { userId: req.user.id };

    if (month) {
      const range = parseMonthQuery(month);
      if (!range) {
        return res.status(400).json({ ok: false, error: "month param must be YYYY-MM" });
      }
      filter.date = { $gte: range.start, $lt: range.end };
    }

    const list = await Transaction.find(filter).sort({ date: -1 });
    return res.json({ ok: true, data: list });
  } catch (err) {
    console.error("List transaction error:", err);
    return res.status(500).json({ ok: false, error: "Could not fetch transactions" });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deleted = await Transaction.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!deleted) {
      return res.status(404).json({ ok: false, error: "Transaction not found" });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("Delete transaction error:", err);
    return res.status(500).json({ ok: false, error: "Could not delete transaction" });
  }
});

module.exports = router;
