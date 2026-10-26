const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// In Vercel serverless environment, local filesystem root is read-only; use /tmp or memory
const DATA_FILE = process.env.VERCEL ? '/tmp/klarity_data.json' : path.join(__dirname, '../server/data.json');

// Memory store fallback
let memoryData = {
  users: [],
  accounts: [],
  bills: [],
  transactions: [],
  settings: {}
};

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

// Auto-categorize
function autoCategorize(name) {
  const n = (name || '').toLowerCase();
  if (/pg&e|pacific gas|fresno water|xfinity|comcast|t-mobile|at&t|verizon|smud|edison|electric|water|utilities|waste|trash/.test(n)) return 'Utilities';
  if (/netflix|spotify|hulu|disney|max|paramount|apple tv|prime video|youtube|audible|crunchyroll/.test(n)) return 'Subscriptions';
  if (/steam|nintendo|playstation|xbox|roblox|epic games|riot|minecraft|v-bucks|robux/.test(n)) return 'Gaming';
  if (/amc|regal|cinemark|dave & buster|concert|ticketmaster|cinema|movie/.test(n)) return 'Entertainment';
  if (/trader joe|costco|safeway|whole foods|kroger|walmart|target|grocery|supermarket|aldi/.test(n)) return 'Groceries';
  if (/in-n-out|mcdonald|starbucks|chipotle|burger|pizza|doordash|ubereats|restaurant|cafe|taco/.test(n)) return 'Dining';
  if (/chevron|shell|arco|exxon|mobil|gas|fuel|speedway|76 station/.test(n)) return 'Transportation';
  return 'Other';
}

// 1. Standard Email Sign Up & Sign In Endpoints
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

// Google OAuth Auth Endpoint (kept as optional fallback)
app.post('/api/auth/google', (req, res) => {
  const { email, name, picture, sub } = req.body;
  if (!email) return res.status(400).json({ error: 'Email is required from Google profile' });

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
    if (name) user.name = name;
    if (picture) user.avatar = picture;
    writeData(data);
  }

  res.json({ success: true, user, token: `token-${user.id}` });
});

// 2. Settings Endpoints
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

// 3. Plaid Endpoints
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

    writeData(data);
    res.json({ success: true, accounts: addedAccounts });
  } catch (err) {
    console.error('Plaid exchange error:', err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data?.error_message || err.message });
  }
});

// 4. Data Endpoint
app.get('/api/data', (req, res) => {
  const data = readData();
  const currentUserId = req.query.userId || req.headers['x-user-id'];
  const showHousehold = req.query.household === 'true';

  const currentUser = data.users.find(u => u.id === currentUserId) || null;

  const visibleAccounts = (data.accounts || []).filter(acc => {
    if (showHousehold) return true;
    return acc.ownerId === currentUserId;
  });

  const visibleBills = data.bills || [];

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
    subscriptions: data.subscriptions || [],
    metrics: {
      totalChecking: Number(totalChecking.toFixed(2)),
      totalCreditDebt: Number(totalCreditDebt.toFixed(2)),
      totalMonthlyBills: Number(totalMonthlyBills.toFixed(2)),
      netWorthEstimate: Number((totalChecking - totalCreditDebt).toFixed(2))
    }
  });
});

// 5. Account Manual Creation & Deletion
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

app.delete('/api/accounts/:id', (req, res) => {
  const data = readData();
  data.accounts = (data.accounts || []).filter(a => a.id !== req.params.id);
  writeData(data);
  res.json({ success: true });
});

// 6. Bills Endpoints
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

app.post('/api/bills/:id/pay', (req, res) => {
  const data = readData();
  const bill = (data.bills || []).find(b => b.id === req.params.id);
  if (!bill) return res.status(404).json({ error: 'Bill not found' });

  bill.status = 'paid';
  bill.lastPaidDate = new Date().toISOString().split('T')[0];
  bill.lastPaidAmount = bill.expectedAmount;

  writeData(data);
  res.json({ success: true, bill });
});

// 7. Transactions
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

app.delete('/api/transactions/:id', (req, res) => {
  const data = readData();
  data.transactions = (data.transactions || []).filter(t => t.id !== req.params.id);
  writeData(data);
  res.json({ success: true });
});

// 7b. Subscriptions Endpoints
app.get('/api/subscriptions', (req, res) => {
  const data = readData();
  res.json({ subscriptions: data.subscriptions || [] });
});

