// ============================================================================
// DIAGRAMS MODULE - TYPE DEFINITIONS
// ============================================================================
// Tipos TypeScript completos para o módulo de diagramas
// Suporte para Flowchart, MindMap e Organogram
// ============================================================================

import { Node, Edge, Viewport, Connection } from 'reactflow';
import { z } from 'zod';
import type { EnhancedUIConfig } from '../ui';

// ============================================================================
// CORE TYPES
// ============================================================================

// Tipos básicos de diagrama
export type DiagramType = 'flowchart' | 'mindmap' | 'organogram';
export type NodeType = 
  // Flowchart BPMN types
  | 'flowchart-start' | 'flowchart-process' | 'flowchart-decision' | 'flowchart-end' 
  | 'flowchart-data' | 'flowchart-document' | 'flowchart-subprocess' | 'flowchart-connector' 
  | 'flowchart-annotation' | 'flowchart-parallel' | 'flowchart-inclusive'
  // Legacy flowchart types (for backward compatibility)
  | 'start' | 'process' | 'decision' | 'end' | 'data' | 'document' 
  | 'subprocess' | 'connector' | 'annotation' | 'parallel' | 'inclusive'
  // Mindmap types
  | 'mindmap-central' | 'mindmap-main' | 'mindmap-secondary' | 'mindmap-leaf'
  | 'root' | 'branch' | 'leaf' | 'idea'
  // Organogram types
  | 'organogram-ceo' | 'organogram-director' | 'organogram-manager' | 'organogram-employee'
  | 'ceo' | 'director' | 'manager' | 'teamlead' | 'employee' | 'department';
export type EdgeType = 'default' | 'straight' | 'step' | 'smoothstep' | 'bezier' | 'auto-routed' | 'smart' | 'animated' | 'custom-bezier';
export type NodeCategory = 'flowchart' | 'mindmap' | 'organogram';

// Constantes
export const DIAGRAM_TYPES: DiagramType[] = ['flowchart', 'mindmap', 'organogram'];
export const NODE_CATEGORIES: NodeCategory[] = ['flowchart', 'mindmap', 'organogram'];
export const EDGE_TYPES: EdgeType[] = ['default', 'straight', 'step', 'smoothstep', 'bezier', 'auto-routed', 'smart', 'animated', 'custom-bezier'];

export const FLOWCHART_NODE_TYPES: NodeType[] = [
  'flowchart-start', 'flowchart-process', 'flowchart-decision', 'flowchart-end', 
  'flowchart-data', 'flowchart-document', 'flowchart-subprocess', 'flowchart-connector', 
  'flowchart-annotation', 'flowchart-parallel', 'flowchart-inclusive'
];

export const MINDMAP_NODE_TYPES: NodeType[] = [
  'mindmap-central', 'mindmap-main', 'mindmap-secondary', 'mindmap-leaf'
];

export const ORGANOGRAM_NODE_TYPES: NodeType[] = [
  'organogram-ceo', 'organogram-director', 'organogram-manager', 'organogram-employee'
];

// Posição e dimensões
export interface DiagramPosition {
  x: number;
  y: number;
}

export interface DiagramSize {
  width: number;
  height: number;
}

export interface DiagramBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

// ============================================================================
// NODE DEFINITIONS
// ============================================================================

// Dados base do nó
export interface BaseDiagramNodeData {
  label: string;
  description?: string;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | 'lighter';
  icon?: string;
  image?: string;
  metadata?: Record<string, string | number | boolean | null>;
  isEditable?: boolean;
  isSelectable?: boolean;
  isDeletable?: boolean;
  isConnectable?: boolean;
  validation?: {
    required?: boolean;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
  };
}

// Dados específicos por tipo de diagrama
export interface FlowchartNodeData extends BaseDiagramNodeData {
  category: 'flowchart';
  flowchartType: 'start' | 'process' | 'decision' | 'end' | 'data' | 'document' | 'subprocess' | 'connector' | 'annotation' | 'parallel' | 'inclusive';
  shape: 'rectangle' | 'diamond' | 'circle' | 'hexagon' | 'parallelogram';
  conditions?: { yes?: string; no?: string; [key: string]: string | undefined };
  actions?: string[];
  variables?: Record<string, string | number | boolean>;
  status?: 'pending' | 'completed' | 'error' | 'warning';
}

