import { supabase } from '@/integrations/supabase/client';
import { logWarn, logError } from '@/utils/secureLogger';
import { cacheService } from './CacheService';
import type { TarifaConcessionaria, CalculoTarifa } from './TarifaService';

// Cache keys para diferentes tipos de dados
const CACHE_KEYS = {
  TARIFA: (id: string) => `tarifa:${id}`,
  CONCESSIONARIAS: 'concessionarias:all',
  CALCULO: (consumo: number, concessionariaId: string, incluirFioB: boolean) => 
    `calculo:${concessionariaId}:${consumo}:${incluirFioB}`,
  CUSTO_DISPONIBILIDADE: (tipo: string, concessionariaId: string) => 
    `custo_disponibilidade:${concessionariaId}:${tipo}`
} as const;

// TTL para diferentes tipos de cache (em segundos)
const CACHE_TTL = {
  TARIFA: 24 * 60 * 60, // 24 horas
  CONCESSIONARIAS: 12 * 60 * 60, // 12 horas
  CALCULO: 60 * 60, // 1 hora
  CUSTO_DISPONIBILIDADE: 24 * 60 * 60 // 24 horas
} as const;

// Tarifas padrão das concessionárias do RJ (2025)
const TARIFAS_PADRAO: Record<string, TarifaConcessionaria> = {
  'enel-rj': {
    id: 'enel-rj',
    nome: 'Enel Distribuição Rio',
    estado: 'RJ',
    tusd_fio_a: 0.4972349297,
    tusd_fio_b: 0.366062,
    te: 0.366062,
    pis: 0.0107,
    cofins: 0.0494,
    icms_faixa_1: 0.18,
    icms_faixa_2: 0.20,
    icms_faixa_3: 0.31,
    cosip_faixa_1: 7.97,
    cosip_faixa_2: 15.94,
    cosip_faixa_3: 31.86,
    cosip_faixa_4: 63.72,
    cosip_faixa_5: 127.44,
    custo_disponibilidade_monofasico: 30,
    custo_disponibilidade_bifasico: 50,
    custo_disponibilidade_trifasico: 100,
    data_vigencia: '2025-01-01'
  },
  'light': {
    id: 'light',
    nome: 'Light SESA',
    estado: 'RJ',
    tusd_fio_a: 0.4850000000,
    tusd_fio_b: 0.3580000000,
    te: 0.3580000000,
    pis: 0.0107,
    cofins: 0.0494,
    icms_faixa_1: 0.18,
    icms_faixa_2: 0.20,
    icms_faixa_3: 0.31,
    cosip_faixa_1: 8.50,
    cosip_faixa_2: 17.00,
    cosip_faixa_3: 34.00,
    cosip_faixa_4: 68.00,
    cosip_faixa_5: 136.00,
    custo_disponibilidade_monofasico: 30,
    custo_disponibilidade_bifasico: 50,
    custo_disponibilidade_trifasico: 100,
    data_vigencia: '2025-01-01'
  },
  'ceral': {
    id: 'ceral',
    nome: 'Ceral - Companhia Energética Rio das Antas',
    estado: 'RJ',
    tusd_fio_a: 0.4650000000,
    tusd_fio_b: 0.3450000000,
    te: 0.3450000000,
    pis: 0.0107,
    cofins: 0.0494,
    icms_faixa_1: 0.18,
    icms_faixa_2: 0.20,
    icms_faixa_3: 0.31,
    cosip_faixa_1: 7.50,
    cosip_faixa_2: 15.00,
    cosip_faixa_3: 30.00,
    cosip_faixa_4: 60.00,
    cosip_faixa_5: 120.00,
    custo_disponibilidade_monofasico: 30,
    custo_disponibilidade_bifasico: 50,
    custo_disponibilidade_trifasico: 100,
    data_vigencia: '2025-01-01'
  }
};

export class TarifaServiceOptimized {
  private static instance: TarifaServiceOptimized;

  private constructor() {
    // Inicializar cache com tarifas padrão
    this.initializeDefaultTarifas();
  }

  public static getInstance(): TarifaServiceOptimized {
    if (!TarifaServiceOptimized.instance) {
      TarifaServiceOptimized.instance = new TarifaServiceOptimized();
    }
    return TarifaServiceOptimized.instance;
  }

