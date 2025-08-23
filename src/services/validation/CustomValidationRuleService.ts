// ============================================================================
// Custom Validation Rule Service - Serviço de regras de validação customizáveis
// ============================================================================
// Permite criar, editar e gerenciar regras de validação personalizadas
// ============================================================================

import { localDatabase } from '../localDatabase';
import {
  UnifiedDiagramDocument,
  DiagramType
} from '../../types/unified-diagram';
import { ValidationIssue } from '../../components/diagrams/panels/ValidationPanel';

// ============================================================================
// INTERFACES
// ============================================================================

export interface CustomValidationRule {
  id: string;
  name: string;
  description: string;
  category: 'structure' | 'bpmn' | 'connectivity' | 'labeling' | 'performance' | 'custom';
  severity: 'error' | 'warning' | 'info';
  diagramTypes: DiagramType[];
  enabled: boolean;
  conditions: ValidationCondition[];
  actions: ValidationAction[];
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
}

export interface ValidationCondition {
  id: string;
  type: 'nodeCount' | 'edgeCount' | 'nodeType' | 'edgeType' | 'nodeProperty' | 'edgeProperty' | 'connectivity' | 'pattern' | 'custom';
  operator: 'equals' | 'notEquals' | 'greaterThan' | 'lessThan' | 'contains' | 'notContains' | 'matches' | 'notMatches';
  value: string | number | boolean;
  target?: 'nodes' | 'edges' | 'specific_node' | 'specific_edge';
  nodeType?: string;
  edgeType?: string;
  property?: string;
}

export interface ValidationAction {
  id: string;
  type: 'highlight' | 'message' | 'block' | 'suggest' | 'autofix';
  message?: string;
  severity?: 'error' | 'warning' | 'info';
  suggestions?: string[];
  autoFixable?: boolean;
  fixFunction?: string; // JavaScript code for auto-fix
  highlightColor?: string;
  blockActions?: string[];
}

