'use client';

import { useState } from 'react';
import { simulateChange, type WhatIfResult } from '@/lib/planning/what-if';
import { formatINR } from '@/lib/date';
import type { CategoryAllocation } from '@/lib/planning/budget';
import type { EventType } from '@/lib/constants';
import { Sparkles, AlertTriangle, ArrowRight, X, Check } from 'lucide-react';

interface WhatIfModalProps {
  isOpen: boolean;
  onClose: () => void;
  eventType: EventType;
  currentBudget: number;
  currentGuests: number;
  currentDate: string;
  currentTheme: string;
  categories: CategoryAllocation[];
  onApply: (changes: { newBudget?: number; newGuests?: number; newDate?: string; newTheme?: string }) => Promise<void>;
}

export function WhatIfModal({
  isOpen,
  onClose,
  eventType,
  currentBudget,
  currentGuests,
  currentDate,
  currentTheme,
  categories,
  onApply,
}: WhatIfModalProps) {
  const [simBudget, setSimBudget] = useState(currentBudget);
  const [simGuests, setSimGuests] = useState(currentGuests);
  const [simDate, setSimDate] = useState(currentDate);
  const [simTheme, setSimTheme] = useState(currentTheme);
  const [applying, setApplying] = useState(false);

  if (!isOpen) return null;

  // Pure simulation computation
  const result: WhatIfResult = simulateChange(
    {
      currentBudget,
      currentGuests,
      currentDate,
      categories,
      eventType,
    },
    {
      newBudget: simBudget !== currentBudget ? simBudget : undefined,
      newGuests: simGuests !== currentGuests ? simGuests : undefined,
      newDate: simDate !== currentDate ? simDate : undefined,
      newTheme: simTheme !== currentTheme ? simTheme : undefined,
    }
  );

  const currentCostPerGuest = currentGuests > 0 ? Math.floor(currentBudget / currentGuests) : 0;
  const currentTotalEstimated = categories.reduce((s, c) => s + c.estimated, 0);

  const handleConfirm = async () => {
    try {
      setApplying(true);
      await onApply({
        newBudget: simBudget !== currentBudget ? simBudget : undefined,
        newGuests: simGuests !== currentGuests ? simGuests : undefined,
        newDate: simDate !== currentDate ? simDate : undefined,
        newTheme: simTheme !== currentTheme ? simTheme : undefined,
      });
      onClose();
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 border border-[#E5DBCB] shadow-xl space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-[#E5DBCB] pb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#F3ECE0] text-[#8B7BB8] flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-serif text-xl font-bold text-[#26232B]">What-If Scenario Simulator</h2>
              <p className="text-xs text-[#665F6B]">Test guest, budget, date or theme variations safely without mutating your live event.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-[#665F6B] hover:bg-[#FAF6EF]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#665F6B] uppercase tracking-wider block">
              Simulated Budget (INR)
            </label>
            <input
              type="number"
              step={10000}
              value={simBudget}
              onChange={(e) => setSimBudget(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl border border-[#E5DBCB] text-sm font-semibold"
            />
            <span className="text-[11px] text-[#8B7BB8] font-medium">{formatINR(simBudget)}</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#665F6B] uppercase tracking-wider block">
              Simulated Guest Count
            </label>
            <input
              type="number"
              min={1}
              max={5000}
              value={simGuests}
              onChange={(e) => setSimGuests(Number(e.target.value))}
              className="w-full px-3 py-2.5 rounded-xl border border-[#E5DBCB] text-sm font-semibold"
            />
            <span className="text-[11px] text-[#665F6B]">{simGuests} attendees</span>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#665F6B] uppercase tracking-wider block">
              Simulated Event Date
            </label>
            <input
              type="date"
              value={simDate}
              onChange={(e) => setSimDate(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#E5DBCB] text-sm"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#665F6B] uppercase tracking-wider block">
              Simulated Theme
            </label>
            <select
              value={simTheme}
              onChange={(e) => setSimTheme(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-[#E5DBCB] text-sm"
            >
              <option value="Traditional">Traditional</option>
              <option value="Modern">Modern</option>
              <option value="Rustic">Rustic</option>
              <option value="Minimal">Minimal</option>
              <option value="Floral">Floral</option>
            </select>
          </div>
        </div>

        {/* Warnings & Conflicts */}
        {result.conflict && (
          <div className="p-3 rounded-xl bg-[#FDEAE6] border border-[#F6C5BC] text-[#E8735A] text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              Budget Conflict: Locked allocations (₹{formatINR(result.conflict.lockedTotal)}) exceed new budget (₹{formatINR(result.conflict.totalBudget)}) by ₹{formatINR(result.conflict.difference)}. Unlock categories first.
            </span>
          </div>
        )}

        {result.warnings.length > 0 && (
          <div className="space-y-1">
            {result.warnings.map((w, i) => (
              <p key={i} className="text-xs text-[#8C6D1F] bg-[#FFF9E6] p-2 rounded-lg border border-[#FFE2A3]">
                {w}
              </p>
            ))}
          </div>
        )}

        {/* Live Comparison Delta Table */}
        <div className="bg-[#FAF6EF] rounded-2xl p-4 border border-[#E5DBCB] space-y-3">
          <h4 className="text-xs font-bold text-[#665F6B] uppercase tracking-wider">Before vs After Comparison</h4>
          <div className="grid grid-cols-3 gap-2 text-xs border-b border-[#E5DBCB] pb-2 font-semibold text-[#665F6B]">
            <div>Metric</div>
            <div className="text-right">Current Live</div>
            <div className="text-right">Simulated</div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs py-1">
            <span className="text-[#665F6B]">Cost Per Guest</span>
            <span className="text-right font-medium">{formatINR(currentCostPerGuest)}</span>
            <span className={`text-right font-bold ${result.costPerGuest > currentCostPerGuest ? 'text-[#E8735A]' : 'text-[#3C8C30]'}`}>
              {formatINR(result.costPerGuest)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs py-1">
            <span className="text-[#665F6B]">Total Estimated</span>
            <span className="text-right font-medium">{formatINR(currentTotalEstimated)}</span>
            <span className={`text-right font-bold ${result.estimatedTotal > currentTotalEstimated ? 'text-[#E8735A]' : 'text-[#3C8C30]'}`}>
              {formatINR(result.estimatedTotal)}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs py-1">
            <span className="text-[#665F6B]">Guest Sensitivity</span>
            <span className="text-right text-[#665F6B]">Static</span>
            <span className="text-right text-[#8B7BB8] font-medium">
              Scaled Catering/Transport
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-[#E5DBCB] text-xs font-semibold text-[#665F6B] hover:bg-[#FAF6EF]"
          >
            Cancel (Keep Current)
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={applying || !!result.conflict}
            className="px-6 py-2.5 rounded-xl bg-[#26232B] text-[#FAF6EF] text-xs font-bold hover:bg-[#3D3845] transition-all flex items-center gap-1.5 disabled:opacity-50"
          >
            <Check className="w-4 h-4 text-[#C9A96A]" />
            <span>{applying ? 'Applying...' : 'Apply Simulation to Event'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

