# EDITOR DE PLAYBOOKS NOTION-STYLE - DOCUMENTAÇÃO TÉCNICA

## 1. Visão Geral

O Editor de Playbooks Notion-style é uma interface rica de edição que permite criar documentos modulares com blocos de conteúdo, formatação avançada, colaboração em tempo real e versionamento. Esta implementação fornece uma experiência similar ao Notion para criação de playbooks de treinamento e documentação técnica.

## 2. Arquitetura de Componentes

### 2.1 Estrutura de Componentes

```typescript
interface PlaybookEditorSystem {
  editor: {
    PlaybookEditor: React.FC<PlaybookEditorProps>;
    BlockEditor: React.FC<BlockEditorProps>;
    BlockToolbar: React.FC<BlockToolbarProps>;
    BlockSelector: React.FC<BlockSelectorProps>;
  };
  blocks: {
    TextBlock: React.FC<TextBlockProps>;
    HeadingBlock: React.FC<HeadingBlockProps>;
    ImageBlock: React.FC<ImageBlockProps>;
    VideoBlock: React.FC<VideoBlockProps>;
    CodeBlock: React.FC<CodeBlockProps>;
    TableBlock: React.FC<TableBlockProps>;
    ListBlock: React.FC<ListBlockProps>;
    QuoteBlock: React.FC<QuoteBlockProps>;
    DividerBlock: React.FC<DividerBlockProps>;
    EmbedBlock: React.FC<EmbedBlockProps>;
    CalloutBlock: React.FC<CalloutBlockProps>;
    ToggleBlock: React.FC<ToggleBlockProps>;
  };
  collaboration: {
    CollaborationProvider: React.FC<CollaborationProviderProps>;
    UserCursors: React.FC<UserCursorsProps>;
    CommentSystem: React.FC<CommentSystemProps>;
    VersionHistory: React.FC<VersionHistoryProps>;
  };
  sidebar: {
    PlaybookSidebar: React.FC<PlaybookSidebarProps>;
    TableOfContents: React.FC<TableOfContentsProps>;
    BlockLibrary: React.FC<BlockLibraryProps>;
    VersionPanel: React.FC<VersionPanelProps>;
  };
}
```

### 2.2 Tipos TypeScript

```typescript
// Playbook Types
interface Playbook {
  id: string;
  title: string;
  description?: string;
  coverImage?: string;
  contentBlocks: ContentBlock[];
  isPublished: boolean;
  companyId: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  collaborators: Collaborator[];
  permissions: PlaybookPermissions;
  metadata: PlaybookMetadata;
}

interface ContentBlock {
  id: string;
  type: BlockType;
  content: BlockContent;
  properties: BlockProperties;
  position: number;
  parentId?: string;
  children?: ContentBlock[];
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

type BlockType = 
  | 'text' 
  | 'heading' 
  | 'image' 
  | 'video' 
  | 'code' 
  | 'table' 
  | 'list' 
  | 'quote' 
  | 'divider' 
  | 'embed' 
  | 'callout' 
  | 'toggle' 
  | 'column' 
  | 'database';

interface BlockContent {
  text?: string;
  html?: string;
  url?: string;
  file?: FileReference;
  data?: Record<string, any>;
  formatting?: TextFormatting;
}

interface BlockProperties {
  style?: BlockStyle;
  alignment?: 'left' | 'center' | 'right' | 'justify';
  color?: string;
  backgroundColor?: string;
  size?: 'small' | 'medium' | 'large';
  level?: number; // Para headings
  language?: string; // Para code blocks
  caption?: string;
  alt?: string;
  width?: number;
  height?: number;
}

interface BlockStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  code?: boolean;
  highlight?: string;
  link?: string;
}

interface TextFormatting {
  ranges: FormatRange[];
}

interface FormatRange {
  start: number;
  end: number;
  style: BlockStyle;
}

interface Collaborator {
  userId: string;
  role: 'owner' | 'editor' | 'viewer' | 'commenter';
  joinedAt: string;
  lastActiveAt: string;
  cursor?: CursorPosition;
}

interface CursorPosition {
  blockId: string;
  offset: number;
  selection?: {
    start: number;
    end: number;
  };
}

interface PlaybookPermissions {
  canEdit: boolean;
  canComment: boolean;
  canShare: boolean;
  canDelete: boolean;
  canPublish: boolean;
}

interface PlaybookMetadata {
  wordCount: number;
  readingTime: number;
  lastEditedBy: string;
  version: number;
  tags: string[];
  category?: string;
}

interface PlaybookVersion {
  id: string;
  playbookId: string;
  versionNumber: number;
  contentSnapshot: ContentBlock[];
  changeSummary: string;
  createdBy: string;
  createdAt: string;
  metadata: {
    blocksAdded: number;
    blocksModified: number;
    blocksDeleted: number;
    totalBlocks: number;
  };
}

interface Comment {
  id: string;
  blockId: string;
  content: string;
  authorId: string;
  createdAt: string;
  updatedAt?: string;
  resolved: boolean;
  replies: Comment[];
  position?: {
    start: number;
    end: number;
  };
}
```

