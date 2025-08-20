// ============================================================================
// Flowchart Types - Tipos TypeScript para sistema de fluxogramas
// ============================================================================

// ============================================================================
// Base Types
// ============================================================================

/**
 * Tipos de nós disponíveis no fluxograma (BPMN 2.0 compliant)
 */
export type FlowchartNodeType = 
  // Eventos BPMN
  | 'start'
  | 'end'
  | 'intermediate'
  // Atividades BPMN
  | 'process'
  | 'subprocess'
  | 'manual'
  | 'input'
  | 'output'
  | 'delay'
  | 'preparation'
  | 'predefined'
  // Gateways BPMN
  | 'decision'
  | 'parallel'
  | 'inclusive'
  | 'complex'
  | 'event_based'
  // Artefatos BPMN
  | 'document'
  | 'database'
  | 'annotation'
  | 'group'
  // Conectores e outros
  | 'connector'
  | 'organogram'
  | 'custom';

/**
 * Tipos de conexões entre nós
 */
export type FlowchartEdgeType = 
  | 'straight'
  | 'smoothstep'
  | 'step'
  | 'bezier'
  | 'custom';

/**
 * Status do fluxograma
 */
export type FlowchartStatus = 
  | 'draft'
  | 'published'
  | 'archived'
  | 'template';

/**
 * Categorias de fluxogramas
 */
export type FlowchartCategory = 
  | 'process'
  | 'workflow'
  | 'decision_tree'
  | 'system_design'
  | 'user_journey'
  | 'data_flow'
  | 'organizational'
  | 'technical'
  | 'business'
  | 'general';

/**
 * Níveis de acesso do fluxograma
 */
export type FlowchartAccessLevel = 
  | 'private'
  | 'team'
  | 'organization'
  | 'public';

// ============================================================================
// Node Types
// ============================================================================

/**
 * Posição de um nó no canvas
 */
export interface FlowchartPosition {
  x: number;
  y: number;
}

/**
 * Dimensões de um nó
 */
export interface FlowchartDimensions {
  width: number;
  height: number;
}

/**
 * Estilo visual de um nó
 */
export interface FlowchartNodeStyle {
  backgroundColor?: string;
  borderColor?: string;
  borderWidth?: number;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  borderRadius?: number;
  color?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  fontFamily?: string;
  opacity?: number;
  shadow?: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
}

/**
 * Dados específicos de cada tipo de nó
 */
export interface FlowchartNodeData {
  label: string;
  description?: string;
  icon?: string;
  color?: string;
  style?: FlowchartNodeStyle;
  metadata?: Record<string, unknown>;
  validation?: {
    required?: boolean;
    minConnections?: number;
    maxConnections?: number;
    allowedConnections?: FlowchartNodeType[];
  };
  properties?: Record<string, unknown>;
  // Funções para interação com o editor
  onUpdateNode?: (nodeId: string, data: Partial<FlowchartNodeData>) => void;
  onAddNode?: (type: FlowchartNodeType, position: FlowchartPosition) => void;
  onAddEdge?: (source: string, target: string) => void;
}

/**
 * Nó do fluxograma
 */
export interface FlowchartNode {
  id: string;
  type: FlowchartNodeType;
  position: FlowchartPosition;
  dimensions?: FlowchartDimensions;
  data: FlowchartNodeData;
  draggable?: boolean;
  selectable?: boolean;
  deletable?: boolean;
  connectable?: boolean;
  focusable?: boolean;
  zIndex?: number;
  parentNode?: string;
  extent?: 'parent' | [[number, number], [number, number]];
  expandParent?: boolean;
  positionAbsolute?: FlowchartPosition;
  ariaLabel?: string;
  role?: string;
  hidden?: boolean;
  selected?: boolean;
  measured?: FlowchartDimensions;
}

// ============================================================================
// Edge Types
// ============================================================================

/**
 * Estilo visual de uma conexão
 */
