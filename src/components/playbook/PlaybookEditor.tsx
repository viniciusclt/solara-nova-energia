// ============================================================================
// PlaybookEditor - Editor principal de playbooks estilo Notion
// ============================================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Badge
} from '@/components/ui/badge';
import {
  Separator
} from '@/components/ui/separator';
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  ScrollArea
} from '@/components/ui/scroll-area';
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from '@/components/ui/avatar';
import {
  Plus,
  Save,
  Share2,
  Settings,
  Eye,
  EyeOff,
  MessageSquare,
  History,
  Users,
  MoreHorizontal,
  GripVertical,
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Image,
  Video,
  File,
  Link,
  Table,
  Minus,
  AlertCircle,
  Lightbulb,
  ChevronDown,
  ChevronRight,
  Trash2,
  Copy,
  Move,
  Edit3
} from 'lucide-react';
import { toast } from 'sonner';
import {
  PlaybookEditorProps,
  PlaybookBlockType,
  PlaybookBlock,
  PlaybookStatus,
  PlaybookCategory,
  PlaybookAccessLevel
} from '@/types/playbook';
import {
  usePlaybookEditor,
  usePlaybookComments,
  usePlaybookCollaboration
} from '@/hooks/usePlaybook';
import { BlockEditor } from './BlockEditor';
import { CommentPanel } from './CommentPanel';
import { HistoryPanel } from './HistoryPanel';
import { CollaborationPanel } from './CollaborationPanel';

/**
 * Editor principal de playbooks estilo Notion
 */
