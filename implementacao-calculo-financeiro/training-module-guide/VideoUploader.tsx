import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { TrainingService } from '@/services/trainingService';
import { TrainingVideo } from '@/types/training';
import { 
  Upload, 
  Video, 
  X, 
  CheckCircle, 
  AlertCircle,
  FileVideo,
  Clock,
  HardDrive
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoUploaderProps {
  moduleId: string;
  onVideoUploaded?: (video: TrainingVideo) => void;
  className?: string;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  videoId?: string;
}

export function VideoUploader({ moduleId, onVideoUploaded, className }: VideoUploaderProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoDescription, setVideoDescription] = useState('');
  const { user } = useAuth();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const videoFiles = acceptedFiles.filter(file => file.type.startsWith('video/'));
    
    if (videoFiles.length === 0) {
      alert('Por favor, selecione apenas arquivos de vídeo.');
      return;
    }

    // Adicionar arquivos à lista de upload
    const newUploads: UploadingFile[] = videoFiles.map(file => ({
      file,
      progress: 0,
      status: 'uploading'
    }));

    setUploadingFiles(prev => [...prev, ...newUploads]);

    // Iniciar upload de cada arquivo
    videoFiles.forEach((file, index) => {
      uploadVideo(file, newUploads.length - videoFiles.length + index);
    });
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.mkv']
    },
    multiple: true,
    maxSize: 500 * 1024 * 1024 // 500MB
  });

  const uploadVideo = async (file: File, index: number) => {
    try {
      // Simular progresso de upload
      const updateProgress = (progress: number) => {
        setUploadingFiles(prev => prev.map((upload, i) => 
          i === index ? { ...upload, progress } : upload
        ));
      };

      // Simular upload progressivo
      for (let progress = 0; progress <= 90; progress += 10) {
        updateProgress(progress);
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Gerar nome do arquivo único
      const timestamp = Date.now();
      const fileName = `${user!.id}/videos/${moduleId}/${timestamp}_${file.name}`;

      // Upload para Supabase Storage
      const videoUrl = await TrainingService.uploadFile(file, fileName);

      // Atualizar status para processamento
      setUploadingFiles(prev => prev.map((upload, i) => 
        i === index ? { ...upload, status: 'processing', progress: 95 } : upload
      ));

      // Criar registro do vídeo no banco
      const videoData = {
        module_id: moduleId,
        title: videoTitle || file.name.replace(/\.[^/.]+$/, ''),
        description: videoDescription,
        video_url: videoUrl,
        file_size: file.size,
        order_index: 0
      };

      const newVideo = await TrainingService.createVideo(videoData);

      // Finalizar upload
      setUploadingFiles(prev => prev.map((upload, i) => 
        i === index ? { 
          ...upload, 
          status: 'completed', 
          progress: 100,
          videoId: newVideo.id 
        } : upload
      ));

      onVideoUploaded?.(newVideo);

      // Limpar campos após upload bem-sucedido
      if (index === uploadingFiles.length - 1) {
        setVideoTitle('');
        setVideoDescription('');
      }

    } catch (error) {
      console.error('Erro no upload:', error);
      setUploadingFiles(prev => prev.map((upload, i) => 
        i === index ? { 
          ...upload, 
          status: 'error', 
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        } : upload
      ));
    }
  };

  const removeUpload = (index: number) => {
    setUploadingFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getVideoDuration = (file: File): Promise<number> => {
    return new Promise((resolve) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        resolve(video.duration);
      };
      video.src = URL.createObjectURL(file);
    });
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Formulário de informações do vídeo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Video className="h-5 w-5 mr-2" />
            Informações do Vídeo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="video-title">Título do Vídeo</Label>
            <Input
              id="video-title"
              placeholder="Digite o título do vídeo"
              value={videoTitle}
              onChange={(e) => setVideoTitle(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="video-description">Descrição (opcional)</Label>
            <Textarea
              id="video-description"
              placeholder="Descreva o conteúdo do vídeo"
              value={videoDescription}
              onChange={(e) => setVideoDescription(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Área de upload */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Upload de Vídeos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors",
              isDragActive 
                ? "border-blue-500 bg-blue-50" 
                : "border-gray-300 hover:border-gray-400"
            )}
          >
            <input {...getInputProps()} />
            <FileVideo className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            {isDragActive ? (
              <p className="text-blue-600">Solte os vídeos aqui...</p>
            ) : (
              <div>
                <p className="text-gray-600 mb-2">
                  Arraste e solte vídeos aqui, ou clique para selecionar
                </p>
                <p className="text-sm text-gray-500">
                  Formatos suportados: MP4, AVI, MOV, WMV, FLV, WebM, MKV
                </p>
                <p className="text-sm text-gray-500">
                  Tamanho máximo: 500MB por arquivo
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Lista de uploads */}
      {uploadingFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Uploads em Andamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {uploadingFiles.map((upload, index) => (
                <div key={index} className="border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <FileVideo className="h-4 w-4 text-blue-500" />
                      <span className="font-medium truncate">
                        {upload.file.name}
                      </span>
                      <Badge variant={
                        upload.status === 'completed' ? 'default' :
                        upload.status === 'error' ? 'destructive' :
                        'secondary'
                      }>
                        {upload.status === 'uploading' && 'Enviando'}
                        {upload.status === 'processing' && 'Processando'}
                        {upload.status === 'completed' && 'Concluído'}
                        {upload.status === 'error' && 'Erro'}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeUpload(index)}
                      disabled={upload.status === 'uploading' || upload.status === 'processing'}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <HardDrive className="h-3 w-3" />
                          <span>{formatFileSize(upload.file.size)}</span>
                        </div>
                      </div>
                      <span>{upload.progress}%</span>
                    </div>

                    <Progress value={upload.progress} className="w-full" />

                    {upload.status === 'error' && upload.error && (
                      <div className="flex items-center space-x-2 text-red-600 text-sm">
                        <AlertCircle className="h-4 w-4" />
                        <span>{upload.error}</span>
                      </div>
                    )}

                    {upload.status === 'completed' && (
                      <div className="flex items-center space-x-2 text-green-600 text-sm">
                        <CheckCircle className="h-4 w-4" />
                        <span>Upload concluído com sucesso!</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

