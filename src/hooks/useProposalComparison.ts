import { useState, useEffect, useMemo, useCallback } from 'react';
import { ProposalComparisonService, type ProposalData, type ComparisonResult, type RankingResult } from '../services/ProposalComparisonService';
import { useFinancialWorker } from './useFinancialWorker';
import { logError } from '@/utils/secureLogger';

interface ComparisonCriteria {
  vpl_weight: number;
  tir_weight: number;
  payback_weight: number;
  roi_weight: number;
}

interface UseProposalComparisonProps {
  proposals: ProposalData[];
  useWorker?: boolean;
}

interface UseProposalComparisonReturn {
  // Estado
  comparisonResults: ComparisonResult[];
  ranking: RankingResult[];
  criteria: ComparisonCriteria;
  isLoading: boolean;
  error: string | null;
  
  // Ações
  updateCriteria: (newCriteria: ComparisonCriteria) => void;
  recalculate: () => Promise<void>;
  exportData: (format: 'csv' | 'pdf') => Promise<void>;
  
  // Métricas derivadas
  bestProposals: {
    bestVPL: ComparisonResult | null;
    bestTIR: ComparisonResult | null;
    bestPayback: ComparisonResult | null;
    bestROI: ComparisonResult | null;
  };
  
  // Estatísticas
  statistics: {
    totalProposals: number;
    averageVPL: number;
    averageTIR: number;
    averagePayback: number;
    averageROI: number;
    bestOverallScore: number;
  };
}

const DEFAULT_CRITERIA: ComparisonCriteria = {
  vpl_weight: 0.3,
  tir_weight: 0.25,
  payback_weight: 0.25,
  roi_weight: 0.2
};

