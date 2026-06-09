import { create } from 'zustand';

// --- TYPES ---

export interface UserState {
  currentUserId: string;
  name: string;
  monthlyIncome: number;
  savingsMode: 'Conservative' | 'Balanced' | 'Aggressive';
  xp: number;
  level: string;
  nextLevel: string;
  xpToNext: number;
  badges: string[];
  autoSmsEnabled: boolean;
  setProfile: (name: string, income: number, mode: 'Conservative' | 'Balanced' | 'Aggressive') => Promise<void>;
  setAutoSmsEnabled: (enabled: boolean) => Promise<void>;
  addXp: (amount: number) => void; // local UI visual indicator, state is fully synced from DB
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: 'Food' | 'Transport' | 'Studies' | 'Entertainment' | 'Subscriptions' | 'Salary' | 'Other';
  amount: number;
  description: string;
  timestamp: string;
  mongoCollection: 'user_transactions';
}

export interface TransactionsState {
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'timestamp' | 'mongoCollection'>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
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
  addGoal: (goal: Omit<Goal, 'id'>) => Promise<void>;
  updateGoalSaved: (id: number, amount: number) => Promise<void>;
  adjustGoalTimeline: (id: number, days: number) => Promise<void>;
  updateWeeklyTarget: (id: number, amount: number) => Promise<void>;
  deleteGoal: (id: number) => Promise<void>;
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
  addChatMessage: (text: string) => Promise<void>;
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

// --- GLOBAL LOAD/REFRESH METHOD ---

export const loadUserData = async (userId: string) => {
  try {
    const res = await fetch(`/api/users/${userId}/data`);
    if (!res.ok) throw new Error(`Failed to load data for user: ${userId}`);
    const data = await res.json();

    // 1. Sync User Store
    useUserStore.setState({
      currentUserId: userId,
      name: data.user.name,
      monthlyIncome: data.user.monthlyIncome,
      savingsMode: data.user.savingsMode,
      xp: data.user.xp,
      level: data.user.level,
      nextLevel: data.user.nextLevel,
      xpToNext: data.user.xpToNext,
      badges: data.user.badges,
      autoSmsEnabled: data.user.autoSmsEnabled
    });

    // 2. Sync Transactions Store
    useTransactionsStore.setState({
      transactions: data.transactions
    });

    // 3. Sync Goals Store
    useGoalsStore.setState({
      goals: data.goals
    });

    // 4. Sync Agent Store
    useAgentStore.setState({
      chatHistory: data.chatHistory,
      activityLog: data.activityLog
    });

    // 5. Sync Insights Store
    useInsightsStore.setState({
      categoryTotals: data.insights.categoryTotals,
      totalSpent: data.insights.totalSpent,
      budgetRemaining: data.insights.budgetRemaining,
      monthProjection: data.insights.monthProjection
    });

    console.log(`Zustand stores fully synced with MongoDB for user: ${data.user.name}`);
  } catch (error) {
    console.error('Error in loadUserData:', error);
  }
};

// --- STORES DEFINITIONS ---

export const useUserStore = create<UserState>(() => ({
  currentUserId: 'usr_1', // Default
  name: 'Arjun',
  monthlyIncome: 8000,
  savingsMode: 'Balanced',
  xp: 340,
  level: 'Budget Pro',
  nextLevel: 'Financial Genius',
  xpToNext: 500,
  badges: ['First Goal Saved', '7-Day Streak', 'Budget Master'],
  autoSmsEnabled: false,

  setProfile: async (name, income, mode) => {
    const userId = useUserStore.getState().currentUserId;
    try {
      const res = await fetch(`/api/users/${userId}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, monthlyIncome: income, savingsMode: mode })
      });
      if (!res.ok) throw new Error('Failed to update profile');
      await loadUserData(userId);
    } catch (e) {
      console.error(e);
    }
  },

  setAutoSmsEnabled: async (enabled) => {
    const userId = useUserStore.getState().currentUserId;
    try {
      const res = await fetch(`/api/users/${userId}/profile`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ autoSmsEnabled: enabled })
      });
      if (!res.ok) throw new Error('Failed to toggle auto SMS');
      await loadUserData(userId);
    } catch (e) {
      console.error(e);
    }
  },

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

export const useTransactionsStore = create<TransactionsState>(() => ({
  transactions: [],
  
  addTransaction: async (tx) => {
    const userId = useUserStore.getState().currentUserId;
    try {
      const res = await fetch(`/api/users/${userId}/transactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tx)
      });
      if (!res.ok) throw new Error('Failed to log transaction');
      await loadUserData(userId);
    } catch (e) {
      console.error(e);
    }
  },

  deleteTransaction: async (id) => {
    const userId = useUserStore.getState().currentUserId;
    try {
      const res = await fetch(`/api/users/${userId}/transactions/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete transaction');
      await loadUserData(userId);
    } catch (e) {
      console.error(e);
    }
  }
}));

export const useGoalsStore = create<GoalsState>((set) => ({
  goals: [],
  
  addGoal: async (goal) => {
    const userId = useUserStore.getState().currentUserId;
    try {
      const res = await fetch(`/api/users/${userId}/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(goal)
      });
      if (!res.ok) throw new Error('Failed to add goal');
      await loadUserData(userId);
    } catch (e) {
      console.error(e);
    }
  },

