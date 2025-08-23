// =====================================================
// COMPONENTE DE PROGRESSO DE TREINAMENTOS
// Sistema de Treinamentos Corporativos - Solara Nova Energia
// Versão: 1.0
// Data: 2025-01-20
// =====================================================

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Clock,
  Target,
  TrendingUp,
  CheckCircle,
  PlayCircle,
  BookOpen,
  Award,
  Calendar,
  Flame,
  Star,
  Zap,
  BarChart3,
  PieChart,
  Activity,
  ChevronRight,
  ChevronDown,
  Eye,
  Download,
  Share2,
  Filter,
  MoreVertical,
  RefreshCw,
  AlertCircle,
  Info
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { formatDistanceToNow, format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

// =====================================================
// INTERFACES E TIPOS
// =====================================================

interface ProgressStats {
  totalModules: number;
  completedModules: number;
  inProgressModules: number;
  totalHours: number;
  completedHours: number;
  averageScore: number;
  streakDays: number;
  totalPoints: number;
  rank: string;
  nextMilestone: string;
  pointsToNext: number;
}

interface ModuleProgress {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  totalLessons: number;
  completedLessons: number;
  totalDuration: number;
  completedDuration: number;
  lastAccessed: string;
  status: 'not_started' | 'in_progress' | 'completed';
  score?: number;
  certificate?: boolean;
  dueDate?: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earnedAt: string;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface LearningPath {
  id: string;
  title: string;
  description: string;
  modules: string[];
  completedModules: number;
  estimatedTime: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  progress: number;
}

interface TrainingProgressProps {
  userId?: string;
  showDetailedView?: boolean;
  className?: string;
}

// =====================================================
// DADOS MOCK (substituir por dados reais)
// =====================================================

const mockProgressStats: ProgressStats = {
  totalModules: 12,
  completedModules: 7,
  inProgressModules: 3,
  totalHours: 48,
  completedHours: 28,
  averageScore: 87,
  streakDays: 12,
  totalPoints: 2450,
  rank: 'Especialista Solar',
  nextMilestone: 'Mestre em Energia Solar',
  pointsToNext: 550
};

const mockModuleProgress: ModuleProgress[] = [
  {
    id: '1',
    title: 'Fundamentos da Energia Solar',
    description: 'Conceitos básicos e princípios fundamentais',
    category: 'Básico',
    difficulty: 'beginner',
    totalLessons: 8,
    completedLessons: 8,
    totalDuration: 240,
    completedDuration: 240,
    lastAccessed: '2025-01-19T10:30:00Z',
    status: 'completed',
    score: 92,
    certificate: true
  },
  {
    id: '2',
    title: 'Dimensionamento de Sistemas Fotovoltaicos',
    description: 'Cálculos e metodologias para dimensionamento',
    category: 'Técnico',
    difficulty: 'intermediate',
    totalLessons: 12,
    completedLessons: 8,
    totalDuration: 360,
    completedDuration: 240,
    lastAccessed: '2025-01-20T09:15:00Z',
    status: 'in_progress',
    dueDate: '2025-01-25T23:59:59Z'
  },
  {
    id: '3',
    title: 'Instalação e Manutenção',
    description: 'Práticas de instalação e manutenção preventiva',
    category: 'Prático',
    difficulty: 'advanced',
    totalLessons: 15,
    completedLessons: 0,
    totalDuration: 450,
    completedDuration: 0,
    lastAccessed: '',
    status: 'not_started'
  }
];

const mockAchievements: Achievement[] = [
  {
    id: '1',
    title: 'Primeiro Módulo Completo',
    description: 'Completou seu primeiro módulo de treinamento',
    icon: '🎯',
    earnedAt: '2025-01-15T14:30:00Z',
    points: 100,
    rarity: 'common'
  },
  {
    id: '2',
    title: 'Sequência de 7 Dias',
    description: 'Estudou por 7 dias consecutivos',
    icon: '🔥',
    earnedAt: '2025-01-18T20:00:00Z',
    points: 250,
    rarity: 'rare'
  },
  {
    id: '3',
    title: 'Nota Perfeita',
    description: 'Obteve 100% em uma avaliação',
    icon: '⭐',
    earnedAt: '2025-01-19T16:45:00Z',
    points: 500,
    rarity: 'epic'
  }
];

const mockLearningPaths: LearningPath[] = [
  {
    id: '1',
    title: 'Trilha do Instalador Solar',
    description: 'Caminho completo para se tornar um instalador certificado',
    modules: ['1', '2', '3', '4'],
    completedModules: 2,
    estimatedTime: 40,
    difficulty: 'intermediate',
    progress: 50
  },
  {
    id: '2',
    title: 'Trilha do Projetista',
    description: 'Especialização em projeto e dimensionamento',
    modules: ['1', '2', '5', '6'],
    completedModules: 1,
    estimatedTime: 35,
    difficulty: 'advanced',
    progress: 25
  }
];

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function TrainingProgress({ 
  userId, 
  showDetailedView = true, 
  className = '' 
}: TrainingProgressProps) {
  const [selectedTimeframe, setSelectedTimeframe] = useState('month');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedModule, setExpandedModule] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Cálculos derivados
  const progressPercentage = useMemo(() => 
    Math.round((mockProgressStats.completedModules / mockProgressStats.totalModules) * 100),
    []
  );

  const hoursPercentage = useMemo(() => 
    Math.round((mockProgressStats.completedHours / mockProgressStats.totalHours) * 100),
    []
  );

  const rankProgress = useMemo(() => 
    Math.round(((mockProgressStats.totalPoints % 1000) / 1000) * 100),
    []
  );

  // Filtros
  const filteredModules = useMemo(() => {
    return mockModuleProgress.filter(module => 
      selectedCategory === 'all' || module.category.toLowerCase() === selectedCategory
    );
  }, [selectedCategory]);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'in_progress': return <PlayCircle className="h-4 w-4 text-blue-500" />;
      case 'not_started': return <Clock className="h-4 w-4 text-gray-400" />;
      default: return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'border-gray-300 bg-gray-50';
      case 'rare': return 'border-blue-300 bg-blue-50';
      case 'epic': return 'border-purple-300 bg-purple-50';
      case 'legendary': return 'border-yellow-300 bg-yellow-50';
      default: return 'border-gray-300 bg-gray-50';
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header com Estatísticas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Progresso Geral */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10" />
          <CardContent className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-5 w-5 text-blue-600" />
              </div>
              <Badge variant="secondary">{progressPercentage}%</Badge>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Progresso Geral</h3>
            <p className="text-sm text-gray-600 mb-3">
              {mockProgressStats.completedModules} de {mockProgressStats.totalModules} módulos
            </p>
            <Progress value={progressPercentage} className="h-2" />
          </CardContent>
        </Card>

        {/* Tempo de Estudo */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-emerald-500/10" />
          <CardContent className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Clock className="h-5 w-5 text-green-600" />
              </div>
              <Badge variant="secondary">{hoursPercentage}%</Badge>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Tempo de Estudo</h3>
            <p className="text-sm text-gray-600 mb-3">
              {mockProgressStats.completedHours}h de {mockProgressStats.totalHours}h
            </p>
            <Progress value={hoursPercentage} className="h-2" />
          </CardContent>
        </Card>

        {/* Sequência */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/10" />
          <CardContent className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Flame className="h-5 w-5 text-orange-600" />
              </div>
              <Badge variant="secondary">{mockProgressStats.streakDays} dias</Badge>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Sequência Atual</h3>
            <p className="text-sm text-gray-600 mb-3">
              Estudando consistentemente
            </p>
            <div className="flex space-x-1">
              {[...Array(7)].map((_, i) => (
                <div 
                  key={i} 
                  className={`h-2 w-4 rounded ${
                    i < mockProgressStats.streakDays % 7 ? 'bg-orange-500' : 'bg-gray-200'
                  }`} 
                />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pontuação */}
        <Card className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10" />
          <CardContent className="relative p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Trophy className="h-5 w-5 text-purple-600" />
              </div>
              <Badge variant="secondary">{mockProgressStats.totalPoints} pts</Badge>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{mockProgressStats.rank}</h3>
            <p className="text-sm text-gray-600 mb-3">
              {mockProgressStats.pointsToNext} pts para próximo nível
            </p>
            <Progress value={rankProgress} className="h-2" />
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Conteúdo */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="modules">Módulos</TabsTrigger>
          <TabsTrigger value="achievements">Conquistas</TabsTrigger>
          <TabsTrigger value="paths">Trilhas</TabsTrigger>
        </TabsList>

        {/* Aba: Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Progresso Semanal */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Progresso Semanal</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((day, index) => (
                    <div key={day} className="flex items-center justify-between">
                      <span className="text-sm font-medium">{day}</span>
                      <div className="flex items-center space-x-2">
                        <div className="w-32 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${Math.random() * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 w-8">
                          {Math.floor(Math.random() * 4)}h
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Atividade Recente */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Activity className="h-5 w-5" />
                  <span>Atividade Recente</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64">
                  <div className="space-y-3">
                    {[
                      { action: 'Completou', item: 'Fundamentos da Energia Solar', time: '2 horas atrás', type: 'completed' },
                      { action: 'Iniciou', item: 'Dimensionamento de Sistemas', time: '1 dia atrás', type: 'started' },
                      { action: 'Conquistou', item: 'Sequência de 7 Dias', time: '2 dias atrás', type: 'achievement' },
                      { action: 'Assistiu', item: 'Vídeo: Tipos de Painéis', time: '3 dias atrás', type: 'video' }
                    ].map((activity, index) => (
                      <div key={index} className="flex items-start space-x-3 p-2 rounded-lg hover:bg-gray-50">
                        <div className={`p-1 rounded-full ${
                          activity.type === 'completed' ? 'bg-green-100' :
                          activity.type === 'started' ? 'bg-blue-100' :
                          activity.type === 'achievement' ? 'bg-yellow-100' :
                          'bg-purple-100'
                        }`}>
                          {activity.type === 'completed' && <CheckCircle className="h-3 w-3 text-green-600" />}
                          {activity.type === 'started' && <PlayCircle className="h-3 w-3 text-blue-600" />}
                          {activity.type === 'achievement' && <Trophy className="h-3 w-3 text-yellow-600" />}
                          {activity.type === 'video' && <Eye className="h-3 w-3 text-purple-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900">
                            {activity.action} <span className="font-normal">{activity.item}</span>
                          </p>
                          <p className="text-xs text-gray-500">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Aba: Módulos */}
        <TabsContent value="modules" className="space-y-6">
          {/* Filtros */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrar por categoria" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  <SelectItem value="básico">Básico</SelectItem>
                  <SelectItem value="técnico">Técnico</SelectItem>
                  <SelectItem value="prático">Prático</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>

          {/* Lista de Módulos */}
          <div className="space-y-4">
            {filteredModules.map((module) => {
              const isExpanded = expandedModule === module.id;
              const progressPercent = Math.round((module.completedLessons / module.totalLessons) * 100);
              
              return (
                <Card key={module.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div 
                      className="p-6 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => setExpandedModule(isExpanded ? null : module.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          {getStatusIcon(module.status)}
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <h3 className="font-semibold text-gray-900">{module.title}</h3>
                              <Badge className={getDifficultyColor(module.difficulty)}>
                                {module.difficulty === 'beginner' ? 'Iniciante' :
                                 module.difficulty === 'intermediate' ? 'Intermediário' : 'Avançado'}
                              </Badge>
                              {module.certificate && (
                                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                                  <Award className="h-3 w-3 mr-1" />
                                  Certificado
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-600 mb-2">{module.description}</p>
                            <div className="flex items-center space-x-4 text-xs text-gray-500">
                              <span>{module.completedLessons}/{module.totalLessons} aulas</span>
                              <span>{Math.floor(module.totalDuration / 60)}h {module.totalDuration % 60}min</span>
                              {module.lastAccessed && (
                                <span>Último acesso: {formatDistanceToNow(new Date(module.lastAccessed), { locale: ptBR, addSuffix: true })}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="text-sm font-medium">{progressPercent}%</div>
                            {module.score && (
                              <div className="text-xs text-gray-500">Nota: {module.score}</div>
                            )}
                          </div>
                          <div className="w-24">
                            <Progress value={progressPercent} className="h-2" />
                          </div>
                          {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        </div>
                      </div>
                    </div>
                    
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <Separator />
                          <div className="p-6 bg-gray-50">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div>
                                <h4 className="font-medium mb-2">Detalhes do Progresso</h4>
                                <div className="space-y-1 text-sm">
                                  <div className="flex justify-between">
                                    <span>Aulas concluídas:</span>
                                    <span>{module.completedLessons}/{module.totalLessons}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Tempo gasto:</span>
                                    <span>{Math.floor(module.completedDuration / 60)}h {module.completedDuration % 60}min</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span>Categoria:</span>
                                    <span>{module.category}</span>
                                  </div>
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="font-medium mb-2">Próximos Passos</h4>
                                <div className="space-y-2">
                                  {module.status === 'not_started' && (
                                    <Button size="sm" className="w-full">
                                      <PlayCircle className="h-4 w-4 mr-2" />
                                      Iniciar Módulo
                                    </Button>
                                  )}
                                  {module.status === 'in_progress' && (
                                    <Button size="sm" className="w-full">
                                      <PlayCircle className="h-4 w-4 mr-2" />
                                      Continuar
                                    </Button>
                                  )}
                                  {module.status === 'completed' && (
                                    <div className="space-y-2">
                                      <Button size="sm" variant="outline" className="w-full">
                                        <Eye className="h-4 w-4 mr-2" />
                                        Revisar
                                      </Button>
                                      {module.certificate && (
                                        <Button size="sm" variant="outline" className="w-full">
                                          <Download className="h-4 w-4 mr-2" />
                                          Baixar Certificado
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div>
                                <h4 className="font-medium mb-2">Informações</h4>
                                <div className="space-y-1 text-sm text-gray-600">
                                  {module.dueDate && (
                                    <div className="flex items-center space-x-2">
                                      <AlertCircle className="h-3 w-3 text-orange-500" />
                                      <span>Prazo: {format(new Date(module.dueDate), 'dd/MM/yyyy', { locale: ptBR })}</span>
                                    </div>
                                  )}
                                  <div className="flex items-center space-x-2">
                                    <Info className="h-3 w-3" />
                                    <span>Dificuldade: {module.difficulty === 'beginner' ? 'Iniciante' : module.difficulty === 'intermediate' ? 'Intermediário' : 'Avançado'}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Aba: Conquistas */}
        <TabsContent value="achievements" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {mockAchievements.map((achievement) => (
              <Card key={achievement.id} className={`border-2 ${getRarityColor(achievement.rarity)}`}>
                <CardContent className="p-6 text-center">
                  <div className="text-4xl mb-3">{achievement.icon}</div>
                  <h3 className="font-semibold mb-2">{achievement.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>
                  <div className="flex items-center justify-between">
                    <Badge variant="outline" className="text-xs">
                      +{achievement.points} pts
                    </Badge>
                    <span className="text-xs text-gray-500">
                      {formatDistanceToNow(new Date(achievement.earnedAt), { locale: ptBR, addSuffix: true })}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Aba: Trilhas de Aprendizado */}
        <TabsContent value="paths" className="space-y-6">
          <div className="space-y-4">
            {mockLearningPaths.map((path) => (
              <Card key={path.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{path.title}</h3>
                      <p className="text-gray-600 mb-2">{path.description}</p>
                      <div className="flex items-center space-x-4 text-sm text-gray-500">
                        <span>{path.completedModules}/{path.modules.length} módulos</span>
                        <span>~{path.estimatedTime}h</span>
                        <Badge className={getDifficultyColor(path.difficulty)}>
                          {path.difficulty === 'beginner' ? 'Iniciante' :
                           path.difficulty === 'intermediate' ? 'Intermediário' : 'Avançado'}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600 mb-1">{path.progress}%</div>
                      <Button size="sm">
                        Continuar Trilha
                      </Button>
                    </div>
                  </div>
                  <Progress value={path.progress} className="h-3" />
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default TrainingProgress;