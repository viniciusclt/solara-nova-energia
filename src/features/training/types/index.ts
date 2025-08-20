// =====================================================
// TIPOS TYPESCRIPT - MÓDULO DE TREINAMENTOS
// Sistema de Treinamentos Corporativos - Solara Nova Energia
// Versão: 1.0
// Data: 2024-12-12
// =====================================================

// =====================================================
// TIPOS BASE
// =====================================================

export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';
export type ContentType = 'video' | 'pdf' | 'playbook' | 'diagram' | 'assessment' | 'text';
export type ProgressStatus = 'not_started' | 'in_progress' | 'completed' | 'skipped';
export type ProcessingStatus = 'pending' | 'processing' | 'completed' | 'failed';
export type QuestionType = 'multiple_choice' | 'true_false' | 'essay' | 'fill_blank';
export type NotificationType = 'reminder' | 'achievement' | 'deadline' | 'new_content' | 'certificate';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';
export type BadgeRarity = 'common' | 'rare' | 'epic' | 'legendary';
export type QuestionDifficulty = 'easy' | 'medium' | 'hard';

// =====================================================
// INTERFACES PRINCIPAIS
// =====================================================

// Módulo de Treinamento
export interface TrainingModule {
  id: string;
  company_id: string;
  title: string;
  description?: string;
  category?: string;
  difficulty_level?: DifficultyLevel;
  estimated_duration?: number; // em minutos
  required_roles: string[];
  optional_roles: string[];
  is_mandatory: boolean;
  is_active: boolean;
  created_by?: string;
  created_at: string;
  updated_at: string;
  version: number;
  tags: string[];
  thumbnail_url?: string;
  prerequisites: string[]; // IDs de módulos pré-requisitos
  completion_criteria: CompletionCriteria;
}

// Critérios de Conclusão
export interface CompletionCriteria {
  require_all_content?: boolean;
  require_assessment_pass?: boolean;
  minimum_score?: number;
  time_limit?: number; // em dias
  allow_retries?: boolean;
}

// Conteúdo de Treinamento
export interface TrainingContent {
  id: string;
  module_id: string;
  type: ContentType;
  title: string;
  content_order: number;
  content_data: Record<string, unknown>;
  file_url?: string;
  file_size?: number;
  duration?: number; // em segundos
  is_required: boolean;
  created_at: string;
  updated_at: string;
  version: number;
}

// Vídeo de Treinamento
export interface TrainingVideo {
  id: string;
  content_id: string;
  original_filename?: string;
  file_path: string;
  file_size?: number;
  duration?: number;
  resolution?: string;
  format?: string;
  thumbnail_url?: string;
  watermark_settings: WatermarkSettings;
  security_settings: SecuritySettings;
  processing_status: ProcessingStatus;
  hls_playlist_url?: string;
  quality_variants: QualityVariant[];
  created_at: string;
  updated_at: string;
}

// Configurações de Watermark
export interface WatermarkSettings {
  enabled: boolean;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  opacity: number;
  text: string;
  font_size?: number;
  color?: string;
}

// Configurações de Segurança
export interface SecuritySettings {
  domain_restriction: boolean;
  download_prevention: boolean;
  right_click_disabled: boolean;
  allowed_domains?: string[];
  token_expiry?: number; // em horas
}

// Variantes de Qualidade
export interface QualityVariant {
  resolution: string;
  bitrate: string;
  url: string;
  file_size: number;
}

// =====================================================
// SISTEMA DE AVALIAÇÕES
// =====================================================

// Avaliação
export interface TrainingAssessment {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  passing_score: number;
  time_limit?: number; // em minutos
  max_attempts: number;
  randomize_questions: boolean;
  show_results_immediately: boolean;
  certificate_template_id?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  assessment_order: number;
  questions?: AssessmentQuestion[];
}

// Questão de Avaliação
export interface AssessmentQuestion {
  id: string;
  assessment_id: string;
  question_text: string;
  question_type: QuestionType;
  options: QuestionOption[];
  correct_answer: string | string[] | number | boolean;
  points: number;
  explanation?: string;
  question_order?: number;
  difficulty: QuestionDifficulty;
  created_at: string;
}

// Opção de Questão
export interface QuestionOption {
  id: string;
  text: string;
  is_correct?: boolean;
}

// Tentativa de Avaliação
export interface AssessmentAttempt {
  id: string;
  user_id: string;
  assessment_id: string;
  attempt_number: number;
  answers: Record<string, string | string[] | number | boolean>;
  score?: number;
  percentage?: number;
  passed?: boolean;
  time_taken?: number;
  started_at: string;
  completed_at?: string;
  feedback: Record<string, string>;
}

