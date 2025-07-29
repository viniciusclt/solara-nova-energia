import { TarifaService, TarifaConcessionaria, CalculoTarifa } from './TarifaService';

// Interfaces para os cálculos
export interface ParametrosSistema {
  custo_sistema: number;
  potencia_sistema_kwp: number;
  geracao_anual_kwh: number;
  consumo_mensal_kwh: number;
  incremento_consumo_anual: number; // %
  fator_simultaneidade: number; // % (0.3 = 30%)
  concessionaria_id: string;
  tipo_ligacao: 'monofasico' | 'bifasico' | 'trifasico';
  ano_instalacao: number;
  periodo_projecao_anos: number;
  inflacao_anual: number; // %
  taxa_desconto_anual: number; // %
  depreciacao_anual_fv: number; // %
  custo_om_anual: number; // R$/ano
  reajuste_tarifario_anual: number; // %
}

export interface ResultadoMensal {
  mes: number;
  ano: number;
  consumo_kwh: number;
  geracao_kwh: number;
  autoconsumo_kwh: number;
  injecao_kwh: number;
  consumo_rede_kwh: number;
  creditos_gerados: number;
  creditos_utilizados: number;
  saldo_creditos: number;
  custo_sem_fv: number;
  custo_com_fv: number;
  economia_mensal: number;
  custo_fio_b: number;
  custo_disponibilidade: number;
  percentual_fio_b: number;
}

export interface ResultadoFinanceiro {
  investimento_inicial: number;
  economia_total_25_anos: number;
  vpl: number;
  tir: number; // %
  payback_simples_anos: number;
  payback_descontado_anos: number;
  economia_primeiro_ano: number;
  economia_media_anual: number;
  resultados_mensais: ResultadoMensal[];
  resumo_anual: Array<{
    ano: number;
    economia_anual: number;
    fluxo_caixa_acumulado: number;
    consumo_total: number;
    geracao_total: number;
    autoconsumo_total: number;
    injecao_total: number;
  }>;
}

export class CalculadoraSolarService {
  private tarifaService: TarifaService;
  private creditosEnergia: Map<string, { valor: number; mes_vencimento: number }> = new Map();

  constructor() {
    this.tarifaService = TarifaService.getInstance();
  }

  /**
   * Calcula o percentual do Fio B conforme Lei 14.300
   * Regra de transição: 15% (2023), 30% (2024), 45% (2025), 60% (2026), 75% (2027), 90% (2028), 100% (2029+)
   */
  private getPercentualFioB(ano_instalacao: number, ano_calculo: number): number {
    // Se instalado antes de 2023, isento por 25 anos
    if (ano_instalacao < 2023) {
      return 0;
    }

    // Se instalado em 2023-2028, segue regra de transição
    if (ano_instalacao >= 2023 && ano_instalacao <= 2028) {
      const anos_desde_instalacao = ano_calculo - ano_instalacao;
      
      // Primeiros 7 anos: regra de transição baseada no ano de instalação
      if (anos_desde_instalacao < 7) {
        const percentuais_por_ano_instalacao: Record<number, number> = {
          2023: 0.15,
          2024: 0.30,
          2025: 0.45,
          2026: 0.60,
          2027: 0.75,
          2028: 0.90
        };
        return percentuais_por_ano_instalacao[ano_instalacao] || 1.0;
      }
      
      // Após 7 anos: 100%
      return 1.0;
    }

    // Se instalado em 2029 ou depois: 100% desde o início
    return 1.0;
  }

