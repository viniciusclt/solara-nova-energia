import { useState, useEffect } from 'react';
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
  }, [user, moduleId]);

  const loadProgress = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await TrainingService.getUserProgress(user!.id, moduleId);
      setProgress(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao carregar progresso');
    } finally {
      setLoading(false);
    }
  };

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

      // Atualizar estado local
      setProgress(prev => {
        const existing = prev.find(p => p.video_id === videoId);
        if (existing) {
          return prev.map(p => p.video_id === videoId ? updatedProgress : p);
        } else {
          return [...prev, updatedProgress];
        }
      });

      return updatedProgress;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao atualizar progresso');
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