export interface FlowchartEdgeStyle {
  stroke?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  strokeLinecap?: 'butt' | 'round' | 'square';
  strokeLinejoin?: 'miter' | 'round' | 'bevel';
  opacity?: number;
  markerEnd?: string;
  markerStart?: string;
}

/**
 * Dados de uma conexão
 */
export interface FlowchartEdgeData {
  label?: string;
  description?: string;
  condition?: string;
  weight?: number;
  style?: FlowchartEdgeStyle;
  metadata?: Record<string, unknown>;
  animated?: boolean;
  hidden?: boolean;
}

/**
 * Conexão entre nós
 */
export interface FlowchartEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  type?: FlowchartEdgeType;
  data?: FlowchartEdgeData;
  style?: FlowchartEdgeStyle;
  animated?: boolean;
  hidden?: boolean;
  deletable?: boolean;
  focusable?: boolean;
  updatable?: boolean;
  selected?: boolean;
  markerEnd?: {
    type: string;
    width?: number;
    height?: number;
    color?: string;
  };
  markerStart?: {
    type: string;
    width?: number;
    height?: number;
    color?: string;
  };
  zIndex?: number;
  ariaLabel?: string;
  interactionWidth?: number;
  pathOptions?: Record<string, unknown>;
}

// ============================================================================
// Flowchart Document
// ============================================================================

/**
 * Configurações do viewport
 */
export interface FlowchartViewport {
  x: number;
  y: number;
  zoom: number;
}

/**
 * Configurações do grid
 */
export interface FlowchartGrid {
  enabled: boolean;
  size: number;
  color: string;
  opacity: number;
  snap: boolean;
}

/**
 * Configurações do canvas
 */
export interface FlowchartCanvas {
  width: number;
  height: number;
  backgroundColor: string;
  backgroundPattern?: 'dots' | 'lines' | 'cross' | 'none';
  grid: FlowchartGrid;
  viewport: FlowchartViewport;
  panOnDrag: boolean;
  zoomOnScroll: boolean;
  zoomOnPinch: boolean;
  zoomOnDoubleClick: boolean;
  preventScrolling: boolean;
  minZoom: number;
  maxZoom: number;
  defaultZoom: number;
  fitViewOnInit: boolean;
  attributionPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
}

/**
 * Configurações de colaboração
 */
export interface FlowchartCollaboration {
  enabled: boolean;
  realTimeEditing: boolean;
  showCursors: boolean;
  showSelections: boolean;
  maxCollaborators: number;
  permissions: {
    canEdit: boolean;
    canComment: boolean;
    canShare: boolean;
    canExport: boolean;
  };
}

/**
 * Configurações de validação
 */
export interface FlowchartValidation {
  enabled: boolean;
  rules: {
    requireStartNode: boolean;
    requireEndNode: boolean;
    preventOrphanNodes: boolean;
    preventCycles: boolean;
    maxNodes: number;
    maxEdges: number;
    requiredNodeTypes: FlowchartNodeType[];
  };
  autoFix: boolean;
  showWarnings: boolean;
  showErrors: boolean;
}

/**
 * Configurações de exportação
 */
export interface FlowchartExport {
  formats: ('png' | 'jpg' | 'svg' | 'pdf' | 'json' | 'xml')[];
  quality: number;
  resolution: number;
  includeBackground: boolean;
  includeGrid: boolean;
  cropToContent: boolean;
  margin: number;
}

/**
 * Configurações do fluxograma
 */
export interface FlowchartSettings {
  canvas: FlowchartCanvas;
  collaboration: FlowchartCollaboration;
  validation: FlowchartValidation;
  export: FlowchartExport;
  autoSave: {
    enabled: boolean;
    interval: number;
  };
  history: {
    enabled: boolean;
    maxSteps: number;
  };
  shortcuts: {
    enabled: boolean;
    customShortcuts: Record<string, string>;
  };
}

/**
 * Documento de fluxograma
 */
