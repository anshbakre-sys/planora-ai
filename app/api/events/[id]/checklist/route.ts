import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { checklistItemSchema } from '@/lib/schemas';
import { checkOrigin, originError, jsonError, jsonData } from '@/lib/api-helpers';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!checkOrigin(req)) return originError();

  let body: unknown;
  try { body = await req.json(); }
  catch { return jsonError('BAD_REQUEST', 'Invalid JSON body', 400); }

  const parsed = checklistItemSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('VALIDATION_ERROR', parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; '), 400);
  }

  const item = await prisma.checklistItem.create({
    data: {
      eventId: id,
      vendorCategory: parsed.data.vendorCategory,
      text: parsed.data.text,
      source: 'USER',
      done: false,
    },
  });

  return jsonData(item, 201);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!checkOrigin(req)) return originError();

  let body: { itemId?: string; done?: boolean; text?: string };
  try { body = await req.json(); }
  catch { return jsonError('BAD_REQUEST', 'Invalid JSON body', 400); }

  if (!body.itemId) return jsonError('BAD_REQUEST', 'itemId required', 400);

  const existing = await prisma.checklistItem.findFirst({
    where: { id: body.itemId, eventId: id },
  });
  if (!existing) return jsonError('NOT_FOUND', 'Item not found', 404);

  const updated = await prisma.checklistItem.update({
    where: { id: body.itemId },
    data: {
      ...(body.done !== undefined && { done: body.done }),
      ...(body.text !== undefined && { text: body.text }),
    },
  });

  return jsonData(updated);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!checkOrigin(req)) return originError();

  const { searchParams } = new URL(req.url);
  const itemId = searchParams.get('itemId');
  if (!itemId) return jsonError('BAD_REQUEST', 'itemId required', 400);

  const item = await prisma.checklistItem.findFirst({ where: { id: itemId, eventId: id } });
  if (!item) return jsonError('NOT_FOUND', 'Item not found', 404);

  await prisma.checklistItem.delete({ where: { id: itemId } });
  return jsonData({ success: true });
}

