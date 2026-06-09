import { useState, useRef, useEffect } from 'react';
import { Send, Bot, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useAgentStore } from '../stores/useFinanceStore';
import ActivityLog from '../components/ActivityLog';

export default function AgentChat() {
  const { chatHistory, isThinking, addChatMessage } = useAgentStore();
  const [input, setInput] = useState('');
  const [isLogOpen, setIsLogOpen] = useState(false);
  const [openReasoningId, setOpenReasoningId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [chatHistory, isThinking]);

  const quickPrompts = [
    "I spent ₹200 on food",
    "Am I on track?",
    "Show my subscriptions",
    "I got my stipend — ₹8,000",
    "Create a challenge",
    "How much can I save this month?"
  ];

  const handleSend = (textToSend: string) => {
    if (!textToSend.trim()) return;
    addChatMessage(textToSend);
    setInput('');
  };

  const toggleReasoning = (id: string) => {
    setOpenReasoningId(openReasoningId === id ? null : id);
  };

  return (
    <div className="flex flex-col h-screen max-w-lg mx-auto bg-background text-textPrimary relative">
      
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-slate-900 border-b border-white/5 shrink-0">
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
              <span className="text-[9px] bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-1.5 py-0.5 rounded-full font-mono font-medium scale-95">
                Online
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium mt-1">
              Powered by Gemini · MongoDB Atlas MCP
            </p>
          </div>
        </div>
        
        {/* Console logs toggle button */}
        <button
          onClick={() => setIsLogOpen(true)}
          className="p-2 bg-slate-800 hover:bg-slate-700/80 border border-white/5 rounded-full text-slate-400 hover:text-white transition-colors"
        >
          <Clock size={16} />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {chatHistory.map((msg) => {
          const isAgent = msg.sender === 'agent';
          const isReasoningOpen = openReasoningId === msg.id;

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${!isAgent ? 'justify-end' : ''} animate-fade-in`}
            >
              {/* Agent Avatar */}
              {isAgent && (
                <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 text-white mt-1 shadow-md shadow-indigo-500/10">
                  <Bot size={12} />
                </div>
              )}

              {/* Message Bubble Container */}
              <div className="max-w-[85%] space-y-1.5">
                {/* Text Bubble */}
                <div
                  className={`rounded-2xl p-3.5 text-xs leading-relaxed whitespace-pre-line ${
                    isAgent
                      ? 'bg-slate-800 text-slate-200 border-l-2 border-indigo-500 text-left'
                      : 'bg-indigo-600 text-white text-left font-medium'
                  }`}
                >
                  {msg.text}
                </div>

                {/* Agent Collapsible Sections */}
                {isAgent && (msg.reasoning || msg.actionsTaken) && (
                  <div className="space-y-1.5 pl-1">
                    
                    {/* Collapsible Reasoning Title */}
                    {msg.reasoning && (
                      <button
                        onClick={() => toggleReasoning(msg.id)}
                        className="flex items-center gap-1 text-[10px] text-slate-400 font-bold hover:text-indigo-400 transition-colors uppercase font-mono tracking-wider focus:outline-none"
                      >
                        <span>⚙ Agent Reasoning</span>
                        {isReasoningOpen ? <ChevronUp size={10} /> : <ChevronDown size={10} />}
                      </button>
                    )}

                    {/* Reasoning Content Codeblock */}
                    {isAgent && msg.reasoning && isReasoningOpen && (
                      <div className="bg-slate-950/90 rounded-xl p-3 border border-white/5 font-mono text-[10px] text-slate-400 space-y-1.5 leading-normal animate-fade-in max-w-full overflow-x-auto">
                        {msg.reasoning.map((step) => (
                          <div key={step.step} className="flex items-start gap-1">
                            <span className="text-indigo-400 select-none">Step {step.step}:</span>
                            <span className="text-slate-300">{step.description}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Action chips */}
                    {msg.actionsTaken && (
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {msg.actionsTaken.map((chip, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-semibold"
                          >
                            <span className="w-1 h-1 rounded-full bg-emerald-400" />
                            <span>{chip}</span>
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

        {/* Thinking State */}
        {isThinking && (
          <div className="flex items-start gap-2.5 animate-fade-in">
            <div className="w-6 h-6 rounded-full bg-indigo-600 flex items-center justify-center shrink-0 text-white mt-1">
              <Bot size={12} />
            </div>
            <div className="bg-slate-800 rounded-2xl p-3 border-l-2 border-indigo-500 flex items-center gap-1.5">
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse-dots" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse-dots" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse-dots" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Prompt Chips */}
      <div className="px-4 py-2 flex gap-2 overflow-x-auto no-scrollbar shrink-0 border-t border-white/5 bg-slate-950/30">
        {quickPrompts.map((p) => (
          <button
            key={p}
            onClick={() => {
              setInput(p);
              handleSend(p);
            }}
            className="shrink-0 bg-slate-900 border border-white/10 hover:border-indigo-500 text-slate-300 hover:text-white rounded-full py-1.5 px-3.5 text-xs font-semibold tracking-wide transition-all shadow-md"
          >
            {p}
          </button>
        ))}
      </div>

      {/* Input Bar */}
      <div className="p-4 pt-2 pb-20 bg-slate-950 shrink-0 border-t border-white/5">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(input);
          }}
          className="flex items-center gap-2 bg-slate-900 border border-white/10 rounded-full py-1.5 pl-4 pr-1.5 focus-within:border-indigo-500 focus-within:shadow-indigo-glow/10 focus-within:shadow-md transition-all"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tell your agent..."
            className="flex-1 bg-transparent border-none text-white text-xs placeholder-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={!input.trim() || isThinking}
            className="w-8 h-8 rounded-full bg-indigo-gradient hover:from-indigo-600 hover:to-violet-700 flex items-center justify-center text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow shadow-indigo-glow/20"
          >
            <Send size={14} className="stroke-[2.2]" />
          </button>
        </form>
      </div>

      {/* Activity Log panel shortcut link */}
      <ActivityLog isOpen={isLogOpen} onClose={() => setIsLogOpen(false)} />
    </div>
  );
}
