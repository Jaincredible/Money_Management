import { create } from 'zustand';

// --- TYPES ---

export interface UserState {
  name: string;
  monthlyIncome: number;
  savingsMode: 'Conservative' | 'Balanced' | 'Aggressive';
  xp: number;
  level: string;
  nextLevel: string;
  xpToNext: number;
  badges: string[];
  autoSmsEnabled: boolean;
  setProfile: (name: string, income: number, mode: 'Conservative' | 'Balanced' | 'Aggressive') => void;
  setAutoSmsEnabled: (enabled: boolean) => void;
  addXp: (amount: number) => void;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: 'Food' | 'Transport' | 'Studies' | 'Entertainment' | 'Subscriptions' | 'Salary' | 'Other';
  amount: number;
  description: string;
  timestamp: string; // e.g. "2 mins ago", "1 hr ago", etc.
  mongoCollection: 'user_transactions';
}

export interface TransactionsState {
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'timestamp' | 'mongoCollection'>) => void;
}

export interface Goal {
  id: number;
  name: string;
  emoji: string;
  target: number;
  saved: number;
  weeklyTarget: number;
  startDate: string;
  targetDate: string;
  agentMonitoring: boolean;
}

export interface GoalsState {
  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'id'>) => void;
  updateGoalSaved: (id: number, amount: number) => void;
  adjustGoalTimeline: (id: number, days: number) => void;
  updateWeeklyTarget: (id: number, amount: number) => void;
  deleteGoal: (id: number) => void;
}

export interface AgentReasoningStep {
  step: number;
  description: string;
  mongoOperation?: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  timestamp: string;
  reasoning?: AgentReasoningStep[];
  actionsTaken?: string[];
}

export interface AgentActivityItem {
  id: string;
  timestamp: string;
  category: 'INCOME' | 'EXPENSE' | 'GOALS' | 'ALERT' | 'COMMUNITY' | 'REWARD';
  description: string;
  mongoOperation: string;
}

export interface AgentState {
  chatHistory: ChatMessage[];
  isThinking: boolean;
  activityLog: AgentActivityItem[];
  currentNotification: { title: string; message: string; subMessage: string; op: string } | null;
  addChatMessage: (msg: ChatMessage) => void;
  setThinking: (thinking: boolean) => void;
  addActivityLog: (item: Omit<AgentActivityItem, 'id' | 'timestamp'>) => void;
  setCurrentNotification: (notif: { title: string; message: string; subMessage: string; op: string } | null) => void;
  triggerAutoSmsSimulation: () => void;
}

export interface InsightsState {
  categoryTotals: {
    Food: number;
    Transport: number;
    Studies: number;
    Entertainment: number;
    Subscriptions: number;
  };
  weeklyTrend: {
    week: string;
    Food: number;
    Transport: number;
    Entertainment: number;
    Studies: number;
  }[];
  monthProjection: number;
  totalSpent: number;
  budgetRemaining: number;
  recalculateInsights: (transactions: Transaction[]) => void;
}

// --- MOCK DATA ---

const initialTransactions: Transaction[] = [
  { id: 'tx-1', type: 'income', category: 'Salary', amount: 8000, description: 'June Monthly Stipend', timestamp: '2 days ago', mongoCollection: 'user_transactions' },
  { id: 'tx-2', type: 'expense', category: 'Food', amount: 350, description: 'Dinner with hostel mates', timestamp: '2 days ago', mongoCollection: 'user_transactions' },
  { id: 'tx-3', type: 'expense', category: 'Entertainment', amount: 240, description: 'Movie ticket', timestamp: '1 day ago', mongoCollection: 'user_transactions' },
  { id: 'tx-4', type: 'expense', category: 'Food', amount: 150, description: 'Starbucks coffee', timestamp: '1 day ago', mongoCollection: 'user_transactions' },
  { id: 'tx-5', type: 'expense', category: 'Studies', amount: 800, description: 'Semester reference books', timestamp: '1 day ago', mongoCollection: 'user_transactions' },
  { id: 'tx-6', type: 'expense', category: 'Transport', amount: 200, description: 'Uber ride to college', timestamp: '18 hours ago', mongoCollection: 'user_transactions' },
  { id: 'tx-7', type: 'expense', category: 'Food', amount: 300, description: 'Lunch at canteen', timestamp: '15 hours ago', mongoCollection: 'user_transactions' },
  { id: 'tx-8', type: 'expense', category: 'Subscriptions', amount: 119, description: 'Spotify Student Premium', timestamp: '12 hours ago', mongoCollection: 'user_transactions' },
  { id: 'tx-9', type: 'expense', category: 'Subscriptions', amount: 349, description: 'Netflix Mobile Plan', timestamp: '8 hours ago', mongoCollection: 'user_transactions' },
  { id: 'tx-10', type: 'expense', category: 'Food', amount: 400, description: 'Zomato biryani delivery', timestamp: '5 hours ago', mongoCollection: 'user_transactions' },
  { id: 'tx-11', type: 'expense', category: 'Transport', amount: 200, description: 'Auto rickshaw return fare', timestamp: '3 hours ago', mongoCollection: 'user_transactions' },
  { id: 'tx-12', type: 'expense', category: 'Entertainment', amount: 600, description: 'Gaming arcade entry', timestamp: '2 hours ago', mongoCollection: 'user_transactions' },
];

