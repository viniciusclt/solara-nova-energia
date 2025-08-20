import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui';
import {
  List,
  ListOrdered,
  Plus,
  Minus,
  ChevronRight,
  ChevronDown,
  GripVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Block } from '../../types/editor';

interface ListItem {
  id: string;
  content: string;
  level: number;
  collapsed?: boolean;
  children?: ListItem[];
}

interface ListBlockProps {
  block: Block;
  isSelected: boolean;
  isEditing: boolean;
  onUpdate: (content: string, metadata?: Record<string, unknown>) => void;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

type ListType = 'unordered' | 'ordered';

export const ListBlock: React.FC<ListBlockProps> = ({
  block,
  isSelected,
  isEditing,
  onUpdate,
  onStartEdit,
  onStopEdit,
  onKeyDown,
}) => {
  const [listType, setListType] = useState<ListType>(
    (block.metadata?.type as ListType) || 'unordered'
  );
  const [items, setItems] = useState<ListItem[]>(() => {
    try {
      return JSON.parse(block.content) || [{ id: '1', content: '', level: 0 }];
    } catch {
      return [{ id: '1', content: block.content || '', level: 0 }];
    }
  });
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null);
  
  const itemRefs = useRef<{ [key: string]: HTMLDivElement | null }>({});

  useEffect(() => {
    if (isEditing && items.length > 0 && !focusedItemId) {
      setFocusedItemId(items[0].id);
    }
  }, [isEditing, items, focusedItemId]);

