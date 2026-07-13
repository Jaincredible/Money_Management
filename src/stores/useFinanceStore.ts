import { create } from 'zustand';
import { apiFetch, setToken, getToken } from '../lib/api';

/* =============================== TYPES =============================== */

export interface UserProfile {
  id: string;
  username: string;
  email: string;
  fullName: string;
  address: string;
  country: string;
  state: string;
  city: string;
  collegeName: string;
  spendingPreferences: string[];
  monthlyIncome: number;
  savingsMode: 'Conservative' | 'Balanced' | 'Aggressive';
  xp: number;
  level: string;
  nextLevel: string;
  xpToNext: number;
  badges: string[];
  autoSmsEnabled: boolean;
  messageAccess: boolean;
  agentPersona: 'Coach' | 'Hype' | 'Chill';
  roundUpEnabled: boolean;
  roundUpTo: number;
  roundUpPot: number;
  savedByAi: number;
  isDemo: boolean;
}

export interface JarMember {
  name: string;
  contributed: number;
}

export interface SplitInfo {
  total: number;
  friends: string[];
  people: number;
  yourShare: number;
  collecting: number;
}

export interface Transaction {
  id: string;
  type: 'income' | 'expense';
  category: string;
  merchant?: string;
  amount: number;
  description: string;
  date: string; // ISO
  split?: SplitInfo;
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
  shared?: boolean;
  members?: JarMember[];
}

export interface ReasoningStep {
  step: number;
  description: string;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'agent';
  text: string;
  date?: string;
  reasoning?: ReasoningStep[];
  actionsTaken?: string[];
}

export interface ActivityItem {
  id: string;
  category: 'INCOME' | 'EXPENSE' | 'GOALS' | 'ALERT' | 'COMMUNITY' | 'REWARD' | string;
  description: string;
  date: string;
}

export interface AppNotification {
  id: string;
  type: 'suggestion' | 'alert' | 'challenge' | 'reward' | 'system' | string;
  title: string;
  message: string;
  emoji: string;
  read: boolean;
  date: string;
}

const EMPTY_PROFILE: UserProfile = {
  id: '', username: '', email: '', fullName: '', address: '', country: 'India',
  state: '', city: '', collegeName: '', spendingPreferences: [],
  monthlyIncome: 0, savingsMode: 'Balanced', xp: 0, level: 'Rookie Saver',
  nextLevel: 'Budget Pro', xpToNext: 300, badges: [], autoSmsEnabled: false,
  messageAccess: false, agentPersona: 'Coach', roundUpEnabled: false, roundUpTo: 10,
  roundUpPot: 0, savedByAi: 0, isDemo: false,
};

// Fetch the (6h-throttled) AI suggestion for a section/category.
export async function fetchSuggestion(context: string): Promise<string> {
  try {
    const res = await apiFetch(`/api/me/suggestion/${encodeURIComponent(context)}`);
    return res.text as string;
  } catch {
    return '';
  }
}

/* =========================== DATA LOADER =========================== */

export const loadUserData = async () => {
  const data = await apiFetch('/api/me/data');
  useUserStore.setState({ profile: mapUser(data.user) });
  useTransactionsStore.setState({ transactions: data.transactions || [] });
  useGoalsStore.setState({ goals: data.goals || [] });
  useAgentStore.setState({
    chatHistory: data.chatHistory || [],
    activityLog: data.activityLog || [],
    notifications: data.notifications || [],
    friendUnread: data.friendUnread || { total: 0, byUsername: {} },
  });
  return data;
};

function mapUser(u: any): UserProfile {
  return {
    id: u._id || u.id,
    username: u.username, email: u.email, fullName: u.fullName || u.name || '',
    address: u.address || '', country: u.country || 'India', state: u.state || '',
    city: u.city || '', collegeName: u.collegeName || '',
    spendingPreferences: u.spendingPreferences || [],
    monthlyIncome: u.monthlyIncome || 0, savingsMode: u.savingsMode || 'Balanced',
    xp: u.xp || 0, level: u.level || 'Rookie Saver', nextLevel: u.nextLevel || 'Budget Pro',
    xpToNext: u.xpToNext || 300, badges: u.badges || [], autoSmsEnabled: !!u.autoSmsEnabled,
    messageAccess: !!u.messageAccess, agentPersona: u.agentPersona || 'Coach',
    roundUpEnabled: !!u.roundUpEnabled, roundUpTo: u.roundUpTo || 10, roundUpPot: u.roundUpPot || 0,
    savedByAi: u.savedByAi || 0, isDemo: !!u.isDemo,
  };
}

/* =============================== AUTH =============================== */

interface AuthState {
  status: 'loading' | 'authed' | 'guest';
  init: () => Promise<void>;
  login: (identifier: string, password: string) => Promise<void>;
  signup: (payload: any) => Promise<void>;
  demoLogin: (username?: string) => Promise<void>;
  logout: () => void;
}

async function afterAuth(token: string) {
  setToken(token);
  await loadUserData();
  useAuthStore.setState({ status: 'authed' });
}

export const useAuthStore = create<AuthState>((set) => ({
  status: 'loading',

  init: async () => {
    if (!getToken()) { set({ status: 'guest' }); return; }
    try {
      await loadUserData();
      set({ status: 'authed' });
    } catch {
      setToken(null);
      set({ status: 'guest' });
    }
  },

  login: async (identifier, password) => {
    const res = await apiFetch('/api/auth/login', { method: 'POST', body: { identifier, password } });
    await afterAuth(res.token);
  },

  signup: async (payload) => {
    const res = await apiFetch('/api/auth/signup', { method: 'POST', body: payload });
    await afterAuth(res.token);
  },

  demoLogin: async (username) => {
    const res = await apiFetch('/api/auth/demo', { method: 'POST', body: { username } });
    await afterAuth(res.token);
  },

  logout: () => {
    setToken(null);
    useUserStore.setState({ profile: { ...EMPTY_PROFILE } });
    useTransactionsStore.setState({ transactions: [] });
    useGoalsStore.setState({ goals: [] });
    useAgentStore.setState({ chatHistory: [], activityLog: [], notifications: [], friendUnread: { total: 0, byUsername: {} }, currentNotification: null });
    set({ status: 'guest' });
  },
}));

