import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { toast } from './ui/use-toast';
import {
  Calculator,
  Zap,
  Sun,
  Battery,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Info,
  Download,
  Share2
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface ConsumptionData {
  month: string;
  consumption: number;
  generation?: number;
  savings?: number;
}

interface SystemConfiguration {
  panels: {
    quantity: number;
    power: number; // Watts
    efficiency: number; // %
    brand: string;
    model: string;
  };
  inverter: {
    power: number; // Watts
    efficiency: number; // %
    brand: string;
    model: string;
    type: 'string' | 'micro' | 'power_optimizer';
  };
  installation: {
    orientation: number; // degrees (0-360)
    tilt: number; // degrees (0-90)
    shading: number; // % (0-100)
    location: {
      latitude: number;
      longitude: number;
      city: string;
      state: string;
    };
  };
  electrical: {
    voltage: number; // V
    phase: 'single' | 'two' | 'three';
    connectionType: 'grid_tie' | 'off_grid' | 'hybrid';
  };
}

interface SimulationResults {
  systemPower: number; // kWp
  monthlyGeneration: ConsumptionData[];
  annualGeneration: number; // kWh
  performanceRatio: number; // %
  capacity: number; // %
  paybackPeriod: number; // years
  co2Reduction: number; // kg/year
  financialSavings: {
    monthly: number;
    annual: number;
    total25Years: number;
  };
  technicalSpecs: {
    panelsInSeries: number;
    stringsInParallel: number;
    totalCurrent: number;
    totalVoltage: number;
    cableSection: number;
    protectionDevices: string[];
  };
}

interface TechnicalSimulatorProps {
  initialConsumption?: ConsumptionData[];
  onResultsChange?: (results: SimulationResults | null) => void;
  className?: string;
}

export function TechnicalSimulator({
  initialConsumption = [],
  onResultsChange,
  className
}: TechnicalSimulatorProps) {
  const [consumption, setConsumption] = useState<ConsumptionData[]>(initialConsumption);
  const [configuration, setConfiguration] = useState<SystemConfiguration>({
    panels: {
      quantity: 10,
      power: 550,
      efficiency: 21.5,
      brand: 'Canadian Solar',
      model: 'CS3W-550MS'
    },
    inverter: {
      power: 5000,
      efficiency: 97.5,
      brand: 'Fronius',
      model: 'Primo 5.0-1',
      type: 'string'
    },
    installation: {
      orientation: 180, // Sul
      tilt: 23,
      shading: 5,
      location: {
        latitude: -23.5505,
        longitude: -46.6333,
        city: 'São Paulo',
        state: 'SP'
      }
    },
    electrical: {
      voltage: 220,
      phase: 'single',
      connectionType: 'grid_tie'
    }
  });
  const [results, setResults] = useState<SimulationResults | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [tariff, setTariff] = useState(0.75); // R$/kWh

  // Dados de irradiação solar por estado (kWh/m²/dia)
  const solarIrradiation: Record<string, number> = {
    'AC': 5.2, 'AL': 5.8, 'AP': 5.1, 'AM': 4.8, 'BA': 6.2, 'CE': 6.1,
    'DF': 5.7, 'ES': 5.4, 'GO': 5.8, 'MA': 5.5, 'MT': 5.9, 'MS': 5.6,
    'MG': 5.5, 'PA': 5.0, 'PB': 6.0, 'PR': 4.9, 'PE': 6.1, 'PI': 5.9,
    'RJ': 5.2, 'RN': 6.2, 'RS': 4.6, 'RO': 5.1, 'RR': 5.3, 'SC': 4.8,
    'SP': 5.1, 'SE': 5.9, 'TO': 5.7
  };

  useEffect(() => {
    if (initialConsumption.length > 0) {
      setConsumption(initialConsumption);
    } else {
      // Gerar dados de consumo padrão
      const months = [
        'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
        'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
      ];
      const defaultConsumption = months.map(month => ({
        month,
        consumption: 300 + Math.random() * 100 // 300-400 kWh
      }));
      setConsumption(defaultConsumption);
    }
  }, [initialConsumption]);

  const calculateSystemPerformance = () => {
    setIsCalculating(true);
    
    try {
      // Potência total do sistema
      const systemPower = (configuration.panels.quantity * configuration.panels.power) / 1000; // kWp
      
      // Irradiação solar da localização
      const dailyIrradiation = solarIrradiation[configuration.installation.location.state] || 5.0;
      
      // Fatores de correção
      const orientationFactor = calculateOrientationFactor(configuration.installation.orientation);
      const tiltFactor = calculateTiltFactor(configuration.installation.tilt, configuration.installation.location.latitude);
      const shadingFactor = (100 - configuration.installation.shading) / 100;
      const inverterEfficiency = configuration.inverter.efficiency / 100;
      const systemEfficiency = 0.85; // Perdas do sistema (cabos, conexões, etc.)
      
      // Performance Ratio
      const performanceRatio = orientationFactor * tiltFactor * shadingFactor * inverterEfficiency * systemEfficiency;
      
      // Geração mensal
      const monthlyGeneration = consumption.map((item, index) => {
        // Variação sazonal da irradiação (simplificada)
        const seasonalFactor = 1 + 0.2 * Math.sin((index - 2) * Math.PI / 6);
        const monthlyIrradiation = dailyIrradiation * seasonalFactor * 30.44; // média de dias por mês
        const generation = systemPower * monthlyIrradiation * performanceRatio;
        const savings = Math.min(generation, item.consumption) * tariff;
        
        return {
          ...item,
          generation: Math.round(generation),
          savings: Math.round(savings * 100) / 100
        };
      });
      
      // Geração anual
      const annualGeneration = monthlyGeneration.reduce((sum, item) => sum + (item.generation || 0), 0);
      const annualConsumption = consumption.reduce((sum, item) => sum + item.consumption, 0);
      const annualSavings = monthlyGeneration.reduce((sum, item) => sum + (item.savings || 0), 0);
      
      // Capacidade do sistema
      const capacity = Math.min((annualGeneration / annualConsumption) * 100, 100);
      
      // Payback
      const systemCost = systemPower * 4500; // R$ 4.500/kWp (estimativa)
      const paybackPeriod = systemCost / annualSavings;
      
      // Redução de CO2 (0.0817 kg CO2/kWh no Brasil)
      const co2Reduction = annualGeneration * 0.0817;
      
      // Especificações técnicas
      const technicalSpecs = calculateTechnicalSpecs(configuration);
      
      const simulationResults: SimulationResults = {
        systemPower,
        monthlyGeneration,
        annualGeneration: Math.round(annualGeneration),
        performanceRatio: Math.round(performanceRatio * 100),
        capacity: Math.round(capacity),
        paybackPeriod: Math.round(paybackPeriod * 10) / 10,
        co2Reduction: Math.round(co2Reduction),
        financialSavings: {
          monthly: Math.round(annualSavings / 12),
          annual: Math.round(annualSavings),
          total25Years: Math.round(annualSavings * 25 * 0.8) // Considerando degradação
        },
        technicalSpecs
      };
      
      setResults(simulationResults);
      onResultsChange?.(simulationResults);
      
      toast({
        title: "Simulação Concluída",
        description: "Os cálculos técnicos foram realizados com sucesso."
      });
      
    } catch (error) {
      console.error('Erro na simulação:', error);
      toast({
        title: "Erro na Simulação",
        description: "Erro ao calcular o sistema. Verifique os dados inseridos.",
        variant: "destructive"
      });
    } finally {
      setIsCalculating(false);
    }
  };

  const calculateOrientationFactor = (orientation: number) => {
    // Fator de correção para orientação (180° = Sul = 1.0)
    const deviation = Math.abs(orientation - 180);
    return Math.max(0.7, 1 - (deviation / 180) * 0.3);
  };

  const calculateTiltFactor = (tilt: number, latitude: number) => {
    // Ângulo ótimo é aproximadamente igual à latitude
    const optimalTilt = Math.abs(latitude);
    const deviation = Math.abs(tilt - optimalTilt);
    return Math.max(0.8, 1 - (deviation / 90) * 0.2);
  };

  const calculateTechnicalSpecs = (config: SystemConfiguration) => {
    const panelVoltage = 40; // V (típico para painéis de 550W)
    const panelCurrent = config.panels.power / panelVoltage;
    
    // Configuração de strings
    const maxVoltage = config.electrical.voltage === 380 ? 1000 : 600; // V
    const panelsInSeries = Math.floor(maxVoltage / panelVoltage * 0.8); // Margem de segurança
    const stringsInParallel = Math.ceil(config.panels.quantity / panelsInSeries);
    
    const totalCurrent = stringsInParallel * panelCurrent;
    const totalVoltage = panelsInSeries * panelVoltage;
    
    // Seção do cabo (simplificado)
    const cableSection = totalCurrent <= 20 ? 4 : totalCurrent <= 32 ? 6 : 10;
    
    const protectionDevices = [
      `Disjuntor CC: ${Math.ceil(totalCurrent * 1.25)}A`,
      `DPS CC: Classe II`,
      `Disjuntor CA: ${Math.ceil(config.inverter.power / config.electrical.voltage * 1.25)}A`,
      `DPS CA: Classe II`
    ];
    
    return {
      panelsInSeries: Math.min(panelsInSeries, config.panels.quantity),
      stringsInParallel,
      totalCurrent: Math.round(totalCurrent * 10) / 10,
      totalVoltage: Math.round(totalVoltage),
      cableSection,
      protectionDevices
    };
  };

  const exportResults = () => {
    if (!results) return;
    
    const data = {
      configuration,
      results,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `simulacao-tecnica-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className={className}>
      <div className="space-y-6">
        {/* Configuração do Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Configuração do Sistema
            </CardTitle>
            <CardDescription>
              Configure os componentes e parâmetros do sistema fotovoltaico
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Painéis Solares */}
            <div className="space-y-4">
              <Label className="text-base font-medium flex items-center gap-2">
                <Sun className="h-4 w-4" />
                Painéis Solares
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Quantidade</Label>
                  <Input
                    type="number"
                    value={configuration.panels.quantity}
                    onChange={(e) => setConfiguration(prev => ({
                      ...prev,
                      panels: { ...prev.panels, quantity: parseInt(e.target.value) || 0 }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Potência (W)</Label>
                  <Input
                    type="number"
                    value={configuration.panels.power}
                    onChange={(e) => setConfiguration(prev => ({
                      ...prev,
                      panels: { ...prev.panels, power: parseInt(e.target.value) || 0 }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Eficiência (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={configuration.panels.efficiency}
                    onChange={(e) => setConfiguration(prev => ({
                      ...prev,
                      panels: { ...prev.panels, efficiency: parseFloat(e.target.value) || 0 }
                    }))}
                  />
                </div>
              </div>
            </div>

            <Separator />

            {/* Inversor */}
            <div className="space-y-4">
              <Label className="text-base font-medium flex items-center gap-2">
                <Zap className="h-4 w-4" />
                Inversor
              </Label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Potência (W)</Label>
                  <Input
                    type="number"
                    value={configuration.inverter.power}
                    onChange={(e) => setConfiguration(prev => ({
                      ...prev,
                      inverter: { ...prev.inverter, power: parseInt(e.target.value) || 0 }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Eficiência (%)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={configuration.inverter.efficiency}
                    onChange={(e) => setConfiguration(prev => ({
                      ...prev,
                      inverter: { ...prev.inverter, efficiency: parseFloat(e.target.value) || 0 }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <Select
                    value={configuration.inverter.type}
                    onValueChange={(value: string) => setConfiguration(prev => ({
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

            <Separator />

            {/* Instalação */}
            <div className="space-y-4">
              <Label className="text-base font-medium">Parâmetros de Instalação</Label>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label>Orientação (°)</Label>
                  <Input
                    type="number"
                    value={configuration.installation.orientation}
                    onChange={(e) => setConfiguration(prev => ({
                      ...prev,
                      installation: { ...prev.installation, orientation: parseInt(e.target.value) || 0 }
                    }))}
                    placeholder="180 (Sul)"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Inclinação (°)</Label>
                  <Input
                    type="number"
                    value={configuration.installation.tilt}
                    onChange={(e) => setConfiguration(prev => ({
                      ...prev,
                      installation: { ...prev.installation, tilt: parseInt(e.target.value) || 0 }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Sombreamento (%)</Label>
                  <Input
                    type="number"
                    value={configuration.installation.shading}
                    onChange={(e) => setConfiguration(prev => ({
                      ...prev,
                      installation: { ...prev.installation, shading: parseInt(e.target.value) || 0 }
                    }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <Select
                    value={configuration.installation.location.state}
                    onValueChange={(value) => setConfiguration(prev => ({
                      ...prev,
                      installation: {
                        ...prev.installation,
                        location: { ...prev.installation.location, state: value }
                      }
                    }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.keys(solarIrradiation).map(state => (
                        <SelectItem key={state} value={state}>{state}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={calculateSystemPerformance} disabled={isCalculating} className="flex-1">
                {isCalculating ? "Calculando..." : "Calcular Sistema"}
              </Button>
              {results && (
                <Button variant="outline" onClick={exportResults}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Resultados */}
        {results && (
          <div className="space-y-6">
            {/* Resumo do Sistema */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  Resumo do Sistema
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
                    <div className="text-2xl font-bold text-purple-600">{results.paybackPeriod} anos</div>
                    <div className="text-sm text-muted-foreground">Payback</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gráfico de Geração vs Consumo */}
            <Card>
              <CardHeader>
                <CardTitle>Geração vs Consumo Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={results.monthlyGeneration}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="consumption" fill="#ef4444" name="Consumo (kWh)" />
                    <Bar dataKey="generation" fill="#22c55e" name="Geração (kWh)" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Especificações Técnicas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Battery className="h-5 w-5" />
                  Especificações Técnicas
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <h4 className="font-medium">Configuração Elétrica</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Painéis em série:</span>
                        <span className="font-medium">{results.technicalSpecs.panelsInSeries}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Strings em paralelo:</span>
                        <span className="font-medium">{results.technicalSpecs.stringsInParallel}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Corrente total:</span>
                        <span className="font-medium">{results.technicalSpecs.totalCurrent} A</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Tensão total:</span>
                        <span className="font-medium">{results.technicalSpecs.totalVoltage} V</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Seção do cabo:</span>
                        <span className="font-medium">{results.technicalSpecs.cableSection} mm²</span>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-medium">Dispositivos de Proteção</h4>
                    <div className="space-y-2">
                      {results.technicalSpecs.protectionDevices.map((device, index) => (
                        <Badge key={index} variant="outline" className="block text-left">
                          {device}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Impacto Ambiental e Financeiro */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                    Impacto Financeiro
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Economia mensal:</span>
                    <span className="font-medium text-green-600">
                      R$ {results.financialSavings.monthly.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Economia anual:</span>
                    <span className="font-medium text-green-600">
                      R$ {results.financialSavings.annual.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Economia em 25 anos:</span>
                    <span className="font-medium text-green-600">
                      R$ {results.financialSavings.total25Years.toLocaleString()}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Sun className="h-5 w-5 text-green-600" />
                    Impacto Ambiental
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span>Redução CO₂/ano:</span>
                    <span className="font-medium text-green-600">
                      {results.co2Reduction.toLocaleString()} kg
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Equivale a:</span>
                    <span className="font-medium text-green-600">
                      {Math.round(results.co2Reduction / 22)} árvores plantadas
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cobertura do consumo:</span>
                    <span className="font-medium text-blue-600">
                      {results.capacity}%
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Alertas e Recomendações */}
            {(results.performanceRatio < 75 || results.capacity < 80) && (
              <Alert>
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Recomendações:</strong>
                  {results.performanceRatio < 75 && " Considere otimizar a orientação, inclinação ou reduzir sombreamento."}
                  {results.capacity < 80 && " O sistema pode estar subdimensionado. Considere adicionar mais painéis."}
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </div>
    </div>
  );
}