## 3. Estrutura de Arquivos

```
src/
├── pages/
│   ├── PlaybookEditorPage.tsx
│   ├── PlaybookLibraryPage.tsx
│   └── PlaybookViewerPage.tsx
├── components/
│   └── playbook/
│       ├── index.ts
│       ├── editor/
│       │   ├── PlaybookEditor.tsx
│       │   ├── BlockEditor.tsx
│       │   ├── BlockToolbar.tsx
│       │   └── BlockSelector.tsx
│       ├── blocks/
│       │   ├── index.ts
│       │   ├── TextBlock.tsx
│       │   ├── HeadingBlock.tsx
│       │   ├── ImageBlock.tsx
│       │   ├── VideoBlock.tsx
│       │   ├── CodeBlock.tsx
│       │   ├── TableBlock.tsx
│       │   ├── ListBlock.tsx
│       │   ├── QuoteBlock.tsx
│       │   ├── DividerBlock.tsx
│       │   ├── EmbedBlock.tsx
│       │   ├── CalloutBlock.tsx
│       │   └── ToggleBlock.tsx
│       ├── collaboration/
│       │   ├── CollaborationProvider.tsx
│       │   ├── UserCursors.tsx
│       │   ├── CommentSystem.tsx
│       │   └── VersionHistory.tsx
│       └── sidebar/
│           ├── PlaybookSidebar.tsx
│           ├── TableOfContents.tsx
│           ├── BlockLibrary.tsx
│           └── VersionPanel.tsx
├── hooks/
│   ├── usePlaybook.ts
│   ├── useBlocks.ts
│   ├── useCollaboration.ts
│   ├── useVersioning.ts
│   └── useComments.ts
├── services/
│   ├── PlaybookService.ts
│   ├── BlockService.ts
│   ├── CollaborationService.ts
│   └── VersionService.ts
├── utils/
│   ├── blockUtils.ts
│   ├── textUtils.ts
│   └── collaborationUtils.ts
└── types/
    └── playbook.ts
```

## 4. Implementação dos Componentes

### 4.1 PlaybookEditorPage.tsx

