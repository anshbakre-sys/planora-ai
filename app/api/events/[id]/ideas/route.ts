import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { ideaSchema } from '@/lib/schemas';
import { checkOrigin, originError, jsonError, jsonData } from '@/lib/api-helpers';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!checkOrigin(req)) return originError();

  let body: unknown;
  try { body = await req.json(); }
  catch { return jsonError('BAD_REQUEST', 'Invalid JSON body', 400); }

  const parsed = ideaSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('VALIDATION_ERROR', parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; '), 400);
  }

  const idea = await prisma.savedIdea.create({
    data: {
      eventId: id,
      category: parsed.data.category,
      text: parsed.data.text,
      favorite: false,
      source: 'USER',
    },
  });

  return jsonData(idea, 201);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!checkOrigin(req)) return originError();

  let body: { ideaId?: string; favorite?: boolean; text?: string };
  try { body = await req.json(); }
  catch { return jsonError('BAD_REQUEST', 'Invalid JSON body', 400); }

  if (!body.ideaId) return jsonError('BAD_REQUEST', 'ideaId required', 400);

  const existing = await prisma.savedIdea.findFirst({
    where: { id: body.ideaId, eventId: id },
  });
  if (!existing) return jsonError('NOT_FOUND', 'Idea not found', 404);

  const updated = await prisma.savedIdea.update({
    where: { id: body.ideaId },
    data: {
      ...(body.favorite !== undefined && { favorite: body.favorite }),
      ...(body.text !== undefined && { text: body.text }),
    },
  });

  return jsonData(updated);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!checkOrigin(req)) return originError();

  const { searchParams } = new URL(req.url);
  const ideaId = searchParams.get('ideaId');
  if (!ideaId) return jsonError('BAD_REQUEST', 'ideaId required', 400);

  const idea = await prisma.savedIdea.findFirst({ where: { id: ideaId, eventId: id } });
  if (!idea) return jsonError('NOT_FOUND', 'Idea not found', 404);

  await prisma.savedIdea.delete({ where: { id: ideaId } });
  return jsonData({ success: true });
}

