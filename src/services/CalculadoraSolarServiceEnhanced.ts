import { TarifaService, TarifaConcessionaria, CalculoTarifa } from './TarifaService';
import { logError, logWarn } from '@/utils/secureLogger';
import { 
  LEI_14300, 
  RENS_ANEEL, 
  COMPONENTES_TARIFARIOS, 
  CONCESSIONARIAS_RJ,
  RegulatoryUtils,
  REGULATORY_METADATA 
} from '@/constants/regulatory';

// Interfaces aprimoradas para os cálculos
export interface ParametrosSistemaEnhanced {
  custo_sistema: number;
  potencia_sistema_kwp: number;
  geracao_anual_kwh: number;
  consumo_mensal_kwh: number;
  incremento_consumo_anual: number; // %
  fator_simultaneidade: number; // % (0.4 = 40%)
  concessionaria_id: string;
  tipo_ligacao: 'monofasico' | 'bifasico' | 'trifasico';
  ano_instalacao: number;
  periodo_projecao_anos: number;
  inflacao_anual: number; // %
  taxa_desconto_anual: number; // %
  depreciacao_anual_fv: number; // %
  custo_om_anual: number; // R$/ano
  reajuste_tarifario_anual: number; // %
  // Novos parâmetros para melhor controle
  perfil_consumo_diurno: number; // % do consumo que ocorre durante o dia
  eficiencia_inversor: number; // % (padrão 97%)
  perdas_sistema: number; // % (padrão 15%)
  // Performance e otimização
  useWorker?: boolean; // Usar Web Workers para cálculos pesados
}

// Estrutura de tabela mensal otimizada
export interface TabelaMensal {
  mes_absoluto: number; // 1-300 (25 anos)
  mes: number; // 1-12
  ano: number;
  // Consumo e Geração
  consumo_total_kwh: number;
  consumo_diurno_kwh: number; // Baseado no perfil de consumo
  consumo_noturno_kwh: number;
  geracao_bruta_kwh: number;
  geracao_liquida_kwh: number; // Após perdas do sistema
  // Autoconsumo e Simultaneidade
  autoconsumo_instantaneo_kwh: number; // Energia consumida no momento da geração
  energia_excedente_kwh: number; // Energia injetada na rede
  energia_fornecida_kwh: number; // Energia que volta da rede (diferente de excedente)
  consumo_rede_liquido_kwh: number; // Consumo final da rede após autoconsumo
  // Gestão de Créditos
  creditos_gerados_kwh: number;
  creditos_utilizados_kwh: number;
  creditos_vencidos_kwh: number;
  saldo_creditos_kwh: number;
  // Custos e Tarifas
  tarifa_sem_fv_rs_kwh: number;
  tarifa_com_fv_rs_kwh: number;
  custo_sem_fv_rs: number;
  custo_com_fv_rs: number;
  custo_disponibilidade_rs: number;
  custo_fio_b_rs: number;
  custo_om_rs: number;
  // Economia e Fluxo
  economia_mensal_rs: number;
  economia_acumulada_rs: number;
  fluxo_caixa_mensal_rs: number;
  fluxo_caixa_acumulado_rs: number;
  // Lei 14.300/2022 - Marco Legal da Geração Distribuída
  percentual_fio_b: number;
  anos_desde_instalacao: number;
  isento_fio_b: boolean;
  base_legal_fio_b: string;
  observacoes_regulamentares: string[];
  // Conformidade ANEEL
  ren_aplicavel: string; // REN 1000/2021
  tipo_geracao: 'micro' | 'mini'; // Baseado na potência
  concessionaria_codigo: string; // Ex: 'LIGHT-RJ'
  // Auditoria e Compliance
  calculo_validado: boolean;
  timestamp_calculo: string;
  versao_regulamentacao: string;
}

