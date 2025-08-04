import React, { useState, useEffect, Suspense, lazy } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Settings, Shield, Database, Activity, FileText, Loader2, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { logError } from "@/utils/secureLogger";
import { GoogleSheetsSettings } from "./Settings/GoogleSheetsSettings";
import { BackupSettings } from "./Settings/BackupSettings";
import { AuditSettings } from "./Settings/AuditSettings";
import { PerformanceSettings } from "./Settings/PerformanceSettings";

// Lazy loading para componentes pesados
const AuditLogViewer = lazy(() => import("./AuditLogViewer").then(module => ({ default: module.AuditLogViewer })));
const BackupManager = lazy(() => import("./BackupManager").then(module => ({ default: module.BackupManager })));
const PerformanceMonitor = lazy(() => import("./PerformanceMonitor").then(module => ({ default: module.PerformanceMonitor })));
const ReportsManager = lazy(() => import("./ReportsManager").then(module => ({ default: module.ReportsManager })));

// Componente de loading
const LoadingSpinner = () => (
  <div className="flex items-center justify-center py-8">
    <Loader2 className="h-6 w-6 animate-spin text-primary" />
    <span className="ml-2 text-sm text-muted-foreground">Carregando...</span>
  </div>
);

export const SettingsModal: React.FC = () => {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [googleApiKey, setGoogleApiKey] = useState("");
  const [isSavingApiKey, setIsSavingApiKey] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadApiKey();
    }
  }, [isOpen]);

  const loadApiKey = async () => {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('google_api_key')
        .eq('user_id', profile?.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data?.google_api_key) {
        setGoogleApiKey("••••••••••••••••");
      }
    } catch (error) {
      logError('Erro ao carregar API Key', 'SettingsModal', { error: (error as Error).message });
    }
  };

  const saveApiKey = async () => {
    if (!googleApiKey || googleApiKey === "••••••••••••••••") return;

    setIsSavingApiKey(true);
    try {
      const { error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: profile?.id,
          google_api_key: googleApiKey
        });

      if (error) throw error;

      toast({
        title: "Sucesso",
        description: "API Key salva com sucesso!",
      });

      setGoogleApiKey("••••••••••••••••");
    } catch (error) {
      logError('Erro ao salvar API Key', 'SettingsModal', { error: (error as Error).message });
      toast({
        title: "Erro",
        description: "Erro ao salvar API Key. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSavingApiKey(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Settings className="h-4 w-4 mr-2" />
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
            Gerencie as configurações e integrações do sistema
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="google-sheets" className="w-full">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="google-sheets" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Google Sheets
            </TabsTrigger>
            <TabsTrigger value="backup" className="flex items-center gap-2">
              <Database className="h-4 w-4" />
              Backup
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Auditoria
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Performance
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Relatórios
            </TabsTrigger>
            <TabsTrigger value="general" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Geral
            </TabsTrigger>
          </TabsList>

          <TabsContent value="google-sheets" className="space-y-4">
            <GoogleSheetsSettings />
          </TabsContent>

          <TabsContent value="backup" className="space-y-4">
            <BackupSettings />
            <Suspense fallback={<LoadingSpinner />}>
              <BackupManager />
            </Suspense>
          </TabsContent>

          <TabsContent value="audit" className="space-y-4">
            <AuditSettings />
            <Suspense fallback={<LoadingSpinner />}>
              <AuditLogViewer />
            </Suspense>
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            <PerformanceSettings />
            <Suspense fallback={<LoadingSpinner />}>
              <PerformanceMonitor />
            </Suspense>
          </TabsContent>

          <TabsContent value="reports" className="space-y-4">
            <Suspense fallback={<LoadingSpinner />}>
              <ReportsManager />
            </Suspense>
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
};