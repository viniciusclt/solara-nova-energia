// =====================================================
// SERVIÇO PRINCIPAL DE TREINAMENTOS
// Sistema de Treinamentos Corporativos - Solara Nova Energia
// Versão: 1.0
// Data: 2024-12-12
// =====================================================

import { supabase } from '../../../integrations/supabase/client';
import type {
  TrainingModule,
  TrainingContent,
  TrainingVideo,
  TrainingAssessment,
  AssessmentQuestion,
  UserTrainingProgress,
  AssessmentAttempt,
  TrainingCertificate,
  GamificationPoints,
  UserRanking,
  TrainingNotification,
  ModuleFormData,
  ContentFormData,
  AssessmentFormData,
  PaginatedResponse,
  TrainingFilters,
  ProgressAnalytics,
  CompanyTrainingReport,
  ModuleStatistics,
  UserAnswer,
  AssessmentResponse,
  ProgressResponse
} from '../types';

// =====================================================
// CLASSE PRINCIPAL DO SERVIÇO
// =====================================================

export class TrainingService {
  private static instance: TrainingService;
  
  public static getInstance(): TrainingService {
    if (!TrainingService.instance) {
      TrainingService.instance = new TrainingService();
    }
    return TrainingService.instance;
  }

  // =====================================================
  // GESTÃO DE MÓDULOS
  // =====================================================

  /**
   * Busca módulos de treinamento com filtros e paginação
   */
  async getModules(
    companyId: string,
    filters?: TrainingFilters,
    page = 1,
    limit = 10
  ): Promise<PaginatedResponse<TrainingModule>> {
    try {
      let query = supabase
        .from('training_modules')
        .select('*', { count: 'exact' })
        .eq('company_id', companyId)
        .eq('is_active', true);

      // Aplicar filtros
      if (filters?.category) {
        query = query.eq('category', filters.category);
      }
      if (filters?.difficulty) {
        query = query.eq('difficulty_level', filters.difficulty);
      }
      if (filters?.tags && filters.tags.length > 0) {
        query = query.overlaps('tags', filters.tags);
      }
      if (filters?.search_term) {
        query = query.or(`title.ilike.%${filters.search_term}%,description.ilike.%${filters.search_term}%`);
      }

      // Paginação
      const offset = (page - 1) * limit;
      query = query.range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      return {
        data: data || [],
        total: count || 0,
        page,
        limit,
        has_more: (count || 0) > page * limit
      };
    } catch (error) {
      console.error('Erro ao buscar módulos:', error);
      throw error;
    }
  }

