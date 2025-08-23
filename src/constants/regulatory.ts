/**
 * Constantes Regulatórias - Sistema Solara Nova Energia
 * 
 * Este arquivo centraliza todas as referências legais e regulamentares
 * aplicáveis ao sistema de energia solar distribuída no Brasil.
 * 
 * Última atualização: Janeiro 2025
 */

// ===== LEI 14.300/2022 - MARCO LEGAL DA GERAÇÃO DISTRIBUÍDA =====
export const LEI_14300 = {
  numero: '14.300',
  data: '2022-01-06',
  titulo: 'Marco Legal da Geração Distribuída',
  url: 'https://www.planalto.gov.br/ccivil_03/_ato2019-2022/2022/lei/l14300.htm',
  
  // Artigos relevantes para o sistema
  artigos: {
    art6: {
      descricao: 'Sistema de Compensação de Energia Elétrica (SCEE)',
      paragrafo1: 'Definição do sistema de compensação',
      paragrafo2: 'Regras de faturamento'
    },
    art7: {
      descricao: 'Fio B - Componente tarifária',
      aplicacao: 'Sistemas instalados após 2023'
    },
    art26: {
      descricao: 'Regras de transição',
      prazo: '2031-12-31'
    }
  },
  
  // Períodos de aplicação
  periodos: {
    transicao: {
      inicio: '2023-01-01',
      fim: '2031-12-31',
      descricao: 'Período de transição com aplicação gradual do Fio B'
    },
    pleno: {
      inicio: '2032-01-01',
      descricao: 'Aplicação plena das novas regras'
    }
  }
} as const;

// ===== RESOLUÇÕES NORMATIVAS ANEEL =====
export const RENS_ANEEL = {
  // REN 482/2012 - Primeira regulamentação da GD
  REN_482: {
    numero: '482',
    ano: '2012',
    data: '2012-04-17',
    titulo: 'Condições gerais para acesso de microgeração e minigeração distribuída',
    status: 'Revogada pela REN 687/2015',
    url: 'https://www2.aneel.gov.br/cedoc/ren2012482.pdf'
  },
  
  // REN 687/2015 - Revisão da regulamentação
  REN_687: {
    numero: '687',
    ano: '2015', 
    data: '2015-11-24',
    titulo: 'Revisão das regras de micro e minigeração distribuída',
    status: 'Revogada pela REN 1000/2021',
    url: 'https://www2.aneel.gov.br/cedoc/ren2015687.pdf'
  },
  
  // REN 1000/2021 - Regulamentação atual
  REN_1000: {
    numero: '1000',
    ano: '2021',
    data: '2021-12-07', 
    titulo: 'Regulamentação da Lei 14.300/2022',
    status: 'Vigente',
    url: 'https://www2.aneel.gov.br/cedoc/ren20211000.pdf',
    
    // Principais definições
    definicoes: {
      microgd: {
        potencia_max: 75, // kW
        descricao: 'Microgeração distribuída'
      },
      minigd: {
        potencia_min: 75.001, // kW
        potencia_max: 5000, // kW
        descricao: 'Minigeração distribuída'
      }
    }
  }
} as const;

// ===== COMPONENTES TARIFÁRIOS =====
export const COMPONENTES_TARIFARIOS = {
  TUSD: {
    nome: 'Tarifa de Uso do Sistema de Distribuição',
    descricao: 'Tarifa paga pelo uso da rede de distribuição',
    aplicacao: 'Todos os consumidores conectados à rede'
  },
  
  FIO_B: {
    nome: 'Fio B',
    descricao: 'Componente da TUSD referente aos custos de disponibilidade',
    base_legal: 'Lei 14.300/2022, Art. 7º',
    
    // Cronograma de aplicação gradual
    cronograma: {
      2023: { percentual: 15, base_legal: 'Lei 14.300/2022' },
      2024: { percentual: 30, base_legal: 'Lei 14.300/2022' },
      2025: { percentual: 45, base_legal: 'Lei 14.300/2022' },
      2026: { percentual: 60, base_legal: 'Lei 14.300/2022' },
      2027: { percentual: 75, base_legal: 'Lei 14.300/2022' },
      2028: { percentual: 90, base_legal: 'Lei 14.300/2022' },
      2029: { percentual: 90, base_legal: 'Lei 14.300/2022' },
      2030: { percentual: 90, base_legal: 'Lei 14.300/2022' },
      2031: { percentual: 90, base_legal: 'Lei 14.300/2022' },
      2032: { percentual: 100, base_legal: 'Lei 14.300/2022' }
    }
  }
} as const;

