// ============================================================================
// Playbook Types - Tipos TypeScript para sistema de playbooks
// ============================================================================

// ============================================================================
// Core Types
// ============================================================================

/**
 * Tipos de blocos disponíveis no editor
 */
export type PlaybookBlockType = 
  | 'paragraph'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bulleted_list'
  | 'numbered_list'
  | 'todo'
  | 'toggle'
  | 'quote'
  | 'divider'
  | 'code'
  | 'image'
  | 'video'
  | 'file'
  | 'table'
  | 'callout'
  | 'bookmark'
  | 'embed'
  | 'equation'
  | 'template_button'
  | 'synced_block'
  | 'column_list'
  | 'column';

/**
 * Tipos de formatação de texto
 */
export interface PlaybookTextFormat {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  color?: string;
  backgroundColor?: string;
  link?: string;
}

/**
 * Conteúdo de texto com formatação
 */
export interface PlaybookRichText {
  type: 'text';
  text: {
    content: string;
    link?: {
      url: string;
    };
  };
  annotations: PlaybookTextFormat;
  plain_text: string;
  href?: string;
}

/**
 * Propriedades específicas de cada tipo de bloco
 */
export interface PlaybookBlockProperties {
  // Paragraph
  paragraph?: {
    rich_text: PlaybookRichText[];
    color?: string;
  };
  
  // Headings
  heading_1?: {
    rich_text: PlaybookRichText[];
    color?: string;
    is_toggleable?: boolean;
  };
  heading_2?: {
    rich_text: PlaybookRichText[];
    color?: string;
    is_toggleable?: boolean;
  };
  heading_3?: {
    rich_text: PlaybookRichText[];
    color?: string;
    is_toggleable?: boolean;
  };
  
  // Lists
  bulleted_list_item?: {
    rich_text: PlaybookRichText[];
    color?: string;
  };
  numbered_list_item?: {
    rich_text: PlaybookRichText[];
    color?: string;
  };
  
  // Todo
  to_do?: {
    rich_text: PlaybookRichText[];
    checked: boolean;
    color?: string;
  };
  
  // Toggle
  toggle?: {
    rich_text: PlaybookRichText[];
    color?: string;
  };
  
  // Quote
  quote?: {
    rich_text: PlaybookRichText[];
    color?: string;
  };
  
  // Code
  code?: {
    rich_text: PlaybookRichText[];
    language?: string;
    caption?: PlaybookRichText[];
  };
  
  // Image
  image?: {
    type: 'external' | 'file';
    external?: {
      url: string;
    };
    file?: {
      url: string;
      expiry_time?: string;
    };
    caption?: PlaybookRichText[];
  };
  
  // Video
  video?: {
    type: 'external' | 'file';
    external?: {
      url: string;
    };
    file?: {
      url: string;
      expiry_time?: string;
    };
    caption?: PlaybookRichText[];
  };
  
  // File
  file?: {
    type: 'external' | 'file';
    external?: {
      url: string;
    };
    file?: {
      url: string;
      expiry_time?: string;
    };
    caption?: PlaybookRichText[];
    name?: string;
  };
  
  // Callout
  callout?: {
    rich_text: PlaybookRichText[];
    icon?: {
      type: 'emoji' | 'external' | 'file';
      emoji?: string;
      external?: {
        url: string;
      };
      file?: {
        url: string;
        expiry_time?: string;
      };
    };
    color?: string;
  };
  
  // Bookmark
  bookmark?: {
    url: string;
    caption?: PlaybookRichText[];
  };
  
  // Embed
  embed?: {
    url: string;
    caption?: PlaybookRichText[];
  };
  
  // Equation
  equation?: {
    expression: string;
  };
  
  // Table
  table?: {
    table_width: number;
    has_column_header: boolean;
    has_row_header: boolean;
  };
  
  // Table Row
  table_row?: {
    cells: PlaybookRichText[][];
  };
  
  // Column List
  column_list?: Record<string, unknown>;
  
  // Column
  column?: Record<string, unknown>;
  
