import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './pages/Home';
import AgentChat from './pages/AgentChat';
import Insights from './pages/Insights';
import Goals from './pages/Goals';
import Community from './pages/Community';
import Onboarding from './pages/Onboarding';
import Admin from './pages/Admin';
import BottomNav from './components/BottomNav';
import { useAgentStore } from './stores/useFinanceStore';
import { X, Database, Bot } from 'lucide-react';

export default function App() {
  const { currentNotification, setCurrentNotification } = useAgentStore();

  useEffect(() => {
    if (currentNotification) {
      const timer = setTimeout(() => {
        setCurrentNotification(null);
      }, 12000); // auto-dismiss after 12 seconds
      return () => clearTimeout(timer);
    }
  }, [currentNotification, setCurrentNotification]);

  return (
    <Router>
      <div className="min-h-screen bg-background text-textPrimary flex flex-col font-sans select-none overflow-x-hidden antialiased relative">
        
        {/* Floating Auto SMS Notification Banner */}
        {currentNotification && (
          <div className="fixed top-4 left-1/2 -translate-x-1/2 w-full max-w-sm px-4 z-50 animate-fade-in">
            <div className="bg-slate-900/95 backdrop-blur-md border border-indigo-500/30 rounded-2xl p-4 shadow-2xl relative shadow-indigo-glow/20 flex gap-3">
              <button
                onClick={() => setCurrentNotification(null)}
                className="absolute top-3.5 right-3.5 p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X size={12} />
              </button>

              <div className="w-9 h-9 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center shrink-0 mt-0.5">
                <Bot size={18} className="animate-bounce" />
              </div>

              <div className="flex-1 text-left min-w-0 pr-4">
                <h4 className="text-xs font-extrabold text-white leading-none mb-1 flex items-center gap-1.5">
                  <span>FinAgent Auto SMS</span>
                  <span className="text-[8px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full font-mono font-medium">Auto-pilot</span>
                </h4>
                <p className="text-xs text-slate-200 leading-normal font-semibold mt-2">
                  {currentNotification.message}
                </p>
                <p className="text-[10px] text-slate-400 leading-relaxed mt-1">
                  {currentNotification.subMessage}
                </p>
                <div className="flex items-center gap-1 bg-slate-950 p-2 rounded-lg border border-white/5 font-mono text-[9px] text-indigo-300 mt-2.5 overflow-x-auto whitespace-nowrap scrollbar-thin">
                  <Database size={10} className="shrink-0 text-indigo-400" />
                  <span>{currentNotification.op}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 pb-16">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/agent" element={<AgentChat />} />
            <Route path="/chat" element={<AgentChat />} />
            <Route path="/agent-chat" element={<AgentChat />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/community" element={<Community />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>

        {/* Bottom Nav Bar */}
        <BottomNav />
      </div>
    </Router>
  );
}
