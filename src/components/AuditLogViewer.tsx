import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Shield, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  AlertTriangle, 
  User, 
  Clock,
  Database,
  Lock,
  Unlock,
  UserCheck,
  FileText,
  Activity,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  table_name?: string;
  record_id?: string;
  old_values?: Record<string, unknown>;
  new_values?: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  session_id?: string;
  details?: Record<string, unknown>;
  severity: 'low' | 'medium' | 'high' | 'critical';
  created_at: string;
  user_profile?: {
    name: string;
    email: string;
    access_type: string;
  };
}

interface AuditLogViewerProps {
  companyId?: string;
  userId?: string;
  maxHeight?: string;
}

export function AuditLogViewer({ companyId, userId, maxHeight = '600px' }: AuditLogViewerProps) {
  const { toast } = useToast();
  const { profile, hasPermission } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAction, setSelectedAction] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedUser, setSelectedUser] = useState('all');
  const [dateRange, setDateRange] = useState('7d');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [stats, setStats] = useState({
    total: 0,
    today: 0,
    critical: 0,
    byAction: {} as Record<string, number>
  });

  const itemsPerPage = 50;

  useEffect(() => {
    if (hasPermission('admin') || hasPermission('audit_view')) {
      loadAuditLogs();
      loadStats();
    }
  }, [currentPage, selectedAction, selectedSeverity, selectedUser, dateRange, searchTerm, hasPermission, loadAuditLogs, loadStats]);

  const loadAuditLogs = useCallback(async () => {
    try {
      setIsLoading(true);
      
      let query = supabase
        .from('audit_logs')
        .select(`
          *,
          user_profile:profiles!audit_logs_user_id_fkey(
            name,
            email,
            access_type
          )
        `);

      // Filtros de empresa e usuário
      if (companyId) {
        query = query.eq('company_id', companyId);
      } else if (profile?.company_id) {
        query = query.eq('company_id', profile.company_id);
      }

      if (userId) {
        query = query.eq('user_id', userId);
      }

      // Filtro por ação
      if (selectedAction !== 'all') {
        query = query.eq('action', selectedAction);
      }

      // Filtro por severidade
      if (selectedSeverity !== 'all') {
        query = query.eq('severity', selectedSeverity);
      }

      // Filtro por usuário específico
      if (selectedUser !== 'all') {
        query = query.eq('user_id', selectedUser);
      }

      // Filtro por período
      const now = new Date();
      let startDate: Date;
      switch (dateRange) {
        case '1d':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '7d':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case '30d':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case '90d':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      }
      query = query.gte('created_at', startDate.toISOString());

      // Busca por termo
      if (searchTerm) {
        query = query.or(`action.ilike.%${searchTerm}%,table_name.ilike.%${searchTerm}%,details->>description.ilike.%${searchTerm}%`);
      }

      // Paginação
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      setLogs(data || []);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));

    } catch (error) {
      console.error('Erro ao carregar logs de auditoria:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os logs de auditoria',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [companyId, profile?.company_id, userId, selectedAction, selectedSeverity, selectedUser, dateRange, searchTerm, currentPage, toast]);

  const loadStats = useCallback(async () => {
    try {
      let query = supabase
        .from('audit_logs')
        .select('action, severity, created_at');

      if (companyId) {
        query = query.eq('company_id', companyId);
      } else if (profile?.company_id) {
        query = query.eq('company_id', profile.company_id);
      }

      const { data, error } = await query;
      if (error) throw error;

      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const newStats = {
        total: data?.length || 0,
        today: data?.filter(log => new Date(log.created_at) >= today).length || 0,
        critical: data?.filter(log => log.severity === 'critical').length || 0,
        byAction: data?.reduce((acc, log) => {
          acc[log.action] = (acc[log.action] || 0) + 1;
          return acc;
        }, {} as Record<string, number>) || {}
      };

      setStats(newStats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  }, [companyId, profile?.company_id]);

  const exportLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('audit_logs')
        .select(`
          *,
          user_profile:profiles!audit_logs_user_id_fkey(
            name,
            email,
            access_type
          )
        `)
        .eq('company_id', profile?.company_id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const csv = [
        'Data,Usuário,Email,Ação,Tabela,Severidade,Detalhes',
        ...(data || []).map(log => [
          new Date(log.created_at).toLocaleString('pt-BR'),
          log.user_profile?.name || 'N/A',
          log.user_profile?.email || 'N/A',
          log.action,
          log.table_name || 'N/A',
          log.severity,
          JSON.stringify(log.details || {})
        ].join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: 'Sucesso',
        description: 'Logs exportados com sucesso'
      });
    } catch (error) {
      console.error('Erro ao exportar logs:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível exportar os logs',
        variant: 'destructive'
      });
    }
  };

  const getActionIcon = (action: string) => {
    switch (action.toLowerCase()) {
      case 'login':
      case 'logout':
        return <User className="h-4 w-4" />;
      case 'create':
      case 'insert':
        return <FileText className="h-4 w-4 text-green-500" />;
      case 'update':
      case 'edit':
        return <Activity className="h-4 w-4 text-blue-500" />;
      case 'delete':
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case 'view':
      case 'select':
        return <Eye className="h-4 w-4 text-gray-500" />;
      case 'permission_change':
        return <UserCheck className="h-4 w-4 text-orange-500" />;
      case 'security_event':
        return <Shield className="h-4 w-4 text-purple-500" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500';
      case 'high':
        return 'bg-orange-500';
      case 'medium':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getSeverityVariant = (severity: string): "default" | "secondary" | "destructive" | "outline" => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'secondary';
      default:
        return 'outline';
    }
  };

  if (!hasPermission('admin') && !hasPermission('audit_view')) {
    return (
      <Alert>
        <Shield className="h-4 w-4" />
        <AlertDescription>
          Você não tem permissão para visualizar logs de auditoria.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total de Logs</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Database className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Hoje</p>
                <p className="text-2xl font-bold">{stats.today}</p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Críticos</p>
                <p className="text-2xl font-bold text-red-500">{stats.critical}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ações Únicas</p>
                <p className="text-2xl font-bold">{Object.keys(stats.byAction).length}</p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar logs..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Ação</Label>
              <Select value={selectedAction} onValueChange={setSelectedAction}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as ações" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as ações</SelectItem>
                  <SelectItem value="login">Login</SelectItem>
                  <SelectItem value="logout">Logout</SelectItem>
                  <SelectItem value="create">Criar</SelectItem>
                  <SelectItem value="update">Atualizar</SelectItem>
                  <SelectItem value="delete">Deletar</SelectItem>
                  <SelectItem value="view">Visualizar</SelectItem>
                  <SelectItem value="permission_change">Mudança de Permissão</SelectItem>
                  <SelectItem value="security_event">Evento de Segurança</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Severidade</Label>
              <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as severidades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as severidades</SelectItem>
                  <SelectItem value="low">Baixa</SelectItem>
                  <SelectItem value="medium">Média</SelectItem>
                  <SelectItem value="high">Alta</SelectItem>
                  <SelectItem value="critical">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Período</Label>
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1d">Último dia</SelectItem>
                  <SelectItem value="7d">Últimos 7 dias</SelectItem>
                  <SelectItem value="30d">Últimos 30 dias</SelectItem>
                  <SelectItem value="90d">Últimos 90 dias</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={loadAuditLogs}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportLogs}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar CSV
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Logs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Logs de Auditoria
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea style={{ height: maxHeight }}>
            {isLoading ? (
              <div className="flex items-center justify-center h-32">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : logs.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Shield className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum log encontrado</p>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((log, index) => (
                  <div key={log.id}>
                    <div className="p-4 rounded-lg border bg-card">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getActionIcon(log.action)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="text-sm font-medium">
                                  {log.action.replace('_', ' ').toUpperCase()}
                                </h4>
                                <Badge variant={getSeverityVariant(log.severity)}>
                                  {log.severity.toUpperCase()}
                                </Badge>
                                {log.table_name && (
                                  <Badge variant="outline">
                                    {log.table_name}
                                  </Badge>
                                )}
                              </div>
                              
                              <div className="text-sm text-muted-foreground mb-2">
                                <p><strong>Usuário:</strong> {log.user_profile?.name || 'N/A'} ({log.user_profile?.email || 'N/A'})</p>
                                {log.ip_address && (
                                  <p><strong>IP:</strong> {log.ip_address}</p>
                                )}
                                {log.details?.description && (
                                  <p><strong>Descrição:</strong> {log.details.description}</p>
                                )}
                              </div>
                              
                              {(log.old_values || log.new_values) && (
                                <div className="text-xs bg-muted p-2 rounded mt-2">
                                  {log.old_values && (
                                    <div className="mb-1">
                                      <strong>Valores anteriores:</strong> {JSON.stringify(log.old_values, null, 2)}
                                    </div>
                                  )}
                                  {log.new_values && (
                                    <div>
                                      <strong>Novos valores:</strong> {JSON.stringify(log.new_values, null, 2)}
                                    </div>
                                  )}
                                </div>
                              )}
                              
                              <div className="flex items-center gap-4 mt-2">
                                <span className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {formatDistanceToNow(new Date(log.created_at), {
                                    addSuffix: true,
                                    locale: ptBR
                                  })}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(log.created_at).toLocaleString('pt-BR')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    {index < logs.length - 1 && <Separator className="my-2" />}
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Paginação */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Próxima
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default AuditLogViewer;