export interface FlowchartDocument {
  id: string;
  title: string;
  description?: string;
  category: FlowchartCategory;
  status: FlowchartStatus;
  access_level: FlowchartAccessLevel;
  tags: string[];
  nodes: FlowchartNode[];
  edges: FlowchartEdge[];
  settings: FlowchartSettings;
  thumbnail?: string;
  version: number;
  is_favorite: boolean;
  view_count: number;
  created_at: string;
  updated_at: string;
  created_by: {
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
    role: 'owner' | 'editor' | 'viewer' | 'commenter';
    permissions: {
      canEdit: boolean;
      canComment: boolean;
      canShare: boolean;
      canExport: boolean;
    };
    last_seen: string;
  }[];
  comments: FlowchartComment[];
  history: FlowchartHistoryEntry[];
}

// ============================================================================
// Template Types
// ============================================================================

/**
 * Template de fluxograma
 */
export interface FlowchartTemplate {
  id: string;
  name: string;
  description: string;
  category: FlowchartCategory;
  tags: string[];
  thumbnail?: string;
  nodes: FlowchartNode[];
  edges: FlowchartEdge[];
  settings: Partial<FlowchartSettings>;
  usage_count: number;
  is_favorite: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  created_by: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

// ============================================================================
// Comment Types
// ============================================================================

/**
 * Comentário no fluxograma
 */
export interface FlowchartComment {
  id: string;
  flowchart_id: string;
  node_id?: string;
  edge_id?: string;
  position?: FlowchartPosition;
  content: string;
  resolved: boolean;
  created_at: string;
  updated_at: string;
  created_by: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
  replies: {
    id: string;
    content: string;
    created_at: string;
    created_by: {
      id: string;
      name: string;
      email: string;
      avatar?: string;
    };
  }[];
}

// ============================================================================
// History Types
// ============================================================================

/**
 * Entrada do histórico
 */
export interface FlowchartHistoryEntry {
  id: string;
  flowchart_id: string;
  action: 'create' | 'update' | 'delete' | 'move' | 'connect' | 'disconnect' | 'style' | 'data';
  target_type: 'node' | 'edge' | 'flowchart' | 'settings';
  target_id?: string;
  changes: {
    before: Record<string, unknown>;
    after: Record<string, unknown>;
  };
  created_at: string;
  created_by: {
    id: string;
    name: string;
    email: string;
    avatar?: string;
  };
}

// ============================================================================
// Editor State
// ============================================================================

/**
 * Estado do editor de fluxogramas
 */
export interface FlowchartEditorState {
  selectedNodes: string[];
  selectedEdges: string[];
  clipboard: {
    nodes: FlowchartNode[];
    edges: FlowchartEdge[];
  };
  history: {
    past: FlowchartDocument[];
    present: FlowchartDocument;
    future: FlowchartDocument[];
  };
  viewport: FlowchartViewport;
  mode: 'select' | 'pan' | 'connect' | 'draw';
  tool: FlowchartNodeType | 'select' | 'pan' | 'zoom';
  isConnecting: boolean;
  connectionSource?: string;
  connectionTarget?: string;
  draggedNode?: FlowchartNode;
  hoveredNode?: string;
  hoveredEdge?: string;
  showGrid: boolean;
  showMinimap: boolean;
  showControls: boolean;
  showBackground: boolean;
  snapToGrid: boolean;
  autoLayout: boolean;
  validationErrors: {
    nodeId?: string;
    edgeId?: string;
    message: string;
    severity: 'error' | 'warning' | 'info';
  }[];
}

// ============================================================================
// Service Configuration
// ============================================================================

/**
 * Configuração do serviço de fluxogramas
 */
export interface FlowchartServiceConfig {
  apiUrl: string;
  supabaseUrl: string;
  supabaseKey: string;
  realTimeEnabled: boolean;
  autoSaveInterval: number;
  maxFileSize: number;
  allowedImageTypes: string[];
  maxHistoryEntries: number;
  collaborationEnabled: boolean;
  validationEnabled: boolean;
  exportEnabled: boolean;
  templatesEnabled: boolean;
  commentsEnabled: boolean;
}

// ============================================================================
// API Types
// ============================================================================

/**
 * Filtros para busca de fluxogramas
 */
export interface FlowchartFilters {
  search?: string;
  category?: FlowchartCategory;
  status?: FlowchartStatus;
  access_level?: FlowchartAccessLevel;
  tags?: string[];
  created_by?: string;
  date_range?: {
    start: string;
    end: string;
  };
  sort_by?: 'created_at' | 'updated_at' | 'title' | 'view_count';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

/**
 * Interface da API de fluxogramas
 */
export interface FlowchartAPI {
  // CRUD operations
  getFlowcharts(filters?: FlowchartFilters): Promise<FlowchartDocument[]>;
  getFlowchart(id: string): Promise<FlowchartDocument>;
  createFlowchart(data: Partial<FlowchartDocument>): Promise<FlowchartDocument>;
  updateFlowchart(id: string, data: Partial<FlowchartDocument>): Promise<FlowchartDocument>;
  deleteFlowchart(id: string): Promise<void>;
  duplicateFlowchart(id: string): Promise<FlowchartDocument>;
  
