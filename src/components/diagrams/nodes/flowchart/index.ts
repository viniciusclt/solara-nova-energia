// ============================================================================
// Flowchart Nodes - Componentes de nós para fluxogramas
// ============================================================================

import React, { memo, useCallback } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import {
  Play,
  Square,
  Diamond,
  StopCircle,
  FileText,
  Database,
  Circle,
  Hexagon,
  Edit3,
  Trash2,
  Settings,
  Layers,
  Link
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { secureLogger } from '@/utils/secureLogger';
import { useDiagramStore } from '../../stores/useDiagramStore';

// Import existing components for migration mapping
import { StartNode as OldStartNode } from '../../../flowchart/nodes/StartNode';
import { ProcessNode as OldProcessNode } from '../../../flowchart/nodes/ProcessNode';
import { DecisionNode as OldDecisionNode } from '../../../flowchart/nodes/DecisionNode';
import { EndNode as OldEndNode } from '../../../flowchart/nodes/EndNode';
import { DocumentNode as OldDocumentNode } from '../../../flowchart/nodes/DocumentNode';
import { DataNode as OldDataNode } from '../../../flowchart/nodes/DataNode';
import { ConnectorNode as OldConnectorNode } from '../../../flowchart/nodes/ConnectorNode';
import { SubprocessNode as OldSubprocessNode } from '../../../flowchart/nodes/SubprocessNode';

// ============================================================================
// Tipos e Interfaces
// ============================================================================

interface FlowchartNodeData {
  label: string;
  color?: string;
  description?: string;
  editable?: boolean;
}

interface FlowchartNodeProps extends NodeProps {
  data: FlowchartNodeData;
}

// ============================================================================
// Componente Base para Nós de Fluxograma (usando BaseNode)
// ============================================================================

import { BaseNode, BaseNodeProps } from '../BaseNode';

interface FlowchartNodeProps extends Omit<BaseNodeProps, 'data'> {
  data: FlowchartNodeData;
}

const FlowchartNode: React.FC<FlowchartNodeProps> = (props) => {
  return <BaseNode {...props} />;
};

// ============================================================================
// Nó de Início
// ============================================================================

const StartNode: React.FC<FlowchartNodeProps> = memo(({ id, data, selected }) => {
  return (
    <FlowchartNode
      id={id}
      data={data}
      selected={selected}
      handles={{ top: false, right: 'source', bottom: 'source', left: false }}
      shape="circle"
      className="bg-green-100 border-green-400"
    >
      <Play className="h-4 w-4 text-green-600" />
    </FlowchartNode>
  );
});

StartNode.displayName = 'StartNode';

// ============================================================================
// Nó de Processo
// ============================================================================

const ProcessNode: React.FC<FlowchartNodeProps> = memo(({ id, data, selected }) => {
  return (
    <FlowchartNode
      id={id}
      data={data}
      selected={selected}
      shape="rectangle"
      className="bg-blue-100 border-blue-400"
    >
      <Square className="h-4 w-4 text-blue-600" />
    </FlowchartNode>
  );
});

ProcessNode.displayName = 'ProcessNode';

// ============================================================================
// Nó de Decisão
// ============================================================================

const DecisionNode: React.FC<FlowchartNodeProps> = memo(({ id, data, selected }) => {
  return (
    <FlowchartNode
      id={id}
      data={data}
      selected={selected}
      shape="diamond"
      className="bg-yellow-100 border-yellow-400"
    >
      <Diamond className="h-4 w-4 text-yellow-600" />
    </FlowchartNode>
  );
});

DecisionNode.displayName = 'DecisionNode';

// ============================================================================
// Nó de Fim
// ============================================================================

const EndNode: React.FC<FlowchartNodeProps> = memo(({ id, data, selected }) => {
  return (
    <FlowchartNode
      id={id}
      data={data}
      selected={selected}
      handles={{ top: 'target', right: false, bottom: false, left: 'target' }}
      shape="circle"
      className="bg-red-100 border-red-400"
    >
      <StopCircle className="h-4 w-4 text-red-600" />
    </FlowchartNode>
  );
});

EndNode.displayName = 'EndNode';

// ============================================================================
// Nó de Documento
// ============================================================================

const DocumentNode: React.FC<FlowchartNodeProps> = memo(({ id, data, selected }) => {
  return (
    <FlowchartNode
      id={id}
      data={data}
      selected={selected}
      shape="rectangle"
      className="bg-purple-100 border-purple-400"
    >
      <FileText className="h-4 w-4 text-purple-600" />
    </FlowchartNode>
  );
});

DocumentNode.displayName = 'DocumentNode';

// ============================================================================
// Nó de Dados
// ============================================================================

const DataNode: React.FC<FlowchartNodeProps> = memo(({ id, data, selected }) => {
  return (
    <FlowchartNode
      id={id}
      data={data}
      selected={selected}
      shape="rectangle"
      className="bg-indigo-100 border-indigo-400"
    >
      <Database className="h-4 w-4 text-indigo-600" />
    </FlowchartNode>
  );
});

DataNode.displayName = 'DataNode';

// ============================================================================
// Nó Conector
// ============================================================================

const ConnectorNode: React.FC<FlowchartNodeProps> = memo(({ id, data, selected }) => {
  return (
    <BaseFlowchartNode
      id={id}
      data={data}
      selected={selected}
      shape="circle"
      className="bg-gray-100 border-gray-400 w-16 h-16"
    >
      <Circle className="h-4 w-4 text-gray-600" />
    </BaseFlowchartNode>
  );
});

ConnectorNode.displayName = 'ConnectorNode';

// ============================================================================
// Nó de Subprocesso
// ============================================================================

const SubprocessNode: React.FC<FlowchartNodeProps> = memo(({ id, data, selected }) => {
  return (
    <BaseFlowchartNode
      id={id}
      data={data}
      selected={selected}
      shape="hexagon"
      className="bg-teal-100 border-teal-400"
    >
      <Hexagon className="h-4 w-4 text-teal-600" />
    </BaseFlowchartNode>
  );
});

SubprocessNode.displayName = 'SubprocessNode';

// ============================================================================
// Migration Adapters - Temporary wrapper for existing components
// ============================================================================

// Wrapper function to adapt old components to new interface
const adaptOldNode = (OldComponent: React.ComponentType<unknown>) => {
  return (props: FlowchartNodeProps) => {
    // Convert new data format to old format if needed
    const adaptedProps = {
      ...props,
      data: {
        ...props.data,
        // Map new properties to old ones if needed
      }
    };
    return <OldComponent {...adaptedProps} />;
  };
};

// Create adapted versions of existing components
const AdaptedStartNode = adaptOldNode(OldStartNode);
const AdaptedProcessNode = adaptOldNode(OldProcessNode);
const AdaptedDecisionNode = adaptOldNode(OldDecisionNode);
const AdaptedEndNode = adaptOldNode(OldEndNode);
const AdaptedDocumentNode = adaptOldNode(OldDocumentNode);
const AdaptedDataNode = adaptOldNode(OldDataNode);
const AdaptedConnectorNode = adaptOldNode(OldConnectorNode);
const AdaptedSubprocessNode = adaptOldNode(OldSubprocessNode);

// ============================================================================
// Enhanced Nodes (New Implementation)
// ============================================================================

const EnhancedStartNode: React.FC<FlowchartNodeProps> = memo(({ id, data, selected }) => {
  return (
    <BaseFlowchartNode
      id={id}
      data={data}
      selected={selected}
      handles={{ top: false, right: true, bottom: true, left: false }}
      shape="circle"
      className="bg-green-100 border-green-400"
    >
      <Play className="h-4 w-4 text-green-600" />
    </BaseFlowchartNode>
  );
});

const EnhancedProcessNode: React.FC<FlowchartNodeProps> = memo(({ id, data, selected }) => {
  return (
    <BaseFlowchartNode
      id={id}
      data={data}
      selected={selected}
      className="bg-blue-100 border-blue-400"
    >
      <Settings className="h-4 w-4 text-blue-600" />
    </BaseFlowchartNode>
  );
});

const EnhancedDecisionNode: React.FC<FlowchartNodeProps> = memo(({ id, data, selected }) => {
  return (
    <BaseFlowchartNode
      id={id}
      data={data}
      selected={selected}
      shape="diamond"
      className="bg-yellow-100 border-yellow-400 w-32 h-32"
    >
      <Diamond className="h-4 w-4 text-yellow-600 transform -rotate-45" />
    </BaseFlowchartNode>
  );
});

const EnhancedEndNode: React.FC<FlowchartNodeProps> = memo(({ id, data, selected }) => {
  return (
    <BaseFlowchartNode
      id={id}
      data={data}
      selected={selected}
      handles={{ top: true, right: false, bottom: false, left: true }}
      shape="circle"
      className="bg-red-100 border-red-400"
    >
      <StopCircle className="h-4 w-4 text-red-600" />
    </BaseFlowchartNode>
  );
});

const EnhancedDocumentNode: React.FC<FlowchartNodeProps> = memo(({ id, data, selected }) => {
  return (
    <BaseFlowchartNode
      id={id}
      data={data}
      selected={selected}
      className="bg-purple-100 border-purple-400"
    >
      <FileText className="h-4 w-4 text-purple-600" />
    </BaseFlowchartNode>
  );
});

const EnhancedDataNode: React.FC<FlowchartNodeProps> = memo(({ id, data, selected }) => {
  return (
    <BaseFlowchartNode
      id={id}
      data={data}
      selected={selected}
      className="bg-indigo-100 border-indigo-400"
    >
      <Database className="h-4 w-4 text-indigo-600" />
    </BaseFlowchartNode>
  );
});

const EnhancedConnectorNode: React.FC<FlowchartNodeProps> = memo(({ id, data, selected }) => {
  return (
    <BaseFlowchartNode
      id={id}
      data={data}
      selected={selected}
      shape="circle"
      className="bg-gray-100 border-gray-400 w-16 h-16"
    >
      <Link className="h-4 w-4 text-gray-600" />
    </BaseFlowchartNode>
  );
});

const EnhancedSubprocessNode: React.FC<FlowchartNodeProps> = memo(({ id, data, selected }) => {
  return (
    <BaseFlowchartNode
      id={id}
      data={data}
      selected={selected}
      shape="hexagon"
      className="bg-teal-100 border-teal-400"
    >
      <Layers className="h-4 w-4 text-teal-600" />
    </BaseFlowchartNode>
  );
});

// ============================================================================
// Exports - Migration Strategy
// ============================================================================

// Export adapted versions (using existing components)
export const StartNode = AdaptedStartNode;
export const ProcessNode = AdaptedProcessNode;
export const DecisionNode = AdaptedDecisionNode;
export const EndNode = AdaptedEndNode;
export const DocumentNode = AdaptedDocumentNode;
export const DataNode = AdaptedDataNode;
export const ConnectorNode = AdaptedConnectorNode;
export const SubprocessNode = AdaptedSubprocessNode;

// Export enhanced versions for gradual migration
export const FlowchartNodesEnhanced = {
  StartNode: EnhancedStartNode,
  ProcessNode: EnhancedProcessNode,
  DecisionNode: EnhancedDecisionNode,
  EndNode: EnhancedEndNode,
  DocumentNode: EnhancedDocumentNode,
  DataNode: EnhancedDataNode,
  ConnectorNode: EnhancedConnectorNode,
  SubprocessNode: EnhancedSubprocessNode
};

// Legacy export for backward compatibility
export const FlowchartNodes = {
  StartNode,
  ProcessNode,
  DecisionNode,
  EndNode,
  DocumentNode,
  DataNode,
  ConnectorNode,
  SubprocessNode
};

export type {
  FlowchartNodeData,
  FlowchartNodeProps
};