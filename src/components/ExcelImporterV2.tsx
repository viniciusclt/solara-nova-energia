import React, { useState, useCallback, useRef } from 'react';
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
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  Download,
  Settings,
  RefreshCw,
  Save,
  X,
  ArrowRight
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import * as XLSX from 'xlsx';

interface ExcelFile {
  id: string;
  file: File;
  sheets: string[];
  selectedSheet: string;
  data: any[][];
  headers: string[];
  status: 'pending' | 'loaded' | 'mapped' | 'validated' | 'error';
  error?: string;
}

interface ColumnMapping {
  [key: string]: string | number; // nome da coluna ou índice
}

interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  validRows: number;
  totalRows: number;
}

interface ProcessedProduct {
  id: string;
  nome: string;
  potencia: string;
  preco: string;
  fabricante: string;
  categoria: string;
  descricao: string;
  rowIndex: number;
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

interface ExcelImporterV2Props {
  onProductsImported?: (products: ProcessedProduct[]) => void;
  maxFiles?: number;
  maxFileSize?: number;
}

const ExcelImporterV2: React.FC<ExcelImporterV2Props> = ({
  onProductsImported,
  maxFiles = 5,
  maxFileSize = 50
}) => {
  const [files, setFiles] = useState<ExcelFile[]>([]);
  const [currentTab, setCurrentTab] = useState('upload');
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({
    nome: '',
    potencia: '',
    preco: '',
    fabricante: '',
    categoria: '',
    descricao: ''
  });
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [processedProducts, setProcessedProducts] = useState<ProcessedProduct[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingProgress, setProcessingProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [previewRows, setPreviewRows] = useState(10);
  const [skipRows, setSkipRows] = useState(0);
  const [autoDetectHeaders, setAutoDetectHeaders] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Categorias disponíveis
  const categorias = [
    'Módulo Fotovoltaico',
    'Inversor',
    'Estrutura de Fixação',
    'Cabo Solar',
    'Conector MC4',
    'String Box',
    'Medidor Bidirecional',
    'Outros'
  ];

  // Campos obrigatórios
  const requiredFields = ['nome', 'potencia', 'preco', 'fabricante'];

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    
    console.log('[ExcelImporterV2] Arquivos selecionados:', selectedFiles);

    for (const file of selectedFiles) {
      if (files.length >= maxFiles) {
        toast({
          title: "Limite Excedido",
          description: `Máximo de ${maxFiles} arquivos permitidos.`,
          variant: "destructive"
        });
        break;
      }

      if (file.size > maxFileSize * 1024 * 1024) {
        toast({
          title: "Arquivo Muito Grande",
          description: `${file.name} excede o limite de ${maxFileSize}MB.`,
          variant: "destructive"
        });
        continue;
      }

      try {
        await loadExcelFile(file);
      } catch (error: any) {
        console.error('[ExcelImporterV2] Erro ao carregar arquivo:', error);
        toast({
          title: "Erro no Arquivo",
          description: `Erro ao carregar ${file.name}: ${error.message}`,
          variant: "destructive"
        });
      }
    }

    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [files.length, maxFiles, maxFileSize]);

  const loadExcelFile = async (file: File): Promise<void> => {
    console.log('[ExcelImporterV2] Carregando arquivo:', file.name);

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          const sheets = workbook.SheetNames;
          if (sheets.length === 0) {
            throw new Error('Nenhuma planilha encontrada no arquivo');
          }

          const firstSheet = sheets[0];
          const worksheet = workbook.Sheets[firstSheet];
          const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
          
          // Detectar cabeçalhos automaticamente
          let headers: string[] = [];
          let dataStartRow = 0;
          
          if (autoDetectHeaders && jsonData.length > 0) {
            // Procurar pela primeira linha que parece conter cabeçalhos
            for (let i = skipRows; i < Math.min(jsonData.length, skipRows + 5); i++) {
              const row = jsonData[i] as any[];
              if (row && row.some(cell => 
                typeof cell === 'string' && 
                cell.length > 0 && 
                /[a-zA-Z]/.test(cell)
              )) {
                headers = row.map(cell => String(cell || '').trim());
                dataStartRow = i + 1;
                break;
              }
            }
          }

          if (headers.length === 0) {
            // Fallback: usar primeira linha como cabeçalho
            const firstRow = jsonData[skipRows] as any[];
            headers = firstRow ? firstRow.map((_, index) => `Coluna ${index + 1}`) : [];
            dataStartRow = skipRows;
          }

          const dataRows = jsonData.slice(dataStartRow);

          const excelFile: ExcelFile = {
            id: `excel-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            file,
            sheets,
            selectedSheet: firstSheet,
            data: dataRows,
            headers,
            status: 'loaded'
          };

          setFiles(prev => [...prev, excelFile]);
          
          if (!selectedFile) {
            setSelectedFile(excelFile.id);
          }

          console.log('[ExcelImporterV2] Arquivo carregado:', excelFile);
          resolve();

        } catch (error: any) {
          console.error('[ExcelImporterV2] Erro ao processar Excel:', error);
          reject(new Error(`Erro ao processar arquivo: ${error.message}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('Erro ao ler arquivo'));
      };

      reader.readAsArrayBuffer(file);
    });
  };

  const changeSheet = async (fileId: string, sheetName: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file) return;

    try {
      const reader = new FileReader();
      reader.onload = (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
        
        // Detectar cabeçalhos para a nova planilha
        let headers: string[] = [];
        let dataStartRow = 0;
        
        if (autoDetectHeaders && jsonData.length > 0) {
          for (let i = skipRows; i < Math.min(jsonData.length, skipRows + 5); i++) {
            const row = jsonData[i] as any[];
            if (row && row.some(cell => 
              typeof cell === 'string' && 
              cell.length > 0 && 
              /[a-zA-Z]/.test(cell)
            )) {
              headers = row.map(cell => String(cell || '').trim());
              dataStartRow = i + 1;
              break;
            }
          }
        }

        if (headers.length === 0) {
          const firstRow = jsonData[skipRows] as any[];
          headers = firstRow ? firstRow.map((_, index) => `Coluna ${index + 1}`) : [];
          dataStartRow = skipRows;
        }

        const dataRows = jsonData.slice(dataStartRow);

        setFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, selectedSheet: sheetName, data: dataRows, headers }
            : f
        ));
      };
      reader.readAsArrayBuffer(file.file);
    } catch (error: any) {
      console.error('[ExcelImporterV2] Erro ao trocar planilha:', error);
      toast({
        title: "Erro",
        description: `Erro ao carregar planilha: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    if (selectedFile === fileId) {
      const remainingFiles = files.filter(f => f.id !== fileId);
      setSelectedFile(remainingFiles.length > 0 ? remainingFiles[0].id : null);
    }
  };

  const updateColumnMapping = (field: string, value: string) => {
    setColumnMapping(prev => ({ ...prev, [field]: value }));
  };

  const autoMapColumns = () => {
    const currentFile = files.find(f => f.id === selectedFile);
    if (!currentFile) return;

    const newMapping: ColumnMapping = { ...columnMapping };
    
    // Mapeamento automático baseado em palavras-chave
    const mappingRules = {
      nome: ['nome', 'name', 'produto', 'product', 'modelo', 'model'],
      potencia: ['potencia', 'power', 'potência', 'watt', 'w'],
      preco: ['preco', 'price', 'preço', 'valor', 'value', 'custo', 'cost'],
      fabricante: ['fabricante', 'manufacturer', 'marca', 'brand'],
      categoria: ['categoria', 'category', 'tipo', 'type'],
      descricao: ['descricao', 'description', 'descrição', 'obs', 'observacao']
    };

    Object.entries(mappingRules).forEach(([field, keywords]) => {
      const matchedHeader = currentFile.headers.find(header => 
        keywords.some(keyword => 
          header.toLowerCase().includes(keyword.toLowerCase())
        )
      );
      
      if (matchedHeader) {
        newMapping[field] = matchedHeader;
      }
    });

    setColumnMapping(newMapping);
    
    toast({
      title: "Mapeamento Automático",
      description: "Colunas mapeadas automaticamente com base nos cabeçalhos."
    });
  };

  const validateData = (): ValidationResult => {
    const currentFile = files.find(f => f.id === selectedFile);
    if (!currentFile) {
      return {
        isValid: false,
        errors: ['Nenhum arquivo selecionado'],
        warnings: [],
        validRows: 0,
        totalRows: 0
      };
    }

    const errors: string[] = [];
    const warnings: string[] = [];
    let validRows = 0;
    const totalRows = currentFile.data.length;

    // Verificar mapeamento obrigatório
    const missingFields = requiredFields.filter(field => !columnMapping[field]);
    if (missingFields.length > 0) {
      errors.push(`Campos obrigatórios não mapeados: ${missingFields.join(', ')}`);
    }

    // Verificar se as colunas mapeadas existem
    Object.entries(columnMapping).forEach(([field, column]) => {
      if (column && typeof column === 'string' && !currentFile.headers.includes(column)) {
        errors.push(`Coluna "${column}" não encontrada para o campo "${field}"`);
      }
    });

    if (errors.length === 0) {
      // Validar dados linha por linha
      currentFile.data.forEach((row, index) => {
        const rowErrors: string[] = [];
        
        // Verificar campos obrigatórios
        requiredFields.forEach(field => {
          const columnIndex = typeof columnMapping[field] === 'string' 
            ? currentFile.headers.indexOf(columnMapping[field] as string)
            : columnMapping[field] as number;
          
          const value = row[columnIndex];
          if (!value || String(value).trim() === '') {
            rowErrors.push(`${field} vazio na linha ${index + 1}`);
          }
        });

        // Validar preço
        if (columnMapping.preco) {
          const precoIndex = typeof columnMapping.preco === 'string'
            ? currentFile.headers.indexOf(columnMapping.preco as string)
            : columnMapping.preco as number;
          
          const preco = row[precoIndex];
          if (preco && isNaN(parseFloat(String(preco)))) {
            rowErrors.push(`Preço inválido na linha ${index + 1}`);
          }
        }

        if (rowErrors.length === 0) {
          validRows++;
        } else {
          warnings.push(...rowErrors);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      validRows,
      totalRows
    };
  };

  const processData = async () => {
    const currentFile = files.find(f => f.id === selectedFile);
    if (!currentFile) return;

    setIsProcessing(true);
    setProcessingProgress(0);

    try {
      const products: ProcessedProduct[] = [];
      
      for (let i = 0; i < currentFile.data.length; i++) {
        const row = currentFile.data[i];
        const rowErrors: string[] = [];
        const rowWarnings: string[] = [];

        // Extrair dados da linha
        const getColumnValue = (field: string): string => {
          const columnIndex = typeof columnMapping[field] === 'string'
            ? currentFile.headers.indexOf(columnMapping[field] as string)
            : columnMapping[field] as number;
          
          return columnIndex >= 0 ? String(row[columnIndex] || '').trim() : '';
        };

        const nome = getColumnValue('nome');
        const potencia = getColumnValue('potencia');
        const preco = getColumnValue('preco');
        const fabricante = getColumnValue('fabricante');
        const categoria = getColumnValue('categoria') || 'Módulo Fotovoltaico';
        const descricao = getColumnValue('descricao');

        // Validações
        if (!nome) rowErrors.push('Nome obrigatório');
        if (!potencia) rowErrors.push('Potência obrigatória');
        if (!preco) rowErrors.push('Preço obrigatório');
        if (!fabricante) rowErrors.push('Fabricante obrigatório');
        
        if (preco && isNaN(parseFloat(preco))) {
          rowErrors.push('Preço deve ser numérico');
        }

        // Verificar duplicatas
        const isDuplicate = products.some(p => 
          p.nome.toLowerCase() === nome.toLowerCase() && 
          p.fabricante.toLowerCase() === fabricante.toLowerCase()
        );
        
        if (isDuplicate) {
          rowWarnings.push('Produto duplicado');
        }

        const product: ProcessedProduct = {
          id: `product-${i}-${Date.now()}`,
          nome,
          potencia,
          preco,
          fabricante,
          categoria,
          descricao,
          rowIndex: i + 1,
          isValid: rowErrors.length === 0,
          errors: rowErrors,
          warnings: rowWarnings
        };

        products.push(product);
        setProcessingProgress(((i + 1) / currentFile.data.length) * 100);
        
        // Simular processamento
        await new Promise(resolve => setTimeout(resolve, 10));
      }

      setProcessedProducts(products);
      setCurrentTab('review');

      toast({
        title: "Processamento Concluído",
        description: `${products.filter(p => p.isValid).length} de ${products.length} produtos válidos.`
      });

    } catch (error: any) {
      console.error('[ExcelImporterV2] Erro no processamento:', error);
      toast({
        title: "Erro no Processamento",
        description: error.message || 'Erro desconhecido',
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const saveProducts = async () => {
    const validProducts = processedProducts.filter(p => p.isValid);
    
    if (validProducts.length === 0) {
      toast({
        title: "Nenhum Produto Válido",
        description: "Não há produtos válidos para salvar.",
        variant: "destructive"
      });
      return;
    }

    try {
      // Obter usuário atual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      // Obter perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        throw new Error('Perfil do usuário não encontrado');
      }

      // Preparar dados para inserção
      const productsToInsert = validProducts.map(product => ({
        nome: product.nome,
        potencia: product.potencia,
        preco: parseFloat(product.preco) || 0,
        fabricante: product.fabricante,
        categoria: product.categoria,
        descricao: product.descricao,
        empresa_id: profile.empresa_id,
        created_by: user.id,
        fonte_importacao: 'EXCEL_V2',
        linha_origem: product.rowIndex
      }));

      // Inserir no banco
      const { data, error } = await supabase
        .from('kits_financeiros')
        .insert(productsToInsert)
        .select();

      if (error) {
        throw new Error(`Erro ao salvar: ${error.message}`);
      }

      toast({
        title: "Produtos Salvos",
        description: `${validProducts.length} produto(s) importado(s) com sucesso.`
      });

      // Notificar componente pai
      if (onProductsImported) {
        onProductsImported(validProducts);
      }

      // Reset
      setFiles([]);
      setProcessedProducts([]);
      setColumnMapping({
        nome: '',
        potencia: '',
        preco: '',
        fabricante: '',
        categoria: '',
        descricao: ''
      });
      setCurrentTab('upload');
      setSelectedFile(null);

    } catch (error: any) {
      console.error('[ExcelImporterV2] Erro ao salvar:', error);
      toast({
        title: "Erro ao Salvar",
        description: error.message || 'Erro desconhecido',
        variant: "destructive"
      });
    }
  };

  const currentFile = files.find(f => f.id === selectedFile);
  const validation = validationResult || validateData();

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-6 w-6" />
            Importação de Excel Avançada
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">
            Importe produtos de planilhas Excel com mapeamento inteligente de colunas e validação avançada
          </p>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload">1. Upload</TabsTrigger>
          <TabsTrigger value="mapping" disabled={files.length === 0}>
            2. Mapeamento
          </TabsTrigger>
          <TabsTrigger value="validation" disabled={!selectedFile}>
            3. Validação
          </TabsTrigger>
          <TabsTrigger value="review" disabled={processedProducts.length === 0}>
            4. Revisão
          </TabsTrigger>
        </TabsList>

        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload de Arquivos Excel</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Configurações */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="skipRows">Pular Linhas</Label>
                  <Input
                    id="skipRows"
                    type="number"
                    min="0"
                    value={skipRows}
                    onChange={(e) => setSkipRows(parseInt(e.target.value) || 0)}
                  />
                </div>
                <div>
                  <Label htmlFor="previewRows">Linhas de Preview</Label>
                  <Input
                    id="previewRows"
                    type="number"
                    min="5"
                    max="50"
                    value={previewRows}
                    onChange={(e) => setPreviewRows(parseInt(e.target.value) || 10)}
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <Checkbox
                    id="autoDetect"
                    checked={autoDetectHeaders}
                    onCheckedChange={(checked) => setAutoDetectHeaders(checked as boolean)}
                  />
                  <Label htmlFor="autoDetect">Auto-detectar cabeçalhos</Label>
                </div>
              </div>

              {/* Upload Area */}
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <FileSpreadsheet className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-gray-600 mb-4">
                  Selecione arquivos Excel (.xlsx, .xls)
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
                <Button onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4 mr-2" />
                  Selecionar Arquivos
                </Button>
                <p className="text-sm text-gray-500 mt-2">
                  Máximo: {maxFiles} arquivos, {maxFileSize}MB cada
                </p>
              </div>

              {/* Lista de Arquivos */}
              {files.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-medium">Arquivos Carregados</h3>
                  {files.map((file) => (
                    <div key={file.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <FileSpreadsheet className="h-5 w-5 text-green-500" />
                          <div>
                            <p className="font-medium">{file.file.name}</p>
                            <p className="text-sm text-gray-500">
                              {file.sheets.length} planilha(s) • {file.data.length} linha(s)
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={file.id === selectedFile ? 'default' : 'outline'}>
                            {file.id === selectedFile ? 'Selecionado' : 'Disponível'}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedFile(file.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFile(file.id)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Seleção de Planilha */}
                      {file.sheets.length > 1 && (
                        <div className="mt-2">
                          <Label>Planilha:</Label>
                          <Select
                            value={file.selectedSheet}
                            onValueChange={(value) => changeSheet(file.id, value)}
                          >
                            <SelectTrigger className="w-full mt-1">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {file.sheets.map(sheet => (
                                <SelectItem key={sheet} value={sheet}>{sheet}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {files.length > 0 && (
                <div className="flex justify-end">
                  <Button onClick={() => setCurrentTab('mapping')}>
                    Próximo: Mapeamento
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mapping Tab */}
        <TabsContent value="mapping" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Mapeamento de Colunas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {currentFile && (
                <>
                  <div className="flex justify-between items-center">
                    <p className="text-sm text-gray-600">
                      Arquivo: {currentFile.file.name} • Planilha: {currentFile.selectedSheet}
                    </p>
                    <Button variant="outline" onClick={autoMapColumns}>
                      <Settings className="h-4 w-4 mr-2" />
                      Auto-mapear
                    </Button>
                  </div>

                  {/* Mapeamento */}
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(columnMapping).map(([field, value]) => (
                      <div key={field}>
                        <Label className="flex items-center gap-2">
                          {field.charAt(0).toUpperCase() + field.slice(1)}
                          {requiredFields.includes(field) && (
                            <span className="text-red-500">*</span>
                          )}
                        </Label>
                        <Select
                          value={value as string}
                          onValueChange={(newValue) => updateColumnMapping(field, newValue)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecionar coluna" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">Não mapear</SelectItem>
                            {currentFile.headers.map((header, index) => (
                              <SelectItem key={index} value={header}>
                                {header || `Coluna ${index + 1}`}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    ))}
                  </div>

                  {/* Preview */}
                  <div>
                    <h3 className="text-lg font-medium mb-3">Preview dos Dados</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead className="bg-gray-50 dark:bg-gray-800">
                            <tr>
                              {currentFile.headers.slice(0, 8).map((header, index) => (
                                <th key={index} className="px-3 py-2 text-left font-medium">
                                  {header || `Col ${index + 1}`}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {currentFile.data.slice(0, previewRows).map((row, rowIndex) => (
                              <tr key={rowIndex} className="border-t">
                                {row.slice(0, 8).map((cell, cellIndex) => (
                                  <td key={cellIndex} className="px-3 py-2">
                                    {String(cell || '').substring(0, 50)}
                                    {String(cell || '').length > 50 && '...'}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="flex justify-between">
                    <Button variant="outline" onClick={() => setCurrentTab('upload')}>Voltar</Button>
                    <Button onClick={() => setCurrentTab('validation')}>
                      Próximo: Validação
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Validation Tab */}
        <TabsContent value="validation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Validação dos Dados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Status da Validação */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{validation.totalRows}</div>
                  <div className="text-sm text-blue-600">Total de Linhas</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{validation.validRows}</div>
                  <div className="text-sm text-green-600">Linhas Válidas</div>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {validation.totalRows - validation.validRows}
                  </div>
                  <div className="text-sm text-red-600">Linhas com Erro</div>
                </div>
              </div>

              {/* Erros */}
              {validation.errors.length > 0 && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-2">Erros encontrados:</div>
                    <ul className="list-disc list-inside space-y-1">
                      {validation.errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {/* Avisos */}
              {validation.warnings.length > 0 && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium mb-2">Avisos ({validation.warnings.length}):</div>
                    <div className="max-h-32 overflow-y-auto">
                      <ul className="list-disc list-inside space-y-1">
                        {validation.warnings.slice(0, 10).map((warning, index) => (
                          <li key={index}>{warning}</li>
                        ))}
                      </ul>
                      {validation.warnings.length > 10 && (
                        <p className="text-sm text-gray-500 mt-2">
                          ... e mais {validation.warnings.length - 10} avisos
                        </p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentTab('mapping')}>Voltar</Button>
                <Button 
                  onClick={processData}
                  disabled={!validation.isValid || isProcessing}
                >
                  {isProcessing ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  {isProcessing ? 'Processando...' : 'Processar Dados'}
                </Button>
              </div>

              {isProcessing && (
                <div className="space-y-2">
                  <Progress value={processingProgress} className="h-2" />
                  <p className="text-sm text-gray-500 text-center">
                    {Math.round(processingProgress)}% concluído
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Review Tab */}
        <TabsContent value="review" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revisão Final</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Resumo */}
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{processedProducts.length}</div>
                  <div className="text-sm text-blue-600">Total Processados</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {processedProducts.filter(p => p.isValid).length}
                  </div>
                  <div className="text-sm text-green-600">Válidos</div>
                </div>
                <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {processedProducts.filter(p => !p.isValid).length}
                  </div>
                  <div className="text-sm text-red-600">Com Erro</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {processedProducts.filter(p => p.warnings.length > 0).length}
                  </div>
                  <div className="text-sm text-yellow-600">Com Avisos</div>
                </div>
              </div>

              {/* Lista de Produtos */}
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {processedProducts.map((product) => (
                  <div 
                    key={product.id} 
                    className={`border rounded-lg p-4 ${
                      product.isValid ? 'border-green-200' : 'border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="font-medium">{product.nome}</h4>
                        <p className="text-sm text-gray-500">
                          {product.fabricante} • {product.potencia} • R$ {product.preco}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={product.isValid ? 'default' : 'destructive'}>
                          {product.isValid ? 'Válido' : 'Erro'}
                        </Badge>
                        <span className="text-xs text-gray-500">Linha {product.rowIndex}</span>
                      </div>
                    </div>
                    
                    {(product.errors.length > 0 || product.warnings.length > 0) && (
                      <div className="space-y-1">
                        {product.errors.map((error, index) => (
                          <p key={index} className="text-sm text-red-600">• {error}</p>
                        ))}
                        {product.warnings.map((warning, index) => (
                          <p key={index} className="text-sm text-yellow-600">• {warning}</p>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-4 border-t">
                <Button variant="outline" onClick={() => setCurrentTab('validation')}>Voltar</Button>
                <Button 
                  onClick={saveProducts}
                  disabled={processedProducts.filter(p => p.isValid).length === 0}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Salvar {processedProducts.filter(p => p.isValid).length} Produto(s)
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ExcelImporterV2;