/**
 * Utilitário para testar a API do Google Sheets no contexto do navegador
 */

export interface ApiTestDetails {
  rowsReceived?: number;
  firstRow?: string[] | null;
  sampleData?: string[][];
  error?: Error | string;
  [key: string]: unknown;
}

export interface ApiTestResult {
  success: boolean;
  message: string;
  details?: ApiTestDetails;
  suggestions?: string[];
}

export class GoogleApiTester {
  private static readonly TEST_SPREADSHEET_ID = '1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgvE2upms';
  private static readonly TEST_SHEET_NAME = 'Class Data';

  /**
   * Testa a conectividade com a API do Google Sheets
   */
  static async testGoogleSheetsAPI(): Promise<ApiTestResult> {
    console.log('🔍 Testando conectividade com Google Sheets API...');
    
    // Verificar se a API key está configurada
    const googleApiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    
    if (!googleApiKey) {
      return {
        success: false,
        message: 'Google API Key não configurada',
        suggestions: [
          'Verifique se a variável VITE_GOOGLE_API_KEY está definida no arquivo .env',
          'Reinicie o servidor de desenvolvimento após adicionar a variável',
          'Certifique-se de que o arquivo .env está na raiz do projeto'
        ]
      };
    }

    console.log('📋 API Key encontrada:', `${googleApiKey.substring(0, 10)}...`);

    const url = `https://sheets.googleapis.com/v4/spreadsheets/${this.TEST_SPREADSHEET_ID}/values/${this.TEST_SHEET_NAME}!A1:Z5?key=${googleApiKey}`;
    
    try {
      console.log('🌐 Fazendo requisição de teste...');
      
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        // Timeout de 10 segundos para teste
        signal: AbortSignal.timeout(10000)
      });

      console.log('📡 Status da resposta:', response.status, response.statusText);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Erro na resposta:', errorText);
        
        let message = `Erro HTTP ${response.status}: ${response.statusText}`;
        let suggestions: string[] = [];
        
        if (response.status === 403) {
          message = 'Acesso negado à API do Google Sheets';
          suggestions = [
            'Verifique se a API key está correta',
            'Confirme se a API do Google Sheets está habilitada no Google Cloud Console',
            'Verifique se há restrições de IP/domínio configuradas',
            'Confirme se a cota da API não foi excedida'
          ];
        } else if (response.status === 404) {
          message = 'Planilha de teste não encontrada';
          suggestions = [
            'Problema com a planilha de teste do Google',
            'Tente com uma planilha própria que seja pública'
          ];
        } else if (response.status === 400) {
          message = 'Requisição inválida';
          suggestions = [
            'Verifique o formato da URL da planilha',
            'Confirme se o nome da aba está correto'
          ];
        }
        
