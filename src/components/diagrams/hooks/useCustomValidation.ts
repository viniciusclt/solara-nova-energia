import { useState, useEffect, useCallback, useMemo } from 'react';
import { Node, Edge } from 'reactflow';
import {
  CustomValidationRule,
  ValidationCondition,
  ValidationAction,
  customValidationRuleService
} from '../../../services/validation/CustomValidationRuleService';
import { ValidationIssue, ValidationState } from '../panels/ValidationPanel';
import { DiagramType } from '../../../types/unified-diagram';

// ============================================================================
// INTERFACES
// ============================================================================

interface UseCustomValidationProps {
  nodes: Node[];
  edges: Edge[];
  diagramType: DiagramType;
  enabled?: boolean;
}

interface UseCustomValidationReturn {
  validation: ValidationState;
  validateDiagram: () => Promise<void>;
  isValidating: boolean;
  customRules: CustomValidationRule[];
  refreshRules: () => Promise<void>;
}

// ============================================================================
// UTILITÁRIOS DE VALIDAÇÃO
// ============================================================================

const evaluateCondition = (
  condition: ValidationCondition,
  context: {
    nodes: Node[];
    edges: Edge[];
    diagramType: DiagramType;
    currentNode?: Node;
    currentEdge?: Edge;
  }
): boolean => {
  const { nodes, edges, diagramType, currentNode, currentEdge } = context;

  switch (condition.type) {
    case 'node_count':
      const nodeCount = nodes.length;
      return evaluateComparison(nodeCount, condition.operator, condition.value);

    case 'edge_count':
      const edgeCount = edges.length;
      return evaluateComparison(edgeCount, condition.operator, condition.value);

    case 'node_type':
      if (!currentNode) return false;
      return currentNode.type === condition.value;

    case 'node_label':
      if (!currentNode) return false;
      const nodeLabel = currentNode.data?.label || '';
      return evaluateStringCondition(nodeLabel, condition.operator, condition.value);

    case 'edge_type':
      if (!currentEdge) return false;
      return currentEdge.type === condition.value;

    case 'isolated_nodes':
      const isolatedNodes = nodes.filter(node => {
        const hasIncoming = edges.some(edge => edge.target === node.id);
        const hasOutgoing = edges.some(edge => edge.source === node.id);
        return !hasIncoming && !hasOutgoing;
      });
      return evaluateComparison(isolatedNodes.length, condition.operator, condition.value);

    case 'diagram_type':
      return diagramType === condition.value;

    case 'custom':
      // Para condições customizadas, tentamos avaliar como JavaScript
      try {
        const func = new Function('nodes', 'edges', 'diagramType', 'currentNode', 'currentEdge', `return ${condition.value}`);
        return func(nodes, edges, diagramType, currentNode, currentEdge);
      } catch {
        return false;
      }

    default:
      return false;
  }
};

const evaluateComparison = (actual: number, operator: string, expected: any): boolean => {
  const expectedNum = Number(expected);
  switch (operator) {
    case 'equals': return actual === expectedNum;
    case 'not_equals': return actual !== expectedNum;
    case 'greater_than': return actual > expectedNum;
    case 'less_than': return actual < expectedNum;
    case 'greater_equal': return actual >= expectedNum;
    case 'less_equal': return actual <= expectedNum;
    default: return false;
  }
};

const evaluateStringCondition = (actual: string, operator: string, expected: string): boolean => {
  switch (operator) {
    case 'equals': return actual === expected;
    case 'not_equals': return actual !== expected;
    case 'contains': return actual.includes(expected);
    case 'not_contains': return !actual.includes(expected);
    case 'starts_with': return actual.startsWith(expected);
    case 'ends_with': return actual.endsWith(expected);
    case 'regex': 
      try {
        return new RegExp(expected).test(actual);
      } catch {
        return false;
      }
    case 'empty': return actual.trim() === '';
    case 'not_empty': return actual.trim() !== '';
    default: return false;
  }
};

