import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../contexts/AuthContext';
import { toast } from '../hooks/use-toast';
import { logError } from '../utils/secureLogger';

// Tipos específicos para valores de auditoria
export type AuditValue = string | number | boolean | null | undefined | Date | AuditValue[] | { [key: string]: AuditValue };

export interface AuditDetails {
  description?: string;
  ip_address?: string;
  user_agent?: string;
  changes?: string[];
  metadata?: Record<string, AuditValue>;
  [key: string]: AuditValue;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  company_id: string;
  action: string;
  table_name: string | null;
  record_id: string | null;
  old_values: Record<string, AuditValue> | null;
  new_values: Record<string, AuditValue> | null;
  ip_address: string | null;
  user_agent: string | null;
  session_id: string | null;
  details: AuditDetails;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  profiles?: {
    name: string;
    email: string;
  };
}

export interface AuditStats {
  total_logs: number;
  critical_logs: number;
  today_logs: number;
  top_actions: Array<{
    action: string;
    count: number;
  }>;
  period_days: number;
}

export interface AuditFilters {
  search?: string;
  action?: string;
  severity?: string;
  user_id?: string;
  table_name?: string;
  start_date?: string;
  end_date?: string;
}

export interface UseAuditLogsReturn {
  logs: AuditLog[];
  stats: AuditStats | null;
  loading: boolean;
  error: string | null;
  totalCount: number;
  currentPage: number;
  totalPages: number;
  filters: AuditFilters;
  setFilters: (filters: AuditFilters) => void;
  setPage: (page: number) => void;
  refreshLogs: () => Promise<void>;
  exportLogs: () => Promise<void>;
  createAuditLog: (params: {
    action: string;
    table_name?: string;
    record_id?: string;
    old_values?: Record<string, AuditValue>;
    new_values?: Record<string, AuditValue>;
    details?: AuditDetails;
    severity?: 'low' | 'medium' | 'high' | 'critical';
  }) => Promise<void>;
  logSecurityEvent: (eventType: string, details?: AuditDetails, targetUserId?: string) => Promise<void>;
}

const ITEMS_PER_PAGE = 50;