const initialGoals: Goal[] = [
  { id: 1, name: 'Goa Trip', emoji: '🏖️', target: 15000, saved: 6000, weeklyTarget: 1500, startDate: '2026-05-01', targetDate: '2026-08-01', agentMonitoring: true },
  { id: 2, name: 'New Laptop', emoji: '💻', target: 40000, saved: 2000, weeklyTarget: 1000, startDate: '2026-04-01', targetDate: '2026-12-01', agentMonitoring: true },
  { id: 3, name: 'Emergency Fund', emoji: '🛡️', target: 10000, saved: 4500, weeklyTarget: 800, startDate: '2026-03-01', targetDate: '2026-09-01', agentMonitoring: true }
];

const initialChatHistory: ChatMessage[] = [
  {
    id: 'msg-1',
    sender: 'user',
    text: 'I just got my stipend — ₹8,000.',
    timestamp: '2 days ago'
  },
  {
    id: 'msg-2',
    sender: 'agent',
    text: "On it. I've split your ₹8,000 stipend across your active goals:\n• ₹4,000 → Savings pool (50%)\n• ₹2,400 → Monthly expenses (30%)\n• ₹1,600 → Emergency Fund (20%)\n\nAlso flagged: your Entertainment budget is ₹240 over limit. I've adjusted your Goa Trip goal timeline by 3 days to compensate. You have 2 bills due this week — want me to set reminders?",
    timestamp: '2 days ago',
    reasoning: [
      { step: 1, description: 'Parsing intent: "income entry + auto-allocate"' },
      { step: 2, description: 'MongoDB Atlas MCP: db.transactions.insertOne({ amount: 8000, type: "income" })', mongoOperation: 'db.transactions.insertOne()' },
      { step: 3, description: 'Calculating allocation: 50% savings · 30% expenses · 20% emergency' },
      { step: 4, description: 'MongoDB Atlas MCP: db.goals.updateMany({ ... })', mongoOperation: 'db.goals.updateMany()' },
      { step: 5, description: 'MongoDB Atlas MCP: db.alerts.insertOne({ type: "bill_check" })', mongoOperation: 'db.alerts.insertOne()' },
      { step: 6, description: 'Action complete ✓' }
    ],
    actionsTaken: ['Logged ₹8,000', 'Updated 3 goals', '2 alerts set']
  },
  {
    id: 'msg-3',
    sender: 'user',
    text: 'Yes set the reminders. Also check if I\'m on track for my Goa trip.',
    timestamp: '2 days ago'
  },
  {
    id: 'msg-4',
    sender: 'agent',
    text: "Reminders set for Spotify (June 28, ₹119) and Amazon Prime (June 30, ₹299).\n\nOn your Goa Trip goal: you've saved ₹6,000 of ₹15,000 (40%). At your current rate of ₹1,500/week, you'll hit your target by August 4th — 3 days behind your original date. I've nudged your weekly target to ₹1,520 to get back on track. No action needed from you.",
    timestamp: '2 days ago',
    reasoning: [
      { step: 1, description: 'Querying upcoming billing documents', mongoOperation: 'db.bills.find()' },
      { step: 2, description: 'Creating notification reminders', mongoOperation: 'db.alerts.insertMany()' },
      { step: 3, description: 'Analyzing Goa Trip projection timeline based on historical savings rate', mongoOperation: 'db.goals.findOne({ id: 1 })' },
      { step: 4, description: 'Recalculating weekly target contribution: ₹1,500 -> ₹1,520', mongoOperation: 'db.goals.updateOne({ id: 1 })' }
    ],
    actionsTaken: ['2 reminders set', 'Goal timeline recalculated']
  }
];

