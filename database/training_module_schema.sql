-- =====================================================
-- MÓDULO DE TREINAMENTOS - SCHEMA COMPLETO
-- Sistema de Treinamentos Corporativos - Solara Nova Energia
-- Versão: 1.0
-- Data: 2024-12-12
-- =====================================================

-- Habilitar extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================
-- TABELAS PRINCIPAIS
-- =====================================================

-- Módulos de treinamento
CREATE TABLE training_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  difficulty_level VARCHAR(50) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  estimated_duration INTEGER, -- em minutos
  required_roles TEXT[], -- array de cargos que devem fazer
  optional_roles TEXT[], -- array de cargos opcionais
  is_mandatory BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  version INTEGER DEFAULT 1,
  tags TEXT[],
  thumbnail_url TEXT,
  prerequisites UUID[], -- array de IDs de módulos pré-requisitos
  completion_criteria JSONB DEFAULT '{}', -- critérios para conclusão
  
  CONSTRAINT training_modules_title_company_unique UNIQUE (title, company_id)
);

-- Conteúdo dos treinamentos
CREATE TABLE training_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES training_modules(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('video', 'pdf', 'playbook', 'diagram', 'assessment', 'text')),
  title VARCHAR(255) NOT NULL,
  content_order INTEGER NOT NULL,
  content_data JSONB DEFAULT '{}', -- dados específicos do tipo de conteúdo
  file_url TEXT, -- URL do arquivo (vídeo, PDF, etc.)
  file_size BIGINT, -- tamanho em bytes
  duration INTEGER, -- duração em segundos (para vídeos)
  is_required BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  version INTEGER DEFAULT 1,
  
  CONSTRAINT training_content_order_module_unique UNIQUE (module_id, content_order)
);

-- Vídeos de treinamento
CREATE TABLE training_videos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES training_content(id) ON DELETE CASCADE,
  original_filename VARCHAR(255),
  file_path TEXT NOT NULL,
  file_size BIGINT,
  duration INTEGER, -- em segundos
  resolution VARCHAR(20), -- 720p, 1080p, etc.
  format VARCHAR(10), -- mp4, webm, etc.
  thumbnail_url TEXT,
  watermark_settings JSONB DEFAULT '{
    "enabled": true,
    "position": "bottom-right",
    "opacity": 0.7,
    "text": "{{user_name}} - {{company_name}}"
  }',
  security_settings JSONB DEFAULT '{
    "domain_restriction": true,
    "download_prevention": true,
    "right_click_disabled": true
  }',
  processing_status VARCHAR(50) DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
  hls_playlist_url TEXT, -- URL do playlist HLS
  quality_variants JSONB DEFAULT '[]', -- diferentes qualidades disponíveis
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Avaliações
CREATE TABLE training_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id UUID REFERENCES training_modules(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  passing_score INTEGER DEFAULT 70 CHECK (passing_score >= 0 AND passing_score <= 100),
  time_limit INTEGER, -- em minutos, NULL = sem limite
  max_attempts INTEGER DEFAULT 3 CHECK (max_attempts > 0),
  randomize_questions BOOLEAN DEFAULT false,
  show_results_immediately BOOLEAN DEFAULT true,
  certificate_template_id UUID, -- referência para template de certificado
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  assessment_order INTEGER DEFAULT 1
);

-- Questões das avaliações
CREATE TABLE assessment_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES training_assessments(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50) NOT NULL CHECK (question_type IN ('multiple_choice', 'true_false', 'essay', 'fill_blank')),
  options JSONB DEFAULT '[]', -- opções para múltipla escolha
  correct_answer JSONB, -- resposta correta
  points INTEGER DEFAULT 1 CHECK (points > 0),
  explanation TEXT, -- explicação da resposta
  question_order INTEGER,
  difficulty VARCHAR(20) DEFAULT 'medium' CHECK (difficulty IN ('easy', 'medium', 'hard')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT assessment_questions_order_unique UNIQUE (assessment_id, question_order)
);

