import React, { useState, useEffect, useRef } from 'react';
import {
  CreditCard,
  Zap,
  Receipt,
  Bot,
  Plus,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  Calendar,
  Gamepad2,
  Tv,
  ShoppingBag,
  DollarSign,
  Send,
  Sparkles,
  CheckCircle2,
  Trash2,
  Users,
  ShieldCheck,
  FileText,
  ChevronRight,
  Search,
  Lock,
  Unlock,
  LogOut,
  UserCheck,
  Eye,
  EyeOff
} from 'lucide-react';

export default function App() {
  // Current authenticated user
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('klarity_user');
    return saved ? JSON.parse(saved) : null;
  });

  // Auth form states
  const [authMode, setAuthMode] = useState('signin'); // 'signin' | 'register'
  const [authUsername, setAuthUsername] = useState('robert');
  const [authPassword, setAuthPassword] = useState('password123');
  const [regName, setRegName] = useState('');
  const [regRole, setRegRole] = useState('Parent');
  const [regAvatar, setRegAvatar] = useState('👨‍💼');
  const [authError, setAuthError] = useState('');

  // Main dashboard states
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [viewHousehold, setViewHousehold] = useState(false); // Toggle personal vs household

  // AI Chat state
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      text: "👋 Hi! I'm Klarity, your personal AI Financial Advisor. I monitor your connected cards and upcoming household utility bills (like PG&E and Fresno Water). Ask me what to pay off first!"
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Modals
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [isAddBillOpen, setIsAddBillOpen] = useState(false);
  const [isScanBillOpen, setIsScanBillOpen] = useState(false);

  // Form states
  const [newAccount, setNewAccount] = useState({
    institution: 'Chase',
    name: 'Sapphire Preferred',
    type: 'credit',
    balance: '450.00',
    limit: '5000',
    apr: '21.99',
    minPayment: '35',
    dueDate: '2026-11-25',
    isShared: false
  });

  const [newTx, setNewTx] = useState({
    name: '',
    amount: '',
    category: '',
    accountId: ''
  });

  const [newBill, setNewBill] = useState({
    name: '',
    biller: '',
    category: 'Utilities',
    expectedAmount: '',
    dueDay: '15'
  });

  const [scanText, setScanText] = useState(
    "PACIFIC GAS AND ELECTRIC COMPANY\nStatement Date: Oct 22, 2026\nAccount: 4819-2041-02\nTotal Amount Due: $284.50\nPayment Due Date: November 14, 2026\nService: Electric and Natural Gas"
  );
  const [scanResult, setScanResult] = useState(null);

  const [txSearch, setTxSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Load dashboard data for the authenticated user
  const fetchData = async (user = currentUser, household = viewHousehold) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/data?userId=${user.id}&household=${household}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
        if (json.accounts?.length > 0 && !newTx.accountId) {
          setNewTx(prev => ({ ...prev, accountId: json.accounts[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchData(currentUser, viewHousehold);
    }
  }, [currentUser, viewHousehold]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiTyping]);

  // Auth Handler: Login
  const handleLogin = async (e, quickUser = null) => {
    if (e) e.preventDefault();
    setAuthError('');
    const uName = quickUser ? quickUser.username : authUsername;
    const pwd = quickUser ? quickUser.password : authPassword;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: uName, password: pwd })
      });
      const json = await res.json();
      if (!res.ok) {
        setAuthError(json.error || 'Login failed');
        return;
      }
      setCurrentUser(json.user);
      localStorage.setItem('klarity_user', JSON.stringify(json.user));
    } catch (err) {
      setAuthError('Connection error to Klarity server');
    }
  };

  // Auth Handler: Register
  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: authUsername,
          password: authPassword,
          name: regName,
          role: regRole,
          avatar: regAvatar
        })
      });
      const json = await res.json();
      if (!res.ok) {
        setAuthError(json.error || 'Registration failed');
        return;
      }
      setCurrentUser(json.user);
      localStorage.setItem('klarity_user', JSON.stringify(json.user));
    } catch (err) {
      setAuthError('Connection error to Klarity server');
    }
  };

  // Logout
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('klarity_user');
  };

  // AI Chat message
  const handleSendMessage = async (msgToSend) => {
    const text = msgToSend || chatInput;
    if (!text.trim() || !currentUser) return;

    const userMsg = { role: 'user', text };
    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsAiTyping(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          userId: currentUser.id
        })
      });
      const json = await res.json();
      setChatMessages(prev => [...prev, { role: 'assistant', text: json.reply }]);
    } catch (err) {
      setChatMessages(prev => [
        ...prev,
        { role: 'assistant', text: "⚠️ Unable to contact AI advisor server." }
      ]);
    } finally {
      setIsAiTyping(false);
    }
  };

  // Add Card for logged-in user
  const handleAddAccount = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newAccount,
          ownerId: currentUser.id
        })
      });
      if (res.ok) {
        setIsAddAccountOpen(false);
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Link Card via Plaid Simulator
  const handlePlaidConnect = async () => {
    try {
      const res = await fetch('/api/plaid/exchange-public-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institution: 'Chase Bank',
          accountName: 'Chase Freedom Flex',
          ownerId: currentUser.id
        })
      });
      if (res.ok) {
        setIsAddAccountOpen(false);
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Log Purchase
  const handleAddTx = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTx,
          ownerId: currentUser.id
        })
      });
      if (res.ok) {
        setIsAddTxOpen(false);
        setNewTx({ name: '', amount: '', category: '', accountId: data?.accounts[0]?.id || '' });
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Pay Bill
  const handlePayBill = async (billId) => {
    try {
      const res = await fetch(`/api/bills/${billId}/pay`, { method: 'POST' });
      if (res.ok) await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Scan Bill
  const handleScanBill = async () => {
    try {
      const res = await fetch('/api/bills/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billText: scanText, ownerId: currentUser.id })
      });
      if (res.ok) {
        const json = await res.json();
        setScanResult(json.summary);
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete card
  const handleDeleteAccount = async (id) => {
    if (!confirm('Remove this connected account?')) return;
    try {
      await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // ================= 1. LOGIN / SIGN UP SCREEN (IF NOT LOGGED IN) =================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
          {/* Logo & Header */}
          <div className="text-center">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25 mb-3">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-white">Klarity</h1>
            <p className="text-xs text-slate-400 mt-1">
              Private Family Finance, Cards & AI Advisor
            </p>
          </div>

          {/* Quick Member Switcher (Test / Demo) */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3">
            <p className="text-[11px] font-semibold text-slate-400 mb-2 text-center uppercase tracking-wider">
              1-Click Fast Sign-In for Family:
            </p>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { name: 'Robert (Dad)', username: 'robert', avatar: '👨‍💼', role: 'Parent' },
                { name: 'Sarah (Mom)', username: 'sarah', avatar: '👩‍⚕️', role: 'Parent' },
                { name: 'Alex (College)', username: 'alex', avatar: '🧑‍🎓', role: 'Student' },
                { name: 'Maya (Teen)', username: 'maya', avatar: '👧', role: 'Teen' },
                { name: 'Jordan (Kid)', username: 'jordan', avatar: '👦', role: 'Kid' },
                { name: 'Leo (Kid)', username: 'leo', avatar: '🧒', role: 'Kid' }
              ].map(m => (
                <button
                  key={m.username}
                  onClick={() => handleLogin(null, { username: m.username, password: 'password123' })}
                  className="p-2 rounded-xl bg-slate-900 hover:bg-blue-600/20 hover:border-blue-500/40 border border-slate-800 text-left transition-all group"
                >
                  <div className="text-lg">{m.avatar}</div>
                  <div className="text-[11px] font-semibold text-slate-200 group-hover:text-blue-300 truncate">
                    {m.name.split(' ')[0]}
                  </div>
                  <div className="text-[9px] text-slate-500">{m.role}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Tabs: Sign In vs Create Profile */}
          <div className="flex border-b border-slate-800">
            <button
              onClick={() => { setAuthMode('signin'); setAuthError(''); }}
              className={`flex-1 pb-2 text-xs font-semibold border-b-2 transition-colors ${
                authMode === 'signin' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400'
              }`}
            >
              Sign In to Your Account
            </button>
            <button
              onClick={() => { setAuthMode('register'); setAuthError(''); }}
              className={`flex-1 pb-2 text-xs font-semibold border-b-2 transition-colors ${
                authMode === 'register' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400'
              }`}
            >
              Create New Family Profile
            </button>
          </div>

          {authError && (
            <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{authError}</span>
            </div>
          )}

          {/* Form */}
          {authMode === 'signin' ? (
            <form onSubmit={handleLogin} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Username</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. robert, sarah, alex"
                  value={authUsername}
                  onChange={e => setAuthUsername(e.target.value)}
                  className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Password</label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={e => setAuthPassword(e.target.value)}
                  className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
                <p className="text-[10px] text-slate-500 mt-1">Default test password is: <code>password123</code></p>
              </div>

              <button
                type="submit"
                className="mt-2 w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/20 transition-all"
              >
                Sign In
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Your Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Michael"
                  value={regName}
                  onChange={e => setRegName(e.target.value)}
                  className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Username</label>
                  <input
                    type="text"
                    required
                    placeholder="michael"
                    value={authUsername}
                    onChange={e => setAuthUsername(e.target.value)}
                    className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Family Role</label>
                  <select
                    value={regRole}
                    onChange={e => setRegRole(e.target.value)}
                    className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  >
                    <option value="Parent">Parent</option>
                    <option value="Student">Student (College)</option>
                    <option value="Teen">Teen</option>
                    <option value="Kid">Kid</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Pick an Avatar</label>
                <div className="mt-1 flex items-center gap-2 overflow-x-auto pb-1">
                  {['👨‍💼', '👩‍⚕️', '🧑‍🎓', '👧', '👦', '🧒', '🚀', '💻', '🎮', '⚽'].map(emoji => (
                    <button
                      type="button"
                      key={emoji}
                      onClick={() => setRegAvatar(emoji)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-lg border transition-all ${
                        regAvatar === emoji
                          ? 'bg-blue-600 border-blue-400 scale-110 shadow-md'
                          : 'bg-slate-950 border-slate-800'
                      }`}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Set Password</label>
                <input
                  type="password"
                  required
                  placeholder="Create password"
                  value={authPassword}
                  onChange={e => setAuthPassword(e.target.value)}
                  className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <button
                type="submit"
                className="mt-2 w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md shadow-emerald-600/20 transition-all"
              >
                Create Family Profile
              </button>
            </form>
          )}
        </div>
      </div>
    );
  }

  // ================= 2. MAIN LOGGED-IN APPLICATION =================
  const highestAprCard = (data?.accounts || [])
    .filter(a => a.type === 'credit' && a.balance > 0)
    .sort((a, b) => b.apr - a.apr)[0];

  const filteredTransactions = (data?.transactions || []).filter(t => {
    const matchCategory = categoryFilter === 'all' ? true : t.category === categoryFilter;
    const matchSearch = txSearch ? t.name.toLowerCase().includes(txSearch.toLowerCase()) : true;
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Header */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40 px-4 py-3 sm:px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  Klarity <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">Family Vault</span>
                </h1>
                <p className="text-xs text-slate-400">Personal Cards & Household Bills</p>
              </div>
            </div>

            <button
              onClick={handleLogout}
              className="md:hidden p-2 rounded-lg bg-slate-800 text-slate-400 hover:text-white"
              title="Log Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Privacy & View Controls */}
          <div className="flex items-center gap-3 overflow-x-auto pb-1 md:pb-0">
            {/* View Mode Toggle: Personal vs Household */}
            <button
              onClick={() => setViewHousehold(!viewHousehold)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                viewHousehold
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : 'bg-blue-600/20 text-blue-300 border border-blue-500/40'
              }`}
            >
              {viewHousehold ? (
                <>
                  <Users className="w-3.5 h-3.5 text-amber-400" /> Showing: Household View
                </>
              ) : (
                <>
                  <Lock className="w-3.5 h-3.5 text-blue-400" /> Showing: My Personal Cards Only
                </>
              )}
            </button>

            {/* Current Logged-in User Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700">
              <span className="text-base">{currentUser.avatar}</span>
              <span className="text-xs font-semibold text-slate-200">{currentUser.name}</span>
              <span className="text-[10px] text-slate-400 px-1.5 py-0.2 rounded bg-slate-900">
                {currentUser.role}
              </span>
            </div>

            {/* Logout button */}
            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Log Out"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>

          {/* Action Buttons */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => setIsAddAccountOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5 text-emerald-400" /> Add My Card
            </button>
            <button
              onClick={() => setIsAddTxOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/25 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Log Purchase
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-4 py-6 sm:px-6 flex-1 flex flex-col gap-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 gap-2 sm:gap-6 overflow-x-auto">
          {[
            { id: 'dashboard', label: 'My Dashboard', icon: TrendingUp },
            { id: 'cards', label: `My Cards & Banks (${data?.accounts?.length || 0})`, icon: CreditCard },
            { id: 'bills', label: `Household Bills (${data?.bills?.length || 0})`, icon: Zap },
            { id: 'purchases', label: `My Purchases (${filteredTransactions.length})`, icon: Receipt },
            { id: 'ai', label: 'Klarity AI Advisor', icon: Bot, badge: 'Smart' }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 px-2 sm:px-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                  isActive
                    ? 'border-blue-500 text-blue-400 font-semibold'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : 'text-slate-400'}`} />
                {tab.label}
                {tab.badge && (
                  <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm">
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ================= TAB 1: DASHBOARD ================= */}
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-6">
            {/* Top Stat Banners */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                  <span>My Available Cash</span>
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-white">
                    ${data?.metrics?.totalChecking?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> In your personal checking
                  </p>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                  <span>My Credit Card Balances</span>
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                    <CreditCard className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-white">
                    ${data?.metrics?.totalCreditDebt?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    Across your {data?.accounts?.filter(a => a.type === 'credit').length} cards
                  </p>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                  <span>Household Bills & Utilities</span>
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                    <Zap className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-white">
                    ${data?.metrics?.totalMonthlyBills?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    <span className="text-xs font-normal text-slate-400">/mo</span>
                  </div>
                  <p className="text-xs text-amber-400 mt-1">PG&E, Fresno Water, Xfinity, T-Mobile</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-950 to-slate-900 border border-indigo-800/40 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-indigo-300 text-xs font-medium">
                  <span>Payoff Priority (Avalanche)</span>
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                </div>
                {highestAprCard ? (
                  <div className="mt-2">
                    <div className="text-sm font-bold text-white truncate">
                      {highestAprCard.institution} {highestAprCard.name}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                        {highestAprCard.apr}% APR
                      </span>
                      <span className="text-xs text-slate-300">Bal: ${highestAprCard.balance.toFixed(2)}</span>
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab('ai');
                        handleSendMessage('What should I pay off first and how much?');
                      }}
                      className="mt-3 text-xs text-indigo-300 hover:text-white font-medium flex items-center gap-1"
                    >
                      Ask Klarity Advisor <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-emerald-400 mt-2">Zero high-interest debt outstanding! 🎉</p>
                )}
              </div>
            </div>

            {/* Split: Upcoming Bills & AI Assistant */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Bills List */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" /> Household Bills (PG&E, Water, Telecom)
                    </h2>
                    <p className="text-xs text-slate-400">Shared household utility bills and subscriptions</p>
                  </div>
                  <button
                    onClick={() => setIsAddBillOpen(true)}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Bill
                  </button>
                </div>

                <div className="divide-y divide-slate-800">
                  {(data?.bills || []).slice(0, 5).map(bill => (
                    <div key={bill.id} className="py-3.5 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center shrink-0">
                          <Zap className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{bill.name}</p>
                          <p className="text-xs text-slate-400">Due {bill.nextDueDate}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <div className="text-sm font-bold text-white">${bill.expectedAmount.toFixed(2)}</div>
                          <span
                            className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                              bill.status === 'paid'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : bill.status === 'due_soon'
                                ? 'bg-red-500/20 text-red-300'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {bill.status === 'paid' ? 'Paid' : bill.status === 'due_soon' ? 'Due Soon' : 'Upcoming'}
                          </span>
                        </div>
                        {bill.status !== 'paid' && (
                          <button
                            onClick={() => handlePayBill(bill.id)}
                            className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 transition-colors"
                          >
                            Pay
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* AI Advisor Preview */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Klarity AI Advisor</h3>
                      <p className="text-xs text-slate-400">Personalized for {currentUser.name}</p>
                    </div>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-xs text-slate-300 leading-relaxed mb-4">
                    "Welcome back, <strong>{currentUser.name}</strong>! I've loaded your personal cards and accounts. You can ask me how to pay off debt or check when bills are due."
                  </div>

                  <p className="text-xs font-semibold text-slate-400 mb-2">Ask Klarity:</p>
                  <div className="flex flex-col gap-1.5">
                    {[
                      'What card should I pay off first?',
                      'When is our PG&E or Fresno Water due?',
                      'How do I budget for this month?'
                    ].map((q, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setActiveTab('ai');
                          handleSendMessage(q);
                        }}
                        className="text-left text-xs px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60 transition-colors flex items-center justify-between"
                      >
                        <span>{q}</span>
                        <ChevronRight className="w-3 h-3 text-slate-500" />
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('ai')}
                  className="mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium text-xs shadow-md shadow-blue-600/20 hover:opacity-95"
                >
                  Open Full AI Advisor Chat
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: MY CARDS & BANKS ================= */}
        {activeTab === 'cards' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white">My Connected Cards & Accounts</h2>
                <p className="text-xs text-slate-400">
                  Privately owned by <strong>{currentUser.name}</strong>. Only you have access to your personal cards.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePlaidConnect}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 flex items-center gap-2"
                >
                  <ShieldCheck className="w-4 h-4" /> Link Card via Plaid (Instant)
                </button>
                <button
                  onClick={() => setIsAddAccountOpen(true)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Card Manually
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {(data?.accounts || []).map(acc => {
                const isCredit = acc.type === 'credit';
                const utilization = isCredit && acc.limit > 0 ? (acc.balance / acc.limit) * 100 : 0;

                return (
                  <div
                    key={acc.id}
                    className="relative overflow-hidden rounded-2xl p-5 border border-slate-800 shadow-lg flex flex-col justify-between"
                    style={{
                      background: isCredit
                        ? 'linear-gradient(135deg, #1e1e38 0%, #0f172a 100%)'
                        : 'linear-gradient(135deg, #064e3b 0%, #0b1f1a 100%)'
                    }}
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs text-slate-300 mb-4">
                        <span className="font-bold uppercase tracking-wider text-slate-200">
                          {acc.institution}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-black/40 text-[10px] font-medium border border-white/10">
                            {currentUser.avatar} {currentUser.name.split(' ')[0]}
                          </span>
                          <button
                            onClick={() => handleDeleteAccount(acc.id)}
                            className="text-slate-500 hover:text-red-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <p className="text-base font-bold text-white">{acc.name}</p>
                      <p className="text-xs text-slate-400 font-mono tracking-widest mt-0.5">
                        •••• •••• •••• {acc.mask}
                      </p>

                      <div className="mt-4">
                        <p className="text-xs text-slate-400 font-medium">
                          {isCredit ? 'Current Balance' : 'Available Balance'}
                        </p>
                        <div className="text-2xl font-black text-white">
                          ${acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>

                    <div className="mt-5 pt-4 border-t border-white/10 flex flex-col gap-2">
                      {isCredit ? (
                        <>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Credit Limit:</span>
                            <span className="text-slate-200 font-semibold">${acc.limit.toLocaleString()}</span>
                          </div>
                          <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-1.5 rounded-full ${
                                utilization > 70 ? 'bg-red-500' : utilization > 30 ? 'bg-amber-500' : 'bg-emerald-500'
                              }`}
                              style={{ width: `${Math.min(utilization, 100)}%` }}
                            />
                          </div>
                          <div className="flex items-center justify-between text-xs pt-1">
                            <span className="px-1.5 py-0.5 rounded bg-red-500/20 text-red-300 font-semibold text-[10px]">
                              APR: {acc.apr}%
                            </span>
                            <span className="text-slate-400 text-[11px]">
                              Min: ${acc.minPayment} {acc.dueDate ? `• Due ${acc.dueDate.slice(5)}` : ''}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="flex items-center justify-between text-xs text-emerald-300">
                          <span>Checking Account</span>
                          <span className="font-mono text-[11px]">No Interest Charged</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= TAB 3: HOUSEHOLD BILLS ================= */}
        {activeTab === 'bills' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" /> Household Bills & Utilities
                </h2>
                <p className="text-xs text-slate-400">
                  Shared bills for the whole family: PG&E, Fresno Water, Xfinity, and T-Mobile.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsScanBillOpen(true)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 flex items-center gap-1.5"
                >
                  <FileText className="w-4 h-4 text-blue-400" /> Scan / Parse E-Bill
                </button>
                <button
                  onClick={() => setIsAddBillOpen(true)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add Bill
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(data?.bills || []).map(bill => {
                const isPaid = bill.status === 'paid';
                return (
                  <div
                    key={bill.id}
                    className="rounded-2xl p-5 border bg-slate-900 border-slate-800 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                            <Zap className="w-4 h-4" />
                          </div>
                          <div>
                            <h3 className="text-sm font-bold text-white">{bill.name}</h3>
                            <span className="text-[11px] text-slate-400">{bill.category}</span>
                          </div>
                        </div>
                        <span
                          className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                            isPaid
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : bill.status === 'due_soon'
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {isPaid ? 'Paid' : bill.status === 'due_soon' ? 'Due Soon' : 'Upcoming'}
                        </span>
                      </div>

                      <div className="mt-4 flex items-baseline justify-between">
                        <div>
                          <p className="text-xs text-slate-400">Expected Bill</p>
                          <p className="text-xl font-bold text-white">${bill.expectedAmount.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-400">Next Due Date</p>
                          <p className="text-xs font-semibold text-slate-200">{bill.nextDueDate}</p>
                        </div>
                      </div>

                      {bill.notes && (
                        <p className="text-xs text-slate-400 mt-3 pt-3 border-t border-slate-800/80 italic">
                          "{bill.notes}"
                        </p>
                      )}
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-end">
                      {!isPaid && (
                        <button
                          onClick={() => handlePayBill(bill.id)}
                          className="px-3 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white font-medium text-xs transition-colors"
                        >
                          Mark as Paid
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= TAB 4: PURCHASES ================= */}
        {activeTab === 'purchases' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white">Purchase History & Auto-Categories</h2>
                <p className="text-xs text-slate-400">
                  Transactions automatically categorized for <strong>{currentUser.name}</strong>.
                </p>
              </div>
              <button
                onClick={() => setIsAddTxOpen(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Purchase
              </button>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800 overflow-hidden">
              {filteredTransactions.map(tx => (
                <div key={tx.id} className="p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-base shrink-0">
                      {tx.category === 'Gaming' ? '🎮' : tx.category === 'Subscriptions' ? '📺' : tx.category === 'Utilities' ? '⚡' : '💳'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{tx.name}</p>
                      <p className="text-xs text-slate-400 flex items-center gap-2">
                        <span>{tx.date}</span>
                        {tx.isRecurring && (
                          <span className="text-[10px] text-amber-400 bg-amber-500/10 px-1.5 py-0.2 rounded font-semibold">
                            Recurring
                          </span>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p className="text-sm font-bold text-white">-${tx.amount.toFixed(2)}</p>
                    <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                      {tx.category}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ================= TAB 5: AI ADVISOR ================= */}
        {activeTab === 'ai' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[650px] shadow-xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Klarity AI Advisor
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                      Active
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">Advising {currentUser.name}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
              {chatMessages.map((msg, idx) => {
                const isAssistant = msg.role === 'assistant';
                return (
                  <div
                    key={idx}
                    className={`flex gap-3 max-w-3xl ${isAssistant ? 'self-start' : 'self-end flex-row-reverse'}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                        isAssistant ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white' : 'bg-slate-700 text-slate-200'
                      }`}
                    >
                      {isAssistant ? <Sparkles className="w-4 h-4" /> : currentUser.avatar}
                    </div>

                    <div
                      className={`rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                        isAssistant ? 'bg-slate-950 border border-slate-800 text-slate-200 shadow-sm' : 'bg-blue-600 text-white'
                      }`}
                    >
                      <div className="whitespace-pre-line prose prose-invert prose-sm">
                        {msg.text}
                      </div>
                    </div>
                  </div>
                );
              })}

              {isAiTyping && (
                <div className="flex gap-3 max-w-xl self-start">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shrink-0">
                    <Sparkles className="w-4 h-4 animate-spin" />
                  </div>
                  <div className="rounded-2xl p-4 bg-slate-950 border border-slate-800 text-slate-400 text-xs flex items-center gap-2">
                    <span>Analyzing finances for {currentUser.name}...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/60 flex items-center gap-2 overflow-x-auto scrollbar-none">
              {[
                'What should I pay off first?',
                'When is our PG&E or water bill due?',
                'How can I save $100 this month?'
              ].map((chip, i) => (
                <button
                  key={i}
                  onClick={() => handleSendMessage(chip)}
                  className="px-3 py-1 rounded-full text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 whitespace-nowrap transition-colors border border-slate-700"
                >
                  {chip}
                </button>
              ))}
            </div>

            <div className="p-3 border-t border-slate-800 bg-slate-900 flex items-center gap-2">
              <input
                type="text"
                placeholder="Ask Klarity about your cards, debt, or upcoming bills..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleSendMessage();
                }}
                className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!chatInput.trim() || isAiTyping}
                className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white disabled:opacity-50 transition-colors shadow-md shadow-blue-600/25"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ================= MODAL 1: ADD CARD ================= */}
      {isAddAccountOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-400" /> Link Card to {currentUser.name}
              </h3>
              <button onClick={() => setIsAddAccountOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddAccount} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Bank / Institution</label>
                  <input
                    type="text"
                    required
                    value={newAccount.institution}
                    onChange={e => setNewAccount({ ...newAccount, institution: e.target.value })}
                    className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Card Name</label>
                  <input
                    type="text"
                    required
                    value={newAccount.name}
                    onChange={e => setNewAccount({ ...newAccount, name: e.target.value })}
                    className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Type</label>
                  <select
                    value={newAccount.type}
                    onChange={e => setNewAccount({ ...newAccount, type: e.target.value })}
                    className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  >
                    <option value="credit">Credit Card</option>
                    <option value="depository">Debit / Checking</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Current Balance ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={newAccount.balance}
                    onChange={e => setNewAccount({ ...newAccount, balance: e.target.value })}
                    className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  />
                </div>
              </div>

              {newAccount.type === 'credit' && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300">Interest APR (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newAccount.apr}
                      onChange={e => setNewAccount({ ...newAccount, apr: e.target.value })}
                      className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300">Min Payment ($)</label>
                    <input
                      type="number"
                      step="0.01"
                      value={newAccount.minPayment}
                      onChange={e => setNewAccount({ ...newAccount, minPayment: e.target.value })}
                      className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddAccountOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white"
                >
                  Save Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: LOG PURCHASE ================= */}
      {isAddTxOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-400" /> Log Purchase for {currentUser.name}
              </h3>
              <button onClick={() => setIsAddTxOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddTx} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Merchant / Description</label>
                <input
                  type="text"
                  placeholder="e.g. PG&E, Steam, Roblox, Costco, In-N-Out"
                  required
                  value={newTx.name}
                  onChange={e => setNewTx({ ...newTx, name: e.target.value })}
                  className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Amount ($)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="25.50"
                  required
                  value={newTx.amount}
                  onChange={e => setNewTx({ ...newTx, amount: e.target.value })}
                  className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddTxOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white"
                >
                  Log Purchase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: SCAN BILL ================= */}
      {isScanBillOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" /> AI E-Bill & Statement Scanner
              </h3>
              <button onClick={() => setIsScanBillOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <textarea
              rows={6}
              value={scanText}
              onChange={e => setScanText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200"
            />

            {scanResult && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{scanResult}</span>
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsScanBillOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
              >
                Close
              </button>
              <button
                onClick={handleScanBill}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white"
              >
                Parse Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
