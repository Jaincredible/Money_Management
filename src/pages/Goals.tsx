import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Bot, Plus, ArrowRight, X, Trash2, Loader2, Check, PiggyBank } from 'lucide-react';
import { useGoalsStore } from '../stores/useFinanceStore';
import { inr } from '../lib/constants';

const EMOJIS = ['🏖️', '💻', '🛡️', '✈️', '🚗', '🎓', '🎁', '🏠', '🚴', '👟', '📱', '🎧'];

// Deterministic, realistic-looking 6-week contribution history that sums close to `saved`.
function history(saved: number, id: number) {
  const base = Math.max(0, Math.round(saved / 6));
  return Array.from({ length: 6 }, (_, i) => ({
    name: `${i + 1}w`,
    amount: Math.max(0, Math.round(base * (0.7 + ((((i + id) * 37) % 60) / 100)))),
  }));
}

export default function Goals() {
  const { goals, addGoal, deleteGoal, updateGoalSaved } = useGoalsStore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [depositId, setDepositId] = useState<number | null>(null);

  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🏖️');
  const [target, setTarget] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [weeklyTarget, setWeeklyTarget] = useState('');
  const [monitor, setMonitor] = useState(true);
  const [creating, setCreating] = useState(false);
  const [createStep, setCreateStep] = useState(0);

  const calcWeekly = (tgt: number, dt: string) => {
    if (!tgt || !dt) return;
    const weeks = Math.max(1, Math.ceil((new Date(dt).getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 7)));
    setWeeklyTarget(String(Math.round(tgt / weeks)));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !target || !targetDate) return;
    setCreating(true);
    setCreateStep(1);
    await new Promise((r) => setTimeout(r, 500)); setCreateStep(2);
    await new Promise((r) => setTimeout(r, 500)); setCreateStep(3);
    try {
      await addGoal({
        name, emoji, target: parseFloat(target),
        weeklyTarget: parseFloat(weeklyTarget) || Math.round(parseFloat(target) / 12),
        startDate: new Date().toISOString().split('T')[0], targetDate, agentMonitoring: monitor,
      });
      setIsAddOpen(false);
      setName(''); setEmoji('🏖️'); setTarget(''); setTargetDate(''); setWeeklyTarget('');
    } finally {
      setCreating(false); setCreateStep(0);
    }
  };

  return (
    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="flex justify-between items-center mb-5">
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight">Your Goals</h1>
            <p className="text-xs text-slate-400">The agent moves money toward these automatically</p>
          </div>
          <button onClick={() => setIsAddOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-4 py-2 text-xs font-semibold shadow-indigo-glow/20 shadow-md flex items-center gap-1 transition-all">
            <Plus size={14} /> New Goal
          </button>
        </div>

        {goals.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400"><PiggyBank size={26} /></div>
            <p className="text-sm font-bold text-white">No goals yet</p>
            <p className="text-xs text-slate-400 max-w-[240px] mx-auto">Create your first goal — a trip, a laptop, an emergency fund — and I'll auto-save toward it every time income arrives.</p>
            <button onClick={() => setIsAddOpen(true)} className="mt-2 bg-indigo-gradient text-white rounded-full px-5 py-2.5 text-xs font-bold shadow-indigo-glow inline-flex items-center gap-1.5"><Plus size={14} /> Create a goal</button>
          </div>
        ) : (
          <div className="space-y-4">
            {goals.map((g) => {
              const pct = Math.min(100, Math.round((g.saved / g.target) * 100));
              const expanded = expandedId === g.id;
              const behind = pct < 35;
              return (
                <div key={g.id} className={`glass-card rounded-2xl p-4 transition-all ${expanded ? 'border-indigo-500/40 ring-1 ring-indigo-500/20' : ''}`}>
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{g.emoji}</span>
                      <div>
                        <h2 className="text-sm font-extrabold text-white leading-none">{g.name}</h2>
                        <span className="text-[9px] text-slate-500 mt-1 inline-block">Target: {g.targetDate || 'no date'}</span>
                      </div>
                    </div>
                    {g.agentMonitoring && (
                      <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full flex items-center gap-1 font-bold">
                        <Bot size={10} /> Agent
                      </span>
                    )}
                  </div>

                  <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-white/5 mb-3">
                    <div className={`h-full rounded-full transition-all duration-1000 ${behind ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${pct}%` }} />
                  </div>

                  <div className="flex justify-between items-center text-xs mb-3">
                    <div><span className="text-emerald-400 font-bold">{inr(g.saved)}</span><span className="text-slate-500 text-[10px] ml-1">saved</span></div>
                    <div className="text-[10px] text-slate-400">of {inr(g.target)} <span className="text-indigo-400 font-bold ml-1">({pct}%)</span></div>
                  </div>

                  {/* Deposit control */}
                  {depositId === g.id ? (
                    <div className="flex items-center gap-2 mb-3 animate-fade-in">
                      {[200, 500, 1000].map((amt) => (
                        <button key={amt} onClick={async () => { await updateGoalSaved(g.id, amt); setDepositId(null); }} className="flex-1 py-2 bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 rounded-xl text-xs font-bold hover:bg-indigo-600/30">+{inr(amt)}</button>
                      ))}
                      <button onClick={() => setDepositId(null)} className="p-2 text-slate-400 hover:text-white"><X size={14} /></button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between border-t border-white/5 pt-3 text-[10px] text-slate-400">
                      <div className="flex gap-2"><span>{inr(g.weeklyTarget)}/week</span></div>
                      <div className="flex gap-3">
                        <button onClick={() => setDepositId(g.id)} className="text-emerald-400 font-bold hover:underline flex items-center gap-0.5"><Plus size={11} /> Add savings</button>
                        <button onClick={() => setExpandedId(expanded ? null : g.id)} className="text-indigo-400 font-bold hover:underline">{expanded ? '▲ Hide' : '▼ History'}</button>
                      </div>
                    </div>
                  )}

                  {expanded && (
                    <div className="mt-4 pt-4 border-t border-white/5 space-y-3 animate-fade-in">
                      <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Weekly contributions</h3>
                      <div className="h-[110px] w-full text-[9px] -ml-4 pr-1">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={history(g.saved, g.id)}>
                            <XAxis dataKey="name" stroke="#475569" />
                            <YAxis stroke="#475569" />
                            <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} content={({ active, payload }: any) => active && payload?.length ? (
                              <div className="bg-slate-900 border border-white/10 p-2 rounded-lg text-xs"><p className="text-slate-400">Added</p><p className="font-extrabold text-white mt-0.5">{inr(payload[0].value)}</p></div>
                            ) : null} />
                            <Bar dataKey="amount" fill="#6366F1" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                      <div className="flex justify-end">
                        <button onClick={() => deleteGoal(g.id)} className="text-rose-500 text-[10px] font-bold flex items-center gap-1 hover:underline"><Trash2 size={12} /> Delete goal</button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="absolute inset-0" onClick={() => !creating && setIsAddOpen(false)} />
          <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-t-3xl rounded-b-xl shadow-2xl p-6 z-10">
            {creating && (
              <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 z-20 rounded-t-3xl rounded-b-xl">
                <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center mb-6 border border-indigo-500/20"><Bot className="text-indigo-400 animate-spin" size={24} /></div>
                <h3 className="text-base font-bold text-white mb-4">Setting up your goal</h3>
                <div className="w-full max-w-xs space-y-3 text-xs">
                  {[{ n: 1, t: 'Planning your savings path…' }, { n: 2, t: 'Setting a weekly target…' }, { n: 3, t: 'Goal is live & monitored!' }].map((s) => (
                    <div key={s.n} className="flex items-center gap-2">
                      <span className={`w-4 h-4 rounded-full flex items-center justify-center ${createStep >= s.n ? 'bg-indigo-500' : 'bg-slate-700'}`}>{createStep > s.n ? <Check size={10} className="text-white" /> : createStep === s.n ? <Loader2 size={10} className="text-white animate-spin" /> : null}</span>
                      <span className={createStep >= s.n ? 'text-slate-200' : 'text-slate-500'}>{s.t}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-white">Create New Goal</h2>
              <button onClick={() => setIsAddOpen(false)} className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white"><X size={16} /></button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium">Pick an icon</label>
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                  {EMOJIS.map((em) => (
                    <button key={em} type="button" onClick={() => setEmoji(em)} className={`text-xl p-2 rounded-xl border shrink-0 transition-all ${emoji === em ? 'bg-indigo-600/30 border-indigo-500 scale-110' : 'bg-slate-950 border-white/5'}`}>{em}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-1"><label className="text-xs text-slate-400 font-medium">Goal name</label><input required value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Goa Trip, New Laptop" className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-indigo-500" /></div>
              <div className="space-y-1"><label className="text-xs text-slate-400 font-medium">Target amount (₹)</label><input required type="number" value={target} onChange={(e) => { setTarget(e.target.value); calcWeekly(parseFloat(e.target.value), targetDate); }} placeholder="15000" className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-indigo-500" /></div>
              <div className="space-y-1"><label className="text-xs text-slate-400 font-medium">Target date</label><input required type="date" value={targetDate} onChange={(e) => { setTargetDate(e.target.value); calcWeekly(parseFloat(target), e.target.value); }} className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-indigo-500" /></div>
              <div className="space-y-1"><label className="text-xs text-slate-400 font-medium flex justify-between"><span>Weekly contribution (₹)</span><span className="text-[9px] text-slate-500 italic">auto-suggested</span></label><input required type="number" value={weeklyTarget} onChange={(e) => setWeeklyTarget(e.target.value)} placeholder="1500" className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 px-4 text-indigo-400 font-bold text-sm focus:outline-none focus:border-indigo-500" /></div>
              <div className="flex items-center justify-between bg-slate-950/50 p-3 rounded-xl border border-white/5">
                <div className="flex items-center gap-2"><Bot className="text-indigo-400" size={16} /><div className="text-left"><p className="text-xs text-white font-medium">Agent monitoring</p><p className="text-[9px] text-slate-500">Auto-adjusts if you overspend</p></div></div>
                <button type="button" onClick={() => setMonitor(!monitor)} className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${monitor ? 'bg-indigo-500' : 'bg-slate-700'}`}><div className={`bg-white w-4 h-4 rounded-full transition-transform ${monitor ? 'translate-x-4' : ''}`} /></button>
              </div>
              <button type="submit" className="w-full py-3 bg-indigo-gradient text-white rounded-full font-semibold text-sm shadow-indigo-glow flex items-center justify-center gap-2">Create Goal <ArrowRight size={14} /></button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
