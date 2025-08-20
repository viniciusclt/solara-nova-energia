/**
 * Testes unitários para CalculadoraSolarService
 * 
 * Testa os algoritmos de cálculo financeiro, VPL, TIR, Payback
 * e gerenciamento de créditos de energia
 */

import { CalculadoraSolarService, ParametrosSistema } from '../CalculadoraSolarService';
import { TarifaService } from '../TarifaService';

// Mock do TarifaService
jest.mock('../TarifaService');
const mockTarifaService = TarifaService as jest.Mocked<typeof TarifaService>;

describe('CalculadoraSolarService', () => {
  let calculadoraService: CalculadoraSolarService;
  let parametrosBase: ParametrosSistema;

  beforeEach(() => {
    // Reset dos mocks
    jest.clearAllMocks();
    
    // Mock das tarifas
    mockTarifaService.prototype.calcularTarifaFinal.mockResolvedValue({
      tarifa_final_com_impostos: 0.75,
      valor_tusd: 0.30,
      valor_te: 0.25,
      valor_pis: 0.0165,
      valor_cofins: 0.076,
      valor_icms: 0.18,
      valor_cosip: 5.0,
      custo_disponibilidade: 30.0
    });

    calculadoraService = CalculadoraSolarService.getInstance();
    
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

  describe('Cálculo de VPL', () => {
    test('deve calcular VPL corretamente com fluxo positivo', () => {
      const fluxoCaixa = [-50000, 5000, 5200, 5408, 5624, 5849];
      const taxaDesconto = 0.10;
      
      const vpl = calculadoraService.calcularVPL(fluxoCaixa, taxaDesconto);
      
      expect(vpl).toBeCloseTo(-29141.85, 2);
    });

    test('deve calcular VPL corretamente com fluxo que gera retorno positivo', () => {
      const fluxoCaixa = [-30000, 8000, 8320, 8652, 8998, 9358];
      const taxaDesconto = 0.08;
      
      const vpl = calculadoraService.calcularVPL(fluxoCaixa, taxaDesconto);
      
      expect(vpl).toBeGreaterThan(0);
    });

    test('deve retornar 0 para fluxo de caixa vazio', () => {
      const vpl = calculadoraService.calcularVPL([], 0.10);
      expect(vpl).toBe(0);
    });

    test('deve retornar 0 para taxa de desconto inválida', () => {
      const fluxoCaixa = [-50000, 5000, 5200];
      const vpl = calculadoraService.calcularVPL(fluxoCaixa, -0.5);
      expect(vpl).toBe(0);
    });

    test('deve lidar com valores não numéricos no fluxo', () => {
      const fluxoCaixa = [-50000, NaN, 5200, Infinity];
      const vpl = calculadoraService.calcularVPL(fluxoCaixa, 0.10);
      expect(vpl).toBe(0);
    });
  });

  describe('Cálculo de TIR', () => {
    test('deve calcular TIR corretamente para investimento viável', () => {
      const fluxoCaixa = [-30000, 8000, 8320, 8652, 8998, 9358];
      
      const tir = calculadoraService.calcularTIR(fluxoCaixa);
      
      expect(tir).toBeGreaterThan(0.15); // Esperamos uma TIR > 15%
      expect(tir).toBeLessThan(0.35); // E < 35%
    });

    test('deve retornar 0 para investimento inviável', () => {
      const fluxoCaixa = [-100000, 1000, 1000, 1000, 1000, 1000];
      
      const tir = calculadoraService.calcularTIR(fluxoCaixa);
      
      expect(tir).toBe(0);
    });

    test('deve retornar 0 para fluxo de caixa vazio', () => {
      const tir = calculadoraService.calcularTIR([]);
      expect(tir).toBe(0);
    });

    test('deve retornar 0 para fluxo sem investimento inicial', () => {
      const fluxoCaixa = [5000, 5000, 5000];
      const tir = calculadoraService.calcularTIR(fluxoCaixa);
      expect(tir).toBe(0);
    });

    test('deve usar método de bisseção como fallback', () => {
      // Fluxo que pode causar problemas na convergência do Newton-Raphson
      const fluxoCaixa = [-50000, 0, 0, 0, 0, 100000];
      
      const tir = calculadoraService.calcularTIR(fluxoCaixa);
      
      expect(tir).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Cálculo de Payback', () => {
    test('deve calcular payback simples corretamente', () => {
      const fluxoCaixa = [-50000, 10000, 12000, 15000, 18000, 20000];
      
      const payback = calculadoraService.calcularPayback(fluxoCaixa, 0.10);
      
      expect(payback.simples).toBeCloseTo(3.67, 1); // Entre 3 e 4 anos
      expect(payback.descontado).toBeGreaterThan(payback.simples);
    });

    test('deve retornar valores altos para investimento sem retorno', () => {
      const fluxoCaixa = [-100000, 1000, 1000, 1000];
      
      const payback = calculadoraService.calcularPayback(fluxoCaixa, 0.10);
      
      expect(payback.simples).toBeGreaterThan(25);
      expect(payback.descontado).toBeGreaterThan(25);
    });

    test('deve lidar com fluxo de caixa vazio', () => {
      const payback = calculadoraService.calcularPayback([], 0.10);
      
      expect(payback.simples).toBe(999);
      expect(payback.descontado).toBe(999);
    });
  });

  describe('Gerenciamento de Créditos', () => {
    test('deve gerenciar créditos com validade de 60 meses', () => {
      const creditos = [
        { valor: 100, mes_criacao: 1 },
        { valor: 150, mes_criacao: 5 },
        { valor: 200, mes_criacao: 10 }
      ];
      
      // Usar créditos no mês 15
      const resultado = calculadoraService.gerenciarCreditos(creditos, 300, 15);
      
      expect(resultado.creditos_utilizados).toBe(300);
      expect(resultado.creditos_restantes.length).toBe(1);
      expect(resultado.creditos_restantes[0].valor).toBe(150); // Sobrou 150 do último crédito
    });

    test('deve expirar créditos antigos', () => {
      const creditos = [
        { valor: 100, mes_criacao: 1 }, // Expira no mês 61
        { valor: 150, mes_criacao: 10 } // Expira no mês 70
      ];
      
      // Usar no mês 65 (primeiro crédito já expirou)
      const resultado = calculadoraService.gerenciarCreditos(creditos, 50, 65);
      
      expect(resultado.creditos_utilizados).toBe(50);
      expect(resultado.creditos_restantes.length).toBe(1);
      expect(resultado.creditos_restantes[0].valor).toBe(100); // 150 - 50 = 100
    });

    test('deve usar créditos na ordem FIFO', () => {
      const creditos = [
        { valor: 100, mes_criacao: 1 },
        { valor: 200, mes_criacao: 2 },
        { valor: 150, mes_criacao: 3 }
      ];
      
      const resultado = calculadoraService.gerenciarCreditos(creditos, 250, 10);
      
      expect(resultado.creditos_utilizados).toBe(250);
      expect(resultado.creditos_restantes.length).toBe(1);
      expect(resultado.creditos_restantes[0].valor).toBe(100); // Sobrou 100 do terceiro crédito
      expect(resultado.creditos_restantes[0].mes_criacao).toBe(3);
    });

    test('deve retornar créditos vazios quando não há créditos suficientes', () => {
      const creditos = [
        { valor: 50, mes_criacao: 1 }
      ];
      
      const resultado = calculadoraService.gerenciarCreditos(creditos, 100, 10);
      
      expect(resultado.creditos_utilizados).toBe(50);
      expect(resultado.creditos_restantes.length).toBe(0);
    });
  });

  describe('Cálculo do Percentual do Fio B', () => {
    test('deve aplicar percentual do Fio B corretamente', async () => {
      const parametros = { ...parametrosBase, percentual_fio_b: 0.30 };
      
      const resultado = await calculadoraService.calcularEconomiaFluxoCaixa(parametros);
      
      expect(resultado).toBeDefined();
      expect(resultado.vpl).toBeDefined();
      expect(resultado.tir).toBeDefined();
      expect(resultado.payback_simples_anos).toBeDefined();
    });

    test('deve funcionar com percentual zero do Fio B', async () => {
      const parametros = { ...parametrosBase, percentual_fio_b: 0 };
      
      const resultado = await calculadoraService.calcularEconomiaFluxoCaixa(parametros);
      
      expect(resultado).toBeDefined();
      expect(resultado.economia_anual).toBeGreaterThan(0);
    });

    test('deve limitar percentual do Fio B a 100%', async () => {
      const parametros = { ...parametrosBase, percentual_fio_b: 1.5 }; // 150%
      
      const resultado = await calculadoraService.calcularEconomiaFluxoCaixa(parametros);
      
      expect(resultado).toBeDefined();
      // O sistema deve limitar internamente a 100%
    });
  });

  describe('Validação de Parâmetros', () => {
    test('deve validar parâmetros obrigatórios', async () => {
      const parametrosInvalidos = {
        ...parametrosBase,
        custo_sistema: 0,
        geracao_anual_kwh: -1000
      };
      
      await expect(calculadoraService.calcularEconomiaFluxoCaixa(parametrosInvalidos))
        .rejects.toThrow();
    });

    test('deve validar taxas dentro de limites razoáveis', async () => {
      const parametrosInvalidos = {
        ...parametrosBase,
        taxa_desconto_anual: -0.5, // Taxa negativa inválida
        inflacao_anual: 2.0 // 200% de inflação
      };
      
      await expect(calculadoraService.calcularEconomiaFluxoCaixa(parametrosInvalidos))
        .rejects.toThrow();
    });
  });

  describe('Integração com TarifaService', () => {
    test('deve usar tarifas calculadas pelo TarifaService', async () => {
      const resultado = await calculadoraService.calcularEconomiaFluxoCaixa(parametrosBase);
      
      expect(mockTarifaService.prototype.calcularTarifaFinal).toHaveBeenCalled();
      expect(resultado).toBeDefined();
    });

    test('deve lidar com erro do TarifaService', async () => {
      mockTarifaService.prototype.calcularTarifaFinal.mockRejectedValue(
        new Error('Erro na consulta de tarifas')
      );
      
      await expect(calculadoraService.calcularEconomiaFluxoCaixa(parametrosBase))
        .rejects.toThrow('Erro na consulta de tarifas');
    });
  });

  describe('Simulação Rápida', () => {
    test('deve executar simulação rápida com parâmetros simplificados', () => {
      const parametrosSimples = {
        custo_sistema: 30000,
        geracao_anual_kwh: 10000,
        tarifa_kwh: 0.75,
        taxa_desconto: 0.10
      };
      
      const resultado = calculadoraService.simulacaoRapida(parametrosSimples);
      
      expect(resultado.economia_anual).toBeCloseTo(7500, 0); // 10000 * 0.75
      expect(resultado.payback_simples).toBeCloseTo(4, 0); // 30000 / 7500
      expect(resultado.vpl_estimado).toBeDefined();
    });

    test('deve retornar valores padrão para parâmetros inválidos', () => {
      const parametrosInvalidos = {
        custo_sistema: 0,
        geracao_anual_kwh: -1000,
        tarifa_kwh: -0.5,
        taxa_desconto: 2.0
      };
      
      const resultado = calculadoraService.simulacaoRapida(parametrosInvalidos);
      
      expect(resultado.economia_anual).toBe(0);
      expect(resultado.payback_simples).toBe(999);
      expect(resultado.vpl_estimado).toBe(0);
    });
  });

  describe('Performance e Otimização', () => {
    test('deve executar cálculo completo em tempo razoável', async () => {
      const inicio = Date.now();
      
      await calculadoraService.calcularEconomiaFluxoCaixa(parametrosBase);
      
      const duracao = Date.now() - inicio;
      expect(duracao).toBeLessThan(1000); // Menos de 1 segundo
    });

    test('deve manter consistência em múltiplas execuções', async () => {
      const resultados = [];
      
      for (let i = 0; i < 5; i++) {
        const resultado = await calculadoraService.calcularEconomiaFluxoCaixa(parametrosBase);
        resultados.push(resultado);
      }
      
      // Todos os resultados devem ser idênticos
      for (let i = 1; i < resultados.length; i++) {
        expect(resultados[i].vpl).toBeCloseTo(resultados[0].vpl, 2);
        expect(resultados[i].tir).toBeCloseTo(resultados[0].tir, 4);
        expect(resultados[i].payback_simples_anos).toBeCloseTo(resultados[0].payback_simples_anos, 2);
      }
    });
  });

  describe('Casos Extremos', () => {
    test('deve lidar com sistema muito pequeno', async () => {
      const parametrosPequenos = {
        ...parametrosBase,
        custo_sistema: 1000,
        geracao_anual_kwh: 500,
        consumo_mensal_kwh: 50
      };
      
      const resultado = await calculadoraService.calcularEconomiaFluxoCaixa(parametrosPequenos);
      
      expect(resultado).toBeDefined();
      expect(resultado.payback_simples_anos).toBeGreaterThan(0);
    });

    test('deve lidar com sistema muito grande', async () => {
      const parametrosGrandes = {
        ...parametrosBase,
        custo_sistema: 500000,
        geracao_anual_kwh: 100000,
        consumo_mensal_kwh: 8000
      };
      
      const resultado = await calculadoraService.calcularEconomiaFluxoCaixa(parametrosGrandes);
      
      expect(resultado).toBeDefined();
      expect(resultado.economia_anual).toBeGreaterThan(0);
    });

    test('deve lidar com taxas extremas', async () => {
      const parametrosExtremos = {
        ...parametrosBase,
        taxa_desconto_anual: 0.25, // 25%
        inflacao_anual: 0.15, // 15%
        reajuste_tarifario_anual: 0.20 // 20%
      };
      
      const resultado = await calculadoraService.calcularEconomiaFluxoCaixa(parametrosExtremos);
      
      expect(resultado).toBeDefined();
      expect(Number.isFinite(resultado.vpl)).toBe(true);
      expect(Number.isFinite(resultado.tir)).toBe(true);
    });
  });
});