  // Node operations
  addNode(flowchartId: string, node: Omit<FlowchartNode, 'id'>): Promise<FlowchartNode>;
  updateNode(flowchartId: string, nodeId: string, data: Partial<FlowchartNode>): Promise<FlowchartNode>;
  deleteNode(flowchartId: string, nodeId: string): Promise<void>;
  
  // Edge operations
  addEdge(flowchartId: string, edge: Omit<FlowchartEdge, 'id'>): Promise<FlowchartEdge>;
  updateEdge(flowchartId: string, edgeId: string, data: Partial<FlowchartEdge>): Promise<FlowchartEdge>;
  deleteEdge(flowchartId: string, edgeId: string): Promise<void>;
  
  // Template operations
  getTemplates(filters?: Partial<FlowchartFilters>): Promise<FlowchartTemplate[]>;
  createTemplate(data: Omit<FlowchartTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<FlowchartTemplate>;
  createFromTemplate(templateId: string): Promise<FlowchartDocument>;
  
  // Collaboration
  addCollaborator(flowchartId: string, userId: string, role: string): Promise<void>;
  removeCollaborator(flowchartId: string, userId: string): Promise<void>;
  updateCollaboratorRole(flowchartId: string, userId: string, role: string): Promise<void>;
  
  // Comments
  getComments(flowchartId: string): Promise<FlowchartComment[]>;
  addComment(flowchartId: string, comment: Omit<FlowchartComment, 'id' | 'created_at' | 'updated_at'>): Promise<FlowchartComment>;
  updateComment(commentId: string, content: string): Promise<FlowchartComment>;
  deleteComment(commentId: string): Promise<void>;
  resolveComment(commentId: string): Promise<FlowchartComment>;
  
  // History
  getHistory(flowchartId: string): Promise<FlowchartHistoryEntry[]>;
  
  // Export
  exportFlowchart(flowchartId: string, format: string, options?: Record<string, unknown>): Promise<Blob>;
  
  // Validation
  validateFlowchart(flowchart: FlowchartDocument): Promise<{ isValid: boolean; errors: string[] }>;
}

// ============================================================================
// Hook Return Types
// ============================================================================

/**
 * Retorno do hook useFlowchart
 */
export interface UseFlowchartReturn {
  flowchart: FlowchartDocument | null;
  isLoading: boolean;
  error: string | null;
  updateFlowchart: (data: Partial<FlowchartDocument>) => Promise<void>;
  deleteFlowchart: () => Promise<void>;
  duplicateFlowchart: () => Promise<FlowchartDocument>;
  addNode: (node: Omit<FlowchartNode, 'id'>) => Promise<FlowchartNode>;
  updateNode: (nodeId: string, data: Partial<FlowchartNode>) => Promise<void>;
  deleteNode: (nodeId: string) => Promise<void>;
  addEdge: (edge: Omit<FlowchartEdge, 'id'>) => Promise<FlowchartEdge>;
  updateEdge: (edgeId: string, data: Partial<FlowchartEdge>) => Promise<void>;
  deleteEdge: (edgeId: string) => Promise<void>;
  addComment: (comment: Omit<FlowchartComment, 'id' | 'created_at' | 'updated_at'>) => Promise<void>;
  updateComment: (commentId: string, content: string) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  resolveComment: (commentId: string) => Promise<void>;
  addCollaborator: (userId: string, role: string) => Promise<void>;
  removeCollaborator: (userId: string) => Promise<void>;
  updateCollaboratorRole: (userId: string, role: string) => Promise<void>;
  exportFlowchart: (format: string, options?: Record<string, unknown>) => Promise<Blob>;
  validateFlowchart: () => Promise<{ isValid: boolean; errors: string[] }>;
}

/**
 * Retorno do hook useFlowchartEditor
 */
export interface UseFlowchartEditorReturn {
  editorState: FlowchartEditorState;
  nodes: FlowchartNode[];
  edges: FlowchartEdge[];
  selectedNodes: FlowchartNode[];
  selectedEdges: FlowchartEdge[];
  viewport: FlowchartViewport;
  canUndo: boolean;
  canRedo: boolean;
  
