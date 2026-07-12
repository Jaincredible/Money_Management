import { connectDb, getDb } from './db.js';
import { hashPassword } from './auth.js';
import dotenv from 'dotenv';

dotenv.config();

const DEMO_PASSWORD = process.env.DEMO_PASSWORD || 'finagent';

// --- 10 ready-to-use demo accounts (all log in with DEMO_PASSWORD; usr_1 is the featured one) ---
const profiles = [
  { _id: 'usr_1', username: 'arjun', fullName: 'Arjun Sharma', city: 'Pune', state: 'Maharashtra', college: 'COEP Technological University', income: 9000, mode: 'Balanced', prefs: ['Food', 'Travel', 'Entertainment'], featured: true },
  { _id: 'usr_2', username: 'priya', fullName: 'Priya Nair', city: 'Bengaluru', state: 'Karnataka', college: 'Christ University', income: 12000, mode: 'Aggressive', prefs: ['Shopping', 'Travel', 'Fitness'] },
  { _id: 'usr_3', username: 'rahul', fullName: 'Rahul Verma', city: 'Jaipur', state: 'Rajasthan', college: 'MNIT Jaipur', income: 6000, mode: 'Conservative', prefs: ['Studies', 'Food'] },
  { _id: 'usr_4', username: 'aisha', fullName: 'Aisha Khan', city: 'Hyderabad', state: 'Telangana', college: 'IIIT Hyderabad', income: 15000, mode: 'Balanced', prefs: ['Sports', 'Food', 'Subscriptions'] },
  { _id: 'usr_5', username: 'kabir', fullName: 'Kabir Singh', city: 'Chandigarh', state: 'Punjab', college: 'Panjab University', income: 9500, mode: 'Aggressive', prefs: ['Fitness', 'Sports', 'Groceries'] },
  { _id: 'usr_6', username: 'rohan', fullName: 'Rohan Das', city: 'Kolkata', state: 'West Bengal', college: 'Jadavpur University', income: 7000, mode: 'Balanced', prefs: ['Entertainment', 'Transport'] },
  { _id: 'usr_7', username: 'meera', fullName: 'Meera Iyer', city: 'Chennai', state: 'Tamil Nadu', college: 'Anna University', income: 11000, mode: 'Conservative', prefs: ['Studies', 'Groceries', 'Travel'] },
  { _id: 'usr_8', username: 'dev', fullName: 'Dev Patel', city: 'Ahmedabad', state: 'Gujarat', college: 'Nirma University', income: 5000, mode: 'Balanced', prefs: ['Food', 'Shopping'] },
  { _id: 'usr_9', username: 'zara', fullName: 'Zara Sheikh', city: 'Mumbai', state: 'Maharashtra', college: 'NMIMS Mumbai', income: 13000, mode: 'Aggressive', prefs: ['Travel', 'Shopping', 'Fitness'] },
  { _id: 'usr_10', username: 'ananya', fullName: 'Ananya Reddy', city: 'Visakhapatnam', state: 'Andhra Pradesh', college: 'GITAM University', income: 8500, mode: 'Balanced', prefs: ['Food', 'Studies', 'Entertainment'] }
];

const levelFor = (xp) => {
  if (xp >= 620) return { level: 'Financial Genius', nextLevel: 'Wealth Guru', xpToNext: 1000, badges: ['Consistency King', 'High Saver', 'Budget Master'] };
  if (xp >= 300) return { level: 'Budget Pro', nextLevel: 'Financial Genius', xpToNext: 500, badges: ['First Goal Saved', '7-Day Streak'] };
  return { level: 'Rookie Saver', nextLevel: 'Budget Pro', xpToNext: 300, badges: ['First Step'] };
};

const rand = (min, max) => Math.round(min + Math.random() * (max - min));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
const iso = (daysAgo, hour = 12) => {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, rand(0, 59), 0, 0);
  return d.toISOString();
};

