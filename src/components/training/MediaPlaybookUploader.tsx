// ============================================================================
// MediaPlaybookUploader - Componente unificado para upload de mídia e playbooks
// ============================================================================

import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import {
  Upload,
  FileText,
  Video,
  Image,
  File,
  X,
  Eye,
  Download,
  AlertCircle,
  CheckCircle2,
  Play,
  Pause,
  Settings,
  Tag,
  User,
  Calendar,
  Clock,
  Folder,
  Plus,
  Trash2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/secureLogger';
import { cn } from '@/lib/utils';

const { logInfo, logError } = logger;

// Tipos de arquivo suportados
export type MediaType = 'video' | 'image' | 'document' | 'playbook' | 'audio';

export interface MediaFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  mediaType: MediaType;
  preview?: string;
  thumbnail?: string;
  uploadProgress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  url?: string;
  metadata?: {
    title?: string;
    description?: string;
    tags?: string[];
    category?: string;
    duration?: number;
    resolution?: string;
    author?: string;
    createdAt?: Date;
    isPublic?: boolean;
    ocrData?: Record<string, unknown>;
  };
}

export interface MediaPlaybookUploaderProps {
  onFilesUploaded?: (files: MediaFile[]) => void;
  onFileProcessed?: (file: MediaFile) => void;
  maxFiles?: number;
  maxFileSize?: number; // em MB
  acceptedTypes?: {
    video?: string[];
    image?: string[];
    document?: string[];
    playbook?: string[];
    audio?: string[];
  };
  showMetadataEditor?: boolean;
  allowBulkUpload?: boolean;
  storageConfig?: {
    bucket: string;
    folder?: string;
  };
  className?: string;
}

const DEFAULT_ACCEPTED_TYPES = {
  video: ['video/mp4', 'video/webm', 'video/ogg', 'video/avi', 'video/mov'],
  image: ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  playbook: ['application/pdf', 'text/markdown', 'application/json'],
  audio: ['audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a']
};

const MEDIA_TYPE_CATEGORIES = {
  training: 'Treinamento',
  documentation: 'Documentação',
  presentation: 'Apresentação',
  tutorial: 'Tutorial',
  reference: 'Referência',
  template: 'Template'
};

