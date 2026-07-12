import React, { useState } from 'react';
import { X, Sparkles, Loader2, Check, ArrowDownCircle, ArrowUpCircle, Users } from 'lucide-react';
import { useTransactionsStore, useAgentStore } from '../stores/useFinanceStore';
import { catMeta, inr } from '../lib/constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialType?: 'income' | 'expense';
}

const EXPENSE_CATS = ['Food', 'Groceries', 'Transport', 'Travel', 'Studies', 'Entertainment', 'Sports', 'Shopping', 'Subscriptions', 'Fitness', 'Other'];
const INCOME_CATS = ['Salary', 'Allowance', 'Freelance', 'Gift', 'Other'];

function autoCategorize(desc: string): string {
  const t = desc.toLowerCase();
  const has = (...w: string[]) => w.some((x) => t.includes(x));
  if (has('zomato', 'swiggy', 'lunch', 'dinner', 'food', 'coffee', 'tea', 'canteen', 'mess', 'cafe', 'burger', 'pizza')) return 'Food';
  if (has('grocery', 'groceries', 'instamart', 'blinkit', 'zepto', 'bigbasket', 'milk', 'vegetable')) return 'Groceries';
  if (has('uber', 'ola', 'auto', 'cab', 'metro', 'bus', 'train', 'petrol', 'fuel', 'rapido')) return 'Transport';
  if (has('flight', 'trip', 'hostel', 'hotel', 'irctc', 'travel', 'goa', 'vacation', 'redbus')) return 'Travel';
  if (has('book', 'course', 'exam', 'tuition', 'stationery', 'lab', 'print', 'udemy')) return 'Studies';
  if (has('spotify', 'netflix', 'prime', 'youtube', 'icloud', 'subscription')) return 'Subscriptions';
  if (has('turf', 'cricket', 'football', 'badminton', 'match', 'sports', 'decathlon')) return 'Sports';
  if (has('gym', 'protein', 'yoga', 'fitness', 'workout', 'cult')) return 'Fitness';
  if (has('movie', 'concert', 'game', 'gaming', 'party', 'bowling', 'bookmyshow')) return 'Entertainment';
  if (has('shoe', 'hoodie', 'shirt', 'headphone', 'amazon', 'flipkart', 'myntra', 'shopping')) return 'Shopping';
  return 'Other';
}

