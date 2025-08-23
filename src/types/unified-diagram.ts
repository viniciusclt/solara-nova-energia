// ============================================================================
// Unified Diagram Types - Tipos TypeScript unificados para editores de diagramas
// ============================================================================
// Consolidação dos tipos de /training/DiagramEditor e /flowchart/FlowchartEditor
// Seguindo padrões BPMN 2.0 e referências do MindMeister
// ============================================================================

import { Node, Edge, Viewport, Connection } from 'reactflow';
import { z } from 'zod';

// ============================================================================
// CORE TYPES
// ============================================================================

/**
 * Tipos de diagramas suportados
 */
export type DiagramType = 'flowchart' | 'mindmap' | 'organogram';

/**
 * Tipos de nós BPMN 2.0 compliant + extensões para MindMap e Organogram
 */
export type UnifiedNodeType = 
  // Eventos BPMN
  | 'start'
  | 'end' 
  | 'intermediate'
  // Atividades BPMN
  | 'process'
  | 'subprocess'
  | 'manual'
  | 'user'
  | 'service'
  | 'script'
  | 'business-rule'
  | 'receive'
  | 'send'
  // Gateways BPMN
  | 'decision'
  | 'parallel'
  | 'inclusive'
  | 'exclusive'
  | 'complex'
  | 'event-based'
  // Artefatos BPMN
  | 'document'
  | 'data'
  | 'database'
  | 'annotation'
  | 'group'
  // MindMap específicos
  | 'mindmap-root'
  | 'mindmap-main'
  | 'mindmap-branch'
  | 'mindmap-leaf'
  // Organogram específicos
  | 'org-ceo'
  | 'org-manager'
  | 'org-employee'
  | 'org-department'
  // Conectores e customizados
  | 'connector'
  | 'custom';

/**
 * Tipos de conexões/arestas
 */
export type UnifiedEdgeType = 
  | 'straight'
  | 'smoothstep'
  | 'step'
  | 'bezier'
  | 'custom'
  | 'mindmap-curve'
  | 'org-hierarchy';

/**
 * Status do diagrama
 */
export type DiagramStatus = 
  | 'draft'
  | 'published'
  | 'archived'
  | 'template'
  | 'shared';

/**
 * Categorias de diagramas
 */
export type DiagramCategory = 
  | 'process'
  | 'workflow'
  | 'decision-tree'
  | 'system-design'
  | 'user-journey'
  | 'data-flow'
  | 'organizational'
  | 'training'
  | 'brainstorming'
  | 'planning';

// ============================================================================
// NODE DATA INTERFACES
// ============================================================================

/**
 * Dados base para todos os nós
 */
export interface BaseNodeData {
  label: string;
  description?: string;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold';
  textAlign?: 'left' | 'center' | 'right';
  icon?: string;
  isEditing?: boolean;
  isSelected?: boolean;
  metadata?: Record<string, unknown>;
}

/**
 * Dados específicos para nós BPMN
 */
export interface BPMNNodeData extends BaseNodeData {
  bpmnType: 'event' | 'activity' | 'gateway' | 'artifact';
  subType?: string;
  assignee?: string;
  duration?: number;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  status?: 'pending' | 'in-progress' | 'completed' | 'blocked';
  conditions?: string[];
}

/**
 * Dados específicos para nós de MindMap
 */
export interface MindMapNodeData extends BaseNodeData {
  level: number;
  parentId?: string;
  childrenIds: string[];
  isExpanded: boolean;
  category?: string;
  tags?: string[];
  attachments?: string[];
  notes?: string;
}

/**
 * Dados específicos para nós de Organograma
 */
export interface OrganogramNodeData extends BaseNodeData {
  position: string;
  department: string;
  employeeId?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  reportsTo?: string;
  directReports: string[];
  level: number;
}

/**
 * União de todos os tipos de dados de nós
 */
export type UnifiedNodeData = BaseNodeData | BPMNNodeData | MindMapNodeData | OrganogramNodeData;

// ============================================================================
// EDGE DATA INTERFACES
// ============================================================================

/**
 * Dados para arestas/conexões
 */
export interface UnifiedEdgeData {
  label?: string;
  condition?: string;
  probability?: number;
  color?: string;
  width?: number;
  style?: 'solid' | 'dashed' | 'dotted';
  animated?: boolean;
  markerEnd?: string;
  markerStart?: string;
}

