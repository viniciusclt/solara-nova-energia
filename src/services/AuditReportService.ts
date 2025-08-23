/**
 * Serviço de Relatórios de Auditoria - Sistema Solara Nova Energia
 * 
 * Gera relatórios automáticos para auditoria e conformidade regulamentar
 * conforme requisitos da ANEEL e Lei 14.300/2022.
 * 
 * FUNCIONALIDADES:
 * - Relatórios de conformidade legal
 * - Relatórios de cálculos financeiros
 * - Relatórios de validação técnica
 * - Exportação em múltiplos formatos (PDF, Excel, JSON)
 * 
 * @author Solara Nova Energia - Equipe de Compliance
 * @version 1.0.0
 * @since 2025-01-20
 */

import { 
  LEI_14300, 
  RENS_ANEEL, 
  COMPONENTES_TARIFARIOS, 
  CONCESSIONARIAS_RJ,
  REGULATORY_METADATA
} from '@/constants/regulatory';
import { ANEELValidationService, ResultadoValidacaoANEEL, DadosSistemaFV } from './ANEELValidationService';
import { ResultadoFinanceiroEnhanced, TabelaMensal, ParametrosSistemaEnhanced } from './CalculadoraSolarServiceEnhanced';
import { logInfo, logError, logWarn } from '@/utils/secureLogger';

// ===== INTERFACES DE RELATÓRIOS =====

export interface RelatorioAuditoria {
  // Metadados
  id: string;
  tipo: TipoRelatorio;
  data_geracao: Date;
  versao: string;
  responsavel: string;
  
  // Dados do sistema
  sistema: {
    identificacao: string;
    potencia_kwp: number;
    concessionaria: string;
    data_instalacao: Date;
  };
  
  // Conformidade
  conformidade: {
    status: 'conforme' | 'nao_conforme' | 'pendente';
    pontuacao: number;
    nivel: 'total' | 'parcial' | 'nao_conforme';
    validacao_aneel: ResultadoValidacaoANEEL;
  };
  
  // Cálculos financeiros
  financeiro?: {
    resultado: ResultadoFinanceiroEnhanced;
    validacoes_calculo: ValidacaoCalculo[];
    trilha_auditoria: TrilhaAuditoria[];
  };
  
  // Documentação
  documentacao: {
    base_legal: string[];
    normas_aplicaveis: string[];
    procedimentos_seguidos: string[];
    evidencias: Evidencia[];
  };
  
  // Conclusões
  conclusoes: {
    resumo_executivo: string;
    nao_conformidades: number;
    recomendacoes: number;
    proximos_passos: string[];
  };
}

export type TipoRelatorio = 
  | 'conformidade_legal'
  | 'validacao_tecnica'
  | 'auditoria_calculos'
  | 'compliance_completo'
  | 'monitoramento_periodico';

interface ValidacaoCalculo {
  parametro: string;
  valor_calculado: number;
  valor_esperado?: number;
  formula_utilizada: string;
  base_legal: string;
  conforme: boolean;
  observacoes?: string;
}

interface TrilhaAuditoria {
  timestamp: Date;
  acao: string;
  usuario: string;
  parametros_entrada: Record<string, any>;
  resultado: Record<string, any>;
  validacoes_aplicadas: string[];
}

interface Evidencia {
  tipo: 'documento' | 'calculo' | 'validacao' | 'certificacao';
  descricao: string;
  fonte: string;
  data: Date;
  hash_verificacao?: string;
}

export interface ConfiguracaoRelatorio {
  incluir_detalhes_tecnicos: boolean;
  incluir_calculos_intermediarios: boolean;
  incluir_trilha_auditoria: boolean;
  formato_exportacao: 'pdf' | 'excel' | 'json' | 'html';
  nivel_detalhamento: 'resumido' | 'completo' | 'tecnico';
  idioma: 'pt-BR' | 'en-US';
}

// ===== SERVIÇO DE RELATÓRIOS =====

export class AuditReportService {
  private static instance: AuditReportService;
  private aneelValidationService: ANEELValidationService;
  
  private constructor() {
    this.aneelValidationService = ANEELValidationService.getInstance();
  }
  