-- Progresso dos usuários
CREATE TABLE user_training_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  module_id UUID REFERENCES training_modules(id) ON DELETE CASCADE,
  content_id UUID REFERENCES training_content(id) ON DELETE CASCADE,
  status VARCHAR(50) DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'completed', 'skipped')),
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  time_spent INTEGER DEFAULT 0, -- em segundos
  last_position INTEGER DEFAULT 0, -- posição no vídeo/conteúdo
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT, -- anotações do usuário
  
  CONSTRAINT user_training_progress_unique UNIQUE(user_id, content_id)
);

-- Tentativas de avaliação
CREATE TABLE assessment_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  assessment_id UUID REFERENCES training_assessments(id) ON DELETE CASCADE,
  attempt_number INTEGER NOT NULL CHECK (attempt_number > 0),
  answers JSONB NOT NULL DEFAULT '{}', -- respostas do usuário
  score INTEGER, -- pontuação obtida
  percentage REAL, -- porcentagem de acerto
  passed BOOLEAN,
  time_taken INTEGER, -- tempo gasto em segundos
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  feedback JSONB DEFAULT '{}', -- feedback detalhado por questão
  
  CONSTRAINT assessment_attempts_unique UNIQUE(user_id, assessment_id, attempt_number)
);

-- Certificados
CREATE TABLE training_certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  module_id UUID REFERENCES training_modules(id) ON DELETE CASCADE,
  certificate_number VARCHAR(100) UNIQUE NOT NULL,
  issued_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- NULL = não expira
  certificate_url TEXT, -- URL do PDF do certificado
  verification_code VARCHAR(50) UNIQUE,
  is_valid BOOLEAN DEFAULT true,
  certificate_data JSONB DEFAULT '{}', -- dados do certificado (nome, curso, etc.)
  template_used VARCHAR(100)
);

-- =====================================================
-- SISTEMA DE GAMIFICAÇÃO
-- =====================================================

-- Pontos de gamificação
CREATE TABLE gamification_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action_type VARCHAR(100) NOT NULL,
  points INTEGER NOT NULL,
  reference_id UUID, -- ID do conteúdo/módulo relacionado
  reference_type VARCHAR(50), -- tipo da referência (module, content, assessment)
  description TEXT,
  multiplier REAL DEFAULT 1.0, -- multiplicador de pontos
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Badges/Conquistas
CREATE TABLE gamification_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  icon_url TEXT,
  icon_svg TEXT, -- SVG do ícone
  criteria JSONB NOT NULL, -- critérios para ganhar o badge
  points_reward INTEGER DEFAULT 0,
  rarity VARCHAR(20) DEFAULT 'common' CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
  is_active BOOLEAN DEFAULT true,
  category VARCHAR(50), -- categoria do badge
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT gamification_badges_name_unique UNIQUE (name)
);

-- Badges dos usuários
CREATE TABLE user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES gamification_badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  progress_data JSONB DEFAULT '{}', -- dados de progresso para o badge
  
  CONSTRAINT user_badges_unique UNIQUE(user_id, badge_id)
);

-- Ranking de usuários
CREATE TABLE user_rankings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  modules_completed INTEGER DEFAULT 0,
  assessments_passed INTEGER DEFAULT 0,
  certificates_earned INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0, -- dias consecutivos de atividade
  longest_streak INTEGER DEFAULT 0,
  last_activity TIMESTAMP WITH TIME ZONE,
  rank_position INTEGER,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT user_rankings_unique UNIQUE(user_id, company_id)
);

-- =====================================================
-- SISTEMA DE NOTIFICAÇÕES
-- =====================================================

-- Notificações de treinamento
CREATE TABLE training_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type VARCHAR(100) NOT NULL CHECK (type IN ('reminder', 'achievement', 'deadline', 'new_content', 'certificate')),
  title VARCHAR(255) NOT NULL,
  message TEXT,
  reference_id UUID, -- ID do módulo/conteúdo relacionado
  reference_type VARCHAR(50), -- tipo da referência
  is_read BOOLEAN DEFAULT false,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  scheduled_for TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  metadata JSONB DEFAULT '{}' -- dados adicionais da notificação
);

