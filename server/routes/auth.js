const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const User = require("../models/User");
const VerificationCode = require("../models/VerificationCode");
const { sendSignupVerificationEmail } = require("../utils/mailer");

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "change-me";
const REFRESH_TOKEN_TTL_MS = Number(
  process.env.REFRESH_TOKEN_TTL_MS || 1000 * 60 * 60 * 24 * 30
);
const VERIFICATION_CODE_TTL_MS = Number(
  process.env.SIGNUP_CODE_TTL_MS || 1000 * 60 * 10
);
const VERIFICATION_CODE_MAX_ATTEMPTS = Number(
  process.env.SIGNUP_CODE_MAX_ATTEMPTS || 5
);
const VERIFICATION_RESEND_COOLDOWN_MS = Number(
  process.env.SIGNUP_CODE_RESEND_COOLDOWN_MS || 60 * 1000
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

const hashVerificationCode = (code) =>
  crypto.createHash("sha256").update(code).digest("hex");

const generateVerificationCode = () =>
  Math.floor(100000 + Math.random() * 900000).toString();

const normalizeEmail = (rawEmail = "") => rawEmail.trim().toLowerCase();

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

router.post("/request-verification", async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) {
      return res
        .status(400)
        .json({ ok: false, error: "Email tələb olunur" });
    }

    const normalizedEmail = normalizeEmail(email);
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res
        .status(409)
        .json({ ok: false, error: "Bu email artıq qeydiyyatdadır" });
    }

    const existingRequest = await VerificationCode.findOne({
      email: normalizedEmail,
    });
    if (existingRequest) {
      const lastSentAt = existingRequest.updatedAt
        ? new Date(existingRequest.updatedAt).getTime()
        : 0;
      const elapsed = Date.now() - lastSentAt;
      if (elapsed < VERIFICATION_RESEND_COOLDOWN_MS) {
        const waitSeconds = Math.ceil(
          (VERIFICATION_RESEND_COOLDOWN_MS - elapsed) / 1000
        );
        return res.status(429).json({
          ok: false,
          error: `Kod artıq göndərilib. Zəhmət olmasa ${waitSeconds} saniyə gözlə.`,
        });
      }
    }

    const code = generateVerificationCode();
    await VerificationCode.findOneAndUpdate(
      { email: normalizedEmail },
      {
        email: normalizedEmail,
        codeHash: hashVerificationCode(code),
        expiresAt: new Date(Date.now() + VERIFICATION_CODE_TTL_MS),
        attempts: 0,
        resendCount: (existingRequest?.resendCount ?? 0) + 1,
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    await sendSignupVerificationEmail(normalizedEmail, code);
    return res.json({
      ok: true,
      message: "Təsdiq kodu email ünvanına göndərildi.",
    });
  } catch (err) {
    console.error("Signup verification request error:", err);
    return res.status(500).json({ ok: false, error: "Server xətası" });
  }
});

router.post("/signup", async (req, res) => {
  try {
    const { email, password, verificationCode } = req.body || {};

    if (!email || !password || !verificationCode) {
      return res
        .status(400)
        .json({ ok: false, error: "Email, şifrə və kod tələb olunur" });
    }

    const normalizedEmail = normalizeEmail(email);
    const existing = await User.findOne({ email: normalizedEmail });
    if (existing) {
      return res
        .status(409)
        .json({ ok: false, error: "Bu email artıq qeydiyyatdadır" });
    }

    const verification = await VerificationCode.findOne({
      email: normalizedEmail,
    });

    if (!verification) {
      return res.status(400).json({
        ok: false,
        error: "Təsdiq kodu tapılmadı. Zəhmət olmasa yenidən kod istəyin.",
      });
    }

    if (verification.expiresAt.getTime() < Date.now()) {
      await VerificationCode.deleteOne({ _id: verification._id });
      return res.status(400).json({
        ok: false,
        error: "Təsdiq kodunun müddəti bitib. Yenidən kod istəyin.",
      });
    }

    const providedCode = String(verificationCode).trim();
    const hashedCode = hashVerificationCode(providedCode);
    if (hashedCode !== verification.codeHash) {
      verification.attempts += 1;
      await verification.save();
      if (verification.attempts >= VERIFICATION_CODE_MAX_ATTEMPTS) {
        await VerificationCode.deleteOne({ _id: verification._id });
        return res.status(400).json({
          ok: false,
          error: "Çox sayda yalnış kod daxil edildi. Yenidən kod istəyin.",
        });
      }
      const attemptsLeft = Math.max(
        VERIFICATION_CODE_MAX_ATTEMPTS - verification.attempts,
        0
      );
      return res.status(400).json({
        ok: false,
        error: attemptsLeft
          ? `Kod yalnışdır. ${attemptsLeft} cəhd qaldı.`
          : "Kod yalnışdır.",
      });
    }

    await VerificationCode.deleteOne({ _id: verification._id });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({
      email: normalizedEmail,
      passwordHash,
      emailVerified: true,
    });
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

    const normalizedEmail = normalizeEmail(email);
    const user = await User.findOne({ email: normalizedEmail });
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
        .json({ ok: false, error: "Refresh token lazımdır" });
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
