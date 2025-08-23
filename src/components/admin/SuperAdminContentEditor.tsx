// ============================================================================
// SuperAdminContentEditor - Editor de conteúdo avançado estilo Notion para Super Admin
// Sistema de Treinamentos Corporativos - Solara Nova Energia
// Versão: 1.0
// Data: 2024-12-12
// ============================================================================

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Image,
  Video,
  FileText,
  Plus,
  GripVertical,
  Trash2,
  Bold,
  Italic,
  Underline,
  Link,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Table,
  Calendar,
  BarChart3,
  CheckSquare,
  AlertTriangle,
  Info,
  Lightbulb,
  Zap,
  Users,
  Settings,
  Eye,
  EyeOff,
  Save,
  Download,
  Upload,
  Copy,
  Palette,
  Layout,
  Columns,
  Separator,
  Hash,
  AtSign,
  Globe,
  Lock,
  Unlock,
  Star,
  Heart,
  MessageSquare,
  Bell,
  Clock,
  Target,
  Award,
  BookOpen,
  PlayCircle,
  PauseCircle,
  SkipForward,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCw,
  RefreshCw,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  MoreHorizontal,
  ChevronDown,
  ChevronRight,
  X,
  Check,
  Edit,
  Share,
  ExternalLink,
  Database,
  Folder,
  Tag,
  Flag,
  Bookmark,
  Archive,
  Trash,
  History,
  GitBranch,
  GitCommit,
  GitMerge
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Badge } from '../ui/badge';
import { Switch } from '../ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Separator as UISeparator } from '../ui/separator';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { ScrollArea } from '../ui/scroll-area';
import { Slider } from '../ui/slider';
import { Checkbox } from '../ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Progress } from '../ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { toast } from 'sonner';

// ============================================================================
// INTERFACES E TIPOS
// ============================================================================

interface BlockMetadata {
  url?: string;
  alt?: string;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  language?: string;
  color?: string;
  backgroundColor?: string;
  fontSize?: number;
  fontWeight?: 'normal' | 'bold' | 'light';
  fontStyle?: 'normal' | 'italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
  width?: number;
  height?: number;
  columns?: number;
  rows?: number;
  headers?: string[];
  data?: any[];
  chartType?: 'bar' | 'line' | 'pie' | 'area';
  chartData?: any[];
  calloutType?: 'info' | 'warning' | 'error' | 'success' | 'note';
  collapsed?: boolean;
  checked?: boolean;
  level?: number;
  permissions?: {
    read: string[];
    write: string[];
    admin: string[];
  };
  tags?: string[];
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  status?: 'draft' | 'review' | 'approved' | 'published' | 'archived';
  version?: string;
  author?: string;
  createdAt?: string;
  updatedAt?: string;
  comments?: Comment[];
  attachments?: Attachment[];
}

interface Comment {
  id: string;
  author: string;
  content: string;
  createdAt: string;
  resolved?: boolean;
}

interface Attachment {
  id: string;
  name: string;
  url: string;
  type: string;
  size: number;
}

type BlockType = 
  // Texto
  | 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'heading4' | 'heading5' | 'heading6'
  // Listas
  | 'bulletList' | 'numberedList' | 'todoList' | 'toggleList'
  // Formatação
  | 'quote' | 'code' | 'callout' | 'divider'
  // Mídia
  | 'image' | 'video' | 'audio' | 'file' | 'embed'
  // Dados
  | 'table' | 'database' | 'chart' | 'calendar' | 'kanban'
  // Layout
  | 'columns' | 'column' | 'accordion' | 'tabs' | 'card'
  // Interativo
  | 'button' | 'form' | 'survey' | 'quiz' | 'poll'
  // Avançado
  | 'template' | 'bookmark' | 'linkPreview' | 'breadcrumb' | 'tableOfContents'
  // Admin
  | 'permissions' | 'workflow' | 'approval' | 'analytics' | 'audit';

interface Block {
  id: string;
  type: BlockType;
  content: string;
  metadata?: BlockMetadata;
  children?: Block[];
  parentId?: string;
}

interface SuperAdminContentEditorProps {
  initialContent?: Block[];
  onChange?: (blocks: Block[]) => void;
  onSave?: (blocks: Block[]) => Promise<void>;
  readOnly?: boolean;
  showAdvancedFeatures?: boolean;
  permissions?: {
    canEdit: boolean;
    canDelete: boolean;
    canPublish: boolean;
    canManagePermissions: boolean;
  };
  currentUser?: {
    id: string;
    name: string;
    role: string;
    avatar?: string;
  };
}

// ============================================================================
// CONFIGURAÇÕES DE BLOCOS
// ============================================================================

