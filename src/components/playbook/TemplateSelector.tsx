// ============================================================================
// TemplateSelector - Seletor de templates para playbooks
// ============================================================================

import React, { useState, useCallback } from 'react';
import {
  Button
} from '@/components/ui/button';
import {
  Input
} from '@/components/ui/input';
import {
  Textarea
} from '@/components/ui/textarea';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Badge
} from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  ScrollArea
} from '@/components/ui/scroll-area';
import {
  Separator
} from '@/components/ui/separator';
import {
  Avatar,
  AvatarFallback,
  AvatarImage
} from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import {
  Search,
  Plus,
  FileText,
  Clock,
  User,
  Star,
  Copy,
  Eye,
  Filter,
  Grid3X3,
  List,
  Calendar,
  Tag,
  Bookmark,
  TrendingUp,
  Users,
  Zap,
  Target,
  BookOpen,
  Lightbulb,
  Settings,
  CheckCircle
} from 'lucide-react';
import {
  TemplateSelectorProps,
  PlaybookTemplate,
  PlaybookCategory,
  PLAYBOOK_CATEGORIES
} from '@/types/playbook';
import { usePlaybookTemplates } from '@/hooks/usePlaybook';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Seletor de templates para playbooks
 */
export const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  onSelectTemplate,
  onCreateFromScratch,
  className
}) => {
  // Hooks
  const {
    templates,
    isLoading,
    createFromTemplate,
    favoriteTemplate,
    unfavoriteTemplate
  } = usePlaybookTemplates();

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PlaybookCategory | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'recent' | 'popular' | 'name'>('recent');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');
  const [newTemplateDescription, setNewTemplateDescription] = useState('');
  const [newTemplateCategory, setNewTemplateCategory] = useState<PlaybookCategory>('general');

  // Filter and sort templates
  const filteredTemplates = React.useMemo(() => {
    let filtered = templates || [];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        template.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory);
    }

    // Sort templates
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'popular':
          return (b.usage_count || 0) - (a.usage_count || 0);
        case 'recent':
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });

    return filtered;
  }, [templates, searchTerm, selectedCategory, sortBy]);

  // Handle template selection
  const handleSelectTemplate = useCallback(async (template: PlaybookTemplate) => {
    try {
      const newPlaybook = await createFromTemplate(template.id);
      onSelectTemplate?.(newPlaybook);
    } catch (error) {
      console.error('Erro ao criar playbook do template:', error);
    }
  }, [createFromTemplate, onSelectTemplate]);

  // Handle favorite toggle
  const handleFavoriteToggle = useCallback(async (template: PlaybookTemplate, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if (template.is_favorite) {
        await unfavoriteTemplate(template.id);
      } else {
        await favoriteTemplate(template.id);
      }
    } catch (error) {
      console.error('Erro ao favoritar template:', error);
    }
  }, [favoriteTemplate, unfavoriteTemplate]);

  // Get category icon
  const getCategoryIcon = (category: PlaybookCategory) => {
    switch (category) {
      case 'process':
        return <Settings className="h-4 w-4" />;
      case 'training':
        return <BookOpen className="h-4 w-4" />;
      case 'documentation':
        return <FileText className="h-4 w-4" />;
      case 'checklist':
        return <CheckCircle className="h-4 w-4" />;
      case 'meeting':
        return <Users className="h-4 w-4" />;
      case 'project':
        return <Target className="h-4 w-4" />;
      case 'strategy':
        return <TrendingUp className="h-4 w-4" />;
      case 'creative':
        return <Lightbulb className="h-4 w-4" />;
      case 'general':
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Get category color
  const getCategoryColor = (category: PlaybookCategory) => {
    switch (category) {
      case 'process':
        return 'bg-blue-100 text-blue-800';
      case 'training':
        return 'bg-green-100 text-green-800';
      case 'documentation':
        return 'bg-purple-100 text-purple-800';
      case 'checklist':
        return 'bg-orange-100 text-orange-800';
      case 'meeting':
        return 'bg-pink-100 text-pink-800';
      case 'project':
        return 'bg-indigo-100 text-indigo-800';
      case 'strategy':
        return 'bg-red-100 text-red-800';
      case 'creative':
        return 'bg-yellow-100 text-yellow-800';
      case 'general':
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Render template card
  const renderTemplateCard = (template: PlaybookTemplate) => {
    if (viewMode === 'list') {
      return (
        <Card
          key={template.id}
          className="cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => handleSelectTemplate(template)}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <div className={`p-2 rounded-md ${getCategoryColor(template.category)}`}>
                  {getCategoryIcon(template.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{template.name}</h3>
                    {template.is_favorite && (
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {template.description}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {template.created_by?.name || 'Sistema'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(template.updated_at), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </div>
                    <div className="flex items-center gap-1">
                      <Copy className="h-3 w-3" />
                      {template.usage_count || 0} usos
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex flex-wrap gap-1">
                  {template.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {template.tags.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{template.tags.length - 2}
                    </Badge>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => handleFavoriteToggle(template, e)}
                  className="h-8 w-8 p-0"
                >
                  <Star
                    className={`h-4 w-4 ${
                      template.is_favorite
                        ? 'text-yellow-500 fill-current'
                        : 'text-muted-foreground'
                    }`}
                  />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card
        key={template.id}
        className="cursor-pointer hover:shadow-md transition-shadow h-full"
        onClick={() => handleSelectTemplate(template)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className={`p-2 rounded-md ${getCategoryColor(template.category)}`}>
              {getCategoryIcon(template.category)}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => handleFavoriteToggle(template, e)}
              className="h-8 w-8 p-0"
            >
              <Star
                className={`h-4 w-4 ${
                  template.is_favorite
                    ? 'text-yellow-500 fill-current'
                    : 'text-muted-foreground'
                }`}
              />
            </Button>
          </div>
          <div>
            <CardTitle className="text-base line-clamp-2">{template.name}</CardTitle>
            <CardDescription className="line-clamp-2 mt-1">
              {template.description}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-1">
              {template.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {template.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{template.tags.length - 3}
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {template.created_by?.name || 'Sistema'}
              </div>
              <div className="flex items-center gap-1">
                <Copy className="h-3 w-3" />
                {template.usage_count || 0}
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(template.updated_at), {
                addSuffix: true,
                locale: ptBR
              })}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className={`template-selector ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Escolher Template</h2>
          <p className="text-muted-foreground">
            Comece com um template ou crie do zero
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onCreateFromScratch}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Criar do Zero
          </Button>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar templates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as PlaybookCategory | 'all')}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {PLAYBOOK_CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  <div className="flex items-center gap-2">
                    {getCategoryIcon(category)}
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'recent' | 'popular' | 'name')}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recentes</SelectItem>
              <SelectItem value="popular">Populares</SelectItem>
              <SelectItem value="name">Nome</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center border rounded-md">
            <Button
              variant={viewMode === 'grid' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('grid')}
              className="rounded-r-none"
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setViewMode('list')}
              className="rounded-l-none"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Templates Grid/List */}
      <ScrollArea className="h-[600px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="text-muted-foreground">Carregando templates...</div>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">Nenhum template encontrado</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedCategory !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : 'Ainda não há templates disponíveis'}
            </p>
            <Button onClick={onCreateFromScratch}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Template
            </Button>
          </div>
        ) : (
          <div
            className={`${
              viewMode === 'grid'
                ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'
                : 'space-y-3'
            }`}
          >
            {filteredTemplates.map(renderTemplateCard)}
          </div>
        )}
      </ScrollArea>

      {/* Quick Stats */}
      {!isLoading && filteredTemplates.length > 0 && (
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {filteredTemplates.length} template(s) encontrado(s)
            </span>
            <div className="flex items-center gap-4">
              <span>
                {filteredTemplates.filter(t => t.is_favorite).length} favorito(s)
              </span>
              <span>
                {filteredTemplates.reduce((acc, t) => acc + (t.usage_count || 0), 0)} uso(s) total
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TemplateSelector;