export interface CustomValidationRuleSet {
  id: string;
  name: string;
  description: string;
  rules: string[]; // Rule IDs
  diagramTypes: DiagramType[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// SERVIÇO PRINCIPAL
// ============================================================================

class CustomValidationRuleService {
  private readonly tableName = 'custom_validation_rules';
  private readonly ruleSetTableName = 'custom_validation_rule_sets';

  // ========================================================================
  // CRUD OPERATIONS - RULES
  // ========================================================================

  /**
   * Cria uma nova regra de validação customizada
   */
  async createRule(rule: Omit<CustomValidationRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomValidationRule> {
    const now = new Date().toISOString();
    const newRule: CustomValidationRule = {
      ...rule,
      id: `custom_rule_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now
    };

    await localDatabase.insert(this.tableName, newRule);
    return newRule;
  }

  /**
   * Atualiza uma regra existente
   */
  async updateRule(id: string, updates: Partial<CustomValidationRule>): Promise<CustomValidationRule> {
    const updatedRule = {
      ...updates,
      id,
      updatedAt: new Date().toISOString()
    };

    await localDatabase.update(this.tableName, id, updatedRule);
    return await this.getRuleById(id);
  }

  /**
   * Busca regra por ID
   */
  async getRuleById(id: string): Promise<CustomValidationRule> {
    const rule = await localDatabase.findById(this.tableName, id);
    if (!rule) {
      throw new Error(`Regra de validação não encontrada: ${id}`);
    }
    return rule as CustomValidationRule;
  }

  /**
   * Lista todas as regras
   */
  async getAllRules(): Promise<CustomValidationRule[]> {
    return await localDatabase.findAll(this.tableName) as CustomValidationRule[];
  }

  /**
   * Lista regras por tipo de diagrama
   */
  async getRulesByDiagramType(diagramType: DiagramType): Promise<CustomValidationRule[]> {
    const allRules = await this.getAllRules();
    return allRules.filter(rule => 
      rule.enabled && rule.diagramTypes.includes(diagramType)
    );
  }

  /**
   * Lista regras por categoria
   */
  async getRulesByCategory(category: CustomValidationRule['category']): Promise<CustomValidationRule[]> {
    const allRules = await this.getAllRules();
    return allRules.filter(rule => rule.enabled && rule.category === category);
  }

  /**
   * Remove uma regra
   */
  async deleteRule(id: string): Promise<void> {
    await localDatabase.delete(this.tableName, id);
  }

  // ========================================================================
  // CRUD OPERATIONS - RULE SETS
  // ========================================================================

  /**
   * Cria um novo conjunto de regras
   */
  async createRuleSet(ruleSet: Omit<CustomValidationRuleSet, 'id' | 'createdAt' | 'updatedAt'>): Promise<CustomValidationRuleSet> {
    const now = new Date().toISOString();
    const newRuleSet: CustomValidationRuleSet = {
      ...ruleSet,
      id: `rule_set_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      createdAt: now,
      updatedAt: now
    };

    await localDatabase.insert(this.ruleSetTableName, newRuleSet);
    return newRuleSet;
  }

  /**
   * Lista todos os conjuntos de regras
   */
  async getAllRuleSets(): Promise<CustomValidationRuleSet[]> {
    return await localDatabase.findAll(this.ruleSetTableName) as CustomValidationRuleSet[];
  }

  /**
   * Busca conjunto de regras por ID
   */
  async getRuleSetById(id: string): Promise<CustomValidationRuleSet> {
    const ruleSet = await localDatabase.findById(this.ruleSetTableName, id);
    if (!ruleSet) {
      throw new Error(`Conjunto de regras não encontrado: ${id}`);
    }
    return ruleSet as CustomValidationRuleSet;
  }

  // ========================================================================
  // VALIDATION EXECUTION
  // ========================================================================

  /**
   * Executa validação usando regras customizadas
   */
  async validateWithCustomRules(
    document: UnifiedDiagramDocument,
    ruleIds?: string[]
  ): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];
    
    let rulesToExecute: CustomValidationRule[];
    
    if (ruleIds) {
      // Executar regras específicas
      rulesToExecute = await Promise.all(
        ruleIds.map(id => this.getRuleById(id))
      );
    } else {
      // Executar todas as regras aplicáveis
      rulesToExecute = await this.getRulesByDiagramType(document.type);
    }

    for (const rule of rulesToExecute) {
      try {
        const ruleIssues = await this.executeRule(rule, document);
        issues.push(...ruleIssues);
      } catch (error) {
        console.error(`Erro ao executar regra ${rule.id}:`, error);
        issues.push({
          id: `rule_error_${rule.id}`,
          type: 'error',
          severity: 'high',
          category: 'custom',
          title: 'Erro na Regra de Validação',
          description: `Erro ao executar regra "${rule.name}": ${error}`,
          autoFixable: false
        });
      }
    }

    return issues;
  }

  /**
   * Executa uma regra específica
   */
  private async executeRule(
    rule: CustomValidationRule,
    document: UnifiedDiagramDocument
  ): Promise<ValidationIssue[]> {
    const issues: ValidationIssue[] = [];

    // Verificar se todas as condições são atendidas
    const conditionsMet = await this.evaluateConditions(rule.conditions, document);
    
    if (conditionsMet) {
      // Executar ações da regra
      for (const action of rule.actions) {
        if (action.type === 'message') {
          issues.push({
            id: `${rule.id}_${Date.now()}`,
            type: rule.severity,
            severity: this.mapSeverityToLevel(rule.severity),
            category: rule.category,
            title: rule.name,
            description: action.message || rule.description,
            suggestions: action.suggestions,
            autoFixable: action.autoFixable || false
          });
        }
      }
    }

    return issues;
  }

  /**
   * Avalia condições da regra
   */
  private async evaluateConditions(
    conditions: ValidationCondition[],
    document: UnifiedDiagramDocument
  ): Promise<boolean> {
    for (const condition of conditions) {
      const result = await this.evaluateCondition(condition, document);
      if (!result) {
        return false; // Todas as condições devem ser verdadeiras
      }
    }
    return true;
  }

  /**
   * Avalia uma condição específica
   */
  private async evaluateCondition(
    condition: ValidationCondition,
    document: UnifiedDiagramDocument
  ): Promise<boolean> {
    const { type, operator, value, target, nodeType, edgeType, property } = condition;

    switch (type) {
      case 'nodeCount':
        return this.compareValues(document.nodes.length, operator, value);
      
      case 'edgeCount':
        return this.compareValues(document.edges.length, operator, value);
      
      case 'nodeType':
        const nodeCount = document.nodes.filter(node => node.type === nodeType).length;
        return this.compareValues(nodeCount, operator, value);
      
      case 'edgeType':
        const edgeCount = document.edges.filter(edge => edge.type === edgeType).length;
        return this.compareValues(edgeCount, operator, value);
      
      case 'nodeProperty':
        if (!property) return false;
        const nodesWithProperty = document.nodes.filter(node => {
          const nodeData = node.data as any;
          return nodeData && nodeData[property] !== undefined;
        });
        return this.compareValues(nodesWithProperty.length, operator, value);
      
      case 'edgeProperty':
        if (!property) return false;
        const edgesWithProperty = document.edges.filter(edge => {
          const edgeData = edge.data as any;
          return edgeData && edgeData[property] !== undefined;
        });
        return this.compareValues(edgesWithProperty.length, operator, value);
      
      case 'connectivity':
        // Check if all nodes are connected
        const isolatedNodes = document.nodes.filter(node => {
          const hasConnections = document.edges.some(edge => 
            edge.source === node.id || edge.target === node.id
          );
          return !hasConnections;
        });
        return this.compareValues(isolatedNodes.length, operator, value);
      
      case 'pattern':
        return this.evaluateLabelPattern(condition, document);
      
      case 'custom':
        // TODO: Implement safe JavaScript evaluation
        return true;
      
      default:
        console.warn(`Tipo de condição não suportado: ${type}`);
        return true;
    }
  }

  /**
   * Compara valores usando operador
   */
  private compareValues(
    actual: any,
    operator: ValidationCondition['operator'],
    expected: any
  ): boolean {
    switch (operator) {
      case 'equals':
        return actual === expected;
      case 'notEquals':
        return actual !== expected;
      case 'greaterThan':
        return actual > expected;
      case 'lessThan':
        return actual < expected;
      case 'contains':
        return String(actual).includes(String(expected));
      case 'notContains':
        return !String(actual).includes(String(expected));
      case 'matches':
        return new RegExp(String(expected)).test(String(actual));
      case 'notMatches':
        return !new RegExp(String(expected)).test(String(actual));
      default:
        return false;
    }
  }

  /**
   * Avalia padrões de rótulo
   */
  private evaluateLabelPattern(
    condition: ValidationCondition,
    document: UnifiedDiagramDocument
  ): boolean {
    const labels = document.nodes.map(n => n.data.label || '').filter(Boolean);
    
    switch (condition.operator) {
      case 'contains':
        return labels.some(label => label.includes(String(condition.value)));
      case 'matches':
        const regex = new RegExp(String(condition.value));
        return labels.some(label => regex.test(label));
      default:
        return false;
    }
  }

  /**
   * Mapeia severidade para nível
   */
  private mapSeverityToLevel(severity: 'error' | 'warning' | 'info'): 'critical' | 'high' | 'medium' | 'low' {
    switch (severity) {
      case 'error':
        return 'critical';
      case 'warning':
        return 'medium';
      case 'info':
        return 'low';
      default:
        return 'low';
    }
  }

  // ========================================================================
  // TEMPLATE RULES
  // ========================================================================

  /**
   * Cria regras padrão do sistema
   */
  async createDefaultRules(): Promise<void> {
    const defaultRules: Omit<CustomValidationRule, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'Limite de Nós',
        description: 'Diagrama não deve ter mais de 50 nós para manter legibilidade',
        category: 'performance',
        severity: 'warning',
        diagramTypes: ['flowchart', 'mindmap', 'organogram'],
        enabled: true,
        conditions: [{
          id: 'node_count_condition',
          type: 'nodeCount',
          operator: 'greaterThan',
          value: 50
        }],
        actions: [{
          id: 'node_count_action',
          type: 'message',
          message: 'Diagrama tem muitos nós. Considere dividir em sub-diagramas.',
          suggestions: ['Dividir em múltiplos diagramas', 'Agrupar nós relacionados']
        }]
      },
      {
        name: 'Rótulos Obrigatórios',
        description: 'Todos os nós devem ter rótulos descritivos',
        category: 'labeling',
        severity: 'warning',
        diagramTypes: ['flowchart', 'mindmap', 'organogram'],
        enabled: true,
        conditions: [{
          id: 'empty_label_condition',
          type: 'pattern',
          operator: 'matches',
          value: '^\\s*$' // Regex para strings vazias ou só espaços
        }],
        actions: [{
          id: 'empty_label_action',
          type: 'message',
          message: 'Nós sem rótulo encontrados. Adicione descrições claras.',
          suggestions: ['Adicionar rótulos descritivos', 'Remover nós desnecessários']
        }]
      }
    ];

    for (const rule of defaultRules) {
      try {
        await this.createRule(rule);
      } catch (error) {
        console.error('Erro ao criar regra padrão:', error);
      }
    }
  }
}

// ============================================================================
// EXPORT
// ============================================================================

export const customValidationRuleService = new CustomValidationRuleService();
export default customValidationRuleService;