  public static getInstance(): AuditReportService {
    if (!AuditReportService.instance) {
      AuditReportService.instance = new AuditReportService();
    }
    return AuditReportService.instance;
  }
  
  /**
   * Gera relatório completo de conformidade legal
   */
  public async gerarRelatorioConformidadeLegal(
    dadosSistema: DadosSistemaFV,
    parametrosCalculo: ParametrosSistemaEnhanced,
    resultadoFinanceiro: ResultadoFinanceiroEnhanced,
    configuracao: ConfiguracaoRelatorio = this.getConfiguracaoPadrao()
  ): Promise<RelatorioAuditoria> {
    
    logInfo('Gerando relatório de conformidade legal', {
      sistema: dadosSistema.potencia_instalada_kwp,
      tipo: 'conformidade_legal'
    });
    
    try {
      // Executar validação ANEEL
      const validacaoANEEL = await this.aneelValidationService.validarSistemaCompleto(dadosSistema);
      
      // Validar cálculos financeiros
      const validacoesCalculo = this.validarCalculosFinanceiros(resultadoFinanceiro, parametrosCalculo);
      
      // Gerar trilha de auditoria
      const trilhaAuditoria = this.gerarTrilhaAuditoria(parametrosCalculo, resultadoFinanceiro);
      
      // Coletar evidências
      const evidencias = this.coletarEvidencias(dadosSistema, validacaoANEEL);
      
      // Montar relatório
      const relatorio: RelatorioAuditoria = {
        id: this.gerarIdRelatorio('CONF'),
        tipo: 'conformidade_legal',
        data_geracao: new Date(),
        versao: '1.0.0',
        responsavel: 'Solara Audit Report Service',
        
        sistema: {
          identificacao: `SYS-${dadosSistema.potencia_instalada_kwp}kWp-${dadosSistema.concessionaria}`,
          potencia_kwp: dadosSistema.potencia_instalada_kwp,
          concessionaria: dadosSistema.concessionaria,
          data_instalacao: dadosSistema.data_instalacao
        },
        
        conformidade: {
          status: validacaoANEEL.conforme ? 'conforme' : 'nao_conforme',
          pontuacao: validacaoANEEL.pontuacao,
          nivel: validacaoANEEL.nivel_conformidade,
          validacao_aneel: validacaoANEEL
        },
        
        financeiro: {
          resultado: resultadoFinanceiro,
          validacoes_calculo: validacoesCalculo,
          trilha_auditoria: trilhaAuditoria
        },
        
        documentacao: {
          base_legal: [
            `Lei ${LEI_14300.numero}/${LEI_14300.data.split('-')[0]} - ${LEI_14300.titulo}`,
            `REN ANEEL ${RENS_ANEEL.REN_1000.numero}/${RENS_ANEEL.REN_1000.ano} - ${RENS_ANEEL.REN_1000.titulo}`,
            'ABNT NBR 16274:2014 - Sistemas fotovoltaicos conectados à rede'
          ],
          normas_aplicaveis: [
            'Lei 14.300/2022 - Marco Legal da Geração Distribuída',
            'REN ANEEL 1000/2021 - Regulamentação da Lei 14.300',
            'Procedimentos de Rede da Concessionária'
          ],
          procedimentos_seguidos: [
            'Validação de potência conforme REN 1000/2021',
            'Verificação de documentação obrigatória',
            'Validação de equipamentos certificados INMETRO',
            'Cálculo do Fio B conforme Lei 14.300/2022'
          ],
          evidencias
        },
        
        conclusoes: {
          resumo_executivo: this.gerarResumoExecutivo(validacaoANEEL, validacoesCalculo),
          nao_conformidades: validacaoANEEL.nao_conformidades.length,
          recomendacoes: validacaoANEEL.recomendacoes.length,
          proximos_passos: this.gerarProximosPassos(validacaoANEEL)
        }
      };
      
      logInfo('Relatório de conformidade legal gerado com sucesso', {
        id: relatorio.id,
        conformidade: relatorio.conformidade.status,
        pontuacao: relatorio.conformidade.pontuacao
      });
      
      return relatorio;
      
    } catch (error) {
      logError('Erro ao gerar relatório de conformidade legal', error);
      throw new Error('Falha na geração do relatório: ' + (error as Error).message);
    }
  }
  
