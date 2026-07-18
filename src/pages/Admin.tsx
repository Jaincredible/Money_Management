import React, { useState, useEffect } from 'react';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, ReferenceLine } from 'recharts';
import { Lock, Unlock, LogOut, Radio, HelpCircle, ShieldAlert, CheckCircle } from 'lucide-react';
import { Wordmark } from '../components/Brand';

export default function Admin() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(
    sessionStorage.getItem('admin_auth') === 'true'
  );
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [shake, setShake] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'activity' | 'health'>('overview');

  // Live Agent activity logger simulation
  const [liveLogs, setLiveLogs] = useState<Array<{ time: string; hash: string; type: string; op: string }>>([
    { time: '14:32:07', hash: 'usr_a3f...9c2', type: 'GOAL_UPDATE', op: 'Updated a savings goal' },
    { time: '14:31:55', hash: 'usr_b8d...1e4', type: 'EXPENSE_LOG', op: 'Logged & categorised an expense' },
    { time: '14:31:43', hash: 'usr_c2a...7f1', type: 'BUDGET_ALERT', op: 'Sent a budget alert' },
    { time: '14:31:30', hash: 'usr_d9e...3b8', type: 'INCOME_ALLOC', op: 'Auto-allocated income to goals' },
    { time: '14:31:12', hash: 'usr_e1c...5d0', type: 'BILL_REMINDER', op: 'Set a bill reminder' },
    { time: '14:30:58', hash: 'usr_f5a...8b9', type: 'CHALLENGE_JOIN', op: 'Joined a savings challenge' },
    { time: '14:30:42', hash: 'usr_a3f...9c2', type: 'EXPENSE_LOG', op: 'Logged & categorised an expense' },
    { time: '14:30:15', hash: 'usr_d9e...3b8', type: 'REWARD_EARNT', op: 'Awarded a reward badge' },
    { time: '14:29:50', hash: 'usr_g4b...2c4', type: 'GOAL_CREATE', op: 'Created a new goal' },
    { time: '14:29:21', hash: 'usr_b8d...1e4', type: 'EXPENSE_LOG', op: 'Logged & categorised an expense' },
  ]);

  useEffect(() => {
    if (!isAuthenticated) return;

    // Simulate real-time log ingestion every 4 seconds
    const interval = setInterval(() => {
      const hashes = ['usr_a3f...9c2', 'usr_b8d...1e4', 'usr_c2a...7f1', 'usr_d9e...3b8', 'usr_e1c...5d0', 'usr_f5a...8b9', 'usr_z9a...1a2'];
      const types = ['EXPENSE_LOG', 'GOAL_UPDATE', 'BUDGET_ALERT', 'INCOME_ALLOC', 'BILL_REMINDER', 'CHALLENGE_CREATE', 'REWARD_CLAIM'];
      const ops = [
        'Logged & categorised an expense',
        'Updated a savings goal',
        'Sent a budget alert',
        'Auto-allocated income to goals',
        'Set a bill reminder',
        'Created a savings challenge',
        'Awarded a reward badge'
      ];

      const randIdx = Math.floor(Math.random() * hashes.length);
      const now = new Date();
      const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;

      const newLog = {
        time: timeStr,
        hash: hashes[randIdx],
        type: types[randIdx],
        op: ops[randIdx]
      };

      setLiveLogs((prev) => [newLog, ...prev.slice(0, 9)]);
    }, 4000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'finagent2026') {
      sessionStorage.setItem('admin_auth', 'true');
      setIsAuthenticated(true);
      setErrorMsg('');
    } else {
      setErrorMsg('Incorrect password');
      setShake(true);
      setTimeout(() => setShake(false), 400);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem('admin_auth');
    setIsAuthenticated(false);
    setPassword('');
  };

  // --- PASSWORD GATE LOGIN SCREEN ---
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 py-12 relative overflow-hidden">
        {/* Background radial glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-80 h-80 rounded-full bg-rose-500/5 blur-[90px] pointer-events-none" />

        <div
          className={`w-full max-w-sm glass-card rounded-2xl p-6 text-center space-y-6 ${
            shake ? 'animate-shake' : ''
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto text-indigo-400 shadow">
            <Lock size={20} />
          </div>

          <div className="space-y-1.5">
            <h1 className="text-lg font-bold text-white leading-none"><Wordmark /> Admin Portal</h1>
            <p className="text-[11px] text-slate-500">Access requires platform administrator authorization</p>
          </div>

          {errorMsg && (
            <div className="text-xs text-rose-500 font-semibold bg-rose-950/20 border border-rose-500/20 py-2 rounded-xl">
              {errorMsg}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-left">
            <div className="space-y-1">
              <label className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Access Token / Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full bg-slate-950 border border-white/10 rounded-xl py-2.5 px-4 text-white text-xs focus:outline-none focus:border-indigo-500 transition-colors text-center"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-indigo-gradient hover:from-indigo-600 hover:to-violet-700 text-white rounded-full font-bold text-xs shadow transition-all flex items-center justify-center gap-1.5"
            >
              <Unlock size={14} />
              <span>Verify and Login</span>
            </button>
          </form>
        </div>
      </div>
    );
  }

  // --- CHART MOCK DATA ---
  const userGrowthData = [
    { name: 'Jan', users: 120 },
    { name: 'Feb', users: 280 },
    { name: 'Mar', users: 510 },
    { name: 'Apr', users: 780 },
    { name: 'May', users: 1050 },
    { name: 'Jun', users: 1284 },
  ];

  const dauData = [
    { name: 'May 22', dau: 210, fill: '#6366F1' },
    { name: 'May 23', dau: 245, fill: '#6366F1' },
    { name: 'May 24', dau: 190, fill: '#6366F1' },
    { name: 'May 25', dau: 320, fill: '#6366F1' },
    { name: 'May 26', dau: 380, fill: '#6366F1' },
    { name: 'May 27', dau: 350, fill: '#6366F1' },
    { name: 'May 28', dau: 290, fill: '#6366F1' },
    { name: 'May 29', dau: 310, fill: '#6366F1' },
    { name: 'May 30', dau: 420, fill: '#6366F1' },
    { name: 'May 31', dau: 395, fill: '#6366F1' },
    { name: 'Jun 1', dau: 360, fill: '#6366F1' },
    { name: 'Jun 2', dau: 340, fill: '#6366F1' },
    { name: 'Jun 3', dau: 380, fill: '#6366F1' },
    { name: 'Jun 4', dau: 347, fill: '#10B981' }, // today highlighted in emerald
  ];

  const activePeriodsData = [
    { name: 'Morning (6am-12pm)', value: 28 },
    { name: 'Afternoon (12pm-6pm)', value: 35 },
    { name: 'Evening (6pm-12am)', value: 37 },
  ];

  const activePeriodsColors = ['#6366F1', '#F59E0B', '#10B981'];

  const featureUsage = [
    { name: 'Agent Chat', pct: 94 },
    { name: 'Expense Logging', pct: 88 },
    { name: 'Goal Tracking', pct: 71 },
    { name: 'Insights Dashboard', pct: 58 },
    { name: 'Community Challenges', pct: 43 },
    { name: 'Budget Alerts', pct: 39 },
  ];

  const agentActionBreakdown = [
    { name: 'Expense Logged', count: 4821 },
    { name: 'Goal Updated', count: 3204 },
    { name: 'Budget Alert Sent', count: 1876 },
    { name: 'Bill Reminder Set', count: 1340 },
    { name: 'Income Allocated', count: 987 },
    { name: 'Challenge Created', count: 423 },
    { name: 'Insight Generated', count: 2109 },
  ];

  const mongoOpsData = [
    { name: '0h', reads: 120, writes: 60 },
    { name: '4h', reads: 90, writes: 45 },
    { name: '8h', reads: 480, writes: 240 },
    { name: '12h', reads: 510, writes: 260 },
    { name: '16h', reads: 600, writes: 310 },
    { name: '20h', reads: 960, writes: 480 },
    { name: '24h', reads: 420, writes: 210 },
  ];

  const apiLatencyData = [
    { name: 'Mon', latency: 1200 },
    { name: 'Tue', latency: 980 },
    { name: 'Wed', latency: 1050 },
    { name: 'Thu', latency: 890 },
    { name: 'Fri', latency: 1100 },
    { name: 'Sat', latency: 950 },
    { name: 'Sun', latency: 870 },
  ];

  return (
    <div className="min-h-screen bg-background pb-12 text-slate-200">
      
      {/* Top Header Bar */}
      <div className="w-full bg-slate-900 border-b border-white/5 px-6 py-4 flex flex-col md:flex-row gap-4 items-center justify-between sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-2">
          <Lock className="text-indigo-400" size={18} />
          <span className="text-base"><Wordmark /> <span className="font-extrabold text-white tracking-wide">Admin</span></span>
          <span className="text-[10px] bg-slate-800 text-indigo-400 font-bold border border-indigo-500/20 px-2 py-0.5 rounded-full uppercase flex items-center gap-1">
            <Radio size={10} className="animate-pulse text-red-500" />
            Live
          </span>
        </div>

        {/* Tabs switcher */}
        <div className="flex bg-slate-950 p-1 rounded-full border border-white/5 text-xs">
          {(['overview', 'activity', 'health'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-1.5 px-4 rounded-full font-bold uppercase tracking-wider transition-all ${
                activeTab === tab ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-rose-400 border border-white/5 hover:border-rose-500/20 bg-slate-950 hover:bg-rose-950/20 px-3.5 py-1.5 rounded-full font-semibold transition-all focus:outline-none"
        >
          <LogOut size={12} />
          <span>Logout</span>
        </button>
      </div>

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 pt-6 space-y-6">
        
        {/* GDPR Privacy badge header */}
        <div className="flex items-center justify-between border-b border-white/5 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white capitalize leading-none mb-1.5">
              {activeTab} Dashboard
            </h2>
            <p className="text-xs text-slate-400 font-medium">
              {activeTab === 'overview' && 'Aggregated platform metrics only · No personal data stored'}
              {activeTab === 'activity' && 'Anonymized — no user identifiers or financial amounts'}
              {activeTab === 'health' && 'Infrastructure · Uptime · Performance'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            {/* Tooltip implementation */}
            <div className="admin-tooltip cursor-help flex items-center gap-1 text-[11px] text-indigo-400 bg-indigo-950/40 border border-indigo-500/20 px-3 py-1 rounded-full font-semibold shadow-md">
              <span>🔒 GDPR-safe · Zero PII</span>
              <HelpCircle size={12} />
              <span className="admin-tooltiptext leading-relaxed">
                PocketGlow is built privacy-first. Personal financial data belongs to users only — admins see aggregated trends, never individual records.
              </span>
            </div>
          </div>
        </div>

        {/* ================= TAB 1: OVERVIEW ================= */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            
            {/* Top 4 Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="glass-card rounded-2xl p-4 text-left">
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Registered Users</p>
                <p className="text-2xl font-extrabold text-white mt-1">1,284</p>
                <span className="text-[9px] font-bold text-emerald-400 font-mono mt-2 block">▲ +23 this week</span>
              </div>
              
              <div className="glass-card rounded-2xl p-4 text-left">
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Active Today</p>
                <p className="text-2xl font-extrabold text-white mt-1">347</p>
                <span className="text-[9px] font-bold text-slate-400 font-mono mt-2 block">27% of total</span>
              </div>

              <div className="glass-card rounded-2xl p-4 text-left">
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Sessions (June)</p>
                <p className="text-2xl font-extrabold text-white mt-1">8,940</p>
                <span className="text-[9px] font-bold text-emerald-400 font-mono mt-2 block">▲ +12% vs May</span>
              </div>

              <div className="glass-card rounded-2xl p-4 text-left">
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">PWA Installs</p>
                <p className="text-2xl font-extrabold text-white mt-1">892</p>
                <span className="text-[9px] font-bold text-emerald-400 font-mono mt-2 block">▲ +41 this week</span>
              </div>
            </div>

            {/* Growth Area Chart */}
            <div className="glass-card rounded-2xl p-5 text-left">
              <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider mb-4">User Growth (Last 6 Months)</h3>
              <div className="h-[200px] w-full font-mono text-[9px] -ml-4 pr-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={userGrowthData}>
                    <XAxis dataKey="name" stroke="#475569" />
                    <YAxis stroke="#475569" />
                    <Tooltip
                      content={({ active, payload }: any) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-900 border border-white/10 p-2.5 rounded-xl font-sans text-xs">
                              <p className="text-slate-400">Total Users:</p>
                              <p className="font-extrabold text-white mt-0.5">{payload[0].value}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area type="monotone" dataKey="users" stroke="#6366F1" fill="#6366F1" fillOpacity={0.15} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* DAU and Session Period Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* DAU bar chart */}
              <div className="glass-card rounded-2xl p-5 text-left">
                <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider mb-4">Daily Active Users (Last 14 Days)</h3>
                <div className="h-[200px] w-full font-mono text-[9px] -ml-4 pr-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={dauData}>
                      <XAxis dataKey="name" stroke="#475569" tickFormatter={(val) => val.split(' ')[1] || val} />
                      <YAxis stroke="#475569" />
                      <Tooltip
                        content={({ active, payload }: any) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-slate-900 border border-white/10 p-2.5 rounded-xl font-sans text-xs">
                                <p className="text-slate-400">{payload[0].payload.name}:</p>
                                <p className="font-extrabold text-white mt-0.5">{payload[0].value} Active</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="dau" radius={[4, 4, 0, 0]}>
                        {dauData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Sessions Donut chart */}
              <div className="glass-card rounded-2xl p-5 text-left flex flex-col justify-between">
                <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider mb-2">When Users Are Active</h3>
                
                <div className="h-[150px] w-full relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={activePeriodsData}
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {activePeriodsData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={activePeriodsColors[index % activePeriodsColors.length]} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-2 text-xs border-t border-white/5 pt-4 mt-2">
                  {activePeriodsData.map((item, idx) => (
                    <div key={item.name} className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: activePeriodsColors[idx] }} />
                        <span className="text-slate-300 font-medium">{item.name}</span>
                      </div>
                      <span className="font-mono font-bold text-white">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Platform & Feature lists grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Platform Access bars */}
              <div className="glass-card rounded-2xl p-5 text-left">
                <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider mb-4">Platform Access</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-300">📱 Mobile Web</span>
                      <span className="text-indigo-400 font-bold">68%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-white/5">
                      <div className="h-full bg-indigo-500 rounded-full" style={{ width: '68%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-300">💻 Desktop Web</span>
                      <span className="text-violet-400 font-bold">24%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-white/5">
                      <div className="h-full bg-violet-500 rounded-full" style={{ width: '24%' }} />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-300">📲 PWA Install</span>
                      <span className="text-emerald-400 font-bold">8%</span>
                    </div>
                    <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-white/5">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: '8%' }} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Feature usage lists */}
              <div className="glass-card rounded-2xl p-5 text-left">
                <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider mb-4">Most Used Features (This Month)</h3>
                <div className="space-y-3.5">
                  {featureUsage.map((f, idx) => (
                    <div key={f.name}>
                      <div className="flex justify-between text-xs font-semibold mb-1">
                        <span className="text-slate-300">{idx + 1}. {f.name}</span>
                        <span className="text-slate-400 font-mono text-[10px]">{f.pct}%</span>
                      </div>
                      <div className="w-full bg-slate-950 h-1.5 rounded-full overflow-hidden border border-white/5">
                        <div className="h-full bg-indigo-500" style={{ width: `${f.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Retention Card */}
            <div className="glass-card rounded-2xl p-4 text-left">
              <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider mb-4">User Retention</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="bg-slate-950 border border-white/5 p-3 rounded-xl text-center">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Day 1</p>
                  <p className="text-lg font-bold text-emerald-400 mt-1">74%</p>
                </div>
                <div className="bg-slate-950 border border-white/5 p-3 rounded-xl text-center">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Day 7</p>
                  <p className="text-lg font-bold text-amber-500 mt-1">52%</p>
                </div>
                <div className="bg-slate-950 border border-white/5 p-3 rounded-xl text-center">
                  <p className="text-[10px] uppercase font-bold text-slate-500">Day 30</p>
                  <p className="text-lg font-bold text-amber-500 mt-1">31%</p>
                </div>
              </div>
              <p className="text-[9px] font-mono text-slate-500 mt-3 text-center">
                Industry avg: D1 ~40% · D7 ~25% · D30 ~15%
              </p>
            </div>

          </div>
        )}

        {/* ================= TAB 2: AGENT ACTIVITY ================= */}
        {activeTab === 'activity' && (
          <div className="space-y-6">
            
            {/* Live Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="glass-card rounded-2xl p-4 text-left">
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Conversations Today</p>
                <p className="text-2xl font-extrabold text-white mt-1">1,203</p>
                <span className="text-[9px] font-bold text-emerald-400 font-mono mt-1 block">▲ +8% vs yesterday</span>
              </div>
              
              <div className="glass-card rounded-2xl p-4 text-left">
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Avg Actions Per Session</p>
                <p className="text-2xl font-extrabold text-white mt-1">4.7</p>
                <span className="text-[9px] font-bold text-slate-400 font-mono mt-1 block">up from 4.2 last week</span>
              </div>

              <div className="glass-card rounded-2xl p-4 text-left">
                <p className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Avg Response Time</p>
                <p className="text-2xl font-extrabold text-white mt-1">1.3s</p>
                <span className="text-[9px] font-bold text-indigo-400 font-mono mt-1 block">Gemini + Database</span>
              </div>
            </div>

            {/* Horizontal Bar: Action type breakdown */}
            <div className="glass-card rounded-2xl p-5 text-left">
              <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider mb-4">Agent Action Types (Last 7 Days)</h3>
              <div className="h-[250px] w-full font-mono text-[9px] -ml-4 pr-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={agentActionBreakdown}
                    layout="vertical"
                    margin={{ top: 10, right: 30, left: 40, bottom: 5 }}
                  >
                    <XAxis type="number" stroke="#475569" />
                    <YAxis dataKey="name" type="category" stroke="#475569" width={90} />
                    <Tooltip
                      content={({ active, payload }: any) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-900 border border-white/10 p-2.5 rounded-xl font-sans text-xs">
                              <p className="font-bold text-white">{payload[0].payload.name}</p>
                              <p className="text-slate-400 mt-1">Count: {payload[0].value.toLocaleString()}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="count" fill="#6366F1" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Live activity log with dynamic Interval updates */}
            <div className="glass-card rounded-2xl p-5 text-left">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider leading-none">
                    Recent Agent Actions (Anonymized)
                  </h3>
                  <p className="text-[10px] text-slate-500 mt-1">User IDs are SHA-256 hashed · No PII</p>
                </div>
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
              </div>

              {/* Console log list */}
              <div className="bg-slate-950 rounded-xl p-3 border border-white/5 font-mono text-[10px] space-y-2.5 max-h-[220px] overflow-y-auto custom-scrollbar">
                {liveLogs.map((log, idx) => (
                  <div key={idx} className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-2 last:border-none animate-fade-in">
                    <div className="flex items-center gap-2">
                      <span className="text-slate-600">{log.time}</span>
                      <span className="text-slate-400">{log.hash}</span>
                      <span className="text-indigo-400 bg-indigo-950/50 border border-indigo-500/10 px-1.5 py-0.5 rounded uppercase font-bold text-[8px] tracking-wide">
                        {log.type}
                      </span>
                    </div>
                    
                    <div className="text-[9px] text-slate-500 mt-1 md:mt-0 font-bold">
                      → {log.op}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* MongoDB operations reads/writes linechart */}
            <div className="glass-card rounded-2xl p-5 text-left">
              <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider mb-4">MongoDB Operations (Last 24 Hours)</h3>
              <div className="h-[200px] w-full font-mono text-[9px] -ml-4 pr-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={mongoOpsData}>
                    <XAxis dataKey="name" stroke="#475569" />
                    <YAxis stroke="#475569" />
                    <Tooltip
                      content={({ active, payload }: any) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-900 border border-white/10 p-2.5 rounded-xl font-sans text-xs space-y-1">
                              <p className="font-bold text-white mb-1">Hour: {payload[0].payload.name}</p>
                              <p className="text-indigo-400 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Reads: {payload[0].value}
                              </p>
                              <p className="text-emerald-400 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Writes: {payload[1].value}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Line type="monotone" dataKey="reads" name="Reads" stroke="#6366F1" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="writes" name="Writes" stroke="#10B981" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}

        {/* ================= TAB 3: SYSTEM HEALTH ================= */}
        {activeTab === 'health' && (
          <div className="space-y-6">
            
            {/* Operational Banner */}
            <div className="bg-emerald-950/40 border border-emerald-500/20 text-emerald-400 rounded-2xl p-4 flex items-center gap-3 animate-fade-in shadow-md shadow-emerald-500/5">
              <CheckCircle className="text-emerald-500 shrink-0" size={20} />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider">System Status</p>
                <p className="text-sm font-extrabold text-white mt-0.5">✓ All Systems Operational</p>
              </div>
            </div>

            {/* Service Status List */}
            <div className="glass-card rounded-2xl p-4 text-left">
              <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider mb-4">Service Status List</h3>
              
              <div className="divide-y divide-white/5 space-y-3 font-mono text-[11px]">
                <div className="flex justify-between items-center py-1">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-slate-300 font-bold">Gemini API</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 bg-emerald-950/60 border border-emerald-500/10 px-2 py-0.5 rounded font-bold text-[9px] tracking-wide uppercase">Operational</span>
                    <span className="text-slate-500">avg 1.1s</span>
                  </div>
                </div>

                <div className="flex justify-between items-center py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-slate-300 font-bold">Database (MongoDB)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 bg-emerald-950/60 border border-emerald-500/10 px-2 py-0.5 rounded font-bold text-[9px] tracking-wide uppercase">Operational</span>
                    <span className="text-slate-500">avg 0.3s</span>
                  </div>
                </div>

                <div className="flex justify-between items-center py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-slate-300 font-bold">Web App (Vercel)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 bg-emerald-950/60 border border-emerald-500/10 px-2 py-0.5 rounded font-bold text-[9px] tracking-wide uppercase">Operational</span>
                    <span className="text-slate-500">avg 0.8s</span>
                  </div>
                </div>

                <div className="flex justify-between items-center py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-slate-300 font-bold">Auth Service</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 bg-emerald-950/60 border border-emerald-500/10 px-2 py-0.5 rounded font-bold text-[9px] tracking-wide uppercase">Operational</span>
                    <span className="text-slate-500">avg 0.2s</span>
                  </div>
                </div>

                <div className="flex justify-between items-center py-2.5 last:border-none">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-slate-300 font-bold">Alert System</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-emerald-400 bg-emerald-950/60 border border-emerald-500/10 px-2 py-0.5 rounded font-bold text-[9px] tracking-wide uppercase">Operational</span>
                    <span className="text-slate-500">avg 0.4s</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Uptime Cards */}
            <div className="grid grid-cols-3 gap-4">
              <div className="glass-card rounded-2xl p-4 text-center">
                <p className="text-[10px] uppercase font-bold text-slate-500">This Month</p>
                <p className="text-base font-extrabold text-emerald-400 mt-1">99.94%</p>
              </div>
              <div className="glass-card rounded-2xl p-4 text-center">
                <p className="text-[10px] uppercase font-bold text-slate-500">Last Month</p>
                <p className="text-base font-extrabold text-emerald-400 mt-1">99.87%</p>
              </div>
              <div className="glass-card rounded-2xl p-4 text-center">
                <p className="text-[10px] uppercase font-bold text-slate-500">All Time</p>
                <p className="text-base font-extrabold text-emerald-400 mt-1">99.71%</p>
              </div>
            </div>

            {/* Response Time Trend Area Chart */}
            <div className="glass-card rounded-2xl p-5 text-left">
              <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider mb-4">API Response Time (Last 7 Days)</h3>
              <div className="h-[200px] w-full font-mono text-[9px] -ml-4 pr-1">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={apiLatencyData}>
                    <XAxis dataKey="name" stroke="#475569" />
                    <YAxis stroke="#475569" tickFormatter={(val) => `${val}ms`} />
                    <Tooltip
                      content={({ active, payload }: any) => {
                        if (active && payload && payload.length) {
                          return (
                            <div className="bg-slate-900 border border-white/10 p-2.5 rounded-xl font-sans text-xs">
                              <p className="text-slate-400">Response Time:</p>
                              <p className="font-extrabold text-white mt-0.5">{payload[0].value} ms</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area type="monotone" dataKey="latency" stroke="#6366F1" fill="#6366F1" fillOpacity={0.15} />
                    <ReferenceLine y={2000} stroke="#F43F5E" strokeDasharray="3 3" label={{ value: 'SLA Threshold', position: 'top', fill: '#F43F5E', fontSize: 9 }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Error Rate Card */}
            <div className="glass-card rounded-2xl p-5 text-left">
              <div className="flex justify-between items-baseline mb-1">
                <h3 className="text-xs uppercase font-extrabold text-slate-400 tracking-wider">Error Rate</h3>
                <span className="text-2xl font-extrabold text-emerald-400">0.06%</span>
              </div>
              <p className="text-[10px] text-slate-500 font-medium mb-4">Last 7 days · 23 errors / 38,400 requests</p>
              
              {/* Mini bar chart */}
              <div className="h-[80px] w-full font-mono text-[9px] -ml-4 pr-1">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { day: 'Mon', errors: 4 },
                    { day: 'Tue', errors: 2 },
                    { day: 'Wed', errors: 5 },
                    { day: 'Thu', errors: 1 },
                    { day: 'Fri', errors: 3 },
                    { day: 'Sat', errors: 4 },
                    { day: 'Sun', errors: 4 },
                  ]}>
                    <XAxis dataKey="day" stroke="#475569" />
                    <YAxis stroke="#475569" hide />
                    <Bar dataKey="errors" fill="#F43F5E" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* DPDP Compliance Notice */}
            <div className="bg-slate-900 border border-white/5 rounded-2xl p-4 flex items-start gap-3">
              <ShieldAlert className="text-indigo-400 shrink-0 mt-0.5" size={16} />
              <p className="text-[10px] text-slate-500 italic leading-relaxed text-left">
                PocketGlow Admin Portal collects zero personally identifiable information. All user metrics are aggregated server-side before reaching this dashboard. Transaction amounts, user names, and financial data are never exposed to admin views. User IDs in activity logs are one-way hashed (SHA-256) and cannot be reversed. Compliant with DPDP Act 2023 (India).
              </p>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}
