import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Calculator,
  Compass,
  Settings,
  TrendingDown,
  BarChart3,
  Sun,
  Zap,
  Battery,
  MapPin,
  Gauge,
  Info,
  CheckCircle
} from 'lucide-react';

interface OrientationConfig {
  azimuth: number; // Orientação (0-360°)
  tilt: number; // Inclinação (0-90°)
  location: {
    state: string;
    city: string;
    latitude: number;
    longitude: number;
  };
}

interface EquipmentConfig {
  modules: {
    brand: string;
    model: string;
    power: number;
    quantity: number;
    efficiency: number;
  };
  inverter: {
    brand: string;
    model: string;
    power: number;
    efficiency: number;
    type: string;
  };
  batteries?: {
    brand: string;
    model: string;
    capacity: number;
    quantity: number;
  };
}

interface LossesConfig {
  shading: number; // %
  soiling: number; // %
  temperature: number; // %
  mismatch: number; // %
  wiring: number; // %
  inverter: number; // %
  system: number; // %
}

interface SimulationResults {
  systemPower: number; // kWp
  annualGeneration: number; // kWh/ano
  monthlyGeneration: number[]; // kWh por mês
  performanceRatio: number; // %
  capacity: number; // %
  payback: number; // anos
  co2Reduction: number; // kg/ano
  financialSavings: {
    monthly: number;
    annual: number;
    total25Years: number;
  };
}

interface TechnicalSimulationNewProps {
  onResultsChange?: (results: SimulationResults) => void;
}

const simulationLevels = [
  { id: 'basic', name: 'Nível 1 - Básico', description: 'Simulação simplificada com parâmetros padrão' },
  { id: 'precise', name: 'Nível 2 - Preciso', description: 'Simulação detalhada com parâmetros customizáveis' }
];

const brazilianStates = [
  'Acre', 'Alagoas', 'Amapá', 'Amazonas', 'Bahia', 'Ceará', 'Distrito Federal',
  'Espírito Santo', 'Goiás', 'Maranhão', 'Mato Grosso', 'Mato Grosso do Sul',
  'Minas Gerais', 'Pará', 'Paraíba', 'Paraná', 'Pernambuco', 'Piauí',
  'Rio de Janeiro', 'Rio Grande do Norte', 'Rio Grande do Sul', 'Rondônia',
  'Roraima', 'Santa Catarina', 'São Paulo', 'Sergipe', 'Tocantins'
];

const modulesBrands = ['Canadian Solar', 'Jinko Solar', 'Trina Solar', 'JA Solar', 'LONGi Solar', 'Risen Energy'];
const inverterBrands = ['Fronius', 'SMA', 'ABB', 'Huawei', 'Growatt', 'Sungrow'];
const batteryBrands = ['Tesla', 'LG Chem', 'BYD', 'Pylontech', 'Victron Energy'];