app.post('/api/subscriptions', (req, res) => {
  const { name, amount, billingCycle, renewalDate, category, ownerId } = req.body;
  const data = readData();
  if (!data.subscriptions) data.subscriptions = [];
  const newSub = {
    id: `sub-${Date.now()}`,
    name: name || 'Subscription',
    amount: Number(amount) || 0,
    billingCycle: billingCycle || 'monthly',
    renewalDate: renewalDate || '1st of month',
    category: category || 'Entertainment',
    ownerId: ownerId || ''
  };
  data.subscriptions.push(newSub);
  writeData(data);
  res.json({ success: true, subscription: newSub });
});

app.delete('/api/subscriptions/:id', (req, res) => {
  const data = readData();
  data.subscriptions = (data.subscriptions || []).filter(s => s.id !== req.params.id);
  writeData(data);
  res.json({ success: true });
});

// 8. Bill scan & Ingest into Bills AND Purchases
app.post('/api/bills/scan', async (req, res) => {
  const { billText, ownerId } = req.body;
  if (!billText) return res.status(400).json({ error: 'billText is required' });

  let biller = 'Utility Provider';
  let category = 'Utilities';
  let amount = 145.00;
  let nextDueDate = '2026-11-20';

  // If Gemini API is available, use AI extraction for maximum accuracy
  if (process.env.GEMINI_API_KEY && billText.length > 10) {
    try {
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;
      const aiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: `Analyze this bill statement text or document filename: "${billText}".
Extract and return ONLY a raw JSON object with these keys:
{
  "biller": "clean biller or merchant name",
  "category": "Utilities" or "Subscriptions" or "Services" or "Other",
  "amount": numeric number only (e.g. 145.50),
  "dueDate": "formatted due date e.g. Nov 25, 2026 or 2026-11-25"
}`
            }]
          }]
        })
      });
      if (aiRes.ok) {
        const aiJson = await aiRes.json();
        const rawText = aiJson.candidates?.[0]?.content?.parts?.[0]?.text || '';
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          if (parsed.biller) biller = parsed.biller;
          if (parsed.category) category = parsed.category;
          if (parsed.amount && !isNaN(parsed.amount)) amount = Number(parsed.amount);
          if (parsed.dueDate) nextDueDate = parsed.dueDate;
        }
      }
    } catch (err) {
      console.warn('Gemini bill extraction error:', err.message);
    }
  }

  // Regex fallback if AI extraction didn't update defaults
  if (biller === 'Utility Provider') {
    const t = billText.toLowerCase();
    if (t.includes('pg&e') || t.includes('pacific gas')) {
      biller = 'Pacific Gas and Electric (PG&E)';
    } else if (t.includes('fresno') || t.includes('water')) {
      biller = 'City Utilities';
    } else if (t.includes('xfinity') || t.includes('comcast')) {
      biller = 'Xfinity Comcast';
      category = 'Subscriptions';
    } else if (t.includes('t-mobile') || t.includes('verizon') || t.includes('att')) {
      biller = 'Mobile Telecom';
      category = 'Utilities';
    } else {
      const nameMatch = billText.match(/^([A-Za-z0-9\s&]+?)(?:\r?\n|statement|invoice|account)/i);
      if (nameMatch && nameMatch[1].trim().length > 3) {
        biller = nameMatch[1].trim();
      }
    }

    const amountMatch = billText.match(/\$\s*([0-9]+(?:\.[0-9]{2})?)/) ||
                        billText.match(/(?:due|amount|total|charges)[:\s]+\$?([0-9]+(?:\.[0-9]{2})?)/i);
    if (amountMatch) amount = parseFloat(amountMatch[1]);

    const dateMatch = billText.match(/(?:due|by|date)[:\s]+([A-Za-z]+ \d{1,2},? \d{4}|\d{1,2}\/\d{1,2}\/\d{4})/i) ||
                      billText.match(/(?:due on|by)\s+([A-Za-z]+ \d{1,2}(?:,? \d{4})?)/i);
    if (dateMatch) nextDueDate = dateMatch[1];
  }

  const data = readData();
  const timestamp = Date.now();

  // 1. Add to Bills
  const newBill = {
    id: `bill-${timestamp}`,
    name: biller,
    biller,
    category,
    expectedAmount: amount || 0,
    dueDay: 15,
    nextDueDate,
    frequency: 'monthly',
    status: 'due_soon',
    assignedOwnerId: ownerId || '',
    notes: 'Scanned statement document'
  };
  data.bills.push(newBill);

  // 2. Add to Purchases / Transactions section
  const newTransaction = {
    id: `tx-doc-${timestamp}`,
    name: biller,
    category,
    amount: amount || 0,
    date: new Date().toISOString().split('T')[0],
    account: 'Scanned Document / PDF',
    ownerId: ownerId || ''
  };
  if (!data.transactions) data.transactions = [];
  data.transactions.unshift(newTransaction);

  // Update metrics
  if (data.metrics) {
    data.metrics.totalMonthlyBills = data.bills.reduce((sum, b) => sum + (Number(b.expectedAmount) || 0), 0);
  }

  writeData(data);

  res.json({
    success: true,
    scannedBill: newBill,
    createdTransaction: newTransaction,
    summary: `Successfully parsed bill from ${biller} for $${newBill.expectedAmount.toFixed(2)} due on ${nextDueDate} and recorded in both Bills and Purchases.`
  });
});

