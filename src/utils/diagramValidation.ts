// ============================================================================
// Diagram Validation Utilities - Utilitários de validação de diagramas
// ============================================================================
// Validação BPMN 2.0 compliant e regras específicas por tipo de diagrama
// ============================================================================

import {
  UnifiedDiagramDocument,
  UnifiedDiagramNode,
  UnifiedDiagramEdge,
  ValidationState,
  UnifiedNodeType,
  DiagramType
} from '../types/unified-diagram';

// ============================================================================
// INTERFACES
// ============================================================================

interface ValidationError {
  id: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  nodeId?: string;
  edgeId?: string;
  category: 'structure' | 'bpmn' | 'connectivity' | 'labeling' | 'performance';
}

interface ValidationRule {
  id: string;
  name: string;
  description: string;
  category: ValidationError['category'];
  severity: ValidationError['type'];
  diagramTypes: DiagramType[];
  validate: (document: UnifiedDiagramDocument) => ValidationError[];
}

// ============================================================================
// REGRAS DE VALIDAÇÃO BPMN
// ============================================================================

const bpmnRules: ValidationRule[] = [
  {
    id: 'bpmn-start-event',
    name: 'Evento de Início',
    description: 'Todo fluxograma BPMN deve ter pelo menos um evento de início',
    category: 'bpmn',
    severity: 'error',
    diagramTypes: ['flowchart'],
    validate: (document) => {
      const startNodes = document.nodes.filter(n => n.type === 'start');
      if (startNodes.length === 0) {
        return [{
          id: 'missing-start-event',
          type: 'error',
          message: 'Fluxograma deve ter pelo menos um evento de início',
          category: 'bpmn'
        }];
      }
      if (startNodes.length > 1) {
        return [{
          id: 'multiple-start-events',
          type: 'warning',
          message: 'Múltiplos eventos de início podem causar confusão',
          category: 'bpmn'
        }];
      }
      return [];
    }
  },
  
  {
    id: 'bpmn-end-event',
    name: 'Evento de Fim',
    description: 'Todo fluxograma BPMN deve ter pelo menos um evento de fim',
    category: 'bpmn',
    severity: 'error',
    diagramTypes: ['flowchart'],
    validate: (document) => {
      const endNodes = document.nodes.filter(n => n.type === 'end');
      if (endNodes.length === 0) {
        return [{
          id: 'missing-end-event',
          type: 'error',
          message: 'Fluxograma deve ter pelo menos um evento de fim',
          category: 'bpmn'
        }];
      }
      return [];
    }
  },
  
  {
    id: 'bpmn-gateway-connections',
    name: 'Conexões de Gateway',
    description: 'Gateways devem ter múltiplas saídas (exceto gateways de convergência)',
    category: 'bpmn',
    severity: 'warning',
    diagramTypes: ['flowchart'],
    validate: (document) => {
      const errors: ValidationError[] = [];
      const gatewayTypes = ['decision', 'parallel', 'inclusive', 'exclusive', 'complex', 'event-based'];
      
      document.nodes
        .filter(n => gatewayTypes.includes(n.type))
        .forEach(gateway => {
          const outgoingEdges = document.edges.filter(e => e.source === gateway.id);
          const incomingEdges = document.edges.filter(e => e.target === gateway.id);
          
          // Gateway de divergência deve ter múltiplas saídas
          if (incomingEdges.length === 1 && outgoingEdges.length < 2) {
            errors.push({
              id: `gateway-single-output-${gateway.id}`,
              type: 'warning',
              message: `Gateway "${gateway.data.label}" deve ter múltiplas saídas`,
              nodeId: gateway.id,
              category: 'bpmn'
            });
          }
          
          // Gateway de convergência deve ter múltiplas entradas
          if (outgoingEdges.length === 1 && incomingEdges.length < 2) {
            errors.push({
              id: `gateway-single-input-${gateway.id}`,
              type: 'warning',
              message: `Gateway "${gateway.data.label}" deve ter múltiplas entradas`,
              nodeId: gateway.id,
              category: 'bpmn'
            });
          }
        });
      
      return errors;
    }
  },
  
  {
    id: 'bpmn-decision-labels',
    name: 'Rótulos de Decisão',
    description: 'Saídas de gateways de decisão devem ter rótulos descritivos',
    category: 'bpmn',
    severity: 'warning',
    diagramTypes: ['flowchart'],
    validate: (document) => {
      const errors: ValidationError[] = [];
      const decisionNodes = document.nodes.filter(n => n.type === 'decision');
      
      decisionNodes.forEach(decision => {
        const outgoingEdges = document.edges.filter(e => e.source === decision.id);
        
        outgoingEdges.forEach(edge => {
          if (!edge.data?.label || edge.data.label.trim() === '') {
            errors.push({
              id: `decision-unlabeled-edge-${edge.id}`,
              type: 'warning',
              message: `Saída do gateway "${decision.data.label}" deve ter rótulo`,
              edgeId: edge.id,
              nodeId: decision.id,
              category: 'bpmn'
            });
          }
        });
      });
      
      return errors;
    }
  }
];