/* ============================ USER PROFILE ============================ */

interface UserState {
  profile: UserProfile;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
}

export const useUserStore = create<UserState>(() => ({
  profile: { ...EMPTY_PROFILE },

  updateProfile: async (updates) => {
    const res = await apiFetch('/api/me/profile', { method: 'PATCH', body: updates });
    useUserStore.setState({ profile: mapUser(res.user) });
  },
}));

/* ============================ TRANSACTIONS ============================ */

interface TransactionsState {
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id' | 'date'>) => Promise<any>;
  deleteTransaction: (id: string) => Promise<void>;
}

export const useTransactionsStore = create<TransactionsState>(() => ({
  transactions: [],

  addTransaction: async (tx) => {
    const res = await apiFetch('/api/me/transactions', { method: 'POST', body: tx });
    await loadUserData();
    return res;
  },

  deleteTransaction: async (id) => {
    await apiFetch(`/api/me/transactions/${id}`, { method: 'DELETE' });
    await loadUserData();
  },
}));

/* =============================== GOALS =============================== */

interface GoalsState {
  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'id' | 'saved'>) => Promise<void>;
  updateGoalSaved: (id: number, amount: number) => Promise<void>;
  updateWeeklyTarget: (id: number, amount: number) => Promise<void>;
  deleteGoal: (id: number) => Promise<void>;
  sweepRoundUp: (goalId: number) => Promise<number>;
}

export const useGoalsStore = create<GoalsState>(() => ({
  goals: [],

  addGoal: async (goal) => {
    await apiFetch('/api/me/goals', { method: 'POST', body: goal });
    await loadUserData();
  },

  updateGoalSaved: async (id, amount) => {
    const goal = useGoalsStore.getState().goals.find((g) => g.id === id);
    if (!goal) return;
    const newSaved = Math.min(goal.target, goal.saved + amount);
    await apiFetch(`/api/me/goals/${id}`, { method: 'PUT', body: { saved: newSaved } });
    await loadUserData();
  },

  updateWeeklyTarget: async (id, amount) => {
    await apiFetch(`/api/me/goals/${id}`, { method: 'PUT', body: { weeklyTarget: amount } });
    await loadUserData();
  },

  deleteGoal: async (id) => {
    await apiFetch(`/api/me/goals/${id}`, { method: 'DELETE' });
    await loadUserData();
  },

  sweepRoundUp: async (goalId) => {
    const res = await apiFetch('/api/me/roundup/sweep', { method: 'POST', body: { goalId } });
    await loadUserData();
    return res.moved as number;
  },
}));

/* =============================== AGENT =============================== */

interface ToastNotification {
  title: string;
  message: string;
  subMessage?: string;
  emoji?: string;
}

interface FriendUnread {
  total: number;
  byUsername: Record<string, number>;
}

interface AgentState {
  chatHistory: ChatMessage[];
  isThinking: boolean;
  activityLog: ActivityItem[];
  notifications: AppNotification[];
  friendUnread: FriendUnread;
  currentNotification: ToastNotification | null;
  addChatMessage: (text: string) => Promise<void>;
  deleteChat: () => Promise<void>;
  addActivityLog: (item: Omit<ActivityItem, 'id' | 'date'>) => void;
  markNotificationsRead: () => Promise<void>;
  deleteNotification: (id: string) => Promise<void>;
  setCurrentNotification: (n: ToastNotification | null) => void;
}

export const useAgentStore = create<AgentState>((set) => ({
  chatHistory: [],
  isThinking: false,
  activityLog: [],
  notifications: [],
  friendUnread: { total: 0, byUsername: {} },
  currentNotification: null,

  addChatMessage: async (text) => {
    const optimistic: ChatMessage = { id: `tmp-${Date.now()}`, sender: 'user', text, date: new Date().toISOString() };
    set((s) => ({ chatHistory: [...s.chatHistory, optimistic], isThinking: true }));
    try {
      await apiFetch('/api/me/chat', { method: 'POST', body: { message: text } });
      await loadUserData();
    } catch (e) {
      set((s) => ({
        chatHistory: [...s.chatHistory, {
          id: `err-${Date.now()}`, sender: 'agent',
          text: 'Sorry — I had trouble reaching my brain just now. Make sure the backend is running and try again.',
          date: new Date().toISOString(),
        }],
      }));
    } finally {
      set({ isThinking: false });
    }
  },

  deleteChat: async () => {
    await apiFetch('/api/me/chat', { method: 'DELETE' });
    set({ chatHistory: [] });
  },

  addActivityLog: (item) => set((s) => ({
    activityLog: [{ ...item, id: `act-${Date.now()}`, date: new Date().toISOString() }, ...s.activityLog],
  })),

  markNotificationsRead: async () => {
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) }));
    try { await apiFetch('/api/me/notifications/read', { method: 'POST', body: {} }); } catch {}
  },

  deleteNotification: async (id) => {
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) }));
    try { await apiFetch(`/api/me/notifications/${id}`, { method: 'DELETE' }); } catch {}
  },

  setCurrentNotification: (n) => set({ currentNotification: n }),
}));
