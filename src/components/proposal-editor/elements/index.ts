// Exportações dos elementos do editor de propostas
export { default as TextElementNode } from './TextElementNode';
export { default as ImageElementNode } from './ImageElementNode';
export { default as ChartElementNode } from './ChartElementNode';
export { default as TableElementNode } from './TableElementNode';
export { default as ShapeElementNode } from './ShapeElementNode';

// Tipos de nós para o React Flow
export const nodeTypes = {
  textElement: TextElementNode,
  imageElement: ImageElementNode,
  chartElement: ChartElementNode,
  tableElement: TableElementNode,
  shapeElement: ShapeElementNode
};