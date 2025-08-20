// Block components exports
import ParagraphBlock from './ParagraphBlock';
import HeadingBlock from './HeadingBlock';
import ListBlock from './ListBlock';
import TodoBlock from './TodoBlock';
import ImageBlock from './ImageBlock';
import QuoteBlock from './QuoteBlock';
import CodeBlock from './CodeBlock';
import DividerBlock from './DividerBlock';
import BlockSelector from './BlockSelector';

export { ParagraphBlock, HeadingBlock, ListBlock, TodoBlock, ImageBlock, QuoteBlock, CodeBlock, DividerBlock, BlockSelector };

// Block types mapping
export const BLOCK_COMPONENTS = {
  paragraph: ParagraphBlock,
  heading: HeadingBlock,
  list: ListBlock,
  todo: TodoBlock,
  image: ImageBlock,
  quote: QuoteBlock,
  code: CodeBlock,
  divider: DividerBlock,
} as const;

export type BlockComponentType = keyof typeof BLOCK_COMPONENTS;

// Block metadata types
export interface BaseBlockMetadata {
  createdAt: string;
  updatedAt: string;
  version?: number;
}

export interface ParagraphMetadata extends BaseBlockMetadata {
  alignment?: 'left' | 'center' | 'right' | 'justify';
  fontSize?: 'small' | 'medium' | 'large';
  color?: string;
  backgroundColor?: string;
}

export interface HeadingMetadata extends BaseBlockMetadata {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  alignment?: 'left' | 'center' | 'right';
  color?: string;
  anchor?: string;
}

export interface ListMetadata extends BaseBlockMetadata {
  type: 'ordered' | 'unordered';
  style?: 'disc' | 'circle' | 'square' | 'decimal' | 'lower-alpha' | 'upper-alpha' | 'lower-roman' | 'upper-roman';
  indent?: number;
}

export interface TodoMetadata extends BaseBlockMetadata {
  showProgress?: boolean;
  allowPriority?: boolean;
  allowDueDate?: boolean;
  defaultPriority?: 'low' | 'medium' | 'high';
}

export interface ImageMetadata extends BaseBlockMetadata {
  src: string;
  alt: string;
  caption?: string;
  width?: number;
  height?: number;
  alignment: 'left' | 'center' | 'right';
  size: 'small' | 'medium' | 'large' | 'full';
  borderRadius?: number;
  shadow?: boolean;
}

export interface QuoteMetadata extends BaseBlockMetadata {
  author?: string;
  source?: string;
  date?: string;
  url?: string;
  alignment: 'left' | 'center' | 'right';
  style: 'default' | 'modern' | 'minimal' | 'bordered' | 'highlighted';
  color: 'default' | 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  size: 'small' | 'medium' | 'large';
}

export interface CodeMetadata extends BaseBlockMetadata {
  language: string;
  theme: 'light' | 'dark' | 'auto';
  showLineNumbers: boolean;
  showCopyButton: boolean;
  allowDownload: boolean;
  executable: boolean;
  filename?: string;
  description?: string;
  highlightLines?: number[];
  foldable: boolean;
  maxHeight?: number;
}

export interface DividerMetadata extends BaseBlockMetadata {
  style: 'line' | 'dashed' | 'dotted' | 'double' | 'gradient' | 'decorative';
  thickness: 'thin' | 'medium' | 'thick';
  color: 'default' | 'primary' | 'secondary' | 'accent' | 'muted';
  width: 'full' | 'half' | 'quarter' | 'custom';
  customWidth?: number;
  alignment: 'left' | 'center' | 'right';
  spacing: 'tight' | 'normal' | 'loose';
  decorativeType?: 'dots' | 'stars' | 'hearts' | 'diamonds' | 'circles' | 'squares' | 'triangles';
  text?: string;
  showText: boolean;
}

// Union type for all metadata
export type BlockMetadata = 
  | ParagraphMetadata
  | HeadingMetadata
  | ListMetadata
  | TodoMetadata
  | ImageMetadata
  | QuoteMetadata
  | CodeMetadata
  | DividerMetadata;

