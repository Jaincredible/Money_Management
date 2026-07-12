import { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { AlertCircle, Sparkles, Loader2, Repeat } from 'lucide-react';
import { useTransactionsStore, useGoalsStore, useUserStore, fetchSuggestion } from '../stores/useFinanceStore';
import { PERIODS, type Period, inPeriod, savingsRate, catMeta, inr } from '../lib/constants';
import CategoryDetail from '../components/CategoryDetail';
import SpendingHeatmap from '../components/SpendingHeatmap';

export default function Insights() {
  const { transactions } = useTransactionsStore();
  const { goals } = useGoalsStore();
  const { profile } = useUserStore();
  const [period, setPeriod] = useState<Period>('month');
  const [filter, setFilter] = useState<string>('All');
  const [detailCategory, setDetailCategory] = useState<string | null>(null);
  const [tip, setTip] = useState('');
  const [tipLoading, setTipLoading] = useState(true);

  useEffect(() => { fetchSuggestion('insights').then((s) => { setTip(s); setTipLoading(false); }); }, []);

  // Recurring subscriptions (grouped by merchant)
  const subscriptions = useMemo(() => {
    const map: Record<string, number> = {};
    transactions.filter((t) => t.type === 'expense' && t.category === 'Subscriptions' && inPeriod(t.date, 'month'))
      .forEach((t) => { map[t.merchant || 'Other'] = (map[t.merchant || 'Other'] || 0) + t.amount; });
    const items = Object.entries(map).map(([name, amount]) => ({ name, amount })).sort((a, b) => b.amount - a.amount);
    return { items, total: items.reduce((s, i) => s + i.amount, 0) };
  }, [transactions]);

  // Category totals for the selected period
  const { pieData, totalSpent } = useMemo(() => {
    const totals: Record<string, number> = {};
    transactions.filter((t) => t.type === 'expense' && inPeriod(t.date, period))
      .forEach((t) => { totals[t.category] = (totals[t.category] || 0) + t.amount; });
    const total = Object.values(totals).reduce((a, b) => a + b, 0);
    const data = Object.entries(totals).sort((a, b) => b[1] - a[1]).map(([name, value]) => ({
      name, value, pct: total > 0 ? Math.round((value / total) * 100) : 0, color: catMeta(name).color,
    }));
    return { pieData: data, totalSpent: total };
  }, [transactions, period]);

  const topCats = pieData.slice(0, 4).map((d) => d.name);

  // Weekly spending trend (last 6 weeks) for the top categories
  const weeklyTrend = useMemo(() => {
    const now = new Date();
    const weeks: any[] = [];
    for (let w = 5; w >= 0; w--) {
      const end = new Date(now); end.setHours(23, 59, 59, 999); end.setDate(now.getDate() - w * 7);
      const start = new Date(end); start.setDate(end.getDate() - 6); start.setHours(0, 0, 0, 0);
      const row: any = { week: `${6 - w}w` };
      topCats.forEach((c) => { row[c] = 0; });
      transactions.filter((t) => t.type === 'expense').forEach((t) => {
        const d = new Date(t.date);
        if (d >= start && d <= end && topCats.includes(t.category)) row[t.category] += t.amount;
      });
      weeks.push(row);
    }
    return weeks;
  }, [transactions, topCats]);

  // Realistic agent insights (preference-aware)
  const insights = useMemo(() => {
    const out: string[] = [];
    if (pieData.length) {
      const top = pieData[0];
      out.push(`Your biggest category is ${top.name} at ${inr(top.value)} (${top.pct}%). Trimming it 20% frees about ${inr(top.value * 0.2)}.`);
    }
    const behind = goals.find((g) => g.saved / g.target < 0.5);
    if (behind) out.push(`${behind.emoji} ${behind.name} is under halfway — ${inr(Math.round((behind.target - behind.saved) / 8))}/week keeps it on schedule.`);
    if (profile.spendingPreferences.includes('Travel')) out.push('You love travel — I round up spare change from expenses toward a trip fund.');
    else if (profile.spendingPreferences.includes('Sports')) out.push("You're into sports — I protect that budget line and flag gear deals.");
    out.push(`On a ${profile.savingsMode} plan you set aside ${Math.round(savingsRate(profile.savingsMode) * 100)}% of income — ahead of most students.`);
    return out.slice(0, 4);
  }, [pieData, goals, profile]);

  // Month-end projection
  const projection = useMemo(() => {
    const now = new Date();
    const dayOfMonth = now.getDate();
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const monthSpent = transactions.filter((t) => t.type === 'expense' && inPeriod(t.date, 'month')).reduce((s, t) => s + t.amount, 0);
    const projectedSpend = Math.round((monthSpent / Math.max(1, dayOfMonth)) * daysInMonth);
    const projectedSaving = Math.max(0, profile.monthlyIncome - projectedSpend);
    const target = Math.round(profile.monthlyIncome * savingsRate(profile.savingsMode));
    return { projectedSpend, projectedSaving, target, onTrack: projectedSaving >= target };
  }, [transactions, profile]);

  const periodLabel = PERIODS.find((p) => p.key === period)?.label || '';

  const LineTip = ({ active, payload, label }: any) => active && payload?.length ? (
    <div className="bg-slate-900 border border-white/10 p-3 rounded-xl text-xs shadow-xl space-y-1">
      <p className="font-bold text-white mb-1">{label} ago</p>
      {payload.map((p: any) => (
        <div key={p.name} className="flex items-center gap-2"><span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.stroke }} /><span className="text-slate-400">{p.name}:</span><span className="text-white font-semibold">{inr(p.value)}</span></div>
      ))}
    </div>
  ) : null;

  return (
    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
      <div className="max-w-lg mx-auto px-4 py-4 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">Money Intelligence</h1>
            <p className="text-xs text-slate-400">Real-time analytics on your spending</p>
          </div>
          <div className="flex bg-slate-900 border border-white/5 rounded-full p-0.5">
            {PERIODS.map((p) => (
              <button key={p.key} onClick={() => setPeriod(p.key)} className={`px-2 py-1 rounded-full text-[9px] font-bold transition-all ${period === p.key ? 'bg-indigo-600 text-white' : 'text-slate-400'}`}>{p.label}</button>
            ))}
          </div>
        </div>

        {/* Throttled AI suggestion */}
        <div className="rounded-2xl border border-indigo-500/25 bg-indigo-600/10 p-3.5 flex gap-2.5">
          <div className="w-8 h-8 rounded-full bg-indigo-500/15 border border-indigo-500/25 flex items-center justify-center text-indigo-300 shrink-0"><Sparkles size={15} /></div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Agent tip</p>
            {tipLoading
              ? <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5"><Loader2 size={12} className="animate-spin" /> Reviewing your spending…</p>
              : <p className="text-xs text-slate-200 leading-relaxed mt-0.5">{tip}</p>}
          </div>
        </div>

        {/* Trend */}
        <div className="glass-card rounded-2xl p-4">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide mb-2">Spending Trend (6 weeks)</h2>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1 mb-2">
            {['All', ...topCats].map((f) => (
              <button key={f} onClick={() => setFilter(f)} className={`py-1 px-3 rounded-full text-[10px] font-bold border transition-all ${filter === f ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-950 border-white/5 text-slate-400'}`}>{f}</button>
            ))}
          </div>
          <div className="h-[220px] w-full text-[9px] -ml-4 pr-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
                <XAxis dataKey="week" stroke="#475569" />
                <YAxis stroke="#475569" tickFormatter={(v) => `₹${v}`} />
                <Tooltip content={<LineTip />} />
                {topCats.map((c) => (
                  <Line key={c} type="monotone" dataKey={c} stroke={catMeta(c).color}
                    strokeWidth={filter === c || filter === 'All' ? 2.5 : 1}
                    strokeOpacity={filter === c || filter === 'All' ? 1 : 0.12} dot={false} />
                ))}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Spending calendar heatmap */}
        <SpendingHeatmap />

        {/* Donut */}
        <div className="glass-card rounded-2xl p-4">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide mb-2">Category Breakdown</h2>
          {pieData.length === 0 ? (
            <p className="text-center text-slate-500 text-xs py-10">No spending {periodLabel.toLowerCase()}.</p>
          ) : (
            <>
              <div className="relative min-h-[210px] flex items-center justify-center">
                <div className="absolute flex flex-col items-center pointer-events-none">
                  <span className="text-2xl font-extrabold text-white">{inr(totalSpent)}</span>
                  <span className="text-[9px] text-slate-400 uppercase tracking-wider mt-0.5">Spent · {periodLabel}</span>
                </div>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} innerRadius={65} outerRadius={95} paddingAngle={3} dataKey="value">
                      {pieData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-2 border-t border-white/5 pt-4">
                {pieData.map((item) => (
                  <button key={item.name} onClick={() => setDetailCategory(item.name)} className="flex items-center gap-2 text-left rounded-lg p-1 -m-1 hover:bg-white/5 transition-colors">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <div className="leading-none">
                      <p className="text-xs font-bold text-slate-200">{item.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono mt-1">{inr(item.value)} <span className="text-slate-600">({item.pct}%)</span></p>
                    </div>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Subscriptions */}
        {subscriptions.items.length > 0 && (
          <div className="glass-card rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide flex items-center gap-1.5"><Repeat size={13} className="text-violet-400" /> Subscriptions</h2>
              <span className="text-xs font-bold text-violet-300">{inr(subscriptions.total)}/mo</span>
            </div>
            <div className="space-y-2">
              {subscriptions.items.map((s) => (
                <div key={s.name} className="flex items-center justify-between bg-slate-950/50 border border-white/5 rounded-xl p-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-lg bg-violet-500/10 text-violet-300 text-[9px] font-bold flex items-center justify-center">{s.name.slice(0, 2).toUpperCase()}</span>
                    <span className="text-xs font-semibold text-slate-200">{s.name}</span>
                  </div>
                  <span className="text-xs font-mono text-slate-300">{inr(s.amount)}</span>
                </div>
              ))}
            </div>
            <p className="text-[10px] text-slate-500 mt-2.5">That's about {inr(subscriptions.total * 12)}/year — ask the agent to pause any you don't use.</p>
          </div>
        )}

        {/* Goal progress */}
        {goals.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Goal Progress</h2>
            {goals.map((g) => {
              const pct = Math.min(100, Math.round((g.saved / g.target) * 100));
              const tone = pct >= 60
                ? { badge: 'text-emerald-400 bg-emerald-950/40 border-emerald-500/20', bar: 'bg-emerald-500', label: 'Ahead' }
                : pct >= 35
                ? { badge: 'text-indigo-400 bg-indigo-950/40 border-indigo-500/20', bar: 'bg-indigo-500', label: 'On track' }
                : { badge: 'text-amber-400 bg-amber-950/40 border-amber-500/20', bar: 'bg-amber-500', label: 'Behind' };
              return (
                <div key={g.id} className="glass-card rounded-2xl p-4">
                  <div className="flex justify-between items-start mb-2.5">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{g.emoji}</span>
                      <div>
                        <h3 className="text-xs font-extrabold text-white">{g.name}</h3>
                        <p className="text-[9px] text-slate-500 mt-0.5">{g.targetDate ? `Due ${g.targetDate}` : 'No deadline'}</p>
                      </div>
                    </div>
                    <span className={`text-[9px] font-bold border px-2 py-0.5 rounded-full ${tone.badge}`}>{tone.label}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-mono mb-2">
                    <span className="text-emerald-400 font-bold">{inr(g.saved)} <span className="text-slate-500">saved</span></span>
                    <span className="text-slate-400">of {inr(g.target)} <span className="text-indigo-400 font-bold">({pct}%)</span></span>
                  </div>
                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-white/5">
                    <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Agent insights */}
        <div>
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide mb-3">Agent Insights 💡</h2>
          <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar -mx-4 px-4 snap-x">
            {insights.map((ins, i) => (
              <div key={i} className="w-[190px] shrink-0 bg-slate-900 border-l-2 border-indigo-500 border-y border-r border-white/5 rounded-r-xl p-3.5 snap-start shadow-lg">
                <div className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-2.5 text-xs">💡</div>
                <p className="text-[11px] text-slate-300 font-medium leading-relaxed">{ins}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Projection */}
        <div className="glass-card rounded-2xl p-4">
          <div className="flex justify-between items-start mb-2.5">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Projected savings this month</h3>
              <p className="text-[10px] text-slate-500 mt-0.5">Based on your pace so far</p>
            </div>
            <span className={`text-lg font-bold ${projection.onTrack ? 'text-emerald-400' : 'text-amber-400'}`}>{inr(projection.projectedSaving)}</span>
          </div>
          <div className={`mt-2 border rounded-xl p-2.5 flex items-start gap-2 ${projection.onTrack ? 'bg-emerald-950/30 border-emerald-500/20' : 'bg-amber-950/30 border-amber-500/20'}`}>
            <AlertCircle className={projection.onTrack ? 'text-emerald-500 shrink-0 mt-0.5' : 'text-amber-500 shrink-0 mt-0.5'} size={14} />
            <p className="text-[10px] text-slate-300 leading-normal">
              {projection.onTrack
                ? `On pace to beat your ${inr(projection.target)} target. Projected spend ${inr(projection.projectedSpend)}.`
                : `You're trending ${inr(projection.target - projection.projectedSaving)} short of your ${inr(projection.target)} target. I'll suggest small cuts.`}
            </p>
          </div>
        </div>
      </div>
      <CategoryDetail category={detailCategory} period={period} onClose={() => setDetailCategory(null)} />
    </div>
  );
}
