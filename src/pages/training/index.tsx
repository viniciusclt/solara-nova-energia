import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useAuth } from "@/contexts/AuthContext";
import { TrainingService } from "@/services/trainingService";
import { TrainingModule } from "@/types/training";
import { 
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

export function TrainingMain() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    loadModules();
  }, []);

  const loadModules = async () => {
    try {
      const data = await TrainingService.getModules();
      setModules(data);
    } catch (error) {
      console.error('Erro ao carregar módulos:', error);
    } finally {
      setLoading(false);
    }
  };

  const trainingStats = [
    {
      title: "Cursos Disponíveis",
      value: modules.length.toString(),
      change: "+3 novos",
      icon: BookOpen,
      trend: "up"
    },
    {
      title: "Progresso Geral",
      value: "75%",
      change: "+12%",
      icon: TrendingUp,
      trend: "up"
    },
    {
      title: "Certificados",
      value: "8",
      change: "+2 novos",
      icon: Award,
      trend: "up"
    },
    {
      title: "Horas de Estudo",
      value: "124h",
      change: "+8h",
      icon: Clock,
      trend: "up"
    }
  ];

  const featuredCourses = [
    {
      id: "1",
      title: "Fundamentos de Energia Solar",
      description: "Aprenda os conceitos básicos da energia fotovoltaica",
      duration: "4h 30min",
      lessons: 12,
      level: "Iniciante",
      progress: 65,
      thumbnail: "/placeholder.svg",
      instructor: "Dr. João Silva",
      rating: 4.8,
      students: 1250
    },
    {
      id: "2",
      title: "Dimensionamento de Sistemas",
      description: "Técnicas avançadas para dimensionar sistemas fotovoltaicos",
      duration: "6h 15min",
      lessons: 18,
      level: "Intermediário",
      progress: 30,
      thumbnail: "/placeholder.svg",
      instructor: "Eng. Maria Santos",
      rating: 4.9,
      students: 890
    },
    {
      id: "3",
      title: "Instalação e Manutenção",
      description: "Práticas de instalação e manutenção de sistemas solares",
      duration: "8h 45min",
      lessons: 24,
      level: "Avançado",
      progress: 0,
      thumbnail: "/placeholder.svg",
      instructor: "Téc. Carlos Lima",
      rating: 4.7,
      students: 650
    }
  ];

  const recentActivity = [
    {
      type: "video",
      title: "Completou: Tipos de Painéis Solares",
      time: "2 horas atrás",
      icon: Video
    },
    {
      type: "assessment",
      title: "Avaliação: Fundamentos - Nota 8.5",
      time: "1 dia atrás",
      icon: FileText
    },
    {
      type: "certificate",
      title: "Certificado obtido: Energia Solar Básica",
      time: "3 dias atrás",
      icon: Award
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Centro de Treinamentos
          </h1>
          <p className="text-lg text-gray-600">
            Desenvolva suas habilidades em energia solar
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {trainingStats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {stat.title}
                      </p>
                      <p className="text-3xl font-bold text-gray-900">
                        {stat.value}
                      </p>
                      <p className="text-sm text-green-600 flex items-center mt-1">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        {stat.change}
                      </p>
                    </div>
                    <div className="p-3 bg-blue-100 rounded-full">
                      <IconComponent className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
            <TabsTrigger value="courses">Cursos</TabsTrigger>
            <TabsTrigger value="progress">Progresso</TabsTrigger>
            <TabsTrigger value="certificates">Certificados</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Featured Courses */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Star className="h-5 w-5 text-yellow-500" />
                      Cursos em Destaque
                    </CardTitle>
                    <CardDescription>
                      Continue seus estudos ou explore novos tópicos
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {featuredCourses.map((course) => (
                        <div key={course.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                          <div className="flex items-start gap-4">
                            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                              <BookOpen className="h-8 w-8 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-start justify-between">
                                <div>
                                  <h3 className="font-semibold text-lg">{course.title}</h3>
                                  <p className="text-gray-600 text-sm mb-2">{course.description}</p>
                                  <div className="flex items-center gap-4 text-sm text-gray-500">
                                    <span className="flex items-center gap-1">
                                      <Clock className="h-4 w-4" />
                                      {course.duration}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <Video className="h-4 w-4" />
                                      {course.lessons} aulas
                                    </span>
                                    <Badge variant="outline">{course.level}</Badge>
                                  </div>
                                </div>
                                <Button size="sm">
                                  {course.progress > 0 ? (
                                    <>
                                      <Play className="h-4 w-4 mr-1" />
                                      Continuar
                                    </>
                                  ) : (
                                    <>
                                      <Play className="h-4 w-4 mr-1" />
                                      Iniciar
                                    </>
                                  )}
                                </Button>
                              </div>
                              {course.progress > 0 && (
                                <div className="mt-3">
                                  <div className="flex items-center justify-between text-sm mb-1">
                                    <span>Progresso</span>
                                    <span>{course.progress}%</span>
                                  </div>
                                  <Progress value={course.progress} className="h-2" />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-blue-500" />
                      Atividade Recente
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recentActivity.map((activity, index) => {
                        const IconComponent = activity.icon;
                        return (
                          <div key={index} className="flex items-start gap-3">
                            <div className="p-2 bg-blue-100 rounded-full">
                              <IconComponent className="h-4 w-4 text-blue-600" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-medium">{activity.title}</p>
                              <p className="text-xs text-gray-500">{activity.time}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Actions */}
                <Card className="mt-6">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-green-500" />
                      Ações Rápidas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Button variant="outline" className="w-full justify-start">
                      <Download className="h-4 w-4 mr-2" />
                      Baixar Certificados
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Calendar className="h-4 w-4 mr-2" />
                      Agendar Avaliação
                    </Button>
                    <Button variant="outline" className="w-full justify-start">
                      <Users className="h-4 w-4 mr-2" />
                      Fórum de Discussão
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="courses">
            <Card>
              <CardHeader>
                <CardTitle>Todos os Cursos</CardTitle>
                <CardDescription>
                  Explore nossa biblioteca completa de cursos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Lista de cursos será implementada aqui</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress">
            <Card>
              <CardHeader>
                <CardTitle>Acompanhamento de Progresso</CardTitle>
                <CardDescription>
                  Visualize seu progresso em todos os cursos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Relatórios de progresso serão implementados aqui</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="certificates">
            <Card>
              <CardHeader>
                <CardTitle>Meus Certificados</CardTitle>
                <CardDescription>
                  Gerencie e baixe seus certificados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">Lista de certificados será implementada aqui</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}