# Fluxo — Editor Unificado (Mermaid)

```mermaid
flowchart TD
  A[Entrar em /flowcharts/editor] --> B{Existe ID?}
  B -- Não --> C[Inicializar documento novo + tipo padrão]
  B -- Sim --> D[Carregar documento existente]
  C --> E[Checar RBAC do usuário]
  D --> E
  E -->|Sem permissão de edição| F[Modo leitura: desabilitar mutações]
  E -->|Pode editar| G[Habilitar criar/editar/deletar/compartilhar]
  F --> H[Importar? draw.io/html/mermaid]
  G --> H
  H --> I{Arquivo/TexTO}
  I -->|Arquivo| J[Parser Importador]
  I -->|DSL| K[Parser DSL]
  J --> L[Normalizar nodes/edges]
  K --> L
  L --> M[Validar por tipo (BPMN/Org/MindMap)]
  M --> N[Carregar na Store]
  N --> O[Salvar]
  O --> P[Versionar + Thumbnail]
  P --> Q{Compartilhar?}
  Q -- Não --> R[Fim]
  Q -- Sim --> S[Definir escopo (privado/equipe/público)]
  S --> T[Registrar permissões/link]
  T --> R
```