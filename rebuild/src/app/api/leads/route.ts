import { NextResponse } from 'next/server';
import { LeadStatus } from '@prisma/client';
import { leadCreateSchema } from '@/server/leads/schemas';
import { listLeads, createLead } from '@/server/leads/service';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? '10')));
    const status = (url.searchParams.get('status') as LeadStatus | null) ?? null;

    const { total, data } = await listLeads({ page, limit, status });

    return NextResponse.json({ data, page, limit, total });
  } catch (err) {
    console.error('GET /api/leads error:', err);
    return NextResponse.json({ error: 'Erro ao listar leads' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json().catch(() => ({}));
    const parsed = leadCreateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Payload inválido', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const created = await createLead(parsed.data);

    return NextResponse.json({ data: created }, { status: 201 });
  } catch (err) {
    console.error('POST /api/leads error:', err);
    return NextResponse.json({ error: 'Erro ao criar lead' }, { status: 500 });
  }
}