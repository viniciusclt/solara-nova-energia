O usuário quer que eu crie um arquivo MD detalhado para implementar um gerador de propostas de energia solar baseado no modelo fornecido. Ele quer especificar:

Funcionalidades específicas:
Sistema drag-and-drop
Link de envio para cliente
Controle de quantidade/data de visualização
Sistema de templates com campos dinâmicos (ex: [TABELA_ECONOMIA], [PAYBACK])
Importação via Word ou editor interno
Detalhamento página por página do que deve conter

Vou criar um documento MD completo e estruturado com todas essas especificações, organizando por seções e incluindo todos os elementos técnicos necessários.

GERADOR DE PROPOSTAS COMERCIAIS - ENERGIA SOLAR
Especificação Técnica Completa para Implementação
1. VISÃO GERAL DO SISTEMA
Objetivo

Criar um sistema completo de geração de propostas comerciais para energia solar fotovoltaica com interface drag-and-drop, sistema de templates dinâmicos e controle avançado de compartilhamento.

Tecnologias Base
Frontend: React + TypeScript + Tailwind CSS
Drag & Drop: @dnd-kit/core
PDF Generation: @react-pdf/renderer
Editor de Texto: Quill.js ou TinyMCE
Templates: Sistema de campos dinâmicos com placeholders
Banco: localStorage/IndexedDB para cache local
2. FUNCIONALIDADES PRINCIPAIS
2.1 Sistema de Templates Dinâmicos
Typescript
Copiar
interface TemplatePlaceholders {
  // Dados do Cliente
  '[NOME_CLIENTE]': string;
  '[ENDERECO_CLIENTE]': string;
  '[TELEFONE_CLIENTE]': string;
  '[EMAIL_CLIENTE]': string;
  
  // Dados do Sistema
  '[POTENCIA_SISTEMA]': number;
  '[NUMERO_MODULOS]': number;
  '[MARCA_MODULOS]': string;
  '[MARCA_INVERSOR]': string;
  '[AREA_OCUPADA]': number;
  
  // Dados Financeiros
  '[VALOR_INVESTIMENTO]': number;
  '[ECONOMIA_MENSAL]': number;
  '[ECONOMIA_ANUAL]': number;
  '[PAYBACK]': string;
  '[TIR]': number;
  '[VPL]': number;
  
  // Tabelas Dinâmicas
  '[TABELA_ECONOMIA]': HTMLElement;
  '[GRAFICO_GERACAO]': HTMLElement;
  '[CRONOGRAMA_PROJETO]': HTMLElement;
  '[FLUXO_CAIXA_25_ANOS]': HTMLElement;
  
  // Dados Ambientais
  '[CO2_EVITADO_MENSAL]': number;
  '[CO2_EVITADO_ANUAL]': number;
  '[ARVORES_EQUIVALENTES]': number;
  
  // Dados da Empresa
  '[LOGO_EMPRESA]': string;
  '[NOME_EMPRESA]': string;
  '[CNPJ_EMPRESA]': string;
  '[TELEFONE_EMPRESA]': string;
  '[EMAIL_EMPRESA]': string;
  '[SITE_EMPRESA]': string;
  
  // Metadados
  '[DATA_PROPOSTA]': string;
  '[NUMERO_PROPOSTA]': string;
  '[VALIDADE_PROPOSTA]': string;
}

2.2 Editor Drag-and-Drop
Typescript
Copiar
interface DragDropEditor {
  // Componentes Disponíveis
  components: {
    header: 'Cabeçalho personalizado',
    text: 'Bloco de texto editável',
    image: 'Imagem com upload',
    table: 'Tabela de dados',
    chart: 'Gráfico dinâmico',
    spacer: 'Espaçador',
    pageBreak: 'Quebra de página'
  };
  
  // Ações
  actions: {
    drag: 'Arrastar componentes',
    drop: 'Soltar em posição',
    edit: 'Editar conteúdo inline',
    delete: 'Remover componente',
    duplicate: 'Duplicar componente',
    reorder: 'Reordenar elementos'
  };
}

