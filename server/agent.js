import dotenv from 'dotenv';
import { getDb } from './db.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  distributeIncomeToGoals, logActivity, pushNotification,
  EXPENSE_CATEGORIES, INCOME_CATEGORIES, savingsRateForMode,
  deriveMerchant, checkBudgetAlert, generateSuggestions
} from './heuristics.js';

dotenv.config();

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('Please define the GEMINI_API_KEY environment variable in server/.env');
}
const PRIMARY_MODEL = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL || 'gemini-2.0-flash';
const genAI = new GoogleGenerativeAI(apiKey);

// Generate content, trying the primary model first and the fallback model on failure.
async function genContent({ systemInstruction, tools, contents }) {
  const req = { contents };
  if (tools) req.tools = tools;
  let lastErr;
  for (const modelName of [PRIMARY_MODEL, FALLBACK_MODEL]) {
    try {
      const model = genAI.getGenerativeModel(
        systemInstruction ? { model: modelName, systemInstruction } : { model: modelName }
      );
      return await model.generateContent(req);
    } catch (e) {
      lastErr = e;
      console.warn(`[Gemini] ${modelName} failed: ${(e.message || '').split('\n')[0]}`);
    }
  }
  throw lastErr;
}

const ALL_CATEGORIES = [...new Set([...EXPENSE_CATEGORIES, ...INCOME_CATEGORIES])];

// --- TOOL DECLARATIONS FOR GEMINI ---
const functionDeclarations = [
  {
    name: 'get_current_datetime',
    description: 'Returns the current server date and time (IST). Use this whenever the user asks about "today", dates, deadlines, how many days until a goal, or time-relative questions.',
    parameters: { type: 'OBJECT', properties: {}, required: [] }
  },
  {
    name: 'get_financial_summary',
    description: 'Returns the user\'s current balance (MoneyBank), income and spending this month, amount saved by AI, savings mode, and spending preferences. Use for "how am I doing", "how much can I save", balance questions.',
    parameters: { type: 'OBJECT', properties: {}, required: [] }
  },
  {
    name: 'get_profile',
    description: 'Retrieves the user profile: name, monthly income, savings mode, spending preferences, level, XP and badges.',
    parameters: { type: 'OBJECT', properties: {}, required: [] }
  },
  {
    name: 'update_profile',
    description: 'Updates profile settings (display name, monthly income, or savings mode).',
    parameters: {
      type: 'OBJECT',
      properties: {
        name: { type: 'STRING', description: 'Display name.' },
        monthlyIncome: { type: 'NUMBER', description: 'Monthly income/allowance in INR.' },
        savingsMode: { type: 'STRING', enum: ['Conservative', 'Balanced', 'Aggressive'], description: 'Savings style.' }
      },
      required: []
    }
  },
  {
    name: 'get_transactions',
    description: 'Retrieves the list of the user\'s transactions (income and expense).',
    parameters: { type: 'OBJECT', properties: {}, required: [] }
  },
  {
    name: 'add_transaction',
    description: 'Logs a new income or expense. If it is income, the agent will automatically set aside savings into the user\'s goals based on their savings mode.',
    parameters: {
      type: 'OBJECT',
      properties: {
        type: { type: 'STRING', enum: ['income', 'expense'], description: 'Transaction direction.' },
        category: { type: 'STRING', enum: ALL_CATEGORIES, description: 'Category.' },
        amount: { type: 'NUMBER', description: 'Amount in INR.' },
        description: { type: 'STRING', description: 'Short note.' }
      },
      required: ['type', 'category', 'amount', 'description']
    }
  },
  {
    name: 'delete_transaction',
    description: 'Deletes one of the user\'s transactions by id.',
    parameters: {
      type: 'OBJECT',
      properties: { transactionId: { type: 'STRING', description: 'Transaction id.' } },
      required: ['transactionId']
    }
  },
  {
    name: 'get_goals',
    description: 'Retrieves the user\'s active savings goals with progress.',
    parameters: { type: 'OBJECT', properties: {}, required: [] }
  },
  {
    name: 'add_goal',
    description: 'Creates a new savings goal.',
    parameters: {
      type: 'OBJECT',
      properties: {
        name: { type: 'STRING', description: 'Goal title (e.g. Goa Trip).' },
        emoji: { type: 'STRING', description: 'A single emoji.' },
        target: { type: 'NUMBER', description: 'Target amount in INR.' },
        weeklyTarget: { type: 'NUMBER', description: 'Weekly contribution in INR.' },
        targetDate: { type: 'STRING', description: 'Target date YYYY-MM-DD.' }
      },
      required: ['name', 'target']
    }
  },
  {
    name: 'update_goal',
    description: 'Adds savings to a goal or updates its weekly target.',
    parameters: {
      type: 'OBJECT',
      properties: {
        goalId: { type: 'NUMBER', description: 'Numeric goal id.' },
        savedAmountToAdd: { type: 'NUMBER', description: 'Amount in INR to add to the goal.' },
        weeklyTarget: { type: 'NUMBER', description: 'New weekly target.' }
      },
      required: ['goalId']
    }
  },
  {
    name: 'delete_goal',
    description: 'Deletes a savings goal by id.',
    parameters: {
      type: 'OBJECT',
      properties: { goalId: { type: 'NUMBER', description: 'Goal id.' } },
      required: ['goalId']
    }
  }
];

