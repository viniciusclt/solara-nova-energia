import { TariffBreakdown } from "../types/solar";

// Cálculo simplificado de tarifa efetiva (R$/kWh):
// - Base = TE + TUSD (quando existirem)
// - Tributos aplicados de forma agregada: (1 + ICMS + PIS + COFINS)
// Obs.: Este é um MVP. Regras exatas variam por concessionária/estado e podem ser incorporadas futuramente.
export function computeEffectiveTariff(tariff?: TariffBreakdown): number {
  if (!tariff) return 0.65; // fallback padrão
  const TE = tariff.TE ?? 0;
  const TUSD = tariff.TUSD ?? 0;
  const icms = (tariff.taxes?.ICMS_pct ?? 0) / 100;
  const pis = (tariff.taxes?.PIS_pct ?? 0) / 100;
  const cofins = (tariff.taxes?.COFINS_pct ?? 0) / 100;

  const base = TE + TUSD;
  const effective = base * (1 + icms + pis + cofins);
  return Number(effective.toFixed(4));
}

export default { computeEffectiveTariff };