import dotenv from 'dotenv';
import { getDb } from './db.js';

dotenv.config();

// Standard import for @google/generative-ai is:
import { GoogleGenerativeAI } from '@google/generative-ai';

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error('Please define the GEMINI_API_KEY environment variable in server/.env');
}

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

  console.log(`Starting Gemini session for user ${user.name}...`);

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

  const finalResponseText = response.text || "I've processed your request.";

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

  const model = genAI.getGenerativeModel({
    model: 'gemini-2.0-flash',
  });

  const response = await model.generateContent({
    contents: [{ role: 'user', parts: [{ text: summarizerPrompt }] }]
  });

  const newSummary = response.text || 'No summary generated.';
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
