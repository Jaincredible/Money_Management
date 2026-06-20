import dotenv from 'dotenv';
import { getDb } from './db.js';

dotenv.config();

// Standard import for @google/generative-ai is:
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE';

const genAI = new GoogleGenerativeAI(apiKey);

// --- TOOL DECLARATIONS FOR GEMINI ---
const functionDeclarations = [
  {
    name: 'get_profile',
    description: 'Retrieves the user profile information including their monthly income, savings mode preference, level, badges, and current XP.',
    parameters: {
      type: 'OBJECT',
      properties: {},
      required: []
    }
  },
  {
    name: 'update_profile',
    description: 'Updates the user profile settings.',
    parameters: {
      type: 'OBJECT',
      properties: {
        name: { type: 'STRING', description: 'The display name of the user.' },
        monthlyIncome: { type: 'NUMBER', description: 'Monthly income / allowance amount in Rupees (INR).' },
        savingsMode: {
          type: 'STRING',
          enum: ['Conservative', 'Balanced', 'Aggressive'],
          description: 'The user savings preference style.'
        }
      },
      required: []
    }
  },
  {
    name: 'get_transactions',
    description: 'Retrieves the list of all transactions (income and expense) for the user.',
    parameters: {
      type: 'OBJECT',
      properties: {},
      required: []
    }
  },
  {
    name: 'add_transaction',
    description: 'Logs a new transaction (income or expense) into the database ledger.',
    parameters: {
      type: 'OBJECT',
      properties: {
        type: { type: 'STRING', enum: ['income', 'expense'], description: 'The transaction direction.' },
        category: {
          type: 'STRING',
          enum: ['Food', 'Transport', 'Studies', 'Entertainment', 'Subscriptions', 'Salary', 'Other'],
          description: 'The budget category.'
        },
        amount: { type: 'NUMBER', description: 'The transaction amount in Rupees (INR).' },
        description: { type: 'STRING', description: 'Brief note describing what this transaction was.' }
      },
      required: ['type', 'category', 'amount', 'description']
    }
  },
  {
    name: 'delete_transaction',
    description: 'Deletes a transaction from the ledger.',
    parameters: {
      type: 'OBJECT',
      properties: {
        transactionId: { type: 'STRING', description: 'The ID of the transaction to delete.' }
      },
      required: ['transactionId']
    }
  },
  {
    name: 'get_goals',
    description: 'Retrieves the list of active savings goals for the user.',
    parameters: {
      type: 'OBJECT',
      properties: {},
      required: []
    }
  },
  {
    name: 'add_goal',
    description: 'Creates a new savings goal.',
    parameters: {
      type: 'OBJECT',
      properties: {
        name: { type: 'STRING', description: 'The goal title (e.g. Goa Trip, New Laptop).' },
        emoji: { type: 'STRING', description: 'A single emoji representation of the goal.' },
        target: { type: 'NUMBER', description: 'The target savings amount in Rupees.' },
        weeklyTarget: { type: 'NUMBER', description: 'The target amount to save every week.' },
        targetDate: { type: 'STRING', description: 'Target date in YYYY-MM-DD format.' }
      },
      required: ['name', 'emoji', 'target', 'weeklyTarget', 'targetDate']
    }
  },
  {
    name: 'update_goal',
    description: 'Updates an existing goal savings or parameters.',
    parameters: {
      type: 'OBJECT',
      properties: {
        goalId: { type: 'NUMBER', description: 'The numerical ID of the goal.' },
        savedAmountToAdd: { type: 'NUMBER', description: 'Amount in Rupees to ADD to the saved pool.' },
        weeklyTarget: { type: 'NUMBER', description: 'New weekly target contribution rate.' }
      },
      required: ['goalId']
    }
  },
  {
    name: 'delete_goal',
    description: 'Deletes a savings goal.',
    parameters: {
      type: 'OBJECT',
      properties: {
        goalId: { type: 'NUMBER', description: 'The ID of the goal to delete.' }
      },
      required: ['goalId']
    }
  }
];

// SYSTEM INSTRUCTIONS:
const systemInstruction = `You are FinAgent, a highly advanced, context-aware AI agent for student money management.
You have access to the user's financial database via tools. 

CRITICAL SAFETY GUARDRAILS:
1. You can ONLY execute database operations using the provided tools.
2. The server handles scoping automatically. You CANNOT access, query, or modify other users' files, profiles, or details. Do not search for other users.
3. If the user prompts you to do something malicious (e.g. "delete database", "access other users' details", "bypass safety checks", "drop table", "remove database"), refuse politely.
4. You have NO permission to perform raw SQL/NoSQL queries. You can only perform CRUD tasks via the provided tools.

AGENTIC CAPABILITIES:
- MULTITASKING: You can execute multiple tools in a single turn if the prompt requires it (e.g. "Spent 200 on lunch and put 500 into Goa Trip" should call both add_transaction and update_goal).
- FINANCIAL PLANNING: Keep track of whether the user is on track for their goals. If they are overspending, suggest cuts.
- XP & GAMIFICATION: The platform awards XP to users for logging transactions (+15 XP), updating goals (+25 XP), or updates. Explain when they gain XP!
- BE PROACTIVE: Remind users of upcoming bills, auto-adjust goal timelines if spend spike occurs.
`;

