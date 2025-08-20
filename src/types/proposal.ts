// =====================================================================================
// TIPOS PARA O SISTEMA DE EDITOR DE PROPOSTAS
// =====================================================================================

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface Transform {
  position: Position;
  size: Size;
  rotation: number;
  scale: number;
}

// =====================================================================================
// ELEMENTOS DO CANVAS
// =====================================================================================

export type ElementType = 
  | 'text' 
  | 'image' 
  | 'shape' 
  | 'chart' 
  | 'table' 
  | 'video' 
  | 'button' 
  | 'logo'
  | 'signature';

export interface BaseElement {
  id: string;
  type: ElementType;
  transform: Transform;
  zIndex: number;
  visible: boolean;
  locked: boolean;
  opacity: number;
  animation?: ElementAnimation;
  createdAt: Date;
  updatedAt: Date;
}

export interface TextElement extends BaseElement {
  type: 'text';
  content: string;
  fontSize: number;
  fontFamily: string;
  fontWeight: 'normal' | 'bold' | '100' | '200' | '300' | '400' | '500' | '600' | '700' | '800' | '900';
  color: string;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  lineHeight: number;
  letterSpacing: number;
  textDecoration: 'none' | 'underline' | 'line-through';
  backgroundColor?: string;
  borderRadius?: number;
  padding?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

export interface ImageElement extends BaseElement {
  type: 'image';
  src: string;
  alt: string;
  fit: 'cover' | 'contain' | 'fill' | 'scale-down';
  borderRadius?: number;
  border?: {
    width: number;
    color: string;
    style: 'solid' | 'dashed' | 'dotted';
  };
  shadow?: {
    offsetX: number;
    offsetY: number;
    blur: number;
    color: string;
  };
}

export interface ShapeElement extends BaseElement {
  type: 'shape';
  shapeType: 'rectangle' | 'circle' | 'triangle' | 'arrow' | 'star' | 'polygon';
  fill: string;
  stroke?: {
    color: string;
    width: number;
    style: 'solid' | 'dashed' | 'dotted';
  };
  borderRadius?: number;
  gradient?: {
    type: 'linear' | 'radial';
    colors: Array<{ color: string; stop: number }>;
    angle?: number;
  };
}

export interface ChartElement extends BaseElement {
  type: 'chart';
  chartType: 'bar' | 'line' | 'pie' | 'area' | 'scatter';
  data: Array<{ label: string; value: number; color?: string }>;
  title?: string;
  showLegend: boolean;
  showGrid: boolean;
  colors: string[];
  backgroundColor?: string;
}

export interface TableElement extends BaseElement {
  type: 'table';
  rows: number;
  columns: number;
  data: string[][];
  headerStyle?: {
    backgroundColor: string;
    textColor: string;
    fontWeight: string;
  };
  cellStyle?: {
    borderColor: string;
    borderWidth: number;
    padding: number;
  };
  alternateRowColor?: string;
}

export type CanvasElement = 
  | TextElement 
  | ImageElement 
  | ShapeElement 
  | ChartElement 
  | TableElement;

// =====================================================================================
// SISTEMA DE ANIMAÇÕES
// =====================================================================================

export type AnimationType = 
  | 'fadeIn' 
  | 'fadeOut' 
  | 'slideInLeft' 
  | 'slideInRight' 
  | 'slideInUp' 
  | 'slideInDown'
  | 'zoomIn' 
  | 'zoomOut'
  | 'rotateIn'
  | 'bounceIn'
  | 'flipIn';

export interface ElementAnimation {
  id: string;
  type: AnimationType;
  duration: number; // em milissegundos
  delay: number; // em milissegundos
  easing: 'linear' | 'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'bounce' | 'elastic';
  repeat: number; // 0 = sem repetição, -1 = infinito
  direction: 'normal' | 'reverse' | 'alternate' | 'alternate-reverse';
  fillMode: 'none' | 'forwards' | 'backwards' | 'both';
}

export interface AnimationTimeline {
  id: string;
  name: string;
  duration: number; // duração total em milissegundos
  elements: Array<{
    elementId: string;
    startTime: number;
    animation: ElementAnimation;
  }>;
  autoPlay: boolean;
  loop: boolean;
}

// =====================================================================================
// CANVAS E VIEWPORT
// =====================================================================================

export interface CanvasConfig {
  width: number;
  height: number;
  backgroundColor: string;
  gridSize: number;
  showGrid: boolean;
  snapToGrid: boolean;
  zoom: number;
  minZoom: number;
  maxZoom: number;
}

export interface Viewport {
  x: number;
  y: number;
  zoom: number;
}

export interface CanvasState {
  config: CanvasConfig;
  viewport: Viewport;
  elements: CanvasElement[];
  selectedElementIds: string[];
  clipboard: CanvasElement[];
  history: {
    past: CanvasElement[][];
    present: CanvasElement[];
    future: CanvasElement[][];
  };
  timeline?: AnimationTimeline;
}

// =====================================================================================
// TEMPLATES E BIBLIOTECA
// =====================================================================================

export type TemplateCategory = 
  | 'business' 
  | 'solar' 
  | 'technical' 
  | 'financial' 
  | 'presentation' 
  | 'report' 
  | 'custom';

export interface Template {
  id: string;
  name: string;
  description: string;
  category: TemplateCategory;
  thumbnail: string;
  previewImages: string[];
  elements: CanvasElement[];
  canvasConfig: CanvasConfig;
  timeline?: AnimationTimeline;
  tags: string[];
  isPublic: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  downloadCount: number;
  rating: number;
  ratingCount: number;
}

export interface TemplateUpload {
  file: File;
  name: string;
  description: string;
  category: TemplateCategory;
  tags: string[];
  isPublic: boolean;
}

export interface TemplateConversion {
  id: string;
  originalFile: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  elements?: CanvasElement[];
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

// =====================================================================================
// FERRAMENTAS E PALETA
// =====================================================================================

export type Tool = 
  | 'select' 
  | 'text' 
  | 'image' 
  | 'shape' 
  | 'chart' 
  | 'table' 
  | 'pan' 
  | 'zoom';

export interface ToolConfig {
  activeTool: Tool;
  textConfig: {
    fontSize: number;
    fontFamily: string;
    color: string;
    fontWeight: string;
  };
  shapeConfig: {
    fill: string;
    stroke: string;
    strokeWidth: number;
  };
  imageConfig: {
    fit: 'cover' | 'contain' | 'fill';
  };
}

export interface PaletteElement {
  id: string;
  type: ElementType;
  name: string;
  icon: string;
  preview: string;
  defaultProps: Partial<CanvasElement>;
  category: 'basic' | 'advanced' | 'media' | 'data';
}

// =====================================================================================
// EXPORTAÇÃO E COMPARTILHAMENTO
// =====================================================================================

export type ExportFormat = 'pdf' | 'pptx' | 'png' | 'jpg' | 'svg' | 'html';

export interface ExportOptions {
  format: ExportFormat;
  quality: 'low' | 'medium' | 'high';
  includeAnimations: boolean;
  backgroundColor: string;
  scale: number;
  pages?: number[]; // para exportação de páginas específicas
}

export interface ExportResult {
  id: string;
  format: ExportFormat;
  url: string;
  size: number;
  createdAt: Date;
  expiresAt: Date;
}

export interface ShareConfig {
  isPublic: boolean;
  allowComments: boolean;
  allowDownload: boolean;
  password?: string;
  expiresAt?: Date;
  permissions: {
    view: boolean;
    edit: boolean;
    comment: boolean;
  };
}

// =====================================================================================
// EVENTOS E INTERAÇÕES
// =====================================================================================

export interface CanvasEvent {
  type: string;
  elementId?: string;
  position?: Position;
  data?: Record<string, unknown>;
  timestamp: Date;
}

export interface DragState {
  isDragging: boolean;
  draggedElement?: CanvasElement;
  startPosition?: Position;
  currentPosition?: Position;
  offset?: Position;
}

export interface SelectionState {
  selectedElements: CanvasElement[];
  selectionBounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  isMultiSelect: boolean;
}

// =====================================================================================
// CONSTANTES
// =====================================================================================

export const CANVAS_CONSTANTS = {
  DEFAULT_WIDTH: 1920,
  DEFAULT_HEIGHT: 1080,
  MIN_ZOOM: 0.1,
  MAX_ZOOM: 5,
  GRID_SIZE: 20,
  SNAP_THRESHOLD: 10,
  HISTORY_LIMIT: 50,
  AUTO_SAVE_INTERVAL: 30000, // 30 segundos
} as const;

export const ANIMATION_PRESETS = {
  FADE_IN: { type: 'fadeIn' as AnimationType, duration: 500, delay: 0, easing: 'ease-out' as const },
  SLIDE_IN_LEFT: { type: 'slideInLeft' as AnimationType, duration: 600, delay: 0, easing: 'ease-out' as const },
  ZOOM_IN: { type: 'zoomIn' as AnimationType, duration: 400, delay: 0, easing: 'ease-out' as const },
  BOUNCE_IN: { type: 'bounceIn' as AnimationType, duration: 800, delay: 0, easing: 'bounce' as const },
} as const;

export const ELEMENT_DEFAULTS = {
  TEXT: {
    fontSize: 16,
    fontFamily: 'Inter',
    color: '#000000',
    fontWeight: 'normal' as const,
    textAlign: 'left' as const,
    lineHeight: 1.4,
    letterSpacing: 0,
  },
  SHAPE: {
    fill: '#3B82F6',
    stroke: { color: '#1E40AF', width: 2, style: 'solid' as const },
  },
  IMAGE: {
    fit: 'cover' as const,
    borderRadius: 0,
  },
} as const;