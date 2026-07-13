import { useEffect, useState, useCallback } from 'react';
import { UserPlus, Inbox, SendHorizonal, Search, Check, X, Loader2, Users, Trophy, MessageSquare } from 'lucide-react';
import { apiFetch } from '../lib/api';
import { loadUserData, useAgentStore } from '../stores/useFinanceStore';
import FriendChat from '../components/FriendChat';

interface Pub { username: string; fullName: string; level: string; xp: number; xpToNext: number; badges: string[]; collegeName: string; }
interface FriendsData { friends: Pub[]; incoming: { requestId: string; from: Pub }[]; sent: { requestId: string; to: Pub }[]; }
type SearchRow = Pub & { relationship: 'none' | 'friends' | 'sent' | 'incoming' | 'self' };

const initials = (name: string) => name.split(' ').map((s) => s[0]).slice(0, 2).join('').toUpperCase();

export default function Friends() {
  const { friendUnread } = useAgentStore();
  const [data, setData] = useState<FriendsData>({ friends: [], incoming: [], sent: [] });
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<'add' | 'requests' | 'sent' | null>(null);
  const [chatUser, setChatUser] = useState<string | null>(null);
  const [listQuery, setListQuery] = useState('');

  // Add-friend search
  const [q, setQ] = useState('');
  const [results, setResults] = useState<SearchRow[]>([]);
  const [searching, setSearching] = useState(false);

  const refresh = useCallback(async () => {
    try { setData(await apiFetch('/api/me/friends')); } catch { /* ignore */ } finally { setLoading(false); }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const runSearch = useCallback(async (query: string) => {
    if (!query.trim()) { setResults([]); return; }
    setSearching(true);
    try { setResults(await apiFetch(`/api/users/search?q=${encodeURIComponent(query.trim())}`)); }
    catch { setResults([]); } finally { setSearching(false); }
  }, []);

  useEffect(() => {
    if (modal !== 'add') return;
    const t = setTimeout(() => runSearch(q), 250);
    return () => clearTimeout(t);
  }, [q, modal, runSearch]);

  const addFriend = async (username: string) => {
    try { await apiFetch('/api/me/friends/request', { method: 'POST', body: { toUsername: username } }); } catch {}
    await refresh(); runSearch(q);
  };
  const respond = async (requestId: string, action: 'accept' | 'decline') => {
    try { await apiFetch('/api/me/friends/respond', { method: 'POST', body: { requestId, action } }); } catch {}
    await refresh(); if (modal === 'add') runSearch(q);
    if (action === 'accept') loadUserData(); // reflect any XP/notif changes
  };
  const acceptByUsername = async (username: string) => {
    const r = data.incoming.find((x) => x.from.username === username);
    if (r) await respond(r.requestId, 'accept');
  };
  const cancel = async (requestId: string) => {
    try { await apiFetch('/api/me/friends/cancel', { method: 'POST', body: { requestId } }); } catch {}
    await refresh(); if (modal === 'add') runSearch(q);
  };

  const filteredFriends = data.friends.filter((f) =>
    f.fullName.toLowerCase().includes(listQuery.toLowerCase()) || f.username.includes(listQuery.toLowerCase()));

  const relBtn = (r: SearchRow) => {
    if (r.relationship === 'friends') return <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1"><Check size={11} /> Friends</span>;
    if (r.relationship === 'sent') return <span className="text-[10px] text-slate-500 font-bold">Requested</span>;
    if (r.relationship === 'incoming') return <button onClick={() => acceptByUsername(r.username)} className="text-[10px] font-bold bg-emerald-600 text-white px-3 py-1.5 rounded-full">Accept</button>;
    return <button onClick={() => addFriend(r.username)} className="text-[10px] font-bold bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded-full flex items-center gap-1"><UserPlus size={11} /> Add</button>;
  };

  const PersonRow = ({ p, right }: { p: Pub; right?: React.ReactNode }) => (
    <div className="flex items-center gap-3 bg-slate-900/70 border border-white/5 rounded-xl p-2.5">
      <div className="w-9 h-9 rounded-full bg-indigo-500/20 border border-indigo-500/30 text-indigo-200 text-[11px] font-bold flex items-center justify-center shrink-0">{initials(p.fullName || p.username)}</div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-white truncate">{p.fullName}</p>
        <p className="text-[10px] text-slate-500 flex items-center gap-1 truncate">@{p.username} · <Trophy size={9} className="text-amber-400" /> {p.level}</p>
      </div>
      {right}
    </div>
  );

  const tabBtn = (key: 'add' | 'requests' | 'sent', label: string, Icon: any, count: number) => (
    <button onClick={() => setModal(key)} className="relative flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl bg-slate-900 border border-white/5 hover:border-indigo-500/40 transition-all">
      <Icon size={17} className="text-indigo-400" />
      <span className="text-[10px] font-bold text-slate-300">{label}</span>
      {count > 0 && <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 bg-rose-500 rounded-full border border-slate-950 text-[8px] font-bold text-white flex items-center justify-center">{count}</span>}
    </button>
  );

  return (
    <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar">
      <div className="max-w-lg mx-auto px-4 py-4 space-y-4">
        <div>
          <h1 className="text-xl font-extrabold text-white tracking-tight">Friends</h1>
          <p className="text-xs text-slate-400">Connect, compare progress, and cheer each other on</p>
        </div>

        {/* 3 action tabs with notification badges */}
        <div className="flex gap-2.5">
          {tabBtn('add', 'Add Friend', UserPlus, 0)}
          {tabBtn('requests', 'Requests', Inbox, data.incoming.length)}
          {tabBtn('sent', 'Sent', SendHorizonal, data.sent.length)}
        </div>

        {/* Friends list + search */}
        <div className="relative">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input value={listQuery} onChange={(e) => setListQuery(e.target.value)} placeholder="Search your friends by username…"
            className="w-full bg-slate-900 border border-white/10 rounded-full py-2.5 pl-9 pr-4 text-white text-xs focus:outline-none focus:border-indigo-500" />
        </div>

        {loading ? (
          <div className="flex justify-center py-10 text-slate-500"><Loader2 className="animate-spin" size={22} /></div>
        ) : filteredFriends.length === 0 ? (
          <div className="glass-card rounded-2xl p-8 text-center space-y-2">
            <Users size={26} className="mx-auto text-slate-600" />
            <p className="text-sm font-bold text-white">{data.friends.length === 0 ? 'No friends yet' : 'No match'}</p>
            <p className="text-xs text-slate-400">{data.friends.length === 0 ? 'Tap "Add Friend" to search by username and send a request.' : 'Try a different name.'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredFriends.map((f) => {
              const unread = friendUnread?.byUsername?.[f.username] || 0;
              return (
                <button key={f.username} onClick={() => setChatUser(f.username)} className="w-full text-left">
                  <PersonRow p={f} right={
                    <span className="flex items-center gap-2">
                      {unread > 0 && <span className="min-w-[18px] h-[18px] px-1 bg-rose-500 rounded-full text-[9px] font-bold text-white flex items-center justify-center">{unread > 9 ? '9+' : unread}</span>}
                      <span className="text-indigo-400 flex items-center gap-1 text-[10px] font-bold"><MessageSquare size={12} /> Chat</span>
                    </span>
                  } />
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Friend modal */}
      {modal === 'add' && (
        <Modal title="Add a friend" onClose={() => { setModal(null); setQ(''); setResults([]); }}>
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by username or name…"
              className="w-full bg-slate-950 border border-white/10 rounded-full py-2.5 pl-9 pr-4 text-white text-xs focus:outline-none focus:border-indigo-500" />
          </div>
          <div className="space-y-2 max-h-[50vh] overflow-y-auto custom-scrollbar">
            {searching && <div className="flex justify-center py-4 text-slate-500"><Loader2 className="animate-spin" size={18} /></div>}
            {!searching && q && results.length === 0 && <p className="text-center text-xs text-slate-500 py-4">No users found for "{q}".</p>}
            {results.map((r) => <PersonRow key={r.username} p={r} right={relBtn(r)} />)}
          </div>
        </Modal>
      )}

      {/* Requests (incoming) modal */}
      {modal === 'requests' && (
        <Modal title={`Friend requests (${data.incoming.length})`} onClose={() => setModal(null)}>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {data.incoming.length === 0 && <p className="text-center text-xs text-slate-500 py-6">No pending requests.</p>}
            {data.incoming.map((r) => (
              <PersonRow key={r.requestId} p={r.from} right={
                <div className="flex gap-1.5">
                  <button onClick={() => respond(r.requestId, 'accept')} className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center"><Check size={14} /></button>
                  <button onClick={() => respond(r.requestId, 'decline')} className="w-8 h-8 rounded-full bg-slate-800 border border-white/10 text-slate-400 hover:text-rose-400 flex items-center justify-center"><X size={14} /></button>
                </div>
              } />
            ))}
          </div>
        </Modal>
      )}

      {/* Sent modal */}
      {modal === 'sent' && (
        <Modal title={`Requests sent (${data.sent.length})`} onClose={() => setModal(null)}>
          <div className="space-y-2 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {data.sent.length === 0 && <p className="text-center text-xs text-slate-500 py-6">You haven't sent any requests.</p>}
            {data.sent.map((r) => (
              <PersonRow key={r.requestId} p={r.to} right={
                <button onClick={() => cancel(r.requestId)} className="text-[10px] font-bold text-slate-400 hover:text-rose-400 border border-white/10 px-3 py-1.5 rounded-full">Cancel</button>
              } />
            ))}
          </div>
        </Modal>
      )}

      <FriendChat username={chatUser} onClose={() => setChatUser(null)} onChanged={() => { refresh(); loadUserData(); }} />
    </div>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in" onClick={onClose}>
      <div className="relative w-full max-w-md bg-slate-900 border border-white/10 rounded-t-3xl rounded-b-xl shadow-2xl p-5 z-10" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-base font-bold text-white">{title}</h2>
          <button onClick={onClose} className="p-1 rounded-full bg-slate-800 text-slate-400 hover:text-white"><X size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
