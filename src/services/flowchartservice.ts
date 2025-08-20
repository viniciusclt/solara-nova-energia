// ============================================================================
// FlowchartService - Implementação mínima para desenvolvimento
// ----------------------------------------------------------------------------
// Este serviço fornece stubs (implementações mínimas) para todas as operações
// utilizadas pelos hooks de fluxograma. O objetivo é garantir que a aplicação
// carregue e o preview funcione, mesmo que as rotas de fluxograma ainda não
// estejam totalmente integradas a um backend real.
// ============================================================================

import type {
  FlowchartServiceConfig,
  FlowchartDocument,
  FlowchartFilters,
  FlowchartTemplate,
  FlowchartNode,
  FlowchartEdge,
  FlowchartComment,
  FlowchartSettings,
} from '@/types/flowchart';

// ----------------------------------------------------------------------------
// Configuração padrão
// ----------------------------------------------------------------------------
export const getDefaultFlowchartServiceConfig = (): FlowchartServiceConfig => ({
  apiUrl: 'http://localhost:3000',
  supabaseUrl: '',
  supabaseKey: '',
  realTimeEnabled: false,
  autoSaveInterval: 30000,
  maxFileSize: 10 * 1024 * 1024,
  allowedImageTypes: ['image/png', 'image/jpeg', 'image/svg+xml'],
  maxHistoryEntries: 100,
  collaborationEnabled: false,
  validationEnabled: true,
  exportEnabled: true,
  templatesEnabled: true,
  commentsEnabled: true,
});

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------
const notImplemented = (method: string) =>
  Promise.reject(new Error(`FlowchartService: método não implementado: ${method}`));

// Pequeno storage em memória para evitar quebras caso usuário navegue até
// as telas de fluxograma em desenvolvimento.
const memory: {
  flowcharts: Record<string, FlowchartDocument>;
  templates: Record<string, FlowchartTemplate>;
  subscribers: Record<string, Array<(payload: unknown) => void>>;
} = {
  flowcharts: {},
  templates: {},
  subscribers: {},
};

const makeId = () => Math.random().toString(36).slice(2, 10);

