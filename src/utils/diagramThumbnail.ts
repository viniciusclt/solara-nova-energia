// ============================================================================
// Diagram Thumbnail Generator - Gerador de thumbnails de diagramas
// ============================================================================
// Geração de thumbnails SVG e Canvas para visualização rápida
// ============================================================================

import {
  UnifiedDiagramDocument,
  UnifiedDiagramNode,
  UnifiedDiagramEdge
} from '../types/unified-diagram';

// ============================================================================
// INTERFACES
// ============================================================================

interface ThumbnailOptions {
  width: number;
  height: number;
  padding: number;
  backgroundColor: string;
  showLabels: boolean;
  quality: 'low' | 'medium' | 'high';
  format: 'svg' | 'canvas' | 'dataurl';
}

interface BoundingBox {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
  width: number;
  height: number;
}

interface ThumbnailNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: string;
  label: string;
  color: string;
}

interface ThumbnailEdge {
  id: string;
  sourceX: number;
  sourceY: number;
  targetX: number;
  targetY: number;
  color: string;
}

// ============================================================================
// CONFIGURAÇÕES PADRÃO
// ============================================================================

const DEFAULT_OPTIONS: ThumbnailOptions = {
  width: 200,
  height: 150,
  padding: 10,
  backgroundColor: '#ffffff',
  showLabels: false,
  quality: 'medium',
  format: 'svg'
};

// Cores por tipo de nó
const NODE_COLORS: Record<string, string> = {
  // BPMN
  'start': '#4ade80',
  'end': '#ef4444',
  'task': '#3b82f6',
  'decision': '#f59e0b',
  'parallel': '#8b5cf6',
  'inclusive': '#06b6d4',
  'exclusive': '#ec4899',
  'complex': '#6b7280',
  'event-based': '#10b981',
  'subprocess': '#84cc16',
  'call-activity': '#f97316',
  'user-task': '#3b82f6',
  'service-task': '#6366f1',
  'script-task': '#8b5cf6',
  'manual-task': '#f59e0b',
  'business-rule': '#06b6d4',
  'receive-task': '#10b981',
  'send-task': '#84cc16',
  'timer': '#f97316',
  'message': '#ec4899',
  'signal': '#6b7280',
  'error': '#ef4444',
  'escalation': '#f59e0b',
  'compensation': '#06b6d4',
  'conditional': '#8b5cf6',
  'link': '#10b981',
  'multiple': '#84cc16',
  'parallel-multiple': '#f97316',
  'terminate': '#ef4444',
  'cancel': '#6b7280',
  
  // MindMap
  'mindmap-root': '#3b82f6',
  'mindmap-branch': '#10b981',
  'mindmap-leaf': '#f59e0b',
  
  // Organogram
  'org-ceo': '#ef4444',
  'org-director': '#f59e0b',
  'org-manager': '#3b82f6',
  'org-employee': '#10b981',
  'org-contractor': '#8b5cf6',
  
  // Default
  'default': '#6b7280'
};

// ============================================================================
// UTILITÁRIOS DE CÁLCULO
// ============================================================================

/**
 * Calcula o bounding box de todos os nós
 */
const calculateBoundingBox = (nodes: UnifiedDiagramNode[]): BoundingBox => {
  if (nodes.length === 0) {
    return {
      minX: 0,
      minY: 0,
      maxX: 100,
      maxY: 100,
      width: 100,
      height: 100
    };
  }
  
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  
  nodes.forEach(node => {
    const nodeWidth = node.data.width || 100;
    const nodeHeight = node.data.height || 50;
    
    minX = Math.min(minX, node.position.x);
    minY = Math.min(minY, node.position.y);
    maxX = Math.max(maxX, node.position.x + nodeWidth);
    maxY = Math.max(maxY, node.position.y + nodeHeight);
  });
  
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY
  };
};

/**
 * Calcula a escala para ajustar o diagrama no thumbnail
 */
