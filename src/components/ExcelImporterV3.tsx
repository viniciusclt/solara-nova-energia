import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Upload, 
  Download, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle,
  Undo2,
  Redo2,
  Plus,
  Trash2,
  Copy,
  Filter,
  SortAsc,
  SortDesc,
  Settings
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';
import { useDropzone } from 'react-dropzone';
import {
  useReactTable,
  getCoreRowModel,
  getFilteredRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  ColumnDef,
  SortingState,
  ColumnFiltersState
} from '@tanstack/react-table';
import { z } from 'zod';
import _ from 'lodash';
import useUndo from 'use-undo';

// Schema de validação para Financial Kits
const FinancialKitSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  power: z.number().positive("Potência deve ser positiva"),
  price: z.number().positive("Preço deve ser positivo"),
  price_per_wp: z.number().positive("Preço por Wp deve ser positivo"),
  manufacturer: z.string().min(1, "Fabricante é obrigatório"),
  category: z.enum(["Residencial", "Comercial", "Industrial"]),
  description: z.string().optional(),
  is_active: z.boolean().default(true)
});

type FinancialKitData = z.infer<typeof FinancialKitSchema>;

interface ExcelRow {
  id: string;
  [key: string]: unknown;
}

interface ValidationError {
  row: number;
  column: string;
  message: string;
  severity: 'error' | 'warning';
}

interface ExcelImporterV3Props {
  onDataImported?: (data: unknown[]) => void;
  maxFileSize?: number;
  allowedFileTypes?: string[];
}

