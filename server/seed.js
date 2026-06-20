import { connectDb, getDb } from './db.js';

const users = [
  {
    _id: 'usr_1',
    name: 'Arjun',
    monthlyIncome: 8000,
    savingsMode: 'Balanced',
    xp: 340,
    level: 'Budget Pro',
    nextLevel: 'Financial Genius',
    xpToNext: 500,
    badges: ['First Goal Saved', '7-Day Streak', 'Budget Master'],
    autoSmsEnabled: false,
    chatSummary: ''
  },
  {
    _id: 'usr_2',
    name: 'Priya',
    monthlyIncome: 12000,
    savingsMode: 'Aggressive',
    xp: 620,
    level: 'Financial Genius',
    nextLevel: 'Wealth Guru',
    xpToNext: 1000,
    badges: ['Consistency King', 'High Saver', 'Super Investor'],
    autoSmsEnabled: true,
    chatSummary: 'Priya is aggressive with savings. She wants to buy a DSLR and invest in stock market basics.'
  },
  {
    _id: 'usr_3',
    name: 'Rahul',
    monthlyIncome: 6000,
    savingsMode: 'Conservative',
    xp: 180,
    level: 'Rookie Saver',
    nextLevel: 'Budget Pro',
    xpToNext: 300,
    badges: ['First Step'],
    autoSmsEnabled: false,
    chatSummary: ''
  },
  {
    _id: 'usr_4',
    name: 'Aisha',
    monthlyIncome: 15000,
    savingsMode: 'Balanced',
    xp: 450,
    level: 'Budget Pro',
    nextLevel: 'Financial Genius',
    xpToNext: 500,
    badges: ['Goal Crusher', 'Smart Shopper'],
    autoSmsEnabled: true,
    chatSummary: ''
  },
  {
    _id: 'usr_5',
    name: 'Kabir',
    monthlyIncome: 9500,
    savingsMode: 'Aggressive',
    xp: 290,
    level: 'Budget Pro',
    nextLevel: 'Financial Genius',
    xpToNext: 500,
    badges: ['7-Day Streak'],
    autoSmsEnabled: false,
    chatSummary: ''
  },
  {
    _id: 'usr_6',
    name: 'Rohan',
    monthlyIncome: 7000,
    savingsMode: 'Balanced',
    xp: 120,
    level: 'Rookie Saver',
    nextLevel: 'Budget Pro',
    xpToNext: 300,
    badges: [],
    autoSmsEnabled: false,
    chatSummary: ''
  },
  {
    _id: 'usr_7',
    name: 'Meera',
    monthlyIncome: 11000,
    savingsMode: 'Conservative',
    xp: 510,
    level: 'Financial Genius',
    nextLevel: 'Wealth Guru',
    xpToNext: 1000,
    badges: ['Budget Master', 'First Goal Saved'],
    autoSmsEnabled: true,
    chatSummary: ''
  },
  {
    _id: 'usr_8',
    name: 'Dev',
    monthlyIncome: 5000,
    savingsMode: 'Balanced',
    xp: 80,
    level: 'Rookie Saver',
    nextLevel: 'Budget Pro',
    xpToNext: 300,
    badges: [],
    autoSmsEnabled: false,
    chatSummary: ''
  },
  {
    _id: 'usr_9',
    name: 'Zara',
    monthlyIncome: 13000,
    savingsMode: 'Aggressive',
    xp: 750,
    level: 'Financial Genius',
    nextLevel: 'Wealth Guru',
    xpToNext: 1000,
    badges: ['Consistency King', 'Frugal Master', '100k Saved'],
    autoSmsEnabled: true,
    chatSummary: ''
  },
  {
    _id: 'usr_10',
    name: 'Ananya',
    monthlyIncome: 8500,
    savingsMode: 'Balanced',
    xp: 220,
    level: 'Rookie Saver',
    nextLevel: 'Budget Pro',
    xpToNext: 300,
    badges: ['First Goal Saved'],
    autoSmsEnabled: false,
    chatSummary: ''
  }
];

const generateTransactions = (userId, incomeAmount) => {
  return [
    {
      id: `tx-${userId}-1`,
      userId,
      type: 'income',
      category: 'Salary',
      amount: incomeAmount,
      description: 'Monthly Stipend / Allowance',
      timestamp: '2 days ago',
      mongoCollection: 'user_transactions'
    },
    {
      id: `tx-${userId}-2`,
      userId,
      type: 'expense',
      category: 'Food',
      amount: Math.round(incomeAmount * 0.04),
      description: 'Dinner at student mess',
      timestamp: '2 days ago',
      mongoCollection: 'user_transactions'
    },
    {
      id: `tx-${userId}-3`,
      userId,
      type: 'expense',
      category: 'Entertainment',
      amount: Math.round(incomeAmount * 0.03),
      description: 'Movie ticket with friends',
      timestamp: '1 day ago',
      mongoCollection: 'user_transactions'
    },
    {
      id: `tx-${userId}-4`,
      userId,
      type: 'expense',
      category: 'Food',
      amount: Math.round(incomeAmount * 0.02),
      description: 'Starbucks coffee',
      timestamp: '1 day ago',
      mongoCollection: 'user_transactions'
    },
    {
      id: `tx-${userId}-5`,
      userId,
      type: 'expense',
      category: 'Studies',
      amount: Math.round(incomeAmount * 0.1),
      description: 'Reference textbooks and stationery',
      timestamp: '1 day ago',
      mongoCollection: 'user_transactions'
    },
    {
      id: `tx-${userId}-6`,
      userId,
      type: 'expense',
      category: 'Transport',
      amount: Math.round(incomeAmount * 0.025),
      description: 'Uber ride',
      timestamp: '18 hours ago',
      mongoCollection: 'user_transactions'
    },
    {
      id: `tx-${userId}-7`,
      userId,
      type: 'expense',
      category: 'Food',
      amount: Math.round(incomeAmount * 0.035),
      description: 'Lunch at college cafeteria',
      timestamp: '15 hours ago',
      mongoCollection: 'user_transactions'
    },
    {
      id: `tx-${userId}-8`,
      userId,
      type: 'expense',
      category: 'Subscriptions',
      amount: 119,
      description: 'Spotify Student Premium',
      timestamp: '12 hours ago',
      mongoCollection: 'user_transactions'
    },
    {
      id: `tx-${userId}-9`,
      userId,
      type: 'expense',
      category: 'Subscriptions',
      amount: 349,
      description: 'Netflix Mobile Plan',
      timestamp: '8 hours ago',
      mongoCollection: 'user_transactions'
    }
  ];
};

