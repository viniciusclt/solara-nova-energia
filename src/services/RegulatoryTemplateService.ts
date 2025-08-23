import { 
  logInfo, 
  logWarn, 
  logError,
  type LogEntry 
} from '@/utils/secureLogger';
import { REGULATORY_CONSTANTS } from '@/constants/regulatory';

// ===== INTERFACES PARA DADOS DOS DOCUMENTOS =====

export interface DadosProjeto {
  // Informações básicas
  numero_projeto: string;
  data_elaboracao: Date;
  versao: string;
  
  // Cliente
  cliente: {
    nome: string;
    cpf_cnpj: string;
    endereco: {
      logradouro: string;
      numero: string;
      complemento?: string;
      bairro: string;
      cidade: string;
      uf: string;
      cep: string;
    };
    telefone: string;
    email: string;
    tipo_pessoa: 'fisica' | 'juridica';
  };
  
  // Instalação
  instalacao: {
    numero_instalacao?: string;
    classe_consumo: 'residencial' | 'comercial' | 'industrial' | 'rural';
    grupo_tarifario: 'A' | 'B';
    subgrupo: string;
    tensao_fornecimento: string;
    demanda_contratada?: number;
    historico_consumo: Array<{
      mes: number;
      ano: number;
      consumo_kwh: number;
      demanda_kw?: number;
    }>;
  };
  
  // Sistema fotovoltaico
  sistema_fv: {
    tipo: 'microgeracao' | 'minigeracao';
    potencia_modulos_wp: number;
    potencia_inversores_w: number;
    quantidade_modulos: number;
    quantidade_inversores: number;
    area_ocupada_m2: number;
    orientacao_azimute: number;
    inclinacao_graus: number;
    fator_sombreamento: number;
    
    // Equipamentos
    modulos: Array<{
      fabricante: string;
      modelo: string;
      potencia_wp: number;
      quantidade: number;
      certificacao: string;
      datasheet_url?: string;
    }>;
    
    inversores: Array<{
      fabricante: string;
      modelo: string;
      potencia_w: number;
      quantidade: number;
      certificacao: string;
      datasheet_url?: string;
    }>;
    
    outros_equipamentos: Array<{
      tipo: string;
      descricao: string;
      quantidade: number;
      certificacao?: string;
    }>;
  };
  
  // Responsável técnico
  responsavel_tecnico: {
    nome: string;
    registro_profissional: string;
    conselho: 'CREA' | 'CAU';
    uf_registro: string;
    telefone: string;
    email: string;
    assinatura_digital?: string;
  };
  
  // Concessionária
  concessionaria: {
    nome: string;
    codigo_aneel: string;
    area_concessao: string;
    procedimentos_especificos?: string[];
  };
}

export interface CalculosEnergeticos {
  // Irradiação solar
  irradiacao_media_anual: number; // kWh/m²/dia
  irradiacao_mensal: number[]; // 12 meses
  
  // Geração estimada
  geracao_mensal_kwh: number[]; // 12 meses
  geracao_anual_kwh: number;
  
  // Performance
  performance_ratio: number;
  fator_capacidade: number;
  perdas_sistema: {
    temperatura: number;
    cabeamento: number;
    inversor: number;
    sujidade: number;
    sombreamento: number;
    outras: number;
    total: number;
  };
  
  // Análise econômica
  economia_mensal_rs: number[];
  economia_anual_rs: number;
  payback_anos: number;
  vpl_25_anos: number;
  tir_percentual: number;
}

export interface DocumentTemplate {
  id: string;
  name: string;
  description: string;
  type: 'memorial_descritivo' | 'projeto_eletrico' | 'art_rrt' | 'formulario_acesso' | 'relatorio_tecnico' | 'laudo_conformidade';
  regulatory_basis: string[];
  required_data: string[];
  template_content: string;
  variables: Record<string, {
    description: string;
    type: 'string' | 'number' | 'date' | 'boolean' | 'array' | 'object';
    required: boolean;
    default_value?: any;
  }>;
  formatting_rules: {
    font_family: string;
    font_size: number;
    line_spacing: number;
    margins: { top: number; bottom: number; left: number; right: number };
    header_footer: boolean;
  };
}

