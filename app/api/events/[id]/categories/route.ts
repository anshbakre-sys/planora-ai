import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { checkOrigin, originError, jsonError, jsonData } from '@/lib/api-helpers';

type Params = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!checkOrigin(req)) return originError();

  let body: {
    categoryId?: string;
    locked?: boolean;
    allocated?: number;
    estimated?: number;
    batchUpdates?: Array<{ categoryId: string; estimated?: number; allocated?: number; locked?: boolean }>;
  };
  try { body = await req.json(); }
  catch { return jsonError('BAD_REQUEST', 'Invalid JSON body', 400); }

  // Support batch updates (e.g. Budget Rescue applying cuts across multiple categories)
  if (body.batchUpdates && Array.isArray(body.batchUpdates)) {
    await prisma.$transaction(async (tx) => {
      for (const update of body.batchUpdates!) {
        await tx.budgetCategory.updateMany({
          where: { id: update.categoryId, eventId: id },
          data: {
            ...(update.estimated !== undefined && { estimated: update.estimated }),
            ...(update.allocated !== undefined && { allocated: update.allocated }),
            ...(update.locked !== undefined && { locked: update.locked }),
          },
        });
      }
    });
    return jsonData({ success: true });
  }

  if (!body.categoryId) return jsonError('BAD_REQUEST', 'categoryId required', 400);

  const existing = await prisma.budgetCategory.findFirst({
    where: { id: body.categoryId, eventId: id },
  });
  if (!existing) return jsonError('NOT_FOUND', 'Category not found', 404);

  const updated = await prisma.budgetCategory.update({
    where: { id: body.categoryId },
    data: {
      ...(body.locked !== undefined && { locked: body.locked }),
      ...(body.allocated !== undefined && { allocated: body.allocated }),
      ...(body.estimated !== undefined && { estimated: body.estimated }),
    },
  });

  return jsonData(updated);
}

