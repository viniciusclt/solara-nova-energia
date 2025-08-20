import React, { useState, useRef, useCallback } from 'react';
import { Button, Input, Textarea, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui';
import {
  Image as ImageIcon,
  Upload,
  Link,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Maximize,
  Minimize,
  RotateCw,
  Crop,
  Download,
  ExternalLink,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Block } from '../../types/editor';

interface ImageMetadata {
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

interface ImageBlockProps {
  block: Block;
  isSelected: boolean;
  isEditing: boolean;
  onUpdate: (content: string, metadata?: Record<string, unknown>) => void;
  onStartEdit: () => void;
  onStopEdit: () => void;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}

export const ImageBlock: React.FC<ImageBlockProps> = ({
  block,
  isSelected,
  isEditing,
  onUpdate,
  onStartEdit,
  onStopEdit,
  onKeyDown,
}) => {
  const [metadata, setMetadata] = useState<ImageMetadata>(() => ({
    src: block.content || '',
    alt: block.metadata?.alt || '',
    caption: block.metadata?.caption || '',
    width: block.metadata?.width,
    height: block.metadata?.height,
    alignment: block.metadata?.alignment || 'center',
    size: block.metadata?.size || 'medium',
    borderRadius: block.metadata?.borderRadius || 0,
    shadow: block.metadata?.shadow || false,
  }));
  
  const [uploadMode, setUploadMode] = useState<'url' | 'file'>('url');
  const [urlInput, setUrlInput] = useState(metadata.src);
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const captionRef = useRef<HTMLTextAreaElement>(null);

  const updateMetadata = useCallback((updates: Partial<ImageMetadata>) => {
    const newMetadata = { ...metadata, ...updates };
    setMetadata(newMetadata);
    onUpdate(newMetadata.src, newMetadata);
  }, [metadata, onUpdate]);

  const handleFileUpload = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecione um arquivo de imagem válido.');
      return;
    }

    setIsLoading(true);
    setImageError(false);

    try {
      // Simular upload - em produção, isso seria uma chamada real para API
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        updateMetadata({ 
          src: result,
          alt: metadata.alt || file.name.split('.')[0]
        });
        setUrlInput(result);
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      setImageError(true);
      setIsLoading(false);
    }
  }, [metadata.alt, updateMetadata]);

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      setImageError(false);
      updateMetadata({ src: urlInput.trim() });
    }
  };

  const handleImageLoad = () => {
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (uploadMode === 'url') {
        handleUrlSubmit();
      }
      onStopEdit();
    }

    if (e.key === 'Escape') {
      e.preventDefault();
      onStopEdit();
    }

    onKeyDown?.(e);
  };

  const getSizeClass = (size: ImageMetadata['size']) => {
    switch (size) {
      case 'small':
        return 'max-w-xs';
      case 'medium':
        return 'max-w-md';
      case 'large':
        return 'max-w-2xl';
      case 'full':
        return 'w-full';
      default:
        return 'max-w-md';
    }
  };

  const getAlignmentClass = (alignment: ImageMetadata['alignment']) => {
    switch (alignment) {
      case 'left':
        return 'mr-auto';
      case 'center':
        return 'mx-auto';
      case 'right':
        return 'ml-auto';
      default:
        return 'mx-auto';
    }
  };

  const downloadImage = async () => {
    if (metadata.src) {
      try {
        const response = await fetch(metadata.src);
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = metadata.alt || 'image';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Erro ao baixar imagem:', error);
      }
    }
  };

  const openInNewTab = () => {
    if (metadata.src) {
      window.open(metadata.src, '_blank');
    }
  };

  return (
    <div className="relative group">
      {/* Controls */}
      {isSelected && (
        <div className="absolute -top-12 left-1/2 transform -translate-x-1/2 z-50 bg-background border rounded-lg shadow-lg p-1 flex items-center gap-1">
          {/* Size controls */}
          <Select value={metadata.size} onValueChange={(value) => updateMetadata({ size: value as ImageMetadata['size'] })}>
            <SelectTrigger className="h-8 w-20 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="small">Pequena</SelectItem>
              <SelectItem value="medium">Média</SelectItem>
              <SelectItem value="large">Grande</SelectItem>
              <SelectItem value="full">Completa</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="w-px h-6 bg-border" />
          
          {/* Alignment controls */}
          <Button
            variant={metadata.alignment === 'left' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => updateMetadata({ alignment: 'left' })}
            className="h-8 w-8 p-0"
          >
            <AlignLeft className="h-3 w-3" />
          </Button>
          
          <Button
            variant={metadata.alignment === 'center' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => updateMetadata({ alignment: 'center' })}
            className="h-8 w-8 p-0"
          >
            <AlignCenter className="h-3 w-3" />
          </Button>
          
          <Button
            variant={metadata.alignment === 'right' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => updateMetadata({ alignment: 'right' })}
            className="h-8 w-8 p-0"
          >
            <AlignRight className="h-3 w-3" />
          </Button>
          
          <div className="w-px h-6 bg-border" />
          
          {/* Style controls */}
          <Button
            variant={metadata.shadow ? 'default' : 'ghost'}
            size="sm"
            onClick={() => updateMetadata({ shadow: !metadata.shadow })}
            className="h-8 px-2 text-xs"
          >
            Sombra
          </Button>
          
          <div className="w-px h-6 bg-border" />
          
          {/* Action buttons */}
          {metadata.src && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={downloadImage}
                className="h-8 w-8 p-0"
              >
                <Download className="h-3 w-3" />
              </Button>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={openInNewTab}
                className="h-8 w-8 p-0"
              >
                <ExternalLink className="h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      )}

      {/* Content */}
      <div
        className={cn(
          'min-h-[8rem] px-3 py-2 rounded-md transition-all duration-200',
          'hover:bg-muted/50',
          isSelected && 'ring-2 ring-primary/20 bg-primary/5',
          isEditing && 'bg-background border-2 border-primary/30',
          !isEditing && 'cursor-pointer'
        )}
        onClick={!isEditing ? onStartEdit : undefined}
      >
        {!metadata.src || isEditing ? (
          /* Upload/Edit Mode */
          <div className="space-y-4">
            {/* Upload Mode Selector */}
            <div className="flex items-center gap-2">
              <Button
                variant={uploadMode === 'url' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUploadMode('url')}
              >
                <Link className="h-4 w-4 mr-2" />
                URL
              </Button>
              
              <Button
                variant={uploadMode === 'file' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUploadMode('file')}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
            </div>

            {/* URL Input */}
            {uploadMode === 'url' && (
              <div className="space-y-2">
                <Input
                  placeholder="Cole a URL da imagem aqui..."
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full"
                />
                <Button
                  onClick={handleUrlSubmit}
                  disabled={!urlInput.trim()}
                  className="w-full"
                >
                  Adicionar Imagem
                </Button>
              </div>
            )}

            {/* File Upload */}
            {uploadMode === 'file' && (
              <div className="space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileUpload(file);
                  }}
                  className="hidden"
                />
                
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading ? (
                    'Carregando...'
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Selecionar Arquivo
                    </>
                  )}
                </Button>
                
                <p className="text-xs text-muted-foreground text-center">
                  Formatos suportados: JPG, PNG, GIF, WebP
                </p>
              </div>
            )}

            {/* Alt Text */}
            <Input
              placeholder="Texto alternativo (alt)"
              value={metadata.alt}
              onChange={(e) => updateMetadata({ alt: e.target.value })}
              className="w-full"
            />

            {/* Caption */}
            <Textarea
              ref={captionRef}
              placeholder="Legenda da imagem (opcional)"
              value={metadata.caption}
              onChange={(e) => updateMetadata({ caption: e.target.value })}
              rows={2}
              className="w-full"
            />
          </div>
        ) : (
          /* Display Mode */
          <div className={cn('space-y-2', getAlignmentClass(metadata.alignment))}>
            <div className={cn('relative', getSizeClass(metadata.size))}>
              {imageError ? (
                <div className="flex flex-col items-center justify-center h-48 bg-muted rounded-lg border-2 border-dashed">
                  <ImageIcon className="h-12 w-12 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground text-center">
                    Erro ao carregar imagem
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onStartEdit}
                    className="mt-2"
                  >
                    Editar
                  </Button>
                </div>
              ) : (
                <img
                  src={metadata.src}
                  alt={metadata.alt}
                  onLoad={handleImageLoad}
                  onError={handleImageError}
                  className={cn(
                    'w-full h-auto rounded-lg transition-all duration-200',
                    metadata.shadow && 'shadow-lg',
                    'hover:opacity-90'
                  )}
                  style={{
                    borderRadius: metadata.borderRadius ? `${metadata.borderRadius}px` : undefined,
                  }}
                />
              )}
            </div>
            
            {/* Caption */}
            {metadata.caption && (
              <p className="text-sm text-muted-foreground text-center italic">
                {metadata.caption}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-md">
          <div className="flex items-center gap-2 text-sm">
            <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
            Carregando imagem...
          </div>
        </div>
      )}

      {/* Image info indicator */}
      {metadata.src && !isEditing && (
        <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="flex items-center gap-1 text-xs text-muted-foreground bg-background/80 px-1 py-0.5 rounded">
            <ImageIcon className="h-3 w-3" />
            <span>{metadata.size}</span>
            {metadata.shadow && <span>• sombra</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageBlock;