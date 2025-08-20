// ============================================================================
// Types for Custom Nodes
// ============================================================================

import { Node, NodeProps } from 'reactflow';
import { FlowchartNodeType } from '@/types/flowchart';

export interface CustomNodeData {
  label: string;
  description?: string;
  icon?: string;
  color?: string;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  fontSize?: number;
  fontWeight?: string;
  width?: number;
  height?: number;
  borderRadius?: number;
  borderWidth?: number;
  padding?: number;
  metadata?: Record<string, unknown>;
  validation?: NodeValidation;
  actions?: NodeAction[];
}

export interface NodeValidation {
  required?: boolean;
  rules?: ValidationRule[];
  errors?: string[];
}

export interface ValidationRule {
  type: 'required' | 'minLength' | 'maxLength' | 'pattern' | 'custom';
  value?: unknown;
  message: string;
}

export interface NodeAction {
  id: string;
  label: string;
  icon?: string;
  handler: (nodeId: string) => void;
}

export type CustomNodeProps = NodeProps<CustomNodeData>;

export interface BaseNodeProps extends CustomNodeProps {
  type: FlowchartNodeType;
  isSelected?: boolean;
  isConnectable?: boolean;
  isDraggable?: boolean;
}

export interface NodeStyle {
  background?: string;
  color?: string;
  border?: string;
  borderRadius?: string;
  width?: number;
  height?: number;
  fontSize?: string;
  fontWeight?: string;
  padding?: string;
  boxShadow?: string;
}

export interface NodeHandle {
  id: string;
  type: 'source' | 'target';
  position: 'top' | 'right' | 'bottom' | 'left';
  style?: React.CSSProperties;
}