2.3 Sistema de Compartilhamento
Typescript
Copiar
interface SharingSystem {
  linkGeneration: {
    uniqueUrl: string;
    password?: string;
    expirationDate: Date;
    maxViews: number;
    trackingEnabled: boolean;
  };
  
  analytics: {
    viewCount: number;
    viewHistory: ViewHistory[];
    downloadCount: number;
    timeSpent: number;
    deviceInfo: DeviceInfo[];
  };
  
  notifications: {
    onView: boolean;
    onDownload: boolean;
    emailNotifications: string[];
    webhookUrl?: string;
  };
}

3. ESTRUTURA DETALHADA DAS PÁGINAS
PÁGINA 1: CAPA
Yaml
Copiar
layout: centered
elements:
  header:
    - logo_empresa: '[LOGO_EMPRESA]' # Centralizado, altura máx 80px
    
  title_section:
    - main_title: "PRÉ-PROPOSTA COMERCIAL"
    - subtitle: "SISTEMA FOTOVOLTAICO CONECTADO À REDE"
    - decorative_line: true
    
  client_data:
    position: center_left
    fields:
      - cliente: '[NOME_CLIENTE]'
      - endereco: '[ENDERECO_CLIENTE]'
      - cep: 'Extraído do endereço'
      - responsavel: '[RESPONSAVEL_TECNICO]'
      - crea: '[NUMERO_CREA]'
      
  proposal_info:
    position: center_right
    fields:
      - numero_proposta: '[NUMERO_PROPOSTA]'
      - data: '[DATA_PROPOSTA]'
      - validade: '[VALIDADE_PROPOSTA]'
      
  footer:
    position: bottom
    fields:
      - cnpj: '[CNPJ_EMPRESA]'
      - telefone: '[TELEFONE_EMPRESA]'
      - email: '[EMAIL_EMPRESA]'
      - website: '[SITE_EMPRESA]'

PÁGINA 2: BENEFÍCIOS E FUNCIONAMENTO
Yaml
Copiar
layout: two_columns
sections:
  por_que_energia_solar:
    title: "Por que ter Energia Solar?"
    type: numbered_list
    items:
      1: "Redução significativa na fatura de energia"
      2: "Mais conforto"
      3: "Reinvestir na empresa"
      4: "Viajar mais"
      5: "Aumentar poder de compra"
      6: "Proteção contra a inflação"
      7: "Investimento com melhor custo/benefício"
      8: "Baixa manutenção"
      9: "Valorização do imóvel"
      10: "Energia limpa - redução de CO₂"
      
  como_funciona:
    title: "Como Funciona?"
    content: |
      Na Geração Distribuída (GD), a energia gerada pelo Sistema 
      Fotovoltaico pode ser consumida instantaneamente pelos 
      equipamentos da Unidade Consumidora e seu excedente 
      injetado na rede da concessionária local.
      
    bullet_points:
      - "A rede funciona como uma 'grande bateria'"
      - "Excedente vira créditos válidos por 60 meses"
      - "Medidor bidirecional contabiliza energia"
      
    image: '[DIAGRAMA_FUNCIONAMENTO]'
    image_caption: "Funcionamento do Sistema Fotovoltaico"

PÁGINA 3: SOBRE A EMPRESA
Yaml
Copiar
layout: four_pillars
title: "Sobre a [NOME_EMPRESA]"
pillars:
  conhecimento:
    icon: "graduation-cap"
    title: "CONHECIMENTO"
    content: |
      A [NOME_EMPRESA] possui mais de [ANOS_EXPERIENCIA] anos 
      de experiência com Energia Solar e está sempre se atualizando 
      nesse mercado dinâmico, seja com treinamentos, consultorias, 
      eventos, e utilizando os melhores programas existentes no 
      mercado.
      
  seguranca:
    icon: "shield-check"
    title: "SEGURANÇA"
    content: |
      Nossa equipe de instalação possui todas as certificações 
      necessárias para realização do trabalho, seja relacionado a 
      instalações elétricas assim como trabalho em altura. Todos 
      os nossos sistemas possuem seguro de instalação e 
      responsabilidade civil.
      
  confiabilidade:
    icon: "star"
    title: "CONFIABILIDADE"
    content: |
      Já atendemos diversas cidades do [ESTADO], desde residências 
      pequenas até grandes comércios. Temos 100% de aprovação dos 
      nossos clientes, a sua satisfação é o que nos motiva!
      
  ponha_na_balanca:
    icon: "balance-scale"
    title: "PONHA NA BALANÇA"
    content: |
      Toda proposta é diferente! Um sistema de Energia Solar não 
      é um monte de placa no telhado; é a economia que almeja com 
      a segurança e qualidade que precisa. Cobrimos qualquer 
      proposta com os mesmos entregáveis nossos!

