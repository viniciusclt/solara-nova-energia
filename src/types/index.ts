// Tipos e interfaces globais do sistema

// Interface para módulos solares
export interface SolarModule {
  id?: string;
  name: string;
  manufacturer: string;
  model: string;
  power: number; // Potência nominal em Watts
  
  // Especificações elétricas
  voc: number; // Tensão de circuito aberto (V)
  isc: number; // Corrente de curto-circuito (A)
  vmp: number; // Tensão de máxima potência (V)
  imp: number; // Corrente de máxima potência (A)
  efficiency: number; // Eficiência do módulo (%)
  
  // Coeficientes de temperatura
  tempCoeffPmax: number; // Coeficiente de temperatura para Pmax (%/°C)
  tempCoeffVoc: number; // Coeficiente de temperatura para Voc (%/°C)
  tempCoeffIsc: number; // Coeficiente de temperatura para Isc (%/°C)
  
  // Dimensões físicas
  length: number; // Comprimento (mm)
  width: number; // Largura (mm)
  thickness: number; // Espessura (mm)
  weight: number; // Peso (kg)
  area: number; // Área (m²)
  
  // Tecnologia e características
  cellType: string; // Tipo de célula (Mono PERC, Poly, etc)
  cellCount: number; // Número de células
  technology: string[]; // Array de tecnologias (Bifacial, Half-cell, etc)
  
  // Garantias
  productWarranty: number; // Garantia do produto (anos)
  performanceWarranty: { // Garantia de performance
    years: number; // Anos
    percentage: number; // Porcentagem garantida após os anos
  }[];
  
  // Certificações e outros
  certifications: string[]; // Certificações (IEC, etc)
  datasheet?: string; // URL para o datasheet
  
  // Metadados
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  active: boolean;
}

// Interface para inversores
export interface Inverter {
  id?: string;
  name: string;
  manufacturer: string;
  model: string;
  power: number; // Potência nominal em Watts
  
  // Especificações DC
  maxDcPower: number; // Potência máxima DC (W)
  maxDcVoltage: number; // Tensão máxima DC (V)
  startupVoltage: number; // Tensão de partida (V)
  nominalDcVoltage: number; // Tensão nominal DC (V)
  maxDcCurrent: number; // Corrente máxima DC (A)
  mpptChannels: number; // Número de canais MPPT
  maxInputsPerMppt: number; // Máximo de entradas por MPPT
  
  // Especificações AC
  nominalAcPower: number; // Potência nominal AC (W)
  maxAcPower: number; // Potência máxima AC (W)
  nominalAcVoltage: number; // Tensão nominal AC (V)
  acVoltageRange: string; // Faixa de tensão AC (ex: "220-240V")
  nominalFrequency: number; // Frequência nominal (Hz)
  frequencyRange: string; // Faixa de frequência (ex: "59.3-60.5Hz")
  phases: number; // Número de fases (1 ou 3)
  maxAcCurrent: number; // Corrente máxima AC (A)
  powerFactor: number; // Fator de potência
  
  // Eficiência
  maxEfficiency: number; // Eficiência máxima (%)
  europeanEfficiency: number; // Eficiência europeia (%)
  mpptEfficiency: number; // Eficiência MPPT (%)
  
  // Proteções
  protections: string[]; // Array de proteções (Sobretensão, Subtensão, etc)
  
  // Especificações físicas e ambientais
  dimensions: {
    length: number; // Comprimento (mm)
    width: number; // Largura (mm)
    height: number; // Altura (mm)
  };
  weight: number; // Peso (kg)
  operatingTemperature: string; // Faixa de temperatura operacional
  storageTemperature: string; // Faixa de temperatura de armazenamento
  humidity: string; // Umidade relativa máxima
  altitude: number; // Altitude máxima de operação (m)
  coolingMethod: string; // Método de resfriamento
  enclosureRating: string; // Grau de proteção (IP65, etc)
  
  // Garantias e vida útil
  productWarranty: number; // Garantia do produto (anos)
  performanceWarranty: number; // Garantia de performance (anos)
  designLife: number; // Vida útil de projeto (anos)
  
  // Certificações e comunicação
  certifications: string[]; // Certificações (IEC, UL, etc)
  communicationInterfaces: string[]; // Interfaces de comunicação (WiFi, Ethernet, etc)
  monitoringCapability: boolean; // Capacidade de monitoramento
  
  // Outros
  topology: string; // Topologia (Transformerless, HF Transformer, etc)
  displayType: string; // Tipo de display
  datasheet?: string; // URL para o datasheet
  
  // Metadados
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  active: boolean;
}

// Outros tipos e interfaces podem ser adicionados aqui