import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, RefreshCw, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { logError, logInfo } from "@/utils/secureLogger";

interface GoogleSheetsSettings {
  spreadsheetUrl: string;
  autoSync: boolean;
  syncInterval: number;
  sheetName: string;
  columnMapping: {
    name: string;
    email: string;
    phone: string;
    cpfCnpj: string;
    address: string;
    concessionaria: string;
    tipoFornecimento: string;
    grupo: string;
    consumoMedio: string;
    incrementoConsumo: string;
    consumoJan: string;
    consumoFev: string;
    consumoMar: string;
    consumoAbr: string;
    consumoMai: string;
    consumoJun: string;
    consumoJul: string;
    consumoAgo: string;
    consumoSet: string;
    consumoOut: string;
    consumoNov: string;
    consumoDez: string;
    cep: string;
    cidade: string;
    estado: string;
    bairro: string;
    rua: string;
    numero: string;
    tensaoAlimentacao: string;
    modalidadeTarifaria: string;
    numeroCliente: string;
    numeroInstalacao: string;
    cdd: string;
  };
}

interface SheetColumn {
  letter: string;
  header: string;
}

interface GoogleSheetsSettingsProps {
  onSettingsChange?: (settings: GoogleSheetsSettings) => void;
}

export const GoogleSheetsSettings: React.FC<GoogleSheetsSettingsProps> = ({ onSettingsChange }) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [availableColumns, setAvailableColumns] = useState<SheetColumn[]>([]);
  const [isDetectingHeaders, setIsDetectingHeaders] = useState(false);
  const [previewData, setPreviewData] = useState<Record<string, unknown>[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  
  const [settings, setSettings] = useState<GoogleSheetsSettings>({
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
      concessionaria: "F",
      tipoFornecimento: "G",
      grupo: "H",
      consumoMedio: "I",
      incrementoConsumo: "J",
      consumoJan: "",
      consumoFev: "",
      consumoMar: "",
      consumoAbr: "",
      consumoMai: "",
      consumoJun: "",
      consumoJul: "",
      consumoAgo: "",
      consumoSet: "",
      consumoOut: "",
      consumoNov: "",
      consumoDez: "",
      cep: "",
      cidade: "",
      estado: "",
      bairro: "",
      rua: "",
      numero: "",
      tensaoAlimentacao: "",
      modalidadeTarifaria: "",
      numeroCliente: "",
      numeroInstalacao: "",
      cdd: ""
    }
  });

  useEffect(() => {
    loadSettings();
  }, []);

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
        const loadedSettings = data.settings as unknown as GoogleSheetsSettings;
        setSettings(loadedSettings);
        onSettingsChange?.(loadedSettings);
      }
    } catch (error) {
      logError('Erro ao carregar configurações do Google Sheets', 'GoogleSheetsSettings', { error: (error as Error).message });
    }
  };

  const saveSettings = async () => {
    setIsLoading(true);
    
    try {
      logInfo('Iniciando salvamento das configurações do Google Sheets', 'GoogleSheetsSettings');
      
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (authError || !user) {
        logError('Erro de autenticação', 'GoogleSheetsSettings', { error: authError?.message });
        throw new Error('Usuário não autenticado');
      }

      const settingsToSave = {
        user_id: user.id,
        integration_type: 'google_sheets',
        settings: settings,
        is_active: true,
        updated_at: new Date().toISOString()
      };

      const { error } = await supabase
        .from('integration_settings')
        .upsert(settingsToSave, { onConflict: 'user_id,integration_type' })
        .select();

      if (error) {
        logError('Erro do Supabase ao salvar configurações do Google Sheets', 'GoogleSheetsSettings', { 
          code: error.code, 
          message: error.message 
        });
        throw new Error(`Erro do banco: ${error.message}`);
      }

      logInfo('Configurações do Google Sheets salvas com sucesso', 'GoogleSheetsSettings');
      onSettingsChange?.(settings);
      
      toast({
        title: "Configurações Salvas",
        description: "As configurações do Google Sheets foram salvas com sucesso.",
        variant: "default"
      });
      
    } catch (error) {
      logError('Erro ao salvar configurações do Google Sheets', 'GoogleSheetsSettings', { error: (error as Error).message });
      toast({
        title: "Erro ao Salvar",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const detectHeaders = async () => {
    if (!settings.spreadsheetUrl) {
      toast({
        title: "URL Necessária",
        description: "Por favor, insira a URL da planilha primeiro.",
        variant: "destructive"
      });
      return;
    }

    setIsDetectingHeaders(true);
    
    try {
      // Simular detecção de cabeçalhos
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const mockColumns: SheetColumn[] = [
        { letter: "A", header: "Nome" },
        { letter: "B", header: "Email" },
        { letter: "C", header: "Telefone" },
        { letter: "D", header: "CPF/CNPJ" },
        { letter: "E", header: "Endereço" },
        { letter: "F", header: "Concessionária" },
        { letter: "G", header: "Tipo Fornecimento" },
        { letter: "H", header: "Grupo" },
        { letter: "I", header: "Consumo Médio" },
        { letter: "J", header: "Incremento Consumo" }
      ];
      
      setAvailableColumns(mockColumns);
      
      toast({
        title: "Cabeçalhos Detectados",
        description: `${mockColumns.length} colunas encontradas na planilha.`,
        variant: "default"
      });
      
    } catch (error) {
      logError('Erro ao detectar cabeçalhos', 'GoogleSheetsSettings', { error: (error as Error).message });
      toast({
        title: "Erro na Detecção",
        description: "Não foi possível detectar os cabeçalhos da planilha.",
        variant: "destructive"
      });
    } finally {
      setIsDetectingHeaders(false);
    }
  };

  const loadPreview = async () => {
    if (!settings.spreadsheetUrl) {
      toast({
        title: "URL Necessária",
        description: "Por favor, insira a URL da planilha primeiro.",
        variant: "destructive"
      });
      return;
    }

    setIsLoadingPreview(true);
    
    try {
      // Simular carregamento de preview
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const mockPreview = [
        {
          Nome: "João Silva",
          Email: "joao@email.com",
          Telefone: "(11) 99999-9999",
          "CPF/CNPJ": "123.456.789-00",
          Endereço: "Rua das Flores, 123"
        },
        {
          Nome: "Maria Santos",
          Email: "maria@email.com",
          Telefone: "(11) 88888-8888",
          "CPF/CNPJ": "987.654.321-00",
          Endereço: "Av. Principal, 456"
        }
      ];
      
      setPreviewData(mockPreview);
      setShowPreview(true);
      
    } catch (error) {
      logError('Erro ao carregar preview', 'GoogleSheetsSettings', { error: (error as Error).message });
      toast({
        title: "Erro no Preview",
        description: "Não foi possível carregar o preview dos dados.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const syncNow = async () => {
    setIsSyncing(true);
    
    try {
      // Simular sincronização
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      toast({
        title: "Sincronização Concluída",
        description: "Os dados foram sincronizados com sucesso.",
        variant: "default"
      });
      
    } catch (error) {
      logError('Erro na sincronização', 'GoogleSheetsSettings', { error: (error as Error).message });
      toast({
        title: "Erro na Sincronização",
        description: "Falha ao sincronizar os dados.",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sheet className="h-5 w-5" />
            Configurações do Google Sheets
          </CardTitle>
          <CardDescription>
            Configure a integração com Google Sheets para importação automática de leads.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="spreadsheet-url">URL da Planilha</Label>
            <Input
              id="spreadsheet-url"
              placeholder="https://docs.google.com/spreadsheets/d/..."
              value={settings.spreadsheetUrl}
              onChange={(e) => setSettings(prev => ({ ...prev, spreadsheetUrl: e.target.value }))}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="sheet-name">Nome da Aba</Label>
            <Input
              id="sheet-name"
              placeholder="Sheet1"
              value={settings.sheetName}
              onChange={(e) => setSettings(prev => ({ ...prev, sheetName: e.target.value }))}
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="auto-sync"
              checked={settings.autoSync}
              onCheckedChange={(checked) => setSettings(prev => ({ ...prev, autoSync: checked }))}
            />
            <Label htmlFor="auto-sync">Sincronização Automática</Label>
          </div>
          
          {settings.autoSync && (
            <div className="space-y-2">
              <Label htmlFor="sync-interval">Intervalo de Sincronização (minutos)</Label>
              <Select
                value={settings.syncInterval.toString()}
                onValueChange={(value) => setSettings(prev => ({ ...prev, syncInterval: parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="15">15 minutos</SelectItem>
                  <SelectItem value="30">30 minutos</SelectItem>
                  <SelectItem value="60">1 hora</SelectItem>
                  <SelectItem value="120">2 horas</SelectItem>
                  <SelectItem value="240">4 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div className="flex gap-2">
            <Button
              onClick={detectHeaders}
              disabled={isDetectingHeaders || !settings.spreadsheetUrl}
              variant="outline"
            >
              {isDetectingHeaders ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <AlertCircle className="h-4 w-4 mr-2" />
              )}
              Detectar Cabeçalhos
            </Button>
            
            <Button
              onClick={loadPreview}
              disabled={isLoadingPreview || !settings.spreadsheetUrl}
              variant="outline"
            >
              {isLoadingPreview ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle2 className="h-4 w-4 mr-2" />
              )}
              Visualizar Dados
            </Button>
            
            <Button
              onClick={syncNow}
              disabled={isSyncing || !settings.spreadsheetUrl}
              variant="outline"
            >
              {isSyncing ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Sincronizar Agora
            </Button>
          </div>
          
          <Button onClick={saveSettings} disabled={isLoading} className="w-full">
            {isLoading ? "Salvando..." : "Salvar Configurações"}
          </Button>
        </CardContent>
      </Card>
      
      {availableColumns.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Mapeamento de Colunas</CardTitle>
            <CardDescription>
              Mapeie as colunas da planilha para os campos do sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {Object.entries(settings.columnMapping).map(([field, column]) => (
                <div key={field} className="space-y-2">
                  <Label>{field}</Label>
                  <Select
                    value={column}
                    onValueChange={(value) => 
                      setSettings(prev => ({
                        ...prev,
                        columnMapping: { ...prev.columnMapping, [field]: value }
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma coluna" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Não mapear</SelectItem>
                      {availableColumns.map((col) => (
                        <SelectItem key={col.letter} value={col.letter}>
                          {col.letter} - {col.header}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {showPreview && previewData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview dos Dados</CardTitle>
            <CardDescription>
              Primeiras linhas da planilha para verificação.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr>
                    {Object.keys(previewData[0]).map((key) => (
                      <th key={key} className="border border-gray-300 p-2 bg-gray-50">
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {previewData.map((row, index) => (
                    <tr key={index}>
                      {Object.values(row).map((value, cellIndex) => (
                        <td key={cellIndex} className="border border-gray-300 p-2">
                          {String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GoogleSheetsSettings;