const BLOCK_CATEGORIES = {
  text: {
    label: 'Texto',
    icon: Type,
    blocks: [
      { type: 'paragraph', icon: Type, label: 'Parágrafo', description: 'Texto simples' },
      { type: 'heading1', icon: Heading1, label: 'Título 1', description: 'Título principal' },
      { type: 'heading2', icon: Heading2, label: 'Título 2', description: 'Subtítulo' },
      { type: 'heading3', icon: Heading3, label: 'Título 3', description: 'Título menor' },
      { type: 'quote', icon: Quote, label: 'Citação', description: 'Bloco de citação' },
      { type: 'code', icon: Code, label: 'Código', description: 'Bloco de código' },
    ]
  },
  lists: {
    label: 'Listas',
    icon: List,
    blocks: [
      { type: 'bulletList', icon: List, label: 'Lista', description: 'Lista com marcadores' },
      { type: 'numberedList', icon: ListOrdered, label: 'Lista Numerada', description: 'Lista ordenada' },
      { type: 'todoList', icon: CheckSquare, label: 'Lista de Tarefas', description: 'Lista com checkboxes' },
      { type: 'toggleList', icon: ChevronRight, label: 'Lista Expansível', description: 'Lista com itens expansíveis' },
    ]
  },
  media: {
    label: 'Mídia',
    icon: Image,
    blocks: [
      { type: 'image', icon: Image, label: 'Imagem', description: 'Inserir imagem' },
      { type: 'video', icon: Video, label: 'Vídeo', description: 'Inserir vídeo' },
      { type: 'audio', icon: Volume2, label: 'Áudio', description: 'Inserir áudio' },
      { type: 'file', icon: FileText, label: 'Arquivo', description: 'Anexar arquivo' },
      { type: 'embed', icon: Globe, label: 'Embed', description: 'Conteúdo incorporado' },
    ]
  },
  data: {
    label: 'Dados',
    icon: Database,
    blocks: [
      { type: 'table', icon: Table, label: 'Tabela', description: 'Tabela de dados' },
      { type: 'database', icon: Database, label: 'Base de Dados', description: 'Base de dados estruturada' },
      { type: 'chart', icon: BarChart3, label: 'Gráfico', description: 'Gráfico de dados' },
      { type: 'calendar', icon: Calendar, label: 'Calendário', description: 'Visualização de calendário' },
      { type: 'kanban', icon: Layout, label: 'Kanban', description: 'Quadro Kanban' },
    ]
  },
  layout: {
    label: 'Layout',
    icon: Layout,
    blocks: [
      { type: 'columns', icon: Columns, label: 'Colunas', description: 'Layout em colunas' },
      { type: 'accordion', icon: ChevronDown, label: 'Acordeão', description: 'Conteúdo expansível' },
      { type: 'tabs', icon: Folder, label: 'Abas', description: 'Conteúdo em abas' },
      { type: 'card', icon: Layout, label: 'Card', description: 'Cartão de conteúdo' },
      { type: 'divider', icon: Separator, label: 'Divisor', description: 'Linha divisória' },
    ]
  },
  interactive: {
    label: 'Interativo',
    icon: Zap,
    blocks: [
      { type: 'button', icon: Zap, label: 'Botão', description: 'Botão interativo' },
      { type: 'form', icon: FileText, label: 'Formulário', description: 'Formulário de entrada' },
      { type: 'survey', icon: MessageSquare, label: 'Pesquisa', description: 'Pesquisa de opinião' },
      { type: 'quiz', icon: Target, label: 'Quiz', description: 'Quiz interativo' },
      { type: 'poll', icon: BarChart3, label: 'Enquete', description: 'Enquete rápida' },
    ]
  },
  advanced: {
    label: 'Avançado',
    icon: Settings,
    blocks: [
      { type: 'template', icon: Copy, label: 'Template', description: 'Modelo reutilizável' },
      { type: 'bookmark', icon: Bookmark, label: 'Bookmark', description: 'Link com preview' },
      { type: 'linkPreview', icon: ExternalLink, label: 'Preview de Link', description: 'Preview automático de link' },
      { type: 'breadcrumb', icon: Hash, label: 'Breadcrumb', description: 'Trilha de navegação' },
      { type: 'tableOfContents', icon: BookOpen, label: 'Índice', description: 'Sumário automático' },
    ]
  },
  admin: {
    label: 'Administração',
    icon: Lock,
    blocks: [
      { type: 'permissions', icon: Lock, label: 'Permissões', description: 'Controle de acesso' },
      { type: 'workflow', icon: GitBranch, label: 'Workflow', description: 'Fluxo de trabalho' },
      { type: 'approval', icon: Check, label: 'Aprovação', description: 'Sistema de aprovação' },
      { type: 'analytics', icon: BarChart3, label: 'Analytics', description: 'Métricas e análises' },
      { type: 'audit', icon: History, label: 'Auditoria', description: 'Log de atividades' },
    ]
  },
  callouts: {
    label: 'Destaques',
    icon: Lightbulb,
    blocks: [
      { type: 'callout', icon: Info, label: 'Informação', description: 'Caixa de informação', metadata: { calloutType: 'info' } },
      { type: 'callout', icon: AlertTriangle, label: 'Aviso', description: 'Caixa de aviso', metadata: { calloutType: 'warning' } },
      { type: 'callout', icon: X, label: 'Erro', description: 'Caixa de erro', metadata: { calloutType: 'error' } },
      { type: 'callout', icon: Check, label: 'Sucesso', description: 'Caixa de sucesso', metadata: { calloutType: 'success' } },
      { type: 'callout', icon: Lightbulb, label: 'Nota', description: 'Caixa de nota', metadata: { calloutType: 'note' } },
    ]
  }
};

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

