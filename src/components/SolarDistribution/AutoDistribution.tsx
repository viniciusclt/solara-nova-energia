import React, { useState, useCallback } from 'react';
import {
  DragDropProvider,
  DragDropContainer,
  DragDropToolbar,
  createDragDropItem,
  createDragDropContainer,
  useDragDrop
} from '../DragDropAdvanced';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  Zap, 
  Sun, 
  Calculator,
  RotateCcw,
  Download,
  Upload,
  Settings,
  Grid3X3,
  Maximize
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';

interface SolarModule {
  id: string;
  name: string;
  power: number; // Watts
  efficiency: number; // %
  dimensions: { width: number; height: number }; // metros
  manufacturer: string;
}

interface Inverter {
  id: string;
  name: string;
  power: number; // Watts
  efficiency: number; // %
  maxModules: number;
  manufacturer: string;
}

interface DistributionConfig {
  roofArea: number; // m²
  targetPower: number; // kW
  orientation: 'north' | 'south' | 'east' | 'west';
  tilt: number; // graus
  shading: number; // % de sombreamento
  spacing: number; // metros entre módulos
}

interface AutoDistributionProps {
  modules: SolarModule[];
  inverters: Inverter[];
  onSave?: (distribution: { config: DistributionConfig; result: unknown }) => void;
  className?: string;
}

