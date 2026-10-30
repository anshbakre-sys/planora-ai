import { FEASIBILITY_FLOORS, type EventType } from '@/lib/constants';

export interface FeasibilityResult {
  feasible: boolean;
  budgetPerGuest: number;
  floor: number;
  message: string;
}

/**
 * Check budget feasibility against rough per-guest floors.
 * These are planning heuristics, not verified vendor quotations.
 * @param totalBudget - INR integer
 * @param guestCount - positive integer
 * @param eventType - event type
 */
export const checkFeasibility = (
  totalBudget: number,
  guestCount: number,
  eventType: EventType,
): FeasibilityResult => {
  const floor = FEASIBILITY_FLOORS[eventType];
  const budgetPerGuest = guestCount > 0 ? Math.floor(totalBudget / guestCount) : totalBudget;
  const feasible = budgetPerGuest >= floor;
  
  return {
    feasible,
    budgetPerGuest,
    floor,
    message: feasible
      ? `Budget of ₹${budgetPerGuest}/guest is above the ₹${floor} planning threshold.`
      : `Tight budget: ₹${budgetPerGuest}/guest is below the ₹${floor} planning threshold. Prioritize essentials and consider cost-saving alternatives.`,
  };
};
