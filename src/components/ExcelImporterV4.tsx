import React, { useState, useCallback, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/utils/supabase/client';
import { useDropzone } from 'react-dropzone';
import * as XLSX from 'xlsx';
import { z } from 'zod';
import { logError } from '@/utils/secureLogger';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Download,
  Plus,
  Trash2,
  Copy,
  Undo,
  Redo,
  Filter,
  Search,
  Settings,
  Eye,
  EyeOff,
  RotateCcw,
  Save
} from 'lucide-react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  createColumnHelper,
  SortingState,
  ColumnFiltersState
} from '@tanstack/react-table';
import { debounce } from 'lodash';

// Schemas de validação otimizados
const FinancialKitSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  phone: z.string().min(10, 'Telefone deve ter pelo menos 10 dígitos').optional().or(z.literal('')),
  cpfCnpj: z.string().min(11, 'CPF/CNPJ inválido').optional().or(z.literal('')),
  address: z.string().max(200, 'Endereço muito longo').optional().or(z.literal('')),
  consumoMedio: z.number().min(0, 'Consumo deve ser positivo').max(10000, 'Consumo muito alto'),
  concessionaria: z.string().max(50, 'Nome da concessionária muito longo').optional().or(z.literal('')),
  tipoFornecimento: z.enum(['monofasico', 'bifasico', 'trifasico']).optional(),
  grupo: z.enum(['B1', 'B2', 'B3', 'B4']).optional()
});

const SolarModuleSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(100, 'Nome muito longo'),
  manufacturer: z.string().min(1, 'Fabricante é obrigatório').max(50, 'Nome do fabricante muito longo'),
  power: z.number().min(1, 'Potência deve ser positiva').max(1000, 'Potência muito alta'),
  efficiency: z.number().min(0.1, 'Eficiência muito baixa').max(0.3, 'Eficiência muito alta'),
  voltage: z.number().min(1, 'Voltagem deve ser positiva').max(100, 'Voltagem muito alta'),
  current: z.number().min(0.1, 'Corrente deve ser positiva').max(20, 'Corrente muito alta'),
  price: z.number().min(0, 'Preço deve ser positivo').max(10000, 'Preço muito alto')
});

type DataTemplate = 'financial_kits' | 'solar_modules' | 'custom';

interface ValidationError {
  row: number;
  column: string;
  message: string;
  severity: 'error' | 'warning';
  value?: unknown;
}

interface GridData {
  id: string;
  [key: string]: unknown;
}

interface ExcelImporterV4Props {
  onDataImported: (data: unknown[]) => void;
  template?: DataTemplate;
  maxFileSize?: number;
  allowedFileTypes?: string[];
  batchSize?: number;
}

