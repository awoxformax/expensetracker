const { Schema, model } = require('mongoose');

const userSettingsSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: String, required: true, trim: true },
    monthlyLimit: { type: Number, required: true, min: 0 },
  },
  {
    collection: 'user_settings',
    timestamps: true,
  }
);

userSettingsSchema.index({ userId: 1, category: 1 }, { unique: true });

module.exports = model('UserSettings', userSettingsSchema);
