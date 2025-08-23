// ============================================================================
// Diagram Utils - Utilitários para validação e exportação
// ============================================================================
// Funções utilitárias para validação, exportação e manipulação de diagramas
// ============================================================================

import { Node, Edge } from 'reactflow';
import { DiagramType, UnifiedNodeData, UnifiedEdgeData } from '../../../types/unified-diagram';

// ============================================================================
// INTERFACES
// ============================================================================

interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

interface ValidationError {
  id: string;
  type: 'node' | 'edge' | 'diagram';
  message: string;
  severity: 'error' | 'warning';
}

interface ValidationWarning {
  id: string;
  type: 'node' | 'edge' | 'diagram';
  message: string;
  suggestion?: string;
}

interface ExportOptions {
  format: 'json' | 'xml' | 'svg' | 'png' | 'pdf';
  includeMetadata?: boolean;
  compression?: boolean;
  quality?: number; // Para formatos de imagem
}

interface DiagramMetrics {
  nodeCount: number;
  edgeCount: number;
  complexity: number;
  depth: number;
  width: number;
  cycles: number;
}

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

/**
 * Valida um diagrama completo
 */
export const validateDiagram = (
  nodes: Node<UnifiedNodeData>[],
  edges: Edge<UnifiedEdgeData>[],
  diagramType: DiagramType
): ValidationResult => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Validações gerais
  const generalValidation = validateGeneral(nodes, edges);
  errors.push(...generalValidation.errors);
  warnings.push(...generalValidation.warnings);

  // Validações específicas por tipo
  switch (diagramType) {
    case 'flowchart':
    case 'bpmn':
      const bpmnValidation = validateBPMN(nodes, edges);
      errors.push(...bpmnValidation.errors);
      warnings.push(...bpmnValidation.warnings);
      break;
    case 'mindmap':
      const mindmapValidation = validateMindMap(nodes, edges);
      errors.push(...mindmapValidation.errors);
      warnings.push(...mindmapValidation.warnings);
      break;
    case 'organogram':
      const orgValidation = validateOrganogram(nodes, edges);
      errors.push(...orgValidation.errors);
      warnings.push(...orgValidation.warnings);
      break;
  }

  return {
    isValid: errors.filter(e => e.severity === 'error').length === 0,
    errors,
    warnings
  };
};

/**
 * Validações gerais aplicáveis a todos os tipos de diagrama
 */
const validateGeneral = (
  nodes: Node<UnifiedNodeData>[],
  edges: Edge<UnifiedEdgeData>[]
): { errors: ValidationError[]; warnings: ValidationWarning[] } => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Verificar se há nós
  if (nodes.length === 0) {
    warnings.push({
      id: 'empty-diagram',
      type: 'diagram',
      message: 'O diagrama está vazio',
      suggestion: 'Adicione pelo menos um nó ao diagrama'
    });
  }

  // Verificar IDs únicos
  const nodeIds = new Set<string>();
  const edgeIds = new Set<string>();

  nodes.forEach(node => {
    if (nodeIds.has(node.id)) {
      errors.push({
        id: node.id,
        type: 'node',
        message: `ID duplicado encontrado: ${node.id}`,
        severity: 'error'
      });
    }
    nodeIds.add(node.id);

    // Verificar dados obrigatórios
    if (!node.data?.label || node.data.label.trim() === '') {
      warnings.push({
        id: node.id,
        type: 'node',
        message: 'Nó sem rótulo',
        suggestion: 'Adicione um rótulo descritivo ao nó'
      });
    }
  });

  edges.forEach(edge => {
    if (edgeIds.has(edge.id)) {
      errors.push({
        id: edge.id,
        type: 'edge',
        message: `ID de aresta duplicado: ${edge.id}`,
        severity: 'error'
      });
    }
    edgeIds.add(edge.id);

    // Verificar se source e target existem
    if (!nodeIds.has(edge.source)) {
      errors.push({
        id: edge.id,
        type: 'edge',
        message: `Nó de origem não encontrado: ${edge.source}`,
        severity: 'error'
      });
    }

    if (!nodeIds.has(edge.target)) {
      errors.push({
        id: edge.id,
        type: 'edge',
        message: `Nó de destino não encontrado: ${edge.target}`,
        severity: 'error'
      });
    }
  });

  // Verificar nós isolados
  const connectedNodes = new Set<string>();
  edges.forEach(edge => {
    connectedNodes.add(edge.source);
    connectedNodes.add(edge.target);
  });

  nodes.forEach(node => {
    if (!connectedNodes.has(node.id) && nodes.length > 1) {
      warnings.push({
        id: node.id,
        type: 'node',
        message: 'Nó isolado (sem conexões)',
        suggestion: 'Conecte este nó a outros nós ou remova-o'
      });
    }
  });

  return { errors, warnings };
};

