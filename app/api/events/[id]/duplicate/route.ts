import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { checkOrigin, originError, jsonError, jsonData } from '@/lib/api-helpers';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!checkOrigin(req)) return originError();

  const source = await prisma.event.findUnique({
    where: { id },
    include: {
      budgetCategories: true,
      tasks: true,
      checklistItems: true,
    },
  });

  if (!source) return jsonError('NOT_FOUND', 'Source event not found', 404);

  const duplicated = await prisma.$transaction(async (tx) => {
    // 1. Create duplicate event
    const newEvent = await tx.event.create({
      data: {
        name: `${source.name} (Copy)`,
        type: source.type,
        date: source.date,
        city: source.city,
        guestCount: source.guestCount,
        totalBudget: source.totalBudget,
        theme: source.theme,
        colors: source.colors,
        foodPreferences: source.foodPreferences,
        venuePreferences: source.venuePreferences,
        culturalPreferences: source.culturalPreferences,
        specialRequirements: source.specialRequirements,
      },
    });

    // 2. Copy budget allocations (no expenses copied)
    await tx.budgetCategory.createMany({
      data: source.budgetCategories.map(c => ({
        eventId: newEvent.id,
        name: c.name,
        allocated: c.allocated,
        estimated: c.estimated,
        locked: c.locked,
      })),
    });

    // 3. Copy tasks, reset to PENDING
    await tx.task.createMany({
      data: source.tasks.map(t => ({
        eventId: newEvent.id,
        title: t.title,
        description: t.description,
        dueDate: t.dueDate,
        startTime: t.startTime,
        offsetDays: t.offsetDays,
        priority: t.priority,
        status: 'PENDING',
        category: t.category,
        source: t.source,
        locked: t.locked,
      })),
    });

    // 4. Copy vendor checklist, reset done to false
    await tx.checklistItem.createMany({
      data: source.checklistItems.map(c => ({
        eventId: newEvent.id,
        vendorCategory: c.vendorCategory,
        text: c.text,
        done: false,
        source: c.source,
      })),
    });

    return newEvent;
  });

  return jsonData(duplicated, 201);
}

