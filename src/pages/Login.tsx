import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, Loader2, ChevronDown, GraduationCap } from 'lucide-react';
import { BrandLogo } from '../components/Brand';
import { useAuthStore } from '../stores/useFinanceStore';
import { apiFetch } from '../lib/api';

interface DemoAccount {
  username: string; fullName: string; city: string; college: string;
  monthlyIncome: number; savingsMode: string; featured: boolean;
}

export default function Login() {
  const navigate = useNavigate();
  const { login, demoLogin } = useAuthStore();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState<'' | 'login' | 'demo'>('');
  const [demos, setDemos] = useState<DemoAccount[]>([]);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    apiFetch<DemoAccount[]>('/api/auth/demo-accounts').then(setDemos).catch(() => {});
  }, []);

  const featured = demos.find((d) => d.featured);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy('login');
    try {
      await login(identifier, password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
      setBusy('');
    }
  };

  const handleDemo = async (username?: string) => {
    setError('');
    setBusy('demo');
    try {
      await demoLogin(username);
    } catch (err: any) {
      setError(err.message || 'Demo login failed');
      setBusy('');
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col justify-center items-center px-6 py-10 max-w-lg mx-auto relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-indigo-500/10 blur-[90px] pointer-events-none" />

      <div className="w-full max-w-sm space-y-6 relative animate-fade-in">
        {/* Brand */}
        <div className="text-center space-y-3">
          <BrandLogo className="w-64 max-w-full h-auto mx-auto -my-4" />
          <div>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">Welcome back</h1>
            <p className="text-sm text-slate-400 mt-1">Sign in to your AI money co-pilot</p>
          </div>
        </div>

        {/* Featured demo — one-click bypass */}
        <button
          onClick={() => handleDemo(featured?.username)}
          disabled={busy !== ''}
          className="w-full p-4 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 hover:border-indigo-500/60 transition-all flex items-center gap-3 text-left group disabled:opacity-60"
        >
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 shrink-0">
            {busy === 'demo' ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} className="group-hover:scale-110 transition-transform" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white flex items-center gap-1.5">
              Explore the demo
              <span className="text-[8px] bg-indigo-500/20 text-indigo-300 px-1.5 py-0.5 rounded-full uppercase font-bold tracking-wider">1-click</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Jump straight into {featured ? featured.fullName.split(' ')[0] + "'s" : 'a'} fully-loaded account — no sign-in needed.
            </p>
          </div>
          <ArrowRight size={16} className="text-indigo-400 shrink-0" />
        </button>

        {/* Other demo accounts */}
        {demos.length > 1 && (
          <div>
            <button
              onClick={() => setShowPicker((v) => !v)}
              className="w-full flex items-center justify-center gap-1 text-[11px] text-slate-500 hover:text-slate-300 font-semibold transition-colors"
            >
              or pick another demo account
              <ChevronDown size={12} className={`transition-transform ${showPicker ? 'rotate-180' : ''}`} />
            </button>
            {showPicker && (
              <div className="mt-3 grid grid-cols-1 gap-2 max-h-56 overflow-y-auto custom-scrollbar animate-fade-in">
                {demos.filter((d) => !d.featured).map((d) => (
                  <button
                    key={d.username}
                    onClick={() => handleDemo(d.username)}
                    disabled={busy !== ''}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-slate-900 border border-white/5 hover:border-indigo-500/40 transition-all text-left disabled:opacity-60"
                  >
                    <div className="w-8 h-8 rounded-full bg-slate-800 text-indigo-300 text-[10px] font-bold flex items-center justify-center shrink-0">
                      {d.fullName.split(' ').map((s) => s[0]).slice(0, 2).join('')}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{d.fullName}</p>
                      <p className="text-[9px] text-slate-500 flex items-center gap-1 truncate">
                        <GraduationCap size={9} /> {d.college}
                      </p>
                    </div>
                    <span className="text-[9px] font-mono text-slate-400 shrink-0">₹{d.monthlyIncome.toLocaleString('en-IN')}/mo</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-white/5" />
          <span className="text-[10px] text-slate-600 font-semibold uppercase tracking-wider">or sign in</span>
          <div className="flex-1 h-px bg-white/5" />
        </div>

        {error && (
          <div className="text-xs text-rose-400 font-semibold bg-rose-950/30 border border-rose-500/20 py-2.5 px-3 rounded-xl text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-3">
          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 font-semibold">Username or email</label>
            <input
              type="text" required value={identifier} onChange={(e) => setIdentifier(e.target.value)}
              placeholder="arjun"
              className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-slate-400 font-semibold">Password</label>
            <input
              type="password" required value={password} onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-slate-900 border border-white/10 rounded-xl py-3 px-4 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>
          <button
            type="submit" disabled={busy !== ''}
            className="w-full py-3.5 bg-indigo-gradient hover:from-indigo-600 hover:to-violet-700 text-white rounded-full font-bold text-sm shadow-indigo-glow transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {busy === 'login' ? <Loader2 size={16} className="animate-spin" /> : <>Sign in <ArrowRight size={14} /></>}
          </button>
        </form>

        <p className="text-center text-xs text-slate-400">
          New here?{' '}
          <button onClick={() => navigate('/signup')} className="text-indigo-400 font-bold hover:underline">
            Create an account
          </button>
        </p>
        <p className="text-center text-[10px] text-slate-600">Demo accounts use password: <span className="font-mono text-slate-500">finagent</span></p>
      </div>
    </div>
  );
}
