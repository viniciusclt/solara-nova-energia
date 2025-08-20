# SISTEMA DE UPLOAD VPS - DOCUMENTAÇÃO TÉCNICA

## 1. Visão Geral

O Sistema de Upload VPS permite hospedagem própria de vídeos de treinamento com streaming seguro, compressão automática, watermark dinâmico e proteção contra download. Esta implementação substitui dependências de serviços externos por uma solução interna robusta.

## 2. Arquitetura de Componentes

### 2.1 Estrutura de Componentes

```typescript
interface VideoUploadSystem {
  upload: {
    VideoUploader: React.FC<VideoUploaderProps>;
    UploadProgress: React.FC<UploadProgressProps>;
    FileDropZone: React.FC<FileDropZoneProps>;
    UploadQueue: React.FC<UploadQueueProps>;
  };
  management: {
    VideoLibrary: React.FC<VideoLibraryProps>;
    VideoEditor: React.FC<VideoEditorProps>;
    QualitySelector: React.FC<QualitySelectorProps>;
    WatermarkConfig: React.FC<WatermarkConfigProps>;
  };
  player: {
    SecureVideoPlayer: React.FC<SecureVideoPlayerProps>;
    PlaybackControls: React.FC<PlaybackControlsProps>;
    QualitySelector: React.FC<QualitySelectorProps>;
    WatermarkOverlay: React.FC<WatermarkOverlayProps>;
  };
  processing: {
    VideoProcessor: React.FC<VideoProcessorProps>;
    CompressionSettings: React.FC<CompressionSettingsProps>;
    ProcessingQueue: React.FC<ProcessingQueueProps>;
  };
}
```

### 2.2 Tipos TypeScript

```typescript
// Video Upload Types
interface VideoUpload {
  id: string;
  title: string;
  description?: string;
  originalFilename: string;
  fileSize: number;
  duration?: number;
  uploadStatus: UploadStatus;
  processingStatus: ProcessingStatus;
  qualityVariants: QualityVariant[];
  watermarkSettings: WatermarkSettings;
  uploadProgress: number;
  processingProgress: number;
  createdAt: string;
  updatedAt: string;
  uploadedBy: string;
  category?: string;
  tags: string[];
  isPublic: boolean;
  accessLevel: AccessLevel;
}

type UploadStatus = 'pending' | 'uploading' | 'completed' | 'failed' | 'cancelled';
type ProcessingStatus = 'queued' | 'processing' | 'completed' | 'failed';
type AccessLevel = 'public' | 'company' | 'restricted' | 'private';

interface QualityVariant {
  id: string;
  quality: VideoQuality;
  resolution: string;
  bitrate: number;
  fileSize: number;
  filePath: string;
  hlsPlaylist?: string;
  processingStatus: ProcessingStatus;
}

type VideoQuality = '360p' | '480p' | '720p' | '1080p' | '1440p' | '4k';

interface WatermarkSettings {
  enabled: boolean;
  type: 'text' | 'image' | 'dynamic';
  position: WatermarkPosition;
  opacity: number;
  size: number;
  content?: string;
  imageUrl?: string;
  dynamicFields: DynamicField[];
}

type WatermarkPosition = 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';

interface DynamicField {
  field: 'username' | 'company' | 'email' | 'timestamp' | 'custom';
  value?: string;
  format?: string;
}

interface StreamingUrl {
  url: string;
  expiresAt: string;
  quality: VideoQuality;
  token: string;
}

interface VideoAnalytics {
  videoId: string;
  totalViews: number;
  uniqueViewers: number;
  totalWatchTime: number;
  averageWatchTime: number;
  completionRate: number;
  qualityDistribution: Record<VideoQuality, number>;
  viewsByDate: { date: string; views: number }[];
  topViewers: { userId: string; watchTime: number }[];
}
```

## 3. Estrutura de Arquivos

