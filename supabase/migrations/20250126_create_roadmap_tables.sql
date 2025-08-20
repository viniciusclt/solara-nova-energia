-- Migração para Sistema de Roadmap e Votação
-- Criado em: 2025-01-26
-- Descrição: Tabelas para funcionalidades de roadmap, votação e gerenciamento de status

-- Tabela principal para funcionalidades do roadmap
CREATE TABLE IF NOT EXISTS roadmap_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('frontend', 'backend', 'design', 'infrastructure', 'mobile', 'api', 'ui_ux', 'performance')),
    status VARCHAR(20) NOT NULL DEFAULT 'voting' CHECK (status IN ('voting', 'planned', 'in_progress', 'completed', 'cancelled')),
    priority VARCHAR(10) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
    votes_count INTEGER DEFAULT 0,
    estimated_effort INTEGER, -- em horas
    target_release VARCHAR(50), -- versão alvo
    tags TEXT[], -- tags adicionais
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Tabela de votos
CREATE TABLE IF NOT EXISTS feature_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_id UUID REFERENCES roadmap_features(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('up', 'down')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(feature_id, user_id)
);

-- Tabela de comentários nas funcionalidades
CREATE TABLE IF NOT EXISTS feature_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_id UUID REFERENCES roadmap_features(id) ON DELETE CASCADE,
    user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    comment TEXT NOT NULL,
    parent_comment_id UUID REFERENCES feature_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de histórico de mudanças de status
CREATE TABLE IF NOT EXISTS feature_status_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_id UUID REFERENCES roadmap_features(id) ON DELETE CASCADE,
    old_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    changed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    change_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_roadmap_features_status ON roadmap_features(status);
CREATE INDEX IF NOT EXISTS idx_roadmap_features_category ON roadmap_features(category);
CREATE INDEX IF NOT EXISTS idx_roadmap_features_votes ON roadmap_features(votes_count DESC);
CREATE INDEX IF NOT EXISTS idx_roadmap_features_priority ON roadmap_features(priority);
CREATE INDEX IF NOT EXISTS idx_roadmap_features_created_at ON roadmap_features(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feature_votes_feature_id ON feature_votes(feature_id);
CREATE INDEX IF NOT EXISTS idx_feature_votes_user_id ON feature_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_feature_comments_feature_id ON feature_comments(feature_id);
CREATE INDEX IF NOT EXISTS idx_feature_comments_parent ON feature_comments(parent_comment_id);
CREATE INDEX IF NOT EXISTS idx_feature_status_history_feature ON feature_status_history(feature_id);

-- Function para atualizar contador de votos
CREATE OR REPLACE FUNCTION update_feature_votes_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE roadmap_features 
        SET votes_count = (
            SELECT COUNT(*) FROM feature_votes 
            WHERE feature_id = NEW.feature_id AND vote_type = 'up'
        ) - (
            SELECT COUNT(*) FROM feature_votes 
            WHERE feature_id = NEW.feature_id AND vote_type = 'down'
        ),
        updated_at = NOW()
        WHERE id = NEW.feature_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE roadmap_features 
        SET votes_count = (
            SELECT COUNT(*) FROM feature_votes 
            WHERE feature_id = NEW.feature_id AND vote_type = 'up'
        ) - (
            SELECT COUNT(*) FROM feature_votes 
            WHERE feature_id = NEW.feature_id AND vote_type = 'down'
        ),
        updated_at = NOW()
        WHERE id = NEW.feature_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE roadmap_features 
        SET votes_count = (
            SELECT COUNT(*) FROM feature_votes 
            WHERE feature_id = OLD.feature_id AND vote_type = 'up'
        ) - (
            SELECT COUNT(*) FROM feature_votes 
            WHERE feature_id = OLD.feature_id AND vote_type = 'down'
        ),
        updated_at = NOW()
        WHERE id = OLD.feature_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para contador de votos
DROP TRIGGER IF EXISTS trigger_update_votes_count ON feature_votes;
CREATE TRIGGER trigger_update_votes_count
    AFTER INSERT OR UPDATE OR DELETE ON feature_votes
    FOR EACH ROW EXECUTE FUNCTION update_feature_votes_count();

-- Function para registrar mudanças de status
CREATE OR REPLACE FUNCTION log_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO feature_status_history (feature_id, old_status, new_status, changed_by, change_reason)
        VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            NEW.assigned_to, -- ou poderia ser um campo específico para quem fez a mudança
            CASE 
                WHEN NEW.status = 'planned' THEN 'Funcionalidade aprovada para desenvolvimento'
                WHEN NEW.status = 'in_progress' THEN 'Desenvolvimento iniciado'
                WHEN NEW.status = 'completed' THEN 'Funcionalidade concluída'
                WHEN NEW.status = 'cancelled' THEN 'Funcionalidade cancelada'
                ELSE 'Status atualizado'
            END
        );
        
        -- Atualizar completed_at quando status for completed
        IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
            NEW.completed_at = NOW();
        ELSIF NEW.status != 'completed' THEN
            NEW.completed_at = NULL;
        END IF;
    END IF;
    
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para log de mudanças de status
DROP TRIGGER IF EXISTS trigger_log_status_change ON roadmap_features;
CREATE TRIGGER trigger_log_status_change
    BEFORE UPDATE ON roadmap_features
    FOR EACH ROW EXECUTE FUNCTION log_status_change();

-- Function para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para updated_at
DROP TRIGGER IF EXISTS trigger_update_feature_votes_updated_at ON feature_votes;
CREATE TRIGGER trigger_update_feature_votes_updated_at
    BEFORE UPDATE ON feature_votes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS trigger_update_feature_comments_updated_at ON feature_comments;
