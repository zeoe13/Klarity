/**
 * Statutory Debt & Legal Protection Engine
 * 
 * Implements:
 * 1. Statutory Legal Protection & Judgment-Proof Calculations:
 *    - 42 U.S.C. § 407 (Social Security Act § 207)
 *    - California Code of Civil Procedure § 704.110 (CalPERS / Public Pensions)
 *    - 31 CFR Part 212 (Federal 2-Month Automatic Bank Shield Lookback)
 * 2. Underwriting & Household Income Engine:
 *    - 12 CFR § 1026.51 (CARD Act Shared Household Income Rule)
 * 3. Exact Amortization Payoff Engine (Scenarios A, B, C, D)
 */

/**
 * @typedef {Object} IncomeStream
 * @property {string} id
 * @property {string} label
 * @property {number} amount - Monthly amount in dollars
 * @property {'social_security' | 'calpers' | 'w2' | 'pension' | 'other'} type
 * @property {boolean} isStatutorilyExempt
 * @property {string} statutoryBasis
 */

/**
 * @typedef {Object} DebtAccount
 * @property {string} id
 * @property {string} name
 * @property {string} institution - e.g. 'American Express', 'Citibank', 'Discover', 'Chase'
 * @property {string} mask - e.g. '4417'
 * @property {number} balance
 * @property {number} standardApr
 * @property {number} [promoApr]
 * @property {string} [promoEndDate]
 * @property {number} minimumPayment
 * @property {'active' | 'hardship_enrolled' | 'closed'} hardshipStatus
 */

/**
 * Default sample income streams for California seniors & household members
 * @type {IncomeStream[]}
 */
export const DEFAULT_INCOME_STREAMS = [
  {
    id: 'inc-ss',
    label: 'Social Security (SSA)',
    amount: 1950,
    type: 'social_security',
    isStatutorilyExempt: true,
    statutoryBasis: '42 U.S.C. § 407 (Social Security Act § 207)'
  },
  {
    id: 'inc-calpers',
    label: 'CalPERS State Pension',
    amount: 2450,
    type: 'calpers',
    isStatutorilyExempt: true,
    statutoryBasis: 'California CCP § 704.110'
  },
  {
    id: 'inc-w2-hh',
    label: 'Accessible Household Income (W-2)',
    amount: 3200,
    type: 'w2',
    isStatutorilyExempt: false,
    statutoryBasis: '12 CFR § 1026.51 (CARD Act Shared Household Income)'
  }
];

/**
 * Calculate Judgment-Proof Shield and 31 CFR Part 212 Lookback Cushion
 * 
 * @param {IncomeStream[]} incomeStreams
 * @returns {{
 *   totalMonthlyIncome: number,
 *   shieldedMonthlyIncome: number,
 *   garnishableMonthlyIncome: number,
 *   shieldedRatioPercent: number,
 *   lookbackBankCushion: number,
 *   isFullyJudgmentProof: boolean,
 *   exemptStreams: IncomeStream[],
 *   nonExemptStreams: IncomeStream[]
 * }}
 */
export function calculateJudgmentProofRatio(incomeStreams = []) {
  const streams = Array.isArray(incomeStreams) ? incomeStreams : [];
  
  let totalMonthlyIncome = 0;
  let shieldedMonthlyIncome = 0;
  const exemptStreams = [];
  const nonExemptStreams = [];

  for (const stream of streams) {
    const amt = Math.max(0, Number(stream.amount) || 0);
    totalMonthlyIncome += amt;

    const isExempt = stream.isStatutorilyExempt || 
      stream.type === 'social_security' || 
      stream.type === 'calpers' || 
      stream.type === 'pension';

    if (isExempt) {
      shieldedMonthlyIncome += amt;
      exemptStreams.push(stream);
    } else {
      nonExemptStreams.push(stream);
    }
  }

  const garnishableMonthlyIncome = Math.max(0, totalMonthlyIncome - shieldedMonthlyIncome);
  const shieldedRatioPercent = totalMonthlyIncome > 0 
    ? Math.min(100, (shieldedMonthlyIncome / totalMonthlyIncome) * 100) 
    : 0;

  // 31 CFR Part 212 mandates that financial institutions automatically shield the preceding 
  // 2-month lookback period of direct-deposited federal and statutory benefits from private levies
  const lookbackBankCushion = shieldedMonthlyIncome * 2;

  const isFullyJudgmentProof = shieldedRatioPercent >= 99.9 || garnishableMonthlyIncome <= 0;

  return {
    totalMonthlyIncome,
    shieldedMonthlyIncome,
    garnishableMonthlyIncome,
    shieldedRatioPercent,
    lookbackBankCushion,
    isFullyJudgmentProof,
    exemptStreams,
    nonExemptStreams
  };
}