        return {
          success: false,
          message,
          details: errorText,
          suggestions
        };
      }

      const data = await response.json();
      console.log('✅ Sucesso! Dados recebidos:', data);
      
      return {
        success: true,
        message: 'API do Google Sheets funcionando corretamente',
        details: {
          rowsReceived: data.values?.length || 0,
          firstRow: data.values?.[0] || null,
          sampleData: data.values?.slice(0, 3) || []
        }
      };
      
    } catch (error) {
      console.error('❌ Erro na requisição:', error);
      
      let message = 'Erro desconhecido na requisição';
      let suggestions: string[] = [];
      
      if (error instanceof Error) {
        message = error.message;
        
        if (error.name === 'AbortError') {
          message = 'Timeout na requisição para Google Sheets';
          suggestions = [
            'Verifique sua conexão com a internet',
            'Tente novamente em alguns segundos',
            'Verifique se há firewall bloqueando a requisição'
          ];
        } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
          message = 'Problema de conectividade';
          suggestions = [
            'Verifique sua conexão com a internet',
            'Confirme se não há proxy/VPN interferindo',
            'Verifique se o firewall não está bloqueando requisições HTTPS'
          ];
        }
      }
      
      return {
        success: false,
        message,
        details: error,
        suggestions
      };
    }
  }

  /**
   * Testa uma planilha específica do usuário
   */
  static async testUserSpreadsheet(spreadsheetUrl: string, sheetName: string = 'Sheet1'): Promise<ApiTestResult> {
    console.log('🔍 Testando planilha do usuário...');
    
    const googleApiKey = import.meta.env.VITE_GOOGLE_API_KEY;
    
    if (!googleApiKey) {
      return {
        success: false,
        message: 'Google API Key não configurada',
        suggestions: ['Configure a VITE_GOOGLE_API_KEY no arquivo .env']
      };
    }

    // Extrair ID da planilha
    const spreadsheetIdMatch = spreadsheetUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    if (!spreadsheetIdMatch) {
      return {
        success: false,
        message: 'URL da planilha inválida',
        suggestions: [
          'Use uma URL no formato: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit',
          'Certifique-se de que a URL está completa'
        ]
      };
    }

    const spreadsheetId = spreadsheetIdMatch[1];
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${sheetName}!A1:Z5?key=${googleApiKey}`;
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
        signal: AbortSignal.timeout(10000)
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        let message = `Erro ao acessar sua planilha: ${response.status}`;
        let suggestions: string[] = [];
        
        if (response.status === 403) {
          message = 'Acesso negado à sua planilha';
          suggestions = [
            'Certifique-se de que a planilha é pública (qualquer pessoa com o link pode visualizar)',
            'Ou configure o compartilhamento para permitir acesso via API',
            'Verifique se a API key tem permissões adequadas'
          ];
        } else if (response.status === 404) {
          message = 'Planilha não encontrada';
          suggestions = [
            'Verifique se a URL da planilha está correta',
            'Confirme se a planilha não foi deletada',
            'Verifique se o nome da aba está correto'
          ];
        }
        
        return {
          success: false,
          message,
          details: errorText,
          suggestions
        };
      }

      const data = await response.json();
      
      return {
        success: true,
        message: 'Planilha acessada com sucesso',
        details: {
          spreadsheetId,
          sheetName,
          rowsFound: data.values?.length || 0,
          firstRow: data.values?.[0] || null,
          isEmpty: !data.values || data.values.length === 0
        }
      };
      
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Erro desconhecido',
        details: error,
        suggestions: ['Verifique sua conexão e tente novamente']
      };
    }
  }

  /**
   * Verifica o status das variáveis de ambiente
   */
  static checkEnvironmentVariables(): { [key: string]: boolean } {
    return {
      'VITE_GOOGLE_API_KEY': !!import.meta.env.VITE_GOOGLE_API_KEY,
      'VITE_SUPABASE_URL': !!import.meta.env.VITE_SUPABASE_URL,
      'VITE_SUPABASE_ANON_KEY': !!import.meta.env.VITE_SUPABASE_ANON_KEY,
    };
  }

  /**
   * Executa todos os testes disponíveis
   */
  async runAllTests(): Promise<Array<{ test: string; success: boolean; message: string; details?: ApiTestDetails }>> {
    const results = [];

    // Teste 1: Verificar variáveis de ambiente
    const envVars = GoogleApiTester.checkEnvironmentVariables();
    const missingVars = Object.entries(envVars).filter(([_, exists]) => !exists).map(([key]) => key);
    
    results.push({
      test: 'Variáveis de Ambiente',
      success: missingVars.length === 0,
      message: missingVars.length === 0 
        ? 'Todas as variáveis de ambiente estão configuradas'
        : `Variáveis faltando: ${missingVars.join(', ')}`,
      details: envVars
    });

    // Teste 2: Conectividade com API do Google
    const apiTest = await GoogleApiTester.testGoogleSheetsAPI();
    results.push({
      test: 'Conectividade API Google Sheets',
      success: apiTest.success,
      message: apiTest.message,
      details: apiTest.details
    });

    return results;
  }
}