import { NextResponse } from 'next/server';
import { leadUpdateSchema } from '@/server/leads/schemas';
import { getLeadById, updateLead, deleteLead } from '@/server/leads/service';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const lead = await getLeadById(params.id);
    if (!lead) return NextResponse.json({ error: 'Lead não encontrado' }, { status: 404 });
    return NextResponse.json({ data: lead });
  } catch (err) {
    console.error('GET /api/leads/[id] error:', err);
    return NextResponse.json({ error: 'Erro ao buscar lead' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const json = await request.json().catch(() => ({}));
    const parsed = leadUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Payload inválido', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await updateLead(params.id, parsed.data);
    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error('PATCH /api/leads/[id] error:', err);
    return NextResponse.json({ error: 'Erro ao atualizar lead' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await deleteLead(params.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/leads/[id] error:', err);
    return NextResponse.json({ error: 'Erro ao remover lead' }, { status: 500 });
  }
}