/**
 * Calculate Debt-to-Income (DTI) under Individual vs Household mode (12 CFR § 1026.51)
 * 
 * @param {DebtAccount[]} debtAccounts
 * @param {IncomeStream[]} incomeStreams
 * @param {'individual' | 'household'} mode
 * @returns {{
 *   totalDebtMinPayment: number,
 *   effectiveIncome: number,
 *   dtiPercent: number,
 *   dtiTier: 'prime' | 'moderate' | 'strained',
 *   underwritingNote: string,
 *   realisticCreditIncreaseCap: string
 * }}
 */
export function calculateDTI(debtAccounts = [], incomeStreams = [], mode = 'individual') {
  const debts = Array.isArray(debtAccounts) ? debtAccounts : [];
  const streams = Array.isArray(incomeStreams) ? incomeStreams : [];

  const totalDebtMinPayment = debts.reduce((sum, d) => {
    if (d.minimumPayment && d.minimumPayment > 0) return sum + Number(d.minimumPayment);
    // Standard default credit card minimum payment estimate: max($25, 2.5% of balance)
    const bal = Math.max(0, Number(d.balance) || 0);
    return sum + Math.max(25, bal * 0.025);
  }, 0);

  let effectiveIncome = 0;
  for (const stream of streams) {
    const amt = Math.max(0, Number(stream.amount) || 0);
    if (mode === 'household') {
      effectiveIncome += amt;
    } else {
      // Individual mode excludes shared household-only streams
      if (stream.id !== 'inc-w2-hh' && !stream.label?.toLowerCase().includes('household')) {
        effectiveIncome += amt;
      }
    }
  }

  const dtiPercent = effectiveIncome > 0 ? (totalDebtMinPayment / effectiveIncome) * 100 : 0;

  let dtiTier = 'prime';
  let underwritingNote = 'Strong DTI. Commercial lenders favor approval for standard limits.';
  let realisticCreditIncreaseCap = '$2,500 - $5,000';

  if (dtiPercent >= 45) {
    dtiTier = 'strained';
    underwritingNote = 'DTI exceeds conservative underwriting limits (>45%). Unlikely to receive automated limit bumps. Ideal candidate for 0% Hardship/DMP account closure.';
    realisticCreditIncreaseCap = '$0 - $1,500 (Manual underwriter review required)';
  } else if (dtiPercent >= 32) {
    dtiTier = 'moderate';
    underwritingNote = 'Moderate DTI under 12 CFR § 1026.51. Automated reconsiderations realistically yield conservative bumps of $1,500 - $2,500.';
    realisticCreditIncreaseCap = '$1,500 - $2,500';
  }

  return {
    totalDebtMinPayment,
    effectiveIncome,
    dtiPercent,
    dtiTier,
    underwritingNote,
    realisticCreditIncreaseCap
  };
}

/**
 * 4-Option Payoff Simulator:
 * - Scenario A: Minimum Payment Trap (dynamic min payments, 20+ years, high interest)
 * - Scenario B: Fixed Accelerated Repayment ($400/mo fixed)
 * - Scenario C: Internal Hardship Program / NFCC DMP (0% APR, 36-48 months, account closed)
 * - Scenario D: Family Qard Hasan / CalPERS 457 Loan (0% external interest to banks)
 * 
 * @param {number} totalBalance
 * @param {number} [apr=24.0]
 * @param {number} [customFixedPayment=400]
 * @returns {{
 *   balance: number,
 *   apr: number,
 *   scenarioA: {
 *     title: string,
 *     initialMonthlyPayment: number,
 *     monthOneInterest: number,
 *     monthOnePrincipal: number,
 *     interestSplitPercent: number,
 *     monthsToFreedom: number,
 *     yearsToFreedom: number,
 *     totalInterestPaid: number,
 *     totalPaid: number,
 *     summary: string
 *   },
 *   scenarioB: {
 *     title: string,
 *     monthlyPayment: number,
 *     monthsToFreedom: number,
 *     yearsToFreedom: number,
 *     totalInterestPaid: number,
 *     totalPaid: number,
 *     interestSavedVsA: number,
 *     summary: string
 *   },
 *   scenarioC: {
 *     title: string,
 *     concessionApr: number,
 *     monthlyPayment: number,
 *     monthsToFreedom: number,
 *     totalInterestPaid: number,
 *     totalPaid: number,
 *     interestSavedVsA: number,
 *     summary: string
 *   },
 *   scenarioD: {
 *     title: string,
 *     monthlyPayment: number,
 *     monthsToFreedom: number,
 *     totalInterestPaid: number,
 *     totalPaid: number,
 *     interestSavedVsA: number,
 *     summary: string
 *   }
 * }}
 */
