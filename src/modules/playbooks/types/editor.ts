// types/editor.ts
import type { CollaborationUser } from '@/services/collaboration/types';

export type BlockType = 
  | 'paragraph'
  | 'heading1'
  | 'heading2'
  | 'heading3'
  | 'bulleted-list'
  | 'numbered-list'
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
  | 'template'
  | 'database'
  | 'column'
  | 'column-list'
  | 'breadcrumb'
  | 'table-of-contents'
  | 'link-preview'
  | 'synced-block'
  | 'ai-block'
  | 'chart'
  | 'kanban'
  | 'calendar'
  | 'gallery'
  | 'timeline'
  | 'mindmap'
  | 'flowchart'
  | 'form'
  | 'survey'
  | 'quiz'
  | 'calculator'
  | 'weather'
  | 'map'
  | 'social-embed'
  | 'audio'
  | 'pdf'
  | 'spreadsheet'
  | 'presentation'
  | 'whiteboard'
  | 'mermaid'
  | 'excalidraw'
  | 'figma'
  | 'loom'
  | 'youtube'
  | 'vimeo'
  | 'spotify'
  | 'soundcloud'
  | 'twitter'
  | 'instagram'
  | 'linkedin'
  | 'github'
  | 'codepen'
  | 'replit'
  | 'stackblitz'
  | 'codesandbox'
  | 'notion'
  | 'airtable'
  | 'google-drive'
  | 'dropbox'
  | 'onedrive'
  | 'slack'
  | 'discord'
  | 'teams'
  | 'zoom'
  | 'calendly'
  | 'typeform'
  | 'mailchimp'
  | 'hubspot'
  | 'salesforce'
  | 'stripe'
  | 'paypal'
  | 'custom';

export type TextStyle = {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  color?: string;
  backgroundColor?: string;
  fontSize?: number;
  fontFamily?: string;
};

export type TextAnnotation = {
  type: 'text' | 'link' | 'mention' | 'equation' | 'date';
  text: string;
  style?: TextStyle;
  href?: string;
  mentionId?: string;
  equation?: string;
  date?: Date;
};

export type RichText = TextAnnotation[];

export interface BaseBlock {
  id: string;
  type: BlockType;
  parentId?: string;
  children?: string[];
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastEditedBy: string;
  archived?: boolean;
  locked?: boolean;
  permissions?: BlockPermissions;
  metadata?: Record<string, unknown>;
}

export interface BlockPermissions {
  canEdit: boolean;
  canDelete: boolean;
  canMove: boolean;
  canComment: boolean;
  canShare: boolean;
  allowedUsers?: string[];
  allowedRoles?: string[];
}

// Text Blocks
export interface ParagraphBlock extends BaseBlock {
  type: 'paragraph';
  content: RichText;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  indent?: number;
}

export interface HeadingBlock extends BaseBlock {
  type: 'heading1' | 'heading2' | 'heading3';
  content: RichText;
  toggleable?: boolean;
  collapsed?: boolean;
  anchor?: string;
}

export interface ListBlock extends BaseBlock {
  type: 'bulleted-list' | 'numbered-list';
  content: RichText;
  indent?: number;
  listStyle?: string;
  startNumber?: number;
}

export interface TodoBlock extends BaseBlock {
  type: 'todo';
  content: RichText;
  checked: boolean;
  assignee?: string;
  dueDate?: Date;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
}

export interface ToggleBlock extends BaseBlock {
  type: 'toggle';
  content: RichText;
  collapsed: boolean;
}

export interface QuoteBlock extends BaseBlock {
  type: 'quote';
  content: RichText;
  author?: string;
  source?: string;
  style?: 'default' | 'bordered' | 'highlighted';
}

export interface DividerBlock extends BaseBlock {
  type: 'divider';
  style?: 'line' | 'dashed' | 'dotted' | 'double' | 'thick';
  color?: string;
  spacing?: 'small' | 'medium' | 'large';
}

export interface CodeBlock extends BaseBlock {
  type: 'code';
  content: string;
  language?: string;
  showLineNumbers?: boolean;
  theme?: string;
  caption?: RichText;
  fileName?: string;
  highlightedLines?: number[];
}

// Media Blocks
export interface ImageBlock extends BaseBlock {
  type: 'image';
  url: string;
  caption?: RichText;
  alt?: string;
  width?: number;
  height?: number;
  alignment?: 'left' | 'center' | 'right';
  borderRadius?: number;
  shadow?: boolean;
  zoom?: boolean;
  lazy?: boolean;
}

