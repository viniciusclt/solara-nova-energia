// =====================================================
// HOOKS CUSTOMIZADOS PARA TREINAMENTOS
// Sistema de Treinamentos Corporativos - Solara Nova Energia
// Versão: 1.0
// Data: 2024-12-12
// =====================================================

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { trainingService } from '../services/trainingService';
import { useAuth } from '../../../contexts/AuthContext';
import type {
  TrainingModule,
  TrainingContent,
  TrainingVideo,
  TrainingAssessment,
  UserTrainingProgress,
  TrainingCertificate,
  UserRanking,
  TrainingFilters,
  ModuleFormData,
  ContentFormData,
  AssessmentFormData,
  PaginatedResponse,
  ProgressResponse,
  CompanyTrainingReport,
  ModuleStatistics,
  UserAnswer,
  AssessmentResponse
} from '../types';

// =====================================================
// HOOK PRINCIPAL PARA MÓDULOS
// =====================================================

export function useTrainingModules(
  filters?: TrainingFilters,
  page = 1,
  limit = 10
) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query para buscar módulos
  const {
    data: modulesData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['training-modules', user?.company_id, filters, page, limit],
    queryFn: () => {
      if (!user?.company_id) throw new Error('Company ID não encontrado');
      return trainingService.getModules(user.company_id, filters, page, limit);
    },
    enabled: !!user?.company_id,
    staleTime: 5 * 60 * 1000, // 5 minutos
    cacheTime: 10 * 60 * 1000 // 10 minutos
  });

  // Mutation para criar módulo
  const createModuleMutation = useMutation({
    mutationFn: (moduleData: ModuleFormData) => {
      if (!user?.company_id || !user?.id) {
        throw new Error('Dados do usuário não encontrados');
      }
      return trainingService.createModule(user.company_id, moduleData, user.id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-modules'] });
      toast.success('Módulo criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar módulo:', error);
      toast.error('Erro ao criar módulo. Tente novamente.');
    }
  });

  // Mutation para atualizar módulo
  const updateModuleMutation = useMutation({
    mutationFn: ({ moduleId, moduleData }: { moduleId: string; moduleData: Partial<ModuleFormData> }) => {
      return trainingService.updateModule(moduleId, moduleData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-modules'] });
      toast.success('Módulo atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar módulo:', error);
      toast.error('Erro ao atualizar módulo. Tente novamente.');
    }
  });

  // Mutation para deletar módulo
  const deleteModuleMutation = useMutation({
    mutationFn: (moduleId: string) => {
      return trainingService.deleteModule(moduleId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['training-modules'] });
      toast.success('Módulo removido com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao remover módulo:', error);
      toast.error('Erro ao remover módulo. Tente novamente.');
    }
  });

  return {
    modules: modulesData?.data || [],
    total: modulesData?.total || 0,
    hasMore: modulesData?.has_more || false,
    isLoading,
    error,
    refetch,
    createModule: createModuleMutation.mutate,
    updateModule: updateModuleMutation.mutate,
    deleteModule: deleteModuleMutation.mutate,
    isCreating: createModuleMutation.isPending,
    isUpdating: updateModuleMutation.isPending,
    isDeleting: deleteModuleMutation.isPending
  };
}

// =====================================================
// HOOK PARA MÓDULO ESPECÍFICO
// =====================================================

export function useTrainingModule(moduleId: string) {
  const queryClient = useQueryClient();

  const {
    data: module,
    isLoading,
    error
  } = useQuery({
    queryKey: ['training-module', moduleId],
    queryFn: () => trainingService.getModuleById(moduleId),
    enabled: !!moduleId,
    staleTime: 5 * 60 * 1000
  });

  return {
    module,
    isLoading,
    error
  };
}

// =====================================================
// HOOK PARA CONTEÚDO DO MÓDULO
// =====================================================

