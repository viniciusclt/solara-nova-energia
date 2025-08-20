import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { 
  ArrowLeft,
  Zap,
  Car,
  Home,
  Building,
  Calculator,
  FileText,
  TrendingUp,
  Settings,
  Battery,
  Plug
} from "lucide-react";

interface WallboxDashboardProps {
  onBackToMenu: () => void;
}

export function WallboxDashboard({ onBackToMenu }: WallboxDashboardProps) {
  const [activeTab, setActiveTab] = useState("residential");
  const { hasPermission } = useAuth();

  const wallboxStats = [
    { icon: Zap, label: "Potência", value: "7-22 kW", color: "text-blue-600" },
    { icon: Battery, label: "Eficiência", value: "95%+", color: "text-green-600" },
    { icon: Car, label: "Compatibilidade", value: "Tipo 2", color: "text-purple-600" },
    { icon: Plug, label: "Instalações", value: "500+", color: "text-orange-600" }
  ];

  const tabsData = [
    {
      value: "residential",
      label: "Residencial",
      icon: Home,
      description: "Carregadores para residências"
    },
    {
      value: "commercial",
      label: "Comercial",
      icon: Building,
      description: "Soluções para empresas"
    },
    {
      value: "calculator",
      label: "Calculadora",
      icon: Calculator,
      description: "Dimensionamento"
    },
    {
      value: "proposals",
      label: "Propostas",
      icon: FileText, 
      description: "Geração de propostas"
    },
    {
      value: "reports",
      label: "Relatórios",
      icon: TrendingUp,
      description: "Análises e relatórios"
    },
    {
      value: "settings",
      label: "Configurações",
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
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={onBackToMenu}
                className="hover:bg-muted/50"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Menu
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    WallBox - Carregadores Elétricos
                  </h1>
                  <p className="text-sm text-muted-foreground">Soluções completas para carregamento de veículos elétricos</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Stats Cards */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {wallboxStats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-all duration-300 border-0 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
                      <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                    </div>
                    <Icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Tab Navigation */}
          <div className="bg-card/50 backdrop-blur-sm rounded-lg p-2 border">
            <TabsList className="grid w-full grid-cols-6 bg-transparent gap-1">
              {tabsData.map((tab) => {
                const Icon = tab.icon;
                return (
                  <TabsTrigger 
                    key={tab.value} 
                    value={tab.value} 
                    className="flex flex-col items-center gap-2 p-4 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-md transition-all"
                  >
                    <Icon className="h-5 w-5" />
                    <div className="text-center">
                      <div className="font-medium text-sm">{tab.label}</div>
                      <div className="text-xs opacity-70 hidden lg:block">{tab.description}</div>
                    </div>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          {/* Tab Contents */}
          <TabsContent value="residential">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Home className="h-6 w-6" />
                  Carregadores Residenciais
                </CardTitle>
                <CardDescription>
                  Soluções para carregamento doméstico de veículos elétricos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Tipos de Carregadores</h3>
                    <div className="grid gap-3">
                      <div className="p-3 border rounded-lg">
                        <h4 className="font-medium">WallBox 7kW</h4>
                        <p className="text-sm text-muted-foreground">Carregamento padrão residencial</p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <h4 className="font-medium">WallBox 11kW</h4>
                        <p className="text-sm text-muted-foreground">Carregamento rápido trifásico</p>
                      </div>
                      <div className="p-3 border rounded-lg">
                        <h4 className="font-medium">WallBox 22kW</h4>
                        <p className="text-sm text-muted-foreground">Carregamento ultra-rápido</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Características</h3>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        Conectividade Wi-Fi
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        App de controle
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        Proteção IP54
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        Cabo Tipo 2 integrado
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-primary rounded-full" />
                        Controle de acesso RFID
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <p className="text-center text-muted-foreground">
                    🚧 <strong>Em Desenvolvimento:</strong> Funcionalidades de dimensionamento e instalação em breve!
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="commercial">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-6 w-6" />
                  Carregadores Comerciais
                </CardTitle>
                <CardDescription>
                  Soluções para empresas, condomínios e espaços públicos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Aplicações</h3>
                    <ul className="space-y-2 text-sm">
                      <li>• Condomínios residenciais</li>
                      <li>• Empresas e escritórios</li>
                      <li>• Shopping centers</li>
                      <li>• Hotéis e pousadas</li>
                      <li>• Postos de combustível</li>
                      <li>• Estacionamentos públicos</li>
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Recursos Avançados</h3>
                    <ul className="space-y-2 text-sm">
                      <li>• Gerenciamento de energia</li>
                      <li>• Balanceamento de carga</li>
                      <li>• Sistema de cobrança</li>
                      <li>• Monitoramento remoto</li>
                      <li>• Relatórios de uso</li>
                      <li>• Integração com tarifação</li>
                    </ul>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <p className="text-center text-muted-foreground">
                    🚧 <strong>Em Desenvolvimento:</strong> Módulo completo para soluções comerciais em breve!
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
                  Ferramenta para dimensionamento de carregadores
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Calculator className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Calculadora em Desenvolvimento</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Em breve você terá acesso a uma calculadora completa para dimensionamento.
                  </p>
                  <div className="bg-muted/50 rounded-lg p-6 max-w-md mx-auto">
                    <h4 className="font-semibold mb-3">Recursos Planejados:</h4>
                    <ul className="text-sm space-y-1 text-left">
                      <li>• Cálculo de potência necessária</li>
                      <li>• Dimensionamento elétrico</li>
                      <li>• Análise de viabilidade</li>
                      <li>• Simulação de custos</li>
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
                  Criação automática de propostas comerciais
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Gerador de Propostas em Desenvolvimento</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Em breve você poderá gerar propostas profissionais automaticamente.
                  </p>
                  <div className="bg-muted/50 rounded-lg p-6 max-w-md mx-auto">
                    <h4 className="font-semibold mb-3">Recursos Planejados:</h4>
                    <ul className="text-sm space-y-1 text-left">
                      <li>• Templates personalizáveis</li>
                      <li>• Cálculos automáticos</li>
                      <li>• Integração com CRM</li>
                      <li>• Assinatura digital</li>
                      <li>• Envio automático</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-6 w-6" />
                  Relatórios e Análises
                </CardTitle>
                <CardDescription>
                  Dashboards e relatórios de performance
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <TrendingUp className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Sistema de Relatórios em Desenvolvimento</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Em breve você terá acesso a relatórios detalhados e análises.
                  </p>
                  <div className="bg-muted/50 rounded-lg p-6 max-w-md mx-auto">
                    <h4 className="font-semibold mb-3">Recursos Planejados:</h4>
                    <ul className="text-sm space-y-1 text-left">
                      <li>• Dashboard de vendas</li>
                      <li>• Análise de performance</li>
                      <li>• Relatórios financeiros</li>
                      <li>• Métricas de uso</li>
                      <li>• Exportação de dados</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-6 w-6" />
                  Configurações
                </CardTitle>
                <CardDescription>
                  Configurações do sistema e preferências
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Settings className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Painel de Configurações em Desenvolvimento</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Em breve você terá acesso a um painel completo de configurações.
                  </p>
                  <div className="bg-muted/50 rounded-lg p-6 max-w-md mx-auto">
                    <h4 className="font-semibold mb-3">Funcionalidades Previstas:</h4>
                    <ul className="text-sm space-y-1 text-left">
                      <li>• Cadastro de equipamentos</li>
                      <li>• Configurações de rede</li>
                      <li>• Gerenciamento de usuários</li>
                      <li>• Configurações de tarifação</li>
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