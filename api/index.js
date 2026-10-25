const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Supabase Client if credentials exist
let supabase = null;
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (supabaseUrl && supabaseKey) {
  try {
    const { createClient } = require('@supabase/supabase-js');
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('Connected to Supabase cloud database');
  } catch (err) {
    console.warn('Supabase initialization warning:', err.message);
  }
}

// In-Memory / Fallback Data Store (for zero-config instant preview)
let memoryStore = {
  familyMembers: [
    { id: 'm1', name: 'Robert (Dad)', role: 'Parent', avatar: '👨‍💼', color: 'blue' },
    { id: 'm2', name: 'Sarah (Mom)', role: 'Parent', avatar: '👩‍⚕️', color: 'purple' },
    { id: 'm3', name: 'Alex (College)', role: 'Student (20)', avatar: '🧑‍🎓', color: 'emerald' },
    { id: 'm4', name: 'Maya (High School)', role: 'Teen (17)', avatar: '👧', color: 'amber' },
    { id: 'm5', name: 'Jordan (Middle)', role: 'Kid (14)', avatar: '👦', color: 'pink' },
    { id: 'm6', name: 'Leo (Elementary)', role: 'Kid (10)', avatar: '🧒', color: 'cyan' }
  ],
  accounts: [
    {
      id: 'acc-1',
      memberId: 'm1',
      institution: 'Chase',
      name: 'Freedom Unlimited',
      type: 'credit',
      mask: '3912',
      balance: 2450.00,
      limit: 8000.00,
      apr: 26.49,
      minPayment: 65.00,
      dueDate: '2026-11-14',
      color: '#1e40af'
    },
    {
      id: 'acc-2',
      memberId: 'm2',
      institution: 'Capital One',
      name: 'SavorOne Rewards',
      type: 'credit',
      mask: '8204',
      balance: 820.50,
      limit: 5000.00,
      apr: 19.99,
      minPayment: 35.00,
      dueDate: '2026-11-20',
      color: '#991b1b'
    },
    {
      id: 'acc-3',
      memberId: 'm1',
      institution: 'Bank of America',
      name: 'Family Checking',
      type: 'depository',
      mask: '5190',
      balance: 5340.25,
      limit: 0,
      apr: 0,
      minPayment: 0,
      dueDate: '',
      color: '#065f46'
    },
    {
      id: 'acc-4',
      memberId: 'm3',
      institution: 'Discover',
      name: 'Student Chrome Card',
      type: 'credit',
      mask: '1192',
      balance: 310.00,
      limit: 1500.00,
      apr: 17.24,
      minPayment: 25.00,
      dueDate: '2026-11-08',
      color: '#ea580c'
    },
    {
      id: 'acc-5',
      memberId: 'm4',
      institution: 'Chase',
      name: 'High School Teen Checking',
      type: 'depository',
      mask: '6641',
      balance: 215.00,
      limit: 0,
      apr: 0,
      minPayment: 0,
      dueDate: '',
      color: '#4338ca'
    }
  ],
  bills: [
    {
      id: 'bill-1',
      name: 'Pacific Gas and Electric (PG&E)',
      biller: 'PG&E',
      category: 'Utilities',
      expectedAmount: 268.40,
      dueDay: 12,
      nextDueDate: '2026-11-12',
      frequency: 'monthly',
      status: 'due_soon',
      assignedMemberId: 'm1',
      notes: 'Electric and Gas'
    },
    {
      id: 'bill-2',
      name: 'City of Fresno Water & Solid Waste',
      biller: 'City of Fresno Utilities',
      category: 'Utilities',
      expectedAmount: 74.20,
      dueDay: 16,
      nextDueDate: '2026-11-16',
      frequency: 'monthly',
      status: 'due_soon',
      assignedMemberId: 'm1',
      notes: 'Water, trash, and sewer'
    },
    {
      id: 'bill-3',
      name: 'Xfinity Gigabit Internet',
      biller: 'Comcast / Xfinity',
      category: 'Utilities',
      expectedAmount: 90.00,
      dueDay: 22,
      nextDueDate: '2026-11-22',
      frequency: 'monthly',
      status: 'upcoming',
      assignedMemberId: 'm2',
      notes: 'Family internet'
    },
    {
      id: 'bill-4',
      name: 'T-Mobile Family Magenta Max (6 lines)',
      biller: 'T-Mobile',
      category: 'Utilities',
      expectedAmount: 185.00,
      dueDay: 28,
      nextDueDate: '2026-11-28',
      frequency: 'monthly',
      status: 'upcoming',
      assignedMemberId: 'm1',
      notes: '6 mobile lines'
    },
    {
      id: 'bill-5',
      name: 'Netflix Premium 4K + Family',
      biller: 'Netflix',
      category: 'Subscriptions',
      expectedAmount: 22.99,
      dueDay: 5,
      nextDueDate: '2026-11-05',
      frequency: 'monthly',
      status: 'due_soon',
      assignedMemberId: 'm2',
      notes: 'Family tier'
    },
    {
      id: 'bill-6',
      name: 'Nintendo Switch Online Family Membership',
      biller: 'Nintendo',
      category: 'Gaming',
      expectedAmount: 34.99,
      dueDay: 19,
      nextDueDate: '2026-11-19',
      frequency: 'yearly',
      status: 'upcoming',
      assignedMemberId: 'm1',
      notes: 'Jordan and Leo pass'
    },
    {
      id: 'bill-7',
      name: 'Spotify Family Plan',
      biller: 'Spotify',
      category: 'Subscriptions',
      expectedAmount: 19.99,
      dueDay: 27,
      nextDueDate: '2026-11-27',
      frequency: 'monthly',
      status: 'upcoming',
      assignedMemberId: 'm3',
      notes: '6 profiles'
    }
  ],
  transactions: [
    {
      id: 'tx-101',
      accountId: 'acc-1',
      memberId: 'm1',
      date: '2026-10-23',
      name: 'PG&E *WEB ONLINE PMT',
      amount: 252.18,
      category: 'Utilities',
      isRecurring: true,
      billId: 'bill-1'
    },
    {
      id: 'tx-102',
      accountId: 'acc-3',
      memberId: 'm1',
      date: '2026-10-22',
      name: 'CITY OF FRESNO UTILITIES',
      amount: 71.80,
      category: 'Utilities',
      isRecurring: true,
      billId: 'bill-2'
    },
    {
      id: 'tx-103',
      accountId: 'acc-2',
      memberId: 'm2',
      date: '2026-10-21',
      name: "TRADER JOE'S #144 FRESNO",
      amount: 164.35,
      category: 'Groceries',
      isRecurring: false
    },
    {
      id: 'tx-104',
      accountId: 'acc-2',
      memberId: 'm2',
      date: '2026-10-20',
      name: 'XFINITY COMCAST AUTO-PAY',
      amount: 90.00,
      category: 'Utilities',
      isRecurring: true,
      billId: 'bill-3'
    },
    {
      id: 'tx-105',
      accountId: 'acc-3',
      memberId: 'm1',
      date: '2026-10-18',
      name: 'T-MOBILE *AUTOPAY',
      amount: 185.00,
      category: 'Utilities',
      isRecurring: true,
      billId: 'bill-4'
    },
    {
      id: 'tx-106',
      accountId: 'acc-1',
      memberId: 'm5',
      date: '2026-10-17',
      name: 'ROBLOX CORP ROBUX PACK',
      amount: 19.99,
      category: 'Gaming',
      isRecurring: false
    },
    {
      id: 'tx-107',
      accountId: 'acc-4',
      memberId: 'm3',
      date: '2026-10-16',
      name: 'STEAM PURCHASE - HOLLOW KNIGHT',
      amount: 14.99,
      category: 'Gaming',
      isRecurring: false
    },
    {
      id: 'tx-108',
      accountId: 'acc-2',
      memberId: 'm2',
      date: '2026-10-15',
      name: 'NETFLIX.COM',
      amount: 22.99,
      category: 'Subscriptions',
      isRecurring: true,
      billId: 'bill-5'
    },
    {
      id: 'tx-109',
      accountId: 'acc-4',
      memberId: 'm3',
      date: '2026-10-14',
      name: 'SPOTIFY USA',
      amount: 19.99,
      category: 'Subscriptions',
      isRecurring: true,
      billId: 'bill-7'
    },
    {
      id: 'tx-110',
      accountId: 'acc-1',
      memberId: 'm6',
      date: '2026-10-12',
      name: 'NINTENDO ESHOP - MINECRAFT DLC',
      amount: 9.99,
      category: 'Gaming',
      isRecurring: false
    }
  ]
};

