// =====================================================
// DASHBOARD PRINCIPAL DE TREINAMENTOS
// Sistema de Treinamentos Corporativos - Solara Nova Energia
// Versão: 1.0
// Data: 2024-12-12
// =====================================================

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Trophy,
  Clock,
  TrendingUp,
  Users,
  Award,
  PlayCircle,
  CheckCircle,
  AlertCircle,
  Plus,
  Filter,
  Search,
  Calendar,
  Target,
  Zap,
  Star,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { Progress } from '../../../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { SidebarToggle } from '../../../components/sidebar/SidebarToggle';
import { useTrainingModules, useUserProgress, useGamification, useTrainingReports } from '../hooks/useTraining';
import { useAuth } from '../../../contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import ModuleEditor from './ModuleEditor';
import type { TrainingModule } from '../types';

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function TrainingDashboard() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('overview');
  const [isModuleEditorOpen, setIsModuleEditorOpen] = useState(false);
  
  // Hooks para dados
  const { modules, isLoading: isLoadingModules } = useTrainingModules();
  const { progressData, isLoading: isLoadingProgress } = useUserProgress();
  const { ranking, userPosition, userRankingData } = useGamification();
  const { companyReport, moduleStats } = useTrainingReports();

  // Estados de loading
  const isLoading = isLoadingModules || isLoadingProgress;

  // Handlers
  const handleNewModule = () => {
    setIsModuleEditorOpen(true);
  };

  const handleCloseModuleEditor = () => {
    setIsModuleEditorOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <SidebarToggle />
              <div className="flex items-center space-x-2">
                <BookOpen className="h-8 w-8 text-blue-600" />
                <h1 className="text-2xl font-bold text-gray-900">Treinamentos</h1>
              </div>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                {modules.length} módulos disponíveis
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar treinamentos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              {user?.role === 'admin' && (
                <Button onClick={handleNewModule}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Módulo
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="modules">Módulos</TabsTrigger>
            <TabsTrigger value="progress">Meu Progresso</TabsTrigger>
            <TabsTrigger value="ranking">Ranking</TabsTrigger>
          </TabsList>

          {/* Aba: Visão Geral */}
          <TabsContent value="overview" className="space-y-6">
            <OverviewTab 
              progressData={progressData}
              companyReport={companyReport}
              userRankingData={userRankingData}
              userPosition={userPosition}
              isLoading={isLoading}
            />
          </TabsContent>

          {/* Aba: Módulos */}
          <TabsContent value="modules" className="space-y-6">
            <ModulesTab 
              modules={modules}
              searchTerm={searchTerm}
              isLoading={isLoadingModules}
            />
          </TabsContent>

          {/* Aba: Meu Progresso */}
          <TabsContent value="progress" className="space-y-6">
            <ProgressTab 
              progressData={progressData}
              isLoading={isLoadingProgress}
            />
          </TabsContent>

          {/* Aba: Ranking */}
          <TabsContent value="ranking" className="space-y-6">
            <RankingTab 
              ranking={ranking}
              userPosition={userPosition}
              userRankingData={userRankingData}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal do Editor de Módulo */}
      <ModuleEditor
        isOpen={isModuleEditorOpen}
        onClose={handleCloseModuleEditor}
        moduleId={null}
      />
    </div>
  );
}

// =====================================================
// ABA: VISÃO GERAL
// =====================================================

