const express = require("express");
const UserSettings = require("../models/UserSettings");

const router = express.Router();

router.get("/limits", async (req, res) => {
  try {
    const limits = await UserSettings.find({ userId: req.user.id }).sort({
      updatedAt: -1,
    });
    return res.json({ ok: true, data: limits });
  } catch (err) {
    console.error("List limits error:", err);
    return res.status(500).json({ ok: false, error: "Could not fetch limits" });
  }
});

router.post("/limits", async (req, res) => {
  try {
    const { category, monthlyLimit } = req.body || {};

    if (!category) {
      return res.status(400).json({ ok: false, error: "Category required" });
    }

    if (typeof monthlyLimit !== "number" || monthlyLimit <= 0) {
      return res.status(400).json({ ok: false, error: "monthlyLimit must be a positive number" });
    }

    const settings = await UserSettings.findOneAndUpdate(
      { userId: req.user.id, category },
      { $set: { monthlyLimit } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.json({ ok: true, data: settings });
  } catch (err) {
    console.error("Save limit error:", err);
    return res.status(500).json({ ok: false, error: "Could not save limit" });
  }
});

router.delete("/limits/:id", async (req, res) => {
  try {
    const deleted = await UserSettings.findOneAndDelete({
      _id: req.params.id,
      userId: req.user.id,
    });

    if (!deleted) {
      return res.status(404).json({ ok: false, error: "Limit not found" });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("Delete limit error:", err);
    return res.status(500).json({ ok: false, error: "Could not delete limit" });
  }
});

module.exports = router;
