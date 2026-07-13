import { useEffect, useRef, useState } from 'react';
import { X, Send, Trophy, GraduationCap, Loader2, UserMinus, Bot } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { relativeTime } from '../lib/constants';

interface PublicProfile {
  username: string; fullName: string; level: string; xp: number; xpToNext: number;
  badges: string[]; collegeName: string; agentPersona: string; memberSince: string | null;
}
interface Msg { id: string; fromMe: boolean; text: string; date: string; }

interface Props {
  username: string | null;
  onClose: () => void;
  onChanged?: () => void;
}

export default function FriendChat({ username, onClose, onChanged }: Props) {
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!username) return;
    let alive = true;
    setLoading(true);
    Promise.all([
      apiFetch(`/api/users/${username}/public`).catch(() => null),
      apiFetch(`/api/me/friends/${username}/messages`).catch(() => []),
    ]).then(([p, m]) => {
      if (!alive) return;
      setProfile(p); setMessages(m || []); setLoading(false);
    });
    return () => { alive = false; };
  }, [username]);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, loading]);

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || sending || !username) return;
    setSending(true);
    const text = input.trim();
    setInput('');
    try {
      const msg = await apiFetch(`/api/me/friends/${username}/messages`, { method: 'POST', body: { text } });
      setMessages((m) => [...m, msg]);
    } catch { /* ignore */ } finally { setSending(false); }
  };

  const removeFriend = async () => {
    if (!username) return;
    try { await apiFetch(`/api/me/friends/${username}`, { method: 'DELETE' }); } catch {}
    onChanged?.();
    onClose();
  };

  if (!username) return null;
  const initials = (profile?.fullName || username).split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-sm h-full bg-slate-950 border-l border-white/5 flex flex-col shadow-2xl" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="p-3 px-4 border-b border-white/5 bg-slate-900 flex items-center justify-between shrink-0">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Friend</span>
          <button onClick={onClose} className="p-1.5 rounded-full bg-slate-800 text-slate-400 hover:text-white"><X size={16} /></button>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-slate-500"><Loader2 className="animate-spin" size={22} /></div>
        ) : (
          <>
            {/* Public profile */}
            <div className="p-4 border-b border-white/5 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl bg-indigo-gradient text-white text-lg font-extrabold flex items-center justify-center shadow-indigo-glow/30 shadow-md">{initials}</div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-extrabold text-white truncate">{profile?.fullName}</h2>
                  <p className="text-xs text-slate-400">@{profile?.username}</p>
                  {profile?.collegeName && <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5 truncate"><GraduationCap size={10} /> {profile.collegeName}</p>}
                </div>
              </div>

              <div className="mt-3 flex items-center gap-2">
                <span className="text-[9px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><Trophy size={9} /> {profile?.level}</span>
                <div className="flex-1 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, ((profile?.xp || 0) / (profile?.xpToNext || 300)) * 100)}%` }} />
                </div>
                <span className="text-[9px] text-slate-500 font-mono">{profile?.xp}/{profile?.xpToNext}</span>
              </div>

              {!!profile?.badges?.length && (
                <div className="mt-3">
                  <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider mb-1.5">Achievements</p>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.badges.map((b) => (
                      <span key={b} className="text-[10px] bg-amber-500/10 border border-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full font-bold">🏅 {b}</span>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-[9px] text-slate-600 mt-3">Only public info is shown — spending & personal details stay private.</p>
            </div>

            {/* Chat thread */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {messages.length === 0 && <p className="text-center text-xs text-slate-500 py-8">Say hi to {profile?.fullName?.split(' ')[0]} 👋</p>}
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.fromMe ? 'justify-end' : 'justify-start'} items-end gap-2`}>
                  {!m.fromMe && <div className="w-6 h-6 rounded-full bg-slate-700 text-white text-[8px] font-bold flex items-center justify-center shrink-0">{initials}</div>}
                  <div className="max-w-[75%]">
                    <div className={`rounded-2xl p-2.5 px-3.5 text-xs leading-relaxed ${m.fromMe ? 'bg-indigo-600 text-white' : 'bg-slate-800 text-slate-200'}`}>{m.text}</div>
                    <p className={`text-[8px] text-slate-600 mt-0.5 ${m.fromMe ? 'text-right' : ''}`}>{relativeTime(m.date)}</p>
                  </div>
                </div>
              ))}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <form onSubmit={send} className="p-3 px-4 border-t border-white/5 bg-slate-950 shrink-0 flex items-center gap-2">
              <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={`Message ${profile?.fullName?.split(' ')[0] || ''}…`}
                className="flex-1 bg-slate-900 border border-white/10 rounded-full py-2 px-4 text-white text-xs focus:outline-none focus:border-indigo-500" />
              <button type="submit" disabled={!input.trim() || sending} className="w-8 h-8 rounded-full bg-indigo-gradient flex items-center justify-center text-white disabled:opacity-40 shrink-0"><Send size={13} /></button>
            </form>

            <div className="px-4 py-2 border-t border-white/5 bg-slate-900 flex items-center justify-between">
              <span className="text-[9px] text-slate-500 flex items-center gap-1"><Bot size={10} className="text-indigo-400" /> {profile?.agentPersona} vibe</span>
              <button onClick={removeFriend} className="text-[9px] text-slate-500 hover:text-rose-400 font-semibold flex items-center gap-1"><UserMinus size={10} /> Remove friend</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