  // Node operations
  addNode: (type: FlowchartNodeType, position: FlowchartPosition, data?: Partial<FlowchartNodeData>) => void;
  updateNode: (nodeId: string, data: Partial<FlowchartNode>) => void;
  deleteNode: (nodeId: string) => void;
  duplicateNode: (nodeId: string) => void;
  moveNode: (nodeId: string, position: FlowchartPosition) => void;
  selectNode: (nodeId: string, multi?: boolean) => void;
  deselectNode: (nodeId: string) => void;
  selectAllNodes: () => void;
  deselectAllNodes: () => void;
  
  // Edge operations
  addEdge: (source: string, target: string, data?: Partial<FlowchartEdgeData>) => void;
  updateEdge: (edgeId: string, data: Partial<FlowchartEdge>) => void;
  deleteEdge: (edgeId: string) => void;
  selectEdge: (edgeId: string, multi?: boolean) => void;
  deselectEdge: (edgeId: string) => void;
  selectAllEdges: () => void;
  deselectAllEdges: () => void;
  
  // Viewport operations
  setViewport: (viewport: Partial<FlowchartViewport>) => void;
  fitView: (options?: { padding?: number; includeHiddenNodes?: boolean }) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomTo: (zoom: number) => void;
  centerView: () => void;
  
  // History operations
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
  
  // Clipboard operations
  copy: () => void;
  cut: () => void;
  paste: (position?: FlowchartPosition) => void;
  