const initialActivityLog: AgentActivityItem[] = [
  { id: 'act-1', timestamp: '2 min ago', category: 'GOALS', description: 'Detected 40% food spending spike — flagged + adjusted Goa Trip goal timeline by 3 days.', mongoOperation: 'goals.updateOne({ id: 1 })' },
  { id: 'act-2', timestamp: '1 hr ago', category: 'ALERT', description: 'Recurring Spotify bill ₹119 detected — reminder set for June 28.', mongoOperation: 'alerts.insertOne()' },
  { id: 'act-3', timestamp: '3 hrs ago', category: 'COMMUNITY', description: 'Community: Priya just hit 80% of her June Challenge goal! 🎉', mongoOperation: 'challenges.findOne()' },
  { id: 'act-4', timestamp: '5 hrs ago', category: 'ALERT', description: 'Entertainment overspent by ₹240 — flagged, budget alert created.', mongoOperation: 'alerts.insertOne()' },
  { id: 'act-5', timestamp: '1 day ago', category: 'GOALS', description: 'Weekly goal check: Emergency Fund ahead of schedule ✓', mongoOperation: 'goals.find()' },
  { id: 'act-6', timestamp: '2 days ago', category: 'INCOME', description: '₹8,000 stipend logged + auto-allocated across 3 goals.', mongoOperation: 'transactions.insertOne(), goals.updateMany()' },
  { id: 'act-7', timestamp: '3 days ago', category: 'EXPENSE', description: '₹200 food expense logged and categorized.', mongoOperation: 'transactions.insertOne({ category: "Food" })' },
  { id: 'act-8', timestamp: '4 days ago', category: 'REWARD', description: 'Badge earned: "7-Day Streak" +50 XP awarded.', mongoOperation: 'rewards.updateOne() + db.users.updateOne()' },
  { id: 'act-9', timestamp: '5 days ago', category: 'GOALS', description: 'New Laptop goal: weekly target contribution due.', mongoOperation: 'goals.find() + db.notifications.insertOne()' },
  { id: 'act-10', timestamp: '6 days ago', category: 'COMMUNITY', description: 'June No-Spend Challenge created — 5 participants joined.', mongoOperation: 'challenges.insertOne() + db.notifications.insertMany()' },
];

const initialCategoryTotals = { Food: 1200, Transport: 400, Studies: 800, Entertainment: 840, Subscriptions: 468 };

const initialWeeklyTrend = [
  { week: 'Week 1', Food: 900, Transport: 300, Entertainment: 400, Studies: 500 },
  { week: 'Week 2', Food: 1050, Transport: 250, Entertainment: 600, Studies: 200 },
  { week: 'Week 3', Food: 800, Transport: 380, Entertainment: 200, Studies: 800 },
  { week: 'Week 4', Food: 1200, Transport: 400, Entertainment: 840, Studies: 800 },
];

// --- STORES DEFINITIONS ---

export const useUserStore = create<UserState>((set) => ({
  name: 'Arjun',
  monthlyIncome: 8000,
  savingsMode: 'Balanced',
  xp: 340,
  level: 'Budget Pro',
  nextLevel: 'Financial Genius',
  xpToNext: 500,
  badges: ['First Goal Saved', '7-Day Streak', 'Budget Master'],
  autoSmsEnabled: false,
  setProfile: (name, income, mode) => set({ name, monthlyIncome: income, savingsMode: mode }),
  setAutoSmsEnabled: (enabled) => set({ autoSmsEnabled: enabled }),
  addXp: (amount) => set((state) => {
    const newXp = state.xp + amount;
    if (newXp >= state.xpToNext) {
      return {
        xp: newXp - state.xpToNext,
        level: 'Financial Genius',
        nextLevel: 'Wealth Guru',
        xpToNext: 1000,
        badges: [...state.badges, 'Consistency King']
      };
    }
    return { xp: newXp };
  })
}));

export const useTransactionsStore = create<TransactionsState>((set) => ({
  transactions: initialTransactions,
  addTransaction: (tx) => set((state) => {
    const newTx: Transaction = {
      ...tx,
      id: `tx-${Date.now()}`,
      timestamp: 'Just now',
      mongoCollection: 'user_transactions'
    };
    return { transactions: [newTx, ...state.transactions] };
  })
}));

