// =====================================================================================
// HOOK DE GERENCIAMENTO DE VÍDEOS - SOLARA NOVA ENERGIA
// =====================================================================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  VideoMetadata, 
  VideoError, 
  VideoProgress, 
  VideoInteraction,
  UploadProgress,
  VideoAnalytics,
  VideoStats
} from '../types/video';
import { videoUploadService } from '../services/videoUploadService';
import { secureStreamingService } from '../services/secureStreamingService';
import { supabase } from '../integrations/supabase/client';
import { toast } from 'sonner';

interface UseVideoManagerOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableAnalytics?: boolean;
  enableRealTimeUpdates?: boolean;
}

interface VideoManagerState {
  videos: VideoMetadata[];
  loading: boolean;
  error: string | null;
  uploadProgress: Record<string, UploadProgress>;
  analytics: Record<string, VideoAnalytics>;
  currentUser: Record<string, unknown> | null;
}

interface VideoManagerActions {
  loadVideos: () => Promise<void>;
  uploadVideo: (file: File, metadata?: Partial<VideoMetadata>) => Promise<string>;
  deleteVideo: (videoId: string) => Promise<void>;
  updateVideo: (videoId: string, updates: Partial<VideoMetadata>) => Promise<void>;
  getSecureUrl: (videoId: string, quality?: string) => Promise<string>;
  trackProgress: (videoId: string, progress: VideoProgress) => Promise<void>;
  trackInteraction: (videoId: string, interaction: VideoInteraction) => Promise<void>;
  getVideoAnalytics: (videoId: string) => Promise<VideoAnalytics | null>;
  refreshAnalytics: (videoId?: string) => Promise<void>;
  clearError: () => void;
}

