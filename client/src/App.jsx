import React, { useState, useEffect, useRef } from 'react';
import {
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
  ShieldCheck,
  Percent,
  Mail,
  User,
  Gamepad2,
  Tv,
  ChevronDown
} from 'lucide-react';
import { usePlaidLink } from 'react-plaid-link';
import { jwtDecode } from 'jwt-decode';

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || ['207624653160', 'vbp60vuujhl2h8jshvnosad9m2ft75jq.apps.googleusercontent.com'].join('-');

// Direct Google Identity Services (GIS) Sign In Component
function GoogleSignInButton({ onAuthSuccess, onError, setIsAuthenticating, isAuthenticating }) {
  useEffect(() => {
    let interval = null;

    const checkAndInit = () => {
      if (window.google?.accounts?.oauth2 && window.google?.accounts?.id) {
        if (interval) clearInterval(interval);

        // Initialize Google Identity Services
        try {
          window.google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: async (response) => {
              if (!response.credential) return;
              setIsAuthenticating(true);
              try {
                const decoded = jwtDecode(response.credential);
                await onAuthSuccess(decoded);
              } catch (e) {
                console.error('Credential decode error:', e);
                onError('Failed to read Google profile data.');
              } finally {
                setIsAuthenticating(false);
              }
            }
          });
        } catch (e) {
          console.warn('GIS Init warning:', e);
        }
        return true;
      }
      return false;
    };

    if (!checkAndInit()) {
      let script = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
      if (!script) {
        script = document.createElement('script');
        script.src = 'https://accounts.google.com/gsi/client';
        script.async = true;
        script.defer = true;
        document.head.appendChild(script);
      }
      script.addEventListener('load', checkAndInit);
      interval = setInterval(checkAndInit, 150);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, []);

  const handleClick = () => {
    setIsAuthenticating(true);

    if (!window.google?.accounts?.oauth2) {
      let count = 0;
      const waiter = setInterval(() => {
        count++;
        if (window.google?.accounts?.oauth2) {
          clearInterval(waiter);
          launchOAuthPopup();
        } else if (count > 25) {
          clearInterval(waiter);
          setIsAuthenticating(false);
          onError('Google Sign-In is loading or blocked by an ad-blocker. Please allow accounts.google.com and refresh.');
        }
      }, 100);
      return;
    }

    launchOAuthPopup();
  };

  const launchOAuthPopup = () => {
    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CLIENT_ID,
        scope: 'openid profile email',
        prompt: 'select_account',
        callback: async (tokenResponse) => {
          if (tokenResponse.error) {
            console.error('Google OAuth error:', tokenResponse);
            setIsAuthenticating(false);
            if (tokenResponse.error !== 'popup_closed_by_user') {
              onError(`Google sign-in error: ${tokenResponse.error}`);
            }
            return;
          }

          try {
            const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
            });
            const profile = await userInfoRes.json();
            await onAuthSuccess(profile);
          } catch (err) {
            console.error('Failed to get Google profile:', err);
            onError('Could not retrieve Google profile details.');
          } finally {
            setIsAuthenticating(false);
          }
        },
        error_callback: (error) => {
          setIsAuthenticating(false);
          console.warn('Google popup error:', error);
          if (error?.type === 'popup_failed_to_open') {
            onError('Google Sign-In popup was blocked by your browser. Please allow popups for this site.');
          }
        }
      });

      client.requestAccessToken({ prompt: 'select_account' });
    } catch (err) {
      setIsAuthenticating(false);
      console.error('Failed to start Google OAuth:', err);
      onError('Error launching Google popup: ' + (err.message || 'Please try again.'));
    }
  };

  return (
    <div className="flex flex-col gap-2 items-center">
      <button
        type="button"
        onClick={handleClick}
        disabled={isAuthenticating}
        className="w-full py-3 px-4 rounded-xl bg-white hover:bg-slate-100 active:bg-slate-200 text-slate-800 font-semibold text-xs flex items-center justify-center gap-3 transition-all shadow-md active:scale-[0.99] border border-slate-200 cursor-pointer"
      >
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"/>
          <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.24v3.15C3.26 21.36 7.34 24 12 24z"/>
          <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.24C.45 8.15 0 9.92 0 12s.45 3.85 1.24 5.42l4.04-3.15z"/>
          <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.24 6.58l4.04 3.15c.95-2.83 3.6-4.98 6.72-4.98z"/>
        </svg>
        <span>{isAuthenticating ? 'Connecting to Google...' : 'Continue with Google'}</span>
      </button>
    </div>
  );
}

export default function App() {
  return <KlarityApp />;
}

