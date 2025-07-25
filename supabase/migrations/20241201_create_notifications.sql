-- Criação da tabela de notificações
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(20) NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'success', 'warning', 'error', 'system')),
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  read BOOLEAN NOT NULL DEFAULT false,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  action_url TEXT,
  action_label VARCHAR(100),
  expires_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para otimização de consultas
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_company_id ON notifications(company_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_priority ON notifications(priority);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON notifications(expires_at) WHERE expires_at IS NOT NULL;

-- Índice composto para consultas comuns
CREATE INDEX IF NOT EXISTS idx_notifications_user_read_created ON notifications(user_id, read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_company_read_created ON notifications(company_id, read, created_at DESC);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- Função para limpeza automática de notificações expiradas
CREATE OR REPLACE FUNCTION cleanup_expired_notifications()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM notifications 
  WHERE expires_at IS NOT NULL 
    AND expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Função para criar notificação do sistema
CREATE OR REPLACE FUNCTION create_system_notification(
  p_title TEXT,
  p_message TEXT,
  p_user_id UUID DEFAULT NULL,
  p_company_id UUID DEFAULT NULL,
  p_priority VARCHAR(20) DEFAULT 'medium',
  p_action_url TEXT DEFAULT NULL,
  p_action_label VARCHAR(100) DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (
    title,
    message,
    type,
    priority,
    user_id,
    company_id,
    action_url,
    action_label,
    expires_at,
    metadata
  ) VALUES (
    p_title,
    p_message,
    'system',
    p_priority,
    p_user_id,
    p_company_id,
    p_action_url,
    p_action_label,
    p_expires_at,
    p_metadata
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql;

-- RLS (Row Level Security)
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Política para usuários verem suas próprias notificações ou da empresa
CREATE POLICY "Users can view their own notifications or company notifications" ON notifications
  FOR SELECT USING (
    auth.uid() = user_id OR 
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Política para usuários criarem notificações
CREATE POLICY "Users can create notifications" ON notifications
  FOR INSERT WITH CHECK (
    auth.uid() = user_id OR 
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Política para usuários atualizarem suas notificações
CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (
    auth.uid() = user_id OR 
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Política para usuários deletarem suas notificações
CREATE POLICY "Users can delete their own notifications" ON notifications
  FOR DELETE USING (
    auth.uid() = user_id OR 
    company_id IN (
      SELECT company_id FROM profiles WHERE id = auth.uid()
    )
  );

-- Política especial para administradores
CREATE POLICY "Admins can manage all notifications" ON notifications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
        AND access_type IN ('admin', 'super_admin')
    )
  );

-- Inserir algumas notificações de exemplo para demonstração
INSERT INTO notifications (title, message, type, priority, user_id, company_id, metadata) 
SELECT 
  'Bem-vindo ao Sistema!',
  'Sua conta foi criada com sucesso. Explore todas as funcionalidades disponíveis.',
  'success',
  'medium',
  p.id,
  p.company_id,
  '{"welcome": true, "version": "1.0"}'
FROM profiles p
WHERE NOT EXISTS (
  SELECT 1 FROM notifications n 
  WHERE n.user_id = p.id 
    AND n.title = 'Bem-vindo ao Sistema!'
)
LIMIT 5; -- Limitar para evitar muitas inserções

-- Comentários para documentação
COMMENT ON TABLE notifications IS 'Tabela para armazenar notificações do sistema';
COMMENT ON COLUMN notifications.type IS 'Tipo da notificação: info, success, warning, error, system';
COMMENT ON COLUMN notifications.priority IS 'Prioridade: low, medium, high, urgent';
COMMENT ON COLUMN notifications.read IS 'Indica se a notificação foi lida pelo usuário';
COMMENT ON COLUMN notifications.user_id IS 'ID do usuário destinatário (opcional para notificações da empresa)';
COMMENT ON COLUMN notifications.company_id IS 'ID da empresa (para notificações corporativas)';
COMMENT ON COLUMN notifications.action_url IS 'URL para ação relacionada à notificação';
COMMENT ON COLUMN notifications.action_label IS 'Texto do botão de ação';
COMMENT ON COLUMN notifications.expires_at IS 'Data de expiração da notificação';
COMMENT ON COLUMN notifications.metadata IS 'Dados adicionais em formato JSON';

-- Criar job para limpeza automática (se suportado)
-- SELECT cron.schedule('cleanup-expired-notifications', '0 2 * * *', 'SELECT cleanup_expired_notifications();');

-- Grants para funções
GRANT EXECUTE ON FUNCTION cleanup_expired_notifications() TO authenticated;
GRANT EXECUTE ON FUNCTION create_system_notification(TEXT, TEXT, UUID, UUID, VARCHAR, TEXT, VARCHAR, TIMESTAMPTZ, JSONB) TO authenticated;