/**
 * Validações específicas para diagramas BPMN
 */
const validateBPMN = (
  nodes: Node<UnifiedNodeData>[],
  edges: Edge<UnifiedEdgeData>[]
): { errors: ValidationError[]; warnings: ValidationWarning[] } => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  const startEvents = nodes.filter(n => n.data?.bpmn?.type === 'startEvent');
  const endEvents = nodes.filter(n => n.data?.bpmn?.type === 'endEvent');
  const gateways = nodes.filter(n => n.data?.bpmn?.type?.includes('Gateway'));

  // Verificar eventos de início
  if (startEvents.length === 0) {
    errors.push({
      id: 'missing-start',
      type: 'diagram',
      message: 'Diagrama BPMN deve ter pelo menos um evento de início',
      severity: 'error'
    });
  } else if (startEvents.length > 1) {
    warnings.push({
      id: 'multiple-starts',
      type: 'diagram',
      message: 'Múltiplos eventos de início encontrados',
      suggestion: 'Considere usar apenas um evento de início principal'
    });
  }

  // Verificar eventos de fim
  if (endEvents.length === 0) {
    warnings.push({
      id: 'missing-end',
      type: 'diagram',
      message: 'Diagrama BPMN sem evento de fim',
      suggestion: 'Adicione pelo menos um evento de fim'
    });
  }

  // Verificar gateways
  gateways.forEach(gateway => {
    const incomingEdges = edges.filter(e => e.target === gateway.id);
    const outgoingEdges = edges.filter(e => e.source === gateway.id);

    if (gateway.data?.bpmn?.type?.includes('exclusive') || gateway.data?.bpmn?.type?.includes('inclusive')) {
      if (outgoingEdges.length < 2) {
        warnings.push({
          id: gateway.id,
          type: 'node',
          message: 'Gateway de decisão com menos de 2 saídas',
          suggestion: 'Gateways de decisão devem ter pelo menos 2 caminhos alternativos'
        });
      }
    }

    if (gateway.data?.bpmn?.type?.includes('parallel')) {
      if (incomingEdges.length === 1 && outgoingEdges.length < 2) {
        warnings.push({
          id: gateway.id,
          type: 'node',
          message: 'Gateway paralelo deve dividir ou unir fluxos',
          suggestion: 'Use gateways paralelos para dividir ou sincronizar fluxos paralelos'
        });
      }
    }
  });

  return { errors, warnings };
};

/**
 * Validações específicas para mapas mentais
 */
const validateMindMap = (
  nodes: Node<UnifiedNodeData>[],
  edges: Edge<UnifiedEdgeData>[]
): { errors: ValidationError[]; warnings: ValidationWarning[] } => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Verificar nó central
  const centralNodes = nodes.filter(n => n.data?.mindmap?.level === 0);
  
  if (centralNodes.length === 0) {
    errors.push({
      id: 'missing-central',
      type: 'diagram',
      message: 'Mapa mental deve ter um nó central',
      severity: 'error'
    });
  } else if (centralNodes.length > 1) {
    errors.push({
      id: 'multiple-central',
      type: 'diagram',
      message: 'Mapa mental deve ter apenas um nó central',
      severity: 'error'
    });
  }

  // Verificar hierarquia
  nodes.forEach(node => {
    const level = node.data?.mindmap?.level || 0;
    const parentEdges = edges.filter(e => e.target === node.id);
    
    if (level > 0 && parentEdges.length === 0) {
      warnings.push({
        id: node.id,
        type: 'node',
        message: 'Nó sem conexão com nível superior',
        suggestion: 'Conecte este nó a um nó de nível superior'
      });
    }

    if (level > 0 && parentEdges.length > 1) {
      warnings.push({
        id: node.id,
        type: 'node',
        message: 'Nó com múltiplas conexões de entrada',
        suggestion: 'Em mapas mentais, cada nó deve ter apenas um pai'
      });
    }
  });

  return { errors, warnings };
};

