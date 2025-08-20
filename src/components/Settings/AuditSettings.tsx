import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Download, Search, Filter, RefreshCw, AlertTriangle, Info, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { logError, logInfo } from "@/utils/secureLogger";

interface AuditSettings {
  enableAuditLog: boolean;
  logLevel: 'error' | 'warn' | 'info' | 'debug';
  retentionDays: number;
  logUserActions: boolean;
  logSystemEvents: boolean;
  logDataChanges: boolean;
  logAuthEvents: boolean;
  logPerformanceMetrics: boolean;
  autoExport: boolean;
  exportInterval: number; // em dias
  exportFormat: 'json' | 'csv' | 'xlsx';
  alertOnCriticalEvents: boolean;
  maxLogSize: number; // em MB
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  level: 'error' | 'warn' | 'info' | 'debug';
  category: string;
  action: string;
  user_id?: string;
  user_email?: string;
  details: string;
  ip_address?: string;
  user_agent?: string;
}

interface AuditSettingsProps {
  onSettingsChange?: (settings: AuditSettings) => void;
}

export const AuditSettings: React.FC<AuditSettingsProps> = ({ onSettingsChange }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const [settings, setSettings] = useState<AuditSettings>({
    enableAuditLog: true,
    logLevel: 'info',
    retentionDays: 90,
    logUserActions: true,
    logSystemEvents: true,
    logDataChanges: true,
    logAuthEvents: true,
    logPerformanceMetrics: false,
    autoExport: false,
    exportInterval: 30,
    exportFormat: 'json',
    alertOnCriticalEvents: true,
    maxLogSize: 100
  });

  const loadSettings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('audit_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        const loadedSettings = data.settings as unknown as AuditSettings;
        setSettings(loadedSettings);
        onSettingsChange?.(loadedSettings);
      }
    } catch (error) {
      logError('Erro ao carregar configurações de auditoria', 'AuditSettings', { error: (error as Error).message });
    }
  }, []);

  const saveSettings = async () => {
    setIsLoading(true);
    
    try {
      logInfo('Iniciando salvamento das configurações de auditoria', 'AuditSettings');
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        logError('Erro de autenticação', 'AuditSettings', { error: authError?.message });
        throw new Error('Usuário não autenticado');
      }

      const settingsToSave = {
        user_id: user.id,
        settings: settings,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('audit_settings')
        .upsert(settingsToSave, { onConflict: 'user_id' })
        .select();

      if (error) {
        logError('Erro do Supabase ao salvar configurações de auditoria', 'AuditSettings', { 
          code: error.code, 
          message: error.message 
        });
        throw new Error(`Erro do banco: ${error.message}`);
      }

      logInfo('Configurações de auditoria salvas com sucesso', 'AuditSettings');
      onSettingsChange?.(settings);
      
      toast({
        title: "Configurações Salvas",
        description: "As configurações de auditoria foram salvas com sucesso.",
        variant: "default"
      });
      
    } catch (error) {
      logError('Erro ao salvar configurações de auditoria', 'AuditSettings', { error: (error as Error).message });
      toast({
        title: "Erro ao Salvar",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadAuditLogs = useCallback(async () => {
    setIsLoadingLogs(true);
    
    try {
      // Simular carregamento dos logs de auditoria
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockLogs: AuditLogEntry[] = [
        {
          id: '1',
          timestamp: '2024-01-15 14:30:25',
          level: 'info',
          category: 'auth',
          action: 'user_login',
          user_id: 'user123',
          user_email: 'usuario@email.com',
          details: 'Login realizado com sucesso',
          ip_address: '192.168.1.100',
          user_agent: 'Mozilla/5.0...'
        },
        {
          id: '2',
          timestamp: '2024-01-15 14:25:10',
          level: 'warn',
          category: 'data',
          action: 'proposal_update',
          user_id: 'user123',
          user_email: 'usuario@email.com',
          details: 'Proposta #1234 atualizada - valor alterado de R$ 50.000 para R$ 55.000',
          ip_address: '192.168.1.100'
        },
        {
          id: '3',
          timestamp: '2024-01-15 14:20:05',
          level: 'error',
          category: 'system',
          action: 'backup_failed',
          details: 'Falha no backup automático - espaço insuficiente em disco',
        },
        {
          id: '4',
          timestamp: '2024-01-15 14:15:30',
          level: 'info',
          category: 'data',
          action: 'client_created',
          user_id: 'user456',
          user_email: 'vendedor@email.com',
          details: 'Novo cliente criado: João Silva',
          ip_address: '192.168.1.101'
        },
        {
          id: '5',
          timestamp: '2024-01-15 14:10:15',
          level: 'debug',
          category: 'performance',
          action: 'query_slow',
          details: 'Query lenta detectada: SELECT * FROM proposals - 2.5s',
        }
      ];
      
      // Aplicar filtros
      let filteredLogs = mockLogs;
      
      if (searchTerm) {
        filteredLogs = filteredLogs.filter(log => 
          log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.details.toLowerCase().includes(searchTerm.toLowerCase()) ||
          log.user_email?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      
      if (filterLevel !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.level === filterLevel);
      }
      
      if (filterCategory !== 'all') {
        filteredLogs = filteredLogs.filter(log => log.category === filterCategory);
      }
      
      setAuditLogs(filteredLogs);
      setTotalPages(Math.ceil(filteredLogs.length / 10));
      
    } catch (error) {
      logError('Erro ao carregar logs de auditoria', 'AuditSettings', { error: (error as Error).message });
      toast({
        title: "Erro ao Carregar",
        description: "Não foi possível carregar os logs de auditoria.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingLogs(false);
    }
  }, [searchTerm, filterLevel, filterCategory, currentPage, toast]);

  useEffect(() => {
    loadSettings();
    loadAuditLogs();
  }, [loadSettings, loadAuditLogs]);

  useEffect(() => {
    loadAuditLogs();
  }, [searchTerm, filterLevel, filterCategory, currentPage, loadAuditLogs]);

  const exportLogs = async () => {
    setIsExporting(true);
    
    try {
      logInfo('Iniciando exportação de logs de auditoria', 'AuditSettings', { format: settings.exportFormat });
      
      // Simular exportação
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: "Logs Exportados",
        description: `Os logs foram exportados em formato ${settings.exportFormat.toUpperCase()}.`,
        variant: "default"
      });
      
    } catch (error) {
      logError('Erro ao exportar logs', 'AuditSettings', { error: (error as Error).message });
      toast({
        title: "Erro na Exportação",
        description: "Falha ao exportar os logs.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
    }
  };

  const clearOldLogs = async () => {
    try {
      logInfo('Iniciando limpeza de logs antigos', 'AuditSettings', { retentionDays: settings.retentionDays });
      
      // Simular limpeza
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Logs Limpos",
        description: `Logs mais antigos que ${settings.retentionDays} dias foram removidos.`,
        variant: "default"
      });
      
      // Recarregar logs
      await loadAuditLogs();
      
    } catch (error) {
      logError('Erro ao limpar logs antigos', 'AuditSettings', { error: (error as Error).message });
      toast({
        title: "Erro na Limpeza",
        description: "Falha ao limpar logs antigos.",
        variant: "destructive"
      });
    }
  };

  const getLevelIcon = (level: AuditLogEntry['level']) => {
    switch (level) {
      case 'error':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'warn':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'debug':
        return <CheckCircle2 className="h-4 w-4 text-gray-500" />;
      default:
        return <Info className="h-4 w-4 text-gray-500" />;
    }
  };

  const getLevelBadge = (level: AuditLogEntry['level']) => {
    const variants = {
      error: 'destructive',
      warn: 'secondary',
      info: 'default',
      debug: 'outline'
    } as const;
    
    return (
      <Badge variant={variants[level]}>
        {level.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Configurações de Auditoria
          </CardTitle>
          <CardDescription>
            Configure o sistema de logs e auditoria para monitoramento de atividades.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="enable-audit"
              checked={settings.enableAuditLog}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, enableAuditLog: checked }))}
            />
            <Label htmlFor="enable-audit">Habilitar Log de Auditoria</Label>
          </div>
          
          {settings.enableAuditLog && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="log-level">Nível de Log</Label>
                <Select
                  value={settings.logLevel}
                  onValueChange={(value: AuditSettings['logLevel']) => setSettings(prev => ({ ...prev, logLevel: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="error">Error - Apenas erros</SelectItem>
                    <SelectItem value="warn">Warning - Avisos e erros</SelectItem>
                    <SelectItem value="info">Info - Informações, avisos e erros</SelectItem>
                    <SelectItem value="debug">Debug - Todos os logs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="retention-days">Retenção de Logs (dias)</Label>
                <Input
                  id="retention-days"
                  type="number"
                  min="1"
                  max="365"
                  value={settings.retentionDays}
                  onChange={(e) => setSettings(prev => ({ ...prev, retentionDays: parseInt(e.target.value) || 90 }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="max-log-size">Tamanho Máximo de Log (MB)</Label>
                <Input
                  id="max-log-size"
                  type="number"
                  min="10"
                  max="1000"
                  value={settings.maxLogSize}
                  onChange={(e) => setSettings(prev => ({ ...prev, maxLogSize: parseInt(e.target.value) || 100 }))}
                />
              </div>
              
              <div className="space-y-3">
                <Label>Tipos de Eventos para Registrar</Label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="log-user-actions"
                      checked={settings.logUserActions}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, logUserActions: checked }))}
                    />
                    <Label htmlFor="log-user-actions">Ações do Usuário</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="log-system-events"
                      checked={settings.logSystemEvents}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, logSystemEvents: checked }))}
                    />
                    <Label htmlFor="log-system-events">Eventos do Sistema</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="log-data-changes"
                      checked={settings.logDataChanges}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, logDataChanges: checked }))}
                    />
                    <Label htmlFor="log-data-changes">Alterações de Dados</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="log-auth-events"
                      checked={settings.logAuthEvents}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, logAuthEvents: checked }))}
                    />
                    <Label htmlFor="log-auth-events">Eventos de Autenticação</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="log-performance"
                      checked={settings.logPerformanceMetrics}
                      onCheckedChange={(checked) => setSettings(prev => ({ ...prev, logPerformanceMetrics: checked }))}
                    />
                    <Label htmlFor="log-performance">Métricas de Performance</Label>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="alert-critical"
                  checked={settings.alertOnCriticalEvents}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, alertOnCriticalEvents: checked }))}
                />
                <Label htmlFor="alert-critical">Alertar em Eventos Críticos</Label>
              </div>
            </div>
          )}
          
          <Button onClick={saveSettings} disabled={isLoading} className="w-full">
            {isLoading ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Exportação Automática</CardTitle>
          <CardDescription>
            Configure a exportação automática dos logs de auditoria.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="auto-export"
              checked={settings.autoExport}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoExport: checked }))}
            />
            <Label htmlFor="auto-export">Exportação Automática</Label>
          </div>
          
          {settings.autoExport && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="export-interval">Intervalo de Exportação (dias)</Label>
                <Select
                  value={settings.exportInterval.toString()}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, exportInterval: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="7">7 dias</SelectItem>
                    <SelectItem value="15">15 dias</SelectItem>
                    <SelectItem value="30">30 dias</SelectItem>
                    <SelectItem value="60">60 dias</SelectItem>
                    <SelectItem value="90">90 dias</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="export-format">Formato de Exportação</Label>
                <Select
                  value={settings.exportFormat}
                  onValueChange={(value: AuditSettings['exportFormat']) => setSettings(prev => ({ ...prev, exportFormat: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="json">JSON</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button 
              onClick={exportLogs} 
              disabled={isExporting}
              variant="outline"
              className="flex-1"
            >
              {isExporting ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              {isExporting ? "Exportando..." : "Exportar Agora"}
            </Button>
            
            <Button 
              onClick={clearOldLogs}
              variant="outline"
              className="flex-1"
            >
              Limpar Logs Antigos
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Logs de Auditoria</CardTitle>
          <CardDescription>
            Visualize e pesquise os logs de auditoria do sistema.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <div className="flex-1">
              <Input
                placeholder="Pesquisar logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            
            <Select value={filterLevel} onValueChange={setFilterLevel}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos</SelectItem>
                <SelectItem value="error">Error</SelectItem>
                <SelectItem value="warn">Warning</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="debug">Debug</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="auth">Auth</SelectItem>
                <SelectItem value="data">Data</SelectItem>
                <SelectItem value="system">System</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={loadAuditLogs} variant="outline" size="icon">
              <RefreshCw className="h-4 w-4" />
            </Button>
          </div>
          
          {isLoadingLogs ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Carregando logs...</span>
            </div>
          ) : (
            <div className="space-y-2">
              {auditLogs.map((log) => (
                <div key={log.id} className="p-3 border rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      {getLevelIcon(log.level)}
                      {getLevelBadge(log.level)}
                      <Badge variant="outline">{log.category}</Badge>
                      <span className="font-medium">{log.action}</span>
                    </div>
                    <span className="text-sm text-gray-500">{log.timestamp}</span>
                  </div>
                  
                  <div className="text-sm text-gray-700">
                    {log.details}
                  </div>
                  
                  {(log.user_email || log.ip_address) && (
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      {log.user_email && <span>Usuário: {log.user_email}</span>}
                      {log.ip_address && <span>IP: {log.ip_address}</span>}
                    </div>
                  )}
                </div>
              ))}
              
              {auditLogs.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nenhum log encontrado.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};