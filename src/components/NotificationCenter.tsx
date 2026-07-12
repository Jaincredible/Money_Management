import { useEffect } from 'react';
import { X, BellOff } from 'lucide-react';
import { useAgentStore } from '../stores/useFinanceStore';
import { relativeTime } from '../lib/constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const typeStyle = (type: string) => {
  switch (type) {
    case 'alert': return 'bg-rose-500/10 border-rose-500/20 text-rose-400';
    case 'challenge': return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
    case 'reward': return 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400';
    case 'suggestion': return 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400';
    default: return 'bg-slate-700/40 border-white/10 text-slate-300';
  }
};

export default function NotificationCenter({ isOpen, onClose }: Props) {
  const { notifications, markNotificationsRead, deleteNotification } = useAgentStore();

  useEffect(() => {
    if (isOpen) {
      const t = setTimeout(() => markNotificationsRead(), 800);
      return () => clearTimeout(t);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-sm h-full bg-slate-950 border-l border-white/5 flex flex-col shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-900">
          <div>
            <h2 className="text-base font-bold text-white">Notifications</h2>
            <p className="text-[10px] text-slate-400">Invitations, agent suggestions & alerts</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar">
          {notifications.length === 0 && (
            <div className="flex flex-col items-center justify-center h-full text-slate-600 gap-2">
              <BellOff size={28} />
              <p className="text-xs">You're all caught up</p>
            </div>
          )}

          {notifications.map((n) => (
            <div
              key={n.id}
              className={`relative rounded-2xl p-3.5 border transition-all group ${
                n.read ? 'bg-slate-900/50 border-white/5' : 'bg-slate-900 border-indigo-500/20'
              }`}
            >
              {!n.read && <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />}
              <div className="flex gap-3">
                <div className={`w-9 h-9 rounded-full border flex items-center justify-center shrink-0 text-base ${typeStyle(n.type)}`}>
                  {n.emoji}
                </div>
                <div className="flex-1 min-w-0 pr-4">
                  <p className="text-xs font-bold text-white leading-snug">{n.title}</p>
                  <p className="text-[11px] text-slate-300 leading-relaxed mt-0.5">{n.message}</p>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[9px] text-slate-500 font-mono">{relativeTime(n.date)}</span>
                    <button
                      onClick={() => deleteNotification(n.id)}
                      className="text-[9px] text-slate-500 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity font-semibold"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
