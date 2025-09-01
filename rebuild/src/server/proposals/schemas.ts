import { z } from 'zod';
import { ProposalStatus } from '@prisma/client';

export const proposalCreateSchema = z.object({
  title: z.string().min(1, 'title é obrigatório'),
  leadId: z.string().min(1, 'leadId é obrigatório'),
  contactId: z.string().min(1).optional(),
  opportunityId: z.string().min(1).optional(),
  status: z.nativeEnum(ProposalStatus).optional(),
  data: z.unknown().optional(),
});

export type ProposalCreateInput = z.infer<typeof proposalCreateSchema>;

// Novo: schema de atualização parcial
export const proposalUpdateSchema = z.object({
  title: z.string().min(1, 'title é obrigatório').optional(),
  status: z.nativeEnum(ProposalStatus).optional(),
  data: z.unknown().optional(),
  contactId: z.string().min(1).nullable().optional(),
  opportunityId: z.string().min(1).nullable().optional(),
});

export type ProposalUpdateInput = z.infer<typeof proposalUpdateSchema>;