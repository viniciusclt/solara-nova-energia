-- Criação da tabela de logs de auditoria
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  action VARCHAR(100) NOT NULL,
  table_name VARCHAR(100),
  record_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  session_id VARCHAR(255),
  details JSONB DEFAULT '{}',
  severity VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para otimização de consultas
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_id ON audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_name ON audit_logs(table_name);
CREATE INDEX IF NOT EXISTS idx_audit_logs_record_id ON audit_logs(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_ip_address ON audit_logs(ip_address);

-- Índices compostos para consultas comuns
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_action_date ON audit_logs(user_id, action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_company_action_date ON audit_logs(company_id, action, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_table_record ON audit_logs(table_name, record_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity_date ON audit_logs(severity, created_at DESC);

-- Função para capturar informações da sessão
CREATE OR REPLACE FUNCTION get_session_info()
RETURNS JSONB AS $$
DECLARE
  session_info JSONB;
BEGIN
  session_info := jsonb_build_object(
    'ip_address', inet_client_addr(),
    'user_agent', current_setting('request.headers', true)::jsonb->>'user-agent',
    'session_id', current_setting('request.jwt.claims', true)::jsonb->>'session_id'
  );
  
  RETURN session_info;
EXCEPTION
  WHEN OTHERS THEN
    RETURN '{}'::jsonb;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para criar log de auditoria
CREATE OR REPLACE FUNCTION create_audit_log(
  p_user_id UUID,
  p_company_id UUID,
  p_action VARCHAR(100),
  p_table_name VARCHAR(100) DEFAULT NULL,
  p_record_id UUID DEFAULT NULL,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_details JSONB DEFAULT '{}',
  p_severity VARCHAR(20) DEFAULT 'medium'
)
RETURNS UUID AS $$
DECLARE
  audit_id UUID;
  session_info JSONB;
BEGIN
  -- Obter informações da sessão
  session_info := get_session_info();
  
  INSERT INTO audit_logs (
    user_id,
    company_id,
    action,
    table_name,
    record_id,
    old_values,
    new_values,
    ip_address,
    user_agent,
    session_id,
    details,
    severity
  ) VALUES (
    p_user_id,
    p_company_id,
    p_action,
    p_table_name,
    p_record_id,
    p_old_values,
    p_new_values,
    (session_info->>'ip_address')::inet,
    session_info->>'user_agent',
    session_info->>'session_id',
    p_details,
    p_severity
  ) RETURNING id INTO audit_id;
  
  RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para log de eventos de segurança
CREATE OR REPLACE FUNCTION log_security_event(
  p_event_type VARCHAR(100),
  p_event_details JSONB DEFAULT '{}',
  p_target_user_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  audit_id UUID;
  current_user_id UUID;
  current_company_id UUID;
BEGIN
  -- Obter ID do usuário atual
  current_user_id := auth.uid();
  
  -- Obter company_id do usuário atual
  SELECT company_id INTO current_company_id
  FROM profiles
  WHERE id = current_user_id;
  
  -- Determinar severidade baseada no tipo de evento
  DECLARE
    event_severity VARCHAR(20) := 'medium';
  BEGIN
    CASE p_event_type
      WHEN 'failed_login', 'suspicious_activity', 'unauthorized_access' THEN
        event_severity := 'high';
      WHEN 'data_breach', 'privilege_escalation', 'system_compromise' THEN
        event_severity := 'critical';
      WHEN 'password_change', 'role_change' THEN
        event_severity := 'medium';
      ELSE
        event_severity := 'low';
    END CASE;
  END;
  
  audit_id := create_audit_log(
    current_user_id,
    current_company_id,
    'security_event',
    'security',
    p_target_user_id,
    NULL,
    NULL,
    jsonb_build_object(
      'event_type', p_event_type,
      'event_details', p_event_details,
      'target_user_id', p_target_user_id
    ),
    event_severity
  );
  
  RETURN audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para limpeza automática de logs antigos
CREATE OR REPLACE FUNCTION cleanup_old_audit_logs(
  p_retention_days INTEGER DEFAULT 365
)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM audit_logs 
  WHERE created_at < NOW() - INTERVAL '1 day' * p_retention_days
    AND severity NOT IN ('critical', 'high'); -- Manter logs críticos por mais tempo
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log da limpeza
  PERFORM create_audit_log(
    NULL,
    NULL,
    'cleanup_audit_logs',
    'audit_logs',
    NULL,
    NULL,
    NULL,
    jsonb_build_object(
      'deleted_count', deleted_count,
      'retention_days', p_retention_days
    ),
    'low'
  );
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function para auditoria automática
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
  current_user_id UUID;
  current_company_id UUID;
  action_type VARCHAR(20);
BEGIN
  -- Obter ID do usuário atual
  current_user_id := auth.uid();
  
  -- Obter company_id do usuário atual
  SELECT company_id INTO current_company_id
  FROM profiles
  WHERE id = current_user_id;
  
  -- Determinar tipo de ação
  CASE TG_OP
    WHEN 'INSERT' THEN
      action_type := 'create';
      PERFORM create_audit_log(
        current_user_id,
        current_company_id,
        action_type,
        TG_TABLE_NAME,
        NEW.id,
        NULL,
        to_jsonb(NEW),
        jsonb_build_object('operation', TG_OP),
        'low'
      );
      RETURN NEW;
    WHEN 'UPDATE' THEN
      action_type := 'update';
      PERFORM create_audit_log(
        current_user_id,
        current_company_id,
        action_type,
        TG_TABLE_NAME,
        NEW.id,
        to_jsonb(OLD),
        to_jsonb(NEW),
        jsonb_build_object('operation', TG_OP),
        'medium'
      );
      RETURN NEW;
    WHEN 'DELETE' THEN
      action_type := 'delete';
      PERFORM create_audit_log(
        current_user_id,
        current_company_id,
        action_type,
        TG_TABLE_NAME,
        OLD.id,
        to_jsonb(OLD),
        NULL,
        jsonb_build_object('operation', TG_OP),
        'high'
      );
      RETURN OLD;
  END CASE;
  
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar triggers de auditoria em tabelas importantes
CREATE TRIGGER audit_profiles_trigger
  AFTER INSERT OR UPDATE OR DELETE ON profiles
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_companies_trigger
  AFTER INSERT OR UPDATE OR DELETE ON companies
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_leads_trigger
  AFTER INSERT OR UPDATE OR DELETE ON leads
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

CREATE TRIGGER audit_financial_institutions_trigger
  AFTER INSERT OR UPDATE OR DELETE ON financial_institutions
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- RLS (Row Level Security)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Política para administradores verem todos os logs da empresa
CREATE POLICY "Admins can view company audit logs" ON audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
        AND access_type IN ('admin', 'super_admin')
        AND (company_id = audit_logs.company_id OR access_type = 'super_admin')
    )
  );

-- Política para usuários verem seus próprios logs
CREATE POLICY "Users can view their own audit logs" ON audit_logs
  FOR SELECT USING (
    auth.uid() = user_id
  );

-- Política para inserção de logs (apenas sistema)
CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT WITH CHECK (true);

-- Política especial para super admins
CREATE POLICY "Super admins can view all audit logs" ON audit_logs
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE id = auth.uid() 
        AND access_type = 'super_admin'
    )
  );

-- Função para obter estatísticas de auditoria
CREATE OR REPLACE FUNCTION get_audit_stats(
  p_company_id UUID DEFAULT NULL,
  p_days INTEGER DEFAULT 30
)
RETURNS JSONB AS $$
DECLARE
  stats JSONB;
  total_logs INTEGER;
  critical_logs INTEGER;
  today_logs INTEGER;
  top_actions JSONB;
BEGIN
  -- Total de logs
  SELECT COUNT(*) INTO total_logs
  FROM audit_logs
  WHERE (p_company_id IS NULL OR company_id = p_company_id)
    AND created_at >= NOW() - INTERVAL '1 day' * p_days;
  
  -- Logs críticos
  SELECT COUNT(*) INTO critical_logs
  FROM audit_logs
  WHERE (p_company_id IS NULL OR company_id = p_company_id)
    AND severity = 'critical'
    AND created_at >= NOW() - INTERVAL '1 day' * p_days;
  
  -- Logs de hoje
  SELECT COUNT(*) INTO today_logs
  FROM audit_logs
  WHERE (p_company_id IS NULL OR company_id = p_company_id)
    AND created_at >= CURRENT_DATE;
  
  -- Top ações
  SELECT jsonb_agg(
    jsonb_build_object(
      'action', action,
      'count', count
    )
  ) INTO top_actions
  FROM (
    SELECT action, COUNT(*) as count
    FROM audit_logs
    WHERE (p_company_id IS NULL OR company_id = p_company_id)
      AND created_at >= NOW() - INTERVAL '1 day' * p_days
    GROUP BY action
    ORDER BY count DESC
    LIMIT 10
  ) t;
  
  stats := jsonb_build_object(
    'total_logs', total_logs,
    'critical_logs', critical_logs,
    'today_logs', today_logs,
    'top_actions', COALESCE(top_actions, '[]'::jsonb),
    'period_days', p_days
  );
  
  RETURN stats;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Inserir alguns logs de exemplo para demonstração
INSERT INTO audit_logs (user_id, company_id, action, details, severity)
SELECT 
  p.id,
  p.company_id,
  'system_initialization',
  jsonb_build_object(
    'description', 'Sistema de auditoria inicializado',
    'version', '1.0',
    'timestamp', NOW()
  ),
  'low'
FROM profiles p
WHERE p.access_type IN ('admin', 'super_admin')
LIMIT 5; -- Limitar para evitar muitas inserções

-- Comentários para documentação
COMMENT ON TABLE audit_logs IS 'Tabela para armazenar logs de auditoria do sistema';
COMMENT ON COLUMN audit_logs.action IS 'Ação realizada (create, update, delete, login, etc.)';
COMMENT ON COLUMN audit_logs.table_name IS 'Nome da tabela afetada';
COMMENT ON COLUMN audit_logs.record_id IS 'ID do registro afetado';
COMMENT ON COLUMN audit_logs.old_values IS 'Valores anteriores (para updates e deletes)';
COMMENT ON COLUMN audit_logs.new_values IS 'Novos valores (para inserts e updates)';
COMMENT ON COLUMN audit_logs.ip_address IS 'Endereço IP do usuário';
COMMENT ON COLUMN audit_logs.user_agent IS 'User agent do navegador';
COMMENT ON COLUMN audit_logs.session_id IS 'ID da sessão';
COMMENT ON COLUMN audit_logs.details IS 'Detalhes adicionais em formato JSON';
COMMENT ON COLUMN audit_logs.severity IS 'Severidade do evento: low, medium, high, critical';

-- Criar job para limpeza automática (se suportado)
-- SELECT cron.schedule('cleanup-old-audit-logs', '0 3 * * 0', 'SELECT cleanup_old_audit_logs(365);');

-- Grants para funções
GRANT EXECUTE ON FUNCTION create_audit_log(UUID, UUID, VARCHAR, VARCHAR, UUID, JSONB, JSONB, JSONB, VARCHAR) TO authenticated;
GRANT EXECUTE ON FUNCTION log_security_event(VARCHAR, JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_audit_stats(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_old_audit_logs(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_session_info() TO authenticated;