const ExcelImporterV4: React.FC<ExcelImporterV4Props> = ({
  onDataImported,
  template = 'financial_kits',
  maxFileSize = 10 * 1024 * 1024, // 10MB
  allowedFileTypes = ['.xlsx', '.xls', '.csv'],
  batchSize = 1000
}) => {
  const { toast } = useToast();
  const supabase = createClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Estados principais
  const [currentTab, setCurrentTab] = useState('upload');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedTemplate, setSelectedTemplate] = useState<DataTemplate>(template);
  
  // Estados do grid com otimização de performance
  const [gridData, setGridData] = useState<GridData[]>([]);
  const [originalData, setOriginalData] = useState<GridData[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());
  
  // Estados de filtro e busca
  const [globalFilter, setGlobalFilter] = useState('');
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [hiddenColumns, setHiddenColumns] = useState<Set<string>>(new Set());
  
  // Estados de histórico (undo/redo)
  const [history, setHistory] = useState<GridData[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  
  // Memoização do schema de validação
  const validationSchema = useMemo(() => {
    switch (selectedTemplate) {
      case 'financial_kits':
        return FinancialKitSchema;
      case 'solar_modules':
        return SolarModuleSchema;
      default:
        return z.object({}).passthrough();
    }
  }, [selectedTemplate]);
  
  // Templates de dados
  const dataTemplates = useMemo(() => ({
    financial_kits: {
      name: 'Kits Financeiros',
      description: 'Dados de clientes e consumo energético',
      columns: ['name', 'email', 'phone', 'cpfCnpj', 'address', 'consumoMedio', 'concessionaria', 'tipoFornecimento', 'grupo'],
      sampleData: {
        name: 'João Silva',
        email: 'joao@email.com',
        phone: '11999999999',
        cpfCnpj: '12345678901',
        address: 'Rua das Flores, 123',
        consumoMedio: 350,
        concessionaria: 'CPFL',
        tipoFornecimento: 'bifasico',
        grupo: 'B1'
      }
    },
    solar_modules: {
      name: 'Módulos Solares',
      description: 'Especificações técnicas de módulos fotovoltaicos',
      columns: ['name', 'manufacturer', 'power', 'efficiency', 'voltage', 'current', 'price'],
      sampleData: {
        name: 'Módulo 550W',
        manufacturer: 'Canadian Solar',
        power: 550,
        efficiency: 0.21,
        voltage: 41.2,
        current: 13.35,
        price: 850
      }
    },
    custom: {
      name: 'Personalizado',
      description: 'Template customizável para qualquer tipo de dado',
      columns: [],
      sampleData: {}
    }
  }), []);
  
  // Função de validação otimizada com debounce
  const validateData = useCallback((data: GridData[]) => {
    const errors: ValidationError[] = [];
    
    data.forEach((row, index) => {
      try {
        validationSchema.parse(row);
      } catch (error) {
        if (error instanceof z.ZodError) {
          error.errors.forEach(err => {
            errors.push({
              row: index + 1,
              column: err.path.join('.'),
              message: err.message,
              severity: 'error',
              value: err.path.reduce((obj, key) => obj?.[key], row)
            });
          });
        }
      }
      
      // Validações customizadas
      if (selectedTemplate === 'financial_kits') {
        if (row.email && !row.email.includes('@')) {
          errors.push({
            row: index + 1,
            column: 'email',
            message: 'Email deve conter @',
            severity: 'warning',
            value: row.email
          });
        }
      }
    });
    
    setValidationErrors(errors);
  }, [validationSchema, selectedTemplate]);
  
  // Versão com debounce da função de validação
  const debouncedValidateData = useMemo(
    () => debounce(validateData, 300),
    [validateData]
  );
  
  // Função para processar arquivo com otimização de performance
  const processFile = useCallback(async (file: File) => {
    setIsLoading(true);
    setUploadProgress(0);
    
    try {
      const arrayBuffer = await file.arrayBuffer();
      setUploadProgress(30);
      
      let data: unknown[][];
      
      if (file.name.endsWith('.csv')) {
        const text = new TextDecoder().decode(arrayBuffer);
        const lines = text.split('\n').filter(line => line.trim());
        data = lines.map(line => line.split(',').map(cell => cell.trim().replace(/^"|"$/g, '')));
      } else {
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
      }
      
      setUploadProgress(60);
      
      if (data.length === 0) {
        throw new Error('Arquivo vazio ou formato inválido');
      }
      
      // Processar dados em lotes para melhor performance
      const headers = data[0] as string[];
      const rows = data.slice(1);
      
      const processedData: GridData[] = [];
      const batchCount = Math.ceil(rows.length / batchSize);
      
      for (let i = 0; i < batchCount; i++) {
        const batchStart = i * batchSize;
        const batchEnd = Math.min(batchStart + batchSize, rows.length);
        const batch = rows.slice(batchStart, batchEnd);
        
        const batchProcessed = batch.map((row, index) => {
          const rowData: GridData = {
            id: `row-${batchStart + index + 1}`,
          };
          
          headers.forEach((header, colIndex) => {
            const value = row[colIndex];
            rowData[header] = value;
          });
          
          return rowData;
        });
        
        processedData.push(...batchProcessed);
        setUploadProgress(60 + (i + 1) / batchCount * 30);
        
        // Permitir que a UI atualize entre lotes
        await new Promise(resolve => setTimeout(resolve, 0));
      }
      
      setGridData(processedData);
      setOriginalData([...processedData]);
      
      // Adicionar ao histórico
      setHistory([processedData]);
      setHistoryIndex(0);
      
      setUploadProgress(100);
      setCurrentTab('edit');
      
      // Validar dados após processamento
      debouncedValidateData(processedData);
      
      toast({
        title: 'Arquivo processado com sucesso',
        description: `${processedData.length} registros carregados`,
      });
      
    } catch (error) {
      logError('Erro ao processar arquivo Excel', {
        service: 'ExcelImporterV4',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        template: selectedTemplate,
        action: 'processFile'
      });
      toast({
        title: 'Erro ao processar arquivo',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  }, [batchSize, validateData, toast]);
  
  // Configuração do dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        processFile(acceptedFiles[0]);
      }
    },
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv']
    },
    maxSize: maxFileSize,
    multiple: false
  });
  
  // Funções de manipulação do histórico
  const saveToHistory = useCallback((newData: GridData[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newData]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);
  
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      const previousData = history[historyIndex - 1];
      setGridData([...previousData]);
      setHistoryIndex(historyIndex - 1);
      debouncedValidateData(previousData);
    }
  }, [history, historyIndex, debouncedValidateData]);
  
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const nextData = history[historyIndex + 1];
      setGridData([...nextData]);
      setHistoryIndex(historyIndex + 1);
      debouncedValidateData(nextData);
    }
  }, [history, historyIndex, validateData]);
  
  // Funções de manipulação de dados
  const updateCellValue = useCallback((rowId: string, columnId: string, value: unknown) => {
    const newData = gridData.map(row => 
      row.id === rowId ? { ...row, [columnId]: value } : row
    );
    setGridData(newData);
    saveToHistory(newData);
    debouncedValidateData(newData);
  }, [gridData, saveToHistory, debouncedValidateData]);
  
  const addNewRow = useCallback(() => {
    const newRow: GridData = {
      id: `row-${Date.now()}`,
      ...dataTemplates[selectedTemplate].sampleData
    };
    const newData = [...gridData, newRow];
    setGridData(newData);
    saveToHistory(newData);
  }, [gridData, selectedTemplate, dataTemplates, saveToHistory]);
  
  const removeSelectedRows = useCallback(() => {
    const newData = gridData.filter(row => !selectedRows.has(row.id));
    setGridData(newData);
    setSelectedRows(new Set());
    saveToHistory(newData);
    validateData(newData);
  }, [gridData, selectedRows, saveToHistory, validateData]);
  
  const duplicateSelectedRows = useCallback(() => {
    const rowsToDuplicate = gridData.filter(row => selectedRows.has(row.id));
    const duplicatedRows = rowsToDuplicate.map(row => ({
      ...row,
      id: `row-${Date.now()}-${Math.random()}`
    }));
    const newData = [...gridData, ...duplicatedRows];
    setGridData(newData);
    setSelectedRows(new Set());
    saveToHistory(newData);
  }, [gridData, selectedRows, saveToHistory]);
  
  // Função de exportação
  const exportData = useCallback((format: 'csv' | 'xlsx') => {
    const dataToExport = gridData.map(row => {
      const { id, ...data } = row;
      return data;
    });
    
    if (format === 'csv') {
      const headers = Object.keys(dataToExport[0] || {});
      const csvContent = [
        headers.join(','),
        ...dataToExport.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `export-${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const ws = XLSX.utils.json_to_sheet(dataToExport);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Dados');
      XLSX.writeFile(wb, `export-${Date.now()}.xlsx`);
    }
  }, [gridData]);
  
  // Função de finalização
  const finalizeImport = useCallback(async () => {
    const errorCount = validationErrors.filter(e => e.severity === 'error').length;
    if (errorCount > 0) {
      toast({
        title: 'Existem erros de validação',
        description: `Corrija os ${errorCount} erro(s) antes de importar`,
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const dataToImport = gridData.map(row => {
        const { id, ...data } = row;
        return data;
      });
      
      await onDataImported(dataToImport);
      
      toast({
        title: 'Dados importados com sucesso',
        description: `${dataToImport.length} registros foram importados`,
      });
      
      // Reset do componente
      setGridData([]);
      setOriginalData([]);
      setValidationErrors([]);
      setSelectedRows(new Set());
      setHistory([]);
      setHistoryIndex(-1);
      setCurrentTab('upload');
      
    } catch (error) {
      logError('Erro ao importar dados para o sistema', {
        service: 'ExcelImporterV4',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        template: selectedTemplate,
        recordCount: gridData.length,
        action: 'finalizeImport'
      });
      toast({
        title: 'Erro ao importar dados',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [gridData, validationErrors, onDataImported, toast]);
  
  // Configuração das colunas da tabela
  const columns = useMemo(() => {
    if (gridData.length === 0) return [];
    
    const columnHelper = createColumnHelper<GridData>();
    const dataKeys = Object.keys(gridData[0]).filter(key => key !== 'id');
    
    return dataKeys.map(key => 
      columnHelper.accessor(key, {
        header: key,
        cell: ({ getValue, row, column }) => {
          const value = getValue();
          return (
            <Input
              value={value || ''}
              onChange={(e) => updateCellValue(row.original.id, column.id, e.target.value)}
              className="border-0 p-1 h-8 text-sm"
              aria-label={`Editar célula ${column.id} da linha ${row.index + 1}`}
            />
          );
        },
      })
    );
  }, [gridData, updateCellValue]);
  
  // Configuração da tabela
  const table = useReactTable({
    data: gridData,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });
  
  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Importador Excel V4 - Otimizado
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload">Upload</TabsTrigger>
            <TabsTrigger value="edit" disabled={gridData.length === 0}>Editar</TabsTrigger>
            <TabsTrigger value="validate" disabled={gridData.length === 0}>Validar</TabsTrigger>
            <TabsTrigger value="import" disabled={gridData.length === 0}>Importar</TabsTrigger>
          </TabsList>
          
          {/* Tab de Upload */}
          <TabsContent value="upload" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Template de Dados</Label>
                <Select value={selectedTemplate} onValueChange={(value: DataTemplate) => setSelectedTemplate(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(dataTemplates).map(([key, template]) => (
                      <SelectItem key={key} value={key}>
                        {template.name} - {template.description}
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
                <input {...getInputProps()} ref={fileInputRef} aria-label="Selecionar arquivos Excel para importação" />
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">
                  {isDragActive ? 'Solte o arquivo aqui' : 'Arraste um arquivo ou clique para selecionar'}
                </p>
                <p className="text-sm text-gray-500 mb-4">
                  Formatos suportados: {allowedFileTypes.join(', ')} (máx. {Math.round(maxFileSize / 1024 / 1024)}MB)
                </p>
                
                {isLoading && (
                  <div className="space-y-2">
                    <Progress value={uploadProgress} className="w-full" />
                    <p className="text-sm text-gray-600">Processando arquivo... {uploadProgress}%</p>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>
          
          {/* Tab de Edição */}
          <TabsContent value="edit" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={undo}
                  disabled={historyIndex <= 0}
                >
                  <Undo className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={redo}
                  disabled={historyIndex >= history.length - 1}
                >
                  <Redo className="h-4 w-4" />
                </Button>
                <Separator orientation="vertical" className="h-6" />
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
                      Duplicar ({selectedRows.size})
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={removeSelectedRows}
                    >
                      <Trash2 className="h-4 w-4" />
                      Remover ({selectedRows.size})
                    </Button>
                  </>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4" />
                  <Input
                    placeholder="Buscar..."
                    value={globalFilter}
                    onChange={(e) => setGlobalFilter(e.target.value)}
                    className="w-48"
                  />
                </div>
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
            
            {gridData.length > 0 && (
              <div className="border rounded-lg overflow-auto max-h-96">
                <table className="w-full">
                  <thead className="bg-gray-50 sticky top-0">
                    {table.getHeaderGroups().map(headerGroup => (
                      <tr key={headerGroup.id}>
                        <th className="p-2 text-left w-12">
                          <Checkbox
                            checked={selectedRows.size === gridData.length && gridData.length > 0}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedRows(new Set(gridData.map(row => row.id)));
                              } else {
                                setSelectedRows(new Set());
                              }
                            }}
                          />
                        </th>
                        {headerGroup.headers.map(header => (
                          <th key={header.id} className="p-2 text-left min-w-32">
                            <div
                              className="flex items-center gap-1 cursor-pointer select-none"
                              onClick={header.column.getToggleSortingHandler()}
                            >
                              {flexRender(header.column.columnDef.header, header.getContext())}
                              <div className="ml-auto">
                                {{
                                  asc: '↑',
                                  desc: '↓'
                                }[header.column.getIsSorted() as string] ?? '↕'}
                              </div>
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
                          <td key={cell.id} className="p-1">
                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            <div className="text-sm text-gray-500">
              {gridData.length} registro(s) | {selectedRows.size} selecionado(s)
            </div>
          </TabsContent>
          
          {/* Tab de Validação */}
          <TabsContent value="validate" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Validação de Dados</h3>
              <Button onClick={() => validateData(gridData)} variant="outline">
                <RotateCcw className="h-4 w-4 mr-2" />
                Revalidar
              </Button>
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {gridData.length - validationErrors.filter(e => e.severity === 'error').length}
                  </div>
                  <div className="text-sm text-gray-500">Registros válidos</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-red-600">
                    {validationErrors.filter(e => e.severity === 'error').length}
                  </div>
                  <div className="text-sm text-gray-500">Erros críticos</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-yellow-600">
                    {validationErrors.filter(e => e.severity === 'warning').length}
                  </div>
                  <div className="text-sm text-gray-500">Avisos</div>
                </CardContent>
              </Card>
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
                <div className="max-h-64 overflow-auto border rounded-lg">
                  {validationErrors.map((error, index) => (
                    <div key={index} className="p-3 border-b last:border-b-0 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant={error.severity === 'error' ? 'destructive' : 'secondary'}>
                            {error.severity === 'error' ? 'Erro' : 'Aviso'}
                          </Badge>
                          <span className="text-sm font-medium">
                            Linha {error.row}, Coluna {error.column}
                          </span>
                        </div>
                        {error.value && (
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                            {String(error.value)}
                          </code>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mt-1">{error.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
          
          {/* Tab de Importação */}
          <TabsContent value="import" className="space-y-4">
            <h3 className="text-lg font-medium">Finalizar Importação</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{gridData.length}</div>
                  <div className="text-sm text-gray-500">Registros para importar</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-red-500">
                    {validationErrors.filter(e => e.severity === 'error').length}
                  </div>
                  <div className="text-sm text-gray-500">Erros críticos</div>
                </CardContent>
              </Card>
            </div>
            
            {validationErrors.filter(e => e.severity === 'error').length > 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Existem erros críticos que devem ser corrigidos antes da importação.
                  Volte para a aba "Validar" para ver os detalhes.
                </AlertDescription>
              </Alert>
            )}
            
            <Button
              onClick={finalizeImport}
              disabled={isLoading || validationErrors.filter(e => e.severity === 'error').length > 0}
              className="w-full"
              size="lg"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Importando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Finalizar Importação
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ExcelImporterV4;