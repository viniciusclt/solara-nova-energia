import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Save,
  Undo,
  Redo,
  Download,
  Share2,
  ZoomIn,
  ZoomOut,
  Maximize,
  Grid,
  Ruler,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Copy,
  Paste,
  Trash2,
  RotateCw,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  ChevronDown,
  FileText,
  Image,
  Presentation,
  FileImage,
  FolderOpen,
  Upload,
  Plus
} from 'lucide-react';
import { DocumentFormat, ExportFormat } from '@/types/proposal';
import { cn } from '@/lib/utils';

interface EditorToolbarProps {
  // File operations
  onSave?: () => void;
  onExport?: (format: ExportFormat) => void;
  onShare?: () => void;
  
  // History operations
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  
  // View controls
  zoom: number;
  onZoomChange: (zoom: number) => void;
  format: DocumentFormat;
  onFormatChange?: (format: DocumentFormat) => void;
  
  // Canvas controls
  showGrid?: boolean;
  onShowGridChange?: (show: boolean) => void;
  showRulers?: boolean;
  onShowRulersChange?: (show: boolean) => void;
  snapToGrid?: boolean;
  onSnapToGridChange?: (snap: boolean) => void;
  
  // Element operations
  selectedElementsCount?: number;
  onCopy?: () => void;
  onPaste?: () => void;
  onDelete?: () => void;
  onDuplicate?: () => void;
  onLock?: () => void;
  onUnlock?: () => void;
  onHide?: () => void;
  onShow?: () => void;
  
  // Alignment
  onAlignLeft?: () => void;
  onAlignCenter?: () => void;
  onAlignRight?: () => void;
  onAlignTop?: () => void;
  onAlignMiddle?: () => void;
  onAlignBottom?: () => void;
  
  // State
  readOnly?: boolean;
  isDirty?: boolean;
  
  // Template operations
  onOpenTemplateLibrary?: () => void;
  onOpenTemplateUploader?: () => void;
  onCreateTemplate?: () => void;
}

const ZOOM_LEVELS = [25, 50, 75, 100, 125, 150, 200, 300, 400];

const EXPORT_FORMATS: { value: ExportFormat; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'pdf', label: 'PDF', icon: FileText },
  { value: 'pptx', label: 'PowerPoint', icon: Presentation },
  { value: 'docx', label: 'Word', icon: FileText },
  { value: 'png', label: 'PNG', icon: FileImage },
  { value: 'jpg', label: 'JPEG', icon: Image },
  { value: 'html', label: 'HTML', icon: FileText }
];

const DOCUMENT_FORMATS: { value: DocumentFormat; label: string; dimensions: string }[] = [
  { value: 'A4', label: 'A4', dimensions: '210 × 297 mm' },
  { value: '16:9', label: '16:9', dimensions: '1920 × 1080 px' },
  { value: 'A3', label: 'A3', dimensions: '297 × 420 mm' },
  { value: 'Letter', label: 'Letter', dimensions: '8.5 × 11 in' }
];

