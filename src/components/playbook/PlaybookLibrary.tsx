// ============================================================================
// PlaybookLibrary - Biblioteca de playbooks
// ============================================================================

import React, { useState, useCallback } from 'react';
import {
  Button
} from '@/components/ui/button';
import {
  Input
} from '@/components/ui/input';
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/shared/ui/alert-dialog';
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
  Checkbox
} from '@/components/ui/checkbox';
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
  Edit,
  Trash2,
  Share2,
  Download,
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
  CheckCircle,
  MoreHorizontal,
  Archive,
  Lock,
  Globe,
  UserCheck,
  MessageSquare,
  History,
  ExternalLink
} from 'lucide-react';
import {
  PlaybookLibraryProps,
  PlaybookDocument,
  PlaybookStatus,
  PlaybookCategory,
  PlaybookAccessLevel,
  PLAYBOOK_CATEGORIES,
  PLAYBOOK_STATUS_OPTIONS,
  PLAYBOOK_ACCESS_LEVELS
} from '@/types/playbook';
import { usePlaybookLibrary } from '@/hooks/usePlaybook';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Biblioteca de playbooks
 */
export const PlaybookLibrary: React.FC<PlaybookLibraryProps> = ({
  onSelectPlaybook,
  onCreateNew,
  className
}) => {
  // Hooks
  const {
    playbooks,
    isLoading,
    deletePlaybook,
    bulkDelete,
    duplicatePlaybook,
    archivePlaybook,
    unarchivePlaybook
  } = usePlaybookLibrary();

  // Local state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<PlaybookCategory | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<PlaybookStatus | 'all'>('all');
  const [selectedAccess, setSelectedAccess] = useState<PlaybookAccessLevel | 'all'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'recent' | 'name' | 'created' | 'updated'>('recent');
  const [selectedPlaybooks, setSelectedPlaybooks] = useState<string[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [playbookToDelete, setPlaybookToDelete] = useState<string | null>(null);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'favorites' | 'recent' | 'archived'>('all');

  // Filter and sort playbooks
  const filteredPlaybooks = React.useMemo(() => {
    let filtered = playbooks || [];

    // Filter by tab
    switch (activeTab) {
      case 'favorites':
        filtered = filtered.filter(playbook => playbook.is_favorite);
        break;
      case 'recent':
        filtered = filtered.filter(playbook => {
          const lastWeek = new Date();
          lastWeek.setDate(lastWeek.getDate() - 7);
          return new Date(playbook.updated_at) > lastWeek;
        });
        break;
      case 'archived':
        filtered = filtered.filter(playbook => playbook.status === 'archived');
        break;
      case 'all':
      default:
        filtered = filtered.filter(playbook => playbook.status !== 'archived');
        break;
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(playbook =>
        playbook.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        playbook.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        playbook.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(playbook => playbook.category === selectedCategory);
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      filtered = filtered.filter(playbook => playbook.status === selectedStatus);
    }

    // Filter by access level
    if (selectedAccess !== 'all') {
      filtered = filtered.filter(playbook => playbook.access_level === selectedAccess);
    }

    // Sort playbooks
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.title.localeCompare(b.title);
        case 'created':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'updated':
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
        case 'recent':
        default:
          return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
      }
    });

    return filtered;
  }, [playbooks, activeTab, searchTerm, selectedCategory, selectedStatus, selectedAccess, sortBy]);

  // Handle playbook selection
  const handleSelectPlaybook = useCallback((playbook: PlaybookDocument) => {
    onSelectPlaybook?.(playbook);
  }, [onSelectPlaybook]);

  // Handle playbook deletion
  const handleDeletePlaybook = useCallback(async (id: string) => {
    try {
      await deletePlaybook(id);
      setShowDeleteDialog(false);
      setPlaybookToDelete(null);
    } catch (error) {
      console.error('Erro ao deletar playbook:', error);
    }
  }, [deletePlaybook]);

  // Handle bulk deletion
  const handleBulkDelete = useCallback(async () => {
    try {
      await bulkDelete(selectedPlaybooks);
      setSelectedPlaybooks([]);
      setShowBulkActions(false);
    } catch (error) {
      console.error('Erro ao deletar playbooks:', error);
    }
  }, [bulkDelete, selectedPlaybooks]);

  // Handle playbook duplication
  const handleDuplicatePlaybook = useCallback(async (id: string) => {
    try {
      await duplicatePlaybook(id);
    } catch (error) {
      console.error('Erro ao duplicar playbook:', error);
    }
  }, [duplicatePlaybook]);

  // Handle archive/unarchive
  const handleArchiveToggle = useCallback(async (playbook: PlaybookDocument) => {
    try {
      if (playbook.status === 'archived') {
        await unarchivePlaybook(playbook.id);
      } else {
        await archivePlaybook(playbook.id);
      }
    } catch (error) {
      console.error('Erro ao arquivar/desarquivar playbook:', error);
    }
  }, [archivePlaybook, unarchivePlaybook]);

  // Handle checkbox selection
  const handleCheckboxChange = useCallback((playbookId: string, checked: boolean) => {
    if (checked) {
      setSelectedPlaybooks(prev => [...prev, playbookId]);
    } else {
      setSelectedPlaybooks(prev => prev.filter(id => id !== playbookId));
    }
  }, []);

  // Handle select all
  const handleSelectAll = useCallback((checked: boolean) => {
    if (checked) {
      setSelectedPlaybooks(filteredPlaybooks.map(p => p.id));
    } else {
      setSelectedPlaybooks([]);
    }
  }, [filteredPlaybooks]);

  // Get status icon
  const getStatusIcon = (status: PlaybookStatus) => {
    switch (status) {
      case 'draft':
        return <Edit className="h-4 w-4" />;
      case 'published':
        return <CheckCircle className="h-4 w-4" />;
      case 'archived':
        return <Archive className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  // Get status color
  const getStatusColor = (status: PlaybookStatus) => {
    switch (status) {
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'published':
        return 'bg-green-100 text-green-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  // Get access level icon
  const getAccessIcon = (accessLevel: PlaybookAccessLevel) => {
    switch (accessLevel) {
      case 'private':
        return <Lock className="h-3 w-3" />;
      case 'team':
        return <Users className="h-3 w-3" />;
      case 'organization':
        return <UserCheck className="h-3 w-3" />;
      case 'public':
        return <Globe className="h-3 w-3" />;
      default:
        return <Lock className="h-3 w-3" />;
    }
  };

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

  // Render playbook card
  const renderPlaybookCard = (playbook: PlaybookDocument) => {
    const isSelected = selectedPlaybooks.includes(playbook.id);

    if (viewMode === 'list') {
      return (
        <Card
          key={playbook.id}
          className={`cursor-pointer hover:shadow-md transition-shadow ${
            isSelected ? 'ring-2 ring-primary' : ''
          }`}
        >
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => handleCheckboxChange(playbook.id, checked as boolean)}
                onClick={(e) => e.stopPropagation()}
              />
              <div
                className="flex items-center gap-3 flex-1 min-w-0"
                onClick={() => handleSelectPlaybook(playbook)}
              >
                <div className={`p-2 rounded-md ${getCategoryColor(playbook.category)}`}>
                  {getCategoryIcon(playbook.category)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium truncate">{playbook.title}</h3>
                    {playbook.is_favorite && (
                      <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    )}
                    <div className="flex items-center gap-1">
                      {getAccessIcon(playbook.access_level)}
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {playbook.description || 'Sem descrição'}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {playbook.created_by?.name || 'Desconhecido'}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {formatDistanceToNow(new Date(playbook.updated_at), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </div>
                    <div className="flex items-center gap-1">
                      <Eye className="h-3 w-3" />
                      {playbook.view_count || 0} visualizações
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(playbook.status)}>
                  <div className="flex items-center gap-1">
                    {getStatusIcon(playbook.status)}
                    {playbook.status}
                  </div>
                </Badge>
                <div className="flex flex-wrap gap-1">
                  {playbook.tags.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {playbook.tags.length > 2 && (
                    <Badge variant="secondary" className="text-xs">
                      +{playbook.tags.length - 2}
                    </Badge>
                  )}
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleSelectPlaybook(playbook)}>
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleSelectPlaybook(playbook)}>
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDuplicatePlaybook(playbook.id)}>
                      <Copy className="h-4 w-4 mr-2" />
                      Duplicar
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => handleArchiveToggle(playbook)}>
                      <Archive className="h-4 w-4 mr-2" />
                      {playbook.status === 'archived' ? 'Desarquivar' : 'Arquivar'}
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => {
                        setPlaybookToDelete(playbook.id);
                        setShowDeleteDialog(true);
                      }}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Deletar
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card
        key={playbook.id}
        className={`cursor-pointer hover:shadow-md transition-shadow h-full ${
          isSelected ? 'ring-2 ring-primary' : ''
        }`}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={isSelected}
                onCheckedChange={(checked) => handleCheckboxChange(playbook.id, checked as boolean)}
                onClick={(e) => e.stopPropagation()}
              />
              <div className={`p-2 rounded-md ${getCategoryColor(playbook.category)}`}>
                {getCategoryIcon(playbook.category)}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {playbook.is_favorite && (
                <Star className="h-4 w-4 text-yellow-500 fill-current" />
              )}
              {getAccessIcon(playbook.access_level)}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => handleSelectPlaybook(playbook)}>
                    <Eye className="h-4 w-4 mr-2" />
                    Visualizar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSelectPlaybook(playbook)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Editar
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleDuplicatePlaybook(playbook.id)}>
                    <Copy className="h-4 w-4 mr-2" />
                    Duplicar
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleArchiveToggle(playbook)}>
                    <Archive className="h-4 w-4 mr-2" />
                    {playbook.status === 'archived' ? 'Desarquivar' : 'Arquivar'}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      setPlaybookToDelete(playbook.id);
                      setShowDeleteDialog(true);
                    }}
                    className="text-destructive"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Deletar
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <div onClick={() => handleSelectPlaybook(playbook)}>
            <CardTitle className="text-base line-clamp-2">{playbook.title}</CardTitle>
            <CardDescription className="line-clamp-2 mt-1">
              {playbook.description || 'Sem descrição'}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="pt-0" onClick={() => handleSelectPlaybook(playbook)}>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(playbook.status)}>
                <div className="flex items-center gap-1">
                  {getStatusIcon(playbook.status)}
                  {playbook.status}
                </div>
              </Badge>
            </div>
            <div className="flex flex-wrap gap-1">
              {playbook.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
              {playbook.tags.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{playbook.tags.length - 3}
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {playbook.created_by?.name || 'Desconhecido'}
              </div>
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {playbook.view_count || 0}
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              {formatDistanceToNow(new Date(playbook.updated_at), {
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
    <div className={`playbook-library ${className || ''}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Biblioteca de Playbooks</h2>
          <p className="text-muted-foreground">
            Gerencie seus playbooks e documentos
          </p>
        </div>
        <div className="flex items-center gap-2">
          {selectedPlaybooks.length > 0 && (
            <Button
              variant="destructive"
              onClick={() => setShowBulkActions(true)}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Deletar ({selectedPlaybooks.length})
            </Button>
          )}
          <Button
            onClick={onCreateNew}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Novo Playbook
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as typeof activeTab)} className="mb-6">
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          <TabsTrigger value="favorites">Favoritos</TabsTrigger>
          <TabsTrigger value="recent">Recentes</TabsTrigger>
          <TabsTrigger value="archived">Arquivados</TabsTrigger>
        </TabsList>
      </Tabs>

      {/* Filters and Search */}
      <div className="flex flex-col lg:flex-row gap-4 mb-6">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar playbooks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {filteredPlaybooks.length > 0 && (
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedPlaybooks.length === filteredPlaybooks.length}
                onCheckedChange={handleSelectAll}
              />
              <span className="text-sm text-muted-foreground">Selecionar todos</span>
            </div>
          )}
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
          <Select value={selectedStatus} onValueChange={(value) => setSelectedStatus(value as PlaybookStatus | 'all')}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {PLAYBOOK_STATUS_OPTIONS.map((status) => (
                <SelectItem key={status} value={status}>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(status)}
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedAccess} onValueChange={(value) => setSelectedAccess(value as PlaybookAccessLevel | 'all')}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Acesso" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {PLAYBOOK_ACCESS_LEVELS.map((access) => (
                <SelectItem key={access} value={access}>
                  <div className="flex items-center gap-2">
                    {getAccessIcon(access)}
                    {access.charAt(0).toUpperCase() + access.slice(1)}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as typeof sortBy)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recentes</SelectItem>
              <SelectItem value="name">Nome</SelectItem>
              <SelectItem value="created">Criação</SelectItem>
              <SelectItem value="updated">Atualização</SelectItem>
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

      {/* Playbooks Grid/List */}
      <ScrollArea className="h-[600px]">
        {isLoading ? (
          <div className="flex items-center justify-center h-40">
            <div className="text-muted-foreground">Carregando playbooks...</div>
          </div>
        ) : filteredPlaybooks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <FileText className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="font-medium mb-2">Nenhum playbook encontrado</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all'
                ? 'Tente ajustar os filtros de busca'
                : 'Ainda não há playbooks criados'}
            </p>
            <Button onClick={onCreateNew}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Playbook
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
            {filteredPlaybooks.map(renderPlaybookCard)}
          </div>
        )}
      </ScrollArea>

      {/* Quick Stats */}
      {!isLoading && filteredPlaybooks.length > 0 && (
        <div className="mt-6 pt-4 border-t">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>
              {filteredPlaybooks.length} playbook(s) encontrado(s)
            </span>
            <div className="flex items-center gap-4">
              <span>
                {filteredPlaybooks.filter(p => p.is_favorite).length} favorito(s)
              </span>
              <span>
                {filteredPlaybooks.filter(p => p.status === 'published').length} publicado(s)
              </span>
              <span>
                {filteredPlaybooks.reduce((acc, p) => acc + (p.view_count || 0), 0)} visualizações
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar este playbook? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => playbookToDelete && handleDeletePlaybook(playbookToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Actions Dialog */}
      <AlertDialog open={showBulkActions} onOpenChange={setShowBulkActions}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão em massa</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja deletar {selectedPlaybooks.length} playbook(s)? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deletar Todos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PlaybookLibrary;