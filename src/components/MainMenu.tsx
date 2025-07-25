import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Zap,
  Thermometer,
  GraduationCap,
  Sun,
  Droplets,
  BookOpen,
  ArrowRight,
  Users,
  TrendingUp,
  Award,
  LogOut,
  User,
  CheckCircle,
  Bell
} from "lucide-react";

// Import dos dashboards específicos
import { SolarDashboard } from "./SolarDashboard";
import { HeatingDashboard } from "./HeatingDashboard";
import { TrainingDashboard } from "./TrainingDashboard";
import { SettingsModal } from "./SettingsModal";
import NotificationCenter from "./NotificationCenter";
import { useNotifications } from "@/hooks/useNotifications";
import { useNavigate } from "react-router-dom";

// Import dos componentes do sidebar
import { Sidebar, SidebarToggle } from "./sidebar";
import { useSidebar } from "@/hooks/useSidebar";
import { ModuleType } from "@/hooks/useSidebar";

export function MainMenu() {
  const [isNotificationCenterOpen, setIsNotificationCenterOpen] = useState(false);
  const { profile, company, signOut } = useAuth();
  const { stats } = useNotifications();
  const { activeModule, setActiveModule } = useSidebar();
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
    return variants[type as keyof typeof variants] as any || 'default';
  };

  const modules = [
    {
      id: 'solar' as ModuleType,
      title: 'Energia Solar Fotovoltaica',
      description: 'Sistema completo para dimensionamento e análise de projetos solares fotovoltaicos',
      icon: Sun,
      color: 'from-yellow-500 to-orange-500',
      features: [
        'Cálculo de dimensionamento',
        'Análise de viabilidade financeira',
        'Geração de propostas',
        'Simulação técnica avançada'
      ],
      status: 'Ativo',
      statusColor: 'bg-green-100 text-green-800'
    },
    {
      id: 'heating' as ModuleType,
      title: 'Aquecimento Solar',
      description: 'Soluções para aquecimento de água para banho, piscinas e processos industriais',
      icon: Thermometer,
      color: 'from-red-500 to-pink-500',
      features: [
        'Aquecimento para banho',
        'Aquecimento de piscinas',
        'Sistemas industriais',
        'Análise de economia'
      ],
      status: 'Em Desenvolvimento',
      statusColor: 'bg-yellow-100 text-yellow-800'
    },
    {
      id: 'training' as ModuleType,
      title: 'Centro de Treinamentos',
      description: 'Plataforma de capacitação e certificação em energia renovável',
      icon: GraduationCap,
      color: 'from-blue-500 to-purple-500',
      features: [
        'Cursos online',
        'Certificações',
        'Material didático',
        'Acompanhamento de progresso'
      ],
      status: 'Em Desenvolvimento',
      statusColor: 'bg-yellow-100 text-yellow-800'
    }
  ];

  // Renderizar o módulo ativo
  if (activeModule === 'solar') {
    return (
      <div className="flex">
        <Sidebar 
          onHelpClick={() => console.log('Ajuda clicada')}
        />
        <div className="flex-1">
          <SolarDashboard onBackToMenu={() => setActiveModule(null)} />
        </div>
      </div>
    );
  }

  if (activeModule === 'heating') {
    return (
      <div className="flex">
        <Sidebar 
          onSettingsClick={() => setIsSettingsOpen(true)}
          onHelpClick={() => console.log('Ajuda clicada')}
        />
        <div className="flex-1">
          <HeatingDashboard onBackToMenu={() => setActiveModule(null)} />
        </div>
      </div>
    );
  }

  if (activeModule === 'training') {
    return (
      <div className="flex">
        <Sidebar 
          onSettingsClick={() => setIsSettingsOpen(true)}
          onHelpClick={() => console.log('Ajuda clicada')}
        />
        <div className="flex-1">
          <TrainingDashboard onBackToMenu={() => setActiveModule(null)} />
        </div>
      </div>
    );
  }

  // Menu principal
  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/30">
      {/* Sidebar */}
      <Sidebar 
        onHelpClick={() => console.log('Ajuda clicada')}
      />
      
      {/* Header */}
      <header className="border-b border-border/50 bg-card/90 backdrop-blur-md sticky top-0 z-30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Sidebar Toggle */}
              <SidebarToggle />
              
              <div className="flex items-center gap-2">
                <div className="p-2 bg-gradient-to-r from-green-500 to-blue-500 rounded-lg shadow-lg">
                  <Zap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
                    Nova Energia Pro
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Plataforma Integrada de Energia Renovável
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
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Bem-vindo à Nova Energia Pro
          </h2>
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Escolha o módulo que deseja acessar para começar a trabalhar com soluções em energia renovável
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {modules.map((module) => (
            <Card 
              key={module.id} 
              className="group hover:shadow-2xl transition-all duration-300 cursor-pointer border-2 hover:border-primary/50 relative overflow-hidden"
              onClick={() => setActiveModule(module.id)}
            >
              {/* Background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${module.color} opacity-5 group-hover:opacity-10 transition-opacity`} />
              
              <CardHeader className="relative">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${module.color} shadow-lg`}>
                    <module.icon className="h-8 w-8 text-white" />
                  </div>
                  <Badge className={module.statusColor}>
                    {module.status}
                  </Badge>
                </div>
                <CardTitle className="text-xl group-hover:text-primary transition-colors">
                  {module.title}
                </CardTitle>
                <CardDescription className="text-base">
                  {module.description}
                </CardDescription>
              </CardHeader>
              
              <CardContent className="relative">
                <div className="space-y-3 mb-6">
                  <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                    Principais Funcionalidades
                  </h4>
                  <ul className="space-y-2">
                    {module.features.map((feature, index) => (
                      <li key={index} className="flex items-center gap-2 text-sm">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <Button 
                  className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                  variant="outline"
                >
                  Acessar Módulo
                  <ArrowRight className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="text-center">
            <CardContent className="py-6">
              <div className="flex items-center justify-center mb-2">
                <Sun className="h-8 w-8 text-yellow-500" />
              </div>
              <h3 className="text-2xl font-bold">2.4 MW</h3>
              <p className="text-muted-foreground">Potência Total Instalada</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="py-6">
              <div className="flex items-center justify-center mb-2">
                <Droplets className="h-8 w-8 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold">150+</h3>
              <p className="text-muted-foreground">Sistemas de Aquecimento</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="py-6">
              <div className="flex items-center justify-center mb-2">
                <BookOpen className="h-8 w-8 text-purple-500" />
              </div>
              <h3 className="text-2xl font-bold">500+</h3>
              <p className="text-muted-foreground">Profissionais Treinados</p>
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Notification Center */}
      <NotificationCenter 
        isOpen={isNotificationCenterOpen}
        onClose={() => setIsNotificationCenterOpen(false)}
      />
      

    </div>
  );
}