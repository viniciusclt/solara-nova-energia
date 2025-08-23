// ============================================================================
// Unified Node Palette - Paleta de nós unificada
// ============================================================================
// Paleta flutuante para seleção rápida de tipos de nós
// ============================================================================

import React, { memo, useState, useCallback, useMemo } from 'react';
import {
  Search,
  Grid3X3,
  Layers,
  Palette,
  ChevronDown,
  ChevronRight,
  X,
  Plus
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DiagramType, UnifiedNodeType } from '../../../types/unified-diagram';
import { cn } from '@/lib/utils';

// ============================================================================
// INTERFACES
// ============================================================================

interface UnifiedNodePaletteProps {
  diagramType: DiagramType;
  selectedNodeType?: UnifiedNodeType;
  onNodeSelect: (nodeType: UnifiedNodeType) => void;
  searchTerm?: string;
  onSearchChange?: (term: string) => void;
  categories?: string[];
  selectedCategory?: string;
  onCategoryChange?: (category: string) => void;
  className?: string;
  compact?: boolean;
}

interface NodeTypeInfo {
  type: UnifiedNodeType;
  label: string;
  description: string;
  icon: React.ReactNode;
  category: string;
  keywords: string[];
}

interface CategoryInfo {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
}

// ============================================================================
// DADOS DE CONFIGURAÇÃO
// ============================================================================

const getNodeTypes = (diagramType: DiagramType): NodeTypeInfo[] => {
  const baseTypes: NodeTypeInfo[] = [
    {
      type: 'start',
      label: 'Início',
      description: 'Evento de início do processo',
      icon: <div className="w-6 h-6 rounded-full bg-green-500 border-2 border-green-600" />,
      category: 'events',
      keywords: ['início', 'start', 'começo', 'evento']
    },
    {
      type: 'end',
      label: 'Fim',
      description: 'Evento de fim do processo',
      icon: <div className="w-6 h-6 rounded-full bg-red-500 border-4 border-red-600" />,
      category: 'events',
      keywords: ['fim', 'end', 'final', 'término']
    },
    {
      type: 'task',
      label: 'Tarefa',
      description: 'Atividade ou processo de trabalho',
      icon: <div className="w-6 h-6 bg-blue-500 border-2 border-blue-600 rounded" />,
      category: 'activities',
      keywords: ['tarefa', 'task', 'atividade', 'processo']
    },
    {
      type: 'decision',
      label: 'Decisão',
      description: 'Ponto de decisão ou gateway exclusivo',
      icon: <div className="w-6 h-6 bg-yellow-500 border-2 border-yellow-600 transform rotate-45" />,
      category: 'gateways',
      keywords: ['decisão', 'decision', 'escolha', 'gateway']
    },
    {
      type: 'gateway',
      label: 'Gateway',
      description: 'Gateway de controle de fluxo',
      icon: <div className="w-6 h-6 bg-purple-500 border-2 border-purple-600 transform rotate-45" />,
      category: 'gateways',
      keywords: ['gateway', 'controle', 'fluxo', 'paralelo']
    }
  ];

  // Adicionar tipos específicos por diagrama
  if (diagramType === 'mindmap') {
    baseTypes.push(
      {
        type: 'mindmap-root',
        label: 'Tópico Central',
        description: 'Nó raiz do mapa mental',
        icon: <div className="w-6 h-6 rounded-full bg-indigo-500 border-2 border-indigo-600" />,
        category: 'mindmap',
        keywords: ['central', 'root', 'raiz', 'principal']
      },
      {
        type: 'mindmap-branch',
        label: 'Ramo',
        description: 'Ramo principal do mapa mental',
        icon: <div className="w-6 h-6 bg-indigo-400 border-2 border-indigo-500 rounded" />,
        category: 'mindmap',
        keywords: ['ramo', 'branch', 'categoria', 'seção']
      },
      {
        type: 'mindmap-leaf',
        label: 'Folha',
        description: 'Item final do mapa mental',
        icon: <div className="w-6 h-6 bg-indigo-300 border-2 border-indigo-400 rounded-full" />,
        category: 'mindmap',
        keywords: ['folha', 'leaf', 'item', 'detalhe']
      }
    );
  }

  if (diagramType === 'organogram') {
    baseTypes.push(
      {
        type: 'org-ceo',
        label: 'CEO',
        description: 'Diretor executivo',
        icon: <div className="w-6 h-6 bg-yellow-500 border-2 border-yellow-600 rounded" />,
        category: 'hierarchy',
        keywords: ['ceo', 'diretor', 'executivo', 'presidente']
      },
      {
        type: 'org-director',
        label: 'Diretor',
        description: 'Diretor de área',
        icon: <div className="w-6 h-6 bg-blue-600 border-2 border-blue-700 rounded" />,
        category: 'hierarchy',
        keywords: ['diretor', 'director', 'área', 'departamento']
      },
      {
        type: 'org-manager',
        label: 'Gerente',
        description: 'Gerente de equipe',
        icon: <div className="w-6 h-6 bg-blue-400 border-2 border-blue-500 rounded" />,
        category: 'hierarchy',
        keywords: ['gerente', 'manager', 'equipe', 'coordenador']
      },
      {
        type: 'org-employee',
        label: 'Funcionário',
        description: 'Colaborador da empresa',
        icon: <div className="w-6 h-6 bg-blue-200 border-2 border-blue-300 rounded" />,
        category: 'hierarchy',
        keywords: ['funcionário', 'employee', 'colaborador', 'staff']
      },
      {
        type: 'org-department',
        label: 'Departamento',
        description: 'Departamento ou setor',
        icon: <div className="w-6 h-6 bg-gray-400 border-2 border-gray-500 rounded" />,
        category: 'hierarchy',
        keywords: ['departamento', 'department', 'setor', 'área']
      }
    );
  }

  return baseTypes;
};

