-- =====================================================
-- SCRIPT PARA CORRIGIR TABELAS FALTANTES NO SUPABASE
-- =====================================================
-- Execute este script no Supabase Dashboard > SQL Editor
-- para resolver os erros reportados na aplicação
--
-- VERSÃO CORRIGIDA - 2024 (v3)
-- - Verifica se tabelas já existem antes de criar
-- - Adiciona colunas faltantes dinamicamente
-- - Políticas condicionais baseadas na estrutura existente
-- - Compatível com estruturas de banco existentes
-- - CORRIGIDO: Adiciona colunas antes de criar foreign key constraints
-- - CORRIGIDO: Ordem correta de criação de colunas e constraints
-- - CORRIGIDO: Adiciona todas as colunas necessárias (read, type, priority, etc.)
-- - CORRIGIDO: Verifica colunas antes de criar índices e triggers

-- 1. CRIAR TABELA user_settings
-- Usada pelo SettingsModal.tsx para armazenar configurações do usuário
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  google_api_key TEXT,
  preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Habilitar RLS
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Política para user_settings (remover se existir e recriar)
DROP POLICY IF EXISTS "Users can manage their own settings" ON public.user_settings;
CREATE POLICY "Users can manage their own settings" ON public.user_settings
  FOR ALL USING (auth.uid() = user_id);

-- 2. VERIFICAR E CORRIGIR TABELA integration_settings
-- A tabela pode já existir, mas sem a referência correta para companies
DO $$
BEGIN
  -- Primeiro, verificar se a coluna company_id existe, se não, adicionar
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'integration_settings' 
    AND column_name = 'company_id'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.integration_settings ADD COLUMN company_id UUID;
  END IF;
  
  -- Adicionar coluna integration_type se não existir (referenciada nos índices)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'integration_settings' 
    AND column_name = 'integration_type'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.integration_settings ADD COLUMN integration_type TEXT;
  END IF;
  
  -- Adicionar coluna updated_at se não existir (para o trigger)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'integration_settings' 
    AND column_name = 'updated_at'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.integration_settings ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
  
  -- Depois, verificar se a constraint de foreign key existe
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'integration_settings_company_id_fkey'
    AND table_name = 'integration_settings'
    AND table_schema = 'public'
  ) THEN
    -- Adicionar a constraint se não existir
    ALTER TABLE public.integration_settings 
    ADD CONSTRAINT integration_settings_company_id_fkey 
    FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Habilitar RLS
ALTER TABLE public.integration_settings ENABLE ROW LEVEL SECURITY;

-- Política para integration_settings (remover se existir e recriar)
DROP POLICY IF EXISTS "Users can manage their company integration settings" ON public.integration_settings;
DROP POLICY IF EXISTS "Users can manage their own integration settings" ON public.integration_settings;

-- Criar política mais simples primeiro (só user_id)
CREATE POLICY "Users can manage their own integration settings" ON public.integration_settings
  FOR ALL USING (auth.uid() = user_id);

-- Tentar criar política com company_id (pode falhar se a coluna não existir ainda)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'integration_settings' 
    AND column_name = 'company_id'
  ) THEN
    DROP POLICY IF EXISTS "Users can manage their own integration settings" ON public.integration_settings;
    CREATE POLICY "Users can manage their company integration settings" ON public.integration_settings
      FOR ALL USING (
        auth.uid() = user_id OR 
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.company_id = integration_settings.company_id
        )
      );
  END IF;
END $$;

-- 3. VERIFICAR E CORRIGIR TABELA audit_logs
-- A tabela pode já existir com estrutura diferente
DO $$
BEGIN
  -- Verificar se a tabela existe, se não, criar
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'audit_logs' AND table_schema = 'public'
  ) THEN
    CREATE TABLE public.audit_logs (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
      action TEXT NOT NULL,
      details JSONB,
      ip_address INET,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
  
  -- Adicionar colunas que podem estar faltando
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'audit_logs' AND column_name = 'details'
  ) THEN
    ALTER TABLE public.audit_logs ADD COLUMN details JSONB;
  END IF;
