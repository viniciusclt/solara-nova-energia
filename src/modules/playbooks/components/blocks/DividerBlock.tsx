import React, { useState, useCallback } from 'react';
import { Button, Input, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import {
  Minus,
  MoreHorizontal,
  Zap,
  Star,
  Heart,
  Circle,
  Square,
  Triangle,
  Diamond,
  Palette,
  Ruler,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Block } from '../../types/editor';

interface DividerMetadata {
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

interface DividerBlockProps {
  block: Block;
  isSelected: boolean;
  isEditing: boolean;
  onUpdate: (content: string, metadata?: Record<string, unknown>) => void;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

export const DividerBlock: React.FC<DividerBlockProps> = ({
  block,
  isSelected,
  isEditing,
  onUpdate,
  onStartEdit,
  onStopEdit,
  onKeyDown,
}) => {
  const [metadata, setMetadata] = useState<DividerMetadata>(() => ({
    style: block.metadata?.style || 'line',
    thickness: block.metadata?.thickness || 'medium',
    color: block.metadata?.color || 'default',
    width: block.metadata?.width || 'full',
    customWidth: block.metadata?.customWidth || 50,
    alignment: block.metadata?.alignment || 'center',
    spacing: block.metadata?.spacing || 'normal',
    decorativeType: block.metadata?.decorativeType || 'dots',
    text: block.metadata?.text || block.content || '',
    showText: block.metadata?.showText ?? false,
  }));

  const updateMetadata = useCallback((updates: Partial<DividerMetadata>) => {
    const newMetadata = { ...metadata, ...updates };
    setMetadata(newMetadata);
    onUpdate(newMetadata.text || '', newMetadata);
  }, [metadata, onUpdate]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onStopEdit();
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      onStopEdit();
    }

    onKeyDown?.(e);
  };

  const getThicknessClass = () => {
    switch (metadata.thickness) {
      case 'thin':
        return 'h-px';
      case 'medium':
        return 'h-0.5';
      case 'thick':
        return 'h-1';
      default:
        return 'h-0.5';
    }
  };

  const getColorClass = () => {
    switch (metadata.color) {
      case 'primary':
        return 'bg-primary';
      case 'secondary':
        return 'bg-secondary';
      case 'accent':
        return 'bg-accent';
      case 'muted':
        return 'bg-muted-foreground/30';
      default:
        return 'bg-border';
    }
  };

  const getWidthClass = () => {
    switch (metadata.width) {
      case 'half':
        return 'w-1/2';
      case 'quarter':
        return 'w-1/4';
      case 'custom':
        return '';
      default:
        return 'w-full';
    }
  };

  const getAlignmentClass = () => {
    switch (metadata.alignment) {
      case 'left':
        return 'mr-auto';
      case 'right':
        return 'ml-auto';
      default:
        return 'mx-auto';
    }
  };

  const getSpacingClass = () => {
    switch (metadata.spacing) {
      case 'tight':
        return 'my-2';
      case 'loose':
        return 'my-8';
      default:
        return 'my-4';
    }
  };

  const getStyleClass = () => {
    const baseClasses = cn(
      getThicknessClass(),
      getColorClass(),
      getWidthClass(),
      getAlignmentClass()
    );

    switch (metadata.style) {
      case 'dashed':
        return cn(baseClasses, 'border-t border-dashed bg-transparent');
      case 'dotted':
        return cn(baseClasses, 'border-t border-dotted bg-transparent');
      case 'double':
        return cn(baseClasses, 'border-t-2 border-double bg-transparent');
      case 'gradient':
        return cn(
          getThicknessClass(),
          getWidthClass(),
          getAlignmentClass(),
          'bg-gradient-to-r from-transparent via-current to-transparent',
          getColorClass().replace('bg-', 'text-')
        );
      default:
        return baseClasses;
    }
  };

  const getDecorativeIcon = (type: string, className: string = 'h-4 w-4') => {
    switch (type) {
      case 'stars':
        return <Star className={className} />;
      case 'hearts':
        return <Heart className={className} />;
      case 'diamonds':
        return <Diamond className={className} />;
      case 'circles':
        return <Circle className={className} />;
      case 'squares':
        return <Square className={className} />;
      case 'triangles':
        return <Triangle className={className} />;
      default:
        return <Circle className={cn(className, 'fill-current')} />;
    }
  };

  const renderDivider = () => {
    if (metadata.style === 'decorative') {
      return (
        <div className={cn(
          'flex items-center justify-center gap-2',
          getSpacingClass(),
          getAlignmentClass()
        )}>
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className={cn('text-current', getColorClass().replace('bg-', 'text-'))}>
              {getDecorativeIcon(metadata.decorativeType || 'dots')}
            </div>
          ))}
        </div>
      );
    }

    if (metadata.showText && metadata.text) {
      return (
        <div className={cn(
          'flex items-center gap-4',
          getSpacingClass(),
          metadata.alignment === 'center' && 'justify-center',
          metadata.alignment === 'right' && 'justify-end'
        )}>
          <div className={cn(
            getStyleClass(),
            'flex-1',
            metadata.alignment === 'left' && 'max-w-16',
            metadata.alignment === 'right' && 'order-2 max-w-16'
          )} />
          
          <span className={cn(
            'text-sm font-medium whitespace-nowrap px-2',
            getColorClass().replace('bg-', 'text-')
          )}>
            {metadata.text}
          </span>
          
          <div className={cn(
            getStyleClass(),
            'flex-1',
            metadata.alignment === 'right' && 'max-w-16',
            metadata.alignment === 'left' && 'order-2 max-w-16'
          )} />
        </div>
      );
    }

    return (
      <div className={getSpacingClass()}>
        <div 
          className={getStyleClass()}
          style={{
            width: metadata.width === 'custom' ? `${metadata.customWidth}%` : undefined
          }}
        />
      </div>
    );
  };

  return (
    <div className="relative group">
      {/* Controls */}
      {isSelected && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 z-50 bg-background border rounded-lg shadow-lg p-1 flex items-center gap-1">
          {/* Style selector */}
          <Select value={metadata.style} onValueChange={(value) => updateMetadata({ style: value as DividerMetadata['style'] })}>
            <SelectTrigger className="h-8 w-24 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line">Linha</SelectItem>
              <SelectItem value="dashed">Tracejada</SelectItem>
              <SelectItem value="dotted">Pontilhada</SelectItem>
              <SelectItem value="double">Dupla</SelectItem>
              <SelectItem value="gradient">Gradiente</SelectItem>
              <SelectItem value="decorative">Decorativa</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Thickness selector */}
          <Select value={metadata.thickness} onValueChange={(value) => updateMetadata({ thickness: value as DividerMetadata['thickness'] })}>
            <SelectTrigger className="h-8 w-20 text-xs">
              <Ruler className="h-3 w-3" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="thin">Fina</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="thick">Grossa</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Color selector */}
          <Select value={metadata.color} onValueChange={(value) => updateMetadata({ color: value as DividerMetadata['color'] })}>
            <SelectTrigger className="h-8 w-20 text-xs">
              <Palette className="h-3 w-3" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="default">Padrão</SelectItem>
              <SelectItem value="primary">Primária</SelectItem>
              <SelectItem value="secondary">Secundária</SelectItem>
              <SelectItem value="accent">Destaque</SelectItem>
              <SelectItem value="muted">Suave</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="w-px h-6 bg-border" />
          
          {/* Width selector */}
          <Select value={metadata.width} onValueChange={(value) => updateMetadata({ width: value as DividerMetadata['width'] })}>
            <SelectTrigger className="h-8 w-20 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="full">Completa</SelectItem>
              <SelectItem value="half">Metade</SelectItem>
              <SelectItem value="quarter">1/4</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Custom width input */}
          {metadata.width === 'custom' && (
            <Input
              type="number"
              min="10"
              max="100"
              value={metadata.customWidth}
              onChange={(e) => updateMetadata({ customWidth: parseInt(e.target.value) || 50 })}
              className="h-8 w-16 text-xs"
              placeholder="%"
            />
          )}
          
          <div className="w-px h-6 bg-border" />
          
          {/* Alignment controls */}
          <Button
            variant={metadata.alignment === 'left' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => updateMetadata({ alignment: 'left' })}
            className="h-8 w-8 p-0"
          >
            <Minus className="h-3 w-3 rotate-45" />
          </Button>
          
          <Button
            variant={metadata.alignment === 'center' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => updateMetadata({ alignment: 'center' })}
            className="h-8 w-8 p-0"
          >
            <Minus className="h-3 w-3" />
          </Button>
          
          <Button
            variant={metadata.alignment === 'right' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => updateMetadata({ alignment: 'right' })}
            className="h-8 w-8 p-0"
          >
            <Minus className="h-3 w-3 -rotate-45" />
          </Button>
          
          <div className="w-px h-6 bg-border" />
          
          {/* Decorative type selector (only for decorative style) */}
          {metadata.style === 'decorative' && (
            <Select value={metadata.decorativeType} onValueChange={(value) => updateMetadata({ decorativeType: value as DividerMetadata['decorativeType'] })}>
              <SelectTrigger className="h-8 w-20 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dots">Pontos</SelectItem>
                <SelectItem value="stars">Estrelas</SelectItem>
                <SelectItem value="hearts">Corações</SelectItem>
                <SelectItem value="diamonds">Diamantes</SelectItem>
                <SelectItem value="circles">Círculos</SelectItem>
                <SelectItem value="squares">Quadrados</SelectItem>
                <SelectItem value="triangles">Triângulos</SelectItem>
              </SelectContent>
            </Select>
          )}
          
          {/* Text toggle */}
          {metadata.style !== 'decorative' && (
            <Button
              variant={metadata.showText ? 'default' : 'ghost'}
              size="sm"
              onClick={() => updateMetadata({ showText: !metadata.showText })}
              className="h-8 px-2 text-xs"
            >
              Texto
            </Button>
          )}
          
          {/* Spacing selector */}
          <Select value={metadata.spacing} onValueChange={(value) => updateMetadata({ spacing: value as DividerMetadata['spacing'] })}>
            <SelectTrigger className="h-8 w-20 text-xs">
              <MoreHorizontal className="h-3 w-3" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tight">Compacto</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
              <SelectItem value="loose">Espaçoso</SelectItem>
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Content */}
      <div
        className={cn(
          'min-h-[2rem] transition-all duration-200',
          'hover:bg-muted/20',
          isSelected && 'ring-2 ring-primary/20 bg-primary/5',
          !isEditing && 'cursor-pointer'
        )}
        onClick={!isEditing ? onStartEdit : undefined}
      >
        {isEditing && metadata.showText ? (
          <div className="p-2">
            <Input
              value={metadata.text}
              onChange={(e) => updateMetadata({ text: e.target.value })}
              onKeyDown={handleKeyDown}
              placeholder="Texto do divisor (opcional)"
              className="text-center"
              autoFocus
            />
          </div>
        ) : (
          renderDivider()
        )}
      </div>

      {/* Divider info indicator */}
      {!isEditing && (
        <div className="absolute top-1/2 right-2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-1 text-xs text-muted-foreground bg-background/80 px-1 py-0.5 rounded">
            <Minus className="h-3 w-3" />
            <span>{metadata.style}</span>
            {metadata.showText && metadata.text && <span>• {metadata.text}</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export default DividerBlock;