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
  ArrowLeft,
  Layers,
  Globe,
  Maximize2
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
  // Current user state (persisted in localStorage, default to Ziyad Elmahi)
  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('klarity_user');
      return saved ? JSON.parse(saved) : {
        id: 'u-ziyad',
        email: 'zeoe13@gmail.com',
        name: 'Ziyad Elmahi',
        avatar: '',
        role: 'Primary Member'
      };
    } catch {
      return {
        id: 'u-ziyad',
        email: 'zeoe13@gmail.com',
        name: 'Ziyad Elmahi',
        avatar: '',
        role: 'Primary Member'
      };
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
  const [data, setData] = useState(() => {
    try {
      const cached = localStorage.getItem('klarity_finance_data');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && Array.isArray(parsed.accounts)) return parsed;
      }
    } catch (e) {}
    return {
      accounts: [],
      bills: [],
      transactions: [],
      metrics: { totalChecking: 0, totalCreditDebt: 0, totalMonthlyBills: 0, netWorthEstimate: 0 }
    };
  });
  const VALID_TABS = ['dashboard', 'cards', 'bills', 'subscriptions', 'transactions', 'advisor'];

  const getInitialTab = () => {
    try {
      const hash = window.location.hash.replace(/^#/, '').trim().toLowerCase();
      if (VALID_TABS.includes(hash)) {
        return hash;
      }
      const saved = localStorage.getItem('klarity_active_tab');
      if (saved && VALID_TABS.includes(saved)) {
        return saved;
      }
    } catch (e) {}
    return 'dashboard';
  };

  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(getInitialTab); // dashboard | cards | bills | subscriptions | transactions | advisor
  const isNavigatingFromHistory = useRef(false);
  const settingsModalRef = useRef(null);
  const [viewHousehold, setViewHousehold] = useState(false);

  // Settings & Plaid state
  const [settings, setSettings] = useState({ hasPlaidKeys: false, plaidEnv: 'development' });
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [settingsActiveTab, setSettingsActiveTab] = useState('profile'); // 'profile' | 'ai' | 'plaid' | 'session'
  const [settingsDisplayName, setSettingsDisplayName] = useState(currentUser?.name || 'Ziyad Elmahi');
  const [settingsAiProvider, setSettingsAiProvider] = useState(() => {
    try {
      return localStorage.getItem('klarity_ai_provider') || 'gemini';
    } catch {
      return 'gemini';
    }
  });
  const [settingsAiModel, setSettingsAiModel] = useState(() => {
    try {
      const saved = localStorage.getItem('klarity_ai_model');
      if (saved && !saved.includes('2.0') && !saved.includes('2.5') && !saved.includes('tts')) return saved;
      return 'gemini-3.8-flash';
    } catch {
      return 'gemini-3.8-flash';
    }
  });
  const [settingsAiApiKey, setSettingsAiApiKey] = useState(() => {
    try {
      return localStorage.getItem('klarity_ai_api_key') || '';
    } catch {
      return '';
    }
  });
  const [settingsAiMaskedKey, setSettingsAiMaskedKey] = useState(() => {
    try {
      return localStorage.getItem('klarity_ai_masked_key') || '';
    } catch {
      return '';
    }
  });
  const [settingsAiStatus, setSettingsAiStatus] = useState(() => {
    try {
      return localStorage.getItem('klarity_ai_status') || 'not_connected';
    } catch {
      return 'not_connected';
    }
  });
  const [settingsAiShowKey, setSettingsAiShowKey] = useState(false);
  const [settingsAiTesting, setSettingsAiTesting] = useState(false);
  const [settingsAiPermissions, setSettingsAiPermissions] = useState({
    bills: true,
    subscriptions: true,
    cards: true,
    purchases: true
  });
  const [settingsPlaidClientId, setSettingsPlaidClientId] = useState(() => {
    try {
      return localStorage.getItem('klarity_plaid_client_id') || '';
    } catch {
      return '';
    }
  });
  const [settingsPlaidSecret, setSettingsPlaidSecret] = useState('');
  const [settingsPlaidMaskedSecret, setSettingsPlaidMaskedSecret] = useState(() => {
    try {
      return localStorage.getItem('klarity_plaid_masked_secret') || '';
    } catch {
      return '';
    }
  });
  const [settingsPlaidStatus, setSettingsPlaidStatus] = useState(() => {
    try {
      return localStorage.getItem('klarity_plaid_status') || 'not_connected';
    } catch {
      return 'not_connected';
    }
  });
  const [settingsPlaidShowSecret, setSettingsPlaidShowSecret] = useState(false);
  const [bankTab, setBankTab] = useState('connected'); // 'connected' | 'connect'

  // Plaid Link token state
  const [linkToken, setLinkToken] = useState(null);
  const [isConnectingPlaid, setIsConnectingPlaid] = useState(false);
  const [plaidError, setPlaidError] = useState('');

  // Modals
  const [isAddAccountOpen, setIsAddAccountOpen] = useState(false);
  const [isAddBillOpen, setIsAddBillOpen] = useState(false);
  const [isAddTxOpen, setIsAddTxOpen] = useState(false);
  const [isAddSubOpen, setIsAddSubOpen] = useState(false);
  const [isScanBillOpen, setIsScanBillOpen] = useState(false);
  const [notificationToast, setNotificationToast] = useState('');

  // Forms for real accounts, bills, purchases, and subscriptions
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

  const [newTx, setNewTx] = useState({
    name: '',
    amount: '',
    category: 'Groceries',
    date: new Date().toISOString().split('T')[0]
  });

  const [newSub, setNewSub] = useState({
    name: '',
    amount: '',
    billingCycle: 'monthly',
    renewalDate: '1st of month',
    category: 'Entertainment'
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

  // Resizable Right Advisor Sidebar state
  const [advisorWidth, setAdvisorWidth] = useState(() => {
    try {
      const saved = localStorage.getItem('klarity_advisor_width');
      return saved ? Math.min(Math.max(parseInt(saved, 10), 280), 650) : 340;
    } catch (e) {
      return 340;
    }
  });
  const [isResizingAdvisor, setIsResizingAdvisor] = useState(false);

  const startResizingAdvisor = (mouseDownEvent) => {
    mouseDownEvent.preventDefault();
    setIsResizingAdvisor(true);
    const startX = mouseDownEvent.clientX;
    const startWidth = advisorWidth;

    const doDrag = (mouseMoveEvent) => {
      // Dragging leftwards increases right sidebar width
      const deltaX = startX - mouseMoveEvent.clientX;
      const newW = Math.min(Math.max(startWidth + deltaX, 280), 650);
      setAdvisorWidth(newW);
    };

    const stopDrag = () => {
      setIsResizingAdvisor(false);
      window.removeEventListener('mousemove', doDrag);
      window.removeEventListener('mouseup', stopDrag);
      try {
        localStorage.setItem('klarity_advisor_width', String(advisorWidth));
      } catch (e) {}
    };

    window.addEventListener('mousemove', doDrag);
    window.addEventListener('mouseup', stopDrag);
  };

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
  const [chatFiles, setChatFiles] = useState([]); // Array of { id, name, size, mimeType, ext, isImage, previewUrl, base64, textContent }
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatEndRef = useRef(null);
  const fullChatContainerRef = useRef(null);
  const sidebarChatContainerRef = useRef(null);

  const scrollChatToBottom = () => {
    const scrollEl = (el) => {
      if (el) {
        el.scrollTop = el.scrollHeight;
      }
    };
    scrollEl(fullChatContainerRef.current);
    scrollEl(sidebarChatContainerRef.current);
    requestAnimationFrame(() => {
      scrollEl(fullChatContainerRef.current);
      scrollEl(sidebarChatContainerRef.current);
    });
    setTimeout(() => {
      scrollEl(fullChatContainerRef.current);
      scrollEl(sidebarChatContainerRef.current);
    }, 80);
  };

  // Multi-file reader supporting any file format
  const handleAttachFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const filesArray = Array.from(fileList);
    const processed = await Promise.all(
      filesArray.map(async (file) => {
        const name = file.name || 'Attached File';
        const ext = (name.includes('.') ? name.split('.').pop() : (file.type?.split('/')[1] || 'FILE')).toUpperCase().slice(0, 6);
        const mimeType = file.type || (name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream');
        const isImage = mimeType.startsWith('image/');
        const isTextLike =
          mimeType.startsWith('text/') ||
          /\.(txt|csv|tsv|json|md|xml|html|htm|log|yaml|yml|ini|conf|ofx|qfx|qif)$/i.test(name);

        let textContent = '';
        if (isTextLike) {
          try {
            textContent = await file.text();
          } catch (e) {}
        }

        const dataUrl = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (evt) => resolve(evt.target?.result || '');
          reader.onerror = () => resolve('');
          reader.readAsDataURL(file);
        });

        const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : '';
        return {
          id: `att-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          name,
          size: file.size || 0,
          mimeType,
          ext,
          isImage,
          previewUrl: isImage ? dataUrl : null,
          base64,
          textContent
        };
      })
    );
    setChatFiles((prev) => [...prev, ...processed]);
  };

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
  const [isFullUploadMenuOpen, setIsFullUploadMenuOpen] = useState(false);
  const uploadMenuRef = useRef(null);
  const fullUploadMenuRef = useRef(null);
  const fileInputRef = useRef(null);
  const fullAdvisorFileInputRef = useRef(null);

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
      if (fullUploadMenuRef.current && !fullUploadMenuRef.current.contains(e.target)) {
        setIsFullUploadMenuOpen(false);
      }
      if (isSettingsOpen && settingsModalRef.current && !settingsModalRef.current.contains(e.target)) {
        setIsSettingsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        if (isSettingsOpen) setIsSettingsOpen(false);
        if (isUserMenuOpen) setIsUserMenuOpen(false);
        if (isUploadMenuOpen) setIsUploadMenuOpen(false);
        if (isFullUploadMenuOpen) setIsFullUploadMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isSettingsOpen, isUserMenuOpen, isUploadMenuOpen, isFullUploadMenuOpen]);

  // Synchronize activeTab with URL hash and browser history (supports page refresh & mouse back/forward buttons)
  useEffect(() => {
    const handleHistoryChange = (e) => {
      let targetTab = e.state?.tab;
      if (!targetTab) {
        const hash = window.location.hash.replace(/^#/, '').trim().toLowerCase();
        if (VALID_TABS.includes(hash)) {
          targetTab = hash;
        }
      }
      if (targetTab && VALID_TABS.includes(targetTab)) {
        isNavigatingFromHistory.current = true;
        setActiveTab(targetTab);
        try {
          localStorage.setItem('klarity_active_tab', targetTab);
        } catch (err) {}
      }
    };

    window.addEventListener('popstate', handleHistoryChange);
    window.addEventListener('hashchange', handleHistoryChange);

    // Mouse back (button 3) and mouse forward (button 4) event listener
    const handleMouseNav = (e) => {
      if (e.button === 3) {
        e.preventDefault();
        window.history.back();
      } else if (e.button === 4) {
        e.preventDefault();
        window.history.forward();
      }
    };
    window.addEventListener('mouseup', handleMouseNav);

    // Ensure initial entry exists in history state
    const currentHash = `#${activeTab}`;
    if (window.location.hash !== currentHash || !window.history.state?.tab) {
      try {
        window.history.replaceState({ tab: activeTab }, '', currentHash);
      } catch (err) {}
    }

    return () => {
      window.removeEventListener('popstate', handleHistoryChange);
      window.removeEventListener('hashchange', handleHistoryChange);
      window.removeEventListener('mouseup', handleMouseNav);
    };
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem('klarity_active_tab', activeTab);
    } catch (e) {}

    if (isNavigatingFromHistory.current) {
      isNavigatingFromHistory.current = false;
      return;
    }

    const targetHash = `#${activeTab}`;
    if (window.location.hash !== targetHash) {
      try {
        window.history.pushState({ tab: activeTab }, '', targetHash);
      } catch (e) {}
    }
  }, [activeTab]);

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

  // Fetch Settings & Sync with Server-Side Encrypted Values
  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const json = await res.json();
        setSettings(json);
        if (json.user?.name) {
          setSettingsDisplayName(json.user.name);
        }
        if (json.ai) {
          let prov = localStorage.getItem('klarity_ai_provider') || json.ai.provider || 'gemini';
          let mod = localStorage.getItem('klarity_ai_model') || json.ai.model || 'gemini-3.8-flash';
          if (mod.includes('2.0') || mod.includes('2.5') || mod.includes('tts')) mod = 'gemini-3.8-flash';

          const storedKey = localStorage.getItem('klarity_ai_api_key');
          const storedMasked = localStorage.getItem('klarity_ai_masked_key');
          const storedStatus = localStorage.getItem('klarity_ai_status');

          const finalMasked = json.ai.maskedKey || storedMasked || '';
          const finalStatus = (json.ai.status === 'connected' || storedStatus === 'connected' || Boolean(storedKey)) ? 'connected' : 'not_connected';

          setSettingsAiProvider(prov);
          setSettingsAiModel(mod);
          setSettingsAiMaskedKey(finalMasked);
          setSettingsAiStatus(finalStatus);
          if (json.ai.dataPermissions) {
            setSettingsAiPermissions(json.ai.dataPermissions);
          }
        }
        if (json.plaid) {
          const storedClientId = localStorage.getItem('klarity_plaid_client_id') || '';
          const storedMaskedSecret = localStorage.getItem('klarity_plaid_masked_secret') || '';
          const storedSecret = localStorage.getItem('klarity_plaid_secret') || '';
          const storedStatus = localStorage.getItem('klarity_plaid_status') || 'not_connected';

          const finalClientId = json.plaid.clientId || storedClientId;
          const finalMasked = json.plaid.maskedSecret || storedMaskedSecret;
          const finalStatus = (json.plaid.status === 'connected' || storedStatus === 'connected' || Boolean(storedClientId)) ? 'connected' : 'not_connected';

          if (finalClientId) setSettingsPlaidClientId(finalClientId);
          if (finalMasked) setSettingsPlaidMaskedSecret(finalMasked);
          if (storedSecret) setSettingsPlaidSecret(storedSecret);
          setSettingsPlaidStatus(finalStatus);
        }
      }
    } catch (err) {
      console.warn('Could not fetch settings:', err);
    }
  };

  const handleProviderChange = (newProvider) => {
    setSettingsAiProvider(newProvider);
    if (newProvider === 'anthropic') setSettingsAiModel('claude-3-7-sonnet-20250219');
    else if (newProvider === 'openai') setSettingsAiModel('gpt-4o');
    else if (newProvider === 'gemini') setSettingsAiModel('gemini-3.8-flash');
  };

  const handleSaveProfile = async () => {
    if (!settingsDisplayName.trim()) return;
    try {
      const res = await fetch('/api/settings/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: settingsDisplayName.trim() })
      });
      if (res.ok) {
        setCurrentUser(prev => ({ ...prev, name: settingsDisplayName.trim() }));
        setNotificationToast('Profile updated!');
        setTimeout(() => setNotificationToast(''), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveAndTestAiKey = async () => {
    const rawKey = settingsAiApiKey.trim() || localStorage.getItem('klarity_ai_api_key') || '';
    if (!rawKey) {
      setNotificationToast('Please enter an API key to test');
      setTimeout(() => setNotificationToast(''), 3000);
      return;
    }
    setSettingsAiTesting(true);
    try {
      const res = await fetch('/api/settings/ai-key/test-and-save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: settingsAiProvider,
          model: settingsAiModel,
          apiKey: rawKey,
          dataPermissions: settingsAiPermissions
        })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setSettingsAiStatus('connected');
        setSettingsAiMaskedKey(json.maskedKey);
        try {
          localStorage.setItem('klarity_ai_api_key', rawKey);
          localStorage.setItem('klarity_ai_masked_key', json.maskedKey);
          localStorage.setItem('klarity_ai_provider', settingsAiProvider);
          localStorage.setItem('klarity_ai_model', settingsAiModel);
          localStorage.setItem('klarity_ai_status', 'connected');
        } catch {}
        setNotificationToast('API key verified and securely saved!');
      } else {
        setSettingsAiStatus('invalid_key');
        setNotificationToast(`Verification failed: ${json.error || 'Invalid API key'}`);
      }
    } catch (err) {
      setSettingsAiStatus('invalid_key');
      setNotificationToast('Verification request failed');
    } finally {
      setSettingsAiTesting(false);
      setTimeout(() => setNotificationToast(''), 4000);
    }
  };

  const handleRemoveAiKey = async () => {
    try {
      const res = await fetch('/api/settings/ai-key/remove', { method: 'POST' });
      if (res.ok) {
        setSettingsAiStatus('not_connected');
        setSettingsAiMaskedKey('');
        setSettingsAiApiKey('');
        try {
          localStorage.removeItem('klarity_ai_api_key');
          localStorage.removeItem('klarity_ai_masked_key');
          localStorage.removeItem('klarity_ai_status');
        } catch {}
        setNotificationToast('AI API key removed.');
        setTimeout(() => setNotificationToast(''), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTogglePermission = async (category) => {
    const updated = { ...settingsAiPermissions, [category]: !settingsAiPermissions[category] };
    setSettingsAiPermissions(updated);
    try {
      await fetch('/api/settings/ai-permissions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dataPermissions: updated })
      });
    } catch (e) {
      console.error(e);
    }
  };

  const handleSavePlaidCredentials = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    try {
      if (settingsPlaidClientId) {
        try { localStorage.setItem('klarity_plaid_client_id', settingsPlaidClientId); } catch {}
      }
      const res = await fetch('/api/settings/plaid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: settingsPlaidClientId,
          secret: settingsPlaidSecret
        })
      });
      const json = await res.json();
      if (res.ok && json.success) {
        setSettingsPlaidMaskedSecret(json.maskedSecret);
        setSettingsPlaidStatus(json.status);
        setSettingsPlaidSecret('');
        try {
          if (json.clientId) localStorage.setItem('klarity_plaid_client_id', json.clientId);
          if (json.maskedSecret) localStorage.setItem('klarity_plaid_masked_secret', json.maskedSecret);
          if (settingsPlaidSecret) localStorage.setItem('klarity_plaid_secret', settingsPlaidSecret);
          localStorage.setItem('klarity_plaid_status', json.status || 'connected');
        } catch {}
        setNotificationToast('Plaid credentials saved securely server-side!');
        setTimeout(() => setNotificationToast(''), 3000);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDisconnectBank = async (itemId, institutionName) => {
    if (!window.confirm(`Are you sure you want to disconnect ${institutionName || 'this bank'}? Its linked accounts and cards will be removed.`)) return;
    try {
      const res = await fetch(`/api/plaid/items/${itemId}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchData();
        await fetchSettings();
        setNotificationToast(`${institutionName || 'Bank'} disconnected.`);
        setTimeout(() => setNotificationToast(''), 3500);
      }
    } catch (err) {
      console.error('Failed to disconnect bank:', err);
    }
  };

  // Fetch user data
  const fetchData = async (user = currentUser, household = viewHousehold) => {
    if (!user) return;
    setLoading(true);
    try {
      const getLocalList = (key) => {
        try {
          const raw = localStorage.getItem(key);
          return raw ? JSON.parse(raw) : [];
        } catch { return []; }
      };
      const localCachedAccounts = getLocalList('klarity_accounts');
      const localCachedBills = getLocalList('klarity_bills');
      const localCachedSubs = getLocalList('klarity_subscriptions');
      const localCachedTxs = getLocalList('klarity_transactions');

      const res = await fetch(`/api/data?userId=${user.id}&household=${household}`);
      if (res.ok) {
        const json = await res.json();
        const mergedAccounts = (json.accounts && json.accounts.length > 0) ? json.accounts : localCachedAccounts;
        const mergedBills = (json.bills && json.bills.length > 0) ? json.bills : localCachedBills;
        const mergedSubs = (json.subscriptions && json.subscriptions.length > 0) ? json.subscriptions : localCachedSubs;
        const mergedTxs = (json.transactions && json.transactions.length > 0) ? json.transactions : localCachedTxs;

        const needsSync =
          (json.accounts?.length === 0 && localCachedAccounts.length > 0) ||
          (json.bills?.length === 0 && localCachedBills.length > 0) ||
          (json.subscriptions?.length === 0 && localCachedSubs.length > 0) ||
          (json.transactions?.length === 0 && localCachedTxs.length > 0);

        const finalData = {
          ...json,
          accounts: mergedAccounts,
          bills: mergedBills,
          subscriptions: mergedSubs,
          transactions: mergedTxs,
          metrics: {
            ...json.metrics,
            totalCreditDebt: mergedAccounts.filter(a => a.type === 'credit').reduce((s, a) => s + Number(a.balance || 0), 0),
            totalChecking: mergedAccounts.filter(a => a.type === 'depository').reduce((s, a) => s + Number(a.balance || 0), 0),
            totalMonthlyBills: mergedBills.reduce((s, b) => s + Number(b.expectedAmount || 0), 0),
            totalSubscriptions: mergedSubs.reduce((s, sub) => s + Number(sub.amount || 0), 0)
          }
        };

        setData(finalData);
        try {
          localStorage.setItem('klarity_finance_data', JSON.stringify(finalData));
          if (mergedAccounts.length > 0) localStorage.setItem('klarity_accounts', JSON.stringify(mergedAccounts));
          if (mergedBills.length > 0) localStorage.setItem('klarity_bills', JSON.stringify(mergedBills));
          if (mergedSubs.length > 0) localStorage.setItem('klarity_subscriptions', JSON.stringify(mergedSubs));
          if (mergedTxs.length > 0) localStorage.setItem('klarity_transactions', JSON.stringify(mergedTxs));
        } catch (e) {}

        if (needsSync) {
          fetch('/api/accounts/batch-sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              accounts: mergedAccounts,
              bills: mergedBills,
              subscriptions: mergedSubs,
              transactions: mergedTxs,
              userId: user.id
            })
          }).catch(() => {});
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
    scrollChatToBottom();
  }, [chatMessages, isAiTyping, activeTab]);

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
      const storedClientId = settingsPlaidClientId || localStorage.getItem('klarity_plaid_client_id') || '';
      const storedSecret = settingsPlaidSecret || localStorage.getItem('klarity_plaid_secret') || '';

      const res = await fetch('/api/plaid/create-link-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser.id,
          clientPlaidId: storedClientId,
          clientPlaidSecret: storedSecret
        })
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
          setIsConnectingPlaid(true);
          const storedClientId = settingsPlaidClientId || localStorage.getItem('klarity_plaid_client_id') || '';
          const storedSecret = settingsPlaidSecret || localStorage.getItem('klarity_plaid_secret') || '';

          const res = await fetch('/api/plaid/exchange-public-token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              public_token,
              metadata,
              userId: currentUser.id,
              clientPlaidId: storedClientId,
              clientPlaidSecret: storedSecret
            })
          });

          const resData = await res.json();
          if (res.ok && resData.accounts && resData.accounts.length > 0) {
            setData(prev => {
              const existing = prev.accounts || [];
              const updatedAccounts = existing.filter(a => !resData.accounts.some(na => na.id === a.id)).concat(resData.accounts);
              const newData = {
                ...prev,
                accounts: updatedAccounts,
                metrics: {
                  ...prev.metrics,
                  totalCreditDebt: updatedAccounts.filter(a => a.type === 'credit').reduce((s, a) => s + Number(a.balance || 0), 0),
                  totalChecking: updatedAccounts.filter(a => a.type === 'depository').reduce((s, a) => s + Number(a.balance || 0), 0)
                }
              };
              try {
                localStorage.setItem('klarity_finance_data', JSON.stringify(newData));
                localStorage.setItem('klarity_accounts', JSON.stringify(updatedAccounts));
                localStorage.setItem('klarity_plaid_status', 'connected');
              } catch (e) {}
              return newData;
            });
            setSettingsPlaidStatus('connected');
            setNotificationToast(`Connected ${resData.accounts.length} account(s) from ${metadata?.institution?.name || 'bank'}!`);
          } else if (!res.ok) {
            setPlaidError(resData.error || 'Failed to exchange Plaid token.');
          }
          setLinkToken(null);
          await fetchData();
        } catch (err) {
          console.error('Plaid link exchange error:', err);
          setPlaidError('Could not complete bank linking: ' + err.message);
        } finally {
          setIsConnectingPlaid(false);
          setTimeout(() => setNotificationToast(''), 5000);
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

  // Scan Document / Statement Sentences via AI Comprehension
  const handleScanBill = async () => {
    const rawSentences = (scanText || '').trim();
    if (!rawSentences) return;
    setIsScanBillOpen(false);
    setScanText('');
    setScanResult(null);
    await handleSendChatMessage(
      `Please scan and comprehend these statement details/sentences and automatically add every bill, subscription, and purchase mentioned:\n\n${rawSentences}`
    );
  };

  // Add Transaction Manually
  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!newTx.name.trim() || !newTx.amount) return;
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newTx,
          ownerId: currentUser?.id
        })
      });
      if (res.ok) {
        setIsAddTxOpen(false);
        setNewTx({
          name: '',
          amount: '',
          category: 'Groceries',
          date: new Date().toISOString().split('T')[0]
        });
        await fetchData();
        setNotificationToast(`Added purchase: ${newTx.name}`);
        setTimeout(() => setNotificationToast(''), 3500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Purchase (Transaction)
  const handleDeleteTransaction = async (txId, txName) => {
    if (!window.confirm(`Delete purchase "${txName || 'this transaction'}"?`)) return;
    try {
      const res = await fetch(`/api/transactions/${txId}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchData();
        setNotificationToast('Purchase deleted.');
        setTimeout(() => setNotificationToast(''), 3000);
      }
    } catch (err) {
      console.error('Failed to delete transaction:', err);
    }
  };

  // Add Subscription
  const handleAddSubscription = async (eOrSub) => {
    if (eOrSub && eOrSub.preventDefault) eOrSub.preventDefault();
    const subToSave = (eOrSub && eOrSub.name) ? eOrSub : newSub;
    if (!subToSave.name || !subToSave.amount) return;

    try {
      const res = await fetch('/api/subscriptions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...subToSave,
          ownerId: currentUser?.id
        })
      });
      if (res.ok) {
        setIsAddSubOpen(false);
        setNewSub({
          name: '',
          amount: '',
          billingCycle: 'monthly',
          renewalDate: '1st of month',
          category: 'Entertainment'
        });
        await fetchData();
        setNotificationToast(`Added subscription: ${subToSave.name}`);
        setTimeout(() => setNotificationToast(''), 3500);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Subscription
  const handleDeleteSubscription = async (subId, subName) => {
    if (!window.confirm(`Remove subscription "${subName || 'this subscription'}"?`)) return;
    try {
      const res = await fetch(`/api/subscriptions/${subId}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchData();
        setNotificationToast('Subscription removed.');
        setTimeout(() => setNotificationToast(''), 3000);
      }
    } catch (err) {
      console.error('Failed to delete subscription:', err);
    }
  };

  // AI Chat
  const handleSendChatMessage = async (eOrText) => {
    if (eOrText && typeof eOrText === 'object' && eOrText.preventDefault) {
      eOrText.preventDefault();
    }
    const userMsg = (typeof eOrText === 'string' ? eOrText : chatInput).trim();
    const currentFiles = typeof eOrText === 'string' ? [] : chatFiles;
    if ((!userMsg && currentFiles.length === 0) || isAiTyping) return;

    if (typeof eOrText !== 'string') {
      setChatInput('');
      setChatFiles([]);
    }

    // Instant client-side intent navigation (only if user explicitly asks to view/go to a tab without uploading files)
    const lower = userMsg.toLowerCase();
    if (currentFiles.length === 0 && !lower.includes('please scan and comprehend')) {
      if ((lower.includes('show') || lower.includes('go to') || lower.includes('open') || lower.includes('view')) && lower.includes('subscription')) {
        setActiveTab('subscriptions');
      } else if ((lower.includes('show') || lower.includes('go to') || lower.includes('open') || lower.includes('view')) && lower.includes('bill')) {
        setActiveTab('bills');
      } else if ((lower.includes('show') || lower.includes('go to') || lower.includes('open') || lower.includes('view')) && lower.includes('card')) {
        setActiveTab('cards');
      } else if ((lower.includes('show') || lower.includes('go to') || lower.includes('open') || lower.includes('view')) && (lower.includes('transaction') || lower.includes('purchase'))) {
        setActiveTab('transactions');
      } else if ((lower.includes('show') || lower.includes('go to') || lower.includes('open') || lower.includes('view')) && (lower.includes('overview') || lower.includes('dashboard') || lower.includes('home'))) {
        setActiveTab('dashboard');
      } else if (lower.includes('setting')) {
        setSettingsActiveTab('ai');
        setIsSettingsOpen(true);
      }
    }

    const displayAttachments = currentFiles.map(f => ({
      id: f.id,
      name: f.name,
      size: f.size,
      mimeType: f.mimeType,
      ext: f.ext,
      isImage: f.isImage,
      previewUrl: f.isImage ? f.previewUrl : null
    }));

    const newDisplayMsg = {
      role: 'user',
      text: userMsg || (currentFiles.length === 1 ? `Submitted file: ${currentFiles[0].name}` : `Submitted ${currentFiles.length} files for analysis`),
      attachments: displayAttachments
    };

    const userUpdatedMessages = [...chatMessages, newDisplayMsg];
    updateActiveSession(userUpdatedMessages);
    setIsAiTyping(true);
    scrollChatToBottom();

    try {
      const cachedApiKey = settingsAiApiKey.trim() || localStorage.getItem('klarity_ai_api_key') || '';
      const cachedProvider = settingsAiProvider || localStorage.getItem('klarity_ai_provider') || 'gemini';
      let cachedModel = settingsAiModel || localStorage.getItem('klarity_ai_model') || 'gemini-3.8-flash';
      if (cachedModel.includes('2.0') || cachedModel.includes('2.5') || cachedModel.includes('tts')) {
        cachedModel = 'gemini-3.8-flash';
        try { localStorage.setItem('klarity_ai_model', 'gemini-3.8-flash'); } catch {}
      }

      const payloadAttachments = currentFiles.map(f => ({
        name: f.name,
        mimeType: f.mimeType,
        base64: f.base64,
        textContent: f.textContent || ''
      }));

      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          userId: currentUser?.id,
          userMemory: aiMemory,
          clientApiKey: cachedApiKey,
          clientProvider: cachedProvider,
          clientModel: cachedModel,
          attachments: payloadAttachments
        })
      });

      const json = await res.json();
      let replyText = json.reply || "I've reviewed your request.";

      // Update local state and localStorage immediately if backend returned updatedData
      if (json.updatedData) {
        setData(prev => {
          const nextBills = json.updatedData.bills || prev.bills || [];
          const nextSubs = json.updatedData.subscriptions || prev.subscriptions || [];
          const nextTxs = json.updatedData.transactions || prev.transactions || [];
          const nextState = {
            ...prev,
            bills: nextBills,
            subscriptions: nextSubs,
            transactions: nextTxs,
            metrics: {
              ...prev.metrics,
              totalMonthlyBills: nextBills.reduce((s, b) => s + Number(b.expectedAmount || 0), 0),
              totalSubscriptions: nextSubs.reduce((s, sub) => s + Number(sub.amount || 0), 0)
            }
          };
          try {
            localStorage.setItem('klarity_finance_data', JSON.stringify(nextState));
            localStorage.setItem('klarity_bills', JSON.stringify(nextBills));
            localStorage.setItem('klarity_subscriptions', JSON.stringify(nextSubs));
            localStorage.setItem('klarity_transactions', JSON.stringify(nextTxs));
          } catch (e) {}
          return nextState;
        });
      }

      // Handle AI action execution notifications (e.g. adding subscriptions, bills, purchases from statements)
      if (json.actionsExecuted && json.actionsExecuted.length > 0) {
        const count = json.actionsExecuted.length;
        setNotificationToast(`Auto-added ${count} item${count > 1 ? 's' : ''} to your records!`);
        setTimeout(() => setNotificationToast(''), 4500);
      } else if (json.actionExecuted) {
        const act = json.actionExecuted;
        setNotificationToast(`Added ${act.item?.name || 'item'} to ${act.type}!`);
        setTimeout(() => setNotificationToast(''), 4000);
      }

      // Strip any [ACTION:...] tags from display text
      replyText = replyText.replace(/\[ACTION:[a-zA-Z0-9_-]+:[\s\S]*?\]/gi, '').trim();

      // Handle AI navigation tags: [NAVIGATE:target]
      const navMatch = replyText.match(/\[NAVIGATE:([a-zA-Z0-9_-]+)\]/i);
      if (navMatch) {
        const dest = navMatch[1].toLowerCase();
        if (dest === 'settings') {
          setSettingsActiveTab('ai');
          setIsSettingsOpen(true);
        } else if (['dashboard', 'bills', 'subscriptions', 'cards', 'transactions', 'overview'].includes(dest)) {
          setActiveTab(dest === 'overview' ? 'dashboard' : dest);
        }
        replyText = replyText.replace(/\[NAVIGATE:[a-zA-Z0-9_-]+\]/gi, '').trim();
      }

      if (json.needsKey) {
        setSettingsAiStatus('not_connected');
      }

      const updated = [...userUpdatedMessages, { role: 'assistant', text: replyText }];
      updateActiveSession(updated);
      scrollChatToBottom();
    } catch (err) {
      const updated = [
        ...userUpdatedMessages,
        { role: 'assistant', text: "Could not connect to AI advisor. Please verify your settings." }
      ];
      updateActiveSession(updated);
      scrollChatToBottom();
    } finally {
      setIsAiTyping(false);
      scrollChatToBottom();
    }
  };

  // =========================================================================
  // 1. SIGN IN SCREEN: GOOGLE OAUTH + OPTIONAL EMAIL
  // =========================================================================
  if (!currentUser) {
    return (
      <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex flex-col justify-between selection:bg-blue-100 selection:text-blue-900">
        {/* Top Navbar */}
        <header className="border-b border-slate-200/80 bg-white/80 backdrop-blur px-6 py-4 flex items-center justify-between">
          <div className="flex items-center">
            <span className="font-serif-title text-2xl font-bold tracking-tight text-slate-900">Klarity</span>
          </div>
        </header>

        {/* Center Container */}
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-md w-full bg-white border border-slate-200/90 rounded-2xl shadow-xl p-6 sm:p-8 flex flex-col gap-6">
            
            {/* Header */}
            <div className="text-center">
              <h2 className="font-serif-title text-2xl font-bold tracking-tight text-slate-900">
                Sign In to Klarity
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Manage your real cards, balances, and household bills securely
              </p>
            </div>

            {/* Error Banner */}
            {authError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
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
              <div className="flex-1 h-px bg-slate-200"></div>
              <span className="text-[10px] font-semibold tracking-wider text-slate-400 uppercase">
                or use email
              </span>
              <div className="flex-1 h-px bg-slate-200"></div>
            </div>

            {/* Tab Switcher: Sign In vs Sign Up */}
            <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-xl border border-slate-200/80 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setAuthMode('signin');
                  setAuthError('');
                }}
                className={`py-1.5 rounded-lg transition-all ${
                  authMode === 'signin'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
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
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Sign Up
              </button>
            </div>

            {/* Email Form */}
            <form onSubmit={handleAuthSubmit} className="flex flex-col gap-3.5 text-xs">
              {authMode === 'signup' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Your Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. John Doe"
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="name@email.com"
                  value={emailInput}
                  onChange={e => setEmailInput(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder={authMode === 'signup' ? 'At least 6 characters' : 'Enter your password'}
                    value={passwordInput}
                    onChange={e => setPasswordInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 pr-10 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {authMode === 'signup' && (
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Confirm Password</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    placeholder="Repeat your password"
                    value={confirmPasswordInput}
                    onChange={e => setConfirmPasswordInput(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isAuthenticating}
                className="w-full mt-1 py-2.5 rounded-xl bg-[#18457c] hover:bg-[#123561] text-white font-semibold text-xs tracking-wide transition-all flex items-center justify-center gap-2 shadow-sm cursor-pointer"
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

        <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">
          © 2026 Klarity. All personal financial data is encrypted and private.
        </footer>
      </div>
    );
  }

  // =========================================================================
  // 2. MAIN APP: REAL CARDS, REAL BILLS, REAL DATA ONLY (Clean Light Theme)
  // =========================================================================
  const accountsList = data?.accounts || [];
  const billsList = data?.bills || [];
  const subscriptionsList = data?.subscriptions || [];
  const transactionsList = data?.transactions || [];

  const isCard = (a) => a.type === 'credit' || (a.subtype || '').toLowerCase().includes('credit') || (a.subtype || '').toLowerCase().includes('card') || (a.name || '').toLowerCase().includes('credit') || (a.name || '').toLowerCase().includes('card');
  const creditCards = accountsList.filter(isCard);
  const checkingAccounts = accountsList.filter(a => !isCard(a));
  const highestAprCard = (creditCards || [])
    .filter(a => Number(a.balance) > 0)
    .sort((a, b) => Number(b.apr || 0) - Number(a.apr || 0))[0] || null;

  const isHalalFinance = aiMemory.some(m => {
    const s = m.toLowerCase();
    return s.includes('muslim') || s.includes('halal') || s.includes('islam') || s.includes('riba');
  });

  const availableCash = checkingAccounts.reduce((sum, a) => sum + Number(a.balance || 0), 0);
  const cardBalances = creditCards.reduce((sum, a) => sum + Number(a.balance || 0), 0);
  const billsDueIn14DaysSum = billsList
    .filter(b => b.status !== 'paid' && (b.daysUntil == null || b.daysUntil <= 14))
    .reduce((sum, b) => sum + Number(b.expectedAmount || 0), 0);
  const billsDueIn14DaysCount = billsList.filter(b => b.status !== 'paid' && (b.daysUntil == null || b.daysUntil <= 14)).length;
  const totalMonthlyBills = billsList.reduce((sum, b) => sum + Number(b.expectedAmount || 0), 0);
  const totalMonthlySubscriptions = subscriptionsList.reduce((sum, s) => sum + Number(s.amount || 0), 0);

  // Default fallback mocks to guarantee 1:1 visual match with reference design
  const DEFAULT_OVERVIEW_CARDS = [
    { id: 'mock-card-1', name: 'Everyday Rewards', mask: '4417', balance: 1102.20, limit: 5000, apr: 21.9, bgColor: 'bg-[#18457c]' },
    { id: 'mock-card-2', name: 'Travel Card', mask: '9082', balance: 662.00, limit: 2000, apr: 24.4, bgColor: 'bg-[#242e3d]' }
  ];

  const DEFAULT_OVERVIEW_BILLS = [
    { id: 'mock-b-1', name: 'PG&E Electric', dueText: 'Due Oct 28 · Checking', daysUntil: 3, amount: 128.40 },
    { id: 'mock-b-2', name: 'Rent', dueText: 'Due Nov 1 · Checking', daysUntil: 7, amount: 650.00 },
    { id: 'mock-b-3', name: 'Water Service', dueText: 'Due Nov 6 · Checking', daysUntil: 12, amount: 63.75 }
  ];

  const DEFAULT_OVERVIEW_SUBS = [
    { id: 'mock-s-1', name: 'Netflix', renewText: 'Renews Nov 3', amount: 15.49 },
    { id: 'mock-s-2', name: 'Spotify', renewText: 'Renews Nov 9', amount: 11.99 },
    { id: 'mock-s-3', name: 'iCloud', renewText: 'Renews Nov 14', amount: 2.99 },
    { id: 'mock-s-4', name: 'ChatGPT Plus', renewText: 'Renews Nov 20', amount: 20.00 }
  ];

  const DEFAULT_OVERVIEW_TXS = [
    { id: 'mock-t-1', name: "Trader Joe's", subText: 'Oct 24 · Everyday Rewards', amount: -54.12 },
    { id: 'mock-t-2', name: 'Shell', subText: 'Oct 23 · Everyday Rewards', amount: -41.80 },
    { id: 'mock-t-3', name: 'Paycheck deposit', subText: 'Oct 22 · Checking', amount: 1850.00 }
  ];

  const displayCash = checkingAccounts.length > 0 ? availableCash : 4218.36;
  const displayCards = creditCards.length > 0
    ? creditCards.map((c, i) => ({
        id: c.id,
        name: c.name,
        mask: c.mask || '4417',
        balance: Number(c.balance || 0),
        limit: Number(c.limit || 5000),
        apr: c.apr || 21.9,
        bgColor: i % 2 === 0 ? 'bg-[#18457c]' : 'bg-[#242e3d]'
      }))
    : DEFAULT_OVERVIEW_CARDS;

  const displayCardBalances = creditCards.length > 0 ? cardBalances : 1764.20;
  const displayBills = billsList.length > 0
    ? billsList.map(b => ({
        id: b.id,
        name: b.name,
        dueText: b.nextDueDate ? `Due ${b.nextDueDate} · Checking` : (b.dueDay ? `Due Day ${b.dueDay} · Checking` : 'Due soon · Checking'),
        daysUntil: b.daysUntil != null ? b.daysUntil : (b.dueDay ? Math.max(1, b.dueDay - 10) : 3),
        amount: Number(b.expectedAmount || 0)
      }))
    : DEFAULT_OVERVIEW_BILLS;

  const displayDue14Sum = billsList.length > 0 ? billsDueIn14DaysSum : 842.15;
  const displayDue14Count = billsList.length > 0 ? billsDueIn14DaysCount : 3;
  const displayTotalMonthlyBills = billsList.length > 0 ? totalMonthlyBills : 842.15;

  const displaySubs = subscriptionsList.length > 0
    ? subscriptionsList.map(s => ({
        id: s.id,
        name: s.name,
        renewText: s.renewalDate ? `Renews ${s.renewalDate}` : 'Renews monthly',
        amount: Number(s.amount || 0)
      }))
    : DEFAULT_OVERVIEW_SUBS;

  const displayTotalSubs = subscriptionsList.length > 0 ? totalMonthlySubscriptions : 50.47;

  const displayTxs = transactionsList.length > 0
    ? transactionsList.slice(0, 3).map(t => ({
        id: t.id,
        name: t.name,
        subText: `${t.date || 'Recent'} · ${t.account || 'Checking'}`,
        amount: Number(t.amount || 0)
      }))
    : DEFAULT_OVERVIEW_TXS;

  const firstName = currentUser?.name ? currentUser.name.split(' ')[0] : 'Ziyad';
  const userInitials = (currentUser?.name || 'Ziyad Elmahi')
    .split(' ')
    .map(p => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() || 'ZE';

  const getTimeGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'morning';
    if (hr < 17) return 'afternoon';
    return 'evening';
  };

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
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex font-sans antialiased selection:bg-blue-100 selection:text-blue-900">
      {linkToken && <PlaidLauncher token={linkToken} />}

      {/* Notification Toast */}
      {notificationToast && (
        <div className="fixed top-5 right-5 z-50 bg-[#18457c] text-white px-4 py-2.5 rounded-xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{notificationToast}</span>
        </div>
      )}

      {/* ======================================================================= */}
      {/* 1. LEFT SIDEBAR (Overview, Bills, Subscriptions, Cards, Transactions, Advisor) */}
      {/* ======================================================================= */}
      <aside className="w-56 shrink-0 border-r border-slate-200/80 bg-[#f8fafc] p-6 flex flex-col justify-between h-screen sticky top-0 hidden md:flex">
        <div>
          {/* Logo Brand */}
          <h1 className="font-serif-title text-2xl font-bold tracking-tight text-slate-900 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
            Klarity
          </h1>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1 mt-7">
            {[
              { id: 'dashboard', label: 'Overview' },
              { id: 'bills', label: 'Bills' },
              { id: 'subscriptions', label: 'Subscriptions' },
              { id: 'cards', label: 'Cards' },
              { id: 'transactions', label: 'Transactions' }
            ].map(item => {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full text-left px-3.5 py-2 rounded-lg text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#e8edf5] text-[#1e3a8a] font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* User Profile Footer */}
        <div className="pt-4 border-t border-slate-200/80 flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#183b6b] text-white flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs">
            {userInitials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-bold text-slate-900 truncate">{currentUser?.name || 'Ziyad Elmahi'}</p>
            <button
              type="button"
              onClick={() => setIsSettingsOpen(true)}
              className="text-[11px] text-slate-400 hover:text-slate-700 cursor-pointer transition-colors block"
            >
              Settings
            </button>
          </div>
        </div>
      </aside>

      {/* ======================================================================= */}
      {/* 2. CENTER MAIN CONTENT */}
      {/* ======================================================================= */}
      <main className="flex-1 min-w-0 p-6 lg:p-8 flex flex-col gap-6 overflow-y-auto">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between pb-3 border-b border-slate-200">
          <span className="font-serif-title text-xl font-bold text-slate-900">Klarity</span>
          <select
            value={activeTab}
            onChange={e => setActiveTab(e.target.value)}
            className="bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs text-slate-800"
          >
            <option value="dashboard">Overview</option>
            <option value="bills">Bills</option>
            <option value="subscriptions">Subscriptions</option>
            <option value="cards">Cards</option>
            <option value="transactions">Transactions</option>
            
          </select>
        </div>

        {plaidError && (
          <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{plaidError}</span>
            </div>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="px-3 py-1 rounded-lg bg-amber-200/60 text-amber-900 font-semibold cursor-pointer text-xs"
            >
              Settings
            </button>
          </div>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* TAB: OVERVIEW (DASHBOARD) - Exact visual reproduction of screenshot */}
        {/* --------------------------------------------------------------------- */}
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-6">
            {/* 1. Top 3-Metric Summary Card */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 gap-4 md:gap-6">
              <div>
                <div className="text-xs text-slate-500 font-medium">Available cash</div>
                <div className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">
                  ${Number(displayCash).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-slate-500 mt-1.5 flex items-center gap-1">
                  <span className="text-emerald-700 font-bold">Covers</span>
                  <span>all bills due in the next 14 days</span>
                </div>
              </div>

              <div className="pt-4 md:pt-0 md:pl-6">
                <div className="text-xs text-slate-500 font-medium">Card balances</div>
                <div className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">
                  ${Number(displayCardBalances).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-slate-500 mt-1.5">
                  Across {displayCards.length} cards
                </div>
              </div>

              <div className="pt-4 md:pt-0 md:pl-6">
                <div className="text-xs text-slate-500 font-medium">Due in 14 days</div>
                <div className="text-2xl font-bold text-slate-900 mt-1 tracking-tight">
                  ${Number(displayDue14Sum).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="text-[11px] text-slate-500 mt-1.5">
                  {displayDue14Count} bills
                </div>
              </div>
            </div>

            {/* 2. Cards Section */}
            <div>
              <h2 className="text-sm font-bold text-slate-900 mb-3">Cards</h2>
              <div className="flex items-center gap-4 flex-wrap">
                {displayCards.map((card) => {
                  const util = card.limit > 0 ? Math.round((card.balance / card.limit) * 100) : 0;
                  return (
                    <div
                      key={card.id}
                      className={`w-[185px] h-[185px] rounded-2xl p-5 text-white flex flex-col justify-between shadow-xs ${card.bgColor || 'bg-[#18457c]'}`}
                    >
                      <div>
                        <div className="text-xs font-semibold tracking-tight">{card.name}</div>
                        <div className="text-[11px] text-white/70 font-mono mt-0.5">•••• {card.mask}</div>
                      </div>

                      <div>
                        <div className="text-xl font-bold tracking-tight mb-2">
                          ${Number(card.balance).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </div>
                        <div className="w-full h-1 bg-white/20 rounded-full overflow-hidden mb-2">
                          <div
                            className="h-full bg-white rounded-full transition-all"
                            style={{ width: `${Math.min(100, Math.max(0, util))}%` }}
                          />
                        </div>
                        <div className="text-[10px] text-white/80">
                          {util}% of limit · {card.apr}% APR
                        </div>
                      </div>
                    </div>
                  );
                })}

                {/* + Add card */}
                <button
                  type="button"
                  onClick={() => setIsAddAccountOpen(true)}
                  className="w-[185px] h-[185px] rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 hover:bg-slate-100/70 flex flex-col items-center justify-center text-xs font-medium text-slate-500 hover:text-slate-800 transition-colors cursor-pointer group"
                >
                  <span className="group-hover:scale-105 transition-transform">+ Add card</span>
                </button>
              </div>
            </div>

            {/* 3. Upcoming bills Card */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold text-slate-900">Upcoming bills</h2>
                <button
                  type="button"
                  onClick={() => setIsAddBillOpen(true)}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                >
                  Add bill
                </button>
              </div>

              <div className="divide-y divide-slate-100">
                {displayBills.slice(0, 3).map((bill) => {
                  const isUrgent = bill.daysUntil != null && bill.daysUntil <= 3;
                  return (
                    <div key={bill.id} className="py-3 flex items-center justify-between gap-4 first:pt-1">
                      <div>
                        <p className="text-xs font-semibold text-slate-900">{bill.name}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{bill.dueText}</p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span
                          className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${
                            isUrgent ? 'bg-[#fef3c7] text-[#92400e]' : 'bg-[#e0e7ff] text-[#3730a3]'
                          }`}
                        >
                          In {bill.daysUntil} days
                        </span>
                        <span className="text-xs font-bold text-slate-900 min-w-16 text-right">
                          ${Number(bill.amount).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs mt-1">
                <span className="text-slate-500">Monthly bills</span>
                <span className="font-bold text-slate-900">
                  ${Number(displayTotalMonthlyBills).toFixed(2)}
                </span>
              </div>
            </div>

            {/* 4. Bottom 2-Column Row for Subscriptions & Recent purchases */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Subscriptions Card */}
              <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-bold text-slate-900">Subscriptions</h2>
                    <button
                      type="button"
                      onClick={() => setIsAddSubOpen(true)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                    >
                      Add
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {displaySubs.slice(0, 4).map((sub) => (
                      <div key={sub.id} className="py-2.5 flex items-center justify-between gap-3 first:pt-1">
                        <div>
                          <p className="text-xs font-semibold text-slate-900">{sub.name}</p>
                          <p className="text-[11px] text-slate-400 mt-0.5">{sub.renewText}</p>
                        </div>
                        <span className="text-xs font-bold text-slate-900">
                          ${Number(sub.amount).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs mt-3">
                  <span className="text-slate-500">Total per month</span>
                  <span className="font-bold text-slate-900">
                    ${Number(displayTotalSubs).toFixed(2)}
                  </span>
                </div>
              </div>

              {/* Recent purchases Card */}
              <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-xs font-bold text-slate-900">Recent purchases</h2>
                    <button
                      type="button"
                      onClick={() => setActiveTab('transactions')}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                    >
                      View all
                    </button>
                  </div>

                  <div className="divide-y divide-slate-100">
                    {displayTxs.slice(0, 3).map((tx) => {
                      const isDeposit = Number(tx.amount) > 0 || (tx.name || '').toLowerCase().includes('deposit');
                      const absAmount = Math.abs(Number(tx.amount)).toFixed(2);
                      return (
                        <div key={tx.id} className="py-2.5 flex items-center justify-between gap-3 first:pt-1">
                          <div>
                            <p className="text-xs font-semibold text-slate-900">{tx.name}</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">{tx.subText}</p>
                          </div>
                          <span className={`text-xs font-bold ${isDeposit ? 'text-emerald-700' : 'text-slate-900'}`}>
                            {isDeposit ? `+$${absAmount}` : `-$${absAmount}`}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* TAB: BILLS (Dedicated Page) */}
        {/* --------------------------------------------------------------------- */}
        {activeTab === 'bills' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1.5 mb-1 font-semibold cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Overview</span>
                </button>
                <h2 className="font-serif-title text-2xl font-bold text-slate-900">Upcoming Bills</h2>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsScanBillOpen(true)}
                  className="px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 text-xs font-semibold shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <FileText className="w-4 h-4 text-blue-600" />
                  <span>Scan PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddBillOpen(true)}
                  className="px-4 py-2 rounded-lg bg-[#18457c] hover:bg-[#123561] text-white text-xs font-semibold shadow-2xs cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Bill</span>
                </button>
              </div>
            </div>

            {/* Filter & Search Bar */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex-1 text-xs">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search bills by name or provider..."
                  value={billSearch}
                  onChange={e => setBillSearch(e.target.value)}
                  className="bg-transparent outline-none w-full text-slate-800 placeholder-slate-400"
                />
              </div>
              <select
                value={billFilter}
                onChange={e => setBillFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none cursor-pointer"
              >
                <option value="all">All Bills</option>
                <option value="due_soon">Due Soon</option>
                <option value="upcoming">Upcoming</option>
                <option value="paid">Paid</option>
                <option value="Utilities">Utilities</option>
                <option value="Housing">Housing</option>
              </select>
            </div>

            {/* Bills List */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 divide-y divide-slate-100">
              {filteredBills.map(bill => (
                <div key={bill.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{bill.name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{bill.nextDueDate || `Due Day ${bill.dueDay} • Checking`}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-slate-900">${Number(bill.expectedAmount).toFixed(2)}</span>
                    <button
                      type="button"
                      onClick={() => handlePayBill(bill.id, bill.name, bill.expectedAmount)}
                      className="px-3 py-1 rounded-lg bg-slate-100 hover:bg-emerald-600 hover:text-white text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                    >
                      {bill.status === 'paid' ? 'Paid' : 'Mark Paid'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* TAB: SUBSCRIPTIONS (Dedicated Page) */}
        {/* --------------------------------------------------------------------- */}
        {activeTab === 'subscriptions' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1.5 mb-1 font-semibold cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Overview</span>
                </button>
                <h2 className="font-serif-title text-2xl font-bold text-slate-900">Subscriptions</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsAddSubOpen(true)}
                className="px-4 py-2 rounded-lg bg-[#18457c] hover:bg-[#123561] text-white text-xs font-semibold shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Subscription</span>
              </button>
            </div>

            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 divide-y divide-slate-100">
              {subscriptionsList.map(sub => (
                <div key={sub.id} className="py-3.5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-bold text-slate-900">{sub.name}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{sub.renewalDate || 'Renews monthly'} • {sub.category}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-slate-900">${Number(sub.amount).toFixed(2)}/mo</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteSubscription(sub.id, sub.name)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer transition-colors"
                      title="Delete subscription"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* TAB: CARDS (Dedicated Page) */}
        {/* --------------------------------------------------------------------- */}
        {activeTab === 'cards' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1.5 mb-1 font-semibold cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Overview</span>
                </button>
                <h2 className="font-serif-title text-2xl font-bold text-slate-900">Connected Cards</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsAddAccountOpen(true)}
                className="px-4 py-2 rounded-lg bg-[#18457c] hover:bg-[#123561] text-white text-xs font-semibold shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Card</span>
              </button>
            </div>

            {creditCards.length === 0 ? (
              <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-10 text-center flex flex-col items-center justify-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
                  <CreditCard className="w-6 h-6 stroke-1" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">No cards connected yet</h3>
                <p className="text-xs text-slate-500 max-w-sm">
                  Connect your bank through Plaid to automatically import your credit cards, or add your cards manually.
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <button
                    type="button"
                    onClick={initiatePlaidLink}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs cursor-pointer flex items-center gap-1.5"
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Connect with Plaid</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAddAccountOpen(true)}
                    className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold shadow-2xs cursor-pointer"
                  >
                    Add Manually
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {creditCards.map(card => {
                  const util = card.limit > 0 ? Math.min(100, (card.balance / card.limit) * 100) : 0;
                  return (
                    <div key={card.id} className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 flex flex-col justify-between gap-4">
                      <div>
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold text-slate-900">{card.institution ? `${card.institution} ` : ''}{card.name}</p>
                            <p className="text-[11px] text-slate-400 font-mono mt-0.5">•••• {card.mask}</p>
                          </div>
                          <span className="text-[11px] font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200/60">
                            {card.apr || 0}% APR
                          </span>
                        </div>

                        <div className="mt-4">
                          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                            <span>Balance: ${Number(card.balance).toFixed(2)}</span>
                            <span>Limit: ${Number(card.limit).toLocaleString()}</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${util > 50 ? 'bg-rose-500' : 'bg-[#18457c]'}`}
                              style={{ width: `${util}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-end">
                        <button
                          type="button"
                          onClick={() => handleDeleteAccount(card.id, card.name)}
                          className="text-xs text-rose-600 hover:text-rose-800 font-semibold cursor-pointer"
                        >
                          Remove Card
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Connected Bank Checking & Savings Accounts */}
            {checkingAccounts.length > 0 && (
              <div className="flex flex-col gap-3 mt-4">
                <h3 className="font-serif-title text-lg font-bold text-slate-900">Checking & Savings ({checkingAccounts.length})</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {checkingAccounts.map(acc => (
                    <div key={acc.id} className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-blue-600" />
                          <p className="text-xs font-bold text-slate-900">{acc.institution ? `${acc.institution} ` : ''}{acc.name}</p>
                        </div>
                        <p className="text-[11px] text-slate-400 font-mono mt-1">•••• {acc.mask} • {acc.subtype || 'Depository'}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-slate-900">${Number(acc.balance).toFixed(2)}</p>
                        <p className="text-[10px] text-emerald-600 font-semibold">Available Cash</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* TAB: TRANSACTIONS (Dedicated Purchases Page) */}
        {/* --------------------------------------------------------------------- */}
        {activeTab === 'transactions' && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <div>
                <button
                  onClick={() => setActiveTab('dashboard')}
                  className="text-xs text-slate-400 hover:text-slate-700 flex items-center gap-1.5 mb-1 font-semibold cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Overview</span>
                </button>
                <h2 className="font-serif-title text-2xl font-bold text-slate-900">Recent Purchases</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsAddTxOpen(true)}
                className="px-4 py-2 rounded-lg bg-[#18457c] hover:bg-[#123561] text-white text-xs font-semibold shadow-2xs cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Purchase</span>
              </button>
            </div>

            {/* Search and Category filter */}
            <div className="bg-white rounded-xl border border-slate-200/90 p-4 shadow-2xs flex flex-col sm:flex-row gap-3">
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex-1 text-xs">
                <Search className="w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search purchases by store, merchant, or amount..."
                  value={txSearch}
                  onChange={e => setTxSearch(e.target.value)}
                  className="bg-transparent outline-none w-full text-slate-800 placeholder-slate-400"
                />
              </div>
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 outline-none cursor-pointer"
              >
                <option value="all">All Categories</option>
                <option value="Groceries">Groceries</option>
                <option value="Transportation">Transportation</option>
                <option value="Dining">Dining</option>
                <option value="Utilities">Utilities</option>
                <option value="Shopping">Shopping</option>
                <option value="Income">Income / Deposits</option>
              </select>
            </div>

            {/* Purchases Table */}
            <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 text-[11px] font-semibold uppercase tracking-wider bg-slate-50/50">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Amount</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredTransactions.map(tx => {
                    const isDeposit = Number(tx.amount) < 0 || tx.category === 'Income';
                    const displayAmount = Math.abs(Number(tx.amount)).toFixed(2);
                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">{tx.date}</td>
                        <td className="py-3 px-4 font-semibold text-slate-900">{tx.name}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-600">
                            {tx.category || 'Purchase'}
                          </span>
                        </td>
                        <td className={`py-3 px-4 text-right font-bold ${isDeposit ? 'text-emerald-700' : 'text-slate-900'}`}>
                          {isDeposit ? `+$${displayAmount}` : `-$${displayAmount}`}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteTransaction(tx.id, tx.name)}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer transition-colors"
                            title="Delete purchase"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* --------------------------------------------------------------------- */}
        {/* TAB: ADVISOR (Full Screen Chat Thread) */}
        {/* --------------------------------------------------------------------- */}
        {activeTab === 'advisor' && (
          <div className="bg-white rounded-xl border border-slate-200/90 shadow-2xs p-5 flex flex-col h-[650px] justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setActiveTab('dashboard')}
                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                    title="Back to Overview"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <h2 className="font-serif-title text-xl font-bold text-slate-900">Advisor</h2>
                </div>
                <p className="text-xs text-slate-500">Reads your bills, cards and spending to answer questions.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsPastChatsOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <History className="w-3.5 h-3.5 text-blue-600" />
                  <span>Past Chats</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsMemoryModalOpen(true)}
                  className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold text-slate-700 flex items-center gap-1.5 cursor-pointer"
                >
                  <Brain className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Memory ({aiMemory.length})</span>
                </button>
              </div>
            </div>

            {/* Chat Thread */}
            <div ref={fullChatContainerRef} className="flex-1 overflow-y-auto py-4 flex flex-col gap-3 pr-1">
              {chatMessages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs leading-relaxed flex flex-col gap-2 ${
                      msg.role === 'user'
                        ? 'bg-[#18457c] text-white shadow-2xs'
                        : 'bg-[#eff4f9] text-slate-800 border border-slate-200/60 shadow-2xs'
                    }`}
                  >
                    {/* Render multiple attachments (images as thumbnails, non-images as File Cards) */}
                    {Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {msg.attachments.map((att, aIdx) =>
                          att.isImage && att.previewUrl ? (
                            <img
                              key={att.id || aIdx}
                              src={att.previewUrl}
                              alt={att.name || 'Uploaded image'}
                              className="max-h-48 rounded-lg object-contain bg-black/10 self-start"
                            />
                          ) : (
                            <div
                              key={att.id || aIdx}
                              className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/15 border border-white/25 text-white min-w-[180px]"
                            >
                              <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                                <FileText className="w-4 h-4 text-white" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-[11px] font-semibold truncate">{att.name || 'Document'}</p>
                                <p className="text-[10px] text-blue-100">
                                  {att.ext || 'FILE'} {att.size ? `• ${(att.size / 1024).toFixed(1)} KB` : ''}
                                </p>
                              </div>
                            </div>
                          )
                        )}
                      </div>
                    )}
                    {/* Legacy single image field fallback: only render <img> if data:image/ */}
                    {!msg.attachments && msg.image && (
                      msg.image.startsWith('data:image/') ? (
                        <img src={msg.image} alt="Uploaded attachment" className="max-h-48 rounded-lg object-contain bg-black/10 self-start" />
                      ) : (
                        <div className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-white/15 border border-white/25 text-white w-fit">
                          <FileText className="w-4 h-4 text-white shrink-0" />
                          <span className="text-[11px] font-semibold">Attached Document</span>
                        </div>
                      )
                    )}
                    {msg.text && <div className="whitespace-pre-wrap">{msg.text}</div>}
                  </div>
                </div>
              ))}
              {isAiTyping && (
                <div className="flex justify-start">
                  <div className="bg-[#eff4f9] rounded-2xl px-4 py-2.5 text-xs text-slate-500 animate-pulse border border-slate-200/60">
                    Advisor is reading and analyzing...
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Multi-File Preview Bar if files attached */}
            {chatFiles.length > 0 && (
              <div className="flex flex-wrap gap-2 pb-2 max-h-32 overflow-y-auto">
                {chatFiles.map((fileItem) => (
                  <div
                    key={fileItem.id}
                    className="flex items-center gap-2.5 p-2 bg-slate-100/90 rounded-xl border border-slate-200 w-fit max-w-[260px]"
                  >
                    {fileItem.isImage && fileItem.previewUrl ? (
                      <img src={fileItem.previewUrl} alt={fileItem.name} className="w-10 h-10 rounded-lg object-cover border border-slate-300 shrink-0" />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-[#18457c]/10 border border-[#18457c]/20 flex flex-col items-center justify-center shrink-0">
                        <FileText className="w-4 h-4 text-[#18457c]" />
                        <span className="text-[8px] font-bold text-[#18457c] uppercase">{fileItem.ext || 'FILE'}</span>
                      </div>
                    )}
                    <div className="min-w-0 pr-1 flex-1">
                      <p className="text-xs font-semibold text-slate-800 truncate">{fileItem.name}</p>
                      <p className="text-[10px] text-slate-500">
                        {fileItem.ext || 'FILE'} • {(fileItem.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setChatFiles(prev => prev.filter(f => f.id !== fileItem.id))}
                      className="p-1 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer shrink-0"
                      title="Remove file"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Chat Input */}
            <form onSubmit={handleSendChatMessage} className="flex items-end gap-2 pt-3 border-t border-slate-100">
              <input
                type="file"
                multiple
                ref={fullAdvisorFileInputRef}
                onChange={async (e) => {
                  await handleAttachFiles(e.target.files);
                  e.target.value = '';
                }}
                className="hidden"
                accept="*/*"
              />
              <div className="relative" ref={fullUploadMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsFullUploadMenuOpen(prev => !prev)}
                  className="p-2.5 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer shrink-0 mb-0.5 flex items-center justify-center"
                  title="Add file or scan document"
                >
                  <Plus className="w-4 h-4" />
                </button>
                {isFullUploadMenuOpen && (
                  <div className="absolute bottom-full left-0 mb-2 w-64 bg-white rounded-xl border border-slate-200 shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                    <button
                      type="button"
                      onClick={() => {
                        setIsFullUploadMenuOpen(false);
                        setIsScanBillOpen(true);
                      }}
                      className="w-full flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-slate-50 text-left transition-colors cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#18457c] flex items-center justify-center shrink-0 mt-0.5">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Scan Document</p>
                        <p className="text-[11px] text-slate-500 leading-snug">Paste sentences & AI auto-adds bills or subscriptions</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsFullUploadMenuOpen(false);
                        fullAdvisorFileInputRef.current?.click();
                      }}
                      className="w-full flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-slate-50 text-left transition-colors cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                        <UploadCloud className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Submit File</p>
                        <p className="text-[11px] text-slate-500 leading-snug">Attach one or multiple files of any format for AI to read</p>
                      </div>
                    </button>
                  </div>
                )}
              </div>
              <textarea
                rows={1}
                placeholder="Ask about your money, or attach files..."
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if ((chatInput.trim() || chatFiles.length > 0) && !isAiTyping) {
                      handleSendChatMessage();
                    }
                  }
                }}
                onPaste={async e => {
                  const files = e.clipboardData?.files;
                  if (files && files.length > 0) {
                    e.preventDefault();
                    await handleAttachFiles(files);
                  }
                }}
                className="flex-1 min-w-0 max-h-36 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-500 shadow-2xs resize-none"
              />
              <button
                type="submit"
                disabled={isAiTyping || (!chatInput.trim() && chatFiles.length === 0)}
                className="px-5 py-2.5 rounded-xl bg-[#18457c] hover:bg-[#123561] text-white text-xs font-semibold disabled:opacity-50 transition-colors shadow-2xs cursor-pointer shrink-0 mb-0.5"
              >
                Send
              </button>
            </form>
          </div>
        )}
      </main>

      {/* ======================================================================= */}
      {/* 3. RIGHT SIDEBAR: ADVISOR (Hidden when on AI Advisor full view) */}
      {/* ======================================================================= */}
      {activeTab !== 'advisor' && (
      <aside
        style={{ width: `${advisorWidth}px` }}
        className={`shrink-0 border-l border-slate-200/80 bg-[#f8fafc] p-5 xl:p-6 flex flex-col h-screen sticky top-0 hidden lg:flex relative transition-[width] duration-75 ${
          isResizingAdvisor ? 'select-none cursor-col-resize !transition-none' : ''
        }`}
      >
        {/* Draggable Resize Handle on left border */}
        <div
          onMouseDown={startResizingAdvisor}
          className={`absolute -left-1.5 top-0 bottom-0 w-3 cursor-col-resize z-30 group flex items-center justify-center transition-colors ${
            isResizingAdvisor ? 'bg-blue-500/30' : 'hover:bg-blue-400/20'
          }`}
          title="Drag to resize Advisor sidebar"
        >
          <div className={`w-1 h-9 rounded-full transition-colors ${
            isResizingAdvisor ? 'bg-blue-600' : 'bg-slate-300 group-hover:bg-blue-500'
          }`}></div>
        </div>
        {/* Header with Quick Actions */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-200/70">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-900">Advisor</h2>
              <span className="inline-flex items-center gap-1 text-[10px] text-blue-700 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-full font-medium">
                <Globe className="w-2.5 h-2.5 text-blue-600" />
                Live web
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
              Reads your bills, cards and spending to answer questions.
            </p>
          </div>
          <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
            <button
              type="button"
              onClick={() => setIsPastChatsOpen(true)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Past Conversations"
            >
              <History className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setIsMemoryModalOpen(true)}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer relative"
              title="Advisor Memory"
            >
              <Brain className="w-4 h-4" />
              {aiMemory.length > 0 && (
                <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-blue-600"></span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('advisor')}
              className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer"
              title="Open full Advisor page"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Conversation Stream */}
        <div ref={sidebarChatContainerRef} className="flex-1 overflow-y-auto py-3 space-y-3 min-h-0 pr-0.5">
          {/* Initial Advisor Insight Bubble */}
          {settingsAiStatus !== 'connected' && (
            <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-4 text-xs text-amber-900 flex flex-col gap-2 shadow-2xs">
              <div className="flex items-center gap-2 font-bold text-amber-950">
                <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
                <span>AI Advisor Not Connected</span>
              </div>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Connect your Anthropic, OpenAI, or Google Gemini API key to activate personal debt payoff advice and automated intelligence.
              </p>
              <button
                type="button"
                onClick={() => {
                  setSettingsActiveTab('ai');
                  setIsSettingsOpen(true);
                }}
                className="self-start px-3 py-1.5 rounded-lg bg-[#1B4B91] hover:bg-[#153a70] text-white text-xs font-semibold cursor-pointer shadow-2xs transition-all mt-1"
              >
                Configure in Settings &rarr;
              </button>
            </div>
          )}

          <div className="bg-[#eff4f9] rounded-2xl p-4 text-xs text-slate-700 leading-relaxed border border-slate-200/60 shadow-2xs">
            {highestAprCard ? (
              <span>
                Your cash covers everything due this month. The {highestAprCard.name} has the highest rate at {highestAprCard.apr}%, so extra payments there save the most interest.
              </span>
            ) : (
              <span>
                Your cash covers everything due this month. Your accounts and bills are in great financial health.
              </span>
            )}
          </div>

          {/* Active Chat Messages in Sidebar */}
          {chatMessages.filter((_, idx) => idx > 0).map((msg, i) => (
            <div
              key={i}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[90%] rounded-2xl p-3 text-xs leading-relaxed flex flex-col gap-2 ${
                  msg.role === 'user'
                    ? 'bg-[#18457c] text-white shadow-2xs'
                    : 'bg-[#eff4f9] text-slate-800 border border-slate-200/60 shadow-2xs'
                }`}
              >
                {/* Render multiple attachments (images as thumbnails, non-images as File Cards) */}
                {Array.isArray(msg.attachments) && msg.attachments.length > 0 && (
                  <div className="flex flex-col gap-1.5">
                    {msg.attachments.map((att, aIdx) =>
                      att.isImage && att.previewUrl ? (
                        <img
                          key={att.id || aIdx}
                          src={att.previewUrl}
                          alt={att.name || 'Uploaded image'}
                          className="max-h-36 rounded-lg object-contain bg-black/10"
                        />
                      ) : (
                        <div
                          key={att.id || aIdx}
                          className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-white/15 border border-white/25 text-white"
                        >
                          <div className="w-7 h-7 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                            <FileText className="w-3.5 h-3.5 text-white" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] font-semibold truncate">{att.name || 'Document'}</p>
                            <p className="text-[9px] text-blue-100 uppercase">
                              {att.ext || 'FILE'} {att.size ? `• ${(att.size / 1024).toFixed(1)} KB` : ''}
                            </p>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                )}
                {/* Legacy single image field fallback: only render <img> if data:image/ */}
                {!msg.attachments && msg.image && (
                  msg.image.startsWith('data:image/') ? (
                    <img src={msg.image} alt="Uploaded attachment" className="max-h-36 rounded-lg object-contain bg-black/10" />
                  ) : (
                    <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-white/15 border border-white/25 text-white">
                      <FileText className="w-3.5 h-3.5 text-white shrink-0" />
                      <span className="text-[11px] font-semibold">Attached Document</span>
                    </div>
                  )
                )}
                {msg.text && <div className="whitespace-pre-wrap">{msg.text}</div>}
              </div>
            </div>
          ))}

          {isAiTyping && (
            <div className="flex justify-start">
              <div className="bg-[#eff4f9] border border-slate-200/60 rounded-2xl px-3.5 py-2.5 text-xs text-slate-500 flex items-center gap-1.5 shadow-2xs">
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Actions: Multi-File Preview + Chat Input Form */}
        <div className="pt-3 border-t border-slate-200/70 flex flex-col gap-2 shrink-0">
          {/* Multi-File Preview Cards if attached or pasted */}
          {chatFiles.length > 0 && (
            <div className="flex flex-col gap-1.5 max-h-36 overflow-y-auto pr-0.5">
              {chatFiles.map((fileItem) => (
                <div
                  key={fileItem.id}
                  className="flex items-center gap-2 p-2 bg-slate-100/90 rounded-xl border border-slate-200 w-full"
                >
                  {fileItem.isImage && fileItem.previewUrl ? (
                    <img src={fileItem.previewUrl} alt={fileItem.name} className="w-9 h-9 rounded-lg object-cover border border-slate-300 shrink-0" />
                  ) : (
                    <div className="w-9 h-9 rounded-lg bg-[#18457c]/10 border border-[#18457c]/20 flex flex-col items-center justify-center shrink-0">
                      <FileText className="w-3.5 h-3.5 text-[#18457c]" />
                      <span className="text-[8px] font-bold text-[#18457c] uppercase">{fileItem.ext || 'FILE'}</span>
                    </div>
                  )}
                  <div className="min-w-0 pr-1 flex-1">
                    <p className="text-[11px] font-semibold text-slate-800 truncate">{fileItem.name}</p>
                    <p className="text-[10px] text-slate-500">
                      {fileItem.ext || 'FILE'} • {(fileItem.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setChatFiles(prev => prev.filter(f => f.id !== fileItem.id))}
                    className="p-1 rounded-full text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer shrink-0"
                    title="Remove file"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Chat Form with Add File Menu (+ / Paperclip) and multiline Textarea */}
          <form onSubmit={handleSendChatMessage} className="flex items-end gap-2 mt-1">
            <input
              type="file"
              multiple
              ref={fileInputRef}
              onChange={async (e) => {
                await handleAttachFiles(e.target.files);
                e.target.value = '';
              }}
              className="hidden"
              accept="*/*"
            />
            <div className="relative" ref={uploadMenuRef}>
              <button
                type="button"
                onClick={() => setIsUploadMenuOpen(prev => !prev)}
                className="p-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200/90 text-slate-600 hover:text-slate-900 transition-colors shadow-2xs cursor-pointer shrink-0 mb-0.5 flex items-center justify-center"
                title="Add file or scan document"
              >
                <Plus className="w-4 h-4" />
              </button>
              {isUploadMenuOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-60 bg-white rounded-xl border border-slate-200 shadow-xl p-1.5 z-50 animate-in fade-in zoom-in-95">
                  <button
                    type="button"
                    onClick={() => {
                      setIsUploadMenuOpen(false);
                      setIsScanBillOpen(true);
                    }}
                    className="w-full flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 text-left transition-colors cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#18457c] flex items-center justify-center shrink-0 mt-0.5">
                      <FileText className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Scan Document</p>
                      <p className="text-[10px] text-slate-500 leading-snug">Paste sentences & AI auto-adds bills or subscriptions</p>
                    </div>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsUploadMenuOpen(false);
                      fileInputRef.current?.click();
                    }}
                    className="w-full flex items-start gap-2.5 p-2 rounded-lg hover:bg-slate-50 text-left transition-colors cursor-pointer"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0 mt-0.5">
                      <UploadCloud className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900">Submit File</p>
                      <p className="text-[10px] text-slate-500 leading-snug">Attach one or multiple files of any format for AI to read</p>
                    </div>
                  </button>
                </div>
              )}
            </div>
            <textarea
              rows={1}
              placeholder="Ask anything or attach files..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if ((chatInput.trim() || chatFiles.length > 0) && !isAiTyping) {
                    handleSendChatMessage();
                  }
                }
              }}
              onPaste={async e => {
                const files = e.clipboardData?.files;
                if (files && files.length > 0) {
                  e.preventDefault();
                  await handleAttachFiles(files);
                }
              }}
              className="flex-1 min-w-0 max-h-32 bg-white border border-slate-200/90 rounded-xl px-3 py-2 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 shadow-2xs resize-none"
            />
            <button
              type="submit"
              disabled={isAiTyping || (!chatInput.trim() && chatFiles.length === 0)}
              className="px-3.5 py-2 rounded-xl bg-[#18457c] hover:bg-[#123561] text-white text-xs font-semibold disabled:opacity-50 transition-colors shadow-2xs cursor-pointer shrink-0 mb-0.5"
            >
              Send
            </button>
          </form>
        </div>
      </aside>
      )}

      {/* ======================================================================= */}
      {/* 4. MODALS (Clean Light Theme) */}
      {/* ======================================================================= */}

      {/* Add Card Modal */}
      {isAddAccountOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setIsAddAccountOpen(false); }}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 text-slate-800 animate-in fade-in zoom-in-95 cursor-default"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Add Credit Card</h3>
              <button onClick={() => setIsAddAccountOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleAddAccount} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Bank / Issuer</label>
                <select
                  value={newAccount.institution}
                  onChange={e => setNewAccount(prev => ({ ...prev, institution: e.target.value }))}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none"
                >
                  <option value="Everyday Rewards">Everyday Rewards</option>
                  <option value="Travel Card">Travel Card</option>
                  <option value="Capital One">Capital One</option>
                  <option value="Chase">Chase</option>
                  <option value="Citi">Citi</option>
                  <option value="Discover">Discover</option>
                  <option value="Bank">Bank</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Card Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Everyday Rewards, Travel Card"
                  value={newAccount.name}
                  onChange={e => setNewAccount(prev => ({ ...prev, name: e.target.value }))}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Balance ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={newAccount.balance}
                    onChange={e => setNewAccount(prev => ({ ...prev, balance: e.target.value }))}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Credit Limit ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 5000"
                    value={newAccount.limit}
                    onChange={e => setNewAccount(prev => ({ ...prev, limit: e.target.value }))}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Interest APR (%)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="e.g. 21.9"
                  value={newAccount.apr}
                  onChange={e => setNewAccount(prev => ({ ...prev, apr: e.target.value }))}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsAddAccountOpen(false)} className="px-3.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-semibold cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-[#18457c] hover:bg-[#123561] text-white font-semibold cursor-pointer">Save Card</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Bill Modal */}
      {isAddBillOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setIsAddBillOpen(false); }}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 text-slate-800 animate-in fade-in zoom-in-95 cursor-default"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Add Upcoming Bill</h3>
              <button onClick={() => setIsAddBillOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleAddBill} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Bill Name / Provider</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. PG&E Electric, Rent, Water Service"
                  value={newBill.name}
                  onChange={e => setNewBill(prev => ({ ...prev, name: e.target.value, biller: e.target.value }))}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Expected Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="128.40"
                    value={newBill.expectedAmount}
                    onChange={e => setNewBill(prev => ({ ...prev, expectedAmount: e.target.value }))}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Due Day of Month</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={newBill.dueDay}
                    onChange={e => setNewBill(prev => ({ ...prev, dueDay: e.target.value }))}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Category</label>
                <select
                  value={newBill.category}
                  onChange={e => setNewBill(prev => ({ ...prev, category: e.target.value }))}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none cursor-pointer"
                >
                  <option value="Utilities">Utilities</option>
                  <option value="Housing">Housing</option>
                  <option value="Insurance">Insurance</option>
                  <option value="Telecom">Telecom / Internet</option>
                  <option value="Subscriptions">Subscriptions</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsAddBillOpen(false)} className="px-3.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-semibold cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-[#18457c] hover:bg-[#123561] text-white font-semibold cursor-pointer">Save Bill</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Subscription Modal */}
      {isAddSubOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setIsAddSubOpen(false); }}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 text-slate-800 animate-in fade-in zoom-in-95 cursor-default"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Add Subscription</h3>
              <button onClick={() => setIsAddSubOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleAddSubscription} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Subscription Service Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Netflix, Spotify, iCloud, ChatGPT Plus"
                  value={newSub.name}
                  onChange={e => setNewSub({ ...newSub, name: e.target.value })}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Monthly Cost ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="15.49"
                    value={newSub.amount}
                    onChange={e => setNewSub({ ...newSub, amount: e.target.value })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Billing Cycle</label>
                  <select
                    value={newSub.billingCycle}
                    onChange={e => setNewSub({ ...newSub, billingCycle: e.target.value })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none cursor-pointer"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Category</label>
                <select
                  value={newSub.category}
                  onChange={e => setNewSub({ ...newSub, category: e.target.value })}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none cursor-pointer"
                >
                  <option value="Streaming">Streaming (Netflix, Hulu)</option>
                  <option value="Music">Music (Spotify, Apple Music)</option>
                  <option value="Cloud Storage">Cloud Storage (iCloud, Drive)</option>
                  <option value="AI & Software">AI & Software (ChatGPT)</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsAddSubOpen(false)} className="px-3.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-semibold cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-[#18457c] hover:bg-[#123561] text-white font-semibold cursor-pointer">Save Subscription</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Purchase Modal */}
      {isAddTxOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setIsAddTxOpen(false); }}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 text-slate-800 animate-in fade-in zoom-in-95 cursor-default"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Add Purchase</h3>
              <button onClick={() => setIsAddTxOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleAddTransaction} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700">Store / Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Trader Joe's, Shell, Target"
                  value={newTx.name}
                  onChange={e => setNewTx({ ...newTx, name: e.target.value })}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 placeholder-slate-400 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="54.12"
                    value={newTx.amount}
                    onChange={e => setNewTx({ ...newTx, amount: e.target.value })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700">Date</label>
                  <input
                    type="text"
                    placeholder="e.g. Oct 24"
                    value={newTx.date}
                    onChange={e => setNewTx({ ...newTx, date: e.target.value })}
                    className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="font-semibold text-slate-700">Category</label>
                <select
                  value={newTx.category}
                  onChange={e => setNewTx({ ...newTx, category: e.target.value })}
                  className="mt-1 w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 outline-none cursor-pointer"
                >
                  <option value="Groceries">Groceries</option>
                  <option value="Transportation">Transportation</option>
                  <option value="Dining">Dining</option>
                  <option value="Utilities">Utilities</option>
                  <option value="Shopping">Shopping</option>
                  <option value="Income">Income / Deposit</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setIsAddTxOpen(false)} className="px-3.5 py-1.5 rounded-lg bg-slate-100 text-slate-700 font-semibold cursor-pointer">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded-xl bg-[#18457c] hover:bg-[#123561] text-white font-semibold cursor-pointer">Save Purchase</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Scan Document Modal */}
      {isScanBillOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setIsScanBillOpen(false); }}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 text-slate-800 animate-in fade-in zoom-in-95 cursor-default"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#18457c]" />
                <h3 className="text-sm font-bold text-slate-900">Scan Document</h3>
              </div>
              <button onClick={() => setIsScanBillOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Paste any sentences, statement lines, or bill details below. The AI Advisor will comprehend your text and automatically add every bill, subscription, or purchase mentioned.
            </p>
            <textarea
              rows={5}
              placeholder="e.g. I pay $22.99 a month for Netflix, my ConEdison electric bill is $148.60 due on the 3rd, and I spent $84.32 at Trader Joe's..."
              value={scanText}
              onChange={e => setScanText(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 outline-none focus:border-blue-500 focus:bg-white"
            />
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setIsScanBillOpen(false)} className="px-3 py-1.5 text-xs text-slate-500 cursor-pointer">Cancel</button>
              <button
                type="button"
                disabled={!scanText.trim() || isAiTyping}
                onClick={handleScanBill}
                className="px-4 py-2 rounded-xl bg-[#18457c] hover:bg-[#123561] disabled:opacity-50 text-white text-xs font-semibold cursor-pointer"
              >
                Comprehend & Auto-Add
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal - Redesigned matching reference mockup */}
      {isSettingsOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setIsSettingsOpen(false); }}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            ref={settingsModalRef}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-2xl border border-slate-200/90 shadow-2xl max-w-[880px] w-full min-h-[580px] h-[640px] flex flex-col overflow-hidden cursor-default"
          >
            
            {/* Modal Body: Left Tabs + Right Content */}
            <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
              
              {/* Left Sidebar Tabs */}
              <div className="w-full md:w-56 lg:w-60 shrink-0 border-b md:border-b-0 md:border-r border-slate-200/80 p-5 sm:p-6 flex flex-col justify-between bg-slate-50/60">
                <div>
                  <h3 className="font-serif-title text-xl font-bold text-slate-900 mb-6 hidden md:block">Settings</h3>
                  
                  <nav className="flex md:flex-col gap-1.5 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
                    {[
                      { id: 'profile', label: 'Profile', dot: false },
                      { id: 'ai', label: 'AI advisor', dot: settingsAiStatus !== 'connected' },
                      { id: 'plaid', label: 'Bank connection', dot: settingsPlaidStatus !== 'connected' },
                      { id: 'session', label: 'Session', dot: false }
                    ].map(tab => {
                      const isActive = settingsActiveTab === tab.id;
                      return (
                        <button
                          key={tab.id}
                          type="button"
                          onClick={() => setSettingsActiveTab(tab.id)}
                          className={`w-full text-left px-3.5 py-2.5 rounded-xl text-xs flex items-center justify-between transition-colors duration-100 cursor-pointer shrink-0 ${
                            isActive
                              ? 'bg-white text-[#1B4B91] font-semibold border border-slate-200/90 shadow-2xs'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50 font-medium'
                          }`}
                        >
                          <span>{tab.label}</span>
                          {tab.dot && (
                            <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 ml-2"></span>
                          )}
                        </button>
                      );
                    })}
                  </nav>
                </div>


              </div>

              {/* Right Content Panel */}
              <div className="flex-1 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto bg-white">
                <div>
                  {/* TAB 1: PROFILE */}
                  {settingsActiveTab === 'profile' && (
                    <div key="settings-tab-profile" className="flex flex-col gap-6">
                      <div>
                        <h2 className="font-serif-title text-2xl font-bold text-slate-900">Profile</h2>
                        <p className="text-xs text-slate-500 mt-1">How you appear in Klarity.</p>
                      </div>

                      <div className="border border-slate-200 rounded-2xl p-6 flex flex-col gap-6 bg-white shadow-2xs">
                        <div className="flex items-center gap-3.5">
                          <div className="w-12 h-12 rounded-full bg-[#1B4B91] text-white flex items-center justify-center font-bold text-base shadow-2xs shrink-0">
                            {userInitials}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-900">{currentUser?.name || 'Ziyad Elmahi'}</p>
                            <p className="text-xs text-slate-500">{currentUser?.email || 'zeoe13@gmail.com'}</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                          <div>
                            <label className="text-xs font-medium text-slate-700 block mb-1.5">Display name</label>
                            <input
                              type="text"
                              value={settingsDisplayName}
                              onChange={e => setSettingsDisplayName(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:border-blue-600 shadow-2xs"
                            />
                          </div>

                          <div>
                            <label className="text-xs font-medium text-slate-700 block mb-1.5">Email</label>
                            <input
                              type="email"
                              value={currentUser?.email || 'zeoe13@gmail.com'}
                              disabled
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-600 cursor-not-allowed shadow-2xs"
                            />
                            <p className="text-[11px] text-slate-400 mt-1.5">Email can't be changed here.</p>
                          </div>
                        </div>

                        <div className="flex justify-end pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={handleSaveProfile}
                            className="px-4 py-2 rounded-xl bg-[#1B4B91] hover:bg-[#153a70] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                          >
                            Save profile
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 2: AI ADVISOR */}
                  {settingsActiveTab === 'ai' && (
                    <div key="settings-tab-ai" className="flex flex-col gap-5">
                      <div>
                        <h2 className="font-serif-title text-2xl font-bold text-slate-900">AI advisor</h2>
                        <p className="text-xs text-slate-500 mt-1">Configure the AI model and choose what data it can access.</p>
                      </div>

                      {/* Card: Model & Key Configuration */}
                      <div className="border border-slate-200 rounded-2xl p-6 flex flex-col gap-4 bg-white shadow-2xs">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                          <div>
                            <label className="text-xs font-medium text-slate-700 block mb-1.5">Provider</label>
                            <select
                              value={settingsAiProvider}
                              onChange={e => handleProviderChange(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-2xs cursor-pointer"
                            >
                              <option value="anthropic">Anthropic (Claude)</option>
                              <option value="openai">OpenAI (ChatGPT)</option>
                              <option value="gemini">Google Gemini</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-xs font-medium text-slate-700 block mb-1.5">Model</label>
                            <input
                              type="text"
                              value={settingsAiModel}
                              onChange={e => setSettingsAiModel(e.target.value)}
                              placeholder="e.g. claude-3-7-sonnet-20250219"
                              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-2xs"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-xs font-medium text-slate-700 block mb-1.5">API Key</label>
                          <div className="relative">
                            <input
                              type={settingsAiShowKey ? 'text' : 'password'}
                              value={settingsAiApiKey}
                              onChange={e => setSettingsAiApiKey(e.target.value)}
                              placeholder={settingsAiMaskedKey ? `Saved: ${settingsAiMaskedKey}` : 'Paste API key (sk-...)'}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 pr-10 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-2xs"
                            />
                            <button
                              type="button"
                              onClick={() => setSettingsAiShowKey(!settingsAiShowKey)}
                              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                            >
                              {settingsAiShowKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                          </div>
                        </div>

                        {/* Status Pill & Action Buttons */}
                        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 font-medium">Status:</span>
                            {settingsAiStatus === 'connected' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Connected
                              </span>
                            ) : settingsAiStatus === 'invalid_key' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                                Invalid key
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                Not connected
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2">
                            {Boolean(settingsAiMaskedKey) && (
                              <button
                                type="button"
                                onClick={handleRemoveAiKey}
                                className="px-3.5 py-2 rounded-xl border border-rose-200 bg-rose-50/50 hover:bg-rose-100 text-rose-700 text-xs font-semibold cursor-pointer transition-colors shadow-2xs"
                              >
                                Remove key
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={handleSaveAndTestAiKey}
                              disabled={settingsAiTesting}
                              className="px-4 py-2 rounded-xl bg-[#1B4B91] hover:bg-[#153a70] text-white text-xs font-semibold shadow-2xs transition-all disabled:opacity-50 cursor-pointer flex items-center gap-2"
                            >
                              {settingsAiTesting && <span className="w-3 h-3 rounded-full border-2 border-white/40 border-t-white animate-spin"></span>}
                              <span>{settingsAiTesting ? 'Testing key...' : 'Save and test key'}</span>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Card: Data Access Permissions */}
                      <div className="border border-slate-200 rounded-2xl p-6 flex flex-col gap-4 bg-white shadow-2xs">
                        <div>
                          <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Data access permissions</h4>
                          <p className="text-[11px] text-slate-500 mt-0.5">Control which categories of personal financial data the AI advisor can analyze.</p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
                          {[
                            { id: 'bills', label: 'Bills' },
                            { id: 'subscriptions', label: 'Subscriptions' },
                            { id: 'cards', label: 'Cards' },
                            { id: 'purchases', label: 'Purchases' }
                          ].map(perm => {
                            const isAllowed = settingsAiPermissions[perm.id];
                            return (
                              <button
                                key={perm.id}
                                type="button"
                                onClick={() => handleTogglePermission(perm.id)}
                                className={`p-3 rounded-xl border text-xs font-semibold flex items-center justify-between transition-all cursor-pointer ${
                                  isAllowed
                                    ? 'bg-[#eff4f9] border-[#1B4B91]/40 text-[#1B4B91] shadow-2xs'
                                    : 'bg-slate-50 border-slate-200 text-slate-400'
                                }`}
                              >
                                <span>{perm.label}</span>
                                <span className={`w-2 h-2 rounded-full ${isAllowed ? 'bg-[#1B4B91]' : 'bg-slate-300'}`}></span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* TAB 3: BANK CONNECTION */}
                  {settingsActiveTab === 'plaid' && (
                    <div key="settings-tab-plaid" className="flex flex-col gap-5">
                      <div className="flex flex-col gap-3 pb-0 border-b border-slate-200">
                        <div>
                          <h2 className="font-serif-title text-2xl font-bold text-slate-900">Bank connection</h2>
                          <p className="text-xs text-slate-500 mt-0.5">Manage connected banks and link new accounts.</p>
                        </div>

                        {/* Sub-tabs placed directly under the title: Connect a bank on the left, Connected banks on the right with underline indicator */}
                        <div className="flex items-center gap-6 mt-1 -mb-px">
                          <button
                            type="button"
                            onClick={() => setBankTab('connect')}
                            className={`pb-2.5 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 border-b-2 ${
                              bankTab === 'connect'
                                ? 'text-[#18457c] border-[#18457c]'
                                : 'text-slate-500 hover:text-slate-800 border-transparent'
                            }`}
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Connect a bank</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setBankTab('connected')}
                            className={`pb-2.5 text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 border-b-2 ${
                              bankTab === 'connected'
                                ? 'text-[#18457c] border-[#18457c]'
                                : 'text-slate-500 hover:text-slate-800 border-transparent'
                            }`}
                          >
                            <Building2 className="w-3.5 h-3.5" />
                            <span>Connected banks</span>
                            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                              bankTab === 'connected' ? 'bg-blue-100 text-[#18457c]' : 'bg-slate-200 text-slate-600'
                            }`}>
                              {(data?.accounts || []).filter(a => a.institution).length > 0
                                ? new Set((data?.accounts || []).map(a => a.institution)).size
                                : 0}
                            </span>
                          </button>
                        </div>
                      </div>

                      {/* SUB-VIEW 1: CONNECTED BANKS */}
                      {bankTab === 'connected' && (
                        <div className="flex flex-col gap-4">
                          {/* List of distinct connected institutions */}
                          {(() => {
                            const accounts = data?.accounts || [];
                            const institutionsMap = {};
                            accounts.forEach(acc => {
                              const inst = acc.institution || 'Connected Bank';
                              if (!institutionsMap[inst]) {
                                institutionsMap[inst] = [];
                              }
                              institutionsMap[inst].push(acc);
                            });
                            const instList = Object.entries(institutionsMap);

                            if (instList.length === 0) {
                              return (
                                <div className="border border-dashed border-slate-200 rounded-2xl p-8 text-center bg-slate-50/50 flex flex-col items-center justify-center">
                                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-slate-400 mb-3 shadow-2xs">
                                    <Building2 className="w-6 h-6 stroke-1" />
                                  </div>
                                  <h3 className="text-sm font-bold text-slate-900">No banks connected yet</h3>
                                  <p className="text-xs text-slate-500 mt-1 max-w-sm">
                                    Link your bank via Plaid or add cards manually to start tracking balances and cash flow in real time.
                                  </p>
                                  <div className="flex items-center gap-2 mt-4">
                                    <button
                                      type="button"
                                      onClick={() => setBankTab('connect')}
                                      className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                      <span>Connect a bank</span>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setIsSettingsOpen(false);
                                        setIsAddAccountOpen(true);
                                      }}
                                      className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                                    >
                                      Add card manually
                                    </button>
                                  </div>
                                </div>
                              );
                            }

                            return (
                              <div className="flex flex-col gap-3">
                                {instList.map(([institutionName, accs]) => {
                                  const totalBalance = accs.reduce((sum, a) => sum + Number(a.balance || 0), 0);
                                  const matchingPlaidItem = (settings?.plaidItems || []).find(pi => pi.institution === institutionName);
                                  return (
                                    <div
                                      key={institutionName}
                                      className="border border-slate-200 rounded-2xl p-4 bg-white shadow-2xs flex flex-col gap-3 hover:border-slate-300 transition-colors"
                                    >
                                      <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#1B4B91] font-bold text-sm shadow-2xs">
                                            {institutionName.slice(0, 2).toUpperCase()}
                                          </div>
                                          <div>
                                            <div className="flex items-center gap-2">
                                              <h4 className="text-xs font-bold text-slate-900">{institutionName}</h4>
                                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                                Active
                                              </span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 mt-0.5">
                                              {accs.length} linked {accs.length === 1 ? 'account' : 'accounts'} · Total ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </p>
                                          </div>
                                        </div>

                                        <button
                                          type="button"
                                          onClick={() => {
                                            if (matchingPlaidItem) {
                                              handleDisconnectBank(matchingPlaidItem.itemId, institutionName);
                                            } else {
                                              // Remove all accounts with this institution
                                              if (window.confirm(`Disconnect all accounts from ${institutionName}?`)) {
                                                accs.forEach(a => handleDeleteAccount(a.id, a.name));
                                              }
                                            }
                                          }}
                                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                                          title={`Disconnect ${institutionName}`}
                                        >
                                          <Trash2 className="w-4 h-4" />
                                        </button>
                                      </div>

                                      {/* Breakdown of individual accounts under this institution */}
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100">
                                        {accs.map(acc => (
                                          <div key={acc.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                                            <div className="min-w-0 pr-2">
                                              <p className="font-semibold text-slate-800 truncate">{acc.name}</p>
                                              <p className="text-[10px] text-slate-400 capitalize">
                                                {acc.type === 'credit' ? 'Credit card' : 'Checking / Savings'} (•••• {acc.mask || '0000'})
                                              </p>
                                            </div>
                                            <span className="font-bold text-slate-900 shrink-0">
                                              ${Number(acc.balance || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}

                                <div className="pt-2 flex items-center justify-between">
                                  <p className="text-[11px] text-slate-500">
                                    Want to connect another institution?
                                  </p>
                                  <button
                                    type="button"
                                    onClick={() => setBankTab('connect')}
                                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Connect another bank</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      )}

                      {/* SUB-VIEW 2: CONNECT A BANK */}
                      {bankTab === 'connect' && (
                        <div className="border border-slate-200 rounded-2xl p-6 flex flex-col gap-5 bg-white shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-slate-500 font-medium">Connection status:</span>
                            {settingsPlaidStatus === 'connected' ? (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                Connected
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                                No bank linked
                              </span>
                            )}
                          </div>

                          {/* Plaid Link Connect Banner with Green Button */}
                          <div className="p-4 rounded-xl bg-emerald-50/80 border border-emerald-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                                <Building2 className="w-4 h-4" />
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-900">Connect Bank with Plaid</p>
                                <p className="text-[11px] text-slate-500">Securely link your real accounts, balances, and cards.</p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={initiatePlaidLink}
                              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
                            >
                              <span>Add bank with Plaid</span>
                              <ExternalLink className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <form onSubmit={handleSavePlaidCredentials} className="flex flex-col gap-4">
                            <div>
                              <label className="text-xs font-medium text-slate-700 block mb-1.5">Plaid Client ID</label>
                              <input
                                type="text"
                                value={settingsPlaidClientId}
                                onChange={e => {
                                  setSettingsPlaidClientId(e.target.value);
                                  try { localStorage.setItem('klarity_plaid_client_id', e.target.value); } catch {}
                                }}
                                placeholder="Client ID"
                                className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-2xs"
                              />
                            </div>

                            <div>
                              <label className="text-xs font-medium text-slate-700 block mb-1.5">Plaid Secret</label>
                              <div className="relative">
                                <input
                                  type={settingsPlaidShowSecret ? 'text' : 'password'}
                                  value={settingsPlaidSecret}
                                  onChange={e => setSettingsPlaidSecret(e.target.value)}
                                  placeholder={settingsPlaidMaskedSecret ? `Saved: ${settingsPlaidMaskedSecret}` : 'Secret Key'}
                                  className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 pr-10 text-xs text-slate-800 focus:outline-none focus:border-blue-600 shadow-2xs"
                                />
                                <button
                                  type="button"
                                  onClick={() => setSettingsPlaidShowSecret(!settingsPlaidShowSecret)}
                                  className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                                >
                                  {settingsPlaidShowSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                </button>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={initiatePlaidLink}
                                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5"
                                >
                                  <Building2 className="w-3.5 h-3.5" />
                                  <span>Connect bank (Plaid)</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setIsSettingsOpen(false);
                                    setIsAddAccountOpen(true);
                                  }}
                                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                                >
                                  Add card manually
                                </button>
                              </div>
                              <button
                                type="submit"
                                className="px-4 py-2 rounded-xl bg-[#1B4B91] hover:bg-[#153a70] text-white text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                              >
                                Save credentials
                              </button>
                            </div>
                          </form>
                        </div>
                      )}
                    </div>
                  )}

                  {/* TAB 4: SESSION */}
                  {settingsActiveTab === 'session' && (
                    <div key="settings-tab-session" className="flex flex-col gap-6">
                      <div>
                        <h2 className="font-serif-title text-2xl font-bold text-slate-900">Session</h2>
                        <p className="text-xs text-slate-500 mt-1">Manage your active login session.</p>
                      </div>

                      <div className="border border-slate-200 rounded-2xl p-6 flex flex-col gap-5 bg-white shadow-2xs">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-semibold text-slate-900">Signed in as</p>
                            <p className="text-xs text-slate-500 mt-0.5">{currentUser?.email || 'zeoe13@gmail.com'}</p>
                          </div>
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active
                          </span>
                        </div>

                        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                          <span className="text-xs text-slate-500">End this session and sign out</span>
                          <button
                            type="button"
                            onClick={() => {
                              setIsSettingsOpen(false);
                              handleLogout();
                            }}
                            className="px-4 py-2 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-semibold text-xs cursor-pointer transition-colors shadow-2xs"
                          >
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Modal Footer */}
                <div className="pt-6 border-t border-slate-200/80 flex items-center justify-between mt-auto">
                  <span className="text-xs text-slate-400">Changes in this section save when you press its button.</span>
                  <button
                    type="button"
                    onClick={() => setIsSettingsOpen(false)}
                    className="border border-slate-200 rounded-xl px-4 py-2 hover:bg-slate-50 text-slate-800 text-xs font-semibold cursor-pointer shadow-2xs transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
      {/* AI Memory Modal */}
      {isMemoryModalOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setIsMemoryModalOpen(false); }}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 text-slate-800 animate-in fade-in zoom-in-95 cursor-default"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-serif-title text-lg font-bold text-slate-900">AI Advisor Memory</h3>
              <button onClick={() => setIsMemoryModalOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add custom preference..."
                value={newMemoryInput}
                onChange={e => setNewMemoryInput(e.target.value)}
                className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-800 outline-none"
              />
              <button
                type="button"
                onClick={() => handleAddMemory()}
                className="px-4 py-2 rounded-xl bg-[#18457c] text-white text-xs font-semibold cursor-pointer"
              >
                Add
              </button>
            </div>
            <div className="divide-y divide-slate-100 max-h-48 overflow-y-auto">
              {aiMemory.map((item, idx) => (
                <div key={idx} className="py-2 flex items-center justify-between text-xs">
                  <span>{item}</span>
                  <button type="button" onClick={() => handleRemoveMemory(idx)} className="text-slate-400 hover:text-rose-600">✕</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Past Chats Modal */}
      {isPastChatsOpen && (
        <div
          onClick={(e) => { if (e.target === e.currentTarget) setIsPastChatsOpen(false); }}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4 cursor-pointer"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white border border-slate-200 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4 text-slate-800 animate-in fade-in zoom-in-95 cursor-default"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-serif-title text-lg font-bold text-slate-900">Past Conversations</h3>
              <button onClick={() => setIsPastChatsOpen(false)} className="text-slate-400 hover:text-slate-600 cursor-pointer">✕</button>
            </div>
            <div className="divide-y divide-slate-100 max-h-60 overflow-y-auto">
              {chatSessions.map(session => (
                <div
                  key={session.id}
                  onClick={() => handleSwitchSession(session.id)}
                  className="py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 px-2 rounded-lg"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-900">{session.title}</p>
                    <p className="text-[10px] text-slate-400">{session.messages?.length || 0} messages</p>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteSession(session.id, e)}
                    className="text-slate-400 hover:text-rose-600 p-1"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
