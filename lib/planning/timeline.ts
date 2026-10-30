import { daysBetween, addDays, today as getToday } from '@/lib/date';

export interface TaskDueDate {
  taskId: string;
  offsetDays: number;
  computedDueDate: string;
  compressed: boolean;
  infeasible: boolean;
}

/**
 * Compute due dates for AI-generated tasks from their offsets.
 * Offsets are days-before-event (0 = event day, 540 = max advance).
 * Short-notice: compress into available window preserving order.
 * Same-day: tasks with offset > 0 are flagged infeasible.
 *
 * @param tasks - array of { id, offsetDays }
 * @param eventDate - YYYY-MM-DD
 * @returns computed due dates
 */
export const computeDueDates = (
  tasks: { id: string; offsetDays: number }[],
  eventDate: string,
): TaskDueDate[] => {
  const todayStr = getToday();
  const daysUntilEvent = daysBetween(eventDate, todayStr);
  
  // Sort by offset descending (earliest prep first)
  const sorted = [...tasks].sort((a, b) => b.offsetDays - a.offsetDays);
  
  if (daysUntilEvent <= 0) {
    // Same-day or past event: actionable tasks today, flag advance prep infeasible
    return sorted.map(t => ({
      taskId: t.id,
      offsetDays: t.offsetDays,
      computedDueDate: t.offsetDays === 0 ? eventDate : todayStr,
      compressed: false,
      infeasible: t.offsetDays > 0,
    }));
  }
  
  if (daysUntilEvent <= 14 || sorted.some(t => t.offsetDays > daysUntilEvent)) {
    // Short notice: compress tasks proportionally into available window
    const maxOffset = Math.max(...sorted.map(t => t.offsetDays), 1);
    return sorted.map(t => {
      const ratio = t.offsetDays / maxOffset;
      const compressedOffset = Math.round(ratio * daysUntilEvent);
      return {
        taskId: t.id,
        offsetDays: t.offsetDays,
        computedDueDate: addDays(eventDate, -compressedOffset),
        compressed: true,
        infeasible: false,
      };
    });
  }
  
  // Normal: subtract offset from event date
  return sorted.map(t => ({
    taskId: t.id,
    offsetDays: t.offsetDays,
    computedDueDate: addDays(eventDate, -t.offsetDays),
    compressed: false,
    infeasible: false,
  }));
};

/** Check if a task is overdue */
export const isOverdue = (status: string, dueDate: string): boolean => {
  if (status === 'COMPLETED') return false;
  return daysBetween(getToday(), dueDate) > 0;
};
