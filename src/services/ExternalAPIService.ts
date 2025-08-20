import { CacheService } from './CacheService';
import { supabase } from '../integrations/supabase/client';
import { logError } from '../utils/logger';

export interface WeatherData {
  location: string;
  irradiacao_solar: number; // kWh/m²/dia
  temperatura_media: number; // °C
  umidade_relativa: number; // %
  velocidade_vento: number; // m/s
  dias_chuva_ano: number;
  latitude: number;
  longitude: number;
  fonte: 'api' | 'default';
}

export interface EquipmentPrice {
  tipo: 'modulo' | 'inversor' | 'estrutura' | 'cabo' | 'protecao';
  marca: string;
  modelo: string;
  potencia?: number;
  preco_unitario: number;
  preco_por_wp?: number;
  disponibilidade: 'disponivel' | 'sob_consulta' | 'indisponivel';
  prazo_entrega: number; // dias
  garantia: number; // anos
  fonte: 'api' | 'default';
  ultima_atualizacao: Date;
}

export interface TarifaANEEL {
  concessionaria: string;
  estado: string;
  tarifa_convencional: number;
  tarifa_branca_ponta: number;
  tarifa_branca_intermediaria: number;
  tarifa_branca_fora_ponta: number;
  bandeira_verde: number;
  bandeira_amarela: number;
  bandeira_vermelha_1: number;
  bandeira_vermelha_2: number;
  vigencia_inicio: Date;
  vigencia_fim: Date;
}

export class ExternalAPIService {
  private static instance: ExternalAPIService;
  private cacheService: CacheService;
  private readonly WEATHER_API_KEY = import.meta.env.VITE_WEATHER_API_KEY;
  private readonly EQUIPMENT_API_KEY = import.meta.env.VITE_EQUIPMENT_API_KEY;
  private readonly ANEEL_API_URL = 'https://dadosabertos.aneel.gov.br/api/3/action';

  private constructor() {
    this.cacheService = CacheService.getInstance();
  }

  public static getInstance(): ExternalAPIService {
    if (!ExternalAPIService.instance) {
      ExternalAPIService.instance = new ExternalAPIService();
    }
    return ExternalAPIService.instance;
  }

  /**
   * Obtém dados meteorológicos para uma localização
   */
  public async getWeatherData(latitude: number, longitude: number): Promise<WeatherData> {
    const cacheKey = `weather_${latitude}_${longitude}`;
    const cached = this.cacheService.get<WeatherData>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      // Tentar API externa primeiro
      if (this.WEATHER_API_KEY) {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${this.WEATHER_API_KEY}&units=metric`
        );
        
        if (response.ok) {
          const data = await response.json();
          
          // Buscar dados de irradiação solar do INMET/CPTEC
          const irradiacaoData = await this.getIrradiacaoSolar(latitude, longitude);
          
          const weatherData: WeatherData = {
            location: data.name || `${latitude}, ${longitude}`,
            irradiacao_solar: irradiacaoData.irradiacao_solar,
            temperatura_media: data.main.temp,
            umidade_relativa: data.main.humidity,
            velocidade_vento: data.wind?.speed || 2.5,
            dias_chuva_ano: irradiacaoData.dias_chuva_ano,
            latitude,
            longitude,
            fonte: 'api'
          };
          
          // Cache por 24 horas
          this.cacheService.set(cacheKey, weatherData, 86400000);
          return weatherData;
        }
      }
    } catch (error) {
      logError('Erro ao buscar dados meteorológicos da API', 'ExternalAPIService', { error: error instanceof Error ? error.message : String(error) });
    }

    // Fallback para dados padrão baseados na região do Brasil
    const defaultData = this.getDefaultWeatherData(latitude, longitude);
    
    // Cache dados padrão por 1 hora
    this.cacheService.set(cacheKey, defaultData, 3600000);
    return defaultData;
  }

  /**
   * Obtém dados de irradiação solar específicos
   */
  private async getIrradiacaoSolar(latitude: number, longitude: number): Promise<{
    irradiacao_solar: number;
    dias_chuva_ano: number;
  }> {
    try {
      // Tentar API do INMET ou dados do Atlas Solarimétrico
      const response = await fetch(
        `https://api.inmet.gov.br/estacao/dados/${latitude}/${longitude}`
      );
      
      if (response.ok) {
        const data = await response.json();
        return {
          irradiacao_solar: data.irradiacao_global || this.getDefaultIrradiacao(latitude, longitude),
          dias_chuva_ano: data.dias_chuva || this.getDefaultDiasChuva(latitude, longitude)
        };
      }
    } catch (error) {
      logError('Erro ao buscar dados de irradiação', 'ExternalAPIService', { error: error instanceof Error ? error.message : String(error) });
    }

