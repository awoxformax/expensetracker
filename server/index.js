require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Transaction = require('./models/Transaction');
const UserSettings = require('./models/UserSettings');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 4000;
const RAW_MONGO_URI = process.env.MONGO_URI;
let MONGO_URI = RAW_MONGO_URI;
// If user pasted a cluster URI without DB name like ...mongodb.net/?appName=Awox
// append /expensetracker before the query to ensure a database is selected
if (MONGO_URI && /^mongodb(\+srv)?:\/\/[^/]+\/\?/.test(MONGO_URI)) {
  MONGO_URI = MONGO_URI.replace('/?', '/expensetracker?');
}
const JWT_SECRET = process.env.JWT_SECRET || 'change-me';

if (!MONGO_URI) {
  console.error("Missing MONGO_URI in environment");
  process.exit(1);
}

mongoose
  .connect(MONGO_URI, { autoIndex: true })
  .then(() => console.log('MongoDB connected'))
  .catch((err) => {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  });

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: 'users' }
);

const User = mongoose.model('User', userSchema);

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7).trim() : null;
  if (!token) {
    return res.status(401).json({ ok: false, error: 'Authentication required' });
  }

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.user = { id: payload.sub, email: payload.email };
    return next();
  } catch (err) {
    return res.status(401).json({ ok: false, error: 'Invalid or expired token' });
  }
};

const parseMonthQuery = (monthStr) => {
  if (!monthStr) return null;
  const match = /^(\d{4})-(\d{2})$/.exec(monthStr);
  if (!match) return null;
  const year = Number(match[1]);
  const monthIndex = Number(match[2]) - 1;
  if (Number.isNaN(year) || Number.isNaN(monthIndex) || monthIndex < 0 || monthIndex > 11) {
    return null;
  }
  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1));
  return { start, end };
};

const toBoolean = (value) => value === true || value === 'true' || value === 1 || value === '1';

const sanitizeRepeatRule = (repeatRule) => {
  if (!repeatRule || typeof repeatRule !== 'object') {
    return null;
  }
  const freq = repeatRule.freq;
  if (!['daily', 'weekly', 'monthly'].includes(freq)) {
    throw new Error('repeatRule.freq must be daily, weekly or monthly');
  }
  const sanitized = { freq };
  if (repeatRule.dayOfMonth !== undefined) {
    const dom = Number(repeatRule.dayOfMonth);
    if (Number.isNaN(dom) || dom < 1 || dom > 31) {
      throw new Error('repeatRule.dayOfMonth must be between 1 and 31');
    }
    sanitized.dayOfMonth = dom;
  }
  if (repeatRule.weekday !== undefined) {
    const weekday = Number(repeatRule.weekday);
    if (Number.isNaN(weekday) || weekday < 0 || weekday > 6) {
      throw new Error('repeatRule.weekday must be between 0 and 6');
    }
    sanitized.weekday = weekday;
  }
  return sanitized;
};

const daysInMonth = (year, monthIndex) => {
  return new Date(year, monthIndex + 1, 0).getDate();
};

const computeNextTriggerAt = (baseDate, repeatRule) => {
  if (!repeatRule) return null;
  const from = new Date(baseDate || Date.now());
  if (Number.isNaN(from.getTime())) {
    return new Date(Date.now());
  }
  const result = new Date(from);
  switch (repeatRule.freq) {
    case 'daily':
      result.setDate(result.getDate() + 1);
      return result;
    case 'weekly': {
      if (typeof repeatRule.weekday === 'number') {
        const diff = (repeatRule.weekday - result.getDay() + 7) % 7;
        const addDays = diff === 0 ? 7 : diff;
        result.setDate(result.getDate() + addDays);
      } else {
        result.setDate(result.getDate() + 7);
      }
      return result;
    }
    case 'monthly': {
      const targetDay =
        typeof repeatRule.dayOfMonth === 'number' ? repeatRule.dayOfMonth : result.getDate();
      const nextMonth = new Date(result);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const maxDay = daysInMonth(nextMonth.getFullYear(), nextMonth.getMonth());
      nextMonth.setDate(Math.min(targetDay, maxDay));
      return nextMonth;
    }
    default:
      return result;
  }
};

app.get('/health', (req, res) => {
  res.json({ ok: true, status: 'healthy' });
});

