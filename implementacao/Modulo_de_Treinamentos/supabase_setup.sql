-- Script de configuração do banco de dados para o Módulo de Treinamentos
-- Execute este script no SQL Editor do Supabase

-- 1. Tabela de módulos de treinamento
CREATE TABLE IF NOT EXISTS training_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0
);

-- 2. Tabela de vídeos de treinamento
CREATE TABLE IF NOT EXISTS training_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES training_modules(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  thumbnail_url TEXT,
  duration_seconds INTEGER,
  file_size BIGINT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  order_index INTEGER DEFAULT 0
);

-- 3. Tabela de playbooks
CREATE TABLE IF NOT EXISTS training_playbooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES training_modules(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_type VARCHAR(50), -- 'pdf', 'presentation'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  order_index INTEGER DEFAULT 0
);

-- 4. Tabela de diagramas (fluxogramas e mind maps)
CREATE TABLE IF NOT EXISTS training_diagrams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES training_modules(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  diagram_type VARCHAR(50), -- 'flowchart', 'mindmap'
  diagram_data JSONB NOT NULL, -- Dados do React Flow
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  order_index INTEGER DEFAULT 0
);

-- 5. Tabela de avaliações
CREATE TABLE IF NOT EXISTS training_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES training_modules(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  questions JSONB NOT NULL, -- Array de questões
  passing_score INTEGER DEFAULT 70,
  time_limit_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  order_index INTEGER DEFAULT 0
);

-- 6. Tabela de progresso do usuário
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  module_id UUID REFERENCES training_modules(id),
  video_id UUID REFERENCES training_videos(id),
  progress_percentage INTEGER DEFAULT 0,
  completed_at TIMESTAMP WITH TIME ZONE,
  last_watched_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  watch_time_seconds INTEGER DEFAULT 0,
  UNIQUE(user_id, video_id)
);

-- 7. Tabela de resultados de avaliações
CREATE TABLE IF NOT EXISTS assessment_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  assessment_id UUID REFERENCES training_assessments(id),
  score INTEGER NOT NULL,
  total_questions INTEGER NOT NULL,
  answers JSONB NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  time_taken_minutes INTEGER,
  passed BOOLEAN GENERATED ALWAYS AS (score >= (SELECT passing_score FROM training_assessments WHERE id = assessment_id)) STORED
);

-- 8. Tabela de certificados
CREATE TABLE IF NOT EXISTS certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  module_id UUID REFERENCES training_modules(id),
  certificate_url TEXT,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  certificate_number VARCHAR(100) UNIQUE,
  UNIQUE(user_id, module_id)
);

-- Índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_training_videos_module_id ON training_videos(module_id);
CREATE INDEX IF NOT EXISTS idx_training_playbooks_module_id ON training_playbooks(module_id);
CREATE INDEX IF NOT EXISTS idx_training_diagrams_module_id ON training_diagrams(module_id);
CREATE INDEX IF NOT EXISTS idx_training_assessments_module_id ON training_assessments(module_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_module_id ON user_progress(module_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_user_id ON assessment_results(user_id);
CREATE INDEX IF NOT EXISTS idx_certificates_user_id ON certificates(user_id);

-- Triggers para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_training_modules_updated_at BEFORE UPDATE ON training_modules FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_training_diagrams_updated_at BEFORE UPDATE ON training_diagrams FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Row Level Security (RLS) Policies

-- Habilitar RLS nas tabelas
ALTER TABLE training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_playbooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_diagrams ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE certificates ENABLE ROW LEVEL SECURITY;

-- Políticas para training_modules (todos podem ler módulos ativos, apenas criadores/admins podem modificar)
CREATE POLICY "Todos podem ver módulos ativos" ON training_modules FOR SELECT USING (is_active = true);
CREATE POLICY "Criadores podem gerenciar seus módulos" ON training_modules FOR ALL USING (auth.uid() = created_by);

-- Políticas para conteúdo dos módulos (todos podem ler, apenas criadores/admins podem modificar)
CREATE POLICY "Todos podem ver vídeos de módulos ativos" ON training_videos FOR SELECT USING (
  EXISTS (SELECT 1 FROM training_modules WHERE id = module_id AND is_active = true)
);
CREATE POLICY "Criadores podem gerenciar vídeos" ON training_videos FOR ALL USING (
  EXISTS (SELECT 1 FROM training_modules WHERE id = module_id AND created_by = auth.uid())
);

CREATE POLICY "Todos podem ver playbooks de módulos ativos" ON training_playbooks FOR SELECT USING (
  EXISTS (SELECT 1 FROM training_modules WHERE id = module_id AND is_active = true)
);
CREATE POLICY "Criadores podem gerenciar playbooks" ON training_playbooks FOR ALL USING (
  EXISTS (SELECT 1 FROM training_modules WHERE id = module_id AND created_by = auth.uid())
);

CREATE POLICY "Todos podem ver diagramas de módulos ativos" ON training_diagrams FOR SELECT USING (
  EXISTS (SELECT 1 FROM training_modules WHERE id = module_id AND is_active = true)
);
CREATE POLICY "Criadores podem gerenciar diagramas" ON training_diagrams FOR ALL USING (
  EXISTS (SELECT 1 FROM training_modules WHERE id = module_id AND created_by = auth.uid())
);

CREATE POLICY "Todos podem ver avaliações de módulos ativos" ON training_assessments FOR SELECT USING (
  EXISTS (SELECT 1 FROM training_modules WHERE id = module_id AND is_active = true)
);
CREATE POLICY "Criadores podem gerenciar avaliações" ON training_assessments FOR ALL USING (
  EXISTS (SELECT 1 FROM training_modules WHERE id = module_id AND created_by = auth.uid())
);

-- Políticas para dados do usuário (cada usuário só vê seus próprios dados)
CREATE POLICY "Usuários podem ver seu próprio progresso" ON user_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem atualizar seu próprio progresso" ON user_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Usuários podem modificar seu próprio progresso" ON user_progress FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem ver seus próprios resultados" ON assessment_results FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Usuários podem inserir seus próprios resultados" ON assessment_results FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem ver seus próprios certificados" ON certificates FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Sistema pode gerar certificados" ON certificates FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Bucket para Storage (execute no painel do Supabase Storage)
-- Criar bucket 'training-content' com as seguintes configurações:
-- - Public: false
-- - File size limit: 500MB
-- - Allowed MIME types: video/*, application/pdf, image/*

-- Políticas para o bucket training-content
-- INSERT policy: Usuários autenticados podem fazer upload
-- SELECT policy: Usuários autenticados podem visualizar
-- UPDATE policy: Apenas criadores podem atualizar
-- DELETE policy: Apenas criadores podem deletar

