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
    console.warn('Google GenAI initialization note:', err.message);
  }
}

// Data helpers
function readData() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading data.json:', err);
    return { familyMembers: [], accounts: [], bills: [], transactions: [] };
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

// ================= API ROUTES =================

// 1. Get complete dashboard data
app.get('/api/data', (req, res) => {
  const data = readData();

  // Calculate summary metrics
  const totalChecking = data.accounts
    .filter(a => a.type === 'depository')
    .reduce((sum, a) => sum + (Number(a.balance) || 0), 0);

  const totalCreditDebt = data.accounts
    .filter(a => a.type === 'credit')
    .reduce((sum, a) => sum + (Number(a.balance) || 0), 0);

  const totalMonthlyBills = data.bills
    .reduce((sum, b) => {
      const amt = Number(b.expectedAmount) || 0;
      return sum + (b.frequency === 'yearly' ? amt / 12 : amt);
    }, 0);

  res.json({
    ...data,
    metrics: {
      totalChecking: Number(totalChecking.toFixed(2)),
      totalCreditDebt: Number(totalCreditDebt.toFixed(2)),
      totalMonthlyBills: Number(totalMonthlyBills.toFixed(2)),
      netWorthEstimate: Number((totalChecking - totalCreditDebt).toFixed(2))
    }
  });
});

