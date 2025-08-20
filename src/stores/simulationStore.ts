import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// Interface para dados de simulação técnica
export interface SimulationData {
  // Dados básicos do sistema
  potencia_sistema_kwp: number;
  geracao_anual_kwh: number;
  geracao_mensal_media: number;
  
  // Configuração do sistema
  quantidade_modulos: number;
  potencia_modulo: number;
  modelo_modulo: string;
  quantidade_inversores: number;
  potencia_inversor: number;
  modelo_inversor: string;
  
  // Parâmetros técnicos
  performance_ratio: number;
  oversize: number;
  hsp: number; // Horas Sol Pico
  irradiancia_anual: number;
  
  // Localização e instalação
  desvio_azimutal: number;
  inclinacao: number;
  tipo_telhado: string;
  
  // Dados financeiros básicos
  custo_sistema: number;
  economia_anual: number;
  payback_anos: number;
  
  // Timestamp da última atualização
  updated_at: string;
}

// Interface para o store
interface SimulationStore {
  // Estado
  simulationData: SimulationData | null;
  isSimulationValid: boolean;
  
  // Ações
  updateSimulation: (data: Partial<SimulationData>) => void;
  setSimulationData: (data: SimulationData) => void;
  clearSimulation: () => void;
  
  // Getters computados
  getFinancialParams: () => {
    potencia_sistema_kwp: number;
    geracao_anual_kwh: number;
    custo_sistema: number;
  } | null;
}

// Dados padrão para simulação
const defaultSimulationData: SimulationData = {
  potencia_sistema_kwp: 0,
  geracao_anual_kwh: 0,
  geracao_mensal_media: 0,
  quantidade_modulos: 0,
  potencia_modulo: 0,
  modelo_modulo: '',
  quantidade_inversores: 0,
  potencia_inversor: 0,
  modelo_inversor: '',
  performance_ratio: 80,
  oversize: 100,
  hsp: 5.0,
  irradiancia_anual: 1825,
  desvio_azimutal: 0,
  inclinacao: 15,
  tipo_telhado: 'ceramico',
  custo_sistema: 0,
  economia_anual: 0,
  payback_anos: 0,
  updated_at: new Date().toISOString()
};

// Store Zustand com persistência
export const useSimulationStore = create<SimulationStore>()(
  persist(
    (set, get) => ({
      // Estado inicial
      simulationData: null,
      isSimulationValid: false,
      
      // Atualizar dados de simulação parcialmente
      updateSimulation: (data: Partial<SimulationData>) => {
        const currentData = get().simulationData;
        const updatedData = {
          ...defaultSimulationData,
          ...currentData,
          ...data,
          updated_at: new Date().toISOString()
        };
        
        // Validar se os dados essenciais estão presentes
        const isValid = updatedData.potencia_sistema_kwp > 0 && 
                       updatedData.geracao_anual_kwh > 0;
        
        set({ 
          simulationData: updatedData,
          isSimulationValid: isValid
        });
      },
      
      // Definir dados completos de simulação
      setSimulationData: (data: SimulationData) => {
        const updatedData = {
          ...data,
          updated_at: new Date().toISOString()
        };
        
        const isValid = data.potencia_sistema_kwp > 0 && 
                       data.geracao_anual_kwh > 0;
        
        set({ 
          simulationData: updatedData,
          isSimulationValid: isValid
        });
      },
      
      // Limpar dados de simulação
      clearSimulation: () => {
        set({ 
          simulationData: null,
          isSimulationValid: false
        });
      },
      
      // Getter para parâmetros financeiros
      getFinancialParams: () => {
        const data = get().simulationData;
        if (!data || !get().isSimulationValid) {
          return null;
        }
        
        return {
          potencia_sistema_kwp: data.potencia_sistema_kwp,
          geracao_anual_kwh: data.geracao_anual_kwh,
          custo_sistema: data.custo_sistema
        };
      }
    }),
    {
      name: 'simulation-storage', // Nome da chave no localStorage
      version: 1,
      // Migração para versões futuras se necessário
      migrate: (persistedState: unknown, version: number) => {
        if (version === 0) {
          // Migração da versão 0 para 1 se necessário
          return persistedState;
        }
        return persistedState;
      }
    }
  )
);

// Hook personalizado para facilitar o uso
export const useSimulationData = () => {
  const store = useSimulationStore();
  
  return {
    // Estado
    simulationData: store.simulationData,
    isValid: store.isSimulationValid,
    
    // Ações
    updateSimulation: store.updateSimulation,
    setSimulation: store.setSimulationData,
    clearSimulation: store.clearSimulation,
    
    // Getters
    getFinancialParams: store.getFinancialParams,
    
    // Helpers
    hasValidData: () => store.isSimulationValid && store.simulationData !== null,
    getLastUpdate: () => store.simulationData?.updated_at || null
  };
};

// Tipos exportados para uso em outros componentes
export type { SimulationStore };