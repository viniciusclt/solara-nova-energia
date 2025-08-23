// ============================================================================
// DiagramPalette - Paleta de nós para drag-and-drop
// ============================================================================

import React, { useState, useCallback, useMemo, useEffect, useRef, memo } from 'react';
import {
  Play,
  Square,
  Diamond,
  StopCircle,
  FileText,
  Database,
  Circle,
  Hexagon,
  Brain,
  GitBranch,
  Leaf,
  Users,
  User,
  Building,
  Crown,
  ChevronDown,
  ChevronRight,
  Search,
  MessageSquare,
  Merge,
  CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { secureLogger } from '@/utils/secureLogger';
import {
  DiagramPaletteProps,
  NodeCategory,
  DiagramType,
  NodeType
} from '../types';
import { useDiagramStore, useDiagramEditor } from '../stores/useDiagramStore';
import {
  useKeyboardNavigation,
  useFocusManagement,
  useAnnouncer
} from '../accessibility';
import { nodeFactory, getNodeTypesByCategory } from '../factories/nodeFactory';

// ============================================================================
// Definições de Nós por Categoria
// ============================================================================

interface NodeDefinition {
  type: NodeType;
  label: string;
  icon: React.ReactNode;
  description: string;
  category: NodeCategory;
  diagramTypes: DiagramType[];
  defaultData?: Record<string, unknown>;
}

// Função para gerar definições de nós dinamicamente usando nodeFactory
const generateNodeDefinitions = (): NodeDefinition[] => {
  const definitions: NodeDefinition[] = [];
  
  // Fluxograma - Nós especializados
  const flowchartTypes = getNodeTypesByCategory('flowchart');
  flowchartTypes.forEach(type => {
    const config = nodeFactory.getNodeConfig(type);
    if (config) {
      definitions.push({
        type,
        label: config.label,
        icon: getIconForNodeType(type),
        description: config.description || `Nó de ${config.label}`,
        category: 'flowchart',
        diagramTypes: ['flowchart'],
        defaultData: config.defaultData
      });
    }
  });
  
  // Mapa Mental - Nós especializados
  const mindmapTypes = getNodeTypesByCategory('mindmap');
  mindmapTypes.forEach(type => {
    const config = nodeFactory.getNodeConfig(type);
    if (config) {
      definitions.push({
        type,
        label: config.label,
        icon: getIconForNodeType(type),
        description: config.description || `Nó de ${config.label}`,
        category: 'mindmap',
        diagramTypes: ['mindmap'],
        defaultData: config.defaultData
      });
    }
  });
  
  // Organograma - Nós especializados
  const organogramTypes = getNodeTypesByCategory('organogram');
  organogramTypes.forEach(type => {
    const config = nodeFactory.getNodeConfig(type);
    if (config) {
      definitions.push({
        type,
        label: config.label,
        icon: getIconForNodeType(type),
        description: config.description || `Nó de ${config.label}`,
        category: 'organogram',
        diagramTypes: ['organogram'],
        defaultData: config.defaultData
      });
    }
  });
  
  return definitions;
};

// Função auxiliar para obter ícones baseados no tipo de nó
const getIconForNodeType = (type: NodeType): React.ReactNode => {
  const iconMap: Record<string, React.ReactNode> = {
    // Fluxograma - Novos tipos BPMN
    'flowchart-start': <Play className="h-4 w-4" />,
    'flowchart-process': <Square className="h-4 w-4" />,
    'flowchart-decision': <Diamond className="h-4 w-4" />,
    'flowchart-end': <CheckCircle className="h-4 w-4" />,
    'flowchart-data': <Database className="h-4 w-4" />,
    'flowchart-document': <FileText className="h-4 w-4" />,
    'flowchart-subprocess': <Hexagon className="h-4 w-4" />,
    'flowchart-connector': <Circle className="h-4 w-4" />,
    'flowchart-annotation': <MessageSquare className="h-4 w-4" />,
    'flowchart-parallel': <GitBranch className="h-4 w-4" />,
    'flowchart-inclusive': <Merge className="h-4 w-4" />,
    
    // Fluxograma - Tipos legados (compatibilidade)
    'startNode': <Play className="h-4 w-4" />,
    'processNode': <Square className="h-4 w-4" />,
    'decisionNode': <Diamond className="h-4 w-4" />,
    'endNode': <StopCircle className="h-4 w-4" />,
    'documentNode': <FileText className="h-4 w-4" />,
    'dataNode': <Database className="h-4 w-4" />,
    'connectorNode': <Circle className="h-4 w-4" />,
    'subprocessNode': <Hexagon className="h-4 w-4" />,
    'flowchartNode': <Square className="h-4 w-4" />,
    
    // Mapa Mental
    'mindmap-root': <Brain className="h-4 w-4" />,
    'mindmap-branch': <GitBranch className="h-4 w-4" />,
    'mindmap-leaf': <Leaf className="h-4 w-4" />,
    'mindMapRoot': <Brain className="h-4 w-4" />,
    'mindMapBranch': <GitBranch className="h-4 w-4" />,
    'mindMapLeaf': <Leaf className="h-4 w-4" />,
    'mindMapNode': <Brain className="h-4 w-4" />,
    
    // Organograma
    'organogram-executive': <Crown className="h-4 w-4" />,
    'organogram-manager': <Users className="h-4 w-4" />,
    'organogram-employee': <User className="h-4 w-4" />,
    'organogram-department': <Building className="h-4 w-4" />,
    'orgExecutive': <Crown className="h-4 w-4" />,
    'orgManager': <Users className="h-4 w-4" />,
    'orgEmployee': <User className="h-4 w-4" />,
    'orgDepartment': <Building className="h-4 w-4" />,
    'organogramNode': <Users className="h-4 w-4" />
  };
  
  return iconMap[type] || <Square className="h-4 w-4" />;
};

const NODE_DEFINITIONS: NodeDefinition[] = generateNodeDefinitions();

// ============================================================================
// Configurações de Categorias
// ============================================================================

interface CategoryConfig {
  id: NodeCategory;
  label: string;
  icon: React.ReactNode;
  color: string;
}

const CATEGORY_CONFIGS: CategoryConfig[] = [
  {
    id: 'flowchart',
    label: 'Fluxograma',
    icon: <Diamond className="h-4 w-4" />,
    color: 'bg-blue-100 text-blue-800'
  },
  {
    id: 'mindmap',
    label: 'Mapa Mental',
    icon: <Brain className="h-4 w-4" />,
    color: 'bg-green-100 text-green-800'
  },
  {
    id: 'organogram',
    label: 'Organograma',
    icon: <Users className="h-4 w-4" />,
    color: 'bg-purple-100 text-purple-800'
  }
];

// ============================================================================
// Componente Principal
// ============================================================================

export const DiagramPalette: React.FC<DiagramPaletteProps> = memo(({
  category,
  nodeTypes = [],
  className,
  style,
  collapsible = true,
  defaultCollapsed = false,
  searchable = true,
  filterable = true,
  groupByCategory = true,
  showPreviews = false,
  showDescriptions = true,
  dragAndDrop = true,
  onNodeSelect,
  onNodeDragStart,
  onNodeDragEnd,
  onCategoryChange,
  onSearch,
  onFilter
}) => {
  // ============================================================================
  // Estado Local
  // ============================================================================

  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<NodeCategory>>(
    defaultCollapsed ? new Set() : new Set(['flowchart', 'mindmap', 'organogram'])
  );
  const [activeFilters, setActiveFilters] = useState<Record<string, unknown>>({});
  const paletteRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ============================================================================
  // Store
  // ============================================================================

  const { diagramType, addNode } = useDiagramStore();
  
  // ============================================================================
  // Hooks de Acessibilidade
  // ============================================================================
  
  const { announce } = useAnnouncer();
  
  const {
    handleKeyDown: handleAccessibleKeyDown,
    focusedElementId,
    navigateToNext,
    navigateToPrevious
  } = useKeyboardNavigation({
    elements: filteredNodes.map(node => ({
      id: `node-${node.type}`,
      type: 'node',
      data: node
    })),
    onAction: (action, elementId) => {
      const nodeType = elementId.replace('node-', '');
      const node = filteredNodes.find(n => n.type === nodeType);
      if (node) {
        switch (action) {
          case 'select':
            handleNodeClick(node);
            announce(`Nó ${node.label} selecionado`);
            break;
          case 'focus':
            announce(`Focado em ${node.label}`);
            break;
        }
      }
    }
  });
  
  const {
    registerFocusable,
    unregisterFocusable,
    setFocus
  } = useFocusManagement();

  // ============================================================================
  // Filtros e Agrupamentos
  // ============================================================================

  // Combinar definições internas com nodeTypes externos
  const allNodeDefinitions = useMemo(() => {
    const externalNodes: NodeDefinition[] = nodeTypes.map(nodeType => ({
      type: nodeType.type as NodeType,
      label: nodeType.label,
      icon: nodeType.icon || <Square className="h-4 w-4" />,
      description: nodeType.description || '',
      category: nodeType.category as NodeCategory,
      diagramTypes: [diagramType],
      defaultData: nodeType.data || {}
    }));
    
    return [...NODE_DEFINITIONS, ...externalNodes];
  }, [nodeTypes, diagramType]);

  const filteredNodes = useMemo(() => {
    return allNodeDefinitions.filter(node => {
      // Filtro por categoria específica (se fornecida)
      if (category && node.category !== category) {
        return false;
      }

      // Filtro por tipo de diagrama atual
      if (diagramType && !node.diagramTypes.includes(diagramType)) {
        return false;
      }

      // Filtro por termo de busca
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        const matchesSearch = (
          node.label.toLowerCase().includes(term) ||
          node.description.toLowerCase().includes(term)
        );
        if (!matchesSearch) return false;
      }

      // Filtros personalizados
      if (filterable && Object.keys(activeFilters).length > 0) {
        for (const [filterKey, filterValue] of Object.entries(activeFilters)) {
          if (filterValue && !node.defaultData?.[filterKey]?.includes?.(filterValue)) {
            return false;
          }
        }
      }

      return true;
    });
  }, [allNodeDefinitions, category, diagramType, searchTerm, activeFilters, filterable]);

  const nodesByCategory = useMemo(() => {
    const grouped = new Map<NodeCategory, NodeDefinition[]>();
    
    filteredNodes.forEach(node => {
      if (!grouped.has(node.category)) {
        grouped.set(node.category, []);
      }
      grouped.get(node.category)!.push(node);
    });

    return grouped;
  }, [filteredNodes]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleNodeDragStart = useCallback((event: React.DragEvent, nodeType: NodeType) => {
    if (!dragAndDrop) {
      event.preventDefault();
      return;
    }
    
    // Melhorar dados do drag-and-drop com informações completas do nó
    const nodeDefinition = filteredNodes.find(node => node.type === nodeType);
    const dragData = {
      nodeType,
      label: nodeDefinition?.label || nodeType,
      category: nodeDefinition?.category || 'basic',
      defaultData: nodeDefinition?.defaultData || {}
    };
    
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.setData('application/json', JSON.stringify(dragData));
    event.dataTransfer.effectAllowed = 'move';
    
    // Adicionar feedback visual durante o drag
    const dragImage = event.currentTarget.cloneNode(true) as HTMLElement;
    dragImage.style.transform = 'rotate(5deg)';
    dragImage.style.opacity = '0.8';
    event.dataTransfer.setDragImage(dragImage, 0, 0);
    
    if (onNodeDragStart) {
      onNodeDragStart(event, nodeType);
    }
    
    announce(`Arrastando nó ${nodeDefinition?.label || nodeType}`);
    secureLogger.info('Drag iniciado com dados aprimorados', { nodeType, dragData });
  }, [dragAndDrop, onNodeDragStart, filteredNodes, announce]);

  const handleNodeDragEnd = useCallback((event: React.DragEvent, nodeType: NodeType) => {
    if (onNodeDragEnd) {
      onNodeDragEnd(event, nodeType);
    }
    
    secureLogger.info('Drag finalizado', { nodeType });
  }, [onNodeDragEnd]);

  const handleNodeClick = useCallback(async (nodeDefinition: NodeDefinition) => {
    // Callback de seleção
    if (onNodeSelect) {
      onNodeSelect(nodeDefinition.type);
    }

    // Adicionar nó no centro do viewport
    const newNode = {
      type: nodeDefinition.type,
      position: { x: 250, y: 250 }, // Posição padrão
      data: nodeDefinition.defaultData || {},
      category: nodeDefinition.category
    };

    await addNode(newNode);
    announce(`Nó ${nodeDefinition.label} adicionado ao diagrama`);
    
    secureLogger.info('Nó adicionado via clique', { nodeType: nodeDefinition.type });
  }, [addNode, onNodeSelect, announce]);

  const toggleCategory = useCallback((categoryId: NodeCategory) => {
    if (!collapsible) return;
    
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
    
    if (onCategoryChange) {
      onCategoryChange(categoryId);
    }
  }, [collapsible, onCategoryChange]);

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    
    // Anunciar resultados da busca
    const results = filteredNodes.filter(node => 
      node.label.toLowerCase().includes(value.toLowerCase()) ||
      node.description?.toLowerCase().includes(value.toLowerCase())
    );
    
    if (value) {
      announce(`${results.length} resultado${results.length !== 1 ? 's' : ''} encontrado${results.length !== 1 ? 's' : ''} para "${value}"`);
    }
    
    if (onSearch) {
      onSearch(value);
    }
  }, [onSearch, filteredNodes, announce]);

  const handleFilter = useCallback((filters: Record<string, unknown>) => {
    setActiveFilters(filters);
    if (onFilter) {
      onFilter(filters);
    }
  }, [onFilter]);

  // ============================================================================
  // Componentes
  // ============================================================================

  const NodeItem: React.FC<{ node: NodeDefinition }> = ({ node }) => {
    const nodeRef = useRef<HTMLDivElement>(null);
    const isFocused = focusedElementId === `node-${node.type}`;
    
    useEffect(() => {
      if (nodeRef.current) {
        registerFocusable(nodeRef.current, {
          id: `node-${node.type}`,
          priority: 2,
          description: `Nó ${node.label}: ${node.description || 'Sem descrição'}`
        });
        
        return () => {
          unregisterFocusable(`node-${node.type}`);
        };
      }
    }, [registerFocusable, unregisterFocusable, node.type, node.label, node.description]);
    
    const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
      const handled = handleAccessibleKeyDown(e);
      if (handled) return;
      
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        handleNodeClick(node);
      }
    }, [handleAccessibleKeyDown, handleNodeClick, node]);
    
    return (
      <div
        ref={nodeRef}
        draggable={dragAndDrop}
        onDragStart={(e) => handleNodeDragStart(e, node.type)}
        onDragEnd={(e) => handleNodeDragEnd(e, node.type)}
        onClick={() => handleNodeClick(node)}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-label={`Adicionar nó ${node.label}${node.description ? `: ${node.description}` : ''}`}
        aria-pressed={isFocused}
        className={cn(
          'group flex items-center gap-3 p-3 rounded-lg cursor-pointer relative',
          'hover:bg-accent hover:text-accent-foreground hover:shadow-sm',
          'focus:bg-accent focus:text-accent-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
          'transition-all duration-200 ease-in-out',
          'border border-transparent hover:border-border/50',
          'select-none active:scale-[0.98]',
          dragAndDrop && 'hover:cursor-grab active:cursor-grabbing',
          isFocused && 'bg-accent text-accent-foreground ring-2 ring-ring ring-offset-1'
        )}
        title={node.description}
      >
        <div className="flex-shrink-0 text-muted-foreground group-hover:text-accent-foreground transition-colors">
          {node.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate group-hover:text-accent-foreground">
            {node.label}
          </div>
          {showDescriptions && node.description && (
            <div className="text-xs text-muted-foreground truncate group-hover:text-accent-foreground/80">
              {node.description}
            </div>
          )}
        </div>
        {dragAndDrop && (
          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="text-xs text-muted-foreground group-hover:text-accent-foreground/60">
              ⋮⋮
            </div>
          </div>
        )}
      </div>
    );
  };

  const CategorySection: React.FC<{ category: NodeCategory; nodes: NodeDefinition[] }> = ({
    category,
    nodes
  }) => {
    const config = CATEGORY_CONFIGS.find(c => c.id === category);
    if (!config) return null;

    const isExpanded = expandedCategories.has(category);

    return (
      <Collapsible
        open={isExpanded}
        onOpenChange={() => toggleCategory(category)}
      >
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between p-2 h-auto"
          >
            <div className="flex items-center gap-2">
              {config.icon}
              <span className="font-medium">{config.label}</span>
              <Badge variant="secondary" className={cn('text-xs', config.color)}>
                {nodes.length}
              </Badge>
            </div>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-1 mt-1">
          {nodes.map(node => (
            <NodeItem key={node.type} node={node} />
          ))}
        </CollapsibleContent>
      </Collapsible>
    );
  };

  // ============================================================================
  // Render
  // ============================================================================

  // ============================================================================
  // Efeitos de Acessibilidade
  // ============================================================================
  
  useEffect(() => {
    if (paletteRef.current) {
      registerFocusable(paletteRef.current, {
        id: 'diagram-palette',
        priority: 1,
        description: 'Paleta de nós do diagrama'
      });
      
      return () => {
        unregisterFocusable('diagram-palette');
      };
    }
  }, [registerFocusable, unregisterFocusable]);
  
  useEffect(() => {
    if (searchInputRef.current) {
      registerFocusable(searchInputRef.current, {
        id: 'palette-search',
        priority: 1,
        description: 'Campo de busca da paleta'
      });
      
      return () => {
        unregisterFocusable('palette-search');
      };
    }
  }, [registerFocusable, unregisterFocusable]);

  return (
    <div 
      ref={paletteRef}
      className={cn('flex flex-col h-full bg-background border-r border-border', className)}
      role="region"
      aria-label="Paleta de nós do diagrama"
    >
      {/* Header */}
      <div className="p-3 border-b border-border">
        <h3 className="font-semibold text-sm mb-2" id="palette-title">Paleta de Nós</h3>
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <Input
            ref={searchInputRef}
            placeholder="Buscar nós..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8 h-8"
            aria-label="Buscar nós na paleta"
            aria-describedby="search-instructions"
          />
          <div id="search-instructions" className="sr-only">
            Digite para filtrar os nós disponíveis na paleta
          </div>
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-2 space-y-2">
          {/* Informação sobre Drag & Drop */}
          {!searchTerm && (
            <div className="text-xs text-muted-foreground p-2 bg-muted/50 rounded-md">
              💡 Arraste os nós para o canvas ou clique para adicionar
            </div>
          )}

          {/* Categorias */}
          {CATEGORY_CONFIGS.map(config => {
            const categoryNodes = nodesByCategory.get(config.id) || [];
            if (categoryNodes.length === 0) return null;

            return (
              <CategorySection
                key={config.id}
                category={config.id}
                nodes={categoryNodes}
              />
            );
          })}

          {/* Mensagem quando não há resultados */}
          {filteredNodes.length === 0 && (
            <div className="text-center text-muted-foreground p-4">
              <div className="text-sm">Nenhum nó encontrado</div>
              {searchTerm && (
                <div className="text-xs mt-1">
                  Tente um termo diferente
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Footer */}
      <div className="p-2 border-t border-border">
        <div className="text-xs text-muted-foreground text-center">
          {filteredNodes.length} nó{filteredNodes.length !== 1 ? 's' : ''} disponível{filteredNodes.length !== 1 ? 'is' : ''}
        </div>
      </div>
    </div>
  );
});

export default DiagramPalette;