-- =====================================================
-- MÓDULO DE TREINAMENTOS - TABELAS ESSENCIAIS
-- Sistema de Treinamentos Corporativos - Solara Nova Energia
-- =====================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Módulos de treinamento
CREATE TABLE IF NOT EXISTS training_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  difficulty_level VARCHAR(50) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  estimated_duration INTEGER,
  required_roles TEXT[],
  optional_roles TEXT[],
  is_mandatory BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  version INTEGER DEFAULT 1,
  tags TEXT[],
  thumbnail_url TEXT,
  prerequisites UUID[],
  completion_criteria JSONB DEFAULT '{}'
);

-- Conteúdo dos treinamentos
CREATE TABLE IF NOT EXISTS training_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES training_modules(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('video', 'pdf', 'playbook', 'diagram', 'assessment', 'text')),
  title VARCHAR(255) NOT NULL,
  content_order INTEGER NOT NULL,
  content_data JSONB DEFAULT '{}',
  file_url TEXT,
  file_size BIGINT,
  duration INTEGER,
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  version INTEGER DEFAULT 1
);

-- Progresso dos usuários
CREATE TABLE IF NOT EXISTS user_training_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  module_id UUID REFERENCES training_modules(id) ON DELETE CASCADE,
  content_id UUID REFERENCES training_content(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'skipped')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  time_spent INTEGER DEFAULT 0,
  last_position INTEGER DEFAULT 0,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  CONSTRAINT user_training_progress_unique UNIQUE(user_id, content_id)
);

-- Avaliações
CREATE TABLE IF NOT EXISTS training_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES training_modules(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  passing_score INTEGER DEFAULT 70 CHECK (passing_score >= 0 AND passing_score <= 100),
  time_limit INTEGER,
  max_attempts INTEGER DEFAULT 3 CHECK (max_attempts > 0),
  randomize_questions BOOLEAN DEFAULT false,
  show_results_immediately BOOLEAN DEFAULT true,
  certificate_template_id UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assessment_order INTEGER DEFAULT 1
);

-- Resultados das avaliações (simplificado)
CREATE TABLE IF NOT EXISTS assessment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  assessment_id UUID REFERENCES training_assessments(id) ON DELETE CASCADE,
  score INTEGER,
  percentage REAL,
  passed BOOLEAN,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  answers JSONB DEFAULT '{}'
);

-- Habilitar RLS (Row Level Security)
ALTER TABLE training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;

-- Políticas básicas de segurança
CREATE POLICY "Users can view training modules" ON training_modules
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can view training content" ON training_content
  FOR SELECT USING (true);

CREATE POLICY "Users can manage their own progress" ON user_training_progress
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view assessments" ON training_assessments
  FOR SELECT USING (is_active = true);

CREATE POLICY "Users can manage their own results" ON assessment_results
  FOR ALL USING (auth.uid() = user_id);

-- Inserir dados de exemplo
INSERT INTO training_modules (title, description, category, difficulty_level, estimated_duration, is_mandatory, is_active)
VALUES 
  ('Introdução à Energia Solar', 'Conceitos básicos sobre energia solar fotovoltaica', 'Fundamentos', 'beginner', 60, true, true),
  ('Dimensionamento de Sistemas', 'Como calcular e dimensionar sistemas solares', 'Técnico', 'intermediate', 120, true, true),
  ('Segurança em Instalações', 'Normas de segurança para instalação de painéis solares', 'Segurança', 'beginner', 90, true, true);

-- Inserir conteúdo de exemplo
INSERT INTO training_content (module_id, type, title, content_order, content_data)
SELECT 
  tm.id,
  'video',
  'Vídeo Introdutório',
  1,
  '{"description": "Vídeo de introdução ao módulo", "duration": 600}'
FROM training_modules tm
WHERE tm.title = 'Introdução à Energia Solar';

INSERT INTO training_content (module_id, type, title, content_order, content_data)
SELECT 
  tm.id,
  'assessment',
  'Avaliação Final',
  2,
  '{"questions": 10, "passing_score": 70}'
FROM training_modules tm
WHERE tm.title = 'Introdução à Energia Solar';

-- Inserir avaliação de exemplo
INSERT INTO training_assessments (module_id, title, description, passing_score, max_attempts)
SELECT 
  tm.id,
  'Avaliação - Introdução à Energia Solar',
  'Teste seus conhecimentos sobre os conceitos básicos de energia solar',
  70,
  3
FROM training_modules tm
WHERE tm.title = 'Introdução à Energia Solar';

-- Conceder permissões
GRANT ALL ON training_modules TO authenticated;
GRANT ALL ON training_content TO authenticated;
GRANT ALL ON user_training_progress TO authenticated;
GRANT ALL ON training_assessments TO authenticated;
GRANT ALL ON assessment_results TO authenticated;

GRANT SELECT ON training_modules TO anon;
GRANT SELECT ON training_content TO anon;
GRANT SELECT ON training