const generateGoals = (userId, monthlyIncome) => {
  return [
    {
      id: 1,
      userId,
      name: 'Goa Trip',
      emoji: '🏖️',
      target: 15000,
      saved: Math.round(monthlyIncome * 0.75),
      weeklyTarget: 1500,
      startDate: '2026-05-01',
      targetDate: '2026-08-01',
      agentMonitoring: true
    },
    {
      id: 2,
      userId,
      name: 'New Laptop',
      emoji: '💻',
      target: 40000,
      saved: Math.round(monthlyIncome * 0.25),
      weeklyTarget: 1000,
      startDate: '2026-04-01',
      targetDate: '2026-12-01',
      agentMonitoring: true
    },
    {
      id: 3,
      userId,
      name: 'Emergency Fund',
      emoji: '🛡️',
      target: 10000,
      saved: Math.round(monthlyIncome * 0.5),
      weeklyTarget: 800,
      startDate: '2026-03-01',
      targetDate: '2026-09-01',
      agentMonitoring: true
    }
  ];
};

const generateChatHistory = (userId, name) => {
  return [
    {
      id: `msg-${userId}-1`,
      userId,
      sender: 'user',
      text: `I just got my monthly stipend of ₹8,000!`,
      timestamp: '2 days ago'
    },
    {
      id: `msg-${userId}-2`,
      userId,
      sender: 'agent',
      text: `Great, I've logged your stipend in MongoDB and auto-allocated it according to your profile preferences! Let's hit those savings goals.`,
      timestamp: '2 days ago',
      reasoning: [
        { step: 1, description: 'Parsing user stipend notification' },
        { step: 2, description: 'Writing stipend income transaction to MongoDB transactions collection', mongoOperation: `db.transactions.insertOne({ userId: "${userId}", type: "income", amount: 8000 })` },
        { step: 3, description: 'Recalculating goals allocations', mongoOperation: `db.goals.updateMany({ userId: "${userId}" })` }
      ],
      actionsTaken: ['Logged stipend', 'Allocated to Goa Trip & Emergency Fund']
    }
  ];
};

const generateActivityLog = (userId) => {
  return [
    {
      id: `act-${userId}-1`,
      userId,
      timestamp: '2 hours ago',
      category: 'ALERT',
      description: 'Detected Netflix mobile subscription payment of ₹349. Deducted from Subscriptions budget.',
      mongoOperation: 'db.transactions.insertOne({ category: "Subscriptions", amount: 349 })'
    },
    {
      id: `act-${userId}-2`,
      userId,
      timestamp: '1 day ago',
      category: 'EXPENSE',
      description: 'Spent ₹800 on studies reference materials. Categorized and added to ledger.',
      mongoOperation: 'db.transactions.insertOne({ category: "Studies", amount: 800 })'
    },
    {
      id: `act-${userId}-3`,
      userId,
      timestamp: '2 days ago',
      category: 'INCOME',
      description: 'Stipend logged & distributed according to savings mode.',
      mongoOperation: 'db.transactions.insertOne() + db.goals.updateMany()'
    }
  ];
};

export async function seedDatabase() {
  const db = await connectDb();
  
  console.log('Clearing existing collections...');
  await db.collection('users').deleteMany({});
  await db.collection('transactions').deleteMany({});
  await db.collection('goals').deleteMany({});
  await db.collection('chats').deleteMany({});
  await db.collection('activity_logs').deleteMany({});

  console.log('Seeding users...');
  await db.collection('users').insertMany(users);

  console.log('Seeding transactions, goals, chats, and activity logs...');
  const seededTxs = [];
  const seededGoals = [];
  const seededChats = [];
  const seededActs = [];

  for (const user of users) {
    const txs = generateTransactions(user._id, user.monthlyIncome);
    const goals = generateGoals(user._id, user.monthlyIncome);
    const chats = generateChatHistory(user._id, user.name);
    const acts = generateActivityLog(user._id);

    seededTxs.push(...txs);
    seededGoals.push(...goals);
    seededChats.push(...chats);
    seededActs.push(...acts);
  }

  await db.collection('transactions').insertMany(seededTxs);
  await db.collection('goals').insertMany(seededGoals);
  await db.collection('chats').insertMany(seededChats);
  await db.collection('activity_logs').insertMany(seededActs);

  console.log('Database successfully seeded with 10 synthetic users and financial histories!');
}

// If run directly
const isDirectRun = process.argv[1] && (
  process.argv[1].endsWith('seed.js') || 
  import.meta.url.includes(process.argv[1].replace(/\\/g, '/').replace(/ /g, '%20'))
);
if (isDirectRun) {
  (async () => {
    try {
      await seedDatabase();
      process.exit(0);
    } catch (e) {
      console.error('Seeding failed:', e);
      process.exit(1);
    }
  })();
}

