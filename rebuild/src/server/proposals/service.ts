import { prisma } from '@/lib/prisma';
import type { ProposalCreateInput } from './schemas';
import { Prisma, ProposalStatus } from '@prisma/client';
import type { ProposalUpdateInput } from './schemas';

export async function createProposal(input: ProposalCreateInput & { authorId: string }) {
  const { title, leadId, contactId, opportunityId, status, data, authorId } = input as ProposalCreateInput & { authorId: string } & { contactId?: string; opportunityId?: string };
  return prisma.proposal.create({
    data: {
      title,
      leadId,
      contactId: contactId ?? undefined,
      opportunityId: opportunityId ?? undefined,
      status,
      data: data as any,
      authorId,
    },
    include: {
      lead: { select: { id: true, name: true, email: true } },
      contact: { select: { id: true, name: true, email: true } },
      author: { select: { id: true, email: true, name: true } },
      opportunity: { select: { id: true, title: true, status: true } },
    },
  });
}

export async function listProposals(params: { page: number; limit: number; status?: ProposalStatus | null; leadId?: string | null; contactId?: string | null; opportunityId?: string | null; q?: string | null }) {
  const { page, limit, status, leadId, contactId, opportunityId, q } = params;
  const where: Prisma.ProposalWhereInput = {
    ...(status ? { status } : {}),
    ...(leadId ? { leadId } : {}),
    ...(contactId ? { contactId } : {}),
    ...(opportunityId ? { opportunityId } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { lead: { name: { contains: q, mode: 'insensitive' } } },
            { contact: { name: { contains: q, mode: 'insensitive' } } },
            { contact: { email: { contains: q, mode: 'insensitive' } } },
            { opportunity: { title: { contains: q, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  const [total, data] = await Promise.all([
    prisma.proposal.count({ where }),
    prisma.proposal.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        lead: { select: { id: true, name: true, email: true } },
        contact: { select: { id: true, name: true, email: true } },
        author: { select: { id: true, email: true, name: true } },
        opportunity: { select: { id: true, title: true, status: true } },
      },
    }),
  ]);

  return { total, data };
}

export async function getProposalById(id: string) {
  return prisma.proposal.findUnique({
    where: { id },
    include: {
      lead: { select: { id: true, name: true, email: true } },
      contact: { select: { id: true, name: true, email: true } },
      author: { select: { id: true, email: true, name: true } },
      opportunity: { select: { id: true, title: true, status: true } },
    },
  });
}

export async function updateProposal(id: string, input: ProposalUpdateInput) {
  const { title, status, data, contactId, opportunityId } = input as ProposalUpdateInput & { contactId?: string | null; opportunityId?: string | null };
  return prisma.proposal.update({
    where: { id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(status !== undefined ? { status } : {}),
      ...(data !== undefined ? { data: data as any } : {}),
      ...(contactId !== undefined ? { contactId: contactId ?? null } : {}),
      ...(opportunityId !== undefined ? { opportunityId: opportunityId ?? null } : {}),
    },
    include: {
      lead: { select: { id: true, name: true, email: true } },
      contact: { select: { id: true, name: true, email: true } },
      author: { select: { id: true, email: true, name: true } },
      opportunity: { select: { id: true, title: true, status: true } },
    },
  });
}

export async function deleteProposal(id: string) {
  await prisma.proposal.delete({ where: { id } });
}