export interface MindMapNodeData extends BaseDiagramNodeData {
  category: 'mindmap';
  level: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[];
  notes?: string;
  attachments?: string[];
  dueDate?: string;
  status?: 'todo' | 'in-progress' | 'done' | 'blocked';
}

export interface OrganogramNodeData extends BaseDiagramNodeData {
  category: 'organogram';
  position: string;
  department: string;
  level: number;
  employeeId?: string;
  email?: string;
  phone?: string;
  avatar?: string;
  skills?: string[];
  reports?: string[];
}

// União de todos os tipos de dados de nó
export type DiagramNodeData = FlowchartNodeData | MindMapNodeData | OrganogramNodeData;

// Nó completo do diagrama
export interface DiagramNode extends Omit<Node, 'data'> {
  data: DiagramNodeData;
  category: NodeCategory;
  createdAt: string;
  updatedAt: string;
  version: number;
}

// ============================================================================
// EDGE DEFINITIONS
// ============================================================================

export interface DiagramEdgeData {
  label?: string;
  color?: string;
  strokeWidth?: number;
  strokeDasharray?: string;
  animated?: boolean;
  conditions?: string[];
  probability?: number;
  weight?: number;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface DiagramEdge extends Omit<Edge, 'data'> {
  data?: DiagramEdgeData;
  category: NodeCategory;
  createdAt: string;
  updatedAt: string;
  version: number;
}

// ============================================================================
// ZOD SCHEMAS
// ============================================================================

// Schema para validação de posição
export const DiagramPositionSchema = z.object({
  x: z.number(),
  y: z.number()
});

// Schema para validação de dados base do nó
export const BaseDiagramNodeDataSchema = z.object({
  label: z.string().min(1).max(100),
  description: z.string().optional(),
  color: z.string().optional(),
  backgroundColor: z.string().optional(),
  borderColor: z.string().optional(),
  textColor: z.string().optional(),
  fontSize: z.number().min(8).max(72).optional(),
  fontWeight: z.enum(['normal', 'bold', 'lighter']).optional(),
  icon: z.string().optional(),
  image: z.string().url().optional(),
  metadata: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional(),
  isEditable: z.boolean().optional(),
  isSelectable: z.boolean().optional(),
  isDeletable: z.boolean().optional(),
  isConnectable: z.boolean().optional(),
  validation: z.object({
    required: z.boolean().optional(),
    minLength: z.number().optional(),
    maxLength: z.number().optional(),
    pattern: z.string().optional()
  }).optional()
});

// Schema para validação de nó de fluxograma
export const FlowchartNodeDataSchema = BaseDiagramNodeDataSchema.extend({
  category: z.literal('flowchart'),
  flowchartType: z.enum(['start', 'process', 'decision', 'end', 'data', 'document', 'subprocess', 'connector', 'annotation', 'parallel', 'inclusive']),
  shape: z.enum(['rectangle', 'diamond', 'circle', 'hexagon', 'parallelogram']),
  conditions: z.record(z.string()).optional(),
  actions: z.array(z.string()).optional(),
  variables: z.record(z.union([z.string(), z.number(), z.boolean()])).optional(),
  status: z.enum(['pending', 'completed', 'error', 'warning']).optional()
});

// Schema para validação de nó de mapa mental
export const MindMapNodeDataSchema = BaseDiagramNodeDataSchema.extend({
  category: z.literal('mindmap'),
  level: z.number().min(0).max(10),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  attachments: z.array(z.string()).optional(),
  dueDate: z.string().optional(),
  status: z.enum(['todo', 'in-progress', 'done', 'blocked']).optional()
});

// Schema para validação de nó de organograma
export const OrganogramNodeDataSchema = BaseDiagramNodeDataSchema.extend({
  category: z.literal('organogram'),
  position: z.string().min(1).max(100),
  department: z.string().min(1).max(100),
  level: z.number().min(0).max(10),
  employeeId: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  avatar: z.string().url().optional(),
  skills: z.array(z.string()).optional(),
  reports: z.array(z.string()).optional()
});

// Schema para validação de dados de nó
export const DiagramNodeDataSchema = z.discriminatedUnion('category', [
  FlowchartNodeDataSchema,
  MindMapNodeDataSchema,
  OrganogramNodeDataSchema
]);

// Schema para validação de nó completo
export const DiagramNodeSchema = z.object({
  id: z.string(),
  type: z.string(),
  position: DiagramPositionSchema,
  data: DiagramNodeDataSchema,
  category: z.enum(['flowchart', 'mindmap', 'organogram']),
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.number().min(1),
  width: z.number().optional(),
  height: z.number().optional(),
  selected: z.boolean().optional(),
  dragging: z.boolean().optional(),
  selectable: z.boolean().optional(),
  connectable: z.boolean().optional(),
  deletable: z.boolean().optional(),
  dragHandle: z.string().optional(),
  extent: z.enum(['parent']).or(z.array(z.array(z.number()))).optional(),
  expandParent: z.boolean().optional(),
  positionAbsolute: DiagramPositionSchema.optional(),
  ariaLabel: z.string().optional(),
  focusable: z.boolean().optional(),
  style: z.record(z.union([z.string(), z.number()])).optional(),
  className: z.string().optional(),
  sourcePosition: z.enum(['top', 'right', 'bottom', 'left']).optional(),
  targetPosition: z.enum(['top', 'right', 'bottom', 'left']).optional(),
  hidden: z.boolean().optional(),
  zIndex: z.number().optional()
});

// Schema para validação de aresta
export const DiagramEdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  type: z.string().optional(),
  data: z.object({
    label: z.string().optional(),
    color: z.string().optional(),
    strokeWidth: z.number().optional(),
    strokeDasharray: z.string().optional(),
    animated: z.boolean().optional(),
    conditions: z.array(z.string()).optional(),
    probability: z.number().min(0).max(1).optional(),
    weight: z.number().optional(),
    metadata: z.record(z.union([z.string(), z.number(), z.boolean(), z.null()])).optional()
  }).optional(),
  category: z.enum(['flowchart', 'mindmap', 'organogram']),
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.number().min(1),
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
  selected: z.boolean().optional(),
  animated: z.boolean().optional(),
  hidden: z.boolean().optional(),
  deletable: z.boolean().optional(),
  selectable: z.boolean().optional(),
  focusable: z.boolean().optional(),
  style: z.record(z.unknown()).optional(),
  className: z.string().optional(),
  zIndex: z.number().optional(),
  ariaLabel: z.string().optional(),
  interactionWidth: z.number().optional(),
  markerStart: z.string().optional(),
  markerEnd: z.string().optional(),
  pathOptions: z.record(z.union([z.string(), z.number(), z.boolean()])).optional()
});