```
src/
├── pages/
│   ├── VideoUploadPage.tsx
│   ├── VideoLibraryPage.tsx
│   └── VideoPlayerPage.tsx
├── components/
│   └── video/
│       ├── index.ts
│       ├── upload/
│       │   ├── VideoUploader.tsx
│       │   ├── UploadProgress.tsx
│       │   ├── FileDropZone.tsx
│       │   └── UploadQueue.tsx
│       ├── management/
│       │   ├── VideoLibrary.tsx
│       │   ├── VideoEditor.tsx
│       │   ├── QualitySelector.tsx
│       │   └── WatermarkConfig.tsx
│       ├── player/
│       │   ├── SecureVideoPlayer.tsx
│       │   ├── PlaybackControls.tsx
│       │   ├── QualitySelector.tsx
│       │   └── WatermarkOverlay.tsx
│       └── processing/
│           ├── VideoProcessor.tsx
│           ├── CompressionSettings.tsx
│           └── ProcessingQueue.tsx
├── hooks/
│   ├── useVideoUpload.ts
│   ├── useVideoProcessing.ts
│   ├── useVideoPlayer.ts
│   └── useVideoAnalytics.ts
├── services/
│   ├── VideoUploadService.ts
│   ├── VideoProcessingService.ts
│   ├── StreamingService.ts
│   └── WatermarkService.ts
├── workers/
│   ├── videoProcessor.worker.ts
│   └── uploadChunker.worker.ts
└── types/
    └── video.ts
```

## 4. Implementação dos Componentes

### 4.1 VideoUploadPage.tsx

```typescript
import React, { useState } from 'react';
import { VideoUploader, UploadQueue, VideoLibrary } from '@/components/video';
import { useVideoUpload } from '@/hooks/useVideoUpload';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function VideoUploadPage() {
  const [activeTab, setActiveTab] = useState('upload');
  const { uploads, uploadVideo, cancelUpload } = useVideoUpload();

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Vídeos</h1>
        <p className="text-gray-600 mt-2">
          Upload, processamento e gerenciamento de vídeos de treinamento
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="library">Biblioteca</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Novo Upload</CardTitle>
              </CardHeader>
              <CardContent>
                <VideoUploader onUpload={uploadVideo} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Fila de Upload</CardTitle>
              </CardHeader>
              <CardContent>
                <UploadQueue 
                  uploads={uploads} 
                  onCancel={cancelUpload}
                />
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="library">
          <VideoLibrary />
        </TabsContent>

        <TabsContent value="analytics">
          {/* Implementar componente de analytics */}
        </TabsContent>
      </Tabs>
    </div>
  );
}
```

### 4.2 VideoUploader.tsx

