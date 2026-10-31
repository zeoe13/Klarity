import React, { useState } from 'react';
import { 
  X, 
  PhoneCall, 
  Copy, 
  Check, 
  ExternalLink, 
  ShieldCheck, 
  Building2, 
  AlertCircle,
  FileText
} from 'lucide-react';
import { HARDSHIP_CREDITORS } from '../utils/statutoryDebtEngine';

export default function HardshipPlaybookModal({ 
  isOpen, 
  onClose, 
  cards = [], 
  userName = 'Cardholder' 
}) {
  const [selectedSlug, setSelectedSlug] = useState('amex');
  const [selectedCardId, setSelectedCardId] = useState(cards[0]?.id || 'custom');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentCreditor = HARDSHIP_CREDITORS.find(c => c.slug === selectedSlug) || HARDSHIP_CREDITORS[0];
  
  // Find card matching selection or creditor
  const matchedCard = cards.find(c => c.id === selectedCardId) || 
    cards.find(c => (c.name || '').toLowerCase().includes(currentCreditor.slug)) || 
    cards[0] || 
    { mask: '4417', balance: 8000, name: 'Card' };

  const scriptText = currentCreditor.hardshipPhoneScript(
    userName, 
    matchedCard.mask || '4417', 
    matchedCard.balance || 8000
  );

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptText).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    });
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full p-6 shadow-2xl flex flex-col gap-5 text-slate-800 animate-in fade-in zoom-in-95 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <PhoneCall className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-serif-title text-base font-bold text-slate-900">
                Actionable 0% Hardship Negotiation Playbook
              </h3>
              <p className="text-xs text-slate-500">
                Word-for-word scripts grounded in statutory judgment-proof protections.
              </p>
            </div>
          </div>
          <button 
            type="button" 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Bank Selector Tabs */}
        <div>
          <label className="text-xs font-semibold text-slate-600 block mb-2">Select Your Card Issuer:</label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {HARDSHIP_CREDITORS.map(creditor => {
              const isSelected = selectedSlug === creditor.slug;
              return (
                <button
                  key={creditor.slug}
                  type="button"
                  onClick={() => setSelectedSlug(creditor.slug)}
                  className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    isSelected
                      ? 'bg-[#18457c] border-[#18457c] text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <span>{creditor.institution}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Specific Account Details Banner */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <span className="text-slate-500 font-medium">Department:</span>
            <span className="font-bold text-slate-800 ml-1.5">{currentCreditor.department}</span>
            <div className="text-[11px] text-slate-500 mt-0.5">
              Typical outcome: {currentCreditor.typicalTerms}
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-center">
            <a
              href={`tel:${currentCreditor.phone.replace(/[^0-9]/g, '')}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
            >
              <PhoneCall className="w-3.5 h-3.5" />
              <span>{currentCreditor.phone}</span>
            </a>
          </div>
        </div>

        {/* Pre-populated Word-for-Word Script */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-[#18457c]" />
              <span>Pre-Populated Negotiation Script (Read verbatim):</span>
            </label>
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-500" />
                  <span>Copy Script</span>
                </>
              )}
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-900 text-slate-100 text-xs font-mono leading-relaxed border border-slate-800 shadow-inner select-all">
            {scriptText}
          </div>
        </div>

        {/* NFCC Certified Non-Profit Backup Dispatch */}
        <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div>
            <div className="font-bold text-[#18457c] flex items-center gap-1.5">
              <Building2 className="w-4 h-4 text-[#18457c]" />
              <span>Certified Non-Profit Alternative (NFCC / MMI)</span>
            </div>
            <p className="text-[11px] text-slate-600 mt-0.5">
              If the bank front-line representative refuses, call the National Foundation for Credit Counseling (NFCC). Certified agencies mandate 0%-8% concessions across all cards and waive setup fees for low-income seniors.
            </p>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
            <a
              href="tel:18003882227"
              className="px-3 py-1.5 rounded-lg bg-[#18457c] hover:bg-[#123561] text-white font-semibold text-xs"
            >
              1-800-388-2227
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
          >
            Close Playbook
          </button>
        </div>
      </div>
    </div>
  );
}
