import { useState, useRef, useEffect } from 'react';
import { Send, Bot, Trash2, ChevronDown, ChevronUp, X } from 'lucide-react';
import { useAgentStore } from '../stores/useFinanceStore';

export default function AgentChat() {
  const { chatHistory, isThinking, addChatMessage, deleteChat } = useAgentStore();
  const [input, setInput] = useState('');
  const [openReasoningId, setOpenReasoningId] = useState<string | null>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chatHistory, isThinking]);

  const quickPrompts = [
    'I spent ₹250 on lunch',
    'Am I on track this month?',
    'How much can I save?',
    'I got my stipend — ₹8,000',
    'Add a goal for a new phone',
    'What are my subscriptions?',
  ];

  const send = (text: string) => {
    if (!text.trim() || isThinking) return;
    addChatMessage(text);
    setInput('');
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-background max-w-lg w-full mx-auto">
      {/* Sub-header */}
      <div className="flex justify-between items-center p-3 px-4 bg-slate-900 border-b border-white/5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="relative">
            <div className="w-8 h-8 rounded-full bg-indigo-600/20 border border-indigo-500/20 flex items-center justify-center">
              <Bot className="text-indigo-400" size={18} />
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-slate-900 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="text-sm font-bold text-white leading-none">FinAgent</h1>
              <span className="text-[9px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1.5 py-0.5 rounded-full font-medium">Online</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">Your money co-pilot · knows your full context</p>
          </div>
        </div>
        {chatHistory.length > 0 && (
          <button onClick={() => setConfirmClear(true)} className="p-2 bg-slate-800 hover:bg-rose-950/40 border border-white/5 hover:border-rose-500/20 rounded-full text-slate-400 hover:text-rose-400 transition-colors" title="Clear chat">
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {chatHistory.length === 0 && !isThinking && (
          <div className="flex flex-col items-center justify-center h-full text-center px-6 gap-3">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Bot className="text-indigo-400" size={26} />
            </div>
            <p className="text-sm font-bold text-white">Talk to me like a friend</p>
            <p className="text-xs text-slate-400 leading-relaxed max-w-[240px]">
              Tell me what you spent or earned, ask about your budget, or set a goal — I'll take care of the rest.
            </p>
          </div>
        )}

        {chatHistory.map((msg) => {
          const isAgent = msg.sender === 'agent';
          const isOpen = openReasoningId === msg.id;
          return (
            <div key={msg.id} className={`flex items-start gap-2.5 ${!isAgent ? 'justify-end' : ''} animate-fade-in`}>
              {isAgent && (
                <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 text-white mt-1">
                  <Bot size={12} />
                </div>
              )}
              <div className="max-w-[85%] space-y-1.5">
                <div className={`rounded-2xl p-3.5 text-xs leading-relaxed whitespace-pre-line ${isAgent ? 'bg-slate-800 text-slate-200 border-l-2 border-indigo-500' : 'bg-indigo-600 text-white font-medium'}`}>
                  {msg.text}
                </div>

                {isAgent && (msg.reasoning?.length || msg.actionsTaken?.length) && (
                  <div className="space-y-1.5 pl-1">
                    {!!msg.reasoning?.length && (
                      <button onClick={() => setOpenReasoningId(isOpen ? null : msg.id)} className="flex items-center gap-1 text-[10px] text-slate-400 font-bold hover:text-indigo-400 uppercase tracking-wider">
                        <span>⚙ How I did it</span>{isOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                      </button>
                    )}
                    {isOpen && !!msg.reasoning?.length && (
                      <div className="bg-slate-950/80 rounded-xl p-3 border border-white/5 text-[10px] text-slate-400 space-y-1.5 animate-fade-in">
                        {msg.reasoning!.map((s) => (
                          <div key={s.step} className="flex items-start gap-1.5">
                            <span className="text-indigo-400 font-bold shrink-0">{s.step}.</span>
                            <span className="text-slate-300">{s.description}</span>
                          </div>
                        ))}
                      </div>
                    )}
                    {!!msg.actionsTaken?.length && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {msg.actionsTaken!.map((chip, i) => (
                          <span key={i} className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-semibold">
                            <span className="w-1 h-1 rounded-full bg-emerald-400" />{chip}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isThinking && (
          <div className="flex items-start gap-2.5 animate-fade-in">
            <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 text-white mt-1"><Bot size={12} /></div>
            <div className="bg-slate-800 rounded-2xl p-3 border-l-2 border-indigo-500 flex items-center gap-1.5">
              {[0, 150, 300].map((d) => <span key={d} className="w-2 h-2 bg-slate-400 rounded-full animate-pulse-dots" style={{ animationDelay: `${d}ms` }} />)}
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick prompts */}
      <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar shrink-0 border-t border-white/5 bg-slate-950/30">
        {quickPrompts.map((p) => (
          <button key={p} onClick={() => send(p)} className="shrink-0 bg-slate-900 border border-white/10 hover:border-indigo-500 text-slate-300 hover:text-white rounded-full py-1.5 px-3.5 text-xs font-semibold transition-all">
            {p}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="p-3 px-4 bg-slate-950 shrink-0 border-t border-white/5">
        <form onSubmit={(e) => { e.preventDefault(); send(input); }} className="flex items-center gap-2 bg-slate-900 border border-white/10 rounded-full py-1.5 pl-4 pr-1.5 focus-within:border-indigo-500 transition-all">
          <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Tell your agent…" className="flex-1 bg-transparent border-none text-white text-sm placeholder-slate-500 focus:outline-none" />
          <button type="submit" disabled={!input.trim() || isThinking} className="w-8 h-8 rounded-full bg-indigo-gradient flex items-center justify-center text-white disabled:opacity-40 transition-all shrink-0">
            <Send size={14} />
          </button>
        </form>
      </div>

      {/* Clear confirm */}
      {confirmClear && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setConfirmClear(false)}>
          <div className="w-full max-w-xs bg-slate-900 border border-white/10 rounded-2xl p-5 text-center space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="w-10 h-10 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto"><Trash2 size={18} /></div>
            <div>
              <h4 className="text-sm font-bold text-white">Clear this chat?</h4>
              <p className="text-[11px] text-slate-400 mt-1">This deletes your conversation and the agent's memory of it. Your money data stays.</p>
            </div>
            <div className="flex gap-2.5">
              <button onClick={() => setConfirmClear(false)} className="flex-1 py-2 border border-white/10 text-slate-300 rounded-full text-xs font-bold">Cancel</button>
              <button onClick={async () => { await deleteChat(); setConfirmClear(false); }} className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-full text-xs font-bold flex items-center justify-center gap-1"><X size={12} /> Clear</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
