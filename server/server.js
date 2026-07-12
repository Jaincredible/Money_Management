import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDb, getDb, isMockDb } from './db.js';
import { seedDatabase } from './seed.js';
import { runAgentChat } from './agent.js';
import {
  hashPassword, verifyPassword, signToken, requireAuth, sanitizeUser
} from './auth.js';
import {
  distributeIncomeToGoals, logActivity, pushNotification,
  EXPENSE_CATEGORIES, INCOME_CATEGORIES, SPENDING_PREFERENCES, savingsRateForMode
} from './heuristics.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// --- Boot: connect + auto-seed demo accounts if the DB is empty ---
try {
  const db = await connectDb();
  const userCount = await db.collection('users').countDocuments();
  if (userCount === 0) {
    console.log('No users found — seeding demo accounts...');
    await seedDatabase();
  }
  console.log(isMockDb()
    ? '⚠️  Using LOCAL file DB (db.json). Atlas unreachable — whitelist this IP in Atlas Network Access to use the cluster.'
    : '✅ Connected to MongoDB Atlas.');
} catch (e) {
  console.error('Fatal: database init failed on startup!', e);
  process.exit(1);
}

const norm = (s) => String(s || '').trim().toLowerCase();

/* ============================ AUTH (public) ============================ */

// Sign up a brand-new user (starts with an empty financial slate).
app.post('/api/auth/signup', async (req, res) => {
  try {
    const db = getDb();
    const {
      username, email, password, fullName,
      address, country, state, city, collegeName,
      monthlyIncome, savingsMode, spendingPreferences
    } = req.body;

    if (!username || !email || !password || !fullName) {
      return res.status(400).json({ error: 'Username, email, password and full name are required.' });
    }
    if (String(password).length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    const uname = norm(username);
    const mail = norm(email);
    if (!/^[a-z0-9_.]{3,20}$/.test(uname)) {
      return res.status(400).json({ error: 'Username must be 3-20 chars: letters, numbers, _ or .' });
    }
    if (await db.collection('users').findOne({ username: uname })) {
      return res.status(409).json({ error: 'That username is already taken.' });
    }
    if (await db.collection('users').findOne({ email: mail })) {
      return res.status(409).json({ error: 'An account with that email already exists.' });
    }

    const _id = `usr_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    const user = {
      _id, username: uname, email: mail,
      passwordHash: await hashPassword(password),
      fullName,
      address: address || '', country: country || 'India',
      state: state || '', city: city || '',
      collegeName: collegeName || '',
      spendingPreferences: Array.isArray(spendingPreferences) ? spendingPreferences : [],
      monthlyIncome: Number(monthlyIncome) || 0,
      savingsMode: ['Conservative', 'Balanced', 'Aggressive'].includes(savingsMode) ? savingsMode : 'Balanced',
      xp: 0, level: 'Rookie Saver', nextLevel: 'Budget Pro', xpToNext: 300,
      badges: ['First Step'], autoSmsEnabled: false, chatSummary: '',
      savedByAi: 0, isDemo: false, featured: false,
      createdAt: new Date().toISOString()
    };
    await db.collection('users').insertOne(user);
    await pushNotification(db, _id, {
      type: 'system', emoji: '👋',
      title: `Welcome, ${fullName.split(' ')[0]}!`,
      message: `I'm FinAgent. Add your first expense or tell me what you spent, and I'll keep your budget and goals on track.`
    });

    res.json({ token: signToken(_id), user: sanitizeUser(user) });
  } catch (e) {
    console.error('Signup error:', e);
    res.status(500).json({ error: 'Could not create account.' });
  }
});

// Log in with username OR email.
app.post('/api/auth/login', async (req, res) => {
  try {
    const db = getDb();
    const { identifier, password } = req.body;
    if (!identifier || !password) return res.status(400).json({ error: 'Enter your username/email and password.' });
    const id = norm(identifier);
    const user = await db.collection('users').findOne({ $or: [{ username: id }, { email: id }] });
    if (!user || !(await verifyPassword(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid credentials. Please try again.' });
    }
    res.json({ token: signToken(user._id), user: sanitizeUser(user) });
  } catch (e) {
    console.error('Login error:', e);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// One-click demo bypass (only works for accounts explicitly flagged isDemo).
app.post('/api/auth/demo', async (req, res) => {
  try {
    const db = getDb();
    const { username } = req.body || {};
    const query = username ? { username: norm(username), isDemo: true } : { featured: true, isDemo: true };
    let user = await db.collection('users').findOne(query);
    if (!user) user = await db.collection('users').findOne({ isDemo: true });
    if (!user) return res.status(404).json({ error: 'No demo account available.' });
    res.json({ token: signToken(user._id), user: sanitizeUser(user) });
  } catch (e) {
    console.error('Demo login error:', e);
    res.status(500).json({ error: 'Demo login failed.' });
  }
});

// List demo accounts for the login page picker (no secrets).
app.get('/api/auth/demo-accounts', async (req, res) => {
  try {
    const db = getDb();
    const users = await db.collection('users').find({ isDemo: true }).toArray();
    res.json(users.map(u => ({
      username: u.username, fullName: u.fullName, city: u.city,
      college: u.collegeName, monthlyIncome: u.monthlyIncome,
      savingsMode: u.savingsMode, featured: !!u.featured
    })));
  } catch (e) {
    res.status(500).json({ error: 'Failed to list demo accounts' });
  }
});

// Metadata for signup form (categories + preferences).
app.get('/api/meta', (req, res) => {
  res.json({ expenseCategories: EXPENSE_CATEGORIES, incomeCategories: INCOME_CATEGORIES, spendingPreferences: SPENDING_PREFERENCES });
});

/* ===================== AUTHENTICATED (/api/me) ===================== */
// Everything below derives the user from the token — the client can never
// act on another user by changing an id.

app.get('/api/me', requireAuth, async (req, res) => {
  const db = getDb();
  const user = await db.collection('users').findOne({ _id: req.userId });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ user: sanitizeUser(user) });
});

// Aggregated data dump for the signed-in user.
app.get('/api/me/data', requireAuth, async (req, res) => {
  try {
    const db = getDb();
    const userId = req.userId;
    const user = await db.collection('users').findOne({ _id: userId });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const [transactions, goals, chatHistory, activityLog, notifications] = await Promise.all([
      db.collection('transactions').find({ userId }).toArray(),
      db.collection('goals').find({ userId }).toArray(),
      db.collection('chats').find({ userId }).toArray(),
      db.collection('activity_logs').find({ userId }).sort({ _id: -1 }).toArray(),
      db.collection('notifications').find({ userId }).sort({ _id: -1 }).toArray()
    ]);

    res.json({ user: sanitizeUser(user), transactions, goals, chatHistory, activityLog, notifications });
  } catch (e) {
    console.error('Data fetch error:', e);
    res.status(500).json({ error: 'Failed to fetch your data' });
  }
});

// Update profile (any subset of editable fields).
app.patch('/api/me/profile', requireAuth, async (req, res) => {
  try {
    const db = getDb();
    const allowed = ['fullName', 'address', 'country', 'state', 'city', 'collegeName',
      'monthlyIncome', 'savingsMode', 'spendingPreferences', 'autoSmsEnabled', 'name'];
    const updates = {};
    for (const k of allowed) if (req.body[k] !== undefined) updates[k] = req.body[k];
    if (updates.monthlyIncome !== undefined) updates.monthlyIncome = Number(updates.monthlyIncome) || 0;
    if (updates.savingsMode && !['Conservative', 'Balanced', 'Aggressive'].includes(updates.savingsMode)) delete updates.savingsMode;

    await db.collection('users').updateOne({ _id: req.userId }, { $set: updates });
    const user = await db.collection('users').findOne({ _id: req.userId });
    res.json({ success: true, user: sanitizeUser(user) });
  } catch (e) {
    console.error('Profile update error:', e);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Add a transaction. Income auto-allocates savings to goals.
app.post('/api/me/transactions', requireAuth, async (req, res) => {
  try {
    const db = getDb();
    const userId = req.userId;
    const { type, category, amount, description } = req.body;
    if (!type || !category || !amount) return res.status(400).json({ error: 'Missing transaction fields' });

    const tx = {
      id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      userId, type,
      category,
      amount: parseFloat(amount),
      description: description || (type === 'income' ? 'Income' : 'Expense'),
      date: new Date().toISOString()
    };
    await db.collection('transactions').insertOne(tx);
    await db.collection('users').updateOne({ _id: userId }, { $inc: { xp: 15 } });
    await logActivity(db, userId, {
      category: type === 'income' ? 'INCOME' : 'EXPENSE',
      description: `${type === 'income' ? 'Income' : 'Expense'} of ₹${tx.amount.toLocaleString('en-IN')} — ${tx.description} (${category})`
    });

    let allocation = null;
    if (type === 'income') {
      allocation = await distributeIncomeToGoals(db, userId, tx.amount);
    }
    res.json({ success: true, transaction: tx, allocation });
  } catch (e) {
    console.error('Add transaction error:', e);
    res.status(500).json({ error: 'Failed to record transaction' });
  }
});

app.delete('/api/me/transactions/:id', requireAuth, async (req, res) => {
  try {
    const db = getDb();
    const result = await db.collection('transactions').deleteOne({ userId: req.userId, id: req.params.id });
    if (!result.deletedCount) return res.status(404).json({ error: 'Transaction not found' });
    await logActivity(db, req.userId, { category: 'EXPENSE', description: 'Deleted a transaction' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

app.post('/api/me/goals', requireAuth, async (req, res) => {
  try {
    const db = getDb();
    const userId = req.userId;
    const { name, emoji, target, weeklyTarget, targetDate } = req.body;
    if (!name || !target) return res.status(400).json({ error: 'Goal name and target are required' });
    const goals = await db.collection('goals').find({ userId }).toArray();
    const nextId = goals.reduce((m, g) => (g.id > m ? g.id : m), 0) + 1;
    const goal = {
      id: nextId, userId, name, emoji: emoji || '🎯',
      target: parseFloat(target), saved: 0,
      weeklyTarget: parseFloat(weeklyTarget) || Math.max(200, Math.round(parseFloat(target) / 12 / 50) * 50),
      startDate: new Date().toISOString().split('T')[0],
      targetDate: targetDate || '', agentMonitoring: true
    };
    await db.collection('goals').insertOne(goal);
    await db.collection('users').updateOne({ _id: userId }, { $inc: { xp: 25 } });
    await logActivity(db, userId, { category: 'GOALS', description: `Created savings goal ${goal.emoji} ${name} (target ₹${goal.target.toLocaleString('en-IN')})` });
    await pushNotification(db, userId, { type: 'suggestion', emoji: '🎯', title: 'New goal set', message: `Tracking "${name}". I'll aim to move ₹${goal.weeklyTarget.toLocaleString('en-IN')}/week toward it.` });
    res.json({ success: true, goal });
  } catch (e) {
    console.error('Add goal error:', e);
    res.status(500).json({ error: 'Failed to save goal' });
  }
});

app.put('/api/me/goals/:id', requireAuth, async (req, res) => {
  try {
    const db = getDb();
    const goalId = parseInt(req.params.id);
    const { saved, weeklyTarget, targetDate } = req.body;
    const updates = {};
    if (saved !== undefined) updates.saved = parseFloat(saved);
    if (weeklyTarget !== undefined) updates.weeklyTarget = parseFloat(weeklyTarget);
    if (targetDate !== undefined) updates.targetDate = targetDate;
    const result = await db.collection('goals').updateOne({ userId: req.userId, id: goalId }, { $set: updates });
    if (!result.matchedCount) return res.status(404).json({ error: 'Goal not found' });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

app.delete('/api/me/goals/:id', requireAuth, async (req, res) => {
  try {
    const db = getDb();
    const goalId = parseInt(req.params.id);
    const result = await db.collection('goals').deleteOne({ userId: req.userId, id: goalId });
    if (!result.deletedCount) return res.status(404).json({ error: 'Goal not found' });
    await logActivity(db, req.userId, { category: 'GOALS', description: `Deleted a savings goal` });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

// Conversational agent (Gemini).
app.post('/api/me/chat', requireAuth, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ error: 'Message is required' });
    const reply = await runAgentChat(req.userId, message);
    res.json(reply);
  } catch (e) {
    console.error('Chat error:', e);
    res.status(500).json({ error: e.message || 'Agent failed to respond' });
  }
});

// Delete the whole chat history + memory for this user.
app.delete('/api/me/chat', requireAuth, async (req, res) => {
  try {
    const db = getDb();
    await db.collection('chats').deleteMany({ userId: req.userId });
    await db.collection('users').updateOne({ _id: req.userId }, { $set: { chatSummary: '' } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to clear chat' });
  }
});

// Notifications: mark read / delete.
app.post('/api/me/notifications/read', requireAuth, async (req, res) => {
  try {
    const db = getDb();
    const { id } = req.body || {};
    const query = { userId: req.userId };
    if (id) query.id = id;
    await db.collection('notifications').updateMany(query, { $set: { read: true } });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to update notifications' });
  }
});

app.delete('/api/me/notifications/:id', requireAuth, async (req, res) => {
  try {
    const db = getDb();
    await db.collection('notifications').deleteOne({ userId: req.userId, id: req.params.id });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

app.listen(PORT, () => console.log(`FinAgent backend running on http://localhost:${PORT}`));
