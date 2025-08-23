-- =====================================================
-- CRIAÇÃO DAS TABELAS DE PROPOSTAS - EXECUÇÃO MANUAL
-- =====================================================
-- Execute este SQL no Supabase Dashboard > SQL Editor
-- URL: https://supabasekong-s88048sg48wo40soogsgk0o8.plexus.tec.br/project/default/sql

-- 1. Tabela de Templates de Propostas
CREATE TABLE IF NOT EXISTS public.proposal_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  template_data JSONB DEFAULT '{}',
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Elementos de Propostas
CREATE TABLE IF NOT EXISTS public.proposal_elements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES public.proposal_templates(id) ON DELETE CASCADE,
  element_type VARCHAR(50) NOT NULL,
  element_data JSONB DEFAULT '{}',
  position_x FLOAT DEFAULT 0,
  position_y FLOAT DEFAULT 0,
  width FLOAT DEFAULT 100,
  height FLOAT DEFAULT 50,
  z_index INTEGER DEFAULT 0,
  is_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Índices para Performance
CREATE INDEX IF NOT EXISTS idx_proposal_elements_template ON public.proposal_elements(template_id);
CREATE INDEX IF NOT EXISTS idx_proposal_elements_type ON public.proposal_elements(element_type);
CREATE INDEX IF NOT EXISTS idx_proposal_elements_z_index ON public.proposal_elements(z_index);
CREATE INDEX IF NOT EXISTS idx_proposal_templates_company ON public.proposal_templates(company_id);
CREATE INDEX IF NOT EXISTS idx_proposal_templates_active ON public.proposal_templates(is_active);

-- 4. Habilitar Row Level Security (RLS)
ALTER TABLE public.proposal_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_elements ENABLE ROW LEVEL SECURITY;

-- 5. Políticas RLS para proposal_templates
CREATE POLICY "Users can view proposal_templates from their company" ON public.proposal_templates
  FOR SELECT USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can insert proposal_templates for their company" ON public.proposal_templates
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can update proposal_templates from their company" ON public.proposal_templates
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

CREATE POLICY "Users can delete proposal_templates from their company" ON public.proposal_templates
  FOR DELETE USING (
    company_id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- 6. Políticas RLS para proposal_elements
CREATE POLICY "Users can view proposal_elements from their company templates" ON public.proposal_elements
  FOR SELECT USING (
    template_id IN (
      SELECT id FROM public.proposal_templates 
      WHERE company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can insert proposal_elements for their company templates" ON public.proposal_elements
  FOR INSERT WITH CHECK (
    template_id IN (
      SELECT id FROM public.proposal_templates 
      WHERE company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can update proposal_elements from their company templates" ON public.proposal_elements
  FOR UPDATE USING (
    template_id IN (
      SELECT id FROM public.proposal_templates 
      WHERE company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

CREATE POLICY "Users can delete proposal_elements from their company templates" ON public.proposal_elements
  FOR DELETE USING (
    template_id IN (
      SELECT id FROM public.proposal_templates 
      WHERE company_id IN (
        SELECT company_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

-- 7. Inserir dados de exemplo (opcional)
INSERT INTO public.proposal_templates (name, description, template_data, company_id, is_active)
SELECT 
  'Template Padrão',
  'Template básico para propostas comerciais',
  '{"layout": "standard", "theme": "default"}',
  id,
  true
FROM public.companies 
WHERE name = 'Cactos Energia'
ON CONFLICT DO NOTHING;

-- =====================================================
-- VERIFICAÇÃO DAS TABELAS CRIADAS
-- =====================================================
-- Execute estas consultas para verificar se tudo foi criado corretamente:

-- Verificar se as tabelas existem
SELECT 
  schemaname,
  tablename,
  tableowner
FROM pg_tables 
WHERE tablename IN ('proposal_templates', 'proposal_elements')
ORDER BY tablename;

-- Verificar estrutura das tabelas
\d public.proposal_templates;
\d public.proposal_elements;

-- Verificar políticas RLS
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('proposal_templates', 'proposal_elements')
ORDER BY tablename, policyname;

-- =====================================================
-- INSTRUÇÕES DE EXECUÇÃO
-- =====================================================
-- 1. Acesse: https://supabasekong-s88048sg48wo40soogsgk0o8.plexus.tec.br/project/default/sql
-- 2. Cole este SQL completo no editor
-- 3. Clique em "Run" para executar
-- 4. Verifique se não há erros na saída
-- 5. Execute as consultas de verificação no final