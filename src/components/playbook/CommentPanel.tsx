// ============================================================================
// CommentPanel - Painel de comentários para PlaybookEditor
// ============================================================================

import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Button
} from '@/components/ui/button';
import {
  Input
} from '@/components/ui/input';
import {
  Textarea
} from '@/components/ui/textarea';
import {
  Badge
} from '@/components/ui/badge';
import {
  Separator
} from '@/components/ui/separator';
import {
  ScrollArea
} from '@/components/ui/scroll-area';
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  MessageSquare,
  Plus,
  Send,
  MoreHorizontal,
  CheckCircle,
  Circle,
  Reply,
  Trash2,
  Edit3,
  Clock
} from 'lucide-react';
import { PlaybookComment } from '@/types/playbook';
import { cn } from '@/lib/utils';

// ============================================================================
// Interfaces
// ============================================================================

interface CommentPanelProps {
  playbookId: string;
  comments: PlaybookComment[];
  onAddComment: (params: { blockId: string; content: string }) => void;
  isLoading?: boolean;
}

interface AddCommentFormProps {
  onSubmit: (blockId: string, content: string) => void;
  isLoading?: boolean;
}

interface CommentItemProps {
  comment: PlaybookComment;
  onResolve?: (commentId: string) => void;
  onDelete?: (commentId: string) => void;
  onEdit?: (commentId: string, content: string) => void;
  onReply?: (commentId: string, content: string) => void;
}

// ============================================================================
// Helper Functions
// ============================================================================

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));

  if (diffInMinutes < 1) return 'agora';
  if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;
  if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
  return `${Math.floor(diffInMinutes / 1440)}d atrás`;
};

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map(n => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
};

// ============================================================================
// Comment Item Component
// ============================================================================