  updateGoalSaved: async (id, amount) => {
    const userId = useUserStore.getState().currentUserId;
    // We add to current goal saved
    const goal = useGoalsStore.getState().goals.find(g => g.id === id);
    if (!goal) return;
    const newSaved = Math.min(goal.target, goal.saved + amount);

    try {
      const res = await fetch(`/api/users/${userId}/goals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ saved: newSaved })
      });
      if (!res.ok) throw new Error('Failed to update goal saved pool');
      await loadUserData(userId);
    } catch (e) {
      console.error(e);
    }
  },

  adjustGoalTimeline: async (id, days) => {
    const userId = useUserStore.getState().currentUserId;
    const goal = useGoalsStore.getState().goals.find(g => g.id === id);
    if (!goal) return;

    const parts = goal.targetDate.split('-');
    const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    dateObj.setDate(dateObj.getDate() + days);
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(dateObj.getDate()).padStart(2, '0');
    const targetDate = `${yyyy}-${mm}-${dd}`;

    try {
      const res = await fetch(`/api/users/${userId}/goals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetDate })
      });
      if (!res.ok) throw new Error('Failed to adjust timeline');
      await loadUserData(userId);
    } catch (e) {
      console.error(e);
    }
  },

  updateWeeklyTarget: async (id, amount) => {
    const userId = useUserStore.getState().currentUserId;
    try {
      const res = await fetch(`/api/users/${userId}/goals/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weeklyTarget: amount })
      });
      if (!res.ok) throw new Error('Failed to update weekly target');
      await loadUserData(userId);
    } catch (e) {
      console.error(e);
    }
  },

  deleteGoal: async (id) => {
    const userId = useUserStore.getState().currentUserId;
    try {
      const res = await fetch(`/api/users/${userId}/goals/${id}`, {
        method: 'DELETE'
      });
      if (!res.ok) throw new Error('Failed to delete goal');
      await loadUserData(userId);
    } catch (e) {
      console.error(e);
    }
  }
}));

export const useAgentStore = create<AgentState>((set) => ({
  chatHistory: [],
  isThinking: false,
  activityLog: [],
  currentNotification: null,

  addChatMessage: async (text) => {
    const userId = useUserStore.getState().currentUserId;
    
    // Add user message locally first for instant feedback
    const userMsg: ChatMessage = {
      id: `msg-user-temp-${Date.now()}`,
      sender: 'user',
      text,
      timestamp: 'Just now'
    };
    set((state) => ({ 
      chatHistory: [...state.chatHistory, userMsg],
      isThinking: true 
    }));

    try {
      const res = await fetch(`/api/users/${userId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text })
      });
      if (!res.ok) throw new Error('Failed to get agent response');
      await res.json();
      
      // Sync all user data to capture CRUD side effects from agent
      await loadUserData(userId);
    } catch (e) {
      console.error(e);
      // fallback in case of errors
      set((state) => ({ 
        chatHistory: [
          ...state.chatHistory, 
          {
            id: `msg-err-${Date.now()}`,
            sender: 'agent',
            text: 'I apologize, but I encountered an error communicating with my intelligence server. Please ensure the backend is running.',
            timestamp: 'Just now'
          }
        ],
        isThinking: false 
      }));
    } finally {
      set({ isThinking: false });
    }
  },

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
    const userId = useUserStore.getState().currentUserId;
    console.log('Simulating Auto SMS in 30 seconds...');
    
    setTimeout(async () => {
      try {
        // 1. Add Zomato transaction via API
        const res = await fetch(`/api/users/${userId}/transactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'expense',
            category: 'Food',
            amount: 340,
            description: 'Zomato debited via UPI (Auto SMS Simulation)'
          })
        });
        if (!res.ok) throw new Error('Auto SMS transaction insert failed');

        // 2. Reload user data
        await loadUserData(userId);

        // 3. Trigger notification in UI
        useAgentStore.getState().setCurrentNotification({
          title: 'Transaction Detected',
          message: '🔔 Transaction detected: ₹340 debited via UPI (Zomato)',
          subMessage: "I've categorized this as Food and updated your budget automatically in MongoDB.",
          op: '→ MongoDB Atlas MCP: db.transactions.insertOne()'
        });
      } catch (err) {
        console.error('Auto SMS simulation failed:', err);
      }
    }, 30000);
  }
}));

export const useInsightsStore = create<InsightsState>(() => ({
  categoryTotals: { Food: 0, Transport: 0, Studies: 0, Entertainment: 0, Subscriptions: 0 },
  weeklyTrend: [
    { week: 'Week 1', Food: 900, Transport: 300, Entertainment: 400, Studies: 500 },
    { week: 'Week 2', Food: 1050, Transport: 250, Entertainment: 600, Studies: 200 },
    { week: 'Week 3', Food: 800, Transport: 380, Entertainment: 200, Studies: 800 },
    { week: 'Week 4', Food: 1200, Transport: 400, Entertainment: 840, Studies: 800 },
  ],
  monthProjection: 0,
  totalSpent: 0,
  budgetRemaining: 0,

  recalculateInsights: () => {
    // Backend handles the recalculation on the fly and returns it in user data load.
    // This local trigger is kept for interface compatibility.
  }
}));
