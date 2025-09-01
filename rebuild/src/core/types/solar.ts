/**
 * Tipos base para o módulo Fotovoltaico (Simulação)
 * Escopo: contratos de entrada/saída do serviço de cálculo e estruturas auxiliares.
 */

// Contexto de localização e clima
export type LocationInfo = {
  country?: string; // default: BR
  state?: string; // UF
  city?: string;
  latitude?: number;
  longitude?: number;
};

export type IrradiationInfo = {
  // kWh/m²·ano médio ou série mensal opcional
  annualPlaneOfArray?: number; // kWh/m²·ano
  monthlyPlaneOfArray?: number[]; // 12 valores — kWh/m²·mês
  tiltDeg?: number; // inclinação do módulo
  azimuthDeg?: number; // 0=N, 90=L, 180=S, 270=O (padrão: norte hemisfério sul ~ 0)
};

// Histórico e perfil de consumo
export type ConsumptionHistoryPoint = {
  month: string; // YYYY-MM
  kWh: number;
};

export type ConsumptionProfile = {
  averageMonthly_kWh?: number; // se não houver série completa
  monthly_kWh?: number[]; // 12 valores
  history?: ConsumptionHistoryPoint[]; // 12–24 meses quando disponível
};

// Lead e contexto tarifário
export type LeadInfo = {
  id?: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string; // UF
  distributor?: string;
  consumerClass?: 'residential' | 'commercial' | 'industrial' | 'rural' | 'public';
};

export type TariffBreakdown = {
  // valores em R$/kWh (quando aplicável)
  TE?: number; // Tarifa de Energia
  TUSD?: number; // Tarifa de Uso do Sistema de Distribuição
  taxes?: {
    ICMS_pct?: number; // % sobre base
    PIS_pct?: number;
    COFINS_pct?: number;
  };
  publicLighting_COSIP_monthly_BR?: number; // taxa mensal fixa, quando aplicável
  availabilityCost_kWh_equivalent?: number; // custo de disponibilidade convertido em kWh
};

// Especificações de equipamentos (mínimas para validações)
export type SolarModuleSpec = {
  id?: string;
  manufacturer: string;
  model: string;
  Pmpp_W: number; // potência nominal (STC)
  Voc_V: number;
  Isc_A: number;
  Vmp_V: number;
  Imp_A: number;
  tempCoeff_Pmpp_pct_per_C?: number; // coeficiente de temperatura da potência
  NOCT_C?: number;
};

export type InverterSpec = {
  id?: string;
  manufacturer: string;
  model: string;
  AC_power_W: number; // potência nominal AC
  maxDC_power_W?: number;
  maxDC_voltage_V: number;
  mpptCount: number;
  stringsPerMPPT: { min: number; max: number };
};

export type BatterySpec = {
  id?: string;
  manufacturer: string;
  model: string;
  capacity_kWh: number;
  power_kW: number;
  depthOfDischarge_pct?: number;
  strategy?: 'backup' | 'tou' | 'self_consumption';
};

export type ModuleStringConfig = {
  module: SolarModuleSpec;
  modulesInSeries: number; // por string
  parallelStrings: number; // número de strings em paralelo neste MPPT
};

export type MPPTConfig = {
  mpptIndex: number;
  strings: ModuleStringConfig[];
};

export type InverterConfig = {
  inverter: InverterSpec;
  mppts: MPPTConfig[]; // tamanho deve bater com inverter.mpptCount
};

export type BatteryConfig = {
  battery: BatterySpec;
  quantity: number;
};

export type EquipmentSelection = {
  inverters: InverterConfig[];
  batteries?: BatteryConfig[];
};

// Parâmetros técnicos
export type TechnicalParams = {
  performanceRatio_pct?: number; // PR
  lossesEnvironmental_pct?: number; // somatório simplificado (sombreamento, sujeira, etc.)
  lossesTechnical_pct?: number; // cabos, inversor, mismatch, etc.
  targetCompensation_pct?: number; // meta de compensação do consumo, 0–100%
};

// Ajustes de consumo (novas cargas)
export type ConsumptionDelta = {
  label: string; // ex.: "Ar-condicionado"
  estimated_kWh_per_month: number;
};

// Entrada principal do cálculo
export type SimulationInput = {
  lead?: LeadInfo;
  location?: LocationInfo;
  irradiation?: IrradiationInfo;
  consumption: ConsumptionProfile;
  consumptionDeltas?: ConsumptionDelta[];
  tariff?: TariffBreakdown;
  equipment?: EquipmentSelection; // quando já houver seleção
  technical?: TechnicalParams;
  level?: SimulationLevel; // nível de precisão da simulação (básico, preciso, pvsol)
};

// Saída principal do cálculo
export type FinancialKPIs = {
  npv_BRL?: number; // VPL
  irr_pct?: number; // TIR (p.p.)
  simplePayback_months?: number;
  discountedPayback_months?: number;
};

export type ElectricalValidation = {
  dcAcRatio?: number;
  oversizeOK?: boolean;
  voltageOK?: boolean;
  currentOK?: boolean;
  notes?: string[];
};

export type SimulationResult = {
  recommendedPower_kWp: number;
  annualGeneration_kWh: number;
  monthlyGeneration_kWh: number[]; // 12
  compensation_pct: number;
  estimatedSavings_monthly_BRL: number;
  estimatedSavings_annual_BRL: number;
  financial?: FinancialKPIs;
  electrical?: ElectricalValidation;
  warnings?: string[];
};

export type SimulationLevel = 'basic' | 'precise' | 'pvsol_import';