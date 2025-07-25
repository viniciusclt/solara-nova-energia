import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { 
  ArrowLeft,
  GraduationCap,
  BookOpen,
  Video,
  Users,
  Award,
  Clock,
  Play,
  CheckCircle,
  Star,
  Download,
  Calendar,
  Target,
  TrendingUp,
  FileText,
  Zap
} from "lucide-react";

interface TrainingDashboardProps {
  onBackToMenu: () => void;
}

export function TrainingDashboard({ onBackToMenu }: TrainingDashboardProps) {
  const [activeTab, setActiveTab] = useState("courses");
  const { hasPermission } = useAuth();

  const trainingStats = [
    {
      title: "Cursos Disponíveis",
      value: "24",
      change: "+3 novos",
      icon: BookOpen,
      trend: "up"
    },
    {
      title: "Alunos Ativos",
      value: "1.2k",
      change: "+15%",
      icon: Users,
      trend: "up"
    },
    {
      title: "Taxa de Conclusão",
      value: "87%",
      change: "+5%",
      icon: Award,
      trend: "up"
    },
    {
      title: "Horas de Conteúdo",
      value: "156h",
      change: "+12h",
      icon: Clock,
      trend: "up"
    }
  ];

  const navigationTabs = [
    { 
      id: "courses", 
      label: "Cursos", 
      icon: BookOpen, 
      description: "Catálogo de cursos disponíveis"
    },
    { 
      id: "progress", 
      label: "Progresso", 
      icon: TrendingUp, 
      description: "Acompanhamento de progresso"
    },
    { 
      id: "certifications", 
      label: "Certificações", 
      icon: Award, 
      description: "Certificados e conquistas"
    },
    { 
      id: "live", 
      label: "Ao Vivo", 
      icon: Video, 
      description: "Treinamentos ao vivo"
    },
    { 
      id: "resources", 
      label: "Recursos", 
      icon: Download, 
      description: "Materiais e downloads"
    },
    { 
      id: "management", 
      label: "Gestão", 
      icon: Target, 
      description: "Administração de treinamentos"
    }
  ];

  const featuredCourses = [
    {
      id: 1,
      title: "Fundamentos da Energia Solar Fotovoltaica",
      description: "Curso completo sobre princípios básicos da energia solar",
      duration: "8h",
      level: "Iniciante",
      rating: 4.8,
      students: 342,
      progress: 0,
      thumbnail: "🌞",
      instructor: "Prof. João Silva",
      category: "Fotovoltaico"
    },
    {
      id: 2,
      title: "Dimensionamento de Sistemas Fotovoltaicos",
      description: "Aprenda a calcular e dimensionar sistemas solares",
      duration: "12h",
      level: "Intermediário",
      rating: 4.9,
      students: 198,
      progress: 45,
      thumbnail: "📐",
      instructor: "Eng. Maria Santos",
      category: "Técnico"
    },
    {
      id: 3,
      title: "Aquecimento Solar para Banho e Piscina",
      description: "Sistemas de aquecimento solar térmico",
      duration: "6h",
      level: "Iniciante",
      rating: 4.7,
      students: 156,
      progress: 0,
      thumbnail: "🏊",
      instructor: "Eng. Carlos Lima",
      category: "Aquecimento"
    },
    {
      id: 4,
      title: "Vendas e Negociação em Energia Solar",
      description: "Técnicas de vendas específicas para o setor solar",
      duration: "10h",
      level: "Intermediário",
      rating: 4.6,
      students: 289,
      progress: 78,
      thumbnail: "💼",
      instructor: "Esp. Ana Costa",
      category: "Comercial"
    }
  ];

  const upcomingLive = [
    {
      id: 1,
      title: "Novidades em Inversores 2024",
      date: "15/12/2024",
      time: "14:00",
      instructor: "Eng. Pedro Oliveira",
      attendees: 45
    },
    {
      id: 2,
      title: "Manutenção Preventiva em Sistemas Solares",
      date: "18/12/2024",
      time: "16:00",
      instructor: "Téc. Roberto Silva",
      attendees: 32
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
                <div className="p-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg shadow-lg">
                  <GraduationCap className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Treinamentos
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Capacitação e Desenvolvimento
                  </p>
                </div>
              </div>
            </div>
            
            <Badge variant="secondary" className="bg-blue-100 text-blue-800">
              Em Desenvolvimento
            </Badge>
          </div>
        </div>
      </header>

      {/* Dashboard Stats */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {trainingStats.map((stat, index) => (
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
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-lg shadow-lg">
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
          <TabsContent value="courses">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-6 w-6" />
                    Cursos em Destaque
                  </CardTitle>
                  <CardDescription>
                    Cursos mais populares e recomendados
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {featuredCourses.map((course) => (
                      <Card key={course.id} className="hover:shadow-lg transition-all duration-300">
                        <CardContent className="p-6">
                          <div className="flex items-start gap-4">
                            <div className="text-4xl">{course.thumbnail}</div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between mb-2">
                                <div>
                                  <h3 className="font-semibold text-lg mb-1">{course.title}</h3>
                                  <p className="text-sm text-muted-foreground mb-2">{course.description}</p>
                                </div>
                              </div>
                              
                              <div className="flex items-center gap-4 mb-3 text-sm">
                                <div className="flex items-center gap-1">
                                  <Clock className="h-4 w-4" />
                                  {course.duration}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Users className="h-4 w-4" />
                                  {course.students}
                                </div>
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                                  {course.rating}
                                </div>
                              </div>

                              <div className="flex items-center justify-between mb-3">
                                <Badge variant="outline">{course.level}</Badge>
                                <Badge variant="secondary">{course.category}</Badge>
                              </div>

                              {course.progress > 0 && (
                                <div className="mb-3">
                                  <div className="flex justify-between text-sm mb-1">
                                    <span>Progresso</span>
                                    <span>{course.progress}%</span>
                                  </div>
                                  <Progress value={course.progress} className="h-2" />
                                </div>
                              )}

                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">{course.instructor}</span>
                                <Button size="sm" className="gap-2">
                                  {course.progress > 0 ? (
                                    <>
                                      <Play className="h-4 w-4" />
                                      Continuar
                                    </>
                                  ) : (
                                    <>
                                      <Play className="h-4 w-4" />
                                      Iniciar
                                    </>
                                  )}
                                </Button>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="progress">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-6 w-6" />
                  Seu Progresso
                </CardTitle>
                <CardDescription>
                  Acompanhe seu desenvolvimento nos cursos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-blue-600">3</div>
                        <div className="text-sm text-muted-foreground">Cursos em Andamento</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-green-600">7</div>
                        <div className="text-sm text-muted-foreground">Cursos Concluídos</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4 text-center">
                        <div className="text-2xl font-bold text-purple-600">42h</div>
                        <div className="text-sm text-muted-foreground">Horas Estudadas</div>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Cursos em Andamento</h3>
                    {featuredCourses.filter(course => course.progress > 0).map((course) => (
                      <Card key={course.id}>
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium">{course.title}</h4>
                            <Badge variant="outline">{course.progress}%</Badge>
                          </div>
                          <Progress value={course.progress} className="mb-2" />
                          <div className="flex justify-between text-sm text-muted-foreground">
                            <span>{course.instructor}</span>
                            <span>{course.duration}</span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="certifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-6 w-6" />
                  Certificações e Conquistas
                </CardTitle>
                <CardDescription>
                  Seus certificados e badges conquistados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Award className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Sistema de Certificações em Desenvolvimento</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Em breve você poderá visualizar e baixar seus certificados de conclusão.
                  </p>
                  <div className="bg-muted/50 rounded-lg p-6 max-w-md mx-auto">
                    <h4 className="font-semibold mb-3">Recursos Planejados:</h4>
                    <ul className="text-sm space-y-1 text-left">
                      <li>• Certificados digitais verificáveis</li>
                      <li>• Badges de conquistas</li>
                      <li>• Histórico de certificações</li>
                      <li>• Compartilhamento em redes sociais</li>
                      <li>• Validação por QR Code</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="live">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Video className="h-6 w-6" />
                  Treinamentos ao Vivo
                </CardTitle>
                <CardDescription>
                  Webinars e sessões de treinamento em tempo real
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Próximos Eventos</h3>
                      <div className="space-y-4">
                        {upcomingLive.map((event) => (
                          <Card key={event.id}>
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between mb-2">
                                <h4 className="font-medium">{event.title}</h4>
                                <Badge variant="outline">Ao Vivo</Badge>
                              </div>
                              <div className="space-y-2 text-sm text-muted-foreground">
                                <div className="flex items-center gap-2">
                                  <Calendar className="h-4 w-4" />
                                  {event.date} às {event.time}
                                </div>
                                <div className="flex items-center gap-2">
                                  <Users className="h-4 w-4" />
                                  {event.attendees} inscritos
                                </div>
                                <div>Instrutor: {event.instructor}</div>
                              </div>
                              <Button size="sm" className="mt-3 w-full">
                                Inscrever-se
                              </Button>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="text-lg font-semibold mb-4">Gravações Recentes</h3>
                      <div className="bg-muted/50 rounded-lg p-6 text-center">
                        <Video className="h-12 w-12 mx-auto text-muted-foreground mb-3" />
                        <p className="text-muted-foreground">
                          Gravações de webinars anteriores estarão disponíveis em breve.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="resources">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-6 w-6" />
                  Recursos e Downloads
                </CardTitle>
                <CardDescription>
                  Materiais complementares e recursos para download
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Download className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Biblioteca de Recursos em Desenvolvimento</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Em breve você terá acesso a uma biblioteca completa de materiais.
                  </p>
                  <div className="bg-muted/50 rounded-lg p-6 max-w-md mx-auto">
                    <h4 className="font-semibold mb-3">Tipos de Recursos:</h4>
                    <ul className="text-sm space-y-1 text-left">
                      <li>• PDFs e apostilas</li>
                      <li>• Planilhas de cálculo</li>
                      <li>• Templates de propostas</li>
                      <li>• Vídeos complementares</li>
                      <li>• Ferramentas e softwares</li>
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
                  <Target className="h-6 w-6" />
                  Gestão de Treinamentos
                </CardTitle>
                <CardDescription>
                  Administração e configurações do sistema de treinamentos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Target className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Painel Administrativo em Desenvolvimento</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Ferramentas avançadas de gestão estarão disponíveis para administradores.
                  </p>
                  <div className="bg-muted/50 rounded-lg p-6 max-w-md mx-auto">
                    <h4 className="font-semibold mb-3">Funcionalidades Administrativas:</h4>
                    <ul className="text-sm space-y-1 text-left">
                      <li>• Criação de cursos</li>
                      <li>• Gestão de usuários</li>
                      <li>• Relatórios de progresso</li>
                      <li>• Configuração de certificados</li>
                      <li>• Analytics detalhados</li>
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