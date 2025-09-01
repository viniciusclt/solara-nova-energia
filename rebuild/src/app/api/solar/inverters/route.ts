import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { z } from 'zod';
import { inverterCreateSchema, inverterUpdateSchema } from '@/server/solar/inverters/schemas';
import { listInverters, createInverter, updateInverter, deleteInverter, getInverterById } from '@/server/solar/inverters/service';

export const dynamic = 'force-dynamic';

const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().optional(),
});

export async function GET(request: Request) {
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });
  }
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (id) {
    const data = await getInverterById(id);
    if (!data) return NextResponse.json({ error: 'Não encontrado' }, { status: 404 });
    return NextResponse.json(data);
  }
  const { searchParams } = new URL(request.url);
  const parsed = listQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) return NextResponse.json({ error: 'Parâmetros inválidos', details: parsed.error.flatten() }, { status: 400 });
  const { page, limit, q } = parsed.data;
  const result = await listInverters({ page, limit, q });
  return NextResponse.json(result);
}

export async function POST(request: Request) {
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const parsed = inverterCreateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Payload inválido', details: parsed.error.flatten() }, { status: 400 });
  const data = await createInverter(parsed.data);
  return NextResponse.json(data, { status: 201 });
}

export async function PUT(request: Request) {
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });
  }
  const body = await request.json().catch(() => ({}));
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Informe id via query string' }, { status: 400 });
  const parsed = inverterUpdateSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: 'Payload inválido', details: parsed.error.flatten() }, { status: 400 });
  const data = await updateInverter(id, parsed.data);
  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });
  }
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Informe id via query string' }, { status: 400 });
  await deleteInverter(id);
  return NextResponse.json({ ok: true });
}