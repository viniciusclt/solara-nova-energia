import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  Upload, 
  FileText, 
  Eye, 
  Cpu, 
  Download,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Trash2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { PDFDropzone } from './PDFDropzone';
import { PDFPreview } from './PDFPreview';
import { OCRProcessor } from './OCRProcessor';
import { toast } from 'sonner';

export interface ProcessedData {
  id: string;
  type: 'module' | 'inverter' | 'battery' | 'unknown';
  confidence: number;
  data: Record<string, any>;
  rawText: string;
  pageNumber: number;
}

export interface ProcessingStatus {
  status: 'idle' | 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  message: string;
  currentPage?: number;
  totalPages?: number;
}

interface PDFImporterProps {
  onDataExtracted?: (data: ProcessedData[]) => void;
  onError?: (error: string) => void;
  className?: string;
  maxFileSize?: number; // em MB
  allowedTypes?: string[];
  autoProcess?: boolean;
}

export const PDFImporter: React.FC<PDFImporterProps> = ({
  onDataExtracted,
  onError,
  className,
  maxFileSize = 10,
  allowedTypes = ['application/pdf'],
  autoProcess = true
}) => {
  const [files, setFiles] = useState<File[]>([]);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [processedData, setProcessedData] = useState<ProcessedData[]>([]);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    status: 'idle',
    progress: 0,
    message: 'Aguardando arquivo...'
  });
  const [activeTab, setActiveTab] = useState<string>('upload');

  const handleFilesAccepted = useCallback((acceptedFiles: File[]) => {
    setFiles(acceptedFiles);
    
    if (acceptedFiles.length > 0) {
      const firstFile = acceptedFiles[0];
      setCurrentFile(firstFile);
      setActiveTab('preview');
      
      setProcessingStatus({
        status: 'uploading',
        progress: 100,
        message: `Arquivo ${firstFile.name} carregado com sucesso`
      });
      
      toast.success(`Arquivo ${firstFile.name} carregado com sucesso`);
      
      if (autoProcess) {
        setTimeout(() => {
          handleStartProcessing();
        }, 1000);
      }
    }
  }, [autoProcess]);

  const handleFileRejected = useCallback((rejectedFiles: any[]) => {
    const errors = rejectedFiles.map(file => {
      const errors = file.errors.map((error: any) => {
        switch (error.code) {
          case 'file-too-large':
            return `Arquivo muito grande (máximo ${maxFileSize}MB)`;
          case 'file-invalid-type':
            return 'Tipo de arquivo não suportado (apenas PDF)';
          default:
            return error.message;
        }
      });
      return `${file.file.name}: ${errors.join(', ')}`;
    });
    
    const errorMessage = errors.join('\n');
    toast.error(errorMessage);
    onError?.(errorMessage);
  }, [maxFileSize, onError]);

  const handleStartProcessing = useCallback(() => {
    if (!currentFile) {
      toast.error('Nenhum arquivo selecionado');
      return;
    }
    
    setActiveTab('processing');
    setProcessingStatus({
      status: 'processing',
      progress: 0,
      message: 'Iniciando processamento OCR...'
    });
  }, [currentFile]);

  const handleProcessingProgress = useCallback((progress: number, message: string, currentPage?: number, totalPages?: number) => {
    setProcessingStatus({
      status: 'processing',
      progress,
      message,
      currentPage,
      totalPages
    });
  }, []);

  const handleProcessingComplete = useCallback((data: ProcessedData[]) => {
    setProcessedData(data);
    setProcessingStatus({
      status: 'completed',
      progress: 100,
      message: `Processamento concluído! ${data.length} item(ns) extraído(s)`
    });
    
    toast.success(`Processamento concluído! ${data.length} item(ns) extraído(s)`);
    onDataExtracted?.(data);
  }, [onDataExtracted]);

  const handleProcessingError = useCallback((error: string) => {
    setProcessingStatus({
      status: 'error',
      progress: 0,
      message: error
    });
    
    toast.error(error);
    onError?.(error);
  }, [onError]);

  const handleReset = useCallback(() => {
    setFiles([]);
    setCurrentFile(null);
    setProcessedData([]);
    setProcessingStatus({
      status: 'idle',
      progress: 0,
      message: 'Aguardando arquivo...'
    });
    setActiveTab('upload');
  }, []);

  const handleRemoveFile = useCallback((index: number) => {
    const newFiles = files.filter((_, i) => i !== index);
    setFiles(newFiles);
    
    if (newFiles.length === 0) {
      handleReset();
    } else {
      setCurrentFile(newFiles[0]);
    }
  }, [files, handleReset]);

  const getStatusIcon = () => {
    switch (processingStatus.status) {
      case 'uploading':
        return <Upload className="h-4 w-4" />;
      case 'processing':
        return <RefreshCw className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = () => {
    switch (processingStatus.status) {
      case 'processing':
        return 'bg-blue-600';
      case 'completed':
        return 'bg-green-600';
      case 'error':
        return 'bg-red-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header com Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Importação de PDF com OCR</span>
            </div>
            
            {files.length > 0 && (
              <div className="flex items-center space-x-2">
                <Badge variant="outline">
                  {files.length} arquivo{files.length !== 1 ? 's' : ''}
                </Badge>
                
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleReset}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Limpar
                </Button>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        
        <Separator />
        
        <CardContent className="pt-4">
          {/* Status do Processamento */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {getStatusIcon()}
                <span className="text-sm font-medium">
                  {processingStatus.message}
                </span>
              </div>
              
              {processingStatus.currentPage && processingStatus.totalPages && (
                <Badge variant="secondary">
                  Página {processingStatus.currentPage} de {processingStatus.totalPages}
                </Badge>
              )}
            </div>
            
            {processingStatus.status !== 'idle' && (
              <Progress 
                value={processingStatus.progress} 
                className={cn('h-2', getStatusColor())}
              />
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Tabs de Conteúdo */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="upload" className="flex items-center space-x-1">
            <Upload className="h-4 w-4" />
            <span>Upload</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="preview" 
            disabled={!currentFile}
            className="flex items-center space-x-1"
          >
            <Eye className="h-4 w-4" />
            <span>Visualizar</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="processing" 
            disabled={!currentFile}
            className="flex items-center space-x-1"
          >
            <Cpu className="h-4 w-4" />
            <span>Processar</span>
          </TabsTrigger>
          
          <TabsTrigger 
            value="results" 
            disabled={processedData.length === 0}
            className="flex items-center space-x-1"
          >
            <Download className="h-4 w-4" />
            <span>Resultados</span>
          </TabsTrigger>
        </TabsList>
        
        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-4">
          <PDFDropzone
            onFilesAccepted={handleFilesAccepted}
            onFilesRejected={handleFileRejected}
            maxFileSize={maxFileSize}
            acceptedTypes={allowedTypes}
            files={files}
            onRemoveFile={handleRemoveFile}
          />
          
          {files.length > 0 && (
            <div className="text-center">
              <Button onClick={() => setActiveTab('preview')}>
                <Eye className="h-4 w-4 mr-2" />
                Visualizar PDF
              </Button>
            </div>
          )}
        </TabsContent>
        
        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-4">
          {currentFile ? (
            <>
              <PDFPreview 
                file={currentFile}
                onError={handleProcessingError}
              />
              
              <div className="text-center space-x-2">
                <Button 
                  onClick={handleStartProcessing}
                  disabled={processingStatus.status === 'processing'}
                >
                  <Cpu className="h-4 w-4 mr-2" />
                  Iniciar Processamento OCR
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={() => setActiveTab('upload')}
                >
                  Voltar ao Upload
                </Button>
              </div>
            </>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Nenhum arquivo selecionado para visualização.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
        
        {/* Processing Tab */}
        <TabsContent value="processing" className="space-y-4">
          {currentFile ? (
            <OCRProcessor
              file={currentFile}
              onProgress={handleProcessingProgress}
              onComplete={handleProcessingComplete}
              onError={handleProcessingError}
              autoStart={activeTab === 'processing'}
            />
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Nenhum arquivo selecionado para processamento.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
        
        {/* Results Tab */}
        <TabsContent value="results" className="space-y-4">
          {processedData.length > 0 ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold">
                  Dados Extraídos ({processedData.length} item{processedData.length !== 1 ? 's' : ''})
                </h3>
                
                <Button
                  onClick={() => {
                    const dataStr = JSON.stringify(processedData, null, 2);
                    const blob = new Blob([dataStr], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `dados_extraidos_${Date.now()}.json`;
                    link.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Baixar JSON
                </Button>
              </div>
              
              <div className="grid gap-4">
                {processedData.map((item, index) => (
                  <Card key={item.id}>
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center justify-between text-base">
                        <div className="flex items-center space-x-2">
                          <Badge variant={item.type === 'unknown' ? 'destructive' : 'default'}>
                            {item.type}
                          </Badge>
                          <span>Item {index + 1}</span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline">
                            Página {item.pageNumber}
                          </Badge>
                          <Badge 
                            variant={item.confidence > 0.8 ? 'default' : item.confidence > 0.6 ? 'secondary' : 'destructive'}
                          >
                            {Math.round(item.confidence * 100)}% confiança
                          </Badge>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    
                    <CardContent>
                      <div className="space-y-2">
                        {Object.entries(item.data).map(([key, value]) => (
                          <div key={key} className="flex justify-between text-sm">
                            <span className="font-medium text-gray-600">{key}:</span>
                            <span className="text-right">{String(value)}</span>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ) : (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Nenhum dado foi extraído ainda. Execute o processamento OCR primeiro.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PDFImporter;