export function useModuleContent(moduleId: string) {
  const queryClient = useQueryClient();

  // Query para buscar conteúdo
  const {
    data: content,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['module-content', moduleId],
    queryFn: () => trainingService.getModuleContent(moduleId),
    enabled: !!moduleId,
    staleTime: 5 * 60 * 1000
  });

  // Mutation para criar conteúdo
  const createContentMutation = useMutation({
    mutationFn: (contentData: ContentFormData) => {
      return trainingService.createContent(moduleId, contentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-content', moduleId] });
      toast.success('Conteúdo criado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar conteúdo:', error);
      toast.error('Erro ao criar conteúdo. Tente novamente.');
    }
  });

  // Mutation para atualizar conteúdo
  const updateContentMutation = useMutation({
    mutationFn: ({ contentId, contentData }: { contentId: string; contentData: Partial<ContentFormData> }) => {
      return trainingService.updateContent(contentId, contentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-content', moduleId] });
      toast.success('Conteúdo atualizado com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao atualizar conteúdo:', error);
      toast.error('Erro ao atualizar conteúdo. Tente novamente.');
    }
  });

  // Mutation para deletar conteúdo
  const deleteContentMutation = useMutation({
    mutationFn: (contentId: string) => {
      return trainingService.deleteContent(contentId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-content', moduleId] });
      toast.success('Conteúdo removido com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao remover conteúdo:', error);
      toast.error('Erro ao remover conteúdo. Tente novamente.');
    }
  });

  return {
    content: content || [],
    isLoading,
    error,
    refetch,
    createContent: createContentMutation.mutate,
    updateContent: updateContentMutation.mutate,
    deleteContent: deleteContentMutation.mutate,
    isCreating: createContentMutation.isPending,
    isUpdating: updateContentMutation.isPending,
    isDeleting: deleteContentMutation.isPending
  };
}

// =====================================================
// HOOK PARA UPLOAD DE VÍDEOS
// =====================================================

export function useVideoUpload() {
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const queryClient = useQueryClient();

  const uploadVideoMutation = useMutation({
    mutationFn: ({ file, contentId }: { file: File; contentId: string }) => {
      return trainingService.uploadVideo(file, contentId, setUploadProgress);
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['video-info', variables.contentId] });
      toast.success('Vídeo enviado com sucesso! Processamento iniciado.');
      setUploadProgress(0);
    },
    onError: (error) => {
      console.error('Erro ao fazer upload do vídeo:', error);
      toast.error('Erro ao enviar vídeo. Tente novamente.');
      setUploadProgress(0);
    }
  });

  return {
    uploadVideo: uploadVideoMutation.mutate,
    isUploading: uploadVideoMutation.isPending,
    uploadProgress,
    uploadError: uploadVideoMutation.error
  };
}

// =====================================================
// HOOK PARA INFORMAÇÕES DO VÍDEO
// =====================================================

export function useVideoInfo(contentId: string) {
  const {
    data: videoInfo,
    isLoading,
    error
  } = useQuery({
    queryKey: ['video-info', contentId],
    queryFn: () => trainingService.getVideoInfo(contentId),
    enabled: !!contentId,
    refetchInterval: (data) => {
      // Refetch a cada 5 segundos se o vídeo estiver processando
      return data?.processing_status === 'processing' ? 5000 : false;
    }
  });

  return {
    videoInfo,
    isLoading,
    error,
    isProcessing: videoInfo?.processing_status === 'processing',
    isReady: videoInfo?.processing_status === 'completed',
    hasFailed: videoInfo?.processing_status === 'failed'
  };
}

// =====================================================
// HOOK PARA PROGRESSO DO USUÁRIO
// =====================================================

export function useUserProgress(moduleId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Query para buscar progresso
  const {
    data: progressData,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['user-progress', user?.id, moduleId],
    queryFn: () => {
      if (!user?.id) throw new Error('User ID não encontrado');
      return trainingService.getUserProgress(user.id, moduleId);
    },
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000 // 2 minutos
  });

  // Mutation para atualizar progresso
  const updateProgressMutation = useMutation({
    mutationFn: ({ contentId, progressData }: {
      contentId: string;
      progressData: {
        progress_percentage?: number;
        time_spent?: number;
        last_position?: number;
        status?: 'not_started' | 'in_progress' | 'completed';
        notes?: string;
      }
    }) => {
      if (!user?.id) throw new Error('User ID não encontrado');
      return trainingService.updateProgress(user.id, contentId, progressData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-progress'] });
    },
    onError: (error) => {
      console.error('Erro ao atualizar progresso:', error);
    }
  });

  return {
    progressData,
    isLoading,
    error,
    refetch,
    updateProgress: updateProgressMutation.mutate,
    isUpdatingProgress: updateProgressMutation.isPending
  };
}

