// ============================================================================
// Unified Sidebar - Sidebar unificado para editor de diagramas
// ============================================================================
// Sidebar lateral com paleta de nós, templates e configurações
// ============================================================================

import React, { memo, useState, useCallback } from 'react';
import {
  Search,
  Plus,
  FileText,
  Settings,
  Layers,
  Grid3X3,
  Palette,
  FolderOpen,
  Star,
  Clock,
  ChevronDown,
  ChevronRight,
  X,
  Layout,
  Brain
} from 'lucide-react';
import { NLPTextInput } from '../../nlp/NLPTextInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { DiagramType, UnifiedNodeType } from '../../../types/unified-diagram';
import { cn } from '@/lib/utils';
import { TemplateGallery } from '../components/TemplateGallery';
import { diagramTemplateService, DiagramTemplate } from '../services/DiagramTemplateService';

// ============================================================================
// INTERFACES
// ============================================================================

interface UnifiedSidebarProps {
  diagramType: DiagramType;
  selectedNodeType?: UnifiedNodeType;
  onNodeTypeSelect: (nodeType: UnifiedNodeType) => void;
  onCreateNew?: () => void;
  onLoad?: (templateId: string) => void;
  onTemplateSelect?: (template: DiagramTemplate) => void;
  onNLPDiagramGenerated?: (nodes: any[], edges: any[]) => void;
  readOnly?: boolean;
  className?: string;
}

interface NodeCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  nodes: NodeTypeInfo[];
}

interface NodeTypeInfo {
  type: UnifiedNodeType;
  label: string;
  description: string;
  icon: React.ReactNode;
}

// Template interface moved to DiagramTemplateService

// ============================================================================
// DADOS DE CONFIGURAÇÃO
// ============================================================================

const getNodeCategories = (diagramType: DiagramType): NodeCategory[] => {
  const baseCategories: NodeCategory[] = [
    {
      id: 'basic',
      label: 'Básicos',
      icon: <Grid3X3 className="h-4 w-4" />,
      nodes: [
        {
          type: 'start',
          label: 'Início',
          description: 'Evento de início',
          icon: <div className="w-4 h-4 rounded-full bg-green-500" />
        },
        {
          type: 'end',
          label: 'Fim',
          description: 'Evento de fim',
          icon: <div className="w-4 h-4 rounded-full bg-red-500" />
        },
        {
          type: 'task',
          label: 'Tarefa',
          description: 'Atividade ou processo',
          icon: <div className="w-4 h-4 bg-blue-500 rounded" />
        }
      ]
    },
    {
      id: 'flow',
      label: 'Fluxo',
      icon: <Layers className="h-4 w-4" />,
      nodes: [
        {
          type: 'decision',
          label: 'Decisão',
          description: 'Ponto de decisão',
          icon: <div className="w-4 h-4 bg-yellow-500 transform rotate-45" />
        },
        {
          type: 'gateway',
          label: 'Gateway',
          description: 'Gateway de controle',
          icon: <div className="w-4 h-4 bg-purple-500 transform rotate-45" />
        }
      ]
    }
  ];

  // Adicionar categorias específicas por tipo
  if (diagramType === 'mindmap') {
    baseCategories.push({
      id: 'mindmap',
      label: 'Mind Map',
      icon: <Palette className="h-4 w-4" />,
      nodes: [
        {
          type: 'mindmap-root',
          label: 'Tópico Central',
          description: 'Nó raiz do mapa mental',
          icon: <div className="w-4 h-4 rounded-full bg-indigo-500" />
        },
        {
          type: 'mindmap-branch',
          label: 'Ramo',
          description: 'Ramo principal',
          icon: <div className="w-4 h-4 bg-indigo-400 rounded" />
        },
        {
          type: 'mindmap-leaf',
          label: 'Folha',
          description: 'Item final',
          icon: <div className="w-4 h-4 bg-indigo-300 rounded-full" />
        }
      ]
    });
  }

  if (diagramType === 'organogram') {
    baseCategories.push({
      id: 'org',
      label: 'Organograma',
      icon: <Palette className="h-4 w-4" />,
      nodes: [
        {
          type: 'org-ceo',
          label: 'CEO',
          description: 'Diretor executivo',
          icon: <div className="w-4 h-4 bg-gold-500 rounded" />
        },
        {
          type: 'org-director',
          label: 'Diretor',
          description: 'Diretor de área',
          icon: <div className="w-4 h-4 bg-blue-600 rounded" />
        },
        {
          type: 'org-manager',
          label: 'Gerente',
          description: 'Gerente de equipe',
          icon: <div className="w-4 h-4 bg-blue-400 rounded" />
        },
        {
          type: 'org-employee',
          label: 'Funcionário',
          description: 'Colaborador',
          icon: <div className="w-4 h-4 bg-blue-200 rounded" />
        }
      ]
    });
  }

  return baseCategories;
};