// Resposta do Usuário
export interface UserAnswer {
  question_id: string;
  answer: string | string[] | number | boolean;
  is_correct?: boolean;
  points_earned?: number;
  time_spent?: number;
}

// =====================================================
// PROGRESSO E TRACKING
// =====================================================

// Progresso do Usuário
export interface UserTrainingProgress {
  id: string;
  user_id: string;
  module_id: string;
  content_id: string;
  status: ProgressStatus;
  progress_percentage: number;
  time_spent: number; // em segundos
  last_position: number;
  started_at?: string;
  completed_at?: string;
  updated_at: string;
  notes?: string;
}

// Progresso do Módulo (agregado)
export interface ModuleProgress {
  module_id: string;
  user_id: string;
  total_content: number;
  completed_content: number;
  progress_percentage: number;
  time_spent: number;
  status: ProgressStatus;
  last_accessed?: string;
  estimated_completion?: string;
}

// Analytics de Progresso
export interface ProgressAnalytics {
  user_id: string;
  total_modules: number;
  completed_modules: number;
  in_progress_modules: number;
  total_time_spent: number;
  average_score: number;
  completion_rate: number;
  streak_days: number;
  last_activity: string;
}

// =====================================================
// CERTIFICADOS
// =====================================================

// Certificado
export interface TrainingCertificate {
  id: string;
  user_id: string;
  module_id: string;
  certificate_number: string;
  issued_at: string;
  expires_at?: string;
  certificate_url?: string;
  verification_code: string;
  is_valid: boolean;
  certificate_data: CertificateData;
  template_used?: string;
}

// Alias para compatibilidade com componentes
export type Certificate = TrainingCertificate;

// =====================================================
// DIAGRAMAS
// =====================================================

// Diagrama de Treinamento
export interface TrainingDiagram {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  diagram_type: 'flowchart' | 'mindmap';
  diagram_data: DiagramData;
  order_index: number;
  created_at: string;
  updated_at: string;
}

// Dados do Diagrama (ReactFlow)
export interface DiagramData {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

// Nó do Diagrama
export interface DiagramNode {
  id: string;
  type?: string;
  position: { x: number; y: number };
  data: { label: string; [key: string]: unknown };
  selected?: boolean;
}

// Aresta do Diagrama
export interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
  selected?: boolean;
  [key: string]: unknown;
}

// =====================================================
// PLAYBOOKS
// =====================================================

// Playbook de Treinamento
export interface TrainingPlaybook {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  file_url: string;
  file_type: 'pdf' | 'presentation' | 'document';
  file_size?: number;
  order_index: number;
  created_at: string;
  updated_at: string;
}

// Dados do Certificado
export interface CertificateData {
  user_name: string;
  course_title: string;
  completion_date: string;
  score?: number;
  duration?: number;
  instructor?: string;
  company_name: string;
  custom_fields?: Record<string, string | number>;
}

// Template de Certificado
export interface CertificateTemplate {
  id: string;
  name: string;
  description?: string;
  template_data: Record<string, unknown>;
  is_active: boolean;
  preview_url?: string;
}

// =====================================================
// GAMIFICAÇÃO
// =====================================================

// Pontos de Gamificação
export interface GamificationPoints {
  id: string;
  user_id: string;
  action_type: string;
  points: number;
  reference_id?: string;
  reference_type?: string;
  description?: string;
  multiplier: number;
  earned_at: string;
}

// Badge/Conquista
export interface GamificationBadge {
  id: string;
  name: string;
  description?: string;
  icon_url?: string;
  icon_svg?: string;
  criteria: BadgeCriteria;
  points_reward: number;
  rarity: BadgeRarity;
  is_active: boolean;
  category?: string;
  created_at: string;
}

// Critérios do Badge
export interface BadgeCriteria {
  modules_completed?: number;
  assessments_passed?: number;
  perfect_score?: number;
  consecutive_passes?: number;
  study_streak?: number;
  fast_completion?: number;
  points_earned?: number;
  custom_criteria?: Record<string, number | string | boolean>;
}

// Badge do Usuário
export interface UserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  earned_at: string;
  progress_data: Record<string, number | string | boolean>;
  badge?: GamificationBadge;
}

// Ranking do Usuário
export interface UserRanking {
  id: string;
  user_id: string;
  company_id: string;
  total_points: number;
  modules_completed: number;
  assessments_passed: number;
  certificates_earned: number;
  current_streak: number;
  longest_streak: number;
  last_activity?: string;
  rank_position?: number;
  updated_at: string;
}