  /**
   * Gerencia créditos de energia (validade de 60 meses)
   */
  private gerenciarCreditos(
    mes_atual: number,
    creditos_gerados: number,
    creditos_necessarios: number
  ): { creditos_utilizados: number; saldo_creditos: number } {
    // Adicionar novos créditos
    if (creditos_gerados > 0) {
      const chave_credito = `${mes_atual}`;
      const mes_vencimento = mes_atual + 60; // 60 meses de validade
      this.creditosEnergia.set(chave_credito, {
        valor: creditos_gerados,
        mes_vencimento
      });
    }

    // Remover créditos vencidos
    for (const [chave, credito] of this.creditosEnergia.entries()) {
      if (credito.mes_vencimento <= mes_atual) {
        this.creditosEnergia.delete(chave);
      }
    }

    // Utilizar créditos (FIFO - primeiro a entrar, primeiro a sair)
    let creditos_utilizados = 0;
    let creditos_restantes = creditos_necessarios;

    const creditosOrdenados = Array.from(this.creditosEnergia.entries())
      .sort(([a], [b]) => parseInt(a) - parseInt(b));

    for (const [chave, credito] of creditosOrdenados) {
      if (creditos_restantes <= 0) break;

      const utilizar = Math.min(credito.valor, creditos_restantes);
      creditos_utilizados += utilizar;
      creditos_restantes -= utilizar;
      credito.valor -= utilizar;

      if (credito.valor <= 0) {
        this.creditosEnergia.delete(chave);
      }
    }

    // Calcular saldo total de créditos
    const saldo_creditos = Array.from(this.creditosEnergia.values())
      .reduce((total, credito) => total + credito.valor, 0);

    return { creditos_utilizados, saldo_creditos };
  }

  /**
   * Calcula VPL (Valor Presente Líquido)
   */
  private calcularVPL(fluxos_caixa: number[], taxa_desconto: number): number {
    return fluxos_caixa.reduce((vpl, fluxo, periodo) => {
      return vpl + (fluxo / Math.pow(1 + taxa_desconto, periodo));
    }, 0);
  }

  /**
   * Calcula TIR (Taxa Interna de Retorno) usando método de Newton-Raphson
   */
  private calcularTIR(fluxos_caixa: number[]): number {
    let taxa = 0.1; // Chute inicial de 10%
    const precisao = 0.0001;
    const max_iteracoes = 100;

    for (let i = 0; i < max_iteracoes; i++) {
      let vpl = 0;
      let derivada = 0;

      for (let periodo = 0; periodo < fluxos_caixa.length; periodo++) {
        const fator = Math.pow(1 + taxa, periodo);
        vpl += fluxos_caixa[periodo] / fator;
        derivada -= (periodo * fluxos_caixa[periodo]) / (fator * (1 + taxa));
      }

      if (Math.abs(vpl) < precisao) {
        return taxa * 100; // Retorna em %
      }

      if (Math.abs(derivada) < precisao) {
        break; // Evita divisão por zero
      }

      taxa = taxa - vpl / derivada;

      if (taxa < -0.99) taxa = -0.99; // Limita taxa mínima
      if (taxa > 10) taxa = 10; // Limita taxa máxima
    }

    return taxa * 100; // Retorna em %
  }

  /**
   * Calcula payback simples e descontado
   */
  private calcularPayback(
    investimento_inicial: number,
    fluxos_caixa_mensais: number[],
    taxa_desconto_mensal: number
  ): { payback_simples: number; payback_descontado: number } {
    let acumulado_simples = 0;
    let acumulado_descontado = 0;
    let payback_simples = 0;
    let payback_descontado = 0;

    for (let mes = 0; mes < fluxos_caixa_mensais.length; mes++) {
      const fluxo = fluxos_caixa_mensais[mes];
      
      // Payback simples
      acumulado_simples += fluxo;
      if (payback_simples === 0 && acumulado_simples >= investimento_inicial) {
        payback_simples = mes / 12; // Converte para anos
      }

      // Payback descontado
      const fluxo_descontado = fluxo / Math.pow(1 + taxa_desconto_mensal, mes);
      acumulado_descontado += fluxo_descontado;
      if (payback_descontado === 0 && acumulado_descontado >= investimento_inicial) {
        payback_descontado = mes / 12; // Converte para anos
      }

      if (payback_simples > 0 && payback_descontado > 0) {
        break;
      }
    }

    return {
      payback_simples: payback_simples || 999, // Se não encontrar, retorna valor alto
      payback_descontado: payback_descontado || 999
    };
  }

