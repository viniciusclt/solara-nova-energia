// components/video/VideoUpload.tsx
import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Upload,
  X,
  Play,
  Pause,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  FileVideo,
  Image,
  Settings,
  Eye,
  EyeOff,
  Tag,
  User,
  Calendar,
  Clock,
  HardDrive,
  Zap,
  Shield,
} from 'lucide-react';
import {
  VideoMetadata,
  VideoCategory,
  VideoVisibility,
  VideoUploadConfig,
  VideoUploadProgress,
  VideoUploadSession,
  VideoProcessingStatus,
  VideoCompressionSettings,
  VideoSecuritySettings,
  DEFAULT_UPLOAD_CONFIG,
  DEFAULT_COMPRESSION_SETTINGS,
  DEFAULT_SECURITY_SETTINGS,
  formatFileSize,
  formatVideoDuration,
} from '../../types/video';
import { VideoUploadService } from '../../services/videoUploadService';
import { cn } from '@/lib/utils';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { Label } from '@/shared/ui/label';
import { Progress } from '@/shared/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import { Switch } from '@/shared/ui/switch';
import { Slider } from '@/shared/ui/slider';
import { Separator } from '@/shared/ui/separator';
import { toast } from 'sonner';

interface VideoUploadProps {
  config?: Partial<VideoUploadConfig>;
  compressionSettings?: Partial<VideoCompressionSettings>;
  securitySettings?: Partial<VideoSecuritySettings>;
  className?: string;
  onUploadStart?: (session: VideoUploadSession) => void;
  onUploadProgress?: (progress: VideoUploadProgress) => void;
  onUploadComplete?: (metadata: VideoMetadata) => void;
  onUploadError?: (error: string) => void;
  onUploadCancel?: (sessionId: string) => void;
  maxFiles?: number;
  allowMultiple?: boolean;
  showAdvancedSettings?: boolean;
}

interface UploadFile {
  id: string;
  file: File;
  preview?: string;
  metadata?: Partial<VideoMetadata>;
  progress?: VideoUploadProgress;
  session?: VideoUploadSession;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error' | 'cancelled';
  error?: string;
}

interface VideoPreviewProps {
  file: File;
  onMetadataExtracted?: (metadata: VideoMetadata) => void;
}

interface UploadSettingsProps {
  config: VideoUploadConfig;
  compressionSettings: VideoCompressionSettings;
  securitySettings: VideoSecuritySettings;
  onConfigChange: (config: VideoUploadConfig) => void;
  onCompressionChange: (settings: VideoCompressionSettings) => void;
  onSecurityChange: (settings: VideoSecuritySettings) => void;
}

interface FileItemProps {
  uploadFile: UploadFile;
  onRemove: () => void;
  onRetry: () => void;
  onCancel: () => void;
  onMetadataChange: (metadata: Partial<VideoMetadata>) => void;
}

// Componente de Preview do Vídeo
const VideoPreview: React.FC<VideoPreviewProps> = ({ file, onMetadataExtracted }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);

  useEffect(() => {
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [file]);

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (video) {
      const extractedMetadata = {
        duration: video.duration,
        width: video.videoWidth,
        height: video.videoHeight,
        aspectRatio: video.videoWidth / video.videoHeight,
      };
      setMetadata(extractedMetadata);
      onMetadataExtracted?.(extractedMetadata);
    }
  };

  return (
    <div className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
      <video
        ref={videoRef}
        src={previewUrl}
        className="w-full h-full object-cover"
        onLoadedMetadata={handleLoadedMetadata}
        muted
      />
      {metadata && (
        <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
          {formatVideoDuration(metadata.duration)}
        </div>
      )}
    </div>
  );
};

