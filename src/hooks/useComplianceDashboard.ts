import { useState, useEffect, useCallback } from 'react';
import { 
  generateComplianceReport, 
  searchLogs, 
  exportLogs,
  logInfo,
  logError,
  type LogEntry 
} from '@/utils/secureLogger';

export interface ComplianceMetrics {
  total_logs: number;
  compliance_summary: {
    compliant: number;
    non_compliant: number;
    pending: number;
  };
  validation_summary: {
    total_validations: number;
    passed: number;
    failed: number;
    warnings: number;
  };
  recent_activities: LogEntry[];
  integrity_check: boolean;
}

export interface ComplianceAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  regulatory_context?: {
    lei_aplicavel: string[];
    ren_aplicavel: string[];
    compliance_status?: 'compliant' | 'non_compliant' | 'pending';
  };
}

export interface ComplianceTrend {
  date: string;
  compliance_score: number;
  total_validations: number;
  failed_validations: number;
}

export interface UseComplianceDashboardReturn {
  // Estado
  metrics: ComplianceMetrics | null;
  alerts: ComplianceAlert[];
  trends: ComplianceTrend[];
  loading: boolean;
  error: string | null;
  lastUpdate: Date | null;
  
  // Ações
  refreshData: () => Promise<void>;
  exportReport: (format: 'json' | 'csv') => Promise<void>;
  dismissAlert: (alertId: string) => void;
  getFilteredLogs: (filters: LogFilters) => LogEntry[];
  calculateComplianceScore: () => number;
  
  // Configurações
  autoRefresh: boolean;
  setAutoRefresh: (enabled: boolean) => void;
  refreshInterval: number;
  setRefreshInterval: (interval: number) => void;
}

export interface LogFilters {
  start_date?: Date;
  end_date?: Date;
  level?: 'debug' | 'info' | 'warn' | 'error';
  category?: 'system' | 'calculation' | 'validation' | 'compliance' | 'user_action' | 'audit';
  operation?: string;
  user_id?: string;
  resource?: string;
  compliance_status?: 'compliant' | 'non_compliant' | 'pending';
}

const REFRESH_INTERVALS = {
  REAL_TIME: 30 * 1000,      // 30 segundos
  FREQUENT: 2 * 60 * 1000,   // 2 minutos
  NORMAL: 5 * 60 * 1000,     // 5 minutos
  SLOW: 15 * 60 * 1000,      // 15 minutos
} as const;

