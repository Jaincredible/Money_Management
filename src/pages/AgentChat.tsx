import { useState, useRef, useEffect } from 'react';
import { Send, Bot, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { useAgentStore, useTransactionsStore, useInsightsStore, useUserStore, useGoalsStore } from '../stores/useFinanceStore';
import type { ChatMessage } from '../stores/useFinanceStore';
import ActivityLog from '../components/ActivityLog';

export default function AgentChat() {
  const { chatHistory, isThinking, addChatMessage, setThinking, addActivityLog } = useAgentStore();
  const { addTransaction } = useTransactionsStore();
  const { recalculateInsights } = useInsightsStore();
  const { addXp } = useUserStore();
  const { goals, updateGoalSaved } = useGoalsStore();

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

    // 1. Add User Message
    const userMsg: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      sender: 'user',
      text: textToSend,
      timestamp: 'Just now'
    };
    addChatMessage(userMsg);
    setInput('');
    setThinking(true);

    // 2. Simulated Agent Processing
    setTimeout(() => {
      const response = generateAgentResponse(textToSend);
      addChatMessage(response);
      setThinking(false);
    }, 1500);
  };

  // Chat Engine keyword logic
  const generateAgentResponse = (text: string): ChatMessage => {
    const cleanText = text.toLowerCase();
    const messageId = `msg-agent-${Date.now()}`;

    // --- CASE 1: EXPENSE LOGGING ---
    if (cleanText.includes('spent') || cleanText.includes('expense') || cleanText.includes('bought') || cleanText.includes('paid')) {
      // Find amount if any
      const matchAmount = cleanText.match(/(?:rs\.?|₹|inr)?\s*(\d+(?:\.\d+)?)/);
      const amount = matchAmount ? parseFloat(matchAmount[1]) : 200;
      
      // Determine category
      let category: 'Food' | 'Transport' | 'Studies' | 'Entertainment' | 'Subscriptions' | 'Other' = 'Other';
      if (cleanText.includes('food') || cleanText.includes('burger') || cleanText.includes('pizza') || cleanText.includes('canteen') || cleanText.includes('dinner') || cleanText.includes('lunch')) {
        category = 'Food';
      } else if (cleanText.includes('uber') || cleanText.includes('ola') || cleanText.includes('auto') || cleanText.includes('cab') || cleanText.includes('ride') || cleanText.includes('fare')) {
        category = 'Transport';
      } else if (cleanText.includes('book') || cleanText.includes('studies') || cleanText.includes('exam') || cleanText.includes('course') || cleanText.includes('college')) {
        category = 'Studies';
      } else if (cleanText.includes('movie') || cleanText.includes('game') || cleanText.includes('arcade') || cleanText.includes('show')) {
        category = 'Entertainment';
      } else if (cleanText.includes('spotify') || cleanText.includes('netflix') || cleanText.includes('prime') || cleanText.includes('youtube')) {
        category = 'Subscriptions';
      }

      // Execute transaction logic
      addTransaction({
        type: 'expense',
        category,
        amount,
        description: `Logged via Chat: "${text}"`,
      });

      // Recalculate insights
      setTimeout(() => {
        const currentTxs = useTransactionsStore.getState().transactions;
        recalculateInsights(currentTxs);
      }, 0);

      // Add XP
      addXp(15);

      // Add activity log
      addActivityLog({
        category: 'EXPENSE',
        description: `Logged ₹${amount} under ${category} via Agent Chat.`,
        mongoOperation: `db.transactions.insertOne({ type: "expense", category: "${category}", amount: ${amount}, description: "Chat log" })`
      });

      return {
        id: messageId,
        sender: 'agent',
        text: `Got it. I've categorized and logged a ₹${amount} expense under **${category}**. I've written this transaction to your Atlas ledger.\n\nYour remaining budget has been recalculated. Let me know if you want to adjust goals or check your limits!`,
        timestamp: 'Just now',
        reasoning: [
          { step: 1, description: 'Parsing natural language input for amount and transaction type' },
          { step: 2, description: `Identified Expense of ₹${amount} for ${category}` },
          { step: 3, description: `MongoDB Atlas MCP: db.transactions.insertOne({ type: "expense", category: "${category}", amount: ${amount} })`, mongoOperation: 'db.transactions.insertOne()' },
          { step: 4, description: 'Recalculating global budget remaining limits', mongoOperation: 'db.insights.findOne()' },
          { step: 5, description: 'Action complete ✓' }
        ],
        actionsTaken: [`Logged ₹${amount}`, `Recalculated ${category}`, 'Awarded +15 XP']
      };
    }

    // --- CASE 2: STIPEND / INCOME ALLOCATION (WINNING DEMO MOMENT) ---
    if (cleanText.includes('salary') || cleanText.includes('stipend') || cleanText.includes('got') && (cleanText.includes('stipend') || cleanText.includes('income') || cleanText.includes('salary') || cleanText.includes('money'))) {
      const matchAmount = cleanText.match(/(?:rs\.?|₹|inr)?\s*(\d+(?:\.\d+)?)/);
      const amount = matchAmount ? parseFloat(matchAmount[1]) : 8000;

      // Log income
      addTransaction({
        type: 'income',
        category: 'Salary',
        amount,
        description: `Stipend allocation via Chat`,
      });

      // Split stipend: 50% savings pool, 30% monthly expenses, 20% emergency fund
      const savingsPortion = Math.round(amount * 0.50);
      const expensesPortion = Math.round(amount * 0.30);
      const emergencyPortion = Math.round(amount * 0.20);

      // Distribute to goals
      updateGoalSaved(1, Math.round(savingsPortion * 0.6)); // Goa Trip
      updateGoalSaved(2, Math.round(savingsPortion * 0.4)); // New Laptop
      updateGoalSaved(3, emergencyPortion); // Emergency Fund

      // Recalculate insights
      setTimeout(() => {
        const currentTxs = useTransactionsStore.getState().transactions;
        recalculateInsights(currentTxs);
      }, 0);

      // Add XP
      addXp(30);

      // Add activity logs
      addActivityLog({
        category: 'INCOME',
        description: `Stipend of ₹${amount} split: ₹${savingsPortion} to Savings pool, ₹${expensesPortion} to Expenses, ₹${emergencyPortion} to Emergency Fund.`,
        mongoOperation: 'db.transactions.insertOne() + db.goals.updateMany()'
      });

      return {
        id: messageId,
        sender: 'agent',
        text: `Splendid! I have logged your ₹${amount} stipend and auto-allocated it according to your Balanced savings preference (50/30/20):\n\n• **₹${savingsPortion}** → Savings Pool (Distributed to Goa Trip & Laptop)\n• **₹${expensesPortion}** → Monthly Expenses Pool\n• **₹${emergencyPortion}** → Emergency Fund (Updated to ₹${goals[2].saved + emergencyPortion})\n\nI have committed these updates to MongoDB Atlas. You've earned 30 XP for regular budgeting!`,
        timestamp: 'Just now',
        reasoning: [
          { step: 1, description: 'Parsing intent: "income entry + auto-allocate"' },
          { step: 2, description: `MongoDB Atlas MCP: db.transactions.insertOne({ amount: ${amount}, type: "income" })`, mongoOperation: 'db.transactions.insertOne()' },
          { step: 3, description: `Calculating split: Savings (₹${savingsPortion}) · Expenses (₹${expensesPortion}) · Emergency (₹${emergencyPortion})` },
          { step: 4, description: 'Updating active goals state in database', mongoOperation: 'db.goals.updateMany()' },
          { step: 5, description: 'Logging operation completed successfully' }
        ],
        actionsTaken: [`Logged ₹${amount} stipend`, 'Updated 3 goals', 'Auto-split completed', '+30 XP awarded']
      };
    }

    // --- CASE 3: ON TRACK / CHECK GOALS ---
    if (cleanText.includes('track') || cleanText.includes('goals') || cleanText.includes('check')) {
      const goaSaved = goals[0].saved;
      const goaTarget = goals[0].target;
      const laptopSaved = goals[1].saved;
      
      return {
        id: messageId,
        sender: 'agent',
        text: `Here is your goals summary:\n\n1. **Goa Trip** 🏖️: Saved ₹${goaSaved} / ₹${goaTarget} (40% complete). Weekly target is ₹${goals[0].weeklyTarget}. Rate is stable.\n2. **New Laptop** 💻: Saved ₹${laptopSaved} / ₹${goals[1].target} (5% complete). Requires steady contribution.\n3. **Emergency Fund** 🛡️: Saved ₹${goals[2].saved} / ₹${goals[2].target} (45% complete). Ahead of schedule.\n\nYou are generally **on track** to complete your Emergency Fund by Sept 2026. Keep it up!`,
        timestamp: 'Just now',
        reasoning: [
          { step: 1, description: 'Querying goals collection where active = true', mongoOperation: 'db.goals.find({ active: true })' },
          { step: 2, description: 'Calculating velocity and percentages for each target document' },
          { step: 3, description: 'Synthesizing progress summary' }
        ],
        actionsTaken: ['Goals status checked', 'Goa Trip projection updated']
      };
    }

    // --- CASE 4: SUBSCRIPTIONS ---
    if (cleanText.includes('subscription') || cleanText.includes('spotify') || cleanText.includes('recurring') || cleanText.includes('netflix') || cleanText.includes('bills')) {
      return {
        id: messageId,
        sender: 'agent',
        text: `I've found 3 active recurring subscriptions on your account:\n\n• **Spotify Student** — ₹119/month (Next billing: June 28)\n• **Netflix Mobile** — ₹349/month (Next billing: July 4)\n• **Amazon Prime (Simulated)** — ₹299/month (Next billing: June 30)\n\nTotal Monthly Commitment: **₹767/month**. Let me know if you would like me to pause monitoring or create a reminder!`,
        timestamp: 'Just now',
        reasoning: [
          { step: 1, description: 'Filtering transactions where category = "Subscriptions"', mongoOperation: 'db.transactions.find({ category: "Subscriptions" })' },
          { step: 2, description: 'Scanning alerts collection for active reminders', mongoOperation: 'db.alerts.find({ active: true })' },
          { step: 3, description: 'Summarizing subscription details' }
        ],
        actionsTaken: ['Parsed subscriptions list', 'Reminders verified']
      };
    }

    // --- CASE 5: CHALLENGES ---
    if (cleanText.includes('challenge') || cleanText.includes('create') && cleanText.includes('challenge')) {
      addActivityLog({
        category: 'COMMUNITY',
        description: 'New platform savings challenge initialized via agent chat.',
        mongoOperation: 'db.challenges.insertOne({ name: "June Chat No-Spend" })'
      });

      return {
        id: messageId,
        sender: 'agent',
        text: `Challenge created successfully! 🏆\n\nI have initialized the **"June Chat No-Spend Challenge"** in the community database. Priya, Rahul, and Aisha have been sent invitations. You will gain **+50 XP** if you maintain your budget for the next 7 days!`,
        timestamp: 'Just now',
        reasoning: [
          { step: 1, description: 'MongoDB Atlas MCP: db.challenges.insertOne({ name: "June Chat No-Spend", participants: 4 })', mongoOperation: 'db.challenges.insertOne()' },
          { step: 2, description: 'Dispatching notification alerts to contacts', mongoOperation: 'db.notifications.insertMany()' }
        ],
        actionsTaken: ['Challenge created', 'Invitations dispatched']
      };
    }

    // --- CASE 6: SAVINGS PROJECTIONS ---
    if (cleanText.includes('save') || cleanText.includes('projection') || cleanText.includes('saving')) {
      return {
        id: messageId,
        sender: 'agent',
        text: `Based on your stipend (₹8,000) and current spending rate of ₹3,240, you are projected to save **₹2,980** by June 30th. This is **₹20 short** of your ₹3,000 monthly target.\n\n💡 *Tip*: Reducing your Entertainment expenditure by just ₹200 this week will push you ahead of your goal!`,
        timestamp: 'Just now',
        reasoning: [
          { step: 1, description: 'Calculating current spending velocity', mongoOperation: 'db.transactions.aggregate()' },
          { step: 2, description: 'Projecting values against savings goals' }
        ],
        actionsTaken: ['Savings projection calculated', 'Nudge advice formulated']
      };
    }

    // --- DEFAULT CASE ---
    return {
      id: messageId,
      sender: 'agent',
      text: `Hello Arjun! I'm scanning your financial logs on MongoDB Atlas. I'm ready to take action on your command. You can type:\n\n• "I spent ₹200 on food" to log an expense.\n• "I got my stipend — ₹8,000" to auto-allocate savings.\n• "Am I on track?" to check goals status.\n• "Show my subscriptions" to scan billing dates.`,
      timestamp: 'Just now',
      reasoning: [
        { step: 1, description: 'Scanning user intent keywords' },
        { step: 2, description: 'No modification intent found. Resolving default dialog block.' }
      ]
    };
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