// Componente de Configurações de Upload
const UploadSettings: React.FC<UploadSettingsProps> = ({
  config,
  compressionSettings,
  securitySettings,
  onConfigChange,
  onCompressionChange,
  onSecurityChange,
}) => {
  return (
    <Tabs defaultValue="general" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="general">Geral</TabsTrigger>
        <TabsTrigger value="compression">Compressão</TabsTrigger>
        <TabsTrigger value="security">Segurança</TabsTrigger>
      </TabsList>
      
      <TabsContent value="general" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Tamanho do Chunk (MB)</Label>
            <Slider
              value={[config.chunkSize / (1024 * 1024)]}
              onValueChange={([value]) => onConfigChange({ ...config, chunkSize: value * 1024 * 1024 })}
              max={50}
              min={1}
              step={1}
            />
            <span className="text-sm text-muted-foreground">
              {(config.chunkSize / (1024 * 1024)).toFixed(0)} MB
            </span>
          </div>
          
          <div className="space-y-2">
            <Label>Tentativas Máximas</Label>
            <Slider
              value={[config.maxRetries]}
              onValueChange={([value]) => onConfigChange({ ...config, maxRetries: value })}
              max={10}
              min={1}
              step={1}
            />
            <span className="text-sm text-muted-foreground">
              {config.maxRetries} tentativas
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            checked={config.enableResume}
            onCheckedChange={(checked) => onConfigChange({ ...config, enableResume: checked })}
          />
          <Label>Permitir retomada de upload</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            checked={config.enableCompression}
            onCheckedChange={(checked) => onConfigChange({ ...config, enableCompression: checked })}
          />
          <Label>Compressão automática</Label>
        </div>
      </TabsContent>
      
      <TabsContent value="compression" className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Qualidade (%)</Label>
            <Slider
              value={[compressionSettings.quality]}
              onValueChange={([value]) => onCompressionChange({ ...compressionSettings, quality: value })}
              max={100}
              min={10}
              step={5}
            />
            <span className="text-sm text-muted-foreground">
              {compressionSettings.quality}%
            </span>
          </div>
          
          <div className="space-y-2">
            <Label>Bitrate (kbps)</Label>
            <Slider
              value={[compressionSettings.bitrate / 1000]}
              onValueChange={([value]) => onCompressionChange({ ...compressionSettings, bitrate: value * 1000 })}
              max={10000}
              min={500}
              step={100}
            />
            <span className="text-sm text-muted-foreground">
              {(compressionSettings.bitrate / 1000).toFixed(0)} kbps
            </span>
          </div>
        </div>
        
        <div className="space-y-2">
          <Label>Resolução Máxima</Label>
          <Select
            value={compressionSettings.maxResolution}
            onValueChange={(value) => onCompressionChange({ ...compressionSettings, maxResolution: value as '4k' | '1080p' | '720p' | '480p' })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="4k">4K (3840x2160)</SelectItem>
              <SelectItem value="1080p">Full HD (1920x1080)</SelectItem>
              <SelectItem value="720p">HD (1280x720)</SelectItem>
              <SelectItem value="480p">SD (854x480)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            checked={compressionSettings.enableMultipleQualities}
            onCheckedChange={(checked) => onCompressionChange({ ...compressionSettings, enableMultipleQualities: checked })}
          />
          <Label>Gerar múltiplas qualidades</Label>
        </div>
      </TabsContent>
      
      <TabsContent value="security" className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            checked={securitySettings.enableWatermark}
            onCheckedChange={(checked) => onSecurityChange({ ...securitySettings, enableWatermark: checked })}
          />
          <Label>Marca d'água</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            checked={securitySettings.enableDRM}
            onCheckedChange={(checked) => onSecurityChange({ ...securitySettings, enableDRM: checked })}
          />
          <Label>Proteção DRM</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            checked={securitySettings.preventDownload}
            onCheckedChange={(checked) => onSecurityChange({ ...securitySettings, preventDownload: checked })}
          />
          <Label>Prevenir download</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            checked={securitySettings.enableEncryption}
            onCheckedChange={(checked) => onSecurityChange({ ...securitySettings, enableEncryption: checked })}
          />
          <Label>Criptografia</Label>
        </div>
      </TabsContent>
    </Tabs>
  );
};

// Componente de Item de Arquivo
const FileItem: React.FC<FileItemProps> = ({
  uploadFile,
  onRemove,
  onRetry,
  onCancel,
  onMetadataChange,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [metadata, setMetadata] = useState<Partial<VideoMetadata>>(uploadFile.metadata || {});

  const getStatusIcon = () => {
    switch (uploadFile.status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-500" />;
      case 'uploading':
        return <Upload className="h-4 w-4 text-blue-500 animate-pulse" />;
      case 'processing':
        return <Zap className="h-4 w-4 text-yellow-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'cancelled':
        return <X className="h-4 w-4 text-gray-500" />;
      default:
        return <FileVideo className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (uploadFile.status) {
      case 'pending':
        return 'bg-gray-100 text-gray-800';
      case 'uploading':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleMetadataChange = (field: string, value: unknown) => {
    const newMetadata = { ...metadata, [field]: value };
    setMetadata(newMetadata);
    onMetadataChange(newMetadata);
  };

  return (
    <Card className="w-full">
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          {/* Preview */}
          <div className="flex-shrink-0 w-24">
            {uploadFile.preview ? (
              <img
                src={uploadFile.preview}
                alt="Preview"
                className="w-full h-16 object-cover rounded"
              />
            ) : (
              <VideoPreview
                file={uploadFile.file}
                onMetadataExtracted={(meta) => handleMetadataChange('duration', meta.duration)}
              />
            )}
          </div>
          
          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                {getStatusIcon()}
                <h3 className="font-medium truncate">{uploadFile.file.name}</h3>
                <Badge className={getStatusColor()}>
                  {uploadFile.status}
                </Badge>
              </div>
              
              <div className="flex items-center space-x-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDetails(!showDetails)}
                >
                  {showDetails ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
                
                {uploadFile.status === 'error' && (
                  <Button variant="ghost" size="sm" onClick={onRetry}>
                    <RotateCcw className="h-4 w-4" />
                  </Button>
                )}
                
                {uploadFile.status === 'uploading' && (
                  <Button variant="ghost" size="sm" onClick={onCancel}>
                    <Pause className="h-4 w-4" />
                  </Button>
                )}
                
                <Button variant="ghost" size="sm" onClick={onRemove}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
            
            {/* Progress */}
            {uploadFile.progress && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progresso: {uploadFile.progress.percentage.toFixed(1)}%</span>
                  <span>{formatFileSize(uploadFile.file.size)}</span>
                </div>
                <Progress value={uploadFile.progress.percentage} className="h-2" />
                
                {uploadFile.progress.speed && (
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Velocidade: {formatFileSize(uploadFile.progress.speed)}/s</span>
                    {uploadFile.progress.estimatedTimeRemaining && (
                      <span>Restante: {formatVideoDuration(uploadFile.progress.estimatedTimeRemaining)}</span>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Error */}
            {uploadFile.error && (
              <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded text-sm text-red-600">
                {uploadFile.error}
              </div>
            )}
          </div>
        </div>
        
        {/* Details */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`title-${uploadFile.id}`}>Título</Label>
                <Input
                  id={`title-${uploadFile.id}`}
                  value={metadata.title || ''}
                  onChange={(e) => handleMetadataChange('title', e.target.value)}
                  placeholder="Título do vídeo"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`category-${uploadFile.id}`}>Categoria</Label>
                <Select
                  value={metadata.category || ''}
                  onValueChange={(value) => handleMetadataChange('category', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tutorial">Tutorial</SelectItem>
                    <SelectItem value="webinar">Webinar</SelectItem>
                    <SelectItem value="course">Curso</SelectItem>
                    <SelectItem value="demo">Demo</SelectItem>
                    <SelectItem value="presentation">Apresentação</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor={`description-${uploadFile.id}`}>Descrição</Label>
              <Textarea
                id={`description-${uploadFile.id}`}
                value={metadata.description || ''}
                onChange={(e) => handleMetadataChange('description', e.target.value)}
                placeholder="Descrição do vídeo"
                rows={3}
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor={`tags-${uploadFile.id}`}>Tags</Label>
                <Input
                  id={`tags-${uploadFile.id}`}
                  value={metadata.tags?.join(', ') || ''}
                  onChange={(e) => handleMetadataChange('tags', e.target.value.split(',').map(tag => tag.trim()).filter(Boolean))}
                  placeholder="tag1, tag2, tag3"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor={`visibility-${uploadFile.id}`}>Visibilidade</Label>
                <Select
                  value={metadata.visibility || 'private'}
                  onValueChange={(value) => handleMetadataChange('visibility', value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="public">Público</SelectItem>
                    <SelectItem value="private">Privado</SelectItem>
                    <SelectItem value="unlisted">Não Listado</SelectItem>
                    <SelectItem value="restricted">Restrito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// Componente Principal
export const VideoUpload: React.FC<VideoUploadProps> = ({
  config: initialConfig = {},
  compressionSettings: initialCompressionSettings = {},
  securitySettings: initialSecuritySettings = {},
  className,
  onUploadStart,
  onUploadProgress,
  onUploadComplete,
  onUploadError,
  onUploadCancel,
  maxFiles = 10,
  allowMultiple = true,
  showAdvancedSettings = true,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadFiles, setUploadFiles] = useState<UploadFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [uploadService] = useState(() => new VideoUploadService());
  
  const [config, setConfig] = useState<VideoUploadConfig>({
    ...DEFAULT_UPLOAD_CONFIG,
    ...initialConfig,
  });
  
  const [compressionSettings, setCompressionSettings] = useState<VideoCompressionSettings>({
    ...DEFAULT_COMPRESSION_SETTINGS,
    ...initialCompressionSettings,
  });
  
  const [securitySettings, setSecuritySettings] = useState<VideoSecuritySettings>({
    ...DEFAULT_SECURITY_SETTINGS,
    ...initialSecuritySettings,
  });

  // Drag and drop handlers
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files).filter(file => 
      file.type.startsWith('video/')
    );
    
    handleFiles(files);
  }, []);

  // File handling
  const handleFiles = useCallback((files: File[]) => {
    if (!allowMultiple && files.length > 1) {
      toast.error('Apenas um arquivo é permitido');
      return;
    }
    
    if (uploadFiles.length + files.length > maxFiles) {
      toast.error(`Máximo de ${maxFiles} arquivos permitidos`);
      return;
    }
    
    const newUploadFiles: UploadFile[] = files.map(file => ({
      id: `${Date.now()}_${Math.random()}`,
      file,
      status: 'pending',
      metadata: {
        title: file.name.replace(/\.[^/.]+$/, ''),
        description: '',
        category: 'tutorial' as VideoCategory,
        visibility: 'private' as VideoVisibility,
        tags: [],
      },
    }));
    
    setUploadFiles(prev => [...prev, ...newUploadFiles]);
  }, [allowMultiple, maxFiles, uploadFiles.length]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [handleFiles]);

  // Upload operations
  const startUpload = useCallback(async (uploadFile: UploadFile) => {
    try {
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: 'uploading' } : f
      ));
      
      const session = await uploadService.createUploadSession({
        fileName: uploadFile.file.name,
        fileSize: uploadFile.file.size,
        mimeType: uploadFile.file.type,
        metadata: uploadFile.metadata as VideoMetadata,
        config,
        compressionSettings,
        securitySettings,
      });
      
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, session } : f
      ));
      
      onUploadStart?.(session);
      
      const result = await uploadService.uploadFile(uploadFile.file, {
        onProgress: (progress) => {
          setUploadFiles(prev => prev.map(f => 
            f.id === uploadFile.id ? { ...f, progress } : f
          ));
          onUploadProgress?.(progress);
        },
        sessionId: session.id,
      });
      
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: 'processing' } : f
      ));
      
      // Poll for processing completion
      const pollProcessing = async () => {
        try {
          const status = await uploadService.getProcessingStatus(result.videoId);
          
          if (status.status === 'completed') {
            const metadata = await uploadService.getVideoMetadata(result.videoId);
            setUploadFiles(prev => prev.map(f => 
              f.id === uploadFile.id ? { ...f, status: 'completed' } : f
            ));
            onUploadComplete?.(metadata);
          } else if (status.status === 'failed') {
            throw new Error(status.error || 'Falha no processamento');
          } else {
            setTimeout(pollProcessing, 2000);
          }
        } catch (error) {
          throw error;
        }
      };
      
      await pollProcessing();
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro no upload';
      setUploadFiles(prev => prev.map(f => 
        f.id === uploadFile.id ? { ...f, status: 'error', error: errorMessage } : f
      ));
      onUploadError?.(errorMessage);
    }
  }, [uploadService, config, compressionSettings, securitySettings, onUploadStart, onUploadProgress, onUploadComplete, onUploadError]);

  const cancelUpload = useCallback(async (uploadFile: UploadFile) => {
    if (uploadFile.session) {
      try {
        await uploadService.cancelUpload(uploadFile.session.id);
        onUploadCancel?.(uploadFile.session.id);
      } catch (error) {
        console.error('Error cancelling upload:', error);
      }
    }
    
    setUploadFiles(prev => prev.map(f => 
      f.id === uploadFile.id ? { ...f, status: 'cancelled' } : f
    ));
  }, [uploadService, onUploadCancel]);

  const retryUpload = useCallback((uploadFile: UploadFile) => {
    startUpload(uploadFile);
  }, [startUpload]);

  const removeFile = useCallback((uploadFile: UploadFile) => {
    if (uploadFile.status === 'uploading' && uploadFile.session) {
      cancelUpload(uploadFile);
    }
    
    setUploadFiles(prev => prev.filter(f => f.id !== uploadFile.id));
  }, [cancelUpload]);

  const updateFileMetadata = useCallback((fileId: string, metadata: Partial<VideoMetadata>) => {
    setUploadFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, metadata: { ...f.metadata, ...metadata } } : f
    ));
  }, []);

  // Bulk operations
  const startAllUploads = useCallback(() => {
    const pendingFiles = uploadFiles.filter(f => f.status === 'pending');
    pendingFiles.forEach(file => startUpload(file));
  }, [uploadFiles, startUpload]);

  const cancelAllUploads = useCallback(() => {
    const uploadingFiles = uploadFiles.filter(f => f.status === 'uploading');
    uploadingFiles.forEach(file => cancelUpload(file));
  }, [uploadFiles, cancelUpload]);

  const removeAllFiles = useCallback(() => {
    uploadFiles.forEach(file => {
      if (file.status === 'uploading' && file.session) {
        cancelUpload(file);
      }
    });
    setUploadFiles([]);
  }, [uploadFiles, cancelUpload]);

  // Statistics
  const stats = {
    total: uploadFiles.length,
    pending: uploadFiles.filter(f => f.status === 'pending').length,
    uploading: uploadFiles.filter(f => f.status === 'uploading').length,
    processing: uploadFiles.filter(f => f.status === 'processing').length,
    completed: uploadFiles.filter(f => f.status === 'completed').length,
    error: uploadFiles.filter(f => f.status === 'error').length,
    cancelled: uploadFiles.filter(f => f.status === 'cancelled').length,
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Upload Area */}
      <Card>
        <CardContent className="p-6">
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
              isDragOver
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              Arraste vídeos aqui ou clique para selecionar
            </h3>
            <p className="text-muted-foreground mb-4">
              Suporte para MP4, AVI, MOV, WMV e outros formatos de vídeo
            </p>
            <div className="flex justify-center space-x-4">
              <Button onClick={() => fileInputRef.current?.click()}>
                <Upload className="h-4 w-4 mr-2" />
                Selecionar Arquivos
              </Button>
              
              {showAdvancedSettings && (
                <Button
                  variant="outline"
                  onClick={() => setShowSettings(!showSettings)}
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Configurações
                </Button>
              )}
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="video/*"
              multiple={allowMultiple}
              onChange={handleFileInputChange}
              className="hidden"
            />
          </div>
        </CardContent>
      </Card>

      {/* Settings Panel */}
      {showSettings && showAdvancedSettings && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Settings className="h-5 w-5" />
              <span>Configurações de Upload</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UploadSettings
              config={config}
              compressionSettings={compressionSettings}
              securitySettings={securitySettings}
              onConfigChange={setConfig}
              onCompressionChange={setCompressionSettings}
              onSecurityChange={setSecuritySettings}
            />
          </CardContent>
        </Card>
      )}

      {/* Statistics */}
      {uploadFiles.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-gray-400 rounded-full" />
                  <span>Pendente: {stats.pending}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-blue-500 rounded-full" />
                  <span>Enviando: {stats.uploading}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full" />
                  <span>Processando: {stats.processing}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-green-500 rounded-full" />
                  <span>Concluído: {stats.completed}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full" />
                  <span>Erro: {stats.error}</span>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                {stats.pending > 0 && (
                  <Button size="sm" onClick={startAllUploads}>
                    <Play className="h-4 w-4 mr-2" />
                    Enviar Todos
                  </Button>
                )}
                
                {stats.uploading > 0 && (
                  <Button size="sm" variant="outline" onClick={cancelAllUploads}>
                    <Pause className="h-4 w-4 mr-2" />
                    Cancelar Todos
                  </Button>
                )}
                
                <Button size="sm" variant="outline" onClick={removeAllFiles}>
                  <X className="h-4 w-4 mr-2" />
                  Limpar Lista
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* File List */}
      {uploadFiles.length > 0 && (
        <div className="space-y-4">
          {uploadFiles.map((uploadFile) => (
            <FileItem
              key={uploadFile.id}
              uploadFile={uploadFile}
              onRemove={() => removeFile(uploadFile)}
              onRetry={() => retryUpload(uploadFile)}
              onCancel={() => cancelUpload(uploadFile)}
              onMetadataChange={(metadata) => updateFileMetadata(uploadFile.id, metadata)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default VideoUpload;