// ============================================================================
// REGRAS DE CONECTIVIDADE
// ============================================================================

const connectivityRules: ValidationRule[] = [
  {
    id: 'isolated-nodes',
    name: 'Nós Isolados',
    description: 'Nós não devem ficar isolados sem conexões',
    category: 'connectivity',
    severity: 'warning',
    diagramTypes: ['flowchart', 'mindmap', 'organogram'],
    validate: (document) => {
      const errors: ValidationError[] = [];
      
      document.nodes.forEach(node => {
        const hasConnections = document.edges.some(e => 
          e.source === node.id || e.target === node.id
        );
        
        if (!hasConnections && document.nodes.length > 1) {
          errors.push({
            id: `isolated-node-${node.id}`,
            type: 'warning',
            message: `Nó "${node.data.label}" está isolado`,
            nodeId: node.id,
            category: 'connectivity'
          });
        }
      });
      
      return errors;
    }
  },
  
  {
    id: 'circular-references',
    name: 'Referências Circulares',
    description: 'Detectar loops infinitos no fluxo',
    category: 'connectivity',
    severity: 'info',
    diagramTypes: ['flowchart'],
    validate: (document) => {
      const errors: ValidationError[] = [];
      const visited = new Set<string>();
      const recursionStack = new Set<string>();
      
      const hasCycle = (nodeId: string): boolean => {
        if (recursionStack.has(nodeId)) {
          return true;
        }
        if (visited.has(nodeId)) {
          return false;
        }
        
        visited.add(nodeId);
        recursionStack.add(nodeId);
        
        const outgoingEdges = document.edges.filter(e => e.source === nodeId);
        for (const edge of outgoingEdges) {
          if (hasCycle(edge.target)) {
            return true;
          }
        }
        
        recursionStack.delete(nodeId);
        return false;
      };
      
      document.nodes.forEach(node => {
        if (!visited.has(node.id) && hasCycle(node.id)) {
          errors.push({
            id: `circular-reference-${node.id}`,
            type: 'info',
            message: `Possível loop detectado a partir de "${node.data.label}"`,
            nodeId: node.id,
            category: 'connectivity'
          });
        }
      });
      
      return errors;
    }
  },
  
  {
    id: 'unreachable-nodes',
    name: 'Nós Inalcançáveis',
    description: 'Nós que não podem ser alcançados a partir do início',
    category: 'connectivity',
    severity: 'warning',
    diagramTypes: ['flowchart'],
    validate: (document) => {
      const errors: ValidationError[] = [];
      const startNodes = document.nodes.filter(n => n.type === 'start');
      
      if (startNodes.length === 0) {
        return errors; // Será capturado por outra regra
      }
      
      const reachable = new Set<string>();
      const queue = [...startNodes.map(n => n.id)];
      
      while (queue.length > 0) {
        const nodeId = queue.shift()!;
        if (reachable.has(nodeId)) continue;
        
        reachable.add(nodeId);
        
        const outgoingEdges = document.edges.filter(e => e.source === nodeId);
        outgoingEdges.forEach(edge => {
          if (!reachable.has(edge.target)) {
            queue.push(edge.target);
          }
        });
      }
      
      document.nodes.forEach(node => {
        if (!reachable.has(node.id) && node.type !== 'start') {
          errors.push({
            id: `unreachable-node-${node.id}`,
            type: 'warning',
            message: `Nó "${node.data.label}" não é alcançável a partir do início`,
            nodeId: node.id,
            category: 'connectivity'
          });
        }
      });
      
      return errors;
    }
  }
];

