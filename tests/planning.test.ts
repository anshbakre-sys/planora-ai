import { describe, it, expect } from 'vitest';
import {
  computeAllocations,
  reallocate,
  computeBudgetSummary,
  isAllocationConflict,
} from '@/lib/planning/budget';
import { computeRescue } from '@/lib/planning/rescue';
import { simulateChange } from '@/lib/planning/what-if';
import { computeDueDates, isOverdue } from '@/lib/planning/timeline';
import { computeReadiness } from '@/lib/planning/readiness';
import { checkFeasibility } from '@/lib/planning/feasibility';
import {
  createEventSchema,
  createEventWithDateCheck,
  taskSchema,
  vendorSchema,
  expenseSchema,
} from '@/lib/schemas';
import { today, addDays } from '@/lib/date';

describe('1. Budget Allocation Totals and Rounding', () => {
  it('wedding budget allocations sum exactly to total budget for various amounts', () => {
    const budgets = [10_000, 250_000, 1_234_567, 10_000_000];
    for (const b of budgets) {
      const allocs = computeAllocations(b, 'WEDDING');
      const sum = allocs.reduce((acc, cat) => acc + cat.allocated, 0);
      expect(sum).toBe(b);
      // initially estimated == allocated
      for (const a of allocs) {
        expect(a.estimated).toBe(a.allocated);
        expect(a.locked).toBe(false);
      }
    }
  });

  it('birthday budget allocations sum exactly to total budget', () => {
    const allocs = computeAllocations(50_000, 'BIRTHDAY');
    const sum = allocs.reduce((acc, cat) => acc + cat.allocated, 0);
    expect(sum).toBe(50_000);
    // accommodation should have 0 weight
    expect(allocs.find((c) => c.name === 'Accommodation')).toBeUndefined();
  });

  it('community budget allocations sum exactly to total budget', () => {
    const allocs = computeAllocations(200_000, 'COMMUNITY');
    const sum = allocs.reduce((acc, cat) => acc + cat.allocated, 0);
    expect(sum).toBe(200_000);
  });
});

describe('2. Locked Allocation Conflicts', () => {
  it('returns conflict if locked categories exceed new budget', () => {
    const allocs = computeAllocations(100_000, 'WEDDING');
    // Lock venue at 50,000
    allocs[0].locked = true;
    allocs[0].allocated = 80_000;

    // Try to reallocate to 50,000 (which is less than locked 80,000)
    const result = reallocate(allocs, 50_000, 'WEDDING');
    expect(isAllocationConflict(result)).toBe(true);
    if (isAllocationConflict(result)) {
      expect(result.type).toBe('LOCKED_EXCEEDS_BUDGET');
      expect(result.lockedTotal).toBe(80_000);
      expect(result.totalBudget).toBe(50_000);
      expect(result.difference).toBe(30_000);
    }
  });

  it('returns conflict if all categories are locked and sum differs from budget', () => {
    const allocs = computeAllocations(100_000, 'WEDDING');
    allocs.forEach((c) => (c.locked = true));

    const result = reallocate(allocs, 120_000, 'WEDDING');
    expect(isAllocationConflict(result)).toBe(true);
    if (isAllocationConflict(result)) {
      expect(result.type).toBe('ALL_LOCKED_MISMATCH');
    }
  });

  it('preserves locked values during reallocation', () => {
    const allocs = computeAllocations(100_000, 'WEDDING');
    const venue = allocs.find((c) => c.name === 'Venue')!;
    venue.locked = true;
    venue.allocated = 30_000;

    const result = reallocate(allocs, 150_000, 'WEDDING');
    expect(isAllocationConflict(result)).toBe(false);
    if (!isAllocationConflict(result)) {
      const newVenue = result.find((c) => c.name === 'Venue')!;
      expect(newVenue.allocated).toBe(30_000);
      const total = result.reduce((s, c) => s + c.allocated, 0);
      expect(total).toBe(150_000);
    }
  });
});

