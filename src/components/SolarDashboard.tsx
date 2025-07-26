import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { ResponsiveText } from "@/components/ui/responsive-text";
import { useAuth } from "@/contexts/AuthContext";
import { SecurityAlert } from "./SecurityAlert";
import { useSecurityAudit } from "@/hooks/useSecurityAudit";
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
  Download,
  LogOut,
  User,
  CheckCircle,
  Building2,
  Upload,
  Bell,
  Monitor,
  ArrowLeft
} from "lucide-react";
import { LeadDataEntry } from "./LeadDataEntry";
import { ConsumptionCalculator } from "./ConsumptionCalculator";
import { TechnicalSimulation } from "./TechnicalSimulation";
import { FinancialAnalysis } from "./FinancialAnalysis";
import FinancialCalculator from "./FinancialCalculator";
import { ProposalGenerator } from "./ProposalGenerator";
import { SettingsModal } from "./SettingsModal";
import { SelectedLeadBreadcrumb } from "./SelectedLeadBreadcrumb";
import { DemoDataIndicator } from "./DemoDataIndicator";
import VersionDisplay from "./VersionDisplay";
import PDFImporter from "./PDFImporter";
import ExcelImporterV2 from "./ExcelImporterV2";
import FinancialInstitutionManager from "./FinancialInstitutionManager";
import { AuditLogViewer } from "./AuditLogViewer";
import { BackupManager } from "./BackupManager";
import NotificationCenter from "./NotificationCenter";
import { PerformanceMonitor } from "./PerformanceMonitor";
import { ReportsManager } from "./ReportsManager";
import { useNotifications } from "@/hooks/useNotifications";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface SolarDashboardProps {
  onBackToMenu?: () => void;
}