// Leaderboard Entry
export interface LeaderboardEntry {
  user_id: string;
  user_name: string;
  avatar_url?: string;
  total_points: number;
  rank_position: number;
  badges_count: number;
  modules_completed: number;
  change_from_last_week?: number;
}

// =====================================================
// NOTIFICAÇÕES
// =====================================================

// Notificação de Treinamento
export interface TrainingNotification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  message?: string;
  reference_id?: string;
  reference_type?: string;
  is_read: boolean;
  priority: NotificationPriority;
  scheduled_for?: string;
  sent_at?: string;
  created_at: string;
  metadata: Record<string, string | number | boolean>;
}

// Template de Notificação
export interface NotificationTemplate {
  id: string;
  name: string;
  type: NotificationType;
  title_template: string;
  message_template: string;
  is_active: boolean;
  variables: string[];
  created_at: string;
}

// Configurações de Notificação
export interface NotificationSettings {
  user_id: string;
  email_enabled: boolean;
  push_enabled: boolean;
  reminder_frequency: number; // em horas
  quiet_hours_start?: string;
  quiet_hours_end?: string;
  types_enabled: NotificationType[];
}

// =====================================================
// VERSIONAMENTO
// =====================================================

// Versão de Conteúdo
export interface ContentVersion {
  id: string;
  content_id: string;
  version_number: number;
  content_data: Record<string, unknown>;
  changes_summary?: string;
  created_by?: string;
  created_at: string;
  is_current: boolean;
}

// Histórico de Alterações
export interface ChangeHistory {
  version_from: number;
  version_to: number;
  changes: ContentChange[];
  created_by: string;
  created_at: string;
}

// Alteração de Conteúdo
export interface ContentChange {
  field: string;
  old_value: unknown;
  new_value: unknown;
  change_type: 'added' | 'modified' | 'removed';
}

// =====================================================
// RELATÓRIOS E ANALYTICS
// =====================================================

// Relatório de Empresa
export interface CompanyTrainingReport {
  total_users: number;
  active_users: number;
  total_modules: number;
  avg_completion_rate: number;
  total_certificates: number;
  top_performers: TopPerformer[];
  module_statistics: ModuleStatistics[];
  engagement_trends: EngagementTrend[];
}

// Top Performer
export interface TopPerformer {
  user_id: string;
  name: string;
  points: number;
  modules: number;
  certificates: number;
  avatar_url?: string;
}

// Estatísticas do Módulo
export interface ModuleStatistics {
  module_id: string;
  title: string;
  total_content: number;
  users_enrolled: number;
  users_completed: number;
  avg_completion_rate: number;
  avg_time_spent: number;
  avg_score?: number;
}

// Tendência de Engajamento
export interface EngagementTrend {
  date: string;
  active_users: number;
  modules_completed: number;
  time_spent: number;
  assessments_taken: number;
}

// Métricas de Conteúdo
export interface ContentMetrics {
  content_id: string;
  title: string;
  type: ContentType;
  views: number;
  completions: number;
  avg_time_spent: number;
  completion_rate: number;
  user_rating?: number;
  drop_off_points: number[];
}

// =====================================================
// TIPOS DE FORMULÁRIO E UI
// =====================================================

// Formulário de Módulo
export interface ModuleFormData {
  title: string;
  description?: string;
  category?: string;
  difficulty_level?: DifficultyLevel;
  estimated_duration?: number;
  required_roles: string[];
  optional_roles: string[];
  is_mandatory: boolean;
  tags: string[];
  prerequisites: string[];
  completion_criteria: CompletionCriteria;
}

// Formulário de Conteúdo
export interface ContentFormData {
  title: string;
  type: ContentType;
  content_order: number;
  is_required: boolean;
  content_data: Record<string, unknown>;
  file?: File;
}

// Formulário de Avaliação
export interface AssessmentFormData {
  title: string;
  description?: string;
  passing_score: number;
  time_limit?: number;
  max_attempts: number;
  randomize_questions: boolean;
  show_results_immediately: boolean;
  questions: QuestionFormData[];
}

// Formulário de Questão
export interface QuestionFormData {
  question_text: string;
  question_type: QuestionType;
  options: QuestionOption[];
  correct_answer: string | number | string[];
  points: number;
  explanation?: string;
  difficulty: QuestionDifficulty;
}

// Estado do Player de Vídeo
export interface VideoPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  playbackRate: number;
  quality: string;
  isFullscreen: boolean;
  isLoading: boolean;
  hasError: boolean;
  errorMessage?: string;
}

