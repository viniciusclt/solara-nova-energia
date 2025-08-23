import { 
  logInfo, 
  logWarn, 
  logError, 
  logAPI,
  type LogEntry 
} from '@/utils/secureLogger';
import { REGULATORY_CONSTANTS } from '@/constants/regulatory';

// ===== INTERFACES GERAIS =====

export interface ConcessionariaConfig {
  id: string;
  name: string;
  region: string;
  api_base_url: string;
  auth_type: 'api_key' | 'oauth2' | 'basic' | 'custom';
  auth_config: Record<string, any>;
  rate_limit: {
    requests_per_minute: number;
    requests_per_hour: number;
  };
  timeout_ms: number;
  retry_config: {
    max_retries: number;
    retry_delay_ms: number;
    exponential_backoff: boolean;
  };
  endpoints: Record<string, string>;
  custom_headers?: Record<string, string>;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    request_id: string;
    timestamp: Date;
    response_time_ms: number;
    rate_limit_remaining?: number;
  };
}

export interface SolicitacaoAcesso {
  id?: string;
  tipo: 'microgeracao' | 'minigeracao';
  potencia_kw: number;
  endereco: {
    cep: string;
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    uf: string;
  };
  cliente: {
    nome: string;
    cpf_cnpj: string;
    email: string;
    telefone: string;
    tipo_pessoa: 'fisica' | 'juridica';
  };
  documentos: Array<{
    tipo: string;
    arquivo_base64?: string;
    url?: string;
    nome_arquivo: string;
  }>;
  equipamentos: Array<{
    tipo: 'inversor' | 'modulo' | 'medidor';
    fabricante: string;
    modelo: string;
    quantidade: number;
    potencia_unitaria?: number;
    certificacao?: string;
  }>;
  projeto_eletrico: {
    diagrama_unifilar?: string;
    memorial_descritivo?: string;
    art_rrt: string;
    responsavel_tecnico: {
      nome: string;
      registro_profissional: string;
      conselho: 'CREA' | 'CAU';
    };
  };
}

export interface StatusSolicitacao {
  id: string;
  status: 'pendente' | 'em_analise' | 'aprovada' | 'rejeitada' | 'aguardando_documentos' | 'instalacao_autorizada';
  data_solicitacao: Date;
  data_ultima_atualizacao: Date;
  prazo_resposta?: Date;
  observacoes?: string;
  documentos_pendentes?: string[];
  proximos_passos?: string[];
  numero_protocolo?: string;
  parecer_tecnico?: {
    aprovado: boolean;
    observacoes: string;
    data_parecer: Date;
    responsavel: string;
  };
}

export interface TarifaEnergia {
  modalidade: 'convencional' | 'branca' | 'verde' | 'azul';
  grupo: 'A' | 'B';
  subgrupo: string;
  valores: {
    tusd_ponta?: number;
    tusd_fora_ponta: number;
    te_ponta?: number;
    te_fora_ponta: number;
    demanda_ponta?: number;
    demanda_fora_ponta?: number;
  };
  impostos: {
    icms_percentual: number;
    pis_cofins_percentual: number;
  };
  bandeiras: {
    verde: number;
    amarela: number;
    vermelha_1: number;
    vermelha_2: number;
  };
  vigencia: {
    inicio: Date;
    fim: Date;
  };
}

export interface HistoricoConsumo {
  periodo: {
    mes: number;
    ano: number;
  };
  consumo_kwh: number;
  demanda_kw?: number;
  valor_fatura: number;
  dias_faturamento: number;
  leitura_anterior: number;
  leitura_atual: number;
  bandeira_tarifaria?: 'verde' | 'amarela' | 'vermelha_1' | 'vermelha_2';
}

// ===== INTERFACES ESPECÍFICAS LIGHT-RJ =====

export interface LightRJSolicitacao extends SolicitacaoAcesso {
  numero_instalacao?: string;
  classe_consumo: 'residencial' | 'comercial' | 'industrial' | 'rural';
  grupo_tarifario: 'A' | 'B';
  tensao_fornecimento: '220V' | '380V' | '13.8kV' | '34.5kV';
  modalidade_tarifaria: 'convencional' | 'branca';
}

