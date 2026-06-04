import { X, Database, Terminal } from 'lucide-react';
import { useAgentStore } from '../stores/useFinanceStore';

interface ActivityLogProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ActivityLog({ isOpen, onClose }: ActivityLogProps) {
  const { activityLog } = useAgentStore();

  if (!isOpen) return null;

  const getCategoryColor = (cat: string) => {
    switch (cat) {
      case 'INCOME':
        return 'text-emerald-400 bg-emerald-950/50 border-emerald-500/20';
      case 'ALERT':
        return 'text-rose-400 bg-rose-950/50 border-rose-500/20';
      case 'GOALS':
        return 'text-indigo-400 bg-indigo-950/50 border-indigo-500/20';
      case 'COMMUNITY':
        return 'text-violet-400 bg-violet-950/50 border-violet-500/20';
      case 'EXPENSE':
        return 'text-amber-400 bg-amber-950/50 border-amber-500/20';
      case 'REWARD':
        return 'text-yellow-400 bg-yellow-950/50 border-yellow-500/20';
      default:
        return 'text-slate-400 bg-slate-900 border-slate-500/20';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg h-full bg-slate-950 border-l border-white/5 flex flex-col shadow-2xl relative">
        {/* Header */}
        <div className="p-4 border-b border-white/5 flex items-center justify-between bg-slate-900">
          <div className="flex items-center gap-2">
            <Database className="text-indigo-400" size={18} />
            <h2 className="text-lg font-bold text-white tracking-wide">MongoDB Atlas MCP Log</h2>
            <span className="text-[10px] bg-slate-800 text-slate-400 border border-white/5 px-2 py-0.5 rounded-full font-mono">
              v1.2.0
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Info Banner */}
        <div className="bg-indigo-950/30 border-b border-indigo-500/10 p-3 px-4 flex items-center gap-3">
          <Terminal className="text-indigo-400 shrink-0" size={16} />
          <p className="text-[11px] text-slate-400 font-mono leading-relaxed">
            Streaming live telemetry from Gemini Agent reasoning models. Actions are stored in the 
            <span className="text-indigo-300 font-semibold"> mongo-db-rapid-agent</span> cluster.
          </p>
        </div>

        {/* Logs Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
          {activityLog.map((log) => (
            <div
              key={log.id}
              className="bg-slate-900/80 rounded-xl p-3 border border-white/5 animate-fade-in relative hover:border-slate-800 transition-colors"
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border font-semibold tracking-wider uppercase ${getCategoryColor(log.category)}`}>
                  [{log.category}]
                </span>
                <span className="text-[10px] text-slate-500 font-mono">{log.timestamp}</span>
              </div>
              <p className="text-sm text-slate-200 leading-relaxed font-sans mb-2">
                {log.description}
              </p>
              <div className="flex items-start gap-1 bg-slate-950 p-2 rounded-lg border border-white/5 font-mono text-[10px] text-indigo-300 overflow-x-auto whitespace-nowrap scrollbar-thin">
                <span className="text-slate-600 shrink-0">→ MongoDB Atlas MCP:</span>
                <span className="text-slate-300 select-all">{log.mongoOperation}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-white/5 bg-slate-900 flex items-center justify-between font-mono text-[10px] text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span>Atlas Connection: Active</span>
          </div>
          <span>DPDP Compliant (India)</span>
        </div>
      </div>
    </div>
  );
}