CREATE TRIGGER trigger_update_feature_comments_updated_at
    BEFORE UPDATE ON feature_comments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS nas tabelas
ALTER TABLE roadmap_features ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_status_history ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para roadmap_features
DROP POLICY IF EXISTS "Roadmap features são visíveis para todos" ON roadmap_features;
CREATE POLICY "Roadmap features são visíveis para todos" ON roadmap_features
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Usuários autenticados podem criar features" ON roadmap_features;
CREATE POLICY "Usuários autenticados podem criar features" ON roadmap_features
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Criadores podem editar suas features" ON roadmap_features;
CREATE POLICY "Criadores podem editar suas features" ON roadmap_features
    FOR UPDATE USING (
        auth.uid() = created_by OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND access_type IN ('admin', 'super_admin')
        )
    );

DROP POLICY IF EXISTS "Apenas admins podem deletar features" ON roadmap_features;
CREATE POLICY "Apenas admins podem deletar features" ON roadmap_features
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND access_type IN ('admin', 'super_admin')
        )
    );

-- Políticas RLS para feature_votes
DROP POLICY IF EXISTS "Votos são visíveis para todos" ON feature_votes;
CREATE POLICY "Votos são visíveis para todos" ON feature_votes
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Usuários podem votar" ON feature_votes;
CREATE POLICY "Usuários podem votar" ON feature_votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem alterar seus votos" ON feature_votes;
CREATE POLICY "Usuários podem alterar seus votos" ON feature_votes
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar seus votos" ON feature_votes;
CREATE POLICY "Usuários podem deletar seus votos" ON feature_votes
    FOR DELETE USING (auth.uid() = user_id);

-- Políticas RLS para feature_comments
DROP POLICY IF EXISTS "Comentários são visíveis para todos" ON feature_comments;
CREATE POLICY "Comentários são visíveis para todos" ON feature_comments
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Usuários podem comentar" ON feature_comments;
CREATE POLICY "Usuários podem comentar" ON feature_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem editar seus comentários" ON feature_comments;
CREATE POLICY "Usuários podem editar seus comentários" ON feature_comments
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Usuários podem deletar seus comentários" ON feature_comments;
CREATE POLICY "Usuários podem deletar seus comentários" ON feature_comments
    FOR DELETE USING (
        auth.uid() = user_id OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND access_type IN ('admin', 'super_admin')
        )
    );

-- Políticas RLS para feature_status_history
DROP POLICY IF EXISTS "Histórico de status é visível para todos" ON feature_status_history;
CREATE POLICY "Histórico de status é visível para todos" ON feature_status_history
    FOR SELECT USING (true);

-- Inserir dados de exemplo (opcional)
INSERT INTO roadmap_features (title, description, category, status, priority, created_by) 
SELECT 
    'Sistema de Notificações Push',
    'Implementar notificações push em tempo real para alertas importantes',
    'frontend',
    'voting',
    'high',
    (SELECT id FROM profiles WHERE access_type = 'super_admin' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM roadmap_features WHERE title = 'Sistema de Notificações Push');

INSERT INTO roadmap_features (title, description, category, status, priority, created_by) 
SELECT 
    'Editor Drag-and-Drop para Propostas',
    'Criar editor visual com funcionalidade de arrastar e soltar para criação de propostas',
    'frontend',
    'planned',
    'high',
    (SELECT id FROM profiles WHERE access_type = 'super_admin' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM roadmap_features WHERE title = 'Editor Drag-and-Drop para Propostas');

INSERT INTO roadmap_features (title, description, category, status, priority, created_by) 
SELECT 
    'API de Integração com CRM',
    'Desenvolver API para integração com sistemas de CRM externos',
    'backend',
    'voting',
    'medium',
    (SELECT id FROM profiles WHERE access_type = 'super_admin' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM roadmap_features WHERE title = 'API de Integração com CRM');

INSERT INTO roadmap_features (title, description, category, status, priority, created_by) 
SELECT 
    'Modo Escuro',
    'Implementar tema escuro para toda a aplicação',
    'ui_ux',
    'voting',
    'low',
    (SELECT id FROM profiles WHERE access_type = 'super_admin' LIMIT 1)
WHERE NOT EXISTS (SELECT 1 FROM roadmap_features WHERE title = 'Modo Escuro');

-- Conceder permissões para roles
GRANT SELECT, INSERT, UPDATE, DELETE ON roadmap_features TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON feature_votes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON feature_comments TO authenticated;
GRANT SELECT ON feature_status_history TO authenticated;

GRANT SELECT ON roadmap_features TO anon;
GRANT SELECT ON feature_votes TO anon;
GRANT SELECT ON feature_comments TO anon;
GRANT SELECT ON feature_status_history TO anon;

-- Comentários nas tabelas
COMMENT ON TABLE roadmap_features IS 'Tabela principal para funcionalidades do roadmap com sistema de votação';
COMMENT ON TABLE feature_votes IS 'Tabela de votos dos usuários nas funcionalidades';
COMMENT ON TABLE feature_comments IS 'Tabela de comentários nas funcionalidades';
COMMENT ON TABLE feature_status_history IS 'Histórico de mudanças de status das funcionalidades';

COMMENT ON COLUMN roadmap_features.votes_count IS 'Contador calculado automaticamente: votos positivos - votos negativos';
COMMENT ON COLUMN roadmap_features.estimated_effort IS 'Estimativa de esforço em horas';
COMMENT ON COLUMN roadmap_features.target_release IS 'Versão alvo para implementação';
COMMENT ON COLUMN roadmap_features.tags IS 'Tags adicionais para categorização';