// ============================================================================
// DiagramToolbar - Barra de ferramentas para edição de diagramas
// ============================================================================

import React, { useCallback, useEffect, useRef, memo } from 'react';
import {
  MousePointer,
  Move,
  Plus,
  Minus,
  RotateCcw,
  RotateCw,
  Download,
  Upload,
  Save,
  Grid,
  Eye,
  EyeOff,
  Map,
  Settings,
  Trash2,
  Copy,
  Scissors,
  Clipboard,
  ZoomIn,
  ZoomOut,
  Maximize,
  Hand
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { secureLogger } from '@/utils/secureLogger';
import {
  DiagramToolbarProps,
  EditorMode,
  DiagramType,
  ConnectionLineType
} from '../types';
import {
  useDiagramStore,
  useDiagramEditor,
  useDiagramUI,
  useDiagramHistory
} from '../stores/useDiagramStore';
import {
  useKeyboardNavigation,
  useFocusManagement,
  useAnnouncer
} from '../accessibility';

// ============================================================================
// Configurações de Zoom
// ============================================================================

const ZOOM_LEVELS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4];
const DEFAULT_ZOOM = 1;

// ============================================================================
// Componente Principal
// ============================================================================

export const DiagramToolbar: React.FC<DiagramToolbarProps> = memo(({
  onExport,
  onImport,
  onSave,
  className
}) => {
  // ============================================================================
  // Store e Estado
  // ============================================================================

  const editor = useDiagramEditor();
  const ui = useDiagramUI();
  const history = useDiagramHistory();
  
  // ============================================================================
  // Refs e Acessibilidade
  // ============================================================================
  
  const toolbarRef = useRef<HTMLDivElement>(null);
  const { announce } = useAnnouncer();
  
  const {
    registerFocusable,
    unregisterFocusable
  } = useFocusManagement();
  
  const {
    setEditorMode,
    setConnectionLineType,
    setSnapToGrid,
    setGridSize,
    toggleGrid,
    toggleControls,
    toggleMinimap,
    undo,
    redo,
    zoomIn,
    zoomOut,
    zoomToFit,
    resetZoom,
    deleteSelectedElements,
    copySelectedElements,
    cutSelectedElements,
    pasteElements
  } = useDiagramStore();

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleModeChange = useCallback((mode: EditorMode) => {
    setEditorMode(mode);
    secureLogger.info('Modo do editor alterado', { mode });
  }, [setEditorMode]);

  const handleConnectionTypeChange = useCallback((type: string) => {
    setConnectionLineType(type as ConnectionLineType);
    secureLogger.info('Tipo de conexão alterado', { type });
  }, [setConnectionLineType]);

  const handleGridSizeChange = useCallback((size: string) => {
    const gridSize = parseInt(size, 10);
    setGridSize(gridSize);
    secureLogger.info('Tamanho da grade alterado', { gridSize });
  }, [setGridSize]);

  const handleExport = useCallback(() => {
    if (onExport) {
      onExport();
      secureLogger.info('Exportação iniciada via toolbar');
    }
  }, [onExport]);

  const handleImport = useCallback(() => {
    if (onImport) {
      onImport();
      secureLogger.info('Importação iniciada via toolbar');
    }
  }, [onImport]);

  const handleSave = useCallback(() => {
    if (onSave) {
      onSave();
      announce('Salvamento iniciado');
      secureLogger.info('Salvamento iniciado via toolbar');
    }
  }, [onSave, announce]);

  const handleUndo = useCallback(() => {
    undo();
    announce('Ação desfeita');
    secureLogger.info('Undo executado');
  }, [undo, announce]);

  const handleRedo = useCallback(() => {
    redo();
    announce('Ação refeita');
    secureLogger.info('Redo executado');
  }, [redo, announce]);

  const handleDelete = useCallback(() => {
    const totalSelected = ui.selectedNodes.length + ui.selectedEdges.length;
    deleteSelectedElements();
    announce(`${totalSelected} elemento${totalSelected !== 1 ? 's' : ''} deletado${totalSelected !== 1 ? 's' : ''}`);
    secureLogger.info('Elementos selecionados deletados');
  }, [deleteSelectedElements, announce, ui.selectedNodes.length, ui.selectedEdges.length]);

  const handleCopy = useCallback(() => {
    copySelectedElements();
    const totalSelected = ui.selectedNodes.length + ui.selectedEdges.length;
    announce(`${totalSelected} elemento${totalSelected !== 1 ? 's' : ''} copiado${totalSelected !== 1 ? 's' : ''}`);
    secureLogger.info('Elementos selecionados copiados');
  }, [copySelectedElements, announce, ui.selectedNodes.length, ui.selectedEdges.length]);

  const handleCut = useCallback(() => {
    cutSelectedElements();
    const totalSelected = ui.selectedNodes.length + ui.selectedEdges.length;
    announce(`${totalSelected} elemento${totalSelected !== 1 ? 's' : ''} cortado${totalSelected !== 1 ? 's' : ''}`);
    secureLogger.info('Elementos selecionados cortados');
  }, [cutSelectedElements, announce, ui.selectedNodes.length, ui.selectedEdges.length]);

  const handlePaste = useCallback(() => {
    pasteElements();
    announce('Elementos colados');
    secureLogger.info('Elementos colados');
  }, [pasteElements, announce]);

  // ============================================================================
  // Componentes de Botão com Tooltip
  // ============================================================================

  const ToolbarButton: React.FC<{
    icon: React.ReactNode;
    tooltip: string;
    onClick: () => void;
    active?: boolean;
    disabled?: boolean;
    variant?: 'default' | 'outline' | 'ghost';
  }> = ({ icon, tooltip, onClick, active, disabled, variant = 'ghost' }) => (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant={active ? 'default' : variant}
          size="sm"
          onClick={onClick}
          disabled={disabled}
          className={cn(
            'h-8 w-8 p-0',
            active && 'bg-primary text-primary-foreground'
          )}
        >
          {icon}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );

  // ============================================================================
  // Render
  // ============================================================================

  // ============================================================================
  // Efeitos de Acessibilidade
  // ============================================================================
  
  useEffect(() => {
    if (toolbarRef.current) {
      registerFocusable(toolbarRef.current, {
        id: 'diagram-toolbar',
        priority: 1,
        description: 'Barra de ferramentas do diagrama'
      });
      
      return () => {
        unregisterFocusable('diagram-toolbar');
      };
    }
  }, [registerFocusable, unregisterFocusable]);

  return (
    <TooltipProvider>
      <div 
        ref={toolbarRef}
        className={cn(
          'flex items-center gap-2 p-2 bg-background border-b border-border',
          className
        )}
        role="toolbar"
        aria-label="Ferramentas do diagrama"
      >
        {/* Grupo: Modos de Edição */}
        <div className="flex items-center gap-1">
          <ToolbarButton
            icon={<MousePointer className="h-4 w-4" />}
            tooltip="Modo Seleção (V)"
            onClick={() => handleModeChange('select')}
            active={editor.mode === 'select'}
          />
          <ToolbarButton
            icon={<Hand className="h-4 w-4" />}
            tooltip="Modo Pan (H)"
            onClick={() => handleModeChange('pan')}
            active={editor.mode === 'pan'}
          />
          <ToolbarButton
            icon={<Plus className="h-4 w-4" />}
            tooltip="Modo Conexão (C)"
            onClick={() => handleModeChange('connect')}
            active={editor.mode === 'connect'}
          />
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Grupo: Histórico */}
        <div className="flex items-center gap-1">
          <ToolbarButton
            icon={<RotateCcw className="h-4 w-4" />}
            tooltip="Desfazer (Ctrl+Z)"
            onClick={handleUndo}
            disabled={!history.canUndo}
          />
          <ToolbarButton
            icon={<RotateCw className="h-4 w-4" />}
            tooltip="Refazer (Ctrl+Y)"
            onClick={handleRedo}
            disabled={!history.canRedo}
          />
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Grupo: Clipboard */}
        <div className="flex items-center gap-1">
          <ToolbarButton
            icon={<Copy className="h-4 w-4" />}
            tooltip="Copiar (Ctrl+C)"
            onClick={handleCopy}
            disabled={ui.selectedNodes.length === 0 && ui.selectedEdges.length === 0}
          />
          <ToolbarButton
            icon={<Scissors className="h-4 w-4" />}
            tooltip="Cortar (Ctrl+X)"
            onClick={handleCut}
            disabled={ui.selectedNodes.length === 0 && ui.selectedEdges.length === 0}
          />
          <ToolbarButton
            icon={<Clipboard className="h-4 w-4" />}
            tooltip="Colar (Ctrl+V)"
            onClick={handlePaste}
            disabled={!ui.clipboard || ui.clipboard.length === 0}
          />
          <ToolbarButton
            icon={<Trash2 className="h-4 w-4" />}
            tooltip="Deletar (Delete)"
            onClick={handleDelete}
            disabled={ui.selectedNodes.length === 0 && ui.selectedEdges.length === 0}
          />
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Grupo: Zoom */}
        <div className="flex items-center gap-1">
          <ToolbarButton
            icon={<ZoomOut className="h-4 w-4" />}
            tooltip="Diminuir Zoom (-)"
            onClick={zoomOut}
          />
          <Badge variant="outline" className="px-2 py-1 text-xs">
            {Math.round(ui.viewport.zoom * 100)}%
          </Badge>
          <ToolbarButton
            icon={<ZoomIn className="h-4 w-4" />}
            tooltip="Aumentar Zoom (+)"
            onClick={zoomIn}
          />
          <ToolbarButton
            icon={<Maximize className="h-4 w-4" />}
            tooltip="Ajustar à Tela (Ctrl+0)"
            onClick={zoomToFit}
          />
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Grupo: Visualização */}
        <div className="flex items-center gap-1">
          <ToolbarButton
            icon={<Grid className="h-4 w-4" />}
            tooltip="Mostrar/Ocultar Grade"
            onClick={toggleGrid}
            active={ui.showGrid}
          />
          <ToolbarButton
            icon={<Map className="h-4 w-4" />}
            tooltip="Mostrar/Ocultar Minimapa"
            onClick={toggleMinimap}
            active={ui.showMinimap}
          />
          <ToolbarButton
            icon={ui.showControls ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
            tooltip="Mostrar/Ocultar Controles"
            onClick={toggleControls}
            active={ui.showControls}
          />
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Grupo: Configurações */}
        <div className="flex items-center gap-2">
          {/* Tipo de Conexão */}
          <Select
            value={editor.connectionLineType}
            onValueChange={handleConnectionTypeChange}
          >
            <SelectTrigger className="w-24 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Reta</SelectItem>
              <SelectItem value="straight">Direta</SelectItem>
              <SelectItem value="step">Escada</SelectItem>
              <SelectItem value="smoothstep">Suave</SelectItem>
              <SelectItem value="bezier">Bezier</SelectItem>
            </SelectContent>
          </Select>

          {/* Tamanho da Grade */}
          <Select
            value={editor.gridSize.toString()}
            onValueChange={handleGridSizeChange}
          >
            <SelectTrigger className="w-16 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10px</SelectItem>
              <SelectItem value="15">15px</SelectItem>
              <SelectItem value="20">20px</SelectItem>
              <SelectItem value="25">25px</SelectItem>
              <SelectItem value="30">30px</SelectItem>
            </SelectContent>
          </Select>

          {/* Snap to Grid */}
          <ToolbarButton
            icon={<Settings className="h-4 w-4" />}
            tooltip="Snap to Grid"
            onClick={() => setSnapToGrid(!editor.snapToGrid)}
            active={editor.snapToGrid}
          />
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Grupo: Arquivo */}
        <div className="flex items-center gap-1">
          <ToolbarButton
            icon={<Save className="h-4 w-4" />}
            tooltip="Salvar (Ctrl+S)"
            onClick={handleSave}
          />
          <ToolbarButton
            icon={<Upload className="h-4 w-4" />}
            tooltip="Importar"
            onClick={handleImport}
          />
          <ToolbarButton
            icon={<Download className="h-4 w-4" />}
            tooltip="Exportar"
            onClick={handleExport}
          />
        </div>

        {/* Indicador de Status */}
        <div className="ml-auto flex items-center gap-2">
          {ui.selectedNodes.length > 0 && (
            <Badge variant="secondary">
              {ui.selectedNodes.length} nó{ui.selectedNodes.length > 1 ? 's' : ''}
            </Badge>
          )}
          {ui.selectedEdges.length > 0 && (
            <Badge variant="secondary">
              {ui.selectedEdges.length} conexã{ui.selectedEdges.length > 1 ? 'ões' : 'o'}
            </Badge>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
});

export default DiagramToolbar;