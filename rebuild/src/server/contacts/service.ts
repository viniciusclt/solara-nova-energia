import { prisma } from '@/lib/prisma';
import { Prisma, LeadStatus } from '@prisma/client';
import type { ContactCreateInput, ContactUpdateInput } from './schemas';

export async function listContacts(params: { page: number; limit: number; status?: LeadStatus | null; q?: string | null }) {
  const { page, limit, status, q } = params;
  const where: Prisma.ContactWhereInput = {
    ...(status ? { status } : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: 'insensitive' } },
            { email: { contains: q, mode: 'insensitive' } },
            { phone: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const [total, data] = await Promise.all([
    prisma.contact.count({ where }),
    prisma.contact.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
      include: { owner: { select: { id: true, email: true, name: true } } },
    }),
  ]);

  return { total, data };
}

export async function createContact(input: ContactCreateInput) {
  const { name, email, phone, consumoMedio, status, address, ownerId } = input;
  return prisma.contact.create({
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

export async function getContactById(id: string) {
  return prisma.contact.findUnique({
    where: { id },
    include: { owner: { select: { id: true, email: true, name: true } }, opportunities: true },
  });
}

export async function updateContact(id: string, input: ContactUpdateInput) {
  const { name, email, phone, consumoMedio, status, address, ownerId } = input;
  return prisma.contact.update({
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

export async function deleteContact(id: string) {
  await prisma.contact.delete({ where: { id } });
}