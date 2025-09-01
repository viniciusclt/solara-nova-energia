import { z } from 'zod';

export const inverterCreateSchema = z.object({
  manufacturer: z.string().min(1),
  model: z.string().min(1),
  powerW: z.number().int().positive(),
  mpptCount: z.number().int().min(1).optional(),
  efficiencyPerc: z.number().min(0).max(100).optional(),
  phases: z.enum(['MONO', 'TRIF']).optional(),
  warrantyYears: z.number().int().min(0).optional(),
});

export const inverterUpdateSchema = inverterCreateSchema.partial();

export type InverterCreateInput = z.infer<typeof inverterCreateSchema>;
export type InverterUpdateInput = z.infer<typeof inverterUpdateSchema>;