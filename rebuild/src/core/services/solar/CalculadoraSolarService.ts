import { simulate as simulateBase } from "../CalculationService";
import type { SimulationInput, SimulationResult, EquipmentSelection, ElectricalValidation, FinancialKPIs, InverterConfig, MPPTConfig, ModuleStringConfig } from "../../types/solar";
import { computeEffectiveTariff } from "../TariffService";

// Agenda Fio B (Lei 14.300) simplificada
function fioBPercent(year: number) {
  if (year <= 2022) return 0;
  if (year === 2023) return 0.15;
  if (year === 2024) return 0.30;
  if (year === 2025) return 0.45;
  if (year === 2026) return 0.60;
  if (year === 2027) return 0.75;
  if (year === 2028) return 0.90;
  return 1.0; // 2029+
}

function getMonthlyConsumption(consumption: SimulationInput["consumption"], deltas?: SimulationInput["consumptionDeltas"], level?: SimulationInput["level"]) {
  let baseMonthly = consumption.monthly_kWh;
  if (!baseMonthly || baseMonthly.length !== 12) {
    const avg = consumption.averageMonthly_kWh ?? 0;
    baseMonthly = Array.from({ length: 12 }, () => avg);
  }
  const includeDeltas = level !== 'basic';
  const delta = includeDeltas ? (deltas ?? []).reduce((sum, d) => sum + (d.estimated_kWh_per_month || 0), 0) : 0;
  return baseMonthly.map((k) => k + delta);
}

function calcDCWatts(mppt: MPPTConfig) {
  return mppt.strings.reduce((sum, s) => sum + s.module.Pmpp_W * s.modulesInSeries * s.parallelStrings, 0);
}

function computeElectrical(equipment?: EquipmentSelection): ElectricalValidation | undefined {
  if (!equipment || !equipment.inverters?.length) return { notes: ["Sem seleção de equipamentos para validação."] };
  let totalDC = 0, totalAC = 0; const notes: string[] = [];
  let voltageOK = true, currentOK = true;
  for (const invCfg of equipment.inverters) {
    const inv = invCfg.inverter;
    totalAC += inv.AC_power_W;
    for (const mppt of invCfg.mppts) {
      totalDC += calcDCWatts(mppt);
      // verificação simples de tensão/corrente: Vmp_string < 0.9 * Vdc_max; nº de strings <= max
      for (const s of mppt.strings) {
        const vmpString = s.module.Vmp_V * s.modulesInSeries;
        if (vmpString >= inv.maxDC_voltage_V * 0.9) voltageOK = false;
        const stringsCount = s.parallelStrings;
        if (stringsCount > inv.stringsPerMPPT.max) currentOK = false;
      }
      const totalStrings = mppt.strings.reduce((a, b) => a + b.parallelStrings, 0);
      if (totalStrings < inv.stringsPerMPPT.min || totalStrings > inv.stringsPerMPPT.max) currentOK = false;
    }
  }
  const dcAcRatio = totalAC > 0 ? totalDC / totalAC : undefined;
  const oversizeOK = dcAcRatio != null ? dcAcRatio <= 1.35 : undefined;
  if (dcAcRatio != null && !oversizeOK) notes.push(`DC/AC ${dcAcRatio.toFixed(2)} acima do recomendado (<=1.35).`);
  if (!voltageOK) notes.push("Tensão de string próxima/acima do limite do inversor.");
  if (!currentOK) notes.push("Quantidade de strings por MPPT fora dos limites do inversor.");
  return { dcAcRatio, oversizeOK, voltageOK, currentOK, notes };
}

function npv(cashflows: number[], rateMonthly: number) {
  return cashflows.reduce((acc, cf, i) => acc + cf / Math.pow(1 + rateMonthly, i), 0);
}

function irrMonthly(cashflows: number[]): number | undefined {
  // Newton-Raphson com fallback simples
  let r = 0.01;
  for (let i = 0; i < 50; i++) {
    let f = 0, df = 0;
    for (let t = 0; t < cashflows.length; t++) {
      const denom = Math.pow(1 + r, t);
      f += cashflows[t] / denom;
      if (t > 0) df += -t * cashflows[t] / (denom * (1 + r));
    }
    const newR = r - f / (df || 1e-9);
    if (!isFinite(newR)) break;
    if (Math.abs(newR - r) < 1e-7) return Math.max(newR, -0.9999);
    r = newR;
  }
  return undefined;
}

