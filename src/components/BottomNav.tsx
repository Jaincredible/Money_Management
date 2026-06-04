import { useNavigate, useLocation } from 'react-router-dom';
import { Home, MessageSquare, BarChart3, Target, Users } from 'lucide-react';

export default function BottomNav() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  // Don't show bottom navigation on admin routes
  if (currentPath.startsWith('/admin')) {
    return null;
  }

  const tabs = [
    { name: 'Home', path: '/', icon: Home },
    { name: 'Agent', path: '/agent', icon: MessageSquare },
    { name: 'Insights', path: '/insights', icon: BarChart3 },
    { name: 'Goals', path: '/goals', icon: Target },
    { name: 'Community', path: '/community', icon: Users },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 h-16 bg-slate-950/95 backdrop-blur-md border-t border-white/5 flex items-center justify-around z-40 px-2 max-w-lg mx-auto rounded-t-2xl shadow-xl">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentPath === tab.path;

        return (
          <button
            key={tab.name}
            onClick={() => navigate(tab.path)}
            className="flex flex-col items-center justify-center flex-1 h-full relative focus:outline-none transition-all group"
          >
            <div className={`flex flex-col items-center justify-center transition-all ${
              isActive ? 'text-indigo-400 -translate-y-1' : 'text-slate-500 group-hover:text-slate-400'
            }`}>
              <Icon size={20} className="stroke-[2.2]" />
              <span className="text-[10px] font-medium mt-1">{tab.name}</span>
            </div>
            
            {isActive && (
              <span className="absolute bottom-2 w-1.5 h-1.5 bg-indigo-500 rounded-full animate-fade-in" />
            )}
          </button>
        );
      })}
    </div>
  );
}