```typescript
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PlaybookEditor, PlaybookSidebar } from '@/components/playbook';
import { CollaborationProvider } from '@/components/playbook/collaboration';
import { usePlaybook } from '@/hooks/usePlaybook';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Save, Share, Eye, Settings } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

export default function PlaybookEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isPublishing, setIsPublishing] = useState(false);
  
  const {
    playbook,
    loading,
    error,
    updatePlaybook,
    savePlaybook,
    publishPlaybook,
    addCollaborator
  } = usePlaybook(id);

  const handleSave = async () => {
    try {
      await savePlaybook();
      toast({
        title: "Playbook salvo",
        description: "Suas alterações foram salvas com sucesso."
      });
    } catch (error) {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o playbook.",
        variant: "destructive"
      });
    }
  };

  const handlePublish = async () => {
    setIsPublishing(true);
    try {
      await publishPlaybook();
      toast({
        title: "Playbook publicado",
        description: "O playbook está agora disponível para visualização."
      });
    } catch (error) {
      toast({
        title: "Erro ao publicar",
        description: "Não foi possível publicar o playbook.",
        variant: "destructive"
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePreview = () => {
    window.open(`/playbooks/${id}/preview`, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Carregando playbook...</div>
      </div>
    );
  }

  if (error || !playbook) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Playbook não encontrado</h2>
          <Button onClick={() => navigate('/playbooks')}>Voltar à biblioteca</Button>
        </div>
      </div>
    );
  }

  return (
    <CollaborationProvider playbookId={playbook.id}>
      <div className="flex h-screen bg-gray-50">
        {/* Sidebar */}
        {sidebarOpen && (
          <div className="w-80 bg-white border-r border-gray-200">
            <PlaybookSidebar 
              playbook={playbook}
              onToggle={() => setSidebarOpen(false)}
            />
          </div>
        )}

        {/* Main Editor */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {!sidebarOpen && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSidebarOpen(true)}
                  >
                    <Settings className="h-4 w-4" />
                  </Button>
                )}
                
                <Input
                  value={playbook.title}
                  onChange={(e) => updatePlaybook({ title: e.target.value })}
                  className="text-xl font-semibold border-none p-0 h-auto bg-transparent"
                  placeholder="Título do playbook"
                />
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="outline" size="sm" onClick={handlePreview}>
                  <Eye className="h-4 w-4 mr-2" />
                  Preview
                </Button>
                
                <Button variant="outline" size="sm">
                  <Share className="h-4 w-4 mr-2" />
                  Compartilhar
                </Button>
                
                <Button size="sm" onClick={handleSave}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar
                </Button>
                
                <Button 
                  size="sm" 
                  onClick={handlePublish}
                  disabled={isPublishing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {isPublishing ? 'Publicando...' : 'Publicar'}
                </Button>
              </div>
            </div>
          </div>

          {/* Editor Content */}
          <div className="flex-1 overflow-auto">
            <PlaybookEditor 
              playbook={playbook}
              onUpdate={updatePlaybook}
            />
          </div>
        </div>
      </div>
    </CollaborationProvider>
  );
}
```

### 4.2 PlaybookEditor.tsx

