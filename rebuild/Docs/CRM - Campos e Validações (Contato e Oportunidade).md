# CRM — Campos e Validações (Contato e Oportunidade)

Objetivo: consolidar os campos que serão usados no módulo /solar, mapeando de onde vêm, onde são persistidos e validações essenciais para implementação de autosave, UX e cálculos.

## 1) Contato (antigo Lead)

- Identificação
  - id (uuid)
  - nome completo — obrigatório (min 3, max 120)
  - email — obrigatório (formato RFC 5322 simplificado)
  - telefone — obrigatório (E.164 ou BR com máscara)
  - cpf — opcional (formato 000.000.000-00; DV válido)
- Endereço
  - cep — opcional (00000-000)
  - rua, numero, complemento, bairro — opcionais
  - cidade — recomendado (prefill para Localização)
  - uf — recomendado (UF/BR; 2 letras)
- Consumo de energia
  - consumo_medio_kWh — opcional (derivado do histórico quando houver)
  - historico_mensal: lista de entradas {mes: 1-12, ano: YYYY, kWh: > 0}
    - tamanho esperado: 12–24 (fallback: 6–12)
    - crescente temporal (ordenada por ano/mes)
- Preferências/Concessionária (defaults)
  - distribuidora (string) — default para Oportunidade
  - uf (string, UF BR)
  - classe (Residencial/Comercial/Rural/…)
  - grupo/subgrupo (A/B e subgrupo quando aplicável)
  - tipo_ligacao (Monofásico/Bifásico/Trifásico)
  - numero_instalacao (string/dígitos)
  - numero_cliente (string/dígitos)

Observações
- Dados de concessionária devem ser efetivamente persistidos na Oportunidade; aqui funcionam como defaults de preenchimento.

## 2) Oportunidade (daquele Contato)

- Relacionamento
  - id (uuid)
  - contact_id (uuid) — obrigatório (vínculo com Contato)
  - responsavel_user_id (uuid) — opcional
  - status (enum: aberto, em_andamento, ganho, perdido)
- Concessionária (persistido na Oportunidade)
  - distribuidora (string) — obrigatório
  - uf (UF/BR) — obrigatório
  - classe (Residencial/Comercial/Rural/…) — obrigatório
  - grupo/subgrupo — quando aplicável
  - tipo_ligacao (Monofásico/Bifásico/Trifásico) — obrigatório
  - numero_instalacao (string/dígitos) — obrigatório
  - numero_cliente (string/dígitos) — opcional
  - vigencia_tarifa (data ou label) — opcional
  - bandeira_tarifaria (enum) — opcional
  - tarifa_concessionaria_id (uuid) — opcional (chave para tabela de tarifas)
- Parâmetros de Simulação
  - potencia_kWp (> 0) — recomendado
  - geracao_anual_kWh (>= 0) — se fornecida ou derivada
  - serie_mensal_kWh[12] (>= 0) — opcional (PV*Sol/import)
  - perdas_percent (0–30%)
  - fator_simultaneidade (0–1)
  - aumento_consumo_percent (-50% a +300%)
  - ano_instalacao (YYYY)
  - anos_projecao (1–30)
  - inflacao_aa (0–20%)
  - reajuste_tarifario_aa (0–20%)
  - taxa_desconto_aa (0–50%)
  - deprec_fv_aa (0–5%)
  - custo_om_aa (>= 0)
- Equipamentos
  - solar_module_ids[] — opcional
  - inverter_ids[] — opcional
  - battery_specs (capacidade_kWh, pot_max_kW, marca/modelo) — opcional
- Metadados
  - created_at, updated_at (ISO)

Observações
- Prefill: ao criar a Oportunidade a partir de um Contato, copiar defaults de concessionária e endereço para acelerar o preenchimento.
- Série mensal: quando existir, usar no resumo e sinalizar “usar série mensal”.

## 3) Validações Essenciais (resumo)

- Strings aparadas (trim) e normalização de caixa (UF).
- Telefones e documentos validados com máscaras e DVs quando aplicável.
- Histórico mensal sem meses duplicados e ordenado.
- Campos obrigatórios por etapa (Contato básico vs. Oportunidade para cálculo).
- Valores percentuais e faixas numéricas respeitando limites indicados.