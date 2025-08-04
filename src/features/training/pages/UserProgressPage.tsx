// =====================================================
// PÁGINA DE PROGRESSO DO USUÁRIO
// Sistema de Treinamentos Corporativos - Solara Nova Energia
// Versão: 1.0
// Data: 2024-12-12
// =====================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Trophy,
  Target,
  Clock,
  BookOpen,
  Award,
  TrendingUp,
  Calendar,
  BarChart3,
  CheckCircle,
  PlayCircle,
  Star,
  Zap
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Progress } from '../../../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { useAuth } from '../../../contexts/AuthContext';
import { useUserProgress, useUserAchievements, useUserStats } from '../hooks/useTraining';
import { SidebarToggle } from '../../../components/sidebar';

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

const UserProgressPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState('month');

  const {
    data: userProgress,
    isLoading: progressLoading
  } = useUserProgress();

  const {
    data: achievements,
    isLoading: achievementsLoading
  } = useUserAchievements();

  const {
    data: stats,
    isLoading: statsLoading
  } = useUserStats(selectedPeriod);

  // =====================================================
  // HANDLERS
  // =====================================================

  const handleBackToTraining = () => {
    navigate('/training');
  };

  const handleModuleClick = (moduleId: string) => {
    navigate(`/training/modules/${moduleId}`);
  };

  // =====================================================
  // LOADING STATE
  // =====================================================

  if (progressLoading || achievementsLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  // =====================================================
  // RENDER PRINCIPAL
  // =====================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-4">
              <SidebarToggle />
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Meu Progresso</h1>
                <p className="text-gray-600 mt-1">Acompanhe seu desenvolvimento nos treinamentos</p>
              </div>
            </div>
            <Button onClick={handleBackToTraining} variant="outline">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar aos Treinamentos
            </Button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Módulos Concluídos</p>
                    <p className="text-2xl font-bold text-green-600">{stats?.completedModules || 0}</p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Horas de Estudo</p>
                    <p className="text-2xl font-bold text-blue-600">{stats?.studyHours || 0}h</p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Pontuação Total</p>
                    <p className="text-2xl font-bold text-purple-600">{stats?.totalPoints || 0}</p>
                  </div>
                  <Star className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Ranking</p>
                    <p className="text-2xl font-bold text-orange-600">#{stats?.ranking || 0}</p>
                  </div>
                  <Trophy className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="progress" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="progress">Progresso</TabsTrigger>
              <TabsTrigger value="achievements">Conquistas</TabsTrigger>
              <TabsTrigger value="certificates">Certificados</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            {/* Progress Tab */}
            <TabsContent value="progress" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Current Modules */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="h-5 w-5" />
                      Módulos em Andamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {userProgress?.inProgress?.map((module, index) => (
                      <div key={index} className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                           onClick={() => handleModuleClick(module.id)}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{module.title}</h4>
                          <Badge variant="secondary">{module.progress}%</Badge>
                        </div>
                        <Progress value={module.progress} className="h-2 mb-2" />
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {module.timeSpent}h estudadas
                          </span>
                          <span className="flex items-center gap-1">
                            <PlayCircle className="h-3 w-3" />
                            {module.completedLessons}/{module.totalLessons} aulas
                          </span>
                        </div>
                      </div>
                    )) || (
                      <p className="text-gray-500 text-center py-8">Nenhum módulo em andamento</p>
                    )}
                  </CardContent>
                </Card>

                {/* Completed Modules */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Módulos Concluídos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {userProgress?.completed?.map((module, index) => (
                      <div key={index} className="p-4 border rounded-lg bg-green-50 border-green-200">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{module.title}</h4>
                          <Badge variant="default" className="bg-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Concluído
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Award className="h-3 w-3" />
                            Nota: {module.finalScore}%
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(module.completedAt).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>
                    )) || (
                      <p className="text-gray-500 text-center py-8">Nenhum módulo concluído ainda</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Achievements Tab */}
            <TabsContent value="achievements" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {achievements?.map((achievement, index) => (
                  <Card key={index} className={`${achievement.unlocked ? 'bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200' : 'bg-gray-50'}`}>
                    <CardContent className="p-6 text-center">
                      <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                        achievement.unlocked ? 'bg-yellow-100 text-yellow-600' : 'bg-gray-200 text-gray-400'
                      }`}>
                        <Trophy className="h-8 w-8" />
                      </div>
                      <h3 className="font-semibold mb-2">{achievement.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{achievement.description}</p>
                      {achievement.unlocked ? (
                        <Badge variant="default" className="bg-yellow-600">
                          <Award className="h-3 w-3 mr-1" />
                          Conquistado
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          {achievement.progress}/{achievement.target}
                        </Badge>
                      )}
                      {achievement.unlocked && achievement.unlockedAt && (
                        <p className="text-xs text-gray-500 mt-2">
                          {new Date(achievement.unlockedAt).toLocaleDateString('pt-BR')}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )) || (
                  <p className="text-gray-500 text-center py-8 col-span-full">Nenhuma conquista disponível</p>
                )}
              </div>
            </TabsContent>

            {/* Certificates Tab */}
            <TabsContent value="certificates" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userProgress?.certificates?.map((certificate, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => navigate(`/training/certificates/${certificate.id}`)}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Award className="h-6 w-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1">{certificate.moduleName}</h3>
                          <p className="text-sm text-gray-600 mb-2">{certificate.description}</p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Emitido em {new Date(certificate.issuedAt).toLocaleDateString('pt-BR')}</span>
                            <span>Nota: {certificate.finalScore}%</span>
                          </div>
                        </div>
                        <Badge variant="default" className="bg-green-600">
                          Válido
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                )) || (
                  <p className="text-gray-500 text-center py-8 col-span-full">Nenhum certificado emitido ainda</p>
                )}
              </div>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Study Time Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Tempo de Estudo
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      Gráfico de tempo de estudo
                      <br />
                      (Implementação futura)
                    </div>
                  </CardContent>
                </Card>

                {/* Performance Chart */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      Gráfico de performance
                      <br />
                      (Implementação futura)
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default UserProgressPage;