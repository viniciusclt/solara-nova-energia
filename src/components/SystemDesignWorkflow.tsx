import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  ArrowLeft,
  Settings,
  Calculator,
  CheckCircle,
  ArrowRight,
  Zap,
  Info
} from 'lucide-react';

import { EquipmentConfiguration } from './EquipmentConfiguration';
import { TechnicalSimulationNew } from './TechnicalSimulationNew';

interface Equipment {
  id: string;
  type: string;
  name: string;
  power: number;
  hoursPerDay: number;
  daysPerMonth: number;
  monthsPerYear: number;
  consumptionKwhMonth: number;
  consumptionKwhYear: number;
}

interface SimulationResults {
  systemPower: number;
  annualGeneration: number;
  monthlyGeneration: number[];
  performanceRatio: number;
  capacity: number;
  payback: number;
  co2Reduction: number;
  financialSavings: {
    monthly: number;
    annual: number;
    total25Years: number;
  };
}

interface SystemDesignWorkflowProps {
  onBackToMenu?: () => void;
}

export function SystemDesignWorkflow({ onBackToMenu }: SystemDesignWorkflowProps) {
  const [activeStep, setActiveStep] = useState('equipment');
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [totalConsumption, setTotalConsumption] = useState({ monthly: 0, yearly: 0 });
  const [simulationResults, setSimulationResults] = useState<SimulationResults | null>(null);
  const [isEquipmentConfigured, setIsEquipmentConfigured] = useState(false);
  const [isSimulationComplete, setIsSimulationComplete] = useState(false);

  const handleEquipmentChange = (equipment: Equipment[], consumption: { monthly: number; yearly: number }) => {
    setEquipmentList(equipment);
    setTotalConsumption(consumption);
    setIsEquipmentConfigured(equipment.length > 0);
  };

  const handleSimulationResults = (results: SimulationResults) => {
    setSimulationResults(results);
    setIsSimulationComplete(true);
  };

  const getStepStatus = (step: string) => {
    switch (step) {
      case 'equipment':
        return isEquipmentConfigured ? 'completed' : activeStep === 'equipment' ? 'active' : 'pending';
      case 'simulation':
        return isSimulationComplete ? 'completed' : activeStep === 'simulation' ? 'active' : 'pending';
      default:
        return 'pending';
    }
  };

  const getProgressPercentage = () => {
    if (isSimulationComplete) return 100;
    if (isEquipmentConfigured) return 50;
    return 0;
  };

  const steps = [
    {
      id: 'equipment',
      title: 'Configuração de Equipamentos',
      description: 'Configure os equipamentos do sistema',
      icon: Settings
    },
    {
      id: 'simulation',
      title: 'Simulação Técnica',
      description: 'Configure os parâmetros do sistema fotovoltaico',
      icon: Calculator
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/90 backdrop-blur-md sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {onBackToMenu && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onBackToMenu}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar ao Menu
                </Button>
              )}
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg shadow-lg">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Design do Sistema Solar
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Configure equipamentos e execute simulação técnica
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm font-medium">Progresso</div>
                <div className="text-xs text-muted-foreground">{getProgressPercentage()}% concluído</div>
              </div>
              <div className="w-24">
                <Progress value={getProgressPercentage()} className="h-2" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Steps Navigation */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Fluxo de Trabalho</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              {steps.map((step, index) => {
                const IconComponent = step.icon;
                const status = getStepStatus(step.id);
                
                return (
                  <React.Fragment key={step.id}>
                    <div 
                      className={`flex items-center gap-3 cursor-pointer transition-all duration-200 ${
                        status === 'active' ? 'scale-105' : ''
                      }`}
                      onClick={() => setActiveStep(step.id)}
                    >
                      <div className={`p-3 rounded-full border-2 transition-all duration-200 ${
                        status === 'completed' 
                          ? 'bg-green-500 border-green-500 text-white' 
                          : status === 'active'
                          ? 'bg-primary border-primary text-white'
                          : 'bg-muted border-muted-foreground/30 text-muted-foreground'
                      }`}>
                        {status === 'completed' ? (
                          <CheckCircle className="h-5 w-5" />
                        ) : (
                          <IconComponent className="h-5 w-5" />
                        )}
                      </div>
                      <div className="text-left">
                        <div className={`font-medium ${
                          status === 'active' ? 'text-primary' : status === 'completed' ? 'text-green-600' : 'text-muted-foreground'
                        }`}>
                          {step.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {step.description}
                        </div>
                      </div>
                    </div>
                    
                    {index < steps.length - 1 && (
                      <ArrowRight className={`h-5 w-5 ${
                        getStepStatus(steps[index + 1].id) === 'completed' || getStepStatus(steps[index + 1].id) === 'active'
                          ? 'text-primary' 
                          : 'text-muted-foreground'
                      }`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        {(isEquipmentConfigured || isSimulationComplete) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {/* Equipamentos Configurados */}
            {isEquipmentConfigured && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">{equipmentList.length}</div>
                      <div className="text-xs text-muted-foreground">Equipamentos</div>
                    </div>
                    <Settings className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Consumo Total */}
            {isEquipmentConfigured && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">{totalConsumption.yearly.toFixed(0)}</div>
                      <div className="text-xs text-muted-foreground">kWh/ano</div>
                    </div>
                    <Zap className="h-8 w-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Potência do Sistema */}
            {isSimulationComplete && simulationResults && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">{simulationResults.systemPower}</div>
                      <div className="text-xs text-muted-foreground">kWp</div>
                    </div>
                    <Calculator className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Payback */}
            {isSimulationComplete && simulationResults && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-2xl font-bold">{simulationResults.payback}</div>
                      <div className="text-xs text-muted-foreground">anos</div>
                    </div>
                    <CheckCircle className="h-8 w-8 text-purple-500" />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {/* Main Content */}
        <Tabs value={activeStep} onValueChange={setActiveStep} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="equipment" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuração de Equipamentos
              {isEquipmentConfigured && <CheckCircle className="h-4 w-4 text-green-500" />}
            </TabsTrigger>
            <TabsTrigger 
              value="simulation" 
              className="flex items-center gap-2"
              disabled={!isEquipmentConfigured}
            >
              <Calculator className="h-4 w-4" />
              Simulação Técnica
              {isSimulationComplete && <CheckCircle className="h-4 w-4 text-green-500" />}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="equipment" className="space-y-6">
            {!isEquipmentConfigured && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Configure pelo menos um equipamento para prosseguir para a simulação técnica.
                </AlertDescription>
              </Alert>
            )}
            
            <EquipmentConfiguration onEquipmentChange={handleEquipmentChange} />
            
            {isEquipmentConfigured && (
              <div className="flex justify-end">
                <Button 
                  onClick={() => setActiveStep('simulation')}
                  className="flex items-center gap-2"
                >
                  Próximo: Simulação Técnica
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="simulation" className="space-y-6">
            {!isEquipmentConfigured && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertDescription>
                  Configure os equipamentos primeiro antes de executar a simulação técnica.
                </AlertDescription>
              </Alert>
            )}
            
            {isEquipmentConfigured && (
              <>
                {/* Resumo dos Equipamentos */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Settings className="h-5 w-5" />
                      Resumo dos Equipamentos Configurados
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{equipmentList.length}</div>
                        <div className="text-sm text-muted-foreground">Equipamentos</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">{totalConsumption.monthly.toFixed(1)} kWh</div>
                        <div className="text-sm text-muted-foreground">Consumo Mensal</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{totalConsumption.yearly.toFixed(0)} kWh</div>
                        <div className="text-sm text-muted-foreground">Consumo Anual</div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      {equipmentList.slice(0, 3).map((equipment) => (
                        <div key={equipment.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">{equipment.type}</Badge>
                            <span>{equipment.name}</span>
                          </div>
                          <span className="text-muted-foreground">{equipment.consumptionKwhYear} kWh/ano</span>
                        </div>
                      ))}
                      {equipmentList.length > 3 && (
                        <div className="text-xs text-muted-foreground text-center">
                          +{equipmentList.length - 3} equipamentos adicionais
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
                
                <TechnicalSimulationNew onResultsChange={handleSimulationResults} />
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}