// ----------------------------------------------------------------------------
// Fábrica do serviço
// ----------------------------------------------------------------------------
export const getFlowchartService = (_config: FlowchartServiceConfig) => {
  return {
    // CRUD de fluxogramas -----------------------------------------------------
    async getFlowcharts(_filters?: FlowchartFilters): Promise<FlowchartDocument[]> {
      return Object.values(memory.flowcharts);
    },
    async getFlowchart(id: string): Promise<FlowchartDocument> {
      const found = memory.flowcharts[id];
      if (!found) throw new Error('Fluxograma não encontrado');
      return found;
    },
    async createFlowchart(data: Partial<FlowchartDocument>): Promise<FlowchartDocument> {
      const id = makeId();
      const now = new Date().toISOString();
      const doc: FlowchartDocument = {
        id,
        title: data.title || 'Novo fluxograma',
        description: data.description || '',
        category: (data as any)?.category || 'general',
        status: (data as any)?.status || 'draft',
        access_level: (data as any)?.access_level || 'private',
        tags: (data as any)?.tags || [],
        nodes: (data as any)?.nodes || [],
        edges: (data as any)?.edges || [],
        settings: (data as any)?.settings || ({} as FlowchartSettings),
        is_favorite: false,
        view_count: 0,
        created_by: (data as any)?.created_by || 'system',
        created_at: now,
        updated_at: now,
      } as FlowchartDocument;
      memory.flowcharts[id] = doc;
      return doc;
    },
    async updateFlowchart(id: string, data: Partial<FlowchartDocument>): Promise<FlowchartDocument> {
      const curr = memory.flowcharts[id];
      if (!curr) throw new Error('Fluxograma não encontrado');
      const updated = { ...curr, ...data, updated_at: new Date().toISOString() } as FlowchartDocument;
      memory.flowcharts[id] = updated;
      return updated;
    },
    async deleteFlowchart(id: string): Promise<void> {
      delete memory.flowcharts[id];
    },
    async duplicateFlowchart(id: string): Promise<FlowchartDocument> {
      const curr = memory.flowcharts[id];
      if (!curr) throw new Error('Fluxograma não encontrado');
      const clone = { ...curr, id: makeId(), title: `${curr.title} (cópia)`, created_at: new Date().toISOString(), updated_at: new Date().toISOString() } as FlowchartDocument;
      memory.flowcharts[clone.id] = clone;
      return clone;
    },

    // Nós ---------------------------------------------------------------------
    async addNode(flowchartId: string, node: Omit<FlowchartNode, 'id'>): Promise<FlowchartNode> {
      const doc = memory.flowcharts[flowchartId];
      if (!doc) throw new Error('Fluxograma não encontrado');
      const newNode = { ...node, id: makeId() } as FlowchartNode;
      doc.nodes = [...(doc.nodes || []), newNode];
      doc.updated_at = new Date().toISOString();
      return newNode;
    },
    async updateNode(flowchartId: string, nodeId: string, data: Partial<FlowchartNode>): Promise<FlowchartNode> {
      const doc = memory.flowcharts[flowchartId];
      if (!doc) throw new Error('Fluxograma não encontrado');
      const idx = (doc.nodes || []).findIndex(n => n.id === nodeId);
      if (idx === -1) throw new Error('Nó não encontrado');
      const updated = { ...(doc.nodes as FlowchartNode[])[idx], ...data } as FlowchartNode;
      (doc.nodes as FlowchartNode[])[idx] = updated;
      doc.updated_at = new Date().toISOString();
      return updated;
    },
    async deleteNode(flowchartId: string, nodeId: string): Promise<void> {
      const doc = memory.flowcharts[flowchartId];
      if (!doc) throw new Error('Fluxograma não encontrado');
      doc.nodes = (doc.nodes || []).filter(n => n.id !== nodeId);
      doc.updated_at = new Date().toISOString();
    },

    // Conexões ----------------------------------------------------------------
    async addEdge(flowchartId: string, edge: Omit<FlowchartEdge, 'id'>): Promise<FlowchartEdge> {
      const doc = memory.flowcharts[flowchartId];
      if (!doc) throw new Error('Fluxograma não encontrado');
      const newEdge = { ...edge, id: makeId() } as FlowchartEdge;
      doc.edges = [...(doc.edges || []), newEdge];
      doc.updated_at = new Date().toISOString();
      return newEdge;
    },
    async updateEdge(flowchartId: string, edgeId: string, data: Partial<FlowchartEdge>): Promise<FlowchartEdge> {
      const doc = memory.flowcharts[flowchartId];
      if (!doc) throw new Error('Fluxograma não encontrado');
      const idx = (doc.edges || []).findIndex(e => e.id === edgeId);
      if (idx === -1) throw new Error('Conexão não encontrada');
      const updated = { ...(doc.edges as FlowchartEdge[])[idx], ...data } as FlowchartEdge;
      (doc.edges as FlowchartEdge[])[idx] = updated;
      doc.updated_at = new Date().toISOString();
      return updated;
    },
    async deleteEdge(flowchartId: string, edgeId: string): Promise<void> {
      const doc = memory.flowcharts[flowchartId];
      if (!doc) throw new Error('Fluxograma não encontrado');
      doc.edges = (doc.edges || []).filter(e => e.id !== edgeId);
      doc.updated_at = new Date().toISOString();
    },

    // Comentários --------------------------------------------------------------
    async addComment(_flowchartId: string, _comment: Omit<FlowchartComment, 'id' | 'created_at' | 'updated_at'>): Promise<FlowchartComment> {
      return notImplemented('addComment');
    },
    async updateComment(_commentId: string, _content: string): Promise<FlowchartComment> {
      return notImplemented('updateComment');
    },
    async deleteComment(_commentId: string): Promise<void> {
      return notImplemented('deleteComment');
    },
    async resolveComment(_commentId: string): Promise<void> {
      return notImplemented('resolveComment');
    },

    // Colaboração -------------------------------------------------------------
    async addCollaborator(_flowchartId: string, _userId: string, _role: string): Promise<void> {
      return notImplemented('addCollaborator');
    },
    async removeCollaborator(_flowchartId: string, _userId: string): Promise<void> {
      return notImplemented('removeCollaborator');
    },
    async updateCollaboratorRole(_flowchartId: string, _userId: string, _role: string): Promise<void> {
      return notImplemented('updateCollaboratorRole');
    },

    // Exportação/Validação ----------------------------------------------------
    async exportFlowchart(_flowchartId: string, _format: string, _options?: unknown): Promise<Blob> {
      return notImplemented('exportFlowchart') as unknown as Promise<Blob>;
    },
    async validateFlowchart(_flowchart: FlowchartDocument): Promise<{ valid: boolean; errors: string[] }> {
      return { valid: true, errors: [] };
    },

    // Tempo real --------------------------------------------------------------
    subscribeToFlowchart(flowchartId: string, cb: (payload: unknown) => void): void {
      if (!memory.subscribers[flowchartId]) memory.subscribers[flowchartId] = [];
      memory.subscribers[flowchartId].push(cb);
    },
    unsubscribeFromFlowchart(flowchartId: string): void {
      delete memory.subscribers[flowchartId];
    },

    // Templates ---------------------------------------------------------------
    async getTemplates(_filters?: Partial<FlowchartFilters>): Promise<FlowchartTemplate[]> {
      return Object.values(memory.templates);
    },
    async getTemplate(id: string): Promise<FlowchartTemplate> {
      const found = memory.templates[id];
      if (!found) throw new Error('Template não encontrado');
      return found;
    },
    async createTemplate(data: Omit<FlowchartTemplate, 'id' | 'created_at' | 'updated_at'>): Promise<FlowchartTemplate> {
      const id = makeId();
      const now = new Date().toISOString();
      const tpl: FlowchartTemplate = { id, created_at: now, updated_at: now, ...(data as any) } as FlowchartTemplate;
      memory.templates[id] = tpl;
      return tpl;
    },
    async updateTemplate(id: string, data: Partial<FlowchartTemplate>): Promise<FlowchartTemplate> {
      const curr = memory.templates[id];
      if (!curr) throw new Error('Template não encontrado');
      const updated = { ...curr, ...data, updated_at: new Date().toISOString() } as FlowchartTemplate;
      memory.templates[id] = updated;
      return updated;
    },
    async deleteTemplate(id: string): Promise<void> {
      delete memory.templates[id];
    },
    async createFlowchartFromTemplate(_templateId: string, _data?: Partial<FlowchartDocument>): Promise<FlowchartDocument> {
      // Implementação simples: cria um fluxograma vazio
      return this.createFlowchart(_data || {});
    },
    async saveFlowchartAsTemplate(_flowchartId: string, _templateData: Partial<FlowchartTemplate>): Promise<FlowchartTemplate> {
      const base: Omit<FlowchartTemplate, 'id' | 'created_at' | 'updated_at'> = {
        title: (_templateData as any)?.title || 'Template',
        description: (_templateData as any)?.description || '',
        category: (_templateData as any)?.category || 'general',
        tags: (_templateData as any)?.tags || [],
        data: (_templateData as any)?.data || {},
        is_favorite: !!(_templateData as any)?.is_favorite,
        access_level: (_templateData as any)?.access_level || 'private',
        status: 'template' as any,
        created_by: 'system',
      } as any;
      return this.createTemplate(base);
    },
  };
};