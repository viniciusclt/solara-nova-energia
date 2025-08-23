import type { CollaborationUser } from '@/services/collaboration/types';

export interface Position {
  x: number;
  y: number;
}

export interface Size {
  width: number;
  height: number;
}

export interface TemplateComponent {
  id: string;
  type: ComponentType;
  position: Position;
  size: Size;
  properties: ComponentProperties;
  zIndex: number;
  locked?: boolean;
  visible?: boolean;
}

export type ComponentType = 
  | 'text'
  | 'heading'
  | 'image'
  | 'table'
  | 'chart'
  | 'divider'
  | 'spacer'
  | 'container'
  | 'button'
  | 'logo'
  | 'signature'
  | 'placeholder';

export interface ComponentProperties {
  // Text properties
  text?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | 'semibold';
  fontFamily?: string;
  color?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  lineHeight?: number;
  
  // Heading properties
  headingLevel?: 1 | 2 | 3 | 4 | 5 | 6;
  
  // Layout properties
  padding?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  margin?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  
  // Background properties
  backgroundColor?: string;
  backgroundImage?: string;
  
  // Border properties
  borderWidth?: number;
  borderColor?: string;
  borderStyle?: 'solid' | 'dashed' | 'dotted';
  borderRadius?: number;
  
  // Image properties
  src?: string;
  alt?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'scale-down';
  
  // Table properties
  columns?: TableColumn[];
  rows?: TableRow[];
  headerStyle?: ComponentProperties;
  cellStyle?: ComponentProperties;
  tableData?: {
    headers: string[];
    rows: string[][];
  };
  headerBackgroundColor?: string;
  
  // Chart properties
  chartType?: 'bar' | 'line' | 'pie' | 'area';
  chartData?: Record<string, unknown>[];
  chartConfig?: Record<string, unknown>;
  
  // Placeholder properties
  placeholderKey?: string;
  placeholderType?: 'text' | 'number' | 'currency' | 'date' | 'image';
  placeholderFormat?: string;
  
  // Container properties
  flexDirection?: 'row' | 'column';
  justifyContent?: 'flex-start' | 'center' | 'flex-end' | 'space-between' | 'space-around';
  alignItems?: 'flex-start' | 'center' | 'flex-end' | 'stretch';
  gap?: number;
  
  // Button properties
  buttonText?: string;
  buttonAction?: string;
  buttonStyle?: 'primary' | 'secondary' | 'outline';
  
  // Divider properties
  dividerThickness?: number;
}

export interface TableColumn {
  id: string;
  header: string;
  width?: number;
  align?: 'left' | 'center' | 'right';
}

export interface TableRow {
  id: string;
  cells: Record<string, unknown>;
}

export interface TemplateData {
  id: string;
  name: string;
  description?: string;
  category: string;
  components: TemplateComponent[];
  pageSize: 'A4' | 'Letter' | 'A3' | 'Custom';
  orientation: 'portrait' | 'landscape';
  customSize?: Size;
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  metadata: {
    createdAt: string;
    updatedAt: string;
    version: string;
    author?: string;
  };
}

export interface EditorState {
  components: TemplateComponent[];
  selectedComponentId: string | null;
  history: TemplateComponent[][];
  historyIndex: number;
  zoom: number;
  showGrid: boolean;
  showRulers: boolean;
  snapToGrid: boolean;
  gridSize: number;
}

export interface ComponentLibraryItem {
  type: ComponentType;
  name: string;
  description: string;
  icon: string;
  category: ComponentCategory;
  defaultProperties: ComponentProperties;
  defaultSize: Size;
}

export type ComponentCategory = 
  | 'layout'
  | 'content'
  | 'media'
  | 'data'
  | 'interactive';

export interface DragData {
  componentType?: ComponentType;
  componentId?: string;
  isFromLibrary?: boolean;
}

export interface CanvasRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface EditorAction {
  type: 'ADD_COMPONENT' | 'UPDATE_COMPONENT' | 'DELETE_COMPONENT' | 'MOVE_COMPONENT' | 'DUPLICATE_COMPONENT';
  payload: unknown;
  timestamp: number;
}

export interface ValidationError {
  componentId: string;
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

export interface ExportOptions {
  format: 'pdf' | 'png' | 'jpg' | 'svg';
  quality?: number;
  dpi?: number;
  includeBleed?: boolean;
  cropMarks?: boolean;
}

export interface TemplatePreview {
  id: string;
  thumbnail: string;
  lastModified: string;
  componentCount: number;
}

// CollaborationUser agora é importado de services/collaboration/types

export interface Comment {
  id: string;
  componentId: string;
  position: Position;
  author: CollaborationUser;
  text: string;
  createdAt: string;
  resolved: boolean;
  replies?: Comment[];
}