// =====================================================
// HOOK PARA AVALIAÇÕES
// =====================================================

export function useAssessments(moduleId: string) {
  const queryClient = useQueryClient();

  // Query para buscar avaliações
  const {
    data: assessments,
    isLoading,
    error,
    refetch
  } = useQuery({
    queryKey: ['module-assessments', moduleId],
    queryFn: () => trainingService.getModuleAssessments(moduleId),
    enabled: !!moduleId,
    staleTime: 5 * 60 * 1000
  });

  // Mutation para criar avaliação
  const createAssessmentMutation = useMutation({
    mutationFn: (assessmentData: AssessmentFormData) => {
      return trainingService.createAssessment(moduleId, assessmentData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['module-assessments', moduleId] });
      toast.success('Avaliação criada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao criar avaliação:', error);
      toast.error('Erro ao criar avaliação. Tente novamente.');
    }
  });

  return {
    assessments: assessments || [],
    isLoading,
    error,
    refetch,
    createAssessment: createAssessmentMutation.mutate,
    isCreating: createAssessmentMutation.isPending
  };
}

// =====================================================
// HOOK PARA SUBMISSÃO DE AVALIAÇÃO
// =====================================================

export function useAssessmentSubmission() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [submissionResult, setSubmissionResult] = useState<AssessmentResponse | null>(null);

  const submitAssessmentMutation = useMutation({
    mutationFn: ({ assessmentId, answers, timeSpent }: {
      assessmentId: string;
      answers: UserAnswer[];
      timeSpent: number;
    }) => {
      if (!user?.id) throw new Error('User ID não encontrado');
      return trainingService.submitAssessment(user.id, assessmentId, answers, timeSpent);
    },
    onSuccess: (data) => {
      setSubmissionResult(data);
      queryClient.invalidateQueries({ queryKey: ['user-progress'] });
      
      if (data.attempt.passed) {
        toast.success(`Parabéns! Você foi aprovado com ${data.attempt.percentage.toFixed(1)}%`);
      } else {
        toast.error(`Não foi dessa vez. Você obteve ${data.attempt.percentage.toFixed(1)}%`);
      }
    },
    onError: (error) => {
      console.error('Erro ao submeter avaliação:', error);
      toast.error('Erro ao submeter avaliação. Tente novamente.');
    }
  });

  const clearResult = useCallback(() => {
    setSubmissionResult(null);
  }, []);

  return {
    submitAssessment: submitAssessmentMutation.mutate,
    isSubmitting: submitAssessmentMutation.isPending,
    submissionResult,
    clearResult,
    submissionError: submitAssessmentMutation.error
  };
}

// =====================================================
// HOOK PARA RANKING E GAMIFICAÇÃO
// =====================================================

export function useGamification() {
  const { user } = useAuth();

  // Query para buscar ranking da empresa
  const {
    data: ranking,
    isLoading: isLoadingRanking,
    error: rankingError
  } = useQuery({
    queryKey: ['company-ranking', user?.company_id],
    queryFn: () => {
      if (!user?.company_id) throw new Error('Company ID não encontrado');
      return trainingService.getCompanyRanking(user.company_id);
    },
    enabled: !!user?.company_id,
    staleTime: 5 * 60 * 1000
  });

  // Encontrar posição do usuário atual
  const userPosition = useMemo(() => {
    if (!ranking || !user?.id) return null;
    return ranking.findIndex(item => item.user_id === user.id) + 1;
  }, [ranking, user?.id]);

  // Dados do usuário atual no ranking
  const userRankingData = useMemo(() => {
    if (!ranking || !user?.id) return null;
    return ranking.find(item => item.user_id === user.id);
  }, [ranking, user?.id]);

  return {
    ranking: ranking || [],
    userPosition,
    userRankingData,
    isLoadingRanking,
    rankingError
  };
}

