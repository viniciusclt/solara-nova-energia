import { z } from 'zod';
import { OpportunityStatus } from '@prisma/client';

export const opportunityCreateSchema = z.object({
  title: z.string().min(1, 'title é obrigatório'),
  status: z.nativeEnum(OpportunityStatus).optional(),
  amount: z.number().positive().optional(),
  contactId: z.string().min(1, 'contactId é obrigatório'),
  ownerId: z.string().optional(),
});

export const opportunityUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  status: z.nativeEnum(OpportunityStatus).optional(),
  amount: z.number().positive().optional(),
  contactId: z.string().optional(),
  ownerId: z.string().optional(),
});

export type OpportunityCreateInput = z.infer<typeof opportunityCreateSchema>;
export type OpportunityUpdateInput = z.infer<typeof opportunityUpdateSchema>;