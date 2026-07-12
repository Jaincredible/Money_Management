import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Wallet, ArrowDownCircle, ArrowUpCircle, PiggyBank, ChevronRight, MessageSquare, Target, Users, X } from 'lucide-react';
import { useUserStore, useTransactionsStore, useAgentStore } from '../stores/useFinanceStore';
import type { ActivityItem } from '../stores/useFinanceStore';
import { PERIODS, type Period, inPeriod, savingsRate, catMeta, relativeTime, inr } from '../lib/constants';
import AddTransactionModal from '../components/AddTransactionModal';
import ActivityLog from '../components/ActivityLog';

const activityIcon = (cat: string) => {
  switch (cat) {
    case 'INCOME': return '💰';
    case 'EXPENSE': return '🧾';
    case 'GOALS': return '🎯';
    case 'ALERT': return '⚠️';
    case 'COMMUNITY': return '👥';
    case 'REWARD': return '🏆';
    default: return '🤖';
  }
};

export default function Home() {
  const navigate = useNavigate();
  const { profile } = useUserStore();
  const { transactions } = useTransactionsStore();
  const { activityLog } = useAgentStore();

  const [period, setPeriod] = useState<Period>('month');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addType, setAddType] = useState<'income' | 'expense'>('expense');
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [selected, setSelected] = useState<ActivityItem | null>(null);

  const firstName = (profile.fullName || profile.username || 'there').split(' ')[0];
  const monthLabel = new Date().toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

  const stats = useMemo(() => {
    const allIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const allExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const inPer = transactions.filter((t) => inPeriod(t.date, period));
    const credit = inPer.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
    const spent = inPer.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const savedByAi = Math.round(credit * savingsRate(profile.savingsMode));

    const catTotals: Record<string, number> = {};
    inPer.filter((t) => t.type === 'expense').forEach((t) => { catTotals[t.category] = (catTotals[t.category] || 0) + t.amount; });

    return { balance: allIncome - allExpense, credit, spent, savedByAi, catTotals };
  }, [transactions, period, profile.savingsMode]);

  const spendPct = stats.credit > 0 ? Math.min(100, Math.round((stats.spent / stats.credit) * 100)) : 0;
  const ringOffset = 251.2 - (251.2 * spendPct) / 100;

  const tiles = [
    { key: 'bank', label: 'MoneyBank', sub: 'Current balance', value: stats.balance, icon: Wallet, color: 'text-white', ring: 'from-indigo-500/20 to-violet-500/10', always: true },
    { key: 'credit', label: 'Credited', sub: 'Money in', value: stats.credit, icon: ArrowDownCircle, color: 'text-emerald-400', ring: 'from-emerald-500/15 to-transparent' },
    { key: 'spent', label: 'Spent', sub: 'Money out', value: stats.spent, icon: ArrowUpCircle, color: 'text-rose-400', ring: 'from-rose-500/15 to-transparent' },
    { key: 'saved', label: 'Saved by AI', sub: 'Auto-allocated', value: stats.savedByAi, icon: PiggyBank, color: 'text-indigo-300', ring: 'from-indigo-500/15 to-transparent' },
  ];

  const openAdd = (type: 'income' | 'expense') => { setAddType(type); setIsAddOpen(true); };

  const catList = Object.entries(stats.catTotals).sort((a, b) => b[1] - a[1]).slice(0, 8);

  return (
    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
      <div className="max-w-lg mx-auto px-4 py-4 space-y-5">
        {/* Greeting */}
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">Hey, {firstName} 👋</h1>
          <p className="text-xs text-slate-400 font-medium">{monthLabel}</p>
        </div>

        {/* Agent status chip */}
        <button
          onClick={() => navigate('/agent')}
          className="w-full bg-indigo-600/90 text-white rounded-2xl p-3 px-4 flex items-center gap-2 border border-indigo-400/20 shadow-indigo-glow/20 shadow-md text-left"
        >
          <Bot size={16} className="text-indigo-100 shrink-0" />
          <span className="text-xs font-semibold flex-1">
            {stats.spent <= stats.credit ? "You're on track this month ✓ Ask me anything." : 'Spending is running hot — tap to get a plan.'}
          </span>
          <ChevronRight size={14} className="text-indigo-200" />
        </button>

        {/* Dashboard + period toggle */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Dashboard</h2>
            <div className="flex bg-slate-900 border border-white/5 rounded-full p-0.5">
              {PERIODS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => setPeriod(p.key)}
                  className={`px-2.5 py-1 rounded-full text-[10px] font-bold transition-all ${
                    period === p.key ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {tiles.map((t) => {
              const Icon = t.icon;
              return (
                <div key={t.key} className={`glass-card rounded-2xl p-4 relative overflow-hidden bg-gradient-to-br ${t.ring}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t.label}</span>
                    <Icon size={15} className={t.color} />
                  </div>
                  <p className={`text-xl font-extrabold ${t.color}`}>{inr(t.value)}</p>
                  <p className="text-[9px] text-slate-500 font-medium mt-0.5 flex items-center gap-1">
                    {t.always ? 'Live balance' : `${t.sub} · ${PERIODS.find((p) => p.key === period)?.label}`}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Spend ratio bar */}
          <div className="glass-card rounded-2xl p-4 mt-3 flex items-center gap-4">
            <div className="relative w-16 h-16 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" className="stroke-slate-800" strokeWidth="9" fill="transparent" />
                <circle cx="50" cy="50" r="40" className={spendPct > 90 ? 'stroke-rose-500' : 'stroke-indigo-500'} strokeWidth="9" fill="transparent"
                  strokeDasharray="251.2" strokeDashoffset={ringOffset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset .6s' }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-extrabold text-white">{spendPct}%</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-xs font-bold text-slate-200">Spend ratio</p>
              <p className="text-[11px] text-slate-400 leading-relaxed mt-0.5">
                You've spent {inr(stats.spent)} of the {inr(stats.credit)} credited {PERIODS.find((p) => p.key === period)?.label.toLowerCase()}.
              </p>
            </div>
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2.5 overflow-x-auto no-scrollbar -mx-4 px-4">
          <button onClick={() => openAdd('expense')} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-4 py-2 text-xs font-semibold whitespace-nowrap shadow-indigo-glow/20 shadow-md flex items-center gap-1.5 transition-all">
            <ArrowUpCircle size={13} /> Add Expense
          </button>
          <button onClick={() => openAdd('income')} className="bg-emerald-600/90 hover:bg-emerald-600 text-white rounded-full px-4 py-2 text-xs font-semibold whitespace-nowrap flex items-center gap-1.5 transition-all">
            <ArrowDownCircle size={13} /> Add Income
          </button>
          <button onClick={() => navigate('/agent')} className="bg-slate-800 hover:bg-slate-700 border border-white/10 text-white rounded-full px-4 py-2 text-xs font-semibold whitespace-nowrap flex items-center gap-1.5"><MessageSquare size={13} /> Ask Agent</button>
          <button onClick={() => navigate('/goals')} className="bg-slate-800 hover:bg-slate-700 border border-white/10 text-white rounded-full px-4 py-2 text-xs font-semibold whitespace-nowrap flex items-center gap-1.5"><Target size={13} /> Goals</button>
          <button onClick={() => navigate('/community')} className="bg-slate-800 hover:bg-slate-700 border border-white/10 text-white rounded-full px-4 py-2 text-xs font-semibold whitespace-nowrap flex items-center gap-1.5"><Users size={13} /> Challenge</button>
        </div>

        {/* Budget breakdown */}
        <div>
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide mb-3">Where it went</h2>
          {catList.length === 0 ? (
            <div className="glass-card rounded-2xl p-6 text-center text-slate-500 text-xs">
              No spending {PERIODS.find((p) => p.key === period)?.label.toLowerCase()} yet. Add an expense to see the breakdown.
            </div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 snap-x">
              {catList.map(([cat, spent]) => {
                const meta = catMeta(cat);
                const limit = meta.budget || 1000;
                const pct = Math.round((spent / limit) * 100);
                const over = spent > limit;
                return (
                  <div key={cat} className={`w-[140px] shrink-0 rounded-2xl p-3.5 snap-start glass-card ${over ? 'border-rose-500/40' : ''}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xl">{meta.emoji}</span>
                      {over && <span className="text-[8px] font-bold text-rose-500 bg-rose-950/60 border border-rose-500/20 px-1.5 py-0.5 rounded-full uppercase">Over</span>}
                    </div>
                    <h3 className="text-xs font-bold text-slate-200 mb-1">{cat}</h3>
                    <p className="text-[11px] font-mono text-slate-400 mb-2">{inr(spent)} <span className="text-[10px] text-slate-600">/ {inr(limit)}</span></p>
                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-white/5">
                      <div className={`h-full rounded-full ${over ? 'bg-rose-500' : pct > 75 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Agent activity feed */}
        <div className="glass-card rounded-2xl p-4">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Agent Activity
            </h2>
            <button onClick={() => setIsLogOpen(true)} className="text-[10px] text-indigo-400 font-bold hover:underline flex items-center">
              View all <ChevronRight size={10} />
            </button>
          </div>
          {activityLog.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-4">Your agent's actions will appear here.</p>
          ) : (
            <div className="space-y-2.5">
              {activityLog.slice(0, 6).map((log) => (
                <button key={log.id} onClick={() => setSelected(log)} className="w-full flex items-start gap-3 p-2 hover:bg-slate-800/40 rounded-xl transition-all text-left group">
                  <div className="w-8 h-8 rounded-full bg-slate-800/80 border border-white/5 flex items-center justify-center shrink-0 text-base group-hover:scale-105 transition-transform">
                    {activityIcon(log.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-200 font-medium leading-normal">{log.description}</p>
                    <span className="text-[9px] text-slate-500 font-mono">{relativeTime(log.date)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <AddTransactionModal key={`${addType}-${isAddOpen}`} isOpen={isAddOpen} onClose={() => setIsAddOpen(false)} initialType={addType} />
      <ActivityLog isOpen={isLogOpen} onClose={() => setIsLogOpen(false)} />

      {/* Activity detail */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setSelected(null)}>
          <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl p-5 shadow-2xl relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setSelected(null)} className="absolute top-4 right-4 p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white"><X size={14} /></button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center text-xl">{activityIcon(selected.category)}</div>
              <div>
                <h3 className="text-sm font-bold text-white">Agent action</h3>
                <p className="text-[10px] text-slate-400">{selected.category} · {relativeTime(selected.date)}</p>
              </div>
            </div>
            <p className="text-sm text-slate-200 bg-slate-950 p-3 rounded-xl border border-white/5 leading-relaxed">{selected.description}</p>
          </div>
        </div>
      )}
    </div>
  );
}