    return {
      irradiacao_solar: this.getDefaultIrradiacao(latitude, longitude),
      dias_chuva_ano: this.getDefaultDiasChuva(latitude, longitude)
    };
  }

  /**
   * Dados meteorológicos padrão baseados na região do Brasil
   */
  private getDefaultWeatherData(latitude: number, longitude: number): WeatherData {
    // Regiões do Brasil com dados médios
    let irradiacao = 5.0; // kWh/m²/dia (média nacional)
    let temperatura = 25; // °C
    let umidade = 70; // %
    let diasChuva = 120;
    let location = 'Brasil';

    // Nordeste (maior irradiação)
    if (latitude > -15 && latitude < -3) {
      irradiacao = 5.8;
      temperatura = 28;
      umidade = 65;
      diasChuva = 80;
      location = 'Nordeste';
    }
    // Sudeste
    else if (latitude > -25 && latitude < -15) {
      irradiacao = 5.2;
      temperatura = 24;
      umidade = 72;
      diasChuva = 130;
      location = 'Sudeste';
    }
    // Sul (menor irradiação)
    else if (latitude > -35 && latitude < -25) {
      irradiacao = 4.5;
      temperatura = 20;
      umidade = 75;
      diasChuva = 150;
      location = 'Sul';
    }
    // Centro-Oeste
    else if (latitude > -20 && latitude < -10) {
      irradiacao = 5.5;
      temperatura = 26;
      umidade = 68;
      diasChuva = 110;
      location = 'Centro-Oeste';
    }
    // Norte
    else if (latitude > -5 && latitude < 5) {
      irradiacao = 5.3;
      temperatura = 27;
      umidade = 80;
      diasChuva = 180;
      location = 'Norte';
    }

    return {
      location,
      irradiacao_solar: irradiacao,
      temperatura_media: temperatura,
      umidade_relativa: umidade,
      velocidade_vento: 2.5,
      dias_chuva_ano: diasChuva,
      latitude,
      longitude,
      fonte: 'default'
    };
  }

  private getDefaultIrradiacao(latitude: number, longitude: number): number {
    // Baseado no Atlas Solarimétrico do Brasil
    if (latitude > -15 && latitude < -3) return 5.8; // Nordeste
    if (latitude > -25 && latitude < -15) return 5.2; // Sudeste
    if (latitude > -35 && latitude < -25) return 4.5; // Sul
    if (latitude > -20 && latitude < -10) return 5.5; // Centro-Oeste
    if (latitude > -5 && latitude < 5) return 5.3; // Norte
    return 5.0; // Média nacional
  }

  private getDefaultDiasChuva(latitude: number, longitude: number): number {
    if (latitude > -15 && latitude < -3) return 80; // Nordeste
    if (latitude > -25 && latitude < -15) return 130; // Sudeste
    if (latitude > -35 && latitude < -25) return 150; // Sul
    if (latitude > -20 && latitude < -10) return 110; // Centro-Oeste
    if (latitude > -5 && latitude < 5) return 180; // Norte
    return 120; // Média nacional
  }

  /**
   * Obtém preços de equipamentos
   */
  public async getEquipmentPrices(tipo: string, potencia?: number): Promise<EquipmentPrice[]> {
    const cacheKey = `equipment_${tipo}_${potencia || 'all'}`;
    const cached = this.cacheService.get<EquipmentPrice[]>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      // Tentar API de fornecedores
      if (this.EQUIPMENT_API_KEY) {
        const response = await fetch(
          `https://api.equipamentos-solares.com.br/precos?tipo=${tipo}&potencia=${potencia}`,
          {
            headers: {
              'Authorization': `Bearer ${this.EQUIPMENT_API_KEY}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          const prices = data.map((item: unknown) => ({
            ...item,
            fonte: 'api',
            ultima_atualizacao: new Date()
          }));
          
          // Cache por 6 horas
          this.cacheService.set(cacheKey, prices, 21600000);
          return prices;
        }
      }
    } catch (error) {
      logError('Erro ao buscar preços de equipamentos', 'ExternalAPIService', { error: error instanceof Error ? error.message : String(error) });
    }

    // Fallback para dados padrão
    const defaultPrices = this.getDefaultEquipmentPrices(tipo, potencia);
    
    // Cache dados padrão por 1 hora
    this.cacheService.set(cacheKey, defaultPrices, 3600000);
    return defaultPrices;
  }

  /**
   * Preços padrão de equipamentos (baseados no mercado brasileiro 2025)
   */
  private getDefaultEquipmentPrices(tipo: string, potencia?: number): EquipmentPrice[] {
    const now = new Date();
    
    switch (tipo) {
      case 'modulo':
        return [
          {
            tipo: 'modulo',
            marca: 'Canadian Solar',
            modelo: 'CS3W-540P',
            potencia: 540,
            preco_unitario: 850,
            preco_por_wp: 1.57,
            disponibilidade: 'disponivel',
            prazo_entrega: 15,
            garantia: 25,
            fonte: 'default',
            ultima_atualizacao: now
          },
          {
            tipo: 'modulo',
            marca: 'Jinko Solar',
            modelo: 'JKM545M-7RL3',
            potencia: 545,
            preco_unitario: 870,
            preco_por_wp: 1.60,
            disponibilidade: 'disponivel',
            prazo_entrega: 20,
            garantia: 25,
            fonte: 'default',
            ultima_atualizacao: now
          }
        ];
      
      case 'inversor':
        return [
          {
            tipo: 'inversor',
            marca: 'Fronius',
            modelo: 'Primo 8.2-1',
            potencia: 8200,
            preco_unitario: 4500,
            preco_por_wp: 0.55,
            disponibilidade: 'disponivel',
            prazo_entrega: 25,
            garantia: 10,
            fonte: 'default',
            ultima_atualizacao: now
          },
          {
            tipo: 'inversor',
            marca: 'WEG',
            modelo: 'SIW500H',
            potencia: 5000,
            preco_unitario: 2800,
            preco_por_wp: 0.56,
            disponibilidade: 'disponivel',
            prazo_entrega: 15,
            garantia: 10,
            fonte: 'default',
            ultima_atualizacao: now
          }
        ];
      
      default:
        return [];
    }
  }

  /**
   * Atualiza tarifas da ANEEL
   */
  public async atualizarTarifasANEEL(): Promise<void> {
    try {
      const response = await fetch(`${this.ANEEL_API_URL}/datastore_search`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          resource_id: 'b1bd71e7-d0ad-4214-9053-cbd58e9564a7', // ID do dataset de tarifas
          limit: 1000
        })
      });

      if (response.ok) {
        const data = await response.json();
        
        for (const record of data.result.records) {
          const tarifa: TarifaANEEL = {
            concessionaria: record.DscConcessionaria,
            estado: record.SigUF,
            tarifa_convencional: parseFloat(record.VlrTarifa),
            tarifa_branca_ponta: parseFloat(record.VlrTarifaBrancaPonta || record.VlrTarifa),
            tarifa_branca_intermediaria: parseFloat(record.VlrTarifaBrancaIntermediaria || record.VlrTarifa),
            tarifa_branca_fora_ponta: parseFloat(record.VlrTarifaBrancaForaPonta || record.VlrTarifa),
            bandeira_verde: 0,
            bandeira_amarela: 0.01874,
            bandeira_vermelha_1: 0.03971,
            bandeira_vermelha_2: 0.09492,
            vigencia_inicio: new Date(record.DatInicioVigencia),
            vigencia_fim: new Date(record.DatFimVigencia)
          };

          // Salvar no Supabase
          await supabase
            .from('tarifas_aneel')
            .upsert(tarifa, {
              onConflict: 'concessionaria,vigencia_inicio'
            });
        }

        console.log('Tarifas ANEEL atualizadas com sucesso');
      }
    } catch (error) {
      logError('Erro ao atualizar tarifas ANEEL', 'ExternalAPIService', { error: error instanceof Error ? error.message : String(error) });
      throw error;
    }
  }

  /**
   * Verifica conectividade com APIs externas
   */
  public async verificarConectividade(): Promise<{
    weather: boolean;
    equipment: boolean;
    aneel: boolean;
  }> {
    const results = {
      weather: false,
      equipment: false,
      aneel: false
    };

    // Testar API meteorológica
    try {
      if (this.WEATHER_API_KEY) {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=-23.5505&lon=-46.6333&appid=${this.WEATHER_API_KEY}`,
          { signal: AbortSignal.timeout(5000) }
        );
        results.weather = response.ok;
      }
    } catch (error) {
      logError('API meteorológica indisponível', 'ExternalAPIService', { error: error instanceof Error ? error.message : String(error) });
    }

    // Testar API de equipamentos
    try {
      if (this.EQUIPMENT_API_KEY) {
        const response = await fetch(
          'https://api.equipamentos-solares.com.br/status',
          { 
            headers: { 'Authorization': `Bearer ${this.EQUIPMENT_API_KEY}` },
            signal: AbortSignal.timeout(5000)
          }
        );
        results.equipment = response.ok;
      }
    } catch (error) {
      logError('API de equipamentos indisponível', 'ExternalAPIService', { error: error instanceof Error ? error.message : String(error) });
    }

    // Testar API ANEEL
    try {
      const response = await fetch(
        `${this.ANEEL_API_URL}/package_list`,
        { signal: AbortSignal.timeout(5000) }
      );
      results.aneel = response.ok;
    } catch (error) {
      logError('API ANEEL indisponível', 'ExternalAPIService', { error: error instanceof Error ? error.message : String(error) });
    }

    return results;
  }

  /**
   * Limpa cache de APIs externas
   */
  public limparCache(): void {
    const keys = this.cacheService.getKeys();
    const externalKeys = keys.filter(key => 
      key.startsWith('weather_') || 
      key.startsWith('equipment_') || 
      key.startsWith('aneel_')
    );
    
    externalKeys.forEach(key => this.cacheService.delete(key));
  }
}