// ============================================================================
// CONFIGURATION & SETTINGS
// ============================================================================

export interface DiagramViewport {
  x: number;
  y: number;
  zoom: number;
}

export interface DiagramSettings {
  snapToGrid: boolean;
  gridSize: number;
  showGrid: boolean;
  showMinimap: boolean;
  showControls: boolean;
  showBackground: boolean;
  allowZoom: boolean;
  allowPan: boolean;
  allowSelection: boolean;
  allowMultiSelection: boolean;
  allowNodeDrag: boolean;
  allowEdgeEdit: boolean;
  maxZoom: number;
  minZoom: number;
  defaultZoom: number;
  fitViewOnLoad: boolean;
  animateTransitions: boolean;
  theme: 'light' | 'dark' | 'auto';
  colorScheme: 'default' | 'colorful' | 'monochrome' | 'high-contrast';
  accessibility: {
    enableKeyboardNavigation: boolean;
    enableScreenReader: boolean;
    enableFocusIndicators: boolean;
    enableHighContrast: boolean;
  };
}

export interface DiagramConfig {
  id: string;
  type: DiagramType;
  title: string;
  description?: string;
  category: NodeCategory;
  settings: DiagramSettings;
  metadata: {
    author?: string;
    tags?: string[];
    version: string;
    lastModified: string;
    permissions?: {
      read: string[];
      write: string[];
      admin: string[];
    };
  };
}

// ============================================================================
// DOCUMENT & STATE
// ============================================================================

export interface DiagramDocument {
  id: string;
  config: DiagramConfig;
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  viewport: DiagramViewport;
  history: {
    past: DiagramState[];
    present: DiagramState;
    future: DiagramState[];
  };
  createdAt: string;
  updatedAt: string;
  version: string;
}

export interface DiagramState {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  selectedNodes: string[];
  selectedEdges: string[];
  viewport: DiagramViewport;
  isLoading: boolean;
  isDirty: boolean;
  lastSaved?: string;
  error?: string;
}

