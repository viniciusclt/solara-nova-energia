-- Migration: Create Proposal Editor Tables
-- Description: Tabelas para o sistema de editor de propostas drag-and-drop
-- Date: 2025-01-26

-- Tabela para templates de propostas
CREATE TABLE proposal_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    format VARCHAR(10) NOT NULL CHECK (format IN ('A4', '16:9')),
    canvas_data JSONB NOT NULL DEFAULT '{}',
    thumbnail_url VARCHAR(500),
    is_public BOOLEAN DEFAULT false,
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    created_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela para elementos do canvas
CREATE TABLE proposal_elements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES proposal_templates(id) ON DELETE CASCADE,
    element_type VARCHAR(50) NOT NULL CHECK (element_type IN ('text', 'image', 'chart', 'table', 'shape')),
    properties JSONB NOT NULL DEFAULT '{}',
    position JSONB NOT NULL DEFAULT '{"x": 0, "y": 0, "width": 100, "height": 100}',
    z_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_proposal_templates_company ON proposal_templates(company_id);
CREATE INDEX idx_proposal_templates_format ON proposal_templates(format);
CREATE INDEX idx_proposal_templates_public ON proposal_templates(is_public);
CREATE INDEX idx_proposal_elements_template ON proposal_elements(template_id);
CREATE INDEX idx_proposal_elements_z_index ON proposal_elements(z_index);
CREATE INDEX idx_proposal_elements_type ON proposal_elements(element_type);

-- Function para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para atualizar updated_at em proposal_templates
CREATE TRIGGER trigger_update_proposal_templates_updated_at
    BEFORE UPDATE ON proposal_templates
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar Row Level Security (RLS)
ALTER TABLE proposal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE proposal_elements ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para proposal_templates
CREATE POLICY "Templates da empresa são visíveis" ON proposal_templates
    FOR SELECT USING (
        company_id = (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        ) OR is_public = true
    );

CREATE POLICY "Usuários podem criar templates" ON proposal_templates
    FOR INSERT WITH CHECK (
        company_id = (
            SELECT company_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Criadores podem editar seus templates" ON proposal_templates
    FOR UPDATE USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND access_type IN ('admin', 'super_admin')
            AND company_id = proposal_templates.company_id
        )
    );

CREATE POLICY "Criadores podem deletar seus templates" ON proposal_templates
    FOR DELETE USING (
        created_by = auth.uid() OR
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE id = auth.uid() 
            AND access_type IN ('admin', 'super_admin')
            AND company_id = proposal_templates.company_id
        )
    );

-- Políticas RLS para proposal_elements
CREATE POLICY "Elementos são visíveis para usuários com acesso ao template" ON proposal_elements
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM proposal_templates pt
            WHERE pt.id = proposal_elements.template_id
            AND (
                pt.company_id = (
                    SELECT company_id FROM profiles WHERE id = auth.uid()
                ) OR pt.is_public = true
            )
        )
    );

CREATE POLICY "Usuários podem criar elementos em templates da empresa" ON proposal_elements
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM proposal_templates pt
            WHERE pt.id = proposal_elements.template_id
            AND pt.company_id = (
                SELECT company_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

CREATE POLICY "Usuários podem editar elementos de templates da empresa" ON proposal_elements
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM proposal_templates pt
            WHERE pt.id = proposal_elements.template_id
            AND (
                pt.created_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() 
                    AND access_type IN ('admin', 'super_admin')
                    AND company_id = pt.company_id
                )
            )
        )
    );

CREATE POLICY "Usuários podem deletar elementos de templates da empresa" ON proposal_elements
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM proposal_templates pt
            WHERE pt.id = proposal_elements.template_id
            AND (
                pt.created_by = auth.uid() OR
                EXISTS (
                    SELECT 1 FROM profiles 
                    WHERE id = auth.uid() 
                    AND access_type IN ('admin', 'super_admin')
                    AND company_id = pt.company_id
                )
            )
        )
    );

