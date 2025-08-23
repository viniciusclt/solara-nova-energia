// ============================================================================
// DiagramToolPalette - Paleta de ferramentas para edição de diagramas
// ============================================================================

import React from 'react';
import { 
  MousePointer, 
  Square, 
  Circle, 
  Diamond, 
  ArrowRight, 
  Type, 
  Move, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  RotateCw, 
  Copy, 
  Trash2, 
  Download, 
  Upload, 
  Save, 
  Grid, 
  Eye, 
  EyeOff,
  Layers,
  Settings,
  Play,
  Square as StopIcon,
  FileText,
  Database,
  Users,
  Building,
  Lightbulb,
  GitBranch,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { DiagramType, NodeType, ToolType } from '@/hooks/useDiagramIntegration';

// ============================================================================
// Types
// ============================================================================

interface Tool {
  id: ToolType;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  shortcut?: string;
  category: 'selection' | 'creation' | 'navigation' | 'editing';
}

interface NodeTool {
  id: NodeType;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  category: DiagramType[];
  color: string;
}

interface DiagramToolPaletteProps {
  diagramType: DiagramType;
  selectedTool: ToolType;
  selectedNodes: string[];
  selectedEdges: string[];
  hasUnsavedChanges: boolean;
  canUndo: boolean;
  canRedo: boolean;
  showGrid: boolean;
  showMinimap: boolean;
  onToolSelect: (tool: ToolType) => void;
  onNodeAdd: (nodeType: NodeType) => void;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onExport: () => void;
  onImport: () => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  onToggleGrid: () => void;
  onToggleMinimap: () => void;
  onFitToView: () => void;
  onCenterView: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  className?: string;
}

// ============================================================================
// Tool Definitions
// ============================================================================

const TOOLS: Tool[] = [
  {
    id: 'select',
    name: 'Selecionar',
    icon: MousePointer,
    shortcut: 'V',
    category: 'selection'
  },
  {
    id: 'node',
    name: 'Adicionar Nó',
    icon: Square,
    shortcut: 'N',
    category: 'creation'
  },
  {
    id: 'edge',
    name: 'Conectar',
    icon: ArrowRight,
    shortcut: 'E',
    category: 'creation'
  },
  {
    id: 'text',
    name: 'Texto',
    icon: Type,
    shortcut: 'T',
    category: 'creation'
  },
  {
    id: 'pan',
    name: 'Mover Visualização',
    icon: Move,
    shortcut: 'H',
    category: 'navigation'
  },
  {
    id: 'zoom',
    name: 'Zoom',
    icon: ZoomIn,
    shortcut: 'Z',
    category: 'navigation'
  }
];

const NODE_TOOLS: NodeTool[] = [
  // Flowchart nodes
  {
    id: 'start',
    name: 'Início',
    icon: Play,
    category: ['flowchart'],
    color: '#10b981'
  },
  {
    id: 'process',
    name: 'Processo',
    icon: Square,
    category: ['flowchart'],
    color: '#3b82f6'
  },
  {
    id: 'decision',
    name: 'Decisão',
    icon: Diamond,
    category: ['flowchart'],
    color: '#f59e0b'
  },
  {
    id: 'end',
    name: 'Fim',
    icon: StopIcon,
    category: ['flowchart'],
    color: '#ef4444'
  },
  {
    id: 'data',
    name: 'Dados',
    icon: Database,
    category: ['flowchart'],
    color: '#8b5cf6'
  },
  {
    id: 'document',
    name: 'Documento',
    icon: FileText,
    category: ['flowchart'],
    color: '#06b6d4'
  },
  {
    id: 'subprocess',
    name: 'Subprocesso',
    icon: Layers,
    category: ['flowchart'],
    color: '#8b5cf6'
  },
  {
    id: 'gateway',
    name: 'Gateway',
    icon: Diamond,
    category: ['flowchart'],
    color: '#f59e0b'
  },
  {
    id: 'intermediate',
    name: 'Evento Intermediário',
    icon: Circle,
    category: ['flowchart'],
    color: '#06b6d4'
  },
  {
    id: 'annotation',
    name: 'Anotação',
    icon: Type,
    category: ['flowchart'],
    color: '#64748b'
  }
  
  // Mindmap nodes
  {
    id: 'root',
    name: 'Raiz',
    icon: Target,
    category: ['mindmap'],
    color: '#8b5cf6'
  },
  {
    id: 'branch',
    name: 'Ramo',
    icon: GitBranch,
    category: ['mindmap'],
    color: '#06b6d4'
  },
  {
    id: 'leaf',
    name: 'Folha',
    icon: Circle,
    category: ['mindmap'],
    color: '#84cc16'
  },
  {
    id: 'idea',
    name: 'Ideia',
    icon: Lightbulb,
    category: ['mindmap'],
    color: '#f97316'
  },
  
  // Organogram nodes
  {
    id: 'ceo',
    name: 'CEO',
    icon: Users,
    category: ['organogram'],
    color: '#dc2626'
  },
  {
    id: 'director',
    name: 'Diretor',
    icon: Users,
    category: ['organogram'],
    color: '#2563eb'
  },
  {
    id: 'manager',
    name: 'Gerente',
    icon: Users,
    category: ['organogram'],
    color: '#059669'
  },
  {
    id: 'employee',
    name: 'Funcionário',
    icon: Users,
    category: ['organogram'],
    color: '#64748b'
  },
  {
    id: 'department',
    name: 'Departamento',
    icon: Building,
    category: ['organogram'],
    color: '#7c3aed'
  }
];

// ============================================================================
// Component
// ============================================================================

export const DiagramToolPalette: React.FC<DiagramToolPaletteProps> = ({
  diagramType,
  selectedTool,
  selectedNodes,
  selectedEdges,
  hasUnsavedChanges,
  canUndo,
  canRedo,
  showGrid,
  showMinimap,
  onToolSelect,
  onNodeAdd,
  onUndo,
  onRedo,
  onSave,
  onExport,
  onImport,
  onDeleteSelected,
  onDuplicateSelected,
  onToggleGrid,
  onToggleMinimap,
  onFitToView,
  onCenterView,
  onZoomIn,
  onZoomOut,
  className
}) => {
  
  // ============================================================================
  // Filtered Tools
  // ============================================================================
  
  const availableNodeTools = NODE_TOOLS.filter(tool => 
    tool.category.includes(diagramType)
  );
  
  const hasSelection = selectedNodes.length > 0 || selectedEdges.length > 0;
  
  // ============================================================================
  // Render Tool Button
  // ============================================================================
  
  const renderToolButton = (tool: Tool) => {
    const Icon = tool.icon;
    const isSelected = selectedTool === tool.id;
    
    return (
      <TooltipProvider key={tool.id}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={isSelected ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onToolSelect(tool.id)}
              className={cn(
                'h-10 w-10 p-0',
                isSelected && 'bg-primary text-primary-foreground'
              )}
            >
              <Icon className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <div className="flex flex-col gap-1">
              <span className="font-medium">{tool.name}</span>
              {tool.shortcut && (
                <span className="text-xs text-muted-foreground">
                  Tecla: {tool.shortcut}
                </span>
              )}
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };
  
  // ============================================================================
  // Render Node Tool Button
  // ============================================================================
  
  const renderNodeToolButton = (tool: NodeTool) => {
    const Icon = tool.icon;
    
    return (
      <TooltipProvider key={tool.id}>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onNodeAdd(tool.id)}
              className="h-10 w-10 p-0 hover:bg-accent"
              style={{
                '--node-color': tool.color
              } as React.CSSProperties}
            >
              <Icon 
                className="h-4 w-4" 
                style={{ color: tool.color }}
              />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: tool.color }}
              />
              <span className="font-medium">{tool.name}</span>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };
  
  // ============================================================================
  // Render Action Button
  // ============================================================================
  
  const renderActionButton = (
    icon: React.ComponentType<{ className?: string }>,
    label: string,
    onClick: () => void,
    disabled = false,
    variant: 'ghost' | 'destructive' | 'default' = 'ghost',
    badge?: string
  ) => {
    const Icon = icon;
    
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="relative">
              <Button
                variant={variant}
                size="sm"
                onClick={onClick}
                disabled={disabled}
                className="h-10 w-10 p-0"
              >
                <Icon className="h-4 w-4" />
              </Button>
              {badge && (
                <Badge 
                  variant="secondary" 
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 text-xs flex items-center justify-center"
                >
                  {badge}
                </Badge>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">
            <span className="font-medium">{label}</span>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  };
  
  // ============================================================================
  // Render
  // ============================================================================
  
  return (
    <div className={cn(
      'flex flex-col gap-2 p-3 bg-background border-r border-border min-w-[60px]',
      className
    )}>
      
      {/* Selection Tools */}
      <div className="flex flex-col gap-1">
        <div className="text-xs font-medium text-muted-foreground mb-1 px-1">
          Seleção
        </div>
        {TOOLS.filter(tool => tool.category === 'selection').map(renderToolButton)}
      </div>
      
      <Separator />
      
      {/* Creation Tools */}
      <div className="flex flex-col gap-1">
        <div className="text-xs font-medium text-muted-foreground mb-1 px-1">
          Criação
        </div>
        {TOOLS.filter(tool => tool.category === 'creation').map(renderToolButton)}
      </div>
      
      <Separator />
      
      {/* Node Types */}
      <div className="flex flex-col gap-1">
        <div className="text-xs font-medium text-muted-foreground mb-1 px-1">
          {diagramType === 'flowchart' && 'Elementos'}
          {diagramType === 'mindmap' && 'Nós'}
          {diagramType === 'organogram' && 'Cargos'}
        </div>
        {availableNodeTools.map(renderNodeToolButton)}
      </div>
      
      <Separator />
      
      {/* Navigation Tools */}
      <div className="flex flex-col gap-1">
        <div className="text-xs font-medium text-muted-foreground mb-1 px-1">
          Navegação
        </div>
        {TOOLS.filter(tool => tool.category === 'navigation').map(renderToolButton)}
        
        {renderActionButton(ZoomIn, 'Aumentar Zoom', onZoomIn)}
        {renderActionButton(ZoomOut, 'Diminuir Zoom', onZoomOut)}
        {renderActionButton(Target, 'Ajustar à Tela', onFitToView)}
        {renderActionButton(Move, 'Centralizar', onCenterView)}
      </div>
      
      <Separator />
      
      {/* History */}
      <div className="flex flex-col gap-1">
        <div className="text-xs font-medium text-muted-foreground mb-1 px-1">
          Histórico
        </div>
        {renderActionButton(RotateCcw, 'Desfazer', onUndo, !canUndo)}
        {renderActionButton(RotateCw, 'Refazer', onRedo, !canRedo)}
      </div>
      
      <Separator />
      
      {/* Selection Actions */}
      {hasSelection && (
        <>
          <div className="flex flex-col gap-1">
            <div className="text-xs font-medium text-muted-foreground mb-1 px-1">
              Seleção
            </div>
            {renderActionButton(
              Copy, 
              'Duplicar', 
              onDuplicateSelected,
              false,
              'ghost',
              (selectedNodes.length + selectedEdges.length).toString()
            )}
            {renderActionButton(
              Trash2, 
              'Excluir', 
              onDeleteSelected,
              false,
              'destructive',
              (selectedNodes.length + selectedEdges.length).toString()
            )}
          </div>
          <Separator />
        </>
      )}
      
      {/* View Options */}
      <div className="flex flex-col gap-1">
        <div className="text-xs font-medium text-muted-foreground mb-1 px-1">
          Visualização
        </div>
        {renderActionButton(
          Grid, 
          showGrid ? 'Ocultar Grade' : 'Mostrar Grade', 
          onToggleGrid,
          false,
          showGrid ? 'default' : 'ghost'
        )}
        {renderActionButton(
          showMinimap ? EyeOff : Eye, 
          showMinimap ? 'Ocultar Minimapa' : 'Mostrar Minimapa', 
          onToggleMinimap,
          false,
          showMinimap ? 'default' : 'ghost'
        )}
      </div>
      
      <Separator />
      
      {/* File Operations */}
      <div className="flex flex-col gap-1">
        <div className="text-xs font-medium text-muted-foreground mb-1 px-1">
          Arquivo
        </div>
        {renderActionButton(
          Save, 
          'Salvar', 
          onSave,
          false,
          hasUnsavedChanges ? 'default' : 'ghost'
        )}
        {renderActionButton(Download, 'Exportar', onExport)}
        {renderActionButton(Upload, 'Importar', onImport)}
      </div>
      
      {/* Unsaved Changes Indicator */}
      {hasUnsavedChanges && (
        <div className="mt-2 px-1">
          <Badge variant="outline" className="text-xs">
            Não salvo
          </Badge>
        </div>
      )}
    </div>
  );
};

export default DiagramToolPalette;