export function TechnicalSimulationNew({ onResultsChange }: TechnicalSimulationNewProps) {
  const [simulationLevel, setSimulationLevel] = useState('basic');
  const [activeTab, setActiveTab] = useState('orientation');
  const [isCalculating, setIsCalculating] = useState(false);
  
  const [orientationConfig, setOrientationConfig] = useState<OrientationConfig>({
    azimuth: 180, // Sul
    tilt: 20,
    location: {
      state: '',
      city: '',
      latitude: -15.7942,
      longitude: -47.8822
    }
  });

  const [equipmentConfig, setEquipmentConfig] = useState<EquipmentConfig>({
    modules: {
      brand: '',
      model: '',
      power: 550,
      quantity: 20,
      efficiency: 21.5
    },
    inverter: {
      brand: '',
      model: '',
      power: 10000,
      efficiency: 97.5,
      type: 'string'
    }
  });

  const [lossesConfig, setLossesConfig] = useState<LossesConfig>({
    shading: 5,
    soiling: 2,
    temperature: 8,
    mismatch: 2,
    wiring: 2,
    inverter: 2.5,
    system: 1
  });

  const [results, setResults] = useState<SimulationResults | null>(null);

  const calculateSimulation = async () => {
    setIsCalculating(true);
    
    try {
      // Simular cálculo (em produção, seria uma API call)
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const systemPower = (equipmentConfig.modules.power * equipmentConfig.modules.quantity) / 1000;
      const totalLosses = Object.values(lossesConfig).reduce((sum, loss) => sum + loss, 0) / 100;
      const irradiation = 1800; // kWh/m²/ano (média Brasil)
      
      const annualGeneration = systemPower * irradiation * (1 - totalLosses);
      const monthlyGeneration = Array.from({ length: 12 }, (_, i) => {
        const seasonalFactor = 0.8 + 0.4 * Math.sin((i - 5) * Math.PI / 6);
        return Math.round(annualGeneration / 12 * seasonalFactor);
      });
      
      const performanceRatio = 85 - (totalLosses * 100);
      const capacity = Math.min(95, performanceRatio);
      const systemCost = systemPower * 4500;
      const annualSavings = annualGeneration * 0.65; // R$ 0,65/kWh
      const payback = systemCost / annualSavings;
      const co2Reduction = annualGeneration * 0.0817;
      
      const simulationResults: SimulationResults = {
        systemPower: Math.round(systemPower * 100) / 100,
        annualGeneration: Math.round(annualGeneration),
        monthlyGeneration,
        performanceRatio: Math.round(performanceRatio),
        capacity: Math.round(capacity),
        payback: Math.round(payback * 10) / 10,
        co2Reduction: Math.round(co2Reduction),
        financialSavings: {
          monthly: Math.round(annualSavings / 12),
          annual: Math.round(annualSavings),
          total25Years: Math.round(annualSavings * 25 * 0.8)
        }
      };
      
      setResults(simulationResults);
      onResultsChange?.(simulationResults);
      setActiveTab('results');
      
    } catch (error) {
      console.error('Erro na simulação:', error);
    } finally {
      setIsCalculating(false);
    }
  };

  const totalLossesPercentage = Object.values(lossesConfig).reduce((sum, loss) => sum + loss, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Simulação Técnica
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure os parâmetros do sistema fotovoltaico
          </p>
        </CardHeader>
        <CardContent>
          {/* Seleção de Nível */}
          <div className="space-y-4">
            <Label className="text-base font-medium">Seleção de Nível</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {simulationLevels.map((level) => (
                <Card 
                  key={level.id}
                  className={`cursor-pointer transition-all duration-200 ${
                    simulationLevel === level.id ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                  }`}
                  onClick={() => setSimulationLevel(level.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-4 h-4 rounded-full border-2 ${
                        simulationLevel === level.id ? 'bg-primary border-primary' : 'border-muted-foreground'
                      }`} />
                      <div>
                        <div className="font-medium">{level.name}</div>
                        <div className="text-sm text-muted-foreground">{level.description}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Abas de Navegação */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="orientation" className="flex items-center gap-2">
            <Compass className="h-4 w-4" />
            Orientação
          </TabsTrigger>
          <TabsTrigger value="equipment" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Equipamentos
          </TabsTrigger>
          <TabsTrigger value="losses" className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4" />
            Perdas
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Resultados
          </TabsTrigger>
        </TabsList>

        {/* Aba Orientação */}
        <TabsContent value="orientation" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Compass className="h-5 w-5" />
                Configuração de Orientação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Localização */}
              <div className="space-y-4">
                <Label className="text-base font-medium flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Localização
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Estado</Label>
                    <Select
                      value={orientationConfig.location.state}
                      onValueChange={(value) => setOrientationConfig(prev => ({
                        ...prev,
                        location: { ...prev.location, state: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o estado" />
                      </SelectTrigger>
                      <SelectContent>
                        {brazilianStates.map(state => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Cidade</Label>
                    <Input
                      placeholder="Digite a cidade"
                      value={orientationConfig.location.city}
                      onChange={(e) => setOrientationConfig(prev => ({
                        ...prev,
                        location: { ...prev.location, city: e.target.value }
                      }))}
                    />
                  </div>
                </div>
              </div>

              {/* Orientação e Inclinação */}
              <div className="space-y-4">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Sun className="h-4 w-4" />
                  Orientação e Inclinação
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Azimute (°)</Label>
                    <Input
                      type="number"
                      placeholder="180 (Sul)"
                      value={orientationConfig.azimuth}
                      onChange={(e) => setOrientationConfig(prev => ({
                        ...prev,
                        azimuth: parseInt(e.target.value) || 0
                      }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      0° = Norte, 90° = Leste, 180° = Sul, 270° = Oeste
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Inclinação (°)</Label>
                    <Input
                      type="number"
                      placeholder="20"
                      value={orientationConfig.tilt}
                      onChange={(e) => setOrientationConfig(prev => ({
                        ...prev,
                        tilt: parseInt(e.target.value) || 0
                      }))}
                    />
                    <p className="text-xs text-muted-foreground">
                      0° = Horizontal, 90° = Vertical
                    </p>
                  </div>
                </div>
              </div>

              {simulationLevel === 'precise' && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    No modo preciso, você pode ajustar coordenadas específicas e fatores de correção solar.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Equipamentos */}
        <TabsContent value="equipment" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuração de Equipamentos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Módulos Solares */}
              <div className="space-y-4">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  Módulos Solares
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Marca</Label>
                    <Select
                      value={equipmentConfig.modules.brand}
                      onValueChange={(value) => setEquipmentConfig(prev => ({
                        ...prev,
                        modules: { ...prev.modules, brand: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a marca" />
                      </SelectTrigger>
                      <SelectContent>
                        {modulesBrands.map(brand => (
                          <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Modelo</Label>
                    <Input
                      placeholder="Ex: CS6W-550MS"
                      value={equipmentConfig.modules.model}
                      onChange={(e) => setEquipmentConfig(prev => ({
                        ...prev,
                        modules: { ...prev.modules, model: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Potência (W)</Label>
                    <Input
                      type="number"
                      value={equipmentConfig.modules.power}
                      onChange={(e) => setEquipmentConfig(prev => ({
                        ...prev,
                        modules: { ...prev.modules, power: parseInt(e.target.value) || 0 }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Quantidade</Label>
                    <Input
                      type="number"
                      value={equipmentConfig.modules.quantity}
                      onChange={(e) => setEquipmentConfig(prev => ({
                        ...prev,
                        modules: { ...prev.modules, quantity: parseInt(e.target.value) || 0 }
                      }))}
                    />
                  </div>
                </div>
              </div>

              {/* Inversor */}
              <div className="space-y-4">
                <Label className="text-base font-medium flex items-center gap-2">
                  <Battery className="h-4 w-4" />
                  Inversor
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Marca</Label>
                    <Select
                      value={equipmentConfig.inverter.brand}
                      onValueChange={(value) => setEquipmentConfig(prev => ({
                        ...prev,
                        inverter: { ...prev.inverter, brand: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a marca" />
                      </SelectTrigger>
                      <SelectContent>
                        {inverterBrands.map(brand => (
                          <SelectItem key={brand} value={brand}>{brand}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Modelo</Label>
                    <Input
                      placeholder="Ex: Primo 10.0-1"
                      value={equipmentConfig.inverter.model}
                      onChange={(e) => setEquipmentConfig(prev => ({
                        ...prev,
                        inverter: { ...prev.inverter, model: e.target.value }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Potência (W)</Label>
                    <Input
                      type="number"
                      value={equipmentConfig.inverter.power}
                      onChange={(e) => setEquipmentConfig(prev => ({
                        ...prev,
                        inverter: { ...prev.inverter, power: parseInt(e.target.value) || 0 }
                      }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={equipmentConfig.inverter.type}
                      onValueChange={(value) => setEquipmentConfig(prev => ({
                        ...prev,
                        inverter: { ...prev.inverter, type: value }
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="string">String</SelectItem>
                        <SelectItem value="micro">Micro Inversor</SelectItem>
                        <SelectItem value="power_optimizer">Otimizador</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              {/* Resumo do Sistema */}
              <div className="bg-muted/50 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Gauge className="h-4 w-4" />
                  <span className="font-medium">Resumo do Sistema</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Potência Total:</span>
                    <div className="font-medium">
                      {((equipmentConfig.modules.power * equipmentConfig.modules.quantity) / 1000).toFixed(2)} kWp
                    </div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Módulos:</span>
                    <div className="font-medium">{equipmentConfig.modules.quantity} unidades</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Inversor:</span>
                    <div className="font-medium">{(equipmentConfig.inverter.power / 1000).toFixed(1)} kW</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Eficiência:</span>
                    <div className="font-medium">{equipmentConfig.modules.efficiency}%</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Perdas */}
        <TabsContent value="losses" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5" />
                Configuração de Perdas
              </CardTitle>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Total de perdas:</span>
                <Badge variant={totalLossesPercentage > 25 ? 'destructive' : totalLossesPercentage > 15 ? 'secondary' : 'default'}>
                  {totalLossesPercentage.toFixed(1)}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(lossesConfig).map(([key, value]) => {
                  const lossLabels: Record<string, string> = {
                    shading: 'Sombreamento',
                    soiling: 'Sujidade',
                    temperature: 'Temperatura',
                    mismatch: 'Descasamento',
                    wiring: 'Cabeamento',
                    inverter: 'Inversor',
                    system: 'Sistema'
                  };
                  
                  return (
                    <div key={key} className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label>{lossLabels[key]}</Label>
                        <Badge variant="outline">{value}%</Badge>
                      </div>
                      <div className="space-y-2">
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          max="50"
                          value={value}
                          onChange={(e) => setLossesConfig(prev => ({
                            ...prev,
                            [key]: parseFloat(e.target.value) || 0
                          }))}
                        />
                        <Progress value={(value / 20) * 100} className="h-2" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {simulationLevel === 'basic' && (
                <Alert>
                  <Info className="h-4 w-4" />
                  <AlertDescription>
                    No modo básico, as perdas são configuradas com valores padrão da indústria.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Resultados */}
        <TabsContent value="results" className="space-y-6">
          {!results ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Calculator className="h-16 w-16 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Simulação Não Executada</h3>
                <p className="text-muted-foreground text-center mb-6">
                  Configure os parâmetros nas abas anteriores e execute a simulação para ver os resultados.
                </p>
                <Button onClick={calculateSimulation} disabled={isCalculating} size="lg">
                  {isCalculating ? 'Calculando...' : 'Executar Simulação'}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Resumo dos Resultados */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Resultados da Simulação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{results.systemPower} kWp</div>
                      <div className="text-sm text-muted-foreground">Potência Instalada</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{results.annualGeneration.toLocaleString()} kWh</div>
                      <div className="text-sm text-muted-foreground">Geração Anual</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">{results.performanceRatio}%</div>
                      <div className="text-sm text-muted-foreground">Performance Ratio</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{results.payback} anos</div>
                      <div className="text-sm text-muted-foreground">Payback</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Economia Financeira */}
              <Card>
                <CardHeader>
                  <CardTitle>Economia Financeira</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-600">R$ {results.financialSavings.monthly.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Economia Mensal</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-600">R$ {results.financialSavings.annual.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Economia Anual</div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl font-bold text-green-600">R$ {results.financialSavings.total25Years.toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Economia 25 Anos</div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Impacto Ambiental */}
              <Card>
                <CardHeader>
                  <CardTitle>Impacto Ambiental</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{results.co2Reduction.toLocaleString()} kg</div>
                    <div className="text-sm text-muted-foreground">Redução de CO₂ por ano</div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Botão de Simulação (fixo no bottom) */}
      {activeTab !== 'results' && (
        <div className="sticky bottom-4 flex justify-center">
          <Button 
            onClick={calculateSimulation} 
            disabled={isCalculating}
            size="lg"
            className="shadow-lg"
          >
            {isCalculating ? 'Calculando...' : 'Executar Simulação'}
          </Button>
        </div>
      )}
    </div>
  );
}