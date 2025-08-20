import { CalculadoraSolarService } from './CalculadoraSolarService';
import { TarifaService } from './TarifaService';
import { CacheService } from './CacheService';
import { logError } from '@/utils/secureLogger';

export interface ProposalData {
  id: string;
  name: string;
  valorSistema: number;
  potenciaSistema: number;
  consumoMedio: number;
  concessionaria: string;
  equipamentos?: {
    modulos: string;
    inversor: string;
    estrutura: string;
  };
  parametrosFinanceiros?: {
    taxaDesconto: number;
    reajusteTarifario: number;
    inflacao: number;
  };
}

export type ProposalConfiguration = ProposalData;

export interface ComparisonResult {
  proposal: ProposalData;
  results: {
    vpl: number;
    tir: number;
    payback: number;
    economiaAnual: number;
    economiaTotal: number;
    totalSavings: number;
    custoKwh: number;
    roi: number;
  };
  ranking: number;
}

export interface RankingResult {
  proposalId: string;
  position: number;
  score: number;
  metrics: {
    vpl: number;
    tir: number;
    payback: number;
    roi: number;
  };
}

export interface ComparisonCriteria {
  vpl_weight: number;
  tir_weight: number;
  payback_weight: number;
  roi_weight: number;
}

export interface ComparisonSummary {
  melhorVPL: ComparisonResult;
  melhorTIR: ComparisonResult;
  melhorPayback: ComparisonResult;
  melhorROI: ComparisonResult;
  comparacoes: ComparisonResult[];
  estatisticas: {
    vplMedio: number;
    tirMedia: number;
    paybackMedio: number;
    desvioVPL: number;
    desvioTIR: number;
  };
}

export class ProposalComparisonService {
  private static instance: ProposalComparisonService;
  private calculadoraService: CalculadoraSolarService;
  private tarifaService: TarifaService;
  private cacheService: CacheService;
  private propostas: Map<string, ProposalConfiguration> = new Map();

  private constructor() {
    this.calculadoraService = CalculadoraSolarService.getInstance();
    this.tarifaService = TarifaService.getInstance();
    this.cacheService = CacheService.getInstance();
  }

  public static getInstance(): ProposalComparisonService {
    if (!ProposalComparisonService.instance) {
      ProposalComparisonService.instance = new ProposalComparisonService();
    }
    return ProposalComparisonService.instance;
  }

  /**
   * Adiciona uma nova proposta para comparação
   */
  public adicionarProposta(proposta: ProposalData): void {
    this.propostas.set(proposta.id, proposta);
    
    // Limpar cache relacionado
    this.cacheService.delete(`comparison_${proposta.id}`);
    this.cacheService.delete('comparison_summary');
  }

  /**
   * Remove uma proposta da comparação
   */
  public removerProposta(id: string): boolean {
    const removed = this.propostas.delete(id);
    if (removed) {
      this.cacheService.delete(`comparison_${id}`);
      this.cacheService.delete('comparison_summary');
    }
    return removed;
  }

  /**
   * Lista todas as propostas
   */
  public listarPropostas(): ProposalData[] {
    return Array.from(this.propostas.values());
  }

  /**
   * Calcula os resultados financeiros para uma proposta específica
   */
  private async calcularResultadosProposta(
    proposta: ProposalData
  ): Promise<ComparisonResult['results']> {
    const cacheKey = `comparison_${proposta.id}`;
    const cached = this.cacheService.get<ComparisonResult['results']>(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      // Calcular economia e fluxo de caixa
      const resultadoEconomia = await this.calculadoraService.calcularEconomiaFluxoCaixa(
        proposta.valorSistema,
        proposta.potenciaSistema,
        proposta.consumoMedio,
        proposta.concessionaria,
        proposta.parametrosFinanceiros?.taxaDesconto || 0.08,
        proposta.parametrosFinanceiros?.reajusteTarifario || 0.05,
        proposta.parametrosFinanceiros?.inflacao || 0.04
      );

      const resultados = {
        vpl: resultadoEconomia.vpl,
        tir: resultadoEconomia.tir,
        payback: resultadoEconomia.payback_simples_anos,
        economiaAnual: resultadoEconomia.economia_primeiro_ano,
        economiaTotal: resultadoEconomia.economia_total_25_anos,
        totalSavings: resultadoEconomia.economia_total_25_anos,
        custoKwh: proposta.valorSistema / (proposta.potenciaSistema * 1000),
        roi: (resultadoEconomia.economia_total_25_anos / proposta.valorSistema) * 100
      };

      // Cache por 1 hora
      this.cacheService.set(cacheKey, resultados, 3600000);
      
      return resultados;
    } catch (error) {
        logError('Erro ao calcular resultados para proposta', 'ProposalComparisonService', { propostaId: proposta.id, error: error instanceof Error ? error.message : String(error) });
        throw error;
      }
  }

