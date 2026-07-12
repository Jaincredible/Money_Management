// Spending-preference metadata (mirrors server heuristics.SPENDING_PREFERENCES).
export interface PrefMeta { key: string; emoji: string; label: string; }

export const FALLBACK_PREFS_META: PrefMeta[] = [
  { key: 'Food', emoji: '🍔', label: 'Eating Out' },
  { key: 'Groceries', emoji: '🛒', label: 'Groceries' },
  { key: 'Travel', emoji: '✈️', label: 'Travel' },
  { key: 'Sports', emoji: '⚽', label: 'Sports' },
  { key: 'Entertainment', emoji: '🎮', label: 'Entertainment' },
  { key: 'Studies', emoji: '📚', label: 'Studies' },
  { key: 'Shopping', emoji: '🛍️', label: 'Shopping' },
  { key: 'Fitness', emoji: '💪', label: 'Fitness & Gym' },
  { key: 'Subscriptions', emoji: '📱', label: 'Subscriptions' },
  { key: 'Transport', emoji: '🚌', label: 'Transport' },
];
