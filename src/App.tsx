import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home';
import AgentChat from './pages/AgentChat';
import Insights from './pages/Insights';
import Goals from './pages/Goals';
import Community from './pages/Community';
import Onboarding from './pages/Onboarding';
import Admin from './pages/Admin';
import BottomNav from './components/BottomNav';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-background text-textPrimary flex flex-col font-sans select-none overflow-x-hidden antialiased">
        {/* Main Content Area */}
        <div className="flex-1 pb-16">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/agent" element={<AgentChat />} />
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
