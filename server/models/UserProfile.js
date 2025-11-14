const { Schema, model } = require('mongoose');

const categorySchema = new Schema(
  {
    id: { type: String, required: true },
    name: { type: String, required: true },
    description: { type: String },
    period: { type: String, enum: ['daily', 'monthly'], default: 'monthly' },
    icon: { type: String },
    type: { type: String, enum: ['income', 'expense'], default: 'expense' },
  },
  { _id: false }
);

const userProfileSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    firstName: { type: String, trim: true },
    lastName: { type: String, trim: true },
    phone: { type: String, trim: true },
    persona: { type: String, enum: ['student', 'worker', 'family'], default: null },
    incomeType: { type: String, enum: ['salary', 'scholarship', 'freelancer', 'additional'], default: null },
    budget: { type: Number, default: null },
    categories: { type: [categorySchema], default: [] },
    onboardingCompleted: { type: Boolean, default: false },
  },
  { collection: 'user_profiles', timestamps: true }
);

module.exports = model('UserProfile', userProfileSchema);
