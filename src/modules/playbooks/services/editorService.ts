// services/editorService.ts
import {
  Block,
  BlockType,
  EditorState,
  EditorOperation,
  EditorSelection,
  Playbook,
  ParagraphBlock,
  HeadingBlock,
  ListBlock,
  TodoBlock,
  ImageBlock,
  VideoBlock,
  CodeBlock,
  TableBlock,
  CalloutBlock,
  DividerBlock,
  ColumnListBlock,
  ColumnBlock,
  EditorEvent,
} from '../types/editor';
import { nanoid } from 'nanoid';

export class EditorService {
  private state: EditorState;
  private eventListeners: Map<string, ((event: EditorEvent) => void)[]> = new Map();
  private autoSaveTimer?: NodeJS.Timeout;
  private collaborationSocket?: WebSocket;

  constructor(initialState?: Partial<EditorState>) {
    this.state = {
      blocks: {},
      history: {
        undoStack: [],
        redoStack: [],
        maxSize: 100,
      },
      settings: {
        theme: 'light',
        fontSize: 16,
        fontFamily: 'Inter, sans-serif',
        lineHeight: 1.6,
        showBlockHandles: true,
        showLineNumbers: false,
        enableSpellCheck: true,
        enableAutoSave: true,
        autoSaveInterval: 30000, // 30 seconds
        enableCollaboration: false,
        enableComments: true,
        enableVersionHistory: true,
        maxFileSize: 10 * 1024 * 1024, // 10MB
        allowedFileTypes: ['image/*', 'video/*', 'audio/*', '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'],
      },
      ...initialState,
    };

    this.setupAutoSave();
  }

  // Event Management
  addEventListener(eventType: string, listener: (event: EditorEvent) => void): void {
    if (!this.eventListeners.has(eventType)) {
      this.eventListeners.set(eventType, []);
    }
    this.eventListeners.get(eventType)!.push(listener);
  }

