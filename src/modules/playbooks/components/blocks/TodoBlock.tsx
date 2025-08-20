import React, { useState, useRef, useEffect } from 'react';
import { Button, Checkbox, Progress } from '@/components/ui';
import {
  CheckSquare,
  Plus,
  Minus,
  GripVertical,
  Calendar,
  User,
  Flag,
  Clock,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Block } from '../../types/editor';

interface TodoItem {
  id: string;
  content: string;
  completed: boolean;
  priority?: 'low' | 'medium' | 'high';
  dueDate?: string;
  assignee?: string;
  level: number;
}

interface TodoBlockProps {
  block: Block;
  isSelected: boolean;
  isEditing: boolean;
  onUpdate: (content: string, metadata?: Record<string, unknown>) => void;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

export const TodoBlock: React.FC<TodoBlockProps> = ({
  block,
  isSelected,
  isEditing,
  onUpdate,
  onStartEdit,
  onStopEdit,
  onKeyDown,
}) => {
  const [items, setItems] = useState<TodoItem[]>(() => {
    try {
      return JSON.parse(block.content) || [{ id: '1', content: '', completed: false, level: 0 }];
    } catch {
      return [{ id: '1', content: block.content || '', completed: false, level: 0 }];
    }
  });
  const [focusedItemId, setFocusedItemId] = useState<string | null>(null);
  const [showProgress, setShowProgress] = useState(
    (block.metadata?.showProgress as boolean) || false
  );
  
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

  const updateItems = (newItems: TodoItem[]) => {
    setItems(newItems);
    onUpdate(JSON.stringify(newItems), { showProgress });
  };

  const updateItem = (itemId: string, updates: Partial<TodoItem>) => {
    const newItems = items.map(item => 
      item.id === itemId ? { ...item, ...updates } : item
    );
    updateItems(newItems);
  };

  const addItem = (afterId?: string, level: number = 0) => {
    const newId = Date.now().toString();
    const newItem: TodoItem = {
      id: newId,
      content: '',
      completed: false,
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

  const toggleCompleted = (itemId: string) => {
    updateItem(itemId, { 
      completed: !items.find(item => item.id === itemId)?.completed 
    });
  };

  const setPriority = (itemId: string, priority: TodoItem['priority']) => {
    updateItem(itemId, { priority });
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

      case ' ':
        if (e.ctrlKey) {
          e.preventDefault();
          toggleCompleted(itemId);
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
      updateItem(itemId, { content: element.textContent || '' });
    }
  };

  const getIndentClass = (level: number) => {
    return `ml-${level * 6}`;
  };

  const getPriorityColor = (priority?: TodoItem['priority']) => {
    switch (priority) {
      case 'high':
        return 'text-red-500';
      case 'medium':
        return 'text-yellow-500';
      case 'low':
        return 'text-green-500';
      default:
        return 'text-muted-foreground';
    }
  };

  const getCompletionStats = () => {
    const total = items.length;
    const completed = items.filter(item => item.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  };

  const stats = getCompletionStats();

  const toggleProgressDisplay = () => {
    const newShowProgress = !showProgress;
    setShowProgress(newShowProgress);
    onUpdate(JSON.stringify(items), { showProgress: newShowProgress });
  };

  return (
    <div className="relative group">
      {/* Controls */}
      {isSelected && (
        <div className="absolute -top-10 left-0 flex items-center gap-2 bg-background border rounded-lg shadow-sm p-1">
          <Button
            variant={showProgress ? 'default' : 'ghost'}
            size="sm"
            onClick={toggleProgressDisplay}
            className="h-8 px-2 text-xs"
          >
            <CheckSquare className="h-3 w-3 mr-1" />
            Progresso
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

      {/* Progress Bar */}
      {showProgress && (
        <div className="mb-3 p-3 bg-muted/50 rounded-lg">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Progresso</span>
            <span className="text-sm text-muted-foreground">
              {stats.completed}/{stats.total} ({stats.percentage}%)
            </span>
          </div>
          <Progress value={stats.percentage} className="h-2" />
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
            Clique para adicionar tarefas...
          </div>
        ) : (
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={item.id} className={cn('flex items-start gap-3', getIndentClass(item.level))}>
                {/* Checkbox */}
                <div className="mt-1">
                  <Checkbox
                    checked={item.completed}
                    onCheckedChange={() => toggleCompleted(item.id)}
                    className="h-4 w-4"
                  />
                </div>
                
                {/* Priority indicator */}
                {item.priority && (
                  <div className="mt-1">
                    <Flag className={cn('h-3 w-3', getPriorityColor(item.priority))} />
                  </div>
                )}
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  {isEditing ? (
                    <div
                      ref={(el) => (itemRefs.current[item.id] = el)}
                      contentEditable
                      suppressContentEditableWarning
                      className={cn(
                        'outline-none text-sm leading-relaxed min-h-[1.5rem] py-1',
                        item.completed && 'line-through text-muted-foreground'
                      )}
                      onInput={() => handleItemChange(item.id)}
                      onKeyDown={(e) => handleKeyDown(e, item.id)}
                      onFocus={() => setFocusedItemId(item.id)}
                    >
                      {item.content}
                    </div>
                  ) : (
                    <div className={cn(
                      'text-sm leading-relaxed py-1',
                      item.completed && 'line-through text-muted-foreground'
                    )}>
                      {item.content || 'Tarefa vazia'}
                    </div>
                  )}
                  
                  {/* Metadata */}
                  {(item.dueDate || item.assignee) && (
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      {item.dueDate && (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          <span>{new Date(item.dueDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      {item.assignee && (
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          <span>{item.assignee}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                {/* Item controls */}
                {isEditing && focusedItemId === item.id && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {/* Priority buttons */}
                    <div className="flex items-center">
                      <Button
                        variant={item.priority === 'high' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setPriority(item.id, item.priority === 'high' ? undefined : 'high')}
                        className="h-6 w-6 p-0"
                      >
                        <Flag className="h-3 w-3 text-red-500" />
                      </Button>
                      
                      <Button
                        variant={item.priority === 'medium' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setPriority(item.id, item.priority === 'medium' ? undefined : 'medium')}
                        className="h-6 w-6 p-0"
                      >
                        <Flag className="h-3 w-3 text-yellow-500" />
                      </Button>
                      
                      <Button
                        variant={item.priority === 'low' ? 'default' : 'ghost'}
                        size="sm"
                        onClick={() => setPriority(item.id, item.priority === 'low' ? undefined : 'low')}
                        className="h-6 w-6 p-0"
                      >
                        <Flag className="h-3 w-3 text-green-500" />
                      </Button>
                    </div>
                    
                    <div className="w-px h-4 bg-border" />
                    
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
            ))}
          </div>
        )}
      </div>

      {/* Stats indicator */}
      <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-1 text-xs text-muted-foreground bg-background/80 px-1 py-0.5 rounded">
          <CheckSquare className="h-3 w-3" />
          <span>{stats.completed}/{stats.total}</span>
          {stats.percentage === 100 && (
            <span className="text-green-600">✓</span>
          )}
        </div>
      </div>
    </div>
  );
};

export default TodoBlock;