END $$;

-- Habilitar RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Política para audit_logs (remover se existir e recriar)
DROP POLICY IF EXISTS "Users can view their company audit logs" ON public.audit_logs;
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.audit_logs;
CREATE POLICY "Users can view their own audit logs" ON public.audit_logs
  FOR SELECT USING (auth.uid() = user_id);

-- 4. VERIFICAR E CORRIGIR TABELA notifications
-- Usada pelo sistema de notificações
DO $$
BEGIN
  -- Verificar se a tabela existe, se não, criar
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_name = 'notifications' AND table_schema = 'public'
  ) THEN
    CREATE TABLE public.notifications (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'info',
      priority TEXT NOT NULL DEFAULT 'normal',
      read BOOLEAN DEFAULT false,
      user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
      action_url TEXT,
      action_label TEXT,
      expires_at TIMESTAMP WITH TIME ZONE,
      metadata JSONB DEFAULT '{}',
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  END IF;
  
  -- Primeiro, adicionar company_id se não existir (sem foreign key)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'company_id'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN company_id UUID;
  END IF;
  
  -- Adicionar colunas faltantes se não existirem
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'read'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN read BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'type'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN type TEXT NOT NULL DEFAULT 'info';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'priority'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN priority TEXT NOT NULL DEFAULT 'normal';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'action_url'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN action_url TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'action_label'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN action_label TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'expires_at'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN expires_at TIMESTAMP WITH TIME ZONE;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'metadata'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN metadata JSONB DEFAULT '{}';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' 
    AND column_name = 'updated_at'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.notifications ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
  END IF;
  
  -- Depois, adicionar a foreign key constraint se não existir
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'notifications_company_id_fkey'
    AND table_name = 'notifications'
    AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.notifications 
    ADD CONSTRAINT notifications_company_id_fkey 
    FOREIGN KEY (company_id) REFERENCES public.companies(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Habilitar RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Política para notifications (remover se existir e recriar)
DROP POLICY IF EXISTS "Users can manage their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can manage their company notifications" ON public.notifications;

-- Criar política básica primeiro
CREATE POLICY "Users can manage their own notifications" ON public.notifications
  FOR ALL USING (auth.uid() = user_id);

-- Tentar criar política com company_id se a coluna existir
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'company_id'
  ) THEN
    DROP POLICY IF EXISTS "Users can manage their own notifications" ON public.notifications;
    CREATE POLICY "Users can manage their company notifications" ON public.notifications
      FOR ALL USING (
        auth.uid() = user_id OR 
        EXISTS (
          SELECT 1 FROM public.profiles 
          WHERE profiles.id = auth.uid() 
          AND profiles.company_id = notifications.company_id
        )
      );
  END IF;
END $$;

-- =====================================================
-- ÍNDICES PARA PERFORMANCE
-- =====================================================

-- Índices para user_settings
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

-- Índices para integration_settings
CREATE INDEX IF NOT EXISTS idx_integration_settings_user_id ON public.integration_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_integration_settings_company_id ON public.integration_settings(company_id);
CREATE INDEX IF NOT EXISTS idx_integration_settings_type ON public.integration_settings(integration_type);

-- Índices para audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

-- Índices para notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON public.notifications(expires_at);

-- Índice condicional para company_id se a coluna existir
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notifications' AND column_name = 'company_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_notifications_company_id ON public.notifications(company_id);
  END IF;
END $$;

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at (remover se existirem e recriar)
DROP TRIGGER IF EXISTS update_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_integration_settings_updated_at ON public.integration_settings;
CREATE TRIGGER update_integration_settings_updated_at
    BEFORE UPDATE ON public.integration_settings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_notifications_updated_at ON public.notifications;
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON public.notifications
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();