import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Bot, Sparkles, TrendingUp, DollarSign, Wallet, PiggyBank, ChevronRight, X } from 'lucide-react';
import { useUserStore, useInsightsStore, useAgentStore } from '../stores/useFinanceStore';
import type { AgentActivityItem } from '../stores/useFinanceStore';
import AddTransactionModal from '../components/AddTransactionModal';
import ActivityLog from '../components/ActivityLog';

export default function Home() {
  const navigate = useNavigate();
  const { name, monthlyIncome } = useUserStore();
  const { categoryTotals, totalSpent, budgetRemaining } = useInsightsStore();
  const { activityLog } = useAgentStore();

  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [addTxType, setAddTxType] = useState<'income' | 'expense'>('expense');
  const [isLogOpen, setIsLogOpen] = useState(false);

  // Detail Modal for Agent Action Reasoning
  const [selectedAction, setSelectedAction] = useState<AgentActivityItem | null>(null);

  // Hardcoded budgets for breakdown
  const budgets = {
    Food: 2000,
    Transport: 600,
    Studies: 1000,
    Entertainment: 600,
    Subscriptions: 500,
  };

  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'Food': return '🍔';
      case 'Transport': return '🚌';
      case 'Studies': return '📚';
      case 'Entertainment': return '🎮';
      case 'Subscriptions': return '📱';
      default: return '💳';
    }
  };

  // Calculations
  const savedAmount = 2500; // Mock goal savings
  const spentPct = Math.round((totalSpent / 8000) * 100);
  const strokeDashoffset = 251.2 - (251.2 * Math.min(spentPct, 100)) / 100;

  return (
    <div className="min-h-screen pb-20 px-4 pt-4 max-w-lg mx-auto bg-background custom-scrollbar overflow-y-auto">
      {/* Top Header */}
      <div className="flex justify-between items-center mb-4">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">Hey, {name} 👋</h1>
          <p className="text-xs text-slate-400 font-medium">June 2026</p>
        </div>
        
        {/* Bell Icon with Badge */}
        <button
          onClick={() => setIsLogOpen(true)}
          className="relative p-2.5 bg-slate-800/80 hover:bg-slate-800 rounded-full border border-white/5 transition-all text-slate-300 hover:text-white"
        >
          <Bell size={20} />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full border border-slate-900" />
        </button>
      </div>

      {/* Agent Status Chip */}
      <div className="bg-indigo-600/90 text-white rounded-full p-2 px-4 flex items-center gap-2 mb-5 border border-indigo-400/20 shadow-indigo-glow/20 shadow-md">
        <Bot size={16} className="text-indigo-200 shrink-0" />
        <span className="text-xs font-semibold tracking-wide">
          Agent active — you're on track this month ✓
        </span>
        <span className="text-[9px] ml-auto font-mono text-indigo-200 bg-indigo-700/60 px-2 py-0.5 rounded-full border border-indigo-500/20">
          Atlas MCP
        </span>
      </div>

      {/* Monthly Overview Card */}
      <div className="glass-card rounded-2xl p-5 mb-5 flex justify-between items-center relative overflow-hidden animate-fade-in">
        <div className="space-y-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">This Month</p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-3">
            <div>
              <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                <DollarSign size={10} className="text-emerald-400" /> Income
              </p>
              <p className="text-base font-bold text-emerald-400">₹{monthlyIncome.toLocaleString()}</p>
            </div>
            
            <div>
              <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                <Wallet size={10} className="text-slate-400" /> Spent
              </p>
              <p className="text-base font-bold text-white">₹{totalSpent.toLocaleString()}</p>
            </div>

            <div>
              <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                <PiggyBank size={10} className="text-emerald-400" /> Saved
              </p>
              <p className="text-base font-bold text-emerald-400">₹{savedAmount.toLocaleString()}</p>
            </div>

            <div>
              <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                <TrendingUp size={10} className="text-amber-400" /> Remaining
              </p>
              <p className="text-base font-bold text-amber-500">₹{budgetRemaining.toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Circular Progress Ring */}
        <div className="relative w-24 h-24 flex items-center justify-center shrink-0">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="40"
              className="stroke-slate-800"
              strokeWidth="8"
              fill="transparent"
            />
            <circle
              cx="50"
              cy="50"
              r="40"
              className="stroke-indigo-500 transition-all duration-500"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray="251.2"
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-base font-extrabold text-white">{spentPct}%</span>
            <span className="text-[8px] text-slate-500 uppercase font-semibold tracking-wider">Used</span>
          </div>
        </div>
      </div>

      {/* Budget Breakdown Header */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-sm font-bold text-slate-200 tracking-wide uppercase">Budget Breakdown</h2>
        <span className="text-[9px] bg-slate-800/80 text-slate-400 border border-white/5 px-2 py-0.5 rounded-full font-mono">
          via MongoDB Atlas
        </span>
      </div>

      {/* Horizontally Scrollable Categories */}
      <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar -mx-4 px-4 snap-x">
        {Object.entries(budgets).map(([cat, limit]) => {
          const spent = categoryTotals[cat as keyof typeof categoryTotals] || 0;
          const pct = Math.round((spent / limit) * 100);
          const isOver = spent > limit;

          return (
            <div
              key={cat}
              className={`w-[140px] shrink-0 rounded-2xl p-3.5 snap-start glass-card transition-all relative ${
                isOver ? 'border-rose-500/40 shadow-rose-glow animate-glow-pulse' : 'hover:border-white/10'
              }`}
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-xl">{getCategoryIcon(cat)}</span>
                {isOver && (
                  <span className="text-[9px] font-bold text-rose-500 bg-rose-950/60 border border-rose-500/20 px-1.5 py-0.5 rounded-full uppercase animate-pulse">
                    Over!
                  </span>
                )}
              </div>
              
              <h3 className="text-xs font-bold text-slate-200 mb-1">{cat}</h3>
              <p className="text-[11px] font-mono text-slate-400 mb-2">
                ₹{spent.toLocaleString()} <span className="text-[10px] text-slate-600">/ ₹{limit}</span>
              </p>

              {/* Progress bar */}
              <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-white/5">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    isOver ? 'bg-rose-500' : pct > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}
                  style={{ width: `${Math.min(pct, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions Row */}
      <div className="flex gap-2.5 overflow-x-auto pb-4 mb-4 no-scrollbar -mx-4 px-4">
        <button
          onClick={() => {
            setAddTxType('expense');
            setIsAddTxOpen(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-4 py-2 text-xs font-semibold whitespace-nowrap shadow-indigo-glow/20 shadow-md flex items-center gap-1 transition-all"
        >
          <Sparkles size={12} className="text-indigo-200" />
          <span>+ Add Expense</span>
        </button>

        <button
          onClick={() => {
            setAddTxType('income');
            setIsAddTxOpen(true);
          }}
          className="bg-slate-800 hover:bg-slate-700 border border-white/10 text-white rounded-full px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1"
        >
          <span>+ Add Income</span>
        </button>

        <button
          onClick={() => navigate('/goals')}
          className="bg-slate-800 hover:bg-slate-700 border border-white/10 text-white rounded-full px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1"
        >
          <span>View Goals</span>
        </button>

        <button
          onClick={() => navigate('/community')}
          className="bg-slate-800 hover:bg-slate-700 border border-white/10 text-white rounded-full px-4 py-2 text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1"
        >
          <span>Challenge Friends</span>
        </button>
      </div>

      {/* Recent Agent Actions Feed */}
      <div className="glass-card rounded-2xl p-4 animate-fade-in">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-sm font-bold text-slate-200 tracking-wide uppercase flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span>Agent Activity</span>
          </h2>
          <button
            onClick={() => setIsLogOpen(true)}
            className="text-[10px] text-indigo-400 font-bold hover:underline flex items-center"
          >
            <span>Console view</span>
            <ChevronRight size={10} />
          </button>
        </div>

        {/* List of 6 items */}
        <div className="space-y-3.5">
          {activityLog.slice(0, 6).map((log) => (
            <div
              key={log.id}
              onClick={() => setSelectedAction(log)}
              className="flex items-start gap-3 p-2 hover:bg-slate-700/30 rounded-xl border border-transparent hover:border-white/5 transition-all cursor-pointer group"
            >
              <div className="w-7 h-7 rounded-full bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20 group-hover:bg-indigo-500/20 group-hover:scale-105 transition-all">
                <Bot size={14} className="text-indigo-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex justify-between items-start gap-2 mb-0.5">
                  <p className="text-xs text-slate-200 font-medium leading-normal line-clamp-2">
                    {log.description}
                  </p>
                  <span className="text-[9px] text-slate-500 font-mono shrink-0 whitespace-nowrap">
                    {log.timestamp}
                  </span>
                </div>
                <p className="text-[9px] font-mono text-slate-500 truncate bg-slate-950/60 p-1 px-1.5 rounded border border-white/5 mt-1">
                  `→ {log.mongoOperation}`
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Sliding Drawer for Activity Logs (Bell shortcut) */}
      <ActivityLog isOpen={isLogOpen} onClose={() => setIsLogOpen(false)} />

      {/* Transaction Modal popup */}
      <AddTransactionModal
        isOpen={isAddTxOpen}
        onClose={() => setIsAddTxOpen(false)}
        initialType={addTxType}
      />

      {/* Detailed Action Reasoning Modal */}
      {selectedAction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl p-5 shadow-2xl relative">
            <button
              onClick={() => setSelectedAction(null)}
              className="absolute top-4 right-4 p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X size={14} />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                <Bot size={16} className="text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Agent Action Detail</h3>
                <p className="text-[9px] text-slate-400 font-mono">Collection: {selectedAction.category}</p>
              </div>
            </div>

            <p className="text-xs text-slate-200 mb-4 bg-slate-950 p-3 rounded-xl border border-white/5 leading-relaxed">
              {selectedAction.description}
            </p>

            <h4 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 font-mono">
              MCP Pipeline Execution
            </h4>
            
            <div className="bg-slate-950 p-3 rounded-xl border border-white/5 font-mono text-[10px] space-y-2 text-indigo-300 overflow-x-auto">
              <div>
                <span className="text-slate-600">Action:</span> {selectedAction.category === 'INCOME' ? 'Income auto-allocation' : selectedAction.category === 'EXPENSE' ? 'Expense categorization' : 'Budget state trigger'}
              </div>
              <div>
                <span className="text-slate-600">Database:</span> finagent_db
              </div>
              <div className="border-t border-white/5 pt-2 text-slate-300">
                {selectedAction.mongoOperation}
              </div>
            </div>

            <button
              onClick={() => setSelectedAction(null)}
              className="w-full mt-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-full shadow transition-all"
            >
              Close Details
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
