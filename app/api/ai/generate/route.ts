import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { checkOrigin, originError, jsonError, jsonData, checkAiRateLimit } from '@/lib/api-helpers';
import { getProvider } from '@/lib/ai';
import { computeDueDates } from '@/lib/planning/timeline';
import { today } from '@/lib/date';
import type { EventType } from '@/lib/constants';
import { aiPlanContentSchema } from '@/lib/schemas';

export async function POST(req: NextRequest) {
  if (!checkOrigin(req)) return originError();
  if (!checkAiRateLimit()) return jsonError('RATE_LIMITED', 'Too many AI requests. Please wait a moment.', 429);

  let body: { eventId: string; useDemoFallback?: boolean };
  try { body = await req.json(); }
  catch { return jsonError('BAD_REQUEST', 'Invalid JSON body', 400); }

  if (!body.eventId) return jsonError('BAD_REQUEST', 'eventId required', 400);

  const event = await prisma.event.findUnique({ where: { id: body.eventId } });
  if (!event) return jsonError('NOT_FOUND', 'Event not found', 404);

  const provider = body.useDemoFallback
    ? new (await import('@/lib/ai/demo')).DemoPlanProvider()
    : (await import('@/lib/ai')).getProvider();

  try {
    const plan = await provider.generatePlan({
      name: event.name,
      type: event.type as EventType,
      date: event.date,
      city: event.city,
      guestCount: event.guestCount,
      totalBudget: event.totalBudget,
      theme: event.theme,
      colors: event.colors,
      foodPreferences: event.foodPreferences,
      venuePreferences: event.venuePreferences,
      culturalPreferences: event.culturalPreferences,
      specialRequirements: event.specialRequirements,
    });

    // Compute due dates for tasks
    const dueDates = computeDueDates(
      plan.tasks.map((t, i) => ({ id: String(i), offsetDays: t.offsetDays })),
      event.date,
    );

    // Store plan and create records in transaction
    await prisma.$transaction(async (tx) => {
      // Save AI plan
      await tx.aiPlan.create({
        data: {
          eventId: event.id,
          provider: provider.name,
          model: provider.model,
          content: JSON.stringify(plan),
        },
      });

      // Delete existing AI-generated, non-locked tasks
      await tx.task.deleteMany({
        where: { eventId: event.id, source: 'AI', locked: false },
      });

      // Create tasks
      for (let i = 0; i < plan.tasks.length; i++) {
        const t = plan.tasks[i];
        const dd = dueDates.find(d => d.taskId === String(i));
        await tx.task.create({
          data: {
            eventId: event.id,
            title: t.title,
            description: t.description,
            dueDate: dd?.computedDueDate || event.date,
            offsetDays: t.offsetDays,
            priority: t.priority,
            category: t.category,
            source: 'AI',
          },
        });
      }

      // Replace non-done AI checklist items
      await tx.checklistItem.deleteMany({
        where: { eventId: event.id, source: 'AI', done: false },
      });
      for (const c of plan.checklist) {
        await tx.checklistItem.create({
          data: { eventId: event.id, vendorCategory: c.vendorCategory, text: c.text, source: 'AI' },
        });
      }

      // Add new ideas (don't delete favorites)
      await tx.savedIdea.deleteMany({
        where: { eventId: event.id, source: 'AI', favorite: false },
      });
      for (const idea of plan.ideas) {
        await tx.savedIdea.create({
          data: { eventId: event.id, category: idea.category, text: idea.text, source: 'AI' },
        });
      }
    });

    return jsonData({ provider: provider.name, model: provider.model, plan });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'AI generation failed';
    return jsonError('AI_ERROR', message, 500);
  }
}