// 2. Add or Link an Account (Card/Bank)
app.post('/api/accounts', (req, res) => {
  const { memberId, institution, name, type, mask, balance, limit, apr, minPayment, dueDate } = req.body;
  const data = readData();

  const newAccount = {
    id: `acc-${Date.now()}`,
    memberId: memberId || 'm1',
    institution: institution || 'Connected Bank',
    name: name || 'Account',
    type: type || 'credit',
    mask: mask || String(Math.floor(1000 + Math.random() * 9000)),
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

// 3. Delete an Account
app.delete('/api/accounts/:id', (req, res) => {
  const data = readData();
  data.accounts = data.accounts.filter(a => a.id !== req.params.id);
  writeData(data);
  res.json({ success: true });
});

// 4. Add a Recurring / Utility Bill
app.post('/api/bills', (req, res) => {
  const { name, biller, category, expectedAmount, dueDay, frequency, assignedMemberId, notes, nextDueDate } = req.body;
  const data = readData();

  const newBill = {
    id: `bill-${Date.now()}`,
    name: name || 'Utility / Bill',
    biller: biller || name,
    category: category || autoCategorize(name),
    expectedAmount: Number(expectedAmount) || 0,
    dueDay: Number(dueDay) || 1,
    nextDueDate: nextDueDate || `2026-11-${String(dueDay || 1).padStart(2, '0')}`,
    frequency: frequency || 'monthly',
    status: 'upcoming',
    assignedMemberId: assignedMemberId || 'm1',
    notes: notes || ''
  };

  data.bills.push(newBill);
  writeData(data);
  res.json({ success: true, bill: newBill });
});

// 5. Mark a Bill as Paid
app.post('/api/bills/:id/pay', (req, res) => {
  const data = readData();
  const bill = data.bills.find(b => b.id === req.params.id);
  if (!bill) return res.status(404).json({ error: 'Bill not found' });

  bill.status = 'paid';
  bill.lastPaidDate = new Date().toISOString().split('T')[0];
  bill.lastPaidAmount = bill.expectedAmount;

  // Add corresponding payment transaction
  const paymentTx = {
    id: `tx-${Date.now()}`,
    accountId: bill.autoPayCardId || data.accounts[0]?.id || 'acc-1',
    memberId: bill.assignedMemberId || 'm1',
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

// 6. Add a Transaction with auto-categorization
app.post('/api/transactions', (req, res) => {
  const { accountId, memberId, name, amount, date, category } = req.body;
  const data = readData();

  const detectedCategory = category || autoCategorize(name);
  const isRecurring = /pg&e|fresno water|xfinity|t-mobile|netflix|spotify/.test((name || '').toLowerCase());

  const newTx = {
    id: `tx-${Date.now()}`,
    accountId: accountId || (data.accounts[0] ? data.accounts[0].id : 'acc-1'),
    memberId: memberId || 'm1',
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

// 7. Bill Ingestion & Scanner (Extracts biller, due date, amount from text/statement)
app.post('/api/bills/scan', async (req, res) => {
  const { billText } = req.body;
  if (!billText) {
    return res.status(400).json({ error: 'billText is required' });
  }

  // Regex parsing heuristics
  let biller = 'Utility Provider';
  let category = 'Utilities';
  let amount = 0;
  let dueDay = 15;
  let nextDueDate = '2026-11-15';

  const t = billText.toLowerCase();

  if (t.includes('pg&e') || t.includes('pacific gas')) {
    biller = 'Pacific Gas and Electric (PG&E)';
    category = 'Utilities';
  } else if (t.includes('fresno') || t.includes('city of fresno')) {
    biller = 'City of Fresno Utilities';
    category = 'Utilities';
  } else if (t.includes('xfinity') || t.includes('comcast')) {
    biller = 'Xfinity Comcast';
    category = 'Utilities';
  } else if (t.includes('t-mobile')) {
    biller = 'T-Mobile';
    category = 'Utilities';
  }

  // Amount extraction (handles $245.50 or 'Due: 245.50')
  const amountMatch = billText.match(/\$\s*([0-9]+(?:\.[0-9]{2})?)/) ||
                      billText.match(/(?:due|amount|total|charges)[:\s]+\$?([0-9]+(?:\.[0-9]{2})?)/i);
  if (amountMatch) {
    amount = parseFloat(amountMatch[1]);
  }

  // Date extraction (handles 'Due: Nov 14, 2026' or 'by November 14, 2026' or 11/14/2026)
  const dateMatch = billText.match(/(?:due|by|date)[:\s]+([A-Za-z]+ \d{1,2},? \d{4}|\d{1,2}\/\d{1,2}\/\d{4})/i) ||
                    billText.match(/(?:due on|by)\s+([A-Za-z]+ \d{1,2}(?:,? \d{4})?)/i);
  if (dateMatch) {
    nextDueDate = dateMatch[1];
  }

  const data = readData();
  const newBill = {
    id: `bill-${Date.now()}`,
    name: biller,
    biller,
    category,
    expectedAmount: amount || 120.00,
    dueDay,
    nextDueDate,
    frequency: 'monthly',
    status: 'due_soon',
    assignedMemberId: 'm1',
    notes: 'Scanned from family statement'
  };

  data.bills.push(newBill);
  writeData(data);

  res.json({
    success: true,
    scannedBill: newBill,
    summary: `Successfully parsed bill from ${biller} for $${newBill.expectedAmount} due on ${nextDueDate}`
  });
});

// 8. Plaid Integration Simulation & Live Ready
app.post('/api/plaid/create-link-token', (req, res) => {
  // If user has PLAID_CLIENT_ID & PLAID_SECRET in .env, can initialize real Plaid client
  // For immediate development & demo, return a simulated link token
  res.json({
    link_token: `link-sandbox-${Date.now()}`,
    expiration: new Date(Date.now() + 3600000).toISOString(),
    is_sandbox: true
  });
});

app.post('/api/plaid/exchange-public-token', (req, res) => {
  const { institution, accountName, memberId } = req.body;
  const data = readData();

  // Add realistic linked account
  const newAccount = {
    id: `acc-plaid-${Date.now()}`,
    memberId: memberId || 'm1',
    institution: institution || 'Chase Bank',
    name: accountName || 'Premier Sapphire Card',
    type: 'credit',
    mask: String(Math.floor(1000 + Math.random() * 9000)),
    balance: Math.floor(Math.random() * 1500) + 200,
    limit: 6000,
    apr: 24.99,
    minPayment: 40.00,
    dueDate: '2026-11-18',
    color: '#0284c7'
  };

  data.accounts.push(newAccount);
  writeData(data);
  res.json({ success: true, account: newAccount });
});

// 9. AI Financial Advisor Chat (Gemini 2.5 + Smart Deterministic Fallback)
app.post('/api/ai/chat', async (req, res) => {
  const { message, memberId } = req.body;
  const data = readData();

  // Prepare financial context
  const member = memberId ? data.familyMembers.find(m => m.id === memberId) : null;
  const creditCards = data.accounts.filter(a => a.type === 'credit');
  const checkingAccounts = data.accounts.filter(a => a.type === 'depository');
  const totalChecking = checkingAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalDebt = creditCards.reduce((sum, a) => sum + a.balance, 0);

  // Sort credit cards by APR descending (Avalanche)
  const sortedByApr = [...creditCards].sort((a, b) => b.apr - a.apr);
  // Sort credit cards by Balance ascending (Snowball)
  const sortedByBalance = [...creditCards].sort((a, b) => a.balance - b.balance);

  // If Gemini API is configured, use official Google GenAI SDK
  if (aiClient && process.env.GEMINI_API_KEY) {
    try {
      const prompt = `
You are Klarity, the personal AI Financial Advisor for a family of 6.
Here is the live household financial snapshot:
- Family Members: ${data.familyMembers.map(m => `${m.name} (${m.role})`).join(', ')}
- Checking / Cash on hand: $${totalChecking.toFixed(2)}
- Total Credit Card Debt: $${totalDebt.toFixed(2)}
- Credit Cards with APRs and Balances:
  ${creditCards.map(c => `* ${c.institution} ${c.name} (${c.mask}): Balance $${c.balance}, APR ${c.apr}%, Min Payment $${c.minPayment}, Due Date ${c.dueDate || 'N/A'}`).join('\n  ')}
- Household Bills & Utilities:
  ${data.bills.map(b => `* ${b.name}: $${b.expectedAmount} due ${b.nextDueDate} (${b.status})`).join('\n  ')}
- Recent Transactions (Past 2 weeks):
  ${data.transactions.slice(0, 10).map(t => `* ${t.date} | ${t.name} | $${t.amount} | [${t.category}]`).join('\n  ')}

Current User Persona viewing this: ${member ? member.name : 'Whole Family Overview'}
User Question: "${message}"

Give helpful, empathetic, concise, and mathematically sound financial guidance. If they ask what to pay off, compare the Avalanche method (highest APR first) and Snowball method (lowest balance first). If they ask about bills, mention upcoming PG&E, Fresno Water, Xfinity, or T-Mobile due dates. Keep formatting clean and actionable with bullet points.
`;

      const response = await aiClient.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });

      return res.json({ reply: response.text });
    } catch (err) {
      console.warn('Gemini API call failed, falling back to local advisor engine:', err.message);
    }
  }

  // Built-in Financial Advisor Reasoning Engine
  const msg = (message || '').toLowerCase();
  let reply = '';

  if (msg.includes('pay off') || msg.includes('debt') || msg.includes('avalanche') || msg.includes('snowball') || msg.includes('interest')) {
    const highestAprCard = sortedByApr[0];
    const lowestBalCard = sortedByBalance[0];

    reply = `### 💡 Smart Debt Payoff Recommendation

Here is how your family can tackle your credit card balances:

#### 1. The **Avalanche Method** (Saves the most money in interest)
* **Priority #1:** Pay off **${highestAprCard.institution} ${highestAprCard.name}** first!
  * **Current Balance:** $${highestAprCard.balance.toFixed(2)}
  * **Interest Rate (APR):** **${highestAprCard.apr}%** (Your most expensive debt)
* For all other cards, pay only their minimum monthly payments ($${sortedByApr.slice(1).map(c => `${c.institution}: $${c.minPayment}`).join(', ')}). Put every extra dollar into the ${highestAprCard.institution} card.

#### 2. The **Snowball Method** (Fastest psychological wins)
* If you want to eliminate an entire card quickly, pay off **${lowestBalCard.institution} ${lowestBalCard.name}** ($${lowestBalCard.balance.toFixed(2)} balance at ${lowestBalCard.apr}% APR).

**Family Cash Flow Check:** You currently have **$${totalChecking.toFixed(2)}** in checking. You can safely allocate an extra $200–$400 toward your highest-interest card while maintaining an emergency cushion for upcoming utility bills.`;

  } else if (msg.includes('bill') || msg.includes('pg&e') || msg.includes('water') || msg.includes('fresno') || msg.includes('due') || msg.includes('xfinity') || msg.includes('t-mobile')) {
    const upcomingBills = data.bills.filter(b => b.status === 'due_soon' || b.status === 'upcoming');
    const totalDue = upcomingBills.reduce((s, b) => s + b.expectedAmount, 0);

    reply = `### 📅 Upcoming Household Bills Summary

You have **${upcomingBills.length} bills** scheduled for this month totaling **$${totalDue.toFixed(2)}**:

${upcomingBills.map(b => `* **${b.name}**: **$${b.expectedAmount.toFixed(2)}** — Due on **${b.nextDueDate}** (${b.status === 'due_soon' ? '⚠️ Due Soon' : 'Upcoming'})`).join('\n')}

**Safety Check:** Your checking account balance is **$${totalChecking.toFixed(2)}**, which easily covers these upcoming payments ($${totalDue.toFixed(2)}) with a buffer of **$${(totalChecking - totalDue).toFixed(2)}** remaining.`;

  } else if (msg.includes('subscription') || msg.includes('streaming') || msg.includes('game') || msg.includes('gaming') || msg.includes('kid')) {
    const subs = data.bills.filter(b => b.category === 'Subscriptions' || b.category === 'Gaming');
    const gamingTx = data.transactions.filter(t => t.category === 'Gaming');
    const gamingTotal = gamingTx.reduce((s, t) => s + t.amount, 0);
    const subTotal = subs.reduce((s, b) => s + b.expectedAmount, 0);

    reply = `### 🎮 Family Subscriptions & Entertainment Breakdown

* **Monthly Recurring Entertainment/Gaming:** **$${subTotal.toFixed(2)}/mo**
  ${subs.map(s => `* ${s.name}: $${s.expectedAmount}`).join('\n  ')}

* **Recent Gaming Purchases (Jordan, Leo, Alex):** **$${gamingTotal.toFixed(2)}** past 30 days
  ${gamingTx.map(g => `* ${g.name} (${g.date}): $${g.amount}`).join('\n  ')}

**Advisor Tip:** If you want to trim $40/month, review the Netflix 4K tier ($22.99) vs standard, and consider putting a $25/month allowance cap on Roblox and Steam purchases for the kids.`;

  } else {
    reply = `### 📊 Family Financial Health Overview

Hello! I have analyzed the financial data across all 6 family members:

* **Cash on Hand:** **$${totalChecking.toFixed(2)}** in checking
* **Credit Card Debt:** **$${totalDebt.toFixed(2)}** across ${creditCards.length} cards
* **Average Monthly Bills:** **$${data.metrics?.totalMonthlyBills || 680.00}/month** (PG&E, Fresno Water, Xfinity, T-Mobile, Subscriptions)

**What would you like help with today?**
1. Ask: *"What credit card should I pay off first?"*
2. Ask: *"What bills are due this week?"*
3. Ask: *"How much are we spending on subscriptions and gaming?"*
4. Ask: *"How can we lower our PG&E or utility bill?"*`;
  }

  res.json({ reply });
});

// Serve frontend in production/single-port mode if client/dist exists
const clientDistPath = path.join(__dirname, '../client/dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.use((req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`Family Finance Server running on http://localhost:${PORT}`);
});