export interface VideoBlock extends BaseBlock {
  type: 'video';
  url: string;
  caption?: RichText;
  thumbnail?: string;
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  width?: number;
  height?: number;
  startTime?: number;
  endTime?: number;
}

export interface AudioBlock extends BaseBlock {
  type: 'audio';
  url: string;
  caption?: RichText;
  title?: string;
  artist?: string;
  duration?: number;
  autoplay?: boolean;
  loop?: boolean;
  showWaveform?: boolean;
}

export interface FileBlock extends BaseBlock {
  type: 'file';
  url: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  caption?: RichText;
  downloadable?: boolean;
  previewable?: boolean;
  thumbnail?: string;
}

// Layout Blocks
export interface ColumnListBlock extends BaseBlock {
  type: 'column-list';
  columns: number;
  gap?: number;
  distribution?: 'equal' | 'auto' | number[];
}

export interface ColumnBlock extends BaseBlock {
  type: 'column';
  width?: number | string;
  backgroundColor?: string;
  padding?: number;
  borderRadius?: number;
}

// Interactive Blocks
export interface TableBlock extends BaseBlock {
  type: 'table';
  headers: RichText[];
  rows: RichText[][];
  hasHeader?: boolean;
  striped?: boolean;
  bordered?: boolean;
  compact?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  resizable?: boolean;
  columnWidths?: number[];
}

export interface CalloutBlock extends BaseBlock {
  type: 'callout';
  content: RichText;
  icon?: string;
  color?: string;
  backgroundColor?: string;
  style?: 'default' | 'info' | 'warning' | 'error' | 'success';
}

export interface BookmarkBlock extends BaseBlock {
  type: 'bookmark';
  url: string;
  title?: string;
  description?: string;
  favicon?: string;
  image?: string;
  caption?: RichText;
}

export interface EmbedBlock extends BaseBlock {
  type: 'embed';
  url: string;
  html?: string;
  width?: number;
  height?: number;
  caption?: RichText;
  sandbox?: string[];
  allowFullscreen?: boolean;
}

export interface EquationBlock extends BaseBlock {
  type: 'equation';
  expression: string;
  inline?: boolean;
  caption?: RichText;
}

// Advanced Blocks
export interface DatabaseBlock extends BaseBlock {
  type: 'database';
  title: RichText;
  description?: RichText;
  properties: DatabaseProperty[];
  views: DatabaseView[];
  defaultView?: string;
  icon?: string;
  cover?: string;
}

export interface DatabaseProperty {
  id: string;
  name: string;
  type: 'title' | 'text' | 'number' | 'select' | 'multi_select' | 'date' | 'person' | 'file' | 'checkbox' | 'url' | 'email' | 'phone' | 'formula' | 'relation' | 'rollup' | 'created_time' | 'created_by' | 'last_edited_time' | 'last_edited_by';
  options?: unknown;
  visible?: boolean;
  width?: number;
}

export interface DatabaseView {
  id: string;
  name: string;
  type: 'table' | 'board' | 'timeline' | 'calendar' | 'gallery' | 'list';
  filter?: unknown;
  sort?: unknown;
  groupBy?: string;
  properties?: string[];
}

export interface ChartBlock extends BaseBlock {
  type: 'chart';
  chartType: 'line' | 'bar' | 'pie' | 'doughnut' | 'area' | 'scatter' | 'radar' | 'polar';
  data: ChartData;
  options?: ChartOptions;
  caption?: RichText;
}

export interface ChartData {
  labels: string[];
  datasets: ChartDataset[];
}

export interface ChartDataset {
  label: string;
  data: number[];
  backgroundColor?: string | string[];
  borderColor?: string | string[];
  borderWidth?: number;
  fill?: boolean;
}

export interface ChartOptions {
  responsive?: boolean;
  maintainAspectRatio?: boolean;
  plugins?: unknown;
  scales?: unknown;
  animation?: unknown;
}

export interface KanbanBlock extends BaseBlock {
  type: 'kanban';
  title: RichText;
  columns: KanbanColumn[];
  settings?: KanbanSettings;
}

export interface KanbanColumn {
  id: string;
  title: string;
  color?: string;
  limit?: number;
  cards: KanbanCard[];
}

export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  assignee?: string;
  dueDate?: Date;
  priority?: 'low' | 'medium' | 'high';
  tags?: string[];
  attachments?: string[];
  comments?: number;
}

