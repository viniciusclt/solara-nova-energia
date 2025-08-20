/**
 * Testes unitários para TarifaService
 * 
 * Testa os cálculos de tarifas, ICMS, COSIP e integração com Supabase
 */

import { TarifaService, TarifaConcessionaria, CalculoTarifa } from '../TarifaService';
import { createClient } from '@supabase/supabase-js';

// Mock do Supabase
jest.mock('@supabase/supabase-js');
const mockSupabase = {
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  single: jest.fn()
};

(createClient as jest.Mock).mockReturnValue(mockSupabase);

describe('TarifaService', () => {
  let tarifaService: TarifaService;
  let mockTarifaEnel: TarifaConcessionaria;

  beforeEach(() => {
    jest.clearAllMocks();
    tarifaService = new TarifaService();
    
    // Mock de tarifa da Enel para testes
    mockTarifaEnel = {
      id: 'enel-rj',
      nome: 'Enel Distribuição Rio',
      estado: 'RJ',
      faixas_consumo: [
        {
          faixa_min: 0,
          faixa_max: 30,
          tusd: 0.30,
          te: 0.25,
          pis: 0.0165,
          cofins: 0.076,
          icms: 0.18,
          cosip: 5.0
        },
        {
          faixa_min: 31,
          faixa_max: 100,
          tusd: 0.35,
          te: 0.28,
          pis: 0.0165,
          cofins: 0.076,
          icms: 0.20,
          cosip: 8.0
        },
        {
          faixa_min: 101,
          faixa_max: 220,
          tusd: 0.40,
          te: 0.32,
          pis: 0.0165,
          cofins: 0.076,
          icms: 0.25,
          cosip: 12.0
        },
        {
          faixa_min: 221,
          faixa_max: 999999,
          tusd: 0.45,
          te: 0.35,
          pis: 0.0165,
          cofins: 0.076,
          icms: 0.25,
          cosip: 15.0
        }
      ],
      custo_disponibilidade: {
        monofasica: 30.0,
        bifasica: 50.0,
        trifasica: 100.0
      },
      data_atualizacao: new Date().toISOString()
    };
  });

  describe('Busca de Tarifas', () => {
    test('deve buscar tarifa do Supabase com sucesso', async () => {
      mockSupabase.single.mockResolvedValue({
        data: mockTarifaEnel,
        error: null
      });

      const tarifa = await tarifaService.buscarTarifa('Enel');

      expect(tarifa).toEqual(mockTarifaEnel);
      expect(mockSupabase.from).toHaveBeenCalledWith('tarifas_concessionarias');
      expect(mockSupabase.eq).toHaveBeenCalledWith('nome', 'Enel');
    });

    test('deve usar tarifa padrão quando Supabase falha', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Tarifa não encontrada' }
      });

      const tarifa = await tarifaService.buscarTarifa('Enel');

      expect(tarifa).toBeDefined();
      expect(tarifa.nome).toContain('Enel');
      expect(tarifa.faixas_consumo.length).toBeGreaterThan(0);
    });

    test('deve usar cache para requisições subsequentes', async () => {
      mockSupabase.single.mockResolvedValue({
        data: mockTarifaEnel,
        error: null
      });

      // Primeira busca
      await tarifaService.buscarTarifa('Enel');
      
      // Segunda busca (deve usar cache)
      await tarifaService.buscarTarifa('Enel');

      // Supabase deve ser chamado apenas uma vez
      expect(mockSupabase.from).toHaveBeenCalledTimes(1);
    });

    test('deve limpar cache quando solicitado', async () => {
      mockSupabase.single.mockResolvedValue({
        data: mockTarifaEnel,
        error: null
      });

      // Primeira busca
      await tarifaService.buscarTarifa('Enel');
      
      // Limpar cache
      tarifaService.limparCache();
      
      // Segunda busca (deve chamar Supabase novamente)
      await tarifaService.buscarTarifa('Enel');

      expect(mockSupabase.from).toHaveBeenCalledTimes(2);
    });
  });

  describe('Listagem de Concessionárias', () => {
    test('deve listar todas as concessionárias disponíveis', () => {
      const concessionarias = tarifaService.listarConcessionarias();

      expect(concessionarias).toContain('Enel');
      expect(concessionarias).toContain('Light');
      expect(concessionarias).toContain('Ceral');
      expect(concessionarias.length).toBeGreaterThan(0);
    });

    test('deve retornar array único de concessionárias', () => {
      const concessionarias = tarifaService.listarConcessionarias();
      const concessionariasUnicas = [...new Set(concessionarias)];

      expect(concessionarias.length).toBe(concessionariasUnicas.length);
    });
  });

  describe('Cálculo de ICMS', () => {
    test('deve calcular ICMS corretamente para consumo baixo', () => {
      const icms = tarifaService['calcularICMS'](50, mockTarifaEnel.faixas_consumo);
      
      // Para 50 kWh: 30 kWh na primeira faixa (18%) + 20 kWh na segunda faixa (20%)
      const icmsEsperado = (30 * 0.18 + 20 * 0.20) / 50;
      
      expect(icms).toBeCloseTo(icmsEsperado, 4);
    });

    test('deve calcular ICMS corretamente para consumo alto', () => {
      const icms = tarifaService['calcularICMS'](300, mockTarifaEnel.faixas_consumo);
      
      // Para 300 kWh: distribuído pelas faixas progressivamente
      const icmsEsperado = (
        30 * 0.18 +    // Primeira faixa
        70 * 0.20 +    // Segunda faixa
        120 * 0.25 +   // Terceira faixa
        80 * 0.25      // Quarta faixa
      ) / 300;
      
      expect(icms).toBeCloseTo(icmsEsperado, 4);
    });

    test('deve retornar 0 para consumo zero', () => {
      const icms = tarifaService['calcularICMS'](0, mockTarifaEnel.faixas_consumo);
      expect(icms).toBe(0);
    });

    test('deve lidar com consumo negativo', () => {
      const icms = tarifaService['calcularICMS'](-100, mockTarifaEnel.faixas_consumo);
      expect(icms).toBe(0);
    });
  });

  describe('Cálculo de COSIP', () => {
    test('deve calcular COSIP corretamente para consumo baixo', () => {
      const cosip = tarifaService['calcularCOSIP'](50, mockTarifaEnel.faixas_consumo);
      
      // Para 50 kWh: 30 kWh na primeira faixa (R$ 5) + 20 kWh na segunda faixa (R$ 8)
      const cosipEsperado = (30 * 5 + 20 * 8) / 50;
      
      expect(cosip).toBeCloseTo(cosipEsperado, 4);
    });

    test('deve calcular COSIP corretamente para consumo alto', () => {
      const cosip = tarifaService['calcularCOSIP'](300, mockTarifaEnel.faixas_consumo);
      
      // Para 300 kWh: distribuído pelas faixas progressivamente
      const cosipEsperado = (
        30 * 5 +       // Primeira faixa
        70 * 8 +       // Segunda faixa
        120 * 12 +     // Terceira faixa
        80 * 15        // Quarta faixa
      ) / 300;
      
      expect(cosip).toBeCloseTo(cosipEsperado, 4);
    });

    test('deve retornar 0 para consumo zero', () => {
      const cosip = tarifaService['calcularCOSIP'](0, mockTarifaEnel.faixas_consumo);
      expect(cosip).toBe(0);
    });

    test('deve lidar com consumo negativo', () => {
      const cosip = tarifaService['calcularCOSIP'](-100, mockTarifaEnel.faixas_consumo);
      expect(cosip).toBe(0);
    });
  });

  describe('Cálculo de Tarifa Final', () => {
    beforeEach(() => {
      mockSupabase.single.mockResolvedValue({
        data: mockTarifaEnel,
        error: null
      });
    });

    test('deve calcular tarifa final corretamente', async () => {
      const resultado = await tarifaService.calcularTarifaFinal('Enel', 100);

      expect(resultado).toBeDefined();
      expect(resultado.tarifa_final_com_impostos).toBeGreaterThan(0);
      expect(resultado.valor_tusd).toBeGreaterThan(0);
      expect(resultado.valor_te).toBeGreaterThan(0);
      expect(resultado.valor_pis).toBeGreaterThan(0);
      expect(resultado.valor_cofins).toBeGreaterThan(0);
      expect(resultado.valor_icms).toBeGreaterThan(0);
      expect(resultado.valor_cosip).toBeGreaterThan(0);
    });

    test('deve aplicar fórmula correta: (TUSD + TE) × (1 + PIS + COFINS) × (1 + ICMS) + COSIP', async () => {
      const consumo = 100;
      const resultado = await tarifaService.calcularTarifaFinal('Enel', consumo);

      // Calcular manualmente para verificar
      const tusdMedio = (30 * 0.30 + 70 * 0.35) / 100;
      const teMedio = (30 * 0.25 + 70 * 0.28) / 100;
      const pisMedio = 0.0165;
      const cofinsMedio = 0.076;
      const icmsMedio = (30 * 0.18 + 70 * 0.20) / 100;
      const cosipMedio = (30 * 5 + 70 * 8) / 100;

      const tarifaEsperada = (tusdMedio + teMedio) * (1 + pisMedio + cofinsMedio) * (1 + icmsMedio) + cosipMedio;

      expect(resultado.tarifa_final_com_impostos).toBeCloseTo(tarifaEsperada, 4);
    });

    test('deve validar consumo mínimo', async () => {
      await expect(tarifaService.calcularTarifaFinal('Enel', 0))
        .rejects.toThrow('Consumo deve ser maior que zero');
    });

    test('deve validar consumo negativo', async () => {
      await expect(tarifaService.calcularTarifaFinal('Enel', -50))
        .rejects.toThrow('Consumo deve ser maior que zero');
    });

    test('deve lidar com concessionária inexistente', async () => {
      mockSupabase.single.mockResolvedValue({
        data: null,
        error: { message: 'Concessionária não encontrada' }
      });

      // Deve usar tarifa padrão
      const resultado = await tarifaService.calcularTarifaFinal('Inexistente', 100);
      
      expect(resultado).toBeDefined();
      expect(resultado.tarifa_final_com_impostos).toBeGreaterThan(0);
    });
  });

  describe('Custo de Disponibilidade', () => {
    test('deve retornar custo correto para ligação monofásica', () => {
      const custo = tarifaService.obterCustoDisponibilidade('monofasica', mockTarifaEnel);
      expect(custo).toBe(30.0);
    });

    test('deve retornar custo correto para ligação bifásica', () => {
      const custo = tarifaService.obterCustoDisponibilidade('bifasica', mockTarifaEnel);
      expect(custo).toBe(50.0);
    });

    test('deve retornar custo correto para ligação trifásica', () => {
      const custo = tarifaService.obterCustoDisponibilidade('trifasica', mockTarifaEnel);
      expect(custo).toBe(100.0);
    });

    test('deve retornar custo padrão para tipo inválido', () => {
      const custo = tarifaService.obterCustoDisponibilidade('invalida' as 'monofasica' | 'bifasica' | 'trifasica', mockTarifaEnel);
      expect(custo).toBe(30.0); // Padrão monofásica
    });
  });

  describe('Validação de Dados', () => {
    test('deve validar estrutura de tarifa', () => {
      const tarifaInvalida = {
        ...mockTarifaEnel,
        faixas_consumo: [] // Sem faixas
      };

      expect(() => {
        tarifaService['calcularICMS'](100, tarifaInvalida.faixas_consumo);
      }).not.toThrow();
    });

    test('deve lidar com faixas de consumo malformadas', () => {
      const faixasInvalidas = [
        {
          faixa_min: 0,
          faixa_max: -10, // Máximo menor que mínimo
          tusd: 0.30,
          te: 0.25,
          pis: 0.0165,
          cofins: 0.076,
          icms: 0.18,
          cosip: 5.0
        }
      ];

      const icms = tarifaService['calcularICMS'](50, faixasInvalidas);
      expect(icms).toBe(0);
    });

    test('deve lidar com valores de tarifa negativos', () => {
      const faixasComValoresNegativos = [
        {
          faixa_min: 0,
          faixa_max: 100,
          tusd: -0.30, // Valor negativo
          te: 0.25,
          pis: 0.0165,
          cofins: 0.076,
          icms: -0.18, // Valor negativo
          cosip: 5.0
        }
      ];

      const icms = tarifaService['calcularICMS'](50, faixasComValoresNegativos);
      expect(icms).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Performance e Cache', () => {
    test('deve executar cálculo em tempo razoável', async () => {
      mockSupabase.single.mockResolvedValue({
        data: mockTarifaEnel,
        error: null
      });

      const inicio = Date.now();
      await tarifaService.calcularTarifaFinal('Enel', 100);
      const duracao = Date.now() - inicio;

      expect(duracao).toBeLessThan(500); // Menos de 500ms
    });

    test('deve manter consistência em múltiplos cálculos', async () => {
      mockSupabase.single.mockResolvedValue({
        data: mockTarifaEnel,
        error: null
      });

      const resultados = [];
      for (let i = 0; i < 5; i++) {
        const resultado = await tarifaService.calcularTarifaFinal('Enel', 100);
        resultados.push(resultado);
      }

      // Todos os resultados devem ser idênticos
      for (let i = 1; i < resultados.length; i++) {
        expect(resultados[i].tarifa_final_com_impostos)
          .toBeCloseTo(resultados[0].tarifa_final_com_impostos, 6);
      }
    });

    test('deve gerenciar cache eficientemente', async () => {
      mockSupabase.single.mockResolvedValue({
        data: mockTarifaEnel,
        error: null
      });

      // Múltiplas chamadas para diferentes concessionárias
      await tarifaService.buscarTarifa('Enel');
      await tarifaService.buscarTarifa('Light');
      await tarifaService.buscarTarifa('Ceral');
      
      // Chamadas repetidas (devem usar cache)
      await tarifaService.buscarTarifa('Enel');
      await tarifaService.buscarTarifa('Light');

      // Verificar que o cache está funcionando
      expect(mockSupabase.from).toHaveBeenCalledTimes(3); // Uma para cada concessionária
    });
  });

  describe('Casos Extremos', () => {
    test('deve lidar com consumo muito alto', async () => {
      mockSupabase.single.mockResolvedValue({
        data: mockTarifaEnel,
        error: null
      });

      const resultado = await tarifaService.calcularTarifaFinal('Enel', 10000);
      
      expect(resultado).toBeDefined();
      expect(Number.isFinite(resultado.tarifa_final_com_impostos)).toBe(true);
      expect(resultado.tarifa_final_com_impostos).toBeGreaterThan(0);
    });

    test('deve lidar com erro de rede do Supabase', async () => {
      mockSupabase.single.mockRejectedValue(new Error('Network error'));

      // Deve usar tarifa padrão
      const resultado = await tarifaService.calcularTarifaFinal('Enel', 100);
      
      expect(resultado).toBeDefined();
      expect(resultado.tarifa_final_com_impostos).toBeGreaterThan(0);
    });

    test('deve lidar com dados corrompidos do Supabase', async () => {
      mockSupabase.single.mockResolvedValue({
        data: {
          nome: 'Enel',
          // Dados incompletos/corrompidos
          faixas_consumo: null
        },
        error: null
      });

      // Deve usar tarifa padrão
      const resultado = await tarifaService.calcularTarifaFinal('Enel', 100);
      
      expect(resultado).toBeDefined();
      expect(resultado.tarifa_final_com_impostos).toBeGreaterThan(0);
    });
  });

  describe('Integração com Tarifas Padrão', () => {
    test('deve ter tarifas padrão para todas as concessionárias listadas', () => {
      const concessionarias = tarifaService.listarConcessionarias();
      
      concessionarias.forEach(concessionaria => {
        expect(() => {
          // Deve conseguir buscar tarifa padrão sem erro
          tarifaService['obterTarifaPadrao'](concessionaria);
        }).not.toThrow();
      });
    });

    test('deve manter estrutura consistente nas tarifas padrão', () => {
      const concessionarias = tarifaService.listarConcessionarias();
      
      concessionarias.forEach(concessionaria => {
        const tarifa = tarifaService['obterTarifaPadrao'](concessionaria);
        
        expect(tarifa.nome).toBeDefined();
        expect(tarifa.estado).toBeDefined();
        expect(Array.isArray(tarifa.faixas_consumo)).toBe(true);
        expect(tarifa.faixas_consumo.length).toBeGreaterThan(0);
        expect(tarifa.custo_disponibilidade).toBeDefined();
        
        // Verificar estrutura das faixas
        tarifa.faixas_consumo.forEach(faixa => {
          expect(typeof faixa.faixa_min).toBe('number');
          expect(typeof faixa.faixa_max).toBe('number');
          expect(typeof faixa.tusd).toBe('number');
          expect(typeof faixa.te).toBe('number');
          expect(typeof faixa.pis).toBe('number');
          expect(typeof faixa.cofins).toBe('number');
          expect(typeof faixa.icms).toBe('number');
          expect(typeof faixa.cosip).toBe('number');
        });
      });
    });
  });
});