PÁGINA 4: DIFERENCIAIS
Yaml
Copiar
layout: four_blocks
title: "Nossos Diferenciais"
blocks:
  projeto:
    icon: "cube"
    title: "PROJETO"
    content: |
      Realizamos análise com drone, gerando maquete em 3D do 
      estabelecimento. Utilizamos o melhor software do mercado 
      - PV*Sol - para calcular de maneira assertiva sua geração, 
      de hora em hora, para todos os dias do ano.
      
      Resultado: Precisão das medidas, visibilidade do sistema 
      antes da instalação e assertividade >90% na estimativa 
      de geração.
      
  engenharia:
    icon: "cog"
    title: "ENGENHARIA"
    content: |
      Nosso time de engenharia estará presente em todas as etapas: 
      Visita Técnica, Projeto, Layout, Instalação, Acompanhamentos 
      pós-instalação. Será preparado um projeto detalhado, evitando 
      erros na instalação.
      
      E o melhor: Nosso time de engenharia é próprio!
      
  pos_venda:
    icon: "headset"
    title: "PÓS-VENDA"
    content: |
      Time de pós-venda com suporte completo após instalação, 
      materiais em PDF e vídeos explicativos. Acompanhamento 
      semanal e remoto do sistema para rápida identificação de 
      problemas. Acesso à plataforma parceira SolarZ.
      
  qualidade:
    icon: "certificate"
    title: "QUALIDADE"
    content: |
      Com a [NOME_EMPRESA] a qualidade da sua entrega é garantida. 
      Somos peritos nas áreas da Elétrica e Energia Solar e em 
      mais de [ANOS_EXPERIENCIA] anos, já realizamos diversos 
      laudos e manutenções corretivas de sistemas existentes.

PÁGINA 5: ANÁLISE DE CONSUMO
Yaml
Copiar
layout: technical_analysis
title: "Análise de Consumo"
sections:
  consumo_info:
    intro_text: |
      Para este estudo foi previsto um aumento no consumo de 
      [PERCENTUAL_AUMENTO]% e todas as informações descritas 
      nesse material estarão baseadas neste aumento.
      Foi considerado um consumo diurno de [PERCENTUAL_DIURNO]% 
      em relação ao consumo total.
      
  cenarios:
    atual:
      consumo_medio: '[CONSUMO_ATUAL]' # kWh
      consumo_anual: '[CONSUMO_ANUAL_ATUAL]' # kWh
      valor_fatura: '[VALOR_FATURA_ATUAL]' # R$
      valor_tarifa: '[VALOR_TARIFA_ATUAL]' # R$/kWh
      
    futuro:
      consumo_medio: '[CONSUMO_FUTURO]' # kWh
      consumo_anual: '[CONSUMO_ANUAL_FUTURO]' # kWh
      valor_fatura: '[VALOR_FATURA_FUTURO]' # R$
      valor_tarifa: '[VALOR_TARIFA_FUTURO]' # R$/kWh
      
  sistema_proposto:
    potencia: '[POTENCIA_SISTEMA]' # kWp
    modulos: '[NUMERO_MODULOS]' # unidades
    potencia_modulo: '[POTENCIA_MODULO]' # Wp
    area_utilizada: '[AREA_UTILIZADA]' # m²
    lcoe: '[LCOE]' # R$/kWh
    
  grafico_geracao:
    type: "bar_chart"
    data: '[GRAFICO_GERACAO_MENSAL]'
    x_axis: "Meses"
    y_axis: "kWh"
    series:
      - name: "Consumo"
        color: "#3B82F6"
      - name: "Geração"
        color: "#10B981"