const systemInstruction = `You are PocketGlow, a warm, sharp AI money co-pilot for a college student. You speak in short, friendly, encouraging messages. Amounts are in Indian Rupees (₹).

CRITICAL SAFETY GUARDRAILS (never break these):
1. You can ONLY act through the provided tools. You have NO ability to run raw database queries.
2. You operate strictly on the ONE signed-in user. You cannot see, list, query, or modify any other user, their credentials, or their data. If asked to, refuse warmly.
3. If asked to do anything destructive or malicious (delete/drop the database, wipe all data, "delete everything", access other accounts, reveal passwords/tokens, bypass security), refuse politely and explain you can't do that.
4. For a single deletion the user clearly intends (one transaction or one goal), confirm intent in your reply, then proceed.

HOW YOU WORK:
- Be proactive and specific. Reference the user's real numbers, goals, and spending preferences.
- MULTI-STEP: you may call several tools in one turn (e.g. "spent ₹200 on lunch and add ₹500 to Goa Trip" → add_transaction + update_goal).
- When income comes in, savings are auto-allocated to goals — tell the user what you set aside.
- Gamification: users earn XP for logging (+15), goals (+25), saving to a goal (+20). Mention XP when earned.
- Use get_current_datetime for anything time-related; never guess today's date.`;

function personaTone(persona) {
  switch (persona) {
    case 'Hype':
      return 'TONE: You are HYPE — high-energy, playful, lots of emojis, hype the user up like a best friend celebrating every win and gently roasting bad spends. Keep it fun.';
    case 'Chill':
      return 'TONE: You are CHILL — calm, minimal, no fluff. Short, plain, reassuring sentences. Few or no emojis.';
    case 'Coach':
    default:
      return 'TONE: You are a supportive COACH — warm, motivating, practical. Encourage good habits and explain the "why" briefly.';
  }
}

// --- XP helper ---
async function addXp(db, userId, amount) {
  const user = await db.collection('users').findOne({ _id: userId });
  if (!user) return;
  let newXp = (user.xp || 0) + amount;
  let level = user.level || 'Rookie Saver';
  let nextLevel = user.nextLevel || 'Budget Pro';
  let xpToNext = user.xpToNext || 300;
  const badges = user.badges || [];

  if (newXp >= xpToNext) {
    newXp -= xpToNext;
    if (level === 'Rookie Saver') { level = 'Budget Pro'; nextLevel = 'Financial Genius'; xpToNext = 500; if (!badges.includes('Budget Master')) badges.push('Budget Master'); }
    else if (level === 'Budget Pro') { level = 'Financial Genius'; nextLevel = 'Wealth Guru'; xpToNext = 1000; if (!badges.includes('Consistency King')) badges.push('Consistency King'); }
    else { level = 'Wealth Guru'; nextLevel = 'Legendary Investor'; xpToNext = 2000; if (!badges.includes('Wealth Overlord')) badges.push('Wealth Overlord'); }
  }
  await db.collection('users').updateOne({ _id: userId }, { $set: { xp: newXp, level, nextLevel, xpToNext, badges } });
}