export interface KanbanSettings {
  allowDragDrop?: boolean;
  showCardCount?: boolean;
  showColumnLimit?: boolean;
  compactMode?: boolean;
}

export interface FormBlock extends BaseBlock {
  type: 'form';
  title: RichText;
  description?: RichText;
  fields: FormField[];
  settings?: FormSettings;
  submissions?: FormSubmission[];
}

export interface FormField {
  id: string;
  type: 'text' | 'textarea' | 'email' | 'number' | 'select' | 'multiselect' | 'radio' | 'checkbox' | 'date' | 'time' | 'file' | 'url' | 'phone';
  label: string;
  placeholder?: string;
  required?: boolean;
  validation?: FormValidation;
  options?: string[];
  defaultValue?: unknown;
}

export interface FormValidation {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: string;
  custom?: string;
}

export interface FormSettings {
  allowMultipleSubmissions?: boolean;
  requireLogin?: boolean;
  showProgressBar?: boolean;
  confirmationMessage?: string;
  redirectUrl?: string;
  emailNotifications?: boolean;
  exportFormat?: 'csv' | 'json' | 'xlsx';
}

export interface FormSubmission {
  id: string;
  data: Record<string, unknown>;
  submittedAt: Date;
  submittedBy?: string;
  ipAddress?: string;
  userAgent?: string;
}

// AI and Automation Blocks
export interface AIBlock extends BaseBlock {
  type: 'ai-block';
  prompt: string;
  response?: string;
  model?: string;
  temperature?: number;
  maxTokens?: number;
  context?: string;
  status?: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

export interface TemplateBlock extends BaseBlock {
  type: 'template';
  title: RichText;
  description?: RichText;
  templateBlocks: Block[];
  variables?: TemplateVariable[];
  category?: string;
  tags?: string[];
  usageCount?: number;
}

export interface TemplateVariable {
  name: string;
  type: 'text' | 'number' | 'date' | 'boolean' | 'select';
  defaultValue?: unknown;
  options?: string[];
  required?: boolean;
}

// Social and External Blocks
export interface SocialEmbedBlock extends BaseBlock {
  type: 'social-embed';
  platform: 'twitter' | 'instagram' | 'linkedin' | 'facebook' | 'youtube' | 'tiktok' | 'pinterest';
  url: string;
  embedCode?: string;
  caption?: RichText;
}

export interface CustomBlock extends BaseBlock {
  type: 'custom';
  componentName: string;
  props: Record<string, unknown>;
  html?: string;
  css?: string;
  javascript?: string;
}

// Union type for all blocks
export type Block = 
  | ParagraphBlock
  | HeadingBlock
  | ListBlock
  | TodoBlock
  | ToggleBlock
  | QuoteBlock
  | DividerBlock
  | CodeBlock
  | ImageBlock
  | VideoBlock
  | AudioBlock
  | FileBlock
  | ColumnListBlock
  | ColumnBlock
  | TableBlock
  | CalloutBlock
  | BookmarkBlock
  | EmbedBlock
  | EquationBlock
  | DatabaseBlock
  | ChartBlock
  | KanbanBlock
  | FormBlock
  | AIBlock
  | TemplateBlock
  | SocialEmbedBlock
  | CustomBlock;

// Editor State
export interface EditorState {
  blocks: Record<string, Block>;
  selection?: EditorSelection;
  history: EditorHistory;
  settings: EditorSettings;
  collaboration?: CollaborationState;
}

export interface EditorSelection {
  blockId: string;
  offset: number;
  length: number;
  isCollapsed: boolean;
}

export interface EditorHistory {
  undoStack: EditorOperation[];
  redoStack: EditorOperation[];
  maxSize: number;
}

export interface EditorOperation {
  type: 'insert' | 'delete' | 'update' | 'move';
  blockId: string;
  data: unknown;
  timestamp: Date;
  userId: string;
}

export interface EditorSettings {
  theme: 'light' | 'dark' | 'auto';
  fontSize: number;
  fontFamily: string;
  lineHeight: number;
  showBlockHandles: boolean;
  showLineNumbers: boolean;
  enableSpellCheck: boolean;
  enableAutoSave: boolean;
  autoSaveInterval: number;
  enableCollaboration: boolean;
  enableComments: boolean;
  enableVersionHistory: boolean;
  maxFileSize: number;
  allowedFileTypes: string[];
  customCSS?: string;
}

export interface CollaborationState {
  users: CollaborationUser[];
  cursors: Record<string, EditorSelection>;
  comments: Comment[];
  suggestions: Suggestion[];
}

// CollaborationUser agora é importado de services/collaboration/types

export interface UserPermissions {
  canEdit: boolean;
  canComment: boolean;
  canSuggest: boolean;
  canShare: boolean;
  canExport: boolean;
  isOwner: boolean;
  isAdmin: boolean;
}

export interface Comment {
  id: string;
  blockId: string;
  content: RichText;
  author: string;
  createdAt: Date;
  updatedAt?: Date;
  resolved?: boolean;
  replies?: Comment[];
  mentions?: string[];
}

export interface Suggestion {
  id: string;
  blockId: string;
  type: 'insert' | 'delete' | 'replace';
  originalContent: unknown;
  suggestedContent: unknown;
  author: string;
  createdAt: Date;
  status: 'pending' | 'accepted' | 'rejected';
  comment?: string;
}

// Playbook specific types
export interface Playbook {
  id: string;
  title: string;
  description?: string;
  icon?: string;
  cover?: string;
  blocks: Block[]; // Block objects in order
  tags: string[];
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // in minutes
  visibility?: 'private' | 'team' | 'public';
  template?: boolean;
  version: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    name: string;
    email: string;
    avatar: string;
  };
  collaborators: string[];
  isPublic: boolean;
  settings?: PlaybookSettings;
  metadata: {
    wordCount: number;
    readingTime: number;
    lastEditedBy: string;
  };
}

