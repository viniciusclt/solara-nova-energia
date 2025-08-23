import { localDatabase } from './localDatabase';
import { logError, logInfo, logWarn } from '@/utils/secureLogger';

// Tipos mínimos para integração com a store atual
type StoreDiagramDocument = {
  id: string;
  config?: {
    id?: string;
    type?: string;
    title?: string;
    category?: string;
    metadata?: Record<string, unknown>;
  };
  nodes: any[];
  edges: any[];
  viewport?: any;
  thumbnail?: string; // Data URL do thumbnail
  createdAt?: string;
  updatedAt?: string;
  version?: string | number;
};

export type DiagramPermissionRole = 'owner' | 'editor' | 'viewer' | 'commenter';

interface DiagramRecord {
  id: string; // uuid da store
  title: string;
  type: string;
  category?: string;
  status?: string;
  tags?: string[];
  versionLabel?: string; // compatível com '1.0.0'
  document: StoreDiagramDocument;
  thumbnail?: string;
  isFavorite?: boolean;
  viewCount?: number;
  createdAt: string;
  updatedAt: string;
  createdById: string;
}

interface DiagramVersionRecord {
  id?: number;
  diagramId: string;
  versionLabel?: string;
  document: StoreDiagramDocument;
  createdAt: string;
  createdById: string;
}

interface DiagramPermissionRecord {
  id?: number;
  diagramId: string;
  userId: string;
  role: DiagramPermissionRole;
  createdAt: string;
}

export class DiagramService {
  // CRUD básico --------------------------------------------------------------
  async getById(id: string): Promise<DiagramRecord | null> {
    const { data, error } = await localDatabase.from('diagrams').select('*').eq('id', id).single();
    if (error) {
      logWarn('DiagramService.getById error', { id, error });
      return null;
    }
    return data as unknown as DiagramRecord;
  }

  async list(params?: { type?: string; createdById?: string; search?: string; limit?: number; offset?: number; }): Promise<DiagramRecord[]> {
    let query = localDatabase.from('diagrams').select('*').order('updatedAt', { ascending: false });
    if (params?.type) query = query.eq('type', params.type);
    if (params?.createdById) query = query.eq('createdById', params.createdById);

    const result = await query;
    let items = (result.data || []) as DiagramRecord[];

    if (params?.search) {
      const term = params.search.toLowerCase();
      items = items.filter(d => (d.title || '').toLowerCase().includes(term));
    }

    if (typeof params?.offset === 'number') items = items.slice(params.offset);
    if (typeof params?.limit === 'number') items = items.slice(0, params.limit);

    return items;
  }

  async create(record: Omit<DiagramRecord, 'createdAt' | 'updatedAt'>): Promise<DiagramRecord | null> {
    const now = new Date().toISOString();
    const toSave = { ...record, createdAt: now, updatedAt: now } as DiagramRecord;
    const { data, error } = await localDatabase.from('diagrams').insert(toSave);
    if (error) {
      logError('DiagramService.create error', { error, toSave });
      return null;
    }
    const saved = (data && data[0]) as DiagramRecord;
    // Criar primeira versão
    await this.addVersion({ diagramId: saved.id, versionLabel: String(saved.versionLabel || record.versionLabel || '1.0.0'), document: saved.document, createdAt: now, createdById: saved.createdById });
    return saved;
  }

  async update(record: DiagramRecord): Promise<DiagramRecord | null> {
    const now = new Date().toISOString();
    const { data, error } = await localDatabase.from('diagrams').update({ ...record, updatedAt: now }).eq('id', record.id);
    if (error) {
      logError('DiagramService.update error', { error, record });
      return null;
    }
    const updated = (data && data[0]) as DiagramRecord;
    // Versionar snapshot
    await this.addVersion({ diagramId: updated.id, versionLabel: String(updated.versionLabel || '1.0.0'), document: updated.document, createdAt: now, createdById: updated.createdById });
    return updated;
  }

  async save(record: DiagramRecord): Promise<DiagramRecord | null> {
    const existing = await this.getById(record.id);
    if (existing) return this.update({ ...existing, ...record });
    return this.create(record);
  }