  removeEventListener(eventType: string, listener: (event: EditorEvent) => void): void {
    const listeners = this.eventListeners.get(eventType);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  private emit(event: EditorEvent): void {
    const listeners = this.eventListeners.get(event.type) || [];
    listeners.forEach(listener => {
      try {
        listener(event);
      } catch (error) {
        console.error('Error in event listener:', error);
      }
    });
  }

  // State Management
  getState(): EditorState {
    return { ...this.state };
  }

  getBlocks(): Record<string, Block> {
    return { ...this.state.blocks };
  }

  getBlock(id: string): Block | undefined {
    return this.state.blocks[id];
  }

  getBlocksByParent(parentId?: string): Block[] {
    return Object.values(this.state.blocks)
      .filter(block => block.parentId === parentId)
      .sort((a, b) => {
        // Sort by creation time if no explicit order is set
        return a.createdAt.getTime() - b.createdAt.getTime();
      });
  }

  getRootBlocks(): Block[] {
    return this.getBlocksByParent(undefined);
  }

  getSelection(): EditorSelection | undefined {
    return this.state.selection;
  }

  // Block Creation
  createBlock(type: BlockType, data: Partial<Block> = {}, parentId?: string): Block {
    const id = nanoid();
    const now = new Date();
    const userId = 'current-user'; // In a real app, get from auth context

    let block: Block;

    switch (type) {
      case 'paragraph':
        block = {
          id,
          type: 'paragraph',
          content: [],
          parentId,
          children: [],
          createdAt: now,
          updatedAt: now,
          createdBy: userId,
          lastEditedBy: userId,
          ...data,
        } as ParagraphBlock;
        break;

      case 'heading1':
      case 'heading2':
      case 'heading3':
        block = {
          id,
          type,
          content: [],
          toggleable: false,
          collapsed: false,
          parentId,
          children: [],
          createdAt: now,
          updatedAt: now,
          createdBy: userId,
          lastEditedBy: userId,
          ...data,
        } as HeadingBlock;
        break;

      case 'bulleted-list':
      case 'numbered-list':
        block = {
          id,
          type,
          content: [],
          indent: 0,
          parentId,
          children: [],
          createdAt: now,
          updatedAt: now,
          createdBy: userId,
          lastEditedBy: userId,
          ...data,
        } as ListBlock;
        break;

      case 'todo':
        block = {
          id,
          type: 'todo',
          content: [],
          checked: false,
          parentId,
          children: [],
          createdAt: now,
          updatedAt: now,
          createdBy: userId,
          lastEditedBy: userId,
          ...data,
        } as TodoBlock;
        break;

      case 'image':
        block = {
          id,
          type: 'image',
          url: '',
          alignment: 'center',
          parentId,
          children: [],
          createdAt: now,
          updatedAt: now,
          createdBy: userId,
          lastEditedBy: userId,
          ...data,
        } as ImageBlock;
        break;

      case 'video':
        block = {
          id,
          type: 'video',
          url: '',
          controls: true,
          parentId,
          children: [],
          createdAt: now,
          updatedAt: now,
          createdBy: userId,
          lastEditedBy: userId,
          ...data,
        } as VideoBlock;
        break;

      case 'code':
        block = {
          id,
          type: 'code',
          content: '',
          language: 'javascript',
          showLineNumbers: true,
          theme: 'vs-dark',
          parentId,
          children: [],
          createdAt: now,
          updatedAt: now,
          createdBy: userId,
          lastEditedBy: userId,
          ...data,
        } as CodeBlock;
        break;

      case 'table':
        block = {
          id,
          type: 'table',
          headers: [[]],
          rows: [[]],
          hasHeader: true,
          striped: false,
          bordered: true,
          parentId,
          children: [],
          createdAt: now,
          updatedAt: now,
          createdBy: userId,
          lastEditedBy: userId,
          ...data,
        } as TableBlock;
        break;

      case 'callout':
        block = {
          id,
          type: 'callout',
          content: [],
          icon: '💡',
          style: 'default',
          parentId,
          children: [],
          createdAt: now,
          updatedAt: now,
          createdBy: userId,
          lastEditedBy: userId,
          ...data,
        } as CalloutBlock;
        break;

      case 'divider':
        block = {
          id,
          type: 'divider',
          style: 'line',
          spacing: 'medium',
          parentId,
          children: [],
          createdAt: now,
          updatedAt: now,
          createdBy: userId,
          lastEditedBy: userId,
          ...data,
        } as DividerBlock;
        break;

      case 'column-list':
        block = {
          id,
          type: 'column-list',
          columns: 2,
          gap: 16,
          distribution: 'equal',
          parentId,
          children: [],
          createdAt: now,
          updatedAt: now,
          createdBy: userId,
          lastEditedBy: userId,
          ...data,
        } as ColumnListBlock;
        break;

      case 'column':
        block = {
          id,
          type: 'column',
          width: 'auto',
          parentId,
          children: [],
          createdAt: now,
          updatedAt: now,
          createdBy: userId,
          lastEditedBy: userId,
          ...data,
        } as ColumnBlock;
        break;

      default:
        // Default to paragraph for unknown types
        block = {
          id,
          type: 'paragraph',
          content: [],
          parentId,
          children: [],
          createdAt: now,
          updatedAt: now,
          createdBy: userId,
          lastEditedBy: userId,
          ...data,
        } as ParagraphBlock;
    }

    this.addBlock(block);
    return block;
  }

  // Block Operations
  addBlock(block: Block): void {
    const operation: EditorOperation = {
      type: 'insert',
      blockId: block.id,
      data: block,
      timestamp: new Date(),
      userId: 'current-user',
    };

    this.state.blocks[block.id] = block;
    this.addToHistory(operation);
    this.emit({ type: 'block-created', blockId: block.id, block });
  }

  updateBlock(id: string, changes: Partial<Block>): void {
    const existingBlock = this.state.blocks[id];
    if (!existingBlock) {
      throw new Error(`Block with id ${id} not found`);
    }

    const operation: EditorOperation = {
      type: 'update',
      blockId: id,
      data: { old: existingBlock, new: changes },
      timestamp: new Date(),
      userId: 'current-user',
    };

    this.state.blocks[id] = {
      ...existingBlock,
      ...changes,
      updatedAt: new Date(),
      lastEditedBy: 'current-user',
    };

    this.addToHistory(operation);
    this.emit({ type: 'block-updated', blockId: id, changes });
  }

  deleteBlock(id: string): void {
    const block = this.state.blocks[id];
    if (!block) {
      throw new Error(`Block with id ${id} not found`);
    }

    // Delete children recursively
    if (block.children) {
      block.children.forEach(childId => {
        this.deleteBlock(childId);
      });
    }

    const operation: EditorOperation = {
      type: 'delete',
      blockId: id,
      data: block,
      timestamp: new Date(),
      userId: 'current-user',
    };

    delete this.state.blocks[id];
    this.addToHistory(operation);
    this.emit({ type: 'block-deleted', blockId: id });
  }

  moveBlock(blockId: string, newParentId?: string, newIndex?: number): void {
    const block = this.state.blocks[blockId];
    if (!block) {
      throw new Error(`Block with id ${blockId} not found`);
    }

    const oldParentId = block.parentId;
    const operation: EditorOperation = {
      type: 'move',
      blockId,
      data: { oldParentId, newParentId, newIndex },
      timestamp: new Date(),
      userId: 'current-user',
    };

    // Remove from old parent
    if (oldParentId) {
      const oldParent = this.state.blocks[oldParentId];
      if (oldParent && oldParent.children) {
        oldParent.children = oldParent.children.filter(id => id !== blockId);
      }
    }

    // Add to new parent
    if (newParentId) {
      const newParent = this.state.blocks[newParentId];
      if (newParent) {
        if (!newParent.children) {
          newParent.children = [];
        }
        if (newIndex !== undefined) {
          newParent.children.splice(newIndex, 0, blockId);
        } else {
          newParent.children.push(blockId);
        }
      }
    }

    // Update block
    this.state.blocks[blockId] = {
      ...block,
      parentId: newParentId,
      updatedAt: new Date(),
      lastEditedBy: 'current-user',
    };

    this.addToHistory(operation);
    this.emit({ type: 'block-moved', blockId, newParentId, newIndex: newIndex || 0 });
  }

  duplicateBlock(id: string): Block {
    const originalBlock = this.state.blocks[id];
    if (!originalBlock) {
      throw new Error(`Block with id ${id} not found`);
    }

    const newBlock = {
      ...originalBlock,
      id: nanoid(),
      createdAt: new Date(),
      updatedAt: new Date(),
      children: [], // Don't duplicate children for now
    };

    this.addBlock(newBlock);
    return newBlock;
  }

  // Selection Management
  setSelection(selection: EditorSelection): void {
    this.state.selection = selection;
    this.emit({ type: 'selection-changed', selection });
  }

  clearSelection(): void {
    this.state.selection = undefined;
    this.emit({ type: 'selection-changed', selection: undefined });
  }

  // History Management
  private addToHistory(operation: EditorOperation): void {
    this.state.history.undoStack.push(operation);
    
    // Limit stack size
    if (this.state.history.undoStack.length > this.state.history.maxSize) {
      this.state.history.undoStack.shift();
    }
    
    // Clear redo stack when new operation is added
    this.state.history.redoStack = [];
  }

  undo(): boolean {
    const operation = this.state.history.undoStack.pop();
    if (!operation) {
      return false;
    }

    this.state.history.redoStack.push(operation);
    this.applyReverseOperation(operation);
    return true;
  }

  redo(): boolean {
    const operation = this.state.history.redoStack.pop();
    if (!operation) {
      return false;
    }

    this.state.history.undoStack.push(operation);
    this.applyOperation(operation);
    return true;
  }

  private applyOperation(operation: EditorOperation): void {
    switch (operation.type) {
      case 'insert':
        this.state.blocks[operation.blockId] = operation.data;
        break;
      case 'delete':
        delete this.state.blocks[operation.blockId];
        break;
      case 'update':
        this.state.blocks[operation.blockId] = {
          ...this.state.blocks[operation.blockId],
          ...operation.data.new,
        };
        break;
      case 'move':
        // Implement move logic
        break;
    }
  }

  private applyReverseOperation(operation: EditorOperation): void {
    switch (operation.type) {
      case 'insert':
        delete this.state.blocks[operation.blockId];
        break;
      case 'delete':
        this.state.blocks[operation.blockId] = operation.data;
        break;
      case 'update':
        this.state.blocks[operation.blockId] = {
          ...this.state.blocks[operation.blockId],
          ...operation.data.old,
        };
        break;
      case 'move':
        // Implement reverse move logic
        break;
    }
  }

  canUndo(): boolean {
    return this.state.history.undoStack.length > 0;
  }

  canRedo(): boolean {
    return this.state.history.redoStack.length > 0;
  }

  // Import/Export
  exportToJSON(): string {
    return JSON.stringify({
      blocks: this.state.blocks,
      settings: this.state.settings,
      exportedAt: new Date().toISOString(),
      version: '1.0.0',
    }, null, 2);
  }

  importFromJSON(json: string): void {
    try {
      const data = JSON.parse(json);
      
      if (data.blocks) {
        // Convert date strings back to Date objects
        Object.values(data.blocks).forEach((block: Block) => {
          block.createdAt = new Date(block.createdAt);
          block.updatedAt = new Date(block.updatedAt);
        });
        
        this.state.blocks = data.blocks;
      }
      
      if (data.settings) {
        this.state.settings = { ...this.state.settings, ...data.settings };
      }
      
      // Clear history after import
      this.state.history.undoStack = [];
      this.state.history.redoStack = [];
      
    } catch (error) {
      throw new Error('Invalid JSON format');
    }
  }

  exportToMarkdown(): string {
    const rootBlocks = this.getRootBlocks();
    return this.blocksToMarkdown(rootBlocks);
  }

  private blocksToMarkdown(blocks: Block[], depth = 0): string {
    return blocks.map(block => {
      const indent = '  '.repeat(depth);
      let markdown = '';
      
      switch (block.type) {
        case 'paragraph':
          markdown = this.richTextToMarkdown((block as ParagraphBlock).content);
          break;
        case 'heading1':
          markdown = `# ${this.richTextToMarkdown((block as HeadingBlock).content)}`;
          break;
        case 'heading2':
          markdown = `## ${this.richTextToMarkdown((block as HeadingBlock).content)}`;
          break;
        case 'heading3':
          markdown = `### ${this.richTextToMarkdown((block as HeadingBlock).content)}`;
          break;
        case 'bulleted-list':
          markdown = `${indent}- ${this.richTextToMarkdown((block as ListBlock).content)}`;
          break;
        case 'numbered-list':
          markdown = `${indent}1. ${this.richTextToMarkdown((block as ListBlock).content)}`;
          break;
        case 'todo': {
          const todoBlock = block as TodoBlock;
          const checkbox = todoBlock.checked ? '[x]' : '[ ]';
          markdown = `${indent}- ${checkbox} ${this.richTextToMarkdown(todoBlock.content)}`;
          break;
        }
        case 'code': {
          const codeBlock = block as CodeBlock;
          markdown = `\`\`\`${codeBlock.language || ''}\n${codeBlock.content}\n\`\`\``;
          break;
        }
        case 'quote':
          markdown = `> ${this.richTextToMarkdown((block as QuoteBlock).content)}`;
          break;
        case 'divider':
          markdown = '---';
          break;
        default:
          markdown = `<!-- ${block.type} block -->`;
      }
      
      // Add children
      if (block.children && block.children.length > 0) {
        const childBlocks = block.children.map(id => this.state.blocks[id]).filter(Boolean);
        const childMarkdown = this.blocksToMarkdown(childBlocks, depth + 1);
        if (childMarkdown) {
          markdown += '\n' + childMarkdown;
        }
      }
      
      return markdown;
    }).join('\n\n');
  }

  private richTextToMarkdown(richText: RichTextAnnotation[]): string {
    if (!Array.isArray(richText)) {
      return '';
    }
    
    return richText.map((annotation: RichTextAnnotation) => {
      let text = annotation.text || '';
      
      if (annotation.style) {
        if (annotation.style.bold) text = `**${text}**`;
        if (annotation.style.italic) text = `*${text}*`;
        if (annotation.style.code) text = `\`${text}\``;
        if (annotation.style.strikethrough) text = `~~${text}~~`;
      }
      
      if (annotation.href) {
        text = `[${text}](${annotation.href})`;
      }
      
      return text;
    }).join('');
  }

  // Auto-save
  private setupAutoSave(): void {
    if (this.state.settings.enableAutoSave) {
      this.autoSaveTimer = setInterval(() => {
        this.autoSave();
      }, this.state.settings.autoSaveInterval);
    }
  }

  private autoSave(): void {
    try {
      const data = this.exportToJSON();
      localStorage.setItem('playbook-autosave', data);
      console.log('Auto-saved playbook');
    } catch (error) {
      console.error('Auto-save failed:', error);
    }
  }

  loadAutoSave(): boolean {
    try {
      const data = localStorage.getItem('playbook-autosave');
      if (data) {
        this.importFromJSON(data);
        return true;
      }
    } catch (error) {
      console.error('Failed to load auto-save:', error);
    }
    return false;
  }

  clearAutoSave(): void {
    localStorage.removeItem('playbook-autosave');
  }

  // Settings
  updateSettings(settings: Partial<typeof this.state.settings>): void {
    this.state.settings = { ...this.state.settings, ...settings };
    
    // Restart auto-save if interval changed
    if (settings.enableAutoSave !== undefined || settings.autoSaveInterval !== undefined) {
      if (this.autoSaveTimer) {
        clearInterval(this.autoSaveTimer);
      }
      this.setupAutoSave();
    }
  }

  getSettings() {
    return { ...this.state.settings };
  }

  // Collaboration (placeholder for future implementation)
  enableCollaboration(websocketUrl: string): void {
    if (this.collaborationSocket) {
      this.collaborationSocket.close();
    }
    
    this.collaborationSocket = new WebSocket(websocketUrl);
    
    this.collaborationSocket.onopen = () => {
      console.log('Collaboration connected');
    };
    
    this.collaborationSocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        this.handleCollaborationMessage(message);
      } catch (error) {
        console.error('Failed to parse collaboration message:', error);
      }
    };
    