  /**
   * Inicializa cache com tarifas padrão
   */
  private async initializeDefaultTarifas(): Promise<void> {
    try {
      for (const tarifa of Object.values(TARIFAS_PADRAO)) {
        await cacheService.set(
          CACHE_KEYS.TARIFA(tarifa.id),
          tarifa,
          CACHE_TTL.TARIFA,
          ['tarifas', `tarifa:${tarifa.id}`]
        );
      }
    } catch (error) {
      logWarn('Erro ao inicializar cache de tarifas padrão', {
        service: 'TarifaServiceOptimized',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * Busca tarifa por concessionária com cache otimizado
   */
  public async getTarifa(concessionariaId: string): Promise<TarifaConcessionaria | null> {
    const cacheKey = CACHE_KEYS.TARIFA(concessionariaId);
    
    return await cacheService.getOrSet(
      cacheKey,
      async () => {
        try {
          // Tenta buscar no Supabase
          const { data, error } = await supabase
            .from('tarifas_concessionarias')
            .select('*')
            .eq('id', concessionariaId)
            .single();

          if (error || !data) {
            // Se não encontrar, usa tarifa padrão
            return TARIFAS_PADRAO[concessionariaId] || null;
          }

          return data;
        } catch (error) {
          logWarn('Erro ao buscar tarifa, usando padrão', {
            service: 'TarifaServiceOptimized',
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            concessionariaId,
            action: 'getTarifa'
          });
          return TARIFAS_PADRAO[concessionariaId] || null;
        }
      },
      CACHE_TTL.TARIFA,
      ['tarifas', `tarifa:${concessionariaId}`]
    );
  }

  /**
   * Lista todas as concessionárias disponíveis com cache
   */
  public async getConcessionarias(): Promise<TarifaConcessionaria[]> {
    return await cacheService.getOrSet(
      CACHE_KEYS.CONCESSIONARIAS,
      async () => {
        try {
          const { data, error } = await supabase
            .from('tarifas_concessionarias')
            .select('*')
            .order('nome');

          if (error || !data) {
            return Object.values(TARIFAS_PADRAO);
          }

          return data;
        } catch (error) {
          logWarn('Erro ao buscar concessionárias, usando padrão', {
            service: 'TarifaServiceOptimized',
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            action: 'getConcessionarias'
          });
          return Object.values(TARIFAS_PADRAO);
        }
      },
      CACHE_TTL.CONCESSIONARIAS,
      ['tarifas', 'concessionarias']
    );
  }

  /**
   * Calcula ICMS por faixa de consumo (Rio de Janeiro)
   */
  private calcularICMSPorFaixa(
    consumo_kwh: number, 
    tarifa: TarifaConcessionaria
  ): number {
    // Faixas progressivas do ICMS no RJ
    if (consumo_kwh <= 50) {
      return 0; // Isento até 50 kWh (tarifa social)
    } else if (consumo_kwh <= 100) {
      return tarifa.icms_faixa_1 || 0.18; // 18% para faixa 51-100 kWh
    } else if (consumo_kwh <= 200) {
      return tarifa.icms_faixa_2 || 0.20; // 20% para faixa 101-200 kWh
    } else {
      return tarifa.icms_faixa_3 || 0.31; // 31% acima de 200 kWh
    }
  }

  /**
   * Calcula COSIP por faixa de consumo
   */
  private calcularCOSIPPorFaixa(
    consumo_kwh: number, 
    tarifa: TarifaConcessionaria
  ): number {
    // COSIP é valor fixo por faixa, não percentual
    if (consumo_kwh <= 30) {
      return tarifa.cosip_faixa_1 || 0;
    } else if (consumo_kwh <= 50) {
      return tarifa.cosip_faixa_2 || 3.11;
    } else if (consumo_kwh <= 100) {
      return tarifa.cosip_faixa_3 || 6.22;
    } else if (consumo_kwh <= 200) {
      return tarifa.cosip_faixa_4 || 12.44;
    } else if (consumo_kwh <= 300) {
      return tarifa.cosip_faixa_5 || 18.66;
    } else if (consumo_kwh <= 400) {
      return 24.88; // Nova faixa
    } else if (consumo_kwh <= 500) {
      return 31.10; // Nova faixa
    } else {
      return 31.86; // Nova faixa
    }
  }

  /**
   * Calcula tarifa final usando fórmula oficial ANEEL com cache
   */
  public async calcularTarifaFinal(
    consumo_kwh: number,
    concessionariaId: string,
    incluir_fio_b: boolean = true
  ): Promise<CalculoTarifa> {
    // Validação de entrada
    if (consumo_kwh <= 0) {
      throw new Error('Consumo deve ser maior que zero');
    }
    
    if (!concessionariaId) {
      throw new Error('ID da concessionária é obrigatório');
    }

    const cacheKey = CACHE_KEYS.CALCULO(consumo_kwh, concessionariaId, incluir_fio_b);
    
    return await cacheService.getOrSet(
      cacheKey,
      async () => {
        // Busca dados da concessionária
        const concessionaria = await this.getTarifa(concessionariaId);
        
        if (!concessionaria) {
          throw new Error(`Concessionária ${concessionariaId} não encontrada`);
        }

        // Componentes base da tarifa
        const tusd_fio_a = concessionaria.tusd_fio_a || 0;
        const tusd_fio_b = incluir_fio_b ? (concessionaria.tusd_fio_b || 0) : 0;
        const te = concessionaria.te || 0;
        
        // Base energética (sem impostos)
        const base_energetica = tusd_fio_a + tusd_fio_b + te;
        
        // Impostos federais (PIS + COFINS)
        const pis_cofins = (concessionaria.pis || 0) + (concessionaria.cofins || 0);
        
        // ICMS por faixa de consumo (RJ)
        const icms = this.calcularICMSPorFaixa(consumo_kwh, concessionaria);
        
        // COSIP por faixa de consumo (valor fixo, não percentual)
        const cosip_valor = this.calcularCOSIPPorFaixa(consumo_kwh, concessionaria);
        
        // Aplicar fórmula oficial ANEEL
        const tarifa_com_impostos = base_energetica * (1 + pis_cofins) * (1 + icms);
        const tarifa_final = tarifa_com_impostos + (cosip_valor / Math.max(consumo_kwh, 1));
        
        // Validação do resultado
        if (tarifa_final < 0.5 || tarifa_final > 2.0) {
          console.warn(`Tarifa calculada fora da faixa esperada: R$ ${tarifa_final.toFixed(4)}/kWh`);
        }
        
        return {
          tarifa_sem_fv: tarifa_final,
          tarifa_com_fv: incluir_fio_b ? 
            this.calcularTarifaSemFioB(consumo_kwh, concessionaria, cosip_valor) : 
            tarifa_final,
          tusd_total: tusd_fio_a + tusd_fio_b,
          te_total: te,
          impostos_total: base_energetica * (pis_cofins + icms + (pis_cofins * icms)),
          cosip_total: cosip_valor,
          base_calculo: {
            base_energetica,
            pis_cofins_percentual: pis_cofins,
            icms_percentual: icms,
            cosip_valor
          }
        };
      },
      CACHE_TTL.CALCULO,
      ['calculos', `tarifa:${concessionariaId}`, 'tarifas']
    );
  }

  /**
   * Calcula tarifa sem Fio B (para sistemas fotovoltaicos)
   */
  private calcularTarifaSemFioB(
    consumo_kwh: number,
    concessionaria: TarifaConcessionaria,
    cosip_valor: number
  ): number {
    const base_sem_fio_b = concessionaria.tusd_fio_a + concessionaria.te;
    const pis_cofins = concessionaria.pis + concessionaria.cofins;
    const icms = this.calcularICMSPorFaixa(consumo_kwh, concessionaria);
    
    const tarifa_com_impostos = base_sem_fio_b * (1 + pis_cofins) * (1 + icms);
    return tarifa_com_impostos + (cosip_valor / Math.max(consumo_kwh, 1));
  }

  /**
   * Obtém custo de disponibilidade baseado no tipo de ligação com cache
   */
  public async getCustoDisponibilidade(
    tipo_ligacao: 'monofasico' | 'bifasico' | 'trifasico',
    concessionariaId: string
  ): Promise<number> {
    const cacheKey = CACHE_KEYS.CUSTO_DISPONIBILIDADE(tipo_ligacao, concessionariaId);
    
    return await cacheService.getOrSet(
      cacheKey,
      async () => {
        const concessionaria = await this.getTarifa(concessionariaId);
        
        if (!concessionaria) {
          throw new Error(`Concessionária ${concessionariaId} não encontrada`);
        }

        switch (tipo_ligacao) {
          case 'monofasico':
            return concessionaria.custo_disponibilidade_monofasico;
          case 'bifasico':
            return concessionaria.custo_disponibilidade_bifasico;
          case 'trifasico':
            return concessionaria.custo_disponibilidade_trifasico;
          default:
            return concessionaria.custo_disponibilidade_monofasico;
        }
      },
      CACHE_TTL.CUSTO_DISPONIBILIDADE,
      ['custos_disponibilidade', `tarifa:${concessionariaId}`]
    );
  }

  /**
   * Limpa cache de tarifas e recarrega padrões
   */
  public async limparCache(): Promise<void> {
    try {
      // Invalida todos os caches relacionados a tarifas
      await cacheService.invalidateByDependency('tarifas');
      await cacheService.invalidateByDependency('calculos');
      await cacheService.invalidateByDependency('concessionarias');
      await cacheService.invalidateByDependency('custos_disponibilidade');
      
      // Recarrega tarifas padrão
      await this.initializeDefaultTarifas();
    } catch (error) {
      logError('Erro ao limpar cache de tarifas', {
        service: 'TarifaServiceOptimized',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }

  /**
   * Obtém estatísticas do cache
   */
  public getCacheStats() {
    return cacheService.getStats();
  }

  /**
   * Pré-carrega tarifas mais utilizadas
   */
  public async preloadCommonTarifas(): Promise<void> {
    const commonTarifas = ['enel-rj', 'light', 'ceral'];
    
    try {
      await Promise.all(
        commonTarifas.map(id => this.getTarifa(id))
      );
    } catch (error) {
      logWarn('Erro ao pré-carregar tarifas comuns', {
        service: 'TarifaServiceOptimized',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
    }
  }
}

export default TarifaServiceOptimized;