  /**
   * Método principal para calcular economia e fluxo de caixa
   */
  public async calcularEconomiaFluxoCaixa(parametros: ParametrosSistema): Promise<ResultadoFinanceiro> {
    // Buscar tarifa da concessionária
    const concessionaria = await this.tarifaService.getTarifa(parametros.concessionaria_id);
    if (!concessionaria) {
      throw new Error(`Concessionária ${parametros.concessionaria_id} não encontrada`);
    }

    // Limpar créditos anteriores
    this.creditosEnergia.clear();

    const resultados_mensais: ResultadoMensal[] = [];
    const fluxos_caixa: number[] = [-parametros.custo_sistema]; // Investimento inicial negativo
    
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

    let economia_total = 0;
    let mes_absoluto = 0;

    for (let ano = 0; ano < parametros.periodo_projecao_anos; ano++) {
      for (let mes = 0; mes < 12; mes++) {
        mes_absoluto++;
        const ano_calculo = parametros.ano_instalacao + ano;

        // Consumo com incremento
        const fator_incremento = Math.pow(1 + incremento_consumo_mensal, mes_absoluto);
        const consumo_mensal = parametros.consumo_mensal_kwh * fator_incremento;

        // Geração com depreciação
        const fator_depreciacao = Math.pow(1 - depreciacao_mensal, mes_absoluto);
        const geracao_mensal = (parametros.geracao_anual_kwh / 12) * fator_depreciacao;

        // Autoconsumo (energia consumida instantaneamente)
        const autoconsumo = Math.min(
          geracao_mensal * parametros.fator_simultaneidade,
          consumo_mensal
        );

        // Energia injetada na rede
        const injecao = Math.max(0, geracao_mensal - autoconsumo);

        // Energia consumida da rede (após autoconsumo)
        const consumo_rede_bruto = Math.max(0, consumo_mensal - autoconsumo);

        // Gerenciar créditos
        const { creditos_utilizados, saldo_creditos } = this.gerenciarCreditos(
          mes_absoluto,
          injecao,
          consumo_rede_bruto
        );

        // Consumo final da rede (após utilizar créditos)
        const consumo_rede_final = Math.max(0, consumo_rede_bruto - creditos_utilizados);

        // Cálculo das tarifas com reajuste
        const fator_reajuste = Math.pow(1 + reajuste_tarifario_mensal, mes_absoluto);
        const tarifa_sem_fv = this.tarifaService.calcularTarifaFinal(
          consumo_mensal,
          concessionaria,
          true
        ).tarifa_sem_fv * fator_reajuste;

        const tarifa_com_fv = this.tarifaService.calcularTarifaFinal(
          Math.max(consumo_rede_final, custo_disponibilidade),
          concessionaria,
          false
        ).tarifa_com_fv * fator_reajuste;

        // Custo sem sistema FV
        const custo_sem_fv = consumo_mensal * tarifa_sem_fv;

        // Custo com sistema FV
        let custo_com_fv = Math.max(consumo_rede_final, custo_disponibilidade) * tarifa_com_fv;

        // Aplicar Lei 14.300 (Fio B)
        const percentual_fio_b = this.getPercentualFioB(parametros.ano_instalacao, ano_calculo);
        const custo_fio_b = injecao * concessionaria.tusd_fio_b * percentual_fio_b * fator_reajuste;
        custo_com_fv += custo_fio_b;

        // Custo de O&M
        const custo_om_mensal = (parametros.custo_om_anual / 12) * Math.pow(1 + inflacao_mensal, mes_absoluto);
        custo_com_fv += custo_om_mensal;

        // Economia mensal
        const economia_mensal = custo_sem_fv - custo_com_fv;
        economia_total += economia_mensal;

        // Adicionar ao fluxo de caixa
        fluxos_caixa.push(economia_mensal);

        // Armazenar resultado mensal
        resultados_mensais.push({
          mes: mes + 1,
          ano: ano_calculo,
          consumo_kwh: consumo_mensal,
          geracao_kwh: geracao_mensal,
          autoconsumo_kwh: autoconsumo,
          injecao_kwh: injecao,
          consumo_rede_kwh: consumo_rede_final,
          creditos_gerados: injecao,
          creditos_utilizados,
          saldo_creditos,
          custo_sem_fv,
          custo_com_fv,
          economia_mensal,
          custo_fio_b,
          custo_disponibilidade,
          percentual_fio_b
        });
      }
    }

    // Calcular indicadores financeiros
    const vpl = this.calcularVPL(fluxos_caixa, taxa_desconto_mensal);
    const tir = this.calcularTIR(fluxos_caixa);
    const { payback_simples, payback_descontado } = this.calcularPayback(
      parametros.custo_sistema,
      fluxos_caixa.slice(1), // Remove investimento inicial
      taxa_desconto_mensal
    );

    // Resumo anual
    const resumo_anual = [];
    let fluxo_acumulado = -parametros.custo_sistema;
    
    for (let ano = 0; ano < parametros.periodo_projecao_anos; ano++) {
      const inicio_ano = ano * 12;
      const fim_ano = (ano + 1) * 12;
      const resultados_ano = resultados_mensais.slice(inicio_ano, fim_ano);
      
      const economia_anual = resultados_ano.reduce((sum, r) => sum + r.economia_mensal, 0);
      fluxo_acumulado += economia_anual;
      
      resumo_anual.push({
        ano: parametros.ano_instalacao + ano,
        economia_anual,
        fluxo_caixa_acumulado: fluxo_acumulado,
        consumo_total: resultados_ano.reduce((sum, r) => sum + r.consumo_kwh, 0),
        geracao_total: resultados_ano.reduce((sum, r) => sum + r.geracao_kwh, 0),
        autoconsumo_total: resultados_ano.reduce((sum, r) => sum + r.autoconsumo_kwh, 0),
        injecao_total: resultados_ano.reduce((sum, r) => sum + r.injecao_kwh, 0)
      });
    }

    return {
      investimento_inicial: parametros.custo_sistema,
      economia_total_25_anos: economia_total,
      vpl,
      tir,
      payback_simples_anos: payback_simples,
      payback_descontado_anos: payback_descontado,
      economia_primeiro_ano: resumo_anual[0]?.economia_anual || 0,
      economia_media_anual: economia_total / parametros.periodo_projecao_anos,
      resultados_mensais,
      resumo_anual
    };
  }

