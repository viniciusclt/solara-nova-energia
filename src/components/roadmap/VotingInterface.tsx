/**
 * Interface de Votação
 * 
 * Componente para votação e comentários em funcionalidades do roadmap,
 * incluindo sistema de upvote/downvote e thread de comentários
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare, 
  Send, 
  Edit3, 
  Trash2, 
  MoreHorizontal,
  Heart,
  Reply,
  Flag,
  User,
  Calendar,
  Loader2
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useVoting } from '@/hooks/useVoting';
import { useNotifications } from '@/hooks/useNotifications';
import type {
  RoadmapFeature,
  FeatureVote,
  FeatureComment,
  VoteType
} from '@/types/roadmap';

export interface VotingInterfaceProps {
  feature: RoadmapFeature;
  currentUserId?: string;
  onVoteChange?: (newVoteCount: number) => void;
  onCommentChange?: (newCommentCount: number) => void;
  className?: string;
}

interface CommentFormData {
  content: string;
  parent_id?: string;
}

const INITIAL_COMMENT_FORM: CommentFormData = {
  content: ''
};

export function VotingInterface({ 
  feature, 
  currentUserId, 
  onVoteChange, 
  onCommentChange,
  className 
}: VotingInterfaceProps) {
  const [commentForm, setCommentForm] = useState<CommentFormData>(INITIAL_COMMENT_FORM);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  
  const {
    userVote,
    comments,
    voteStats,
    isLoading,
    vote,
    removeVote,
    addComment,
    updateComment,
    deleteComment,
    refreshComments,
    refreshVoteStats
  } = useVoting(feature.id);
  
  const { addNotification } = useNotifications();
  
  // Atualizar contadores quando dados mudarem
  useEffect(() => {
    if (voteStats) {
      const totalVotes = voteStats.upvotes - voteStats.downvotes;
      onVoteChange?.(totalVotes);
    }
  }, [voteStats, onVoteChange]);
  
  useEffect(() => {
    if (comments) {
      onCommentChange?.(comments.length);
    }
  }, [comments, onCommentChange]);
  
  // Votar
  const handleVote = async (voteType: VoteType) => {
    if (!currentUserId) {
      addNotification({
        type: 'warning',
        title: 'Login necessário',
        message: 'Você precisa estar logado para votar'
      });
      return;
    }
    
    try {
      if (userVote?.vote_type === voteType) {
        // Se já votou no mesmo tipo, remove o voto
        await removeVote();
      } else {
        // Vota ou muda o voto
        await vote(voteType);
      }
      
      await refreshVoteStats();
      
    } catch (error) {
      console.error('Erro ao votar:', error);
      addNotification({
        type: 'error',
        title: 'Erro ao votar',
        message: 'Não foi possível registrar seu voto'
      });
    }
  };
  
  // Adicionar comentário
  const handleAddComment = async (parentId?: string) => {
    if (!currentUserId) {
      addNotification({
        type: 'warning',
        title: 'Login necessário',
        message: 'Você precisa estar logado para comentar'
      });
      return;
    }
    
    const content = parentId ? commentForm.content : commentForm.content;
    if (!content.trim()) {
      addNotification({
        type: 'warning',
        title: 'Comentário vazio',
        message: 'Digite um comentário antes de enviar'
      });
      return;
    }
    
    setIsSubmittingComment(true);
    
    try {
      await addComment({
        content: content.trim(),
        parent_id: parentId
      });
      
      // Limpar formulário
      setCommentForm(INITIAL_COMMENT_FORM);
      setReplyingTo(null);
      
      await refreshComments();
      
      addNotification({
        type: 'success',
        title: 'Comentário adicionado',
        message: 'Seu comentário foi publicado com sucesso'
      });
      
    } catch (error) {
      console.error('Erro ao adicionar comentário:', error);
      addNotification({
        type: 'error',
        title: 'Erro ao comentar',
        message: 'Não foi possível publicar seu comentário'
      });
    } finally {
      setIsSubmittingComment(false);
    }
  };
  
  // Editar comentário
  const handleEditComment = async (commentId: string) => {
    if (!editContent.trim()) {
      addNotification({
        type: 'warning',
        title: 'Comentário vazio',
        message: 'Digite um comentário antes de salvar'
      });
      return;
    }
    
    try {
      await updateComment(commentId, {
        content: editContent.trim()
      });
      
      setEditingComment(null);
      setEditContent('');
      
      await refreshComments();
      
      addNotification({
        type: 'success',
        title: 'Comentário atualizado',
        message: 'Seu comentário foi atualizado com sucesso'
      });
      
    } catch (error) {
      console.error('Erro ao editar comentário:', error);
      addNotification({
        type: 'error',
        title: 'Erro ao editar',
        message: 'Não foi possível atualizar seu comentário'
      });
    }
  };
  
  // Deletar comentário
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('Tem certeza que deseja deletar este comentário?')) {
      return;
    }
    
    try {
      await deleteComment(commentId);
      await refreshComments();
      
      addNotification({
        type: 'success',
        title: 'Comentário deletado',
        message: 'Comentário removido com sucesso'
      });
      
    } catch (error) {
      console.error('Erro ao deletar comentário:', error);
      addNotification({
        type: 'error',
        title: 'Erro ao deletar',
        message: 'Não foi possível deletar o comentário'
      });
    }
  };
  
  // Iniciar edição
  const startEdit = (comment: FeatureComment) => {
    setEditingComment(comment.id);
    setEditContent(comment.content);
  };
  
  // Cancelar edição
  const cancelEdit = () => {
    setEditingComment(null);
    setEditContent('');
  };
  
  // Iniciar resposta
  const startReply = (commentId: string) => {
    setReplyingTo(commentId);
    setCommentForm({ content: '', parent_id: commentId });
  };
  
  // Cancelar resposta
  const cancelReply = () => {
    setReplyingTo(null);
    setCommentForm(INITIAL_COMMENT_FORM);
  };
  
  // Renderizar comentário
  const renderComment = (comment: FeatureComment, isReply = false) => {
    const isOwner = comment.user_id === currentUserId;
    const isEditing = editingComment === comment.id;
    const isReplying = replyingTo === comment.id;
    
    return (
      <div key={comment.id} className={`${isReply ? 'ml-8 mt-3' : 'mt-4'}`}>
        <div className="flex space-x-3">
          <Avatar className="h-8 w-8">
            <AvatarImage src={comment.user_avatar} />
            <AvatarFallback>
              <User className="h-4 w-4" />
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium">
                {comment.user_name || 'Usuário'}
              </span>
              <span className="text-xs text-muted-foreground flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>{new Date(comment.created_at).toLocaleDateString()}</span>
              </span>
              {comment.updated_at !== comment.created_at && (
                <Badge variant="outline" className="text-xs">
                  Editado
                </Badge>
              )}
            </div>
            
            {isEditing ? (
              <div className="mt-2 space-y-2">
                <Textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="min-h-[80px]"
                  placeholder="Edite seu comentário..."
                />
                <div className="flex items-center space-x-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleEditComment(comment.id)}
                    disabled={!editContent.trim()}
                  >
                    Salvar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={cancelEdit}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className="mt-1 text-sm text-foreground whitespace-pre-wrap">
                  {comment.content}
                </p>
                
                <div className="mt-2 flex items-center space-x-4">
                  {!isReply && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => startReply(comment.id)}
                      className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <Reply className="h-3 w-3 mr-1" />
                      Responder
                    </Button>
                  )}
                  
                  {isOwner && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        <DropdownMenuItem onClick={() => startEdit(comment)}>
                          <Edit3 className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem 
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Deletar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </>
            )}
            
            {/* Formulário de resposta */}
            {isReplying && (
              <div className="mt-3 space-y-2">
                <Textarea
                  value={commentForm.content}
                  onChange={(e) => setCommentForm(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Digite sua resposta..."
                  className="min-h-[80px]"
                />
                <div className="flex items-center space-x-2">
                  <Button 
                    size="sm" 
                    onClick={() => handleAddComment(comment.id)}
                    disabled={!commentForm.content.trim() || isSubmittingComment}
                  >
                    {isSubmittingComment ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4 mr-2" />
                    )}
                    Responder
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={cancelReply}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
            
            {/* Respostas */}
            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-3">
                {comment.replies.map(reply => renderComment(reply, true))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };
  
  // Organizar comentários em thread
  const organizeComments = (comments: FeatureComment[]): FeatureComment[] => {
    const commentMap = new Map<string, FeatureComment>();
    const rootComments: FeatureComment[] = [];
    
    // Primeiro, criar mapa de todos os comentários
    comments.forEach(comment => {
      commentMap.set(comment.id, { ...comment, replies: [] });
    });
    
    // Depois, organizar em hierarquia
    comments.forEach(comment => {
      const commentWithReplies = commentMap.get(comment.id)!;
      
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(commentWithReplies);
        }
      } else {
        rootComments.push(commentWithReplies);
      }
    });
    
    return rootComments;
  };
  
  const organizedComments = comments ? organizeComments(comments) : [];
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Seção de votação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="h-5 w-5" />
            <span>Votação</span>
          </CardTitle>
          <CardDescription>
            Vote para mostrar seu interesse nesta funcionalidade
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <Button
                variant={userVote?.vote_type === 'upvote' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleVote('upvote')}
                disabled={isLoading}
                className="flex items-center space-x-1"
              >
                <ThumbsUp className="h-4 w-4" />
                <span>{voteStats?.upvotes || 0}</span>
              </Button>
              
              <Button
                variant={userVote?.vote_type === 'downvote' ? 'default' : 'outline'}
                size="sm"
                onClick={() => handleVote('downvote')}
                disabled={isLoading}
                className="flex items-center space-x-1"
              >
                <ThumbsDown className="h-4 w-4" />
                <span>{voteStats?.downvotes || 0}</span>
              </Button>
            </div>
            
            <div className="text-sm text-muted-foreground">
              {voteStats && (
                <span>
                  {voteStats.upvotes - voteStats.downvotes} votos líquidos
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Seção de comentários */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <MessageSquare className="h-5 w-5" />
            <span>Comentários ({comments?.length || 0})</span>
          </CardTitle>
          <CardDescription>
            Compartilhe suas ideias e feedback sobre esta funcionalidade
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Formulário de novo comentário */}
          {currentUserId && (
            <div className="space-y-3">
              <Textarea
                value={commentForm.content}
                onChange={(e) => setCommentForm(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Adicione um comentário..."
                className="min-h-[100px]"
              />
              <div className="flex items-center justify-end">
                <Button 
                  onClick={() => handleAddComment()}
                  disabled={!commentForm.content.trim() || isSubmittingComment}
                  size="sm"
                >
                  {isSubmittingComment ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Comentar
                </Button>
              </div>
              <Separator />
            </div>
          )}
          
          {/* Lista de comentários */}
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex space-x-3">
                  <div className="h-8 w-8 bg-muted animate-pulse rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted animate-pulse rounded w-1/4" />
                    <div className="h-16 bg-muted animate-pulse rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : organizedComments.length > 0 ? (
            <div className="space-y-4">
              {organizedComments.map(comment => renderComment(comment))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum comentário ainda</h3>
              <p className="text-muted-foreground">
                {currentUserId 
                  ? 'Seja o primeiro a comentar sobre esta funcionalidade!' 
                  : 'Faça login para adicionar comentários'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}