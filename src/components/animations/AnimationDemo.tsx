import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Badge } from '../ui/badge';
import { Play, Pause, RotateCcw, Settings } from 'lucide-react';
import { AnimationSystem, AnimatedElement, AnimationControls, AnimationTimeline, ANIMATION_PRESETS } from './index';
import type { AnimationConfig, AnimationPreset, AnimationTimeline as TimelineType } from '../../types/animations';

const DemoCard: React.FC<{
  title: string;
  description: string;
  config: AnimationConfig;
  trigger?: 'onMount' | 'onHover' | 'onClick' | 'onScroll';
}> = ({ title, description, config, trigger = 'onClick' }) => {
  const [key, setKey] = useState(0);

  const resetAnimation = () => {
    setKey(prev => prev + 1);
  };

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm">
          {title}
          <Badge variant="outline" className="text-xs">
            {trigger}
          </Badge>
        </CardTitle>
        <p className="text-xs text-muted-foreground">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-center h-32 border-2 border-dashed border-border rounded-lg">
          <AnimatedElement
            key={key}
            id={`demo-${title.replace(/\s+/g, '-').toLowerCase()}`}
            animation={config}
            trigger={trigger}
            className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center text-primary-foreground font-bold"
          >
            {title.charAt(0)}
          </AnimatedElement>
        </div>
        <div className="flex items-center justify-between">
          <div className="text-xs text-muted-foreground">
            {config.duration}s • {config.easing}
          </div>
          <Button size="sm" variant="outline" onClick={resetAnimation}>
            <RotateCcw className="h-3 w-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const TimelineDemo: React.FC = () => {
  const demoTimeline: TimelineType = {
    id: 'demo-timeline',
    name: 'Sequência de Entrada',
    sequences: [
      {
        id: 'seq-1',
        name: 'Fade In',
        keyframes: [
          { time: 0, properties: { opacity: 0 } },
          { time: 1, properties: { opacity: 1 } }
        ],
        duration: 0.5
      },
      {
        id: 'seq-2',
        name: 'Scale In',
        keyframes: [
          { time: 0, properties: { scale: 0.8 } },
          { time: 1, properties: { scale: 1 } }
        ],
        duration: 0.4
      },
      {
        id: 'seq-3',
        name: 'Slide Up',
        keyframes: [
          { time: 0, properties: { y: 20 } },
          { time: 1, properties: { y: 0 } }
        ],
        duration: 0.3
      }
    ],
    totalDuration: 1.2,
    autoPlay: false,
    loop: false
  };

  return (
    <div className="space-y-4">
      <AnimationTimeline timeline={demoTimeline} />
    </div>
  );
};