const MediaPlaybookUploader: React.FC<MediaPlaybookUploaderProps> = ({
  onFilesUploaded,
  onFileProcessed,
  maxFiles = 20,
  maxFileSize = 100,
  acceptedTypes = DEFAULT_ACCEPTED_TYPES,
  showMetadataEditor = true,
  allowBulkUpload = true,
  storageConfig = { bucket: 'training-media', folder: 'uploads' },
  className = ''
}) => {
  const [files, setFiles] = useState<MediaFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<MediaFile | null>(null);
  const [showMetadataDialog, setShowMetadataDialog] = useState(false);
  const [activeTab, setActiveTab] = useState<MediaType>('video');
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Determinar tipo de mídia baseado no tipo do arquivo
  const getMediaType = (file: File): MediaType => {
    const type = file.type.toLowerCase();
    if (type.startsWith('video/')) return 'video';
    if (type.startsWith('image/')) return 'image';
    if (type.startsWith('audio/')) return 'audio';
    if (type.includes('pdf') || type.includes('document') || type.includes('text')) {
      // Verificar se é um playbook baseado no nome ou conteúdo
      if (file.name.toLowerCase().includes('playbook') || file.name.toLowerCase().includes('manual')) {
        return 'playbook';
      }
      return 'document';
    }
    return 'document';
  };

  // Obter ícone baseado no tipo de mídia
  const getMediaIcon = (mediaType: MediaType) => {
    switch (mediaType) {
      case 'video': return Video;
      case 'image': return Image;
      case 'audio': return Play;
      case 'playbook': return FileText;
      case 'document': return File;
      default: return File;
    }
  };

  // Validar arquivo
  const validateFile = (file: File): string | null => {
    // Verificar tamanho
    if (file.size > maxFileSize * 1024 * 1024) {
      return `Arquivo muito grande. Máximo: ${maxFileSize}MB`;
    }

    // Verificar tipo
    const mediaType = getMediaType(file);
    const allowedTypes = acceptedTypes[mediaType] || [];
    
    const isValidType = allowedTypes.some(type => {
      if (type.includes('*')) {
        return file.type.startsWith(type.replace('*', ''));
      }
      return file.type === type;
    });

    if (!isValidType) {
      return `Tipo de arquivo não suportado para ${mediaType}`;
    }

    return null;
  };

  // Criar preview do arquivo
  const createFilePreview = async (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('video/')) {
        const video = document.createElement('video');
        video.preload = 'metadata';
        video.onloadedmetadata = () => {
          video.currentTime = 1; // Capturar frame em 1 segundo
        };
        video.onseeked = () => {
          const canvas = document.createElement('canvas');
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(video, 0, 0);
          resolve(canvas.toDataURL());
        };
        video.src = URL.createObjectURL(file);
      } else {
        resolve(undefined);
      }
    });
  };

  // Extrair metadados do arquivo
  const extractMetadata = async (file: File): Promise<Partial<MediaFile['metadata']>> => {
    const metadata: Partial<MediaFile['metadata']> = {
      title: file.name.replace(/\.[^/.]+$/, ''), // Remove extensão
      createdAt: new Date(),
      isPublic: false
    };

    if (file.type.startsWith('video/')) {
      try {
        const video = document.createElement('video');
        video.preload = 'metadata';
        await new Promise((resolve) => {
          video.onloadedmetadata = () => {
            metadata.duration = video.duration;
            metadata.resolution = `${video.videoWidth}x${video.videoHeight}`;
            resolve(null);
          };
          video.src = URL.createObjectURL(file);
        });
      } catch (error) {
        logError('Erro ao extrair metadados de vídeo', 'MediaPlaybookUploader', { error });
      }
    }

    return metadata;
  };

  // Processar arquivos no drop
  const onDrop = useCallback(async (acceptedFiles: File[], rejectedFiles: any[]) => {
    logInfo('Arquivos recebidos para upload', 'MediaPlaybookUploader', {
      accepted: acceptedFiles.length,
      rejected: rejectedFiles.length
    });

    // Tratar arquivos rejeitados
    if (rejectedFiles.length > 0) {
      rejectedFiles.forEach(({ file, errors }) => {
        errors.forEach((error: any) => {
          let message = 'Erro desconhecido';
          switch (error.code) {
            case 'file-too-large':
              message = `Arquivo "${file.name}" é muito grande. Máximo: ${maxFileSize}MB`;
              break;
            case 'file-invalid-type':
              message = `Arquivo "${file.name}" não é um tipo suportado`;
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
    const newFiles: MediaFile[] = [];
    
    for (const file of acceptedFiles) {
      const validation = validateFile(file);
      if (validation) {
        toast({
          title: "Arquivo Inválido",
          description: validation,
          variant: "destructive"
        });
        continue;
      }

      const mediaType = getMediaType(file);
      const preview = await createFilePreview(file);
      const metadata = await extractMetadata(file);

      const mediaFile: MediaFile = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        mediaType,
        preview,
        uploadProgress: 0,
        status: 'pending',
        metadata
      };

      newFiles.push(mediaFile);
    }

    setFiles(prev => {
      const updated = [...prev, ...newFiles];
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

  // Configurar dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    maxSize: maxFileSize * 1024 * 1024,
    maxFiles,
    multiple: true,
    accept: {
      'video/*': acceptedTypes.video || [],
      'image/*': acceptedTypes.image || [],
      'application/pdf': acceptedTypes.document || [],
      'audio/*': acceptedTypes.audio || []
    }
  });

  // Upload de arquivo individual
  const uploadFile = async (fileData: MediaFile): Promise<void> => {
    try {
      setFiles(prev => prev.map(f => 
        f.id === fileData.id ? { ...f, status: 'uploading' } : f
      ));

      const fileName = `${Date.now()}-${fileData.file.name}`;
      const filePath = storageConfig.folder ? `${storageConfig.folder}/${fileName}` : fileName;

      logInfo('Iniciando upload de arquivo', 'MediaPlaybookUploader', {
        fileName: fileData.file.name,
        size: fileData.file.size,
        type: fileData.mediaType
      });

      // Simular progresso de upload
      const progressInterval = setInterval(() => {
        setFiles(prev => prev.map(f => {
          if (f.id === fileData.id && f.uploadProgress < 90) {
            return { ...f, uploadProgress: f.uploadProgress + Math.random() * 20 };
          }
          return f;
        }));
      }, 200);

      // Upload para Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(storageConfig.bucket)
        .upload(filePath, fileData.file, {
          cacheControl: '3600',
          upsert: false
        });

      clearInterval(progressInterval);

      if (uploadError) {
        throw new Error(`Erro no upload: ${uploadError.message}`);
      }

      // Obter URL pública
      const { data: urlData } = supabase.storage
        .from(storageConfig.bucket)
        .getPublicUrl(filePath);

      // Atualizar arquivo como concluído
      const updatedFile: MediaFile = {
        ...fileData,
        status: 'completed',
        uploadProgress: 100,
        url: urlData.publicUrl
      };

      setFiles(prev => prev.map(f => 
        f.id === fileData.id ? updatedFile : f
      ));

      // Notificar callback
      if (onFileProcessed) {
        onFileProcessed(updatedFile);
      }

      logInfo('Upload concluído com sucesso', 'MediaPlaybookUploader', {
        fileName: fileData.file.name,
        url: urlData.publicUrl
      });

    } catch (error: any) {
      logError('Erro no upload de arquivo', 'MediaPlaybookUploader', {
        fileName: fileData.file.name,
        error: error.message
      });

      setFiles(prev => prev.map(f => 
        f.id === fileData.id 
          ? { ...f, status: 'error', error: error.message }
          : f
      ));

      toast({
        title: "Erro no Upload",
        description: `Falha ao enviar ${fileData.file.name}: ${error.message}`,
        variant: "destructive"
      });
    }
  };

  // Upload em lote
  const uploadAllFiles = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    
    if (pendingFiles.length === 0) {
      toast({
        title: "Nenhum Arquivo",
        description: "Não há arquivos pendentes para upload.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    
    try {
      if (allowBulkUpload) {
        // Upload paralelo
        await Promise.all(pendingFiles.map(uploadFile));
      } else {
        // Upload sequencial
        for (const file of pendingFiles) {
          await uploadFile(file);
        }
      }

      const completedFiles = files.filter(f => f.status === 'completed');
      if (onFilesUploaded && completedFiles.length > 0) {
        onFilesUploaded(completedFiles);
      }

      toast({
        title: "Upload Concluído",
        description: `${pendingFiles.length} arquivo(s) enviado(s) com sucesso.`
      });

    } catch (error: any) {
      logError('Erro no upload em lote', 'MediaPlaybookUploader', { error: error.message });
      toast({
        title: "Erro no Upload",
        description: "Falha no upload de alguns arquivos.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  // Remover arquivo
  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // Atualizar metadados
  const updateFileMetadata = (fileId: string, metadata: Partial<MediaFile['metadata']>) => {
    setFiles(prev => prev.map(f => 
      f.id === fileId 
        ? { ...f, metadata: { ...f.metadata, ...metadata } }
        : f
    ));
  };

  // Obter status do arquivo
  const getStatusIcon = (status: MediaFile['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'processing':
      case 'uploading':
        return <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default:
        return <Upload className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: MediaFile['status']) => {
    switch (status) {
      case 'pending': return 'Aguardando';
      case 'uploading': return 'Enviando';
      case 'processing': return 'Processando';
      case 'completed': return 'Concluído';
      case 'error': return 'Erro';
      default: return 'Desconhecido';
    }
  };

  const getStatusVariant = (status: MediaFile['status']) => {
    switch (status) {
      case 'completed': return 'default';
      case 'error': return 'destructive';
      case 'processing':
      case 'uploading': return 'secondary';
      default: return 'outline';
    }
  };

  // Filtrar arquivos por tipo
  const getFilesByType = (type: MediaType) => {
    return files.filter(f => f.mediaType === type);
  };

  // Formatar tamanho do arquivo
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload de Mídia e Playbooks
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Área de Drop */}
        <div
          {...getRootProps()}
          className={cn(
            "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
            isDragActive 
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950" 
              : "border-gray-300 hover:border-gray-400"
          )}
        >
          <input {...getInputProps()} aria-label="Selecionar arquivos para upload" />
          <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          {isDragActive ? (
            <p className="text-blue-600 font-medium">
              Solte os arquivos aqui...
            </p>
          ) : (
            <div>
              <p className="text-gray-600 mb-2">
                Arraste e solte arquivos aqui, ou clique para selecionar
              </p>
              <p className="text-sm text-gray-500">
                Suporte: Vídeos, Imagens, PDFs, Documentos, Áudios
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Máximo: {maxFiles} arquivos, {maxFileSize}MB cada
              </p>
            </div>
          )}
        </div>

        {/* Lista de Arquivos por Tipo */}
        {files.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Arquivos ({files.length})</h3>
              <div className="flex gap-2">
                <Button 
                  onClick={uploadAllFiles}
                  disabled={isProcessing || files.every(f => f.status !== 'pending')}
                  className="flex items-center gap-2"
                >
                  {isProcessing ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {isProcessing ? 'Processando...' : 'Enviar Todos'}
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setFiles([])}
                  disabled={isProcessing}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as MediaType)}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="video" className="flex items-center gap-2">
                  <Video className="h-4 w-4" />
                  Vídeos ({getFilesByType('video').length})
                </TabsTrigger>
                <TabsTrigger value="image" className="flex items-center gap-2">
                  <Image className="h-4 w-4" />
                  Imagens ({getFilesByType('image').length})
                </TabsTrigger>
                <TabsTrigger value="document" className="flex items-center gap-2">
                  <File className="h-4 w-4" />
                  Docs ({getFilesByType('document').length})
                </TabsTrigger>
                <TabsTrigger value="playbook" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Playbooks ({getFilesByType('playbook').length})
                </TabsTrigger>
                <TabsTrigger value="audio" className="flex items-center gap-2">
                  <Play className="h-4 w-4" />
                  Áudios ({getFilesByType('audio').length})
                </TabsTrigger>
              </TabsList>

              {(['video', 'image', 'document', 'playbook', 'audio'] as MediaType[]).map(type => (
                <TabsContent key={type} value={type} className="space-y-2">
                  {getFilesByType(type).length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <div className="mb-2">
                        {React.createElement(getMediaIcon(type), { className: "h-8 w-8 mx-auto" })}
                      </div>
                      <p>Nenhum arquivo de {type} adicionado</p>
                    </div>
                  ) : (
                    getFilesByType(type).map((fileData) => (
                      <div key={fileData.id} className="border rounded-lg p-4">
                        <div className="flex items-start gap-4">
                          {/* Preview */}
                          <div className="flex-shrink-0">
                            {fileData.preview ? (
                              <img 
                                src={fileData.preview} 
                                alt={fileData.name}
                                className="w-16 h-16 object-cover rounded"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-100 rounded flex items-center justify-center">
                                {React.createElement(getMediaIcon(fileData.mediaType), { 
                                  className: "h-8 w-8 text-gray-400" 
                                })}
                              </div>
                            )}
                          </div>

                          {/* Informações do arquivo */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-2">
                              <div>
                                <p className="font-medium text-sm truncate">{fileData.name}</p>
                                <p className="text-xs text-gray-500">
                                  {formatFileSize(fileData.size)}
                                  {fileData.metadata?.duration && (
                                    <span> • {Math.round(fileData.metadata.duration)}s</span>
                                  )}
                                  {fileData.metadata?.resolution && (
                                    <span> • {fileData.metadata.resolution}</span>
                                  )}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={getStatusVariant(fileData.status)}>
                                  {getStatusText(fileData.status)}
                                </Badge>
                                {getStatusIcon(fileData.status)}
                              </div>
                            </div>

                            {/* Metadados */}
                            {fileData.metadata?.title && (
                              <p className="text-sm text-gray-600 mb-2">
                                {fileData.metadata.title}
                              </p>
                            )}

                            {/* Barra de progresso */}
                            {(fileData.status === 'uploading' || fileData.status === 'processing') && (
                              <div className="mb-2">
                                <Progress 
                                  value={fileData.uploadProgress} 
                                  className="h-2"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                  {fileData.status === 'uploading' 
                                    ? `Upload: ${Math.round(fileData.uploadProgress)}%`
                                    : 'Processando...'}
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

                            {/* Ações */}
                            <div className="flex items-center gap-2 mt-2">
                              {fileData.status === 'pending' && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => uploadFile(fileData)}
                                    disabled={isProcessing}
                                  >
                                    <Upload className="h-3 w-3 mr-1" />
                                    Enviar
                                  </Button>
                                  {showMetadataEditor && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedFile(fileData);
                                        setShowMetadataDialog(true);
                                      }}
                                    >
                                      <Settings className="h-3 w-3 mr-1" />
                                      Editar
                                    </Button>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => removeFile(fileData.id)}
                                  >
                                    <X className="h-3 w-3" />
                                  </Button>
                                </>
                              )}
                              {fileData.status === 'completed' && fileData.url && (
                                <>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(fileData.url, '_blank')}
                                  >
                                    <Eye className="h-3 w-3 mr-1" />
                                    Visualizar
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                      const link = document.createElement('a');
                                      link.href = fileData.url!;
                                      link.download = fileData.name;
                                      link.click();
                                    }}
                                  >
                                    <Download className="h-3 w-3 mr-1" />
                                    Download
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </TabsContent>
              ))}
            </Tabs>
          </div>
        )}

        {/* Dialog de Edição de Metadados */}
        {showMetadataEditor && selectedFile && (
          <Dialog open={showMetadataDialog} onOpenChange={setShowMetadataDialog}>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Editar Metadados - {selectedFile.name}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="title">Título</Label>
                    <Input
                      id="title"
                      value={selectedFile.metadata?.title || ''}
                      onChange={(e) => updateFileMetadata(selectedFile.id, { title: e.target.value })}
                      placeholder="Título do arquivo"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <Select
                      value={selectedFile.metadata?.category || ''}
                      onValueChange={(value) => updateFileMetadata(selectedFile.id, { category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecionar categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(MEDIA_TYPE_CATEGORIES).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={selectedFile.metadata?.description || ''}
                    onChange={(e) => updateFileMetadata(selectedFile.id, { description: e.target.value })}
                    placeholder="Descrição do arquivo"
                    rows={3}
                  />
                </div>

                <div>
                  <Label htmlFor="tags">Tags (separadas por vírgula)</Label>
                  <Input
                    id="tags"
                    value={selectedFile.metadata?.tags?.join(', ') || ''}
                    onChange={(e) => updateFileMetadata(selectedFile.id, { 
                      tags: e.target.value.split(',').map(tag => tag.trim()).filter(Boolean)
                    })}
                    placeholder="tag1, tag2, tag3"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isPublic"
                    checked={selectedFile.metadata?.isPublic || false}
                    onCheckedChange={(checked) => updateFileMetadata(selectedFile.id, { isPublic: checked })}
                  />
                  <Label htmlFor="isPublic">Arquivo público</Label>
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowMetadataDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={() => setShowMetadataDialog(false)}>
                    Salvar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Informações */}
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Suporte para vídeos (MP4, WebM), imagens (JPEG, PNG, GIF), documentos (PDF, DOC), 
            playbooks (PDF, Markdown) e áudios (MP3, WAV). Os arquivos são organizados automaticamente 
            por tipo e podem ter metadados personalizados.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
};

export default MediaPlaybookUploader;