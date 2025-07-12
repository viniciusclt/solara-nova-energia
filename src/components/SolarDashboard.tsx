import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Sun, 
  Calculator, 
  Database, 
  FileText, 
  TrendingUp, 
  Zap,
  Users,
  BarChart3,
  Settings,
  Download
} from "lucide-react";
import { LeadDataEntry } from "./LeadDataEntry";
import { ConsumptionCalculator } from "./ConsumptionCalculator";
import { TechnicalSimulation } from "./TechnicalSimulation";
import { FinancialAnalysis } from "./FinancialAnalysis";
import { ProposalGenerator } from "./ProposalGenerator";

export function SolarDashboard() {
  const [currentLead, setCurrentLead] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("lead-data");

  const dashboardStats = [
    {
      title: "Propostas Geradas",
      value: "47",
      change: "+12%",
      icon: FileText,
      trend: "up"
    },
    {
      title: "Taxa de Conversão",
      value: "68%",
      change: "+5%",
      icon: TrendingUp,
      trend: "up"
    },
    {
      title: "Potência Total",
      value: "2.4 MW",
      change: "+18%",
      icon: Zap,
      trend: "up"
    },
    {
      title: "Economia Estimada",
      value: "R$ 1.2M",
      change: "+23%",
      icon: BarChart3,
      trend: "up"
    }
  ];

  const navigationTabs = [
    { id: "lead-data", label: "Dados do Lead", icon: Users, description: "Importar e gerenciar dados dos leads" },
    { id: "consumption", label: "Calculadora", icon: Calculator, description: "Calcular incremento de consumo" },
    { id: "simulation", label: "Simulação", icon: Sun, description: "Análise técnica do sistema" },
    { id: "financial", label: "Financeiro", icon: TrendingUp, description: "Análise de retorno e financiamento" },
    { id: "proposal", label: "Proposta", icon: FileText, description: "Gerar proposta comercial" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-solar rounded-lg shadow-glow">
                  <Sun className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-solar bg-clip-text text-transparent">
                    SolarCalc Pro
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Sistema de Gestão para Energia Solar
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4" />
                Configurações
              </Button>
              <Button variant="gradient" size="sm">
                <Download className="h-4 w-4" />
                Exportar Dados
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Stats */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {dashboardStats.map((stat, index) => (
            <Card key={index} className="shadow-card hover:shadow-solar transition-smooth">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-3xl font-bold text-foreground">
                      {stat.value}
                    </p>
                    <Badge 
                      variant={stat.trend === "up" ? "default" : "secondary"}
                      className="mt-1 bg-success/10 text-success border-success/20"
                    >
                      {stat.change}
                    </Badge>
                  </div>
                  <div className="p-3 bg-gradient-solar rounded-lg shadow-glow">
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="bg-card rounded-lg p-6 shadow-card">
            <TabsList className="grid w-full grid-cols-5 bg-muted/50">
              {navigationTabs.map((tab) => (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className="flex flex-col items-center gap-2 py-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-solar"
                >
                  <tab.icon className="h-5 w-5" />
                  <div className="text-center">
                    <div className="font-medium text-sm">{tab.label}</div>
                    <div className="text-xs text-muted-foreground hidden sm:block">
                      {tab.description}
                    </div>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Tab Contents */}
          <TabsContent value="lead-data">
            <LeadDataEntry currentLead={currentLead} onLeadUpdate={setCurrentLead} />
          </TabsContent>

          <TabsContent value="consumption">
            <ConsumptionCalculator currentLead={currentLead} />
          </TabsContent>

          <TabsContent value="simulation">
            <TechnicalSimulation currentLead={currentLead} />
          </TabsContent>

          <TabsContent value="financial">
            <FinancialAnalysis currentLead={currentLead} />
          </TabsContent>

          <TabsContent value="proposal">
            <ProposalGenerator currentLead={currentLead} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}