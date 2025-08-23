// ============================================================================
// Condition Builder - Construtor visual de condições de validação
// ============================================================================
// Interface drag-and-drop para criar condições complexas de validação
// ============================================================================

import React, { useState, useCallback, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Move,
  Copy,
  ChevronDown,
  ChevronRight,
  Filter,
  Code,
  Eye,
  Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ValidationCondition } from '../../../services/validation/CustomValidationRuleService';
import { DiagramType } from '../../../types/unified-diagram';

// ============================================================================
// INTERFACES
// ============================================================================

interface ConditionBuilderProps {
  conditions: ValidationCondition[];
  onChange: (conditions: ValidationCondition[]) => void;
  diagramTypes?: DiagramType[];
  className?: string;
}

interface ConditionGroup {
  id: string;
  operator: 'AND' | 'OR';
  conditions: ValidationCondition[];
  nested?: ConditionGroup[];
}

type ConditionType = ValidationCondition['type'];
type ConditionOperator = ValidationCondition['operator'];

// ============================================================================
// CONSTANTES
// ============================================================================

const CONDITION_TYPES: { value: ConditionType; label: string; description: string }[] = [
  { value: 'nodeCount', label: 'Contagem de Nós', description: 'Valida o número total de nós no diagrama' },
  { value: 'edgeCount', label: 'Contagem de Arestas', description: 'Valida o número total de arestas no diagrama' },
  { value: 'nodeType', label: 'Tipo de Nó', description: 'Valida tipos específicos de nós' },
  { value: 'edgeType', label: 'Tipo de Aresta', description: 'Valida tipos específicos de arestas' },
  { value: 'nodeProperty', label: 'Propriedade do Nó', description: 'Valida propriedades específicas dos nós' },
  { value: 'edgeProperty', label: 'Propriedade da Aresta', description: 'Valida propriedades específicas das arestas' },
  { value: 'connectivity', label: 'Conectividade', description: 'Valida conexões entre nós' },
  { value: 'pattern', label: 'Padrão', description: 'Valida padrões específicos no diagrama' },
  { value: 'custom', label: 'Personalizada', description: 'Condição personalizada com código JavaScript' }
];