const getCategories = (diagramType: DiagramType): CategoryInfo[] => {
  const baseCategories: CategoryInfo[] = [
    {
      id: 'events',
      label: 'Eventos',
      icon: <div className="w-4 h-4 rounded-full bg-green-500" />,
      color: 'green'
    },
    {
      id: 'activities',
      label: 'Atividades',
      icon: <Grid3X3 className="h-4 w-4" />,
      color: 'blue'
    },
    {
      id: 'gateways',
      label: 'Gateways',
      icon: <Layers className="h-4 w-4" />,
      color: 'purple'
    }
  ];

  if (diagramType === 'mindmap') {
    baseCategories.push({
      id: 'mindmap',
      label: 'Mind Map',
      icon: <Palette className="h-4 w-4" />,
      color: 'indigo'
    });
  }

  if (diagramType === 'organogram') {
    baseCategories.push({
      id: 'hierarchy',
      label: 'Hierarquia',
      icon: <Layers className="h-4 w-4" />,
      color: 'blue'
    });
  }

  return baseCategories;
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const UnifiedNodePalette: React.FC<UnifiedNodePaletteProps> = memo(({
  diagramType,
  selectedNodeType,
  onNodeSelect,
  searchTerm = '',
  onSearchChange,
  categories,
  selectedCategory,
  onCategoryChange,
  className = '',
  compact = false
}) => {
  const [internalSearchTerm, setInternalSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['events', 'activities']));

  const nodeTypes = getNodeTypes(diagramType);
  const categoryInfos = getCategories(diagramType);

  const currentSearchTerm = searchTerm || internalSearchTerm;

  const handleSearchChange = useCallback((value: string) => {
    if (onSearchChange) {
      onSearchChange(value);
    } else {
      setInternalSearchTerm(value);
    }
  }, [onSearchChange]);

  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  }, []);

  const filteredNodeTypes = useMemo(() => {
    let filtered = nodeTypes;

    // Filtrar por categoria selecionada
    if (selectedCategory) {
      filtered = filtered.filter(node => node.category === selectedCategory);
    }

    // Filtrar por termo de busca
    if (currentSearchTerm) {
      const searchLower = currentSearchTerm.toLowerCase();
      filtered = filtered.filter(node => 
        node.label.toLowerCase().includes(searchLower) ||
        node.description.toLowerCase().includes(searchLower) ||
        node.keywords.some(keyword => keyword.toLowerCase().includes(searchLower))
      );
    }

    return filtered;
  }, [nodeTypes, selectedCategory, currentSearchTerm]);

  const groupedNodeTypes = useMemo(() => {
    const groups: Record<string, NodeTypeInfo[]> = {};
    
    filteredNodeTypes.forEach(node => {
      if (!groups[node.category]) {
        groups[node.category] = [];
      }
      groups[node.category].push(node);
    });

    return groups;
  }, [filteredNodeTypes]);

  if (compact) {
    return (
      <div className={cn('unified-node-palette-compact flex flex-wrap gap-2 p-2', className)}>
        {filteredNodeTypes.map((node) => (
          <TooltipProvider key={node.type}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={selectedNodeType === node.type ? "default" : "outline"}
                  size="sm"
                  className="p-2 h-auto"
                  onClick={() => onNodeSelect(node.type)}
                >
                  {node.icon}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-center">
                  <div className="font-medium">{node.label}</div>
                  <div className="text-xs text-muted-foreground">{node.description}</div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    );
  }

  return (
    <div className={cn('unified-node-palette bg-background border rounded-lg shadow-lg', className)}>
      {/* Header */}
      <div className="p-3 border-b">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-sm">Paleta de Nós</h3>
        </div>
        
        {/* Search */}
        {onSearchChange !== undefined && (
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input
              placeholder="Buscar nós..."
              value={currentSearchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="pl-7 h-8 text-xs"
            />
          </div>
        )}

        {/* Category Filter */}
        {categories && onCategoryChange && (
          <div className="flex flex-wrap gap-1 mt-2">
            <Button
              variant={!selectedCategory ? "default" : "outline"}
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => onCategoryChange('')}
            >
              Todos
            </Button>
            {categoryInfos.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                className="h-6 px-2 text-xs"
                onClick={() => onCategoryChange(category.id)}
              >
                {category.icon}
                <span className="ml-1">{category.label}</span>
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Content */}
      <ScrollArea className="max-h-96">
        <div className="p-2 space-y-2">
          {Object.entries(groupedNodeTypes).map(([categoryId, nodes]) => {
            const categoryInfo = categoryInfos.find(c => c.id === categoryId);
            const isExpanded = expandedCategories.has(categoryId);
            
            if (!categoryInfo || nodes.length === 0) return null;

            return (
              <Collapsible
                key={categoryId}
                open={isExpanded}
                onOpenChange={() => toggleCategory(categoryId)}
              >
                <CollapsibleTrigger asChild>
                  <Button
                    variant="ghost"
                    className="w-full justify-start p-2 h-auto text-xs"
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-3 w-3 mr-1" />
                    ) : (
                      <ChevronRight className="h-3 w-3 mr-1" />
                    )}
                    {categoryInfo.icon}
                    <span className="ml-1 font-medium">{categoryInfo.label}</span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {nodes.length}
                    </Badge>
                  </Button>
                </CollapsibleTrigger>
                
                <CollapsibleContent className="space-y-1 mt-1">
                  {nodes.map((node) => (
                    <TooltipProvider key={node.type}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant={selectedNodeType === node.type ? "default" : "ghost"}
                            className="w-full justify-start p-2 h-auto text-xs"
                            onClick={() => onNodeSelect(node.type)}
                          >
                            <div className="flex items-center space-x-2">
                              {node.icon}
                              <div className="text-left">
                                <div className="font-medium">{node.label}</div>
                              </div>
                            </div>
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <div className="max-w-xs">
                            <div className="font-medium">{node.label}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {node.description}
                            </div>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
});

UnifiedNodePalette.displayName = 'UnifiedNodePalette';

export default UnifiedNodePalette;