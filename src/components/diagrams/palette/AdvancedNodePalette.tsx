import React, { useState, useCallback, useMemo } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Search, 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Zap,
  Info,
  Palette,
  Grid3X3,
  Layers
} from 'lucide-react';
import { useAdvancedNodeCreation, NodeTemplate } from '../hooks/useAdvancedNodeCreation';
import { NodeCategory, NodeType } from '../types';
import { useDiagramStore } from '../stores/useDiagramStore';
import { useAnnouncer } from '../hooks/useAnnouncer';
import { secureLogger } from '@/utils/secureLogger';

// ============================================================================
// Tipos e Interfaces
// ============================================================================

interface AdvancedNodePaletteProps {
  className?: string;
  onNodeCreate?: (nodeType: NodeType) => void;
  showTemplateInfo?: boolean;
  enableQuickActions?: boolean;
  compactMode?: boolean;
}

interface CategoryConfig {
  id: NodeCategory;
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

// ============================================================================
// Configurações de Categoria
// ============================================================================

const CATEGORY_CONFIGS: CategoryConfig[] = [
  {
    id: 'flowchart',
    label: 'Fluxograma/BPMN',
    icon: <Grid3X3 className="h-4 w-4" />,
    color: 'bg-blue-100 text-blue-800',
    description: 'Elementos para processos e fluxos de trabalho'
  },
  {
    id: 'mindmap',
    label: 'Mapa Mental',
    icon: <Zap className="h-4 w-4" />,
    color: 'bg-green-100 text-green-800',
    description: 'Elementos para brainstorming e organização de ideias'
  },
  {
    id: 'organogram',
    label: 'Organograma',
    icon: <Layers className="h-4 w-4" />,
    color: 'bg-purple-100 text-purple-800',
    description: 'Elementos para estruturas organizacionais'
  }
];

// ============================================================================
// Componente Principal
// ============================================================================

export const AdvancedNodePalette: React.FC<AdvancedNodePaletteProps> = ({
  className,
  onNodeCreate,
  showTemplateInfo = true,
  enableQuickActions = true,
  compactMode = false
}) => {
  // ============================================================================
  // Estado Local
  // ============================================================================

  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<NodeCategory>>(
    new Set(['flowchart', 'mindmap', 'organogram'])
  );
  const [selectedTemplate, setSelectedTemplate] = useState<NodeTemplate | null>(null);

  // ============================================================================
  // Hooks
  // ============================================================================

  const { document } = useDiagramStore();
  const { announce } = useAnnouncer();
  const {
    createNode,
    createNodeSequence,
    getAvailableTemplates,
    getTemplateByType,
    templatesByCategory
  } = useAdvancedNodeCreation();

  // ============================================================================
  // Computações
  // ============================================================================

  const currentDiagramType = document?.config?.type || 'flowchart';
  
  const filteredTemplates = useMemo(() => {
    const allTemplates = getAvailableTemplates();
    
    return allTemplates.filter(template => {
      // Filtro por tipo de diagrama
      if (currentDiagramType === 'flowchart' && template.category !== 'flowchart') return false;
      if (currentDiagramType === 'mindmap' && template.category !== 'mindmap') return false;
      if (currentDiagramType === 'organogram' && template.category !== 'organogram') return false;
      
      // Filtro por busca
      if (searchTerm) {
        const term = searchTerm.toLowerCase();
        return (
          template.label.toLowerCase().includes(term) ||
          template.description?.toLowerCase().includes(term) ||
          template.type.toLowerCase().includes(term)
        );
      }
      
      return true;
    });
  }, [getAvailableTemplates, currentDiagramType, searchTerm]);

  const templatesByFilteredCategory = useMemo(() => {
    const grouped: Record<NodeCategory, NodeTemplate[]> = {
      flowchart: [],
      mindmap: [],
      organogram: []
    };
    
    filteredTemplates.forEach(template => {
      grouped[template.category].push(template);
    });
    
    return grouped;
  }, [filteredTemplates]);

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleNodeCreate = useCallback((nodeType: NodeType) => {
    const template = getTemplateByType(nodeType);
    if (!template) return;

    const node = createNode(nodeType, {
      validatePlacement: true,
      snapToGrid: true
    });

    if (node && onNodeCreate) {
      onNodeCreate(nodeType);
    }

    announce(`${template.label} adicionado ao diagrama`);
    secureLogger.info('Nó criado via paleta avançada', { nodeType, template: template.label });
  }, [createNode, getTemplateByType, onNodeCreate, announce]);

  const handleQuickSequence = useCallback((category: NodeCategory) => {
    const templates = templatesByCategory[category];
    if (templates.length === 0) return;

    const nodeTypes = templates.slice(0, 3).map(t => t.type); // Primeiros 3 tipos
    createNodeSequence(nodeTypes);
    
    announce(`Sequência rápida de ${category} criada`);
  }, [templatesByCategory, createNodeSequence, announce]);

  const toggleCategory = useCallback((categoryId: NodeCategory) => {
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

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    
    if (value) {
      const results = filteredTemplates.length;
      announce(`${results} template${results !== 1 ? 's' : ''} encontrado${results !== 1 ? 's' : ''} para "${value}"`);
    }
  }, [filteredTemplates.length, announce]);

  // ============================================================================
  // Componentes Internos
  // ============================================================================

  const TemplateCard: React.FC<{ template: NodeTemplate }> = ({ template }) => {
    const isSelected = selectedTemplate?.type === template.type;
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className={cn(
                'group relative p-3 rounded-lg border cursor-pointer transition-all duration-200',
                'hover:shadow-md hover:border-primary/50 hover:bg-accent/50',
                'focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1',
                isSelected && 'border-primary bg-accent shadow-sm',
                compactMode ? 'p-2' : 'p-3'
              )}
              onClick={() => {
                setSelectedTemplate(template);
                handleNodeCreate(template.type);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleNodeCreate(template.type);
                }
              }}
              tabIndex={0}
              role="button"
              aria-label={`Adicionar ${template.label}: ${template.description}`}
            >
              {/* Ícone e Título */}
              <div className="flex items-center gap-2 mb-2">
                {template.icon && (
                  <div 
                    className="flex-shrink-0 p-1 rounded" 
                    style={{ 
                      backgroundColor: template.color ? `${template.color}20` : undefined,
                      color: template.color
                    }}
                  >
                    {template.icon}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h4 className={cn(
                    'font-medium truncate',
                    compactMode ? 'text-xs' : 'text-sm'
                  )}>
                    {template.label}
                  </h4>
                </div>
                <Plus className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              
              {/* Descrição */}
              {!compactMode && showTemplateInfo && template.description && (
                <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                  {template.description}
                </p>
              )}
              
              {/* Metadados */}
              {!compactMode && showTemplateInfo && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-xs px-1 py-0">
                    {template.type}
                  </Badge>
                  {template.size && (
                    <span className="text-xs">
                      {template.size.width}×{template.size.height}
                    </span>
                  )}
                </div>
              )}
              
              {/* Indicador de Seleção */}
              {isSelected && (
                <div className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="right" className="max-w-xs">
            <div className="space-y-1">
              <p className="font-medium">{template.label}</p>
              {template.description && (
                <p className="text-sm text-muted-foreground">{template.description}</p>
              )}
              {template.constraints && (
                <div className="text-xs text-muted-foreground">
                  {template.constraints.maxConnections && (
                    <p>Máx. conexões: {template.constraints.maxConnections}</p>
                  )}
                  {template.constraints.allowedParents && (
                    <p>Pais permitidos: {template.constraints.allowedParents.join(', ')}</p>
                  )}
                </div>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };

  const CategorySection: React.FC<{ config: CategoryConfig }> = ({ config }) => {
    const templates = templatesByFilteredCategory[config.id];
    if (templates.length === 0) return null;

    const isExpanded = expandedCategories.has(config.id);

    return (
      <Collapsible open={isExpanded} onOpenChange={() => toggleCategory(config.id)}>
        <CollapsibleTrigger asChild>
          <Button
            variant="ghost"
            className="w-full justify-between p-2 h-auto hover:bg-accent/50"
          >
            <div className="flex items-center gap-2">
              {config.icon}
              <span className={cn('font-medium', compactMode ? 'text-sm' : 'text-base')}>
                {config.label}
              </span>
              <Badge variant="secondary" className={cn('text-xs', config.color)}>
                {templates.length}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              {enableQuickActions && templates.length > 1 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 px-2 text-xs"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleQuickSequence(config.id);
                  }}
                  title={`Criar sequência de ${config.label}`}
                >
                  <Zap className="h-3 w-3" />
                </Button>
              )}
              {isExpanded ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </div>
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="space-y-2 mt-2">
          <div className={cn(
            'grid gap-2',
            compactMode ? 'grid-cols-1' : 'grid-cols-1'
          )}>
            {templates.map(template => (
              <TemplateCard key={template.type} template={template} />
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    );
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className={cn(
      'flex flex-col h-full bg-background border-r border-border',
      compactMode ? 'w-64' : 'w-80',
      className
    )}>
      {/* Header */}
      <div className="p-3 border-b border-border">
        <div className="flex items-center gap-2 mb-3">
          <Palette className="h-4 w-4 text-primary" />
          <h3 className="font-semibold text-sm">Paleta Avançada</h3>
          {showTemplateInfo && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Info className="h-3 w-3 text-muted-foreground cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Arraste ou clique para adicionar elementos</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
        
        {/* Busca */}
        <div className="relative">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar templates..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-8 h-8"
          />
        </div>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-3 space-y-3">
          {/* Dica de Uso */}
          {!searchTerm && (
            <div className="text-xs text-muted-foreground p-2 bg-muted/30 rounded-md">
              💡 {compactMode ? 'Clique para adicionar' : 'Arraste para o canvas ou clique para adicionar na posição padrão'}
            </div>
          )}

          {/* Categorias */}
          {CATEGORY_CONFIGS.map(config => (
            <CategorySection key={config.id} config={config} />
          ))}

          {/* Mensagem quando não há resultados */}
          {filteredTemplates.length === 0 && (
            <div className="text-center text-muted-foreground p-4">
              <div className="text-sm">Nenhum template encontrado</div>
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
          {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''} • {currentDiagramType}
        </div>
      </div>
    </div>
  );
};

export default AdvancedNodePalette;