const calculateScale = (
  boundingBox: BoundingBox,
  thumbnailWidth: number,
  thumbnailHeight: number,
  padding: number
): number => {
  const availableWidth = thumbnailWidth - (padding * 2);
  const availableHeight = thumbnailHeight - (padding * 2);
  
  const scaleX = availableWidth / boundingBox.width;
  const scaleY = availableHeight / boundingBox.height;
  
  return Math.min(scaleX, scaleY, 1); // Não aumentar além do tamanho original
};

/**
 * Transforma coordenadas do diagrama para o thumbnail
 */
const transformCoordinates = (
  x: number,
  y: number,
  boundingBox: BoundingBox,
  scale: number,
  thumbnailWidth: number,
  thumbnailHeight: number,
  padding: number
): { x: number; y: number } => {
  // Normalizar para origem (0,0)
  const normalizedX = x - boundingBox.minX;
  const normalizedY = y - boundingBox.minY;
  
  // Aplicar escala
  const scaledX = normalizedX * scale;
  const scaledY = normalizedY * scale;
  
  // Centralizar no thumbnail
  const scaledWidth = boundingBox.width * scale;
  const scaledHeight = boundingBox.height * scale;
  
  const offsetX = (thumbnailWidth - scaledWidth) / 2;
  const offsetY = (thumbnailHeight - scaledHeight) / 2;
  
  return {
    x: scaledX + offsetX,
    y: scaledY + offsetY
  };
};

// ============================================================================
// PREPARAÇÃO DE DADOS
// ============================================================================

/**
 * Prepara nós para renderização no thumbnail
 */
const prepareThumbnailNodes = (
  nodes: UnifiedDiagramNode[],
  boundingBox: BoundingBox,
  scale: number,
  thumbnailWidth: number,
  thumbnailHeight: number,
  padding: number
): ThumbnailNode[] => {
  return nodes.map(node => {
    const nodeWidth = (node.data.width || 100) * scale;
    const nodeHeight = (node.data.height || 50) * scale;
    
    const position = transformCoordinates(
      node.position.x,
      node.position.y,
      boundingBox,
      scale,
      thumbnailWidth,
      thumbnailHeight,
      padding
    );
    
    return {
      id: node.id,
      x: position.x,
      y: position.y,
      width: Math.max(nodeWidth, 8), // Mínimo visível
      height: Math.max(nodeHeight, 6), // Mínimo visível
      type: node.type,
      label: node.data.label || '',
      color: NODE_COLORS[node.type] || NODE_COLORS.default
    };
  });
};

/**
 * Prepara arestas para renderização no thumbnail
 */
const prepareThumbnailEdges = (
  edges: UnifiedDiagramEdge[],
  nodes: ThumbnailNode[]
): ThumbnailEdge[] => {
  const nodeMap = new Map(nodes.map(n => [n.id, n]));
  
  return edges
    .filter(edge => nodeMap.has(edge.source) && nodeMap.has(edge.target))
    .map(edge => {
      const sourceNode = nodeMap.get(edge.source)!;
      const targetNode = nodeMap.get(edge.target)!;
      
      return {
        id: edge.id,
        sourceX: sourceNode.x + sourceNode.width / 2,
        sourceY: sourceNode.y + sourceNode.height / 2,
        targetX: targetNode.x + targetNode.width / 2,
        targetY: targetNode.y + targetNode.height / 2,
        color: edge.data?.color || '#6b7280'
      };
    });
};

// ============================================================================
// GERADORES SVG
// ============================================================================

/**
 * Gera thumbnail em formato SVG
 */
