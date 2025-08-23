// ============================================================================
// Enhanced UI Components - Inspirado no MindMeister
// Componentes de interface aprimorados para melhor experiência do usuário
// ============================================================================

import React, { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { 
  Plus, 
  Search, 
  Filter, 
  Grid, 
  List, 
  Sparkles, 
  Zap, 
  Eye, 
  EyeOff,
  ChevronDown,
  ChevronRight,
  Star,
  Heart,
  Bookmark,
  MoreHorizontal,
  Settings,
  Palette,
  Move,
  Copy,
  Trash2,
  RotateCcw,
  RotateCw,
  ZoomIn,
  ZoomOut,
  Maximize,
  Minimize
} from 'lucide-react';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface FloatingToolbarProps {
  position: { x: number; y: number };
  visible: boolean;
  onAction: (action: string) => void;
  actions?: ToolbarAction[];
  className?: string;
}

export interface ToolbarAction {
  id: string;
  label: string;
  icon: React.ReactNode;
  shortcut?: string;
  variant?: 'default' | 'primary' | 'secondary' | 'destructive';
  disabled?: boolean;
}

export interface SmartPaletteProps {
  items: PaletteItem[];
  onItemSelect: (item: PaletteItem) => void;
  searchable?: boolean;
  filterable?: boolean;
  groupable?: boolean;
  viewMode?: 'grid' | 'list';
  className?: string;
}

export interface PaletteItem {
  id: string;
  name: string;
  description?: string;
  icon: React.ReactNode;
  category: string;
  tags: string[];
  preview?: React.ReactNode;
  popular?: boolean;
  recent?: boolean;
}

export interface ContextMenuProps {
  position: { x: number; y: number };
  visible: boolean;
  onClose: () => void;
  items: ContextMenuItem[];
  className?: string;
}

export interface ContextMenuItem {
  id: string;
  label: string;
  icon?: React.ReactNode;
  shortcut?: string;
  action: () => void;
  disabled?: boolean;
  separator?: boolean;
  submenu?: ContextMenuItem[];
}

export interface QuickActionsProps {
  selectedNodes: string[];
  onAction: (action: string, data?: any) => void;
  className?: string;
}

// ============================================================================
// FLOATING TOOLBAR - Barra de ferramentas flutuante
// ============================================================================

export const FloatingToolbar: React.FC<FloatingToolbarProps> = ({
  position,
  visible,
  onAction,
  actions = [],
  className
}) => {
  if (!visible) return null;

  const defaultActions: ToolbarAction[] = [
    {
      id: 'copy',
      label: 'Copiar',
      icon: <Copy className="w-4 h-4" />,
      shortcut: 'Ctrl+C'
    },
    {
      id: 'duplicate',
      label: 'Duplicar',
      icon: <Copy className="w-4 h-4" />,
      shortcut: 'Ctrl+D'
    },
    {
      id: 'delete',
      label: 'Excluir',
      icon: <Trash2 className="w-4 h-4" />,
      shortcut: 'Del',
      variant: 'destructive'
    }
  ];

  const toolbarActions = actions.length > 0 ? actions : defaultActions;

  return (
    <div
      className={cn(
        "fixed z-50 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-lg shadow-lg p-2",
        "animate-in fade-in-0 zoom-in-95 duration-200",
        className
      )}
      style={{
        left: position.x,
        top: position.y,
        transform: 'translate(-50%, -100%)'
      }}
    >
      <div className="flex items-center gap-1">
        {toolbarActions.map((action, index) => (
          <TooltipProvider key={action.id}>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={action.variant || 'ghost'}
                  size="sm"
                  onClick={() => onAction(action.id)}
                  disabled={action.disabled}
                  className="h-8 w-8 p-0"
                >
                  {action.icon}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <div className="text-center">
                  <div className="font-medium">{action.label}</div>
                  {action.shortcut && (
                    <div className="text-xs text-muted-foreground">{action.shortcut}</div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// SMART PALETTE - Paleta inteligente com busca e filtros
// ============================================================================

export const SmartPalette: React.FC<SmartPaletteProps> = ({
  items,
  onItemSelect,
  searchable = true,
  filterable = true,
  groupable = true,
  viewMode = 'grid',
  className
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentViewMode, setCurrentViewMode] = useState(viewMode);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['all']));

  // Filtrar itens
  const filteredItems = items.filter(item => {
    const matchesSearch = !searchTerm || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  // Agrupar itens por categoria
  const groupedItems = groupable ? 
    filteredItems.reduce((groups, item) => {
      const category = item.category;
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
      return groups;
    }, {} as Record<string, PaletteItem[]>) : 
    { 'all': filteredItems };

  // Obter categorias únicas
  const categories = ['all', ...Array.from(new Set(items.map(item => item.category)))];

  const toggleGroup = (group: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(group)) {
      newExpanded.delete(group);
    } else {
      newExpanded.add(group);
    }
    setExpandedGroups(newExpanded);
  };

  return (
    <Card className={cn("w-80 h-full flex flex-col", className)}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Palette className="w-5 h-5 text-primary" />
            Elementos
          </CardTitle>
          <div className="flex items-center gap-1">
            <Button
              variant={currentViewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentViewMode('grid')}
              className="h-8 w-8 p-0"
            >
              <Grid className="w-4 h-4" />
            </Button>
            <Button
              variant={currentViewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setCurrentViewMode('list')}
              className="h-8 w-8 p-0"
            >
              <List className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        {searchable && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar elementos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        )}
        
        {filterable && (
          <div className="flex flex-wrap gap-1">
            {categories.map(category => (
              <Badge
                key={category}
                variant={selectedCategory === category ? 'default' : 'secondary'}
                className="cursor-pointer text-xs"
                onClick={() => setSelectedCategory(category)}
              >
                {category === 'all' ? 'Todos' : category}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="flex-1 overflow-auto p-3">
        <div className="space-y-4">
          {Object.entries(groupedItems).map(([category, categoryItems]) => {
            if (categoryItems.length === 0) return null;
            
            const isExpanded = expandedGroups.has(category);
            
            return (
              <div key={category}>
                {groupable && category !== 'all' && (
                  <button
                    onClick={() => toggleGroup(category)}
                    className="flex items-center gap-2 w-full text-left p-2 hover:bg-gray-50 rounded-md transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <span className="font-medium text-sm">{category}</span>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {categoryItems.length}
                    </Badge>
                  </button>
                )}
                
                {(!groupable || category === 'all' || isExpanded) && (
                  <div className={cn(
                    "grid gap-2",
                    currentViewMode === 'grid' ? "grid-cols-2" : "grid-cols-1"
                  )}>
                    {categoryItems.map(item => (
                      <div
                        key={item.id}
                        onClick={() => onItemSelect(item)}
                        className={cn(
                          "relative p-3 border border-gray-200 rounded-lg cursor-pointer transition-all duration-200",
                          "hover:border-primary hover:shadow-md hover:scale-105",
                          "group"
                        )}
                      >
                        {(item.popular || item.recent) && (
                          <div className="absolute -top-1 -right-1">
                            {item.popular && (
                              <Badge className="bg-yellow-500 text-white text-xs px-1 py-0">
                                <Star className="w-3 h-3" />
                              </Badge>
                            )}
                            {item.recent && (
                              <Badge className="bg-blue-500 text-white text-xs px-1 py-0">
                                <Zap className="w-3 h-3" />
                              </Badge>
                            )}
                          </div>
                        )}
                        
                        <div className="flex items-center gap-2 mb-2">
                          <div className="text-primary">{item.icon}</div>
                          <div className="flex-1 min-w-0">
                            <div className="font-medium text-sm truncate">{item.name}</div>
                            {item.description && currentViewMode === 'list' && (
                              <div className="text-xs text-muted-foreground truncate">
                                {item.description}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {item.preview && (
                          <div className="mb-2 opacity-60 group-hover:opacity-100 transition-opacity">
                            {item.preview}
                          </div>
                        )}
                        
                        {item.tags.length > 0 && currentViewMode === 'list' && (
                          <div className="flex flex-wrap gap-1">
                            {item.tags.slice(0, 3).map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs px-1 py-0">
                                {tag}
                              </Badge>
                            ))}
                            {item.tags.length > 3 && (
                              <Badge variant="outline" className="text-xs px-1 py-0">
                                +{item.tags.length - 3}
                              </Badge>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// CONTEXT MENU - Menu contextual avançado
// ============================================================================

export const ContextMenu: React.FC<ContextMenuProps> = ({
  position,
  visible,
  onClose,
  items,
  className
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [submenuVisible, setSubmenuVisible] = useState<string | null>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (visible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [visible, onClose]);

  if (!visible) return null;

  return (
    <div
      ref={menuRef}
      className={cn(
        "fixed z-50 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-48",
        "animate-in fade-in-0 zoom-in-95 duration-200",
        className
      )}
      style={{
        left: position.x,
        top: position.y
      }}
    >
      {items.map((item, index) => {
        if (item.separator) {
          return <div key={index} className="h-px bg-gray-200 my-1" />;
        }

        return (
          <div
            key={item.id}
            className={cn(
              "relative px-3 py-2 text-sm cursor-pointer transition-colors",
              "hover:bg-gray-50",
              item.disabled && "opacity-50 cursor-not-allowed"
            )}
            onClick={() => {
              if (!item.disabled) {
                item.action();
                onClose();
              }
            }}
            onMouseEnter={() => {
              if (item.submenu) {
                setSubmenuVisible(item.id);
              }
            }}
            onMouseLeave={() => {
              if (item.submenu) {
                setSubmenuVisible(null);
              }
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {item.icon && <span className="text-muted-foreground">{item.icon}</span>}
                <span>{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {item.shortcut && (
                  <span className="text-xs text-muted-foreground">{item.shortcut}</span>
                )}
                {item.submenu && (
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </div>
            
            {/* Submenu */}
            {item.submenu && submenuVisible === item.id && (
              <div
                className="absolute left-full top-0 ml-1 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-48"
              >
                {item.submenu.map((subItem, subIndex) => (
                  <div
                    key={subItem.id}
                    className={cn(
                      "px-3 py-2 text-sm cursor-pointer transition-colors hover:bg-gray-50",
                      subItem.disabled && "opacity-50 cursor-not-allowed"
                    )}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!subItem.disabled) {
                        subItem.action();
                        onClose();
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {subItem.icon && <span className="text-muted-foreground">{subItem.icon}</span>}
                        <span>{subItem.label}</span>
                      </div>
                      {subItem.shortcut && (
                        <span className="text-xs text-muted-foreground">{subItem.shortcut}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

// ============================================================================
// QUICK ACTIONS - Ações rápidas para seleção múltipla
// ============================================================================

export const QuickActions: React.FC<QuickActionsProps> = ({
  selectedNodes,
  onAction,
  className
}) => {
  if (selectedNodes.length === 0) return null;

  const actions = [
    {
      id: 'align-left',
      label: 'Alinhar à esquerda',
      icon: <Move className="w-4 h-4" />,
      disabled: selectedNodes.length < 2
    },
    {
      id: 'align-center',
      label: 'Alinhar ao centro',
      icon: <Move className="w-4 h-4" />,
      disabled: selectedNodes.length < 2
    },
    {
      id: 'align-right',
      label: 'Alinhar à direita',
      icon: <Move className="w-4 h-4" />,
      disabled: selectedNodes.length < 2
    },
    {
      id: 'distribute-horizontal',
      label: 'Distribuir horizontalmente',
      icon: <Move className="w-4 h-4" />,
      disabled: selectedNodes.length < 3
    },
    {
      id: 'distribute-vertical',
      label: 'Distribuir verticalmente',
      icon: <Move className="w-4 h-4" />,
      disabled: selectedNodes.length < 3
    },
    {
      id: 'group',
      label: 'Agrupar',
      icon: <Grid className="w-4 h-4" />,
      disabled: selectedNodes.length < 2
    },
    {
      id: 'duplicate',
      label: 'Duplicar',
      icon: <Copy className="w-4 h-4" />
    },
    {
      id: 'delete',
      label: 'Excluir',
      icon: <Trash2 className="w-4 h-4" />,
      variant: 'destructive' as const
    }
  ];

  return (
    <Card className={cn("fixed bottom-4 left-1/2 transform -translate-x-1/2 z-40", className)}>
      <CardContent className="p-3">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="mr-2">
            {selectedNodes.length} selecionado{selectedNodes.length > 1 ? 's' : ''}
          </Badge>
          
          {actions.map(action => (
            <TooltipProvider key={action.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant={action.variant || 'ghost'}
                    size="sm"
                    onClick={() => onAction(action.id)}
                    disabled={action.disabled}
                    className="h-8 w-8 p-0"
                  >
                    {action.icon}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <span>{action.label}</span>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  FloatingToolbar,
  SmartPalette,
  ContextMenu,
  QuickActions
};