// =====================================================
// PÁGINA DE DASHBOARD ADMINISTRATIVO
// Sistema de Treinamentos Corporativos - Solara Nova Energia
// Versão: 1.0
// Data: 2024-12-12
// =====================================================

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Users,
  BookOpen,
  Award,
  BarChart3,
  TrendingUp,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  Plus,
  Settings,
  Download,
  Filter,
  Calendar,
  Eye
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Progress } from '../../../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Input } from '../../../components/ui/input';
import { useAuth } from '../../../contexts/AuthContext';
import { useAdminStats, useAdminReports } from '../hooks/useTraining';
import { SidebarToggle } from '../../../core/components/layout/SidebarToggle';
import { useToast } from '../../../hooks/use-toast';

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

const AdminDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [searchTerm, setSearchTerm] = useState('');

  const {
    data: adminStats,
    isLoading: statsLoading
  } = useAdminStats(selectedPeriod);

  const {
    data: reports,
    isLoading: reportsLoading
  } = useAdminReports();

  // =====================================================
  // HANDLERS
  // =====================================================

  const handleBackToTraining = () => {
    navigate('/training');
  };

  const handleCreateModule = () => {
    navigate('/training/modules/new');
  };

  const handleViewModule = (moduleId: string) => {
    navigate(`/training/modules/${moduleId}`);
  };

  const handleViewUser = (userId: string) => {
    // Implementar página de usuário ou mostrar modal
    toast({
      title: "Funcionalidade em desenvolvimento",
      description: "A visualização detalhada de usuários será implementada em breve."
    });
  };

  const handleExportReport = () => {
    console.log('Exporting report...');
  };

  // =====================================================
  // LOADING STATE
  // =====================================================

  if (statsLoading || reportsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-7xl mx-auto">
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
      <div className="max-w-7xl mx-auto">
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
                <h1 className="text-3xl font-bold text-gray-900">Dashboard Administrativo</h1>
                <p className="text-gray-600 mt-1">Gerencie treinamentos e acompanhe métricas</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleBackToTraining} variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <Button onClick={handleCreateModule}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Módulo
              </Button>
            </div>
          </div>

          {/* Period Filter */}
          <div className="flex items-center gap-4 mb-6">
            <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Selecionar período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Último mês</SelectItem>
                <SelectItem value="quarter">Último trimestre</SelectItem>
                <SelectItem value="year">Último ano</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExportReport} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Exportar Relatório
            </Button>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total de Usuários</p>
                    <p className="text-2xl font-bold text-blue-600">{adminStats?.totalUsers || 0}</p>
                    <p className="text-xs text-green-600 mt-1">+{adminStats?.newUsersThisPeriod || 0} novos</p>
                  </div>
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Módulos Ativos</p>
                    <p className="text-2xl font-bold text-green-600">{adminStats?.activeModules || 0}</p>
                    <p className="text-xs text-blue-600 mt-1">{adminStats?.totalModules || 0} total</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Taxa de Conclusão</p>
                    <p className="text-2xl font-bold text-purple-600">{adminStats?.completionRate || 0}%</p>
                    <p className="text-xs text-green-600 mt-1">+{adminStats?.completionRateChange || 0}% vs anterior</p>
                  </div>
                  <Target className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Horas de Treinamento</p>
                    <p className="text-2xl font-bold text-orange-600">{adminStats?.totalHours || 0}h</p>
                    <p className="text-xs text-green-600 mt-1">+{adminStats?.hoursThisPeriod || 0}h este período</p>
                  </div>
                  <Clock className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="modules">Módulos</TabsTrigger>
              <TabsTrigger value="users">Usuários</TabsTrigger>
              <TabsTrigger value="reports">Relatórios</TabsTrigger>
              <TabsTrigger value="settings">Configurações</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Activity */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Atividade Recente
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {adminStats?.recentActivity?.map((activity, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">{activity.description}</p>
                          <p className="text-xs text-gray-500">{activity.timestamp}</p>
                        </div>
                      </div>
                    )) || (
                      <p className="text-gray-500 text-center py-8">Nenhuma atividade recente</p>
                    )}
                  </CardContent>
                </Card>

                {/* Top Performing Modules */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Award className="h-5 w-5" />
                      Módulos com Melhor Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {adminStats?.topModules?.map((module, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium">{module.title}</p>
                          <p className="text-sm text-gray-600">{module.enrollments} inscrições</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-green-600">{module.completionRate}%</p>
                          <p className="text-xs text-gray-500">conclusão</p>
                        </div>
                      </div>
                    )) || (
                      <p className="text-gray-500 text-center py-8">Nenhum dado disponível</p>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Progresso de Treinamentos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      Gráfico de progresso
                      <br />
                      (Implementação futura)
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Engajamento dos Usuários</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center text-gray-500">
                      Gráfico de engajamento
                      <br />
                      (Implementação futura)
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Modules Tab */}
            <TabsContent value="modules" className="space-y-6">
              <div className="flex items-center gap-4 mb-4">
                <Input
                  placeholder="Buscar módulos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {adminStats?.modules?.map((module, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer"
                        onClick={() => handleViewModule(module.id)}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold">{module.title}</h3>
                        <Badge variant={module.status === 'active' ? 'default' : 'secondary'}>
                          {module.status === 'active' ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-4">{module.description}</p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Inscrições:</span>
                          <span className="font-medium">{module.enrollments}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Conclusões:</span>
                          <span className="font-medium">{module.completions}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Taxa de conclusão:</span>
                          <span className="font-medium text-green-600">{module.completionRate}%</span>
                        </div>
                      </div>
                      <Progress value={module.completionRate} className="mt-3" />
                    </CardContent>
                  </Card>
                )) || (
                  <p className="text-gray-500 text-center py-8 col-span-full">Nenhum módulo encontrado</p>
                )}
              </div>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-6">
              <div className="flex items-center gap-4 mb-4">
                <Input
                  placeholder="Buscar usuários..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="max-w-sm"
                />
                <Select>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Usuário</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Módulos</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Progresso</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Último Acesso</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {adminStats?.users?.map((user, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                  <span className="text-sm font-medium text-blue-600">
                                    {user.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                                <div className="ml-4">
                                  <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                  <div className="text-sm text-gray-500">{user.email}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{user.enrolledModules}</div>
                              <div className="text-sm text-gray-500">{user.completedModules} concluídos</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                  <div className="bg-blue-600 h-2 rounded-full" style={{width: `${user.overallProgress}%`}}></div>
                                </div>
                                <span className="text-sm text-gray-900">{user.overallProgress}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {user.lastAccess}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <Button size="sm" variant="outline" onClick={() => handleViewUser(user.id)}>
                                <Eye className="h-3 w-3 mr-1" />
                                Ver
                              </Button>
                            </td>
                          </tr>
                        )) || (
                          <tr>
                            <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                              Nenhum usuário encontrado
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Reports Tab */}
            <TabsContent value="reports" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {reports?.map((report, index) => (
                  <Card key={index} className="hover:shadow-lg transition-shadow cursor-pointer">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-semibold">{report.title}</h3>
                        <BarChart3 className="h-5 w-5 text-gray-400" />
                      </div>
                      <p className="text-sm text-gray-600 mb-4">{report.description}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Atualizado: {report.lastUpdated}</span>
                        <Button size="sm">
                          <Download className="h-3 w-3 mr-1" />
                          Baixar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )) || (
                  <p className="text-gray-500 text-center py-8 col-span-full">Nenhum relatório disponível</p>
                )}
              </div>
            </TabsContent>

            {/* Settings Tab */}
            <TabsContent value="settings" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Configurações do Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div>
                      <h4 className="font-medium mb-2">Configurações Gerais</h4>
                      <p className="text-sm text-gray-600 mb-4">Configure as opções básicas do sistema de treinamentos.</p>
                      <Button variant="outline">
                        Configurar
                      </Button>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Notificações</h4>
                      <p className="text-sm text-gray-600 mb-4">Gerencie as configurações de notificações automáticas.</p>
                      <Button variant="outline">
                        Configurar
                      </Button>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Backup e Segurança</h4>
                      <p className="text-sm text-gray-600 mb-4">Configure backups automáticos e políticas de segurança.</p>
                      <Button variant="outline">
                        Configurar
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;