import React, { useState } from 'react';
import { X, Sparkles, Loader2, Check } from 'lucide-react';
import { useTransactionsStore, useAgentStore } from '../stores/useFinanceStore';
import { catMeta, inr } from '../lib/constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'income' | 'expense';
}

const EXPENSE_CATS = ['Food', 'Groceries', 'Transport', 'Travel', 'Studies', 'Entertainment', 'Sports', 'Shopping', 'Subscriptions', 'Fitness', 'Other'];
const INCOME_CATS = ['Salary', 'Allowance', 'Freelance', 'Gift', 'Other'];

function autoCategorize(desc: string, type: 'income' | 'expense'): string {
  if (type === 'income') return 'Salary';
  const t = desc.toLowerCase();
  const has = (...w: string[]) => w.some((x) => t.includes(x));
  if (has('zomato', 'swiggy', 'lunch', 'dinner', 'food', 'coffee', 'tea', 'canteen', 'mess', 'cafe', 'burger', 'pizza')) return 'Food';
  if (has('grocery', 'groceries', 'instamart', 'bigbasket', 'blinkit', 'milk', 'vegetable')) return 'Groceries';
  if (has('uber', 'ola', 'auto', 'cab', 'metro', 'bus', 'train', 'petrol', 'fuel')) return 'Transport';
  if (has('flight', 'trip', 'hostel', 'hotel', 'irctc', 'travel', 'goa', 'vacation')) return 'Travel';
  if (has('book', 'course', 'exam', 'tuition', 'stationery', 'lab', 'print')) return 'Studies';
  if (has('spotify', 'netflix', 'prime', 'youtube', 'icloud', 'subscription')) return 'Subscriptions';
  if (has('turf', 'cricket', 'football', 'badminton', 'match', 'sports')) return 'Sports';
  if (has('gym', 'protein', 'yoga', 'fitness', 'workout')) return 'Fitness';
  if (has('movie', 'concert', 'game', 'gaming', 'party', 'bowling')) return 'Entertainment';
  if (has('shoe', 'hoodie', 'shirt', 'headphone', 'amazon', 'flipkart', 'myntra', 'shopping')) return 'Shopping';
  return 'Other';
}

