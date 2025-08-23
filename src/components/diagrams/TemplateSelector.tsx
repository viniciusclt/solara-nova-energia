import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { ScrollArea } from '../ui/scroll-area';
import { Separator } from '../ui/separator';
import { 
  Search, 
  Star, 
  Clock, 
  Users, 
  Download, 
  Eye, 
  Filter,
  Grid3X3,
  List,
  Plus
} from 'lucide-react';
import { 
  DiagramTemplate, 
  DiagramTemplateCategory, 
  TemplateFilters,
  ApplyTemplateData 
} from '../../types/diagramTemplates';
import diagramTemplateService from '../../services/DiagramTemplateService';

interface TemplateSelectorProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (data: ApplyTemplateData) => void;
  onCreateFromTemplate?: (template: DiagramTemplate) => void;
}

const CATEGORIES: { value: DiagramTemplateCategory; label: string; icon: string }[] = [
  { value: 'organizational', label: 'Organizacional', icon: '🏢' },
  { value: 'process', label: 'Processos', icon: '⚙️' },
  { value: 'flowchart', label: 'Fluxogramas', icon: '📊' },
  { value: 'network', label: 'Redes', icon: '🌐' },
  { value: 'mindmap', label: 'Mapas Mentais', icon: '🧠' },
  { value: 'custom', label: 'Personalizados', icon: '🎨' }
];

const DIFFICULTIES = [
  { value: 'beginner', label: 'Iniciante', color: 'bg-green-100 text-green-800' },
  { value: 'intermediate', label: 'Intermediário', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'advanced', label: 'Avançado', color: 'bg-red-100 text-red-800' }
];

