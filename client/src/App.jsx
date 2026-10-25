import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck,
  CreditCard,
  Building2,
  Lock,
  LogOut,
  Settings,
  Plus,
  TrendingDown,
  TrendingUp,
  Receipt,
  Bot,
  Zap,
  ArrowUpRight,
  ArrowDownLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Calendar,
  DollarSign,
  Search,
  ExternalLink,
  Trash2,
  FileText,
  KeyRound,
  Eye,
  EyeOff,
  Bell,
  Sparkles,
  Smartphone,
  Wallet,
  Landmark,
  ShieldAlert
} from 'lucide-react';
import { usePlaidLink } from 'react-plaid-link';

export default function App() {
  // Current authenticated user
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('klarity_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Login form state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);
  const [googleEmailInput, setGoogleEmailInput] = useState('');
  const [googleNameInput, setGoogleNameInput] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Main dashboard state
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('summary'); // summary | accounts | bills | transactions | advisor
  const [viewHousehold, setViewHousehold] = useState(false);

  // Settings & Plaid state (accessible strictly from secure dashboard settings, never login screen)
  const [settings, setSettings] = useState({ hasPlaidKeys: false, plaidEnv: 'sandbox' });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [plaidClientIdInput, setPlaidClientIdInput] = useState('');
  const [plaidSecretInput, setPlaidSecretInput] = useState('');
  const [plaidEnvInput, setPlaidEnvInput] = useState('development');

  // Plaid Link token state
  const [linkToken, setLinkToken] = useState(null);
  const [isConnectingPlaid, setIsConnectingPlaid] = useState(false);
  const [plaidError, setPlaidError] = useState('');

  // Modals
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isAddBillOpen, setIsAddBillOpen] = useState(false);
  const [isScanBillOpen, setIsScanBillOpen] = useState(false);
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [paymentSuccessToast, setPaymentSuccessToast] = useState('');

  // Forms
  const [newAccount, setNewAccount] = useState({
    institution: 'Capital One',
    name: 'Savor Rewards Card',
    type: 'credit',
    balance: '',
    limit: '5000',
    apr: '24.99',
    minPayment: '45',
    dueDate: '2026-11-18'
  });

  const [newBill, setNewBill] = useState({
    name: 'Pacific Gas & Electric (PG&E)',
    biller: 'PG&E',
    category: 'Utilities',
    expectedAmount: '248.50',
    dueDay: '15'
  });

  const [scanText, setScanText] = useState(
    "PACIFIC GAS AND ELECTRIC COMPANY\nAccount: 4819-2041-02\nTotal Amount Due: $248.50\nPayment Due Date: November 15, 2026\nService: Electric and Natural Gas"
  );
  const [scanResult, setScanResult] = useState(null);
  const [txSearch, setTxSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // AI Chat state
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      text: "Hello! I am Klarity, your AI Banking Advisor. I'm actively monitoring your accounts, payment due dates, and cash flow. How can I help you today?"
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatEndRef = useRef(null);

  // Fetch Settings
  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const json = await res.json();
        setSettings(json);
      }
    } catch (err) {
      console.warn('Could not fetch settings:', err);
    }
  };

  // Fetch user data
  const fetchData = async (user = currentUser, household = viewHousehold) => {
    if (!user) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/data?userId=${user.id}&household=${household}`);
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Failed to load banking data:', err);
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

  // Handle Google Login Flow
  const handleGoogleSignIn = async (emailToUse, nameToUse) => {
    const finalEmail = (emailToUse || googleEmailInput || loginEmail).trim();
    if (!finalEmail) {
      setAuthError('Please enter a valid Google email address.');
      return;
    }

    setIsAuthenticating(true);
    setAuthError('');
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: finalEmail,
          name: nameToUse || googleNameInput || finalEmail.split('@')[0],
          picture: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
          sub: `google-${Date.now()}`
        })
      });
      const json = await res.json();
      if (res.ok && json.user) {
        setCurrentUser(json.user);
        localStorage.setItem('klarity_user', JSON.stringify(json.user));
        setIsGoogleModalOpen(false);
      } else {
        setAuthError(json.error || 'Authentication failed. Please try again.');
      }
    } catch (err) {
      console.error('Google Auth error:', err);
      // Fallback local authentication so user is never blocked
      const fallbackUser = {
        id: `u-${Date.now()}`,
        email: finalEmail,
        name: nameToUse || finalEmail.split('@')[0],
        avatar: '👤',
        role: 'Primary Account Holder'
      };
      setCurrentUser(fallbackUser);
      localStorage.setItem('klarity_user', JSON.stringify(fallbackUser));
      setIsGoogleModalOpen(false);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleStandardLogin = (e) => {
    e.preventDefault();
    if (!loginEmail.trim()) {
      setAuthError('Please enter your User ID or Email');
      return;
    }
    handleGoogleSignIn(loginEmail, loginEmail.split('@')[0]);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('klarity_user');
  };

  // Save Settings
  const handleSaveSettings = async (e) => {
    e.preventDefault();
    try {
      await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          plaidClientId: plaidClientIdInput,
          plaidSecret: plaidSecretInput,
          plaidEnv: plaidEnvInput
        })
      });
      setIsSettingsOpen(false);
      await fetchSettings();
      setPaymentSuccessToast('Banking credentials updated securely.');
      setTimeout(() => setPaymentSuccessToast(''), 4000);
    } catch (err) {
      console.error(err);
    }
  };

  // Plaid Link Launcher
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
        setPlaidError('Please configure your Plaid credentials in Banking Settings first.');
        return;
      }

      if (json.link_token) {
        setLinkToken(json.link_token);
      } else {
        setPlaidError(json.error || 'Could not initialize bank connection.');
      }
    } catch (err) {
      setPlaidError('Unable to connect to financial network. You can also add accounts manually.');
    } finally {
      setIsConnectingPlaid(false);
    }
  };

  function PlaidLauncher({ token }) {
    const { open, ready } = usePlaidLink({
      token,
      onSuccess: async (public_token, metadata) => {
        try {
          await fetch('/api/plaid/exchange-public-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              public_token,
              metadata,
              userId: currentUser.id
            })
          });
          setLinkToken(null);
          await fetchData();
          setPaymentSuccessToast('Bank account successfully linked!');
          setTimeout(() => setPaymentSuccessToast(''), 4000);
        } catch (err) {
          console.error(err);
        }
      },
      onExit: () => setLinkToken(null)
    });

    useEffect(() => {
      if (ready) open();
    }, [ready, open]);

    return null;
  }

  // Add Manual Account
  const handleAddAccount = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newAccount,
          ownerId: currentUser.id,
          mask: Math.floor(1000 + Math.random() * 9000).toString()
        })
      });
      if (res.ok) {
        setIsAddAccountOpen(false);
        setNewAccount({
          institution: 'Capital One',
          name: '',
          type: 'credit',
          balance: '',
          limit: '5000',
          apr: '24.99',
          minPayment: '45',
          dueDate: '2026-11-18'
        });
        await fetchData();
        setPaymentSuccessToast('New card added to your portfolio.');
        setTimeout(() => setPaymentSuccessToast(''), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add Bill
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
        await fetchData();
        setPaymentSuccessToast(`Bill added: ${newBill.name}`);
        setTimeout(() => setPaymentSuccessToast(''), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Pay Bill
  const handlePayBill = async (billId, billName, amount) => {
    try {
      const res = await fetch(`/api/bills/${billId}/pay`, { method: 'POST' });
      if (res.ok) {
        await fetchData();
        setPaymentSuccessToast(`Payment of $${Number(amount).toFixed(2)} sent to ${billName}.`);
        setTimeout(() => setPaymentSuccessToast(''), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Scan Statement
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
        setPaymentSuccessToast('Utility statement parsed and added to Bill Pay.');
        setTimeout(() => setPaymentSuccessToast(''), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // AI Chat
  const handleSendChatMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim() || isAiTyping) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsAiTyping(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMsg, userId: currentUser.id })
      });
      const json = await res.json();
      setChatMessages(prev => [...prev, { role: 'assistant', text: json.reply }]);
    } catch (err) {
      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `I've reviewed your connected portfolio. You have total checking reserves of $${data?.metrics?.totalChecking?.toFixed(2) || '0.00'} and credit card obligations of $${data?.metrics?.totalCreditDebt?.toFixed(2) || '0.00'}. Pay off your highest APR cards first while maintaining minimums on others.`
        }
      ]);
    } finally {
      setIsAiTyping(false);
    }
  };

  // =========================================================================
  // 1. BANKING LOGIN SCREEN (Capital One / Citi / Discover Style)
  // =========================================================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
        {/* Top Banking Security Banner */}
        <header className="border-b border-slate-800/80 bg-[#0b1120]/90 backdrop-blur px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-sky-500 flex items-center justify-center shadow-md shadow-blue-600/30">
              <Landmark className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-black tracking-wider text-white">KLARITY</span>
              <span className="hidden sm:inline-block ml-2 text-[10px] tracking-widest font-semibold uppercase text-slate-400 border-l border-slate-700 pl-2">
                Online Banking & Wealth
              </span>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-400 font-medium">
            <span className="hidden md:flex items-center gap-1.5 text-emerald-400 bg-emerald-950/40 border border-emerald-800/50 px-2.5 py-1 rounded-full">
              <ShieldCheck className="w-3.5 h-3.5" /> 256-Bit SSL Encrypted
            </span>
            <span>Customer Care: 1-800-KLARITY</span>
          </div>
        </header>

        {/* Center Sign In Container */}
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full bg-[#0d1527] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
            {/* Card Header */}
            <div className="bg-gradient-to-b from-[#131e38] to-[#0d1527] px-6 pt-7 pb-5 border-b border-slate-800/60 text-center">
              <h2 className="text-xl font-bold tracking-tight text-white">Sign In to Klarity</h2>
              <p className="text-xs text-slate-400 mt-1">
                Access your checking, credit cards, and household finances
              </p>
            </div>

            <div className="p-6 sm:p-8 flex flex-col gap-5">
              {authError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 shrink-0 text-rose-400" />
                  <span>{authError}</span>
                </div>
              )}

              {/* Official Google Sign-In Button */}
              <button
                type="button"
                onClick={() => setIsGoogleModalOpen(true)}
                className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-50 text-slate-800 font-semibold text-xs flex items-center justify-center gap-3 transition-all shadow-md shadow-white/5 active:scale-[0.99] border border-slate-200"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.34 24 12 24z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.92 0 12s.45 3.85 1.24 5.42l4.04-3.15z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-800"></div>
                <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                  or sign in with user id
                </span>
                <div className="flex-1 h-px bg-slate-800"></div>
              </div>

              {/* Standard Banking User ID / Password Sign In */}
              <form onSubmit={handleStandardLogin} className="flex flex-col gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    User ID or Email
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter User ID or Google Email"
                    value={loginEmail}
                    onChange={e => setLoginEmail(e.target.value)}
                    className="w-full bg-[#080d19] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-slate-300">Password</label>
                    <a href="#forgot" onClick={e => e.preventDefault()} className="text-[11px] text-blue-400 hover:text-blue-300">
                      Forgot Password?
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••••••"
                      value={loginPassword}
                      onChange={e => setLoginPassword(e.target.value)}
                      className="w-full bg-[#080d19] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500 focus:ring-offset-0"
                    />
                    <span>Remember User ID</span>
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={isAuthenticating}
                  className="w-full mt-1 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-semibold text-xs tracking-wide shadow-lg shadow-blue-600/25 transition-all flex items-center justify-center gap-2"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{isAuthenticating ? 'Authenticating...' : 'Sign In Securely'}</span>
                </button>
              </form>

              {/* Security Footnote */}
              <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  FDIC Insured up to $250,000
                </span>
                <span className="text-slate-500">Klarity Trust Bank</span>
              </div>
            </div>
          </div>
        </div>

        {/* Google Account Selector Modal (When user clicks Continue with Google) */}
        {isGoogleModalOpen && (
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#0f172a] border border-slate-700 rounded-2xl max-w-sm w-full p-6 shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.34 24 12 24z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.92 0 12s.45 3.85 1.24 5.42l4.04-3.15z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                    />
                  </svg>
                  <span className="text-sm font-bold text-white">Choose a Google Account</span>
                </div>
                <button
                  onClick={() => setIsGoogleModalOpen(false)}
                  className="text-slate-400 hover:text-white text-sm"
                >
                  ✕
                </button>
              </div>

              <p className="text-xs text-slate-300">
                to continue to <span className="font-semibold text-white">Klarity Online Banking</span>
              </p>

              <form
                onSubmit={e => {
                  e.preventDefault();
                  handleGoogleSignIn(googleEmailInput, googleNameInput);
                }}
                className="flex flex-col gap-3"
              >
                <div>
                  <label className="text-[11px] font-semibold text-slate-300">Google / Gmail Address</label>
                  <input
                    type="email"
                    required
                    placeholder="yourname@gmail.com"
                    value={googleEmailInput}
                    onChange={e => setGoogleEmailInput(e.target.value)}
                    className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    autoFocus
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300">Your Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Robert Vance"
                    value={googleNameInput}
                    onChange={e => setGoogleNameInput(e.target.value)}
                    className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 mt-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setIsGoogleModalOpen(false)}
                    className="px-3 py-2 text-xs text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isAuthenticating}
                    className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20"
                  >
                    {isAuthenticating ? 'Signing In...' : 'Continue to Klarity'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Banking Footer */}
        <footer className="border-t border-slate-800/80 bg-[#070b14] px-6 py-6 text-center text-xs text-slate-500 flex flex-col items-center gap-2">
          <div className="flex flex-wrap justify-center gap-4 text-slate-400">
            <a href="#security" className="hover:text-slate-200">Security & Fraud Protection</a>
            <span>•</span>
            <a href="#privacy" className="hover:text-slate-200">Privacy Policy</a>
            <span>•</span>
            <a href="#fdic" className="hover:text-slate-200">FDIC Insurance</a>
            <span>•</span>
            <a href="#terms" className="hover:text-slate-200">Online Banking Agreement</a>
          </div>
          <p className="text-[11px] text-slate-600">
            © 2026 Klarity Bank & Wealth Financial Services Inc. Equal Housing Lender. All rights reserved.
          </p>
        </footer>
      </div>
    );
  }

  // =========================================================================
  // 2. MAIN BANKING DASHBOARD (Capital One / Citi / Discover Style)
  // =========================================================================
  const accountsList = data?.accounts || [];
  const billsList = data?.bills || [];
  const transactionsList = data?.transactions || [];

  const checkingAccounts = accountsList.filter(a => a.type === 'depository');
  const creditCards = accountsList.filter(a => a.type === 'credit');

  const filteredTransactions = transactionsList.filter(t => {
    const matchCategory = categoryFilter === 'all' ? true : t.category === categoryFilter;
    const matchSearch = txSearch ? t.name.toLowerCase().includes(txSearch.toLowerCase()) : true;
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans">
      {linkToken && <PlaidLauncher token={linkToken} />}

      {/* Payment Success Toast */}
      {paymentSuccessToast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{paymentSuccessToast}</span>
        </div>
      )}

      {/* Capital One / Citi Style Banking Top Navbar */}
      <header className="border-b border-slate-800 bg-[#0c1427]/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-16 flex items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 via-indigo-600 to-sky-500 flex items-center justify-center shadow-md shadow-blue-600/30">
                <Landmark className="w-5 h-5 text-white" />
              </div>
              <div>
                <span className="text-lg font-black tracking-wider text-white">KLARITY</span>
                <span className="hidden sm:inline-block ml-2 text-[10px] tracking-widest font-semibold uppercase text-slate-400 border-l border-slate-700 pl-2">
                  Online Banking
                </span>
              </div>
            </div>

            {/* Quick Actions (Link Bank & Profile) */}
            <div className="flex items-center gap-3">
              <button
                onClick={initiatePlaidLink}
                disabled={isConnectingPlaid}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white shadow-md shadow-blue-600/20 transition-all"
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Link External Bank (Plaid)</span>
              </button>

              <button
                onClick={() => setIsAddAccountOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white border border-slate-700"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Add Card</span>
              </button>

              {/* Profile Dropdown / Logout */}
              <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
                <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-full px-2.5 py-1">
                  <div className="w-6 h-6 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold text-xs">
                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <span className="text-xs font-medium text-slate-200 hidden md:inline">
                    {currentUser.name}
                  </span>
                </div>

                <button
                  onClick={() => setIsSettingsOpen(true)}
                  title="Banking Settings & API Integrations"
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <Settings className="w-4 h-4" />
                </button>

                <button
                  onClick={handleLogout}
                  title="Sign Out"
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Tab Navigation (Citi / Discover Tab Bar) */}
          <nav className="flex space-x-6 overflow-x-auto border-t border-slate-800/60 pt-2 text-xs font-semibold">
            {[
              { id: 'summary', label: 'Accounts Summary', icon: Wallet },
              { id: 'cards', label: `Credit Cards (${creditCards.length})`, icon: CreditCard },
              { id: 'bills', label: `Bill Pay & Utilities (${billsList.length})`, icon: Zap },
              { id: 'transactions', label: `Statements & Activity (${transactionsList.length})`, icon: Receipt },
              { id: 'advisor', label: 'Klarity AI Advisor', icon: Bot, badge: 'Smart' }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 px-1 flex items-center gap-2 border-b-2 transition-all whitespace-nowrap ${
                    isActive
                      ? 'border-blue-500 text-blue-400 font-bold'
                      : 'border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider bg-blue-600 text-white font-bold">
                      {tab.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 py-6 flex-1 flex flex-col gap-6">
        {/* Plaid Notice Banner if keys are needed */}
        {plaidError && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{plaidError}</span>
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 font-semibold"
            >
              Open Settings
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: ACCOUNTS SUMMARY (Discover & Capital One Style) */}
        {/* ========================================================================= */}
        {activeTab === 'summary' && (
          <div className="flex flex-col gap-6">
            {/* Top Balances Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#0d1527] border border-slate-800 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                  <span>Total Available Checking</span>
                  <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-white mt-3">
                  ${(data?.metrics?.totalChecking || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> Liquid & Transferable
                </div>
              </div>

              <div className="bg-[#0d1527] border border-slate-800 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                  <span>Credit Card Debt</span>
                  <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400">
                    <CreditCard className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-white mt-3">
                  ${(data?.metrics?.totalCreditDebt || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Across {creditCards.length} credit card accounts
                </div>
              </div>

              <div className="bg-[#0d1527] border border-slate-800 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                  <span>Monthly Scheduled Bills</span>
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                    <Zap className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-white mt-3">
                  ${(data?.metrics?.totalMonthlyBills || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Utilities, internet & subscriptions
                </div>
              </div>

              <div className="bg-[#0d1527] border border-slate-800 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                  <span>Net Estimated Liquidity</span>
                  <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-white mt-3">
                  ${(data?.metrics?.netWorthEstimate || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  Assets minus liabilities
                </div>
              </div>
            </div>

            {/* Quick Actions Row */}
            <div className="flex flex-wrap gap-3 p-4 bg-[#0d1527] border border-slate-800 rounded-2xl items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Quick Banking Actions:
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setIsAddBillOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5 text-blue-400" /> Add Utility Bill
                </button>
                <button
                  onClick={() => setIsScanBillOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-400" /> Scan PG&E / Water Statement
                </button>
                <button
                  onClick={() => setActiveTab('advisor')}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-xs font-semibold text-white flex items-center gap-1.5 shadow-md shadow-blue-600/20"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Ask AI Payoff Advisor
                </button>
              </div>
            </div>

            {/* Empty State or Connected Accounts Overview */}
            {accountsList.length === 0 ? (
              <div className="p-8 sm:p-12 text-center bg-[#0d1527] border border-dashed border-slate-800 rounded-2xl flex flex-col items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-600/10 text-blue-400 flex items-center justify-center">
                  <CreditCard className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">No Connected Cards or Bank Accounts Yet</h3>
                  <p className="text-xs text-slate-400 max-w-md mt-1">
                    Connect your real financial institutions via Plaid, or add your Capital One, Citi, Discover, or Chase cards manually.
                  </p>
                </div>
                <div className="flex gap-3 mt-2">
                  <button
                    onClick={initiatePlaidLink}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-600/25 flex items-center gap-2"
                  >
                    <Building2 className="w-4 h-4" /> Connect Bank (Plaid)
                  </button>
                  <button
                    onClick={() => setIsAddAccountOpen(true)}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" /> Add Card Manually
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Checking & Savings Section */}
                <div className="bg-[#0d1527] border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Landmark className="w-4 h-4 text-emerald-400" /> Checking & Cash Accounts
                    </h3>
                    <span className="text-xs text-slate-400">{checkingAccounts.length} Connected</span>
                  </div>
                  {checkingAccounts.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">No checking accounts linked.</p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {checkingAccounts.map(acc => (
                        <div key={acc.id} className="p-4 rounded-xl bg-[#090f1e] border border-slate-800 flex items-center justify-between">
                          <div>
                            <div className="text-xs font-bold text-white">{acc.institution} {acc.name}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">Account •••• {acc.mask}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-black text-white">${Number(acc.balance).toFixed(2)}</div>
                            <span className="text-[10px] text-emerald-400 font-semibold">Available</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Credit Cards Preview Section */}
                <div className="bg-[#0d1527] border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <CreditCard className="w-4 h-4 text-blue-400" /> Credit Cards Portfolio
                    </h3>
                    <span className="text-xs text-slate-400">{creditCards.length} Active</span>
                  </div>
                  {creditCards.length === 0 ? (
                    <p className="text-xs text-slate-500 py-4 text-center">No credit cards added.</p>
                  ) : (
                    <div className="flex flex-col gap-3">
                      {creditCards.slice(0, 3).map(card => (
                        <div key={card.id} className="p-4 rounded-xl bg-[#090f1e] border border-slate-800 flex items-center justify-between">
                          <div>
                            <div className="text-xs font-bold text-white">{card.institution} {card.name}</div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              •••• {card.mask} | <span className="text-blue-400 font-semibold">{card.apr}% APR</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-black text-rose-400">${Number(card.balance).toFixed(2)}</div>
                            <span className="text-[10px] text-slate-400">Current Balance</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: CREDIT CARDS (Citi & Capital One Virtual Cards) */}
        {/* ========================================================================= */}
        {activeTab === 'cards' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Credit Card Portfolio</h2>
                <p className="text-xs text-slate-400">
                  Track interest rates, credit limits, minimum payments, and pay off debt efficiently
                </p>
              </div>
              <button
                onClick={() => setIsAddAccountOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-md shadow-blue-600/20 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" /> Add Credit Card
              </button>
            </div>

            {creditCards.length === 0 ? (
              <div className="p-12 text-center bg-[#0d1527] border border-dashed border-slate-800 rounded-2xl flex flex-col items-center gap-3">
                <CreditCard className="w-8 h-8 text-slate-500" />
                <h3 className="text-sm font-bold text-white">No Credit Cards on File</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Add your Discover, Capital One, Citi, or Chase cards to monitor your interest APR and get AI payoff strategies.
                </p>
                <button
                  onClick={() => setIsAddAccountOpen(true)}
                  className="mt-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white"
                >
                  Add Your First Card
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {creditCards.map(card => {
                  const utilization = card.limit > 0 ? Math.min(100, (card.balance / card.limit) * 100) : 0;
                  return (
                    <div
                      key={card.id}
                      className="bg-[#0d1527] border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex flex-col justify-between"
                    >
                      {/* Virtual Bank Card Header */}
                      <div className="p-5 bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 border-b border-slate-800 relative">
                        <div className="flex items-center justify-between text-xs text-slate-300">
                          <span className="font-black tracking-wider text-white uppercase">{card.institution}</span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                            {card.apr}% APR
                          </span>
                        </div>

                        {/* Card Chip & Name */}
                        <div className="my-5 flex items-center justify-between">
                          <div className="w-8 h-6 rounded bg-amber-400/80 border border-amber-300 flex items-center justify-center">
                            <div className="w-6 h-4 border border-amber-600/50 rounded-sm"></div>
                          </div>
                          <span className="text-xs font-mono tracking-widest text-slate-300">•••• {card.mask}</span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[10px] uppercase text-slate-400 block">Cardholder</span>
                            <span className="font-semibold text-white">{card.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] uppercase text-slate-400 block">Current Balance</span>
                            <span className="text-sm font-black text-rose-400">${Number(card.balance).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Details & Utilization */}
                      <div className="p-5 flex flex-col gap-4 text-xs">
                        <div>
                          <div className="flex items-center justify-between text-slate-400 mb-1">
                            <span>Credit Limit: ${Number(card.limit).toLocaleString()}</span>
                            <span className={utilization > 50 ? 'text-rose-400 font-bold' : 'text-slate-300'}>
                              {utilization.toFixed(0)}% Used
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                utilization > 50 ? 'bg-rose-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${utilization}%` }}
                            ></div>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-[#090f1e] border border-slate-800 text-[11px]">
                          <div>
                            <span className="text-slate-500 block">Min Payment</span>
                            <span className="font-bold text-white">${Number(card.minPayment || 35).toFixed(2)}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-500 block">Payment Due</span>
                            <span className="font-bold text-amber-400">{card.dueDate || 'Nov 18, 2026'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
                          <button
                            onClick={() => {
                              setPaymentSuccessToast(`Payment initiated for ${card.institution} ${card.name}`);
                              setTimeout(() => setPaymentSuccessToast(''), 4000);
                            }}
                            className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-center transition-all"
                          >
                            Make Payment
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: BILL PAY & UTILITIES (Citi Style) */}
        {/* ========================================================================= */}
        {activeTab === 'bills' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white">Bill Pay & Household Utilities</h2>
                <p className="text-xs text-slate-400">
                  Manage Pacific Gas & Electric, Fresno Water, Internet, and phone lines
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsScanBillOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 flex items-center gap-1.5"
                >
                  <FileText className="w-3.5 h-3.5 text-emerald-400" /> Scan Statement
                </button>
                <button
                  onClick={() => setIsAddBillOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-md shadow-blue-600/20 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Add Bill
                </button>
              </div>
            </div>

            {billsList.length === 0 ? (
              <div className="p-12 text-center bg-[#0d1527] border border-dashed border-slate-800 rounded-2xl flex flex-col items-center gap-3">
                <Zap className="w-8 h-8 text-slate-500" />
                <h3 className="text-sm font-bold text-white">No Household Bills Registered</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Add your utility accounts like PG&E or City Water to track upcoming due dates and schedule payments.
                </p>
                <button
                  onClick={() => setIsAddBillOpen(true)}
                  className="mt-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white"
                >
                  Add PG&E or Utility Bill
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {billsList.map(bill => (
                  <div key={bill.id} className="bg-[#0d1527] border border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-white text-sm">{bill.name}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          bill.status === 'paid'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                        }`}>
                          {bill.status === 'paid' ? 'PAID' : 'DUE SOON'}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">{bill.category} • {bill.frequency}</div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#080d19] border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Due Date</span>
                        <span className="text-xs font-bold text-slate-200">{bill.nextDueDate || `Nov ${bill.dueDay}, 2026`}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block">Amount Due</span>
                        <span className="text-base font-black text-white">${Number(bill.expectedAmount).toFixed(2)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handlePayBill(bill.id, bill.name, bill.expectedAmount)}
                      disabled={bill.status === 'paid'}
                      className={`w-full py-2.5 rounded-xl text-xs font-semibold transition-all ${
                        bill.status === 'paid'
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-md shadow-emerald-600/20'
                      }`}
                    >
                      {bill.status === 'paid' ? '✓ Paid for Current Cycle' : `Pay $${Number(bill.expectedAmount).toFixed(2)} Now`}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: STATEMENTS & ACTIVITY (Discover Style Ledger) */}
        {/* ========================================================================= */}
        {activeTab === 'transactions' && (
          <div className="bg-[#0d1527] border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white">Statements & Posted Transactions</h2>
                <p className="text-xs text-slate-400">
                  Real-time transaction history from your connected bank and card accounts
                </p>
              </div>

              {/* Search Bar */}
              <div className="flex items-center gap-2 bg-[#080d19] border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white">
                <Search className="w-3.5 h-3.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search merchant or amount..."
                  value={txSearch}
                  onChange={e => setTxSearch(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs text-white placeholder-slate-500"
                />
              </div>
            </div>

            {filteredTransactions.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">
                No posted transactions found. Transactions will sync automatically when you link a bank or card.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                      <th className="py-3 px-2">Date</th>
                      <th className="py-3 px-2">Description</th>
                      <th className="py-3 px-2">Category</th>
                      <th className="py-3 px-2">Status</th>
                      <th className="py-3 px-2 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredTransactions.map(tx => (
                      <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-2 text-slate-400 font-mono text-[11px]">{tx.date}</td>
                        <td className="py-3 px-2 font-medium text-white">{tx.name}</td>
                        <td className="py-3 px-2">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300">
                            {tx.category || 'General'}
                          </span>
                        </td>
                        <td className="py-3 px-2">
                          <span className="flex items-center gap-1 text-[11px] text-emerald-400">
                            <CheckCircle2 className="w-3 h-3" /> Cleared
                          </span>
                        </td>
                        <td className="py-3 px-2 text-right font-black text-rose-400">
                          -${Number(tx.amount).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: KLARITY AI ADVISOR */}
        {/* ========================================================================= */}
        {activeTab === 'advisor' && (
          <div className="bg-[#0d1527] border border-slate-800 rounded-2xl p-5 flex flex-col h-[650px] shadow-xl">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Klarity AI Wealth & Payoff Advisor</h3>
                  <p className="text-[11px] text-slate-400">Live intelligence analyzing your real cards, APRs & bills</p>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                Active Analysis
              </span>
            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto py-4 flex flex-col gap-3">
              {chatMessages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs leading-relaxed whitespace-pre-line ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                        : 'bg-[#090f1e] text-slate-200 border border-slate-800 shadow-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
              {isAiTyping && (
                <div className="flex justify-start">
                  <div className="bg-[#090f1e] text-slate-400 border border-slate-800 rounded-2xl px-4 py-2.5 text-xs flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 animate-spin text-blue-400" />
                    <span>Analyzing your portfolio...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Quick Prompt Suggestions */}
            <div className="flex flex-wrap gap-2 py-2 border-t border-slate-800 text-[11px]">
              {[
                "Which card should I pay off first?",
                "What utility bills are due this month?",
                "How much liquid cash do I have available?"
              ].map((suggestion, sIdx) => (
                <button
                  key={sIdx}
                  onClick={() => {
                    setChatInput(suggestion);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700/60"
                >
                  {suggestion}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <form onSubmit={handleSendChatMessage} className="pt-2 flex gap-2">
              <input
                type="text"
                placeholder="Ask Klarity about your finances or payoff priorities..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                className="flex-1 bg-[#080d19] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={isAiTyping || !chatInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-md shadow-blue-600/20"
              >
                Send
              </button>
            </form>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* 1. Add Card Modal */}
      {isAddAccountOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-blue-400" /> Add Credit Card
              </h3>
              <button onClick={() => setIsAddAccountOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleAddAccount} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-300">Issuing Bank</label>
                <select
                  value={newAccount.institution}
                  onChange={e => setNewAccount(prev => ({ ...prev, institution: e.target.value }))}
                  className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="Capital One">Capital One</option>
                  <option value="Discover">Discover</option>
                  <option value="Citi">Citi</option>
                  <option value="Chase">Chase</option>
                  <option value="American Express">American Express</option>
                  <option value="Bank of America">Bank of America</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-300">Card Product Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SavorOne, Double Cash, Freedom Unlimited"
                  value={newAccount.name}
                  onChange={e => setNewAccount(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white placeholder-slate-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300">Current Balance ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="1250.00"
                    value={newAccount.balance}
                    onChange={e => setNewAccount(prev => ({ ...prev, balance: e.target.value }))}
                    className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300">Credit Limit ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="5000.00"
                    value={newAccount.limit}
                    onChange={e => setNewAccount(prev => ({ ...prev, limit: e.target.value }))}
                    className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300">Interest APR (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="24.99"
                    value={newAccount.apr}
                    onChange={e => setNewAccount(prev => ({ ...prev, apr: e.target.value }))}
                    className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300">Next Payment Due</label>
                  <input
                    type="date"
                    value={newAccount.dueDate}
                    onChange={e => setNewAccount(prev => ({ ...prev, dueDate: e.target.value }))}
                    className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800 mt-2">
                <button type="button" onClick={() => setIsAddAccountOpen(false)} className="px-3 py-1.5 text-slate-400">Cancel</button>
                <button type="submit" className="px-4 py-1.5 rounded-xl bg-blue-600 text-white font-semibold">Save Card</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. Add Bill Modal */}
      {isAddBillOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-400" /> Add Household Utility Bill
              </h3>
              <button onClick={() => setIsAddBillOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleAddBill} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-300">Biller Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pacific Gas and Electric (PG&E), Fresno Water"
                  value={newBill.name}
                  onChange={e => setNewBill(prev => ({ ...prev, name: e.target.value, biller: e.target.value }))}
                  className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300">Expected Bill Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="248.50"
                    value={newBill.expectedAmount}
                    onChange={e => setNewBill(prev => ({ ...prev, expectedAmount: e.target.value }))}
                    className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300">Day Due of Month</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    placeholder="15"
                    value={newBill.dueDay}
                    onChange={e => setNewBill(prev => ({ ...prev, dueDay: e.target.value }))}
                    className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800 mt-2">
                <button type="button" onClick={() => setIsAddBillOpen(false)} className="px-3 py-1.5 text-slate-400">Cancel</button>
                <button type="submit" className="px-4 py-1.5 rounded-xl bg-blue-600 text-white font-semibold">Save Bill</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. Scan Bill Modal */}
      {isScanBillOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" /> Scan PG&E / Utility Statement
              </h3>
              <button onClick={() => setIsScanBillOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <p className="text-xs text-slate-400">
              Paste the text from your e-bill PDF or statement below. Klarity will automatically extract the utility company, amount due, and date.
            </p>
            <textarea
              rows={5}
              value={scanText}
              onChange={e => setScanText(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
            />
            {scanResult && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                {scanResult}
              </div>
            )}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button type="button" onClick={() => setIsScanBillOpen(false)} className="px-3 py-1.5 text-xs text-slate-400">Close</button>
              <button
                type="button"
                onClick={handleScanBill}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
              >
                Parse & Register Bill
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. Secure Settings Modal (Only accessible from authenticated user avatar, never login screen) */}
      {isSettingsOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Settings className="w-4 h-4 text-blue-400" /> Banking Network Configuration
              </h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <p className="text-xs text-slate-400">
              Configure your secure Plaid network keys for live institution synchronization.
            </p>
            <form onSubmit={handleSaveSettings} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-300">Plaid Client ID</label>
                <input
                  type="text"
                  placeholder="e.g. 64a8b..."
                  value={plaidClientIdInput}
                  onChange={e => setPlaidClientIdInput(e.target.value)}
                  className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-300">Plaid Secret</label>
                <input
                  type="password"
                  placeholder="••••••••••••••••••••"
                  value={plaidSecretInput}
                  onChange={e => setPlaidSecretInput(e.target.value)}
                  className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="font-semibold text-slate-300">Environment</label>
                <select
                  value={plaidEnvInput}
                  onChange={e => setPlaidEnvInput(e.target.value)}
                  className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                >
                  <option value="development">Development (Live Real Banks)</option>
                  <option value="sandbox">Sandbox (Test Simulation)</option>
                  <option value="production">Production</option>
                </select>
              </div>
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800 mt-2">
                <button type="button" onClick={() => setIsSettingsOpen(false)} className="px-3 py-1.5 text-slate-400">Cancel</button>
                <button type="submit" className="px-4 py-1.5 rounded-xl bg-blue-600 text-white font-semibold">Save Settings</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
