import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, ArrowRight, ArrowLeft, Loader2, Check, User, MapPin, Sparkles, ShieldCheck } from 'lucide-react';
import { useAuthStore } from '../stores/useFinanceStore';
import { apiFetch } from '../lib/api';

interface Pref { key: string; emoji: string; label: string; }

const FALLBACK_PREFS: Pref[] = [
  { key: 'Food', emoji: '🍔', label: 'Eating Out' },
  { key: 'Groceries', emoji: '🛒', label: 'Groceries' },
  { key: 'Travel', emoji: '✈️', label: 'Travel' },
  { key: 'Sports', emoji: '⚽', label: 'Sports' },
  { key: 'Entertainment', emoji: '🎮', label: 'Entertainment' },
  { key: 'Studies', emoji: '📚', label: 'Studies' },
  { key: 'Shopping', emoji: '🛍️', label: 'Shopping' },
  { key: 'Fitness', emoji: '💪', label: 'Fitness & Gym' },
  { key: 'Subscriptions', emoji: '📱', label: 'Subscriptions' },
  { key: 'Transport', emoji: '🚌', label: 'Transport' },
];

const MODES = [
  { key: 'Conservative', desc: 'Save 20%', hint: 'Play it safe' },
  { key: 'Balanced', desc: 'Save 30%', hint: 'Recommended' },
  { key: 'Aggressive', desc: 'Save 50%', hint: 'Grow fast' },
] as const;

