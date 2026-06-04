import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, Sparkles, MessageSquare, Database, ArrowRight, ShieldCheck, Mail, X, ShieldAlert } from 'lucide-react';
import { useUserStore, useAgentStore } from '../stores/useFinanceStore';

export default function Onboarding() {
  const navigate = useNavigate();
  const { setProfile, setAutoSmsEnabled } = useUserStore();
  const { triggerAutoSmsSimulation } = useAgentStore();
  const [step, setStep] = useState(1);

  // Form states
  const [name, setName] = useState('');
  const [income, setIncome] = useState('');
  const [mode, setMode] = useState<'Conservative' | 'Balanced' | 'Aggressive'>('Balanced');

  // Permission prompt state
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

  const handleProfileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !income) return;

    // Proceed to Step 4 (Data Sync Preferences) instead of routing directly
    setStep(4);
  };

  const handleManualSync = () => {
    setAutoSmsEnabled(false);
    setProfile(name, parseFloat(income), mode);
    navigate('/');
  };

  const handleAutoSmsClick = () => {
    setShowPermissionPrompt(true);
  };

  const handleGrantPermission = () => {
    setShowPermissionPrompt(false);
    setAutoSmsEnabled(true);
    setProfile(name, parseFloat(income), mode);
    
    // Trigger the 30-second Zomato UPI transaction simulation
    triggerAutoSmsSimulation();
    
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center items-center px-6 py-12 max-w-lg mx-auto text-center relative overflow-hidden">
      
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 rounded-full bg-indigo-500/10 blur-[80px] pointer-events-none" />

      {/* Screen 1: Welcome */}
      {step === 1 && (
        <div className="space-y-8 max-w-sm animate-fade-in flex flex-col items-center">
          {/* Animated geometric robot illustration */}
          <div className="relative w-24 h-24 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-indigo-glow/10 shadow-lg animate-pulse mb-2">
            <Bot className="text-indigo-400 stroke-[1.5]" size={48} />
            <Sparkles className="absolute -top-1 -right-1 text-indigo-300 animate-bounce" size={20} />
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Meet FinAgent</h1>
            <p className="text-sm text-slate-400 leading-relaxed">
              Your AI financial co-pilot. Not just a chatbot — an agent that takes real action.
            </p>
          </div>

          <div className="pt-8">
            <button
              onClick={() => setStep(2)}
              className="w-full py-3.5 px-10 bg-indigo-gradient hover:from-indigo-600 hover:to-violet-700 text-white rounded-full font-bold text-sm shadow-indigo-glow transition-all flex items-center justify-center gap-2"
            >
              <span>Get Started</span>
              <ArrowRight size={14} />
            </button>
          </div>

          {/* Logos / Badges */}
          <div className="pt-12 flex flex-col items-center gap-2">
            <p className="text-[9px] uppercase font-bold text-slate-500 tracking-widest font-mono">
              Powered by
            </p>
            <div className="flex gap-3 items-center text-[10px] text-slate-400 font-mono">
              <span className="bg-slate-900 border border-white/5 px-2 py-0.5 rounded-md font-semibold">Gemini 1.5 Pro</span>
              <span className="bg-slate-900 border border-white/5 px-2 py-0.5 rounded-md font-semibold">MongoDB Atlas MCP</span>
            </div>
          </div>
        </div>
      )}

      {/* Screen 2: How It Works */}
      {step === 2 && (
        <div className="space-y-8 max-w-sm animate-fade-in w-full">
          <h2 className="text-2xl font-extrabold text-white tracking-tight">How FinAgent Works</h2>

          {/* Timeline steps */}
          <div className="relative pl-8 space-y-8 text-left border-l border-white/5 py-2">
            
            {/* Step 1 */}
            <div className="relative">
              <div className="absolute -left-11 top-0.5 w-6 h-6 rounded-full bg-indigo-950 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow">
                <MessageSquare size={12} />
              </div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wide">
                Step 1: Tell the agent
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                Just type what happened with your money naturally. No complex inputs or menus.
              </p>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="absolute -left-11 top-0.5 w-6 h-6 rounded-full bg-indigo-950 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow">
                <Bot size={12} />
              </div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wide">
                Step 2: Agent plans & acts
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                Gemini reasons through the best allocation, updating your goals and setting alerts automatically.
              </p>
            </div>

            {/* Step 3 */}
            <div className="relative">
              <div className="absolute -left-11 top-0.5 w-6 h-6 rounded-full bg-indigo-950 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow">
                <Database size={12} />
              </div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wide">
                Step 3: Stored in MongoDB
              </h3>
              <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                All logs, transactions, and balances are synced directly to MongoDB Atlas. You're always in control.
              </p>
            </div>

          </div>

          <div className="pt-4">
            <button
              onClick={() => setStep(3)}
              className="w-full py-3.5 bg-indigo-gradient hover:from-indigo-600 hover:to-violet-700 text-white rounded-full font-bold text-sm shadow-indigo-glow transition-all flex items-center justify-center gap-2"
            >
              <span>Next</span>
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      )}

      {/* Screen 3: Setup Profile */}
      {step === 3 && (
        <div className="space-y-6 max-w-sm animate-fade-in w-full text-left">
          <h2 className="text-2xl font-extrabold text-white tracking-tight text-center mb-6">
            Set up your profile
          </h2>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            
            {/* Name Input */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Your Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Arjun"
                className="w-full bg-slate-900 border border-white/10 rounded-xl py-2.5 px-4 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Income Input */}
            <div className="space-y-1">
              <label className="text-xs text-slate-400 font-medium">Monthly Income / Stipend (₹)</label>
              <input
                type="number"
                required
                value={income}
                onChange={(e) => setIncome(e.target.value)}
                placeholder="₹8,000"
                className="w-full bg-slate-900 border border-white/10 rounded-xl py-2.5 px-4 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            {/* Savings Preference Mode Toggle */}
            <div className="space-y-2">
              <label className="text-xs text-slate-400 font-medium">Savings Preference Mode</label>
              
              <div className="grid grid-cols-3 gap-2">
                {(['Conservative', 'Balanced', 'Aggressive'] as const).map((pref) => {
                  const desc = pref === 'Conservative' ? 'Save 20%' : pref === 'Balanced' ? 'Save 30%' : 'Save 50%';
                  return (
                    <button
                      key={pref}
                      type="button"
                      onClick={() => setMode(pref)}
                      className={`py-2 px-1 border rounded-xl text-center flex flex-col items-center justify-center transition-all ${
                        mode === pref
                          ? 'bg-indigo-600/20 border-indigo-500'
                          : 'bg-slate-900 border-white/5 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-white leading-none">{pref}</span>
                      <span className="text-[8px] text-slate-500 font-medium mt-1">{desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Privacy notice banner */}
            <div className="bg-slate-900 border border-white/5 rounded-xl p-3 flex items-start gap-2">
              <ShieldCheck className="text-indigo-400 shrink-0 mt-0.5" size={14} />
              <p className="text-[9px] text-slate-500 leading-normal">
                FinAgent is privacy-first. Financial data is kept locally in state and isolated from admin platform records.
              </p>
            </div>

            {/* Submit */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full py-3.5 bg-indigo-gradient hover:from-indigo-600 hover:to-violet-700 text-white rounded-full font-bold text-sm shadow-indigo-glow transition-all flex items-center justify-center gap-2"
              >
                <span>Continue</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Screen 4: Data Sync Preferences */}
      {step === 4 && (
        <div className="space-y-6 max-w-sm animate-fade-in w-full text-left relative">
          <h2 className="text-2xl font-extrabold text-white tracking-tight text-center leading-tight mb-2">
            Data Sync Preferences
          </h2>
          <p className="text-xs text-slate-400 text-center mb-6">
            How would you like to track expenses?
          </p>

          <div className="space-y-4">
            
            {/* Auto SMS Button Option */}
            <button
              type="button"
              onClick={handleAutoSmsClick}
              className="w-full text-left p-4 rounded-2xl bg-indigo-600/10 border border-indigo-500/30 hover:border-indigo-500/60 transition-all flex items-start gap-3.5 relative group shadow-md"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center shrink-0 text-indigo-400 mt-1">
                <Bot size={16} className="group-hover:scale-110 transition-transform" />
              </div>
              <div className="flex-1 min-w-0 pr-12">
                <p className="text-xs font-bold text-white flex items-center gap-1.5 leading-none">
                  <span>🤖 Auto-detect from SMS</span>
                  <span className="text-[8px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.5 rounded-full uppercase font-bold tracking-wider">Recommended</span>
                </p>
                <p className="text-[10px] text-slate-400 leading-normal mt-1.5">
                  Agent reads your incoming transaction SMS and logs them automatically. No manual entry needed.
                </p>
              </div>
            </button>

            {/* Manual Button Option */}
            <button
              type="button"
              onClick={handleManualSync}
              className="w-full text-left p-4 rounded-2xl bg-slate-900 border border-white/5 hover:border-white/10 transition-all flex items-start gap-3.5 group hover:bg-slate-900/80"
            >
              <div className="w-8 h-8 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center shrink-0 text-slate-400 mt-1">
                <X size={14} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white leading-none">
                  <span>✏️ I'll enter manually</span>
                </p>
                <p className="text-[10px] text-slate-400 leading-normal mt-1.5">
                  Enter your own transactions. Agent will still automatically categorize and analyze them for budgets.
                </p>
              </div>
            </button>
          </div>

          {/* SMS explanation badge */}
          <div className="bg-slate-900/50 border border-white/5 rounded-xl p-3 flex items-start gap-2.5 mt-8">
            <Mail className="text-indigo-400 shrink-0 mt-0.5" size={14} />
            <p className="text-[9px] text-slate-500 leading-relaxed">
              <strong>SMS Parsing</strong>: Tapping Auto SMS reads incoming transaction alerts (e.g. UPI debit notifications) and extracts amounts, merchants, and categories automatically. Secure, local, and requires zero manual effort.
            </p>
          </div>

          {/* SIMULATED SYSTEM PERMISSION SHEET MODAL */}
          {showPermissionPrompt && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-fade-in">
              <div className="w-full max-w-xs bg-slate-900 border border-white/10 rounded-2xl p-5 shadow-2xl space-y-4 text-center">
                <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
                  <ShieldAlert size={20} />
                </div>
                
                <div className="space-y-1.5">
                  <h4 className="text-xs font-bold text-white">Allow FinAgent SMS Permission?</h4>
                  <p className="text-[10px] text-slate-400 leading-relaxed">
                    FinAgent requires permission to read incoming text messages to parse transactional debits in real-time.
                  </p>
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowPermissionPrompt(false)}
                    className="flex-1 py-2 border border-white/5 hover:border-white/10 bg-slate-950 text-slate-400 hover:text-white rounded-full text-[10px] font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleGrantPermission}
                    className="flex-1 py-2 bg-indigo-gradient hover:from-indigo-600 hover:to-violet-700 text-white rounded-full text-[10px] font-bold"
                  >
                    Auto SMS
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
