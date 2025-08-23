// =====================================================
// ADAPTER DRIZZLE PARA DIAGRAMAS
// Implementa a interface DiagramService usando SQLite
// =====================================================

import { db } from './index';
import { 
  diagrams, 
  diagramRevisions, 
  diagramCollaborators,
  type Diagram,
  type NewDiagram,
  type DiagramRevision,
  type NewDiagramRevision,
  type DiagramCollaborator,
  type NewDiagramCollaborator
} from './schema';
import { eq, and, or, like, desc, asc, count, sql } from 'drizzle-orm';
import type { 
  DiagramService, 
  DiagramData, 
  DiagramPermission,
  DiagramVersion,
  CreateDiagramData,
  UpdateDiagramData,
  DiagramCollaboratorData
} from '../services/DiagramService';
// Add import to access current user from local mock DB
import { localDatabase } from '../services/localDatabase';

// =====================================================
// IMPLEMENTAÇÃO DO ADAPTER DRIZZLE
// =====================================================

export class DrizzleDiagramAdapter implements DiagramService {
  private static instance: DrizzleDiagramAdapter;

  public static getInstance(): DrizzleDiagramAdapter {
    if (!DrizzleDiagramAdapter.instance) {
      DrizzleDiagramAdapter.instance = new DrizzleDiagramAdapter();
    }
    return DrizzleDiagramAdapter.instance;
  }

  // =====================================================
  // OPERAÇÕES CRUD DE DIAGRAMAS
  // =====================================================

  async createDiagram(data: CreateDiagramData): Promise<DiagramData> {
    try {
      const newDiagram: NewDiagram = {
        title: data.title,
        description: data.description,
        type: data.type,
        content: data.content,
        thumbnail: data.thumbnail,
        is_public: data.isPublic || false,
        is_template: data.isTemplate || false,
        owner_id: data.ownerId,
        company_id: data.companyId
      };

      const [diagram] = await db.insert(diagrams).values(newDiagram).returning();
      
      // Criar primeira revisão
      await this.createRevision({
        diagramId: diagram.id,
        content: data.content,
        thumbnail: data.thumbnail,
        changesSummary: 'Versão inicial',
        createdBy: data.ownerId
      });

      return this.mapDiagramToData(diagram);
    } catch (error) {
      console.error('Erro ao criar diagrama:', error);
      throw new Error('Falha ao criar diagrama');
    }
  }

  async getDiagram(id: string): Promise<DiagramData | null> {
    try {
      const [diagram] = await db
        .select()
        .from(diagrams)
        .where(eq(diagrams.id, id))
        .limit(1);

      return diagram ? this.mapDiagramToData(diagram) : null;
    } catch (error) {
      console.error('Erro ao buscar diagrama:', error);
      return null;
    }
  }

  async updateDiagram(id: string, data: UpdateDiagramData): Promise<DiagramData | null> {
    try {
      const updateData: Partial<Diagram> = {
        ...(data.title && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.content && { content: data.content }),
        ...(data.thumbnail !== undefined && { thumbnail: data.thumbnail }),
        ...(data.isPublic !== undefined && { is_public: data.isPublic }),
        updated_at: new Date().toISOString()
      };

      const [updatedDiagram] = await db
        .update(diagrams)
        .set(updateData)
        .where(eq(diagrams.id, id))
        .returning();

      if (!updatedDiagram) return null;

      // Criar nova revisão se o conteúdo foi alterado
      if (data.content && data.updatedBy) {
        await this.createRevision({
          diagramId: id,
          content: data.content,
          thumbnail: data.thumbnail,
          changesSummary: data.changesSummary || 'Atualização',
          createdBy: data.updatedBy
        });

        // Incrementar versão
        await db
          .update(diagrams)
          .set({ version: sql`${diagrams.version} + 1` })
          .where(eq(diagrams.id, id));
      }

      return this.mapDiagramToData(updatedDiagram);
    } catch (error) {
      console.error('Erro ao atualizar diagrama:', error);
      return null;
    }
  }

