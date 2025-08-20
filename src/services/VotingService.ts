/**
 * Serviço de Votação
 * 
 * Gerencia o sistema de votação para funcionalidades do roadmap,
 * incluindo votos positivos/negativos e comentários
 */

import { supabase } from '@/integrations/supabase/client';
import { logInfo, logError } from '@/utils/secureLogger';
import type {
  FeatureVote,
  FeatureComment,
  VoteType,
  CreateVoteRequest,
  CreateCommentRequest,
  UpdateCommentRequest,
  VotingStats
} from '@/types/roadmap';

export class VotingService {
  private static instance: VotingService;

  private constructor() {}

  public static getInstance(): VotingService {
    if (!VotingService.instance) {
      VotingService.instance = new VotingService();
    }
    return VotingService.instance;
  }

  /**
   * Votar em uma funcionalidade
   */
  public async voteFeature(request: CreateVoteRequest): Promise<FeatureVote> {
    try {
      logInfo('Registrando voto em funcionalidade', {
        service: 'VotingService',
        method: 'voteFeature',
        featureId: request.feature_id,
        voteType: request.vote_type
      });

      // Obter usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Verificar se o usuário já votou nesta funcionalidade
      const { data: existingVote } = await supabase
        .from('feature_votes')
        .select('*')
        .eq('feature_id', request.feature_id)
        .eq('user_id', user.id)
        .single();

      if (existingVote) {
        // Se já votou, atualizar o voto
        return await this.updateVote(existingVote.id, request.vote_type);
      }

      // Criar novo voto
      const { data, error } = await supabase
        .from('feature_votes')
        .insert({
          feature_id: request.feature_id,
          user_id: user.id,
          vote_type: request.vote_type
        })
        .select()
        .single();

      if (error) {
        logError('Erro ao registrar voto', {
          service: 'VotingService',
          method: 'voteFeature',
          featureId: request.feature_id,
          error: error.message
        });
        throw new Error(`Erro ao registrar voto: ${error.message}`);
      }

      logInfo('Voto registrado com sucesso', {
        service: 'VotingService',
        method: 'voteFeature',
        voteId: data.id,
        featureId: request.feature_id
      });

      return data as FeatureVote;

    } catch (error) {
      logError('Erro inesperado ao votar em funcionalidade', {
        service: 'VotingService',
        method: 'voteFeature',
        featureId: request.feature_id,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    }
  }

  /**
   * Atualizar voto existente
   */
  public async updateVote(voteId: string, voteType: VoteType): Promise<FeatureVote> {
    try {
      logInfo('Atualizando voto existente', {
        service: 'VotingService',
        method: 'updateVote',
        voteId,
        voteType
      });

      const { data, error } = await supabase
        .from('feature_votes')
        .update({
          vote_type: voteType,
          updated_at: new Date().toISOString()
        })
        .eq('id', voteId)
        .select()
        .single();

      if (error) {
        logError('Erro ao atualizar voto', {
          service: 'VotingService',
          method: 'updateVote',
          voteId,
          error: error.message
        });
        throw new Error(`Erro ao atualizar voto: ${error.message}`);
      }

      logInfo('Voto atualizado com sucesso', {
        service: 'VotingService',
        method: 'updateVote',
        voteId
      });

      return data as FeatureVote;

    } catch (error) {
      logError('Erro inesperado ao atualizar voto', {
        service: 'VotingService',
        method: 'updateVote',
        voteId,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    }
  }

  /**
   * Remover voto
   */
  public async removeVote(featureId: string): Promise<void> {
    try {
      logInfo('Removendo voto', {
        service: 'VotingService',
        method: 'removeVote',
        featureId
      });

      // Obter usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { error } = await supabase
        .from('feature_votes')
        .delete()
        .eq('feature_id', featureId)
        .eq('user_id', user.id);

      if (error) {
        logError('Erro ao remover voto', {
          service: 'VotingService',
          method: 'removeVote',
          featureId,
          error: error.message
        });
        throw new Error(`Erro ao remover voto: ${error.message}`);
      }

      logInfo('Voto removido com sucesso', {
        service: 'VotingService',
        method: 'removeVote',
        featureId
      });

    } catch (error) {
      logError('Erro inesperado ao remover voto', {
        service: 'VotingService',
        method: 'removeVote',
        featureId,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    }
  }

  /**
   * Obter voto do usuário para uma funcionalidade
   */
  public async getUserVote(featureId: string): Promise<FeatureVote | null> {
    try {
      // Obter usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return null; // Usuário não autenticado
      }

      const { data, error } = await supabase
        .from('feature_votes')
        .select('*')
        .eq('feature_id', featureId)
        .eq('user_id', user.id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null; // Não encontrado
        }
        logError('Erro ao buscar voto do usuário', {
          service: 'VotingService',
          method: 'getUserVote',
          featureId,
          error: error.message
        });
        throw new Error(`Erro ao buscar voto: ${error.message}`);
      }

      return data as FeatureVote;

    } catch (error) {
      logError('Erro inesperado ao buscar voto do usuário', {
        service: 'VotingService',
        method: 'getUserVote',
        featureId,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    }
  }

  /**
   * Obter estatísticas de votação para uma funcionalidade
   */
  public async getVotingStats(featureId: string): Promise<VotingStats> {
    try {
      logInfo('Buscando estatísticas de votação', {
        service: 'VotingService',
        method: 'getVotingStats',
        featureId
      });

      const { data, error } = await supabase
        .from('feature_votes')
        .select('vote_type')
        .eq('feature_id', featureId);

      if (error) {
        logError('Erro ao buscar estatísticas de votação', {
          service: 'VotingService',
          method: 'getVotingStats',
          featureId,
          error: error.message
        });
        throw new Error(`Erro ao buscar estatísticas: ${error.message}`);
      }

      const upvotes = data.filter(vote => vote.vote_type === 'upvote').length;
      const downvotes = data.filter(vote => vote.vote_type === 'downvote').length;
      const total = data.length;
      const score = upvotes - downvotes;
      const percentage = total > 0 ? Math.round((upvotes / total) * 100) : 0;

      const stats: VotingStats = {
        upvotes,
        downvotes,
        total_votes: total,
        score,
        upvote_percentage: percentage
      };

      return stats;

    } catch (error) {
      logError('Erro inesperado ao buscar estatísticas de votação', {
        service: 'VotingService',
        method: 'getVotingStats',
        featureId,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    }
  }

  /**
   * Adicionar comentário a uma funcionalidade
   */
  public async addComment(request: CreateCommentRequest): Promise<FeatureComment> {
    try {
      logInfo('Adicionando comentário', {
        service: 'VotingService',
        method: 'addComment',
        featureId: request.feature_id
      });

      // Obter usuário atual
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const { data, error } = await supabase
        .from('feature_comments')
        .insert({
          feature_id: request.feature_id,
          user_id: user.id,
          comment: request.comment,
          parent_comment_id: request.parent_comment_id
        })
        .select(`
          *,
          user:profiles(
            id,
            name,
            avatar_url
          )
        `)
        .single();

      if (error) {
        logError('Erro ao adicionar comentário', {
          service: 'VotingService',
          method: 'addComment',
          featureId: request.feature_id,
          error: error.message
        });
        throw new Error(`Erro ao adicionar comentário: ${error.message}`);
      }

      logInfo('Comentário adicionado com sucesso', {
        service: 'VotingService',
        method: 'addComment',
        commentId: data.id,
        featureId: request.feature_id
      });

      return data as FeatureComment;

    } catch (error) {
      logError('Erro inesperado ao adicionar comentário', {
        service: 'VotingService',
        method: 'addComment',
        featureId: request.feature_id,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    }
  }

  /**
   * Atualizar comentário
   */
  public async updateComment(commentId: string, request: UpdateCommentRequest): Promise<FeatureComment> {
    try {
      logInfo('Atualizando comentário', {
        service: 'VotingService',
        method: 'updateComment',
        commentId
      });

      const { data, error } = await supabase
        .from('feature_comments')
        .update({
          comment: request.comment,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .select(`
          *,
          user:profiles(
            id,
            name,
            avatar_url
          )
        `)
        .single();

      if (error) {
        logError('Erro ao atualizar comentário', {
          service: 'VotingService',
          method: 'updateComment',
          commentId,
          error: error.message
        });
        throw new Error(`Erro ao atualizar comentário: ${error.message}`);
      }

      logInfo('Comentário atualizado com sucesso', {
        service: 'VotingService',
        method: 'updateComment',
        commentId
      });

      return data as FeatureComment;

    } catch (error) {
      logError('Erro inesperado ao atualizar comentário', {
        service: 'VotingService',
        method: 'updateComment',
        commentId,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    }
  }

  /**
   * Deletar comentário
   */
  public async deleteComment(commentId: string): Promise<void> {
    try {
      logInfo('Deletando comentário', {
        service: 'VotingService',
        method: 'deleteComment',
        commentId
      });

      const { error } = await supabase
        .from('feature_comments')
        .delete()
        .eq('id', commentId);

      if (error) {
        logError('Erro ao deletar comentário', {
          service: 'VotingService',
          method: 'deleteComment',
          commentId,
          error: error.message
        });
        throw new Error(`Erro ao deletar comentário: ${error.message}`);
      }

      logInfo('Comentário deletado com sucesso', {
        service: 'VotingService',
        method: 'deleteComment',
        commentId
      });

    } catch (error) {
      logError('Erro inesperado ao deletar comentário', {
        service: 'VotingService',
        method: 'deleteComment',
        commentId,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    }
  }

  /**
   * Obter comentários de uma funcionalidade
   */
  public async getComments(featureId: string): Promise<FeatureComment[]> {
    try {
      logInfo('Buscando comentários', {
        service: 'VotingService',
        method: 'getComments',
        featureId
      });

      const { data, error } = await supabase
        .from('feature_comments')
        .select(`
          *,
          user:profiles(
            id,
            name,
            avatar_url
          )
        `)
        .eq('feature_id', featureId)
        .order('created_at', { ascending: true });

      if (error) {
        logError('Erro ao buscar comentários', {
          service: 'VotingService',
          method: 'getComments',
          featureId,
          error: error.message
        });
        throw new Error(`Erro ao buscar comentários: ${error.message}`);
      }

      return data as FeatureComment[];

    } catch (error) {
      logError('Erro inesperado ao buscar comentários', {
        service: 'VotingService',
        method: 'getComments',
        featureId,
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    }
  }

  /**
   * Obter funcionalidades mais votadas
   */
  public async getTopVotedFeatures(limit: number = 10): Promise<RoadmapFeature[]> {
    try {
      logInfo('Buscando funcionalidades mais votadas', {
        service: 'VotingService',
        method: 'getTopVotedFeatures',
        limit
      });

      const { data, error } = await supabase
        .from('roadmap_features')
        .select(`
          *,
          creator:profiles!roadmap_features_created_by_fkey(
            id,
            name,
            avatar_url
          )
        `)
        .order('votes_count', { ascending: false })
        .limit(limit);

      if (error) {
        logError('Erro ao buscar funcionalidades mais votadas', {
          service: 'VotingService',
          method: 'getTopVotedFeatures',
          error: error.message
        });
        throw new Error(`Erro ao buscar funcionalidades: ${error.message}`);
      }

      return data;

    } catch (error) {
      logError('Erro inesperado ao buscar funcionalidades mais votadas', {
        service: 'VotingService',
        method: 'getTopVotedFeatures',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      throw error;
    }
  }
}

// Exportar instância singleton
export const votingService = VotingService.getInstance();