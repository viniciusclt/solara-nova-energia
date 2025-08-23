import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DiagramLayout } from '../layout/DiagramLayout';
import { useDiagramEditor } from '../hooks/useDiagramEditor';
import { DiagramDocument } from '../types';
import { 
  Sparkles, 
  Palette, 
  Wrench, 
  Eye, 
  Settings,
  Info,
  CheckCircle,
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  Download,
  Upload,
  Zap,
  Brain,
  Users
} from 'lucide-react';

// ============================================================================
// Tipos e Interfaces
// ============================================================================

interface AdvancedDiagramDemoProps {
  className?: string;
  initialDocument?: DiagramDocument;
}

interface DemoConfig {
  useAdvancedComponents: boolean;
  useEnhancedUI: boolean;
  showToolbar: boolean;
  showPalette: boolean;
  compactMode: boolean;
  showTemplateInfo: boolean;
  enableQuickActions: boolean;
  toolbarOrientation: 'horizontal' | 'vertical';
  showLabels: boolean;
}

// ============================================================================
// Dados de Demonstração
// ============================================================================

const DEMO_FEATURES = [
  {
    id: 'advanced-palette',
    title: 'Paleta Avançada',
    description: 'Templates inteligentes com validação e snap-to-grid',
    icon: <Palette className="h-4 w-4" />,
    benefits: [
      'Templates predefinidos por categoria',
      'Validação automática de posicionamento',
      'Informações detalhadas de cada elemento',
      'Busca e filtragem inteligente'
    ]
  },
  {
    id: 'advanced-toolbar',
    title: 'Toolbar Avançada',
    description: 'Ferramentas contextuais e ações rápidas',
    icon: <Wrench className="h-4 w-4" />,
    benefits: [
      'Ações rápidas por tipo de diagrama',
      'Criação de sequências automáticas',
      'Ferramentas de alinhamento e distribuição',
      'Atalhos de teclado integrados'
    ]
  },
  {
    id: 'smart-creation',
    title: 'Criação Inteligente',
    description: 'Sistema avançado de criação e validação de nós',
    icon: <Sparkles className="h-4 w-4" />,
    benefits: [
      'Validação de hierarquia e conexões',
      'Posicionamento automático inteligente',
      'Templates com configurações específicas',
      'Criação em sequência com um clique'
    ]
  }
];

const DEMO_SCENARIOS = [
  {
    id: 'flowchart',
    title: 'Fluxograma BPMN',
    description: 'Processo de aprovação de documentos',
    type: 'flowchart' as const,
    elements: ['start', 'task', 'decision', 'task', 'end']
  },
  {
    id: 'mindmap',
    title: 'Mapa Mental',
    description: 'Planejamento de projeto',
    type: 'mindmap' as const,
    elements: ['central', 'main', 'subtopic', 'subtopic']
  },
  {
    id: 'organogram',
    title: 'Organograma',
    description: 'Estrutura organizacional',
    type: 'organogram' as const,
    elements: ['ceo', 'manager', 'employee', 'employee']
  }
];

// ============================================================================
// Componente Principal
// ============================================================================