export const useComplianceDashboard = (
  initialAutoRefresh: boolean = true,
  initialRefreshInterval: number = REFRESH_INTERVALS.NORMAL
): UseComplianceDashboardReturn => {
  // Estado principal
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [trends, setTrends] = useState<ComplianceTrend[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  // Configurações
  const [autoRefresh, setAutoRefresh] = useState(initialAutoRefresh);
  const [refreshInterval, setRefreshInterval] = useState(initialRefreshInterval);
  
  // Cache para otimização
  const [cachedLogs, setCachedLogs] = useState<LogEntry[]>([]);
  const [lastCacheUpdate, setLastCacheUpdate] = useState<Date | null>(null);

  // Função para carregar dados do dashboard
  const loadDashboardData = useCallback(async () => {
    try {
      setError(null);
      
      // Log da operação
      logInfo('Iniciando carregamento do dashboard de compliance', 'ComplianceDashboard');
      
      // Gerar relatório de conformidade
      const complianceReport = generateComplianceReport();
      setMetrics(complianceReport);
      
      // Buscar logs recentes para alertas
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentLogs = searchLogs({
        start_date: yesterday
      });
      
      // Atualizar cache de logs
      setCachedLogs(recentLogs);
      setLastCacheUpdate(new Date());
      
      // Processar alertas
      const processedAlerts = processLogsToAlerts(recentLogs);
      setAlerts(processedAlerts);
      
      // Calcular tendências (últimos 7 dias)
      const trendsData = calculateTrends(recentLogs);
      setTrends(trendsData);
      
      setLastUpdate(new Date());
      
      logInfo(
        `Dashboard carregado com sucesso: ${complianceReport.total_logs} logs, ${processedAlerts.length} alertas`,
        'ComplianceDashboard'
      );
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido';
      setError(errorMessage);
      
      logError(
        'Erro ao carregar dashboard de compliance',
        'ComplianceDashboard',
        { error: errorMessage }
      );
    }
  }, []);
  
  // Função para atualizar dados
  const refreshData = useCallback(async () => {
    setLoading(true);
    await loadDashboardData();
    setLoading(false);
  }, [loadDashboardData]);
  
  // Processar logs em alertas
  const processLogsToAlerts = useCallback((logs: LogEntry[]): ComplianceAlert[] => {
    return logs
      .filter(log => log.level === 'error' || log.level === 'warn')
      .map(log => ({
        id: log.id,
        type: log.level === 'error' ? 'error' : 'warning',
        title: `${log.category.toUpperCase()}: ${log.operation}`,
        message: log.message,
        timestamp: log.timestamp,
        regulatory_context: log.regulatory_context
      }))
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 20); // Limitar a 20 alertas mais recentes
  }, []);
  
  // Calcular tendências
  const calculateTrends = useCallback((logs: LogEntry[]): ComplianceTrend[] => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - i);
      return date.toISOString().split('T')[0];
    }).reverse();
    
    return last7Days.map(date => {
      const dayLogs = logs.filter(log => 
        log.timestamp.toISOString().split('T')[0] === date
      );
      
      const validationLogs = dayLogs.filter(log => log.category === 'validation');
      const complianceLogs = dayLogs.filter(log => log.category === 'compliance');
      
      const totalValidations = validationLogs.length;
      const failedValidations = validationLogs.filter(log => log.result === 'failure').length;
      
      const compliantCount = complianceLogs.filter(log => 
        log.regulatory_context?.compliance_status === 'compliant'
      ).length;
      const totalCompliance = complianceLogs.length;
      
      const compliance_score = totalCompliance > 0 ? 
        Math.round((compliantCount / totalCompliance) * 100) : 100;
      
      return {
        date,
        compliance_score,
        total_validations: totalValidations,
        failed_validations: failedValidations
      };
    });
  }, []);
  
  // Exportar relatório
  const exportReport = useCallback(async (format: 'json' | 'csv') => {
    try {
      logInfo(`Iniciando exportação de relatório em formato ${format}`, 'ComplianceDashboard');
      
      const data = exportLogs(format);
      const blob = new Blob([data], { 
        type: format === 'json' ? 'application/json' : 'text/csv' 
      });
      
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance-report-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      logInfo(`Relatório exportado com sucesso em formato ${format}`, 'ComplianceDashboard');
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro na exportação';
      logError('Erro ao exportar relatório', 'ComplianceDashboard', { error: errorMessage, format });
      throw new Error(errorMessage);
    }
  }, []);
  
  // Dispensar alerta
  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    logInfo(`Alerta dispensado: ${alertId}`, 'ComplianceDashboard');
  }, []);
  
  // Obter logs filtrados
  const getFilteredLogs = useCallback((filters: LogFilters): LogEntry[] => {
    // Usar cache se disponível e recente (menos de 1 minuto)
    const useCache = lastCacheUpdate && 
      (Date.now() - lastCacheUpdate.getTime()) < 60 * 1000;
    
    const logsToFilter = useCache ? cachedLogs : searchLogs(filters);
    
    return logsToFilter.filter(log => {
      if (filters.start_date && log.timestamp < filters.start_date) return false;
      if (filters.end_date && log.timestamp > filters.end_date) return false;
      if (filters.level && log.level !== filters.level) return false;
      if (filters.category && log.category !== filters.category) return false;
      if (filters.operation && log.operation !== filters.operation) return false;
      if (filters.resource && log.resource !== filters.resource) return false;
      if (filters.compliance_status && 
          log.regulatory_context?.compliance_status !== filters.compliance_status) return false;
      
      return true;
    });
  }, [cachedLogs, lastCacheUpdate]);
  
  // Calcular score de conformidade
  const calculateComplianceScore = useCallback((): number => {
    if (!metrics) return 0;
    
    const { compliant, non_compliant, pending } = metrics.compliance_summary;
    const total = compliant + non_compliant + pending;
    
    if (total === 0) return 100;
    return Math.round((compliant / total) * 100);
  }, [metrics]);
  
  // Efeito para carregamento inicial
  useEffect(() => {
    refreshData();
  }, []);
  
  // Efeito para auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      loadDashboardData();
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, loadDashboardData]);
  
  // Efeito para log de mudanças de configuração
  useEffect(() => {
    if (lastUpdate) {
      logInfo(
        `Configuração de auto-refresh alterada: ${autoRefresh ? 'ativado' : 'desativado'}, intervalo: ${refreshInterval}ms`,
        'ComplianceDashboard'
      );
    }
  }, [autoRefresh, refreshInterval, lastUpdate]);
  
  return {
    // Estado
    metrics,
    alerts,
    trends,
    loading,
    error,
    lastUpdate,
    
    // Ações
    refreshData,
    exportReport,
    dismissAlert,
    getFilteredLogs,
    calculateComplianceScore,
    
    // Configurações
    autoRefresh,
    setAutoRefresh,
    refreshInterval,
    setRefreshInterval
  };
};

// Constantes exportadas
export { REFRESH_INTERVALS };

// Hook para métricas específicas
export const useComplianceMetrics = () => {
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  
  const updateMetrics = useCallback(() => {
    const report = generateComplianceReport();
    setMetrics(report);
  }, []);
  
  useEffect(() => {
    updateMetrics();
    const interval = setInterval(updateMetrics, REFRESH_INTERVALS.NORMAL);
    return () => clearInterval(interval);
  }, [updateMetrics]);
  
  return { metrics, updateMetrics };
};

// Hook para alertas em tempo real
export const useComplianceAlerts = () => {
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  
  const checkForNewAlerts = useCallback(() => {
    const recentLogs = searchLogs({
      start_date: new Date(Date.now() - 5 * 60 * 1000) // Últimos 5 minutos
    });
    
    const newAlerts = recentLogs
      .filter(log => log.level === 'error')
      .map(log => ({
        id: log.id,
        type: 'error' as const,
        title: `${log.category.toUpperCase()}: ${log.operation}`,
        message: log.message,
        timestamp: log.timestamp,
        regulatory_context: log.regulatory_context
      }));
    
    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 50)); // Manter apenas 50 alertas
    }
  }, []);
  
  useEffect(() => {
    checkForNewAlerts();
    const interval = setInterval(checkForNewAlerts, REFRESH_INTERVALS.REAL_TIME);
    return () => clearInterval(interval);
  }, [checkForNewAlerts]);
  
  return { alerts, dismissAlert: (id: string) => setAlerts(prev => prev.filter(a => a.id !== id)) };
};