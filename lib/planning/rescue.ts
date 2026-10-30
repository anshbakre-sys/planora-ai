import { RESCUE_PRIORITY, RESCUE_MAX_CUT_RATIO, CONTINGENCY_WARN_RATIO } from '@/lib/constants';
import type { CategoryAllocation, BudgetSummary } from './budget';

export interface RescueCut {
  category: string;
  currentEstimate: number;
  proposedEstimate: number;
  savings: number;
  maxCutHit: boolean;
}

export interface RescueResult {
  needed: boolean;
  overrun: number;
  cuts: RescueCut[];
  totalSavings: number;
  remainingGap: number;
  contingencyWarning: boolean;
  contingencyRatio: number;
}

/**
 * Deterministic Budget Rescue: propose estimate reductions to resolve overrun.
 * Rules: reduce estimates not allocations, skip Contingency, skip locked,
 * max 30% cut per category, priority order from constants.
 */
export const computeRescue = (
  categories: CategoryAllocation[],
  summary: BudgetSummary,
): RescueResult => {
  const { budgetOverrun, totalBudget } = summary;
  
  if (budgetOverrun <= 0) {
    const contingency = categories.find(c => c.name === 'Contingency');
    const contingencyRatio = totalBudget > 0 ? (contingency?.allocated ?? 0) / totalBudget : 0;
    return {
      needed: false, overrun: 0, cuts: [], totalSavings: 0, remainingGap: 0,
      contingencyWarning: contingencyRatio < CONTINGENCY_WARN_RATIO,
      contingencyRatio,
    };
  }

  let remaining = budgetOverrun;
  const cuts: RescueCut[] = [];

  for (const catName of RESCUE_PRIORITY) {
    if (remaining <= 0) break;
    const cat = categories.find(c => c.name === catName);
    if (!cat || cat.locked || cat.name === 'Contingency') continue;

    const maxCut = Math.floor(cat.estimated * RESCUE_MAX_CUT_RATIO);
    const actualCut = Math.min(maxCut, remaining);
    if (actualCut <= 0) continue;

    cuts.push({
      category: catName,
      currentEstimate: cat.estimated,
      proposedEstimate: cat.estimated - actualCut,
      savings: actualCut,
      maxCutHit: actualCut === maxCut,
    });
    remaining -= actualCut;
  }

  const totalSavings = cuts.reduce((s, c) => s + c.savings, 0);
  const contingency = categories.find(c => c.name === 'Contingency');
  const contingencyRatio = totalBudget > 0 ? (contingency?.allocated ?? 0) / totalBudget : 0;

  return {
    needed: true,
    overrun: budgetOverrun,
    cuts,
    totalSavings,
    remainingGap: Math.max(0, budgetOverrun - totalSavings),
    contingencyWarning: contingencyRatio < CONTINGENCY_WARN_RATIO,
    contingencyRatio,
  };
};
