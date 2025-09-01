import { NextResponse, NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { proposalUpdateSchema } from '@/server/proposals/schemas';
import { getProposalById, updateProposal, deleteProposal } from '@/server/proposals/service';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const proposal = await getProposalById(id);
    if (!proposal) return NextResponse.json({ error: 'Proposta não encontrada' }, { status: 404 });
    return NextResponse.json({ data: proposal });
  } catch (err) {
    console.error('GET /api/proposals/[id] error:', err);
    return NextResponse.json({ error: 'Erro ao buscar proposta' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });
  }
  try {
    const { id } = await context.params;
    const json = await request.json().catch(() => ({}));
    const parsed = proposalUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Payload inválido', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await updateProposal(id, parsed.data);
    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error('PATCH /api/proposals/[id] error:', err);
    return NextResponse.json({ error: 'Erro ao atualizar proposta' }, { status: 500 });
  }
}

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });
  }
  try {
    const { id } = await context.params;
    await deleteProposal(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/proposals/[id] error:', err);
    return NextResponse.json({ error: 'Erro ao remover proposta' }, { status: 500 });
  }
}