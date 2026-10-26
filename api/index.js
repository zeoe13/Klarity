const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// In Vercel serverless environment, local filesystem root is read-only; use /tmp or memory
const DATA_FILE = process.env.VERCEL ? '/tmp/klarity_data.json' : path.join(__dirname, '../server/data.json');

// Encryption utilities for storing API keys & secrets securely server-side
const ENCRYPTION_SECRET = process.env.SETTINGS_ENCRYPTION_KEY || 'klarity-aes-secure-encryption-key-32-chars!!';
const IV_LENGTH = 16;

function encrypt(text) {
  if (!text) return '';
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = crypto.createHash('sha256').update(String(ENCRYPTION_SECRET)).digest();
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  if (!text || !text.includes(':')) return '';
  try {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const key = crypto.createHash('sha256').update(String(ENCRYPTION_SECRET)).digest();
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch (err) {
    console.error('Decryption error:', err.message);
    return '';
  }
}

function maskSecret(val) {
  if (!val || val.length < 8) return '••••••••';
  return val.slice(0, 6) + '••••••••' + val.slice(-4);
}

// Default initial seed data without fake transactions, cards, or fake bills
const initialSeedData = {
  users: [
    {
      id: "u-ziyad",
      email: "zeoe13@gmail.com",
      name: "Ziyad Elmahi",
      avatar: "",
      role: "Primary Member"
    }
  ],
  accounts: [],
  bills: [],
  subscriptions: [],
  transactions: [],
  plaidItems: [],
  settings: {
    ai: {
      provider: "gemini",
      model: "gemini-2.5-flash",
      encryptedKey: "",
      status: "not_connected",
      dataPermissions: {
        bills: true,
        subscriptions: true,
        cards: true,
        purchases: true
      }
    },
    plaid: {
      clientId: "",
      encryptedSecret: "",
      status: "not_connected"
    }
  }
};

let memoryData = JSON.parse(JSON.stringify(initialSeedData));

function readData() {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf8');
      return JSON.parse(raw);
    }
  } catch (err) {
    console.error('Error reading data:', err.message);
  }
  return memoryData;
}

function writeData(data) {
  memoryData = data;
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.warn('File write note (using memory store fallback):', err.message);
    return false;
  }
}

// Plaid Client Helper
function getPlaidClient() {
  const data = readData();
  const clientId = process.env.PLAID_CLIENT_ID || data.settings?.plaid?.clientId;
  const secret = process.env.PLAID_SECRET || (data.settings?.plaid?.encryptedSecret ? decrypt(data.settings.plaid.encryptedSecret) : '');
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

// Auto-categorize
function categorizeTransaction(name) {
  const n = (name || '').toLowerCase();
  if (n.includes('electric') || n.includes('pge') || n.includes('water') || n.includes('utility') || n.includes('gas')) return 'Utilities';
  if (n.includes('rent') || n.includes('mortgage') || n.includes('lease') || n.includes('apartment')) return 'Housing';
  if (n.includes('safeway') || n.includes('trader joe') || n.includes('grocery') || n.includes('market') || n.includes('whole foods')) return 'Groceries';
  if (n.includes('shell') || n.includes('chevron') || n.includes('gas station') || n.includes('fuel')) return 'Transportation';
  if (n.includes('netflix') || n.includes('spotify') || n.includes('hulu') || n.includes('disney') || n.includes('apple') || n.includes('google storage')) return 'Subscriptions';
  if (n.includes('payroll') || n.includes('salary') || n.includes('deposit') || n.includes('direct dep') || n.includes('paycheck')) return 'Income';
  return 'General';
}

// Helper: Calculate Due Date from Day of Month
function calculateNextDueDate(dueDay) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();
  const currentDay = now.getDate();

  let targetMonth = currentMonth;
  let targetYear = currentYear;

  if (dueDay < currentDay) {
    targetMonth += 1;
    if (targetMonth > 11) {
      targetMonth = 0;
      targetYear += 1;
    }
  }

  const dueDate = new Date(targetYear, targetMonth, dueDay);
  return dueDate.toISOString().split('T')[0];
}

// =========================================================================
// API ROUTES
// =========================================================================

// 1. Authentication Routes
app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const data = readData();
  const existing = (data.users || []).find(u => u.email.toLowerCase() === email.toLowerCase());
  if (existing) {
    return res.status(400).json({ error: 'User already exists with this email' });
  }

  const newUser = {
    id: `u-${Date.now()}`,
    email,
    name: name || email.split('@')[0],
    role: (data.users || []).length === 0 ? 'Primary Member' : 'Member',
    avatar: ''
  };

  data.users = data.users || [];
  data.users.push(newUser);
  writeData(data);

  res.json({ user: newUser });
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const data = readData();
  let user = (data.users || []).find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    user = {
      id: `u-${Date.now()}`,
      email,
      name: email.split('@')[0],
      role: (data.users || []).length === 0 ? 'Primary Member' : 'Member',
      avatar: ''
    };
    data.users = data.users || [];
    data.users.push(user);
    writeData(data);
  }

  res.json({ user });
});