export default function Signup() {
  const navigate = useNavigate();
  const { signup, demoLogin } = useAuthStore();
  const [prefsMeta, setPrefsMeta] = useState<Pref[]>(FALLBACK_PREFS);
  const [step, setStep] = useState(1);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  // form
  const [f, setF] = useState({
    username: '', email: '', password: '', confirm: '',
    fullName: '', address: '', country: 'India', state: '', city: '', collegeName: '',
    monthlyIncome: '', savingsMode: 'Balanced' as 'Conservative' | 'Balanced' | 'Aggressive',
    spendingPreferences: [] as string[],
    messageAccess: true,
  });
  const set = (k: string, v: any) => setF((prev) => ({ ...prev, [k]: v }));

  useEffect(() => {
    apiFetch('/api/meta').then((m) => { if (m.spendingPreferences?.length) setPrefsMeta(m.spendingPreferences); }).catch(() => {});
  }, []);

  const togglePref = (key: string) =>
    set('spendingPreferences', f.spendingPreferences.includes(key)
      ? f.spendingPreferences.filter((p) => p !== key)
      : [...f.spendingPreferences, key]);

  const validateStep1 = () => {
    if (!/^[a-zA-Z0-9_.]{3,20}$/.test(f.username)) return 'Username must be 3–20 chars (letters, numbers, _ or .).';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) return 'Enter a valid email address.';
    if (f.password.length < 6) return 'Password must be at least 6 characters.';
    if (f.password !== f.confirm) return 'Passwords do not match.';
    return '';
  };
  const validateStep2 = () => (!f.fullName.trim() ? 'Please enter your full name.' : '');

  const next = () => {
    const err = step === 1 ? validateStep1() : step === 2 ? validateStep2() : '';
    if (err) { setError(err); return; }
    setError('');
    setStep((s) => s + 1);
  };
  const back = () => { setError(''); setStep((s) => s - 1); };

  const submit = async () => {
    setError('');
    setBusy(true);
    try {
      await signup({
        username: f.username, email: f.email, password: f.password, fullName: f.fullName,
        address: f.address, country: f.country, state: f.state, city: f.city, collegeName: f.collegeName,
        monthlyIncome: Number(f.monthlyIncome) || 0, savingsMode: f.savingsMode,
        spendingPreferences: f.spendingPreferences, messageAccess: f.messageAccess,
      });
      // authed -> App swaps to the main UI automatically
    } catch (err: any) {
      setError(err.message || 'Could not create account');
      setBusy(false);
    }
  };

  const input = 'w-full bg-slate-900 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors';
  const label = 'text-[11px] text-slate-400 font-semibold';

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col items-center px-6 py-8 max-w-lg mx-auto relative overflow-y-auto custom-scrollbar">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-indigo-500/10 blur-[90px] pointer-events-none" />

      <div className="w-full max-w-sm space-y-6 relative animate-fade-in">
        {/* Header + progress */}
        <div className="text-center space-y-3 pt-2">
          <div className="w-14 h-14 rounded-2xl bg-indigo-gradient flex items-center justify-center mx-auto shadow-indigo-glow">
            <Bot size={26} className="text-white" />
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">Create your account</h1>
          <div className="flex items-center gap-1.5 justify-center">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-1.5 rounded-full transition-all ${s === step ? 'w-8 bg-indigo-500' : s < step ? 'w-4 bg-indigo-500/60' : 'w-4 bg-slate-700'}`} />
            ))}
          </div>
          <p className="text-[11px] text-slate-500 font-medium">
            {step === 1 ? 'Step 1 · Account' : step === 2 ? 'Step 2 · About you' : 'Step 3 · Spending style'}
          </p>
        </div>

        {error && (
          <div className="text-xs text-rose-400 font-semibold bg-rose-950/30 border border-rose-500/20 py-2.5 px-3 rounded-xl text-center">
            {error}
          </div>
        )}

        {/* STEP 1 — credentials */}
        {step === 1 && (
          <div className="space-y-3.5">
            <div className="space-y-1">
              <label className={label}>Username (unique)</label>
              <input className={input} value={f.username} onChange={(e) => set('username', e.target.value)} placeholder="e.g. arjun_23" />
            </div>
            <div className="space-y-1">
              <label className={label}>Email</label>
              <input className={input} type="email" value={f.email} onChange={(e) => set('email', e.target.value)} placeholder="you@college.edu" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className={label}>Password</label>
                <input className={input} type="password" value={f.password} onChange={(e) => set('password', e.target.value)} placeholder="6+ chars" />
              </div>
              <div className="space-y-1">
                <label className={label}>Confirm</label>
                <input className={input} type="password" value={f.confirm} onChange={(e) => set('confirm', e.target.value)} placeholder="repeat" />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2 — personal details */}
        {step === 2 && (
          <div className="space-y-3.5">
            <div className="space-y-1">
              <label className={label}><User size={11} className="inline mr-1" />Full name</label>
              <input className={input} value={f.fullName} onChange={(e) => set('fullName', e.target.value)} placeholder="Arjun Sharma" />
            </div>
            <div className="space-y-1">
              <label className={label}><MapPin size={11} className="inline mr-1" />Address</label>
              <input className={input} value={f.address} onChange={(e) => set('address', e.target.value)} placeholder="Flat / hostel, street" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className={label}>Country</label>
                <input className={input} value={f.country} onChange={(e) => set('country', e.target.value)} />
              </div>
              <div className="space-y-1">
                <label className={label}>State</label>
                <input className={input} value={f.state} onChange={(e) => set('state', e.target.value)} placeholder="Maharashtra" />
              </div>
            </div>
            <div className="space-y-1">
              <label className={label}>City</label>
              <input className={input} value={f.city} onChange={(e) => set('city', e.target.value)} placeholder="Pune" />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] text-slate-400 font-semibold flex justify-between">
                <span>College / School</span><span className="text-slate-600 italic">optional</span>
              </label>
              <input className={input} value={f.collegeName} onChange={(e) => set('collegeName', e.target.value)} placeholder="COEP Technological University" />
            </div>
          </div>
        )}

        {/* STEP 3 — spending preferences + income + mode */}
        {step === 3 && (
          <div className="space-y-5">
            <div className="space-y-2">
              <label className="text-[11px] text-slate-400 font-semibold flex items-center gap-1">
                <Sparkles size={11} className="text-indigo-400" /> What do you spend most on?
                <span className="text-slate-600 italic ml-auto">tap all that apply</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                {prefsMeta.map((p) => {
                  const on = f.spendingPreferences.includes(p.key);
                  return (
                    <button
                      key={p.key} type="button" onClick={() => togglePref(p.key)}
                      className={`relative flex items-center gap-2 p-3 rounded-xl border text-left transition-all ${
                        on ? 'bg-indigo-600/20 border-indigo-500 scale-[1.02]' : 'bg-slate-900 border-white/5 hover:border-white/15'
                      }`}
                    >
                      <span className="text-lg">{p.emoji}</span>
                      <span className={`text-xs font-bold ${on ? 'text-white' : 'text-slate-300'}`}>{p.label}</span>
                      {on && <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-indigo-500 flex items-center justify-center"><Check size={10} className="text-white" /></span>}
                    </button>
                  );
                })}
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                FinAgent tunes its budgeting & savings suggestions around what you actually care about.
              </p>
            </div>

            <div className="space-y-1">
              <label className={label}>Monthly income / allowance (₹)</label>
              <input className={input} type="number" value={f.monthlyIncome} onChange={(e) => set('monthlyIncome', e.target.value)} placeholder="8000" />
            </div>

            <div className="space-y-2">
              <label className={label}>Savings style</label>
              <div className="grid grid-cols-3 gap-2">
                {MODES.map((m) => (
                  <button
                    key={m.key} type="button" onClick={() => set('savingsMode', m.key)}
                    className={`py-2.5 px-1 border rounded-xl flex flex-col items-center transition-all ${
                      f.savingsMode === m.key ? 'bg-indigo-600/20 border-indigo-500' : 'bg-slate-900 border-white/5 hover:border-white/15'
                    }`}
                  >
                    <span className="text-[11px] font-bold text-white">{m.key}</span>
                    <span className="text-[9px] text-indigo-300 font-semibold mt-0.5">{m.desc}</span>
                    <span className="text-[8px] text-slate-500 mt-0.5">{m.hint}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Agent message-access permission (demo) */}
            <div className="rounded-2xl border border-indigo-500/30 bg-indigo-600/10 p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0">
                  <ShieldCheck size={17} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white flex items-center gap-1.5 flex-wrap">
                    Let FinAgent read your transaction SMS
                    <span className="text-[8px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-full uppercase font-bold tracking-wider">Recommended</span>
                  </p>
                  <p className="text-[10px] text-slate-400 leading-relaxed mt-1">
                    It auto-detects what you spent & earned from bank/UPI messages, so your budget configures itself — zero manual entry. Change it anytime in Profile.
                  </p>
                </div>
                <button type="button" onClick={() => set('messageAccess', !f.messageAccess)} className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors shrink-0 ${f.messageAccess ? 'bg-indigo-500' : 'bg-slate-700'}`}>
                  <div className={`bg-white w-4 h-4 rounded-full transition-transform ${f.messageAccess ? 'translate-x-5' : ''}`} />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Nav buttons */}
        <div className="flex gap-3 pt-1">
          {step > 1 && (
            <button onClick={back} className="py-3 px-5 rounded-full border border-white/10 text-slate-300 hover:text-white text-sm font-bold flex items-center gap-1.5 transition-all">
              <ArrowLeft size={14} /> Back
            </button>
          )}
          {step < 3 ? (
            <button onClick={next} className="flex-1 py-3 bg-indigo-gradient text-white rounded-full font-bold text-sm shadow-indigo-glow transition-all flex items-center justify-center gap-2">
              Continue <ArrowRight size={14} />
            </button>
          ) : (
            <button onClick={submit} disabled={busy} className="flex-1 py-3 bg-indigo-gradient text-white rounded-full font-bold text-sm shadow-indigo-glow transition-all flex items-center justify-center gap-2 disabled:opacity-60">
              {busy ? <Loader2 size={16} className="animate-spin" /> : <>Create account <Check size={14} /></>}
            </button>
          )}
        </div>

        <p className="text-center text-xs text-slate-400">
          Already have an account?{' '}
          <button onClick={() => navigate('/login')} className="text-indigo-400 font-bold hover:underline">Sign in</button>
        </p>

        {/* Quick demo bypass — skip signup entirely for the presentation */}
        <button
          onClick={() => demoLogin().catch(() => setError('Demo login failed'))}
          disabled={busy}
          className="w-full py-2.5 rounded-full border border-indigo-500/30 bg-indigo-600/10 hover:border-indigo-500/60 text-indigo-300 text-xs font-bold flex items-center justify-center gap-1.5 transition-all disabled:opacity-60"
        >
          <Sparkles size={13} /> Skip & explore the demo account
        </button>
      </div>
    </div>
  );
}