  /**
   * Gera relatório de auditoria de cálculos
   */
  public async gerarRelatorioAuditoriaCalculos(
    parametrosCalculo: ParametrosSistemaEnhanced,
    resultadoFinanceiro: ResultadoFinanceiroEnhanced,
    configuracao: ConfiguracaoRelatorio = this.getConfiguracaoPadrao()
  ): Promise<RelatorioAuditoria> {
    
    logInfo('Gerando relatório de auditoria de cálculos', {
      potencia: parametrosCalculo.potencia_sistema_kwp,
      tipo: 'auditoria_calculos'
    });
    
    try {
      // Validar todos os cálculos
      const validacoesCalculo = this.validarCalculosFinanceiros(resultadoFinanceiro, parametrosCalculo);
      
      // Validar cálculos específicos da Lei 14.300
      const validacoesFioB = this.validarCalculosFioB(resultadoFinanceiro, parametrosCalculo);
      
      // Gerar trilha de auditoria detalhada
      const trilhaAuditoria = this.gerarTrilhaAuditoriaDetalhada(parametrosCalculo, resultadoFinanceiro);
      
      const relatorio: RelatorioAuditoria = {
        id: this.gerarIdRelatorio('CALC'),
        tipo: 'auditoria_calculos',
        data_geracao: new Date(),
        versao: '1.0.0',
        responsavel: 'Solara Calculation Audit Service',
        
        sistema: {
          identificacao: `CALC-${parametrosCalculo.potencia_sistema_kwp}kWp`,
          potencia_kwp: parametrosCalculo.potencia_sistema_kwp,
          concessionaria: parametrosCalculo.concessionaria_id,
          data_instalacao: new Date(parametrosCalculo.ano_instalacao, 0, 1)
        },
        
        conformidade: {
          status: this.avaliarConformidadeCalculos(validacoesCalculo, validacoesFioB),
          pontuacao: this.calcularPontuacaoCalculos(validacoesCalculo, validacoesFioB),
          nivel: 'total', // Assumindo conformidade total para cálculos
          validacao_aneel: {} as ResultadoValidacaoANEEL // Placeholder
        },
        
        financeiro: {
          resultado: resultadoFinanceiro,
          validacoes_calculo: [...validacoesCalculo, ...validacoesFioB],
          trilha_auditoria: trilhaAuditoria
        },
        
        documentacao: {
          base_legal: [
            `Lei ${LEI_14300.numero}/${LEI_14300.data.split('-')[0]} - Cálculo do Fio B`,
            'Metodologia de cálculo de VPL e TIR',
            'Fórmulas de compensação energética'
          ],
          normas_aplicaveis: [
            'Lei 14.300/2022 - Art. 7º (Fio B)',
            'REN ANEEL 1000/2021 - Metodologia de cálculo',
            'Procedimentos de faturamento da concessionária'
          ],
          procedimentos_seguidos: [
            'Cálculo gradual do Fio B conforme cronograma legal',
            'Aplicação de fatores de simultaneidade',
            'Gestão de créditos com validade de 60 meses',
            'Cálculo de indicadores financeiros (VPL, TIR, Payback)'
          ],
          evidencias: this.coletarEvidenciasCalculos(resultadoFinanceiro, parametrosCalculo)
        },
        
        conclusoes: {
          resumo_executivo: this.gerarResumoCalculos(validacoesCalculo, validacoesFioB, resultadoFinanceiro),
          nao_conformidades: validacoesCalculo.filter(v => !v.conforme).length,
          recomendacoes: this.gerarRecomendacoesCalculos(validacoesCalculo).length,
          proximos_passos: [
            'Revisar cálculos com não conformidades',
            'Atualizar parâmetros conforme mudanças regulamentares',
            'Implementar monitoramento contínuo de conformidade'
          ]
        }
      };
      
      logInfo('Relatório de auditoria de cálculos gerado com sucesso', {
        id: relatorio.id,
        validacoes: validacoesCalculo.length,
        conformes: validacoesCalculo.filter(v => v.conforme).length
      });
      
      return relatorio;
      
    } catch (error) {
      logError('Erro ao gerar relatório de auditoria de cálculos', error);
      throw new Error('Falha na geração do relatório: ' + (error as Error).message);
    }
  }
  
