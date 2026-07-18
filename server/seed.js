import { connectDb, getDb } from './db.js';
import { hashPassword } from './auth.js';
import { pathToFileURL } from 'url';
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

// Category -> relative spend size (base) + merchants -> item examples (for drill-downs)
const CAT = {
  Food:          { base: 0.8, m: { Swiggy: ['Chicken burger', 'Paneer wrap', 'Veg biryani', 'Pizza'], Zomato: ['Butter chicken', 'Momos', 'Pasta', 'Thali'], 'Campus Canteen': ['Lunch combo', 'Samosa & chai', 'Sandwich', 'Dosa'], Chaayos: ['Masala chai', 'Cold coffee', 'Maggi'] } },
  Groceries:     { base: 1.0, m: { Blinkit: ['Milk & eggs', 'Snacks', 'Fruits'], Zepto: ['Instant noodles', 'Curd', 'Bread'], BigBasket: ['Weekly staples', 'Detergent', 'Rice'], DMart: ['Monthly stock-up'] } },
  Transport:     { base: 0.5, m: { Uber: ['Ride to campus', 'Airport drop'], Ola: ['Auto ride', 'Outstation'], Rapido: ['Bike taxi'], Metro: ['Smart-card recharge'] } },
  Travel:        { base: 3.0, m: { IRCTC: ['Train ticket home', 'Tatkal booking'], MakeMyTrip: ['Flight advance', 'Hotel booking'], RedBus: ['Weekend bus'], Ixigo: ['Return ticket'] } },
  Studies:       { base: 1.2, m: { Amazon: ['Reference textbook', 'Notebooks'], Flipkart: ['Calculator', 'Drafter'], Udemy: ['DSA course', 'Design course'], 'Xerox Point': ['Notes printout', 'Binding'] } },
  Entertainment: { base: 0.9, m: { BookMyShow: ['Movie tickets', 'Comedy show'], PVR: ['Popcorn combo'], Steam: ['Game top-up', 'DLC'], Zomato: ['Party snacks'] } },
  Sports:        { base: 1.3, m: { Decathlon: ['Football', 'Jersey', 'Water bottle'], Playo: ['Turf booking'], 'Turf Arena': ['Cricket net'], Nike: ['Running shoes'] } },
  Shopping:      { base: 1.6, m: { Amazon: ['Headphones', 'Phone case', 'Charger'], Myntra: ['Hoodie', 'Sneakers', 'T-shirt'], Flipkart: ['Backpack', 'Watch'], Ajio: ['Jeans'] } },
  Subscriptions: { base: 0.4, m: { Spotify: ['Student Premium'], Netflix: ['Mobile plan'], YouTube: ['Premium'], 'Amazon Prime': ['Membership'] } },
  Fitness:       { base: 1.1, m: { 'Cult.fit': ['Monthly pass', 'Yoga class'], HealthKart: ['Whey protein', 'Vitamins'], "Gold's Gym": ['Monthly fee'] } }
};

