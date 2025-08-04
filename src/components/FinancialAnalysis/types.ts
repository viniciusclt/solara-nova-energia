export interface FinancialData {
  valorSistema: number;
  valorFinal: number;
  custoWp: number;
  bdi: number;
  markup: number;
  margem: number;
  comissaoExterna: number;
  outrosGastos: number;
  tipoVenda: string;
  inflacao: number;
  tarifaEletrica: number;
  reajusteTarifario: number;
  payback: number;
  tir: number;
  vpl: number;
  economiaAnual: number;
  economia25Anos: number;
  // Novos campos para Lei 14.300
  potenciaSistema: number;
  geracaoAnual: number;
  consumoMensal: number;
  incrementoConsumo: number;
  fatorSimultaneidade: number;
  concessionariaId: string;
  tipoLigacao: 'monofasico' | 'bifasico' | 'trifasico';
  anoInstalacao: number;
  depreciacao: number;
}

export interface FinancingOption {
  banco: string;
  taxa: number;
  parcelas: number;
  carencia: number;
  valorParcela: number;
}

export interface FinancialAnalysisProps {
  currentLead: unknown;
}

export interface CalculationResult {
  payback: number;
  tir: number;
  vpl: number;
  economiaAnual: number;
  economia25Anos: number;
}