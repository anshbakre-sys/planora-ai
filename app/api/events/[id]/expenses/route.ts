import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { expenseSchema } from '@/lib/schemas';
import { checkOrigin, originError, jsonError, jsonData } from '@/lib/api-helpers';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!checkOrigin(req)) return originError();

  let body: unknown;
  try { body = await req.json(); }
  catch { return jsonError('BAD_REQUEST', 'Invalid JSON body', 400); }

  const parsed = expenseSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('VALIDATION_ERROR', parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; '), 400);
  }

  const { categoryId } = body as { categoryId: string };
  if (!categoryId) return jsonError('BAD_REQUEST', 'categoryId required', 400);

  const category = await prisma.budgetCategory.findFirst({
    where: { id: categoryId, eventId: id },
  });
  if (!category) return jsonError('NOT_FOUND', 'Category not found for this event', 404);

  const expense = await prisma.expense.create({
    data: {
      categoryId,
      description: parsed.data.description,
      amount: parsed.data.amount,
      paidOn: parsed.data.paidOn,
    },
  });

  return jsonData(expense, 201);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!checkOrigin(req)) return originError();

  const { searchParams } = new URL(req.url);
  const expenseId = searchParams.get('expenseId');
  if (!expenseId) return jsonError('BAD_REQUEST', 'expenseId required', 400);

  const expense = await prisma.expense.findUnique({
    where: { id: expenseId },
    include: { category: true },
  });
  if (!expense || expense.category.eventId !== id) {
    return jsonError('NOT_FOUND', 'Expense not found', 404);
  }

  await prisma.expense.delete({ where: { id: expenseId } });
  return jsonData({ success: true });
}

