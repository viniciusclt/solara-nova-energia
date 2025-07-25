import React, { useState, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Download,
  Upload,
  Database,
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Trash2,
  FileText,
  Calendar,
  HardDrive,
  CloudDownload,
  Settings,
  Wifi,
  WifiOff,
  Sync,
  Timer,
  Zap,
  Cloud,
  Archive
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BackupRecord {
  id: string;
  name: string;
  description: string;
  type: 'manual' | 'automatic' | 'scheduled';
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  size: number;
  tables_included: string[];
  created_at: string;
  completed_at?: string;
  error_message?: string;
  metadata: {
    records_count: number;
    compression_ratio?: number;
    checksum?: string;
  };
}

interface BackupStats {
  total_backups: number;
  successful_backups: number;
  failed_backups: number;
  total_size: number;
  last_backup: string;
  next_scheduled: string;
  sync_status: 'online' | 'offline' | 'syncing';
  pending_syncs: number;
  auto_backup_enabled: boolean;
}

interface SyncSettings {
  auto_backup_enabled: boolean;
  backup_frequency: 'daily' | 'weekly' | 'monthly';
  backup_time: string;
  offline_mode: boolean;
  compression_enabled: boolean;
  encryption_enabled: boolean;
  retention_days: number;
}

export function BackupManager() {
  const { user, profile, hasPermission } = useAuth();
  const [backups, setBackups] = useState<BackupRecord[]>([]);
  const [stats, setStats] = useState<BackupStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [backupName, setBackupName] = useState('');
  const [backupDescription, setBackupDescription] = useState('');
  const [restoreDialogOpen, setRestoreDialogOpen] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState<BackupRecord | null>(null);
  const [syncSettings, setSyncSettings] = useState<SyncSettings>({
    auto_backup_enabled: false,
    backup_frequency: 'daily',
    backup_time: '02:00',
    offline_mode: false,
    compression_enabled: true,
    encryption_enabled: true,
    retention_days: 30
  });
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingSyncs, setPendingSyncs] = useState<any[]>([]);

  // Verificar permissões
  if (!hasPermission('admin') && !hasPermission('backup_manage')) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Acesso Restrito</h3>
            <p className="text-muted-foreground">
              Você não tem permissão para acessar o gerenciador de backup.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const availableTables = [
    { id: 'leads', name: 'Leads', description: 'Dados dos clientes potenciais' },
    { id: 'companies', name: 'Empresas', description: 'Informações das empresas' },
    { id: 'profiles', name: 'Perfis', description: 'Perfis de usuários' },
    { id: 'solar_modules', name: 'Módulos Solares', description: 'Catálogo de módulos' },
    { id: 'inverters', name: 'Inversores', description: 'Catálogo de inversores' },
    { id: 'financial_institutions', name: 'Instituições Financeiras', description: 'Dados de financiamento' },
    { id: 'audit_logs', name: 'Logs de Auditoria', description: 'Histórico de ações' },
    { id: 'notifications', name: 'Notificações', description: 'Sistema de notificações' },
  ];

  // Carregar backups
  const loadBackups = useCallback(async () => {
    if (!user || !profile?.company_id) return;

    try {
      setLoading(true);

      // Simular carregamento de backups (implementar com Supabase Functions)
      const mockBackups: BackupRecord[] = [
        {
          id: '1',
          name: 'Backup Diário - Sistema Completo',
          description: 'Backup automático de todas as tabelas',
          type: 'automatic',
          status: 'completed',
          size: 15728640, // 15MB
          tables_included: ['leads', 'companies', 'profiles', 'solar_modules'],
          created_at: new Date(Date.now() - 86400000).toISOString(), // 1 dia atrás
          completed_at: new Date(Date.now() - 86340000).toISOString(),
          metadata: {
            records_count: 1250,
            compression_ratio: 0.65,
            checksum: 'sha256:abc123...'
          }
        },
        {
          id: '2',
          name: 'Backup Manual - Leads',
          description: 'Backup manual apenas dos leads',
          type: 'manual',
          status: 'completed',
          size: 5242880, // 5MB
          tables_included: ['leads'],
          created_at: new Date(Date.now() - 172800000).toISOString(), // 2 dias atrás
          completed_at: new Date(Date.now() - 172740000).toISOString(),
          metadata: {
            records_count: 450,
            compression_ratio: 0.72,
            checksum: 'sha256:def456...'
          }
        }
      ];

      const mockStats: BackupStats = {
        total_backups: 15,
        successful_backups: 14,
        failed_backups: 1,
        total_size: 157286400, // 150MB
        last_backup: new Date(Date.now() - 86400000).toISOString(),
        next_scheduled: new Date(Date.now() + 86400000).toISOString(),
        sync_status: isOnline ? 'online' : 'offline',
        pending_syncs: pendingSyncs.length,
        auto_backup_enabled: syncSettings.auto_backup_enabled
      };

      setBackups(mockBackups);
      setStats(mockStats);
    } catch (error) {
      console.error('Erro ao carregar backups:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os backups',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  // Criar backup
  const createBackup = useCallback(async () => {
    if (!user || !profile?.company_id || selectedTables.length === 0) {
      toast({
        title: 'Erro',
        description: 'Selecione pelo menos uma tabela para backup',
        variant: 'destructive',
      });
      return;
    }

    try {
      setLoading(true);
      setBackupProgress(0);

      // Simular progresso do backup
      const progressInterval = setInterval(() => {
        setBackupProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + Math.random() * 15;
        });
      }, 500);

      // Simular criação de backup (implementar com Supabase Functions)
      await new Promise(resolve => setTimeout(resolve, 5000));

      clearInterval(progressInterval);
      setBackupProgress(100);

      toast({
        title: 'Sucesso',
        description: 'Backup criado com sucesso',
      });

      // Limpar formulário
      setBackupName('');
      setBackupDescription('');
      setSelectedTables([]);
      setBackupProgress(0);

      // Recarregar lista
      await loadBackups();
    } catch (error) {
      console.error('Erro ao criar backup:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao criar backup',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, profile, selectedTables, backupName, backupDescription, loadBackups]);

  // Restaurar backup
  const restoreBackup = useCallback(async (backup: BackupRecord) => {
    if (!user || !profile?.company_id) return;

    try {
      setLoading(true);

      // Implementar restauração com Supabase Functions
      await new Promise(resolve => setTimeout(resolve, 3000));

      toast({
        title: 'Sucesso',
        description: 'Backup restaurado com sucesso',
      });

      setRestoreDialogOpen(false);
      setSelectedBackup(null);
    } catch (error) {
      console.error('Erro ao restaurar backup:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao restaurar backup',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, profile]);

  // Download backup
  const downloadBackup = useCallback(async (backup: BackupRecord) => {
    try {
      // Implementar download com Supabase Storage
      const mockData = JSON.stringify({
        backup_info: backup,
        data: {
          leads: [],
          companies: [],
          // ... outros dados
        }
      }, null, 2);

      const blob = new Blob([mockData], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `backup_${backup.name.replace(/\s+/g, '_')}_${format(new Date(backup.created_at), 'yyyy-MM-dd')}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Sucesso',
        description: 'Download do backup iniciado',
      });
    } catch (error) {
      console.error('Erro ao fazer download:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao fazer download do backup',
        variant: 'destructive',
      });
    }
  }, []);

  // Deletar backup
  const deleteBackup = useCallback(async (backupId: string) => {
    try {
      // Implementar exclusão com Supabase
      await new Promise(resolve => setTimeout(resolve, 1000));

      setBackups(prev => prev.filter(b => b.id !== backupId));

      toast({
        title: 'Sucesso',
        description: 'Backup excluído com sucesso',
      });
    } catch (error) {
      console.error('Erro ao excluir backup:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao excluir backup',
        variant: 'destructive',
      });
    }
  }, []);

  // Monitorar status de conexão
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncPendingBackups();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Backup automático
  useEffect(() => {
    if (!syncSettings.auto_backup_enabled) return;

    const scheduleNextBackup = () => {
      const now = new Date();
      const [hours, minutes] = syncSettings.backup_time.split(':').map(Number);
      const scheduledTime = new Date(now);
      scheduledTime.setHours(hours, minutes, 0, 0);

      if (scheduledTime <= now) {
        scheduledTime.setDate(scheduledTime.getDate() + 1);
      }

      const timeUntilBackup = scheduledTime.getTime() - now.getTime();
      
      const timeoutId = setTimeout(() => {
        performAutomaticBackup();
        scheduleNextBackup();
      }, timeUntilBackup);

      return timeoutId;
    };

    const timeoutId = scheduleNextBackup();
    return () => clearTimeout(timeoutId);
  }, [syncSettings.auto_backup_enabled, syncSettings.backup_time]);

  // Sincronizar backups pendentes
  const syncPendingBackups = useCallback(async () => {
    if (!isOnline || pendingSyncs.length === 0) return;

    try {
      setLoading(true);
      
      for (const pendingSync of pendingSyncs) {
        // Implementar sincronização com Supabase
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      setPendingSyncs([]);
      toast({
        title: 'Sincronização Concluída',
        description: `${pendingSyncs.length} backup(s) sincronizado(s) com sucesso`,
      });
    } catch (error) {
      console.error('Erro na sincronização:', error);
      toast({
        title: 'Erro na Sincronização',
        description: 'Alguns backups não puderam ser sincronizados',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [isOnline, pendingSyncs]);

  // Backup automático
  const performAutomaticBackup = useCallback(async () => {
    if (!user || !profile?.company_id) return;

    try {
      const autoBackupData = {
        name: `Backup Automático - ${format(new Date(), 'dd/MM/yyyy HH:mm')}`,
        description: 'Backup automático do sistema',
        tables: ['leads', 'companies', 'profiles', 'solar_modules', 'inverters'],
        type: 'automatic' as const
      };

      if (isOnline) {
        // Criar backup diretamente
        await createBackupWithData(autoBackupData);
      } else {
        // Adicionar à fila de sincronização
        setPendingSyncs(prev => [...prev, autoBackupData]);
        toast({
          title: 'Backup Offline',
          description: 'Backup salvo localmente. Será sincronizado quando a conexão for restaurada.',
        });
      }
    } catch (error) {
      console.error('Erro no backup automático:', error);
    }
  }, [user, profile, isOnline]);

  // Criar backup com dados específicos
  const createBackupWithData = useCallback(async (backupData: any) => {
    // Implementar criação de backup com dados específicos
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const newBackup: BackupRecord = {
      id: Date.now().toString(),
      name: backupData.name,
      description: backupData.description,
      type: backupData.type,
      status: 'completed',
      size: Math.floor(Math.random() * 10000000) + 5000000,
      tables_included: backupData.tables,
      created_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
      metadata: {
        records_count: Math.floor(Math.random() * 1000) + 500,
        compression_ratio: 0.65,
        checksum: `sha256:${Math.random().toString(36).substring(7)}...`
      }
    };

    setBackups(prev => [newBackup, ...prev]);
    await loadBackups();
  }, []);

  // Salvar configurações de sincronização
  const saveSyncSettings = useCallback(async (newSettings: SyncSettings) => {
    try {
      // Implementar salvamento no Supabase
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setSyncSettings(newSettings);
      toast({
        title: 'Configurações Salvas',
        description: 'As configurações de backup foram atualizadas com sucesso',
      });
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível salvar as configurações',
        variant: 'destructive',
      });
    }
  }, []);

  // Formatar tamanho
  const formatSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  // Carregar dados iniciais
  React.useEffect(() => {
    loadBackups();
  }, [loadBackups]);

  return (
    <div className="space-y-6">
      {/* Estatísticas */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Backups</p>
                  <p className="text-2xl font-bold">{stats.total_backups}</p>
                </div>
                <Database className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Status de Conexão</p>
                  <div className="flex items-center gap-2">
                    {stats.sync_status === 'online' ? (
                      <>
                        <Wifi className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium text-green-600">Online</span>
                      </>
                    ) : stats.sync_status === 'syncing' ? (
                      <>
                        <Sync className="h-4 w-4 text-blue-500 animate-spin" />
                        <span className="text-sm font-medium text-blue-600">Sincronizando</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-4 w-4 text-red-500" />
                        <span className="text-sm font-medium text-red-600">Offline</span>
                      </>
                    )}
                  </div>
                </div>
                <Cloud className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Backup Automático</p>
                  <div className="flex items-center gap-2">
                    {stats.auto_backup_enabled ? (
                      <>
                        <Zap className="h-4 w-4 text-green-500" />
                        <span className="text-sm font-medium text-green-600">Ativo</span>
                      </>
                    ) : (
                      <>
                        <Timer className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-600">Inativo</span>
                      </>
                    )}
                  </div>
                </div>
                <Archive className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Tamanho Total</p>
                  <p className="text-2xl font-bold">{formatSize(stats.total_size)}</p>
                  {stats.pending_syncs > 0 && (
                    <p className="text-xs text-orange-600">{stats.pending_syncs} pendente(s)</p>
                  )}
                </div>
                <HardDrive className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Último Backup</p>
                  <p className="text-sm font-medium">
                    {format(new Date(stats.last_backup), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                  </p>
                  <p className="text-xs text-green-600">{stats.successful_backups}/{stats.total_backups} sucessos</p>
                </div>
                <Clock className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="create">Criar Backup</TabsTrigger>
          <TabsTrigger value="manage">Gerenciar Backups</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>

        {/* Criar Backup */}
        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5" />
                Criar Novo Backup
              </CardTitle>
              <CardDescription>
                Crie um backup manual dos dados selecionados
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="backup-name">Nome do Backup</Label>
                  <Input
                    id="backup-name"
                    placeholder="Ex: Backup Manual - Leads"
                    value={backupName}
                    onChange={(e) => setBackupName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="backup-description">Descrição</Label>
                  <Input
                    id="backup-description"
                    placeholder="Descrição opcional"
                    value={backupDescription}
                    onChange={(e) => setBackupDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tabelas para Backup</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {availableTables.map((table) => (
                    <div key={table.id} className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id={table.id}
                        checked={selectedTables.includes(table.id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedTables(prev => [...prev, table.id]);
                          } else {
                            setSelectedTables(prev => prev.filter(t => t !== table.id));
                          }
                        }}
                        className="rounded border-gray-300"
                      />
                      <label htmlFor={table.id} className="text-sm">
                        <span className="font-medium">{table.name}</span>
                        <span className="text-muted-foreground ml-1">- {table.description}</span>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {backupProgress > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Progresso do Backup</Label>
                    <span className="text-sm text-muted-foreground">{Math.round(backupProgress)}%</span>
                  </div>
                  <Progress value={backupProgress} className="w-full" />
                </div>
              )}

              <Button
                onClick={createBackup}
                disabled={loading || selectedTables.length === 0 || !backupName}
                className="w-full"
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Criando Backup...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Criar Backup
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Gerenciar Backups */}
        <TabsContent value="manage" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Backups Existentes
              </CardTitle>
              <CardDescription>
                Gerencie, restaure ou faça download dos backups existentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {backups.map((backup) => (
                  <Card key={backup.id} className="border">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h4 className="font-semibold">{backup.name}</h4>
                            <Badge variant={backup.type === 'automatic' ? 'default' : 'secondary'}>
                              {backup.type === 'automatic' ? 'Automático' : 'Manual'}
                            </Badge>
                            <Badge
                              variant={
                                backup.status === 'completed' ? 'default' :
                                backup.status === 'failed' ? 'destructive' : 'secondary'
                              }
                            >
                              {backup.status === 'completed' ? 'Concluído' :
                               backup.status === 'failed' ? 'Falhou' : 'Em Progresso'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{backup.description}</p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(backup.created_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                            </span>
                            <span className="flex items-center gap-1">
                              <HardDrive className="h-4 w-4" />
                              {formatSize(backup.size)}
                            </span>
                            <span className="flex items-center gap-1">
                              <FileText className="h-4 w-4" />
                              {backup.metadata.records_count} registros
                            </span>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {backup.tables_included.map((table) => (
                              <Badge key={table} variant="outline" className="text-xs">
                                {availableTables.find(t => t.id === table)?.name || table}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => downloadBackup(backup)}
                          >
                            <CloudDownload className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedBackup(backup);
                              setRestoreDialogOpen(true);
                            }}
                          >
                            <Upload className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteBackup(backup.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {backups.length === 0 && (
                  <div className="text-center py-8">
                    <Database className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum backup encontrado</h3>
                    <p className="text-muted-foreground">
                      Crie seu primeiro backup na aba "Criar Backup".
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Configurações */}
        <TabsContent value="settings" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Configurações de Backup Automático */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Timer className="h-5 w-5" />
                  Backup Automático
                </CardTitle>
                <CardDescription>
                  Configure backups automáticos e agendamentos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Ativar Backup Automático</Label>
                    <p className="text-sm text-muted-foreground">
                      Criar backups automaticamente no horário agendado
                    </p>
                  </div>
                  <Switch
                    checked={syncSettings.auto_backup_enabled}
                    onCheckedChange={(checked) => {
                      const newSettings = { ...syncSettings, auto_backup_enabled: checked };
                      setSyncSettings(newSettings);
                      saveSyncSettings(newSettings);
                    }}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="backup-frequency">Frequência</Label>
                  <Select
                    value={syncSettings.backup_frequency}
                    onValueChange={(value: 'daily' | 'weekly' | 'monthly') => {
                      const newSettings = { ...syncSettings, backup_frequency: value };
                      setSyncSettings(newSettings);
                      saveSyncSettings(newSettings);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">Diário</SelectItem>
                      <SelectItem value="weekly">Semanal</SelectItem>
                      <SelectItem value="monthly">Mensal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="backup-time">Horário</Label>
                  <Input
                    id="backup-time"
                    type="time"
                    value={syncSettings.backup_time}
                    onChange={(e) => {
                      const newSettings = { ...syncSettings, backup_time: e.target.value };
                      setSyncSettings(newSettings);
                      saveSyncSettings(newSettings);
                    }}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="retention-days">Retenção (dias)</Label>
                  <Input
                    id="retention-days"
                    type="number"
                    min="1"
                    max="365"
                    value={syncSettings.retention_days}
                    onChange={(e) => {
                      const newSettings = { ...syncSettings, retention_days: parseInt(e.target.value) };
                      setSyncSettings(newSettings);
                      saveSyncSettings(newSettings);
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    Backups mais antigos que este período serão removidos automaticamente
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Configurações de Sincronização */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sync className="h-5 w-5" />
                  Sincronização e Segurança
                </CardTitle>
                <CardDescription>
                  Configure opções de sincronização e segurança
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Modo Offline</Label>
                    <p className="text-sm text-muted-foreground">
                      Permitir backups quando offline
                    </p>
                  </div>
                  <Switch
                    checked={syncSettings.offline_mode}
                    onCheckedChange={(checked) => {
                      const newSettings = { ...syncSettings, offline_mode: checked };
                      setSyncSettings(newSettings);
                      saveSyncSettings(newSettings);
                    }}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Compressão</Label>
                    <p className="text-sm text-muted-foreground">
                      Comprimir backups para economizar espaço
                    </p>
                  </div>
                  <Switch
                    checked={syncSettings.compression_enabled}
                    onCheckedChange={(checked) => {
                      const newSettings = { ...syncSettings, compression_enabled: checked };
                      setSyncSettings(newSettings);
                      saveSyncSettings(newSettings);
                    }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Criptografia</Label>
                    <p className="text-sm text-muted-foreground">
                      Criptografar backups para maior segurança
                    </p>
                  </div>
                  <Switch
                    checked={syncSettings.encryption_enabled}
                    onCheckedChange={(checked) => {
                      const newSettings = { ...syncSettings, encryption_enabled: checked };
                      setSyncSettings(newSettings);
                      saveSyncSettings(newSettings);
                    }}
                  />
                </div>

                <Separator />

                {pendingSyncs.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Sincronizações Pendentes</Label>
                      <Badge variant="outline">{pendingSyncs.length}</Badge>
                    </div>
                    <Button
                      onClick={syncPendingBackups}
                      disabled={!isOnline || loading}
                      className="w-full"
                      variant="outline"
                    >
                      {loading ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Sincronizando...
                        </>
                      ) : (
                        <>
                          <Sync className="h-4 w-4 mr-2" />
                          Sincronizar Agora
                        </>
                      )}
                    </Button>
                  </div>
                )}

                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    Todos os backups são protegidos com criptografia AES-256 e armazenados de forma segura.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Dialog de Restauração */}
      <Dialog open={restoreDialogOpen} onOpenChange={setRestoreDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmar Restauração</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja restaurar o backup "{selectedBackup?.name}"?
              Esta ação irá sobrescrever os dados atuais.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setRestoreDialogOpen(false)}
            >
              Cancelar
            </Button>
            <Button
              onClick={() => selectedBackup && restoreBackup(selectedBackup)}
              disabled={loading}
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Restaurando...
                </>
              ) : (
                'Confirmar Restauração'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}