const generateSVGThumbnail = (
  document: UnifiedDiagramDocument,
  options: ThumbnailOptions
): string => {
  const boundingBox = calculateBoundingBox(document.nodes);
  const scale = calculateScale(
    boundingBox,
    options.width,
    options.height,
    options.padding
  );
  
  const thumbnailNodes = prepareThumbnailNodes(
    document.nodes,
    boundingBox,
    scale,
    options.width,
    options.height,
    options.padding
  );
  
  const thumbnailEdges = prepareThumbnailEdges(document.edges, thumbnailNodes);
  
  let svg = `<svg width="${options.width}" height="${options.height}" xmlns="http://www.w3.org/2000/svg">`;
  
  // Background
  svg += `<rect width="100%" height="100%" fill="${options.backgroundColor}"/>`;
  
  // Edges
  thumbnailEdges.forEach(edge => {
    svg += `<line x1="${edge.sourceX}" y1="${edge.sourceY}" x2="${edge.targetX}" y2="${edge.targetY}" stroke="${edge.color}" stroke-width="1" opacity="0.7"/>`;
  });
  
  // Nodes
  thumbnailNodes.forEach(node => {
    const { x, y, width, height, color, type } = node;
    
    if (type === 'start' || type === 'end') {
      // Círculos para eventos
      const radius = Math.min(width, height) / 2;
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      svg += `<circle cx="${centerX}" cy="${centerY}" r="${radius}" fill="${color}" stroke="#ffffff" stroke-width="1"/>`;
    } else if (type === 'decision' || type.includes('gateway')) {
      // Losango para gateways
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      const halfWidth = width / 2;
      const halfHeight = height / 2;
      svg += `<polygon points="${centerX},${y} ${x + width},${centerY} ${centerX},${y + height} ${x},${centerY}" fill="${color}" stroke="#ffffff" stroke-width="1"/>`;
    } else {
      // Retângulo para tarefas
      svg += `<rect x="${x}" y="${y}" width="${width}" height="${height}" fill="${color}" stroke="#ffffff" stroke-width="1" rx="2"/>`;
    }
    
    // Labels (se habilitado e há espaço)
    if (options.showLabels && node.label && width > 20 && height > 10) {
      const fontSize = Math.min(width / 8, height / 3, 8);
      const textX = x + width / 2;
      const textY = y + height / 2 + fontSize / 3;
      
      svg += `<text x="${textX}" y="${textY}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${fontSize}" fill="#ffffff" opacity="0.9">`;
      svg += node.label.length > 10 ? node.label.substring(0, 8) + '...' : node.label;
      svg += `</text>`;
    }
  });
  
  svg += '</svg>';
  
  return svg;
};

// ============================================================================
// GERADORES CANVAS
// ============================================================================

/**
 * Gera thumbnail usando Canvas
 */