-- Inserir dados de exemplo
INSERT INTO proposal_templates (name, format, canvas_data, is_public, company_id, created_by) VALUES
('Template Básico A4', 'A4', '{"width": 794, "height": 1123, "background": "#ffffff"}', true, NULL, NULL),
('Template Apresentação 16:9', '16:9', '{"width": 1920, "height": 1080, "background": "#f8fafc"}', true, NULL, NULL),
('Template Proposta Solar A4', 'A4', '{"width": 794, "height": 1123, "background": "#ffffff", "theme": "solar"}', true, NULL, NULL),
('Template Pitch Deck 16:9', '16:9', '{"width": 1920, "height": 1080, "background": "linear-gradient(135deg, #0EA5E9, #10B981)"}', true, NULL, NULL);

-- Inserir elementos de exemplo para o template básico A4
INSERT INTO proposal_elements (template_id, element_type, properties, position, z_index) VALUES
(
    (SELECT id FROM proposal_templates WHERE name = 'Template Básico A4' LIMIT 1),
    'text',
    '{"content": "Título da Proposta", "fontSize": 24, "fontWeight": "bold", "color": "#1f2937", "textAlign": "center"}',
    '{"x": 50, "y": 50, "width": 694, "height": 60}',
    1
),
(
    (SELECT id FROM proposal_templates WHERE name = 'Template Básico A4' LIMIT 1),
    'text',
    '{"content": "Descrição do projeto e benefícios da energia solar", "fontSize": 14, "color": "#4b5563", "textAlign": "left"}',
    '{"x": 50, "y": 150, "width": 694, "height": 100}',
    2
),
(
    (SELECT id FROM proposal_templates WHERE name = 'Template Básico A4' LIMIT 1),
    'shape',
    '{"type": "rectangle", "fill": "#0EA5E9", "stroke": "none", "opacity": 0.1}',
    '{"x": 50, "y": 300, "width": 694, "height": 200}',
    0
);

-- Inserir elementos de exemplo para o template 16:9
INSERT INTO proposal_elements (template_id, element_type, properties, position, z_index) VALUES
(
    (SELECT id FROM proposal_templates WHERE name = 'Template Apresentação 16:9' LIMIT 1),
    'text',
    '{"content": "Energia Solar", "fontSize": 48, "fontWeight": "bold", "color": "#1f2937", "textAlign": "center"}',
    '{"x": 100, "y": 200, "width": 1720, "height": 100}',
    1
),
(
    (SELECT id FROM proposal_templates WHERE name = 'Template Apresentação 16:9' LIMIT 1),
    'text',
    '{"content": "Soluções sustentáveis para o futuro", "fontSize": 24, "color": "#6b7280", "textAlign": "center"}',
    '{"x": 100, "y": 350, "width": 1720, "height": 60}',
    2
),
(
    (SELECT id FROM proposal_templates WHERE name = 'Template Apresentação 16:9' LIMIT 1),
    'shape',
    '{"type": "circle", "fill": "#10B981", "stroke": "none", "opacity": 0.2}',
    '{"x": 1400, "y": 600, "width": 300, "height": 300}',
    0
);

-- Conceder permissões para roles
GRANT ALL PRIVILEGES ON proposal_templates TO authenticated;
GRANT ALL PRIVILEGES ON proposal_elements TO authenticated;
GRANT SELECT ON proposal_templates TO anon;
GRANT SELECT ON proposal_elements TO anon;

-- Comentários nas tabelas
COMMENT ON TABLE proposal_templates IS 'Templates para o editor de propostas drag-and-drop';
COMMENT ON TABLE proposal_elements IS 'Elementos individuais que compõem os templates de propostas';
COMMENT ON COLUMN proposal_templates.format IS 'Formato do template: A4 (794x1123) ou 16:9 (1920x1080)';
COMMENT ON COLUMN proposal_templates.canvas_data IS 'Configurações do canvas (dimensões, background, tema)';
COMMENT ON COLUMN proposal_elements.element_type IS 'Tipo do elemento: text, image, chart, table, shape';
COMMENT ON COLUMN proposal_elements.properties IS 'Propriedades específicas do elemento (cor, fonte, conteúdo, etc.)';
COMMENT ON COLUMN proposal_elements.position IS 'Posição e dimensões do elemento no canvas';
COMMENT ON COLUMN proposal_elements.z_index IS 'Ordem de camadas do elemento (maior valor = mais à frente)';