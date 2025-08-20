// ============================================================================
// VideoUpload Page - Página principal do sistema de upload de vídeos
// ============================================================================

import React, { useState, useCallback } from 'react';
import { Upload, Video, Library, Settings, BarChart3 } from 'lucide-react';
import { VideoUpload as VideoUploadType } from '@/types/video';
import { VideoUploader, VideoLibrary, VideoPlayer } from '@/components/video';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useVideoLibrary } from '@/hooks/useVideo';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

/**
 * Página principal do sistema de upload de vídeos
 */
export function VideoUploadPage() {
  const [activeTab, setActiveTab] = useState('upload');
  const [selectedVideo, setSelectedVideo] = useState<VideoUploadType | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);
  
  const { videos, isLoading, refetch } = useVideoLibrary();
  
  // Estatísticas rápidas
  const stats = {
    total: videos.length,
    completed: videos.filter(v => v.status === 'completed').length,
    processing: videos.filter(v => v.status === 'processing').length,
    uploading: videos.filter(v => v.status === 'uploading').length,
    errors: videos.filter(v => v.status === 'error').length
  };

  // Event handlers
  const handleUploadComplete = useCallback(() => {
    toast.success('Upload concluído com sucesso!');
    refetch();
    setActiveTab('library');
  }, [refetch]);

  const handleVideoSelect = useCallback((video: VideoUploadType) => {
    if (video.status === 'completed') {
      setSelectedVideo(video);
      setShowPlayer(true);
    } else {
      toast.warning('Vídeo ainda não está disponível para reprodução');
    }
  }, []);

  const handleVideoEdit = useCallback((video: VideoUploadType) => {
    // TODO: Implementar edição de vídeo
    toast.info('Funcionalidade de edição em desenvolvimento');
  }, []);

  const handleVideoDelete = useCallback((video: VideoUploadType) => {
    toast.success('Vídeo deletado com sucesso!');
    refetch();
  }, [refetch]);

  const handleClosePlayer = useCallback(() => {
    setShowPlayer(false);
    setSelectedVideo(null);
  }, []);

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Sistema de Upload VPS</h1>
          <p className="text-gray-600 mt-1">
            Gerencie uploads, processamento e streaming de vídeos
          </p>
        </div>
        
        {/* Quick Stats */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Video className="h-3 w-3" />
              {stats.total} Total
            </Badge>
            <Badge variant="secondary" className="flex items-center gap-1">
              <BarChart3 className="h-3 w-3" />
              {stats.completed} Concluídos
            </Badge>
            {stats.processing > 0 && (
              <Badge variant="default" className="flex items-center gap-1">
                <Settings className="h-3 w-3 animate-spin" />
                {stats.processing} Processando
              </Badge>
            )}
            {stats.uploading > 0 && (
              <Badge variant="default" className="flex items-center gap-1">
                <Upload className="h-3 w-3" />
                {stats.uploading} Enviando
              </Badge>
            )}
            {stats.errors > 0 && (
              <Badge variant="destructive" className="flex items-center gap-1">
                {stats.errors} Erro{stats.errors > 1 ? 's' : ''}
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </TabsTrigger>
          <TabsTrigger value="library" className="flex items-center gap-2">
            <Library className="h-4 w-4" />
            Biblioteca
            {stats.total > 0 && (
              <Badge variant="secondary" className="ml-1">
                {stats.total}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analytics
          </TabsTrigger>
        </TabsList>
        
        {/* Upload Tab */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Upload de Vídeos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <VideoUploader
                onUploadComplete={handleUploadComplete}
                maxFileSize={2 * 1024 * 1024 * 1024} // 2GB
                acceptedFormats={['mp4', 'mov', 'avi', 'mkv', 'webm']}
                enableChunkedUpload
                enableThumbnailGeneration
                enableAutoProcessing
                defaultConfig={{
                  contentType: 'training',
                  privacy: 'company_only',
                  generateThumbnails: true,
                  autoProcess: true,
                  watermark: {
                    enabled: true,
                    text: 'Solara Nova Energia',
                    position: 'bottom-right',
                    opacity: 0.7
                  }
                }}
              />
            </CardContent>
          </Card>
          
          {/* Recent Uploads */}
          {stats.uploading > 0 || stats.processing > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Uploads Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <VideoLibrary
                  filters={{
                    status: stats.uploading > 0 ? 'uploading' : 'processing',
                    sortBy: 'createdAt',
                    sortOrder: 'desc',
                    limit: 5
                  }}
                  onVideoSelect={handleVideoSelect}
                  onVideoEdit={handleVideoEdit}
                  onVideoDelete={handleVideoDelete}
                  showUploader={false}
                  showFilters={false}
                  showSearch={false}
                  viewMode="list"
                />
              </CardContent>
            </Card>
          )}
        </TabsContent>
        
        {/* Library Tab */}
        <TabsContent value="library" className="space-y-6">
          <VideoLibrary
            onVideoSelect={handleVideoSelect}
            onVideoEdit={handleVideoEdit}
            onVideoDelete={handleVideoDelete}
            showUploader
            showFilters
            showSearch
            viewMode="grid"
          />
        </TabsContent>
        
        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Total Videos */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Vídeos</CardTitle>
                <Video className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.total}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.completed} concluídos
                </p>
              </CardContent>
            </Card>
            
            {/* Processing */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Processando</CardTitle>
                <Settings className="h-4 w-4 text-muted-foreground animate-spin" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.processing}</div>
                <p className="text-xs text-muted-foreground">
                  Em processamento
                </p>
              </CardContent>
            </Card>
            
            {/* Uploading */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Enviando</CardTitle>
                <Upload className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.uploading}</div>
                <p className="text-xs text-muted-foreground">
                  Upload em andamento
                </p>
              </CardContent>
            </Card>
            
            {/* Errors */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Erros</CardTitle>
                <BarChart3 className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
                <p className="text-xs text-muted-foreground">
                  Requerem atenção
                </p>
              </CardContent>
            </Card>
          </div>
          
          {/* Detailed Analytics */}
          <Card>
            <CardHeader>
              <CardTitle>Analytics Detalhados</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-semibold mb-2">Analytics em Desenvolvimento</h3>
                <p className="text-gray-600">
                  Visualizações detalhadas, relatórios de performance e métricas de engajamento
                  estarão disponíveis em breve.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Video Player Dialog */}
      <Dialog open={showPlayer} onOpenChange={setShowPlayer}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{selectedVideo?.title}</DialogTitle>
          </DialogHeader>
          {selectedVideo && (
            <div className="space-y-4">
              <VideoPlayer
                video={selectedVideo}
                autoPlay
                showControls
                showAnalytics
                showDownload
                showShare
                securitySettings={{
                  disableRightClick: true,
                  disableDownload: false,
                  restrictDomains: [],
                  watermark: selectedVideo.watermark
                }}
                onClose={handleClosePlayer}
              />
              
              {selectedVideo.description && (
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-medium mb-2">Descrição</h4>
                  <p className="text-sm text-gray-600">{selectedVideo.description}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default VideoUploadPage;