// Templates now managed by DiagramTemplateService

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const UnifiedSidebar: React.FC<UnifiedSidebarProps> = memo(({
  diagramType,
  selectedNodeType,
  onNodeTypeSelect,
  onCreateNew,
  onLoad,
  onTemplateSelect,
  readOnly = false,
  className = ''
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['basic']));
  const [activeTab, setActiveTab] = useState('nodes');
  const [showTemplateGallery, setShowTemplateGallery] = useState(false);

  const nodeCategories = getNodeCategories(diagramType);

  const toggleCategory = useCallback((categoryId: string) => {
    setExpandedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  }, []);

  const filteredCategories = nodeCategories.map(category => ({
    ...category,
    nodes: category.nodes.filter(node => 
      node.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      node.description.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.nodes.length > 0);

  const handleTemplateSelect = useCallback((template: DiagramTemplate) => {
    if (onTemplateSelect) {
      onTemplateSelect(template);
    } else if (onLoad) {
      onLoad(template.id);
    }
    setShowTemplateGallery(false);
  }, [onTemplateSelect, onLoad]);

  return (
    <div className={cn('unified-sidebar h-full bg-background border-r flex flex-col', className)}>
      {/* Header */}
      <div className="p-4 border-b">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-lg">Elementos</h2>
          {onCreateNew && (
            <Button size="sm" variant="outline" onClick={onCreateNew}>
              <Plus className="h-4 w-4 mr-1" />
              Novo
            </Button>
          )}
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar elementos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="grid w-full grid-cols-4 mx-4 mt-2">
          <TabsTrigger value="nodes">Nós</TabsTrigger>
          <TabsTrigger value="nlp">
            <Brain className="h-4 w-4 mr-1" />
            IA
          </TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="gallery">
            <Layout className="h-4 w-4 mr-1" />
            Galeria
          </TabsTrigger>
        </TabsList>

        {/* Nodes Tab */}
        <TabsContent value="nodes" className="flex-1 mt-2">
          <ScrollArea className="h-full px-4">
            <div className="space-y-2">
              {filteredCategories.map((category) => {
                const isExpanded = expandedCategories.has(category.id);
                
                return (
                  <Collapsible
                    key={category.id}
                    open={isExpanded}
                    onOpenChange={() => toggleCategory(category.id)}
                  >
                    <CollapsibleTrigger asChild>
                      <Button
                        variant="ghost"
                        className="w-full justify-start p-2 h-auto"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4 mr-2" />
                        ) : (
                          <ChevronRight className="h-4 w-4 mr-2" />
                        )}
                        {category.icon}
                        <span className="ml-2 font-medium">{category.label}</span>
                        <Badge variant="secondary" className="ml-auto">
                          {category.nodes.length}
                        </Badge>
                      </Button>
                    </CollapsibleTrigger>
                    
                    <CollapsibleContent className="space-y-1 mt-1">
                      {category.nodes.map((node) => (
                        <Button
                          key={node.type}
                          variant={selectedNodeType === node.type ? "default" : "ghost"}
                          className="w-full justify-start p-3 h-auto"
                          onClick={() => onNodeTypeSelect(node.type)}
                          disabled={readOnly}
                        >
                          <div className="flex items-center space-x-3">
                            {node.icon}
                            <div className="text-left">
                              <div className="font-medium text-sm">{node.label}</div>
                              <div className="text-xs text-muted-foreground">
                                {node.description}
                              </div>
                            </div>
                          </div>
                        </Button>
                      ))}
                    </CollapsibleContent>
                  </Collapsible>
                );
              })}
            </div>
          </ScrollArea>
        </TabsContent>

        {/* NLP Tab - AI Diagram Generation */}
        <TabsContent value="nlp" className="flex-1 mt-2">
          <div className="h-full px-4">
            <NLPTextInput
              onDiagramGenerated={onNLPDiagramGenerated}
              defaultDiagramType={diagramType}
              showHistory={false}
              maxHeight="300px"
              className="h-full"
              placeholder={`Descreva seu ${diagramType === 'flowchart' ? 'processo' : diagramType === 'mindmap' ? 'conceito' : diagramType === 'orgchart' ? 'organização' : 'diagrama'} em linguagem natural...`}
            />
          </div>
        </TabsContent>

        {/* Templates Tab - Quick Templates */}
        <TabsContent value="templates" className="flex-1 mt-2">
          <ScrollArea className="h-full px-4">
            <div className="space-y-3">
              <div className="text-center py-4">
                <Layout className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                <h3 className="font-medium mb-1">Templates Rápidos</h3>
                <p className="text-xs text-muted-foreground mb-4">
                  Acesse templates básicos ou explore a galeria completa
                </p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setActiveTab('gallery')}
                  className="mb-4"
                >
                  <Layout className="h-4 w-4 mr-2" />
                  Abrir Galeria
                </Button>
              </div>
              
              {/* Quick Templates */}
              {diagramTemplateService.getTemplates({ type: diagramType }).slice(0, 3).map((template) => (
                <Card
                  key={template.id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleTemplateSelect(template)}
                >
                  <CardHeader className="p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-sm font-medium">
                          {template.name}
                        </CardTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                          {template.description}
                        </p>
                      </div>
                      <div className="text-2xl">{template.preview}</div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </TabsContent>
        
        {/* Template Gallery Tab */}
        <TabsContent value="gallery" className="flex-1 mt-2">
          <div className="h-full">
            <TemplateGallery
              onTemplateSelect={handleTemplateSelect}
              selectedType={diagramType}
              showHeader={false}
              showFilters={true}
              layout="list"
              className="h-full"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
});

UnifiedSidebar.displayName = 'UnifiedSidebar';

export default UnifiedSidebar;