// ============================================================================
// AutoRoutingDemo - Demonstração do Sistema de Auto-Routing
// ============================================================================

import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Play, 
  Square, 
  Diamond, 
  Circle, 
  Zap, 
  Route, 
  Settings, 
  RefreshCw,
  Info
} from 'lucide-react';
import { DiagramCanvas } from '../canvas/DiagramCanvas';
import { AutoRoutingPanel } from '../components/AutoRoutingPanel';
import { useDiagramStore } from '../stores/useDiagramStore';
import { DiagramNode, DiagramEdge } from '../types';
import { secureLogger } from '@/utils/secureLogger';

// ============================================================================
// Dados de Demonstração
// ============================================================================

const createDemoNodes = (): DiagramNode[] => [
  {
    id: 'start-1',
    type: 'start',
    position: { x: 100, y: 100 },
    data: {
      label: 'Início',
      description: 'Ponto de partida do processo'
    },
    width: 120,
    height: 60
  },
  {
    id: 'process-1',
    type: 'process',
    position: { x: 300, y: 100 },
    data: {
      label: 'Processar Dados',
      description: 'Processamento principal'
    },
    width: 150,
    height: 80
  },
  {
    id: 'decision-1',
    type: 'decision',
    position: { x: 500, y: 100 },
    data: {
      label: 'Dados Válidos?',
      description: 'Verificação de validação'
    },
    width: 140,
    height: 100
  },
  {
    id: 'process-2',
    type: 'process',
    position: { x: 700, y: 50 },
    data: {
      label: 'Salvar Dados',
      description: 'Persistir informações'
    },
    width: 130,
    height: 70
  },
  {
    id: 'process-3',
    type: 'process',
    position: { x: 700, y: 200 },
    data: {
      label: 'Corrigir Erros',
      description: 'Tratamento de erros'
    },
    width: 130,
    height: 70
  },
  {
    id: 'end-1',
    type: 'end',
    position: { x: 900, y: 100 },
    data: {
      label: 'Fim',
      description: 'Conclusão do processo'
    },
    width: 100,
    height: 60
  },
  // Nós obstáculos para demonstrar evitação
  {
    id: 'obstacle-1',
    type: 'annotation',
    position: { x: 400, y: 200 },
    data: {
      label: 'Obstáculo',
      description: 'Nó que deve ser evitado'
    },
    width: 100,
    height: 50
  },
  {
    id: 'obstacle-2',
    type: 'annotation',
    position: { x: 600, y: 250 },
    data: {
      label: 'Obstáculo 2',
      description: 'Outro obstáculo'
    },
    width: 100,
    height: 50
  }
];

const createDemoEdges = (): DiagramEdge[] => [
  {
    id: 'edge-1',
    source: 'start-1',
    target: 'process-1',
    type: 'auto-routed',
    label: 'Iniciar',
    data: {
      routingInfo: {
        algorithm: 'astar',
        avoidNodes: true,
        preferOrthogonal: true,
        smoothCurves: false
      }
    }
  },
  {
    id: 'edge-2',
    source: 'process-1',
    target: 'decision-1',
    type: 'smart',
    label: 'Processar',
    data: {
      smartRouting: true,
      snapToGrid: true
    }
  },
  {
    id: 'edge-3',
    source: 'decision-1',
    target: 'process-2',
    type: 'auto-routed',
    label: 'Sim',
    data: {
      routingInfo: {
        algorithm: 'astar',
        avoidNodes: true,
        preferOrthogonal: true,
        smoothCurves: true
      }
    }
  },
  {
    id: 'edge-4',
    source: 'decision-1',
    target: 'process-3',
    type: 'animated',
    label: 'Não',
    animated: true,
    data: {
      animation: 'flow',
      particles: true
    }
  },
  {
    id: 'edge-5',
    source: 'process-2',
    target: 'end-1',
    type: 'custom-bezier',
    label: 'Concluir',
    data: {
      controlPoints: [
        { x: 800, y: 75 },
        { x: 850, y: 125 }
      ]
    }
  },
  {
    id: 'edge-6',
    source: 'process-3',
    target: 'process-1',
    type: 'auto-routed',
    label: 'Reprocessar',
    data: {
      routingInfo: {
        algorithm: 'astar',
        avoidNodes: true,
        preferOrthogonal: false,
        smoothCurves: true
      }
    }
  }
];

// ============================================================================
// Componente Principal
// ============================================================================

