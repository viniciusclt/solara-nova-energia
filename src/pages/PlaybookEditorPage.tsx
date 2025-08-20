import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  FileText,
  Plus,
  Settings,
  Users,
  Eye,
  Edit3,
  Clock,
  Tag,
  Star,
} from 'lucide-react';
import {
  PlaybookEditor,
  usePlaybookStore,
  TemplateGallery,
} from '@/modules/playbooks';

const PlaybookEditorPage: React.FC = () => {
  const {
    playbooks,
    createPlaybook,
    deletePlaybook,
    duplicatePlaybook,
  } = usePlaybookStore();
  
  const [selectedPlaybookId, setSelectedPlaybookId] = useState<string | null>(
    playbooks.length > 0 ? playbooks[0].id : null
  );
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);
  const [editorMode, setEditorMode] = useState<'edit' | 'preview'>('edit');
  const [showSidebar, setShowSidebar] = useState(true);
  const [showCollaboration, setShowCollaboration] = useState(false);

  const selectedPlaybook = playbooks.find(p => p.id === selectedPlaybookId);

  const handleCreatePlaybook = () => {
    const newPlaybookId = createPlaybook({
      title: 'Novo Playbook',
      description: 'Descrição do novo playbook',
      blocks: [],
      tags: [],
      category: 'general',
      difficulty: 'beginner',
      estimatedTime: 30,
      version: '1.0.0',
      author: {
        id: 'user-1',
        name: 'Usuário',
        email: 'usuario@exemplo.com',
        avatar: ''
      },
      collaborators: [],
      isPublic: false,
      metadata: {
        wordCount: 0,
        readingTime: 1,
        lastEditedBy: 'user-1'
      }
    });
    setSelectedPlaybookId(newPlaybookId);
  };

  const handleSelectTemplate = (template: {
    id: string;
    name: string;
    title?: string;
    description: string;
    category: string;
    tags: string[];
    blocks?: Array<Record<string, unknown>>;
    difficulty: string;
    estimatedTime: number;
  }) => {
    const newPlaybookId = createPlaybook({
      title: template.title,
      description: template.description,
      blocks: template.blocks || [],
      tags: template.tags || [],
      category: template.category || 'general',
      difficulty: template.difficulty || 'beginner',
      estimatedTime: template.estimatedTime || 30,
      version: '1.0.0',
      author: {
        id: 'user-1',
        name: 'Usuário',
        email: 'usuario@exemplo.com',
        avatar: ''
      },
      collaborators: [],
      isPublic: false,
      metadata: {
        wordCount: 0,
        readingTime: 1,
        lastEditedBy: 'user-1'
      }
    });
    setSelectedPlaybookId(newPlaybookId);
    setShowTemplateGallery(false);
  };

  if (showTemplateGallery) {
    return (
      <div className="h-screen bg-background">
        <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="flex h-14 items-center px-4">
            <Button
              variant="ghost"
              onClick={() => setShowTemplateGallery(false)}
            >
              ← Voltar
            </Button>
            <div className="ml-4">
              <h1 className="text-lg font-semibold">Galeria de Templates</h1>
              <p className="text-sm text-muted-foreground">
                Escolha um template para começar
              </p>
            </div>
          </div>
        </div>
        <TemplateGallery
          onSelectTemplate={handleSelectTemplate}
          onCreateBlank={handleCreatePlaybook}
        />
      </div>
    );
  }

  if (!selectedPlaybook) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <Card className="p-8 max-w-md text-center">
          <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold mb-2">Nenhum Playbook Selecionado</h2>
          <p className="text-muted-foreground mb-6">
            Crie um novo playbook ou selecione um existente para começar.
          </p>
          <div className="space-y-2">
            <Button onClick={handleCreatePlaybook} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Criar Novo Playbook
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowTemplateGallery(true)}
              className="w-full"
            >
              <Star className="h-4 w-4 mr-2" />
              Usar Template
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center px-4">
          <div className="flex items-center space-x-4">
            <h1 className="text-lg font-semibold">Editor de Playbooks</h1>
            <Separator orientation="vertical" className="h-6" />
            
            {/* Playbook Selector */}
            <Tabs value={selectedPlaybookId || ''} onValueChange={setSelectedPlaybookId}>
              <TabsList className="h-8">
                {playbooks.map((playbook) => (
                  <TabsTrigger
                    key={playbook.id}
                    value={playbook.id}
                    className="text-xs px-3"
                  >
                    {playbook.title}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <div className="ml-auto flex items-center space-x-2">
            {/* Playbook Info */}
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Badge variant="secondary" className="text-xs">
                <Tag className="h-3 w-3 mr-1" />
                {selectedPlaybook.category}
              </Badge>
              <Badge variant="outline" className="text-xs">
                <Clock className="h-3 w-3 mr-1" />
                {selectedPlaybook.estimatedTime}min
              </Badge>
            </div>

            <Separator orientation="vertical" className="h-6" />

            {/* View Controls */}
            <Button
              variant={editorMode === 'edit' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setEditorMode('edit')}
            >
              <Edit3 className="h-4 w-4 mr-1" />
              Editar
            </Button>
            <Button
              variant={editorMode === 'preview' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setEditorMode('preview')}
            >
              <Eye className="h-4 w-4 mr-1" />
              Visualizar
            </Button>

            <Separator orientation="vertical" className="h-6" />

            {/* Layout Controls */}
            <Button
              variant={showSidebar ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setShowSidebar(!showSidebar)}
            >
              <Settings className="h-4 w-4" />
            </Button>
            <Button
              variant={showCollaboration ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setShowCollaboration(!showCollaboration)}
            >
              <Users className="h-4 w-4" />
            </Button>

            <Separator orientation="vertical" className="h-6" />

            {/* Actions */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleCreatePlaybook}
            >
              <Plus className="h-4 w-4 mr-1" />
              Novo
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowTemplateGallery(true)}
            >
              <Star className="h-4 w-4 mr-1" />
              Templates
            </Button>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="h-[calc(100vh-3.5rem)]">
        <PlaybookEditor
          playbookId={selectedPlaybook.id}
          readOnly={editorMode === 'preview'}
          showSidebar={showSidebar}
          showCollaboration={showCollaboration}
        />
      </div>
    </div>
  );
};

export default PlaybookEditorPage;