PÁGINA 6: SUSTENTABILIDADE E CRONOGRAMA
Yaml
Copiar
layout: split_vertical
sections:
  sustentabilidade:
    title: "Sustentabilidade"
    metrics:
      co2_mensal:
        value: '[CO2_EVITADO_MENSAL]'
        unit: "kg de CO₂/mês"
        icon: "leaf"
        
      co2_anual:
        value: '[CO2_EVITADO_ANUAL]'
        unit: "kg de CO₂/ano"
        icon: "leaf"
        
      co2_25_anos:
        value: '[CO2_EVITADO_25_ANOS]'
        unit: "kg de CO₂/25 anos"
        icon: "leaf"
        
      arvores_equivalentes:
        value: '[ARVORES_EQUIVALENTES]'
        unit: "árvores/ano"
        icon: "tree"
        description: "[TEMPO_EQUIVALENTE] equivalem à absorção de 1 árvore em 20 anos"
        
    disclaimer: |
      *A energia solar fotovoltaica é uma forma de frear a emissão 
      de gases causadores do efeito estufa por ser uma energia limpa.
      **A neutralização de carbono por plantio de árvore acontece 
      através do "sequestro de carbono" da atmosfera.
      
  cronograma:
    title: "Etapas do Projeto"
    timeline:
      aceite_proposta:
        step: 1
        title: "Aceite da Proposta"
        duration: "Imediato"
        responsible: "Cliente"
        
      visita_tecnica:
        step: 2
        title: "Visita Técnica"
        duration: "7d"
        responsible: "[NOME_EMPRESA]"
        
      realizacao_projeto:
        step: 3
        title: "Realização do Projeto"
        duration: "3d"
        responsible: "[NOME_EMPRESA]"
        
      recebimento_material:
        step: 4
        title: "Recebimento do Material"
        duration: "13d"
        responsible: "[NOME_EMPRESA]"
        
      instalacao:
        step: 5
        title: "Instalação"
        duration: "3d"
        responsible: "[NOME_EMPRESA]"
        
      homologacao:
        step: 6
        title: "Processo de Homologação"
        duration: "15-30d"
        responsible: "Concessionária"
        
      troca_relogio:
        step: 7
        title: "Troca do Relógio"
        duration: "50 dias"
        responsible: "Concessionária"
        
    prazo_total: "Prazo aproximado: [PRAZO_TOTAL_PROJETO]"
    observacao: "*Prazos estimados podendo sofrer alteração por motivos externos"

PÁGINA 7: ITENS INCLUSOS E GARANTIAS
Yaml
Copiar
layout: detailed_list
title: "Itens Inclusos"
sections:
  equipamentos:
    title: "Equipamentos Inclusos"
    items:
      - "1x Kit Fotovoltaico (Módulos, inversor, Stringbox)"
      - "1x Cabos CC - Solar - Vermelho e Preto"
      - "1x Kit de Perfis, emendas, ganchos e parafuso estrutural"
      - "1x Kit de Conectores"
      - "2x Protetor surto DPS CA"
      - "1x Cabo de Cobre - Preto e Verde"
      - "1x Kit acessórios AC (eletrodutos, terminais, caixas, etc)"
      
  servicos:
    title: "Serviços Inclusos"
    items:
      - "Projeto INCLUSO"
      - "Instalação INCLUSO"
      - "ART INCLUSO"
      - "Homologação INCLUSO"
      - "Frete INCLUSO"
      - "Monitoramento INCLUSO"
      
  garantias:
    title: "Garantias"
    modulos:
      periodo: "15 anos"
      performance: "30 anos"
      
    inversor:
      periodo: "[GARANTIA_INVERSOR] anos"
      
    mao_obra:
      periodo: "1 ano"
      
  opcionais:
    title: "Opcionais"
    items:
      1:
        service: "Criação de Maquete 3D para estudo de Sombreamento"
        price: "R$ [PRECO_MAQUETE_3D]"
        note: "(reembolsável)"
        
      2:
        service: "Acompanhamento remoto semanal + Relatórios"
        price: "R$ [PRECO_ACOMPANHAMENTO]/mês"
        
      3:
        service: "Seguro Anual contra riscos diversos"
        price: "[PERCENTUAL_SEGURO]%/ano"
        
  observacoes:
    - |
      Por se tratar de uma proposta inicial, não especificamos os 
      modelos de equipamentos. Serão discriminados após a visita 
      técnica. Trabalhamos com as melhores marcas: [MARCAS_PARCEIRAS]
    - |
      Os cabos estão cotados para distância máxima de [DISTANCIA_MAXIMA_CABOS]m 
      do sistema ao ponto de conexão.
    - |
      Foi considerado telhado cerâmico, fibrocimento ou metálico. 
      Estruturas de laje, solo e outros acarretam alteração de valor.