// Category -> [minAmt, maxAmt, [descriptions]]
const CAT = {
  Food: [70, 420, ['Canteen lunch', 'Zomato dinner', 'Chai & samosa', 'Swiggy late-night', 'Cafe with friends']],
  Groceries: [200, 1300, ['Weekly groceries', 'Milk & eggs run', 'Instamart order', 'Snacks restock']],
  Transport: [30, 340, ['Uber to campus', 'Metro card recharge', 'Auto fare', 'Ola ride', 'Bus pass']],
  Travel: [900, 6500, ['Train ticket home', 'Weekend trip bus', 'Flight booking advance', 'Hostel booking']],
  Studies: [150, 2400, ['Reference textbook', 'Stationery', 'Online course', 'Lab manual', 'Printout & binding']],
  Entertainment: [150, 1200, ['Movie tickets', 'Concert pass', 'Gaming top-up', 'Bowling night']],
  Sports: [300, 2500, ['Football turf booking', 'Cricket kit', 'Badminton court', 'Sports shoes']],
  Shopping: [400, 3500, ['New hoodie', 'Sneakers', 'Headphones', 'Backpack']],
  Subscriptions: [99, 799, ['Spotify Premium', 'Netflix Mobile', 'YouTube Premium', 'iCloud storage']],
  Fitness: [500, 2200, ['Gym monthly fee', 'Protein supplement', 'Yoga class', 'Cycling gear']]
};

function makeTransactions(userId, income, prefs) {
  const txs = [];
  const add = (type, category, amount, description, daysAgo, hour) => txs.push({
    id: `tx-${userId}-${txs.length + 1}`, userId, type, category, amount, description, date: iso(daysAgo, hour)
  });

  // 3 months of stipend (this month + previous two)
  add('income', 'Salary', income, 'Monthly stipend / allowance', 2, 10);
  add('income', 'Salary', income, 'Monthly stipend / allowance', 34, 10);
  add('income', 'Salary', income, 'Monthly stipend / allowance', 64, 10);
  add('income', 'Freelance', rand(500, 2500), 'Freelance design gig', 9, 15);

  // Bias categories toward the user's preferences so spending looks preference-driven.
  const catPool = [...prefs, ...prefs, 'Food', 'Transport', 'Studies', 'Subscriptions', 'Groceries'];
  const spend = (daysAgo) => {
    const cat = pick(catPool);
    const [lo, hi, descs] = CAT[cat] || CAT.Food;
    add('expense', cat, rand(lo, hi), pick(descs), daysAgo, rand(8, 22));
  };

  // Today (0) and this week (1-6): the "Today" / recent buckets
  spend(0); spend(0);
  for (const d of [1, 2, 3, 4, 5, 6]) spend(d);
  // Rest of this month (7-11 — today is the 12th)
  for (const d of [7, 8, 10, 11]) spend(d);
  // Earlier this year (previous months)
  for (const d of [20, 27, 33, 40, 48, 61, 75, 96]) spend(d);
  // Fixed subscriptions this month for realism
  add('expense', 'Subscriptions', 119, 'Spotify Premium', 5, 9);
  add('expense', 'Subscriptions', 199, 'Netflix Mobile', 8, 9);

  return txs;
}

function makeGoals(userId, income) {
  return [
    { id: 1, userId, name: 'Goa Trip', emoji: '🏖️', target: 15000, saved: rand(4000, 9000), weeklyTarget: 1500, startDate: iso(70).split('T')[0], targetDate: '2026-09-15', agentMonitoring: true },
    { id: 2, userId, name: 'New Laptop', emoji: '💻', target: 55000, saved: rand(8000, 20000), weeklyTarget: 2000, startDate: iso(90).split('T')[0], targetDate: '2026-12-20', agentMonitoring: true },
    { id: 3, userId, name: 'Emergency Fund', emoji: '🛡️', target: 10000, saved: rand(3000, 8000), weeklyTarget: 800, startDate: iso(120).split('T')[0], targetDate: '2026-10-01', agentMonitoring: true }
  ];
}

