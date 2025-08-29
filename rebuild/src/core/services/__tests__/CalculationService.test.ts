import { describe, it, expect } from 'vitest'
import { simulate } from '../CalculationService'
import type { SimulationInput } from '../../types/solar'

function makeBaseInput(overrides: Partial<SimulationInput> = {}): SimulationInput {
  const base: SimulationInput = {
    consumption: { averageMonthly_kWh: 250 },
    technical: { performanceRatio_pct: 0.78, lossesEnvironmental_pct: 8, lossesTechnical_pct: 7, targetCompensation_pct: 95 },
  }
  return { ...base, ...overrides }
}

describe('CalculationService.simulate', () => {
  it('calcula potencia recomendada, geração anual positiva e 12 meses de geração', () => {
    const r = simulate(makeBaseInput())
    expect(r.recommendedPower_kWp).toBeGreaterThan(0)
    expect(r.annualGeneration_kWh).toBeGreaterThan(0)
    expect(r.monthlyGeneration_kWh).toHaveLength(12)
    const sumMonthly = r.monthlyGeneration_kWh.reduce((a, b) => a + b, 0)
    const tolerance = r.annualGeneration_kWh * 0.05
    expect(Math.abs(sumMonthly - r.annualGeneration_kWh)).toBeLessThanOrEqual(tolerance)
    expect(r.compensation_pct).toBeGreaterThanOrEqual(0)
    expect(r.compensation_pct).toBeLessThanOrEqual(100)
  })

  it('melhor PR e menores perdas reduzem a potência recomendada (mantendo geração-alvo)', () => {
    const base = makeBaseInput()
    const melhor = makeBaseInput({ technical: { performanceRatio_pct: 0.85, lossesEnvironmental_pct: 5, lossesTechnical_pct: 5, targetCompensation_pct: 95 } })
    const r1 = simulate(base)
    const r2 = simulate(melhor)
    expect(r2.recommendedPower_kWp).toBeLessThan(r1.recommendedPower_kWp)
    const delta = Math.abs(r2.annualGeneration_kWh - r1.annualGeneration_kWh)
    expect(delta).toBeLessThanOrEqual(r1.annualGeneration_kWh * 0.02)
  })

  it('aumento de consumo (consumptionDeltas) eleva a potência recomendada', () => {
    const base = makeBaseInput()
    const comDelta = makeBaseInput({ consumptionDeltas: [{ label: 'Ar-condicionado', estimated_kWh_per_month: 150 }] })
    const rBase = simulate(base)
    const rDelta = simulate(comDelta)
    expect(rDelta.recommendedPower_kWp).toBeGreaterThan(rBase.recommendedPower_kWp)
    expect(rDelta.annualGeneration_kWh).toBeGreaterThan(rBase.annualGeneration_kWh)
  })

  it('economia anual ~ 12x economia mensal (com pequenas diferenças de arredondamento)', () => {
    const r = simulate(makeBaseInput())
    const diff = Math.abs(r.estimatedSavings_annual_BRL - r.estimatedSavings_monthly_BRL * 12)
    expect(diff).toBeLessThanOrEqual(1)
  })

  it('aceita PR informado em fração (0.78) ou percentual (78)', () => {
    const frac = simulate(makeBaseInput({ technical: { performanceRatio_pct: 0.78, lossesEnvironmental_pct: 8, lossesTechnical_pct: 7, targetCompensation_pct: 95 } }))
    const perc = simulate(makeBaseInput({ technical: { performanceRatio_pct: 78, lossesEnvironmental_pct: 8, lossesTechnical_pct: 7, targetCompensation_pct: 95 } }))
    const delta = Math.abs(frac.annualGeneration_kWh - perc.annualGeneration_kWh)
    expect(delta).toBeLessThanOrEqual(frac.annualGeneration_kWh * 0.01)
  })
})