export const AutoRoutingDemo: React.FC = () => {
  const [showPanel, setShowPanel] = useState(true);
  const [demoStep, setDemoStep] = useState(0);
  const { setNodes, setEdges, clearDiagram } = useDiagramStore();

  // ============================================================================
  // Handlers
  // ============================================================================

  const loadDemoData = useCallback(() => {
    const nodes = createDemoNodes();
    const edges = createDemoEdges();
    
    setNodes(nodes);
    setEdges(edges);
    
    secureLogger.info('Demo de auto-routing carregado', {
      nodes: nodes.length,
      edges: edges.length
    });
  }, [setNodes, setEdges]);

  const resetDemo = useCallback(() => {
    clearDiagram();
    setDemoStep(0);
    secureLogger.info('Demo resetado');
  }, [clearDiagram]);

  const nextStep = useCallback(() => {
    setDemoStep(prev => Math.min(prev + 1, 4));
  }, []);

  const prevStep = useCallback(() => {
    setDemoStep(prev => Math.max(prev - 1, 0));
  }, []);

  // ============================================================================
  // Dados dos Steps
  // ============================================================================

  const demoSteps = [
    {
      title: 'Introdução ao Auto-Routing',
      description: 'Sistema inteligente de roteamento de conexões que evita obstáculos e otimiza caminhos.',
      features: ['Algoritmo A*', 'Detecção de obstáculos', 'Suavização de curvas']
    },
    {
      title: 'Tipos de Arestas Customizadas',
      description: 'Diferentes tipos de arestas com funcionalidades específicas.',
      features: ['Auto-Routed', 'Smart Edge', 'Animated Edge', 'Custom Bezier']
    },
    {
      title: 'Configurações de Roteamento',
      description: 'Opções para personalizar o comportamento do auto-routing.',
      features: ['Evitar nós', 'Preferir ortogonalidade', 'Suavizar curvas']
    },
    {
      title: 'Demonstração Prática',
      description: 'Veja o auto-routing em ação com diferentes cenários.',
      features: ['Evitação de obstáculos', 'Otimização de caminhos', 'Conexões inteligentes']
    },
    {
      title: 'Painel de Controle',
      description: 'Interface para configurar e otimizar todas as conexões.',
      features: ['Configurações globais', 'Otimização em lote', 'Estatísticas']
    }
  ];

  const currentStep = demoSteps[demoStep];

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b bg-background">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Route className="h-6 w-6 text-blue-600" />
              <h1 className="text-2xl font-bold">Auto-Routing Demo</h1>
            </div>
            <Badge variant="secondary" className="ml-2">
              Step {demoStep + 1} of {demoSteps.length}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowPanel(!showPanel)}
            >
              <Settings className="h-4 w-4 mr-2" />
              {showPanel ? 'Ocultar' : 'Mostrar'} Painel
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={loadDemoData}
            >
              <Play className="h-4 w-4 mr-2" />
              Carregar Demo
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={resetDemo}
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reset
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Painel Lateral */}
        {showPanel && (
          <div className="w-80 border-r bg-background flex flex-col">
            {/* Info do Step Atual */}
            <Card className="m-4 mb-2">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-600" />
                  {currentStep.title}
                </CardTitle>
                <CardDescription>
                  {currentStep.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <h4 className="font-medium text-sm">Características:</h4>
                  <ul className="space-y-1">
                    {currentStep.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <Zap className="h-3 w-3 text-green-600" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* Navegação dos Steps */}
                <div className="flex items-center justify-between mt-4 pt-3 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={prevStep}
                    disabled={demoStep === 0}
                  >
                    Anterior
                  </Button>
                  
                  <span className="text-sm text-muted-foreground">
                    {demoStep + 1} / {demoSteps.length}
                  </span>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={nextStep}
                    disabled={demoStep === demoSteps.length - 1}
                  >
                    Próximo
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Separator className="mx-4" />

            {/* Painel de Auto-Routing */}
            <div className="flex-1 p-4 pt-2">
              <AutoRoutingPanel />
            </div>
          </div>
        )}

        {/* Canvas Principal */}
        <div className="flex-1 relative">
          <DiagramCanvas className="h-full" />
          
          {/* Overlay de Instruções */}
          <div className="absolute top-4 right-4 max-w-sm">
            <Card className="bg-background/95 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="space-y-2">
                  <h4 className="font-medium text-sm flex items-center gap-2">
                    <Route className="h-4 w-4 text-blue-600" />
                    Tipos de Arestas
                  </h4>
                  <div className="space-y-1 text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-0.5 bg-blue-600 rounded"></div>
                      <span>Auto-Routed (A*)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-0.5 bg-green-600 rounded"></div>
                      <span>Smart Edge</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-0.5 bg-purple-600 rounded animate-pulse"></div>
                      <span>Animated Edge</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-0.5 bg-orange-600 rounded"></div>
                      <span>Custom Bezier</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoRoutingDemo;