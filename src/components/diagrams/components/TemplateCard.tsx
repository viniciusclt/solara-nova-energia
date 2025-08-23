// ============================================================================
// TemplateCard Component - Card de template de diagrama
// ============================================================================
// Componente reutilizável para exibir informações de um template
// Suporta diferentes layouts e ações
// ============================================================================

import React from 'react';
import { DiagramTemplate } from '../services/DiagramTemplateService';
import { 
  Star, 
  Download, 
  Eye, 
  Clock, 
  Tag, 
  Zap,
  MoreVertical,
  Heart,
  Share2,
  Copy
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

// ============================================================================
// INTERFACES
// ============================================================================

export interface TemplateCardProps {
  template: DiagramTemplate;
  layout?: 'grid' | 'list';
  showActions?: boolean;
  showMetadata?: boolean;
  onClick?: (template: DiagramTemplate) => void;
  onFavorite?: (template: DiagramTemplate) => void;
  onShare?: (template: DiagramTemplate) => void;
  onClone?: (template: DiagramTemplate) => void;
  className?: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const TemplateCard: React.FC<TemplateCardProps> = ({
  template,
  layout = 'grid',
  showActions = true,
  showMetadata = true,
  onClick,
  onFavorite,
  onShare,
  onClone,
  className
}) => {
  // ============================================================================
  // HANDLERS
  // ============================================================================
  
  const handleClick = () => {
    onClick?.(template);
  };
  
  const handleFavorite = (e: React.MouseEvent) => {
    e.stopPropagation();
    onFavorite?.(template);
    toast.success('Template adicionado aos favoritos');
  };
  
  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    onShare?.(template);
    
    // Copiar link para clipboard (simulado)
    navigator.clipboard.writeText(`Template: ${template.name}`);
    toast.success('Link do template copiado');
  };
  
  const handleClone = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClone?.(template);
    toast.success('Template clonado com sucesso');
  };
  
  // ============================================================================
  // UTILITÁRIOS
  // ============================================================================
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'advanced':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'flowchart':
        return '🔄';
      case 'mindmap':
        return '🧠';
      case 'organogram':
        return '🏢';
      default:
        return '📊';
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };
  
  // ============================================================================
  // RENDERIZAÇÃO
  // ============================================================================
  
  if (layout === 'list') {
    return (
      <Card 
        className={cn(
          'cursor-pointer hover:shadow-md transition-all duration-200 border-l-4',
          template.metadata.isFeatured ? 'border-l-yellow-500' : 'border-l-blue-500',
          className
        )}
        onClick={handleClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              {/* Thumbnail */}
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg flex items-center justify-center text-2xl">
                {template.thumbnail ? (
                  <img 
                    src={template.thumbnail} 
                    alt={template.name}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  getTypeIcon(template.type)
                )}
              </div>
              
              {/* Informações */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <h3 className="font-semibold text-gray-900 truncate">
                    {template.name}
                  </h3>
                  {template.metadata.isFeatured && (
                    <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
                      <Star className="w-3 h-3 mr-1" />
                      Destaque
                    </Badge>
                  )}
                  {template.metadata.isPopular && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <Zap className="w-3 h-3 mr-1" />
                      Popular
                    </Badge>
                  )}
                </div>
                
                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                  {template.description}
                </p>
                
                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span className="flex items-center">
                    <Tag className="w-3 h-3 mr-1" />
                    {template.category}
                  </span>
                  
                  <Badge 
                    variant="outline" 
                    className={cn('text-xs', getDifficultyColor(template.difficulty))}
                  >
                    {template.difficulty === 'beginner' ? 'Iniciante' :
                     template.difficulty === 'intermediate' ? 'Intermediário' : 'Avançado'}
                  </Badge>
                  
                  {showMetadata && (
                    <>
                      <span className="flex items-center">
                        <Download className="w-3 h-3 mr-1" />
                        {template.metadata.downloads}
                      </span>
                      
                      <span className="flex items-center">
                        <Star className="w-3 h-3 mr-1" />
                        {template.metadata.rating.toFixed(1)}
                      </span>
                      
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        {formatDate(template.metadata.updatedAt)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
            
            {/* Ações */}
            {showActions && (
              <div className="flex items-center space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFavorite}
                  className="text-gray-500 hover:text-red-500"
                >
                  <Heart className="w-4 h-4" />
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="text-gray-500">
                      <MoreVertical className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={handleShare}>
                      <Share2 className="w-4 h-4 mr-2" />
                      Compartilhar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={handleClone}>
                      <Copy className="w-4 h-4 mr-2" />
                      Clonar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem>
                      <Eye className="w-4 h-4 mr-2" />
                      Visualizar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Layout Grid
  return (
    <Card 
      className={cn(
        'cursor-pointer hover:shadow-lg transition-all duration-200 group',
        'hover:scale-[1.02] hover:-translate-y-1',
        className
      )}
      onClick={handleClick}
    >
      <CardHeader className="p-0">
        {/* Thumbnail */}
        <div className="relative w-full h-32 bg-gradient-to-br from-blue-100 to-purple-100 rounded-t-lg overflow-hidden">
          {template.thumbnail ? (
            <img 
              src={template.thumbnail} 
              alt={template.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl">
              {getTypeIcon(template.type)}
            </div>
          )}
          
          {/* Badges de destaque */}
          <div className="absolute top-2 left-2 flex space-x-1">
            {template.metadata.isFeatured && (
              <Badge className="bg-yellow-500 text-white text-xs">
                <Star className="w-3 h-3 mr-1" />
                Destaque
              </Badge>
            )}
            {template.metadata.isPopular && (
              <Badge className="bg-green-500 text-white text-xs">
                <Zap className="w-3 h-3 mr-1" />
                Popular
              </Badge>
            )}
          </div>
          
          {/* Ações rápidas */}
          {showActions && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleFavorite}
                className="bg-white/90 text-gray-700 hover:text-red-500 w-8 h-8 p-0"
              >
                <Heart className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="p-4">
        {/* Título e descrição */}
        <div className="mb-3">
          <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
            {template.name}
          </h3>
          <p className="text-sm text-gray-600 line-clamp-2">
            {template.description}
          </p>
        </div>
        
        {/* Tags */}
        <div className="flex flex-wrap gap-1 mb-3">
          <Badge variant="outline" className="text-xs">
            {template.category}
          </Badge>
          <Badge 
            variant="outline" 
            className={cn('text-xs', getDifficultyColor(template.difficulty))}
          >
            {template.difficulty === 'beginner' ? 'Iniciante' :
             template.difficulty === 'intermediate' ? 'Intermediário' : 'Avançado'}
          </Badge>
          {template.tags.slice(0, 2).map(tag => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>
        
        {/* Metadados */}
        {showMetadata && (
          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center space-x-3">
              <span className="flex items-center">
                <Download className="w-3 h-3 mr-1" />
                {template.metadata.downloads}
              </span>
              
              <span className="flex items-center">
                <Star className="w-3 h-3 mr-1" />
                {template.metadata.rating.toFixed(1)}
              </span>
            </div>
            
            <span className="flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {formatDate(template.metadata.updatedAt)}
            </span>
          </div>
        )}
        
        {/* Ações */}
        {showActions && (
          <div className="flex items-center justify-between mt-3 pt-3 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="flex-1 mr-2"
            >
              <Share2 className="w-4 h-4 mr-1" />
              Compartilhar
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="px-2">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={handleClone}>
                  <Copy className="w-4 h-4 mr-2" />
                  Clonar
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Eye className="w-4 h-4 mr-2" />
                  Visualizar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TemplateCard;