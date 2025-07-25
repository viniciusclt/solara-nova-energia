import React, { useState, useEffect } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  ChevronLeft, 
  ChevronRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCw, 
  Download,
  FileText,
  AlertCircle,
  Maximize2
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Configurar o worker do PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

interface PDFPreviewProps {
  file: File;
  onPageChange?: (pageNumber: number) => void;
  onError?: (error: string) => void;
  className?: string;
  showControls?: boolean;
  maxHeight?: number;
}

export const PDFPreview: React.FC<PDFPreviewProps> = ({
  file,
  onPageChange,
  onError,
  className,
  showControls = true,
  maxHeight = 600
}) => {
  const [numPages, setNumPages] = useState<number>(0);
  const [pageNumber, setPageNumber] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.0);
  const [rotation, setRotation] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  useEffect(() => {
    if (file) {
      const url = URL.createObjectURL(file);
      setFileUrl(url);
      
      return () => {
        URL.revokeObjectURL(url);
      };
    }
  }, [file]);

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setIsLoading(false);
    setError(null);
  };

  const onDocumentLoadError = (error: Error) => {
    console.error('Erro ao carregar PDF:', error);
    const errorMessage = 'Erro ao carregar o PDF. Verifique se o arquivo não está corrompido.';
    setError(errorMessage);
    setIsLoading(false);
    onError?.(errorMessage);
  };

  const goToPrevPage = () => {
    if (pageNumber > 1) {
      const newPage = pageNumber - 1;
      setPageNumber(newPage);
      onPageChange?.(newPage);
    }
  };

  const goToNextPage = () => {
    if (pageNumber < numPages) {
      const newPage = pageNumber + 1;
      setPageNumber(newPage);
      onPageChange?.(newPage);
    }
  };

  const zoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3.0));
  };

  const zoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5));
  };

  const rotate = () => {
    setRotation(prev => (prev + 90) % 360);
  };

  const resetView = () => {
    setScale(1.0);
    setRotation(0);
  };

  const downloadFile = () => {
    if (fileUrl) {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = file.name;
      link.click();
    }
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (error) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* Informações do Arquivo */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center justify-between text-base">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4" />
              <span className="truncate">{file.name}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">
                {formatFileSize(file.size)}
              </Badge>
              {numPages > 0 && (
                <Badge variant="outline">
                  {numPages} página{numPages !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        
        {showControls && (
          <>
            <Separator />
            <CardContent className="pt-3">
              <div className="flex items-center justify-between">
                {/* Navegação de Páginas */}
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={goToPrevPage}
                    disabled={pageNumber <= 1 || isLoading}
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  
                  <span className="text-sm text-gray-600 min-w-[80px] text-center">
                    {isLoading ? 'Carregando...' : `${pageNumber} de ${numPages}`}
                  </span>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={goToNextPage}
                    disabled={pageNumber >= numPages || isLoading}
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
                
                {/* Controles de Zoom e Rotação */}
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={zoomOut}
                    disabled={scale <= 0.5}
                  >
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  
                  <span className="text-sm text-gray-600 min-w-[50px] text-center">
                    {Math.round(scale * 100)}%
                  </span>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={zoomIn}
                    disabled={scale >= 3.0}
                  >
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={rotate}
                  >
                    <RotateCw className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={toggleFullscreen}
                  >
                    <Maximize2 className="h-4 w-4" />
                  </Button>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={downloadFile}
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              
              {/* Botão Reset */}
              {(scale !== 1.0 || rotation !== 0) && (
                <div className="mt-2 text-center">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={resetView}
                    className="text-xs"
                  >
                    Resetar Visualização
                  </Button>
                </div>
              )}
            </CardContent>
          </>
        )}
      </Card>
      
      {/* Visualizador PDF */}
      <Card className={cn(
        'overflow-hidden',
        isFullscreen && 'fixed inset-0 z-50 rounded-none'
      )}>
        <CardContent className={cn(
          'p-0 flex justify-center',
          isFullscreen && 'h-full'
        )}>
          <div 
            className={cn(
              'overflow-auto bg-gray-100 flex justify-center items-start p-4',
              isFullscreen ? 'w-full h-full' : `max-h-[${maxHeight}px]`
            )}
          >
            {fileUrl && (
              <Document
                file={fileUrl}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={onDocumentLoadError}
                loading={
                  <div className="flex items-center justify-center p-8">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                      <p className="text-sm text-gray-600">Carregando PDF...</p>
                    </div>
                  </div>
                }
                error={
                  <div className="flex items-center justify-center p-8">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Erro ao carregar o PDF. Verifique se o arquivo não está corrompido.
                      </AlertDescription>
                    </Alert>
                  </div>
                }
              >
                <Page
                  pageNumber={pageNumber}
                  scale={scale}
                  rotate={rotation}
                  loading={
                    <div className="flex items-center justify-center p-4">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                    </div>
                  }
                  error={
                    <div className="p-4">
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Erro ao carregar a página {pageNumber}
                        </AlertDescription>
                      </Alert>
                    </div>
                  }
                  className="shadow-lg"
                />
              </Document>
            )}
          </div>
          
          {/* Botão para sair do fullscreen */}
          {isFullscreen && (
            <Button
              className="absolute top-4 right-4 z-10"
              variant="secondary"
              size="sm"
              onClick={toggleFullscreen}
            >
              Sair do Fullscreen
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PDFPreview;