```typescript
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';
import { BlockEditor, BlockSelector } from './index';
import { useBlocks } from '@/hooks/useBlocks';
import { ContentBlock, Playbook } from '@/types/playbook';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface PlaybookEditorProps {
  playbook: Playbook;
  onUpdate: (updates: Partial<Playbook>) => void;
}

export function PlaybookEditor({ playbook, onUpdate }: PlaybookEditorProps) {
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [showBlockSelector, setShowBlockSelector] = useState(false);
  const [selectorPosition, setSelectorPosition] = useState({ x: 0, y: 0 });
  const editorRef = useRef<HTMLDivElement>(null);
  
  const {
    blocks,
    addBlock,
    updateBlock,
    deleteBlock,
    moveBlock,
    duplicateBlock
  } = useBlocks(playbook.contentBlocks);

  const handleDragEnd = useCallback((result: any) => {
    if (!result.destination) return;
    
    const newBlocks = moveBlock(
      result.source.index,
      result.destination.index
    );
    
    onUpdate({ contentBlocks: newBlocks });
  }, [moveBlock, onUpdate]);

  const handleAddBlock = useCallback((type: BlockType, position?: number) => {
    const newBlock = addBlock(type, position);
    onUpdate({ contentBlocks: blocks });
    setSelectedBlockId(newBlock.id);
    setShowBlockSelector(false);
  }, [addBlock, blocks, onUpdate]);

  const handleUpdateBlock = useCallback((blockId: string, updates: Partial<ContentBlock>) => {
    const newBlocks = updateBlock(blockId, updates);
    onUpdate({ contentBlocks: newBlocks });
  }, [updateBlock, onUpdate]);

  const handleDeleteBlock = useCallback((blockId: string) => {
    const newBlocks = deleteBlock(blockId);
    onUpdate({ contentBlocks: newBlocks });
    if (selectedBlockId === blockId) {
      setSelectedBlockId(null);
    }
  }, [deleteBlock, onUpdate, selectedBlockId]);

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === '/' && !showBlockSelector) {
      e.preventDefault();
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        setSelectorPosition({ x: rect.left, y: rect.bottom + 10 });
        setShowBlockSelector(true);
      }
    }
    
    if (e.key === 'Escape') {
      setShowBlockSelector(false);
      setSelectedBlockId(null);
    }
  }, [showBlockSelector]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <div ref={editorRef} className="max-w-4xl mx-auto p-8">
      {/* Cover Image */}
      {playbook.coverImage && (
        <div className="mb-8">
          <img 
            src={playbook.coverImage} 
            alt="Cover" 
            className="w-full h-64 object-cover rounded-lg"
          />
        </div>
      )}

      {/* Title */}
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-gray-900 mb-2">
          {playbook.title || 'Playbook sem título'}
        </h1>
        {playbook.description && (
          <p className="text-lg text-gray-600">{playbook.description}</p>
        )}
      </div>

      {/* Content Blocks */}
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="blocks">
          {(provided) => (
            <div
              {...provided.droppableProps}
              ref={provided.innerRef}
              className="space-y-2"
            >
              {blocks.map((block, index) => (
                <Draggable key={block.id} draggableId={block.id} index={index}>
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      className={`
                        group relative
                        ${snapshot.isDragging ? 'opacity-50' : ''}
                        ${selectedBlockId === block.id ? 'ring-2 ring-blue-500 ring-opacity-50' : ''}
                      `}
                      onClick={() => setSelectedBlockId(block.id)}
                    >
                      <BlockEditor
                        block={block}
                        isSelected={selectedBlockId === block.id}
                        onUpdate={(updates) => handleUpdateBlock(block.id, updates)}
                        onDelete={() => handleDeleteBlock(block.id)}
                        onDuplicate={() => duplicateBlock(block.id)}
                        onAddBelow={() => handleAddBlock('text', index + 1)}
                        dragHandleProps={provided.dragHandleProps}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </DragDropContext>

      {/* Add Block Button */}
      <div className="mt-8">
        <Button
          variant="ghost"
          onClick={() => handleAddBlock('text')}
          className="w-full justify-start text-gray-500 hover:text-gray-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Adicionar bloco (ou digite "/")
        </Button>
      </div>

      {/* Block Selector */}
      {showBlockSelector && (
        <BlockSelector
          position={selectorPosition}
          onSelect={handleAddBlock}
          onClose={() => setShowBlockSelector(false)}
        />
      )}
    </div>
  );
}
```

### 4.3 BlockEditor.tsx

