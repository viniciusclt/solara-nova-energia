import React, { useState, useRef, useEffect } from 'react';
import { PlaybookBlock } from '../../types/editor';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Table, 
  Plus, 
  Trash2, 
  Settings,
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface TableBlockProps {
  block: PlaybookBlock;
  onUpdate: (blockId: string, updates: Partial<PlaybookBlock>) => void;
  onDelete: (blockId: string) => void;
  onAddBlock: (afterBlockId: string, type: string) => void;
  isSelected: boolean;
  onSelect: (blockId: string) => void;
}

interface TableRow {
  cells: string[];
}

export const TableBlock: React.FC<TableBlockProps> = ({
  block,
  onUpdate,
  onDelete,
  onAddBlock,
  isSelected,
  onSelect
}) => {
  const [editingCell, setEditingCell] = useState<{ row: number; col: number } | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[][]>([]);

  const rows = (block.content.rows as TableRow[]) || [
    { cells: ['', ''] },
    { cells: ['', ''] }
  ];

  const hasHeader = block.styling?.hasHeader || false;
  const borderStyle = block.styling?.borderStyle || 'bordered';
  const alignment = block.styling?.textAlign || 'left';

  useEffect(() => {
    if (editingCell && inputRefs.current[editingCell.row]?.[editingCell.col]) {
      const input = inputRefs.current[editingCell.row][editingCell.col];
      input?.focus();
      input?.select();
    }
  }, [editingCell]);

  const updateCell = (rowIndex: number, colIndex: number, value: string) => {
    const newRows = [...rows];
    newRows[rowIndex].cells[colIndex] = value;
    onUpdate(block.id, {
      content: { ...block.content, rows: newRows }
    });
  };

  const addRow = (position?: number) => {
    const newRows = [...rows];
    const colCount = rows[0]?.cells.length || 2;
    const newRow = { cells: new Array(colCount).fill('') };
    
    if (position !== undefined) {
      newRows.splice(position + 1, 0, newRow);
    } else {
      newRows.push(newRow);
    }
    
    onUpdate(block.id, {
      content: { ...block.content, rows: newRows }
    });
  };

  const removeRow = (rowIndex: number) => {
    if (rows.length <= 1) return;
    
    const newRows = rows.filter((_, index) => index !== rowIndex);
    onUpdate(block.id, {
      content: { ...block.content, rows: newRows }
    });
  };

  const addColumn = (position?: number) => {
    const newRows = rows.map(row => {
      const newCells = [...row.cells];
      if (position !== undefined) {
        newCells.splice(position + 1, 0, '');
      } else {
        newCells.push('');
      }
      return { cells: newCells };
    });
    
    onUpdate(block.id, {
      content: { ...block.content, rows: newRows }
    });
  };

  const removeColumn = (colIndex: number) => {
    if (rows[0]?.cells.length <= 1) return;
    
    const newRows = rows.map(row => ({
      cells: row.cells.filter((_, index) => index !== colIndex)
    }));
    
    onUpdate(block.id, {
      content: { ...block.content, rows: newRows }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent, rowIndex: number, colIndex: number) => {
    switch (e.key) {
      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) {
          // Move para a célula anterior
          if (colIndex > 0) {
            setEditingCell({ row: rowIndex, col: colIndex - 1 });
          } else if (rowIndex > 0) {
            setEditingCell({ row: rowIndex - 1, col: rows[rowIndex - 1].cells.length - 1 });
          }
        } else {
          // Move para a próxima célula
          if (colIndex < rows[rowIndex].cells.length - 1) {
            setEditingCell({ row: rowIndex, col: colIndex + 1 });
          } else if (rowIndex < rows.length - 1) {
            setEditingCell({ row: rowIndex + 1, col: 0 });
          } else {
            // Adiciona nova linha se estiver na última célula
            addRow();
            setTimeout(() => {
              setEditingCell({ row: rows.length, col: 0 });
            }, 0);
          }
        }
        break;
        
      case 'Enter':
        e.preventDefault();
        if (rowIndex < rows.length - 1) {
          setEditingCell({ row: rowIndex + 1, col: colIndex });
        } else {
          addRow();
          setTimeout(() => {
            setEditingCell({ row: rows.length, col: colIndex });
          }, 0);
        }
        break;
        
      case 'ArrowUp':
        if (rowIndex > 0) {
          e.preventDefault();
          setEditingCell({ row: rowIndex - 1, col: colIndex });
        }
        break;
        
      case 'ArrowDown':
        if (rowIndex < rows.length - 1) {
          e.preventDefault();
          setEditingCell({ row: rowIndex + 1, col: colIndex });
        }
        break;
        
      case 'ArrowLeft':
        if (e.target && (e.target as HTMLInputElement).selectionStart === 0 && colIndex > 0) {
          e.preventDefault();
          setEditingCell({ row: rowIndex, col: colIndex - 1 });
        }
        break;
        
      case 'ArrowRight':
        if (e.target && (e.target as HTMLInputElement).selectionStart === (e.target as HTMLInputElement).value.length && colIndex < rows[rowIndex].cells.length - 1) {
          e.preventDefault();
          setEditingCell({ row: rowIndex, col: colIndex + 1 });
        }
        break;
        
      case 'Escape':
        setEditingCell(null);
        break;
    }
  };

  const handleSettingChange = (key: string, value: string | boolean) => {
    onUpdate(block.id, {
      styling: { ...block.styling, [key]: value }
    });
  };

  const SettingsPanel = () => (
    <div className="space-y-4 p-4 w-80">
      <div className="flex items-center justify-between">
        <Label>Linha de cabeçalho</Label>
        <Switch
          checked={hasHeader}
          onCheckedChange={(checked) => handleSettingChange('hasHeader', checked)}
        />
      </div>
      
      <div>
        <Label>Estilo da borda</Label>
        <Select
          value={borderStyle}
          onValueChange={(value) => handleSettingChange('borderStyle', value)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="bordered">Com bordas</SelectItem>
            <SelectItem value="minimal">Mínimal</SelectItem>
            <SelectItem value="none">Sem bordas</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label>Alinhamento</Label>
        <Select
          value={alignment}
          onValueChange={(value) => handleSettingChange('textAlign', value)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Esquerda</SelectItem>
            <SelectItem value="center">Centro</SelectItem>
            <SelectItem value="right">Direita</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const CellActions = ({ rowIndex, colIndex }: { rowIndex: number; colIndex: number }) => (
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
            onClick={() => addRow(rowIndex)}
          >
            <ArrowDown className="h-4 w-4 mr-2" />
            Inserir linha abaixo
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => addColumn(colIndex)}
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            Inserir coluna à direita
          </Button>
          {rows.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-red-600"
              onClick={() => removeRow(rowIndex)}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remover linha
            </Button>
          )}
          {rows[0]?.cells.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-start text-red-600"
              onClick={() => removeColumn(colIndex)}
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
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(block.id)}
          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Conteúdo da tabela */}
      <div className={cn('ml-2 overflow-x-auto', {
        'ring-2 ring-blue-500 ring-opacity-50 rounded p-2': isSelected
      })}>
        <table className={cn('w-full', {
          'border-collapse border border-gray-300': borderStyle === 'bordered',
          'border-collapse': borderStyle === 'minimal',
          'border-separate border-spacing-0': borderStyle === 'none'
        })}>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr key={rowIndex} className="group/row">
                {row.cells.map((cell, colIndex) => {
                  const isHeader = hasHeader && rowIndex === 0;
                  const isEditing = editingCell?.row === rowIndex && editingCell?.col === colIndex;
                  
                  if (!inputRefs.current[rowIndex]) {
                    inputRefs.current[rowIndex] = [];
                  }
                  
                  return (
                    <td
                      key={colIndex}
                      className={cn(
                        'relative p-2 min-w-[100px] group/cell',
                        {
                          'border border-gray-300': borderStyle === 'bordered',
                          'border-b border-gray-200': borderStyle === 'minimal',
                          'font-semibold bg-gray-50': isHeader,
                          'text-left': alignment === 'left',
                          'text-center': alignment === 'center',
                          'text-right': alignment === 'right'
                        }
                      )}
                      onClick={() => {
                        setEditingCell({ row: rowIndex, col: colIndex });
                        onSelect(block.id);
                      }}
                    >
                      {isEditing ? (
                        <Input
                          ref={(el) => {
                            if (inputRefs.current[rowIndex]) {
                              inputRefs.current[rowIndex][colIndex] = el;
                            }
                          }}
                          value={cell}
                          onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                          onBlur={() => setEditingCell(null)}
                          onKeyDown={(e) => handleKeyDown(e, rowIndex, colIndex)}
                          className="border-none shadow-none p-0 h-auto focus-visible:ring-0"
                          placeholder={isHeader ? 'Cabeçalho' : 'Célula'}
                        />
                      ) : (
                        <div className="min-h-[1.5rem] cursor-text">
                          {cell || (
                            <span className="text-gray-400">
                              {isHeader ? 'Cabeçalho' : 'Célula'}
                            </span>
                          )}
                        </div>
                      )}
                      
                      {/* Ações da célula */}
                      <div className="absolute top-1 right-1">
                        <CellActions rowIndex={rowIndex} colIndex={colIndex} />
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        
        {/* Botões para adicionar linha/coluna */}
        <div className="flex gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => addRow()}
            className="text-gray-500 hover:text-gray-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar linha
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => addColumn()}
            className="text-gray-500 hover:text-gray-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Adicionar coluna
          </Button>
        </div>
      </div>
    </div>
  );
};