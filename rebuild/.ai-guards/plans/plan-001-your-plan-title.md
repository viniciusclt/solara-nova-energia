---
id: plan-001
title: Plano — Módulo Fotovoltaico (F4)
createdAt: 2025-08-30
author: viniciusclt
status: ready
---

## 🧩 Scope
Foco exclusivo no Módulo Fotovoltaico (F4): dimensionamento e simulação técnico‑econômica, catálogo de equipamentos, importação PV*Sol (MVP) e geração de proposta. Integrar com CRM (Lead/Contact/Opportunity) e Proposals já existentes, mantendo arquitetura modular, testável e escalável.

## ✅ Functional Requirements
- Calculadora Solar (CalculadoraSolarService):
  - Dimensionamento por consumo mensal e/ou série mensal; níveis de precisão: Básico, Preciso, Import PV*Sol.
  - Restrições elétricas (tensão/corrente por string, MPPT, oversize) e perdas (sombreamento/temperatura/cabos/soiling).
  - Regras Lei 14.300: Fio B, créditos (60 meses, FIFO), custo de disponibilidade, bandeiras.
  - Análises financeiras: VPL, TIR, payback simples e descontado, fluxo de caixa.
- Catálogo de equipamentos: CRUD de SolarModule e Inverter (fabricante, modelo, potência, dados elétricos/físicos/garantias).
- Import PV*Sol (MVP): upload (JSON já funcional), mapear módulos/inversores/perdas/série mensal; evoluir para ZIP/XML.
- Integração com tarifas: base de TarifaConcessionaria; seleção por UF/concessionária/classe.
- UI /solar: abas para Seleção, Módulos, Inversores, Baterias (stub), Perdas, Resultados, Proposta.
- Resultados: geração anual/mensal, indicadores financeiros, validações e avisos.
- Proposta: pré‑visualização e exportar PDF (A4) com dados da simulação e catálogo.

## ⚙️ Non-Functional Requirements
- Performance: cálculos em <150ms para cenários comuns; evitar re‑renders desnecessários.
- Confiabilidade: serviço puro TypeScript, 100% determinístico; testes unit/integration cobrindo fórmulas críticas.
- Segurança: validação Zod, limites de upload e parsing seguro; autenticação Clerk; RBAC simples (owner/team).
- UX/A11y: componentes acessíveis (WCAG), feedbacks claros e estados de erro.
- Observabilidade: logs de cálculo (dev), métricas de uso (futuro).

