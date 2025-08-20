import React, { useState } from 'react';
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Badge,
  Input,
  ScrollArea,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui';
import {
  Search,
  Filter,
  Star,
  Clock,
  Users,
  FileText,
  Briefcase,
  GraduationCap,
  Heart,
  Zap,
  Target,
  CheckSquare,
  MessageSquare,
  Calendar,
  TrendingUp,
  Settings,
  Plus,
  Eye,
  Download,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Template {
  id: string;
  name: string;
  description: string;
  category: 'business' | 'education' | 'personal' | 'marketing' | 'project' | 'sales';
  tags: string[];
  blockCount: number;
  estimatedTime: number; // em minutos
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  rating: number;
  usageCount: number;
  createdBy: string;
  createdAt: string;
  lastUpdated: string;
  isPopular: boolean;
  isFeatured: boolean;
  preview: {
    blocks: Array<{
      type: string;
      content: string;
    }>;
  };
}

interface TemplateGalleryProps {
  onSelectTemplate: (template: Template) => void;
  onCreateFromTemplate: (templateId: string) => void;
  onClose?: () => void;
}

export const TemplateGallery: React.FC<TemplateGalleryProps> = ({
  onSelectTemplate,
  onCreateFromTemplate,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'recent' | 'rating'>('popular');
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null);

  // Mock templates data
  const templates: Template[] = [
    {
      id: '1',
      name: 'Processo de Vendas B2B',
      description: 'Template completo para estruturar processos de vendas B2B, desde prospecção até fechamento.',
      category: 'sales',
      tags: ['vendas', 'b2b', 'processo', 'crm'],
      blockCount: 15,
      estimatedTime: 45,
      difficulty: 'intermediate',
      rating: 4.8,
      usageCount: 1250,
      createdBy: 'Equipe Solara',
      createdAt: '2024-01-15',
      lastUpdated: '2024-12-01',
      isPopular: true,
      isFeatured: true,
      preview: {
        blocks: [
          { type: 'heading', content: 'Processo de Vendas B2B' },
          { type: 'paragraph', content: 'Este playbook define o processo completo de vendas...' },
          { type: 'todo', content: 'Qualificar lead' },
        ],
      },
    },
    {
      id: '2',
      name: 'Onboarding de Clientes',
      description: 'Guia estruturado para integração de novos clientes com checklist e marcos importantes.',
      category: 'business',
      tags: ['onboarding', 'clientes', 'integração', 'checklist'],
      blockCount: 12,
      estimatedTime: 30,
      difficulty: 'beginner',
      rating: 4.6,
      usageCount: 890,
      createdBy: 'Maria Silva',
      createdAt: '2024-02-10',
      lastUpdated: '2024-11-15',
      isPopular: true,
      isFeatured: false,
      preview: {
        blocks: [
          { type: 'heading', content: 'Onboarding de Clientes' },
          { type: 'paragraph', content: 'Processo estruturado para integração...' },
          { type: 'checklist', content: 'Documentos necessários' },
        ],
      },
    },
    {
      id: '3',
      name: 'Plano de Marketing Digital',
      description: 'Template para criação de estratégias de marketing digital com métricas e KPIs.',
      category: 'marketing',
      tags: ['marketing', 'digital', 'estratégia', 'kpis'],
      blockCount: 20,
      estimatedTime: 60,
      difficulty: 'advanced',
      rating: 4.9,
      usageCount: 650,
      createdBy: 'João Santos',
      createdAt: '2024-03-05',
      lastUpdated: '2024-12-10',
      isPopular: false,
      isFeatured: true,
      preview: {
        blocks: [
          { type: 'heading', content: 'Plano de Marketing Digital' },
          { type: 'paragraph', content: 'Estratégia completa para marketing digital...' },
          { type: 'table', content: 'Métricas e KPIs' },
        ],
      },
    },
    {
      id: '4',
      name: 'Gestão de Projetos Ágeis',
      description: 'Framework para gestão de projetos usando metodologias ágeis como Scrum e Kanban.',
      category: 'project',
      tags: ['projetos', 'agile', 'scrum', 'kanban'],
      blockCount: 18,
      estimatedTime: 50,
      difficulty: 'intermediate',
      rating: 4.7,
      usageCount: 720,
      createdBy: 'Ana Costa',
      createdAt: '2024-01-20',
      lastUpdated: '2024-11-30',
      isPopular: true,
      isFeatured: false,
      preview: {
        blocks: [
          { type: 'heading', content: 'Gestão de Projetos Ágeis' },
          { type: 'paragraph', content: 'Framework para projetos ágeis...' },
          { type: 'kanban', content: 'Board de tarefas' },
        ],
      },
    },
    {
      id: '5',
      name: 'Plano de Estudos Pessoal',
      description: 'Template para organizar estudos pessoais com cronograma e acompanhamento de progresso.',
      category: 'education',
      tags: ['estudos', 'educação', 'cronograma', 'progresso'],
      blockCount: 10,
      estimatedTime: 25,
      difficulty: 'beginner',
      rating: 4.4,
      usageCount: 450,
      createdBy: 'Pedro Lima',
      createdAt: '2024-04-12',
      lastUpdated: '2024-10-20',
      isPopular: false,
      isFeatured: false,
      preview: {
        blocks: [
          { type: 'heading', content: 'Plano de Estudos Pessoal' },
          { type: 'paragraph', content: 'Organize seus estudos de forma eficiente...' },
          { type: 'calendar', content: 'Cronograma de estudos' },
        ],
      },
    },
  ];

  const categories = [
    { value: 'all', label: 'Todas', icon: FileText },
    { value: 'business', label: 'Negócios', icon: Briefcase },
    { value: 'sales', label: 'Vendas', icon: TrendingUp },
    { value: 'marketing', label: 'Marketing', icon: Target },
    { value: 'project', label: 'Projetos', icon: CheckSquare },
    { value: 'education', label: 'Educação', icon: GraduationCap },
    { value: 'personal', label: 'Pessoal', icon: Heart },
  ];

  const difficulties = [
    { value: 'all', label: 'Todas' },
    { value: 'beginner', label: 'Iniciante' },
    { value: 'intermediate', label: 'Intermediário' },
    { value: 'advanced', label: 'Avançado' },
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (template.tags && template.tags.some(tag => tag?.toLowerCase().includes(searchQuery.toLowerCase())));
    
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || template.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'popular':
        return b.usageCount - a.usageCount;
      case 'recent':
        return new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime();
      case 'rating':
        return b.rating - a.rating;
      default:
        return 0;
    }
  });

  const featuredTemplates = templates.filter(t => t.isFeatured);
  const popularTemplates = templates.filter(t => t.isPopular);

  const getCategoryIcon = (category: string) => {
    const categoryData = categories.find(c => c.value === category);
    return categoryData?.icon || FileText;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}min` : `${hours}h`;
  };

  const TemplateCard: React.FC<{ template: Template }> = ({ template }) => {
    const CategoryIcon = getCategoryIcon(template.category);
    
    return (
      <Card className="group hover:shadow-md transition-all duration-200 cursor-pointer">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <CategoryIcon className="h-4 w-4 text-muted-foreground" />
              <Badge variant="secondary" className={getDifficultyColor(template.difficulty)}>
                {template.difficulty === 'beginner' ? 'Iniciante' :
                 template.difficulty === 'intermediate' ? 'Intermediário' : 'Avançado'}
              </Badge>
            </div>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-yellow-500 fill-current" />
              <span className="text-xs text-muted-foreground">{template.rating}</span>
            </div>
          </div>
          
          <CardTitle className="text-base group-hover:text-primary transition-colors">
            {template.name}
          </CardTitle>
          
          <p className="text-sm text-muted-foreground line-clamp-2">
            {template.description}
          </p>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="flex flex-wrap gap-1 mb-3">
            {template.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs">
                {tag}
              </Badge>
            ))}
            {template.tags.length > 3 && (
              <Badge variant="outline" className="text-xs">
                +{template.tags.length - 3}
              </Badge>
            )}
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-4">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {template.blockCount} blocos
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatTime(template.estimatedTime)}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {template.usageCount}
              </span>
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1"
              onClick={() => onCreateFromTemplate(template.id)}
            >
              <Plus className="h-3 w-3 mr-1" />
              Usar Template
            </Button>
            
            <Dialog>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPreviewTemplate(template)}
                >
                  <Eye className="h-3 w-3" />
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>{template.name}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <p className="text-muted-foreground">{template.description}</p>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Categoria:</span>
                      <span className="ml-2 capitalize">{template.category}</span>
                    </div>
                    <div>
                      <span className="font-medium">Dificuldade:</span>
                      <span className="ml-2">
                        {template.difficulty === 'beginner' ? 'Iniciante' :
                         template.difficulty === 'intermediate' ? 'Intermediário' : 'Avançado'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium">Blocos:</span>
                      <span className="ml-2">{template.blockCount}</span>
                    </div>
                    <div>
                      <span className="font-medium">Tempo estimado:</span>
                      <span className="ml-2">{formatTime(template.estimatedTime)}</span>
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="font-medium mb-2">Prévia do conteúdo:</h4>
                    <div className="space-y-2 bg-muted/50 p-3 rounded-lg">
                      {template.preview.blocks.map((block, index) => (
                        <div key={index} className="text-sm">
                          <Badge variant="outline" className="text-xs mr-2">
                            {block.type}
                          </Badge>
                          {block.content}
                        </div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="flex gap-2 pt-4">
                    <Button
                      className="flex-1"
                      onClick={() => {
                        onCreateFromTemplate(template.id);
                        setPreviewTemplate(null);
                      }}
                    >
                      Usar Este Template
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 border-b">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">Galeria de Templates</h1>
            <p className="text-muted-foreground">
              Escolha um template para começar seu playbook rapidamente
            </p>
          </div>
          {onClose && (
            <Button variant="outline" onClick={onClose}>
              Fechar
            </Button>
          )}
        </div>
        
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          
          <div className="flex gap-2">
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Dificuldade" />
              </SelectTrigger>
              <SelectContent>
                {difficulties.map((difficulty) => (
                  <SelectItem key={difficulty.value} value={difficulty.value}>
                    {difficulty.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'popular' | 'recent' | 'rating')}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Ordenar por" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="popular">Mais populares</SelectItem>
                <SelectItem value="recent">Mais recentes</SelectItem>
                <SelectItem value="rating">Melhor avaliados</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="p-6">
          <Tabs defaultValue="all" className="space-y-6">
            <TabsList>
              <TabsTrigger value="all">Todos ({filteredTemplates.length})</TabsTrigger>
              <TabsTrigger value="featured">Em Destaque ({featuredTemplates.length})</TabsTrigger>
              <TabsTrigger value="popular">Populares ({popularTemplates.length})</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              {filteredTemplates.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredTemplates.map((template) => (
                    <TemplateCard key={template.id} template={template} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">Nenhum template encontrado</h3>
                  <p className="text-muted-foreground">
                    Tente ajustar os filtros ou termos de busca
                  </p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="featured">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {featuredTemplates.map((template) => (
                  <TemplateCard key={template.id} template={template} />
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="popular">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {popularTemplates.map((template) => (
                  <TemplateCard key={template.id} template={template} />
                ))}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </ScrollArea>
    </div>
  );
};

export default TemplateGallery;