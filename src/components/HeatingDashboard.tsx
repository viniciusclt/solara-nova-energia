import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { 
  ArrowLeft,
  Thermometer,
  Droplets,
  Home,
  Waves,
  Factory,
  Calculator,
  FileText,
  TrendingUp,
  Settings,
  BarChart3,
  Zap,
  Sun
} from "lucide-react";

interface HeatingDashboardProps {
  onBackToMenu: () => void;
}

export function HeatingDashboard({ onBackToMenu }: HeatingDashboardProps) {
  const [activeTab, setActiveTab] = useState("residential");
  const { hasPermission } = useAuth();

  const heatingStats = [
    {
      title: "Sistemas Instalados",
      value: "156",
      change: "+8%",
      icon: Thermometer,
      trend: "up"
    },
    {
      title: "Economia Mensal",
      value: "R$ 45k",
      change: "+12%",
      icon: TrendingUp,
      trend: "up"
    },
    {
      title: "Litros Aquecidos/Dia",
      value: "12.5k",
      change: "+15%",
      icon: Droplets,
      trend: "up"
    },
    {
      title: "CO₂ Evitado (ton)",
      value: "89.2",
      change: "+18%",
      icon: Sun,
      trend: "up"
    }
  ];

  const navigationTabs = [
    { 
      id: "residential", 
      label: "Residencial", 
      icon: Home, 
      description: "Aquecimento para banho residencial"
    },
    { 
      id: "pool", 
      label: "Piscinas", 
      icon: Waves, 
      description: "Aquecimento de piscinas"
    },
    { 
      id: "industrial", 
      label: "Industrial", 
      icon: Factory, 
      description: "Processos industriais"
    },
    { 
      id: "calculator", 
      label: "Calculadora", 
      icon: Calculator, 
      description: "Dimensionamento de sistemas"
    },
    { 
      id: "proposals", 
      label: "Propostas", 
      icon: FileText, 
      description: "Geração de propostas"
    },
    { 
      id: "management", 
      label: "Gestão", 
      icon: Settings, 
      description: "Configurações e relatórios"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onBackToMenu}
                className="mr-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">Voltar</span>
              </Button>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg shadow-lg">
                  <Thermometer className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-red-600 to-pink-600 bg-clip-text text-transparent">
                    Aquecimento Solar
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Soluções para Aquecimento de Água
                  </p>
                </div>
              </div>
            </div>
            
            <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
              Em Desenvolvimento
            </Badge>
          </div>
        </div>
      </header>

      {/* Dashboard Stats */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {heatingStats.map((stat, index) => (
            <Card key={index} className="shadow-card hover:shadow-lg transition-all duration-300">
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
                  <div className="p-3 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg shadow-lg">
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="bg-card rounded-lg p-4 shadow-card">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 bg-muted/50 h-auto gap-1">
              {navigationTabs.map((tab) => (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className="flex flex-col items-center gap-2 py-3 px-2 h-auto data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                >
                  <tab.icon className="h-5 w-5" />
                  <div className="text-center">
                    <div className="font-medium text-sm">{tab.label}</div>
                    <div className="text-xs text-muted-foreground hidden lg:block">
                      {tab.description}
                    </div>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Tab Contents */}
          <TabsContent value="residential">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-6 w-6" />
                  Aquecimento Residencial
                </CardTitle>
                <CardDescription>
                  Sistemas de aquecimento solar para uso doméstico
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Características do Sistema</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        Coletores solares de alta eficiência
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        Reservatórios térmicos isolados
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        Sistema de circulação forçada
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        Backup elétrico automático
                      </li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Benefícios</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-green-500" />
                        Redução de até 80% na conta de energia
                      </li>
                      <li className="flex items-center gap-2">
                        <Sun className="h-4 w-4 text-yellow-500" />
                        Energia limpa e renovável
                      </li>
                      <li className="flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-blue-500" />
                        Valorização do imóvel
                      </li>
                      <li className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-purple-500" />
                        ROI em 2-4 anos
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <p className="text-center text-muted-foreground">
                    🚧 <strong>Em Desenvolvimento:</strong> Funcionalidades de dimensionamento e cálculo em breve!
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="pool">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Waves className="h-6 w-6" />
                  Aquecimento de Piscinas
                </CardTitle>
                <CardDescription>
                  Sistemas especializados para aquecimento de piscinas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Tipos de Sistema</h3>
                    <div className="space-y-3">
                      <div className="p-3 border rounded-lg">
                        <h4 className="font-medium">Coletores Flexíveis</h4>
                        <p className="text-sm text-muted-foreground">Ideal para piscinas residenciais</p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <h4 className="font-medium">Coletores Rígidos</h4>
                        <p className="text-sm text-muted-foreground">Para piscinas comerciais e clubes</p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <h4 className="font-medium">Sistema Híbrido</h4>
                        <p className="text-sm text-muted-foreground">Combinação solar + bomba de calor</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Dimensionamento</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Área de coletores:</span>
                        <span className="font-medium">50-80% da área da piscina</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Temperatura ideal:</span>
                        <span className="font-medium">26-28°C</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Período de uso:</span>
                        <span className="font-medium">Março a Outubro</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Economia anual:</span>
                        <span className="font-medium text-green-600">R$ 3.000 - R$ 8.000</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <p className="text-center text-muted-foreground">
                    🚧 <strong>Em Desenvolvimento:</strong> Calculadora de dimensionamento para piscinas em breve!
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="industrial">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Factory className="h-6 w-6" />
                  Aquecimento Industrial
                </CardTitle>
                <CardDescription>
                  Soluções para processos industriais e grandes volumes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Aplicações</h3>
                    <ul className="space-y-2 text-sm">
                      <li>• Lavanderias industriais</li>
                      <li>• Hotéis e pousadas</li>
                      <li>• Hospitais e clínicas</li>
                      <li>• Indústria alimentícia</li>
                      <li>• Processos de limpeza</li>
                      <li>• Aquicultura</li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Tecnologias</h3>
                    <ul className="space-y-2 text-sm">
                      <li>• Coletores de tubos evacuados</li>
                      <li>• Concentradores parabólicos</li>
                      <li>• Sistemas de circulação forçada</li>
                      <li>• Trocadores de calor</li>
                      <li>• Controle automático</li>
                      <li>• Monitoramento remoto</li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Benefícios</h3>
                    <ul className="space-y-2 text-sm">
                      <li>• Redução de custos operacionais</li>
                      <li>• Sustentabilidade ambiental</li>
                      <li>• Independência energética</li>
                      <li>• Incentivos fiscais</li>
                      <li>• Certificação ambiental</li>
                      <li>• ROI atrativo</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <p className="text-center text-muted-foreground">
                    🚧 <strong>Em Desenvolvimento:</strong> Módulo completo para dimensionamento industrial em breve!
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="calculator">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-6 w-6" />
                  Calculadora de Dimensionamento
                </CardTitle>
                <CardDescription>
                  Ferramenta para cálculo de sistemas de aquecimento solar
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Calculator className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Calculadora em Desenvolvimento</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Estamos desenvolvendo uma calculadora avançada para dimensionamento de sistemas de aquecimento solar.
                  </p>
                  <div className="bg-muted/50 rounded-lg p-6 max-w-md mx-auto">
                    <h4 className="font-semibold mb-3">Funcionalidades Previstas:</h4>
                    <ul className="text-sm space-y-1 text-left">
                      <li>• Cálculo de área de coletores</li>
                      <li>• Dimensionamento de reservatórios</li>
                      <li>• Análise de viabilidade econômica</li>
                      <li>• Simulação de economia</li>
                      <li>• Relatórios técnicos</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="proposals">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-6 w-6" />
                  Geração de Propostas
                </CardTitle>
                <CardDescription>
                  Criação de propostas comerciais para sistemas de aquecimento
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Gerador de Propostas em Desenvolvimento</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Em breve você poderá gerar propostas profissionais para sistemas de aquecimento solar.
                  </p>
                  <div className="bg-muted/50 rounded-lg p-6 max-w-md mx-auto">
                    <h4 className="font-semibold mb-3">Recursos Planejados:</h4>
                    <ul className="text-sm space-y-1 text-left">
                      <li>• Templates personalizáveis</li>
                      <li>• Cálculos automáticos</li>
                      <li>• Gráficos e diagramas</li>
                      <li>• Análise de ROI</li>
                      <li>• Exportação em PDF</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="management">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-6 w-6" />
                  Gestão e Configurações
                </CardTitle>
                <CardDescription>
                  Configurações do sistema e relatórios gerenciais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Settings className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Módulo de Gestão em Desenvolvimento</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Ferramentas avançadas de gestão e relatórios estarão disponíveis em breve.
                  </p>
                  <div className="bg-muted/50 rounded-lg p-6 max-w-md mx-auto">
                    <h4 className="font-semibold mb-3">Funcionalidades Previstas:</h4>
                    <ul className="text-sm space-y-1 text-left">
                      <li>• Cadastro de equipamentos</li>
                      <li>• Relatórios de vendas</li>
                      <li>• Dashboard gerencial</li>
                      <li>• Configurações do sistema</li>
                      <li>• Backup e restauração</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}