// ===== CONCESSIONÁRIAS - RIO DE JANEIRO =====
export const CONCESSIONARIAS_RJ = {
  LIGHT: {
    nome: 'Light Serviços de Eletricidade S.A.',
    cnpj: '04.378.630/0001-83',
    area_concessao: 'Rio de Janeiro (Capital e Região Metropolitana)',
    site: 'https://www.light.com.br',
    
    // Procedimentos específicos da Light
    procedimentos: {
      conexao_gd: {
        portal: 'Portal Light',
        documentos_obrigatorios: [
          'Formulário de Solicitação',
          'ART do Responsável Técnico',
          'Diagrama Unifilar',
          'Memorial Descritivo',
          'Datasheet dos Equipamentos'
        ]
      },
      
      prazos: {
        micro_gd: {
          analise: 34, // dias úteis
          conexao: 7   // dias úteis após aprovação
        },
        mini_gd: {
          analise: 49, // dias úteis  
          conexao: 7   // dias úteis após aprovação
        }
      }
    },
    
    // Tarifas específicas (valores de referência - devem ser atualizados)
    tarifas_referencia: {
      grupo_b: {
        b1_residencial: {
          tusd_fio_b: 0.12345, // R$/kWh - valor de referência
          te: 0.45678          // R$/kWh - valor de referência
        }
      }
    }
  }
} as const;

// ===== VALIDAÇÕES REGULAMENTARES =====
export const VALIDACOES_REGULAMENTARES = {
  potencia_maxima: {
    micro_gd: 75, // kW
    mini_gd: 5000 // kW
  },
  
  documentos_obrigatorios: {
    todos_casos: [
      'Formulário de Solicitação de Acesso',
      'ART do Responsável Técnico',
      'Certificado de Conformidade dos Equipamentos'
    ],
    acima_75kw: [
      'Estudo de Proteção',
      'Estudo de Coordenação da Proteção'
    ]
  },
  
  normas_tecnicas: {
    ABNT_NBR_16274: {
      titulo: 'Sistemas fotovoltaicos conectados à rede',
      aplicacao: 'Requisitos mínimos para documentação'
    },
    ABNT_NBR_5410: {
      titulo: 'Instalações elétricas de baixa tensão',
      aplicacao: 'Segurança das instalações'
    }
  }
} as const;

// ===== TIPOS PARA TYPESCRIPT =====
export type TipoGeracao = 'micro' | 'mini';
export type StatusRegulamentar = 'vigente' | 'revogada' | 'em_consulta';
export type TipoConexao = 'monofasico' | 'bifasico' | 'trifasico';

// ===== FUNÇÕES UTILITÁRIAS =====
export const RegulatoryUtils = {
  /**
   * Determina o tipo de geração baseado na potência
   */
  getTipoGeracao(potenciaKw: number): TipoGeracao {
    return potenciaKw <= 75 ? 'micro' : 'mini';
  },
  
  /**
   * Calcula o percentual do Fio B para um ano específico
   */
  getPercentualFioB(ano: number): number {
    const cronograma = COMPONENTES_TARIFARIOS.FIO_B.cronograma;
    return cronograma[ano as keyof typeof cronograma]?.percentual || 100;
  },
  
  /**
   * Verifica se o sistema está no período de transição
   */
  isPeríodoTransicao(data: Date): boolean {
    const inicio = new Date(LEI_14300.periodos.transicao.inicio);
    const fim = new Date(LEI_14300.periodos.transicao.fim);
    return data >= inicio && data <= fim;
  },
  
  /**
   * Retorna os documentos obrigatórios baseado no tipo de geração
   */
  getDocumentosObrigatorios(tipoGeracao: TipoGeracao): string[] {
    const base = VALIDACOES_REGULAMENTARES.documentos_obrigatorios.todos_casos;
    const adicional = tipoGeracao === 'mini' 
      ? VALIDACOES_REGULAMENTARES.documentos_obrigatorios.acima_75kw 
      : [];
    return [...base, ...adicional];
  }
};

// ===== METADADOS DO ARQUIVO =====
export const REGULATORY_METADATA = {
  versao: '1.0.0',
  ultima_atualizacao: '2025-01-20',
  responsavel: 'Solara Nova Energia - Equipe de Compliance',
  proxima_revisao: '2025-07-01',
  fontes: [
    'Lei 14.300/2022',
    'REN ANEEL 1000/2021', 
    'Procedimentos Light-RJ',
    'ABNT NBR 16274:2014'
  ]
} as const;