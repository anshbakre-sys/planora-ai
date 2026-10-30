'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Sparkles,
  HeartHandshake,
  Cake,
  Users2,
  ArrowRight,
  ShieldCheck,
  Calculator,
  CalendarCheck,
  CheckCircle2,
  Coins,
  Loader2,
  Clock,
  Sparkle
} from 'lucide-react';

export default function LandingPage() {
  const router = useRouter();
  const [loadingSample, setLoadingSample] = useState(false);
  const [sampleError, setSampleError] = useState<string | null>(null);

  const handleCreateSampleWedding = async () => {
    try {
      setLoadingSample(true);
      setSampleError(null);
      const res = await fetch('/api/sample-wedding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error?.message || 'Failed to create sample wedding');
      }
      router.push(`/events/${json.data.id}`);
    } catch (err) {
      setSampleError(err instanceof Error ? err.message : 'Error creating sample');
      setLoadingSample(false);
    }
  };

  return (
    <div className="space-y-20 pb-12">
      {/* Hero Section */}
      <section className="text-center pt-8 pb-12 space-y-6 max-w-4xl mx-auto animate-slide-up">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#F3ECE0] border border-[#E5DBCB] text-xs font-semibold tracking-wide uppercase text-[#8B7BB8]">
          <Sparkle className="w-3.5 h-3.5 text-[#C9A96A]" />
          <span>Competition-Optimized GenAI Event Planning</span>
        </div>

        <h1 className="font-serif text-4xl sm:text-6xl font-extrabold text-[#26232B] tracking-tight leading-[1.15]">
          Plan Beautifully. <br />
          <span className="italic font-normal text-[#8B7BB8]">Celebrate Effortlessly.</span>
        </h1>

        <p className="text-lg sm:text-xl text-[#665F6B] max-w-2xl mx-auto leading-relaxed">
          The intelligent event planning companion that orchestrates budgets, dynamic timelines,
          vendor checklists, and tailored creative ideas for Weddings, Birthdays, and Community Events.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/events/new"
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#26232B] text-[#FAF6EF] font-medium text-base hover:bg-[#3D3845] transition-all shadow-md flex items-center justify-center gap-2 group btn-interactive"
          >
            <span>Plan My Event</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-[#C9A96A]" />
          </Link>

          <button
            onClick={handleCreateSampleWedding}
            disabled={loadingSample}
            className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#F3ECE0] border border-[#C9A96A]/50 text-[#26232B] font-medium text-base hover:bg-[#EAE1D1] transition-all flex items-center justify-center gap-2 btn-interactive"
          >
            {loadingSample ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-[#8B7BB8]" />
                <span>Generating Sample...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-[#C9A96A]" />
                <span>Explore Sample Wedding (Indore)</span>
              </>
            )}
          </button>
        </div>

        {sampleError && (
          <p className="text-sm text-[#E8735A] bg-[#FDEAE6] p-3 rounded-lg border border-[#F6C5BC] max-w-md mx-auto animate-fade-in">
            {sampleError}
          </p>
        )}
      </section>

      {/* 3 Supported Event Types Cards */}
      <section className="space-y-6">
        <div className="text-center space-y-2">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#26232B]">
            Three Tailored Event Experiences
          </h2>
          <p className="text-sm sm:text-base text-[#665F6B]">
            Each event type features distinct financial weights, essential vendor rules, and safety protocols.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Wedding */}
          <div className="bg-white rounded-2xl p-6 border border-[#E5DBCB] shadow-sm card-interactive flex flex-col justify-between space-y-4 animate-slide-up delay-100">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#F3ECE0] flex items-center justify-center text-[#8B7BB8]">
                <HeartHandshake className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#26232B]">Wedding</h3>
              <p className="text-sm text-[#665F6B] leading-relaxed">
                Ceremony flow, rehearsal schedules, multi-category vendor coordination (Venue, Caterer, Decorator, Photographer), and hospitality tracking.
              </p>
              <div className="pt-2 text-xs text-[#8B7BB8] font-semibold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span>4 Essential Vendor Categories</span>
              </div>
            </div>
            <Link
              href="/events/new?type=WEDDING"
              className="mt-4 w-full py-2.5 rounded-lg bg-[#FAF6EF] hover:bg-[#F3ECE0] border border-[#E5DBCB] text-center text-sm font-medium text-[#26232B] flex items-center justify-center gap-1 group btn-interactive"
            >
              <span>Plan Wedding</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-[#8B7BB8]" />
            </Link>
          </div>

          {/* Birthday */}
          <div className="bg-white rounded-2xl p-6 border border-[#E5DBCB] shadow-sm card-interactive flex flex-col justify-between space-y-4 animate-slide-up delay-200">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#F3ECE0] flex items-center justify-center text-[#E8735A]">
                <Cake className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#26232B]">Birthday</h3>
              <p className="text-sm text-[#665F6B] leading-relaxed">
                Theme-driven entertainment, cake ordering milestones, party games, return gifts, allergen checks, and child safety planning.
              </p>
              <div className="pt-2 text-xs text-[#E8735A] font-semibold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Age-Appropriate Safety & Activity Focus</span>
              </div>
            </div>
            <Link
              href="/events/new?type=BIRTHDAY"
              className="mt-4 w-full py-2.5 rounded-lg bg-[#FAF6EF] hover:bg-[#F3ECE0] border border-[#E5DBCB] text-center text-sm font-medium text-[#26232B] flex items-center justify-center gap-1 group btn-interactive"
            >
              <span>Plan Birthday</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-[#E8735A]" />
            </Link>
          </div>

          {/* Community Event */}
          <div className="bg-white rounded-2xl p-6 border border-[#E5DBCB] shadow-sm card-interactive flex flex-col justify-between space-y-4 animate-slide-up delay-300">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-xl bg-[#F3ECE0] flex items-center justify-center text-[#26232B]">
                <Users2 className="w-6 h-6" />
              </div>
              <h3 className="font-serif text-xl font-bold text-[#26232B]">Community Event</h3>
              <p className="text-sm text-[#665F6B] leading-relaxed">
                Municipal permits reminders, volunteer recruitment, crowd and fire safety protocols, sponsor coordination, and accessibility compliance.
              </p>
              <div className="pt-2 text-xs text-[#26232B] font-semibold flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" />
                <span>Permits, Accessibility & Safety Engine</span>
              </div>
            </div>
            <Link
              href="/events/new?type=COMMUNITY"
              className="mt-4 w-full py-2.5 rounded-lg bg-[#FAF6EF] hover:bg-[#F3ECE0] border border-[#E5DBCB] text-center text-sm font-medium text-[#26232B] flex items-center justify-center gap-1 group btn-interactive"
            >
              <span>Plan Community Event</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform text-[#26232B]" />
            </Link>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="bg-white rounded-3xl p-8 sm:p-12 border border-[#E5DBCB] shadow-sm space-y-8">
        <div className="text-center max-w-xl mx-auto space-y-2">
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#26232B]">
            How Planora AI Works
          </h2>
          <p className="text-sm text-[#665F6B]">
            From prompt to a fully structured, persistent event operating system in four simple steps.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="space-y-2 border-l-2 border-[#8B7BB8] pl-4">
            <span className="text-xs font-bold text-[#8B7BB8] tracking-widest uppercase">Step 01</span>
            <h4 className="font-bold text-[#26232B]">Input Event Details</h4>
            <p className="text-xs text-[#665F6B] leading-relaxed">
              Define your event type, guest scale, budget, and cultural or dietary requirements.
            </p>
          </div>

          <div className="space-y-2 border-l-2 border-[#C9A96A] pl-4">
            <span className="text-xs font-bold text-[#C9A96A] tracking-widest uppercase">Step 02</span>
            <h4 className="font-bold text-[#26232B]">Deterministic Engine</h4>
            <p className="text-xs text-[#665F6B] leading-relaxed">
              Pure mathematical allocation guarantees rupee-precise budgets without rounding errors.
            </p>
          </div>

          <div className="space-y-2 border-l-2 border-[#E8735A] pl-4">
            <span className="text-xs font-bold text-[#E8735A] tracking-widest uppercase">Step 03</span>
            <h4 className="font-bold text-[#26232B]">AI Generation</h4>
            <p className="text-xs text-[#665F6B] leading-relaxed">
              Gemini 2.0 or deterministic demo templates generate custom tasks, checklists, and creative ideas.
            </p>
          </div>

          <div className="space-y-2 border-l-2 border-[#26232B] pl-4">
            <span className="text-xs font-bold text-[#26232B] tracking-widest uppercase">Step 04</span>
            <h4 className="font-bold text-[#26232B]">Execute & Simulate</h4>
            <p className="text-xs text-[#665F6B] leading-relaxed">
              Track readiness (0-100), log actual expenses, simulate changes, and resolve overruns with Budget Rescue.
            </p>
          </div>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 rounded-2xl bg-[#F3ECE0] border border-[#E5DBCB] space-y-3">
          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-[#8B7BB8] shadow-xs">
            <Calculator className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-[#26232B]">Rupee-Accurate Budgeting</h3>
          <p className="text-sm text-[#665F6B] leading-relaxed">
            Locked allocations protect critical vendors while remainder arithmetic prevents financial drift.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#F3ECE0] border border-[#E5DBCB] space-y-3">
          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-[#E8735A] shadow-xs">
            <CalendarCheck className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-[#26232B]">Adaptive Timeline Engine</h3>
          <p className="text-sm text-[#665F6B] leading-relaxed">
            Automatically compresses milestones for short-notice events and highlights overdue tasks.
          </p>
        </div>

        <div className="p-6 rounded-2xl bg-[#F3ECE0] border border-[#E5DBCB] space-y-3">
          <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-[#26232B] shadow-xs">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="font-bold text-[#26232B]">Objective Readiness Score</h3>
          <p className="text-sm text-[#665F6B] leading-relaxed">
            Deterministic 0-100 metric calculated from task completion, deadline health, vendors, and budget.
          </p>
        </div>
      </section>
    </div>
  );
}