const EditorToolbar: React.FC<EditorToolbarProps> = ({
  onSave,
  onExport,
  onShare,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  zoom,
  onZoomChange,
  format,
  onFormatChange,
  showGrid = true,
  onShowGridChange,
  showRulers = true,
  onShowRulersChange,
  snapToGrid = true,
  onSnapToGridChange,
  selectedElementsCount = 0,
  onCopy,
  onPaste,
  onDelete,
  onDuplicate,
  onLock,
  onUnlock,
  onHide,
  onShow,
  onAlignLeft,
  onAlignCenter,
  onAlignRight,
  onAlignTop,
  onAlignMiddle,
  onAlignBottom,
  readOnly = false,
  isDirty = false,
  onOpenTemplateLibrary,
  onOpenTemplateUploader,
  onCreateTemplate
}) => {
  const handleZoomIn = () => {
    const currentIndex = ZOOM_LEVELS.indexOf(zoom);
    if (currentIndex < ZOOM_LEVELS.length - 1) {
      onZoomChange(ZOOM_LEVELS[currentIndex + 1]);
    }
  };

  const handleZoomOut = () => {
    const currentIndex = ZOOM_LEVELS.indexOf(zoom);
    if (currentIndex > 0) {
      onZoomChange(ZOOM_LEVELS[currentIndex - 1]);
    }
  };

  const handleZoomFit = () => {
    onZoomChange(100);
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-2 flex items-center gap-2 flex-wrap">
      {/* File Operations */}
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          onClick={onSave}
          disabled={readOnly || !isDirty}
          className="gap-2"
        >
          <Save className="w-4 h-4" />
          Salvar
          {isDirty && <Badge variant="destructive" className="ml-1 h-4 px-1 text-xs">•</Badge>}
        </Button>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="sm" variant="outline" className="gap-2">
              <Download className="w-4 h-4" />
              Exportar
              <ChevronDown className="w-3 h-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {EXPORT_FORMATS.map(({ value, label, icon: Icon }) => (
              <DropdownMenuItem key={value} onClick={() => onExport?.(value)}>
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
        
        <Button size="sm" onClick={onShare} disabled={readOnly} className="gap-2">
          <Share2 className="w-4 h-4" />
          Compartilhar
        </Button>
      </div>
      
      <Separator orientation="vertical" className="h-6" />
      
      {/* Template Operations */}
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="outline"
          onClick={onOpenTemplateLibrary}
          className="gap-2"
        >
          <FolderOpen className="w-4 h-4" />
          Templates
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={onOpenTemplateUploader}
          disabled={readOnly}
          className="gap-2"
        >
          <Upload className="w-4 h-4" />
          Upload
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={onCreateTemplate}
          disabled={readOnly}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Criar
        </Button>
      </div>
      
      <Separator orientation="vertical" className="h-6" />
      
      {/* History Operations */}
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="outline"
          onClick={onUndo}
          disabled={!canUndo || readOnly}
          title="Desfazer (Ctrl+Z)"
        >
          <Undo className="w-4 h-4" />
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={onRedo}
          disabled={!canRedo || readOnly}
          title="Refazer (Ctrl+Y)"
        >
          <Redo className="w-4 h-4" />
        </Button>
      </div>
      
      <Separator orientation="vertical" className="h-6" />
      
      {/* Zoom Controls */}
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant="outline"
          onClick={handleZoomOut}
          disabled={zoom <= ZOOM_LEVELS[0]}
          title="Diminuir zoom"
        >
          <ZoomOut className="w-4 h-4" />
        </Button>
        
        <Select value={zoom.toString()} onValueChange={(value) => onZoomChange(Number(value))}>
          <SelectTrigger className="w-20 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ZOOM_LEVELS.map(level => (
              <SelectItem key={level} value={level.toString()}>
                {level}%
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button
          size="sm"
          variant="outline"
          onClick={handleZoomIn}
          disabled={zoom >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
          title="Aumentar zoom"
        >
          <ZoomIn className="w-4 h-4" />
        </Button>
        
        <Button
          size="sm"
          variant="outline"
          onClick={handleZoomFit}
          title="Ajustar à tela"
        >
          <Maximize className="w-4 h-4" />
        </Button>
      </div>
      
      <Separator orientation="vertical" className="h-6" />
      
      {/* Document Format */}
      <div className="flex items-center gap-2">
        <Label className="text-sm font-medium">Formato:</Label>
        <Select value={format} onValueChange={onFormatChange} disabled={readOnly}>
          <SelectTrigger className="w-32 h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {DOCUMENT_FORMATS.map(({ value, label, dimensions }) => (
              <SelectItem key={value} value={value}>
                <div className="flex flex-col">
                  <span>{label}</span>
                  <span className="text-xs text-gray-500">{dimensions}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Separator orientation="vertical" className="h-6" />
      
      {/* Canvas Controls */}
      <div className="flex items-center gap-1">
        <Button
          size="sm"
          variant={showGrid ? "default" : "outline"}
          onClick={() => onShowGridChange?.(!showGrid)}
          title="Mostrar/ocultar grade"
        >
          <Grid className="w-4 h-4" />
        </Button>
        
        <Button
          size="sm"
          variant={showRulers ? "default" : "outline"}
          onClick={() => onShowRulersChange?.(!showRulers)}
          title="Mostrar/ocultar réguas"
        >
          <Ruler className="w-4 h-4" />
        </Button>
        
        <Button
          size="sm"
          variant={snapToGrid ? "default" : "outline"}
          onClick={() => onSnapToGridChange?.(!snapToGrid)}
          title="Encaixar na grade"
          disabled={!showGrid}
        >
          <div className="w-4 h-4 border border-current grid grid-cols-2 grid-rows-2" />
        </Button>
      </div>
      
      {/* Element Operations - Show only when elements are selected */}
      {selectedElementsCount > 0 && !readOnly && (
        <>
          <Separator orientation="vertical" className="h-6" />
          
          <div className="flex items-center gap-1">
            <Badge variant="secondary" className="text-xs">
              {selectedElementsCount} selecionado{selectedElementsCount > 1 ? 's' : ''}
            </Badge>
            
            <Button size="sm" variant="outline" onClick={onCopy} title="Copiar (Ctrl+C)">
              <Copy className="w-4 h-4" />
            </Button>
            
            <Button size="sm" variant="outline" onClick={onPaste} title="Colar (Ctrl+V)">
              <Paste className="w-4 h-4" />
            </Button>
            
            <Button size="sm" variant="outline" onClick={onDuplicate} title="Duplicar (Ctrl+D)">
              <Copy className="w-4 h-4" />
            </Button>
            
            <Button size="sm" variant="outline" onClick={onDelete} title="Excluir (Delete)">
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          
          <Separator orientation="vertical" className="h-6" />
          
          {/* Alignment Controls */}
          <div className="flex items-center gap-1">
            <Button size="sm" variant="outline" onClick={onAlignLeft} title="Alinhar à esquerda">
              <AlignLeft className="w-4 h-4" />
            </Button>
            
            <Button size="sm" variant="outline" onClick={onAlignCenter} title="Centralizar">
              <AlignCenter className="w-4 h-4" />
            </Button>
            
            <Button size="sm" variant="outline" onClick={onAlignRight} title="Alinhar à direita">
              <AlignRight className="w-4 h-4" />
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default EditorToolbar;