  // Template Button
  template?: {
    rich_text: PlaybookRichText[];
    children?: PlaybookBlock[];
  };
  
  // Synced Block
  synced_block?: {
    synced_from?: {
      type: 'block_id';
      block_id: string;
    };
    children?: PlaybookBlock[];
  };
}

/**
 * Bloco individual do playbook
 */
export interface PlaybookBlock {
  id: string;
  type: PlaybookBlockType;
  created_time: string;
  created_by: {
    id: string;
    name: string;
    avatar?: string;
  };
  last_edited_time: string;
  last_edited_by: {
    id: string;
    name: string;
    avatar?: string;
  };
  has_children: boolean;
  archived: boolean;
  parent: {
    type: 'page_id' | 'block_id';
    page_id?: string;
    block_id?: string;
  };
  properties: PlaybookBlockProperties;
  children?: PlaybookBlock[];
}

/**
 * Status de publicação do playbook
 */
export type PlaybookStatus = 'draft' | 'review' | 'published' | 'archived';

/**
 * Nível de acesso ao playbook
 */
export type PlaybookAccessLevel = 'private' | 'team' | 'company' | 'public';

/**
 * Categoria do playbook
 */
export type PlaybookCategory = 
  | 'sales'
  | 'marketing'
  | 'training'
  | 'process'
  | 'template'
  | 'guide'
  | 'policy'
  | 'other';

/**
 * Documento principal do playbook
 */
export interface PlaybookDocument {
  id: string;
  title: string;
  description?: string;
  icon?: {
    type: 'emoji' | 'external' | 'file';
    emoji?: string;
    external?: {
      url: string;
    };
    file?: {
      url: string;
      expiry_time?: string;
    };
  };
  cover?: {
    type: 'external' | 'file';
    external?: {
      url: string;
    };
    file?: {
      url: string;
      expiry_time?: string;
    };
  };
  status: PlaybookStatus;
  category: PlaybookCategory;
  accessLevel: PlaybookAccessLevel;
  tags: string[];
  version: number;
  isTemplate: boolean;
  templateId?: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  lastEditedBy: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  collaborators: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
    role: 'owner' | 'editor' | 'commenter' | 'viewer';
    addedAt: string;
  }[];
  blocks: PlaybookBlock[];
  properties: {
    [key: string]: unknown;
  };
  analytics: {
    views: number;
    uniqueViews: number;
    comments: number;
    shares: number;
    lastViewedAt?: string;
  };
}

/**
 * Template de playbook
 */
