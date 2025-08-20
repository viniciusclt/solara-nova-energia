import React, { useState, useRef, useEffect } from 'react';
import { PlaybookBlock } from '../../types/editor';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { 
  ChevronDown, 
  ChevronRight, 
  Info, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Lightbulb,
  Trash2,
  Settings,
  Minus
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

interface SpecialBlockProps {
  block: PlaybookBlock;
  onUpdate: (blockId: string, updates: Partial<PlaybookBlock>) => void;
  onDelete: (blockId: string) => void;
  onAddBlock: (afterBlockId: string, type: string) => void;
  isSelected: boolean;
  onSelect: (blockId: string) => void;
}

export const SpecialBlock: React.FC<SpecialBlockProps> = ({
  block,
  onUpdate,
  onDelete,
  onAddBlock,
  isSelected,
  onSelect
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditingTitle && titleRef.current) {
      titleRef.current.focus();
    }
    if (isEditingContent && contentRef.current) {
      contentRef.current.focus();
    }
  }, [isEditingTitle, isEditingContent]);

  const handleTextChange = (field: string, value: string) => {
    onUpdate(block.id, {
      content: { ...block.content, [field]: value }
    });
  };

  const handleCalloutTypeChange = (calloutType: string) => {
    onUpdate(block.id, {
      content: { ...block.content, calloutType }
    });
  };

  const getCalloutIcon = (type: string) => {
    switch (type) {
      case 'info':
        return <Info className="h-5 w-5" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5" />;
      case 'success':
        return <CheckCircle className="h-5 w-5" />;
      case 'error':
        return <XCircle className="h-5 w-5" />;
      case 'tip':
        return <Lightbulb className="h-5 w-5" />;
      default:
        return <Info className="h-5 w-5" />;
    }
  };

  const getCalloutStyles = (type: string) => {
    switch (type) {
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-200 text-blue-900',
          icon: 'text-blue-600'
        };
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200 text-yellow-900',
          icon: 'text-yellow-600'
        };
      case 'success':
        return {
          container: 'bg-green-50 border-green-200 text-green-900',
          icon: 'text-green-600'
        };
      case 'error':
        return {
          container: 'bg-red-50 border-red-200 text-red-900',
          icon: 'text-red-600'
        };
      case 'tip':
        return {
          container: 'bg-purple-50 border-purple-200 text-purple-900',
          icon: 'text-purple-600'
        };
      default:
        return {
          container: 'bg-gray-50 border-gray-200 text-gray-900',
          icon: 'text-gray-600'
        };
    }
  };

  const renderCallout = () => {
    const calloutType = block.content.calloutType || 'info';
    const styles = getCalloutStyles(calloutType);
    
    return (
      <Card className={cn('border-l-4', styles.container)}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={cn('flex-shrink-0 mt-0.5', styles.icon)}>
              {getCalloutIcon(calloutType)}
            </div>
            <div className="flex-1">
              {isEditingContent ? (
                <Textarea
                  ref={contentRef}
                  value={block.content.text || ''}
                  onChange={(e) => handleTextChange('text', e.target.value)}
                  onBlur={() => setIsEditingContent(false)}
                  className="border-none shadow-none p-0 resize-none bg-transparent"
                  placeholder="Digite o conteúdo do callout..."
                  rows={3}
                />
              ) : (
                <div
                  className="cursor-text min-h-[3rem] p-2 rounded hover:bg-black/5"
                  onClick={() => {
                    setIsEditingContent(true);
                    onSelect(block.id);
                  }}
                >
                  {block.content.text || (
                    <span className="text-gray-500">Digite o conteúdo do callout...</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderToggle = () => {
    return (
      <div className="border rounded-lg">
        <div
          className="flex items-center gap-2 p-3 cursor-pointer hover:bg-gray-50"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
          
          {isEditingTitle ? (
            <Input
              ref={titleRef}
              value={block.content.title || ''}
              onChange={(e) => handleTextChange('title', e.target.value)}
              onBlur={() => setIsEditingTitle(false)}
              className="border-none shadow-none p-0 h-auto font-medium"
              placeholder="Título do toggle..."
            />
          ) : (
            <div
              className="flex-1 font-medium cursor-text p-1 rounded hover:bg-gray-100"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingTitle(true);
                onSelect(block.id);
              }}
            >
              {block.content.title || (
                <span className="text-gray-500">Título do toggle...</span>
              )}
            </div>
          )}
        </div>
        
        {isExpanded && (
          <div className="border-t p-3">
            {isEditingContent ? (
              <Textarea
                ref={contentRef}
                value={block.content.content || ''}
                onChange={(e) => handleTextChange('content', e.target.value)}
                onBlur={() => setIsEditingContent(false)}
                className="w-full border-none shadow-none p-0 resize-none"
                placeholder="Conteúdo do toggle..."
                rows={4}
              />
            ) : (
              <div
                className="cursor-text min-h-[4rem] p-2 rounded hover:bg-gray-50"
                onClick={() => {
                  setIsEditingContent(true);
                  onSelect(block.id);
                }}
              >
                {block.content.content || (
                  <span className="text-gray-500">Conteúdo do toggle...</span>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  const renderDivider = () => {
    return (
      <div className="flex items-center justify-center py-4">
        <Separator className="flex-1" />
        <div className="px-4">
          <Minus className="h-4 w-4 text-gray-400" />
        </div>
        <Separator className="flex-1" />
      </div>
    );
  };

  const SettingsPanel = () => {
    if (block.type === 'callout') {
      return (
        <div className="p-4 w-64">
          <div>
            <label className="text-sm font-medium">Tipo de Callout</label>
            <Select
              value={block.content.calloutType || 'info'}
              onValueChange={handleCalloutTypeChange}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="info">Informação</SelectItem>
                <SelectItem value="warning">Aviso</SelectItem>
                <SelectItem value="success">Sucesso</SelectItem>
                <SelectItem value="error">Erro</SelectItem>
                <SelectItem value="tip">Dica</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      );
    }
    
    return (
      <div className="p-4">
        <p className="text-sm text-gray-500">Nenhuma configuração disponível</p>
      </div>
    );
  };

  const renderContent = () => {
    switch (block.type) {
      case 'callout':
        return renderCallout();
      case 'toggle':
        return renderToggle();
      case 'divider':
        return renderDivider();
      default:
        return null;
    }
  };

  return (
    <div className="group relative">
      {/* Toolbar de ações do bloco */}
      <div className="absolute -left-12 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 z-10">
        {block.type !== 'divider' && (
          <Popover open={showSettings} onOpenChange={setShowSettings}>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
              >
                <Settings className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" side="left">
              <SettingsPanel />
            </PopoverContent>
          </Popover>
        )}
        
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
      <div className={cn('ml-2', {
        'ring-2 ring-blue-500 ring-opacity-50 rounded p-2': isSelected && block.type !== 'divider'
      })}>
        {renderContent()}
      </div>
    </div>
  );
};