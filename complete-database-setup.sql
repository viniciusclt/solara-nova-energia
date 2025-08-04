-- Script completo para configuração do banco de dados Supabase
-- Execute este SQL no Supabase Dashboard > SQL Editor
-- IMPORTANTE: Execute em ordem sequencial

-- ========================================
-- 1. CRIAÇÃO DOS ENUMS
-- ========================================

-- Create enum for user access types (with existence check)
DO $$ BEGIN
    CREATE TYPE public.user_access_type AS ENUM ('vendedor', 'engenheiro', 'admin', 'super_admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create enum for subscription status (with existence check)
DO $$ BEGIN
    CREATE TYPE public.subscription_status AS ENUM ('ativa', 'expirada', 'gratuita', 'cancelada');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ========================================
-- 2. CRIAÇÃO DAS TABELAS PRINCIPAIS
-- ========================================

-- Create companies table
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  cnpj TEXT UNIQUE NOT NULL,
  address TEXT,
  num_employees INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create subscriptions table
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  status subscription_status NOT NULL DEFAULT 'ativa',
  monthly_value DECIMAL(10,2),
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE,
  authorized_employees INTEGER NOT NULL DEFAULT 1,
  stripe_subscription_id TEXT,
  is_free BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  access_type user_access_type NOT NULL DEFAULT 'vendedor',
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  two_factor_secret TEXT,
  last_login TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create audit logs table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  details JSONB,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- ========================================
-- 3. CRIAÇÃO DAS TABELAS ADICIONAIS
-- ========================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN DEFAULT false,
  action_url VARCHAR(500),
  metadata JSONB DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create instituicoes_financeiras table
CREATE TABLE IF NOT EXISTS public.instituicoes_financeiras (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  tipo VARCHAR(50) NOT NULL CHECK (tipo IN ('banco', 'financeira', 'cooperativa', 'fintech')),
  cnpj VARCHAR(18),
  telefone VARCHAR(20),
  email VARCHAR(255),
  website VARCHAR(500),
  endereco TEXT,
  cidade VARCHAR(100),
  estado VARCHAR(2),
  cep VARCHAR(10),
  contato_principal VARCHAR(255),
  cargo_contato VARCHAR(100),
  telefone_contato VARCHAR(20),
  email_contato VARCHAR(255),
  observacoes TEXT,
  ativo BOOLEAN DEFAULT true,
  taxa_juros DECIMAL(5,2),
  prazo_max INTEGER,
  valor_min DECIMAL(12,2),
  valor_max DECIMAL(12,2),
  documentos_necessarios TEXT[],
  tempo_aprovacao INTEGER,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create financial_kits table
CREATE TABLE IF NOT EXISTS public.financial_kits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create shared_proposals table
CREATE TABLE IF NOT EXISTS public.shared_proposals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  proposal_id UUID NOT NULL,
  shared_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  shared_with_email VARCHAR(255) NOT NULL,
  access_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create solar_modules table
CREATE TABLE IF NOT EXISTS public.solar_modules (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  manufacturer VARCHAR(255) NOT NULL,
  model VARCHAR(255) NOT NULL,
  power_rating DECIMAL(8,2) NOT NULL,
  efficiency DECIMAL(5,2),
  voltage_max_power DECIMAL(6,2),
  current_max_power DECIMAL(6,2),
  open_circuit_voltage DECIMAL(6,2),
  short_circuit_current DECIMAL(6,2),
  temperature_coefficient DECIMAL(5,4),
  dimensions_length DECIMAL(6,2),
  dimensions_width DECIMAL(6,2),
  dimensions_height DECIMAL(6,2),
  weight DECIMAL(6,2),
  warranty_years INTEGER,
  datasheet_url VARCHAR(500),
  price DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create inverters table
CREATE TABLE IF NOT EXISTS public.inverters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  manufacturer VARCHAR(255) NOT NULL,
  model VARCHAR(255) NOT NULL,
  power_rating DECIMAL(8,2) NOT NULL,
  input_voltage_range VARCHAR(50),
  output_voltage VARCHAR(50),
  efficiency DECIMAL(5,2),
  mppt_channels INTEGER,
  max_input_current DECIMAL(6,2),
  dimensions_length DECIMAL(6,2),
  dimensions_width DECIMAL(6,2),
  dimensions_height DECIMAL(6,2),
  weight DECIMAL(6,2),
  warranty_years INTEGER,
  datasheet_url VARCHAR(500),
  price DECIMAL(10,2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================
-- 4. HABILITAÇÃO DO RLS
-- ========================================

-- Enable Row Level Security
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instituicoes_financeiras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shared_proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.solar_modules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inverters ENABLE ROW LEVEL SECURITY;

-- ========================================
-- 5. POLÍTICAS RLS PARA COMPANIES
-- ========================================

DROP POLICY IF EXISTS "Users can view their own company" ON public.companies;
CREATE POLICY "Users can view their own company" ON public.companies
  FOR SELECT USING (
    id IN (
      SELECT company_id FROM public.profiles WHERE id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND access_type = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "Company admins can update their company" ON public.companies;
CREATE POLICY "Company admins can update their company" ON public.companies
  FOR UPDATE USING (
    id IN (
      SELECT company_id FROM public.profiles 
      WHERE id = auth.uid() AND access_type IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Super admins can insert companies" ON public.companies;
CREATE POLICY "Super admins can insert companies" ON public.companies
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND access_type = 'super_admin'
    )
  );

-- ========================================
-- 6. POLÍTICAS RLS PARA PROFILES
-- ========================================

DROP POLICY IF EXISTS "Users can view profiles in their company" ON public.profiles;
CREATE POLICY "Users can view profiles in their company" ON public.profiles
  FOR SELECT USING (
    id = auth.uid() OR
    company_id IN (
      SELECT company_id FROM public.profiles 
      WHERE id = auth.uid() AND access_type IN ('admin', 'super_admin')
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND access_type = 'super_admin'
    )
  );

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

DROP POLICY IF EXISTS "Company admins can update team profiles" ON public.profiles;
CREATE POLICY "Company admins can update team profiles" ON public.profiles
  FOR UPDATE USING (
    company_id IN (
      SELECT company_id FROM public.profiles 
      WHERE id = auth.uid() AND access_type IN ('admin', 'super_admin')
    )
  );

DROP POLICY IF EXISTS "Company admins can insert team profiles" ON public.profiles;
CREATE POLICY "Company admins can insert team profiles" ON public.profiles
  FOR INSERT WITH CHECK (
    company_id IN (
      SELECT company_id FROM public.profiles 
      WHERE id = auth.uid() AND access_type IN ('admin', 'super_admin')
    ) OR
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND access_type = 'super_admin'
    )
  );

-- ========================================
-- 7. FUNÇÕES E TRIGGERS
-- ========================================

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, access_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    'vendedor'::user_access_type
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_companies_updated_at ON public.companies;
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_subscriptions_updated_at ON public.subscriptions;
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ========================================
-- 8. CRIAÇÃO DA EMPRESA CACTOS
-- ========================================

-- Inserir empresa Cactos
INSERT INTO public.companies (
  name, 
  cnpj, 
  address, 
  num_employees
) VALUES (
  'Cactos - Soluções em Energia', 
  '00.000.000/0001-00', 
  'Endereço a ser definido', 
  10
) ON CONFLICT (cnpj) DO UPDATE SET
  name = EXCLUDED.name,
  address = EXCLUDED.address,
  num_employees = EXCLUDED.num_employees,
  updated_at = now();

-- Criar assinatura para a empresa Cactos
INSERT INTO public.subscriptions (
  company_id,
  status,
  monthly_value,
  start_date,
  end_date,
  authorized_employees,
  is_free
) VALUES (
  (SELECT id FROM public.companies WHERE cnpj = '00.000.000/0001-00' LIMIT 1),
  'ativa'::subscription_status,
  0.00,
  now(),
  now() + interval '1 year',
  50,
  true
) ON CONFLICT DO NOTHING;

-- ========================================
-- 9. VERIFICAÇÕES FINAIS
-- ========================================

-- Verificar tabelas criadas
SELECT 
  'TABELAS CRIADAS COM SUCESSO:' as status,
  tablename
FROM pg_tables 
WHERE schemaname = 'public'
  AND tablename IN (
    'companies', 'profiles', 'subscriptions', 'audit_logs',
    'notifications', 'instituicoes_financeiras', 'financial_kits',
    'shared_proposals', 'solar_modules', 'inverters'
  )
ORDER BY tablename;

-- Verificar empresa Cactos
SELECT 
  'EMPRESA CACTOS:' as status,
  id,
  name,
  cnpj,
  num_employees,
  created_at
FROM public.companies 
WHERE cnpj = '00.000.000/0001-00';

-- Verificar assinatura da empresa
SELECT 
  'ASSINATURA CACTOS:' as status,
  s.id,
  s.status,
  s.is_free,
  s.authorized_employees,
  c.name as company_name
FROM public.subscriptions s
JOIN public.companies c ON s.company_id = c.id
WHERE c.cnpj = '00.000.000/0001-00';

-- ========================================
-- 10. PRÓXIMOS PASSOS
-- ========================================

/*
PRÓXIMOS PASSOS PARA CRIAR O USUÁRIO SUPER ADMIN:

1. Vá para o Supabase Dashboard > Authentication > Users
2. Clique em "Add user"
3. Preencha:
   - Email: vinicius@energiacactos.com.br
   - Password: [senha segura]
   - Email Confirm: true
4. Após criar o usuário, copie o UUID gerado
5. Execute o SQL abaixo substituindo 'USER_UUID_AQUI' pelo UUID real:

UPDATE public.profiles SET 
  name = 'Vinícius',
  access_type = 'super_admin'::user_access_type,
  company_id = (
    SELECT id FROM public.companies 
    WHERE cnpj = '00.000.000/0001-00' 
    LIMIT 1
  ),
  updated_at = now()
WHERE id = 'USER_UUID_AQUI';

6. Verificar se foi atualizado:
SELECT 
  p.id,
  p.name,
  p.email,
  p.access_type,
  c.name as company_name
FROM public.profiles p
JOIN public.companies c ON p.company_id = c.id
WHERE p.email = 'vinicius@energiacactos.com.br';
*/

SELECT 'CONFIGURAÇÃO DO BANCO DE DADOS CONCLUÍDA COM SUCESSO!' as resultado;
SELECT 'Agora crie o usuário Vinícius manualmente no Authentication > Users' as proximo_passo;