export const PlaybookEditor: React.FC<PlaybookEditorProps> = ({
  playbookId,
  initialData,
  readOnly = false,
  showToolbar = true,
  showSidebar = true,
  onSave,
  onPublish,
  onShare,
  className
}) => {
  // Hooks
  const {
    playbook,
    blocks,
    editorState,
    autoSaveEnabled,
    lastSaved,
    isLoading,
    createBlock,
    updateBlock,
    deleteBlock,
    moveBlock,
    duplicateBlock,
    selectBlock,
    startEditing,
    stopEditing,
    toggleComments,
    toggleHistory,
    setAutoSaveEnabled,
    isCreatingBlock,
    isUpdatingBlock,
    isDeletingBlock,
    isMovingBlock
  } = usePlaybookEditor(playbookId);

  const {
    comments,
    commentsByBlock,
    unresolvedCount,
    addComment,
    isAddingComment
  } = usePlaybookComments(playbookId || '');

  const {
    collaborators,
    addCollaborator,
    removeCollaborator,
    updateRole,
    isAddingCollaborator
  } = usePlaybookCollaboration(playbookId || '');

  // Local state
  const [title, setTitle] = useState(playbook?.title || initialData?.title || '');
  const [description, setDescription] = useState(playbook?.description || initialData?.description || '');
  const [status, setStatus] = useState<PlaybookStatus>(playbook?.status || 'draft');
  const [category, setCategory] = useState<PlaybookCategory>(playbook?.category || 'other');
  const [accessLevel, setAccessLevel] = useState<PlaybookAccessLevel>(playbook?.accessLevel || 'private');
  const [tags, setTags] = useState<string[]>(playbook?.tags || []);
  const [newTag, setNewTag] = useState('');
  const [showBlockMenu, setShowBlockMenu] = useState(false);
  const [blockMenuPosition, setBlockMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedBlockIndex, setSelectedBlockIndex] = useState<number | null>(null);

  // Refs
  const editorRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);

  // Update local state when playbook data changes
  useEffect(() => {
    if (playbook) {
      setTitle(playbook.title);
      setDescription(playbook.description || '');
      setStatus(playbook.status);
      setCategory(playbook.category);
      setAccessLevel(playbook.accessLevel);
      setTags(playbook.tags);
    }
  }, [playbook]);

  // Auto-focus title on new playbook
  useEffect(() => {
    if (!playbookId && titleRef.current) {
      titleRef.current.focus();
    }
  }, [playbookId]);

  // Block type options
  const blockTypes = [
    { type: 'paragraph', icon: Type, label: 'Parágrafo', description: 'Texto simples' },
    { type: 'heading_1', icon: Heading1, label: 'Título 1', description: 'Título principal' },
    { type: 'heading_2', icon: Heading2, label: 'Título 2', description: 'Subtítulo' },
    { type: 'heading_3', icon: Heading3, label: 'Título 3', description: 'Título menor' },
    { type: 'bulleted_list_item', icon: List, label: 'Lista', description: 'Lista com marcadores' },
    { type: 'numbered_list_item', icon: ListOrdered, label: 'Lista numerada', description: 'Lista ordenada' },
    { type: 'to_do', icon: CheckSquare, label: 'To-do', description: 'Lista de tarefas' },
    { type: 'toggle', icon: ChevronRight, label: 'Toggle', description: 'Conteúdo recolhível' },
    { type: 'quote', icon: Quote, label: 'Citação', description: 'Texto em destaque' },
    { type: 'code', icon: Code, label: 'Código', description: 'Bloco de código' },
    { type: 'callout', icon: Lightbulb, label: 'Callout', description: 'Caixa de destaque' },
    { type: 'divider', icon: Minus, label: 'Divisor', description: 'Linha separadora' },
    { type: 'image', icon: Image, label: 'Imagem', description: 'Inserir imagem' },
    { type: 'video', icon: Video, label: 'Vídeo', description: 'Inserir vídeo' },
    { type: 'file', icon: File, label: 'Arquivo', description: 'Anexar arquivo' },
    { type: 'bookmark', icon: Link, label: 'Bookmark', description: 'Link com preview' },
    { type: 'table', icon: Table, label: 'Tabela', description: 'Inserir tabela' }
  ] as const;

  // Handlers
  const handleSave = useCallback(async () => {
    if (!onSave) return;
    
    try {
      await onSave({
        title,
        description,
        status,
        category,
        accessLevel,
        tags
      });
      toast.success('Playbook salvo com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar playbook');
    }
  }, [title, description, status, category, accessLevel, tags, onSave]);

  const handlePublish = useCallback(async () => {
    if (!onPublish) return;
    
    try {
      await onPublish();
      setStatus('published');
      toast.success('Playbook publicado com sucesso!');
    } catch (error) {
      toast.error('Erro ao publicar playbook');
    }
  }, [onPublish]);

  const handleShare = useCallback(async () => {
    if (!onShare) return;
    
    try {
      await onShare();
      toast.success('Link de compartilhamento copiado!');
    } catch (error) {
      toast.error('Erro ao compartilhar playbook');
    }
  }, [onShare]);

  const handleAddTag = useCallback(() => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags(prev => [...prev, newTag.trim()]);
      setNewTag('');
    }
  }, [newTag, tags]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  }, []);

  const handleAddBlock = useCallback((type: PlaybookBlockType, index?: number) => {
    createBlock(type, index);
    setShowBlockMenu(false);
  }, [createBlock]);

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    
    const sourceIndex = result.source.index;
    const destinationIndex = result.destination.index;
    
    if (sourceIndex === destinationIndex) return;
    
    const sourceBlock = blocks[sourceIndex];
    const destinationBlock = blocks[destinationIndex];
    
    if (sourceBlock && destinationBlock) {
      const position = sourceIndex < destinationIndex ? 'after' : 'before';
      moveBlock(sourceBlock.id, destinationBlock.id, position);
    }
  }, [blocks, moveBlock]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent) => {
    // Ctrl/Cmd + S for save
    if ((event.ctrlKey || event.metaKey) && event.key === 's') {
      event.preventDefault();
      handleSave();
    }
    
    // Ctrl/Cmd + Enter for publish
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault();
      handlePublish();
    }
    
    // / for block menu
    if (event.key === '/' && editorState.isEditing) {
      event.preventDefault();
      setShowBlockMenu(true);
      // Position menu at cursor
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setBlockMenuPosition({ x: rect.left, y: rect.bottom });
      }
    }
  }, [editorState.isEditing, handleSave, handlePublish]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className={`playbook-editor flex h-full ${className || ''}`} onKeyDown={handleKeyDown}>
      {/* Main Editor */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Toolbar */}
        {showToolbar && (
          <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
            <div className="flex items-center justify-between p-4">
              <div className="flex items-center gap-2">
                {/* Status Badge */}
                <Badge variant={status === 'published' ? 'default' : 'secondary'}>
                  {status === 'published' ? 'Publicado' : 'Rascunho'}
                </Badge>
                
                {/* Auto-save indicator */}
                {autoSaveEnabled && lastSaved && (
                  <span className="text-xs text-muted-foreground">
                    Salvo {new Date(lastSaved).toLocaleTimeString()}
                  </span>
                )}
                
                {/* Collaborators */}
                <div className="flex -space-x-2">
                  {collaborators.slice(0, 3).map((collaborator) => (
                    <TooltipProvider key={collaborator.id}>
                      <Tooltip>
                        <TooltipTrigger>
                          <Avatar className="h-6 w-6 border-2 border-background">
                            <AvatarImage src={collaborator.avatar} />
                            <AvatarFallback className="text-xs">
                              {collaborator.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>{collaborator.name} ({collaborator.role})</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  ))}
                  {collaborators.length > 3 && (
                    <div className="h-6 w-6 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs">
                      +{collaborators.length - 3}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {/* Comments toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleComments}
                  className={editorState.showComments ? 'bg-accent' : ''}
                >
                  <MessageSquare className="h-4 w-4" />
                  {unresolvedCount > 0 && (
                    <Badge variant="destructive" className="ml-1 h-4 w-4 p-0 text-xs">
                      {unresolvedCount}
                    </Badge>
                  )}
                </Button>
                
                {/* History toggle */}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleHistory}
                  className={editorState.showHistory ? 'bg-accent' : ''}
                >
                  <History className="h-4 w-4" />
                </Button>
                
                {/* Share */}
                <Button variant="ghost" size="sm" onClick={handleShare}>
                  <Share2 className="h-4 w-4" />
                </Button>
                
                {/* Save */}
                <Button variant="ghost" size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4" />
                </Button>
                
                {/* Publish */}
                {status === 'draft' ? (
                  <Button size="sm" onClick={handlePublish}>
                    <Eye className="h-4 w-4 mr-2" />
                    Publicar
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setStatus('draft')}>
                    <EyeOff className="h-4 w-4 mr-2" />
                    Despublicar
                  </Button>
                )}
                
                {/* Settings */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">
                      <Settings className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => setAutoSaveEnabled(!autoSaveEnabled)}>
                      {autoSaveEnabled ? 'Desativar' : 'Ativar'} salvamento automático
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Users className="h-4 w-4 mr-2" />
                      Gerenciar colaboradores
                    </DropdownMenuItem>
                    <DropdownMenuItem>
                      <Settings className="h-4 w-4 mr-2" />
                      Configurações do playbook
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>
        )}
        
        {/* Editor Content */}
        <div className="flex-1 overflow-hidden">
          <div className="h-full flex">
            {/* Main Content */}
            <div className="flex-1 overflow-y-auto">
              <div className="max-w-4xl mx-auto p-6" ref={editorRef}>
                {/* Header */}
                <div className="mb-8">
                  {/* Title */}
                  <Input
                    ref={titleRef}
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Título do playbook..."
                    className="text-3xl font-bold border-none p-0 h-auto bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                    readOnly={readOnly}
                  />
                  
                  {/* Description */}
                  <Textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Adicione uma descrição..."
                    className="mt-2 text-muted-foreground border-none p-0 bg-transparent resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
                    rows={2}
                    readOnly={readOnly}
                  />
                  
                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-4 mt-4">
                    {/* Category */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Categoria:</span>
                      <Select value={category} onValueChange={(value: PlaybookCategory) => setCategory(value)} disabled={readOnly}>
                        <SelectTrigger className="w-auto h-auto border-none p-0 bg-transparent">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="process">Processo</SelectItem>
                          <SelectItem value="training">Treinamento</SelectItem>
                          <SelectItem value="documentation">Documentação</SelectItem>
                          <SelectItem value="template">Template</SelectItem>
                          <SelectItem value="guide">Guia</SelectItem>
                          <SelectItem value="other">Outro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Access Level */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Acesso:</span>
                      <Select value={accessLevel} onValueChange={(value: PlaybookAccessLevel) => setAccessLevel(value)} disabled={readOnly}>
                        <SelectTrigger className="w-auto h-auto border-none p-0 bg-transparent">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="private">Privado</SelectItem>
                          <SelectItem value="company">Empresa</SelectItem>
                          <SelectItem value="public">Público</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Tags */}
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">Tags:</span>
                      <div className="flex flex-wrap gap-1">
                        {tags.map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">
                            {tag}
                            {!readOnly && (
                              <button
                                onClick={() => handleRemoveTag(tag)}
                                className="ml-1 hover:text-destructive"
                              >
                                ×
                              </button>
                            )}
                          </Badge>
                        ))}
                        {!readOnly && (
                          <div className="flex items-center gap-1">
                            <Input
                              value={newTag}
                              onChange={(e) => setNewTag(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && handleAddTag()}
                              placeholder="Nova tag..."
                              className="w-20 h-6 text-xs border-none p-1 bg-transparent"
                            />
                            <Button size="sm" variant="ghost" onClick={handleAddTag} className="h-6 w-6 p-0">
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                
                <Separator className="mb-8" />
                
                {/* Blocks */}
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="blocks">
                    {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                        {blocks.map((block, index) => (
                          <Draggable key={block.id} draggableId={block.id} index={index} isDragDisabled={readOnly}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className={`group relative ${snapshot.isDragging ? 'opacity-50' : ''}`}
                              >
                                {/* Drag Handle */}
                                {!readOnly && (
                                  <div
                                    {...provided.dragHandleProps}
                                    className="absolute left-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing z-10 p-1"
                                  >
                                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                                  </div>
                                )}
                                
                                {/* Block Content */}
                                <div className={`${!readOnly ? 'ml-6' : ''}`}>
                                  <BlockEditor
                                    block={block}
                                    isSelected={editorState.selectedBlockId === block.id}
                                    isEditing={editorState.isEditing}
                                    readOnly={readOnly}
                                    comments={commentsByBlock.get(block.id) || []}
                                    onUpdate={(data) => updateBlock(block.id, data)}
                                    onDelete={() => deleteBlock(block.id)}
                                    onDuplicate={() => duplicateBlock(block.id)}
                                    onSelect={() => selectBlock(block.id)}
                                    onStartEditing={startEditing}
                                    onStopEditing={stopEditing}
                                    onAddComment={(content) => addComment({ blockId: block.id, content })}
                                  />
                                </div>
                                
                                {/* Add Block Button */}
                                {!readOnly && index === blocks.length - 1 && (
                                  <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={() => {
                                        setSelectedBlockIndex(index + 1);
                                        setShowBlockMenu(true);
                                      }}
                                      className="w-full justify-start text-muted-foreground"
                                    >
                                      <Plus className="h-4 w-4 mr-2" />
                                      Adicionar bloco
                                    </Button>
                                  </div>
                                )}
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                        
                        {/* Empty state */}
                        {blocks.length === 0 && !readOnly && (
                          <div className="text-center py-12">
                            <div className="text-muted-foreground mb-4">
                              Comece escrevendo ou pressione <kbd className="px-2 py-1 bg-muted rounded text-xs">/</kbd> para ver opções
                            </div>
                            <Button
                              variant="outline"
                              onClick={() => handleAddBlock('paragraph')}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Adicionar primeiro bloco
                            </Button>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              </div>
            </div>
            
            {/* Sidebar */}
            {showSidebar && (
              <div className="w-80 border-l bg-muted/30">
                {editorState.showComments && (
                  <CommentPanel
                    playbookId={playbookId || ''}
                    comments={comments}
                    onAddComment={addComment}
                    isLoading={isAddingComment}
                  />
                )}
                
                {editorState.showHistory && (
                  <HistoryPanel playbookId={playbookId || ''} />
                )}
                
                {!editorState.showComments && !editorState.showHistory && (
                  <CollaborationPanel
                    playbookId={playbookId || ''}
                    collaborators={collaborators}
                    onAddCollaborator={addCollaborator}
                    onRemoveCollaborator={removeCollaborator}
                    onUpdateRole={updateRole}
                    isLoading={isAddingCollaborator}
                  />
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Block Menu */}
      {showBlockMenu && (
        <Dialog open={showBlockMenu} onOpenChange={setShowBlockMenu}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar bloco</DialogTitle>
              <DialogDescription>
                Escolha o tipo de bloco que deseja adicionar
              </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-96">
              <div className="space-y-1">
                {blockTypes.map(({ type, icon: Icon, label, description }) => (
                  <Button
                    key={type}
                    variant="ghost"
                    className="w-full justify-start h-auto p-3"
                    onClick={() => handleAddBlock(type as PlaybookBlockType, selectedBlockIndex || undefined)}
                  >
                    <Icon className="h-4 w-4 mr-3 flex-shrink-0" />
                    <div className="text-left">
                      <div className="font-medium">{label}</div>
                      <div className="text-xs text-muted-foreground">{description}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default PlaybookEditor;