// 9. AI Advisor Chat (Supports Gemini, OpenAI / ChatGPT, DeepSeek, Custom API Keys, and User Memory)
app.post('/api/ai/chat', async (req, res) => {
  const { message, userId, aiProvider = 'gemini', apiKey, modelName, customBaseUrl, userMemory = [] } = req.body;
  const data = readData();

  const currentUser = (data.users || []).find(u => u.id === userId) || { name: 'User' };
  const userCards = (data.accounts || []).filter(a => a.ownerId === userId && a.type === 'credit');
  const userChecking = (data.accounts || []).filter(a => a.ownerId === userId && a.type === 'depository');
  const userBills = data.bills || [];
  const sortedByApr = [...userCards].sort((a, b) => b.apr - a.apr);

  const memoryContext = (userMemory && userMemory.length > 0)
    ? `\n\nUser Personal Financial Memory & Core Rules (CRITICAL: Strictly adhere to these rules at all times):\n${userMemory.map(m => `- ${m}`).join('\n')}\nIf the user specifies they are Muslim or follow Islamic / Halal finance: NEVER recommend interest-bearing accounts, high-yield savings interest, or paying/earning APR interest (Riba). Direct all focus to eliminating debt completely, Halal cash flow preservation, and budgeting.`
    : '';

  const systemContext = `
You are Klarity, the personal AI Financial Advisor for ${currentUser.name}.
Actual Connected Finances for ${currentUser.name}:
- Checking Accounts: ${userChecking.map(c => `${c.institution} ${c.name}: $${Number(c.balance).toFixed(2)}`).join(' | ') || 'None connected'}
- Credit Cards: ${userCards.map(c => `${c.institution} ${c.name}: $${Number(c.balance).toFixed(2)} @ ${c.apr}% APR (Min: $${c.minPayment || 0})`).join(' | ') || 'None connected'}
- Household Bills: ${userBills.map(b => `${b.name}: $${Number(b.expectedAmount).toFixed(2)} due ${b.nextDueDate || b.dueDate || 'Day ' + b.dueDay}`).join(' | ') || 'None added'}${memoryContext}

Provide concise, practical, empathetic debt-payoff and financial guidance using these exact numbers. Never request full credit card numbers or passwords.
`.trim();

  // Try external AI provider if configured
  try {
    // 1. OpenAI (ChatGPT)
    if (aiProvider === 'openai') {
      const key = apiKey || process.env.OPENAI_API_KEY;
      if (key) {
        const model = modelName || 'gpt-4o-mini';
        const aiRes = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemContext },
              { role: 'user', content: message }
            ],
            temperature: 0.7
          })
        });
        if (aiRes.ok) {
          const aiJson = await aiRes.json();
          const reply = aiJson.choices?.[0]?.message?.content;
          if (reply) return res.json({ reply, provider: `OpenAI (${model})` });
        } else {
          const errData = await aiRes.json().catch(() => ({}));
          console.warn('OpenAI error:', errData);
        }
      }
    }

    // 2. DeepSeek
    if (aiProvider === 'deepseek') {
      const key = apiKey || process.env.DEEPSEEK_API_KEY;
      if (key) {
        const model = modelName || 'deepseek-chat';
        const aiRes = await fetch('https://api.deepseek.com/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${key}`
          },
          body: JSON.stringify({
            model,
            messages: [
              { role: 'system', content: systemContext },
              { role: 'user', content: message }
            ],
            temperature: 0.7
          })
        });
        if (aiRes.ok) {
          const aiJson = await aiRes.json();
          const reply = aiJson.choices?.[0]?.message?.content;
          if (reply) return res.json({ reply, provider: `DeepSeek (${model})` });
        } else {
          const errData = await aiRes.json().catch(() => ({}));
          console.warn('DeepSeek error:', errData);
        }
      }
    }

    // 3. Custom OpenAI-Compatible Base URL
    if (aiProvider === 'custom' && customBaseUrl) {
      const key = apiKey || '';
      const model = modelName || 'default';
      const endpoint = customBaseUrl.replace(/\/$/, '') + '/chat/completions';
      const aiRes = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(key ? { 'Authorization': `Bearer ${key}` } : {})
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
        const reply = aiJson.choices?.[0]?.message?.content;
        if (reply) return res.json({ reply, provider: 'Custom API' });
      }
    }

    // 4. Google Gemini (Default or custom Gemini key)
    const geminiKey = (aiProvider === 'gemini' && apiKey) || process.env.GEMINI_API_KEY;
    if (geminiKey) {
      const model = modelName || 'gemini-2.5-flash';
      const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`;
      const aiRes = await fetch(geminiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: `${systemContext}\n\nUser Question: ${message}` }]
            }
          ]
        })
      });
      if (aiRes.ok) {
        const aiJson = await aiRes.json();
        const reply = aiJson.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) return res.json({ reply, provider: `Google Gemini (${model})` });
      } else {
        const errData = await aiRes.json().catch(() => ({}));
        console.warn('Gemini API error:', errData);
      }
    }
  } catch (err) {
    console.warn('AI call exception:', err);
  }

  // Built-in intelligent financial advisor fallback
  const msg = (message || '').toLowerCase();
  const memoryStr = (userMemory || []).join(' ').toLowerCase();
  const isHalalFinance = memoryStr.includes('muslim') || memoryStr.includes('halal') || memoryStr.includes('islam') || memoryStr.includes('riba') || msg.includes('halal') || msg.includes('islam');
  let reply = '';

  if (userCards.length === 0 && userChecking.length === 0) {
    reply = `Hello ${currentUser.name}! You haven't connected any real bank accounts or credit cards yet. Click **"Connect Bank"** or **"Add Card"** to link your first card, and I'll immediately start tracking your balances and payoff strategy!`;
  } else if (msg.includes('pay off') || msg.includes('debt') || msg.includes('card') || msg.includes('first')) {
    if (sortedByApr.length > 0) {
      const top = sortedByApr[0];
      if (isHalalFinance) {
        reply = `### Halal Debt Elimination Strategy for ${currentUser.name}\n\n* **Priority #1:** Pay off **${top.institution} ${top.name}** first (Balance: $${Number(top.balance).toFixed(2)}). As per your preferences, prioritize clearing this balance as fast as possible to eliminate conventional debt and avoid any interest charges.`;
      } else {
        reply = `### Debt Payoff Strategy for ${currentUser.name}\n\n* **Priority #1:** Pay off **${top.institution} ${top.name}** first (Balance: $${Number(top.balance).toFixed(2)} at **${top.apr}% APR**). Put extra payments toward this card while paying minimums on others to save maximum interest.`;
      }
    } else {
      reply = `You have no high-interest credit card debt active on your connected cards, ${currentUser.name}!`;
    }
  } else if (msg.includes('bill') || msg.includes('due')) {
    const upcoming = userBills.filter(b => b.status !== 'paid');
    if (upcoming.length > 0) {
      reply = `You have **${upcoming.length} upcoming bill(s)** due this cycle totaling **$${upcoming.reduce((s, b) => s + Number(b.expectedAmount), 0).toFixed(2)}**:\n\n` +
        upcoming.map(b => `* **${b.name}**: $${Number(b.expectedAmount).toFixed(2)} (Due: ${b.nextDueDate || 'Day ' + b.dueDay})`).join('\n');
    } else {
      reply = `All your current monthly bills are marked as paid! Great job keeping on top of your utility bills.`;
    }
  } else {
    reply = `Hello ${currentUser.name}! I am **Klarity**. I am monitoring your connected accounts, credit card interest rates, and household bills. Ask me what card to pay off first, what bills are due soon, or how to optimize your spending.`;
  }

  res.json({ reply, provider: 'Klarity Core Engine' });
});

module.exports = app;
