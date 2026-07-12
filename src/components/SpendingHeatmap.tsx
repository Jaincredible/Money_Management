import { useMemo } from 'react';
import { useTransactionsStore } from '../stores/useFinanceStore';
import { inr } from '../lib/constants';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function SpendingHeatmap() {
  const { transactions } = useTransactionsStore();

  const { cells, max, monthLabel, busiest } = useMemo(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstWeekday = new Date(year, month, 1).getDay();

    const totals: Record<number, number> = {};
    for (let d = 1; d <= daysInMonth; d++) totals[d] = 0;
    transactions.forEach((t) => {
      if (t.type !== 'expense') return;
      const d = new Date(t.date);
      if (d.getFullYear() === year && d.getMonth() === month) totals[d.getDate()] += t.amount;
    });

    const max = Math.max(1, ...Object.values(totals));
    const today = now.getDate();
    const cells: ({ day: number; amount: number; isToday: boolean } | null)[] = [];
    for (let i = 0; i < firstWeekday; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push({ day: d, amount: totals[d], isToday: d === today });

    const busiestDay = Object.entries(totals).sort((a, b) => b[1] - a[1])[0];
    return {
      cells, max,
      monthLabel: now.toLocaleDateString('en-IN', { month: 'long' }),
      busiest: busiestDay && busiestDay[1] > 0 ? { day: busiestDay[0], amount: busiestDay[1] } : null,
    };
  }, [transactions]);

  return (
    <div className="glass-card rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Spending calendar</h2>
        <span className="text-[10px] text-slate-500">{monthLabel}</span>
      </div>

      <div className="grid grid-cols-7 gap-1.5">
        {WEEKDAYS.map((w, i) => (
          <div key={i} className="text-center text-[9px] font-bold text-slate-600 uppercase">{w}</div>
        ))}
        {cells.map((c, i) => {
          if (!c) return <div key={i} />;
          const ratio = c.amount / max;
          const bg = c.amount === 0 ? 'rgba(148,163,184,0.06)' : `rgba(99,102,241,${0.18 + ratio * 0.72})`;
          return (
            <div
              key={i}
              title={`${monthLabel} ${c.day}: ${inr(c.amount)}`}
              className={`aspect-square rounded-md flex items-center justify-center text-[9px] font-semibold ${c.isToday ? 'ring-2 ring-indigo-400' : ''} ${ratio > 0.5 ? 'text-white' : 'text-slate-400'}`}
              style={{ backgroundColor: bg }}
            >
              {c.day}
            </div>
          );
        })}
      </div>

      <div className="flex items-center justify-between mt-3">
        <div className="flex items-center gap-1 text-[9px] text-slate-500">
          <span>Less</span>
          {[0.12, 0.35, 0.6, 0.9].map((r) => <span key={r} className="w-3 h-3 rounded-sm" style={{ backgroundColor: `rgba(99,102,241,${r})` }} />)}
          <span>More</span>
        </div>
        {busiest && <span className="text-[9px] text-slate-500">Busiest: {monthLabel} {busiest.day} · {inr(busiest.amount)}</span>}
      </div>
    </div>
  );
}