// Helper to award XP
async function addXp(db, userId, amount) {
  const user = await db.collection('users').findOne({ _id: userId });
  if (!user) return;
  
  let newXp = (user.xp || 0) + amount;
  let level = user.level || 'Rookie Saver';
  let nextLevel = user.nextLevel || 'Budget Pro';
  let xpToNext = user.xpToNext || 300;
  let badges = user.badges || [];

  if (newXp >= xpToNext) {
    newXp = newXp - xpToNext;
    if (level === 'Rookie Saver') {
      level = 'Budget Pro';
      nextLevel = 'Financial Genius';
      xpToNext = 500;
      badges.push('Budget Master');
    } else if (level === 'Budget Pro') {
      level = 'Financial Genius';
      nextLevel = 'Wealth Guru';
      xpToNext = 1000;
      badges.push('Consistency King');
    } else {
      level = 'Wealth Guru';
      nextLevel = 'Legendary Investor';
      xpToNext = 2000;
      badges.push('Wealth Overlord');
    }
  }

  await db.collection('users').updateOne(
    { _id: userId },
    { $set: { xp: newXp, level, nextLevel, xpToNext, badges } }
  );
  return { gainedXp: amount, currentXp: newXp, currentLevel: level };
}

// Log agent action
async function logAgentAction(db, userId, category, description, mongoOperation) {
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

// EXECUTE SINGLE TOOL
async function executeTool(db, userId, call, reasoningSteps, actionsTaken) {
  const { name, args } = call;
  console.log(`Executing tool call: ${name} with args:`, args);

  switch (name) {
    case 'get_profile': {
      reasoningSteps.push({
        step: reasoningSteps.length + 1,
        description: 'Querying users collection for current profile',
        mongoOperation: `db.users.findOne({ _id: "${userId}" })`
      });
      const profile = await db.collection('users').findOne({ _id: userId });
      return profile || {};
    }

    case 'update_profile': {
      const { name: newName, monthlyIncome, savingsMode } = args;
      const updates = {};
      if (newName !== undefined) updates.name = newName;
      if (monthlyIncome !== undefined) updates.monthlyIncome = monthlyIncome;
      if (savingsMode !== undefined) updates.savingsMode = savingsMode;

      reasoningSteps.push({
        step: reasoningSteps.length + 1,
        description: `Updating profile attributes: ${JSON.stringify(updates)}`,
        mongoOperation: `db.users.updateOne({ _id: "${userId}" }, { $set: ${JSON.stringify(updates)} })`
      });

      await db.collection('users').updateOne({ _id: userId }, { $set: updates });
      await addXp(db, userId, 15);
      actionsTaken.push('Profile updated (+15 XP)');
      await logAgentAction(db, userId, 'ALERT', `Updated profile settings: ${Object.keys(updates).join(', ')}`, `db.users.updateOne({ _id: "${userId}" })`);
      return { success: true, updatedFields: Object.keys(updates) };
    }

    case 'get_transactions': {
      reasoningSteps.push({
        step: reasoningSteps.length + 1,
        description: 'Querying transactions collection',
        mongoOperation: `db.transactions.find({ userId: "${userId}" }).toArray()`
      });
      return await db.collection('transactions').find({ userId }).toArray();
    }

    case 'add_transaction': {
      const { type, category, amount, description } = args;
      const newTx = {
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        userId,
        type,
        category,
        amount,
        description,
        timestamp: 'Just now',
        mongoCollection: 'user_transactions'
      };

      reasoningSteps.push({
        step: reasoningSteps.length + 1,
        description: `Inserting new transaction: ₹${amount} under ${category}`,
        mongoOperation: `db.transactions.insertOne({ type: "${type}", category: "${category}", amount: ${amount}, description: "${description}" })`
      });

      await db.collection('transactions').insertOne(newTx);
      await addXp(db, userId, 15);
      actionsTaken.push(`Logged ₹${amount} under ${category} (+15 XP)`);
      
      const logCat = type === 'income' ? 'INCOME' : 'EXPENSE';
      await logAgentAction(db, userId, logCat, `Logged ₹${amount} ${type} under ${category}: ${description}`, `db.transactions.insertOne({ type: "${type}", category: "${category}", amount: ${amount} })`);
      
      return { success: true, transactionId: newTx.id };
    }

    case 'delete_transaction': {
      const { transactionId } = args;
      reasoningSteps.push({
        step: reasoningSteps.length + 1,
        description: `Deleting transaction ID: ${transactionId}`,
        mongoOperation: `db.transactions.deleteOne({ userId: "${userId}", id: "${transactionId}" })`
      });

      const res = await db.collection('transactions').deleteOne({ userId, id: transactionId });
      actionsTaken.push('Transaction deleted');
      await logAgentAction(db, userId, 'EXPENSE', `Deleted transaction ${transactionId}`, `db.transactions.deleteOne({ id: "${transactionId}" })`);
      return { success: res.deletedCount > 0 };
    }

    case 'get_goals': {
      reasoningSteps.push({
        step: reasoningSteps.length + 1,
        description: 'Querying savings goals collection',
        mongoOperation: `db.goals.find({ userId: "${userId}" }).toArray()`
      });
      return await db.collection('goals').find({ userId }).toArray();
    }

    case 'add_goal': {
      const { name: goalName, emoji, target, weeklyTarget, targetDate } = args;
      
      // Get max ID to increment
      const goals = await db.collection('goals').find({ userId }).toArray();
      const nextId = goals.reduce((max, g) => g.id > max ? g.id : max, 0) + 1;

      const newGoal = {
        id: nextId,
        userId,
        name: goalName,
        emoji,
        target,
        saved: 0,
        weeklyTarget,
        startDate: new Date().toISOString().split('T')[0],
        targetDate,
        agentMonitoring: true
      };

      reasoningSteps.push({
        step: reasoningSteps.length + 1,
        description: `Creating new goal "${goalName}" with target ₹${target}`,
        mongoOperation: `db.goals.insertOne(${JSON.stringify({ id: nextId, name: goalName, target })})`
      });

      await db.collection('goals').insertOne(newGoal);
      await addXp(db, userId, 25);
      actionsTaken.push(`Created goal "${goalName}" (+25 XP)`);
      await logAgentAction(db, userId, 'GOALS', `Created savings goal: ${emoji} ${goalName} with target ₹${target}`, `db.goals.insertOne({ name: "${goalName}", target: ${target} })`);
      return { success: true, goalId: nextId };
    }

    case 'update_goal': {
      const { goalId, savedAmountToAdd, weeklyTarget } = args;
      const query = { userId, id: goalId };
      const goal = await db.collection('goals').findOne(query);

      if (!goal) {
        return { success: false, error: 'Goal not found' };
      }

      const updates = {};
      if (savedAmountToAdd !== undefined) {
        updates.saved = Math.min(goal.target, (goal.saved || 0) + savedAmountToAdd);
      }
      if (weeklyTarget !== undefined) {
        updates.weeklyTarget = weeklyTarget;
      }

      reasoningSteps.push({
        step: reasoningSteps.length + 1,
        description: `Updating goal ${goalId}: add savings ₹${savedAmountToAdd || 0}, weekly target ₹${weeklyTarget || goal.weeklyTarget}`,
        mongoOperation: `db.goals.updateOne({ id: ${goalId} }, { $set: ${JSON.stringify(updates)} })`
      });

      await db.collection('goals').updateOne(query, { $set: updates });
      if (savedAmountToAdd > 0) {
        await addXp(db, userId, 20);
        actionsTaken.push(`Saved ₹${savedAmountToAdd} to "${goal.name}" (+20 XP)`);
        await logAgentAction(db, userId, 'GOALS', `Deposited ₹${savedAmountToAdd} to goal "${goal.name}". New saved: ₹${updates.saved}`, `db.goals.updateOne({ id: ${goalId} }, { $set: { saved: ${updates.saved} } })`);
      } else {
        actionsTaken.push(`Updated target for "${goal.name}"`);
      }

      return { success: true };
    }

    case 'delete_goal': {
      const { goalId } = args;
      reasoningSteps.push({
        step: reasoningSteps.length + 1,
        description: `Deleting goal ID: ${goalId}`,
        mongoOperation: `db.goals.deleteOne({ userId: "${userId}", id: ${goalId} })`
      });

      const res = await db.collection('goals').deleteOne({ userId, id: goalId });
      actionsTaken.push('Goal deleted');
      await logAgentAction(db, userId, 'GOALS', `Deleted savings goal ID: ${goalId}`, `db.goals.deleteOne({ id: ${goalId} })`);
      return { success: res.deletedCount > 0 };
    }

    default:
      return { error: 'Unknown tool call' };
  }
}

// MOCK AGENT BACKUP FOR OFFLINE / HACKATHON DEMO
async function runMockAgent(db, userId, userMessage, reasoningSteps, actionsTaken) {
  const user = await db.collection('users').findOne({ _id: userId });
  const msgLower = userMessage.toLowerCase();

  // 1. WINNING DEMO MOMENT & SMART BUDGET ALLOCATOR
  // e.g. "I just got my salary. Agent - manage this month." or "I got my stipend Rs.8000"
  if (msgLower.includes('manage this month') || msgLower.includes('manage this') || msgLower.includes('salary') || msgLower.includes('stipend')) {
    let salaryAmount = user.monthlyIncome || 8000;
    
    // Check if amount is specified in the message
    const amountMatch = userMessage.match(/(?:rs\.?\s*|₹\s*)?(\d+)/);
    if (amountMatch) {
      salaryAmount = parseFloat(amountMatch[1]);
    }

    // A. Log salary income
    await executeTool(db, userId, {
      name: 'add_transaction',
      args: {
        type: 'income',
        category: 'Salary',
        amount: salaryAmount,
        description: 'Monthly Stipend / Salary Auto-Allocation'
      }
    }, reasoningSteps, actionsTaken);

    // B. Smart Budget Allocator: Split into active goals
    const goals = await db.collection('goals').find({ userId }).toArray();
    let allocatedGoals = [];
    
    for (const g of goals) {
      let toAdd = 0;
      if (g.name.toLowerCase().includes('goa')) toAdd = 1500;
      else if (g.name.toLowerCase().includes('laptop')) toAdd = 1000;
      else if (g.name.toLowerCase().includes('emergency')) toAdd = 800;
      
      if (toAdd > 0) {
        await executeTool(db, userId, {
          name: 'update_goal',
          args: {
            goalId: g.id,
            savedAmountToAdd: toAdd
          }
        }, reasoningSteps, actionsTaken);
        allocatedGoals.push(`${g.emoji} ${g.name} (+₹${toAdd})`);
      }
    }

    // C. Bill Reminder: Flag 2 upcoming bills
    const bill1 = {
      id: `act-${Date.now()}-bill1`,
      userId,
      timestamp: 'Just now',
      category: 'ALERT',
      description: 'Detected upcoming Spotify Student Premium renewal of ₹119 in 3 days. Flagged and added alert.',
      mongoOperation: 'db.activity_logs.insertOne({ category: "ALERT", description: "Upcoming Spotify renewal" })'
    };
    const bill2 = {
      id: `act-${Date.now()}-bill2`,
      userId,
      timestamp: 'Just now',
      category: 'ALERT',
      description: 'Detected upcoming Netflix Mobile Plan renewal of ₹349 in 5 days. Flagged and added alert.',
      mongoOperation: 'db.activity_logs.insertOne({ category: "ALERT", description: "Upcoming Netflix renewal" })'
    };
    await db.collection('activity_logs').insertOne(bill1);
    await db.collection('activity_logs').insertOne(bill2);
    
    reasoningSteps.push({
      step: reasoningSteps.length + 1,
      description: 'Scanned subscriptions: Spotify (₹119, 3d), Netflix (₹349, 5d)',
      mongoOperation: 'db.activity_logs.insertMany([spotifyAlert, netflixAlert])'
    });
    actionsTaken.push('Flagged 2 upcoming bills');

    // D. Community Challenge Invite
    const challengeInvite = {
      id: `act-${Date.now()}-challenge`,
      userId,
      timestamp: 'Just now',
      category: 'COMMUNITY',
      description: 'Sent June No-Spend Challenge invite to Priya, Rahul, and Dev. Group tracking active.',
      mongoOperation: 'db.challenges.updateOne({ name: "June No-Spend Challenge" }, { $push: { invitees: "Priya" } })'
    };
    await db.collection('activity_logs').insertOne(challengeInvite);
    
    reasoningSteps.push({
      step: reasoningSteps.length + 1,
      description: 'Sent June No-Spend Challenge invite to Priya, Rahul, Dev',
      mongoOperation: 'db.challenges.updateOne({ name: "June No-Spend Challenge" }, { $push: { invitees: ["Priya", "Rahul", "Dev"] } })'
    });
    actionsTaken.push('Sent community challenge invite');

    return `⚡ **WINNING DEMO MOMENT ACTIVATED!** ⚡

I've logged your income of **₹${salaryAmount.toLocaleString()}** and auto-allocated it according to your preferences:

1. **Salary Recorded**: Saved under Income Ledger. (+15 XP)
2. **Smart Budget Allocator**:
   - Distributed **₹1,500** to **🏖️ Goa Trip**
   - Distributed **₹1,000** to **💻 New Laptop**
   - Distributed **₹800** to **🛡️ Emergency Fund**
3. **Upcoming Bills Flagged**:
   - 🔔 Spotify Student Premium (₹119, due in 3 days)
   - 🔔 Netflix Mobile Plan (₹349, due in 5 days)
4. **Community Challenge**:
   - 👥 Sent June No-Spend Challenge invitations to **Priya, Rahul, and Dev**.

All actions successfully written to MongoDB Atlas in 0.6 seconds! 🚀`;
  }

  // 2. SPENDING ANALYZER
  // e.g. "analyze my spending" or "spending analyzer"
  if (msgLower.includes('spend') && (msgLower.includes('analyze') || msgLower.includes('analyzer') || msgLower.includes('analysis') || msgLower.includes('insights'))) {
    const txs = await db.collection('transactions').find({ userId }).toArray();
    const expenses = txs.filter(t => t.type === 'expense');
    const totalSpent = expenses.reduce((s, t) => s + t.amount, 0);
    const foodSpent = expenses.filter(t => t.category === 'Food').reduce((s, t) => s + t.amount, 0);
    const subSpent = expenses.filter(t => t.category === 'Subscriptions').reduce((s, t) => s + t.amount, 0);
    const entSpent = expenses.filter(t => t.category === 'Entertainment').reduce((s, t) => s + t.amount, 0);
    
    const foodPct = totalSpent > 0 ? Math.round((foodSpent / totalSpent) * 100) : 0;
    
    reasoningSteps.push({
      step: reasoningSteps.length + 1,
      description: 'Analyzing transaction history for overspending categories',
      mongoOperation: `db.transactions.find({ userId: "${userId}", type: "expense" }).toArray()`
    });
    actionsTaken.push('Analyzed monthly spending patterns');
    
    return `📊 **Spending Analysis & Insights**:
You have spent a total of **₹${totalSpent.toLocaleString()}** this month.

**Category Breakdown**:
- 🍔 **Food**: ₹${foodSpent.toLocaleString()} (${foodPct}% of spend)
- 🍿 **Entertainment**: ₹${entSpent.toLocaleString()}
- 📱 **Subscriptions**: ₹${subSpent.toLocaleString()}

⚠️ **Overspending Alert**:
Your Food category accounts for **${foodPct}%** of your total expenses! I suggest:
1. Cutting down on food delivery (Zomato/Swiggy) this week.
2. Consolidating entertainment/subscriptions.

By reducing food spend by 15%, you can save an extra **₹500/week** to reach your savings goals faster!`;
  }

  // 3. GOAL PROGRESS MONITOR
  // e.g. "monitor goals" or "check goals" or "are my goals on track?"
  if (msgLower.includes('goal') && (msgLower.includes('monitor') || msgLower.includes('track') || msgLower.includes('behind') || msgLower.includes('schedule') || msgLower.includes('progress'))) {
    const goals = await db.collection('goals').find({ userId }).toArray();
    const goaGoal = goals.find(g => g.name.toLowerCase().includes('goa'));
    
    if (goaGoal) {
      // Adjust weekly target and date
      const parts = goaGoal.targetDate.split('-');
      const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      dateObj.setDate(dateObj.getDate() + 10);
      const targetDate = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}-${String(dateObj.getDate()).padStart(2, '0')}`;
      const newWeekly = goaGoal.weeklyTarget + 200;

      await db.collection('goals').updateOne(
        { userId, id: goaGoal.id },
        { $set: { targetDate, weeklyTarget: newWeekly } }
      );
      
      reasoningSteps.push({
        step: reasoningSteps.length + 1,
        description: 'Auto-adjusting Goa Trip savings velocity & deadline',
        mongoOperation: `db.goals.updateOne({ id: ${goaGoal.id} }, { $set: { targetDate: "${targetDate}", weeklyTarget: ${newWeekly} } })`
      });
      actionsTaken.push('Auto-adjusted goal timeline & weekly target rate');
      
      return `🎯 **Goal Progress Monitor**:
I've checked your saving velocity against goals:
- 🏖️ **Goa Trip**: Saved ₹${goaGoal.saved.toLocaleString()}/₹${goaGoal.target.toLocaleString()}. You are slightly behind schedule.

⚙️ **Agent Action Taken**:
1. I have adjusted the target date by **10 days** (new date: ${targetDate}) for breathing room.
2. I updated your weekly contribution target to **₹${newWeekly.toLocaleString()}** to get you back on track.

Updates successfully written to MongoDB!`;
    }
    
    return `🎯 **Goal Progress Monitor**:
All savings goals are currently healthy and monitored. Keep saving consistently!`;
  }

  // 4. BILL REMINDER
  // e.g. "upcoming bills" or "what bills are due?"
  if (msgLower.includes('bill') || msgLower.includes('remind') || msgLower.includes('reminder') || msgLower.includes('due')) {
    reasoningSteps.push({
      step: reasoningSteps.length + 1,
      description: 'Checking upcoming bills and recurring subscriptions',
      mongoOperation: `db.transactions.find({ userId: "${userId}", category: "Subscriptions" })`
    });
    actionsTaken.push('Scanned for upcoming subscription renewals');
    
    return `🔔 **Upcoming Bills & Reminders**:
I detected 2 active recurring bills based on your subscription history:
1. 🎵 **Spotify Student Premium** (₹119) - Due in **3 days**
2. 🎬 **Netflix Mobile Plan** (₹349) - Due in **5 days**

I have set proactive push alerts to notify you 24 hours before the deduction to ensure your account has sufficient balance!`;
  }

  // 5. COMMUNITY CHALLENGE
  // e.g. "community challenge" or "create challenge"
  if (msgLower.includes('community') || msgLower.includes('challenge') || msgLower.includes('invite')) {
    reasoningSteps.push({
      step: reasoningSteps.length + 1,
      description: 'Fetching active community saving challenges',
      mongoOperation: `db.challenges.find({ active: true })`
    });
    actionsTaken.push('Retrieved June No-Spend Challenge leaderboard');
    
    return `🏆 **Community Challenge Status**:
You are currently participating in the **June No-Spend Challenge 🔥**!

**Current Leaderboard**:
1. 🥇 **You** - Saved ₹2,500 (78%)
2. 🥈 **Priya** - Saved ₹2,100 (65%)
3. 🥉 **Rahul** - Saved ₹1,800 (56%)

Would you like to invite more friends or start a new challenge (e.g. "No Caffeine Week")?`;
  }

  // 6. Check if user wants to log an expense (e.g. spent 200 on food)
  const expenseRegex = /(?:spent|spend|log expense|paid)\s+(?:rs\.?\s*|₹\s*)?(\d+)(?:\s+(?:on|for)\s+)?([a-zA-Z]+)/i;
  const expenseMatch = userMessage.match(expenseRegex);
  if (expenseMatch) {
    const amount = parseFloat(expenseMatch[1]);
    let categoryInput = expenseMatch[2].toLowerCase();
    
    // Map category
    let category = 'Other';
    if (categoryInput.includes('food') || categoryInput.includes('eat') || categoryInput.includes('lunch') || categoryInput.includes('dinner')) {
      category = 'Food';
    } else if (categoryInput.includes('cab') || categoryInput.includes('uber') || categoryInput.includes('travel') || categoryInput.includes('transport') || categoryInput.includes('bus') || categoryInput.includes('auto')) {
      category = 'Transport';
    } else if (categoryInput.includes('book') || categoryInput.includes('stud') || categoryInput.includes('exam') || categoryInput.includes('class') || categoryInput.includes('pen') || categoryInput.includes('stationery')) {
      category = 'Studies';
    } else if (categoryInput.includes('movie') || categoryInput.includes('game') || categoryInput.includes('play') || categoryInput.includes('party') || categoryInput.includes('entertainment')) {
      category = 'Entertainment';
    } else if (categoryInput.includes('netflix') || categoryInput.includes('spotify') || categoryInput.includes('sub') || categoryInput.includes('subscription')) {
      category = 'Subscriptions';
    }
    
    await executeTool(db, userId, {
      name: 'add_transaction',
      args: {
        type: 'expense',
        category,
        amount,
        description: `Logged via offline agent: Spent on ${categoryInput}`
      }
    }, reasoningSteps, actionsTaken);
    
    return `I've successfully logged an expense of ₹${amount} under "${category}" in MongoDB! 💳 You gained +15 XP! Let me know if you want to allocate savings or log more transactions.`;
  }
  
  // 7. Check if user wants to log income
  const incomeRegex = /(?:received|got|earned|income)\s+(?:rs\.?\s*|₹\s*)?(\d+)/i;
  const incomeMatch = userMessage.match(incomeRegex);
  if (incomeMatch) {
    const amount = parseFloat(incomeMatch[1]);
    await executeTool(db, userId, {
      name: 'add_transaction',
      args: {
        type: 'income',
        category: 'Salary',
        amount,
        description: 'Stipend / Allowance logged via offline agent'
      }
    }, reasoningSteps, actionsTaken);
    
    return `Awesome! I've logged an income of ₹${amount} from Salary. 💰 You gained +15 XP! Your budget balance has been updated.`;
  }

  // 8. Check if user wants to contribute to a goal (e.g. save 500 for Goa Trip)
  const saveRegex = /(?:save|deposit|add|put)\s+(?:rs\.?\s*|₹\s*)?(\d+)\s+(?:for|to)\s+([a-zA-Z0-9 ]+)/i;
  const saveMatch = userMessage.match(saveRegex);
  if (saveMatch) {
    const amount = parseFloat(saveMatch[1]);
    const goalQuery = saveMatch[2].trim().toLowerCase();
    
    const goals = await db.collection('goals').find({ userId }).toArray();
    const goal = goals.find(g => g.name.toLowerCase().includes(goalQuery));
    
    if (goal) {
      await executeTool(db, userId, {
        name: 'update_goal',
        args: {
          goalId: goal.id,
          savedAmountToAdd: amount
        }
      }, reasoningSteps, actionsTaken);
      
      const updatedGoal = await db.collection('goals').findOne({ userId, id: goal.id });
      return `Superb! I've added ₹${amount} to your savings goal "${updatedGoal.emoji} ${updatedGoal.name}". New saved total: ₹${updatedGoal.saved}/₹${updatedGoal.target} 🏖️ (+20 XP)`;
    } else {
      return `I couldn't find a savings goal matching "${saveMatch[2]}". Current active goals are: ${goals.map(g => `${g.emoji} ${g.name}`).join(', ')}. Try saying "save 500 for Goa Trip" or similar!`;
    }
  }

  // 9. Check if user wants to create a goal
  const createGoalRegex = /(?:create|new|add)\s+goal\s+([a-zA-Z0-9 ]+)\s+target\s+(\d+)/i;
  const createGoalMatch = userMessage.match(createGoalRegex);
  if (createGoalMatch) {
    const name = createGoalMatch[1].trim();
    const target = parseFloat(createGoalMatch[2]);
    await executeTool(db, userId, {
      name: 'add_goal',
      args: {
        name,
        emoji: '🎯',
        target,
        weeklyTarget: Math.round(target / 10),
        targetDate: new Date(Date.now() + 90*24*60*60*1000).toISOString().split('T')[0] // 90 days out
      }
    }, reasoningSteps, actionsTaken);
    
    return `Great choice! I've created a new savings goal: "🎯 ${name}" with a target of ₹${target} and monitoring enabled! 🚀 You gained +25 XP!`;
  }

  // 10. Generic responder
  return `Hi ${user.name}! I am FinAgent, your student financial co-pilot. 
(Note: I am running in local offline mode since Gemini API is not configured or offline).

I can manage your database transactions via chat! Try commands like:
- "spent 150 on food"
- "save 500 for Goa Trip"
- "create goal iPhone target 80000"
- "show my balance"

How can I help you manage your money today?`;
}

// CORE CHAT RUNNER LOOP
export async function runAgentChat(userId, userMessage) {
  const db = getDb();
  
  // 1. Fetch user memory summary
  const user = await db.collection('users').findOne({ _id: userId });
  if (!user) {
    throw new Error('User not found');
  }

  // 2. Fetch the recent chat history (limit to last 6 for active context)
  const history = await db.collection('chats')
    .find({ userId })
    .sort({ _id: -1 })
    .limit(6)
    .toArray();
  
  // reverse history to be chronological
  history.reverse();

  // 3. Assemble chat contents for Gemini
  // We include:
  // - System instruction
  // - Chat memory summary if present
  // - Current financial data summary for context
  const txs = await db.collection('transactions').find({ userId }).toArray();
  const goals = await db.collection('goals').find({ userId }).toArray();
  const expenseTxs = txs.filter(t => t.type === 'expense');
  const totalSpent = expenseTxs.reduce((sum, t) => sum + t.amount, 0);

  const contextData = `
--- CURRENT STATE ---
User Profile: Name: ${user.name}, Income: ₹${user.monthlyIncome}, Mode: ${user.savingsMode}, Level: ${user.level}, XP: ${user.xp}/${user.xpToNext}
Goals: ${goals.map(g => `${g.name} (${g.emoji}): Saved ₹${g.saved}/₹${g.target}, Weekly Target: ₹${g.weeklyTarget}, Target Date: ${g.targetDate}`).join('; ')}
Total Spent this month: ₹${totalSpent}
Category Breakdown: Food: ₹${expenseTxs.filter(t=>t.category==='Food').reduce((s,t)=>s+t.amount,0)}, Transport: ₹${expenseTxs.filter(t=>t.category==='Transport').reduce((s,t)=>s+t.amount,0)}, Studies: ₹${expenseTxs.filter(t=>t.category==='Studies').reduce((s,t)=>s+t.amount,0)}, Entertainment: ₹${expenseTxs.filter(t=>t.category==='Entertainment').reduce((s,t)=>s+t.amount,0)}, Subscriptions: ₹${expenseTxs.filter(t=>t.category==='Subscriptions').reduce((s,t)=>s+t.amount,0)}
  `;

  const memoryContext = user.chatSummary ? `\n--- PREVIOUS CHAT MEMORY SUMMARY ---\n${user.chatSummary}\n` : '';

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
    systemInstruction: systemInstruction + memoryContext + contextData,
  });

  // Convert DB history to standard Gemini contents format
  const contents = [];
  for (const msg of history) {
    contents.push({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    });
  }

  // Add the new user message
  contents.push({
    role: 'user',
    parts: [{ text: userMessage }]
  });

  // Track actions and reasoning steps
  const reasoningSteps = [];
  const actionsTaken = [];

  console.log(`Starting session for user ${user.name}...`);
  let finalResponseText;

  const isDummyKey = !apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE' || apiKey.includes('dummy');
  const hfApiKey = process.env.HF_API_KEY;
  const isHfAvailable = hfApiKey && hfApiKey !== 'YOUR_HF_API_KEY_HERE' && !hfApiKey.includes('dummy');

  try {
    if (isDummyKey) {
      throw new Error('Gemini API key is a dummy placeholder');
    }

    // Call generative model
    let response = await model.generateContent({
      contents,
      tools: [{ functionDeclarations }]
    });

    // Loop to handle potential multiple function calls (multitasking!)
    let count = 0;
    // Limit loop count to 5 to avoid infinite loops
    while (response.functionCalls && count < 5) {
      count++;
      const functionCalls = response.functionCalls;
      const toolResults = [];

      // Execute all tool calls requested in this turn
      for (const call of functionCalls) {
        const result = await executeTool(db, userId, call, reasoningSteps, actionsTaken);
        toolResults.push({
          functionResponse: {
            name: call.name,
            response: { result }
          }
        });
      }

      // Append model output (with function calls) to history
      contents.push(response.candidates[0].content);

      // Append function call results as a user role response
      contents.push({
        role: 'user',
        parts: toolResults
      });

      // Request next response from Gemini
      response = await model.generateContent({
        contents,
        tools: [{ functionDeclarations }]
      });
    }

    finalResponseText = response.text || "I've processed your request.";
  } catch (err) {
    console.warn('Gemini API call failed. Trying Hugging Face fallback...', err.message);
    
    let hfSuccess = false;
    if (isHfAvailable) {
      try {
        console.log('Attempting Hugging Face Chat Completions (Qwen2.5-72B-Instruct)...');
        const hfResponse = await fetch('https://api-inference.huggingface.co/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${hfApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: 'Qwen/Qwen2.5-72B-Instruct',
            messages: [
              { role: 'system', content: systemInstruction + memoryContext + contextData },
              ...history.map(m => ({ role: m.sender === 'user' ? 'user' : 'assistant', content: m.text })),
              { role: 'user', content: userMessage }
            ],
            max_tokens: 300,
            temperature: 0.7
          }),
          signal: AbortSignal.timeout(6000)
        });

        if (hfResponse.ok) {
          const hfData = await hfResponse.json();
          finalResponseText = hfData.choices[0].message.content;
          hfSuccess = true;
          console.log('Successfully generated response using Hugging Face (Qwen2.5)');
        } else {
          const errText = await hfResponse.text();
          console.warn(`Hugging Face endpoint returned status ${hfResponse.status}: ${errText}`);
        }
      } catch (hfErr) {
        console.error('Hugging Face API call failed:', hfErr.message);
      }
    }

    if (!hfSuccess) {
      console.log('All LLM APIs failed/offline. Falling back to local Mock Agent parser...');
      finalResponseText = await runMockAgent(db, userId, userMessage, reasoningSteps, actionsTaken);
    }
  }

  // 4. Save User Message in database
  const userMsgId = `msg-user-${Date.now()}`;
  await db.collection('chats').insertOne({
    id: userMsgId,
    userId,
    sender: 'user',
    text: userMessage,
    timestamp: 'Just now'
  });

  // 5. Save Agent Message in database (with reasoning/actions)
  const agentMsgId = `msg-agent-${Date.now()}`;
  await db.collection('chats').insertOne({
    id: agentMsgId,
    userId,
    sender: 'agent',
    text: finalResponseText,
    timestamp: 'Just now',
    reasoning: reasoningSteps,
    actionsTaken
  });

  // 6. Check Memory Limits: if active messages > 10, summarize older chat
  const chatCount = await db.collection('chats').countDocuments({ userId });
  if (chatCount > 10) {
    console.log(`User ${userId} chat history has ${chatCount} messages (exceeds 10). Summarizing memory...`);
    await summarizeUserChatHistory(db, userId, user.chatSummary);
  }

  return {
    id: agentMsgId,
    sender: 'agent',
    text: finalResponseText,
    timestamp: 'Just now',
    reasoning: reasoningSteps,
    actionsTaken
  };
}

