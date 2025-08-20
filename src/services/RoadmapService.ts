/**
 * Serviço de Roadmap
 * 
 * Gerencia funcionalidades do roadmap, incluindo CRUD de features,
 * sistema de votação e comentários
 */

import { supabase } from '@/integrations/supabase/client';
import { logInfo, logError } from '@/utils/secureLogger';
import type {
  RoadmapFeature,
  RoadmapFeatureWithDetails,
  CreateFeatureRequest,
  UpdateFeatureRequest,
  RoadmapFilters,
  PaginatedResponse,
  RoadmapStats,
  FeatureCategory,
  FeatureStatus,
  FeaturePriority
} from '@/types/roadmap';

export class RoadmapService {
  private static instance: RoadmapService;

  private constructor() {}

  public static getInstance(): RoadmapService {
    if (!RoadmapService.instance) {
      RoadmapService.instance = new RoadmapService();
    }
    return RoadmapService.instance;
  }

  /**
   * Buscar funcionalidades do roadmap com filtros e paginação
   */
  public async getFeatures(filters?: RoadmapFilters): Promise<PaginatedResponse<RoadmapFeatureWithDetails>> {
    try {
      logInfo('Buscando funcionalidades do roadmap', {
        service: 'RoadmapService',
        method: 'getFeatures',
        filters
      });

      let query = supabase
        .from('roadmap_features')
        .select(`
          *,
          creator:profiles!roadmap_features_created_by_fkey(
            id,
            name,
            avatar_url
          ),
          assignee:profiles!roadmap_features_assigned_to_fkey(
            id,
            name,
            avatar_url
          )
        `);

      // Aplicar filtros
      if (filters?.category?.length) {
        query = query.in('category', filters.category);
      }

      if (filters?.status?.length) {
        query = query.in('status', filters.status);
      }

      if (filters?.priority?.length) {
        query = query.in('priority', filters.priority);
      }

      if (filters?.search) {
        query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      }

      if (filters?.created_by) {
        query = query.eq('created_by', filters.created_by);
      }

      if (filters?.assigned_to) {
        query = query.eq('assigned_to', filters.assigned_to);
      }

      if (filters?.tags?.length) {
        query = query.overlaps('tags', filters.tags);
      }

      // Ordenação
      const sortBy = filters?.sort_by || 'created_at';
      const sortOrder = filters?.sort_order || 'desc';
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });

      // Paginação
      const limit = filters?.limit || 20;
      const offset = filters?.offset || 0;
      
      // Contar total de registros
      const { count } = await supabase
        .from('roadmap_features')
        .select('*', { count: 'exact', head: true });

      // Buscar dados paginados
      query = query.range(offset, offset + limit - 1);
      const { data, error } = await query;

      if (error) {
        logError('Erro ao buscar funcionalidades do roadmap', {
          service: 'RoadmapService',
          method: 'getFeatures',
          error: error.message
        });
        throw new Error(`Erro ao buscar funcionalidades: ${error.message}`);
      }

      const total = count || 0;
      const hasMore = offset + limit < total;

