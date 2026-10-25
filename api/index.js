const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// In-Memory / Fallback Data Store with Users
let memoryStore = {
  users: [
    { id: 'u1', username: 'robert', password: 'password123', name: 'Robert (Dad)', role: 'Parent', avatar: '👨‍💼', color: 'blue' },
    { id: 'u2', username: 'sarah', password: 'password123', name: 'Sarah (Mom)', role: 'Parent', avatar: '👩‍⚕️', color: 'purple' },
    { id: 'u3', username: 'alex', password: 'password123', name: 'Alex (College)', role: 'Student (20)', avatar: '🧑‍🎓', color: 'emerald' },
    { id: 'u4', username: 'maya', password: 'password123', name: 'Maya (High School)', role: 'Teen (17)', avatar: '👧', color: 'amber' },
    { id: 'u5', username: 'jordan', password: 'password123', name: 'Jordan (Middle)', role: 'Kid (14)', avatar: '👦', color: 'pink' },
    { id: 'u6', username: 'leo', password: 'password123', name: 'Leo (Elementary)', role: 'Kid (10)', avatar: '🧒', color: 'cyan' }
  ],
  accounts: [
    { id: 'acc-1', ownerId: 'u1', institution: 'Chase', name: 'Freedom Unlimited', type: 'credit', mask: '3912', balance: 2450.00, limit: 8000.00, apr: 26.49, minPayment: 65.00, dueDate: '2026-11-14', color: '#1e40af', isShared: false },
    { id: 'acc-2', ownerId: 'u2', institution: 'Capital One', name: 'SavorOne Rewards', type: 'credit', mask: '8204', balance: 820.50, limit: 5000.00, apr: 19.99, minPayment: 35.00, dueDate: '2026-11-20', color: '#991b1b', isShared: false },
    { id: 'acc-3', ownerId: 'u1', institution: 'Bank of America', name: 'Family Checking', type: 'depository', mask: '5190', balance: 5340.25, limit: 0, apr: 0, minPayment: 0, dueDate: '', color: '#065f46', isShared: true },
    { id: 'acc-4', ownerId: 'u3', institution: 'Discover', name: 'Student Chrome Card', type: 'credit', mask: '1192', balance: 310.00, limit: 1500.00, apr: 17.24, minPayment: 25.00, dueDate: '2026-11-08', color: '#ea580c', isShared: false },
    { id: 'acc-5', ownerId: 'u4', institution: 'Chase', name: 'Teen Debit Checking', type: 'depository', mask: '6641', balance: 215.00, limit: 0, apr: 0, minPayment: 0, dueDate: '', color: '#4338ca', isShared: false }
  ],
  bills: [
    { id: 'bill-1', name: 'Pacific Gas and Electric (PG&E)', biller: 'PG&E', category: 'Utilities', expectedAmount: 268.40, dueDay: 12, nextDueDate: '2026-11-12', frequency: 'monthly', status: 'due_soon', assignedOwnerId: 'u1', isHouseholdBill: true, notes: 'Shared electric/gas' },
    { id: 'bill-2', name: 'City of Fresno Water & Solid Waste', biller: 'City of Fresno Utilities', category: 'Utilities', expectedAmount: 74.20, dueDay: 16, nextDueDate: '2026-11-16', frequency: 'monthly', status: 'due_soon', assignedOwnerId: 'u1', isHouseholdBill: true, notes: 'Water and trash' },
    { id: 'bill-3', name: 'Xfinity Gigabit Internet', biller: 'Comcast / Xfinity', category: 'Utilities', expectedAmount: 90.00, dueDay: 22, nextDueDate: '2026-11-22', frequency: 'monthly', status: 'upcoming', assignedOwnerId: 'u2', isHouseholdBill: true, notes: 'Home internet' },
    { id: 'bill-4', name: 'T-Mobile Family Magenta Max (6 lines)', biller: 'T-Mobile', category: 'Utilities', expectedAmount: 185.00, dueDay: 28, nextDueDate: '2026-11-28', frequency: 'monthly', status: 'upcoming', assignedOwnerId: 'u1', isHouseholdBill: true, notes: '6 phone lines' },
    { id: 'bill-5', name: 'Netflix Premium 4K + Family', biller: 'Netflix', category: 'Subscriptions', expectedAmount: 22.99, dueDay: 5, nextDueDate: '2026-11-05', frequency: 'monthly', status: 'due_soon', assignedOwnerId: 'u2', isHouseholdBill: true, notes: 'Shared family tier' }
  ],
  transactions: [
    { id: 'tx-101', accountId: 'acc-1', ownerId: 'u1', date: '2026-10-23', name: 'PG&E *WEB ONLINE PMT', amount: 252.18, category: 'Utilities', isRecurring: true, billId: 'bill-1' },
    { id: 'tx-102', accountId: 'acc-3', ownerId: 'u1', date: '2026-10-22', name: 'CITY OF FRESNO UTILITIES', amount: 71.80, category: 'Utilities', isRecurring: true, billId: 'bill-2' },
    { id: 'tx-103', accountId: 'acc-2', ownerId: 'u2', date: '2026-10-21', name: "TRADER JOE'S #144 FRESNO", amount: 164.35, category: 'Groceries', isRecurring: false },
    { id: 'tx-106', accountId: 'acc-1', ownerId: 'u5', date: '2026-10-17', name: 'ROBLOX CORP ROBUX PACK', amount: 19.99, category: 'Gaming', isRecurring: false }
  ]
};