describe('3. Budget Rescue Calculations', () => {
  it('returns needed=false when budget is on track', () => {
    const allocs = computeAllocations(100_000, 'WEDDING');
    const summary = computeBudgetSummary(100_000, allocs, 0);
    const rescue = computeRescue(allocs, summary);
    expect(rescue.needed).toBe(false);
    expect(rescue.overrun).toBe(0);
    expect(rescue.cuts.length).toBe(0);
  });

  it('reduces estimates strictly based on priority and caps at 30%', () => {
    const allocs = computeAllocations(100_000, 'WEDDING');
    // Artificially inflate decoration and entertainment estimates
    const decor = allocs.find((c) => c.name === 'Decoration')!;
    decor.estimated = 25_000; // was 12,000

    const summary = computeBudgetSummary(100_000, allocs, 0);
    expect(summary.budgetOverrun).toBe(13_000);

    const rescue = computeRescue(allocs, summary);
    expect(rescue.needed).toBe(true);
    expect(rescue.overrun).toBe(13_000);

    // Decoration is priority 1; max cut is 30% of 25,000 = 7,500
    const decorCut = rescue.cuts.find((c) => c.category === 'Decoration');
    expect(decorCut).toBeDefined();
    expect(decorCut?.savings).toBe(7500);

    // Remaining gap is covered by next eligible priority (Entertainment)
    const entCut = rescue.cuts.find((c) => c.category === 'Entertainment');
    expect(entCut).toBeDefined();
    expect(entCut?.savings).toBeLessThanOrEqual(Math.floor(allocs.find((c) => c.name === 'Entertainment')!.estimated * 0.3));

    // Never modifies contingency
    expect(rescue.cuts.some((c) => c.category === 'Contingency')).toBe(false);
  });

  it('never cuts locked categories in budget rescue', () => {
    const allocs = computeAllocations(100_000, 'WEDDING');
    const decor = allocs.find((c) => c.name === 'Decoration')!;
    decor.estimated = 30_000;
    decor.locked = true;

    const summary = computeBudgetSummary(100_000, allocs, 0);
    const rescue = computeRescue(allocs, summary);
    expect(rescue.cuts.some((c) => c.category === 'Decoration')).toBe(false);
  });
});

describe('4. What-If Scaling and Non-mutation', () => {
  it('scales guest-sensitive estimates without mutating original data', () => {
    const allocs = computeAllocations(100_000, 'WEDDING');
    const originalAllocsCopy = JSON.parse(JSON.stringify(allocs));

    const result = simulateChange(
      {
        currentBudget: 100_000,
        currentGuests: 100,
        currentDate: '2026-12-01',
        categories: allocs,
        eventType: 'WEDDING',
      },
      {
        newGuests: 200, // double guests
      }
    );

    // Original array must not have mutated
    expect(allocs).toEqual(originalAllocsCopy);

    // Catering estimate should have doubled
    const originalCatering = allocs.find((c) => c.name === 'Catering')!.estimated;
    const simulatedCatering = result.categories.find((c) => c.name === 'Catering')!.estimated;
    expect(simulatedCatering).toBe(originalCatering * 2);

    // Non guest-sensitive (e.g., Photography) remains unchanged
    const originalPhoto = allocs.find((c) => c.name === 'Photography')!.estimated;
    const simulatedPhoto = result.categories.find((c) => c.name === 'Photography')!.estimated;
    expect(simulatedPhoto).toBe(originalPhoto);
  });
});

describe('5. Timeline Calculations', () => {
  it('correctly calculates milestone due dates for regular timeline (>14 days)', () => {
    const eventDate = addDays(today(), 60);
    const tasks = [
      { id: '1', offsetDays: 30 },
      { id: '2', offsetDays: 7 },
      { id: '3', offsetDays: 0 },
    ];
    const dueDates = computeDueDates(tasks, eventDate);
    expect(dueDates.find((t) => t.taskId === '1')?.computedDueDate).toBe(addDays(eventDate, -30));
    expect(dueDates.find((t) => t.taskId === '2')?.computedDueDate).toBe(addDays(eventDate, -7));
    expect(dueDates.find((t) => t.taskId === '3')?.computedDueDate).toBe(eventDate);
    expect(dueDates.every((t) => !t.compressed && !t.infeasible)).toBe(true);
  });

  it('detects overdue status accurately', () => {
    const pastDate = addDays(today(), -5);
    const futureDate = addDays(today(), 5);
    expect(isOverdue('PENDING', pastDate)).toBe(true);
    expect(isOverdue('COMPLETED', pastDate)).toBe(false);
    expect(isOverdue('PENDING', futureDate)).toBe(false);
  });
});