export type AdvancedOptions = {
  referenceYear?: number;
  horizonYears?: number; // 25
  capexPerkWp?: number; // BRL/kWp
  oAndM_rate_annual?: number; // % capex/ano
  tariffEscalation_rate_annual?: number; // %
  degradation_rate_annual?: number; // %
  discount_rate_annual?: number; // %
};

export function simulateAdvanced(input: SimulationInput, opts: AdvancedOptions = {}): SimulationResult {
  const base = simulateBase(input);
  const equipment = input.equipment;
  const electrical = computeElectrical(equipment);

  const year0 = opts.referenceYear ?? new Date().getFullYear();
  const horizonYears = opts.horizonYears ?? 25;
  const months = horizonYears * 12;
  const monthlyConsumption = getMonthlyConsumption(input.consumption, input.consumptionDeltas, input.level);
  const monthlyGenBase = base.monthlyGeneration_kWh;
  const baseTariff = computeEffectiveTariff(input.tariff);

  const esc = opts.tariffEscalation_rate_annual ?? 0.05;
  const degr = opts.degradation_rate_annual ?? 0.005;
  const disc = opts.discount_rate_annual ?? 0.10;
  const om = opts.oAndM_rate_annual ?? 0.01;
  const capex = (opts.capexPerkWp ?? 4500) * base.recommendedPower_kWp;

  type Credit = { value_kWh: number; exp: number };
  const ledger: Credit[] = [];

  const monthlySavings: number[] = [];
  for (let m = 0; m < months; m++) {
    const yIdx = Math.floor(m / 12); const y = year0 + yIdx;
    const mIdx = m % 12;
    const tariff = baseTariff * Math.pow(1 + esc, yIdx);
    const gen = monthlyGenBase[mIdx] * Math.pow(1 - degr, yIdx);
    const cons = monthlyConsumption[mIdx];
    const self = Math.min(gen, cons);
    const surplus = Math.max(gen - cons, 0);
    let shortfall = Math.max(cons - gen, 0);

    // creditar excedente com Fio B
    const creditFactor = 1 - fioBPercent(y);
    const credited_kWh = surplus * creditFactor;
    if (credited_kWh > 0) ledger.push({ value_kWh: credited_kWh, exp: m + 60 });

    // usar créditos FIFO
    let used = 0;
    for (const c of ledger) {
      if (c.exp <= m) continue;
      if (shortfall <= 0) break;
      const take = Math.min(c.value_kWh, shortfall);
      c.value_kWh -= take; used += take; shortfall -= take;
    }
    // limpar expirados e zerados
    for (let i = ledger.length - 1; i >= 0; i--) if (ledger[i].exp <= m || ledger[i].value_kWh <= 1e-6) ledger.splice(i, 1);

    const saving = (self + used) * tariff;
    const omMonthly = (capex * om) / 12;
    monthlySavings.push(saving - omMonthly);
  }

  // KPIs
  const rMonthly = Math.pow(1 + disc, 1 / 12) - 1;
  const cashflows = [-capex, ...monthlySavings];
  const npvBRL = npv(cashflows, rMonthly);
  const irrM = irrMonthly(cashflows);
  const irrAnnual = irrM != null ? Math.pow(1 + irrM, 12) - 1 : undefined;

  // métricas anuais (ano 1)
  const year1Savings = monthlySavings.slice(0, 12).reduce((a, b) => a + b, 0) + (capex * om); // adiciona O&M removido para equiparar com "economia bruta"
  const avgMonthlyGross = year1Savings / 12;

  const financial: FinancialKPIs = {
    npv_BRL: Number(npvBRL.toFixed(2)),
    irr_pct: irrAnnual != null ? Number((irrAnnual * 100).toFixed(2)) : undefined,
    simplePayback_months: (() => {
      let acc = -capex; for (let i = 0; i < monthlySavings.length; i++) { acc += monthlySavings[i]; if (acc >= 0) return i + 1; } return undefined;
    })(),
    discountedPayback_months: (() => {
      let acc = 0; for (let i = 0; i < cashflows.length; i++) { acc += cashflows[i] / Math.pow(1 + rMonthly, i); if (acc >= 0) return i; } return undefined;
    })(),
  };

  const result: SimulationResult = {
    ...base,
    estimatedSavings_monthly_BRL: Number(avgMonthlyGross.toFixed(2)),
    estimatedSavings_annual_BRL: Number(year1Savings.toFixed(2)),
    electrical,
    financial,
    warnings: [
      ...(base.warnings ?? []),
      ...(electrical?.oversizeOK === false ? ["Oversizing acima do recomendado."] : []),
    ],
  };
  return result;
}

export default { simulateAdvanced };