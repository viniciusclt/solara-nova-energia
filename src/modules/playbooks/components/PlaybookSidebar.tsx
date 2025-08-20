import React, { useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Separator,
  Switch,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Slider,
  Badge,
  ScrollArea,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui';
import {
  X,
  FileText,
  Clock,
  BarChart3,
  Settings,
  Palette,
  Type,
  Save,
  Users,
  MessageSquare,
  History,
  LayoutTemplate,
  Folder,
  Star,
  Search,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EditorSettings } from '../types/editor';

interface PlaybookStats {
  wordCount: number;
  blockCount: number;
  readingTime: number;
}

interface PlaybookSidebarProps {
  onClose: () => void;
  onTemplateSelect: (templateId: string) => void;
  onSettingsChange: (settings: Partial<EditorSettings>) => void;
  settings: EditorSettings;
  stats: PlaybookStats;
}

export const PlaybookSidebar: React.FC<PlaybookSidebarProps> = ({
  onClose,
  onTemplateSelect,
  onSettingsChange,
  settings,
  stats,
}) => {
  const [activeTab, setActiveTab] = useState('stats');

  const formatReadingTime = (minutes: number) => {
    if (minutes < 1) return 'Menos de 1 min';
    if (minutes === 1) return '1 min';
    return `${Math.round(minutes)} min`;
  };

  const recentTemplates = [
    {
      id: '1',
      name: 'Processo de Vendas',
      description: 'Template para processos comerciais',
      blocks: 12,
      lastUsed: '2 dias atrás',
    },
    {
      id: '2',
      name: 'Onboarding Cliente',
      description: 'Guia de integração de novos clientes',
      blocks: 8,
      lastUsed: '1 semana atrás',
    },
    {
      id: '3',
      name: 'Checklist Projeto',
      description: 'Lista de verificação para projetos',
      blocks: 15,
      lastUsed: '2 semanas atrás',
    },
  ];

  const recentPlaybooks = [
    {
      id: '1',
      title: 'Estratégia Q1 2025',
      lastModified: '2 horas atrás',
      blocks: 24,
      isStarred: true,
    },
    {
      id: '2',
      title: 'Manual de Processos',
      lastModified: '1 dia atrás',
      blocks: 18,
      isStarred: false,
    },
    {
      id: '3',
      title: 'Plano de Marketing',
      lastModified: '3 dias atrás',
      blocks: 32,
      isStarred: true,
    },
  ];

  return (
    <div className="w-80 h-full border-r bg-background flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <h2 className="font-semibold text-lg">Painel</h2>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-4 space-y-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="stats" className="text-xs">
                <BarChart3 className="h-3 w-3" />
              </TabsTrigger>
              <TabsTrigger value="recent" className="text-xs">
                <Clock className="h-3 w-3" />
              </TabsTrigger>
              <TabsTrigger value="templates" className="text-xs">
                <LayoutTemplate className="h-3 w-3" />
              </TabsTrigger>
              <TabsTrigger value="settings" className="text-xs">
                <Settings className="h-3 w-3" />
              </TabsTrigger>
            </TabsList>

            {/* Statistics Tab */}
            <TabsContent value="stats" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Estatísticas
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {stats.blockCount}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Blocos
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary">
                        {stats.wordCount}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Palavras
                      </div>
                    </div>
                  </div>
                  
                  <Separator />
                  
                  <div className="text-center">
                    <div className="text-lg font-semibold">
                      {formatReadingTime(stats.readingTime)}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Tempo de leitura
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Ações Rápidas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Save className="h-4 w-4 mr-2" />
                    Salvar como Template
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <Users className="h-4 w-4 mr-2" />
                    Compartilhar
                  </Button>
                  <Button variant="outline" size="sm" className="w-full justify-start">
                    <History className="h-4 w-4 mr-2" />
                    Ver Histórico
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Recent Tab */}
            <TabsContent value="recent" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Playbooks Recentes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentPlaybooks.map((playbook) => (
                    <div
                      key={playbook.id}
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted/50 cursor-pointer"
                    >
                      <FileText className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1">
                          <span className="text-sm font-medium truncate">
                            {playbook.title}
                          </span>
                          {playbook.isStarred && (
                            <Star className="h-3 w-3 text-yellow-500 fill-current" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {playbook.blocks} blocos • {playbook.lastModified}
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Templates Tab */}
            <TabsContent value="templates" className="space-y-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <LayoutTemplate className="h-4 w-4" />
                    Templates
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {recentTemplates.map((template) => (
                    <div
                      key={template.id}
                      className="p-3 border rounded-lg hover:bg-muted/50 cursor-pointer"
                      onClick={() => onTemplateSelect(template.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {template.name}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {template.description}
                          </div>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="secondary" className="text-xs">
                              {template.blocks} blocos
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {template.lastUsed}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-4">
              {/* Appearance */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Palette className="h-4 w-4" />
                    Aparência
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm">Tema</Label>
                    <Select
                      value={settings.theme}
                      onValueChange={(value) => onSettingsChange({ theme: value as 'light' | 'dark' | 'auto' })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Claro</SelectItem>
                        <SelectItem value="dark">Escuro</SelectItem>
                        <SelectItem value="auto">Automático</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-sm">Tamanho da Fonte</Label>
                    <div className="px-2">
                      <Slider
                        value={[settings.fontSize]}
                        onValueChange={([value]) => onSettingsChange({ fontSize: value })}
                        min={12}
                        max={20}
                        step={1}
                        className="w-full"
                      />
                      <div className="flex justify-between text-xs text-muted-foreground mt-1">
                        <span>12px</span>
                        <span>{settings.fontSize}px</span>
                        <span>20px</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Editor */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Type className="h-4 w-4" />
                    Editor
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Auto-salvar</Label>
                    <Switch
                      checked={settings.autoSave}
                      onCheckedChange={(checked) => onSettingsChange({ autoSave: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Numeração de linhas</Label>
                    <Switch
                      checked={settings.showLineNumbers}
                      onCheckedChange={(checked) => onSettingsChange({ showLineNumbers: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Quebra de linha</Label>
                    <Switch
                      checked={settings.wordWrap}
                      onCheckedChange={(checked) => onSettingsChange({ wordWrap: checked })}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Collaboration */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Colaboração
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Colaboração em tempo real</Label>
                    <Switch
                      checked={settings.enableCollaboration}
                      onCheckedChange={(checked) => onSettingsChange({ enableCollaboration: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Mostrar cursores</Label>
                    <Switch
                      checked={settings.showCursors}
                      onCheckedChange={(checked) => onSettingsChange({ showCursors: checked })}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <Label className="text-sm">Comentários</Label>
                    <Switch
                      checked={settings.enableComments}
                      onCheckedChange={(checked) => onSettingsChange({ enableComments: checked })}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
};

export default PlaybookSidebar;