const SuperAdminContentEditor: React.FC<SuperAdminContentEditorProps> = ({
  initialContent = [],
  onChange,
  onSave,
  readOnly = false,
  showAdvancedFeatures = true,
  permissions = {
    canEdit: true,
    canDelete: true,
    canPublish: true,
    canManagePermissions: true
  },
  currentUser = {
    id: '1',
    name: 'Super Admin',
    role: 'super_admin',
    avatar: ''
  }
}) => {
  // Estados principais
  const [blocks, setBlocks] = useState<Block[]>(
    initialContent.length > 0 ? initialContent : [
      { id: generateId(), type: 'paragraph', content: '' }
    ]
  );
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [showBlockMenu, setShowBlockMenu] = useState<string | null>(null);
  const [selectedBlocks, setSelectedBlocks] = useState<string[]>([]);
  const [isMultiSelect, setIsMultiSelect] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  
  // Estados de UI
  const [showToolbar, setShowToolbar] = useState(true);
  const [showSidebar, setShowSidebar] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showVersionHistory, setShowVersionHistory] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Estados de edição
  const [isEditing, setIsEditing] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  
  // Estados de colaboração
  const [collaborators, setCollaborators] = useState<any[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  
  // Refs
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ============================================================================
  // FUNÇÕES UTILITÁRIAS
  // ============================================================================

  function generateId(): string {
    return Math.random().toString(36).substr(2, 9);
  }

  const updateBlocks = useCallback((newBlocks: Block[]) => {
    setBlocks(newBlocks);
    setHasUnsavedChanges(true);
    if (onChange) {
      onChange(newBlocks);
    }
  }, [onChange]);

  // ============================================================================
  // FUNÇÕES DE MANIPULAÇÃO DE BLOCOS
  // ============================================================================

  const addBlock = useCallback((afterId: string, type: BlockType = 'paragraph', metadata?: BlockMetadata) => {
    const newBlock: Block = {
      id: generateId(),
      type,
      content: '',
      metadata: metadata || {}
    };

    const index = blocks.findIndex(block => block.id === afterId);
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    updateBlocks(newBlocks);
    setActiveBlockId(newBlock.id);
    setShowBlockMenu(null);
  }, [blocks, updateBlocks]);

  const updateBlock = useCallback((id: string, updates: Partial<Block>) => {
    const newBlocks = blocks.map(block => 
      block.id === id ? { ...block, ...updates } : block
    );
    updateBlocks(newBlocks);
  }, [blocks, updateBlocks]);

  const deleteBlock = useCallback((id: string) => {
    if (blocks.length === 1) return;
    const newBlocks = blocks.filter(block => block.id !== id);
    updateBlocks(newBlocks);
  }, [blocks, updateBlocks]);

  const duplicateBlock = useCallback((id: string) => {
    const blockToDuplicate = blocks.find(block => block.id === id);
    if (!blockToDuplicate) return;

    const duplicatedBlock: Block = {
      ...blockToDuplicate,
      id: generateId()
    };

    const index = blocks.findIndex(block => block.id === id);
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, duplicatedBlock);
    updateBlocks(newBlocks);
  }, [blocks, updateBlocks]);

  const moveBlock = useCallback((fromIndex: number, toIndex: number) => {
    const newBlocks = [...blocks];
    const [movedBlock] = newBlocks.splice(fromIndex, 1);
    newBlocks.splice(toIndex, 0, movedBlock);
    updateBlocks(newBlocks);
  }, [blocks, updateBlocks]);

  // ============================================================================
  // FUNÇÕES DE EVENTOS
  // ============================================================================

  const handleKeyDown = useCallback((e: React.KeyboardEvent, blockId: string) => {
    if (readOnly) return;

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      addBlock(blockId);
    } else if (e.key === 'Backspace') {
      const block = blocks.find(b => b.id === blockId);
      if (block && block.content === '') {
        e.preventDefault();
        deleteBlock(blockId);
      }
    } else if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
      setShowBlockMenu(blockId);
    } else if (e.key === 's' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSave();
    }
  }, [blocks, addBlock, deleteBlock, readOnly]);

  const handleDragEnd = useCallback((result: DropResult) => {
    if (!result.destination) return;
    moveBlock(result.source.index, result.destination.index);
  }, [moveBlock]);

  // ============================================================================
  // FUNÇÕES DE SALVAMENTO E COLABORAÇÃO
  // ============================================================================

  const handleSave = useCallback(async () => {
    if (!onSave || isSaving) return;

    setIsSaving(true);
    try {
      await onSave(blocks);
      setHasUnsavedChanges(false);
      setLastSaved(new Date());
      toast.success('Conteúdo salvo com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar conteúdo');
    } finally {
      setIsSaving(false);
    }
  }, [blocks, onSave, isSaving]);

  const addComment = useCallback((blockId: string, content: string) => {
    const newComment: Comment = {
      id: generateId(),
      author: currentUser.name,
      content,
      createdAt: new Date().toISOString()
    };
    setComments(prev => [...prev, newComment]);
  }, [currentUser]);

  // ============================================================================
  // RENDERIZAÇÃO DE BLOCOS
  // ============================================================================

  const renderBlockContent = useCallback((block: Block) => {
    const commonProps = {
      className: `w-full border-none outline-none resize-none bg-transparent ${
        block.type === 'heading1' ? 'text-3xl font-bold' :
        block.type === 'heading2' ? 'text-2xl font-semibold' :
        block.type === 'heading3' ? 'text-xl font-medium' :
        block.type === 'quote' ? 'text-lg italic border-l-4 border-blue-500 pl-4 text-gray-700' :
        block.type === 'code' ? 'font-mono text-sm bg-gray-100 p-3 rounded-lg' :
        'text-base'
      } placeholder-gray-400`,
      placeholder: getBlockPlaceholder(block.type),
      value: block.content,
      onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => 
        updateBlock(block.id, { content: e.target.value }),
      onFocus: () => setActiveBlockId(block.id),
      onKeyDown: (e: React.KeyboardEvent) => handleKeyDown(e, block.id),
      disabled: readOnly
    };

    switch (block.type) {
      case 'image':
        return renderImageBlock(block);
      case 'video':
        return renderVideoBlock(block);
      case 'audio':
        return renderAudioBlock(block);
      case 'table':
        return renderTableBlock(block);
      case 'chart':
        return renderChartBlock(block);
      case 'callout':
        return renderCalloutBlock(block);
      case 'todoList':
        return renderTodoListBlock(block);
      case 'divider':
        return <hr className="my-4 border-gray-300" />;
      default:
        return (
          <textarea
            {...commonProps}
            rows={1}
            style={{ minHeight: '1.5rem' }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = target.scrollHeight + 'px';
            }}
          />
        );
    }
  }, [updateBlock, handleKeyDown, readOnly]);

  const renderBlock = useCallback((block: Block, index: number) => {
    const isActive = activeBlockId === block.id;
    const isSelected = selectedBlocks.includes(block.id);

    return (
      <Draggable key={block.id} draggableId={block.id} index={index} isDragDisabled={readOnly}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.draggableProps}
            className={`group relative flex items-start gap-2 py-2 ${
              isActive ? 'bg-blue-50 rounded-lg' : ''
            } ${
              isSelected ? 'bg-yellow-50 border-l-4 border-yellow-400' : ''
            } ${
              snapshot.isDragging ? 'shadow-lg' : ''
            }`}
          >
            {/* Drag Handle */}
            {!readOnly && (
              <div 
                {...provided.dragHandleProps}
                className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <button className="p-1 hover:bg-gray-200 rounded">
                  <GripVertical className="h-4 w-4 text-gray-400" />
                </button>
              </div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              {renderBlockContent(block)}
            </div>

            {/* Actions */}
            {!readOnly && isActive && (
              <div className="flex-shrink-0 flex items-center gap-1">
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setShowBlockMenu(block.id)}
                        className="p-1 hover:bg-gray-200 rounded"
                      >
                        <Plus className="h-4 w-4 text-gray-400" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent>Adicionar bloco</TooltipContent>
                  </Tooltip>
                </TooltipProvider>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="p-1 hover:bg-gray-200 rounded">
                      <MoreHorizontal className="h-4 w-4 text-gray-400" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => duplicateBlock(block.id)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => addComment(block.id, '')}>
                      <MessageSquare className="h-4 w-4 mr-2" />
                      Comentar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={() => deleteBlock(block.id)}
                      className="text-red-600"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Excluir
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}

            {/* Block Menu */}
            {showBlockMenu === block.id && (
              <BlockMenu
                onSelectBlock={(type, metadata) => {
                  updateBlock(block.id, { type, metadata });
                  setShowBlockMenu(null);
                }}
                onClose={() => setShowBlockMenu(null)}
                searchTerm={searchTerm}
                filterCategory={filterCategory}
                showAdvancedFeatures={showAdvancedFeatures}
              />
            )}
          </div>
        )}
      </Draggable>
    );
  }, [activeBlockId, selectedBlocks, readOnly, showBlockMenu, updateBlock, duplicateBlock, deleteBlock, addComment, searchTerm, filterCategory, showAdvancedFeatures, renderBlockContent]);

  // ============================================================================
  // FUNÇÕES DE RENDERIZAÇÃO DE BLOCOS ESPECÍFICOS
  // ============================================================================

  const renderImageBlock = (block: Block) => {
    return (
      <div className="space-y-2">
        {block.metadata?.url ? (
          <img 
            src={block.metadata.url} 
            alt={block.metadata.alt || ''}
            className="max-w-full h-auto rounded-lg"
            style={{
              textAlign: block.metadata.alignment || 'left',
              width: block.metadata.width ? `${block.metadata.width}px` : 'auto',
              height: block.metadata.height ? `${block.metadata.height}px` : 'auto'
            }}
          />
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Image className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Clique para adicionar uma imagem</p>
          </div>
        )}
        {!readOnly && (
          <div className="space-y-2">
            <Input
              type="url"
              placeholder="URL da imagem..."
              value={block.metadata?.url || ''}
              onChange={(e) => updateBlock(block.id, {
                metadata: { ...block.metadata, url: e.target.value }
              })}
            />
            <Input
              placeholder="Texto alternativo..."
              value={block.metadata?.alt || ''}
              onChange={(e) => updateBlock(block.id, {
                metadata: { ...block.metadata, alt: e.target.value }
              })}
            />
          </div>
        )}
      </div>
    );
  };

  const renderVideoBlock = (block: Block) => {
    return (
      <div className="space-y-2">
        {block.metadata?.url ? (
          <div className="aspect-video">
            <iframe
              src={block.metadata.url}
              className="w-full h-full rounded-lg"
              allowFullScreen
            />
          </div>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center aspect-video flex items-center justify-center">
            <div>
              <Video className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">Clique para adicionar um vídeo</p>
            </div>
          </div>
        )}
        {!readOnly && (
          <Input
            type="url"
            placeholder="URL do vídeo (YouTube, Vimeo...)..."
            value={block.metadata?.url || ''}
            onChange={(e) => updateBlock(block.id, {
              metadata: { ...block.metadata, url: e.target.value }
            })}
          />
        )}
      </div>
    );
  };

  const renderAudioBlock = (block: Block) => {
    return (
      <div className="space-y-2">
        {block.metadata?.url ? (
          <audio controls className="w-full">
            <source src={block.metadata.url} />
            Seu navegador não suporta o elemento de áudio.
          </audio>
        ) : (
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
            <Volume2 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Clique para adicionar um áudio</p>
          </div>
        )}
        {!readOnly && (
          <Input
            type="url"
            placeholder="URL do áudio..."
            value={block.metadata?.url || ''}
            onChange={(e) => updateBlock(block.id, {
              metadata: { ...block.metadata, url: e.target.value }
            })}
          />
        )}
      </div>
    );
  };

  const renderTableBlock = (block: Block) => {
    const headers = block.metadata?.headers || ['Coluna 1', 'Coluna 2'];
    const data = block.metadata?.data || [['', '']];

    return (
      <div className="space-y-2">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr>
                {headers.map((header, index) => (
                  <th key={index} className="border border-gray-300 p-2 bg-gray-50">
                    {!readOnly ? (
                      <Input
                        value={header}
                        onChange={(e) => {
                          const newHeaders = [...headers];
                          newHeaders[index] = e.target.value;
                          updateBlock(block.id, {
                            metadata: { ...block.metadata, headers: newHeaders }
                          });
                        }}
                        className="border-none bg-transparent"
                      />
                    ) : (
                      header
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex} className="border border-gray-300 p-2">
                      {!readOnly ? (
                        <Input
                          value={cell}
                          onChange={(e) => {
                            const newData = [...data];
                            newData[rowIndex][cellIndex] = e.target.value;
                            updateBlock(block.id, {
                              metadata: { ...block.metadata, data: newData }
                            });
                          }}
                          className="border-none bg-transparent"
                        />
                      ) : (
                        cell
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {!readOnly && (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const newData = [...data, new Array(headers.length).fill('')];
                updateBlock(block.id, {
                  metadata: { ...block.metadata, data: newData }
                });
              }}
            >
              Adicionar Linha
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                const newHeaders = [...headers, `Coluna ${headers.length + 1}`];
                const newData = data.map(row => [...row, '']);
                updateBlock(block.id, {
                  metadata: { 
                    ...block.metadata, 
                    headers: newHeaders,
                    data: newData 
                  }
                });
              }}
            >
              Adicionar Coluna
            </Button>
          </div>
        )}
      </div>
    );
  };

  const renderChartBlock = (block: Block) => {
    return (
      <div className="space-y-4">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <BarChart3 className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-gray-500">Gráfico será renderizado aqui</p>
          <p className="text-xs text-gray-400 mt-1">
            Tipo: {block.metadata?.chartType || 'bar'}
          </p>
        </div>
        {!readOnly && (
          <div className="space-y-2">
            <Select
              value={block.metadata?.chartType || 'bar'}
              onValueChange={(value) => updateBlock(block.id, {
                metadata: { ...block.metadata, chartType: value }
              })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Tipo de gráfico" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bar">Barras</SelectItem>
                <SelectItem value="line">Linha</SelectItem>
                <SelectItem value="pie">Pizza</SelectItem>
                <SelectItem value="area">Área</SelectItem>
              </SelectContent>
            </Select>
            <Textarea
              placeholder="Dados do gráfico (JSON)..."
              value={JSON.stringify(block.metadata?.chartData || [], null, 2)}
              onChange={(e) => {
                try {
                  const data = JSON.parse(e.target.value);
                  updateBlock(block.id, {
                    metadata: { ...block.metadata, chartData: data }
                  });
                } catch (error) {
                  // Ignore invalid JSON
                }
              }}
            />
          </div>
        )}
      </div>
    );
  };

  const renderCalloutBlock = (block: Block) => {
    const calloutType = block.metadata?.calloutType || 'info';
    const calloutConfig = {
      info: { icon: Info, bgColor: 'bg-blue-50', borderColor: 'border-blue-200', textColor: 'text-blue-800' },
      warning: { icon: AlertTriangle, bgColor: 'bg-yellow-50', borderColor: 'border-yellow-200', textColor: 'text-yellow-800' },
      error: { icon: X, bgColor: 'bg-red-50', borderColor: 'border-red-200', textColor: 'text-red-800' },
      success: { icon: Check, bgColor: 'bg-green-50', borderColor: 'border-green-200', textColor: 'text-green-800' },
      note: { icon: Lightbulb, bgColor: 'bg-gray-50', borderColor: 'border-gray-200', textColor: 'text-gray-800' }
    };

    const config = calloutConfig[calloutType as keyof typeof calloutConfig];
    const Icon = config.icon;

    return (
      <div className={`p-4 rounded-lg border ${config.bgColor} ${config.borderColor}`}>
        <div className="flex items-start gap-3">
          <Icon className={`h-5 w-5 mt-0.5 ${config.textColor}`} />
          <div className="flex-1">
            {!readOnly ? (
              <Textarea
                value={block.content}
                onChange={(e) => updateBlock(block.id, { content: e.target.value })}
                placeholder="Digite sua mensagem..."
                className={`border-none bg-transparent resize-none ${config.textColor} placeholder-opacity-60`}
                rows={1}
              />
            ) : (
              <p className={config.textColor}>{block.content}</p>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderTodoListBlock = (block: Block) => {
    const todos = block.metadata?.data || [{ text: '', checked: false }];

    return (
      <div className="space-y-2">
        {todos.map((todo: any, index: number) => (
          <div key={index} className="flex items-center gap-2">
            <Checkbox
              checked={todo.checked}
              onCheckedChange={(checked) => {
                const newTodos = [...todos];
                newTodos[index] = { ...todo, checked };
                updateBlock(block.id, {
                  metadata: { ...block.metadata, data: newTodos }
                });
              }}
              disabled={readOnly}
            />
            {!readOnly ? (
              <Input
                value={todo.text}
                onChange={(e) => {
                  const newTodos = [...todos];
                  newTodos[index] = { ...todo, text: e.target.value };
                  updateBlock(block.id, {
                    metadata: { ...block.metadata, data: newTodos }
                  });
                }}
                placeholder="Item da lista..."
                className={`border-none bg-transparent ${todo.checked ? 'line-through text-gray-500' : ''}`}
              />
            ) : (
              <span className={todo.checked ? 'line-through text-gray-500' : ''}>
                {todo.text}
              </span>
            )}
          </div>
        ))}
        {!readOnly && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              const newTodos = [...todos, { text: '', checked: false }];
              updateBlock(block.id, {
                metadata: { ...block.metadata, data: newTodos }
              });
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Adicionar item
          </Button>
        )}
      </div>
    );
  };

  // ============================================================================
  // FUNÇÕES AUXILIARES
  // ============================================================================

  const getBlockPlaceholder = (type: BlockType): string => {
    const placeholders: Record<BlockType, string> = {
      paragraph: 'Digite / para comandos...',
      heading1: 'Título principal...',
      heading2: 'Subtítulo...',
      heading3: 'Título...',
      heading4: 'Título...',
      heading5: 'Título...',
      heading6: 'Título...',
      bulletList: '• Item da lista...',
      numberedList: '1. Item da lista...',
      todoList: '☐ Item da tarefa...',
      toggleList: '▶ Item expansível...',
      quote: 'Citação...',
      code: 'Código...',
      callout: 'Mensagem de destaque...',
      divider: '',
      image: 'Imagem...',
      video: 'Vídeo...',
      audio: 'Áudio...',
      file: 'Arquivo...',
      embed: 'Conteúdo incorporado...',
      table: 'Tabela...',
      database: 'Base de dados...',
      chart: 'Gráfico...',
      calendar: 'Calendário...',
      kanban: 'Quadro Kanban...',
      columns: 'Colunas...',
      column: 'Coluna...',
      accordion: 'Acordeão...',
      tabs: 'Abas...',
      card: 'Card...',
      button: 'Botão...',
      form: 'Formulário...',
      survey: 'Pesquisa...',
      quiz: 'Quiz...',
      poll: 'Enquete...',
      template: 'Template...',
      bookmark: 'Bookmark...',
      linkPreview: 'Preview de link...',
      breadcrumb: 'Breadcrumb...',
      tableOfContents: 'Índice...',
      permissions: 'Permissões...',
      workflow: 'Workflow...',
      approval: 'Aprovação...',
      analytics: 'Analytics...',
      audit: 'Auditoria...'
    };
    return placeholders[type] || 'Digite aqui...';
  };

  // ============================================================================
  // COMPONENTE DE MENU DE BLOCOS
  // ============================================================================

  const BlockMenu: React.FC<{
    onSelectBlock: (type: BlockType, metadata?: BlockMetadata) => void;
    onClose: () => void;
    searchTerm: string;
    filterCategory: string;
    showAdvancedFeatures: boolean;
  }> = ({ onSelectBlock, onClose, searchTerm, filterCategory, showAdvancedFeatures }) => {
    const [localSearchTerm, setLocalSearchTerm] = useState(searchTerm);
    const [localFilterCategory, setLocalFilterCategory] = useState(filterCategory);

    const filteredCategories = Object.entries(BLOCK_CATEGORIES).filter(([key, category]) => {
      if (!showAdvancedFeatures && (key === 'admin' || key === 'advanced')) {
        return false;
      }
      if (localFilterCategory !== 'all' && key !== localFilterCategory) {
        return false;
      }
      return true;
    });

    const filteredBlocks = filteredCategories.flatMap(([categoryKey, category]) => 
      category.blocks.filter(block => 
        block.label.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
        block.description.toLowerCase().includes(localSearchTerm.toLowerCase())
      ).map(block => ({ ...block, category: categoryKey }))
    );

    return (
      <div className="absolute top-full left-8 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-80 max-h-96 overflow-hidden">
        <div className="p-3 border-b border-gray-200">
          <div className="space-y-2">
            <Input
              placeholder="Buscar blocos..."
              value={localSearchTerm}
              onChange={(e) => setLocalSearchTerm(e.target.value)}
              className="h-8"
            />
            <Select value={localFilterCategory} onValueChange={setLocalFilterCategory}>
              <SelectTrigger className="h-8">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                {Object.entries(BLOCK_CATEGORIES).map(([key, category]) => (
                  <SelectItem key={key} value={key}>{category.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <ScrollArea className="max-h-64">
          <div className="p-2">
            {filteredBlocks.length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">
                Nenhum bloco encontrado
              </p>
            ) : (
              filteredBlocks.map((block, index) => {
                const Icon = block.icon;
                return (
                  <button
                    key={`${block.category}-${block.type}-${index}`}
                    onClick={() => onSelectBlock(block.type as BlockType, block.metadata)}
                    className="w-full flex items-center gap-3 p-2 hover:bg-gray-100 rounded text-left"
                  >
                    <Icon className="h-4 w-4 text-gray-600 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{block.label}</div>
                      <div className="text-xs text-gray-500 truncate">{block.description}</div>
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {BLOCK_CATEGORIES[block.category as keyof typeof BLOCK_CATEGORIES].label}
                    </Badge>
                  </button>
                );
              })
            )}
          </div>
        </ScrollArea>
      </div>
    );
  };

  // ============================================================================
  // TOOLBAR PRINCIPAL
  // ============================================================================

  const Toolbar = () => (
    <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant={showToolbar ? "default" : "outline"}
            onClick={() => setShowToolbar(!showToolbar)}
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={showSidebar ? "default" : "outline"}
            onClick={() => setShowSidebar(!showSidebar)}
          >
            <Layout className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant={showComments ? "default" : "outline"}
            onClick={() => setShowComments(!showComments)}
          >
            <MessageSquare className="h-4 w-4" />
          </Button>
        </div>
        
        <UISeparator orientation="vertical" className="h-6" />
        
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={handleSave}
            disabled={!hasUnsavedChanges || isSaving}
          >
            {isSaving ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Save className="h-4 w-4" />
            )}
            {isSaving ? 'Salvando...' : 'Salvar'}
          </Button>
          
          {lastSaved && (
            <span className="text-xs text-gray-500">
              Salvo em {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setIsFullscreen(!isFullscreen)}
        >
          {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </Button>
        
        <Avatar className="h-8 w-8">
          <AvatarImage src={currentUser.avatar} />
          <AvatarFallback>{currentUser.name.charAt(0)}</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );

  // ============================================================================
  // RENDERIZAÇÃO PRINCIPAL
  // ============================================================================

  return (
    <TooltipProvider>
      <div className={`flex flex-col h-full ${isFullscreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
        {showToolbar && <Toolbar />}
        
        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          {showSidebar && (
            <div className="w-64 border-r border-gray-200 bg-gray-50 p-4">
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Estrutura</h3>
                  <div className="space-y-1">
                    {blocks.map((block, index) => (
                      <button
                        key={block.id}
                        onClick={() => setActiveBlockId(block.id)}
                        className={`w-full text-left p-2 rounded text-sm ${
                          activeBlockId === block.id ? 'bg-blue-100 text-blue-900' : 'hover:bg-gray-100'
                        }`}
                      >
                        {block.type} {index + 1}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <h3 className="text-sm font-medium text-gray-900 mb-2">Colaboradores</h3>
                  <div className="space-y-2">
                    {collaborators.map((collaborator) => (
                      <div key={collaborator.id} className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src={collaborator.avatar} />
                          <AvatarFallback>{collaborator.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{collaborator.name}</span>
                        <div className={`w-2 h-2 rounded-full ${
                          collaborator.status === 'online' ? 'bg-green-500' : 'bg-gray-300'
                        }`} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Editor Principal */}
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 overflow-auto">
              <div 
                ref={editorRef}
                className="max-w-4xl mx-auto p-6 bg-white min-h-full"
                onClick={() => setShowBlockMenu(null)}
              >
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="blocks">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-1"
                      >
                        {blocks.map((block, index) => renderBlock(block, index))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
                
                {!readOnly && (
                  <button
                    onClick={() => addBlock(blocks[blocks.length - 1].id)}
                    className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mt-4 p-2 hover:bg-gray-100 rounded transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Adicionar bloco
                  </button>
                )}
              </div>
            </div>
            
            {/* Painel de Comentários */}
            {showComments && (
              <div className="w-80 border-l border-gray-200 bg-gray-50 p-4">
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-900">Comentários</h3>
                  
                  <div className="space-y-3">
                    {comments.map((comment) => (
                      <div key={comment.id} className="bg-white p-3 rounded-lg shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback>{comment.author.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm font-medium">{comment.author}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(comment.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">{comment.content}</p>
                      </div>
                    ))}
                  </div>
                  
                  <div className="space-y-2">
                    <Textarea
                      placeholder="Adicionar comentário..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        if (newComment.trim()) {
                          addComment('general', newComment);
                          setNewComment('');
                        }
                      }}
                    >
                      Comentar
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};

export default SuperAdminContentEditor;
export type { Block, BlockType, BlockMetadata, SuperAdminContentEditorProps };