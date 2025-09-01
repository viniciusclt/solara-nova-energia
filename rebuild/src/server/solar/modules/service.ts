import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import type { SolarModuleCreateInput, SolarModuleUpdateInput } from './schemas';

export async function listSolarModules(params: { page: number; limit: number; q?: string | null }) {
  const { page, limit, q } = params;
  const where: Prisma.SolarModuleWhereInput = q
    ? {
        OR: [
          { manufacturer: { contains: q!, mode: 'insensitive' } },
          { model: { contains: q!, mode: 'insensitive' } },
        ],
      }
    : {};

  const [total, data] = await Promise.all([
    prisma.solarModule.count({ where }),
    prisma.solarModule.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
  ]);

  return { total, data };
}

export async function createSolarModule(input: SolarModuleCreateInput) {
  const { manufacturer, model, powerW, efficiencyPerc, dimensions, warrantyYears } = input;
  return prisma.solarModule.create({
    data: {
      manufacturer,
      model,
      powerW,
      efficiencyPerc: efficiencyPerc != null ? new Prisma.Decimal(efficiencyPerc) : undefined,
      dimensions,
      warrantyYears,
    },
  });
}

export async function getSolarModuleById(id: string) {
  return prisma.solarModule.findUnique({ where: { id } });
}

export async function updateSolarModule(id: string, input: SolarModuleUpdateInput) {
  const { manufacturer, model, powerW, efficiencyPerc, dimensions, warrantyYears } = input;
  return prisma.solarModule.update({
    where: { id },
    data: {
      manufacturer,
      model,
      powerW,
      efficiencyPerc: efficiencyPerc != null ? new Prisma.Decimal(efficiencyPerc) : undefined,
      dimensions,
      warrantyYears,
    },
  });
}

export async function deleteSolarModule(id: string) {
  await prisma.solarModule.delete({ where: { id } });
}