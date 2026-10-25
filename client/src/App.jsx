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
  ExternalLink,
  Users,
  ShieldCheck,
  FileText,
  UploadCloud,
  ChevronRight,
  HelpCircle,
  Search
} from 'lucide-react';

export default function App() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [activeMember, setActiveMember] = useState('all');

  // AI Chat state
  const [chatMessages, setChatMessages] = useState([
    {
      role: 'assistant',
      text: "👋 Hi! I'm your Family AI Financial Advisor. I monitor your connected cards, upcoming utility bills (like PG&E and Fresno Water), and family subscriptions. Ask me what card you should pay off first, or how much you're spending on gaming!"
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

  // New item form states
  const [newAccount, setNewAccount] = useState({
    institution: 'Chase',
    name: 'Sapphire Preferred',
    type: 'credit',
    balance: '450.00',
    limit: '5000',
    apr: '21.99',
    minPayment: '35',
    dueDate: '2026-11-25',
    memberId: 'm1'
  });

  const [newTx, setNewTx] = useState({
    name: '',
    amount: '',
    category: '',
    memberId: 'm1',
    accountId: ''
  });

  const [newBill, setNewBill] = useState({
    name: '',
    biller: '',
    category: 'Utilities',
    expectedAmount: '',
    dueDay: '15',
    assignedMemberId: 'm1'
  });

  const [scanText, setScanText] = useState(
    "PACIFIC GAS AND ELECTRIC COMPANY\nStatement Date: Oct 22, 2026\nAccount: 4819-2041-02\nTotal Amount Due: $284.50\nPayment Due Date: November 14, 2026\nService: Electric and Natural Gas"
  );
  const [scanResult, setScanResult] = useState(null);

  // Filter transactions search
  const [txSearch, setTxSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Load backend data
  const fetchData = async () => {
    try {
      const res = await fetch('/api/data');
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
    fetchData();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isAiTyping]);

  // Handle AI Chat submit
  const handleSendMessage = async (msgToSend) => {
    const text = msgToSend || chatInput;
    if (!text.trim()) return;

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
          memberId: activeMember !== 'all' ? activeMember : undefined
        })
      });
      const json = await res.json();
      setChatMessages(prev => [...prev, { role: 'assistant', text: json.reply }]);
    } catch (err) {
      setChatMessages(prev => [
        ...prev,
        { role: 'assistant', text: "⚠️ Unable to contact AI advisor server. Check your connection or server logs." }
      ]);
    } finally {
      setIsAiTyping(false);
    }
  };

  // Mark bill as paid
  const handlePayBill = async (billId) => {
    try {
      const res = await fetch(`/api/bills/${billId}/pay`, { method: 'POST' });
      if (res.ok) {
        await fetchData();
      }
    } catch (err) {
      console.error('Error paying bill:', err);
    }
  };

  // Add Account
  const handleAddAccount = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newAccount)
      });
      if (res.ok) {
        setIsAddAccountOpen(false);
        await fetchData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Connect via Plaid Simulation
  const handlePlaidConnect = async () => {
    try {
      const res = await fetch('/api/plaid/exchange-public-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          institution: 'Chase Bank',
          accountName: 'Chase Freedom Flex',
          memberId: activeMember !== 'all' ? activeMember : 'm1'
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

  // Add Transaction
  const handleAddTx = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTx)
      });
      if (res.ok) {
        setIsAddTxOpen(false);
        setNewTx({ name: '', amount: '', category: '', memberId: 'm1', accountId: data?.accounts[0]?.id || '' });
        await fetchData();
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
        body: JSON.stringify(newBill)
      });
      if (res.ok) {
        setIsAddBillOpen(false);
        setNewBill({ name: '', biller: '', category: 'Utilities', expectedAmount: '', dueDay: '15', assignedMemberId: 'm1' });
        await fetchData();
      }
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
        body: JSON.stringify({ billText: scanText })
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

  // Delete account
  const handleDeleteAccount = async (id) => {
    if (!confirm('Remove this connected account?')) return;
    try {
      await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
      await fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-300">
        <Sparkles className="w-10 h-10 text-blue-500 animate-spin mb-4" />
        <p className="text-lg font-medium">Loading Family Vault & Cards...</p>
      </div>
    );
  }

  // Filtered lists
  const filteredAccounts = data?.accounts?.filter(a =>
    activeMember === 'all' ? true : a.memberId === activeMember
  ) || [];

  const filteredBills = data?.bills?.filter(b =>
    activeMember === 'all' ? true : b.assignedMemberId === activeMember
  ) || [];

  const filteredTransactions = data?.transactions?.filter(t => {
    const matchMember = activeMember === 'all' ? true : t.memberId === activeMember;
    const matchCategory = categoryFilter === 'all' ? true : t.category === categoryFilter;
    const matchSearch = txSearch ? t.name.toLowerCase().includes(txSearch.toLowerCase()) : true;
    return matchMember && matchCategory && matchSearch;
  }) || [];

  // Member map helper
  const memberMap = (data?.familyMembers || []).reduce((acc, m) => {
    acc[m.id] = m;
    return acc;
  }, {});

  // High APR card calculation
  const highestAprCard = (data?.accounts || [])
    .filter(a => a.type === 'credit' && a.balance > 0)
    .sort((a, b) => b.apr - a.apr)[0];

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
                  FamFinance <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">Private Vault</span>
                </h1>
                <p className="text-xs text-slate-400">Self-Hosted Family Finance & AI Advisor</p>
              </div>
            </div>

            {/* Quick Actions (Mobile) */}
            <div className="flex md:hidden items-center gap-2">
              <button
                onClick={() => setIsAddTxOpen(true)}
                className="p-2 rounded-lg bg-blue-600 text-white hover:bg-blue-500"
                title="Add Purchase"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Family Member Switcher (6 Profiles) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
            <button
              onClick={() => setActiveMember('all')}
              className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                activeMember === 'all'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              <Users className="w-3.5 h-3.5" /> All Family (6)
            </button>
            {data?.familyMembers?.map(m => (
              <button
                key={m.id}
                onClick={() => setActiveMember(m.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  activeMember === m.id
                    ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30 font-semibold'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <span>{m.avatar}</span>
                <span>{m.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>

          {/* Quick Actions (Desktop) */}
          <div className="hidden md:flex items-center gap-2">
            <button
              onClick={() => setIsScanBillOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5 text-blue-400" /> Scan Bill / E-Bill
            </button>
            <button
              onClick={() => setIsAddAccountOpen(true)}
              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5"
            >
              <CreditCard className="w-3.5 h-3.5 text-emerald-400" /> Link Card
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
            { id: 'dashboard', label: 'Overview', icon: TrendingUp },
            { id: 'cards', label: `Cards & Bank (${filteredAccounts.length})`, icon: CreditCard },
            { id: 'bills', label: `Bills & Utilities (${filteredBills.length})`, icon: Zap },
            { id: 'purchases', label: `Purchases (${filteredTransactions.length})`, icon: Receipt },
            { id: 'ai', label: 'AI Advisor', icon: Bot, badge: 'Smart' }
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

        {/* ================= TAB 1: DASHBOARD OVERVIEW ================= */}
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-6">
            {/* Top Stat Banners */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                  <span>Available Cash (Checking)</span>
                  <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-3">
                  <div className="text-2xl font-bold text-white">
                    ${data?.metrics?.totalChecking?.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Ready for upcoming bills
                  </p>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-400 text-xs font-medium">
                  <span>Credit Card Balances</span>
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
                  <p className="text-xs text-amber-400 mt-1">PG&E, Fresno Water, Xfinity, T-Mobile</p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-indigo-950 to-slate-900 border border-indigo-800/40 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-indigo-300 text-xs font-medium">
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
                      <span className="text-xs text-slate-300">Bal: ${highestAprCard.balance.toFixed(2)}</span>
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab('ai');
                        handleSendMessage('What should I pay off first and how much?');
                      }}
                      className="mt-3 text-xs text-indigo-300 hover:text-white font-medium flex items-center gap-1"
                    >
                      Ask AI Advisor how to pay <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-emerald-400 mt-2">Zero high-interest debt outstanding! 🎉</p>
                )}
              </div>
            </div>

            {/* Split Grid: Upcoming Bills & AI Assistant Quick Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Upcoming Bills List */}
              <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                      <Zap className="w-4 h-4 text-amber-400" /> Upcoming Household Bills & Utilities
                    </h2>
                    <p className="text-xs text-slate-400">Includes Fresno Water, PG&E, Telecom & Subscriptions</p>
                  </div>
                  <button
                    onClick={() => setIsAddBillOpen(true)}
                    className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Bill
                  </button>
                </div>

                <div className="divide-y divide-slate-800">
                  {filteredBills.slice(0, 5).map(bill => {
                    const assigned = memberMap[bill.assignedMemberId];
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
                              <span>Due {bill.nextDueDate}</span>
                              {assigned && (
                                <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] text-slate-300">
                                  {assigned.avatar} {assigned.name.split(' ')[0]}
                                </span>
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <div className="text-right">
                            <div className="text-sm font-bold text-white">${bill.expectedAmount.toFixed(2)}</div>
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
                              onClick={() => handlePayBill(bill.id)}
                              className="px-2.5 py-1 text-xs font-medium rounded-lg bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 transition-colors"
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
              </div>

              {/* AI Advisor Card */}
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
                      <Bot className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">Family AI Financial Advisor</h3>
                      <p className="text-xs text-slate-400">Real-time household analysis</p>
                    </div>
                  </div>

                  <div className="bg-slate-950/60 border border-slate-800/80 rounded-xl p-3 text-xs text-slate-300 leading-relaxed mb-4">
                    "I noticed your <strong>PG&E bill ($268.40)</strong> and <strong>Discover Card ($310)</strong> are both due in the next 14 days. You can save money by directing extra funds to Dad's Chase Card with <strong>26.49% APR</strong>."
                  </div>

                  <p className="text-xs font-semibold text-slate-400 mb-2">Quick Inquiries:</p>
                  <div className="flex flex-col gap-1.5">
                    {[
                      'What should I pay off first?',
                      'Show bills due in the next 10 days',
                      'How much are kids spending on games?'
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
                  className="mt-4 w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium text-xs shadow-md shadow-blue-600/20 hover:opacity-95 transition-opacity"
                >
                  Open Full AI Advisor Chat
                </button>
              </div>
            </div>

            {/* Recent Purchases Feed */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    <Receipt className="w-4 h-4 text-emerald-400" /> Recent Purchases & Auto-Categories
                  </h2>
                  <p className="text-xs text-slate-400">Automatically categorized as Subscriptions, Gaming, Utilities, etc.</p>
                </div>
                <button
                  onClick={() => setActiveTab('purchases')}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium"
                >
                  View All ({data?.transactions?.length})
                </button>
              </div>

              <div className="divide-y divide-slate-800">
                {filteredTransactions.slice(0, 6).map(tx => {
                  const member = memberMap[tx.memberId];
                  return (
                    <div key={tx.id} className="py-3 flex items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-sm">
                          {member?.avatar || '💳'}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{tx.name}</p>
                          <p className="text-xs text-slate-400 flex items-center gap-2">
                            <span>{tx.date}</span>
                            <span>•</span>
                            <span>{member?.name || 'Shared'}</span>
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-bold text-white">-${tx.amount.toFixed(2)}</div>
                        <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {tx.category}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: CONNECTED CARDS & ACCOUNTS ================= */}
        {activeTab === 'cards' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white">Connected Debit & Credit Cards</h2>
                <p className="text-xs text-slate-400">
                  Securely linked for your family. All cards are stored locally in your private database.
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
                  <Plus className="w-4 h-4" /> Manual Card Entry
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredAccounts.map(acc => {
                const isCredit = acc.type === 'credit';
                const member = memberMap[acc.memberId];
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
                      {/* Top Bar of Card */}
                      <div className="flex items-center justify-between text-xs text-slate-300 mb-4">
                        <span className="font-bold uppercase tracking-wider text-slate-200">
                          {acc.institution}
                        </span>
                        <div className="flex items-center gap-2">
                          {member && (
                            <span className="px-2 py-0.5 rounded-full bg-black/40 text-[11px] font-medium border border-white/10">
                              {member.avatar} {member.name.split(' ')[0]}
                            </span>
                          )}
                          <button
                            onClick={() => handleDeleteAccount(acc.id)}
                            className="text-slate-500 hover:text-red-400 p-1"
                            title="Remove account"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Card Name & Mask */}
                      <p className="text-base font-bold text-white">{acc.name}</p>
                      <p className="text-xs text-slate-400 font-mono tracking-widest mt-0.5">
                        •••• •••• •••• {acc.mask}
                      </p>

                      {/* Balance */}
                      <div className="mt-4">
                        <p className="text-xs text-slate-400 font-medium">
                          {isCredit ? 'Current Balance' : 'Available Balance'}
                        </p>
                        <div className="text-2xl font-black text-white">
                          ${acc.balance.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </div>
                    </div>

                    {/* Bottom Metadata */}
                    <div className="mt-5 pt-4 border-t border-white/10 flex flex-col gap-2">
                      {isCredit ? (
                        <>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-400">Credit Limit:</span>
                            <span className="text-slate-200 font-semibold">${acc.limit.toLocaleString()}</span>
                          </div>
                          {/* Utilization bar */}
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

        {/* ================= TAB 3: BILLS & UTILITIES ================= */}
        {activeTab === 'bills' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" /> Household Bills & Utilities
                </h2>
                <p className="text-xs text-slate-400">
                  Track PG&E, Fresno Water, Xfinity, T-Mobile, and subscriptions all in one place.
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
              {filteredBills.map(bill => {
                const assigned = memberMap[bill.assignedMemberId];
                const isPaid = bill.status === 'paid';
                return (
                  <div
                    key={bill.id}
                    className={`rounded-2xl p-5 border transition-all ${
                      isPaid
                        ? 'bg-slate-900/60 border-slate-800/60 opacity-80'
                        : bill.status === 'due_soon'
                        ? 'bg-slate-900 border-amber-500/40 shadow-lg shadow-amber-500/5'
                        : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                            bill.category === 'Utilities'
                              ? 'bg-amber-500/10 text-amber-400'
                              : bill.category === 'Gaming'
                              ? 'bg-pink-500/10 text-pink-400'
                              : 'bg-purple-500/10 text-purple-400'
                          }`}
                        >
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

                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                      <span className="text-slate-400 flex items-center gap-1">
                        {assigned?.avatar} {assigned?.name.split(' ')[0]}
                      </span>
                      {!isPaid && (
                        <button
                          onClick={() => handlePayBill(bill.id)}
                          className="px-3 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white font-medium transition-colors"
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

        {/* ================= TAB 4: PURCHASES & CATEGORIES ================= */}
        {activeTab === 'purchases' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white">Purchase History & Categories</h2>
                <p className="text-xs text-slate-400">
                  Transactions automatically categorized into Subscriptions, Gaming, Utilities, Dining, etc.
                </p>
              </div>
              <button
                onClick={() => setIsAddTxOpen(true)}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" /> Add Purchase
              </button>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900 p-3 rounded-2xl border border-slate-800">
              <div className="relative flex-1">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search purchases (e.g. PG&E, Roblox, Steam, Costco)..."
                  value={txSearch}
                  onChange={e => setTxSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-950 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                {['all', 'Utilities', 'Subscriptions', 'Gaming', 'Groceries', 'Dining'].map(cat => (
                  <button
                    key={cat}
                    onClick={() => setCategoryFilter(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-medium whitespace-nowrap transition-colors ${
                      categoryFilter === cat
                        ? 'bg-blue-600 text-white font-semibold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {cat === 'all' ? 'All Categories' : cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Transactions List */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl divide-y divide-slate-800 overflow-hidden">
              {filteredTransactions.length === 0 ? (
                <div className="p-8 text-center text-slate-500 text-sm">
                  No purchases found matching your filters.
                </div>
              ) : (
                filteredTransactions.map(tx => {
                  const member = memberMap[tx.memberId];
                  return (
                    <div key={tx.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-850/50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-base shrink-0">
                          {tx.category === 'Gaming'
                            ? '🎮'
                            : tx.category === 'Subscriptions'
                            ? '📺'
                            : tx.category === 'Utilities'
                            ? '⚡'
                            : tx.category === 'Groceries'
                            ? '🛒'
                            : tx.category === 'Dining'
                            ? '🍔'
                            : '💳'}
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-white truncate">{tx.name}</p>
                          <p className="text-xs text-slate-400 flex items-center gap-2">
                            <span>{tx.date}</span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              {member?.avatar} {member?.name}
                            </span>
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
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 5: AI FINANCIAL ADVISOR ================= */}
        {activeTab === 'ai' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[650px] shadow-xl overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-900/90 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                  <Bot className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    Family AI Financial Advisor
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30">
                      Active
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400">
                    Live insights on debt payoff, utilities, and bill due dates
                  </p>
                </div>
              </div>

              <div className="text-xs text-slate-400 hidden sm:block">
                Context: {activeMember === 'all' ? 'Whole Family (6)' : memberMap[activeMember]?.name}
              </div>
            </div>

            {/* Chat History */}
            <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-4">
              {chatMessages.map((msg, idx) => {
                const isAssistant = msg.role === 'assistant';
                return (
                  <div
                    key={idx}
                    className={`flex gap-3 max-w-3xl ${
                      isAssistant ? 'self-start' : 'self-end flex-row-reverse'
                    }`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-xs font-bold ${
                        isAssistant
                          ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white'
                          : 'bg-slate-700 text-slate-200'
                      }`}
                    >
                      {isAssistant ? <Sparkles className="w-4 h-4" /> : 'You'}
                    </div>

                    <div
                      className={`rounded-2xl p-4 text-xs sm:text-sm leading-relaxed ${
                        isAssistant
                          ? 'bg-slate-950 border border-slate-800 text-slate-200 shadow-sm'
                          : 'bg-blue-600 text-white'
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
                    <span>Analyzing family cards and bills...</span>
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Suggestion Chips */}
            <div className="px-4 py-2 border-t border-slate-800 bg-slate-950/60 flex items-center gap-2 overflow-x-auto scrollbar-none">
              {[
                'What should I pay off first?',
                'Are we covered for PG&E & bills this month?',
                'How much did we spend on gaming?',
                'Explain the Avalanche debt method'
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

            {/* Input Box */}
            <div className="p-3 border-t border-slate-800 bg-slate-900 flex items-center gap-2">
              <input
                type="text"
                placeholder="Ask about bills, credit card payoff, gaming spend, or family budget..."
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

      {/* ================= MODAL 1: LINK CARD ================= */}
      {isAddAccountOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-blue-400" /> Link New Card or Bank
              </h3>
              <button onClick={() => setIsAddAccountOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="bg-blue-950/40 border border-blue-900/60 rounded-xl p-3 text-xs text-blue-200">
              💡 <strong>Private Sandbox Ready:</strong> You can link with Plaid simulator or manually enter any debit/credit card.
            </div>

            <form onSubmit={handleAddAccount} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Family Member</label>
                <select
                  value={newAccount.memberId}
                  onChange={e => setNewAccount({ ...newAccount, memberId: e.target.value })}
                  className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                >
                  {data?.familyMembers?.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.avatar} {m.name} ({m.role})
                    </option>
                  ))}
                </select>
              </div>

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
                <Receipt className="w-5 h-5 text-emerald-400" /> Log Purchase / Transaction
              </h3>
              <button onClick={() => setIsAddTxOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTx} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Merchant / Description</label>
                <input
                  type="text"
                  placeholder="e.g. PG&E, Steam, Roblox, Costco, Trader Joe's"
                  required
                  value={newTx.name}
                  onChange={e => setNewTx({ ...newTx, name: e.target.value })}
                  className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  ✨ The app will automatically detect categories like <em>Gaming</em>, <em>Utilities</em>, or <em>Subscriptions</em>!
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
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

                <div>
                  <label className="text-xs font-semibold text-slate-300">Family Member</label>
                  <select
                    value={newTx.memberId}
                    onChange={e => setNewTx({ ...newTx, memberId: e.target.value })}
                    className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  >
                    {data?.familyMembers?.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.avatar} {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-300">Paid With Card</label>
                <select
                  value={newTx.accountId}
                  onChange={e => setNewTx({ ...newTx, accountId: e.target.value })}
                  className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                >
                  {data?.accounts?.map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.institution} {acc.name} (•••• {acc.mask})
                    </option>
                  ))}
                </select>
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

      {/* ================= MODAL 3: ADD RECURRING BILL ================= */}
      {isAddBillOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-400" /> Add Household Bill
              </h3>
              <button onClick={() => setIsAddBillOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleAddBill} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-300">Bill Name / Provider</label>
                <input
                  type="text"
                  placeholder="e.g. PG&E, Fresno Water, Xfinity, T-Mobile"
                  required
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
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Expected Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="120.00"
                    required
                    value={newBill.expectedAmount}
                    onChange={e => setNewBill({ ...newBill, expectedAmount: e.target.value })}
                    className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-300">Due Day of Month</label>
                  <input
                    type="number"
                    min="1"
                    max="31"
                    value={newBill.dueDay}
                    onChange={e => setNewBill({ ...newBill, dueDay: e.target.value })}
                    className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300">Assigned Member</label>
                  <select
                    value={newBill.assignedMemberId}
                    onChange={e => setNewBill({ ...newBill, assignedMemberId: e.target.value })}
                    className="mt-1 w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-slate-200"
                  >
                    {data?.familyMembers?.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.avatar} {m.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddBillOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-amber-600 hover:bg-amber-500 text-white"
                >
                  Save Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: SCAN / INGEST E-BILL ================= */}
      {isScanBillOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-blue-400" /> AI E-Bill & Statement Scanner
              </h3>
              <button onClick={() => setIsScanBillOpen(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Paste your PG&E, Fresno Water, Xfinity, or T-Mobile email statement text. The AI extracts the <strong>biller</strong>, <strong>due date</strong>, and <strong>amount</strong> automatically.
            </p>

            <textarea
              rows={6}
              value={scanText}
              onChange={e => setScanText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
              placeholder="Paste email text or bill details here..."
            />

            {scanResult && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{scanResult}</span>
              </div>
            )}

            <div className="flex items-center justify-between gap-2 mt-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setScanText(
                    "CITY OF FRESNO UTILITIES\nStatement Date: Oct 20, 2026\nAccount: 0092-184-01\nTotal Charges Due: $78.10\nPayment Due Date: November 16, 2026\nService: Water, Solid Waste, and Sewer"
                  );
                }}
                className="text-[11px] text-blue-400 hover:underline"
              >
                Insert Fresno Water Sample
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsScanBillOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white"
                >
                  Close
                </button>
                <button
                  onClick={handleScanBill}
                  className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white shadow-md shadow-blue-600/20 flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" /> Parse Bill
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