function monthStats(txs) {
  const now = new Date();
  const inMonth = txs.filter(t => {
    const d = new Date(t.date);
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  });
  const credit = inMonth.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const spent = inMonth.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  return { credit, spent };
}

// --- Execute one tool call. Pushes a human-readable reasoning step (never DB commands). ---
async function executeTool(db, userId, call, reasoningSteps, actionsTaken) {
  const { name, args = {} } = call;
  const step = (description) => reasoningSteps.push({ step: reasoningSteps.length + 1, description });

  switch (name) {
    case 'get_current_datetime': {
      step('Checked the current date and time');
      const now = new Date();
      return {
        iso: now.toISOString(),
        readable: now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'short' })
      };
    }

    case 'get_financial_summary': {
      step('Reviewed your balance, income and spending');
      const [user, txs] = await Promise.all([
        db.collection('users').findOne({ _id: userId }),
        db.collection('transactions').find({ userId }).toArray()
      ]);
      const totalIncome = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const totalSpent = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const { credit, spent } = monthStats(txs);
      return {
        balance: totalIncome - totalSpent,
        monthCredit: credit, monthSpent: spent,
        savedByAi: user?.savedByAi || 0,
        savingsMode: user?.savingsMode,
        savingsRatePct: Math.round(savingsRateForMode(user?.savingsMode) * 100),
        spendingPreferences: user?.spendingPreferences || []
      };
    }

    case 'get_profile': {
      step('Looked up your profile');
      const user = await db.collection('users').findOne({ _id: userId });
      if (!user) return {};
      const { passwordHash, ...safe } = user;
      return safe;
    }

    case 'update_profile': {
      const updates = {};
      if (args.name !== undefined) updates.name = args.name;
      if (args.monthlyIncome !== undefined) updates.monthlyIncome = args.monthlyIncome;
      if (args.savingsMode !== undefined) updates.savingsMode = args.savingsMode;
      step(`Updated your profile (${Object.keys(updates).join(', ') || 'no changes'})`);
      await db.collection('users').updateOne({ _id: userId }, { $set: updates });
      await addXp(db, userId, 15);
      actionsTaken.push('Profile updated (+15 XP)');
      await logActivity(db, userId, { category: 'ALERT', description: `Updated profile: ${Object.keys(updates).join(', ')}` });
      return { success: true, updatedFields: Object.keys(updates) };
    }

    case 'get_transactions': {
      step('Pulled up your recent transactions');
      return await db.collection('transactions').find({ userId }).toArray();
    }

    case 'add_transaction': {
      const { type, category, amount, description } = args;
      const cat = ALL_CATEGORIES.includes(category) ? category : 'Other';
      const newTx = {
        id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        userId, type, category: cat,
        merchant: deriveMerchant(description, cat),
        amount, description,
        date: new Date().toISOString()
      };
      step(`Logged a ₹${amount} ${type} for "${description}" under ${cat}`);
      await db.collection('transactions').insertOne(newTx);
      await addXp(db, userId, 15);
      actionsTaken.push(`Logged ₹${amount} under ${cat} (+15 XP)`);
      await logActivity(db, userId, {
        category: type === 'income' ? 'INCOME' : 'EXPENSE',
        description: `${type === 'income' ? 'Income' : 'Expense'} of ₹${Number(amount).toLocaleString('en-IN')} — ${description} (${cat})`
      });

      let allocation = null;
      if (type === 'income') {
        allocation = await distributeIncomeToGoals(db, userId, amount);
        if (allocation.pool > 0) {
          step(`Set aside ₹${allocation.pool} into goals (${allocation.savingsMode} plan)`);
          actionsTaken.push(`Auto-saved ₹${allocation.pool} to goals`);
        }
      } else {
        await checkBudgetAlert(db, userId, cat);
      }
      return { success: true, transactionId: newTx.id, allocation };
    }

    case 'delete_transaction': {
      step(`Deleted transaction ${args.transactionId}`);
      const res = await db.collection('transactions').deleteOne({ userId, id: args.transactionId });
      actionsTaken.push('Transaction deleted');
      await logActivity(db, userId, { category: 'EXPENSE', description: `Deleted a transaction` });
      return { success: res.deletedCount > 0 };
    }

    case 'get_goals': {
      step('Checked your savings goals');
      return await db.collection('goals').find({ userId }).toArray();
    }

    case 'add_goal': {
      const goals = await db.collection('goals').find({ userId }).toArray();
      const nextId = goals.reduce((m, g) => (g.id > m ? g.id : m), 0) + 1;
      const target = Number(args.target) || 0;
      const weeklyTarget = Number(args.weeklyTarget) || Math.max(200, Math.round(target / 12 / 50) * 50);
      const newGoal = {
        id: nextId, userId,
        name: args.name, emoji: args.emoji || '🎯',
        target, saved: 0, weeklyTarget,
        startDate: new Date().toISOString().split('T')[0],
        targetDate: args.targetDate || '',
        agentMonitoring: true
      };
      step(`Created goal "${args.name}" with a ₹${target} target`);
      await db.collection('goals').insertOne(newGoal);
      await addXp(db, userId, 25);
      actionsTaken.push(`Created goal "${args.name}" (+25 XP)`);
      await logActivity(db, userId, { category: 'GOALS', description: `Created savings goal ${newGoal.emoji} ${args.name} (target ₹${target.toLocaleString('en-IN')})` });
      return { success: true, goalId: nextId };
    }

    case 'update_goal': {
      const goal = await db.collection('goals').findOne({ userId, id: args.goalId });
      if (!goal) return { success: false, error: 'Goal not found' };
      const updates = {};
      if (args.savedAmountToAdd !== undefined) updates.saved = Math.min(goal.target, (goal.saved || 0) + args.savedAmountToAdd);
      if (args.weeklyTarget !== undefined) updates.weeklyTarget = args.weeklyTarget;
      step(`Updated goal "${goal.name}"`);
      await db.collection('goals').updateOne({ userId, id: args.goalId }, { $set: updates });
      if (args.savedAmountToAdd > 0) {
        await addXp(db, userId, 20);
        actionsTaken.push(`Saved ₹${args.savedAmountToAdd} to "${goal.name}" (+20 XP)`);
        await logActivity(db, userId, { category: 'GOALS', description: `Added ₹${Number(args.savedAmountToAdd).toLocaleString('en-IN')} to ${goal.emoji} ${goal.name}` });
      } else {
        actionsTaken.push(`Updated "${goal.name}"`);
      }
      return { success: true };
    }

    case 'delete_goal': {
      const goal = await db.collection('goals').findOne({ userId, id: args.goalId });
      step(`Deleted goal ${args.goalId}`);
      const res = await db.collection('goals').deleteOne({ userId, id: args.goalId });
      actionsTaken.push('Goal deleted');
      await logActivity(db, userId, { category: 'GOALS', description: `Deleted goal ${goal ? goal.name : args.goalId}` });
      return { success: res.deletedCount > 0 };
    }

    default:
      return { error: 'Unknown tool' };
  }
}

