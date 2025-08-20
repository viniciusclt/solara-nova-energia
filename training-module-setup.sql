-- =====================================================================================
-- SETUP COMPLETO DO MÓDULO DE TREINAMENTOS - SUPABASE SELF-HOSTED
-- =====================================================================================
-- Execute este SQL na interface web do seu Supabase self-hosted
-- Seção: SQL Editor ou Database
-- =====================================================================================

-- Habilita extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- =====================================================================================
-- CRIAÇÃO DAS TABELAS
-- =====================================================================================

-- Tabela de módulos de treinamento
CREATE TABLE IF NOT EXISTS training_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    difficulty_level VARCHAR(50) DEFAULT 'beginner',
    estimated_duration INTEGER, -- em minutos
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id)
);

-- Tabela de conteúdo dos treinamentos
CREATE TABLE IF NOT EXISTS training_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID REFERENCES training_modules(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) NOT NULL, -- 'video', 'text', 'quiz', 'interactive'
    content_data JSONB, -- dados específicos do tipo de conteúdo
    order_index INTEGER NOT NULL,
    is_required BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de progresso do usuário
CREATE TABLE IF NOT EXISTS user_training_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    module_id UUID REFERENCES training_modules(id) ON DELETE CASCADE,
    content_id UUID REFERENCES training_content(id) ON DELETE CASCADE,
    status VARCHAR(50) DEFAULT 'not_started', -- 'not_started', 'in_progress', 'completed'
    progress_percentage INTEGER DEFAULT 0,
    time_spent INTEGER DEFAULT 0, -- em segundos
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, content_id)
);

-- Tabela de avaliações
CREATE TABLE IF NOT EXISTS training_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_id UUID REFERENCES training_modules(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    questions JSONB NOT NULL, -- array de questões
    passing_score INTEGER DEFAULT 70,
    max_attempts INTEGER DEFAULT 3,
    time_limit INTEGER, -- em minutos
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de resultados das avaliações
CREATE TABLE IF NOT EXISTS assessment_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    assessment_id UUID REFERENCES training_assessments(id) ON DELETE CASCADE,
    score INTEGER NOT NULL,
    answers JSONB NOT NULL, -- respostas do usuário
    passed BOOLEAN NOT NULL,
    attempt_number INTEGER DEFAULT 1,
    time_taken INTEGER, -- em segundos
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================================================
-- CONFIGURAÇÃO DE SEGURANÇA (RLS - Row Level Security)
-- =====================================================================================

-- Habilita Row Level Security (RLS)
ALTER TABLE training_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_training_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_results ENABLE ROW LEVEL SECURITY;

-- Remove políticas existentes se houver (para evitar conflitos)
DROP POLICY IF EXISTS "Usuários podem visualizar módulos ativos" ON training_modules;
DROP POLICY IF EXISTS "Admins podem gerenciar módulos" ON training_modules;
DROP POLICY IF EXISTS "Usuários podem visualizar conteúdo de módulos ativos" ON training_content;
DROP POLICY IF EXISTS "Admins podem gerenciar conteúdo" ON training_content;
DROP POLICY IF EXISTS "Usuários podem ver seu próprio progresso" ON user_training_progress;
DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio progresso" ON user_training_progress;
DROP POLICY IF EXISTS "Usuários podem modificar seu próprio progresso" ON user_training_progress;
DROP POLICY IF EXISTS "Admins podem ver todo progresso" ON user_training_progress;
DROP POLICY IF EXISTS "Usuários podem visualizar avaliações ativas" ON training_assessments;
DROP POLICY IF EXISTS "Admins podem gerenciar avaliações" ON training_assessments;
DROP POLICY IF EXISTS "Usuários podem ver seus próprios resultados" ON assessment_results;
DROP POLICY IF EXISTS "Usuários podem inserir seus próprios resultados" ON assessment_results;
DROP POLICY IF EXISTS "Admins podem ver todos os resultados" ON assessment_results;

-- Políticas RLS para training_modules
CREATE POLICY "Usuários podem visualizar módulos ativos" ON training_modules
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins podem gerenciar módulos" ON training_modules
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Políticas RLS para training_content
CREATE POLICY "Usuários podem visualizar conteúdo de módulos ativos" ON training_content
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM training_modules tm 
            WHERE tm.id = training_content.module_id AND tm.is_active = true
        )
    );