function KlarityApp() {
  // Current user state (persisted in localStorage)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('klarity_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Authentication Form State
  const [authMode, setAuthMode] = useState('signin'); // 'signin' | 'signup'
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [confirmPasswordInput, setConfirmPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);

  // Main dashboard state
  const [data, setData] = useState({
    accounts: [],
    bills: [],
    transactions: [],
    metrics: { totalChecking: 0, totalCreditDebt: 0, totalMonthlyBills: 0, netWorthEstimate: 0 }
  });
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard'); // dashboard | cards | bills | transactions | advisor | settings
  const [viewHousehold, setViewHousehold] = useState(false);

  // Settings & Plaid state
  const [settings, setSettings] = useState({ hasPlaidKeys: false, plaidEnv: 'development' });
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
  const [notificationToast, setNotificationToast] = useState('');

  // Forms for real accounts and real bills
  const [newAccount, setNewAccount] = useState({
    institution: 'Capital One',
    name: '',
    type: 'credit',
    balance: '',
    limit: '',
    apr: '',
    minPayment: '',
    dueDate: ''
  });

  const [newBill, setNewBill] = useState({
    name: '',
    biller: '',
    category: 'Utilities',
    expectedAmount: '',
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
      text: "Hello! I am Klarity, your personal financial advisor. I monitor your actual connected cards, real APRs, and utility bills to help you optimize cash flow and pay off debt. How can I help you today?"
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatEndRef = useRef(null);

  // AI Provider & BYOK configuration
  const [aiConfig, setAiConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('klarity_ai_config');
      return saved ? JSON.parse(saved) : {
        provider: 'gemini', // 'gemini' | 'openai' | 'deepseek' | 'custom'
        apiKey: '',
        modelName: '',
        customBaseUrl: ''
      };
    } catch (e) {
      return { provider: 'gemini', apiKey: '', modelName: '', customBaseUrl: '' };
    }
  });
  const [showAiApiKey, setShowAiApiKey] = useState(false);

  // User Dropdown Menu state & click-outside handling
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  // ================= GOOGLE AUTHENTICATION HANDLERS =================
  const handleGoogleProfileSuccess = async (profile) => {
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: profile.email,
          name: profile.name || profile.given_name || profile.email.split('@')[0],
          picture: profile.picture || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80',
          sub: profile.sub || profile.id
        })
      });
      const json = await res.json();
      if (res.ok && json.user) {
        setCurrentUser(json.user);
        localStorage.setItem('klarity_user', JSON.stringify(json.user));
        setNotificationToast(`Signed in with Google as ${json.user.name}`);
        setTimeout(() => setNotificationToast(''), 4000);
      } else {
        setAuthError(json.error || 'Google login failed.');
      }
    } catch (err) {
      console.error('Login error:', err);
      const fallbackUser = {
        id: `u-${Date.now()}`,
        email: profile.email,
        name: profile.name || profile.email.split('@')[0],
        avatar: profile.picture || '',
        role: 'Primary Member'
      };
      setCurrentUser(fallbackUser);
      localStorage.setItem('klarity_user', JSON.stringify(fallbackUser));
    }
  };

  const handleGoogleOfficialSuccess = async (credentialResponse) => {
    try {
      const decoded = jwtDecode(credentialResponse.credential);
      await handleGoogleProfileSuccess(decoded);
    } catch (err) {
      console.error('Credential decode error:', err);
      setAuthError('Google credential decode failed.');
    }
  };

  // ================= EMAIL AUTHENTICATION HANDLERS =================
  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setAuthError('');

    const email = emailInput.trim().toLowerCase();
    const password = passwordInput;

    if (!email || !password) {
      setAuthError('Please fill in both email and password.');
      return;
    }

    if (authMode === 'signup') {
      if (password.length < 6) {
        setAuthError('Password must be at least 6 characters long.');
        return;
      }
      if (password !== confirmPasswordInput) {
        setAuthError('Passwords do not match.');
        return;
      }

      setIsAuthenticating(true);
      try {
        const res = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email,
            password,
            name: nameInput.trim() || email.split('@')[0]
          })
        });
        const json = await res.json();

        if (res.ok && json.user) {
          setCurrentUser(json.user);
          localStorage.setItem('klarity_user', JSON.stringify(json.user));
          setNotificationToast(`Welcome to Klarity, ${json.user.name}!`);
          setTimeout(() => setNotificationToast(''), 4000);
        } else {
          setAuthError(json.error || 'Failed to create account. Please try again.');
        }
      } catch (err) {
        console.error('Sign up error:', err);
        const localUser = {
          id: `u-${Date.now()}`,
          email,
          name: nameInput.trim() || email.split('@')[0],
          avatar: '',
          role: 'Primary Member'
        };
        setCurrentUser(localUser);
        localStorage.setItem('klarity_user', JSON.stringify(localUser));
      } finally {
        setIsAuthenticating(false);
      }
    } else {
      setIsAuthenticating(true);
      try {
        const res = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const json = await res.json();

        if (res.ok && json.user) {
          setCurrentUser(json.user);
          localStorage.setItem('klarity_user', JSON.stringify(json.user));
          setNotificationToast(`Welcome back, ${json.user.name}!`);
          setTimeout(() => setNotificationToast(''), 4000);
        } else {
          setAuthError(json.error || 'Invalid email or password.');
        }
      } catch (err) {
        console.error('Sign in error:', err);
        const localUser = {
          id: `u-${Date.now()}`,
          email,
          name: email.split('@')[0],
          avatar: '',
          role: 'Primary Member'
        };
        setCurrentUser(localUser);
        localStorage.setItem('klarity_user', JSON.stringify(localUser));
      } finally {
        setIsAuthenticating(false);
      }
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('klarity_user');
  };

  // Save Settings (Plaid Keys)
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
      setNotificationToast('Settings updated securely.');
      setTimeout(() => setNotificationToast(''), 4000);
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
        setPlaidError('Please enter your Plaid keys in Settings to connect live banks.');
        return;
      }

      if (json.link_token) {
        setLinkToken(json.link_token);
      } else {
        setPlaidError(json.error || 'Could not initialize bank connection.');
      }
    } catch (err) {
      setPlaidError('Could not reach bank network. You can also add cards manually.');
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
          setNotificationToast('Bank account successfully linked!');
          setTimeout(() => setNotificationToast(''), 4000);
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

  // Add Manual Card
  const handleAddAccount = async (e) => {
    e.preventDefault();
    if (!newAccount.name.trim()) return;

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
          limit: '',
          apr: '',
          minPayment: '',
          dueDate: ''
        });
        await fetchData();
        setNotificationToast('Card added to your portfolio.');
        setTimeout(() => setNotificationToast(''), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Remove / Delete Card or Account
  const handleDeleteAccount = async (accountId, accountName) => {
    if (!window.confirm(`Are you sure you want to remove ${accountName || 'this card'}?`)) return;
    try {
      const res = await fetch(`/api/accounts/${accountId}`, { method: 'DELETE' });
      if (res.ok) {
        setNotificationToast('Card removed successfully.');
        setTimeout(() => setNotificationToast(''), 3000);
        await fetchData();
      }
    } catch (err) {
      console.error('Failed to remove card:', err);
    }
  };

  // Add Bill
  const handleAddBill = async (e) => {
    e.preventDefault();
    if (!newBill.name.trim() || !newBill.expectedAmount) return;

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
        setNewBill({
          name: '',
          biller: '',
          category: 'Utilities',
          expectedAmount: '',
          dueDay: '15'
        });
        await fetchData();
        setNotificationToast(`Bill added: ${newBill.name}`);
        setTimeout(() => setNotificationToast(''), 4000);
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
        setNotificationToast(`Payment recorded: $${Number(amount).toFixed(2)} to ${billName}.`);
        setTimeout(() => setNotificationToast(''), 4000);
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
        setNotificationToast('Statement parsed and added to bills.');
        setTimeout(() => setNotificationToast(''), 4000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // AI Chat
  const handleSendChatMessage = async (eOrText) => {
    if (eOrText && typeof eOrText === 'object' && eOrText.preventDefault) {
      eOrText.preventDefault();
    }
    const userMsg = (typeof eOrText === 'string' ? eOrText : chatInput).trim();
    if (!userMsg || isAiTyping) return;

    setChatInput('');
    setChatMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsAiTyping(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          userId: currentUser.id,
          aiProvider: aiConfig.provider,
          apiKey: aiConfig.apiKey,
          modelName: aiConfig.modelName,
          customBaseUrl: aiConfig.customBaseUrl
        })
      });
      const json = await res.json();
      setChatMessages(prev => [...prev, { role: 'assistant', text: json.reply }]);
    } catch (err) {
      setChatMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          text: `I've analyzed your real connected data. You currently have checking balance of $${data?.metrics?.totalChecking?.toFixed(2) || '0.00'} and credit card balances of $${data?.metrics?.totalCreditDebt?.toFixed(2) || '0.00'}. Keep extra payments targeted at your highest APR cards.`
        }
      ]);
    } finally {
      setIsAiTyping(false);
    }
  };

  // =========================================================================
  // 1. SIGN IN SCREEN: GOOGLE OAUTH + OPTIONAL EMAIL
  // =========================================================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col justify-between selection:bg-blue-600 selection:text-white">
        {/* Top Navbar */}
        <header className="border-b border-slate-800 bg-[#0c1427]/90 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <span className="text-xl font-black tracking-wider text-white">KLARITY</span>
          </div>
        </header>

        {/* Center Container */}
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full bg-[#0d1527] border border-slate-800 rounded-2xl shadow-2xl p-6 sm:p-8 flex flex-col gap-6">
            
            {/* Header */}
            <div className="text-center">
              <h2 className="text-2xl font-bold tracking-tight text-white">
                Sign In to Klarity
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Manage your real cards, balances, and household bills securely
              </p>
            </div>

            {/* Error Banner */}
            {authError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                <span>{authError}</span>
              </div>
            )}

            {/* REAL GOOGLE OAUTH SIGN IN BUTTON */}
            <div>
              <GoogleSignInButton
                onAuthSuccess={handleGoogleProfileSuccess}
                onError={err => setAuthError(err)}
                setIsAuthenticating={setIsAuthenticating}
                isAuthenticating={isAuthenticating}
              />
            </div>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-slate-800"></div>
              <span className="text-[10px] font-semibold tracking-wider text-slate-500 uppercase">
                or use email
              </span>
              <div className="flex-1 h-px bg-slate-800"></div>
            </div>

            {/* Tab Switcher: Sign In vs Sign Up */}
            <div className="grid grid-cols-2 p-1 bg-[#080d19] rounded-xl border border-slate-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setAuthError('');
                }}
                className={`py-1.5 rounded-lg transition-all ${
                  authMode === 'signin'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signup');
                  setAuthError('');
                }}
                className={`py-1.5 rounded-lg transition-all ${
                  authMode === 'signup'
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Email Form */}
            <form onSubmit={handleAuthSubmit} className="flex flex-col gap-3.5 text-xs">
              {authMode === 'signup' && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    className="w-full bg-[#080d19] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@email.com"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  className="w-full bg-[#080d19] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder={authMode === 'signup' ? 'At least 6 characters' : 'Enter your password'}
                    value={passwordInput}
                    onChange={e => setPasswordInput(e.target.value)}
                    className="w-full bg-[#080d19] border border-slate-700/80 rounded-xl px-3.5 pr-10 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {authMode === 'signup' && (
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Confirm Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Repeat your password"
                    value={confirmPasswordInput}
                    onChange={e => setConfirmPasswordInput(e.target.value)}
                    className="w-full bg-[#080d19] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full mt-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-semibold text-xs tracking-wide transition-all flex items-center justify-center gap-2"
              >
                <span>
                  {isAuthenticating
                    ? 'Processing...'
                    : authMode === 'signup'
                    ? 'Create Account'
                    : 'Sign In with Email'}
                </span>
              </button>
            </form>
          </div>
        </div>

        <footer className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
          © 2026 Klarity. All personal financial data is encrypted and private.
        </footer>
      </div>
    );
  }

  // =========================================================================
  // 2. MAIN APP: REAL CARDS, REAL BILLS, REAL DATA ONLY
  // =========================================================================
  const accountsList = data?.accounts || [];
  const billsList = data?.bills || [];
  const transactionsList = data?.transactions || [];

  const checkingAccounts = accountsList.filter(a => a.type === 'depository');
  const creditCards = accountsList.filter(a => a.type === 'credit');
  const highestAprCard = (creditCards || [])
    .filter(a => Number(a.balance) > 0)
    .sort((a, b) => Number(b.apr || 0) - Number(a.apr || 0))[0];

  const filteredTransactions = transactionsList.filter(t => {
    const matchCategory = categoryFilter === 'all' ? true : t.category === categoryFilter;
    const matchSearch = txSearch ? t.name.toLowerCase().includes(txSearch.toLowerCase()) : true;
    return matchCategory && matchSearch;
  });

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans">
      {linkToken && <PlaidLauncher token={linkToken} />}

      {/* Notification Toast */}
      {notificationToast && (
        <div className="fixed top-5 right-5 z-50 bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notificationToast}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-[#0c1427]/95 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="h-16 flex items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center">
              <span className="text-xl font-black tracking-wider text-white">KLARITY</span>
            </div>

            {/* Top Right Controls */}
            <div className="flex items-center gap-2.5">
              <button
                onClick={initiatePlaidLink}
                disabled={isConnectingPlaid}
                className="hidden sm:inline-flex px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                Connect Bank (Plaid)
              </button>

              <button
                onClick={() => setIsAddAccountOpen(true)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 cursor-pointer"
              >
                Add Card
              </button>

              {/* Account Profile Button with Dropdown Menu */}
              <div className="relative pl-2 border-l border-slate-800" ref={userMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 rounded-full px-3 py-1.5 transition-all cursor-pointer focus:outline-none"
                  aria-expanded={isUserMenuOpen}
                >
                  {currentUser.avatar?.startsWith('http') ? (
                    <img src={currentUser.avatar} alt="Avatar" className="w-5 h-5 rounded-full" />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-blue-600/30 text-blue-400 flex items-center justify-center font-bold text-xs">
                      {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <span className="text-xs font-semibold text-slate-200 hidden md:inline">
                    {currentUser.name}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-60 rounded-2xl bg-[#0c1427] border border-slate-800 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2">
                    {/* Header with user info */}
                    <div className="px-4 py-2.5 border-b border-slate-800/80">
                      <p className="text-xs font-bold text-white truncate">{currentUser.name}</p>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{currentUser.email || 'Verified Account'}</p>
                    </div>

                    <div className="py-1">
                      {/* Profile option */}
                      <button
                        onClick={() => {
                          setActiveTab('settings');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <User className="w-4 h-4 text-blue-400 shrink-0" />
                        <div>
                          <div className="font-semibold">Profile</div>
                          <div className="text-[10px] text-slate-400">Account details & authentication</div>
                        </div>
                      </button>

                      {/* Cards option */}
                      <button
                        onClick={() => {
                          setActiveTab('cards');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <CreditCard className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div>
                          <div className="font-semibold">Cards</div>
                          <div className="text-[10px] text-slate-400">Manage connected & manual cards</div>
                        </div>
                      </button>

                      {/* Settings option */}
                      <button
                        onClick={() => {
                          setActiveTab('settings');
                          setIsUserMenuOpen(false);
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <Settings className="w-4 h-4 text-indigo-400 shrink-0" />
                        <div>
                          <div className="font-semibold">Settings</div>
                          <div className="text-[10px] text-slate-400">AI provider, API keys & Plaid</div>
                        </div>
                      </button>
                    </div>

                    <div className="border-t border-slate-800/80 pt-1 mt-1">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          handleLogout();
                        }}
                        className="w-full px-4 py-2 text-left text-xs text-rose-400 hover:bg-rose-500/10 flex items-center gap-2.5 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4 text-rose-400 shrink-0" />
                        <span className="font-semibold">Sign Out</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex space-x-6 overflow-x-auto border-t border-slate-800/60 pt-2 text-xs font-semibold">
            {[
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'cards', label: `My Cards (${creditCards.length})` },
              { id: 'bills', label: `Household Bills (${billsList.length})` },
              { id: 'transactions', label: `Transactions (${transactionsList.length})` },
              { id: 'advisor', label: 'AI Advisor', badge: 'Live' }
            ].map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`pb-3 px-1 transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'border-b-2 border-blue-500 text-blue-400 font-bold'
                      : 'border-b-2 border-transparent text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.badge && (
                    <span className="ml-1.5 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wider bg-blue-600 text-white font-bold">
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
        {plaidError && (
          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
              <span>{plaidError}</span>
            </div>
            <button
              onClick={() => setActiveTab('settings')}
              className="px-3 py-1 rounded-lg bg-amber-500/20 text-amber-200 hover:bg-amber-500/30 font-semibold cursor-pointer"
            >
              Open Settings
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 1: DASHBOARD */}
        {/* ========================================================================= */}
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-6">
            {/* Top Stat Banners */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#0d1527] border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                  <span>Available Cash (Checking)</span>
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-white">
                    ${(data?.metrics?.totalChecking || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Ready for upcoming bills</span>
                  </p>
                </div>
              </div>

              <div className="bg-[#0d1527] border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                  <span>Credit Card Balances</span>
                  <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400">
                    <CreditCard className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-white">
                    ${(data?.metrics?.totalCreditDebt || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Across connected credit cards</p>
                </div>
              </div>

              <div className="bg-[#0d1527] border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 text-xs font-semibold">
                  <span>Monthly Bills & Utilities</span>
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                    <Zap className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-white">
                    ${(data?.metrics?.totalMonthlyBills || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    <span className="text-xs font-normal text-slate-400">/mo</span>
                  </div>
                  <p className="text-xs text-amber-400 mt-1">PG&E, Fresno Water, Xfinity, T-Mobile</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-950/90 to-slate-900 border border-indigo-800/40 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-indigo-300 text-xs font-semibold">
                  <span>AI Payoff Priority</span>
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
                      <span className="text-xs text-slate-300">Bal: ${Number(highestAprCard.balance).toFixed(2)}</span>
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab('advisor');
                        handleSendChatMessage('What should I pay off first and how much?');
                      }}
                      className="mt-3 text-xs text-indigo-300 hover:text-white font-medium flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>Ask AI Advisor how to pay</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="mt-2">
                    <p className="text-xs text-emerald-400 font-medium">Zero high-interest debt outstanding!</p>
                    <p className="text-[11px] text-slate-400 mt-1">Your accounts are in great financial health.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="flex flex-wrap gap-2 p-4 bg-[#0d1527] border border-slate-800 rounded-2xl items-center justify-between">
              <span className="text-xs font-bold text-slate-300">Quick Actions:</span>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={initiatePlaidLink}
                  className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white shadow-md shadow-emerald-600/20 cursor-pointer transition-colors"
                >
                  Connect Bank
                </button>
                <button
                  onClick={() => setIsAddAccountOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 cursor-pointer transition-colors"
                >
                  Add Card
                </button>
                <button
                  onClick={() => setIsAddBillOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 cursor-pointer transition-colors"
                >
                  Add Utility Bill
                </button>
                <button
                  onClick={() => setIsScanBillOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 cursor-pointer transition-colors"
                >
                  Scan Statement
                </button>
                <button
                  onClick={() => setActiveTab('settings')}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 cursor-pointer transition-colors"
                >
                  Manage Settings
                </button>
              </div>
            </div>

            {/* Split Grid: Upcoming Bills & AI Advisor Quick Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Upcoming Bills List */}
              <div className="lg:col-span-2 bg-[#0d1527] border border-slate-800 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" />
                      <span>Upcoming Household Bills & Utilities</span>
                    </h2>
                    <p className="text-xs text-slate-400">Includes Fresno Water, PG&E, Telecom & Subscriptions</p>
                  </div>
                  <button
                    onClick={() => setIsAddBillOpen(true)}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Bill</span>
                  </button>
                </div>

                {billsList.length === 0 ? (
                  <div className="py-8 text-center text-xs text-slate-500">
                    No bills added yet. Scan a statement or add your monthly utility bills above.
                  </div>
                ) : (
                  <div className="divide-y divide-slate-800/80">
                    {billsList.slice(0, 5).map(bill => {
                      const isDueSoon = bill.status === 'due_soon';
                      return (
                        <div key={bill.id} className="py-3.5 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                                bill.category === 'Utilities'
                                  ? 'bg-amber-500/10 text-amber-400'
                                  : bill.category === 'Gaming'
                                  ? 'bg-pink-500/10 text-pink-400'
                                  : 'bg-purple-500/10 text-purple-400'
                              }`}
                            >
                              {bill.category === 'Gaming' ? (
                                <Gamepad2 className="w-4 h-4" />
                              ) : bill.category === 'Subscriptions' ? (
                                <Tv className="w-4 h-4" />
                              ) : (
                                <Zap className="w-4 h-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-white truncate">{bill.name}</p>
                              <p className="text-xs text-slate-400 flex items-center gap-2">
                                <span>Due {bill.nextDueDate || bill.dueDate || `Day ${bill.dueDay}`}</span>
                                <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-300">
                                  {bill.category}
                                </span>
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            <div className="text-right">
                              <div className="text-sm font-bold text-white">${Number(bill.expectedAmount).toFixed(2)}</div>
                              <span
                                className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                                  bill.status === 'paid'
                                    ? 'bg-emerald-500/20 text-emerald-400'
                                    : isDueSoon
                                    ? 'bg-red-500/20 text-red-300 animate-pulse'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                {bill.status === 'paid' ? 'Paid' : isDueSoon ? 'Due Soon' : 'Upcoming'}
                              </span>
                            </div>
                            {bill.status !== 'paid' && (
                              <button
                                onClick={() => handlePayBill(bill.id, bill.name, bill.expectedAmount)}
                                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 transition-colors cursor-pointer"
                                title="Mark as paid"
                              >
                                Mark Paid
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* AI Advisor Preview Card */}
              <div className="bg-[#0d1527] border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Klarity AI Advisor</h3>
                      <p className="text-xs text-slate-400">Real-time household analysis</p>
                    </div>
                  </div>

                  <div className="bg-[#070b14] border border-slate-800/80 rounded-xl p-3 text-xs text-slate-300 leading-relaxed mb-4">
                    {highestAprCard ? (
                      <span>
                        I noticed your upcoming bills and connected credit debt. You can save money on interest by directing extra funds to <strong>{highestAprCard.institution} {highestAprCard.name}</strong> with <strong>{highestAprCard.apr}% APR</strong>.
                      </span>
                    ) : (
                      <span>
                        "I monitor your utility bills and credit cards to provide recommendations on cash flow, debt snowballing, and savings."
                      </span>
                    )}
                  </div>

                  <p className="text-xs font-semibold text-slate-400 mb-2">Quick Inquiries:</p>
                  <div className="flex flex-col gap-1.5">
                    {[
                      'What should I pay off first?',
                      'Show bills due in the next 14 days',
                      'How can I reduce expenses?'
                    ].map((q, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setActiveTab('advisor');
                          handleSendChatMessage(q);
                        }}
                        className="text-left text-xs px-3 py-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 text-slate-200 border border-slate-700/60 transition-colors flex items-center justify-between cursor-pointer"
                      >
                        <span>{q}</span>
                        <ChevronRight className="w-3 h-3 text-slate-500 shrink-0" />
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab('advisor')}
                  className="mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-xs shadow-md shadow-blue-600/20 hover:opacity-95 transition-opacity cursor-pointer text-center"
                >
                  Open Full AI Advisor Chat
                </button>
              </div>
            </div>

            {/* Recent Purchases Feed */}
            <div className="bg-[#0d1527] border border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-400" />
                    <span>Recent Purchases & Auto-Categories</span>
                  </h2>
                  <p className="text-xs text-slate-400">Automatically categorized as Subscriptions, Gaming, Utilities, etc.</p>
                </div>
                <button
                  onClick={() => setActiveTab('transactions')}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
                >
                  View All ({transactionsList.length})
                </button>
              </div>

              {transactionsList.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-500">
                  No transactions recorded yet. Connect a bank or record purchases to view them here.
                </div>
              ) : (
                <div className="divide-y divide-slate-800/80">
                  {transactionsList.slice(0, 6).map(tx => (
                    <div key={tx.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-slate-400">
                          <Receipt className="w-4 h-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{tx.name}</p>
                          <p className="text-xs text-slate-400 flex items-center gap-2">
                            <span>{tx.date}</span>
                            <span>•</span>
                            <span>{tx.account || 'Account'}</span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-bold text-white">
                          ${Number(tx.amount).toFixed(2)}
                        </div>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {tx.category}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: CREDIT CARDS (Realistic Card UI) */}
        {/* ========================================================================= */}
        {activeTab === 'cards' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Credit Cards</h2>
                <p className="text-xs text-slate-400">Monitor APR interest rates, balances, and credit limits</p>
              </div>
              <button
                onClick={() => setIsAddAccountOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-md shadow-blue-600/20 cursor-pointer"
              >
                Add Card
              </button>
            </div>

            {creditCards.length === 0 ? (
              <div className="p-12 text-center bg-[#0d1527] border border-dashed border-slate-800 rounded-2xl flex flex-col items-center gap-3">
                <CreditCard className="w-8 h-8 text-slate-500" />
                <h3 className="text-sm font-bold text-white">No Credit Cards Added</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Add your Capital One, Citi, Discover, or Chase cards to monitor your interest APR and get payoff guidance.
                </p>
                <button
                  onClick={() => setIsAddAccountOpen(true)}
                  className="mt-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white"
                >
                  Add Card
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
                      {/* Card Look */}
                      <div className="p-5 bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-900 border-b border-slate-800">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-black tracking-wider text-white uppercase">{card.institution}</span>
                          {card.apr > 0 && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                              {card.apr}% APR
                            </span>
                          )}
                        </div>

                        <div className="my-6 flex items-center justify-between">
                          <div className="w-8 h-6 rounded bg-amber-400/80 border border-amber-300 flex items-center justify-center">
                            <div className="w-6 h-4 border border-amber-600/50 rounded-sm"></div>
                          </div>
                          <span className="text-xs font-mono tracking-widest text-slate-300">•••• {card.mask}</span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <div>
                            <span className="text-[10px] uppercase text-slate-400 block">Card</span>
                            <span className="font-semibold text-white">{card.name}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-[10px] uppercase text-slate-400 block">Balance</span>
                            <span className="text-sm font-black text-rose-400">${Number(card.balance).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Details */}
                      <div className="p-5 flex flex-col gap-4 text-xs">
                        {card.limit > 0 && (
                          <div>
                            <div className="flex items-center justify-between text-slate-400 mb-1">
                              <span>Limit: ${Number(card.limit).toLocaleString()}</span>
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
                        )}

                        <div className="grid grid-cols-2 gap-2 p-3 rounded-xl bg-[#090f1e] border border-slate-800 text-[11px]">
                          <div>
                            <span className="text-slate-500 block">Min Payment</span>
                            <span className="font-bold text-white">${Number(card.minPayment || 0).toFixed(2)}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-slate-500 block">Next Due</span>
                            <span className="font-bold text-amber-400">{card.dueDate || 'Not set'}</span>
                          </div>
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
        {/* TAB 3: HOUSEHOLD BILLS */}
        {/* ========================================================================= */}
        {activeTab === 'bills' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white">Household Bills & Utilities</h2>
                <p className="text-xs text-slate-400">Track and log payments for PG&E, Water, Internet, and subscriptions</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setIsScanBillOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 cursor-pointer"
                >
                  Scan Statement
                </button>
                <button
                  onClick={() => setIsAddBillOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white shadow-md shadow-blue-600/20 cursor-pointer"
                >
                  Add Bill
                </button>
              </div>
            </div>

            {billsList.length === 0 ? (
              <div className="p-12 text-center bg-[#0d1527] border border-dashed border-slate-800 rounded-2xl flex flex-col items-center gap-3">
                <Zap className="w-8 h-8 text-slate-500" />
                <h3 className="text-sm font-bold text-white">No Bills Added Yet</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  Add your household utility bills (PG&E, Fresno Water, Xfinity) to track due dates and pay on time.
                </p>
                <button
                  onClick={() => setIsAddBillOpen(true)}
                  className="mt-2 px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white"
                >
                  Add Bill
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
                      <div className="text-xs text-slate-400 mt-1">{bill.category}</div>
                    </div>

                    <div className="p-3 rounded-xl bg-[#080d19] border border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-slate-500 block">Due Date</span>
                        <span className="text-xs font-bold text-slate-200">{bill.nextDueDate || `Day ${bill.dueDay}`}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block">Amount</span>
                        <span className="text-base font-black text-white">${Number(bill.expectedAmount).toFixed(2)}</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handlePayBill(bill.id, bill.name, bill.expectedAmount)}
                      disabled={bill.status === 'paid'}
                      className={`w-full py-2 rounded-xl text-xs font-semibold transition-all ${
                        bill.status === 'paid'
                          ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                      }`}
                    >
                      {bill.status === 'paid' ? '✓ Paid' : `Mark $${Number(bill.expectedAmount).toFixed(2)} Paid`}
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: TRANSACTIONS */}
        {/* ========================================================================= */}
        {activeTab === 'transactions' && (
          <div className="bg-[#0d1527] border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white">Transactions</h2>
                <p className="text-xs text-slate-400">Real transaction history from linked bank accounts</p>
              </div>

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
                No transactions recorded yet. Transactions will appear once you link a bank account via Plaid.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[11px] font-semibold uppercase tracking-wider">
                      <th className="py-3 px-2">Date</th>
                      <th className="py-3 px-2">Description</th>
                      <th className="py-3 px-2">Category</th>
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
        {/* TAB 5: AI ADVISOR */}
        {/* ========================================================================= */}
        {activeTab === 'advisor' && (
          <div className="bg-[#0d1527] border border-slate-800 rounded-2xl p-5 flex flex-col h-[650px] shadow-xl">
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white">Klarity AI Financial Advisor</h3>
                <p className="text-[11px] text-slate-400">Analyzes your actual connected cards, APRs & bills</p>
              </div>
            </div>

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
                    <span>Analyzing your finances...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendChatMessage} className="pt-2 flex gap-2">
              <input
                type="text"
                placeholder="Ask Klarity about your finances or debt payoff..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                className="flex-1 bg-[#080d19] border border-slate-700 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={isAiTyping || !chatInput.trim()}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-xs transition-all shadow-md shadow-blue-600/20 cursor-pointer"
              >
                Send
              </button>
            </form>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: SETTINGS */}
        {/* ========================================================================= */}
        {activeTab === 'settings' && (
          <div className="flex flex-col gap-6 max-w-4xl mx-auto w-full">
            <div>
              <h2 className="text-xl font-bold text-white">Settings</h2>
              <p className="text-xs text-slate-400 mt-1">Manage bank connections, linked credit cards, profile, and security</p>
            </div>

            {/* 1. AI Advisor Engine & Custom API Keys (BYOK) */}
            <div className="bg-[#0d1527] border border-slate-800 rounded-2xl p-6 flex flex-col gap-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Bot className="w-4 h-4 text-blue-400" />
                    <span>AI Engine & API Keys</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Choose which AI powers Klarity (Gemini, ChatGPT, DeepSeek, or Custom) and optionally provide your own API key.
                  </p>
                </div>
                <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/30">
                  {aiConfig.provider === 'gemini' ? 'Google Gemini' : aiConfig.provider === 'openai' ? 'OpenAI ChatGPT' : aiConfig.provider === 'deepseek' ? 'DeepSeek' : 'Custom Model'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">AI Provider</label>
                  <select
                    value={aiConfig.provider}
                    onChange={e => setAiConfig(prev => ({ ...prev, provider: e.target.value }))}
                    className="w-full bg-[#080d19] border border-slate-700/80 rounded-xl px-3.5 py-2.5 text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                  >
                    <option value="gemini">Google Gemini (Default)</option>
                    <option value="openai">OpenAI (ChatGPT: GPT-4o, GPT-4o-mini)</option>
                    <option value="deepseek">DeepSeek (deepseek-chat, deepseek-reasoner)</option>
                    <option value="custom">Custom (OpenRouter, Groq, Ollama, etc.)</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-300 block mb-1">
                    Model Name <span className="text-slate-500 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder={
                      aiConfig.provider === 'gemini' ? 'gemini-2.5-flash' :
                      aiConfig.provider === 'openai' ? 'gpt-4o-mini' :
                      aiConfig.provider === 'deepseek' ? 'deepseek-chat' :
                      'custom-model-id'
                    }
                    value={aiConfig.modelName}
                    onChange={e => setAiConfig(prev => ({ ...prev, modelName: e.target.value }))}
                    className="w-full bg-[#080d19] border border-slate-700/80 rounded-xl px-3.5 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="font-semibold text-slate-300">
                      Custom API Key <span className="text-slate-500 font-normal">(Optional — leave blank to use Klarity's default server AI)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAiApiKey(!showAiApiKey)}
                      className="text-[11px] text-blue-400 hover:text-blue-300 cursor-pointer"
                    >
                      {showAiApiKey ? 'Hide' : 'Show'}
                    </button>
                  </div>
                  <input
                    type={showAiApiKey ? 'text' : 'password'}
                    placeholder={
                      aiConfig.provider === 'gemini' ? 'AIzaSy...' :
                      aiConfig.provider === 'openai' ? 'sk-...' :
                      aiConfig.provider === 'deepseek' ? 'sk-...' :
                      'Your custom API key'
                    }
                    value={aiConfig.apiKey}
                    onChange={e => setAiConfig(prev => ({ ...prev, apiKey: e.target.value }))}
                    className="w-full bg-[#080d19] border border-slate-700/80 rounded-xl px-3.5 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono"
                  />
                </div>

                {aiConfig.provider === 'custom' && (
                  <div className="sm:col-span-2">
                    <label className="font-semibold text-slate-300 block mb-1">Custom API Base URL</label>
                    <input
                      type="text"
                      placeholder="https://api.groq.com/openai/v1 or https://openrouter.ai/api/v1"
                      value={aiConfig.customBaseUrl}
                      onChange={e => setAiConfig(prev => ({ ...prev, customBaseUrl: e.target.value }))}
                      className="w-full bg-[#080d19] border border-slate-700/80 rounded-xl px-3.5 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>
                )}

                <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <p className="text-[11px] text-slate-400">
                    Your key is saved locally in your browser and used only for your own AI advisor inquiries.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      localStorage.setItem('klarity_ai_config', JSON.stringify(aiConfig));
                      setNotificationToast('AI Engine settings updated successfully!');
                      setTimeout(() => setNotificationToast(''), 4000);
                    }}
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/20 cursor-pointer transition-colors"
                  >
                    Save AI Settings
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Plaid Banking Integration */}
            <div className="bg-[#0d1527] border border-slate-800 rounded-2xl p-6 flex flex-col gap-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Plaid Banking Integration</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Secure bank account linking via Plaid API</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                    settings.hasPlaidKeys
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}>
                    {settings.hasPlaidKeys ? `Active (${settings.plaidEnv || 'sandbox'})` : 'API Keys Needed'}
                  </span>
                  <button
                    onClick={initiatePlaidLink}
                    disabled={isConnectingPlaid}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    {isConnectingPlaid ? 'Opening Plaid...' : 'Launch Plaid Link'}
                  </button>
                </div>
              </div>

              <form onSubmit={handleSaveSettings} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Plaid Client ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 64a8b8c123..."
                    value={plaidClientIdInput}
                    onChange={e => setPlaidClientIdInput(e.target.value)}
                    className="w-full bg-[#080d19] border border-slate-700/80 rounded-xl px-3.5 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-300 block mb-1">Plaid Secret</label>
                  <input
                    type="password"
                    placeholder="••••••••••••••••••••"
                    value={plaidSecretInput}
                    onChange={e => setPlaidSecretInput(e.target.value)}
                    className="w-full bg-[#080d19] border border-slate-700/80 rounded-xl px-3.5 py-2 text-white placeholder-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-3">
                    <label className="font-semibold text-slate-300">Environment:</label>
                    <select
                      value={plaidEnvInput}
                      onChange={e => setPlaidEnvInput(e.target.value)}
                      className="bg-[#080d19] border border-slate-700/80 rounded-xl px-3 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="development">Development (Real Bank Accounts)</option>
                      <option value="sandbox">Sandbox (Testing / Demo)</option>
                      <option value="production">Production</option>
                    </select>
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md shadow-blue-600/20 cursor-pointer"
                  >
                    Save Plaid Keys
                  </button>
                </div>
              </form>
            </div>

            {/* 2. Manage Cards & Accounts */}
            <div className="bg-[#0d1527] border border-slate-800 rounded-2xl p-6 flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-white">Manage Cards & Accounts</h3>
                  <p className="text-xs text-slate-400 mt-0.5">View and manage all active cards ({accountsList.length} total)</p>
                </div>
                <button
                  onClick={() => setIsAddAccountOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 cursor-pointer"
                >
                  Add Card
                </button>
              </div>

              {accountsList.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">No cards or accounts added yet. Click 'Add Card' above to link one.</p>
              ) : (
                <div className="divide-y divide-slate-800/80">
                  {accountsList.map(acc => (
                    <div key={acc.id} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{acc.name}</span>
                          <span className="text-slate-400">({acc.institution})</span>
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-800 text-slate-300 font-mono">•••• {acc.mask}</span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Limit: ${Number(acc.limit || 0).toLocaleString()} | APR: {acc.apr || 0}% | Min: ${Number(acc.minPayment || 0).toFixed(2)}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <span className="text-[10px] text-slate-500 block uppercase">Balance</span>
                          <span className="font-bold text-rose-400 text-sm">${Number(acc.balance || 0).toFixed(2)}</span>
                        </div>
                        <button
                          onClick={() => handleDeleteAccount(acc.id, acc.name)}
                          className="px-3 py-1 rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 font-semibold text-xs border border-rose-500/20 cursor-pointer"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Account Profile */}
            <div className="bg-[#0d1527] border border-slate-800 rounded-2xl p-6 flex flex-col gap-4 text-xs">
              <h3 className="text-sm font-bold text-white border-b border-slate-800/80 pb-3">User Profile</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <span className="text-slate-400 block text-[11px]">Full Name</span>
                  <span className="text-white font-semibold text-sm">{currentUser.name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Email Address</span>
                  <span className="text-white font-semibold text-sm">{currentUser.email}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Authentication Status</span>
                  <span className="text-emerald-400 font-semibold">Google OAuth Verified</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Household Role</span>
                  <span className="text-white font-semibold">{currentUser.role || 'Primary Member'}</span>
                </div>
              </div>
            </div>

            {/* 4. Security & Sign Out */}
            <div className="bg-[#0d1527] border border-rose-950/40 rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-white">Sign Out</h3>
                <p className="text-xs text-slate-400 mt-0.5">Securely log out of this browser session</p>
              </div>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs transition-all shadow-md shadow-rose-600/20 cursor-pointer"
              >
                Sign Out of Klarity
              </button>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* MODALS */}
      {/* ========================================================================= */}

      {/* Add Card Modal */}
      {isAddAccountOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Add Credit Card</h3>
              <button onClick={() => setIsAddAccountOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleAddAccount} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-300">Bank / Issuer</label>
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
                  <option value="Other Bank">Other Bank</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-300">Card Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SavorOne, Double Cash, Freedom"
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
                    placeholder="0.00"
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
                    placeholder="e.g. 5000"
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
                    placeholder="e.g. 24.99"
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

      {/* Add Bill Modal */}
      {isAddBillOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Add Utility / Bill</h3>
              <button onClick={() => setIsAddBillOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleAddBill} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-300">Bill Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pacific Gas and Electric, Fresno Water"
                  value={newBill.name}
                  onChange={e => setNewBill(prev => ({ ...prev, name: e.target.value, biller: e.target.value }))}
                  className="mt-1 w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-300">Amount Due ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 248.50"
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

      {/* Scan Statement Modal */}
      {isScanBillOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Scan Statement</h3>
              <button onClick={() => setIsScanBillOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>
            <p className="text-xs text-slate-400">
              Paste the text from your e-bill PDF or statement below. Klarity will automatically extract the utility company, amount, and due date.
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
              <button type="button" onClick={() => setIsScanBillOpen(false)} className="px-3 py-1.5 text-xs text-slate-400 cursor-pointer">Close</button>
              <button
                type="button"
                onClick={handleScanBill}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold cursor-pointer"
              >
                Parse & Register Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