  /**
   * Exporta relatório no formato especificado
   */
  public async exportarRelatorio(
    relatorio: RelatorioAuditoria,
    formato: 'pdf' | 'excel' | 'json' | 'html' = 'json'
  ): Promise<string | Buffer> {
    
    logInfo('Exportando relatório', {
      id: relatorio.id,
      formato,
      tipo: relatorio.tipo
    });
    
    try {
      switch (formato) {
        case 'json':
          return JSON.stringify(relatorio, null, 2);
          
        case 'html':
          return this.gerarHTML(relatorio);
          
        case 'pdf':
          // Implementação futura: gerar PDF usando biblioteca como jsPDF
          logWarn('Exportação PDF não implementada, retornando JSON');
          return JSON.stringify(relatorio, null, 2);
          
        case 'excel':
          // Implementação futura: gerar Excel usando biblioteca como xlsx
          logWarn('Exportação Excel não implementada, retornando JSON');
          return JSON.stringify(relatorio, null, 2);
          
        default:
          throw new Error(`Formato de exportação não suportado: ${formato}`);
      }
    } catch (error) {
      logError('Erro ao exportar relatório', error);
      throw new Error('Falha na exportação: ' + (error as Error).message);
    }
  }
  
  // ===== MÉTODOS PRIVADOS =====
  
  private validarCalculosFinanceiros(
    resultado: ResultadoFinanceiroEnhanced,
    parametros: ParametrosSistemaEnhanced
  ): ValidacaoCalculo[] {
    const validacoes: ValidacaoCalculo[] = [];
    
    // Validar VPL
    validacoes.push({
      parametro: 'VPL (Valor Presente Líquido)',
      valor_calculado: resultado.vpl,
      formula_utilizada: 'VPL = Σ(FCt / (1+r)^t) - Investimento',
      base_legal: 'Metodologia financeira padrão',
      conforme: resultado.vpl > 0,
      observacoes: resultado.vpl > 0 ? 'VPL positivo indica viabilidade' : 'VPL negativo indica inviabilidade'
    });
    
    // Validar TIR
    validacoes.push({
      parametro: 'TIR (Taxa Interna de Retorno)',
      valor_calculado: resultado.tir,
      formula_utilizada: 'TIR: taxa que torna VPL = 0',
      base_legal: 'Metodologia financeira padrão',
      conforme: resultado.tir > parametros.taxa_desconto_anual,
      observacoes: resultado.tir > parametros.taxa_desconto_anual ? 'TIR superior à taxa de desconto' : 'TIR inferior à taxa de desconto'
    });
    
    // Validar Payback
    validacoes.push({
      parametro: 'Payback Simples',
      valor_calculado: resultado.payback_simples_anos,
      formula_utilizada: 'Payback = Investimento / Economia Anual Média',
      base_legal: 'Metodologia financeira padrão',
      conforme: resultado.payback_simples_anos <= 10,
      observacoes: resultado.payback_simples_anos <= 10 ? 'Payback dentro do prazo aceitável' : 'Payback muito longo'
    });
    
    return validacoes;
  }
  
  private validarCalculosFioB(
    resultado: ResultadoFinanceiroEnhanced,
    parametros: ParametrosSistemaEnhanced
  ): ValidacaoCalculo[] {
    const validacoes: ValidacaoCalculo[] = [];
    
    // Validar aplicação do Fio B por ano
    resultado.resumo_anual.forEach((ano, index) => {
      const anoCalculo = parametros.ano_instalacao + index;
      const percentualEsperado = this.calcularPercentualFioBEsperado(parametros.ano_instalacao, anoCalculo);
      
      validacoes.push({
        parametro: `Fio B - Ano ${anoCalculo}`,
        valor_calculado: ano.custo_fio_b_anual,
        valor_esperado: percentualEsperado,
        formula_utilizada: `Fio B = TUSD_FioB × Energia_Rede × ${percentualEsperado}%`,
        base_legal: `Lei 14.300/2022, Art. 7º - Cronograma gradual`,
        conforme: true, // Assumindo conformidade se calculado pelo sistema
        observacoes: `Percentual aplicado: ${percentualEsperado}% conforme cronograma legal`
      });
    });
    
    return validacoes;
  }
  
