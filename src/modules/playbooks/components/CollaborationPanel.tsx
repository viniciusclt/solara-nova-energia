import React, { useState } from 'react';
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
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'editor' | 'viewer';
  status: 'online' | 'away' | 'offline';
  lastSeen?: string;
  cursor?: {
    blockId: string;
    position: number;
  };
}

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
  onClose: () => void;
  users: CollaborationUser[];
  comments: Comment[];
  currentUserId: string;
  onInviteUser: (email: string) => void;
  onAddComment: (blockId: string, content: string) => void;
  onResolveComment: (commentId: string) => void;
  onReplyToComment: (commentId: string, content: string) => void;
}

export const CollaborationPanel: React.FC<CollaborationPanelProps> = ({
  onClose,
  users,
  comments,
  currentUserId,
  onInviteUser,
  onAddComment,
  onResolveComment,
  onReplyToComment,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'comments'>('users');
  const [inviteEmail, setInviteEmail] = useState('');
  const [newComment, setNewComment] = useState('');
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState('');

  const handleInviteUser = () => {
    if (inviteEmail.trim()) {
      onInviteUser(inviteEmail.trim());
      setInviteEmail('');
    }
  };

  const handleAddComment = () => {
    if (newComment.trim() && selectedBlockId) {
      onAddComment(selectedBlockId, newComment.trim());
      setNewComment('');
      setSelectedBlockId(null);
    }
  };

  const handleReplyToComment = (commentId: string) => {
    if (replyContent.trim()) {
      onReplyToComment(commentId, replyContent.trim());
      setReplyContent('');
      setReplyingTo(null);
    }
  };

  const getStatusColor = (status: CollaborationUser['status']) => {
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

  const getRoleIcon = (role: CollaborationUser['role']) => {
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
        <h2 className="font-semibold text-lg">Colaboração</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex border-b">
        <button
          className={cn(
            'flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'users'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
          onClick={() => setActiveTab('users')}
        >
          <Users className="h-4 w-4 mr-2 inline" />
          Usuários ({users.length})
        </button>
        <button
          className={cn(
            'flex-1 px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'comments'
              ? 'border-primary text-primary'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
          onClick={() => setActiveTab('comments')}
        >
          <MessageSquare className="h-4 w-4 mr-2 inline" />
          Comentários ({unresolvedComments.length})
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
                  <Button
                    onClick={handleInviteUser}
                    disabled={!inviteEmail.trim()}
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
                  Usuários Ativos
                </h3>
                {users.map((user) => (
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
                        {user.id === currentUserId && (
                          <Badge variant="secondary" className="text-xs ml-1">
                            Você
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {user.status === 'online' ? 'Online' : 
                         user.status === 'away' ? 'Ausente' :
                         user.lastSeen ? `Visto ${formatTime(user.lastSeen)}` : 'Offline'}
                      </div>
                    </div>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>Ver perfil</DropdownMenuItem>
                        <DropdownMenuItem>Enviar mensagem</DropdownMenuItem>
                        {user.id !== currentUserId && (
                          <DropdownMenuItem className="text-destructive">
                            Remover acesso
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                ))}
              </div>
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
                    disabled={!newComment.trim() || !selectedBlockId}
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
                    Comentários Pendentes ({unresolvedComments.length})
                  </h3>
                  {unresolvedComments.map((comment) => {
                    const user = users.find(u => u.id === comment.userId);
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
                                    const replyUser = users.find(u => u.id === reply.userId);
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
                    Comentários Resolvidos ({resolvedComments.length})
                  </h3>
                  {resolvedComments.map((comment) => {
                    const user = users.find(u => u.id === comment.userId);
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