  /**
   * Compara todas as propostas e retorna resultados ordenados
   */
  public async compararPropostas(): Promise<ComparisonSummary> {
    const cacheKey = 'comparison_summary';
    const cached = this.cacheService.get<ComparisonSummary>(cacheKey);
    
    if (cached) {
      return cached;
    }

    if (this.propostas.size === 0) {
      throw new Error('Nenhuma proposta disponível para comparação');
    }

    const comparacoes: ComparisonResult[] = [];

    // Calcular resultados para todas as propostas
    for (const proposta of this.propostas.values()) {
      try {
        const resultados = await this.calcularResultadosProposta(proposta);
        comparacoes.push({
          proposal: proposta,
          results: resultados,
          ranking: 0 // Será calculado depois
        });
      } catch (error) {
        logError('Erro ao processar proposta', 'ProposalComparisonService', { propostaNome: proposta.name, error: error instanceof Error ? error.message : String(error) });
      }
    }

    if (comparacoes.length === 0) {
      throw new Error('Nenhuma proposta pôde ser processada');
    }

    // Encontrar melhores resultados
    const melhorVPL = comparacoes.reduce((prev, current) => 
      current.results.vpl > prev.results.vpl ? current : prev
    );

    const melhorTIR = comparacoes.reduce((prev, current) => 
      current.results.tir > prev.results.tir ? current : prev
    );

    const melhorPayback = comparacoes.reduce((prev, current) => 
      current.results.payback < prev.results.payback ? current : prev
    );

    const melhorROI = comparacoes.reduce((prev, current) => 
      current.results.roi > prev.results.roi ? current : prev
    );

    // Calcular estatísticas
    const vpls = comparacoes.map(c => c.results.vpl);
    const tirs = comparacoes.map(c => c.results.tir);
    const paybacks = comparacoes.map(c => c.results.payback);

    const vplMedio = vpls.reduce((a, b) => a + b, 0) / vpls.length;
    const tirMedia = tirs.reduce((a, b) => a + b, 0) / tirs.length;
    const paybackMedio = paybacks.reduce((a, b) => a + b, 0) / paybacks.length;

    const desvioVPL = Math.sqrt(
      vpls.reduce((acc, vpl) => acc + Math.pow(vpl - vplMedio, 2), 0) / vpls.length
    );

    const desvioTIR = Math.sqrt(
      tirs.reduce((acc, tir) => acc + Math.pow(tir - tirMedia, 2), 0) / tirs.length
    );

    // Calcular ranking baseado em score ponderado
    comparacoes.forEach(comparacao => {
      const scoreVPL = (comparacao.results.vpl / melhorVPL.results.vpl) * 0.3;
      const scoreTIR = (comparacao.results.tir / melhorTIR.results.tir) * 0.3;
      const scorePayback = (melhorPayback.results.payback / comparacao.results.payback) * 0.2;
      const scoreROI = (comparacao.results.roi / melhorROI.results.roi) * 0.2;
      
      const scoreTotal = scoreVPL + scoreTIR + scorePayback + scoreROI;
      comparacao.ranking = Math.round(scoreTotal * 100);
    });

    // Ordenar por ranking
    comparacoes.sort((a, b) => b.ranking - a.ranking);

    const summary: ComparisonSummary = {
      melhorVPL,
      melhorTIR,
      melhorPayback,
      melhorROI,
      comparacoes,
      estatisticas: {
        vplMedio,
        tirMedia,
        paybackMedio,
        desvioVPL,
        desvioTIR
      }
    };

    // Cache por 30 minutos
    this.cacheService.set(cacheKey, summary, 1800000);
    
    return summary;
  }