app.post('/auth/signup', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'Email və şifrə tələb olunur' });
    }
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ ok: false, error: 'Bu email artıq qeydiyyatdadır' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ email, passwordHash });
    const token = jwt.sign({ sub: user._id.toString(), email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    return res.status(201).json({ ok: true, token, user: { id: user._id.toString(), email: user.email } });
  } catch (e) {
    console.error('Signup error:', e);
    return res.status(500).json({ ok: false, error: 'Server xətası' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: 'Email və şifrə tələb olunur' });
    }
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ ok: false, error: 'Yanlış email və ya şifrə' });
    }
    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ ok: false, error: 'Yanlış email və ya şifrə' });
    }
    const token = jwt.sign({ sub: user._id.toString(), email: user.email }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ ok: true, token, user: { id: user._id.toString(), email: user.email } });
  } catch (e) {
    console.error('Login error:', e);
    return res.status(500).json({ ok: false, error: 'Server xətası' });
  }
});

const transactionsRouter = express.Router();

transactionsRouter.use(authenticate);

transactionsRouter.post('/', async (req, res) => {
  try {
    const {
      type,
      category,
      amount,
      note,
      date,
      isRecurring,
      repeatRule,
      notify,
      nextTriggerAt,
    } = req.body || {};

    if (!type || !['income', 'expense'].includes(type)) {
      return res.status(400).json({ ok: false, error: 'Field "type" must be income or expense' });
    }
    if (!category) {
      return res.status(400).json({ ok: false, error: 'Field "category" is required' });
    }
    if (typeof amount !== 'number' || Number.isNaN(amount) || amount < 0) {
      return res.status(400).json({ ok: false, error: 'Field "amount" must be a positive number' });
    }

    let parsedDate;
    if (date) {
      parsedDate = new Date(date);
      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({ ok: false, error: 'Invalid date provided' });
      }
    }

    let repeatRulePayload = null;
    if (repeatRule) {
      try {
        repeatRulePayload = sanitizeRepeatRule(repeatRule);
      } catch (err) {
        return res.status(400).json({ ok: false, error: err.message });
      }
    }
    const isRecurringFlag = toBoolean(isRecurring);
    if (isRecurringFlag && !repeatRulePayload) {
      return res.status(400).json({ ok: false, error: 'repeatRule is required when isRecurring is true' });
    }

    let parsedNextTrigger;
    if (nextTriggerAt) {
      parsedNextTrigger = new Date(nextTriggerAt);
      if (Number.isNaN(parsedNextTrigger.getTime())) {
        return res.status(400).json({ ok: false, error: 'Invalid nextTriggerAt provided' });
      }
    }
    if (!parsedNextTrigger && isRecurringFlag && repeatRulePayload) {
      parsedNextTrigger = computeNextTriggerAt(parsedDate || new Date(), repeatRulePayload);
    }

    const transaction = await Transaction.create({
      userId: req.user.id,
      type,
      category,
      amount,
      note,
      date: parsedDate || undefined,
      isRecurring: isRecurringFlag,
      repeatRule: repeatRulePayload,
      notify: toBoolean(notify),
      nextTriggerAt: parsedNextTrigger,
    });

    return res.status(201).json({ ok: true, data: transaction });
  } catch (e) {
    console.error('Create transaction error:', e);
    return res.status(500).json({ ok: false, error: 'Could not create transaction' });
  }
});

transactionsRouter.get('/', async (req, res) => {
  try {
    const { month } = req.query;
    const filter = { userId: req.user.id };

    if (month) {
      const range = parseMonthQuery(month);
      if (!range) {
        return res.status(400).json({ ok: false, error: 'month param must be YYYY-MM' });
      }
      filter.date = { $gte: range.start, $lt: range.end };
    }

    const transactions = await Transaction.find(filter).sort({ date: -1, createdAt: -1 });
    return res.json({ ok: true, data: transactions });
  } catch (e) {
    console.error('List transaction error:', e);
    return res.status(500).json({ ok: false, error: 'Could not fetch transactions' });
  }
});

transactionsRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Transaction.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!deleted) {
      return res.status(404).json({ ok: false, error: 'Transaction not found' });
    }
    return res.json({ ok: true });
  } catch (e) {
    console.error('Delete transaction error:', e);
    return res.status(500).json({ ok: false, error: 'Could not delete transaction' });
  }
});