PÁGINA 8: ANÁLISE ECONÔMICA
Yaml
Copiar
layout: financial_analysis
title: "Análise Econômica"
sections:
  resumo_financeiro:
    fatura_sem_geracao: '[VALOR_FATURA_MENSAL]'
    gasto_10_anos: '[GASTO_10_ANOS_SEM_SOLAR]'
    
  indicadores:
    vpl:
      value: '[VPL]'
      description: "Valor de economia futura trazido ao valor presente"
      
    tir:
      value: '[TIR]%'
      description: "Taxa de retorno (comparar com Selic, poupança, etc)"
      
    payback:
      value: '[PAYBACK]'
      description: "Tempo em que a economia pagará o valor investido"
      
    payback_financiamento:
      value: '[PAYBACK_FINANCIAMENTO]'
      description: "Tempo de payback ao optar pelo financiamento"
      
    economia_bruta_25_anos:
      value: '[ECONOMIA_BRUTA_25_ANOS]'
      description: "Valor total economizado no período"
      
    rentabilidade_mensal:
      value: '[RENTABILIDADE_MENSAL]% a.m.'
      description: "Rentabilidade mensal comparada com o investimento"
      
  opcoes_pagamento:
    avista:
      valor: '[VALOR_AVISTA]'
      payback: '[PAYBACK_AVISTA]'
      
    financiamento_1:
      parcelas: '[PARCELAS_1]x'
      valor: '[VALOR_PARCELA_1]'
      total: '[VALOR_TOTAL_1]'
      payback: '[PAYBACK_FINANC_1]'
      
    financiamento_2:
      parcelas: '[PARCELAS_2]x'
      valor: '[VALOR_PARCELA_2]'
      total: '[VALOR_TOTAL_2]'
      payback: '[PAYBACK_FINANC_2]'
      
  nota_financiamento: |
    *Estimativa de Financiamento. Sujeito à análise de crédito. 
    A simulação não configura oferta. Parcelas de 12x a 144x 
    e carência até 120 dias.

PÁGINA 9: FLUXO DE CAIXA E ECONOMIA
Yaml
Copiar
layout: detailed_table
title: "Projeção de Economia"
sections:
  resumo_economia:
    fatura_sem_geracao: '[FATURA_MENSAL_SEM_GERACAO]'
    fatura_com_geracao: '[FATURA_MENSAL_COM_GERACAO]'
    economia_mensal: '[ECONOMIA_MENSAL]'
    economia_percentual: '[ECONOMIA_PERCENTUAL]%'
    
  fluxo_caixa_tabela:
    headers:
      - "Ano"
      - "Consumo (kWh/Ano)"
      - "Fatura anual sem o sistema"
      - "Geração (kWh/Ano)"
      - "Fatura anual com o sistema"
      - "Fluxo de Caixa"
      - "Economia Acumulada"
      
    data: '[TABELA_FLUXO_CAIXA_25_ANOS]'
    
  observacoes:
    - "*Inflação anual conservadora de [INFLACAO_ANUAL]%, até o 10º ano"
    - "*Redução na geração a uma taxa de [DEGRADACAO_ANUAL]%/ano, devido à degradação dos módulos"
    - "**A fatura média com geração é uma estimativa mensal e pode variar de acordo com o consumo"
    
  grafico_economia:
    title: "Avaliação Econômica"
    type: "line_chart"
    data: '[GRAFICO_ECONOMIA_ACUMULADA]'
    series:
      - name: "Economia com o Sistema"
        color: "#10B981"
      - name: "CDI"
        color: "#F59E0B"
      - name: "Poupança"
        color: "#EF4444"
        
  validade:
    text: "VALIDADE DA PROPOSTA: [VALIDADE_PROPOSTA]"
    destaque: true

