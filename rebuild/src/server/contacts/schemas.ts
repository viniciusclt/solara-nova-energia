import { z } from 'zod';
import { LeadStatus } from '@prisma/client';

export const contactCreateSchema = z.object({
  name: z.string().min(1, 'name é obrigatório'),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  consumoMedio: z.number().positive().optional(),
  status: z.nativeEnum(LeadStatus).optional(),
  address: z.unknown().optional(),
  ownerId: z.string().optional(),
});

export const contactUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  consumoMedio: z.number().positive().optional(),
  status: z.nativeEnum(LeadStatus).optional(),
  address: z.unknown().optional(),
  ownerId: z.string().optional(),
});

export type ContactCreateInput = z.infer<typeof contactCreateSchema>;
export type ContactUpdateInput = z.infer<typeof contactUpdateSchema>;