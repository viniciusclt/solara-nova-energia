import React, { useState, useRef } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { cn } from '../../../lib/utils';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '../../ui/popover';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../ui/dialog';
import {
  Upload,
  Link,
  Settings,
  Trash2,
  Image as ImageIcon,
  RotateCw,
  Crop,
  Filter
} from 'lucide-react';
import type { ProposalElement, ImageProperties } from '../../../types/proposal-editor';

interface ImageElementData {
  element: ProposalElement;
  isSelected: boolean;
  onUpdate: (updates: Partial<ProposalElement>) => void;
  onDelete: () => void;
  onSelect: () => void;
}

export const ImageElementNode: React.FC<NodeProps<ImageElementData>> = ({
  data
}) => {
  const { element, isSelected, onUpdate, onDelete, onSelect } = data;
  const properties = element.properties as ImageProperties;
  
  const [isLoading, setIsLoading] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [showUrlDialog, setShowUrlDialog] = useState(false);
  const [urlInput, setUrlInput] = useState(properties.src);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const updateProperty = (key: keyof ImageProperties, value: string | number | boolean) => {
    onUpdate({
      properties: {
        ...properties,
        [key]: value
      }
    });
  };

  const handleImageLoad = () => {
    setIsLoading(false);
    setImageError(false);
  };

  const handleImageError = () => {
    setIsLoading(false);
    setImageError(true);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setIsLoading(true);
      
      // Criar URL temporária para preview
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        updateProperty('src', result);
        updateProperty('alt', file.name);
        setIsLoading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUrlSubmit = () => {
    if (urlInput.trim()) {
      setIsLoading(true);
      updateProperty('src', urlInput.trim());
      setShowUrlDialog(false);
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const imageStyle = {
    objectFit: properties.objectFit || 'cover',
    opacity: properties.opacity || 1,
    borderRadius: properties.borderRadius ? `${properties.borderRadius}px` : '0'
  } as React.CSSProperties;

  return (
    <div
      className={cn(
        'relative bg-white border-2 border-transparent rounded-lg overflow-hidden',
        'hover:border-blue-300 transition-colors',
        isSelected && 'border-blue-500 shadow-lg',
        'group cursor-pointer'
      )}
      onClick={onSelect}
      style={{
        width: element.position.width,
        height: element.position.height
      }}
    >
      {/* Handles para conexões */}
      <Handle
        type="target"
        position={Position.Top}
        className="opacity-0 group-hover:opacity-100"
      />
      <Handle
        type="source"
        position={Position.Bottom}
        className="opacity-0 group-hover:opacity-100"
      />

      {/* Input de arquivo oculto */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Conteúdo da imagem */}
      <div className="w-full h-full relative">
        {isLoading ? (
          <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : imageError || !properties.src ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
            <ImageIcon className="h-12 w-12 mb-2" />
            <p className="text-sm text-center px-2">
              {imageError ? 'Erro ao carregar imagem' : 'Clique para adicionar imagem'}
            </p>
          </div>
        ) : (
          <img
            src={properties.src}
            alt={properties.alt || 'Imagem'}
            style={imageStyle}
            className="w-full h-full"
            onLoad={handleImageLoad}
            onError={handleImageError}
            draggable={false}
          />
        )}

        {/* Overlay para upload quando não há imagem */}
        {(!properties.src || imageError) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={triggerFileUpload}
                className="bg-white/90 backdrop-blur-sm"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload
              </Button>
              
              <Dialog open={showUrlDialog} onOpenChange={setShowUrlDialog}>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-white/90 backdrop-blur-sm"
                  >
                    <Link className="h-4 w-4 mr-2" />
                    URL
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Adicionar imagem por URL</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="image-url">URL da imagem</Label>
                      <Input
                        id="image-url"
                        value={urlInput}
                        onChange={(e) => setUrlInput(e.target.value)}
                        placeholder="https://exemplo.com/imagem.jpg"
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleUrlSubmit();
                          }
                        }}
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => setShowUrlDialog(false)}
                      >
                        Cancelar
                      </Button>
                      <Button onClick={handleUrlSubmit}>
                        Adicionar
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        )}
      </div>

      {/* Toolbar de edição */}
      {isSelected && properties.src && !imageError && (
        <div className="absolute -top-12 left-0 flex items-center space-x-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-1 z-10">
          {/* Upload nova imagem */}
          <Button
            variant="ghost"
            size="sm"
            onClick={triggerFileUpload}
            className="h-8 w-8 p-0"
            title="Trocar imagem"
          >
            <Upload className="h-3 w-3" />
          </Button>

          {/* URL da imagem */}
          <Dialog open={showUrlDialog} onOpenChange={setShowUrlDialog}>
            <DialogTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                title="Alterar URL"
              >
                <Link className="h-3 w-3" />
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Alterar URL da imagem</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="image-url-edit">URL da imagem</Label>
                  <Input
                    id="image-url-edit"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    placeholder="https://exemplo.com/imagem.jpg"
                  />
                </div>
                <div>
                  <Label htmlFor="image-alt">Texto alternativo</Label>
                  <Input
                    id="image-alt"
                    value={properties.alt || ''}
                    onChange={(e) => updateProperty('alt', e.target.value)}
                    placeholder="Descrição da imagem"
                  />
                </div>
                <div className="flex justify-end space-x-2">
                  <Button
                    variant="outline"
                    onClick={() => setShowUrlDialog(false)}
                  >
                    Cancelar
                  </Button>
                  <Button onClick={handleUrlSubmit}>
                    Salvar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {/* Ajuste de objeto */}
          <Select
            value={properties.objectFit || 'cover'}
            onValueChange={(value) => updateProperty('objectFit', value)}
          >
            <SelectTrigger className="h-8 w-20 text-xs">
              <Crop className="h-3 w-3" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="cover">Cobrir</SelectItem>
              <SelectItem value="contain">Conter</SelectItem>
              <SelectItem value="fill">Preencher</SelectItem>
              <SelectItem value="scale-down">Reduzir</SelectItem>
            </SelectContent>
          </Select>

          {/* Configurações avançadas */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <Settings className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3">
              <div className="space-y-3">
                <h4 className="font-medium text-sm">Configurações da Imagem</h4>
                
                <div>
                  <Label className="text-xs font-medium">Opacidade</Label>
                  <div className="flex items-center space-x-2 mt-1">
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={properties.opacity || 1}
                      onChange={(e) => updateProperty('opacity', parseFloat(e.target.value))}
                      className="flex-1"
                    />
                    <span className="text-xs w-8 text-right">
                      {Math.round((properties.opacity || 1) * 100)}%
                    </span>
                  </div>
                </div>
                
                <div>
                  <Label className="text-xs font-medium">Borda arredondada (px)</Label>
                  <Input
                    type="number"
                    value={properties.borderRadius || 0}
                    onChange={(e) => updateProperty('borderRadius', parseInt(e.target.value))}
                    min="0"
                    max="50"
                    className="mt-1"
                  />
                </div>
                
                <div>
                  <Label className="text-xs font-medium">Ajuste do objeto</Label>
                  <Select
                    value={properties.objectFit || 'cover'}
                    onValueChange={(value) => updateProperty('objectFit', value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cover">
                        <div className="flex flex-col">
                          <span>Cobrir</span>
                          <span className="text-xs text-gray-500">Preenche mantendo proporção</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="contain">
                        <div className="flex flex-col">
                          <span>Conter</span>
                          <span className="text-xs text-gray-500">Cabe inteira no container</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="fill">
                        <div className="flex flex-col">
                          <span>Preencher</span>
                          <span className="text-xs text-gray-500">Estica para preencher</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="scale-down">
                        <div className="flex flex-col">
                          <span>Reduzir</span>
                          <span className="text-xs text-gray-500">Menor entre contain e none</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </PopoverContent>
          </Popover>

          {/* Deletar */}
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Indicador de seleção */}
      {isSelected && (
        <div className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none" />
      )}

      {/* Resize handles */}
      {isSelected && (
        <>
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-se-resize" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-ne-resize" />
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-nw-resize" />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-sw-resize" />
        </>
      )}
    </div>
  );
};

export default ImageElementNode;