export default function AddTransactionModal({ isOpen, onClose, initialType = 'expense' }: Props) {
  const type = initialType; // dedicated modal — no in-modal switching
  const isExpense = type === 'expense';
  const [category, setCategory] = useState(isExpense ? 'Food' : 'Salary');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [letAgentCategorize, setLetAgentCategorize] = useState(isExpense);
  const [splitOn, setSplitOn] = useState(false);
  const [splitFriends, setSplitFriends] = useState('');
  const [step, setStep] = useState(0);
  const [error, setError] = useState('');

  const friends = splitFriends.split(',').map((s) => s.trim()).filter(Boolean);
  const total = parseFloat(amount) || 0;
  const yourShare = splitOn && friends.length ? Math.round(total / (friends.length + 1)) : total;

  const { addTransaction } = useTransactionsStore();
  const { setCurrentNotification } = useAgentStore();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0) { setError('Enter a valid amount.'); return; }
    setError('');
    setStep(1);
    const finalCategory = isExpense && letAgentCategorize ? autoCategorize(description) : category;
    await new Promise((r) => setTimeout(r, 450));
    setStep(2);
    try {
      const payload: any = {
        type, category: finalCategory,
        amount: parseFloat(amount),
        description: description || (isExpense ? 'Expense' : 'Income'),
      };
      if (isExpense && splitOn && friends.length) payload.split = { friends };
      const res = await addTransaction(payload);
      setStep(3);
      await new Promise((r) => setTimeout(r, 450));
      if (!isExpense && res?.allocation?.pool > 0) {
        setCurrentNotification({ emoji: '🤖', title: 'Savings allocated', message: `I set aside ${inr(res.allocation.pool)} across your goals from this income.` });
      } else if (isExpense && payload.split) {
        setCurrentNotification({ emoji: '🧾', title: 'Split recorded', message: `Your share is ${inr(yourShare)}. Collecting ${inr(total - yourShare)} from ${friends.join(', ')}.` });
      } else if (isExpense && res?.roundUp > 0) {
        setCurrentNotification({ emoji: '🪙', title: 'Spare change stashed', message: `Rounded up ${inr(res.roundUp)} into your spare-change pot.` });
      }
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save.');
      setStep(0);
    }
  };

  const cats = isExpense ? EXPENSE_CATS : INCOME_CATS;
  const isBusy = step > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm animate-fade-in p-4">
      {!isBusy && <div className="absolute inset-0" onClick={onClose} />}
      <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-t-3xl rounded-b-xl shadow-2xl p-6 z-10">

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
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <span className={`w-8 h-8 rounded-full flex items-center justify-center ${isExpense ? 'bg-rose-500/15 text-rose-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
              {isExpense ? <ArrowUpCircle size={18} /> : <ArrowDownCircle size={18} />}
            </span>
            {isExpense ? 'Add Expense' : 'Add Income'}
          </h2>
          <button onClick={onClose} className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white"><X size={16} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && <p className="text-[11px] text-rose-400 font-semibold text-center">{error}</p>}

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">Amount (₹)</label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-lg">₹</span>
              <input type="number" required autoFocus value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0"
                className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 pl-8 pr-4 text-white text-lg font-bold focus:outline-none focus:border-indigo-500" />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs text-slate-400 font-medium">Description</label>
            <input type="text" value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder={isExpense ? 'e.g. Zomato dinner, Uber to campus' : 'e.g. Monthly stipend, freelance gig'}
              className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-indigo-500" />
          </div>

          <div className="space-y-1">
            <div className="flex justify-between items-center">
              <label className="text-xs text-slate-400 font-medium">Category</label>
              {isExpense && letAgentCategorize && (
                <span className="text-[10px] text-indigo-400 flex items-center gap-0.5"><Sparkles size={10} /> Agent will auto-categorise</span>
              )}
            </div>
            <select value={category} onChange={(e) => setCategory(e.target.value)} disabled={isExpense && letAgentCategorize}
              className={`w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-indigo-500 ${isExpense && letAgentCategorize ? 'opacity-40' : ''}`}>
              {cats.map((c) => <option key={c} value={c}>{catMeta(c).emoji} {c}</option>)}
            </select>
          </div>

          {isExpense && (
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

          {isExpense && (
            <div className="bg-slate-950/50 p-3 rounded-xl border border-white/5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="text-indigo-400" size={16} />
                  <div className="text-left">
                    <p className="text-xs text-white font-medium">Split with friends</p>
                    <p className="text-[9px] text-slate-500">You only carry your share</p>
                  </div>
                </div>
                <button type="button" onClick={() => setSplitOn((v) => !v)} className={`w-10 h-6 flex items-center rounded-full p-1 transition-colors ${splitOn ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                  <div className={`bg-white w-4 h-4 rounded-full shadow transition-transform ${splitOn ? 'translate-x-4' : ''}`} />
                </button>
              </div>
              {splitOn && (
                <div className="space-y-2 animate-fade-in">
                  <input type="text" value={splitFriends} onChange={(e) => setSplitFriends(e.target.value)} placeholder="Friends (comma-separated): Priya, Rahul"
                    className="w-full bg-slate-900 border border-white/10 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-indigo-500" />
                  {friends.length > 0 && total > 0 && (
                    <p className="text-[10px] text-slate-400">Split {friends.length + 1} ways → your share <span className="text-indigo-300 font-bold">{inr(yourShare)}</span>, collecting {inr(total - yourShare)}.</p>
                  )}
                </div>
              )}
            </div>
          )}

          <button type="submit" className={`w-full py-3 rounded-full font-semibold text-sm shadow transition-all text-white ${isExpense ? 'bg-rose-600 hover:bg-rose-700' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
            {isExpense ? 'Log Expense' : 'Log Income'}
          </button>
        </form>
      </div>
    </div>
  );
}
