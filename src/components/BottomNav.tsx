import { useNavigate, useLocation } from 'react-router-dom';
import { Home, MessageSquare, BarChart3, Target, Trophy, Users } from 'lucide-react';
import { useAgentStore } from '../stores/useFinanceStore';

export default function BottomNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { friendUnread } = useAgentStore();

  const tabs = [
    { name: 'Home', path: '/', icon: Home, badge: 0 },
    { name: 'Agent', path: '/agent', icon: MessageSquare, badge: 0 },
    { name: 'Insights', path: '/insights', icon: BarChart3, badge: 0 },
    { name: 'Goals', path: '/goals', icon: Target, badge: 0 },
    { name: 'Community', path: '/community', icon: Trophy, badge: 0 },
    { name: 'Friends', path: '/friends', icon: Users, badge: friendUnread?.total || 0 },
  ];

  return (
    <nav className="shrink-0 h-16 bg-slate-950/95 backdrop-blur-md border-t border-white/5 flex items-center justify-around z-40 px-1 max-w-lg w-full mx-auto">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const active = pathname === tab.path || (tab.path === '/agent' && pathname === '/chat');
        return (
          <button key={tab.name} onClick={() => navigate(tab.path)} className="flex flex-col items-center justify-center flex-1 h-full relative focus:outline-none group">
            <div className={`flex flex-col items-center transition-all ${active ? 'text-indigo-400 -translate-y-0.5' : 'text-slate-500 group-hover:text-slate-300'}`}>
              <div className="relative">
                <Icon size={19} className="stroke-[2.2]" />
                {tab.badge > 0 && (
                  <span className="absolute -top-1.5 -right-2 min-w-[15px] h-[15px] px-1 bg-rose-500 rounded-full border border-slate-950 text-[8px] font-bold text-white flex items-center justify-center">
                    {tab.badge > 9 ? '9+' : tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[9px] font-medium mt-1 whitespace-nowrap leading-none">{tab.name}</span>
            </div>
            {active && <span className="absolute bottom-1.5 w-1.5 h-1.5 bg-indigo-500 rounded-full animate-fade-in" />}
          </button>
        );
      })}
    </nav>
  );
}
