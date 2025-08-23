// ============================================================================
// Edge Types and Interfaces
// ============================================================================

import { EdgeProps } from 'reactflow';

// ============================================================================
// BASE EDGE DATA
// ============================================================================

export interface BaseEdgeData {
  label?: string;
  color?: string;
  selectedColor?: string;
  strokeWidth?: number;
  opacity?: number;
  animated?: boolean;
  dashed?: boolean;
  cornerRadius?: number;
  offset?: number;
}

// ============================================================================
// AUTO-ROUTED EDGE DATA
// ============================================================================

export interface RoutingInfo {
  autoRouted: boolean;
  totalLength: number;
  hasObstacles: boolean;
  segments: number;
  generatedAt: string;
  optimizedAt?: string;
  algorithm?: 'astar' | 'dijkstra' | 'straight';
  performance?: {
    calculationTime: number;
    pathComplexity: number;
  };
}

export interface AutoRoutedEdgeData extends BaseEdgeData {
  pathString?: string;
  routingInfo?: RoutingInfo;
}

// ============================================================================
// SMART EDGE DATA
// ============================================================================

export interface SmartEdgeData extends BaseEdgeData {
  smartRouting?: {
    enabled: boolean;
    avoidNodes: boolean;
    preferOrthogonal: boolean;
    snapToGrid: boolean;
    gridSize: number;
  };
  connectionPoints?: {
    source: { x: number; y: number };
    target: { x: number; y: number };
  };
}

// ============================================================================
// ANIMATED EDGE DATA
// ============================================================================

export interface AnimatedEdgeData extends BaseEdgeData {
  animation?: {
    type: 'flow' | 'pulse' | 'dash' | 'glow';
    speed: number;
    direction: 'forward' | 'backward' | 'bidirectional';
    color?: string;
    intensity?: number;
  };
  particles?: {
    enabled: boolean;
    count: number;
    size: number;
    color: string;
    speed: number;
  };
}

// ============================================================================
// CUSTOM BEZIER EDGE DATA
// ============================================================================

export interface BezierControlPoint {
  x: number;
  y: number;
}

export interface CustomBezierEdgeData extends BaseEdgeData {
  controlPoints?: {
    source: BezierControlPoint;
    target: BezierControlPoint;
  };
  curvature?: number;
  tension?: number;
}

// ============================================================================
// EDGE COMPONENT PROPS
// ============================================================================

export interface AutoRoutedEdgeProps extends EdgeProps {
  data?: AutoRoutedEdgeData;
}

export interface SmartEdgeProps extends EdgeProps {
  data?: SmartEdgeData;
}

export interface AnimatedEdgeProps extends EdgeProps {
  data?: AnimatedEdgeData;
}

export interface CustomBezierEdgeProps extends EdgeProps {
  data?: CustomBezierEdgeData;
}

// ============================================================================
// EDGE CONFIGURATION
// ============================================================================

export interface EdgeConfiguration {
  type: 'auto-routed' | 'smart' | 'animated' | 'custom-bezier' | 'default';
  data?: BaseEdgeData;
  style?: React.CSSProperties;
  className?: string;
}

// ============================================================================
// EDGE FACTORY OPTIONS
// ============================================================================

export interface EdgeFactoryOptions {
  enableAutoRouting?: boolean;
  enableSmartRouting?: boolean;
  enableAnimations?: boolean;
  defaultStyle?: React.CSSProperties;
  defaultMarkers?: {
    start?: any;
    end?: any;
  };
}

// ============================================================================
// EDGE VALIDATION
// ============================================================================

export interface EdgeValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface EdgeValidator {
  validate: (edgeData: BaseEdgeData) => EdgeValidationResult;
}

// ============================================================================
// EDGE PERFORMANCE METRICS
// ============================================================================

export interface EdgePerformanceMetrics {
  renderTime: number;
  pathCalculationTime: number;
  memoryUsage: number;
  complexity: number;
}

// ============================================================================
// EDGE EVENTS
// ============================================================================

export interface EdgeEventHandlers {
  onHover?: (edgeId: string, event: React.MouseEvent) => void;
  onLeave?: (edgeId: string, event: React.MouseEvent) => void;
  onClick?: (edgeId: string, event: React.MouseEvent) => void;
  onDoubleClick?: (edgeId: string, event: React.MouseEvent) => void;
  onContextMenu?: (edgeId: string, event: React.MouseEvent) => void;
  onSelect?: (edgeId: string, selected: boolean) => void;
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type EdgeDataUnion = 
  | AutoRoutedEdgeData 
  | SmartEdgeData 
  | AnimatedEdgeData 
  | CustomBezierEdgeData 
  | BaseEdgeData;

export type EdgePropsUnion = 
  | AutoRoutedEdgeProps 
  | SmartEdgeProps 
  | AnimatedEdgeProps 
  | CustomBezierEdgeProps;

// ============================================================================
// TYPE GUARDS
// ============================================================================

export const isAutoRoutedEdgeData = (data: any): data is AutoRoutedEdgeData => {
  return data && (data.pathString !== undefined || data.routingInfo !== undefined);
};

export const isSmartEdgeData = (data: any): data is SmartEdgeData => {
  return data && data.smartRouting !== undefined;
};

export const isAnimatedEdgeData = (data: any): data is AnimatedEdgeData => {
  return data && (data.animation !== undefined || data.particles !== undefined);
};

export const isCustomBezierEdgeData = (data: any): data is CustomBezierEdgeData => {
  return data && (data.controlPoints !== undefined || data.curvature !== undefined);
};