import React, { useState, useMemo } from 'react';
import {
  Home,
  Users,
  Zap,
  Flame,
  Droplets,
  Car,
  BatteryCharging,
  Sparkles,
  Plus,
  Trash2,
  CheckCircle2,
  MapPin,
  Calendar,
  DollarSign,
  ShieldCheck,
  Copy,
  Check,
  ArrowRight,
  Info,
  Fuel,
  TrendingDown,
  Award
} from 'lucide-react';
import {
  DWELLING_TYPES,
  UTILITY_REGIONS,
  calculateHouseholdAndFleetMetrics,
  FREE_EV_CHARGING_GUIDE,
  ZERO_APR_EV_MODELS,
  EV_REBATE_STACK_PROGRAMS
} from '../utils/householdLifestyleEngine';

export default function HouseholdLifestyleHub({
  householdProfile,
  onUpdateProfile,
  onSyncUtilitiesToBills,
  onAskAiAdvisor
}) {
  const [subTab, setSubTab] = useState('utilities'); // 'utilities' | 'fleet' | 'ev_advisor'
  const [showAddCar, setShowAddCar] = useState(false);
  const [newCar, setNewCar] = useState({
    name: '',
    type: 'gas',
    mpgOrEfficiency: 30,
    monthlyMiles: 900,
    insuranceMonthly: 120,
    monthlyPayment: 0,
    freeChargingSharePercent: 30
  });

  // 0% APR EV Simulator state
  const [simEvMsrp, setSimEvMsrp] = useState(38500);
  const [simFedCredit, setSimFedCredit] = useState(7500);
  const [simStateRebate, setSimStateRebate] = useState(2500);
  const [simDownPayment, setSimDownPayment] = useState(2000);
  const [simTermMonths, setSimTermMonths] = useState(72);
  const [copiedScript, setCopiedScript] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState('');

  const metrics = useMemo(
    () => calculateHouseholdAndFleetMetrics(householdProfile),
    [householdProfile]
  );

  const handleFieldChange = (field, value) => {
    const next = { ...householdProfile, [field]: value };
    if (field === 'dwellingType') {
      const found = DWELLING_TYPES.find(d => d.id === value);
      if (found) next.sqFt = found.defaultSqFt;
    }
    onUpdateProfile(next);
  };

  const handleAddVehicle = (e) => {
    e.preventDefault();
    if (!newCar.name.trim()) return;
    const item = {
      id: `veh-${Date.now()}`,
      name: newCar.name.trim(),
      type: newCar.type,
      mpgOrEfficiency: Number(newCar.mpgOrEfficiency) || (newCar.type === 'ev' ? 28 : 30),
      monthlyMiles: Number(newCar.monthlyMiles) || 900,
      insuranceMonthly: Number(newCar.insuranceMonthly) || 120,
      monthlyPayment: Number(newCar.monthlyPayment) || 0,
      freeChargingSharePercent: newCar.type === 'ev' ? Number(newCar.freeChargingSharePercent || 30) : 0
    };
    onUpdateProfile({
      ...householdProfile,
      vehicles: [...(householdProfile.vehicles || []), item]
    });
    setNewCar({
      name: '',
      type: 'gas',
      mpgOrEfficiency: 30,
      monthlyMiles: 900,
      insuranceMonthly: 120,
      monthlyPayment: 0,
      freeChargingSharePercent: 30
    });
    setShowAddCar(false);
  };

  const handleRemoveVehicle = (id) => {
    onUpdateProfile({
      ...householdProfile,
      vehicles: (householdProfile.vehicles || []).filter(v => v.id !== id)
    });
  };

  const handleUpdateVehicle = (id, patch) => {
    onUpdateProfile({
      ...householdProfile,
      vehicles: (householdProfile.vehicles || []).map(v => v.id === id ? { ...v, ...patch } : v)
    });
  };

  const handleSyncToBills = () => {
    if (onSyncUtilitiesToBills) {
      onSyncUtilitiesToBills(metrics);
      setSyncSuccess('Synced PG&E Electric/Gas, Water/Trash, and Fleet Insurance to your Bills & Budgets!');
      setTimeout(() => setSyncSuccess(''), 4500);
    }
  };

  // 0% APR EV Math
  const netFinancedEvAmount = Math.max(0, simEvMsrp - simFedCredit - simStateRebate - simDownPayment);
  const zeroAprMonthlyPayment = Math.round(netFinancedEvAmount / simTermMonths);
  const currentGasSavedPerCar = metrics.fleet.vehicles.find(v => v.type !== 'ev')?.potentialEvSwitchSavings || 195;
  const trueNetOutOfPocketMonthly = Math.max(0, zeroAprMonthlyPayment - currentGasSavedPerCar);

  const dealerEmailScript = `Subject: Out-The-Door Quote & 0% APR Financing Inquiry – Ready to Purchase This Week

Hello Internet Fleet Manager,

I am a pre-qualified buyer located in ${householdProfile.cityOrZip || 'California'} looking to purchase a new EV this week before month-end.

I am requesting your best itemized Out-The-Door (OTD) price combining:
1. The manufacturer 0% APR promotional financing for ${simTermMonths} months
2. The $7,500 Federal Clean Vehicle Point-of-Sale Credit applied upfront at signing
3. Invoice / Volume Fleet discount with zero dealer-added accessories (no nitrogen, tint, or alarm markups)

Please reply with a written OTD worksheet and VIN in stock. I am comparing quotes from 3 volume EV dealerships today and will place a deposit immediately with the dealer who provides the cleanest written numbers.

Thank you,`;

  const handleCopyDealerScript = () => {
    navigator.clipboard.writeText(dealerEmailScript).then(() => {
      setCopiedScript(true);
      setTimeout(() => setCopiedScript(false), 3000);
    });
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
      {/* Header Banner */}
      <div className="px-5 sm:px-6 py-4.5 bg-gradient-to-r from-slate-900 via-[#18457c] to-[#143a68] text-white flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
            <Home className="w-5 h-5 text-emerald-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-serif-title text-base sm:text-lg font-bold tracking-tight">
                Household, Utility (PG&E / Water) & EV Fleet Advisor
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-400/30">
                Real-World Estimator
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5">
              Configure your home type, household size, and cars so Klarity & AI calculate real PG&E, water, gas, free EV charging, and 0% APR car strategies.
            </p>
          </div>
        </div>

        {/* Sub-Tab Switcher */}
        <div className="flex items-center bg-white/10 p-1 rounded-xl border border-white/15 text-xs self-start lg:self-center flex-wrap gap-1">
          <button
            type="button"
            onClick={() => setSubTab('utilities')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              subTab === 'utilities' ? 'bg-white text-[#18457c] font-semibold shadow-xs' : 'text-slate-200 hover:text-white'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Home & PG&E Bills</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('fleet')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              subTab === 'fleet' ? 'bg-white text-[#18457c] font-semibold shadow-xs' : 'text-slate-200 hover:text-white'
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>Our Cars & Fuel ({metrics.fleet.vehicles.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setSubTab('ev_advisor')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer ${
              subTab === 'ev_advisor' ? 'bg-white text-[#18457c] font-semibold shadow-xs' : 'text-slate-200 hover:text-white'
            }`}
          >
            <BatteryCharging className="w-3.5 h-3.5" />
            <span>Free Chargers & 0% APR EV Guide</span>
          </button>
        </div>
      </div>

      {/* Top Configuration Strip: Dwelling Type, Household Size, Location/Utility */}
      <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
        {/* 1. Dwelling Type */}
        <div className="bg-white p-3 rounded-xl border border-slate-200/80">
          <label className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mb-1">
            <Home className="w-3.5 h-3.5 text-[#18457c]" />
            <span>Where You Live</span>
          </label>
          <select
            value={householdProfile.dwellingType}
            onChange={e => handleFieldChange('dwellingType', e.target.value)}
            className="w-full font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer"
          >
            {DWELLING_TYPES.map(d => (
              <option key={d.id} value={d.id}>{d.label}</option>
            ))}
          </select>
          <div className="text-[10px] text-slate-400 mt-1 flex items-center justify-between">
            <span>Approx. Size:</span>
            <input
              type="number"
              value={householdProfile.sqFt}
              onChange={e => handleFieldChange('sqFt', Number(e.target.value) || 1000)}
              className="w-16 text-right font-semibold text-slate-700 border-b border-slate-300 focus:outline-none"
            />
            <span>sq ft</span>
          </div>
        </div>

        {/* 2. Household Size */}
        <div className="bg-white p-3 rounded-xl border border-slate-200/80">
          <label className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mb-1">
            <Users className="w-3.5 h-3.5 text-[#18457c]" />
            <span>Household Size</span>
          </label>
          <div className="flex items-center justify-between mt-1">
            <button
              type="button"
              onClick={() => handleFieldChange('householdSize', Math.max(1, (Number(householdProfile.householdSize) || 1) - 1))}
              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
            >
              -
            </button>
            <span className="text-base font-bold text-slate-900">
              {householdProfile.householdSize} {Number(householdProfile.householdSize) === 1 ? 'Person' : 'People'}
            </span>
            <button
              type="button"
              onClick={() => handleFieldChange('householdSize', Math.min(12, (Number(householdProfile.householdSize) || 1) + 1))}
              className="w-7 h-7 rounded-lg bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 cursor-pointer"
            >
              +
            </button>
          </div>
          <div className="text-[10px] text-slate-400 mt-1 text-center">
            Scales water, hot water & appliance load
          </div>
        </div>

        {/* 3. Utility Provider & Region */}
        <div className="bg-white p-3 rounded-xl border border-slate-200/80">
          <label className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mb-1">
            <Zap className="w-3.5 h-3.5 text-amber-600" />
            <span>Utility Rate Schedule</span>
          </label>
          <select
            value={householdProfile.utilityRegionId}
            onChange={e => handleFieldChange('utilityRegionId', e.target.value)}
            className="w-full font-bold text-slate-900 bg-transparent focus:outline-none cursor-pointer truncate"
          >
            {UTILITY_REGIONS.map(r => (
              <option key={r.id} value={r.id}>{r.name}</option>
            ))}
          </select>
          <div className="text-[10px] text-slate-400 mt-1 truncate">
            Std: ${metrics.region.standardRateKwh}/kWh • EV: ${metrics.region.evOffPeakRateKwh}/kWh
          </div>
        </div>

        {/* 4. City / ZIP Code */}
        <div className="bg-white p-3 rounded-xl border border-slate-200/80">
          <label className="text-[11px] font-semibold text-slate-500 flex items-center gap-1 mb-1">
            <MapPin className="w-3.5 h-3.5 text-rose-600" />
            <span>City or ZIP Code</span>
          </label>
          <input
            type="text"
            value={householdProfile.cityOrZip || ''}
            onChange={e => handleFieldChange('cityOrZip', e.target.value)}
            placeholder="e.g. San Jose, CA 95123"
            className="w-full font-bold text-slate-900 bg-transparent border-b border-slate-200 focus:border-[#18457c] focus:outline-none pb-0.5"
          />
          <div className="text-[10px] text-slate-400 mt-1">
            Local gas avg: ${metrics.region.avgGasPricePerGal.toFixed(2)}/gal
          </div>
        </div>

        {/* 5. PG&E CARE / Solar Discounts */}
        <div className="bg-white p-3 rounded-xl border border-slate-200/80 flex flex-col justify-between">
          <label className="flex items-center justify-between cursor-pointer">
            <span className="text-[11px] font-bold text-emerald-800">PG&E CARE / Senior (~32% Off)</span>
            <input
              type="checkbox"
              checked={Boolean(householdProfile.hasCareDiscount)}
              onChange={e => handleFieldChange('hasCareDiscount', e.target.checked)}
              className="rounded text-emerald-600 cursor-pointer"
            />
          </label>
          <label className="flex items-center justify-between cursor-pointer mt-1.5">
            <span className="text-[11px] font-semibold text-slate-600">Rooftop Solar Installed</span>
            <input
              type="checkbox"
              checked={Boolean(householdProfile.hasSolar)}
              onChange={e => handleFieldChange('hasSolar', e.target.checked)}
              className="rounded text-[#18457c] cursor-pointer"
            />
          </label>
          <div className="text-[10px] text-emerald-700 font-medium mt-1">
            {householdProfile.hasCareDiscount
              ? `Saving ~$${metrics.utilities.careMonthlySavingsPotential}/mo via CARE!`
              : `Enable CARE to save ~$${metrics.utilities.careMonthlySavingsPotential}/mo`}
          </div>
        </div>
      </div>

      {/* Sync Toast */}
      {syncSuccess && (
        <div className="px-5 py-2.5 bg-emerald-50 border-b border-emerald-200 text-xs text-emerald-800 font-semibold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{syncSuccess}</span>
        </div>
      )}

      {/* ================================================================= */}
      {/* SUB-TAB 1: HOME & UTILITY ESTIMATOR (PG&E, GAS, WATER/TRASH)      */}
      {/* ================================================================= */}
      {subTab === 'utilities' && (
        <div className="p-5 sm:p-6 flex flex-col gap-5">
          {/* Season Filter + Sync Button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs">
              <span className="font-semibold text-slate-600">Season Load:</span>
              {[
                { id: 'average', label: 'Spring / Fall Baseline' },
                { id: 'summer_ac', label: 'Summer Peak A/C' },
                { id: 'winter_heat', label: 'Winter Heating' }
              ].map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => handleFieldChange('climateSeason', s.id)}
                  className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                    householdProfile.climateSeason === s.id
                      ? 'bg-[#18457c] text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSyncToBills}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Sync Estimated Utilities to My Bills</span>
              </button>
              {onAskAiAdvisor && (
                <button
                  type="button"
                  onClick={() => onAskAiAdvisor(`Analyze my ${metrics.dwelling.label} (${metrics.sqFt} sq ft) for ${metrics.people} people in ${householdProfile.cityOrZip}. My estimated PG&E bill is $${metrics.utilities.totalPgeCombinedBill}/mo and water/trash is $${metrics.utilities.waterTrashTotalCost}/mo. How can I lower my PG&E and water bills right now?`)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#18457c] hover:bg-[#123561] text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ask AI to Audit My Bills</span>
                </button>
              )}
            </div>
          </div>

          {/* 3 Main Utility Breakdown Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Card 1: PG&E Electricity */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-500" />
                    <span>Electricity ({metrics.region.electricProvider.split('(')[0].trim()})</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-100 text-amber-800 font-bold">
                    {metrics.utilities.totalKwh} kWh/mo
                  </span>
                </div>
                <div className="text-2xl font-bold font-serif-title text-slate-900 mt-2">
                  ${metrics.utilities.homeElectricCost + metrics.utilities.evHomeChargingCost}
                  <span className="text-xs font-normal text-slate-500 font-sans ml-1">/mo</span>
                </div>
                <div className="mt-2 space-y-1 text-[11px] text-slate-600">
                  <div className="flex justify-between">
                    <span>Home & Appliances ({metrics.utilities.homeKwh} kWh):</span>
                    <span className="font-semibold">${metrics.utilities.homeElectricCost}/mo</span>
                  </div>
                  <div className="flex justify-between">
                    <span>EV Home Charging ({metrics.utilities.evHomeKwh} kWh):</span>
                    <span className="font-semibold text-emerald-700">${metrics.utilities.evHomeChargingCost}/mo</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-200/70 text-[10px] text-slate-500 flex justify-between">
                <span>Effective Rate:</span>
                <span className="font-semibold text-slate-700">
                  ${metrics.utilities.effectiveElectricRate}/kWh (EV: ${metrics.utilities.effectiveEvRate}/kWh)
                </span>
              </div>
            </div>

            {/* Card 2: PG&E Natural Gas */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Flame className="w-4 h-4 text-orange-500" />
                    <span>Natural Gas (Heating & Hot Water)</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-orange-100 text-orange-800 font-bold">
                    {metrics.utilities.monthlyTherms} Therms/mo
                  </span>
                </div>
                <div className="text-2xl font-bold font-serif-title text-slate-900 mt-2">
                  ${metrics.utilities.naturalGasCost}
                  <span className="text-xs font-normal text-slate-500 font-sans ml-1">/mo</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  Covers {metrics.people} {metrics.people === 1 ? 'person' : 'people'} (showers, laundry, stove) + furnace load for a {metrics.sqFt} sq ft {metrics.dwelling.label.toLowerCase()}.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-200/70 text-[10px] text-slate-500 flex justify-between">
                <span>Combined PG&E Bill (Electric + Gas):</span>
                <span className="font-bold text-[#18457c]">${metrics.utilities.totalPgeCombinedBill}/mo</span>
              </div>
            </div>

            {/* Card 3: Municipal Water, Sewer & Trash */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span className="flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-blue-500" />
                    <span>Water, Sewer & Trash</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold">
                    {metrics.utilities.monthlyWaterGallons.toLocaleString()} Gal/mo
                  </span>
                </div>
                <div className="text-2xl font-bold font-serif-title text-slate-900 mt-2">
                  ${metrics.utilities.waterTrashTotalCost}
                  <span className="text-xs font-normal text-slate-500 font-sans ml-1">/mo</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-2 leading-relaxed">
                  Includes indoor usage (~68 gal/person/day) + {metrics.dwelling.label.toLowerCase()} irrigation & municipal sewer/waste collection.
                </p>
              </div>
              <div className="mt-3 pt-2.5 border-t border-slate-200/70 text-[10px] text-slate-500 flex justify-between">
                <span>All-In Monthly Home Utilities:</span>
                <span className="font-bold text-slate-900">${metrics.utilities.totalUtilitiesMonthly}/mo</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SUB-TAB 2: HOUSEHOLD VEHICLE FLEET (GAS vs. HYBRID vs. EV)        */}
      {/* ================================================================= */}
      {subTab === 'fleet' && (
        <div className="p-5 sm:p-6 flex flex-col gap-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-bold text-slate-900">
                Household Vehicles ({metrics.fleet.vehicles.length}) • Total Monthly Fuel & Fleet Spend: ${metrics.fleet.totalFleetMonthly.toLocaleString()}/mo
              </h4>
              <p className="text-xs text-slate-500">
                Gasoline: ${metrics.fleet.totalMonthlyGasCost}/mo • Home EV Charging: ${metrics.fleet.totalMonthlyEvHomeCost}/mo • Insurance: ${metrics.fleet.totalMonthlyInsurance}/mo • Maint: ${metrics.fleet.totalMonthlyMaintenance}/mo
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowAddCar(!showAddCar)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#18457c] hover:bg-[#123561] text-white text-xs font-bold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Car to Household</span>
              </button>
              <button
                type="button"
                onClick={() => setSubTab('ev_advisor')}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer"
              >
                <BatteryCharging className="w-3.5 h-3.5" />
                <span>See 0% APR EV Upgrade Math</span>
              </button>
            </div>
          </div>

          {/* Add Car Form */}
          {showAddCar && (
            <form onSubmit={handleAddVehicle} className="p-4 rounded-xl bg-slate-50 border border-slate-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 text-xs">
              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-600 mb-1">Year, Make & Model</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2024 Hyundai Ioniq 5 or Honda Accord"
                  value={newCar.name}
                  onChange={e => setNewCar({ ...newCar, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Powertrain Type</label>
                <select
                  value={newCar.type}
                  onChange={e => {
                    const t = e.target.value;
                    setNewCar({
                      ...newCar,
                      type: t,
                      mpgOrEfficiency: t === 'ev' ? 28 : t === 'hybrid' ? 48 : 28
                    });
                  }}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200 font-semibold"
                >
                  <option value="gas">Gasoline (ICE)</option>
                  <option value="hybrid">Hybrid (HEV)</option>
                  <option value="phev">Plug-In Hybrid (PHEV)</option>
                  <option value="ev">100% Electric (EV)</option>
                </select>
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">
                  {newCar.type === 'ev' ? 'kWh per 100 Mi' : 'Average MPG'}
                </label>
                <input
                  type="number"
                  value={newCar.mpgOrEfficiency}
                  onChange={e => setNewCar({ ...newCar, mpgOrEfficiency: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-600 mb-1">Monthly Miles</label>
                <input
                  type="number"
                  value={newCar.monthlyMiles}
                  onChange={e => setNewCar({ ...newCar, monthlyMiles: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-200"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  type="submit"
                  className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                >
                  Save Vehicle
                </button>
              </div>
            </form>
          )}

          {/* Vehicle Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {metrics.fleet.vehicles.map(v => (
              <div key={v.id} className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between gap-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{v.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        v.type === 'ev'
                          ? 'bg-emerald-100 text-emerald-800'
                          : v.type === 'hybrid' || v.type === 'phev'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-amber-100 text-amber-800'
                      }`}>
                        {v.type === 'ev' ? '100% Electric EV' : v.type === 'hybrid' ? 'Hybrid' : v.type === 'phev' ? 'Plug-In Hybrid' : 'Gasoline'}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {v.monthlyMiles.toLocaleString()} miles/mo • {v.type === 'ev' ? `${v.mpgOrEfficiency} kWh/100mi` : `${v.mpgOrEfficiency} MPG`}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveVehicle(v.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-200/60 cursor-pointer"
                    title="Remove vehicle"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* Cost Breakdown */}
                <div className="grid grid-cols-3 gap-2 p-2.5 bg-white rounded-xl border border-slate-200/70 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">
                      {v.type === 'ev' ? 'Home EV Charge' : 'Monthly Gas'}
                    </span>
                    <span className="font-bold text-slate-900 text-sm">${v.monthlyFuelOrChargeCost}/mo</span>
                    <span className="text-[10px] text-slate-500 block">
                      {v.type === 'ev' ? `${v.paidHomeKwh} kWh paid (${v.freeKwh} free)` : `${v.gallonsUsed} gal @ $${metrics.region.avgGasPricePerGal}`}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Insurance & Maint.</span>
                    <span className="font-bold text-slate-900 text-sm">${v.insuranceMonthly + v.maintenance}/mo</span>
                    <span className="text-[10px] text-slate-500 block">
                      Ins: ${v.insuranceMonthly} • Maint: ${v.maintenance}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Total Operating</span>
                    <span className="font-bold text-[#18457c] text-sm">${v.totalMonthlyVehicleCost}/mo</span>
                    <span className="text-[10px] text-slate-500 block">
                      {v.monthlyPayment > 0 ? `Includes $${v.monthlyPayment} loan` : 'Paid off ($0 loan)'}
                    </span>
                  </div>
                </div>

                {/* EV Free Charging Slider OR Gas-to-EV Upgrade Savings Callout */}
                {v.type === 'ev' ? (
                  <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-200/80 text-[11px] text-emerald-900 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between font-semibold">
                      <span>Share of Charging Done at Free Local Chargers:</span>
                      <span className="font-bold text-emerald-700">{v.freeChargingSharePercent || 0}% Free</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={v.freeChargingSharePercent || 0}
                      onChange={e => handleUpdateVehicle(v.id, { freeChargingSharePercent: Number(e.target.value) })}
                      className="w-full accent-emerald-600 cursor-pointer"
                    />
                    <div className="text-[10px] text-emerald-700">
                      Saves <strong>${v.monthlyFuelSavings}/mo</strong> (${v.monthlyFuelSavings * 12}/yr) compared to driving a 30 MPG gas car!
                    </div>
                  </div>
                ) : (
                  <div className="p-2.5 rounded-lg bg-blue-50/70 border border-blue-200/80 text-[11px] text-slate-700 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-[#18457c]">EV Switch Savings:</span> Replacing this gas car with an EV saves <strong>~${v.potentialEvSwitchSavings}/mo</strong> (${v.potentialEvSwitchSavings * 12}/yr) in fuel & oil changes!
                    </div>
                    <button
                      type="button"
                      onClick={() => setSubTab('ev_advisor')}
                      className="px-2.5 py-1 rounded-lg bg-[#18457c] text-white font-semibold text-[10px] shrink-0 cursor-pointer"
                    >
                      0% APR Math
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* SUB-TAB 3: FREE EV CHARGERS & 0% APR NEW EV BUYING ADVISOR        */}
      {/* ================================================================= */}
      {subTab === 'ev_advisor' && (
        <div className="p-5 sm:p-6 flex flex-col gap-6">
          {/* Section 1: Interactive 0% APR EV Acquisition & Gas-Offset Calculator */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200/90 flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-emerald-600" />
                  <h4 className="font-serif-title text-base font-bold text-slate-900">
                    0% APR New Electric Car Buying & Gas-Offset Calculator
                  </h4>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  See how stacking a 0% APR manufacturer loan + $7,500 instant IRS credit + your monthly gas savings lowers your real payment.
                </p>
              </div>
              {onAskAiAdvisor && (
                <button
                  type="button"
                  onClick={() => onAskAiAdvisor(`I live in ${householdProfile.cityOrZip} with ${metrics.people} people and currently spend $${metrics.fleet.totalMonthlyGasCost}/mo on gas. Walk me through the best 0% APR electric car to buy right now, which dealership in my area to contact, when to buy it, and where I can charge it for free nearby.`)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#18457c] hover:bg-[#123561] text-white text-xs font-bold cursor-pointer shrink-0"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Ask AI for Custom Local Dealer & Charger Plan</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <label className="text-[10px] font-semibold text-slate-500 block">Vehicle Price (MSRP/Invoice)</label>
                <div className="flex items-center gap-1 mt-1">
                  <span className="font-bold text-slate-400">$</span>
                  <input
                    type="number"
                    value={simEvMsrp}
                    onChange={e => setSimEvMsrp(Number(e.target.value) || 0)}
                    className="w-full font-bold text-sm text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <label className="text-[10px] font-semibold text-emerald-700 block">Instant IRS POS Credit</label>
                <select
                  value={simFedCredit}
                  onChange={e => setSimFedCredit(Number(e.target.value))}
                  className="w-full font-bold text-sm text-emerald-700 bg-transparent mt-1 focus:outline-none"
                >
                  <option value={7500}>-$7,500 (Full IRS 30D)</option>
                  <option value={3750}>-$3,750 (Partial)</option>
                  <option value={0}>$0</option>
                </select>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <label className="text-[10px] font-semibold text-emerald-700 block">CA / PG&E / Dealer Cash</label>
                <div className="flex items-center gap-1 mt-1">
                  <span className="font-bold text-emerald-600">-$</span>
                  <input
                    type="number"
                    value={simStateRebate}
                    onChange={e => setSimStateRebate(Number(e.target.value) || 0)}
                    className="w-full font-bold text-sm text-emerald-700 focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <label className="text-[10px] font-semibold text-slate-500 block">Down Payment / Trade-In</label>
                <div className="flex items-center gap-1 mt-1">
                  <span className="font-bold text-slate-400">-$</span>
                  <input
                    type="number"
                    value={simDownPayment}
                    onChange={e => setSimDownPayment(Number(e.target.value) || 0)}
                    className="w-full font-bold text-sm text-slate-900 focus:outline-none"
                  />
                </div>
              </div>

              <div className="bg-white p-3 rounded-xl border border-slate-200">
                <label className="text-[10px] font-semibold text-slate-500 block">0% APR Loan Term</label>
                <select
                  value={simTermMonths}
                  onChange={e => setSimTermMonths(Number(e.target.value))}
                  className="w-full font-bold text-sm text-[#18457c] bg-transparent mt-1 focus:outline-none"
                >
                  <option value={48}>48 Months @ 0% APR</option>
                  <option value={60}>60 Months @ 0% APR</option>
                  <option value={72}>72 Months @ 0% APR</option>
                </select>
              </div>
            </div>

            {/* Result Banner */}
            <div className="p-4 rounded-xl bg-gradient-to-r from-[#18457c] to-slate-900 text-white grid grid-cols-1 sm:grid-cols-4 gap-4 items-center">
              <div>
                <div className="text-[11px] text-slate-300">Net Financed Principal</div>
                <div className="text-xl font-bold font-serif-title">${netFinancedEvAmount.toLocaleString()}</div>
                <div className="text-[10px] text-emerald-300">Total Interest Paid: $0.00 (0% APR)</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-300">0% APR Monthly Payment</div>
                <div className="text-xl font-bold font-serif-title">${zeroAprMonthlyPayment}/mo</div>
                <div className="text-[10px] text-slate-300">100% of payment goes to principal</div>
              </div>
              <div>
                <div className="text-[11px] text-slate-300">Minus Monthly Gas/Oil Saved</div>
                <div className="text-xl font-bold font-serif-title text-emerald-300">-${currentGasSavedPerCar}/mo</div>
                <div className="text-[10px] text-slate-300">Using free + PG&E off-peak charging</div>
              </div>
              <div className="p-3 rounded-xl bg-white/10 border border-white/20">
                <div className="text-[11px] text-emerald-200 font-semibold">True Net Monthly Impact</div>
                <div className="text-2xl font-bold font-serif-title text-white">${trueNetOutOfPocketMonthly}/mo</div>
                <div className="text-[10px] text-slate-200">Effective cost after gas savings!</div>
              </div>
            </div>
          </div>

          {/* Section 2: Best 0% APR Electric Vehicles on the Market */}
          <div>
            <h4 className="text-sm font-bold text-slate-900 mb-2.5 flex items-center gap-2">
              <Car className="w-4 h-4 text-[#18457c]" />
              <span>Top New Electric Vehicles Offering 0% APR & Instant Rebates</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {ZERO_APR_EV_MODELS.map((ev, i) => (
                <div key={i} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between gap-2 text-xs">
                  <div>
                    <div className="flex items-center justify-between gap-1">
                      <span className="font-bold text-slate-900">{ev.model}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                        {ev.promoApr}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Range: <strong>{ev.epaRange}</strong> • MSRP: {ev.msrpRange}
                    </div>
                    <p className="text-[11px] text-slate-700 mt-2">
                      <strong>Incentives:</strong> {ev.federalAndDealerCash}
                    </p>
                    <p className="text-[11px] text-emerald-700 mt-1">
                      <strong>Charging Perk:</strong> {ev.chargingPerk}
                    </p>
                  </div>
                  <div className="pt-2 border-t border-slate-200/70 text-[10px] text-slate-500">
                    <strong>Where to buy:</strong> {ev.bestWhereToBuy}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Where to Charge for FREE Nearby + Rebate Stacking */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Free EV Charging Networks */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col gap-3">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <BatteryCharging className="w-4 h-4 text-emerald-600" />
                <span>Where to Charge Your EV for FREE Nearby ({householdProfile.cityOrZip})</span>
              </h4>
              <div className="space-y-2.5">
                {FREE_EV_CHARGING_GUIDE.map((item, idx) => (
                  <div key={idx} className="p-3 bg-white rounded-xl border border-slate-200/80 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{item.category}</span>
                      <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold text-[10px] border border-emerald-200">
                        {item.cost}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1">
                      <strong>Where:</strong> {item.locations}
                    </div>
                    <div className="text-[10px] text-slate-500 mt-1">
                      <strong>Advisor Tip:</strong> {item.tip}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* When & How to Buy + Copyable Dealer Script */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/90 flex flex-col justify-between gap-4">
              <div className="flex flex-col gap-3">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[#18457c]" />
                  <span>When & How to Buy a 0% APR EV (Step-by-Step Playbook)</span>
                </h4>
                <div className="space-y-2 text-xs text-slate-700">
                  <div className="p-2.5 bg-white rounded-xl border border-slate-200">
                    <strong>1. Best Calendar Timing:</strong> Shop during the <strong>last 5 days of March, June, September, or December</strong> (quarter-end) when automakers pay dealers $1,500–$3,000 per unit volume bonuses.
                  </div>
                  {EV_REBATE_STACK_PROGRAMS.map((prog, idx) => (
                    <div key={idx} className="p-2.5 bg-white rounded-xl border border-slate-200">
                      <div className="flex items-center justify-between">
                        <strong className="text-slate-900">{prog.name}</strong>
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">{prog.amount}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-1">{prog.eligibility}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Copyable Dealer Email Negotiation Script */}
              <div className="p-3.5 bg-slate-900 text-slate-100 rounded-xl flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-300">Copyable Fleet Manager 0% APR Email Script</span>
                  <button
                    type="button"
                    onClick={handleCopyDealerScript}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-semibold cursor-pointer"
                  >
                    {copiedScript ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedScript ? 'Copied!' : 'Copy Email Script'}</span>
                  </button>
                </div>
                <pre className="text-[10px] font-mono text-slate-300 whitespace-pre-wrap leading-relaxed max-h-32 overflow-y-auto">
                  {dealerEmailScript}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
