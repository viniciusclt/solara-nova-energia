/**
 * Serviço de Análise de Sensibilidade para o Módulo Fotovoltaico
 * 
 * Permite análise de como variações nos parâmetros de entrada afetam
 * os indicadores financeiros (VPL, TIR, Payback)
 */

import { CalculadoraSolarService, ParametrosSistema, ResultadoFinanceiro } from './CalculadoraSolarService';
import { CacheService } from './CacheService';
import { logInfo, logError } from '@/utils/secureLogger';

export interface ParametroVariacao {
  nome: string;
  valorBase: number;
  variacaoMin: number; // Percentual de variação mínima (ex: -20 para -20%)
  variacaoMax: number; // Percentual de variação máxima (ex: +30 para +30%)
  passos: number; // Número de passos na análise
}

export interface ResultadoSensibilidade {
  parametro: string;
  valores: number[];
  vpls: number[];
  tirs: number[];
  paybacks: number[];
  economias: number[];
}

export interface AnaliseCompleta {
  parametrosBase: ParametrosSistema;
  resultadoBase: ResultadoFinanceiro;
  analises: ResultadoSensibilidade[];
  resumo: {
    parametroMaisSensivel: string;
    impactoVPL: { min: number; max: number };
    impactoTIR: { min: number; max: number };
    impactoPayback: { min: number; max: number };
  };
}

export class SensitivityAnalysisService {
  private calculadoraService: CalculadoraSolarService;

  constructor() {
    this.calculadoraService = CalculadoraSolarService.getInstance();
  }

  /**
   * Executa análise de sensibilidade para um parâmetro específico
   */
  public async analisarParametro(
    parametrosBase: ParametrosSistema,
    variacao: ParametroVariacao
  ): Promise<ResultadoSensibilidade> {
    const valores: number[] = [];
    const vpls: number[] = [];
    const tirs: number[] = [];
    const paybacks: number[] = [];
    const economias: number[] = [];

    // Calcular valores para análise
    const incremento = (variacao.variacaoMax - variacao.variacaoMin) / (variacao.passos - 1);
    
    for (let i = 0; i < variacao.passos; i++) {
      const percentualVariacao = variacao.variacaoMin + (i * incremento);
      const fatorVariacao = 1 + (percentualVariacao / 100);
      const valorVariado = variacao.valorBase * fatorVariacao;
      
      valores.push(valorVariado);
      
      try {
        // Criar parâmetros modificados
        const parametrosModificados = this.aplicarVariacao(
          parametrosBase,
          variacao.nome,
          valorVariado
        );
        
        // Calcular resultado
        const resultado = await this.calculadoraService.calcularEconomiaFluxoCaixa(
          parametrosModificados
        );
        
        vpls.push(resultado.vpl);
        tirs.push(resultado.tir);
        paybacks.push(resultado.payback_simples_anos);
        economias.push(resultado.economia_total_25_anos);
        
      } catch (error) {
        logError('Erro na análise de sensibilidade', 'SensitivityAnalysisService', { error: error instanceof Error ? error.message : String(error) });
        
        // Usar valores padrão em caso de erro
        vpls.push(0);
        tirs.push(0);
        paybacks.push(999);
        economias.push(0);
      }
    }

    return {
      parametro: variacao.nome,
      valores,
      vpls,
      tirs,
      paybacks,
      economias
    };
  }

  /**
   * Executa análise de sensibilidade completa para múltiplos parâmetros
   */
  public async analisarMultiplosParametros(
    parametrosBase: ParametrosSistema,
    variacoes: ParametroVariacao[]
  ): Promise<AnaliseCompleta> {
    logInfo('Iniciando análise de sensibilidade completa', {
      service: 'SensitivityAnalysisService',
      parametros: variacoes.map(v => v.nome)
    });

    // Calcular resultado base
    const resultadoBase = await this.calculadoraService.calcularEconomiaFluxoCaixa(
      parametrosBase
    );

    // Executar análises para cada parâmetro
    const analises: ResultadoSensibilidade[] = [];
    
    for (const variacao of variacoes) {
      const analise = await this.analisarParametro(parametrosBase, variacao);
      analises.push(analise);
    }

    // Calcular resumo da análise
    const resumo = this.calcularResumo(analises, resultadoBase);

    return {
      parametrosBase,
      resultadoBase,
      analises,
      resumo
    };
  }