// --- Build the per-user RAG context pack injected into the system prompt each turn ---
async function buildContextPack(db, user) {
  const userId = user._id;
  const [txs, goals] = await Promise.all([
    db.collection('transactions').find({ userId }).toArray(),
    db.collection('goals').find({ userId }).toArray()
  ]);
  const totalIncome = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalSpent = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const { credit, spent } = monthStats(txs);
  const now = new Date();

  const goalsStr = goals.length
    ? goals.map(g => `${g.emoji} ${g.name}: ₹${g.saved}/₹${g.target} (target ${g.targetDate || 'n/a'})`).join('; ')
    : 'none yet';
  const prefs = (user.spendingPreferences || []).join(', ') || 'not set';

  return `
--- TODAY ---
${now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', dateStyle: 'full', timeStyle: 'short' })}

--- THIS USER (the only one you can act on) ---
Name: ${user.name} | Monthly income: ₹${user.monthlyIncome} | Savings mode: ${user.savingsMode} (${Math.round(savingsRateForMode(user.savingsMode) * 100)}% set aside)
Spending preferences: ${prefs}
Level: ${user.level} • ${user.xp}/${user.xpToNext} XP
Balance (MoneyBank): ₹${totalIncome - totalSpent} | This month — credited ₹${credit}, spent ₹${spent} | Saved by AI so far: ₹${user.savedByAi || 0}
Goals: ${goalsStr}
${user.chatSummary ? `\n--- MEMORY OF EARLIER CHATS ---\n${user.chatSummary}` : ''}`;
}