export interface ResultadoFinanceiroEnhanced {
  // Investimento
  investimento_inicial: number;
  // Indicadores Financeiros
  vpl: number;
  tir: number; // %
  payback_simples_anos: number;
  payback_descontado_anos: number;
  roi_25_anos: number; // %
  // Economia
  economia_total_25_anos: number;
  economia_primeiro_ano: number;
  economia_media_anual: number;
  economia_acumulada_10_anos: number;
  // Energia
  geracao_total_25_anos: number;
  autoconsumo_total_25_anos: number;
  energia_injetada_total_25_anos: number;
  creditos_nao_utilizados_25_anos: number;
  // Sustentabilidade
  reducao_co2_kg: number;
  arvores_equivalentes: number;
  // Dados Detalhados
  tabela_mensal: TabelaMensal[];
  resumo_anual: Array<{
    ano: number;
    economia_anual: number;
    geracao_anual: number;
    autoconsumo_anual: number;
    injecao_anual: number;
    creditos_utilizados_anual: number;
    custo_fio_b_anual: number;
    fluxo_caixa_acumulado: number;
  }>;
}

// Estrutura para gestão de créditos com vencimento
interface CreditoEnergia {
  valor_kwh: number;
  mes_geracao: number;
  mes_vencimento: number;
  utilizado_kwh: number;
}

export class CalculadoraSolarServiceEnhanced {
  private tarifaService: TarifaService;
  private creditosEnergia: CreditoEnergia[] = [];

  constructor() {
    this.tarifaService = TarifaService.getInstance();
  }

  /**
   * Calcula o percentual do Fio B conforme Lei 14.300/2022 com regras de transição
   * 
   * BASE LEGAL: Lei 14.300/2022, Art. 7º - Marco Legal da Geração Distribuída
   * REGULAMENTAÇÃO: REN ANEEL 1000/2021
   * 
   * REGRAS DE APLICAÇÃO:
   * - Instalado antes de 2023: Isento por 25 anos (Art. 26 - Regras de transição)
   * - Instalado 2023-2028: Regra de transição por 7 anos, depois 100%
   * - Instalado 2029+: 100% desde o início
   * 
   * CRONOGRAMA GRADUAL (Lei 14.300/2022):
   * 2023: 15% | 2024: 30% | 2025: 45% | 2026: 60% | 2027: 75% | 2028-2031: 90% | 2032+: 100%
   */
  private calcularPercentualFioB(ano_instalacao: number, ano_calculo: number): {
    percentual: number;
    anos_desde_instalacao: number;
    isento: boolean;
    base_legal: string;
    observacoes: string[];
  } {
    const anos_desde_instalacao = ano_calculo - ano_instalacao;
    const observacoes: string[] = [];
    
    // Instalado antes de 2023: isento por 25 anos (Lei 14.300/2022, Art. 26)
    if (ano_instalacao < 2023) {
      const isento = anos_desde_instalacao < 25;
      observacoes.push(`Sistema instalado antes de ${LEI_14300.periodos.transicao.inicio}`);
      observacoes.push(`Período de isenção: 25 anos (até ${ano_instalacao + 25})`);
      
      return {
        percentual: 0,
        anos_desde_instalacao,
        isento,
        base_legal: `${LEI_14300.numero}/${LEI_14300.data.split('-')[0]}, Art. 26`,
        observacoes
      };
    }

    // Instalado em 2023-2028: regra de transição (Lei 14.300/2022)
    if (ano_instalacao >= 2023 && ano_instalacao <= 2028) {
      // Primeiros 7 anos: percentual baseado no cronograma da Lei 14.300
      if (anos_desde_instalacao < 7) {
        const percentual = RegulatoryUtils.getPercentualFioB(ano_instalacao) / 100;
        observacoes.push(`Período de transição: 7 anos com percentual fixo`);
        observacoes.push(`Percentual baseado no ano de instalação: ${ano_instalacao}`);
        
        return {
          percentual,
          anos_desde_instalacao,
          isento: false,
          base_legal: `${LEI_14300.numero}/${LEI_14300.data.split('-')[0]}, Art. 7º`,
          observacoes
        };
      }
      
      // Após 7 anos: 100% (fim do período de transição)
      observacoes.push('Fim do período de transição (7 anos)');
      observacoes.push('Aplicação plena do Fio B');
      
      return {
        percentual: 1.0,
        anos_desde_instalacao,
        isento: false,
        base_legal: `${LEI_14300.numero}/${LEI_14300.data.split('-')[0]}, Art. 7º`,
        observacoes
      };
    }

    // Instalado em 2029 ou depois: 100% desde o início
    observacoes.push('Sistema instalado após período de transição');
    observacoes.push('Aplicação plena do Fio B desde a instalação');
    
    return {
      percentual: 1.0,
      anos_desde_instalacao,
      isento: false,
      base_legal: `${LEI_14300.numero}/${LEI_14300.data.split('-')[0]}, Art. 7º`,
      observacoes
    };
  }