  async deleteDiagram(id: string): Promise<boolean> {
    try {
      const result = await db
        .delete(diagrams)
        .where(eq(diagrams.id, id));

      return result.changes > 0;
    } catch (error) {
      console.error('Erro ao deletar diagrama:', error);
      return false;
    }
  }

  // =====================================================
  // LISTAGEM E BUSCA
  // =====================================================

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
    try {
      let query = db.select().from(diagrams);
      const conditions = [];

      if (options.ownerId) {
        conditions.push(eq(diagrams.owner_id, options.ownerId));
      }
      if (options.companyId) {
        conditions.push(eq(diagrams.company_id, options.companyId));
      }
      if (options.isPublic !== undefined) {
        conditions.push(eq(diagrams.is_public, options.isPublic));
      }
      if (options.isTemplate !== undefined) {
        conditions.push(eq(diagrams.is_template, options.isTemplate));
      }
      if (options.type) {
        conditions.push(eq(diagrams.type, options.type as any));
      }
      if (options.search) {
        conditions.push(
          or(
            like(diagrams.title, `%${options.search}%`),
            like(diagrams.description, `%${options.search}%`)
          )
        );
      }

      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }

      query = query.orderBy(desc(diagrams.updated_at));

      if (options.limit) {
        query = query.limit(options.limit);
      }
      if (options.offset) {
        query = query.offset(options.offset);
      }