export interface PlaybookTemplate {
  id: string;
  name: string;
  description: string;
  category: PlaybookCategory;
  icon?: {
    type: 'emoji' | 'external' | 'file';
    emoji?: string;
    external?: {
      url: string;
    };
    file?: {
      url: string;
      expiry_time?: string;
    };
  };
  preview?: {
    type: 'external' | 'file';
    external?: {
      url: string;
    };
    file?: {
      url: string;
      expiry_time?: string;
    };
  };
  blocks: PlaybookBlock[];
  tags: string[];
  isPublic: boolean;
  usageCount: number;
  rating: number;
  createdAt: string;
  updatedAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

// ============================================================================
// Editor Types
// ============================================================================

/**
 * Estado do editor
 */
export interface PlaybookEditorState {
  document: PlaybookDocument;
  selectedBlockId?: string;
  isEditing: boolean;
  isDirty: boolean;
  isAutoSaving: boolean;
  lastSaved?: string;
  collaborators: {
    id: string;
    name: string;
    avatar?: string;
    cursor?: {
      blockId: string;
      position: number;
    };
    selection?: {
      blockId: string;
      start: number;
      end: number;
    };
    isActive: boolean;
    lastSeen: string;
  }[];
  comments: PlaybookComment[];
  history: PlaybookHistoryEntry[];
}

/**
 * Comentário no playbook
 */
export interface PlaybookComment {
  id: string;
  blockId: string;
  content: string;
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  replies: PlaybookComment[];
  isResolved: boolean;
  resolvedAt?: string;
  resolvedBy?: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

/**
 * Entrada do histórico de versões
 */
export interface PlaybookHistoryEntry {
  id: string;
  version: number;
  title: string;
  description?: string;
  changes: {
    type: 'block_added' | 'block_removed' | 'block_updated' | 'property_changed';
    blockId?: string;
    property?: string;
    oldValue?: unknown;
    newValue?: unknown;
    description: string;
  }[];
  createdAt: string;
  createdBy: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  snapshot: PlaybookDocument;
}

// ============================================================================
// Service Types
// ============================================================================

/**
 * Configuração do serviço de playbooks
 */
export interface PlaybookServiceConfig {
  apiUrl: string;
  supabaseUrl: string;
  supabaseKey: string;
  enableRealtime: boolean;
  enableAutoSave: boolean;
  autoSaveInterval: number;
  enableVersioning: boolean;
  maxVersions: number;
}

/**
 * Filtros para busca de playbooks
 */
export interface PlaybookFilters {
  search?: string;
  category?: PlaybookCategory;
  status?: PlaybookStatus;
  accessLevel?: PlaybookAccessLevel;
  tags?: string[];
  createdBy?: string;
  isTemplate?: boolean;
  sortBy?: 'title' | 'createdAt' | 'updatedAt' | 'views' | 'rating';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * API de playbooks
 */
export interface PlaybookAPI {
  // CRUD operations
  getPlaybooks(filters?: PlaybookFilters): Promise<PlaybookDocument[]>;
  getPlaybook(id: string): Promise<PlaybookDocument>;
  createPlaybook(data: Partial<PlaybookDocument>): Promise<PlaybookDocument>;
  updatePlaybook(id: string, data: Partial<PlaybookDocument>): Promise<PlaybookDocument>;
  deletePlaybook(id: string): Promise<void>;
  
  // Block operations
  getBlocks(playbookId: string): Promise<PlaybookBlock[]>;
  createBlock(playbookId: string, block: Partial<PlaybookBlock>): Promise<PlaybookBlock>;
  updateBlock(blockId: string, data: Partial<PlaybookBlock>): Promise<PlaybookBlock>;
  deleteBlock(blockId: string): Promise<void>;
  moveBlock(blockId: string, targetId: string, position: 'before' | 'after' | 'inside'): Promise<void>;
  
  // Template operations
  getTemplates(filters?: PlaybookFilters): Promise<PlaybookTemplate[]>;
  createFromTemplate(templateId: string, data: Partial<PlaybookDocument>): Promise<PlaybookDocument>;
  saveAsTemplate(playbookId: string, templateData: Partial<PlaybookTemplate>): Promise<PlaybookTemplate>;
  
  // Collaboration
  getCollaborators(playbookId: string): Promise<PlaybookDocument['collaborators']>;
  addCollaborator(playbookId: string, userId: string, role: string): Promise<void>;
  removeCollaborator(playbookId: string, userId: string): Promise<void>;
  updateCollaboratorRole(playbookId: string, userId: string, role: string): Promise<void>;
  
  // Comments
  getComments(playbookId: string): Promise<PlaybookComment[]>;
  addComment(playbookId: string, blockId: string, content: string): Promise<PlaybookComment>;
  updateComment(commentId: string, content: string): Promise<PlaybookComment>;
  deleteComment(commentId: string): Promise<void>;
  resolveComment(commentId: string): Promise<void>;
  
  // History
  getHistory(playbookId: string): Promise<PlaybookHistoryEntry[]>;
  restoreVersion(playbookId: string, version: number): Promise<PlaybookDocument>;
  
  // Publishing
  publishPlaybook(playbookId: string): Promise<PlaybookDocument>;
  unpublishPlaybook(playbookId: string): Promise<PlaybookDocument>;
  
  // Analytics
  trackView(playbookId: string): Promise<void>;
  getAnalytics(playbookId: string): Promise<PlaybookDocument['analytics']>;
}

// ============================================================================
// Hook Types
// ============================================================================

/**
 * Retorno do hook usePlaybook
 */
export interface UsePlaybookReturn {
  playbook: PlaybookDocument | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  updatePlaybook: (data: Partial<PlaybookDocument>) => Promise<void>;
  deletePlaybook: () => Promise<void>;
  publishPlaybook: () => Promise<void>;
  unpublishPlaybook: () => Promise<void>;
}

/**
 * Retorno do hook usePlaybookEditor
 */
export interface UsePlaybookEditorReturn {
  editorState: PlaybookEditorState;
  isLoading: boolean;
  error: string | null;
  
  // Block operations
  addBlock: (type: PlaybookBlockType, position?: number) => Promise<PlaybookBlock>;
  updateBlock: (blockId: string, data: Partial<PlaybookBlock>) => Promise<void>;
  deleteBlock: (blockId: string) => Promise<void>;
  moveBlock: (blockId: string, targetId: string, position: 'before' | 'after' | 'inside') => Promise<void>;
  duplicateBlock: (blockId: string) => Promise<PlaybookBlock>;
  
  // Selection and focus
  selectBlock: (blockId: string) => void;
  focusBlock: (blockId: string, position?: number) => void;
  clearSelection: () => void;
  
  // Editor state
  setEditing: (isEditing: boolean) => void;
  save: () => Promise<void>;
  autoSave: () => Promise<void>;
  undo: () => void;
  redo: () => void;
  
  // Collaboration
  addCollaborator: (userId: string, role: string) => Promise<void>;
  removeCollaborator: (userId: string) => Promise<void>;
  updateCursor: (blockId: string, position: number) => void;
  updateSelection: (blockId: string, start: number, end: number) => void;
  