```typescript
import React from 'react';
import { ContentBlock } from '@/types/playbook';
import {
  TextBlock,
  HeadingBlock,
  ImageBlock,
  VideoBlock,
  CodeBlock,
  TableBlock,
  ListBlock,
  QuoteBlock,
  DividerBlock,
  EmbedBlock,
  CalloutBlock,
  ToggleBlock
} from '../blocks';
import { BlockToolbar } from './BlockToolbar';
import { GripVertical } from 'lucide-react';

interface BlockEditorProps {
  block: ContentBlock;
  isSelected: boolean;
  onUpdate: (updates: Partial<ContentBlock>) => void;
  onDelete: () => void;
  onDuplicate: () => void;
  onAddBelow: () => void;
  dragHandleProps?: any;
}

export function BlockEditor({
  block,
  isSelected,
  onUpdate,
  onDelete,
  onDuplicate,
  onAddBelow,
  dragHandleProps
}: BlockEditorProps) {
  const renderBlock = () => {
    const commonProps = {
      block,
      onUpdate,
      isSelected
    };

    switch (block.type) {
      case 'text':
        return <TextBlock {...commonProps} />;
      case 'heading':
        return <HeadingBlock {...commonProps} />;
      case 'image':
        return <ImageBlock {...commonProps} />;
      case 'video':
        return <VideoBlock {...commonProps} />;
      case 'code':
        return <CodeBlock {...commonProps} />;
      case 'table':
        return <TableBlock {...commonProps} />;
      case 'list':
        return <ListBlock {...commonProps} />;
      case 'quote':
        return <QuoteBlock {...commonProps} />;
      case 'divider':
        return <DividerBlock {...commonProps} />;
      case 'embed':
        return <EmbedBlock {...commonProps} />;
      case 'callout':
        return <CalloutBlock {...commonProps} />;
      case 'toggle':
        return <ToggleBlock {...commonProps} />;
      default:
        return <TextBlock {...commonProps} />;
    }
  };

  return (
    <div className="relative group">
      {/* Drag Handle */}
      <div
        {...dragHandleProps}
        className="absolute left-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
        style={{ transform: 'translateX(-100%)' }}
      >
        <div className="p-1 hover:bg-gray-100 rounded">
          <GripVertical className="h-4 w-4 text-gray-400" />
        </div>
      </div>

      {/* Block Content */}
      <div className="relative">
        {renderBlock()}
        
        {/* Block Toolbar */}
        {isSelected && (
          <BlockToolbar
            block={block}
            onUpdate={onUpdate}
            onDelete={onDelete}
            onDuplicate={onDuplicate}
            onAddBelow={onAddBelow}
          />
        )}
      </div>
    </div>
  );
}
```

### 4.4 TextBlock.tsx

```typescript
import React, { useState, useRef, useEffect } from 'react';
import { ContentBlock } from '@/types/playbook';
import { useTextFormatting } from '@/hooks/useTextFormatting';

interface TextBlockProps {
  block: ContentBlock;
  onUpdate: (updates: Partial<ContentBlock>) => void;
  isSelected: boolean;
}

export function TextBlock({ block, onUpdate, isSelected }: TextBlockProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(block.content.text || '');
  const editorRef = useRef<HTMLDivElement>(null);
  
  const {
    applyFormatting,
    getFormattedText,
    handleKeyDown,
    handleSelection
  } = useTextFormatting(content, block.content.formatting);

  useEffect(() => {
    if (isEditing && editorRef.current) {
      editorRef.current.focus();
    }
  }, [isEditing]);

  const handleClick = () => {
    if (!isEditing) {
      setIsEditing(true);
    }
  };

  const handleBlur = () => {
    setIsEditing(false);
    if (content !== block.content.text) {
      onUpdate({
        content: {
          ...block.content,
          text: content
        },
        updatedAt: new Date().toISOString()
      });
    }
  };

  const handleInput = (e: React.FormEvent<HTMLDivElement>) => {
    const newContent = e.currentTarget.textContent || '';
    setContent(newContent);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
    
    handleKeyDown(e);
  };

  return (
    <div
      className={`
        min-h-[1.5rem] py-1 px-2 rounded transition-colors
        ${isEditing ? 'bg-blue-50' : 'hover:bg-gray-50'}
        ${isSelected ? 'ring-1 ring-blue-300' : ''}
      `}
      onClick={handleClick}
    >
      <div
        ref={editorRef}
        contentEditable={isEditing}
        suppressContentEditableWarning
        onInput={handleInput}
        onBlur={handleBlur}
        onKeyDown={handleKeyPress}
        onMouseUp={handleSelection}
        className={`
          outline-none text-gray-900 leading-relaxed
          ${!content && !isEditing ? 'text-gray-400' : ''}
        `}
        style={{
          minHeight: '1.5rem',
          wordBreak: 'break-word'
        }}
        dangerouslySetInnerHTML={{
          __html: isEditing ? content : getFormattedText()
        }}
      />
      
      {!content && !isEditing && (
        <div className="text-gray-400 pointer-events-none">
          Digite algo ou pressione "/" para comandos...
        </div>
      )}
    </div>
  );
}
```

## 5. Hooks Customizados

### 5.1 usePlaybook.ts

