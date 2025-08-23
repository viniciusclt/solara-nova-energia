# PRD — Editor Unificado de Diagramas (Flowchart/BPMN, Organograma, MindMap)

1) Visão Geral e Objetivos
- Construir um editor unificado em /flowcharts/editor com seletor de tipo (Flowchart/BPMN, Organograma, MindMap), mantendo o tema atual e look-and-feel MindMeister/draw.io.
- Prover importação compatível com draw.io (.drawio, .drawio.html), HTML e Mermaid; e geração por Texto/NLP com mini-DSL determinística em PT-BR.
- Persistência com versionamento, rascunho e escopos de compartilhamento (privado, equipe por papéis, público via link) com RBAC: view para todos; create/edit/delete/share apenas para SuperAdmin e Engenharia.

2) Personas e Papéis (RBAC)
- SuperAdmin, Engenharia: create, edit, delete, share, export, comment, view.
- Vendedor, Instalador, Outros: view (mínimo). Proposta: comment/export opcionais (confirmar política). Por padrão manter: view + export permitidos (confirmar).

3) Escopo Funcional
A. Editor Unificado (/flowcharts/editor)
- Seletor de tipo; Node/Edge Registry único; store Zustand única; atalhos padrão; paleta de nós e templates prontos.
- Tipos suportados:
  - Flowchart/BPMN 2.0 (tarefas, eventos, gateways, lanes básicas).
  - Organograma (nó pessoa/área, vínculo hierárquico, metadados de cargo/time).
  - MindMap (nó central, filhos, expansão/colapso, ramos coloridos).

B. Importação
- Entradas: .drawio, .drawio.html, XML, HTML e Mermaid.
- Mapeamento para modelo unificado (nodes, edges, metadata, viewport) com validações por tipo.

C. Geração por Texto/NLP (mini-DSL PT-BR)
- MindMap: "Raiz: Filho 1, Filho 2; Filho 1: Neto 1".
- Organograma: "CEO > VP Engenharia > Eng. Sr".
- BPMN simplificado: "Início -> Tarefa X -> Decisão? sim: Caminho A; não: Caminho B -> Fim".
- Parser determinístico (sem LLM), extensível para integração futura com LLM.

D. Persistência e Versões
- Entidades: diagrams, diagram_versions, diagram_permissions, shares.
- Estados: rascunho/publicado; versionLabel semântico; thumbnail gerado no front.
- Escopos de compartilhamento: privado; por equipe (papéis); público via link com expiração.

E. RBAC
- View para todos os papéis autenticados; público via link opcional.
- Create/Edit/Delete/Share restritos a SuperAdmin e Engenharia.
- Comentários e Export: permitido a todos (ajustável via política). Confirmar: manter export aberto.

4) Requisitos Não Funcionais
- Performance: render estável com 500–1000 nós moderados; virtualização/otimizações; webworkers opcionais para parsing/import.
- UX/A11y: atalhos padronizados; contraste e foco; suporte teclado; toque básico.
- Observabilidade: logs seguros; métricas de uso.
- Segurança: nada sensível em client; chaves apenas em .env e .env.example; checagem RBAC em todas as ações de mutação.

5) Critérios de Aceite
- Usuário de Engenharia cria, edita, compartilha e versiona um diagrama.
- Vendedor/Instalador acessam em modo somente leitura (e conseguem exportar se política permitir).
- Importadores: arquivos de exemplo .drawio.html (fornecidos) importam com alto grau de fidelidade (>90% das formas/links principais).
- Geração por DSL cria estruturas válidas para os 3 tipos com feedback de erro claro.

6) Métricas de Sucesso
- Tempo de criação/importação < 3s para diagramas médios.
- Nenhuma ação de mutação disponível para papéis sem permissão.
- Taxa de erro de importação crítica < 5% nos exemplos de referência.

7) Fora do Escopo (Fase 1)
- Colaboração em tempo real multi-usuário.
- Auditoria avançada com trilha completa de mudanças.

8) Riscos e Mitigações
- Divergência de modelos: padronizar Registry e validadores por tipo.
- Import draw.io: começar por subconjunto principal de formas e evoluir com mapeamento extensível.
- RBAC inconsistente: centralizar em Hook e Service únicos e testes de permissão.