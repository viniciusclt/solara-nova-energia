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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Sheet, RefreshCw, History, AlertCircle, CheckCircle2, Clock, Search } from "lucide-react";
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
    concessionaria: string;
    tipoFornecimento: string;
    grupo: string;
    consumoMedio: string;
    incrementoConsumo: string;
    // Consumo mensal (Jan-Dez)
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
    // Campos adicionais de endereço
    cep: string;
    cidade: string;
    estado: string;
    bairro: string;
    rua: string;
    numero: string;
    // Campos elétricos adicionais
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
      concessionaria: "F",
      tipoFornecimento: "G",
      grupo: "H",
      consumoMedio: "I",
      incrementoConsumo: "J",
      // Consumo mensal (Jan-Dez)
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
      // Campos adicionais de endereço
      cep: "",
      cidade: "",
      estado: "",
      bairro: "",
      rua: "",
      numero: "",
      // Campos elétricos adicionais
      tensaoAlimentacao: "",
      modalidadeTarifaria: "",
      numeroCliente: "",
      numeroInstalacao: "",
      cdd: ""
    }
  });

  const [availableColumns, setAvailableColumns] = useState<SheetColumn[]>([]);
  const [isDetectingHeaders, setIsDetectingHeaders] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

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
          company_id: profile?.company_id || null, // Use null instead of empty string
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
          company_id: profile?.company_id || null, // Use null instead of empty string
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

  const extractSpreadsheetId = (url: string): string | null => {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    return match ? match[1] : null;
  };

  const columnLetterToIndex = (letter: string): number => {
    let index = 0;
    for (let i = 0; i < letter.length; i++) {
      index = index * 26 + (letter.charCodeAt(i) - 64);
    }
    return index - 1;
  };

  const columnIndexToLetter = (index: number): string => {
    let letter = '';
    while (index >= 0) {
      letter = String.fromCharCode((index % 26) + 65) + letter;
      index = Math.floor(index / 26) - 1;
    }
    return letter;
  };

  const detectHeaders = async () => {
    if (!googleSheetsSettings.spreadsheetUrl || !googleSheetsSettings.sheetName) {
      toast({
        title: "Dados Necessários",
        description: "Configure a URL da planilha e nome da aba antes de detectar headers.",
        variant: "destructive"
      });
      return;
    }

    const spreadsheetId = extractSpreadsheetId(googleSheetsSettings.spreadsheetUrl);
    if (!spreadsheetId) {
      toast({
        title: "URL Inválida",
        description: "A URL da planilha não é válida.",
        variant: "destructive"
      });
      return;
    }

    setIsDetectingHeaders(true);
    try {
      // Get API key from database
      const { data: apiKeyData } = await supabase
        .from('integration_settings')
        .select('*')
        .eq('integration_type', 'google_api')
        .single();

      if (!apiKeyData?.settings || !(apiKeyData.settings as any).api_key) {
        toast({
          title: "API Key Necessária",
          description: "Configure sua Google API Key antes de detectar headers.",
          variant: "destructive"
        });
        return;
      }

      const apiKey = (apiKeyData.settings as any).api_key;
      const range = `${googleSheetsSettings.sheetName}!1:1`;
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || 'Erro ao acessar a planilha');
      }

      if (data.values && data.values[0]) {
        const headers = data.values[0];
        const columns: SheetColumn[] = headers.map((header: string, index: number) => ({
          letter: columnIndexToLetter(index),
          header: header || `Coluna ${columnIndexToLetter(index)}`
        }));

        setAvailableColumns(columns);
        
        // Auto-match headers
        autoMatchColumns(columns);

        toast({
          title: "Headers Detectados",
          description: `${headers.length} colunas encontradas e mapeamento automático aplicado.`
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao Detectar Headers",
        description: error.message || "Verifique a URL, API Key e permissões da planilha.",
        variant: "destructive"
      });
    } finally {
      setIsDetectingHeaders(false);
    }
  };

  const autoMatchColumns = (columns: SheetColumn[]) => {
    const fieldMatchers: Record<string, string[]> = {
      name: ['nome', 'name', 'cliente', 'lead', 'contato'],
      email: ['email', 'e-mail', 'correio', 'mail'],
      phone: ['telefone', 'phone', 'celular', 'tel', 'fone', 'contato'],
      cpfCnpj: ['cpf', 'cnpj', 'documento', 'doc', 'cpf/cnpj'],
      address: ['endereço', 'endereco', 'address', 'rua', 'local'],
      concessionaria: ['concessionária', 'concessionaria', 'distribuidora', 'empresa'],
      tipoFornecimento: ['tipo', 'fornecimento', 'monofásico', 'bifásico', 'trifásico', 'fase'],
      grupo: ['grupo', 'subgrupo', 'classe', 'categoria', 'b1', 'b3'],
      consumoMedio: ['consumo', 'kwh', 'energia', 'gasto', 'média', 'medio'],
      incrementoConsumo: ['incremento', 'aumento', 'crescimento', 'variação', 'variacao'],
      // Consumo mensal
      consumoJan: ['janeiro', 'jan', 'january', '01', 'mês 1', 'mes 1'],
      consumoFev: ['fevereiro', 'fev', 'february', '02', 'mês 2', 'mes 2'],
      consumoMar: ['março', 'mar', 'march', '03', 'mês 3', 'mes 3'],
      consumoAbr: ['abril', 'abr', 'april', '04', 'mês 4', 'mes 4'],
      consumoMai: ['maio', 'mai', 'may', '05', 'mês 5', 'mes 5'],
      consumoJun: ['junho', 'jun', 'june', '06', 'mês 6', 'mes 6'],
      consumoJul: ['julho', 'jul', 'july', '07', 'mês 7', 'mes 7'],
      consumoAgo: ['agosto', 'ago', 'august', '08', 'mês 8', 'mes 8'],
      consumoSet: ['setembro', 'set', 'september', '09', 'mês 9', 'mes 9'],
      consumoOut: ['outubro', 'out', 'october', '10', 'mês 10', 'mes 10'],
      consumoNov: ['novembro', 'nov', 'november', '11', 'mês 11', 'mes 11'],
      consumoDez: ['dezembro', 'dez', 'december', '12', 'mês 12', 'mes 12'],
      // Campos de endereço
      cep: ['cep', 'código postal', 'codigo postal', 'postal code'],
      cidade: ['cidade', 'city', 'município', 'municipio'],
      estado: ['estado', 'uf', 'state', 'província', 'provincia'],
      bairro: ['bairro', 'distrito', 'neighborhood', 'district'],
      rua: ['rua', 'logradouro', 'street', 'avenida', 'av'],
      numero: ['número', 'numero', 'number', 'nº', 'n°'],
      // Campos elétricos
      tensaoAlimentacao: ['tensão', 'tensao', 'voltage', 'volt', 'v', 'alimentação', 'alimentacao'],
      modalidadeTarifaria: ['modalidade', 'tarifa', 'tarifária', 'tarifaria', 'tariff'],
      numeroCliente: ['cliente', 'customer', 'nº cliente', 'numero cliente'],
      numeroInstalacao: ['instalação', 'instalacao', 'installation', 'nº instalação', 'numero instalacao'],
      cdd: ['cdd', 'código distribuidora', 'codigo distribuidora']
    };

    const newMapping = { ...googleSheetsSettings.columnMapping };

    Object.entries(fieldMatchers).forEach(([field, keywords]) => {
      const matchedColumn = columns.find(col => 
        keywords.some(keyword => 
          col.header.toLowerCase().includes(keyword.toLowerCase())
        )
      );
      
      if (matchedColumn) {
        newMapping[field as keyof typeof newMapping] = matchedColumn.letter;
      }
    });

    setGoogleSheetsSettings(prev => ({
      ...prev,
      columnMapping: newMapping
    }));
  };

  const updateColumnMapping = (field: string, columnLetter: string) => {
    // Convert "none" to empty string for storage
    const value = columnLetter === "none" ? "" : columnLetter;
    setGoogleSheetsSettings(prev => ({
      ...prev,
      columnMapping: {
        ...prev.columnMapping,
        [field]: value
      }
    }));
  };

  const loadPreviewData = async () => {
    if (!googleSheetsSettings.spreadsheetUrl || !googleSheetsSettings.sheetName) {
      toast({
        title: "Dados Necessários",
        description: "Configure a URL da planilha e nome da aba antes de carregar preview.",
        variant: "destructive"
      });
      return;
    }

    const spreadsheetId = extractSpreadsheetId(googleSheetsSettings.spreadsheetUrl);
    if (!spreadsheetId) {
      toast({
        title: "URL Inválida",
        description: "A URL da planilha não é válida.",
        variant: "destructive"
      });
      return;
    }

    setIsLoadingPreview(true);
    try {
      // Get API key from database
      const { data: apiKeyData } = await supabase
        .from('integration_settings')
        .select('*')
        .eq('integration_type', 'google_api')
        .single();

      if (!apiKeyData?.settings || !(apiKeyData.settings as any).api_key) {
        toast({
          title: "API Key Necessária",
          description: "Configure sua Google API Key antes de carregar preview.",
          variant: "destructive"
        });
        return;
      }

      const apiKey = (apiKeyData.settings as any).api_key;
      const range = `${googleSheetsSettings.sheetName}!1:6`; // Header + 5 rows for preview
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;

      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || 'Erro ao acessar a planilha');
      }

      if (data.values && data.values.length > 1) {
        const [headers, ...rows] = data.values;
        
        // Process preview data using current mapping
        const processedData = rows.map((row: any[], index: number) => {
          const getValue = (column: string) => {
            if (!column) return '';
            const colIndex = columnLetterToIndex(column);
            return row[colIndex] || '';
          };

          // Obter valores de consumo mensal
          const consumoMensal = [
            getValue(googleSheetsSettings.columnMapping.consumoJan),
            getValue(googleSheetsSettings.columnMapping.consumoFev),
            getValue(googleSheetsSettings.columnMapping.consumoMar),
            getValue(googleSheetsSettings.columnMapping.consumoAbr),
            getValue(googleSheetsSettings.columnMapping.consumoMai),
            getValue(googleSheetsSettings.columnMapping.consumoJun),
            getValue(googleSheetsSettings.columnMapping.consumoJul),
            getValue(googleSheetsSettings.columnMapping.consumoAgo),
            getValue(googleSheetsSettings.columnMapping.consumoSet),
            getValue(googleSheetsSettings.columnMapping.consumoOut),
            getValue(googleSheetsSettings.columnMapping.consumoNov),
            getValue(googleSheetsSettings.columnMapping.consumoDez)
          ];

          // Verificar se há dados mensais mapeados
          const hasMonthlyData = consumoMensal.some(value => value !== '');

          return {
            rowIndex: index + 2, // +2 because we start from row 2 (after header)
            name: getValue(googleSheetsSettings.columnMapping.name),
            email: getValue(googleSheetsSettings.columnMapping.email),
            phone: getValue(googleSheetsSettings.columnMapping.phone),
            cpfCnpj: getValue(googleSheetsSettings.columnMapping.cpfCnpj),
            address: getValue(googleSheetsSettings.columnMapping.address),
            concessionaria: getValue(googleSheetsSettings.columnMapping.concessionaria),
            consumoMedio: getValue(googleSheetsSettings.columnMapping.consumoMedio),
            // Monthly consumption preview
            consumoMensal: hasMonthlyData ? consumoMensal : null,
            // Individual monthly values for detailed preview
            consumoJan: getValue(googleSheetsSettings.columnMapping.consumoJan),
            consumoFev: getValue(googleSheetsSettings.columnMapping.consumoFev),
            consumoMar: getValue(googleSheetsSettings.columnMapping.consumoMar),
            consumoAbr: getValue(googleSheetsSettings.columnMapping.consumoAbr),
            consumoMai: getValue(googleSheetsSettings.columnMapping.consumoMai),
            consumoJun: getValue(googleSheetsSettings.columnMapping.consumoJun),
            consumoJul: getValue(googleSheetsSettings.columnMapping.consumoJul),
            consumoAgo: getValue(googleSheetsSettings.columnMapping.consumoAgo),
            consumoSet: getValue(googleSheetsSettings.columnMapping.consumoSet),
            consumoOut: getValue(googleSheetsSettings.columnMapping.consumoOut),
            consumoNov: getValue(googleSheetsSettings.columnMapping.consumoNov),
            consumoDez: getValue(googleSheetsSettings.columnMapping.consumoDez),
            // Additional fields
            cep: getValue(googleSheetsSettings.columnMapping.cep),
            cidade: getValue(googleSheetsSettings.columnMapping.cidade),
            estado: getValue(googleSheetsSettings.columnMapping.estado)
          };
        });

        setPreviewData(processedData);
        setShowPreview(true);

        toast({
          title: "Preview Carregado",
          description: `${processedData.length} registros carregados para preview.`
        });
      }
    } catch (error: any) {
      toast({
        title: "Erro ao Carregar Preview",
        description: error.message || "Verifique a URL, API Key e permissões da planilha.",
        variant: "destructive"
      });
    } finally {
      setIsLoadingPreview(false);
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

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={detectHeaders}
                    disabled={isDetectingHeaders || !googleSheetsSettings.spreadsheetUrl || !googleSheetsSettings.sheetName}
                  >
                    <Search className={`h-4 w-4 ${isDetectingHeaders ? 'animate-spin' : ''}`} />
                    {isDetectingHeaders ? "Detectando..." : "Detectar Headers"}
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={loadPreviewData}
                    disabled={isLoadingPreview || !googleSheetsSettings.spreadsheetUrl || !googleSheetsSettings.sheetName}
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoadingPreview ? 'animate-spin' : ''}`} />
                    {isLoadingPreview ? "Carregando..." : "Preview Dados"}
                  </Button>
                  {availableColumns.length > 0 && (
                    <Badge variant="secondary" className="ml-auto">
                      {availableColumns.length} colunas detectadas
                    </Badge>
                  )}
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label className="text-base font-medium">Mapeamento de Colunas</Label>
                  {availableColumns.length === 0 && (
                    <div className="text-sm text-muted-foreground bg-muted/50 p-4 rounded-lg border-dashed border">
                      Use o botão "Detectar Headers" para carregar automaticamente as colunas da planilha e facilitar o mapeamento.
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Nome */}
                    <div className="space-y-2">
                      <Label>Nome <span className="text-destructive">*</span></Label>
                      {availableColumns.length > 0 ? (
                        <Select 
                          value={googleSheetsSettings.columnMapping.name || "none"} 
                          onValueChange={(value) => updateColumnMapping('name', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a coluna" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableColumns.map((col) => (
                              <SelectItem key={col.letter} value={col.letter}>
                                {col.letter}: {col.header}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          placeholder="A"
                          value={googleSheetsSettings.columnMapping.name}
                          onChange={(e) => updateColumnMapping('name', e.target.value)}
                        />
                      )}
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label>Email</Label>
                      {availableColumns.length > 0 ? (
                        <Select 
                          value={googleSheetsSettings.columnMapping.email || "none"} 
                          onValueChange={(value) => updateColumnMapping('email', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a coluna" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Não mapear</SelectItem>
                            {availableColumns.map((col) => (
                              <SelectItem key={col.letter} value={col.letter}>
                                {col.letter}: {col.header}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          placeholder="B"
                          value={googleSheetsSettings.columnMapping.email}
                          onChange={(e) => updateColumnMapping('email', e.target.value)}
                        />
                      )}
                    </div>

                    {/* Telefone */}
                    <div className="space-y-2">
                      <Label>Telefone</Label>
                      {availableColumns.length > 0 ? (
                        <Select 
                          value={googleSheetsSettings.columnMapping.phone || "none"} 
                          onValueChange={(value) => updateColumnMapping('phone', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a coluna" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Não mapear</SelectItem>
                            {availableColumns.map((col) => (
                              <SelectItem key={col.letter} value={col.letter}>
                                {col.letter}: {col.header}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          placeholder="C"
                          value={googleSheetsSettings.columnMapping.phone}
                          onChange={(e) => updateColumnMapping('phone', e.target.value)}
                        />
                      )}
                    </div>

                    {/* CPF/CNPJ */}
                    <div className="space-y-2">
                      <Label>CPF/CNPJ</Label>
                      {availableColumns.length > 0 ? (
                        <Select 
                          value={googleSheetsSettings.columnMapping.cpfCnpj || "none"}
                          onValueChange={(value) => updateColumnMapping('cpfCnpj', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a coluna" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Não mapear</SelectItem>
                            {availableColumns.map((col) => (
                              <SelectItem key={col.letter} value={col.letter}>
                                {col.letter}: {col.header}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          placeholder="D"
                          value={googleSheetsSettings.columnMapping.cpfCnpj}
                          onChange={(e) => updateColumnMapping('cpfCnpj', e.target.value)}
                        />
                      )}
                    </div>

                    {/* Endereço */}
                    <div className="space-y-2">
                      <Label>Endereço</Label>
                      {availableColumns.length > 0 ? (
                        <Select 
                          value={googleSheetsSettings.columnMapping.address || "none"}
                          onValueChange={(value) => updateColumnMapping('address', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a coluna" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Não mapear</SelectItem>
                            {availableColumns.map((col) => (
                              <SelectItem key={col.letter} value={col.letter}>
                                {col.letter}: {col.header}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          placeholder="E"
                          value={googleSheetsSettings.columnMapping.address}
                          onChange={(e) => updateColumnMapping('address', e.target.value)}
                        />
                      )}
                    </div>

                    {/* Concessionária */}
                    <div className="space-y-2">
                      <Label>Concessionária</Label>
                      {availableColumns.length > 0 ? (
                        <Select 
                          value={googleSheetsSettings.columnMapping.concessionaria || "none"}
                          onValueChange={(value) => updateColumnMapping('concessionaria', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a coluna" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Não mapear</SelectItem>
                            {availableColumns.map((col) => (
                              <SelectItem key={col.letter} value={col.letter}>
                                {col.letter}: {col.header}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          placeholder="F"
                          value={googleSheetsSettings.columnMapping.concessionaria}
                          onChange={(e) => updateColumnMapping('concessionaria', e.target.value)}
                        />
                      )}
                    </div>

                    {/* Tipo de Fornecimento */}
                    <div className="space-y-2">
                      <Label>Tipo de Fornecimento</Label>
                      {availableColumns.length > 0 ? (
                        <Select 
                          value={googleSheetsSettings.columnMapping.tipoFornecimento || "none"}
                          onValueChange={(value) => updateColumnMapping('tipoFornecimento', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a coluna" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Não mapear</SelectItem>
                            {availableColumns.map((col) => (
                              <SelectItem key={col.letter} value={col.letter}>
                                {col.letter}: {col.header}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          placeholder="G"
                          value={googleSheetsSettings.columnMapping.tipoFornecimento}
                          onChange={(e) => updateColumnMapping('tipoFornecimento', e.target.value)}
                        />
                      )}
                    </div>

                    {/* Grupo/Subgrupo */}
                    <div className="space-y-2">
                      <Label>Grupo/Subgrupo</Label>
                      {availableColumns.length > 0 ? (
                        <Select 
                          value={googleSheetsSettings.columnMapping.grupo || "none"} 
                          onValueChange={(value) => updateColumnMapping('grupo', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a coluna" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Não mapear</SelectItem>
                            {availableColumns.map((col) => (
                              <SelectItem key={col.letter} value={col.letter}>
                                {col.letter}: {col.header}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          placeholder="H"
                          value={googleSheetsSettings.columnMapping.grupo}
                          onChange={(e) => updateColumnMapping('grupo', e.target.value)}
                        />
                      )}
                    </div>

                    {/* Consumo Médio */}
                    <div className="space-y-2">
                      <Label>Consumo Médio (kWh)</Label>
                      {availableColumns.length > 0 ? (
                        <Select 
                          value={googleSheetsSettings.columnMapping.consumoMedio || "none"} 
                          onValueChange={(value) => updateColumnMapping('consumoMedio', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a coluna" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Não mapear</SelectItem>
                            {availableColumns.map((col) => (
                              <SelectItem key={col.letter} value={col.letter}>
                                {col.letter}: {col.header}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          placeholder="I"
                          value={googleSheetsSettings.columnMapping.consumoMedio}
                          onChange={(e) => updateColumnMapping('consumoMedio', e.target.value)}
                        />
                      )}
                    </div>

                    {/* Incremento de Consumo */}
                    <div className="space-y-2">
                      <Label>Incremento de Consumo</Label>
                      {availableColumns.length > 0 ? (
                        <Select 
                          value={googleSheetsSettings.columnMapping.incrementoConsumo || "none"} 
                          onValueChange={(value) => updateColumnMapping('incrementoConsumo', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a coluna" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Não mapear</SelectItem>
                            {availableColumns.map((col) => (
                              <SelectItem key={col.letter} value={col.letter}>
                                {col.letter}: {col.header}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          placeholder="J"
                          value={googleSheetsSettings.columnMapping.incrementoConsumo}
                          onChange={(e) => updateColumnMapping('incrementoConsumo', e.target.value)}
                        />
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Seção de Consumo Mensal */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">Consumo Mensal (kWh)</Label>
                      <Badge variant="secondary" className="text-xs">
                        Opcional - Para análise detalhada
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                      Configure o mapeamento para os dados de consumo mensal (Janeiro a Dezembro). 
                      Estes campos são opcionais e permitem análises mais detalhadas do perfil de consumo.
                    </div>
                    
                    {/* Botão para mapear automaticamente colunas sequenciais */}
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          // Solicitar a coluna inicial (Janeiro)
                          const startColumn = prompt("Digite a letra da coluna para Janeiro:");
                          if (!startColumn) return;
                          
                          // Validar formato da coluna
                          if (!/^[A-Z]+$/.test(startColumn)) {
                            toast({
                              title: "Formato Inválido",
                              description: "A coluna deve ser uma letra de A a Z",
                              variant: "destructive"
                            });
                            return;
                          }
                          
                          // Mapear 12 colunas sequenciais a partir da inicial
                          const newMapping = { ...googleSheetsSettings.columnMapping };
                          const months = ['consumoJan', 'consumoFev', 'consumoMar', 'consumoAbr', 
                                         'consumoMai', 'consumoJun', 'consumoJul', 'consumoAgo', 
                                         'consumoSet', 'consumoOut', 'consumoNov', 'consumoDez'];
                          
                          let currentCol = startColumn;
                          months.forEach(month => {
                            newMapping[month] = currentCol;
                            // Avançar para próxima coluna (ex: A -> B, Z -> AA)
                            currentCol = columnIndexToLetter(columnLetterToIndex(currentCol) + 1);
                          });
                          
                          setGoogleSheetsSettings(prev => ({
                            ...prev,
                            columnMapping: newMapping
                          }));
                          
                          toast({
                            title: "Mapeamento Automático",
                            description: `Colunas de consumo mensal mapeadas de ${startColumn} a ${columnIndexToLetter(columnLetterToIndex(startColumn) + 11)}`,
                          });
                        }}
                      >
                        Mapear Colunas Sequenciais
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        Use quando os meses estiverem em colunas consecutivas
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
                      {/* Janeiro */}
                      <div className="space-y-2">
                        <Label>Janeiro</Label>
                        {availableColumns.length > 0 ? (
                          <Select 
                            value={googleSheetsSettings.columnMapping.consumoJan || "none"} 
                            onValueChange={(value) => updateColumnMapping('consumoJan', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a coluna" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Não mapear</SelectItem>
                              {availableColumns.map((col) => (
                                <SelectItem key={col.letter} value={col.letter}>
                                  {col.letter}: {col.header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder="K"
                            value={googleSheetsSettings.columnMapping.consumoJan}
                            onChange={(e) => updateColumnMapping('consumoJan', e.target.value)}
                          />
                        )}
                      </div>

                      {/* Fevereiro */}
                      <div className="space-y-2">
                        <Label>Fevereiro</Label>
                        {availableColumns.length > 0 ? (
                          <Select 
                            value={googleSheetsSettings.columnMapping.consumoFev || "none"} 
                            onValueChange={(value) => updateColumnMapping('consumoFev', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a coluna" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Não mapear</SelectItem>
                              {availableColumns.map((col) => (
                                <SelectItem key={col.letter} value={col.letter}>
                                  {col.letter}: {col.header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder="L"
                            value={googleSheetsSettings.columnMapping.consumoFev}
                            onChange={(e) => updateColumnMapping('consumoFev', e.target.value)}
                          />
                        )}
                      </div>

                      {/* Março */}
                      <div className="space-y-2">
                        <Label>Março</Label>
                        {availableColumns.length > 0 ? (
                          <Select 
                            value={googleSheetsSettings.columnMapping.consumoMar || "none"} 
                            onValueChange={(value) => updateColumnMapping('consumoMar', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a coluna" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Não mapear</SelectItem>
                              {availableColumns.map((col) => (
                                <SelectItem key={col.letter} value={col.letter}>
                                  {col.letter}: {col.header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder="M"
                            value={googleSheetsSettings.columnMapping.consumoMar}
                            onChange={(e) => updateColumnMapping('consumoMar', e.target.value)}
                          />
                        )}
                      </div>

                      {/* Abril */}
                      <div className="space-y-2">
                        <Label>Abril</Label>
                        {availableColumns.length > 0 ? (
                          <Select 
                            value={googleSheetsSettings.columnMapping.consumoAbr || "none"} 
                            onValueChange={(value) => updateColumnMapping('consumoAbr', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a coluna" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Não mapear</SelectItem>
                              {availableColumns.map((col) => (
                                <SelectItem key={col.letter} value={col.letter}>
                                  {col.letter}: {col.header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder="N"
                            value={googleSheetsSettings.columnMapping.consumoAbr}
                            onChange={(e) => updateColumnMapping('consumoAbr', e.target.value)}
                          />
                        )}
                      </div>

                      {/* Maio */}
                      <div className="space-y-2">
                        <Label>Maio</Label>
                        {availableColumns.length > 0 ? (
                          <Select 
                            value={googleSheetsSettings.columnMapping.consumoMai || "none"} 
                            onValueChange={(value) => updateColumnMapping('consumoMai', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a coluna" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Não mapear</SelectItem>
                              {availableColumns.map((col) => (
                                <SelectItem key={col.letter} value={col.letter}>
                                  {col.letter}: {col.header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder="O"
                            value={googleSheetsSettings.columnMapping.consumoMai}
                            onChange={(e) => updateColumnMapping('consumoMai', e.target.value)}
                          />
                        )}
                      </div>

                      {/* Junho */}
                      <div className="space-y-2">
                        <Label>Junho</Label>
                        {availableColumns.length > 0 ? (
                          <Select 
                            value={googleSheetsSettings.columnMapping.consumoJun || "none"} 
                            onValueChange={(value) => updateColumnMapping('consumoJun', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a coluna" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Não mapear</SelectItem>
                              {availableColumns.map((col) => (
                                <SelectItem key={col.letter} value={col.letter}>
                                  {col.letter}: {col.header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder="P"
                            value={googleSheetsSettings.columnMapping.consumoJun}
                            onChange={(e) => updateColumnMapping('consumoJun', e.target.value)}
                          />
                        )}
                      </div>

                      {/* Julho */}
                      <div className="space-y-2">
                        <Label>Julho</Label>
                        {availableColumns.length > 0 ? (
                          <Select 
                            value={googleSheetsSettings.columnMapping.consumoJul || "none"} 
                            onValueChange={(value) => updateColumnMapping('consumoJul', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a coluna" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Não mapear</SelectItem>
                              {availableColumns.map((col) => (
                                <SelectItem key={col.letter} value={col.letter}>
                                  {col.letter}: {col.header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder="Q"
                            value={googleSheetsSettings.columnMapping.consumoJul}
                            onChange={(e) => updateColumnMapping('consumoJul', e.target.value)}
                          />
                        )}
                      </div>

                      {/* Agosto */}
                      <div className="space-y-2">
                        <Label>Agosto</Label>
                        {availableColumns.length > 0 ? (
                          <Select 
                            value={googleSheetsSettings.columnMapping.consumoAgo || "none"} 
                            onValueChange={(value) => updateColumnMapping('consumoAgo', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a coluna" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Não mapear</SelectItem>
                              {availableColumns.map((col) => (
                                <SelectItem key={col.letter} value={col.letter}>
                                  {col.letter}: {col.header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder="R"
                            value={googleSheetsSettings.columnMapping.consumoAgo}
                            onChange={(e) => updateColumnMapping('consumoAgo', e.target.value)}
                          />
                        )}
                      </div>

                      {/* Setembro */}
                      <div className="space-y-2">
                        <Label>Setembro</Label>
                        {availableColumns.length > 0 ? (
                          <Select 
                            value={googleSheetsSettings.columnMapping.consumoSet || "none"} 
                            onValueChange={(value) => updateColumnMapping('consumoSet', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a coluna" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Não mapear</SelectItem>
                              {availableColumns.map((col) => (
                                <SelectItem key={col.letter} value={col.letter}>
                                  {col.letter}: {col.header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder="S"
                            value={googleSheetsSettings.columnMapping.consumoSet}
                            onChange={(e) => updateColumnMapping('consumoSet', e.target.value)}
                          />
                        )}
                      </div>

                      {/* Outubro */}
                      <div className="space-y-2">
                        <Label>Outubro</Label>
                        {availableColumns.length > 0 ? (
                          <Select 
                            value={googleSheetsSettings.columnMapping.consumoOut || "none"} 
                            onValueChange={(value) => updateColumnMapping('consumoOut', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a coluna" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Não mapear</SelectItem>
                              {availableColumns.map((col) => (
                                <SelectItem key={col.letter} value={col.letter}>
                                  {col.letter}: {col.header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder="T"
                            value={googleSheetsSettings.columnMapping.consumoOut}
                            onChange={(e) => updateColumnMapping('consumoOut', e.target.value)}
                          />
                        )}
                      </div>

                      {/* Novembro */}
                      <div className="space-y-2">
                        <Label>Novembro</Label>
                        {availableColumns.length > 0 ? (
                          <Select 
                            value={googleSheetsSettings.columnMapping.consumoNov || "none"} 
                            onValueChange={(value) => updateColumnMapping('consumoNov', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a coluna" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Não mapear</SelectItem>
                              {availableColumns.map((col) => (
                                <SelectItem key={col.letter} value={col.letter}>
                                  {col.letter}: {col.header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder="U"
                            value={googleSheetsSettings.columnMapping.consumoNov}
                            onChange={(e) => updateColumnMapping('consumoNov', e.target.value)}
                          />
                        )}
                      </div>

                      {/* Dezembro */}
                      <div className="space-y-2">
                        <Label>Dezembro</Label>
                        {availableColumns.length > 0 ? (
                          <Select 
                            value={googleSheetsSettings.columnMapping.consumoDez || "none"} 
                            onValueChange={(value) => updateColumnMapping('consumoDez', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a coluna" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Não mapear</SelectItem>
                              {availableColumns.map((col) => (
                                <SelectItem key={col.letter} value={col.letter}>
                                  {col.letter}: {col.header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder="V"
                            value={googleSheetsSettings.columnMapping.consumoDez}
                            onChange={(e) => updateColumnMapping('consumoDez', e.target.value)}
                          />
                        )}
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                      {/* Janeiro */}
                      <div className="space-y-2">
                        <Label>Janeiro</Label>
                        {availableColumns.length > 0 ? (
                          <Select 
                            value={googleSheetsSettings.columnMapping.consumoJan || "none"} 
                            onValueChange={(value) => updateColumnMapping('consumoJan', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Coluna" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Não mapear</SelectItem>
                              {availableColumns.map((col) => (
                                <SelectItem key={col.letter} value={col.letter}>
                                  {col.letter}: {col.header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder="K"
                            value={googleSheetsSettings.columnMapping.consumoJan}
                            onChange={(e) => updateColumnMapping('consumoJan', e.target.value)}
                          />
                        )}
                      </div>

                      {/* Fevereiro */}
                      <div className="space-y-2">
                        <Label>Fevereiro</Label>
                        {availableColumns.length > 0 ? (
                          <Select 
                            value={googleSheetsSettings.columnMapping.consumoFev || "none"} 
                            onValueChange={(value) => updateColumnMapping('consumoFev', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Coluna" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Não mapear</SelectItem>
                              {availableColumns.map((col) => (
                                <SelectItem key={col.letter} value={col.letter}>
                                  {col.letter}: {col.header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder="L"
                            value={googleSheetsSettings.columnMapping.consumoFev}
                            onChange={(e) => updateColumnMapping('consumoFev', e.target.value)}
                          />
                        )}
                      </div>

                      {/* Março */}
                      <div className="space-y-2">
                        <Label>Março</Label>
                        {availableColumns.length > 0 ? (
                          <Select 
                            value={googleSheetsSettings.columnMapping.consumoMar || "none"} 
                            onValueChange={(value) => updateColumnMapping('consumoMar', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Coluna" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Não mapear</SelectItem>
                              {availableColumns.map((col) => (
                                <SelectItem key={col.letter} value={col.letter}>
                                  {col.letter}: {col.header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder="M"
                            value={googleSheetsSettings.columnMapping.consumoMar}
                            onChange={(e) => updateColumnMapping('consumoMar', e.target.value)}
                          />
                        )}
                      </div>

                      {/* Abril */}
                      <div className="space-y-2">
                        <Label>Abril</Label>
                        {availableColumns.length > 0 ? (
                          <Select 
                            value={googleSheetsSettings.columnMapping.consumoAbr || "none"} 
                            onValueChange={(value) => updateColumnMapping('consumoAbr', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Coluna" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Não mapear</SelectItem>
                              {availableColumns.map((col) => (
                                <SelectItem key={col.letter} value={col.letter}>
                                  {col.letter}: {col.header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder="N"
                            value={googleSheetsSettings.columnMapping.consumoAbr}
                            onChange={(e) => updateColumnMapping('consumoAbr', e.target.value)}
                          />
                        )}
                      </div>

                      {/* Maio */}
                      <div className="space-y-2">
                        <Label>Maio</Label>
                        {availableColumns.length > 0 ? (
                          <Select 
                            value={googleSheetsSettings.columnMapping.consumoMai || "none"} 
                            onValueChange={(value) => updateColumnMapping('consumoMai', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Coluna" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Não mapear</SelectItem>
                              {availableColumns.map((col) => (
                                <SelectItem key={col.letter} value={col.letter}>
                                  {col.letter}: {col.header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder="O"
                            value={googleSheetsSettings.columnMapping.consumoMai}
                            onChange={(e) => updateColumnMapping('consumoMai', e.target.value)}
                          />
                        )}
                      </div>

                      {/* Junho */}
                      <div className="space-y-2">
                        <Label>Junho</Label>
                        {availableColumns.length > 0 ? (
                          <Select 
                            value={googleSheetsSettings.columnMapping.consumoJun || "none"} 
                            onValueChange={(value) => updateColumnMapping('consumoJun', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Coluna" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Não mapear</SelectItem>
                              {availableColumns.map((col) => (
                                <SelectItem key={col.letter} value={col.letter}>
                                  {col.letter}: {col.header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder="P"
                            value={googleSheetsSettings.columnMapping.consumoJun}
                            onChange={(e) => updateColumnMapping('consumoJun', e.target.value)}
                          />
                        )}
                      </div>

                      {/* Julho */}
                      <div className="space-y-2">
                        <Label>Julho</Label>
                        {availableColumns.length > 0 ? (
                          <Select 
                            value={googleSheetsSettings.columnMapping.consumoJul || "none"} 
                            onValueChange={(value) => updateColumnMapping('consumoJul', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Coluna" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Não mapear</SelectItem>
                              {availableColumns.map((col) => (
                                <SelectItem key={col.letter} value={col.letter}>
                                  {col.letter}: {col.header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder="Q"
                            value={googleSheetsSettings.columnMapping.consumoJul}
                            onChange={(e) => updateColumnMapping('consumoJul', e.target.value)}
                          />
                        )}
                      </div>

                      {/* Agosto */}
                      <div className="space-y-2">
                        <Label>Agosto</Label>
                        {availableColumns.length > 0 ? (
                          <Select 
                            value={googleSheetsSettings.columnMapping.consumoAgo || "none"} 
                            onValueChange={(value) => updateColumnMapping('consumoAgo', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Coluna" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Não mapear</SelectItem>
                              {availableColumns.map((col) => (
                                <SelectItem key={col.letter} value={col.letter}>
                                  {col.letter}: {col.header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder="R"
                            value={googleSheetsSettings.columnMapping.consumoAgo}
                            onChange={(e) => updateColumnMapping('consumoAgo', e.target.value)}
                          />
                        )}
                      </div>

                      {/* Setembro */}
                      <div className="space-y-2">
                        <Label>Setembro</Label>
                        {availableColumns.length > 0 ? (
                          <Select 
                            value={googleSheetsSettings.columnMapping.consumoSet || "none"} 
                            onValueChange={(value) => updateColumnMapping('consumoSet', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Coluna" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Não mapear</SelectItem>
                              {availableColumns.map((col) => (
                                <SelectItem key={col.letter} value={col.letter}>
                                  {col.letter}: {col.header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder="S"
                            value={googleSheetsSettings.columnMapping.consumoSet}
                            onChange={(e) => updateColumnMapping('consumoSet', e.target.value)}
                          />
                        )}
                      </div>

                      {/* Outubro */}
                      <div className="space-y-2">
                        <Label>Outubro</Label>
                        {availableColumns.length > 0 ? (
                          <Select 
                            value={googleSheetsSettings.columnMapping.consumoOut || "none"} 
                            onValueChange={(value) => updateColumnMapping('consumoOut', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Coluna" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Não mapear</SelectItem>
                              {availableColumns.map((col) => (
                                <SelectItem key={col.letter} value={col.letter}>
                                  {col.letter}: {col.header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder="T"
                            value={googleSheetsSettings.columnMapping.consumoOut}
                            onChange={(e) => updateColumnMapping('consumoOut', e.target.value)}
                          />
                        )}
                      </div>

                      {/* Novembro */}
                      <div className="space-y-2">
                        <Label>Novembro</Label>
                        {availableColumns.length > 0 ? (
                          <Select 
                            value={googleSheetsSettings.columnMapping.consumoNov || "none"} 
                            onValueChange={(value) => updateColumnMapping('consumoNov', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Coluna" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Não mapear</SelectItem>
                              {availableColumns.map((col) => (
                                <SelectItem key={col.letter} value={col.letter}>
                                  {col.letter}: {col.header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder="U"
                            value={googleSheetsSettings.columnMapping.consumoNov}
                            onChange={(e) => updateColumnMapping('consumoNov', e.target.value)}
                          />
                        )}
                      </div>

                      {/* Dezembro */}
                      <div className="space-y-2">
                        <Label>Dezembro</Label>
                        {availableColumns.length > 0 ? (
                          <Select 
                            value={googleSheetsSettings.columnMapping.consumoDez || "none"} 
                            onValueChange={(value) => updateColumnMapping('consumoDez', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Coluna" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Não mapear</SelectItem>
                              {availableColumns.map((col) => (
                                <SelectItem key={col.letter} value={col.letter}>
                                  {col.letter}: {col.header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder="V"
                            value={googleSheetsSettings.columnMapping.consumoDez}
                            onChange={(e) => updateColumnMapping('consumoDez', e.target.value)}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Seção de Campos Adicionais de Endereço */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">Campos Adicionais de Endereço</Label>
                      <Badge variant="secondary" className="text-xs">
                        Opcional - Para endereço detalhado
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* CEP */}
                      <div className="space-y-2">
                        <Label>CEP</Label>
                        {availableColumns.length > 0 ? (
                          <Select 
                            value={googleSheetsSettings.columnMapping.cep || "none"} 
                            onValueChange={(value) => updateColumnMapping('cep', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a coluna" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Não mapear</SelectItem>
                              {availableColumns.map((col) => (
                                <SelectItem key={col.letter} value={col.letter}>
                                  {col.letter}: {col.header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder="W"
                            value={googleSheetsSettings.columnMapping.cep}
                            onChange={(e) => updateColumnMapping('cep', e.target.value)}
                          />
                        )}
                      </div>

                      {/* Cidade */}
                      <div className="space-y-2">
                        <Label>Cidade</Label>
                        {availableColumns.length > 0 ? (
                          <Select 
                            value={googleSheetsSettings.columnMapping.cidade || "none"} 
                            onValueChange={(value) => updateColumnMapping('cidade', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a coluna" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Não mapear</SelectItem>
                              {availableColumns.map((col) => (
                                <SelectItem key={col.letter} value={col.letter}>
                                  {col.letter}: {col.header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder="X"
                            value={googleSheetsSettings.columnMapping.cidade}
                            onChange={(e) => updateColumnMapping('cidade', e.target.value)}
                          />
                        )}
                      </div>

                      {/* Estado */}
                      <div className="space-y-2">
                        <Label>Estado</Label>
                        {availableColumns.length > 0 ? (
                          <Select 
                            value={googleSheetsSettings.columnMapping.estado || "none"} 
                            onValueChange={(value) => updateColumnMapping('estado', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a coluna" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Não mapear</SelectItem>
                              {availableColumns.map((col) => (
                                <SelectItem key={col.letter} value={col.letter}>
                                  {col.letter}: {col.header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder="Y"
                            value={googleSheetsSettings.columnMapping.estado}
                            onChange={(e) => updateColumnMapping('estado', e.target.value)}
                          />
                        )}
                      </div>

                      {/* Bairro */}
                      <div className="space-y-2">
                        <Label>Bairro</Label>
                        {availableColumns.length > 0 ? (
                          <Select 
                            value={googleSheetsSettings.columnMapping.bairro || "none"} 
                            onValueChange={(value) => updateColumnMapping('bairro', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a coluna" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Não mapear</SelectItem>
                              {availableColumns.map((col) => (
                                <SelectItem key={col.letter} value={col.letter}>
                                  {col.letter}: {col.header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder="Z"
                            value={googleSheetsSettings.columnMapping.bairro}
                            onChange={(e) => updateColumnMapping('bairro', e.target.value)}
                          />
                        )}
                      </div>

                      {/* Rua */}
                      <div className="space-y-2">
                        <Label>Rua</Label>
                        {availableColumns.length > 0 ? (
                          <Select 
                            value={googleSheetsSettings.columnMapping.rua || "none"} 
                            onValueChange={(value) => updateColumnMapping('rua', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a coluna" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Não mapear</SelectItem>
                              {availableColumns.map((col) => (
                                <SelectItem key={col.letter} value={col.letter}>
                                  {col.letter}: {col.header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder="AA"
                            value={googleSheetsSettings.columnMapping.rua}
                            onChange={(e) => updateColumnMapping('rua', e.target.value)}
                          />
                        )}
                      </div>

                      {/* Número */}
                      <div className="space-y-2">
                        <Label>Número</Label>
                        {availableColumns.length > 0 ? (
                          <Select 
                            value={googleSheetsSettings.columnMapping.numero || "none"} 
                            onValueChange={(value) => updateColumnMapping('numero', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a coluna" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Não mapear</SelectItem>
                              {availableColumns.map((col) => (
                                <SelectItem key={col.letter} value={col.letter}>
                                  {col.letter}: {col.header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder="AB"
                            value={googleSheetsSettings.columnMapping.numero}
                            onChange={(e) => updateColumnMapping('numero', e.target.value)}
                          />
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Seção de Campos Elétricos Adicionais */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">Campos Elétricos Adicionais</Label>
                      <Badge variant="secondary" className="text-xs">
                        Opcional - Para dados técnicos
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Tensão de Alimentação */}
                      <div className="space-y-2">
                        <Label>Tensão de Alimentação</Label>
                        {availableColumns.length > 0 ? (
                          <Select 
                            value={googleSheetsSettings.columnMapping.tensaoAlimentacao || "none"} 
                            onValueChange={(value) => updateColumnMapping('tensaoAlimentacao', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a coluna" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Não mapear</SelectItem>
                              {availableColumns.map((col) => (
                                <SelectItem key={col.letter} value={col.letter}>
                                  {col.letter}: {col.header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder="AC"
                            value={googleSheetsSettings.columnMapping.tensaoAlimentacao}
                            onChange={(e) => updateColumnMapping('tensaoAlimentacao', e.target.value)}
                          />
                        )}
                      </div>

                      {/* Modalidade Tarifária */}
                      <div className="space-y-2">
                        <Label>Modalidade Tarifária</Label>
                        {availableColumns.length > 0 ? (
                          <Select 
                            value={googleSheetsSettings.columnMapping.modalidadeTarifaria || "none"} 
                            onValueChange={(value) => updateColumnMapping('modalidadeTarifaria', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a coluna" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Não mapear</SelectItem>
                              {availableColumns.map((col) => (
                                <SelectItem key={col.letter} value={col.letter}>
                                  {col.letter}: {col.header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder="AD"
                            value={googleSheetsSettings.columnMapping.modalidadeTarifaria}
                            onChange={(e) => updateColumnMapping('modalidadeTarifaria', e.target.value)}
                          />
                        )}
                      </div>

                      {/* Número do Cliente */}
                      <div className="space-y-2">
                        <Label>Número do Cliente</Label>
                        {availableColumns.length > 0 ? (
                          <Select 
                            value={googleSheetsSettings.columnMapping.numeroCliente || "none"} 
                            onValueChange={(value) => updateColumnMapping('numeroCliente', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a coluna" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Não mapear</SelectItem>
                              {availableColumns.map((col) => (
                                <SelectItem key={col.letter} value={col.letter}>
                                  {col.letter}: {col.header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder="AE"
                            value={googleSheetsSettings.columnMapping.numeroCliente}
                            onChange={(e) => updateColumnMapping('numeroCliente', e.target.value)}
                          />
                        )}
                      </div>

                      {/* Número da Instalação */}
                      <div className="space-y-2">
                        <Label>Número da Instalação</Label>
                        {availableColumns.length > 0 ? (
                          <Select 
                            value={googleSheetsSettings.columnMapping.numeroInstalacao || "none"} 
                            onValueChange={(value) => updateColumnMapping('numeroInstalacao', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a coluna" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Não mapear</SelectItem>
                              {availableColumns.map((col) => (
                                <SelectItem key={col.letter} value={col.letter}>
                                  {col.letter}: {col.header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder="AF"
                            value={googleSheetsSettings.columnMapping.numeroInstalacao}
                            onChange={(e) => updateColumnMapping('numeroInstalacao', e.target.value)}
                          />
                        )}
                      </div>

                      {/* CDD */}
                      <div className="space-y-2">
                        <Label>CDD</Label>
                        {availableColumns.length > 0 ? (
                          <Select 
                            value={googleSheetsSettings.columnMapping.cdd || "none"} 
                            onValueChange={(value) => updateColumnMapping('cdd', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a coluna" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">Não mapear</SelectItem>
                              {availableColumns.map((col) => (
                                <SelectItem key={col.letter} value={col.letter}>
                                  {col.letter}: {col.header}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        ) : (
                          <Input
                            placeholder="AG"
                            value={googleSheetsSettings.columnMapping.cdd}
                            onChange={(e) => updateColumnMapping('cdd', e.target.value)}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Preview dos Dados Mapeados */}
                {showPreview && previewData.length > 0 && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-medium">Preview dos Dados Mapeados</Label>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowPreview(false)}
                      >
                        Ocultar Preview
                      </Button>
                    </div>
                    
                    {/* Tabs para diferentes visualizações do preview */}
                    <Tabs defaultValue="basic" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="basic">Dados Básicos</TabsTrigger>
                        <TabsTrigger value="monthly">Consumo Mensal</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="basic" className="mt-2">
                        <div className="border rounded-lg overflow-hidden">
                          <div className="overflow-x-auto max-h-96">
                            <table className="w-full text-sm">
                              <thead className="bg-muted/50 border-b">
                                <tr>
                                  <th className="text-left p-2 font-medium">Linha</th>
                                  <th className="text-left p-2 font-medium">Nome</th>
                                  <th className="text-left p-2 font-medium">Email</th>
                                  <th className="text-left p-2 font-medium">Telefone</th>
                                  <th className="text-left p-2 font-medium">Consumo Médio</th>
                                  <th className="text-left p-2 font-medium">CEP</th>
                                  <th className="text-left p-2 font-medium">Cidade</th>
                                  <th className="text-left p-2 font-medium">Estado</th>
                                </tr>
                              </thead>
                              <tbody>
                                {previewData.map((row, index) => (
                                  <tr key={index} className="border-b hover:bg-muted/25">
                                    <td className="p-2 text-muted-foreground">{row.rowIndex}</td>
                                    <td className="p-2 font-medium">{row.name || '-'}</td>
                                    <td className="p-2">{row.email || '-'}</td>
                                    <td className="p-2">{row.phone || '-'}</td>
                                    <td className="p-2">{row.consumoMedio || '-'}</td>
                                    <td className="p-2">{row.cep || '-'}</td>
                                    <td className="p-2">{row.cidade || '-'}</td>
                                    <td className="p-2">{row.estado || '-'}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="monthly" className="mt-2">
                        <div className="space-y-4">
                          {/* Resumo do mapeamento de consumo mensal */}
                          <div className="bg-muted/30 p-3 rounded-lg border">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="h-4 w-4 rounded-full bg-green-500"></div>
                              <span className="text-sm font-medium">Status do mapeamento mensal:</span>
                              {previewData.some(row => row.consumoMensal) ? (
                                <Badge variant="default" className="bg-green-500">Dados mensais detectados</Badge>
                              ) : (
                                <Badge variant="secondary">Sem dados mensais</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {previewData.some(row => row.consumoMensal) 
                                ? "Os dados de consumo mensal foram detectados e serão importados. Isso permitirá análises mais detalhadas do perfil de consumo."
                                : "Nenhum dado de consumo mensal foi mapeado. O sistema usará o consumo médio para estimar valores mensais com pequenas variações."}
                            </p>
                          </div>
                          
                          {/* Tabela de dados mensais */}
                          <div className="border rounded-lg overflow-hidden">
                            <div className="overflow-x-auto max-h-96">
                              <table className="w-full text-sm">
                                <thead className="bg-muted/50 border-b">
                                  <tr>
                                    <th className="text-left p-2 font-medium">Linha</th>
                                    <th className="text-left p-2 font-medium">Nome</th>
                                    <th className="text-left p-2 font-medium">Jan</th>
                                    <th className="text-left p-2 font-medium">Fev</th>
                                    <th className="text-left p-2 font-medium">Mar</th>
                                    <th className="text-left p-2 font-medium">Abr</th>
                                    <th className="text-left p-2 font-medium">Mai</th>
                                    <th className="text-left p-2 font-medium">Jun</th>
                                    <th className="text-left p-2 font-medium">Jul</th>
                                    <th className="text-left p-2 font-medium">Ago</th>
                                    <th className="text-left p-2 font-medium">Set</th>
                                    <th className="text-left p-2 font-medium">Out</th>
                                    <th className="text-left p-2 font-medium">Nov</th>
                                    <th className="text-left p-2 font-medium">Dez</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {previewData.map((row, index) => {
                                    // Verificar se há valores negativos para destacar
                                    const hasNegativeValues = [
                                      row.consumoJan, row.consumoFev, row.consumoMar, row.consumoAbr,
                                      row.consumoMai, row.consumoJun, row.consumoJul, row.consumoAgo,
                                      row.consumoSet, row.consumoOut, row.consumoNov, row.consumoDez
                                    ].some(val => parseFloat(val) < 0);
                                    
                                    return (
                                      <tr key={index} className={`border-b hover:bg-muted/25 ${hasNegativeValues ? 'bg-red-50' : ''}`}>
                                        <td className="p-2 text-muted-foreground">{row.rowIndex}</td>
                                        <td className="p-2 font-medium">{row.name || '-'}</td>
                                        <td className={`p-2 ${parseFloat(row.consumoJan) < 0 ? 'text-red-500' : ''}`}>
                                          {row.consumoJan || '-'}
                                        </td>
                                        <td className={`p-2 ${parseFloat(row.consumoFev) < 0 ? 'text-red-500' : ''}`}>
                                          {row.consumoFev || '-'}
                                        </td>
                                        <td className={`p-2 ${parseFloat(row.consumoMar) < 0 ? 'text-red-500' : ''}`}>
                                          {row.consumoMar || '-'}
                                        </td>
                                        <td className={`p-2 ${parseFloat(row.consumoAbr) < 0 ? 'text-red-500' : ''}`}>
                                          {row.consumoAbr || '-'}
                                        </td>
                                        <td className={`p-2 ${parseFloat(row.consumoMai) < 0 ? 'text-red-500' : ''}`}>
                                          {row.consumoMai || '-'}
                                        </td>
                                        <td className={`p-2 ${parseFloat(row.consumoJun) < 0 ? 'text-red-500' : ''}`}>
                                          {row.consumoJun || '-'}
                                        </td>
                                        <td className={`p-2 ${parseFloat(row.consumoJul) < 0 ? 'text-red-500' : ''}`}>
                                          {row.consumoJul || '-'}
                                        </td>
                                        <td className={`p-2 ${parseFloat(row.consumoAgo) < 0 ? 'text-red-500' : ''}`}>
                                          {row.consumoAgo || '-'}
                                        </td>
                                        <td className={`p-2 ${parseFloat(row.consumoSet) < 0 ? 'text-red-500' : ''}`}>
                                          {row.consumoSet || '-'}
                                        </td>
                                        <td className={`p-2 ${parseFloat(row.consumoOut) < 0 ? 'text-red-500' : ''}`}>
                                          {row.consumoOut || '-'}
                                        </td>
                                        <td className={`p-2 ${parseFloat(row.consumoNov) < 0 ? 'text-red-500' : ''}`}>
                                          {row.consumoNov || '-'}
                                        </td>
                                        <td className={`p-2 ${parseFloat(row.consumoDez) < 0 ? 'text-red-500' : ''}`}>
                                          {row.consumoDez || '-'}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </div>
                          
                          {/* Legenda e informações adicionais */}
                          <div className="text-sm text-muted-foreground">
                            <p>
                              <span className="text-red-500 font-medium">Valores negativos</span> serão convertidos para zero durante a importação.
                              Valores ausentes serão preenchidos com base no consumo médio.
                            </p>
                          </div>
                        </div>
                      </TabsContent>
                    </Tabs>
                    
                    <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="font-medium text-blue-800">Preview dos Dados</p>
                          <p className="text-blue-700">
                            Este é um preview dos primeiros 5 registros com base no mapeamento atual. 
                            Verifique se os dados estão sendo importados corretamente antes de sincronizar.
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator />
                  </div>
                )}

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