const ExcelImporterV3: React.FC<ExcelImporterV3Props> = ({
  onDataImported,
  maxFileSize = 10,
  allowedFileTypes = ['.xlsx', '.xls', '.csv']
}) => {
  const [currentTab, setCurrentTab] = useState('upload');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [fileName, setFileName] = useState('');
  
  // Estado do grid de dados com undo/redo
  const [
    gridState,
    {
      set: setGridData,
      undo,
      redo,
      canUndo,
      canRedo,
      reset: resetGridData
    }
  ] = useUndo<ExcelRow[]>([]);
  
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  const [editingCell, setEditingCell] = useState<{row: number, column: string} | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  
  // Templates pré-definidos
  const templates = useMemo(() => ({
    financial_kits: {
      name: 'Kits Financeiros',
      columns: ['name', 'power', 'price', 'price_per_wp', 'manufacturer', 'category', 'description'],
      schema: FinancialKitSchema
    },
    solar_modules: {
      name: 'Módulos Solares',
      columns: ['name', 'power', 'efficiency', 'manufacturer', 'technology', 'warranty'],
      schema: z.object({
        name: z.string().min(1),
        power: z.number().positive(),
        efficiency: z.number().min(0).max(100),
        manufacturer: z.string().min(1),
        technology: z.string(),
        warranty: z.number().positive()
      })
    }
  }), []);
  
  const [selectedTemplate, setSelectedTemplate] = useState<keyof typeof templates>('financial_kits');
  
  // Configuração do dropzone
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (!file) return;
    
    setFileName(file.name);
    setIsLoading(true);
    setUploadProgress(0);
    
    try {
      // Simular progresso de upload
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);
      
      // Ler arquivo Excel/CSV
      const data = await readExcelFile(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Processar dados
      const processedData = data.map((row, index) => ({
        id: `row-${index}`,
        ...row
      }));
      
      setGridData(processedData);
      setCurrentTab('edit');
      
      toast({
        title: "Arquivo Carregado",
        description: `${processedData.length} linhas importadas com sucesso.`
      });
      
    } catch (error: unknown) {
      console.error('Erro ao processar arquivo:', error);
      const errorMessage = error instanceof Error ? error.message : "Erro ao processar o arquivo.";
      toast({
        title: "Erro na Importação",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [setGridData]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    maxSize: maxFileSize * 1024 * 1024,
    multiple: false
  });
  
  // Função para ler arquivo Excel
  const readExcelFile = async (file: File): Promise<unknown[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
          
          // Converter para formato de objeto
          const [headers, ...rows] = jsonData as unknown[][];
          const result = rows.map(row => {
            const obj: Record<string, unknown> = {};
            headers.forEach((header: string, index: number) => {
              obj[header] = row[index] || '';
            });
            return obj;
          });
          
          resolve(result);
        } catch (error) {
          reject(new Error('Erro ao processar arquivo Excel'));
        }
      };
      
      reader.onerror = () => reject(new Error('Erro ao ler arquivo'));
      reader.readAsArrayBuffer(file);
    });
  };
  
  // Validação de dados
  const validateData = useCallback((data: ExcelRow[]) => {
    const errors: ValidationError[] = [];
    const schema = templates[selectedTemplate].schema;
    
    data.forEach((row, index) => {
      try {
        schema.parse(row);
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'errors' in error) {
          (error as { errors: Array<{ path: string[]; message: string }> }).errors.forEach((err) => {
            errors.push({
              row: index + 1,
              column: err.path[0],
              message: err.message,
              severity: 'error'
            });
          });
        }
      }
    });
    
    setValidationErrors(errors);
    return errors;
  }, [selectedTemplate, templates]);
  
  // Configuração das colunas da tabela
  const columns = useMemo(() => {
    if (gridState.present.length === 0) return [];
    
    const dataKeys = Object.keys(gridState.present[0]).filter(key => key !== 'id');
    const columnHelper = createColumnHelper<ExcelRow>();
    
    return dataKeys.map(key => 
      columnHelper.accessor(key, {
        header: key,
        cell: ({ getValue, row, column }) => {
          const value = getValue();
          const isEditing = editingCell?.row === row.index && editingCell?.column === column.id;
          
          if (isEditing) {
            return (
              <Input
                defaultValue={value}
                onBlur={(e) => {
                  updateCellValue(row.index, column.id, e.target.value);
                  setEditingCell(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    updateCellValue(row.index, column.id, e.currentTarget.value);
                    setEditingCell(null);
                  }
                  if (e.key === 'Escape') {
                    setEditingCell(null);
                  }
                }}
                autoFocus
                className="h-8"
              />
            );
          }
          
          return (
            <div
              className="cursor-pointer p-1 hover:bg-gray-100 rounded"
              onDoubleClick={() => setEditingCell({ row: row.index, column: column.id })}
            >
              {value}
            </div>
          );
        }
      })
    );
  }, [gridState.present, editingCell, updateCellValue]);
  
  // Atualizar valor da célula
  const updateCellValue = useCallback((rowIndex: number, columnId: string, value: string) => {
    const newData = [...gridState.present];
    newData[rowIndex] = { ...newData[rowIndex], [columnId]: value };
    setGridData(newData);
  }, [gridState.present, setGridData]);
  
  // Configuração da tabela
  const table = useReactTable({
    data: gridState.present,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
      columnFilters
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters
  });
  
  // Adicionar nova linha
  const addNewRow = () => {
    const newRow: ExcelRow = {
      id: `row-${Date.now()}`,
      ...Object.fromEntries(
        Object.keys(gridState.present[0] || {}).filter(k => k !== 'id').map(k => [k, ''])
      )
    };
    setGridData([...gridState.present, newRow]);
  };
  
  // Remover linhas selecionadas
  const removeSelectedRows = () => {
    const newData = gridState.present.filter(row => !selectedRows.has(row.id));
    setGridData(newData);
    setSelectedRows(new Set());
  };
  
  // Duplicar linhas selecionadas
  const duplicateSelectedRows = () => {
    const rowsToDuplicate = gridState.present.filter(row => selectedRows.has(row.id));
    const duplicatedRows = rowsToDuplicate.map(row => ({
      ...row,
      id: `row-${Date.now()}-${Math.random()}`
    }));
    setGridData([...gridState.present, ...duplicatedRows]);
    setSelectedRows(new Set());
  };
  
  // Exportar dados
  const exportData = (format: 'csv' | 'xlsx') => {
    const ws = XLSX.utils.json_to_sheet(gridState.present.map(({id, ...rest}) => rest));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Data');
    
    const fileName = `exported_data.${format}`;
    XLSX.writeFile(wb, fileName);
    
    toast({
      title: "Exportação Concluída",
      description: `Dados exportados para ${fileName}`
    });
  };
  
  // Finalizar importação
  const finalizeImport = async () => {
    const errors = validateData(gridState.present);
    
    if (errors.filter(e => e.severity === 'error').length > 0) {
      toast({
        title: "Erros de Validação",
        description: "Corrija os erros antes de finalizar a importação.",
        variant: "destructive"
      });
      setCurrentTab('validate');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Aqui você implementaria a lógica de salvamento no banco
      // Por exemplo, salvar em kits_financeiros ou solar_modules
      
      if (onDataImported) {
        onDataImported(gridState.present);
      }
      
      toast({
        title: "Importação Concluída",
        description: `${gridState.present.length} registros importados com sucesso.`
      });
      
      // Reset do estado
      resetGridData();
      setCurrentTab('upload');
      setFileName('');
      setValidationErrors([]);
      
    } catch (error: unknown) {
      toast({
        title: "Erro na Importação",
        description: error instanceof Error ? error.message : "Erro ao salvar os dados.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Importador Excel Avançado
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="edit" disabled={gridState.present.length === 0}>
              Editar
            </TabsTrigger>
            <TabsTrigger value="validate" disabled={gridState.present.length === 0}>
              Validar
            </TabsTrigger>
            <TabsTrigger value="import" disabled={gridState.present.length === 0}>
              Importar
            </TabsTrigger>
          </TabsList>
          
          {/* Tab de Upload */}
          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Template</Label>
                <Select value={selectedTemplate} onValueChange={(value: keyof typeof templates) => setSelectedTemplate(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(templates).map(([key, template]) => (
                      <SelectItem key={key} value={key}>
                        {template.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">
                  {isDragActive ? 'Solte o arquivo aqui' : 'Arraste um arquivo ou clique para selecionar'}
                </p>
                <p className="text-sm text-gray-500">
                  Suporte para Excel (.xlsx, .xls) e CSV (máx. {maxFileSize}MB)
                </p>
              </div>
              
              {isLoading && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processando {fileName}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} />
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Tab de Edição */}
          <TabsContent value="edit" className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={undo}
                  disabled={!canUndo}
                >
                  <Undo2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={redo}
                  disabled={!canRedo}
                >
                  <Redo2 className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addNewRow}
                >
                  <Plus className="h-4 w-4" />
                  Adicionar
                </Button>
                {selectedRows.size > 0 && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={duplicateSelectedRows}
                    >
                      <Copy className="h-4 w-4" />
                      Duplicar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={removeSelectedRows}
                    >
                      <Trash2 className="h-4 w-4" />
                      Remover
                    </Button>
                  </>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportData('csv')}
                >
                  <Download className="h-4 w-4" />
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => exportData('xlsx')}
                >
                  <Download className="h-4 w-4" />
                  Excel
                </Button>
              </div>
            </div>
            
            {gridState.present.length > 0 && (
              <div className="border rounded-lg overflow-auto max-h-96">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    {table.getHeaderGroups().map(headerGroup => (
                      <tr key={headerGroup.id}>
                        <th className="p-2 text-left">
                          <Checkbox
                            checked={selectedRows.size === gridState.present.length}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedRows(new Set(gridState.present.map(row => row.id)));
                              } else {
                                setSelectedRows(new Set());
                              }
                            }}
                          />
                        </th>
                        {headerGroup.headers.map(header => (
                          <th key={header.id} className="p-2 text-left">
                            <div
                              className="flex items-center gap-1 cursor-pointer"
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              {{
                                asc: <SortAsc className="h-4 w-4" />,
                                desc: <SortDesc className="h-4 w-4" />
                              }[header.column.getIsSorted() as string] ?? null}
                            </div>
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody>
                    {table.getRowModel().rows.map(row => (
                      <tr key={row.id} className="border-t hover:bg-gray-50">
                        <td className="p-2">
                          <Checkbox
                            checked={selectedRows.has(row.original.id)}
                            onCheckedChange={(checked) => {
                              const newSelected = new Set(selectedRows);
                              if (checked) {
                                newSelected.add(row.original.id);
                              } else {
                                newSelected.delete(row.original.id);
                              }
                              setSelectedRows(newSelected);
                            }}
                          />
                        </td>
                        {row.getVisibleCells().map(cell => (
                          <td key={cell.id} className="p-2">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
          
          {/* Tab de Validação */}
          <TabsContent value="validate" className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Validação de Dados</h3>
                <Button onClick={() => validateData(gridState.present)}>
                  Revalidar
                </Button>
              </div>
              
              {validationErrors.length === 0 ? (
                <Alert>
                  <CheckCircle2 className="h-4 w-4" />
                  <AlertDescription>
                    Todos os dados estão válidos e prontos para importação.
                  </AlertDescription>
                </Alert>
              ) : (
                <div className="space-y-2">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {validationErrors.filter(e => e.severity === 'error').length} erro(s) encontrado(s).
                    </AlertDescription>
                  </Alert>
                  
                  <div className="max-h-64 overflow-auto border rounded-lg">
                    {validationErrors.map((error, index) => (
                      <div key={index} className="p-3 border-b last:border-b-0">
                        <div className="flex items-center gap-2">
                          <Badge variant={error.severity === 'error' ? 'destructive' : 'secondary'}>
                            {error.severity}
                          </Badge>
                          <span className="text-sm">
                            Linha {error.row}, Coluna {error.column}: {error.message}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </TabsContent>
          
          {/* Tab de Importação */}
          <TabsContent value="import" className="space-y-4">
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Finalizar Importação</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{gridState.present.length}</div>
                    <div className="text-sm text-gray-500">Registros para importar</div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-red-500">
                      {validationErrors.filter(e => e.severity === 'error').length}
                    </div>
                    <div className="text-sm text-gray-500">Erros de validação</div>
                  </CardContent>
                </Card>
              </div>
              
              <Button
                onClick={finalizeImport}
                disabled={isLoading || validationErrors.filter(e => e.severity === 'error').length > 0}
                className="w-full"
              >
                {isLoading ? 'Importando...' : 'Finalizar Importação'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ExcelImporterV3;