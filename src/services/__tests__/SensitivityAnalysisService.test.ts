/**
 * Testes unitários para SensitivityAnalysisService
 * 
 * Testa análise de sensibilidade para parâmetros únicos, múltiplos
 * parâmetros, cenários e exportação de resultados
 */

import { SensitivityAnalysisService, ParametrosSensibilidade, ResultadoSensibilidade } from '../SensitivityAnalysisService';
import { CalculadoraSolarService, ParametrosSistema } from '../CalculadoraSolarService';

// Mock do CalculadoraSolarService
jest.mock('../CalculadoraSolarService');
const mockCalculadoraService = CalculadoraSolarService as jest.Mocked<typeof CalculadoraSolarService>;

describe('SensitivityAnalysisService', () => {
  let sensitivityService: SensitivityAnalysisService;
  let mockCalculadoraInstance: jest.Mocked<CalculadoraSolarService>;
  let parametrosBase: ParametrosSistema;

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Mock da instância do CalculadoraSolarService
    mockCalculadoraInstance = {
      calcularEconomiaFluxoCaixa: jest.fn()
    } as jest.Mocked<CalculadoraSolarService>;
    
    mockCalculadoraService.getInstance = jest.fn().mockReturnValue(mockCalculadoraInstance);
    
    // Mock do resultado padrão
    mockCalculadoraInstance.calcularEconomiaFluxoCaixa.mockResolvedValue({
      vpl: 15000,
      tir: 0.15,
      payback_simples_anos: 8.5,
      payback_descontado_anos: 10.2,
      economia_anual: 6000,
      fluxo_caixa: [-50000, 6000, 6240, 6489, 6749, 7020]
    });
    
    sensitivityService = SensitivityAnalysisService.getInstance();
    
    parametrosBase = {
      custo_sistema: 50000,
      geracao_anual_kwh: 12000,
      consumo_mensal_kwh: 800,
      taxa_desconto_anual: 0.10,
      inflacao_anual: 0.04,
      reajuste_tarifario_anual: 0.06,
      depreciacao_anual_fv: 0.005,
      custo_om_anual: 500,
      fator_simultaneidade: 0.7,
      concessionaria: 'Enel',
      tipo_ligacao: 'monofasica',
      percentual_fio_b: 0.28
    };
  });

  describe('Singleton Pattern', () => {
    test('deve retornar a mesma instância', () => {
      const instance1 = SensitivityAnalysisService.getInstance();
      const instance2 = SensitivityAnalysisService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('Análise de Parâmetro Único', () => {
    test('deve analisar sensibilidade do custo do sistema', async () => {
      const parametros: ParametrosSensibilidade = {
        parametro: 'custo_sistema',
        valor_base: 50000,
        variacao_percentual: 20,
        numero_pontos: 5
      };
      
      const resultado = await sensitivityService.analisarParametro(parametrosBase, parametros);
      
      expect(resultado).toBeDefined();
      expect(resultado.parametro).toBe('custo_sistema');
      expect(resultado.pontos_analise.length).toBe(5);
      expect(resultado.pontos_analise[0].variacao_percentual).toBe(-20);
      expect(resultado.pontos_analise[4].variacao_percentual).toBe(20);
      
      // Verificar que o CalculadoraSolarService foi chamado para cada ponto
      expect(mockCalculadoraInstance.calcularEconomiaFluxoCaixa).toHaveBeenCalledTimes(5);
    });

    test('deve analisar sensibilidade da geração anual', async () => {
      const parametros: ParametrosSensibilidade = {
        parametro: 'geracao_anual_kwh',
        valor_base: 12000,
        variacao_percentual: 15,
        numero_pontos: 7
      };
      
      const resultado = await sensitivityService.analisarParametro(parametrosBase, parametros);
      
      expect(resultado.parametro).toBe('geracao_anual_kwh');
      expect(resultado.pontos_analise.length).toBe(7);
      expect(resultado.pontos_analise[3].variacao_percentual).toBe(0); // Ponto central
      
      // Verificar valores aplicados
      const pontoMinimo = resultado.pontos_analise[0];
      const pontoMaximo = resultado.pontos_analise[6];
      
      expect(pontoMinimo.valor_aplicado).toBeCloseTo(12000 * 0.85, 0);
      expect(pontoMaximo.valor_aplicado).toBeCloseTo(12000 * 1.15, 0);
    });

    test('deve analisar sensibilidade da taxa de desconto', async () => {
      const parametros: ParametrosSensibilidade = {
        parametro: 'taxa_desconto_anual',
        valor_base: 0.10,
        variacao_percentual: 50,
        numero_pontos: 3
      };
      
      const resultado = await sensitivityService.analisarParametro(parametrosBase, parametros);
      
      expect(resultado.parametro).toBe('taxa_desconto_anual');
      expect(resultado.pontos_analise.length).toBe(3);
      
      // Verificar que os valores estão dentro de limites razoáveis
      resultado.pontos_analise.forEach(ponto => {
        expect(ponto.valor_aplicado).toBeGreaterThan(0);
        expect(ponto.valor_aplicado).toBeLessThan(1); // Taxa não deve exceder 100%
      });
    });

    test('deve lidar com parâmetro inválido', async () => {
      const parametros: ParametrosSensibilidade = {
        parametro: 'parametro_inexistente' as keyof ParametrosSistema,
        valor_base: 1000,
        variacao_percentual: 10,
        numero_pontos: 3
      };
      
      await expect(sensitivityService.analisarParametro(parametrosBase, parametros))
        .rejects.toThrow('Parâmetro não suportado');
    });

    test('deve validar número mínimo de pontos', async () => {
      const parametros: ParametrosSensibilidade = {
        parametro: 'custo_sistema',
        valor_base: 50000,
        variacao_percentual: 10,
        numero_pontos: 1 // Muito poucos pontos
      };
      
      await expect(sensitivityService.analisarParametro(parametrosBase, parametros))
        .rejects.toThrow('Número de pontos deve ser pelo menos 3');
    });
  });

  describe('Análise de Múltiplos Parâmetros', () => {
    test('deve analisar múltiplos parâmetros simultaneamente', async () => {
      const parametrosMultiplos = [
        {
          parametro: 'custo_sistema' as const,
          valor_base: 50000,
          variacao_percentual: 20,
          numero_pontos: 3
        },
        {
          parametro: 'geracao_anual_kwh' as const,
          valor_base: 12000,
          variacao_percentual: 15,
          numero_pontos: 3
        }
      ];
      
      const resultado = await sensitivityService.analisarMultiplosParametros(
        parametrosBase,
        parametrosMultiplos
      );
      
      expect(resultado.length).toBe(2);
      expect(resultado[0].parametro).toBe('custo_sistema');
      expect(resultado[1].parametro).toBe('geracao_anual_kwh');
      
      // Cada parâmetro deve ter seus pontos de análise
      resultado.forEach(analise => {
        expect(analise.pontos_analise.length).toBe(3);
      });
    });

    test('deve manter independência entre análises de parâmetros', async () => {
      const parametrosMultiplos = [
        {
          parametro: 'custo_sistema' as const,
          valor_base: 50000,
          variacao_percentual: 10,
          numero_pontos: 3
        },
        {
          parametro: 'taxa_desconto_anual' as const,
          valor_base: 0.10,
          variacao_percentual: 25,
          numero_pontos: 3
        }
      ];
      
      const resultado = await sensitivityService.analisarMultiplosParametros(
        parametrosBase,
        parametrosMultiplos
      );
      
      // Verificar que cada análise mantém os outros parâmetros constantes
      const analiseCusto = resultado.find(r => r.parametro === 'custo_sistema');
      const analiseTaxa = resultado.find(r => r.parametro === 'taxa_desconto_anual');
      
      expect(analiseCusto).toBeDefined();
      expect(analiseTaxa).toBeDefined();
      
      // Verificar que as variações são independentes
      expect(analiseCusto!.pontos_analise[0].valor_aplicado).not.toBe(
        analiseCusto!.pontos_analise[2].valor_aplicado
      );
    });

    test('deve lidar com lista vazia de parâmetros', async () => {
      const resultado = await sensitivityService.analisarMultiplosParametros(
        parametrosBase,
        []
      );
      
      expect(resultado).toEqual([]);
    });
  });

  describe('Análise Padrão', () => {
    test('deve executar análise padrão com parâmetros comuns', async () => {
      const resultado = await sensitivityService.analisePadrao(parametrosBase);
      
      expect(resultado.length).toBeGreaterThan(0);
      
      // Verificar que inclui parâmetros importantes
      const parametrosAnalisados = resultado.map(r => r.parametro);
      expect(parametrosAnalisados).toContain('custo_sistema');
      expect(parametrosAnalisados).toContain('geracao_anual_kwh');
      expect(parametrosAnalisados).toContain('consumo_mensal_kwh');
      expect(parametrosAnalisados).toContain('taxa_desconto_anual');
      expect(parametrosAnalisados).toContain('reajuste_tarifario_anual');
    });

    test('deve usar variações percentuais apropriadas para cada parâmetro', async () => {
      const resultado = await sensitivityService.analisePadrao(parametrosBase);
      
      resultado.forEach(analise => {
        expect(analise.pontos_analise.length).toBeGreaterThanOrEqual(5);
        
        // Verificar que há variação nos resultados
        const vpls = analise.pontos_analise.map(p => p.resultado.vpl);
        const vplMinimo = Math.min(...vpls);
        const vplMaximo = Math.max(...vpls);
        
        expect(vplMaximo).toBeGreaterThan(vplMinimo);
      });
    });
  });

  describe('Análise de Cenários', () => {
    test('deve analisar cenário otimista', async () => {
      const resultado = await sensitivityService.analisarCenarios(parametrosBase);
      
      expect(resultado.otimista).toBeDefined();
      expect(resultado.realista).toBeDefined();
      expect(resultado.pessimista).toBeDefined();
      
      // Cenário otimista deve ter melhor VPL
      expect(resultado.otimista.vpl).toBeGreaterThanOrEqual(resultado.realista.vpl);
      expect(resultado.realista.vpl).toBeGreaterThanOrEqual(resultado.pessimista.vpl);
    });

    test('deve analisar cenário pessimista', async () => {
      const resultado = await sensitivityService.analisarCenarios(parametrosBase);
      
      // Cenário pessimista deve ter pior payback
      expect(resultado.pessimista.payback_simples_anos)
        .toBeGreaterThanOrEqual(resultado.realista.payback_simples_anos);
      expect(resultado.realista.payback_simples_anos)
        .toBeGreaterThanOrEqual(resultado.otimista.payback_simples_anos);
    });

    test('deve manter cenário realista como base', async () => {
      const resultado = await sensitivityService.analisarCenarios(parametrosBase);
      
      // Cenário realista deve usar parâmetros base
      expect(mockCalculadoraInstance.calcularEconomiaFluxoCaixa)
        .toHaveBeenCalledWith(expect.objectContaining({
          custo_sistema: parametrosBase.custo_sistema,
          geracao_anual_kwh: parametrosBase.geracao_anual_kwh
        }));
    });

    test('deve aplicar ajustes consistentes nos cenários', async () => {
      // Mock diferentes resultados para cada cenário
      mockCalculadoraInstance.calcularEconomiaFluxoCaixa
        .mockResolvedValueOnce({ vpl: 20000, tir: 0.18, payback_simples_anos: 7.5 }) // Otimista
        .mockResolvedValueOnce({ vpl: 15000, tir: 0.15, payback_simples_anos: 8.5 }) // Realista
        .mockResolvedValueOnce({ vpl: 8000, tir: 0.12, payback_simples_anos: 10.2 }); // Pessimista
      
      const resultado = await sensitivityService.analisarCenarios(parametrosBase);
      
      expect(resultado.otimista.vpl).toBe(20000);
      expect(resultado.realista.vpl).toBe(15000);
      expect(resultado.pessimista.vpl).toBe(8000);
    });
  });

  describe('Aplicação de Variações', () => {
    test('deve aplicar variação percentual corretamente', () => {
      const parametrosOriginais = { ...parametrosBase };
      const parametrosModificados = sensitivityService['aplicarVariacao'](
        parametrosOriginais,
        'custo_sistema',
        60000 // +20% de 50000
      );
      
      expect(parametrosModificados.custo_sistema).toBe(60000);
      expect(parametrosModificados.geracao_anual_kwh).toBe(parametrosOriginais.geracao_anual_kwh);
      expect(parametrosModificados.consumo_mensal_kwh).toBe(parametrosOriginais.consumo_mensal_kwh);
    });

    test('deve manter outros parâmetros inalterados', () => {
      const parametrosOriginais = { ...parametrosBase };
      const parametrosModificados = sensitivityService['aplicarVariacao'](
        parametrosOriginais,
        'taxa_desconto_anual',
        0.12
      );
      
      expect(parametrosModificados.taxa_desconto_anual).toBe(0.12);
      expect(parametrosModificados.custo_sistema).toBe(parametrosOriginais.custo_sistema);
      expect(parametrosModificados.concessionaria).toBe(parametrosOriginais.concessionaria);
    });

    test('deve lidar com parâmetros de string', () => {
      const parametrosOriginais = { ...parametrosBase };
      const parametrosModificados = sensitivityService['aplicarVariacao'](
        parametrosOriginais,
        'concessionaria',
        'Light'
      );
      
      expect(parametrosModificados.concessionaria).toBe('Light');
    });
  });

  describe('Exportação de Resultados', () => {
    test('deve exportar resultados para CSV', async () => {
      const parametros: ParametrosSensibilidade = {
        parametro: 'custo_sistema',
        valor_base: 50000,
        variacao_percentual: 20,
        numero_pontos: 3
      };
      
      const analise = await sensitivityService.analisarParametro(parametrosBase, parametros);
      const csv = sensitivityService.exportarParaCSV([analise]);
      
      expect(csv).toBeDefined();
      expect(typeof csv).toBe('string');
      expect(csv).toContain('Parametro');
      expect(csv).toContain('Variacao_Percentual');
      expect(csv).toContain('VPL');
      expect(csv).toContain('TIR');
      expect(csv).toContain('Payback');
      expect(csv).toContain('custo_sistema');
    });

    test('deve formatar números corretamente no CSV', async () => {
      const parametros: ParametrosSensibilidade = {
        parametro: 'geracao_anual_kwh',
        valor_base: 12000,
        variacao_percentual: 10,
        numero_pontos: 3
      };
      
      const analise = await sensitivityService.analisarParametro(parametrosBase, parametros);
      const csv = sensitivityService.exportarParaCSV([analise]);
      
      // Verificar que contém valores numéricos formatados
      expect(csv).toMatch(/\d+\.\d+/); // Números decimais
      expect(csv).toMatch(/-?\d+/); // Números inteiros (incluindo negativos)
    });

    test('deve lidar com lista vazia de análises', () => {
      const csv = sensitivityService.exportarParaCSV([]);
      
      expect(csv).toBeDefined();
      expect(csv).toContain('Parametro'); // Cabeçalho deve estar presente
    });

    test('deve exportar múltiplas análises', async () => {
      const parametrosMultiplos = [
        {
          parametro: 'custo_sistema' as const,
          valor_base: 50000,
          variacao_percentual: 10,
          numero_pontos: 3
        },
        {
          parametro: 'geracao_anual_kwh' as const,
          valor_base: 12000,
          variacao_percentual: 15,
          numero_pontos: 3
        }
      ];
      
      const analises = await sensitivityService.analisarMultiplosParametros(
        parametrosBase,
        parametrosMultiplos
      );
      
      const csv = sensitivityService.exportarParaCSV(analises);
      
      expect(csv).toContain('custo_sistema');
      expect(csv).toContain('geracao_anual_kwh');
      
      // Deve ter linhas para ambos os parâmetros
      const linhas = csv.split('\n').filter(linha => linha.trim().length > 0);
      expect(linhas.length).toBeGreaterThan(6); // Cabeçalho + 3 pontos para cada parâmetro
    });
  });

  describe('Validação e Tratamento de Erros', () => {
    test('deve validar parâmetros de entrada', async () => {
      const parametrosInvalidos: ParametrosSensibilidade = {
        parametro: 'custo_sistema',
        valor_base: -1000, // Valor negativo inválido
        variacao_percentual: 10,
        numero_pontos: 3
      };
      
      await expect(sensitivityService.analisarParametro(parametrosBase, parametrosInvalidos))
        .rejects.toThrow();
    });

    test('deve validar variação percentual', async () => {
      const parametrosInvalidos: ParametrosSensibilidade = {
        parametro: 'custo_sistema',
        valor_base: 50000,
        variacao_percentual: -10, // Variação negativa inválida
        numero_pontos: 3
      };
      
      await expect(sensitivityService.analisarParametro(parametrosBase, parametrosInvalidos))
        .rejects.toThrow();
    });

    test('deve lidar com erro no cálculo financeiro', async () => {
      mockCalculadoraInstance.calcularEconomiaFluxoCaixa
        .mockRejectedValue(new Error('Erro no cálculo'));
      
      const parametros: ParametrosSensibilidade = {
        parametro: 'custo_sistema',
        valor_base: 50000,
        variacao_percentual: 10,
        numero_pontos: 3
      };
      
      await expect(sensitivityService.analisarParametro(parametrosBase, parametros))
        .rejects.toThrow('Erro no cálculo');
    });

    test('deve validar número máximo de pontos', async () => {
      const parametrosInvalidos: ParametrosSensibilidade = {
        parametro: 'custo_sistema',
        valor_base: 50000,
        variacao_percentual: 10,
        numero_pontos: 101 // Muitos pontos
      };
      
      await expect(sensitivityService.analisarParametro(parametrosBase, parametrosInvalidos))
        .rejects.toThrow('Número de pontos não pode exceder 100');
    });
  });

  describe('Performance e Otimização', () => {
    test('deve executar análise em tempo razoável', async () => {
      const parametros: ParametrosSensibilidade = {
        parametro: 'custo_sistema',
        valor_base: 50000,
        variacao_percentual: 20,
        numero_pontos: 10
      };
      
      const inicio = Date.now();
      await sensitivityService.analisarParametro(parametrosBase, parametros);
      const duracao = Date.now() - inicio;
      
      expect(duracao).toBeLessThan(5000); // Menos de 5 segundos
    });

    test('deve processar múltiplos parâmetros eficientemente', async () => {
      const parametrosMultiplos = Array.from({ length: 5 }, (_, i) => ({
        parametro: 'custo_sistema' as const,
        valor_base: 50000 + i * 1000,
        variacao_percentual: 10,
        numero_pontos: 5
      }));
      
      const inicio = Date.now();
      await sensitivityService.analisarMultiplosParametros(
        parametrosBase,
        parametrosMultiplos
      );
      const duracao = Date.now() - inicio;
      
      expect(duracao).toBeLessThan(10000); // Menos de 10 segundos
    });
  });

  describe('Casos Extremos', () => {
    test('deve lidar com variação de 100%', async () => {
      const parametros: ParametrosSensibilidade = {
        parametro: 'custo_sistema',
        valor_base: 50000,
        variacao_percentual: 100, // Variação extrema
        numero_pontos: 3
      };
      
      const resultado = await sensitivityService.analisarParametro(parametrosBase, parametros);
      
      expect(resultado.pontos_analise[0].valor_aplicado).toBe(0); // -100%
      expect(resultado.pontos_analise[2].valor_aplicado).toBe(100000); // +100%
    });

    test('deve lidar com valores muito pequenos', async () => {
      const parametros: ParametrosSensibilidade = {
        parametro: 'depreciacao_anual_fv',
        valor_base: 0.005,
        variacao_percentual: 50,
        numero_pontos: 3
      };
      
      const resultado = await sensitivityService.analisarParametro(parametrosBase, parametros);
      
      expect(resultado).toBeDefined();
      expect(resultado.pontos_analise.length).toBe(3);
    });

    test('deve lidar com muitos pontos de análise', async () => {
      const parametros: ParametrosSensibilidade = {
        parametro: 'custo_sistema',
        valor_base: 50000,
        variacao_percentual: 30,
        numero_pontos: 50 // Muitos pontos
      };
      
      const resultado = await sensitivityService.analisarParametro(parametrosBase, parametros);
      
      expect(resultado.pontos_analise.length).toBe(50);
      expect(mockCalculadoraInstance.calcularEconomiaFluxoCaixa).toHaveBeenCalledTimes(50);
    });
  });
});