export const AutoDistribution: React.FC<AutoDistributionProps> = ({
  modules,
  inverters,
  onSave,
  className
}) => {
  const { toast } = useToast();
  const [config, setConfig] = useState<DistributionConfig>({
    roofArea: 100,
    targetPower: 10,
    orientation: 'north',
    tilt: 30,
    shading: 0,
    spacing: 0.5
  });
  
  const [selectedModule, setSelectedModule] = useState<string>('');
  const [selectedInverter, setSelectedInverter] = useState<string>('');
  const [distributionResult, setDistributionResult] = useState<unknown>(null);
  const [isCalculating, setIsCalculating] = useState(false);

  // Containers para o drag & drop
  const initialContainers = [
    {
      ...createDragDropContainer('grid'),
      id: 'roof-layout',
      items: []
    },
    {
      ...createDragDropContainer('vertical'),
      id: 'equipment-list',
      items: []
    }
  ];

  const calculateOptimalDistribution = useCallback(async () => {
    if (!selectedModule || !selectedInverter) {
      toast({
        title: "Erro",
        description: "Selecione um módulo e um inversor",
        variant: "destructive"
      });
      return;
    }

    setIsCalculating(true);
    
    try {
      // Simular cálculo de distribuição automática
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const module = modules.find(m => m.id === selectedModule);
      const inverter = inverters.find(i => i.id === selectedInverter);
      
      if (!module || !inverter) return;
      
      // Cálculos básicos
      const moduleArea = module.dimensions.width * module.dimensions.height;
      const availableArea = config.roofArea * (1 - config.shading / 100);
      const maxModulesByArea = Math.floor(availableArea / (moduleArea + config.spacing));
      const maxModulesByInverter = inverter.maxModules;
      const maxModulesByPower = Math.floor((config.targetPower * 1000) / module.power);
      
      const optimalModules = Math.min(maxModulesByArea, maxModulesByInverter, maxModulesByPower);
      const totalPower = (optimalModules * module.power) / 1000; // kW
      const efficiency = module.efficiency * inverter.efficiency / 100;
      
      // Criar layout automático
      const modulesPerRow = Math.floor(Math.sqrt(optimalModules));
      const rows = Math.ceil(optimalModules / modulesPerRow);
      
      const layoutItems = [];
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < modulesPerRow && layoutItems.length < optimalModules; col++) {
          layoutItems.push({
            ...createDragDropItem('solar-module'),
            id: `module-${row}-${col}`,
            content: {
              title: `Módulo ${layoutItems.length + 1}`,
              power: module.power,
              position: { row, col }
            },
            position: {
              x: col * (module.dimensions.width * 50 + config.spacing * 10),
              y: row * (module.dimensions.height * 50 + config.spacing * 10)
            }
          });
        }
      }
      
      const result = {
        modules: optimalModules,
        totalPower,
        efficiency,
        layout: layoutItems,
        inverterCount: Math.ceil(optimalModules / inverter.maxModules),
        estimatedGeneration: totalPower * efficiency * 4.5, // kWh/dia estimado
        roofUtilization: (optimalModules * moduleArea / config.roofArea) * 100
      };
      
      setDistributionResult(result);
      
      toast({
        title: "Distribuição Calculada",
        description: `${optimalModules} módulos, ${totalPower.toFixed(2)} kW`,
        variant: "default"
      });
      
    } catch (error) {
      toast({
        title: "Erro no Cálculo",
        description: "Falha ao calcular distribuição automática",
        variant: "destructive"
      });
    } finally {
      setIsCalculating(false);
    }
  }, [config, selectedModule, selectedInverter, modules, inverters, toast]);

  const resetDistribution = () => {
    setDistributionResult(null);
    setConfig({
      roofArea: 100,
      targetPower: 10,
      orientation: 'north',
      tilt: 30,
      shading: 0,
      spacing: 0.5
    });
  };

  const exportDistribution = () => {
    if (!distributionResult) return;
    
    const data = {
      config,
      result: distributionResult,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `distribuicao-solar-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const saveDistribution = () => {
    if (onSave && distributionResult) {
      onSave({
        config,
        result: distributionResult
      });
      
      toast({
        title: "Distribuição Salva",
        description: "Layout salvo com sucesso",
        variant: "default"
      });
    }
  };

  return (
    <div className={`w-full h-full ${className}`}>
      <DragDropProvider initialContainers={initialContainers}>
        <div className="flex flex-col h-full">
          {/* Toolbar */}
          <DragDropToolbar
            onSave={saveDistribution}
            onExport={exportDistribution}
            onImport={() => {}}
            className="border-b"
            customActions={
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={calculateOptimalDistribution}
                  disabled={isCalculating}
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  {isCalculating ? 'Calculando...' : 'Calcular'}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetDistribution}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            }
          />

          <div className="flex flex-1 overflow-hidden">
            {/* Sidebar de Configuração */}
            <div className="w-80 border-r bg-gray-50 p-4 overflow-y-auto">
              {/* Configurações do Telhado */}
              <Card className="mb-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center">
                    <Grid3X3 className="h-4 w-4 mr-2" />
                    Configurações do Telhado
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label htmlFor="roofArea">Área do Telhado (m²)</Label>
                    <Input
                      id="roofArea"
                      type="number"
                      value={config.roofArea}
                      onChange={(e) => setConfig(prev => ({ ...prev, roofArea: Number(e.target.value) }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="targetPower">Potência Desejada (kW)</Label>
                    <Input
                      id="targetPower"
                      type="number"
                      value={config.targetPower}
                      onChange={(e) => setConfig(prev => ({ ...prev, targetPower: Number(e.target.value) }))}
                    />
                  </div>
                  
                  <div>
                    <Label>Orientação</Label>
                    <Select
                      value={config.orientation}
                      onValueChange={(value: string) => setConfig(prev => ({ ...prev, orientation: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="north">Norte</SelectItem>
                        <SelectItem value="south">Sul</SelectItem>
                        <SelectItem value="east">Leste</SelectItem>
                        <SelectItem value="west">Oeste</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label htmlFor="tilt">Inclinação (°)</Label>
                    <Input
                      id="tilt"
                      type="number"
                      min="0"
                      max="90"
                      value={config.tilt}
                      onChange={(e) => setConfig(prev => ({ ...prev, tilt: Number(e.target.value) }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="shading">Sombreamento (%)</Label>
                    <Input
                      id="shading"
                      type="number"
                      min="0"
                      max="100"
                      value={config.shading}
                      onChange={(e) => setConfig(prev => ({ ...prev, shading: Number(e.target.value) }))}
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="spacing">Espaçamento (m)</Label>
                    <Input
                      id="spacing"
                      type="number"
                      step="0.1"
                      min="0"
                      value={config.spacing}
                      onChange={(e) => setConfig(prev => ({ ...prev, spacing: Number(e.target.value) }))}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Seleção de Equipamentos */}
              <Card className="mb-4">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm flex items-center">
                    <Sun className="h-4 w-4 mr-2" />
                    Equipamentos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <Label>Módulo Solar</Label>
                    <Select value={selectedModule} onValueChange={setSelectedModule}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um módulo" />
                      </SelectTrigger>
                      <SelectContent>
                        {modules.map(module => (
                          <SelectItem key={module.id} value={module.id}>
                            {module.name} - {module.power}W
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>Inversor</Label>
                    <Select value={selectedInverter} onValueChange={setSelectedInverter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione um inversor" />
                      </SelectTrigger>
                      <SelectContent>
                        {inverters.map(inverter => (
                          <SelectItem key={inverter.id} value={inverter.id}>
                            {inverter.name} - {inverter.power}W
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Resultados */}
              {distributionResult && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center">
                      <Zap className="h-4 w-4 mr-2" />
                      Resultados
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Módulos:</span>
                      <Badge variant="outline">{distributionResult.modules}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Potência Total:</span>
                      <Badge variant="outline">{distributionResult.totalPower.toFixed(2)} kW</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Inversores:</span>
                      <Badge variant="outline">{distributionResult.inverterCount}</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Geração Est.:</span>
                      <Badge variant="outline">{distributionResult.estimatedGeneration.toFixed(1)} kWh/dia</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Utilização:</span>
                      <Badge variant="outline">{distributionResult.roofUtilization.toFixed(1)}%</Badge>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Área Principal - Layout do Telhado */}
            <div className="flex-1 p-4 overflow-auto">
              <DragDropContainer
                containerId="roof-layout"
                title="Layout do Telhado"
                description="Arraste e posicione os módulos solares"
                showGrid={true}
                className="h-full min-h-[600px] bg-blue-50 border-2 border-dashed border-blue-200"
                onAddItem={() => {}}
              />
            </div>
          </div>
        </div>
      </DragDropProvider>
    </div>
  );
};

export default AutoDistribution;