import { useState } from 'react';
import { Trophy, Flame, Target, Star, Users, Plus, X, Award, Loader2, Check } from 'lucide-react';
import { useUserStore, useAgentStore } from '../stores/useFinanceStore';
import { inr } from '../lib/constants';

export default function Community() {
  const { profile } = useUserStore();
  const { addActivityLog, setCurrentNotification } = useAgentStore();
  const name = (profile.fullName || profile.username || 'You').split(' ')[0];

  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteSuccess, setInviteSuccess] = useState(false);
  const [challengeName, setChallengeName] = useState('');
  const [duration, setDuration] = useState('2 weeks');
  const [target, setTarget] = useState('');
  const [friends, setFriends] = useState('');
  const [creating, setCreating] = useState(false);

  const myself = profile.savedByAi || 2500;
  const leaderboard = [
    { rank: '🥇', name: `You (${name})`, saved: myself, pct: 82, isUser: true, initials: name.slice(0, 2).toUpperCase(), color: 'bg-indigo-600' },
    { rank: '🥈', name: 'Priya N.', saved: Math.round(myself * 0.86), pct: 71, isUser: false, initials: 'PN', color: 'bg-emerald-600' },
    { rank: '🥉', name: 'Rahul V.', saved: Math.round(myself * 0.72), pct: 58, isUser: false, initials: 'RV', color: 'bg-emerald-600' },
    { rank: '4', name: 'Aisha K.', saved: Math.round(myself * 0.55), pct: 44, isUser: false, initials: 'AK', color: 'bg-amber-600' },
    { rank: '5', name: 'Dev P.', saved: Math.round(myself * 0.4), pct: 33, isUser: false, initials: 'DP', color: 'bg-amber-600' },
  ];

  const createChallenge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!challengeName || !target) return;
    setCreating(true);
    await new Promise((r) => setTimeout(r, 1100));
    addActivityLog({ category: 'COMMUNITY', description: `Started "${challengeName}" challenge (save ${inr(Number(target))} in ${duration}) and sent invites.` });
    setCurrentNotification({ emoji: '🔥', title: 'Challenge started', message: `"${challengeName}" is live. Invites sent — good luck!` });
    setCreating(false); setIsCreateOpen(false);
    setChallengeName(''); setTarget(''); setFriends('');
  };

  const invite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName) return;
    setInviteSuccess(true);
    addActivityLog({ category: 'COMMUNITY', description: `Invited ${inviteName} to the July No-Spend Weekend challenge.` });
    setTimeout(() => { setInviteSuccess(false); setIsInviteOpen(false); setInviteName(''); }, 1100);
  };

  const badges = [
    { name: 'Budget Master', icon: Trophy, tone: 'text-amber-500 bg-amber-500/10 border-amber-500/20', earned: profile.badges.includes('Budget Master') },
    { name: '7-Day Streak', icon: Flame, tone: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20', earned: profile.badges.includes('7-Day Streak') },
    { name: 'First Goal Saved', icon: Target, tone: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20', earned: profile.badges.includes('First Goal Saved') },
    { name: 'Consistency King', icon: Award, tone: 'text-slate-500 bg-slate-800 border-white/5', earned: profile.badges.includes('Consistency King') },
    { name: 'Savings Legend', icon: Award, tone: 'text-slate-500 bg-slate-800 border-white/5', earned: false },
    { name: 'Zero-Waste Week', icon: Award, tone: 'text-slate-500 bg-slate-800 border-white/5', earned: false },
  ];

  const input = 'w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 px-4 text-white text-sm focus:outline-none focus:border-indigo-500';

  return (
    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
      <div className="max-w-lg mx-auto px-4 py-4">
        <div className="mb-5">
          <h1 className="text-xl font-extrabold text-white tracking-tight">Savings Challenges</h1>
          <p className="text-xs text-slate-400">Compete with friends, build real habits</p>
        </div>

        {/* Active challenge */}
        <div className="glass-card rounded-2xl p-4 mb-5">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h2 className="text-sm font-extrabold text-white">July No-Spend Weekend 🔥</h2>
              <p className="text-[10px] text-slate-500 mt-1">5 participants · 9 days remaining</p>
            </div>
            <span className="text-[9px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full font-bold">Live</span>
          </div>
          <div className="space-y-3 mt-4 border-t border-white/5 pt-4">
            {leaderboard.map((item) => (
              <div key={item.name} className="flex items-center gap-3">
                <span className="text-xs font-bold font-mono w-4 text-center shrink-0">{item.rank}</span>
                <div className={`w-7 h-7 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0 ${item.color}`}>{item.initials}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between text-xs font-semibold mb-1">
                    <span className={item.isUser ? 'text-indigo-400 font-bold' : 'text-slate-200'}>{item.name}</span>
                    <span className="font-mono text-slate-400 text-[10px]">{inr(item.saved)} <span className="text-slate-600">({item.pct}%)</span></span>
                  </div>
                  <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-white/5">
                    <div className={`h-full rounded-full ${item.isUser ? 'bg-indigo-500' : 'bg-emerald-500'}`} style={{ width: `${item.pct}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button onClick={() => setIsInviteOpen(true)} className="w-full mt-4 py-2 border border-dashed border-white/10 hover:border-indigo-500/40 text-slate-400 hover:text-white rounded-xl text-xs font-semibold transition-all bg-slate-900/40 flex items-center justify-center gap-1.5">
            <Plus size={14} /> Invite a Friend
          </button>
        </div>

        {/* Rewards */}
        <div className="space-y-4 mb-5">
          <h2 className="text-sm font-bold text-slate-200 uppercase tracking-wide">Your Rewards</h2>
          <div className="glass-card rounded-2xl p-4 flex justify-between items-center">
            <div className="space-y-2 flex-1">
              <div className="flex justify-between items-baseline">
                <span className="text-base font-extrabold text-white">{profile.xp} XP</span>
                <span className="text-[10px] text-indigo-400 font-bold uppercase tracking-wider">{profile.level}</span>
              </div>
              <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-white/5">
                <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, (profile.xp / profile.xpToNext) * 100)}%` }} />
              </div>
              <div className="flex justify-between text-[9px] text-slate-500 font-medium"><span>Next: {profile.nextLevel}</span><span>{profile.xp} / {profile.xpToNext} XP</span></div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            {badges.map((b) => {
              const Icon = b.icon;
              return (
                <div key={b.name} className={`glass-card rounded-xl p-3 text-center flex flex-col items-center ${b.earned ? '' : 'opacity-40'}`}>
                  <div className={`w-10 h-10 rounded-full border flex items-center justify-center mb-2 ${b.tone}`}><Icon size={20} /></div>
                  <p className="text-[10px] font-bold text-slate-200">{b.name}</p>
                  <p className="text-[8px] text-slate-500 font-mono mt-0.5">{b.earned ? 'Earned' : 'Locked'}</p>
                </div>
              );
            })}
          </div>
        </div>

        <button onClick={() => setIsCreateOpen(true)} className="w-full py-3.5 bg-indigo-gradient text-white rounded-full font-bold text-xs shadow-indigo-glow flex items-center justify-center gap-1.5 uppercase tracking-wider">
          <Flame size={14} /> Start New Challenge
        </button>
      </div>

      {/* Invite modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={() => setIsInviteOpen(false)}>
          <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-2xl p-5 relative" onClick={(e) => e.stopPropagation()}>
            <button onClick={() => setIsInviteOpen(false)} className="absolute top-4 right-4 p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white"><X size={14} /></button>
            <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-1.5"><Users size={16} className="text-indigo-400" /> Invite Friends</h3>
            {inviteSuccess ? (
              <div className="text-center py-6 space-y-2">
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto animate-bounce"><Star size={20} /></div>
                <p className="text-xs font-bold text-white">Invite sent!</p>
              </div>
            ) : (
              <form onSubmit={invite} className="space-y-4">
                <input required value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Friend's name" className={input} />
                <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-full">Send Invitation</button>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Create challenge modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="absolute inset-0" onClick={() => !creating && setIsCreateOpen(false)} />
          <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-t-3xl rounded-b-xl shadow-2xl p-6 z-10">
            {creating && (
              <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 z-20 rounded-t-3xl rounded-b-xl gap-3">
                <Loader2 className="text-indigo-400 animate-spin" size={28} />
                <p className="text-sm font-bold text-white">Starting your challenge…</p>
              </div>
            )}
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-lg font-bold text-white">Start New Challenge</h2>
              <button onClick={() => setIsCreateOpen(false)} className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white"><X size={16} /></button>
            </div>
            <form onSubmit={createChallenge} className="space-y-4">
              <div className="space-y-1"><label className="text-xs text-slate-400 font-medium">Challenge name</label><input required value={challengeName} onChange={(e) => setChallengeName(e.target.value)} placeholder="e.g. No-Caffeine Week" className={input} /></div>
              <div className="space-y-1"><label className="text-xs text-slate-400 font-medium">Duration</label>
                <select value={duration} onChange={(e) => setDuration(e.target.value)} className={input}><option>1 week</option><option>2 weeks</option><option>1 month</option></select>
              </div>
              <div className="space-y-1"><label className="text-xs text-slate-400 font-medium">Savings target (₹)</label><input required type="number" value={target} onChange={(e) => setTarget(e.target.value)} placeholder="1000" className={input} /></div>
              <div className="space-y-1"><label className="text-xs text-slate-400 font-medium">Invite friends (comma-separated)</label><input value={friends} onChange={(e) => setFriends(e.target.value)} placeholder="Priya, Rahul, Dev" className={input} /></div>
              <button type="submit" className="w-full py-3 bg-indigo-gradient text-white rounded-full font-semibold text-sm shadow-indigo-glow flex items-center justify-center gap-2">Launch Challenge <Check size={14} /></button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
