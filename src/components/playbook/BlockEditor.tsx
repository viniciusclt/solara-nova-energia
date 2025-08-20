// ============================================================================
// BlockEditor - Editor de blocos individuais para playbooks
// ============================================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
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
  Checkbox
} from '@/components/ui/checkbox';
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
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import {
  MoreHorizontal,
  MessageSquare,
  Copy,
  Trash2,
  Edit3,
  ChevronDown,
  ChevronRight,
  Bold,
  Italic,
  Underline,
  Code,
  Link,
  Image,
  Video,
  File,
  Upload,
  ExternalLink,
  Check,
  X,
  Plus,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight
} from 'lucide-react';
import {
  BlockEditorProps,
  PlaybookBlock,
  PlaybookRichText,
  PlaybookBlockType
} from '@/types/playbook';

/**
 * Editor de blocos individuais
 */
export const BlockEditor: React.FC<BlockEditorProps> = ({
  block,
  isSelected,
  isEditing,
  readOnly = false,
  comments = [],
  onUpdate,
  onDelete,
  onDuplicate,
  onSelect,
  onStartEditing,
  onStopEditing,
  onAddComment,
  className
}) => {
  // Local state
  const [localContent, setLocalContent] = useState('');
  const [isToggleOpen, setIsToggleOpen] = useState(false);
  const [showCommentDialog, setShowCommentDialog] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [isHovered, setIsHovered] = useState(false);
  const [showFormatting, setShowFormatting] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [selectionRange, setSelectionRange] = useState<{ start: number; end: number } | null>(null);

  // Refs
  const contentRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Extract content from block properties
  const getBlockContent = useCallback(() => {
    const props = block.properties;
    
    switch (block.type) {
      case 'paragraph':
        return props.paragraph?.rich_text?.[0]?.plain_text || '';
      case 'heading_1':
      case 'heading_2':
      case 'heading_3':
        return props[block.type]?.rich_text?.[0]?.plain_text || '';
      case 'bulleted_list_item':
      case 'numbered_list_item':
        return props[block.type]?.rich_text?.[0]?.plain_text || '';
      case 'to_do':
        return props.to_do?.rich_text?.[0]?.plain_text || '';
      case 'toggle':
        return props.toggle?.rich_text?.[0]?.plain_text || '';
      case 'quote':
        return props.quote?.rich_text?.[0]?.plain_text || '';
      case 'code':
        return props.code?.rich_text?.[0]?.plain_text || '';
      case 'callout':
        return props.callout?.rich_text?.[0]?.plain_text || '';
      case 'image':
        return props.image?.external?.url || '';
      case 'video':
        return props.video?.external?.url || '';
      case 'file':
        return props.file?.external?.url || '';
      case 'bookmark':
        return props.bookmark?.url || '';
      case 'embed':
        return props.embed?.url || '';
      default:
        return '';
    }
  }, [block]);

  // Initialize local content
  useEffect(() => {
    setLocalContent(getBlockContent());
  }, [getBlockContent]);

  // Handle content update
  const handleContentUpdate = useCallback((newContent: string) => {
    setLocalContent(newContent);
    
    // Update block properties based on type
    const updatedProperties = { ...block.properties };
    
    switch (block.type) {
      case 'paragraph':
        updatedProperties.paragraph = {
          rich_text: [{
            type: 'text',
            text: { content: newContent },
            annotations: {},
            plain_text: newContent
          }]
        };
        break;
      case 'heading_1':
      case 'heading_2':
      case 'heading_3':
        updatedProperties[block.type] = {
          rich_text: [{
            type: 'text',
            text: { content: newContent },
            annotations: {},
            plain_text: newContent
          }]
        };
        break;
      case 'bulleted_list_item':
      case 'numbered_list_item':
        updatedProperties[block.type] = {
          rich_text: [{
            type: 'text',
            text: { content: newContent },
            annotations: {},
            plain_text: newContent
          }]
        };
        break;
      case 'to_do':
        updatedProperties.to_do = {
          ...updatedProperties.to_do,
          rich_text: [{
            type: 'text',
            text: { content: newContent },
            annotations: {},
            plain_text: newContent
          }]
        };
        break;
      case 'toggle':
        updatedProperties.toggle = {
          rich_text: [{
            type: 'text',
            text: { content: newContent },
            annotations: {},
            plain_text: newContent
          }]
        };
        break;
      case 'quote':
        updatedProperties.quote = {
          rich_text: [{
            type: 'text',
            text: { content: newContent },
            annotations: {},
            plain_text: newContent
          }]
        };
        break;
      case 'code':
        updatedProperties.code = {
          ...updatedProperties.code,
          rich_text: [{
            type: 'text',
            text: { content: newContent },
            annotations: {},
            plain_text: newContent
          }]
        };
        break;
      case 'callout':
        updatedProperties.callout = {
          ...updatedProperties.callout,
          rich_text: [{
            type: 'text',
            text: { content: newContent },
            annotations: {},
            plain_text: newContent
          }]
        };
        break;
      case 'image':
        updatedProperties.image = {
          ...updatedProperties.image,
          external: { url: newContent }
        };
        break;
      case 'video':
        updatedProperties.video = {
          ...updatedProperties.video,
          external: { url: newContent }
        };
        break;
      case 'file':
        updatedProperties.file = {
          ...updatedProperties.file,
          external: { url: newContent }
        };
        break;
      case 'bookmark':
        updatedProperties.bookmark = {
          ...updatedProperties.bookmark,
          url: newContent
        };
        break;
      case 'embed':
        updatedProperties.embed = {
          ...updatedProperties.embed,
          url: newContent
        };
        break;
    }
    
    onUpdate({ properties: updatedProperties });
  }, [block, onUpdate]);

  // Handle checkbox toggle for to-do items
  const handleCheckboxToggle = useCallback((checked: boolean) => {
    const updatedProperties = {
      ...block.properties,
      to_do: {
        ...block.properties.to_do,
        checked
      }
    };
    onUpdate({ properties: updatedProperties });
  }, [block.properties, onUpdate]);

  // Handle toggle expand/collapse
  const handleToggleExpand = useCallback(() => {
    setIsToggleOpen(!isToggleOpen);
  }, [isToggleOpen]);

  // Handle comment addition
  const handleAddComment = useCallback(() => {
    if (commentText.trim() && onAddComment) {
      onAddComment(commentText.trim());
      setCommentText('');
      setShowCommentDialog(false);
    }
  }, [commentText, onAddComment]);

  // Handle text selection for formatting
  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (selection && selection.toString()) {
      setSelectedText(selection.toString());
      setSelectionRange({
        start: selection.anchorOffset,
        end: selection.focusOffset
      });
      setShowFormatting(true);
    } else {
      setShowFormatting(false);
    }
  }, []);

  // Apply text formatting
  const applyFormatting = useCallback((format: 'bold' | 'italic' | 'underline' | 'code' | 'link') => {
    // Implementation for text formatting would go here
    // This would involve updating the rich_text annotations
    console.log('Apply formatting:', format, selectedText);
    setShowFormatting(false);
  }, [selectedText]);

  // Render block content based on type
  const renderBlockContent = () => {
    const isEditMode = isSelected && isEditing && !readOnly;
    
    switch (block.type) {
      case 'paragraph':
        return isEditMode ? (
          <Textarea
            ref={textareaRef}
            value={localContent}
            onChange={(e) => handleContentUpdate(e.target.value)}
            onBlur={onStopEditing}
            onMouseUp={handleTextSelection}
            placeholder="Digite algo..."
            className="w-full border-none p-0 bg-transparent resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
            autoFocus
          />
        ) : (
          <div
            onClick={onSelect}
            onDoubleClick={onStartEditing}
            className="cursor-text min-h-[1.5rem] whitespace-pre-wrap"
          >
            {localContent || 'Clique para editar...'}
          </div>
        );
      
      case 'heading_1':
        return isEditMode ? (
          <Input
            ref={inputRef}
            value={localContent}
            onChange={(e) => handleContentUpdate(e.target.value)}
            onBlur={onStopEditing}
            placeholder="Título 1"
            className="text-3xl font-bold border-none p-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            autoFocus
          />
        ) : (
          <h1
            onClick={onSelect}
            onDoubleClick={onStartEditing}
            className="text-3xl font-bold cursor-text"
          >
            {localContent || 'Título 1'}
          </h1>
        );
      
      case 'heading_2':
        return isEditMode ? (
          <Input
            ref={inputRef}
            value={localContent}
            onChange={(e) => handleContentUpdate(e.target.value)}
            onBlur={onStopEditing}
            placeholder="Título 2"
            className="text-2xl font-semibold border-none p-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            autoFocus
          />
        ) : (
          <h2
            onClick={onSelect}
            onDoubleClick={onStartEditing}
            className="text-2xl font-semibold cursor-text"
          >
            {localContent || 'Título 2'}
          </h2>
        );
      
      case 'heading_3':
        return isEditMode ? (
          <Input
            ref={inputRef}
            value={localContent}
            onChange={(e) => handleContentUpdate(e.target.value)}
            onBlur={onStopEditing}
            placeholder="Título 3"
            className="text-xl font-medium border-none p-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
            autoFocus
          />
        ) : (
          <h3
            onClick={onSelect}
            onDoubleClick={onStartEditing}
            className="text-xl font-medium cursor-text"
          >
            {localContent || 'Título 3'}
          </h3>
        );
      
      case 'bulleted_list_item':
        return (
          <div className="flex items-start gap-2">
            <span className="mt-2 w-1 h-1 bg-current rounded-full flex-shrink-0"></span>
            {isEditMode ? (
              <Textarea
                ref={textareaRef}
                value={localContent}
                onChange={(e) => handleContentUpdate(e.target.value)}
                onBlur={onStopEditing}
                placeholder="Item da lista"
                className="flex-1 border-none p-0 bg-transparent resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
                autoFocus
              />
            ) : (
              <div
                onClick={onSelect}
                onDoubleClick={onStartEditing}
                className="flex-1 cursor-text min-h-[1.5rem]"
              >
                {localContent || 'Item da lista'}
              </div>
            )}
          </div>
        );
      
      case 'numbered_list_item':
        return (
          <div className="flex items-start gap-2">
            <span className="mt-0.5 text-sm text-muted-foreground flex-shrink-0">1.</span>
            {isEditMode ? (
              <Textarea
                ref={textareaRef}
                value={localContent}
                onChange={(e) => handleContentUpdate(e.target.value)}
                onBlur={onStopEditing}
                placeholder="Item numerado"
                className="flex-1 border-none p-0 bg-transparent resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
                autoFocus
              />
            ) : (
              <div
                onClick={onSelect}
                onDoubleClick={onStartEditing}
                className="flex-1 cursor-text min-h-[1.5rem]"
              >
                {localContent || 'Item numerado'}
              </div>
            )}
          </div>
        );
      
      case 'to_do': {
        const isChecked = block.properties.to_do?.checked || false;
        return (
          <div className="flex items-start gap-2">
            <Checkbox
              checked={isChecked}
              onCheckedChange={handleCheckboxToggle}
              disabled={readOnly}
              className="mt-0.5"
            />
            {isEditMode ? (
              <Textarea
                ref={textareaRef}
                value={localContent}
                onChange={(e) => handleContentUpdate(e.target.value)}
                onBlur={onStopEditing}
                placeholder="Tarefa"
                className={`flex-1 border-none p-0 bg-transparent resize-none focus-visible:ring-0 focus-visible:ring-offset-0 ${isChecked ? 'line-through text-muted-foreground' : ''}`}
                autoFocus
              />
            ) : (
              <div
                onClick={onSelect}
                onDoubleClick={onStartEditing}
                className={`flex-1 cursor-text min-h-[1.5rem] ${isChecked ? 'line-through text-muted-foreground' : ''}`}
              >
                {localContent || 'Tarefa'}
              </div>
            )}
          </div>
        );
      }
      
      case 'toggle':
        return (
          <div>
            <div className="flex items-center gap-2 cursor-pointer" onClick={handleToggleExpand}>
              {isToggleOpen ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
              {isEditMode ? (
                <Input
                  ref={inputRef}
                  value={localContent}
                  onChange={(e) => handleContentUpdate(e.target.value)}
                  onBlur={onStopEditing}
                  placeholder="Toggle"
                  className="border-none p-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                  autoFocus
                />
              ) : (
                <div
                  onClick={onSelect}
                  onDoubleClick={onStartEditing}
                  className="cursor-text"
                >
                  {localContent || 'Toggle'}
                </div>
              )}
            </div>
            {isToggleOpen && (
              <div className="ml-6 mt-2 p-2 border-l-2 border-muted">
                <div className="text-muted-foreground text-sm">Conteúdo do toggle...</div>
              </div>
            )}
          </div>
        );
      
      case 'quote':
        return (
          <blockquote className="border-l-4 border-primary pl-4 italic">
            {isEditMode ? (
              <Textarea
                ref={textareaRef}
                value={localContent}
                onChange={(e) => handleContentUpdate(e.target.value)}
                onBlur={onStopEditing}
                placeholder="Citação"
                className="w-full border-none p-0 bg-transparent resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
                autoFocus
              />
            ) : (
              <div
                onClick={onSelect}
                onDoubleClick={onStartEditing}
                className="cursor-text min-h-[1.5rem]"
              >
                {localContent || 'Citação'}
              </div>
            )}
          </blockquote>
        );
      
      case 'code': {
        const language = block.properties.code?.language || 'javascript';
        return (
          <div className="bg-muted rounded-md p-3">
            <div className="flex items-center justify-between mb-2">
              <Select
                value={language}
                onValueChange={(value) => {
                  const updatedProperties = {
                    ...block.properties,
                    code: {
                      ...block.properties.code,
                      language: value
                    }
                  };
                  onUpdate({ properties: updatedProperties });
                }}
                disabled={readOnly}
              >
                <SelectTrigger className="w-32 h-6 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="javascript">JavaScript</SelectItem>
                  <SelectItem value="typescript">TypeScript</SelectItem>
                  <SelectItem value="python">Python</SelectItem>
                  <SelectItem value="java">Java</SelectItem>
                  <SelectItem value="css">CSS</SelectItem>
                  <SelectItem value="html">HTML</SelectItem>
                  <SelectItem value="sql">SQL</SelectItem>
                  <SelectItem value="bash">Bash</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {isEditMode ? (
              <Textarea
                ref={textareaRef}
                value={localContent}
                onChange={(e) => handleContentUpdate(e.target.value)}
                onBlur={onStopEditing}
                placeholder="Código"
                className="w-full border-none p-0 bg-transparent resize-none focus-visible:ring-0 focus-visible:ring-offset-0 font-mono text-sm"
                autoFocus
              />
            ) : (
              <pre
                onClick={onSelect}
                onDoubleClick={onStartEditing}
                className="cursor-text font-mono text-sm whitespace-pre-wrap"
              >
                {localContent || 'Código'}
              </pre>
            )}
          </div>
        );
      }
      
      case 'callout': {
        const icon = block.properties.callout?.icon?.emoji || '💡';
        return (
          <div className="bg-accent/50 border border-accent rounded-md p-3">
            <div className="flex items-start gap-2">
              <span className="text-lg">{icon}</span>
              {isEditMode ? (
                <Textarea
                  ref={textareaRef}
                  value={localContent}
                  onChange={(e) => handleContentUpdate(e.target.value)}
                  onBlur={onStopEditing}
                  placeholder="Callout"
                  className="flex-1 border-none p-0 bg-transparent resize-none focus-visible:ring-0 focus-visible:ring-offset-0"
                  autoFocus
                />
              ) : (
                <div
                  onClick={onSelect}
                  onDoubleClick={onStartEditing}
                  className="flex-1 cursor-text min-h-[1.5rem]"
                >
                  {localContent || 'Callout'}
                </div>
              )}
            </div>
          </div>
        );
      }
      
      case 'divider':
        return <hr className="my-4 border-muted" />;
      
      case 'image':
        return (
          <div className="space-y-2">
            {isEditMode ? (
              <Input
                ref={inputRef}
                value={localContent}
                onChange={(e) => handleContentUpdate(e.target.value)}
                onBlur={onStopEditing}
                placeholder="URL da imagem"
                className="border-none p-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                autoFocus
              />
            ) : (
              <div
                onClick={onSelect}
                onDoubleClick={onStartEditing}
                className="cursor-pointer"
              >
                {localContent ? (
                  <img
                    src={localContent}
                    alt="Imagem"
                    className="max-w-full h-auto rounded-md"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                ) : (
                  <div className="border-2 border-dashed border-muted rounded-md p-8 text-center">
                    <Image className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">Clique para adicionar imagem</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      
      case 'video':
        return (
          <div className="space-y-2">
            {isEditMode ? (
              <Input
                ref={inputRef}
                value={localContent}
                onChange={(e) => handleContentUpdate(e.target.value)}
                onBlur={onStopEditing}
                placeholder="URL do vídeo"
                className="border-none p-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                autoFocus
              />
            ) : (
              <div
                onClick={onSelect}
                onDoubleClick={onStartEditing}
                className="cursor-pointer"
              >
                {localContent ? (
                  <video
                    src={localContent}
                    controls
                    className="max-w-full h-auto rounded-md"
                  />
                ) : (
                  <div className="border-2 border-dashed border-muted rounded-md p-8 text-center">
                    <Video className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">Clique para adicionar vídeo</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      
      case 'file':
        return (
          <div className="space-y-2">
            {isEditMode ? (
              <Input
                ref={inputRef}
                value={localContent}
                onChange={(e) => handleContentUpdate(e.target.value)}
                onBlur={onStopEditing}
                placeholder="URL do arquivo"
                className="border-none p-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                autoFocus
              />
            ) : (
              <div
                onClick={onSelect}
                onDoubleClick={onStartEditing}
                className="cursor-pointer"
              >
                {localContent ? (
                  <div className="flex items-center gap-2 p-3 border rounded-md hover:bg-accent/50">
                    <File className="h-5 w-5 text-muted-foreground" />
                    <span className="flex-1 truncate">{localContent}</span>
                    <ExternalLink className="h-4 w-4 text-muted-foreground" />
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-muted rounded-md p-8 text-center">
                    <File className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">Clique para adicionar arquivo</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      
      case 'bookmark':
        return (
          <div className="space-y-2">
            {isEditMode ? (
              <Input
                ref={inputRef}
                value={localContent}
                onChange={(e) => handleContentUpdate(e.target.value)}
                onBlur={onStopEditing}
                placeholder="URL do bookmark"
                className="border-none p-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
                autoFocus
              />
            ) : (
              <div
                onClick={onSelect}
                onDoubleClick={onStartEditing}
                className="cursor-pointer"
              >
                {localContent ? (
                  <div className="border rounded-md p-3 hover:bg-accent/50">
                    <div className="flex items-center gap-2">
                      <Link className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium truncate">{localContent}</span>
                      <ExternalLink className="h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-muted rounded-md p-8 text-center">
                    <Link className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-muted-foreground">Clique para adicionar bookmark</p>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      
      case 'table':
        return (
          <div className="border rounded-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="p-2 text-left border-r">Coluna 1</th>
                  <th className="p-2 text-left">Coluna 2</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 border-r border-t">Célula 1</td>
                  <td className="p-2 border-t">Célula 2</td>
                </tr>
              </tbody>
            </table>
          </div>
        );
      
      default:
        return (
          <div className="text-muted-foreground italic">
            Tipo de bloco não suportado: {block.type}
          </div>
        );
    }
  };

  return (
    <div
      className={`block-editor group relative ${isSelected ? 'ring-2 ring-primary ring-offset-2' : ''} ${className || ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Block Content */}
      <div className="relative">
        {renderBlockContent()}
        
        {/* Comments indicator */}
        {comments.length > 0 && (
          <div className="absolute -right-8 top-0">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger>
                  <Badge variant="secondary" className="h-5 w-5 p-0 rounded-full">
                    {comments.length}
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{comments.length} comentário(s)</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        )}
      </div>
      
      {/* Block Actions */}
      {!readOnly && (isHovered || isSelected) && (
        <div className="absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setShowCommentDialog(true)}>
                <MessageSquare className="h-4 w-4 mr-2" />
                Comentar
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onDuplicate}>
                <Copy className="h-4 w-4 mr-2" />
                Duplicar
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onDelete} className="text-destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Deletar
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      )}
      
      {/* Text Formatting Toolbar */}
      {showFormatting && selectedText && (
        <div className="absolute top-0 left-0 transform -translate-y-full bg-background border rounded-md shadow-md p-1 flex items-center gap-1 z-20">
          <Button size="sm" variant="ghost" onClick={() => applyFormatting('bold')}>
            <Bold className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => applyFormatting('italic')}>
            <Italic className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => applyFormatting('underline')}>
            <Underline className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => applyFormatting('code')}>
            <Code className="h-3 w-3" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => applyFormatting('link')}>
            <Link className="h-3 w-3" />
          </Button>
        </div>
      )}
      
      {/* Comment Dialog */}
      <Dialog open={showCommentDialog} onOpenChange={setShowCommentDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Adicionar comentário</DialogTitle>
            <DialogDescription>
              Adicione um comentário a este bloco
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Digite seu comentário..."
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCommentDialog(false)}>
                Cancelar
              </Button>
              <Button onClick={handleAddComment} disabled={!commentText.trim()}>
                Comentar
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BlockEditor;