  /**
   * Exporta dados de comparação para CSV
   */
  public async exportarCSV(): Promise<string> {
    const summary = await this.compararPropostas();
    
    const headers = [
      'Nome',
      'Valor Sistema (R$)',
      'Potência (kWp)',
      'Consumo Médio (kWh)',
      'Concessionária',
      'VPL (R$)',
      'TIR (%)',
      'Payback (anos)',
      'Economia Anual (R$)',
      'Economia Total (R$)',
      'Custo/kWh (R$)',
      'ROI (%)',
      'Ranking'
    ];

    const rows = summary.comparacoes.map(comp => [
      comp.proposal.name,
      comp.proposal.valorSistema.toFixed(2),
      comp.proposal.potenciaSistema.toFixed(2),
      comp.proposal.consumoMedio.toFixed(0),
      comp.proposal.concessionaria,
      comp.results.vpl.toFixed(2),
      comp.results.tir.toFixed(2),
      comp.results.payback.toFixed(1),
      comp.results.economiaAnual.toFixed(2),
      comp.results.economiaTotal.toFixed(2),
      comp.results.custoKwh.toFixed(4),
      comp.results.roi.toFixed(1),
      comp.ranking.toString()
    ]);

    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    return csvContent;
  }

  /**
   * Limpa todas as propostas
   */
  public limparPropostas(): void {
    this.propostas.clear();
    this.cacheService.delete('comparison_summary');
    
    // Limpar cache de todas as propostas
    for (const key of this.cacheService.getKeys()) {
      if (key.startsWith('comparison_')) {
        this.cacheService.delete(key);
      }
    }
  }

  /**
   * Obtém estatísticas rápidas sem cálculo completo
   */
  public getEstatisticasRapidas(): {
    totalPropostas: number;
    valorMedio: number;
    potenciaMedia: number;
    consumoMedio: number;
  } {
    const propostas = Array.from(this.propostas.values());
    
    if (propostas.length === 0) {
      return {
        totalPropostas: 0,
        valorMedio: 0,
        potenciaMedia: 0,
        consumoMedio: 0
      };
    }

    return {
      totalPropostas: propostas.length,
      valorMedio: propostas.reduce((acc, p) => acc + p.valorSistema, 0) / propostas.length,
      potenciaMedia: propostas.reduce((acc, p) => acc + p.potenciaSistema, 0) / propostas.length,
      consumoMedio: propostas.reduce((acc, p) => acc + p.consumoMedio, 0) / propostas.length
    };
  }

  /**
   * Calcula o ranking das propostas com base em critérios ponderados
   */
  public calcularRanking(
    comparisonResults: ComparisonResult[], 
    criteria: ComparisonCriteria = {
      vpl_weight: 0.3,
      tir_weight: 0.25,
      payback_weight: 0.25,
      roi_weight: 0.2
    }
  ): RankingResult[] {
    if (comparisonResults.length === 0) return [];
    
    // Encontrar valores máximos e mínimos para normalização
    const maxVPL = Math.max(...comparisonResults.map(r => r.results.vpl));
    const maxTIR = Math.max(...comparisonResults.map(r => r.results.tir));
    const minPayback = Math.min(...comparisonResults.map(r => r.results.payback));
    const maxROI = Math.max(...comparisonResults.map(r => r.results.roi));
    
    const resultados: RankingResult[] = comparisonResults.map(result => {
      // Normalizar métricas (0-1)
      const normalizedVPL = maxVPL > 0 ? result.results.vpl / maxVPL : 0;
      const normalizedTIR = maxTIR > 0 ? result.results.tir / maxTIR : 0;
      const normalizedPayback = minPayback > 0 ? minPayback / result.results.payback : 0;
      const normalizedROI = maxROI > 0 ? result.results.roi / maxROI : 0;
      
      // Calcular score ponderado
      const score = (
        normalizedVPL * criteria.vpl_weight +
        normalizedTIR * criteria.tir_weight +
        normalizedPayback * criteria.payback_weight +
        normalizedROI * criteria.roi_weight
      );
      
      return {
        proposalId: result.proposal.id,
        position: 0, // Será definido após ordenação
        score,
        metrics: {
          vpl: result.results.vpl,
          tir: result.results.tir,
          payback: result.results.payback,
          roi: result.results.roi
        }
      };
    });
    
    // Ordenar por score decrescente e atribuir posições
    resultados.sort((a, b) => b.score - a.score);
    resultados.forEach((resultado, index) => {
      resultado.position = index + 1;
    });
    
    return resultados;
  }

