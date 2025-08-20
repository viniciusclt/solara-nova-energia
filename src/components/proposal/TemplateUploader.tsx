import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload,
  File,
  FileText,
  Image,
  Presentation,
  X,
  CheckCircle,
  AlertCircle,
  Loader,
  Download,
  Eye,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { useProposalEditor } from '../../hooks/useProposalEditor';
import { TemplateUpload, TemplateConversion } from '../../types/proposal';
import { cn } from '../../utils/cn';
import { toast } from 'sonner';

// =====================================================================================
// INTERFACES
// =====================================================================================

interface TemplateUploaderProps {
  className?: string;
  onTemplateConverted?: (elements: ProposalElement[]) => void;
  maxFileSize?: number; // em MB
  acceptedFormats?: string[];
}

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  progress: number;
  preview?: string;
  convertedElements?: ProposalElement[];
  error?: string;
}

// =====================================================================================
// COMPONENTE PRINCIPAL
// =====================================================================================

export const TemplateUploader: React.FC<TemplateUploaderProps> = ({
  className,
  onTemplateConverted,
  maxFileSize = 50, // 50MB por padrão
  acceptedFormats = ['.doc', '.docx', '.pdf', '.ppt', '.pptx'],
}) => {
  const { addElements } = useProposalEditor();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // =====================================================================================
  // ESTADO
  // =====================================================================================
  
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // =====================================================================================
  // UTILITÁRIOS
  // =====================================================================================

  const getFileIcon = (type: string) => {
    if (type.includes('pdf')) return FileText;
    if (type.includes('word') || type.includes('document')) return File;
    if (type.includes('presentation') || type.includes('powerpoint')) return Presentation;
    if (type.includes('image')) return Image;
    return File;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isValidFileType = (file: File) => {
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    return acceptedFormats.includes(extension);
  };

  const isValidFileSize = (file: File) => {
    return file.size <= maxFileSize * 1024 * 1024;
  };

  // =====================================================================================
  // CONVERSÃO DE TEMPLATES
  // =====================================================================================

  const convertFileToElements = async (file: File): Promise<ProposalElement[]> => {
    // Simular conversão de arquivo para elementos do canvas
    // Em uma implementação real, isso seria feito no backend
    
    const fileType = file.type;
    const elements: ProposalElement[] = [];
    
    // Simular tempo de processamento
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
    
    if (fileType.includes('pdf')) {
      // Converter PDF para elementos
      elements.push(
        {
          id: `pdf_page_${Date.now()}_1`,
          type: 'image',
          src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          alt: 'Página 1 do PDF',
          fit: 'contain',
          transform: {
            position: { x: 100, y: 100 },
            size: { width: 600, height: 800 },
            rotation: 0,
            scale: 1,
          },
          opacity: 1,
          visible: true,
          locked: false,
          zIndex: 1,
        },
        {
          id: `pdf_text_${Date.now()}_1`,
          type: 'text',
          content: 'Texto extraído do PDF',
          fontSize: 16,
          fontFamily: 'Inter',
          fontWeight: 'normal',
          color: '#000000',
          textAlign: 'left',
          textDecoration: 'none',
          transform: {
            position: { x: 100, y: 920 },
            size: { width: 600, height: 50 },
            rotation: 0,
            scale: 1,
          },
          opacity: 1,
          visible: true,
          locked: false,
          zIndex: 2,
        }
      );
    } else if (fileType.includes('word') || fileType.includes('document')) {
      // Converter DOC/DOCX para elementos
      elements.push(
        {
          id: `doc_title_${Date.now()}`,
          type: 'text',
          content: 'Título do Documento',
          fontSize: 24,
          fontFamily: 'Inter',
          fontWeight: 'bold',
          color: '#1f2937',
          textAlign: 'center',
          textDecoration: 'none',
          transform: {
            position: { x: 200, y: 100 },
            size: { width: 800, height: 60 },
            rotation: 0,
            scale: 1,
          },
          opacity: 1,
          visible: true,
          locked: false,
          zIndex: 1,
        },
        {
          id: `doc_content_${Date.now()}`,
          type: 'text',
          content: 'Conteúdo do documento convertido automaticamente. Este texto representa o conteúdo extraído do arquivo Word.',
          fontSize: 14,
          fontFamily: 'Inter',
          fontWeight: 'normal',
          color: '#374151',
          textAlign: 'left',
          textDecoration: 'none',
          transform: {
            position: { x: 200, y: 200 },
            size: { width: 800, height: 400 },
            rotation: 0,
            scale: 1,
          },
          opacity: 1,
          visible: true,
          locked: false,
          zIndex: 2,
        }
      );
    } else if (fileType.includes('presentation') || fileType.includes('powerpoint')) {
      // Converter PPT/PPTX para elementos
      elements.push(
        {
          id: `ppt_slide_${Date.now()}_1`,
          type: 'shape',
          shapeType: 'rectangle',
          fill: '#f3f4f6',
          stroke: {
            color: '#d1d5db',
            width: 2,
          },
          borderRadius: 8,
          transform: {
            position: { x: 100, y: 100 },
            size: { width: 800, height: 600 },
            rotation: 0,
            scale: 1,
          },
          opacity: 1,
          visible: true,
          locked: false,
          zIndex: 1,
        },
        {
          id: `ppt_title_${Date.now()}`,
          type: 'text',
          content: 'Slide Convertido',
          fontSize: 32,
          fontFamily: 'Inter',
          fontWeight: 'bold',
          color: '#1f2937',
          textAlign: 'center',
          textDecoration: 'none',
          transform: {
            position: { x: 150, y: 150 },
            size: { width: 700, height: 80 },
            rotation: 0,
            scale: 1,
          },
          opacity: 1,
          visible: true,
          locked: false,
          zIndex: 2,
        }
      );
    }
    
    return elements;
  };

  // =====================================================================================
  // HANDLERS
  // =====================================================================================

  const handleFileSelect = useCallback((files: FileList | null) => {
    if (!files) return;
    
    const validFiles: File[] = [];
    const invalidFiles: string[] = [];
    
    Array.from(files).forEach(file => {
      if (!isValidFileType(file)) {
        invalidFiles.push(`${file.name}: formato não suportado`);
        return;
      }
      
      if (!isValidFileSize(file)) {
        invalidFiles.push(`${file.name}: arquivo muito grande (máx. ${maxFileSize}MB)`);
        return;
      }
      
      validFiles.push(file);
    });
    
    if (invalidFiles.length > 0) {
      toast.error(`Arquivos inválidos:\n${invalidFiles.join('\n')}`);
    }
    
    if (validFiles.length > 0) {
      processFiles(validFiles);
    }
  }, [maxFileSize]);

  const processFiles = async (files: File[]) => {
    setIsProcessing(true);
    
    const newFiles: UploadedFile[] = files.map(file => ({
      id: `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'uploading',
      progress: 0,
    }));
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    // Processar cada arquivo
    for (const uploadedFile of newFiles) {
      try {
        // Simular upload
        for (let progress = 0; progress <= 100; progress += 10) {
          await new Promise(resolve => setTimeout(resolve, 100));
          setUploadedFiles(prev => prev.map(f => 
            f.id === uploadedFile.id 
              ? { ...f, progress }
              : f
          ));
        }
        
        // Mudar para processamento
        setUploadedFiles(prev => prev.map(f => 
          f.id === uploadedFile.id 
            ? { ...f, status: 'processing', progress: 0 }
            : f
        ));
        
        // Converter arquivo
        const elements = await convertFileToElements(uploadedFile.file);
        
        // Marcar como concluído
        setUploadedFiles(prev => prev.map(f => 
          f.id === uploadedFile.id 
            ? { 
                ...f, 
                status: 'completed', 
                progress: 100,
                convertedElements: elements,
              }
            : f
        ));
        
        toast.success(`${uploadedFile.name} convertido com sucesso!`);
        
      } catch (error) {
        console.error('Erro ao processar arquivo:', error);
        
        setUploadedFiles(prev => prev.map(f => 
          f.id === uploadedFile.id 
            ? { 
                ...f, 
                status: 'error',
                error: 'Erro ao processar arquivo',
              }
            : f
        ));
        
        toast.error(`Erro ao processar ${uploadedFile.name}`);
      }
    }
    
    setIsProcessing(false);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    handleFileSelect(e.dataTransfer.files);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const addToCanvas = (uploadedFile: UploadedFile) => {
    if (!uploadedFile.convertedElements) return;
    
    addElements(uploadedFile.convertedElements);
    onTemplateConverted?.(uploadedFile.convertedElements);
    toast.success('Elementos adicionados ao canvas!');
  };

  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const retryConversion = async (fileId: string) => {
    const file = uploadedFiles.find(f => f.id === fileId);
    if (!file) return;
    
    setUploadedFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, status: 'processing', progress: 0, error: undefined }
        : f
    ));
    
    try {
      const elements = await convertFileToElements(file.file);
      
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { 
              ...f, 
              status: 'completed', 
              progress: 100,
              convertedElements: elements,
              error: undefined,
            }
          : f
      ));
      
      toast.success(`${file.name} convertido com sucesso!`);
    } catch (error) {
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId 
          ? { 
              ...f, 
              status: 'error',
              error: 'Erro ao processar arquivo',
            }
          : f
      ));
      
      toast.error(`Erro ao processar ${file.name}`);
    }
  };

  // =====================================================================================
  // COMPONENTES
  // =====================================================================================

  const FileItem: React.FC<{ file: UploadedFile }> = ({ file }) => {
    const Icon = getFileIcon(file.type);
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="bg-white border border-gray-200 rounded-lg p-4"
      >
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0">
            <Icon className="w-8 h-8 text-gray-400" />
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-900 truncate">
                {file.name}
              </h4>
              
              <div className="flex items-center space-x-2">
                {file.status === 'completed' && file.convertedElements && (
                  <button
                    onClick={() => addToCanvas(file)}
                    className="p-1 text-green-600 hover:bg-green-100 rounded transition-colors"
                    title="Adicionar ao canvas"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                )}
                
                {file.status === 'error' && (
                  <button
                    onClick={() => retryConversion(file.id)}
                    className="p-1 text-blue-600 hover:bg-blue-100 rounded transition-colors"
                    title="Tentar novamente"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                )}
                
                <button
                  onClick={() => removeFile(file.id)}
                  className="p-1 text-red-600 hover:bg-red-100 rounded transition-colors"
                  title="Remover"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            <p className="text-xs text-gray-500 mt-1">
              {formatFileSize(file.size)}
            </p>
            
            {/* Status */}
            <div className="mt-2">
              {file.status === 'uploading' && (
                <div className="space-y-1">
                  <div className="flex items-center space-x-2 text-xs text-blue-600">
                    <Loader className="w-3 h-3 animate-spin" />
                    <span>Enviando... {file.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div 
                      className="bg-blue-600 h-1 rounded-full transition-all duration-300"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                </div>
              )}
              
              {file.status === 'processing' && (
                <div className="flex items-center space-x-2 text-xs text-amber-600">
                  <Loader className="w-3 h-3 animate-spin" />
                  <span>Convertendo...</span>
                </div>
              )}
              
              {file.status === 'completed' && (
                <div className="flex items-center space-x-2 text-xs text-green-600">
                  <CheckCircle className="w-3 h-3" />
                  <span>Convertido ({file.convertedElements?.length || 0} elementos)</span>
                </div>
              )}
              
              {file.status === 'error' && (
                <div className="flex items-center space-x-2 text-xs text-red-600">
                  <AlertCircle className="w-3 h-3" />
                  <span>{file.error || 'Erro desconhecido'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  // =====================================================================================
  // RENDER
  // =====================================================================================

  return (
    <div className={cn("space-y-4", className)}>
      {/* Área de Upload */}
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={cn(
          "border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200",
          isDragOver
            ? "border-blue-400 bg-blue-50"
            : "border-gray-300 hover:border-gray-400"
        )}
      >
        <Upload className={cn(
          "w-12 h-12 mx-auto mb-4 transition-colors",
          isDragOver ? "text-blue-500" : "text-gray-400"
        )} />
        
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Upload de Templates
        </h3>
        
        <p className="text-sm text-gray-600 mb-4">
          Arraste arquivos aqui ou clique para selecionar
        </p>
        
        <div className="flex flex-wrap justify-center gap-2 text-xs text-gray-500 mb-4">
          {acceptedFormats.map(format => (
            <span key={format} className="px-2 py-1 bg-gray-100 rounded">
              {format.toUpperCase()}
            </span>
          ))}
        </div>
        
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isProcessing}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          Selecionar Arquivos
        </button>
        
        <p className="text-xs text-gray-500 mt-2">
          Máximo {maxFileSize}MB por arquivo
        </p>
        
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedFormats.join(',')}
          onChange={(e) => handleFileSelect(e.target.files)}
          className="hidden"
        />
      </div>

      {/* Lista de Arquivos */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-900">
              Arquivos ({uploadedFiles.length})
            </h4>
            
            {uploadedFiles.some(f => f.status === 'completed') && (
              <button
                onClick={() => {
                  const completedFiles = uploadedFiles.filter(f => f.status === 'completed' && f.convertedElements);
                  const allElements = completedFiles.flatMap(f => f.convertedElements || []);
                  if (allElements.length > 0) {
                    addElements(allElements);
                    onTemplateConverted?.(allElements);
                    toast.success(`${allElements.length} elementos adicionados ao canvas!`);
                  }
                }}
                className="text-xs px-3 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Adicionar Todos
              </button>
            )}
          </div>
          
          <AnimatePresence>
            {uploadedFiles.map(file => (
              <FileItem key={file.id} file={file} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default TemplateUploader;