import { supabase } from '@/integrations/supabase/client';
import { 
  TrainingModule, 
  TrainingVideo, 
  TrainingPlaybook, 
  TrainingDiagram, 
  TrainingAssessment,
  UserProgress,
  AssessmentResult,
  Certificate,
  ModuleWithContent,
  UserAnswer
} from '@/types/training';

export class TrainingService {
  // Módulos de Treinamento
  static async getModules(): Promise<TrainingModule[]> {
    const { data, error } = await supabase
      .from('training_modules')
      .select('*')
      .eq('is_active', true)
      .order('order_index');

    if (error) throw error;
    return data || [];
  }

  static async getModuleById(id: string): Promise<ModuleWithContent | null> {
    const { data: module, error: moduleError } = await supabase
      .from('training_modules')
      .select('*')
      .eq('id', id)
      .single();

    if (moduleError) throw moduleError;
    if (!module) return null;

    // Buscar conteúdo do módulo
    const [videos, playbooks, diagrams, assessments] = await Promise.all([
      this.getVideosByModule(id),
      this.getPlaybooksByModule(id),
      this.getDiagramsByModule(id),
      this.getAssessmentsByModule(id)
    ]);

    return {
      ...module,
      videos,
      playbooks,
      diagrams,
      assessments
    };
  }

  static async createModule(module: Omit<TrainingModule, 'id' | 'created_at' | 'updated_at'>): Promise<TrainingModule> {
    const { data, error } = await supabase
      .from('training_modules')
      .insert(module)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateModule(id: string, updates: Partial<TrainingModule>): Promise<TrainingModule> {
    const { data, error } = await supabase
      .from('training_modules')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteModule(id: string): Promise<void> {
    const { error } = await supabase
      .from('training_modules')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Vídeos
  static async getVideosByModule(moduleId: string): Promise<TrainingVideo[]> {
    const { data, error } = await supabase
      .from('training_videos')
      .select('*')
      .eq('module_id', moduleId)
      .order('order_index');

    if (error) throw error;
    return data || [];
  }

  static async createVideo(video: Omit<TrainingVideo, 'id' | 'created_at'>): Promise<TrainingVideo> {
    const { data, error } = await supabase
      .from('training_videos')
      .insert(video)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateVideo(id: string, updates: Partial<TrainingVideo>): Promise<TrainingVideo> {
    const { data, error } = await supabase
      .from('training_videos')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async deleteVideo(id: string): Promise<void> {
    const { error } = await supabase
      .from('training_videos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  // Playbooks
  static async getPlaybooksByModule(moduleId: string): Promise<TrainingPlaybook[]> {
    const { data, error } = await supabase
      .from('training_playbooks')
      .select('*')
      .eq('module_id', moduleId)
      .order('order_index');

    if (error) throw error;
    return data || [];
  }

  static async createPlaybook(playbook: Omit<TrainingPlaybook, 'id' | 'created_at'>): Promise<TrainingPlaybook> {
    const { data, error } = await supabase
      .from('training_playbooks')
      .insert(playbook)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Diagramas
  static async getDiagramsByModule(moduleId: string): Promise<TrainingDiagram[]> {
    const { data, error } = await supabase
      .from('training_diagrams')
      .select('*')
      .eq('module_id', moduleId)
      .order('order_index');

    if (error) throw error;
    return data || [];
  }

  static async createDiagram(diagram: Omit<TrainingDiagram, 'id' | 'created_at' | 'updated_at'>): Promise<TrainingDiagram> {
    const { data, error } = await supabase
      .from('training_diagrams')
      .insert(diagram)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updateDiagram(id: string, updates: Partial<TrainingDiagram>): Promise<TrainingDiagram> {
    const { data, error } = await supabase
      .from('training_diagrams')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Avaliações
  static async getAssessmentsByModule(moduleId: string): Promise<TrainingAssessment[]> {
    const { data, error } = await supabase
      .from('training_assessments')
      .select('*')
      .eq('module_id', moduleId)
      .order('order_index');

    if (error) throw error;
    return data || [];
  }

  static async createAssessment(assessment: Omit<TrainingAssessment, 'id' | 'created_at'>): Promise<TrainingAssessment> {
    const { data, error } = await supabase
      .from('training_assessments')
      .insert(assessment)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Progresso do Usuário
  static async getUserProgress(userId: string, moduleId?: string): Promise<UserProgress[]> {
    let query = supabase
      .from('user_progress')
      .select('*')
      .eq('user_id', userId);

    if (moduleId) {
      query = query.eq('module_id', moduleId);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  }

  static async updateVideoProgress(
    userId: string, 
    videoId: string, 
    progressPercentage: number, 
    watchTimeSeconds: number
  ): Promise<UserProgress> {
    const { data, error } = await supabase
      .from('user_progress')
      .upsert({
        user_id: userId,
        video_id: videoId,
        progress_percentage: progressPercentage,
        watch_time_seconds: watchTimeSeconds,
        last_watched_at: new Date().toISOString(),
        completed_at: progressPercentage >= 100 ? new Date().toISOString() : null
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  // Resultados de Avaliação
  static async submitAssessment(
    userId: string,
    assessmentId: string,
    answers: UserAnswer[],
    timeTakenMinutes: number
  ): Promise<AssessmentResult> {
    // Buscar a avaliação para calcular a pontuação
    const { data: assessment, error: assessmentError } = await supabase
      .from('training_assessments')
      .select('*')
      .eq('id', assessmentId)
      .single();

    if (assessmentError) throw assessmentError;

    // Calcular pontuação
    let score = 0;
    const totalQuestions = assessment.questions.length;

    assessment.questions.forEach((question: AssessmentQuestion) => {
      const userAnswer = answers.find(a => a.question_id === question.id);
      if (userAnswer && userAnswer.answer === question.correct_answer) {
        score += question.points;
      }
    });

    const { data, error } = await supabase
      .from('assessment_results')
      .insert({
        user_id: userId,
        assessment_id: assessmentId,
        score,
        total_questions: totalQuestions,
        answers,
        time_taken_minutes: timeTakenMinutes
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getUserAssessmentResults(userId: string, assessmentId?: string): Promise<AssessmentResult[]> {
    let query = supabase
      .from('assessment_results')
      .select('*')
      .eq('user_id', userId);

    if (assessmentId) {
      query = query.eq('assessment_id', assessmentId);
    }

    const { data, error } = await query.order('completed_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Certificados
  static async generateCertificate(userId: string, moduleId: string): Promise<Certificate> {
    const certificateNumber = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    const { data, error } = await supabase
      .from('certificates')
      .insert({
        user_id: userId,
        module_id: moduleId,
        certificate_number: certificateNumber
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async getUserCertificates(userId: string): Promise<Certificate[]> {
    const { data, error } = await supabase
      .from('certificates')
      .select(`
        *,
        training_modules (
          title,
          description
        )
      `)
      .eq('user_id', userId)
      .order('issued_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Upload de arquivos
  static async uploadFile(file: File, path: string): Promise<string> {
    const { data, error } = await supabase.storage
      .from('training-content')
      .upload(path, file);

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from('training-content')
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  }

  static async deleteFile(path: string): Promise<void> {
    const { error } = await supabase.storage
      .from('training-content')
      .remove([path]);

    if (error) throw error;
  }
}

