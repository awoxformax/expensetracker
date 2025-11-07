const { Schema, model } = require('mongoose');

const repeatRuleSchema = new Schema(
  {
    freq: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
    dayOfMonth: { type: Number, min: 1, max: 31 },
    weekday: { type: Number, min: 0, max: 6 },
  },
  { _id: false }
);

const transactionSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    type: { type: String, enum: ['income', 'expense'], required: true },
    category: { type: String, required: true, trim: true },
    amount: { type: Number, required: true, min: 0 },
    note: { type: String, trim: true },
    date: { type: Date, default: Date.now },
    isRecurring: { type: Boolean, default: false },
    repeatRule: repeatRuleSchema,
    notify: { type: Boolean, default: false },
    nextTriggerAt: { type: Date },
  },
  {
    timestamps: true,
    collection: 'transactions',
  }
);

transactionSchema.pre('validate', function transactionValidate(next) {
  if (this.isRecurring && !this.repeatRule) {
    return next(new Error('repeatRule is required for recurring transactions'));
  }
  if (this.repeatRule && !this.repeatRule.freq) {
    return next(new Error('repeatRule.freq is required when repeatRule is provided'));
  }
  return next();
});

module.exports = model('Transaction', transactionSchema);