  /**
   * Calcula autoconsumo considerando fator de simultaneidade
   * 
   * CONCEITO:
   * - Fator de simultaneidade: % do consumo que ocorre durante a geração
   * - Autoconsumo = min(geração, consumo_simultâneo)
   * - Consumo simultâneo = consumo_total * fator_simultaneidade
   */
  private calcularAutoconsumo(
    geracao_kwh: number,
    consumo_total_kwh: number,
    fator_simultaneidade: number
  ): {
    autoconsumo_kwh: number;
    consumo_simultaneo_kwh: number;
    energia_excedente_kwh: number;
    consumo_rede_kwh: number;
  } {
    // Consumo que ocorre durante a geração (simultâneo)
    const consumo_simultaneo_kwh = consumo_total_kwh * fator_simultaneidade;
    
    // Autoconsumo é o mínimo entre geração e consumo simultâneo
    const autoconsumo_kwh = Math.min(geracao_kwh, consumo_simultaneo_kwh);
    
    // Energia excedente injetada na rede
    const energia_excedente_kwh = Math.max(0, geracao_kwh - autoconsumo_kwh);
    
    // Consumo restante da rede (após autoconsumo)
    const consumo_rede_kwh = Math.max(0, consumo_total_kwh - autoconsumo_kwh);
    
    return {
      autoconsumo_kwh,
      consumo_simultaneo_kwh,
      energia_excedente_kwh,
      consumo_rede_kwh
    };
  }

  /**
   * Gerencia créditos de energia com validade de 60 meses (FIFO)
   */
  private gerenciarCreditos(
    mes_atual: number,
    creditos_gerados_kwh: number,
    creditos_necessarios_kwh: number
  ): {
    creditos_utilizados_kwh: number;
    creditos_vencidos_kwh: number;
    saldo_creditos_kwh: number;
  } {
    // Adicionar novos créditos
    if (creditos_gerados_kwh > 0) {
      this.creditosEnergia.push({
        valor_kwh: creditos_gerados_kwh,
        mes_geracao: mes_atual,
        mes_vencimento: mes_atual + 60, // 60 meses de validade
        utilizado_kwh: 0
      });
    }

    // Remover créditos vencidos e calcular total vencido
    let creditos_vencidos_kwh = 0;
    this.creditosEnergia = this.creditosEnergia.filter(credito => {
      if (credito.mes_vencimento <= mes_atual) {
        creditos_vencidos_kwh += (credito.valor_kwh - credito.utilizado_kwh);
        return false;
      }
      return true;
    });

    // Utilizar créditos (FIFO - primeiro a entrar, primeiro a sair)
    let creditos_utilizados_kwh = 0;
    let creditos_restantes = creditos_necessarios_kwh;

    // Ordenar por data de geração (FIFO)
    this.creditosEnergia.sort((a, b) => a.mes_geracao - b.mes_geracao);

    for (const credito of this.creditosEnergia) {
      if (creditos_restantes <= 0) break;

      const disponivel = credito.valor_kwh - credito.utilizado_kwh;
      const utilizar = Math.min(disponivel, creditos_restantes);
      
      credito.utilizado_kwh += utilizar;
      creditos_utilizados_kwh += utilizar;
      creditos_restantes -= utilizar;
    }

    // Calcular saldo total de créditos
    const saldo_creditos_kwh = this.creditosEnergia.reduce(
      (total, credito) => total + (credito.valor_kwh - credito.utilizado_kwh),
      0
    );

    return {
      creditos_utilizados_kwh,
      creditos_vencidos_kwh,
      saldo_creditos_kwh
    };
  }