const OPERATORS: { value: ConditionOperator; label: string; numeric: boolean }[] = [
  { value: 'equals', label: 'Igual a', numeric: false },
  { value: 'notEquals', label: 'Diferente de', numeric: false },
  { value: 'contains', label: 'Contém', numeric: false },
  { value: 'notContains', label: 'Não contém', numeric: false },
  { value: 'startsWith', label: 'Inicia com', numeric: false },
  { value: 'endsWith', label: 'Termina com', numeric: false },
  { value: 'greaterThan', label: 'Maior que', numeric: true },
  { value: 'lessThan', label: 'Menor que', numeric: true },
  { value: 'greaterThanOrEqual', label: 'Maior ou igual a', numeric: true },
  { value: 'lessThanOrEqual', label: 'Menor ou igual a', numeric: true },
  { value: 'between', label: 'Entre', numeric: true },
  { value: 'notBetween', label: 'Não entre', numeric: true },
  { value: 'exists', label: 'Existe', numeric: false },
  { value: 'notExists', label: 'Não existe', numeric: false },
  { value: 'isEmpty', label: 'Está vazio', numeric: false },
  { value: 'isNotEmpty', label: 'Não está vazio', numeric: false }
];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const ConditionBuilder: React.FC<ConditionBuilderProps> = ({
  conditions,
  onChange,
  diagramTypes = [],
  className = ''
}) => {
  // Estados
  const [expandedConditions, setExpandedConditions] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'visual' | 'code'>('visual');

  // ========================================================================
  // HANDLERS
  // ========================================================================

  const generateId = useCallback(() => {
    return `condition_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const createNewCondition = useCallback((): ValidationCondition => {
    return {
      id: generateId(),
      type: 'nodeCount',
      operator: 'greaterThan',
      value: '0',
      property: '',
      target: 'diagram'
    };
  }, [generateId]);

  const addCondition = useCallback(() => {
    const newCondition = createNewCondition();
    onChange([...conditions, newCondition]);
  }, [conditions, onChange, createNewCondition]);

  const updateCondition = useCallback((id: string, updates: Partial<ValidationCondition>) => {
    const updatedConditions = conditions.map(condition => 
      condition.id === id ? { ...condition, ...updates } : condition
    );
    onChange(updatedConditions);
  }, [conditions, onChange]);

  const removeCondition = useCallback((id: string) => {
    const filteredConditions = conditions.filter(condition => condition.id !== id);
    onChange(filteredConditions);
  }, [conditions, onChange]);

  const duplicateCondition = useCallback((id: string) => {
    const conditionToDuplicate = conditions.find(c => c.id === id);
    if (conditionToDuplicate) {
      const duplicated = {
        ...conditionToDuplicate,
        id: generateId()
      };
      onChange([...conditions, duplicated]);
    }
  }, [conditions, onChange, generateId]);

  const toggleConditionExpansion = useCallback((conditionId: string) => {
    setExpandedConditions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(conditionId)) {
        newSet.delete(conditionId);
      } else {
        newSet.add(conditionId);
      }
      return newSet;
    });
  }, []);

  // ========================================================================
  // COMPUTED VALUES
  // ========================================================================

  const getConditionTypeInfo = useCallback((type: ConditionType) => {
    return CONDITION_TYPES.find(ct => ct.value === type) || CONDITION_TYPES[0];
  }, []);

  const getOperatorInfo = useCallback((operator: ConditionOperator) => {
    return OPERATORS.find(op => op.value === operator) || OPERATORS[0];
  }, []);

  const getAvailableOperators = useCallback((type: ConditionType) => {
    const numericTypes = ['nodeCount', 'edgeCount'];
    const isNumeric = numericTypes.includes(type);
    
    if (isNumeric) {
      return OPERATORS.filter(op => op.numeric || ['equals', 'notEquals', 'exists', 'notExists'].includes(op.value));
    }
    
    return OPERATORS.filter(op => !op.numeric || ['equals', 'notEquals'].includes(op.value));
  }, []);

  const generateConditionCode = useCallback(() => {
    if (conditions.length === 0) {
      return '// Nenhuma condição definida';
    }

    const conditionStrings = conditions.map(condition => {
      const typeInfo = getConditionTypeInfo(condition.type);
      const operatorInfo = getOperatorInfo(condition.operator);
      
      return `// ${typeInfo.label} ${operatorInfo.label} "${condition.value}"`;
    });

    return conditionStrings.join('\n');
  }, [conditions, getConditionTypeInfo, getOperatorInfo]);

  // ========================================================================
  // RENDER HELPERS
  // ========================================================================

  const renderConditionForm = (condition: ValidationCondition) => {
    const typeInfo = getConditionTypeInfo(condition.type);
    const availableOperators = getAvailableOperators(condition.type);
    const isExpanded = expandedConditions.has(condition.id);

    return (
      <Card key={condition.id} className="border">
        <Collapsible
          open={isExpanded}
          onOpenChange={() => toggleConditionExpansion(condition.id)}
        >
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isExpanded ? 
                    <ChevronDown className="h-4 w-4" /> : 
                    <ChevronRight className="h-4 w-4" />
                  }
                  <Filter className="h-4 w-4 text-blue-500" />
                  <div>
                    <CardTitle className="text-sm font-medium">
                      {typeInfo.label}
                    </CardTitle>
                    <p className="text-xs text-gray-500 mt-1">
                      {getOperatorInfo(condition.operator).label} "{condition.value}"
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {condition.target}
                  </Badge>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateCondition(condition.id);
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Duplicar condição</p>
                    </TooltipContent>
                  </Tooltip>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeCondition(condition.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Remover condição</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium">Tipo de Condição</Label>
                  <Select
                    value={condition.type}
                    onValueChange={(value) => updateCondition(condition.id, { type: value as ConditionType })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CONDITION_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-gray-500">{type.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label className="text-xs font-medium">Operador</Label>
                  <Select
                    value={condition.operator}
                    onValueChange={(value) => updateCondition(condition.id, { operator: value as ConditionOperator })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableOperators.map(operator => (
                        <SelectItem key={operator.value} value={operator.value}>
                          {operator.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs font-medium">Valor</Label>
                  <Input
                    value={condition.value}
                    onChange={(e) => updateCondition(condition.id, { value: e.target.value })}
                    placeholder="Valor da condição"
                    className="h-8"
                  />
                </div>
                
                {(condition.type === 'nodeProperty' || condition.type === 'edgeProperty') && (
                  <div>
                    <Label className="text-xs font-medium">Propriedade</Label>
                    <Input
                      value={condition.property || ''}
                      onChange={(e) => updateCondition(condition.id, { property: e.target.value })}
                      placeholder="Nome da propriedade"
                      className="h-8"
                    />
                  </div>
                )}
                
                <div>
                  <Label className="text-xs font-medium">Alvo</Label>
                  <Select
                    value={condition.target}
                    onValueChange={(value) => updateCondition(condition.id, { target: value as ValidationCondition['target'] })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="diagram">Diagrama</SelectItem>
                      <SelectItem value="node">Nó</SelectItem>
                      <SelectItem value="edge">Aresta</SelectItem>
                      <SelectItem value="selection">Seleção</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="text-xs text-gray-600 bg-gray-50 p-2 rounded">
                <strong>Descrição:</strong> {typeInfo.description}
              </div>
            </CardContent>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    );
  };

  const renderVisualMode = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Condições de Validação</h3>
          <p className="text-xs text-gray-500">
            {conditions.length} condição(ões) definida(s)
          </p>
        </div>
        <Button size="sm" onClick={addCondition}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Condição
        </Button>
      </div>

      {conditions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Filter className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 text-center">
              Nenhuma condição definida.
              <br />
              Clique em "Adicionar Condição" para começar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {conditions.map(renderConditionForm)}
        </div>
      )}
    </div>
  );

  const renderCodeMode = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Código das Condições</h3>
          <p className="text-xs text-gray-500">
            Visualização em código das condições definidas
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
            <code>{generateConditionCode()}</code>
          </pre>
        </CardContent>
      </Card>
    </div>
  );

  // ========================================================================
  // RENDER PRINCIPAL
  // ========================================================================

  return (
    <TooltipProvider>
      <div className={cn('space-y-4', className)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            <span className="text-sm font-medium">Construtor de Condições</span>
          </div>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant={viewMode === 'visual' ? 'default' : 'outline'}
              onClick={() => setViewMode('visual')}
            >
              <Eye className="h-3 w-3 mr-1" />
              Visual
            </Button>
            <Button
              size="sm"
              variant={viewMode === 'code' ? 'default' : 'outline'}
              onClick={() => setViewMode('code')}
            >
              <Code className="h-3 w-3 mr-1" />
              Código
            </Button>
          </div>
        </div>

        {viewMode === 'visual' ? renderVisualMode() : renderCodeMode()}
      </div>
    </TooltipProvider>
  );
};

export default ConditionBuilder;