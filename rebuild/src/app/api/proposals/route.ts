import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { proposalCreateSchema } from '@/server/proposals/schemas';
import { createProposal } from '@/server/proposals/service';
import { listProposals } from '@/server/proposals/service';
import { ProposalStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    const { userId } = await auth();
    if (!userId) return new Response('Unauthorized', { status: 401 });
  }
  try {
    const url = new URL(request.url);
    const page = Math.max(1, Number(url.searchParams.get('page') ?? '1'));
    const limit = Math.min(100, Math.max(1, Number(url.searchParams.get('limit') ?? '10')));
    const status = (url.searchParams.get('status') as ProposalStatus | null) ?? null;
    const leadId = url.searchParams.get('leadId');
    const contactId = url.searchParams.get('contactId');
    const opportunityId = url.searchParams.get('opportunityId');
    const q = url.searchParams.get('q');

    const { total, data } = await listProposals({ page, limit, status, leadId, contactId, opportunityId, q });

    return NextResponse.json({ data, page, limit, total });
  } catch (err) {
    console.error('GET /api/proposals error:', err);
    return NextResponse.json({ error: 'Erro ao listar propostas' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  let userId: string | null = null;
  if (process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) {
    const authRes = await auth();
    userId = authRes?.userId ?? null;
    if (!userId) return new Response('Unauthorized', { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = proposalCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Payload inválido', details: parsed.error.flatten() }, { status: 400 });
    }

    // Fallback dev: se Clerk não estiver configurado e estivermos fora de produção,
    // usar/crear um usuário de desenvolvimento para authorId.
    if (!userId) {
      if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.NODE_ENV !== 'production') {
        const devUser = await prisma.user.upsert({
          where: { email: 'dev@local' },
          update: {},
          create: { email: 'dev@local', name: 'Dev User' },
        });
        userId = devUser.id;
      } else {
        // Em ambiente sem Clerk configurado ou sem userId válido
        return NextResponse.json({ error: 'AuthorId ausente: configure autenticação (Clerk) para criar propostas.' }, { status: 500 });
      }
    }

    // Ajuste: se o leadId informado não existir como Lead, tentar mapear para Contact e criar Lead correspondente
    const input = parsed.data as any;
    let ensuredLeadId = input.leadId as string;
    let contactForLink: { id: string } | null = null;

    const existingLead = await prisma.lead.findUnique({ where: { id: ensuredLeadId } });
    if (!existingLead) {
      const contact = await prisma.contact.findUnique({ where: { id: ensuredLeadId } });
      if (contact) {
        const newLead = await prisma.lead.create({
          data: {
            name: contact.name,
            email: contact.email ?? undefined,
            phone: contact.phone ?? undefined,
            consumoMedio: contact.consumoMedio ?? undefined,
            status: contact.status,
            address: (contact as any).address,
            ownerId: (contact as any).ownerId ?? undefined,
          },
        });
        ensuredLeadId = newLead.id;
        contactForLink = { id: contact.id };
      } else {
        return NextResponse.json({ error: 'leadId inválido: nenhum Lead/Contact encontrado com este id' }, { status: 400 });
      }
    }

    // Validar oportunidade se fornecida
    let ensuredOpportunityId: string | undefined = input.opportunityId;
    if (ensuredOpportunityId) {
      const opp = await prisma.opportunity.findUnique({ where: { id: ensuredOpportunityId } });
      if (!opp) {
        return NextResponse.json({ error: 'opportunityId inválido: nenhuma Opportunity encontrada com este id' }, { status: 400 });
      }
      // Se contactId não vier, inferir pelo vínculo da oportunidade
      if (!input.contactId) {
        const oppContact = await prisma.contact.findUnique({ where: { id: opp.contactId } });
        if (oppContact) {
          contactForLink = { id: oppContact.id };
        }
      }
    }

    const proposal = await createProposal({
      ...input,
      leadId: ensuredLeadId,
      contactId: input.contactId ?? contactForLink?.id,
      opportunityId: ensuredOpportunityId,
      authorId: userId!,
    });
    return NextResponse.json(proposal, { status: 201 });
  } catch (error) {
    console.error('Erro ao criar proposta', error);
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}