## 📚 Guidelines & Packages
- Stack: Next 15, React 18, TypeScript, Tailwind, Zustand (estado local), Zod, Prisma + PostgreSQL, Clerk, MinIO (storage).
- Utilitários: date-fns, clsx, possivelmente chart básico (opcional) para série mensal.
- Padrões: serviços puros em src/core/services; tipos em src/core/types; UI em src/app/solar; APIs em src/app/api/solar/*.

## 🔐 Threat Model (Stub)
- Upload/Parsing: tipo e tamanho de arquivo; evitar XML Entity Expansion/XXE; sanitizar campos.
- Injeção/DoS: validação Zod; limites de requisições e tempo de cálculo; evitar loops caros.
- Autorização: isolar dados por usuário/organização; checagens server‑side nas APIs.
- PII: dados de lead/contato minimizados na proposta e protegidos em trânsito/repouso.

## 🔢 Execution Plan
1. ✅ Tipos e DTOs (src/core/types/solar.ts): SolarModule, Inverter, parâmetros de simulação, resultados.
2. ⏳ CalculadoraSolarService (src/core/services/solar/CalculadoraSolarService.ts):
   - ✅ Cálculos de geração e perdas (MVP); ⏳ restrições elétricas; ⏳ Fio B e créditos; ⏳ VPL/TIR/paybacks.
   - ✅ Testes unitários com casos base e borda.
   - ✅ Implementado como src/core/services/CalculationService.ts (MVP de geração/perdas).
3. ✅ TarifaService (src/core/services/TariffService.ts): cálculo de tarifa efetiva (MVP) + testes. (Consulta/bandeiras: próximo)
4. ⏳ CRUD Equipamentos:
   - ⏳ Prisma schema já contempla entidades relacionadas; expor rotas /api/solar/modules e /api/solar/inverters.
   - ⏳ UI "Gerenciar Catálogo" (básica) com lista + form inline.
6. ⏳ UI /solar:
   - ✅ Abas e formulários; integração com CalculadoraSolarService; estados de precisão; validações e avisos.
   - ✅ Seção 'Perdas' com Estrutura Tarifária refatorada (TariffForm)
   - ✅ Exibir indicadores, série mensal (gráfico opcional) e seção de proposta.
7. ⏳ Proposta:
   - ⏳ Montar payload para /api/proposals; pré‑visualização e PDF A4; rastreabilidade de IP e data e hora de visualizacao.
8. ⏳ Integração CRM:
   - ⏳ Linkar Lead/Contact/Opportunity quando presente; salvar referência na Proposal.
9. ⏳ Testes e Qualidade:
   - ✅ Unit (serviços); ⏳ integração (APIs), ⏳ smoke de UI /solar.
10. ⏳ Documentação:
    - ⏳ Atualizar Docs/Plan.md e Docs/KNOWLEDGE_FILE.md com decisões e endpoints.
11. ⏳ Visual Refresh:
    - ✅ Implement modern, clean interface using shadcn/ui components
    - ⏳ Update color scheme to match system identity
    - ⏳ Ensure consistent spacing and visual hierarchy

12. ⏳ Consumption Calculator Enhancement:
    - ⏳ Redesign with balanced color palette
    - ✅ Pre-populate equipment database with standard consumption values
    - ✅ Implement intuitive equipment categorization
    - ✅ Add visual indicators for consumption impact
    - ✅ Create responsive grid layout for equipment items

13. ⏳ Progressive Summary System:
    - ✅ Design dedicated summary panel
    - ✅ Implement state persistence across steps
    - ✅ Create clear information hierarchy
    - ⏳ Add progress indicators
    - ✅ Integrate with existing calculation service

14. ⏳ Visual Elements Update:
    - ⏳ Refresh icon system using Phosphor icons
    - ⏳ Update graphical elements and illustrations
    - ⏳ Implement consistent spacing system
    - ✅ Add micro-interactions and hover states
    - ✅ Extrair o card "Resumo da Simulação" para componente reutilizável e adicionar indicador de progresso no próprio card.
    - Unificar sistema de ícones (decidir: Phosphor vs. Lucide) e documentar guidelines.
    - ✅ Criar tokens de design (cores, espaçamentos, sombras) centralizados para garantir consistência.
    - 


## 🎯 UI/UX Improvements

### Lead Management
- ✅ Implement auto-search functionality for leads:
  - ✅ Real-time search by name, email, or phone
  - ✅ Remove manual "Select Existing Lead" button
  - ✅ Integrate with existing CRM data
- ⏳ Address lookup:
  - ✅ Automatic address population via CEP integration
  - ⏳ Validate and format addresses
- ⏳ Equipment consumption tracking:
  - ⏳ Enhanced form for adding consumption devices
  - ⏳ Fields: device type, power rating, usage hours/day, days/month, months/year
  - ⏳ Real-time consumption calculations

### Simulation Interface
- ⏳ Unified simulation view using shadcn/ui:
  - ⏳ Left panel: Equipment selection
    - ⏳ Solar modules
    - ⏳ Inverters
    - ⏳ Quantity controls
    - ⏳ "Manage" button for CRUD operations
  - ⏳ Right panel: Live results
    - ⏳ Performance metrics
    - ⏳ Loss calculations
    - ⏳ Financial indicators
- ✅ Remove separate finalization step
- ⏳ Equipment management:
  - ⏳ Modal-based CRUD interface
  - ⏳ Consistent forms for modules/inverters/batteries
  - ⏳ Validation and error handling

### Technical Requirements
- ⏳ Implement using shadcn/ui component library
- ⏳ Ensure responsive design
- ⏳ Maintain accessibility standards
- ⏳ Add loading states and error boundaries
- ⏳ Optimize performance with proper state management