transactionsRouter.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const updates = {};

    if (Object.prototype.hasOwnProperty.call(body, 'amount')) {
      if (typeof body.amount !== 'number' || Number.isNaN(body.amount) || body.amount < 0) {
        return res.status(400).json({ ok: false, error: 'amount must be a positive number' });
      }
      updates.amount = body.amount;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'note')) {
      if (body.note != null && typeof body.note !== 'string') {
        return res.status(400).json({ ok: false, error: 'note must be a string' });
      }
      updates.note = body.note;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'category')) {
      if (!body.category) {
        return res.status(400).json({ ok: false, error: 'category cannot be empty' });
      }
      updates.category = body.category;
    }

    if (!Object.keys(updates).length) {
      return res.status(400).json({ ok: false, error: 'No editable fields provided' });
    }

    const updated = await Transaction.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      { $set: updates },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ ok: false, error: 'Transaction not found' });
    }

    return res.json({ ok: true, data: updated });
  } catch (e) {
    console.error('Update transaction error:', e);
    return res.status(500).json({ ok: false, error: 'Could not update transaction' });
  }
});

app.use('/api/transactions', transactionsRouter);

const settingsRouter = express.Router();
settingsRouter.use(authenticate);

settingsRouter.get('/limits', async (req, res) => {
  try {
    const limits = await UserSettings.find({ userId: req.user.id }).sort({ updatedAt: -1 });
    return res.json({ ok: true, data: limits });
  } catch (e) {
    console.error('List limits error:', e);
    return res.status(500).json({ ok: false, error: 'Could not fetch limits' });
  }
});

settingsRouter.post('/limits', async (req, res) => {
  try {
    const { category, monthlyLimit } = req.body || {};
    if (!category) {
      return res.status(400).json({ ok: false, error: 'category is required' });
    }
    if (typeof monthlyLimit !== 'number' || Number.isNaN(monthlyLimit) || monthlyLimit <= 0) {
      return res.status(400).json({ ok: false, error: 'monthlyLimit must be a positive number' });
    }

    const normalizedCategory = String(category).trim();

    const settings = await UserSettings.findOneAndUpdate(
      { userId: req.user.id, category: normalizedCategory },
      { $set: { monthlyLimit } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.json({ ok: true, data: settings });
  } catch (e) {
    console.error('Save limit error:', e);
    if (e.code === 11000) {
      return res.status(409).json({ ok: false, error: 'Limit already exists for this category' });
    }
    return res.status(500).json({ ok: false, error: 'Could not save limit' });
  }
});

settingsRouter.delete('/limits/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await UserSettings.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!deleted) {
      return res.status(404).json({ ok: false, error: 'Limit not found' });
    }
    return res.json({ ok: true });
  } catch (e) {
    console.error('Delete limit error:', e);
    return res.status(500).json({ ok: false, error: 'Could not delete limit' });
  }
});

app.use('/api/settings', settingsRouter);

const recurringRouter = express.Router();
recurringRouter.use(authenticate);

recurringRouter.post('/', async (req, res) => {
  try {
    const { type, category, amount, note, date, repeatRule, notify } = req.body || {};

    if (!type || !['income', 'expense'].includes(type)) {
      return res.status(400).json({ ok: false, error: 'type must be income or expense' });
    }
    if (!category) {
      return res.status(400).json({ ok: false, error: 'category is required' });
    }
    if (typeof amount !== 'number' || Number.isNaN(amount) || amount < 0) {
      return res.status(400).json({ ok: false, error: 'amount must be a positive number' });
    }
    let baseDate = new Date();
    if (date) {
      const parsed = new Date(date);
      if (Number.isNaN(parsed.getTime())) {
        return res.status(400).json({ ok: false, error: 'Invalid date provided' });
      }
      baseDate = parsed;
    }

    let repeatRulePayload;
    try {
      repeatRulePayload = sanitizeRepeatRule(repeatRule);
    } catch (err) {
      return res.status(400).json({ ok: false, error: err.message });
    }

    if (!repeatRulePayload) {
      return res.status(400).json({ ok: false, error: 'repeatRule is required for recurring entries' });
    }

    const nextTriggerAt = computeNextTriggerAt(baseDate, repeatRulePayload);

    const transaction = await Transaction.create({
      userId: req.user.id,
      type,
      category,
      amount,
      note,
      date: baseDate,
      isRecurring: true,
      repeatRule: repeatRulePayload,
      notify: toBoolean(notify),
      nextTriggerAt,
    });

    return res.status(201).json({ ok: true, data: transaction });
  } catch (e) {
    console.error('Create recurring error:', e);
    return res.status(500).json({ ok: false, error: 'Could not create recurring transaction' });
  }
});

