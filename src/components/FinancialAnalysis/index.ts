// Componente principal refatorado
export { default as FinancialAnalysisRefactored } from './FinancialAnalysisRefactored';

// Componentes modulares
export { FinancialConfiguration } from './FinancialConfiguration';
export { FinancialResults } from './FinancialResults';
export { FinancialCharts } from './FinancialCharts';

// Hook personalizado
export { useFinancialCalculations } from './useFinancialCalculations';

// Types
export type {
  FinancialData,
  FinancingOption,
  FinancialAnalysisProps,
  CalculationResult
} from './types';