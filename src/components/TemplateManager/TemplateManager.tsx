import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  Eye,
  Save,
  X,
  FileText,
  Building2,
  BarChart3,
  BookOpen,
  Zap,
  Monitor,
  FileImage,
  History,
  Download,
  Upload
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logError } from '@/utils/secureLogger';

interface Template {
  id: string;
  name: string;
  description: string;
  category: string;
  content: string;
  version: number;
  created_at: string;
  updated_at: string;
  created_by: string;
  is_active: boolean;
  preview_url?: string;
}

interface TemplateVersion {
  id: string;
  template_id: string;
  version: number;
  content: string;
  created_at: string;
  created_by: string;
  change_description: string;
}

const templateCategories = [
  { id: 'standard', name: 'Padrão', icon: FileText },
  { id: 'premium', name: 'Premium', icon: Building2 },
  { id: 'corporate', name: 'Corporativo', icon: Building2 },
  { id: 'data-focused', name: 'Focado em Dados', icon: BarChart3 },
  { id: 'storytelling', name: 'Storytelling', icon: BookOpen },
  { id: 'presentation', name: 'Apresentação', icon: Monitor },
  { id: 'professional', name: 'Profissional', icon: FileImage }
];

export function TemplateManager() {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [templateVersions, setTemplateVersions] = useState<TemplateVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showVersionDialog, setShowVersionDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [newTemplate, setNewTemplate] = useState({
    name: '',
    description: '',
    category: 'standard',
    content: ''
  });

  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('proposal_templates')
        .select('*')
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      logError('Erro ao carregar templates', {
        service: 'TemplateManager',
        error: (error as Error).message || 'Erro desconhecido'
      });
      toast({
        title: 'Erro ao carregar templates',
        description: 'Não foi possível carregar os templates.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const loadTemplateVersions = async (templateId: string) => {
    try {
      const { data, error } = await supabase
        .from('template_versions')
        .select('*')
        .eq('template_id', templateId)
        .order('version', { ascending: false });

      if (error) throw error;
      setTemplateVersions(data || []);
    } catch (error) {
      logError('Erro ao carregar versões de template', {
        service: 'TemplateManager',
        error: (error as Error).message || 'Erro desconhecido',
        templateId: templateId
      });
      toast({
        title: 'Erro ao carregar versões',
        description: 'Não foi possível carregar o histórico de versões.',
        variant: 'destructive'
      });
    }
  };

  const createTemplate = async () => {
    if (!newTemplate.name || !newTemplate.content) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o nome e conteúdo do template.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('proposal_templates')
        .insert({
          name: newTemplate.name,
          description: newTemplate.description,
          category: newTemplate.category,
          content: newTemplate.content,
          version: 1,
          created_by: user.id,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      // Create initial version
      await supabase
        .from('template_versions')
        .insert({
          template_id: data.id,
          version: 1,
          content: newTemplate.content,
          created_by: user.id,
          change_description: 'Versão inicial'
        });

      setTemplates([data, ...templates]);
      setNewTemplate({ name: '', description: '', category: 'standard', content: '' });
      setShowCreateDialog(false);
      
      toast({
        title: 'Template criado',
        description: 'Template criado com sucesso!'
      });
    } catch (error) {
      logError('Erro ao criar template', {
        service: 'TemplateManager',
        error: (error as Error).message || 'Erro desconhecido',
        templateName: newTemplate.name,
        category: newTemplate.category
      });
      toast({
        title: 'Erro ao criar template',
        description: 'Não foi possível criar o template.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateTemplate = async (template: Template) => {
    if (!template.name || !template.content) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha o nome e conteúdo do template.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const newVersion = template.version + 1;
      
      const { error } = await supabase
        .from('proposal_templates')
        .update({
          name: template.name,
          description: template.description,
          category: template.category,
          content: template.content,
          version: newVersion,
          updated_at: new Date().toISOString()
        })
        .eq('id', template.id);

      if (error) throw error;

      // Create new version
      await supabase
        .from('template_versions')
        .insert({
          template_id: template.id,
          version: newVersion,
          content: template.content,
          created_by: user.id,
          change_description: 'Atualização do template'
        });

      setTemplates(templates.map(t => t.id === template.id ? { ...template, version: newVersion } : t));
      setEditingTemplate(null);
      
      toast({
        title: 'Template atualizado',
        description: 'Template atualizado com sucesso!'
      });
    } catch (error) {
      logError('Erro ao atualizar template', {
        service: 'TemplateManager',
        error: (error as Error).message || 'Erro desconhecido',
        templateId: template.id,
        templateName: template.name
      });
      toast({
        title: 'Erro ao atualizar template',
        description: 'Não foi possível atualizar o template.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteTemplate = async (templateId: string) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('proposal_templates')
        .update({ is_active: false })
        .eq('id', templateId);

      if (error) throw error;

      setTemplates(templates.filter(t => t.id !== templateId));
      
      toast({
        title: 'Template removido',
        description: 'Template removido com sucesso!'
      });
    } catch (error) {
      logError('Erro ao remover template', {
        service: 'TemplateManager',
        error: (error as Error).message || 'Erro desconhecido',
        templateId: templateId
      });
      toast({
        title: 'Erro ao remover template',
        description: 'Não foi possível remover o template.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const duplicateTemplate = async (template: Template) => {
    setIsLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('proposal_templates')
        .insert({
          name: `${template.name} (Cópia)`,
          description: template.description,
          category: template.category,
          content: template.content,
          version: 1,
          created_by: user.id,
          is_active: true
        })
        .select()
        .single();

      if (error) throw error;

      // Create initial version for duplicate
      await supabase
        .from('template_versions')
        .insert({
          template_id: data.id,
          version: 1,
          content: template.content,
          created_by: user.id,
          change_description: `Cópia do template ${template.name}`
        });

      setTemplates([data, ...templates]);
      
      toast({
        title: 'Template duplicado',
        description: 'Template duplicado com sucesso!'
      });
    } catch (error) {
      logError('Erro ao duplicar template', {
        service: 'TemplateManager',
        error: (error as Error).message || 'Erro desconhecido',
        templateId: template.id,
        templateName: template.name
      });
      toast({
        title: 'Erro ao duplicar template',
        description: 'Não foi possível duplicar o template.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = activeTab === 'all' || template.category === activeTab;
    return matchesSearch && matchesCategory;
  });

  const getCategoryIcon = (category: string) => {
    const categoryData = templateCategories.find(c => c.id === category);
    return categoryData?.icon || FileText;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Gerenciador de Templates
              </CardTitle>
              <CardDescription>
                Crie, edite e gerencie templates de propostas com versionamento
              </CardDescription>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Template
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[90vw] max-w-4xl h-[85vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Criar Novo Template</DialogTitle>
                  <DialogDescription>
                    Crie um novo template de proposta personalizado
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Nome do Template</Label>
                    <Input
                      id="name"
                      value={newTemplate.name}
                      onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                      placeholder="Ex: Template Corporativo Premium"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Descrição</Label>
                    <Textarea
                      id="description"
                      value={newTemplate.description}
                      onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                      placeholder="Descreva o propósito e características do template"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Categoria</Label>
                    <Select value={newTemplate.category} onValueChange={(value) => setNewTemplate({ ...newTemplate, category: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {templateCategories.map(category => {
                          const IconComponent = category.icon;
                          return (
                            <SelectItem key={category.id} value={category.id}>
                              <div className="flex items-center gap-2">
                                <IconComponent className="h-4 w-4" />
                                {category.name}
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="content">Conteúdo do Template</Label>
                    <Textarea
                      id="content"
                      value={newTemplate.content}
                      onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
                      placeholder="Cole aqui o conteúdo HTML/JSON do template"
                      className="min-h-[200px] font-mono text-sm"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={createTemplate} disabled={isLoading}>
                      <Save className="h-4 w-4 mr-2" />
                      Criar Template
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      <div className="flex gap-4">
        <Input
          placeholder="Buscar templates..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
          aria-label="Buscar templates por nome ou descrição"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="all">Todos</TabsTrigger>
          {templateCategories.map(category => {
            const IconComponent = category.icon;
            return (
              <TabsTrigger key={category.id} value={category.id}>
                <IconComponent className="h-4 w-4 mr-1" />
                {category.name}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map(template => {
              const IconComponent = getCategoryIcon(template.category);
              return (
                <Card key={template.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                          <IconComponent className="h-5 w-5" />
                        </div>
                        <div>
                          <CardTitle className="text-base">{template.name}</CardTitle>
                          <Badge variant="outline" className="mt-1">
                            v{template.version}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <CardDescription className="mt-2">
                      {template.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <span>Categoria: {templateCategories.find(c => c.id === template.category)?.name}</span>
                      <span>{new Date(template.updated_at).toLocaleDateString()}</span>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingTemplate(template)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => duplicateTemplate(template)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTemplate(template);
                          loadTemplateVersions(template.id);
                          setShowVersionDialog(true);
                        }}
                      >
                        <History className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTemplate(template.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Template Dialog */}
      <Dialog open={!!editingTemplate} onOpenChange={() => setEditingTemplate(null)}>
        <DialogContent className="w-[90vw] max-w-4xl h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Template</DialogTitle>
            <DialogDescription>
              Edite o template selecionado. Uma nova versão será criada.
            </DialogDescription>
          </DialogHeader>
          {editingTemplate && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="edit-name">Nome do Template</Label>
                <Input
                  id="edit-name"
                  value={editingTemplate.name}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-description">Descrição</Label>
                <Textarea
                  id="edit-description"
                  value={editingTemplate.description}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, description: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-category">Categoria</Label>
                <Select value={editingTemplate.category} onValueChange={(value) => setEditingTemplate({ ...editingTemplate, category: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {templateCategories.map(category => {
                      const IconComponent = category.icon;
                      return (
                        <SelectItem key={category.id} value={category.id}>
                          <div className="flex items-center gap-2">
                            <IconComponent className="h-4 w-4" />
                            {category.name}
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="edit-content">Conteúdo do Template</Label>
                <Textarea
                  id="edit-content"
                  value={editingTemplate.content}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, content: e.target.value })}
                  className="min-h-[200px] font-mono text-sm"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditingTemplate(null)}>
                  Cancelar
                </Button>
                <Button onClick={() => updateTemplate(editingTemplate)} disabled={isLoading}>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Version History Dialog */}
      <Dialog open={showVersionDialog} onOpenChange={setShowVersionDialog}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Histórico de Versões</DialogTitle>
            <DialogDescription>
              Visualize o histórico de versões do template {selectedTemplate?.name}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-[400px]">
            <div className="space-y-4">
              {templateVersions.map(version => (
                <Card key={version.id}>
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-sm">Versão {version.version}</CardTitle>
                        <CardDescription>{version.change_description}</CardDescription>
                      </div>
                      <Badge variant="outline">
                        {new Date(version.created_at).toLocaleDateString()}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-muted-foreground">
                      Criado em: {new Date(version.created_at).toLocaleString()}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}