export interface PlaybookSettings {
  allowComments: boolean;
  allowSuggestions: boolean;
  allowCopy: boolean;
  allowExport: boolean;
  requireApproval: boolean;
  enableVersioning: boolean;
  enableAnalytics: boolean;
  customDomain?: string;
  password?: string;
  expiresAt?: Date;
}

export interface PlaybookMetadata {
  wordCount: number;
  readingTime: number;
  estimatedReadingTime?: number;
  complexity?: 'simple' | 'moderate' | 'complex';
  lastEditedBy: string;
  lastViewed?: Date;
  viewCount: number;
  shareCount: number;
  copyCount: number;
  exportCount: number;
  commentCount: number;
  suggestionCount: number;
  collaboratorCount: number;
  blockCount?: number;
  imageCount: number;
  videoCount: number;
  fileCount: number;
  exportFormats?: string[];
  analytics?: {
    views: number;
    likes: number;
    shares: number;
    comments: number;
  };
}

// Event types
export type EditorEvent = 
  | { type: 'block-created'; blockId: string; block: Block }
  | { type: 'block-updated'; blockId: string; changes: Partial<Block> }
  | { type: 'block-deleted'; blockId: string }
  | { type: 'block-moved'; blockId: string; newParentId?: string; newIndex: number }
  | { type: 'selection-changed'; selection: EditorSelection }
  | { type: 'collaboration-user-joined'; user: CollaborationUser }
  | { type: 'collaboration-user-left'; userId: string }
  | { type: 'comment-added'; comment: Comment }
  | { type: 'suggestion-added'; suggestion: Suggestion }
  | { type: 'playbook-saved'; playbook: Playbook }
  | { type: 'playbook-published'; playbook: Playbook }
  | { type: 'error'; error: string };

// Utility types
export type BlockFactory<T extends Block = Block> = (data: Partial<T>) => T;
export type BlockRenderer<T extends Block = Block> = React.ComponentType<{ block: T; isSelected: boolean; isEditing: boolean }>;
export type BlockValidator<T extends Block = Block> = (block: T) => string[] | null;
export type BlockTransformer<T extends Block = Block> = (block: T) => T;

