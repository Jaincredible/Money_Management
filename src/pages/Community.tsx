import { useState } from 'react';
import { Bot, Trophy, Flame, Target, Star, Users, Plus, X, Award, ArrowRight } from 'lucide-react';
import { useUserStore, useAgentStore } from '../stores/useFinanceStore';

export default function Community() {
  const { name, xp, level, nextLevel, xpToNext, addXp } = useUserStore();
  const { addActivityLog } = useAgentStore();

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // New Challenge Form states
  const [challengeName, setChallengeName] = useState('');
  const [duration, setDuration] = useState('2 weeks');
  const [target, setTarget] = useState('');
  const [friends, setFriends] = useState('');
  
  // Loading states
  const [isCreating, setIsCreating] = useState(false);
  const [createStep, setCreateStep] = useState(0);

  const leaderboard = [
    { rank: '🥇', name: `You (${name})`, saved: 2500, pct: 78, isUser: true, initials: name.substring(0, 2).toUpperCase(), color: 'bg-indigo-600' },
    { rank: '🥈', name: name === 'Priya' ? 'Arjun' : 'Priya', saved: 2100, pct: 65, isUser: false, initials: name === 'Priya' ? 'AJ' : 'PR', color: 'bg-emerald-600' },
    { rank: '🥉', name: name === 'Rahul' ? 'Arjun' : 'Rahul', saved: 1800, pct: 56, isUser: false, initials: name === 'Rahul' ? 'AJ' : 'RH', color: 'bg-emerald-600' },
    { rank: '4', name: name === 'Aisha' ? 'Arjun' : 'Aisha', saved: 1200, pct: 37, isUser: false, initials: name === 'Aisha' ? 'AJ' : 'AS', color: 'bg-amber-600' },
    { rank: '5', name: name === 'Dev' ? 'Arjun' : 'Dev', saved: 900, pct: 28, isUser: false, initials: name === 'Dev' ? 'AJ' : 'DV', color: 'bg-amber-600' },
  ];

  const handleCreateChallenge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeName || !target) return;

    setIsCreating(true);
    setCreateStep(1);

    setTimeout(() => {
      setCreateStep(2);
      setTimeout(() => {
        setIsCreating(false);
        setIsCreateOpen(false);
        
        // Add activity log
        addActivityLog({
          category: 'COMMUNITY',
          description: `Created challenge: "${challengeName}" with saving target ₹${target}. Invites sent.`,
          mongoOperation: `db.challenges.insertOne({ name: "${challengeName}", duration: "${duration}", target: ${target}, invitees: ["Priya", "Rahul"] })`
        });

        // Award XP for creating a challenge
        addXp(40);

        // Reset
        setChallengeName('');
        setTarget('');
        setFriends('');
      }, 1000);
    }, 1000);
  };

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName) return;

    setInviteSuccess(true);
    setTimeout(() => {
      setInviteSuccess(false);
      setIsInviteOpen(false);
      
      addActivityLog({
        category: 'COMMUNITY',
        description: `Sent invitation to ${inviteName} to join June No-Spend Challenge.`,
        mongoOperation: `db.challenges.updateOne({ name: "June No-Spend Challenge" }, { $push: { invitees: "${inviteName}" } })`
      });

      setInviteName('');
    }, 1200);
  };

  return (
    <div className="min-h-screen pb-20 px-4 pt-4 max-w-lg mx-auto bg-background custom-scrollbar overflow-y-auto">
      
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-extrabold text-white tracking-tight">Savings Challenges</h1>
        <p className="text-xs text-slate-400 font-medium">Compete with friends, build real habits.</p>
      </div>

      {/* Active Challenge Card */}
      <div className="glass-card rounded-2xl p-4 mb-5 animate-fade-in relative">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h2 className="text-sm font-extrabold text-white flex items-center gap-1.5 leading-none">
              <span>June No-Spend Challenge 🔥</span>
            </h2>
            <p className="text-[10px] text-slate-500 font-medium mt-1">
              5 participants · 12 days remaining
            </p>
          </div>
          
          <span className="text-[9px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-bold font-mono">
            Agent Tracking via Atlas
          </span>
        </div>

        {/* Leaderboard List */}
        <div className="space-y-3 mt-4 border-t border-white/5 pt-4">
          {leaderboard.map((item) => (
            <div key={item.name} className="flex items-center gap-3">
              {/* Rank */}
              <span className="text-xs font-bold font-mono w-4 text-center shrink-0">
                {item.rank}
              </span>
              
              {/* Initials Avatar */}
              <div className={`w-7 h-7 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0 ${item.color}`}>
                {item.initials}
              </div>

              {/* Name and Saved details */}
              <div className="flex-1 min-w-0">
                <div className="flex justify-between text-xs font-semibold mb-1">
                  <span className={item.isUser ? 'text-indigo-400 font-bold' : 'text-slate-200'}>
                    {item.name}
                  </span>
                  <span className="font-mono text-slate-400 text-[10px]">
                    ₹{item.saved.toLocaleString()} <span className="text-slate-600">({item.pct}%)</span>
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-white/5">
                  <div
                    className={`h-full rounded-full ${
                      item.isUser ? 'bg-indigo-500 shadow shadow-indigo-glow/20' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${item.pct}%` }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Invite Friend button */}
        <button
          onClick={() => setIsInviteOpen(true)}
          className="w-full mt-4 py-2 border border-dashed border-white/10 hover:border-indigo-500/40 text-slate-400 hover:text-white rounded-xl text-xs font-semibold tracking-wide transition-all bg-slate-900/40 flex items-center justify-center gap-1.5"
        >
          <Plus size={14} />
          <span>Invite a Friend</span>
        </button>
      </div>

      {/* Rewards & XP Section */}
      <div className="space-y-4 mb-5">
        <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Your Rewards</h2>

        {/* XP Card */}
        <div className="glass-card rounded-2xl p-4 flex justify-between items-center relative overflow-hidden">
          <div className="space-y-2 flex-1">
            <div className="flex justify-between items-baseline">
              <span className="text-base font-extrabold text-white">{xp} XP</span>
              <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">{level}</span>
            </div>
            
            {/* Progress bar */}
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-white/5">
              <div
                className="h-full bg-indigo-500 rounded-full"
                style={{ width: `${(xp / xpToNext) * 100}%` }}
              />
            </div>

            <div className="flex justify-between text-[9px] text-slate-500 font-medium">
              <span>Next Level: {nextLevel}</span>
              <span>{xp} / {xpToNext} XP</span>
            </div>
          </div>

          <div className="ml-6 shrink-0 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-[10px] px-2.5 py-1 rounded-full flex items-center gap-1">
            <Flame size={12} />
            <span>+50 XP last week</span>
          </div>
        </div>

        {/* Badges Grid (3 columns) */}
        <div className="grid grid-cols-3 gap-3">
          {/* Badge 1 */}
          <div className="glass-card rounded-xl p-3 text-center flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 mb-2">
              <Trophy size={20} />
            </div>
            <p className="text-[10px] font-bold text-slate-200">Budget Master</p>
            <p className="text-[8px] text-slate-500 font-mono mt-0.5">June 1</p>
          </div>

          {/* Badge 2 */}
          <div className="glass-card rounded-xl p-3 text-center flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 mb-2">
              <Flame size={20} />
            </div>
            <p className="text-[10px] font-bold text-slate-200">7-Day Streak</p>
            <p className="text-[8px] text-slate-500 font-mono mt-0.5">May 28</p>
          </div>

          {/* Badge 3 */}
          <div className="glass-card rounded-xl p-3 text-center flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-2">
              <Target size={20} />
            </div>
            <p className="text-[10px] font-bold text-slate-200">First Goal Saved</p>
            <p className="text-[8px] text-slate-500 font-mono mt-0.5">May 15</p>
          </div>

          {/* Locked Badge 1 */}
          <div className="glass-card rounded-xl p-3 text-center flex flex-col items-center opacity-40">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center text-slate-500 mb-2">
              <Award size={20} />
            </div>
            <p className="text-[10px] font-bold text-slate-400">Consistency King</p>
            <p className="text-[8px] text-slate-600 font-mono mt-0.5">Locked</p>
          </div>

          {/* Locked Badge 2 */}
          <div className="glass-card rounded-xl p-3 text-center flex flex-col items-center opacity-40">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center text-slate-500 mb-2">
              <Award size={20} />
            </div>
            <p className="text-[10px] font-bold text-slate-400">Savings Legend</p>
            <p className="text-[8px] text-slate-600 font-mono mt-0.5">Locked</p>
          </div>

          {/* Locked Badge 3 */}
          <div className="glass-card rounded-xl p-3 text-center flex flex-col items-center opacity-40">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center text-slate-500 mb-2">
              <Award size={20} />
            </div>
            <p className="text-[10px] font-bold text-slate-400">Zero Waste Week</p>
            <p className="text-[8px] text-slate-600 font-mono mt-0.5">Locked</p>
          </div>
        </div>
      </div>

      {/* Start New Challenge button */}
      <button
        onClick={() => setIsCreateOpen(true)}
        className="w-full py-3.5 bg-indigo-gradient hover:from-indigo-600 hover:to-violet-700 text-white rounded-full font-bold text-xs shadow-indigo-glow transition-all flex items-center justify-center gap-1.5 uppercase tracking-wider"
      >
        <Flame size={14} />
        <span>Start New Challenge</span>
      </button>

      {/* Invite Friend Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl p-5 shadow-2xl relative">
            <button
              onClick={() => setIsInviteOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white"
            >
              <X size={14} />
            </button>

            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-1.5">
              <Users size={16} className="text-indigo-400" />
              <span>Invite Friends</span>
            </h3>

            {inviteSuccess ? (
              <div className="text-center py-6 space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2 animate-bounce">
                  <Star size={20} />
                </div>
                <p className="text-xs font-bold text-white">Invite Sent Successfully!</p>
                <p className="text-[10px] text-slate-500 font-mono">db.challenges.updateOne() updated</p>
              </div>
            ) : (
              <form onSubmit={handleInviteSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Friend's Name</label>
                  <input
                    type="text"
                    required
                    value={inviteName}
                    onChange={(e) => setInviteName(e.target.value)}
                    placeholder="e.g. Nikita, Rohan"
                    className="w-full bg-slate-950 border border-white/10 rounded-xl py-2 px-3 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-full shadow transition-all"
                >
                  Send Invitation
                </button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Create Challenge Modal Sheet */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="absolute inset-0" onClick={() => !isCreating && setIsCreateOpen(false)} />

          <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-t-3xl rounded-b-xl shadow-2xl p-6 z-10">
            
            {/* Loading Overlay */}
            {isCreating && (
              <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 z-20">
                <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center mb-6 border border-indigo-500/20">
                  <Bot className="text-indigo-400 animate-spin" size={24} />
                </div>
                <h3 className="text-base font-bold text-white mb-4">Starting Challenge</h3>

                <div className="w-full max-w-xs space-y-3 font-mono text-xs text-left pl-4">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${createStep >= 1 ? 'bg-indigo-400 animate-pulse' : 'bg-slate-700'}`} />
                    <span className={createStep >= 1 ? 'text-indigo-300' : 'text-slate-500'}>
                      {createStep === 1 ? '🤖 Agent creating challenge in MongoDB...' : '✓ Created in MongoDB'}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${createStep >= 2 ? 'bg-emerald-400' : 'bg-slate-700'}`} />
                    <span className={createStep >= 2 ? 'text-emerald-300' : 'text-slate-500'}>
                      ✓ Challenge live! Invites sent.
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Header */}
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <span>Start New Challenge</span>
                <span className="text-[10px] bg-slate-800 text-slate-400 border border-white/5 px-2 py-0.5 rounded-full font-mono font-medium">
                  db.challenges.insertOne()
                </span>
              </h2>
              
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateChallenge} className="space-y-4">
              
              {/* Challenge Name */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Challenge Name</label>
                <input
                  type="text"
                  required
                  value={challengeName}
                  onChange={(e) => setChallengeName(e.target.value)}
                  placeholder="e.g., No Caffeine Week, Zomato Diet"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Duration dropdown */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Duration</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="1 week">1 week</option>
                  <option value="2 weeks">2 weeks</option>
                  <option value="1 month">1 month</option>
                </select>
              </div>

              {/* Target Amount */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Savings Target (₹)</label>
                <input
                  type="number"
                  required
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  placeholder="₹1000"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Invite Friends */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Invite Friends (Comma separated)</label>
                <input
                  type="text"
                  value={friends}
                  onChange={(e) => setFriends(e.target.value)}
                  placeholder="e.g., Priya, Rahul, Dev"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full py-3 bg-indigo-gradient hover:from-indigo-600 hover:to-violet-700 text-white rounded-full font-semibold text-sm shadow-indigo-glow transition-all flex items-center justify-center gap-2"
              >
                <span>Launch Challenge</span>
                <ArrowRight size={14} />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
