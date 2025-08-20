// Types for Proposal Editor System

// Enums
export enum TemplateFormat {
  A4 = 'A4',
  PRESENTATION = '16:9'
}

export enum ElementType {
  TEXT = 'text',
  IMAGE = 'image',
  CHART = 'chart',
  TABLE = 'table',
  SHAPE = 'shape'
}

export enum ShapeType {
  RECTANGLE = 'rectangle',
  CIRCLE = 'circle',
  TRIANGLE = 'triangle',
  LINE = 'line'
}

export enum ChartType {
  BAR = 'bar',
  LINE = 'line',
  PIE = 'pie',
  AREA = 'area',
  DONUT = 'donut'
}

// Base interfaces
export interface Position {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CanvasData {
  width: number;
  height: number;
  background: string;
  theme?: string;
  gridSize?: number;
  showGrid?: boolean;
}

// Element Properties
export interface TextProperties {
  content: string;
  fontSize: number;
  fontFamily?: string;
  fontWeight?: 'normal' | 'bold' | 'lighter';
  color: string;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
  letterSpacing?: number;
}

export interface ImageProperties {
  src: string;
  alt?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down';
  opacity?: number;
  borderRadius?: number;
}

export interface ChartProperties {
  type: ChartType;
  data: Record<string, unknown>[];
  config: {
    title?: string;
    xAxis?: string;
    yAxis?: string;
    colors?: string[];
    showLegend?: boolean;
    showGrid?: boolean;
  };
}

export interface TableProperties {
  headers: string[];
  rows: string[][];
  styling: {
    headerBg?: string;
    headerColor?: string;
    rowBg?: string;
    rowColor?: string;
    borderColor?: string;
    fontSize?: number;
  };
}

export interface ShapeProperties {
  type: ShapeType;
  fill: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  borderRadius?: number;
}

type ElementProperties = 
  | TextProperties 
  | ImageProperties 
  | ChartProperties 
  | TableProperties 
  | ShapeProperties;

// Main interfaces
export interface ProposalTemplate {
  id: string;
  name: string;
  format: TemplateFormat;
  canvas_data: CanvasData;
  thumbnail_url?: string;
  is_public: boolean;
  company_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface ProposalElement {
  id: string;
  template_id: string;
  element_type: ElementType;
  properties: ElementProperties;
  position: Position;
  z_index: number;
  created_at: string;
}

// Canvas state management
export interface CanvasState {
  template: ProposalTemplate | null;
  elements: ProposalElement[];
  selectedElementId: string | null;
  clipboard: ProposalElement | null;
  history: {
    past: ProposalElement[][];
    present: ProposalElement[];
    future: ProposalElement[][];
  };
  zoom: number;
  pan: { x: number; y: number };
}

// Editor actions
export interface ElementAction {
  type: 'add' | 'update' | 'delete' | 'move' | 'resize' | 'copy' | 'paste';
  elementId?: string;
  element?: Partial<ProposalElement>;
  position?: Partial<Position>;
  properties?: Partial<ElementProperties>;
}

// API interfaces
export interface CreateTemplateRequest {
  name: string;
  format: TemplateFormat;
  canvas_data: CanvasData;
  is_public?: boolean;
}

export interface UpdateTemplateRequest {
  name?: string;
  canvas_data?: CanvasData;
  thumbnail_url?: string;
  is_public?: boolean;
}

export interface CreateElementRequest {
  template_id: string;
  element_type: ElementType;
  properties: ElementProperties;
  position: Position;
  z_index?: number;
}

export interface UpdateElementRequest {
  properties?: Partial<ElementProperties>;
  position?: Partial<Position>;
  z_index?: number;
}

// Template library
export interface TemplateLibrary {
  templates: ProposalTemplate[];
  categories: TemplateCategory[];
  total: number;
  page: number;
  limit: number;
}

export interface TemplateCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  template_count: number;
}

// Export options
export interface ExportOptions {
  format: 'pdf' | 'png' | 'jpg' | 'svg';
  quality?: number;
  scale?: number;
  background?: boolean;
}

// Drag and drop
export interface DragItem {
  type: ElementType;
  properties?: Partial<ElementProperties>;
  position?: Partial<Position>;
}

export interface DropResult {
  position: Position;
  element: ProposalElement;
}

// Toolbar configuration
export interface ToolbarItem {
  id: string;
  type: ElementType;
  label: string;
  icon: string;
  defaultProperties: ElementProperties;
  defaultSize: { width: number; height: number };
}

// Grid and snap
export interface GridConfig {
  size: number;
  enabled: boolean;
  visible: boolean;
  snapToGrid: boolean;
  snapThreshold: number;
}

// Layer management
export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  locked: boolean;
  elements: string[]; // element IDs
}

// Responsive breakpoints for different formats
export interface FormatDimensions {
  [TemplateFormat.A4]: {
    width: 794;
    height: 1123;
    dpi: 72;
  };
  [TemplateFormat.PRESENTATION]: {
    width: 1920;
    height: 1080;
    dpi: 72;
  };
}

// Validation
export interface ValidationError {
  elementId?: string;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Collaboration (future feature)
export interface CollaborationCursor {
  userId: string;
  userName: string;
  position: { x: number; y: number };
  color: string;
  lastSeen: string;
}

export interface CollaborationEvent {
  type: 'element_update' | 'cursor_move' | 'user_join' | 'user_leave';
  userId: string;
  data: Record<string, unknown>;
  timestamp: string;
}

// Utility types
export type ElementPropertyKey<T extends ElementType> = 
  T extends ElementType.TEXT ? keyof TextProperties :
  T extends ElementType.IMAGE ? keyof ImageProperties :
  T extends ElementType.CHART ? keyof ChartProperties :
  T extends ElementType.TABLE ? keyof TableProperties :
  T extends ElementType.SHAPE ? keyof ShapeProperties :
  never;

export type ElementPropertiesMap = {
  [ElementType.TEXT]: TextProperties;
  [ElementType.IMAGE]: ImageProperties;
  [ElementType.CHART]: ChartProperties;
  [ElementType.TABLE]: TableProperties;
  [ElementType.SHAPE]: ShapeProperties;
};

// Constants
export const FORMAT_DIMENSIONS: FormatDimensions = {
  [TemplateFormat.A4]: {
    width: 794,
    height: 1123,
    dpi: 72
  },
  [TemplateFormat.PRESENTATION]: {
    width: 1920,
    height: 1080,
    dpi: 72
  }
};

export const DEFAULT_GRID_CONFIG: GridConfig = {
  size: 10,
  enabled: true,
  visible: false,
  snapToGrid: true,
  snapThreshold: 5
};

export const DEFAULT_CANVAS_STATE: Omit<CanvasState, 'template'> = {
  elements: [],
  selectedElementId: null,
  clipboard: null,
  history: {
    past: [],
    present: [],
    future: []
  },
  zoom: 1,
  pan: { x: 0, y: 0 }
};