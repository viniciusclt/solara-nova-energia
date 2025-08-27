import { NextResponse, NextRequest } from 'next/server'
import { opportunityUpdateSchema } from '@/server/opportunities/schemas';
import { getOpportunityById, updateOpportunity, deleteOpportunity } from '@/server/opportunities/service';
import { auth } from "@clerk/nextjs/server";

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const opportunity = await getOpportunityById(id);
    if (!opportunity) return NextResponse.json({ error: 'Oportunidade não encontrada' }, { status: 404 });
    return NextResponse.json({ data: opportunity });
  } catch (err) {
    console.error('GET /api/opportunities/[id] error:', err);
    return NextResponse.json({ error: 'Erro ao buscar oportunidade' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });
  }
  try {
    const { id } = await context.params;
    const json = await request.json().catch(() => ({}));
    const parsed = opportunityUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Payload inválido', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await updateOpportunity(id, parsed.data);
    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error('PATCH /api/opportunities/[id] error:', err);
    return NextResponse.json({ error: 'Erro ao atualizar oportunidade' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    const { userId } = await auth();
    if (!userId) return new Response("Unauthorized", { status: 401 });
  }
  try {
    const { id } = await context.params;
    await deleteOpportunity(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/opportunities/[id] error:', err);
    return NextResponse.json({ error: 'Erro ao remover oportunidade' }, { status: 500 });
  }
}