import { describe, it, expect } from 'vitest'
import { computeEffectiveTariff } from '../TariffService'
import type { TariffBreakdown } from '../../types/solar'

describe('TariffService.computeEffectiveTariff', () => {
  it('retorna fallback 0.65 quando tariff undefined', () => {
    expect(computeEffectiveTariff(undefined)).toBeCloseTo(0.65, 5)
  })

  it('soma TE + TUSD quando presentes, sem tributos', () => {
    const t: TariffBreakdown = { TE: 0.45, TUSD: 0.20 }
    expect(computeEffectiveTariff(t)).toBeCloseTo(0.65, 5)
  })

  it('aplica tributos agregados (ICMS + PIS + COFINS) sobre a base TE+TUSD', () => {
    const t: TariffBreakdown = { TE: 0.50, TUSD: 0.30, taxes: { ICMS_pct: 18, PIS_pct: 1.65, COFINS_pct: 7.6 } }
    // base = 0.8; fator = 1 + 0.18 + 0.0165 + 0.076 = 1.2725; efetiva = 0.8 * 1.2725 = 1.018
    expect(computeEffectiveTariff(t)).toBeCloseTo(1.018, 3)
  })

  it('aceita campos ausentes como 0', () => {
    const t: TariffBreakdown = { TE: 0.6 }
    expect(computeEffectiveTariff(t)).toBeCloseTo(0.6, 5)
  })
})