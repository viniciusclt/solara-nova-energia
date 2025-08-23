// ============================================================================
// NLP Diagram Service - Geração de diagramas via processamento de linguagem natural
// ============================================================================

import { Node, Edge } from 'reactflow';
import { v4 as uuidv4 } from 'uuid';
import { DiagramType } from '../types/diagrams';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface NLPProcessingResult {
  success: boolean;
  diagramType: DiagramType;
  nodes: Node[];
  edges: Edge[];
  title: string;
  description?: string;
  confidence: number;
  suggestions?: string[];
  errors?: string[];
}

export interface NLPKeyword {
  word: string;
  type: 'action' | 'entity' | 'decision' | 'connector' | 'role' | 'concept';
  weight: number;
  diagramTypes: DiagramType[];
}

export interface ProcessStep {
  id: string;
  text: string;
  type: 'start' | 'process' | 'decision' | 'end' | 'subprocess';
  connections: string[];
  position?: { x: number; y: number };
}

// ============================================================================
// DICIONÁRIOS DE PALAVRAS-CHAVE
// ============================================================================

const BPMN_KEYWORDS: NLPKeyword[] = [
  // Ações e processos
  { word: 'iniciar', type: 'action', weight: 0.9, diagramTypes: ['flowchart', 'bpmn'] },
  { word: 'começar', type: 'action', weight: 0.9, diagramTypes: ['flowchart', 'bpmn'] },
  { word: 'processar', type: 'action', weight: 0.8, diagramTypes: ['flowchart', 'bpmn'] },
  { word: 'executar', type: 'action', weight: 0.8, diagramTypes: ['flowchart', 'bpmn'] },
  { word: 'finalizar', type: 'action', weight: 0.9, diagramTypes: ['flowchart', 'bpmn'] },
  { word: 'terminar', type: 'action', weight: 0.9, diagramTypes: ['flowchart', 'bpmn'] },
  { word: 'aprovar', type: 'action', weight: 0.7, diagramTypes: ['flowchart', 'bpmn'] },
  { word: 'rejeitar', type: 'action', weight: 0.7, diagramTypes: ['flowchart', 'bpmn'] },
  { word: 'validar', type: 'action', weight: 0.7, diagramTypes: ['flowchart', 'bpmn'] },
  { word: 'verificar', type: 'action', weight: 0.7, diagramTypes: ['flowchart', 'bpmn'] },
  
  // Decisões
  { word: 'se', type: 'decision', weight: 0.9, diagramTypes: ['flowchart', 'bpmn'] },
  { word: 'caso', type: 'decision', weight: 0.8, diagramTypes: ['flowchart', 'bpmn'] },
  { word: 'decidir', type: 'decision', weight: 0.9, diagramTypes: ['flowchart', 'bpmn'] },
  { word: 'escolher', type: 'decision', weight: 0.8, diagramTypes: ['flowchart', 'bpmn'] },
  { word: 'avaliar', type: 'decision', weight: 0.7, diagramTypes: ['flowchart', 'bpmn'] },
  
  // Conectores
  { word: 'então', type: 'connector', weight: 0.6, diagramTypes: ['flowchart', 'bpmn'] },
  { word: 'depois', type: 'connector', weight: 0.6, diagramTypes: ['flowchart', 'bpmn'] },
  { word: 'em seguida', type: 'connector', weight: 0.7, diagramTypes: ['flowchart', 'bpmn'] },
  { word: 'simultaneamente', type: 'connector', weight: 0.8, diagramTypes: ['flowchart', 'bpmn'] },
  { word: 'paralelamente', type: 'connector', weight: 0.8, diagramTypes: ['flowchart', 'bpmn'] },
];

