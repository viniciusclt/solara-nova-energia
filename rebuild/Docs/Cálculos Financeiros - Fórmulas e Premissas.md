# Cálculos Financeiros — Fórmulas e Premissas (Item 1)

Objetivo: consolidar fórmulas, entradas e premissas para implementação e testes do CalculationService.

## 1) Entradas Principais
- Investimento inicial I0 (R$)
- Séries anuais de economia líquida E_t (R$, t=1..N)
- Taxa de desconto r (a.a.)
- Horizonte N (anos)
- Parâmetros tarifários (TUSD, TE, PIS/COFINS, ICMS por faixas, COSIP por faixas)
- Regras: Fio B (Lei 14.300), custo de disponibilidade, créditos FIFO 60 meses

## 2) Fórmulas
- Tarifa final (ANEEL, simplificada por kWh):
  TF = (TUSD + TE) * (1 + PIS + COFINS) * (1 + ICMS_faixa) + COSIP_faixa / Consumo_mensal
- Economia mensal aproximada:
  Econ_m = max(0, Consumo_m - (Consumo_m - Geração_compensada)) * TF - Custo_Disponibilidade
- VPL (NPV):
  VPL = -I0 + Σ_{t=1..N} (E_t / (1 + r)^t)
- TIR (IRR): solução de r* tal que:
  0 = -I0 + Σ_{t=1..N} (E_t / (1 + r*)^t)
  - Método: Newton-Raphson com fallback bisseção (limites [0, 100%])
- Payback Simples: menor t com Σ E_t >= I0
- Payback Descontado: menor t com Σ (E_t / (1 + r)^t) >= I0 (com interpolação linear)

## 3) Premissas e Detalhes
- Fio B: percentuais por ano de entrada em operação (2023:15%, 2024:30%, ..., 2028:100%; 2029+: 100% desde início) aplicados sobre TUSD B na energia compensada.
- Créditos de energia: validade 60 meses; fila FIFO por kWh excedente; abater primeiro créditos vencendo.
- Custo de disponibilidade: aplicar mínimo por tipo de ligação (mono/bi/tri) mensalmente quando compensação reduzir fatura abaixo do mínimo.
- ICMS/COSIP: aplicar por faixas de consumo (ex.: RJ), parametrizável por UF e vigência; COSIP rateado por kWh consumido.
- Degradação FV: deprec_fv_aa impacta geração anual; reajuste_tarifario_aa impacta tarifa ao longo do tempo.
- Inflação: usar taxa para atualizar O&M e eventualmente deflacionar/nominalizar conforme estratégia.

## 4) Exemplos Numéricos (esqueleto)
- Cenário A (Residencial RJ 2024): preencher com dados de fixtures e validar ±1 p.p. TIR.
- Cenário B (Comercial RJ 2023): idem, sensibilidade +/−10% tarifa.

## 5) Saídas
- VPL, TIR, Payback simples e descontado, economia anual, série de fluxo de caixa ano a ano, logs de cálculo para auditoria.