  // Layout operations
  autoLayout: (algorithm?: 'dagre' | 'elk' | 'cola') => void;
  alignNodes: (direction: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => void;
  distributeNodes: (direction: 'horizontal' | 'vertical') => void;
  
  // Validation
  validate: () => { isValid: boolean; errors: string[] };
  
  // Settings
  updateSettings: (settings: Partial<FlowchartSettings>) => void;
  
  // Mode and tool
  setMode: (mode: FlowchartEditorState['mode']) => void;
  setTool: (tool: FlowchartEditorState['tool']) => void;
  
  // Auto-save
  save: () => Promise<void>;
  enableAutoSave: () => void;
  disableAutoSave: () => void;
}

/**
 * Retorno do hook useFlowchartLibrary
 */
export interface UseFlowchartLibraryReturn {
  flowcharts: FlowchartDocument[];
  isLoading: boolean;
  error: string | null;
  createFlowchart: (data: Partial<FlowchartDocument>) => Promise<FlowchartDocument>;
  deleteFlowchart: (id: string) => Promise<void>;
  bulkDelete: (ids: string[]) => Promise<void>;
  duplicateFlowchart: (id: string) => Promise<FlowchartDocument>;
  archiveFlowchart: (id: string) => Promise<void>;
  unarchiveFlowchart: (id: string) => Promise<void>;
  favoriteFlowchart: (id: string) => Promise<void>;
  unfavoriteFlowchart: (id: string) => Promise<void>;
  searchFlowcharts: (filters: FlowchartFilters) => Promise<FlowchartDocument[]>;
}

/**
 * Retorno do hook useFlowchartTemplates
 */
export interface UseFlowchartTemplatesReturn {
  templates: FlowchartTemplate[];
  isLoading: boolean;
  error: string | null;
  createTemplate: (data: Omit<FlowchartTemplate, 'id' | 'created_at' | 'updated_at'>) => Promise<FlowchartTemplate>;
  createFromTemplate: (templateId: string) => Promise<FlowchartDocument>;
  deleteTemplate: (id: string) => Promise<void>;
  favoriteTemplate: (id: string) => Promise<void>;
  unfavoriteTemplate: (id: string) => Promise<void>;
  searchTemplates: (filters: Partial<FlowchartFilters>) => Promise<FlowchartTemplate[]>;
}

// ============================================================================
// Component Props
// ============================================================================

/**
 * Props do componente FlowchartEditor
 */
export interface FlowchartEditorProps {
  flowchartId?: string;
  initialData?: Partial<FlowchartDocument>;
  readOnly?: boolean;
  showToolbar?: boolean;
  showSidebar?: boolean;
  showMinimap?: boolean;
  showControls?: boolean;
  showComments?: boolean;
  showHistory?: boolean;
  showCollaboration?: boolean;
  onSave?: (flowchart: FlowchartDocument) => void;
  onPublish?: (flowchart: FlowchartDocument) => void;
  onShare?: (flowchart: FlowchartDocument) => void;
  onExport?: (format: string, data: Blob) => void;
  className?: string;
}

/**
 * Props do componente NodeEditor
 */
export interface NodeEditorProps {
  node: FlowchartNode;
  isSelected?: boolean;
  isEditing?: boolean;
  readOnly?: boolean;
  onUpdate?: (data: Partial<FlowchartNode>) => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onSelect?: () => void;
  onStartEditing?: () => void;
  onStopEditing?: () => void;
  className?: string;
}

/**
 * Props do componente FlowchartLibrary
 */
export interface FlowchartLibraryProps {
  onSelectFlowchart?: (flowchart: FlowchartDocument) => void;
  onCreateNew?: () => void;
  className?: string;
}

/**
 * Props do componente FlowchartTemplateSelector
 */
export interface FlowchartTemplateSelectorProps {
  onSelectTemplate?: (flowchart: FlowchartDocument) => void;
  onCreateFromScratch?: () => void;
  className?: string;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Tipos de nós disponíveis (BPMN 2.0)
 */
export const FLOWCHART_NODE_TYPES: FlowchartNodeType[] = [
  // Eventos BPMN
  'start',
  'end',
  'intermediate',
  // Atividades BPMN
  'process',
  'subprocess',
  'manual',
  'input',
  'output',
  'delay',
  'preparation',
  'predefined',
  // Gateways BPMN
  'decision',
  'parallel',
  'inclusive',
  'complex',
  'event_based',
  // Artefatos BPMN
  'document',
  'database',
  'annotation',
  'group',
  // Conectores e outros
  'connector',
  'organogram',
  'custom'
];

/**
 * Categorias de fluxogramas
 */
export const FLOWCHART_CATEGORIES: FlowchartCategory[] = [
  'process',
  'workflow',
  'decision_tree',
  'system_design',
  'user_journey',
  'data_flow',
  'organizational',
  'technical',
  'business',
  'general'
];

/**
 * Status de fluxogramas
 */
export const FLOWCHART_STATUS_OPTIONS: FlowchartStatus[] = [
  'draft',
  'published',
  'archived',
  'template'
];

/**
 * Níveis de acesso
 */
export const FLOWCHART_ACCESS_LEVELS: FlowchartAccessLevel[] = [
  'private',
  'team',
  'organization',
  'public'
];

/**
 * Tipos de conexões
 */
export const FLOWCHART_EDGE_TYPES: FlowchartEdgeType[] = [
  'straight',
  'smoothstep',
  'step',
  'bezier',
  'custom'
];