export const useGoalsStore = create<GoalsState>((set) => ({
  goals: initialGoals,
  addGoal: (goal) => set((state) => {
    const newGoal: Goal = {
      ...goal,
      id: state.goals.length + 1
    };
    return { goals: [...state.goals, newGoal] };
  }),
  updateGoalSaved: (id, amount) => set((state) => ({
    goals: state.goals.map((g) => g.id === id ? { ...g, saved: Math.min(g.target, g.saved + amount) } : g)
  })),
  adjustGoalTimeline: (id, days) => set((state) => ({
    goals: state.goals.map((g) => {
      if (g.id === id) {
        const parts = g.targetDate.split('-');
        const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        dateObj.setDate(dateObj.getDate() + days);
        const yyyy = dateObj.getFullYear();
        const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
        const dd = String(dateObj.getDate()).padStart(2, '0');
        return { ...g, targetDate: `${yyyy}-${mm}-${dd}` };
      }
      return g;
    })
  })),
  updateWeeklyTarget: (id, amount) => set((state) => ({
    goals: state.goals.map((g) => g.id === id ? { ...g, weeklyTarget: amount } : g)
  })),
  deleteGoal: (id) => set((state) => ({
    goals: state.goals.filter((g) => g.id !== id)
  }))
}));

export const useAgentStore = create<AgentState>((set) => ({
  chatHistory: initialChatHistory,
  isThinking: false,
  activityLog: initialActivityLog,
  currentNotification: null,
  addChatMessage: (msg) => set((state) => ({ chatHistory: [...state.chatHistory, msg] })),
  setThinking: (thinking) => set({ isThinking: thinking }),
  addActivityLog: (item) => set((state) => {
    const newItem: AgentActivityItem = {
      ...item,
      id: `act-${Date.now()}`,
      timestamp: 'Just now'
    };
    return { activityLog: [newItem, ...state.activityLog] };
  }),
  setCurrentNotification: (notif) => set({ currentNotification: notif }),
  triggerAutoSmsSimulation: () => {
    // 30 seconds delay simulation
    setTimeout(() => {
      // 1. Add UPI transaction of ₹340
      useTransactionsStore.getState().addTransaction({
        type: 'expense',
        category: 'Food',
        amount: 340,
        description: 'Zomato debited via UPI'
      });
      
      // 2. Recalculate insights
      const currentTxs = useTransactionsStore.getState().transactions;
      useInsightsStore.getState().recalculateInsights(currentTxs);

      // 3. Add Activity log
      useAgentStore.getState().addActivityLog({
        category: 'EXPENSE',
        description: 'Auto SMS: Detected ₹340 debited via UPI (Zomato). Categorized as Food.',
        mongoOperation: 'db.transactions.insertOne({ amount: 340, category: "Food", merchant: "Zomato", paymentMethod: "UPI" })'
      });

      // 4. Award XP
      useUserStore.getState().addXp(20);

      // 5. Trigger notification popup in layout
      useAgentStore.getState().setCurrentNotification({
        title: 'Transaction Detected',
        message: '🔔 Transaction detected: ₹340 debited via UPI (Zomato)',
        subMessage: "I've categorized this as Food and updated your budget. You have ₹660 left in Food this week.",
        op: '→ MongoDB Atlas MCP: db.transactions.insertOne()'
      });
    }, 30000); // 30 seconds
  }
}));

export const useInsightsStore = create<InsightsState>((set) => ({
  categoryTotals: initialCategoryTotals,
  weeklyTrend: initialWeeklyTrend,
  monthProjection: 2980,
  totalSpent: 3240,
  budgetRemaining: 2260,
  recalculateInsights: (transactions) => set((state) => {
    // Filter only expense transactions
    const expenses = transactions.filter((t) => t.type === 'expense');
    
    // Recalculate totals
    const totals = { Food: 0, Transport: 0, Studies: 0, Entertainment: 0, Subscriptions: 0 };
    expenses.forEach((e) => {
      const cat = e.category as keyof typeof totals;
      if (totals[cat] !== undefined) {
        totals[cat] += e.amount;
      }
    });

    const totalSpent = Object.values(totals).reduce((a, b) => a + b, 0);
    const budgetRemaining = Math.max(0, 5500 - totalSpent); // assume ₹5500 is budget limit

    // Update weekly trend (add a bit to Week 4)
    const newWeeklyTrend = [...state.weeklyTrend];
    // Simple mock logic: update Week 4 with whatever new expenses are there
    newWeeklyTrend[3] = {
      week: 'Week 4',
      Food: totals.Food,
      Transport: totals.Transport,
      Entertainment: totals.Entertainment,
      Studies: totals.Studies
    };

    return {
      categoryTotals: totals,
      totalSpent,
      budgetRemaining,
      weeklyTrend: newWeeklyTrend,
      monthProjection: totalSpent + 400 // simple projection
    };
  })
}));
