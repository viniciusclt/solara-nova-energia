-- =====================================================
-- SETUP COMPLETO DO BANCO DE DADOS - SOLARA NOVA ENERGIA
-- =====================================================
-- Execute este script no SQL Editor do Supabase Dashboard
-- para configurar todas as tabelas e dados necessários

-- =====================================================
-- 1. HABILITAR EXTENSÕES
-- =====================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- 2. CRIAR TABELAS PRINCIPAIS
-- =====================================================

-- Tabela de empresas
CREATE TABLE IF NOT EXISTS public.companies (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    cnpj VARCHAR(18),
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de perfis de usuários
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    full_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    access_type VARCHAR(50) DEFAULT 'user',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de leads
CREATE TABLE IF NOT EXISTS public.leads (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(2),
    zip_code VARCHAR(10),
    consumption_kwh DECIMAL(10,2),
    energy_bill_value DECIMAL(10,2),
    roof_area DECIMAL(10,2),
    roof_type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'new',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de equipamentos (módulos solares)
CREATE TABLE IF NOT EXISTS public.solar_modules (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    manufacturer VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    power_wp INTEGER NOT NULL,
    efficiency DECIMAL(5,2),
    voltage_voc DECIMAL(6,2),
    current_isc DECIMAL(6,2),
    voltage_vmp DECIMAL(6,2),
    current_imp DECIMAL(6,2),
    temperature_coefficient DECIMAL(5,3),
    dimensions_length DECIMAL(6,2),
    dimensions_width DECIMAL(6,2),
    dimensions_height DECIMAL(6,2),
    weight DECIMAL(6,2),
    warranty_years INTEGER,
    price DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de inversores
CREATE TABLE IF NOT EXISTS public.inverters (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    manufacturer VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    power_kw DECIMAL(8,2) NOT NULL,
    efficiency DECIMAL(5,2),
    input_voltage_min DECIMAL(6,2),
    input_voltage_max DECIMAL(6,2),
    mppt_channels INTEGER,
    output_voltage DECIMAL(6,2),
    output_frequency DECIMAL(4,1),
    protection_ip VARCHAR(10),
    dimensions_length DECIMAL(6,2),
    dimensions_width DECIMAL(6,2),
    dimensions_height DECIMAL(6,2),
    weight DECIMAL(6,2),
    warranty_years INTEGER,
    price DECIMAL(10,2),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de propostas
CREATE TABLE IF NOT EXISTS public.proposals (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
    created_by UUID REFERENCES auth.users(id),
    proposal_number VARCHAR(50),
    title VARCHAR(255),
    system_power_kw DECIMAL(8,2),
    estimated_generation_kwh DECIMAL(10,2),
    total_investment DECIMAL(12,2),
    payback_years DECIMAL(4,1),
    savings_25_years DECIMAL(12,2),
    modules_quantity INTEGER,
    module_id UUID REFERENCES public.solar_modules(id),
    inverter_id UUID REFERENCES public.inverters(id),
    status VARCHAR(50) DEFAULT 'draft',
    valid_until DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de logs de auditoria
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabela de notificações
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info',
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. CRIAR ÍNDICES PARA PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_profiles_company_id ON public.profiles(company_id);
CREATE INDEX IF NOT EXISTS idx_leads_company_id ON public.leads(company_id);
CREATE INDEX IF NOT EXISTS idx_leads_created_by ON public.leads(created_by);
CREATE INDEX IF NOT EXISTS idx_solar_modules_company_id ON public.solar_modules(company_id);
CREATE INDEX IF NOT EXISTS idx_inverters_company_id ON public.inverters(company_id);
CREATE INDEX IF NOT EXISTS idx_proposals_company_id ON public.proposals(company_id);
CREATE INDEX IF NOT EXISTS idx_proposals_lead_id ON public.proposals(lead_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_id ON public.audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- =====================================================
-- 4. CONFIGURAR RLS (ROW LEVEL SECURITY)
-- =====================================================
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solar_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inverters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5. CRIAR POLÍTICAS RLS
-- =====================================================

-- Políticas para companies
CREATE POLICY "Users can view their own company" ON public.companies
    FOR SELECT USING (
        id IN (
            SELECT company_id FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

-- Políticas para profiles
CREATE POLICY "Users can view profiles from their company" ON public.profiles
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (id = auth.uid());

-- Políticas para leads
CREATE POLICY "Users can manage leads from their company" ON public.leads
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

-- Políticas para solar_modules
CREATE POLICY "Users can manage modules from their company" ON public.solar_modules
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

-- Políticas para inverters
CREATE POLICY "Users can manage inverters from their company" ON public.inverters
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

-- Políticas para proposals
CREATE POLICY "Users can manage proposals from their company" ON public.proposals
    FOR ALL USING (
        company_id IN (
            SELECT company_id FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

-- Políticas para audit_logs
CREATE POLICY "Users can view audit logs from their company" ON public.audit_logs
    FOR SELECT USING (
        company_id IN (
            SELECT company_id FROM public.profiles 
            WHERE id = auth.uid()
        )
    );

-- Políticas para notifications
CREATE POLICY "Users can manage their own notifications" ON public.notifications
    FOR ALL USING (user_id = auth.uid());

-- =====================================================
-- 6. INSERIR DADOS INICIAIS
-- =====================================================

-- Inserir empresa Cactos
INSERT INTO public.companies (id, name, cnpj, email, phone, address, city, state, zip_code)
VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'Cactos Energia Solar',
    '12.345.678/0001-90',
    'contato@cactosenergia.com.br',
    '(11) 99999-9999',
    'Rua das Energias Renováveis, 123',
    'São Paulo',
    'SP',
    '01234-567'
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    cnpj = EXCLUDED.cnpj,
    email = EXCLUDED.email,
    phone = EXCLUDED.phone,
    address = EXCLUDED.address,
    city = EXCLUDED.city,
    state = EXCLUDED.state,
    zip_code = EXCLUDED.zip_code,
    updated_at = NOW();

-- Inserir alguns módulos solares de exemplo
INSERT INTO public.solar_modules (company_id, manufacturer, model, power_wp, efficiency, price, is_active)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'Canadian Solar', 'CS3W-400P', 400, 20.3, 450.00, true),
    ('550e8400-e29b-41d4-a716-446655440000', 'Jinko Solar', 'JKM410M-54HL4-V', 410, 21.0, 470.00, true),
    ('550e8400-e29b-41d4-a716-446655440000', 'Trina Solar', 'TSM-DE09.08', 405, 20.8, 460.00, true)
ON CONFLICT DO NOTHING;

-- Inserir alguns inversores de exemplo
INSERT INTO public.inverters (company_id, manufacturer, model, power_kw, efficiency, price, is_active)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440000', 'Fronius', 'Primo 5.0-1', 5.0, 96.8, 3500.00, true),
    ('550e8400-e29b-41d4-a716-446655440000', 'SMA', 'Sunny Boy 6.0', 6.0, 97.1, 4200.00, true),
    ('550e8400-e29b-41d4-a716-446655440000', 'ABB', 'UNO-DM-5.0-TL-PLUS', 5.0, 96.5, 3800.00, true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 7. CRIAR FUNÇÕES E TRIGGERS
-- =====================================================

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para atualizar updated_at
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_solar_modules_updated_at BEFORE UPDATE ON public.solar_modules
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inverters_updated_at BEFORE UPDATE ON public.inverters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proposals_updated_at BEFORE UPDATE ON public.proposals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 8. CONFIGURAR STORAGE (BUCKETS)
-- =====================================================

-- Criar bucket para datasheets
INSERT INTO storage.buckets (id, name, public)
VALUES ('datasheets', 'datasheets', true)
ON CONFLICT (id) DO NOTHING;

-- Política para o bucket datasheets
CREATE POLICY "Authenticated users can upload datasheets" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'datasheets' AND 
        auth.role() = 'authenticated'
    );

CREATE POLICY "Authenticated users can view datasheets" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'datasheets' AND 
        auth.role() = 'authenticated'
    );

CREATE POLICY "Authenticated users can delete their datasheets" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'datasheets' AND 
        auth.role() = 'authenticated'
    );

-- =====================================================
-- SETUP COMPLETO!
-- =====================================================
-- Após executar este script:
-- 1. Todas as tabelas estarão criadas
-- 2. RLS estará configurado
-- 3. Dados iniciais estarão inseridos
-- 4. Storage estará configurado
-- 5. Sistema estará pronto para uso!
--
-- Próximo passo: Criar usuário super admin
-- Execute: node create-super-admin.js
-- =====================================================