'use client';

import { useState } from 'react';
import { isOverdue } from '@/lib/planning/timeline';
import { today } from '@/lib/date';
import {
  Calendar,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Plus,
  Trash2,
  Filter,
  CheckSquare,
  Square,
  Lock,
  X,
  Loader2
} from 'lucide-react';
import { TASK_STATUSES, TASK_PRIORITIES, type TaskStatus, type TaskPriority } from '@/lib/constants';

interface TaskItem {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  startTime?: string | null;
  offsetDays?: number | null;
  priority: string;
  status: string;
  category: string;
  source: string;
  locked: boolean;
}

interface TimelineTabProps {
  eventId: string;
  eventDate: string;
  tasks: TaskItem[];
  onRefresh: () => void;
}

export function TimelineTab({ eventId, eventDate, tasks, onRefresh }: TimelineTabProps) {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState(eventDate);
  const [startTime, setStartTime] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [category, setCategory] = useState('');
  const [saving, setSaving] = useState(false);

  const completedCount = tasks.filter((t) => t.status === 'COMPLETED').length;
  const overdueCount = tasks.filter((t) => isOverdue(t.status, t.dueDate)).length;

  const handleToggleStatus = async (task: TaskItem) => {
    const nextStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      await fetch(`/api/events/${eventId}/tasks`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          taskId: task.id,
          status: nextStatus,
        }),
      });
      onRefresh();
    } catch {
      alert('Failed to update task status');
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      setSaving(true);
      const res = await fetch(`/api/events/${eventId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          dueDate,
          startTime: startTime || null,
          priority,
          category: category.trim() || 'General',
          status: 'PENDING',
        }),
      });
      if (!res.ok) throw new Error('Failed to create task');
      setTitle('');
      setDescription('');
      setShowAddModal(false);
      onRefresh();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error adding task');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;
    try {
      await fetch(`/api/events/${eventId}/tasks?taskId=${taskId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      onRefresh();
    } catch {
      alert('Failed to delete task');
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (statusFilter !== 'ALL' && t.status !== statusFilter) return false;
    if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;
    return true;
  });

  // Day-of event tasks
  const eventDayTasks = tasks.filter((t) => t.dueDate === eventDate || t.startTime);

  return (
    <div className="space-y-8">
      {/* Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-2xl border border-[#E5DBCB] space-y-1">
          <span className="text-[11px] font-bold text-[#665F6B] uppercase tracking-wider block">Total Milestones</span>
          <span className="text-xl font-bold text-[#26232B]">{tasks.length} Tasks</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E5DBCB] space-y-1">
          <span className="text-[11px] font-bold text-[#665F6B] uppercase tracking-wider block">Completed</span>
          <span className="text-xl font-bold text-[#3C8C30]">
            {completedCount} ({tasks.length > 0 ? Math.round((completedCount / tasks.length) * 100) : 0}%)
          </span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-[#E5DBCB] space-y-1">
          <span className="text-[11px] font-bold text-[#665F6B] uppercase tracking-wider block">Overdue Action Items</span>
          <span className={`text-xl font-bold ${overdueCount > 0 ? 'text-[#E8735A]' : 'text-[#26232B]'}`}>
            {overdueCount} Overdue
          </span>
        </div>
      </div>

      {/* Filter and Actions Header */}
      <div className="bg-white rounded-3xl p-6 border border-[#E5DBCB] shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E5DBCB] pb-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#8B7BB8]" />
            <div>
              <h2 className="font-serif text-xl font-bold text-[#26232B]">Action Timeline</h2>
              <p className="text-xs text-[#665F6B]">Milestones ordered chronologically with automated short-notice adaptations.</p>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 rounded-xl bg-[#26232B] text-[#FAF6EF] text-xs font-bold hover:bg-[#3D3845] transition-colors flex items-center gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5 text-[#C9A96A]" />
            <span>Add Custom Task</span>
          </button>
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#665F6B] uppercase tracking-wider text-[11px]">Status:</span>
            {['ALL', 'PENDING', 'IN_PROGRESS', 'COMPLETED'].map((st) => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1 rounded-full font-medium transition-colors ${
                  statusFilter === st
                    ? 'bg-[#26232B] text-[#FAF6EF]'
                    : 'bg-[#F3ECE0] text-[#665F6B] hover:bg-[#EAE1D1]'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="font-bold text-[#665F6B] uppercase tracking-wider text-[11px]">Priority:</span>
            {['ALL', 'HIGH', 'MEDIUM', 'LOW'].map((pr) => (
              <button
                key={pr}
                onClick={() => setPriorityFilter(pr)}
                className={`px-2.5 py-1 rounded-full font-medium transition-colors ${
                  priorityFilter === pr
                    ? 'bg-[#8B7BB8] text-white'
                    : 'bg-[#FAF6EF] border border-[#E5DBCB] text-[#665F6B]'
                }`}
              >
                {pr}
              </button>
            ))}
          </div>
        </div>

        {/* Tasks List */}
        {filteredTasks.length === 0 ? (
          <p className="text-xs text-[#665F6B] text-center py-8">No tasks match the filter criteria.</p>
        ) : (
          <div className="divide-y divide-[#F3ECE0]">
            {filteredTasks.map((task) => {
              const overdue = isOverdue(task.status, task.dueDate);
              const isCompleted = task.status === 'COMPLETED';

              return (
                <div
                  key={task.id}
                  className={`py-3.5 px-3 rounded-xl transition-colors flex items-start justify-between gap-4 ${
                    isCompleted ? 'opacity-60 bg-[#FAF6EF]/30' : 'hover:bg-[#FAF6EF]/50'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleToggleStatus(task)}
                      className="mt-0.5 text-[#8B7BB8] hover:scale-110 transition-transform"
                    >
                      {isCompleted ? (
                        <CheckSquare className="w-5 h-5 text-[#3C8C30]" />
                      ) : (
                        <Square className="w-5 h-5 text-[#665F6B]" />
                      )}
                    </button>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span
                          className={`font-semibold text-sm ${
                            isCompleted ? 'line-through text-[#665F6B]' : 'text-[#26232B]'
                          }`}
                        >
                          {task.title}
                        </span>
                        {task.locked && (
                          <span title="Locked from auto-regeneration">
                            <Lock className="w-3 h-3 text-[#C9A96A]" />
                          </span>
                        )}
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                            task.priority === 'HIGH'
                              ? 'bg-[#FDEAE6] text-[#E8735A]'
                              : task.priority === 'MEDIUM'
                              ? 'bg-[#FFF9E6] text-[#8C6D1F]'
                              : 'bg-[#F2F7F2] text-[#2D5A27]'
                          }`}
                        >
                          {task.priority}
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-xs text-[#665F6B] leading-relaxed">{task.description}</p>
                      )}

                      <div className="flex items-center gap-3 text-[11px] text-[#665F6B] pt-0.5">
                        <span>Category: {task.category || 'General'}</span>
                        {task.startTime && <span>• Time: {task.startTime}</span>}
                        {task.source === 'AI' && <span>• AI Suggested</span>}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right text-xs">
                      <span className={`font-semibold block ${overdue ? 'text-[#E8735A]' : 'text-[#26232B]'}`}>
                        {task.dueDate}
                      </span>
                      {overdue && (
                        <span className="text-[10px] font-bold text-[#E8735A] uppercase block">Overdue</span>
                      )}
                    </div>

                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="p-1 text-[#E8735A] hover:bg-[#FDEAE6] rounded-md transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Day-of Event Schedule Highlight */}
      {eventDayTasks.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-[#E5DBCB] shadow-xs space-y-4">
          <div className="flex items-center gap-2 border-b border-[#E5DBCB] pb-3">
            <Clock className="w-4 h-4 text-[#C9A96A]" />
            <h3 className="font-serif text-lg font-bold text-[#26232B]">Event-Day Run of Show</h3>
          </div>
          <div className="divide-y divide-[#F3ECE0]">
            {eventDayTasks.map((t) => (
              <div key={t.id} className="py-2.5 flex items-center justify-between text-xs">
                <span className="font-semibold text-[#26232B]">{t.title}</span>
                <span className="text-[#8B7BB8] font-medium">{t.startTime || 'All day'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Task Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 border border-[#E5DBCB] shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5DBCB] pb-3">
              <h3 className="font-serif text-lg font-bold text-[#26232B]">Add Custom Task</h3>
              <button onClick={() => setShowAddModal(false)} className="text-[#665F6B] p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddTask} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-bold text-[#665F6B] uppercase block">Task Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., Pick up floral centerpieces"
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E5DBCB] text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-bold text-[#665F6B] uppercase block">Description (Optional)</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Additional context or contact instructions..."
                  className="w-full px-3 py-2 rounded-xl border border-[#E5DBCB] text-sm resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-[#665F6B] uppercase block">Due Date</label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5DBCB] text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-[#665F6B] uppercase block">Start Time (Optional)</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5DBCB] text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="font-bold text-[#665F6B] uppercase block">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full px-3 py-2 rounded-xl border border-[#E5DBCB] text-sm"
                  >
                    {TASK_PRIORITIES.map((pr) => (
                      <option key={pr} value={pr}>
                        {pr}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-bold text-[#665F6B] uppercase block">Category</label>
                  <input
                    type="text"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    placeholder="e.g., Venue, Catering"
                    className="w-full px-3 py-2 rounded-xl border border-[#E5DBCB] text-sm"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border border-[#E5DBCB] text-[#665F6B]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-[#26232B] text-[#FAF6EF] font-bold"
                >
                  {saving ? 'Creating...' : 'Create Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

