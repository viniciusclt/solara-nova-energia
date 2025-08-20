// Tipos e interfaces para o Sistema de Roadmap e Votação

// Enums para categorias de funcionalidades
export enum FeatureCategory {
  FRONTEND = 'frontend',
  BACKEND = 'backend',
  DESIGN = 'design',
  INFRASTRUCTURE = 'infrastructure',
  MOBILE = 'mobile',
  API = 'api',
  UI_UX = 'ui_ux',
  PERFORMANCE = 'performance'
}

// Enums para status das funcionalidades
export enum FeatureStatus {
  VOTING = 'voting',
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

// Enums para prioridade
export enum FeaturePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

// Enums para tipos de voto
export enum VoteType {
  UP = 'up',
  DOWN = 'down'
}

// Interface principal para funcionalidades do roadmap
export interface RoadmapFeature {
  id: string;
  title: string;
  description?: string;
  category: FeatureCategory;
  status: FeatureStatus;
  priority: FeaturePriority;
  votes_count: number;
  estimated_effort?: number; // em horas
  target_release?: string; // versão alvo
  tags?: string[]; // tags adicionais
  created_by?: string; // UUID do usuário
  assigned_to?: string; // UUID do usuário responsável
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

// Interface para votos
export interface FeatureVote {
  id: string;
  feature_id: string;
  user_id: string;
  vote_type: VoteType;
  created_at: string;
  updated_at: string;
}

// Interface para comentários
export interface FeatureComment {
  id: string;
  feature_id: string;
  user_id: string;
  comment: string;
  parent_comment_id?: string;
  created_at: string;
  updated_at: string;
  // Dados do usuário (populados via join)
  user?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  // Respostas aninhadas
  replies?: FeatureComment[];
}

// Interface para histórico de mudanças de status
export interface FeatureStatusHistory {
  id: string;
  feature_id: string;
  old_status?: FeatureStatus;
  new_status: FeatureStatus;
  changed_by?: string;
  change_reason?: string;
  created_at: string;
  // Dados do usuário (populados via join)
  user?: {
    id: string;
    name: string;
  };
}

// Interface para dados completos de uma funcionalidade (com relacionamentos)
export interface RoadmapFeatureWithDetails extends RoadmapFeature {
  // Dados do criador
  creator?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  // Dados do responsável
  assignee?: {
    id: string;
    name: string;
    avatar_url?: string;
  };
  // Comentários da funcionalidade
  comments?: FeatureComment[];
  // Histórico de status
  status_history?: FeatureStatusHistory[];
  // Voto do usuário atual
  user_vote?: FeatureVote;
  // Estatísticas de votos
  vote_stats?: {
    up_votes: number;
    down_votes: number;
    total_votes: number;
  };
}

// Interface para criação de nova funcionalidade
export interface CreateFeatureRequest {
  title: string;
  description?: string;
  category: FeatureCategory;
  priority?: FeaturePriority;
  estimated_effort?: number;
  target_release?: string;
  tags?: string[];
}

// Interface para atualização de funcionalidade
export interface UpdateFeatureRequest {
  title?: string;
  description?: string;
  category?: FeatureCategory;
  status?: FeatureStatus;
  priority?: FeaturePriority;
  estimated_effort?: number;
  target_release?: string;
  tags?: string[];
  assigned_to?: string;
}

// Interface para criação de voto
export interface CreateVoteRequest {
  feature_id: string;
  vote_type: VoteType;
}

// Interface para criação de comentário
export interface CreateCommentRequest {
  feature_id: string;
  comment: string;
  parent_comment_id?: string;
}

// Interface para filtros de busca
export interface RoadmapFilters {
  category?: FeatureCategory[];
  status?: FeatureStatus[];
  priority?: FeaturePriority[];
  search?: string;
  created_by?: string;
  assigned_to?: string;
  tags?: string[];
  sort_by?: 'created_at' | 'updated_at' | 'votes_count' | 'title';
  sort_order?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Interface para resposta paginada
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
  has_more: boolean;
}

// Interface para estatísticas do roadmap
export interface RoadmapStats {
  total_features: number;
  by_status: Record<FeatureStatus, number>;
  by_category: Record<FeatureCategory, number>;
  by_priority: Record<FeaturePriority, number>;
  total_votes: number;
  total_comments: number;
  active_contributors: number;
}

// Interface para notificações relacionadas ao roadmap
export interface RoadmapNotification {
  id: string;
  type: 'feature_created' | 'feature_updated' | 'feature_commented' | 'feature_voted' | 'status_changed';
  feature_id: string;
  feature_title: string;
  message: string;
  created_at: string;
  read: boolean;
  user_id: string;
}

// Interface para configurações de usuário do roadmap
export interface RoadmapUserSettings {
  email_notifications: {
    new_features: boolean;
    status_updates: boolean;
    comments_on_voted: boolean;
    weekly_digest: boolean;
  };
  display_preferences: {
    default_view: 'grid' | 'list' | 'kanban';
    items_per_page: number;
    show_completed: boolean;
  };
}

// Tipos utilitários
export type FeatureCategoryLabel = {
  [K in FeatureCategory]: string;
};

export type FeatureStatusLabel = {
  [K in FeatureStatus]: string;
};

export type FeaturePriorityLabel = {
  [K in FeaturePriority]: string;
};

// Labels para exibição
export const FEATURE_CATEGORY_LABELS: FeatureCategoryLabel = {
  [FeatureCategory.FRONTEND]: 'Frontend',
  [FeatureCategory.BACKEND]: 'Backend',
  [FeatureCategory.DESIGN]: 'Design',
  [FeatureCategory.INFRASTRUCTURE]: 'Infraestrutura',
  [FeatureCategory.MOBILE]: 'Mobile',
  [FeatureCategory.API]: 'API',
  [FeatureCategory.UI_UX]: 'UI/UX',
  [FeatureCategory.PERFORMANCE]: 'Performance'
};

export const FEATURE_STATUS_LABELS: FeatureStatusLabel = {
  [FeatureStatus.VOTING]: 'Em Votação',
  [FeatureStatus.PLANNED]: 'Planejado',
  [FeatureStatus.IN_PROGRESS]: 'Em Desenvolvimento',
  [FeatureStatus.COMPLETED]: 'Concluído',
  [FeatureStatus.CANCELLED]: 'Cancelado'
};

export const FEATURE_PRIORITY_LABELS: FeaturePriorityLabel = {
  [FeaturePriority.LOW]: 'Baixa',
  [FeaturePriority.MEDIUM]: 'Média',
  [FeaturePriority.HIGH]: 'Alta'
};

// Cores para status (para uso em componentes)
export const FEATURE_STATUS_COLORS = {
  [FeatureStatus.VOTING]: 'bg-blue-100 text-blue-800',
  [FeatureStatus.PLANNED]: 'bg-yellow-100 text-yellow-800',
  [FeatureStatus.IN_PROGRESS]: 'bg-purple-100 text-purple-800',
  [FeatureStatus.COMPLETED]: 'bg-green-100 text-green-800',
  [FeatureStatus.CANCELLED]: 'bg-red-100 text-red-800'
};

// Cores para prioridade
export const FEATURE_PRIORITY_COLORS = {
  [FeaturePriority.LOW]: 'bg-gray-100 text-gray-800',
  [FeaturePriority.MEDIUM]: 'bg-orange-100 text-orange-800',
  [FeaturePriority.HIGH]: 'bg-red-100 text-red-800'
};

// Cores para categoria
export const FEATURE_CATEGORY_COLORS = {
  [FeatureCategory.FRONTEND]: 'bg-blue-100 text-blue-800',
  [FeatureCategory.BACKEND]: 'bg-green-100 text-green-800',
  [FeatureCategory.DESIGN]: 'bg-pink-100 text-pink-800',
  [FeatureCategory.INFRASTRUCTURE]: 'bg-gray-100 text-gray-800',
  [FeatureCategory.MOBILE]: 'bg-purple-100 text-purple-800',
  [FeatureCategory.API]: 'bg-indigo-100 text-indigo-800',
  [FeatureCategory.UI_UX]: 'bg-rose-100 text-rose-800',
  [FeatureCategory.PERFORMANCE]: 'bg-yellow-100 text-yellow-800'
};