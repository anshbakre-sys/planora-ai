'use client';

import { useState } from 'react';
import { formatINR } from '@/lib/date';
import { computeBudgetSummary, type CategoryAllocation } from '@/lib/planning/budget';
import { computeRescue, type RescueResult } from '@/lib/planning/rescue';
import {
  IndianRupee,
  Lock,
  Unlock,
  AlertTriangle,
  Plus,
  Trash2,
  LifeBuoy,
  CheckCircle2,
  TrendingDown,
  X,
  Loader2
} from 'lucide-react';

interface ExpenseItem {
  id: string;
  categoryId: string;
  description: string;
  amount: number;
  paidOn: string;
}

interface BudgetTabProps {
  eventId: string;
  totalBudget: number;
  categories: (CategoryAllocation & { id: string; expenses: ExpenseItem[] })[];
  onRefresh: () => void;
}

export function BudgetTab({ eventId, totalBudget, categories, onRefresh }: BudgetTabProps) {
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showRescueModal, setShowRescueModal] = useState(false);

  // Expense form
  const [expCatId, setExpCatId] = useState(categories[0]?.id || '');
  const [expDesc, setExpDesc] = useState('');
  const [expAmount, setExpAmount] = useState<number>(0);
  const [expDate, setExpDate] = useState(new Date().toISOString().slice(0, 10));
  const [savingExpense, setSavingExpense] = useState(false);
  const [applyingRescue, setApplyingRescue] = useState(false);

  // Calculate actual total spending
  const allExpenses = categories.flatMap((c) => c.expenses || []);
  const actualSpending = allExpenses.reduce((s, e) => s + e.amount, 0);

  // Compute deterministic summary
  const summary = computeBudgetSummary(totalBudget, categories, actualSpending);

  // Compute deterministic rescue proposal
  const rescue: RescueResult = computeRescue(categories, summary);

  const handleToggleLock = async (category: typeof categories[0]) => {
    try {
      await fetch(`/api/events/${eventId}/categories`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: category.id,
          locked: !category.locked,
        }),
      });
      onRefresh();
    } catch (err) {
      alert('Failed to update category lock status');
    }
  };

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!expDesc.trim() || expAmount <= 0) return;

    try {
      setSavingExpense(true);
      const res = await fetch(`/api/events/${eventId}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryId: expCatId,
          description: expDesc.trim(),
          amount: Number(expAmount),
          paidOn: expDate,
        }),
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message || 'Failed to add expense');
      }
      setExpDesc('');
      setExpAmount(0);
      setShowAddExpense(false);
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error adding expense');
    } finally {
      setSavingExpense(false);
    }
  };

  const handleDeleteExpense = async (expenseId: string) => {
    if (!confirm('Delete this expense record?')) return;
    try {
      await fetch(`/api/events/${eventId}/expenses?expenseId=${expenseId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      onRefresh();
    } catch (err) {
      alert('Failed to delete expense');
    }
  };

  const handleApplyRescue = async () => {
    if (!rescue.needed || rescue.cuts.length === 0) return;
    try {
      setApplyingRescue(true);
      const batchUpdates = rescue.cuts.map((cut) => {
        const cat = categories.find((c) => c.name === cut.category);
        return {
          categoryId: cat!.id,
          estimated: cut.proposedEstimate,
        };
      });

      const res = await fetch(`/api/events/${eventId}/categories`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchUpdates }),
      });
      if (!res.ok) throw new Error('Failed to apply rescue cuts');
      setShowRescueModal(false);
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Rescue application failed');
    } finally {
      setApplyingRescue(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Financial Health Banner */}
      {summary.budgetOverrun > 0 ? (
        <div className="p-4 rounded-2xl bg-[#FDEAE6] border border-[#F6C5BC] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#E8735A] text-white flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-[#E8735A] text-sm sm:text-base">
                Budget Overrun Detected: {formatINR(summary.budgetOverrun)}
              </h3>
              <p className="text-xs text-[#665F6B]">
                Total planned commitment exceeds your event budget. Use Budget Rescue to resolve it deterministically.
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowRescueModal(true)}
            className="px-4 py-2 rounded-xl bg-[#E8735A] text-white font-bold text-xs hover:bg-[#D45E45] transition-colors flex items-center gap-1.5 shrink-0 shadow-sm"
          >
            <LifeBuoy className="w-4 h-4" />
            <span>Launch Budget Rescue</span>
          </button>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-[#F2F7F2] border border-[#CDE3CD] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#3C8C30]" />
            <span className="text-xs sm:text-sm font-semibold text-[#2D5A27]">
              Budget On Track: Planned commitment is fully covered by your total budget.
            </span>
          </div>
          <button
            onClick={() => setShowRescueModal(true)}
            className="text-xs font-semibold text-[#665F6B] hover:text-[#26232B] underline"
          >
            Review Rescue Rules
          </button>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#E5DBCB] space-y-1">
          <span className="text-[11px] font-bold text-[#665F6B] uppercase tracking-wider block">Total Budget</span>
          <span className="text-lg sm:text-xl font-bold text-[#26232B]">{formatINR(summary.totalBudget)}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E5DBCB] space-y-1">
          <span className="text-[11px] font-bold text-[#665F6B] uppercase tracking-wider block">Estimated Expenses</span>
          <span className="text-lg sm:text-xl font-bold text-[#26232B]">{formatINR(summary.estimatedEventExpenses)}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E5DBCB] space-y-1">
          <span className="text-[11px] font-bold text-[#665F6B] uppercase tracking-wider block">Contingency Reserve</span>
          <span className="text-lg sm:text-xl font-bold text-[#8B7BB8]">{formatINR(summary.reservedContingency)}</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E5DBCB] space-y-1">
          <span className="text-[11px] font-bold text-[#665F6B] uppercase tracking-wider block">Actual Spending</span>
          <span className="text-lg sm:text-xl font-bold text-[#26232B]">{formatINR(summary.actualSpending)}</span>
          <span className="text-[10px] text-[#665F6B] block">Remaining: {formatINR(summary.remainingBudget)}</span>
        </div>
      </div>

      {/* Categories Allocations Table */}
      <div className="bg-white rounded-2xl border border-[#E5DBCB] overflow-hidden shadow-xs space-y-4 p-6">
        <div className="flex items-center justify-between border-b border-[#E5DBCB] pb-4">
          <div>
            <h3 className="font-serif text-lg font-bold text-[#26232B]">Category Allocations & Locks</h3>
            <p className="text-xs text-[#665F6B]">
              Lock categories to freeze them during What-If simulations or budget recalculations.
            </p>
          </div>
          <button
            onClick={() => setShowAddExpense(true)}
            className="px-4 py-2 rounded-xl bg-[#26232B] text-[#FAF6EF] text-xs font-bold hover:bg-[#3D3845] transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-[#C9A96A]" />
            <span>Add Expense</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-[#E5DBCB] text-[#665F6B] font-bold uppercase tracking-wider">
                <th className="py-3 px-3">Category</th>
                <th className="py-3 px-3 text-right">Allocated</th>
                <th className="py-3 px-3 text-right">Estimated</th>
                <th className="py-3 px-3 text-right">Actual Spent</th>
                <th className="py-3 px-3 text-center">Lock Status</th>
                <th className="py-3 px-3 text-right">Variance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F3ECE0]">
              {categories.map((cat) => {
                const spent = (cat.expenses || []).reduce((s, e) => s + e.amount, 0);
                const variance = cat.estimated - cat.allocated;
                const isOver = variance > 0;

                return (
                  <tr key={cat.id} className="hover:bg-[#FAF6EF]/50 transition-colors">
                    <td className="py-3.5 px-3 font-semibold text-[#26232B] flex items-center gap-2">
                      <span>{cat.name}</span>
                      {cat.name === 'Contingency' && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-[#F3ECE0] text-[#8B7BB8]">
                          Reserve
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-right font-medium text-[#26232B]">{formatINR(cat.allocated)}</td>
                    <td className="py-3.5 px-3 text-right font-medium text-[#26232B]">{formatINR(cat.estimated)}</td>
                    <td className="py-3.5 px-3 text-right font-semibold text-[#26232B]">{formatINR(spent)}</td>
                    <td className="py-3.5 px-3 text-center">
                      <button
                        onClick={() => handleToggleLock(cat)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold transition-colors ${
                          cat.locked
                            ? 'bg-[#26232B] text-[#FAF6EF]'
                            : 'bg-[#F3ECE0] text-[#665F6B] hover:bg-[#EAE1D1]'
                        }`}
                      >
                        {cat.locked ? <Lock className="w-3 h-3 text-[#C9A96A]" /> : <Unlock className="w-3 h-3" />}
                        <span>{cat.locked ? 'Locked' : 'Unlocked'}</span>
                      </button>
                    </td>
                    <td className="py-3.5 px-3 text-right font-medium">
                      {variance === 0 ? (
                        <span className="text-[#665F6B]">—</span>
                      ) : isOver ? (
                        <span className="text-[#E8735A] font-bold">+{formatINR(variance)}</span>
                      ) : (
                        <span className="text-[#3C8C30] font-bold">-{formatINR(Math.abs(variance))}</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expenses History Table */}
      <div className="bg-white rounded-2xl border border-[#E5DBCB] overflow-hidden shadow-xs p-6 space-y-4">
        <h3 className="font-serif text-lg font-bold text-[#26232B]">Logged Expenses</h3>
        {allExpenses.length === 0 ? (
          <p className="text-xs text-[#665F6B] py-4 text-center">No actual expenses logged yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#E5DBCB] text-[#665F6B] font-bold uppercase tracking-wider">
                  <th className="py-2.5 px-3">Date</th>
                  <th className="py-2.5 px-3">Category</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-right">Amount</th>
                  <th className="py-2.5 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3ECE0]">
                {allExpenses.map((exp) => {
                  const cat = categories.find((c) => c.id === exp.categoryId);
                  return (
                    <tr key={exp.id} className="hover:bg-[#FAF6EF]/50">
                      <td className="py-2.5 px-3 text-[#665F6B]">{exp.paidOn}</td>
                      <td className="py-2.5 px-3 font-semibold text-[#26232B]">{cat?.name || 'Unknown'}</td>
                      <td className="py-2.5 px-3 text-[#26232B]">{exp.description}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-[#26232B]">{formatINR(exp.amount)}</td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleDeleteExpense(exp.id)}
                          className="text-[#E8735A] hover:text-[#D45E45] p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E5DBCB] shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5DBCB] pb-3">
              <h3 className="font-serif text-lg font-bold text-[#26232B]">Add New Expense</h3>
              <button onClick={() => setShowAddExpense(false)} className="text-[#665F6B] p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddExpense} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-[#665F6B] uppercase block">Category</label>
                <select
                  value={expCatId}
                  onChange={(e) => setExpCatId(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E5DBCB] text-sm"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Allocated: {formatINR(c.allocated)})
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#665F6B] uppercase block">Description</label>
                <input
                  type="text"
                  required
                  value={expDesc}
                  onChange={(e) => setExpDesc(e.target.value)}
                  placeholder="e.g., Venue advance payment token"
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E5DBCB] text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#665F6B] uppercase block">Amount (INR)</label>
                <input
                  type="number"
                  min={1}
                  required
                  value={expAmount}
                  onChange={(e) => setExpAmount(Number(e.target.value))}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E5DBCB] text-sm font-semibold"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#665F6B] uppercase block">Payment Date</label>
                <input
                  type="date"
                  required
                  value={expDate}
                  onChange={(e) => setExpDate(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E5DBCB] text-sm"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddExpense(false)}
                  className="px-4 py-2 rounded-xl border border-[#E5DBCB] text-[#665F6B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingExpense}
                  className="px-5 py-2 rounded-xl bg-[#26232B] text-[#FAF6EF] font-bold"
                >
                  {savingExpense ? 'Logging...' : 'Save Expense'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Budget Rescue Modal (Tier 2) */}
      {showRescueModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 border border-[#E5DBCB] shadow-2xl space-y-6">
            <div className="flex items-center justify-between border-b border-[#E5DBCB] pb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-[#FDEAE6] text-[#E8735A] flex items-center justify-center">
                  <LifeBuoy className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-xl font-bold text-[#26232B]">Budget Rescue Engine</h3>
                  <p className="text-xs text-[#665F6B]">
                    Deterministic estimate reduction algorithm respecting priority order and 30% caps.
                  </p>
                </div>
              </div>
              <button onClick={() => setShowRescueModal(false)} className="text-[#665F6B] p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {rescue.overrun === 0 ? (
              <div className="p-6 rounded-2xl bg-[#F2F7F2] text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-[#3C8C30] mx-auto" />
                <h4 className="font-bold text-[#2D5A27]">Event is On Budget</h4>
                <p className="text-xs text-[#665F6B]">
                  No estimate reductions are required. All planned commitments fit inside your ₹{formatINR(totalBudget)} total budget.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-[#FAF6EF] border border-[#E5DBCB] text-xs space-y-2">
                  <div className="flex justify-between font-bold">
                    <span>Current Overrun to Resolve:</span>
                    <span className="text-[#E8735A]">{formatINR(rescue.overrun)}</span>
                  </div>
                  <div className="flex justify-between font-bold">
                    <span>Total Projected Savings:</span>
                    <span className="text-[#3C8C30]">{formatINR(rescue.totalSavings)}</span>
                  </div>
                  {rescue.remainingGap > 0 && (
                    <div className="flex justify-between font-bold text-[#E8735A]">
                      <span>Remaining Unresolved Gap:</span>
                      <span>{formatINR(rescue.remainingGap)}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#665F6B] uppercase tracking-wider block">
                    Proposed Priority Reductions (Max 30% per category)
                  </span>
                  <div className="divide-y divide-[#F3ECE0] border border-[#E5DBCB] rounded-xl overflow-hidden text-xs">
                    {rescue.cuts.map((cut) => (
                      <div key={cut.category} className="p-3 flex items-center justify-between hover:bg-[#FAF6EF]">
                        <div>
                          <span className="font-bold text-[#26232B] block">{cut.category}</span>
                          <span className="text-[11px] text-[#665F6B]">
                            {formatINR(cut.currentEstimate)} → {formatINR(cut.proposedEstimate)}
                          </span>
                        </div>
                        <span className="font-bold text-[#3C8C30] flex items-center gap-1">
                          <TrendingDown className="w-3.5 h-3.5" />
                          -{formatINR(cut.savings)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {rescue.contingencyWarning && (
                  <p className="text-xs text-[#8C6D1F] bg-[#FFF9E6] p-2.5 rounded-lg border border-[#FFE2A3]">
                    Notice: Contingency allocation is below 5% of total budget. Ensure sufficient reserve.
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2 border-t border-[#E5DBCB]">
              <button
                type="button"
                onClick={() => setShowRescueModal(false)}
                className="px-4 py-2 rounded-xl border border-[#E5DBCB] text-xs font-semibold text-[#665F6B]"
              >
                Close
              </button>
              {rescue.needed && (
                <button
                  type="button"
                  onClick={handleApplyRescue}
                  disabled={applyingRescue || rescue.cuts.length === 0}
                  className="px-6 py-2.5 rounded-xl bg-[#E8735A] text-white text-xs font-bold hover:bg-[#D45E45] transition-all flex items-center gap-1.5 shadow-sm"
                >
                  {applyingRescue ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Applying...</span>
                    </>
                  ) : (
                    <span>Apply Rescue Reductions</span>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

