# Planora AI

> **Tagline:** Plan Beautifully. Celebrate Effortlessly.  
> **Competition Track:** Prompt War 5 — Full-Stack GenAI Application Submission  
> **Development Environment:** Google Antigravity

---

## 1. Problem Statement

Organizing events—whether weddings, milestone birthdays, or community initiatives—is notoriously stressful, fragmented, and vulnerable to financial budget drift. Traditional planning software offers generic task lists without event-specific nuance, lacks rigorous mathematical budget allocation with locked categories, and provides no honest offline demo fallback when AI keys are unavailable.

**Planora AI** solves this by providing a unified, privacy-first, local-first event planning operating system. It combines a pure deterministic financial and scheduling engine with flexible GenAI personalization powered by Google Gemini 2.0 (with a full-featured deterministic demo mode when no API key is supplied).

### Supported Event Types
1. **Wedding:** Ceremony flow, rehearsal timelines, multi-vendor coordination across 4 essential categories (Venue, Caterer, Decorator, Photographer), and hospitality tracking.
2. **Birthday:** Theme-driven entertainment, cake ordering milestones, party games, return gifts, allergen checks, and child/age safety safeguards.
3. **Community Event:** Municipal permit reminders, volunteer recruitment, crowd and fire safety protocols, sponsor coordination, and accessibility compliance.

---

## 2. Product Overview

Planora AI provides:
- **Interactive 4-Step Event Wizard:** Guided basics, scale, custom preferences, and instant blueprint synthesis.
- **Pure Deterministic Planning Engine:** Zero financial drift, integer-rupee arithmetic, and locked category allocations.
- **Budget Rescue Engine (Tier 2):** Deterministic priority-ordered estimate reductions capped at 30% per category to resolve overruns.
- **What-If Scenario Simulator (Tier 2):** Non-mutating live preview of guest, budget, date, and theme changes before committing.
- **Dynamic Adaptive Timeline:** Milestones automatically compressed for short-notice events (≤14 days) and actionable day-of schedules.
- **Objective Readiness Score (0–100):** Real-time weighted formula combining Task Completion (40%), Deadline Health (20%), Vendor Readiness (25%), and Budget Health (15%).
- **Vendor Directory & Quote Comparison:** Lowest quote highlighted per category, contract checklists, and booking status tracking.
- **Ideas Studio:** Star favorites, category filters, and user custom idea entry.
- **Data Safety on Regeneration:** Unlocked AI elements are updated while custom user records, locked tasks, and favorites are strictly preserved.
- **Persistent Local Database:** Backed by SQLite and Prisma ORM with cascading deletions.

---

## 3. Requirement Mapping Table

| Problem Requirement | Implementation | Source Files |
|---|---|---|
| **Wedding Planning** | 4 essential vendors, ceremony timeline, decorator mood boards, rehearsal tasks | `lib/constants/event-types.ts`, `lib/ai/demo.ts`, `app/events/new/page.tsx` |
| **Birthday Planning** | Age-appropriate activities, cake milestones, party favors, allergen checks | `lib/constants/event-types.ts`, `lib/ai/demo.ts`, `components/event/TimelineTab.tsx` |
| **Community Planning** | Municipal permits reminder, volunteer coordination, crowd/fire safety, accessibility | `lib/constants/event-types.ts`, `lib/ai/demo.ts`, `components/event/VendorsTab.tsx` |
| **Budget Management** | Integer rupee math, locked category allocations, live variance tracking, expenses | `lib/planning/budget.ts`, `app/api/events/[id]/categories/route.ts`, `components/event/BudgetTab.tsx` |
| **Budget Rescue (Tier 2)** | Priority reductions (Decor → Entertainment → Photo → etc.) capped at 30% | `lib/planning/rescue.ts`, `components/event/BudgetTab.tsx` |
| **What-If Simulator** | Pure non-mutating simulation of guests, budget, date, and theme | `lib/planning/what-if.ts`, `components/event/WhatIfModal.tsx` |
| **Timeline Management** | Chronological tasks, status filters, short-notice compression, day-of schedule | `lib/planning/timeline.ts`, `components/event/TimelineTab.tsx` |
| **Vendor Checklists** | Contract safeguards, verification checklists, vendor comparison | `components/event/VendorsTab.tsx`, `app/api/events/[id]/checklist/route.ts` |
| **Personalized Ideas** | 10 creative categories, theme tailoring, favorites persistence | `components/event/PlanIdeasTab.tsx`, `app/api/events/[id]/ideas/route.ts` |
| **Readiness Score** | Deterministic 0–100 score weighted across 4 health pillars | `lib/planning/readiness.ts`, `components/event/OverviewTab.tsx` |
| **Gemini Integration** | Official `@google/genai` SDK with 30s timeout, retry, rate limit, and input validation | `lib/ai/gemini.ts`, `lib/ai/provider.ts`, `app/api/ai/generate/route.ts` |
| **Demo Mode** | Event-type-specific deterministic templates adapting to budget and guest count | `lib/ai/demo.ts`, `lib/ai/index.ts` |
| **Data Persistence** | SQLite via Prisma 6 with cascade deletes and atomic transactions | `prisma/schema.prisma`, `lib/db/prisma.ts`, `app/api/events/route.ts` |
| **Sample Wedding (Tier 2)** | Fictional Indore royal wedding with ~₹85,000 overrun ready for Budget Rescue | `app/api/sample-wedding/route.ts`, `app/page.tsx` |

