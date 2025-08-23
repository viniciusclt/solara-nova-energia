import React, { useState, useCallback } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Input,
  Textarea,
  Separator,
  ScrollArea,
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui';
import {
  X,
  Users,
  MessageSquare,
  Send,
  MoreVertical,
  UserPlus,
  Crown,
  Eye,
  Edit,
  Clock,
  CheckCircle,
  Circle,
  AlertCircle,
  Wifi,
  WifiOff,
  AlertTriangle,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useCollaboration } from '@/hooks/useCollaboration';
import { toast } from 'sonner';

interface Comment {
  id: string;
  userId: string;
  blockId: string;
  content: string;
  createdAt: string;
  resolved: boolean;
  replies?: Comment[];
}

interface CollaborationPanelProps {
  diagramId: string;
  onClose: () => void;
  comments?: Comment[];
  onAddComment?: (blockId: string, content: string) => void;
  onResolveComment?: (commentId: string) => void;
  onReplyToComment?: (commentId: string, content: string) => void;
}

export const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  diagramId,
  onClose,
  comments = [],
  onAddComment,
  onResolveComment,
  onReplyToComment,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'comments' | 'conflicts'>('users');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'editor' | 'viewer'>('viewer');
  const [newComment, setNewComment] = useState('');
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  // Hook de colaboração
  const collaboration = useCollaboration({
    diagramId,
    autoResolveConflicts: false,
    enableCursorBroadcast: true,
    enablePresence: true,
    syncInterval: 1000
  });

  // Handlers
  const handleConnect = useCallback(async () => {
    try {
      await collaboration.connect();
      toast.success('Conectado à colaboração!');
    } catch (error) {
      toast.error('Erro ao conectar à colaboração');
    }
  }, [collaboration]);

  const handleDisconnect = useCallback(() => {
    collaboration.disconnect();
    toast.info('Desconectado da colaboração');
  }, [collaboration]);

  const handleInviteUser = useCallback(async () => {
    if (!inviteEmail.trim()) {
      toast.error('Digite um email válido');
      return;
    }
    
    try {
      await collaboration.inviteUser(inviteEmail.trim(), inviteRole);
      setInviteEmail('');
      toast.success(`Convite enviado para ${inviteEmail}`);
    } catch (error) {
      toast.error('Erro ao enviar convite');
    }
  }, [collaboration, inviteEmail, inviteRole]);

  const handleRemoveUser = useCallback(async (userId: string) => {
    try {
      await collaboration.removeUser(userId);
      toast.success('Usuário removido da colaboração');
    } catch (error) {
      toast.error('Erro ao remover usuário');
    }
  }, [collaboration]);

  const handleUpdateUserRole = useCallback(async (userId: string, role: 'editor' | 'viewer') => {
    try {
      await collaboration.updateUserRole(userId, role);
      toast.success('Papel do usuário atualizado');
    } catch (error) {
      toast.error('Erro ao atualizar papel do usuário');
    }
  }, [collaboration]);

  const handleAddComment = useCallback(() => {
    if (newComment.trim() && selectedBlockId) {
      onAddComment?.(selectedBlockId, newComment.trim());
      setNewComment('');
      setSelectedBlockId(null);
    }
  }, [newComment, selectedBlockId, onAddComment]);

  const handleReplyToComment = useCallback((commentId: string) => {
    if (replyContent.trim()) {
      onReplyToComment?.(commentId, replyContent.trim());
      setReplyContent('');
      setReplyingTo(null);
    }
  }, [replyContent, onReplyToComment]);

  const handleResolveConflict = useCallback((conflictId: string, resolution: 'accept' | 'reject' | 'merge') => {
    collaboration.resolveConflict(conflictId, resolution);
    toast.success(`Conflito resolvido: ${resolution}`);
  }, [collaboration]);

  const getStatusColor = (status: string) => {
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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner':
        return <Crown className="h-3 w-3 text-yellow-600" />;
      case 'editor':
        return <Edit className="h-3 w-3 text-blue-600" />;
      case 'viewer':
        return <Eye className="h-3 w-3 text-gray-600" />;
      default:
        return null;
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

    if (diffInMinutes < 1) return 'agora';
    if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
    return `${Math.floor(diffInMinutes / 1440)}d atrás`;
  };

  const unresolvedComments = comments.filter(comment => !comment.resolved);
  const resolvedComments = comments.filter(comment => comment.resolved);

  return (
    <div className="w-80 h-full border-l bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center space-x-2">
          <h2 className="font-semibold text-lg">Colaboração</h2>
          <Badge variant={collaboration.isConnected ? 'default' : 'secondary'}>
            {collaboration.isConnected ? (
              <><Wifi className="h-3 w-3 mr-1" />Conectado</>
            ) : (
              <><WifiOff className="h-3 w-3 mr-1" />Desconectado</>
            )}
          </Badge>
        </div>
        
        <div className="flex items-center space-x-2">
          {!collaboration.isConnected ? (
            <Button size="sm" onClick={handleConnect}>
              Conectar
            </Button>
          ) : (
            <Button size="sm" variant="outline" onClick={handleDisconnect}>
              Desconectar
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          className={cn(
            'flex-1 px-3 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'users'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
          onClick={() => setActiveTab('users')}
        >
          <Users className="h-4 w-4 mr-1 inline" />
          Usuários ({collaboration.users.length})
        </button>
        <button
          className={cn(
            'flex-1 px-3 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'comments'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
          onClick={() => setActiveTab('comments')}
        >
          <MessageSquare className="h-4 w-4 mr-1 inline" />
          Comentários ({unresolvedComments.length})
        </button>
        <button
          className={cn(
            'flex-1 px-3 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'conflicts'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
          onClick={() => setActiveTab('conflicts')}
        >
          <AlertTriangle className="h-4 w-4 mr-1 inline" />
          Conflitos ({collaboration.pendingConflicts.length})
        </button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          {activeTab === 'users' && (
            <div className="space-y-4">
              {/* Invite User */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <UserPlus className="h-4 w-4" />
                    Convidar Usuário
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    placeholder="email@exemplo.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleInviteUser()}
                  />
                  <select 
                    value={inviteRole} 
                    onChange={(e) => setInviteRole(e.target.value as 'editor' | 'viewer')}
                    className="w-full px-3 py-2 border rounded-md text-sm"
                  >
                    <option value="viewer">Viewer (apenas visualização)</option>
                    <option value="editor">Editor (pode editar)</option>
                  </select>
                  <Button
                    onClick={handleInviteUser}
                    disabled={!inviteEmail.trim() || !collaboration.isConnected}
                    className="w-full"
                    size="sm"
                  >
                    Enviar Convite
                  </Button>
                </CardContent>
              </Card>

              {/* Active Users */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground">
                  Usuários Conectados ({collaboration.activeUsers.length} online)
                </h3>
                {collaboration.users.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">Nenhum usuário conectado</p>
                    <p className="text-xs">Convide colaboradores para começar</p>
                  </div>
                ) : (
                  collaboration.users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 p-3 rounded-lg border hover:bg-muted/50"
                    >
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback className="text-xs">
                            {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div
                          className={cn(
                            'absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-background',
                            getStatusColor(user.status)
                          )}
                        />
                      </div>
                    
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium truncate">
                            {user.name}
                          </span>
                          {getRoleIcon(user.role)}
                          {user.id === collaboration.currentUser?.id && (
                            <Badge variant="secondary" className="text-xs ml-1">
                              Você
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {user.status === 'online' ? 'Online' : 
                           user.status === 'away' ? 'Ausente' :
                           user.lastSeen ? `Visto ${formatTime(user.lastSeen.toISOString())}` : 'Offline'}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {user.id !== collaboration.currentUser?.id && collaboration.canEdit && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleUpdateUserRole(
                                user.id, 
                                user.role === 'editor' ? 'viewer' : 'editor'
                              )}
                            >
                              {user.role === 'editor' ? 'Tornar Viewer' : 'Tornar Editor'}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleRemoveUser(user.id)}
                            >
                              Remover
                            </Button>
                          </>
                        )}
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem>Ver perfil</DropdownMenuItem>
                            <DropdownMenuItem>Enviar mensagem</DropdownMenuItem>
                            {user.cursor && (
                              <DropdownMenuItem>
                                Ir para cursor
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'conflicts' && (
            <div className="space-y-4">
              {collaboration.pendingConflicts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertTriangle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum conflito pendente</p>
                </div>
              ) : (
                collaboration.pendingConflicts.map((conflict) => (
                  <div key={conflict.id} className="p-4 border rounded-lg bg-yellow-50 border-yellow-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <div>
                          <h4 className="font-medium text-yellow-800">
                            Conflito: {conflict.type}
                          </h4>
                          <p className="text-sm text-yellow-700">
                            {conflict.description}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                        {formatTime(conflict.timestamp.toISOString())}
                      </Badge>
                    </div>
                    
                    <div className="space-y-2 mb-3">
                      <div className="text-sm">
                        <span className="font-medium">Versão Local:</span>
                        <pre className="mt-1 p-2 bg-white rounded text-xs overflow-x-auto">
                          {JSON.stringify(conflict.localVersion, null, 2)}
                        </pre>
                      </div>
                      <div className="text-sm">
                        <span className="font-medium">Versão Remota:</span>
                        <pre className="mt-1 p-2 bg-white rounded text-xs overflow-x-auto">
                          {JSON.stringify(conflict.remoteVersion, null, 2)}
                        </pre>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                         size="sm"
                         variant="outline"
                         onClick={() => handleResolveConflict(conflict.id, 'local')}
                       >
                         Manter Local
                       </Button>
                       <Button
                         size="sm"
                         variant="outline"
                         onClick={() => handleResolveConflict(conflict.id, 'remote')}
                       >
                         Aceitar Remoto
                       </Button>
                      <Button
                        size="sm"
                        onClick={() => handleResolveConflict(conflict.id, 'merge')}
                      >
                        Tentar Merge
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'comments' && (
            <div className="space-y-4">
              {/* Add Comment */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <MessageSquare className="h-4 w-4" />
                    Novo Comentário
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Input
                    placeholder="ID do bloco (ex: block-123)"
                    value={selectedBlockId || ''}
                    onChange={(e) => setSelectedBlockId(e.target.value)}
                  />
                  <Textarea
                    placeholder="Escreva seu comentário..."
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    rows={3}
                  />
                  <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || !selectedBlockId || !collaboration.isConnected}
                    className="w-full"
                    size="sm"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Adicionar Comentário
                  </Button>
                </CardContent>
              </Card>

              {/* Unresolved Comments */}
              {unresolvedComments.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Circle className="h-4 w-4" />
                    Comentários Pendentes ({(comments || []).filter(c => !c.resolved).length})
                  </h3>
                  {(comments || []).filter(c => !c.resolved).map((comment) => {
                    const user = collaboration.users.find(u => u.id === comment.userId);
                    return (
                      <Card key={comment.id} className="border-l-4 border-l-yellow-500">
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={user?.avatar} alt={user?.name} />
                              <AvatarFallback className="text-xs">
                                {user?.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium">
                                  {user?.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(comment.createdAt)}
                                </span>
                              </div>
                              
                              <p className="text-sm text-foreground mb-2">
                                {comment.content}
                              </p>
                              
                              <div className="flex items-center gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => onResolveComment(comment.id)}
                                >
                                  <CheckCircle className="h-3 w-3 mr-1" />
                                  Resolver
                                </Button>
                                
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setReplyingTo(comment.id)}
                                >
                                  Responder
                                </Button>
                              </div>
                              
                              {/* Reply Form */}
                              {replyingTo === comment.id && (
                                <div className="mt-3 space-y-2">
                                  <Textarea
                                    placeholder="Escreva sua resposta..."
                                    value={replyContent}
                                    onChange={(e) => setReplyContent(e.target.value)}
                                    rows={2}
                                  />
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      onClick={() => handleReplyToComment(comment.id)}
                                      disabled={!replyContent.trim()}
                                    >
                                      Enviar
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setReplyingTo(null);
                                        setReplyContent('');
                                      }}
                                    >
                                      Cancelar
                                    </Button>
                                  </div>
                                </div>
                              )}
                              
                              {/* Replies */}
                              {comment.replies && comment.replies.length > 0 && (
                                <div className="mt-3 pl-4 border-l-2 border-muted space-y-2">
                                  {comment.replies.map((reply) => {
                                    const replyUser = collaboration.users.find(u => u.id === reply.userId);
                                    return (
                                      <div key={reply.id} className="flex items-start gap-2">
                                        <Avatar className="h-5 w-5">
                                          <AvatarImage src={replyUser?.avatar} alt={replyUser?.name} />
                                          <AvatarFallback className="text-xs">
                                            {replyUser?.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                          </AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                          <div className="flex items-center gap-2">
                                            <span className="text-xs font-medium">
                                              {replyUser?.name}
                                            </span>
                                            <span className="text-xs text-muted-foreground">
                                              {formatTime(reply.createdAt)}
                                            </span>
                                          </div>
                                          <p className="text-xs text-foreground">
                                            {reply.content}
                                          </p>
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
                  })}
                </div>
              )}

              {/* Resolved Comments */}
              {resolvedComments.length > 0 && (
                <div className="space-y-3">
                  <Separator />
                  <h3 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Comentários Resolvidos ({(comments || []).filter(c => c.resolved).length})
                  </h3>
                  {(comments || []).filter(c => c.resolved).map((comment) => {
                    const user = collaboration.users.find(u => u.id === comment.userId);
                    return (
                      <Card key={comment.id} className="border-l-4 border-l-green-500 opacity-75">
                        <CardContent className="p-3">
                          <div className="flex items-start gap-3">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={user?.avatar} alt={user?.name} />
                              <AvatarFallback className="text-xs">
                                {user?.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="text-sm font-medium">
                                  {user?.name}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatTime(comment.createdAt)}
                                </span>
                                <Badge variant="secondary" className="text-xs">
                                  Resolvido
                                </Badge>
                              </div>
                              
                              <p className="text-sm text-muted-foreground">
                                {comment.content}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}

              {/* Empty State */}
              {comments.length === 0 && (
                <div className="text-center py-8">
                  <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-sm font-medium mb-2">Nenhum comentário</h3>
                  <p className="text-xs text-muted-foreground">
                    Adicione comentários para colaborar com sua equipe
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};

export default CollaborationPanel;