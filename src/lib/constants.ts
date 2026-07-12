// Shared UI constants: category metadata, periods, savings-rate mirror of the backend.

export type Period = 'total' | 'year' | 'month' | 'today';

export const PERIODS: { key: Period; label: string }[] = [
  { key: 'total', label: 'Total' },
  { key: 'year', label: 'This Year' },
  { key: 'month', label: 'This Month' },
  { key: 'today', label: 'Today' },
];

export function inPeriod(dateStr: string, period: Period): boolean {
  if (!dateStr) return period === 'total';
  const d = new Date(dateStr);
  const now = new Date();
  if (period === 'today') return d.toDateString() === now.toDateString();
  if (period === 'month') return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
  if (period === 'year') return d.getFullYear() === now.getFullYear();
  return true; // total
}

export function savingsRate(mode: string): number {
  if (mode === 'Conservative') return 0.2;
  if (mode === 'Aggressive') return 0.5;
  return 0.3; // Balanced
}

export interface CategoryMeta {
  emoji: string;
  color: string;
  budget?: number; // suggested monthly budget for expense categories
}

export const CATEGORY_META: Record<string, CategoryMeta> = {
  Food: { emoji: '🍔', color: '#6366F1', budget: 2500 },
  Groceries: { emoji: '🛒', color: '#22C55E', budget: 2000 },
  Transport: { emoji: '🚌', color: '#F59E0B', budget: 800 },
  Travel: { emoji: '✈️', color: '#0EA5E9', budget: 3000 },
  Studies: { emoji: '📚', color: '#10B981', budget: 1500 },
  Entertainment: { emoji: '🎮', color: '#F43F5E', budget: 800 },
  Sports: { emoji: '⚽', color: '#84CC16', budget: 1200 },
  Shopping: { emoji: '🛍️', color: '#EC4899', budget: 1500 },
  Subscriptions: { emoji: '📱', color: '#8B5CF6', budget: 600 },
  Fitness: { emoji: '💪', color: '#14B8A6', budget: 1000 },
  Other: { emoji: '💳', color: '#94A3B8', budget: 1000 },
  Salary: { emoji: '💰', color: '#10B981' },
  Allowance: { emoji: '🎓', color: '#10B981' },
  Freelance: { emoji: '💼', color: '#10B981' },
  Gift: { emoji: '🎁', color: '#10B981' },
};

export const catMeta = (cat: string): CategoryMeta =>
  CATEGORY_META[cat] || { emoji: '💳', color: '#94A3B8', budget: 1000 };

// Human "x days ago" from an ISO date.
export function relativeTime(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr).getTime();
  const diff = Date.now() - d;
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Just now';
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day === 1) return 'Yesterday';
  if (day < 7) return `${day}d ago`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export const inr = (n: number) => `₹${Math.round(n || 0).toLocaleString('en-IN')}`;
