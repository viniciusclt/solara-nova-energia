import React, { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Save,
  Download,
  Upload,
  Share2,
  Settings,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Grid,
  Eye,
  EyeOff,
  Layers,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  FileText,
  Image,
  Video,
  Presentation,
} from 'lucide-react';
import { DragDropCanvas } from '../proposal-editor/DragDropCanvas';
import { ElementToolbar } from '../proposal-editor/ElementToolbar';
import { FormatSelector } from '../proposal-editor/FormatSelector';
import { useCanvas } from '../../hooks/useCanvas';
import { useElements } from '../../hooks/useElements';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';
import type { ProposalElement, CanvasData } from '../../types/proposal-editor';

// =====================================================================================
// INTERFACES
// =====================================================================================

interface ShareData {
  proposalId?: string;
  canvasState: CanvasData;
  timestamp: string;
}

interface ProposalEditorProps {
  className?: string;
  proposalId?: string;
  onSave?: (canvasData: CanvasData) => void;
  onExport?: (format: 'pdf' | 'pptx' | 'png') => void;
  onShare?: (shareData: ShareData) => void;
}

// =====================================================================================
// COMPONENTE PRINCIPAL DO EDITOR
// =====================================================================================

export const ProposalEditor: React.FC<ProposalEditorProps> = ({
  className,
  proposalId,
  onSave,
  onExport,
  onShare,
}) => {
  const {
    canvasData,
    selectedElements,
    canUndo,
    canRedo,
    undo,
    redo,
    exportCanvas,
    importCanvas,
    clearCanvas,
  } = useCanvas();
  
  const {
    elements,
    createElement,
    updateElement,
    deleteElement,
  } = useElements();

  // =====================================================================================
  // ESTADO LOCAL
  // =====================================================================================

  const [showGrid, setShowGrid] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [propertiesPanelCollapsed, setPropertiesPanelCollapsed] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [viewport, setViewport] = useState({ x: 0, y: 0 });

  // =====================================================================================
  // HANDLERS DE AÇÕES
  // =====================================================================================

  const handleSave = useCallback(async () => {
    if (isSaving) return;
    
    setIsSaving(true);
    try {
      onSave?.(canvasData);
      toast.success('Proposta salva com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar a proposta');
    } finally {
      setIsSaving(false);
    }
  }, [isSaving, canvasData, onSave]);

  const handleExport = useCallback(async (format: 'pdf' | 'pptx' | 'png') => {
    if (isExporting) return;
    
    setIsExporting(true);
    try {
      await exportCanvas(format);
      onExport?.(format);
      toast.success(`Proposta exportada como ${format.toUpperCase()}!`);
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar a proposta');
    } finally {
      setIsExporting(false);
    }
  }, [isExporting, exportCanvas, onExport]);

  const handleShare = useCallback(() => {
    const shareData = {
      proposalId,
      canvasState: canvasData,
      timestamp: new Date().toISOString(),
    };
    
    onShare?.(shareData);
    toast.success('Link de compartilhamento copiado!');
  }, [proposalId, canvasData, onShare]);

  const handleZoomChange = useCallback((delta: number) => {
    const newZoom = Math.max(0.1, Math.min(5, zoom + delta));
    setZoom(newZoom);
  }, [zoom]);

  const resetViewport = useCallback(() => {
    setZoom(1);
    setViewport({ x: 0, y: 0 });
  }, []);

  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importData = JSON.parse(e.target?.result as string);
        importCanvas(importData);
        toast.success('Arquivo carregado com sucesso!');
      } catch (error) {
        console.error('Erro ao carregar arquivo:', error);
        toast.error('Erro ao carregar o arquivo');
      }
    };
    reader.readAsText(file);
  }, [importCanvas]);

  // =====================================================================================
  // EFEITOS
  // =====================================================================================

  // Auto-save
  useEffect(() => {
    const interval = setInterval(() => {
      if (elements.length > 0) {
        handleSave();
      }
    }, 30000); // Auto-save a cada 30 segundos

    return () => clearInterval(interval);
  }, [elements.length, handleSave]);

  // Atalhos de teclado
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 's':
            event.preventDefault();
            handleSave();
            break;
          case 'z':
            event.preventDefault();
            if (event.shiftKey) {
              redo();
            } else {
              undo();
            }
            break;
          case 'y':
            event.preventDefault();
            redo();
            break;
          case '=':
          case '+':
            event.preventDefault();
            handleZoomChange(0.1);
            break;
          case '-':
            event.preventDefault();
            handleZoomChange(-0.1);
            break;
          case '0':
            event.preventDefault();
            resetViewport();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, undo, redo, handleZoomChange, resetViewport]);

  // =====================================================================================
  // COMPONENTES DE UI
  // =====================================================================================

  const ToolbarButton: React.FC<{
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    onClick: () => void;
    disabled?: boolean;
    active?: boolean;
    loading?: boolean;
  }> = ({ icon: Icon, label, onClick, disabled, active, loading }) => (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
        "hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2",
        active && "bg-blue-100 text-blue-700",
        disabled && "opacity-50 cursor-not-allowed",
        loading && "opacity-75"
      )}
      title={label}
    >
      <Icon className={cn("w-4 h-4", loading && "animate-spin")} />
      <span className="hidden lg:inline">{label}</span>
    </button>
  );

  const ZoomControls = () => (
    <div className="flex items-center space-x-2 bg-white rounded-lg border border-gray-200 px-3 py-2">
      <button
        onClick={() => handleZoomChange(-0.1)}
        className="p-1 hover:bg-gray-100 rounded transition-colors"
        title="Diminuir zoom"
      >
        <ZoomOut className="w-4 h-4" />
      </button>
      
      <span className="text-sm font-medium min-w-[60px] text-center">
        {Math.round(zoom * 100)}%
      </span>
      
      <button
        onClick={() => handleZoomChange(0.1)}
        className="p-1 hover:bg-gray-100 rounded transition-colors"
        title="Aumentar zoom"
      >
        <ZoomIn className="w-4 h-4" />
      </button>
      
      <div className="w-px h-4 bg-gray-300" />
      
      <button
        onClick={resetViewport}
        className="p-1 hover:bg-gray-100 rounded transition-colors"
        title="Resetar visualização"
      >
        <RotateCcw className="w-4 h-4" />
      </button>
    </div>
  );

  // =====================================================================================
  // RENDER PRINCIPAL
  // =====================================================================================

  return (
    <div className={cn("h-screen flex flex-col bg-gray-50", className)}>
      {/* Toolbar Superior */}
      <div className="bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Grupo Esquerdo - Arquivo */}
          <div className="flex items-center space-x-2">
            <ToolbarButton
              icon={Save}
              label="Salvar"
              onClick={handleSave}
              loading={isSaving}
            />
            
            <label className="cursor-pointer">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <div className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-100">
                <Upload className="w-4 h-4" />
                <span className="hidden lg:inline">Abrir</span>
              </div>
            </label>
            
            <div className="relative group">
              <ToolbarButton
                icon={Download}
                label="Exportar"
                onClick={() => {}}
                loading={isExporting}
              />
              
              <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-2 space-y-1 min-w-[120px]">
                  <button
                    onClick={() => handleExport('pdf')}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-100 rounded transition-colors"
                  >
                    <FileText className="w-4 h-4" />
                    <span>PDF</span>
                  </button>
                  
                  <button
                    onClick={() => handleExport('pptx')}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-100 rounded transition-colors"
                  >
                    <Presentation className="w-4 h-4" />
                    <span>PowerPoint</span>
                  </button>
                  
                  <button
                    onClick={() => handleExport('png')}
                    className="w-full flex items-center space-x-2 px-3 py-2 text-sm hover:bg-gray-100 rounded transition-colors"
                  >
                    <Image className="w-4 h-4" />
                    <span>PNG</span>
                  </button>
                </div>
              </div>
            </div>
            
            <ToolbarButton
              icon={Share2}
              label="Compartilhar"
              onClick={handleShare}
            />
          </div>

          {/* Grupo Centro - Edição */}
          <div className="flex items-center space-x-2">
            <ToolbarButton
              icon={Undo}
              label="Desfazer"
              onClick={undo}
              disabled={!canUndo}
            />
            
            <ToolbarButton
              icon={Redo}
              label="Refazer"
              onClick={redo}
              disabled={!canRedo}
            />
            
            <div className="w-px h-6 bg-gray-300" />
            
            <ToolbarButton
              icon={Grid}
              label="Grade"
              onClick={() => setShowGrid(!showGrid)}
              active={showGrid}
            />
          </div>

          {/* Grupo Direito - Visualização */}
          <div className="flex items-center space-x-4">
            <ZoomControls />
            
            <div className="flex items-center space-x-2">
              <span className="text-sm text-gray-600">
                {elements.length} elemento{elements.length !== 1 ? 's' : ''}
              </span>
              
              {selectedElements.length > 0 && (
                <span className="text-sm text-blue-600">
                  ({selectedElements.length} selecionado{selectedElements.length !== 1 ? 's' : ''})
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Área Principal */}
      <div className="flex-1 flex overflow-hidden">
        {/* Toolbar de Elementos */}
        <motion.div
          initial={false}
          animate={{ width: sidebarCollapsed ? 0 : 280 }}
          transition={{ duration: 0.3 }}
          className="overflow-hidden border-r border-gray-200 bg-white"
        >
          <div className="h-full flex flex-col">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-sm font-medium text-gray-900">Elementos</h3>
            </div>
            <ElementToolbar className="flex-1" />
          </div>
        </motion.div>

        {/* Canvas */}
        <div className="flex-1 relative flex flex-col">
          {/* Seletor de Formato */}
          <div className="border-b border-gray-200 bg-white p-4">
            <FormatSelector />
          </div>
          
          {/* Canvas Principal */}
          <div className="flex-1">
            <DragDropCanvas
              showGrid={showGrid}
              className="h-full"
            />
          </div>
          
          {/* Botão de Toggle da Paleta */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute top-4 left-4 p-2 bg-white border border-gray-200 rounded-lg shadow-sm hover:bg-gray-50 transition-colors z-10"
            title={sidebarCollapsed ? 'Mostrar paleta' : 'Ocultar paleta'}
          >
            <Layers className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Barra de Status */}
      <div className="bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex items-center justify-between text-xs text-gray-600">
          <div className="flex items-center space-x-4">
            <span>Canvas: {canvasData.format === 'a4' ? '210 × 297mm' : '1920 × 1080px'}</span>
            <span>Zoom: {Math.round(zoom * 100)}%</span>
            <span>Posição: {Math.round(viewport.x)}, {Math.round(viewport.y)}</span>
          </div>
          
          <div className="flex items-center space-x-4">
            {proposalId && <span>ID: {proposalId}</span>}
            <span>Última modificação: {new Date().toLocaleTimeString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProposalEditor;