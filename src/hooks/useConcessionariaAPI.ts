import { useState, useEffect, useCallback } from 'react';
import {
  concessionariaAPI,
  type SolicitacaoAcesso,
  type StatusSolicitacao,
  type TarifaEnergia,
  type HistoricoConsumo,
  type APIResponse
} from '@/services/ConcessionariaAPIService';
import { logInfo, logError } from '@/utils/secureLogger';

export interface ConcessionariaInfo {
  id: string;
  name: string;
  region: string;
}

export interface SolicitacaoState {
  loading: boolean;
  data: { protocolo: string; id: string } | null;
  error: string | null;
}

export interface StatusState {
  loading: boolean;
  data: StatusSolicitacao | null;
  error: string | null;
  lastUpdated: Date | null;
}

export interface TarifasState {
  loading: boolean;
  data: TarifaEnergia | null;
  error: string | null;
  lastUpdated: Date | null;
}

export interface HistoricoState {
  loading: boolean;
  data: HistoricoConsumo[] | null;
  error: string | null;
  lastUpdated: Date | null;
}

export interface UseConcessionariaAPIReturn {
  // Informações das concessionárias
  concessionarias: ConcessionariaInfo[];
  
  // Estados das operações
  solicitacao: SolicitacaoState;
  status: StatusState;
  tarifas: TarifasState;
  historico: HistoricoState;
  
  // Ações
  criarSolicitacao: (concessionariaId: string, dados: SolicitacaoAcesso) => Promise<void>;
  consultarStatus: (concessionariaId: string, solicitacaoId: string) => Promise<void>;
  obterTarifas: (concessionariaId: string) => Promise<void>;
  obterHistorico: (concessionariaId: string, numeroInstalacao: string, meses?: number) => Promise<void>;
  
  // Utilitários
  limparErros: () => void;
  resetarEstados: () => void;
  
  // Auto-refresh para status
  iniciarMonitoramentoStatus: (concessionariaId: string, solicitacaoId: string, intervalMs?: number) => void;
  pararMonitoramentoStatus: () => void;
}

const INITIAL_SOLICITACAO_STATE: SolicitacaoState = {
  loading: false,
  data: null,
  error: null
};

const INITIAL_STATUS_STATE: StatusState = {
  loading: false,
  data: null,
  error: null,
  lastUpdated: null
};

const INITIAL_TARIFAS_STATE: TarifasState = {
  loading: false,
  data: null,
  error: null,
  lastUpdated: null
};

const INITIAL_HISTORICO_STATE: HistoricoState = {
  loading: false,
  data: null,
  error: null,
  lastUpdated: null
};