  async delete(id: string): Promise<boolean> {
    const { error } = await localDatabase.from('diagrams').delete().eq('id', id);
    if (error) {
      logError('DiagramService.delete error', { error, id });
      return false;
    }
    return true;
  }

  // Versões -----------------------------------------------------------------
  async addVersion(v: DiagramVersionRecord): Promise<void> {
    await localDatabase.from('diagram_versions').insert(v);
  }

  async getVersions(diagramId: string): Promise<DiagramVersionRecord[]> {
    const { data } = await localDatabase.from('diagram_versions').select('*').eq('diagramId', diagramId).order('createdAt', { ascending: false });
    return (data || []) as DiagramVersionRecord[];
  }

  // Permissões ---------------------------------------------------------------
  async setPermission(diagramId: string, userId: string, role: DiagramPermissionRole): Promise<void> {
    // tentar atualizar existente
    const { data } = await localDatabase.from('diagram_permissions').select('*').eq('diagramId', diagramId).eq('userId', userId);
    const now = new Date().toISOString();
    if (data && data.length > 0) {
      await localDatabase.from('diagram_permissions').update({ role, updatedAt: now }).eq('diagramId', diagramId).eq('userId', userId);
    } else {
      await localDatabase.from('diagram_permissions').insert({ diagramId, userId, role, createdAt: now });
    }
  }

  async getUserRole(diagramId: string, userId: string): Promise<DiagramPermissionRole | null> {
    const { data } = await localDatabase.from('diagram_permissions').select('*').eq('diagramId', diagramId).eq('userId', userId).limit(1);
    const rec = data && (data[0] as DiagramPermissionRecord);
    return rec?.role || null;
  }

  canEdit = async (diagram: DiagramRecord, userId: string): Promise<boolean> => {
    if (!diagram) return false;
    if (diagram.createdById === userId) return true;
    const role = await this.getUserRole(diagram.id, userId);
    return role === 'owner' || role === 'editor';
  };

  async getCurrentUser(): Promise<{ id: string; email?: string } | null> {
    try {
      const user = await localDatabase.auth.getUser();
      return user.data.user ? { id: user.data.user.id, email: user.data.user.email } : null;
    } catch (error) {
      logError('DiagramService.getCurrentUser error', { error });
      return null;
    }
  }

  // Thumbnails ---------------------------------------------------------------
  async saveThumbnail(diagramId: string, dataUrl: string): Promise<void> {
    const now = new Date().toISOString();
    const existing = await localDatabase.from('diagram_thumbnails').select('*').eq('diagramId', diagramId);
    if (existing.data && existing.data.length > 0) {
      await localDatabase.from('diagram_thumbnails').update({ dataUrl, updatedAt: now }).eq('diagramId', diagramId);
    } else {
      await localDatabase.from('diagram_thumbnails').insert({ diagramId, dataUrl, createdAt: now, updatedAt: now });
    }
  }

  async getThumbnail(diagramId: string): Promise<string | null> {
    const { data } = await localDatabase.from('diagram_thumbnails').select('*').eq('diagramId', diagramId).limit(1);
    const rec = data && (data[0] as any);
    return rec?.dataUrl || null;
  }

  // Integração com a store atual -------------------------------------------
  async saveFromStore(document: StoreDiagramDocument): Promise<DiagramRecord | null> {
    try {
      const user = await localDatabase.auth.getUser();
      const userId = user.data.user.id;
      const now = new Date().toISOString();
      const base: DiagramRecord = {
        id: document.id,
        title: document.config?.title || 'Sem título',
        type: String(document.config?.type || 'flowchart'),
        category: String(document.config?.category || 'process'),
        status: 'draft',
        tags: [],
        versionLabel: String(document.version || '1.0.0'),
        document,
        thumbnail: document.thumbnail, // Incluir thumbnail se disponível
        createdAt: document.createdAt || now,
        updatedAt: now,
        createdById: userId,
        isFavorite: false,
        viewCount: 0
      } as DiagramRecord;

      const existing = await this.getById(document.id);
      const result = existing ? await this.update({ ...existing, ...base }) : await this.create(base);
      logInfo('DiagramService.saveFromStore ok', { id: result?.id, title: result?.title });
      return result;
    } catch (error) {
      logError('DiagramService.saveFromStore error', { error });
      return null;
    }
  }
}

export const diagramService = new DiagramService();