export function useProposalComparison({
  proposals,
  useWorker = true
}: UseProposalComparisonProps): UseProposalComparisonReturn {
  const [comparisonResults, setComparisonResults] = useState<ComparisonResult[]>([]);
  const [ranking, setRanking] = useState<RankingResult[]>([]);
  const [criteria, setCriteria] = useState<ComparisonCriteria>(DEFAULT_CRITERIA);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { calculateComparison } = useFinancialWorker();
  const comparisonService = useMemo(() => new ProposalComparisonService(), []);

  // Calcular comparação
  const performComparison = useCallback(async () => {
    if (proposals.length === 0) {
      setComparisonResults([]);
      setRanking([]);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let results: ComparisonResult[];

      if (useWorker && proposals.length > 2) {
        // Usar Worker Thread para cálculos pesados
        results = await calculateComparison(proposals);
      } else {
        // Cálculo tradicional
        results = await comparisonService.compararPropostas(proposals);
      }

      setComparisonResults(results);

      // Calcular ranking
      const rankingResults = comparisonService.calcularRanking(results, criteria);
      setRanking(rankingResults);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido na comparação';
      setError(errorMessage);
      logError('Erro na comparação de propostas', 'useProposalComparison', { error: err instanceof Error ? err.message : String(err) });
    } finally {
      setIsLoading(false);
    }
  }, [proposals, criteria, useWorker, calculateComparison, comparisonService]);

  // Atualizar critérios
  const updateCriteria = useCallback((newCriteria: ComparisonCriteria) => {
    setCriteria(newCriteria);
  }, []);

  // Recalcular manualmente
  const recalculate = useCallback(async () => {
    await performComparison();
  }, [performComparison]);

  // Exportar dados
  const exportData = useCallback(async (format: 'csv' | 'pdf') => {
    try {
      if (format === 'csv') {
        await comparisonService.exportarCSV(comparisonResults, ranking);
      } else {
        await comparisonService.exportarPDF(comparisonResults, ranking);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro na exportação';
      setError(errorMessage);
      logError('Erro na exportação', 'useProposalComparison', { error: err instanceof Error ? err.message : String(err) });
    }
  }, [comparisonResults, ranking, comparisonService]);

  // Melhores propostas por métrica
  const bestProposals = useMemo(() => {
    if (comparisonResults.length === 0) {
      return {
        bestVPL: null,
        bestTIR: null,
        bestPayback: null,
        bestROI: null
      };
    }

    const bestVPL = comparisonResults.reduce((best, current) => 
      current.results.vpl > best.results.vpl ? current : best
    );
    
    const bestTIR = comparisonResults.reduce((best, current) => 
      current.results.tir > best.results.tir ? current : best
    );
    
    const bestPayback = comparisonResults.reduce((best, current) => 
      current.results.payback < best.results.payback ? current : best
    );
    
    const bestROI = comparisonResults.reduce((best, current) => 
      current.results.roi > best.results.roi ? current : best
    );

    return { bestVPL, bestTIR, bestPayback, bestROI };
  }, [comparisonResults]);

  // Estatísticas
  const statistics = useMemo(() => {
    if (comparisonResults.length === 0) {
      return {
        totalProposals: 0,
        averageVPL: 0,
        averageTIR: 0,
        averagePayback: 0,
        averageROI: 0,
        bestOverallScore: 0
      };
    }

    const totalProposals = comparisonResults.length;
    const averageVPL = comparisonResults.reduce((sum, r) => sum + r.results.vpl, 0) / totalProposals;
    const averageTIR = comparisonResults.reduce((sum, r) => sum + r.results.tir, 0) / totalProposals;
    const averagePayback = comparisonResults.reduce((sum, r) => sum + r.results.payback, 0) / totalProposals;
    const averageROI = comparisonResults.reduce((sum, r) => sum + r.results.roi, 0) / totalProposals;
    const bestOverallScore = ranking.length > 0 ? ranking[0].score : 0;

    return {
      totalProposals,
      averageVPL,
      averageTIR,
      averagePayback,
      averageROI,
      bestOverallScore
    };
  }, [comparisonResults, ranking]);

  // Efeito para recalcular quando propostas ou critérios mudarem
  useEffect(() => {
    performComparison();
  }, [proposals, criteria, useWorker]);

  // Efeito para recalcular ranking quando critérios mudarem
  useEffect(() => {
    if (comparisonResults.length > 0) {
      const rankingResults = comparisonService.calcularRanking(comparisonResults, criteria);
      setRanking(rankingResults);
    }
  }, [criteria, comparisonResults, comparisonService]);

  return {
    // Estado
    comparisonResults,
    ranking,
    criteria,
    isLoading,
    error,
    
    // Ações
    updateCriteria,
    recalculate,
    exportData,
    
    // Métricas derivadas
    bestProposals,
    
    // Estatísticas
    statistics
  };
}

// Hook auxiliar para validação de critérios
export function useValidateCriteria(criteria: ComparisonCriteria) {
  return useMemo(() => {
    const total = criteria.vpl_weight + criteria.tir_weight + criteria.payback_weight + criteria.roi_weight;
    const isValid = Math.abs(total - 1) < 0.01; // Tolerância de 1%
    const difference = total - 1;
    
    return {
      isValid,
      total,
      difference,
      message: isValid 
        ? 'Critérios válidos' 
        : `Total: ${(total * 100).toFixed(1)}% (${difference > 0 ? '+' : ''}${(difference * 100).toFixed(1)}%)`
    };
  }, [criteria]);
}

// Hook para métricas de performance
export function useComparisonPerformance(comparisonResults: ComparisonResult[]) {
  return useMemo(() => {
    if (comparisonResults.length === 0) return null;

    const vpls = comparisonResults.map(r => r.results.vpl);
    const tirs = comparisonResults.map(r => r.results.tir);
    const paybacks = comparisonResults.map(r => r.results.payback);
    const rois = comparisonResults.map(r => r.results.roi);

    const calculateStats = (values: number[]) => {
      const sorted = [...values].sort((a, b) => a - b);
      const min = sorted[0];
      const max = sorted[sorted.length - 1];
      const median = sorted.length % 2 === 0 
        ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
        : sorted[Math.floor(sorted.length / 2)];
      const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
      const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      
      return { min, max, median, mean, stdDev, range: max - min };
    };

    return {
      vpl: calculateStats(vpls),
      tir: calculateStats(tirs),
      payback: calculateStats(paybacks),
      roi: calculateStats(rois)
    };
  }, [comparisonResults]);
}