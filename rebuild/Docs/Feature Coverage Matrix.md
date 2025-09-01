# Feature Coverage Matrix

Status legend: ✅ Concluído · ⌛ Em andamento · 🔜 Pendente

Última atualização: 2025-09-01

Esta matriz rastreia a cobertura de funcionalidades por área/página, seu status atual e referências nos Docs. Use-a para priorização e acompanhamento.

| Área | Funcionalidade | Status | Página/Path | Fonte (Docs) | Critério de Aceite (resumo) | Testes | Observações |
|---|---|:---:|---|---|---|---|---|
| Navegação | Sidebar reorganizada por grupos | ✅ | src/app/_components/AppShell.tsx | Docs/Plan.md | Grupos Início/Comercial/Projetos/Treinamentos; Config no rodapé | - | Implementado conforme Plan.md |
| /solar | Vínculo com Lead/Contato obrigatório na Opportunity | ⌛ | src/app/solar/page.tsx | Docs/Plan.md (F5) | Sempre associar simulação a um Lead/Contato | E2E básico | Vínculo existe parcial; precisa endurecer validações |
| /solar | Autosave entre abas (Lead/Simulação/Proposta) | 🔜 | src/app/solar/page.tsx | plan-002, Docs/Plan.md | Mudanças persistem ao trocar abas e no botão Próximo | Unit de store | Usar Zustand + debounce 1000ms |
| /solar | Histórico de consumo (12–24 meses) exibido | 🔜 | (UI a definir) | Docs/Plan.md (F5) | Gráfico mensal + médias; fallback 6–12m | Unit de formatação | Tipos prontos; UI pendente |
| /solar | Dados da concessionária por Oportunidade (provider, grupo/subgrupo, fornecimento, nº instalação/cliente) | 🔜 | prisma/schema.prisma | PRD Implementação, Plan.md | Campos gravados e usados no cálculo | Unit dos mapeamentos | Guardar na Opportunity; Contact como default |
| /solar | “Aumentar Consumo” (modal sem overflow, acessível) | ✅ | src/app/solar/page.tsx | plan-002 | Overlay/foco corretos; sem estouro em breakpoints | - | Usar Radix Dialog (shadcn/ui) |
| /solar | Simulação Técnica: aba “Equipamentos” como padrão | 🔜 | src/app/solar/page.tsx | plan-002, Plan.md | Primeira aba selecionada por padrão | Unit simples | Persistir aba via URL opcional |
| /solar | Localização com prefill a partir do Lead | 🔜 | src/app/solar/page.tsx | Plan.md (F5) | Cidade/UF preenchidos e editáveis | Unit do mapeamento | Considerar geocoding futuro |
| /solar | Contraste AA (WCAG) em inputs/botões | 🔜 | src/app/solar/* | backlog.md, KNOWLEDGE_FILE.md | Sem violações críticas no aXe | aXe checks | Aplicar tokens de design |
| /solar | Resumo dinâmico progressivo | ⌛ | src/app/solar/page.tsx | plan-002 | Atualiza conforme entradas; sinaliza “precisa resimular” | Unit de cálculo parcial | Expandir campos preenchíveis |
| /solar | Remover duplicação do “Resumo da Simulação” (componente único) | ✅ | src/app/solar/components/* | plan-002 | Um único componente reutilizado | - | Continuar modularização de page.tsx |
| /solar | Importar PV*Sol (MVP) | ✅ | src/app/solar/page.tsx | Plan.md | Upload + parsing inicial (JSON) alimenta estados | Unit do parser | handlePvsolUploaded implementado |
| Cálculo | CalculationService: Fio B (Lei 14.300), créditos FIFO (60m), ICMS/COSIP por faixas, custo de disponibilidade | 🔜 | src/core/services/* | PRD (Vibe), Descritivo Técnico, Plan.md | Regras aplicadas corretamente | Jest com fixtures | Implementar módulos de cálculo TS puro |
| Cálculo | KPIs: VPL/NPV, TIR/IRR (Newton-Raphson + bisseção), Payback (simples/descontado) | 🔜 | src/core/services/* | PRD (Vibe), Fases Impl. | KPIs batem com fixtures (±1 p.p. TIR) | Jest com cenários | Precisão com decimal.js |
| Propostas | Pré-visualização + Exportar PDF (A4) | ⌛ | src/app/solar/page.tsx | Plan.md | Exporta sem erro; layout consistente | Snapshot básico | Falta robustez e casos |
| Propostas | Link rastreável + formato 16:9 | 🔜 | (a definir) | Plan.md, PRD | Link com tracking; export 16:9 | E2E básico | Registrar evento de visualização |
| Tarifa | Seeds/CRUD TarifaConcessionaria | 🔜 | prisma/*, src/server/* | Fases Impl., PRD | Seleção por UF/distribuidora/classe e vigência | Unit de repos | Cache simples em memória |
| Qualidade | Modularização de page.tsx (>2000 linhas) | ⌛ | src/app/solar/page.tsx | plan-002 | Extração em subcomponentes/hooks | - | Fatiar por contexto (Lead, Técn., Resumo, Proposta) |
| Testes | Testes unitários de cálculo financeiro | 🔜 | tests/unit/* | Plan.md, PRD | Todos os cenários passando | Jest | Cobrir bordas (2022, 2024, 2029+) |
| Auditoria | Auditoria de gaps vs Docs | 🔜 | Docs/* | plan-002 | Lista de gaps priorizada | - | Basear-se em Plan.md (F5) |

## Como atualizar
- Atualize “Status” (✅/⌛/🔜) conforme entregas.
- Inclua novas linhas ao adicionar features.
- Vincule a “Fonte (Docs)” para rastreabilidade e mantenha os “Critérios de Aceite” sintetizados.
- Mantenha datas e paths atualizados para facilitar navegação.