CREATE POLICY "Admins podem gerenciar conteúdo" ON training_content
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Políticas RLS para user_training_progress
CREATE POLICY "Usuários podem ver seu próprio progresso" ON user_training_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem atualizar seu próprio progresso" ON user_training_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuários podem modificar seu próprio progresso" ON user_training_progress
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins podem ver todo progresso" ON user_training_progress
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Políticas RLS para training_assessments
CREATE POLICY "Usuários podem visualizar avaliações ativas" ON training_assessments
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admins podem gerenciar avaliações" ON training_assessments
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- Políticas RLS para assessment_results
CREATE POLICY "Usuários podem ver seus próprios resultados" ON assessment_results
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuários podem inserir seus próprios resultados" ON assessment_results
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins podem ver todos os resultados" ON assessment_results
    FOR ALL USING (auth.jwt() ->> 'role' = 'admin');

-- =====================================================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================================================

CREATE INDEX IF NOT EXISTS idx_training_content_module_id ON training_content(module_id);
CREATE INDEX IF NOT EXISTS idx_training_content_order ON training_content(module_id, order_index);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_training_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_module_id ON user_training_progress(module_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_user_id ON assessment_results(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_results_assessment_id ON assessment_results(assessment_id);

-- =====================================================================================
-- PERMISSÕES BÁSICAS
-- =====================================================================================

-- Concede permissões básicas aos roles anon e authenticated
GRANT SELECT ON training_modules TO anon, authenticated;
GRANT SELECT ON training_content TO anon, authenticated;
GRANT ALL ON user_training_progress TO authenticated;
GRANT SELECT ON training_assessments TO anon, authenticated;
GRANT ALL ON assessment_results TO authenticated;

-- =====================================================================================
-- DADOS DE EXEMPLO (OPCIONAL)
-- =====================================================================================

-- Insere módulos de exemplo
INSERT INTO training_modules (title, description, category, difficulty_level, estimated_duration) VALUES
('Introdução ao Sistema Solar', 'Conceitos básicos sobre energia solar fotovoltaica', 'Fundamentos', 'beginner', 60),
('Dimensionamento de Sistemas', 'Como calcular e dimensionar sistemas fotovoltaicos', 'Técnico', 'intermediate', 120),
('Vendas e Atendimento', 'Técnicas de vendas para energia solar', 'Comercial', 'beginner', 90);

-- Insere conteúdo de exemplo para o primeiro módulo
INSERT INTO training_content (module_id, title, content_type, content_data, order_index) 
SELECT 
    tm.id,
    'Vídeo Introdutório',
    'video',
    '{"video_url": "https://example.com/video1.mp4", "duration": 900}',
    1
FROM training_modules tm WHERE tm.title = 'Introdução ao Sistema Solar';

-- Insere avaliação de exemplo
INSERT INTO training_assessments (module_id, title, description, questions, passing_score)
SELECT 
    tm.id,
    'Avaliação - Introdução ao Sistema Solar',
    'Teste seus conhecimentos sobre os conceitos básicos',
    '[{"question": "O que é energia solar fotovoltaiva?", "type": "multiple_choice", "options": ["Conversão de luz em eletricidade", "Aquecimento de água", "Energia eólica"], "correct": 0}]',
    70
FROM training_modules tm WHERE tm.title = 'Introdução ao Sistema Solar';

-- =====================================================================================
-- VERIFICAÇÃO FINAL
-- =====================================================================================

-- Verifica se as tabelas foram criadas
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%training%' 
OR tablename LIKE '%assessment%'
ORDER BY tablename;

-- Verifica se as políticas RLS foram criadas
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE schemaname = 'public' 
AND (tablename LIKE '%training%' OR tablename LIKE '%assessment%')
ORDER BY tablename, policyname;

-- =====================================================================================
-- INSTRUÇÕES FINAIS
-- =====================================================================================

/*
🎉 SETUP CONCLUÍDO!

Após executar este SQL, você terá:
✅ 5 tabelas criadas para o módulo de treinamentos
✅ Políticas RLS configuradas para segurança
✅ Índices para melhor performance
✅ Permissões básicas configuradas
✅ Dados de exemplo inseridos

Próximos passos:
1. Verificar se todas as tabelas foram criadas (query de verificação acima)
2. Testar a integração com o frontend
3. Ajustar as políticas RLS conforme necessário
4. Adicionar mais conteúdo de treinamento

Para testar a conexão do frontend:
- Execute: node execute-training-sql.js
- Verifique se todas as tabelas aparecem como "OK"
*/