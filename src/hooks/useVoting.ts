/**
 * Hook para gerenciar sistema de votação
 * 
 * Fornece funcionalidades para votar, comentar e gerenciar
 * interações do usuário com funcionalidades do roadmap
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { votingService } from '@/services/VotingService';
import { logError, logInfo } from '@/utils/secureLogger';
import { toast } from './use-toast';
import type {
  FeatureVote,
  FeatureComment,
  VoteType,
  CreateVoteRequest,
  CreateCommentRequest,
  UpdateCommentRequest,
  VotingStats
} from '@/types/roadmap';

export interface UseVotingOptions {
  featureId?: string;
  autoFetch?: boolean;
  enableOptimisticUpdates?: boolean;
}

export interface UseVotingReturn {
  // Voting data
  userVote: FeatureVote | null;
  votingStats: VotingStats | null;
  
  // Comments data
  comments: FeatureComment[];
  
  // State
  isVoting: boolean;
  isLoadingVote: boolean;
  isLoadingStats: boolean;
  isLoadingComments: boolean;
  isAddingComment: boolean;
  isUpdatingComment: boolean;
  isDeletingComment: boolean;
  error: string | null;
  
  // Voting actions
  vote: (voteType: VoteType) => Promise<boolean>;
  removeVote: () => Promise<boolean>;
  toggleVote: (voteType: VoteType) => Promise<boolean>;
  
  // Comment actions
  addComment: (comment: string, parentId?: string) => Promise<FeatureComment | null>;
  updateComment: (commentId: string, comment: string) => Promise<FeatureComment | null>;
  deleteComment: (commentId: string) => Promise<boolean>;
  
  // Data fetching
  fetchUserVote: (featureId?: string) => Promise<void>;
  fetchVotingStats: (featureId?: string) => Promise<void>;
  fetchComments: (featureId?: string) => Promise<void>;
  
  // Utility actions
  refresh: (featureId?: string) => Promise<void>;
  clearError: () => void;
  resetData: () => void;
  
  // Computed values
  hasVoted: boolean;
  isUpvoted: boolean;
  isDownvoted: boolean;
  canVote: boolean;
}

const DEFAULT_OPTIONS: UseVotingOptions = {
  autoFetch: true,
  enableOptimisticUpdates: true
};

export function useVoting(options: UseVotingOptions = {}): UseVotingReturn {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  // State
  const [userVote, setUserVote] = useState<FeatureVote | null>(null);
  const [votingStats, setVotingStats] = useState<VotingStats | null>(null);
  const [comments, setComments] = useState<FeatureComment[]>([]);
  const [isVoting, setIsVoting] = useState(false);
  const [isLoadingVote, setIsLoadingVote] = useState(false);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [isUpdatingComment, setIsUpdatingComment] = useState(false);
  const [isDeletingComment, setIsDeletingComment] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Computed values
  const hasVoted = useMemo(() => userVote !== null, [userVote]);
  const isUpvoted = useMemo(() => userVote?.vote_type === 'upvote', [userVote]);
  const isDownvoted = useMemo(() => userVote?.vote_type === 'downvote', [userVote]);
  const canVote = useMemo(() => opts.featureId !== undefined, [opts.featureId]);
  
  // Clear error
  const clearError = useCallback(() => {
    setError(null);
  }, []);
  
  // Fetch user vote
  const fetchUserVote = useCallback(async (featureId?: string) => {
    const targetFeatureId = featureId || opts.featureId;
    if (!targetFeatureId) return;
    
    try {
      setIsLoadingVote(true);
      setError(null);
      
      logInfo('Buscando voto do usuário', {
        hook: 'useVoting',
        method: 'fetchUserVote',
        featureId: targetFeatureId
      });
      
      const vote = await votingService.getUserVote(targetFeatureId);
      setUserVote(vote);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao buscar voto';
      setError(errorMessage);
      logError('Erro ao buscar voto do usuário', {
        hook: 'useVoting',
        method: 'fetchUserVote',
        featureId: targetFeatureId,
        error: errorMessage
      });
    } finally {
      setIsLoadingVote(false);
    }
  }, [opts.featureId]);
  
  // Fetch voting stats
  const fetchVotingStats = useCallback(async (featureId?: string) => {
    const targetFeatureId = featureId || opts.featureId;
    if (!targetFeatureId) return;
    
    try {
      setIsLoadingStats(true);
      setError(null);
      
      logInfo('Buscando estatísticas de votação', {
        hook: 'useVoting',
        method: 'fetchVotingStats',
        featureId: targetFeatureId
      });
      
      const stats = await votingService.getVotingStats(targetFeatureId);
      setVotingStats(stats);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao buscar estatísticas';
      setError(errorMessage);
      logError('Erro ao buscar estatísticas de votação', {
        hook: 'useVoting',
        method: 'fetchVotingStats',
        featureId: targetFeatureId,
        error: errorMessage
      });
    } finally {
      setIsLoadingStats(false);
    }
  }, [opts.featureId]);
  
  // Fetch comments
  const fetchComments = useCallback(async (featureId?: string) => {
    const targetFeatureId = featureId || opts.featureId;
    if (!targetFeatureId) return;
    
    try {
      setIsLoadingComments(true);
      setError(null);
      
      logInfo('Buscando comentários', {
        hook: 'useVoting',
        method: 'fetchComments',
        featureId: targetFeatureId
      });
      
      const commentsData = await votingService.getComments(targetFeatureId);
      setComments(commentsData);
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao buscar comentários';
      setError(errorMessage);
      logError('Erro ao buscar comentários', {
        hook: 'useVoting',
        method: 'fetchComments',
        featureId: targetFeatureId,
        error: errorMessage
      });
    } finally {
      setIsLoadingComments(false);
    }
  }, [opts.featureId]);
  
  // Vote function
  const vote = useCallback(async (voteType: VoteType): Promise<boolean> => {
    if (!opts.featureId) {
      setError('ID da funcionalidade não fornecido');
      return false;
    }
    
    try {
      setIsVoting(true);
      setError(null);
      
      // Optimistic update
      if (opts.enableOptimisticUpdates && votingStats) {
        const oldVoteType = userVote?.vote_type;
        const newStats = { ...votingStats };
        
        // Remove old vote from stats
        if (oldVoteType === 'upvote') {
          newStats.upvotes--;
          newStats.total_votes--;
        } else if (oldVoteType === 'downvote') {
          newStats.downvotes--;
          newStats.total_votes--;
        }
        
        // Add new vote to stats
        if (voteType === 'upvote') {
          newStats.upvotes++;
          newStats.total_votes++;
        } else if (voteType === 'downvote') {
          newStats.downvotes++;
          newStats.total_votes++;
        }
        
        newStats.score = newStats.upvotes - newStats.downvotes;
        newStats.upvote_percentage = newStats.total_votes > 0 
          ? Math.round((newStats.upvotes / newStats.total_votes) * 100) 
          : 0;
        
        setVotingStats(newStats);
        setUserVote(prev => prev ? { ...prev, vote_type: voteType } : null);
      }
      
      logInfo('Registrando voto', {
        hook: 'useVoting',
        method: 'vote',
        featureId: opts.featureId,
        voteType
      });
      
      const newVote = await votingService.voteFeature({
        feature_id: opts.featureId,
        vote_type: voteType
      });
      
      setUserVote(newVote);
      
      // Refresh stats to get accurate data
      await fetchVotingStats();
      
      toast({
        title: 'Voto registrado',
        description: `Seu ${voteType === 'upvote' ? 'voto positivo' : 'voto negativo'} foi registrado com sucesso.`,
        variant: 'default'
      });
      
      return true;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao votar';
      setError(errorMessage);
      
      // Revert optimistic update on error
      if (opts.enableOptimisticUpdates) {
        await fetchVotingStats();
        await fetchUserVote();
      }
      
      logError('Erro ao votar', {
        hook: 'useVoting',
        method: 'vote',
        featureId: opts.featureId,
        voteType,
        error: errorMessage
      });
      
      toast({
        title: 'Erro ao votar',
        description: errorMessage,
        variant: 'destructive'
      });
      
      return false;
    } finally {
      setIsVoting(false);
    }
  }, [opts.featureId, opts.enableOptimisticUpdates, userVote, votingStats, fetchVotingStats, fetchUserVote]);
  
  // Remove vote
  const removeVote = useCallback(async (): Promise<boolean> => {
    if (!opts.featureId) {
      setError('ID da funcionalidade não fornecido');
      return false;
    }
    
    try {
      setIsVoting(true);
      setError(null);
      
      logInfo('Removendo voto', {
        hook: 'useVoting',
        method: 'removeVote',
        featureId: opts.featureId
      });
      
      await votingService.removeVote(opts.featureId);
      setUserVote(null);
      
      // Refresh stats
      await fetchVotingStats();
      
      toast({
        title: 'Voto removido',
        description: 'Seu voto foi removido com sucesso.',
        variant: 'default'
      });
      
      return true;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao remover voto';
      setError(errorMessage);
      logError('Erro ao remover voto', {
        hook: 'useVoting',
        method: 'removeVote',
        featureId: opts.featureId,
        error: errorMessage
      });
      
      toast({
        title: 'Erro ao remover voto',
        description: errorMessage,
        variant: 'destructive'
      });
      
      return false;
    } finally {
      setIsVoting(false);
    }
  }, [opts.featureId, fetchVotingStats]);
  
  // Toggle vote
  const toggleVote = useCallback(async (voteType: VoteType): Promise<boolean> => {
    if (userVote?.vote_type === voteType) {
      return await removeVote();
    } else {
      return await vote(voteType);
    }
  }, [userVote, vote, removeVote]);
  
  // Add comment
  const addComment = useCallback(async (comment: string, parentId?: string): Promise<FeatureComment | null> => {
    if (!opts.featureId) {
      setError('ID da funcionalidade não fornecido');
      return null;
    }
    
    try {
      setIsAddingComment(true);
      setError(null);
      
      logInfo('Adicionando comentário', {
        hook: 'useVoting',
        method: 'addComment',
        featureId: opts.featureId,
        hasParent: !!parentId
      });
      
      const newComment = await votingService.addComment({
        feature_id: opts.featureId,
        comment,
        parent_comment_id: parentId
      });
      
      // Add to local state
      setComments(prev => [...prev, newComment]);
      
      toast({
        title: 'Comentário adicionado',
        description: 'Seu comentário foi adicionado com sucesso.',
        variant: 'default'
      });
      
      return newComment;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao adicionar comentário';
      setError(errorMessage);
      logError('Erro ao adicionar comentário', {
        hook: 'useVoting',
        method: 'addComment',
        featureId: opts.featureId,
        error: errorMessage
      });
      
      toast({
        title: 'Erro ao adicionar comentário',
        description: errorMessage,
        variant: 'destructive'
      });
      
      return null;
    } finally {
      setIsAddingComment(false);
    }
  }, [opts.featureId]);
  
  // Update comment
  const updateComment = useCallback(async (commentId: string, comment: string): Promise<FeatureComment | null> => {
    try {
      setIsUpdatingComment(true);
      setError(null);
      
      logInfo('Atualizando comentário', {
        hook: 'useVoting',
        method: 'updateComment',
        commentId
      });
      
      const updatedComment = await votingService.updateComment(commentId, { comment });
      
      // Update local state
      setComments(prev => prev.map(c => c.id === commentId ? updatedComment : c));
      
      toast({
        title: 'Comentário atualizado',
        description: 'Seu comentário foi atualizado com sucesso.',
        variant: 'default'
      });
      
      return updatedComment;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao atualizar comentário';
      setError(errorMessage);
      logError('Erro ao atualizar comentário', {
        hook: 'useVoting',
        method: 'updateComment',
        commentId,
        error: errorMessage
      });
      
      toast({
        title: 'Erro ao atualizar comentário',
        description: errorMessage,
        variant: 'destructive'
      });
      
      return null;
    } finally {
      setIsUpdatingComment(false);
    }
  }, []);
  
  // Delete comment
  const deleteComment = useCallback(async (commentId: string): Promise<boolean> => {
    try {
      setIsDeletingComment(true);
      setError(null);
      
      logInfo('Deletando comentário', {
        hook: 'useVoting',
        method: 'deleteComment',
        commentId
      });
      
      await votingService.deleteComment(commentId);
      
      // Remove from local state
      setComments(prev => prev.filter(c => c.id !== commentId));
      
      toast({
        title: 'Comentário removido',
        description: 'Seu comentário foi removido com sucesso.',
        variant: 'default'
      });
      
      return true;
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro desconhecido ao deletar comentário';
      setError(errorMessage);
      logError('Erro ao deletar comentário', {
        hook: 'useVoting',
        method: 'deleteComment',
        commentId,
        error: errorMessage
      });
      
      toast({
        title: 'Erro ao remover comentário',
        description: errorMessage,
        variant: 'destructive'
      });
      
      return false;
    } finally {
      setIsDeletingComment(false);
    }
  }, []);
  
  // Refresh all data
  const refresh = useCallback(async (featureId?: string) => {
    const targetFeatureId = featureId || opts.featureId;
    if (!targetFeatureId) return;
    
    await Promise.all([
      fetchUserVote(targetFeatureId),
      fetchVotingStats(targetFeatureId),
      fetchComments(targetFeatureId)
    ]);
  }, [opts.featureId, fetchUserVote, fetchVotingStats, fetchComments]);
  
  // Reset data
  const resetData = useCallback(() => {
    setUserVote(null);
    setVotingStats(null);
    setComments([]);
    setError(null);
  }, []);
  
  // Auto fetch on mount and when featureId changes
  useEffect(() => {
    if (opts.autoFetch && opts.featureId) {
      refresh(opts.featureId);
    }
  }, [opts.autoFetch, opts.featureId, refresh]);
  
  return {
    // Voting data
    userVote,
    votingStats,
    
    // Comments data
    comments,
    
    // State
    isVoting,
    isLoadingVote,
    isLoadingStats,
    isLoadingComments,
    isAddingComment,
    isUpdatingComment,
    isDeletingComment,
    error,
    
    // Voting actions
    vote,
    removeVote,
    toggleVote,
    
    // Comment actions
    addComment,
    updateComment,
    deleteComment,
    
    // Data fetching
    fetchUserVote,
    fetchVotingStats,
    fetchComments,
    
    // Utility actions
    refresh,
    clearError,
    resetData,
    
    // Computed values
    hasVoted,
    isUpvoted,
    isDownvoted,
    canVote
  };
}