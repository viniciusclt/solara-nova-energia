-- =====================================================
-- SCRIPT PARA CORRIGIR TABELAS FALTANTES NO SUPABASE
-- =====================================================
-- Execute este script no Supabase Dashboard > SQL Editor
-- para resolver os 6 erros reportados na aplicação

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

-- Habilitar RLS para user_settings
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;

-- Criar política para user_settings
DROP POLICY IF EXISTS "Users can manage their own settings" ON public.user_settings;
CREATE POLICY "Users can manage their own settings" ON public.user_settings
  FOR ALL USING (auth.uid() = user_id);

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON public.user_settings(user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON public.user_settings;
CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON public.user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 2. VERIFICAR SE integration_settings EXISTE
-- Se não existir, criar
CREATE TABLE IF NOT EXISTS public.integration_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_type TEXT NOT NULL,
  settings JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, integration_type)
);

-- Habilitar RLS para integration_settings
ALTER TABLE public.integration_settings ENABLE ROW LEVEL SECURITY;

-- Criar política para integration_settings
DROP POLICY IF EXISTS "Users can manage their own integration settings" ON public.integration_settings;
CREATE POLICY "Users can manage their own integration settings" ON public.integration_settings
  FOR ALL USING (auth.uid() = user_id);

-- Criar índice para performance
CREATE INDEX IF NOT EXISTS idx_integration_settings_user_id ON public.integration_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_integration_settings_type ON public.integration_settings(integration_type);

-- Trigger para updated_at
DROP TRIGGER IF EXISTS update_integration_settings_updated_at ON public.integration_settings;
CREATE TRIGGER update_integration_settings_updated_at
    BEFORE UPDATE ON public.integration_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. VERIFICAR SE audit_logs EXISTE
-- Se não existir, criar
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  table_name TEXT,
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habilitar RLS para audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Criar política para audit_logs (apenas admins podem ver todos os logs)
DROP POLICY IF EXISTS "Users can view their own audit logs" ON public.audit_logs;
CREATE POLICY "Users can view their own audit logs" ON public.audit_logs
  FOR SELECT USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'admin');

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON public.audit_logs(table_name);

-- 4. VERIFICAR SE notifications EXISTE
-- Se não existir, criar
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error')),
  is_read BOOLEAN DEFAULT false,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE
);

-- Habilitar RLS para notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Criar política para notifications
DROP POLICY IF EXISTS "Users can manage their own notifications" ON public.notifications;
CREATE POLICY "Users can manage their own notifications" ON public.notifications
  FOR ALL USING (auth.uid() = user_id);

-- Criar índices para performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);

-- =====================================================
-- VERIFICAÇÃO FINAL
-- =====================================================
-- Execute esta query para verificar se todas as tabelas foram criadas:
/*
SELECT 
  table_name,
  CASE 
    WHEN table_name IN ('user_settings', 'integration_settings', 'audit_logs', 'notifications') 
    THEN '✅ Criada'
    ELSE '❌ Faltando'
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('user_settings', 'integration_settings', 'audit_logs', 'notifications')
ORDER BY table_name;
*/

-- =====================================================
-- INSTRUÇÕES
-- =====================================================
/*
1. Copie todo este script
2. Abra o Supabase Dashboard: https://supabase.com/dashboard
3. Vá para o seu projeto
4. Clique em "SQL Editor" no menu lateral
5. Cole este script na área de texto
6. Clique em "Run" para executar
7. Verifique se não há erros na execução
8. Teste a aplicação novamente

Após executar este script, os 6 erros reportados devem ser resolvidos:
- user_settings: para configurações do usuário
- integration_settings: para configurações de integrações
- audit_logs: para logs de auditoria
- notifications: para notificações do sistema
*/