recurringRouter.get('/', async (req, res) => {
  try {
    const items = await Transaction.find({
      userId: req.user.id,
      isRecurring: true,
    }).sort({ nextTriggerAt: 1, createdAt: -1 });
    return res.json({ ok: true, data: items });
  } catch (e) {
    console.error('List recurring error:', e);
    return res.status(500).json({ ok: false, error: 'Could not fetch recurring transactions' });
  }
});

recurringRouter.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const updates = {};
    let needsRecalc = false;

    if (Object.prototype.hasOwnProperty.call(body, 'amount')) {
      if (typeof body.amount !== 'number' || Number.isNaN(body.amount) || body.amount < 0) {
        return res.status(400).json({ ok: false, error: 'amount must be a positive number' });
      }
      updates.amount = body.amount;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'category')) {
      if (!body.category) {
        return res.status(400).json({ ok: false, error: 'category cannot be empty' });
      }
      updates.category = body.category;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'note')) {
      if (body.note != null && typeof body.note !== 'string') {
        return res.status(400).json({ ok: false, error: 'note must be a string' });
      }
      updates.note = body.note;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'notify')) {
      updates.notify = toBoolean(body.notify);
    }

    if (Object.prototype.hasOwnProperty.call(body, 'type')) {
      if (!['income', 'expense'].includes(body.type)) {
        return res.status(400).json({ ok: false, error: 'type must be income or expense' });
      }
      updates.type = body.type;
    }

    if (body.date !== undefined) {
      const parsed = new Date(body.date);
      if (Number.isNaN(parsed.getTime())) {
        return res.status(400).json({ ok: false, error: 'Invalid date provided' });
      }
      updates.date = parsed;
      needsRecalc = true;
    }

    if (body.repeatRule !== undefined) {
      let rulePayload = null;
      try {
        rulePayload = sanitizeRepeatRule(body.repeatRule);
      } catch (err) {
        return res.status(400).json({ ok: false, error: err.message });
      }
      if (!rulePayload) {
        return res.status(400).json({ ok: false, error: 'repeatRule is required for recurring entries' });
      }
      updates.repeatRule = rulePayload;
      needsRecalc = true;
    }

    if (toBoolean(body.recalculateNextTrigger)) {
      needsRecalc = true;
    }

    if (!Object.keys(updates).length && !needsRecalc) {
      return res.status(400).json({ ok: false, error: 'No fields provided to update' });
    }

    const transaction = await Transaction.findOne({
      _id: id,
      userId: req.user.id,
      isRecurring: true,
    });

    if (!transaction) {
      return res.status(404).json({ ok: false, error: 'Recurring transaction not found' });
    }

    Object.assign(transaction, updates);

    if (needsRecalc || !transaction.nextTriggerAt) {
      transaction.nextTriggerAt = computeNextTriggerAt(
        transaction.date || new Date(),
        transaction.repeatRule
      );
    }

    await transaction.save();

    return res.json({ ok: true, data: transaction });
  } catch (e) {
    console.error('Update recurring error:', e);
    return res.status(500).json({ ok: false, error: 'Could not update recurring transaction' });
  }
});

recurringRouter.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Transaction.findOneAndDelete({
      _id: id,
      userId: req.user.id,
      isRecurring: true,
    });

    if (!deleted) {
      return res.status(404).json({ ok: false, error: 'Recurring transaction not found' });
    }

    return res.json({ ok: true });
  } catch (e) {
    console.error('Delete recurring error:', e);
    return res.status(500).json({ ok: false, error: 'Could not delete recurring transaction' });
  }
});

app.use('/api/recurring', recurringRouter);

app.listen(PORT, () => {
  console.log(`Auth server running on http://localhost:${PORT}`);
});
