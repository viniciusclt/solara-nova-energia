// ============================================================================
// KeyboardShortcutsPanel - Painel para exibir e gerenciar atalhos de teclado
// ============================================================================

import React, { useState, useMemo } from 'react';
import {
  Keyboard,
  Search,
  Filter,
  Settings,
  Eye,
  EyeOff,
  Info,
  Command,
  X,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { useKeyboardShortcuts, KeyboardShortcut } from '../hooks/useKeyboardShortcuts';
import { cn } from '@/lib/utils';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface KeyboardShortcutsPanelProps {
  className?: string;
  position?: 'floating' | 'sidebar' | 'modal';
  compact?: boolean;
  showSearch?: boolean;
  showCategories?: boolean;
  defaultOpen?: boolean;
}

interface CategoryInfo {
  name: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const CATEGORIES: Record<string, CategoryInfo> = {
  general: {
    name: 'general',
    label: 'Geral',
    description: 'Ações gerais do editor',
    icon: <Settings className="h-4 w-4" />,
    color: 'bg-blue-100 text-blue-800'
  },
  nodes: {
    name: 'nodes',
    label: 'Nós',
    description: 'Operações com nós',
    icon: <Command className="h-4 w-4" />,
    color: 'bg-green-100 text-green-800'
  },
  connections: {
    name: 'connections',
    label: 'Conexões',
    description: 'Operações com conexões',
    icon: <Command className="h-4 w-4" />,
    color: 'bg-purple-100 text-purple-800'
  },
  view: {
    name: 'view',
    label: 'Visualização',
    description: 'Controles de visualização',
    icon: <Eye className="h-4 w-4" />,
    color: 'bg-orange-100 text-orange-800'
  },
  edit: {
    name: 'edit',
    label: 'Edição',
    description: 'Ferramentas de edição',
    icon: <Settings className="h-4 w-4" />,
    color: 'bg-red-100 text-red-800'
  }
};

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

const KeyboardKey: React.FC<{ keyString: string }> = ({ keyString }) => {
  const keys = keyString.split('+');
  
  const formatKey = (key: string): string => {
    const keyMap: Record<string, string> = {
      'ctrl': '⌘',
      'shift': '⇧',
      'alt': '⌥',
      'meta': '⌘',
      'arrowup': '↑',
      'arrowdown': '↓',
      'arrowleft': '←',
      'arrowright': '→',
      'escape': 'Esc',
      'delete': 'Del',
      'backspace': '⌫',
      ' ': 'Space'
    };
    
    return keyMap[key.toLowerCase()] || key.toUpperCase();
  };
  
  return (
    <div className="flex items-center gap-1">
      {keys.map((key, index) => (
        <React.Fragment key={index}>
          <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-mono bg-gray-100 border border-gray-300 rounded shadow-sm">
            {formatKey(key)}
          </kbd>
          {index < keys.length - 1 && (
            <span className="text-gray-400 text-xs">+</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );
};

const ShortcutItem: React.FC<{ 
  shortcut: KeyboardShortcut;
  onToggle?: (key: string, enabled: boolean) => void;
}> = ({ shortcut, onToggle }) => {
  const category = CATEGORIES[shortcut.category];
  
  return (
    <div className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-3 flex-1">
        <div className="flex items-center gap-2">
          <KeyboardKey keyString={shortcut.key} />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{shortcut.description}</span>
            {category && (
              <Badge variant="secondary" className={cn("text-xs", category.color)}>
                {category.label}
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      {onToggle && (
        <Switch
          checked={shortcut.enabled !== false}
          onCheckedChange={(enabled) => onToggle(shortcut.key, enabled)}
          size="sm"
        />
      )}
    </div>
  );
};

const CategorySection: React.FC<{
  category: string;
  shortcuts: KeyboardShortcut[];
  onToggleShortcut?: (key: string, enabled: boolean) => void;
  onToggleCategory?: (category: string, enabled: boolean) => void;
}> = ({ category, shortcuts, onToggleShortcut, onToggleCategory }) => {
  const [isOpen, setIsOpen] = useState(true);
  const categoryInfo = CATEGORIES[category];
  
  if (!categoryInfo || shortcuts.length === 0) return null;
  
  const enabledCount = shortcuts.filter(s => s.enabled !== false).length;
  const allEnabled = enabledCount === shortcuts.length;
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <CollapsibleTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between p-3 h-auto"
        >
          <div className="flex items-center gap-3">
            {categoryInfo.icon}
            <div className="text-left">
              <div className="font-medium">{categoryInfo.label}</div>
              <div className="text-xs text-muted-foreground">
                {categoryInfo.description}
              </div>
            </div>
            <Badge variant="outline" className="ml-auto">
              {enabledCount}/{shortcuts.length}
            </Badge>
          </div>
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </Button>
      </CollapsibleTrigger>
      
      <CollapsibleContent className="space-y-2 pt-2">
        {onToggleCategory && (
          <div className="flex items-center justify-between px-3 py-2 bg-muted/50 rounded-md">
            <Label className="text-sm">Habilitar toda a categoria</Label>
            <Switch
              checked={allEnabled}
              onCheckedChange={(enabled) => onToggleCategory(category, enabled)}
              size="sm"
            />
          </div>
        )}
        
        <div className="space-y-2">
          {shortcuts.map((shortcut) => (
            <ShortcutItem
              key={shortcut.key}
              shortcut={shortcut}
              onToggle={onToggleShortcut}
            />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const KeyboardShortcutsPanel: React.FC<KeyboardShortcutsPanelProps> = ({
  className = '',
  position = 'floating',
  compact = false,
  showSearch = true,
  showCategories = true,
  defaultOpen = false
}) => {
  const {
    shortcuts,
    enableCategory,
    disableCategory,
    getShortcutsByCategory
  } = useKeyboardShortcuts();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isOpen, setIsOpen] = useState(defaultOpen);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const filteredShortcuts = useMemo(() => {
    let filtered = shortcuts;
    
    // Filtrar por categoria
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(s => s.category === selectedCategory);
    }
    
    // Filtrar por termo de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(s => 
        s.description.toLowerCase().includes(term) ||
        s.key.toLowerCase().includes(term) ||
        s.category.toLowerCase().includes(term)
      );
    }
    
    return filtered;
  }, [shortcuts, selectedCategory, searchTerm]);

  const shortcutsByCategory = useMemo(() => {
    const grouped: Record<string, KeyboardShortcut[]> = {};
    
    filteredShortcuts.forEach(shortcut => {
      if (!grouped[shortcut.category]) {
        grouped[shortcut.category] = [];
      }
      grouped[shortcut.category].push(shortcut);
    });
    
    return grouped;
  }, [filteredShortcuts]);

  const totalShortcuts = shortcuts.length;
  const enabledShortcuts = shortcuts.filter(s => s.enabled !== false).length;

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleToggleShortcut = (key: string, enabled: boolean) => {
    // Implementar lógica para habilitar/desabilitar atalho específico
    console.log('Toggle shortcut:', key, enabled);
  };

  const handleToggleCategory = (category: string, enabled: boolean) => {
    if (enabled) {
      enableCategory(category);
    } else {
      disableCategory(category);
    }
  };

  const handleReset = () => {
    setSearchTerm('');
    setSelectedCategory('all');
  };

  // ============================================================================
  // RENDER CONTENT
  // ============================================================================

  const renderContent = () => (
    <div className="space-y-4">
      {/* Header com estatísticas */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Keyboard className="h-5 w-5" />
          <div>
            <h3 className="font-semibold">Atalhos de Teclado</h3>
            <p className="text-xs text-muted-foreground">
              {enabledShortcuts}/{totalShortcuts} ativos
            </p>
          </div>
        </div>
        
        {!compact && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" onClick={handleReset}>
                  <X className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Limpar filtros</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
      
      {/* Controles de busca e filtro */}
      {(showSearch || showCategories) && (
        <div className="space-y-3">
          {showSearch && (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar atalhos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          )}
          
          {showCategories && (
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {Object.entries(CATEGORIES).map(([key, category]) => (
                  <SelectItem key={key} value={key}>
                    <div className="flex items-center gap-2">
                      {category.icon}
                      {category.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      )}
      
      <Separator />
      
      {/* Lista de atalhos */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {Object.keys(shortcutsByCategory).length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Keyboard className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum atalho encontrado</p>
          </div>
        ) : (
          Object.entries(shortcutsByCategory).map(([category, categoryShortcuts]) => (
            <CategorySection
              key={category}
              category={category}
              shortcuts={categoryShortcuts}
              onToggleShortcut={handleToggleShortcut}
              onToggleCategory={handleToggleCategory}
            />
          ))
        )}
      </div>
      
      {/* Footer com informações */}
      {!compact && (
        <>
          <Separator />
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Info className="h-3 w-3" />
            <span>Use os atalhos para acelerar seu fluxo de trabalho</span>
          </div>
        </>
      )}
    </div>
  );

  // ============================================================================
  // RENDER PRINCIPAL
  // ============================================================================

  if (position === 'modal') {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button variant="ghost" size="sm">
            <Keyboard className="h-4 w-4" />
            {!compact && <span className="ml-2">Atalhos</span>}
          </Button>
        </DialogTrigger>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Atalhos de Teclado</DialogTitle>
            <DialogDescription>
              Gerencie e visualize todos os atalhos disponíveis no editor de diagramas.
            </DialogDescription>
          </DialogHeader>
          <div className="overflow-y-auto">
            {renderContent()}
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const containerClasses = {
    floating: 'fixed top-4 left-4 z-50 w-80',
    sidebar: 'w-full'
  };

  return (
    <Card className={cn(containerClasses[position], className)}>
      <CardHeader className={cn('pb-3', compact && 'pb-2')}>
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Keyboard className="h-4 w-4" />
          Atalhos
          <Badge variant="secondary" className="ml-auto">
            {enabledShortcuts}/{totalShortcuts}
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {renderContent()}
      </CardContent>
    </Card>
  );
};

export default KeyboardShortcutsPanel;