export function useAuditLogs(): UseAuditLogsReturn {
  const { user, profile } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stats, setStats] = useState<AuditStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<AuditFilters>({});

  const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);

  // Carregar logs de auditoria
  const loadLogs = useCallback(async () => {
    if (!user || !profile?.company_id) {
      setLogs([]);
      setTotalCount(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          profiles:user_id (
            name,
            email
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE - 1);

      // Aplicar filtros
      if (filters.search) {
        query = query.or(`action.ilike.%${filters.search}%,details->>description.ilike.%${filters.search}%`);
      }

      if (filters.action) {
        query = query.eq('action', filters.action);
      }

      if (filters.severity) {
        query = query.eq('severity', filters.severity);
      }

      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      if (filters.table_name) {
        query = query.eq('table_name', filters.table_name);
      }

      if (filters.start_date) {
        query = query.gte('created_at', filters.start_date);
      }

      if (filters.end_date) {
        query = query.lte('created_at', filters.end_date);
      }

      // Filtrar por empresa (exceto super admins)
      if (profile.access_type !== 'super_admin') {
        query = query.eq('company_id', profile.company_id);
      }

      const { data, error: queryError, count } = await query;

      if (queryError) {
        throw queryError;
      }

      setLogs(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.warn('Erro ao carregar logs de auditoria:', errorMessage);
      
      // Só mostrar erro se não for um problema de tabela inexistente
      if (!errorMessage.includes('relation "audit_logs" does not exist')) {
        logError('Erro ao carregar logs de auditoria', {
          service: 'useAuditLogs',
          error: errorMessage,
          userId: user?.id,
          companyId: profile?.company_id,
          action: 'loadLogs'
        });
        setError('Erro ao carregar logs de auditoria');
        toast({
          title: 'Erro',
          description: 'Não foi possível carregar os logs de auditoria',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  }, [user, profile, currentPage, filters]);

  // Carregar estatísticas
  const loadStats = useCallback(async () => {
    if (!user || !profile?.company_id) {
      setStats(null);
      return;
    }

    try {
      const { data, error } = await supabase.rpc('get_audit_stats', {
        p_company_id: profile.access_type === 'super_admin' ? null : profile.company_id,
        p_days: 30
      });

      if (error) {
        throw error;
      }

      setStats(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      console.warn('Erro ao carregar estatísticas de auditoria:', errorMessage);
      
      // Só mostrar erro se não for um problema de função inexistente
      if (!errorMessage.includes('function get_audit_stats') && !errorMessage.includes('does not exist')) {
        logError('Erro ao carregar estatísticas de auditoria', {
          service: 'useAuditLogs',
          error: errorMessage,
          userId: user?.id,
          companyId: profile?.company_id,
          action: 'loadStats'
        });
      }
    }
  }, [user, profile]);

  // Atualizar logs
  const refreshLogs = useCallback(async () => {
    await Promise.all([loadLogs(), loadStats()]);
  }, [loadLogs, loadStats]);

  // Exportar logs para CSV
  const exportLogs = useCallback(async () => {
    if (!user || !profile?.company_id) return;

    try {
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          profiles:user_id (
            name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      // Aplicar os mesmos filtros da visualização
      if (filters.search) {
        query = query.or(`action.ilike.%${filters.search}%,details->>description.ilike.%${filters.search}%`);
      }

      if (filters.action) {
        query = query.eq('action', filters.action);
      }

      if (filters.severity) {
        query = query.eq('severity', filters.severity);
      }

      if (filters.user_id) {
        query = query.eq('user_id', filters.user_id);
      }

      if (filters.table_name) {
        query = query.eq('table_name', filters.table_name);
      }

      if (filters.start_date) {
        query = query.gte('created_at', filters.start_date);
      }

      if (filters.end_date) {
        query = query.lte('created_at', filters.end_date);
      }

      if (profile.access_type !== 'super_admin') {
        query = query.eq('company_id', profile.company_id);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      // Converter para CSV
      const csvHeaders = [
        'Data/Hora',
        'Usuário',
        'Email',
        'Ação',
        'Tabela',
        'Severidade',
        'IP',
        'Detalhes'
      ];

      const csvRows = data?.map(log => [
        new Date(log.created_at).toLocaleString('pt-BR'),
        log.profiles?.name || 'Sistema',
        log.profiles?.email || '',
        log.action,
        log.table_name || '',
        log.severity,
        log.ip_address || '',
        JSON.stringify(log.details)
      ]) || [];

      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      // Download do arquivo
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `audit_logs_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: 'Sucesso',
        description: 'Logs exportados com sucesso',
      });
    } catch (err) {
      logError('Erro ao exportar logs de auditoria', {
        service: 'useAuditLogs',
        error: err instanceof Error ? err.message : 'Erro desconhecido',
        userId: user?.id,
        companyId: profile?.company_id,
        action: 'exportLogs'
      });
      toast({
        title: 'Erro',
        description: 'Erro ao exportar logs de auditoria',
        variant: 'destructive',
      });
    }
  }, [user, profile, filters]);

  // Criar log de auditoria
  const createAuditLog = useCallback(async (params: {
    action: string;
    table_name?: string;
    record_id?: string;
    old_values?: Record<string, AuditValue>;
    new_values?: Record<string, AuditValue>;
    details?: AuditDetails;
    severity?: 'low' | 'medium' | 'high' | 'critical';
  }) => {
    if (!user || !profile?.company_id) return;

    try {
      const { error } = await supabase.rpc('create_audit_log', {
        p_user_id: user.id,
        p_company_id: profile.company_id,
        p_action: params.action,
        p_table_name: params.table_name || null,
        p_record_id: params.record_id || null,
        p_old_values: params.old_values || null,
        p_new_values: params.new_values || null,
        p_details: params.details || {},
        p_severity: params.severity || 'medium'
      });

      if (error) {
        throw error;
      }

      // Recarregar logs se estivermos na primeira página
      if (currentPage === 1) {
        await refreshLogs();
      }
    } catch (err) {
      logError('Erro ao criar log de auditoria', {
        service: 'useAuditLogs',
        error: err instanceof Error ? err.message : 'Erro desconhecido',
        userId: user?.id,
        companyId: profile?.company_id,
        action: params.action,
        tableName: params.table_name
      });
    }
  }, [user, profile, currentPage, refreshLogs]);

  // Log de evento de segurança
  const logSecurityEvent = useCallback(async (
    eventType: string,
    details?: AuditDetails,
    targetUserId?: string
  ) => {
    try {
      const { error } = await supabase.rpc('log_security_event', {
        p_event_type: eventType,
        p_event_details: details || {},
        p_target_user_id: targetUserId || null
      });

      if (error) {
        throw error;
      }

      // Recarregar logs se estivermos na primeira página
      if (currentPage === 1) {
        await refreshLogs();
      }
    } catch (err) {
      logError('Erro ao registrar evento de segurança', {
        service: 'useAuditLogs',
        error: err instanceof Error ? err.message : 'Erro desconhecido',
        eventType,
        targetUserId,
        action: 'logSecurityEvent'
      });
    }
  }, [currentPage, refreshLogs]);

  // Definir página
  const setPage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  // Efeito principal para carregar dados quando necessário
  useEffect(() => {
    let isMounted = true;
    
    const loadData = async () => {
      if (!user || !profile?.company_id || !isMounted) return;
      
      // Evitar múltiplas chamadas simultâneas
      if (loading) return;
      
      await Promise.all([
        loadLogs(),
        loadStats()
      ]);
    };
    
    loadData();
    
    return () => {
      isMounted = false;
    };
  }, [user, profile?.company_id, currentPage, filters]);

  // Efeito separado para mudanças de página (sem recarregar stats)
  useEffect(() => {
    if (user && profile?.company_id && currentPage > 1) {
      loadLogs();
    }
  }, [currentPage]);

  return {
    logs,
    stats,
    loading,
    error,
    totalCount,
    currentPage,
    totalPages,
    filters,
    setFilters,
    setPage,
    refreshLogs,
    exportLogs,
    createAuditLog,
    logSecurityEvent,
  };
}

// Hook para logs de auditoria específicos de uma tabela/registro
export function useRecordAuditLogs(tableName: string, recordId: string) {
  const { user, profile } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadRecordLogs = useCallback(async () => {
    if (!user || !profile?.company_id || !tableName || !recordId) return;

    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          profiles:user_id (
            name,
            email
          )
        `)
        .eq('table_name', tableName)
        .eq('record_id', recordId)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setLogs(data || []);
    } catch (err) {
      logError('Erro ao carregar logs do registro', {
        service: 'useRecordAuditLogs',
        error: err instanceof Error ? err.message : 'Erro desconhecido',
        tableName,
        recordId,
        action: 'loadRecordLogs'
      });
    } finally {
      setLoading(false);
    }
  }, [user, profile, tableName, recordId]);

  useEffect(() => {
    loadRecordLogs();
  }, [loadRecordLogs]);

  return {
    logs,
    loading,
    refresh: loadRecordLogs,
  };
}