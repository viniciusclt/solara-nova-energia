import React from 'react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import {
  Undo,
  Redo,
  Save,
  Download,
  Eye,
  Grid3X3,
  Ruler,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Copy,
  Trash2,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  MoveUp,
  MoveDown,
  Lock,
  Unlock,
  Layers
} from 'lucide-react';
import { EditorState } from './types';

interface ToolbarProps {
  editorState: EditorState;
  onUndo: () => void;
  onRedo: () => void;
  onSave: () => void;
  onExport: () => void;
  onPreview: () => void;
  onZoomChange: (zoom: number) => void;
  onGridToggle: () => void;
  onRulerToggle: () => void;
  onCopy: () => void;
  onDelete: () => void;
  onAlign: (alignment: 'left' | 'center' | 'right' | 'justify') => void;
  onLayerMove: (direction: 'up' | 'down') => void;
  onLockToggle: () => void;
  canUndo: boolean;
  canRedo: boolean;
  hasSelection: boolean;
  isLocked: boolean;
}

export function Toolbar({
  editorState,
  onUndo,
  onRedo,
  onSave,
  onExport,
  onPreview,
  onZoomChange,
  onGridToggle,
  onRulerToggle,
  onCopy,
  onDelete,
  onAlign,
  onLayerMove,
  onLockToggle,
  canUndo,
  canRedo,
  hasSelection,
  isLocked
}: ToolbarProps) {
  const zoomOptions = [
    { value: 0.25, label: '25%' },
    { value: 0.5, label: '50%' },
    { value: 0.75, label: '75%' },
    { value: 1, label: '100%' },
    { value: 1.25, label: '125%' },
    { value: 1.5, label: '150%' },
    { value: 2, label: '200%' }
  ];

  const handleZoomIn = () => {
    const currentIndex = zoomOptions.findIndex(option => option.value === editorState.zoom);
    if (currentIndex < zoomOptions.length - 1) {
      onZoomChange(zoomOptions[currentIndex + 1].value);
    }
  };

  const handleZoomOut = () => {
    const currentIndex = zoomOptions.findIndex(option => option.value === editorState.zoom);
    if (currentIndex > 0) {
      onZoomChange(zoomOptions[currentIndex - 1].value);
    }
  };

  const handleZoomReset = () => {
    onZoomChange(1);
  };

  return (
    <TooltipProvider>
      <div className="flex items-center gap-2 p-2 bg-white border-b border-gray-200">
        {/* File Operations */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onSave}
                className="h-8 w-8 p-0"
              >
                <Save className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Salvar (Ctrl+S)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onExport}
                className="h-8 w-8 p-0"
              >
                <Download className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Exportar PDF</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onPreview}
                className="h-8 w-8 p-0"
              >
                <Eye className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Visualizar</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* History Operations */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onUndo}
                disabled={!canUndo}
                className="h-8 w-8 p-0"
              >
                <Undo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Desfazer (Ctrl+Z)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onRedo}
                disabled={!canRedo}
                className="h-8 w-8 p-0"
              >
                <Redo className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Refazer (Ctrl+Y)</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Component Operations */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onCopy}
                disabled={!hasSelection}
                className="h-8 w-8 p-0"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Duplicar (Ctrl+D)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                disabled={!hasSelection}
                className="h-8 w-8 p-0"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Excluir (Delete)</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={onLockToggle}
                disabled={!hasSelection}
                className="h-8 w-8 p-0"
              >
                {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isLocked ? 'Desbloquear' : 'Bloquear'}</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Alignment */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAlign('left')}
                disabled={!hasSelection}
                className="h-8 w-8 p-0"
              >
                <AlignLeft className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Alinhar à esquerda</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAlign('center')}
                disabled={!hasSelection}
                className="h-8 w-8 p-0"
              >
                <AlignCenter className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Centralizar</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAlign('right')}
                disabled={!hasSelection}
                className="h-8 w-8 p-0"
              >
                <AlignRight className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Alinhar à direita</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onAlign('justify')}
                disabled={!hasSelection}
                className="h-8 w-8 p-0"
              >
                <AlignJustify className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Justificar</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Layer Operations */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onLayerMove('up')}
                disabled={!hasSelection}
                className="h-8 w-8 p-0"
              >
                <MoveUp className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Trazer para frente</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onLayerMove('down')}
                disabled={!hasSelection}
                className="h-8 w-8 p-0"
              >
                <MoveDown className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Enviar para trás</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* View Options */}
        <div className="flex items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={editorState.showGrid ? 'default' : 'ghost'}
                size="sm"
                onClick={onGridToggle}
                className="h-8 w-8 p-0"
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Mostrar grade</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={editorState.showRulers ? 'default' : 'ghost'}
                size="sm"
                onClick={onRulerToggle}
                className="h-8 w-8 p-0"
              >
                <Ruler className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Mostrar réguas</p>
            </TooltipContent>
          </Tooltip>
        </div>

        <Separator orientation="vertical" className="h-6" />

        {/* Zoom Controls */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomOut}
                disabled={editorState.zoom <= zoomOptions[0].value}
                className="h-8 w-8 p-0"
              >
                <ZoomOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Diminuir zoom</p>
            </TooltipContent>
          </Tooltip>

          <Select
            value={editorState.zoom.toString()}
            onValueChange={(value) => onZoomChange(parseFloat(value))}
          >
            <SelectTrigger className="w-20 h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {zoomOptions.map((option) => (
                <SelectItem key={option.value} value={option.value.toString()}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomIn}
                disabled={editorState.zoom >= zoomOptions[zoomOptions.length - 1].value}
                className="h-8 w-8 p-0"
              >
                <ZoomIn className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Aumentar zoom</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleZoomReset}
                className="h-8 w-8 p-0"
              >
                <RotateCcw className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Resetar zoom (100%)</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Status Info */}
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <div className="flex items-center gap-1">
            <Layers className="h-4 w-4" />
            <span>{editorState.components.length} componentes</span>
          </div>
          
          {hasSelection && (
            <div>
              Selecionado: {editorState.selectedComponentId}
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}