// Constants
export const BLOCK_TYPES: Record<BlockType, { name: string; icon: string; category: string; description: string }> = {
  'paragraph': { name: 'Parágrafo', icon: '📝', category: 'Texto', description: 'Texto simples' },
  'heading1': { name: 'Título 1', icon: 'H1', category: 'Texto', description: 'Título principal' },
  'heading2': { name: 'Título 2', icon: 'H2', category: 'Texto', description: 'Subtítulo' },
  'heading3': { name: 'Título 3', icon: 'H3', category: 'Texto', description: 'Título menor' },
  'bulleted-list': { name: 'Lista', icon: '•', category: 'Texto', description: 'Lista com marcadores' },
  'numbered-list': { name: 'Lista Numerada', icon: '1.', category: 'Texto', description: 'Lista numerada' },
  'todo': { name: 'To-do', icon: '☐', category: 'Texto', description: 'Lista de tarefas' },
  'toggle': { name: 'Toggle', icon: '▶', category: 'Texto', description: 'Conteúdo recolhível' },
  'quote': { name: 'Citação', icon: '❝', category: 'Texto', description: 'Bloco de citação' },
  'divider': { name: 'Divisor', icon: '—', category: 'Layout', description: 'Linha divisória' },
  'code': { name: 'Código', icon: '</>', category: 'Texto', description: 'Bloco de código' },
  'image': { name: 'Imagem', icon: '🖼️', category: 'Mídia', description: 'Inserir imagem' },
  'video': { name: 'Vídeo', icon: '🎥', category: 'Mídia', description: 'Inserir vídeo' },
  'audio': { name: 'Áudio', icon: '🎵', category: 'Mídia', description: 'Inserir áudio' },
  'file': { name: 'Arquivo', icon: '📎', category: 'Mídia', description: 'Anexar arquivo' },
  'table': { name: 'Tabela', icon: '⊞', category: 'Layout', description: 'Tabela de dados' },
  'callout': { name: 'Destaque', icon: '💡', category: 'Layout', description: 'Caixa de destaque' },
  'bookmark': { name: 'Bookmark', icon: '🔖', category: 'Embed', description: 'Link com preview' },
  'embed': { name: 'Embed', icon: '🔗', category: 'Embed', description: 'Conteúdo incorporado' },
  'equation': { name: 'Equação', icon: '∑', category: 'Texto', description: 'Fórmula matemática' },
  'template': { name: 'Template', icon: '📋', category: 'Avançado', description: 'Modelo reutilizável' },
  'database': { name: 'Database', icon: '🗃️', category: 'Avançado', description: 'Base de dados' },
  'column': { name: 'Coluna', icon: '|', category: 'Layout', description: 'Coluna de layout' },
  'column-list': { name: 'Colunas', icon: '|||', category: 'Layout', description: 'Layout em colunas' },
  'breadcrumb': { name: 'Breadcrumb', icon: '🍞', category: 'Navegação', description: 'Trilha de navegação' },
  'table-of-contents': { name: 'Índice', icon: '📑', category: 'Navegação', description: 'Sumário automático' },
  'link-preview': { name: 'Preview Link', icon: '👁️', category: 'Embed', description: 'Preview de link' },
  'synced-block': { name: 'Bloco Sincronizado', icon: '🔄', category: 'Avançado', description: 'Bloco sincronizado' },
  'ai-block': { name: 'IA', icon: '🤖', category: 'IA', description: 'Geração por IA' },
  'chart': { name: 'Gráfico', icon: '📊', category: 'Dados', description: 'Gráfico de dados' },
  'kanban': { name: 'Kanban', icon: '📋', category: 'Dados', description: 'Quadro Kanban' },
  'calendar': { name: 'Calendário', icon: '📅', category: 'Dados', description: 'Visualização de calendário' },
  'gallery': { name: 'Galeria', icon: '🖼️', category: 'Mídia', description: 'Galeria de imagens' },
  'timeline': { name: 'Timeline', icon: '📈', category: 'Dados', description: 'Linha do tempo' },
  'mindmap': { name: 'Mapa Mental', icon: '🧠', category: 'Dados', description: 'Mapa mental' },
  'flowchart': { name: 'Fluxograma', icon: '🔀', category: 'Dados', description: 'Diagrama de fluxo' },
  'form': { name: 'Formulário', icon: '📝', category: 'Interativo', description: 'Formulário interativo' },
  'survey': { name: 'Pesquisa', icon: '📊', category: 'Interativo', description: 'Pesquisa de opinião' },
  'quiz': { name: 'Quiz', icon: '❓', category: 'Interativo', description: 'Quiz interativo' },
  'calculator': { name: 'Calculadora', icon: '🧮', category: 'Interativo', description: 'Calculadora' },
  'weather': { name: 'Clima', icon: '🌤️', category: 'Dados', description: 'Informações do clima' },
  'map': { name: 'Mapa', icon: '🗺️', category: 'Dados', description: 'Mapa interativo' },
  'social-embed': { name: 'Rede Social', icon: '📱', category: 'Embed', description: 'Post de rede social' },
  'pdf': { name: 'PDF', icon: '📄', category: 'Mídia', description: 'Visualizador de PDF' },
  'spreadsheet': { name: 'Planilha', icon: '📊', category: 'Dados', description: 'Planilha interativa' },
  'presentation': { name: 'Apresentação', icon: '📽️', category: 'Mídia', description: 'Slides de apresentação' },
  'whiteboard': { name: 'Quadro Branco', icon: '⬜', category: 'Interativo', description: 'Quadro colaborativo' },
  'mermaid': { name: 'Mermaid', icon: '🧜', category: 'Dados', description: 'Diagramas Mermaid' },
  'excalidraw': { name: 'Excalidraw', icon: '✏️', category: 'Interativo', description: 'Desenhos Excalidraw' },
  'figma': { name: 'Figma', icon: '🎨', category: 'Embed', description: 'Design do Figma' },
  'loom': { name: 'Loom', icon: '🎬', category: 'Embed', description: 'Vídeo do Loom' },
  'youtube': { name: 'YouTube', icon: '📺', category: 'Embed', description: 'Vídeo do YouTube' },
  'vimeo': { name: 'Vimeo', icon: '🎞️', category: 'Embed', description: 'Vídeo do Vimeo' },
  'spotify': { name: 'Spotify', icon: '🎵', category: 'Embed', description: 'Música do Spotify' },
  'soundcloud': { name: 'SoundCloud', icon: '🔊', category: 'Embed', description: 'Áudio do SoundCloud' },
  'twitter': { name: 'Twitter', icon: '🐦', category: 'Embed', description: 'Tweet do Twitter' },
  'instagram': { name: 'Instagram', icon: '📷', category: 'Embed', description: 'Post do Instagram' },
  'linkedin': { name: 'LinkedIn', icon: '💼', category: 'Embed', description: 'Post do LinkedIn' },
  'github': { name: 'GitHub', icon: '🐙', category: 'Embed', description: 'Código do GitHub' },
  'codepen': { name: 'CodePen', icon: '✒️', category: 'Embed', description: 'Demo do CodePen' },
  'replit': { name: 'Replit', icon: '🔧', category: 'Embed', description: 'Código do Replit' },
  'stackblitz': { name: 'StackBlitz', icon: '⚡', category: 'Embed', description: 'Projeto do StackBlitz' },
  'codesandbox': { name: 'CodeSandbox', icon: '📦', category: 'Embed', description: 'Sandbox de código' },
  'notion': { name: 'Notion', icon: '📝', category: 'Embed', description: 'Página do Notion' },
  'airtable': { name: 'Airtable', icon: '🗂️', category: 'Embed', description: 'Base do Airtable' },
  'google-drive': { name: 'Google Drive', icon: '💾', category: 'Embed', description: 'Arquivo do Drive' },
  'dropbox': { name: 'Dropbox', icon: '📁', category: 'Embed', description: 'Arquivo do Dropbox' },
  'onedrive': { name: 'OneDrive', icon: '☁️', category: 'Embed', description: 'Arquivo do OneDrive' },
  'slack': { name: 'Slack', icon: '💬', category: 'Embed', description: 'Mensagem do Slack' },
  'discord': { name: 'Discord', icon: '🎮', category: 'Embed', description: 'Mensagem do Discord' },
  'teams': { name: 'Teams', icon: '👥', category: 'Embed', description: 'Reunião do Teams' },
  'zoom': { name: 'Zoom', icon: '📹', category: 'Embed', description: 'Reunião do Zoom' },
  'calendly': { name: 'Calendly', icon: '📅', category: 'Embed', description: 'Agendamento Calendly' },
  'typeform': { name: 'Typeform', icon: '📋', category: 'Embed', description: 'Formulário Typeform' },
  'mailchimp': { name: 'Mailchimp', icon: '📧', category: 'Embed', description: 'Newsletter Mailchimp' },
  'hubspot': { name: 'HubSpot', icon: '🎯', category: 'Embed', description: 'Formulário HubSpot' },
  'salesforce': { name: 'Salesforce', icon: '☁️', category: 'Embed', description: 'Dados Salesforce' },
  'stripe': { name: 'Stripe', icon: '💳', category: 'Embed', description: 'Pagamento Stripe' },
  'paypal': { name: 'PayPal', icon: '💰', category: 'Embed', description: 'Pagamento PayPal' },
  'custom': { name: 'Personalizado', icon: '🔧', category: 'Avançado', description: 'Bloco personalizado' },
};

export const BLOCK_CATEGORIES = [
  'Texto',
  'Mídia',
  'Layout',
  'Dados',
  'Interativo',
  'Embed',
  'IA',
  'Navegação',
  'Avançado',
] as const;

export type BlockCategory = typeof BLOCK_CATEGORIES[number];