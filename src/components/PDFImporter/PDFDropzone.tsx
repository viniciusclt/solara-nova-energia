import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface PDFFile {
  file: File;
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  extractedData?: any;
  error?: string;
}

interface PDFDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  onFileProcessed: (fileId: string, data: any) => void;
  onFileError: (fileId: string, error: string) => void;
  maxFiles?: number;
  maxSize?: number; // em MB
  className?: string;
}

export const PDFDropzone: React.FC<PDFDropzoneProps> = ({
  onFilesSelected,
  onFileProcessed,
  onFileError,
  maxFiles = 5,
  maxSize = 10,
  className
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<PDFFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: any[]) => {
    // Validar arquivos rejeitados
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(({ file, errors }) => 
        `${file.name}: ${errors.map((e: any) => e.message).join(', ')}`
      ).join('\n');
      
      onFileError('validation', `Arquivos rejeitados:\n${errors}`);
      return;
    }

    // Processar arquivos aceitos
    const newFiles: PDFFile[] = acceptedFiles.map(file => ({
      file,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      progress: 0
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
    onFilesSelected(acceptedFiles);
  }, [onFilesSelected, onFileError]);

  const { getRootProps, getInputProps, isDragActive, isDragReject } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles,
    maxSize: maxSize * 1024 * 1024, // Converter MB para bytes
    multiple: true
  });

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const retryFile = (fileId: string) => {
    setUploadedFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, status: 'pending', progress: 0, error: undefined }
        : f
    ));
    
    const file = uploadedFiles.find(f => f.id === fileId);
    if (file) {
      onFilesSelected([file.file]);
    }
  };

  const getStatusIcon = (status: PDFFile['status']) => {
    switch (status) {
      case 'pending':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'processing':
        return <Upload className="h-4 w-4 text-yellow-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: PDFFile['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Área de Drop */}
      <Card className={cn(
        'border-2 border-dashed transition-colors cursor-pointer',
        isDragActive && !isDragReject && 'border-blue-500 bg-blue-50',
        isDragReject && 'border-red-500 bg-red-50',
        !isDragActive && 'border-gray-300 hover:border-gray-400'
      )}>
        <CardContent className="p-8">
          <div {...getRootProps()} className="text-center">
            <input {...getInputProps()} />
            <Upload className={cn(
              'mx-auto h-12 w-12 mb-4',
              isDragActive && !isDragReject && 'text-blue-500',
              isDragReject && 'text-red-500',
              !isDragActive && 'text-gray-400'
            )} />
            
            {isDragActive ? (
              isDragReject ? (
                <p className="text-red-600 font-medium">
                  Arquivo não suportado. Apenas PDFs são aceitos.
                </p>
              ) : (
                <p className="text-blue-600 font-medium">
                  Solte os arquivos PDF aqui...
                </p>
              )
            ) : (
              <div className="space-y-2">
                <p className="text-lg font-medium text-gray-900">
                  Arraste e solte arquivos PDF aqui
                </p>
                <p className="text-sm text-gray-500">
                  ou clique para selecionar arquivos
                </p>
                <p className="text-xs text-gray-400">
                  Máximo {maxFiles} arquivos, até {maxSize}MB cada
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de Arquivos */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-900">
            Arquivos Selecionados ({uploadedFiles.length})
          </h3>
          
          {uploadedFiles.map((pdfFile) => (
            <Card key={pdfFile.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  {getStatusIcon(pdfFile.status)}
                  
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {pdfFile.file.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatFileSize(pdfFile.file.size)}
                    </p>
                    
                    {pdfFile.status === 'processing' && (
                      <div className="mt-2">
                        <Progress value={pdfFile.progress} className="h-2" />
                        <p className="text-xs text-gray-500 mt-1">
                          Processando... {pdfFile.progress}%
                        </p>
                      </div>
                    )}
                    
                    {pdfFile.error && (
                      <Alert className="mt-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          {pdfFile.error}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(pdfFile.status)}>
                    {pdfFile.status === 'pending' && 'Pendente'}
                    {pdfFile.status === 'processing' && 'Processando'}
                    {pdfFile.status === 'completed' && 'Concluído'}
                    {pdfFile.status === 'error' && 'Erro'}
                  </Badge>
                  
                  {pdfFile.status === 'error' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => retryFile(pdfFile.id)}
                    >
                      Tentar Novamente
                    </Button>
                  )}
                  
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => removeFile(pdfFile.id)}
                    disabled={pdfFile.status === 'processing'}
                  >
                    Remover
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default PDFDropzone;