```typescript
import { useState, useEffect, useCallback } from 'react';
import { PlaybookService } from '@/services/PlaybookService';
import { Playbook } from '@/types/playbook';
import { useAuth } from '@/hooks/useAuth';
import { useDebounce } from '@/hooks/useDebounce';

export function usePlaybook(playbookId?: string) {
  const [playbook, setPlaybook] = useState<Playbook | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const { user } = useAuth();

  // Debounce para auto-save
  const debouncedPlaybook = useDebounce(playbook, 2000);

  const fetchPlaybook = useCallback(async () => {
    if (!playbookId || !user) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const data = await PlaybookService.getPlaybook(playbookId);
      setPlaybook(data);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [playbookId, user]);

  const createPlaybook = useCallback(async (title: string) => {
    if (!user) return;
    
    try {
      const newPlaybook = await PlaybookService.createPlaybook({
        title,
        companyId: user.company_id,
        createdBy: user.id
      });
      
      setPlaybook(newPlaybook);
      return newPlaybook;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [user]);

  const updatePlaybook = useCallback((updates: Partial<Playbook>) => {
    if (!playbook) return;
    
    const updatedPlaybook = {
      ...playbook,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    setPlaybook(updatedPlaybook);
    setHasUnsavedChanges(true);
  }, [playbook]);

  const savePlaybook = useCallback(async () => {
    if (!playbook || !hasUnsavedChanges) return;
    
    try {
      const savedPlaybook = await PlaybookService.updatePlaybook(playbook.id, playbook);
      setPlaybook(savedPlaybook);
      setHasUnsavedChanges(false);
      return savedPlaybook;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [playbook, hasUnsavedChanges]);

  const publishPlaybook = useCallback(async () => {
    if (!playbook) return;
    
    try {
      const publishedPlaybook = await PlaybookService.publishPlaybook(playbook.id);
      setPlaybook(publishedPlaybook);
      return publishedPlaybook;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [playbook]);

  const addCollaborator = useCallback(async (email: string, role: string) => {
    if (!playbook) return;
    
    try {
      const updatedPlaybook = await PlaybookService.addCollaborator(
        playbook.id, 
        email, 
        role
      );
      setPlaybook(updatedPlaybook);
      return updatedPlaybook;
    } catch (err) {
      setError(err as Error);
      throw err;
    }
  }, [playbook]);

  // Auto-save quando o playbook é alterado
  useEffect(() => {
    if (debouncedPlaybook && hasUnsavedChanges) {
      savePlaybook().catch(console.error);
    }
  }, [debouncedPlaybook, hasUnsavedChanges, savePlaybook]);

  // Carregar playbook inicial
  useEffect(() => {
    fetchPlaybook();
  }, [fetchPlaybook]);

  // Prevenir saída sem salvar
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'Você tem alterações não salvas. Deseja sair mesmo assim?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  return {
    playbook,
    loading,
    error,
    hasUnsavedChanges,
    createPlaybook,
    updatePlaybook,
    savePlaybook,
    publishPlaybook,
    addCollaborator,
    refetch: fetchPlaybook
  };
}
```

### 5.2 useBlocks.ts

