const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "change-me";
const REFRESH_TOKEN_TTL_MS = Number(
  process.env.REFRESH_TOKEN_TTL_MS || 1000 * 60 * 60 * 24 * 30
);

const createAccessToken = (user) =>
  jwt.sign(
    { sub: user._id.toString(), email: user.email },
    JWT_SECRET,
    { expiresIn: "7d" }
  );

const generateRefreshToken = () => crypto.randomBytes(48).toString("hex");
const hashRefreshToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

async function issueRefreshToken(user) {
  const token = generateRefreshToken();
  user.refreshTokenHash = hashRefreshToken(token);
  user.refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);
  await user.save();
  return token;
}

const buildAuthResponse = async (user) => {
  const token = createAccessToken(user);
  const refreshToken = await issueRefreshToken(user);
  return {
    ok: true,
    token,
    refreshToken,
    user: { id: user._id.toString(), email: user.email },
  };
};

router.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res
        .status(400)
        .json({ ok: false, error: "Email və şifrə tələb olunur" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res
        .status(409)
        .json({ ok: false, error: "Bu email artıq qeydiyyatdadır" });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash });
    const authPayload = await buildAuthResponse(user);
    return res.status(201).json(authPayload);
  } catch (err) {
    console.error("Signup error:", err);
    return res.status(500).json({ ok: false, error: "Server xətası" });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body || {};

    if (!email || !password) {
      return res
        .status(400)
        .json({ ok: false, error: "Email və şifrə tələb olunur" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res
        .status(401)
        .json({ ok: false, error: "Yanlış email və ya şifrə" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res
        .status(401)
        .json({ ok: false, error: "Yanlış email və ya şifrə" });
    }

    const authPayload = await buildAuthResponse(user);
    return res.json(authPayload);
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).json({ ok: false, error: "Server xətası" });
  }
});

router.post("/refresh", async (req, res) => {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) {
      return res
        .status(400)
        .json({ ok: false, error: "Refresh token lazımlıdır" });
    }

    const hashed = hashRefreshToken(refreshToken);
    const now = new Date();
    const user = await User.findOne({
      refreshTokenHash: hashed,
      refreshTokenExpiresAt: { $gt: now },
    });

    if (!user) {
      return res
        .status(401)
        .json({ ok: false, error: "Refresh token etibarsızdır" });
    }

    const authPayload = await buildAuthResponse(user);
    return res.json(authPayload);
  } catch (err) {
    console.error("Refresh token error:", err);
    return res.status(500).json({ ok: false, error: "Server xətası" });
  }
});

module.exports = router;
