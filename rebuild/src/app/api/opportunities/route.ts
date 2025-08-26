import { NextResponse } from 'next/server';
import { OpportunityStatus } from '@prisma/client';
import { opportunityCreateSchema } from '@/server/opportunities/schemas';
import { listOpportunities, createOpportunity } from '@/server/opportunities/service';
import { auth } from "@clerk/nextjs/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    const { userId } = auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });
  }
  try {
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? '10')));
    const status = (url.searchParams.get('status') as OpportunityStatus | null) ?? null;
    const contactId = url.searchParams.get('contactId');

    const { total, data } = await listOpportunities({ page, limit, status, contactId });

    return NextResponse.json({ data, page, limit, total });
  } catch (err) {
    console.error('GET /api/opportunities error:', err);
    return NextResponse.json({ error: 'Erro ao listar oportunidades' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    const { userId } = auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });
  }
  try {
    const json = await request.json().catch(() => ({}));
    const parsed = opportunityCreateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Payload inválido', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const created = await createOpportunity(parsed.data);

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (err) {
    console.error('POST /api/opportunities error:', err);
    return NextResponse.json({ error: 'Erro ao criar oportunidade' }, { status: 500 });
  }
}