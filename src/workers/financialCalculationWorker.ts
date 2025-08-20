/**
 * Web Worker para Cálculos Financeiros - Solara Nova Energia
 * 
 * Processa cálculos pesados de VPL, TIR e análise financeira
 * em thread separada para não bloquear a UI.
 */

interface WorkerMessage {
  id: string;
  type: 'CALCULATE_FINANCIAL' | 'CALCULATE_VPL' | 'CALCULATE_TIR' | 'CALCULATE_PAYBACK' | 'CANCEL';
  payload: FinancialParams | VPLParams | TIRParams | Record<string, unknown>;
}

interface WorkerResponse {
  id: string;
  type: 'SUCCESS' | 'ERROR' | 'PROGRESS';
  payload: Record<string, unknown>;
}

interface FinancialParams {
  investimento_inicial: number;
  economia_mensal: number;
  taxa_desconto: number;
  vida_util_anos: number;
  inflacao_anual?: number;
  manutencao_anual?: number;
  degradacao_anual?: number;
  custoSistema?: number;
  potenciaSistema?: number;
  geracaoAnual?: number;
  consumoMensal?: number;
  tarifaEnergia?: number;
  inflacao?: number;
  taxaDesconto?: number;
  periodoProjecao?: number;
  [key: string]: unknown;
}

interface VPLParams {
  fluxos: number[];
  taxa: number;
}

interface TIRParams {
  fluxos: number[];
  tentativa_inicial?: number;
}

class FinancialCalculationWorker {
  private activeCalculations = new Set<string>();

  constructor() {
    self.addEventListener('message', this.handleMessage.bind(this));
  }

  private async handleMessage(event: MessageEvent<WorkerMessage>): Promise<void> {
    const { id, type, payload } = event.data;

    if (type === 'CANCEL') {
      this.activeCalculations.delete(id);
      return;
    }

    this.activeCalculations.add(id);

    try {
      switch (type) {
        case 'CALCULATE_FINANCIAL':
          await this.calculateFinancial(id, payload);
          break;
        
        case 'CALCULATE_VPL':
          await this.calculateVPL(id, payload);
          break;
        
        case 'CALCULATE_TIR':
          await this.calculateTIR(id, payload);
          break;
        
        case 'CALCULATE_PAYBACK':
          await this.calculatePayback(id, payload);
          break;
        
        default:
          throw new Error(`Tipo de cálculo não suportado: ${type}`);
      }
    } catch (error) {
      this.postMessage({
        id,
        type: 'ERROR',
        payload: { error: error instanceof Error ? error.message : 'Erro desconhecido' }
      });
    } finally {
      this.activeCalculations.delete(id);
    }
  }

  private async calculateFinancial(id: string, params: FinancialParams): Promise<void> {
    if (!this.activeCalculations.has(id)) return;

    // Emitir progresso inicial
    this.postMessage({
      id,
      type: 'PROGRESS',
      payload: { progress: 0, stage: 'Iniciando cálculos financeiros...' }
    });

    const {
      investimento_inicial,
      economia_mensal,
      taxa_desconto,
      vida_util_anos,
      inflacao_anual = 0.04, // 4% ao ano
      manutencao_anual = 0.01, // 1% do investimento
      degradacao_anual = 0.005 // 0.5% ao ano
    } = params;

    if (!this.activeCalculations.has(id)) return;

    // Calcular fluxo de caixa mensal
    this.postMessage({
      id,
      type: 'PROGRESS',
      payload: { progress: 20, stage: 'Calculando fluxo de caixa...' }
    });

    const meses_total = vida_util_anos * 12;
    const fluxo_caixa: number[] = [-investimento_inicial]; // Investimento inicial negativo
    
    let economia_atual = economia_mensal;
    const taxa_mensal_inflacao = Math.pow(1 + inflacao_anual, 1/12) - 1;
    const taxa_mensal_degradacao = Math.pow(1 - degradacao_anual, 1/12) - 1;
    const manutencao_mensal = (investimento_inicial * manutencao_anual) / 12;

    for (let mes = 1; mes <= meses_total; mes++) {
      if (!this.activeCalculations.has(id)) return;

      // Aplicar inflação na economia
      economia_atual *= (1 + taxa_mensal_inflacao);
      
      // Aplicar degradação dos painéis
      economia_atual *= (1 + taxa_mensal_degradacao);
      
      // Subtrair manutenção
      const fluxo_mensal = economia_atual - manutencao_mensal;
      fluxo_caixa.push(fluxo_mensal);

      // Emitir progresso a cada 10%
      if (mes % Math.floor(meses_total / 5) === 0) {
        const progress = 20 + (mes / meses_total) * 30;
        this.postMessage({
          id,
          type: 'PROGRESS',
          payload: { progress, stage: `Calculando mês ${mes}/${meses_total}...` }
        });
      }
    }

    if (!this.activeCalculations.has(id)) return;

    // Calcular VPL
    this.postMessage({
      id,
      type: 'PROGRESS',
      payload: { progress: 60, stage: 'Calculando VPL...' }
    });

    const taxa_mensal = Math.pow(1 + taxa_desconto, 1/12) - 1;
    const vpl = this.calcularVPLInterno(fluxo_caixa, taxa_mensal);

    if (!this.activeCalculations.has(id)) return;

    // Calcular TIR
    this.postMessage({
      id,
      type: 'PROGRESS',
      payload: { progress: 80, stage: 'Calculando TIR...' }
    });

    const tir_mensal = this.calcularTIRInterno(fluxo_caixa);
    const tir_anual = Math.pow(1 + tir_mensal, 12) - 1;

    if (!this.activeCalculations.has(id)) return;

    // Calcular payback
    this.postMessage({
      id,
      type: 'PROGRESS',
      payload: { progress: 90, stage: 'Calculando payback...' }
    });

    const payback = this.calcularPaybackInterno(fluxo_caixa);

    // Calcular indicadores adicionais
    const economia_total = fluxo_caixa.slice(1).reduce((acc, val) => acc + val, 0);
    const roi = ((economia_total - investimento_inicial) / investimento_inicial) * 100;
    const economia_acumulada_10_anos = fluxo_caixa.slice(1, 121).reduce((acc, val) => acc + val, 0);
    
    // Cálculos ambientais
    const geracao_total_kwh = (economia_total / 0.80); // Assumindo R$ 0,80/kWh médio
    const reducao_co2_kg = geracao_total_kwh * 0.0817; // kg CO2/kWh
    const arvores_equivalentes = reducao_co2_kg / 22; // 22kg CO2/árvore/ano

    if (!this.activeCalculations.has(id)) return;

    this.postMessage({
      id,
      type: 'PROGRESS',
      payload: { progress: 100, stage: 'Finalizando...' }
    });

    // Resultado final
    this.postMessage({
      id,
      type: 'SUCCESS',
      payload: {
        vpl,
        tir: tir_anual,
        payback_meses: payback,
        payback_anos: payback / 12,
        roi_percentual: roi,
        economia_total,
        economia_mensal_inicial: economia_mensal,
        economia_mensal_final: economia_atual,
        fluxo_caixa,
        investimento_inicial,
        economia_acumulada_10_anos,
        indicadores_ambientais: {
          geracao_total_kwh,
          reducao_co2_kg,
          arvores_equivalentes
        },
        parametros_utilizados: {
          taxa_desconto,
          vida_util_anos,
          inflacao_anual,
          manutencao_anual,
          degradacao_anual
        }
      }
    });
  }