  /**
   * Calcula VPL com validações aprimoradas
   */
  private calcularVPL(fluxos_caixa: number[], taxa_desconto_mensal: number): number {
    if (!fluxos_caixa || fluxos_caixa.length === 0) {
      throw new Error('Fluxos de caixa não podem estar vazios');
    }
    
    if (taxa_desconto_mensal < -0.99) {
      throw new Error('Taxa de desconto não pode ser menor que -99%');
    }
    
    let vpl = 0;
    
    for (let periodo = 0; periodo < fluxos_caixa.length; periodo++) {
      const fluxo = fluxos_caixa[periodo];
      
      if (!Number.isFinite(fluxo)) {
        logWarn('Fluxo de caixa inválido ignorado', {
          service: 'CalculadoraSolarServiceEnhanced',
          periodo,
          fluxo
        });
        continue;
      }
      
      const fator_desconto = Math.pow(1 + taxa_desconto_mensal, periodo);
      
      if (!Number.isFinite(fator_desconto) || fator_desconto === 0) {
        logError('Fator de desconto inválido', 'CalculadoraSolarServiceEnhanced', {
          periodo,
          fator_desconto,
          taxa_desconto_mensal
        });
        continue;
      }
      
      const valor_presente = fluxo / fator_desconto;
      
      if (Number.isFinite(valor_presente)) {
        vpl += valor_presente;
      }
    }
    
    return Number.isFinite(vpl) ? vpl : 0;
  }

  /**
   * Calcula TIR usando Newton-Raphson com múltiplos chutes iniciais
   */
  private calcularTIR(fluxos_caixa: number[]): number {
    if (!fluxos_caixa || fluxos_caixa.length < 2) {
      return 0;
    }
    
    const temPositivo = fluxos_caixa.some(f => f > 0);
    const temNegativo = fluxos_caixa.some(f => f < 0);
    
    if (!temPositivo || !temNegativo) {
      return 0;
    }
    
    const precisao = 0.000001;
    const max_iteracoes = 1000;
    const chutes_iniciais = [0.01, 0.05, 0.1, 0.15, 0.2, 0.3, -0.5];
    
    for (const chute_inicial of chutes_iniciais) {
      let taxa = chute_inicial;
      let melhor_taxa = taxa;
      let menor_vpl = Infinity;
      
      for (let i = 0; i < max_iteracoes; i++) {
        let vpl = 0;
        let derivada = 0;
        
        for (let periodo = 0; periodo < fluxos_caixa.length; periodo++) {
          const fator = Math.pow(1 + taxa, periodo);
          
          if (!Number.isFinite(fator) || fator === 0) {
            break;
          }
          
          vpl += fluxos_caixa[periodo] / fator;
          
          if (periodo > 0) {
            derivada -= (periodo * fluxos_caixa[periodo]) / (fator * (1 + taxa));
          }
        }
        
        // Guardar melhor aproximação
        if (Math.abs(vpl) < Math.abs(menor_vpl)) {
          menor_vpl = vpl;
          melhor_taxa = taxa;
        }
        
        if (Math.abs(vpl) < precisao) {
          return taxa * 100;
        }
        
        if (Math.abs(derivada) < precisao) {
          break;
        }
        
        const nova_taxa = taxa - (vpl / derivada);
        taxa = Math.max(-0.99, Math.min(5.0, nova_taxa));
        
        if (Math.abs(nova_taxa - taxa) < precisao) {
          break;
        }
      }
      
      if (Number.isFinite(melhor_taxa) && melhor_taxa > -0.99 && melhor_taxa < 5.0) {
        return melhor_taxa * 100;
      }
    }
    
    return 0;
  }

  /**
   * Calcula payback simples e descontado com interpolação
   */
  private calcularPayback(
    investimento_inicial: number,
    fluxos_caixa_mensais: number[],
    taxa_desconto_mensal: number
  ): { payback_simples: number; payback_descontado: number } {
    if (investimento_inicial <= 0) {
      throw new Error('Investimento inicial deve ser positivo');
    }
    
    let acumulado_simples = 0;
    let acumulado_descontado = 0;
    let payback_simples = 0;
    let payback_descontado = 0;

    for (let mes = 0; mes < fluxos_caixa_mensais.length; mes++) {
      const fluxo = fluxos_caixa_mensais[mes];
      
      if (!Number.isFinite(fluxo)) {
        continue;
      }
      
      // Payback simples com interpolação
      acumulado_simples += fluxo;
      if (payback_simples === 0 && acumulado_simples >= investimento_inicial) {
        const fluxo_anterior = acumulado_simples - fluxo;
        const fracao_mes = (investimento_inicial - fluxo_anterior) / fluxo;
        payback_simples = (mes + fracao_mes) / 12;
      }

      // Payback descontado com interpolação
      const fator_desconto = Math.pow(1 + taxa_desconto_mensal, mes);
      const fluxo_descontado = fluxo / fator_desconto;
      acumulado_descontado += fluxo_descontado;
      
      if (payback_descontado === 0 && acumulado_descontado >= investimento_inicial) {
        const acumulado_anterior = acumulado_descontado - fluxo_descontado;
        const fracao_mes = (investimento_inicial - acumulado_anterior) / fluxo_descontado;
        payback_descontado = (mes + fracao_mes) / 12;
      }

      if (payback_simples > 0 && payback_descontado > 0) {
        break;
      }
    }

    return {
      payback_simples: payback_simples || 999,
      payback_descontado: payback_descontado || 999
    };
  }