  /**
   * Busca um módulo específico por ID
   */
  async getModuleById(moduleId: string): Promise<TrainingModule | null> {
    try {
      const { data, error } = await supabase
        .from('training_modules')
        .select('*')
        .eq('id', moduleId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar módulo:', error);
      return null;
    }
  }

  /**
   * Cria um novo módulo de treinamento
   */
  async createModule(
    companyId: string,
    moduleData: ModuleFormData,
    userId: string
  ): Promise<TrainingModule> {
    try {
      const { data, error } = await supabase
        .from('training_modules')
        .insert({
          company_id: companyId,
          created_by: userId,
          ...moduleData
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao criar módulo:', error);
      throw error;
    }
  }

  /**
   * Atualiza um módulo existente
   */
  async updateModule(
    moduleId: string,
    moduleData: Partial<ModuleFormData>
  ): Promise<TrainingModule> {
    try {
      const { data, error } = await supabase
        .from('training_modules')
        .update({
          ...moduleData,
          updated_at: new Date().toISOString()
        })
        .eq('id', moduleId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar módulo:', error);
      throw error;
    }
  }

  /**
   * Remove um módulo (soft delete)
   */
  async deleteModule(moduleId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('training_modules')
        .update({ is_active: false })
        .eq('id', moduleId);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao remover módulo:', error);
      throw error;
    }
  }

  // =====================================================
  // GESTÃO DE CONTEÚDO
  // =====================================================

  /**
   * Busca conteúdo de um módulo
   */
  async getModuleContent(moduleId: string): Promise<TrainingContent[]> {
    try {
      const { data, error } = await supabase
        .from('training_content')
        .select('*')
        .eq('module_id', moduleId)
        .order('content_order');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar conteúdo:', error);
      return [];
    }
  }

  /**
   * Cria novo conteúdo para um módulo
   */
  async createContent(
    moduleId: string,
    contentData: ContentFormData
  ): Promise<TrainingContent> {
    try {
      const { data, error } = await supabase
        .from('training_content')
        .insert({
          module_id: moduleId,
          ...contentData
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao criar conteúdo:', error);
      throw error;
    }
  }

  /**
   * Atualiza conteúdo existente
   */
  async updateContent(
    contentId: string,
    contentData: Partial<ContentFormData>
  ): Promise<TrainingContent> {
    try {
      const { data, error } = await supabase
        .from('training_content')
        .update({
          ...contentData,
          updated_at: new Date().toISOString()
        })
        .eq('id', contentId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar conteúdo:', error);
      throw error;
    }
  }

  /**
   * Remove conteúdo
   */
  async deleteContent(contentId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('training_content')
        .delete()
        .eq('id', contentId);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao remover conteúdo:', error);
      throw error;
    }
  }

  // =====================================================
  // GESTÃO DE VÍDEOS
  // =====================================================

  /**
   * Faz upload de vídeo
   */
  async uploadVideo(
    file: File,
    contentId: string,
    onProgress?: (progress: number) => void
  ): Promise<TrainingVideo> {
    try {
      // Upload do arquivo para o storage
      const fileName = `${contentId}/${Date.now()}_${file.name}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('training-videos')
        .upload(fileName, file, {
          onUploadProgress: (progress) => {
            if (onProgress) {
              onProgress((progress.loaded / progress.total) * 100);
            }
          }
        });

      if (uploadError) throw uploadError;

      // Criar registro do vídeo
      const { data, error } = await supabase
        .from('training_videos')
        .insert({
          content_id: contentId,
          original_filename: file.name,
          file_path: uploadData.path,
          file_size: file.size,
          processing_status: 'pending'
        })
        .select()
        .single();

      if (error) throw error;

      // Iniciar processamento do vídeo (Edge Function)
      await this.processVideo(data.id);

      return data;
    } catch (error) {
      console.error('Erro ao fazer upload do vídeo:', error);
      throw error;
    }
  }

  /**
   * Processa vídeo (chamada para Edge Function)
   */
  private async processVideo(videoId: string): Promise<void> {
    try {
      const { error } = await supabase.functions.invoke('process-video', {
        body: { videoId }
      });

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao processar vídeo:', error);
      // Atualizar status para failed
      await supabase
        .from('training_videos')
        .update({ processing_status: 'failed' })
        .eq('id', videoId);
    }
  }

  /**
   * Busca informações do vídeo
   */
  async getVideoInfo(contentId: string): Promise<TrainingVideo | null> {
    try {
      const { data, error } = await supabase
        .from('training_videos')
        .select('*')
        .eq('content_id', contentId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar informações do vídeo:', error);
      return null;
    }
  }

  /**
   * Gera URL segura para streaming
   */
  async getSecureVideoUrl(
    videoId: string,
    userId: string,
    expiresIn = 3600
  ): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('generate-video-url', {
        body: { videoId, userId, expiresIn }
      });

      if (error) throw error;
      return data.url;
    } catch (error) {
      console.error('Erro ao gerar URL do vídeo:', error);
      throw error;
    }
  }

  // =====================================================
  // PROGRESSO DO USUÁRIO
  // =====================================================

  /**
   * Busca progresso do usuário
   */
  async getUserProgress(
    userId: string,
    moduleId?: string
  ): Promise<ProgressResponse> {
    try {
      // Buscar progresso do usuário
      const progressQuery = supabase
        .from('user_training_progress')
        .select('*')
        .eq('user_id', userId);

      const { data: progressData, error: progressError } = await progressQuery;
      if (progressError) throw progressError;

      // Buscar conteúdos relacionados
      const contentIds = progressData?.map(p => p.content_id) || [];
      let enrichedProgress = [];

      if (contentIds.length > 0) {
        const { data: contentData, error: contentError } = await supabase
          .from('training_content')
          .select(`
            *,
            training_modules(*)
          `)
          .in('id', contentIds);

        if (contentError) throw contentError;

        // Combinar dados de progresso com conteúdo
        enrichedProgress = progressData.map(progress => {
          const content = contentData?.find(c => c.id === progress.content_id);
          return {
            ...progress,
            training_content: content
          };
        });

        // Filtrar por módulo se especificado
        if (moduleId) {
          enrichedProgress = enrichedProgress.filter(p => 
            p.training_content?.module_id === moduleId
          );
        }
      }

      // Processar dados para retornar estrutura organizada
      const moduleProgress = this.processProgressData(enrichedProgress);
      const overallStats = await this.calculateOverallStats(userId);
      const recentActivity = await this.getRecentActivity(userId);
      const upcomingDeadlines = await this.getUpcomingDeadlines(userId);

      return {
        module_progress: moduleProgress,
        overall_stats: overallStats,
        recent_activity: recentActivity,
        upcoming_deadlines: upcomingDeadlines
      };
    } catch (error) {
      console.error('Erro ao buscar progresso:', error);
      throw error;
    }
  }

  /**
   * Atualiza progresso do usuário
   */
  async updateProgress(
    userId: string,
    contentId: string,
    progressData: {
      progress_percentage?: number;
      time_spent?: number;
      last_position?: number;
      status?: 'not_started' | 'in_progress' | 'completed';
      notes?: string;
    }
  ): Promise<UserTrainingProgress> {
    try {
      const { data, error } = await supabase
        .from('user_training_progress')
        .upsert({
          user_id: userId,
          content_id: contentId,
          module_id: await this.getModuleIdFromContent(contentId),
          ...progressData,
          updated_at: new Date().toISOString(),
          ...(progressData.status === 'completed' && !progressData.progress_percentage ? 
            { completed_at: new Date().toISOString() } : {}),
          ...(progressData.status === 'in_progress' && !await this.hasStarted(userId, contentId) ? 
            { started_at: new Date().toISOString() } : {})
        })
        .select()
        .single();

      if (error) throw error;

      // Verificar se módulo foi completado e atualizar pontos
      if (progressData.status === 'completed') {
        await this.checkModuleCompletion(userId, contentId);
      }

      return data;
    } catch (error) {
      console.error('Erro ao atualizar progresso:', error);
      throw error;
    }
  }

  // =====================================================
  // SISTEMA DE AVALIAÇÕES
  // =====================================================

  /**
   * Busca avaliações de um módulo
   */
  async getModuleAssessments(moduleId: string): Promise<TrainingAssessment[]> {
    try {
      const { data, error } = await supabase
        .from('training_assessments')
        .select(`
          *,
          assessment_questions(*)
        `)
        .eq('module_id', moduleId)
        .eq('is_active', true)
        .order('assessment_order');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar avaliações:', error);
      return [];
    }
  }

  /**
   * Cria nova avaliação
   */
  async createAssessment(
    moduleId: string,
    assessmentData: AssessmentFormData
  ): Promise<TrainingAssessment> {
    try {
      const { questions, ...assessmentInfo } = assessmentData;

      // Criar avaliação
      const { data: assessment, error: assessmentError } = await supabase
        .from('training_assessments')
        .insert({
          module_id: moduleId,
          ...assessmentInfo
        })
        .select()
        .single();

      if (assessmentError) throw assessmentError;

      // Criar questões
      if (questions && questions.length > 0) {
        const questionsData = questions.map((q, index) => ({
          assessment_id: assessment.id,
          question_order: index + 1,
          ...q
        }));

        const { error: questionsError } = await supabase
          .from('assessment_questions')
          .insert(questionsData);

        if (questionsError) throw questionsError;
      }

      return assessment;
    } catch (error) {
      console.error('Erro ao criar avaliação:', error);
      throw error;
    }
  }

  /**
   * Submete tentativa de avaliação
   */
  async submitAssessment(
    userId: string,
    assessmentId: string,
    answers: UserAnswer[],
    timeSpent: number
  ): Promise<AssessmentResponse> {
    try {
      // Buscar avaliação e questões
      const { data: assessment, error: assessmentError } = await supabase
        .from('training_assessments')
        .select(`
          *,
          assessment_questions(*)
        `)
        .eq('id', assessmentId)
        .single();

      if (assessmentError) throw assessmentError;

      // Calcular pontuação
      const results = this.calculateAssessmentScore(assessment.assessment_questions, answers);
      const totalPoints = results.reduce((sum, r) => sum + r.points_earned, 0);
      const maxPoints = assessment.assessment_questions.reduce((sum, q) => sum + q.points, 0);
      const percentage = (totalPoints / maxPoints) * 100;
      const passed = percentage >= assessment.passing_score;

      // Buscar número da tentativa
      const { count } = await supabase
        .from('assessment_attempts')
        .select('*', { count: 'exact' })
        .eq('user_id', userId)
        .eq('assessment_id', assessmentId);

      const attemptNumber = (count || 0) + 1;

      // Salvar tentativa
      const { data: attempt, error: attemptError } = await supabase
        .from('assessment_attempts')
        .insert({
          user_id: userId,
          assessment_id: assessmentId,
          attempt_number: attemptNumber,
          answers: answers.reduce((acc, answer) => {
            acc[answer.question_id] = answer.answer;
            return acc;
          }, {} as Record<string, string | string[] | number | boolean>),
          score: totalPoints,
          percentage,
          passed,
          time_taken: timeSpent,
          completed_at: new Date().toISOString(),
          feedback: results.reduce((acc, result) => {
            acc[result.question_id] = {
              is_correct: result.is_correct,
              points_earned: result.points_earned,
              explanation: result.explanation
            };
            return acc;
          }, {} as Record<string, {is_correct: boolean; points_earned: number; explanation?: string}>)
        })
        .select()
        .single();

      if (attemptError) throw attemptError;

      // Gerar certificado se passou
      let certificate = null;
      if (passed) {
        certificate = await this.generateCertificateInternal(userId, assessment.module_id, percentage);
        await this.awardPoints(userId, 'assessment_passed', assessmentId, 100);
        
        if (percentage === 100) {
          await this.awardPoints(userId, 'perfect_score', assessmentId, 200);
        }
      }

      return {
        attempt,
        results,
        certificate,
        next_attempt_available: attemptNumber < assessment.max_attempts ? 
          new Date().toISOString() : undefined
      };
    } catch (error) {
      console.error('Erro ao submeter avaliação:', error);
      throw error;
    }
  }

  // =====================================================
  // SISTEMA DE GAMIFICAÇÃO
  // =====================================================

  /**
   * Concede pontos ao usuário
   */
  async awardPoints(
    userId: string,
    actionType: string,
    referenceId: string,
    points: number,
    multiplier = 1
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('gamification_points')
        .insert({
          user_id: userId,
          action_type: actionType,
          points: points * multiplier,
          reference_id: referenceId,
          multiplier,
          description: this.getActionDescription(actionType)
        });

      if (error) throw error;

      // Verificar badges
      await this.checkBadgeEligibility(userId);
    } catch (error) {
      console.error('Erro ao conceder pontos:', error);
    }
  }

  /**
   * Busca ranking da empresa
   */
  async getCompanyRanking(
    companyId: string,
    limit = 10
  ): Promise<UserRanking[]> {
    try {
      const { data, error } = await supabase
        .from('user_rankings')
        .select(`
          *,
          profiles!inner(full_name, avatar_url)
        `)
        .eq('company_id', companyId)
        .order('total_points', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar ranking:', error);
      return [];
    }
  }

  // =====================================================
  // RELATÓRIOS E ANALYTICS
  // =====================================================

  /**
   * Gera relatório da empresa
   */
  async getCompanyReport(companyId: string): Promise<CompanyTrainingReport> {
    try {
      const { data, error } = await supabase
        .rpc('get_company_training_report', {
          p_company_id: companyId
        });

      if (error) throw error;
      return data[0];
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      throw error;
    }
  }

  /**
   * Busca estatísticas de módulos
   */
  async getModuleStatistics(companyId: string): Promise<ModuleStatistics[]> {
    try {
      const { data, error } = await supabase
        .from('module_statistics')
        .select('*')
        .eq('company_id', companyId);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar estatísticas:', error);
      return [];
    }
  }

  // =====================================================
  // MÉTODOS PARA DIAGRAMAS
  // =====================================================

  /**
   * Busca diagramas de treinamento
   */
  async getDiagrams(): Promise<TrainingDiagram[]> {
    try {
      const { data, error } = await supabase
        .from('training_diagrams')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar diagramas:', error);
      return [];
    }
  }

  /**
   * Busca um diagrama específico
   */
  async getDiagram(id: string): Promise<TrainingDiagram | null> {
    try {
      const { data, error } = await supabase
        .from('training_diagrams')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar diagrama:', error);
      return null;
    }
  }

  /**
   * Cria um novo diagrama
   */
  async createDiagram(diagram: Omit<TrainingDiagram, 'id' | 'created_at' | 'updated_at'>): Promise<TrainingDiagram> {
    try {
      const { data, error } = await supabase
        .from('training_diagrams')
        .insert({
          ...diagram,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao criar diagrama:', error);
      throw error;
    }
  }

  /**
   * Atualiza um diagrama existente
   */
  async updateDiagram(id: string, updates: Partial<TrainingDiagram>): Promise<TrainingDiagram> {
    try {
      const { data, error } = await supabase
        .from('training_diagrams')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao atualizar diagrama:', error);
      throw error;
    }
  }

  /**
   * Remove um diagrama
   */
  async deleteDiagram(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('training_diagrams')
        .delete()
        .eq('id', id);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao remover diagrama:', error);
      throw error;
    }
  }

  // =====================================================
  // MÉTODOS PARA UPLOAD DE ARQUIVOS
  // =====================================================

  /**
   * Faz upload de arquivo para o storage
   */
  async uploadFile(file: File, path: string): Promise<{ url: string; path: string }> {
    try {
      const fileName = `${Date.now()}-${file.name}`;
      const filePath = `${path}/${fileName}`;

      const { data, error } = await supabase.storage
        .from('training-files')
        .upload(filePath, file);

      if (error) throw error;

      const { data: urlData } = supabase.storage
        .from('training-files')
        .getPublicUrl(filePath);

      return {
        url: urlData.publicUrl,
        path: filePath
      };
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      throw error;
    }
  }

  /**
   * Remove arquivo do storage
   */
  async deleteFile(path: string): Promise<void> {
    try {
      const { error } = await supabase.storage
        .from('training-files')
        .remove([path]);

      if (error) throw error;
    } catch (error) {
      console.error('Erro ao remover arquivo:', error);
      throw error;
    }
  }

  // =====================================================
  // MÉTODOS PARA PLAYBOOKS
  // =====================================================

  /**
   * Busca playbooks de treinamento
   */
  async getPlaybooks(): Promise<TrainingPlaybook[]> {
    try {
      const { data, error } = await supabase
        .from('training_playbooks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Erro ao buscar playbooks:', error);
      return [];
    }
  }

  /**
   * Busca um playbook específico
   */
  async getPlaybook(id: string): Promise<TrainingPlaybook | null> {
    try {
      const { data, error } = await supabase
        .from('training_playbooks')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Erro ao buscar playbook:', error);
      return null;
    }
  }

  // =====================================================
  // MÉTODOS AUXILIARES PRIVADOS
  // =====================================================

  private processProgressData(data: UserTrainingProgress[]): ModuleProgress[] {
    // Processar dados de progresso para estrutura organizada
    const moduleMap = new Map();
    
    data.forEach(item => {
      const moduleId = item.training_content.module_id;
      if (!moduleMap.has(moduleId)) {
        moduleMap.set(moduleId, {
          module_id: moduleId,
          user_id: item.user_id,
          module_info: item.training_content.training_modules,
          content_progress: []
        });
      }
      moduleMap.get(moduleId).content_progress.push(item);
    });
    
    return Array.from(moduleMap.values());
  }

  private async calculateOverallStats(userId: string): Promise<ProgressAnalytics> {
    // Implementar cálculo de estatísticas gerais
    const { data, error } = await supabase
      .from('user_training_overview')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      return {
        user_id: userId,
        total_modules: 0,
        completed_modules: 0,
        in_progress_modules: 0,
        total_time_spent: 0,
        average_score: 0,
        completion_rate: 0,
        streak_days: 0,
        last_activity: new Date().toISOString()
      };
    }

    return {
      user_id: userId,
      total_modules: data.modules_completed || 0,
      completed_modules: data.modules_completed || 0,
      in_progress_modules: 0,
      total_time_spent: 0,
      average_score: 0,
      completion_rate: 0,
      streak_days: data.current_streak || 0,
      last_activity: new Date().toISOString()
    };
  }

  private async getRecentActivity(userId: string): Promise<RecentActivity[]> {
    // Implementar busca de atividade recente
    return [];
  }

  private async getUpcomingDeadlines(userId: string): Promise<UpcomingDeadline[]> {
    // Implementar busca de prazos próximos
    return [];
  }

  private async getModuleIdFromContent(contentId: string): Promise<string> {
    const { data } = await supabase
      .from('training_content')
      .select('module_id')
      .eq('id', contentId)
      .single();
    
    return data?.module_id || '';
  }

  private async hasStarted(userId: string, contentId: string): Promise<boolean> {
    const { data } = await supabase
      .from('user_training_progress')
      .select('started_at')
      .eq('user_id', userId)
      .eq('content_id', contentId)
      .single();
    
    return !!data?.started_at;
  }

  private async checkModuleCompletion(userId: string, contentId: string): Promise<void> {
    // Verificar se módulo foi completado e conceder pontos
    const moduleId = await this.getModuleIdFromContent(contentId);
    const progress = await this.getUserProgress(userId, moduleId);
    
    // Lógica para verificar conclusão do módulo
    // Se completado, conceder pontos
  }

  private calculateAssessmentScore(questions: AssessmentQuestion[], answers: UserAnswer[]): Array<{question_id: string; is_correct: boolean; points_earned: number; explanation?: string}> {
    return questions.map(question => {
      const userAnswer = answers.find(a => a.question_id === question.id);
      const isCorrect = this.isAnswerCorrect(question, userAnswer?.answer);
      
      return {
        question_id: question.id,
        is_correct: isCorrect,
        points_earned: isCorrect ? question.points : 0,
        explanation: question.explanation
      };
    });
  }

  private isAnswerCorrect(question: AssessmentQuestion, userAnswer: string | string[] | number | boolean | undefined): boolean {
    // Implementar lógica de verificação baseada no tipo de questão
    switch (question.question_type) {
      case 'multiple_choice':
        return JSON.stringify(userAnswer) === JSON.stringify(question.correct_answer);
      case 'true_false':
        return userAnswer === question.correct_answer;
      case 'essay':
        // Para dissertativas, sempre retorna true (avaliação manual)
        return true;
      default:
        return false;
    }
  }

  /**
   * Gera certificado público para um usuário
   */
  async generateCertificate(
    userId: string,
    moduleId: string
  ): Promise<TrainingCertificate> {
    const certificateNumber = `CERT-${Date.now()}-${userId.slice(-6)}`;
    const verificationCode = Math.random().toString(36).substring(2, 15);

    const { data, error } = await supabase
      .from('training_certificates')
      .insert({
        user_id: userId,
        module_id: moduleId,
        certificate_number: certificateNumber,
        verification_code: verificationCode,
        issued_at: new Date().toISOString(),
        is_valid: true,
        certificate_data: {
          user_name: '',
          course_title: '',
          completion_date: new Date().toISOString(),
          company_name: 'Solara Nova Energia'
        }
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private async generateCertificateInternal(
    userId: string,
    moduleId: string,
    score: number
  ): Promise<TrainingCertificate> {
    const certificateNumber = `CERT-${Date.now()}-${userId.slice(-6)}`;
    const verificationCode = Math.random().toString(36).substring(2, 15);

    const { data, error } = await supabase
      .from('training_certificates')
      .insert({
        user_id: userId,
        module_id: moduleId,
        certificate_number: certificateNumber,
        verification_code: verificationCode,
        certificate_data: {
          score,
          issued_date: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  private async checkBadgeEligibility(userId: string): Promise<void> {
    // Implementar verificação de elegibilidade para badges
    // Buscar badges disponíveis e verificar critérios
  }

  private getActionDescription(actionType: string): string {
    const descriptions: Record<string, string> = {
      'video_completed': 'Vídeo assistido completamente',
      'assessment_passed': 'Avaliação aprovada',
      'perfect_score': 'Pontuação perfeita na avaliação',
      'module_completed': 'Módulo de treinamento concluído',
      'daily_login': 'Login diário',
      'streak_bonus': 'Bônus de sequência de estudos'
    };
    
    return descriptions[actionType] || 'Ação de treinamento';
  }
}

// =====================================================
// INSTÂNCIA SINGLETON
// =====================================================

export const trainingService = TrainingService.getInstance();
export default trainingService;