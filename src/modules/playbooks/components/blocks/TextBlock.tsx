import React, { useState, useRef, useEffect } from 'react';
import { PlaybookBlock } from '../../types/editor';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bold, Italic, Underline, AlignLeft, AlignCenter, AlignRight, Type, Plus, Trash2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';

interface TextBlockProps {
  block: PlaybookBlock;
  onUpdate: (blockId: string, updates: Partial<PlaybookBlock>) => void;
  onDelete: (blockId: string) => void;
  onAddBlock: (afterBlockId: string, type: string) => void;
  isSelected: boolean;
  onSelect: (blockId: string) => void;
}

export const TextBlock: React.FC<TextBlockProps> = ({
  block,
  onUpdate,
  onDelete,
  onAddBlock,
  isSelected,
  onSelect
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [showFormatting, setShowFormatting] = useState(false);
  const textRef = useRef<HTMLTextAreaElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && textRef.current) {
      textRef.current.focus();
      textRef.current.setSelectionRange(textRef.current.value.length, textRef.current.value.length);
    }
  }, [isEditing]);

  const handleTextChange = (value: string) => {
    onUpdate(block.id, {
      content: { ...block.content, text: value }
    });
  };

  const handleStyleChange = (styleKey: string, value: string | number | boolean) => {
    onUpdate(block.id, {
      styling: { ...block.styling, [styleKey]: value }
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      setIsEditing(false);
      onAddBlock(block.id, 'paragraph');
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
    }
  };

  const getTextElement = () => {
    const text = block.content.text || '';
    const styling = block.styling || {};
    
    const className = cn(
      'w-full outline-none transition-all duration-200',
      {
        'text-3xl font-bold': block.type === 'heading1',
        'text-2xl font-semibold': block.type === 'heading2',
        'text-xl font-medium': block.type === 'heading3',
        'text-base': block.type === 'paragraph',
        'border-l-4 border-blue-500 pl-4 italic bg-blue-50': block.type === 'quote',
        'font-mono bg-gray-100 p-3 rounded': block.type === 'code',
        'font-bold': styling.fontWeight === 'bold',
        'italic': styling.fontStyle === 'italic',
        'underline': styling.textDecoration === 'underline',
        'text-left': styling.textAlign === 'left',
        'text-center': styling.textAlign === 'center',
        'text-right': styling.textAlign === 'right',
        'text-sm': styling.fontSize === 'small',
        'text-base': styling.fontSize === 'normal',
        'text-lg': styling.fontSize === 'large',
        'ring-2 ring-blue-500 ring-opacity-50': isSelected
      }
    );

    if (isEditing) {
      if (block.type === 'paragraph' || block.type === 'quote') {
        return (
          <Textarea
            ref={textRef}
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            onBlur={() => setIsEditing(false)}
            onKeyDown={handleKeyDown}
            className={cn(className, 'min-h-[100px] resize-none')}
            placeholder={getPlaceholder()}
          />
        );
      } else {
        return (
          <Input
            ref={inputRef}
            value={text}
            onChange={(e) => handleTextChange(e.target.value)}
            onBlur={() => setIsEditing(false)}
            onKeyDown={handleKeyDown}
            className={className}
            placeholder={getPlaceholder()}
          />
        );
      }
    }

    return (
      <div
        className={cn(className, 'cursor-text min-h-[1.5rem] p-2 rounded hover:bg-gray-50')}
        onClick={() => {
          setIsEditing(true);
          onSelect(block.id);
        }}
      >
        {text || (
          <span className="text-gray-400">{getPlaceholder()}</span>
        )}
      </div>
    );
  };

  const getPlaceholder = () => {
    switch (block.type) {
      case 'heading1':
        return 'Título 1';
      case 'heading2':
        return 'Título 2';
      case 'heading3':
        return 'Título 3';
      case 'paragraph':
        return 'Digite seu texto aqui...';
      case 'quote':
        return 'Citação...';
      case 'code':
        return 'Código...';
      default:
        return 'Digite aqui...';
    }
  };

  const FormatToolbar = () => (
    <div className="flex items-center gap-1 p-2 bg-white border rounded-lg shadow-lg">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleStyleChange('fontWeight', 
          block.styling?.fontWeight === 'bold' ? 'normal' : 'bold'
        )}
        className={cn({
          'bg-gray-200': block.styling?.fontWeight === 'bold'
        })}
      >
        <Bold className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleStyleChange('fontStyle', 
          block.styling?.fontStyle === 'italic' ? 'normal' : 'italic'
        )}
        className={cn({
          'bg-gray-200': block.styling?.fontStyle === 'italic'
        })}
      >
        <Italic className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleStyleChange('textDecoration', 
          block.styling?.textDecoration === 'underline' ? 'none' : 'underline'
        )}
        className={cn({
          'bg-gray-200': block.styling?.textDecoration === 'underline'
        })}
      >
        <Underline className="h-4 w-4" />
      </Button>
      
      <Separator orientation="vertical" className="h-6" />
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleStyleChange('textAlign', 'left')}
        className={cn({
          'bg-gray-200': block.styling?.textAlign === 'left'
        })}
      >
        <AlignLeft className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleStyleChange('textAlign', 'center')}
        className={cn({
          'bg-gray-200': block.styling?.textAlign === 'center'
        })}
      >
        <AlignCenter className="h-4 w-4" />
      </Button>
      
      <Button
        variant="ghost"
        size="sm"
        onClick={() => handleStyleChange('textAlign', 'right')}
        className={cn({
          'bg-gray-200': block.styling?.textAlign === 'right'
        })}
      >
        <AlignRight className="h-4 w-4" />
      </Button>
      
      <Separator orientation="vertical" className="h-6" />
      
      <Select
        value={block.styling?.fontSize || 'normal'}
        onValueChange={(value) => handleStyleChange('fontSize', value)}
      >
        <SelectTrigger className="w-20 h-8">
          <Type className="h-4 w-4" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="small">Pequeno</SelectItem>
          <SelectItem value="normal">Normal</SelectItem>
          <SelectItem value="large">Grande</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="group relative">
      {/* Toolbar de ações do bloco */}
      <div className="absolute -left-12 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onAddBlock(block.id, 'paragraph')}
          className="h-6 w-6 p-0"
        >
          <Plus className="h-3 w-3" />
        </Button>
        
        <Popover open={showFormatting} onOpenChange={setShowFormatting}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              <Type className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" side="left">
            <FormatToolbar />
          </PopoverContent>
        </Popover>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(block.id)}
          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Conteúdo do bloco */}
      <div className="ml-2">
        {getTextElement()}
      </div>
    </div>
  );
};