// Automatic categorization helper
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

// 1. GET /api/data (Supabase or Memory)
app.get('/api/data', async (req, res) => {
  try {
    let familyMembers = memoryStore.familyMembers;
    let accounts = memoryStore.accounts;
    let bills = memoryStore.bills;
    let transactions = memoryStore.transactions;

    if (supabase) {
      const [membersRes, accountsRes, billsRes, txRes] = await Promise.all([
        supabase.from('family_members').select('*'),
        supabase.from('accounts').select('*'),
        supabase.from('bills').select('*'),
        supabase.from('transactions').select('*').order('date', { ascending: false })
      ]);

      if (membersRes.data?.length) familyMembers = membersRes.data;
      if (accountsRes.data?.length) {
        accounts = accountsRes.data.map(a => ({
          ...a,
          memberId: a.member_id,
          limit: Number(a.credit_limit || 0),
          balance: Number(a.balance || 0),
          apr: Number(a.apr || 0),
          minPayment: Number(a.min_payment || 0),
          dueDate: a.due_date
        }));
      }
      if (billsRes.data?.length) {
        bills = billsRes.data.map(b => ({
          ...b,
          expectedAmount: Number(b.expected_amount || 0),
          dueDay: Number(b.due_day || 1),
          nextDueDate: b.next_due_date,
          assignedMemberId: b.assigned_member_id
        }));
      }
      if (txRes.data?.length) {
        transactions = txRes.data.map(t => ({
          ...t,
          accountId: t.account_id,
          memberId: t.member_id,
          amount: Number(t.amount || 0),
          isRecurring: t.is_recurring
        }));
      }
    }

    const totalChecking = accounts
      .filter(a => a.type === 'depository')
      .reduce((sum, a) => sum + (Number(a.balance) || 0), 0);

    const totalCreditDebt = accounts
      .filter(a => a.type === 'credit')
      .reduce((sum, a) => sum + (Number(a.balance) || 0), 0);

    const totalMonthlyBills = bills
      .reduce((sum, b) => {
        const amt = Number(b.expectedAmount) || 0;
        return sum + (b.frequency === 'yearly' ? amt / 12 : amt);
      }, 0);

    res.json({
      familyMembers,
      accounts,
      bills,
      transactions,
      metrics: {
        totalChecking: Number(totalChecking.toFixed(2)),
        totalCreditDebt: Number(totalCreditDebt.toFixed(2)),
        totalMonthlyBills: Number(totalMonthlyBills.toFixed(2)),
        netWorthEstimate: Number((totalChecking - totalCreditDebt).toFixed(2))
      },
      isSupabaseConnected: Boolean(supabase)
    });
  } catch (err) {
    console.error('API /data error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. POST /api/accounts
app.post('/api/accounts', async (req, res) => {
  const { memberId, institution, name, type, mask, balance, limit, apr, minPayment, dueDate } = req.body;
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

  if (supabase) {
    await supabase.from('accounts').insert({
      id: newAccount.id,
      member_id: newAccount.memberId,
      institution: newAccount.institution,
      name: newAccount.name,
      type: newAccount.type,
      mask: newAccount.mask,
      balance: newAccount.balance,
      credit_limit: newAccount.limit,
      apr: newAccount.apr,
      min_payment: newAccount.minPayment,
      due_date: newAccount.dueDate,
      color: newAccount.color
    });
  }

  memoryStore.accounts.push(newAccount);
  res.json({ success: true, account: newAccount });
});

// 3. DELETE /api/accounts/:id
app.delete('/api/accounts/:id', async (req, res) => {
  if (supabase) {
    await supabase.from('accounts').delete().eq('id', req.params.id);
  }
  memoryStore.accounts = memoryStore.accounts.filter(a => a.id !== req.params.id);
  res.json({ success: true });
});

// 4. POST /api/bills
app.post('/api/bills', async (req, res) => {
  const { name, biller, category, expectedAmount, dueDay, frequency, assignedMemberId, notes, nextDueDate } = req.body;
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

  if (supabase) {
    await supabase.from('bills').insert({
      id: newBill.id,
      name: newBill.name,
      biller: newBill.biller,
      category: newBill.category,
      expected_amount: newBill.expectedAmount,
      due_day: newBill.dueDay,
      next_due_date: newBill.nextDueDate,
      frequency: newBill.frequency,
      status: newBill.status,
      assigned_member_id: newBill.assignedMemberId,
      notes: newBill.notes
    });
  }

  memoryStore.bills.push(newBill);
  res.json({ success: true, bill: newBill });
});

// 5. POST /api/bills/:id/pay
app.post('/api/bills/:id/pay', async (req, res) => {
  const bill = memoryStore.bills.find(b => b.id === req.params.id);
  if (bill) {
    bill.status = 'paid';
    bill.lastPaidDate = new Date().toISOString().split('T')[0];
    bill.lastPaidAmount = bill.expectedAmount;
  }

  if (supabase) {
    await supabase.from('bills').update({
      status: 'paid',
      last_paid_date: new Date().toISOString().split('T')[0]
    }).eq('id', req.params.id);
  }

  res.json({ success: true, bill });
});

// 6. POST /api/transactions
app.post('/api/transactions', async (req, res) => {
  const { accountId, memberId, name, amount, date, category } = req.body;
  const detectedCategory = category || autoCategorize(name);
  const isRecurring = /pg&e|fresno water|xfinity|t-mobile|netflix|spotify/.test((name || '').toLowerCase());

  const newTx = {
    id: `tx-${Date.now()}`,
    accountId: accountId || memoryStore.accounts[0]?.id || 'acc-1',
    memberId: memberId || 'm1',
    date: date || new Date().toISOString().split('T')[0],
    name: name || 'Purchase',
    amount: Number(amount) || 0,
    category: detectedCategory,
    isRecurring
  };

  if (supabase) {
    await supabase.from('transactions').insert({
      id: newTx.id,
      account_id: newTx.accountId,
      member_id: newTx.memberId,
      date: newTx.date,
      name: newTx.name,
      amount: newTx.amount,
      category: newTx.category,
      is_recurring: newTx.isRecurring
    });
  }

  memoryStore.transactions.unshift(newTx);
  res.json({ success: true, transaction: newTx });
});

// 7. POST /api/bills/scan
app.post('/api/bills/scan', async (req, res) => {
  const { billText } = req.body;
  if (!billText) return res.status(400).json({ error: 'billText required' });

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
    assignedMemberId: 'm1',
    notes: 'Scanned from family statement'
  };

  memoryStore.bills.push(newBill);
  res.json({
    success: true,
    scannedBill: newBill,
    summary: `Successfully parsed bill from ${biller} for $${newBill.expectedAmount} due on ${nextDueDate}`
  });
});

// 8. POST /api/plaid/exchange-public-token
app.post('/api/plaid/exchange-public-token', (req, res) => {
  const { institution, accountName, memberId } = req.body;
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

  memoryStore.accounts.push(newAccount);
  res.json({ success: true, account: newAccount });
});

// 9. POST /api/ai/chat
app.post('/api/ai/chat', async (req, res) => {
  const { message, memberId } = req.body;
  const creditCards = memoryStore.accounts.filter(a => a.type === 'credit');
  const checkingAccounts = memoryStore.accounts.filter(a => a.type === 'depository');
  const totalChecking = checkingAccounts.reduce((sum, a) => sum + a.balance, 0);
  const sortedByApr = [...creditCards].sort((a, b) => b.apr - a.apr);
  const sortedByBalance = [...creditCards].sort((a, b) => a.balance - b.balance);

  // Gemini API if configured
  if (process.env.GEMINI_API_KEY) {
    try {
      const { GoogleGenAI } = require('@google/genai');
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `
You are the personal AI Financial Advisor for a family of 6.
Household finances:
- Cash in checking: $${totalChecking.toFixed(2)}
- Credit Cards: ${creditCards.map(c => `${c.institution} ${c.name}: Balance $${c.balance}, APR ${c.apr}%, Min $${c.minPayment}`).join(' | ')}
- Bills: ${memoryStore.bills.map(b => `${b.name}: $${b.expectedAmount} due ${b.nextDueDate}`).join(' | ')}

User asked: "${message}"
Answer concisely with bullet points. Explain Avalanche (highest APR first) or Snowball if asked what to pay off.
`;
      const aiRes = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      return res.json({ reply: aiRes.text });
    } catch (err) {
      console.warn('Gemini error, using fallback:', err.message);
    }
  }

  // Deterministic smart financial reasoning engine fallback
  const msg = (message || '').toLowerCase();
  let reply = '';

  if (msg.includes('pay off') || msg.includes('debt') || msg.includes('avalanche') || msg.includes('snowball')) {
    const highestAprCard = sortedByApr[0] || { institution: 'Chase', name: 'Card', apr: 26.49, balance: 2450 };
    const lowestBalCard = sortedByBalance[0] || { institution: 'Discover', name: 'Card', apr: 17.24, balance: 310 };

    reply = `### 💡 Smart Debt Payoff Recommendation

Here is how your family can tackle your credit card balances:

#### 1. The **Avalanche Method** (Saves the most money in interest)
* **Priority #1:** Pay off **${highestAprCard.institution} ${highestAprCard.name}** first!
  * **Current Balance:** $${highestAprCard.balance.toFixed(2)}
  * **Interest Rate (APR):** **${highestAprCard.apr}%** (Your most expensive debt)
* For all other cards, pay only their minimum monthly payments. Put all extra cash into this card.

#### 2. The **Snowball Method** (Fastest psychological wins)
* If you want to eliminate an entire card quickly, pay off **${lowestBalCard.institution} ${lowestBalCard.name}** ($${lowestBalCard.balance.toFixed(2)} balance at ${lowestBalCard.apr}% APR).

**Family Cash Flow Check:** You currently have **$${totalChecking.toFixed(2)}** in checking to safely allocate toward debt while maintaining a cushion for utility bills.`;

  } else if (msg.includes('bill') || msg.includes('pg&e') || msg.includes('water') || msg.includes('fresno') || msg.includes('due') || msg.includes('xfinity') || msg.includes('t-mobile')) {
    const upcoming = memoryStore.bills.filter(b => b.status === 'due_soon' || b.status === 'upcoming');
    const totalDue = upcoming.reduce((s, b) => s + b.expectedAmount, 0);

    reply = `### 📅 Upcoming Household Bills Summary

You have **${upcoming.length} bills** scheduled for this month totaling **$${totalDue.toFixed(2)}**:

${upcoming.map(b => `* **${b.name}**: **$${b.expectedAmount.toFixed(2)}** — Due on **${b.nextDueDate}** (${b.status === 'due_soon' ? '⚠️ Due Soon' : 'Upcoming'})`).join('\n')}

**Safety Check:** Your checking balance ($${totalChecking.toFixed(2)}) easily covers these bills ($${totalDue.toFixed(2)}) with a buffer of **$${(totalChecking - totalDue).toFixed(2)}** remaining.`;

  } else {
    reply = `### 📊 Family Financial Health Overview

Hello! I have analyzed the financial records across all 6 family members:
* **Cash on Hand:** **$${totalChecking.toFixed(2)}** in checking
* **Credit Card Debt:** **$${creditCards.reduce((s, c) => s + c.balance, 0).toFixed(2)}**
* **Upcoming Bills:** PG&E ($268.40), Fresno Water ($74.20), Xfinity ($90.00), T-Mobile ($185.00)

**What would you like advice on?**
1. Ask: *"What credit card should I pay off first?"*
2. Ask: *"What bills are due this week?"*
3. Ask: *"How much are kids spending on gaming?"*`;
  }

  res.json({ reply });
});

// Export for Vercel Serverless Function
module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}