/**
 * Validações específicas para organogramas
 */
const validateOrganogram = (
  nodes: Node<UnifiedNodeData>[],
  edges: Edge<UnifiedEdgeData>[]
): { errors: ValidationError[]; warnings: ValidationWarning[] } => {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];

  // Verificar nó raiz
  const rootNodes = nodes.filter(node => {
    return !edges.some(edge => edge.target === node.id);
  });

  if (rootNodes.length === 0) {
    errors.push({
      id: 'missing-root',
      type: 'diagram',
      message: 'Organograma deve ter um nó raiz',
      severity: 'error'
    });
  } else if (rootNodes.length > 1) {
    warnings.push({
      id: 'multiple-roots',
      type: 'diagram',
      message: 'Múltiplos nós raiz encontrados',
      suggestion: 'Considere ter apenas um nó raiz principal'
    });
  }

  // Verificar hierarquia
  nodes.forEach(node => {
    const parentEdges = edges.filter(e => e.target === node.id);
    
    if (parentEdges.length > 1) {
      warnings.push({
        id: node.id,
        type: 'node',
        message: 'Funcionário com múltiplos supervisores',
        suggestion: 'Em organogramas tradicionais, cada pessoa tem apenas um supervisor direto'
      });
    }
  });

  return { errors, warnings };
};

// ============================================================================
// METRICS FUNCTIONS
// ============================================================================

/**
 * Calcula métricas do diagrama
 */
export const calculateDiagramMetrics = (
  nodes: Node<UnifiedNodeData>[],
  edges: Edge<UnifiedEdgeData>[]
): DiagramMetrics => {
  const nodeCount = nodes.length;
  const edgeCount = edges.length;
  
  // Calcular complexidade (baseado na densidade do grafo)
  const maxEdges = nodeCount * (nodeCount - 1) / 2;
  const complexity = maxEdges > 0 ? (edgeCount / maxEdges) * 100 : 0;
  
  // Calcular profundidade máxima
  const depth = calculateMaxDepth(nodes, edges);
  
  // Calcular largura máxima (maior número de nós em um nível)
  const width = calculateMaxWidth(nodes, edges);
  
  // Detectar ciclos
  const cycles = detectCycles(nodes, edges);
  
  return {
    nodeCount,
    edgeCount,
    complexity: Math.round(complexity),
    depth,
    width,
    cycles
  };
};

const calculateMaxDepth = (
  nodes: Node<UnifiedNodeData>[],
  edges: Edge<UnifiedEdgeData>[]
): number => {
  if (nodes.length === 0) return 0;
  
  // Encontrar nós raiz
  const rootNodes = nodes.filter(node => 
    !edges.some(edge => edge.target === node.id)
  );
  
  if (rootNodes.length === 0) return 1; // Grafo cíclico
  
  const visited = new Set<string>();
  
  const dfs = (nodeId: string): number => {
    if (visited.has(nodeId)) return 0;
    visited.add(nodeId);
    
    const children = edges
      .filter(edge => edge.source === nodeId)
      .map(edge => edge.target);
    
    if (children.length === 0) return 1;
    
    return 1 + Math.max(...children.map(child => dfs(child)));
  };
  
  return Math.max(...rootNodes.map(root => dfs(root.id)));
};