```typescript
import { useState, useCallback } from 'react';
import { ContentBlock, BlockType } from '@/types/playbook';
import { BlockService } from '@/services/BlockService';

export function useBlocks(initialBlocks: ContentBlock[]) {
  const [blocks, setBlocks] = useState<ContentBlock[]>(initialBlocks);

  const addBlock = useCallback((type: BlockType, position?: number) => {
    const newBlock: ContentBlock = {
      id: crypto.randomUUID(),
      type,
      content: BlockService.getDefaultContent(type),
      properties: BlockService.getDefaultProperties(type),
      position: position ?? blocks.length,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: '' // Será preenchido pelo contexto
    };

    const newBlocks = [...blocks];
    if (position !== undefined) {
      newBlocks.splice(position, 0, newBlock);
      // Reordenar posições
      newBlocks.forEach((block, index) => {
        block.position = index;
      });
    } else {
      newBlocks.push(newBlock);
    }

    setBlocks(newBlocks);
    return newBlock;
  }, [blocks]);

  const updateBlock = useCallback((blockId: string, updates: Partial<ContentBlock>) => {
    const newBlocks = blocks.map(block => 
      block.id === blockId 
        ? { 
            ...block, 
            ...updates, 
            updatedAt: new Date().toISOString() 
          }
        : block
    );
    
    setBlocks(newBlocks);
    return newBlocks;
  }, [blocks]);

  const deleteBlock = useCallback((blockId: string) => {
    const newBlocks = blocks
      .filter(block => block.id !== blockId)
      .map((block, index) => ({ ...block, position: index }));
    
    setBlocks(newBlocks);
    return newBlocks;
  }, [blocks]);

  const moveBlock = useCallback((fromIndex: number, toIndex: number) => {
    const newBlocks = [...blocks];
    const [movedBlock] = newBlocks.splice(fromIndex, 1);
    newBlocks.splice(toIndex, 0, movedBlock);
    
    // Reordenar posições
    newBlocks.forEach((block, index) => {
      block.position = index;
    });
    
    setBlocks(newBlocks);
    return newBlocks;
  }, [blocks]);

  const duplicateBlock = useCallback((blockId: string) => {
    const blockToDuplicate = blocks.find(block => block.id === blockId);
    if (!blockToDuplicate) return blocks;

    const duplicatedBlock: ContentBlock = {
      ...blockToDuplicate,
      id: crypto.randomUUID(),
      position: blockToDuplicate.position + 1,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const newBlocks = [...blocks];
    newBlocks.splice(blockToDuplicate.position + 1, 0, duplicatedBlock);
    
    // Reordenar posições
    newBlocks.forEach((block, index) => {
      block.position = index;
    });
    
    setBlocks(newBlocks);
    return newBlocks;
  }, [blocks]);

  const getBlockById = useCallback((blockId: string) => {
    return blocks.find(block => block.id === blockId);
  }, [blocks]);

  const getBlocksByType = useCallback((type: BlockType) => {
    return blocks.filter(block => block.type === type);
  }, [blocks]);

  return {
    blocks,
    addBlock,
    updateBlock,
    deleteBlock,
    moveBlock,
    duplicateBlock,
    getBlockById,
    getBlocksByType
  };
}
```

## 6. Serviços de API

### 6.1 PlaybookService.ts

```typescript
import { supabase } from '@/lib/supabase';
import { Playbook, PlaybookVersion } from '@/types/playbook';

export class PlaybookService {
  static async getPlaybook(id: string): Promise<Playbook> {
    const { data, error } = await supabase
      .from('playbooks')
      .select(`
        *,
        profiles!created_by(id, name, avatar_url),
        companies(id, name)
      `)
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  }

  static async createPlaybook(playbook: Partial<Playbook>): Promise<Playbook> {
    const { data, error } = await supabase
      .from('playbooks')
      .insert({
        title: playbook.title,
        description: playbook.description,
        content_blocks: playbook.contentBlocks || [],
        company_id: playbook.companyId,
        created_by: playbook.createdBy,
        is_published: false
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async updatePlaybook(id: string, updates: Partial<Playbook>): Promise<Playbook> {
    const { data, error } = await supabase
      .from('playbooks')
      .update({
        title: updates.title,
        description: updates.description,
        content_blocks: updates.contentBlocks,
        cover_image: updates.coverImage,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async publishPlaybook(id: string): Promise<Playbook> {
    const { data, error } = await supabase
      .from('playbooks')
      .update({
        is_published: true,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  static async addCollaborator(
    playbookId: string, 
    email: string, 
    role: string
  ): Promise<Playbook> {
    // Buscar usuário pelo email
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single();

    if (userError) throw new Error('Usuário não encontrado');

    // Adicionar colaborador
    const { error: collabError } = await supabase
      .from('playbook_collaborators')
      .insert({
        playbook_id: playbookId,
        user_id: user.id,
        role
      });

    if (collabError) throw collabError;

    // Retornar playbook atualizado
    return this.getPlaybook(playbookId);
  }

  static async getVersions(playbookId: string): Promise<PlaybookVersion[]> {
    const { data, error } = await supabase
      .from('playbook_versions')
      .select(`
        *,
        profiles!created_by(id, name, avatar_url)
      `)
      .eq('playbook_id', playbookId)
      .order('version_number', { ascending: false });

    if (error) throw error;
    return data;
  }

  static async restoreVersion(
    playbookId: string, 
    versionId: string
  ): Promise<Playbook> {
    // Buscar versão
    const { data: version, error: versionError } = await supabase
      .from('playbook_versions')
      .select('content_snapshot')
      .eq('id', versionId)
      .single();

    if (versionError) throw versionError;

    // Restaurar conteúdo
    const { data, error } = await supabase
      .from('playbooks')
      .update({
        content_blocks: version.content_snapshot,
        updated_at: new Date().toISOString()
      })
      .eq('id', playbookId)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
```

