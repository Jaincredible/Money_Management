import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Wallet, ArrowDownCircle, ArrowUpCircle, PiggyBank, ChevronRight, MessageSquare, Target, Users, X, Gauge, Zap, Sparkles, Coins, CalendarClock } from 'lucide-react';
import { useUserStore, useTransactionsStore, useGoalsStore, useAgentStore, fetchSuggestion } from '../stores/useFinanceStore';
import type { ActivityItem } from '../stores/useFinanceStore';
import { PERIODS, type Period, inPeriod, savingsRate, catMeta, relativeTime, inr } from '../lib/constants';
import AddTransactionModal from '../components/AddTransactionModal';
import ActivityLog from '../components/ActivityLog';
import CategoryDetail from '../components/CategoryDetail';

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
  const { goals, sweepRoundUp } = useGoalsStore();
  const { activityLog } = useAgentStore();

  const [period, setPeriod] = useState<Period>('month');
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [addType, setAddType] = useState<'income' | 'expense'>('expense');
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [selected, setSelected] = useState<ActivityItem | null>(null);
  const [detailCategory, setDetailCategory] = useState<string | null>(null);
  const [tip, setTip] = useState('');

  useEffect(() => { fetchSuggestion('home').then(setTip); }, []);

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

    return { balance: allIncome - allExpense, totalIncome: allIncome, credit, spent, savedByAi, catTotals };
  }, [transactions, period, profile.savingsMode]);

  // Financial Health Score (0-100) + Safe-to-spend today — always month-based, independent of the toggle.
  const health = useMemo(() => {
    const now = new Date();
    const monthTx = transactions.filter((t) => inPeriod(t.date, 'month'));
    const monthSpent = monthTx.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
    const saveRatio = stats.totalIncome > 0 ? stats.balance / stats.totalIncome : 0;
    const saveScore = Math.max(0, Math.min(1, saveRatio / 0.35)) * 40;
    const goalAvg = goals.length ? goals.reduce((s, g) => s + Math.min(1, g.saved / g.target), 0) / goals.length : 0.5;
    const goalScore = goalAvg * 30;
    const monthCats = Object.entries(stats.catTotals);
    const withinBudget = monthCats.length ? monthCats.filter(([c, v]) => v <= (catMeta(c).budget || 1000)).length / monthCats.length : 1;
    const budgetScore = withinBudget * 30;
    const score = Math.round(saveScore + goalScore + budgetScore);

    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const daysLeft = Math.max(1, daysInMonth - now.getDate() + 1);
    const committed = profile.monthlyIncome * savingsRate(profile.savingsMode);
    const safeToday = Math.max(0, Math.round((profile.monthlyIncome - committed - monthSpent) / daysLeft));

    const label = score >= 75 ? 'Excellent' : score >= 55 ? 'Good' : score >= 35 ? 'Fair' : 'Needs work';
    const tone = score >= 75 ? 'text-emerald-400' : score >= 55 ? 'text-indigo-300' : score >= 35 ? 'text-amber-400' : 'text-rose-400';
    return { score, label, tone, safeToday };
  }, [transactions, goals, stats, profile.monthlyIncome, profile.savingsMode]);

  // Upcoming recurring bills (from subscription transactions)
  const bills = useMemo(() => {
    const now = new Date();
    const byMerchant: Record<string, { amount: number; day: number; date: number }> = {};
    transactions.filter((t) => t.type === 'expense' && t.category === 'Subscriptions').forEach((t) => {
      const d = new Date(t.date); const m = t.merchant || 'Subscription';
      if (!byMerchant[m] || d.getTime() > byMerchant[m].date) byMerchant[m] = { amount: t.amount, day: d.getDate(), date: d.getTime() };
    });
    return Object.entries(byMerchant).map(([name, v]) => {
      let due = new Date(now.getFullYear(), now.getMonth(), v.day);
      if (due.getTime() < now.getTime() - 86400000) due = new Date(now.getFullYear(), now.getMonth() + 1, v.day);
      const days = Math.max(0, Math.ceil((due.getTime() - now.getTime()) / 86400000));
      return { name, amount: v.amount, days };
    }).sort((a, b) => a.days - b.days).slice(0, 3);
  }, [transactions]);

  const handleSweep = async () => { if (goals.length) await sweepRoundUp(goals[0].id).catch(() => {}); };

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

        {/* Financial health + safe-to-spend */}
        <div className="grid grid-cols-2 gap-3">
          <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
            <div className="relative w-16 h-16 shrink-0">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" className="stroke-slate-800" strokeWidth="9" fill="transparent" />
                <circle cx="50" cy="50" r="40" className="stroke-indigo-500" strokeWidth="9" fill="transparent" strokeDasharray="251.2" strokeDashoffset={251.2 - (251.2 * health.score) / 100} strokeLinecap="round" style={{ transition: 'stroke-dashoffset .6s' }} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-base font-extrabold ${health.tone}`}>{health.score}</span>
              </div>
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Gauge size={11} /> Health</p>
              <p className={`text-sm font-bold ${health.tone}`}>{health.label}</p>
              <p className="text-[9px] text-slate-500">score / 100</p>
            </div>
          </div>
          <div className="glass-card rounded-2xl p-4 flex flex-col justify-center">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1"><Zap size={11} className="text-amber-400" /> Safe to spend</p>
            <p className="text-xl font-extrabold text-white mt-1">{inr(health.safeToday)}</p>
            <p className="text-[9px] text-slate-500 mt-0.5">today, staying on plan</p>
          </div>
        </div>

        {/* AI tip (refreshes at most every 6h) */}
        {tip && (
          <div className="rounded-2xl border border-indigo-500/25 bg-indigo-600/10 p-3.5 flex gap-2.5">
            <div className="w-8 h-8 rounded-full bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-300 shrink-0"><Sparkles size={15} /></div>
            <div className="min-w-0">
              <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Agent tip</p>
              <p className="text-xs text-slate-200 leading-relaxed mt-0.5">{tip}</p>
            </div>
          </div>
        )}

        {/* Round-up spare change */}
        {profile.roundUpEnabled && (
          <div className="glass-card rounded-2xl p-4 flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0"><Coins size={20} /></div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Spare change</p>
              <p className="text-lg font-extrabold text-white">{inr(profile.roundUpPot)}</p>
              <p className="text-[9px] text-slate-500">rounded up from your expenses</p>
            </div>
            {profile.roundUpPot > 0 && goals.length > 0 && (
              <button onClick={handleSweep} className="text-[10px] font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300 px-3 py-2 rounded-full hover:bg-amber-500/25 transition-all shrink-0">Move to {goals[0].emoji}</button>
            )}
          </div>
        )}

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
                  <button key={cat} onClick={() => setDetailCategory(cat)} className={`text-left w-[140px] shrink-0 rounded-2xl p-3.5 snap-start glass-card transition-all hover:border-indigo-500/40 hover:-translate-y-0.5 ${over ? 'border-rose-500/40' : ''}`}>
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-xl">{meta.emoji}</span>
                      {over
                        ? <span className="text-[8px] font-bold text-rose-500 bg-rose-950/60 border border-rose-500/20 px-1.5 py-0.5 rounded-full uppercase">Over</span>
                        : <ChevronRight size={12} className="text-slate-600" />}
                    </div>
                    <h3 className="text-xs font-bold text-slate-200 mb-1">{cat}</h3>
                    <p className="text-[11px] font-mono text-slate-400 mb-2">{inr(spent)} <span className="text-[10px] text-slate-600">/ {inr(limit)}</span></p>
                    <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-white/5">
                      <div className={`h-full rounded-full ${over ? 'bg-rose-500' : pct > 75 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Upcoming bills */}
        {bills.length > 0 && (
          <div className="glass-card rounded-2xl p-4">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide mb-3 flex items-center gap-1.5"><CalendarClock size={14} className="text-indigo-400" /> Upcoming bills</h2>
            <div className="space-y-2">
              {bills.map((b) => (
                <div key={b.name} className="flex items-center justify-between bg-slate-950/50 border border-white/5 rounded-xl p-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-slate-800 text-slate-300 text-[9px] font-bold flex items-center justify-center">{b.name.slice(0, 2).toUpperCase()}</span>
                    <div><p className="text-xs font-semibold text-slate-200">{b.name}</p><p className="text-[9px] text-slate-500">{b.days === 0 ? 'Due today' : `in ${b.days} day${b.days > 1 ? 's' : ''}`}</p></div>
                  </div>
                  <span className="text-xs font-mono text-slate-300">{inr(b.amount)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

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
      <CategoryDetail category={detailCategory} period={period} onClose={() => setDetailCategory(null)} />

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