export function simulatePayoffScenarios(totalBalance, apr = 24.0, customFixedPayment = 400) {
  const balance = Math.max(100, Number(totalBalance) || 8000);
  const nominalApr = Math.max(1.0, Number(apr) || 24.0);
  const monthlyRate = (nominalApr / 100) / 12;

  // -------------------------------------------------------------
  // Scenario A: Minimum Payment Trap
  // -------------------------------------------------------------
  // Initial minimum payment: usually max($25, 1% balance + monthly interest) or 2.5% of balance
  const monthOneInterest = balance * monthlyRate;
  const initialMinPayment = Math.max(35, Math.round((balance * 0.01 + monthOneInterest) * 100) / 100);
  const monthOnePrincipal = Math.max(0, initialMinPayment - monthOneInterest);
  const interestSplitPercent = initialMinPayment > 0 
    ? Math.round((monthOneInterest / initialMinPayment) * 100) 
    : 0;

  // Run month-by-month simulation for Scenario A
  let curBalA = balance;
  let monthsA = 0;
  let totalInterestA = 0;
  let totalPaidA = 0;
  const maxMonths = 360; // 30-year safety ceiling

  while (curBalA > 1 && monthsA < maxMonths) {
    monthsA++;
    const monthlyInt = curBalA * monthlyRate;
    totalInterestA += monthlyInt;

    // Minimum payment rule: max($25, 1% balance + interest)
    const minPay = Math.max(25, curBalA * 0.01 + monthlyInt);
    const actualPay = Math.min(curBalA + monthlyInt, minPay);
    totalPaidA += actualPay;

    const principalPaid = actualPay - monthlyInt;
    curBalA -= principalPaid;
    if (curBalA <= 0.5) curBalA = 0;
  }

  const scenarioA = {
    title: 'Minimum Payment Trap',
    initialMonthlyPayment: initialMinPayment,
    monthOneInterest: Math.round(monthOneInterest),
    monthOnePrincipal: Math.round(monthOnePrincipal),
    interestSplitPercent,
    monthsToFreedom: monthsA,
    yearsToFreedom: Math.round((monthsA / 12) * 10) / 10,
    totalInterestPaid: Math.round(totalInterestA),
    totalPaid: Math.round(totalPaidA),
    summary: `${interestSplitPercent}% of your first payment goes straight to interest. Takes ${Math.round(monthsA / 12)}+ years and burns $${Math.round(totalInterestA).toLocaleString()} in interest.`
  };

  // -------------------------------------------------------------
  // Scenario B: Fixed Accelerated Repayment
  // -------------------------------------------------------------
  const minRequiredB = monthOneInterest + 25;
  const fixedPayB = Math.max(minRequiredB, Number(customFixedPayment) || 400);

  let curBalB = balance;
  let monthsB = 0;
  let totalInterestB = 0;
  let totalPaidB = 0;

  while (curBalB > 1 && monthsB < maxMonths) {
    monthsB++;
    const monthlyInt = curBalB * monthlyRate;
    totalInterestB += monthlyInt;

    const actualPay = Math.min(curBalB + monthlyInt, fixedPayB);
    totalPaidB += actualPay;

    curBalB -= (actualPay - monthlyInt);
    if (curBalB <= 0.5) curBalB = 0;
  }

  const scenarioB = {
    title: 'Fixed Accelerated Payment',
    monthlyPayment: fixedPayB,
    monthsToFreedom: monthsB,
    yearsToFreedom: Math.round((monthsB / 12) * 10) / 10,
    totalInterestPaid: Math.round(totalInterestB),
    totalPaid: Math.round(totalPaidB),
    interestSavedVsA: Math.max(0, Math.round(totalInterestA - totalInterestB)),
    summary: `Fixed $${fixedPayB}/mo eliminates the debt in ${monthsB} months and saves $${Math.max(0, Math.round(totalInterestA - totalInterestB)).toLocaleString()} in interest vs minimums.`
  };

  // -------------------------------------------------------------
  // Scenario C: Internal Hardship Program / NFCC DMP (0% APR)
  // -------------------------------------------------------------
  // 36-month fixed repayment at 0% APR (or concessionary 0-6%)
  const monthsC = 36;
  const fixedPayC = Math.round((balance / monthsC) * 100) / 100;
  const totalInterestC = 0;
  const totalPaidC = balance;

  const scenarioC = {
    title: '0% Bank Hardship / NFCC DMP',
    concessionApr: 0.0,
    monthlyPayment: fixedPayC,
    monthsToFreedom: monthsC,
    totalInterestPaid: 0,
    totalPaid: totalPaidC,
    interestSavedVsA: Math.round(totalInterestA),
    summary: `Enrolls in internal bank financial relief or NFCC plan. Rate slashed to 0%, card closed, 100% principal payoff in 36 months ($0 interest).`
  };

  // -------------------------------------------------------------
  // Scenario D: Family Qard Hasan / CalPERS 457 Loan
  // -------------------------------------------------------------
  // 40-month zero-interest family pool ($200/mo on $8,000) or CalPERS 457 loan
  const monthsD = Math.max(12, Math.round(balance / 200));
  const fixedPayD = Math.round((balance / monthsD) * 100) / 100;

  const scenarioD = {
    title: 'Family 0% Pool / CalPERS 457 Loan',
    monthlyPayment: fixedPayD,
    monthsToFreedom: monthsD,
    totalInterestPaid: 0,
    totalPaid: balance,
    interestSavedVsA: Math.round(totalInterestA),
    summary: `100% interest-free family pool (Qard Hasan) or CalPERS 457 loan (any interest paid goes back into retiree's own account). Zero dollars paid to commercial banks.`
  };

  return {
    balance,
    apr: nominalApr,
    scenarioA,
    scenarioB,
    scenarioC,
    scenarioD
  };
}

