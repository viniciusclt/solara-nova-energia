// =====================================================
// RASTREADOR DE PROGRESSO
// Sistema de Treinamentos Corporativos - Solara Nova Energia
// Versão: 1.0
// Data: 2024-12-12
// =====================================================

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Clock,
  Target,
  Award,
  BookOpen,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  RotateCcw,
  Calendar,
  User,
  Users,
  BarChart3,
  PieChart,
  Activity,
  Zap,
  Star,
  Trophy,
  Medal,
  Flame,
  ChevronRight,
  Filter,
  Download,
  Share2,
  Eye,
  AlertCircle,
  CheckSquare
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Progress } from '../../../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Separator } from '../../../components/ui/separator';
import { useUserProgress, useGamification, useTrainingReports } from '../hooks/useTraining';
import { useAuth } from '../../../contexts/AuthContext';
import type { UserProgress, GamificationData, TrainingReport } from '../types';

// =====================================================
// INTERFACES
// =====================================================

interface ProgressTrackerProps {
  userId?: string;
  moduleId?: string;
  showComparison?: boolean;
  viewMode?: 'personal' | 'team' | 'company';
}

interface ProgressStats {
  totalModules: number;
  completedModules: number;
  inProgressModules: number;
  totalHours: number;
  completedHours: number;
  averageScore: number;
  certificatesEarned: number;
  currentStreak: number;
  longestStreak: number;
  lastActivity: Date;
}