  /**
   * Método principal aprimorado para calcular economia e fluxo de caixa
   */
  public async calcularEconomiaFluxoCaixaEnhanced(
    parametros: ParametrosSistemaEnhanced
  ): Promise<ResultadoFinanceiroEnhanced> {
    // Buscar tarifa da concessionária
    const concessionaria = await this.tarifaService.getTarifa(parametros.concessionaria_id);
    if (!concessionaria) {
      throw new Error(`Concessionária ${parametros.concessionaria_id} não encontrada`);
    }

    // Limpar créditos anteriores
    this.creditosEnergia = [];

    const tabela_mensal: TabelaMensal[] = [];
    const fluxos_caixa: number[] = [-parametros.custo_sistema];
    
    // Taxas mensais
    const taxa_desconto_mensal = parametros.taxa_desconto_anual / 12;
    const inflacao_mensal = parametros.inflacao_anual / 12;
    const incremento_consumo_mensal = parametros.incremento_consumo_anual / 12;
    const reajuste_tarifario_mensal = parametros.reajuste_tarifario_anual / 12;
    const depreciacao_mensal = parametros.depreciacao_anual_fv / 12;

    // Custo de disponibilidade
    const custo_disponibilidade = this.tarifaService.getCustoDisponibilidade(
      parametros.tipo_ligacao,
      concessionaria
    );

    let economia_acumulada = 0;
    let fluxo_caixa_acumulado = -parametros.custo_sistema;
    let geracao_total = 0;
    let autoconsumo_total = 0;
    let energia_injetada_total = 0;

    for (let ano = 0; ano < parametros.periodo_projecao_anos; ano++) {
      for (let mes = 0; mes < 12; mes++) {
        const mes_absoluto = ano * 12 + mes + 1;
        const ano_calculo = parametros.ano_instalacao + ano;

        // Consumo com incremento
        const fator_incremento = Math.pow(1 + incremento_consumo_mensal, mes_absoluto - 1);
        const consumo_total_kwh = parametros.consumo_mensal_kwh * fator_incremento;
        
        // Divisão do consumo por período
        const consumo_diurno_kwh = consumo_total_kwh * (parametros.perfil_consumo_diurno || 0.3);
        const consumo_noturno_kwh = consumo_total_kwh - consumo_diurno_kwh;

        // Geração com depreciação e perdas
        const fator_depreciacao = Math.pow(1 - depreciacao_mensal, mes_absoluto - 1);
        const geracao_bruta_kwh = (parametros.geracao_anual_kwh / 12) * fator_depreciacao;
        const geracao_liquida_kwh = geracao_bruta_kwh * 
          (1 - (parametros.perdas_sistema || 0.15)) * 
          (parametros.eficiencia_inversor || 0.97);

        // Autoconsumo com fator de simultaneidade
        const { 
          autoconsumo_kwh, 
          energia_excedente_kwh, 
          consumo_rede_kwh 
        } = this.calcularAutoconsumo(
          geracao_liquida_kwh,
          consumo_total_kwh,
          parametros.fator_simultaneidade
        );

        // Gestão de créditos
        const { 
          creditos_utilizados_kwh, 
          creditos_vencidos_kwh, 
          saldo_creditos_kwh 
        } = this.gerenciarCreditos(
          mes_absoluto,
          energia_excedente_kwh,
          consumo_rede_kwh
        );

        // Energia fornecida pela concessionária (diferente de excedente)
        const energia_fornecida_kwh = Math.max(0, consumo_rede_kwh - creditos_utilizados_kwh);
        const consumo_rede_liquido_kwh = Math.max(energia_fornecida_kwh, custo_disponibilidade);

        // Cálculo das tarifas com reajuste
        const fator_reajuste = Math.pow(1 + reajuste_tarifario_mensal, mes_absoluto - 1);
        
        const calculo_sem_fv = this.tarifaService.calcularTarifaFinal(
          consumo_total_kwh,
          concessionaria,
          true
        );
        const tarifa_sem_fv = calculo_sem_fv.tarifa_sem_fv * fator_reajuste;
        
        const calculo_com_fv = this.tarifaService.calcularTarifaFinal(
          consumo_rede_liquido_kwh,
          concessionaria,
          false
        );
        const tarifa_com_fv = calculo_com_fv.tarifa_com_fv * fator_reajuste;

        // Custos
        const custo_sem_fv = consumo_total_kwh * tarifa_sem_fv;
        let custo_com_fv = consumo_rede_liquido_kwh * tarifa_com_fv;

        // Lei 14.300 (Fio B)
        const fio_b_info = this.calcularPercentualFioB(parametros.ano_instalacao, ano_calculo);
        const custo_fio_b = energia_excedente_kwh * 
          concessionaria.tusd_fio_b * 
          fio_b_info.percentual * 
          fator_reajuste;
        custo_com_fv += custo_fio_b;

        // Custo de O&M
        const custo_om = (parametros.custo_om_anual / 12) * 
          Math.pow(1 + inflacao_mensal, mes_absoluto - 1);
        custo_com_fv += custo_om;

        // Economia e fluxo de caixa
        const economia_mensal = custo_sem_fv - custo_com_fv;
        economia_acumulada += economia_mensal;
        fluxo_caixa_acumulado += economia_mensal;
        fluxos_caixa.push(economia_mensal);

        // Acumuladores
        geracao_total += geracao_liquida_kwh;
        autoconsumo_total += autoconsumo_kwh;
        energia_injetada_total += energia_excedente_kwh;

        // Criar entrada na tabela mensal
        tabela_mensal.push({
          mes_absoluto,
          mes: mes + 1,
          ano: ano_calculo,
          consumo_total_kwh,
          consumo_diurno_kwh,
          consumo_noturno_kwh,
          geracao_bruta_kwh,
          geracao_liquida_kwh,
          autoconsumo_instantaneo_kwh: autoconsumo_kwh,
          energia_excedente_kwh,
          energia_fornecida_kwh,
          consumo_rede_liquido_kwh,
          creditos_gerados_kwh: energia_excedente_kwh,
          creditos_utilizados_kwh,
          creditos_vencidos_kwh,
          saldo_creditos_kwh,
          tarifa_sem_fv_rs_kwh: tarifa_sem_fv,
          tarifa_com_fv_rs_kwh: tarifa_com_fv,
          custo_sem_fv_rs: custo_sem_fv,
          custo_com_fv_rs: custo_com_fv,
          custo_disponibilidade_rs: custo_disponibilidade,
          custo_fio_b_rs: custo_fio_b,
          custo_om_rs: custo_om,
          economia_mensal_rs: economia_mensal,
          economia_acumulada_rs: economia_acumulada,
          fluxo_caixa_mensal_rs: economia_mensal,
          fluxo_caixa_acumulado_rs: fluxo_caixa_acumulado,
          percentual_fio_b: fio_b_info.percentual,
          anos_desde_instalacao: fio_b_info.anos_desde_instalacao,
          isento_fio_b: fio_b_info.isento
        });
      }
    }

    // Calcular indicadores financeiros
    const vpl = this.calcularVPL(fluxos_caixa, taxa_desconto_mensal);
    const tir = this.calcularTIR(fluxos_caixa);
    const { payback_simples, payback_descontado } = this.calcularPayback(
      parametros.custo_sistema,
      fluxos_caixa.slice(1),
      taxa_desconto_mensal
    );

    // ROI de 25 anos
    const roi_25_anos = (economia_acumulada / parametros.custo_sistema) * 100;

    // Resumo anual
    const resumo_anual = [];
    for (let ano = 0; ano < parametros.periodo_projecao_anos; ano++) {
      const inicio_ano = ano * 12;
      const fim_ano = (ano + 1) * 12;
      const dados_ano = tabela_mensal.slice(inicio_ano, fim_ano);
      
      resumo_anual.push({
        ano: parametros.ano_instalacao + ano,
        economia_anual: dados_ano.reduce((sum, d) => sum + d.economia_mensal_rs, 0),
        geracao_anual: dados_ano.reduce((sum, d) => sum + d.geracao_liquida_kwh, 0),
        autoconsumo_anual: dados_ano.reduce((sum, d) => sum + d.autoconsumo_instantaneo_kwh, 0),
        injecao_anual: dados_ano.reduce((sum, d) => sum + d.energia_excedente_kwh, 0),
        creditos_utilizados_anual: dados_ano.reduce((sum, d) => sum + d.creditos_utilizados_kwh, 0),
        custo_fio_b_anual: dados_ano.reduce((sum, d) => sum + d.custo_fio_b_rs, 0),
        fluxo_caixa_acumulado: dados_ano[dados_ano.length - 1]?.fluxo_caixa_acumulado_rs || 0
      });
    }

    // Cálculos de sustentabilidade
    const reducao_co2_kg = geracao_total * 0.0817; // kg CO2/kWh (fator Brasil)
    const arvores_equivalentes = reducao_co2_kg / 22; // 22kg CO2/árvore/ano

    // Créditos não utilizados
    const creditos_nao_utilizados = this.creditosEnergia.reduce(
      (total, credito) => total + (credito.valor_kwh - credito.utilizado_kwh),
      0
    );

    return {
      investimento_inicial: parametros.custo_sistema,
      vpl,
      tir,
      payback_simples_anos: payback_simples,
      payback_descontado_anos: payback_descontado,
      roi_25_anos,
      economia_total_25_anos: economia_acumulada,
      economia_primeiro_ano: resumo_anual[0]?.economia_anual || 0,
      economia_media_anual: economia_acumulada / parametros.periodo_projecao_anos,
      economia_acumulada_10_anos: tabela_mensal
        .slice(0, 120)
        .reduce((sum, d) => sum + d.economia_mensal_rs, 0),
      geracao_total_25_anos: geracao_total,
      autoconsumo_total_25_anos: autoconsumo_total,
      energia_injetada_total_25_anos: energia_injetada_total,
      creditos_nao_utilizados_25_anos: creditos_nao_utilizados,
      reducao_co2_kg,
      arvores_equivalentes,
      tabela_mensal,
      resumo_anual
    };
  }