export function useConcessionariaAPI(): UseConcessionariaAPIReturn {
  // Estados
  const [concessionarias, setConcessionarias] = useState<ConcessionariaInfo[]>([]);
  const [solicitacao, setSolicitacao] = useState<SolicitacaoState>(INITIAL_SOLICITACAO_STATE);
  const [status, setStatus] = useState<StatusState>(INITIAL_STATUS_STATE);
  const [tarifas, setTarifas] = useState<TarifasState>(INITIAL_TARIFAS_STATE);
  const [historico, setHistorico] = useState<HistoricoState>(INITIAL_HISTORICO_STATE);
  
  // Controle de monitoramento
  const [monitoringInterval, setMonitoringInterval] = useState<NodeJS.Timeout | null>(null);
  const [monitoringConfig, setMonitoringConfig] = useState<{
    concessionariaId: string;
    solicitacaoId: string;
  } | null>(null);

  // Inicialização - carregar lista de concessionárias
  useEffect(() => {
    const loadConcessionarias = () => {
      try {
        const available = concessionariaAPI.getAvailableConcessionarias();
        setConcessionarias(available);
        
        logInfo(
          'Lista de concessionárias carregada',
          'useConcessionariaAPI',
          { count: available.length }
        );
      } catch (error) {
        logError(
          'Erro ao carregar lista de concessionárias',
          'useConcessionariaAPI',
          { error: error instanceof Error ? error.message : 'Erro desconhecido' }
        );
      }
    };

    loadConcessionarias();
  }, []);

  // Cleanup do monitoramento
  useEffect(() => {
    return () => {
      if (monitoringInterval) {
        clearInterval(monitoringInterval);
      }
    };
  }, [monitoringInterval]);

  // ===== AÇÕES =====

  const criarSolicitacao = useCallback(async (
    concessionariaId: string,
    dados: SolicitacaoAcesso
  ): Promise<void> => {
    setSolicitacao(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      logInfo(
        'Iniciando criação de solicitação',
        'useConcessionariaAPI',
        {
          concessionaria_id: concessionariaId,
          potencia_kw: dados.potencia_kw,
          tipo: dados.tipo
        }
      );
      
      const response = await concessionariaAPI.criarSolicitacaoAcesso(concessionariaId, dados);
      
      if (response.success && response.data) {
        setSolicitacao({
          loading: false,
          data: response.data,
          error: null
        });
        
        logInfo(
          'Solicitação criada com sucesso',
          'useConcessionariaAPI',
          {
            protocolo: response.data.protocolo,
            id: response.data.id
          }
        );
      } else {
        const errorMessage = response.error?.message || 'Erro ao criar solicitação';
        setSolicitacao({
          loading: false,
          data: null,
          error: errorMessage
        });
        
        logError(
          'Falha ao criar solicitação',
          'useConcessionariaAPI',
          { error: errorMessage }
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado';
      setSolicitacao({
        loading: false,
        data: null,
        error: errorMessage
      });
      
      logError(
        'Erro inesperado ao criar solicitação',
        'useConcessionariaAPI',
        { error: errorMessage }
      );
    }
  }, []);

  const consultarStatus = useCallback(async (
    concessionariaId: string,
    solicitacaoId: string
  ): Promise<void> => {
    setStatus(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      logInfo(
        'Consultando status de solicitação',
        'useConcessionariaAPI',
        {
          concessionaria_id: concessionariaId,
          solicitacao_id: solicitacaoId
        }
      );
      
      const response = await concessionariaAPI.consultarStatusSolicitacao(concessionariaId, solicitacaoId);
      
      if (response.success && response.data) {
        setStatus({
          loading: false,
          data: response.data,
          error: null,
          lastUpdated: new Date()
        });
        
        logInfo(
          'Status consultado com sucesso',
          'useConcessionariaAPI',
          {
            status: response.data.status,
            protocolo: response.data.numero_protocolo
          }
        );
      } else {
        const errorMessage = response.error?.message || 'Erro ao consultar status';
        setStatus(prev => ({
          ...prev,
          loading: false,
          error: errorMessage
        }));
        
        logError(
          'Falha ao consultar status',
          'useConcessionariaAPI',
          { error: errorMessage }
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado';
      setStatus(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      
      logError(
        'Erro inesperado ao consultar status',
        'useConcessionariaAPI',
        { error: errorMessage }
      );
    }
  }, []);

  const obterTarifas = useCallback(async (concessionariaId: string): Promise<void> => {
    setTarifas(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      logInfo(
        'Obtendo tarifas da concessionária',
        'useConcessionariaAPI',
        { concessionaria_id: concessionariaId }
      );
      
      const response = await concessionariaAPI.obterTarifas(concessionariaId);
      
      if (response.success && response.data) {
        setTarifas({
          loading: false,
          data: response.data,
          error: null,
          lastUpdated: new Date()
        });
        
        logInfo(
          'Tarifas obtidas com sucesso',
          'useConcessionariaAPI',
          {
            modalidade: response.data.modalidade,
            grupo: response.data.grupo
          }
        );
      } else {
        const errorMessage = response.error?.message || 'Erro ao obter tarifas';
        setTarifas(prev => ({
          ...prev,
          loading: false,
          error: errorMessage
        }));
        
        logError(
          'Falha ao obter tarifas',
          'useConcessionariaAPI',
          { error: errorMessage }
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado';
      setTarifas(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      
      logError(
        'Erro inesperado ao obter tarifas',
        'useConcessionariaAPI',
        { error: errorMessage }
      );
    }
  }, []);

  const obterHistorico = useCallback(async (
    concessionariaId: string,
    numeroInstalacao: string,
    meses: number = 12
  ): Promise<void> => {
    setHistorico(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      logInfo(
        'Obtendo histórico de consumo',
        'useConcessionariaAPI',
        {
          concessionaria_id: concessionariaId,
          numero_instalacao: numeroInstalacao,
          meses
        }
      );
      
      const response = await concessionariaAPI.obterHistoricoConsumo(
        concessionariaId,
        numeroInstalacao,
        meses
      );
      
      if (response.success && response.data) {
        setHistorico({
          loading: false,
          data: response.data,
          error: null,
          lastUpdated: new Date()
        });
        
        logInfo(
          'Histórico obtido com sucesso',
          'useConcessionariaAPI',
          {
            registros_count: response.data.length,
            periodo_meses: meses
          }
        );
      } else {
        const errorMessage = response.error?.message || 'Erro ao obter histórico';
        setHistorico(prev => ({
          ...prev,
          loading: false,
          error: errorMessage
        }));
        
        logError(
          'Falha ao obter histórico',
          'useConcessionariaAPI',
          { error: errorMessage }
        );
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro inesperado';
      setHistorico(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));
      
      logError(
        'Erro inesperado ao obter histórico',
        'useConcessionariaAPI',
        { error: errorMessage }
      );
    }
  }, []);

  // ===== UTILITÁRIOS =====

  const limparErros = useCallback(() => {
    setSolicitacao(prev => ({ ...prev, error: null }));
    setStatus(prev => ({ ...prev, error: null }));
    setTarifas(prev => ({ ...prev, error: null }));
    setHistorico(prev => ({ ...prev, error: null }));
    
    logInfo('Erros limpos', 'useConcessionariaAPI');
  }, []);

  const resetarEstados = useCallback(() => {
    setSolicitacao(INITIAL_SOLICITACAO_STATE);
    setStatus(INITIAL_STATUS_STATE);
    setTarifas(INITIAL_TARIFAS_STATE);
    setHistorico(INITIAL_HISTORICO_STATE);
    
    // Parar monitoramento se estiver ativo
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
      setMonitoringInterval(null);
      setMonitoringConfig(null);
    }
    
    logInfo('Estados resetados', 'useConcessionariaAPI');
  }, [monitoringInterval]);

  // ===== MONITORAMENTO DE STATUS =====

  const iniciarMonitoramentoStatus = useCallback((
    concessionariaId: string,
    solicitacaoId: string,
    intervalMs: number = 30000 // 30 segundos por padrão
  ) => {
    // Parar monitoramento anterior se existir
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
    }
    
    // Configurar novo monitoramento
    setMonitoringConfig({ concessionariaId, solicitacaoId });
    
    const interval = setInterval(() => {
      consultarStatus(concessionariaId, solicitacaoId);
    }, intervalMs);
    
    setMonitoringInterval(interval);
    
    // Fazer primeira consulta imediatamente
    consultarStatus(concessionariaId, solicitacaoId);
    
    logInfo(
      'Monitoramento de status iniciado',
      'useConcessionariaAPI',
      {
        concessionaria_id: concessionariaId,
        solicitacao_id: solicitacaoId,
        interval_ms: intervalMs
      }
    );
  }, [consultarStatus, monitoringInterval]);

  const pararMonitoramentoStatus = useCallback(() => {
    if (monitoringInterval) {
      clearInterval(monitoringInterval);
      setMonitoringInterval(null);
      setMonitoringConfig(null);
      
      logInfo('Monitoramento de status parado', 'useConcessionariaAPI');
    }
  }, [monitoringInterval]);

  // ===== EFEITOS PARA MONITORAMENTO INTELIGENTE =====

  // Parar monitoramento automaticamente quando status for final
  useEffect(() => {
    if (status.data && monitoringInterval) {
      const statusesFinais = ['aprovada', 'rejeitada', 'instalacao_autorizada'];
      
      if (statusesFinais.includes(status.data.status)) {
        logInfo(
          'Status final detectado - parando monitoramento',
          'useConcessionariaAPI',
          { status_final: status.data.status }
        );
        
        pararMonitoramentoStatus();
      }
    }
  }, [status.data, monitoringInterval, pararMonitoramentoStatus]);

  return {
    // Informações
    concessionarias,
    
    // Estados
    solicitacao,
    status,
    tarifas,
    historico,
    
    // Ações
    criarSolicitacao,
    consultarStatus,
    obterTarifas,
    obterHistorico,
    
    // Utilitários
    limparErros,
    resetarEstados,
    
    // Monitoramento
    iniciarMonitoramentoStatus,
    pararMonitoramentoStatus
  };
}

export default useConcessionariaAPI;