// ============================================================================
// ADVANCED DIAGRAM EDITOR DEMO
// ============================================================================
// Demonstração do DiagramEditor com componentes avançados integrados
// Mostra a diferença entre o modo tradicional e o modo avançado
// ============================================================================

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DiagramEditor } from '../core/DiagramEditor';
import { DiagramType } from '../types';
import { Sparkles, Zap, Palette, Wrench, Info } from 'lucide-react';

// ============================================================================
// INTERFACES
// ============================================================================

interface DemoConfig {
  useAdvancedComponents: boolean;
  useEnhancedUI: boolean;
  showToolbar: boolean;
  showPalette: boolean;
  readOnly: boolean;
  diagramType: DiagramType;
}

interface FeatureComparison {
  feature: string;
  traditional: string;
  advanced: string;
  icon: React.ReactNode;
}

// ============================================================================
// DADOS DE DEMONSTRAÇÃO
// ============================================================================

const FEATURE_COMPARISONS: FeatureComparison[] = [
  {
    feature: 'Criação de Nós',
    traditional: 'Paleta simples com drag básico',
    advanced: 'Templates inteligentes, validação automática, preview visual',
    icon: <Palette className="w-4 h-4" />
  },
  {
    feature: 'Barra de Ferramentas',
    traditional: 'Ações básicas de salvar/carregar',
    advanced: 'Ações rápidas por tipo, sequências automáticas, manipulação avançada',
    icon: <Wrench className="w-4 h-4" />
  },
  {
    feature: 'Experiência do Usuário',
    traditional: 'Interface funcional padrão',
    advanced: 'Busca, filtragem, agrupamento, tooltips contextuais',
    icon: <Sparkles className="w-4 h-4" />
  },
  {
    feature: 'Produtividade',
    traditional: 'Criação manual nó por nó',
    advanced: 'Criação em lote, templates predefinidos, validação inteligente',
    icon: <Zap className="w-4 h-4" />
  }
];

