import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDb, getDb } from './db.js';
import { seedDatabase } from './seed.js';
import { runAgentChat } from './agent.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Establish Database Connection on Boot
try {
  await connectDb();
} catch (e) {
  console.error('Fatal: Could not connect to MongoDB Atlas on startup!', e);
  process.exit(1);
}

// Helper: Log activity logs directly from express routes
async function logRouteAction(db, userId, category, description, mongoOperation) {
  const logEntry = {
    id: `act-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    userId,
    timestamp: 'Just now',
    category,
    description,
    mongoOperation
  };
  await db.collection('activity_logs').insertOne(logEntry);
}

// 1. GET /api/users -> List all synthetic users
app.get('/api/users', async (req, res) => {
  try {
    const db = getDb();
    const users = await db.collection('users').find({}).toArray();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// 2. GET /api/users/:userId/data -> Aggregated data dump for specific user
app.get('/api/users/:userId/data', async (req, res) => {
  const { userId } = req.params;
  try {
    const db = getDb();
    const user = await db.collection('users').findOne({ _id: userId });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const [transactions, goals, chatHistory, activityLog] = await Promise.all([
      db.collection('transactions').find({ userId }).toArray(),
      db.collection('goals').find({ userId }).toArray(),
      db.collection('chats').find({ userId }).toArray(),
      db.collection('activity_logs').find({ userId }).sort({ _id: -1 }).toArray()
    ]);

    // Compute insights on the fly to match useInsightsStore structure
    const expenses = transactions.filter(t => t.type === 'expense');
    const totals = { Food: 0, Transport: 0, Studies: 0, Entertainment: 0, Subscriptions: 0 };
    expenses.forEach(e => {
      if (totals[e.category] !== undefined) {
        totals[e.category] += e.amount;
      }
    });

    const totalSpent = Object.values(totals).reduce((a, b) => a + b, 0);
    const budgetRemaining = Math.max(0, 5500 - totalSpent); // assume standard budget limit of 5500

    const insights = {
      categoryTotals: totals,
      totalSpent,
      budgetRemaining,
      monthProjection: totalSpent + 400
    };

    res.json({
      user,
      transactions,
      goals,
      chatHistory,
      activityLog,
      insights
    });
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ error: 'Failed to fetch user details' });
  }
});

// 3. POST /api/users/:userId/transactions -> CRUD add transaction
app.post('/api/users/:userId/transactions', async (req, res) => {
  const { userId } = req.params;
  const { type, category, amount, description } = req.body;

  if (!type || !category || !amount || !description) {
    return res.status(400).json({ error: 'Missing required transaction fields' });
  }

  try {
    const db = getDb();
    const newTx = {
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      userId,
      type,
      category,
      amount: parseFloat(amount),
      description,
      timestamp: 'Just now',
      mongoCollection: 'user_transactions'
    };

    await db.collection('transactions').insertOne(newTx);

    // Add activity log
    const logCat = type === 'income' ? 'INCOME' : 'EXPENSE';
    await logRouteAction(
      db,
      userId,
      logCat,
      `Logged ₹${amount} ${type} under ${category} (manual UI input)`,
      `db.transactions.insertOne({ type: "${type}", category: "${category}", amount: ${amount} })`
    );

    res.json({ success: true, transaction: newTx });
  } catch (error) {
    console.error('Error adding transaction:', error);
    res.status(500).json({ error: 'Failed to record transaction' });
  }
});

// 4. DELETE /api/users/:userId/transactions/:id -> CRUD delete transaction
app.delete('/api/users/:userId/transactions/:id', async (req, res) => {
  const { userId, id } = req.params;
  try {
    const db = getDb();
    const result = await db.collection('transactions').deleteOne({ userId, id });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    await logRouteAction(
      db,
      userId,
      'EXPENSE',
      `Deleted transaction ID: ${id} (manual UI input)`,
      `db.transactions.deleteOne({ id: "${id}" })`
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: 'Failed to delete transaction' });
  }
});

// 5. POST /api/users/:userId/goals -> CRUD add goal
app.post('/api/users/:userId/goals', async (req, res) => {
  const { userId } = req.params;
  const { name, emoji, target, weeklyTarget, targetDate } = req.body;

  try {
    const db = getDb();
    const goals = await db.collection('goals').find({ userId }).toArray();
    const nextId = goals.reduce((max, g) => g.id > max ? g.id : max, 0) + 1;

    const newGoal = {
      id: nextId,
      userId,
      name,
      emoji,
      target: parseFloat(target),
      saved: 0,
      weeklyTarget: parseFloat(weeklyTarget),
      startDate: new Date().toISOString().split('T')[0],
      targetDate,
      agentMonitoring: true
    };

    await db.collection('goals').insertOne(newGoal);
    await logRouteAction(
      db,
      userId,
      'GOALS',
      `Created savings goal: ${emoji} ${name} with target ₹${target} (manual UI input)`,
      `db.goals.insertOne({ name: "${name}", target: ${target} })`
    );

    res.json({ success: true, goal: newGoal });
  } catch (error) {
    console.error('Error adding goal:', error);
    res.status(500).json({ error: 'Failed to save goal' });
  }
});

// 6. PUT /api/users/:userId/goals/:id -> CRUD update goal
app.put('/api/users/:userId/goals/:id', async (req, res) => {
  const { userId, id } = req.params;
  const { saved, weeklyTarget } = req.body;
  const goalId = parseInt(id);

  try {
    const db = getDb();
    const updates = {};
    if (saved !== undefined) updates.saved = parseFloat(saved);
    if (weeklyTarget !== undefined) updates.weeklyTarget = parseFloat(weeklyTarget);

    const result = await db.collection('goals').updateOne(
      { userId, id: goalId },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    await logRouteAction(
      db,
      userId,
      'GOALS',
      `Updated savings goal ID: ${goalId} (manual UI input)`,
      `db.goals.updateOne({ id: ${goalId} }, { $set: ${JSON.stringify(updates)} })`
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating goal:', error);
    res.status(500).json({ error: 'Failed to update goal' });
  }
});

// 7. DELETE /api/users/:userId/goals/:id -> CRUD delete goal
app.delete('/api/users/:userId/goals/:id', async (req, res) => {
  const { userId, id } = req.params;
  const goalId = parseInt(id);

  try {
    const db = getDb();
    const result = await db.collection('goals').deleteOne({ userId, id: goalId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: 'Goal not found' });
    }

    await logRouteAction(
      db,
      userId,
      'GOALS',
      `Deleted savings goal ID: ${goalId} (manual UI input)`,
      `db.goals.deleteOne({ id: ${goalId} })`
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting goal:', error);
    res.status(500).json({ error: 'Failed to delete goal' });
  }
});

// 8. POST /api/users/:userId/profile -> Profile updates
app.post('/api/users/:userId/profile', async (req, res) => {
  const { userId } = req.params;
  const { name, monthlyIncome, savingsMode } = req.body;

  try {
    const db = getDb();
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (monthlyIncome !== undefined) updates.monthlyIncome = parseFloat(monthlyIncome);
    if (savingsMode !== undefined) updates.savingsMode = savingsMode;

    const result = await db.collection('users').updateOne(
      { _id: userId },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    await logRouteAction(
      db,
      userId,
      'ALERT',
      `Updated user profile details (manual UI input)`,
      `db.users.updateOne({ _id: "${userId}" })`
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// 9. POST /api/users/:userId/chat -> Conversational AI Agent endpoint (Gemini 2.0 Flash)
app.post('/api/users/:userId/chat', async (req, res) => {
  const { userId } = req.params;
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: 'Missing chat message content' });
  }

  try {
    const agentResponse = await runAgentChat(userId, message);
    res.json(agentResponse);
  } catch (error) {
    console.error('Agent chat processing error:', error);
    res.status(500).json({ error: error.message || 'Agent failed to process chat prompt' });
  }
});

// 10. POST /api/admin/reset -> Reset and seed database
app.post('/api/admin/reset', async (req, res) => {
  try {
    await seedDatabase();
    res.json({ success: true, message: 'Database successfully cleared and re-seeded with 10 synthetic users!' });
  } catch (error) {
    console.error('Seeding reset error:', error);
    res.status(500).json({ error: 'Failed to reset and seed database' });
  }
});

// Start listening
app.listen(PORT, () => {
  console.log(`FinAgent Express Backend running on http://localhost:${PORT}`);
});
