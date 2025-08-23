import React, { useState, useRef, useEffect } from 'react';
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
  AlignRight
} from 'lucide-react';

interface Block {
  id: string;
  type: 'paragraph' | 'heading1' | 'heading2' | 'heading3' | 'bulletList' | 'numberedList' | 'quote' | 'code' | 'image' | 'video' | 'divider';
  content: string;
  metadata?: {
    url?: string;
    alt?: string;
    alignment?: 'left' | 'center' | 'right';
    language?: string;
  };
}

interface NotionEditorProps {
  initialContent?: Block[];
  onChange?: (blocks: Block[]) => void;
  readOnly?: boolean;
}

const NotionEditor: React.FC<NotionEditorProps> = ({
  initialContent = [],
  onChange,
  readOnly = false
}) => {
  const [blocks, setBlocks] = useState<Block[]>(
    initialContent.length > 0 ? initialContent : [
      { id: '1', type: 'paragraph', content: '' }
    ]
  );
  const [activeBlockId, setActiveBlockId] = useState<string | null>(null);
  const [showBlockMenu, setShowBlockMenu] = useState<string | null>(null);
  const [draggedBlock, setDraggedBlock] = useState<string | null>(null);

  useEffect(() => {
    if (onChange) {
      onChange(blocks);
    }
  }, [blocks, onChange]);

  const generateId = () => Math.random().toString(36).substr(2, 9);

  const addBlock = (afterId: string, type: Block['type'] = 'paragraph') => {
    const newBlock: Block = {
      id: generateId(),
      type,
      content: ''
    };

    const index = blocks.findIndex(block => block.id === afterId);
    const newBlocks = [...blocks];
    newBlocks.splice(index + 1, 0, newBlock);
    setBlocks(newBlocks);
    setActiveBlockId(newBlock.id);
    setShowBlockMenu(null);
  };

  const updateBlock = (id: string, updates: Partial<Block>) => {
    setBlocks(blocks.map(block => 
      block.id === id ? { ...block, ...updates } : block
    ));
  };

  const deleteBlock = (id: string) => {
    if (blocks.length === 1) return;
    setBlocks(blocks.filter(block => block.id !== id));
  };

  const moveBlock = (fromIndex: number, toIndex: number) => {
    const newBlocks = [...blocks];
    const [movedBlock] = newBlocks.splice(fromIndex, 1);
    newBlocks.splice(toIndex, 0, movedBlock);
    setBlocks(newBlocks);
  };

  const handleKeyDown = (e: React.KeyboardEvent, blockId: string) => {
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
    }
  };

  const blockTypes = [
    { type: 'paragraph' as const, icon: Type, label: 'Parágrafo', description: 'Texto simples' },
    { type: 'heading1' as const, icon: Heading1, label: 'Título 1', description: 'Título principal' },
    { type: 'heading2' as const, icon: Heading2, label: 'Título 2', description: 'Subtítulo' },
    { type: 'heading3' as const, icon: Heading3, label: 'Título 3', description: 'Título menor' },
    { type: 'bulletList' as const, icon: List, label: 'Lista', description: 'Lista com marcadores' },
    { type: 'numberedList' as const, icon: ListOrdered, label: 'Lista Numerada', description: 'Lista ordenada' },
    { type: 'quote' as const, icon: Quote, label: 'Citação', description: 'Bloco de citação' },
    { type: 'code' as const, icon: Code, label: 'Código', description: 'Bloco de código' },
    { type: 'image' as const, icon: Image, label: 'Imagem', description: 'Inserir imagem' },
    { type: 'video' as const, icon: Video, label: 'Vídeo', description: 'Inserir vídeo' }
  ];

  const renderBlock = (block: Block, index: number) => {
    const isActive = activeBlockId === block.id;
    const commonProps = {
      className: `w-full border-none outline-none resize-none bg-transparent ${
        block.type === 'heading1' ? 'text-3xl font-bold' :
        block.type === 'heading2' ? 'text-2xl font-semibold' :
        block.type === 'heading3' ? 'text-xl font-medium' :
        block.type === 'quote' ? 'text-lg italic border-l-4 border-blue-500 pl-4 text-gray-700' :
        block.type === 'code' ? 'font-mono text-sm bg-gray-100 p-3 rounded-lg' :
        'text-base'
      } placeholder-gray-400`,
      placeholder: 
        block.type === 'heading1' ? 'Título principal...' :
        block.type === 'heading2' ? 'Subtítulo...' :
        block.type === 'heading3' ? 'Título...' :
        block.type === 'quote' ? 'Citação...' :
        block.type === 'code' ? 'Código...' :
        block.type === 'bulletList' ? '• Item da lista...' :
        block.type === 'numberedList' ? '1. Item da lista...' :
        'Digite / para comandos...',
      value: block.content,
      onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => 
        updateBlock(block.id, { content: e.target.value }),
      onFocus: () => setActiveBlockId(block.id),
      onKeyDown: (e: React.KeyboardEvent) => handleKeyDown(e, block.id),
      disabled: readOnly
    };

    return (
      <div
        key={block.id}
        className={`group relative flex items-start gap-2 py-2 ${
          isActive ? 'bg-blue-50 rounded-lg' : ''
        }`}
        draggable={!readOnly}
        onDragStart={() => setDraggedBlock(block.id)}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          if (draggedBlock && draggedBlock !== block.id) {
            const fromIndex = blocks.findIndex(b => b.id === draggedBlock);
            moveBlock(fromIndex, index);
          }
          setDraggedBlock(null);
        }}
      >
        {/* Drag Handle */}
        {!readOnly && (
          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <button className="p-1 hover:bg-gray-200 rounded">
              <GripVertical className="h-4 w-4 text-gray-400" />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0">
          {block.type === 'image' ? (
            <div className="space-y-2">
              {block.metadata?.url ? (
                <img 
                  src={block.metadata.url} 
                  alt={block.metadata.alt || ''}
                  className="max-w-full h-auto rounded-lg"
                />
              ) : (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Image className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-gray-500">Clique para adicionar uma imagem</p>
                </div>
              )}
              {!readOnly && (
                <input
                  type="url"
                  placeholder="URL da imagem..."
                  value={block.metadata?.url || ''}
                  onChange={(e) => updateBlock(block.id, {
                    metadata: { ...block.metadata, url: e.target.value }
                  })}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                />
              )}
            </div>
          ) : block.type === 'video' ? (
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
                <input
                  type="url"
                  placeholder="URL do vídeo (YouTube, Vimeo...)..."
                  value={block.metadata?.url || ''}
                  onChange={(e) => updateBlock(block.id, {
                    metadata: { ...block.metadata, url: e.target.value }
                  })}
                  className="w-full p-2 border border-gray-300 rounded text-sm"
                />
              )}
            </div>
          ) : block.type === 'divider' ? (
            <hr className="my-4 border-gray-300" />
          ) : (
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
          )}
        </div>

        {/* Actions */}
        {!readOnly && isActive && (
          <div className="flex-shrink-0 flex items-center gap-1">
            <button
              onClick={() => setShowBlockMenu(block.id)}
              className="p-1 hover:bg-gray-200 rounded"
            >
              <Plus className="h-4 w-4 text-gray-400" />
            </button>
            {blocks.length > 1 && (
              <button
                onClick={() => deleteBlock(block.id)}
                className="p-1 hover:bg-red-100 rounded"
              >
                <Trash2 className="h-4 w-4 text-red-400" />
              </button>
            )}
          </div>
        )}

        {/* Block Type Menu */}
        {showBlockMenu === block.id && (
          <div className="absolute top-full left-8 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-64">
            <div className="p-2">
              <div className="text-xs font-medium text-gray-500 mb-2">BLOCOS BÁSICOS</div>
              {blockTypes.map((blockType) => {
                const Icon = blockType.icon;
                return (
                  <button
                    key={blockType.type}
                    onClick={() => {
                      updateBlock(block.id, { type: blockType.type });
                      setShowBlockMenu(null);
                    }}
                    className="w-full flex items-center gap-3 p-2 hover:bg-gray-100 rounded text-left"
                  >
                    <Icon className="h-4 w-4 text-gray-600" />
                    <div>
                      <div className="text-sm font-medium">{blockType.label}</div>
                      <div className="text-xs text-gray-500">{blockType.description}</div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className="max-w-4xl mx-auto p-6 bg-white min-h-96"
      onClick={() => setShowBlockMenu(null)}
    >
      <div className="space-y-1">
        {blocks.map((block, index) => renderBlock(block, index))}
      </div>
      
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
  );
};

export default NotionEditor;