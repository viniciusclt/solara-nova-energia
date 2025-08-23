// ============================================================================
// Action Builder - Construtor visual de ações de validação
// ============================================================================
// Interface para definir ações que serão executadas quando condições forem atendidas
// ============================================================================

import React, { useState, useCallback, useMemo } from 'react';
import {
  Plus,
  Trash2,
  Copy,
  ChevronDown,
  ChevronRight,
  Zap,
  AlertTriangle,
  Info,
  CheckCircle,
  Settings,
  Eye,
  Code
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { ValidationAction } from '../../../services/validation/CustomValidationRuleService';

// ============================================================================
// INTERFACES
// ============================================================================

interface ActionBuilderProps {
  actions: ValidationAction[];
  onChange: (actions: ValidationAction[]) => void;
  className?: string;
}

type ActionType = ValidationAction['type'];

// ============================================================================
// CONSTANTES
// ============================================================================

const ACTION_TYPES: { 
  value: ActionType; 
  label: string; 
  description: string;
  icon: React.ReactNode;
  color: string;
}[] = [
  { 
    value: 'highlight', 
    label: 'Destacar Elemento', 
    description: 'Destaca visualmente o elemento que falhou na validação',
    icon: <Eye className="h-4 w-4" />,
    color: 'bg-blue-100 text-blue-800 border-blue-200'
  },
  { 
    value: 'message', 
    label: 'Exibir Mensagem', 
    description: 'Mostra uma mensagem de erro, aviso ou informação',
    icon: <Info className="h-4 w-4" />,
    color: 'bg-green-100 text-green-800 border-green-200'
  },
  { 
    value: 'block', 
    label: 'Bloquear Ação', 
    description: 'Impede que certas ações sejam executadas no diagrama',
    icon: <AlertTriangle className="h-4 w-4" />,
    color: 'bg-red-100 text-red-800 border-red-200'
  },
  { 
    value: 'suggest', 
    label: 'Sugerir Correção', 
    description: 'Oferece sugestões automáticas para corrigir o problema',
    icon: <CheckCircle className="h-4 w-4" />,
    color: 'bg-yellow-100 text-yellow-800 border-yellow-200'
  },
  { 
    value: 'autofix', 
    label: 'Correção Automática', 
    description: 'Aplica correções automaticamente quando possível',
    icon: <Zap className="h-4 w-4" />,
    color: 'bg-purple-100 text-purple-800 border-purple-200'
  },
  { 
    value: 'custom', 
    label: 'Ação Personalizada', 
    description: 'Executa código JavaScript personalizado',
    icon: <Code className="h-4 w-4" />,
    color: 'bg-gray-100 text-gray-800 border-gray-200'
  }
];

const MESSAGE_TYPES = [
  { value: 'error', label: 'Erro', color: 'text-red-600' },
  { value: 'warning', label: 'Aviso', color: 'text-yellow-600' },
  { value: 'info', label: 'Informação', color: 'text-blue-600' },
  { value: 'success', label: 'Sucesso', color: 'text-green-600' }
];

const HIGHLIGHT_STYLES = [
  { value: 'border', label: 'Borda Colorida' },
  { value: 'background', label: 'Fundo Colorido' },
  { value: 'shadow', label: 'Sombra' },
  { value: 'pulse', label: 'Pulsação' },
  { value: 'shake', label: 'Tremor' }
];

const BLOCK_TYPES = [
  { value: 'save', label: 'Salvar Diagrama' },
  { value: 'export', label: 'Exportar Diagrama' },
  { value: 'publish', label: 'Publicar Diagrama' },
  { value: 'edit', label: 'Editar Elementos' },
  { value: 'delete', label: 'Deletar Elementos' },
  { value: 'connect', label: 'Criar Conexões' }
];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const ActionBuilder: React.FC<ActionBuilderProps> = ({
  actions,
  onChange,
  className = ''
}) => {
  // Estados
  const [expandedActions, setExpandedActions] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'visual' | 'code'>('visual');

  // ========================================================================
  // HANDLERS
  // ========================================================================

  const generateId = useCallback(() => {
    return `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const createNewAction = useCallback((): ValidationAction => {
    return {
      id: generateId(),
      type: 'message',
      message: 'Problema detectado no diagrama',
      severity: 'warning'
    };
  }, [generateId]);

  const addAction = useCallback(() => {
    const newAction = createNewAction();
    onChange([...actions, newAction]);
  }, [actions, onChange, createNewAction]);

  const updateAction = useCallback((id: string, updates: Partial<ValidationAction>) => {
    const updatedActions = actions.map(action => 
      action.id === id ? { ...action, ...updates } : action
    );
    onChange(updatedActions);
  }, [actions, onChange]);

  const removeAction = useCallback((id: string) => {
    const filteredActions = actions.filter(action => action.id !== id);
    onChange(filteredActions);
  }, [actions, onChange]);

  const duplicateAction = useCallback((id: string) => {
    const actionToDuplicate = actions.find(a => a.id === id);
    if (actionToDuplicate) {
      const duplicated = {
        ...actionToDuplicate,
        id: generateId()
      };
      onChange([...actions, duplicated]);
    }
  }, [actions, onChange, generateId]);

  const toggleActionExpansion = useCallback((actionId: string) => {
    setExpandedActions(prev => {
      const newSet = new Set(prev);
      if (newSet.has(actionId)) {
        newSet.delete(actionId);
      } else {
        newSet.add(actionId);
      }
      return newSet;
    });
  }, []);

  // ========================================================================
  // COMPUTED VALUES
  // ========================================================================

  const getActionTypeInfo = useCallback((type: ActionType) => {
    return ACTION_TYPES.find(at => at.value === type) || ACTION_TYPES[0];
  }, []);

  const generateActionCode = useCallback(() => {
    if (actions.length === 0) {
      return '// Nenhuma ação definida';
    }

    const actionStrings = actions.map(action => {
      const typeInfo = getActionTypeInfo(action.type);
      let details = '';
      
      switch (action.type) {
        case 'message':
          details = `"${action.message}" (${action.severity})`;
          break;
        case 'highlight':
          details = `estilo: ${action.style}, cor: ${action.color}`;
          break;
        case 'block':
          details = `bloquear: ${action.blockType}`;
          break;
        case 'suggest':
          details = `"${action.suggestion}"`;
          break;
        case 'autofix':
          details = `"${action.fixDescription}"`;
          break;
        case 'custom':
          details = 'código personalizado';
          break;
        default:
          details = 'configuração padrão';
      }
      
      return `// ${typeInfo.label}: ${details}`;
    });

    return actionStrings.join('\n');
  }, [actions, getActionTypeInfo]);

  // ========================================================================
  // RENDER HELPERS
  // ========================================================================

  const renderActionSpecificFields = (action: ValidationAction) => {
    switch (action.type) {
      case 'message':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-medium">Mensagem</Label>
              <Textarea
                value={action.message || ''}
                onChange={(e) => updateAction(action.id, { message: e.target.value })}
                placeholder="Digite a mensagem a ser exibida"
                rows={2}
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Tipo de Mensagem</Label>
              <Select
                value={action.severity || 'warning'}
                onValueChange={(value) => updateAction(action.id, { severity: value as ValidationAction['severity'] })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {MESSAGE_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <span className={type.color}>{type.label}</span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case 'highlight':
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs font-medium">Estilo de Destaque</Label>
                <Select
                  value={action.style || 'border'}
                  onValueChange={(value) => updateAction(action.id, { style: value })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {HIGHLIGHT_STYLES.map(style => (
                      <SelectItem key={style.value} value={style.value}>
                        {style.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium">Cor</Label>
                <Input
                  type="color"
                  value={action.color || '#ff0000'}
                  onChange={(e) => updateAction(action.id, { color: e.target.value })}
                  className="h-8 w-full"
                />
              </div>
            </div>
            <div>
              <Label className="text-xs font-medium">Duração (ms)</Label>
              <Input
                type="number"
                value={action.duration || 3000}
                onChange={(e) => updateAction(action.id, { duration: parseInt(e.target.value) })}
                placeholder="3000"
                className="h-8"
              />
            </div>
          </div>
        );

      case 'block':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-medium">Tipo de Bloqueio</Label>
              <Select
                value={action.blockType || 'save'}
                onValueChange={(value) => updateAction(action.id, { blockType: value })}
              >
                <SelectTrigger className="h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {BLOCK_TYPES.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs font-medium">Mensagem de Bloqueio</Label>
              <Input
                value={action.blockMessage || ''}
                onChange={(e) => updateAction(action.id, { blockMessage: e.target.value })}
                placeholder="Esta ação está bloqueada devido a problemas de validação"
                className="h-8"
              />
            </div>
          </div>
        );

      case 'suggest':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-medium">Sugestão</Label>
              <Textarea
                value={action.suggestion || ''}
                onChange={(e) => updateAction(action.id, { suggestion: e.target.value })}
                placeholder="Descreva a sugestão de correção"
                rows={2}
                className="text-sm"
              />
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id={`auto-apply-${action.id}`}
                checked={action.autoApply || false}
                onCheckedChange={(checked) => updateAction(action.id, { autoApply: checked })}
              />
              <Label htmlFor={`auto-apply-${action.id}`} className="text-xs">
                Aplicar automaticamente
              </Label>
            </div>
          </div>
        );

      case 'autofix':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-medium">Descrição da Correção</Label>
              <Textarea
                value={action.fixDescription || ''}
                onChange={(e) => updateAction(action.id, { fixDescription: e.target.value })}
                placeholder="Descreva o que será corrigido automaticamente"
                rows={2}
                className="text-sm"
              />
            </div>
            <div>
              <Label className="text-xs font-medium">Código de Correção</Label>
              <Textarea
                value={action.fixCode || ''}
                onChange={(e) => updateAction(action.id, { fixCode: e.target.value })}
                placeholder="// Código JavaScript para aplicar a correção"
                rows={3}
                className="text-sm font-mono"
              />
            </div>
          </div>
        );

      case 'custom':
        return (
          <div className="space-y-3">
            <div>
              <Label className="text-xs font-medium">Código Personalizado</Label>
              <Textarea
                value={action.customCode || ''}
                onChange={(e) => updateAction(action.id, { customCode: e.target.value })}
                placeholder="// Código JavaScript personalizado\nfunction customAction(diagram, node, edge) {\n  // Sua lógica aqui\n}"
                rows={4}
                className="text-sm font-mono"
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderActionForm = (action: ValidationAction) => {
    const typeInfo = getActionTypeInfo(action.type);
    const isExpanded = expandedActions.has(action.id);

    return (
      <Card key={action.id} className="border">
        <Collapsible
          open={isExpanded}
          onOpenChange={() => toggleActionExpansion(action.id)}
        >
          <CollapsibleTrigger asChild>
            <CardHeader className="cursor-pointer hover:bg-gray-50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {isExpanded ? 
                    <ChevronDown className="h-4 w-4" /> : 
                    <ChevronRight className="h-4 w-4" />
                  }
                  {typeInfo.icon}
                  <div>
                    <CardTitle className="text-sm font-medium">
                      {typeInfo.label}
                    </CardTitle>
                    <p className="text-xs text-gray-500 mt-1">
                      {typeInfo.description}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={cn('text-xs', typeInfo.color)}>
                    {action.type}
                  </Badge>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          duplicateAction(action.id);
                        }}
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Duplicar ação</p>
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
                          removeAction(action.id);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Remover ação</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </CardHeader>
          </CollapsibleTrigger>
          
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              <div>
                <Label className="text-xs font-medium">Tipo de Ação</Label>
                <Select
                  value={action.type}
                  onValueChange={(value) => updateAction(action.id, { type: value as ActionType })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ACTION_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          {type.icon}
                          <div>
                            <div className="font-medium">{type.label}</div>
                            <div className="text-xs text-gray-500">{type.description}</div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {renderActionSpecificFields(action)}

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
          <h3 className="text-sm font-medium">Ações de Validação</h3>
          <p className="text-xs text-gray-500">
            {actions.length} ação(ões) definida(s)
          </p>
        </div>
        <Button size="sm" onClick={addAction}>
          <Plus className="h-4 w-4 mr-2" />
          Adicionar Ação
        </Button>
      </div>

      {actions.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <Zap className="h-8 w-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 text-center">
              Nenhuma ação definida.
              <br />
              Clique em "Adicionar Ação" para começar.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {actions.map(renderActionForm)}
        </div>
      )}
    </div>
  );

  const renderCodeMode = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">Código das Ações</h3>
          <p className="text-xs text-gray-500">
            Visualização em código das ações definidas
          </p>
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <pre className="text-xs bg-gray-50 p-3 rounded overflow-x-auto">
            <code>{generateActionCode()}</code>
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
            <span className="text-sm font-medium">Construtor de Ações</span>
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

export default ActionBuilder;