export interface DiagramActions {
  // Node operations
  addNode: (node: Omit<DiagramNode, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => Promise<void>;
  updateNode: (id: string, updates: Partial<DiagramNode>) => Promise<void>;
  deleteNode: (id: string) => Promise<void>;
  duplicateNode: (id: string) => void;
  selectNode: (id: string, multi?: boolean) => void;
  deselectNode: (id: string) => void;
  selectAllNodes: () => void;
  deselectAllNodes: () => void;
  
  // Edge operations
  addEdge: (edge: Omit<DiagramEdge, 'id' | 'createdAt' | 'updatedAt' | 'version'>) => Promise<void>;
  updateEdge: (id: string, updates: Partial<DiagramEdge>) => Promise<void>;
  deleteEdge: (id: string) => Promise<void>;
  selectEdge: (id: string, multi?: boolean) => void;
  deselectEdge: (id: string) => void;
  selectAllEdges: () => void;
  deselectAllEdges: () => void;
  
  // Viewport operations
  setViewport: (viewport: DiagramViewport) => void;
  fitView: (options?: { padding?: number; includeHiddenNodes?: boolean }) => void;
  zoomIn: () => void;
  zoomOut: () => void;
  zoomToFit: () => void;
  centerView: () => void;
  
  // History operations
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
  
  // Document operations
  loadDocument: (document: DiagramDocument) => void;
  saveDocument: () => Promise<void>;
  exportDocument: (format: 'json' | 'png' | 'svg' | 'pdf') => Promise<void>;
  importDocument: (data: string | File) => Promise<void>;
  
  // Settings operations
  updateSettings: (settings: Partial<DiagramSettings>) => void;
  resetSettings: () => void;
  
  // Utility operations
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setDirty: (dirty: boolean) => void;
}

// ============================================================================
// ZOD SCHEMAS FOR CONFIGURATION
// ============================================================================

export const DiagramViewportSchema = z.object({
  x: z.number(),
  y: z.number(),
  zoom: z.number().min(0.1).max(10)
});

export const DiagramSettingsSchema = z.object({
  snapToGrid: z.boolean().default(false),
  gridSize: z.number().min(5).max(100).default(20),
  showGrid: z.boolean().default(true),
  showMinimap: z.boolean().default(true),
  showControls: z.boolean().default(true),
  showBackground: z.boolean().default(true),
  allowZoom: z.boolean().default(true),
  allowPan: z.boolean().default(true),
  allowSelection: z.boolean().default(true),
  allowMultiSelection: z.boolean().default(true),
  allowNodeDrag: z.boolean().default(true),
  allowEdgeEdit: z.boolean().default(true),
  maxZoom: z.number().min(1).max(10).default(3),
  minZoom: z.number().min(0.1).max(1).default(0.1),
  defaultZoom: z.number().min(0.1).max(10).default(1),
  fitViewOnLoad: z.boolean().default(true),
  animateTransitions: z.boolean().default(true),
  theme: z.enum(['light', 'dark', 'auto']).default('light'),
  colorScheme: z.enum(['default', 'colorful', 'monochrome', 'high-contrast']).default('default'),
  accessibility: z.object({
    enableKeyboardNavigation: z.boolean().default(true),
    enableScreenReader: z.boolean().default(true),
    enableFocusIndicators: z.boolean().default(true),
    enableHighContrast: z.boolean().default(false)
  }).default({})
});

export const DiagramConfigSchema = z.object({
  id: z.string(),
  type: z.enum(['flowchart', 'mindmap', 'organogram']),
  title: z.string().min(1).max(200),
  description: z.string().max(1000).optional(),
  category: z.enum(['flowchart', 'mindmap', 'organogram']),
  settings: DiagramSettingsSchema,
  metadata: z.object({
    author: z.string().optional(),
    tags: z.array(z.string()).optional(),
    version: z.string(),
    lastModified: z.string(),
    permissions: z.object({
      read: z.array(z.string()),
      write: z.array(z.string()),
      admin: z.array(z.string())
    }).optional()
  })
});

export const DiagramDocumentSchema = z.object({
  id: z.string(),
  config: DiagramConfigSchema,
  nodes: z.array(DiagramNodeSchema),
  edges: z.array(DiagramEdgeSchema),
  viewport: DiagramViewportSchema,
  history: z.object({
    past: z.array(z.object({
      nodes: z.array(DiagramNodeSchema),
      edges: z.array(DiagramEdgeSchema),
      selectedNodes: z.array(z.string()),
      selectedEdges: z.array(z.string()),
      viewport: DiagramViewportSchema
    })),
    present: z.object({
      nodes: z.array(DiagramNodeSchema),
      edges: z.array(DiagramEdgeSchema),
      selectedNodes: z.array(z.string()),
      selectedEdges: z.array(z.string()),
      viewport: DiagramViewportSchema
    }),
    future: z.array(z.object({
      nodes: z.array(DiagramNodeSchema),
      edges: z.array(DiagramEdgeSchema),
      selectedNodes: z.array(z.string()),
      selectedEdges: z.array(z.string()),
      viewport: DiagramViewportSchema
    }))
  }),
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.string()
});

// ============================================================================
// COMPONENT INTERFACES
// ============================================================================

// Props do DiagramEditor
export interface DiagramEditorProps {
  id?: string;
  initialDocument?: DiagramDocument;
  config?: Partial<DiagramConfig>;
  className?: string;
  style?: React.CSSProperties;
  readOnly?: boolean;
  autoSave?: boolean;
  autoSaveInterval?: number;
  showToolbar?: boolean;
  showPalette?: boolean;
  showMinimap?: boolean;
  showControls?: boolean;
  showBackground?: boolean;
  useAdvancedComponents?: boolean;
  useEnhancedUI?: boolean;
  enhancedUIConfig?: EnhancedUIConfig;
  enableKeyboardShortcuts?: boolean;
  enableContextMenu?: boolean;
  enableDragAndDrop?: boolean;
  enableMultiSelection?: boolean;
  enableUndo?: boolean;
  maxHistorySize?: number;
  onSave?: (document: DiagramDocument) => Promise<void>;
  onLoad?: (id: string) => Promise<DiagramDocument>;
  onExport?: (document: DiagramDocument, format: 'json' | 'png' | 'svg' | 'pdf') => Promise<void>;
  onImport?: (data: string | File) => Promise<DiagramDocument>;
  onChange?: (document: DiagramDocument) => void;
  onSelectionChange?: (selectedNodes: string[], selectedEdges: string[]) => void;
  onError?: (error: Error) => void;
}

// Props do DiagramCanvas
export interface DiagramCanvasProps {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
  viewport: DiagramViewport;
  settings: DiagramSettings;
  selectedNodes: string[];
  selectedEdges: string[];
  nodeTypes: Record<string, React.ComponentType<{ data: DiagramNodeData; selected?: boolean; }>>;
  edgeTypes?: Record<string, React.ComponentType<{ data?: DiagramEdgeData; selected?: boolean; }>>;
  className?: string;
  style?: React.CSSProperties;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  onSelectionChange?: (selectedNodes: string[], selectedEdges: string[]) => void;
  onViewportChange?: (viewport: DiagramViewport) => void;
  onNodeClick?: (event: React.MouseEvent, node: DiagramNode) => void;
  onNodeDoubleClick?: (event: React.MouseEvent, node: DiagramNode) => void;
  onNodeContextMenu?: (event: React.MouseEvent, node: DiagramNode) => void;
  onEdgeClick?: (event: React.MouseEvent, edge: DiagramEdge) => void;
  onEdgeDoubleClick?: (event: React.MouseEvent, edge: DiagramEdge) => void;
  onEdgeContextMenu?: (event: React.MouseEvent, edge: DiagramEdge) => void;
  onPaneClick?: (event: React.MouseEvent) => void;
  onPaneContextMenu?: (event: React.MouseEvent) => void;
}

// Props do DiagramToolbar
export interface DiagramToolbarProps {
  className?: string;
  style?: React.CSSProperties;
  orientation?: 'horizontal' | 'vertical';
  size?: 'small' | 'medium' | 'large';
  showLabels?: boolean;
  showTooltips?: boolean;
  disabled?: boolean;
  canUndo?: boolean;
  canRedo?: boolean;
  canSave?: boolean;
  isLoading?: boolean;
  isDirty?: boolean;
  onSave?: () => void;
  onLoad?: () => void;
  onExport?: (format: 'json' | 'png' | 'svg' | 'pdf') => void;
  onImport?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onZoomToFit?: () => void;
  onFitView?: () => void;
  onCenterView?: () => void;
  onSelectAll?: () => void;
  onDeselectAll?: () => void;
  onDelete?: () => void;
  onCopy?: () => void;
  onPaste?: () => void;
  onDuplicate?: () => void;
  onSettings?: () => void;
  onHelp?: () => void;
}

// Props do DiagramPalette
export interface DiagramPaletteProps {
  category: NodeCategory;
  nodeTypes: Array<{
    type: string;
    label: string;
    description?: string;
    icon?: React.ReactNode;
    category: string;
    subcategory?: string;
    tags?: string[];
    preview?: React.ReactNode;
    data?: Partial<DiagramNodeData>;
  }>;
  className?: string;
  style?: React.CSSProperties;
  collapsible?: boolean;
  defaultCollapsed?: boolean;
  searchable?: boolean;
  filterable?: boolean;
  groupByCategory?: boolean;
  showPreviews?: boolean;
  showDescriptions?: boolean;
  dragAndDrop?: boolean;
  onNodeSelect?: (nodeType: string) => void;
  onNodeDragStart?: (event: React.DragEvent, nodeType: string) => void;
  onNodeDragEnd?: (event: React.DragEvent, nodeType: string) => void;
  onCategoryChange?: (category: string) => void;
  onSearch?: (query: string) => void;
  onFilter?: (filters: Record<string, string | boolean | number>) => void;
}

// ============================================================================
// DEFAULT CONFIGURATIONS
// ============================================================================

export const DEFAULT_DIAGRAM_SETTINGS: DiagramSettings = {
  snapToGrid: false,
  gridSize: 20,
  showGrid: true,
  showMinimap: true,
  showControls: true,
  showBackground: true,
  allowZoom: true,
  allowPan: true,
  allowSelection: true,
  allowMultiSelection: true,
  allowNodeDrag: true,
  allowEdgeEdit: true,
  maxZoom: 3,
  minZoom: 0.1,
  defaultZoom: 1,
  fitViewOnLoad: true,
  animateTransitions: true,
  theme: 'light',
  colorScheme: 'default',
  accessibility: {
    enableKeyboardNavigation: true,
    enableScreenReader: true,
    enableFocusIndicators: true,
    enableHighContrast: false
  }
};

export const DEFAULT_DIAGRAM_VIEWPORT: DiagramViewport = {
  x: 0,
  y: 0,
  zoom: 1
};

export const DEFAULT_NODE_POSITION: DiagramPosition = {
  x: 100,
  y: 100
};

export const DEFAULT_NODE_SIZE: DiagramSize = {
  width: 150,
  height: 40
};

export const DEFAULT_DIAGRAM_CONFIG: Omit<DiagramConfig, 'id' | 'metadata'> = {
  type: 'flowchart',
  title: 'Novo Diagrama',
  description: '',
  category: 'flowchart',
  settings: DEFAULT_DIAGRAM_SETTINGS
};

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type DiagramEventHandler<T = unknown> = (event: T) => void;
export type DiagramAsyncEventHandler<T = unknown> = (event: T) => Promise<void>;

export interface DiagramContextMenuAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  disabled?: boolean;
  separator?: boolean;
  submenu?: DiagramContextMenuAction[];
  onClick: () => void;
}

