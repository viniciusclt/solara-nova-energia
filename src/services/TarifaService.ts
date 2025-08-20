import { supabase } from '@/integrations/supabase/client';
import { logWarn, logError } from '@/utils/secureLogger';

// Interfaces para estrutura de tarifas
export interface TarifaConcessionaria {
  id: string;
  nome: string;
  estado: string;
  tusd_fio_a: number;
  tusd_fio_b: number;
  te: number;
  pis: number;
  cofins: number;
  icms_faixa_1: number; // até 100 kWh
  icms_faixa_2: number; // 101-200 kWh
  icms_faixa_3: number; // acima de 200 kWh
  cosip_faixa_1: number; // até 30 kWh
  cosip_faixa_2: number; // 31-100 kWh
  cosip_faixa_3: number; // 101-220 kWh
  cosip_faixa_4: number; // 221-1000 kWh
  cosip_faixa_5: number; // acima de 1000 kWh
  custo_disponibilidade_monofasico: number;
  custo_disponibilidade_bifasico: number;
  custo_disponibilidade_trifasico: number;
  data_vigencia: string;
}

export interface CalculoTarifa {
  tarifa_sem_fv: number;
  tarifa_com_fv: number;
  tusd_total: number;
  te_total: number;
  impostos_total: number;
  cosip_total: number;
  base_calculo: {
    base_energetica: number;
    pis_cofins_percentual: number;
    icms_percentual: number;
    cosip_valor: number;
   };
 }

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
    icms_faixa_1: 0.18, // 18% para faixa 51-100 kWh
    icms_faixa_2: 0.20, // 20% de 101-200 kWh
    icms_faixa_3: 0.31, // 31% acima de 200 kWh
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

export class TarifaService {
  private static instance: TarifaService;
  private tarifasCache: Map<string, TarifaConcessionaria> = new Map();

  private constructor() {
    // Carregar tarifas padrão no cache
    Object.values(TARIFAS_PADRAO).forEach(tarifa => {
      this.tarifasCache.set(tarifa.id, tarifa);
    });
  }

  public static getInstance(): TarifaService {
    if (!TarifaService.instance) {
      TarifaService.instance = new TarifaService();
    }
    return TarifaService.instance;
  }

  /**
   * Busca tarifa por concessionária
   */
  public async getTarifa(concessionariaId: string): Promise<TarifaConcessionaria | null> {
    // Primeiro verifica o cache
    if (this.tarifasCache.has(concessionariaId)) {
      return this.tarifasCache.get(concessionariaId)!;
    }

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

      // Adiciona ao cache
      this.tarifasCache.set(concessionariaId, data);
      return data;
    } catch (error) {
      logWarn('Erro ao buscar tarifa, usando padrão', {
        service: 'TarifaService',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        concessionariaId,
        action: 'getTarifa'
      });
      return TARIFAS_PADRAO[concessionariaId] || null;
    }
  }

  /**
   * Lista todas as concessionárias disponíveis
   */
  public async getConcessionarias(): Promise<TarifaConcessionaria[]> {
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
        service: 'TarifaService',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        action: 'getConcessionarias'
      });
      return Object.values(TARIFAS_PADRAO);
    }
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
   * Calcula tarifa final usando fórmula oficial ANEEL
   * Fórmula: (TUSD + TE) × (1 + PIS/COFINS) × (1 + ICMS) + COSIP/kWh
   */
  public calcularTarifaFinal(
    consumo_kwh: number,
    concessionaria: TarifaConcessionaria,
    incluir_fio_b: boolean = true
  ): CalculoTarifa {
    // Validação de entrada
    if (consumo_kwh <= 0) {
      throw new Error('Consumo deve ser maior que zero');
    }
    
    if (!concessionaria) {
      throw new Error('Dados da concessionária são obrigatórios');
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
   * Obtém custo de disponibilidade baseado no tipo de ligação
   */
  public getCustoDisponibilidade(
    tipo_ligacao: 'monofasico' | 'bifasico' | 'trifasico',
    concessionaria: TarifaConcessionaria
  ): number {
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
  }

  /**
   * Atualiza cache de tarifas
   */
  public limparCache(): void {
    this.tarifasCache.clear();
    // Recarrega tarifas padrão
    Object.values(TARIFAS_PADRAO).forEach(tarifa => {
      this.tarifasCache.set(tarifa.id, tarifa);
    });
  }
}

export default TarifaService;