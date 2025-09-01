/**
 * CalculationService — Simulação Fotovoltaica (esqueleto inicial)
 * Objetivo: centralizar regras de cálculo para UI e testes unitários.
 * Nota: implementação simplificada inicial; será evoluída para Fio B, tarifação e KPIs financeiros.
 */

import type {
  SimulationInput,
  SimulationResult,
  TechnicalParams,
} from "../types/solar";

const DEFAULTS = {
  irradiationDaily_kWh_m2: 4.5, // fallback quando não informado
  PR: 0.75,
  lossesEnvironmental_pct: 8,
  lossesTechnical_pct: 7,
};

function getPR(technical?: TechnicalParams) {
  const prRaw = technical?.performanceRatio_pct ?? DEFAULTS.PR;
  // aceita tanto 0.78 quanto 78
  return prRaw > 1 ? prRaw / 100 : prRaw;
}

function getLossFactor(technical?: TechnicalParams) {
  const env = technical?.lossesEnvironmental_pct ?? DEFAULTS.lossesEnvironmental_pct;
  const tech = technical?.lossesTechnical_pct ?? DEFAULTS.lossesTechnical_pct;
  const totalLoss_pct = Math.max(0, Math.min(env + tech, 100));
  return 1 - totalLoss_pct / 100;
}

function getMonthlyConsumption(consumption: SimulationInput["consumption"], deltas?: SimulationInput["consumptionDeltas"], level?: SimulationInput["level"]) {
  // normaliza consumo mensal (12 meses); se só houver média, replica
  let baseMonthly = consumption.monthly_kWh;
  if (!baseMonthly || baseMonthly.length !== 12) {
    const avg = consumption.averageMonthly_kWh ?? 0;
    baseMonthly = Array.from({ length: 12 }, () => avg);
  }

  // No nível básico, ignoramos deltas (novas cargas) para simplificar o sizing inicial
  const includeDeltas = level !== 'basic';
  const delta = includeDeltas ? (deltas ?? []).reduce((sum, d) => sum + (d.estimated_kWh_per_month || 0), 0) : 0;
  return baseMonthly.map((k) => k + delta);
}

import { computeEffectiveTariff } from './TariffService';

export function simulate(input: SimulationInput): SimulationResult {
  const pr = getPR(input.technical);
  const lossFactor = getLossFactor(input.technical);
  const monthlyConsumption = getMonthlyConsumption(input.consumption, input.consumptionDeltas, input.level);
  const annualConsumption = monthlyConsumption.reduce((a, b) => a + b, 0);

  // Irradiação — usar série mensal se houver; senão cair para diária média * 30
  const daily = input.irradiation?.annualPlaneOfArray
    ? input.irradiation.annualPlaneOfArray / 365
    : input.irradiation?.monthlyPlaneOfArray && input.irradiation.monthlyPlaneOfArray.length === 12
    ? input.irradiation.monthlyPlaneOfArray.reduce((a, b) => a + b, 0) / (30 * 12)
    : DEFAULTS.irradiationDaily_kWh_m2;

  const monthlyIrr = Array.from({ length: 12 }, (_, i) => {
    if (input.irradiation?.monthlyPlaneOfArray?.[i] != null) return input.irradiation.monthlyPlaneOfArray[i];
    return daily * 30; // fallback
  });

  // Potência recomendada — alvo: targetCompensation ou 100%
  const targetComp = Math.min(Math.max(input.technical?.targetCompensation_pct ?? 95, 0), 100) / 100;
  const targetAnnual = annualConsumption * targetComp;

  // Geração mensal por kWp ~ irr_mensal * PR * perdas; modelo simplificado inicial
  // recommended_kWp = targetAnnual / (sum(monthlyIrr) * PR * lossFactor)
  const annualIrr = monthlyIrr.reduce((a, b) => a + b, 0);
  const denominator = annualIrr * pr * lossFactor;
  const recommended_kWp = denominator > 0 ? targetAnnual / denominator : 0;

  const monthlyGeneration = monthlyIrr.map((irr) => irr * pr * lossFactor * recommended_kWp);
  const annualGeneration = monthlyGeneration.reduce((a, b) => a + b, 0);
  const compensation = annualConsumption > 0 ? Math.min((annualGeneration / annualConsumption) * 100, 100) : 0;

  // Economia: usar tarifa efetiva do TariffService (fallback 0,65 R$/kWh)
  const avgTariff = computeEffectiveTariff(input.tariff);
  const estimatedMonthlySavingsBRL = monthlyGeneration.reduce((acc, g, i) => acc + Math.min(g, monthlyConsumption[i]) * avgTariff, 0) / 12;

  return {
    recommendedPower_kWp: Number(recommended_kWp.toFixed(2)),
    annualGeneration_kWh: Math.round(annualGeneration),
    monthlyGeneration_kWh: monthlyGeneration.map((v) => Math.round(v)),
    compensation_pct: Number(compensation.toFixed(1)),
    estimatedSavings_monthly_BRL: Number(estimatedMonthlySavingsBRL.toFixed(2)),
    estimatedSavings_annual_BRL: Number((estimatedMonthlySavingsBRL * 12).toFixed(2)),
    electrical: {
      // validações elétricas virão após seleção de equipamentos
      notes: [
        "Modelo simplificado inicial: sem Fio B, sem tarifação detalhada, sem validações elétricas de strings.",
      ],
    },
  };
}