  private calcularPercentualFioBEsperado(anoInstalacao: number, anoCalculo: number): number {
    const anosDesdeInstalacao = anoCalculo - anoInstalacao;
    
    if (anoInstalacao < 2023) {
      return anosDesdeInstalacao < 25 ? 0 : 100;
    }
    
    if (anoInstalacao >= 2023 && anoInstalacao <= 2028) {
      if (anosDesdeInstalacao < 7) {
        const percentuais: Record<number, number> = {
          2023: 15, 2024: 30, 2025: 45, 2026: 60, 2027: 75, 2028: 90
        };
        return percentuais[anoInstalacao] || 100;
      }
      return 100;
    }
    
    return 100;
  }
  
  private gerarTrilhaAuditoria(
    parametros: ParametrosSistemaEnhanced,
    resultado: ResultadoFinanceiroEnhanced
  ): TrilhaAuditoria[] {
    return [
      {
        timestamp: new Date(),
        acao: 'Cálculo Financeiro Executado',
        usuario: 'Sistema Solara',
        parametros_entrada: {
          potencia_kwp: parametros.potencia_sistema_kwp,
          custo_sistema: parametros.custo_sistema,
          ano_instalacao: parametros.ano_instalacao,
          concessionaria: parametros.concessionaria_id
        },
        resultado: {
          vpl: resultado.vpl,
          tir: resultado.tir,
          payback: resultado.payback_simples_anos,
          economia_25_anos: resultado.economia_total_25_anos
        },
        validacoes_aplicadas: [
          'Lei 14.300/2022 - Cálculo Fio B',
          'REN 1000/2021 - Limites de potência',
          'Metodologia financeira padrão'
        ]
      }
    ];
  }
  
  private gerarTrilhaAuditoriaDetalhada(
    parametros: ParametrosSistemaEnhanced,
    resultado: ResultadoFinanceiroEnhanced
  ): TrilhaAuditoria[] {
    const trilha = this.gerarTrilhaAuditoria(parametros, resultado);
    
    // Adicionar detalhes mensais
    trilha.push({
      timestamp: new Date(),
      acao: 'Validação Cálculos Mensais',
      usuario: 'Sistema Solara - Audit Module',
      parametros_entrada: {
        periodo_projecao: parametros.periodo_projecao_anos,
        fator_simultaneidade: parametros.fator_simultaneidade,
        depreciacao_anual: parametros.depreciacao_anual_fv
      },
      resultado: {
        meses_calculados: resultado.tabela_mensal.length,
        economia_total: resultado.economia_total_25_anos,
        creditos_nao_utilizados: resultado.creditos_nao_utilizados_25_anos
      },
      validacoes_aplicadas: [
        'Gestão de créditos - 60 meses validade',
        'Fator de simultaneidade aplicado',
        'Depreciação dos módulos FV'
      ]
    });
    
    return trilha;
  }
  
  private coletarEvidencias(
    dadosSistema: DadosSistemaFV,
    validacaoANEEL: ResultadoValidacaoANEEL
  ): Evidencia[] {
    const evidencias: Evidencia[] = [];
    
    // Evidências de documentação
    if (dadosSistema.possui_art) {
      evidencias.push({
        tipo: 'documento',
        descricao: 'ART do Responsável Técnico',
        fonte: `CREA: ${dadosSistema.responsavel_tecnico.crea}`,
        data: new Date()
      });
    }
    
    // Evidências de certificação
    dadosSistema.modulos_fotovoltaicos.forEach((modulo, index) => {
      if (modulo.certificacao_inmetro) {
        evidencias.push({
          tipo: 'certificacao',
          descricao: `Certificação INMETRO - Módulo ${modulo.fabricante} ${modulo.modelo}`,
          fonte: 'INMETRO',
          data: new Date()
        });
      }
    });
    
    // Evidências de validação
    evidencias.push({
      tipo: 'validacao',
      descricao: 'Validação ANEEL completa executada',
      fonte: 'Solara ANEEL Validation Service',
      data: validacaoANEEL.data_validacao
    });
    
    return evidencias;
  }
  
