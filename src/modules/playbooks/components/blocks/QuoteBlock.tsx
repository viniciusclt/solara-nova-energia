import React, { useState, useRef, useCallback } from 'react';
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import {
  Quote,
  User,
  Calendar,
  Link,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Type,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Block } from '../../types/editor';

interface QuoteMetadata {
  author?: string;
  source?: string;
  date?: string;
  url?: string;
  alignment: 'left' | 'center' | 'right';
  style: 'default' | 'modern' | 'minimal' | 'bordered' | 'highlighted';
  color: 'default' | 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  size: 'small' | 'medium' | 'large';
}

interface QuoteBlockProps {
  block: Block;
  isSelected: boolean;
  isEditing: boolean;
  onUpdate: (content: string, metadata?: Record<string, unknown>) => void;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

export const QuoteBlock: React.FC<QuoteBlockProps> = ({
  block,
  isSelected,
  isEditing,
  onUpdate,
  onStartEdit,
  onStopEdit,
  onKeyDown,
}) => {
  const [content, setContent] = useState(block.content || '');
  const [metadata, setMetadata] = useState<QuoteMetadata>(() => ({
    author: block.metadata?.author || '',
    source: block.metadata?.source || '',
    date: block.metadata?.date || '',
    url: block.metadata?.url || '',
    alignment: block.metadata?.alignment || 'left',
    style: block.metadata?.style || 'default',
    color: block.metadata?.color || 'default',
    size: block.metadata?.size || 'medium',
  }));
  
  const [showMetadataForm, setShowMetadataForm] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const authorRef = useRef<HTMLInputElement>(null);

  const updateContent = useCallback((newContent: string) => {
    setContent(newContent);
    onUpdate(newContent, metadata);
  }, [metadata, onUpdate]);

  const updateMetadata = useCallback((updates: Partial<QuoteMetadata>) => {
    const newMetadata = { ...metadata, ...updates };
    setMetadata(newMetadata);
    onUpdate(content, newMetadata);
  }, [content, metadata, onUpdate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && e.shiftKey) {
      // Allow line breaks with Shift+Enter
      return;
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onStopEdit();
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      onStopEdit();
    }

    // Handle formatting shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          // Bold formatting would be handled by rich text editor
          break;
        case 'i':
          e.preventDefault();
          // Italic formatting would be handled by rich text editor
          break;
      }
    }