      const results = await query;
      return results.map(this.mapDiagramToData);
    } catch (error) {
      console.error('Erro ao listar diagramas:', error);
      return [];
    }
  }

  // =====================================================
  // VERSÕES E REVISÕES
  // =====================================================

  async createRevision(data: {
    diagramId: string;
    content: any;
    thumbnail?: string;
    changesSummary?: string;
    createdBy: string;
  }): Promise<DiagramVersion | null> {
    try {
      // Obter próximo número de versão
      const [lastRevision] = await db
        .select({ version: diagramRevisions.version })
        .from(diagramRevisions)
        .where(eq(diagramRevisions.diagram_id, data.diagramId))
        .orderBy(desc(diagramRevisions.version))
        .limit(1);

      const nextVersion = (lastRevision?.version || 0) + 1;

      const newRevision: NewDiagramRevision = {
        diagram_id: data.diagramId,
        version: nextVersion,
        content: data.content,
        thumbnail: data.thumbnail,
        changes_summary: data.changesSummary,
        created_by: data.createdBy
      };

      const [revision] = await db
        .insert(diagramRevisions)
        .values(newRevision)
        .returning();

      return this.mapRevisionToVersion(revision);
    } catch (error) {
      console.error('Erro ao criar revisão:', error);
      return null;
    }
  }

  async getVersions(diagramId: string): Promise<DiagramVersion[]> {
    try {
      const revisions = await db
        .select()
        .from(diagramRevisions)
        .where(eq(diagramRevisions.diagram_id, diagramId))
        .orderBy(desc(diagramRevisions.version));

      return revisions.map(this.mapRevisionToVersion);
    } catch (error) {
      console.error('Erro ao buscar versões:', error);
      return [];
    }
  }

  async getVersion(diagramId: string, version: number): Promise<DiagramVersion | null> {
    try {
      const [revision] = await db
        .select()
        .from(diagramRevisions)
        .where(
          and(
            eq(diagramRevisions.diagram_id, diagramId),
            eq(diagramRevisions.version, version)
          )
        )
        .limit(1);

      return revision ? this.mapRevisionToVersion(revision) : null;
    } catch (error) {
      console.error('Erro ao buscar versão:', error);
      return null;
    }
  }

  // =====================================================
  // COLABORADORES E PERMISSÕES
  // =====================================================

  async addCollaborator(data: {
    diagramId: string;
    userId: string;
    permission: DiagramPermission;
    invitedBy: string;
  }): Promise<DiagramCollaboratorData | null> {
    try {
      const newCollaborator: NewDiagramCollaborator = {
        diagram_id: data.diagramId,
        user_id: data.userId,
        permission: data.permission,
        invited_by: data.invitedBy,
        accepted_at: new Date().toISOString() // Auto-aceitar por enquanto
      };

      const [collaborator] = await db
        .insert(diagramCollaborators)
        .values(newCollaborator)
        .returning();

      return this.mapCollaboratorToData(collaborator);
    } catch (error) {
      console.error('Erro ao adicionar colaborador:', error);
      return null;
    }
  }

  async updateCollaboratorPermission(
    diagramId: string,
    userId: string,
    permission: DiagramPermission
  ): Promise<boolean> {
    try {
      const result = await db
        .update(diagramCollaborators)
        .set({ permission })
        .where(
          and(
            eq(diagramCollaborators.diagram_id, diagramId),
            eq(diagramCollaborators.user_id, userId)
          )
        );

      return result.changes > 0;
    } catch (error) {
      console.error('Erro ao atualizar permissão:', error);
      return false;
    }
  }

  async removeCollaborator(diagramId: string, userId: string): Promise<boolean> {
    try {
      const result = await db
        .delete(diagramCollaborators)
        .where(
          and(
            eq(diagramCollaborators.diagram_id, diagramId),
            eq(diagramCollaborators.user_id, userId)
          )
        );

      return result.changes > 0;
    } catch (error) {
      console.error('Erro ao remover colaborador:', error);
      return false;
    }
  }

  async getCollaborators(diagramId: string): Promise<DiagramCollaboratorData[]> {
    try {
      const collaborators = await db
        .select()
        .from(diagramCollaborators)
        .where(eq(diagramCollaborators.diagram_id, diagramId));

      return collaborators.map(this.mapCollaboratorToData);
    } catch (error) {
      console.error('Erro ao buscar colaboradores:', error);
      return [];
    }
  }

  async getUserPermission(diagramId: string, userId: string): Promise<DiagramPermission | null> {
    try {
      // Verificar se é o dono
      const [diagram] = await db
        .select({ owner_id: diagrams.owner_id })
        .from(diagrams)
        .where(eq(diagrams.id, diagramId))
        .limit(1);

      if (diagram?.owner_id === userId) {
        return 'owner';
      }

      // Verificar colaboração
      const [collaborator] = await db
        .select({ permission: diagramCollaborators.permission })
        .from(diagramCollaborators)
        .where(
          and(
            eq(diagramCollaborators.diagram_id, diagramId),
            eq(diagramCollaborators.user_id, userId)
          )
        )
        .limit(1);

      return collaborator?.permission || null;
    } catch (error) {
      console.error('Erro ao verificar permissão:', error);
      return null;
    }
  }

  // Novo: Upsert de permissão unificada (compatível com serviço legado)
  async setPermission(
    diagramId: string,
    userId: string,
    permission: DiagramPermission
  ): Promise<boolean> {
    try {
      if (permission === 'owner') {
        // Transferir propriedade
        await db
          .update(diagrams)
          .set({ owner_id: userId })
          .where(eq(diagrams.id, diagramId));

        // Remover registro de colaborador (se existir) para o novo owner
        await db
          .delete(diagramCollaborators)
          .where(
            and(
              eq(diagramCollaborators.diagram_id, diagramId),
              eq(diagramCollaborators.user_id, userId)
            )
          );
        return true;
      }

      // Verificar se já existe colaborador
      const existing = await db
        .select()
        .from(diagramCollaborators)
        .where(
          and(
            eq(diagramCollaborators.diagram_id, diagramId),
            eq(diagramCollaborators.user_id, userId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        const result = await db
          .update(diagramCollaborators)
          .set({ permission })
          .where(
            and(
              eq(diagramCollaborators.diagram_id, diagramId),
              eq(diagramCollaborators.user_id, userId)
            )
          );
        return result.changes > 0;
      }

      const [collaborator] = await db
        .insert(diagramCollaborators)
        .values({
          diagram_id: diagramId,
          user_id: userId,
          permission,
          accepted_at: new Date().toISOString()
        } satisfies NewDiagramCollaborator)
        .returning();

      return !!collaborator;
    } catch (error) {
      console.error('Erro ao definir permissão:', error);
      return false;
    }
  }

  // Autenticação e permissões unificadas
  async getCurrentUser(): Promise<{ id: string; email?: string } | null> {
    try {
      const user = await localDatabase.auth.getUser();
      return user.data.user ? { id: user.data.user.id, email: user.data.user.email } : null;
    } catch (error) {
      console.error('Erro ao obter usuário atual:', error);
      return null;
    }
  }

  async canEdit(diagramId: string, userId: string): Promise<boolean> {
    try {
      const permission = await this.getUserPermission(diagramId, userId);
      return permission === 'owner' || permission === 'editor';
    } catch (error) {
      console.error('Erro ao verificar edição:', error);
      return false;
    }
  }

  // Integração com a store atual
  async saveFromStore(document: any): Promise<any> {
    try {
      const user = await this.getCurrentUser();
      if (!user) throw new Error('Usuário não autenticado');

      const diagramId = document?.id;
      const title = document?.config?.title || 'Sem título';
      const type = String(document?.config?.type || 'flowchart') as any;
      const content = {
        nodes: Array.isArray(document?.nodes) ? document.nodes : [],
        edges: Array.isArray(document?.edges) ? document.edges : [],
        viewport: document?.viewport || { x: 0, y: 0, zoom: 1 }
      };
      const thumbnail = document?.thumbnail;

      const existing = await this.getDiagram(diagramId);

      if (!existing) {
        const created = await this.createDiagram({
          title,
          description: document?.config?.metadata?.description,
          type,
          content,
          thumbnail,
          isPublic: false,
          isTemplate: false,
          ownerId: user.id,
          companyId: undefined
        });
        return created;
      } else {
        const updated = await this.updateDiagram(diagramId, {
          title,
          content,
          thumbnail,
          updatedBy: user.id,
          changesSummary: 'Atualização via store'
        });
        return updated;
      }
    } catch (error) {
      console.error('Erro ao salvar a partir da store:', error);
      return null;
    }
  }

  private mapDiagramToData(diagram: Diagram): DiagramData {
    return {
      id: diagram.id,
      title: diagram.title,
      description: diagram.description,
      type: diagram.type,
      content: diagram.content,
      thumbnail: diagram.thumbnail,
      isPublic: diagram.is_public,
      isTemplate: diagram.is_template,
      version: diagram.version,
      ownerId: diagram.owner_id,
      companyId: diagram.company_id,
      createdAt: diagram.created_at,
      updatedAt: diagram.updated_at
    };
  }

  private mapRevisionToVersion(revision: DiagramRevision): DiagramVersion {
    return {
      id: revision.id,
      diagramId: revision.diagram_id,
      version: revision.version,
      content: revision.content,
      thumbnail: revision.thumbnail,
      changesSummary: revision.changes_summary,
      createdBy: revision.created_by,
      createdAt: revision.created_at
    };
  }

  private mapCollaboratorToData(collaborator: DiagramCollaborator): DiagramCollaboratorData {
    return {
      id: collaborator.id,
      diagramId: collaborator.diagram_id,
      userId: collaborator.user_id,
      permission: collaborator.permission,
      invitedBy: collaborator.invited_by,
      invitedAt: collaborator.invited_at,
      acceptedAt: collaborator.accepted_at,
      createdAt: collaborator.created_at
    };
  }
}

// =====================================================
// INSTÂNCIA SINGLETON
// =====================================================

export const drizzleDiagramService = DrizzleDiagramAdapter.getInstance();