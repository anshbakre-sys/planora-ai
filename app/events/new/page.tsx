'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  CalendarHeart,
  Users,
  IndianRupee,
  MapPin,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Check,
  Palette,
  Utensils,
  Landmark,
  Languages,
  FileText,
} from 'lucide-react';
import { checkFeasibility } from '@/lib/planning/feasibility';
import { formatINR, today, addDays } from '@/lib/date';
import { EVENT_TYPES, EVENT_TYPE_LABELS, type EventType } from '@/lib/constants';

function WizardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [type, setType] = useState<EventType>('WEDDING');
  const [name, setName] = useState('');
  const [date, setDate] = useState('');
  const [city, setCity] = useState('');

  const [guestCount, setGuestCount] = useState<number>(150);
  const [totalBudget, setTotalBudget] = useState<number>(500000);

  const [theme, setTheme] = useState('Traditional');
  const [colors, setColors] = useState('Gold & Ivory');
  const [foodPreferences, setFoodPreferences] = useState('Vegetarian, Live Chaat Counter');
  const [venuePreferences, setVenuePreferences] = useState('Banquet Hall with Lawn');
  const [culturalPreferences, setCulturalPreferences] = useState('');
  const [specialRequirements, setSpecialRequirements] = useState('');

  // Handle URL query param `?type=`
  useEffect(() => {
    const qType = searchParams.get('type');
    if (qType && (EVENT_TYPES as readonly string[]).includes(qType)) {
      queueMicrotask(() => setType(qType as EventType));
    }
    // Set default date to 60 days ahead
    queueMicrotask(() => setDate(addDays(today(), 60)));
  }, [searchParams]);

  // Feasibility Check
  const feasibility = checkFeasibility(totalBudget, guestCount, type);

  // Step 1 Validation
  const isStep1Valid = name.trim().length >= 3 && name.trim().length <= 80 && city.trim().length >= 1 && date >= today();
  // Step 2 Validation
  const isStep2Valid = guestCount >= 1 && guestCount <= 5000 && totalBudget >= 10000 && totalBudget <= 100000000;

  const handleNext = () => {
    setError(null);
    if (step === 1 && !isStep1Valid) {
      if (date < today()) {
        setError('Event date cannot be in the past');
      } else {
        setError('Please enter a valid event name (3-80 chars) and city.');
      }
      return;
    }
    if (step === 2 && !isStep2Valid) {
      setError('Please provide valid guest count (1-5,000) and budget (â‚¹10,000 - â‚¹10,00,00,000).');
      return;
    }
    if (step < 4) setStep((s) => (s + 1) as 1 | 2 | 3 | 4);
  };

  const handleBack = () => {
    setError(null);
    if (step > 1) setStep((s) => (s - 1) as 1 | 2 | 3 | 4);
  };

  const handleCreateAndGenerate = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1. Create the event
      const createRes = await fetch('/api/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          type,
          date,
          city: city.trim(),
          guestCount: Number(guestCount),
          totalBudget: Number(totalBudget),
          theme: theme.trim(),
          colors: colors.trim(),
          foodPreferences: foodPreferences.trim(),
          venuePreferences: venuePreferences.trim(),
          culturalPreferences: culturalPreferences.trim(),
          specialRequirements: specialRequirements.trim(),
        }),
      });

      const createJson = await createRes.json();
      if (!createRes.ok) {
        throw new Error(createJson.error?.message || 'Failed to create event');
      }

      const eventId = createJson.data.id;

      // 2. Generate Plan (Gemini or honest Demo mode)
      const genRes = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ eventId }),
      });

      const genJson = await genRes.json();
      if (!genRes.ok) {
        // Fallback to demo mode if Gemini fails
        await fetch('/api/ai/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ eventId, useDemoFallback: true }),
        });
      }

      router.push(`/events/${eventId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred during event creation');
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      {/* Header & Step Indicator */}
      <div className="space-y-4">
        <div className="text-center space-y-1">
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-[#26232B]">
            Plan a New Celebration
          </h1>
          <p className="text-sm text-[#665F6B]">
            Follow the 4-step wizard to formulate your event framework.
          </p>
        </div>

        {/* Step Progress Bar */}
        <div className="flex items-center justify-between relative max-w-md mx-auto pt-4">
          <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-[#E5DBCB] -translate-y-1/2 z-0" />
          {[
            { num: 1, label: 'Basics' },
            { num: 2, label: 'Scale' },
            { num: 3, label: 'Style' },
            { num: 4, label: 'Review' },
          ].map((s) => {
            const isCompleted = step > s.num;
            const isCurrent = step === s.num;
            return (
              <div key={s.num} className="relative z-10 flex flex-col items-center">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    isCompleted
                      ? 'bg-[#8B7BB8] text-white'
                      : isCurrent
                      ? 'bg-[#26232B] text-[#FAF6EF] ring-4 ring-[#EFE7DA]'
                      : 'bg-white text-[#665F6B] border border-[#E5DBCB]'
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : s.num}
                </div>
                <span className="text-[11px] font-medium text-[#665F6B] mt-1.5">{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-[#FDEAE6] border border-[#F6C5BC] text-[#E8735A] text-sm flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step Card */}
      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-[#E5DBCB] shadow-sm space-y-6">
        {/* STEP 1: BASICS */}
        {step === 1 && (
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-[#665F6B] tracking-wider uppercase block">
                1. Select Event Type
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {EVENT_TYPES.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      type === t
                        ? 'border-[#8B7BB8] bg-[#F5F2F9] ring-2 ring-[#8B7BB8]/20'
                        : 'border-[#E5DBCB] hover:bg-[#FAF6EF]'
                    }`}
                  >
                    <span className="text-sm font-bold text-[#26232B] block">{EVENT_TYPE_LABELS[t]}</span>
                    <span className="text-xs text-[#665F6B] block mt-1">
                      {t === 'WEDDING' && '4 essential vendors, ceremony timeline'}
                      {t === 'BIRTHDAY' && 'Activities, cake, allergy safeguards'}
                      {t === 'COMMUNITY' && 'Permits, volunteers, crowd safety'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="name" className="text-xs font-bold text-[#665F6B] tracking-wider uppercase block">
                2. Event Name
              </label>
              <input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g., Ananya & Kabir's Sangeet & Wedding"
                maxLength={80}
                className="w-full px-4 py-3 rounded-xl border border-[#E5DBCB] bg-white text-[#26232B] text-sm focus:border-[#8B7BB8] focus:ring-1 focus:ring-[#8B7BB8]"
              />
              <span className="text-[11px] text-[#665F6B]">{name.length}/80 characters (minimum 3)</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="date" className="text-xs font-bold text-[#665F6B] tracking-wider uppercase block">
                  3. Event Date
                </label>
                <input
                  id="date"
                  type="date"
                  min={today()}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#E5DBCB] bg-white text-[#26232B] text-sm focus:border-[#8B7BB8] focus:ring-1 focus:ring-[#8B7BB8]"
                />
              </div>

              <div className="space-y-2">
                <label htmlFor="city" className="text-xs font-bold text-[#665F6B] tracking-wider uppercase block">
                  4. City / Destination
                </label>
                <input
                  id="city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g., Udaipur, Mumbai, Bengaluru"
                  maxLength={100}
                  className="w-full px-4 py-3 rounded-xl border border-[#E5DBCB] bg-white text-[#26232B] text-sm focus:border-[#8B7BB8] focus:ring-1 focus:ring-[#8B7BB8]"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: SCALE & BUDGET */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="guests" className="text-xs font-bold text-[#665F6B] tracking-wider uppercase block flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-[#8B7BB8]" />
                  <span>Estimated Guest Count</span>
                </label>
                <input
                  id="guests"
                  type="number"
                  min={1}
                  max={5000}
                  value={guestCount}
                  onChange={(e) => setGuestCount(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-[#E5DBCB] bg-white text-[#26232B] text-sm font-semibold focus:border-[#8B7BB8]"
                />
                <span className="text-[11px] text-[#665F6B]">Between 1 and 5,000 guests</span>
              </div>

              <div className="space-y-2">
                <label htmlFor="budget" className="text-xs font-bold text-[#665F6B] tracking-wider uppercase block flex items-center gap-1.5">
                  <IndianRupee className="w-3.5 h-3.5 text-[#C9A96A]" />
                  <span>Total Budget (INR)</span>
                </label>
                <input
                  id="budget"
                  type="number"
                  min={10000}
                  max={100000000}
                  step={5000}
                  value={totalBudget}
                  onChange={(e) => setTotalBudget(Number(e.target.value))}
                  className="w-full px-4 py-3 rounded-xl border border-[#E5DBCB] bg-white text-[#26232B] text-sm font-semibold focus:border-[#8B7BB8]"
                />
                <span className="text-[11px] font-semibold text-[#8B7BB8]">
                  {formatINR(totalBudget)}
                </span>
              </div>
            </div>

            {/* Feasibility Indicator */}
            <div
              className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${
                feasibility.feasible
                  ? 'bg-[#F2F7F2] border-[#CDE3CD] text-[#2D5A27]'
                  : 'bg-[#FFF9E6] border-[#FFE2A3] text-[#8C6D1F]'
              }`}
            >
              {feasibility.feasible ? (
                <CheckCircle2 className="w-5 h-5 shrink-0 text-[#3C8C30] mt-0.5" />
              ) : (
                <AlertTriangle className="w-5 h-5 shrink-0 text-[#E0A821] mt-0.5" />
              )}
              <div className="text-xs space-y-1">
                <span className="font-bold block">
                  {feasibility.feasible ? 'Budget Feasibility: Healthy' : 'Budget Feasibility: Tight Budget Heuristic'}
                </span>
                <p className="leading-relaxed">{feasibility.message}</p>
                <span className="text-[11px] opacity-75 block">
                  Planning threshold: â‚¹{feasibility.floor}/guest for {EVENT_TYPE_LABELS[type]}. Calculated: â‚¹{feasibility.budgetPerGuest}/guest.
                </span>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: PREFERENCES */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#665F6B] tracking-wider uppercase block flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-[#8B7BB8]" />
                  <span>Theme / Aesthetic</span>
                </label>
                <select
                  value={theme}
                  onChange={(e) => setTheme(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[#E5DBCB] bg-white text-[#26232B] text-sm"
                >
                  <option value="Traditional">Traditional</option>
                  <option value="Modern">Modern</option>
                  <option value="Rustic">Rustic</option>
                  <option value="Minimal">Minimal</option>
                  <option value="Floral">Floral</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#665F6B] tracking-wider uppercase block">
                  Color Palette
                </label>
                <input
                  type="text"
                  value={colors}
                  onChange={(e) => setColors(e.target.value)}
                  placeholder="e.g., Ivory, Champagne Gold, Lavender"
                  maxLength={100}
                  className="w-full px-4 py-3 rounded-xl border border-[#E5DBCB] bg-white text-[#26232B] text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#665F6B] tracking-wider uppercase block flex items-center gap-1.5">
                <Utensils className="w-3.5 h-3.5 text-[#E8735A]" />
                <span>Food & Dietary Preferences</span>
              </label>
              <input
                type="text"
                value={foodPreferences}
                onChange={(e) => setFoodPreferences(e.target.value)}
                placeholder="e.g., Pure Veg, Jain Options, Live Italian Counter, Vegan Friendly"
                maxLength={300}
                className="w-full px-4 py-3 rounded-xl border border-[#E5DBCB] bg-white text-[#26232B] text-sm"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#665F6B] tracking-wider uppercase block flex items-center gap-1.5">
                  <Landmark className="w-3.5 h-3.5 text-[#8B7BB8]" />
                  <span>Venue Preferences</span>
                </label>
                <input
                  type="text"
                  value={venuePreferences}
                  onChange={(e) => setVenuePreferences(e.target.value)}
                  placeholder="e.g., Heritage property, Outdoor lawn"
                  maxLength={300}
                  className="w-full px-4 py-3 rounded-xl border border-[#E5DBCB] bg-white text-[#26232B] text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#665F6B] tracking-wider uppercase block flex items-center gap-1.5">
                  <Languages className="w-3.5 h-3.5 text-[#C9A96A]" />
                  <span>Cultural / Community Notes</span>
                </label>
                <input
                  type="text"
                  value={culturalPreferences}
                  onChange={(e) => setCulturalPreferences(e.target.value)}
                  placeholder="e.g., Maharashtrian rituals, Gujarati Sangeet"
                  maxLength={300}
                  className="w-full px-4 py-3 rounded-xl border border-[#E5DBCB] bg-white text-[#26232B] text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#665F6B] tracking-wider uppercase block flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#665F6B]" />
                <span>Special Requirements (Accessibility, Permits, etc.)</span>
              </label>
              <textarea
                value={specialRequirements}
                onChange={(e) => setSpecialRequirements(e.target.value)}
                rows={3}
                placeholder="e.g., Wheelchair accessibility required, strict 10 PM sound curfew, green fireworks only"
                maxLength={1000}
                className="w-full px-4 py-3 rounded-xl border border-[#E5DBCB] bg-white text-[#26232B] text-sm resize-none"
              />
            </div>
          </div>
        )}

        {/* STEP 4: REVIEW & GENERATE */}
        {step === 4 && (
          <div className="space-y-6">
            <div className="p-4 rounded-xl bg-[#FAF6EF] border border-[#E5DBCB] space-y-4">
              <div className="flex items-center justify-between border-b border-[#E5DBCB] pb-3">
                <div>
                  <span className="text-xs font-bold text-[#8B7BB8] uppercase tracking-wider block">
                    {EVENT_TYPE_LABELS[type]}
                  </span>
                  <h3 className="font-serif text-xl font-bold text-[#26232B]">{name}</h3>
                </div>
                <div className="text-right">
                  <span className="text-xs text-[#665F6B] block">Event Date</span>
                  <span className="text-sm font-bold text-[#26232B]">{date}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-[#665F6B] block">City</span>
                  <span className="font-semibold text-[#26232B]">{city}</span>
                </div>
                <div>
                  <span className="text-[#665F6B] block">Guests</span>
                  <span className="font-semibold text-[#26232B]">{guestCount}</span>
                </div>
                <div>
                  <span className="text-[#665F6B] block">Total Budget</span>
                  <span className="font-semibold text-[#26232B]">{formatINR(totalBudget)}</span>
                </div>
                <div>
                  <span className="text-[#665F6B] block">Theme</span>
                  <span className="font-semibold text-[#26232B]">{theme}</span>
                </div>
              </div>

              {foodPreferences && (
                <div className="text-xs pt-2 border-t border-[#E5DBCB]">
                  <span className="text-[#665F6B] block font-medium">Food Preferences:</span>
                  <span className="text-[#26232B]">{foodPreferences}</span>
                </div>
              )}
            </div>

            <div className="p-4 rounded-xl bg-[#F5F2F9] border border-[#8B7BB8]/30 flex items-center gap-3">
              <Sparkles className="w-5 h-5 text-[#8B7BB8] shrink-0" />
              <div className="text-xs text-[#665F6B] leading-relaxed">
                <span className="font-bold text-[#26232B] block">Automated AI Generation Ready</span>
                Planora AI will immediately calculate initial budget allocations, generate a tailored timeline, populate vendor checklists, and compile personalized creative concepts.
              </div>
            </div>
          </div>
        )}

        {/* Wizard Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-[#E5DBCB]">
          {step > 1 ? (
            <button
              type="button"
              onClick={handleBack}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl border border-[#E5DBCB] text-sm font-medium text-[#26232B] hover:bg-[#FAF6EF] transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          ) : (
            <div />
          )}

          {step < 4 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-6 py-2.5 rounded-xl bg-[#26232B] text-[#FAF6EF] text-sm font-medium hover:bg-[#3D3845] transition-colors flex items-center gap-1.5"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4 text-[#C9A96A]" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleCreateAndGenerate}
              disabled={loading}
              className="px-8 py-3 rounded-xl bg-[#26232B] text-[#FAF6EF] text-sm font-bold hover:bg-[#3D3845] transition-all shadow-md flex items-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-[#C9A96A]" />
                  <span>Synthesizing Planora Blueprint...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-[#C9A96A]" />
                  <span>Generate Event Plan</span>
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NewEventPage() {
  return (
    <Suspense fallback={<div className="p-12 text-center text-sm text-[#665F6B]">Loading wizard...</div>}>
      <WizardContent />
    </Suspense>
  );
}