  /**
   * Análise de sensibilidade padrão com parâmetros mais comuns
   */
  public async analisePadrao(
    parametrosBase: ParametrosSistema
  ): Promise<AnaliseCompleta> {
    const variacoesPadrao: ParametroVariacao[] = [
      {
        nome: 'custo_sistema',
        valorBase: parametrosBase.custo_sistema,
        variacaoMin: -30,
        variacaoMax: 50,
        passos: 11
      },
      {
        nome: 'geracao_anual_kwh',
        valorBase: parametrosBase.geracao_anual_kwh,
        variacaoMin: -25,
        variacaoMax: 25,
        passos: 11
      },
      {
        nome: 'consumo_mensal_kwh',
        valorBase: parametrosBase.consumo_mensal_kwh,
        variacaoMin: -40,
        variacaoMax: 60,
        passos: 11
      },
      {
        nome: 'taxa_desconto_anual',
        valorBase: parametrosBase.taxa_desconto_anual * 100, // Converter para %
        variacaoMin: -50,
        variacaoMax: 100,
        passos: 11
      },
      {
        nome: 'reajuste_tarifario_anual',
        valorBase: parametrosBase.reajuste_tarifario_anual * 100, // Converter para %
        variacaoMin: -50,
        variacaoMax: 100,
        passos: 11
      }
    ];

    return this.analisarMultiplosParametros(parametrosBase, variacoesPadrao);
  }

  /**
   * Análise de cenários (otimista, pessimista, realista)
   */
  public async analiseCenarios(
    parametrosBase: ParametrosSistema
  ): Promise<{
    cenarioOtimista: ResultadoFinanceiro;
    cenarioPessimista: ResultadoFinanceiro;
    cenarioRealista: ResultadoFinanceiro;
  }> {
    // Cenário Otimista
    const parametrosOtimista = {
      ...parametrosBase,
      custo_sistema: parametrosBase.custo_sistema * 0.85, // 15% menor
      geracao_anual_kwh: parametrosBase.geracao_anual_kwh * 1.15, // 15% maior
      reajuste_tarifario_anual: parametrosBase.reajuste_tarifario_anual * 1.3, // 30% maior
      depreciacao_anual_fv: parametrosBase.depreciacao_anual_fv * 0.7, // 30% menor
      custo_om_anual: parametrosBase.custo_om_anual * 0.8 // 20% menor
    };

    // Cenário Pessimista
    const parametrosPessimista = {
      ...parametrosBase,
      custo_sistema: parametrosBase.custo_sistema * 1.25, // 25% maior
      geracao_anual_kwh: parametrosBase.geracao_anual_kwh * 0.85, // 15% menor
      reajuste_tarifario_anual: parametrosBase.reajuste_tarifario_anual * 0.7, // 30% menor
      depreciacao_anual_fv: parametrosBase.depreciacao_anual_fv * 1.5, // 50% maior
      custo_om_anual: parametrosBase.custo_om_anual * 1.5 // 50% maior
    };

    // Cenário Realista (base)
    const parametrosRealista = parametrosBase;

    const [cenarioOtimista, cenarioPessimista, cenarioRealista] = await Promise.all([
      this.calculadoraService.calcularEconomiaFluxoCaixa(parametrosOtimista),
      this.calculadoraService.calcularEconomiaFluxoCaixa(parametrosPessimista),
      this.calculadoraService.calcularEconomiaFluxoCaixa(parametrosRealista)
    ]);

    return {
      cenarioOtimista,
      cenarioPessimista,
      cenarioRealista
    };
  }