// =====================================================
// HOOK PARA RELATÓRIOS
// =====================================================

export function useTrainingReports() {
  const { user } = useAuth();

  // Query para relatório da empresa
  const {
    data: companyReport,
    isLoading: isLoadingReport,
    error: reportError
  } = useQuery({
    queryKey: ['company-training-report', user?.company_id],
    queryFn: () => {
      if (!user?.company_id) throw new Error('Company ID não encontrado');
      return trainingService.getCompanyReport(user.company_id);
    },
    enabled: !!user?.company_id,
    staleTime: 10 * 60 * 1000 // 10 minutos
  });

  // Query para estatísticas de módulos
  const {
    data: moduleStats,
    isLoading: isLoadingStats,
    error: statsError
  } = useQuery({
    queryKey: ['module-statistics', user?.company_id],
    queryFn: () => {
      if (!user?.company_id) throw new Error('Company ID não encontrado');
      return trainingService.getModuleStatistics(user.company_id);
    },
    enabled: !!user?.company_id,
    staleTime: 10 * 60 * 1000
  });

  return {
    companyReport,
    moduleStats: moduleStats || [],
    isLoadingReport,
    isLoadingStats,
    reportError,
    statsError
  };
}

// =====================================================
// HOOK PARA FILTROS E BUSCA
// =====================================================

export function useTrainingFilters() {
  const [filters, setFilters] = useState<TrainingFilters>(() => ({
    category: undefined,
    difficulty: undefined,
    tags: [],
    search_term: '',
    date_range: undefined
  }));

  const updateFilters = useCallback((newFilters: Partial<TrainingFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
  }, []);

  const updateFilter = useCallback((key: keyof TrainingFilters, value: string | string[] | undefined) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      category: undefined,
      difficulty: undefined,
      tags: [],
      search_term: '',
      date_range: undefined
    });
  }, []);

  const hasActiveFilters = useMemo(() => {
    return !!(filters.category || 
             filters.difficulty || 
             filters.tags?.length || 
             filters.search_term || 
             filters.date_range);
  }, [filters.category, filters.difficulty, filters.tags?.length, filters.search_term, filters.date_range]);

  return {
    filters,
    updateFilters,
    updateFilter,
    clearFilters,
    hasActiveFilters
  };
}

// =====================================================
// HOOK PARA AVALIAÇÕES
// =====================================================

export function useTrainingAssessment(assessmentId: string) {
  const queryClient = useQueryClient();

  const {
    data: assessment,
    isLoading,
    error
  } = useQuery({
    queryKey: ['training-assessment', assessmentId],
    queryFn: () => trainingService.getAssessmentById(assessmentId),
    enabled: !!assessmentId,
    staleTime: 5 * 60 * 1000
  });

  // Mutation para submeter respostas
  const submitAssessmentMutation = useMutation({
    mutationFn: (answers: UserAnswer[]) => {
      return trainingService.submitAssessment(assessmentId, answers);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-progress'] });
      toast.success('Avaliação enviada com sucesso!');
    },
    onError: (error) => {
      console.error('Erro ao enviar avaliação:', error);
      toast.error('Erro ao enviar avaliação. Tente novamente.');
    }
  });

  return {
    data: assessment,
    isLoading,
    error,
    submitAssessment: submitAssessmentMutation.mutate,
    isSubmitting: submitAssessmentMutation.isPending
  };
}

// =====================================================
// HOOK PARA CERTIFICADOS
// =====================================================

export function useUserCertificate(certificateId: string) {
  const queryClient = useQueryClient();

  const {
    data: certificate,
    isLoading,
    error
  } = useQuery({
    queryKey: ['user-certificate', certificateId],
    queryFn: () => trainingService.getCertificateById(certificateId),
    enabled: !!certificateId,
    staleTime: 5 * 60 * 1000
  });

  return {
    certificate,
    isLoading,
    error
  };
}