```typescript
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Upload, Video, X } from 'lucide-react';
import { VideoUpload } from '@/types/video';

interface VideoUploaderProps {
  onUpload: (file: File, metadata: VideoMetadata) => void;
}

interface VideoMetadata {
  title: string;
  description?: string;
  category: string;
  tags: string[];
  accessLevel: AccessLevel;
  watermarkEnabled: boolean;
}

export function VideoUploader({ onUpload }: VideoUploaderProps) {
  const [metadata, setMetadata] = useState<VideoMetadata>({
    title: '',
    description: '',
    category: '',
    tags: [],
    accessLevel: 'company',
    watermarkEnabled: true
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const file = acceptedFiles[0];
    if (file) {
      setSelectedFile(file);
      if (!metadata.title) {
        setMetadata(prev => ({
          ...prev,
          title: file.name.replace(/\.[^/.]+$/, '')
        }));
      }
    }
  }, [metadata.title]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv', '.webm']
    },
    maxSize: 2 * 1024 * 1024 * 1024, // 2GB
    multiple: false
  });

  const handleUpload = () => {
    if (selectedFile && metadata.title) {
      onUpload(selectedFile, metadata);
      setSelectedFile(null);
      setMetadata({
        title: '',
        description: '',
        category: '',
        tags: [],
        accessLevel: 'company',
        watermarkEnabled: true
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Drop Zone */}
      <div
        {...getRootProps()}
        className={`
          border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${selectedFile ? 'border-green-500 bg-green-50' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {selectedFile ? (
          <div className="flex items-center justify-center space-x-2">
            <Video className="h-8 w-8 text-green-600" />
            <div>
              <p className="font-medium text-green-800">{selectedFile.name}</p>
              <p className="text-sm text-green-600">
                {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setSelectedFile(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <div>
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700">
              {isDragActive ? 'Solte o arquivo aqui' : 'Arraste um vídeo ou clique para selecionar'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Formatos suportados: MP4, MOV, AVI, MKV, WebM (máx. 2GB)
            </p>
          </div>
        )}
      </div>

      {/* Metadata Form */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="title">Título *</Label>
          <Input
            id="title"
            value={metadata.title}
            onChange={(e) => setMetadata(prev => ({ ...prev, title: e.target.value }))}
            placeholder="Digite o título do vídeo"
          />
        </div>

        <div>
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={metadata.description}
            onChange={(e) => setMetadata(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Descrição opcional do vídeo"
            rows={3}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="category">Categoria</Label>
            <Select
              value={metadata.category}
              onValueChange={(value) => setMetadata(prev => ({ ...prev, category: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tecnico">Técnico</SelectItem>
                <SelectItem value="comercial">Comercial</SelectItem>
                <SelectItem value="instalacao">Instalação</SelectItem>
                <SelectItem value="manutencao">Manutenção</SelectItem>
                <SelectItem value="seguranca">Segurança</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="access">Nível de Acesso</Label>
            <Select
              value={metadata.accessLevel}
              onValueChange={(value: AccessLevel) => setMetadata(prev => ({ ...prev, accessLevel: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Público</SelectItem>
                <SelectItem value="company">Empresa</SelectItem>
                <SelectItem value="restricted">Restrito</SelectItem>
                <SelectItem value="private">Privado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button
          onClick={handleUpload}
          disabled={!selectedFile || !metadata.title}
          className="w-full"
        >
          Iniciar Upload
        </Button>
      </div>
    </div>
  );
}
```

### 4.3 SecureVideoPlayer.tsx

```typescript
import React, { useRef, useEffect, useState } from 'react';
import { useVideoPlayer } from '@/hooks/useVideoPlayer';
import { WatermarkOverlay } from './WatermarkOverlay';
import { PlaybackControls } from './PlaybackControls';
import { QualitySelector } from './QualitySelector';
import { VideoUpload, StreamingUrl } from '@/types/video';

interface SecureVideoPlayerProps {
  video: VideoUpload;
  autoplay?: boolean;
  onProgress?: (progress: number) => void;
  onComplete?: () => void;
}

export function SecureVideoPlayer({ 
  video, 
  autoplay = false, 
  onProgress, 
  onComplete 
}: SecureVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [streamingUrl, setStreamingUrl] = useState<StreamingUrl | null>(null);
  const [currentQuality, setCurrentQuality] = useState<VideoQuality>('720p');
  
  const {
    isPlaying,
    currentTime,
    duration,
    volume,
    isFullscreen,
    play,
    pause,
    seek,
    setVolume,
    toggleFullscreen,
    getStreamingUrl
  } = useVideoPlayer(videoRef);

  useEffect(() => {
    const loadVideo = async () => {
      try {
        const url = await getStreamingUrl(video.id, currentQuality);
        setStreamingUrl(url);
      } catch (error) {
        console.error('Erro ao carregar vídeo:', error);
      }
    };

    loadVideo();
  }, [video.id, currentQuality, getStreamingUrl]);

  useEffect(() => {
    if (onProgress && duration > 0) {
      onProgress((currentTime / duration) * 100);
    }
  }, [currentTime, duration, onProgress]);

  useEffect(() => {
    if (onComplete && currentTime > 0 && currentTime >= duration - 1) {
      onComplete();
    }
  }, [currentTime, duration, onComplete]);

  const handleQualityChange = (quality: VideoQuality) => {
    const wasPlaying = isPlaying;
    const currentPosition = currentTime;
    
    setCurrentQuality(quality);
    
    // Restaurar posição e estado de reprodução após mudança de qualidade
    setTimeout(() => {
      if (videoRef.current) {
        videoRef.current.currentTime = currentPosition;
        if (wasPlaying) {
          play();
        }
      }
    }, 100);
  };

  if (!streamingUrl) {
    return (
      <div className="aspect-video bg-gray-900 rounded-lg flex items-center justify-center">
        <div className="text-white">Carregando vídeo...</div>
      </div>
    );
  }

  return (
    <div className="relative group">
      <div className="aspect-video bg-black rounded-lg overflow-hidden">
        <video
          ref={videoRef}
          src={streamingUrl.url}
          className="w-full h-full"
          autoPlay={autoplay}
          playsInline
          onContextMenu={(e) => e.preventDefault()} // Prevenir menu de contexto
          controlsList="nodownload" // Remover opção de download
        />
        
        {/* Watermark Overlay */}
        {video.watermarkSettings.enabled && (
          <WatermarkOverlay 
            settings={video.watermarkSettings}
            videoId={video.id}
          />
        )}
        
        {/* Controls Overlay */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <PlaybackControls
            isPlaying={isPlaying}
            currentTime={currentTime}
            duration={duration}
            volume={volume}
            isFullscreen={isFullscreen}
            onPlay={play}
            onPause={pause}
            onSeek={seek}
            onVolumeChange={setVolume}
            onToggleFullscreen={toggleFullscreen}
          />
          
          <div className="absolute top-4 right-4">
            <QualitySelector
              currentQuality={currentQuality}
              availableQualities={video.qualityVariants.map(v => v.quality)}
              onQualityChange={handleQualityChange}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
```

## 5. Hooks Customizados

### 5.1 useVideoUpload.ts

```typescript
import { useState, useCallback } from 'react';
import { VideoUploadService } from '@/services/VideoUploadService';
import { VideoUpload, VideoMetadata } from '@/types/video';
import { useAuth } from '@/hooks/useAuth';

export function useVideoUpload() {
  const [uploads, setUploads] = useState<VideoUpload[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();

  const uploadVideo = useCallback(async (file: File, metadata: VideoMetadata) => {
    if (!user) return;

    const uploadId = crypto.randomUUID();
    const newUpload: VideoUpload = {
      id: uploadId,
      title: metadata.title,
      description: metadata.description,
      originalFilename: file.name,
      fileSize: file.size,
      uploadStatus: 'pending',
      processingStatus: 'queued',
      qualityVariants: [],
      watermarkSettings: {
        enabled: metadata.watermarkEnabled,
        type: 'dynamic',
        position: 'bottom-right',
        opacity: 0.7,
        size: 12,
        dynamicFields: [
          { field: 'username', value: user.name },
          { field: 'company', value: user.company?.name || '' },
          { field: 'timestamp', format: 'DD/MM/YYYY HH:mm' }
        ]
      },
      uploadProgress: 0,
      processingProgress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      uploadedBy: user.id,
      category: metadata.category,
      tags: metadata.tags,
      isPublic: metadata.accessLevel === 'public',
      accessLevel: metadata.accessLevel
    };

    setUploads(prev => [...prev, newUpload]);
    setIsUploading(true);

    try {
      await VideoUploadService.uploadVideo(file, metadata, {
        onProgress: (progress) => {
          setUploads(prev => prev.map(upload => 
            upload.id === uploadId 
              ? { ...upload, uploadProgress: progress, uploadStatus: 'uploading' }
              : upload
          ));
        },
        onComplete: (result) => {
          setUploads(prev => prev.map(upload => 
            upload.id === uploadId 
              ? { 
                  ...upload, 
                  uploadStatus: 'completed',
                  processingStatus: 'processing',
                  uploadProgress: 100
                }
              : upload
          ));
        },
        onError: (error) => {
          setUploads(prev => prev.map(upload => 
            upload.id === uploadId 
              ? { ...upload, uploadStatus: 'failed' }
              : upload
          ));
        }
      });
    } catch (error) {
      console.error('Erro no upload:', error);
    } finally {
      setIsUploading(false);
    }
  }, [user]);

  const cancelUpload = useCallback((uploadId: string) => {
    VideoUploadService.cancelUpload(uploadId);
    setUploads(prev => prev.filter(upload => upload.id !== uploadId));
  }, []);

  const retryUpload = useCallback((uploadId: string) => {
    // Implementar retry logic
  }, []);

  return {
    uploads,
    isUploading,
    uploadVideo,
    cancelUpload,
    retryUpload
  };
}
```

## 6. Serviços de API

### 6.1 VideoUploadService.ts

```typescript
import { supabase } from '@/lib/supabase';
import { VideoUpload, VideoMetadata, StreamingUrl } from '@/types/video';

interface UploadCallbacks {
  onProgress: (progress: number) => void;
  onComplete: (result: any) => void;
  onError: (error: Error) => void;
}

export class VideoUploadService {
  private static activeUploads = new Map<string, AbortController>();

  static async uploadVideo(
    file: File, 
    metadata: VideoMetadata, 
    callbacks: UploadCallbacks
  ): Promise<VideoUpload> {
    const uploadId = crypto.randomUUID();
    const abortController = new AbortController();
    this.activeUploads.set(uploadId, abortController);

    try {
      // 1. Criar registro no banco
      const { data: videoRecord, error: dbError } = await supabase
        .from('training_videos')
        .insert({
          title: metadata.title,
          description: metadata.description,
          original_filename: file.name,
          file_size: file.size,
          category: metadata.category,
          tags: metadata.tags,
          is_public: metadata.accessLevel === 'public',
          upload_status: 'uploading',
          watermark_settings: {
            enabled: metadata.watermarkEnabled,
            type: 'dynamic',
            position: 'bottom-right',
            opacity: 0.7,
            size: 12
          }
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // 2. Upload do arquivo para Supabase Storage
      const filePath = `videos/${videoRecord.id}/${file.name}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('training-videos')
        .upload(filePath, file, {
          onUploadProgress: (progress) => {
            const percentage = (progress.loaded / progress.total) * 100;
            callbacks.onProgress(percentage);
          }
        });

      if (uploadError) throw uploadError;

      // 3. Atualizar registro com caminho do arquivo
      const { error: updateError } = await supabase
        .from('training_videos')
        .update({
          file_path: uploadData.path,
          upload_status: 'completed'
        })
        .eq('id', videoRecord.id);

      if (updateError) throw updateError;

      // 4. Iniciar processamento em background
      await this.startVideoProcessing(videoRecord.id);

      callbacks.onComplete(videoRecord);
      return videoRecord as VideoUpload;

    } catch (error) {
      callbacks.onError(error as Error);
      throw error;
    } finally {
      this.activeUploads.delete(uploadId);
    }
  }

  static async startVideoProcessing(videoId: string): Promise<void> {
    // Chamar Edge Function para iniciar processamento
    const { error } = await supabase.functions.invoke('process-video', {
      body: { videoId }
    });

    if (error) {
      console.error('Erro ao iniciar processamento:', error);
    }
  }

  static cancelUpload(uploadId: string): void {
    const controller = this.activeUploads.get(uploadId);
    if (controller) {
      controller.abort();
      this.activeUploads.delete(uploadId);
    }
  }

  static async getStreamingUrl(
    videoId: string, 
    quality: VideoQuality = '720p'
  ): Promise<StreamingUrl> {
    const { data, error } = await supabase.functions.invoke('get-streaming-url', {
      body: { videoId, quality }
    });

    if (error) throw error;
    return data;
  }

  static async getVideoAnalytics(videoId: string): Promise<VideoAnalytics> {
    const { data, error } = await supabase
      .from('video_views')
      .select('*')
      .eq('video_id', videoId);

    if (error) throw error;

    // Processar dados para analytics
    return this.processAnalyticsData(data);
  }

  private static processAnalyticsData(views: any[]): VideoAnalytics {
    // Implementar processamento de analytics
    return {
      videoId: '',
      totalViews: views.length,
      uniqueViewers: new Set(views.map(v => v.user_id)).size,
      totalWatchTime: views.reduce((sum, v) => sum + v.watch_time, 0),
      averageWatchTime: views.length > 0 ? views.reduce((sum, v) => sum + v.watch_time, 0) / views.length : 0,
      completionRate: views.filter(v => v.completed).length / views.length * 100,
      qualityDistribution: {},
      viewsByDate: [],
      topViewers: []
    };
  }
}
```

## 7. Edge Functions para Processamento

### 7.1 process-video Edge Function

```typescript
// supabase/functions/process-video/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface ProcessVideoRequest {
  videoId: string;
}

serve(async (req) => {
  try {
    const { videoId }: ProcessVideoRequest = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 1. Buscar informações do vídeo
    const { data: video, error: videoError } = await supabase
      .from('training_videos')
      .select('*')
      .eq('id', videoId)
      .single();

    if (videoError) throw videoError;

    // 2. Baixar arquivo original
    const { data: fileData } = await supabase.storage
      .from('training-videos')
      .download(video.file_path);

    if (!fileData) throw new Error('Arquivo não encontrado');

    // 3. Processar vídeo em múltiplas qualidades
    const qualities = ['360p', '480p', '720p', '1080p'];
    const processedVariants = [];

    for (const quality of qualities) {
      try {
        const processedFile = await processVideoQuality(fileData, quality);
        const variantPath = `videos/${videoId}/${quality}.mp4`;
        
        // Upload da variante processada
        const { data: uploadData } = await supabase.storage
          .from('training-videos')
          .upload(variantPath, processedFile);

        if (uploadData) {
          processedVariants.push({
            quality,
            resolution: getResolution(quality),
            file_path: uploadData.path,
            processing_status: 'completed'
          });
        }
      } catch (error) {
        console.error(`Erro ao processar ${quality}:`, error);
      }
    }

    // 4. Atualizar registro com variantes processadas
    const { error: updateError } = await supabase
      .from('training_videos')
      .update({
        quality_variants: processedVariants,
        upload_status: 'ready'
      })
      .eq('id', videoId);

    if (updateError) throw updateError;

    return new Response(
      JSON.stringify({ success: true, variants: processedVariants.length }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

async function processVideoQuality(file: Blob, quality: string): Promise<Blob> {
  // Implementar processamento com FFmpeg
  // Esta é uma implementação simplificada
  return file;
}

function getResolution(quality: string): string {
  const resolutions = {
    '360p': '640x360',
    '480p': '854x480',
    '720p': '1280x720',
    '1080p': '1920x1080'
  };
  return resolutions[quality] || '1280x720';
}
```

## 8. Segurança e Proteção

### 8.1 URLs Assinadas

```typescript
// supabase/functions/get-streaming-url/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sign } from 'https://deno.land/x/djwt@v2.8/mod.ts';

serve(async (req) => {
  try {
    const { videoId, quality = '720p' } = await req.json();
    const authHeader = req.headers.get('Authorization');
    
    if (!authHeader) {
      return new Response('Unauthorized', { status: 401 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verificar permissões do usuário
    const { data: { user } } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Buscar vídeo e verificar acesso
    const { data: video } = await supabase
      .from('training_videos')
      .select('*, profiles!uploaded_by(company_id)')
      .eq('id', videoId)
      .single();

    if (!video) {
      return new Response('Video not found', { status: 404 });
    }

    // Verificar permissões de acesso
    const hasAccess = await checkVideoAccess(user, video);
    if (!hasAccess) {
      return new Response('Forbidden', { status: 403 });
    }

    // Gerar URL assinada
    const expiresAt = new Date(Date.now() + 4 * 60 * 60 * 1000); // 4 horas
    const token = await sign(
      {
        videoId,
        userId: user.id,
        quality,
        exp: Math.floor(expiresAt.getTime() / 1000)
      },
      Deno.env.get('JWT_SECRET') ?? ''
    );

    const { data: signedUrl } = await supabase.storage
      .from('training-videos')
      .createSignedUrl(`videos/${videoId}/${quality}.mp4`, 14400); // 4 horas

    return new Response(
      JSON.stringify({
        url: signedUrl.signedUrl,
        expiresAt: expiresAt.toISOString(),
        quality,
        token
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});

async function checkVideoAccess(user: any, video: any): Promise<boolean> {
  // Implementar lógica de verificação de acesso
  if (video.is_public) return true;
  if (video.uploaded_by === user.id) return true;
  
  // Verificar se é da mesma empresa
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('company_id')
    .eq('id', user.id)
    .single();

  return userProfile?.company_id === video.profiles?.company_id;
}
```

## 9. Cronograma de Implementação

### Fase 1 (4 dias)
- Estrutura básica e tipos
- Componentes de upload
- Integração com Supabase Storage

### Fase 2 (6 dias)
- Player de vídeo seguro
- Sistema de watermark
- Edge Functions para processamento

### Fase 3 (4 dias)
- Analytics e relatórios
- Otimizações de performance
- Testes e segurança

**Total: 14 dias de desenvolvimento**