const generateCanvasThumbnail = (
  document: UnifiedDiagramDocument,
  options: ThumbnailOptions
): HTMLCanvasElement => {
  const canvas = document.createElement('canvas');
  canvas.width = options.width;
  canvas.height = options.height;
  
  const ctx = canvas.getContext('2d')!;
  
  // Background
  ctx.fillStyle = options.backgroundColor;
  ctx.fillRect(0, 0, options.width, options.height);
  
  const boundingBox = calculateBoundingBox(document.nodes);
  const scale = calculateScale(
    boundingBox,
    options.width,
    options.height,
    options.padding
  );
  
  const thumbnailNodes = prepareThumbnailNodes(
    document.nodes,
    boundingBox,
    scale,
    options.width,
    options.height,
    options.padding
  );
  
  const thumbnailEdges = prepareThumbnailEdges(document.edges, thumbnailNodes);
  
  // Edges
  ctx.strokeStyle = '#6b7280';
  ctx.lineWidth = 1;
  ctx.globalAlpha = 0.7;
  
  thumbnailEdges.forEach(edge => {
    ctx.beginPath();
    ctx.moveTo(edge.sourceX, edge.sourceY);
    ctx.lineTo(edge.targetX, edge.targetY);
    ctx.stroke();
  });
  
  ctx.globalAlpha = 1;
  
  // Nodes
  thumbnailNodes.forEach(node => {
    const { x, y, width, height, color, type } = node;
    
    ctx.fillStyle = color;
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 1;
    
    if (type === 'start' || type === 'end') {
      // Círculos para eventos
      const radius = Math.min(width, height) / 2;
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
    } else if (type === 'decision' || type.includes('gateway')) {
      // Losango para gateways
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      const halfWidth = width / 2;
      const halfHeight = height / 2;
      
      ctx.beginPath();
      ctx.moveTo(centerX, y);
      ctx.lineTo(x + width, centerY);
      ctx.lineTo(centerX, y + height);
      ctx.lineTo(x, centerY);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else {
      // Retângulo para tarefas
      ctx.beginPath();
      ctx.roundRect(x, y, width, height, 2);
      ctx.fill();
      ctx.stroke();
    }
    
    // Labels (se habilitado e há espaço)
    if (options.showLabels && node.label && width > 20 && height > 10) {
      const fontSize = Math.min(width / 8, height / 3, 8);
      ctx.fillStyle = '#ffffff';
      ctx.font = `${fontSize}px Arial, sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const text = node.label.length > 10 ? node.label.substring(0, 8) + '...' : node.label;
      ctx.fillText(text, x + width / 2, y + height / 2);
    }
  });
  
  return canvas;
};

// ============================================================================
// API PÚBLICA
// ============================================================================

/**
 * Gera thumbnail de um diagrama
 */
export const generateThumbnail = (
  document: UnifiedDiagramDocument,
  options: Partial<ThumbnailOptions> = {}
): string | HTMLCanvasElement => {
  const finalOptions = { ...DEFAULT_OPTIONS, ...options };
  
  if (finalOptions.format === 'svg') {
    return generateSVGThumbnail(document, finalOptions);
  } else if (finalOptions.format === 'canvas') {
    return generateCanvasThumbnail(document, finalOptions);
  } else if (finalOptions.format === 'dataurl') {
    const canvas = generateCanvasThumbnail(document, finalOptions);
    return canvas.toDataURL('image/png');
  }
  
  throw new Error(`Formato não suportado: ${finalOptions.format}`);
};

/**
 * Gera thumbnail SVG (conveniência)
 */
export const generateSVGThumbnailString = (
  document: UnifiedDiagramDocument,
  options: Partial<ThumbnailOptions> = {}
): string => {
  return generateSVGThumbnail(document, { ...DEFAULT_OPTIONS, ...options, format: 'svg' });
};

/**
 * Gera thumbnail como Data URL (conveniência)
 */
export const generateThumbnailDataURL = (
  document: UnifiedDiagramDocument,
  options: Partial<ThumbnailOptions> = {}
): string => {
  const canvas = generateCanvasThumbnail(document, { ...DEFAULT_OPTIONS, ...options });
  return canvas.toDataURL('image/png');
};

/**
 * Gera múltiplos thumbnails em diferentes tamanhos
 */
export const generateMultipleThumbnails = (
  document: UnifiedDiagramDocument,
  sizes: Array<{ width: number; height: number; name: string }>,
  baseOptions: Partial<ThumbnailOptions> = {}
): Record<string, string> => {
  const results: Record<string, string> = {};
  
  sizes.forEach(size => {
    const options = {
      ...DEFAULT_OPTIONS,
      ...baseOptions,
      width: size.width,
      height: size.height,
      format: 'dataurl' as const
    };
    
    results[size.name] = generateThumbnailDataURL(document, options);
  });
  
  return results;
};

/**
 * Tamanhos padrão para thumbnails
 */
export const THUMBNAIL_SIZES = {
  small: { width: 100, height: 75, name: 'small' },
  medium: { width: 200, height: 150, name: 'medium' },
  large: { width: 400, height: 300, name: 'large' },
  card: { width: 300, height: 200, name: 'card' },
  preview: { width: 600, height: 400, name: 'preview' }
};

/**
 * Gera thumbnails em tamanhos padrão
 */
export const generateStandardThumbnails = (
  document: UnifiedDiagramDocument,
  options: Partial<ThumbnailOptions> = {}
): Record<string, string> => {
  return generateMultipleThumbnails(
    document,
    Object.values(THUMBNAIL_SIZES),
    options
  );
};

export default generateThumbnail;