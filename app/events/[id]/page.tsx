
'use client';

import {
  use,
  useCallback,
  useEffect,
  useState,
  Suspense,
  type ComponentProps,
  type FormEvent,
} from 'react';
import { useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Compass,
  IndianRupee,
  Calendar,
  Briefcase,
  Sparkles,
  ArrowLeft,
  Loader2,
  AlertTriangle,
  Edit3,
  X,
} from 'lucide-react';

import { OverviewTab } from '@/components/event/OverviewTab';
import { PlanIdeasTab } from '@/components/event/PlanIdeasTab';
import { BudgetTab } from '@/components/event/BudgetTab';
import { TimelineTab } from '@/components/event/TimelineTab';
import { VendorsTab } from '@/components/event/VendorsTab';
import { WhatIfModal } from '@/components/event/WhatIfModal';
import { RegenerateModal } from '@/components/event/RegenerateModal';
import { type EventType } from '@/lib/constants';

interface PageProps {
  params: Promise<{ id: string }>;
}

type EventTab =
  | 'overview'
  | 'plan'
  | 'budget'
  | 'timeline'
  | 'vendors';

type OverviewProps = ComponentProps<typeof OverviewTab>;
type PlanIdeasProps = ComponentProps<typeof PlanIdeasTab>;
type BudgetProps = ComponentProps<typeof BudgetTab>;
type TimelineProps = ComponentProps<typeof TimelineTab>;
type VendorsProps = ComponentProps<typeof VendorsTab>;

type EventData = OverviewProps['event'] & {
  tasks: TimelineProps['tasks'];
  vendors: VendorsProps['vendors'];
  budgetCategories: BudgetProps['categories'];
  checklistItems: VendorsProps['checklistItems'];
  savedIdeas: PlanIdeasProps['savedIdeas'];
  aiPlans?: NonNullable<OverviewProps['aiPlan']>[];
};

type EditableDetails = {
  name: string;
  city: string;
  theme: string;
  colors: string;
  foodPreferences: string;
  venuePreferences: string;
  culturalPreferences: string;
  specialRequirements: string;
};

type WhatIfChanges = {
  newBudget?: number;
  newGuests?: number;
  newDate?: string;
  newTheme?: string;
};

const TABS = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'plan', label: 'Plan & Ideas', icon: Compass },
  { id: 'budget', label: 'Budget & Expenses', icon: IndianRupee },
  { id: 'timeline', label: 'Timeline & Tasks', icon: Calendar },
  { id: 'vendors', label: 'Vendors & Checklist', icon: Briefcase },
] satisfies {
  id: EventTab;
  label: string;
  icon: typeof LayoutDashboard;
}[];

const EMPTY_DETAILS: EditableDetails = {
  name: '',
  city: '',
  theme: '',
  colors: '',
  foodPreferences: '',
  venuePreferences: '',
  culturalPreferences: '',
  specialRequirements: '',
};

function getErrorMessage(value: unknown, fallback: string): string {
  if (typeof value !== 'object' || value === null) {
    return fallback;
  }

  const record = value as Record<string, unknown>;
  const error = record.error;

  if (typeof error === 'string') {
    return error;
  }

  if (typeof error === 'object' && error !== null) {
    const message = (error as Record<string, unknown>).message;

    if (typeof message === 'string') {
      return message;
    }
  }

  return fallback;
}