4. SISTEMA DE CAMPOS DINÂMICOS
4.1 Engine de Template
Typescript
Copiar
class TemplateEngine {
  private placeholders: Map<string, any> = new Map();
  
  // Registrar dados
  setData(key: string, value: any): void {
    this.placeholders.set(key, value);
  }
  
  // Processar template
  processTemplate(template: string): string {
    let processed = template;
    
    this.placeholders.forEach((value, key) => {
      const regex = new RegExp(`\\[${key}\\]`, 'g');
      processed = processed.replace(regex, this.formatValue(value));
    });
    
    return processed;
  }
  
  // Formatação inteligente
  private formatValue(value: any): string {
    if (typeof value === 'number') {
      return this.formatNumber(value);
    }
    if (value instanceof Date) {
      return this.formatDate(value);
    }
    return String(value);
  }
  
  // Formatação de números
  private formatNumber(value: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  }
  
  // Formatação de datas
  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('pt-BR').format(date);
  }
}

4.2 Sistema de Importação Word
Typescript
Copiar
interface WordImportSystem {
  // Importar documento Word
  importFromWord(file: File): Promise<ParsedDocument>;
  
  // Detectar placeholders
  detectPlaceholders(content: string): string[];
  
  // Mapear campos
  mapFields(placeholders: string[]): FieldMapping[];
  
  // Gerar template
  generateTemplate(document: ParsedDocument): Template;
}

interface ParsedDocument {
  content: string;
  styles: StyleDefinition[];
  images: ImageData[];
  tables: TableData[];
  placeholders: string[];
}

5. SISTEMA DE COMPARTILHAMENTO AVANÇADO
5.1 Geração de Links
Typescript
Copiar
interface ProposalLink {
  id: string;
  proposalId: string;
  url: string;
  
  // Configurações de acesso
  settings: {
    password?: string;
    expirationDate?: Date;
    maxViews?: number;
    allowDownload: boolean;
    allowPrint: boolean;
    watermark?: string;
  };
  
  // Analytics
  analytics: {
    totalViews: number;
    uniqueViews: number;
    downloads: number;
    averageTimeSpent: number;
    lastAccessed?: Date;
  };
  
  // Histórico de visualizações
  viewHistory: ViewRecord[];
}

interface ViewRecord {
  timestamp: Date;
  ipAddress: string;
  userAgent: string;
  deviceInfo: {
    type: 'desktop' | 'mobile' | 'tablet';
    os: string;
    browser: string;
  };
  location?: {
    country: string;
    city: string;
  };
  timeSpent: number; // segundos
  actions: ViewAction[];
}

interface ViewAction {
  type: 'page_view' | 'download' | 'print' | 'share';
  timestamp: Date;
  details?: any;
}

5.2 Dashboard de Analytics
Typescript
Copiar
interface AnalyticsDashboard {
  proposalSummary: {
    totalProposals: number;
    activeLinks: number;
    totalViews: number;
    conversionRate: number;
  };
  
  recentActivity: ViewRecord[];
  
  topProposals: {
    proposalId: string;
    clientName: string;
    views: number;
    lastActivity: Date;
    status: 'viewed' | 'downloaded' | 'expired';
  }[];
  
  geographicData: {
    country: string;
    views: number;
    conversions: number;
  }[];
  
  deviceStats: {
    desktop: number;
    mobile: number;
    tablet: number;
  };
}

