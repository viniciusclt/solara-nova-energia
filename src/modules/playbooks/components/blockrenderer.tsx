import React from 'react';
import { Block, BlockType } from '../types/editor';
import { BLOCK_COMPONENTS, getBlockComponent } from './blocks';

// Components
import ParagraphBlock from './blocks/ParagraphBlock';
import HeadingBlock from './blocks/HeadingBlock';
import ListBlock from './blocks/ListBlock';
import TodoBlock from './blocks/TodoBlock';
import ImageBlock from './blocks/ImageBlock';
import QuoteBlock from './blocks/QuoteBlock';
import CodeBlock from './blocks/CodeBlock';
import DividerBlock from './blocks/DividerBlock';

interface BlockRendererProps {
  block: Block;
  onUpdate: (blockId: string, updates: Partial<Block>) => void;
  onDelete: (blockId: string) => void;
  onAddBlock: (afterBlockId: string, type: string) => void;
  isSelected: boolean;
  onSelect: (blockId: string) => void;
}

// Mapeamento de tipos de bloco para componentes
const BLOCK_TYPE_MAP: Record<string, React.ComponentType<any>> = {
  'paragraph': ParagraphBlock,
  'heading1': HeadingBlock,
  'heading2': HeadingBlock,
  'heading3': HeadingBlock,
  'bulleted-list': ListBlock,
  'numbered-list': ListBlock,
  'todo': TodoBlock,
  'quote': QuoteBlock,
  'code': CodeBlock,
  'divider': DividerBlock,
  'image': ImageBlock,
};

export const BlockRenderer: React.FC<BlockRendererProps> = ({
  block,
  onUpdate,
  onDelete,
  onAddBlock,
  isSelected,
  onSelect
}) => {
  // Encontrar o componente correspondente
  const BlockComponent = BLOCK_TYPE_MAP[block.type] || ParagraphBlock;

  // Props comuns para todos os blocos
  const commonProps = {
    block,
    isSelected,
    isEditing: false,
    onUpdate: (content: string) => onUpdate(block.id, { content }),
    onStartEdit: () => {},
    onStopEdit: () => {},
    onKeyDown: () => {},
    onDelete: () => onDelete(block.id),
    onSelect: () => onSelect(block.id),
  };

  // Renderizar o componente do bloco
  return (
    <div className="block-renderer" data-block-id={block.id}>
      <BlockComponent {...commonProps} />
    </div>
  );
};

export default BlockRenderer;