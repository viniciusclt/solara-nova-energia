// ============================================================================
// Collaboration Panel - Painel de colaboração em tempo real
// ============================================================================
// Painel para gerenciar colaboração, comentários e histórico de versões
// ============================================================================

import React, { memo, useState, useCallback, useMemo, useEffect } from 'react';
import {
  Users,
  MessageCircle,
  History,
  Share2,
  UserPlus,
  Settings,
  X,
  Send,
  Reply,
  MoreHorizontal,
  Eye,
  Edit3,
  Clock,
  CheckCircle,
  AlertCircle,
  Trash2,
  Pin,
  PinOff,
  Filter,
  Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

// ============================================================================
// INTERFACES
// ============================================================================

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'editor' | 'viewer';
  status: 'online' | 'offline' | 'away';
  lastSeen?: Date;
  cursor?: { x: number; y: number };
  selection?: string[];
}

export interface Comment {
  id: string;
  authorId: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
  position?: { x: number; y: number };
  nodeId?: string;
  edgeId?: string;
  resolved: boolean;
  pinned: boolean;
  replies: CommentReply[];
  mentions: string[];
}

export interface CommentReply {
  id: string;
  authorId: string;
  content: string;
  createdAt: Date;
  updatedAt?: Date;
}

export interface VersionHistory {
  id: string;
  authorId: string;
  description: string;
  createdAt: Date;
  changes: {
    added: number;
    modified: number;
    deleted: number;
  };
  isCurrent: boolean;
}

export interface CollaborationState {
  users: User[];
  comments: Comment[];
  versions: VersionHistory[];
  permissions: {
    canEdit: boolean;
    canComment: boolean;
    canShare: boolean;
    canManageUsers: boolean;
  };
}

interface CollaborationPanelProps {
  collaboration: CollaborationState;
  currentUserId: string;
  onClose: () => void;
  onAddComment?: (content: string, position?: { x: number; y: number }, nodeId?: string) => void;
  onReplyComment?: (commentId: string, content: string) => void;
  onResolveComment?: (commentId: string) => void;
  onDeleteComment?: (commentId: string) => void;
  onPinComment?: (commentId: string) => void;
  onInviteUser?: (email: string, role: User['role']) => void;
  onUpdateUserRole?: (userId: string, role: User['role']) => void;
  onRemoveUser?: (userId: string) => void;
  onRestoreVersion?: (versionId: string) => void;
  onGoToElement?: (nodeId?: string, edgeId?: string) => void;
  className?: string;
}

type CommentFilter = 'all' | 'unresolved' | 'pinned' | 'mine';

// ============================================================================
// UTILITÁRIOS
// ============================================================================