---

## 4. Architecture

Planora AI follows Clean Architecture principles:
```text
planora-ai/
├── app/
│   ├── page.tsx                    # Landing page & sample wedding CTA
│   ├── layout.tsx                  # Root navigation & footer
│   ├── globals.css                 # Brand colors & accessibility tokens
│   ├── events/
│   │   ├── page.tsx                # Saved events list & duplicate/delete
│   │   ├── new/page.tsx            # 4-step event creation wizard
│   │   └── [id]/page.tsx           # Event workspace container
│   └── api/
│       ├── events/                 # CRUD, duplicate, categories
│       ├── ai/generate/            # Gemini / Demo generation
│       └── sample-wedding/         # Tier 2 fictional sample generator
├── components/
│   ├── ui/                         # shadcn/ui components (buttons, badges, etc.)
│   └── event/
│       ├── OverviewTab.tsx         # Readiness breakdown & next deadlines
│       ├── PlanIdeasTab.tsx        # Blueprint narrative & Ideas Studio
│       ├── BudgetTab.tsx           # Allocations, locks, expenses & Budget Rescue
│       ├── TimelineTab.tsx         # Chronological milestones & run of show
│       ├── VendorsTab.tsx          # Supplier directory & contract checklists
│       ├── WhatIfModal.tsx         # Non-mutating scenario simulator
│       └── RegenerateModal.tsx     # Data safety confirmation
├── lib/
│   ├── ai/
│   │   ├── provider.ts             # Shared PlanProvider interface
│   │   ├── demo.ts                 # Deterministic templates (no API key needed)
│   │   └── gemini.ts               # Google Gemini 2.0 official SDK implementation
│   ├── planning/
│   │   ├── budget.ts               # Pure rupee math & locked reallocation
│   │   ├── rescue.ts               # Deterministic Budget Rescue algorithm
│   │   ├── what-if.ts              # Pure simulation function
│   │   ├── timeline.ts             # Date calculation & short-notice compression
│   │   ├── readiness.ts            # Deterministic 0-100 scoring
│   │   └── feasibility.ts          # Budget-per-guest floor heuristics
│   ├── schemas/                    # Zod schemas shared across API and client
│   ├── constants/                  # Budget weights, categories, thresholds
│   ├── date.ts                     # Single testable today() in Asia/Kolkata
│   └── api-helpers.ts              # Origin check, rate limiting, error responses
├── prisma/
│   ├── schema.prisma               # 8 relational models with foreign keys & cascades
│   └── migrations/                 # SQLite migration history
├── tests/
│   └── planning.test.ts            # 18 comprehensive Vitest unit tests
├── .env.example                    # Environment template
├── package.json
└── vitest.config.ts
```

---

## 5. Technology Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript 5 (Strict Mode enabled)
- **Styling:** Tailwind CSS v4 & custom design tokens
- **Component Primitives:** shadcn/ui + Lucide React
- **ORM & Database:** Prisma 6 with local SQLite
- **Validation:** Zod 4
- **GenAI Provider:** Official `@google/genai` SDK + deterministic demo templates
- **Testing:** Vitest 5

---

## 6. Installation & Reproducibility

### Windows (PowerShell)
```powershell
# 1. Clone repository and navigate
cd "planora-ai"

# 2. Copy environment template
Copy-Item .env.example .env

# 3. Install dependencies
npm ci --legacy-peer-deps

# 4. Initialize database migrations and client
npm run setup

# 5. Start development server
npm run dev
```

### macOS / Linux (Bash)
```bash
# 1. Clone repository and navigate
cd planora-ai

# 2. Copy environment template
cp .env.example .env

# 3. Install dependencies
npm ci --legacy-peer-deps

# 4. Initialize database migrations and client
npm run setup

# 5. Start development server
npm run dev
```

The application will be live at `http://localhost:3000`.

---

## 7. Environment Variables

Configure in `.env`:
```ini
# SQLite persistent database URL
DATABASE_URL="file:./prisma/planora.db"

# Optional: Google Gemini API key (omit for honest deterministic Demo Mode)
GEMINI_API_KEY=""

# Optional: Configurable Gemini Model ID
GEMINI_MODEL="gemini-2.0-flash"

# Trusted application origin for CSRF & mutation protection
APP_ORIGIN="http://localhost:3000"
```

---

## 8. Database Setup

