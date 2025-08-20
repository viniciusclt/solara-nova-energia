import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Link,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Block } from '../../types/editor';

interface ParagraphBlockProps {
  block: Block;
  isSelected: boolean;
  isEditing: boolean;
  onUpdate: (content: string) => void;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

interface TextFormat {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  strikethrough: boolean;
  code: boolean;
}

export const ParagraphBlock: React.FC<ParagraphBlockProps> = ({
  block,
  isSelected,
  isEditing,
  onUpdate,
  onStartEdit,
  onStopEdit,
  onKeyDown,
}) => {
  const [content, setContent] = useState(block.content);
  const [showToolbar, setShowToolbar] = useState(false);
  const [textFormat, setTextFormat] = useState<TextFormat>({
    bold: false,
    italic: false,
    underline: false,
    strikethrough: false,
    code: false,
  });
  const [alignment, setAlignment] = useState<'left' | 'center' | 'right' | 'justify'>('left');
  
  const editorRef = useRef<HTMLDivElement>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isEditing && editorRef.current) {
      editorRef.current.focus();
      // Posicionar cursor no final
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(editorRef.current);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [isEditing]);

  useEffect(() => {
    setContent(block.content);
  }, [block.content]);

  const handleContentChange = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.innerHTML;
      setContent(newContent);
      onUpdate(newContent);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Atalhos de teclado para formatação
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          toggleFormat('bold');
          break;
        case 'i':
          e.preventDefault();
          toggleFormat('italic');
          break;
        case 'u':
          e.preventDefault();
          toggleFormat('underline');
          break;
        case '`':
          e.preventDefault();
          toggleFormat('code');
          break;
      }
    }

    // Enter para sair da edição
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onStopEdit();
    }

    // Escape para cancelar edição
    if (e.key === 'Escape') {
      e.preventDefault();
      setContent(block.content);
      if (editorRef.current) {
        editorRef.current.innerHTML = block.content;
      }
      onStopEdit();
    }

    onKeyDown?.(e);
  };

  const toggleFormat = (format: keyof TextFormat) => {
    const command = format === 'code' ? 'insertHTML' : format;
    
    if (format === 'code') {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const selectedText = range.toString();
        if (selectedText) {
          const codeElement = document.createElement('code');
          codeElement.textContent = selectedText;
          codeElement.className = 'bg-muted px-1 py-0.5 rounded text-sm font-mono';
          range.deleteContents();
          range.insertNode(codeElement);
          selection.removeAllRanges();
          handleContentChange();
        }
      }
    } else {
      document.execCommand(command);
      handleContentChange();
    }
    
    setTextFormat(prev => ({
      ...prev,
      [format]: !prev[format]
    }));
  };

  const setTextAlignment = (align: typeof alignment) => {
    setAlignment(align);
    const alignCommand = {
      left: 'justifyLeft',
      center: 'justifyCenter',
      right: 'justifyRight',
      justify: 'justifyFull'
    }[align];
    
    document.execCommand(alignCommand);
    handleContentChange();
  };

  const insertLink = () => {
    const url = prompt('Digite a URL:');
    if (url) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const selectedText = range.toString() || url;
        
        const linkElement = document.createElement('a');
        linkElement.href = url;
        linkElement.textContent = selectedText;
        linkElement.className = 'text-primary underline hover:text-primary/80';
        linkElement.target = '_blank';
        linkElement.rel = 'noopener noreferrer';
        
        range.deleteContents();
        range.insertNode(linkElement);
        selection.removeAllRanges();
        handleContentChange();
      }
    }
  };

  const handleMouseUp = () => {
    if (isEditing) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0 && !selection.isCollapsed) {
        setShowToolbar(true);
      } else {
        setShowToolbar(false);
      }
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Não sair da edição se o foco foi para a toolbar
    if (toolbarRef.current && toolbarRef.current.contains(e.relatedTarget as Node)) {
      return;
    }
    
    setTimeout(() => {
      setShowToolbar(false);
      onStopEdit();
    }, 100);
  };

  const getAlignmentIcon = () => {
    switch (alignment) {
      case 'center':
        return AlignCenter;
      case 'right':
        return AlignRight;
      case 'justify':
        return AlignJustify;
      default:
        return AlignLeft;
    }
  };

  const AlignmentIcon = getAlignmentIcon();

  return (
    <div className="relative group">
      {/* Floating Toolbar */}
      {showToolbar && isEditing && (
        <div
          ref={toolbarRef}
          className="absolute -top-12 left-1/2 transform -translate-x-1/2 z-50 bg-background border rounded-lg shadow-lg p-1 flex items-center gap-1"
          onMouseDown={(e) => e.preventDefault()}
        >
          <Button
            variant={textFormat.bold ? 'default' : 'ghost'}
            size="sm"
            onClick={() => toggleFormat('bold')}
            className="h-8 w-8 p-0"
          >
            <Bold className="h-3 w-3" />
          </Button>
          
          <Button
            variant={textFormat.italic ? 'default' : 'ghost'}
            size="sm"
            onClick={() => toggleFormat('italic')}
            className="h-8 w-8 p-0"
          >
            <Italic className="h-3 w-3" />
          </Button>
          
          <Button
            variant={textFormat.underline ? 'default' : 'ghost'}
            size="sm"
            onClick={() => toggleFormat('underline')}
            className="h-8 w-8 p-0"
          >
            <Underline className="h-3 w-3" />
          </Button>
          
          <Button
            variant={textFormat.strikethrough ? 'default' : 'ghost'}
            size="sm"
            onClick={() => toggleFormat('strikethrough')}
            className="h-8 w-8 p-0"
          >
            <Strikethrough className="h-3 w-3" />
          </Button>
          
          <Button
            variant={textFormat.code ? 'default' : 'ghost'}
            size="sm"
            onClick={() => toggleFormat('code')}
            className="h-8 w-8 p-0"
          >
            <Code className="h-3 w-3" />
          </Button>
          
          <div className="w-px h-6 bg-border mx-1" />
          
          <Button
            variant="ghost"
            size="sm"
            onClick={insertLink}
            className="h-8 w-8 p-0"
          >
            <Link className="h-3 w-3" />
          </Button>
          
          <div className="w-px h-6 bg-border mx-1" />
          
          <Button
            variant={alignment === 'left' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTextAlignment('left')}
            className="h-8 w-8 p-0"
          >
            <AlignLeft className="h-3 w-3" />
          </Button>
          
          <Button
            variant={alignment === 'center' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTextAlignment('center')}
            className="h-8 w-8 p-0"
          >
            <AlignCenter className="h-3 w-3" />
          </Button>
          
          <Button
            variant={alignment === 'right' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTextAlignment('right')}
            className="h-8 w-8 p-0"
          >
            <AlignRight className="h-3 w-3" />
          </Button>
          
          <Button
            variant={alignment === 'justify' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setTextAlignment('justify')}
            className="h-8 w-8 p-0"
          >
            <AlignJustify className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Content */}
      <div
        className={cn(
          'min-h-[2.5rem] px-3 py-2 rounded-md transition-all duration-200',
          'hover:bg-muted/50',
          isSelected && 'ring-2 ring-primary/20 bg-primary/5',
          isEditing && 'bg-background border-2 border-primary/30',
          !isEditing && 'cursor-pointer'
        )}
        onClick={!isEditing ? onStartEdit : undefined}
      >
        {isEditing ? (
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            className={cn(
              'outline-none min-h-[1.5rem] text-sm leading-relaxed',
              `text-${alignment}`
            )}
            dangerouslySetInnerHTML={{ __html: content }}
            onInput={handleContentChange}
            onKeyDown={handleKeyDown}
            onMouseUp={handleMouseUp}
            onBlur={handleBlur}
            style={{ textAlign: alignment }}
          />
        ) : (
          <div
            className={cn(
              'text-sm leading-relaxed min-h-[1.5rem]',
              !content && 'text-muted-foreground'
            )}
            style={{ textAlign: alignment }}
            dangerouslySetInnerHTML={{
              __html: content || 'Clique para adicionar texto...'
            }}
          />
        )}
      </div>

      {/* Alignment indicator */}
      {alignment !== 'left' && !isEditing && (
        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <AlignmentIcon className="h-3 w-3 text-muted-foreground" />
        </div>
      )}
    </div>
  );
};

export default ParagraphBlock;