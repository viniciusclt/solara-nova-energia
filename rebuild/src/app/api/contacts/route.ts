import { NextResponse } from 'next/server';
import { LeadStatus } from '@prisma/client';
import { contactCreateSchema } from '@/server/contacts/schemas';
import { listContacts, createContact } from '@/server/contacts/service';
import { auth } from "@clerk/nextjs/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  // Se Clerk estiver habilitado, exigir usuário autenticado
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });
  }
  try {
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? '10')));
    const status = (url.searchParams.get('status') as LeadStatus | null) ?? null;
    const q = url.searchParams.get('q');

    const { total, data } = await listContacts({ page, limit, status, q });

    return NextResponse.json({ data, page, limit, total });
  } catch (err) {
    console.error('GET /api/contacts error:', err);
    return NextResponse.json({ error: 'Erro ao listar contatos' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });
  }
  try {
    const json = await request.json().catch(() => ({}));
    const parsed = contactCreateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Payload inválido', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const created = await createContact(parsed.data);

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (err) {
    console.error('POST /api/contacts error:', err);
    return NextResponse.json({ error: 'Erro ao criar contato' }, { status: 500 });
  }
}