app.post('/api/auth/google', (req, res) => {
  const { email, name, avatar } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required from Google profile' });
  }

  const data = readData();
  let user = (data.users || []).find(u => u.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    user = {
      id: `u-${Date.now()}`,
      email,
      name: name || email.split('@')[0],
      avatar: avatar || '',
      role: (data.users || []).length === 0 ? 'Primary Member' : 'Member'
    };
    data.users = data.users || [];
    data.users.push(user);
    writeData(data);
  } else if (name || avatar) {
    if (name) user.name = name;
    if (avatar) user.avatar = avatar;
    writeData(data);
  }

  res.json({ user });
});

// 2. Settings Endpoints (Encrypted Server Storage)
app.get('/api/settings', (req, res) => {
  const data = readData();
  const user = data.users?.[0] || { name: 'Ziyad Elmahi', email: 'zeoe13@gmail.com' };
  const ai = data.settings?.ai || {
    provider: 'gemini',
    model: 'gemini-2.5-flash',
    encryptedKey: '',
    status: 'not_connected',
    dataPermissions: { bills: true, subscriptions: true, cards: true, purchases: true }
  };
  const plaid = data.settings?.plaid || { clientId: '', encryptedSecret: '', status: 'not_connected' };

  res.json({
    user: {
      name: user.name || 'Ziyad Elmahi',
      email: user.email || 'zeoe13@gmail.com'
    },
    ai: {
      provider: ai.provider || 'anthropic',
      model: ai.model || 'claude-3-7-sonnet-20250219',
      hasKey: Boolean(ai.encryptedKey),
      maskedKey: ai.encryptedKey ? maskSecret(decrypt(ai.encryptedKey)) : '',
      status: ai.encryptedKey ? (ai.status || 'connected') : 'not_connected',
      dataPermissions: ai.dataPermissions || { bills: true, subscriptions: true, cards: true, purchases: true }
    },
    plaid: {
      clientId: plaid.clientId || '',
      hasSecret: Boolean(plaid.encryptedSecret),
      maskedSecret: plaid.encryptedSecret ? maskSecret(decrypt(plaid.encryptedSecret)) : '',
      status: (plaid.clientId && plaid.encryptedSecret) ? (plaid.status || 'connected') : 'not_connected',
      connectedItemsCount: (data.plaidItems || []).length
    },
    plaidItems: (data.plaidItems || []).map(item => ({
      itemId: item.itemId,
      institution: item.institution || 'Connected Bank',
      connectedAt: item.connectedAt,
      accounts: (data.accounts || []).filter(a => a.institution === item.institution)
    }))
  });
});

app.post('/api/settings/profile', (req, res) => {
  const { name } = req.body;
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
  const data = readData();
  if (!data.users || data.users.length === 0) {
    data.users = [{ id: 'u-ziyad', name: name.trim(), email: 'zeoe13@gmail.com' }];
  } else {
    data.users[0].name = name.trim();
  }
  writeData(data);
  res.json({ success: true, name: name.trim() });
});