describe('6. Same-Day and Short-Notice Events', () => {
  it('compresses tasks within available window for short-notice events (<= 14 days)', () => {
    const eventDate = addDays(today(), 10);
    const tasks = [
      { id: '1', offsetDays: 90 },
      { id: '2', offsetDays: 30 },
      { id: '3', offsetDays: 0 },
    ];
    const dueDates = computeDueDates(tasks, eventDate);
    expect(dueDates.every((t) => t.compressed || t.offsetDays === 0)).toBe(true);
    // Task 1 should be scheduled around today or within the 10 days
    const t1 = dueDates.find((t) => t.taskId === '1')!;
    expect(t1.computedDueDate >= today()).toBe(true);
    expect(t1.computedDueDate <= eventDate).toBe(true);
  });

  it('schedules actionable tasks for today and flags impossible prep for same-day events', () => {
    const eventDate = today();
    const tasks = [
      { id: '1', offsetDays: 60 },
      { id: '2', offsetDays: 0 },
    ];
    const dueDates = computeDueDates(tasks, eventDate);
    const t1 = dueDates.find((t) => t.taskId === '1')!;
    const t2 = dueDates.find((t) => t.taskId === '2')!;
    expect(t1.infeasible).toBe(true);
    expect(t2.infeasible).toBe(false);
    expect(t2.computedDueDate).toBe(eventDate);
  });
});

describe('7. Readiness Score', () => {
  it('computes 100 for a perfectly prepared event', () => {
    const readiness = computeReadiness(
      10, // completedTasks
      10, // totalTasks
      0,  // overdueTasks
      5,  // tasksDueByToday
      4,  // bookedEssentialCategories (Wedding requires 4)
      'WEDDING',
      0,  // budgetOverrun
      500_000 // totalBudget
    );
    expect(readiness.score).toBe(100);
    expect(readiness.taskCompletion).toBe(40);
    expect(readiness.deadlineHealth).toBe(20);
    expect(readiness.vendorReadiness).toBe(25);
    expect(readiness.budgetHealth).toBe(15);
  });

  it('clamps to range 0-100 and degrades smoothly with overruns and overdue tasks', () => {
    const readiness = computeReadiness(
      0,  // completedTasks
      10, // totalTasks
      5,  // overdueTasks
      5,  // tasksDueByToday (100% overdue)
      0,  // bookedEssentialCategories
      'WEDDING',
      200_000, // budgetOverrun (40% overrun)
      500_000  // totalBudget
    );
    expect(readiness.score).toBe(0);
    expect(readiness.taskCompletion).toBe(0);
    expect(readiness.deadlineHealth).toBe(0);
    expect(readiness.vendorReadiness).toBe(0);
    expect(readiness.budgetHealth).toBe(0);
  });
});

describe('8. Zod Validation & Feasibility Checks', () => {
  it('validates correct event input and rejects invalid budgets/dates', () => {
    const valid = {
      name: 'Priya & Rahul Wedding',
      type: 'WEDDING',
      date: addDays(today(), 60),
      city: 'Udaipur',
      guestCount: 200,
      totalBudget: 1_500_000,
    };
    expect(createEventSchema.safeParse(valid).success).toBe(true);
    expect(createEventWithDateCheck.safeParse(valid).success).toBe(true);

    // Below min budget
    expect(createEventSchema.safeParse({ ...valid, totalBudget: 500 }).success).toBe(false);

    // Past date on new event
    const past = { ...valid, date: addDays(today(), -10) };
    expect(createEventWithDateCheck.safeParse(past).success).toBe(false);
  });

  it('feasibility check warns below rough per-guest floors without rejecting', () => {
    const weddingFeasible = checkFeasibility(500_000, 200, 'WEDDING'); // 2500/guest >= 1500
    expect(weddingFeasible.feasible).toBe(true);

    const weddingTight = checkFeasibility(100_000, 200, 'WEDDING'); // 500/guest < 1500
    expect(weddingTight.feasible).toBe(false);
    expect(weddingTight.message).toContain('Tight budget');
  });
});