-- Templates de notificação
CREATE TABLE notification_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  type VARCHAR(100) NOT NULL,
  title_template TEXT NOT NULL,
  message_template TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  variables JSONB DEFAULT '[]', -- variáveis disponíveis no template
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CONSTRAINT notification_templates_name_unique UNIQUE (name)
);

-- =====================================================
-- SISTEMA DE VERSIONAMENTO
-- =====================================================

-- Histórico de versões de conteúdo
CREATE TABLE content_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content_id UUID REFERENCES training_content(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  content_data JSONB NOT NULL,
  changes_summary TEXT,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_current BOOLEAN DEFAULT false,
  
  CONSTRAINT content_versions_unique UNIQUE (content_id, version_number)
);

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para training_modules
CREATE INDEX idx_training_modules_company_id ON training_modules(company_id);
CREATE INDEX idx_training_modules_category ON training_modules(category);
CREATE INDEX idx_training_modules_active ON training_modules(is_active);
CREATE INDEX idx_training_modules_tags ON training_modules USING GIN(tags);
CREATE INDEX idx_training_modules_roles ON training_modules USING GIN(required_roles);

-- Índices para training_content
CREATE INDEX idx_training_content_module_id ON training_content(module_id);
CREATE INDEX idx_training_content_type ON training_content(type);
CREATE INDEX idx_training_content_order ON training_content(module_id, content_order);

-- Índices para user_training_progress
CREATE INDEX idx_user_progress_user_id ON user_training_progress(user_id);
CREATE INDEX idx_user_progress_module_id ON user_training_progress(module_id);
CREATE INDEX idx_user_progress_status ON user_training_progress(status);
CREATE INDEX idx_user_progress_updated ON user_training_progress(updated_at);

-- Índices para assessment_attempts
CREATE INDEX idx_assessment_attempts_user_id ON assessment_attempts(user_id);
CREATE INDEX idx_assessment_attempts_assessment_id ON assessment_attempts(assessment_id);
CREATE INDEX idx_assessment_attempts_completed ON assessment_attempts(completed_at);

-- Índices para gamificação
CREATE INDEX idx_gamification_points_user_id ON gamification_points(user_id);
CREATE INDEX idx_gamification_points_earned ON gamification_points(earned_at);
CREATE INDEX idx_user_rankings_company ON user_rankings(company_id, total_points DESC);
CREATE INDEX idx_user_rankings_position ON user_rankings(rank_position);

-- Índices para notificações
CREATE INDEX idx_training_notifications_user_id ON training_notifications(user_id);
CREATE INDEX idx_training_notifications_type ON training_notifications(type);
CREATE INDEX idx_training_notifications_scheduled ON training_notifications(scheduled_for);
CREATE INDEX idx_training_notifications_unread ON training_notifications(user_id, is_read);

-- =====================================================
-- TRIGGERS E FUNÇÕES
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_training_modules_updated_at BEFORE UPDATE ON training_modules FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_training_content_updated_at BEFORE UPDATE ON training_content FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_training_videos_updated_at BEFORE UPDATE ON training_videos FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_progress_updated_at BEFORE UPDATE ON user_training_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_user_rankings_updated_at BEFORE UPDATE ON user_rankings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para calcular progresso do módulo
CREATE OR REPLACE FUNCTION calculate_module_progress(p_user_id UUID, p_module_id UUID)
RETURNS INTEGER AS $$
DECLARE
    total_content INTEGER;
    completed_content INTEGER;
    progress_percentage INTEGER;
