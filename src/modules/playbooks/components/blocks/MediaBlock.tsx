import React, { useState, useRef } from 'react';
import { PlaybookBlock } from '../../types/editor';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Image, 
  Video, 
  Upload, 
  Link, 
  Trash2, 
  Settings, 
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Download
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';

interface MediaBlockProps {
  block: PlaybookBlock;
  onUpdate: (blockId: string, updates: Partial<PlaybookBlock>) => void;
  onDelete: (blockId: string) => void;
  onAddBlock: (afterBlockId: string, type: string) => void;
  isSelected: boolean;
  onSelect: (blockId: string) => void;
}

export const MediaBlock: React.FC<MediaBlockProps> = ({
  block,
  onUpdate,
  onDelete,
  onAddBlock,
  isSelected,
  onSelect
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Simular upload - em produção, fazer upload real para o servidor
      const url = URL.createObjectURL(file);
      onUpdate(block.id, {
        content: {
          ...block.content,
          url,
          fileName: file.name,
          fileSize: file.size
        }
      });
      setShowUploadDialog(false);
    }
  };

  const handleUrlChange = (url: string) => {
    onUpdate(block.id, {
      content: { ...block.content, url }
    });
  };

  const handleCaptionChange = (caption: string) => {
    onUpdate(block.id, {
      content: { ...block.content, caption }
    });
  };

  const handleAltChange = (alt: string) => {
    onUpdate(block.id, {
      content: { ...block.content, alt }
    });
  };

  const handleSizeChange = (size: string) => {
    onUpdate(block.id, {
      styling: { ...block.styling, size }
    });
  };

  const handleAlignmentChange = (alignment: string) => {
    onUpdate(block.id, {
      styling: { ...block.styling, textAlign: alignment }
    });
  };

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleVolumeChange = (newVolume: number[]) => {
    const vol = newVolume[0];
    setVolume(vol);
    if (videoRef.current) {
      videoRef.current.volume = vol;
    }
    if (vol === 0) {
      setIsMuted(true);
    } else {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const UploadDialog = () => (
    <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {block.type === 'image' ? 'Adicionar Imagem' : 'Adicionar Vídeo'}
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Upload de arquivo</Label>
            <div className="mt-2">
              <input
                ref={fileInputRef}
                type="file"
                accept={block.type === 'image' ? 'image/*' : 'video/*'}
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                onClick={() => fileInputRef.current?.click()}
                className="w-full"
                variant="outline"
              >
                <Upload className="h-4 w-4 mr-2" />
                Escolher arquivo
              </Button>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">ou</span>
            </div>
          </div>
          
          <div>
            <Label>URL da {block.type === 'image' ? 'imagem' : 'vídeo'}</Label>
            <div className="flex gap-2 mt-2">
              <Input
                placeholder={`https://exemplo.com/${block.type === 'image' ? 'imagem.jpg' : 'video.mp4'}`}
                value={block.content.url || ''}
                onChange={(e) => handleUrlChange(e.target.value)}
              />
              <Button
                onClick={() => setShowUploadDialog(false)}
                disabled={!block.content.url}
              >
                <Link className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );

  const SettingsPanel = () => (
    <div className="space-y-4 p-4 w-80">
      <div>
        <Label>Legenda</Label>
        <Textarea
          value={block.content.caption || ''}
          onChange={(e) => handleCaptionChange(e.target.value)}
          placeholder="Adicione uma legenda..."
          className="mt-1"
        />
      </div>
      
      {block.type === 'image' && (
        <div>
          <Label>Texto alternativo</Label>
          <Input
            value={block.content.alt || ''}
            onChange={(e) => handleAltChange(e.target.value)}
            placeholder="Descrição da imagem para acessibilidade"
            className="mt-1"
          />
        </div>
      )}
      
      <div>
        <Label>Tamanho</Label>
        <Select
          value={block.styling?.size || 'medium'}
          onValueChange={handleSizeChange}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="small">Pequeno</SelectItem>
            <SelectItem value="medium">Médio</SelectItem>
            <SelectItem value="large">Grande</SelectItem>
            <SelectItem value="full">Largura total</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      <div>
        <Label>Alinhamento</Label>
        <Select
          value={block.styling?.textAlign || 'center'}
          onValueChange={handleAlignmentChange}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Esquerda</SelectItem>
            <SelectItem value="center">Centro</SelectItem>
            <SelectItem value="right">Direita</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );

  const renderMedia = () => {
    if (!block.content.url) {
      return (
        <Card className="border-dashed border-2 border-gray-300">
          <CardContent className="flex flex-col items-center justify-center p-8">
            {block.type === 'image' ? (
              <Image className="h-12 w-12 text-gray-400 mb-4" />
            ) : (
              <Video className="h-12 w-12 text-gray-400 mb-4" />
            )}
            <p className="text-gray-500 mb-4">
              {block.type === 'image' ? 'Nenhuma imagem adicionada' : 'Nenhum vídeo adicionado'}
            </p>
            <Button onClick={() => setShowUploadDialog(true)}>
              <Upload className="h-4 w-4 mr-2" />
              {block.type === 'image' ? 'Adicionar imagem' : 'Adicionar vídeo'}
            </Button>
          </CardContent>
        </Card>
      );
    }

    const sizeClasses = {
      small: 'max-w-xs',
      medium: 'max-w-md',
      large: 'max-w-lg',
      full: 'w-full'
    };

    const alignmentClasses = {
      left: 'mr-auto',
      center: 'mx-auto',
      right: 'ml-auto'
    };

    const containerClass = cn(
      sizeClasses[block.styling?.size as keyof typeof sizeClasses] || 'max-w-md',
      alignmentClasses[block.styling?.textAlign as keyof typeof alignmentClasses] || 'mx-auto'
    );

    if (block.type === 'image') {
      return (
        <div className={containerClass}>
          <img
            src={block.content.url}
            alt={block.content.alt || ''}
            className="w-full h-auto rounded-lg shadow-sm"
            onClick={() => onSelect(block.id)}
          />
          {block.content.caption && (
            <p className="text-sm text-gray-600 mt-2 text-center italic">
              {block.content.caption}
            </p>
          )}
        </div>
      );
    }

    if (block.type === 'video') {
      return (
        <div className={containerClass}>
          <div className="relative group">
            <video
              ref={videoRef}
              src={block.content.url}
              className="w-full h-auto rounded-lg shadow-sm"
              onClick={() => onSelect(block.id)}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
            />
            
            {/* Controles customizados */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={togglePlay}
                  className="text-white hover:bg-white/20"
                >
                  {isPlaying ? (
                    <Pause className="h-4 w-4" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleMute}
                  className="text-white hover:bg-white/20"
                >
                  {isMuted ? (
                    <VolumeX className="h-4 w-4" />
                  ) : (
                    <Volume2 className="h-4 w-4" />
                  )}
                </Button>
                
                <div className="flex-1 mx-2">
                  <Slider
                    value={[volume]}
                    onValueChange={handleVolumeChange}
                    max={1}
                    step={0.1}
                    className="w-full"
                  />
                </div>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => videoRef.current?.requestFullscreen()}
                  className="text-white hover:bg-white/20"
                >
                  <Maximize className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          {block.content.caption && (
            <p className="text-sm text-gray-600 mt-2 text-center italic">
              {block.content.caption}
            </p>
          )}
        </div>
      );
    }

    return null;
  };

  return (
    <div className="group relative">
      {/* Toolbar de ações do bloco */}
      <div className="absolute -left-12 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 z-10">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowUploadDialog(true)}
          className="h-6 w-6 p-0"
        >
          <Upload className="h-3 w-3" />
        </Button>
        
        <Popover open={showSettings} onOpenChange={setShowSettings}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              <Settings className="h-3 w-3" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" side="left">
            <SettingsPanel />
          </PopoverContent>
        </Popover>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onDelete(block.id)}
          className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>

      {/* Conteúdo do bloco */}
      <div className={cn('ml-2', {
        'ring-2 ring-blue-500 ring-opacity-50 rounded p-2': isSelected
      })}>
        {renderMedia()}
      </div>

      <UploadDialog />
    </div>
  );
};