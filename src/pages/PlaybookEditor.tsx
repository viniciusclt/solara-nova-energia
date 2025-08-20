// ============================================================================
// PlaybookEditor Page - Página principal do editor de playbooks
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Button
} from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger
} from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from '@/components/ui/breadcrumb';
import {
  Separator
} from '@/components/ui/separator';
import {
  Badge
} from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';
import {
  ArrowLeft,
  FileText,
  Plus,
  Settings,
  Users,
  History,
  MessageSquare,
  Share2,
  Download,
  Eye,
  Edit,
  Save,
  Clock,
  CheckCircle,
  AlertCircle,
  BookOpen,
  Lightbulb,
  Target,
  TrendingUp,
  Zap,
  Star,
  Archive
} from 'lucide-react';
import {
  PlaybookEditor as PlaybookEditorComponent,
  PlaybookLibrary,
  TemplateSelector
} from '@/components/playbook';
import {
  PlaybookDocument,
  PlaybookStatus,
  PlaybookCategory
} from '@/types/playbook';
import { usePlaybook, usePlaybookLibrary, usePlaybookTemplates } from '@/hooks/usePlaybook';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

/**
 * Página principal do Editor de Playbooks
 */
export const PlaybookEditorPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  
  // Hooks
  const { createPlaybook } = usePlaybookLibrary();
  const { createFromTemplate } = usePlaybookTemplates();
  
  // Local state
  const [currentView, setCurrentView] = useState<'library' | 'templates' | 'editor'>(
    id ? 'editor' : 'library'
  );
  const [currentPlaybook, setCurrentPlaybook] = useState<PlaybookDocument | null>(null);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize playbook if ID is provided
  useEffect(() => {
    if (id && id !== 'new') {
      // Load existing playbook
      setCurrentView('editor');
      // In a real implementation, you would fetch the playbook here
    } else if (id === 'new') {
      setCurrentView('templates');
    }
  }, [id]);

  // Handle creating new playbook from scratch
  const handleCreateFromScratch = useCallback(async () => {
    try {
      setIsLoading(true);
      const newPlaybook = await createPlaybook({
        title: 'Novo Playbook',
        description: '',
        category: 'general' as PlaybookCategory,
        access_level: 'private',
        tags: [],
        blocks: []
      });
      
      setCurrentPlaybook(newPlaybook);
      setCurrentView('editor');
      navigate(`/playbooks/editor/${newPlaybook.id}`);
      toast.success('Novo playbook criado com sucesso!');
    } catch (error) {
      console.error('Erro ao criar playbook:', error);
      toast.error('Erro ao criar novo playbook');
    } finally {
      setIsLoading(false);
    }
  }, [createPlaybook, navigate]);

  // Handle creating playbook from template
  const handleCreateFromTemplate = useCallback(async (playbook: PlaybookDocument) => {
    try {
      setCurrentPlaybook(playbook);
      setCurrentView('editor');
      navigate(`/playbooks/editor/${playbook.id}`);
      toast.success('Playbook criado a partir do template!');
    } catch (error) {
      console.error('Erro ao criar playbook do template:', error);
      toast.error('Erro ao criar playbook do template');
    }
  }, [navigate]);

  // Handle selecting existing playbook
  const handleSelectPlaybook = useCallback((playbook: PlaybookDocument) => {
    setCurrentPlaybook(playbook);
    setCurrentView('editor');
    navigate(`/playbooks/editor/${playbook.id}`);
  }, [navigate]);

  // Handle going back to library
  const handleBackToLibrary = useCallback(() => {
    setCurrentView('library');
    setCurrentPlaybook(null);
    navigate('/playbooks');
  }, [navigate]);

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

  // Render breadcrumb
  const renderBreadcrumb = () => {
    return (
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink 
              href="/playbooks" 
              onClick={(e) => {
                e.preventDefault();
                handleBackToLibrary();
              }}
            >
              Playbooks
            </BreadcrumbLink>
          </BreadcrumbItem>
          {currentView === 'editor' && currentPlaybook && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{currentPlaybook.title}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
          {currentView === 'templates' && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Templates</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>
    );
  };

  // Render header
  const renderHeader = () => {
    if (currentView === 'editor' && currentPlaybook) {
      return (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToLibrary}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-md bg-primary/10">
                {getCategoryIcon(currentPlaybook.category)}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{currentPlaybook.title}</h1>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Badge className={getStatusColor(currentPlaybook.status)}>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(currentPlaybook.status)}
                      {currentPlaybook.status}
                    </div>
                  </Badge>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Atualizado {formatDistanceToNow(new Date(currentPlaybook.updated_at), {
                      addSuffix: true,
                      locale: ptBR
                    })}
                  </div>
                  <span>•</span>
                  <div className="flex items-center gap-1">
                    <Eye className="h-3 w-3" />
                    {currentPlaybook.view_count || 0} visualizações
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Compartilhar</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Exportar</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Button size="sm" className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Salvar
            </Button>
          </div>
        </div>
      );
    }

    if (currentView === 'templates') {
      return (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleBackToLibrary}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Escolher Template</h1>
              <p className="text-muted-foreground">
                Comece com um template ou crie do zero
              </p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Editor de Playbooks</h1>
          <p className="text-muted-foreground">
            Crie e gerencie seus playbooks e documentos
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentView('templates')}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Novo Playbook
          </Button>
        </div>
      </div>
    );
  };

  // Render content based on current view
  const renderContent = () => {
    switch (currentView) {
      case 'editor':
        if (!currentPlaybook) {
          return (
            <Card>
              <CardContent className="flex items-center justify-center h-40">
                <div className="text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="font-medium mb-2">Playbook não encontrado</h3>
                  <p className="text-muted-foreground mb-4">
                    O playbook que você está tentando editar não foi encontrado.
                  </p>
                  <Button onClick={handleBackToLibrary}>
                    Voltar à Biblioteca
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        }
        return (
          <PlaybookEditorComponent
            playbookId={currentPlaybook.id}
            initialData={currentPlaybook}
            readOnly={false}
            showComments={true}
            showHistory={true}
            showCollaboration={true}
            onSave={(data) => {
              console.log('Playbook saved:', data);
              toast.success('Playbook salvo com sucesso!');
            }}
            onPublish={(data) => {
              console.log('Playbook published:', data);
              toast.success('Playbook publicado com sucesso!');
            }}
            onShare={(data) => {
              console.log('Playbook shared:', data);
              toast.success('Playbook compartilhado!');
            }}
          />
        );
      
      case 'templates':
        return (
          <TemplateSelector
            onSelectTemplate={handleCreateFromTemplate}
            onCreateFromScratch={handleCreateFromScratch}
          />
        );
      
      case 'library':
      default:
        return (
          <PlaybookLibrary
            onSelectPlaybook={handleSelectPlaybook}
            onCreateNew={() => setCurrentView('templates')}
          />
        );
    }
  };

  return (
    <div className="playbook-editor-page min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4">
          {renderBreadcrumb()}
          <div className="mt-4">
            {renderHeader()}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        {renderContent()}
      </div>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <Card>
            <CardContent className="flex items-center gap-4 p-6">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <div>
                <h3 className="font-medium">Criando playbook...</h3>
                <p className="text-sm text-muted-foreground">Aguarde um momento</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default PlaybookEditorPage;