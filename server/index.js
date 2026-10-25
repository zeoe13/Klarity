const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json());

// Initialize Google GenAI if key exists
let aiClient = null;
if (process.env.GEMINI_API_KEY) {
  try {
    const { GoogleGenAI } = require('@google/genai');
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  } catch (err) {
    console.warn('Google GenAI note:', err.message);
  }
}

function readData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading data.json:', err);
    return { users: [], accounts: [], bills: [], transactions: [] };
  }
}

function writeData(data) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing data.json:', err);
    return false;
  }
}

// Automatic category detection for purchases
function autoCategorize(name) {
  const n = (name || '').toLowerCase();
  if (/pg&e|pacific gas|fresno water|xfinity|comcast|t-mobile|at&t|verizon|smud|edison|electric|water|utilities|waste|trash/.test(n)) {
    return 'Utilities';
  }
  if (/netflix|spotify|hulu|disney|max|paramount|apple tv|prime video|youtube|audible|crunchyroll/.test(n)) {
    return 'Subscriptions';
  }
  if (/steam|nintendo|playstation|xbox|roblox|epic games|riot|minecraft|v-bucks|robux/.test(n)) {
    return 'Gaming';
  }
  if (/amc|regal|cinemark|dave & buster|concert|ticketmaster|cinema|movie/.test(n)) {
    return 'Entertainment';
  }
  if (/trader joe|costco|safeway|whole foods|kroger|walmart|target|grocery|supermarket|aldi/.test(n)) {
    return 'Groceries';
  }
  if (/in-n-out|mcdonald|starbucks|chipotle|burger|pizza|doordash|ubereats|restaurant|cafe|taco/.test(n)) {
    return 'Dining';
  }
  if (/chevron|shell|arco|exxon|mobil|gas|fuel|speedway|76 station/.test(n)) {
    return 'Transportation';
  }
  return 'Other';
}

// ================= AUTH ROUTES =================

// Login
app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  const data = readData();

  const user = data.users.find(
    u => u.username.toLowerCase() === (username || '').toLowerCase() && u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: 'Invalid username or password' });
  }

  // Return user info (omit password)
  const { password: _, ...userProfile } = user;
  res.json({ success: true, user: userProfile, token: `token-${user.id}` });
});

// Register new family member
app.post('/api/auth/register', (req, res) => {
  const { username, password, name, role, avatar } = req.body;
  if (!username || !password || !name) {
    return res.status(400).json({ error: 'Username, password, and name are required' });
  }

  const data = readData();
  const existing = data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'Username already taken' });
  }

  const newUser = {
    id: `u${Date.now()}`,
    username: username.toLowerCase().trim(),
    password,
    name: name.trim(),
    role: role || 'Member',
    avatar: avatar || '👤',
    color: 'blue'
  };

  data.users.push(newUser);
  writeData(data);

  const { password: _, ...userProfile } = newUser;
  res.json({ success: true, user: userProfile, token: `token-${newUser.id}` });
});

// List all member profiles in the family vault
app.get('/api/family/members', (req, res) => {
  const data = readData();
  const safeMembers = data.users.map(({ password: _, ...u }) => u);
  res.json({ members: safeMembers });
});

// ================= DATA ROUTES (With Privacy Isolation) =================