// --- Core chat runner ---
export async function runAgentChat(userId, userMessage) {
  const db = getDb();
  const user = await db.collection('users').findOne({ _id: userId });
  if (!user) throw new Error('User not found');

  const history = await db.collection('chats').find({ userId }).sort({ _id: -1 }).limit(6).toArray();
  history.reverse();

  const contextPack = await buildContextPack(db, user);
  const sysInstruction = `${systemInstruction}\n${personaTone(user.agentPersona)}\n${contextPack}`;
  const tools = [{ functionDeclarations }];

  const contents = history.map(m => ({
    role: m.sender === 'user' ? 'user' : 'model',
    parts: [{ text: m.text }]
  }));
  contents.push({ role: 'user', parts: [{ text: userMessage }] });

  const reasoningSteps = [];
  const actionsTaken = [];

  let result = await genContent({ systemInstruction: sysInstruction, tools, contents });
  let response = result.response;
  let calls = (typeof response.functionCalls === 'function' ? response.functionCalls() : null) || [];

  let count = 0;
  while (calls.length && count < 5) {
    count++;
    contents.push(response.candidates[0].content);
    const toolParts = [];
    for (const call of calls) {
      const r = await executeTool(db, userId, call, reasoningSteps, actionsTaken);
      toolParts.push({ functionResponse: { name: call.name, response: { result: r } } });
    }
    contents.push({ role: 'user', parts: toolParts });
    result = await genContent({ systemInstruction: sysInstruction, tools, contents });
    response = result.response;
    calls = (typeof response.functionCalls === 'function' ? response.functionCalls() : null) || [];
  }

  let finalResponseText = "Done! Anything else?";
  try {
    const t = response.text();
    if (t && t.trim()) finalResponseText = t;
  } catch { /* response had only tool calls */ }

  const now = new Date().toISOString();
  await db.collection('chats').insertOne({ id: `msg-user-${Date.now()}`, userId, sender: 'user', text: userMessage, date: now });
  const agentMsgId = `msg-agent-${Date.now()}`;
  await db.collection('chats').insertOne({
    id: agentMsgId, userId, sender: 'agent', text: finalResponseText, date: now,
    reasoning: reasoningSteps, actionsTaken
  });

  const chatCount = await db.collection('chats').countDocuments({ userId });
  if (chatCount > 12) {
    try { await summarizeUserChatHistory(db, userId, user.chatSummary); }
    catch (e) { console.warn('Summarization skipped:', e.message); }
  }

  return { id: agentMsgId, sender: 'agent', text: finalResponseText, date: now, reasoning: reasoningSteps, actionsTaken };
}