function makeNotifications(userId, name) {
  return [
    { id: `ntf-${userId}-1`, userId, type: 'challenge', emoji: '🔥', title: 'Challenge invitation', message: `You've been invited to the "July No-Spend Weekend" challenge. Tap to join!`, read: false, date: iso(0, 9) },
    { id: `ntf-${userId}-2`, userId, type: 'suggestion', emoji: '🤖', title: 'Agent suggestion', message: `You're spending a bit fast on Food this week. Shift ₹300 to your Goa Trip and you'll still be comfortable.`, read: false, date: iso(0, 8) },
    { id: `ntf-${userId}-3`, userId, type: 'alert', emoji: '⚠️', title: 'Budget alert', message: `Subscriptions hit 80% of your monthly cap. Netflix + Spotify = ₹318.`, read: true, date: iso(2, 20) },
    { id: `ntf-${userId}-4`, userId, type: 'reward', emoji: '🏆', title: 'Badge unlocked', message: `Nice! You earned the "Budget Master" badge for staying under budget 7 days straight.`, read: true, date: iso(4, 18) }
  ];
}

function makeChats(userId) {
  return [
    { id: `msg-${userId}-1`, userId, sender: 'user', text: `I just got my monthly stipend!`, date: iso(2, 10) },
    { id: `msg-${userId}-2`, userId, sender: 'agent', text: `Awesome — I've logged it and set aside your savings across your goals based on your plan. You're on track this month! 🎯`, date: iso(2, 10),
      reasoning: [{ step: 1, description: 'Logged your stipend as income' }, { step: 2, description: 'Set aside savings into your active goals' }],
      actionsTaken: ['Logged stipend (+15 XP)', 'Auto-saved to goals'] }
  ];
}

function makeActivity(userId) {
  return [
    { id: `act-${userId}-1`, userId, category: 'ALERT', description: 'Detected a Netflix subscription of ₹199 and added it to your Subscriptions budget.', date: iso(0, 11) },
    { id: `act-${userId}-2`, userId, category: 'GOALS', description: 'Set aside ₹1,200 toward your Goa Trip after your stipend arrived.', date: iso(2, 10) },
    { id: `act-${userId}-3`, userId, category: 'EXPENSE', description: 'Categorised ₹320 spent on lunch as Food.', date: iso(1, 14) },
    { id: `act-${userId}-4`, userId, category: 'INCOME', description: 'Logged your monthly stipend and updated your balance.', date: iso(2, 10) }
  ];
}

export async function seedDatabase() {
  const db = await connectDb();
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  console.log('Clearing existing collections...');
  for (const c of ['users', 'transactions', 'goals', 'chats', 'activity_logs', 'notifications']) {
    await db.collection(c).deleteMany({});
  }

  const users = [];
  const allTx = [], allGoals = [], allChats = [], allActs = [], allNotifs = [];

  for (const p of profiles) {
    const xp = rand(120, 700);
    const lv = levelFor(xp);
    users.push({
      _id: p._id,
      username: p.username,
      email: `${p.username}@finagent.demo`,
      passwordHash,
      fullName: p.fullName,
      address: `${rand(1, 300)}, Student Housing`,
      country: 'India',
      state: p.state,
      city: p.city,
      collegeName: p.college,
      spendingPreferences: p.prefs,
      monthlyIncome: p.income,
      savingsMode: p.mode,
      xp, ...lv,
      autoSmsEnabled: Math.random() > 0.5,
      chatSummary: '',
      savedByAi: rand(1500, 6000),
      isDemo: true,
      featured: !!p.featured,
      createdAt: iso(rand(120, 200))
    });
    allTx.push(...makeTransactions(p._id, p.income, p.prefs));
    allGoals.push(...makeGoals(p._id, p.income));
    allChats.push(...makeChats(p._id));
    allActs.push(...makeActivity(p._id));
    allNotifs.push(...makeNotifications(p._id, p.fullName.split(' ')[0]));
  }

  await db.collection('users').insertMany(users);
  await db.collection('transactions').insertMany(allTx);
  await db.collection('goals').insertMany(allGoals);
  await db.collection('chats').insertMany(allChats);
  await db.collection('activity_logs').insertMany(allActs);
  await db.collection('notifications').insertMany(allNotifs);

  console.log(`Seeded ${users.length} demo accounts (login: any username above / password "${DEMO_PASSWORD}"). Featured demo: arjun.`);
}

// Run directly: `node seed.js`
if (import.meta.url === `file://${process.argv[1]}`.replace(/\\/g, '/')) {
  (async () => {
    try { await seedDatabase(); process.exit(0); }
    catch (e) { console.error('Seeding failed:', e); process.exit(1); }
  })();
}
