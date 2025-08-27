import { NextResponse, NextRequest } from 'next/server';
import { contactUpdateSchema } from '@/server/contacts/schemas';
import { getContactById, updateContact, deleteContact } from '@/server/contacts/service';
import { auth } from "@clerk/nextjs/server";

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const contact = await getContactById(id);
    if (!contact) return NextResponse.json({ error: 'Contato não encontrado' }, { status: 404 });
    return NextResponse.json({ data: contact });
  } catch (err) {
    console.error('GET /api/contacts/[id] error:', err);
    return NextResponse.json({ error: 'Erro ao buscar contato' }, { status: 500 });
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
    const parsed = contactUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Payload inválido', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await updateContact(id, parsed.data);
    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error('PATCH /api/contacts/[id] error:', err);
    return NextResponse.json({ error: 'Erro ao atualizar contato' }, { status: 500 });
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
    await deleteContact(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/contacts/[id] error:', err);
    return NextResponse.json({ error: 'Erro ao remover contato' }, { status: 500 });
  }
}