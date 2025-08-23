// =====================================================
// FACTORY PARA SERVIÇOS DE DIAGRAMA
// Permite escolher entre IndexedDB e Drizzle/SQLite
// =====================================================

import { DiagramService as LegacyDiagramService } from './DiagramService';
import { drizzleDiagramService } from '../db/diagramAdapter';

// =====================================================
// TIPOS PARA COMPATIBILIDADE
// =====================================================

export type DiagramPermission = 'owner' | 'editor' | 'viewer' | 'commenter';
export type DiagramType = 'flowchart' | 'mindmap' | 'bpmn' | 'organogram' | 'network' | 'custom';

export interface DiagramData {
  id: string;
  title: string;
  description?: string | null;
  type: DiagramType;
  content: any;
  thumbnail?: string | null;
  isPublic: boolean;
  isTemplate: boolean;
  version: number;
  ownerId: string;
  companyId?: string | null;
  createdAt?: string | null;
  updatedAt?: string | null;
}

export interface CreateDiagramData {
  title: string;
  description?: string;
  type: DiagramType;
  content: any;
  thumbnail?: string;
  isPublic?: boolean;
  isTemplate?: boolean;
  ownerId: string;
  companyId?: string;
}

export interface UpdateDiagramData {
  title?: string;
  description?: string;
  content?: any;
  thumbnail?: string;
  isPublic?: boolean;
  changesSummary?: string;
  updatedBy?: string;
}

export interface DiagramVersion {
  id: string;
  diagramId: string;
  version: number;
  content: any;
  thumbnail?: string | null;
  changesSummary?: string | null;
  createdBy: string;
  createdAt?: string | null;
}

export interface DiagramCollaboratorData {
  id: string;
  diagramId: string;
  userId: string;
  permission: DiagramPermission;
  invitedBy?: string | null;
  invitedAt?: string | null;
  acceptedAt?: string | null;
  createdAt?: string | null;
}

// =====================================================
// INTERFACE UNIFICADA DO SERVIÇO
// =====================================================

export interface DiagramService {
  // CRUD básico
  createDiagram(data: CreateDiagramData): Promise<DiagramData>;
  getDiagram(id: string): Promise<DiagramData | null>;
  updateDiagram(id: string, data: UpdateDiagramData): Promise<DiagramData | null>;
  deleteDiagram(id: string): Promise<boolean>;
  