6. INTERFACE DO EDITOR
6.1 Layout Principal
Yaml
Copiar
editor_layout:
  header:
    - logo: "Logo da empresa"
    - title: "Editor de Propostas"
    - actions: ["Salvar", "Preview", "Gerar PDF", "Compartilhar"]
    
  sidebar_left:
    width: "280px"
    sections:
      - templates: "Modelos salvos"
      - components: "Componentes disponíveis"
      - assets: "Imagens e recursos"
      
  main_canvas:
    width: "auto"
    features:
      - drag_drop: "Área de edição principal"
      - zoom_controls: "Controles de zoom"
      - page_navigation: "Navegação entre páginas"
      - rulers: "Réguas para alinhamento"
      
  sidebar_right:
    width: "320px"
    sections:
      - properties: "Propriedades do elemento selecionado"
      - data_binding: "Vinculação de dados"
      - styling: "Opções de estilo"
      
  footer:
    - page_counter: "Página X de Y"
    - auto_save: "Salvamento automático"
    - collaboration: "Status de colaboração"

6.2 Componentes Drag-and-Drop
Typescript
Copiar
interface DragDropComponents {
  layout: {
    container: 'Container flexível',
    grid: 'Grid responsivo',
    columns: 'Colunas divididas',
    spacer: 'Espaçador vertical'
  };
  
  content: {
    text: 'Bloco de texto',
    heading: 'Título/subtítulo',
    paragraph: 'Parágrafo',
    list: 'Lista numerada/marcadores'
  };
  
  media: {
    image: 'Imagem com upload',
    logo: 'Logo da empresa',
    chart: 'Gráfico dinâmico',
    table: 'Tabela de dados'
  };
  
  data: {
    client_info: 'Dados do cliente',
    system_specs: 'Especificações do sistema',
    financial_data: 'Dados financeiros',
    environmental: 'Impacto ambiental'
  };
  
  structure: {
    page_break: 'Quebra de página',
    section: 'Seção com título',
    divider: 'Linha divisória',
    footer: 'Rodapé'
  };
}

7. FUNCIONALIDADES AVANÇADAS
7.1 Sistema de Aprovação
Typescript
Copiar
interface ApprovalWorkflow {
  steps: ApprovalStep[];
  currentStep: number;
  status: 'draft' | 'pending' | 'approved' | 'rejected';
  
  notifications: {
    email: boolean;
    slack: boolean;
    inApp: boolean;
  };
}

interface ApprovalStep {
  id: string;
  name: string;
  approvers: User[];
  required: boolean;
  deadline?: Date;
  comments?: Comment[];
  status: 'pending' | 'approved' | 'rejected';
}

7.2 Controle de Versões
Typescript
Copiar
interface VersionControl {
  versions: ProposalVersion[];
  currentVersion: string;
  
  // Ações
  createVersion(comment: string): Promise<string>;
  revertToVersion(versionId: string): Promise<void>;
  compareVersions(v1: string, v2: string): VersionDiff;
  mergeVersions(base: string, branch: string): Promise<void>;
}

interface ProposalVersion {
  id: string;
  timestamp: Date;
  author: User;
  comment: string;
  data: ProposalData;
  changes: ChangeRecord[];
}

7.3 Colaboração em Tempo Real
Typescript
Copiar
interface RealTimeCollaboration {
  activeUsers: CollaboratorInfo[];
  
  // Eventos
  onUserJoin(callback: (user: User) => void): void;
  onUserLeave(callback: (userId: string) => void): void;
  onContentChange(callback: (change: Change) => void): void;
  onCursorMove(callback: (cursor: CursorPosition) => void): void;
  
  // Ações
  broadcastChange(change: Change): void;
  lockElement(elementId: string): void;
  unlockElement(elementId: string): void;
}

interface CollaboratorInfo {
  user: User;
  cursor: CursorPosition;
  lastActivity: Date;
  activeElement?: string;
  color: string; // Cor do cursor/seleção
}

8. CONFIGURAÇÕES E PERSONALIZAÇÃO
8.1 Configurações da Empresa
Typescript
Copiar
interface CompanySettings {
  branding: {
    primaryColor: string;
    secondaryColor: string;
    logo: string;
    font: string;
  };
  
  contactInfo: {
    name: string;
    cnpj: string;
    address: string;
    phone: string;
    email: string;
    website: string;
  };
  
  defaultValues: {
    proposalValidity: number; // dias
    paymentTerms: string[];
    warranties: WarrantyInfo[];
    certifications: string[];
  };
  