export function SolarDashboard({ onBackToMenu }: SolarDashboardProps = {}) {
  const [currentLead, setCurrentLead] = useState<Record<string, unknown> | null>(null);
  const [activeTab, setActiveTab] = useState(() => {
    // Configuração da aba padrão com persistência
    return localStorage.getItem('activeTab') || 'lead-data';
  });
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const { stats } = useNotifications();

  // Verificar se há um lead selecionado ao carregar o dashboard
  useEffect(() => {
    const savedLeadId = localStorage.getItem('selectedLeadId');
    if (savedLeadId && !currentLead) {
      loadSelectedLead(savedLeadId);
    }
  }, []);

  // Persistir a aba ativa no localStorage
  useEffect(() => {
    localStorage.setItem('activeTab', activeTab);
  }, [activeTab]);

  const loadSelectedLead = async (leadId: string) => {
    try {
      const { data: lead, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (error) throw error;
      if (lead) {
        setCurrentLead(lead);
      }
    } catch (error) {
      console.error('Error loading selected lead:', error);
      localStorage.removeItem('selectedLeadId');
    }
  };

  const handleClearLeadSelection = () => {
    setCurrentLead(null);
    localStorage.removeItem('selectedLeadId');
    setActiveTab("lead-data");
  };
  const { profile, company, signOut, hasPermission } = useAuth();
  const { logSuspiciousActivity } = useSecurityAudit();
  const navigate = useNavigate();

  const getAccessTypeLabel = (type: string) => {
    const labels = {
      vendedor: 'Vendedor',
      engenheiro: 'Engenheiro', 
      admin: 'Administrador',
      super_admin: 'Super Admin'
    };
    return labels[type as keyof typeof labels] || type;
  };

  const getAccessTypeVariant = (type: string) => {
    const variants = {
      vendedor: 'default',
      engenheiro: 'secondary',
      admin: 'outline',
      super_admin: 'destructive'
    };
    return (variants[type as keyof typeof variants] as 'default' | 'secondary' | 'outline' | 'destructive') || 'default';
  };

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
    { 
      id: "lead-data", 
      label: "Dados do Lead", 
      icon: Users, 
      description: "Importar e gerenciar dados dos leads",
      permission: "view_leads"
    },
    { 
      id: "consumption", 
      label: "Calculadora", 
      icon: Calculator, 
      description: "Calcular incremento de consumo",
      permission: null
    },
    { 
      id: "simulation", 
      label: "Simulação", 
      icon: Sun, 
      description: "Análise técnica do sistema",
      permission: "technical_simulations"
    },
    { 
      id: "financial", 
      label: "Financeiro", 
      icon: TrendingUp, 
      description: "Análise de retorno e financiamento",
      permission: null
    },
    { 
      id: "proposal", 
      label: "Proposta", 
      icon: FileText, 
      description: "Gerar proposta comercial",
      permission: "generate_proposals"
    },
    { 
      id: "management", 
      label: "Gerenciamento", 
      icon: Building2, 
      description: "Importação e gestão de dados",
      permission: "admin"
    }
  ].filter(tab => !tab.permission || hasPermission(tab.permission));

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {onBackToMenu && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onBackToMenu}
                  className="flex items-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">Voltar</span>
                </Button>
              )}
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
            
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="text-right hidden sm:block">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="font-medium">{profile?.name}</span>
                  <Badge variant={getAccessTypeVariant(profile?.access_type || '')}>
                    {getAccessTypeLabel(profile?.access_type || '')}
                  </Badge>
                </div>
                {company && (
                  <p className="text-sm text-muted-foreground">{company.name}</p>
                )}
              </div>
              
              {/* Mobile user info - simplified */}
              <div className="sm:hidden">
                <Badge variant={getAccessTypeVariant(profile?.access_type || '')}>
                  {profile?.name?.split(' ')[0]}
                </Badge>
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => navigate('/validation')}
                className="bg-green-50 hover:bg-green-100 border-green-200 text-green-700"
              >
                <CheckCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Validação</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsNotificationCenterOpen(true)}
                className="flex items-center gap-2 relative"
              >
                <Bell className="h-4 w-4" />
                <span className="hidden sm:inline">Notificações</span>
                {stats.unread > 0 && (
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs"
                  >
                    {stats.unread > 99 ? '99+' : stats.unread}
                  </Badge>
                )}
              </Button>
              <SettingsModal />
              <Button variant="outline" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sair</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Dashboard Stats */}
      <div className="container mx-auto px-4 py-6">
        <SecurityAlert onSecurityIssue={(issue) => logSuspiciousActivity('security_alert', { issue })} />
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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

        {/* Lead selecionado - breadcrumb global */}
        {currentLead && activeTab !== "lead-data" && (
          <SelectedLeadBreadcrumb 
            leadName={currentLead.name}
            onClearSelection={handleClearLeadSelection}
          />
        )}

        {/* Main Navigation Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <div className="bg-card rounded-lg p-4 shadow-card">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 bg-muted/50 h-auto gap-1">
              {navigationTabs.map((tab) => (
                <TabsTrigger 
                  key={tab.id} 
                  value={tab.id}
                  className="flex flex-col items-center gap-2 py-3 px-2 h-auto data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-solar"
                >
                  <tab.icon className="h-5 w-5" />
                  <div className="text-center">
                    <div className="font-medium text-sm">{tab.label}</div>
                    <ResponsiveText
                      text={tab.description}
                      maxWidth={100}
                      hideOnSmall={true}
                      breakLines={true}
                    />
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {/* Tab Contents */}
          {hasPermission('view_leads') && (
            <TabsContent value="lead-data">
              <LeadDataEntry currentLead={currentLead} onLeadUpdate={setCurrentLead} />
            </TabsContent>
          )}

          <TabsContent value="consumption">
            {!currentLead ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum lead selecionado</h3>
                  <p className="text-muted-foreground mb-4">
                    Selecione um lead na aba "Dados do Lead" para usar a calculadora
                  </p>
                  <Button onClick={() => setActiveTab("lead-data")}>
                    Ir para Dados do Lead
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <ConsumptionCalculator currentLead={currentLead} />
            )}
          </TabsContent>

          {hasPermission('technical_simulations') && (
            <TabsContent value="simulation">
              {!currentLead ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum lead selecionado</h3>
                    <p className="text-muted-foreground mb-4">
                      Selecione um lead na aba "Dados do Lead" para fazer a simulação
                    </p>
                    <Button onClick={() => setActiveTab("lead-data")}>
                      Ir para Dados do Lead
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <TechnicalSimulation currentLead={currentLead} />
              )}
            </TabsContent>
          )}

          <TabsContent value="financial">
            {!currentLead ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhum lead selecionado</h3>
                  <p className="text-muted-foreground mb-4">
                    Selecione um lead na aba "Dados do Lead" para fazer a análise financeira
                  </p>
                  <Button onClick={() => setActiveTab("lead-data")}>
                    Ir para Dados do Lead
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-6 w-6" />
                      Análise Financeira
                    </CardTitle>
                    <CardDescription>
                      Análise completa de viabilidade e opções de financiamento
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Tabs defaultValue="analysis" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="analysis" className="flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Análise de Viabilidade
                    </TabsTrigger>
                    <TabsTrigger value="financing" className="flex items-center gap-2">
                      <Calculator className="h-4 w-4" />
                      Simulador de Financiamento
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="analysis">
                    <FinancialAnalysis currentLead={currentLead} />
                  </TabsContent>

                  <TabsContent value="financing">
                    <FinancialCalculator currentLead={currentLead} />
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </TabsContent>

          {hasPermission('generate_proposals') && (
            <TabsContent value="proposal">
              {!currentLead ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhum lead selecionado</h3>
                    <p className="text-muted-foreground mb-4">
                      Selecione um lead na aba "Dados do Lead" para gerar uma proposta
                    </p>
                    <Button onClick={() => setActiveTab("lead-data")}>
                      Ir para Dados do Lead
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <ProposalGenerator currentLead={currentLead} />
              )}
            </TabsContent>
          )}

          {hasPermission('admin') && (
            <TabsContent value="management">
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-6 w-6" />
                      Gerenciamento de Dados
                    </CardTitle>
                    <CardDescription>
                      Ferramentas avançadas para importação e gestão de dados do sistema
                    </CardDescription>
                  </CardHeader>
                </Card>

                <Tabs defaultValue="pdf-import" className="space-y-4">
                  <TabsList className="grid w-full grid-cols-7">
                    <TabsTrigger value="pdf-import" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Importação PDF
                    </TabsTrigger>
                    <TabsTrigger value="excel-import" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Importação Excel
                    </TabsTrigger>
                    <TabsTrigger value="institutions" className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Instituições
                    </TabsTrigger>
                    <TabsTrigger value="audit-logs" className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      Logs de Auditoria
                    </TabsTrigger>
                    <TabsTrigger value="backup" className="flex items-center gap-2">
                      <Download className="h-4 w-4" />
                      Backup
                    </TabsTrigger>
                    <TabsTrigger value="performance" className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      Performance
                    </TabsTrigger>
                    <TabsTrigger value="reports" className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      Relatórios
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="pdf-import">
                    <PDFImporter />
                  </TabsContent>

                  <TabsContent value="excel-import">
                    <ExcelImporterV2 />
                  </TabsContent>

                  <TabsContent value="institutions">
                    <FinancialInstitutionManager />
                  </TabsContent>

                  <TabsContent value="audit-logs">
                    <AuditLogViewer />
                  </TabsContent>

                  <TabsContent value="backup">
                    <BackupManager />
                  </TabsContent>

                  <TabsContent value="performance">
                    <PerformanceMonitor />
                  </TabsContent>

                  <TabsContent value="reports">
                    <ReportsManager />
                  </TabsContent>
                </Tabs>
              </div>
            </TabsContent>
          )}
        </Tabs>
      </div>
      
      {/* Demo Data Indicator */}
      <DemoDataIndicator />
      
      {/* Version Display */}
      <div className="fixed bottom-4 left-4 z-40">
        <VersionDisplay />
      </div>
      
      {/* Notification Center */}
      <NotificationCenter
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
      />
    </div>
  );
}