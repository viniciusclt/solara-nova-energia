import { useState, useCallback, useRef } from 'react';
import * as XLSX from 'xlsx';
import { ExcelFile, ColumnMapping, ValidationResult, ProcessedProduct, ImportSettings, ValidationError } from './types';

interface UseExcelImporterReturn {
  // Estado
  selectedFile: ExcelFile | null;
  columnMapping: ColumnMapping;
  validationResult: ValidationResult | null;
  isProcessing: boolean;
  progress: number;
  settings: ImportSettings;
  
  // Ações
  handleFileSelect: (file: File) => Promise<void>;
  updateColumnMapping: (mapping: ColumnMapping) => void;
  processData: () => Promise<void>;
  downloadValidData: () => void;
  downloadErrorReport: () => void;
  resetImporter: () => void;
  updateSettings: (newSettings: Partial<ImportSettings>) => void;
}

const DEFAULT_SETTINGS: ImportSettings = {
  requiredFields: ['nome', 'potencia', 'preco', 'fabricante'],
  maxFileSize: 10 * 1024 * 1024, // 10MB
  allowedExtensions: ['.xlsx', '.xls'],
  previewRows: 5,
  skipEmptyRows: true,
  trimWhitespace: true,
  validateDuplicates: true
};

export const useExcelImporter = (): UseExcelImporterReturn => {
  const [selectedFile, setSelectedFile] = useState<ExcelFile | null>(null);
  const [columnMapping, setColumnMapping] = useState<ColumnMapping>({});
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [settings, setSettings] = useState<ImportSettings>(DEFAULT_SETTINGS);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  // Processar arquivo Excel
  const handleFileSelect = useCallback(async (file: File) => {
    try {
      setIsProcessing(true);
      setProgress(10);

      // Validar arquivo
      if (file.size > settings.maxFileSize) {
        throw new Error(`Arquivo muito grande. Máximo permitido: ${settings.maxFileSize / 1024 / 1024}MB`);
      }

      const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      if (!settings.allowedExtensions.includes(extension)) {
        throw new Error(`Extensão não permitida. Use: ${settings.allowedExtensions.join(', ')}`);
      }

      setProgress(30);

      // Ler arquivo
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array' });
      
      setProgress(50);

      // Processar primeira planilha
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        header: 1,
        defval: '',
        blankrows: !settings.skipEmptyRows
      }) as unknown[][];

      setProgress(70);

      if (jsonData.length === 0) {
        throw new Error('Arquivo vazio ou sem dados válidos');
      }

      // Extrair cabeçalhos e dados
      const headers = (jsonData[0] as string[]).map(header => 
        settings.trimWhitespace ? String(header || '').trim() : String(header || '')
      );
      
      const data = jsonData.slice(1).filter(row => {
        if (!settings.skipEmptyRows) return true;
        return row.some(cell => cell !== null && cell !== undefined && String(cell).trim() !== '');
      }).map(row => 
        row.map(cell => 
          settings.trimWhitespace ? String(cell || '').trim() : String(cell || '')
        )
      );

      setProgress(90);

      const excelFile: ExcelFile = {
        name: file.name,
        size: file.size,
        headers,
        data,
        sheetNames: workbook.SheetNames
      };

      setSelectedFile(excelFile);
      setValidationResult(null);
      setColumnMapping({});
      setProgress(100);

      // Reset progress após um tempo
      setTimeout(() => setProgress(0), 1000);

    } catch (error) {
      console.error('Erro ao processar arquivo:', error);
      throw error;
    } finally {
      setIsProcessing(false);
    }
  }, [settings]);

  // Atualizar mapeamento de colunas
  const updateColumnMapping = useCallback((mapping: ColumnMapping) => {
    setColumnMapping(mapping);
    setValidationResult(null);
  }, []);

  // Validar dados
  const validateProduct = useCallback((row: string[], mapping: ColumnMapping, rowIndex: number): { product?: ProcessedProduct; errors: ValidationError[] } => {
    const errors: ValidationError[] = [];
    const product: Partial<ProcessedProduct> = {};

    // Validar campos obrigatórios
    settings.requiredFields.forEach(field => {
      const columnIndex = mapping[field];
      if (columnIndex === undefined || columnIndex === null) {
        errors.push({
          row: rowIndex,
          field,
          type: 'required',
          message: 'Campo obrigatório não mapeado',
          value: null
        });
        return;
      }

      const value = row[columnIndex as number];
      if (!value || String(value).trim() === '') {
        errors.push({
          row: rowIndex,
          field,
          type: 'required',
          message: 'Campo obrigatório vazio',
          value
        });
        return;
      }

      // Validações específicas por campo
      switch (field) {
        case 'potencia':
          const potencia = parseFloat(String(value).replace(/[^0-9.,]/g, '').replace(',', '.'));
          if (isNaN(potencia) || potencia <= 0) {
            errors.push({
              row: rowIndex,
              field,
              type: 'format',
              message: 'Potência deve ser um número positivo',
              value
            });
          } else {
            product.potencia = potencia;
          }
          break;

        case 'preco':
          const preco = parseFloat(String(value).replace(/[^0-9.,]/g, '').replace(',', '.'));
          if (isNaN(preco) || preco <= 0) {
            errors.push({
              row: rowIndex,
              field,
              type: 'format',
              message: 'Preço deve ser um número positivo',
              value
            });
          } else {
            product.preco = preco;
          }
          break;

        default:
          (product as any)[field] = String(value).trim();
      }
    });

    // Processar campos opcionais
    Object.entries(mapping).forEach(([field, columnIndex]) => {
      if (!settings.requiredFields.includes(field) && typeof columnIndex === 'number') {
        const value = row[columnIndex];
        if (value && String(value).trim() !== '') {
          (product as any)[field] = String(value).trim();
        }
      }
    });

    return {
      product: errors.length === 0 ? product as ProcessedProduct : undefined,
      errors
    };
  }, [settings]);

  // Processar dados
  const processData = useCallback(async () => {
    if (!selectedFile || Object.keys(columnMapping).length === 0) {
      throw new Error('Arquivo ou mapeamento não configurado');
    }

    try {
      setIsProcessing(true);
      setProgress(0);

      abortControllerRef.current = new AbortController();
      
      const validProducts: ProcessedProduct[] = [];
      const allErrors: ValidationError[] = [];
      const duplicateCheck = new Set<string>();

      const totalRows = selectedFile.data.length;
      
      for (let i = 0; i < totalRows; i++) {
        if (abortControllerRef.current.signal.aborted) {
          throw new Error('Processamento cancelado');
        }

        const row = selectedFile.data[i];
        const { product, errors } = validateProduct(row, columnMapping, i);
        
        allErrors.push(...errors);

        if (product) {
          // Verificar duplicatas
          if (settings.validateDuplicates) {
            const key = `${product.nome}-${product.fabricante}`.toLowerCase();
            if (duplicateCheck.has(key)) {
              allErrors.push({
                row: i,
                field: 'nome',
                type: 'duplicate',
                message: 'Produto duplicado encontrado',
                value: product.nome
              });
            } else {
              duplicateCheck.add(key);
              validProducts.push(product);
            }
          } else {
            validProducts.push(product);
          }
        }

        // Atualizar progresso
        setProgress(Math.round((i + 1) / totalRows * 100));
        
        // Permitir que a UI atualize
        if (i % 100 === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }

      const result: ValidationResult = {
        validProducts,
        errors: allErrors,
        totalProcessed: totalRows,
        processedAt: new Date()
      };

      setValidationResult(result);
      
    } catch (error) {
      console.error('Erro ao processar dados:', error);
      throw error;
    } finally {
      setIsProcessing(false);
      setProgress(0);
      abortControllerRef.current = null;
    }
  }, [selectedFile, columnMapping, validateProduct, settings]);

  // Download de dados válidos
  const downloadValidData = useCallback(() => {
    if (!validationResult || validationResult.validProducts.length === 0) return;

    const worksheet = XLSX.utils.json_to_sheet(validationResult.validProducts);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Produtos Válidos');
    
    const fileName = `produtos_validos_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }, [validationResult]);

  // Download de relatório de erros
  const downloadErrorReport = useCallback(() => {
    if (!validationResult || validationResult.errors.length === 0) return;

    const errorData = validationResult.errors.map(error => ({
      Linha: error.row + 1,
      Campo: error.field,
      Tipo: error.type,
      Mensagem: error.message,
      Valor: error.value
    }));

    const worksheet = XLSX.utils.json_to_sheet(errorData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Erros de Validação');
    
    const fileName = `relatorio_erros_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }, [validationResult]);

  // Reset do importador
  const resetImporter = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    setSelectedFile(null);
    setColumnMapping({});
    setValidationResult(null);
    setIsProcessing(false);
    setProgress(0);
  }, []);

  // Atualizar configurações
  const updateSettings = useCallback((newSettings: Partial<ImportSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
  }, []);

  return {
    selectedFile,
    columnMapping,
    validationResult,
    isProcessing,
    progress,
    settings,
    handleFileSelect,
    updateColumnMapping,
    processData,
    downloadValidData,
    downloadErrorReport,
    resetImporter,
    updateSettings
  };
};