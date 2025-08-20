import React, { useState, useRef, useEffect } from 'react';
import { Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import {
  Type,
  Hash,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Block } from '../../types/editor';

interface HeadingBlockProps {
  block: Block;
  isSelected: boolean;
  isEditing: boolean;
  onUpdate: (content: string, metadata?: Record<string, unknown>) => void;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;
type HeadingAlignment = 'left' | 'center' | 'right';

export const HeadingBlock: React.FC<HeadingBlockProps> = ({
  block,
  isSelected,
  isEditing,
  onUpdate,
  onStartEdit,
  onStopEdit,
  onKeyDown,
}) => {
  const [content, setContent] = useState(block.content);
  const [level, setLevel] = useState<HeadingLevel>(
    (block.metadata?.level as HeadingLevel) || 1
  );
  const [alignment, setAlignment] = useState<HeadingAlignment>(
    (block.metadata?.alignment as HeadingAlignment) || 'left'
  );
  const [showToolbar, setShowToolbar] = useState(false);
  
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
    setLevel((block.metadata?.level as HeadingLevel) || 1);
    setAlignment((block.metadata?.alignment as HeadingAlignment) || 'left');
  }, [block.content, block.metadata]);

  const handleContentChange = () => {
    if (editorRef.current) {
      const newContent = editorRef.current.textContent || '';
      setContent(newContent);
      onUpdate(newContent, { level, alignment });
    }
  };

  const handleLevelChange = (newLevel: string) => {
    const levelNum = parseInt(newLevel) as HeadingLevel;
    setLevel(levelNum);
    onUpdate(content, { level: levelNum, alignment });
  };

  const handleAlignmentChange = (newAlignment: HeadingAlignment) => {
    setAlignment(newAlignment);
    onUpdate(content, { level, alignment: newAlignment });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Atalhos de teclado
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
        editorRef.current.textContent = block.content;
      }
      onStopEdit();
    }

    // Atalhos para níveis de heading
    if (e.ctrlKey && e.key >= '1' && e.key <= '6') {
      e.preventDefault();
      handleLevelChange(e.key);
    }

    onKeyDown?.(e);
  };

  const toggleFormat = (format: 'bold' | 'italic' | 'underline') => {
    document.execCommand(format);
    handleContentChange();
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

  const getHeadingStyles = (level: HeadingLevel) => {
    const baseStyles = 'font-bold leading-tight';
    
    switch (level) {
      case 1:
        return `${baseStyles} text-3xl md:text-4xl`;
      case 2:
        return `${baseStyles} text-2xl md:text-3xl`;
      case 3:
        return `${baseStyles} text-xl md:text-2xl`;
      case 4:
        return `${baseStyles} text-lg md:text-xl`;
      case 5:
        return `${baseStyles} text-base md:text-lg`;
      case 6:
        return `${baseStyles} text-sm md:text-base text-muted-foreground`;
      default:
        return `${baseStyles} text-2xl`;
    }
  };

  const getHeadingTag = () => {
    switch (level) {
      case 1: return 'h1';
      case 2: return 'h2';
      case 3: return 'h3';
      case 4: return 'h4';
      case 5: return 'h5';
      case 6: return 'h6';
      default: return 'h1';
    }
  };

  const HeadingTag = getHeadingTag() as keyof JSX.IntrinsicElements;

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
            variant="ghost"
            size="sm"
            onClick={() => toggleFormat('bold')}
            className="h-8 w-8 p-0"
          >
            <Bold className="h-3 w-3" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleFormat('italic')}
            className="h-8 w-8 p-0"
          >
            <Italic className="h-3 w-3" />
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleFormat('underline')}
            className="h-8 w-8 p-0"
          >
            <Underline className="h-3 w-3" />
          </Button>
          
          <div className="w-px h-6 bg-border mx-1" />
          
          <Button
            variant={alignment === 'left' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleAlignmentChange('left')}
            className="h-8 w-8 p-0"
          >
            <AlignLeft className="h-3 w-3" />
          </Button>
          
          <Button
            variant={alignment === 'center' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleAlignmentChange('center')}
            className="h-8 w-8 p-0"
          >
            <AlignCenter className="h-3 w-3" />
          </Button>
          
          <Button
            variant={alignment === 'right' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => handleAlignmentChange('right')}
            className="h-8 w-8 p-0"
          >
            <AlignRight className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Level and Alignment Controls */}
      {isSelected && !isEditing && (
        <div className="absolute -top-10 left-0 flex items-center gap-2 bg-background border rounded-lg shadow-sm p-1">
          <Select value={level.toString()} onValueChange={handleLevelChange}>
            <SelectTrigger className="h-8 w-16 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">H1</SelectItem>
              <SelectItem value="2">H2</SelectItem>
              <SelectItem value="3">H3</SelectItem>
              <SelectItem value="4">H4</SelectItem>
              <SelectItem value="5">H5</SelectItem>
              <SelectItem value="6">H6</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex items-center">
            <Button
              variant={alignment === 'left' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleAlignmentChange('left')}
              className="h-8 w-8 p-0"
            >
              <AlignLeft className="h-3 w-3" />
            </Button>
            
            <Button
              variant={alignment === 'center' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleAlignmentChange('center')}
              className="h-8 w-8 p-0"
            >
              <AlignCenter className="h-3 w-3" />
            </Button>
            
            <Button
              variant={alignment === 'right' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => handleAlignmentChange('right')}
              className="h-8 w-8 p-0"
            >
              <AlignRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}

      {/* Content */}
      <div
        className={cn(
          'min-h-[3rem] px-3 py-2 rounded-md transition-all duration-200',
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
              'outline-none min-h-[2rem]',
              getHeadingStyles(level),
              `text-${alignment}`
            )}
            style={{ textAlign: alignment }}
            onInput={handleContentChange}
            onKeyDown={handleKeyDown}
            onMouseUp={handleMouseUp}
            onBlur={handleBlur}
          >
            {content}
          </div>
        ) : (
          <HeadingTag
            className={cn(
              getHeadingStyles(level),
              !content && 'text-muted-foreground',
              `text-${alignment}`
            )}
            style={{ textAlign: alignment }}
          >
            {content || `Título H${level}`}
          </HeadingTag>
        )}
      </div>

      {/* Level indicator */}
      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-1 text-xs text-muted-foreground bg-background/80 px-1 py-0.5 rounded">
          <Hash className="h-3 w-3" />
          <span>H{level}</span>
        </div>
      </div>
    </div>
  );
};

export default HeadingBlock;