const DEMO_SCENARIOS = [
  {
    id: 'flowchart',
    title: 'Fluxograma BPMN',
    description: 'Processo de aprovação com decisões e tarefas',
    type: 'flowchart' as DiagramType,
    benefits: ['Templates BPMN', 'Validação de fluxo', 'Conexões automáticas']
  },
  {
    id: 'mindmap',
    title: 'Mapa Mental',
    description: 'Brainstorming de ideias e conceitos',
    type: 'mindmap' as DiagramType,
    benefits: ['Hierarquia automática', 'Cores por nível', 'Expansão rápida']
  },
  {
    id: 'organogram',
    title: 'Organograma',
    description: 'Estrutura organizacional da empresa',
    type: 'organogram' as DiagramType,
    benefits: ['Hierarquia corporativa', 'Dados de funcionários', 'Alinhamento automático']
  }
];

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const AdvancedDiagramEditorDemo: React.FC = () => {
  const [config, setConfig] = useState<DemoConfig>({
    useAdvancedComponents: true,
    useEnhancedUI: false,
    showToolbar: true,
    showPalette: true,
    readOnly: false,
    diagramType: 'flowchart'
  });

  const [activeScenario, setActiveScenario] = useState('flowchart');

  const updateConfig = (updates: Partial<DemoConfig>) => {
    setConfig(prev => ({ ...prev, ...updates }));
  };

  const currentScenario = DEMO_SCENARIOS.find(s => s.id === activeScenario);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Sparkles className="w-8 h-8 text-primary" />
          Editor de Diagramas Avançado
        </h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Demonstração dos novos componentes avançados integrados ao DiagramEditor principal.
          Compare a experiência tradicional com a nova experiência aprimorada.
        </p>
      </div>

      {/* Configurações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="w-5 h-5" />
            Configurações da Demonstração
          </CardTitle>
          <CardDescription>
            Ajuste as configurações para explorar diferentes modos do editor
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="advanced"
                checked={config.useAdvancedComponents}
                onCheckedChange={(checked) => updateConfig({ useAdvancedComponents: checked })}
              />
              <Label htmlFor="advanced" className="flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                Componentes Avançados
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="enhanced-ui"
                checked={config.useEnhancedUI}
                onCheckedChange={(checked) => updateConfig({ useEnhancedUI: checked })}
              />
              <Label htmlFor="enhanced-ui" className="flex items-center gap-2">
                <Zap className="w-4 h-4" />
                UI Aprimorada
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="toolbar"
                checked={config.showToolbar}
                onCheckedChange={(checked) => updateConfig({ showToolbar: checked })}
              />
              <Label htmlFor="toolbar">Mostrar Toolbar</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="palette"
                checked={config.showPalette}
                onCheckedChange={(checked) => updateConfig({ showPalette: checked })}
              />
              <Label htmlFor="palette">Mostrar Paleta</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="readonly"
                checked={config.readOnly}
                onCheckedChange={(checked) => updateConfig({ readOnly: checked })}
              />
              <Label htmlFor="readonly">Modo Somente Leitura</Label>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <Label>Cenários de Demonstração</Label>
            <div className="flex flex-wrap gap-2">
              {DEMO_SCENARIOS.map((scenario) => (
                <Button
                  key={scenario.id}
                  variant={activeScenario === scenario.id ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => {
                    setActiveScenario(scenario.id);
                    updateConfig({ diagramType: scenario.type });
                  }}
                >
                  {scenario.title}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Comparação de Recursos */}
      <Card>
        <CardHeader>
          <CardTitle>Comparação de Recursos</CardTitle>
          <CardDescription>
            Veja as melhorias implementadas nos componentes avançados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {FEATURE_COMPARISONS.map((comparison, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 border rounded-lg">
                <div className="flex items-center gap-2 font-medium">
                  {comparison.icon}
                  {comparison.feature}
                </div>
                <div className="text-sm text-muted-foreground">
                  <Badge variant="outline" className="mb-2">Tradicional</Badge>
                  <p>{comparison.traditional}</p>
                </div>
                <div className="text-sm">
                  <Badge variant="default" className="mb-2">Avançado</Badge>
                  <p>{comparison.advanced}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Cenário Atual */}
      {currentScenario && (
        <Card>
          <CardHeader>
            <CardTitle>Cenário: {currentScenario.title}</CardTitle>
            <CardDescription>{currentScenario.description}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {currentScenario.benefits.map((benefit, index) => (
                  <Badge key={index} variant="secondary">
                    {benefit}
                  </Badge>
                ))}
              </div>
              
              <div className="text-sm text-muted-foreground">
                {config.useAdvancedComponents ? (
                  <p className="flex items-center gap-2 text-green-600">
                    <Sparkles className="w-4 h-4" />
                    Modo avançado ativo - Experimente as novas funcionalidades!
                  </p>
                ) : (
                  <p className="flex items-center gap-2">
                    <Info className="w-4 h-4" />
                    Modo tradicional - Ative os componentes avançados para ver as melhorias
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Editor de Diagramas */}
      <Card>
        <CardHeader>
          <CardTitle>Editor de Diagramas</CardTitle>
          <CardDescription>
            {config.useAdvancedComponents 
              ? 'Experiência aprimorada com componentes avançados'
              : 'Experiência tradicional do editor'
            }
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden" style={{ height: '600px' }}>
            <DiagramEditor
              useAdvancedComponents={config.useAdvancedComponents}
              useEnhancedUI={config.useEnhancedUI}
              showToolbar={config.showToolbar}
              showPalette={config.showPalette}
              readOnly={config.readOnly}
              className="h-full"
              onSave={async (document) => {
                console.log('Documento salvo:', document);
              }}
              onClose={() => {
                console.log('Editor fechado');
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Instruções */}
      <Card>
        <CardHeader>
          <CardTitle>Como Usar</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="traditional" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="traditional">Modo Tradicional</TabsTrigger>
              <TabsTrigger value="advanced">Modo Avançado</TabsTrigger>
            </TabsList>
            
            <TabsContent value="traditional" className="space-y-2">
              <h4 className="font-medium">Experiência Tradicional</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Use a paleta lateral para arrastar nós básicos</li>
                <li>Conecte nós manualmente clicando e arrastando</li>
                <li>Use a barra de ferramentas para ações básicas</li>
                <li>Edite propriedades através do painel lateral</li>
              </ul>
            </TabsContent>
            
            <TabsContent value="advanced" className="space-y-2">
              <h4 className="font-medium">Experiência Avançada</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Use templates inteligentes na paleta avançada</li>
                <li>Busque e filtre nós por categoria ou tipo</li>
                <li>Crie sequências de nós automaticamente</li>
                <li>Use ações rápidas na toolbar avançada</li>
                <li>Aproveite a validação automática e preview visual</li>
              </ul>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdvancedDiagramEditorDemo;