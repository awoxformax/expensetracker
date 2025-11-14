const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "change-me";

router.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ ok: false, error: "Email və şifrə tələb olunur" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ ok: false, error: "Bu email artıq qeydiyyatdadır" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash });

    const token = jwt.sign(
      { sub: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.status(201).json({
      ok: true,
      token,
      user: { id: user._id.toString(), email: user.email },
    });
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ ok: false, error: "Server xətası" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res.status(400).json({ ok: false, error: "Email və şifrə tələb olunur" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ ok: false, error: "Yanlış email və ya şifrə" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ ok: false, error: "Yanlış email və ya şifrə" });
    }

    const token = jwt.sign(
      { sub: user._id.toString(), email: user.email },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return res.json({
      ok: true,
      token,
      user: { id: user._id.toString(), email: user.email },
    });
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ ok: false, error: "Server xətası" });
  }
});

module.exports = router;
