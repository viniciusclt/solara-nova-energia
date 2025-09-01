---
id: plan-002
title: Alinhamento do Módulo Solar (/solar): Persistência, UX, Cálculo e Conformidade
createdAt: 2025-09-01
author: viniciusclt
status: in_progress
---

## 🧩 Escopo

Analisar e alinhar a página /solar (fotovoltaico) aos requisitos funcionais e documentais: persistência de dados do Lead/Oportunidade, histórico de consumo e dados da concessionária, correções de UX (contraste/overflow), ordem das abas e preenchimento de localização, resumo dinâmico, remoção de duplicações, validação do cálculo financeiro segundo Docs e identificação do que falta implementar.

## ✅ Requisitos Funcionais (com status)

- 🔜 Persistir alterações do Lead ao navegar entre abas/etapas e no botão Próximo; cada Oportunidade/Proposta vinculada a um Lead/Contato (autosave + linkagem obrigatória).
- 🔜 Em Lead, exibir Histórico de Consumo (jan–dez) + consumo médio + dados da concessionária: fornecimento, classe/grupo/subgrupo, concessionária, nº do cliente, nº da instalação, etc. (armazenar no contato).
- ✅ Aumento de Consumo: corrigir modal para não ter fundo preto/estouro e manter ações acessíveis (Dialog com overlay e foco). Validar visual em diferentes tamanhos de tela.
- 🔜 Simulação Técnica: primeira sub-aba = “Equipamentos” (default) e “Localização” pré-preenchida a partir dos dados do Lead, com possibilidade de edição.
- 🔜 Garantir contraste AA (WCAG) em todos os campos/botões (ex.: “Configuração dos Módulos Solares”).
- ⌛ Resumo preenchendo dinamicamente conforme dados são inseridos; quando necessário, indicar “precisa resimular” e preencher valores incrementais já disponíveis.
- ✅ Eliminar duplicação do “Resumo da Simulação” via componente único reutilizável; continuar reduzindo duplicações em page.tsx (> 2000 linhas).
- 🔜 Validar cálculo financeiro conforme Docs, ajustar fórmulas e criar testes (unitários) para NPV, TIR, payback e economias.
- 🔜 Auditar Docs para listar funcionalidades da /solar ainda não implementadas e planejar sua entrega.

## ⚙️ Requisitos Não Funcionais

- Acessibilidade: WCAG AA (contraste, foco, rótulos, teclado).
- Performance: evitar re-renderizações e listas longas sem virtualização; evitar cálculos pesados na UI.
- Qualidade: TypeScript estrito, lint, type-check, testes unitários para cálculos.
- UX: SSR/hidratação estáveis no Next.js; responsividade.

## 📚 Diretrizes & Pacotes

- Estado/bus: Zustand para persistência de formulário (lead/consumo) entre abas; shadcn/ui para base UI; lucide-react como biblioteca única de ícones; zod para validação; fetch/REST para autosave (/api/contacts, /api/proposals).
- Tokens centralizados de design já criados; expandir uso nos botões e inputs com baixo contraste.

## 🔐 Ameaças e Mitigações (Threat Model)

- PII do Lead: validação/normalização de entradas; não logar dados sensíveis.
- Autosave: rate limit e debouncing; retries idempotentes.
- Integrações (geocoding, quando houver): evitar SSRF; timeouts.

## 🔢 Detailed Execution Plan

1) Discovery and Requirements Analysis
   - Review Docs thoroughly to identify all Lead/Opportunity fields:
     * Required personal information
     * Energy consumption patterns
     * Utility company data structure
   - Document financial formulas with example calculations
   - Create validation checklist for each field


2) Data Model and Persistence Implementation
   - Database Schema Updates:
     * Add monthly consumption history (12 months) to Contact model
     * Add utility company fields (provider, group, installation number)
     * Create foreign key constraint Lead -> Opportunity
   - Implement Zustand Store:
     * Create separate stores for form state and API communication
     * Add debounce utility (lodash.debounce @ 1000ms)
     * Implement error handling for failed saves
   - Add API endpoints with proper validation

3) UX/Visual Refinements
   - Tab Order and Navigation:
     * Move "Equipment" tab to first position
     * Implement tab persistence using URL parameters
     * Add loading states during tab transitions
   - Location Auto-fill:
     * Create mapping between Lead fields and Location form
     * Add manual override capability
   - Contrast Improvements:
     * Use design tokens from theme.ts
     * Test with WCAG color contrast analyzer
     * Document color combinations in storybook
   - Consumption Increase Modal:
     * Implement focus trap using Focus Trap React
     * Add proper overflow handling with CSS
     * Test across breakpoints (320px to 1440px)

4) Dynamic Summary Implementation
   - Create computation pipeline:
     * Identify independent vs dependent calculations
     * Implement progressive calculation strategy
     * Add "needs recalculation" indicators
   - State Management:
     * Track dirty fields that trigger recalculation
     * Implement optimistic updates where possible
   - Feature Flags:
     * Add auto-simulation toggle
     * Configure based on calculation complexity

5) Financial Calculations
   - Implementation:
     * Create separate calculation modules for NPV, IRR, payback
     * Use decimal.js for precise calculations
     * Add input validation and error boundaries
   - Testing:
     * Write Jest tests with multiple scenarios
     * Include edge cases and error conditions
     * Add performance benchmarks
   - Documentation:
     * Create calculation flowcharts
     * Document assumptions and limitations

6) Code Modularization
   - Component Extraction:
     * Create component folder structure
     * Extract shared logic into custom hooks
     * Implement proper prop typing
   - Components to create:
     * LeadPanel (with form validation)
     * TechnicalSimulationTabs (with context)
     * EquipmentManager (with state management)
     * BatteryManager (with calculations)
     * TariffForm (with validation)
     * ConsumptionControls (with charts)
     * ProposalSection (with PDF generation)

7) Documentation Updates
   - Technical Documentation:
     * Update API documentation
     * Add component usage examples
     * Document state management patterns
   - Product Documentation:
     * Update PRD with implemented features
     * Create feature coverage matrix
     * Document known limitations
   - Knowledge Base:
     * Add troubleshooting guides
     * Create FAQ section

8) Quality Assurance
   - Static Analysis:
     * Run ESLint with strict config
     * Ensure 100% TypeScript coverage
     * Check for circular dependencies
   - Testing:
     * Run unit tests (Jest)
     * Perform integration tests
     * Execute E2E tests (Cypress)
   - Accessibility:
     * Run aXe for WCAG compliance
     * Test with screen readers
     * Verify keyboard navigation
   - Performance:
     * Run Lighthouse audits
     * Check bundle sizes
     * Monitor React DevTools

Total Estimated Time: 26-32 days
Dependencies: Design system access, API documentation, Financial calculation specifications
Risk Factors: API changes, Complex state management, Performance with large datasets

## 🎯 Critérios de Aceite

- Autosave funcional entre abas e em Próximo; oportunidades sempre vinculadas a um Lead.
- Lead exibe série jan–dez + dados completos da concessionária.
- Abas com “Equipamentos” primeiro e Localização vinda do Lead.
- Contraste AA em todos os controles; modal de Aumento de Consumo sem overflow.
- Resumo se atualiza progressivamente e sinaliza necessidade de resimulação.
- Cálculo financeiro batendo com Docs + testes passando.
- Redução clara de duplicações e arquivos modularizados.
