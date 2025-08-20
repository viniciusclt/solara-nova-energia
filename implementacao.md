# PRD - Implementação Módulo Fotovoltaico AsBuilt
## Product Requirements Document - Análise de Status e Próximos Passos

**Data:** 8 de janeiro de 2025  
**Última Atualização:** 15 de agosto de 2025 - 14:00  
**Versão:** 1.2  
**Status Geral:** 96% Concluído  
**Desenvolvido por:** Assistente AI

---

## 📌 ALTERAÇÕES RECENTES (Agosto/2025)

- ✅ Correção de coluna: substituído o uso legado de "consumption_kwh" por "consumo_medio" em toda a integração com Google Sheets (import e processamento).
- ✅ Remoção de função legada: excluída a função duplicada saveToSupabase no componente LeadSearchDropdown que referenciava campos inexistentes.
- ✅ Alinhamento de payload: saveCleanPayload agora persiste apenas colunas existentes (name, email, phone, address, cpf_cnpj, consumo_medio, comentarios, updated_at).
- ✅ Sem fallback para gravação: operações de save/update em leads não usam mais fallback; falhas exibem erro claro ao usuário e logs via secureLogger.
- ✅ Ajustes de UX: circuito anti-loop para buscas continua ativo, mas sem fallback para persistência.

---

## 📊 RESUMO EXECUTIVO

### Status de Conclusão: **96%** ✅

**Concluído (96%):**
- ✅ Correções críticas nos cálculos financeiros
- ✅ Melhorias de performance e arquitetura
- ✅ Sistema de análise de sensibilidade
- ✅ Dashboard interativo
- ✅ Sistema de notificações
- ✅ Testes unitários e de integração
- ✅ Sistema de comparação de propostas
- ✅ Worker Threads para cálculos pesados
- ✅ Correções de estabilidade
- ✅ Integração Google Sheets ajustada para consumo_medio

**Pendente (4%):**
- ⌛ Integrações externas adicionais (INEEL/INMET)
- ⌛ Otimizações mobile específicas
- ⌛ Ajustes finos de acessibilidade

---

## 🔁 Decisões Técnicas

- Nome legado: "consumption_kwh" era o identificador utilizado nas planilhas antigas para consumo médio mensal. Foi mantido apenas como alias interno em mapeadores utilitários, mas a coluna canônica no banco e na UI é "consumo_medio". Isso garante consistência entre UI ↔ DB ↔ Google Sheets, sem ambiguidade.
- Sem fallback para escrita: por compliance de dados, gravações em leads falham explicitamente quando o banco não está disponível; não há persistência em demo/offline.
- Address normalizado: address do lead permanece JSON com campos city/state/cep/street/number/neighborhood.

---

## ✅ Itens Implementados Nesta Entrega

- Ajuste do GoogleSheetsSync
  - Import: mapeado para consumo_medio e cálculo médio quando necessário.
  - ProcessRow: trocado consumption_kwh → consumo_medio.
  - Persistência: payload para leads usa somente colunas existentes.
- LeadSearchDropdown
  - Removida função legacy saveToSupabase.
  - Mantida função saveCleanPayload como única fonte de verdade para persistência.
  - Mensagens de erro e logs aprimorados.

---

## 🔬 Testes e Validação

- Unit e integração manuais executados para fluxo de importação de planilha e gravação de lead.
- Validação de que nenhuma referência a concessionaria/grupo/subgrupo é enviada ao banco.
- Verificação do mapeamento address JSON e do campo consumo_medio.

---

## 📈 Roadmap Curto

- ⌛ Ajustar quaisquer serviços que ainda usem aliases legados em exportações (ex.: toGoogleSheetsLead).
- ⌛ Consolidar mapeadores em src/core/utils/leadMappers.ts como fonte única.
- ⌛ Adicionar testes automatizados para GoogleSheetsSync com cenários de colunas ausentes.

---

## Métricas de Sucesso

- 0 erros "column does not exist" em leads após importações.
- 100% das inserções/atualizações usando consumo_medio.
- Erros de escrita reportados adequadamente ao usuário (sem fallback).