// Test and save AI API key server-side
app.post('/api/settings/ai-key/test-and-save', async (req, res) => {
  const { provider = 'anthropic', model, apiKey, dataPermissions } = req.body;
  if (!apiKey || !apiKey.trim()) {
    return res.status(400).json({ success: false, error: 'API key is required' });
  }

  const keyToTest = apiKey.trim();
  let isValid = false;
  let testError = '';

  try {
    if (provider === 'anthropic') {
      const targetModel = model || 'claude-3-7-sonnet-20250219';
      const testRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': keyToTest,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model: targetModel,
          max_tokens: 1,
          messages: [{ role: 'user', content: 'hi' }]
        })
      });

      if (testRes.ok || testRes.status === 200) {
        isValid = true;
      } else {
        const errJson = await testRes.json().catch(() => ({}));
        testError = errJson?.error?.message || `Anthropic error: HTTP ${testRes.status}`;
      }
    } else if (provider === 'openai') {
      const testRes = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${keyToTest}` }
      });
      if (testRes.ok) {
        isValid = true;
      } else {
        const errJson = await testRes.json().catch(() => ({}));
        testError = errJson?.error?.message || `OpenAI error: HTTP ${testRes.status}`;
      }
    } else if (provider === 'gemini') {
      const testRes = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${keyToTest}`);
      if (testRes.ok) {
        isValid = true;
      } else {
        const errJson = await testRes.json().catch(() => ({}));
        testError = errJson?.error?.message || `Gemini error: HTTP ${testRes.status}`;
      }
    } else {
      testError = `Unknown provider: ${provider}`;
    }
  } catch (err) {
    testError = err.message || 'Network test failed';
  }

  if (!isValid) {
    return res.status(400).json({
      success: false,
      status: 'invalid_key',
      error: testError || 'Key verification failed. Please check the API key and provider.'
    });
  }

  // Key is valid! Save encrypted server-side
  const data = readData();
  if (!data.settings) data.settings = {};
  data.settings.ai = {
    provider,
    model: model || (provider === 'anthropic' ? 'claude-3-7-sonnet-20250219' : provider === 'openai' ? 'gpt-4o' : 'gemini-2.5-flash'),
    encryptedKey: encrypt(keyToTest),
    status: 'connected',
    dataPermissions: dataPermissions || { bills: true, subscriptions: true, cards: true, purchases: true }
  };
  writeData(data);

  return res.json({
    success: true,
    status: 'connected',
    maskedKey: maskSecret(keyToTest),
    provider,
    model: data.settings.ai.model,
    dataPermissions: data.settings.ai.dataPermissions
  });
});

app.post('/api/settings/ai-key/remove', (req, res) => {
  const data = readData();
  if (!data.settings) data.settings = {};
  data.settings.ai = {
    provider: data.settings.ai?.provider || 'anthropic',
    model: data.settings.ai?.model || 'claude-3-7-sonnet-20250219',
    encryptedKey: '',
    status: 'not_connected',
    dataPermissions: data.settings.ai?.dataPermissions || { bills: true, subscriptions: true, cards: true, purchases: true }
  };
  writeData(data);
  res.json({ success: true, status: 'not_connected' });
});

app.post('/api/settings/ai-permissions', (req, res) => {
  const { dataPermissions } = req.body;
  const data = readData();
  if (!data.settings) data.settings = {};
  if (!data.settings.ai) data.settings.ai = {};
  data.settings.ai.dataPermissions = dataPermissions;
  writeData(data);
  res.json({ success: true, dataPermissions });
});

app.post('/api/settings/plaid', (req, res) => {
  const { clientId, secret } = req.body;
  const data = readData();
  if (!data.settings) data.settings = {};
  const currentPlaid = data.settings.plaid || {};

  data.settings.plaid = {
    clientId: clientId || currentPlaid.clientId || '',
    encryptedSecret: secret ? encrypt(secret) : (currentPlaid.encryptedSecret || ''),
    status: (clientId || currentPlaid.clientId) ? 'connected' : 'not_connected'
  };
  writeData(data);

  res.json({
    success: true,
    clientId: data.settings.plaid.clientId,
    maskedSecret: data.settings.plaid.encryptedSecret ? maskSecret(decrypt(data.settings.plaid.encryptedSecret)) : '',
    status: data.settings.plaid.status
  });
});

// 3. Plaid Link & Webhook Endpoints
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

