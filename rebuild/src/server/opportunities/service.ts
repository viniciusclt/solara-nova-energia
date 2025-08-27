import { prisma } from '@/lib/prisma';
import { Prisma, OpportunityStatus } from '@prisma/client';
import type { OpportunityCreateInput, OpportunityUpdateInput } from './schemas';

export async function listOpportunities(params: { page: number; limit: number; status?: OpportunityStatus | null; contactId?: string | null; q?: string | null }) {
  const { page, limit, status, contactId, q } = params;
  const where: Prisma.OpportunityWhereInput = {
    ...(status ? { status } : {}),
    ...(contactId ? { contactId } : {}),
    ...(q
      ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { contact: { name: { contains: q, mode: 'insensitive' } } },
          ],
        }
      : {}),
  };

  const [total, data] = await Promise.all([
    prisma.opportunity.count({ where }),
    prisma.opportunity.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { contact: true, owner: { select: { id: true, email: true, name: true } } },
    }),
  ]);

  return { total, data };
}

export async function createOpportunity(input: OpportunityCreateInput) {
  const { title, status, amount, contactId, ownerId } = input;
  return prisma.opportunity.create({
    data: {
      title,
      status,
      amount: amount != null ? new Prisma.Decimal(amount) : undefined,
      contactId,
      ownerId,
    },
  });
}

export async function getOpportunityById(id: string) {
  return prisma.opportunity.findUnique({
    where: { id },
    include: { contact: true, owner: { select: { id: true, email: true, name: true } } },
  });
}

export async function updateOpportunity(id: string, input: OpportunityUpdateInput) {
  const { title, status, amount, contactId, ownerId } = input;
  return prisma.opportunity.update({
    where: { id },
    data: {
      title,
      status,
      amount: amount != null ? new Prisma.Decimal(amount) : undefined,
      contactId,
      ownerId,
    },
  });
}

export async function deleteOpportunity(id: string) {
  await prisma.opportunity.delete({ where: { id } });
}