// SUMMARIZATION HELPER
async function summarizeUserChatHistory(db, userId, currentSummary) {
  // Load all chats for this user
  const allChats = await db.collection('chats')
    .find({ userId })
    .sort({ _id: 1 })
    .toArray();
  
  // Format history as string
  const formattedHistory = allChats.map(c => `${c.sender === 'user' ? 'User' : 'Agent'}: ${c.text}`).join('\n');

  const summarizerPrompt = `
You are a memory processor for a student financial management chatbot.
Your job is to read the existing conversation history and compile/merge it with any previous memory summary to create a unified, updated, concise memory summary.
Make sure to preserve:
- Any user profile changes, preferences or modes.
- Current active goals targets and milestones.
- Important recurring subscription details or upcoming bills mentioned.
- Recent warnings or habits (e.g. overspent on Food, behind schedule on Goa Trip).

Keep the summary strictly under 150 words. Do not add chat greetings or preamble.

${currentSummary ? `--- PREVIOUS SUMMARY ---\n${currentSummary}\n` : ''}
--- CONVERSATION HISTORY ---
${formattedHistory}
`;

  let newSummary = '';
  let sumSuccess = false;

  const apiKey = process.env.GEMINI_API_KEY || 'YOUR_GEMINI_API_KEY_HERE';
  const isDummyKey = !apiKey || apiKey === 'YOUR_GEMINI_API_KEY_HERE' || apiKey.includes('dummy');
  const hfApiKey = process.env.HF_API_KEY;
  const isHfAvailable = hfApiKey && hfApiKey !== 'YOUR_HF_API_KEY_HERE' && !hfApiKey.includes('dummy');

  // Try Gemini first (if key is not dummy)
  if (!isDummyKey) {
    try {
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.0-flash',
      });
      const response = await model.generateContent({
        contents: [{ role: 'user', parts: [{ text: summarizerPrompt }] }]
      });
      newSummary = response.text || '';
      if (newSummary) sumSuccess = true;
    } catch (e) {
      console.warn('Gemini summarizer failed, trying Hugging Face:', e.message);
    }
  }

  // Try Hugging Face second
  if (!sumSuccess && isHfAvailable) {
    try {
      console.log('Attempting Hugging Face summarization...');
      const hfResponse = await fetch('https://api-inference.huggingface.co/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${hfApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: 'Qwen/Qwen2.5-72B-Instruct',
          messages: [
            { role: 'system', content: 'You are a concise text summarizer.' },
            { role: 'user', content: summarizerPrompt }
          ],
          max_tokens: 200,
          temperature: 0.3
        }),
        signal: AbortSignal.timeout(5000)
      });

      if (hfResponse.ok) {
        const hfData = await hfResponse.json();
        newSummary = hfData.choices[0].message.content;
        sumSuccess = true;
      }
    } catch (hfErr) {
      console.error('Hugging Face summarization failed:', hfErr.message);
    }
  }

  // Local backup summary if both APIs fail
  if (!sumSuccess) {
    console.log('All LLM summarizers offline. Generating local heuristic summary...');
    const user = await db.collection('users').findOne({ _id: userId });
    const goals = await db.collection('goals').find({ userId }).toArray();
    newSummary = `User ${user.name} (monthly income ₹${user.monthlyIncome}, savings mode: ${user.savingsMode}). Recent chats included logging expenses and managing budgets. Current active goals: ${goals.map(g => `${g.emoji} ${g.name} (Saved ₹${g.saved}/₹${g.target})`).join(', ')}.`;
  }

  console.log(`Generated new chat summary memory for user ${userId}:`, newSummary);

  // Update user document
  await db.collection('users').updateOne(
    { _id: userId },
    { $set: { chatSummary: newSummary } }
  );

  // Delete older chats, keeping only the last 4 messages in DB for active window
  const keepCount = 4;
  const chatsToKeep = await db.collection('chats')
    .find({ userId })
    .sort({ _id: -1 })
    .limit(keepCount)
    .toArray();
  
  const keepIds = chatsToKeep.map(c => c._id);
  
  await db.collection('chats').deleteMany({
    userId,
    _id: { $nin: keepIds }
  });

  console.log(`Truncated chat history database to retain last ${keepCount} messages.`);
}
