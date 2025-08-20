// ============================================================================
// Custom Node Types for React Flow
// ============================================================================

import { NodeTypes } from 'reactflow';
import { StartNode } from './StartNode';
import { ProcessNode } from './ProcessNode';
import { DecisionNode } from './DecisionNode';
import { EndNode } from './EndNode';
import { ConnectorNode } from './ConnectorNode';
import { DocumentNode } from './DocumentNode';
import { DataNode } from './DataNode';
import { CustomNode } from './CustomNode';
import { IntermediateNode } from './IntermediateNode';
import { SubprocessNode } from './SubprocessNode';
import { ParallelNode } from './ParallelNode';
import { InclusiveNode } from './InclusiveNode';
import { AnnotationNode } from './AnnotationNode';
import { OrganogramNode } from './OrganogramNode';

export const nodeTypes: NodeTypes = {
  start: StartNode,
  process: ProcessNode,
  decision: DecisionNode,
  end: EndNode,
  connector: ConnectorNode,
  document: DocumentNode,
  data: DataNode,
  custom: CustomNode,
  intermediate: IntermediateNode,
  subprocess: SubprocessNode,
  parallel: ParallelNode,
  inclusive: InclusiveNode,
  annotation: AnnotationNode,
  organogram: OrganogramNode,
};

export {
  StartNode,
  ProcessNode,
  DecisionNode,
  EndNode,
  ConnectorNode,
  DocumentNode,
  DataNode,
  CustomNode,
  IntermediateNode,
  SubprocessNode,
  ParallelNode,
  InclusiveNode,
  AnnotationNode,
  OrganogramNode,
};

export * from './types';