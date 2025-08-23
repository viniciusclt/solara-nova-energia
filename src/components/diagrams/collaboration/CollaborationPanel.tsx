// ============================================================================
// CollaborationPanel - Painel lateral de colaboração
// ============================================================================

import React, { useState, useCallback } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Textarea,
  Badge,
  Avatar,
  AvatarFallback,
  AvatarImage,
  ScrollArea,
  Separator,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui';
import {
  Users,
  MessageSquare,
  Send,
  MoreVertical,
  UserPlus,
  Crown,
  Eye,
  Edit3,
  Clock,
  CheckCircle,
  Circle,
  AlertTriangle,
  Wifi,
  WifiOff,
  X,
  Reply,
  Trash2,
  UserMinus,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import type {
  CollaborationUser,
  DiagramComment,
  MergeConflict,
  ConflictResolution,
} from '@/types/collaboration';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

export interface CollaborationPanelProps {
  // Estado da colaboração
  isConnected: boolean;
  users: CollaborationUser[];
  currentUser: CollaborationUser | null;
  comments: DiagramComment[];
  conflicts: MergeConflict[];
  
  // Callbacks
  onAddComment: (comment: Omit<DiagramComment, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  onReplyToComment: (commentId: string, content: string) => Promise<void>;
  onResolveComment: (commentId: string) => Promise<void>;
  onDeleteComment: (commentId: string) => Promise<void>;
  onInviteUser: (email: string) => Promise<void>;
  onRemoveUser: (userId: string) => Promise<void>;
  onUpdateUserRole: (userId: string, role: CollaborationUser['role']) => Promise<void>;
  onResolveConflict: (conflictId: string, resolution: ConflictResolution) => Promise<void>;
  
  // Configurações
  className?: string;
  showComments?: boolean;
  showUsers?: boolean;
  showConflicts?: boolean;
}

interface CommentItemProps {
  comment: DiagramComment;
  currentUser: CollaborationUser | null;
  onReply: (content: string) => Promise<void>;
  onResolve: () => Promise<void>;
  onDelete: () => Promise<void>;
}

interface UserItemProps {
  user: CollaborationUser;
  currentUser: CollaborationUser | null;
  onRemove: () => Promise<void>;
  onUpdateRole: (role: CollaborationUser['role']) => Promise<void>;
}

interface ConflictItemProps {
  conflict: MergeConflict;
  onResolve: (resolution: ConflictResolution) => Promise<void>;
}

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

/**
 * Item de comentário
 */
const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  currentUser,
  onReply,
  onResolve,
  onDelete
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    
    setIsSubmitting(true);
    try {
      await onReply(replyContent);
      setReplyContent('');
      setIsReplying(false);
      toast.success('Resposta adicionada');
    } catch (error) {
      toast.error('Erro ao adicionar resposta');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async () => {
    try {
      await onResolve();
      toast.success('Comentário resolvido');
    } catch (error) {
      toast.error('Erro ao resolver comentário');
    }
  };

  const handleDelete = async () => {
    try {
      await onDelete();
      toast.success('Comentário removido');
    } catch (error) {
      toast.error('Erro ao remover comentário');
    }
  };

  const canModify = currentUser && (currentUser.id === comment.authorId || currentUser.role === 'owner');

  return (
    <div className={cn(
      "p-3 border rounded-lg space-y-2",
      comment.isResolved ? "bg-green-50 border-green-200" : "bg-white border-gray-200"
    )}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={comment.author.avatar} />
            <AvatarFallback className="text-xs">
              {comment.author.name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-sm font-medium">{comment.author.name}</p>
            <p className="text-xs text-gray-500">
              {comment.createdAt.toLocaleString()}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {comment.isResolved && (
            <CheckCircle className="h-4 w-4 text-green-600" />
          )}
          
          {canModify && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <MoreVertical className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {!comment.isResolved && (
                  <DropdownMenuItem onClick={handleResolve}>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Resolver
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                  <Trash2 className="h-4 w-4 mr-2" />
                  Excluir
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Content */}
      <p className="text-sm text-gray-700">{comment.content}</p>

      {/* Position info */}
      {comment.position && (
        <p className="text-xs text-gray-500">
          Posição: ({Math.round(comment.position.x)}, {Math.round(comment.position.y)})
        </p>
      )}

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="ml-4 space-y-2 border-l-2 border-gray-200 pl-3">
          {comment.replies.map(reply => (
            <div key={reply.id} className="text-sm">
              <div className="flex items-center gap-2 mb-1">
                <Avatar className="h-4 w-4">
                  <AvatarImage src={reply.author.avatar} />
                  <AvatarFallback className="text-xs">
                    {reply.author.name.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="font-medium">{reply.author.name}</span>
                <span className="text-xs text-gray-500">
                  {reply.createdAt.toLocaleString()}
                </span>
              </div>
              <p className="text-gray-700">{reply.content}</p>
            </div>
          ))}
        </div>
      )}

      {/* Reply form */}
      {!comment.isResolved && (
        <div className="space-y-2">
          {!isReplying ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsReplying(true)}
              className="h-7 text-xs"
            >
              <Reply className="h-3 w-3 mr-1" />
              Responder
            </Button>
          ) : (
            <div className="space-y-2">
              <Textarea
                value={replyContent}
                onChange={(e) => setReplyContent(e.target.value)}
                placeholder="Escreva uma resposta..."
                className="min-h-[60px] text-sm"
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  onClick={handleReply}
                  disabled={!replyContent.trim() || isSubmitting}
                  className="h-7 text-xs"
                >
                  <Send className="h-3 w-3 mr-1" />
                  Enviar
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setIsReplying(false);
                    setReplyContent('');
                  }}
                  className="h-7 text-xs"
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/**
 * Item de usuário
 */
const UserItem: React.FC<UserItemProps> = ({
  user,
  currentUser,
  onRemove,
  onUpdateRole
}) => {
  const canModify = currentUser && currentUser.role === 'owner' && currentUser.id !== user.id;

  const getRoleIcon = (role: CollaborationUser['role']) => {
    switch (role) {
      case 'owner': return <Crown className="h-3 w-3" />;
      case 'editor': return <Edit3 className="h-3 w-3" />;
      case 'viewer': return <Eye className="h-3 w-3" />;
      case 'commenter': return <MessageSquare className="h-3 w-3" />;
    }
  };

  const getRoleColor = (role: CollaborationUser['role']) => {
    switch (role) {
      case 'owner': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'editor': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'viewer': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'commenter': return 'bg-green-100 text-green-800 border-green-200';
    }
  };

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
      <div className="relative">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.avatar} />
          <AvatarFallback className="text-sm">
            {user.name.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className={cn(
          "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white",
          user.isOnline ? "bg-green-500" : "bg-gray-400"
        )} />
      </div>
      
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium truncate">{user.name}</p>
        <p className="text-xs text-gray-500 truncate">{user.email}</p>
        {!user.isOnline && (
          <p className="text-xs text-gray-400">
            Visto por último: {user.lastSeen.toLocaleTimeString()}
          </p>
        )}
      </div>
      
      <div className="flex items-center gap-2">
        <Badge className={cn("text-xs h-6", getRoleColor(user.role))}>
          {getRoleIcon(user.role)}
          <span className="ml-1">{user.role}</span>
        </Badge>
        
        {canModify && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreVertical className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onUpdateRole('editor')}>
                <Edit3 className="h-4 w-4 mr-2" />
                Tornar Editor
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdateRole('viewer')}>
                <Eye className="h-4 w-4 mr-2" />
                Tornar Visualizador
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onUpdateRole('commenter')}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Tornar Comentarista
              </DropdownMenuItem>
              <Separator />
              <DropdownMenuItem onClick={onRemove} className="text-red-600">
                <UserMinus className="h-4 w-4 mr-2" />
                Remover
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
};

/**
 * Item de conflito
 */
const ConflictItem: React.FC<ConflictItemProps> = ({ conflict, onResolve }) => {
  const handleResolve = async (resolution: ConflictResolution) => {
    try {
      await onResolve(resolution);
      toast.success('Conflito resolvido');
    } catch (error) {
      toast.error('Erro ao resolver conflito');
    }
  };

  return (
    <div className="p-3 border border-orange-200 bg-orange-50 rounded-lg space-y-3">
      <div className="flex items-start gap-2">
        <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-medium text-orange-800">
            Conflito de {conflict.type === 'concurrent_edit' ? 'Edição Simultânea' : 'Versão'}
          </p>
          <p className="text-xs text-orange-600">
            {conflict.description}
          </p>
          <p className="text-xs text-orange-500 mt-1">
            {conflict.createdAt.toLocaleString()}
          </p>
        </div>
      </div>
      
      <div className="flex gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleResolve('accept_local')}
          className="h-7 text-xs"
        >
          Manter Local
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleResolve('accept_remote')}
          className="h-7 text-xs"
        >
          Aceitar Remoto
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleResolve('merge')}
          className="h-7 text-xs"
        >
          Mesclar
        </Button>
      </div>
    </div>
  );
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  isConnected,
  users,
  currentUser,
  comments,
  conflicts,
  onAddComment,
  onReplyToComment,
  onResolveComment,
  onDeleteComment,
  onInviteUser,
  onRemoveUser,
  onUpdateUserRole,
  onResolveConflict,
  className,
  showComments = true,
  showUsers = true,
  showConflicts = true
}) => {
  const [newComment, setNewComment] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [isInviting, setIsInviting] = useState(false);

  // Adicionar novo comentário
  const handleAddComment = async () => {
    if (!newComment.trim()) return;
    
    setIsAddingComment(true);
    try {
      await onAddComment({
        content: newComment,
        authorId: currentUser!.id,
        author: currentUser!,
        position: { x: 0, y: 0 }, // Seria definido pelo clique no diagrama
        isResolved: false,
        replies: []
      });
      setNewComment('');
      toast.success('Comentário adicionado');
    } catch (error) {
      toast.error('Erro ao adicionar comentário');
    } finally {
      setIsAddingComment(false);
    }
  };

  // Convidar usuário
  const handleInviteUser = async () => {
    if (!inviteEmail.trim()) return;
    
    setIsInviting(true);
    try {
      await onInviteUser(inviteEmail);
      setInviteEmail('');
      toast.success('Convite enviado');
    } catch (error) {
      toast.error('Erro ao enviar convite');
    } finally {
      setIsInviting(false);
    }
  };

  const onlineUsers = users.filter(u => u.isOnline);
  const unresolvedComments = comments.filter(c => !c.isResolved);

  return (
    <div className={cn("w-80 bg-white border-l border-gray-200 flex flex-col h-full", className)}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-semibold text-gray-900">Colaboração</h3>
          <div className="flex items-center gap-1">
            {isConnected ? (
              <Wifi className="h-4 w-4 text-green-600" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-600" />
            )}
            <span className={cn(
              "text-xs",
              isConnected ? "text-green-600" : "text-red-600"
            )}>
              {isConnected ? 'Conectado' : 'Desconectado'}
            </span>
          </div>
        </div>
        
        {/* Stats */}
        <div className="flex gap-4 text-xs text-gray-600">
          <span>{onlineUsers.length} online</span>
          <span>{unresolvedComments.length} comentários</span>
          <span>{conflicts.length} conflitos</span>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          {/* Conflitos */}
          {showConflicts && conflicts.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-600" />
                Conflitos ({conflicts.length})
              </h4>
              {conflicts.map(conflict => (
                <ConflictItem
                  key={conflict.id}
                  conflict={conflict}
                  onResolve={(resolution) => onResolveConflict(conflict.id, resolution)}
                />
              ))}
            </div>
          )}

          {/* Usuários */}
          {showUsers && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-gray-900 flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Usuários ({users.length})
                </h4>
                
                {currentUser?.role === 'owner' && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                        <UserPlus className="h-3 w-3" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-64">
                      <div className="p-2 space-y-2">
                        <Input
                          placeholder="Email do usuário"
                          value={inviteEmail}
                          onChange={(e) => setInviteEmail(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && handleInviteUser()}
                        />
                        <Button
                          size="sm"
                          onClick={handleInviteUser}
                          disabled={!inviteEmail.trim() || isInviting}
                          className="w-full"
                        >
                          Convidar
                        </Button>
                      </div>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
              
              <div className="space-y-1">
                {users.map(user => (
                  <UserItem
                    key={user.id}
                    user={user}
                    currentUser={currentUser}
                    onRemove={() => onRemoveUser(user.id)}
                    onUpdateRole={(role) => onUpdateUserRole(user.id, role)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Comentários */}
          {showComments && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Comentários ({comments.length})
              </h4>
              
              {/* Novo comentário */}
              <div className="space-y-2">
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Adicionar comentário..."
                  className="min-h-[80px]"
                />
                <Button
                  size="sm"
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || isAddingComment}
                  className="w-full"
                >
                  <Send className="h-3 w-3 mr-1" />
                  Adicionar Comentário
                </Button>
              </div>
              
              {/* Lista de comentários */}
              <div className="space-y-3">
                {comments.map(comment => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                    currentUser={currentUser}
                    onReply={(content) => onReplyToComment(comment.id, content)}
                    onResolve={() => onResolveComment(comment.id)}
                    onDelete={() => onDeleteComment(comment.id)}
                  />
                ))}
                
                {comments.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Nenhum comentário ainda
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default CollaborationPanel;