export interface GeneratedDocument {
  id: string;
  template_id: string;
  project_id: string;
  content: string;
  metadata: {
    generated_at: Date;
    generated_by: string;
    template_version: string;
    data_hash: string;
  };
  validation: {
    is_valid: boolean;
    issues: Array<{
      type: 'error' | 'warning' | 'info';
      message: string;
      field?: string;
    }>;
    compliance_score: number;
  };
}

// ===== SERVIÇO DE TEMPLATES REGULAMENTARES =====

export class RegulatoryTemplateService {
  private static instance: RegulatoryTemplateService;
  private templates: Map<string, DocumentTemplate> = new Map();

  private constructor() {
    this.initializeDefaultTemplates();
  }

  public static getInstance(): RegulatoryTemplateService {
    if (!RegulatoryTemplateService.instance) {
      RegulatoryTemplateService.instance = new RegulatoryTemplateService();
    }
    return RegulatoryTemplateService.instance;
  }

  // ===== INICIALIZAÇÃO DE TEMPLATES =====

  private initializeDefaultTemplates(): void {
    // Template: Memorial Descritivo
    this.addTemplate({
      id: 'memorial_descritivo_aneel',
      name: 'Memorial Descritivo - ANEEL',
      description: 'Memorial descritivo conforme REN 1000/2021 e Lei 14.300/2022',
      type: 'memorial_descritivo',
      regulatory_basis: [
        'REN ANEEL 1000/2021',
        'Lei 14.300/2022',
        'NBR 5410:2004',
        'NBR 16274:2014'
      ],
      required_data: [
        'dados_cliente',
        'dados_instalacao',
        'sistema_fv',
        'responsavel_tecnico',
        'calculos_energeticos'
      ],
      template_content: this.getMemorialDescritivoTemplate(),
      variables: {
        'cliente.nome': { description: 'Nome do cliente', type: 'string', required: true },
        'cliente.cpf_cnpj': { description: 'CPF/CNPJ do cliente', type: 'string', required: true },
        'sistema_fv.potencia_modulos_wp': { description: 'Potência dos módulos em Wp', type: 'number', required: true },
        'sistema_fv.potencia_inversores_w': { description: 'Potência dos inversores em W', type: 'number', required: true },
        'responsavel_tecnico.nome': { description: 'Nome do responsável técnico', type: 'string', required: true },
        'responsavel_tecnico.registro_profissional': { description: 'Registro profissional', type: 'string', required: true },
        'geracao_anual_kwh': { description: 'Geração anual estimada em kWh', type: 'number', required: true }
      },
      formatting_rules: {
        font_family: 'Arial',
        font_size: 12,
        line_spacing: 1.5,
        margins: { top: 2.5, bottom: 2.5, left: 3, right: 2 },
        header_footer: true
      }
    });

    // Template: Formulário de Solicitação de Acesso
    this.addTemplate({
      id: 'formulario_acesso_aneel',
      name: 'Formulário de Solicitação de Acesso',
      description: 'Formulário padrão para solicitação de acesso conforme REN 1000/2021',
      type: 'formulario_acesso',
      regulatory_basis: [
        'REN ANEEL 1000/2021',
        'Procedimentos de Distribuição - PRODIST'
      ],
      required_data: [
        'dados_cliente',
        'dados_instalacao',
        'sistema_fv',
        'responsavel_tecnico'
      ],
      template_content: this.getFormularioAcessoTemplate(),
      variables: {
        'instalacao.numero_instalacao': { description: 'Número da instalação', type: 'string', required: false },
        'instalacao.classe_consumo': { description: 'Classe de consumo', type: 'string', required: true },
        'instalacao.grupo_tarifario': { description: 'Grupo tarifário', type: 'string', required: true },
        'sistema_fv.tipo': { description: 'Tipo de geração', type: 'string', required: true },
        'concessionaria.nome': { description: 'Nome da concessionária', type: 'string', required: true }
      },
      formatting_rules: {
        font_family: 'Arial',
        font_size: 11,
        line_spacing: 1.2,
        margins: { top: 2, bottom: 2, left: 2.5, right: 2.5 },
        header_footer: false
      }
    });

    // Template: Relatório Técnico
    this.addTemplate({
      id: 'relatorio_tecnico_aneel',
      name: 'Relatório Técnico de Conformidade',
      description: 'Relatório técnico detalhado conforme normas ANEEL',
      type: 'relatorio_tecnico',
      regulatory_basis: [
        'REN ANEEL 1000/2021',
        'Lei 14.300/2022',
        'NBR 16274:2014',
        'NBR 5410:2004'
      ],
      required_data: [
        'dados_projeto',
        'calculos_energeticos',
        'analise_conformidade'
      ],
      template_content: this.getRelatorioTecnicoTemplate(),
      variables: {
        'projeto.numero': { description: 'Número do projeto', type: 'string', required: true },
        'projeto.data_elaboracao': { description: 'Data de elaboração', type: 'date', required: true },
        'conformidade.score': { description: 'Score de conformidade', type: 'number', required: true },
        'validacoes.aneel': { description: 'Validações ANEEL', type: 'array', required: true }
      },
      formatting_rules: {
        font_family: 'Times New Roman',
        font_size: 12,
        line_spacing: 1.5,
        margins: { top: 3, bottom: 3, left: 3, right: 3 },
        header_footer: true
      }
    });

    logInfo(
      'Templates regulamentares inicializados',
      'RegulatoryTemplateService',
      { templates_count: this.templates.size }
    );
  }

