import { X, Activity } from 'lucide-react';
import { useAgentStore } from '../stores/useFinanceStore';
import { relativeTime } from '../lib/constants';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const catColor = (cat: string) => {
  switch (cat) {
    case 'INCOME': return 'text-emerald-400 bg-emerald-950/50 border-emerald-500/20';
    case 'ALERT': return 'text-rose-400 bg-rose-950/50 border-rose-500/20';
    case 'GOALS': return 'text-indigo-400 bg-indigo-950/50 border-indigo-500/20';
    case 'COMMUNITY': return 'text-violet-400 bg-violet-950/50 border-violet-500/20';
    case 'EXPENSE': return 'text-amber-400 bg-amber-950/50 border-amber-500/20';
    case 'REWARD': return 'text-yellow-400 bg-yellow-950/50 border-yellow-500/20';
    default: return 'text-slate-400 bg-slate-900 border-slate-500/20';
  }
};

export default function ActivityLog({ isOpen, onClose }: Props) {
  const { activityLog } = useAgentStore();
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-sm h-full bg-slate-950 border-l border-white/5 flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-900">
          <div className="flex items-center gap-2">
            <Activity className="text-indigo-400" size={18} />
            <h2 className="text-base font-bold text-white">Agent Activity</h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
          {activityLog.length === 0 && (
            <p className="text-center text-xs text-slate-500 py-10">No activity yet.</p>
          )}
          {activityLog.map((log) => (
            <div key={log.id} className="bg-slate-900/80 rounded-xl p-3 border border-white/5">
              <div className="flex items-center justify-between mb-1.5">
                <span className={`text-[9px] font-mono px-2 py-0.5 rounded-md border font-semibold tracking-wider uppercase ${catColor(log.category)}`}>
                  {log.category}
                </span>
                <span className="text-[10px] text-slate-500 font-mono">{relativeTime(log.date)}</span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed">{log.description}</p>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-white/5 bg-slate-900 text-center">
          <span className="text-[10px] text-slate-500">Everything your agent does, in plain English.</span>
        </div>
      </div>
    </div>
  );
}