  // Comments
  addComment: (blockId: string, content: string) => Promise<void>;
  resolveComment: (commentId: string) => Promise<void>;
}

/**
 * Retorno do hook usePlaybookTemplates
 */
export interface UsePlaybookTemplatesReturn {
  templates: PlaybookTemplate[];
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
  createFromTemplate: (templateId: string, data: Partial<PlaybookDocument>) => Promise<PlaybookDocument>;
  saveAsTemplate: (playbookId: string, templateData: Partial<PlaybookTemplate>) => Promise<PlaybookTemplate>;
}

// ============================================================================
// Component Props
// ============================================================================

/**
 * Props do componente PlaybookEditor
 */
export interface PlaybookEditorProps {
  playbookId?: string;
  initialData?: Partial<PlaybookDocument>;
  templateId?: string;
  readOnly?: boolean;
  showCollaborators?: boolean;
  showComments?: boolean;
  showHistory?: boolean;
  enableAutoSave?: boolean;
  autoSaveInterval?: number;
  onSave?: (playbook: PlaybookDocument) => void;
  onPublish?: (playbook: PlaybookDocument) => void;
  onDelete?: (playbookId: string) => void;
  className?: string;
}

/**
 * Props do componente BlockEditor
 */
export interface BlockEditorProps {
  block: PlaybookBlock;
  isSelected?: boolean;
  isFocused?: boolean;
  readOnly?: boolean;
  showComments?: boolean;
  onUpdate: (data: Partial<PlaybookBlock>) => void;
  onDelete: () => void;
  onMove: (targetId: string, position: 'before' | 'after' | 'inside') => void;
  onDuplicate: () => void;
  onAddComment: (content: string) => void;
  className?: string;
}

/**
 * Props do componente TemplateSelector
 */
export interface TemplateSelectorProps {
  category?: PlaybookCategory;
  onSelect: (template: PlaybookTemplate) => void;
  onCreateBlank: () => void;
  showCreateBlank?: boolean;
  className?: string;
}

/**
 * Props do componente PlaybookLibrary
 */
export interface PlaybookLibraryProps {
  filters?: PlaybookFilters;
  onPlaybookSelect?: (playbook: PlaybookDocument) => void;
  onPlaybookEdit?: (playbook: PlaybookDocument) => void;
  onPlaybookDelete?: (playbook: PlaybookDocument) => void;
  showFilters?: boolean;
  showSearch?: boolean;
  showTemplates?: boolean;
  viewMode?: 'grid' | 'list';
  className?: string;
}

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Constantes de tipos de bloco
 */
export const PLAYBOOK_BLOCK_TYPES: Record<PlaybookBlockType, { label: string; icon: string; description: string }> = {
  paragraph: { label: 'Parágrafo', icon: '¶', description: 'Texto simples' },
  heading1: { label: 'Título 1', icon: 'H1', description: 'Título principal' },
  heading2: { label: 'Título 2', icon: 'H2', description: 'Subtítulo' },
  heading3: { label: 'Título 3', icon: 'H3', description: 'Título menor' },
  bulleted_list: { label: 'Lista', icon: '•', description: 'Lista com marcadores' },
  numbered_list: { label: 'Lista Numerada', icon: '1.', description: 'Lista numerada' },
  todo: { label: 'To-do', icon: '☐', description: 'Lista de tarefas' },
  toggle: { label: 'Toggle', icon: '▶', description: 'Seção recolhível' },
  quote: { label: 'Citação', icon: '"', description: 'Bloco de citação' },
  divider: { label: 'Divisor', icon: '—', description: 'Linha divisória' },
  code: { label: 'Código', icon: '</>', description: 'Bloco de código' },
  image: { label: 'Imagem', icon: '🖼', description: 'Inserir imagem' },
  video: { label: 'Vídeo', icon: '🎥', description: 'Inserir vídeo' },
  file: { label: 'Arquivo', icon: '📎', description: 'Anexar arquivo' },
  table: { label: 'Tabela', icon: '⊞', description: 'Inserir tabela' },
  callout: { label: 'Callout', icon: '💡', description: 'Caixa de destaque' },
  bookmark: { label: 'Bookmark', icon: '🔖', description: 'Link com preview' },
  embed: { label: 'Embed', icon: '🔗', description: 'Conteúdo incorporado' },
  equation: { label: 'Equação', icon: '∑', description: 'Fórmula matemática' },
  template_button: { label: 'Template', icon: '📋', description: 'Botão de template' },
  synced_block: { label: 'Bloco Sincronizado', icon: '🔄', description: 'Bloco sincronizado' },
  column_list: { label: 'Colunas', icon: '⫼', description: 'Layout em colunas' },
  column: { label: 'Coluna', icon: '|', description: 'Coluna individual' }
};

/**
 * Constantes de categorias
 */
export const PLAYBOOK_CATEGORIES: Record<PlaybookCategory, { label: string; icon: string; color: string }> = {
  sales: { label: 'Vendas', icon: '💰', color: 'green' },
  marketing: { label: 'Marketing', icon: '📢', color: 'blue' },
  training: { label: 'Treinamento', icon: '🎓', color: 'purple' },
  process: { label: 'Processo', icon: '⚙️', color: 'gray' },
  template: { label: 'Template', icon: '📋', color: 'orange' },
  guide: { label: 'Guia', icon: '📖', color: 'indigo' },
  policy: { label: 'Política', icon: '📜', color: 'red' },
  other: { label: 'Outro', icon: '📄', color: 'gray' }
};

/**
 * Constantes de status
 */
export const PLAYBOOK_STATUSES: Record<PlaybookStatus, { label: string; color: string }> = {
  draft: { label: 'Rascunho', color: 'gray' },
  review: { label: 'Em Revisão', color: 'yellow' },
  published: { label: 'Publicado', color: 'green' },
  archived: { label: 'Arquivado', color: 'red' }
};

/**
 * Constantes de níveis de acesso
 */
export const PLAYBOOK_ACCESS_LEVELS: Record<PlaybookAccessLevel, { label: string; icon: string }> = {
  private: { label: 'Privado', icon: '🔒' },
  team: { label: 'Equipe', icon: '👥' },
  company: { label: 'Empresa', icon: '🏢' },
  public: { label: 'Público', icon: '🌐' }
};

/**
 * Lista de status de playbook para componentes que precisam de uma array
 */
export const PLAYBOOK_STATUS_OPTIONS: PlaybookStatus[] = ['draft', 'review', 'published', 'archived'];