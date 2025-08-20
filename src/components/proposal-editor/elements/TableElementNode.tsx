import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { cn } from '../../../lib/utils';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../ui/dialog';
import {
  Table,
  Settings,
  Trash2,
  Plus,
  Minus,
  Edit3,
  MoreHorizontal,
  MoreVertical
} from 'lucide-react';
import type { ProposalElement, TableProperties } from '../../../types/proposal-editor';

interface TableElementData {
  element: ProposalElement;
  isSelected: boolean;
  onUpdate: (updates: Partial<ProposalElement>) => void;
  onDelete: () => void;
  onSelect: () => void;
}

const DEFAULT_TABLE_DATA = {
  headers: ['Coluna 1', 'Coluna 2', 'Coluna 3'],
  rows: [
    ['Linha 1, Col 1', 'Linha 1, Col 2', 'Linha 1, Col 3'],
    ['Linha 2, Col 1', 'Linha 2, Col 2', 'Linha 2, Col 3'],
    ['Linha 3, Col 1', 'Linha 3, Col 2', 'Linha 3, Col 3']
  ]
};

export const TableElementNode: React.FC<NodeProps<TableElementData>> = ({
  data
}) => {
  const { element, isSelected, onUpdate, onDelete, onSelect } = data;
  const properties = element.properties as TableProperties;
  
  const [showDataDialog, setShowDataDialog] = useState(false);
  const [editingData, setEditingData] = useState(properties.data || DEFAULT_TABLE_DATA);
  const [editingCell, setEditingCell] = useState<{row: number, col: number} | null>(null);
  const [cellValue, setCellValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const updateProperty = (key: keyof TableProperties, value: string | number | boolean | string[][]) => {
    onUpdate({
      properties: {
        ...properties,
        [key]: value
      }
    });
  };

  const tableData = properties.data || DEFAULT_TABLE_DATA;

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  const startEditing = (row: number, col: number, currentValue: string) => {
    setEditingCell({ row, col });
    setCellValue(currentValue);
  };

  const saveCell = () => {
    if (editingCell) {
      const newData = { ...tableData };
      if (editingCell.row === -1) {
        // Editando header
        newData.headers[editingCell.col] = cellValue;
      } else {
        // Editando célula
        newData.rows[editingCell.row][editingCell.col] = cellValue;
      }
      updateProperty('data', newData);
    }
    setEditingCell(null);
    setCellValue('');
  };

  const cancelEditing = () => {
    setEditingCell(null);
    setCellValue('');
  };

  const addColumn = () => {
    const newData = { ...editingData };
    newData.headers.push(`Coluna ${newData.headers.length + 1}`);
    newData.rows = newData.rows.map(row => [...row, '']);
    setEditingData(newData);
  };

  const removeColumn = (colIndex: number) => {
    if (editingData.headers.length > 1) {
      const newData = { ...editingData };
      newData.headers.splice(colIndex, 1);
      newData.rows = newData.rows.map(row => {
        const newRow = [...row];
        newRow.splice(colIndex, 1);
        return newRow;
      });
      setEditingData(newData);
    }
  };

  const addRow = () => {
    const newData = { ...editingData };
    const newRow = new Array(newData.headers.length).fill('');
    newData.rows.push(newRow);
    setEditingData(newData);
  };

  const removeRow = (rowIndex: number) => {
    if (editingData.rows.length > 1) {
      const newData = { ...editingData };
      newData.rows.splice(rowIndex, 1);
      setEditingData(newData);
    }
  };

  const updateEditingCell = (row: number, col: number, value: string) => {
    const newData = { ...editingData };
    if (row === -1) {
      newData.headers[col] = value;
    } else {
      newData.rows[row][col] = value;
    }
    setEditingData(newData);
  };

  const saveTableData = () => {
    updateProperty('data', editingData);
    setShowDataDialog(false);
  };

  const getTableStyle = () => {
    return {
      fontSize: `${properties.fontSize || 14}px`,
      color: properties.textColor || '#333',
      backgroundColor: properties.backgroundColor || '#fff'
    };
  };

  const getHeaderStyle = () => {
    return {
      backgroundColor: properties.headerBackgroundColor || '#f5f5f5',
      color: properties.headerTextColor || '#333',
      fontWeight: properties.headerBold ? 'bold' : 'normal'
    };
  };

  const getCellStyle = () => {
    return {
      borderColor: properties.borderColor || '#ddd',
      borderWidth: `${properties.borderWidth || 1}px`
    };
  };

  return (
    <div
      className={cn(
        'relative bg-white border-2 border-transparent rounded-lg overflow-hidden',
        'hover:border-blue-300 transition-colors',
        isSelected && 'border-blue-500 shadow-lg',
        'group cursor-pointer'
      )}
      onClick={onSelect}
      style={{
        width: element.position.width,
        height: element.position.height
      }}
    >
      {/* Handles para conexões */}
      <Handle
        type="target"
        position={Position.Top}
        className="opacity-0 group-hover:opacity-100"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="opacity-0 group-hover:opacity-100"
      />

      {/* Conteúdo da tabela */}
      <div className="w-full h-full overflow-auto p-2" style={getTableStyle()}>
        <table className="w-full h-full border-collapse">
          <thead>
            <tr>
              {tableData.headers.map((header, colIndex) => (
                <th
                  key={colIndex}
                  className="border p-2 text-left cursor-pointer hover:bg-gray-50"
                  style={{ ...getCellStyle(), ...getHeaderStyle() }}
                  onClick={() => {
                    if (isSelected) {
                      startEditing(-1, colIndex, header);
                    }
                  }}
                >
                  {editingCell?.row === -1 && editingCell?.col === colIndex ? (
                    <input
                      ref={inputRef}
                      value={cellValue}
                      onChange={(e) => setCellValue(e.target.value)}
                      onBlur={saveCell}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveCell();
                        if (e.key === 'Escape') cancelEditing();
                      }}
                      className="w-full bg-transparent border-none outline-none"
                    />
                  ) : (
                    header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {tableData.rows.map((row, rowIndex) => (
              <tr key={rowIndex}>
                {row.map((cell, colIndex) => (
                  <td
                    key={colIndex}
                    className="border p-2 cursor-pointer hover:bg-gray-50"
                    style={getCellStyle()}
                    onClick={() => {
                      if (isSelected) {
                        startEditing(rowIndex, colIndex, cell);
                      }
                    }}
                  >
                    {editingCell?.row === rowIndex && editingCell?.col === colIndex ? (
                      <input
                        ref={inputRef}
                        value={cellValue}
                        onChange={(e) => setCellValue(e.target.value)}
                        onBlur={saveCell}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') saveCell();
                          if (e.key === 'Escape') cancelEditing();
                        }}
                        className="w-full bg-transparent border-none outline-none"
                      />
                    ) : (
                      cell || '\u00A0' // Non-breaking space para células vazias
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Toolbar de edição */}
      {isSelected && (
        <div className="absolute -top-12 left-0 flex items-center space-x-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-1 z-10">
          {/* Editar estrutura */}
          <Dialog open={showDataDialog} onOpenChange={setShowDataDialog}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title="Editar tabela"
                onClick={() => setEditingData(tableData)}
              >
                <Edit3 className="h-3 w-3" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden">
              <DialogHeader>
                <DialogTitle>Editar tabela</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {/* Controles de estrutura */}
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addColumn}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar coluna
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addRow}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar linha
                  </Button>
                </div>
                
                {/* Tabela editável */}
                <div className="border rounded-lg overflow-auto max-h-96">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr>
                        <th className="w-8"></th>
                        {editingData.headers.map((header, colIndex) => (
                          <th key={colIndex} className="border p-2 bg-gray-50 relative">
                            <Input
                              value={header}
                              onChange={(e) => updateEditingCell(-1, colIndex, e.target.value)}
                              className="border-none bg-transparent text-center font-medium"
                            />
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeColumn(colIndex)}
                              disabled={editingData.headers.length <= 1}
                              className="absolute -top-2 -right-2 h-6 w-6 p-0 text-red-500 bg-white border rounded-full"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {editingData.rows.map((row, rowIndex) => (
                        <tr key={rowIndex}>
                          <td className="w-8 p-1 text-center bg-gray-50 border relative">
                            <span className="text-xs text-gray-500">{rowIndex + 1}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeRow(rowIndex)}
                              disabled={editingData.rows.length <= 1}
                              className="absolute -top-2 -left-2 h-6 w-6 p-0 text-red-500 bg-white border rounded-full"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                          </td>
                          {row.map((cell, colIndex) => (
                            <td key={colIndex} className="border p-1">
                              <Input
                                value={cell}
                                onChange={(e) => updateEditingCell(rowIndex, colIndex, e.target.value)}
                                className="border-none bg-transparent"
                              />
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowDataDialog(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={saveTableData}>
                    Salvar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Configurações */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Settings className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Configurações da Tabela</h4>
                
                <div>
                  <Label className="text-xs font-medium">Tamanho da fonte</Label>
                  <Input
                    type="number"
                    value={properties.fontSize || 14}
                    onChange={(e) => updateProperty('fontSize', parseInt(e.target.value))}
                    min="8"
                    max="24"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label className="text-xs font-medium">Cor do texto</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <input
                      type="color"
                      value={properties.textColor || '#333333'}
                      onChange={(e) => updateProperty('textColor', e.target.value)}
                      className="w-8 h-8 rounded border"
                    />
                    <Input
                      value={properties.textColor || '#333333'}
                      onChange={(e) => updateProperty('textColor', e.target.value)}
                      className="flex-1 text-xs"
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="text-xs font-medium">Cor de fundo</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <input
                      type="color"
                      value={properties.backgroundColor || '#ffffff'}
                      onChange={(e) => updateProperty('backgroundColor', e.target.value)}
                      className="w-8 h-8 rounded border"
                    />
                    <Input
                      value={properties.backgroundColor || '#ffffff'}
                      onChange={(e) => updateProperty('backgroundColor', e.target.value)}
                      className="flex-1 text-xs"
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="text-xs font-medium">Cor do cabeçalho</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <input
                      type="color"
                      value={properties.headerBackgroundColor || '#f5f5f5'}
                      onChange={(e) => updateProperty('headerBackgroundColor', e.target.value)}
                      className="w-8 h-8 rounded border"
                    />
                    <Input
                      value={properties.headerBackgroundColor || '#f5f5f5'}
                      onChange={(e) => updateProperty('headerBackgroundColor', e.target.value)}
                      className="flex-1 text-xs"
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="text-xs font-medium">Cor da borda</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <input
                      type="color"
                      value={properties.borderColor || '#dddddd'}
                      onChange={(e) => updateProperty('borderColor', e.target.value)}
                      className="w-8 h-8 rounded border"
                    />
                    <Input
                      value={properties.borderColor || '#dddddd'}
                      onChange={(e) => updateProperty('borderColor', e.target.value)}
                      className="flex-1 text-xs"
                    />
                  </div>
                </div>
                
                <div>
                  <Label className="text-xs font-medium">Largura da borda (px)</Label>
                  <Input
                    type="number"
                    value={properties.borderWidth || 1}
                    onChange={(e) => updateProperty('borderWidth', parseInt(e.target.value))}
                    min="0"
                    max="5"
                    className="mt-1"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="header-bold"
                    checked={properties.headerBold || false}
                    onChange={(e) => updateProperty('headerBold', e.target.checked)}
                  />
                  <Label htmlFor="header-bold" className="text-xs">Cabeçalho em negrito</Label>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Deletar */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Indicador de seleção */}
      {isSelected && (
        <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none" />
      )}

      {/* Resize handles */}
      {isSelected && (
        <>
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-se-resize" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-ne-resize" />
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-nw-resize" />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-sw-resize" />
        </>
      )}
    </div>
  );
};

export default TableElementNode;