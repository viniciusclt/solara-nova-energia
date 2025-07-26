import React, { useCallback, useState, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, AlertCircle, CheckCircle, Eye, X, RotateCcw, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface PDFFile {
  file: File;
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  extractedData?: Record<string, unknown>;
  error?: string;
  preview?: string;
  uploadedAt: Date;
  processedAt?: Date;
}

interface PDFDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  onFileProcessed: (fileId: string, data: Record<string, unknown>) => void;
  onFileError: (fileId: string, error: string) => void;
  maxFiles?: number;
  maxSize?: number; // em MB
  className?: string;
  showStats?: boolean;
  allowPreview?: boolean;
  autoProcess?: boolean;
}

export const PDFDropzone: React.FC<PDFDropzoneProps> = ({
  onFilesSelected,
  onFileProcessed,
  onFileError,
  maxFiles = 5,
  maxSize = 10,
  className,
  showStats = true,
  allowPreview = true,
  autoProcess = false
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<PDFFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPreview, setSelectedPreview] = useState<string | null>(null);
  const [dragCounter, setDragCounter] = useState(0);

  const onDrop = useCallback((acceptedFiles: File[], rejectedFiles: Array<{file: File, errors: Array<{message: string}>}>) => {
    // Validar arquivos rejeitados
    if (rejectedFiles.length > 0) {
      const errors = rejectedFiles.map(({ file, errors }) => 
        `${file.name}: ${errors.map((e: {message: string}) => e.message).join(', ')}`
      ).join('\n');
      
      onFileError('validation', `Arquivos rejeitados:\n${errors}`);
      return;
    }

    // Processar arquivos aceitos
    const newFiles: PDFFile[] = acceptedFiles.map(file => ({
      file,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      status: 'pending',
      progress: 0,
      uploadedAt: new Date()
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
    onFilesSelected(acceptedFiles);
    
    // Gerar preview se habilitado
    if (allowPreview) {
      newFiles.forEach(pdfFile => {
        generatePreview(pdfFile.file, pdfFile.id);
      });
    }
    
    // Auto processar se habilitado
    if (autoProcess) {
      setIsProcessing(true);
    }
    
    toast({
      title: 'Arquivos adicionados',
      description: `${acceptedFiles.length} arquivo(s) PDF adicionado(s) com sucesso.`
    });
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

  const generatePreview = async (file: File, fileId: string) => {
    try {
      const fileURL = URL.createObjectURL(file);
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, preview: fileURL } : f
      ));
    } catch (error) {
      console.error('Erro ao gerar preview:', error);
    }
  };

  const removeFile = (fileId: string) => {
    const file = uploadedFiles.find(f => f.id === fileId);
    if (file?.preview) {
      URL.revokeObjectURL(file.preview);
    }
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    
    toast({
      title: 'Arquivo removido',
      description: 'O arquivo foi removido da lista.'
    });
  };

  const clearAllFiles = () => {
    uploadedFiles.forEach(file => {
      if (file.preview) {
        URL.revokeObjectURL(file.preview);
      }
    });
    setUploadedFiles([]);
    
    toast({
      title: 'Lista limpa',
      description: 'Todos os arquivos foram removidos.'
    });
  };

  const retryFile = (fileId: string) => {
    setUploadedFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, status: 'pending', progress: 0, error: undefined, processedAt: undefined }
        : f
    ));
    
    const file = uploadedFiles.find(f => f.id === fileId);
    if (file) {
      onFilesSelected([file.file]);
      toast({
        title: 'Reprocessando arquivo',
        description: `Tentando processar ${file.file.name} novamente.`
      });
    }
  };

  const getFileStats = () => {
    const total = uploadedFiles.length;
    const completed = uploadedFiles.filter(f => f.status === 'completed').length;
    const processing = uploadedFiles.filter(f => f.status === 'processing').length;
    const errors = uploadedFiles.filter(f => f.status === 'error').length;
    const pending = uploadedFiles.filter(f => f.status === 'pending').length;
    const totalSize = uploadedFiles.reduce((acc, f) => acc + f.file.size, 0);
    
    return { total, completed, processing, errors, pending, totalSize };
  };

  const downloadFile = (pdfFile: PDFFile) => {
    const url = URL.createObjectURL(pdfFile.file);
    const a = document.createElement('a');
    a.href = url;
    a.download = pdfFile.file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Cleanup URLs on unmount
  useEffect(() => {
    return () => {
      uploadedFiles.forEach(file => {
        if (file.preview) {
          URL.revokeObjectURL(file.preview);
        }
      });
    };
  }, []);

  const stats = getFileStats();

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
      {/* Estatísticas */}
      {showStats && uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Estatísticas de Upload
              </span>
              {uploadedFiles.length > 1 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={clearAllFiles}
                  className="text-red-600 hover:text-red-700"
                >
                  <X className="h-4 w-4 mr-1" />
                  Limpar Tudo
                </Button>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-xs text-gray-500">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                <div className="text-xs text-gray-500">Concluídos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">{stats.processing}</div>
                <div className="text-xs text-gray-500">Processando</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
                <div className="text-xs text-gray-500">Erros</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{formatFileSize(stats.totalSize)}</div>
                <div className="text-xs text-gray-500">Tamanho Total</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Área de Drop */}
      <Card className={cn(
        'border-2 border-dashed transition-all duration-200 cursor-pointer',
        isDragActive && !isDragReject && 'border-blue-500 bg-blue-50 scale-105',
        isDragReject && 'border-red-500 bg-red-50',
        !isDragActive && 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Arquivos Selecionados ({uploadedFiles.length})</span>
              {stats.completed > 0 && (
                <Badge variant="outline" className="bg-green-50 text-green-700">
                  {stats.completed}/{stats.total} processados
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {uploadedFiles.map((pdfFile) => (
              <Card key={pdfFile.id} className="p-4 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start space-x-3 flex-1">
                    {getStatusIcon(pdfFile.status)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {pdfFile.file.name}
                        </p>
                        <Badge className={getStatusColor(pdfFile.status)}>
                          {pdfFile.status === 'pending' && 'Pendente'}
                          {pdfFile.status === 'processing' && 'Processando'}
                          {pdfFile.status === 'completed' && 'Concluído'}
                          {pdfFile.status === 'error' && 'Erro'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                        <span>{formatFileSize(pdfFile.file.size)}</span>
                        <span>Adicionado: {pdfFile.uploadedAt.toLocaleTimeString()}</span>
                        {pdfFile.processedAt && (
                          <span>Processado: {pdfFile.processedAt.toLocaleTimeString()}</span>
                        )}
                      </div>
                      
                      {pdfFile.status === 'processing' && (
                        <div className="mb-2">
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
                    {/* Preview Button */}
                    {allowPreview && pdfFile.preview && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button size="sm" variant="outline">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl h-[80vh]">
                          <DialogHeader>
                            <DialogTitle>{pdfFile.file.name}</DialogTitle>
                          </DialogHeader>
                          <div className="flex-1 overflow-hidden">
                            <iframe
                              src={pdfFile.preview}
                              className="w-full h-full border rounded"
                              title={`Preview de ${pdfFile.file.name}`}
                            />
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                    
                    {/* Download Button */}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadFile(pdfFile)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    
                    {/* Retry Button */}
                    {pdfFile.status === 'error' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => retryFile(pdfFile.id)}
                        className="text-yellow-600 hover:text-yellow-700"
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {/* Remove Button */}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFile(pdfFile.id)}
                      disabled={pdfFile.status === 'processing'}
                      className="text-red-600 hover:text-red-700"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PDFDropzone;