// Block configuration for different types
export const BLOCK_CONFIGS = {
  paragraph: {
    name: 'Parágrafo',
    description: 'Texto simples com formatação básica',
    icon: 'Type',
    category: 'text',
    defaultContent: '',
    defaultMetadata: {
      alignment: 'left',
      fontSize: 'medium',
    } as Partial<ParagraphMetadata>,
  },
  heading: {
    name: 'Título',
    description: 'Cabeçalho com diferentes níveis',
    icon: 'Heading',
    category: 'text',
    defaultContent: '',
    defaultMetadata: {
      level: 1,
      alignment: 'left',
    } as Partial<HeadingMetadata>,
  },
  list: {
    name: 'Lista',
    description: 'Lista ordenada ou não ordenada',
    icon: 'List',
    category: 'text',
    defaultContent: '',
    defaultMetadata: {
      type: 'unordered',
      style: 'disc',
      indent: 0,
    } as Partial<ListMetadata>,
  },
  todo: {
    name: 'Lista de Tarefas',
    description: 'Lista de tarefas com checkboxes',
    icon: 'CheckSquare',
    category: 'interactive',
    defaultContent: '',
    defaultMetadata: {
      showProgress: true,
      allowPriority: true,
      allowDueDate: false,
      defaultPriority: 'medium',
    } as Partial<TodoMetadata>,
  },
  image: {
    name: 'Imagem',
    description: 'Inserir imagem com opções de layout',
    icon: 'Image',
    category: 'media',
    defaultContent: '',
    defaultMetadata: {
      src: '',
      alt: '',
      alignment: 'center',
      size: 'medium',
      shadow: false,
    } as Partial<ImageMetadata>,
  },
  quote: {
    name: 'Citação',
    description: 'Bloco de citação com atribuição',
    icon: 'Quote',
    category: 'text',
    defaultContent: '',
    defaultMetadata: {
      alignment: 'left',
      style: 'default',
      color: 'default',
      size: 'medium',
      showText: false,
    } as Partial<QuoteMetadata>,
  },
  code: {
    name: 'Código',
    description: 'Bloco de código com syntax highlighting',
    icon: 'Code',
    category: 'code',
    defaultContent: '',
    defaultMetadata: {
      language: 'javascript',
      theme: 'auto',
      showLineNumbers: true,
      showCopyButton: true,
      allowDownload: false,
      executable: false,
      foldable: false,
    } as Partial<CodeMetadata>,
  },
  divider: {
    name: 'Divisor',
    description: 'Linha divisória para separar conteúdo',
    icon: 'Minus',
    category: 'layout',
    defaultContent: '',
    defaultMetadata: {
      style: 'line',
      thickness: 'medium',
      color: 'default',
      width: 'full',
      alignment: 'center',
      spacing: 'normal',
      showText: false,
    } as Partial<DividerMetadata>,
  },
} as const;

// Block categories
export const BLOCK_CATEGORIES = {
  text: {
    name: 'Texto',
    description: 'Blocos de texto e formatação',
    icon: 'Type',
  },
  media: {
    name: 'Mídia',
    description: 'Imagens, vídeos e arquivos',
    icon: 'Image',
  },
  interactive: {
    name: 'Interativo',
    description: 'Elementos interativos e formulários',
    icon: 'MousePointer',
  },
  code: {
    name: 'Código',
    description: 'Blocos de código e programação',
    icon: 'Code',
  },
  layout: {
    name: 'Layout',
    description: 'Elementos de estrutura e layout',
    icon: 'Layout',
  },
} as const;

export type BlockCategory = keyof typeof BLOCK_CATEGORIES;

// Helper functions
export const getBlockComponent = (type: string) => {
  return BLOCK_COMPONENTS[type as BlockComponentType];
};

export const getBlockConfig = (type: string) => {
  return BLOCK_CONFIGS[type as BlockComponentType];
};

export const getBlocksByCategory = (category: BlockCategory) => {
  return Object.entries(BLOCK_CONFIGS)
    .filter(([, config]) => config.category === category)
    .map(([type]) => type as BlockComponentType);
};

export const getAllBlockTypes = () => {
  return Object.keys(BLOCK_COMPONENTS) as BlockComponentType[];
};

export const createDefaultBlock = (type: BlockComponentType) => {
  const config = BLOCK_CONFIGS[type];
  return {
    id: `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    type,
    content: config.defaultContent,
    metadata: {
      ...config.defaultMetadata,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      version: 1,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};