import React from 'react';
import { useDragDrop } from './DragDropProvider';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Grid3X3, 
  Move, 
  MousePointer, 
  Square, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  Copy,
  Trash2,
  Undo,
  Redo,
  Save,
  Download,
  Upload,
  Settings,
  Eye,
  EyeOff,
  Lock,
  Unlock
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';

interface DragDropToolbarProps {
  onSave?: () => void;
  onLoad?: () => void;
  onExport?: () => void;
  onImport?: () => void;
  className?: string;
}

export const DragDropToolbar: React.FC<DragDropToolbarProps> = ({
  onSave,
  onLoad,
  onExport,
  onImport,
  className
}) => {
  const {
    selectedItems,
    showGrid,
    snapToGrid,
    gridSize,
    canUndo,
    canRedo,
    toggleGrid,
    toggleSnapToGrid,
    setGridSize,
    undo,
    redo,
    clearSelection,
    selectAll,
    duplicateItems,
    deleteItems,
    alignItems,
    distributeItems,
    groupItems,
    ungroupItems,
    lockItems,
    unlockItems,
    showItems,
    hideItems
  } = useDragDrop();

  const hasSelection = selectedItems.length > 0;
  const hasMultipleSelection = selectedItems.length > 1;

  const handleAlign = (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (hasMultipleSelection) {
      alignItems(selectedItems, alignment);
    }
  };

  const handleDistribute = (distribution: 'horizontal' | 'vertical' | 'grid') => {
    if (hasMultipleSelection) {
      distributeItems('', distribution); // Empty containerId means use current container
    }
  };

  return (
    <div className={`flex items-center gap-2 p-2 bg-white border-b ${className}`}>
      {/* File Operations */}
      <div className="flex items-center gap-1">
        {onSave && (
          <Button variant="ghost" size="sm" onClick={onSave}>
            <Save className="h-4 w-4" />
          </Button>
        )}
        {onLoad && (
          <Button variant="ghost" size="sm" onClick={onLoad}>
            <Upload className="h-4 w-4" />
          </Button>
        )}
        {onExport && (
          <Button variant="ghost" size="sm" onClick={onExport}>
            <Download className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Undo/Redo */}
      <div className="flex items-center gap-1">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={undo}
          disabled={!canUndo}
        >
          <Undo className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={redo}
          disabled={!canRedo}
        >
          <Redo className="h-4 w-4" />
        </Button>
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Selection */}
      <div className="flex items-center gap-2">
        <Button 
          variant={hasSelection ? "default" : "ghost"} 
          size="sm" 
          onClick={selectAll}
          className="h-8 w-8 p-0"
        >
          <MousePointer className="h-4 w-4" />
        </Button>
        {hasSelection && (
          <>
            <Badge variant="secondary" className="text-xs px-2 py-1">
              {selectedItems.length}
            </Badge>
            <Button variant="ghost" size="sm" onClick={clearSelection} className="h-8 w-8 p-0">
              <MousePointer className="h-4 w-4" />
            </Button>
          </>
        )}
      </div>

      <Separator orientation="vertical" className="h-6" />

      {/* Item Operations */}
      {hasSelection && (
        <>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => duplicateItems(selectedItems)}
              className="h-8 w-8 p-0"
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => deleteItems(selectedItems)}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />

          {/* Visibility and Lock */}
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => showItems(selectedItems)}
              className="h-8 w-8 p-0"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => hideItems(selectedItems)}
              className="h-8 w-8 p-0"
            >
              <EyeOff className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => lockItems(selectedItems)}
              className="h-8 w-8 p-0"
            >
              <Lock className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => unlockItems(selectedItems)}
              className="h-8 w-8 p-0"
            >
              <Unlock className="h-4 w-4" />
            </Button>
          </div>

          <Separator orientation="vertical" className="h-6" />
        </>
      )}

      {/* Alignment */}
      {hasMultipleSelection && (
        <>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <AlignLeft className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Alinhamento</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleAlign('left')}>
                <AlignLeft className="h-4 w-4 mr-2" />
                Esquerda
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAlign('center')}>
                <AlignCenter className="h-4 w-4 mr-2" />
                Centro
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAlign('right')}>
                <AlignRight className="h-4 w-4 mr-2" />
                Direita
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleAlign('top')}>
                <AlignVerticalJustifyStart className="h-4 w-4 mr-2" />
                Topo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAlign('middle')}>
                <AlignVerticalJustifyCenter className="h-4 w-4 mr-2" />
                Meio
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleAlign('bottom')}>
                <AlignVerticalJustifyEnd className="h-4 w-4 mr-2" />
                Base
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Distribution */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Move className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuLabel>Distribuição</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => handleDistribute('horizontal')}>
                Horizontal
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDistribute('vertical')}>
                Vertical
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleDistribute('grid')}>
                <Grid3X3 className="h-4 w-4 mr-2" />
                Grade
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Separator orientation="vertical" className="h-6" />
        </>
      )}

      {/* Grid Settings */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant={showGrid ? "default" : "ghost"} 
            size="sm"
            className="h-8 w-8 p-0"
          >
            <Grid3X3 className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-64">
          <DropdownMenuLabel>Configurações da Grade</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuCheckboxItem
            checked={showGrid}
            onCheckedChange={toggleGrid}
          >
            Mostrar Grade
          </DropdownMenuCheckboxItem>
          
          <DropdownMenuCheckboxItem
            checked={snapToGrid}
            onCheckedChange={toggleSnapToGrid}
          >
            Encaixar na Grade
          </DropdownMenuCheckboxItem>
          
          <DropdownMenuSeparator />
          
          <div className="px-2 py-2">
            <Label className="text-xs font-medium">Tamanho da Grade</Label>
            <div className="mt-2 px-2">
              <Slider
                value={[gridSize]}
                onValueChange={([value]) => setGridSize(value)}
                min={10}
                max={50}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>10px</span>
                <span>{gridSize}px</span>
                <span>50px</span>
              </div>
            </div>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Settings */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <Settings className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>Configurações</DropdownMenuLabel>
          <DropdownMenuSeparator />
          
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Exportar</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={onExport}>
                JSON
              </DropdownMenuItem>
              <DropdownMenuItem>
                PNG
              </DropdownMenuItem>
              <DropdownMenuItem>
                SVG
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
          
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Importar</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={onImport}>
                JSON
              </DropdownMenuItem>
              <DropdownMenuItem>
                Imagem
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};