async function readResponse(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

function extractEvent(payload: unknown): EventData {
  if (typeof payload !== 'object' || payload === null) {
    throw new Error('Invalid event response');
  }

  const data = (payload as Record<string, unknown>).data;

  if (typeof data !== 'object' || data === null) {
    throw new Error('Event data is missing');
  }

  // Existing component prop contracts are reused here.
  // Full runtime validation should be added using the project's
  // shared event-response Zod schema, if one exists.
  return data as EventData;
}

function getEditableDetails(event: EventData): EditableDetails {
  return {
    name: event.name ?? '',
    city: event.city ?? '',
    theme: event.theme ?? '',
    colors: event.colors ?? '',
    foodPreferences: event.foodPreferences ?? '',
    venuePreferences: event.venuePreferences ?? '',
    culturalPreferences: event.culturalPreferences ?? '',
    specialRequirements: event.specialRequirements ?? '',
  };
}

function EventWorkspaceContent({ params }: PageProps) {
  const { id } = use(params);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<EventTab>('overview');

  const [eventData, setEventData] = useState<EventData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showWhatIf, setShowWhatIf] = useState(false);
  const [showRegenerate, setShowRegenerate] = useState(false);
  const [showEditBasics, setShowEditBasics] = useState(false);

  const [details, setDetails] =
    useState<EditableDetails>(EMPTY_DETAILS);

  const [savingBasics, setSavingBasics] = useState(false);

  const fetchEvent = useCallback(async () => {
    const response = await fetch(`/api/events/${id}`, {
      cache: 'no-store',
    });

    const payload = await readResponse(response);

    if (!response.ok) {
      throw new Error(
        getErrorMessage(payload, 'Failed to load event')
      );
    }

    const event = extractEvent(payload);

    setEventData(event);
    setDetails(getEditableDetails(event));

    return event;
  }, [id]);

  useEffect(() => {
    let cancelled = false;

    async function loadInitialEvent() {
      try {
        const response = await fetch(`/api/events/${id}`, {
          cache: 'no-store',
        });

        const payload = await readResponse(response);

        if (!response.ok) {
          throw new Error(
            getErrorMessage(payload, 'Event not found')
          );
        }

        const event = extractEvent(payload);

        if (!cancelled) {
          setEventData(event);
          setDetails(getEditableDetails(event));
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Error loading event'
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadInitialEvent();

    return () => {
      cancelled = true;
    };
  }, [id]);

  const refreshEvent = useCallback(async () => {
    try {
      await fetchEvent();
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to refresh event';

      setError(message);
      throw err;
    }
  }, [fetchEvent]);

  const handleApplyWhatIf = async (changes: WhatIfChanges) => {
    const payload: Record<string, unknown> = {};

    if (changes.newBudget !== undefined) {
      payload.totalBudget = changes.newBudget;
    }

    if (changes.newGuests !== undefined) {
      payload.guestCount = changes.newGuests;
    }

    if (changes.newDate !== undefined) {
      payload.date = changes.newDate;
    }

    if (changes.newTheme !== undefined) {
      payload.theme = changes.newTheme;
    }

    if (Object.keys(payload).length === 0) {
      return;
    }

    const response = await fetch(`/api/events/${id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const result = await readResponse(response);

    if (!response.ok) {
      throw new Error(
        getErrorMessage(result, 'Failed to update event')
      );
    }

    await refreshEvent();
  };

  const handleRegenerate = async () => {
    const generate = async (useDemoFallback: boolean) => {
      return fetch('/api/ai/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          eventId: id,
          ...(useDemoFallback ? { useDemoFallback: true } : {}),
        }),
      });
    };

    let response = await generate(false);

    if (!response.ok && response.status >= 500) {
      response = await generate(true);
    }

    if (!response.ok) {
      const result = await readResponse(response);

      throw new Error(
        getErrorMessage(result, 'Failed to regenerate plan')
      );
    }

    await refreshEvent();
  };

  const updateDetail = (
    field: keyof EditableDetails,
    value: string
  ) => {
    setDetails((previous) => ({
      ...previous,
      [field]: value,
    }));
  };

  const handleSaveBasics = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    try {
      setSavingBasics(true);

      const payload = Object.fromEntries(
        Object.entries(details).map(([key, value]) => [
          key,
          value.trim(),
        ])
      );

      const response = await fetch(`/api/events/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await readResponse(response);

      if (!response.ok) {
        throw new Error(
          getErrorMessage(result, 'Failed to update event details')
        );
      }

      await refreshEvent();
      setShowEditBasics(false);
    } catch (err) {
      window.alert(
        err instanceof Error
          ? err.message
          : 'Error updating details'
      );
    } finally {
      setSavingBasics(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#8B7BB8] mx-auto" />
        <p className="text-sm text-[#665F6B]">
          Loading event workspace from database...
        </p>
      </div>
    );
  }

  if (error || !eventData) {
    return (
      <div className="py-16 text-center space-y-4 max-w-md mx-auto">
        <div className="p-4 rounded-2xl bg-[#FDEAE6] text-[#E8735A] border border-[#F6C5BC] flex items-center justify-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span className="text-sm font-semibold">
            {error || 'Event not found'}
          </span>
        </div>

        <button
          onClick={() => router.push('/events')}
          className="px-5 py-2.5 rounded-xl bg-[#26232B] text-[#FAF6EF] text-xs font-bold"
        >
          Return to Saved Events
        </button>
      </div>
    );
  }

  const tasks = eventData.tasks ?? [];
  const vendors = eventData.vendors ?? [];
  const budgetCategories = eventData.budgetCategories ?? [];
  const checklistItems = eventData.checklistItems ?? [];
  const savedIdeas = eventData.savedIdeas ?? [];
  const aiPlan = eventData.aiPlans?.[0] ?? null;

  const lockedTaskCount = tasks.filter(
    (task) => task.locked
  ).length;

  const userTaskCount = tasks.filter(
    (task) => task.source === 'USER'
  ).length;

  const favoriteIdeaCount = savedIdeas.filter(
    (idea) => idea.favorite
  ).length;

  const completedChecklistCount = checklistItems.filter(
    (item) => item.done
  ).length;

  return (
    <div className="space-y-6">
      {/* Workspace navigation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-[#E5DBCB] pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/events')}
            className="p-2 rounded-xl border border-[#E5DBCB] text-[#665F6B] hover:bg-[#FAF6EF] transition-colors"
            title="Back to Saved Events"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#26232B] line-clamp-1">
              {eventData.name}
            </h1>

            <p className="text-xs text-[#665F6B]">
              {eventData.city} â€¢ {eventData.date} â€¢{' '}
              {eventData.guestCount} Guests
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => setShowEditBasics(true)}
            className="px-3 py-1.5 rounded-xl border border-[#E5DBCB] text-xs font-semibold text-[#26232B] hover:bg-[#FAF6EF] flex items-center gap-1.5"
          >
            <Edit3 className="w-3.5 h-3.5 text-[#8B7BB8]" />
            <span>Edit Details</span>
          </button>

          <button
            onClick={() => setShowWhatIf(true)}
            className="px-3.5 py-1.5 rounded-xl border border-[#E5DBCB] text-xs font-bold text-[#26232B] hover:bg-[#FAF6EF] flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#C9A96A]" />
            <span>What-If</span>
          </button>
        </div>
      </div>

      {/* Workspace tabs */}
      <div className="flex items-center gap-2 overflow-x-auto border-b border-[#E5DBCB] pb-2 scrollbar-none">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shrink-0 btn-interactive ${isActive ? 'bg-[#26232B] text-[#FAF6EF] shadow-xs' : 'text-[#665F6B] hover:bg-[#F3ECE0]'}`}>
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#C9A96A]' : ''}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels with smooth entrance transition */}
      <div key={activeTab} className="animate-fade-in">
        {activeTab === 'overview' && (
          <OverviewTab event={eventData} budgetCategories={budgetCategories} tasks={tasks} vendors={vendors}
            aiPlan={aiPlan} onOpenWhatIf={() => setShowWhatIf(true)}
            onOpenRegenerate={() => setShowRegenerate(true)}
            onSwitchTab={(tab) => { if (["overview", "plan", "budget", "timeline", "vendors"].includes(tab)) setActiveTab(tab as typeof activeTab); }} />
        )}
        {activeTab === 'plan' && (
          <PlanIdeasTab eventId={id} aiPlan={aiPlan} savedIdeas={savedIdeas} onRefresh={fetchEvent} />
        )}
        {activeTab === 'budget' && (
          <BudgetTab eventId={id} totalBudget={eventData.totalBudget} categories={budgetCategories} onRefresh={fetchEvent} />
        )}
        {activeTab === 'timeline' && (
          <TimelineTab eventId={id} eventDate={eventData.date} tasks={tasks} onRefresh={fetchEvent} />
        )}
        {activeTab === 'vendors' && (
          <VendorsTab eventId={id} eventType={eventData.type} vendors={vendors}
            checklistItems={checklistItems} onRefresh={fetchEvent} />
        )}
      </div>

      {/* What-If modal */}
      <WhatIfModal
        isOpen={showWhatIf}
        onClose={() => setShowWhatIf(false)}
        eventType={eventData.type as EventType}
        currentBudget={eventData.totalBudget}
        currentGuests={eventData.guestCount}
        currentDate={eventData.date}
        currentTheme={eventData.theme}
        categories={budgetCategories}
        onApply={handleApplyWhatIf}
      />

      {/* Regenerate modal */}
      <RegenerateModal
        isOpen={showRegenerate}
        onClose={() => setShowRegenerate(false)}
        eventId={id}
        lockedTaskCount={lockedTaskCount}
        userTaskCount={userTaskCount}
        favoriteIdeaCount={favoriteIdeaCount}
        completedChecklistCount={completedChecklistCount}
        onConfirm={handleRegenerate}
      />

      {/* Edit details modal */}
      {showEditBasics && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 border border-[#E5DBCB] shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#E5DBCB] pb-3">
              <h3 className="font-serif text-lg font-bold text-[#26232B]">
                Edit Event Preferences
              </h3>

              <button
                type="button"
                onClick={() => setShowEditBasics(false)}
                className="text-[#665F6B] p-1"
                aria-label="Close edit details"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form
              onSubmit={handleSaveBasics}
              className="space-y-4 text-xs"
            >
              <div className="space-y-1.5">
                <label
                  htmlFor="edit-event-name"
                  className="font-bold text-[#665F6B] uppercase block"
                >
                  Event Name
                </label>

                <input
                  id="edit-event-name"
                  type="text"
                  required
                  value={details.name}
                  onChange={(e) =>
                    updateDetail('name', e.target.value)
                  }
                  className="w-full px-3 py-2.5 rounded-xl border border-[#E5DBCB] text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label
                    htmlFor="edit-event-city"
                    className="font-bold text-[#665F6B] uppercase block"
                  >
                    City
                  </label>

                  <input
                    id="edit-event-city"
                    type="text"
                    required
                    value={details.city}
                    onChange={(e) =>
                      updateDetail('city', e.target.value)
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#E5DBCB] text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="edit-event-theme"
                    className="font-bold text-[#665F6B] uppercase block"
                  >
                    Theme
                  </label>

                  <input
                    id="edit-event-theme"
                    type="text"
                    value={details.theme}
                    onChange={(e) =>
                      updateDetail('theme', e.target.value)
                    }
                    className="w-full px-3 py-2 rounded-xl border border-[#E5DBCB] text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="edit-event-colors"
                  className="font-bold text-[#665F6B] uppercase block"
                >
                  Color Palette
                </label>

                <input
                  id="edit-event-colors"
                  type="text"
                  value={details.colors}
                  onChange={(e) =>
                    updateDetail('colors', e.target.value)
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#E5DBCB] text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="edit-event-food"
                  className="font-bold text-[#665F6B] uppercase block"
                >
                  Food Preferences
                </label>

                <input
                  id="edit-event-food"
                  type="text"
                  value={details.foodPreferences}
                  onChange={(e) =>
                    updateDetail('foodPreferences', e.target.value)
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#E5DBCB] text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="edit-event-special"
                  className="font-bold text-[#665F6B] uppercase block"
                >
                  Special Requirements
                </label>

                <textarea
                  id="edit-event-special"
                  rows={2}
                  value={details.specialRequirements}
                  onChange={(e) =>
                    updateDetail('specialRequirements', e.target.value)
                  }
                  className="w-full px-3 py-2 rounded-xl border border-[#E5DBCB] text-sm resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEditBasics(false)}
                  className="px-4 py-2 rounded-xl border border-[#E5DBCB] text-[#665F6B]"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={savingBasics}
                  className="px-5 py-2 rounded-xl bg-[#26232B] text-[#FAF6EF] font-bold disabled:opacity-60"
                >
                  {savingBasics ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function EventWorkspacePage({
  params,
}: PageProps) {
  return (
    <Suspense
      fallback={
        <div className="py-24 text-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#8B7BB8] mx-auto" />
          <p className="text-sm text-[#665F6B]">
            Loading event workspace...
          </p>
        </div>
      }
    >
      <EventWorkspaceContent params={params} />
    </Suspense>
  );
}
