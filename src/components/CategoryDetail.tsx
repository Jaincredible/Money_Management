import { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { X, Sparkles, Loader2, Store, Clock, Repeat } from 'lucide-react';
import { useTransactionsStore, fetchSuggestion } from '../stores/useFinanceStore';
import { catMeta, inr, relativeTime, inPeriod, PERIODS, type Period } from '../lib/constants';

interface Props {
  category: string | null;
  period: Period;
  onClose: () => void;
}

export default function CategoryDetail({ category, period, onClose }: Props) {
  const { transactions } = useTransactionsStore();
  const [merchantFilter, setMerchantFilter] = useState('All');
  const [sort, setSort] = useState<'recent' | 'most'>('recent');
  const [suggestion, setSuggestion] = useState('');
  const [loadingSug, setLoadingSug] = useState(true);

  useEffect(() => {
    setMerchantFilter('All');
    setSort('recent');
  }, [category]);

  useEffect(() => {
    if (!category) return;
    let alive = true;
    setLoadingSug(true);
    fetchSuggestion(category).then((s) => { if (alive) { setSuggestion(s); setLoadingSug(false); } });
    return () => { alive = false; };
  }, [category]);

  const catTx = useMemo(
    () => transactions.filter((t) => t.type === 'expense' && t.category === category && inPeriod(t.date, period)),
    [transactions, category, period]
  );

  const merchants = useMemo(() => {
    const map: Record<string, { total: number; count: number }> = {};
    catTx.forEach((t) => {
      const m = t.merchant || 'Other';
      if (!map[m]) map[m] = { total: 0, count: 0 };
      map[m].total += t.amount;
      map[m].count += 1;
    });
    return Object.entries(map).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.total - a.total);
  }, [catTx]);

  const total = catTx.reduce((s, t) => s + t.amount, 0);
  const countByMerchant = Object.fromEntries(merchants.map((m) => [m.name, m.count]));

  const list = useMemo(() => {
    let l = merchantFilter === 'All' ? [...catTx] : catTx.filter((t) => (t.merchant || 'Other') === merchantFilter);
    if (sort === 'recent') l.sort((a, b) => +new Date(b.date) - +new Date(a.date));
    else l.sort((a, b) => (countByMerchant[b.merchant || 'Other'] || 0) - (countByMerchant[a.merchant || 'Other'] || 0) || +new Date(b.date) - +new Date(a.date));
    return l;
  }, [catTx, merchantFilter, sort, countByMerchant]);

  if (!category) return null;
  const meta = catMeta(category);
  const periodLabel = PERIODS.find((p) => p.key === period)?.label || '';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-md h-full bg-slate-950 border-l border-white/5 flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-white/5 bg-slate-900 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl" style={{ background: `${meta.color}22`, border: `1px solid ${meta.color}55` }}>{meta.emoji}</div>
            <div>
              <h2 className="text-base font-extrabold text-white leading-none">{category}</h2>
              <p className="text-[10px] text-slate-400 mt-1">{inr(total)} · {catTx.length} orders · {periodLabel}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-5">
          {catTx.length === 0 ? (
            <p className="text-center text-xs text-slate-500 py-10">No {category} spending {periodLabel.toLowerCase()}.</p>
          ) : (
            <>
              {/* AI suggestion */}
              <div className="rounded-2xl border border-indigo-500/25 bg-indigo-600/10 p-3.5">
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles size={12} className="text-indigo-400" />
                  <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider">Agent tip</span>
                </div>
                {loadingSug ? (
                  <div className="flex items-center gap-2 text-slate-400 text-xs"><Loader2 size={12} className="animate-spin" /> Analysing your {category.toLowerCase()} spending…</div>
                ) : (
                  <p className="text-xs text-slate-200 leading-relaxed">{suggestion}</p>
                )}
              </div>

              {/* Merchant bar chart */}
              <div>
                <h3 className="text-[10px] uppercase font-bold text-slate-400 tracking-wider mb-2 flex items-center gap-1"><Store size={11} /> By merchant</h3>
                <div className="h-[150px] w-full text-[9px] -ml-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={merchants} layout="vertical" margin={{ left: 20, right: 16 }}>
                      <XAxis type="number" stroke="#475569" tickFormatter={(v) => `₹${v}`} />
                      <YAxis type="category" dataKey="name" stroke="#94A3B8" width={72} tick={{ fontSize: 10 }} />
                      <Tooltip cursor={{ fill: 'rgba(255,255,255,0.03)' }} content={({ active, payload }: any) => active && payload?.length ? (
                        <div className="bg-slate-900 border border-white/10 p-2 rounded-lg text-xs">
                          <p className="font-bold text-white">{payload[0].payload.name}</p>
                          <p className="text-slate-400 mt-0.5">{inr(payload[0].value)} · {payload[0].payload.count} orders</p>
                        </div>
                      ) : null} />
                      <Bar dataKey="total" radius={[0, 4, 4, 0]}>
                        {merchants.map((_, i) => <Cell key={i} fill={meta.color} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Filters + sort */}
              <div className="space-y-2">
                <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
                  {['All', ...merchants.map((m) => m.name)].map((m) => (
                    <button key={m} onClick={() => setMerchantFilter(m)} className={`shrink-0 py-1 px-3 rounded-full text-[10px] font-bold border transition-all ${merchantFilter === m ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-900 border-white/5 text-slate-400'}`}>{m}</button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setSort('recent')} className={`flex items-center gap-1 py-1 px-2.5 rounded-full text-[10px] font-bold border ${sort === 'recent' ? 'bg-slate-800 border-white/20 text-white' : 'bg-slate-950 border-white/5 text-slate-500'}`}><Clock size={10} /> Recent</button>
                  <button onClick={() => setSort('most')} className={`flex items-center gap-1 py-1 px-2.5 rounded-full text-[10px] font-bold border ${sort === 'most' ? 'bg-slate-800 border-white/20 text-white' : 'bg-slate-950 border-white/5 text-slate-500'}`}><Repeat size={10} /> Most ordered</button>
                </div>
              </div>

              {/* Transaction list */}
              <div className="space-y-2">
                {list.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 bg-slate-900/70 border border-white/5 rounded-xl p-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-[9px] font-bold text-slate-300 shrink-0">{(t.merchant || 'O').slice(0, 2).toUpperCase()}</div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-200 truncate flex items-center gap-1.5">
                        {t.description}
                        {t.split && <span className="text-[8px] bg-indigo-500/15 text-indigo-300 border border-indigo-500/20 px-1.5 py-0.5 rounded-full font-bold shrink-0">SPLIT</span>}
                      </p>
                      <p className="text-[9px] text-slate-500">{t.merchant} · {relativeTime(t.date)}{t.split ? ` · your share of ${inr(t.split.total)}` : ''}</p>
                    </div>
                    <span className="text-xs font-bold text-white shrink-0">{inr(t.amount)}</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