// ============================================================================
// REGRAS DE ROTULAGEM
// ============================================================================

const labelingRules: ValidationRule[] = [
  {
    id: 'empty-labels',
    name: 'Rótulos Vazios',
    description: 'Nós devem ter rótulos descritivos',
    category: 'labeling',
    severity: 'warning',
    diagramTypes: ['flowchart', 'mindmap', 'organogram'],
    validate: (document) => {
      const errors: ValidationError[] = [];
      
      document.nodes.forEach(node => {
        if (!node.data.label || node.data.label.trim() === '') {
          errors.push({
            id: `empty-label-${node.id}`,
            type: 'warning',
            message: `Nó do tipo "${node.type}" não tem rótulo`,
            nodeId: node.id,
            category: 'labeling'
          });
        }
      });
      
      return errors;
    }
  },
  
  {
    id: 'duplicate-labels',
    name: 'Rótulos Duplicados',
    description: 'Evitar rótulos idênticos que podem causar confusão',
    category: 'labeling',
    severity: 'info',
    diagramTypes: ['flowchart', 'mindmap', 'organogram'],
    validate: (document) => {
      const errors: ValidationError[] = [];
      const labelCounts = new Map<string, string[]>();
      
      document.nodes.forEach(node => {
        const label = node.data.label?.trim().toLowerCase();
        if (label) {
          if (!labelCounts.has(label)) {
            labelCounts.set(label, []);
          }
          labelCounts.get(label)!.push(node.id);
        }
      });
      
      labelCounts.forEach((nodeIds, label) => {
        if (nodeIds.length > 1) {
          nodeIds.forEach(nodeId => {
            errors.push({
              id: `duplicate-label-${nodeId}`,
              type: 'info',
              message: `Rótulo "${label}" é usado em múltiplos nós`,
              nodeId,
              category: 'labeling'
            });
          });
        }
      });
      
      return errors;
    }
  }
];

// ============================================================================
// REGRAS DE PERFORMANCE
// ============================================================================

const performanceRules: ValidationRule[] = [
  {
    id: 'node-count',
    name: 'Quantidade de Nós',
    description: 'Diagramas muito grandes podem ter problemas de performance',
    category: 'performance',
    severity: 'info',
    diagramTypes: ['flowchart', 'mindmap', 'organogram'],
    validate: (document) => {
      const nodeCount = document.nodes.length;
      
      if (nodeCount > 100) {
        return [{
          id: 'high-node-count',
          type: 'info',
          message: `Diagrama tem ${nodeCount} nós. Considere dividir em sub-diagramas`,
          category: 'performance'
        }];
      }
      
      return [];
    }
  },
  
  {
    id: 'edge-count',
    name: 'Quantidade de Conexões',
    description: 'Muitas conexões podem tornar o diagrama confuso',
    category: 'performance',
    severity: 'info',
    diagramTypes: ['flowchart', 'mindmap', 'organogram'],
    validate: (document) => {
      const edgeCount = document.edges.length;
      
      if (edgeCount > 150) {
        return [{
          id: 'high-edge-count',
          type: 'info',
          message: `Diagrama tem ${edgeCount} conexões. Considere simplificar`,
          category: 'performance'
        }];
      }
      
      return [];
    }
  }
];

// ============================================================================
// REGRAS ESPECÍFICAS POR TIPO
// ============================================================================

const mindmapRules: ValidationRule[] = [
  {
    id: 'mindmap-root',
    name: 'Nó Raiz do Mapa Mental',
    description: 'Mapa mental deve ter exatamente um nó raiz',
    category: 'structure',
    severity: 'error',
    diagramTypes: ['mindmap'],
    validate: (document) => {
      const rootNodes = document.nodes.filter(n => n.type === 'mindmap-root');
      
      if (rootNodes.length === 0) {
        return [{
          id: 'missing-mindmap-root',
          type: 'error',
          message: 'Mapa mental deve ter um nó raiz',
          category: 'structure'
        }];
      }
      
      if (rootNodes.length > 1) {
        return [{
          id: 'multiple-mindmap-roots',
          type: 'error',
          message: 'Mapa mental deve ter apenas um nó raiz',
          category: 'structure'
        }];
      }
      
      return [];
    }
  }
];