export const useVideoManager = (options: UseVideoManagerOptions = {}): VideoManagerState & VideoManagerActions => {
  const {
    autoRefresh = false,
    refreshInterval = 30000, // 30 segundos
    enableAnalytics = true,
    enableRealTimeUpdates = true
  } = options;

  // Estado
  const [state, setState] = useState<VideoManagerState>({
    videos: [],
    loading: true,
    error: null,
    uploadProgress: {},
    analytics: {},
    currentUser: null
  });

  // Refs
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const realtimeSubscriptionRef = useRef<unknown>(null);

  /**
   * Atualizar estado
   */
  const updateState = useCallback((updates: Partial<VideoManagerState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  /**
   * Carregar usuário atual
   */
  const loadCurrentUser = useCallback(async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) throw error;
      
      updateState({ currentUser: user });
      return user;
    } catch (error) {
      console.error('Erro ao carregar usuário:', error);
      updateState({ error: 'Erro ao carregar usuário' });
      return null;
    }
  }, [updateState]);

  /**
   * Carregar vídeos
   */
  const loadVideos = useCallback(async () => {
    try {
      updateState({ loading: true, error: null });
      
      const user = state.currentUser || await loadCurrentUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const videos = await videoUploadService.getUserVideos(user.id);
      updateState({ videos, loading: false });
      
      // Carregar analytics se habilitado
      if (enableAnalytics) {
        await refreshAnalytics();
      }
    } catch (error) {
      console.error('Erro ao carregar vídeos:', error);
      updateState({ 
        loading: false, 
        error: error instanceof Error ? error.message : 'Erro ao carregar vídeos' 
      });
    }
  }, [state.currentUser, loadCurrentUser, enableAnalytics, updateState]);

  /**
   * Upload de vídeo
   */
  const uploadVideo = useCallback(async (file: File, metadata: Partial<VideoMetadata> = {}): Promise<string> => {
    try {
      const user = state.currentUser || await loadCurrentUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Gerar ID único para o upload
      const uploadId = `upload_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // Inicializar progresso
      updateState({
        uploadProgress: {
          ...state.uploadProgress,
          [uploadId]: {
            uploadId,
            fileName: file.name,
            fileSize: file.size,
            uploadedBytes: 0,
            percentage: 0,
            status: 'uploading',
            startTime: new Date(),
            estimatedTimeRemaining: 0,
            uploadSpeed: 0
          }
        }
      });

      // Callback de progresso
      const onProgress = (progress: UploadProgress) => {
        updateState({
          uploadProgress: {
            ...state.uploadProgress,
            [uploadId]: progress
          }
        });
      };

      // Realizar upload
      const videoId = await videoUploadService.uploadVideo(
        file,
        {
          ...metadata,
          uploadedBy: user.id
        },
        onProgress
      );

      // Remover progresso e recarregar vídeos
      const newUploadProgress = { ...state.uploadProgress };
      delete newUploadProgress[uploadId];
      updateState({ uploadProgress: newUploadProgress });
      
      await loadVideos();
      toast.success('Vídeo enviado com sucesso!');
      
      return videoId;
    } catch (error) {
      console.error('Erro no upload:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro no upload';
      updateState({ error: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  }, [state.currentUser, state.uploadProgress, loadCurrentUser, loadVideos, updateState]);

  /**
   * Deletar vídeo
   */
  const deleteVideo = useCallback(async (videoId: string) => {
    try {
      await videoUploadService.deleteVideo(videoId);
      
      // Remover do estado local
      updateState({
        videos: state.videos.filter(v => v.id !== videoId),
        analytics: {
          ...state.analytics,
          [videoId]: undefined
        }
      });
      
      toast.success('Vídeo deletado com sucesso');
    } catch (error) {
      console.error('Erro ao deletar vídeo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao deletar vídeo';
      updateState({ error: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  }, [state.videos, state.analytics, updateState]);

  /**
   * Atualizar vídeo
   */
  const updateVideo = useCallback(async (videoId: string, updates: Partial<VideoMetadata>) => {
    try {
      await videoUploadService.updateVideoMetadata(videoId, updates);
      
      // Atualizar estado local
      updateState({
        videos: state.videos.map(v => 
          v.id === videoId ? { ...v, ...updates } : v
        )
      });
      
      toast.success('Vídeo atualizado com sucesso');
    } catch (error) {
      console.error('Erro ao atualizar vídeo:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro ao atualizar vídeo';
      updateState({ error: errorMessage });
      toast.error(errorMessage);
      throw error;
    }
  }, [state.videos, updateState]);

  /**
   * Obter URL segura
   */
  const getSecureUrl = useCallback(async (videoId: string, quality: string = '720p'): Promise<string> => {
    try {
      const user = state.currentUser || await loadCurrentUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const watermarkText = `${user.email} - ${new Date().toLocaleDateString()}`;
      return await secureStreamingService.getSecureStreamingUrl(
        videoId,
        user.id,
        quality,
        watermarkText
      );
    } catch (error) {
      console.error('Erro ao obter URL segura:', error);
      throw error;
    }
  }, [state.currentUser, loadCurrentUser]);

  /**
   * Rastrear progresso
   */
  const trackProgress = useCallback(async (videoId: string, progress: VideoProgress) => {
    try {
      // Salvar no banco de dados
      const { error } = await supabase
        .from('video_progress')
        .upsert({
          video_id: videoId,
          user_id: state.currentUser?.id,
          current_time: progress.currentTime,
          duration: progress.duration,
          percentage: progress.percentage,
          completed: progress.completed,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao rastrear progresso:', error);
    }
  }, [state.currentUser]);

  /**
   * Rastrear interação
   */
  const trackInteraction = useCallback(async (videoId: string, interaction: VideoInteraction) => {
    try {
      // Salvar no banco de dados
      const { error } = await supabase
        .from('video_interactions')
        .insert({
          video_id: videoId,
          user_id: state.currentUser?.id,
          interaction_type: interaction.type,
          timestamp: interaction.timestamp.toISOString(),
          data: interaction.data
        });

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao rastrear interação:', error);
    }
  }, [state.currentUser]);

  /**
   * Obter analytics de vídeo
   */
  const getVideoAnalytics = useCallback(async (videoId: string): Promise<VideoAnalytics | null> => {
    try {
      // Buscar dados de analytics
      const [viewsResult, progressResult, interactionsResult] = await Promise.all([
        supabase
          .from('video_views')
          .select('*')
          .eq('video_id', videoId),
        supabase
          .from('video_progress')
          .select('*')
          .eq('video_id', videoId),
        supabase
          .from('video_interactions')
          .select('*')
          .eq('video_id', videoId)
      ]);

      if (viewsResult.error || progressResult.error || interactionsResult.error) {
        throw new Error('Erro ao buscar analytics');
      }

      const views = viewsResult.data || [];
      const progress = progressResult.data || [];
      const interactions = interactionsResult.data || [];

      // Calcular métricas
      const totalViews = views.length;
      const uniqueViewers = new Set(views.map(v => v.user_id)).size;
      const completedViews = progress.filter(p => p.completed).length;
      const averageWatchTime = progress.length > 0 
        ? progress.reduce((sum, p) => sum + p.current_time, 0) / progress.length 
        : 0;
      const completionRate = totalViews > 0 ? (completedViews / totalViews) * 100 : 0;

      const analytics: VideoAnalytics = {
        videoId,
        totalViews,
        uniqueViewers,
        averageWatchTime,
        completionRate,
        engagementScore: Math.min(100, (completionRate + (interactions.length / Math.max(1, totalViews)) * 50)),
        viewsOverTime: views.map(v => ({
          date: new Date(v.created_at),
          views: 1
        })),
        qualityDistribution: {
          '480p': Math.floor(totalViews * 0.2),
          '720p': Math.floor(totalViews * 0.5),
          '1080p': Math.floor(totalViews * 0.3)
        },
        topVideos: [],
        recentActivity: interactions.slice(-10).map(i => ({
          id: i.id,
          type: i.interaction_type,
          timestamp: new Date(i.timestamp),
          user: i.user_id,
          data: i.data
        }))
      };

      // Atualizar cache local
      updateState({
        analytics: {
          ...state.analytics,
          [videoId]: analytics
        }
      });

      return analytics;
    } catch (error) {
      console.error('Erro ao obter analytics:', error);
      return null;
    }
  }, [state.analytics, updateState]);

  /**
   * Atualizar analytics
   */
  const refreshAnalytics = useCallback(async (videoId?: string) => {
    try {
      if (videoId) {
        await getVideoAnalytics(videoId);
      } else {
        // Atualizar analytics de todos os vídeos
        const promises = state.videos.map(video => getVideoAnalytics(video.id));
        await Promise.all(promises);
      }
    } catch (error) {
      console.error('Erro ao atualizar analytics:', error);
    }
  }, [state.videos, getVideoAnalytics]);

  /**
   * Limpar erro
   */
  const clearError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  /**
   * Configurar atualizações em tempo real
   */
  useEffect(() => {
    if (!enableRealTimeUpdates || !state.currentUser) return;

    // Subscription para mudanças nos vídeos
    realtimeSubscriptionRef.current = supabase
      .channel('video_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'videos',
          filter: `uploaded_by=eq.${state.currentUser.id}`
        },
        (payload) => {
          console.log('Mudança em tempo real:', payload);
          loadVideos(); // Recarregar vídeos quando houver mudanças
        }
      )
      .subscribe();

    return () => {
      if (realtimeSubscriptionRef.current) {
        supabase.removeChannel(realtimeSubscriptionRef.current);
      }
    };
  }, [enableRealTimeUpdates, state.currentUser, loadVideos]);

  /**
   * Configurar refresh automático
   */
  useEffect(() => {
    if (!autoRefresh) return;

    refreshIntervalRef.current = setInterval(() => {
      loadVideos();
    }, refreshInterval);

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [autoRefresh, refreshInterval, loadVideos]);

  /**
   * Inicialização
   */
  useEffect(() => {
    loadCurrentUser().then(() => {
      loadVideos();
    });
  }, []);

  /**
   * Cleanup
   */
  useEffect(() => {
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (realtimeSubscriptionRef.current) {
        supabase.removeChannel(realtimeSubscriptionRef.current);
      }
    };
  }, []);

  return {
    // Estado
    ...state,
    
    // Ações
    loadVideos,
    uploadVideo,
    deleteVideo,
    updateVideo,
    getSecureUrl,
    trackProgress,
    trackInteraction,
    getVideoAnalytics,
    refreshAnalytics,
    clearError
  };
};

export default useVideoManager;