const ControlsDemo: React.FC = () => {
  const [selectedConfig, setSelectedConfig] = useState<AnimationConfig>(ANIMATION_PRESETS.FADE_IN);
  const [demoKey, setDemoKey] = useState(0);

  const handleAnimationChange = (config: AnimationConfig) => {
    setSelectedConfig(config);
    setDemoKey(prev => prev + 1);
  };

  const handlePresetSelect = (preset: AnimationPreset) => {
    setSelectedConfig(preset.config);
    setDemoKey(prev => prev + 1);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div>
        <AnimationControls
          selectedElementId="demo-controls"
          onAnimationChange={handleAnimationChange}
          onPresetSelect={handlePresetSelect}
        />
      </div>
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-48 border-2 border-dashed border-border rounded-lg">
              <AnimatedElement
                key={demoKey}
                id="demo-controls"
                animation={selectedConfig}
                trigger="onMount"
                className="w-24 h-24 bg-gradient-to-br from-primary to-primary/70 rounded-xl flex items-center justify-center text-primary-foreground font-bold text-xl shadow-lg"
              >
                ✨
              </AnimatedElement>
            </div>
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="text-sm font-medium mb-2">Configuração Atual:</div>
              <div className="text-xs text-muted-foreground space-y-1">
                <div>Tipo: {selectedConfig.type}</div>
                <div>Duração: {selectedConfig.duration}s</div>
                <div>Easing: {selectedConfig.easing}</div>
                {selectedConfig.delay && <div>Delay: {selectedConfig.delay}s</div>}
                {selectedConfig.repeat && <div>Repetir: {selectedConfig.repeat}</div>}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export const AnimationDemo: React.FC = () => {
  const entranceAnimations = [
    { title: 'Fade In', description: 'Aparece gradualmente', config: ANIMATION_PRESETS.FADE_IN },
    { title: 'Slide Left', description: 'Desliza da esquerda', config: ANIMATION_PRESETS.SLIDE_IN_LEFT },
    { title: 'Scale In', description: 'Cresce do centro', config: ANIMATION_PRESETS.SCALE_IN },
    { title: 'Zoom', description: 'Zoom com efeito', config: ANIMATION_PRESETS.ZOOM }
  ];

  const emphasisAnimations = [
    { title: 'Bounce', description: 'Efeito de salto', config: ANIMATION_PRESETS.BOUNCE },
    { title: 'Pulse', description: 'Pulsa continuamente', config: { ...ANIMATION_PRESETS.PULSE, repeat: 3 } },
    { title: 'Shake', description: 'Balança horizontalmente', config: ANIMATION_PRESETS.SHAKE }
  ];

  const hoverAnimations = [
    { title: 'Hover Scale', description: 'Cresce no hover', config: ANIMATION_PRESETS.SCALE_IN, trigger: 'onHover' as const },
    { title: 'Hover Bounce', description: 'Salta no hover', config: ANIMATION_PRESETS.BOUNCE, trigger: 'onHover' as const }
  ];

  return (
    <AnimationSystem config={{ debugMode: true, globalDuration: 0.5 }}>
      <div className="container mx-auto p-6 space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Sistema de Animações</h1>
          <p className="text-muted-foreground">
            Demonstração completa do sistema de animações com Framer Motion
          </p>
        </div>

        <Tabs defaultValue="entrance" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="entrance">Entrada</TabsTrigger>
            <TabsTrigger value="emphasis">Ênfase</TabsTrigger>
            <TabsTrigger value="hover">Hover</TabsTrigger>
            <TabsTrigger value="timeline">Timeline</TabsTrigger>
            <TabsTrigger value="controls">Controles</TabsTrigger>
          </TabsList>

          <TabsContent value="entrance" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Animações de Entrada</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {entranceAnimations.map((animation) => (
                  <DemoCard
                    key={animation.title}
                    title={animation.title}
                    description={animation.description}
                    config={animation.config}
                  />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="emphasis" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Animações de Ênfase</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {emphasisAnimations.map((animation) => (
                  <DemoCard
                    key={animation.title}
                    title={animation.title}
                    description={animation.description}
                    config={animation.config}
                  />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="hover" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Animações de Hover</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {hoverAnimations.map((animation) => (
                  <DemoCard
                    key={animation.title}
                    title={animation.title}
                    description={animation.description}
                    config={animation.config}
                    trigger={animation.trigger}
                  />
                ))}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Timeline de Animações</h2>
              <TimelineDemo />
            </div>
          </TabsContent>

          <TabsContent value="controls" className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold mb-4">Controles de Animação</h2>
              <ControlsDemo />
            </div>
          </TabsContent>
        </Tabs>

        <Card>
          <CardHeader>
            <CardTitle>Status do Sistema</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
              <div className="space-y-2">
                <div className="text-2xl font-bold text-green-600">20+</div>
                <div className="text-sm text-muted-foreground">Tipos de Animação</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-blue-600">14</div>
                <div className="text-sm text-muted-foreground">Easing Functions</div>
              </div>
              <div className="space-y-2">
                <div className="text-2xl font-bold text-purple-600">5</div>
                <div className="text-sm text-muted-foreground">Triggers Disponíveis</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AnimationSystem>
  );
};

export default AnimationDemo;