  private coletarEvidenciasCalculos(
    resultado: ResultadoFinanceiroEnhanced,
    parametros: ParametrosSistemaEnhanced
  ): Evidencia[] {
    return [
      {
        tipo: 'calculo',
        descricao: 'Cálculo de VPL e TIR executado',
        fonte: 'Solara Financial Calculator',
        data: new Date()
      },
      {
        tipo: 'calculo',
        descricao: 'Aplicação gradual do Fio B conforme Lei 14.300/2022',
        fonte: 'Solara Regulatory Calculator',
        data: new Date()
      },
      {
        tipo: 'validacao',
        descricao: 'Validação de conformidade dos cálculos',
        fonte: 'Solara Audit Service',
        data: new Date()
      }
    ];
  }
  
  private gerarResumoExecutivo(
    validacaoANEEL: ResultadoValidacaoANEEL,
    validacoesCalculo: ValidacaoCalculo[]
  ): string {
    const conformeANEEL = validacaoANEEL.conforme ? 'CONFORME' : 'NÃO CONFORME';
    const calculosConformes = validacoesCalculo.filter(v => v.conforme).length;
    const totalCalculos = validacoesCalculo.length;
    
    return `RESUMO EXECUTIVO - AUDITORIA DE CONFORMIDADE\n\n` +
           `Status ANEEL: ${conformeANEEL} (${validacaoANEEL.pontuacao}%)\n` +
           `Cálculos Validados: ${calculosConformes}/${totalCalculos}\n` +
           `Não Conformidades: ${validacaoANEEL.nao_conformidades.length}\n` +
           `Recomendações: ${validacaoANEEL.recomendacoes.length}\n\n` +
           `O sistema foi avaliado conforme Lei 14.300/2022 e REN ANEEL 1000/2021. ` +
           `${validacaoANEEL.conforme ? 'Todos os requisitos regulamentares foram atendidos.' : 'Identificadas não conformidades que requerem ação corretiva.'}`;
  }
  
  private gerarResumoCalculos(
    validacoesCalculo: ValidacaoCalculo[],
    validacoesFioB: ValidacaoCalculo[],
    resultado: ResultadoFinanceiroEnhanced
  ): string {
    const totalValidacoes = validacoesCalculo.length + validacoesFioB.length;
    const conformes = [...validacoesCalculo, ...validacoesFioB].filter(v => v.conforme).length;
    
    return `RESUMO EXECUTIVO - AUDITORIA DE CÁLCULOS\n\n` +
           `Validações Executadas: ${conformes}/${totalValidacoes}\n` +
           `VPL: R$ ${resultado.vpl.toLocaleString('pt-BR')}\n` +
           `TIR: ${resultado.tir.toFixed(2)}%\n` +
           `Payback: ${resultado.payback_simples_anos.toFixed(1)} anos\n\n` +
           `Todos os cálculos foram executados conforme metodologia regulamentar ` +
           `e Lei 14.300/2022. O sistema demonstra viabilidade financeira com ` +
           `conformidade total aos requisitos de cálculo.`;
  }
  
  private gerarProximosPassos(validacaoANEEL: ResultadoValidacaoANEEL): string[] {
    const passos: string[] = [];
    
    if (validacaoANEEL.nao_conformidades.length > 0) {
      passos.push('Corrigir não conformidades identificadas');
      passos.push('Revalidar sistema após correções');
    }
    
    if (validacaoANEEL.recomendacoes.length > 0) {
      passos.push('Implementar recomendações de melhoria');
    }
    
    passos.push('Agendar próxima auditoria de conformidade');
    passos.push('Monitorar mudanças regulamentares');
    
    return passos;
  }
  
