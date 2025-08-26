import { NextResponse } from 'next/server';
import { leadUpdateSchema } from '@/server/leads/schemas';
import { getLeadById, updateLead, deleteLead } from '@/server/leads/service';
import { auth } from "@clerk/nextjs/server";

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const lead = await getLeadById(params.id);
    if (!lead) return NextResponse.json({ error: 'Contato não encontrado' }, { status: 404 });
    return NextResponse.json({ data: lead });
  } catch (err) {
    console.error('GET /api/leads/[id] error:', err);
    return NextResponse.json({ error: 'Erro ao buscar contato' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    const { userId } = auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });
  }
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
    return NextResponse.json({ error: 'Erro ao atualizar contato' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    const { userId } = auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });
  }
  try {
    await deleteLead(params.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/leads/[id] error:', err);
    return NextResponse.json({ error: 'Erro ao remover contato' }, { status: 500 });
  }
}