export interface DiagramKeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  shiftKey?: boolean;
  altKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description?: string;
}

export interface DiagramValidationResult {
  isValid: boolean;
  errors: Array<{
    type: 'error' | 'warning' | 'info';
    message: string;
    nodeId?: string;
    edgeId?: string;
    field?: string;
  }>;
}

export interface DiagramMetrics {
  nodeCount: number;
  edgeCount: number;
  selectedNodeCount: number;
  selectedEdgeCount: number;
  totalArea: number;
  boundingBox: DiagramBounds;
  complexity: number;
  depth: number;
  width: number;
  cycles: number;
  isolatedNodes: number;
  performance: {
    renderTime: number;
    updateTime: number;
    memoryUsage: number;
  };
}

// ============================================================================
// EXPORT TYPES
// ============================================================================

export type { Node, Edge, NodeChange, EdgeChange, Connection } from 'reactflow';

// Re-export all types for convenience
export type {
  DiagramType,
  NodeType,
  EdgeType,
  NodeCategory,
  DiagramPosition,
  DiagramSize,
  DiagramBounds,
  BaseDiagramNodeData,
  FlowchartNodeData,
  MindMapNodeData,
  OrganogramNodeData,
  DiagramNodeData,
  DiagramNode,
  DiagramEdgeData,
  DiagramEdge,
  DiagramViewport,
  DiagramSettings,
  DiagramConfig,
  DiagramDocument,
  DiagramState,
  DiagramActions
};