import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import type { InverterCreateInput, InverterUpdateInput } from './schemas';

export async function listInverters(params: { page: number; limit: number; q?: string | null }) {
  const { page, limit, q } = params;
  const where: Prisma.InverterWhereInput = q
    ? {
        OR: [
          { manufacturer: { contains: q!, mode: 'insensitive' } },
          { model: { contains: q!, mode: 'insensitive' } },
        ],
      }
    : {};

  const [total, data] = await Promise.all([
    prisma.inverter.count({ where }),
    prisma.inverter.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { total, data };
}

export async function createInverter(input: InverterCreateInput) {
  const { manufacturer, model, powerW, mpptCount, efficiencyPerc, phases, warrantyYears } = input;
  return prisma.inverter.create({
    data: {
      manufacturer,
      model,
      powerW,
      mpptCount,
      efficiencyPerc: efficiencyPerc != null ? new Prisma.Decimal(efficiencyPerc) : undefined,
      phases: phases as any,
      warrantyYears,
    },
  });
}

export async function getInverterById(id: string) {
  return prisma.inverter.findUnique({ where: { id } });
}

export async function updateInverter(id: string, input: InverterUpdateInput) {
  const { manufacturer, model, powerW, mpptCount, efficiencyPerc, phases, warrantyYears } = input;
  return prisma.inverter.update({
    where: { id },
    data: {
      manufacturer,
      model,
      powerW,
      mpptCount,
      efficiencyPerc: efficiencyPerc != null ? new Prisma.Decimal(efficiencyPerc) : undefined,
      phases: phases as any,
      warrantyYears,
    },
  });
}

export async function deleteInverter(id: string) {
  await prisma.inverter.delete({ where: { id } });
}