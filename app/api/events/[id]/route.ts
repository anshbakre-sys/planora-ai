import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { updateEventSchema, taskSchema, vendorSchema, expenseSchema, checklistItemSchema, ideaSchema } from '@/lib/schemas';
import { checkOrigin, originError, jsonError, jsonData, checkAiRateLimit } from '@/lib/api-helpers';
import { computeAllocations, reallocate, isAllocationConflict } from '@/lib/planning/budget';
import { getProvider } from '@/lib/ai';
import { computeDueDates } from '@/lib/planning/timeline';
import { today } from '@/lib/date';
import type { EventType } from '@/lib/constants';

type Params = { params: Promise<{ id: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    include: {
      budgetCategories: { include: { expenses: true } },
      tasks: { orderBy: { dueDate: 'asc' } },
      vendors: true,
      checklistItems: true,
      aiPlans: { orderBy: { generatedAt: 'desc' }, take: 1 },
      savedIdeas: true,
    },
  });
  if (!event) return jsonError('NOT_FOUND', 'Event not found', 404);
  return jsonData(event);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!checkOrigin(req)) return originError();

  let body: Record<string, unknown>;
  try {
    const raw = await req.json();
    if (!raw || typeof raw !== 'object') return jsonError('BAD_REQUEST', 'Body must be an object', 400);
    body = raw as Record<string, unknown>;
  } catch {
    return jsonError('BAD_REQUEST', 'Invalid JSON body', 400);
  }

  const parsed = updateEventSchema.safeParse({ ...body, id });
  if (!parsed.success) {
    return jsonError('VALIDATION_ERROR', parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; '), 400);
  }

  const { id: _, ...data } = parsed.data;
  const existing = await prisma.event.findUnique({ where: { id }, include: { budgetCategories: true } });
  if (!existing) return jsonError('NOT_FOUND', 'Event not found', 404);

  // If budget changed, reallocate
  if (data.totalBudget && data.totalBudget !== existing.totalBudget) {
    const cats = existing.budgetCategories.map(c => ({
      name: c.name as import('@/lib/constants').BudgetCategoryName,
      allocated: c.allocated,
      estimated: c.estimated,
      locked: c.locked,
    }));
    const result = reallocate(cats, data.totalBudget, existing.type as EventType);
    if (isAllocationConflict(result)) {
      return jsonError('CONFLICT', `Budget conflict: ${result.type}. Locked total ₹${result.lockedTotal} vs budget ₹${result.totalBudget}`, 409);
    }
    await prisma.$transaction(async (tx) => {
      await tx.event.update({ where: { id }, data });
      for (const cat of result) {
        await tx.budgetCategory.updateMany({
          where: { eventId: id, name: cat.name },
          data: { allocated: cat.allocated },
        });
      }
    });
  } else {
    await prisma.event.update({ where: { id }, data });
  }

  return jsonData({ success: true });
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!checkOrigin(req)) return originError();
  await prisma.event.delete({ where: { id } });
  return jsonData({ success: true });
}

