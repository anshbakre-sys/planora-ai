'use client';

import { useState, useEffect } from 'react';
import { formatINR, daysBetween, today } from '@/lib/date';
import { EVENT_TYPE_LABELS, type EventType } from '@/lib/constants';
import { computeReadiness } from '@/lib/planning/readiness';
import { isOverdue } from '@/lib/planning/timeline';
import {
  CalendarHeart,
  Users,
  IndianRupee,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  ShieldAlert,
  CalendarCheck,
  Briefcase
} from 'lucide-react';

interface OverviewTabProps {
  event: {
    id: string;
    name: string;
    type: EventType;
    date: string;
    city: string;
    guestCount: number;
    totalBudget: number;
    theme: string;
    colors: string;
    foodPreferences: string;
    venuePreferences: string;
    culturalPreferences: string;
    specialRequirements: string;
  };
  budgetCategories: {
    id: string;
    name: string;
    allocated: number;
    estimated: number;
    locked: boolean;
    expenses: { id: string; amount: number }[];
  }[];
  tasks: {
    id: string;
    title: string;
    dueDate: string;
    priority: string;
    status: string;
    category: string;
  }[];
  vendors: {
    id: string;
    category: string;
    name: string;
    status: string;
    quote?: number | null;
  }[];
  aiPlan?: {
    provider: string;
    model: string;
    content: string;
  } | null;
  onOpenWhatIf: () => void;
  onOpenRegenerate: () => void;
  onSwitchTab: (tab: string) => void;
}