const getUserInitials = (name: string) => {
  return name
    .split(' ')
    .map(part => part.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

const getStatusColor = (status: User['status']) => {
  switch (status) {
    case 'online':
      return 'bg-green-500';
    case 'away':
      return 'bg-yellow-500';
    case 'offline':
      return 'bg-gray-400';
    default:
      return 'bg-gray-400';
  }
};

const getRoleColor = (role: User['role']) => {
  switch (role) {
    case 'owner':
      return 'bg-purple-100 text-purple-800';
    case 'editor':
      return 'bg-blue-100 text-blue-800';
    case 'viewer':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const formatRelativeTime = (date: Date) => {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'agora';
  if (diffMins < 60) return `${diffMins}m atrás`;
  if (diffHours < 24) return `${diffHours}h atrás`;
  if (diffDays < 7) return `${diffDays}d atrás`;
  return date.toLocaleDateString();
};

// ============================================================================
// COMPONENTES
// ============================================================================

const UserItem: React.FC<{
  user: User;
  currentUserId: string;
  canManageUsers: boolean;
  onUpdateRole?: (userId: string, role: User['role']) => void;
  onRemoveUser?: (userId: string) => void;
}> = memo(({ user, currentUserId, canManageUsers, onUpdateRole, onRemoveUser }) => {
  const isCurrentUser = user.id === currentUserId;

  return (
    <div className="flex items-center space-x-3 p-2 rounded hover:bg-muted/50">
      <div className="relative">
        <Avatar className="h-8 w-8">
          <AvatarImage src={user.avatar} alt={user.name} />
          <AvatarFallback className="text-xs">
            {getUserInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div className={cn(
          'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background',
          getStatusColor(user.status)
        )} />
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium truncate">
            {user.name}
            {isCurrentUser && ' (você)'}
          </span>
          <Badge className={cn('text-xs', getRoleColor(user.role))}>
            {user.role}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {user.status === 'online' ? 'Online' : 
           user.lastSeen ? `Visto ${formatRelativeTime(user.lastSeen)}` : 'Offline'}
        </p>
      </div>
      
      {canManageUsers && !isCurrentUser && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {onUpdateRole && (
              <>
                <DropdownMenuItem onClick={() => onUpdateRole(user.id, 'owner')}>
                  Tornar proprietário
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdateRole(user.id, 'editor')}>
                  Tornar editor
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onUpdateRole(user.id, 'viewer')}>
                  Tornar visualizador
                </DropdownMenuItem>
                <Separator />
              </>
            )}
            {onRemoveUser && (
              <DropdownMenuItem 
                onClick={() => onRemoveUser(user.id)}
                className="text-red-600"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remover usuário
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
});

const CommentItem: React.FC<{
  comment: Comment;
  author: User;
  currentUserId: string;
  canComment: boolean;
  onReply?: (commentId: string, content: string) => void;
  onResolve?: (commentId: string) => void;
  onDelete?: (commentId: string) => void;
  onPin?: (commentId: string) => void;
  onGoToElement?: (nodeId?: string, edgeId?: string) => void;
}> = memo(({ 
  comment, 
  author, 
  currentUserId, 
  canComment, 
  onReply, 
  onResolve, 
  onDelete, 
  onPin, 
  onGoToElement 
}) => {
  const [isReplying, setIsReplying] = useState(false);
  const [replyContent, setReplyContent] = useState('');
  const [showReplies, setShowReplies] = useState(false);

  const handleReply = useCallback(() => {
    if (replyContent.trim() && onReply) {
      onReply(comment.id, replyContent.trim());
      setReplyContent('');
      setIsReplying(false);
      setShowReplies(true);
    }
  }, [comment.id, replyContent, onReply]);

  const handleGoToElement = useCallback(() => {
    if (onGoToElement) {
      onGoToElement(comment.nodeId, comment.edgeId);
    }
  }, [comment.nodeId, comment.edgeId, onGoToElement]);

  const isAuthor = comment.authorId === currentUserId;

  return (
    <Card className={cn(
      'mb-3',
      comment.resolved && 'opacity-60',
      comment.pinned && 'border-yellow-300 bg-yellow-50'
    )}>
      <CardContent className="p-3">
        <div className="flex items-start space-x-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={author.avatar} alt={author.name} />
            <AvatarFallback className="text-xs">
              {getUserInitials(author.name)}
            </AvatarFallback>
          </Avatar>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium">{author.name}</span>
                <span className="text-xs text-muted-foreground">
                  {formatRelativeTime(comment.createdAt)}
                </span>
                {comment.pinned && (
                  <Pin className="h-3 w-3 text-yellow-600" />
                )}
              </div>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreHorizontal className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {(comment.nodeId || comment.edgeId) && onGoToElement && (
                    <DropdownMenuItem onClick={handleGoToElement}>
                      <Eye className="h-4 w-4 mr-2" />
                      Ir para elemento
                    </DropdownMenuItem>
                  )}
                  {onPin && (
                    <DropdownMenuItem onClick={() => onPin(comment.id)}>
                      {comment.pinned ? (
                        <><PinOff className="h-4 w-4 mr-2" />Desafixar</>
                      ) : (
                        <><Pin className="h-4 w-4 mr-2" />Fixar</>
                      )}
                    </DropdownMenuItem>
                  )}
                  {onResolve && (
                    <DropdownMenuItem onClick={() => onResolve(comment.id)}>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      {comment.resolved ? 'Reabrir' : 'Resolver'}
                    </DropdownMenuItem>
                  )}
                  {isAuthor && onDelete && (
                    <DropdownMenuItem 
                      onClick={() => onDelete(comment.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <p className="text-sm text-foreground mb-2">{comment.content}</p>
            
            {(comment.nodeId || comment.edgeId) && (
              <div className="flex items-center space-x-2 mb-2">
                {comment.nodeId && (
                  <Badge variant="outline" className="text-xs">
                    Nó: {comment.nodeId}
                  </Badge>
                )}
                {comment.edgeId && (
                  <Badge variant="outline" className="text-xs">
                    Aresta: {comment.edgeId}
                  </Badge>
                )}
              </div>
            )}
            
            <div className="flex items-center space-x-2">
              {canComment && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsReplying(!isReplying)}
                  className="h-6 px-2 text-xs"
                >
                  <Reply className="h-3 w-3 mr-1" />
                  Responder
                </Button>
              )}
              
              {comment.replies.length > 0 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReplies(!showReplies)}
                  className="h-6 px-2 text-xs"
                >
                  {showReplies ? 'Ocultar' : 'Mostrar'} {comment.replies.length} resposta(s)
                </Button>
              )}
              
              {comment.resolved && (
                <Badge variant="outline" className="text-xs text-green-600">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Resolvido
                </Badge>
              )}
            </div>
            
            {isReplying && (
              <div className="mt-2 space-y-2">
                <Textarea
                  placeholder="Escreva uma resposta..."
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  className="min-h-[60px] text-sm"
                />
                <div className="flex items-center space-x-2">
                  <Button size="sm" onClick={handleReply} disabled={!replyContent.trim()}>
                    <Send className="h-3 w-3 mr-1" />
                    Responder
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setIsReplying(false)}>
                    Cancelar
                  </Button>
                </div>
              </div>
            )}
            
            {showReplies && comment.replies.length > 0 && (
              <div className="mt-3 pl-4 border-l-2 border-muted space-y-2">
                {comment.replies.map((reply) => {
                  const replyAuthor = author; // Simplificado - deveria buscar o autor real
                  return (
                    <div key={reply.id} className="flex items-start space-x-2">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={replyAuthor.avatar} alt={replyAuthor.name} />
                        <AvatarFallback className="text-xs">
                          {getUserInitials(replyAuthor.name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="text-xs font-medium">{replyAuthor.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatRelativeTime(reply.createdAt)}
                          </span>
                        </div>
                        <p className="text-xs text-foreground">{reply.content}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const CollaborationPanel: React.FC<CollaborationPanelProps> = memo(({
  collaboration,
  currentUserId,
  onClose,
  onAddComment,
  onReplyComment,
  onResolveComment,
  onDeleteComment,
  onPinComment,
  onInviteUser,
  onUpdateUserRole,
  onRemoveUser,
  onRestoreVersion,
  onGoToElement,
  className = ''
}) => {
  const [activeTab, setActiveTab] = useState('comments');
  const [commentFilter, setCommentFilter] = useState<CommentFilter>('all');
  const [commentSearch, setCommentSearch] = useState('');
  const [newComment, setNewComment] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<User['role']>('viewer');

  const currentUser = useMemo(() => {
    return collaboration.users.find(user => user.id === currentUserId);
  }, [collaboration.users, currentUserId]);

  const filteredComments = useMemo(() => {
    let filtered = collaboration.comments;

    // Filtrar por tipo
    switch (commentFilter) {
      case 'unresolved':
        filtered = filtered.filter(comment => !comment.resolved);
        break;
      case 'pinned':
        filtered = filtered.filter(comment => comment.pinned);
        break;
      case 'mine':
        filtered = filtered.filter(comment => comment.authorId === currentUserId);
        break;
    }

    // Filtrar por busca
    if (commentSearch.trim()) {
      const search = commentSearch.toLowerCase();
      filtered = filtered.filter(comment => 
        comment.content.toLowerCase().includes(search) ||
        comment.replies.some(reply => reply.content.toLowerCase().includes(search))
      );
    }

    return filtered.sort((a, b) => {
      // Comentários fixados primeiro
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      // Depois por data (mais recentes primeiro)
      return b.createdAt.getTime() - a.createdAt.getTime();
    });
  }, [collaboration.comments, commentFilter, commentSearch, currentUserId]);

  const handleAddComment = useCallback(() => {
    if (newComment.trim() && onAddComment) {
      onAddComment(newComment.trim());
      setNewComment('');
    }
  }, [newComment, onAddComment]);

  const handleInviteUser = useCallback(() => {
    if (inviteEmail.trim() && onInviteUser) {
      onInviteUser(inviteEmail.trim(), inviteRole);
      setInviteEmail('');
    }
  }, [inviteEmail, inviteRole, onInviteUser]);

  const onlineUsers = collaboration.users.filter(user => user.status === 'online');
  const unresolvedComments = collaboration.comments.filter(comment => !comment.resolved);

  return (
    <div className={cn('collaboration-panel w-80 h-full bg-background border-l flex flex-col', className)}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <Users className="h-5 w-5" />
          <h2 className="font-semibold text-lg">Colaboração</h2>
        </div>
        
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="sm" variant="outline">
                  <Share2 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Compartilhar diagrama</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Status Summary */}
      <div className="p-4 border-b">
        <div className="grid grid-cols-2 gap-3 text-center">
          <div className="p-2 rounded bg-green-50 border border-green-200">
            <div className="text-lg font-bold text-green-600">{onlineUsers.length}</div>
            <div className="text-xs text-green-600">Online</div>
          </div>
          <div className="p-2 rounded bg-blue-50 border border-blue-200">
            <div className="text-lg font-bold text-blue-600">{unresolvedComments.length}</div>
            <div className="text-xs text-blue-600">Pendentes</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-3 mx-4 mt-4">
          <TabsTrigger value="comments" className="text-xs">
            <MessageCircle className="h-3 w-3 mr-1" />
            Comentários
          </TabsTrigger>
          <TabsTrigger value="users" className="text-xs">
            <Users className="h-3 w-3 mr-1" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="history" className="text-xs">
            <History className="h-3 w-3 mr-1" />
            Histórico
          </TabsTrigger>
        </TabsList>

        {/* Comments Tab */}
        <TabsContent value="comments" className="flex-1 flex flex-col mt-0">
          {/* Comment Filters */}
          <div className="p-4 border-b space-y-3">
            <div className="flex items-center space-x-2">
              <Input
                placeholder="Buscar comentários..."
                value={commentSearch}
                onChange={(e) => setCommentSearch(e.target.value)}
                className="h-8 text-sm"
              />
              <Button size="sm" variant="outline">
                <Search className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="flex items-center space-x-1">
              {(['all', 'unresolved', 'pinned', 'mine'] as CommentFilter[]).map((filter) => (
                <Button
                  key={filter}
                  size="sm"
                  variant={commentFilter === filter ? "default" : "outline"}
                  onClick={() => setCommentFilter(filter)}
                  className="h-7 px-2 text-xs"
                >
                  {filter === 'all' && 'Todos'}
                  {filter === 'unresolved' && 'Pendentes'}
                  {filter === 'pinned' && 'Fixados'}
                  {filter === 'mine' && 'Meus'}
                </Button>
              ))}
            </div>
          </div>

          {/* Add Comment */}
          {collaboration.permissions.canComment && (
            <div className="p-4 border-b space-y-2">
              <Textarea
                placeholder="Adicionar comentário..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="min-h-[60px] text-sm"
              />
              <div className="flex justify-end">
                <Button size="sm" onClick={handleAddComment} disabled={!newComment.trim()}>
                  <Send className="h-3 w-3 mr-1" />
                  Comentar
                </Button>
              </div>
            </div>
          )}

          {/* Comments List */}
          <ScrollArea className="flex-1">
            <div className="p-4">
              {filteredComments.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    {collaboration.comments.length === 0 
                      ? 'Nenhum comentário ainda.' 
                      : 'Nenhum comentário corresponde aos filtros.'}
                  </p>
                </div>
              ) : (
                filteredComments.map((comment) => {
                  const author = collaboration.users.find(user => user.id === comment.authorId);
                  if (!author) return null;
                  
                  return (
                    <CommentItem
                      key={comment.id}
                      comment={comment}
                      author={author}
                      currentUserId={currentUserId}
                      canComment={collaboration.permissions.canComment}
                      onReply={onReplyComment}
                      onResolve={onResolveComment}
                      onDelete={onDeleteComment}
                      onPin={onPinComment}
                      onGoToElement={onGoToElement}
                    />
                  );
                })
              )}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="flex-1 flex flex-col mt-0">
          {/* Invite User */}
          {collaboration.permissions.canManageUsers && onInviteUser && (
            <div className="p-4 border-b space-y-2">
              <div className="flex items-center space-x-2">
                <Input
                  placeholder="Email do usuário"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="h-8 text-sm"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as User['role'])}
                  className="h-8 px-2 text-sm border rounded"
                >
                  <option value="viewer">Visualizador</option>
                  <option value="editor">Editor</option>
                  <option value="owner">Proprietário</option>
                </select>
              </div>
              <Button size="sm" onClick={handleInviteUser} disabled={!inviteEmail.trim()} className="w-full">
                <UserPlus className="h-3 w-3 mr-1" />
                Convidar
              </Button>
            </div>
          )}

          {/* Users List */}
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-2">
              {collaboration.users.map((user) => (
                <UserItem
                  key={user.id}
                  user={user}
                  currentUserId={currentUserId}
                  canManageUsers={collaboration.permissions.canManageUsers}
                  onUpdateRole={onUpdateUserRole}
                  onRemoveUser={onRemoveUser}
                />
              ))}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="flex-1 flex flex-col mt-0">
          <ScrollArea className="flex-1">
            <div className="p-4 space-y-3">
              {collaboration.versions.length === 0 ? (
                <div className="text-center py-8">
                  <History className="h-12 w-12 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">
                    Nenhuma versão salva ainda.
                  </p>
                </div>
              ) : (
                collaboration.versions.map((version) => {
                  const author = collaboration.users.find(user => user.id === version.authorId);
                  
                  return (
                    <Card key={version.id} className={cn(
                      'cursor-pointer transition-colors hover:bg-muted/50',
                      version.isCurrent && 'border-blue-300 bg-blue-50'
                    )}>
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-sm font-medium">
                                {version.description || 'Versão sem descrição'}
                              </span>
                              {version.isCurrent && (
                                <Badge variant="outline" className="text-xs">
                                  Atual
                                </Badge>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="text-xs text-muted-foreground">
                                {author?.name || 'Usuário desconhecido'}
                              </span>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className="text-xs text-muted-foreground">
                                {formatRelativeTime(version.createdAt)}
                              </span>
                            </div>
                            
                            <div className="flex items-center space-x-3 text-xs text-muted-foreground">
                              <span className="text-green-600">+{version.changes.added}</span>
                              <span className="text-blue-600">~{version.changes.modified}</span>
                              <span className="text-red-600">-{version.changes.deleted}</span>
                            </div>
                          </div>
                          
                          {!version.isCurrent && onRestoreVersion && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onRestoreVersion(version.id)}
                              className="h-6 px-2 text-xs"
                            >
                              Restaurar
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
});

CollaborationPanel.displayName = 'CollaborationPanel';

export default CollaborationPanel;