    onKeyDown?.(e);
  };

  const getStyleClasses = () => {
    const baseClasses = 'relative p-4 rounded-lg transition-all duration-200';
    const sizeClasses = {
      small: 'text-sm',
      medium: 'text-base',
      large: 'text-lg',
    };
    
    const colorClasses = {
      default: 'border-l-4 border-muted-foreground bg-muted/30',
      blue: 'border-l-4 border-blue-500 bg-blue-50 dark:bg-blue-950/30',
      green: 'border-l-4 border-green-500 bg-green-50 dark:bg-green-950/30',
      yellow: 'border-l-4 border-yellow-500 bg-yellow-50 dark:bg-yellow-950/30',
      red: 'border-l-4 border-red-500 bg-red-50 dark:bg-red-950/30',
      purple: 'border-l-4 border-purple-500 bg-purple-50 dark:bg-purple-950/30',
    };
    
    const styleClasses = {
      default: colorClasses[metadata.color],
      modern: `${colorClasses[metadata.color]} shadow-sm`,
      minimal: 'border-l-2 border-muted-foreground/50 bg-transparent italic',
      bordered: `border-2 ${colorClasses[metadata.color].replace('border-l-4', 'border')} rounded-lg`,
      highlighted: `${colorClasses[metadata.color]} shadow-lg border-l-8`,
    };
    
    const alignmentClasses = {
      left: 'text-left',
      center: 'text-center',
      right: 'text-right',
    };

    return cn(
      baseClasses,
      sizeClasses[metadata.size],
      styleClasses[metadata.style],
      alignmentClasses[metadata.alignment]
    );
  };

  const getQuoteIcon = () => {
    if (metadata.style === 'minimal') return null;
    
    return (
      <Quote className={cn(
        'absolute opacity-20',
        metadata.alignment === 'left' && 'top-2 left-2',
        metadata.alignment === 'center' && 'top-2 left-1/2 transform -translate-x-1/2',
        metadata.alignment === 'right' && 'top-2 right-2',
        metadata.size === 'small' && 'h-4 w-4',
        metadata.size === 'medium' && 'h-6 w-6',
        metadata.size === 'large' && 'h-8 w-8'
      )} />
    );
  };

  return (
    <div className="relative group">
      {/* Controls */}
      {isSelected && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 z-50 bg-background border rounded-lg shadow-lg p-1 flex items-center gap-1">
          {/* Style selector */}
          <Select value={metadata.style} onValueChange={(value) => updateMetadata({ style: value as QuoteMetadata['style'] })}>
            <SelectTrigger className="h-8 w-24 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Padrão</SelectItem>
              <SelectItem value="modern">Moderno</SelectItem>
              <SelectItem value="minimal">Minimal</SelectItem>
              <SelectItem value="bordered">Bordado</SelectItem>
              <SelectItem value="highlighted">Destacado</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Color selector */}
          <Select value={metadata.color} onValueChange={(value) => updateMetadata({ color: value as QuoteMetadata['color'] })}>
            <SelectTrigger className="h-8 w-20 text-xs">
              <Palette className="h-3 w-3" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Padrão</SelectItem>
              <SelectItem value="blue">Azul</SelectItem>
              <SelectItem value="green">Verde</SelectItem>
              <SelectItem value="yellow">Amarelo</SelectItem>
              <SelectItem value="red">Vermelho</SelectItem>
              <SelectItem value="purple">Roxo</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="w-px h-6 bg-border" />
          
          {/* Size selector */}
          <Select value={metadata.size} onValueChange={(value) => updateMetadata({ size: value as QuoteMetadata['size'] })}>
            <SelectTrigger className="h-8 w-20 text-xs">
              <Type className="h-3 w-3" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Pequeno</SelectItem>
              <SelectItem value="medium">Médio</SelectItem>
              <SelectItem value="large">Grande</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="w-px h-6 bg-border" />
          
          {/* Alignment controls */}
          <Button
            variant={metadata.alignment === 'left' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => updateMetadata({ alignment: 'left' })}
            className="h-8 w-8 p-0"
          >
            <AlignLeft className="h-3 w-3" />
          </Button>
          
          <Button
            variant={metadata.alignment === 'center' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => updateMetadata({ alignment: 'center' })}
            className="h-8 w-8 p-0"
          >
            <AlignCenter className="h-3 w-3" />
          </Button>
          
          <Button
            variant={metadata.alignment === 'right' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => updateMetadata({ alignment: 'right' })}
            className="h-8 w-8 p-0"
          >
            <AlignRight className="h-3 w-3" />
          </Button>
          
          <div className="w-px h-6 bg-border" />
          
          {/* Metadata toggle */}
          <Button
            variant={showMetadataForm ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setShowMetadataForm(!showMetadataForm)}
            className="h-8 w-8 p-0"
          >
            <User className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Content */}
      <div
        className={cn(
          'min-h-[4rem] transition-all duration-200',
          'hover:bg-muted/20',
          isSelected && 'ring-2 ring-primary/20',
          !isEditing && 'cursor-pointer'
        )}
        onClick={!isEditing ? onStartEdit : undefined}
      >
        <div className={getStyleClasses()}>
          {getQuoteIcon()}
          
          {isEditing ? (
            <div className="space-y-3">
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => updateContent(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua citação aqui..."
                className={cn(
                  'w-full bg-transparent border-none outline-none resize-none',
                  'placeholder:text-muted-foreground',
                  metadata.size === 'small' && 'text-sm',
                  metadata.size === 'medium' && 'text-base',
                  metadata.size === 'large' && 'text-lg',
                  metadata.alignment === 'center' && 'text-center',
                  metadata.alignment === 'right' && 'text-right'
                )}
                rows={Math.max(2, content.split('\n').length)}
                autoFocus
              />
              
              {/* Metadata form */}
              {showMetadataForm && (
                <div className="space-y-2 pt-2 border-t border-border/50">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      ref={authorRef}
                      placeholder="Autor"
                      value={metadata.author}
                      onChange={(e) => updateMetadata({ author: e.target.value })}
                      className="text-xs"
                    />
                    <Input
                      placeholder="Fonte"
                      value={metadata.source}
                      onChange={(e) => updateMetadata({ source: e.target.value })}
                      className="text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      placeholder="Data"
                      value={metadata.date}
                      onChange={(e) => updateMetadata({ date: e.target.value })}
                      className="text-xs"
                    />
                    <Input
                      placeholder="URL (opcional)"
                      value={metadata.url}
                      onChange={(e) => updateMetadata({ url: e.target.value })}
                      className="text-xs"
                    />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {/* Quote content */}
              <div className={cn(
                'leading-relaxed',
                metadata.style === 'minimal' && 'italic',
                metadata.size === 'small' && 'text-sm',
                metadata.size === 'medium' && 'text-base',
                metadata.size === 'large' && 'text-lg'
              )}>
                {content || (
                  <span className="text-muted-foreground italic">
                    Clique para adicionar uma citação...
                  </span>
                )}
              </div>
              
              {/* Attribution */}
              {(metadata.author || metadata.source || metadata.date) && (
                <div className={cn(
                  'text-sm text-muted-foreground mt-3 pt-2 border-t border-border/30',
                  metadata.alignment === 'center' && 'text-center',
                  metadata.alignment === 'right' && 'text-right'
                )}>
                  {metadata.author && (
                    <span className="font-medium">
                      — {metadata.author}
                    </span>
                  )}
                  {metadata.source && (
                    <span className={metadata.author ? 'ml-1' : ''}>
                      {metadata.author ? ', ' : '— '}
                      {metadata.url ? (
                        <a
                          href={metadata.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline inline-flex items-center gap-1"
                        >
                          {metadata.source}
                          <Link className="h-3 w-3" />
                        </a>
                      ) : (
                        metadata.source
                      )}
                    </span>
                  )}
                  {metadata.date && (
                    <span className="ml-1 opacity-75">
                      ({metadata.date})
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Quote indicator */}
      {!isEditing && content && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-1 text-xs text-muted-foreground bg-background/80 px-1 py-0.5 rounded">
            <Quote className="h-3 w-3" />
            <span>{metadata.style}</span>
            {metadata.author && <span>• {metadata.author}</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export default QuoteBlock;