// Auto-categorize
function autoCategorize(name) {
  const n = (name || '').toLowerCase();
  if (/pg&e|pacific gas|fresno water|xfinity|comcast|t-mobile|at&t|verizon|smud|edison|electric|water|utilities|waste|trash/.test(n)) return 'Utilities';
  if (/netflix|spotify|hulu|disney|max|paramount|apple tv|prime video|youtube/.test(n)) return 'Subscriptions';
  if (/steam|nintendo|playstation|xbox|roblox|epic games|riot|minecraft|v-bucks/.test(n)) return 'Gaming';
  if (/amc|regal|cinemark|dave & buster|concert|ticketmaster/.test(n)) return 'Entertainment';
  if (/trader joe|costco|safeway|whole foods|walmart|target|grocery/.test(n)) return 'Groceries';
  if (/in-n-out|mcdonald|starbucks|chipotle|burger|pizza|doordash/.test(n)) return 'Dining';
  if (/chevron|shell|arco|exxon|mobil|gas|fuel/.test(n)) return 'Transportation';
  return 'Other';
}

// 1. POST /api/auth/login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const user = memoryStore.users.find(u => u.username.toLowerCase() === (username || '').toLowerCase() && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid username or password' });
  const { password: _, ...userProfile } = user;
  res.json({ success: true, user: userProfile });
});

// 2. POST /api/auth/register
app.post('/api/auth/register', (req, res) => {
  const { username, password, name, role, avatar } = req.body;
  if (!username || !password || !name) return res.status(400).json({ error: 'Missing fields' });
  const existing = memoryStore.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (existing) return res.status(400).json({ error: 'Username already in use' });

  const newUser = { id: `u${Date.now()}`, username: username.toLowerCase().trim(), password, name: name.trim(), role: role || 'Member', avatar: avatar || '👤', color: 'blue' };
  memoryStore.users.push(newUser);
  const { password: _, ...userProfile } = newUser;
  res.json({ success: true, user: userProfile });
});