  /**
   * Simulação rápida aprimorada
   */
  public async simulacaoRapidaEnhanced(
    consumo_mensal: number,
    potencia_sistema: number,
    custo_sistema: number,
    fator_simultaneidade: number = 0.3,
    concessionaria_id: string = 'enel-rj'
  ): Promise<{
    economia_mensal_estimada: number;
    economia_anual_estimada: number;
    payback_estimado_anos: number;
    percentual_economia: number;
    autoconsumo_estimado_kwh: number;
    energia_excedente_estimada_kwh: number;
    custo_fio_b_estimado: number;
  }> {
    const concessionaria = await this.tarifaService.getTarifa(concessionaria_id);
    if (!concessionaria) {
      throw new Error(`Concessionária ${concessionaria_id} não encontrada`);
    }

    // Estimativas
    const hsp_medio = 5.3; // HSP médio do RJ
    const pr_estimado = 0.75;
    const geracao_mensal = (potencia_sistema * hsp_medio * 30 * pr_estimado) / 1000;
    
    // Autoconsumo com fator de simultaneidade
    const autoconsumo_estimado = Math.min(geracao_mensal, consumo_mensal * fator_simultaneidade);
    const energia_excedente = Math.max(0, geracao_mensal - autoconsumo_estimado);
    
    const tarifa_media = this.tarifaService.calcularTarifaFinal(
      consumo_mensal,
      concessionaria
    ).tarifa_sem_fv;
    
    // Economia considerando autoconsumo
    const economia_autoconsumo = autoconsumo_estimado * tarifa_media;
    const economia_injecao = energia_excedente * tarifa_media * 0.95; // 95% de aproveitamento dos créditos
    
    // Custo do Fio B (estimativa com 30% para 2024)
    const custo_fio_b_estimado = energia_excedente * concessionaria.tusd_fio_b * 0.3;
    
    const economia_mensal = economia_autoconsumo + economia_injecao - custo_fio_b_estimado;
    const economia_anual = economia_mensal * 12;
    const payback_estimado = custo_sistema / economia_anual;
    const percentual_economia = (economia_mensal / (consumo_mensal * tarifa_media)) * 100;

    return {
      economia_mensal_estimada: economia_mensal,
      economia_anual_estimada: economia_anual,
      payback_estimado_anos: payback_estimado,
      percentual_economia,
      autoconsumo_estimado_kwh: autoconsumo_estimado,
      energia_excedente_estimada_kwh: energia_excedente,
      custo_fio_b_estimado
    };
  }

