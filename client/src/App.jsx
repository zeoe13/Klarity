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
  ChevronDown,
  Paperclip,
  UploadCloud,
  Brain,
  X,
  History,
  ArrowLeft
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
  const [billSearch, setBillSearch] = useState('');
  const [billFilter, setBillFilter] = useState('all');

  // AI Chat & Multi-thread Past Chats state (like Gemini chats)
  const [chatSessions, setChatSessions] = useState(() => {
    try {
      const saved = localStorage.getItem('klarity_chat_sessions');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {}
    return [
      {
        id: 'session-default',
        title: 'Financial Overview',
        createdAt: Date.now(),
        messages: [
          {
            role: 'assistant',
            text: "Hello! I am Klarity, your personal financial advisor. I monitor your actual connected cards, real APRs, and utility bills to help you optimize cash flow and pay off debt. How can I help you today?"
          }
        ]
      }
    ];
  });

  const [activeSessionId, setActiveSessionId] = useState(() => {
    try {
      const savedId = localStorage.getItem('klarity_active_session_id');
      if (savedId) return savedId;
    } catch (e) {}
    return 'session-default';
  });

  const [isPastChatsOpen, setIsPastChatsOpen] = useState(false);

  // Active chat messages
  const [chatMessages, setChatMessages] = useState(() => {
    const active = chatSessions.find(s => s.id === activeSessionId) || chatSessions[0];
    return active?.messages || [
      {
        role: 'assistant',
        text: "Hello! I am Klarity, your personal financial advisor. I monitor your actual connected cards, real APRs, and utility bills to help you optimize cash flow and pay off debt. How can I help you today?"
      }
    ];
  });
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

  // AI Memory (e.g. custom financial rules, goals, lifestyle constraints)
  const [aiMemory, setAiMemory] = useState(() => {
    try {
      const saved = localStorage.getItem('klarity_ai_memory');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [newMemoryInput, setNewMemoryInput] = useState('');
  const [isMemoryModalOpen, setIsMemoryModalOpen] = useState(false);

  // Upload Menu & Document Scanner State
  const [isUploadMenuOpen, setIsUploadMenuOpen] = useState(false);
  const uploadMenuRef = useRef(null);
  const fileInputRef = useRef(null);

  // User Dropdown Menu state & click-outside handling
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setIsUserMenuOpen(false);
      }
      if (uploadMenuRef.current && !uploadMenuRef.current.contains(e.target)) {
        setIsUploadMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update messages in active chat session and persist to localStorage
  const updateActiveSession = (newMessages, overrideTitle) => {
    setChatMessages(newMessages);
    setChatSessions(prev => {
      const updated = prev.map(s => {
        if (s.id === activeSessionId) {
          const autoTitle = overrideTitle || (
            (s.title === 'New Conversation' || s.title === 'Financial Overview')
              ? (newMessages.find(m => m.role === 'user')?.text?.slice(0, 32) || s.title)
              : s.title
          );
          return {
            ...s,
            title: autoTitle,
            updatedAt: Date.now(),
            messages: newMessages
          };
        }
        return s;
      });
      try {
        localStorage.setItem('klarity_chat_sessions', JSON.stringify(updated));
      } catch (e) {}
      return updated;
    });
  };

  const handleSwitchSession = (sessionId) => {
    const session = chatSessions.find(s => s.id === sessionId);
    if (session) {
      setActiveSessionId(sessionId);
      setChatMessages(session.messages || []);
      try {
        localStorage.setItem('klarity_active_session_id', sessionId);
      } catch (e) {}
      setIsPastChatsOpen(false);
    }
  };

  const handleCreateNewChat = () => {
    const newId = `session-${Date.now()}`;
    const newSession = {
      id: newId,
      title: 'New Conversation',
      createdAt: Date.now(),
      messages: [
        {
          role: 'assistant',
          text: "Hello! I am Klarity, your personal financial advisor. What financial questions or bills would you like to explore?"
        }
      ]
    };
    const updated = [newSession, ...chatSessions];
    setChatSessions(updated);
    setActiveSessionId(newId);
    setChatMessages(newSession.messages);
    try {
      localStorage.setItem('klarity_chat_sessions', JSON.stringify(updated));
      localStorage.setItem('klarity_active_session_id', newId);
    } catch (e) {}
    setIsPastChatsOpen(false);
  };

  const handleDeleteSession = (sessionId, e) => {
    if (e) e.stopPropagation();
    const updated = chatSessions.filter(s => s.id !== sessionId);
    if (updated.length === 0) {
      handleCreateNewChat();
      return;
    }
    setChatSessions(updated);
    try {
      localStorage.setItem('klarity_chat_sessions', JSON.stringify(updated));
    } catch (e) {}
    if (activeSessionId === sessionId) {
      handleSwitchSession(updated[0].id);
    }
  };

  // Save AI Memory helper
  const handleAddMemory = (fact) => {
    const item = (fact || newMemoryInput).trim();
    if (!item) return;
    if (aiMemory.includes(item)) return;
    const updated = [...aiMemory, item];
    setAiMemory(updated);
    localStorage.setItem('klarity_ai_memory', JSON.stringify(updated));
    setNewMemoryInput('');
    setNotificationToast('Saved to AI Memory!');
    setTimeout(() => setNotificationToast(''), 3000);
  };

  const handleRemoveMemory = (index) => {
    const updated = aiMemory.filter((_, i) => i !== index);
    setAiMemory(updated);
    localStorage.setItem('klarity_ai_memory', JSON.stringify(updated));
    setNotificationToast('Removed from AI Memory');
    setTimeout(() => setNotificationToast(''), 3000);
  };

  // Document / PDF Upload Handler - Scans document and adds to both Bills and Purchases
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsAiTyping(true);
    setNotificationToast(`Scanning document: ${file.name}...`);

    try {
      let contentToScan = `[Uploaded Document: ${file.name}]`;
      if (file.type.includes('text') || file.name.endsWith('.txt') || file.name.endsWith('.csv')) {
        contentToScan = await file.text();
      } else {
        // PDF or image
        contentToScan = `Statement Document: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
      }

      const res = await fetch('/api/bills/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ billText: contentToScan, ownerId: currentUser?.id })
      });

      if (res.ok) {
        const json = await res.json();
        await fetchData();
        setNotificationToast(`Scanned ${file.name}! Added to Bills & Purchases.`);
        setTimeout(() => setNotificationToast(''), 4500);

        const newMsgs = [
          ...chatMessages,
          { role: 'user', text: `Uploaded statement: ${file.name}` },
          {
            role: 'assistant',
            text: `I've analyzed your uploaded document (${file.name}). I detected a bill for **${json.summary?.biller || 'Utility Provider'}** of **$${Number(json.summary?.amount || 0).toFixed(2)}** due on **${json.summary?.nextDueDate || '2026-11-20'}**. I've automatically registered it into both your **Upcoming Bills** and **Recent Purchases**.`
          }
        ];
        updateActiveSession(newMsgs);
      } else {
        setNotificationToast('Could not automatically scan document. You can paste details into Scan Statement.');
      }
    } catch (err) {
      console.error('Scan error:', err);
      setNotificationToast('Failed to process document.');
    } finally {
      setIsAiTyping(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

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
    const userUpdatedMessages = [...chatMessages, { role: 'user', text: userMsg }];
    updateActiveSession(userUpdatedMessages);
    setIsAiTyping(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          userId: currentUser?.id,
          aiProvider: aiConfig.provider,
          apiKey: aiConfig.apiKey,
          modelName: aiConfig.modelName,
          customBaseUrl: aiConfig.customBaseUrl,
          userMemory: aiMemory
        })
      });
      const json = await res.json();
      const finalMessages = [...userUpdatedMessages, { role: 'assistant', text: json.reply }];
      updateActiveSession(finalMessages);
    } catch (err) {
      const finalMessages = [
        ...userUpdatedMessages,
        {
          role: 'assistant',
          text: `I've analyzed your real connected data. You currently have checking balance of $${data?.metrics?.totalChecking?.toFixed(2) || '0.00'} and credit card balances of $${data?.metrics?.totalCreditDebt?.toFixed(2) || '0.00'}. Keep extra payments targeted at your highest APR cards.`
        }
      ];
      updateActiveSession(finalMessages);
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

  const isHalalFinance = aiMemory.some(m => {
    const s = m.toLowerCase();
    return s.includes('muslim') || s.includes('halal') || s.includes('islam') || s.includes('riba');
  });

  const filteredTransactions = transactionsList.filter(t => {
    const matchCategory = categoryFilter === 'all' ? true : t.category === categoryFilter;
    const matchSearch = txSearch ? t.name.toLowerCase().includes(txSearch.toLowerCase()) : true;
    return matchCategory && matchSearch;
  });

  const filteredBills = billsList.filter(b => {
    const query = billSearch.toLowerCase().trim();
    const matchSearch = query
      ? (b.name?.toLowerCase().includes(query) || (b.biller || '').toLowerCase().includes(query))
      : true;
    let matchFilter = true;
    if (billFilter === 'due_soon') {
      matchFilter = b.status === 'due_soon';
    } else if (billFilter === 'paid') {
      matchFilter = b.status === 'paid';
    } else if (billFilter === 'upcoming') {
      matchFilter = b.status !== 'paid';
    } else if (billFilter !== 'all') {
      matchFilter = (b.category || '').toLowerCase() === billFilter.toLowerCase();
    }
    return matchSearch && matchFilter;
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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

          {/* Navigation Tabs - Only Dashboard & AI Advisor as requested */}
          <nav className="flex space-x-6 overflow-x-auto border-t border-slate-800/60 pt-2 text-xs font-semibold">
            {[
              { id: 'dashboard', label: 'Dashboard' },
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

      {/* Main Content Area - Clean, professional desktop-first container */}
      <main className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col gap-6">
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
                  <span>Bills</span>
                  <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400">
                    <Zap className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-black text-white">
                    ${(data?.metrics?.totalMonthlyBills || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    <span className="text-xs font-normal text-slate-400">/mo</span>
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Monthly total</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-950/90 to-slate-900 border border-indigo-800/40 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-indigo-300 text-xs font-semibold">
                  <span>{isHalalFinance ? 'Debt Elimination Priority' : 'AI Payoff Priority'}</span>
                  <Sparkles className="w-4 h-4 text-indigo-400" />
                </div>
                {highestAprCard ? (
                  <div className="mt-2">
                    <div className="text-sm font-bold text-white truncate">
                      {highestAprCard.institution} {highestAprCard.name}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      {!isHalalFinance ? (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/30">
                          {highestAprCard.apr}% APR
                        </span>
                      ) : (
                        <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          Halal Priority
                        </span>
                      )}
                      <span className="text-xs text-slate-300">Bal: ${Number(highestAprCard.balance).toFixed(2)}</span>
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab('advisor');
                        handleSendChatMessage(isHalalFinance ? 'How should I eliminate this debt in accordance with my Halal finance preferences?' : 'What should I pay off first and how much?');
                      }}
                      className="mt-3 text-xs text-indigo-300 hover:text-white font-medium flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <span>{isHalalFinance ? 'Ask AI how to eliminate debt' : 'Ask AI Advisor how to pay'}</span>
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

            {/* Main Balanced Grid: Left side for Bills, Purchases & Cards, Right side for AI Financial Advisor & Cash Flow */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Upcoming Bills, Recent Purchases & Cards (8 Cols) */}
              <div className="lg:col-span-8 flex flex-col gap-6">
                
                {/* Upcoming Bills Box (Clickable -> Dedicated Bills Page) */}
                <div
                  onClick={() => setActiveTab('bills')}
                  className="bg-[#0d1527] border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-sm transition-all cursor-pointer group flex flex-col justify-between min-h-[260px]"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                            Upcoming Bills
                          </h2>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                            {billsList.length} Total
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">Click to view all bills, filters & search</p>
                      </div>

                      <div className="flex items-center gap-2.5">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsScanBillOpen(true);
                          }}
                          className="text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 px-2.5 py-1 rounded-lg font-medium flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5 text-blue-400" />
                          <span>Scan</span>
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsAddBillOpen(true);
                          }}
                          className="text-xs text-white bg-blue-600 hover:bg-blue-500 px-2.5 py-1 rounded-lg font-semibold flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Bill</span>
                        </button>
                        <span className="text-xs text-blue-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 font-semibold">
                          <span>View All</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </div>

                    {billsList.length === 0 ? (
                      <div className="py-6 flex flex-col items-center justify-center text-center gap-3 bg-[#080d19] border border-slate-800/80 rounded-xl p-4">
                        <Zap className="w-7 h-7 text-amber-400/80" />
                        <div>
                          <p className="text-xs font-semibold text-white">No Monthly Bills Added Yet</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 max-w-md">
                            Upload a statement PDF or register your electricity, water, internet, or phone bills to track due dates and avoid late fees.
                          </p>
                        </div>
                        <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                          {[
                            { name: 'PG&E Electric & Gas', amount: 210, dueDay: 15, category: 'Utilities' },
                            { name: 'Fresno Water Service', amount: 85, dueDay: 20, category: 'Utilities' },
                            { name: 'Xfinity High-Speed Internet', amount: 70, dueDay: 5, category: 'Subscriptions' }
                          ].map((preset, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={async (e) => {
                                e.stopPropagation();
                                try {
                                  await fetch('/api/bills', {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({
                                      name: preset.name,
                                      expectedAmount: preset.amount,
                                      dueDay: preset.dueDay,
                                      category: preset.category,
                                      assignedOwnerId: currentUser?.id
                                    })
                                  });
                                  await fetchData();
                                  setNotificationToast(`Added ${preset.name}!`);
                                  setTimeout(() => setNotificationToast(''), 3000);
                                } catch (err) {
                                  console.error(err);
                                }
                              }}
                              className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] border border-slate-700/60 font-medium cursor-pointer transition-colors"
                            >
                              + {preset.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-800/80">
                        {billsList.slice(0, 5).map(bill => {
                          const isDueSoon = bill.status === 'due_soon';
                          return (
                            <div key={bill.id} className="py-3 flex items-center justify-between gap-4">
                              <div className="min-w-0">
                                <p className="text-sm font-semibold text-white truncate">{bill.name}</p>
                                <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                                  <span>Due {bill.nextDueDate || bill.dueDate || `Day ${bill.dueDay}`}</span>
                                  <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-300">
                                    {bill.category}
                                  </span>
                                </p>
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
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handlePayBill(bill.id, bill.name, bill.expectedAmount);
                                    }}
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
                </div>

                {/* Recent Purchases Box (Clickable -> Dedicated Purchases Page) */}
                <div
                  onClick={() => setActiveTab('transactions')}
                  className="bg-[#0d1527] border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-sm transition-all cursor-pointer group flex flex-col justify-between min-h-[260px]"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="text-base font-bold text-white group-hover:text-blue-400 transition-colors">
                            Recent Purchases
                          </h2>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                            {transactionsList.length} Total
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">Click to view complete purchase ledger & search</p>
                      </div>

                      <span className="text-xs text-blue-400 group-hover:translate-x-0.5 transition-transform flex items-center gap-0.5 font-semibold">
                        <span>View All Purchases</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    {transactionsList.length === 0 ? (
                      <div className="py-6 flex flex-col items-center justify-center text-center gap-3 bg-[#080d19] border border-slate-800/80 rounded-xl p-4">
                        <Receipt className="w-7 h-7 text-blue-400/80" />
                        <div>
                          <p className="text-xs font-semibold text-white">No Purchases Recorded Yet</p>
                          <p className="text-[11px] text-slate-400 mt-0.5 max-w-md">
                            Connect your bank account via Plaid or record manual transactions to track card charges and spending trends.
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              initiatePlaidLink();
                            }}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs text-white font-semibold cursor-pointer shadow-md shadow-emerald-600/20"
                          >
                            Connect Bank (Plaid)
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-800/80">
                        {transactionsList.slice(0, 5).map(tx => (
                          <div key={tx.id} className="py-3 flex items-center justify-between gap-4">
                            <div>
                              <p className="text-sm font-semibold text-white">{tx.name}</p>
                              <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                                <span>{tx.date}</span>
                                <span>•</span>
                                <span>{tx.account || 'Account'}</span>
                              </p>
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

                {/* Connected Cards & Balances Overview (Fills the page properly) */}
                <div className="bg-[#0d1527] border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-base font-bold text-white">Connected Cards & Credit Limits</h2>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-semibold">
                          {creditCards.length} Cards
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">Credit line utilization and APR interest metrics</p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAddAccountOpen(true)}
                      className="text-xs text-white bg-blue-600 hover:bg-blue-500 px-3 py-1.5 rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer shadow-md shadow-blue-600/20"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Card</span>
                    </button>
                  </div>

                  {creditCards.length === 0 ? (
                    <div className="p-5 rounded-xl bg-[#080d19] border border-slate-800 text-center flex flex-col items-center gap-2">
                      <CreditCard className="w-7 h-7 text-slate-500" />
                      <p className="text-xs font-semibold text-white">No Credit Cards Linked Yet</p>
                      <p className="text-[11px] text-slate-400 max-w-sm">
                        Add cards like Capital One, Discover, or Chase to track interest APRs, payoff priorities, and limits.
                      </p>
                      <button
                        type="button"
                        onClick={() => setIsAddAccountOpen(true)}
                        className="mt-1 px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold border border-slate-700 cursor-pointer"
                      >
                        + Add Manual Card
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {creditCards.map(card => {
                        const util = card.limit > 0 ? Math.min(100, (card.balance / card.limit) * 100) : 0;
                        return (
                          <div key={card.id} className="p-4 rounded-xl bg-[#080d19] border border-slate-800 flex flex-col justify-between gap-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs font-bold text-white">{card.institution} {card.name}</p>
                                <p className="text-[10px] text-slate-400 font-mono mt-0.5">•••• {card.mask}</p>
                              </div>
                              <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                                {card.apr || 0}% APR
                              </span>
                            </div>

                            <div>
                              <div className="flex items-center justify-between text-xs mb-1">
                                <span className="text-slate-400 text-[11px]">Balance: ${Number(card.balance).toFixed(2)}</span>
                                <span className="text-slate-400 text-[11px]">Limit: ${Number(card.limit).toLocaleString()}</span>
                              </div>
                              <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${util > 50 ? 'bg-rose-500' : 'bg-blue-500'}`}
                                  style={{ width: `${util}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: AI Financial Advisor Widget & Monthly Health Summary (4 Cols) */}
              <div className="lg:col-span-4 flex flex-col gap-6 sticky top-24">
                {/* AI Advisor Card with Interactive Quick Inquiries */}
                <div className="bg-[#0d1527] border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h3 className="text-sm font-bold text-white flex items-center gap-2">
                          <Bot className="w-4 h-4 text-blue-400" />
                          <span>AI Financial Advisor</span>
                        </h3>
                        <p className="text-xs text-slate-400">Personalized household analysis</p>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-600/20 text-blue-300 border border-blue-500/30">
                        Live
                      </span>
                    </div>

                    <div className="bg-[#070b14] border border-slate-800/80 rounded-xl p-3.5 text-xs text-slate-300 leading-relaxed mb-4">
                      {highestAprCard ? (
                        isHalalFinance ? (
                          <span>
                            I noticed your upcoming bills and active cards. In alignment with your Halal preferences, prioritize clearing <strong>{highestAprCard.institution} {highestAprCard.name}</strong> (Balance: ${Number(highestAprCard.balance).toFixed(2)}) completely to eliminate debt without conventional interest.
                          </span>
                        ) : (
                          <span>
                            I noticed your upcoming bills and connected credit debt. You can save money on interest by directing extra funds to <strong>{highestAprCard.institution} {highestAprCard.name}</strong> with <strong>{highestAprCard.apr}% APR</strong>.
                          </span>
                        )
                      ) : (
                        <span>
                          I monitor your bills and accounts to provide recommendations on cash flow, debt elimination, and savings.
                        </span>
                      )}
                    </div>

                    <p className="text-xs font-semibold text-slate-400 mb-2">Quick Inquiries:</p>
                    <div className="flex flex-col gap-1.5">
                      {[
                        isHalalFinance ? 'How should I eliminate debt without interest?' : 'What should I pay off first?',
                        'Show bills due in the next 14 days',
                        'How can I reduce expenses?'
                      ].map((q, i) => (
                        <button
                          key={i}
                          type="button"
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
                    type="button"
                    onClick={() => setActiveTab('advisor')}
                    className="mt-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-xs shadow-md shadow-blue-600/20 hover:opacity-95 transition-opacity cursor-pointer text-center"
                  >
                    Open Full AI Advisor Chat
                  </button>
                </div>

                {/* Monthly Financial Health Summary Card (Provides vertical balance) */}
                <div className="bg-[#0d1527] border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col gap-3 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                    <span className="font-bold text-white">Monthly Cash Flow Health</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                      Healthy
                    </span>
                  </div>

                  <div className="flex flex-col gap-2.5 pt-1">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Monthly Bills Obligation</span>
                      <span className="font-bold text-white">${(data?.metrics?.totalMonthlyBills || 0).toFixed(2)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Available Liquid Cash</span>
                      <span className="font-bold text-emerald-400">${(data?.metrics?.totalChecking || 0).toFixed(2)}</span>
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Total Credit Debt</span>
                      <span className="font-bold text-rose-400">${(data?.metrics?.totalCreditDebt || 0).toFixed(2)}</span>
                    </div>

                    <div className="border-t border-slate-800/80 pt-2.5 mt-1 flex items-center justify-between">
                      <span className="text-slate-300 font-semibold text-[11px]">Estimated Net Worth</span>
                      <span className="font-black text-sm text-white">
                        ${(data?.metrics?.netWorthEstimate || 0).toFixed(2)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 2: CREDIT CARDS (Accessible via Account Profile menu) */}
        {/* ========================================================================= */}
        {activeTab === 'cards' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 mb-2 font-semibold cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Dashboard</span>
                </button>
                <h2 className="text-xl font-bold text-white">Credit Cards</h2>
                <p className="text-xs text-slate-400 mt-0.5">Monitor APR interest rates, balances, and credit limits</p>
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
        {/* TAB 3: DEDICATED BILLS PAGE (Search box + Dropdown filter + Scan PDF) */}
        {/* ========================================================================= */}
        {activeTab === 'bills' && (
          <div className="flex flex-col gap-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0d1527] border border-slate-800 rounded-2xl p-5">
              <div>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 mb-2 font-semibold cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Dashboard</span>
                </button>
                <h2 className="text-xl font-bold text-white">Household Bills</h2>
                <p className="text-xs text-slate-400 mt-0.5">Filter, search, and settle utility bills and recurring expenses</p>
              </div>

              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => setIsScanBillOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white border border-slate-700 flex items-center gap-1.5 cursor-pointer transition-all"
                >
                  <FileText className="w-4 h-4 text-blue-400" />
                  <span>Scan Statement / PDF</span>
                </button>
                <button
                  onClick={() => setIsAddBillOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-xs font-semibold text-white flex items-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Bill</span>
                </button>
              </div>
            </div>

            {/* Search & Filter Toolbar */}
            <div className="bg-[#0d1527] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Search Box */}
              <div className="flex items-center gap-2 bg-[#080d19] border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search bills by name or biller..."
                  value={billSearch}
                  onChange={e => setBillSearch(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs text-white placeholder-slate-500 w-full"
                />
                {billSearch && (
                  <button onClick={() => setBillSearch('')} className="text-slate-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Dropdown Filter */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 font-semibold shrink-0">Filter:</span>
                <select
                  value={billFilter}
                  onChange={e => setBillFilter(e.target.value)}
                  className="bg-[#080d19] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">All Bills ({billsList.length})</option>
                  <option value="upcoming">Upcoming</option>
                  <option value="due_soon">Due Soon</option>
                  <option value="paid">Paid</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Subscriptions">Subscriptions</option>
                  <option value="Insurance">Insurance</option>
                  <option value="Housing">Housing / Rent</option>
                  <option value="Telecom">Telecom / Internet</option>
                </select>
              </div>
            </div>

            {/* Filtered Bills List */}
            {filteredBills.length === 0 ? (
              <div className="p-12 text-center bg-[#0d1527] border border-dashed border-slate-800 rounded-2xl flex flex-col items-center gap-3">
                <Zap className="w-8 h-8 text-slate-500" />
                <h3 className="text-sm font-bold text-white">No Bills Found</h3>
                <p className="text-xs text-slate-400 max-w-sm">
                  {billSearch || billFilter !== 'all' ? 'No bills matched your search or category filter.' : 'Add your utility bills or upload a statement PDF.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredBills.map(bill => (
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
                          : 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer'
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
        {/* TAB 4: DEDICATED PURCHASES PAGE (Search box + Category dropdown filter) */}
        {/* ========================================================================= */}
        {activeTab === 'transactions' && (
          <div className="flex flex-col gap-6">
            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#0d1527] border border-slate-800 rounded-2xl p-5">
              <div>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1.5 mb-2 font-semibold cursor-pointer transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Dashboard</span>
                </button>
                <h2 className="text-xl font-bold text-white">Recent Purchases</h2>
                <p className="text-xs text-slate-400 mt-0.5">Real-time ledger of card transactions, payments, and scanned receipts</p>
              </div>

              <div className="text-xs text-slate-400">
                Showing <span className="font-bold text-white">{filteredTransactions.length}</span> of {transactionsList.length} purchases
              </div>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-[#0d1527] border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              {/* Search Box */}
              <div className="flex items-center gap-2 bg-[#080d19] border border-slate-700/80 rounded-xl px-3.5 py-2 text-xs text-white flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 shrink-0" />
                <input
                  type="text"
                  placeholder="Search purchases by store, merchant, or amount..."
                  value={txSearch}
                  onChange={e => setTxSearch(e.target.value)}
                  className="bg-transparent border-none outline-none text-xs text-white placeholder-slate-500 w-full"
                />
                {txSearch && (
                  <button onClick={() => setTxSearch('')} className="text-slate-400 hover:text-white">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Category Dropdown Filter */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400 font-semibold shrink-0">Category:</span>
                <select
                  value={categoryFilter}
                  onChange={e => setCategoryFilter(e.target.value)}
                  className="bg-[#080d19] border border-slate-700/80 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">All Categories</option>
                  <option value="Groceries">Groceries</option>
                  <option value="Dining">Dining</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Entertainment">Entertainment</option>
                  <option value="Travel">Travel</option>
                  <option value="Services">Services</option>
                </select>
              </div>
            </div>

            {/* Purchases Table */}
            <div className="bg-[#0d1527] border border-slate-800 rounded-2xl p-5 shadow-sm">
              {filteredTransactions.length === 0 ? (
                <p className="text-xs text-slate-500 py-8 text-center">
                  No purchases found matching your filter criteria.
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
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: AI ADVISOR (Compact Memory + Past Chats History Button) */}
        {/* ========================================================================= */}
        {activeTab === 'advisor' && (
          <div className="bg-[#0d1527] border border-slate-800 rounded-2xl p-5 flex flex-col h-[700px] shadow-xl">
            {/* Header: Title on Left, Past Chats & Compact Memory on Right */}
            <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Bot className="w-4 h-4 text-blue-400" />
                  <span>AI Financial Advisor</span>
                </h3>
                <p className="text-[11px] text-slate-400">Personalized debt & cash flow guidance</p>
              </div>

              <div className="flex items-center gap-2">
                {/* Past Chats Button */}
                <button
                  type="button"
                  onClick={() => setIsPastChatsOpen(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 cursor-pointer transition-all"
                  title="View Past Chats & History"
                >
                  <History className="w-3.5 h-3.5 text-blue-400" />
                  <span>Past Chats</span>
                  {chatSessions.length > 1 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-blue-600/30 text-blue-300 text-[10px] font-bold border border-blue-500/30">
                      {chatSessions.length}
                    </span>
                  )}
                </button>

                {/* Reduced Compact Memory Button */}
                <button
                  type="button"
                  onClick={() => setIsMemoryModalOpen(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 cursor-pointer transition-all"
                  title="Manage AI Memory & Preferences"
                >
                  <Brain className="w-3.5 h-3.5 text-indigo-400" />
                  <span className="hidden sm:inline">Memory</span>
                  {aiMemory.length > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-blue-600 text-white text-[10px] font-bold">
                      {aiMemory.length}
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Chat Messages */}
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
                    <span>Analyzing your finances & documents...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* AI Input Form with Upload Button */}
            <form onSubmit={handleSendChatMessage} className="pt-2 flex items-center gap-2">
              {/* Document / PDF Upload Dropdown */}
              <div className="relative" ref={uploadMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsUploadMenuOpen(!isUploadMenuOpen)}
                  className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 cursor-pointer transition-all flex items-center justify-center"
                  title="Upload or scan statement / document"
                >
                  <Paperclip className="w-4 h-4" />
                </button>

                {isUploadMenuOpen && (
                  <div className="absolute bottom-12 left-0 w-64 rounded-2xl bg-[#0c1427] border border-slate-800 shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-bottom-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsUploadMenuOpen(false);
                        fileInputRef.current?.click();
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <UploadCloud className="w-4 h-4 text-emerald-400 shrink-0" />
                      <div>
                        <div className="font-semibold">Upload PDF / Document</div>
                        <div className="text-[10px] text-slate-400">Scans statement & adds to bills and purchases</div>
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setIsUploadMenuOpen(false);
                        setIsScanBillOpen(true);
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs text-slate-200 hover:bg-slate-800 flex items-center gap-2.5 transition-colors cursor-pointer border-t border-slate-800/60"
                    >
                      <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                      <div>
                        <div className="font-semibold">Scan Statement Text</div>
                        <div className="text-[10px] text-slate-400">Paste raw bill or statement details</div>
                      </div>
                    </button>
                  </div>
                )}
              </div>

              {/* Hidden file input for statement PDFs & documents */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept=".pdf,.png,.jpg,.jpeg,.txt,.csv"
                className="hidden"
              />

              <input
                type="text"
                placeholder="Ask Klarity about your finances, bills, or debt payoff..."
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

            {/* 2. AI Memory & Personal Preferences */}
            <div className="bg-[#0d1527] border border-slate-800 rounded-2xl p-6 flex flex-col gap-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <Brain className="w-4 h-4 text-indigo-400" />
                    <span>AI Memory & Personal Preferences</span>
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Teach Klarity your personal financial goals and preferences (e.g., debt payoff priority, savings targets) so it remembers them across conversations.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMemoryModalOpen(true)}
                  className="px-3.5 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md shadow-indigo-600/20 cursor-pointer transition-colors"
                >
                  Manage Memory ({aiMemory.length})
                </button>
              </div>

              {aiMemory.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#080d19] border border-slate-800 text-center text-xs text-slate-500 flex flex-col items-center gap-3">
                  <span>No custom rules or memory saved yet.</span>
                  <div className="flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        handleAddMemory(
                          'Prioritize aggressive debt elimination: focus extra funds on clearing balances as fast as possible.'
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold cursor-pointer"
                    >
                      + Rapid Debt Elimination
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        handleAddMemory(
                          'Emergency savings priority: Maintain at least 3 months of emergency expenses before investing or discretionary spending.'
                        )
                      }
                      className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold cursor-pointer"
                    >
                      + Emergency Fund First
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {aiMemory.map((item, idx) => (
                    <div
                      key={idx}
                      className="px-3 py-1.5 rounded-xl bg-[#080d19] border border-slate-800 text-xs text-slate-200 flex items-center gap-2"
                    >
                      <span className="truncate max-w-md">{item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMemory(idx)}
                        className="text-slate-500 hover:text-rose-400 cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3. Plaid Banking Integration */}
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

      {/* AI Memory & Preferences Modal */}
      {isMemoryModalOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-400" />
                <h3 className="text-base font-bold text-white">AI Advisor Memory</h3>
              </div>
              <button
                onClick={() => setIsMemoryModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Klarity remembers your personal beliefs, financial rules, and lifestyle facts across every conversation so you never have to repeat them.
            </p>

            {/* Quick Presets */}
            <div className="bg-[#080d19] border border-slate-800 rounded-xl p-3 flex flex-col gap-2">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Quick Presets
              </span>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    handleAddMemory(
                      'Aggressive debt elimination: Prioritize clearing existing balances as rapidly as possible.'
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-300 border border-blue-500/30 text-xs font-semibold cursor-pointer transition-colors"
                >
                  + Rapid Debt Elimination
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleAddMemory(
                      'Emergency savings priority: Maintain at least 3 months of emergency expenses before investing or discretionary spending.'
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold cursor-pointer transition-colors"
                >
                  + Emergency Savings First
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleAddMemory(
                      'Frugal budgeting: Help me identify recurring expenses and unnecessary subscriptions to reduce monthly overhead.'
                    )
                  }
                  className="px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold cursor-pointer transition-colors"
                >
                  + Frugal Budgeting
                </button>
              </div>
            </div>

            {/* Add Custom Fact */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add custom memory (e.g., 'Save for a down payment', 'Avoid new credit cards')..."
                value={newMemoryInput}
                onChange={e => setNewMemoryInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddMemory();
                  }
                }}
                className="flex-1 bg-[#080d19] border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                onClick={() => handleAddMemory()}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition-all shadow-md shadow-blue-600/20 cursor-pointer"
              >
                Add
              </button>
            </div>

            {/* Active Memory Items */}
            <div className="flex flex-col gap-2 mt-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300">Active Memory Rules ({aiMemory.length})</span>
                {aiMemory.length > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      setAiMemory([]);
                      localStorage.removeItem('klarity_ai_memory');
                      setNotificationToast('Memory cleared');
                      setTimeout(() => setNotificationToast(''), 3000);
                    }}
                    className="text-[11px] text-rose-400 hover:text-rose-300 cursor-pointer"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {aiMemory.length === 0 ? (
                <div className="p-4 rounded-xl bg-[#080d19] border border-slate-800 text-center text-xs text-slate-500">
                  No memory rules saved yet. Add one above or choose a preset.
                </div>
              ) : (
                <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
                  {aiMemory.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-[#080d19] border border-slate-800 flex items-start justify-between gap-3 text-xs"
                    >
                      <span className="text-slate-200 leading-relaxed">{item}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMemory(idx)}
                        className="text-slate-500 hover:text-rose-400 p-1 cursor-pointer transition-colors shrink-0"
                        title="Delete memory"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsMemoryModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Past Chats Modal / History (like Gemini chats) */}
      {isPastChatsOpen && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 max-h-[85vh]">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-bold text-white">Past Conversations</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleCreateNewChat}
                  className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-blue-600/20 cursor-pointer transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>New Chat</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsPastChatsOpen(false)}
                  className="text-slate-400 hover:text-white cursor-pointer p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <p className="text-xs text-slate-300">
              Select any past conversation below to resume where you left off, or start a new thread.
            </p>

            <div className="overflow-y-auto flex flex-col gap-2 flex-1 pr-1 max-h-96">
              {chatSessions.map(session => {
                const isActive = session.id === activeSessionId;
                const msgCount = session.messages?.length || 0;
                return (
                  <div
                    key={session.id}
                    onClick={() => handleSwitchSession(session.id)}
                    className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                      isActive
                        ? 'bg-blue-600/15 border-blue-500/50 text-white'
                        : 'bg-[#080d19] border-slate-800 hover:border-slate-700 text-slate-300'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold truncate text-white">{session.title || 'Conversation'}</p>
                      <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-2">
                        <span>{new Date(session.createdAt || Date.now()).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{msgCount} messages</span>
                        {isActive && <span className="text-blue-400 font-semibold">• Active</span>}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleDeleteSession(session.id, e)}
                      className="text-slate-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 cursor-pointer transition-colors shrink-0"
                      title="Delete conversation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center justify-end pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsPastChatsOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
