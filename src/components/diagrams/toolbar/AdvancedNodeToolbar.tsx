import React, { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator, DropdownMenuLabel } from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Plus, 
  Zap, 
  Grid3X3, 
  Layers, 
  ChevronDown,
  Workflow,
  Brain,
  Users,
  Copy,
  Trash2,
  Move,
  Link,
  Unlink,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  RotateCw,
  Maximize2
} from 'lucide-react';
import { useAdvancedNodeCreation } from '../hooks/useAdvancedNodeCreation';
import { NodeType, NodeCategory } from '../types';
import { useDiagramStore } from '../stores/useDiagramStore';
import { useAnnouncer } from '../hooks/useAnnouncer';
import { secureLogger } from '@/utils/secureLogger';

// ============================================================================
// Tipos e Interfaces
// ============================================================================

interface AdvancedNodeToolbarProps {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
  showLabels?: boolean;
  compactMode?: boolean;
  onNodeCreate?: (nodeType: NodeType) => void;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: () => void;
  category: NodeCategory;
  description: string;
  shortcut?: string;
}

interface ToolGroup {
  id: string;
  label: string;
  icon: React.ReactNode;
  actions: QuickAction[];
  color: string;
}

// ============================================================================
// Componente Principal
// ============================================================================

export const AdvancedNodeToolbar: React.FC<AdvancedNodeToolbarProps> = ({
  className,
  orientation = 'horizontal',
  showLabels = true,
  compactMode = false,
  onNodeCreate
}) => {
  // ============================================================================
  // Estado Local
  // ============================================================================

  const [activeGroup, setActiveGroup] = useState<string | null>(null);

  // ============================================================================
  // Hooks
  // ============================================================================

  const { document, selectedNodes, selectedEdges } = useDiagramStore();
  const { announce } = useAnnouncer();
  const {
    createNode,
    createNodeSequence,
    getTemplateByType,
    templatesByCategory
  } = useAdvancedNodeCreation();

  // ============================================================================
  // Computações
  // ============================================================================

  const currentDiagramType = document?.config?.type || 'flowchart';
  const hasSelection = selectedNodes.length > 0 || selectedEdges.length > 0;
  const hasMultipleNodes = selectedNodes.length > 1;

  // ============================================================================
  // Ações Rápidas
  // ============================================================================

  const quickActions = useMemo((): QuickAction[] => {
    const actions: QuickAction[] = [];

    // Ações de Fluxograma/BPMN
    if (currentDiagramType === 'flowchart' || currentDiagramType === 'bpmn') {
      actions.push(
        {
          id: 'start-event',
          label: 'Evento Inicial',
          icon: <div className="w-3 h-3 rounded-full bg-green-500" />,
          action: () => handleQuickCreate('start'),
          category: 'flowchart',
          description: 'Adicionar evento de início do processo',
          shortcut: 'Ctrl+1'
        },
        {
          id: 'task',
          label: 'Tarefa',
          icon: <div className="w-3 h-2 bg-blue-500 rounded-sm" />,
          action: () => handleQuickCreate('task'),
          category: 'flowchart',
          description: 'Adicionar tarefa ou atividade',
          shortcut: 'Ctrl+2'
        },
        {
          id: 'decision',
          label: 'Decisão',
          icon: <div className="w-3 h-3 bg-yellow-500 transform rotate-45" />,
          action: () => handleQuickCreate('decision'),
          category: 'flowchart',
          description: 'Adicionar ponto de decisão',
          shortcut: 'Ctrl+3'
        },
        {
          id: 'end-event',
          label: 'Evento Final',
          icon: <div className="w-3 h-3 rounded-full bg-red-500 border-2 border-red-700" />,
          action: () => handleQuickCreate('end'),
          category: 'flowchart',
          description: 'Adicionar evento de fim do processo',
          shortcut: 'Ctrl+4'
        }
      );
    }

    // Ações de Mapa Mental
    if (currentDiagramType === 'mindmap') {
      actions.push(
        {
          id: 'central-topic',
          label: 'Tópico Central',
          icon: <Brain className="h-3 w-3" />,
          action: () => handleQuickCreate('central'),
          category: 'mindmap',
          description: 'Adicionar tópico central do mapa mental',
          shortcut: 'Ctrl+1'
        },
        {
          id: 'main-topic',
          label: 'Tópico Principal',
          icon: <div className="w-3 h-2 bg-purple-500 rounded" />,
          action: () => handleQuickCreate('main'),
          category: 'mindmap',
          description: 'Adicionar tópico principal',
          shortcut: 'Ctrl+2'
        },
        {
          id: 'subtopic',
          label: 'Subtópico',
          icon: <div className="w-2 h-2 bg-indigo-500 rounded" />,
          action: () => handleQuickCreate('subtopic'),
          category: 'mindmap',
          description: 'Adicionar subtópico',
          shortcut: 'Ctrl+3'
        }
      );
    }

    // Ações de Organograma
    if (currentDiagramType === 'organogram') {
      actions.push(
        {
          id: 'ceo',
          label: 'CEO/Diretor',
          icon: <Users className="h-3 w-3" />,
          action: () => handleQuickCreate('ceo'),
          category: 'organogram',
          description: 'Adicionar posição de liderança',
          shortcut: 'Ctrl+1'
        },
        {
          id: 'manager',
          label: 'Gerente',
          icon: <div className="w-3 h-2 bg-orange-500 rounded" />,
          action: () => handleQuickCreate('manager'),
          category: 'organogram',
          description: 'Adicionar posição gerencial',
          shortcut: 'Ctrl+2'
        },
        {
          id: 'employee',
          label: 'Funcionário',
          icon: <div className="w-2 h-2 bg-gray-500 rounded" />,
          action: () => handleQuickCreate('employee'),
          category: 'organogram',
          description: 'Adicionar funcionário',
          shortcut: 'Ctrl+3'
        }
      );
    }

    return actions;
  }, [currentDiagramType]);

  // ============================================================================
  // Grupos de Ferramentas
  // ============================================================================

  const toolGroups = useMemo((): ToolGroup[] => [
    {
      id: 'creation',
      label: 'Criação',
      icon: <Plus className="h-4 w-4" />,
      actions: quickActions,
      color: 'text-blue-600'
    },
    {
      id: 'sequences',
      label: 'Sequências',
      icon: <Zap className="h-4 w-4" />,
      actions: [
        {
          id: 'basic-flow',
          label: 'Fluxo Básico',
          icon: <Workflow className="h-3 w-3" />,
          action: () => handleSequenceCreate(['start', 'task', 'end']),
          category: 'flowchart',
          description: 'Criar sequência: Início → Tarefa → Fim'
        },
        {
          id: 'decision-flow',
          label: 'Fluxo com Decisão',
          icon: <div className="w-3 h-3 bg-yellow-500 transform rotate-45" />,
          action: () => handleSequenceCreate(['start', 'task', 'decision', 'end']),
          category: 'flowchart',
          description: 'Criar fluxo com ponto de decisão'
        },
        {
          id: 'mindmap-branch',
          label: 'Ramo Mental',
          icon: <Brain className="h-3 w-3" />,
          action: () => handleSequenceCreate(['central', 'main', 'subtopic']),
          category: 'mindmap',
          description: 'Criar ramo: Central → Principal → Subtópico'
        },
        {
          id: 'org-hierarchy',
          label: 'Hierarquia',
          icon: <Users className="h-3 w-3" />,
          action: () => handleSequenceCreate(['ceo', 'manager', 'employee']),
          category: 'organogram',
          description: 'Criar hierarquia organizacional'
        }
      ],
      color: 'text-purple-600'
    },
    {
      id: 'manipulation',
      label: 'Manipulação',
      icon: <Move className="h-4 w-4" />,
      actions: [
        {
          id: 'duplicate',
          label: 'Duplicar',
          icon: <Copy className="h-3 w-3" />,
          action: () => handleDuplicate(),
          category: 'flowchart',
          description: 'Duplicar elementos selecionados',
          shortcut: 'Ctrl+D'
        },
        {
          id: 'delete',
          label: 'Excluir',
          icon: <Trash2 className="h-3 w-3" />,
          action: () => handleDelete(),
          category: 'flowchart',
          description: 'Excluir elementos selecionados',
          shortcut: 'Delete'
        },
        {
          id: 'connect',
          label: 'Conectar',
          icon: <Link className="h-3 w-3" />,
          action: () => handleConnect(),
          category: 'flowchart',
          description: 'Conectar nós selecionados',
          shortcut: 'Ctrl+L'
        },
        {
          id: 'disconnect',
          label: 'Desconectar',
          icon: <Unlink className="h-3 w-3" />,
          action: () => handleDisconnect(),
          category: 'flowchart',
          description: 'Remover conexões dos nós selecionados'
        }
      ],
      color: 'text-green-600'
    },
    {
      id: 'alignment',
      label: 'Alinhamento',
      icon: <AlignCenter className="h-4 w-4" />,
      actions: [
        {
          id: 'align-left',
          label: 'Alinhar Esquerda',
          icon: <AlignLeft className="h-3 w-3" />,
          action: () => handleAlign('left'),
          category: 'flowchart',
          description: 'Alinhar nós à esquerda'
        },
        {
          id: 'align-center',
          label: 'Alinhar Centro',
          icon: <AlignCenter className="h-3 w-3" />,
          action: () => handleAlign('center'),
          category: 'flowchart',
          description: 'Alinhar nós ao centro'
        },
        {
          id: 'align-right',
          label: 'Alinhar Direita',
          icon: <AlignRight className="h-3 w-3" />,
          action: () => handleAlign('right'),
          category: 'flowchart',
          description: 'Alinhar nós à direita'
        },
        {
          id: 'distribute',
          label: 'Distribuir',
          icon: <AlignJustify className="h-3 w-3" />,
          action: () => handleDistribute(),
          category: 'flowchart',
          description: 'Distribuir nós uniformemente'
        }
      ],
      color: 'text-orange-600'
    }
  ], [quickActions]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleQuickCreate = useCallback((nodeType: NodeType) => {
    const template = getTemplateByType(nodeType);
    if (!template) return;

    const node = createNode(nodeType, {
      validatePlacement: true,
      snapToGrid: true
    });

    if (node && onNodeCreate) {
      onNodeCreate(nodeType);
    }

    announce(`${template.label} adicionado`);
    secureLogger.info('Nó criado via toolbar', { nodeType, template: template.label });
  }, [createNode, getTemplateByType, onNodeCreate, announce]);

  const handleSequenceCreate = useCallback((nodeTypes: NodeType[]) => {
    createNodeSequence(nodeTypes);
    announce(`Sequência de ${nodeTypes.length} nós criada`);
    secureLogger.info('Sequência criada via toolbar', { nodeTypes });
  }, [createNodeSequence, announce]);

  const handleDuplicate = useCallback(() => {
    if (!hasSelection) return;
    
    // TODO: Implementar duplicação via store
    announce(`${selectedNodes.length} nó${selectedNodes.length !== 1 ? 's' : ''} duplicado${selectedNodes.length !== 1 ? 's' : ''}`);
  }, [hasSelection, selectedNodes.length, announce]);

  const handleDelete = useCallback(() => {
    if (!hasSelection) return;
    
    // TODO: Implementar exclusão via store
    announce(`${selectedNodes.length} nó${selectedNodes.length !== 1 ? 's' : ''} excluído${selectedNodes.length !== 1 ? 's' : ''}`);
  }, [hasSelection, selectedNodes.length, announce]);

  const handleConnect = useCallback(() => {
    if (selectedNodes.length < 2) return;
    
    // TODO: Implementar conexão automática via store
    announce(`${selectedNodes.length} nós conectados`);
  }, [selectedNodes.length, announce]);

  const handleDisconnect = useCallback(() => {
    if (!hasSelection) return;
    
    // TODO: Implementar desconexão via store
    announce('Conexões removidas');
  }, [hasSelection, announce]);

  const handleAlign = useCallback((direction: 'left' | 'center' | 'right') => {
    if (!hasMultipleNodes) return;
    
    // TODO: Implementar alinhamento via store
    announce(`Nós alinhados à ${direction === 'left' ? 'esquerda' : direction === 'center' ? 'centro' : 'direita'}`);
  }, [hasMultipleNodes, announce]);

  const handleDistribute = useCallback(() => {
    if (!hasMultipleNodes) return;
    
    // TODO: Implementar distribuição via store
    announce('Nós distribuídos uniformemente');
  }, [hasMultipleNodes, announce]);

  // ============================================================================
  // Componentes Internos
  // ============================================================================

  const QuickActionButton: React.FC<{ action: QuickAction }> = ({ action }) => {
    const isDisabled = action.id.includes('duplicate') && !hasSelection;
    const isHidden = action.category !== currentDiagramType && action.category !== 'flowchart';
    
    if (isHidden) return null;

    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size={compactMode ? "sm" : "default"}
              className={cn(
                'flex items-center gap-2 h-8',
                orientation === 'vertical' && 'w-full justify-start',
                isDisabled && 'opacity-50 cursor-not-allowed'
              )}
              onClick={action.action}
              disabled={isDisabled}
            >
              {action.icon}
              {showLabels && !compactMode && (
                <span className="text-xs">{action.label}</span>
              )}
              {action.shortcut && !compactMode && (
                <Badge variant="outline" className="text-xs ml-auto">
                  {action.shortcut}
                </Badge>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side={orientation === 'vertical' ? 'right' : 'bottom'}>
            <div className="space-y-1">
              <p className="font-medium">{action.label}</p>
              <p className="text-sm text-muted-foreground">{action.description}</p>
              {action.shortcut && (
                <p className="text-xs text-muted-foreground">Atalho: {action.shortcut}</p>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const ToolGroupDropdown: React.FC<{ group: ToolGroup }> = ({ group }) => {
    const visibleActions = group.actions.filter(action => 
      action.category === currentDiagramType || action.category === 'flowchart'
    );
    
    if (visibleActions.length === 0) return null;

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size={compactMode ? "sm" : "default"}
            className={cn(
              'flex items-center gap-2 h-8',
              group.color
            )}
          >
            {group.icon}
            {showLabels && !compactMode && (
              <span className="text-xs">{group.label}</span>
            )}
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuLabel>{group.label}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {visibleActions.map(action => {
            const isDisabled = action.id.includes('duplicate') && !hasSelection;
            
            return (
              <DropdownMenuItem
                key={action.id}
                onClick={action.action}
                disabled={isDisabled}
                className="flex items-center gap-2"
              >
                {action.icon}
                <div className="flex-1">
                  <div className="font-medium">{action.label}</div>
                  <div className="text-xs text-muted-foreground">{action.description}</div>
                </div>
                {action.shortcut && (
                  <Badge variant="outline" className="text-xs">
                    {action.shortcut}
                  </Badge>
                )}
              </DropdownMenuItem>
            );
          })}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className={cn(
      'flex bg-background border border-border rounded-md p-1',
      orientation === 'vertical' ? 'flex-col w-48' : 'flex-row',
      className
    )}>
      {/* Ações Rápidas */}
      <div className={cn(
        'flex',
        orientation === 'vertical' ? 'flex-col space-y-1' : 'flex-row space-x-1'
      )}>
        {quickActions.slice(0, compactMode ? 3 : 4).map(action => (
          <QuickActionButton key={action.id} action={action} />
        ))}
      </div>

      {/* Separador */}
      {orientation === 'vertical' ? (
        <Separator className="my-2" />
      ) : (
        <Separator orientation="vertical" className="mx-2" />
      )}

      {/* Grupos de Ferramentas */}
      <div className={cn(
        'flex',
        orientation === 'vertical' ? 'flex-col space-y-1' : 'flex-row space-x-1'
      )}>
        {toolGroups.map(group => (
          <ToolGroupDropdown key={group.id} group={group} />
        ))}
      </div>

      {/* Indicador de Seleção */}
      {hasSelection && (
        <>
          {orientation === 'vertical' ? (
            <Separator className="my-2" />
          ) : (
            <Separator orientation="vertical" className="mx-2" />
          )}
          <div className="flex items-center gap-1 px-2">
            <Badge variant="secondary" className="text-xs">
              {selectedNodes.length} nó{selectedNodes.length !== 1 ? 's' : ''}
            </Badge>
            {selectedEdges.length > 0 && (
              <Badge variant="outline" className="text-xs">
                {selectedEdges.length} conexã{selectedEdges.length !== 1 ? 'ões' : 'o'}
              </Badge>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AdvancedNodeToolbar;