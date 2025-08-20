import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, X, Eye, Download, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/secureLogger';

const { logInfo, logError } = logger;

interface PDFFile {
  id: string;
  file: File;
  preview?: string;
  uploadProgress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  ocrData?: Record<string, unknown>;
  downloadUrl?: string;
}

interface PDFUploaderProps {
  onFilesProcessed?: (files: PDFFile[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  maxFileSize?: number; // em MB
}

const PDFUploader: React.FC<PDFUploaderProps> = ({
  onFilesProcessed,
  maxFiles = 10,
  acceptedTypes = ['application/pdf'],
  maxFileSize = 10
}) => {
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: { file: File; errors: { code: string; message: string }[] }[]) => {
    logInfo('Arquivos aceitos para upload', 'PDFUploader', { 
      acceptedCount: acceptedFiles.length 
    });
    if (rejectedFiles.length > 0) {
      logInfo('Arquivos rejeitados no upload', 'PDFUploader', { 
        rejectedCount: rejectedFiles.length 
      });
    }

    // Tratar arquivos rejeitados
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(({ file, errors }) => {
        errors.forEach((error: { code: string; message: string }) => {
          let message = 'Erro desconhecido';
          switch (error.code) {
            case 'file-too-large':
              message = `Arquivo "${file.name}" é muito grande. Máximo: ${maxFileSize}MB`;
              break;
            case 'file-invalid-type':
              message = `Arquivo "${file.name}" não é um PDF válido`;
              break;
            case 'too-many-files':
              message = `Máximo de ${maxFiles} arquivos permitidos`;
              break;
            default:
              message = `Erro no arquivo "${file.name}": ${error.message}`;
          }
          toast({
            title: "Arquivo Rejeitado",
            description: message,
            variant: "destructive"
          });
        });
      });
    }

    // Processar arquivos aceitos
    const newFiles: PDFFile[] = acceptedFiles.map(file => ({
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      uploadProgress: 0,
      status: 'pending'
    }));

    setFiles(prev => {
      const updated = [...prev, ...newFiles];
      // Limitar número máximo de arquivos
      if (updated.length > maxFiles) {
        toast({
          title: "Limite Excedido",
          description: `Máximo de ${maxFiles} arquivos. Removendo arquivos extras.`,
          variant: "destructive"
        });
        return updated.slice(0, maxFiles);
      }
      return updated;
    });
  }, [maxFiles, maxFileSize, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxSize: maxFileSize * 1024 * 1024, // Converter MB para bytes
    maxFiles,
    multiple: true
  });

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const uploadAndProcessFiles = async () => {
    if (files.length === 0) {
      toast({
        title: "Nenhum Arquivo",
        description: "Adicione pelo menos um arquivo PDF para processar.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    logInfo('Iniciando upload e processamento de arquivos', 'PDFUploader', { 
      fileCount: files.length 
    });

    try {
      const updatedFiles = [...files];

      for (let i = 0; i < updatedFiles.length; i++) {
        const fileData = updatedFiles[i];
        
        if (fileData.status !== 'pending') continue;

        try {
          // Atualizar status para uploading
          updatedFiles[i] = { ...fileData, status: 'uploading' };
          setFiles([...updatedFiles]);

          // Upload do arquivo para Supabase Storage
          logInfo('Fazendo upload de arquivo', 'PDFUploader', { 
            fileName: fileData.file.name,
            fileSize: fileData.file.size 
          });
          
          const fileName = `${Date.now()}-${fileData.file.name}`;
          const { data: uploadData, error: uploadError } = await supabase.storage
            .from('datasheets')
            .upload(fileName, fileData.file, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadError) {
            throw new Error(`Erro no upload: ${uploadError.message}`);
          }

          // Simular progresso de upload
          for (let progress = 0; progress <= 100; progress += 20) {
            updatedFiles[i] = { ...updatedFiles[i], uploadProgress: progress };
            setFiles([...updatedFiles]);
            await new Promise(resolve => setTimeout(resolve, 100));
          }

          // Obter URL pública do arquivo
          const { data: urlData } = supabase.storage
            .from('datasheets')
            .getPublicUrl(fileName);

          // Atualizar status para processing
          updatedFiles[i] = { 
            ...updatedFiles[i], 
            status: 'processing',
            downloadUrl: urlData.publicUrl
          };
          setFiles([...updatedFiles]);

          // Simular processamento OCR (aqui você integraria com Tesseract.js)
          logInfo('Processando OCR para arquivo', 'PDFUploader', { 
            fileName: fileData.file.name 
          });
          await new Promise(resolve => setTimeout(resolve, 2000));

          // Dados simulados do OCR
          const mockOcrData = {
            text: `Dados extraídos do arquivo ${fileData.file.name}`,
            confidence: 85,
            extractedFields: {
              modelo: 'Exemplo Modelo',
              potencia: '400W',
              fabricante: 'Exemplo Fabricante',
              eficiencia: '20.5%'
            }
          };

          // Atualizar status para completed
          updatedFiles[i] = { 
            ...updatedFiles[i], 
            status: 'completed',
            ocrData: mockOcrData
          };
          setFiles([...updatedFiles]);

          logInfo('Arquivo processado com sucesso', 'PDFUploader', { 
            fileName: fileData.file.name 
          });

        } catch (error: unknown) {
          logError('Erro ao processar arquivo', 'PDFUploader', { 
            fileName: fileData.file.name,
            error: (error as Error).message 
          });
          
          updatedFiles[i] = { 
            ...updatedFiles[i], 
            status: 'error',
            error: (error as Error).message || 'Erro desconhecido'
          };
          setFiles([...updatedFiles]);
        }
      }

      // Notificar componente pai sobre arquivos processados
      if (onFilesProcessed) {
        onFilesProcessed(updatedFiles.filter(f => f.status === 'completed'));
      }

      const completedCount = updatedFiles.filter(f => f.status === 'completed').length;
      const errorCount = updatedFiles.filter(f => f.status === 'error').length;

      if (completedCount > 0) {
        toast({
          title: "Processamento Concluído",
          description: `${completedCount} arquivo(s) processado(s) com sucesso${errorCount > 0 ? `, ${errorCount} com erro` : ''}.`
        });
      }

    } catch (error: unknown) {
      logError('Erro geral no processamento de arquivos', 'PDFUploader', { 
        error: (error as Error).message 
      });
      toast({
        title: "Erro no Processamento",
        description: (error as Error).message || 'Erro desconhecido durante o processamento',
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = (status: PDFFile['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
      case 'uploading':
        return <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default:
        return <FileText className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: PDFFile['status']) => {
    switch (status) {
      case 'pending': return 'Aguardando';
      case 'uploading': return 'Enviando';
      case 'processing': return 'Processando';
      case 'completed': return 'Concluído';
      case 'error': return 'Erro';
      default: return 'Desconhecido';
    }
  };

  const getStatusVariant = (status: PDFFile['status']) => {
    switch (status) {
      case 'completed': return 'default';
      case 'error': return 'destructive';
      case 'processing':
      case 'uploading': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Importação de PDF com OCR
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Área de Drop */}
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
            ${isDragActive 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950' 
              : 'border-gray-300 hover:border-gray-400'
            }
          `}
        >
          <input {...getInputProps()} aria-label="Selecionar arquivos PDF para upload" />
          <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          {isDragActive ? (
            <p className="text-blue-600 font-medium">
              Solte os arquivos PDF aqui...
            </p>
          ) : (
            <div>
              <p className="text-gray-600 mb-2">
                Arraste e solte arquivos PDF aqui, ou clique para selecionar
              </p>
              <p className="text-sm text-gray-500">
                Máximo: {maxFiles} arquivos, {maxFileSize}MB cada
              </p>
            </div>
          )}
        </div>

        {/* Lista de Arquivos */}
        {files.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Arquivos ({files.length})</h3>
              <Button 
                onClick={uploadAndProcessFiles}
                disabled={isProcessing || files.every(f => f.status !== 'pending')}
                className="flex items-center gap-2"
              >
                {isProcessing ? (
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {isProcessing ? 'Processando...' : 'Processar Arquivos'}
              </Button>
            </div>

            <div className="space-y-2">
              {files.map((fileData) => (
                <div key={fileData.id} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(fileData.status)}
                      <div>
                        <p className="font-medium text-sm">{fileData.file.name}</p>
                        <p className="text-xs text-gray-500">
                          {(fileData.file.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={getStatusVariant(fileData.status)}>
                        {getStatusText(fileData.status)}
                      </Badge>
                      {fileData.status === 'pending' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(fileData.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                      {fileData.downloadUrl && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(fileData.downloadUrl, '_blank')}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Barra de Progresso */}
                  {(fileData.status === 'uploading' || fileData.status === 'processing') && (
                    <div className="mb-2">
                      <Progress 
                        value={fileData.status === 'uploading' ? fileData.uploadProgress : 100} 
                        className="h-2"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        {fileData.status === 'uploading' 
                          ? `Upload: ${fileData.uploadProgress}%`
                          : 'Processando OCR...'
                        }
                      </p>
                    </div>
                  )}

                  {/* Erro */}
                  {fileData.status === 'error' && fileData.error && (
                    <Alert variant="destructive" className="mt-2">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{fileData.error}</AlertDescription>
                    </Alert>
                  )}

                  {/* Dados OCR */}
                  {fileData.status === 'completed' && fileData.ocrData && (
                    <div className="mt-2 p-3 bg-green-50 dark:bg-green-950 rounded border">
                      <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                        Dados Extraídos (Confiança: {fileData.ocrData.confidence}%)
                      </p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(fileData.ocrData.extractedFields || {}).map(([key, value]) => (
                          <div key={key}>
                            <span className="font-medium capitalize">{key}:</span> {value as string}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Informações */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Os arquivos PDF serão processados com OCR para extrair automaticamente informações técnicas 
            como modelo, potência, fabricante e especificações. Os dados extraídos podem ser revisados 
            antes da importação final.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default PDFUploader;