export default function AddTransactionModal({ isOpen, onClose, initialType = 'expense' }: Props) {
  const [type, setType] = useState<'income' | 'expense'>(initialType);
  const [category, setCategory] = useState(initialType === 'expense' ? 'Food' : 'Salary');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [letAgentCategorize, setLetAgentCategorize] = useState(true);
  const [step, setStep] = useState(0); // 0 idle, 1 understanding, 2 saving, 3 done
  const [error, setError] = useState('');

  const { addTransaction } = useTransactionsStore();
  const { setCurrentNotification } = useAgentStore();

  if (!isOpen) return null;

  const switchType = (t: 'income' | 'expense') => { setType(t); setCategory(t === 'expense' ? 'Food' : 'Salary'); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) { setError('Enter a valid amount.'); return; }
    setError('');
    setStep(1);
    const finalCategory = letAgentCategorize ? autoCategorize(description, type) : category;
    await new Promise((r) => setTimeout(r, 450));
    setStep(2);
    try {
      const res = await addTransaction({
        type, category: finalCategory,
        amount: parseFloat(amount),
        description: description || (type === 'income' ? 'Income' : 'Expense'),
      });
      setStep(3);
      await new Promise((r) => setTimeout(r, 450));
      if (type === 'income' && res?.allocation?.pool > 0) {
        setCurrentNotification({
          emoji: '🤖', title: 'Savings allocated',
          message: `I set aside ${inr(res.allocation.pool)} across your goals from this income.`,
        });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save.');
      setStep(0);
    }
  };

  const cats = type === 'expense' ? EXPENSE_CATS : INCOME_CATS;
  const isBusy = step > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
      {!isBusy && <div className="absolute inset-0" onClick={onClose} />}
      <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-t-3xl rounded-b-xl shadow-2xl p-6 z-10">

        {/* Syncing overlay (human-readable, no DB commands) */}
        {isBusy && (
          <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 z-20 rounded-t-3xl rounded-b-xl">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-6 border border-indigo-500/20">
              <Sparkles className="text-indigo-400 animate-pulse" size={24} />
            </div>
            <h3 className="text-base font-bold text-white mb-4">FinAgent is on it</h3>
            <div className="w-full max-w-xs space-y-3 text-xs">
              {[
                { n: 1, on: 'Understanding your entry…', done: 'Understood your entry' },
                { n: 2, on: 'Saving & categorising…', done: 'Saved and categorised' },
                { n: 3, on: 'Updating your dashboard…', done: 'All set!' },
              ].map((s) => (
                <div key={s.n} className="flex items-center gap-2">
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center ${step >= s.n ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                    {step > s.n ? <Check size={10} className="text-white" /> : step === s.n ? <Loader2 size={10} className="text-white animate-spin" /> : null}
                  </span>
                  <span className={step >= s.n ? 'text-slate-200' : 'text-slate-500'}>{step > s.n ? s.done : s.on}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-5">
          <h2 className="text-lg font-bold text-white">{type === 'expense' ? 'Add Expense' : 'Add Income'}</h2>
          <button onClick={onClose} className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Type toggle */}
          <div className="flex bg-slate-950 p-1 rounded-full border border-white/5">
            <button type="button" onClick={() => switchType('expense')} className={`flex-1 py-1.5 rounded-full text-xs font-semibold transition-all ${type === 'expense' ? 'bg-rose-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>Expense</button>
            <button type="button" onClick={() => switchType('income')} className={`flex-1 py-1.5 rounded-full text-xs font-semibold transition-all ${type === 'income' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>Income</button>
          </div>

          {error && <p className="text-[11px] text-rose-400 font-semibold text-center">{error}</p>}

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">₹</span>
              <input type="number" required value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0"
                className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white text-lg font-bold focus:outline-none focus:border-indigo-500" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder={type === 'expense' ? 'e.g. Zomato dinner, Uber to campus' : 'e.g. Monthly stipend, freelance gig'}
              className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-indigo-500" />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs text-slate-400 font-medium">Category</label>
              {letAgentCategorize && type === 'expense' && (
                <span className="text-[10px] text-indigo-400 flex items-center gap-0.5"><Sparkles size={10} /> Agent will auto-categorise</span>
              )}
            </div>
            <select value={category} onChange={(e) => setCategory(e.target.value)} disabled={letAgentCategorize && type === 'expense'}
              className={`w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-indigo-500 ${letAgentCategorize && type === 'expense' ? 'opacity-40' : ''}`}>
              {cats.map((c) => <option key={c} value={c}>{catMeta(c).emoji} {c}</option>)}
            </select>
          </div>

          {type === 'expense' && (
            <div className="flex items-center justify-between bg-slate-950/50 p-3 rounded-xl border border-white/5">
              <div className="flex items-center gap-2">
                <Sparkles className="text-indigo-400" size={16} />
                <div className="text-left">
                  <p className="text-xs text-white font-medium">Let Agent categorise</p>
                  <p className="text-[9px] text-slate-500">Reads your note and picks the category</p>
                </div>
              </div>
              <button type="button" onClick={() => setLetAgentCategorize((v) => !v)} className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${letAgentCategorize ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                <div className={`bg-white w-4 h-4 rounded-full shadow transition-transform ${letAgentCategorize ? 'translate-x-4' : ''}`} />
              </button>
            </div>
          )}

          <button type="submit" className="w-full py-3 bg-indigo-gradient hover:from-indigo-600 hover:to-violet-700 text-white rounded-full font-semibold text-sm shadow-indigo-glow transition-all">
            {type === 'expense' ? 'Log Expense' : 'Log Income'}
          </button>
        </form>
      </div>
    </div>
  );
}
