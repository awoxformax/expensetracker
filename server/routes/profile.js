const express = require("express");
const UserProfile = require("../models/UserProfile");
const { mapProfileDoc, sanitizeProfilePayload } = require("../utils/sanitize");

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ userId: req.user.id });
    return res.json({ ok: true, data: mapProfileDoc(profile) });
  } catch (err) {
    console.error("Fetch profile error:", err);
    return res.status(500).json({ ok: false, error: "Could not load profile" });
  }
});

router.put("/", async (req, res) => {
  try {
    const payload = sanitizeProfilePayload(req.body || {});
    const updated = await UserProfile.findOneAndUpdate(
      { userId: req.user.id },
      { $set: payload, $setOnInsert: { userId: req.user.id } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return res.json({ ok: true, data: mapProfileDoc(updated) });
  } catch (err) {
    console.error("Update profile error:", err);
    return res.status(400).json({ ok: false, error: err.message });
  }
});

module.exports = router;
