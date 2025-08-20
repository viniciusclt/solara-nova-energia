import React, { useState, useEffect, useRef } from 'react';
import {
  Button,
  Input,
  Card,
  CardContent,
} from '@/components/ui';
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  CheckSquare,
  Image,
  Video,
  Quote,
  Code,
  Minus,
  FileText,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BlockType } from '../../types/editor';

interface BlockOption {
  type: BlockType;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  keywords: string[];
}

const blockOptions: BlockOption[] = [
  {
    type: 'paragraph',
    label: 'Parágrafo',
    description: 'Texto simples',
    icon: Type,
    keywords: ['texto', 'paragrafo', 'p'],
  },
  {
    type: 'heading',
    label: 'Cabeçalho',
    description: 'Título de seção',
    icon: Heading1,
    keywords: ['titulo', 'cabecalho', 'h1', 'h2', 'h3', 'heading'],
  },
  {
    type: 'list',
    label: 'Lista',
    description: 'Lista com marcadores ou numerada',
    icon: List,
    keywords: ['lista', 'bullet', 'numerada', 'ul', 'ol'],
  },
  {
    type: 'todo',
    label: 'Lista de Tarefas',
    description: 'Lista de itens com checkbox',
    icon: CheckSquare,
    keywords: ['todo', 'tarefa', 'checkbox', 'checklist'],
  },
  {
    type: 'quote',
    label: 'Citação',
    description: 'Texto destacado como citação',
    icon: Quote,
    keywords: ['citacao', 'quote', 'blockquote'],
  },
  {
    type: 'code',
    label: 'Código',
    description: 'Bloco de código com syntax highlighting',
    icon: Code,
    keywords: ['codigo', 'code', 'programacao'],
  },
  {
    type: 'image',
    label: 'Imagem',
    description: 'Inserir uma imagem',
    icon: Image,
    keywords: ['imagem', 'foto', 'picture', 'img'],
  },
  {
    type: 'divider',
    label: 'Divisor',
    description: 'Linha horizontal para separar conteúdo',
    icon: Minus,
    keywords: ['divisor', 'linha', 'separador', 'hr'],
  },
];

interface BlockSelectorProps {
  position: { x: number; y: number };
  onSelect: (type: BlockType) => void;
  onClose: () => void;
}

export const BlockSelector: React.FC<BlockSelectorProps> = ({
  position,
  onSelect,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter blocks based on search query
  const filteredBlocks = blockOptions.filter((block) => {
    if (!searchQuery) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      block.label.toLowerCase().includes(query) ||
      block.description.toLowerCase().includes(query) ||
      block.keywords.some(keyword => keyword.includes(query))
    );
  });

  // Focus search input on mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Reset selected index when filtered blocks change
  useEffect(() => {
    setSelectedIndex(0);
  }, [filteredBlocks]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      switch (event.key) {
        case 'ArrowDown':
          event.preventDefault();
          setSelectedIndex((prev) => 
            prev < filteredBlocks.length - 1 ? prev + 1 : 0
          );
          break;
        case 'ArrowUp':
          event.preventDefault();
          setSelectedIndex((prev) => 
            prev > 0 ? prev - 1 : filteredBlocks.length - 1
          );
          break;
        case 'Enter':
          event.preventDefault();
          if (filteredBlocks[selectedIndex]) {
            onSelect(filteredBlocks[selectedIndex].type);
          }
          break;
        case 'Escape':
          event.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [filteredBlocks, selectedIndex, onSelect, onClose]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Calculate position to ensure selector stays within viewport
  const getAdjustedPosition = () => {
    const selectorWidth = 320;
    const selectorHeight = Math.min(400, filteredBlocks.length * 60 + 100);
    
    let { x, y } = position;
    
    // Adjust horizontal position
    if (x + selectorWidth > window.innerWidth) {
      x = window.innerWidth - selectorWidth - 20;
    }
    
    // Adjust vertical position
    if (y + selectorHeight > window.innerHeight) {
      y = position.y - selectorHeight - 10;
    }
    
    return { x: Math.max(20, x), y: Math.max(20, y) };
  };

  const adjustedPosition = getAdjustedPosition();

  return (
    <div
      className="fixed inset-0 z-50"
      style={{ pointerEvents: 'none' }}
    >
      <Card
        ref={containerRef}
        className="absolute w-80 max-h-96 overflow-hidden shadow-lg border"
        style={{
          left: adjustedPosition.x,
          top: adjustedPosition.y,
          pointerEvents: 'auto',
        }}
      >
        <CardContent className="p-0">
          {/* Search Input */}
          <div className="p-3 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchInputRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar blocos..."
                className="pl-10 border-none bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0"
              />
            </div>
          </div>

          {/* Block Options */}
          <div className="max-h-80 overflow-y-auto">
            {filteredBlocks.length === 0 ? (
              <div className="p-4 text-center text-muted-foreground">
                Nenhum bloco encontrado
              </div>
            ) : (
              <div className="py-2">
                {filteredBlocks.map((block, index) => {
                  const Icon = block.icon;
                  return (
                    <Button
                      key={block.type}
                      variant="ghost"
                      className={cn(
                        'w-full justify-start h-auto p-3 rounded-none',
                        index === selectedIndex && 'bg-accent'
                      )}
                      onClick={() => onSelect(block.type)}
                      onMouseEnter={() => setSelectedIndex(index)}
                    >
                      <div className="flex items-center gap-3 w-full">
                        <div className="flex-shrink-0">
                          <Icon className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-sm">
                            {block.label}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {block.description}
                          </div>
                        </div>
                      </div>
                    </Button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t bg-muted/50">
            <div className="text-xs text-muted-foreground text-center">
              ↑↓ para navegar • Enter para selecionar • Esc para fechar
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BlockSelector;