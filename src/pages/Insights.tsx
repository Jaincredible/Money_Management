import { useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Bot, AlertCircle } from 'lucide-react';
import { useInsightsStore, useGoalsStore } from '../stores/useFinanceStore';

export default function Insights() {
  const { categoryTotals, weeklyTrend, monthProjection, totalSpent } = useInsightsStore();
  const { goals } = useGoalsStore();

  const [activeFilter, setActiveFilter] = useState<'All' | 'Food' | 'Transport' | 'Studies' | 'Entertainment'>('All');

  // Colors config
  const COLORS = {
    Food: '#6366F1',         // indigo
    Transport: '#F59E0B',    // amber
    Entertainment: '#F43F5E',// rose
    Studies: '#10B981',      // emerald
    Subscriptions: '#8B5CF6'  // violet
  };

  // Convert category totals to Pie Data
  const pieData = Object.entries(categoryTotals).map(([key, val]) => {
    const pct = totalSpent > 0 ? Math.round((val / totalSpent) * 100) : 0;
    return {
      name: key,
      value: val,
      pct,
      color: COLORS[key as keyof typeof COLORS] || '#94A3B8'
    };
  });

  const insightsList = [
    { text: "Your food spending spikes every Friday evening. A ₹400 weekly limit could save ₹800/month." },
    { text: "You save 31% of your income — better than 78% of students on FinAgent." },
    { text: "3 active subscriptions: ₹468/month. Consider pausing Amazon Prime (₹299) when unused." },
    { text: "If you reduce Entertainment by ₹200, your Goa Trip goal moves up by 9 days." }
  ];

  // Custom tooltips
  const CustomLineTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900 border border-white/10 p-3 rounded-xl font-sans text-xs shadow-xl space-y-1">
          <p className="font-bold text-white mb-1">{label}</p>
          {payload.map((p: any) => (
            <div key={p.name} className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.stroke }} />
              <span className="text-slate-400">{p.name}:</span>
              <span className="text-white font-semibold">₹{p.value}</span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen pb-20 px-4 pt-4 max-w-lg mx-auto bg-background custom-scrollbar overflow-y-auto">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-extrabold text-white tracking-tight">Your Money Intelligence</h1>
        <p className="text-xs text-slate-400 font-medium">Real-time analytics · MongoDB Atlas</p>
      </div>

      {/* Spending Trend Line Chart */}
      <div className="glass-card rounded-2xl p-4 mb-5 animate-fade-in">
        <div className="flex flex-col gap-2 mb-3">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Monthly Spending Trend</h2>
          
          {/* Filters Row */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-1">
            {(['All', 'Food', 'Transport', 'Studies', 'Entertainment'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`py-1 px-3 rounded-full text-[10px] font-bold tracking-wide border transition-all ${
                  activeFilter === filter
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow shadow-indigo-500/10'
                    : 'bg-slate-950 border-white/5 text-slate-400 hover:text-white'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        <div className="h-[250px] w-full font-mono text-[9px] -ml-4 pr-1 mt-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={weeklyTrend} margin={{ top: 10, right: 10, left: 0, bottom: 5 }}>
              <XAxis dataKey="week" stroke="#475569" strokeWidth={1} />
              <YAxis stroke="#475569" strokeWidth={1} tickFormatter={(val) => `₹${val}`} />
              <Tooltip content={<CustomLineTooltip />} />
              <Line
                type="monotone"
                dataKey="Food"
                name="Food"
                stroke={COLORS.Food}
                strokeWidth={activeFilter === 'Food' || activeFilter === 'All' ? 2.5 : 1}
                strokeOpacity={activeFilter === 'Food' || activeFilter === 'All' ? 1 : 0.15}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="Transport"
                name="Transport"
                stroke={COLORS.Transport}
                strokeWidth={activeFilter === 'Transport' || activeFilter === 'All' ? 2.5 : 1}
                strokeOpacity={activeFilter === 'Transport' || activeFilter === 'All' ? 1 : 0.15}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="Entertainment"
                name="Entertainment"
                stroke={COLORS.Entertainment}
                strokeWidth={activeFilter === 'Entertainment' || activeFilter === 'All' ? 2.5 : 1}
                strokeOpacity={activeFilter === 'Entertainment' || activeFilter === 'All' ? 1 : 0.15}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="Studies"
                name="Studies"
                stroke={COLORS.Studies}
                strokeWidth={activeFilter === 'Studies' || activeFilter === 'All' ? 2.5 : 1}
                strokeOpacity={activeFilter === 'Studies' || activeFilter === 'All' ? 1 : 0.15}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Breakdown Donut */}
      <div className="glass-card rounded-2xl p-4 mb-5 animate-fade-in">
        <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide mb-3">Category Breakdown</h2>
        
        <div className="flex flex-col items-center justify-center relative min-h-[220px]">
          {/* Total Spent in the center */}
          <div className="absolute flex flex-col items-center justify-center text-center z-10 pointer-events-none mt-1">
            <span className="text-2xl font-extrabold text-white">₹{totalSpent.toLocaleString()}</span>
            <span className="text-[9px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5">Spent This Month</span>
          </div>

          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={pieData}
                innerRadius={65}
                outerRadius={95}
                paddingAngle={4}
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legend */}
        <div className="grid grid-cols-2 gap-3.5 mt-2 border-t border-white/5 pt-4">
          {pieData.map((item) => (
            <div key={item.name} className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
              <div className="text-left leading-none">
                <p className="text-xs font-bold text-slate-200">{item.name}</p>
                <p className="text-[10px] text-slate-400 font-mono mt-1">
                  ₹{item.value} <span className="text-[9px] text-slate-600">({item.pct}%)</span>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Goal Progress Cards */}
      <div className="space-y-4 mb-5">
        <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Goal Progress</h2>

        {goals.map((g) => {
          const pct = Math.round((g.saved / g.target) * 100);
          
          // Determine status color
          // Goa Trip (id: 1) is slightly behind, Emergency fund (id:3) ahead, Laptop (id:2) on track
          let statusText = 'On Track';
          let statusColor = 'text-emerald-400 bg-emerald-950/40 border-emerald-500/20';
          let barColor = 'bg-emerald-500';
          let projDate = 'Due Dec 2026';

          if (g.id === 1) {
            statusText = 'Behind';
            statusColor = 'text-rose-400 bg-rose-950/40 border-rose-500/20';
            barColor = 'bg-rose-500';
            projDate = 'Due Aug 4, 2026 (Recalculated)';
          } else if (g.id === 3) {
            statusText = 'Ahead';
            statusColor = 'text-emerald-400 bg-emerald-950/40 border-emerald-500/20';
            barColor = 'bg-emerald-500';
            projDate = 'Due Sep 2026 (Ahead)';
          } else {
            projDate = `Due Dec 2026`;
          }

          return (
            <div key={g.id} className="glass-card rounded-2xl p-4 animate-fade-in relative overflow-hidden">
              <div className="flex justify-between items-start mb-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-lg">{g.emoji}</span>
                  <div>
                    <h3 className="text-xs font-extrabold text-white">{g.name}</h3>
                    <p className="text-[9px] text-slate-500 font-medium mt-0.5">{projDate}</p>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <span className={`text-[9px] font-bold border px-2 py-0.5 rounded-full ${statusColor}`}>
                    {statusText}
                  </span>
                  
                  {/* Agent active badge */}
                  <span className="text-[9px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-full flex items-center gap-0.5 font-semibold">
                    <Bot size={10} />
                  </span>
                </div>
              </div>

              <div className="flex justify-between text-[11px] font-mono mb-2">
                <span className="text-emerald-400 font-bold">₹{g.saved.toLocaleString()} <span className="text-slate-500">saved</span></span>
                <span className="text-slate-400">of ₹{g.target.toLocaleString()} <span className="text-indigo-400 font-bold">({pct}%)</span></span>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-white/5">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${barColor}`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Agent Insights (Horizontal Scroll) */}
      <div className="mb-5">
        <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide mb-3">Agent Insights 💡</h2>
        
        <div className="flex gap-3.5 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 snap-x">
          {insightsList.map((ins, idx) => (
            <div
              key={idx}
              className="w-[180px] shrink-0 bg-slate-900 border-l-2 border-indigo-500 border border-y-white/5 border-r-white/5 rounded-r-xl rounded-l-none p-3.5 snap-start shadow-lg relative flex flex-col justify-between"
            >
              <div className="w-6 h-6 rounded-full bg-amber-500/10 flex items-center justify-center mb-2.5 border border-amber-500/20">
                <span className="text-xs text-amber-500">💡</span>
              </div>
              <p className="text-[11px] text-slate-300 font-medium leading-relaxed">
                {ins.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Month-End Projection */}
      <div className="glass-card rounded-2xl p-4 animate-fade-in">
        <div className="flex justify-between items-start mb-2.5">
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Projected Savings by June 30</h3>
            <p className="text-[10px] text-slate-500 mt-0.5">Recalculated dynamically</p>
          </div>
          <span className="text-lg font-bold text-emerald-400">₹{monthProjection.toLocaleString()}</span>
        </div>

        {/* Projection target visual */}
        <div className="space-y-1.5 mt-4">
          <div className="relative h-4 w-full bg-slate-950 rounded-full border border-white/5 overflow-hidden">
            {/* Actual Saved (emerald) */}
            <div className="absolute left-0 top-0 bottom-0 bg-emerald-500 rounded-l-full" style={{ width: '60%' }} />
            {/* Projected saved (indigo overlay) */}
            <div className="absolute left-[60%] top-0 bottom-0 bg-indigo-500/60" style={{ width: '15%' }} />
            {/* Monthly target dashed line */}
            <div className="absolute left-[80%] top-0 bottom-0 border-l border-dashed border-slate-400 w-1" />
          </div>
          
          <div className="flex justify-between text-[9px] font-mono text-slate-500">
            <span className="text-emerald-400 font-medium">Actual Saved (₹2,500)</span>
            <span className="text-indigo-400 font-medium">Projected (₹{monthProjection})</span>
            <span className="text-slate-400 font-medium">Target (₹3,000)</span>
          </div>
        </div>

        {/* Warning chip */}
        <div className="mt-4 bg-amber-950/30 border border-amber-500/20 rounded-xl p-2.5 flex items-start gap-2">
          <AlertCircle className="text-amber-500 shrink-0 mt-0.5" size={14} />
          <p className="text-[10px] text-slate-400 leading-normal">
            You're ₹20 short of your ₹3,000 monthly target. The agent will auto-adjust next week.
          </p>
        </div>
      </div>
    </div>
  );
}