function OverviewTab({ 
  progressData, 
  companyReport, 
  userRankingData, 
  userPosition, 
  isLoading 
}: {
  progressData: any;
  companyReport: any;
  userRankingData: any;
  userPosition: number | null;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: 'Módulos Concluídos',
      value: progressData?.overall_stats?.completed_modules || 0,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Em Progresso',
      value: progressData?.overall_stats?.in_progress_modules || 0,
      icon: Clock,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Pontos Totais',
      value: userRankingData?.total_points || 0,
      icon: Trophy,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-100'
    },
    {
      title: 'Posição no Ranking',
      value: userPosition ? `#${userPosition}` : '-',
      icon: TrendingUp,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Seção de Progresso e Atividade Recente */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Progresso Geral */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5 text-blue-600" />
              <span>Progresso Geral</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Taxa de Conclusão</span>
                <span>{progressData?.overall_stats?.completion_rate || 0}%</span>
              </div>
              <Progress value={progressData?.overall_stats?.completion_rate || 0} className="h-2" />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Tempo Total de Estudo</span>
                <span>{Math.round((progressData?.overall_stats?.total_time_spent || 0) / 60)} min</span>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Sequência de Estudos</span>
                <span>{progressData?.overall_stats?.streak_days || 0} dias</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Atividade Recente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-green-600" />
              <span>Atividade Recente</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {progressData?.recent_activity?.length > 0 ? (
                progressData.recent_activity.slice(0, 5).map((activity: any, index: number) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {activity.title}
                      </p>
                      <p className="text-xs text-gray-500">
                        {formatDistanceToNow(new Date(activity.completed_at), {
                          addSuffix: true,
                          locale: ptBR
                        })}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-4">
                  <AlertCircle className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">Nenhuma atividade recente</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Próximos Prazos */}
      {progressData?.upcoming_deadlines?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-orange-600" />
              <span>Próximos Prazos</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {progressData.upcoming_deadlines.slice(0, 3).map((deadline: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{deadline.title}</p>
                    <p className="text-sm text-gray-600">{deadline.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-orange-600">
                      {formatDistanceToNow(new Date(deadline.due_date), {
                        addSuffix: true,
                        locale: ptBR
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// =====================================================
// ABA: MÓDULOS
// =====================================================

function ModulesTab({ 
  modules, 
  searchTerm, 
  isLoading 
}: {
  modules: any[];
  searchTerm: string;
  isLoading: boolean;
}) {
  const filteredModules = modules.filter(module => 
    module.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    module.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-full mb-4"></div>
              <div className="h-3 bg-gray-200 rounded w-2/3"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4 mr-2" />
            Filtros
          </Button>
        </div>
        <p className="text-sm text-gray-600">
          {filteredModules.length} módulo(s) encontrado(s)
        </p>
      </div>

      {/* Grid de Módulos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModules.map((module, index) => (
          <motion.div
            key={module.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer group">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg group-hover:text-blue-600 transition-colors">
                      {module.title}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {module.description}
                    </CardDescription>
                  </div>
                  <Badge 
                    variant={module.difficulty_level === 'beginner' ? 'secondary' : 
                            module.difficulty_level === 'intermediate' ? 'default' : 'destructive'}
                  >
                    {module.difficulty_level === 'beginner' ? 'Iniciante' :
                     module.difficulty_level === 'intermediate' ? 'Intermediário' : 'Avançado'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>{module.estimated_duration} min</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <PlayCircle className="h-4 w-4" />
                    <span>{module.content_count || 0} aulas</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Users className="h-4 w-4" />
                    <span>{module.enrolled_count || 0}</span>
                  </div>
                </div>

                {module.tags && module.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {module.tags.slice(0, 3).map((tag: string) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {module.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{module.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                    <span className="text-sm font-medium">4.8</span>
                    <span className="text-sm text-gray-500">(24)</span>
                  </div>
                  <Button size="sm" className="group-hover:bg-blue-600">
                    Iniciar
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {filteredModules.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum módulo encontrado
          </h3>
          <p className="text-gray-600">
            Tente ajustar os filtros ou termo de busca
          </p>
        </div>
      )}
    </div>
  );
}

// =====================================================
// ABA: MEU PROGRESSO
// =====================================================

function ProgressTab({ 
  progressData, 
  isLoading 
}: {
  progressData: any;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-2 bg-gray-200 rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {progressData?.module_progress?.map((moduleProgress: any) => (
        <Card key={moduleProgress.module_id}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{moduleProgress.module_info.title}</CardTitle>
                <CardDescription>{moduleProgress.module_info.description}</CardDescription>
              </div>
              <Badge variant="outline">
                {moduleProgress.content_progress.filter((c: any) => c.status === 'completed').length}/
                {moduleProgress.content_progress.length} concluído
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progresso</span>
                <span>
                  {Math.round(
                    (moduleProgress.content_progress.filter((c: any) => c.status === 'completed').length /
                     moduleProgress.content_progress.length) * 100
                  )}%
                </span>
              </div>
              <Progress 
                value={
                  (moduleProgress.content_progress.filter((c: any) => c.status === 'completed').length /
                   moduleProgress.content_progress.length) * 100
                } 
                className="h-2" 
              />
            </div>
            
            <div className="space-y-2">
              {moduleProgress.content_progress.map((content: any) => (
                <div key={content.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center space-x-3">
                    {content.status === 'completed' ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : content.status === 'in_progress' ? (
                      <Clock className="h-4 w-4 text-blue-500" />
                    ) : (
                      <div className="h-4 w-4 border-2 border-gray-300 rounded-full" />
                    )}
                    <span className="text-sm font-medium">
                      {content.training_content.title}
                    </span>
                  </div>
                  <div className="text-xs text-gray-500">
                    {content.progress_percentage}%
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )) || (
        <div className="text-center py-12">
          <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum progresso ainda
          </h3>
          <p className="text-gray-600">
            Comece um módulo para ver seu progresso aqui
          </p>
        </div>
      )}
    </div>
  );
}

// =====================================================
// ABA: RANKING
// =====================================================

function RankingTab({ 
  ranking, 
  userPosition, 
  userRankingData 
}: {
  ranking: any[];
  userPosition: number | null;
  userRankingData: any;
}) {
  return (
    <div className="space-y-6">
      {/* Posição do Usuário */}
      {userRankingData && (
        <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-white/20 rounded-full">
                  <Trophy className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Sua Posição</h3>
                  <p className="text-blue-100">#{userPosition} no ranking geral</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">{userRankingData.total_points}</p>
                <p className="text-blue-100">pontos</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Lista do Ranking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="h-5 w-5 text-yellow-600" />
            <span>Ranking da Empresa</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ranking.map((user, index) => (
              <div 
                key={user.user_id} 
                className={`flex items-center justify-between p-4 rounded-lg transition-colors ${
                  index < 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border border-yellow-200' : 'bg-gray-50'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white shadow-sm">
                    {index === 0 && <Trophy className="h-4 w-4 text-yellow-500" />}
                    {index === 1 && <Award className="h-4 w-4 text-gray-400" />}
                    {index === 2 && <Award className="h-4 w-4 text-orange-500" />}
                    {index > 2 && <span className="text-sm font-medium text-gray-600">#{index + 1}</span>}
                  </div>
                  
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.profiles?.avatar_url} />
                    <AvatarFallback>
                      {user.profiles?.full_name?.split(' ').map((n: string) => n[0]).join('') || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <p className="font-medium text-gray-900">
                      {user.profiles?.full_name || 'Usuário'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {user.modules_completed} módulos concluídos
                    </p>
                  </div>
                </div>
                
                <div className="text-right">
                  <p className="text-lg font-bold text-gray-900">
                    {user.total_points}
                  </p>
                  <p className="text-sm text-gray-600">pontos</p>
                </div>
              </div>
            ))}
          </div>
          
          {ranking.length === 0 && (
            <div className="text-center py-8">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Ranking em construção
              </h3>
              <p className="text-gray-600">
                Complete módulos para aparecer no ranking
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default TrainingDashboard;