  /**
   * Compara propostas específicas (método atualizado)
   */
  public async compararPropostas(propostas: ProposalData[]): Promise<ComparisonResult[]> {
    const resultados: ComparisonResult[] = [];
    
    for (const proposta of propostas) {
      try {
        const metrics = await this.calcularResultadosProposta(proposta);
        resultados.push({
          proposal: proposta,
          results: metrics,
          ranking: 0 // Será calculado pelo ranking
        });
      } catch (error) {
        logError('Erro ao processar proposta na comparação', 'ProposalComparisonService', { propostaNome: proposta.name, error: error instanceof Error ? error.message : String(error) });
      }
    }
    
    return resultados;
  }

  /**
   * Exporta dados para CSV com estrutura atualizada
   */
  public async exportarCSV(
    comparisonResults: ComparisonResult[], 
    ranking: RankingResult[]
  ): Promise<void> {
    const headers = [
      'Nome',
      'Valor Sistema (R$)',
      'Potência (kWp)',
      'VPL (R$)',
      'TIR (%)',
      'Payback (anos)',
      'ROI (%)',
      'Economia Total (R$)',
      'Posição',
      'Score'
    ];

    const rows = comparisonResults.map(result => {
      const rankingItem = ranking.find(r => r.proposalId === result.proposal.id);
      return [
        result.proposal.name,
        result.proposal.valorSistema.toFixed(2),
        result.proposal.potenciaSistema.toFixed(2),
        result.results.vpl.toFixed(2),
        (result.results.tir * 100).toFixed(2),
        result.results.payback.toFixed(1),
        (result.results.roi * 100).toFixed(1),
        result.results.economiaTotal.toFixed(2),
        rankingItem?.position || 'N/A',
        rankingItem ? (rankingItem.score * 100).toFixed(1) : 'N/A'
      ];
    });

    const csvContent = [headers, ...rows]
      .map(row => row.join(','))
      .join('\n');

    // Download do arquivo
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `comparacao-propostas-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Exporta dados para PDF
   */
  public async exportarPDF(
    comparisonResults: ComparisonResult[], 
    ranking: RankingResult[]
  ): Promise<void> {
    // Implementação básica - pode ser expandida com bibliotecas como jsPDF
    const content = this.generatePDFContent(comparisonResults, ranking);
    
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `comparacao-propostas-${new Date().toISOString().split('T')[0]}.txt`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  private generatePDFContent(
    comparisonResults: ComparisonResult[], 
    ranking: RankingResult[]
  ): string {
    let content = 'RELATÓRIO DE COMPARAÇÃO DE PROPOSTAS\n';
    content += '=' .repeat(50) + '\n\n';
    content += `Data: ${new Date().toLocaleDateString('pt-BR')}\n`;
    content += `Total de propostas: ${comparisonResults.length}\n\n`;
    
    content += 'RANKING:\n';
    content += '-'.repeat(30) + '\n';
    
    ranking.forEach(item => {
      const result = comparisonResults.find(r => r.proposal.id === item.proposalId);
      if (result) {
        content += `${item.position}º - ${result.proposal.name}\n`;
        content += `   Score: ${(item.score * 100).toFixed(1)}%\n`;
        content += `   VPL: R$ ${result.results.vpl.toLocaleString('pt-BR')}\n`;
        content += `   TIR: ${(result.results.tir * 100).toFixed(2)}%\n`;
        content += `   Payback: ${result.results.payback.toFixed(1)} anos\n`;
        content += `   ROI: ${(result.results.roi * 100).toFixed(1)}%\n\n`;
      }
    });
    
    return content;
  }

  /**
   * Obtém uma proposta específica por ID
   */
  public obterProposta(id: string): ProposalData | undefined {
    return this.propostas.get(id);
  }

  /**
   * Atualiza uma proposta existente
   */
  public atualizarProposta(proposta: ProposalData): boolean {
    if (!this.propostas.has(proposta.id)) {
      return false;
    }
    
    this.propostas.set(proposta.id, proposta);
    
    // Limpar cache relacionado
    this.cacheService.delete(`comparison_${proposta.id}`);
    this.cacheService.delete('comparison_summary');
    
    return true;
  }
}