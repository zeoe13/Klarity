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
  LogOut,
  Settings,
  Building,
  KeyRound,
  ExternalLink
} from 'lucide-react';
import { usePlaidLink } from 'react-plaid-link';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

export default function App() {
  // Current authenticated user (via Google or stored session)
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('klarity_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [googleEmailFallback, setGoogleEmailFallback] = useState('');
  const [googleNameFallback, setGoogleNameFallback] = useState('');

  // Main dashboard state
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [viewHousehold, setViewHousehold] = useState(false);

  // Settings & Plaid state
  const [settings, setSettings] = useState({ hasPlaidKeys: false, plaidEnv: 'sandbox', googleClientId: '' });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [plaidClientIdInput, setPlaidClientIdInput] = useState('');
  const [plaidSecretInput, setPlaidSecretInput] = useState('');
  const [plaidEnvInput, setPlaidEnvInput] = useState('development');
  const [googleClientIdInput, setGoogleClientIdInput] = useState('');

  // Plaid Link token state
  const [linkToken, setLinkToken] = useState(null);
  const [isConnectingPlaid, setIsConnectingPlaid] = useState(false);
  const [plaidError, setPlaidError] = useState('');

  // AI Chat state
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      text: "👋 Hi! I'm Klarity, your family's personal AI Financial Advisor. Connect your real cards or add your real household bills (like PG&E and Fresno Water) and I'll analyze your payoff priorities and cash flow!"
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
    institution: '',
    name: '',
    type: 'credit',
    balance: '',
    limit: '',
    apr: '',
    minPayment: '',
    dueDate: ''
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
    "PACIFIC GAS AND ELECTRIC COMPANY\nAccount: 4819-2041-02\nTotal Amount Due: $284.50\nPayment Due Date: November 14, 2026\nService: Electric and Natural Gas"
  );
  const [scanResult, setScanResult] = useState(null);
  const [txSearch, setTxSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Load Settings
  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const json = await res.json();
        setSettings(json);
        if (json.googleClientId) setGoogleClientIdInput(json.googleClientId);
      }
    } catch (err) {
      console.warn('Could not fetch settings:', err);
    }
  };

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
    fetchSettings();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchData(currentUser, viewHousehold);
    }
  }, [currentUser, viewHousehold]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiTyping]);

  // Google OAuth Success Handler
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: decoded.email,
          name: decoded.name,
          picture: decoded.picture,
          sub: decoded.sub
        })
      });
      const json = await res.json();
      if (res.ok && json.user) {
        setCurrentUser(json.user);
        localStorage.setItem('klarity_user', JSON.stringify(json.user));
      }
    } catch (err) {
      console.error('Google Sign-In failed:', err);
    }
  };

  // Direct Google Email Sign-In (if OAuth Client ID not yet set)
  const handleDirectGoogleLogin = async (e) => {
    e.preventDefault();
    if (!googleEmailFallback.trim()) return;

    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: googleEmailFallback,
          name: googleNameFallback || googleEmailFallback.split('@')[0],
          picture: '👤'
        })
      });
      const json = await res.json();
      if (res.ok && json.user) {
        setCurrentUser(json.user);
        localStorage.setItem('klarity_user', JSON.stringify(json.user));
      }
    } catch (err) {
      console.error('Login error:', err);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('klarity_user');
  };

  // Save Settings (Plaid / Google Client ID)
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plaidClientId: plaidClientIdInput,
          plaidSecret: plaidSecretInput,
          plaidEnv: plaidEnvInput,
          googleClientId: googleClientIdInput
        })
      });
      setIsSettingsOpen(false);
      await fetchSettings();
    } catch (err) {
      console.error(err);
    }
  };

  // Generate Plaid Link Token & Open Plaid
  const initiatePlaidLink = async () => {
    setIsConnectingPlaid(true);
    setPlaidError('');
    try {
      const res = await fetch('/api/plaid/create-link-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: currentUser.id })
      });
      const json = await res.json();

      if (json.needsKeys) {
        setIsSettingsOpen(true);
        setPlaidError('Please enter your Plaid Client ID and Secret to link real banks.');
        setIsConnectingPlaid(false);
        return;
      }

      if (json.link_token) {
        setLinkToken(json.link_token);
      } else {
        setPlaidError(json.error || 'Failed to generate Plaid link token');
      }
    } catch (err) {
      setPlaidError('Could not reach backend Plaid service');
    } finally {
      setIsConnectingPlaid(false);
    }
  };

  // Plaid Link Hook Component
  const PlaidLauncher = ({ token }) => {
    const { open, ready } = usePlaidLink({
      token,
      onSuccess: async (public_token, metadata) => {
        try {
          const res = await fetch('/api/plaid/exchange-public-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              public_token,
              metadata,
              userId: currentUser.id
            })
          });
          if (res.ok) {
            setLinkToken(null);
            await fetchData();
          }
        } catch (err) {
          console.error('Error exchanging Plaid token:', err);
        }
      },
      onExit: () => setLinkToken(null)
    });

    useEffect(() => {
      if (ready) open();
    }, [ready, open]);

    return null;
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
        { role: 'assistant', text: "⚠️ Unable to contact Klarity AI advisor." }
      ]);
    } finally {
      setIsAiTyping(false);
    }
  };

  // Add Card Manually
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
        setNewAccount({ institution: '', name: '', type: 'credit', balance: '', limit: '', apr: '', minPayment: '', dueDate: '' });
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Real Bill (PG&E, Fresno Water, Xfinity, T-Mobile)
  const handleAddBill = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/bills', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newBill,
          assignedOwnerId: currentUser.id
        })
      });
      if (res.ok) {
        setIsAddBillOpen(false);
        setNewBill({ name: '', biller: '', category: 'Utilities', expectedAmount: '', dueDay: '15' });
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

  // Delete Card
  const handleDeleteAccount = async (id) => {
    if (!confirm('Remove this connected account?')) return;
    try {
      await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  // Active Google Client ID (from settings or fallback)
  const activeGoogleClientId = settings.googleClientId || 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com';

  // ================= 1. GOOGLE SIGN-IN SCREEN =================
  if (!currentUser) {
    return (
      <GoogleOAuthProvider clientId={activeGoogleClientId}>
        <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl flex flex-col gap-6">
            <div className="text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/25 mb-3">
                <ShieldCheck className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-2xl font-black tracking-tight text-white">Klarity</h1>
              <p className="text-xs text-slate-400 mt-1">
                Private Family Banking & AI Financial Advisor
              </p>
            </div>

            {/* Official Google Sign-In */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-5 flex flex-col items-center gap-3">
              <p className="text-xs font-semibold text-slate-300 text-center">
                Sign in with your Google Account
              </p>

              <div className="w-full flex justify-center">
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => console.log('Google Login Failed')}
                  theme="filled_blue"
                  shape="pill"
                  size="large"
                  text="signin_with"
                />
              </div>

              <div className="w-full flex items-center gap-2 my-1">
                <div className="flex-1 h-px bg-slate-800"></div>
                <span className="text-[10px] text-slate-500 uppercase tracking-widest">or enter email</span>
                <div className="flex-1 h-px bg-slate-800"></div>
              </div>

              {/* Direct Google Email Entry */}
              <form onSubmit={handleDirectGoogleLogin} className="w-full flex flex-col gap-2.5">
                <div>
                  <input
                    type="email"
                    required
                    placeholder="name@gmail.com"
                    value={googleEmailFallback}
                    onChange={e => setGoogleEmailFallback(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <input
                    type="text"
                    placeholder="Your Name (e.g. Dad, Sarah, Alex)"
                    value={googleNameFallback}
                    onChange={e => setGoogleNameFallback(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-colors shadow-md shadow-blue-600/20"
                >
                  Continue with Google Email
                </button>
              </form>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-800">
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-emerald-400" /> Private Family Vault
              </span>
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="text-slate-400 hover:text-white flex items-center gap-1"
              >
                <Settings className="w-3.5 h-3.5" /> API Keys
              </button>
            </div>
          </div>

          {/* Settings Modal (if opened on login screen) */}
          {isSettingsOpen && (
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <KeyRound className="w-4 h-4 text-blue-400" /> Configure Real API Keys
                  </h3>
                  <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-white">✕</button>
                </div>
                <form onSubmit={handleSaveSettings} className="flex flex-col gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-300">Plaid Client ID</label>
                    <input
                      type="text"
                      placeholder="e.g. 64a8b..."
                      value={plaidClientIdInput}
                      onChange={e => setPlaidClientIdInput(e.target.value)}
                      className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300">Plaid Secret Key</label>
                    <input
                      type="password"
                      placeholder="e.g. 91d7c..."
                      value={plaidSecretInput}
                      onChange={e => setPlaidSecretInput(e.target.value)}
                      className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-300">Plaid Environment</label>
                    <select
                      value={plaidEnvInput}
                      onChange={e => setPlaidEnvInput(e.target.value)}
                      className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                    >
                      <option value="development">Development (Connect Real Banks)</option>
                      <option value="sandbox">Sandbox (Simulated Banks)</option>
                      <option value="production">Production</option>
                    </select>
                  </div>
                  <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-slate-800">
                    <button type="button" onClick={() => setIsSettingsOpen(false)} className="px-3 py-1.5 text-xs text-slate-400">Cancel</button>
                    <button type="submit" className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-blue-600 text-white">Save Keys</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      </GoogleOAuthProvider>
    );
  }

  // ================= 2. MAIN DASHBOARD (CLEAN SLATE FOR REAL DATA) =================
  const hasAccounts = (data?.accounts || []).length > 0;
  const hasBills = (data?.bills || []).length > 0;
  const highestAprCard = (data?.accounts || [])
    .filter(a => a.type === 'credit' && a.balance > 0 && a.apr > 0)
    .sort((a, b) => b.apr - a.apr)[0];

  const filteredTransactions = (data?.transactions || []).filter(t => {
    const matchCategory = categoryFilter === 'all' ? true : t.category === categoryFilter;
    const matchSearch = txSearch ? t.name.toLowerCase().includes(txSearch.toLowerCase()) : true;
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {linkToken && <PlaidLauncher token={linkToken} />}

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
                  Klarity <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">Live Bank Vault</span>
                </h1>
                <p className="text-xs text-slate-400">Real Cards & Household Bills</p>
              </div>
            </div>

            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={() => setIsSettingsOpen(true)}
                className="p-2 rounded-lg bg-slate-800 text-slate-400"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 rounded-lg bg-slate-800 text-slate-400"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Privacy & Member Info */}
          <div className="flex items-center gap-3 overflow-x-auto pb-1 md:pb-0">
            {/* Logged in User Badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800 border border-slate-700">
              {currentUser.avatar?.startsWith('http') ? (
                <img src={currentUser.avatar} alt="avatar" className="w-5 h-5 rounded-full" />
              ) : (
                <span className="text-base">{currentUser.avatar || '👤'}</span>
              )}
              <span className="text-xs font-semibold text-slate-200">{currentUser.name}</span>
              <span className="text-[10px] text-slate-400 hidden sm:inline">({currentUser.email})</span>
            </div>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Settings & Plaid API Keys"
            >
              <Settings className="w-3.5 h-3.5" /> Plaid Keys
            </button>

            <button
              onClick={handleLogout}
              className="hidden md:flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign Out
            </button>
          </div>

          {/* Quick Actions */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={initiatePlaidLink}
              disabled={isConnectingPlaid}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
            >
              <Building className="w-3.5 h-3.5" /> Connect Real Bank (Plaid)
            </button>
            <button
              onClick={() => setIsAddAccountOpen(true)}
              className="px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" /> Add Manually
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto w-full px-4 py-6 sm:px-6 flex-1 flex flex-col gap-6">
        {/* Plaid Error Banner if needed */}
        {plaidError && (
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{plaidError}</span>
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 font-semibold"
            >
              Enter Plaid Keys
            </button>
          </div>
        )}

        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-800 gap-2 sm:gap-6 overflow-x-auto">
          {[
            { id: 'dashboard', label: 'My Dashboard', icon: TrendingUp },
            { id: 'cards', label: `My Real Cards (${data?.accounts?.length || 0})`, icon: CreditCard },
            { id: 'bills', label: `Household Bills (${data?.bills?.length || 0})`, icon: Zap },
            { id: 'purchases', label: `Purchases (${filteredTransactions.length})`, icon: Receipt },
            { id: 'ai', label: 'Klarity AI Advisor', icon: Bot, badge: 'Live' }
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
                  <span>Total Real Checking</span>
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-white">
                    ${data?.metrics?.totalChecking?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">From your connected banks</p>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                  <span>Total Credit Card Balances</span>
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                    <CreditCard className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-white">
                    ${data?.metrics?.totalCreditDebt?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Across connected credit cards</p>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                  <span>Monthly Bills & Utilities</span>
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                    <Zap className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-white">
                    ${data?.metrics?.totalMonthlyBills?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    <span className="text-xs font-normal text-slate-400">/mo</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Tracked household bills</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-950 to-slate-900 border border-indigo-800/40 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-indigo-300 text-xs font-medium">
                  <span>AI Advisor Status</span>
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="mt-2">
                  <div className="text-sm font-bold text-white">
                    {hasAccounts ? 'Monitoring Active Cards' : 'Awaiting Card Connection'}
                  </div>
                  <p className="text-xs text-slate-300 mt-1">
                    {hasAccounts
                      ? 'Klarity is ready to guide your payments.'
                      : 'Connect your real bank to start AI analysis.'}
                  </p>
                  <button
                    onClick={() => setActiveTab('ai')}
                    className="mt-3 text-xs text-indigo-300 hover:text-white font-medium flex items-center gap-1"
                  >
                    Open AI Chat <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* If zero accounts connected: Big friendly connection banner */}
            {!hasAccounts && (
              <div className="bg-gradient-to-r from-blue-950/60 to-slate-900 border border-blue-900/60 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center shrink-0">
                    <Building className="w-7 h-7" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-white">Connect Your First Real Bank Account</h2>
                    <p className="text-xs text-slate-300 mt-1 max-w-xl">
                      Klarity uses <strong>Plaid</strong> to securely connect to Chase, Bank of America, Capital One, Wells Fargo, Amex, and 12,000+ financial institutions. All balances and purchases sync automatically.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <button
                    onClick={initiatePlaidLink}
                    disabled={isConnectingPlaid}
                    className="px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/25 flex items-center gap-2"
                  >
                    <Building className="w-4 h-4" /> Connect with Plaid
                  </button>
                  <button
                    onClick={() => setIsAddAccountOpen(true)}
                    className="px-4 py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs border border-slate-700"
                  >
                    Add Manually
                  </button>
                </div>
              </div>
            )}

            {/* Split Grid: Household Bills & AI Chat */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Bills List */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" /> Household Bills (PG&E, Water, Internet, Phone)
                    </h2>
                    <p className="text-xs text-slate-400">Add your family's real recurring utility bills</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsScanBillOpen(true)}
                      className="text-xs text-slate-300 hover:text-white font-medium flex items-center gap-1 bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700"
                    >
                      <FileText className="w-3.5 h-3.5 text-blue-400" /> Scan Statement
                    </button>
                    <button
                      onClick={() => setIsAddBillOpen(true)}
                      className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" /> Add Bill
                    </button>
                  </div>
                </div>

                {!hasBills ? (
                  <div className="p-8 text-center border border-dashed border-slate-800 rounded-2xl">
                    <Zap className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-300">No household bills added yet</p>
                    <p className="text-xs text-slate-500 mt-1 mb-4">
                      Add your PG&E, City of Fresno Water, Xfinity, or T-Mobile bill to track due dates.
                    </p>
                    <button
                      onClick={() => setIsAddBillOpen(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-blue-600 text-white text-xs font-medium"
                    >
                      + Add Household Bill
                    </button>
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800">
                    {data.bills.map(bill => (
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
                            <span className="text-[10px] px-1.5 py-0.5 rounded font-semibold bg-slate-800 text-slate-400">
                              {bill.status === 'paid' ? 'Paid' : 'Upcoming'}
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
                )}
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
                    {hasAccounts
                      ? `I am monitoring your ${data.accounts.length} connected accounts. Ask me about bill payments or payoff strategies.`
                      : "Once you link your bank, I'll calculate your highest APR debt and alert you to upcoming utility bills!"}
                  </div>

                  <p className="text-xs font-semibold text-slate-400 mb-2">Common questions:</p>
                  <div className="flex flex-col gap-1.5">
                    {[
                      'What bills are due this month?',
                      'How do I lower my electric bill?',
                      'What card should I pay off first?'
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
                <h2 className="text-lg font-bold text-white">Connected Real Banks & Cards</h2>
                <p className="text-xs text-slate-400">
                  Securely connected via Plaid for <strong>{currentUser.name}</strong>.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={initiatePlaidLink}
                  disabled={isConnectingPlaid}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 flex items-center gap-2"
                >
                  <Building className="w-4 h-4" /> Connect with Plaid
                </button>
                <button
                  onClick={() => setIsAddAccountOpen(true)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" /> Add Manually
                </button>
              </div>
            </div>

            {!hasAccounts ? (
              <div className="p-12 text-center border border-dashed border-slate-800 rounded-3xl bg-slate-900/40">
                <Building className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white">No Real Cards Linked Yet</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto mb-6">
                  Click the button below to connect your real bank through Plaid (Chase, Capital One, Wells Fargo, BofA, Discover, etc.) or add a card manually.
                </p>
                <button
                  onClick={initiatePlaidLink}
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-600/20"
                >
                  Connect Real Bank via Plaid
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {data.accounts.map(acc => {
                  const isCredit = acc.type === 'credit';
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
                          <button
                            onClick={() => handleDeleteAccount(acc.id)}
                            className="text-slate-500 hover:text-red-400 p-1"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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

                      <div className="mt-5 pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
                        <span>{isCredit ? 'Credit Card' : 'Checking Account'}</span>
                        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                          Live Sync
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 3: BILLS ================= */}
        {activeTab === 'bills' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" /> Real Household Bills & Utilities
                </h2>
                <p className="text-xs text-slate-400">
                  Track actual payments for PG&E, Fresno Water, Xfinity, and T-Mobile.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsScanBillOpen(true)}
                  className="px-3 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 flex items-center gap-1.5"
                >
                  <FileText className="w-4 h-4 text-blue-400" /> Scan Statement
                </button>
                <button
                  onClick={() => setIsAddBillOpen(true)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Add Bill
                </button>
              </div>
            </div>

            {!hasBills ? (
              <div className="p-12 text-center border border-dashed border-slate-800 rounded-3xl bg-slate-900/40">
                <Zap className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white">No Household Bills Added Yet</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto mb-6">
                  Add your utility providers (PG&E, City of Fresno Water, Xfinity, T-Mobile) to get due date reminders.
                </p>
                <button
                  onClick={() => setIsAddBillOpen(true)}
                  className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs"
                >
                  + Add First Bill
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {data.bills.map(bill => (
                  <div key={bill.id} className="rounded-2xl p-5 border bg-slate-900 border-slate-800 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between">
                        <h3 className="text-sm font-bold text-white">{bill.name}</h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-slate-800 text-slate-300">
                          {bill.category}
                        </span>
                      </div>
                      <div className="mt-4 flex items-baseline justify-between">
                        <div>
                          <p className="text-xs text-slate-400">Amount Due</p>
                          <p className="text-xl font-bold text-white">${bill.expectedAmount.toFixed(2)}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-slate-400">Due Date</p>
                          <p className="text-xs font-semibold text-slate-200">{bill.nextDueDate}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-800 flex justify-end">
                      {bill.status !== 'paid' && (
                        <button
                          onClick={() => handlePayBill(bill.id)}
                          className="px-3 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white font-medium text-xs transition-colors"
                        >
                          Mark Paid
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: PURCHASES ================= */}
        {activeTab === 'purchases' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white">Live Purchases & Auto-Categories</h2>
                <p className="text-xs text-slate-400">
                  Transactions synced directly from connected banks for <strong>{currentUser.name}</strong>.
                </p>
              </div>
              <button
                onClick={() => setIsAddTxOpen(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Log Purchase
              </button>
            </div>

            {filteredTransactions.length === 0 ? (
              <div className="p-12 text-center border border-dashed border-slate-800 rounded-3xl bg-slate-900/40">
                <Receipt className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <h3 className="text-base font-bold text-white">No Transactions Yet</h3>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto mb-6">
                  Once you link a bank through Plaid, your recent purchases will populate here automatically.
                </p>
              </div>
            ) : (
              <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800 overflow-hidden">
                {filteredTransactions.map(tx => (
                  <div key={tx.id} className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-base shrink-0">
                        {tx.category === 'Gaming' ? '🎮' : tx.category === 'Subscriptions' ? '📺' : tx.category === 'Utilities' ? '⚡' : '💳'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-white truncate">{tx.name}</p>
                        <p className="text-xs text-slate-400">{tx.date}</p>
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
            )}
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
                      Live
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
                      {isAssistant ? <Sparkles className="w-4 h-4" /> : 'You'}
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
                    <span>Analyzing real finances for {currentUser.name}...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
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

      {/* ================= MODAL: PLAID / API SETTINGS ================= */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-emerald-400" /> Plaid API Settings (Connect Real Banks)
              </h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <div className="bg-blue-950/40 border border-blue-900/60 rounded-xl p-3 text-xs text-blue-200 leading-relaxed">
              💡 Plaid gives developers free access to connect up to <strong>100 live family bank accounts</strong> in Development mode! Get your free keys at <a href="https://plaid.com" target="_blank" rel="noreferrer" className="underline font-bold text-white">plaid.com</a>.
            </div>

            <form onSubmit={handleSaveSettings} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Plaid Client ID</label>
                <input
                  type="text"
                  placeholder="e.g. 64b19..."
                  value={plaidClientIdInput}
                  onChange={e => setPlaidClientIdInput(e.target.value)}
                  className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Plaid Secret</label>
                <input
                  type="password"
                  placeholder="e.g. 81a9..."
                  value={plaidSecretInput}
                  onChange={e => setPlaidSecretInput(e.target.value)}
                  className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Environment</label>
                <select
                  value={plaidEnvInput}
                  onChange={e => setPlaidEnvInput(e.target.value)}
                  className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                >
                  <option value="development">Development (Real Bank Logins - Free up to 100 accounts)</option>
                  <option value="sandbox">Sandbox (Test Mode)</option>
                  <option value="production">Production</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Google OAuth Client ID (Optional)</label>
                <input
                  type="text"
                  placeholder="your-app.apps.googleusercontent.com"
                  value={googleClientIdInput}
                  onChange={e => setGoogleClientIdInput(e.target.value)}
                  className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-slate-800">
                <button type="button" onClick={() => setIsSettingsOpen(false)} className="px-3 py-1.5 text-xs text-slate-400">Cancel</button>
                <button type="submit" className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white">Save API Keys</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD CARD MANUALLY ================= */}
      {isAddAccountOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-400" /> Add Card Manually
              </h3>
              <button onClick={() => setIsAddAccountOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddAccount} className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Bank / Card Issuer</label>
                  <input
                    type="text"
                    required
                    placeholder="Chase, Amex, BofA..."
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
                    placeholder="Sapphire, Gold Card..."
                    value={newAccount.name}
                    onChange={e => setNewAccount({ ...newAccount, name: e.target.value })}
                    className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Account Type</label>
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
                    placeholder="0.00"
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
                      placeholder="e.g. 24.99"
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
                      placeholder="35.00"
                      value={newAccount.minPayment}
                      onChange={e => setNewAccount({ ...newAccount, minPayment: e.target.value })}
                      className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setIsAddAccountOpen(false)} className="px-4 py-2 text-xs text-slate-400">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white">Save Card</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: ADD REAL BILL ================= */}
      {isAddBillOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" /> Add Real Household Bill
              </h3>
              <button onClick={() => setIsAddBillOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <form onSubmit={handleAddBill} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Provider Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PG&E, City of Fresno Water, Xfinity, T-Mobile"
                  value={newBill.name}
                  onChange={e => setNewBill({ ...newBill, name: e.target.value })}
                  className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Category</label>
                  <select
                    value={newBill.category}
                    onChange={e => setNewBill({ ...newBill, category: e.target.value })}
                    className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  >
                    <option value="Utilities">Utilities</option>
                    <option value="Subscriptions">Subscriptions</option>
                    <option value="Gaming">Gaming Pass</option>
                    <option value="Insurance">Insurance</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-300">Amount Due ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 150.00"
                    value={newBill.expectedAmount}
                    onChange={e => setNewBill({ ...newBill, expectedAmount: e.target.value })}
                    className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Due Day of Month (1-31)</label>
                <input
                  type="number"
                  min="1"
                  max="31"
                  value={newBill.dueDay}
                  onChange={e => setNewBill({ ...newBill, dueDay: e.target.value })}
                  className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-slate-800">
                <button type="button" onClick={() => setIsAddBillOpen(false)} className="px-4 py-2 text-xs text-slate-400">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white">Save Bill</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: SCAN STATEMENT ================= */}
      {isScanBillOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" /> AI Statement & E-Bill Scanner
              </h3>
              <button onClick={() => setIsScanBillOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Paste your PG&E, Fresno Water, Xfinity, or T-Mobile email statement text. Klarity will parse the biller, due date, and amount automatically.
            </p>

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