function makeTransactions(userId, income, prefs) {
  const txs = [];
  let n = 0;
  const add = (type, category, merchant, description, amount, daysAgo, hour) => txs.push({
    id: `tx-${userId}-${++n}`, userId, type, category, merchant, description, amount, date: iso(daysAgo, hour)
  });

  // Income: 3 monthly stipends + a freelance gig
  const freelance = rand(600, 2600);
  add('income', 'Salary', 'Stipend', 'Monthly stipend / allowance', income, 2, 10);
  add('income', 'Salary', 'Stipend', 'Monthly stipend / allowance', income, 34, 10);
  add('income', 'Salary', 'Stipend', 'Monthly stipend / allowance', income, 64, 10);
  add('income', 'Freelance', 'Upwork', 'Freelance design gig', freelance, 9, 15);
  const totalIncome = income * 3 + freelance;

  // Fixed subscriptions (part of monthly spend)
  const subs = [
    { cat: 'Subscriptions', m: 'Spotify', item: 'Student Premium', day: 5, amount: 119 },
    { cat: 'Subscriptions', m: 'Netflix', item: 'Mobile plan', day: 8, amount: 199 }
  ];
  const subTotal = subs.reduce((s, x) => s + x.amount, 0);

  // Variable expense slots across ~3 months, biased toward the user's preferences
  const days = [0, 0, 1, 2, 3, 4, 5, 6, 7, 8, 10, 11, 18, 25, 33, 41, 52, 63, 78, 96];
  const pool = [...prefs, ...prefs, 'Food', 'Transport', 'Studies', 'Groceries'].filter((c) => CAT[c]);
  const slots = days.map((day) => {
    const cat = pick(pool);
    const merchant = pick(Object.keys(CAT[cat].m));
    const item = pick(CAT[cat].m[merchant]);
    return { cat, merchant, item, day, weight: CAT[cat].base * (0.55 + Math.random() * 0.9) };
  });

  // Scale variable spend so TOTAL expenses = 50–63% of income → always a healthy positive balance.
  const spendTarget = Math.round(totalIncome * (0.5 + Math.random() * 0.13));
  const variableTarget = Math.max(1500, spendTarget - subTotal);
  const wsum = slots.reduce((s, x) => s + x.weight, 0) || 1;
  slots.forEach((s) => { s.amount = Math.max(40, Math.round((variableTarget * s.weight / wsum) / 10) * 10); });

  slots.forEach((s) => add('expense', s.cat, s.merchant, s.item, s.amount, s.day, rand(8, 22)));
  subs.forEach((s) => add('expense', s.cat, s.m, s.item, s.amount, s.day, 9));

  // A recent split-with-friends expense (you only carry your share)
  const splitTotal = rand(900, 1800);
  const yourShare = Math.round(splitTotal / 3);
  add('expense', 'Food', 'Zomato', 'Group dinner (split 3 ways)', yourShare, 3, 21);
  txs[txs.length - 1].split = { total: splitTotal, friends: ['Priya', 'Rahul'], people: 3, yourShare, collecting: splitTotal - yourShare };

  return txs;
}

function makeGoals(userId, income) {
  // Goa Trip is a shared "Jar" — friends chip in too.
  const goaSaved = rand(4000, 9000);
  const friends = [
    { name: 'Priya', contributed: rand(500, 2500) },
    { name: 'Rahul', contributed: rand(500, 2000) }
  ];
  return [
    { id: 1, userId, name: 'Goa Trip', emoji: '🏖️', target: 15000, saved: goaSaved, weeklyTarget: 1500, startDate: iso(70).split('T')[0], targetDate: '2026-09-15', agentMonitoring: true, shared: true, members: friends },
    { id: 2, userId, name: 'New Laptop', emoji: '💻', target: 55000, saved: rand(8000, 20000), weeklyTarget: 2000, startDate: iso(90).split('T')[0], targetDate: '2026-12-20', agentMonitoring: true, shared: false, members: [] },
    { id: 3, userId, name: 'Emergency Fund', emoji: '🛡️', target: 10000, saved: rand(3000, 8000), weeklyTarget: 800, startDate: iso(120).split('T')[0], targetDate: '2026-10-01', agentMonitoring: true, shared: false, members: [] }
  ];
}