const MINDMAP_KEYWORDS: NLPKeyword[] = [
  // Conceitos centrais
  { word: 'ideia', type: 'concept', weight: 0.9, diagramTypes: ['mindmap'] },
  { word: 'conceito', type: 'concept', weight: 0.9, diagramTypes: ['mindmap'] },
  { word: 'tema', type: 'concept', weight: 0.8, diagramTypes: ['mindmap'] },
  { word: 'tópico', type: 'concept', weight: 0.8, diagramTypes: ['mindmap'] },
  { word: 'assunto', type: 'concept', weight: 0.7, diagramTypes: ['mindmap'] },
  { word: 'categoria', type: 'concept', weight: 0.7, diagramTypes: ['mindmap'] },
  { word: 'área', type: 'concept', weight: 0.6, diagramTypes: ['mindmap'] },
  { word: 'aspecto', type: 'concept', weight: 0.6, diagramTypes: ['mindmap'] },
  
  // Conectores hierárquicos
  { word: 'inclui', type: 'connector', weight: 0.7, diagramTypes: ['mindmap'] },
  { word: 'contém', type: 'connector', weight: 0.7, diagramTypes: ['mindmap'] },
  { word: 'subdivide', type: 'connector', weight: 0.8, diagramTypes: ['mindmap'] },
  { word: 'ramifica', type: 'connector', weight: 0.8, diagramTypes: ['mindmap'] },
];

const ORGCHART_KEYWORDS: NLPKeyword[] = [
  // Cargos e funções
  { word: 'diretor', type: 'role', weight: 0.9, diagramTypes: ['orgchart'] },
  { word: 'gerente', type: 'role', weight: 0.8, diagramTypes: ['orgchart'] },
  { word: 'coordenador', type: 'role', weight: 0.7, diagramTypes: ['orgchart'] },
  { word: 'supervisor', type: 'role', weight: 0.7, diagramTypes: ['orgchart'] },
  { word: 'analista', type: 'role', weight: 0.6, diagramTypes: ['orgchart'] },
  { word: 'assistente', type: 'role', weight: 0.5, diagramTypes: ['orgchart'] },
  { word: 'estagiário', type: 'role', weight: 0.4, diagramTypes: ['orgchart'] },
  { word: 'ceo', type: 'role', weight: 1.0, diagramTypes: ['orgchart'] },
  { word: 'presidente', type: 'role', weight: 1.0, diagramTypes: ['orgchart'] },
  
  // Hierarquia
  { word: 'subordinado', type: 'connector', weight: 0.8, diagramTypes: ['orgchart'] },
  { word: 'reporta', type: 'connector', weight: 0.8, diagramTypes: ['orgchart'] },
  { word: 'chefia', type: 'connector', weight: 0.8, diagramTypes: ['orgchart'] },
  { word: 'lidera', type: 'connector', weight: 0.7, diagramTypes: ['orgchart'] },
];

// ============================================================================
// CLASSE PRINCIPAL DO SERVIÇO NLP
// ============================================================================

export class NLPDiagramService {
  private keywords: NLPKeyword[];
  
  constructor() {
    this.keywords = [...BPMN_KEYWORDS, ...MINDMAP_KEYWORDS, ...ORGCHART_KEYWORDS];
  }
  
  // ============================================================================
  // MÉTODO PRINCIPAL DE PROCESSAMENTO
  // ============================================================================
  
  async processText(text: string, preferredType?: DiagramType): Promise<NLPProcessingResult> {
    try {
      // Limpar e normalizar o texto
      const cleanText = this.cleanText(text);
      
      // Detectar tipo de diagrama
      const detectedType = preferredType || this.detectDiagramType(cleanText);
      
      // Processar baseado no tipo detectado
      let result: NLPProcessingResult;
      
      switch (detectedType) {
        case 'flowchart':
        case 'bpmn':
          result = this.processFlowchartText(cleanText);
          break;
        case 'mindmap':
          result = this.processMindmapText(cleanText);
          break;
        case 'orgchart':
          result = this.processOrgchartText(cleanText);
          break;
        default:
          result = this.processFlowchartText(cleanText); // Fallback
      }
      
      result.diagramType = detectedType;
      return result;
      
    } catch (error) {
      console.error('Erro no processamento NLP:', error);
      return {
        success: false,
        diagramType: 'flowchart',
        nodes: [],
        edges: [],
        title: 'Erro no processamento',
        confidence: 0,
        errors: [error instanceof Error ? error.message : 'Erro desconhecido']
      };
    }
  }
  
  // ============================================================================
  // DETECÇÃO DE TIPO DE DIAGRAMA
  // ============================================================================
  