app.post('/api/plaid/exchange-public-token', async (req, res) => {
  const { public_token, metadata, userId } = req.body;
  const plaidClient = getPlaidClient();

  if (!plaidClient) {
    return res.status(400).json({ error: 'Plaid keys not configured' });
  }

  try {
    const tokenResponse = await plaidClient.itemPublicTokenExchange({ public_token });
    const accessToken = tokenResponse.data.access_token;
    const itemId = tokenResponse.data.item_id;

    const accountsResponse = await plaidClient.accountsBalanceGet({ access_token: accessToken });
    const data = readData();

    const addedAccounts = [];
    for (const acc of accountsResponse.data.accounts) {
      const newAcc = {
        id: `acc-${acc.account_id}`,
        ownerId: userId || 'u-ziyad',
        institution: metadata?.institution?.name || 'Connected Bank',
        name: acc.name,
        type: acc.type === 'credit' ? 'credit' : 'depository',
        balance: acc.balances?.current || 0,
        limit: acc.balances?.limit || (acc.type === 'credit' ? 3000 : 0),
        apr: acc.type === 'credit' ? 22.9 : 0,
        mask: acc.mask || '0000',
        minPayment: acc.type === 'credit' ? Math.max(35, Math.round((acc.balances?.current || 0) * 0.025)) : 0
      };
      addedAccounts.push(newAcc);
    }

    data.accounts = (data.accounts || []).filter(a => !addedAccounts.some(na => na.id === a.id)).concat(addedAccounts);
    data.plaidItems = data.plaidItems || [];
    data.plaidItems.push({
      itemId,
      accessToken,
      institution: metadata?.institution?.name || 'Connected Bank',
      institutionId: metadata?.institution?.institution_id,
      accountsCount: addedAccounts.length,
      connectedAt: new Date().toISOString()
    });
    writeData(data);

    res.json({ success: true, accounts: addedAccounts, plaidItems: data.plaidItems });
  } catch (err) {
    console.error('Plaid exchange error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.error_message || err.message });
  }
});

// Plaid Items Management (List & Disconnect Bank)
app.get('/api/plaid/items', (req, res) => {
  const data = readData();
  const items = (data.plaidItems || []).map(item => ({
    itemId: item.itemId,
    institution: item.institution || 'Connected Bank',
    connectedAt: item.connectedAt,
    accounts: (data.accounts || []).filter(a => a.institution === item.institution)
  }));
  res.json({ items });
});

app.delete('/api/plaid/items/:itemId', (req, res) => {
  const { itemId } = req.params;
  const data = readData();
  const targetItem = (data.plaidItems || []).find(i => i.itemId === itemId);
  if (targetItem) {
    const instName = targetItem.institution;
    data.accounts = (data.accounts || []).filter(a => a.institution !== instName);
    data.plaidItems = data.plaidItems.filter(i => i.itemId !== itemId);
    writeData(data);
  }
  res.json({ success: true });
});

// 4. Financial Data Overview
app.get('/api/data', (req, res) => {
  const { userId } = req.query;
  const data = readData();

  const userAccounts = (data.accounts || []).filter(a => !userId || a.ownerId === userId);
  const userChecking = userAccounts.filter(a => a.type === 'depository');
  const userCards = userAccounts.filter(a => a.type === 'credit');

  const totalChecking = userChecking.reduce((sum, a) => sum + Number(a.balance || 0), 0);
  const totalCreditDebt = userCards.reduce((sum, a) => sum + Number(a.balance || 0), 0);
  const totalCreditLimit = userCards.reduce((sum, a) => sum + Number(a.limit || 0), 0);

  const activeBills = (data.bills || []).filter(b => b.status !== 'archived');
  const totalMonthlyBills = activeBills.reduce((sum, b) => sum + Number(b.expectedAmount || 0), 0);
  const subscriptions = data.subscriptions || [];
  const totalSubscriptions = subscriptions.reduce((sum, s) => sum + Number(s.amount || 0), 0);

  res.json({
    users: data.users || [],
    accounts: userAccounts,
    bills: activeBills,
    subscriptions,
    transactions: (data.transactions || []).slice(0, 50),
    metrics: {
      totalChecking,
      totalCreditDebt,
      totalCreditLimit,
      totalMonthlyBills,
      totalSubscriptions,
      netCash: totalChecking - totalCreditDebt
    }
  });
});

// 5. Account Management
app.post('/api/accounts', (req, res) => {
  const { name, institution, type, balance, limit, apr, minPayment, mask, ownerId } = req.body;
  const data = readData();

  const newAccount = {
    id: `acc-${Date.now()}`,
    ownerId: ownerId || 'u-ziyad',
    name: name || 'Account',
    institution: institution || 'Manual Bank',
    type: type || 'credit',
    balance: parseFloat(balance || 0),
    limit: parseFloat(limit || 0),
    apr: parseFloat(apr || 0),
    minPayment: parseFloat(minPayment || 0),
    mask: mask || String(Math.floor(1000 + Math.random() * 9000))
  };

  data.accounts = data.accounts || [];
  data.accounts.push(newAccount);
  writeData(data);

  res.json({ success: true, account: newAccount });
});

app.delete('/api/accounts/:id', (req, res) => {
  const { id } = req.params;
  const data = readData();
  data.accounts = (data.accounts || []).filter(a => a.id !== id);
  writeData(data);
  res.json({ success: true });
});

// 6. Bills Management
app.post('/api/bills', (req, res) => {
  const { name, category, expectedAmount, dueDay, nextDueDate, autopay, recurrence } = req.body;
  const data = readData();

  const newBill = {
    id: `bill-${Date.now()}`,
    name: name || 'Utility Bill',
    category: category || 'Utilities',
    expectedAmount: parseFloat(expectedAmount || 0),
    dueDay: parseInt(dueDay || 15),
    nextDueDate: nextDueDate || calculateNextDueDate(parseInt(dueDay || 15)),
    autopay: Boolean(autopay),
    status: 'pending',
    recurrence: recurrence || 'monthly'
  };

  data.bills = data.bills || [];
  data.bills.push(newBill);
  writeData(data);

  res.json({ success: true, bill: newBill });
});

app.post('/api/bills/:id/pay', (req, res) => {
  const { id } = req.params;
  const data = readData();
  const bill = (data.bills || []).find(b => b.id === id);
  if (!bill) return res.status(404).json({ error: 'Bill not found' });

  bill.status = 'paid';
  bill.lastPaidDate = new Date().toISOString().split('T')[0];

  // Add recorded transaction
  data.transactions = data.transactions || [];
  data.transactions.unshift({
    id: `tx-bill-${Date.now()}`,
    name: `Payment: ${bill.name}`,
    category: bill.category || 'Utilities',
    amount: bill.expectedAmount,
    date: new Date().toISOString().split('T')[0],
    account: 'Checking'
  });

  writeData(data);
  res.json({ success: true, bill });
});

// 7. Transactions Management
app.post('/api/transactions', (req, res) => {
  const { name, amount, category, date, account } = req.body;
  const data = readData();

  const newTx = {
    id: `tx-${Date.now()}`,
    name: name || 'Purchase',
    amount: parseFloat(amount || 0),
    category: category || categorizeTransaction(name),
    date: date || new Date().toISOString().split('T')[0],
    account: account || 'Checking'
  };

  data.transactions = data.transactions || [];
  data.transactions.unshift(newTx);
  writeData(data);

  res.json({ success: true, transaction: newTx });
});

app.delete('/api/transactions/:id', (req, res) => {
  const { id } = req.params;
  const data = readData();
  data.transactions = (data.transactions || []).filter(t => t.id !== id);
  writeData(data);
  res.json({ success: true });
});

// 8. Subscriptions Management
app.get('/api/subscriptions', (req, res) => {
  const data = readData();
  res.json(data.subscriptions || []);
});

app.post('/api/subscriptions', (req, res) => {
  const { name, amount, renewDay, account } = req.body;
  const data = readData();

  const newSub = {
    id: `sub-${Date.now()}`,
    name: name || 'Subscription',
    amount: parseFloat(amount || 0),
    renewDay: parseInt(renewDay || 1),
    account: account || 'Everyday Rewards',
    active: true
  };

  data.subscriptions = data.subscriptions || [];
  data.subscriptions.push(newSub);
  writeData(data);

  res.json({ success: true, subscription: newSub });
});

app.delete('/api/subscriptions/:id', (req, res) => {
  const { id } = req.params;
  const data = readData();
  data.subscriptions = (data.subscriptions || []).filter(s => s.id !== id);
  writeData(data);
  res.json({ success: true });
});

// 9. Document & Bill Scanning Endpoint
app.post('/api/bills/scan', async (req, res) => {
  const { text, fileData } = req.body;
  const content = text || '';

  // Extract utility bill patterns
  let amount = 0;
  let biller = 'Utility Provider';
  let dueDate = calculateNextDueDate(15);

  const amountMatch = content.match(/\$\s?([0-9]+(?:\.[0-9]{2})?)/);
  if (amountMatch) amount = parseFloat(amountMatch[1]);

  if (/pge|pacific gas|electric/i.test(content)) biller = 'PG&E Electric';
  else if (/water|fresno/i.test(content)) biller = 'Fresno City Water';
  else if (/rent|lease|mortgage/i.test(content)) biller = 'Apartment Rent';
  else if (/at&t|verizon|t-mobile|comcast|xfinity/i.test(content)) biller = 'Telecom & Internet';

  const dateMatch = content.match(/(?:due|by|date)[:\s]+([A-Za-z0-9\/\-\, ]{6,15})/i);
  if (dateMatch) dueDate = dateMatch[1].trim();

  const data = readData();
  const newBill = {
    id: `bill-scanned-${Date.now()}`,
    name: biller,
    category: 'Utilities',
    expectedAmount: amount || 85.00,
    dueDay: 15,
    nextDueDate: dueDate,
    autopay: false,
    status: 'pending'
  };

  data.bills = data.bills || [];
  data.bills.push(newBill);

  data.transactions = data.transactions || [];
  data.transactions.unshift({
    id: `tx-scanned-${Date.now()}`,
    name: biller,
    amount: amount || 85.00,
    category: 'Utilities',
    date: new Date().toISOString().split('T')[0],
    account: 'Checking'
  });

  writeData(data);
  res.json({ success: true, summary: { biller, amount: newBill.expectedAmount, nextDueDate: dueDate } });
});


// Live Web Search Helper for Market Research & Real-Time Card/Bank Offers
async function performWebSearch(query) {
  try {
    const res = await fetch('https://lite.duckduckgo.com/lite/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      },
      body: `q=${encodeURIComponent(query)}`
    });
    if (!res.ok) return '';
    const html = await res.text();
    const tdRe = /<td[^>]*>([\s\S]*?)<\/td>/g;
    let matches = [];
    let m;
    while ((m = tdRe.exec(html)) !== null && matches.length < 12) {
      const text = m[1].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      if (text.length > 35 && !text.includes('DuckDuckGo') && !text.includes('Sponsored link')) {
        matches.push(text);
      }
    }
    return matches.slice(0, 5).map(item => `- ${item}`).join('\n');
  } catch (err) {
    console.warn('Web search lookup note:', err.message);
    return '';
  }
}

