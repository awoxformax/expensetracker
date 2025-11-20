const { Schema, model } = require("mongoose");

const verificationSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    codeHash: { type: String, required: true },
    expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 },
    resendCount: { type: Number, default: 0 },
  },
  {
    collection: "email_verifications",
    timestamps: true,
  }
);

verificationSchema.index({ email: 1 }, { unique: true });
verificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = model("EmailVerification", verificationSchema);