export function TemplateSelector({ 
  isOpen, 
  onClose, 
  onApplyTemplate, 
  onCreateFromTemplate 
}: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<DiagramTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<DiagramTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<DiagramTemplateCategory | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedTemplate, setSelectedTemplate] = useState<DiagramTemplate | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadTemplates();
    }
  }, [isOpen]);

  useEffect(() => {
    applyFilters();
  }, [templates, selectedCategory, searchTerm, selectedDifficulty]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const result = await diagramTemplateService.searchTemplates({}, 1, 100);
      setTemplates(result.templates);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = templates;

    if (selectedCategory !== 'all') {
      filtered = filtered.filter(t => t.category === selectedCategory);
    }

    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(t => t.metadata.difficulty === selectedDifficulty);
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(term) ||
        t.description.toLowerCase().includes(term) ||
        t.metadata.tags.some(tag => tag.toLowerCase().includes(term))
      );
    }

    setFilteredTemplates(filtered);
  };

  const handleApplyTemplate = async (template: DiagramTemplate) => {
    try {
      await diagramTemplateService.recordTemplateUsage(template.id);
      onApplyTemplate({
        templateId: template.id,
        replaceExisting: false
      });
      onClose();
    } catch (error) {
      console.error('Erro ao aplicar template:', error);
    }
  };

  const handlePreviewTemplate = (template: DiagramTemplate) => {
    setSelectedTemplate(template);
    setShowPreview(true);
  };

  const getDifficultyBadge = (difficulty: string) => {
    const config = DIFFICULTIES.find(d => d.value === difficulty);
    return (
      <Badge className={config?.color || 'bg-gray-100 text-gray-800'}>
        {config?.label || difficulty}
      </Badge>
    );
  };

  const renderTemplateCard = (template: DiagramTemplate) => {
    if (viewMode === 'list') {
      return (
        <Card key={template.id} className="mb-3">
          <CardContent className="p-4">
            <div className="flex items-center space-x-4">
              <img 
                src={template.thumbnail} 
                alt={template.name}
                className="w-16 h-12 object-cover rounded border"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold">{template.name}</h3>
                  <div className="flex items-center space-x-2">
                    {getDifficultyBadge(template.metadata.difficulty)}
                    <Badge variant="outline">
                      <Clock className="w-3 h-3 mr-1" />
                      {template.metadata.estimatedTime}min
                    </Badge>
                  </div>
                </div>
                <p className="text-sm text-gray-600 mt-1">{template.description}</p>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex flex-wrap gap-1">
                    {template.metadata.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handlePreviewTemplate(template)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => handleApplyTemplate(template)}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Usar
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow">
        <CardHeader className="p-3">
          <img 
            src={template.thumbnail} 
            alt={template.name}
            className="w-full h-32 object-cover rounded border mb-2"
          />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-semibold truncate">
                {template.name}
              </CardTitle>
              {template.isDefault && (
                <Badge variant="secondary" className="text-xs">
                  Padrão
                </Badge>
              )}
            </div>
            <CardDescription className="text-xs line-clamp-2">
              {template.description}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-3 pt-0">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              {getDifficultyBadge(template.metadata.difficulty)}
              <div className="flex items-center text-gray-500">
                <Clock className="w-3 h-3 mr-1" />
                {template.metadata.estimatedTime}min
              </div>
            </div>
            
            <div className="flex flex-wrap gap-1">
              {template.metadata.tags.slice(0, 2).map(tag => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
            
            <div className="flex space-x-1 pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 text-xs"
                onClick={() => handlePreviewTemplate(template)}
              >
                <Eye className="w-3 h-3 mr-1" />
                Preview
              </Button>
              <Button 
                size="sm" 
                className="flex-1 text-xs"
                onClick={() => handleApplyTemplate(template)}
              >
                <Plus className="w-3 h-3 mr-1" />
                Usar
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] p-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>Selecionar Template</DialogTitle>
            <DialogDescription>
              Escolha um template para começar seu diagrama rapidamente
            </DialogDescription>
          </DialogHeader>
          
          <div className="px-6">
            {/* Filtros */}
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Buscar templates..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Dificuldade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {DIFFICULTIES.map(diff => (
                    <SelectItem key={diff.value} value={diff.value}>
                      {diff.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <div className="flex border rounded-md">
                <Button
                  variant={viewMode === 'grid' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="rounded-r-none"
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="rounded-l-none"
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as any)} className="px-6">
            <TabsList className="grid w-full grid-cols-7">
              <TabsTrigger value="all" className="text-xs">Todos</TabsTrigger>
              {CATEGORIES.map(category => (
                <TabsTrigger key={category.value} value={category.value} className="text-xs">
                  <span className="mr-1">{category.icon}</span>
                  {category.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          <ScrollArea className="flex-1 px-6 pb-6" style={{ maxHeight: '60vh' }}>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-sm text-gray-600">Carregando templates...</p>
                </div>
              </div>
            ) : filteredTemplates.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 mb-2">Nenhum template encontrado</p>
                <p className="text-sm text-gray-500">Tente ajustar os filtros de busca</p>
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4' 
                : 'space-y-2'
              }>
                {filteredTemplates.map(renderTemplateCard)}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          {selectedTemplate && (
            <>
              <DialogHeader>
                <DialogTitle>{selectedTemplate.name}</DialogTitle>
                <DialogDescription>{selectedTemplate.description}</DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  {getDifficultyBadge(selectedTemplate.metadata.difficulty)}
                  <Badge variant="outline">
                    <Clock className="w-3 h-3 mr-1" />
                    {selectedTemplate.metadata.estimatedTime} minutos
                  </Badge>
                  <Badge variant="outline">
                    {selectedTemplate.nodes.length} nós
                  </Badge>
                  <Badge variant="outline">
                    {selectedTemplate.edges.length} conexões
                  </Badge>
                </div>
                
                <div className="flex flex-wrap gap-1">
                  {selectedTemplate.metadata.tags.map(tag => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
                
                <Separator />
                
                <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-center">
                  <img 
                    src={selectedTemplate.thumbnail} 
                    alt={selectedTemplate.name}
                    className="max-w-full max-h-96 object-contain border rounded"
                  />
                </div>
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setShowPreview(false)}>
                    Fechar
                  </Button>
                  <Button onClick={() => {
                    handleApplyTemplate(selectedTemplate);
                    setShowPreview(false);
                  }}>
                    <Plus className="w-4 h-4 mr-1" />
                    Usar Template
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default TemplateSelector;