// =====================================================
// HOOK PARA CONQUISTAS DO USUÁRIO
// =====================================================

export function useUserAchievements() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: achievements,
    isLoading,
    error
  } = useQuery({
    queryKey: ['user-achievements', user?.id],
    queryFn: () => {
      if (!user?.id) throw new Error('User ID não encontrado');
      return trainingService.getUserAchievements(user.id);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000
  });

  return {
    achievements: achievements || [],
    isLoading,
    error
  };
}

// =====================================================
// HOOK PARA ESTATÍSTICAS DO USUÁRIO
// =====================================================

export function useUserStats() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: stats,
    isLoading,
    error
  } = useQuery({
    queryKey: ['user-stats', user?.id],
    queryFn: () => {
      if (!user?.id) throw new Error('User ID não encontrado');
      return trainingService.getUserStats(user.id);
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000
  });

  return {
    stats,
    isLoading,
    error
  };
}

// =====================================================
// HOOK PARA ESTATÍSTICAS ADMINISTRATIVAS
// =====================================================

export function useAdminStats() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: adminStats,
    isLoading,
    error
  } = useQuery({
    queryKey: ['admin-stats', user?.company_id],
    queryFn: () => {
      if (!user?.company_id) throw new Error('Company ID não encontrado');
      return trainingService.getAdminStats(user.company_id);
    },
    enabled: !!user?.company_id,
    staleTime: 5 * 60 * 1000
  });

  return {
    adminStats,
    isLoading,
    error
  };
}

// =====================================================
// HOOK PARA RELATÓRIOS ADMINISTRATIVOS
// =====================================================

export function useAdminReports() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: adminReports,
    isLoading,
    error
  } = useQuery({
    queryKey: ['admin-reports', user?.company_id],
    queryFn: () => {
      if (!user?.company_id) throw new Error('Company ID não encontrado');
      return trainingService.getAdminReports(user.company_id);
    },
    enabled: !!user?.company_id,
    staleTime: 5 * 60 * 1000
  });

  return {
    adminReports,
    isLoading,
    error
  };
}

// =====================================================
// HOOK PARA PLAYER DE VÍDEO
// =====================================================

export function useVideoPlayer(contentId: string) {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [watchTime, setWatchTime] = useState(0);
  const { updateProgress } = useUserProgress();

  // Atualizar progresso a cada 10 segundos
  useEffect(() => {
    if (!isPlaying || !user?.id) return;

    const interval = setInterval(() => {
      setWatchTime(prev => prev + 1);
      
      const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;
      
      updateProgress({
        contentId,
        progressData: {
          progress_percentage: Math.min(progressPercentage, 100),
          time_spent: watchTime + 1,
          last_position: currentTime,
          status: progressPercentage >= 95 ? 'completed' : 'in_progress'
        }
      });
    }, 10000); // A cada 10 segundos

    return () => clearInterval(interval);
  }, [isPlaying, currentTime, duration, watchTime, contentId, updateProgress, user?.id]);

  const handleTimeUpdate = useCallback((time: number) => {
    setCurrentTime(time);
  }, []);

  const handleDurationChange = useCallback((duration: number) => {
    setDuration(duration);
  }, []);

  const handlePlayStateChange = useCallback((playing: boolean) => {
    setIsPlaying(playing);
  }, []);

  const handleVideoEnd = useCallback(() => {
    if (!user?.id) return;
    
    updateProgress({
      contentId,
      progressData: {
        progress_percentage: 100,
        time_spent: watchTime,
        last_position: duration,
        status: 'completed'
      }
    });
  }, [contentId, watchTime, duration, updateProgress, user?.id]);

  return {
    currentTime,
    duration,
    isPlaying,
    watchTime,
    progressPercentage: duration > 0 ? (currentTime / duration) * 100 : 0,
    handleTimeUpdate,
    handleDurationChange,
    handlePlayStateChange,
    handleVideoEnd
  };
}