The database schema uses 8 structured relational tables with SQLite:
- `Event`: Core event metadata, scale, and custom preferences.
- `BudgetCategory`: Category allocations, estimated costs, and lock flags.
- `Expense`: Logged payments linked to categories.
- `Task`: Chronological milestones with priority, status, and AI offset days.
- `Vendor`: Supplier contacts, quotes, statuses, and notes.
- `ChecklistItem`: Contractual verification checklist items.
- `AiPlan`: Serialized validated AI plan content.
- `SavedIdea`: Creative suggestions with favorite bookmarking.

Running `npm run setup` automatically runs `prisma generate && prisma migrate deploy`.

---

## 9. Demo Mode vs. Gemini Integration

- **Honest Demo Mode (Default):** Works out of the box with zero external credentials or internet connection required. Generates event-specific plans adapted to guest counts, budgets, and themes. Clearly labeled as `Demo Planning — no AI key`.
- **Gemini Integration:** When `GEMINI_API_KEY` is present, uses `@google/genai` with model `gemini-2.0-flash`. Includes a 30-second timeout, automated retry on malformed JSON, server-side rate limiting (~10 req/min), and prompt injection resistance (user text treated strictly as data parameters). If Gemini encounters any quota or network failure, an explicit fallback to Demo Mode is offered.

---

## 10. Verification & Testing

Run all unit tests:
```bash
npm test
```
**Results:** 18 passing tests verifying:
1. Budget allocation totals and rounding remainder distribution
2. Locked allocation conflicts & budget mismatch detection
3. Budget Rescue priority reductions capped at 30% without touching contingency
4. What-If simulator guest-scaling and non-mutation guarantees
5. Timeline calculations and milestone dates
6. Same-day actionable tasks and short-notice compression (≤14 days)
7. Readiness Score (0–100) four-pillar weighted algorithm
8. Zod schema validation and feasibility floor warnings

Run TypeScript type check:
```bash
npm run typecheck
```

Run Production Build:
```bash
npm run build
```

---

## 11. Security Decisions

1. **Server-Side Credentials:** Gemini API keys are never exposed to client-side bundles.
2. **CSRF & Origin Validation:** All mutation endpoints (`POST`, `PATCH`, `DELETE`) validate the complete `Origin` header against `APP_ORIGIN`. Missing origins on browser mutations are rejected.
3. **Prompt Injection Resistance:** User-supplied names, cities, and preferences are passed as delimited data variables, never instructions.
4. **Parameterized SQL Queries:** Handled strictly via Prisma ORM to prevent SQL injection.
5. **No Dangerous HTML:** User and AI content is rendered using safe React text nodes without `dangerouslySetInnerHTML`.
6. **Input Boundary Validation:** All incoming payloads are validated via Zod schemas before touching business logic or the database.

---

## 12. Performance Decisions

1. **Pure Planning Functions:** Budget allocation, rescue cuts, timeline dates, and readiness scores are computed synchronously in pure TypeScript with zero database or network overhead.
2. **Deterministic Rounding:** Remainder integers are assigned directly to the largest category, eliminating floating-point drift.
3. **Selective Querying:** Prisma queries select only necessary relations and order chronologically on indexed foreign keys.
4. **Minimal Network Overhead:** Single-transaction mutations ensure atomic updates for multi-table writes.

---

## 13. Known Limitations

1. **Local Single-User Scope:** Planora AI is architected as a local desktop/laptop application utilizing local SQLite persistent storage. Multi-tenant isolation and cloud authentication are outside the scope of this hackathon build.
2. **Planning Heuristics:** Per-guest floor thresholds (₹1,500 for Weddings, ₹600 for Birthdays, ₹200 for Community Events) and budget weights are planning heuristics, not verified market quotations.

---

## 14. Three-Minute Demo Flow

- **0:00 – 0:30:** Open Landing Page. Review value proposition, 3 event cards, and architecture principles.
- **0:30 – 1:00:** Click "Explore Sample Wedding (Indore)". Watch the system synthesize a complete fictional wedding with ₹85,000 overrun.
- **1:00 – 1:30:** Explore Workspace:
  - **Overview:** Inspect Readiness Score breakdown (Tasks, Deadlines, Vendors, Budget) and upcoming deadlines.
  - **Plan & Ideas:** Review synthesized master blueprint narrative and star favorite ideas.
- **1:30 – 2:00:** Switch to **Budget Tab**:
  - Notice the ₹85,000 Overrun Alert.
  - Click "Launch Budget Rescue".
  - Inspect proposed 30% cuts on Decoration and Entertainment.
  - Click "Apply Rescue Reductions" and observe immediate budget equilibrium.
- **2:00 – 2:30:** Test **What-If Simulator**:
  - Open simulator, increase guest count from 250 to 350.
  - Observe instant live scaling of catering and transport estimates with zero mutation of saved data.
- **2:30 – 3:00:** Review **Timeline & Vendors**:
  - Check off a milestone; observe Readiness Score increment.
  - Inspect lowest vendor quote highlight in the Vendors tab.
  - Visit **Saved Events** to verify local SQLite persistence.