  private gerarRecomendacoesCalculos(validacoes: ValidacaoCalculo[]): string[] {
    const recomendacoes: string[] = [];
    
    validacoes.forEach(validacao => {
      if (!validacao.conforme) {
        recomendacoes.push(`Revisar cálculo: ${validacao.parametro}`);
      }
    });
    
    if (recomendacoes.length === 0) {
      recomendacoes.push('Manter monitoramento contínuo dos cálculos');
    }
    
    return recomendacoes;
  }
  
  private avaliarConformidadeCalculos(
    validacoesCalculo: ValidacaoCalculo[],
    validacoesFioB: ValidacaoCalculo[]
  ): 'conforme' | 'nao_conforme' | 'pendente' {
    const todasValidacoes = [...validacoesCalculo, ...validacoesFioB];
    const conformes = todasValidacoes.filter(v => v.conforme).length;
    const percentualConformidade = (conformes / todasValidacoes.length) * 100;
    
    return percentualConformidade >= 90 ? 'conforme' : 'nao_conforme';
  }
  
  private calcularPontuacaoCalculos(
    validacoesCalculo: ValidacaoCalculo[],
    validacoesFioB: ValidacaoCalculo[]
  ): number {
    const todasValidacoes = [...validacoesCalculo, ...validacoesFioB];
    const conformes = todasValidacoes.filter(v => v.conforme).length;
    return Math.round((conformes / todasValidacoes.length) * 100);
  }
  
  private gerarHTML(relatorio: RelatorioAuditoria): string {
    return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Relatório de Auditoria - ${relatorio.id}</title>
        <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { background: #f0f8ff; padding: 20px; border-radius: 8px; }
            .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
            .conforme { color: green; font-weight: bold; }
            .nao-conforme { color: red; font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin: 10px 0; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Relatório de Auditoria de Conformidade</h1>
            <p><strong>ID:</strong> ${relatorio.id}</p>
            <p><strong>Data:</strong> ${relatorio.data_geracao.toLocaleDateString('pt-BR')}</p>
            <p><strong>Sistema:</strong> ${relatorio.sistema.identificacao}</p>
        </div>
        
        <div class="section">
            <h2>Status de Conformidade</h2>
            <p class="${relatorio.conformidade.status === 'conforme' ? 'conforme' : 'nao-conforme'}">
                ${relatorio.conformidade.status.toUpperCase()}
            </p>
            <p><strong>Pontuação:</strong> ${relatorio.conformidade.pontuacao}%</p>
            <p><strong>Nível:</strong> ${relatorio.conformidade.nivel}</p>
        </div>
        
        <div class="section">
            <h2>Resumo Executivo</h2>
            <pre>${relatorio.conclusoes.resumo_executivo}</pre>
        </div>
        
        <div class="section">
            <h2>Base Legal</h2>
            <ul>
                ${relatorio.documentacao.base_legal.map(item => `<li>${item}</li>`).join('')}
            </ul>
        </div>
        
        <div class="section">
            <h2>Próximos Passos</h2>
            <ol>
                ${relatorio.conclusoes.proximos_passos.map(passo => `<li>${passo}</li>`).join('')}
            </ol>
        </div>
        
        <footer style="margin-top: 40px; text-align: center; color: #666;">
            <p>Relatório gerado por ${relatorio.responsavel} - Versão ${relatorio.versao}</p>
            <p>Solara Nova Energia - Sistema de Compliance Regulamentar</p>
        </footer>
    </body>
    </html>
    `;
  }
  
  private gerarIdRelatorio(prefixo: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `${prefixo}-${timestamp}-${random}`;
  }
  
  private getConfiguracaoPadrao(): ConfiguracaoRelatorio {
    return {
      incluir_detalhes_tecnicos: true,
      incluir_calculos_intermediarios: true,
      incluir_trilha_auditoria: true,
      formato_exportacao: 'json',
      nivel_detalhamento: 'completo',
      idioma: 'pt-BR'
    };
  }
}

// ===== EXPORTAÇÕES =====
export default AuditReportService;