// ============================================================================
// DIAGRAM INTERFACES
// ============================================================================

/**
 * Nó unificado do diagrama
 */
export interface UnifiedDiagramNode extends Omit<Node, 'data' | 'type'> {
  id: string;
  type: UnifiedNodeType;
  position: { x: number; y: number };
  data: UnifiedNodeData;
  width?: number;
  height?: number;
  selected?: boolean;
  dragging?: boolean;
  zIndex?: number;
}

/**
 * Aresta unificada do diagrama
 */
export interface UnifiedDiagramEdge extends Omit<Edge, 'data' | 'type'> {
  id: string;
  type: UnifiedEdgeType;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  data?: UnifiedEdgeData;
  selected?: boolean;
  animated?: boolean;
  hidden?: boolean;
}

/**
 * Configurações do canvas
 */
export interface CanvasSettings {
  showGrid: boolean;
  showMinimap: boolean;
  showControls: boolean;
  snapToGrid: boolean;
  gridSize: number;
  backgroundColor: string;
  panOnDrag: boolean;
  zoomOnScroll: boolean;
  zoomOnPinch: boolean;
  preventScrolling: boolean;
  nodesDraggable: boolean;
  nodesConnectable: boolean;
  elementsSelectable: boolean;
  selectNodesOnDrag: boolean;
  multiSelectionKeyCode: string;
  deleteKeyCode: string;
}

/**
 * Configurações de colaboração
 */
export interface CollaborationSettings {
  enabled: boolean;
  realTimeEditing: boolean;
  showCursors: boolean;
  showUserAvatars: boolean;
  maxCollaborators: number;
  permissions: {
    canEdit: boolean;
    canComment: boolean;
    canShare: boolean;
    canExport: boolean;
    canDelete: boolean;
  };
}

/**
 * Configurações de validação
 */
export interface ValidationSettings {
  enabled: boolean;
  validateBPMN: boolean;
  validateConnections: boolean;
  validateLabels: boolean;
  showWarnings: boolean;
  showErrors: boolean;
  autoFix: boolean;
}

/**
 * Configurações de exportação
 */
export interface ExportSettings {
  formats: ('png' | 'jpg' | 'svg' | 'pdf' | 'json' | 'xml' | 'bpmn')[];
  quality: number;
  resolution: number;
  includeBackground: boolean;
  includeGrid: boolean;
  cropToContent: boolean;
  margin: number;
}

/**
 * Configurações completas do diagrama
 */
