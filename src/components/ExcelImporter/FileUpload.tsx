import React, { useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileSpreadsheet, X, AlertCircle } from 'lucide-react';
import { ExcelFile } from './types';
import { logInfo, logError } from '@/utils/secureLogger';
import * as XLSX from 'xlsx';

interface FileUploadProps {
  files: ExcelFile[];
  onFilesChange: (files: ExcelFile[]) => void;
  maxFiles: number;
  maxFileSize: number;
  isProcessing: boolean;
  processingProgress: number;
  skipRows: number;
  autoDetectHeaders: boolean;
}

export const FileUpload: React.FC<FileUploadProps> = ({
  files,
  onFilesChange,
  maxFiles,
  maxFileSize,
  isProcessing,
  processingProgress,
  skipRows,
  autoDetectHeaders
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadExcelFile = useCallback(async (file: File): Promise<ExcelFile> => {
    logInfo('Carregando arquivo Excel', 'FileUpload', { fileName: file.name });

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
              const row = jsonData[i] as unknown[];
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
            const firstRow = jsonData[skipRows] as unknown[];
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

          logInfo('Arquivo Excel carregado com sucesso', 'FileUpload', { 
            fileId: excelFile.id, 
            sheets: sheets.length, 
            headers: headers.length 
          });
          
          resolve(excelFile);

        } catch (error: unknown) {
          logError('Erro ao processar arquivo Excel', 'FileUpload', { 
            error: (error as Error).message,
            fileName: file.name 
          });
          reject(new Error(`Erro ao processar arquivo: ${(error as Error).message}`));
        }
      };

      reader.onerror = () => {
        reject(new Error('Erro ao ler arquivo'));
      };

      reader.readAsArrayBuffer(file);
    });
  }, [skipRows, autoDetectHeaders]);

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    
    logInfo('Arquivos selecionados para importação', 'FileUpload', { 
      count: selectedFiles.length,
      maxFiles,
      currentFiles: files.length
    });

    // Validar número de arquivos
    if (files.length + selectedFiles.length > maxFiles) {
      throw new Error(`Máximo de ${maxFiles} arquivos permitidos`);
    }

    // Validar tamanho dos arquivos
    const invalidFiles = selectedFiles.filter(file => file.size > maxFileSize * 1024 * 1024);
    if (invalidFiles.length > 0) {
      throw new Error(`Arquivos muito grandes: ${invalidFiles.map(f => f.name).join(', ')}. Máximo: ${maxFileSize}MB`);
    }

    // Validar tipos de arquivo
    const validTypes = ['.xlsx', '.xls', '.csv'];
    const invalidTypes = selectedFiles.filter(file => {
      const extension = '.' + file.name.split('.').pop()?.toLowerCase();
      return !validTypes.includes(extension);
    });
    if (invalidTypes.length > 0) {
      throw new Error(`Tipos de arquivo inválidos: ${invalidTypes.map(f => f.name).join(', ')}`);
    }

    try {
      const loadedFiles: ExcelFile[] = [];
      
      for (const file of selectedFiles) {
        try {
          const excelFile = await loadExcelFile(file);
          loadedFiles.push(excelFile);
        } catch (error) {
          const errorFile: ExcelFile = {
            id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            file,
            sheets: [],
            selectedSheet: '',
            data: [],
            headers: [],
            status: 'error',
            error: (error as Error).message
          };
          loadedFiles.push(errorFile);
        }
      }
      
      onFilesChange([...files, ...loadedFiles]);
      
    } catch (error) {
      logError('Erro no upload de arquivos', 'FileUpload', {
        error: (error as Error).message
      });
      throw error;
    }

    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [files, maxFiles, maxFileSize, loadExcelFile, onFilesChange]);

  const removeFile = useCallback((fileId: string) => {
    onFilesChange(files.filter(f => f.id !== fileId));
  }, [files, onFilesChange]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload de Arquivos Excel
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Drag & Drop Area */}
            <div 
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center hover:border-muted-foreground/50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <Upload className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Clique para selecionar arquivos</h3>
              <p className="text-muted-foreground mb-4">
                Ou arraste e solte arquivos Excel (.xlsx, .xls, .csv)
              </p>
              <p className="text-sm text-muted-foreground">
                Máximo: {maxFiles} arquivos, {maxFileSize}MB cada
              </p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".xlsx,.xls,.csv"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Progress */}
            {isProcessing && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Processando arquivos...</span>
                  <span>{processingProgress}%</span>
                </div>
                <Progress value={processingProgress} />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Files List */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Arquivos Carregados ({files.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {files.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">{file.file.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(file.file.size)} • {file.sheets.length} planilha(s)
                      </p>
                      {file.status === 'loaded' && (
                        <p className="text-xs text-green-600">
                          {file.data.length} linhas • {file.headers.length} colunas
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {file.status === 'error' && (
                      <Alert className="max-w-xs">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          {file.error}
                        </AlertDescription>
                      </Alert>
                    )}
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};