  /**
   * Aplica variação a um parâmetro específico
   */
  private aplicarVariacao(
    parametros: ParametrosSistema,
    nomeParametro: string,
    novoValor: number
  ): ParametrosSistema {
    const parametrosModificados = { ...parametros };
    
    switch (nomeParametro) {
      case 'custo_sistema':
        parametrosModificados.custo_sistema = novoValor;
        break;
      case 'geracao_anual_kwh':
        parametrosModificados.geracao_anual_kwh = novoValor;
        break;
      case 'consumo_mensal_kwh':
        parametrosModificados.consumo_mensal_kwh = novoValor;
        break;
      case 'taxa_desconto_anual':
        parametrosModificados.taxa_desconto_anual = novoValor / 100; // Converter de % para decimal
        break;
      case 'reajuste_tarifario_anual':
        parametrosModificados.reajuste_tarifario_anual = novoValor / 100; // Converter de % para decimal
        break;
      case 'inflacao_anual':
        parametrosModificados.inflacao_anual = novoValor / 100;
        break;
      case 'depreciacao_anual_fv':
        parametrosModificados.depreciacao_anual_fv = novoValor / 100;
        break;
      case 'custo_om_anual':
        parametrosModificados.custo_om_anual = novoValor;
        break;
      case 'fator_simultaneidade':
        parametrosModificados.fator_simultaneidade = Math.min(1, Math.max(0, novoValor / 100));
        break;
      default:
        throw new Error(`Parâmetro ${nomeParametro} não suportado para análise de sensibilidade`);
    }
    
    return parametrosModificados;
  }

  /**
   * Calcula resumo da análise de sensibilidade
   */
  private calcularResumo(
    analises: ResultadoSensibilidade[],
    resultadoBase: ResultadoFinanceiro
  ): AnaliseCompleta['resumo'] {
    let parametroMaisSensivel = '';
    let maiorVariacaoVPL = 0;
    
    let minVPL = Infinity;
    let maxVPL = -Infinity;
    let minTIR = Infinity;
    let maxTIR = -Infinity;
    let minPayback = Infinity;
    let maxPayback = -Infinity;

    for (const analise of analises) {
      // Calcular variação do VPL para este parâmetro
      const vpls = analise.vpls.filter(v => Number.isFinite(v));
      if (vpls.length > 0) {
        const minVPLParam = Math.min(...vpls);
        const maxVPLParam = Math.max(...vpls);
        const variacaoVPL = Math.abs(maxVPLParam - minVPLParam);
        
        if (variacaoVPL > maiorVariacaoVPL) {
          maiorVariacaoVPL = variacaoVPL;
          parametroMaisSensivel = analise.parametro;
        }
        
        minVPL = Math.min(minVPL, minVPLParam);
        maxVPL = Math.max(maxVPL, maxVPLParam);
      }
      
      // Atualizar extremos de TIR
      const tirs = analise.tirs.filter(t => Number.isFinite(t) && t > 0);
      if (tirs.length > 0) {
        minTIR = Math.min(minTIR, ...tirs);
        maxTIR = Math.max(maxTIR, ...tirs);
      }
      
      // Atualizar extremos de Payback
      const paybacks = analise.paybacks.filter(p => Number.isFinite(p) && p < 999);
      if (paybacks.length > 0) {
        minPayback = Math.min(minPayback, ...paybacks);
        maxPayback = Math.max(maxPayback, ...paybacks);
      }
    }

    return {
      parametroMaisSensivel,
      impactoVPL: {
        min: Number.isFinite(minVPL) ? minVPL : 0,
        max: Number.isFinite(maxVPL) ? maxVPL : 0
      },
      impactoTIR: {
        min: Number.isFinite(minTIR) ? minTIR : 0,
        max: Number.isFinite(maxTIR) ? maxTIR : 0
      },
      impactoPayback: {
        min: Number.isFinite(minPayback) ? minPayback : 0,
        max: Number.isFinite(maxPayback) ? maxPayback : 999
      }
    };
  }

  /**
   * Exporta resultados da análise de sensibilidade para CSV
   */
  public exportarCSV(analise: AnaliseCompleta): string {
    const linhas: string[] = [];
    
    // Cabeçalho
    linhas.push('Parâmetro,Valor,VPL,TIR,Payback,Economia Total');
    
    // Dados
    for (const resultado of analise.analises) {
      for (let i = 0; i < resultado.valores.length; i++) {
        linhas.push([
          resultado.parametro,
          resultado.valores[i].toFixed(2),
          resultado.vpls[i].toFixed(2),
          resultado.tirs[i].toFixed(2),
          resultado.paybacks[i].toFixed(2),
          resultado.economias[i].toFixed(2)
        ].join(','));
      }
    }
    
    return linhas.join('\n');
  }
}

export default SensitivityAnalysisService;