export interface LightRJResponse {
  codigo_retorno: string;
  mensagem: string;
  dados?: any;
  protocolo?: string;
  data_protocolo?: string;
}

// ===== CLASSE BASE PARA CONCESSIONÁRIAS =====

abstract class BaseConcessionariaAPI {
  protected config: ConcessionariaConfig;
  protected requestCount: { minute: number; hour: number } = { minute: 0, hour: 0 };
  protected lastRequestTime: Date = new Date();

  constructor(config: ConcessionariaConfig) {
    this.config = config;
    this.resetRateLimitCounters();
  }

  protected async makeRequest<T>(
    endpoint: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
    data?: any,
    customHeaders?: Record<string, string>
  ): Promise<APIResponse<T>> {
    const startTime = Date.now();
    const requestId = `req_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    try {
      // Verificar rate limit
      await this.checkRateLimit();

      // Preparar headers
      const headers = {
        'Content-Type': 'application/json',
        'User-Agent': 'Solara-Nova-Energia/1.0',
        ...this.config.custom_headers,
        ...customHeaders,
        ...await this.getAuthHeaders()
      };

      // Preparar URL
      const url = `${this.config.api_base_url}${endpoint}`;

      logAPI(
        `Iniciando requisição para ${this.config.name}`,
        'ConcessionariaAPI',
        {
          request_id: requestId,
          method,
          url,
          concessionaria: this.config.name
        }
      );

      // Fazer requisição com retry
      const response = await this.makeRequestWithRetry(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : undefined,
        signal: AbortSignal.timeout(this.config.timeout_ms)
      });

      const responseTime = Date.now() - startTime;
      const responseData = await response.json();

      // Atualizar contadores de rate limit
      this.updateRateLimitCounters();

      const apiResponse: APIResponse<T> = {
        success: response.ok,
        data: response.ok ? responseData : undefined,
        error: !response.ok ? {
          code: response.status.toString(),
          message: responseData.message || response.statusText,
          details: responseData
        } : undefined,
        metadata: {
          request_id: requestId,
          timestamp: new Date(),
          response_time_ms: responseTime,
          rate_limit_remaining: this.getRateLimitRemaining()
        }
      };

      if (response.ok) {
        logAPI(
          `Requisição bem-sucedida para ${this.config.name}`,
          'ConcessionariaAPI',
          {
            request_id: requestId,
            response_time_ms: responseTime,
            status: response.status
          }
        );
      } else {
        logWarn(
          `Requisição falhou para ${this.config.name}`,
          'ConcessionariaAPI',
          {
            request_id: requestId,
            status: response.status,
            error: apiResponse.error
          }
        );
      }

      return apiResponse;

    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      logError(
        `Erro na requisição para ${this.config.name}`,
        'ConcessionariaAPI',
        {
          request_id: requestId,
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          response_time_ms: responseTime
        }
      );

      return {
        success: false,
        error: {
          code: 'REQUEST_ERROR',
          message: error instanceof Error ? error.message : 'Erro desconhecido na requisição',
          details: error
        },
        metadata: {
          request_id: requestId,
          timestamp: new Date(),
          response_time_ms: responseTime
        }
      };
    }
  }

  private async makeRequestWithRetry(url: string, options: RequestInit): Promise<Response> {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= this.config.retry_config.max_retries; attempt++) {
      try {
        const response = await fetch(url, options);
        
        // Se a resposta for bem-sucedida ou um erro não-retriable, retornar
        if (response.ok || !this.isRetriableError(response.status)) {
          return response;
        }
        
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Erro desconhecido');
        
        // Se não é o último attempt, aguardar antes de tentar novamente
        if (attempt < this.config.retry_config.max_retries) {
          const delay = this.config.retry_config.exponential_backoff
            ? this.config.retry_config.retry_delay_ms * Math.pow(2, attempt)
            : this.config.retry_config.retry_delay_ms;
            
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    throw lastError;
  }

  private isRetriableError(status: number): boolean {
    // Erros que podem ser tentados novamente
    return status >= 500 || status === 429 || status === 408;
  }

  protected abstract getAuthHeaders(): Promise<Record<string, string>>;

  private async checkRateLimit(): Promise<void> {
    const now = new Date();
    const timeSinceLastRequest = now.getTime() - this.lastRequestTime.getTime();
    
    // Reset contadores se necessário
    if (timeSinceLastRequest > 60000) { // 1 minuto
      this.requestCount.minute = 0;
    }
    if (timeSinceLastRequest > 3600000) { // 1 hora
      this.requestCount.hour = 0;
    }
    
    // Verificar limites
    if (this.requestCount.minute >= this.config.rate_limit.requests_per_minute) {
      const waitTime = 60000 - (timeSinceLastRequest % 60000);
      logWarn(
        `Rate limit atingido para ${this.config.name} - aguardando ${waitTime}ms`,
        'ConcessionariaAPI'
      );
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
    
    if (this.requestCount.hour >= this.config.rate_limit.requests_per_hour) {
      const waitTime = 3600000 - (timeSinceLastRequest % 3600000);
      logWarn(
        `Rate limit horário atingido para ${this.config.name} - aguardando ${waitTime}ms`,
        'ConcessionariaAPI'
      );
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }
  }

  private updateRateLimitCounters(): void {
    this.requestCount.minute++;
    this.requestCount.hour++;
    this.lastRequestTime = new Date();
  }

  private getRateLimitRemaining(): number {
    return Math.min(
      this.config.rate_limit.requests_per_minute - this.requestCount.minute,
      this.config.rate_limit.requests_per_hour - this.requestCount.hour
    );
  }

  private resetRateLimitCounters(): void {
    setInterval(() => {
      this.requestCount.minute = 0;
    }, 60000); // Reset a cada minuto
    
    setInterval(() => {
      this.requestCount.hour = 0;
    }, 3600000); // Reset a cada hora
  }

  // Métodos abstratos que devem ser implementados pelas concessionárias específicas
  public abstract criarSolicitacaoAcesso(solicitacao: SolicitacaoAcesso): Promise<APIResponse<{ protocolo: string; id: string }>>;
  public abstract consultarStatusSolicitacao(id: string): Promise<APIResponse<StatusSolicitacao>>;
  public abstract obterTarifas(): Promise<APIResponse<TarifaEnergia>>;
  public abstract obterHistoricoConsumo(numeroInstalacao: string, meses: number): Promise<APIResponse<HistoricoConsumo[]>>;
  public abstract validarDocumentacao(documentos: Array<{ tipo: string; arquivo: string }>): Promise<APIResponse<{ valido: boolean; observacoes: string[] }>>;
}

// ===== IMPLEMENTAÇÃO LIGHT-RJ =====

export class LightRJAPI extends BaseConcessionariaAPI {
  constructor() {
    const config: ConcessionariaConfig = {
      id: 'light_rj',
      name: 'Light - Rio de Janeiro',
      region: 'RJ',
      api_base_url: 'https://api.light.com.br/v1', // URL fictícia - substituir pela real
      auth_type: 'api_key',
      auth_config: {
        api_key: process.env.LIGHT_API_KEY || '',
        key_header: 'X-API-Key'
      },
      rate_limit: {
        requests_per_minute: 30,
        requests_per_hour: 1000
      },
      timeout_ms: 30000,
      retry_config: {
        max_retries: 3,
        retry_delay_ms: 1000,
        exponential_backoff: true
      },
      endpoints: {
        solicitacao_acesso: '/microgeracao/solicitacao',
        status_solicitacao: '/microgeracao/status',
        tarifas: '/tarifas/vigentes',
        historico_consumo: '/consumo/historico',
        validacao_documentos: '/documentos/validar'
      },
      custom_headers: {
        'X-Client-Version': '1.0.0',
        'X-Client-Name': 'Solara-Nova-Energia'
      }
    };
    
    super(config);
    
    logInfo('Light-RJ API inicializada', 'LightRJAPI', {
      base_url: config.api_base_url,
      rate_limit: config.rate_limit
    });
  }

  protected async getAuthHeaders(): Promise<Record<string, string>> {
    if (this.config.auth_type === 'api_key') {
      return {
        [this.config.auth_config.key_header]: this.config.auth_config.api_key
      };
    }
    return {};
  }

  public async criarSolicitacaoAcesso(solicitacao: SolicitacaoAcesso): Promise<APIResponse<{ protocolo: string; id: string }>> {
    // Converter para formato específico da Light-RJ
    const lightSolicitacao: LightRJSolicitacao = {
      ...solicitacao,
      classe_consumo: this.determinarClasseConsumo(solicitacao),
      grupo_tarifario: solicitacao.potencia_kw > 75 ? 'A' : 'B',
      tensao_fornecimento: this.determinarTensaoFornecimento(solicitacao.potencia_kw),
      modalidade_tarifaria: 'convencional'
    };

    logInfo(
      'Criando solicitação de acesso na Light-RJ',
      'LightRJAPI',
      {
        potencia_kw: solicitacao.potencia_kw,
        tipo: solicitacao.tipo,
        cliente: solicitacao.cliente.nome
      }
    );

    const response = await this.makeRequest<LightRJResponse>(
      this.config.endpoints.solicitacao_acesso,
      'POST',
      lightSolicitacao
    );

    if (response.success && response.data) {
      return {
        success: true,
        data: {
          protocolo: response.data.protocolo || '',
          id: response.data.dados?.id || ''
        },
        metadata: response.metadata
      };
    }

    return {
      success: false,
      error: response.error,
      metadata: response.metadata
    };
  }

  public async consultarStatusSolicitacao(id: string): Promise<APIResponse<StatusSolicitacao>> {
    logInfo(
      'Consultando status de solicitação na Light-RJ',
      'LightRJAPI',
      { solicitacao_id: id }
    );

    const response = await this.makeRequest<LightRJResponse>(
      `${this.config.endpoints.status_solicitacao}/${id}`,
      'GET'
    );

    if (response.success && response.data?.dados) {
      const dados = response.data.dados;
      
      return {
        success: true,
        data: {
          id: dados.id,
          status: this.mapearStatusLight(dados.status),
          data_solicitacao: new Date(dados.data_solicitacao),
          data_ultima_atualizacao: new Date(dados.data_atualizacao),
          prazo_resposta: dados.prazo_resposta ? new Date(dados.prazo_resposta) : undefined,
          observacoes: dados.observacoes,
          documentos_pendentes: dados.documentos_pendentes,
          proximos_passos: dados.proximos_passos,
          numero_protocolo: dados.protocolo
        },
        metadata: response.metadata
      };
    }

    return {
      success: false,
      error: response.error,
      metadata: response.metadata
    };
  }

  public async obterTarifas(): Promise<APIResponse<TarifaEnergia>> {
    logInfo('Obtendo tarifas vigentes da Light-RJ', 'LightRJAPI');

    const response = await this.makeRequest<any>(
      this.config.endpoints.tarifas,
      'GET'
    );

    if (response.success && response.data) {
      const tarifas = response.data;
      
      return {
        success: true,
        data: {
          modalidade: tarifas.modalidade || 'convencional',
          grupo: tarifas.grupo || 'B',
          subgrupo: tarifas.subgrupo || 'B1',
          valores: {
            tusd_fora_ponta: tarifas.tusd_fora_ponta || 0,
            te_fora_ponta: tarifas.te_fora_ponta || 0,
            tusd_ponta: tarifas.tusd_ponta,
            te_ponta: tarifas.te_ponta
          },
          impostos: {
            icms_percentual: tarifas.icms || 18,
            pis_cofins_percentual: tarifas.pis_cofins || 3.65
          },
          bandeiras: {
            verde: tarifas.bandeiras?.verde || 0,
            amarela: tarifas.bandeiras?.amarela || 0.01874,
            vermelha_1: tarifas.bandeiras?.vermelha_1 || 0.03971,
            vermelha_2: tarifas.bandeiras?.vermelha_2 || 0.09492
          },
          vigencia: {
            inicio: new Date(tarifas.vigencia_inicio),
            fim: new Date(tarifas.vigencia_fim)
          }
        },
        metadata: response.metadata
      };
    }

    return {
      success: false,
      error: response.error,
      metadata: response.metadata
    };
  }

  public async obterHistoricoConsumo(numeroInstalacao: string, meses: number = 12): Promise<APIResponse<HistoricoConsumo[]>> {
    logInfo(
      'Obtendo histórico de consumo da Light-RJ',
      'LightRJAPI',
      { numero_instalacao: numeroInstalacao, meses }
    );

    const response = await this.makeRequest<any>(
      `${this.config.endpoints.historico_consumo}/${numeroInstalacao}?meses=${meses}`,
      'GET'
    );

    if (response.success && response.data?.historico) {
      const historico = response.data.historico.map((item: any) => ({
        periodo: {
          mes: item.mes,
          ano: item.ano
        },
        consumo_kwh: item.consumo,
        demanda_kw: item.demanda,
        valor_fatura: item.valor,
        dias_faturamento: item.dias || 30,
        leitura_anterior: item.leitura_anterior,
        leitura_atual: item.leitura_atual,
        bandeira_tarifaria: item.bandeira
      }));
      
      return {
        success: true,
        data: historico,
        metadata: response.metadata
      };
    }

    return {
      success: false,
      error: response.error,
      metadata: response.metadata
    };
  }

  public async validarDocumentacao(documentos: Array<{ tipo: string; arquivo: string }>): Promise<APIResponse<{ valido: boolean; observacoes: string[] }>> {
    logInfo(
      'Validando documentação na Light-RJ',
      'LightRJAPI',
      { documentos_count: documentos.length }
    );

    const response = await this.makeRequest<any>(
      this.config.endpoints.validacao_documentos,
      'POST',
      { documentos }
    );

    if (response.success && response.data) {
      return {
        success: true,
        data: {
          valido: response.data.valido || false,
          observacoes: response.data.observacoes || []
        },
        metadata: response.metadata
      };
    }

    return {
      success: false,
      error: response.error,
      metadata: response.metadata
    };
  }

  // ===== MÉTODOS AUXILIARES ESPECÍFICOS DA LIGHT-RJ =====

  private determinarClasseConsumo(solicitacao: SolicitacaoAcesso): 'residencial' | 'comercial' | 'industrial' | 'rural' {
    // Lógica simplificada - em produção, seria mais complexa
    if (solicitacao.cliente.tipo_pessoa === 'fisica') {
      return 'residencial';
    }
    
    if (solicitacao.potencia_kw > 100) {
      return 'industrial';
    }
    
    return 'comercial';
  }

  private determinarTensaoFornecimento(potenciaKw: number): '220V' | '380V' | '13.8kV' | '34.5kV' {
    if (potenciaKw <= 10) return '220V';
    if (potenciaKw <= 75) return '380V';
    if (potenciaKw <= 500) return '13.8kV';
    return '34.5kV';
  }

  private mapearStatusLight(statusLight: string): StatusSolicitacao['status'] {
    const mapeamento: Record<string, StatusSolicitacao['status']> = {
      'PENDENTE': 'pendente',
      'EM_ANALISE': 'em_analise',
      'APROVADO': 'aprovada',
      'REJEITADO': 'rejeitada',
      'AGUARDANDO_DOCS': 'aguardando_documentos',
      'AUTORIZADO': 'instalacao_autorizada'
    };
    
    return mapeamento[statusLight] || 'pendente';
  }
}

// ===== SERVIÇO PRINCIPAL =====

export class ConcessionariaAPIService {
  private static instance: ConcessionariaAPIService;
  private concessionarias: Map<string, BaseConcessionariaAPI> = new Map();

  private constructor() {
    this.initializeConcessionarias();
  }

  public static getInstance(): ConcessionariaAPIService {
    if (!ConcessionariaAPIService.instance) {
      ConcessionariaAPIService.instance = new ConcessionariaAPIService();
    }
    return ConcessionariaAPIService.instance;
  }

  private initializeConcessionarias(): void {
    // Inicializar Light-RJ
    this.concessionarias.set('light_rj', new LightRJAPI());
    
    logInfo(
      'Serviço de APIs de concessionárias inicializado',
      'ConcessionariaAPIService',
      { concessionarias_count: this.concessionarias.size }
    );
  }

  public getConcessionaria(id: string): BaseConcessionariaAPI | undefined {
    return this.concessionarias.get(id);
  }

  public getAvailableConcessionarias(): Array<{ id: string; name: string; region: string }> {
    return Array.from(this.concessionarias.entries()).map(([id, api]) => ({
      id,
      name: (api as any).config.name,
      region: (api as any).config.region
    }));
  }

  public async criarSolicitacaoAcesso(
    concessionariaId: string,
    solicitacao: SolicitacaoAcesso
  ): Promise<APIResponse<{ protocolo: string; id: string }>> {
    const concessionaria = this.getConcessionaria(concessionariaId);
    
    if (!concessionaria) {
      return {
        success: false,
        error: {
          code: 'CONCESSIONARIA_NOT_FOUND',
          message: `Concessionária ${concessionariaId} não encontrada`
        }
      };
    }

    return await concessionaria.criarSolicitacaoAcesso(solicitacao);
  }

  public async consultarStatusSolicitacao(
    concessionariaId: string,
    solicitacaoId: string
  ): Promise<APIResponse<StatusSolicitacao>> {
    const concessionaria = this.getConcessionaria(concessionariaId);
    
    if (!concessionaria) {
      return {
        success: false,
        error: {
          code: 'CONCESSIONARIA_NOT_FOUND',
          message: `Concessionária ${concessionariaId} não encontrada`
        }
      };
    }

    return await concessionaria.consultarStatusSolicitacao(solicitacaoId);
  }

  public async obterTarifas(concessionariaId: string): Promise<APIResponse<TarifaEnergia>> {
    const concessionaria = this.getConcessionaria(concessionariaId);
    
    if (!concessionaria) {
      return {
        success: false,
        error: {
          code: 'CONCESSIONARIA_NOT_FOUND',
          message: `Concessionária ${concessionariaId} não encontrada`
        }
      };
    }

    return await concessionaria.obterTarifas();
  }

  public async obterHistoricoConsumo(
    concessionariaId: string,
    numeroInstalacao: string,
    meses: number = 12
  ): Promise<APIResponse<HistoricoConsumo[]>> {
    const concessionaria = this.getConcessionaria(concessionariaId);
    
    if (!concessionaria) {
      return {
        success: false,
        error: {
          code: 'CONCESSIONARIA_NOT_FOUND',
          message: `Concessionária ${concessionariaId} não encontrada`
        }
      };
    }

    return await concessionaria.obterHistoricoConsumo(numeroInstalacao, meses);
  }
}

// Instância singleton
export const concessionariaAPI = ConcessionariaAPIService.getInstance();

// Funções de conveniência
export const criarSolicitacaoAcesso = (concessionariaId: string, solicitacao: SolicitacaoAcesso) => 
  concessionariaAPI.criarSolicitacaoAcesso(concessionariaId, solicitacao);

export const consultarStatusSolicitacao = (concessionariaId: string, solicitacaoId: string) => 
  concessionariaAPI.consultarStatusSolicitacao(concessionariaId, solicitacaoId);

export const obterTarifasConcessionaria = (concessionariaId: string) => 
  concessionariaAPI.obterTarifas(concessionariaId);

export const obterHistoricoConsumo = (concessionariaId: string, numeroInstalacao: string, meses?: number) => 
  concessionariaAPI.obterHistoricoConsumo(concessionariaId, numeroInstalacao, meses);

export default ConcessionariaAPIService;