// Configurações do Editor
export interface EditorSettings {
  theme: 'light' | 'dark';
  font_size: number;
  auto_save: boolean;
  spell_check: boolean;
  word_wrap: boolean;
  line_numbers: boolean;
}

// =====================================================
// TIPOS DE RESPOSTA DA API
// =====================================================

// Resposta de Lista Paginada
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  has_more: boolean;
}

// Resposta de Progresso
export interface ProgressResponse {
  module_progress: ModuleProgress[];
  overall_stats: ProgressAnalytics;
  recent_activity: RecentActivity[];
  upcoming_deadlines: UpcomingDeadline[];
}

// Atividade Recente
export interface RecentActivity {
  id: string;
  type: 'module_completed' | 'assessment_passed' | 'badge_earned' | 'content_viewed';
  title: string;
  description: string;
  timestamp: string;
  points_earned?: number;
}

// Prazo Próximo
export interface UpcomingDeadline {
  module_id: string;
  title: string;
  deadline: string;
  progress_percentage: number;
  is_overdue: boolean;
}

// Resposta de Avaliação
export interface AssessmentResponse {
  attempt: AssessmentAttempt;
  results: QuestionResult[];
  certificate?: TrainingCertificate;
  next_attempt_available?: string;
}

// Resultado da Questão
export interface QuestionResult {
  question_id: string;
  user_answer: string | number | string[];
  correct_answer: string | number | string[];
  is_correct: boolean;
  points_earned: number;
  explanation?: string;
}

// =====================================================
// TIPOS DE CONFIGURAÇÃO
// =====================================================

// Configurações do Sistema
export interface SystemSettings {
  max_file_size: number;
  allowed_video_formats: string[];
  default_watermark: WatermarkSettings;
  default_security: SecuritySettings;
  points_config: PointsConfiguration;
  notification_config: NotificationConfiguration;
}

// Configuração de Pontos
export interface PointsConfiguration {
  video_completion: number;
  assessment_pass: number;
  perfect_score_bonus: number;
  module_completion: number;
  daily_login: number;
  streak_multiplier: number;
}

// Configuração de Notificações
export interface NotificationConfiguration {
  reminder_intervals: number[]; // em horas
  max_reminders: number;
  quiet_hours_default: { start: string; end: string };
  batch_size: number;
}

// =====================================================
// TIPOS DE ERRO
// =====================================================

// Erro de Validação
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

// Erro de Upload
export interface UploadError {
  file_name: string;
  error_type: 'size' | 'format' | 'network' | 'processing';
  message: string;
}

// Erro de Processamento
export interface ProcessingError {
  content_id: string;
  error_type: 'encoding' | 'thumbnail' | 'watermark' | 'upload';
  message: string;
  retry_count: number;
}

// =====================================================
// TIPOS UTILITÁRIOS
// =====================================================

// Filtros de Busca
export interface TrainingFilters {
  category?: string;
  difficulty?: DifficultyLevel;
  status?: ProgressStatus;
  tags?: string[];
  date_range?: { start: string; end: string };
  search_term?: string;
}

// Opções de Ordenação
export interface SortOptions {
  field: string;
  direction: 'asc' | 'desc';
}

// Configurações de Paginação
export interface PaginationOptions {
  page: number;
  limit: number;
  offset?: number;
}

// Contexto de Usuário
export interface UserContext {
  user_id: string;
  company_id: string;
  role: string;
  permissions: string[];
  preferences: UserPreferences;
}

// Preferências do Usuário
export interface UserPreferences {
  theme: 'light' | 'dark';
  language: string;
  timezone: string;
  notifications: NotificationSettings;
  playback_speed: number;
  auto_play: boolean;
}

// =====================================================
// EXPORTS CONSOLIDADOS
// =====================================================

// Re-export de todos os tipos para facilitar importação
export type {
  // Principais
  TrainingModule,
  TrainingContent,
  TrainingVideo,
  TrainingAssessment,
  AssessmentQuestion,
  UserTrainingProgress,
  TrainingCertificate,
  
  // Gamificação
  GamificationPoints,
  GamificationBadge,
  UserBadge,
  UserRanking,
  
  // Notificações
  TrainingNotification,
  NotificationTemplate,
  
  // Analytics
  CompanyTrainingReport,
  ModuleStatistics,
  ProgressAnalytics,
  
  // Formulários
  ModuleFormData,
  ContentFormData,
  AssessmentFormData,
  
  // Utilitários
  PaginatedResponse,
  TrainingFilters,
  UserContext
};