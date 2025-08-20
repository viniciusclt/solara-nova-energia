// ============================================================================
// PlaybookService - Serviço para gerenciamento de playbooks
// ============================================================================

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  PlaybookDocument,
  PlaybookBlock,
  PlaybookTemplate,
  PlaybookComment,
  PlaybookHistoryEntry,
  PlaybookFilters,
  PlaybookAPI,
  PlaybookServiceConfig,
  PlaybookBlockType,
  PlaybookStatus,
  PlaybookCategory,
  PlaybookAccessLevel
} from '@/types/playbook';

/**
 * Serviço para gerenciamento de playbooks
 */
export class PlaybookService implements PlaybookAPI {
  private supabase: SupabaseClient;
  private config: PlaybookServiceConfig;
  private realtimeChannel?: unknown;

  constructor(config: PlaybookServiceConfig) {
    this.config = config;
    this.supabase = createClient(config.supabaseUrl, config.supabaseKey);
    
    if (config.enableRealtime) {
      this.setupRealtime();
    }
  }

  // ============================================================================
  // Setup Methods
  // ============================================================================

  /**
   * Configura realtime para colaboração
   */
  private setupRealtime(): void {
    this.realtimeChannel = this.supabase
      .channel('playbooks')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'playbooks'
      }, (payload) => {
        this.handleRealtimeUpdate(payload);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'playbook_blocks'
      }, (payload) => {
        this.handleRealtimeBlockUpdate(payload);
      })
      .subscribe();
  }

  /**
   * Manipula atualizações em tempo real
   */
  private handleRealtimeUpdate(payload: Record<string, unknown>): void {
    // Emit custom events for real-time updates
    const event = new CustomEvent('playbook-updated', {
      detail: { payload }
    });
    window.dispatchEvent(event);
  }

  /**
   * Manipula atualizações de blocos em tempo real
   */
  private handleRealtimeBlockUpdate(payload: Record<string, unknown>): void {
    const event = new CustomEvent('playbook-block-updated', {
      detail: { payload }
    });
    window.dispatchEvent(event);
  }

  // ============================================================================
  // CRUD Operations - Playbooks
  // ============================================================================

  /**
   * Busca playbooks com filtros
   */
  async getPlaybooks(filters: PlaybookFilters = {}): Promise<PlaybookDocument[]> {
    try {
      let query = this.supabase
        .from('playbooks')
        .select(`
          *,
          created_by:profiles!playbooks_created_by_fkey(*),
          last_edited_by:profiles!playbooks_last_edited_by_fkey(*),
          collaborators:playbook_collaborators(
            user_id,
            role,
            added_at,
            user:profiles(*)
          )
        `);

      // Apply filters
      if (filters.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }
      
      if (filters.category) {
        query = query.eq('category', filters.category);
      }
      
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      if (filters.accessLevel) {
        query = query.eq('access_level', filters.accessLevel);
      }
      
      if (filters.createdBy) {
        query = query.eq('created_by', filters.createdBy);
      }
      
      if (filters.isTemplate !== undefined) {
        query = query.eq('is_template', filters.isTemplate);
      }
      
      if (filters.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags);
      }

      // Apply sorting
      const sortBy = filters.sortBy || 'updated_at';
      const sortOrder = filters.sortOrder || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data, error } = await query;
      
      if (error) {
        throw new Error(`Erro ao buscar playbooks: ${error.message}`);
      }

      return this.transformPlaybookData(data || []);
    } catch (error) {
      console.error('Erro no getPlaybooks:', error);
      throw error;
    }
  }

  /**
   * Busca um playbook específico
   */
  async getPlaybook(id: string): Promise<PlaybookDocument> {
    try {
      const { data, error } = await this.supabase
        .from('playbooks')
        .select(`
          *,
          created_by:profiles!playbooks_created_by_fkey(*),
          last_edited_by:profiles!playbooks_last_edited_by_fkey(*),
          collaborators:playbook_collaborators(
            user_id,
            role,
            added_at,
            user:profiles(*)
          ),
          blocks:playbook_blocks(
            *,
            created_by:profiles!playbook_blocks_created_by_fkey(*),
            last_edited_by:profiles!playbook_blocks_last_edited_by_fkey(*)
          )
        `)
        .eq('id', id)
        .single();
      
      if (error) {
        throw new Error(`Erro ao buscar playbook: ${error.message}`);
      }
      
      if (!data) {
        throw new Error('Playbook não encontrado');
      }

      return this.transformPlaybookData([data])[0];
    } catch (error) {
      console.error('Erro no getPlaybook:', error);
      throw error;
    }
  }

  /**
   * Cria um novo playbook
   */
  async createPlaybook(data: Partial<PlaybookDocument>): Promise<PlaybookDocument> {
    try {
      const playbookData = {
        title: data.title || 'Novo Playbook',
        description: data.description,
        icon: data.icon,
        cover: data.cover,
        status: data.status || 'draft',
        category: data.category || 'other',
        access_level: data.accessLevel || 'private',
        tags: data.tags || [],
        version: 1,
        is_template: data.isTemplate || false,
        template_id: data.templateId,
        parent_id: data.parentId,
        properties: data.properties || {},
        created_by: data.createdBy?.id,
        last_edited_by: data.createdBy?.id
      };

      const { data: playbook, error } = await this.supabase
        .from('playbooks')
        .insert(playbookData)
        .select(`
          *,
          created_by:profiles!playbooks_created_by_fkey(*),
          last_edited_by:profiles!playbooks_last_edited_by_fkey(*)
        `)
        .single();
      
      if (error) {
        throw new Error(`Erro ao criar playbook: ${error.message}`);
      }

      // Create initial blocks if provided
      if (data.blocks && data.blocks.length > 0) {
        await this.createInitialBlocks(playbook.id, data.blocks);
      } else {
        // Create default paragraph block
        await this.createBlock(playbook.id, {
          type: 'paragraph',
          properties: {
            paragraph: {
              rich_text: [{
                type: 'text',
                text: { content: '' },
                annotations: {},
                plain_text: ''
              }]
            }
          }
        });
      }

      return this.getPlaybook(playbook.id);
    } catch (error) {
      console.error('Erro no createPlaybook:', error);
      throw error;
    }
  }

  /**
   * Atualiza um playbook
   */
  async updatePlaybook(id: string, data: Partial<PlaybookDocument>): Promise<PlaybookDocument> {
    try {
      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString()
      };

      if (data.title !== undefined) updateData.title = data.title;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.icon !== undefined) updateData.icon = data.icon;
      if (data.cover !== undefined) updateData.cover = data.cover;
      if (data.status !== undefined) updateData.status = data.status;
      if (data.category !== undefined) updateData.category = data.category;
      if (data.accessLevel !== undefined) updateData.access_level = data.accessLevel;
      if (data.tags !== undefined) updateData.tags = data.tags;
      if (data.properties !== undefined) updateData.properties = data.properties;
      if (data.lastEditedBy?.id) updateData.last_edited_by = data.lastEditedBy.id;

      // Handle version increment
      if (data.version !== undefined) {
        updateData.version = data.version;
      }

      // Handle publishing
      if (data.status === 'published' && !data.publishedAt) {
        updateData.published_at = new Date().toISOString();
      }

      const { error } = await this.supabase
        .from('playbooks')
        .update(updateData)
        .eq('id', id);
      
      if (error) {
        throw new Error(`Erro ao atualizar playbook: ${error.message}`);
      }

      // Create history entry if versioning is enabled
      if (this.config.enableVersioning) {
        await this.createHistoryEntry(id, data);
      }

      return this.getPlaybook(id);
    } catch (error) {
      console.error('Erro no updatePlaybook:', error);
      throw error;
    }
  }

  /**
   * Deleta um playbook
   */
  async deletePlaybook(id: string): Promise<void> {
    try {
      // Delete related data first
      await Promise.all([
        this.supabase.from('playbook_blocks').delete().eq('playbook_id', id),
        this.supabase.from('playbook_comments').delete().eq('playbook_id', id),
        this.supabase.from('playbook_collaborators').delete().eq('playbook_id', id),
        this.supabase.from('playbook_history').delete().eq('playbook_id', id)
      ]);

      const { error } = await this.supabase
        .from('playbooks')
        .delete()
        .eq('id', id);
      
      if (error) {
        throw new Error(`Erro ao deletar playbook: ${error.message}`);
      }
    } catch (error) {
      console.error('Erro no deletePlaybook:', error);
      throw error;
    }
  }

  // ============================================================================
  // Block Operations
  // ============================================================================

  /**
   * Busca blocos de um playbook
   */
  async getBlocks(playbookId: string): Promise<PlaybookBlock[]> {
    try {
      const { data, error } = await this.supabase
        .from('playbook_blocks')
        .select(`
          *,
          created_by:profiles!playbook_blocks_created_by_fkey(*),
          last_edited_by:profiles!playbook_blocks_last_edited_by_fkey(*)
        `)
        .eq('playbook_id', playbookId)
        .order('position');
      
      if (error) {
        throw new Error(`Erro ao buscar blocos: ${error.message}`);
      }

      return this.transformBlockData(data || []);
    } catch (error) {
      console.error('Erro no getBlocks:', error);
      throw error;
    }
  }

  /**
   * Cria um novo bloco
   */
  async createBlock(playbookId: string, block: Partial<PlaybookBlock>): Promise<PlaybookBlock> {
    try {
      // Get the next position
      const { data: lastBlock } = await this.supabase
        .from('playbook_blocks')
        .select('position')
        .eq('playbook_id', playbookId)
        .order('position', { ascending: false })
        .limit(1)
        .single();

      const position = lastBlock ? lastBlock.position + 1 : 0;

      const blockData = {
        playbook_id: playbookId,
        type: block.type || 'paragraph',
        properties: block.properties || {},
        position,
        has_children: block.has_children || false,
        archived: block.archived || false,
        parent_type: block.parent?.type || 'page_id',
        parent_page_id: block.parent?.page_id || playbookId,
        parent_block_id: block.parent?.block_id,
        created_by: block.createdBy?.id,
        last_edited_by: block.createdBy?.id
      };

      const { data, error } = await this.supabase
        .from('playbook_blocks')
        .insert(blockData)
        .select(`
          *,
          created_by:profiles!playbook_blocks_created_by_fkey(*),
          last_edited_by:profiles!playbook_blocks_last_edited_by_fkey(*)
        `)
        .single();
      
      if (error) {
        throw new Error(`Erro ao criar bloco: ${error.message}`);
      }

      return this.transformBlockData([data])[0];
    } catch (error) {
      console.error('Erro no createBlock:', error);
      throw error;
    }
  }

  /**
   * Atualiza um bloco
   */
  async updateBlock(blockId: string, data: Partial<PlaybookBlock>): Promise<PlaybookBlock> {
    try {
      const updateData: Record<string, unknown> = {
        last_edited_time: new Date().toISOString()
      };

      if (data.type !== undefined) updateData.type = data.type;
      if (data.properties !== undefined) updateData.properties = data.properties;
      if (data.hasChildren !== undefined) updateData.has_children = data.hasChildren;
      if (data.archived !== undefined) updateData.archived = data.archived;
      if (data.lastEditedBy?.id) updateData.last_edited_by = data.lastEditedBy.id;

      const { error } = await this.supabase
        .from('playbook_blocks')
        .update(updateData)
        .eq('id', blockId);
      
      if (error) {
        throw new Error(`Erro ao atualizar bloco: ${error.message}`);
      }

      const { data: block } = await this.supabase
        .from('playbook_blocks')
        .select(`
          *,
          created_by:profiles!playbook_blocks_created_by_fkey(*),
          last_edited_by:profiles!playbook_blocks_last_edited_by_fkey(*)
        `)
        .eq('id', blockId)
        .single();

      return this.transformBlockData([block])[0];
    } catch (error) {
      console.error('Erro no updateBlock:', error);
      throw error;
    }
  }

  /**
   * Deleta um bloco
   */
  async deleteBlock(blockId: string): Promise<void> {
    try {
      // Delete child blocks first
      const { data: childBlocks } = await this.supabase
        .from('playbook_blocks')
        .select('id')
        .eq('parent_block_id', blockId);

      if (childBlocks && childBlocks.length > 0) {
        for (const child of childBlocks) {
          await this.deleteBlock(child.id);
        }
      }

      const { error } = await this.supabase
        .from('playbook_blocks')
        .delete()
        .eq('id', blockId);
      
      if (error) {
        throw new Error(`Erro ao deletar bloco: ${error.message}`);
      }
    } catch (error) {
      console.error('Erro no deleteBlock:', error);
      throw error;
    }
  }

  /**
   * Move um bloco
   */
  async moveBlock(blockId: string, targetId: string, position: 'before' | 'after' | 'inside'): Promise<void> {
    try {
      // Get target block position
      const { data: targetBlock } = await this.supabase
        .from('playbook_blocks')
        .select('position, parent_block_id, playbook_id')
        .eq('id', targetId)
        .single();

      if (!targetBlock) {
        throw new Error('Bloco de destino não encontrado');
      }

      let newPosition: number;
      let newParentBlockId: string | null = null;

      switch (position) {
        case 'before':
          newPosition = targetBlock.position;
          newParentBlockId = targetBlock.parent_block_id;
          break;
        case 'after':
          newPosition = targetBlock.position + 1;
          newParentBlockId = targetBlock.parent_block_id;
          break;
        case 'inside':
          newPosition = 0;
          newParentBlockId = targetId;
          break;
      }

      // Update positions of affected blocks
      if (position !== 'inside') {
        await this.supabase
          .from('playbook_blocks')
          .update({ position: this.supabase.raw('position + 1') })
          .eq('playbook_id', targetBlock.playbook_id)
          .gte('position', newPosition);
      }

      // Update the moved block
      const { error } = await this.supabase
        .from('playbook_blocks')
        .update({
          position: newPosition,
          parent_block_id: newParentBlockId,
          last_edited_time: new Date().toISOString()
        })
        .eq('id', blockId);
      
      if (error) {
        throw new Error(`Erro ao mover bloco: ${error.message}`);
      }
    } catch (error) {
      console.error('Erro no moveBlock:', error);
      throw error;
    }
  }

  // ============================================================================
  // Template Operations
  // ============================================================================

  /**
   * Busca templates
   */
  async getTemplates(filters: PlaybookFilters = {}): Promise<PlaybookTemplate[]> {
    try {
      const templatesFilter = { ...filters, isTemplate: true };
      const playbooks = await this.getPlaybooks(templatesFilter);
      
      return playbooks.map(this.transformPlaybookToTemplate);
    } catch (error) {
      console.error('Erro no getTemplates:', error);
      throw error;
    }
  }

  /**
   * Cria playbook a partir de template
   */
  async createFromTemplate(templateId: string, data: Partial<PlaybookDocument>): Promise<PlaybookDocument> {
    try {
      const template = await this.getPlaybook(templateId);
      
      const playbookData = {
        ...data,
        templateId,
        blocks: template.blocks,
        isTemplate: false
      };

      return this.createPlaybook(playbookData);
    } catch (error) {
      console.error('Erro no createFromTemplate:', error);
      throw error;
    }
  }

  /**
   * Salva playbook como template
   */
  async saveAsTemplate(playbookId: string, templateData: Partial<PlaybookTemplate>): Promise<PlaybookTemplate> {
    try {
      const playbook = await this.getPlaybook(playbookId);
      
      const newTemplate = await this.createPlaybook({
        ...playbook,
        ...templateData,
        isTemplate: true,
        status: 'published',
        accessLevel: templateData.isPublic ? 'public' : 'company'
      });

      return this.transformPlaybookToTemplate(newTemplate);
    } catch (error) {
      console.error('Erro no saveAsTemplate:', error);
      throw error;
    }
  }

  // ============================================================================
  // Collaboration
  // ============================================================================

  /**
   * Busca colaboradores
   */
  async getCollaborators(playbookId: string): Promise<PlaybookDocument['collaborators']> {
    try {
      const { data, error } = await this.supabase
        .from('playbook_collaborators')
        .select(`
          user_id,
          role,
          added_at,
          user:profiles(*)
        `)
        .eq('playbook_id', playbookId);
      
      if (error) {
        throw new Error(`Erro ao buscar colaboradores: ${error.message}`);
      }

      return (data || []).map(collab => ({
        id: collab.user.id,
        name: collab.user.name,
        email: collab.user.email,
        avatar: collab.user.avatar,
        role: collab.role,
        addedAt: collab.added_at
      }));
    } catch (error) {
      console.error('Erro no getCollaborators:', error);
      throw error;
    }
  }

  /**
   * Adiciona colaborador
   */
  async addCollaborator(playbookId: string, userId: string, role: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('playbook_collaborators')
        .insert({
          playbook_id: playbookId,
          user_id: userId,
          role,
          added_at: new Date().toISOString()
        });
      
      if (error) {
        throw new Error(`Erro ao adicionar colaborador: ${error.message}`);
      }
    } catch (error) {
      console.error('Erro no addCollaborator:', error);
      throw error;
    }
  }

  /**
   * Remove colaborador
   */
  async removeCollaborator(playbookId: string, userId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('playbook_collaborators')
        .delete()
        .eq('playbook_id', playbookId)
        .eq('user_id', userId);
      
      if (error) {
        throw new Error(`Erro ao remover colaborador: ${error.message}`);
      }
    } catch (error) {
      console.error('Erro no removeCollaborator:', error);
      throw error;
    }
  }

  /**
   * Atualiza papel do colaborador
   */
  async updateCollaboratorRole(playbookId: string, userId: string, role: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('playbook_collaborators')
        .update({ role })
        .eq('playbook_id', playbookId)
        .eq('user_id', userId);
      
      if (error) {
        throw new Error(`Erro ao atualizar papel do colaborador: ${error.message}`);
      }
    } catch (error) {
      console.error('Erro no updateCollaboratorRole:', error);
      throw error;
    }
  }

  // ============================================================================
  // Comments
  // ============================================================================

  /**
   * Busca comentários
   */
  async getComments(playbookId: string): Promise<PlaybookComment[]> {
    try {
      const { data, error } = await this.supabase
        .from('playbook_comments')
        .select(`
          *,
          created_by:profiles!playbook_comments_created_by_fkey(*),
          resolved_by:profiles!playbook_comments_resolved_by_fkey(*),
          replies:playbook_comment_replies(
            *,
            created_by:profiles(*)
          )
        `)
        .eq('playbook_id', playbookId)
        .order('created_at');
      
      if (error) {
        throw new Error(`Erro ao buscar comentários: ${error.message}`);
      }

      return this.transformCommentData(data || []);
    } catch (error) {
      console.error('Erro no getComments:', error);
      throw error;
    }
  }

  /**
   * Adiciona comentário
   */
  async addComment(playbookId: string, blockId: string, content: string): Promise<PlaybookComment> {
    try {
      const { data, error } = await this.supabase
        .from('playbook_comments')
        .insert({
          playbook_id: playbookId,
          block_id: blockId,
          content,
          created_at: new Date().toISOString()
        })
        .select(`
          *,
          created_by:profiles!playbook_comments_created_by_fkey(*)
        `)
        .single();
      
      if (error) {
        throw new Error(`Erro ao adicionar comentário: ${error.message}`);
      }

      return this.transformCommentData([data])[0];
    } catch (error) {
      console.error('Erro no addComment:', error);
      throw error;
    }
  }

  /**
   * Atualiza comentário
   */
  async updateComment(commentId: string, content: string): Promise<PlaybookComment> {
    try {
      const { error } = await this.supabase
        .from('playbook_comments')
        .update({ content })
        .eq('id', commentId);
      
      if (error) {
        throw new Error(`Erro ao atualizar comentário: ${error.message}`);
      }

      const { data } = await this.supabase
        .from('playbook_comments')
        .select(`
          *,
          created_by:profiles!playbook_comments_created_by_fkey(*)
        `)
        .eq('id', commentId)
        .single();

      return this.transformCommentData([data])[0];
    } catch (error) {
      console.error('Erro no updateComment:', error);
      throw error;
    }
  }

  /**
   * Deleta comentário
   */
  async deleteComment(commentId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('playbook_comments')
        .delete()
        .eq('id', commentId);
      
      if (error) {
        throw new Error(`Erro ao deletar comentário: ${error.message}`);
      }
    } catch (error) {
      console.error('Erro no deleteComment:', error);
      throw error;
    }
  }

  /**
   * Resolve comentário
   */
  async resolveComment(commentId: string): Promise<void> {
    try {
      const { error } = await this.supabase
        .from('playbook_comments')
        .update({
          is_resolved: true,
          resolved_at: new Date().toISOString()
        })
        .eq('id', commentId);
      
      if (error) {
        throw new Error(`Erro ao resolver comentário: ${error.message}`);
      }
    } catch (error) {
      console.error('Erro no resolveComment:', error);
      throw error;
    }
  }

  // ============================================================================
  // History
  // ============================================================================

  /**
   * Busca histórico
   */
  async getHistory(playbookId: string): Promise<PlaybookHistoryEntry[]> {
    try {
      const { data, error } = await this.supabase
        .from('playbook_history')
        .select(`
          *,
          created_by:profiles!playbook_history_created_by_fkey(*)
        `)
        .eq('playbook_id', playbookId)
        .order('created_at', { ascending: false });
      
      if (error) {
        throw new Error(`Erro ao buscar histórico: ${error.message}`);
      }

      return this.transformHistoryData(data || []);
    } catch (error) {
      console.error('Erro no getHistory:', error);
      throw error;
    }
  }

  /**
   * Restaura versão
   */
  async restoreVersion(playbookId: string, version: number): Promise<PlaybookDocument> {
    try {
      const { data: historyEntry } = await this.supabase
        .from('playbook_history')
        .select('snapshot')
        .eq('playbook_id', playbookId)
        .eq('version', version)
        .single();

      if (!historyEntry) {
        throw new Error('Versão não encontrada');
      }

      const snapshot = historyEntry.snapshot as PlaybookDocument;
      return this.updatePlaybook(playbookId, {
        ...snapshot,
        version: snapshot.version + 1
      });
    } catch (error) {
      console.error('Erro no restoreVersion:', error);
      throw error;
    }
  }

  // ============================================================================
  // Publishing
  // ============================================================================

  /**
   * Publica playbook
   */
  async publishPlaybook(playbookId: string): Promise<PlaybookDocument> {
    try {
      return this.updatePlaybook(playbookId, {
        status: 'published',
        publishedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error('Erro no publishPlaybook:', error);
      throw error;
    }
  }

  /**
   * Despublica playbook
   */
  async unpublishPlaybook(playbookId: string): Promise<PlaybookDocument> {
    try {
      return this.updatePlaybook(playbookId, {
        status: 'draft'
      });
    } catch (error) {
      console.error('Erro no unpublishPlaybook:', error);
      throw error;
    }
  }

  // ============================================================================
  // Analytics
  // ============================================================================

  /**
   * Registra visualização
   */
  async trackView(playbookId: string): Promise<void> {
    try {
      // Update view count
      await this.supabase.rpc('increment_playbook_views', {
        playbook_id: playbookId
      });

      // Track individual view
      await this.supabase
        .from('playbook_views')
        .insert({
          playbook_id: playbookId,
          viewed_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Erro no trackView:', error);
      // Don't throw error for analytics
    }
  }

  /**
   * Busca analytics
   */
  async getAnalytics(playbookId: string): Promise<PlaybookDocument['analytics']> {
    try {
      const { data, error } = await this.supabase
        .from('playbooks')
        .select('analytics')
        .eq('id', playbookId)
        .single();
      
      if (error) {
        throw new Error(`Erro ao buscar analytics: ${error.message}`);
      }

      return data.analytics || {
        views: 0,
        uniqueViews: 0,
        comments: 0,
        shares: 0
      };
    } catch (error) {
      console.error('Erro no getAnalytics:', error);
      throw error;
    }
  }

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Cria blocos iniciais
   */
  private async createInitialBlocks(playbookId: string, blocks: PlaybookBlock[]): Promise<void> {
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      await this.createBlock(playbookId, {
        ...block,
        parent: {
          type: 'page_id',
          page_id: playbookId
        }
      });
    }
  }

  /**
   * Cria entrada no histórico
   */
  private async createHistoryEntry(playbookId: string, changes: Partial<PlaybookDocument>): Promise<void> {
    try {
      const playbook = await this.getPlaybook(playbookId);
      
      await this.supabase
        .from('playbook_history')
        .insert({
          playbook_id: playbookId,
          version: playbook.version,
          title: `Versão ${playbook.version}`,
          changes: this.generateChangeDescription(changes),
          snapshot: playbook,
          created_at: new Date().toISOString()
        });
    } catch (error) {
      console.error('Erro ao criar entrada no histórico:', error);
    }
  }

  /**
   * Gera descrição das mudanças
   */
  private generateChangeDescription(changes: Partial<PlaybookDocument>): Array<Record<string, unknown>> {
    const changeList = [];
    
    if (changes.title) {
      changeList.push({
        type: 'property_changed',
        property: 'title',
        description: 'Título alterado'
      });
    }
    
    if (changes.status) {
      changeList.push({
        type: 'property_changed',
        property: 'status',
        description: `Status alterado para ${changes.status}`
      });
    }
    
    return changeList;
  }

  /**
   * Transforma dados do playbook
   */
  private transformPlaybookData(data: Array<Record<string, unknown>>): PlaybookDocument[] {
    return data.map(item => ({
      id: item.id,
      title: item.title,
      description: item.description,
      icon: item.icon,
      cover: item.cover,
      status: item.status,
      category: item.category,
      accessLevel: item.access_level,
      tags: item.tags || [],
      version: item.version,
      isTemplate: item.is_template,
      templateId: item.template_id,
      parentId: item.parent_id,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      publishedAt: item.published_at,
      createdBy: {
        id: item.created_by?.id || item.created_by,
        name: item.created_by?.name || 'Usuário',
        email: item.created_by?.email || '',
        avatar: item.created_by?.avatar
      },
      lastEditedBy: {
        id: item.last_edited_by?.id || item.last_edited_by,
        name: item.last_edited_by?.name || 'Usuário',
        email: item.last_edited_by?.email || '',
        avatar: item.last_edited_by?.avatar
      },
      collaborators: (item.collaborators || []).map((collab: Record<string, unknown>) => ({
        id: collab.user?.id || collab.user_id,
        name: collab.user?.name || 'Usuário',
        email: collab.user?.email || '',
        avatar: collab.user?.avatar,
        role: collab.role,
        addedAt: collab.added_at
      })),
      blocks: this.transformBlockData(item.blocks || []),
      properties: item.properties || {},
      analytics: item.analytics || {
        views: 0,
        uniqueViews: 0,
        comments: 0,
        shares: 0
      }
    }));
  }

  /**
   * Transforma dados dos blocos
   */
  private transformBlockData(data: Array<Record<string, unknown>>): PlaybookBlock[] {
    return data.map(item => ({
      id: item.id,
      type: item.type,
      createdTime: item.created_time,
      createdBy: {
        id: item.created_by?.id || item.created_by,
        name: item.created_by?.name || 'Usuário',
        avatar: item.created_by?.avatar
      },
      lastEditedTime: item.last_edited_time,
      lastEditedBy: {
        id: item.last_edited_by?.id || item.last_edited_by,
        name: item.last_edited_by?.name || 'Usuário',
        avatar: item.last_edited_by?.avatar
      },
      hasChildren: item.has_children,
      archived: item.archived,
      parent: {
        type: item.parent_type,
        page_id: item.parent_page_id,
        block_id: item.parent_block_id
      },
      properties: item.properties || {},
      children: item.children ? this.transformBlockData(item.children) : []
    }));
  }

  /**
   * Transforma dados dos comentários
   */
  private transformCommentData(data: Array<Record<string, unknown>>): PlaybookComment[] {
    return data.map(item => ({
      id: item.id,
      blockId: item.block_id,
      content: item.content,
      createdAt: item.created_at,
      createdBy: {
        id: item.created_by?.id || item.created_by,
        name: item.created_by?.name || 'Usuário',
        email: item.created_by?.email || '',
        avatar: item.created_by?.avatar
      },
      replies: (item.replies || []).map((reply: Record<string, unknown>) => ({
        id: reply.id,
        blockId: reply.block_id,
        content: reply.content,
        createdAt: reply.created_at,
        createdBy: {
          id: reply.created_by?.id || reply.created_by,
          name: reply.created_by?.name || 'Usuário',
          email: reply.created_by?.email || '',
          avatar: reply.created_by?.avatar
        },
        replies: [],
        isResolved: reply.is_resolved,
        resolvedAt: reply.resolved_at,
        resolvedBy: reply.resolved_by ? {
          id: reply.resolved_by.id,
          name: reply.resolved_by.name,
          email: reply.resolved_by.email,
          avatar: reply.resolved_by.avatar
        } : undefined
      })),
      isResolved: item.is_resolved,
      resolvedAt: item.resolved_at,
      resolvedBy: item.resolved_by ? {
        id: item.resolved_by.id,
        name: item.resolved_by.name,
        email: item.resolved_by.email,
        avatar: item.resolved_by.avatar
      } : undefined
    }));
  }

  /**
   * Transforma dados do histórico
   */
  private transformHistoryData(data: Array<Record<string, unknown>>): PlaybookHistoryEntry[] {
    return data.map(item => ({
      id: item.id,
      version: item.version,
      title: item.title,
      description: item.description,
      changes: item.changes || [],
      createdAt: item.created_at,
      createdBy: {
        id: item.created_by?.id || item.created_by,
        name: item.created_by?.name || 'Usuário',
        email: item.created_by?.email || '',
        avatar: item.created_by?.avatar
      },
      snapshot: item.snapshot
    }));
  }

  /**
   * Transforma playbook em template
   */
  private transformPlaybookToTemplate(playbook: PlaybookDocument): PlaybookTemplate {
    return {
      id: playbook.id,
      name: playbook.title,
      description: playbook.description || '',
      category: playbook.category,
      icon: playbook.icon,
      preview: playbook.cover,
      blocks: playbook.blocks,
      tags: playbook.tags,
      isPublic: playbook.accessLevel === 'public',
      usageCount: 0, // TODO: Implement usage tracking
      rating: 0, // TODO: Implement rating system
      createdAt: playbook.createdAt,
      updatedAt: playbook.updatedAt,
      createdBy: playbook.createdBy
    };
  }

  /**
   * Cleanup resources
   */
  destroy(): void {
    if (this.realtimeChannel) {
      this.supabase.removeChannel(this.realtimeChannel);
    }
  }
}

// Export singleton instance
let playbookServiceInstance: PlaybookService | null = null;

export const getPlaybookService = (config?: PlaybookServiceConfig): PlaybookService => {
  if (!playbookServiceInstance && config) {
    playbookServiceInstance = new PlaybookService(config);
  }
  
  if (!playbookServiceInstance) {
    throw new Error('PlaybookService não foi inicializado. Forneça a configuração na primeira chamada.');
  }
  
  return playbookServiceInstance;
};

export default PlaybookService;