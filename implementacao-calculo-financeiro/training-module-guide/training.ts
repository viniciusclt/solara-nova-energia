// Tipos para o módulo de treinamentos

export interface TrainingModule {
  id: string;
  title: string;
  description?: string;
  category?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  order_index: number;
}

export interface TrainingVideo {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  video_url: string;
  thumbnail_url?: string;
  duration_seconds?: number;
  file_size?: number;
  created_at: string;
  order_index: number;
}

export interface TrainingPlaybook {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  file_url: string;
  file_type: 'pdf' | 'presentation';
  created_at: string;
  order_index: number;
}

export interface TrainingDiagram {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  diagram_type: 'flowchart' | 'mindmap';
  diagram_data: any; // JSON data for React Flow
  created_at: string;
  updated_at: string;
  order_index: number;
}

export interface AssessmentQuestion {
  id: number;
  question: string;
  type: 'multiple_choice' | 'true_false' | 'text';
  options?: string[];
  correct_answer: number | boolean | string;
  points: number;
}

export interface TrainingAssessment {
  id: string;
  module_id: string;
  title: string;
  description?: string;
  questions: AssessmentQuestion[];
  passing_score: number;
  time_limit_minutes?: number;
  created_at: string;
  order_index: number;
}

export interface UserProgress {
  id: string;
  user_id: string;
  module_id: string;
  video_id: string;
  progress_percentage: number;
  completed_at?: string;
  last_watched_at: string;
  watch_time_seconds: number;
}

export interface AssessmentResult {
  id: string;
  user_id: string;
  assessment_id: string;
  score: number;
  total_questions: number;
  answers: any[];
  completed_at: string;
  time_taken_minutes?: number;
  passed: boolean;
}

export interface Certificate {
  id: string;
  user_id: string;
  module_id: string;
  certificate_url?: string;
  issued_at: string;
  certificate_number: string;
}

export interface ModuleWithContent extends TrainingModule {
  videos: TrainingVideo[];
  playbooks: TrainingPlaybook[];
  diagrams: TrainingDiagram[];
  assessments: TrainingAssessment[];
  user_progress?: UserProgress[];
}

export interface UserAnswer {
  question_id: number;
  answer: number | boolean | string;
}

export interface VideoPlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  isFullscreen: boolean;
}

export interface DiagramNode {
  id: string;
  type?: string;
  data: {
    label: string;
  };
  position: {
    x: number;
    y: number;
  };
}

export interface DiagramEdge {
  id: string;
  source: string;
  target: string;
  type?: string;
}

export interface DiagramData {
  nodes: DiagramNode[];
  edges: DiagramEdge[];
}