export interface DiagramSettings {
  canvas: CanvasSettings;
  collaboration: CollaborationSettings;
  validation: ValidationSettings;
  export: ExportSettings;
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
 * Documento de diagrama unificado
 */
export interface UnifiedDiagramDocument {
  id: string;
  title: string;
  description?: string;
  type: DiagramType;
  category: DiagramCategory;
  status: DiagramStatus;
  tags: string[];
  nodes: UnifiedDiagramNode[];
  edges: UnifiedDiagramEdge[];
  viewport: Viewport;
  settings: DiagramSettings;
  thumbnail?: string;
  version: number;
  isFavorite: boolean;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: {
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
    permissions: CollaborationSettings['permissions'];
    lastSeen: string;
  }[];
  moduleId?: string; // Para integração com módulos de treinamento
  isTemplate: boolean;
  templateCategory?: string;
}

// ============================================================================
// EDITOR STATE INTERFACES
// ============================================================================

/**
 * Estado do histórico (undo/redo)
 */
export interface HistoryState {
  past: UnifiedDiagramDocument[];
  present: UnifiedDiagramDocument;
  future: UnifiedDiagramDocument[];
}

/**
 * Estado de seleção
 */
export interface SelectionState {
  selectedNodes: string[];
  selectedEdges: string[];
  selectionBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

/**
 * Estado de edição
 */
export interface EditingState {
  mode: 'select' | 'pan' | 'add-node' | 'add-edge' | 'edit-text';
  activeNodeType?: UnifiedNodeType;
  activeEdgeType?: UnifiedEdgeType;
  isEditing: boolean;
  editingNodeId?: string;
  clipboard: {
    nodes: UnifiedDiagramNode[];
    edges: UnifiedDiagramEdge[];
  };
}

/**
 * Estado de validação
 */
export interface ValidationState {
  errors: {
    id: string;
    type: 'error' | 'warning' | 'info';
    message: string;
    nodeId?: string;
    edgeId?: string;
  }[];
  isValid: boolean;
  lastValidation: string;
}

/**
 * Estado completo do editor
 */
export interface UnifiedEditorState {
  document: UnifiedDiagramDocument;
  history: HistoryState;
  selection: SelectionState;
  editing: EditingState;
  validation: ValidationState;
  viewport: Viewport;
  ui: {
    showSidebar: boolean;
    showToolbar: boolean;
    showProperties: boolean;
    showMinimap: boolean;
    showGrid: boolean;
    sidebarWidth: number;
    propertiesWidth: number;
  };
  collaboration: {
    isConnected: boolean;
    activeUsers: {
      id: string;
      name: string;
      avatar?: string;
      cursor?: { x: number; y: number };
      selection?: string[];
    }[];
  };
}

/**
 * Alias para compatibilidade com UnifiedToolbar
 */
export type UnifiedDiagramState = UnifiedEditorState & {
  diagramType: DiagramType;
  canUndo: boolean;
  canRedo: boolean;
  selectedNodes: UnifiedDiagramNode[];
  selectedEdges: UnifiedDiagramEdge[];
  clipboard: {
    nodes: UnifiedDiagramNode[];
    edges: UnifiedDiagramEdge[];
  };
  isReadOnly: boolean;
  showGrid: boolean;
  showMinimap: boolean;
};

// ============================================================================
// PROPS INTERFACES
// ============================================================================

/**
 * Props do editor unificado
 */
export interface UnifiedDiagramEditorProps {
  diagramId?: string;
  initialDocument?: Partial<UnifiedDiagramDocument>;
  type?: DiagramType;
  readOnly?: boolean;
  showToolbar?: boolean;
  showSidebar?: boolean;
  showProperties?: boolean;
  className?: string;
  onSave?: (document: UnifiedDiagramDocument) => void;
  onClose?: () => void;
  onExport?: (format: string, data: unknown) => void;
  onShare?: (document: UnifiedDiagramDocument) => void;
  onCollaboratorJoin?: (user: UnifiedEditorState['collaboration']['activeUsers'][0]) => void;
  onValidationChange?: (validation: ValidationState) => void;
}

/**
 * Props da paleta de nós
 */
export interface NodePaletteProps {
  diagramType: DiagramType;
  onNodeSelect: (nodeType: UnifiedNodeType) => void;
  selectedNodeType?: UnifiedNodeType;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  categories?: string[];
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
}

/**
 * Props do painel de propriedades
 */
export interface PropertiesPanelProps {
  selectedNodes: UnifiedDiagramNode[];
  selectedEdges: UnifiedDiagramEdge[];
  onNodeUpdate: (nodeId: string, updates: Partial<UnifiedNodeData>) => void;
  onEdgeUpdate: (edgeId: string, updates: Partial<UnifiedEdgeData>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  readOnly?: boolean;
}

/**
 * Props da barra de ferramentas
 */
export interface ToolbarProps {
  editorState: UnifiedEditorState;
  onSave: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onCopy: () => void;
  onCut: () => void;
  onPaste: () => void;
  onDelete: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomToFit: () => void;
  onExport: (format: string) => void;
  onShare: () => void;
  onValidate: () => void;
  onToggleGrid: () => void;
  onToggleMinimap: () => void;
  readOnly?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Tipos de nós disponíveis por categoria
 */
export const NODE_TYPES_BY_CATEGORY = {
  events: ['start', 'end', 'intermediate'] as UnifiedNodeType[],
  activities: ['process', 'subprocess', 'manual', 'user', 'service', 'script', 'business-rule', 'receive', 'send'] as UnifiedNodeType[],
  gateways: ['decision', 'parallel', 'inclusive', 'exclusive', 'complex', 'event-based'] as UnifiedNodeType[],
  artifacts: ['document', 'data', 'database', 'annotation', 'group'] as UnifiedNodeType[],
  mindmap: ['mindmap-root', 'mindmap-main', 'mindmap-branch', 'mindmap-leaf'] as UnifiedNodeType[],
  organogram: ['org-ceo', 'org-manager', 'org-employee', 'org-department'] as UnifiedNodeType[],
  other: ['connector', 'custom'] as UnifiedNodeType[]
};

/**
 * Configurações padrão do diagrama
 */
export const DEFAULT_DIAGRAM_SETTINGS: DiagramSettings = {
  canvas: {
    showGrid: true,
    showMinimap: true,
    showControls: true,
    snapToGrid: false,
    gridSize: 20,
    backgroundColor: '#ffffff',
    panOnDrag: true,
    zoomOnScroll: true,
    zoomOnPinch: true,
    preventScrolling: true,
    nodesDraggable: true,
    nodesConnectable: true,
    elementsSelectable: true,
    selectNodesOnDrag: false,
    multiSelectionKeyCode: 'Meta',
    deleteKeyCode: 'Delete'
  },
  collaboration: {
    enabled: false,
    realTimeEditing: false,
    showCursors: true,
    showUserAvatars: true,
    maxCollaborators: 10,
    permissions: {
      canEdit: true,
      canComment: true,
      canShare: false,
      canExport: true,
      canDelete: false
    }
  },
  validation: {
    enabled: true,
    validateBPMN: true,
    validateConnections: true,
    validateLabels: false,
    showWarnings: true,
    showErrors: true,
    autoFix: false
  },
  export: {
    formats: ['png', 'jpg', 'svg', 'pdf', 'json'],
    quality: 1.0,
    resolution: 300,
    includeBackground: true,
    includeGrid: false,
    cropToContent: true,
    margin: 20
  },
  autoSave: {
    enabled: true,
    interval: 30000 // 30 segundos
  },
  history: {
    enabled: true,
    maxSteps: 50
  },
  shortcuts: {
    enabled: true,
    customShortcuts: {
      'ctrl+z': 'undo',
      'ctrl+y': 'redo',
      'ctrl+c': 'copy',
      'ctrl+v': 'paste',
      'ctrl+x': 'cut',
      'delete': 'delete',
      'ctrl+a': 'selectAll',
      'escape': 'deselect'
    }
  }
};

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Schema de validação para nós
 */
export const NodeDataSchema = z.object({
  label: z.string().min(1, 'Label é obrigatório'),
  description: z.string().optional(),
  color: z.string().optional(),
  backgroundColor: z.string().optional(),
  borderColor: z.string().optional(),
  fontSize: z.number().min(8).max(72).optional(),
  fontWeight: z.enum(['normal', 'bold']).optional(),
  textAlign: z.enum(['left', 'center', 'right']).optional(),
  icon: z.string().optional(),
  metadata: z.record(z.unknown()).optional()
});

/**
 * Schema de validação para arestas
 */
export const EdgeDataSchema = z.object({
  label: z.string().optional(),
  condition: z.string().optional(),
  probability: z.number().min(0).max(1).optional(),
  color: z.string().optional(),
  width: z.number().min(1).max(10).optional(),
  style: z.enum(['solid', 'dashed', 'dotted']).optional(),
  animated: z.boolean().optional()
});

/**
 * Schema de validação para documento
 */
export const DiagramDocumentSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Título é obrigatório'),
  description: z.string().optional(),
  type: z.enum(['flowchart', 'mindmap', 'organogram']),
  category: z.enum(['process', 'workflow', 'decision-tree', 'system-design', 'user-journey', 'data-flow', 'organizational', 'training', 'brainstorming', 'planning']),
  status: z.enum(['draft', 'published', 'archived', 'template', 'shared']),
  tags: z.array(z.string()),
  nodes: z.array(z.object({
    id: z.string(),
    type: z.string(),
    position: z.object({ x: z.number(), y: z.number() }),
    data: NodeDataSchema
  })),
  edges: z.array(z.object({
    id: z.string(),
    type: z.string(),
    source: z.string(),
    target: z.string(),
    data: EdgeDataSchema.optional()
  })),
  version: z.number().min(1),
  createdAt: z.string(),
  updatedAt: z.string()
});

export type ValidatedDiagramDocument = z.infer<typeof DiagramDocumentSchema>;
export type ValidatedNodeData = z.infer<typeof NodeDataSchema>;
export type ValidatedEdgeData = z.infer<typeof EdgeDataSchema>;