export const AdvancedDiagramDemo: React.FC<AdvancedDiagramDemoProps> = ({
  className,
  initialDocument
}) => {
  // ============================================================================
  // Estado Local
  // ============================================================================

  const [demoConfig, setDemoConfig] = useState<DemoConfig>({
    useAdvancedComponents: true,
    useEnhancedUI: false,
    showToolbar: true,
    showPalette: true,
    compactMode: false,
    showTemplateInfo: true,
    enableQuickActions: true,
    toolbarOrientation: 'horizontal',
    showLabels: true
  });

  const [selectedScenario, setSelectedScenario] = useState(DEMO_SCENARIOS[0]);
  const [activeTab, setActiveTab] = useState('demo');

  // ============================================================================
  // Hooks
  // ============================================================================

  const {
    document,
    isLoading,
    hasUnsavedChanges,
    toolbarProps,
    paletteProps,
    advancedToolbarProps,
    advancedPaletteProps,
    handleAddNode
  } = useDiagramEditor({
    initialDocument: initialDocument || {
      id: 'demo-diagram',
      title: 'Demonstração - Componentes Avançados',
      config: {
        type: selectedScenario.type,
        version: '1.0.0'
      },
      nodes: [],
      edges: [],
      metadata: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: 'Demo User'
      }
    },
    onClose: () => console.log('Demo fechado')
  });

  // ============================================================================
  // Handlers
  // ============================================================================

  const handleConfigChange = (key: keyof DemoConfig, value: any) => {
    setDemoConfig(prev => ({ ...prev, [key]: value }));
  };

  const handleScenarioChange = (scenario: typeof DEMO_SCENARIOS[0]) => {
    setSelectedScenario(scenario);
    // TODO: Atualizar tipo do documento
  };

  const handleCreateSequence = () => {
    selectedScenario.elements.forEach((elementType, index) => {
      setTimeout(() => {
        handleAddNode(elementType, {
          x: 100 + (index * 200),
          y: 100
        });
      }, index * 500);
    });
  };

  // ============================================================================
  // Computações
  // ============================================================================

  const enhancedAdvancedToolbarProps = {
    ...advancedToolbarProps,
    orientation: demoConfig.toolbarOrientation,
    showLabels: demoConfig.showLabels,
    compactMode: demoConfig.compactMode
  };

  const enhancedAdvancedPaletteProps = {
    ...advancedPaletteProps,
    showTemplateInfo: demoConfig.showTemplateInfo,
    enableQuickActions: demoConfig.enableQuickActions,
    compactMode: demoConfig.compactMode
  };

  // ============================================================================
  // Componentes Internos
  // ============================================================================

  const FeatureCard: React.FC<{ feature: typeof DEMO_FEATURES[0] }> = ({ feature }) => (
    <Card className="h-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-primary/10 text-primary">
            {feature.icon}
          </div>
          <div>
            <CardTitle className="text-lg">{feature.title}</CardTitle>
            <CardDescription>{feature.description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {feature.benefits.map((benefit, index) => (
            <li key={index} className="flex items-start gap-2 text-sm">
              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
              <span>{benefit}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );

  const ConfigPanel: React.FC = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-4 w-4" />
          Configurações da Demo
        </CardTitle>
        <CardDescription>
          Ajuste as configurações para explorar diferentes funcionalidades
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Componentes Avançados */}
        <div className="flex items-center justify-between">
          <Label htmlFor="advanced-components" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Usar Componentes Avançados
          </Label>
          <Switch
            id="advanced-components"
            checked={demoConfig.useAdvancedComponents}
            onCheckedChange={(checked) => handleConfigChange('useAdvancedComponents', checked)}
          />
        </div>

        {/* UI Aprimorada */}
        <div className="flex items-center justify-between">
          <Label htmlFor="enhanced-ui" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            UI Aprimorada (MindMeister)
          </Label>
          <Switch
            id="enhanced-ui"
            checked={demoConfig.useEnhancedUI}
            onCheckedChange={(checked) => handleConfigChange('useEnhancedUI', checked)}
          />
        </div>

        {/* Visibilidade */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="show-toolbar">Mostrar Toolbar</Label>
            <Switch
              id="show-toolbar"
              checked={demoConfig.showToolbar}
              onCheckedChange={(checked) => handleConfigChange('showToolbar', checked)}
            />
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="show-palette">Mostrar Paleta</Label>
            <Switch
              id="show-palette"
              checked={demoConfig.showPalette}
              onCheckedChange={(checked) => handleConfigChange('showPalette', checked)}
            />
          </div>
        </div>

        {/* Configurações Avançadas */}
        {demoConfig.useAdvancedComponents && (
          <div className="space-y-2 pt-2 border-t">
            <div className="flex items-center justify-between">
              <Label htmlFor="compact-mode">Modo Compacto</Label>
              <Switch
                id="compact-mode"
                checked={demoConfig.compactMode}
                onCheckedChange={(checked) => handleConfigChange('compactMode', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="template-info">Informações de Template</Label>
              <Switch
                id="template-info"
                checked={demoConfig.showTemplateInfo}
                onCheckedChange={(checked) => handleConfigChange('showTemplateInfo', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="quick-actions">Ações Rápidas</Label>
              <Switch
                id="quick-actions"
                checked={demoConfig.enableQuickActions}
                onCheckedChange={(checked) => handleConfigChange('enableQuickActions', checked)}
              />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="show-labels">Mostrar Rótulos</Label>
              <Switch
                id="show-labels"
                checked={demoConfig.showLabels}
                onCheckedChange={(checked) => handleConfigChange('showLabels', checked)}
              />
            </div>
          </div>
        )}

        {/* Cenários */}
        <div className="pt-2 border-t">
          <Label className="text-sm font-medium mb-2 block">Cenários de Demonstração</Label>
          <div className="grid grid-cols-1 gap-2">
            {DEMO_SCENARIOS.map(scenario => (
              <Button
                key={scenario.id}
                variant={selectedScenario.id === scenario.id ? 'default' : 'outline'}
                size="sm"
                className="justify-start"
                onClick={() => handleScenarioChange(scenario)}
              >
                <div className="text-left">
                  <div className="font-medium">{scenario.title}</div>
                  <div className="text-xs text-muted-foreground">{scenario.description}</div>
                </div>
              </Button>
            ))}
          </div>
          <Button
            onClick={handleCreateSequence}
            className="w-full mt-2"
            size="sm"
          >
            <ArrowRight className="h-4 w-4 mr-2" />
            Criar Sequência do Cenário
          </Button>
        </div>
      </CardContent>
    </Card>
  );

  // ============================================================================
  // Render
  // ============================================================================

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Carregando demonstração...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn('flex flex-col h-full', className)}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <div className="border-b px-4 py-2">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Demonstração - Componentes Avançados
              </h2>
              <p className="text-sm text-muted-foreground">
                Explore as novas funcionalidades de criação e manipulação de diagramas
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={demoConfig.useAdvancedComponents ? 'default' : 'secondary'}>
                {demoConfig.useAdvancedComponents ? 'Avançado' : 'Tradicional'}
              </Badge>
              <Badge variant="outline">
                {selectedScenario.title}
              </Badge>
              {hasUnsavedChanges && (
                <Badge variant="destructive">Não salvo</Badge>
              )}
            </div>
          </div>
          
          <TabsList>
            <TabsTrigger value="demo" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Demonstração
            </TabsTrigger>
            <TabsTrigger value="features" className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              Funcionalidades
            </TabsTrigger>
            <TabsTrigger value="config" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configurações
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="demo" className="flex-1 flex">
          <div className="flex flex-1">
            {/* Painel de Configuração */}
            <div className="w-80 p-4 border-r">
              <ConfigPanel />
            </div>
            
            {/* Área do Diagrama */}
            <div className="flex-1">
              <DiagramLayout
                useAdvancedComponents={demoConfig.useAdvancedComponents}
                useEnhancedUI={demoConfig.useEnhancedUI}
                showToolbar={demoConfig.showToolbar}
                showPalette={demoConfig.showPalette}
                toolbarProps={toolbarProps}
                paletteProps={paletteProps}
                advancedToolbarProps={enhancedAdvancedToolbarProps}
                advancedPaletteProps={enhancedAdvancedPaletteProps}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="features" className="flex-1 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 h-full">
            {DEMO_FEATURES.map(feature => (
              <FeatureCard key={feature.id} feature={feature} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="config" className="flex-1 p-4">
          <div className="max-w-2xl mx-auto">
            <ConfigPanel />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdvancedDiagramDemo;