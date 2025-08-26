import { NextResponse } from 'next/server';
import { contactUpdateSchema } from '@/server/contacts/schemas';
import { getContactById, updateContact, deleteContact } from '@/server/contacts/service';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const contact = await getContactById(params.id);
    if (!contact) return NextResponse.json({ error: 'Contato não encontrado' }, { status: 404 });
    return NextResponse.json({ data: contact });
  } catch (err) {
    console.error('GET /api/contacts/[id] error:', err);
    return NextResponse.json({ error: 'Erro ao buscar contato' }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const json = await request.json().catch(() => ({}));
    const parsed = contactUpdateSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Payload inválido', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const updated = await updateContact(params.id, parsed.data);
    return NextResponse.json({ data: updated });
  } catch (err) {
    console.error('PATCH /api/contacts/[id] error:', err);
    return NextResponse.json({ error: 'Erro ao atualizar contato' }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await deleteContact(params.id);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('DELETE /api/contacts/[id] error:', err);
    return NextResponse.json({ error: 'Erro ao remover contato' }, { status: 500 });
  }
}