interface TimeFilter {
  period: 'week' | 'month' | 'quarter' | 'year';
  label: string;
}

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function ProgressTracker({ 
  userId, 
  moduleId, 
  showComparison = false, 
  viewMode = 'personal' 
}: ProgressTrackerProps) {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<TimeFilter>({ period: 'month', label: 'Último mês' });
  const [currentTab, setCurrentTab] = useState('overview');
  
  // Hooks
  const { progress, isLoading: progressLoading } = useUserProgress(userId || user?.id || '');
  const { gamificationData, ranking } = useGamification();
  const { reports } = useTrainingReports();
  
  // =====================================================
  // DADOS CALCULADOS
  // =====================================================
  
  const progressStats: ProgressStats = {
    totalModules: progress?.length || 0,
    completedModules: progress?.filter(p => p.completion_percentage === 100).length || 0,
    inProgressModules: progress?.filter(p => p.completion_percentage > 0 && p.completion_percentage < 100).length || 0,
    totalHours: progress?.reduce((acc, p) => acc + (p.total_duration || 0), 0) || 0,
    completedHours: progress?.reduce((acc, p) => acc + (p.time_spent || 0), 0) || 0,
    averageScore: progress?.reduce((acc, p) => acc + (p.best_score || 0), 0) / (progress?.length || 1) || 0,
    certificatesEarned: progress?.filter(p => p.certificate_earned).length || 0,
    currentStreak: gamificationData?.current_streak || 0,
    longestStreak: gamificationData?.longest_streak || 0,
    lastActivity: new Date(progress?.[0]?.last_accessed || Date.now())
  };
  
  const completionRate = progressStats.totalModules > 0 
    ? (progressStats.completedModules / progressStats.totalModules) * 100 
    : 0;
  
  const timeFilters: TimeFilter[] = [
    { period: 'week', label: 'Última semana' },
    { period: 'month', label: 'Último mês' },
    { period: 'quarter', label: 'Último trimestre' },
    { period: 'year', label: 'Último ano' }
  ];
  
  if (progressLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            {viewMode === 'personal' ? 'Meu Progresso' : 
             viewMode === 'team' ? 'Progresso da Equipe' : 'Progresso da Empresa'}
          </h2>
          <p className="text-gray-600">
            Acompanhe o desenvolvimento nos treinamentos
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Select 
            value={selectedPeriod.period} 
            onValueChange={(value) => {
              const filter = timeFilters.find(f => f.period === value);
              if (filter) setSelectedPeriod(filter);
            }}
          >
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {timeFilters.map(filter => (
                <SelectItem key={filter.period} value={filter.period}>
                  {filter.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>
      
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Módulos Concluídos"
          value={progressStats.completedModules}
          total={progressStats.totalModules}
          icon={CheckCircle}
          color="green"
          percentage={completionRate}
        />
        
        <StatsCard
          title="Horas de Estudo"
          value={Math.round(progressStats.completedHours / 60)}
          total={Math.round(progressStats.totalHours / 60)}
          icon={Clock}
          color="blue"
          suffix="h"
        />
        
        <StatsCard
          title="Nota Média"
          value={Math.round(progressStats.averageScore)}
          icon={Target}
          color="purple"
          suffix="%"
        />
        
        <StatsCard
          title="Certificados"
          value={progressStats.certificatesEarned}
          icon={Award}
          color="yellow"
        />
      </div>
      
      {/* Main Content */}
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="modules">Módulos</TabsTrigger>
          <TabsTrigger value="gamification">Gamificação</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        {/* Aba: Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Progress Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <span>Progresso Geral</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Conclusão Geral</span>
                    <span className="text-sm text-gray-600">{Math.round(completionRate)}%</span>
                  </div>
                  <Progress value={completionRate} className="w-full" />
                  
                  <div className="grid grid-cols-3 gap-4 pt-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {progressStats.completedModules}
                      </div>
                      <p className="text-xs text-gray-600">Concluídos</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {progressStats.inProgressModules}
                      </div>
                      <p className="text-xs text-gray-600">Em Progresso</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-gray-600">
                        {progressStats.totalModules - progressStats.completedModules - progressStats.inProgressModules}
                      </div>
                      <p className="text-xs text-gray-600">Não Iniciados</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {/* Activity Streak */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Flame className="h-5 w-5 text-orange-600" />
                  <span>Sequência de Estudos</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-orange-600 mb-2">
                      {progressStats.currentStreak}
                    </div>
                    <p className="text-gray-600">dias consecutivos</p>
                  </div>
                  
                  <Separator />
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Melhor sequência:</span>
                    <span className="font-medium">{progressStats.longestStreak} dias</span>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Última atividade:</span>
                    <span className="font-medium">
                      {progressStats.lastActivity.toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Recent Activity */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="h-5 w-5 text-green-600" />
                <span>Atividade Recente</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <RecentActivityList progress={progress} />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Aba: Módulos */}
        <TabsContent value="modules" className="space-y-6">
          <ModulesProgressList progress={progress} />
        </TabsContent>
        
        {/* Aba: Gamificação */}
        <TabsContent value="gamification" className="space-y-6">
          <GamificationPanel 
            gamificationData={gamificationData} 
            ranking={ranking}
            userStats={progressStats}
          />
        </TabsContent>
        
        {/* Aba: Analytics */}
        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsPanel reports={reports} period={selectedPeriod} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// =====================================================
// COMPONENTE: CARD DE ESTATÍSTICAS
// =====================================================

function StatsCard({ 
  title, 
  value, 
  total, 
  icon: Icon, 
  color, 
  percentage, 
  suffix = '' 
}: {
  title: string;
  value: number;
  total?: number;
  icon: any;
  color: 'green' | 'blue' | 'purple' | 'yellow';
  percentage?: number;
  suffix?: string;
}) {
  const colorClasses = {
    green: 'text-green-600 bg-green-100',
    blue: 'text-blue-600 bg-blue-100',
    purple: 'text-purple-600 bg-purple-100',
    yellow: 'text-yellow-600 bg-yellow-100'
  };
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className="flex items-baseline space-x-1">
              <p className="text-2xl font-bold text-gray-900">
                {value}{suffix}
              </p>
              {total && (
                <p className="text-sm text-gray-500">/ {total}{suffix}</p>
              )}
            </div>
            {percentage !== undefined && (
              <p className="text-xs text-gray-600 mt-1">
                {Math.round(percentage)}% concluído
              </p>
            )}
          </div>
          
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
        
        {percentage !== undefined && (
          <Progress value={percentage} className="mt-3" />
        )}
      </CardContent>
    </Card>
  );
}

// =====================================================
// COMPONENTE: LISTA DE ATIVIDADE RECENTE
// =====================================================

function RecentActivityList({ progress }: { progress: UserProgress[] }) {
  const recentActivities = progress
    ?.sort((a, b) => new Date(b.last_accessed).getTime() - new Date(a.last_accessed).getTime())
    ?.slice(0, 5) || [];
  
  if (recentActivities.length === 0) {
    return (
      <div className="text-center py-8">
        <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhuma atividade recente
        </h3>
        <p className="text-gray-600">
          Comece um módulo para ver sua atividade aqui
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {recentActivities.map((activity) => (
        <div key={activity.id} className="flex items-center space-x-4 p-3 border rounded-lg">
          <div className="p-2 bg-blue-100 rounded">
            <BookOpen className="h-4 w-4 text-blue-600" />
          </div>
          
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">
              {activity.module_title}
            </h4>
            <p className="text-sm text-gray-600">
              {activity.completion_percentage === 100 ? 'Concluído' : 
               activity.completion_percentage > 0 ? `${activity.completion_percentage}% concluído` : 'Iniciado'}
            </p>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-gray-600">
              {new Date(activity.last_accessed).toLocaleDateString('pt-BR')}
            </p>
            {activity.completion_percentage === 100 && (
              <Badge variant="secondary" className="mt-1">
                <CheckCircle className="h-3 w-3 mr-1" />
                Concluído
              </Badge>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// =====================================================
// COMPONENTE: LISTA DE PROGRESSO DOS MÓDULOS
// =====================================================

function ModulesProgressList({ progress }: { progress: UserProgress[] }) {
  const [sortBy, setSortBy] = useState<'name' | 'progress' | 'score' | 'date'>('progress');
  
  const sortedProgress = [...(progress || [])].sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.module_title.localeCompare(b.module_title);
      case 'progress':
        return b.completion_percentage - a.completion_percentage;
      case 'score':
        return (b.best_score || 0) - (a.best_score || 0);
      case 'date':
        return new Date(b.last_accessed).getTime() - new Date(a.last_accessed).getTime();
      default:
        return 0;
    }
  });
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Progresso por Módulo</CardTitle>
          <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="progress">Por Progresso</SelectItem>
              <SelectItem value="name">Por Nome</SelectItem>
              <SelectItem value="score">Por Nota</SelectItem>
              <SelectItem value="date">Por Data</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {sortedProgress.map((item) => (
            <div key={item.id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">
                    {item.module_title}
                  </h4>
                  <p className="text-sm text-gray-600">
                    Última atividade: {new Date(item.last_accessed).toLocaleDateString('pt-BR')}
                  </p>
                </div>
                
                <div className="flex items-center space-x-3">
                  {item.best_score && (
                    <Badge variant="outline">
                      {item.best_score}%
                    </Badge>
                  )}
                  
                  {item.completion_percentage === 100 ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Concluído
                    </Badge>
                  ) : item.completion_percentage > 0 ? (
                    <Badge variant="outline">
                      Em Progresso
                    </Badge>
                  ) : (
                    <Badge variant="secondary">
                      Não Iniciado
                    </Badge>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progresso</span>
                  <span>{item.completion_percentage}%</span>
                </div>
                <Progress value={item.completion_percentage} className="w-full" />
              </div>
              
              <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
                <span>
                  {Math.round((item.time_spent || 0) / 60)} min de {Math.round((item.total_duration || 0) / 60)} min
                </span>
                
                <Button variant="ghost" size="sm">
                  {item.completion_percentage === 0 ? 'Iniciar' : 'Continuar'}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// =====================================================
// COMPONENTE: PAINEL DE GAMIFICAÇÃO
// =====================================================

function GamificationPanel({ 
  gamificationData, 
  ranking, 
  userStats 
}: {
  gamificationData: GamificationData;
  ranking: any[];
  userStats: ProgressStats;
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Badges e Conquistas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Medal className="h-5 w-5 text-yellow-600" />
            <span>Badges e Conquistas</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4">
            {gamificationData?.badges?.map((badge) => (
              <div key={badge.id} className="text-center p-3 border rounded-lg">
                <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Trophy className="h-6 w-6 text-yellow-600" />
                </div>
                <h4 className="text-sm font-medium">{badge.name}</h4>
                <p className="text-xs text-gray-600">{badge.description}</p>
              </div>
            )) || (
              <div className="col-span-3 text-center py-8">
                <Medal className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Nenhum badge conquistado ainda</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Ranking */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5 text-blue-600" />
            <span>Ranking da Empresa</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ranking?.slice(0, 5).map((user, index) => (
              <div key={user.id} className="flex items-center space-x-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === 0 ? 'bg-yellow-100 text-yellow-800' :
                  index === 1 ? 'bg-gray-100 text-gray-800' :
                  index === 2 ? 'bg-orange-100 text-orange-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {index + 1}
                </div>
                
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-gray-600">{user.total_points} pontos</p>
                </div>
                
                {index < 3 && (
                  <div className="text-right">
                    {index === 0 && <Trophy className="h-4 w-4 text-yellow-600" />}
                    {index === 1 && <Medal className="h-4 w-4 text-gray-600" />}
                    {index === 2 && <Award className="h-4 w-4 text-orange-600" />}
                  </div>
                )}
              </div>
            )) || (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Ranking não disponível</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Pontos e Nível */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-purple-600" />
            <span>Pontuação</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">
                {gamificationData?.total_points || 0}
              </div>
              <p className="text-gray-600">pontos totais</p>
            </div>
            
            <Separator />
            
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Nível {gamificationData?.level || 1}</span>
                <span>{gamificationData?.points_to_next_level || 0} para próximo nível</span>
              </div>
              <Progress 
                value={((gamificationData?.level_progress || 0) / (gamificationData?.points_to_next_level || 1)) * 100} 
                className="w-full" 
              />
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Estatísticas Detalhadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-green-600" />
            <span>Estatísticas</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Sequência atual:</span>
              <span className="font-medium">{userStats.currentStreak} dias</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Melhor sequência:</span>
              <span className="font-medium">{userStats.longestStreak} dias</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Certificados:</span>
              <span className="font-medium">{userStats.certificatesEarned}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Nota média:</span>
              <span className="font-medium">{Math.round(userStats.averageScore)}%</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =====================================================
// COMPONENTE: PAINEL DE ANALYTICS
// =====================================================

function AnalyticsPanel({ 
  reports, 
  period 
}: {
  reports: TrainingReport[];
  period: TimeFilter;
}) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PieChart className="h-5 w-5 text-blue-600" />
            <span>Analytics Detalhado - {period.label}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Analytics em Desenvolvimento
            </h3>
            <p className="text-gray-600">
              Gráficos e relatórios detalhados serão implementados em breve
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default ProgressTracker;