/**
 * Hardship Playbook Creditor Directory with Direct Phone Scripts
 */
export const HARDSHIP_CREDITORS = [
  {
    institution: 'American Express',
    slug: 'amex',
    department: 'Financial Relief Program (FRP)',
    phone: '1-866-703-4169',
    onlineUrl: 'https://www.americanexpress.com/financial-relief',
    typicalTerms: '0% - 9.99% APR, 12 - 48 month fixed amortization, account closed/suspended',
    hardshipPhoneScript: (cardholderName, mask, balance) => 
      `"Hello, my name is ${cardholderName || 'Cardholder'}. I am calling regarding my American Express account ending in •••• ${mask || 'XXXX'} (current balance: $${Number(balance || 0).toLocaleString()}). I am an elderly retiree living on a fixed CalPERS public pension and Social Security. Due to inflation and fixed living expenses, the current APR is making it mathematically impossible to reduce my principal balance. I want to honor my obligations and repay 100% of my debt, but I cannot sustain this interest rate. I am requesting to enroll this card into the American Express Financial Relief Program (FRP) with a 0% to reduced APR and a structured payoff plan in exchange for closing the account."`
  },
  {
    institution: 'Citibank',
    slug: 'citi',
    department: 'Consumer Hardship & Workout Department',
    phone: '1-800-950-5114',
    onlineUrl: 'https://www.citi.com',
    typicalTerms: '0% - 6% APR, 36 - 60 month fixed monthly payments, account closed',
    hardshipPhoneScript: (cardholderName, mask, balance) => 
      `"Hello, my name is ${cardholderName || 'Cardholder'}. I am calling about my Citi card ending in •••• ${mask || 'XXXX'} with a balance of $${Number(balance || 0).toLocaleString()}. I am on a fixed retirement pension and Social Security. The monthly interest charges consume most of my payment, preventing principal reduction. Under California CCP § 704.110 and federal law, my pension and Social Security are statutorily judgment-proof, but I want to pay Citi back every dollar borrowed. I am formally asking for Citi's internal Hardship Workout Program with a 0% rate and a 48 to 60 month payment schedule."`
  },
  {
    institution: 'Discover',
    slug: 'discover',
    department: 'Hardship Assistance Team',
    phone: '1-800-347-2683',
    onlineUrl: 'https://www.discover.com',
    typicalTerms: '0.99% - 9.99% APR, 12 - 60 months, account closed to new spending',
    hardshipPhoneScript: (cardholderName, mask, balance) => 
      `"Hello, I am calling about my Discover account ending in •••• ${mask || 'XXXX'} ($${Number(balance || 0).toLocaleString()} balance). I am retired on Social Security and CalPERS. The ongoing interest is causing severe financial distress. I am requesting enrollment in Discover's Hardship Assistance Program for a reduced/0% APR and fixed monthly repayment plan so I can retire this balance in full."`
  },
  {
    institution: 'Chase',
    slug: 'chase',
    department: 'Special Assistance / Card Workout Department',
    phone: '1-800-935-9935',
    onlineUrl: 'https://www.chase.com',
    typicalTerms: '2% - 6% APR, 36 - 60 month structured payoff, account closed',
    hardshipPhoneScript: (cardholderName, mask, balance) => 
      `"Hello, I am calling regarding my Chase card ending in •••• ${mask || 'XXXX'}. My current balance is $${Number(balance || 0).toLocaleString()}. I am an elderly retiree on a fixed state pension and Social Security. I am requesting enrollment into Chase's Special Assistance Workout Program with a reduced interest rate and fixed payment plan in exchange for closing the card to future charges."`
  }
];