const calculateMaxWidth = (
  nodes: Node<UnifiedNodeData>[],
  edges: Edge<UnifiedEdgeData>[]
): number => {
  if (nodes.length === 0) return 0;
  
  // Calcular nível de cada nó
  const levels = new Map<string, number>();
  const visited = new Set<string>();
  
  const rootNodes = nodes.filter(node => 
    !edges.some(edge => edge.target === node.id)
  );
  
  const bfs = (startNodes: Node<UnifiedNodeData>[]) => {
    const queue: { nodeId: string; level: number }[] = 
      startNodes.map(node => ({ nodeId: node.id, level: 0 }));
    
    while (queue.length > 0) {
      const { nodeId, level } = queue.shift()!;
      
      if (visited.has(nodeId)) continue;
      visited.add(nodeId);
      levels.set(nodeId, level);
      
      const children = edges
        .filter(edge => edge.source === nodeId)
        .map(edge => edge.target);
      
      children.forEach(child => {
        if (!visited.has(child)) {
          queue.push({ nodeId: child, level: level + 1 });
        }
      });
    }
  };
  
  if (rootNodes.length > 0) {
    bfs(rootNodes);
  } else {
    // Se não há raiz, começar do primeiro nó
    bfs([nodes[0]]);
  }
  
  // Contar nós por nível
  const levelCounts = new Map<number, number>();
  levels.forEach(level => {
    levelCounts.set(level, (levelCounts.get(level) || 0) + 1);
  });
  
  return Math.max(...Array.from(levelCounts.values()), 1);
};

const detectCycles = (
  nodes: Node<UnifiedNodeData>[],
  edges: Edge<UnifiedEdgeData>[]
): number => {
  const visited = new Set<string>();
  const recursionStack = new Set<string>();
  let cycleCount = 0;
  
  const dfs = (nodeId: string): boolean => {
    if (recursionStack.has(nodeId)) {
      cycleCount++;
      return true;
    }
    
    if (visited.has(nodeId)) return false;
    
    visited.add(nodeId);
    recursionStack.add(nodeId);
    
    const children = edges
      .filter(edge => edge.source === nodeId)
      .map(edge => edge.target);
    
    for (const child of children) {
      if (dfs(child)) {
        recursionStack.delete(nodeId);
        return true;
      }
    }
    
    recursionStack.delete(nodeId);
    return false;
  };
  
  nodes.forEach(node => {
    if (!visited.has(node.id)) {
      dfs(node.id);
    }
  });
  
  return cycleCount;
};

// ============================================================================
// EXPORT FUNCTIONS
// ============================================================================

/**
 * Exporta diagrama para JSON
 */
export const exportToJSON = (
  nodes: Node<UnifiedNodeData>[],
  edges: Edge<UnifiedEdgeData>[],
  diagramType: DiagramType,
  options: Partial<ExportOptions> = {}
): string => {
  const data = {
    version: '1.0',
    type: diagramType,
    timestamp: new Date().toISOString(),
    nodes: nodes.map(node => ({
      id: node.id,
      type: node.type,
      position: node.position,
      data: node.data,
      ...(options.includeMetadata && {
        metadata: {
          created: new Date().toISOString(),
          modified: new Date().toISOString()
        }
      })
    })),
    edges: edges.map(edge => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type,
      data: edge.data,
      ...(options.includeMetadata && {
        metadata: {
          created: new Date().toISOString(),
          modified: new Date().toISOString()
        }
      })
    })),
    ...(options.includeMetadata && {
      metadata: {
        metrics: calculateDiagramMetrics(nodes, edges),
        validation: validateDiagram(nodes, edges, diagramType)
      }
    })
  };
  
  return JSON.stringify(data, null, options.compression ? 0 : 2);
};

/**
 * Exporta diagrama para XML (BPMN 2.0)
 */
export const exportToBPMN = (
  nodes: Node<UnifiedNodeData>[],
  edges: Edge<UnifiedEdgeData>[]
): string => {
  const processId = `process_${Date.now()}`;
  
  let xml = `<?xml version="1.0" encoding="UTF-8"?>
`;
  xml += `<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" 
`;
  xml += `  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI" 
`;
  xml += `  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC" 
`;
  xml += `  xmlns:di="http://www.omg.org/spec/DD/20100524/DI" 
`;
  xml += `  id="Definitions_1" targetNamespace="http://bpmn.io/schema/bpmn">
`;
  xml += `  <bpmn:process id="${processId}" isExecutable="true">
`;
  
  // Adicionar nós
  nodes.forEach(node => {
    const bpmnType = node.data?.bpmn?.type || 'task';
    const name = node.data?.label || '';
    
    switch (bpmnType) {
      case 'startEvent':
        xml += `    <bpmn:startEvent id="${node.id}" name="${name}" />
`;
        break;
      case 'endEvent':
        xml += `    <bpmn:endEvent id="${node.id}" name="${name}" />
`;
        break;
      case 'task':
        xml += `    <bpmn:task id="${node.id}" name="${name}" />
`;
        break;
      case 'exclusiveGateway':
        xml += `    <bpmn:exclusiveGateway id="${node.id}" name="${name}" />
`;
        break;
      case 'parallelGateway':
        xml += `    <bpmn:parallelGateway id="${node.id}" name="${name}" />
`;
        break;
      default:
        xml += `    <bpmn:task id="${node.id}" name="${name}" />
`;
    }
  });
  
  // Adicionar arestas
  edges.forEach(edge => {
    xml += `    <bpmn:sequenceFlow id="${edge.id}" sourceRef="${edge.source}" targetRef="${edge.target}" />
`;
  });
  
  xml += `  </bpmn:process>
`;
  xml += `</bpmn:definitions>`;
  
  return xml;
};

