import { useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { Bot, Plus, ArrowRight, X, Trash2 } from 'lucide-react';
import { useGoalsStore, useUserStore, useAgentStore } from '../stores/useFinanceStore';

export default function Goals() {
  const { goals, addGoal, deleteGoal } = useGoalsStore();
  const { addXp } = useUserStore();
  const { addActivityLog } = useAgentStore();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [expandedGoalId, setExpandedGoalId] = useState<number | null>(null);

  // New Goal Form state
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('🏖️');
  const [target, setTarget] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [weeklyTarget, setWeeklyTarget] = useState('');
  const [agentMonitors, setAgentMonitors] = useState(true);

  // Loading animation state for creation
  const [isCreating, setIsCreating] = useState(false);
  const [createStep, setCreateStep] = useState(0);

  const emojis = ['🏖️', '💻', '🛡️', '✈️', '🚗', '🎓', '🎁', '🏠', '🚴', '👟'];

  // Mock historical contribution data for charts
  const contributionHistories = {
    1: [
      { name: 'Wk 1', amount: 1000 },
      { name: 'Wk 2', amount: 1500 },
      { name: 'Wk 3', amount: 1000 },
      { name: 'Wk 4', amount: 1000 },
      { name: 'Wk 5', amount: 1500 },
      { name: 'Wk 6', amount: 1500 },
    ],
    2: [
      { name: 'Wk 1', amount: 500 },
      { name: 'Wk 2', amount: 500 },
      { name: 'Wk 3', amount: 200 },
      { name: 'Wk 4', amount: 500 },
      { name: 'Wk 5', amount: 500 },
      { name: 'Wk 6', amount: 300 },
    ],
    3: [
      { name: 'Wk 1', amount: 800 },
      { name: 'Wk 2', amount: 800 },
      { name: 'Wk 3', amount: 1000 },
      { name: 'Wk 4', amount: 800 },
      { name: 'Wk 5', amount: 1200 },
      { name: 'Wk 6', amount: 800 },
    ]
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !target || !targetDate || !weeklyTarget) return;

    setIsCreating(true);
    setCreateStep(1);

    // Simulate Agent planning stages
    setTimeout(() => {
      setCreateStep(2);
      setTimeout(() => {
        setCreateStep(3);
        setTimeout(() => {
          setCreateStep(4);
          setTimeout(() => {
            // Add goal to state
            addGoal({
              name,
              emoji,
              target: parseFloat(target),
              saved: 0,
              weeklyTarget: parseFloat(weeklyTarget),
              startDate: new Date().toISOString().split('T')[0],
              targetDate,
              agentMonitoring: agentMonitors
            });

            // Add XP
            addXp(25);

            // Add activity log
            addActivityLog({
              category: 'GOALS',
              description: `Created savings goal: "${emoji} ${name}" with weekly target ₹${weeklyTarget}. Monitoring is active.`,
              mongoOperation: `db.goals.insertOne({ name: "${name}", emoji: "${emoji}", target: ${target}, weeklyTarget: ${weeklyTarget}, agentMonitoring: ${agentMonitors} })`
            });

            // Reset and close
            setIsCreating(false);
            setCreateStep(0);
            setIsAddOpen(false);
            setName('');
            setEmoji('🏖️');
            setTarget('');
            setTargetDate('');
            setWeeklyTarget('');
          }, 600);
        }, 600);
      }, 600);
    }, 600);
  };

  // Simple auto weekly targets helper
  const handleTargetChange = (val: string) => {
    setTarget(val);
    if (val && targetDate) {
      calculateWeekly(parseFloat(val), targetDate);
    }
  };

  const handleDateChange = (val: string) => {
    setTargetDate(val);
    if (target && val) {
      calculateWeekly(parseFloat(target), val);
    }
  };

  const calculateWeekly = (tgt: number, dt: string) => {
    const today = new Date();
    const targetDt = new Date(dt);
    const diffTime = Math.abs(targetDt.getTime() - today.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const diffWeeks = Math.ceil(diffDays / 7) || 1;
    const weekly = Math.round(tgt / diffWeeks);
    setWeeklyTarget(String(weekly));
  };

  return (
    <div className="min-h-screen pb-20 px-4 pt-4 max-w-lg mx-auto bg-background custom-scrollbar overflow-y-auto">
      
      {/* Header */}
      <div className="flex justify-between items-center mb-5">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">Your Goals</h1>
          <p className="text-xs text-slate-400 font-medium">Real-time status · MongoDB Atlas</p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-4 py-2 text-xs font-semibold shadow-indigo-glow/20 shadow-md flex items-center gap-1 transition-all"
        >
          <Plus size={14} />
          <span>New Goal</span>
        </button>
      </div>

      {/* Goal Cards list */}
      <div className="space-y-4">
        {goals.map((g) => {
          const pct = Math.round((g.saved / g.target) * 100);
          const isExpanded = expandedGoalId === g.id;
          const isBehind = g.id === 1; // Goa trip behind

          // Get chart data or fallback to mock
          const chartData = contributionHistories[g.id as keyof typeof contributionHistories] || [
            { name: 'Wk 1', amount: 200 },
            { name: 'Wk 2', amount: 300 },
          ];

          return (
            <div
              key={g.id}
              className={`glass-card rounded-2xl p-4 animate-fade-in relative transition-all duration-300 ${
                isExpanded ? 'border-indigo-500/40 ring-1 ring-indigo-500/20' : ''
              }`}
            >
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{g.emoji}</span>
                  <div>
                    <h2 className="text-sm font-extrabold text-white leading-none">{g.name}</h2>
                    <span className="text-[9px] text-slate-500 font-medium mt-1 inline-block">
                      Target date: {g.targetDate}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {g.agentMonitoring && (
                    <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2 py-0.5 rounded-full flex items-center gap-0.5 font-bold font-mono">
                      <Bot size={10} />
                      Agent Active
                    </span>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-white/5 mb-3">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    isBehind ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>

              <div className="flex justify-between items-center text-xs mb-3">
                <div>
                  <span className="text-emerald-400 font-bold">₹{g.saved.toLocaleString()}</span>
                  <span className="text-slate-500 text-[10px] ml-1">saved</span>
                </div>
                <div className="text-[10px] text-slate-400">
                  <span>of ₹{g.target.toLocaleString()}</span>
                  <span className="text-indigo-400 font-bold ml-1.5">({pct}%)</span>
                </div>
              </div>

              {/* Stats row */}
              <div className="flex items-center justify-between border-t border-white/5 pt-3 text-[10px] text-slate-400">
                <div className="flex gap-2">
                  <span>{pct}% complete</span>
                  <span className="text-slate-600">•</span>
                  <span>₹{g.weeklyTarget}/week</span>
                </div>
                
                <button
                  onClick={() => setExpandedGoalId(isExpanded ? null : g.id)}
                  className="text-indigo-400 font-bold hover:underline"
                >
                  {isExpanded ? '▲ Hide History' : '▼ View History'}
                </button>
              </div>

              {/* Accordion Expand Area */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-white/5 space-y-4 animate-fade-in">
                  <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                    Weekly Contributions (Last 6 Weeks)
                  </h3>

                  <div className="h-[120px] w-full font-mono text-[9px] -ml-4 pr-1">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={chartData}>
                        <XAxis dataKey="name" stroke="#475569" />
                        <YAxis stroke="#475569" />
                        <Tooltip
                          cursor={{ fill: 'rgba(255,255,255,0.03)' }}
                          content={({ active, payload }: any) => {
                            if (active && payload && payload.length) {
                              return (
                                <div className="bg-slate-900 border border-white/10 p-2 rounded-lg font-sans text-xs">
                                  <p className="text-slate-400 font-medium">Added:</p>
                                  <p className="font-extrabold text-white mt-0.5">₹{payload[0].value}</p>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="amount" fill="#6366F1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                    <span>Last contribution: ₹1,500 on June 2</span>
                    <div className="flex gap-3">
                      <button
                        onClick={() => deleteGoal(g.id)}
                        className="text-rose-500 font-bold flex items-center gap-1 hover:underline"
                      >
                        <Trash2 size={12} />
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Goal Modal Sheet */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="absolute inset-0" onClick={() => !isCreating && setIsAddOpen(false)} />

          <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-t-3xl rounded-b-xl shadow-2xl p-6 z-10">
            
            {/* Loading Overlay */}
            {isCreating && (
              <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 z-20">
                <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center mb-6 border border-indigo-500/20">
                  <Bot className="text-indigo-400 animate-spin" size={24} />
                </div>
                <h3 className="text-base font-bold text-white mb-4">Initializing Monitor</h3>

                <div className="w-full max-w-xs space-y-3 font-mono text-xs text-left pl-4">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${createStep >= 1 ? 'bg-indigo-400' : 'bg-slate-700'}`} />
                    <span className={createStep >= 1 ? 'text-indigo-300' : 'text-slate-500'}>
                      {createStep === 1 ? '🤖 Agent creating goal...' : '✓ Goal initialized'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${createStep >= 2 ? 'bg-indigo-400' : 'bg-slate-700'}`} />
                    <span className={createStep >= 2 ? 'text-indigo-300' : 'text-slate-500'}>
                      {createStep === 2 ? '→ MongoDB Atlas MCP: db.goals.insertOne()' : createStep > 2 ? '✓ Stored in MongoDB Atlas' : 'db.goals.insertOne()'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${createStep >= 3 ? 'bg-amber-400' : 'bg-slate-700'}`} />
                    <span className={createStep >= 3 ? 'text-amber-300' : 'text-slate-500'}>
                      {createStep === 3 ? '→ Setting up Gemini agent monitoring...' : createStep > 3 ? '✓ Agent monitoring enabled' : 'Set up monitoring'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${createStep >= 4 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-700'}`} />
                    <span className={createStep >= 4 ? 'text-emerald-300' : 'text-slate-500'}>
                      ✓ Goal live! Tracked in real-time.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Create New Goal</span>
                <span className="text-[10px] bg-slate-800 text-slate-400 border border-white/5 px-2 py-0.5 rounded-full font-mono font-medium">
                  db.goals.insertOne()
                </span>
              </h2>
              
              <button
                onClick={() => setIsAddOpen(false)}
                className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreate} className="space-y-4">
              
              {/* Emoji Picker */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium">Select Emoji</label>
                <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                  {emojis.map((em) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setEmoji(em)}
                      className={`text-xl p-2 rounded-xl border shrink-0 transition-all ${
                        emoji === em
                          ? 'bg-indigo-600/30 border-indigo-500 scale-110'
                          : 'bg-slate-950 border-white/5 hover:border-slate-800'
                      }`}
                    >
                      {em}
                    </button>
                  ))}
                </div>
              </div>

              {/* Goal Name */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Goal Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g., Goa Trip, Semester Fee, Headies"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Target Amount */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Target Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={target}
                  onChange={(e) => handleTargetChange(e.target.value)}
                  placeholder="₹0"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Target Date */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Target Date</label>
                <input
                  type="date"
                  required
                  value={targetDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Weekly Contribution */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium flex justify-between">
                  <span>Weekly Contribution Target (₹)</span>
                  <span className="text-[9px] text-slate-500 italic">Auto-suggested</span>
                </label>
                <input
                  type="number"
                  required
                  value={weeklyTarget}
                  onChange={(e) => setWeeklyTarget(e.target.value)}
                  placeholder="₹0"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors font-bold text-indigo-400"
                />
              </div>

              {/* Toggle Monitor */}
              <div className="flex items-center justify-between bg-slate-950/50 p-3 rounded-xl border border-white/5">
                <div className="flex items-center gap-2">
                  <Bot className="text-indigo-400" size={16} />
                  <div className="text-left">
                    <p className="text-xs text-white font-medium">Agent Autonomous Monitoring</p>
                    <p className="text-[9px] text-slate-500">Gemini will adjust timeline if you overspend</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAgentMonitors(!agentMonitors)}
                  className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${
                    agentMonitors ? 'bg-indigo-500' : 'bg-slate-700'
                  }`}
                >
                  <div className={`bg-white w-4 h-4 rounded-full shadow transition-transform ${
                    agentMonitors ? 'translate-x-4' : 'translate-x-0'
                  }`} />
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-3 bg-indigo-gradient hover:from-indigo-600 hover:to-violet-700 text-white rounded-full font-semibold text-sm shadow-indigo-glow transition-all flex items-center justify-center gap-2"
              >
                <span>Create Goal</span>
                <ArrowRight size={14} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