const CommentItem: React.FC<CommentItemProps> = ({
  comment,
  onResolve,
  onDelete,
  onEdit,
  onReply
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isReplying, setIsReplying] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const [replyContent, setReplyContent] = useState('');

  const handleSaveEdit = () => {
    if (editContent.trim() && onEdit) {
      onEdit(comment.id, editContent.trim());
      setIsEditing(false);
    }
  };

  const handleSaveReply = () => {
    if (replyContent.trim() && onReply) {
      onReply(comment.id, replyContent.trim());
      setReplyContent('');
      setIsReplying(false);
    }
  };

  return (
    <div className={cn(
      'p-3 rounded-lg border space-y-3',
      comment.isResolved ? 'bg-muted/50 opacity-75' : 'bg-background'
    )}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Avatar className="h-6 w-6">
            <AvatarImage src={comment.createdBy.avatar} alt={comment.createdBy.name} />
            <AvatarFallback className="text-xs">
              {getInitials(comment.createdBy.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium">{comment.createdBy.name}</span>
            <span className="text-xs text-muted-foreground">
              {formatTimeAgo(comment.createdAt)}
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {comment.isResolved && (
            <Badge variant="secondary" className="h-5">
              <CheckCircle className="h-3 w-3 mr-1" />
              Resolvido
            </Badge>
          )}
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {!comment.isResolved && onResolve && (
                <DropdownMenuItem onClick={() => onResolve(comment.id)}>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Marcar como resolvido
                </DropdownMenuItem>
              )}
              {onReply && (
                <DropdownMenuItem onClick={() => setIsReplying(true)}>
                  <Reply className="h-4 w-4 mr-2" />
                  Responder
                </DropdownMenuItem>
              )}
              {onEdit && (
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Edit3 className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              {onDelete && (
                <DropdownMenuItem 
                  onClick={() => onDelete(comment.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Deletar
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Content */}
      <div className="space-y-2">
        {isEditing ? (
          <div className="space-y-2">
            <Textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Editar comentário..."
              className="min-h-16"
            />
            <div className="flex gap-2 justify-end">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setIsEditing(false)}
              >
                Cancelar
              </Button>
              <Button size="sm" onClick={handleSaveEdit}>
                Salvar
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-sm text-foreground whitespace-pre-wrap">
            {comment.content}
          </p>
        )}
      </div>

      {/* Replies */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="pl-4 border-l-2 border-muted space-y-2">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onResolve={onResolve}
              onDelete={onDelete}
              onEdit={onEdit}
            />
          ))}
        </div>
      )}

      {/* Reply Form */}
      {isReplying && (
        <div className="pl-4 border-l-2 border-muted space-y-2">
          <Textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder="Escrever resposta..."
            className="min-h-16"
          />
          <div className="flex gap-2 justify-end">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setIsReplying(false)}
            >
              Cancelar
            </Button>
            <Button size="sm" onClick={handleSaveReply}>
              <Send className="h-3 w-3 mr-1" />
              Responder
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// Add Comment Form Component
// ============================================================================

const AddCommentForm: React.FC<AddCommentFormProps> = ({
  onSubmit,
  isLoading = false
}) => {
  const [content, setContent] = useState('');
  const [blockId, setBlockId] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleSubmit = () => {
    if (content.trim() && blockId.trim()) {
      onSubmit(blockId.trim(), content.trim());
      setContent('');
      setBlockId('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Novo Comentário
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          placeholder="ID do bloco"
          value={blockId}
          onChange={(e) => setBlockId(e.target.value)}
        />
        <Textarea
          ref={textareaRef}
          placeholder="Escrever comentário..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          className="min-h-20"
        />
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            Ctrl/Cmd + Enter para enviar
          </span>
          <Button
            onClick={handleSubmit}
            disabled={!content.trim() || !blockId.trim() || isLoading}
            size="sm"
          >
            <Send className="h-3 w-3 mr-1" />
            {isLoading ? 'Enviando...' : 'Comentar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// Main Comment Panel Component
// ============================================================================

export const CommentPanel: React.FC<CommentPanelProps> = ({
  playbookId,
  comments,
  onAddComment,
  isLoading = false
}) => {
  const [filter, setFilter] = useState<'all' | 'unresolved' | 'resolved'>('unresolved');

  // Organize comments
  const { unresolvedComments, resolvedComments, totalCount } = useMemo(() => {
    const unresolved = comments.filter(comment => !comment.isResolved);
    const resolved = comments.filter(comment => comment.isResolved);
    
    return {
      unresolvedComments: unresolved,
      resolvedComments: resolved,
      totalCount: comments.length
    };
  }, [comments]);

  const filteredComments = useMemo(() => {
    switch (filter) {
      case 'unresolved':
        return unresolvedComments;
      case 'resolved':
        return resolvedComments;
      default:
        return comments;
    }
  }, [filter, comments, unresolvedComments, resolvedComments]);

  return (
    <div className="w-full h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            Comentários
          </h3>
          <Badge variant="secondary">
            {totalCount}
          </Badge>
        </div>
        
        {/* Filter Tabs */}
        <div className="flex rounded-lg border p-1">
          <button
            className={cn(
              'flex-1 px-3 py-1 text-xs font-medium rounded transition-colors',
              filter === 'unresolved'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={() => setFilter('unresolved')}
          >
            Não resolvidos ({unresolvedComments.length})
          </button>
          <button
            className={cn(
              'flex-1 px-3 py-1 text-xs font-medium rounded transition-colors',
              filter === 'resolved'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={() => setFilter('resolved')}
          >
            Resolvidos ({resolvedComments.length})
          </button>
          <button
            className={cn(
              'flex-1 px-3 py-1 text-xs font-medium rounded transition-colors',
              filter === 'all'
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:text-foreground'
            )}
            onClick={() => setFilter('all')}
          >
            Todos ({totalCount})
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col min-h-0">
        <ScrollArea className="flex-1">
          <div className="p-4 space-y-4">
            {/* Add Comment Form */}
            <AddCommentForm
              onSubmit={onAddComment}
              isLoading={isLoading}
            />
            
            <Separator />
            
            {/* Comments List */}
            {filteredComments.length > 0 ? (
              <div className="space-y-3">
                {filteredComments.map((comment) => (
                  <CommentItem
                    key={comment.id}
                    comment={comment}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                <h4 className="font-medium text-muted-foreground mb-1">
                  {filter === 'unresolved' 
                    ? 'Nenhum comentário não resolvido'
                    : filter === 'resolved'
                    ? 'Nenhum comentário resolvido'
                    : 'Nenhum comentário'
                  }
                </h4>
                <p className="text-sm text-muted-foreground">
                  {filter === 'all' && 'Adicione o primeiro comentário ao playbook'}
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default CommentPanel;