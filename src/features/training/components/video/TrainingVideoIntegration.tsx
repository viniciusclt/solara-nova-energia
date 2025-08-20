// =====================================================================================
// INTEGRAÇÃO DE VÍDEOS COM MÓDULO DE TREINAMENTOS - SOLARA NOVA ENERGIA
// =====================================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Play, 
  Upload, 
  BookOpen, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Eye,
  Download,
  Edit,
  Trash2,
  Plus,
  FileVideo,
  BarChart3,
  Users,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { VideoUploader } from '../../../../components/video/VideoUploader';
import { AdvancedVideoPlayer } from '../../../../components/video/AdvancedVideoPlayer';
import { VideoAnalytics } from '../../../../components/video/VideoAnalytics';
import { useVideoManager } from '../../../../hooks/useVideoManager';
import { 
  VideoMetadata, 
  VideoProgress, 
  VideoInteraction,
  TrainingVideoContent
} from '../../../../types/video';
import { 
  TrainingModule,
  TrainingVideo,
  UserProgress,
  ModuleWithContent
} from '../../types';
import { supabase } from '../../../../integrations/supabase/client';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Progress } from '../../../../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';

interface TrainingVideoIntegrationProps {
  module: ModuleWithContent;
  onModuleUpdate?: (module: ModuleWithContent) => void;
  canEdit?: boolean;
  className?: string;
}

interface VideoWithProgress extends VideoMetadata {
  trainingVideoId?: string;
  orderIndex: number;
  userProgress?: UserProgress;
  completionRate: number;
  averageWatchTime: number;
  totalViews: number;
}

