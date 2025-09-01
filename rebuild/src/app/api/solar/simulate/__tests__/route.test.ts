import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { POST } from '../route'

// Garantir que a rota não exija autenticação em ambiente de teste
let prevClerkKey: string | undefined
beforeAll(() => {
  prevClerkKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
  delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
})
afterAll(() => {
  if (prevClerkKey !== undefined) process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = prevClerkKey
  else delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
})

function makeValidPayload() {
  return {
    consumption: { averageMonthly_kWh: 250 },
    technical: { performanceRatio_pct: 0.78, lossesEnvironmental_pct: 8, lossesTechnical_pct: 7, targetCompensation_pct: 95 },
    tariff: { TE: 0.5, TUSD: 0.3, taxes: { ICMS_pct: 18, PIS_pct: 1.65, COFINS_pct: 7.6 } },
  }
}

describe('POST /api/solar/simulate', () => {
  it('retorna 200 e dados de simulação com payload válido', async () => {
    const req = new Request('http://localhost/api/solar/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(makeValidPayload()),
    })

    const res = await POST(req as Request)
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json.data).toBeDefined()
    expect(json.data.recommendedPower_kWp).toBeGreaterThan(0)
    expect(json.data.monthlyGeneration_kWh).toHaveLength(12)
    expect(json.data.estimatedSavings_monthly_BRL).toBeGreaterThan(0)
  })

  it('retorna 400 com payload inválido', async () => {
    const req = new Request('http://localhost/api/solar/simulate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })

    const res = await POST(req as Request)
    expect(res.status).toBe(400)
    const json = await res.json()
    expect(json.error).toBeDefined()
  })
})