// 3. GET /api/data (Filtered by logged-in user)
app.get('/api/data', (req, res) => {
  const currentUserId = req.query.userId || 'u1';
  const showHousehold = req.query.household === 'true';

  const currentUser = memoryStore.users.find(u => u.id === currentUserId) || memoryStore.users[0];
  const safeMembers = memoryStore.users.map(({ password: _, ...u }) => u);

  const visibleAccounts = memoryStore.accounts.filter(acc => showHousehold ? true : acc.ownerId === currentUserId || acc.isShared);
  const visibleBills = memoryStore.bills.filter(b => showHousehold ? true : b.isHouseholdBill || b.assignedOwnerId === currentUserId);
  const visibleTransactions = memoryStore.transactions.filter(t => showHousehold ? true : t.ownerId === currentUserId || t.isRecurring);

  const totalChecking = visibleAccounts.filter(a => a.type === 'depository').reduce((s, a) => s + (Number(a.balance) || 0), 0);
  const totalCreditDebt = visibleAccounts.filter(a => a.type === 'credit').reduce((s, a) => s + (Number(a.balance) || 0), 0);
  const totalMonthlyBills = visibleBills.reduce((s, b) => s + (Number(b.expectedAmount) || 0), 0);

  res.json({
    currentUser: { id: currentUser.id, name: currentUser.name, username: currentUser.username, role: currentUser.role, avatar: currentUser.avatar },
    familyMembers: safeMembers,
    accounts: visibleAccounts,
    bills: visibleBills,
    transactions: visibleTransactions,
    metrics: {
      totalChecking: Number(totalChecking.toFixed(2)),
      totalCreditDebt: Number(totalCreditDebt.toFixed(2)),
      totalMonthlyBills: Number(totalMonthlyBills.toFixed(2)),
      netWorthEstimate: Number((totalChecking - totalCreditDebt).toFixed(2))
    }
  });
});

// 4. POST /api/accounts
app.post('/api/accounts', (req, res) => {
  const { ownerId, institution, name, type, mask, balance, limit, apr, minPayment, dueDate, isShared } = req.body;
  const newAccount = {
    id: `acc-${Date.now()}`,
    ownerId: ownerId || 'u1',
    institution: institution || 'Connected Bank',
    name: name || 'Account',
    type: type || 'credit',
    mask: mask || String(Math.floor(1000 + Math.random() * 9000)),
    balance: Number(balance) || 0,
    limit: Number(limit) || 0,
    apr: Number(apr) || 0,
    minPayment: Number(minPayment) || 0,
    dueDate: dueDate || '',
    color: type === 'credit' ? '#1e40af' : '#065f46',
    isShared: Boolean(isShared)
  };
  memoryStore.accounts.push(newAccount);
  res.json({ success: true, account: newAccount });
});

// 5. POST /api/transactions
app.post('/api/transactions', (req, res) => {
  const { accountId, ownerId, name, amount, date, category } = req.body;
  const detectedCategory = category || autoCategorize(name);
  const newTx = {
    id: `tx-${Date.now()}`,
    accountId: accountId || memoryStore.accounts[0]?.id || 'acc-1',
    ownerId: ownerId || 'u1',
    date: date || new Date().toISOString().split('T')[0],
    name: name || 'Purchase',
    amount: Number(amount) || 0,
    category: detectedCategory,
    isRecurring: /pg&e|fresno water|xfinity|t-mobile/.test((name || '').toLowerCase())
  };
  memoryStore.transactions.unshift(newTx);
  res.json({ success: true, transaction: newTx });
});

// 6. POST /api/ai/chat
app.post('/api/ai/chat', (req, res) => {
  const { message, userId } = req.body;
  const user = memoryStore.users.find(u => u.id === userId) || memoryStore.users[0];
  const userCards = memoryStore.accounts.filter(a => a.ownerId === user.id && a.type === 'credit');
  const sorted = [...userCards].sort((a, b) => b.apr - a.apr);

  let reply = '';
  const msg = (message || '').toLowerCase();
  if (msg.includes('pay off') || msg.includes('debt') || msg.includes('card')) {
    if (sorted.length > 0) {
      reply = `### 💡 Personalized Advice for ${user.name}\n\n* **Top Priority:** Pay off **${sorted[0].institution} ${sorted[0].name}** first! It carries your highest interest rate at **${sorted[0].apr}% APR** with a balance of $${sorted[0].balance.toFixed(2)}.`;
    } else {
      reply = `You don't have any credit card debt linked to your profile, ${user.name}! 🎉`;
    }
  } else {
    reply = `Hello ${user.name}! I'm Klarity. You have ${userCards.length} personal cards connected. Ask me how to optimize your bills or manage your payments.`;
  }
  res.json({ reply });
});

module.exports = app;