export function OverviewTab({
  event,
  budgetCategories,
  tasks,
  vendors,
  aiPlan,
  onOpenWhatIf,
  onOpenRegenerate,
  onSwitchTab,
}: OverviewTabProps) {
  const daysLeft = daysBetween(event.date, today());
  const isPast = daysLeft < 0;

  // Task metrics
  const completedTasks = tasks.filter((t) => t.status === 'COMPLETED').length;
  const tasksDueByToday = tasks.filter((t) => daysBetween(today(), t.dueDate) >= 0).length;
  const overdueTasks = tasks.filter((t) => isOverdue(t.status, t.dueDate)).length;

  // Vendor metrics (distinct essential categories with BOOKED status)
  const bookedCategories = new Set(
    vendors.filter((v) => v.status === 'BOOKED').map((v) => v.category)
  );

  // Financial metrics
  const totalAllocated = budgetCategories.reduce((s, c) => s + c.allocated, 0);
  const contingency = budgetCategories.find((c) => c.name === 'Contingency')?.allocated ?? 0;
  const estimatedExpenses = budgetCategories
    .filter((c) => c.name !== 'Contingency')
    .reduce((s, c) => s + c.estimated, 0);
  const totalPlannedCommitment = estimatedExpenses + contingency;
  const budgetOverrun = Math.max(0, totalPlannedCommitment - event.totalBudget);

  const allExpenses = budgetCategories.flatMap((c) => c.expenses || []);
  const actualSpending = allExpenses.reduce((s, e) => s + e.amount, 0);
  const remainingBudget = event.totalBudget - actualSpending;

  // Readiness Score
  const readiness = computeReadiness(
    completedTasks,
    tasks.length,
    overdueTasks,
    tasksDueByToday,
    bookedCategories.size,
    event.type,
    budgetOverrun,
    event.totalBudget
  );

  const [displayedScore, setDisplayedScore] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const mountId = window.requestAnimationFrame(() => setMounted(true));
    let startTimestamp: number | null = null;
    const duration = 500;
    const startValue = 0;
    const endValue = readiness.score;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      setDisplayedScore(Math.round(startValue + (endValue - startValue) * easeProgress));
      if (progress < 1) {
        window.requestAnimationFrame(step);
      }
    };

    const animId = window.requestAnimationFrame(step);
    return () => { window.cancelAnimationFrame(mountId); window.cancelAnimationFrame(animId); };
  }, [readiness.score]);

  // Next 5 upcoming deadlines
  const upcomingDeadlines = [...tasks]
    .filter((t) => t.status !== 'COMPLETED')
    .sort((a, b) => a.dueDate.localeCompare(b.dueDate))
    .slice(0, 5);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Top Banner: Identity, Countdown, AI Source */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5DBCB] shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6 card-interactive animate-slide-up">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-md bg-[#F3ECE0] text-[#8B7BB8]">
              {EVENT_TYPE_LABELS[event.type]}
            </span>
            <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-[#F5F2F9] text-[#26232B] border border-[#8B7BB8]/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#C9A96A]" />
              <span>
                {aiPlan?.provider === 'gemini'
                  ? `Gemini ${aiPlan.model}`
                  : 'Demo Planning â€” no AI key'}
              </span>
            </span>
          </div>

          <h1 className="font-serif text-2xl sm:text-3xl font-bold text-[#26232B]">
            {event.name}
          </h1>

          <p className="text-xs text-[#665F6B] flex items-center gap-3">
            <span>{event.city}</span>
            <span>â€¢</span>
            <span>{event.guestCount} Guests</span>
            <span>â€¢</span>
            <span className="font-semibold text-[#26232B]">{formatINR(event.totalBudget)} Budget</span>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="text-left sm:text-right">
            <span className="text-xs text-[#665F6B] block">Event Date</span>
            <span className="text-sm font-bold text-[#26232B] block">{event.date}</span>
            <span className="text-xs font-semibold text-[#8B7BB8] mt-0.5 block">
              {isPast ? 'Completed Event' : daysLeft === 0 ? 'Today!' : `${daysLeft} days to go`}
            </span>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onOpenWhatIf}
              className="px-4 py-2.5 rounded-xl border border-[#E5DBCB] text-xs font-bold text-[#26232B] hover:bg-[#FAF6EF] transition-colors flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5 text-[#8B7BB8]" />
              <span>What-If Simulator</span>
            </button>
            <button
              onClick={onOpenRegenerate}
              className="px-4 py-2.5 rounded-xl bg-[#26232B] text-[#FAF6EF] text-xs font-bold hover:bg-[#3D3845] transition-colors flex items-center gap-1.5"
            >
              <span>Regenerate Plan</span>
            </button>
          </div>
        </div>
      </div>

      {/* Readiness Score & Breakdown */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-[#E5DBCB] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#8B7BB8]" />
              <h2 className="font-serif text-xl font-bold text-[#26232B]">Readiness Score</h2>
            </div>
            <p className="text-xs text-[#665F6B] mt-0.5">
              Deterministic 0â€“100 execution metric weighted by tasks, deadlines, vendors, and budget.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-3xl font-extrabold text-[#26232B] transition-all duration-300">
                {displayedScore}
              </span>
              <span className="text-xs text-[#665F6B] font-medium block">/ 100 points</span>
            </div>
          </div>
        </div>

        {/* Breakdown Progress Bars */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-2xl bg-[#FAF6EF] border border-[#E5DBCB] space-y-2 card-interactive">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-[#26232B]">Task Completion</span>
              <span className="font-semibold text-[#8B7BB8]">{readiness.taskCompletion} / 40</span>
            </div>
            <div className="w-full bg-[#E5DBCB] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#8B7BB8] h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: mounted ? `${(readiness.taskCompletion / 40) * 100}%` : '0%' }}
              />
            </div>
            <span className="text-[11px] text-[#665F6B] block">
              {completedTasks} of {tasks.length} tasks completed
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF6EF] border border-[#E5DBCB] space-y-2 card-interactive">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-[#26232B]">Deadline Health</span>
              <span className="font-semibold text-[#C9A96A]">{readiness.deadlineHealth} / 20</span>
            </div>
            <div className="w-full bg-[#E5DBCB] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#C9A96A] h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: mounted ? `${(readiness.deadlineHealth / 20) * 100}%` : '0%' }}
              />
            </div>
            <span className="text-[11px] text-[#665F6B] block">
              {overdueTasks > 0 ? (
                <span className="text-[#E8735A] font-bold">{overdueTasks} overdue tasks</span>
              ) : (
                'No overdue tasks'
              )}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF6EF] border border-[#E5DBCB] space-y-2 card-interactive">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-[#26232B]">Vendor Readiness</span>
              <span className="font-semibold text-[#26232B]">{readiness.vendorReadiness} / 25</span>
            </div>
            <div className="w-full bg-[#E5DBCB] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#26232B] h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: mounted ? `${(readiness.vendorReadiness / 25) * 100}%` : '0%' }}
              />
            </div>
            <span className="text-[11px] text-[#665F6B] block">
              {bookedCategories.size} of {readiness.details.totalEssential} essential categories booked
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-[#FAF6EF] border border-[#E5DBCB] space-y-2 card-interactive">
            <div className="flex justify-between text-xs">
              <span className="font-bold text-[#26232B]">Budget Health</span>
              <span className="font-semibold text-[#3C8C30]">{readiness.budgetHealth} / 15</span>
            </div>
            <div className="w-full bg-[#E5DBCB] h-2 rounded-full overflow-hidden">
              <div
                className="bg-[#3C8C30] h-full rounded-full transition-all duration-700 ease-out"
                style={{ width: mounted ? `${(readiness.budgetHealth / 15) * 100}%` : '0%' }}
              />
            </div>
            <span className="text-[11px] text-[#665F6B] block">
              {budgetOverrun > 0 ? (
                <span className="text-[#E8735A] font-bold">{formatINR(budgetOverrun)} overrun</span>
              ) : (
                'Commitment on budget'
              )}
            </span>
          </div>
        </div>
      </div>

      {/* 2-Column Section: Deadlines & Quick Financial Snapshot */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Next 5 Deadlines */}
        <div className="bg-white rounded-3xl p-6 border border-[#E5DBCB] shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#E5DBCB] pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#8B7BB8]" />
              <h3 className="font-serif text-lg font-bold text-[#26232B]">Upcoming Deadlines</h3>
            </div>
            <button
              onClick={() => onSwitchTab('timeline')}
              className="text-xs font-semibold text-[#8B7BB8] hover:underline"
            >
              View All Tasks â†’
            </button>
          </div>

          {upcomingDeadlines.length === 0 ? (
            <p className="text-xs text-[#665F6B] py-6 text-center">All tasks completed or none scheduled.</p>
          ) : (
            <div className="divide-y divide-[#F3ECE0]">
              {upcomingDeadlines.map((t) => {
                const overdue = isOverdue(t.status, t.dueDate);
                return (
                  <div key={t.id} className="py-3 flex items-center justify-between gap-3 text-xs">
                    <div className="space-y-0.5">
                      <span className="font-bold text-[#26232B] block">{t.title}</span>
                      <span className="text-[11px] text-[#665F6B] block">{t.category || 'General'}</span>
                    </div>
                    <div className="text-right shrink-0">
                      <span className={`font-semibold block ${overdue ? 'text-[#E8735A]' : 'text-[#665F6B]'}`}>
                        {t.dueDate}
                      </span>
                      {overdue && (
                        <span className="text-[10px] font-bold text-[#E8735A] block uppercase">Overdue</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Financial & Vendor Highlights */}
        <div className="bg-white rounded-3xl p-6 border border-[#E5DBCB] shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5DBCB] pb-3">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#C9A96A]" />
                <h3 className="font-serif text-lg font-bold text-[#26232B]">Budget & Vendors Overview</h3>
              </div>
              <button
                onClick={() => onSwitchTab('budget')}
                className="text-xs font-semibold text-[#8B7BB8] hover:underline"
              >
                Open Budget â†’
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#FAF6EF]">
                <span className="text-[#665F6B] block">Total Budget</span>
                <span className="font-bold text-[#26232B] text-base">{formatINR(event.totalBudget)}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF6EF]">
                <span className="text-[#665F6B] block">Actual Spending</span>
                <span className="font-bold text-[#26232B] text-base">{formatINR(actualSpending)}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF6EF]">
                <span className="text-[#665F6B] block">Reserved Contingency</span>
                <span className="font-bold text-[#8B7BB8] text-base">{formatINR(contingency)}</span>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF6EF]">
                <span className="text-[#665F6B] block">Remaining Balance</span>
                <span className="font-bold text-[#3C8C30] text-base">{formatINR(remainingBudget)}</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#E5DBCB] flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-[#3C8C30]" />
              <span className="font-medium text-[#26232B]">
                {vendors.filter((v) => v.status === 'BOOKED').length} booked vendors
              </span>
            </div>
            <button
              onClick={() => onSwitchTab('vendors')}
              className="font-semibold text-[#8B7BB8] hover:underline"
            >
              Manage Vendors â†’
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

