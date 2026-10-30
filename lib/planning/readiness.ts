import type { EventType } from '@/lib/constants';
import { ESSENTIAL_VENDORS } from '@/lib/constants';

export interface ReadinessBreakdown {
  score: number;
  taskCompletion: number;
  deadlineHealth: number;
  vendorReadiness: number;
  budgetHealth: number;
  details: {
    completedTasks: number;
    totalTasks: number;
    overdueTasks: number;
    tasksDueByToday: number;
    bookedEssential: number;
    totalEssential: number;
    overrunPercentage: number;
  };
}

/**
 * Compute deterministic readiness score (0–100).
 * Weights: Tasks 40, Deadlines 20, Vendors 25, Budget 15.
 * @param completedTasks - count of COMPLETED tasks
 * @param totalTasks - total task count
 * @param overdueTasks - tasks not COMPLETED with dueDate before today
 * @param tasksDueByToday - tasks whose dueDate <= today
 * @param bookedEssentialCategories - count of essential vendor categories with BOOKED vendors
 * @param eventType - for essential vendor lookup
 * @param budgetOverrun - from BudgetSummary
 * @param totalBudget - total budget in INR
 */
export const computeReadiness = (
  completedTasks: number,
  totalTasks: number,
  overdueTasks: number,
  tasksDueByToday: number,
  bookedEssentialCategories: number,
  eventType: EventType,
  budgetOverrun: number,
  totalBudget: number,
): ReadinessBreakdown => {
  const essentialCount = ESSENTIAL_VENDORS[eventType].length;

  const taskCompletion = totalTasks > 0 ? 40 * (completedTasks / totalTasks) : 0;
  const deadlineHealth = tasksDueByToday > 0 ? 20 * (1 - overdueTasks / tasksDueByToday) : 20;
  const vendorReadiness = essentialCount > 0 ? 25 * (bookedEssentialCategories / essentialCount) : 25;
  const overrunPct = totalBudget > 0 ? budgetOverrun / totalBudget : 0;
  const budgetHealth = 15 * (1 - Math.min(1, overrunPct / 0.25));

  const raw = taskCompletion + deadlineHealth + vendorReadiness + budgetHealth;
  const score = Math.round(Math.max(0, Math.min(100, raw)));

  return {
    score,
    taskCompletion: Math.round(taskCompletion * 10) / 10,
    deadlineHealth: Math.round(deadlineHealth * 10) / 10,
    vendorReadiness: Math.round(vendorReadiness * 10) / 10,
    budgetHealth: Math.round(budgetHealth * 10) / 10,
    details: {
      completedTasks, totalTasks, overdueTasks, tasksDueByToday,
      bookedEssential: bookedEssentialCategories, totalEssential: essentialCount,
      overrunPercentage: Math.round(overrunPct * 1000) / 10,
    },
  };
};