app.get('/api/data', (req, res) => {
  const data = readData();
  const currentUserId = req.query.userId || req.headers['x-user-id'] || 'u1';
  const showHousehold = req.query.household === 'true';

  const currentUser = data.users.find(u => u.id === currentUserId) || data.users[0];
  const safeMembers = data.users.map(({ password: _, ...u }) => u);

  // Filter accounts: show user's own cards, plus shared cards if requested
  const visibleAccounts = data.accounts.filter(acc => {
    if (showHousehold) return true;
    return acc.ownerId === currentUserId || acc.isShared;
  });

  // Filter bills: household bills (PG&E, Fresno Water, Xfinity) + user's assigned bills
  const visibleBills = data.bills.filter(bill => {
    if (showHousehold) return true;
    return bill.isHouseholdBill || bill.assignedOwnerId === currentUserId;
  });

  // Filter transactions
  const visibleTransactions = data.transactions.filter(tx => {
    if (showHousehold) return true;
    return tx.ownerId === currentUserId || tx.isRecurring;
  });

  // Metrics calculation
  const totalChecking = visibleAccounts
    .filter(a => a.type === 'depository')
    .reduce((sum, a) => sum + (Number(a.balance) || 0), 0);

  const totalCreditDebt = visibleAccounts
    .filter(a => a.type === 'credit')
    .reduce((sum, a) => sum + (Number(a.balance) || 0), 0);

  const totalMonthlyBills = visibleBills
    .reduce((sum, b) => {
      const amt = Number(b.expectedAmount) || 0;
      return sum + (b.frequency === 'yearly' ? amt / 12 : amt);
    }, 0);

  res.json({
    currentUser: {
      id: currentUser.id,
      name: currentUser.name,
      username: currentUser.username,
      role: currentUser.role,
      avatar: currentUser.avatar
    },
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

// Add card/bank owned by the logged-in user
app.post('/api/accounts', (req, res) => {
  const { ownerId, institution, name, type, mask, balance, limit, apr, minPayment, dueDate, isShared } = req.body;
  const data = readData();

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

  data.accounts.push(newAccount);
  writeData(data);
  res.json({ success: true, account: newAccount });
});

// Delete card
app.delete('/api/accounts/:id', (req, res) => {
  const data = readData();
  data.accounts = data.accounts.filter(a => a.id !== req.params.id);
  writeData(data);
  res.json({ success: true });
});

// Add Bill
app.post('/api/bills', (req, res) => {
  const { name, biller, category, expectedAmount, dueDay, frequency, assignedOwnerId, notes, isHouseholdBill } = req.body;
  const data = readData();

  const newBill = {
    id: `bill-${Date.now()}`,
    name: name || 'Utility / Bill',
    biller: biller || name,
    category: category || autoCategorize(name),
    expectedAmount: Number(expectedAmount) || 0,
    dueDay: Number(dueDay) || 1,
    nextDueDate: `2026-11-${String(dueDay || 1).padStart(2, '0')}`,
    frequency: frequency || 'monthly',
    status: 'upcoming',
    assignedOwnerId: assignedOwnerId || 'u1',
    isHouseholdBill: isHouseholdBill !== false,
    notes: notes || ''
  };

  data.bills.push(newBill);
  writeData(data);
  res.json({ success: true, bill: newBill });
});

// Mark bill paid
app.post('/api/bills/:id/pay', (req, res) => {
  const data = readData();
  const bill = data.bills.find(b => b.id === req.params.id);
  if (!bill) return res.status(404).json({ error: 'Bill not found' });

  bill.status = 'paid';
  bill.lastPaidDate = new Date().toISOString().split('T')[0];
  bill.lastPaidAmount = bill.expectedAmount;

  const paymentTx = {
    id: `tx-${Date.now()}`,
    accountId: data.accounts[0]?.id || 'acc-1',
    ownerId: bill.assignedOwnerId || 'u1',
    date: bill.lastPaidDate,
    name: `${bill.biller || bill.name} (Payment)`,
    amount: bill.expectedAmount,
    category: bill.category,
    isRecurring: true,
    billId: bill.id
  };
  data.transactions.unshift(paymentTx);

  writeData(data);
  res.json({ success: true, bill, transaction: paymentTx });
});

// Log purchase for logged-in user
app.post('/api/transactions', (req, res) => {
  const { accountId, ownerId, name, amount, date, category } = req.body;
  const data = readData();

  const detectedCategory = category || autoCategorize(name);
  const isRecurring = /pg&e|fresno water|xfinity|t-mobile|netflix|spotify/.test((name || '').toLowerCase());

  const newTx = {
    id: `tx-${Date.now()}`,
    accountId: accountId || (data.accounts[0] ? data.accounts[0].id : 'acc-1'),
    ownerId: ownerId || 'u1',
    date: date || new Date().toISOString().split('T')[0],
    name: name || 'Purchase',
    amount: Number(amount) || 0,
    category: detectedCategory,
    isRecurring
  };

  data.transactions.unshift(newTx);
  writeData(data);
  res.json({ success: true, transaction: newTx });
});

// Scan e-bill
app.post('/api/bills/scan', async (req, res) => {
  const { billText, ownerId } = req.body;
  if (!billText) return res.status(400).json({ error: 'billText is required' });

  let biller = 'Utility Provider';
  let category = 'Utilities';
  let amount = 120.00;
  let nextDueDate = '2026-11-15';

  const t = billText.toLowerCase();
  if (t.includes('pg&e') || t.includes('pacific gas')) {
    biller = 'Pacific Gas and Electric (PG&E)';
  } else if (t.includes('fresno') || t.includes('city of fresno')) {
    biller = 'City of Fresno Utilities';
  } else if (t.includes('xfinity') || t.includes('comcast')) {
    biller = 'Xfinity Comcast';
  } else if (t.includes('t-mobile')) {
    biller = 'T-Mobile';
  }

  const amountMatch = billText.match(/\$\s*([0-9]+(?:\.[0-9]{2})?)/) ||
                      billText.match(/(?:due|amount|total|charges)[:\s]+\$?([0-9]+(?:\.[0-9]{2})?)/i);
  if (amountMatch) amount = parseFloat(amountMatch[1]);

  const dateMatch = billText.match(/(?:due|by|date)[:\s]+([A-Za-z]+ \d{1,2},? \d{4}|\d{1,2}\/\d{1,2}\/\d{4})/i) ||
                    billText.match(/(?:due on|by)\s+([A-Za-z]+ \d{1,2}(?:,? \d{4})?)/i);
  if (dateMatch) nextDueDate = dateMatch[1];

  const data = readData();
  const newBill = {
    id: `bill-${Date.now()}`,
    name: biller,
    biller,
    category,
    expectedAmount: amount,
    dueDay: 15,
    nextDueDate,
    frequency: 'monthly',
    status: 'due_soon',
    assignedOwnerId: ownerId || 'u1',
    isHouseholdBill: true,
    notes: 'Scanned statement'
  };

  data.bills.push(newBill);
  writeData(data);

  res.json({
    success: true,
    scannedBill: newBill,
    summary: `Successfully parsed bill from ${biller} for $${newBill.expectedAmount} due on ${nextDueDate}`
  });
});

// Plaid simulation: link card to logged-in user
app.post('/api/plaid/exchange-public-token', (req, res) => {
  const { institution, accountName, ownerId } = req.body;
  const data = readData();

  const newAccount = {
    id: `acc-plaid-${Date.now()}`,
    ownerId: ownerId || 'u1',
    institution: institution || 'Chase Bank',
    name: accountName || 'Premier Sapphire Card',
    type: 'credit',
    mask: String(Math.floor(1000 + Math.random() * 9000)),
    balance: Math.floor(Math.random() * 1500) + 200,
    limit: 6000,
    apr: 24.99,
    minPayment: 40.00,
    dueDate: '2026-11-18',
    color: '#0284c7',
    isShared: false
  };

  data.accounts.push(newAccount);
  writeData(data);
  res.json({ success: true, account: newAccount });
});

// AI Advisor chat tailored to the logged-in user
app.post('/api/ai/chat', async (req, res) => {
  const { message, userId } = req.body;
  const data = readData();

  const currentUser = data.users.find(u => u.id === userId) || data.users[0];
  const userCards = data.accounts.filter(a => a.ownerId === currentUser.id && a.type === 'credit');
  const userChecking = data.accounts.filter(a => a.ownerId === currentUser.id && a.type === 'depository');
  const totalChecking = userChecking.reduce((s, a) => s + a.balance, 0);

  const sortedByApr = [...userCards].sort((a, b) => b.apr - a.apr);

  // Gemini API
  if (aiClient && process.env.GEMINI_API_KEY) {
    try {
      const prompt = `
You are Klarity, the personal AI Financial Advisor for a family.
You are talking directly to: ${currentUser.name} (${currentUser.role}).
Their personal financial snapshot:
- Personal Checking: $${totalChecking.toFixed(2)}
- Connected Credit Cards: ${userCards.map(c => `${c.institution} ${c.name}: $${c.balance} @ ${c.apr}% APR (Min $${c.minPayment})`).join(' | ')}
- Household Utility Bills: ${data.bills.map(b => `${b.name}: $${b.expectedAmount} due ${b.nextDueDate}`).join(' | ')}

Question from ${currentUser.name}: "${message}"
Give personalized, friendly, mathematically sound advice.
`;
      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      return res.json({ reply: response.text });
    } catch (err) {
      console.warn('Gemini API call failed:', err.message);
    }
  }

  // Smart fallback tailored to the user
  const msg = (message || '').toLowerCase();
  let reply = '';

  if (msg.includes('pay off') || msg.includes('debt') || msg.includes('card')) {
    if (sortedByApr.length > 0) {
      const top = sortedByApr[0];
      reply = `### 💡 Personalized Debt Payoff for ${currentUser.name}

1. **Top Priority (Avalanche):** Pay off your **${top.institution} ${top.name}** first!
   * **Balance:** $${top.balance.toFixed(2)}
   * **Interest Rate:** **${top.apr}% APR** (Your highest cost debt)
2. **Strategy:** Pay minimums on any other cards and put your extra savings toward the ${top.institution} card.`;
    } else {
      reply = `Great news, ${currentUser.name}! You currently have no high-interest credit card debt linked to your profile! 🎉`;
    }
  } else if (msg.includes('bill') || msg.includes('pg&e') || msg.includes('water') || msg.includes('fresno')) {
    reply = `### 📅 Household Bills Overview for ${currentUser.name}

Here are the upcoming household utility bills for this month:
${data.bills.slice(0, 4).map(b => `* **${b.name}**: $${b.expectedAmount.toFixed(2)} due ${b.nextDueDate} (${b.status})`).join('\n')}`;
  } else {
    reply = `Hello ${currentUser.name}! I am **Klarity**, your personal financial advisor. You have **${userCards.length} personal cards** connected. How can I help with your budget, bills, or payoff goals today?`;
  }

  res.json({ reply });
});

// Serve frontend in production/single-port mode
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Klarity Server running on http://localhost:${PORT}`);
});