export const TrainingVideoIntegration: React.FC<TrainingVideoIntegrationProps> = ({
  module,
  onModuleUpdate,
  canEdit = false,
  className = ''
}) => {
  const [selectedVideo, setSelectedVideo] = useState<VideoWithProgress | null>(null);
  const [showUploader, setShowUploader] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [videosWithProgress, setVideosWithProgress] = useState<VideoWithProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('videos');

  const {
    videos,
    currentUser,
    uploadVideo,
    deleteVideo,
    getVideoAnalytics,
    trackProgress,
    trackInteraction
  } = useVideoManager({
    enableAnalytics: true,
    enableRealTimeUpdates: true
  });

  /**
   * Carregar vídeos do módulo com progresso
   */
  const loadModuleVideos = useCallback(async () => {
    try {
      setLoading(true);
      
      // Buscar vídeos do módulo de treinamento
      const { data: trainingVideos, error: videosError } = await supabase
        .from('training_videos')
        .select('*')
        .eq('module_id', module.id)
        .order('order_index');

      if (videosError) throw videosError;

      // Buscar progresso do usuário
      const { data: userProgress, error: progressError } = await supabase
        .from('user_progress')
        .select('*')
        .eq('module_id', module.id)
        .eq('user_id', currentUser?.id);

      if (progressError) throw progressError;

      // Combinar dados de vídeos com progresso e analytics
      const videosWithProgressData: VideoWithProgress[] = [];
      
      for (const trainingVideo of trainingVideos || []) {
        // Encontrar vídeo correspondente no sistema de vídeos
        const videoMetadata = videos.find(v => v.id === trainingVideo.video_id);
        
        if (videoMetadata) {
          // Buscar progresso específico do vídeo
          const videoProgress = userProgress?.find(p => p.video_id === trainingVideo.video_id);
          
          // Buscar analytics do vídeo
          const analytics = await getVideoAnalytics(trainingVideo.video_id);
          
          videosWithProgressData.push({
            ...videoMetadata,
            trainingVideoId: trainingVideo.id,
            orderIndex: trainingVideo.order_index,
            userProgress: videoProgress,
            completionRate: analytics?.completionRate || 0,
            averageWatchTime: analytics?.averageWatchTime || 0,
            totalViews: analytics?.totalViews || 0
          });
        }
      }
      
      setVideosWithProgress(videosWithProgressData);
    } catch (error) {
      console.error('Erro ao carregar vídeos do módulo:', error);
      toast.error('Erro ao carregar vídeos do módulo');
    } finally {
      setLoading(false);
    }
  }, [module.id, currentUser?.id, videos, getVideoAnalytics]);

  /**
   * Adicionar vídeo ao módulo
   */
  const handleAddVideoToModule = useCallback(async (videoMetadata: VideoMetadata) => {
    try {
      // Obter próximo order_index
      const maxOrder = Math.max(...videosWithProgress.map(v => v.orderIndex), 0);
      
      // Criar entrada na tabela training_videos
      const { data, error } = await supabase
        .from('training_videos')
        .insert({
          module_id: module.id,
          video_id: videoMetadata.id,
          title: videoMetadata.title,
          description: videoMetadata.description,
          video_url: videoMetadata.streamingUrl,
          thumbnail_url: videoMetadata.thumbnails?.[0],
          duration_seconds: videoMetadata.duration,
          file_size: videoMetadata.size,
          order_index: maxOrder + 1
        })
        .select()
        .single();

      if (error) throw error;

      toast.success('Vídeo adicionado ao módulo com sucesso!');
      await loadModuleVideos();
      
      // Notificar atualização do módulo
      if (onModuleUpdate) {
        const updatedModule = {
          ...module,
          videos: [...module.videos, data]
        };
        onModuleUpdate(updatedModule);
      }
    } catch (error) {
      console.error('Erro ao adicionar vídeo ao módulo:', error);
      toast.error('Erro ao adicionar vídeo ao módulo');
    }
  }, [module, videosWithProgress, loadModuleVideos, onModuleUpdate]);

  /**
   * Remover vídeo do módulo
   */
  const handleRemoveVideoFromModule = useCallback(async (videoId: string) => {
    if (!confirm('Tem certeza que deseja remover este vídeo do módulo?')) {
      return;
    }

    try {
      const video = videosWithProgress.find(v => v.id === videoId);
      if (!video?.trainingVideoId) return;

      // Remover da tabela training_videos
      const { error } = await supabase
        .from('training_videos')
        .delete()
        .eq('id', video.trainingVideoId);

      if (error) throw error;

      toast.success('Vídeo removido do módulo');
      await loadModuleVideos();
      
      // Notificar atualização do módulo
      if (onModuleUpdate) {
        const updatedModule = {
          ...module,
          videos: module.videos.filter(v => v.id !== video.trainingVideoId)
        };
        onModuleUpdate(updatedModule);
      }
    } catch (error) {
      console.error('Erro ao remover vídeo do módulo:', error);
      toast.error('Erro ao remover vídeo do módulo');
    }
  }, [videosWithProgress, module, loadModuleVideos, onModuleUpdate]);

  /**
   * Reproduzir vídeo
   */
  const handlePlayVideo = useCallback(async (video: VideoWithProgress) => {
    setSelectedVideo(video);
    setShowPlayer(true);
  }, []);

  /**
   * Manipular progresso do vídeo
   */
  const handleVideoProgress = useCallback(async (progress: VideoProgress) => {
    if (!selectedVideo || !currentUser) return;

    try {
      // Salvar progresso no sistema de vídeos
      await trackProgress(selectedVideo.id, progress);
      
      // Salvar progresso específico do treinamento
      const { error } = await supabase
        .from('user_progress')
        .upsert({
          user_id: currentUser.id,
          module_id: module.id,
          video_id: selectedVideo.id,
          progress_percentage: progress.percentage,
          completed_at: progress.completed ? new Date().toISOString() : null,
          last_watched_at: new Date().toISOString(),
          watch_time_seconds: progress.currentTime
        });

      if (error) throw error;
      
      // Recarregar dados se o vídeo foi concluído
      if (progress.completed) {
        await loadModuleVideos();
        toast.success('Vídeo concluído! 🎉');
      }
    } catch (error) {
      console.error('Erro ao salvar progresso:', error);
    }
  }, [selectedVideo, currentUser, module.id, trackProgress, loadModuleVideos]);

  /**
   * Manipular interação do vídeo
   */
  const handleVideoInteraction = useCallback(async (interaction: VideoInteraction) => {
    if (!selectedVideo) return;

    try {
      await trackInteraction(selectedVideo.id, interaction);
    } catch (error) {
      console.error('Erro ao rastrear interação:', error);
    }
  }, [selectedVideo, trackInteraction]);

  /**
   * Calcular estatísticas do módulo
   */
  const moduleStats = React.useMemo(() => {
    const totalVideos = videosWithProgress.length;
    const completedVideos = videosWithProgress.filter(v => v.userProgress?.completed_at).length;
    const totalDuration = videosWithProgress.reduce((sum, v) => sum + v.duration, 0);
    const watchedTime = videosWithProgress.reduce((sum, v) => sum + (v.userProgress?.watch_time_seconds || 0), 0);
    
    return {
      totalVideos,
      completedVideos,
      completionRate: totalVideos > 0 ? (completedVideos / totalVideos) * 100 : 0,
      totalDuration,
      watchedTime,
      progressPercentage: totalDuration > 0 ? (watchedTime / totalDuration) * 100 : 0
    };
  }, [videosWithProgress]);

  /**
   * Formatar duração
   */
  const formatDuration = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  useEffect(() => {
    if (currentUser) {
      loadModuleVideos();
    }
  }, [currentUser, loadModuleVideos]);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header com estatísticas */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <FileVideo className="w-5 h-5 text-blue-600" />
                <span>Vídeos do Módulo</span>
              </CardTitle>
              <CardDescription>
                {module.title} - Conteúdo em vídeo
              </CardDescription>
            </div>
            {canEdit && (
              <Button onClick={() => setShowUploader(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Vídeo
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{moduleStats.totalVideos}</div>
              <div className="text-sm text-gray-500">Total de Vídeos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{moduleStats.completedVideos}</div>
              <div className="text-sm text-gray-500">Concluídos</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{formatDuration(moduleStats.totalDuration)}</div>
              <div className="text-sm text-gray-500">Duração Total</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{moduleStats.completionRate.toFixed(1)}%</div>
              <div className="text-sm text-gray-500">Taxa de Conclusão</div>
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progresso Geral</span>
              <span>{moduleStats.progressPercentage.toFixed(1)}%</span>
            </div>
            <Progress value={moduleStats.progressPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Tabs de conteúdo */}
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList>
          <TabsTrigger value="videos">Vídeos</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="videos" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
          ) : videosWithProgress.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileVideo className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum vídeo no módulo
                </h3>
                <p className="text-gray-500 mb-4">
                  Adicione vídeos para começar o treinamento
                </p>
                {canEdit && (
                  <Button onClick={() => setShowUploader(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Primeiro Vídeo
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videosWithProgress.map((video, index) => (
                <motion.div
                  key={video.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="overflow-hidden hover:shadow-lg transition-shadow">
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-gray-100">
                      {video.thumbnails?.[0] ? (
                        <img 
                          src={video.thumbnails[0]} 
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                      
                      {/* Status badge */}
                      <div className="absolute top-2 right-2">
                        {video.userProgress?.completed_at ? (
                          <Badge className="bg-green-500 text-white">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Concluído
                          </Badge>
                        ) : video.userProgress ? (
                          <Badge className="bg-blue-500 text-white">
                            <Clock className="w-3 h-3 mr-1" />
                            Em Progresso
                          </Badge>
                        ) : (
                          <Badge variant="outline">
                            Não Iniciado
                          </Badge>
                        )}
                      </div>
                      
                      {/* Play overlay */}
                      <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                        <button
                          onClick={() => handlePlayVideo(video)}
                          className="p-3 bg-white/90 rounded-full hover:bg-white transition-colors"
                        >
                          <Play className="w-6 h-6 text-gray-900" />
                        </button>
                      </div>
                      
                      {/* Progress bar */}
                      {video.userProgress && (
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
                          <div 
                            className="h-full bg-blue-500 transition-all duration-300"
                            style={{ width: `${video.userProgress.progress_percentage}%` }}
                          />
                        </div>
                      )}
                    </div>
                    
                    {/* Conteúdo */}
                    <CardContent className="p-4">
                      <h3 className="font-medium text-gray-900 mb-1 truncate">
                        {video.title}
                      </h3>
                      <p className="text-sm text-gray-500 mb-2 line-clamp-2">
                        {video.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                        <span>{formatDuration(video.duration)}</span>
                        <span>{video.totalViews} visualizações</span>
                      </div>
                      
                      {/* Ações */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handlePlayVideo(video)}
                            className="p-1 text-gray-600 hover:text-blue-600 transition-colors"
                            title="Reproduzir"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedVideo(video);
                              setShowAnalytics(true);
                            }}
                            className="p-1 text-gray-600 hover:text-purple-600 transition-colors"
                            title="Analytics"
                          >
                            <BarChart3 className="w-4 h-4" />
                          </button>
                        </div>
                        
                        {canEdit && (
                          <button
                            onClick={() => handleRemoveVideoFromModule(video.id)}
                            className="p-1 text-gray-600 hover:text-red-600 transition-colors"
                            title="Remover do módulo"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="analytics">
          <VideoAnalytics moduleId={module.id} />
        </TabsContent>
      </Tabs>

      {/* Modal do Uploader */}
      <AnimatePresence>
        {showUploader && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowUploader(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Adicionar Vídeo ao Módulo
                </h2>
                <button
                  onClick={() => setShowUploader(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>
              <VideoUploader
                onUploadComplete={(video) => {
                  handleAddVideoToModule(video);
                  setShowUploader(false);
                }}
                onUploadError={(error) => {
                  toast.error(`Erro no upload: ${error.message}`);
                }}
                maxFiles={1}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal do Player */}
      <AnimatePresence>
        {showPlayer && selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPlayer(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-6xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {selectedVideo.title}
                </h2>
                <button
                  onClick={() => setShowPlayer(false)}
                  className="text-white hover:text-gray-300 text-2xl"
                >
                  ×
                </button>
              </div>
              <AdvancedVideoPlayer
                video={selectedVideo}
                onProgress={handleVideoProgress}
                onInteraction={handleVideoInteraction}
                onComplete={() => {
                  toast.success('Vídeo concluído! 🎉');
                  setShowPlayer(false);
                }}
                watermarkText={currentUser?.email}
                autoPlay
                startTime={selectedVideo.userProgress?.watch_time_seconds || 0}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal