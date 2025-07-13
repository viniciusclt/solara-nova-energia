import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Settings, Sheet, RefreshCw, History, AlertCircle, CheckCircle2, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface GoogleSheetsSettings {
  spreadsheetUrl: string;
  autoSync: boolean;
  syncInterval: number; // minutes
  sheetName: string;
  columnMapping: {
    name: string;
    email: string;
    phone: string;
    cpfCnpj: string;
    address: string;
    consumoMedio: string;
  };
}

interface ImportLog {
  id: string;
  source_type: string;
  source_url: string;
  total_records: number;
  successful_imports: number;
  failed_imports: number;
  status: string;
  started_at: string;
  completed_at: string;
}

export const SettingsModal: React.FC = () => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [importLogs, setImportLogs] = useState<ImportLog[]>([]);
  const [googleApiKey, setGoogleApiKey] = useState("");
  const [isSavingApiKey, setIsSavingApiKey] = useState(false);
  
  const [googleSheetsSettings, setGoogleSheetsSettings] = useState<GoogleSheetsSettings>({
    spreadsheetUrl: "",
    autoSync: false,
    syncInterval: 60,
    sheetName: "Sheet1",
    columnMapping: {
      name: "A",
      email: "B", 
      phone: "C",
      cpfCnpj: "D",
      address: "E",
      consumoMedio: "F"
    }
  });

  useEffect(() => {
    if (isOpen) {
      loadSettings();
      loadImportLogs();
      loadApiKey();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('integration_settings')
        .select('*')
        .eq('integration_type', 'google_sheets')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setGoogleSheetsSettings(data.settings as unknown as GoogleSheetsSettings);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadImportLogs = async () => {
    try {
      const { data, error } = await supabase
        .from('import_logs')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setImportLogs(data || []);
    } catch (error) {
      console.error('Error loading import logs:', error);
    }
  };

  const loadApiKey = async () => {
    try {
      const { data, error } = await supabase
        .from('integration_settings')
        .select('*')
        .eq('integration_type', 'google_api')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data && (data.settings as any).api_key) {
        setGoogleApiKey("••••••••••••••••"); // Mostrar placeholder por segurança
      }
    } catch (error) {
      console.error('Error loading API key:', error);
    }
  };

  const saveSettings = async () => {
    setIsLoading(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      const { error } = await supabase
        .from('integration_settings')
        .upsert({
          user_id: (await supabase.auth.getUser()).data.user?.id || '',
          company_id: profile?.company_id || '',
          integration_type: 'google_sheets',
          settings: googleSheetsSettings as any,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "Configurações Salvas",
        description: "As configurações do Google Sheets foram salvas com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro ao Salvar",
        description: "Erro ao salvar as configurações. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveApiKey = async () => {
    if (!googleApiKey || googleApiKey === "••••••••••••••••") {
      return;
    }

    setIsSavingApiKey(true);
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', (await supabase.auth.getUser()).data.user?.id)
        .single();

      const { error } = await supabase
        .from('integration_settings')
        .upsert({
          user_id: (await supabase.auth.getUser()).data.user?.id || '',
          company_id: profile?.company_id || '',
          integration_type: 'google_api',
          settings: { api_key: googleApiKey },
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "API Key Salva",
        description: "Google API Key foi salva com sucesso e está protegida."
      });

      setGoogleApiKey("••••••••••••••••"); // Mascarar após salvar
    } catch (error) {
      toast({
        title: "Erro ao Salvar API Key",
        description: "Erro ao salvar a API Key. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsSavingApiKey(false);
    }
  };

  const syncGoogleSheets = async () => {
    if (!googleSheetsSettings.spreadsheetUrl) {
      toast({
        title: "URL Necessária",
        description: "Configure a URL da planilha antes de sincronizar.",
        variant: "destructive"
      });
      return;
    }

    setIsSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke('sync-google-sheets', {
        body: {
          settings: googleSheetsSettings
        }
      });

      if (error) throw error;

      toast({
        title: "Sincronização Iniciada",
        description: `Importando ${data.totalRecords} registros da planilha.`
      });

      // Reload logs after sync
      setTimeout(() => {
        loadImportLogs();
      }, 1000);
    } catch (error) {
      toast({
        title: "Erro na Sincronização",
        description: "Erro ao sincronizar com o Google Sheets. Verifique a URL e permissões.",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-success" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return <Clock className="h-4 w-4 text-warning" />;
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'completed':
        return 'default';
      case 'failed':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4" />
          Configurações
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Configurações do Sistema
          </DialogTitle>
          <DialogDescription>
            Configure integrações e preferências do sistema
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="google-sheets" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="google-sheets" className="flex items-center gap-2">
              <Sheet className="h-4 w-4" />
              Google Sheets
            </TabsTrigger>
            <TabsTrigger value="import-history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              Histórico
            </TabsTrigger>
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Geral
            </TabsTrigger>
          </TabsList>

          <TabsContent value="google-sheets" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sheet className="h-5 w-5" />
                  Configuração do Google Sheets
                </CardTitle>
                <CardDescription>
                  Configure a sincronização automática com sua planilha do Google Sheets
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="spreadsheet-url">URL da Planilha</Label>
                  <Input
                    id="spreadsheet-url"
                    placeholder="https://docs.google.com/spreadsheets/d/..."
                    value={googleSheetsSettings.spreadsheetUrl}
                    onChange={(e) => setGoogleSheetsSettings(prev => ({
                      ...prev,
                      spreadsheetUrl: e.target.value
                    }))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="sheet-name">Nome da Aba</Label>
                  <Input
                    id="sheet-name"
                    placeholder="Sheet1"
                    value={googleSheetsSettings.sheetName}
                    onChange={(e) => setGoogleSheetsSettings(prev => ({
                      ...prev,
                      sheetName: e.target.value
                    }))}
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label className="text-base font-medium">Mapeamento de Colunas</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="col-name">Nome (Coluna)</Label>
                      <Input
                        id="col-name"
                        placeholder="A"
                        value={googleSheetsSettings.columnMapping.name}
                        onChange={(e) => setGoogleSheetsSettings(prev => ({
                          ...prev,
                          columnMapping: { ...prev.columnMapping, name: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="col-email">Email (Coluna)</Label>
                      <Input
                        id="col-email"
                        placeholder="B"
                        value={googleSheetsSettings.columnMapping.email}
                        onChange={(e) => setGoogleSheetsSettings(prev => ({
                          ...prev,
                          columnMapping: { ...prev.columnMapping, email: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="col-phone">Telefone (Coluna)</Label>
                      <Input
                        id="col-phone"
                        placeholder="C"
                        value={googleSheetsSettings.columnMapping.phone}
                        onChange={(e) => setGoogleSheetsSettings(prev => ({
                          ...prev,
                          columnMapping: { ...prev.columnMapping, phone: e.target.value }
                        }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="col-cpf">CPF/CNPJ (Coluna)</Label>
                      <Input
                        id="col-cpf"
                        placeholder="D"
                        value={googleSheetsSettings.columnMapping.cpfCnpj}
                        onChange={(e) => setGoogleSheetsSettings(prev => ({
                          ...prev,
                          columnMapping: { ...prev.columnMapping, cpfCnpj: e.target.value }
                        }))}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="text-base font-medium">Sincronização Automática</Label>
                    <p className="text-sm text-muted-foreground">
                      Sincronizar automaticamente a cada {googleSheetsSettings.syncInterval} minutos
                    </p>
                  </div>
                  <Switch
                    checked={googleSheetsSettings.autoSync}
                    onCheckedChange={(checked) => setGoogleSheetsSettings(prev => ({
                      ...prev,
                      autoSync: checked
                    }))}
                  />
                </div>

                <div className="flex gap-2">
                  <Button 
                    onClick={saveSettings} 
                    disabled={isLoading}
                    className="flex-1"
                  >
                    {isLoading ? "Salvando..." : "Salvar Configurações"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={syncGoogleSheets}
                    disabled={isSyncing}
                  >
                    <RefreshCw className={`h-4 w-4 ${isSyncing ? 'animate-spin' : ''}`} />
                    {isSyncing ? "Sincronizando..." : "Sincronizar Agora"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="import-history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="h-5 w-5" />
                  Histórico de Importações
                </CardTitle>
                <CardDescription>
                  Acompanhe o status das sincronizações realizadas
                </CardDescription>
              </CardHeader>
              <CardContent>
                {importLogs.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma importação realizada ainda
                  </p>
                ) : (
                  <div className="space-y-4">
                    {importLogs.map((log) => (
                      <div key={log.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {getStatusIcon(log.status)}
                          <div>
                            <p className="font-medium">{log.source_type}</p>
                            <p className="text-sm text-muted-foreground">
                              {new Date(log.started_at).toLocaleString('pt-BR')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <p className="text-sm">
                              <span className="text-success">{log.successful_imports}</span> /
                              <span className="text-muted-foreground"> {log.total_records}</span>
                            </p>
                            {log.failed_imports > 0 && (
                              <p className="text-xs text-destructive">
                                {log.failed_imports} falhas
                              </p>
                            )}
                          </div>
                          <Badge variant={getStatusVariant(log.status)}>
                            {log.status}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="general" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Configurações Gerais</CardTitle>
                <CardDescription>
                  Configurações do usuário e preferências do sistema
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Usuário</Label>
                  <p className="text-sm text-muted-foreground">{profile?.name}</p>
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <p className="text-sm text-muted-foreground">{profile?.email}</p>
                </div>
                <div className="space-y-2">
                  <Label>Tipo de Acesso</Label>
                  <Badge variant="outline">{profile?.access_type}</Badge>
                </div>
                
                <Separator />
                
                <div className="space-y-4">
                  <Label className="text-base font-medium">Configurações de API</Label>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="google-api-key">Google API Key</Label>
                      <div className="text-sm text-muted-foreground mb-2">
                        Chave necessária para sincronização com Google Sheets. Será armazenada de forma segura.
                      </div>
                      <div className="flex gap-2">
                        <Input
                          id="google-api-key"
                          type="password"
                          placeholder="Digite sua Google API Key"
                          value={googleApiKey}
                          onChange={(e) => setGoogleApiKey(e.target.value)}
                          className="flex-1"
                        />
                        <Button 
                          onClick={saveApiKey}
                          disabled={isSavingApiKey || !googleApiKey || googleApiKey === "••••••••••••••••"}
                          size="sm"
                        >
                          {isSavingApiKey ? "Salvando..." : "Salvar"}
                        </Button>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        🔒 Sua API Key é criptografada e nunca é exibida após ser salva.
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}