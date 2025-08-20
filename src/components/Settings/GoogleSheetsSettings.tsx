import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, RefreshCw, AlertCircle, CheckCircle2, TestTube } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { logError, logInfo } from "@/utils/secureLogger";
import { useLeads } from '@/stores/leadStore';
import { googleSheetsSyncService } from '@/services/googleSheetsSync';
import { GoogleApiTester } from '@/utils/googleApiTest';

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
    tipoFornecimento: string;
    consumoMedio: string;
    incrementoConsumo: string;
    tensaoAlimentacao: string;
  };
}

interface SheetColumn {
  letter: string;
  header: string;
}

interface TestResult {
  success: boolean;
  message: string;
  details?: string;
  testName?: string;
}

interface GoogleSheetsSettingsProps {
  onSettingsChange?: (settings: GoogleSheetsSettings) => void;
}

export const GoogleSheetsSettings: React.FC<GoogleSheetsSettingsProps> = ({ onSettingsChange }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { syncCompleted } = useLeads();
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [availableColumns, setAvailableColumns] = useState<SheetColumn[]>([]);
  const [isDetectingHeaders, setIsDetectingHeaders] = useState(false);
  const [previewData, setPreviewData] = useState<Record<string, unknown>[]>([]);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<TestResult[] | null>(null);
  
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
      tipoFornecimento: "F",
      consumoMedio: "G",
      incrementoConsumo: "H",
      tensaoAlimentacao: "I"
    }
  });

  const loadSettings = useCallback(async () => {
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
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const saveSettings = async () => {
    setIsLoading(true);
    
    try {
      logInfo('Iniciando salvamento das configurações do Google Sheets', 'GoogleSheetsSettings');
      
      if (!user) {
        logError('Erro de autenticação', 'GoogleSheetsSettings', { error: 'Usuário não autenticado' });
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

  // Função para mapear automaticamente campos por similaridade
  const autoMapColumns = (detectedColumns: SheetColumn[]) => {
    const fieldMappings: Record<string, string[]> = {
      name: ['nome', 'name', 'cliente', 'razao social', 'razão social'],
      email: ['email', 'e-mail', 'correio', 'mail'],
      phone: ['telefone', 'phone', 'celular', 'fone', 'tel', 'whatsapp'],
      cpfCnpj: ['cpf', 'cnpj', 'cpf/cnpj', 'documento', 'doc'],
      address: ['endereço', 'endereco', 'address', 'rua', 'logradouro'],
      tipoFornecimento: ['tipo fornecimento', 'fornecimento', 'tipo'],
      consumoMedio: ['consumo médio', 'consumo medio', 'consumo', 'kwh'],
      incrementoConsumo: ['incremento', 'aumento', 'crescimento'],
      consumoJan: ['janeiro', 'jan', 'consumo janeiro'],
      consumoFev: ['fevereiro', 'fev', 'consumo fevereiro'],
      consumoMar: ['março', 'mar', 'marco', 'consumo março'],
      consumoAbr: ['abril', 'abr', 'consumo abril'],
      consumoMai: ['maio', 'mai', 'consumo maio'],
      consumoJun: ['junho', 'jun', 'consumo junho'],
      consumoJul: ['julho', 'jul', 'consumo julho'],
      consumoAgo: ['agosto', 'ago', 'consumo agosto'],
      consumoSet: ['setembro', 'set', 'consumo setembro'],
      consumoOut: ['outubro', 'out', 'consumo outubro'],
      consumoNov: ['novembro', 'nov', 'consumo novembro'],
      consumoDez: ['dezembro', 'dez', 'consumo dezembro'],
      cep: ['cep', 'código postal', 'postal'],
      cidade: ['cidade', 'city', 'municipio', 'município'],
      estado: ['estado', 'uf', 'state'],
      bairro: ['bairro', 'distrito', 'neighborhood'],
      rua: ['rua', 'logradouro', 'street'],
      numero: ['número', 'numero', 'number', 'nº'],
      tensaoAlimentacao: ['tensão', 'tensao', 'voltage', 'volt'],
      modalidadeTarifaria: ['modalidade', 'tarifa', 'tarifária'],
      numeroCliente: ['número cliente', 'cliente', 'customer'],
      numeroInstalacao: ['instalação', 'instalacao', 'installation'],
      cdd: ['cdd', 'código', 'codigo']
    };

    const newMapping = { ...settings.columnMapping };
    
    Object.keys(fieldMappings).forEach(field => {
      const synonyms = fieldMappings[field];
      
      // Procurar por correspondência exata ou similar
      const matchedColumn = detectedColumns.find(col => {
        const headerLower = col.header.toLowerCase().trim();
        return synonyms.some(synonym => 
          headerLower.includes(synonym.toLowerCase()) || 
          synonym.toLowerCase().includes(headerLower)
        );
      });
      
      if (matchedColumn) {
        newMapping[field as keyof typeof newMapping] = matchedColumn.letter;
      }
    });
    
    setSettings(prev => ({
      ...prev,
      columnMapping: newMapping
    }));
    
    return newMapping;
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
      // Extrair ID da planilha da URL
      const spreadsheetIdMatch = settings.spreadsheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (!spreadsheetIdMatch) {
        throw new Error('URL da planilha inválida');
      }
      
      const spreadsheetId = spreadsheetIdMatch[1];
      
      // Obter chave da API do Google
      let apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
      
      // Tentar obter a chave da API do usuário no Supabase
      if (user) {
        try {
          const { data: userApiKey } = await supabase
            .from('user_settings')
            .select('value')
            .eq('user_id', user.id)
            .eq('key', 'google_api_key')
            .single();
          
          if (userApiKey?.value) {
            apiKey = userApiKey.value;
          }
        } catch (error) {
          // Continuar com a chave do ambiente se não encontrar no banco
          console.log('Usando chave da API do ambiente');
        }
      }
      
      if (!apiKey) {
        throw new Error('Chave da API do Google não configurada. Configure nas configurações.');
      }
      
      // Buscar apenas a primeira linha (cabeçalhos) da planilha
      const range = `${settings.sheetName}!1:1`;
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro da API do Google Sheets: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json() as { values?: string[][] };
      const headerRow = data.values?.[0] || [];
      
      // Converter para formato de colunas
      const detectedColumns: SheetColumn[] = headerRow.map((header, index) => {
        // Converter índice para letra da coluna (A, B, C, etc.)
        let letter = '';
        let num = index;
        while (num >= 0) {
          letter = String.fromCharCode(65 + (num % 26)) + letter;
          num = Math.floor(num / 26) - 1;
        }
        
        return {
          letter,
          header: header?.toString().trim() || `Coluna ${letter}`
        };
      });
      
      setAvailableColumns(detectedColumns);
      
      // Aplicar mapeamento automático
      const autoMappedFields = autoMapColumns(detectedColumns);
      const mappedCount = Object.values(autoMappedFields).filter(value => value && value !== '').length;
      
      toast({
        title: "Cabeçalhos Detectados",
        description: `${detectedColumns.length} colunas encontradas. ${mappedCount} campos mapeados automaticamente.`,
        variant: "default"
      });
      
    } catch (error) {
      logError('Erro ao detectar cabeçalhos', 'GoogleSheetsSettings', { error: (error as Error).message });
      toast({
        title: "Erro na Detecção",
        description: (error as Error).message,
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
      // Extrair ID da planilha da URL
      const spreadsheetIdMatch = settings.spreadsheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
      if (!spreadsheetIdMatch) {
        throw new Error('URL da planilha inválida');
      }
      
      const spreadsheetId = spreadsheetIdMatch[1];
      
      // Obter chave da API do Google
      let apiKey = import.meta.env.VITE_GOOGLE_API_KEY;
      
      // Tentar obter a chave da API do usuário no Supabase
      if (user) {
        try {
          const { data: userApiKey } = await supabase
            .from('user_settings')
            .select('value')
            .eq('user_id', user.id)
            .eq('key', 'google_api_key')
            .single();
          
          if (userApiKey?.value) {
            apiKey = userApiKey.value;
          }
        } catch (error) {
          // Continuar com a chave do ambiente se não encontrar no banco
          console.log('Usando chave da API do ambiente');
        }
      }
      
      if (!apiKey) {
        throw new Error('Chave da API do Google não configurada. Configure nas configurações.');
      }
      
      // Buscar as primeiras 5 linhas da planilha (cabeçalho + 4 linhas de dados)
      const range = `${settings.sheetName}!1:5`;
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?key=${apiKey}`;
      
      const response = await fetch(url);
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro da API do Google Sheets: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json() as { values?: string[][] };
      const rows = data.values || [];
      
      if (rows.length === 0) {
        throw new Error('Nenhum dado encontrado na planilha');
      }
      
      // Primeira linha são os cabeçalhos
      const headers = rows[0] || [];
      const dataRows = rows.slice(1);
      
      // Converter para formato de objeto
      const previewData = dataRows.map(row => {
        const rowData: Record<string, string> = {};
        headers.forEach((header, index) => {
          rowData[header || `Coluna ${index + 1}`] = row[index] || '';
        });
        return rowData;
      });
      
      setPreviewData(previewData);
      setShowPreview(true);
      
      toast({
        title: "Preview Carregado",
        description: `${previewData.length} linhas de dados carregadas.`,
        variant: "default"
      });
      
    } catch (error) {
      logError('Erro ao carregar preview', 'GoogleSheetsSettings', { error: (error as Error).message });
      toast({
        title: "Erro no Preview",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const syncNow = async () => {
    setIsSyncing(true);
    
    try {
      // Validar configurações antes da sincronização
      if (!settings.spreadsheetUrl || !settings.sheetName) {
        toast({
          title: "Configuração Incompleta",
          description: "Configure a URL da planilha e o nome da aba antes de sincronizar.",
          variant: "destructive"
        });
        return;
      }

      let result;
      
      try {
        // Usar o serviço real de sincronização do Google Sheets
        console.log('🚀 Iniciando sincronização REAL com Google Sheets...');
        result = await googleSheetsSyncService.syncGoogleSheets(settings);
        
        logInfo('Sincronização do Google Sheets concluída', 'GoogleSheetsSettings', { 
          totalRecords: result.totalRecords,
          successfulImports: result.successfulImports,
          failedImports: result.failedImports,
          spreadsheetUrl: settings.spreadsheetUrl,
          sheetName: settings.sheetName
        });
        
      } catch (syncError) {
        const errorMsg = (syncError as Error).message || 'Erro desconhecido';
        logError('Erro na sincronização do Google Sheets', 'GoogleSheetsSettings', { 
          error: errorMsg,
          spreadsheetUrl: settings.spreadsheetUrl,
          sheetName: settings.sheetName
        });
        
        throw new Error(`Falha na sincronização: ${errorMsg}`);
      }

      if (result.success) {
        // Notificar o store sobre a sincronização concluída
        syncCompleted();
        
        toast({
          title: "Sincronização Concluída",
          description: `${result.successfulImports} leads importados com sucesso${result.failedImports > 0 ? `, ${result.failedImports} falharam` : ''}.`,
          variant: "default"
        });
      } else {
        throw new Error('Falha na sincronização');
      }
      
    } catch (error) {
      const errorMessage = (error as Error).message || 'Erro desconhecido na sincronização';
      logError('Erro na sincronização', 'GoogleSheetsSettings', { 
        error: errorMessage,
        timestamp: new Date().toISOString()
      });
      
      // Mensagem mais amigável para o usuário
      let userMessage = errorMessage;
      if (errorMessage.includes('fetch')) {
        userMessage = 'Problema de conectividade. Verifique sua conexão com a internet.';
      } else if (errorMessage.includes('permission')) {
        userMessage = 'Problema de permissão. Verifique se a planilha está compartilhada publicamente.';
      } else if (errorMessage.includes('not found')) {
        userMessage = 'Planilha não encontrada. Verifique se a URL está correta.';
      }
      
      toast({
        title: "Erro na Sincronização",
        description: userMessage,
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const testGoogleApi = async () => {
    setIsTesting(true);
    setTestResults(null);
    
    try {
      const tester = new GoogleApiTester();
      const results = await tester.runAllTests();
      setTestResults(results);
      
      const hasErrors = results.some((result: TestResult) => !result.success);
      
      toast({
        title: hasErrors ? "Problemas Detectados" : "Testes Concluídos",
        description: hasErrors 
          ? "Alguns testes falharam. Verifique os resultados abaixo."
          : "Todos os testes passaram com sucesso!",
        variant: hasErrors ? "destructive" : "default"
      });
      
    } catch (error) {
      logError('Erro ao executar testes da API', 'GoogleSheetsSettings', { error: (error as Error).message });
      toast({
        title: "Erro nos Testes",
        description: (error as Error).message,
        variant: "destructive"
      });
    } finally {
      setIsTesting(false);
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
            
            <Button
              onClick={testGoogleApi}
              disabled={isTesting}
              variant="outline"
            >
              {isTesting ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <TestTube className="h-4 w-4 mr-2" />
              )}
              Testar API
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
            <div className="space-y-6">
              {/* Campos Essenciais */}
              <div>
                <h4 className="font-medium mb-3 text-sm text-muted-foreground">Dados Pessoais</h4>
                <div className="grid grid-cols-2 gap-4">
                  {['name', 'email', 'phone', 'cpfCnpj'].map((field) => {
                    const labels: Record<string, string> = {
                      name: 'Nome',
                      email: 'Email', 
                      phone: 'Telefone',
                      cpfCnpj: 'CPF/CNPJ'
                    };
                    return (
                      <div key={field} className="space-y-2">
                        <Label>{labels[field]}</Label>
                        <Select
                          value={settings.columnMapping[field as keyof typeof settings.columnMapping]}
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
                            <SelectItem value="none">Não mapear</SelectItem>
                            {availableColumns.map((col) => (
                              <SelectItem key={col.letter} value={col.letter}>
                                {col.letter} - {col.header}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Endereço */}
              <div>
                <h4 className="font-medium mb-3 text-sm text-muted-foreground">Endereço</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label>Endereço Completo</Label>
                    <Select
                      value={settings.columnMapping.address}
                      onValueChange={(value) => 
                        setSettings(prev => ({
                          ...prev,
                          columnMapping: { ...prev.columnMapping, address: value }
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma coluna" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Não mapear</SelectItem>
                        {availableColumns.map((col) => (
                          <SelectItem key={col.letter} value={col.letter}>
                            {col.letter} - {col.header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Dados Energéticos */}
              <div>
                <h4 className="font-medium mb-3 text-sm text-muted-foreground">Dados Energéticos</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Fornecimento</Label>
                    <Select
                      value={settings.columnMapping.tipoFornecimento}
                      onValueChange={(value) => 
                        setSettings(prev => ({
                          ...prev,
                          columnMapping: { ...prev.columnMapping, tipoFornecimento: value }
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma coluna" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Não mapear</SelectItem>
                        {availableColumns.map((col) => (
                          <SelectItem key={col.letter} value={col.letter}>
                            {col.letter} - {col.header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Tensão de Alimentação</Label>
                    <Select
                      value={settings.columnMapping.tensaoAlimentacao}
                      onValueChange={(value) => 
                        setSettings(prev => ({
                          ...prev,
                          columnMapping: { ...prev.columnMapping, tensaoAlimentacao: value }
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma coluna" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Não mapear</SelectItem>
                        {availableColumns.map((col) => (
                          <SelectItem key={col.letter} value={col.letter}>
                            {col.letter} - {col.header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Consumo */}
              <div>
                <h4 className="font-medium mb-3 text-sm text-muted-foreground">Consumo Energético</h4>
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <p className="text-sm text-blue-700 mb-2">
                    <strong>Consumo Médio:</strong> Informe o consumo médio mensal em kWh.
                  </p>
                  <p className="text-sm text-blue-600">
                    • O incremento de consumo pode ser configurado individualmente para cada lead
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Consumo Médio (kWh/mês)</Label>
                    <Select
                      value={settings.columnMapping.consumoMedio}
                      onValueChange={(value) => 
                        setSettings(prev => ({
                          ...prev,
                          columnMapping: { ...prev.columnMapping, consumoMedio: value }
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma coluna" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Não mapear</SelectItem>
                        {availableColumns.map((col) => (
                          <SelectItem key={col.letter} value={col.letter}>
                            {col.letter} - {col.header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Incremento de Consumo (%)</Label>
                    <Select
                      value={settings.columnMapping.incrementoConsumo}
                      onValueChange={(value) => 
                        setSettings(prev => ({
                          ...prev,
                          columnMapping: { ...prev.columnMapping, incrementoConsumo: value }
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma coluna" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">Não mapear</SelectItem>
                        {availableColumns.map((col) => (
                          <SelectItem key={col.letter} value={col.letter}>
                            {col.letter} - {col.header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Campos Calculados Automaticamente */}
              <div>
                <h4 className="font-medium mb-3 text-sm text-muted-foreground">Informações Importantes</h4>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-700 mb-2">
                    <strong>Campos Essenciais:</strong> Nome, Email, Telefone e CPF/CNPJ são obrigatórios para importação.
                  </p>
                  <p className="text-sm text-green-700 mb-2">
                    <strong>Validação de Email:</strong> Emails inválidos serão rejeitados durante a importação.
                  </p>
                  <p className="text-sm text-green-700 mb-2">
                    <strong>Tipo de Fornecimento:</strong> Aceita valores como "Monofásico", "Bifásico" ou "Trifásico".
                  </p>
                </div>
              </div>
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
      
      {testResults && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados dos Testes da API</CardTitle>
            <CardDescription>
              Diagnóstico da conectividade e configuração da API do Google.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {testResults.map((result: TestResult, index: number) => (
                <div key={index} className={`p-4 rounded-lg border ${
                  result.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}>
                  <div className="flex items-center gap-2 mb-2">
                    {result.success ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <AlertCircle className="h-5 w-5 text-red-600" />
                    )}
                    <h4 className={`font-medium ${
                      result.success ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {result.test}
                    </h4>
                  </div>
                  <p className={`text-sm ${
                    result.success ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {result.message}
                  </p>
                  {result.details && (
                    <div className="mt-2">
                      <pre className={`text-xs p-2 rounded ${
                        result.success ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {JSON.stringify(result.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default GoogleSheetsSettings;