  /**
   * Exporta tabela mensal para análise externa
   */
  public exportarTabelaMensal(tabela: TabelaMensal[]): string {
    const headers = [
      'Mês Absoluto', 'Mês', 'Ano', 'Consumo Total (kWh)', 'Geração Líquida (kWh)',
      'Autoconsumo (kWh)', 'Energia Excedente (kWh)', 'Energia Fornecida (kWh)',
      'Créditos Utilizados (kWh)', 'Saldo Créditos (kWh)', 'Custo sem FV (R$)',
      'Custo com FV (R$)', 'Custo Fio B (R$)', 'Economia Mensal (R$)',
      'Economia Acumulada (R$)', 'Percentual Fio B (%)', 'Isento Fio B'
    ];

    const rows = tabela.map(linha => [
      linha.mes_absoluto,
      linha.mes,
      linha.ano,
      linha.consumo_total_kwh.toFixed(2),
      linha.geracao_liquida_kwh.toFixed(2),
      linha.autoconsumo_instantaneo_kwh.toFixed(2),
      linha.energia_excedente_kwh.toFixed(2),
      linha.energia_fornecida_kwh.toFixed(2),
      linha.creditos_utilizados_kwh.toFixed(2),
      linha.saldo_creditos_kwh.toFixed(2),
      linha.custo_sem_fv_rs.toFixed(2),
      linha.custo_com_fv_rs.toFixed(2),
      linha.custo_fio_b_rs.toFixed(2),
      linha.economia_mensal_rs.toFixed(2),
      linha.economia_acumulada_rs.toFixed(2),
      (linha.percentual_fio_b * 100).toFixed(1),
      linha.isento_fio_b ? 'Sim' : 'Não'
    ]);

    return [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');
  }
}

export default CalculadoraSolarServiceEnhanced;