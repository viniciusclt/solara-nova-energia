import { PlaybookBlock, BlockType, BlockContent } from '../types/editor';

/**
 * Gera um ID único para blocos
 */
export const generateId = (): string => {
  return `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

/**
 * Gera conteúdo padrão para diferentes tipos de blocos
 */
export const getDefaultContent = (type: BlockType): BlockContent => {
  switch (type) {
    case 'paragraph':
      return { text: '' };
    
    case 'heading1':
    case 'heading2':
    case 'heading3':
      return { text: '' };
    
    case 'bulletList':
    case 'numberedList':
      return { items: [''] };
    
    case 'quote':
      return { text: '' };
    
    case 'code':
      return { text: '', language: 'javascript' };
    
    case 'image':
      return { url: '', alt: '', caption: '' };
    
    case 'video':
      return { url: '', caption: '' };
    
    case 'table':
      return {
        rows: [
          { cells: ['', ''] },
          { cells: ['', ''] }
        ]
      };
    
    case 'divider':
      return {};
    
    case 'callout':
      return { text: '', calloutType: 'info' };
    
    case 'toggle':
      return { title: '', content: '' };
    
    case 'column':
      return { columns: 2 };
    
    case 'embed':
      return { url: '', embedType: 'youtube' };
    
    case 'file':
      return { url: '', fileName: '', fileSize: 0 };
    
    default:
      return { text: '' };
  }
};

/**
 * Gera estilo padrão para diferentes tipos de blocos
 */
export const getDefaultStyling = (type: BlockType) => {
  switch (type) {
    case 'heading1':
      return {
        fontSize: 'large' as const,
        fontWeight: 'bold' as const,
        textAlign: 'left' as const
      };
    
    case 'heading2':
      return {
        fontSize: 'normal' as const,
        fontWeight: 'bold' as const,
        textAlign: 'left' as const
      };
    
    case 'heading3':
      return {
        fontSize: 'normal' as const,
        fontWeight: 'bold' as const,
        textAlign: 'left' as const
      };
    
    case 'quote':
      return {
        fontStyle: 'italic' as const,
        textAlign: 'left' as const
      };
    
    case 'code':
      return {
        fontSize: 'small' as const,
        textAlign: 'left' as const
      };
    
    default:
      return {
        textAlign: 'left' as const,
        fontSize: 'normal' as const,
        fontWeight: 'normal' as const
      };
  }
};

/**
 * Insere um bloco em uma posição específica na lista
 */
export const insertBlockAtPosition = (
  blocks: PlaybookBlock[],
  newBlock: PlaybookBlock,
  position?: number
): PlaybookBlock[] => {
  const insertIndex = position ?? blocks.length;
  const newBlocks = [...blocks];
  newBlocks.splice(insertIndex, 0, newBlock);
  
  // Reordenar posições
  return newBlocks.map((block, index) => ({
    ...block,
    position: index
  }));
};

/**
 * Remove um bloco da lista
 */
export const removeBlockFromList = (
  blocks: PlaybookBlock[],
  blockId: string
): PlaybookBlock[] => {
  const filteredBlocks = blocks.filter(block => block.id !== blockId);
  
  // Reordenar posições
  return filteredBlocks.map((block, index) => ({
    ...block,
    position: index
  }));
};

/**
 * Move um bloco para uma nova posição
 */
export const moveBlockInList = (
  blocks: PlaybookBlock[],
  blockId: string,
  newPosition: number
): PlaybookBlock[] => {
  const blockIndex = blocks.findIndex(block => block.id === blockId);
  if (blockIndex === -1) return blocks;
  
  const block = blocks[blockIndex];
  const newBlocks = [...blocks];
  newBlocks.splice(blockIndex, 1);
  newBlocks.splice(newPosition, 0, block);
  
  // Reordenar posições
  return newBlocks.map((block, index) => ({
    ...block,
    position: index
  }));
};

/**
 * Duplica um bloco
 */
export const duplicateBlock = (block: PlaybookBlock): PlaybookBlock => {
  return {
    ...block,
    id: generateId(),
    position: block.position + 1,
    metadata: {
      ...block.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
      version: 1
    }
  };
};

/**
 * Calcula estatísticas do documento
 */
export const calculateStats = (blocks: PlaybookBlock[]) => {
  const wordCount = blocks.reduce((total, block) => {
    let blockWords = 0;
    
    if (block.content.text) {
      blockWords += block.content.text.split(/\s+/).filter(word => word.length > 0).length;
    }
    
    if (block.content.items) {
      blockWords += block.content.items.reduce((itemTotal, item) => {
        return itemTotal + item.split(/\s+/).filter(word => word.length > 0).length;
      }, 0);
    }
    
    if (block.content.title) {
      blockWords += block.content.title.split(/\s+/).filter(word => word.length > 0).length;
    }
    
    return total + blockWords;
  }, 0);
  
  const readingTime = Math.ceil(wordCount / 200); // Assumindo 200 palavras por minuto
  
  return {
    blockCount: blocks.length,
    wordCount,
    readingTime
  };
};

/**
 * Converte blocos para texto simples
 */
export const blocksToPlainText = (blocks: PlaybookBlock[]): string => {
  return blocks
    .sort((a, b) => a.position - b.position)
    .map(block => {
      switch (block.type) {
        case 'paragraph':
        case 'heading1':
        case 'heading2':
        case 'heading3':
        case 'quote':
        case 'code':
          return block.content.text || '';
        
        case 'bulletList':
        case 'numberedList':
          return (block.content.items || []).map(item => `• ${item}`).join('\n');
        
        case 'callout':
          return block.content.text || '';
        
        case 'toggle':
          return `${block.content.title || ''}\n${block.content.content || ''}`;
        
        case 'divider':
          return '---';
        
        default:
          return '';
      }
    })
    .filter(text => text.length > 0)
    .join('\n\n');
};

/**
 * Converte blocos para Markdown
 */
export const blocksToMarkdown = (blocks: PlaybookBlock[]): string => {
  return blocks
    .sort((a, b) => a.position - b.position)
    .map(block => {
      switch (block.type) {
        case 'paragraph':
          return block.content.text || '';
        
        case 'heading1':
          return `# ${block.content.text || ''}`;
        
        case 'heading2':
          return `## ${block.content.text || ''}`;
        
        case 'heading3':
          return `### ${block.content.text || ''}`;
        
        case 'quote':
          return `> ${block.content.text || ''}`;
        
        case 'code':
          return `\`\`\`${block.content.language || ''}\n${block.content.text || ''}\n\`\`\``;
        
        case 'bulletList':
          return (block.content.items || []).map(item => `- ${item}`).join('\n');
        
        case 'numberedList':
          return (block.content.items || []).map((item, index) => `${index + 1}. ${item}`).join('\n');
        
        case 'image':
          return `![${block.content.alt || ''}](${block.content.url || ''})`;
        
        case 'divider':
          return '---';
        
        case 'callout':
          return `> **${block.content.calloutType?.toUpperCase() || 'INFO'}**: ${block.content.text || ''}`;
        
        case 'toggle':
          return `<details>\n<summary>${block.content.title || ''}</summary>\n\n${block.content.content || ''}\n</details>`;
        
        default:
          return '';
      }
    })
    .filter(text => text.length > 0)
    .join('\n\n');
};

/**
 * Valida se um bloco está válido
 */
export const validateBlock = (block: PlaybookBlock): boolean => {
  if (!block.id || !block.type) {
    return false;
  }
  
  switch (block.type) {
    case 'image':
      return !!block.content.url;
    
    case 'video':
      return !!block.content.url;
    
    case 'embed':
      return !!block.content.url;
    
    case 'file':
      return !!block.content.url && !!block.content.fileName;
    
    default:
      return true;
  }
};

/**
 * Busca blocos por texto
 */
export const searchBlocks = (blocks: PlaybookBlock[], query: string): PlaybookBlock[] => {
  const lowercaseQuery = query.toLowerCase();
  
  return blocks.filter(block => {
    const searchableText = [
      block.content.text,
      block.content.title,
      block.content.caption,
      block.content.alt,
      ...(block.content.items || [])
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    
    return searchableText.includes(lowercaseQuery);
  });
};

/**
 * Formata data para exibição
 */
export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};

/**
 * Debounce function para otimizar performance
 */
export const debounce = <T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};