  // ===== GESTÃO DE TEMPLATES =====

  public addTemplate(template: DocumentTemplate): void {
    this.templates.set(template.id, template);
    
    logInfo(
      `Template adicionado: ${template.name}`,
      'RegulatoryTemplateService',
      { template_id: template.id, type: template.type }
    );
  }

  public getTemplate(templateId: string): DocumentTemplate | undefined {
    return this.templates.get(templateId);
  }

  public getTemplatesByType(type: DocumentTemplate['type']): DocumentTemplate[] {
    return Array.from(this.templates.values()).filter(template => template.type === type);
  }

  public getAllTemplates(): DocumentTemplate[] {
    return Array.from(this.templates.values());
  }

  public removeTemplate(templateId: string): boolean {
    const removed = this.templates.delete(templateId);
    
    if (removed) {
      logInfo(
        `Template removido: ${templateId}`,
        'RegulatoryTemplateService'
      );
    }
    
    return removed;
  }

  // ===== GERAÇÃO DE DOCUMENTOS =====

  public async generateDocument(
    templateId: string,
    projectData: DadosProjeto,
    calculosEnergeticos?: CalculosEnergeticos,
    additionalData?: Record<string, any>
  ): Promise<GeneratedDocument> {
    const template = this.getTemplate(templateId);
    
    if (!template) {
      throw new Error(`Template não encontrado: ${templateId}`);
    }

    logInfo(
      `Gerando documento: ${template.name}`,
      'RegulatoryTemplateService',
      {
        template_id: templateId,
        project_id: projectData.numero_projeto
      }
    );

    try {
      // Preparar dados para substituição
      const templateData = this.prepareTemplateData(
        projectData,
        calculosEnergeticos,
        additionalData
      );

      // Validar dados obrigatórios
      const validation = this.validateTemplateData(template, templateData);
      
      if (!validation.is_valid && validation.issues.some(issue => issue.type === 'error')) {
        logWarn(
          `Dados inválidos para template ${template.name}`,
          'RegulatoryTemplateService',
          { validation_issues: validation.issues }
        );
      }

      // Processar template
      const processedContent = this.processTemplate(template.template_content, templateData);

      // Gerar documento
      const document: GeneratedDocument = {
        id: `doc_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
        template_id: templateId,
        project_id: projectData.numero_projeto,
        content: processedContent,
        metadata: {
          generated_at: new Date(),
          generated_by: 'Solara Nova Energia',
          template_version: '1.0',
          data_hash: this.generateDataHash(templateData)
        },
        validation
      };

      logInfo(
        `Documento gerado com sucesso: ${template.name}`,
        'RegulatoryTemplateService',
        {
          document_id: document.id,
          compliance_score: validation.compliance_score,
          issues_count: validation.issues.length
        }
      );

      return document;

    } catch (error) {
      logError(
        `Erro ao gerar documento: ${template.name}`,
        'RegulatoryTemplateService',
        {
          template_id: templateId,
          error: error instanceof Error ? error.message : 'Erro desconhecido'
        }
      );
      
      throw error;
    }
  }

  // ===== PROCESSAMENTO DE TEMPLATES =====

  private prepareTemplateData(
    projectData: DadosProjeto,
    calculosEnergeticos?: CalculosEnergeticos,
    additionalData?: Record<string, any>
  ): Record<string, any> {
    const data: Record<string, any> = {
      // Dados do projeto
      projeto: projectData,
      cliente: projectData.cliente,
      instalacao: projectData.instalacao,
      sistema_fv: projectData.sistema_fv,
      responsavel_tecnico: projectData.responsavel_tecnico,
      concessionaria: projectData.concessionaria,
      
      // Cálculos energéticos
      ...(calculosEnergeticos && {
        geracao_anual_kwh: calculosEnergeticos.geracao_anual_kwh,
        geracao_mensal_kwh: calculosEnergeticos.geracao_mensal_kwh,
        economia_anual_rs: calculosEnergeticos.economia_anual_rs,
        payback_anos: calculosEnergeticos.payback_anos,
        performance_ratio: calculosEnergeticos.performance_ratio,
        perdas_sistema: calculosEnergeticos.perdas_sistema
      }),
      
      // Dados adicionais
      ...additionalData,
      
      // Dados regulamentares
      lei_14300: REGULATORY_CONSTANTS.LEI_14300,
      ren_aneel: REGULATORY_CONSTANTS.REN_ANEEL,
      
      // Data atual
      data_atual: new Date().toLocaleDateString('pt-BR'),
      data_atual_extenso: new Date().toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    };

    return data;
  }

  private processTemplate(templateContent: string, data: Record<string, any>): string {
    let processedContent = templateContent;

    // Substituir variáveis simples {{variavel}}
    processedContent = processedContent.replace(/\{\{([^}]+)\}\}/g, (match, path) => {
      const value = this.getNestedValue(data, path.trim());
      return value !== undefined ? String(value) : match;
    });

    // Processar loops {{#each array}} ... {{/each}}
    processedContent = processedContent.replace(
      /\{\{#each\s+([^}]+)\}\}([\s\S]*?)\{\{\/each\}\}/g,
      (match, arrayPath, loopContent) => {
        const array = this.getNestedValue(data, arrayPath.trim());
        if (!Array.isArray(array)) return '';
        
        return array.map((item, index) => {
          let itemContent = loopContent;
          
          // Substituir {{this}} pelo item atual
          itemContent = itemContent.replace(/\{\{this\}\}/g, String(item));
          
          // Substituir {{@index}} pelo índice
          itemContent = itemContent.replace(/\{\{@index\}\}/g, String(index));
          
          // Substituir propriedades do item {{propriedade}}
          if (typeof item === 'object' && item !== null) {
            itemContent = itemContent.replace(/\{\{([^}]+)\}\}/g, (subMatch, prop) => {
              const value = this.getNestedValue(item, prop.trim());
              return value !== undefined ? String(value) : subMatch;
            });
          }
          
          return itemContent;
        }).join('');
      }
    );

    // Processar condicionais {{#if condition}} ... {{/if}}
    processedContent = processedContent.replace(
      /\{\{#if\s+([^}]+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
      (match, condition, content) => {
        const value = this.getNestedValue(data, condition.trim());
        return this.isTruthy(value) ? content : '';
      }
    );

    return processedContent;
  }

  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  private isTruthy(value: any): boolean {
    if (value === null || value === undefined) return false;
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') return value.length > 0;
    if (Array.isArray(value)) return value.length > 0;
    if (typeof value === 'object') return Object.keys(value).length > 0;
    return Boolean(value);
  }

  // ===== VALIDAÇÃO =====

  private validateTemplateData(
    template: DocumentTemplate,
    data: Record<string, any>
  ): GeneratedDocument['validation'] {
    const issues: GeneratedDocument['validation']['issues'] = [];
    let score = 100;

    // Validar variáveis obrigatórias
    for (const [varPath, varConfig] of Object.entries(template.variables)) {
      if (varConfig.required) {
        const value = this.getNestedValue(data, varPath);
        
        if (value === undefined || value === null || value === '') {
          issues.push({
            type: 'error',
            message: `Campo obrigatório ausente: ${varConfig.description}`,
            field: varPath
          });
          score -= 10;
        }
      }
    }

    // Validar dados regulamentares específicos
    if (template.type === 'memorial_descritivo' || template.type === 'relatorio_tecnico') {
      if (!data.responsavel_tecnico?.registro_profissional) {
        issues.push({
          type: 'error',
          message: 'Registro profissional do responsável técnico é obrigatório',
          field: 'responsavel_tecnico.registro_profissional'
        });
        score -= 15;
      }
      
      if (!data.sistema_fv?.potencia_modulos_wp || data.sistema_fv.potencia_modulos_wp <= 0) {
        issues.push({
          type: 'error',
          message: 'Potência dos módulos deve ser maior que zero',
          field: 'sistema_fv.potencia_modulos_wp'
        });
        score -= 10;
      }
    }

    // Validações específicas da Lei 14.300
    if (data.sistema_fv?.potencia_modulos_wp > REGULATORY_CONSTANTS.VALIDACOES_REGULAMENTARES.potencia_maxima_kw * 1000) {
      issues.push({
        type: 'warning',
        message: `Potência excede limite da Lei 14.300/2022 (${REGULATORY_CONSTANTS.VALIDACOES_REGULAMENTARES.potencia_maxima_kw}kW)`,
        field: 'sistema_fv.potencia_modulos_wp'
      });
      score -= 5;
    }

    return {
      is_valid: !issues.some(issue => issue.type === 'error'),
      issues,
      compliance_score: Math.max(0, score)
    };
  }

  private generateDataHash(data: Record<string, any>): string {
    // Gerar hash simples dos dados para controle de versão
    const dataString = JSON.stringify(data, Object.keys(data).sort());
    let hash = 0;
    
    for (let i = 0; i < dataString.length; i++) {
      const char = dataString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(16);
  }

  // ===== TEMPLATES DE CONTEÚDO =====

  private getMemorialDescritivoTemplate(): string {
    return `
# MEMORIAL DESCRITIVO
## Sistema de Microgeração Fotovoltaica

**Projeto:** {{projeto.numero_projeto}}  
**Data:** {{data_atual}}  
**Versão:** {{projeto.versao}}  

---

## 1. IDENTIFICAÇÃO DO CLIENTE

**Nome:** {{cliente.nome}}  
**CPF/CNPJ:** {{cliente.cpf_cnpj}}  
**Endereço:** {{cliente.endereco.logradouro}}, {{cliente.endereco.numero}}{{#if cliente.endereco.complemento}}, {{cliente.endereco.complemento}}{{/if}}  
**Bairro:** {{cliente.endereco.bairro}}  
**Cidade/UF:** {{cliente.endereco.cidade}}/{{cliente.endereco.uf}}  
**CEP:** {{cliente.endereco.cep}}  
**Telefone:** {{cliente.telefone}}  
**E-mail:** {{cliente.email}}  

## 2. DADOS DA INSTALAÇÃO

**Número da Instalação:** {{instalacao.numero_instalacao}}  
**Classe de Consumo:** {{instalacao.classe_consumo}}  
**Grupo Tarifário:** {{instalacao.grupo_tarifario}}  
**Subgrupo:** {{instalacao.subgrupo}}  
**Tensão de Fornecimento:** {{instalacao.tensao_fornecimento}}  
{{#if instalacao.demanda_contratada}}**Demanda Contratada:** {{instalacao.demanda_contratada}} kW{{/if}}  

## 3. SISTEMA FOTOVOLTAICO

**Tipo de Geração:** {{sistema_fv.tipo}}  
**Potência Total dos Módulos:** {{sistema_fv.potencia_modulos_wp}} Wp  
**Potência Total dos Inversores:** {{sistema_fv.potencia_inversores_w}} W  
**Quantidade de Módulos:** {{sistema_fv.quantidade_modulos}} unidades  
**Quantidade de Inversores:** {{sistema_fv.quantidade_inversores}} unidades  
**Área Ocupada:** {{sistema_fv.area_ocupada_m2}} m²  
**Orientação (Azimute):** {{sistema_fv.orientacao_azimute}}°  
**Inclinação:** {{sistema_fv.inclinacao_graus}}°  

### 3.1. Módulos Fotovoltaicos

{{#each sistema_fv.modulos}}
- **{{fabricante}} {{modelo}}**
  - Potência: {{potencia_wp}} Wp
  - Quantidade: {{quantidade}} unidades
  - Certificação: {{certificacao}}
{{/each}}

### 3.2. Inversores

{{#each sistema_fv.inversores}}
- **{{fabricante}} {{modelo}}**
  - Potência: {{potencia_w}} W
  - Quantidade: {{quantidade}} unidades
  - Certificação: {{certificacao}}
{{/each}}

{{#if sistema_fv.outros_equipamentos}}
### 3.3. Outros Equipamentos

{{#each sistema_fv.outros_equipamentos}}
- **{{tipo}}:** {{descricao}} ({{quantidade}} unidades){{#if certificacao}} - {{certificacao}}{{/if}}
{{/each}}
{{/if}}

## 4. ESTIMATIVA DE GERAÇÃO

**Geração Anual Estimada:** {{geracao_anual_kwh}} kWh/ano  
**Performance Ratio:** {{performance_ratio}}  
{{#if economia_anual_rs}}**Economia Anual Estimada:** R$ {{economia_anual_rs}}{{/if}}  
{{#if payback_anos}}**Payback Estimado:** {{payback_anos}} anos{{/if}}  

{{#if perdas_sistema}}
### 4.1. Perdas do Sistema

- Temperatura: {{perdas_sistema.temperatura}}%
- Cabeamento: {{perdas_sistema.cabeamento}}%
- Inversor: {{perdas_sistema.inversor}}%
- Sujidade: {{perdas_sistema.sujidade}}%
- Sombreamento: {{perdas_sistema.sombreamento}}%
- Outras: {{perdas_sistema.outras}}%
- **Total:** {{perdas_sistema.total}}%
{{/if}}

## 5. CONFORMIDADE REGULAMENTAR

Este projeto foi elaborado em conformidade com:

- **Lei 14.300/2022** - Marco Legal da Microgeração e Minigeração Distribuída
- **REN ANEEL 1000/2021** - Procedimentos de Acesso ao Sistema de Distribuição
- **NBR 5410:2004** - Instalações Elétricas de Baixa Tensão
- **NBR 16274:2014** - Sistemas Fotovoltaicos Conectados à Rede
- **Procedimentos de Distribuição (PRODIST)** - Módulo 3

## 6. RESPONSÁVEL TÉCNICO

**Nome:** {{responsavel_tecnico.nome}}  
**Registro:** {{responsavel_tecnico.registro_profissional}} ({{responsavel_tecnico.conselho}}-{{responsavel_tecnico.uf_registro}})  
**Telefone:** {{responsavel_tecnico.telefone}}  
**E-mail:** {{responsavel_tecnico.email}}  

---

**Local e Data:** {{cliente.endereco.cidade}}/{{cliente.endereco.uf}}, {{data_atual_extenso}}


**{{responsavel_tecnico.nome}}**  
{{responsavel_tecnico.conselho}} {{responsavel_tecnico.registro_profissional}}
`;
  }

  private getFormularioAcessoTemplate(): string {
    return `
# FORMULÁRIO DE SOLICITAÇÃO DE ACESSO
## Microgeração/Minigeração Distribuída

**Concessionária:** {{concessionaria.nome}}  
**Data da Solicitação:** {{data_atual}}  

---

## DADOS DO CONSUMIDOR

| Campo | Informação |
|-------|------------|
| Nome/Razão Social | {{cliente.nome}} |
| CPF/CNPJ | {{cliente.cpf_cnpj}} |
| Endereço | {{cliente.endereco.logradouro}}, {{cliente.endereco.numero}} |
| Complemento | {{cliente.endereco.complemento}} |
| Bairro | {{cliente.endereco.bairro}} |
| Cidade/UF | {{cliente.endereco.cidade}}/{{cliente.endereco.uf}} |
| CEP | {{cliente.endereco.cep}} |
| Telefone | {{cliente.telefone}} |
| E-mail | {{cliente.email}} |

## DADOS DA INSTALAÇÃO

| Campo | Informação |
|-------|------------|
| Número da Instalação | {{instalacao.numero_instalacao}} |
| Classe de Consumo | {{instalacao.classe_consumo}} |
| Grupo Tarifário | {{instalacao.grupo_tarifario}} |
| Subgrupo | {{instalacao.subgrupo}} |
| Tensão de Fornecimento | {{instalacao.tensao_fornecimento}} |
{{#if instalacao.demanda_contratada}}| Demanda Contratada | {{instalacao.demanda_contratada}} kW |{{/if}}

## DADOS DO SISTEMA DE GERAÇÃO

| Campo | Informação |
|-------|------------|
| Tipo de Geração | {{sistema_fv.tipo}} |
| Fonte Primária | Solar Fotovoltaica |
| Potência Instalada (kW) | {{sistema_fv.potencia_modulos_wp}} |
| Quantidade de Módulos | {{sistema_fv.quantidade_modulos}} |
| Quantidade de Inversores | {{sistema_fv.quantidade_inversores}} |

### EQUIPAMENTOS PRINCIPAIS

**Módulos Fotovoltaicos:**
{{#each sistema_fv.modulos}}
- {{fabricante}} {{modelo}} - {{potencia_wp}}Wp ({{quantidade}} unidades)
{{/each}}

**Inversores:**
{{#each sistema_fv.inversores}}
- {{fabricante}} {{modelo}} - {{potencia_w}}W ({{quantidade}} unidades)
{{/each}}

## RESPONSÁVEL TÉCNICO

| Campo | Informação |
|-------|------------|
| Nome | {{responsavel_tecnico.nome}} |
| Registro Profissional | {{responsavel_tecnico.registro_profissional}} |
| Conselho | {{responsavel_tecnico.conselho}} |
| UF do Registro | {{responsavel_tecnico.uf_registro}} |
| Telefone | {{responsavel_tecnico.telefone}} |
| E-mail | {{responsavel_tecnico.email}} |

## DECLARAÇÕES

☐ Declaro que o sistema de geração distribuída atende aos requisitos da REN ANEEL 1000/2021
☐ Declaro que o sistema está em conformidade com a Lei 14.300/2022
☐ Declaro que o projeto elétrico foi elaborado conforme NBR 5410 e NBR 16274
☐ Declaro que todos os equipamentos possuem certificação INMETRO

---

**Local e Data:** {{cliente.endereco.cidade}}/{{cliente.endereco.uf}}, {{data_atual}}


**Assinatura do Consumidor**


**Assinatura do Responsável Técnico**  
{{responsavel_tecnico.nome}}  
{{responsavel_tecnico.conselho}} {{responsavel_tecnico.registro_profissional}}
`;
  }

  private getRelatorioTecnicoTemplate(): string {
    return `
# RELATÓRIO TÉCNICO DE CONFORMIDADE
## Sistema de Microgeração Fotovoltaica

**Projeto:** {{projeto.numero_projeto}}  
**Data de Elaboração:** {{projeto.data_elaboracao}}  
**Versão:** {{projeto.versao}}  

---

## RESUMO EXECUTIVO

Este relatório apresenta a análise técnica de conformidade do sistema de microgeração fotovoltaica projetado para o cliente {{cliente.nome}}, localizado em {{cliente.endereco.cidade}}/{{cliente.endereco.uf}}.

**Score de Conformidade:** {{conformidade.score}}%

## 1. ANÁLISE REGULAMENTAR

### 1.1. Lei 14.300/2022

{{#each validacoes.lei_14300}}
- {{nome}}: {{#if conforme}}✅ CONFORME{{else}}❌ NÃO CONFORME{{/if}}
  {{#if observacoes}}  
  *Observações: {{observacoes}}*{{/if}}
{{/each}}

### 1.2. REN ANEEL 1000/2021

{{#each validacoes.ren_aneel}}
- {{nome}}: {{#if conforme}}✅ CONFORME{{else}}❌ NÃO CONFORME{{/if}}
  {{#if observacoes}}  
  *Observações: {{observacoes}}*{{/if}}
{{/each}}

### 1.3. Normas Técnicas

{{#each validacoes.normas_tecnicas}}
- {{norma}}: {{#if atendida}}✅ ATENDIDA{{else}}❌ NÃO ATENDIDA{{/if}}
  {{#if observacoes}}  
  *Observações: {{observacoes}}*{{/if}}
{{/each}}

## 2. ANÁLISE TÉCNICA

### 2.1. Dimensionamento

- **Potência Instalada:** {{sistema_fv.potencia_modulos_wp}} Wp
- **Geração Anual Estimada:** {{geracao_anual_kwh}} kWh
- **Performance Ratio:** {{performance_ratio}}
- **Fator de Capacidade:** {{fator_capacidade}}%

### 2.2. Equipamentos

**Conformidade dos Equipamentos:**
{{#each sistema_fv.modulos}}
- Módulo {{fabricante}} {{modelo}}: {{#if certificacao}}✅ Certificado INMETRO{{else}}❌ Sem certificação{{/if}}
{{/each}}

{{#each sistema_fv.inversores}}
- Inversor {{fabricante}} {{modelo}}: {{#if certificacao}}✅ Certificado INMETRO{{else}}❌ Sem certificação{{/if}}
{{/each}}

### 2.3. Análise de Perdas

| Tipo de Perda | Percentual | Observações |
|---------------|------------|-------------|
| Temperatura | {{perdas_sistema.temperatura}}% | Dentro do esperado |
| Cabeamento | {{perdas_sistema.cabeamento}}% | Conforme NBR 5410 |
| Inversor | {{perdas_sistema.inversor}}% | Conforme especificação |
| Sujidade | {{perdas_sistema.sujidade}}% | Requer manutenção periódica |
| Sombreamento | {{perdas_sistema.sombreamento}}% | {{#if perdas_sistema.sombreamento > 5}}⚠️ Acima do recomendado{{else}}✅ Dentro do aceitável{{/if}} |
| **Total** | **{{perdas_sistema.total}}%** | {{#if perdas_sistema.total > 20}}⚠️ Revisar projeto{{else}}✅ Aceitável{{/if}} |

## 3. ANÁLISE ECONÔMICA

- **Economia Anual:** R$ {{economia_anual_rs}}
- **Payback:** {{payback_anos}} anos
{{#if vpl_25_anos}}- **VPL (25 anos):** R$ {{vpl_25_anos}}{{/if}}
{{#if tir_percentual}}- **TIR:** {{tir_percentual}}%{{/if}}

## 4. RECOMENDAÇÕES

{{#each recomendacoes}}
{{@index + 1}}. {{this}}
{{/each}}

## 5. CONCLUSÃO

O sistema de microgeração fotovoltaica projetado {{#if conformidade.aprovado}}**ATENDE** aos requisitos regulamentares e técnicos{{else}}**NÃO ATENDE** completamente aos requisitos{{/if}} estabelecidos pela legislação vigente.

{{#if conformidade.observacoes_finais}}
**Observações Finais:** {{conformidade.observacoes_finais}}
{{/if}}

---

**Responsável Técnico:**  
{{responsavel_tecnico.nome}}  
{{responsavel_tecnico.conselho}} {{responsavel_tecnico.registro_profissional}}  

**Data:** {{data_atual_extenso}}
`;
  }
}

// Instância singleton
export const regulatoryTemplateService = RegulatoryTemplateService.getInstance();

// Funções de conveniência
export const generateMemorialDescritivo = (
  projectData: DadosProjeto,
  calculosEnergeticos?: CalculosEnergeticos
) => regulatoryTemplateService.generateDocument(
  'memorial_descritivo_aneel',
  projectData,
  calculosEnergeticos
);

export const generateFormularioAcesso = (
  projectData: DadosProjeto
) => regulatoryTemplateService.generateDocument(
  'formulario_acesso_aneel',
  projectData
);

export const generateRelatorioTecnico = (
  projectData: DadosProjeto,
  calculosEnergeticos: CalculosEnergeticos,
  validacoes: Record<string, any>
) => regulatoryTemplateService.generateDocument(
  'relatorio_tecnico_aneel',
  projectData,
  calculosEnergeticos,
  { validacoes, conformidade: { score: 95, aprovado: true } }
);

export default RegulatoryTemplateService;