  /**
   * Simulação rápida para análise inicial
   */
  public async simulacaoRapida(
    consumo_mensal: number,
    potencia_sistema: number,
    custo_sistema: number,
    concessionaria_id: string = 'enel-rj'
  ): Promise<{
    economia_mensal_estimada: number;
    economia_anual_estimada: number;
    payback_estimado_anos: number;
    percentual_economia: number;
  }> {
    const concessionaria = await this.tarifaService.getTarifa(concessionaria_id);
    if (!concessionaria) {
      throw new Error(`Concessionária ${concessionaria_id} não encontrada`);
    }

    // Estimativas simplificadas
    const hsp_medio = 5.3; // HSP médio do RJ
    const pr_estimado = 0.75; // Performance Ratio estimado
    const geracao_mensal = (potencia_sistema * hsp_medio * 30 * pr_estimado) / 1000;
    
    const tarifa_media = this.tarifaService.calcularTarifaFinal(
      consumo_mensal,
      concessionaria
    ).tarifa_sem_fv;
    
    const economia_mensal = Math.min(geracao_mensal, consumo_mensal) * tarifa_media;
    const economia_anual = economia_mensal * 12;
    const payback_estimado = custo_sistema / economia_anual;
    const percentual_economia = (economia_mensal / (consumo_mensal * tarifa_media)) * 100;

    return {
      economia_mensal_estimada: economia_mensal,
      economia_anual_estimada: economia_anual,
      payback_estimado_anos: payback_estimado,
      percentual_economia
    };
  }
}

export default CalculadoraSolarService;