const organogramRules: ValidationRule[] = [
  {
    id: 'org-hierarchy',
    name: 'Hierarquia Organizacional',
    description: 'Organograma deve ter estrutura hierárquica clara',
    category: 'structure',
    severity: 'warning',
    diagramTypes: ['organogram'],
    validate: (document) => {
      const errors: ValidationError[] = [];
      const ceoNodes = document.nodes.filter(n => n.type === 'org-ceo');
      
      if (ceoNodes.length === 0) {
        errors.push({
          id: 'missing-ceo-node',
          type: 'warning',
          message: 'Organograma deveria ter um nó CEO/Diretor',
          category: 'structure'
        });
      }
      
      if (ceoNodes.length > 1) {
        errors.push({
          id: 'multiple-ceo-nodes',
          type: 'warning',
          message: 'Organograma tem múltiplos CEOs/Diretores',
          category: 'structure'
        });
      }
      
      return errors;
    }
  }
];

// ============================================================================
// CONSOLIDAÇÃO DE REGRAS
// ============================================================================

const allRules: ValidationRule[] = [
  ...bpmnRules,
  ...connectivityRules,
  ...labelingRules,
  ...performanceRules,
  ...mindmapRules,
  ...organogramRules
];

// ============================================================================
// FUNÇÃO PRINCIPAL DE VALIDAÇÃO
// ============================================================================

/**
 * Valida um documento de diagrama contra todas as regras aplicáveis
 */
export const validateDiagram = (document: UnifiedDiagramDocument): ValidationState => {
  const errors: ValidationError[] = [];
  
  // Filtrar regras aplicáveis ao tipo de diagrama
  const applicableRules = allRules.filter(rule => 
    rule.diagramTypes.includes(document.type)
  );
  
  // Executar cada regra
  applicableRules.forEach(rule => {
    try {
      const ruleErrors = rule.validate(document);
      errors.push(...ruleErrors);
    } catch (error) {
      console.error(`Erro ao executar regra ${rule.id}:`, error);
      errors.push({
        id: `rule-error-${rule.id}`,
        type: 'error',
        message: `Erro interno na validação: ${rule.name}`,
        category: 'structure'
      });
    }
  });
  
  // Determinar se o diagrama é válido
  const hasErrors = errors.some(e => e.type === 'error');
  
  return {
    errors,
    isValid: !hasErrors,
    lastValidation: new Date().toISOString()
  };
};

/**
 * Valida apenas regras específicas
 */
export const validateSpecificRules = (
  document: UnifiedDiagramDocument,
  ruleIds: string[]
): ValidationState => {
  const errors: ValidationError[] = [];
  
  const rulesToRun = allRules.filter(rule => ruleIds.includes(rule.id));
  
  rulesToRun.forEach(rule => {
    try {
      const ruleErrors = rule.validate(document);
      errors.push(...ruleErrors);
    } catch (error) {
      console.error(`Erro ao executar regra ${rule.id}:`, error);
    }
  });
  
  const hasErrors = errors.some(e => e.type === 'error');
  
  return {
    errors,
    isValid: !hasErrors,
    lastValidation: new Date().toISOString()
  };
};

/**
 * Obtém todas as regras disponíveis
 */
export const getAvailableRules = (): ValidationRule[] => {
  return [...allRules];
};

/**
 * Obtém regras por categoria
 */
export const getRulesByCategory = (category: ValidationError['category']): ValidationRule[] => {
  return allRules.filter(rule => rule.category === category);
};

/**
 * Obtém regras por tipo de diagrama
 */
export const getRulesByDiagramType = (diagramType: DiagramType): ValidationRule[] => {
  return allRules.filter(rule => rule.diagramTypes.includes(diagramType));
};

/**
 * Formata mensagem de erro para exibição
 */
export const formatValidationMessage = (error: ValidationError): string => {
  const prefix = error.type === 'error' ? '❌' : error.type === 'warning' ? '⚠️' : 'ℹ️';
  return `${prefix} ${error.message}`;
};

/**
 * Agrupa erros por categoria
 */
export const groupErrorsByCategory = (errors: ValidationError[]): Record<string, ValidationError[]> => {
  return errors.reduce((groups, error) => {
    if (!groups[error.category]) {
      groups[error.category] = [];
    }
    groups[error.category].push(error);
    return groups;
  }, {} as Record<string, ValidationError[]>);
};

export default validateDiagram;