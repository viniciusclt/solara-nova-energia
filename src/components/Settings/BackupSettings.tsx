import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { HardDrive, Download, Upload, RefreshCw, CheckCircle2, AlertCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { logError, logInfo } from "@/utils/secureLogger";

interface BackupSettings {
  autoBackup: boolean;
  backupInterval: number; // em horas
  maxBackups: number;
  includeFiles: boolean;
  includeDatabase: boolean;
  includeSettings: boolean;
  compressionLevel: number;
  encryptBackups: boolean;
  cloudStorage: {
    enabled: boolean;
    provider: 'google_drive' | 'dropbox' | 'onedrive' | '';
    path: string;
  };
}

interface BackupInfo {
  id: string;
  name: string;
  size: string;
  date: string;
  type: 'manual' | 'automatic';
  status: 'completed' | 'failed' | 'in_progress';
  includes: string[];
}

interface BackupSettingsProps {
  onSettingsChange?: (settings: BackupSettings) => void;
}

export const BackupSettings: React.FC<BackupSettingsProps> = ({ onSettingsChange }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingBackup, setIsCreatingBackup] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  const [restoreProgress, setRestoreProgress] = useState(0);
  const [backupList, setBackupList] = useState<BackupInfo[]>([]);
  const [isLoadingBackups, setIsLoadingBackups] = useState(false);
  
  const [settings, setSettings] = useState<BackupSettings>({
    autoBackup: false,
    backupInterval: 24, // 24 horas
    maxBackups: 10,
    includeFiles: true,
    includeDatabase: true,
    includeSettings: true,
    compressionLevel: 6, // 0-9
    encryptBackups: true,
    cloudStorage: {
      enabled: false,
      provider: '',
      path: '/backups/solara'
    }
  });

  useEffect(() => {
    loadSettings();
    loadBackupList();
  }, []);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('backup_settings')
        .select('*')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        const loadedSettings = data.settings as unknown as BackupSettings;
        setSettings(loadedSettings);
        onSettingsChange?.(loadedSettings);
      }
    } catch (error) {
      logError('Erro ao carregar configurações de backup', 'BackupSettings', { error: (error as Error).message });
    }
  };

  const saveSettings = async () => {
    setIsLoading(true);
    
    try {
      logInfo('Iniciando salvamento das configurações de backup', 'BackupSettings');
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        logError('Erro de autenticação', 'BackupSettings', { error: authError?.message });
        throw new Error('Usuário não autenticado');
      }

      const settingsToSave = {
        user_id: user.id,
        settings: settings,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('backup_settings')
        .upsert(settingsToSave, { onConflict: 'user_id' })
        .select();

      if (error) {
        logError('Erro do Supabase ao salvar configurações de backup', 'BackupSettings', { 
          code: error.code, 
          message: error.message 
        });
        throw new Error(`Erro do banco: ${error.message}`);
      }

      logInfo('Configurações de backup salvas com sucesso', 'BackupSettings');
      onSettingsChange?.(settings);
      
      toast({
        title: "Configurações Salvas",
        description: "As configurações de backup foram salvas com sucesso.",
        variant: "default"
      });
      
    } catch (error) {
      logError('Erro ao salvar configurações de backup', 'BackupSettings', { error: (error as Error).message });
      toast({
        title: "Erro ao Salvar",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadBackupList = async () => {
    setIsLoadingBackups(true);
    
    try {
      // Simular carregamento da lista de backups
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockBackups: BackupInfo[] = [
        {
          id: '1',
          name: 'backup_2024_01_15_14_30',
          size: '125 MB',
          date: '2024-01-15 14:30:00',
          type: 'automatic',
          status: 'completed',
          includes: ['Database', 'Files', 'Settings']
        },
        {
          id: '2',
          name: 'backup_2024_01_14_09_15',
          size: '118 MB',
          date: '2024-01-14 09:15:00',
          type: 'manual',
          status: 'completed',
          includes: ['Database', 'Settings']
        },
        {
          id: '3',
          name: 'backup_2024_01_13_16_45',
          size: '132 MB',
          date: '2024-01-13 16:45:00',
          type: 'automatic',
          status: 'failed',
          includes: ['Database', 'Files', 'Settings']
        }
      ];
      
      setBackupList(mockBackups);
      
    } catch (error) {
      logError('Erro ao carregar lista de backups', 'BackupSettings', { error: (error as Error).message });
      toast({
        title: "Erro ao Carregar",
        description: "Não foi possível carregar a lista de backups.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingBackups(false);
    }
  };

  const createBackup = async () => {
    setIsCreatingBackup(true);
    setBackupProgress(0);
    
    try {
      logInfo('Iniciando criação de backup manual', 'BackupSettings');
      
      // Simular progresso do backup
      const progressInterval = setInterval(() => {
        setBackupProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 10;
        });
      }, 300);
      
      await new Promise(resolve => setTimeout(resolve, 3500));
      
      toast({
        title: "Backup Criado",
        description: "O backup foi criado com sucesso.",
        variant: "default"
      });
      
      // Recarregar lista de backups
      await loadBackupList();
      
    } catch (error) {
      logError('Erro ao criar backup', 'BackupSettings', { error: (error as Error).message });
      toast({
        title: "Erro no Backup",
        description: "Falha ao criar o backup.",
        variant: "destructive"
      });
    } finally {
      setIsCreatingBackup(false);
      setBackupProgress(0);
    }
  };

  const restoreBackup = async (backupId: string) => {
    setIsRestoring(true);
    setRestoreProgress(0);
    
    try {
      logInfo('Iniciando restauração de backup', 'BackupSettings', { backupId });
      
      // Simular progresso da restauração
      const progressInterval = setInterval(() => {
        setRestoreProgress(prev => {
          if (prev >= 100) {
            clearInterval(progressInterval);
            return 100;
          }
          return prev + 8;
        });
      }, 400);
      
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      toast({
        title: "Backup Restaurado",
        description: "O backup foi restaurado com sucesso.",
        variant: "default"
      });
      
    } catch (error) {
      logError('Erro ao restaurar backup', 'BackupSettings', { error: (error as Error).message, backupId });
      toast({
        title: "Erro na Restauração",
        description: "Falha ao restaurar o backup.",
        variant: "destructive"
      });
    } finally {
      setIsRestoring(false);
      setRestoreProgress(0);
    }
  };

  const downloadBackup = async (backupId: string, backupName: string) => {
    try {
      logInfo('Iniciando download de backup', 'BackupSettings', { backupId, backupName });
      
      // Simular download
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Download Iniciado",
        description: `O download do backup ${backupName} foi iniciado.`,
        variant: "default"
      });
      
    } catch (error) {
      logError('Erro ao fazer download do backup', 'BackupSettings', { error: (error as Error).message, backupId });
      toast({
        title: "Erro no Download",
        description: "Falha ao fazer download do backup.",
        variant: "destructive"
      });
    }
  };

  const getStatusIcon = (status: BackupInfo['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case 'in_progress':
        return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: BackupInfo['status']) => {
    const variants = {
      completed: 'default',
      failed: 'destructive',
      in_progress: 'secondary'
    } as const;
    
    const labels = {
      completed: 'Concluído',
      failed: 'Falhou',
      in_progress: 'Em Progresso'
    };
    
    return (
      <Badge variant={variants[status]}>
        {labels[status]}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <HardDrive className="h-5 w-5" />
            Configurações de Backup
          </CardTitle>
          <CardDescription>
            Configure backups automáticos e gerencie seus dados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="auto-backup"
              checked={settings.autoBackup}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoBackup: checked }))}
            />
            <Label htmlFor="auto-backup">Backup Automático</Label>
          </div>
          
          {settings.autoBackup && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="backup-interval">Intervalo de Backup</Label>
                <Select
                  value={settings.backupInterval.toString()}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, backupInterval: parseInt(value) }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 horas</SelectItem>
                    <SelectItem value="12">12 horas</SelectItem>
                    <SelectItem value="24">24 horas</SelectItem>
                    <SelectItem value="48">48 horas</SelectItem>
                    <SelectItem value="168">1 semana</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="max-backups">Máximo de Backups</Label>
                <Input
                  id="max-backups"
                  type="number"
                  min="1"
                  max="50"
                  value={settings.maxBackups}
                  onChange={(e) => setSettings(prev => ({ ...prev, maxBackups: parseInt(e.target.value) || 10 }))}
                />
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            <Label>Incluir no Backup</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Switch
                  id="include-database"
                  checked={settings.includeDatabase}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, includeDatabase: checked }))}
                />
                <Label htmlFor="include-database">Banco de Dados</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="include-files"
                  checked={settings.includeFiles}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, includeFiles: checked }))}
                />
                <Label htmlFor="include-files">Arquivos e Documentos</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="include-settings"
                  checked={settings.includeSettings}
                  onCheckedChange={(checked) => setSettings(prev => ({ ...prev, includeSettings: checked }))}
                />
                <Label htmlFor="include-settings">Configurações</Label>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="encrypt-backups"
              checked={settings.encryptBackups}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, encryptBackups: checked }))}
            />
            <Label htmlFor="encrypt-backups">Criptografar Backups</Label>
          </div>
          
          <Button onClick={saveSettings} disabled={isLoading} className="w-full">
            {isLoading ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Criar Backup Manual</CardTitle>
          <CardDescription>
            Crie um backup imediato dos seus dados.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {isCreatingBackup && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Criando backup...</span>
                <span>{backupProgress}%</span>
              </div>
              <Progress value={backupProgress} className="w-full" />
            </div>
          )}
          
          <Button 
            onClick={createBackup} 
            disabled={isCreatingBackup}
            className="w-full"
          >
            {isCreatingBackup ? (
              <RefreshCw className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Upload className="h-4 w-4 mr-2" />
            )}
            {isCreatingBackup ? "Criando Backup..." : "Criar Backup Agora"}
          </Button>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Backups Disponíveis</CardTitle>
          <CardDescription>
            Gerencie seus backups existentes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isRestoring && (
            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span>Restaurando backup...</span>
                <span>{restoreProgress}%</span>
              </div>
              <Progress value={restoreProgress} className="w-full" />
            </div>
          )}
          
          {isLoadingBackups ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin" />
              <span className="ml-2">Carregando backups...</span>
            </div>
          ) : (
            <div className="space-y-3">
              {backupList.map((backup) => (
                <div key={backup.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    {getStatusIcon(backup.status)}
                    <div>
                      <div className="font-medium">{backup.name}</div>
                      <div className="text-sm text-gray-500">
                        {backup.date} • {backup.size} • {backup.includes.join(', ')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {getStatusBadge(backup.status)}
                    
                    {backup.status === 'completed' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadBackup(backup.id, backup.name)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => restoreBackup(backup.id)}
                          disabled={isRestoring}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
              
              {backupList.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  Nenhum backup encontrado.
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default BackupSettings;