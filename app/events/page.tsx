'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CalendarHeart,
  Users,
  IndianRupee,
  Clock,
  Sparkles,
  Copy,
  Trash2,
  ExternalLink,
  Plus,
  Loader2,
  CalendarCheck,
  AlertCircle
} from 'lucide-react';
import { formatINR, daysBetween, today } from '@/lib/date';
import { EVENT_TYPE_LABELS, type EventType } from '@/lib/constants';

interface EventSummary {
  id: string;
  name: string;
  type: EventType;
  date: string;
  city: string;
  guestCount: number;
  totalBudget: number;
  createdAt: string;
  updatedAt: string;
}

export default function SavedEventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState<EventSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/events');
      const json = await res.json();
      if (res.ok) {
        setEvents(json.data || []);
      } else {
        throw new Error(json.error?.message || 'Failed to fetch events');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error loading events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const run = async () => {
      await Promise.resolve();
      await fetchEvents();
    };
    void run();
  }, []);

  const handleDuplicate = async (id: string) => {
    try {
      setActionId(id);
      const res = await fetch(`/api/events/${id}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error?.message || 'Failed to duplicate');
      fetchEvents();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Duplication failed');
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to permanently delete "${name}"? This action cannot be undone.`)) {
      return;
    }
    try {
      setActionId(id);
      const res = await fetch(`/api/events/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error?.message || 'Failed to delete');
      }
      setEvents((prev) => prev.filter((e) => e.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E5DBCB] pb-6">
        <div>
          <h1 className="font-serif text-3xl font-bold text-[#26232B]">Saved Celebrations</h1>
          <p className="text-sm text-[#665F6B] mt-1">
            Access, duplicate, or manage all your persistent local events.
          </p>
        </div>

        <Link
          href="/events/new"
          className="px-5 py-2.5 rounded-xl bg-[#26232B] text-[#FAF6EF] text-sm font-semibold hover:bg-[#3D3845] transition-all shadow-sm flex items-center gap-2 btn-interactive"
        >
          <Plus className="w-4 h-4 text-[#C9A96A]" />
          <span>New Event</span>
        </Link>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[#FDEAE6] border border-[#F6C5BC] text-[#E8735A] text-sm flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="p-16 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#8B7BB8] mx-auto" />
          <p className="text-sm text-[#665F6B]">Retrieving saved blueprints from SQLite database...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-[#E5DBCB] space-y-4 max-w-lg mx-auto">
          <div className="w-16 h-16 rounded-2xl bg-[#FAF6EF] border border-[#E5DBCB] flex items-center justify-center text-[#8B7BB8] mx-auto">
            <CalendarHeart className="w-8 h-8" />
          </div>
          <h3 className="font-serif text-xl font-bold text-[#26232B]">No Saved Events Yet</h3>
          <p className="text-sm text-[#665F6B]">
            Start by creating a wedding, birthday party, or community celebration using our guided wizard.
          </p>
          <div className="pt-2">
            <Link
              href="/events/new"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#26232B] text-[#FAF6EF] text-sm font-semibold hover:bg-[#3D3845]"
            >
              <span>Create Your First Event</span>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
          {events.map((evt, idx) => {
            const daysLeft = daysBetween(evt.date, today());
            const isPast = daysLeft < 0;
            const delayClass = idx % 3 === 1 ? 'delay-100' : idx % 3 === 2 ? 'delay-200' : '';

            return (
              <div
                key={evt.id}
                className={`bg-white rounded-2xl p-6 border border-[#E5DBCB] shadow-xs card-interactive flex flex-col justify-between space-y-5 animate-slide-up ${delayClass}`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold tracking-wider uppercase px-2.5 py-1 rounded-md bg-[#F3ECE0] text-[#8B7BB8]">
                      {EVENT_TYPE_LABELS[evt.type]}
                    </span>

                    {isPast ? (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-[#E2E8F0] text-[#475569] flex items-center gap-1">
                        <CalendarCheck className="w-3 h-3" />
                        <span>Completed</span>
                      </span>
                    ) : daysLeft === 0 ? (
                      <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-[#FDEAE6] text-[#E8735A] animate-pulse">
                        Today!
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-[#665F6B] flex items-center gap-1">
                        <Clock className="w-3 h-3 text-[#C9A96A]" />
                        <span>{daysLeft} days away</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="font-serif text-lg font-bold text-[#26232B] line-clamp-1">
                      {evt.name}
                    </h3>
                    <p className="text-xs text-[#665F6B] mt-0.5">
                      {evt.city} â€¢ {evt.date}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#F3ECE0] text-xs">
                    <div>
                      <span className="text-[#665F6B] block">Scale</span>
                      <span className="font-semibold text-[#26232B] flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-[#8B7BB8]" />
                        {evt.guestCount} guests
                      </span>
                    </div>

                    <div>
                      <span className="text-[#665F6B] block">Budget</span>
                      <span className="font-semibold text-[#26232B]">
                        {formatINR(evt.totalBudget)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-[#E5DBCB] flex items-center justify-between gap-2">
                  <Link
                    href={`/events/${evt.id}`}
                    className="flex-1 py-2 px-3 rounded-lg bg-[#26232B] text-[#FAF6EF] text-xs font-semibold text-center hover:bg-[#3D3845] transition-colors flex items-center justify-center gap-1.5 btn-interactive"
                  >
                    <span>Open Workspace</span>
                    <ExternalLink className="w-3.5 h-3.5 text-[#C9A96A]" />
                  </Link>

                  <button
                    onClick={() => handleDuplicate(evt.id)}
                    disabled={actionId === evt.id}
                    title="Duplicate Event Blueprint"
                    className="p-2 rounded-lg border border-[#E5DBCB] text-[#665F6B] hover:bg-[#FAF6EF] hover:text-[#26232B] transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(evt.id, evt.name)}
                    disabled={actionId === evt.id}
                    title="Delete Event"
                    className="p-2 rounded-lg border border-[#E5DBCB] text-[#E8735A] hover:bg-[#FDEAE6] transition-colors"
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
  );
}
