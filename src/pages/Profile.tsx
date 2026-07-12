import { useState } from 'react';
import { LogOut, Pencil, Check, X, Trophy, MapPin, Mail, GraduationCap, Sparkles, Loader2, ShieldCheck } from 'lucide-react';
import { useUserStore, useAuthStore } from '../stores/useFinanceStore';
import { FALLBACK_PREFS_META } from '../lib/prefs';
import { savingsRate } from '../lib/constants';

const MODES = ['Conservative', 'Balanced', 'Aggressive'] as const;

export default function Profile() {
  const { profile, updateProfile } = useUserStore();
  const { logout } = useAuthStore();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState(profile);

  const startEdit = () => { setForm(profile); setEditing(true); };
  const set = (k: string, v: any) => setForm((p) => ({ ...p, [k]: v }));
  const togglePref = (key: string) =>
    set('spendingPreferences', form.spendingPreferences.includes(key)
      ? form.spendingPreferences.filter((p) => p !== key)
      : [...form.spendingPreferences, key]);

  const save = async () => {
    setBusy(true);
    try {
      await updateProfile({
        fullName: form.fullName, address: form.address, country: form.country,
        state: form.state, city: form.city, collegeName: form.collegeName,
        monthlyIncome: Number(form.monthlyIncome) || 0, savingsMode: form.savingsMode,
        spendingPreferences: form.spendingPreferences,
      });
      setEditing(false);
    } finally { setBusy(false); }
  };

  const initials = (profile.fullName || profile.username || 'U').split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();
  const input = 'w-full bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-white text-sm focus:outline-none focus:border-indigo-500';
  const label = 'text-[10px] uppercase tracking-wider text-slate-500 font-bold';

  const Row = ({ icon, k, value }: { icon: React.ReactNode; k: string; value: string }) => (
    <div className="flex items-center gap-3 py-2.5 border-b border-white/5 last:border-none">
      <div className="text-slate-500">{icon}</div>
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-slate-500 font-semibold">{k}</p>
        <p className="text-sm text-slate-200 font-medium truncate">{value || '—'}</p>
      </div>
    </div>
  );

  return (
    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
      <div className="max-w-lg mx-auto px-4 py-5 space-y-5">
        {/* Identity card */}
        <div className="glass-card rounded-2xl p-5 flex items-center gap-4 relative">
          <div className="w-16 h-16 rounded-2xl bg-indigo-gradient text-white text-xl font-extrabold flex items-center justify-center shadow-indigo-glow/30 shadow-md">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-extrabold text-white truncate">{profile.fullName}</h1>
            <p className="text-xs text-slate-400">@{profile.username}</p>
            <div className="flex items-center gap-1.5 mt-1.5">
              <span className="text-[9px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                <Trophy size={9} /> {profile.level}
              </span>
              <span className="text-[9px] text-slate-500 font-mono">{profile.xp}/{profile.xpToNext} XP</span>
            </div>
          </div>
          {!editing && (
            <button onClick={startEdit} className="absolute top-4 right-4 p-2 rounded-full bg-slate-800 text-slate-300 hover:text-white transition-colors">
              <Pencil size={14} />
            </button>
          )}
        </div>

        {!editing ? (
          <>
            {/* Details */}
            <div className="glass-card rounded-2xl p-4">
              <h2 className="text-[11px] uppercase font-bold text-slate-400 tracking-wider mb-1">Account details</h2>
              <Row icon={<Mail size={15} />} k="Email" value={profile.email} />
              <Row icon={<MapPin size={15} />} k="Address" value={[profile.address, profile.city, profile.state, profile.country].filter(Boolean).join(', ')} />
              <Row icon={<GraduationCap size={15} />} k="College / School" value={profile.collegeName} />
            </div>

            {/* Money profile */}
            <div className="glass-card rounded-2xl p-4 space-y-3">
              <h2 className="text-[11px] uppercase font-bold text-slate-400 tracking-wider">Money profile</h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-950 border border-white/5 rounded-xl p-3">
                  <p className={label}>Monthly income</p>
                  <p className="text-base font-bold text-emerald-400 mt-0.5">₹{profile.monthlyIncome.toLocaleString('en-IN')}</p>
                </div>
                <div className="bg-slate-950 border border-white/5 rounded-xl p-3">
                  <p className={label}>Savings style</p>
                  <p className="text-base font-bold text-white mt-0.5">{profile.savingsMode}</p>
                  <p className="text-[9px] text-indigo-400">{Math.round(savingsRate(profile.savingsMode) * 100)}% set aside</p>
                </div>
              </div>
              <div>
                <p className={`${label} mb-1.5`}>Spending preferences</p>
                <div className="flex flex-wrap gap-1.5">
                  {profile.spendingPreferences.length ? profile.spendingPreferences.map((p) => {
                    const meta = FALLBACK_PREFS_META.find((m) => m.key === p);
                    return (
                      <span key={p} className="text-[11px] bg-slate-800 border border-white/10 text-slate-200 px-2.5 py-1 rounded-full font-semibold flex items-center gap-1">
                        <span>{meta?.emoji || '•'}</span> {meta?.label || p}
                      </span>
                    );
                  }) : <span className="text-xs text-slate-500">None set</span>}
                </div>
              </div>
            </div>

            {/* Badges */}
            {profile.badges.length > 0 && (
              <div className="glass-card rounded-2xl p-4">
                <h2 className="text-[11px] uppercase font-bold text-slate-400 tracking-wider mb-3">Badges earned</h2>
                <div className="flex flex-wrap gap-2">
                  {profile.badges.map((b) => (
                    <span key={b} className="text-[11px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2.5 py-1 rounded-full font-bold flex items-center gap-1">
                      <Sparkles size={10} /> {b}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-2 justify-center text-[10px] text-slate-500 py-1">
              <ShieldCheck size={12} className="text-emerald-500" />
              <span>Your data is private and secured with your login.</span>
            </div>

            <button
              onClick={logout}
              className="w-full py-3.5 bg-rose-950/40 hover:bg-rose-950/60 border border-rose-500/20 text-rose-400 rounded-full font-bold text-sm flex items-center justify-center gap-2 transition-all"
            >
              <LogOut size={16} /> Sign out
            </button>
          </>
        ) : (
          /* EDIT MODE */
          <div className="glass-card rounded-2xl p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Edit profile</h2>
              <button onClick={() => setEditing(false)} className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"><X size={14} /></button>
            </div>
            <div className="space-y-1"><label className={label}>Full name</label><input className={input} value={form.fullName} onChange={(e) => set('fullName', e.target.value)} /></div>
            <div className="space-y-1"><label className={label}>Address</label><input className={input} value={form.address} onChange={(e) => set('address', e.target.value)} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><label className={label}>City</label><input className={input} value={form.city} onChange={(e) => set('city', e.target.value)} /></div>
              <div className="space-y-1"><label className={label}>State</label><input className={input} value={form.state} onChange={(e) => set('state', e.target.value)} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1"><label className={label}>Country</label><input className={input} value={form.country} onChange={(e) => set('country', e.target.value)} /></div>
              <div className="space-y-1"><label className={label}>Income (₹)</label><input className={input} type="number" value={form.monthlyIncome} onChange={(e) => set('monthlyIncome', e.target.value)} /></div>
            </div>
            <div className="space-y-1"><label className={label}>College / School</label><input className={input} value={form.collegeName} onChange={(e) => set('collegeName', e.target.value)} /></div>

            <div className="space-y-1.5">
              <label className={label}>Savings style</label>
              <div className="grid grid-cols-3 gap-2">
                {MODES.map((m) => (
                  <button key={m} type="button" onClick={() => set('savingsMode', m)}
                    className={`py-2 rounded-xl border text-[11px] font-bold transition-all ${form.savingsMode === m ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-slate-950 border-white/5 text-slate-400'}`}>
                    {m}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1.5">
              <label className={label}>Spending preferences</label>
              <div className="flex flex-wrap gap-1.5">
                {FALLBACK_PREFS_META.map((p) => {
                  const on = form.spendingPreferences.includes(p.key);
                  return (
                    <button key={p.key} type="button" onClick={() => togglePref(p.key)}
                      className={`text-[11px] px-2.5 py-1 rounded-full font-semibold border transition-all flex items-center gap-1 ${on ? 'bg-indigo-600/20 border-indigo-500 text-white' : 'bg-slate-950 border-white/10 text-slate-400'}`}>
                      <span>{p.emoji}</span> {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <button onClick={save} disabled={busy} className="w-full py-3 bg-indigo-gradient text-white rounded-full font-bold text-sm shadow-indigo-glow flex items-center justify-center gap-2 disabled:opacity-60">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <><Check size={15} /> Save changes</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
