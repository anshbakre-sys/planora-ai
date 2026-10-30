import { BUDGET_WEIGHTS, type EventType, type BudgetCategoryName, BUDGET_CATEGORIES } from '@/lib/constants';

export interface CategoryAllocation {
  name: BudgetCategoryName;
  allocated: number;
  estimated: number;
  locked: boolean;
}

export interface AllocationConflict {
  type: 'LOCKED_EXCEEDS_BUDGET' | 'ALL_LOCKED_MISMATCH';
  lockedTotal: number;
  totalBudget: number;
  difference: number;
}

/**
 * Compute initial budget allocations from total budget and event type.
 * Uses integer rupees. Rounding remainder goes to the largest unlocked category.
 * @param totalBudget - Total event budget in INR (integer)
 * @param eventType - One of WEDDING, BIRTHDAY, COMMUNITY
 * @returns Array of CategoryAllocation with allocated = estimated, locked = false
 */
export const computeAllocations = (
  totalBudget: number,
  eventType: EventType,
): CategoryAllocation[] => {
  const weights = BUDGET_WEIGHTS[eventType];
  const categories = BUDGET_CATEGORIES.filter(c => weights[c] > 0);
  
  const raw = categories.map(name => ({
    name,
    raw: (totalBudget * weights[name]) / 100,
  }));
  
  const floored = raw.map(r => ({ name: r.name, value: Math.floor(r.raw) }));
  const remainder = totalBudget - floored.reduce((s, f) => s + f.value, 0);
  
  // Assign remainder to the largest category
  const largestIdx = floored.reduce((best, cur, i) =>
    cur.value > floored[best].value ? i : best, 0);
  floored[largestIdx].value += remainder;
  
  return floored.map(f => ({
    name: f.name,
    allocated: f.value,
    estimated: f.value,
    locked: false,
  }));
};

/**
 * Reallocate unlocked categories when total budget changes.
 * Locked categories keep their allocated value.
 * Returns AllocationConflict if locked total exceeds budget.
 */
export const reallocate = (
  categories: CategoryAllocation[],
  newBudget: number,
  eventType: EventType,
): CategoryAllocation[] | AllocationConflict => {
  const lockedTotal = categories.filter(c => c.locked).reduce((s, c) => s + c.allocated, 0);
  const allLocked = categories.every(c => c.locked);
  
  if (allLocked && lockedTotal !== newBudget) {
    return { type: 'ALL_LOCKED_MISMATCH', lockedTotal, totalBudget: newBudget, difference: lockedTotal - newBudget };
  }
  if (lockedTotal > newBudget) {
    return { type: 'LOCKED_EXCEEDS_BUDGET', lockedTotal, totalBudget: newBudget, difference: lockedTotal - newBudget };
  }
  
  const remaining = newBudget - lockedTotal;
  const weights = BUDGET_WEIGHTS[eventType];
  const unlocked = categories.filter(c => !c.locked);
  const unlockedWeightSum = unlocked.reduce((s, c) => s + weights[c.name], 0);
  
  if (unlockedWeightSum === 0 && unlocked.length > 0) {
    // All unlocked categories have 0 weight — split evenly
    const each = Math.floor(remaining / unlocked.length);
    const leftover = remaining - each * unlocked.length;
    return categories.map(c => {
      if (c.locked) return c;
      const idx = unlocked.indexOf(c);
      return { ...c, allocated: each + (idx === 0 ? leftover : 0) };
    });
  }
  
  const rawAllocations = unlocked.map(c => ({
    name: c.name,
    raw: unlockedWeightSum > 0 ? (remaining * weights[c.name]) / unlockedWeightSum : 0,
  }));
  
  const floored = rawAllocations.map(r => ({ name: r.name, value: Math.floor(r.raw) }));
  const rRemainder = remaining - floored.reduce((s, f) => s + f.value, 0);
  
  if (floored.length > 0) {
    const largestIdx = floored.reduce((best, cur, i) =>
      cur.value > floored[best].value ? i : best, 0);
    floored[largestIdx].value += rRemainder;
  }
  
  const allocationMap = new Map(floored.map(f => [f.name, f.value]));
  
  return categories.map(c => {
    if (c.locked) return c;
    return { ...c, allocated: allocationMap.get(c.name) ?? c.allocated };
  });
};

/** Financial summary computations */
export interface BudgetSummary {
  totalBudget: number;
  estimatedEventExpenses: number;
  reservedContingency: number;
  totalPlannedCommitment: number;
  budgetOverrun: number;
  actualSpending: number;
  remainingBudget: number;
  unallocatedBudget: number;
}

export const computeBudgetSummary = (
  totalBudget: number,
  categories: CategoryAllocation[],
  actualSpending: number,
): BudgetSummary => {
  const contingency = categories.find(c => c.name === 'Contingency');
  const reservedContingency = contingency?.allocated ?? 0;
  const estimatedEventExpenses = categories
    .filter(c => c.name !== 'Contingency')
    .reduce((s, c) => s + c.estimated, 0);
  const totalPlannedCommitment = estimatedEventExpenses + reservedContingency;
  const budgetOverrun = Math.max(0, totalPlannedCommitment - totalBudget);
  const remainingBudget = totalBudget - actualSpending;
  const unallocatedBudget = totalBudget - categories.reduce((s, c) => s + c.allocated, 0);

  return {
    totalBudget,
    estimatedEventExpenses,
    reservedContingency,
    totalPlannedCommitment,
    budgetOverrun,
    actualSpending,
    remainingBudget,
    unallocatedBudget,
  };
};

export const isAllocationConflict = (result: CategoryAllocation[] | AllocationConflict): result is AllocationConflict =>
  'type' in result && ('LOCKED_EXCEEDS_BUDGET' === result.type || 'ALL_LOCKED_MISMATCH' === result.type);
