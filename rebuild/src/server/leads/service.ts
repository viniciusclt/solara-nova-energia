import { prisma } from '@/lib/prisma';
import { Prisma, LeadStatus } from '@prisma/client';
import type { LeadCreateInput, LeadUpdateInput } from './schemas';

export async function listLeads(params: { page: number; limit: number; status?: LeadStatus | null }) {
  const { page, limit, status } = params;
  const where: Prisma.LeadWhereInput = status ? { status } : {};

  const [total, data] = await Promise.all([
    prisma.lead.count({ where }),
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { owner: { select: { id: true, email: true, name: true } } },
    }),
  ]);

  return { total, data };
}

export async function createLead(input: LeadCreateInput) {
  const { name, email, phone, consumoMedio, status, address, ownerId } = input;
  return prisma.lead.create({
    data: {
      name,
      email,
      phone,
      status,
      ownerId,
      address: address as Prisma.InputJsonValue | undefined,
      consumoMedio: consumoMedio != null ? new Prisma.Decimal(consumoMedio) : undefined,
    },
  });
}

export async function getLeadById(id: string) {
  return prisma.lead.findUnique({
    where: { id },
    include: { owner: { select: { id: true, email: true, name: true } }, proposals: true },
  });
}

export async function updateLead(id: string, input: LeadUpdateInput) {
  const { name, email, phone, consumoMedio, status, address, ownerId } = input;
  return prisma.lead.update({
    where: { id },
    data: {
      name,
      email,
      phone,
      status,
      ownerId,
      address: address as Prisma.InputJsonValue | undefined,
      consumoMedio: consumoMedio != null ? new Prisma.Decimal(consumoMedio) : undefined,
    },
  });
}

export async function deleteLead(id: string) {
  await prisma.lead.delete({ where: { id } });
}