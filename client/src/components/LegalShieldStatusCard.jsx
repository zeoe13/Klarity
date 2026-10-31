import React, { useState } from 'react';
import { 
  ShieldCheck, 
  ShieldAlert, 
  Lock, 
  HelpCircle, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  User, 
  DollarSign, 
  Info,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { calculateJudgmentProofRatio, calculateDTI } from '../utils/statutoryDebtEngine';

export default function LegalShieldStatusCard({ 
  incomeStreams = [], 
  debtAccounts = [], 
  onUpdateIncomeStreams 
}) {
  const [underwritingMode, setUnderwritingMode] = useState('individual'); // 'individual' | 'household'
  const [showLegalDetails, setShowLegalDetails] = useState(false);
  const [showIncomeBreakdown, setShowIncomeBreakdown] = useState(false);

  const shieldData = calculateJudgmentProofRatio(incomeStreams);
  const dtiData = calculateDTI(debtAccounts, incomeStreams, underwritingMode);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* Header Banner */}
      <div className="px-5 sm:px-6 py-4.5 bg-gradient-to-r from-slate-900 via-[#18457c] to-[#143a68] text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-serif-title text-base sm:text-lg font-bold tracking-tight">
                Statutory Legal Shield & Judgment-Proof Status
              </h3>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30">
                <Lock className="w-3 h-3" />
                <span>{shieldData.shieldedRatioPercent.toFixed(0)}% Protected</span>
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              42 U.S.C. § 407 (Social Security) · California CCP § 704.110 (CalPERS) · 31 CFR Part 212
            </p>
          </div>
        </div>

        {/* 12 CFR § 1026.51 CARD Act Mode Switcher */}
        <div className="flex items-center bg-white/10 p-1 rounded-xl border border-white/15 text-xs self-start sm:self-center">
          <button
            type="button"
            onClick={() => setUnderwritingMode('individual')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              underwritingMode === 'individual'
                ? 'bg-white text-[#18457c] shadow-xs font-semibold'
                : 'text-slate-200 hover:text-white'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Individual</span>
          </button>
          <button
            type="button"
            onClick={() => setUnderwritingMode('household')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              underwritingMode === 'household'
                ? 'bg-white text-[#18457c] shadow-xs font-semibold'
                : 'text-slate-200 hover:text-white'
            }`}
            title="Under 12 CFR § 1026.51, applicants 21+ can report accessible shared household income"
          >
            <Users className="w-3.5 h-3.5" />
            <span>Household (CARD Act)</span>
          </button>
        </div>
      </div>

      {/* Main Metric Cards Grid */}
      <div className="p-5 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Metric 1: Protected Income */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span>Shielded Monthly Income</span>
              <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-100">
                100% Un-Garnishable
              </span>
            </div>
            <div className="text-2xl font-bold font-serif-title text-slate-900 mt-2">
              ${shieldData.shieldedMonthlyIncome.toLocaleString()}
              <span className="text-xs font-normal text-slate-500 font-sans ml-1">/mo</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              From Social Security (${(shieldData.exemptStreams.find(s => s.type === 'social_security')?.amount || 0).toLocaleString()}) & CalPERS (${(shieldData.exemptStreams.find(s => s.type === 'calpers')?.amount || 0).toLocaleString()}).
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200/70 text-[10px] text-slate-600 flex items-center justify-between">
            <span>Total Monthly Inflow:</span>
            <span className="font-semibold text-slate-800">${shieldData.totalMonthlyIncome.toLocaleString()}</span>
          </div>
        </div>

        {/* Metric 2: 31 CFR Part 212 Federal Bank Cushion */}
        <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-emerald-900 font-medium">
              <span className="flex items-center gap-1">
                <span>31 CFR Part 212 Bank Cushion</span>
                <Info className="w-3.5 h-3.5 text-emerald-700" title="Automatic 2-month lookback protection against private bank account garnishments without court filings" />
              </span>
              <span className="font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-md">
                2-Mo Lookback
              </span>
            </div>
            <div className="text-2xl font-bold font-serif-title text-emerald-900 mt-2">
              ${shieldData.lookbackBankCushion.toLocaleString()}
            </div>
            <p className="text-[11px] text-emerald-800/90 mt-1.5 leading-relaxed">
              Mandatory automatic federal safe zone. Your bank is legally barred from freezing or handing these funds to private card banks.
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-emerald-200/60 text-[10px] text-emerald-800 font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span>Automatic bank shield active</span>
          </div>
        </div>

        {/* Metric 3: Underwriting & DTI Engine (12 CFR § 1026.51) */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
              <span className="capitalize">{underwritingMode} DTI Ratio</span>
              <span className={`font-bold px-2 py-0.5 rounded-md text-[10px] uppercase ${
                dtiData.dtiTier === 'prime' 
                  ? 'bg-emerald-100 text-emerald-800' 
                  : dtiData.dtiTier === 'moderate' 
                    ? 'bg-amber-100 text-amber-800' 
                    : 'bg-rose-100 text-rose-800'
              }`}>
                {dtiData.dtiTier}
              </span>
            </div>
            <div className="text-2xl font-bold font-serif-title text-slate-900 mt-2">
              {dtiData.dtiPercent.toFixed(1)}%
              <span className="text-xs font-normal text-slate-500 font-sans ml-1">
                (${Math.round(dtiData.totalDebtMinPayment)}/mo min pay)
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5 leading-tight">
              {dtiData.underwritingNote}
            </p>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-200/70 text-[10px] text-slate-600 flex items-center justify-between">
            <span>Realistic Credit Limit Cap:</span>
            <span className="font-semibold text-slate-800">{dtiData.realisticCreditIncreaseCap}</span>
          </div>
        </div>
      </div>

      {/* Accordion Toggle: Legal Shield Details */}
      <div className="px-5 sm:px-6 py-3 bg-slate-50 border-t border-slate-200/70 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowLegalDetails(!showLegalDetails)}
          className="text-xs font-semibold text-[#18457c] hover:text-[#123561] flex items-center gap-1.5 cursor-pointer"
        >
          <span>{showLegalDetails ? 'Hide' : 'View'} Statutory Statutes & Non-Exempt Exceptions</span>
          {showLegalDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        <span className="text-[11px] text-slate-500 hidden sm:inline">
          Governed by Federal & California State Laws
        </span>
      </div>

      {/* Expanded Statutory Details */}
      {showLegalDetails && (
        <div className="px-5 sm:px-6 py-4 bg-slate-50/50 border-t border-slate-200/60 text-xs text-slate-700 flex flex-col gap-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Statutory Exemptions (100% Protected)</span>
              </h4>
              <ul className="mt-2 space-y-1 text-[11px] text-slate-600 list-disc list-inside">
                <li><strong>42 U.S.C. § 407 (Social Security Act § 207)</strong>: Social Security benefits cannot be assigned, transferred, levied, or garnished by commercial credit card banks.</li>
                <li><strong>California CCP § 704.110</strong>: CalPERS, STRS, and state/county public employee retirement benefits are exempt from money judgments.</li>
                <li><strong>31 CFR Part 212</strong>: Mandatory 2-month lookback rule prohibiting bank freeze of direct-deposited exempt funds.</li>
              </ul>
            </div>

            <div className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs">
              <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>Non-Exempt Obligations (Who Can Garnish)</span>
              </h4>
              <p className="mt-2 text-[11px] text-slate-600 leading-relaxed">
                Only the following rare statutory entities can attach to Social Security or CalPERS:
              </p>
              <ul className="mt-1 space-y-1 text-[11px] text-slate-600 list-disc list-inside">
                <li>Past-due federal income taxes (IRS federal tax liens under 26 U.S.C. § 6334).</li>
                <li>Court-ordered child support or alimony obligations.</li>
                <li>Defaulted federal government student loans.</li>
              </ul>
              <p className="mt-2 text-[10px] font-semibold text-emerald-700 bg-emerald-50 p-1.5 rounded-lg border border-emerald-200">
                Commercial credit card issuers (Amex, Citi, Discover, Chase) have zero legal authority to touch your retirement funds.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
