// ============================================================================
// VideoUploader - Componente para upload de vídeos
// ============================================================================

import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, Play, Pause, RotateCcw, FileVideo, AlertCircle, CheckCircle } from 'lucide-react';
import {
  VideoUploaderProps,
  VideoUpload,
  UploadConfig,
  UploadStatus,
  VideoContentType,
  VideoPrivacyLevel
} from '@/types/video';
import { useVideoUpload } from '@/hooks/useVideo';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/**
 * Componente para upload de vídeos com drag and drop
 */
export function VideoUploader({
  config,
  onUploadStart,
  onUploadProgress,
  onUploadComplete,
  onUploadError,
  className,
  multiple = false,
  dragAndDrop = true,
  showProgress = true,
  showPreview = true
}: VideoUploaderProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadSettings, setUploadSettings] = useState({
    contentType: 'training' as VideoContentType,
    privacy: 'private' as VideoPrivacyLevel,
    generateThumbnails: true,
    autoProcess: true
  });
  const [showSettings, setShowSettings] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    uploads,
    currentUpload,
    isUploading,
    uploadFile,
    pauseUpload,
    cancelUpload,
    retryUpload,
    clearCompleted
  } = useVideoUpload(config);

  // Validação de arquivo
  const validateFile = useCallback((file: File): string | null => {
    const maxSize = config?.maxFileSize || 5 * 1024 * 1024 * 1024; // 5GB
    const allowedFormats = config?.allowedFormats || ['mp4', 'webm', 'avi', 'mov', 'mkv'];
    
    if (file.size > maxSize) {
      return `Arquivo muito grande. Tamanho máximo: ${(maxSize / (1024 * 1024 * 1024)).toFixed(1)}GB`;
    }
    
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !allowedFormats.includes(extension)) {
      return `Formato não suportado. Formatos aceitos: ${allowedFormats.join(', ')}`;
    }
    
    return null;
  }, [config]);

  // Manipuladores de drag and drop
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFileSelection(files);
  }, []);

  // Seleção de arquivos
  const handleFileSelection = useCallback((files: File[]) => {
    const validFiles: File[] = [];
    const errors: string[] = [];
    
    files.forEach(file => {
      const error = validateFile(file);
      if (error) {
        errors.push(`${file.name}: ${error}`);
      } else {
        validFiles.push(file);
      }
    });
    
    if (errors.length > 0) {
      toast.error(`Arquivos inválidos:\n${errors.join('\n')}`);
    }
    
    if (validFiles.length > 0) {
      if (multiple) {
        setSelectedFiles(prev => [...prev, ...validFiles]);
      } else {
        setSelectedFiles([validFiles[0]]);
      }
    }
  }, [validateFile, multiple]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFileSelection(files);
  }, [handleFileSelection]);

  // Upload de arquivos
  const handleUpload = useCallback(async () => {
    if (selectedFiles.length === 0) {
      toast.error('Selecione pelo menos um arquivo');
      return;
    }
    
    const uploadConfig: Partial<UploadConfig> = {
      ...config,
      contentType: uploadSettings.contentType,
      privacy: uploadSettings.privacy,
      generateThumbnails: uploadSettings.generateThumbnails,
      autoProcess: uploadSettings.autoProcess
    };
    
    try {
      for (const file of selectedFiles) {
        onUploadStart?.({
          id: '',
          title: file.name,
          fileName: file.name,
          file,
          contentType: uploadSettings.contentType,
          privacy: uploadSettings.privacy,
          status: 'uploading',
          thumbnails: [],
          subtitles: [],
          chapters: [],
          qualities: [],
          streamingUrls: [],
          comments: [],
          uploadedBy: '',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          tags: [],
          playlistIds: [],
          relatedVideoIds: [],
          allowedUsers: [],
          allowedRoles: []
        });
        
        await uploadFile(file, uploadConfig);
      }
      
      setSelectedFiles([]);
      toast.success('Upload iniciado com sucesso!');
    } catch (error) {
      toast.error(`Erro no upload: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }, [selectedFiles, uploadSettings, config, uploadFile, onUploadStart]);

  // Remover arquivo selecionado
  const removeSelectedFile = useCallback((index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  }, []);

  // Formatação de tamanho de arquivo
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // Status do upload
  const getStatusIcon = useCallback((status: UploadStatus) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return <Play className="h-4 w-4 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <X className="h-4 w-4 text-gray-500" />;
      default:
        return <FileVideo className="h-4 w-4 text-gray-500" />;
    }
  }, []);

  const getStatusColor = useCallback((status: UploadStatus) => {
    switch (status) {
      case 'uploading':
      case 'processing':
        return 'bg-blue-500';
      case 'completed':
        return 'bg-green-500';
      case 'error':
        return 'bg-red-500';
      case 'cancelled':
        return 'bg-gray-500';
      default:
        return 'bg-gray-300';
    }
  }, []);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Área de Upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload de Vídeos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drag and Drop Area */}
          {dragAndDrop && (
            <div
              className={cn(
                'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
                isDragOver
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/20'
                  : 'border-gray-300 dark:border-gray-600 hover:border-gray-400'
              )}
              onDragEnter={handleDragEnter}
              onDragLeave={handleDragLeave}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
            >
              <FileVideo className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium mb-2">
                Arraste e solte seus vídeos aqui
              </p>
              <p className="text-sm text-gray-500 mb-4">
                ou clique para selecionar arquivos
              </p>
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                Selecionar Arquivos
              </Button>
            </div>
          )}
          
          {/* Input de arquivo oculto */}
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            multiple={multiple}
            onChange={handleFileInputChange}
            className="hidden"
          />
          
          {/* Configurações de Upload */}
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowSettings(!showSettings)}
            >
              Configurações {showSettings ? '▼' : '▶'}
            </Button>
            
            {uploads.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearCompleted}
              >
                Limpar Concluídos
              </Button>
            )}
          </div>
          
          {showSettings && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="contentType">Tipo de Conteúdo</Label>
                <Select
                  value={uploadSettings.contentType}
                  onValueChange={(value: VideoContentType) => 
                    setUploadSettings(prev => ({ ...prev, contentType: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="training">Treinamento</SelectItem>
                    <SelectItem value="presentation">Apresentação</SelectItem>
                    <SelectItem value="demo">Demonstração</SelectItem>
                    <SelectItem value="tutorial">Tutorial</SelectItem>
                    <SelectItem value="meeting">Reunião</SelectItem>
                    <SelectItem value="webinar">Webinar</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="privacy">Privacidade</Label>
                <Select
                  value={uploadSettings.privacy}
                  onValueChange={(value: VideoPrivacyLevel) => 
                    setUploadSettings(prev => ({ ...prev, privacy: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="private">Privado</SelectItem>
                    <SelectItem value="company_only">Apenas Empresa</SelectItem>
                    <SelectItem value="team_only">Apenas Equipe</SelectItem>
                    <SelectItem value="unlisted">Não Listado</SelectItem>
                    <SelectItem value="public">Público</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="generateThumbnails"
                  checked={uploadSettings.generateThumbnails}
                  onCheckedChange={(checked) => 
                    setUploadSettings(prev => ({ ...prev, generateThumbnails: checked }))
                  }
                />
                <Label htmlFor="generateThumbnails">Gerar Thumbnails</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="autoProcess"
                  checked={uploadSettings.autoProcess}
                  onCheckedChange={(checked) => 
                    setUploadSettings(prev => ({ ...prev, autoProcess: checked }))
                  }
                />
                <Label htmlFor="autoProcess">Processar Automaticamente</Label>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Arquivos Selecionados */}
      {selectedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Arquivos Selecionados ({selectedFiles.length})</span>
              <Button onClick={handleUpload} disabled={isUploading}>
                {isUploading ? 'Enviando...' : 'Iniciar Upload'}
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {selectedFiles.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileVideo className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="font-medium">{file.name}</p>
                      <p className="text-sm text-gray-500">{formatFileSize(file.size)}</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeSelectedFile(index)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Lista de Uploads */}
      {uploads.length > 0 && showProgress && (
        <Card>
          <CardHeader>
            <CardTitle>Uploads em Andamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploads.map((upload) => (
                <div key={upload.id} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getStatusIcon(upload.status)}
                      <div>
                        <p className="font-medium">{upload.title}</p>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {upload.status === 'uploading' ? 'Enviando' :
                             upload.status === 'processing' ? 'Processando' :
                             upload.status === 'completed' ? 'Concluído' :
                             upload.status === 'error' ? 'Erro' :
                             upload.status === 'cancelled' ? 'Cancelado' : 'Aguardando'}
                          </Badge>
                          {upload.uploadProgress && (
                            <span className="text-sm text-gray-500">
                              {formatFileSize(upload.uploadProgress.uploadedBytes)} / {formatFileSize(upload.uploadProgress.totalBytes)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {upload.status === 'uploading' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => pauseUpload(upload.id)}
                        >
                          <Pause className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {upload.status === 'error' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => retryUpload(upload.id)}
                        >
                          <RotateCcw className="h-4 w-4" />
                        </Button>
                      )}
                      
                      {(upload.status === 'uploading' || upload.status === 'processing') && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => cancelUpload(upload.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  {upload.uploadProgress && (
                    <div className="space-y-1">
                      <Progress 
                        value={upload.uploadProgress.percentage} 
                        className="h-2"
                      />
                      <div className="flex justify-between text-xs text-gray-500">
                        <span>{upload.uploadProgress.percentage.toFixed(1)}%</span>
                        {upload.uploadProgress.speed > 0 && (
                          <span>
                            {formatFileSize(upload.uploadProgress.speed)}/s - 
                            {Math.round(upload.uploadProgress.estimatedTimeRemaining)}s restantes
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {upload.processingProgress && (
                    <div className="space-y-1">
                      <div className="text-sm text-gray-600">
                        {upload.processingProgress.currentStep}
                      </div>
                      <Progress 
                        value={upload.processingProgress.percentage} 
                        className="h-2"
                      />
                    </div>
                  )}
                  
                  {upload.error && (
                    <div className="text-sm text-red-600 bg-red-50 dark:bg-red-950/20 p-2 rounded">
                      {upload.error.message}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default VideoUploader;