## 7. Colaboração em Tempo Real

### 7.1 CollaborationProvider.tsx

```typescript
import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/hooks/useAuth';
import { Collaborator, CursorPosition } from '@/types/playbook';

interface CollaborationContextType {
  collaborators: Collaborator[];
  updateCursor: (position: CursorPosition) => void;
  sendMessage: (message: string) => void;
}

const CollaborationContext = createContext<CollaborationContextType | null>(null);

interface CollaborationProviderProps {
  playbookId: string;
  children: React.ReactNode;
}

export function CollaborationProvider({ playbookId, children }: CollaborationProviderProps) {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([]);
  const { user } = useAuth();
  const [channel, setChannel] = useState<any>(null);

  useEffect(() => {
    if (!user || !playbookId) return;

    // Criar canal de colaboração
    const collaborationChannel = supabase.channel(`playbook:${playbookId}`, {
      config: {
        presence: {
          key: user.id
        }
      }
    });

    // Configurar presença
    collaborationChannel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = collaborationChannel.presenceState();
        const activeCollaborators = Object.values(presenceState).flat() as Collaborator[];
        setCollaborators(activeCollaborators);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('Usuário entrou:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('Usuário saiu:', leftPresences);
      })
      .on('broadcast', { event: 'cursor' }, ({ payload }) => {
        // Atualizar cursor de outros usuários
        setCollaborators(prev => 
          prev.map(collab => 
            collab.userId === payload.userId 
              ? { ...collab, cursor: payload.cursor }
              : collab
          )
        );
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Enviar presença inicial
          await collaborationChannel.track({
            userId: user.id,
            name: user.name,
            avatar: user.avatar_url,
            joinedAt: new Date().toISOString(),
            lastActiveAt: new Date().toISOString()
          });
        }
      });

    setChannel(collaborationChannel);

    return () => {
      collaborationChannel.unsubscribe();
    };
  }, [user, playbookId]);

  const updateCursor = (position: CursorPosition) => {
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'cursor',
        payload: {
          userId: user?.id,
          cursor: position
        }
      });
    }
  };

  const sendMessage = (message: string) => {
    if (channel) {
      channel.send({
        type: 'broadcast',
        event: 'message',
        payload: {
          userId: user?.id,
          message,
          timestamp: new Date().toISOString()
        }
      });
    }
  };

  return (
    <CollaborationContext.Provider value={{
      collaborators,
      updateCursor,
      sendMessage
    }}>
      {children}
    </CollaborationContext.Provider>
  );
}

export function useCollaboration() {
  const context = useContext(CollaborationContext);
  if (!context) {
    throw new Error('useCollaboration must be used within CollaborationProvider');
  }
  return context;
}
```

## 8. Cronograma de Implementação

### Fase 1 (5 dias)

* Estrutura básica e tipos

* Editor principal e blocos básicos

* Sistema de drag-and-drop

### Fase 2 (4 dias)

* Blocos avançados (tabela, código, embed)

* Sistema de formatação de texto

* Toolbar e seletor de blocos

### Fase 3 (3 dias)

* Colaboração em tempo real

* Sistema de comentários

* Versionamento

### Fase 4 (3 dias)

* Sidebar e navegação

* Publicação e compartilhamento

* Testes e ot

