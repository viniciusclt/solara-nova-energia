import React, { useState } from 'react';
import { PlaybookBlock } from '../../types/editor';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { 
  Columns, 
  Plus, 
  Trash2, 
  Settings,
  GripVertical,
  MoreHorizontal
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { BlockRenderer } from '../BlockRenderer';

interface ColumnBlockProps {
  block: PlaybookBlock;
  onUpdate: (blockId: string, updates: Partial<PlaybookBlock>) => void;
  onDelete: (blockId: string) => void;
  onAddBlock: (afterBlockId: string, type: string) => void;
  isSelected: boolean;
  onSelect: (blockId: string) => void;
}

interface Column {
  id: string;
  width: number; // Porcentagem da largura
  blocks: PlaybookBlock[];
}

export const ColumnBlock: React.FC<ColumnBlockProps> = ({
  block,
  onUpdate,
  onDelete,
  onAddBlock,
  isSelected,
  onSelect
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [draggedColumn, setDraggedColumn] = useState<number | null>(null);

  const columns = (block.content.columns as Column[]) || [
    { id: 'col-1', width: 50, blocks: [] },
    { id: 'col-2', width: 50, blocks: [] }
  ];

  const columnCount = columns.length;
  const gap = block.styling?.gap || 16;
  const alignment = block.styling?.alignment || 'top';

  const addColumn = () => {
    if (columnCount >= 4) return; // Máximo de 4 colunas
    
    const newWidth = Math.floor(100 / (columnCount + 1));
    const adjustedColumns = columns.map(col => ({
      ...col,
      width: newWidth
    }));
    
    const newColumn: Column = {
      id: `col-${Date.now()}`,
      width: newWidth,
      blocks: []
    };
    
    onUpdate(block.id, {
      content: { 
        ...block.content, 
        columns: [...adjustedColumns, newColumn] 
      }
    });
  };

  const removeColumn = (columnIndex: number) => {
    if (columnCount <= 2) return; // Mínimo de 2 colunas
    
    const newColumns = columns.filter((_, index) => index !== columnIndex);
    const newWidth = Math.floor(100 / newColumns.length);
    
    const adjustedColumns = newColumns.map(col => ({
      ...col,
      width: newWidth
    }));
    
    onUpdate(block.id, {
      content: { 
        ...block.content, 
        columns: adjustedColumns 
      }
    });
  };

  const updateColumnWidth = (columnIndex: number, width: number) => {
    const newColumns = [...columns];
    const oldWidth = newColumns[columnIndex].width;
    const difference = width - oldWidth;
    
    newColumns[columnIndex].width = width;
    
    // Ajusta as outras colunas proporcionalmente
    const otherColumns = newColumns.filter((_, index) => index !== columnIndex);
    const totalOtherWidth = otherColumns.reduce((sum, col) => sum + col.width, 0);
    
    if (totalOtherWidth > 0) {
      otherColumns.forEach((col, index) => {
        const proportion = col.width / totalOtherWidth;
        const adjustment = difference * proportion;
        const actualIndex = newColumns.findIndex(c => c.id === col.id);
        newColumns[actualIndex].width = Math.max(10, col.width - adjustment);
      });
    }
    
    // Normaliza para garantir que a soma seja 100%
    const totalWidth = newColumns.reduce((sum, col) => sum + col.width, 0);
    if (totalWidth !== 100) {
      const factor = 100 / totalWidth;
      newColumns.forEach(col => {
        col.width = col.width * factor;
      });
    }
    
    onUpdate(block.id, {
      content: { 
        ...block.content, 
        columns: newColumns 
      }
    });
  };

  const addBlockToColumn = (columnIndex: number, blockType: string) => {
    const newBlock: PlaybookBlock = {
      id: `block-${Date.now()}`,
      type: blockType as PlaybookBlock['type'],
      content: { text: '' },
      styling: {},
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };
    
    const newColumns = [...columns];
    newColumns[columnIndex].blocks.push(newBlock);
    
    onUpdate(block.id, {
      content: { 
        ...block.content, 
        columns: newColumns 
      }
    });
  };

  const updateBlockInColumn = (columnIndex: number, blockId: string, updates: Partial<PlaybookBlock>) => {
    const newColumns = [...columns];
    const blockIndex = newColumns[columnIndex].blocks.findIndex(b => b.id === blockId);
    
    if (blockIndex !== -1) {
      newColumns[columnIndex].blocks[blockIndex] = {
        ...newColumns[columnIndex].blocks[blockIndex],
        ...updates
      };
      
      onUpdate(block.id, {
        content: { 
          ...block.content, 
          columns: newColumns 
        }
      });
    }
  };

  const deleteBlockFromColumn = (columnIndex: number, blockId: string) => {
    const newColumns = [...columns];
    newColumns[columnIndex].blocks = newColumns[columnIndex].blocks.filter(b => b.id !== blockId);
    
    onUpdate(block.id, {
      content: { 
        ...block.content, 
        columns: newColumns 
      }
    });
  };

  const handleSettingChange = (key: string, value: string | number) => {
    onUpdate(block.id, {
      styling: { ...block.styling, [key]: value }
    });
  };

  const SettingsPanel = () => (
    <div className="space-y-4 p-4 w-80">
      <div>
        <Label>Espaçamento entre colunas</Label>
        <Slider
          value={[gap]}
          onValueChange={([value]) => handleSettingChange('gap', value)}
          max={48}
          min={0}
          step={4}
          className="mt-2"
        />
        <div className="text-sm text-gray-500 mt-1">{gap}px</div>
      </div>
      
      <div>
        <Label>Alinhamento vertical</Label>
        <Select
          value={alignment}
          onValueChange={(value) => handleSettingChange('alignment', value)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="top">Topo</SelectItem>
            <SelectItem value="center">Centro</SelectItem>
            <SelectItem value="bottom">Base</SelectItem>
            <SelectItem value="stretch">Esticar</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label>Largura das colunas</Label>
        <div className="space-y-2 mt-2">
          {columns.map((column, index) => (
            <div key={column.id} className="flex items-center gap-2">
              <span className="text-sm w-16">Col {index + 1}:</span>
              <Slider
                value={[column.width]}
                onValueChange={([value]) => updateColumnWidth(index, value)}
                max={80}
                min={10}
                step={5}
                className="flex-1"
              />
              <span className="text-sm w-12">{Math.round(column.width)}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const ColumnActions = ({ columnIndex }: { columnIndex: number }) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100"
        >
          <MoreHorizontal className="h-3 w-3" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48 p-2">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => addBlockToColumn(columnIndex, 'paragraph')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar parágrafo
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => addBlockToColumn(columnIndex, 'heading')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar título
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => addBlockToColumn(columnIndex, 'bulleted-list')}
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar lista
          </Button>
          {columnCount > 2 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-red-600"
              onClick={() => removeColumn(columnIndex)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remover coluna
            </Button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );

  return (
    <div className="group relative">
      {/* Toolbar de ações do bloco */}
      <div className="absolute -left-12 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 z-10">
        <Popover open={showSettings} onOpenChange={setShowSettings}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              <Settings className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" side="left">
            <SettingsPanel />
          </PopoverContent>
        </Popover>
        
        {columnCount < 4 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={addColumn}
            className="h-6 w-6 p-0"
            title="Adicionar coluna"
          >
            <Plus className="h-3 w-3" />
          </Button>
        )}
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(block.id)}
          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Conteúdo das colunas */}
      <div className={cn('ml-2', {
        'ring-2 ring-blue-500 ring-opacity-50 rounded p-2': isSelected
      })}>
        <div 
          className="flex"
          style={{ 
            gap: `${gap}px`,
            alignItems: alignment === 'center' ? 'center' : 
                      alignment === 'bottom' ? 'flex-end' : 
                      alignment === 'stretch' ? 'stretch' : 'flex-start'
          }}
        >
          {columns.map((column, columnIndex) => (
            <div
              key={column.id}
              className="group/column relative min-h-[100px] border border-dashed border-gray-200 rounded p-2"
              style={{ 
                width: `${column.width}%`,
                minHeight: alignment === 'stretch' ? 'auto' : '100px'
              }}
              onClick={() => onSelect(block.id)}
            >
              {/* Header da coluna */}
              <div className="flex items-center justify-between mb-2 opacity-0 group-hover/column:opacity-100 transition-opacity">
                <div className="flex items-center gap-1">
                  <GripVertical className="h-3 w-3 text-gray-400" />
                  <span className="text-xs text-gray-500">Coluna {columnIndex + 1}</span>
                </div>
                <ColumnActions columnIndex={columnIndex} />
              </div>
              
              {/* Blocos da coluna */}
              <div className="space-y-2">
                {column.blocks.map((columnBlock) => (
                  <BlockRenderer
                    key={columnBlock.id}
                    block={columnBlock}
                    onUpdate={(blockId, updates) => updateBlockInColumn(columnIndex, blockId, updates)}
                    onDelete={(blockId) => deleteBlockFromColumn(columnIndex, blockId)}
                    onAddBlock={(afterBlockId, type) => addBlockToColumn(columnIndex, type)}
                    isSelected={false}
                    onSelect={() => {}}
                  />
                ))}
                
                {/* Placeholder quando vazio */}
                {column.blocks.length === 0 && (
                  <div className="text-center py-8 text-gray-400">
                    <Columns className="h-8 w-8 mx-auto mb-2" />
                    <p className="text-sm">Clique no menu para adicionar conteúdo</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};