BEGIN
    -- Conta total de conteúdo obrigatório
    SELECT COUNT(*) INTO total_content
    FROM training_content
    WHERE module_id = p_module_id AND is_required = true;
    
    -- Conta conteúdo completado
    SELECT COUNT(*) INTO completed_content
    FROM user_training_progress utp
    JOIN training_content tc ON utp.content_id = tc.id
    WHERE utp.user_id = p_user_id 
    AND tc.module_id = p_module_id 
    AND tc.is_required = true
    AND utp.status = 'completed';
    
    -- Calcula porcentagem
    IF total_content = 0 THEN
        progress_percentage := 100;
    ELSE
        progress_percentage := (completed_content * 100) / total_content;
    END IF;
    
    RETURN progress_percentage;
END;
$$ LANGUAGE plpgsql;

-- Função para atualizar ranking
CREATE OR REPLACE FUNCTION update_user_ranking(p_user_id UUID)
RETURNS VOID AS $$
DECLARE
    user_company_id UUID;
    total_points INTEGER;
    modules_count INTEGER;
    assessments_count INTEGER;
    certificates_count INTEGER;
BEGIN
    -- Busca company_id do usuário
    SELECT company_id INTO user_company_id
    FROM profiles
    WHERE id = p_user_id;
    
    -- Calcula totais
    SELECT COALESCE(SUM(points), 0) INTO total_points
    FROM gamification_points
    WHERE user_id = p_user_id;
    
    SELECT COUNT(DISTINCT module_id) INTO modules_count
    FROM user_training_progress utp
    JOIN training_content tc ON utp.content_id = tc.id
    WHERE utp.user_id = p_user_id AND utp.status = 'completed';
    
    SELECT COUNT(*) INTO assessments_count
    FROM assessment_attempts
    WHERE user_id = p_user_id AND passed = true;
    
    SELECT COUNT(*) INTO certificates_count
    FROM training_certificates
    WHERE user_id = p_user_id AND is_valid = true;
    
    -- Atualiza ou insere ranking
    INSERT INTO user_rankings (user_id, company_id, total_points, modules_completed, assessments_passed, certificates_earned, last_activity)
    VALUES (p_user_id, user_company_id, total_points, modules_count, assessments_count, certificates_count, NOW())
    ON CONFLICT (user_id, company_id)
    DO UPDATE SET
        total_points = EXCLUDED.total_points,
        modules_completed = EXCLUDED.modules_completed,
        assessments_passed = EXCLUDED.assessments_passed,
        certificates_earned = EXCLUDED.certificates_earned,
        last_activity = EXCLUDED.last_activity,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar ranking quando pontos são adicionados
CREATE OR REPLACE FUNCTION trigger_update_ranking()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM update_user_ranking(NEW.user_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ranking_on_points AFTER INSERT ON gamification_points FOR EACH ROW EXECUTE FUNCTION trigger_update_ranking();

-- =====================================================
-- POLÍTICAS RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Habilitar RLS em todas as tabelas
ALTER TABLE training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE gamification_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_rankings ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_versions ENABLE ROW LEVEL SECURITY;

-- Políticas para training_modules
CREATE POLICY "Users can view modules from their company" ON training_modules
FOR SELECT USING (
  company_id = (auth.jwt() ->> 'company_id')::UUID
);

CREATE POLICY "Admins can manage modules" ON training_modules
FOR ALL USING (
  company_id = (auth.jwt() ->> 'company_id')::UUID
  AND (auth.jwt() ->> 'role') IN ('admin', 'training_manager')
);

-- Políticas para training_content
CREATE POLICY "Users can view content from their company modules" ON training_content
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM training_modules tm
    WHERE tm.id = training_content.module_id
    AND tm.company_id = (auth.jwt() ->> 'company_id')::UUID
  )
);

-- Políticas para user_training_progress
CREATE POLICY "Users can view their own progress" ON user_training_progress
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own progress" ON user_training_progress
FOR INSERT WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can modify their own progress" ON user_training_progress
FOR UPDATE USING (user_id = auth.uid());

-- Políticas para assessment_attempts
CREATE POLICY "Users can view their own attempts" ON assessment_attempts
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create their own attempts" ON assessment_attempts
FOR INSERT WITH CHECK (user_id = auth.uid());