/**
 * Importa diagrama de JSON
 */
export const importFromJSON = (jsonString: string): {
  nodes: Node<UnifiedNodeData>[];
  edges: Edge<UnifiedEdgeData>[];
  diagramType: DiagramType;
} => {
  try {
    const data = JSON.parse(jsonString);
    
    return {
      nodes: data.nodes || [],
      edges: data.edges || [],
      diagramType: data.type || 'bpmn'
    };
  } catch (error) {
    throw new Error('Formato JSON inválido');
  }
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Gera ID único para nós e arestas
 */
export const generateId = (prefix = 'node'): string => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Clona um nó com novo ID
 */
export const cloneNode = (node: Node<UnifiedNodeData>): Node<UnifiedNodeData> => {
  return {
    ...node,
    id: generateId('node'),
    position: {
      x: node.position.x + 50,
      y: node.position.y + 50
    },
    data: {
      ...node.data,
      label: `${node.data?.label || 'Nó'} (Cópia)`
    }
  };
};

/**
 * Encontra o caminho mais curto entre dois nós
 */
export const findShortestPath = (
  nodes: Node<UnifiedNodeData>[],
  edges: Edge<UnifiedEdgeData>[],
  startId: string,
  endId: string
): string[] => {
  const graph = new Map<string, string[]>();
  
  // Construir grafo
  nodes.forEach(node => graph.set(node.id, []));
  edges.forEach(edge => {
    graph.get(edge.source)?.push(edge.target);
  });
  
  // BFS para encontrar caminho mais curto
  const queue: { nodeId: string; path: string[] }[] = [{ nodeId: startId, path: [startId] }];
  const visited = new Set<string>();
  
  while (queue.length > 0) {
    const { nodeId, path } = queue.shift()!;
    
    if (nodeId === endId) {
      return path;
    }
    
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);
    
    const neighbors = graph.get(nodeId) || [];
    neighbors.forEach(neighbor => {
      if (!visited.has(neighbor)) {
        queue.push({
          nodeId: neighbor,
          path: [...path, neighbor]
        });
      }
    });
  }
  
  return []; // Nenhum caminho encontrado
};

/**
 * Calcula estatísticas de conectividade
 */
export const calculateConnectivityStats = (
  nodes: Node<UnifiedNodeData>[],
  edges: Edge<UnifiedEdgeData>[]
): {
  averageDegree: number;
  maxDegree: number;
  minDegree: number;
  isolatedNodes: number;
} => {
  const degrees = new Map<string, number>();
  
  // Inicializar graus
  nodes.forEach(node => degrees.set(node.id, 0));
  
  // Calcular graus
  edges.forEach(edge => {
    degrees.set(edge.source, (degrees.get(edge.source) || 0) + 1);
    degrees.set(edge.target, (degrees.get(edge.target) || 0) + 1);
  });
  
  const degreeValues = Array.from(degrees.values());
  const isolatedNodes = degreeValues.filter(degree => degree === 0).length;
  
  return {
    averageDegree: degreeValues.length > 0 ? degreeValues.reduce((a, b) => a + b, 0) / degreeValues.length : 0,
    maxDegree: Math.max(...degreeValues, 0),
    minDegree: Math.min(...degreeValues, 0),
    isolatedNodes
  };
};

export default {
  validateDiagram,
  calculateDiagramMetrics,
  exportToJSON,
  exportToBPMN,
  importFromJSON,
  generateId,
  cloneNode,
  findShortestPath,
  calculateConnectivityStats
};