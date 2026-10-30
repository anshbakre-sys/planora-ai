import { NextRequest } from 'next/server';
import { prisma } from '@/lib/db';
import { vendorSchema } from '@/lib/schemas';
import { checkOrigin, originError, jsonError, jsonData } from '@/lib/api-helpers';

type Params = { params: Promise<{ id: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!checkOrigin(req)) return originError();

  let body: unknown;
  try { body = await req.json(); }
  catch { return jsonError('BAD_REQUEST', 'Invalid JSON body', 400); }

  const parsed = vendorSchema.safeParse(body);
  if (!parsed.success) {
    return jsonError('VALIDATION_ERROR', parsed.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join('; '), 400);
  }

  const vendor = await prisma.vendor.create({
    data: {
      eventId: id,
      category: parsed.data.category,
      name: parsed.data.name,
      contactName: parsed.data.contactName,
      phone: parsed.data.phone,
      email: parsed.data.email,
      quote: parsed.data.quote,
      status: parsed.data.status,
      notes: parsed.data.notes,
    },
  });

  return jsonData(vendor, 201);
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!checkOrigin(req)) return originError();

  let body: { vendorId?: string } & Partial<import('@/lib/schemas').VendorInput>;
  try { body = await req.json(); }
  catch { return jsonError('BAD_REQUEST', 'Invalid JSON body', 400); }

  if (!body.vendorId) return jsonError('BAD_REQUEST', 'vendorId required', 400);

  const existing = await prisma.vendor.findFirst({
    where: { id: body.vendorId, eventId: id },
  });
  if (!existing) return jsonError('NOT_FOUND', 'Vendor not found', 404);

  const { vendorId: _, ...updateData } = body;
  const updated = await prisma.vendor.update({
    where: { id: body.vendorId },
    data: updateData,
  });

  return jsonData(updated);
}

export async function DELETE(req: NextRequest, { params }: Params) {
  const { id } = await params;
  if (!checkOrigin(req)) return originError();

  const { searchParams } = new URL(req.url);
  const vendorId = searchParams.get('vendorId');
  if (!vendorId) return jsonError('BAD_REQUEST', 'vendorId required', 400);

  const vendor = await prisma.vendor.findFirst({ where: { id: vendorId, eventId: id } });
  if (!vendor) return jsonError('NOT_FOUND', 'Vendor not found', 404);

  await prisma.vendor.delete({ where: { id: vendorId } });
  return jsonData({ success: true });
}