  templates: {
    defaultTemplate: string;
    customTemplates: Template[];
    placeholderValues: Record<string, any>;
  };
}

8.2 Configurações de Usuário
Typescript
Copiar
interface UserPreferences {
  interface: {
    theme: 'light' | 'dark' | 'auto';
    language: string;
    timezone: string;
    dateFormat: string;
    numberFormat: string;
  };
  
  editor: {
    autoSave: boolean;
    autoSaveInterval: number; // segundos
    showGrid: boolean;
    snapToGrid: boolean;
    defaultZoom: number;
  };
  
  notifications: {
    email: NotificationSettings;
    push: NotificationSettings;
    inApp: NotificationSettings;
  };
}

9. INTEGRAÇÃO E APIs
9.1 API Externa
Typescript
Copiar
interface ExternalAPI {
  // Dados de irradiação solar
  getSolarData(location: Coordinates): Promise<SolarData>;
  
  // Tarifas de energia
  getEnergyTariffs(region: string): Promise<TariffData>;
  
  // Dados meteorológicos
  getWeatherData(location: Coordinates): Promise<WeatherData>;
  
  // Validação de endereço
  validateAddress(address: string): Promise<AddressData>;
  
  // Cotação de equipamentos
  getEquipmentPrices(specifications: EquipmentSpec[]): Promise<PriceData>;
}

9.2 Webhooks
Typescript
Copiar
interface WebhookEvents {
  'proposal.created': ProposalData;
  'proposal.viewed': ViewEvent;
  'proposal.downloaded': DownloadEvent;
  'proposal.approved': ApprovalEvent;
  'proposal.rejected': RejectionEvent;
  'link.expired': ExpirationEvent;
}

interface WebhookConfig {
  url: string;
  events: (keyof WebhookEvents)[];
  headers?: Record<string, string>;
  secret?: string;
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
  };
}

10. IMPLEMENTAÇÃO TÉCNICA
10.1 Estrutura de Arquivos

src/

├── components/

│ ├── Editor/

│ │ ├── DragDropCanvas.tsx

│ │ ├── ComponentLibrary.tsx

│ │ ├── PropertyPanel.tsx

│ │ └── ToolbarActions.tsx

│ ├── Proposal/

│ │ ├── PageRenderer.tsx

│ │ ├── ComponentRenderer.tsx

│ │ └── PDFGenerator.tsx

│ └── Shared/

│ ├── TemplateEngine.tsx

│ └── Analytics.tsx

├── hooks/

│ ├── useProposal.ts

│ ├── useTemplateEngine.ts

│ └── useRealTimeCollaboration.ts

├── services/

│ ├── ProposalService.ts

│ ├── TemplateService.ts

│ ├── AnalyticsService.ts

│ └── SharingService.ts

├── types/

│ ├── Proposal.ts

│ ├── Template.ts

│ └── Analytics.ts

└── utils/

├── calculations.ts

├── formatters.ts

└── validators.ts

10.2 Performance e Otimização
Typescript
Copiar
interface PerformanceOptimizations {
  // Lazy loading de componentes
  lazyComponents: boolean;
  
  // Virtualização de listas grandes
  virtualScrolling: boolean;
  
  // Cache de templates e dados
  caching: {
    templates: CacheConfig;
    calculations: CacheConfig;
    assets: CacheConfig;
  };
  
  // Debounce para auto-save
  autoSaveDebounce: number;
  
  // Otimização de imagens
  imageOptimization: {
    compression: boolean;
    webpSupport: boolean;
    lazyLoading: boolean;
  };
}

CONCLUSÃO

Este documento especifica um sistema completo de geração de propostas para energia solar com todas as funcionalidades solicitadas:

✅ Interface drag-and-drop intuitiva

✅ Sistema de templates com campos dinâmicos

✅ Compartilhamento avançado com analytics

✅ Importação de Word e editor interno

✅ Controle de visualizações e tracking

✅ 9 páginas detalhadas conforme modelo

✅ Cálculos automáticos precisos

✅ Sistema colaborativo em tempo real

O sistema será robusto, escalável e pronto para uso profissional na geração de propostas comerciais de energia solar.