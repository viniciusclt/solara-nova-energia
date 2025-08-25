import { z } from 'zod';
import { LeadStatus } from '@prisma/client';

export const leadCreateSchema = z.object({
  name: z.string().min(1, 'name é obrigatório'),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  consumoMedio: z.number().positive().optional(),
  status: z.nativeEnum(LeadStatus).optional(),
  address: z.unknown().optional(),
  ownerId: z.string().optional(),
});

export const leadUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  consumoMedio: z.number().positive().optional(),
  status: z.nativeEnum(LeadStatus).optional(),
  address: z.unknown().optional(),
  ownerId: z.string().optional(),
});

export type LeadCreateInput = z.infer<typeof leadCreateSchema>;
export type LeadUpdateInput = z.infer<typeof leadUpdateSchema>;