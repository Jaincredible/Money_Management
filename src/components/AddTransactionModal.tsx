import React, { useState, useEffect } from 'react';
import { X, Sparkles, Database } from 'lucide-react';
import { useTransactionsStore, useInsightsStore, useUserStore, useAgentStore } from '../stores/useFinanceStore';

interface AddTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'income' | 'expense';
}

export default function AddTransactionModal({ isOpen, onClose, initialType = 'expense' }: AddTransactionModalProps) {
  const [type, setType] = useState<'income' | 'expense'>(initialType);
  const [category, setCategory] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [letAgentCategorize, setLetAgentCategorize] = useState<boolean>(true);
  
  // Loading flow state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStep, setSubmitStep] = useState(0); // 0: none, 1: parsing, 2: writing, 3: completed

  const { addTransaction } = useTransactionsStore();
  const { recalculateInsights } = useInsightsStore();
  const { addXp } = useUserStore();
  const { addActivityLog } = useAgentStore();

  useEffect(() => {
    setType(initialType);
    setCategory(initialType === 'expense' ? 'Food' : 'Salary');
    setAmount('');
    setDescription('');
  }, [initialType, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) return;

    setIsSubmitting(true);
    setSubmitStep(1);

    // Step 1: Simulated AI Parsing (500ms)
    setTimeout(() => {
      setSubmitStep(2);
      
      // Step 2: Simulated MongoDB Write (500ms)
      setTimeout(() => {
        setSubmitStep(3);
        
        // Step 3: Execution and store update (500ms)
        setTimeout(() => {
          const finalCategory = letAgentCategorize
            ? autoCategorize(description, type)
            : category;

          // Add to transactions
          addTransaction({
            type,
            category: finalCategory as any,
            amount: parseFloat(amount),
            description: description || (type === 'income' ? 'Received Funds' : 'Expense'),
          });

          // Trigger state changes
          // Use setTimeout to ensure transactions are updated
          setTimeout(() => {
            const currentTxs = useTransactionsStore.getState().transactions;
            recalculateInsights(currentTxs);
          }, 0);

          // Add XP
          addXp(15);

          // Add activity log
          addActivityLog({
            category: type === 'income' ? 'INCOME' : 'EXPENSE',
            description: `${type === 'income' ? 'Income' : 'Expense'} of ₹${amount} logged under ${finalCategory}${letAgentCategorize ? ' (auto-categorized by AI)' : ''}.`,
            mongoOperation: `db.transactions.insertOne({ type: "${type}", category: "${finalCategory}", amount: ${amount}, description: "${description}" })`
          });

          setIsSubmitting(false);
          setSubmitStep(0);
          onClose();
        }, 500);
      }, 500);
    }, 500);
  };

  // Simple auto-categorization helper based on keywords
  const autoCategorize = (desc: string, txType: 'income' | 'expense'): string => {
    if (txType === 'income') return 'Salary';
    const text = desc.toLowerCase();
    if (text.includes('burger') || text.includes('zomato') || text.includes('food') || text.includes('lunch') || text.includes('dinner') || text.includes('swiggy') || text.includes('tea') || text.includes('coffee') || text.includes('canteen')) {
      return 'Food';
    }
    if (text.includes('uber') || text.includes('ola') || text.includes('auto') || text.includes('cab') || text.includes('metro') || text.includes('train') || text.includes('bus') || text.includes('petrol')) {
      return 'Transport';
    }
    if (text.includes('book') || text.includes('copy') || text.includes('studies') || text.includes('exam') || text.includes('course') || text.includes('tuition')) {
      return 'Studies';
    }
    if (text.includes('movie') || text.includes('netflix') || text.includes('spotify') || text.includes('youtube') || text.includes('prime')) {
      return text.includes('spotify') || text.includes('netflix') ? 'Subscriptions' : 'Entertainment';
    }
    if (text.includes('game') || text.includes('arcade') || text.includes('concert') || text.includes('party')) {
      return 'Entertainment';
    }
    return category; // fallback to selected
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
      {/* Click outside to close (only if not submitting) */}
      {!isSubmitting && (
        <div className="absolute inset-0" onClick={onClose} />
      )}

      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-t-3xl rounded-b-xl shadow-2xl p-6 overflow-hidden z-10 transition-transform">
        
        {/* Loading overlay */}
        {isSubmitting && (
          <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 z-20">
            <div className="w-16 h-16 rounded-full bg-indigo-500/10 flex items-center justify-center mb-6 animate-pulse border border-indigo-500/20">
              <Database className="text-indigo-400 animate-bounce" size={24} />
            </div>
            
            <h3 className="text-lg font-bold text-white mb-4">FinAgent Syncing</h3>
            
            <div className="w-full max-w-xs space-y-3 font-mono text-xs">
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${submitStep >= 1 ? 'bg-indigo-400' : 'bg-slate-700'}`} />
                <span className={submitStep >= 1 ? 'text-indigo-300' : 'text-slate-500'}>
                  {submitStep === 1 ? '🤖 Agent parsing intent...' : '✓ Intent parsed'}
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${submitStep >= 2 ? 'bg-amber-400' : 'bg-slate-700'}`} />
                <span className={submitStep >= 2 ? 'text-amber-300' : 'text-slate-500'}>
                  {submitStep === 2 ? '⚡ MongoDB Atlas MCP: db.transactions.insertOne()' : submitStep > 2 ? '✓ Stored in MongoDB' : 'db.transactions.insertOne()'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${submitStep >= 3 ? 'bg-emerald-400 animate-pulse' : 'bg-slate-700'}`} />
                <span className={submitStep >= 3 ? 'text-emerald-300' : 'text-slate-500'}>
                  {submitStep === 3 ? '✓ Action Complete. Ready!' : 'Done'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span>{type === 'expense' ? 'Add Expense' : 'Add Income'}</span>
            <span className="text-[10px] bg-slate-800 text-slate-400 border border-white/5 px-2 py-0.5 rounded-full font-mono font-medium">
              MongoDB Atlas MCP
            </span>
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Toggle Type */}
          <div className="flex bg-slate-950 p-1 rounded-full border border-white/5">
            <button
              type="button"
              onClick={() => {
                setType('expense');
                setCategory('Food');
              }}
              className={`flex-1 py-1.5 rounded-full text-xs font-semibold transition-all ${
                type === 'expense' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Expense
            </button>
            <button
              type="button"
              onClick={() => {
                setType('income');
                setCategory('Salary');
              }}
              className={`flex-1 py-1.5 rounded-full text-xs font-semibold transition-all ${
                type === 'income' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Income
            </button>
          </div>

          {/* Amount input */}
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">₹</span>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white text-lg font-bold focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>

          {/* Description input */}
          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">Description</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={type === 'expense' ? 'e.g., Dinner at canteen, uber fare' : 'e.g., Stipend, cash from dad'}
              className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          {/* Category Dropdown (disabled if letting agent categorize) */}
          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs text-slate-400 font-medium">Category</label>
              {letAgentCategorize && (
                <span className="text-[10px] text-indigo-400 flex items-center gap-0.5">
                  <Sparkles size={10} />
                  Agent will auto-categorize
                </span>
              )}
            </div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              disabled={letAgentCategorize}
              className={`w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors ${
                letAgentCategorize ? 'opacity-40 cursor-not-allowed' : ''
              }`}
            >
              {type === 'expense' ? (
                <>
                  <option value="Food">Food 🍔</option>
                  <option value="Transport">Transport 🚌</option>
                  <option value="Studies">Studies 📚</option>
                  <option value="Entertainment">Entertainment 🎮</option>
                  <option value="Subscriptions">Subscriptions 📱</option>
                  <option value="Other">Other 💳</option>
                </>
              ) : (
                <>
                  <option value="Salary">Stipend/Salary 💰</option>
                  <option value="Other">Other 💸</option>
                </>
              )}
            </select>
          </div>

          {/* Agent toggle */}
          <div className="flex items-center justify-between bg-slate-950/50 p-3 rounded-xl border border-white/5">
            <div className="flex items-center gap-2">
              <Sparkles className="text-indigo-400" size={16} />
              <div className="text-left">
                <p className="text-xs text-white font-medium">Let Agent Categorize</p>
                <p className="text-[9px] text-slate-500">Gemini parses description and auto-assigns</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setLetAgentCategorize(!letAgentCategorize)}
              className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${
                letAgentCategorize ? 'bg-indigo-500' : 'bg-slate-700'
              }`}
            >
              <div className={`bg-white w-4 h-4 rounded-full shadow transition-transform ${
                letAgentCategorize ? 'translate-x-4' : 'translate-x-0'
              }`} />
            </button>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full py-3 bg-indigo-gradient hover:from-indigo-600 hover:to-violet-700 text-white rounded-full font-semibold text-sm shadow-indigo-glow transition-all flex items-center justify-center gap-2"
          >
            <span>Log Transaction</span>
          </button>
        </form>
      </div>
    </div>
  );
}