      return {
        data: data as RoadmapFeatureWithDetails[],
        total,
        limit,
        offset,
        has_more: hasMore
      };

    } catch (error) {
      logError('Erro inesperado ao buscar funcionalidades', {
        service: 'RoadmapService',
        method: 'getFeatures',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    }
  }

  /**
   * Buscar uma funcionalidade específica com todos os detalhes
   */
  public async getFeatureById(id: string): Promise<RoadmapFeatureWithDetails | null> {
    try {
      logInfo('Buscando funcionalidade por ID', {
        service: 'RoadmapService',
        method: 'getFeatureById',
        featureId: id
      });

      const { data, error } = await supabase
        .from('roadmap_features')
        .select(`
          *,
          creator:profiles!roadmap_features_created_by_fkey(
            id,
            name,
            avatar_url
          ),
          assignee:profiles!roadmap_features_assigned_to_fkey(
            id,
            name,
            avatar_url
          ),
          comments:feature_comments(
            id,
            comment,
            created_at,
            updated_at,
            parent_comment_id,
            user:profiles(
              id,
              name,
              avatar_url
            )
          ),
          status_history:feature_status_history(
            id,
            old_status,
            new_status,
            change_reason,
            created_at,
            user:profiles!feature_status_history_changed_by_fkey(
              id,
              name
            )
          )
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Não encontrado
        }
        logError('Erro ao buscar funcionalidade por ID', {
          service: 'RoadmapService',
          method: 'getFeatureById',
          featureId: id,
          error: error.message
        });
        throw new Error(`Erro ao buscar funcionalidade: ${error.message}`);
      }

      return data as RoadmapFeatureWithDetails;

    } catch (error) {
      logError('Erro inesperado ao buscar funcionalidade por ID', {
        service: 'RoadmapService',
        method: 'getFeatureById',
        featureId: id,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    }
  }

  /**
   * Criar nova funcionalidade
   */
  public async createFeature(request: CreateFeatureRequest): Promise<RoadmapFeature> {
    try {
      logInfo('Criando nova funcionalidade', {
        service: 'RoadmapService',
        method: 'createFeature',
        title: request.title,
        category: request.category
      });

      // Obter usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('roadmap_features')
        .insert({
          title: request.title,
          description: request.description,
          category: request.category,
          priority: request.priority || 'medium',
          estimated_effort: request.estimated_effort,
          target_release: request.target_release,
          tags: request.tags,
          created_by: user.id
        })
        .select()
        .single();

      if (error) {
        logError('Erro ao criar funcionalidade', {
          service: 'RoadmapService',
          method: 'createFeature',
          error: error.message
        });
        throw new Error(`Erro ao criar funcionalidade: ${error.message}`);
      }

      logInfo('Funcionalidade criada com sucesso', {
        service: 'RoadmapService',
        method: 'createFeature',
        featureId: data.id
      });

      return data as RoadmapFeature;

    } catch (error) {
      logError('Erro inesperado ao criar funcionalidade', {
        service: 'RoadmapService',
        method: 'createFeature',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    }
  }

  /**
   * Atualizar funcionalidade existente
   */
  public async updateFeature(id: string, request: UpdateFeatureRequest): Promise<RoadmapFeature> {
    try {
      logInfo('Atualizando funcionalidade', {
        service: 'RoadmapService',
        method: 'updateFeature',
        featureId: id
      });

      const { data, error } = await supabase
        .from('roadmap_features')
        .update({
          ...request,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logError('Erro ao atualizar funcionalidade', {
          service: 'RoadmapService',
          method: 'updateFeature',
          featureId: id,
          error: error.message
        });
        throw new Error(`Erro ao atualizar funcionalidade: ${error.message}`);
      }

      logInfo('Funcionalidade atualizada com sucesso', {
        service: 'RoadmapService',
        method: 'updateFeature',
        featureId: id
      });

      return data as RoadmapFeature;

    } catch (error) {
      logError('Erro inesperado ao atualizar funcionalidade', {
        service: 'RoadmapService',
        method: 'updateFeature',
        featureId: id,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    }
  }

  /**
   * Deletar funcionalidade
   */
  public async deleteFeature(id: string): Promise<void> {
    try {
      logInfo('Deletando funcionalidade', {
        service: 'RoadmapService',
        method: 'deleteFeature',
        featureId: id
      });

      const { error } = await supabase
        .from('roadmap_features')
        .delete()
        .eq('id', id);

      if (error) {
        logError('Erro ao deletar funcionalidade', {
          service: 'RoadmapService',
          method: 'deleteFeature',
          featureId: id,
          error: error.message
        });
        throw new Error(`Erro ao deletar funcionalidade: ${error.message}`);
      }

      logInfo('Funcionalidade deletada com sucesso', {
        service: 'RoadmapService',
        method: 'deleteFeature',
        featureId: id
      });

    } catch (error) {
      logError('Erro inesperado ao deletar funcionalidade', {
        service: 'RoadmapService',
        method: 'deleteFeature',
        featureId: id,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    }
  }

  /**
   * Obter estatísticas do roadmap
   */
  public async getStats(): Promise<RoadmapStats> {
    try {
      logInfo('Buscando estatísticas do roadmap', {
        service: 'RoadmapService',
        method: 'getStats'
      });

      // Buscar contadores por status
      const { data: statusData, error: statusError } = await supabase
        .from('roadmap_features')
        .select('status')
        .order('status');

      if (statusError) {
        throw new Error(`Erro ao buscar dados de status: ${statusError.message}`);
      }

      // Buscar contadores por categoria
      const { data: categoryData, error: categoryError } = await supabase
        .from('roadmap_features')
        .select('category')
        .order('category');

      if (categoryError) {
        throw new Error(`Erro ao buscar dados de categoria: ${categoryError.message}`);
      }

      // Buscar contadores por prioridade
      const { data: priorityData, error: priorityError } = await supabase
        .from('roadmap_features')
        .select('priority')
        .order('priority');

      if (priorityError) {
        throw new Error(`Erro ao buscar dados de prioridade: ${priorityError.message}`);
      }

      // Buscar total de votos
      const { data: votesData, error: votesError } = await supabase
        .from('feature_votes')
        .select('id', { count: 'exact', head: true });

      if (votesError) {
        throw new Error(`Erro ao buscar dados de votos: ${votesError.message}`);
      }

      // Buscar total de comentários
      const { data: commentsData, error: commentsError } = await supabase
        .from('feature_comments')
        .select('id', { count: 'exact', head: true });

      if (commentsError) {
        throw new Error(`Erro ao buscar dados de comentários: ${commentsError.message}`);
      }

      // Buscar contribuidores ativos (usuários que votaram ou comentaram)
      const { data: contributorsData, error: contributorsError } = await supabase
        .rpc('get_active_contributors_count');

      if (contributorsError) {
        // Se a função RPC não existir, usar 0 como fallback
        logInfo('Função get_active_contributors_count não encontrada, usando fallback', {
          service: 'RoadmapService',
          method: 'getStats'
        });
      }

      // Processar dados
      const byStatus = statusData.reduce((acc, item) => {
        acc[item.status as FeatureStatus] = (acc[item.status as FeatureStatus] || 0) + 1;
        return acc;
      }, {} as Record<FeatureStatus, number>);

      const byCategory = categoryData.reduce((acc, item) => {
        acc[item.category as FeatureCategory] = (acc[item.category as FeatureCategory] || 0) + 1;
        return acc;
      }, {} as Record<FeatureCategory, number>);

      const byPriority = priorityData.reduce((acc, item) => {
        acc[item.priority as FeaturePriority] = (acc[item.priority as FeaturePriority] || 0) + 1;
        return acc;
      }, {} as Record<FeaturePriority, number>);

      const stats: RoadmapStats = {
        total_features: statusData.length,
        by_status: byStatus,
        by_category: byCategory,
        by_priority: byPriority,
        total_votes: votesData?.length || 0,
        total_comments: commentsData?.length || 0,
        active_contributors: contributorsData || 0
      };

      logInfo('Estatísticas do roadmap obtidas com sucesso', {
        service: 'RoadmapService',
        method: 'getStats',
        stats
      });

      return stats;

    } catch (error) {
      logError('Erro inesperado ao buscar estatísticas', {
        service: 'RoadmapService',
        method: 'getStats',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    }
  }

  /**
   * Buscar funcionalidades por categoria
   */
  public async getFeaturesByCategory(category: FeatureCategory): Promise<RoadmapFeature[]> {
    try {
      const { data, error } = await supabase
        .from('roadmap_features')
        .select('*')
        .eq('category', category)
        .order('votes_count', { ascending: false });

      if (error) {
        throw new Error(`Erro ao buscar funcionalidades por categoria: ${error.message}`);
      }

      return data as RoadmapFeature[];

    } catch (error) {
      logError('Erro ao buscar funcionalidades por categoria', {
        service: 'RoadmapService',
        method: 'getFeaturesByCategory',
        category,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    }
  }

  /**
   * Buscar funcionalidades por status
   */
  public async getFeaturesByStatus(status: FeatureStatus): Promise<RoadmapFeature[]> {
    try {
      const { data, error } = await supabase
        .from('roadmap_features')
        .select('*')
        .eq('status', status)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Erro ao buscar funcionalidades por status: ${error.message}`);
      }

      return data as RoadmapFeature[];

    } catch (error) {
      logError('Erro ao buscar funcionalidades por status', {
        service: 'RoadmapService',
        method: 'getFeaturesByStatus',
        status,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    }
  }
}

// Exportar instância singleton
export const roadmapService = RoadmapService.getInstance();