    this.collaborationSocket.onclose = () => {
      console.log('Collaboration disconnected');
    };
  }

  private handleCollaborationMessage(message: Record<string, unknown>): void {
    // Handle real-time collaboration messages
    switch (message.type) {
      case 'operation':
        this.applyOperation(message.operation);
        break;
      case 'cursor':
        // Update cursor positions
        break;
      case 'user-joined':
        this.emit({ type: 'collaboration-user-joined', user: message.user });
        break;
      case 'user-left':
        this.emit({ type: 'collaboration-user-left', userId: message.userId });
        break;
    }
  }

  // Cleanup
  destroy(): void {
    if (this.autoSaveTimer) {
      clearInterval(this.autoSaveTimer);
    }
    
    if (this.collaborationSocket) {
      this.collaborationSocket.close();
    }
    
    this.eventListeners.clear();
  }

  // Utility methods
  getBlockCount(): number {
    return Object.keys(this.state.blocks).length;
  }

  getWordCount(): number {
    let wordCount = 0;
    
    Object.values(this.state.blocks).forEach(block => {
      if ('content' in block && Array.isArray(block.content)) {
        block.content.forEach((annotation: RichTextAnnotation) => {
          if (annotation.text) {
            wordCount += annotation.text.split(/\s+/).filter((word: string) => word.length > 0).length;
          }
        });
      }
    });
    
    return wordCount;
  }

  getReadingTime(): number {
    const wordCount = this.getWordCount();
    const wordsPerMinute = 200; // Average reading speed
    return Math.ceil(wordCount / wordsPerMinute);
  }

  searchBlocks(query: string): Block[] {
    const lowercaseQuery = query.toLowerCase();
    
    return Object.values(this.state.blocks).filter(block => {
      // Search in text content
      if ('content' in block && Array.isArray(block.content)) {
        const text = block.content
          .map((annotation: RichTextAnnotation) => annotation.text || '')
          .join(' ')
          .toLowerCase();
        
        if (text.includes(lowercaseQuery)) {
          return true;
        }
      }
      
      // Search in other text fields
      if ('title' in block && typeof block.title === 'string') {
        if (block.title.toLowerCase().includes(lowercaseQuery)) {
          return true;
        }
      }
      
      return false;
    });
  }

  // Template methods
  saveAsTemplate(name: string, description?: string): void {
    const template = {
      id: nanoid(),
      name,
      description,
      blocks: this.state.blocks,
      createdAt: new Date(),
    };
    
    const templates = this.getTemplates();
    templates.push(template);
    localStorage.setItem('playbook-templates', JSON.stringify(templates));
  }

  getTemplates(): Array<{ id: string; name: string; description?: string; blocks: Record<string, Block>; createdAt: Date }> {
    try {
      const data = localStorage.getItem('playbook-templates');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  loadTemplate(templateId: string): boolean {
    const templates = this.getTemplates();
    const template = templates.find(t => t.id === templateId);
    
    if (template) {
      this.state.blocks = template.blocks;
      this.state.history.undoStack = [];
      this.state.history.redoStack = [];
      return true;
    }
    
    return false;
  }
}

export default EditorService;