  // Listagem e busca
  listDiagrams(options?: {
    ownerId?: string;
    companyId?: string;
    isPublic?: boolean;
    isTemplate?: boolean;
    type?: string;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<DiagramData[]>;
  
  // Versões
  createRevision(data: {
    diagramId: string;
    content: any;
    thumbnail?: string;
    changesSummary?: string;
    createdBy: string;
  }): Promise<DiagramVersion | null>;
  getVersions(diagramId: string): Promise<DiagramVersion[]>;
  getVersion(diagramId: string, version: number): Promise<DiagramVersion | null>;
  
  // Colaboradores
  addCollaborator(data: {
    diagramId: string;
    userId: string;
    permission: DiagramPermission;
    invitedBy: string;
  }): Promise<DiagramCollaboratorData | null>;
  updateCollaboratorPermission(
    diagramId: string,
    userId: string,
    permission: DiagramPermission
  ): Promise<boolean>;
  removeCollaborator(diagramId: string, userId: string): Promise<boolean>;
  getCollaborators(diagramId: string): Promise<DiagramCollaboratorData[]>;
  getUserPermission(diagramId: string, userId: string): Promise<DiagramPermission | null>;
  // Novo: API compatível com serviço legado
  setPermission(diagramId: string, userId: string, permission: DiagramPermission): Promise<boolean>;

  // Autenticação/Permissões unificadas
  getCurrentUser(): Promise<{ id: string; email?: string } | null>;
  canEdit(diagramId: string, userId: string): Promise<boolean>;

  // Integração com a Store atual
  saveFromStore(document: any): Promise<any>;
}

// =====================================================
// ADAPTER PARA COMPATIBILIDADE COM INDEXEDDB
// =====================================================

class IndexedDBDiagramAdapter implements DiagramService {
  private indexedDBService: LegacyDiagramService;

  constructor() {
    this.indexedDBService = new LegacyDiagramService();
  }

  async createDiagram(data: CreateDiagramData): Promise<DiagramData> {
    // Converter para formato IndexedDB
    const record = {
      id: crypto.randomUUID(),
      title: data.title,
      type: data.type,
      category: data.type,
      status: 'draft',
      tags: [],
      versionLabel: '1.0.0',
      document: {
        id: crypto.randomUUID(),
        config: {
          id: crypto.randomUUID(),
          type: data.type,
          title: data.title,
          category: data.type,
          metadata: {}
        },
        nodes: Array.isArray(data.content?.nodes) ? data.content.nodes : [],
        edges: Array.isArray(data.content?.edges) ? data.content.edges : [],
        viewport: data.content?.viewport || { x: 0, y: 0, zoom: 1 },
        thumbnail: data.thumbnail,
        version: 1
      },
      thumbnail: data.thumbnail,
      isFavorite: false,
      viewCount: 0,
      createdById: data.ownerId
    };

    const result = await this.indexedDBService.create(record as any);
    if (!result) throw new Error('Falha ao criar diagrama');

    return this.mapToStandardFormat(result);
  }

  async getDiagram(id: string): Promise<DiagramData | null> {
    const result = await (this.indexedDBService as any).getById(id);
    return result ? this.mapToStandardFormat(result) : null;
  }

  async updateDiagram(id: string, data: UpdateDiagramData): Promise<DiagramData | null> {
    const existing = await (this.indexedDBService as any).getById(id);
    if (!existing) return null;

    const updated = {
      ...existing,
      ...(data.title && { title: data.title }),
      ...(data.content && {
        document: {
          ...existing.document,
          nodes: data.content.nodes || existing.document.nodes,
          edges: data.content.edges || existing.document.edges,
          viewport: data.content.viewport || existing.document.viewport
        }
      }),
      ...(data.thumbnail !== undefined && { thumbnail: data.thumbnail }),
      updatedAt: new Date().toISOString()
    };

    const result = await (this.indexedDBService as any).update(updated);
    return result ? this.mapToStandardFormat(result) : null;
  }

  async deleteDiagram(id: string): Promise<boolean> {
    return await (this.indexedDBService as any).delete(id);
  }

  async listDiagrams(options: {
    ownerId?: string;
    companyId?: string;
    isPublic?: boolean;
    isTemplate?: boolean;
    type?: string;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<DiagramData[]> {
    const results = await (this.indexedDBService as any).list({
      type: options.type,
      createdById: options.ownerId,
      search: options.search,
      limit: options.limit,
      offset: options.offset
    });

    return results.map(this.mapToStandardFormat);
  }

  // Métodos não implementados no IndexedDB original
  async createRevision(): Promise<DiagramVersion | null> {
    console.warn('createRevision não implementado no IndexedDB adapter');
    return null;
  }

  async getVersions(): Promise<DiagramVersion[]> {
    console.warn('getVersions não implementado no IndexedDB adapter');
    return [];
  }

  async getVersion(): Promise<DiagramVersion | null> {
    console.warn('getVersion não implementado no IndexedDB adapter');
    return null;
  }

  async addCollaborator(): Promise<DiagramCollaboratorData | null> {
    console.warn('addCollaborator não implementado no IndexedDB adapter');
    return null;
  }

  async updateCollaboratorPermission(): Promise<boolean> {
    console.warn('updateCollaboratorPermission não implementado no IndexedDB adapter');
    return false;
  }

  async removeCollaborator(): Promise<boolean> {
    console.warn('removeCollaborator não implementado no IndexedDB adapter');
    return false;
  }

  async getCollaborators(): Promise<DiagramCollaboratorData[]> {
    console.warn('getCollaborators não implementado no IndexedDB adapter');
    return [];
  }

  async getUserPermission(diagramId: string, userId: string): Promise<DiagramPermission | null> {
    try {
      const record = await (this.indexedDBService as any).getById(diagramId);
      if (!record) return null;
      if (record.createdById === userId) return 'owner';
      const role = await (this.indexedDBService as any).getUserRole(diagramId, userId);
      return (role as DiagramPermission) || null;
    } catch {
      return null;
    }
  }

  // Métodos adicionais de compatibilidade
  async setPermission(diagramId: string, userId: string, permission: DiagramPermission): Promise<boolean> {
    try {
      await (this.indexedDBService as any).setPermission(diagramId, userId, permission);
      return true;
    } catch {
      return false;
    }
  }

  async getCurrentUser(): Promise<{ id: string; email?: string } | null> {
    return (this.indexedDBService as any).getCurrentUser();
  }

  async canEdit(diagramId: string, userId: string): Promise<boolean> {
    try {
      const record = await (this.indexedDBService as any).getById(diagramId);
      if (!record) return false;
      return (this.indexedDBService as any).canEdit(record, userId);
    } catch {
      return false;
    }
  }

  async saveFromStore(document: any): Promise<any> {
    return (this.indexedDBService as any).saveFromStore(document);
  }

  private mapToStandardFormat(record: any): DiagramData {
    return {
      id: record.id,
      title: record.title,
      description: record.document?.config?.metadata?.description,
      type: record.type,
      content: {
        nodes: record.document?.nodes || [],
        edges: record.document?.edges || [],
        viewport: record.document?.viewport || { x: 0, y: 0, zoom: 1 }
      },
      thumbnail: record.thumbnail,
      isPublic: false, // IndexedDB não tem campo público
      isTemplate: false, // IndexedDB não tem campo template
      version: record.document?.version || 1,
      ownerId: record.createdById,
      companyId: null, // IndexedDB não tem company
      createdAt: record.createdAt,
      updatedAt: record.updatedAt
    };
  }
}

// =====================================================
// FACTORY E CONFIGURAÇÃO
// =====================================================

type DiagramServiceType = 'indexeddb' | 'drizzle';

class DiagramServiceFactory {
  private static instance: DiagramServiceFactory;
  private currentService: DiagramService | null = null;
  private serviceType: DiagramServiceType = 'drizzle'; // Padrão

  public static getInstance(): DiagramServiceFactory {
    if (!DiagramServiceFactory.instance) {
      DiagramServiceFactory.instance = new DiagramServiceFactory();
    }
    return DiagramServiceFactory.instance;
  }

  setServiceType(type: DiagramServiceType): void {
    this.serviceType = type;
    this.currentService = null; // Reset para recriar
  }

  getService(): DiagramService {
    if (!this.currentService) {
      switch (this.serviceType) {
        case 'drizzle':
          this.currentService = drizzleDiagramService as unknown as DiagramService;
          break;
        case 'indexeddb':
        default:
          this.currentService = new IndexedDBDiagramAdapter();
          break;
      }
    }
    return this.currentService;
  }

  getCurrentServiceType(): DiagramServiceType {
    return this.serviceType;
  }
}

// =====================================================
// INSTÂNCIA SINGLETON E EXPORTS
// =====================================================

export const diagramServiceFactory = DiagramServiceFactory.getInstance();

// Conveniência: service padrão
export const diagramService = diagramServiceFactory.getService();

// Função para trocar o tipo de serviço
export const setDiagramServiceType = (type: DiagramServiceType) => {
  diagramServiceFactory.setServiceType(type);
};

// Função para obter o serviço atual
export const getDiagramService = () => {
  return diagramServiceFactory.getService();
};