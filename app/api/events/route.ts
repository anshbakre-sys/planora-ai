import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { createEventSchema } from '@/lib/schemas';
import { checkOrigin, originError, jsonError, jsonData } from '@/lib/api-helpers';
import { computeAllocations } from '@/lib/planning/budget';
import type { EventType } from '@/lib/constants';

export async function GET() {
  const events = await prisma.event.findMany({
    orderBy: { updatedAt: 'desc' },
    select: {
      id: true, name: true, type: true, date: true, city: true,
      guestCount: true, totalBudget: true, createdAt: true, updatedAt: true,
    },
  });
  return jsonData(events);
}

export async function POST(req: NextRequest) {
  if (!checkOrigin(req)) return originError();

  let body: unknown;
  try { body = await req.json(); }
  catch { return jsonError('BAD_REQUEST', 'Invalid JSON body', 400); }

  const parsed = createEventSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('VALIDATION_ERROR', parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; '), 400);
  }

  const input = parsed.data;
  const allocations = computeAllocations(input.totalBudget, input.type as EventType);

  const event = await prisma.$transaction(async (tx) => {
    const evt = await tx.event.create({ data: input });
    await tx.budgetCategory.createMany({
      data: allocations.map(a => ({
        eventId: evt.id,
        name: a.name,
        allocated: a.allocated,
        estimated: a.estimated,
        locked: false,
      })),
    });
    return evt;
  });

  return jsonData(event, 201);
}