  private async calculateVPL(id: string, { fluxos, taxa }: VPLParams): Promise<void> {
    if (!this.activeCalculations.has(id)) return;

    this.postMessage({
      id,
      type: 'PROGRESS',
      payload: { progress: 50, stage: 'Calculando VPL...' }
    });

    const vpl = this.calcularVPLInterno(fluxos, taxa);
    
    this.postMessage({
      id,
      type: 'SUCCESS',
      payload: { vpl }
    });
  }

  private async calculateTIR(id: string, { fluxos, tentativa_inicial = 0.1 }: TIRParams): Promise<void> {
    if (!this.activeCalculations.has(id)) return;

    this.postMessage({
      id,
      type: 'PROGRESS',
      payload: { progress: 50, stage: 'Calculando TIR...' }
    });

    const tir = this.calcularTIRInterno(fluxos, tentativa_inicial);
    
    this.postMessage({
      id,
      type: 'SUCCESS',
      payload: { tir }
    });
  }

  private async calculatePayback(id: string, { fluxos }: { fluxos: number[] }): Promise<void> {
    if (!this.activeCalculations.has(id)) return;

    this.postMessage({
      id,
      type: 'PROGRESS',
      payload: { progress: 50, stage: 'Calculando payback...' }
    });

    const payback = this.calcularPaybackInterno(fluxos);
    
    this.postMessage({
      id,
      type: 'SUCCESS',
      payload: { payback_meses: payback, payback_anos: payback / 12 }
    });
  }

  // Métodos de cálculo interno

  private calcularVPLInterno(fluxos: number[], taxa: number): number {
    let vpl = 0;
    
    for (let i = 0; i < fluxos.length; i++) {
      vpl += fluxos[i] / Math.pow(1 + taxa, i);
    }
    
    return vpl;
  }

  private calcularTIRInterno(fluxos: number[], tentativa_inicial: number = 0.1): number {
    const MAX_ITERACOES = 1000;
    const PRECISAO = 0.0001;
    
    let taxa = tentativa_inicial;
    
    for (let i = 0; i < MAX_ITERACOES; i++) {
      const vpl = this.calcularVPLInterno(fluxos, taxa);
      const vpl_derivada = this.calcularDerivadaVPL(fluxos, taxa);
      
      if (Math.abs(vpl) < PRECISAO) {
        return taxa;
      }
      
      if (Math.abs(vpl_derivada) < PRECISAO) {
        // Evitar divisão por zero
        taxa += 0.01;
        continue;
      }
      
      const nova_taxa = taxa - (vpl / vpl_derivada);
      
      // Limitar taxa entre -99% e 1000%
      taxa = Math.max(-0.99, Math.min(10, nova_taxa));
    }
    
    return taxa;
  }

  private calcularDerivadaVPL(fluxos: number[], taxa: number): number {
    let derivada = 0;
    
    for (let i = 1; i < fluxos.length; i++) {
      derivada -= (i * fluxos[i]) / Math.pow(1 + taxa, i + 1);
    }
    
    return derivada;
  }

  private calcularPaybackInterno(fluxos: number[]): number {
    let acumulado = fluxos[0]; // Investimento inicial (negativo)
    
    for (let i = 1; i < fluxos.length; i++) {
      acumulado += fluxos[i];
      
      if (acumulado >= 0) {
        // Interpolação linear para encontrar o ponto exato
        const fluxo_anterior = acumulado - fluxos[i];
        const proporcao = Math.abs(fluxo_anterior) / fluxos[i];
        return i - 1 + proporcao;
      }
    }
    
    // Se não houver payback no período
    return -1;
  }

  private postMessage(response: WorkerResponse): void {
    self.postMessage(response);
  }
}

// Inicializar worker
new FinancialCalculationWorker();

// Exportar tipos para uso no main thread
export type { WorkerMessage, WorkerResponse, FinancialParams, VPLParams, TIRParams };