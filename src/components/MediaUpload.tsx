import React, { useState, useRef, useCallback } from 'react';
import {
  Upload,
  File,
  Image,
  Video,
  FileText,
  X,
  Check,
  AlertCircle,
  Download,
  Eye,
  Trash2,
  Plus
} from 'lucide-react';

interface MediaFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  preview?: string;
  uploadProgress?: number;
  status: 'uploading' | 'completed' | 'error';
  error?: string;
}

interface MediaUploadProps {
  onFilesUploaded?: (files: MediaFile[]) => void;
  acceptedTypes?: string[];
  maxFileSize?: number; // in MB
  maxFiles?: number;
  showPreview?: boolean;
  className?: string;
}

const MediaUpload: React.FC<MediaUploadProps> = ({
  onFilesUploaded,
  acceptedTypes = ['image/*', 'video/*', 'application/pdf', '.doc', '.docx', '.ppt', '.pptx'],
  maxFileSize = 50, // 50MB
  maxFiles = 10,
  showPreview = true,
  className = ''
}) => {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return Image;
    if (type.startsWith('video/')) return Video;
    if (type.includes('pdf') || type.includes('document') || type.includes('presentation')) return FileText;
    return File;
  };

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `Arquivo muito grande. Máximo: ${maxFileSize}MB`;
    }

    // Check file type
    const isValidType = acceptedTypes.some(type => {
      if (type.includes('*')) {
        return file.type.startsWith(type.replace('*', ''));
      }
      return file.type === type || file.name.toLowerCase().endsWith(type);
    });

    if (!isValidType) {
      return 'Tipo de arquivo não suportado';
    }

    return null;
  };

  const createFilePreview = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      } else {
        resolve(undefined);
      }
    });
  };

  const simulateUpload = (fileId: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 30;
        if (progress >= 100) {
          progress = 100;
          clearInterval(interval);
          
          // Simulate success/failure
          if (Math.random() > 0.1) { // 90% success rate
            setFiles(prev => prev.map(f => 
              f.id === fileId 
                ? { ...f, uploadProgress: 100, status: 'completed', url: `https://example.com/files/${f.name}` }
                : f
            ));
            resolve(`https://example.com/files/${fileId}`);
          } else {
            setFiles(prev => prev.map(f => 
              f.id === fileId 
                ? { ...f, status: 'error', error: 'Falha no upload' }
                : f
            ));
            reject(new Error('Upload failed'));
          }
        } else {
          setFiles(prev => prev.map(f => 
            f.id === fileId ? { ...f, uploadProgress: progress } : f
          ));
        }
      }, 200);
    });
  };

  const processFiles = useCallback(async (fileList: FileList) => {
    const newFiles: MediaFile[] = [];
    
    for (let i = 0; i < Math.min(fileList.length, maxFiles - files.length); i++) {
      const file = fileList[i];
      const validation = validateFile(file);
      
      if (validation) {
        const errorFile: MediaFile = {
          id: generateId(),
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'error',
          error: validation
        };
        newFiles.push(errorFile);
      } else {
        const preview = await createFilePreview(file);
        const mediaFile: MediaFile = {
          id: generateId(),
          name: file.name,
          size: file.size,
          type: file.type,
          preview,
          uploadProgress: 0,
          status: 'uploading'
        };
        newFiles.push(mediaFile);
      }
    }

    setFiles(prev => [...prev, ...newFiles]);

    // Start uploads for valid files
    setIsUploading(true);
    const uploadPromises = newFiles
      .filter(f => f.status === 'uploading')
      .map(f => simulateUpload(f.id));

    try {
      await Promise.allSettled(uploadPromises);
    } finally {
      setIsUploading(false);
      if (onFilesUploaded) {
        onFilesUploaded(files.filter(f => f.status === 'completed'));
      }
    }
  }, [files, maxFiles, onFilesUploaded]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const droppedFiles = e.dataTransfer.files;
    if (droppedFiles.length > 0) {
      processFiles(droppedFiles);
    }
  }, [processFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) {
      processFiles(selectedFiles);
    }
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processFiles]);

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const retryUpload = (fileId: string) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, status: 'uploading', uploadProgress: 0, error: undefined }
        : f
    ));
    simulateUpload(fileId);
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <div
        className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
          isDragOver 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <div className="space-y-4">
          <div className={`mx-auto w-16 h-16 rounded-full flex items-center justify-center ${
            isDragOver ? 'bg-blue-100' : 'bg-gray-100'
          }`}>
            <Upload className={`h-8 w-8 ${
              isDragOver ? 'text-blue-600' : 'text-gray-600'
            }`} />
          </div>
          
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {isDragOver ? 'Solte os arquivos aqui' : 'Arraste arquivos ou clique para selecionar'}
            </h3>
            <p className="text-sm text-gray-600">
              Suporte para imagens, vídeos, PDFs e documentos até {maxFileSize}MB
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Máximo de {maxFiles} arquivos
            </p>
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900">Arquivos ({files.length})</h4>
          
          <div className="space-y-2">
            {files.map((file) => {
              const FileIcon = getFileIcon(file.type);
              
              return (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border"
                >
                  {/* Preview/Icon */}
                  <div className="flex-shrink-0">
                    {showPreview && file.preview ? (
                      <img 
                        src={file.preview} 
                        alt={file.name}
                        className="w-12 h-12 object-cover rounded-lg"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center border">
                        <FileIcon className="h-6 w-6 text-gray-600" />
                      </div>
                    )}
                  </div>
                  
                  {/* File Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h5 className="text-sm font-medium text-gray-900 truncate">
                        {file.name}
                      </h5>
                      <span className="text-xs text-gray-500">
                        {formatFileSize(file.size)}
                      </span>
                    </div>
                    
                    {/* Progress/Status */}
                    {file.status === 'uploading' && (
                      <div className="mt-2">
                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                          <span>Enviando...</span>
                          <span>{Math.round(file.uploadProgress || 0)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div 
                            className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${file.uploadProgress || 0}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                    
                    {file.status === 'completed' && (
                      <div className="flex items-center gap-1 mt-1">
                        <Check className="h-3 w-3 text-green-600" />
                        <span className="text-xs text-green-600">Upload concluído</span>
                      </div>
                    )}
                    
                    {file.status === 'error' && (
                      <div className="flex items-center gap-1 mt-1">
                        <AlertCircle className="h-3 w-3 text-red-600" />
                        <span className="text-xs text-red-600">{file.error}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Actions */}
                  <div className="flex items-center gap-1">
                    {file.status === 'completed' && file.url && (
                      <>
                        <button
                          onClick={() => window.open(file.url, '_blank')}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          title="Visualizar"
                        >
                          <Eye className="h-4 w-4 text-gray-600" />
                        </button>
                        <button
                          onClick={() => {
                            const a = document.createElement('a');
                            a.href = file.url!;
                            a.download = file.name;
                            a.click();
                          }}
                          className="p-1 hover:bg-gray-200 rounded transition-colors"
                          title="Download"
                        >
                          <Download className="h-4 w-4 text-gray-600" />
                        </button>
                      </>
                    )}
                    
                    {file.status === 'error' && (
                      <button
                        onClick={() => retryUpload(file.id)}
                        className="px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        Tentar novamente
                      </button>
                    )}
                    
                    <button
                      onClick={() => removeFile(file.id)}
                      className="p-1 hover:bg-red-100 rounded transition-colors"
                      title="Remover"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      
      {/* Upload Status */}
      {isUploading && (
        <div className="flex items-center gap-2 text-sm text-blue-600">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
          Enviando arquivos...
        </div>
      )}
    </div>
  );
};

export default MediaUpload;