const executeAction = (
  action: ValidationAction,
  context: {
    nodes: Node[];
    edges: Edge[];
    currentNode?: Node;
    currentEdge?: Edge;
    rule: CustomValidationRule;
  }
): ValidationIssue | null => {
  const { currentNode, currentEdge, rule } = context;

  switch (action.type) {
    case 'highlight':
      return {
        id: `${rule.id}-${currentNode?.id || currentEdge?.id || 'global'}-${Date.now()}`,
        type: rule.severity === 'error' ? 'error' : rule.severity === 'warning' ? 'warning' : 'info',
        severity: rule.severity,
        category: rule.category,
        title: rule.name,
        description: rule.description,
        nodeId: currentNode?.id,
        edgeId: currentEdge?.id,
        position: currentNode?.position,
        suggestions: action.config?.suggestions || [],
        autoFixable: false
      };

    case 'message':
      return {
        id: `${rule.id}-message-${Date.now()}`,
        type: action.config?.messageType === 'error' ? 'error' : 
              action.config?.messageType === 'warning' ? 'warning' : 'info',
        severity: rule.severity,
        category: rule.category,
        title: action.config?.title || rule.name,
        description: action.config?.message || rule.description,
        nodeId: currentNode?.id,
        edgeId: currentEdge?.id,
        position: currentNode?.position,
        autoFixable: false
      };

    case 'block':
      return {
        id: `${rule.id}-block-${Date.now()}`,
        type: 'error',
        severity: 'critical',
        category: rule.category,
        title: `Bloqueio: ${rule.name}`,
        description: action.config?.reason || 'Esta ação foi bloqueada pela regra de validação',
        nodeId: currentNode?.id,
        edgeId: currentEdge?.id,
        position: currentNode?.position,
        autoFixable: false
      };

    case 'suggest':
      return {
        id: `${rule.id}-suggest-${Date.now()}`,
        type: 'info',
        severity: 'low',
        category: rule.category,
        title: `Sugestão: ${rule.name}`,
        description: rule.description,
        nodeId: currentNode?.id,
        edgeId: currentEdge?.id,
        position: currentNode?.position,
        suggestions: action.config?.suggestions || [],
        autoFixable: false
      };

    case 'autofix':
      return {
        id: `${rule.id}-autofix-${Date.now()}`,
        type: 'warning',
        severity: 'medium',
        category: rule.category,
        title: `Correção automática disponível: ${rule.name}`,
        description: `${rule.description}. Clique para aplicar a correção automática.`,
        nodeId: currentNode?.id,
        edgeId: currentEdge?.id,
        position: currentNode?.position,
        autoFixable: true
      };

    case 'custom':
      // Para ações customizadas, criamos um issue genérico
      return {
        id: `${rule.id}-custom-${Date.now()}`,
        type: rule.severity === 'error' ? 'error' : rule.severity === 'warning' ? 'warning' : 'info',
        severity: rule.severity,
        category: rule.category,
        title: rule.name,
        description: rule.description,
        nodeId: currentNode?.id,
        edgeId: currentEdge?.id,
        position: currentNode?.position,
        autoFixable: false
      };

    default:
      return null;
  }
};

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export const useCustomValidation = ({
  nodes,
  edges,
  diagramType,
  enabled = true
}: UseCustomValidationProps): UseCustomValidationReturn => {
  const [validation, setValidation] = useState<ValidationState>({
    isValidating: false,
    issues: [],
    score: 100,
    summary: {
      errors: 0,
      warnings: 0,
      infos: 0,
      total: 0
    }
  });

  const [customRules, setCustomRules] = useState<CustomValidationRule[]>([]);
  const [isValidating, setIsValidating] = useState(false);

  // Carregar regras customizadas
  const refreshRules = useCallback(async () => {
    try {
      const rules = await customValidationRuleService.getAllRules();
      const enabledRules = rules.filter(rule => 
        rule.enabled && rule.diagramTypes.includes(diagramType)
      );
      setCustomRules(enabledRules);
    } catch (error) {
      console.error('Erro ao carregar regras customizadas:', error);
    }
  }, [diagramType]);

  // Validar diagrama com regras customizadas
  const validateDiagram = useCallback(async () => {
    if (!enabled || isValidating) return;

    setIsValidating(true);
    setValidation(prev => ({ ...prev, isValidating: true }));

    try {
      const issues: ValidationIssue[] = [];
      const context = { nodes, edges, diagramType };

      for (const rule of customRules) {
        // Avaliar condições globais (sem nó/aresta específica)
        const globalConditionsMet = rule.conditions.every(condition => 
          evaluateCondition(condition, context)
        );

        if (globalConditionsMet) {
          // Executar ações globais
          for (const action of rule.actions) {
            const issue = executeAction(action, { ...context, rule });
            if (issue) {
              issues.push(issue);
            }
          }
        }

        // Avaliar condições específicas para cada nó
        for (const node of nodes) {
          const nodeContext = { ...context, currentNode: node };
          const nodeConditionsMet = rule.conditions.every(condition => 
            evaluateCondition(condition, nodeContext)
          );

          if (nodeConditionsMet) {
            for (const action of rule.actions) {
              const issue = executeAction(action, { ...nodeContext, rule });
              if (issue) {
                issues.push(issue);
              }
            }
          }
        }

        // Avaliar condições específicas para cada aresta
        for (const edge of edges) {
          const edgeContext = { ...context, currentEdge: edge };
          const edgeConditionsMet = rule.conditions.every(condition => 
            evaluateCondition(condition, edgeContext)
          );

          if (edgeConditionsMet) {
            for (const action of rule.actions) {
              const issue = executeAction(action, { ...edgeContext, rule });
              if (issue) {
                issues.push(issue);
              }
            }
          }
        }
      }

      // Calcular resumo e pontuação
      const summary = {
        errors: issues.filter(i => i.type === 'error').length,
        warnings: issues.filter(i => i.type === 'warning').length,
        infos: issues.filter(i => i.type === 'info').length,
        total: issues.length
      };

      // Calcular pontuação (0-100)
      const maxPenalty = 100;
      const errorPenalty = summary.errors * 20;
      const warningPenalty = summary.warnings * 10;
      const infoPenalty = summary.infos * 2;
      const totalPenalty = Math.min(errorPenalty + warningPenalty + infoPenalty, maxPenalty);
      const score = Math.max(0, 100 - totalPenalty);

      setValidation({
        isValidating: false,
        lastValidated: new Date(),
        issues,
        score,
        summary
      });
    } catch (error) {
      console.error('Erro durante validação customizada:', error);
      setValidation(prev => ({
        ...prev,
        isValidating: false,
        lastValidated: new Date()
      }));
    } finally {
      setIsValidating(false);
    }
  }, [enabled, isValidating, nodes, edges, diagramType, customRules]);

  // Carregar regras na inicialização
  useEffect(() => {
    refreshRules();
  }, [refreshRules]);

  // Validar automaticamente quando dados mudam
  useEffect(() => {
    if (enabled && customRules.length > 0) {
      const timeoutId = setTimeout(() => {
        validateDiagram();
      }, 500); // Debounce de 500ms

      return () => clearTimeout(timeoutId);
    }
  }, [nodes, edges, customRules, enabled, validateDiagram]);

  return {
    validation,
    validateDiagram,
    isValidating,
    customRules,
    refreshRules
  };
};

export default useCustomValidation;