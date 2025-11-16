const { Schema, model } = require("mongoose");

const userSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    passwordHash: { type: String, required: true },
    refreshTokenHash: { type: String },
    refreshTokenExpiresAt: { type: Date },
  },
  {
    collection: "users",
    timestamps: true,
  }
);

userSchema.index({ email: 1 }, { unique: true });

module.exports = model("User", userSchema);