  private detectDiagramType(text: string): DiagramType {
    const scores = {
      flowchart: 0,
      mindmap: 0,
      orgchart: 0
    };
    
    const words = text.toLowerCase().split(/\s+/);
    
    words.forEach(word => {
      const keyword = this.keywords.find(k => k.word === word);
      if (keyword) {
        keyword.diagramTypes.forEach(type => {
          if (type in scores) {
            scores[type as keyof typeof scores] += keyword.weight;
          }
        });
      }
    });
    
    // Retornar o tipo com maior pontuação
    const maxScore = Math.max(...Object.values(scores));
    const detectedType = Object.entries(scores).find(([_, score]) => score === maxScore)?.[0];
    
    return (detectedType as DiagramType) || 'flowchart';
  }
  
  // ============================================================================
  // PROCESSAMENTO DE FLUXOGRAMAS/BPMN
  // ============================================================================
  
  private processFlowchartText(text: string): NLPProcessingResult {
    const sentences = this.splitIntoSentences(text);
    const steps: ProcessStep[] = [];
    
    sentences.forEach((sentence, index) => {
      const step = this.extractProcessStep(sentence, index);
      if (step) {
        steps.push(step);
      }
    });
    
    // Conectar os passos
    this.connectSteps(steps);
    
    // Converter para nós e arestas
    const { nodes, edges } = this.stepsToNodesAndEdges(steps, 'flowchart');
    
    return {
      success: true,
      diagramType: 'flowchart',
      nodes,
      edges,
      title: this.extractTitle(text) || 'Processo Gerado',
      confidence: this.calculateConfidence(steps),
      suggestions: this.generateSuggestions(steps)
    };
  }
  
  // ============================================================================
  // PROCESSAMENTO DE MAPAS MENTAIS
  // ============================================================================
  
  private processMindmapText(text: string): NLPProcessingResult {
    const concepts = this.extractConcepts(text);
    const hierarchy = this.buildConceptHierarchy(concepts);
    
    const { nodes, edges } = this.hierarchyToMindmapNodes(hierarchy);
    
    return {
      success: true,
      diagramType: 'mindmap',
      nodes,
      edges,
      title: this.extractTitle(text) || 'Mapa Mental Gerado',
      confidence: this.calculateConfidence(concepts),
      suggestions: this.generateMindmapSuggestions(concepts)
    };
  }
  
  // ============================================================================
  // PROCESSAMENTO DE ORGANOGRAMAS
  // ============================================================================
  
  private processOrgchartText(text: string): NLPProcessingResult {
    const roles = this.extractRoles(text);
    const hierarchy = this.buildRoleHierarchy(roles);
    
    const { nodes, edges } = this.hierarchyToOrgchartNodes(hierarchy);
    
    return {
      success: true,
      diagramType: 'orgchart',
      nodes,
      edges,
      title: this.extractTitle(text) || 'Organograma Gerado',
      confidence: this.calculateConfidence(roles),
      suggestions: this.generateOrgchartSuggestions(roles)
    };
  }
  
  // ============================================================================
  // MÉTODOS AUXILIARES
  // ============================================================================
  