  useEffect(() => {
    if (focusedItemId && itemRefs.current[focusedItemId]) {
      const element = itemRefs.current[focusedItemId];
      element?.focus();
      
      // Posicionar cursor no final
      const range = document.createRange();
      const selection = window.getSelection();
      range.selectNodeContents(element);
      range.collapse(false);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [focusedItemId]);

  const updateItems = (newItems: ListItem[]) => {
    setItems(newItems);
    onUpdate(JSON.stringify(newItems), { type: listType });
  };

  const updateItem = (itemId: string, content: string) => {
    const newItems = items.map(item => 
      item.id === itemId ? { ...item, content } : item
    );
    updateItems(newItems);
  };

  const addItem = (afterId?: string, level: number = 0) => {
    const newId = Date.now().toString();
    const newItem: ListItem = {
      id: newId,
      content: '',
      level,
    };

    if (afterId) {
      const index = items.findIndex(item => item.id === afterId);
      const newItems = [...items];
      newItems.splice(index + 1, 0, newItem);
      updateItems(newItems);
    } else {
      updateItems([...items, newItem]);
    }

    setFocusedItemId(newId);
  };

  const removeItem = (itemId: string) => {
    if (items.length <= 1) return;
    
    const itemIndex = items.findIndex(item => item.id === itemId);
    const newItems = items.filter(item => item.id !== itemId);
    updateItems(newItems);

    // Focar no item anterior ou próximo
    if (itemIndex > 0) {
      setFocusedItemId(newItems[itemIndex - 1]?.id);
    } else if (newItems.length > 0) {
      setFocusedItemId(newItems[0]?.id);
    }
  };

  const indentItem = (itemId: string) => {
    const newItems = items.map(item => 
      item.id === itemId && item.level < 3 
        ? { ...item, level: item.level + 1 }
        : item
    );
    updateItems(newItems);
  };

  const outdentItem = (itemId: string) => {
    const newItems = items.map(item => 
      item.id === itemId && item.level > 0 
        ? { ...item, level: item.level - 1 }
        : item
    );
    updateItems(newItems);
  };

  const toggleCollapse = (itemId: string) => {
    const newItems = items.map(item => 
      item.id === itemId 
        ? { ...item, collapsed: !item.collapsed }
        : item
    );
    updateItems(newItems);
  };

  const handleKeyDown = (e: React.KeyboardEvent, itemId: string) => {
    const itemIndex = items.findIndex(item => item.id === itemId);
    const currentItem = items[itemIndex];

    switch (e.key) {
      case 'Enter':
        e.preventDefault();
        if (currentItem.content.trim() === '') {
          // Se o item está vazio, sair da lista
          if (items.length === 1) {
            onStopEdit();
          } else {
            removeItem(itemId);
          }
        } else {
          // Adicionar novo item
          addItem(itemId, currentItem.level);
        }
        break;

      case 'Backspace':
        if (currentItem.content === '' && items.length > 1) {
          e.preventDefault();
          removeItem(itemId);
        } else if (currentItem.content === '' && currentItem.level > 0) {
          e.preventDefault();
          outdentItem(itemId);
        }
        break;

      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) {
          outdentItem(itemId);
        } else {
          indentItem(itemId);
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (itemIndex > 0) {
          setFocusedItemId(items[itemIndex - 1].id);
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (itemIndex < items.length - 1) {
          setFocusedItemId(items[itemIndex + 1].id);
        }
        break;

      case 'Escape':
        e.preventDefault();
        onStopEdit();
        break;
    }

    onKeyDown?.(e);
  };

  const handleItemChange = (itemId: string) => {
    const element = itemRefs.current[itemId];
    if (element) {
      updateItem(itemId, element.textContent || '');
    }
  };

  const toggleListType = () => {
    const newType = listType === 'ordered' ? 'unordered' : 'ordered';
    setListType(newType);
    onUpdate(JSON.stringify(items), { type: newType });
  };

  const getListMarker = (index: number, level: number, type: ListType) => {
    if (type === 'ordered') {
      return `${index + 1}.`;
    } else {
      const markers = ['•', '◦', '▪', '▫'];
      return markers[level] || '•';
    }
  };

  const getIndentClass = (level: number) => {
    return `ml-${level * 6}`;
  };

  return (
    <div className="relative group">
      {/* Controls */}
      {isSelected && (
        <div className="absolute -top-10 left-0 flex items-center gap-2 bg-background border rounded-lg shadow-sm p-1">
          <Button
            variant={listType === 'unordered' ? 'default' : 'ghost'}
            size="sm"
            onClick={toggleListType}
            className="h-8 w-8 p-0"
          >
            <List className="h-3 w-3" />
          </Button>
          
          <Button
            variant={listType === 'ordered' ? 'default' : 'ghost'}
            size="sm"
            onClick={toggleListType}
            className="h-8 w-8 p-0"
          >
            <ListOrdered className="h-3 w-3" />
          </Button>
          
          {isEditing && (
            <>
              <div className="w-px h-6 bg-border" />
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => addItem()}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </>
          )}
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
        {items.length === 0 || (items.length === 1 && !items[0].content) ? (
          <div className="text-muted-foreground text-sm py-2">
            Clique para adicionar itens à lista...
          </div>
        ) : (
          <div className="space-y-1">
            {items.map((item, index) => {
              const hasChildren = items.some(i => i.level > item.level && items.indexOf(i) > index);
              const isCollapsed = item.collapsed && hasChildren;
              
              return (
                <div key={item.id} className={cn('flex items-start gap-2', getIndentClass(item.level))}>
                  {/* Collapse/Expand button */}
                  {hasChildren && (
                    <button
                      className="mt-1 p-0.5 hover:bg-muted rounded"
                      onClick={() => toggleCollapse(item.id)}
                    >
                      {isCollapsed ? (
                        <ChevronRight className="h-3 w-3" />
                      ) : (
                        <ChevronDown className="h-3 w-3" />
                      )}
                    </button>
                  )}
                  
                  {/* List marker */}
                  <div className="mt-1 text-sm text-muted-foreground min-w-[1.5rem] text-right">
                    {getListMarker(index, item.level, listType)}
                  </div>
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    {isEditing ? (
                      <div
                        ref={(el) => (itemRefs.current[item.id] = el)}
                        contentEditable
                        suppressContentEditableWarning
                        className="outline-none text-sm leading-relaxed min-h-[1.5rem] py-1"
                        onInput={() => handleItemChange(item.id)}
                        onKeyDown={(e) => handleKeyDown(e, item.id)}
                        onFocus={() => setFocusedItemId(item.id)}
                      >
                        {item.content}
                      </div>
                    ) : (
                      <div className="text-sm leading-relaxed py-1">
                        {item.content || 'Item vazio'}
                      </div>
                    )}
                  </div>
                  
                  {/* Item controls */}
                  {isEditing && focusedItemId === item.id && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => addItem(item.id, item.level)}
                        className="h-6 w-6 p-0"
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      
                      {items.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeItem(item.id)}
                          className="h-6 w-6 p-0 text-destructive hover:text-destructive"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                      )}
                      
                      <div className="cursor-grab active:cursor-grabbing">
                        <GripVertical className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Type indicator */}
      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-1 text-xs text-muted-foreground bg-background/80 px-1 py-0.5 rounded">
          {listType === 'ordered' ? (
            <ListOrdered className="h-3 w-3" />
          ) : (
            <List className="h-3 w-3" />
          )}
          <span>{listType === 'ordered' ? 'Numerada' : 'Lista'}</span>
        </div>
      </div>
    </div>
  );
};

export default ListBlock;