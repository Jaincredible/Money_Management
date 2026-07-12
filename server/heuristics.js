// Prototype "AI" heuristics — realistic-feeling money logic without heavy algorithms.
// Used by both the REST routes and the Gemini agent tools so behaviour is consistent.

export const EXPENSE_CATEGORIES = [
  'Food', 'Groceries', 'Transport', 'Travel', 'Studies',
  'Entertainment', 'Sports', 'Shopping', 'Subscriptions', 'Fitness', 'Other'
];
export const INCOME_CATEGORIES = ['Salary', 'Allowance', 'Freelance', 'Gift', 'Other'];

// Spending preferences offered at signup (things a student likes to spend on)
export const SPENDING_PREFERENCES = [
  { key: 'Food', emoji: '🍔', label: 'Eating Out' },
  { key: 'Groceries', emoji: '🛒', label: 'Groceries' },
  { key: 'Travel', emoji: '✈️', label: 'Travel' },
  { key: 'Sports', emoji: '⚽', label: 'Sports' },
  { key: 'Entertainment', emoji: '🎮', label: 'Entertainment' },
  { key: 'Studies', emoji: '📚', label: 'Studies' },
  { key: 'Shopping', emoji: '🛍️', label: 'Shopping' },
  { key: 'Fitness', emoji: '💪', label: 'Fitness & Gym' },
  { key: 'Subscriptions', emoji: '📱', label: 'Subscriptions' },
  { key: 'Transport', emoji: '🚌', label: 'Transport' }
];

export function savingsRateForMode(mode) {
  switch (mode) {
    case 'Conservative': return 0.20;
    case 'Aggressive': return 0.50;
    case 'Balanced':
    default: return 0.30;
  }
}

// Insert a human-readable activity entry (NO database commands are ever stored/shown).
export async function logActivity(db, userId, { category, description }) {
  const entry = {
    id: `act-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId,
    category,
    description,
    date: new Date().toISOString()
  };
  await db.collection('activity_logs').insertOne(entry);
  return entry;
}

// Push a notification for the user (bell / notification center).
export async function pushNotification(db, userId, { type, title, message, emoji }) {
  const notif = {
    id: `ntf-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    userId,
    type, // 'suggestion' | 'alert' | 'challenge' | 'reward' | 'system'
    title,
    message,
    emoji: emoji || '🔔',
    read: false,
    date: new Date().toISOString()
  };
  await db.collection('notifications').insertOne(notif);
  return notif;
}

// Core "AI allocation": when income arrives, set aside savings and spread across goals.
// Returns a summary the agent/UI can describe in natural language.
export async function distributeIncomeToGoals(db, userId, incomeAmount) {
  const user = await db.collection('users').findOne({ _id: userId });
  if (!user) return { pool: 0, allocations: [] };

  const rate = savingsRateForMode(user.savingsMode);
  let pool = Math.round(incomeAmount * rate);

  const goals = (await db.collection('goals').find({ userId }).toArray())
    .filter(g => (g.saved || 0) < g.target);

  const allocations = [];
  if (goals.length && pool > 0) {
    // Weight by remaining amount so under-funded goals get more.
    const remainingOf = (g) => Math.max(0, g.target - (g.saved || 0));
    const totalRemaining = goals.reduce((s, g) => s + remainingOf(g), 0) || 1;

    let allocated = 0;
    for (let i = 0; i < goals.length; i++) {
      const g = goals[i];
      const isLast = i === goals.length - 1;
      let amount = isLast
        ? pool - allocated
        : Math.round((remainingOf(g) / totalRemaining) * pool);
      amount = Math.min(amount, remainingOf(g));
      if (amount <= 0) continue;

      const newSaved = Math.min(g.target, (g.saved || 0) + amount);
      await db.collection('goals').updateOne(
        { userId, id: g.id },
        { $set: { saved: newSaved } }
      );
      allocated += amount;
      allocations.push({ goalId: g.id, name: g.name, emoji: g.emoji, amount });
    }
    pool = allocated;
  } else {
    pool = 0;
  }

  if (pool > 0) {
    await db.collection('users').updateOne(
      { _id: userId },
      { $inc: { savedByAi: pool } }
    );
    const summary = allocations
      .map(a => `₹${a.amount.toLocaleString('en-IN')} → ${a.emoji} ${a.name}`)
      .join(', ');
    await logActivity(db, userId, {
      category: 'GOALS',
      description: `Auto-allocated ₹${pool.toLocaleString('en-IN')} of your ₹${incomeAmount.toLocaleString('en-IN')} income to savings goals (${summary}).`
    });
    await pushNotification(db, userId, {
      type: 'suggestion',
      emoji: '🤖',
      title: 'Income allocated automatically',
      message: `I moved ₹${pool.toLocaleString('en-IN')} into your goals based on your ${user.savingsMode} savings plan. ${summary}.`
    });
  }

  return { pool, allocations, savingsMode: user.savingsMode, rate };
}

// Generate realistic, preference-aware suggestions for the Insights / notifications.
export function generateSuggestions(user, txs, goals) {
  const expenses = txs.filter(t => t.type === 'expense');
  const byCat = {};
  expenses.forEach(e => { byCat[e.category] = (byCat[e.category] || 0) + e.amount; });
  const sorted = Object.entries(byCat).sort((a, b) => b[1] - a[1]);
  const prefs = user.spendingPreferences || [];
  const suggestions = [];

  if (sorted.length) {
    const [topCat, topAmt] = sorted[0];
    const weekly = Math.max(100, Math.round((topAmt / 4) * 0.8 / 50) * 50);
    suggestions.push(`Your top spend is ${topCat} (₹${topAmt.toLocaleString('en-IN')}). A ₹${weekly.toLocaleString('en-IN')}/week cap could save ~₹${Math.round(topAmt * 0.2).toLocaleString('en-IN')}/month.`);
  }

  const behind = goals.find(g => (g.saved || 0) / g.target < 0.5);
  if (behind) {
    const need = Math.round((behind.target - (behind.saved || 0)) / 8);
    suggestions.push(`${behind.emoji} ${behind.name} is under halfway. Saving ₹${need.toLocaleString('en-IN')}/week keeps it on schedule.`);
  }

  if (prefs.includes('Travel')) {
    suggestions.push(`Since you love travel, I'm rounding up spare change from every expense toward a trip fund.`);
  } else if (prefs.includes('Sports')) {
    suggestions.push(`Noted you're into sports — I'll flag gear/membership deals and protect that budget line.`);
  }

  const subs = byCat['Subscriptions'] || 0;
  if (subs > 0) {
    suggestions.push(`You have ₹${subs.toLocaleString('en-IN')} in subscriptions this month. Want me to pause the ones you haven't used?`);
  }

  const rate = Math.round(savingsRateForMode(user.savingsMode) * 100);
  suggestions.push(`You're saving ${rate}% of income on a ${user.savingsMode} plan — ahead of most students on FinAgent.`);

  return suggestions.slice(0, 4);
}
