import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { TrainingService } from '@/services/trainingService';
import { UserProgress } from '@/types/training';

export function useTrainingProgress(moduleId?: string) {
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      loadProgress();
    }
  }, [user, moduleId, loadProgress]);

  const loadProgress = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await TrainingService.getUserProgress(user!.id, moduleId);
      setProgress(data || []);
    } catch (err) {
      console.warn('Erro ao carregar progresso do treinamento:', err);
      // Em caso de erro, definir array vazio para não quebrar a aplicação
      setProgress([]);
      // Só mostrar erro se não for relacionado a tabela inexistente
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar progresso';
      if (!errorMessage.includes('não existe')) {
        setError(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  }, [user, moduleId]);

  const updateVideoProgress = async (
    videoId: string, 
    progressPercentage: number, 
    watchTimeSeconds: number
  ) => {
    try {
      const updatedProgress = await TrainingService.updateVideoProgress(
        user!.id,
        videoId,
        progressPercentage,
        watchTimeSeconds
      );
      
      // Se o serviço retornou null (tabela não existe), não atualizar o estado
      if (!updatedProgress) {
        console.warn('Progresso não foi salvo - tabela de treinamento não existe');
        return;
      }

      // Atualizar estado local
      setProgress(prev => {
        const existing = prev.find(p => p.video_id === videoId || p.content_id === videoId);
        if (existing) {
          return prev.map(p => (p.video_id === videoId || p.content_id === videoId) ? updatedProgress : p);
        } else {
          return [...prev, updatedProgress];
        }
      });

      return updatedProgress;
    } catch (err) {
      console.warn('Erro ao atualizar progresso do vídeo:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar progresso';
      if (!errorMessage.includes('não existe')) {
        setError(errorMessage);
      }
      throw err;
    }
  };

  const getVideoProgress = (videoId: string): UserProgress | undefined => {
    return progress.find(p => p.video_id === videoId);
  };

  const getModuleProgress = (moduleId: string): number => {
    const moduleProgress = progress.filter(p => p.module_id === moduleId);
    if (moduleProgress.length === 0) return 0;

    const totalProgress = moduleProgress.reduce((sum, p) => sum + p.progress_percentage, 0);
    return Math.round(totalProgress / moduleProgress.length);
  };

  const isVideoCompleted = (videoId: string): boolean => {
    const videoProgress = getVideoProgress(videoId);
    return videoProgress ? videoProgress.progress_percentage >= 100 : false;
  };

  return {
    progress,
    loading,
    error,
    updateVideoProgress,
    getVideoProgress,
    getModuleProgress,
    isVideoCompleted,
    refetch: loadProgress
  };
}