// --- On-demand contextual suggestion (throttled by the caller to every 6h) ---
// context: 'home' | 'insights' | a category name (e.g. 'Food')
export async function generateSuggestionText(userId, context = 'home') {
  const db = getDb();
  const user = await db.collection('users').findOne({ _id: userId });
  if (!user) return 'Add a few transactions and I’ll start coaching your budget.';
  const [txs, goals] = await Promise.all([
    db.collection('transactions').find({ userId }).toArray(),
    db.collection('goals').find({ userId }).toArray()
  ]);

  const now = new Date();
  const expenses = txs.filter((t) => t.type === 'expense');
  const monthExp = expenses.filter((t) => { const d = new Date(t.date); return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth(); });
  const byCat = {};
  monthExp.forEach((e) => { byCat[e.category] = (byCat[e.category] || 0) + e.amount; });
  const income = txs.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const spent = expenses.reduce((s, t) => s + t.amount, 0);

  const isCategory = !['home', 'insights'].includes(context);
  const catTxs = isCategory ? monthExp.filter((t) => t.category === context) : [];
  const byMerchant = {};
  catTxs.forEach((t) => { byMerchant[t.merchant || 'Other'] = (byMerchant[t.merchant || 'Other'] || 0) + t.amount; });

  const focus = isCategory
    ? `Focus ONLY on the "${context}" category this month: ₹${catTxs.reduce((s, t) => s + t.amount, 0)} across ${catTxs.length} orders. By merchant: ${Object.entries(byMerchant).map(([m, v]) => `${m} ₹${v}`).join(', ') || 'none'}.`
    : `Overall picture. This month by category: ${Object.entries(byCat).map(([c, v]) => `${c} ₹${v}`).join(', ') || 'nothing yet'}.`;

  const prompt = `You are PocketGlow, a friendly student money coach. Give ONE short, specific, actionable suggestion (max 32 words, no preamble, no markdown). Use the numbers. Be encouraging.
User: ${user.fullName || user.username}, ${user.savingsMode} saver (${Math.round(savingsRateForMode(user.savingsMode) * 100)}% target). Likes: ${(user.spendingPreferences || []).join(', ') || 'n/a'}.
Monthly income ~₹${user.monthlyIncome}. All-time balance ₹${income - spent}.
${focus}
Goals: ${goals.map((g) => `${g.name} ₹${g.saved}/₹${g.target}`).join('; ') || 'none'}.`;

  try {
    const result = await genContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }] });
    const text = result.response.text();
    if (text && text.trim()) return text.trim();
  } catch (e) {
    console.warn('Suggestion generation fell back to heuristic:', e.message);
  }
  const list = generateSuggestions(user, txs, goals);
  return list[0] || 'You’re doing great — keep logging and I’ll spot ways to save.';
}

// --- Rolling memory summary for long conversations ---
async function summarizeUserChatHistory(db, userId, currentSummary) {
  const allChats = await db.collection('chats').find({ userId }).sort({ _id: 1 }).toArray();
  const formatted = allChats.map(c => `${c.sender === 'user' ? 'User' : 'Agent'}: ${c.text}`).join('\n');
  const prompt = `You maintain the long-term memory of a student's finance chat. Merge the previous summary with the new conversation into one concise memory (<150 words). Preserve: profile/preference changes, active goals & targets, recurring bills/subscriptions, and recent habits or warnings. No greetings or preamble.
${currentSummary ? `\n--- PREVIOUS SUMMARY ---\n${currentSummary}\n` : ''}
--- CONVERSATION ---
${formatted}`;

  let newSummary = '';
  try {
    const result = await genContent({ contents: [{ role: 'user', parts: [{ text: prompt }] }] });
    newSummary = result.response.text();
  } catch { newSummary = currentSummary || ''; }

  await db.collection('users').updateOne({ _id: userId }, { $set: { chatSummary: newSummary } });

  // Keep only the last 4 messages live; older ones now live in the summary.
  const keep = await db.collection('chats').find({ userId }).sort({ _id: -1 }).limit(4).toArray();
  const keepIds = keep.map(c => c._id);
  await db.collection('chats').deleteMany({ userId, _id: { $nin: keepIds } });
}
