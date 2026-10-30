import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { taskSchema } from '@/lib/schemas';
import { checkOrigin, originError, jsonError, jsonData } from '@/lib/api-helpers';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!checkOrigin(req)) return originError();

  let body: unknown;
  try { body = await req.json(); }
  catch { return jsonError('BAD_REQUEST', 'Invalid JSON body', 400); }

  const parsed = taskSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('VALIDATION_ERROR', parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; '), 400);
  }

  const task = await prisma.task.create({
    data: {
      eventId: id,
      title: parsed.data.title,
      description: parsed.data.description,
      dueDate: parsed.data.dueDate,
      startTime: parsed.data.startTime,
      priority: parsed.data.priority,
      status: parsed.data.status,
      category: parsed.data.category,
      source: 'USER',
      locked: false,
    },
  });

  return jsonData(task, 201);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!checkOrigin(req)) return originError();

  let body: { taskId?: string; status?: string; title?: string; description?: string; dueDate?: string; priority?: string; startTime?: string; locked?: boolean };
  try { body = await req.json(); }
  catch { return jsonError('BAD_REQUEST', 'Invalid JSON body', 400); }

  if (!body.taskId) return jsonError('BAD_REQUEST', 'taskId required', 400);

  const existing = await prisma.task.findFirst({
    where: { id: body.taskId, eventId: id },
  });
  if (!existing) return jsonError('NOT_FOUND', 'Task not found', 404);

  // If user modifies an AI task, mark it locked so regeneration won't delete it
  const updateData: Record<string, unknown> = {};
  if (body.status !== undefined) updateData.status = body.status;
  if (body.title !== undefined) updateData.title = body.title;
  if (body.description !== undefined) updateData.description = body.description;
  if (body.dueDate !== undefined) updateData.dueDate = body.dueDate;
  if (body.priority !== undefined) updateData.priority = body.priority;
  if (body.startTime !== undefined) updateData.startTime = body.startTime;
  if (body.locked !== undefined) updateData.locked = body.locked;

  if (existing.source === 'AI' && (body.title || body.dueDate || body.priority || body.description)) {
    updateData.locked = true;
  }

  const updated = await prisma.task.update({
    where: { id: body.taskId },
    data: updateData,
  });

  return jsonData(updated);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!checkOrigin(req)) return originError();

  const { searchParams } = new URL(req.url);
  const taskId = searchParams.get('taskId');
  if (!taskId) return jsonError('BAD_REQUEST', 'taskId required', 400);

  const task = await prisma.task.findFirst({ where: { id: taskId, eventId: id } });
  if (!task) return jsonError('NOT_FOUND', 'Task not found', 404);

  await prisma.task.delete({ where: { id: taskId } });
  return jsonData({ success: true });
}

