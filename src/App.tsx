import { HashRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Home from './pages/Home';
import AgentChat from './pages/AgentChat';
import Insights from './pages/Insights';
import Goals from './pages/Goals';
import Community from './pages/Community';
import Friends from './pages/Friends';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Admin from './pages/Admin';
import BottomNav from './components/BottomNav';
import NotificationCenter from './components/NotificationCenter';
import { useAuthStore, useAgentStore, useUserStore } from './stores/useFinanceStore';
import { UNAUTHORIZED_EVENT } from './lib/api';
import { Bell, X, Sparkles, Wallet } from 'lucide-react';
import { Wordmark, BrandLogo } from './components/Brand';

function TopBar({ onBell }: { onBell: () => void }) {
  const navigate = useNavigate();
  const { profile } = useUserStore();
  const { notifications } = useAgentStore();
  const unread = notifications.filter((n) => !n.read).length;
  const initials = (profile.fullName || profile.username || 'U').split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();

  return (
    <header className="shrink-0 w-full bg-slate-950/80 backdrop-blur-md border-b border-white/5 z-40">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
        <button onClick={() => navigate('/')} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-lime-400 to-green-600 flex items-center justify-center shadow-md shadow-green-500/30">
            <Wallet size={17} className="text-slate-950" strokeWidth={2.4} />
          </div>
          <div className="text-left leading-none">
            <Wordmark className="text-sm" />
            <p className="text-[9px] text-slate-400 font-medium mt-0.5">Smart spending. Better tomorrow.</p>
          </div>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onBell}
            className="relative p-2.5 bg-slate-800/70 hover:bg-slate-800 rounded-full border border-white/5 text-slate-300 hover:text-white transition-all"
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 bg-rose-500 rounded-full border border-slate-950 text-[9px] font-bold text-white flex items-center justify-center">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          <button
            onClick={() => navigate('/profile')}
            className="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 text-xs font-bold flex items-center justify-center hover:border-indigo-400 transition-all"
          >
            {initials}
          </button>
        </div>
      </div>
    </header>
  );
}

function Toast() {
  const { currentNotification, setCurrentNotification } = useAgentStore();
  useEffect(() => {
    if (currentNotification) {
      const t = setTimeout(() => setCurrentNotification(null), 9000);
      return () => clearTimeout(t);
    }
  }, [currentNotification, setCurrentNotification]);

  if (!currentNotification) return null;
  return (
    <div className="fixed top-16 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-50 animate-fade-in">
      <div className="bg-slate-900/95 backdrop-blur-md border border-indigo-500/30 rounded-2xl p-4 shadow-2xl relative flex gap-3">
        <button onClick={() => setCurrentNotification(null)} className="absolute top-3 right-3 p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white">
          <X size={12} />
        </button>
        <div className="w-9 h-9 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 text-lg">
          {currentNotification.emoji || '🤖'}
        </div>
        <div className="flex-1 min-w-0 pr-4">
          <h4 className="text-xs font-extrabold text-white flex items-center gap-1.5">
            {currentNotification.title}
            <Sparkles size={11} className="text-indigo-400" />
          </h4>
          <p className="text-xs text-slate-200 leading-normal font-medium mt-1">{currentNotification.message}</p>
          {currentNotification.subMessage && (
            <p className="text-[10px] text-slate-400 leading-relaxed mt-1">{currentNotification.subMessage}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function AuthedApp() {
  const [notifOpen, setNotifOpen] = useState(false);
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  if (isAdmin) {
    return (
      <Routes>
        <Route path="/admin" element={<Admin />} />
      </Routes>
    );
  }

  return (
    <div className="h-[100dvh] flex flex-col bg-background text-textPrimary overflow-hidden">
      <TopBar onBell={() => setNotifOpen(true)} />
      <main className="flex-1 min-h-0 flex flex-col">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/agent" element={<AgentChat />} />
          <Route path="/chat" element={<AgentChat />} />
          <Route path="/insights" element={<Insights />} />
          <Route path="/goals" element={<Goals />} />
          <Route path="/community" element={<Community />} />
          <Route path="/friends" element={<Friends />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <BottomNav />
      <NotificationCenter isOpen={notifOpen} onClose={() => setNotifOpen(false)} />
      <Toast />
    </div>
  );
}

function GuestApp() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}

function Splash() {
  return (
    <div className="h-[100dvh] flex flex-col items-center justify-center bg-black gap-3">
      <BrandLogo className="w-64 max-w-[75vw] h-auto animate-pulse" />
      <p className="text-xs text-slate-500 font-mono animate-pulse">Loading…</p>
    </div>
  );
}

export default function App() {
  const { status, init, logout } = useAuthStore();

  useEffect(() => {
    init();
    const onUnauthorized = () => logout();
    window.addEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    return () => window.removeEventListener(UNAUTHORIZED_EVENT, onUnauthorized);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Router>
      {status === 'loading' ? <Splash /> : status === 'authed' ? <AuthedApp /> : <GuestApp />}
    </Router>
  );
}
