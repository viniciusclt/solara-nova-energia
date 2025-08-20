import React, { useState } from 'react';
import { ArrowLeft, ArrowRight, Sun, Users, Settings, Calculator, TrendingUp, FileText, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import LeadManager from '@/components/LeadManager';
// Removidos imports não utilizados para evitar dead code
// import { LeadSearchDropdown } from '@/components/LeadSearchDropdown';
// import { LeadDetailsCard } from '@/components/LeadDetailsCard';
import { LeadTablePage } from '@/components/LeadTablePage';
// Removidos componentes antigos para evitar duplicação e imports não usados
// import { EquipmentManagementPage } from '@/pages/EquipmentManagementPage';
// import { ConsumptionCalculator } from '@/components/ConsumptionCalculator';
// import { TechnicalSimulation } from '@/components/TechnicalSimulation';
import { FinancialAnalysis } from '@/components/FinancialAnalysis';
// Novos componentes padronizados conforme plano aprovado
import { EquipmentConfiguration } from '@/components/EquipmentConfiguration';
import { TechnicalSimulationNew } from '@/components/TechnicalSimulationNew';
import { useSimulationData } from '@/stores/simulationStore';

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  cpf?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  concessionaria?: string;
  grupo?: string;
  subgrupo?: string;
  averageConsumption?: number;
  monthlyConsumption?: number[];
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface WorkflowStep {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  required: boolean;
}

interface SolarWorkflowPageProps {
  onBack?: () => void;
}

export function SolarWorkflowPage({ onBack }: SolarWorkflowPageProps) {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [showTableView, setShowTableView] = useState(false);
  const { updateSimulation } = useSimulationData();
  const [equipmentState, setEquipmentState] = useState<{
    list: Array<{
      id: string;
      type: string;
      name: string;
      power: number;
      hoursPerDay: number;
      daysPerMonth: number;
      monthsPerYear: number;
      consumptionKwhMonth: number;
      consumptionKwhYear: number;
    }>;
    total: { monthly: number; yearly: number };
  }>({ list: [], total: { monthly: 0, yearly: 0 } });

  const steps: WorkflowStep[] = [
    {
      id: 'lead-selection',
      title: 'Seleção de Lead',
      description: 'Escolha o cliente para criar a proposta',
      icon: Users,
      required: true
    },
    {
      id: 'equipment-config',
      title: 'Configuração de Equipamentos',
      description: 'Configure os equipamentos do sistema',
      icon: Settings,
      required: true
    },
    {
      id: 'technical-simulation',
      title: 'Simulação Técnica',
      description: 'Execute simulações técnicas do sistema',
      icon: Calculator,
      required: true
    },
    {
      id: 'financial-analysis',
      title: 'Análise Financeira',
      description: 'Analise a viabilidade financeira',
      icon: TrendingUp,
      required: true
    },
    {
      id: 'proposal-generation',
      title: 'Geração de Proposta',
      description: 'Gere a proposta final',
      icon: FileText,
      required: true
    }
  ];

  const getStepStatus = (stepIndex: number): 'completed' | 'current' | 'pending' => {
    if (completedSteps.has(stepIndex)) return 'completed';
    if (stepIndex === currentStep) return 'current';
    return 'pending';
  };

  const getProgressPercentage = (): number => {
    return (completedSteps.size / steps.length) * 100;
  };

  const handleStepChange = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const handleStepComplete = () => {
    setCompletedSteps(prev => new Set([...prev, currentStep]));
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const markStepCompleted = (stepIndex: number) => {
    setCompletedSteps(prev => new Set([...prev, stepIndex]));
  };

  const renderStepContent = () => {
    const currentStepData = steps[currentStep];
    
    switch (currentStepData.id) {
      case 'lead-selection':
        return (
          <div className="space-y-6">
            <LeadManager 
              onLeadSelect={(lead) => {
                setSelectedLead(lead);
                toast({
                  title: "Cliente selecionado!",
                  description: `${lead.name || 'Cliente'} foi selecionado com sucesso. Revise as informações antes de continuar.`
                });
                // Marcar etapa como completa quando lead for selecionado, mas não avançar automaticamente
                if (lead && !completedSteps.has(0)) {
                  setCompletedSteps(prev => new Set([...prev, 0]));
                }
              }}
              selectedLead={selectedLead}
              className="w-full"
            />
          </div>
        );

      case 'equipment-config':
        return (
          <div className="space-y-6">
            <EquipmentConfiguration 
              onEquipmentChange={(equipment, total) => {
                setEquipmentState({ list: equipment, total });
                if (equipment.length > 0) {
                  // Marcar etapa de equipamentos como concluída
                  const equipmentStepIndex = steps.findIndex(s => s.id === 'equipment-config');
                  if (equipmentStepIndex !== -1 && !completedSteps.has(equipmentStepIndex)) {
                    markStepCompleted(equipmentStepIndex);
                  }
                }
              }}
            />
          </div>
        );

      case 'technical-simulation':
        return (
          <div className="space-y-6">
            <TechnicalSimulationNew 
              onResultsChange={(results) => {
                // Persistir resultados básicos na simulationStore
                const avgMonthly = results.monthlyGeneration && results.monthlyGeneration.length
                  ? results.monthlyGeneration.reduce((a, b) => a + b, 0) / results.monthlyGeneration.length
                  : 0;
                updateSimulation({
                  potencia_sistema_kwp: results.systemPower,
                  geracao_anual_kwh: results.annualGeneration,
                  geracao_mensal_media: Math.round(avgMonthly * 100) / 100,
                  performance_ratio: results.performanceRatio,
                  // Campos complementares poderão ser atualizados em etapas seguintes
                  updated_at: new Date().toISOString()
                });
                // Marcar etapa de simulação como concluída
                const simStepIndex = steps.findIndex(s => s.id === 'technical-simulation');
                if (simStepIndex !== -1 && !completedSteps.has(simStepIndex)) {
                  markStepCompleted(simStepIndex);
                }
              }}
            />
          </div>
        );

      case 'financial-analysis':
        return (
          <div className="space-y-6">
            <FinancialAnalysis />
          </div>
        );

      case 'proposal-generation':
        return (
          <div className="space-y-6">
            <div className="text-center p-8 border-2 border-dashed border-green-200 rounded-lg bg-green-50">
              <FileText className="h-12 w-12 mx-auto mb-4 text-green-600" />
              <h4 className="text-lg font-semibold mb-2 text-green-800">Geração de Proposta</h4>
              <p className="text-green-700 mb-4">
                Todos os dados foram coletados. Gere sua proposta personalizada.
              </p>
              <div className="flex gap-4 justify-center">
                <Button className="bg-green-600 hover:bg-green-700">
                  Gerar Proposta PDF
                </Button>
                <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                  Visualizar Prévia
                </Button>
                <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50">
                  Exportar
                </Button>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-center p-8">
            <h4 className="text-lg font-semibold mb-2">{currentStepData.title}</h4>
            <p className="text-muted-foreground">
              Componente será integrado em breve
            </p>
          </div>
        );
    }
  };

  // Se showTableView for true, renderiza apenas a tabela
  if (showTableView) {
    return (
      <LeadTablePage
        onLeadSelect={(lead) => {
          setSelectedLead(lead.name || lead.id);
          setShowTableView(false);
          toast({
            title: "Cliente selecionado!",
            description: `${lead.name || 'Cliente'} foi selecionado com sucesso.`
          });
        }}
        selectedLeadId={null}
        onNewLead={() => {
          toast({
            title: "Novo Lead",
            description: "Funcionalidade de novo lead será implementada em breve."
          });
        }}
        onBack={() => setShowTableView(false)}
        showActions={true}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {onBack && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBack}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
              )}
              <div className="flex items-center gap-2">
                <div className="p-2 bg-orange-500 rounded-lg">
                  <Sun className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-orange-600">
                    Módulo Fotovoltaico
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Workflow de Criação de Propostas
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium">Progresso</p>
                <p className="text-xs text-muted-foreground">
                  {completedSteps.size} de {steps.length} etapas
                </p>
              </div>
              <div className="w-24">
                <Progress value={getProgressPercentage()} className="h-2" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">Etapas do Processo</CardTitle>
                <CardDescription>
                  Siga as etapas para criar uma proposta completa
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {steps.map((step, index) => {
                  const status = getStepStatus(index);
                  const isClickable = index <= currentStep || completedSteps.has(currentStep);
                  const IconComponent = step.icon;
                  
                  return (
                    <div key={step.id}>
                      <Button
                        variant={status === 'current' ? 'default' : status === 'completed' ? 'secondary' : 'ghost'}
                        className={`w-full justify-start h-auto p-4 ${
                          isClickable ? 'cursor-pointer' : 'cursor-not-allowed opacity-50'
                        }`}
                        onClick={() => isClickable && handleStepChange(index)}
                        disabled={!isClickable}
                      >
                        <div className="flex items-center gap-3 w-full">
                          <div className={`p-2 rounded-lg ${
                            status === 'completed' ? 'bg-green-100 text-green-600' :
                            status === 'current' ? 'bg-primary/10 text-primary' :
                            'bg-muted text-muted-foreground'
                          }`}>
                            {status === 'completed' ? (
                              <CheckCircle className="h-4 w-4" />
                            ) : (
                              <IconComponent className="h-4 w-4" />
                            )}
                          </div>
                          <div className="flex-1 text-left">
                            <p className="font-medium text-sm">{step.title}</p>
                            <p className="text-xs text-muted-foreground">
                              {step.description}
                            </p>
                          </div>
                          {step.required && (
                            <Badge variant="outline" className="text-xs">
                              Obrigatório
                            </Badge>
                          )}
                        </div>
                      </Button>
                      {index < steps.length - 1 && (
                        <Separator className="my-2" />
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-3">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {React.createElement(steps[currentStep].icon, { className: "h-5 w-5" })}
                      {steps[currentStep].title}
                    </CardTitle>
                    <CardDescription>
                      {steps[currentStep].description}
                    </CardDescription>
                  </div>
                  <Badge variant={getStepStatus(currentStep) === 'completed' ? 'default' : 'secondary'}>
                    Etapa {currentStep + 1} de {steps.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {renderStepContent()}
                
                <div className="flex justify-between mt-8 pt-6 border-t">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                    disabled={currentStep === 0}
                    className="flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Anterior
                  </Button>
                  
                  <div className="flex gap-2">
                    {currentStep < steps.length - 1 && (
                      <Button
                        onClick={handleStepComplete}
                        className="flex items-center gap-2"
                      >
                        Próxima
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {currentStep === steps.length - 1 && (
                      <Button
                        onClick={() => {
                          handleStepComplete();
                          toast({
                            title: "Proposta Finalizada!",
                            description: "Sua proposta foi criada com sucesso."
                          });
                        }}
                        className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Finalizar Proposta
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SolarWorkflowPage;