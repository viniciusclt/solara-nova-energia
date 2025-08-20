import { useState, useCallback, useMemo } from 'react';
import { FinancialData, CalculationResult } from './types';
import { CalculadoraSolarService, ParametrosSistema } from '@/services/CalculadoraSolarService';
import { logError } from '@/utils/secureLogger';
import { useToast } from '@/hooks/use-toast';

export const useFinancialCalculations = (initialData: FinancialData) => {
  const { toast } = useToast();
  const [financialData, setFinancialData] = useState<FinancialData>(initialData);
  const [calculando, setCalculando] = useState(false);
  const [calculadoraService] = useState(() => new CalculadoraSolarService());

  // Atualizar dados financeiros
  const updateFinancialData = useCallback((updates: Partial<FinancialData>) => {
    setFinancialData(prev => ({ ...prev, ...updates }));
  }, []);

  // Calcular valor final com impostos e margens
  const calcularValorFinal = useCallback((data: FinancialData) => {
    const valorBase = data.valorSistema;
    const bdiValor = valorBase * (data.bdi / 100);
    const valorComBdi = valorBase + bdiValor;
    const markupValor = valorComBdi * (data.markup / 100);
    const valorComMarkup = valorComBdi + markupValor;
    const margemValor = valorComMarkup * (data.margem / 100);
    const valorComMargem = valorComMarkup + margemValor;
    const valorFinal = valorComMargem + data.comissaoExterna + data.outrosGastos;
    
    return valorFinal;
  }, []);

  // Calcular economia e métricas financeiras
  const calcularEconomia = useCallback((data: FinancialData): CalculationResult => {
    try {
      const consumoAnual = data.consumoMensal * 12;
      const geracaoAnual = data.geracaoAnual || consumoAnual * 0.95; // 95% de offset padrão
      const valorFinal = calcularValorFinal(data);
      
      let economiaAcumulada = 0;
      let fluxoCaixa = -valorFinal;
      let paybackAnos = 0;
      const fluxosAnuais: number[] = [];
      
      // Cálculo ano a ano considerando reajuste tarifário
      for (let ano = 1; ano <= 25; ano++) {
        const tarifaAno = data.tarifaEletrica * Math.pow(1 + data.reajusteTarifario / 100, ano - 1);
        const economiaAno = geracaoAnual * tarifaAno;
        economiaAcumulada += economiaAno;
        fluxoCaixa += economiaAno;
        fluxosAnuais.push(economiaAno);
        
        // Calcular payback
        if (paybackAnos === 0 && fluxoCaixa > 0) {
          paybackAnos = ano - 1 + (Math.abs(fluxoCaixa - economiaAno) / economiaAno);
        }
      }
      
      // Cálculo do VPL
      const taxaDesconto = 0.08; // 8% ao ano (CDI médio)
      let vpl = -valorFinal;
      
      for (let ano = 1; ano <= 25; ano++) {
        const tarifaAno = data.tarifaEletrica * Math.pow(1 + data.reajusteTarifario / 100, ano - 1);
        const economiaAno = geracaoAnual * tarifaAno;
        vpl += economiaAno / Math.pow(1 + taxaDesconto, ano);
      }
      
      // Cálculo da TIR (método aproximado)
      let tir = 0;
      const maxIteracoes = 100;
      let taxaTeste = 0.1; // Começar com 10%
      let incremento = 0.01;
      
      for (let i = 0; i < maxIteracoes; i++) {
        let vplTeste = -valorFinal;
        
        for (let ano = 1; ano <= 25; ano++) {
          const tarifaAno = data.tarifaEletrica * Math.pow(1 + data.reajusteTarifario / 100, ano - 1);
          const economiaAno = geracaoAnual * tarifaAno;
          vplTeste += economiaAno / Math.pow(1 + taxaTeste, ano);
        }
        
        if (Math.abs(vplTeste) < 1000) { // Precisão de R$ 1.000
          tir = taxaTeste * 100;
          break;
        }
        
        if (vplTeste > 0) {
          taxaTeste += incremento;
        } else {
          taxaTeste -= incremento;
          incremento /= 2;
        }
      }
      
      const economiaAnual = geracaoAnual * data.tarifaEletrica;
      
      return {
        payback: paybackAnos,
        tir,
        vpl,
        economiaAnual,
        economia25Anos: economiaAcumulada
      };
      
    } catch (error) {
      logError('Erro no cálculo financeiro', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        service: 'useFinancialCalculations',
        action: 'calcularEconomia'
      });
      
      return {
        payback: 0,
        tir: 0,
        vpl: 0,
        economiaAnual: 0,
        economia25Anos: 0
      };
    }
  }, [calcularValorFinal]);

  // Calcular usando o serviço avançado
  const calcularComServico = useCallback(async (data: FinancialData) => {
    try {
      setCalculando(true);
      
      const parametros: ParametrosSistema = {
        potenciaSistema: data.potenciaSistema,
        geracaoAnual: data.geracaoAnual,
        consumoMensal: data.consumoMensal,
        incrementoConsumo: data.incrementoConsumo,
        fatorSimultaneidade: data.fatorSimultaneidade,
        concessionariaId: data.concessionariaId,
        tipoLigacao: data.tipoLigacao,
        anoInstalacao: data.anoInstalacao,
        valorInvestimento: calcularValorFinal(data),
        depreciacao: data.depreciacao
      };
      
      const resultado = await calculadoraService.calcularViabilidade(parametros);
      
      return {
        payback: resultado.payback,
        tir: resultado.tir,
        vpl: resultado.vpl,
        economiaAnual: resultado.economiaAnual,
        economia25Anos: resultado.economia25Anos
      };
      
    } catch (error) {
      logError('Erro no cálculo com serviço', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        service: 'useFinancialCalculations',
        action: 'calcularComServico'
      });
      
      toast({
        title: "Erro no Cálculo",
        description: "Não foi possível calcular a viabilidade. Usando cálculo simplificado.",
        variant: "destructive"
      });
      
      return calcularEconomia(data);
    } finally {
      setCalculando(false);
    }
  }, [calculadoraService, calcularValorFinal, calcularEconomia, toast]);

  // Recalcular automaticamente quando dados mudarem
  const resultadoCalculado = useMemo(() => {
    const valorFinal = calcularValorFinal(financialData);
    const resultado = calcularEconomia(financialData);
    
    return {
      ...financialData,
      valorFinal,
      ...resultado
    };
  }, [financialData, calcularValorFinal, calcularEconomia]);

  // Validar dados de entrada
  const validarDados = useCallback((data: FinancialData): { isValid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (data.valorSistema <= 0) errors.push('Valor do sistema deve ser maior que zero');
    if (data.potenciaSistema <= 0) errors.push('Potência do sistema deve ser maior que zero');
    if (data.geracaoAnual <= 0) errors.push('Geração anual deve ser maior que zero');
    if (data.consumoMensal <= 0) errors.push('Consumo mensal deve ser maior que zero');
    if (data.tarifaEletrica <= 0) errors.push('Tarifa elétrica deve ser maior que zero');
    if (data.reajusteTarifario < 0) errors.push('Reajuste tarifário não pode ser negativo');
    if (data.inflacao < 0) errors.push('Inflação não pode ser negativa');
    
    return {
      isValid: errors.length === 0,
      errors
    };
  }, []);

  // Exportar dados para relatório
  const exportarDados = useCallback(() => {
    return {
      configuracao: financialData,
      resultados: resultadoCalculado,
      timestamp: new Date().toISOString(),
      versao: '1.0'
    };
  }, [financialData, resultadoCalculado]);

  return {
    financialData: resultadoCalculado,
    updateFinancialData,
    calcularComServico,
    calculando,
    validarDados,
    exportarDados
  };
};