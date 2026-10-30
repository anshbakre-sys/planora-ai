import type { CategoryAllocation, AllocationConflict } from './budget';
import { reallocate, isAllocationConflict } from './budget';
import type { EventType } from '@/lib/constants';

/** Guest-count-sensitive categories for scaling */
const GUEST_SENSITIVE = ['Catering', 'Transportation', 'Accommodation'];

export interface WhatIfInput {
  currentBudget: number;
  currentGuests: number;
  currentDate: string;
  categories: CategoryAllocation[];
  eventType: EventType;
}

export interface WhatIfChange {
  newBudget?: number;
  newGuests?: number;
  newDate?: string;
  newTheme?: string;
}

export interface WhatIfResult {
  categories: CategoryAllocation[];
  conflict?: AllocationConflict;
  costPerGuest: number;
  estimatedTotal: number;
  warnings: string[];
}

/**
 * Pure what-if simulation: does NOT mutate input data.
 * - Guest change: scales estimates for guest-sensitive categories.
 * - Budget change: reallocates unlocked categories.
 * - Date change: returns warnings (actual task recomputation in caller).
 * - Theme change: narrative only, no financial effect.
 */
export const simulateChange = (
  input: WhatIfInput,
  change: WhatIfChange,
): WhatIfResult => {
  let cats = input.categories.map(c => ({ ...c }));
  const warnings: string[] = [];
  const newGuests = change.newGuests ?? input.currentGuests;
  const newBudget = change.newBudget ?? input.currentBudget;

  // Guest scaling: adjust estimates for guest-sensitive categories
  if (change.newGuests && change.newGuests !== input.currentGuests && input.currentGuests > 0) {
    const ratio = change.newGuests / input.currentGuests;
    cats = cats.map(c => {
      if (GUEST_SENSITIVE.includes(c.name) && !c.locked) {
        return { ...c, estimated: Math.round(c.estimated * ratio) };
      }
      return c;
    });
  }

  // Budget change: reallocate
  if (change.newBudget && change.newBudget !== input.currentBudget) {
    const result = reallocate(cats, change.newBudget, input.eventType);
    if (isAllocationConflict(result)) {
      return {
        categories: cats,
        conflict: result,
        costPerGuest: newGuests > 0 ? Math.floor(newBudget / newGuests) : 0,
        estimatedTotal: cats.reduce((s, c) => s + c.estimated, 0),
        warnings: [`Conflict: ${result.type}`],
      };
    }
    cats = result;
  }

  // Date change warnings
  if (change.newDate && change.newDate !== input.currentDate) {
    warnings.push('Task due dates will be recalculated based on the new event date.');
  }

  // Theme change: narrative only
  if (change.newTheme) {
    warnings.push('Theme change will update ideas and narrative. No financial impact.');
  }

  const estimatedTotal = cats.reduce((s, c) => s + c.estimated, 0);
  const costPerGuest = newGuests > 0 ? Math.floor(newBudget / newGuests) : 0;

  return { categories: cats, costPerGuest, estimatedTotal, warnings };
};
