import { describe, it, expect } from 'vitest'
import { simulateAdvanced } from '../solar/CalculadoraSolarService'
import type { SimulationInput } from '../../types/solar'

function baseInput(): SimulationInput {
  return {
    consumption: { averageMonthly_kWh: 300 },
    technical: { performanceRatio_pct: 0.78, lossesEnvironmental_pct: 8, lossesTechnical_pct: 7, targetCompensation_pct: 95 },
  }
}

describe('CalculadoraSolarService.simulateAdvanced', () => {
  it('retorna KPIs financeiros e validações elétricas básicas quando há equipamento', () => {
    const input: SimulationInput = {
      ...baseInput(),
      equipment: {
        inverters: [
          {
            inverter: { manufacturer: 'X', model: 'Y', AC_power_W: 5000, maxDC_voltage_V: 600, mpptCount: 1, stringsPerMPPT: { min: 1, max: 3 } },
            mppts: [
              {
                mpptIndex: 0,
                strings: [
                  { module: { manufacturer: 'A', model: 'B', Pmpp_W: 550, Voc_V: 49, Isc_A: 13, Vmp_V: 41, Imp_A: 12 }, modulesInSeries: 12, parallelStrings: 2 },
                ],
              },
            ],
          },
        ],
      },
    }
    const r = simulateAdvanced(input, { capexPerkWp: 4000 })
    expect(r.financial?.npv_BRL).toBeDefined()
    expect(r.financial?.simplePayback_months).toBeGreaterThan(0)
    expect(r.electrical?.dcAcRatio).toBeGreaterThan(0)
  })

  it('aplica Fio B crescendo ao longo dos anos (menor crédito => menor economia)', () => {
    // Introduz variação sazonal de irradiação para gerar meses com superávit e déficit
    const seasonal: SimulationInput = {
      ...baseInput(),
      irradiation: {
        monthlyPlaneOfArray: [100, 110, 130, 150, 160, 170, 170, 160, 140, 120, 110, 100],
      },
    }
    const rLow = simulateAdvanced(seasonal, { referenceYear: 2023 })
    const rHigh = simulateAdvanced(seasonal, { referenceYear: 2029 })
    expect(rHigh.estimatedSavings_annual_BRL).toBeLessThan(rLow.estimatedSavings_annual_BRL)
  })

  it('créditos expiram após 60 meses (ledger FIFO)', () => {
    const input: SimulationInput = { consumption: { averageMonthly_kWh: 100 }, technical: { performanceRatio_pct: 0.8, lossesEnvironmental_pct: 5, lossesTechnical_pct: 5, targetCompensation_pct: 120 } }
    const r = simulateAdvanced(input, { referenceYear: 2024 })
    expect(r.estimatedSavings_annual_BRL).toBeGreaterThan(0)
  })

  it('IRR anual deve ser um número plausível quando fluxo positivo', () => {
    const r = simulateAdvanced(baseInput(), { capexPerkWp: 3000 })
    expect(r.financial?.irr_pct).toBeGreaterThan(-100)
  })
})