function makeNotifications(userId, name) {
  return [
    { id: `ntf-${userId}-1`, userId, type: 'challenge', emoji: '🔥', title: 'Challenge invitation', message: `You've been invited to the "July No-Spend Weekend" challenge. Tap to join!`, read: false, date: iso(0, 9) },
    { id: `ntf-${userId}-2`, userId, type: 'suggestion', emoji: '🤖', title: 'Agent suggestion', message: `You're spending a bit fast on Food this week. Shift ₹300 to your Goa Trip and you'll still be comfortable.`, read: false, date: iso(0, 8) },
    { id: `ntf-${userId}-3`, userId, type: 'alert', emoji: '⚠️', title: 'Budget alert', message: `Subscriptions hit 80% of your monthly cap. Netflix + Spotify = ₹318.`, read: true, date: iso(2, 20) },
    { id: `ntf-${userId}-4`, userId, type: 'reward', emoji: '🏆', title: 'Badge unlocked', message: `Nice! You earned the "Budget Master" badge for staying under budget 7 days straight.`, read: true, date: iso(4, 18) },
    { id: `ntf-${userId}-5`, userId, type: 'alert', emoji: '📅', title: 'Bill due soon', message: `Your Netflix Mobile plan (₹199) renews in 2 days. I've set aside enough to cover it.`, read: false, date: iso(0, 7) }
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

// Friend graph + chat threads among the demo accounts (arjun is richly connected).
function makeSocial() {
  const id = Object.fromEntries(profiles.map((p) => [p.username, p._id]));
  const reqs = [];
  const mk = (from, to, status) => reqs.push({
    id: `fr-${from}-${to}`, fromUserId: id[from], fromUsername: from,
    toUserId: id[to], toUsername: to, status, date: iso(rand(1, 40))
  });
  mk('priya', 'arjun', 'accepted');
  mk('arjun', 'rahul', 'accepted');
  mk('meera', 'arjun', 'accepted');
  mk('aisha', 'arjun', 'pending');   // incoming to arjun
  mk('dev', 'arjun', 'pending');     // incoming to arjun
  mk('arjun', 'kabir', 'pending');   // sent by arjun
  mk('arjun', 'zara', 'pending');    // sent by arjun
  mk('priya', 'zara', 'accepted');
  mk('rahul', 'kabir', 'accepted');
  mk('meera', 'ananya', 'accepted');
  mk('kabir', 'rohan', 'accepted');

  const name = Object.fromEntries(profiles.map((p) => [p.username, p.fullName]));
  const msgs = [];
  const msgNotifs = [];
  const mk2 = (a, b, from, text, daysAgo, hour, read = true) => {
    const to = from === a ? b : a;
    msgs.push({
      id: `fm-${msgs.length + 1}`, threadKey: [id[a], id[b]].sort().join('|'),
      fromUserId: id[from], fromUsername: from, toUserId: id[to], text, read, date: iso(daysAgo, hour)
    });
    if (!read) msgNotifs.push({
      id: `ntf-msg-${msgNotifs.length + 1}-${to}`, userId: id[to],
      type: 'friend', emoji: '💬', title: `New message from ${name[from]}`,
      message: text, read: false, date: iso(daysAgo, hour)
    });
  };
  mk2('arjun', 'priya', 'priya', 'Yo! You in for the No-Spend weekend?', 2, 10, true);
  mk2('arjun', 'priya', 'arjun', 'Haha yes, saving up for Goa 🏖️', 2, 11, true);
  mk2('arjun', 'priya', 'priya', "Let's hit ₹15k together 💪", 2, 11, false);  // unread for arjun
  mk2('arjun', 'rahul', 'arjun', 'Yo, DSA notes ready?', 1, 17, true);
  mk2('arjun', 'rahul', 'rahul', 'Sending now 📚 lunch after?', 1, 19, false); // unread for arjun
  return { reqs, msgs, msgNotifs };
}

export async function seedDatabase() {
  const db = await connectDb();
  const passwordHash = await hashPassword(DEMO_PASSWORD);

  console.log('Clearing existing collections...');
  for (const c of ['users', 'transactions', 'goals', 'chats', 'activity_logs', 'notifications', 'suggestions', 'friend_requests', 'friend_messages']) {
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
      email: `${p.username}@pocketglow.demo`,
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
      autoSmsEnabled: p.featured || Math.random() > 0.5,
      messageAccess: p.featured || Math.random() > 0.5,
      agentPersona: p.featured ? 'Coach' : pick(['Coach', 'Hype', 'Chill']),
      roundUpEnabled: true,
      roundUpTo: 10,
      roundUpPot: rand(120, 520),
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

  const social = makeSocial();
  await db.collection('friend_requests').insertMany(social.reqs);
  await db.collection('friend_messages').insertMany(social.msgs);
  if (social.msgNotifs.length) await db.collection('notifications').insertMany(social.msgNotifs);

  console.log(`Seeded ${users.length} demo accounts + ${social.reqs.length} friendships/requests (login: any username above / password "${DEMO_PASSWORD}"). Featured demo: arjun.`);
}

// Run directly: `node seed.js` (cross-platform entry check)
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  (async () => {
    try { await seedDatabase(); process.exit(0); }
    catch (e) { console.error('Seeding failed:', e); process.exit(1); }
  })();
}
