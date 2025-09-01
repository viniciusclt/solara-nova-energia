import { z } from 'zod';

// Schema mínimo para entrada de simulação (MVP)
export const simulationInputSchema = z.object({
  consumption: z.object({
    averageMonthly_kWh: z.number().positive().optional(),
    monthly_kWh: z.array(z.number().min(0)).length(12).optional(),
  }).refine((c) => typeof c.averageMonthly_kWh === 'number' || Array.isArray(c.monthly_kWh), {
    message: 'Informe averageMonthly_kWh ou monthly_kWh (12 valores).',
    path: ['averageMonthly_kWh'],
  }),
  consumptionDeltas: z.array(z.object({
    label: z.string().min(1),
    estimated_kWh_per_month: z.number().min(0),
  })).optional(),
  technical: z.object({
    performanceRatio_pct: z.number().min(0).max(100).optional(),
    lossesEnvironmental_pct: z.number().min(0).max(100).optional(),
    lossesTechnical_pct: z.number().min(0).max(100).optional(),
    targetCompensation_pct: z.number().min(0).max(100).optional(),
  }).optional(),
  irradiation: z.object({
    annualPlaneOfArray: z.number().min(0).optional(),
    monthlyPlaneOfArray: z.array(z.number().min(0)).length(12).optional(),
    tiltDeg: z.number().min(0).max(90).optional(),
    azimuthDeg: z.number().min(0).max(360).optional(),
  }).optional(),
  lead: z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    email: z.string().email().optional(),
    phone: z.string().optional(),
    address: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    distributor: z.string().optional(),
    consumerClass: z.enum(['residential', 'commercial', 'industrial', 'rural', 'public']).optional(),
  }).optional(),
  tariff: z.object({
    TE: z.number().min(0).optional(),
    TUSD: z.number().min(0).optional(),
    taxes: z.object({
      ICMS_pct: z.number().min(0).max(100).optional(),
      PIS_pct: z.number().min(0).max(100).optional(),
      COFINS_pct: z.number().min(0).max(100).optional(),
    }).optional(),
    publicLighting_COSIP_monthly_BR: z.number().min(0).optional(),
    availabilityCost_kWh_equivalent: z.number().min(0).optional(),
  }).optional(),
  equipment: z.any().optional(), // validação detalhada será adicionada quando CRUD estiver pronto
  level: z.enum(['basic','precise','pvsol_import']).optional(),
});

export type SimulationInputDTO = z.infer<typeof simulationInputSchema>;