const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
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
    return { users: [], accounts: [], bills: [], transactions: [], settings: {} };
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

// Plaid Client Helper
function getPlaidClient() {
  const data = readData();
  const clientId = process.env.PLAID_CLIENT_ID || data.settings?.plaidClientId;
  const secret = process.env.PLAID_SECRET || data.settings?.plaidSecret;
  const env = process.env.PLAID_ENV || data.settings?.plaidEnv || 'sandbox';

  if (!clientId || !secret) return null;

  const basePath = PlaidEnvironments[env] || PlaidEnvironments.sandbox;
  const configuration = new Configuration({
    basePath,
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': clientId,
        'PLAID-SECRET': secret,
      },
    },
  });

  return new PlaidApi(configuration);
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

// ================= AUTH ROUTES (Google Sign-In) =================

// Standard Email Sign Up & Sign In Endpoints
app.post('/api/auth/register', (req, res) => {
  const { email, password, name } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const data = readData();
  const normalizedEmail = email.toLowerCase().trim();
  const existing = (data.users || []).find(u => u.email?.toLowerCase() === normalizedEmail);
  if (existing) {
    return res.status(400).json({ error: 'An account with this email already exists. Please Sign In.' });
  }

  const newUser = {
    id: `u-${Date.now()}`,
    email: normalizedEmail,
    name: name?.trim() || normalizedEmail.split('@')[0],
    password: password,
    avatar: '👤',
    role: (data.users || []).length === 0 ? 'Head of Household' : 'Family Member',
    createdAt: new Date().toISOString()
  };

  data.users.push(newUser);
  writeData(data);

  const { password: _, ...safeUser } = newUser;
  res.json({ success: true, user: safeUser, token: `token-${newUser.id}` });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const data = readData();
  const normalizedEmail = email.toLowerCase().trim();
  const user = (data.users || []).find(u => u.email?.toLowerCase() === normalizedEmail);

  if (!user) {
    return res.status(401).json({ error: 'No account found with this email. Please click "Sign Up" to create an account.' });
  }

  if (user.password && user.password !== password) {
    return res.status(401).json({ error: 'Incorrect password. Please try again.' });
  }

  const { password: _, ...safeUser } = user;
  res.json({ success: true, user: safeUser, token: `token-${user.id}` });
});

// Google Sign-In Endpoint
app.post('/api/auth/google', (req, res) => {
  const { email, name, picture, sub } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required from Google profile' });
  }

  const data = readData();
  let user = data.users.find(u => u.email === email || (sub && u.googleId === sub));

  if (!user) {
    user = {
      id: `u-${Date.now()}`,
      googleId: sub || '',
      email: email.toLowerCase().trim(),
      name: name || email.split('@')[0],
      avatar: picture || '👤',
      role: data.users.length === 0 ? 'Head of Household' : 'Family Member',
      createdAt: new Date().toISOString()
    };
    data.users.push(user);
    writeData(data);
  } else {
    // Update profile info if changed
    if (name) user.name = name;
    if (picture) user.avatar = picture;
    writeData(data);
  }

  res.json({ success: true, user, token: `token-${user.id}` });
});

// Settings Endpoints
app.get('/api/settings', (req, res) => {
  const data = readData();
  res.json({
    hasPlaidKeys: Boolean(process.env.PLAID_CLIENT_ID || data.settings?.plaidClientId),
    plaidEnv: process.env.PLAID_ENV || data.settings?.plaidEnv || 'sandbox',
    googleClientId: process.env.VITE_GOOGLE_CLIENT_ID || data.settings?.googleClientId || ''
  });
});

app.post('/api/settings', (req, res) => {
  const { plaidClientId, plaidSecret, plaidEnv, googleClientId } = req.body;
  const data = readData();
  data.settings = {
    ...data.settings,
    ...(plaidClientId ? { plaidClientId } : {}),
    ...(plaidSecret ? { plaidSecret } : {}),
    ...(plaidEnv ? { plaidEnv } : {}),
    ...(googleClientId ? { googleClientId } : {})
  };
  writeData(data);
  res.json({ success: true });
});

// ================= REAL PLAID BANK INTEGRATION =================

