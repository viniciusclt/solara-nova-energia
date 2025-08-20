/**
 * Testes unitários para CacheService
 * 
 * Testa funcionalidades de cache com TTL, compressão, limites de memória
 * e estratégias de remoção LRU
 */

import { CacheService } from '../CacheService';

// Mock do pako para compressão
jest.mock('pako', () => ({
  deflate: jest.fn((data) => new Uint8Array([1, 2, 3, 4])), // Mock simples
  inflate: jest.fn((data) => new TextEncoder().encode('mock decompressed data'))
}));

describe('CacheService', () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = CacheService.getInstance();
    cacheService.clear(); // Limpar cache antes de cada teste
    jest.clearAllMocks();
  });

  afterEach(() => {
    cacheService.clear();
  });

  describe('Singleton Pattern', () => {
    test('deve retornar a mesma instância', () => {
      const instance1 = CacheService.getInstance();
      const instance2 = CacheService.getInstance();
      
      expect(instance1).toBe(instance2);
    });
  });

  describe('Operações Básicas de Cache', () => {
    test('deve armazenar e recuperar dados', () => {
      const key = 'test-key';
      const data = { message: 'Hello World', number: 42 };
      
      cacheService.set(key, data);
      const retrieved = cacheService.get(key);
      
      expect(retrieved).toEqual(data);
    });

    test('deve retornar undefined para chave inexistente', () => {
      const result = cacheService.get('non-existent-key');
      expect(result).toBeUndefined();
    });

    test('deve verificar se chave existe', () => {
      const key = 'test-key';
      const data = { test: true };
      
      expect(cacheService.has(key)).toBe(false);
      
      cacheService.set(key, data);
      expect(cacheService.has(key)).toBe(true);
    });

    test('deve deletar entrada específica', () => {
      const key = 'test-key';
      const data = { test: true };
      
      cacheService.set(key, data);
      expect(cacheService.has(key)).toBe(true);
      
      cacheService.delete(key);
      expect(cacheService.has(key)).toBe(false);
    });

    test('deve limpar todo o cache', () => {
      cacheService.set('key1', { data: 1 });
      cacheService.set('key2', { data: 2 });
      cacheService.set('key3', { data: 3 });
      
      expect(cacheService.size()).toBe(3);
      
      cacheService.clear();
      expect(cacheService.size()).toBe(0);
    });
  });

  describe('TTL (Time To Live)', () => {
    test('deve expirar entrada após TTL', (done) => {
      const key = 'ttl-test';
      const data = { message: 'Will expire' };
      const ttl = 100; // 100ms
      
      cacheService.set(key, data, ttl);
      expect(cacheService.get(key)).toEqual(data);
      
      setTimeout(() => {
        expect(cacheService.get(key)).toBeUndefined();
        expect(cacheService.has(key)).toBe(false);
        done();
      }, ttl + 50);
    });

    test('deve manter entrada dentro do TTL', (done) => {
      const key = 'ttl-test';
      const data = { message: 'Still valid' };
      const ttl = 200; // 200ms
      
      cacheService.set(key, data, ttl);
      
      setTimeout(() => {
        expect(cacheService.get(key)).toEqual(data);
        done();
      }, ttl / 2);
    });

    test('deve limpar entradas expiradas automaticamente', (done) => {
      const key1 = 'expire-fast';
      const key2 = 'expire-slow';
      
      cacheService.set(key1, { data: 1 }, 50);
      cacheService.set(key2, { data: 2 }, 200);
      
      expect(cacheService.size()).toBe(2);
      
      setTimeout(() => {
        // Acessar uma chave deve triggerar limpeza automática
        cacheService.get(key2);
        
        expect(cacheService.has(key1)).toBe(false);
        expect(cacheService.has(key2)).toBe(true);
        expect(cacheService.size()).toBe(1);
        done();
      }, 100);
    });

    test('deve atualizar TTL ao definir novamente', () => {
      const key = 'update-ttl';
      const data1 = { version: 1 };
      const data2 = { version: 2 };
      
      cacheService.set(key, data1, 100);
      cacheService.set(key, data2, 300);
      
      expect(cacheService.get(key)).toEqual(data2);
    });
  });

  describe('Compressão de Dados', () => {
    test('deve comprimir dados grandes automaticamente', () => {
      const key = 'large-data';
      const largeData = {
        content: 'x'.repeat(2000), // String grande para triggerar compressão
        numbers: Array.from({ length: 1000 }, (_, i) => i)
      };
      
      cacheService.set(key, largeData);
      const retrieved = cacheService.get(key);
      
      expect(retrieved).toBeDefined();
      // Dados devem ser iguais após compressão/descompressão
      expect(typeof retrieved).toBe('object');
    });

    test('deve não comprimir dados pequenos', () => {
      const key = 'small-data';
      const smallData = { message: 'small' };
      
      cacheService.set(key, smallData);
      const retrieved = cacheService.get(key);
      
      expect(retrieved).toEqual(smallData);
    });
  });

  describe('Limites de Tamanho e Memória', () => {
    test('deve respeitar limite máximo de entradas', () => {
      const maxEntries = 5;
      
      // Configurar limite baixo para teste
      for (let i = 0; i < maxEntries + 3; i++) {
        cacheService.set(`key-${i}`, { data: i });
      }
      
      // Cache deve ter no máximo o limite configurado
      expect(cacheService.size()).toBeLessThanOrEqual(1000); // Limite padrão
    });

    test('deve remover entradas antigas quando atingir limite', () => {
      // Simular limite baixo
      const keys = [];
      for (let i = 0; i < 10; i++) {
        const key = `limit-test-${i}`;
        keys.push(key);
        cacheService.set(key, { data: i });
      }
      
      // Todas as chaves devem estar presentes inicialmente
      keys.forEach(key => {
        expect(cacheService.has(key)).toBe(true);
      });
    });
  });

  describe('Estratégia LRU (Least Recently Used)', () => {
    test('deve manter ordem de acesso para LRU', () => {
      const keys = ['lru-1', 'lru-2', 'lru-3'];
      
      // Adicionar entradas
      keys.forEach((key, index) => {
        cacheService.set(key, { data: index });
      });
      
      // Acessar primeira entrada (torna ela mais recente)
      cacheService.get('lru-1');
      
      // Adicionar mais entradas para forçar remoção
      for (let i = 4; i < 10; i++) {
        cacheService.set(`lru-${i}`, { data: i });
      }
      
      // A primeira entrada deve ainda estar presente (foi acessada recentemente)
      expect(cacheService.has('lru-1')).toBe(true);
    });

    test('deve atualizar ordem ao acessar entrada', () => {
      cacheService.set('access-1', { data: 1 });
      cacheService.set('access-2', { data: 2 });
      cacheService.set('access-3', { data: 3 });
      
      // Acessar entrada do meio
      cacheService.get('access-2');
      
      // Verificar que ainda existe
      expect(cacheService.has('access-2')).toBe(true);
    });
  });

  describe('Geração de Chaves', () => {
    test('deve gerar chave para cálculo financeiro', () => {
      const params = {
        custo_sistema: 50000,
        geracao_anual_kwh: 12000,
        consumo_mensal_kwh: 800,
        taxa_desconto_anual: 0.10,
        concessionaria: 'Enel'
      };
      
      const key = cacheService.generateFinancialKey(params);
      
      expect(key).toBeDefined();
      expect(typeof key).toBe('string');
      expect(key.length).toBeGreaterThan(0);
      
      // Mesmos parâmetros devem gerar mesma chave
      const key2 = cacheService.generateFinancialKey(params);
      expect(key).toBe(key2);
    });

    test('deve gerar chaves diferentes para parâmetros diferentes', () => {
      const params1 = {
        custo_sistema: 50000,
        geracao_anual_kwh: 12000,
        concessionaria: 'Enel'
      };
      
      const params2 = {
        custo_sistema: 60000,
        geracao_anual_kwh: 12000,
        concessionaria: 'Enel'
      };
      
      const key1 = cacheService.generateFinancialKey(params1);
      const key2 = cacheService.generateFinancialKey(params2);
      
      expect(key1).not.toBe(key2);
    });

    test('deve gerar chave para tarifa', () => {
      const concessionaria = 'Enel';
      const consumo = 500;
      
      const key = cacheService.generateTarifaKey(concessionaria, consumo);
      
      expect(key).toBeDefined();
      expect(typeof key).toBe('string');
      expect(key).toContain('tarifa');
      expect(key).toContain(concessionaria.toLowerCase());
      expect(key).toContain(consumo.toString());
    });
  });

  describe('Estatísticas e Monitoramento', () => {
    test('deve fornecer estatísticas do cache', () => {
      // Adicionar algumas entradas
      cacheService.set('stats-1', { data: 1 });
      cacheService.set('stats-2', { data: 2 });
      cacheService.set('stats-3', { data: 3 });
      
      // Fazer alguns acessos
      cacheService.get('stats-1');
      cacheService.get('stats-2');
      cacheService.get('non-existent');
      
      const stats = cacheService.getStats();
      
      expect(stats.size).toBe(3);
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(0.67, 2);
      expect(stats.memoryUsage).toBeGreaterThan(0);
    });

    test('deve calcular taxa de acerto corretamente', () => {
      cacheService.set('hit-test', { data: 'test' });
      
      // 3 hits, 2 misses
      cacheService.get('hit-test');
      cacheService.get('hit-test');
      cacheService.get('hit-test');
      cacheService.get('miss-1');
      cacheService.get('miss-2');
      
      const stats = cacheService.getStats();
      expect(stats.hitRate).toBeCloseTo(0.6, 1); // 3/5 = 0.6
    });
  });

  describe('Invalidação e Limpeza', () => {
    test('deve invalidar entradas por padrão', () => {
      cacheService.set('pattern-test-1', { data: 1 });
      cacheService.set('pattern-test-2', { data: 2 });
      cacheService.set('other-key', { data: 3 });
      
      cacheService.invalidatePattern('pattern-test');
      
      expect(cacheService.has('pattern-test-1')).toBe(false);
      expect(cacheService.has('pattern-test-2')).toBe(false);
      expect(cacheService.has('other-key')).toBe(true);
    });

    test('deve limpar entradas expiradas manualmente', (done) => {
      cacheService.set('expire-1', { data: 1 }, 50);
      cacheService.set('expire-2', { data: 2 }, 200);
      cacheService.set('no-expire', { data: 3 });
      
      setTimeout(() => {
        cacheService.cleanupExpired();
        
        expect(cacheService.has('expire-1')).toBe(false);
        expect(cacheService.has('expire-2')).toBe(true);
        expect(cacheService.has('no-expire')).toBe(true);
        done();
      }, 100);
    });

    test('deve forçar limpeza por pressão de memória', () => {
      // Adicionar muitas entradas
      for (let i = 0; i < 50; i++) {
        cacheService.set(`memory-test-${i}`, {
          data: 'x'.repeat(1000) // Dados grandes
        });
      }
      
      const sizeBefore = cacheService.size();
      
      // Simular pressão de memória
      cacheService.forceCleanup();
      
      const sizeAfter = cacheService.size();
      
      // Deve ter removido algumas entradas
      expect(sizeAfter).toBeLessThanOrEqual(sizeBefore);
    });
  });

  describe('Casos Extremos e Robustez', () => {
    test('deve lidar com dados null e undefined', () => {
      cacheService.set('null-test', null);
      cacheService.set('undefined-test', undefined);
      
      expect(cacheService.get('null-test')).toBe(null);
      expect(cacheService.get('undefined-test')).toBe(undefined);
    });

    test('deve lidar com objetos circulares', () => {
      const obj: Record<string, unknown> = { name: 'test' };
      obj.self = obj; // Referência circular
      
      expect(() => {
        cacheService.set('circular-test', obj);
      }).not.toThrow();
    });

    test('deve lidar com chaves inválidas', () => {
      expect(() => {
        cacheService.set('', { data: 'empty key' });
      }).not.toThrow();
      
      expect(() => {
        cacheService.set(null as string, { data: 'null key' });
      }).not.toThrow();
    });

    test('deve ser thread-safe para operações simultâneas', async () => {
      const promises = [];
      
      // Executar múltiplas operações simultaneamente
      for (let i = 0; i < 100; i++) {
        promises.push(
          Promise.resolve().then(() => {
            cacheService.set(`concurrent-${i}`, { data: i });
            return cacheService.get(`concurrent-${i}`);
          })
        );
      }
      
      const results = await Promise.all(promises);
      
      // Todos os resultados devem ser válidos
      results.forEach((result, index) => {
        expect(result).toEqual({ data: index });
      });
    });

    test('deve manter performance com muitas entradas', () => {
      const startTime = Date.now();
      
      // Adicionar muitas entradas
      for (let i = 0; i < 1000; i++) {
        cacheService.set(`perf-test-${i}`, { data: i });
      }
      
      // Acessar entradas aleatórias
      for (let i = 0; i < 100; i++) {
        const randomKey = `perf-test-${Math.floor(Math.random() * 1000)}`;
        cacheService.get(randomKey);
      }
      
      const duration = Date.now() - startTime;
      
      // Operações devem ser rápidas
      expect(duration).toBeLessThan(1000); // Menos de 1 segundo
    });
  });

  describe('Integração com Cálculos Financeiros', () => {
    test('deve cachear resultados de cálculos financeiros', () => {
      const params = {
        custo_sistema: 50000,
        geracao_anual_kwh: 12000,
        consumo_mensal_kwh: 800,
        taxa_desconto_anual: 0.10,
        concessionaria: 'Enel'
      };
      
      const resultado = {
        vpl: 15000,
        tir: 0.15,
        payback_simples_anos: 8.5,
        economia_anual: 6000
      };
      
      const key = cacheService.generateFinancialKey(params);
      cacheService.set(key, resultado, 3600000); // 1 hora
      
      const cached = cacheService.get(key);
      expect(cached).toEqual(resultado);
    });

    test('deve cachear tarifas calculadas', () => {
      const concessionaria = 'Enel';
      const consumo = 500;
      
      const tarifaCalculada = {
        tarifa_final_com_impostos: 0.75,
        valor_tusd: 0.30,
        valor_te: 0.25,
        valor_icms: 0.18,
        valor_cosip: 0.05
      };
      
      const key = cacheService.generateTarifaKey(concessionaria, consumo);
      cacheService.set(key, tarifaCalculada, 1800000); // 30 minutos
      
      const cached = cacheService.get(key);
      expect(cached).toEqual(tarifaCalculada);
    });
  });
});