function shouldPerformWebSearch(message) {
  const m = (message || '').toLowerCase();
  const searchKeywords = [
    'card', 'offer', 'apr', 'transfer', 'rate', 'recommend', 'compare', 'deal', 
    'best', 'zero', '0%', '0 apr', 'signup', 'bonus', 'bank', 'savings', 
    'high yield', 'hysa', 'loan', 'promo', 'current', 'today', 'market', 
    'utility', 'rebate', 'tax', 'cost', 'alternative', 'cheaper', 'funds'
  ];
  return searchKeywords.some(k => m.includes(k));
}

// 10. AI Advisor Chat with Navigation Capabilities & User Key Encryption
app.post('/api/ai/chat', async (req, res) => {
  const { message, userId, userMemory = [], clientApiKey, clientProvider, clientModel } = req.body;
  const data = readData();

  const aiConfig = data.settings?.ai || {};
  let rawApiKey = clientApiKey || (aiConfig.encryptedKey ? decrypt(aiConfig.encryptedKey) : '');

  // If serverless disk reset occurred and client has cached credentials, restore them into server data
  if (clientApiKey && !aiConfig.encryptedKey) {
    if (!data.settings) data.settings = {};
    data.settings.ai = {
      provider: clientProvider || 'gemini',
      model: clientModel || 'gemini-2.5-flash',
      encryptedKey: encrypt(clientApiKey),
      status: 'connected',
      dataPermissions: { bills: true, subscriptions: true, cards: true, purchases: true }
    };
    writeData(data);
  }

  if (!rawApiKey) {
    return res.json({
      needsKey: true,
      reply: "AI Advisor is not connected. Please connect your Anthropic, OpenAI, or Google Gemini API key in Settings > AI advisor to activate financial intelligence."
    });
  }

  const permissions = aiConfig.dataPermissions || { bills: true, subscriptions: true, cards: true, purchases: true };
  const provider = clientProvider || aiConfig.provider || 'gemini';
  let model = clientModel || aiConfig.model || (provider === 'anthropic' ? 'claude-3-7-sonnet-20250219' : provider === 'openai' ? 'gpt-4o' : 'gemini-2.5-flash');
  // Auto-upgrade deprecated gemini-2.0-flash to gemini-2.5-flash / gemini-1.5-flash
  if (model === 'gemini-2.0-flash') {
    model = 'gemini-2.5-flash';
  }

  const currentUser = (data.users || []).find(u => u.id === userId) || data.users?.[0] || { name: 'Ziyad' };

  // Data restricted by user toggles
  const userCards = permissions.cards ? (data.accounts || []).filter(a => a.type === 'credit') : [];
  const userChecking = permissions.cards ? (data.accounts || []).filter(a => a.type === 'depository') : [];
  const userBills = permissions.bills ? (data.bills || []) : [];
  const userSubscriptions = permissions.subscriptions ? (data.subscriptions || []) : [];
  const userTransactions = permissions.purchases ? (data.transactions || []).slice(0, 10) : [];

  const memoryContext = (userMemory && userMemory.length > 0)
    ? `\n\nUser Financial Preferences & Memory:\n${userMemory.map(m => `- ${m}`).join('\n')}`
    : '';

  // Perform real-time web search if the user asks about credit card offers, 0% APR, balance transfers, or market rates
  let liveWebSearchContext = '';
  if (shouldPerformWebSearch(message)) {
    const webResults = await performWebSearch(message);
    if (webResults) {
      liveWebSearchContext = `\n\nLive Web Search Results (Real-Time Market Data):\n${webResults}\nUse these live web findings to recommend specific current cards (e.g. Citi Simplicity, Wells Fargo Reflect, Chase Freedom, Discover it, etc.), exact 0% APR intro periods (e.g. 18-21 months), transfer fee percentages, and requirements.`;
    }
  }

  const systemContext = `
You are Klarity, the personal AI Financial Advisor for ${currentUser.name}.
Actual Connected Finances for ${currentUser.name} (strictly respecting permissions):
- Checking Accounts (${permissions.cards ? 'Permitted' : 'Access Restricted'}): ${userChecking.length > 0 ? userChecking.map(c => `${c.institution} ${c.name}: $${Number(c.balance).toFixed(2)}`).join(' | ') : 'None connected'}
- Credit Cards (${permissions.cards ? 'Permitted' : 'Access Restricted'}): ${userCards.length > 0 ? userCards.map(c => `${c.institution} ${c.name}: $${Number(c.balance).toFixed(2)} @ ${c.apr}% APR (Min: $${c.minPayment || 0})`).join(' | ') : 'None connected'}
- Upcoming Bills (${permissions.bills ? 'Permitted' : 'Access Restricted'}): ${userBills.length > 0 ? userBills.map(b => `${b.name}: $${Number(b.expectedAmount).toFixed(2)} due ${b.nextDueDate || b.dueDate || 'Day ' + b.dueDay}`).join(' | ') : 'None scheduled'}
- Subscriptions (${permissions.subscriptions ? 'Permitted' : 'Access Restricted'}): ${userSubscriptions.length > 0 ? userSubscriptions.map(s => `${s.name}: $${Number(s.amount).toFixed(2)}/mo`).join(' | ') : 'None added'}
- Recent Purchases (${permissions.purchases ? 'Permitted' : 'Access Restricted'}): ${userTransactions.length > 0 ? userTransactions.map(t => `${t.name}: ${Math.abs(Number(t.amount)).toFixed(2)} on ${t.date}`).join(' | ') : 'None recorded'}${memoryContext}${liveWebSearchContext}

Rules:
1. Provide concise, clear, and empathetic financial guidance based strictly on real numbers.
2. AUTOMATED ACTIONS: If the user asks you to add, track, or record a subscription, bill, or purchase (e.g. "add a subscription that i pay for about 20 bucks a month on netflix"), you MUST execute it by outputting an ACTION tag in your response:
   - For Subscriptions: [ACTION:ADD_SUBSCRIPTION:{"name":"Netflix","amount":20,"billingCycle":"monthly"}]
   - For Bills: [ACTION:ADD_BILL:{"name":"Bill Name","expectedAmount":50,"dueDay":15}]
   - For Purchases: [ACTION:ADD_TRANSACTION:{"name":"Store Name","amount":25,"category":"General"}]
   Always warmly confirm in your response that you have automatically added it to their records.
2. If the user asks to view or go to a page or section in the app (e.g. "show me my subscriptions", "go to bills", "open cards", "show purchases", "overview", or "settings"), you MUST include a navigation tag at the end of your response:
   - For Subscriptions: [NAVIGATE:subscriptions]
   - For Bills: [NAVIGATE:bills]
   - For Cards: [NAVIGATE:cards]
   - For Transactions / Purchases: [NAVIGATE:transactions]
   - For Overview / Dashboard: [NAVIGATE:dashboard]
   - For Settings: [NAVIGATE:settings]
`.trim();

  try {
    let reply = '';

    if (provider === 'anthropic') {
      const aiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': rawApiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify({
          model,
          max_tokens: 1024,
          system: systemContext,
          messages: [{ role: 'user', content: message }]
        })
      });
      if (aiRes.ok) {
        const aiJson = await aiRes.json();
        reply = aiJson.content?.[0]?.text;
      } else {
        const errJson = await aiRes.json().catch(() => ({}));
        reply = `Anthropic API error: ${errJson?.error?.message || aiRes.statusText}`;
      }
    } else if (provider === 'openai') {
      const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${rawApiKey}`
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: 'system', content: systemContext },
            { role: 'user', content: message }
          ]
        })
      });
      if (aiRes.ok) {
        const aiJson = await aiRes.json();
        reply = aiJson.choices?.[0]?.message?.content;
      } else {
        const errJson = await aiRes.json().catch(() => ({}));
        reply = `OpenAI API error: ${errJson?.error?.message || aiRes.statusText}`;
      }
    } else if (provider === 'gemini') {
      const candidateModels = [model, 'gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
      let succeeded = false;

      for (const curModel of candidateModels) {
        if (succeeded) break;
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${curModel}:generateContent?key=${rawApiKey}`;
        const geminiPayload = {
          contents: [
            { role: 'user', parts: [{ text: `${systemContext}\n\nUser Question: ${message}` }] }
          ]
        };
        if (shouldPerformWebSearch(message)) {
          geminiPayload.tools = [{ googleSearch: {} }];
        }

        let aiRes = await fetch(geminiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(geminiPayload)
        });

        if (!aiRes.ok && geminiPayload.tools) {
          delete geminiPayload.tools;
          aiRes = await fetch(geminiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(geminiPayload)
          });
        }

        if (aiRes.ok) {
          const aiJson = await aiRes.json();
          reply = aiJson.candidates?.[0]?.content?.parts?.[0]?.text;
          if (reply) {
            succeeded = true;
            break;
          }
        } else {
          const errJson = await aiRes.json().catch(() => ({}));
          // If model is not found/deprecated, try the next candidate model
          if (aiRes.status === 404 || errJson?.error?.message?.includes('not found') || errJson?.error?.message?.includes('no longer available')) {
            continue;
          }
          reply = `Gemini API error: ${errJson?.error?.message || aiRes.statusText}`;
          break;
        }
      }
    }

    if (!reply) {
      reply = "I was unable to retrieve a response from your AI provider. Please verify your API key and model settings in Settings.";
    }

    let actionExecuted = null;

    // Execute Subscription Action
    const subActionMatch = reply.match(/\[ACTION:ADD_SUBSCRIPTION:([\s\S]*?)\]/i);
    if (subActionMatch) {
      try {
        const subData = JSON.parse(subActionMatch[1]);
        const newSub = {
          id: `sub-${Date.now()}`,
          name: subData.name || 'Subscription',
          amount: parseFloat(subData.amount || 0),
          renewDay: parseInt(subData.renewDay || 1),
          billingCycle: subData.billingCycle || 'monthly',
          account: subData.account || 'Everyday Rewards',
          active: true
        };
        data.subscriptions = data.subscriptions || [];
        data.subscriptions.push(newSub);
        writeData(data);
        actionExecuted = { type: 'subscription', item: newSub };
      } catch (err) {
        console.error('Error parsing subscription action:', err);
      }
    }

    // Execute Bill Action
    const billActionMatch = reply.match(/\[ACTION:ADD_BILL:([\s\S]*?)\]/i);
    if (billActionMatch) {
      try {
        const billData = JSON.parse(billActionMatch[1]);
        const newBill = {
          id: `bill-${Date.now()}`,
          name: billData.name || 'Utility Bill',
          category: billData.category || 'Utilities',
          expectedAmount: parseFloat(billData.expectedAmount || billData.amount || 0),
          dueDay: parseInt(billData.dueDay || 15),
          nextDueDate: billData.nextDueDate || calculateNextDueDate(parseInt(billData.dueDay || 15)),
          autopay: false,
          status: 'pending',
          recurrence: 'monthly'
        };
        data.bills = data.bills || [];
        data.bills.push(newBill);
        writeData(data);
        actionExecuted = { type: 'bill', item: newBill };
      } catch (err) {
        console.error('Error parsing bill action:', err);
      }
    }

    // Natural Language Fallback: if user specifically asks to add subscription (e.g. "add a subscription that i pay for about 20 bucks a month on netflix")
    if (!actionExecuted) {
      const msgLower = (message || '').toLowerCase();
      if ((msgLower.includes('add') || msgLower.includes('track') || msgLower.includes('record')) && msgLower.includes('subscription')) {
        // extract amount
        const amtMatch = message.match(/(?:\$|bucks|dollars|\b)([0-9]+(?:\.[0-9]{2})?)(?:\s*(?:bucks|dollars|\/mo|a month|per month))?/i);
        const parsedAmount = amtMatch ? parseFloat(amtMatch[1]) : 20.00;
        
        // extract service name
        let serviceName = 'Subscription';
        ['netflix', 'spotify', 'icloud', 'apple', 'chatgpt', 'hulu', 'disney', 'youtube', 'amazon prime', 'gym'].forEach(k => {
          if (msgLower.includes(k)) {
            serviceName = k === 'chatgpt' ? 'ChatGPT Plus' : (k.charAt(0).toUpperCase() + k.slice(1));
          }
        });

        const newSub = {
          id: `sub-${Date.now()}`,
          name: serviceName,
          amount: parsedAmount,
          renewDay: 1,
          billingCycle: 'monthly',
          account: 'Everyday Rewards',
          active: true
        };
        data.subscriptions = data.subscriptions || [];
        data.subscriptions.push(newSub);
        writeData(data);
        actionExecuted = { type: 'subscription', item: newSub };
        reply += `\n\nI've automatically added **${serviceName}** (${parsedAmount.toFixed(2)}/mo) to your Subscriptions!`;
      }
    }

    return res.json({ reply, actionExecuted });
  } catch (err) {
    console.error('AI chat route error:', err);
    return res.json({ reply: `Advisor error: ${err.message}` });
  }
});

// Also copy to server for local dev
const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production' && require.main === module) {
  app.listen(PORT, () => {
    console.log(`Klarity backend running on port ${PORT}`);
  });
}

module.exports = app;