  private cleanText(text: string): string {
    return text
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s\.,;:!?()-]/g, '');
  }
  
  private splitIntoSentences(text: string): string[] {
    return text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 0);
  }
  
  private extractProcessStep(sentence: string, index: number): ProcessStep | null {
    const words = sentence.toLowerCase().split(/\s+/);
    
    // Detectar tipo do passo
    let type: ProcessStep['type'] = 'process';
    
    if (words.some(w => ['iniciar', 'começar', 'início'].includes(w))) {
      type = 'start';
    } else if (words.some(w => ['finalizar', 'terminar', 'fim'].includes(w))) {
      type = 'end';
    } else if (words.some(w => ['se', 'caso', 'decidir'].includes(w))) {
      type = 'decision';
    }
    
    return {
      id: `step-${index}`,
      text: sentence.trim(),
      type,
      connections: []
    };
  }
  
  private connectSteps(steps: ProcessStep[]): void {
    for (let i = 0; i < steps.length - 1; i++) {
      steps[i].connections.push(steps[i + 1].id);
    }
  }
  
  private stepsToNodesAndEdges(steps: ProcessStep[], diagramType: DiagramType): { nodes: Node[], edges: Edge[] } {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    const spacing = { x: 250, y: 150 };
    
    steps.forEach((step, index) => {
      // Mapear tipo do passo para tipo de nó
      let nodeType = 'process';
      switch (step.type) {
        case 'start': nodeType = 'start'; break;
        case 'end': nodeType = 'end'; break;
        case 'decision': nodeType = 'decision'; break;
        case 'subprocess': nodeType = 'subprocess'; break;
      }
      
      nodes.push({
        id: step.id,
        type: nodeType,
        position: { x: 100 + (index * spacing.x), y: 100 },
        data: { 
          label: step.text,
          description: `Passo ${index + 1}` 
        }
      });
      
      // Criar arestas
      step.connections.forEach(targetId => {
        edges.push({
          id: `${step.id}-${targetId}`,
          source: step.id,
          target: targetId,
          type: 'smoothstep'
        });
      });
    });
    
    return { nodes, edges };
  }
  
  private extractConcepts(text: string): string[] {
    const words = text.toLowerCase().split(/\s+/);
    const concepts: string[] = [];
    
    // Extrair substantivos e conceitos importantes
    words.forEach(word => {
      if (word.length > 3 && !this.isStopWord(word)) {
        concepts.push(word);
      }
    });
    
    return [...new Set(concepts)]; // Remover duplicatas
  }
  
  private buildConceptHierarchy(concepts: string[]): any {
    // Implementação simplificada - primeiro conceito como raiz
    const root = concepts[0] || 'Conceito Central';
    const branches = concepts.slice(1);
    
    return {
      id: 'root',
      label: root,
      children: branches.map((concept, index) => ({
        id: `branch-${index}`,
        label: concept,
        children: []
      }))
    };
  }
  
  private hierarchyToMindmapNodes(hierarchy: any): { nodes: Node[], edges: Edge[] } {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    // Nó central
    nodes.push({
      id: hierarchy.id,
      type: 'mindmap-root',
      position: { x: 400, y: 200 },
      data: { label: hierarchy.label }
    });
    
    // Nós filhos
    hierarchy.children.forEach((child: any, index: number) => {
      const angle = (index * 2 * Math.PI) / hierarchy.children.length;
      const radius = 200;
      const x = 400 + radius * Math.cos(angle);
      const y = 200 + radius * Math.sin(angle);
      
      nodes.push({
        id: child.id,
        type: 'mindmap-main',
        position: { x, y },
        data: { label: child.label }
      });
      
      edges.push({
        id: `${hierarchy.id}-${child.id}`,
        source: hierarchy.id,
        target: child.id,
        type: 'smoothstep'
      });
    });
    
    return { nodes, edges };
  }
  
  private extractRoles(text: string): string[] {
    const words = text.toLowerCase().split(/\s+/);
    const roles: string[] = [];
    
    words.forEach(word => {
      const roleKeyword = ORGCHART_KEYWORDS.find(k => k.word === word && k.type === 'role');
      if (roleKeyword) {
        roles.push(word);
      }
    });
    
    return [...new Set(roles)];
  }
  
  private buildRoleHierarchy(roles: string[]): any {
    // Ordenar por peso hierárquico
    const sortedRoles = roles.sort((a, b) => {
      const weightA = ORGCHART_KEYWORDS.find(k => k.word === a)?.weight || 0;
      const weightB = ORGCHART_KEYWORDS.find(k => k.word === b)?.weight || 0;
      return weightB - weightA;
    });
    
    return {
      id: 'root',
      label: sortedRoles[0] || 'CEO',
      children: sortedRoles.slice(1).map((role, index) => ({
        id: `role-${index}`,
        label: role,
        children: []
      }))
    };
  }
  
  private hierarchyToOrgchartNodes(hierarchy: any): { nodes: Node[], edges: Edge[] } {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    
    // Nó raiz
    nodes.push({
      id: hierarchy.id,
      type: 'org-ceo',
      position: { x: 400, y: 50 },
      data: { label: hierarchy.label }
    });
    
    // Nós subordinados
    hierarchy.children.forEach((child: any, index: number) => {
      const x = 200 + (index * 200);
      const y = 200;
      
      nodes.push({
        id: child.id,
        type: 'org-manager',
        position: { x, y },
        data: { label: child.label }
      });
      
      edges.push({
        id: `${hierarchy.id}-${child.id}`,
        source: hierarchy.id,
        target: child.id,
        type: 'straight'
      });
    });
    
    return { nodes, edges };
  }
  
  private extractTitle(text: string): string | null {
    const sentences = this.splitIntoSentences(text);
    if (sentences.length > 0) {
      const firstSentence = sentences[0];
      if (firstSentence.length < 50) {
        return firstSentence;
      }
    }
    return null;
  }
  
  private calculateConfidence(items: any[]): number {
    if (items.length === 0) return 0;
    if (items.length >= 3) return 0.8;
    if (items.length >= 2) return 0.6;
    return 0.4;
  }
  
  private generateSuggestions(steps: ProcessStep[]): string[] {
    const suggestions: string[] = [];
    
    if (steps.length < 3) {
      suggestions.push('Considere adicionar mais detalhes ao processo');
    }
    
    if (!steps.some(s => s.type === 'start')) {
      suggestions.push('Adicione um evento de início claro');
    }
    
    if (!steps.some(s => s.type === 'end')) {
      suggestions.push('Adicione um evento de fim claro');
    }
    
    return suggestions;
  }
  
  private generateMindmapSuggestions(concepts: string[]): string[] {
    const suggestions: string[] = [];
    
    if (concepts.length < 5) {
      suggestions.push('Adicione mais conceitos para enriquecer o mapa mental');
    }
    
    suggestions.push('Considere agrupar conceitos relacionados');
    suggestions.push('Adicione subcategorias para maior detalhamento');
    
    return suggestions;
  }
  
  private generateOrgchartSuggestions(roles: string[]): string[] {
    const suggestions: string[] = [];
    
    if (roles.length < 3) {
      suggestions.push('Adicione mais cargos para completar a estrutura');
    }
    
    suggestions.push('Defina claramente as relações hierárquicas');
    suggestions.push('Considere adicionar departamentos ou áreas');
    
    return suggestions;
  }
  
  private isStopWord(word: string): boolean {
    const stopWords = ['o', 'a', 'os', 'as', 'um', 'uma', 'de', 'do', 'da', 'dos', 'das', 'em', 'no', 'na', 'nos', 'nas', 'para', 'por', 'com', 'sem', 'sobre', 'entre', 'até', 'desde', 'durante', 'após', 'antes', 'depois', 'quando', 'onde', 'como', 'porque', 'que', 'qual', 'quais', 'quem', 'cujo', 'cuja', 'cujos', 'cujas', 'este', 'esta', 'estes', 'estas', 'esse', 'essa', 'esses', 'essas', 'aquele', 'aquela', 'aqueles', 'aquelas', 'isto', 'isso', 'aquilo', 'eu', 'tu', 'ele', 'ela', 'nós', 'vós', 'eles', 'elas', 'me', 'te', 'se', 'nos', 'vos', 'lhe', 'lhes', 'meu', 'minha', 'meus', 'minhas', 'teu', 'tua', 'teus', 'tuas', 'seu', 'sua', 'seus', 'suas', 'nosso', 'nossa', 'nossos', 'nossas', 'vosso', 'vossa', 'vossos', 'vossas', 'ser', 'estar', 'ter', 'haver', 'fazer', 'dizer', 'dar', 'ir', 'vir', 'ver', 'saber', 'poder', 'querer', 'dever', 'muito', 'mais', 'menos', 'bem', 'mal', 'melhor', 'pior', 'maior', 'menor', 'primeiro', 'último', 'outro', 'mesmo', 'todo', 'cada', 'algum', 'nenhum', 'qualquer', 'tanto', 'quanto', 'tão', 'assim', 'então', 'mas', 'porém', 'contudo', 'entretanto', 'todavia', 'não', 'nem', 'nunca', 'sempre', 'já', 'ainda', 'só', 'apenas', 'também', 'inclusive', 'até', 'mesmo', 'sim', 'claro', 'certamente'];
    return stopWords.includes(word.toLowerCase());
  }
}

// ============================================================================
// INSTÂNCIA SINGLETON
// ============================================================================

export const nlpDiagramService = new NLPDiagramService();
export default nlpDiagramService;