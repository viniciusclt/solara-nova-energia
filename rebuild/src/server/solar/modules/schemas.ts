import { z } from 'zod';

export const solarModuleCreateSchema = z.object({
  manufacturer: z.string().min(1),
  model: z.string().min(1),
  powerW: z.number().int().positive(),
  efficiencyPerc: z.number().min(0).max(100).optional(),
  dimensions: z.string().min(1).optional(),
  warrantyYears: z.number().int().min(0).optional(),
});

export const solarModuleUpdateSchema = solarModuleCreateSchema.partial();

export type SolarModuleCreateInput = z.infer<typeof solarModuleCreateSchema>;
export type SolarModuleUpdateInput = z.infer<typeof solarModuleUpdateSchema>;