-- Políticas para gamificação
CREATE POLICY "Users can view their own points" ON gamification_points
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view their own badges" ON user_badges
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can view their company ranking" ON user_rankings
FOR SELECT USING (
  company_id = (auth.jwt() ->> 'company_id')::UUID
);

-- Políticas para notificações
CREATE POLICY "Users can view their own notifications" ON training_notifications
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON training_notifications
FOR UPDATE USING (user_id = auth.uid());

-- =====================================================
-- DADOS INICIAIS
-- =====================================================

-- Badges padrão do sistema
INSERT INTO gamification_badges (name, description, icon_svg, criteria, points_reward, rarity, category) VALUES
('Primeiro Passo', 'Complete seu primeiro módulo de treinamento', '<svg>...</svg>', '{"modules_completed": 1}', 50, 'common', 'milestone'),
('Estudante Dedicado', 'Complete 5 módulos de treinamento', '<svg>...</svg>', '{"modules_completed": 5}', 200, 'rare', 'milestone'),
('Expert', 'Complete 20 módulos de treinamento', '<svg>...</svg>', '{"modules_completed": 20}', 1000, 'epic', 'milestone'),
('Mestre do Conhecimento', 'Complete 50 módulos de treinamento', '<svg>...</svg>', '{"modules_completed": 50}', 5000, 'legendary', 'milestone'),
('Avaliador', 'Passe em sua primeira avaliação', '<svg>...</svg>', '{"assessments_passed": 1}', 100, 'common', 'assessment'),
('Nota Máxima', 'Obtenha 100% em uma avaliação', '<svg>...</svg>', '{"perfect_score": 1}', 300, 'rare', 'assessment'),
('Sequência de Vitórias', 'Passe em 5 avaliações consecutivas', '<svg>...</svg>', '{"consecutive_passes": 5}', 500, 'epic', 'assessment'),
('Maratonista', 'Estude por 7 dias consecutivos', '<svg>...</svg>', '{"study_streak": 7}', 400, 'rare', 'engagement'),
('Velocista', 'Complete um módulo em menos de 1 hora', '<svg>...</svg>', '{"fast_completion": 3600}', 150, 'common', 'speed');

-- Templates de notificação padrão
INSERT INTO notification_templates (name, type, title_template, message_template, variables) VALUES
('Lembrete de Treinamento', 'reminder', 'Lembrete: {{module_title}}', 'Você tem um treinamento pendente: {{module_title}}. Continue de onde parou!', '["module_title", "progress_percentage"]'),
('Novo Badge Conquistado', 'achievement', 'Parabéns! Novo badge conquistado', 'Você conquistou o badge "{{badge_name}}"! Continue assim e ganhe {{points_reward}} pontos.', '["badge_name", "points_reward"]'),
('Certificado Disponível', 'certificate', 'Seu certificado está pronto!', 'Parabéns! Seu certificado do curso "{{module_title}}" está disponível para download.', '["module_title", "certificate_url"]'),
('Prazo de Treinamento', 'deadline', 'Prazo se aproximando', 'O treinamento "{{module_title}}" deve ser concluído até {{deadline_date}}.', '["module_title", "deadline_date"]'),
('Novo Conteúdo', 'new_content', 'Novo conteúdo disponível', 'Novo conteúdo foi adicionado ao módulo "{{module_title}}". Confira agora!', '["module_title", "content_type"]');

-- =====================================================
-- VIEWS ÚTEIS
-- =====================================================

-- View para progresso completo dos usuários
CREATE VIEW user_training_overview AS
SELECT 
    p.id as user_id,
    p.full_name,
    p.email,
    p.company_id,
    ur.total_points,
    ur.modules_completed,
    ur.assessments_passed,
    ur.certificates_earned,
    ur.current_streak,
    ur.rank_position,
    COUNT(DISTINCT ub.badge_id) as badges_earned
FROM profiles p
LEFT JOIN user_rankings ur ON p.id = ur.user_id
LEFT JOIN user_badges ub ON p.id = ub.user_id
GROUP BY p.id, p.full_name, p.email, p.company_id, ur.total_points, ur.modules_completed, ur.assessments_passed, ur.certificates_earned, ur.current_streak, ur.rank_position;