// Create Plaid Link Token
app.post('/api/plaid/create-link-token', async (req, res) => {
  const { userId } = req.body;
  const plaidClient = getPlaidClient();

  if (!plaidClient) {
    return res.status(400).json({
      error: 'Plaid API keys are not configured yet.',
      needsKeys: true
    });
  }

  try {
    const response = await plaidClient.linkTokenCreate({
      user: { client_user_id: userId || 'user-1' },
      client_name: 'Klarity',
      products: ['transactions'],
      country_codes: ['US'],
      language: 'en'
    });

    res.json({ link_token: response.data.link_token });
  } catch (err) {
    console.error('Plaid linkTokenCreate error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.error_message || err.message });
  }
});

// Exchange Public Token & Connect Real Bank / Cards
app.post('/api/plaid/exchange-public-token', async (req, res) => {
  const { public_token, metadata, userId } = req.body;
  const plaidClient = getPlaidClient();

  if (!plaidClient) {
    return res.status(400).json({ error: 'Plaid keys not configured' });
  }

  try {
    // 1. Exchange public token for permanent access token
    const tokenResponse = await plaidClient.itemPublicTokenExchange({ public_token });
    const accessToken = tokenResponse.data.access_token;
    const itemId = tokenResponse.data.item_id;

    // 2. Fetch real accounts and balances from the connected bank
    const accountsResponse = await plaidClient.accountsBalanceGet({ access_token: accessToken });
    const data = readData();

    const addedAccounts = [];
    for (const acc of accountsResponse.data.accounts) {
      const newAcc = {
        id: `acc-${acc.account_id}`,
        ownerId: userId || 'u1',
        institution: metadata?.institution?.name || 'Connected Bank',
        name: acc.name,
        type: acc.type === 'credit' ? 'credit' : 'depository',
        mask: acc.mask || 'XXXX',
        balance: acc.balances?.current || 0,
        limit: acc.balances?.limit || 0,
        apr: 0,
        minPayment: 0,
        dueDate: '',
        color: acc.type === 'credit' ? '#1e40af' : '#065f46',
        plaidAccessToken: accessToken,
        plaidItemId: itemId
      };
      data.accounts.push(newAcc);
      addedAccounts.push(newAcc);
    }

    // 3. Sync real transactions from the bank
    try {
      const txResponse = await plaidClient.transactionsSync({ access_token: accessToken });
      const addedTx = (txResponse.data.added || []).map(tx => ({
        id: `tx-${tx.transaction_id}`,
        accountId: `acc-${tx.account_id}`,
        ownerId: userId || 'u1',
        date: tx.date,
        name: tx.name,
        amount: Math.abs(tx.amount),
        category: autoCategorize(tx.name),
        isRecurring: /pg&e|fresno water|xfinity|t-mobile/.test((tx.name || '').toLowerCase())
      }));
      data.transactions.unshift(...addedTx);
    } catch (txErr) {
      console.warn('Initial transaction sync note:', txErr.message);
    }

    writeData(data);
    res.json({ success: true, accounts: addedAccounts });
  } catch (err) {
    console.error('Plaid exchange error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.error_message || err.message });
  }
});

// ================= DATA ROUTES (No fake items) =================

app.get('/api/data', (req, res) => {
  const data = readData();
  const currentUserId = req.query.userId || req.headers['x-user-id'];
  const showHousehold = req.query.household === 'true';

  const currentUser = data.users.find(u => u.id === currentUserId) || null;

  // Real accounts for logged-in user
  const visibleAccounts = (data.accounts || []).filter(acc => {
    if (showHousehold) return true;
    return acc.ownerId === currentUserId;
  });

  // Real bills
  const visibleBills = data.bills || [];

  // Real transactions for logged-in user
  const visibleTransactions = (data.transactions || []).filter(tx => {
    if (showHousehold) return true;
    return tx.ownerId === currentUserId;
  });

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
    currentUser,
    familyMembers: data.users || [],
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

// Manual Card Add
app.post('/api/accounts', (req, res) => {
  const { ownerId, institution, name, type, mask, balance, limit, apr, minPayment, dueDate } = req.body;
  const data = readData();

  const newAccount = {
    id: `acc-${Date.now()}`,
    ownerId: ownerId,
    institution: institution || 'My Bank',
    name: name || 'Account',
    type: type || 'credit',
    mask: mask || 'XXXX',
    balance: Number(balance) || 0,
    limit: Number(limit) || 0,
    apr: Number(apr) || 0,
    minPayment: Number(minPayment) || 0,
    dueDate: dueDate || '',
    color: type === 'credit' ? '#1e40af' : '#065f46'
  };

  data.accounts.push(newAccount);
  writeData(data);
  res.json({ success: true, account: newAccount });
});

// Delete Card
app.delete('/api/accounts/:id', (req, res) => {
  const data = readData();
  data.accounts = data.accounts.filter(a => a.id !== req.params.id);
  writeData(data);
  res.json({ success: true });
});

// Add Real Bill (PG&E, Fresno Water, Xfinity, T-Mobile)
app.post('/api/bills', (req, res) => {
  const { name, biller, category, expectedAmount, dueDay, frequency, assignedOwnerId, notes } = req.body;
  const data = readData();

  const newBill = {
    id: `bill-${Date.now()}`,
    name: name,
    biller: biller || name,
    category: category || autoCategorize(name),
    expectedAmount: Number(expectedAmount) || 0,
    dueDay: Number(dueDay) || 1,
    nextDueDate: `2026-11-${String(dueDay || 1).padStart(2, '0')}`,
    frequency: frequency || 'monthly',
    status: 'upcoming',
    assignedOwnerId: assignedOwnerId || '',
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

  writeData(data);
  res.json({ success: true, bill });
});

// Log purchase
app.post('/api/transactions', (req, res) => {
  const { accountId, ownerId, name, amount, date, category } = req.body;
  const data = readData();

  const detectedCategory = category || autoCategorize(name);
  const newTx = {
    id: `tx-${Date.now()}`,
    accountId: accountId || (data.accounts[0]?.id || ''),
    ownerId: ownerId,
    date: date || new Date().toISOString().split('T')[0],
    name: name || 'Purchase',
    amount: Number(amount) || 0,
    category: detectedCategory,
    isRecurring: /pg&e|fresno water|xfinity|t-mobile/.test((name || '').toLowerCase())
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
  let amount = 0;
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
    expectedAmount: amount || 0,
    dueDay: 15,
    nextDueDate,
    frequency: 'monthly',
    status: 'due_soon',
    assignedOwnerId: ownerId || '',
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

// AI Advisor chat
app.post('/api/ai/chat', async (req, res) => {
  const { message, userId } = req.body;
  const data = readData();

  const currentUser = data.users.find(u => u.id === userId) || { name: 'User' };
  const userCards = (data.accounts || []).filter(a => a.ownerId === userId && a.type === 'credit');
  const userChecking = (data.accounts || []).filter(a => a.ownerId === userId && a.type === 'depository');
  const totalChecking = userChecking.reduce((s, a) => s + a.balance, 0);

  const sortedByApr = [...userCards].sort((a, b) => b.apr - a.apr);

  if (aiClient && process.env.GEMINI_API_KEY) {
    try {
      const prompt = `
You are Klarity, the personal AI Financial Advisor for a family.
User: ${currentUser.name}.
Actual Connected Finances:
- Checking Accounts: ${userChecking.map(c => `${c.institution} ${c.name}: $${c.balance}`).join(' | ') || 'None connected yet'}
- Credit Cards: ${userCards.map(c => `${c.institution} ${c.name}: $${c.balance} @ ${c.apr}% APR`).join(' | ') || 'None connected yet'}
- Household Bills: ${data.bills.map(b => `${b.name}: $${b.expectedAmount} due ${b.nextDueDate}`).join(' | ') || 'None added yet'}

Question: "${message}"
Answer concisely, helpfully, and with empathy.
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

  // Fallback
  const msg = (message || '').toLowerCase();
  let reply = '';

  if (userCards.length === 0 && userChecking.length === 0) {
    reply = `Hello ${currentUser.name}! You haven't connected any real bank accounts or credit cards yet. Click **"Connect Real Bank via Plaid"** or **"Add Card Manually"** to link your first card, and I'll immediately start tracking your balances, APRs, and payoff strategy!`;
  } else if (msg.includes('pay off') || msg.includes('debt') || msg.includes('card')) {
    if (sortedByApr.length > 0) {
      const top = sortedByApr[0];
      reply = `### 💡 Real Debt Payoff Strategy for ${currentUser.name}\n\n* **Priority #1:** Pay off **${top.institution} ${top.name}** first (Balance: $${top.balance.toFixed(2)} at **${top.apr}% APR**). Put extra payments toward this card while paying minimums on others.`;
    } else {
      reply = `You have no high-interest credit card debt active on your connected cards, ${currentUser.name}! 🎉`;
    }
  } else {
    reply = `Hello ${currentUser.name}! I am **Klarity**. I am monitoring your real connected accounts and household utility bills. Ask me what bills are due or how to optimize your spending.`;
  }

  res.json({ reply });
});

// Production fallback
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