-- View para estatísticas de módulos
CREATE VIEW module_statistics AS
SELECT 
    tm.id as module_id,
    tm.title,
    tm.company_id,
    COUNT(DISTINCT tc.id) as total_content,
    COUNT(DISTINCT utp.user_id) as users_enrolled,
    COUNT(DISTINCT CASE WHEN utp.status = 'completed' THEN utp.user_id END) as users_completed,
    ROUND(AVG(CASE WHEN utp.status = 'completed' THEN utp.progress_percentage END), 2) as avg_completion_rate,
    AVG(utp.time_spent) as avg_time_spent
FROM training_modules tm
LEFT JOIN training_content tc ON tm.id = tc.module_id
LEFT JOIN user_training_progress utp ON tc.id = utp.content_id
GROUP BY tm.id, tm.title, tm.company_id;

-- =====================================================
-- FUNÇÕES DE RELATÓRIO
-- =====================================================

-- Função para gerar relatório de progresso por empresa
CREATE OR REPLACE FUNCTION get_company_training_report(p_company_id UUID)
RETURNS TABLE (
    total_users INTEGER,
    active_users INTEGER,
    total_modules INTEGER,
    avg_completion_rate NUMERIC,
    total_certificates INTEGER,
    top_performers JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM profiles WHERE company_id = p_company_id)::INTEGER as total_users,
        (SELECT COUNT(DISTINCT user_id) FROM user_rankings WHERE company_id = p_company_id AND last_activity > NOW() - INTERVAL '30 days')::INTEGER as active_users,
        (SELECT COUNT(*) FROM training_modules WHERE company_id = p_company_id AND is_active = true)::INTEGER as total_modules,
        (SELECT ROUND(AVG(modules_completed::NUMERIC / NULLIF((SELECT COUNT(*) FROM training_modules WHERE company_id = p_company_id), 0) * 100), 2) FROM user_rankings WHERE company_id = p_company_id) as avg_completion_rate,
        (SELECT COUNT(*) FROM training_certificates tc JOIN profiles p ON tc.user_id = p.id WHERE p.company_id = p_company_id)::INTEGER as total_certificates,
        (SELECT json_agg(json_build_object('name', p.full_name, 'points', ur.total_points, 'modules', ur.modules_completed))
         FROM user_rankings ur 
         JOIN profiles p ON ur.user_id = p.id 
         WHERE ur.company_id = p_company_id 
         ORDER BY ur.total_points DESC 
         LIMIT 5) as top_performers;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- STORAGE BUCKETS
-- =====================================================

-- Criar buckets de storage (executar no Supabase Dashboard)
/*
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES
('training-videos', 'training-videos', false, 5368709120, ARRAY['video/mp4', 'video/webm', 'video/quicktime']),
('training-content', 'training-content', false, 104857600, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/svg+xml']),
('certificates', 'certificates', false, 10485760, ARRAY['application/pdf']),
('thumbnails', 'thumbnails', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']);
*/

-- =====================================================
-- COMENTÁRIOS FINAIS
-- =====================================================

-- Este schema fornece:
-- 1. Estrutura completa para módulos de treinamento
-- 2. Sistema robusto de vídeos com segurança
-- 3. Avaliações flexíveis com múltiplos tipos de questão
-- 4. Gamificação completa com pontos, badges e ranking
-- 5. Sistema de notificações configurável
-- 6. Versionamento de conteúdo
-- 7. Relatórios e analytics
-- 8. Segurança com RLS
-- 9. Performance otimizada com índices
-- 10. Triggers automáticos para manutenção de dados

-- Para executar este schema:
-- 1. Execute este arquivo no SQL Editor do Supabase
-- 2. Configure os buckets de storage manualmente
-- 3. Ajuste as políticas RLS conforme necessário
-- 4. Teste as funções e triggers
-- 5. Popule com dados de teste se necessário