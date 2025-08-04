// =====================================================
// PÁGINA DE ADMINISTRAÇÃO
// Sistema de Treinamentos Corporativos - Solara Nova Energia
// Versão: 1.0
// Data: 2024-12-12
// =====================================================

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  BookOpen,
  Award,
  BarChart3,
  Settings,
  Shield,
  Database,
  FileText,
  Video,
  Upload,
  Download,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Eye,
  Edit,
  Trash2,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Calendar,
  Star,
  Target,
  Zap,
  Bell,
  Mail,
  MessageSquare,
  Globe,
  Lock,
  Key,
  UserCheck,
  UserX,
  Activity,
  HardDrive,
  Cpu,
  Wifi,
  Server,
  Monitor,
  Smartphone,
  Tablet,
  Chrome,
  Firefox,
  Safari
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Progress } from '../../../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/table';
import { Input } from '../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Switch } from '../../../components/ui/switch';
import { Textarea } from '../../../components/ui/textarea';
import { Separator } from '../../../components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '../../../components/ui/alert';
import { useAuth } from '../../../contexts/AuthContext';
import { useTrainingReports } from '../hooks/useTraining';

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function AdminPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const { data: reports } = useTrainingReports();
  
  // Verificar permissões de admin
  if (user?.role !== 'admin') {
    return (
      <div className="text-center py-12">
        <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Acesso Negado
        </h2>
        <p className="text-gray-600">
          Você não tem permissão para acessar esta página.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Administração</h1>
          <p className="text-gray-600 mt-1">
            Painel de controle e configurações do sistema de treinamentos
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Exportar Dados
          </Button>
          <Button>
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </Button>
        </div>
      </div>
      
      {/* System Status */}
      <SystemStatusCard />
      
      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="content">Conteúdo</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="system">Sistema</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <OverviewTab reports={reports} />
        </TabsContent>
        
        <TabsContent value="users" className="space-y-6">
          <UsersTab />
        </TabsContent>
        
        <TabsContent value="content" className="space-y-6">
          <ContentTab />
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsTab />
        </TabsContent>
        
        <TabsContent value="system" className="space-y-6">
          <SystemTab />
        </TabsContent>
        
        <TabsContent value="settings" className="space-y-6">
          <SettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// =====================================================
// COMPONENTE: STATUS DO SISTEMA
// =====================================================

function SystemStatusCard() {
  const systemStatus = {
    status: 'operational',
    uptime: '99.9%',
    lastUpdate: new Date(),
    services: [
      { name: 'API', status: 'operational', responseTime: '120ms' },
      { name: 'Database', status: 'operational', responseTime: '45ms' },
      { name: 'Video Storage', status: 'operational', responseTime: '200ms' },
      { name: 'CDN', status: 'operational', responseTime: '80ms' }
    ]
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2 text-green-600" />
              Status do Sistema
            </CardTitle>
            <CardDescription>
              Monitoramento em tempo real dos serviços
            </CardDescription>
          </div>
          
          <div className="flex items-center space-x-2">
            <Badge variant="default" className="bg-green-600">
              <CheckCircle className="h-3 w-3 mr-1" />
              Operacional
            </Badge>
            <span className="text-sm text-gray-600">
              Uptime: {systemStatus.uptime}
            </span>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {systemStatus.services.map((service, index) => (
            <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <p className="font-medium text-sm">{service.name}</p>
                <p className="text-xs text-gray-600">{service.responseTime}</p>
              </div>
              <div className="w-2 h-2 bg-green-500 rounded-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// =====================================================
// ABA: VISÃO GERAL
// =====================================================

function OverviewTab({ reports }: { reports: any }) {
  const stats = [
    {
      title: 'Total de Usuários',
      value: '1,234',
      change: '+12%',
      trend: 'up',
      icon: Users,
      color: 'text-blue-600'
    },
    {
      title: 'Módulos Ativos',
      value: '45',
      change: '+3',
      trend: 'up',
      icon: BookOpen,
      color: 'text-green-600'
    },
    {
      title: 'Certificados Emitidos',
      value: '892',
      change: '+18%',
      trend: 'up',
      icon: Award,
      color: 'text-purple-600'
    },
    {
      title: 'Taxa de Conclusão',
      value: '87%',
      change: '+5%',
      trend: 'up',
      icon: Target,
      color: 'text-orange-600'
    }
  ];
  
  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const TrendIcon = stat.trend === 'up' ? TrendingUp : TrendingDown;
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stat.value}
                      </p>
                      <div className={`flex items-center mt-1 text-sm ${
                        stat.trend === 'up' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <TrendIcon className="h-4 w-4 mr-1" />
                        {stat.change}
                      </div>
                    </div>
                    <div className={`p-3 rounded-full bg-gray-50`}>
                      <Icon className={`h-6 w-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
      
      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivityCard />
        <QuickActionsCard />
      </div>
      
      {/* Alerts */}
      <AlertsCard />
    </div>
  );
}

// =====================================================
// ABA: USUÁRIOS
// =====================================================

function UsersTab() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  
  // Mock data
  const users = [
    {
      id: '1',
      name: 'João Silva',
      email: 'joao@solara.com',
      role: 'employee',
      department: 'Vendas',
      status: 'active',
      lastAccess: '2024-12-12T10:30:00Z',
      completedModules: 12,
      totalModules: 15,
      avatar: null
    },
    {
      id: '2',
      name: 'Maria Santos',
      email: 'maria@solara.com',
      role: 'manager',
      department: 'Técnico',
      status: 'active',
      lastAccess: '2024-12-12T09:15:00Z',
      completedModules: 20,
      totalModules: 22,
      avatar: null
    }
    // Mais usuários...
  ];
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">Gerenciamento de Usuários</h2>
          <p className="text-gray-600 mt-1">
            {users.length} usuário{users.length !== 1 ? 's' : ''} cadastrado{users.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>
      
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar usuários..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={filterRole} onValueChange={setFilterRole}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por cargo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os cargos</SelectItem>
            <SelectItem value="admin">Administrador</SelectItem>
            <SelectItem value="manager">Gerente</SelectItem>
            <SelectItem value="employee">Funcionário</SelectItem>
          </SelectContent>
        </Select>
      </div>
      
      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuário</TableHead>
                <TableHead>Cargo</TableHead>
                <TableHead>Departamento</TableHead>
                <TableHead>Progresso</TableHead>
                <TableHead>Último Acesso</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.avatar || undefined} />
                        <AvatarFallback>
                          {user.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-600">{user.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {user.role === 'admin' ? 'Admin' :
                       user.role === 'manager' ? 'Gerente' : 'Funcionário'}
                    </Badge>
                  </TableCell>
                  <TableCell>{user.department}</TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-sm">
                        <span>{user.completedModules}/{user.totalModules}</span>
                        <span>{Math.round((user.completedModules / user.totalModules) * 100)}%</span>
                      </div>
                      <Progress 
                        value={(user.completedModules / user.totalModules) * 100} 
                        className="h-2" 
                      />
                    </div>
                  </TableCell>
                  <TableCell>
                    {new Date(user.lastAccess).toLocaleDateString('pt-BR')}
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant={user.status === 'active' ? 'default' : 'secondary'}
                    >
                      {user.status === 'active' ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-48" align="end">
                        <div className="space-y-1">
                          <Button variant="ghost" size="sm" className="w-full justify-start">
                            <Eye className="h-4 w-4 mr-2" />
                            Visualizar
                          </Button>
                          <Button variant="ghost" size="sm" className="w-full justify-start">
                            <Edit className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                          <Button variant="ghost" size="sm" className="w-full justify-start">
                            <UserCheck className="h-4 w-4 mr-2" />
                            Resetar Senha
                          </Button>
                          <Separator />
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="w-full justify-start text-red-600 hover:text-red-700"
                          >
                            <UserX className="h-4 w-4 mr-2" />
                            Desativar
                          </Button>
                        </div>
                      </PopoverContent>
                    </Popover>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// =====================================================
// ABA: CONTEÚDO
// =====================================================

function ContentTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <ContentStatsCard />
        <VideoManagementCard />
        <ContentModerationCard />
      </div>
      
      <ContentListCard />
    </div>
  );
}

// =====================================================
// ABA: ANALYTICS
// =====================================================

function AnalyticsTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EngagementMetricsCard />
        <CompletionRatesCard />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PopularContentCard />
        <UserBehaviorCard />
      </div>
    </div>
  );
}

// =====================================================
// ABA: SISTEMA
// =====================================================

function SystemTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SystemResourcesCard />
        <DatabaseStatusCard />
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <BackupStatusCard />
        <SecurityLogsCard />
      </div>
    </div>
  );
}

// =====================================================
// ABA: CONFIGURAÇÕES
// =====================================================

function SettingsTab() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <GeneralSettingsCard />
        <NotificationSettingsCard />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SecuritySettingsCard />
        <IntegrationSettingsCard />
      </div>
    </div>
  );
}

// =====================================================
// COMPONENTES AUXILIARES
// =====================================================

function RecentActivityCard() {
  const activities = [
    {
      type: 'user_registered',
      user: 'João Silva',
      action: 'se cadastrou no sistema',
      time: '2 min atrás',
      icon: Users
    },
    {
      type: 'module_completed',
      user: 'Maria Santos',
      action: 'concluiu o módulo "Energia Solar"',
      time: '15 min atrás',
      icon: CheckCircle
    },
    {
      type: 'content_uploaded',
      user: 'Admin',
      action: 'adicionou novo vídeo',
      time: '1 hora atrás',
      icon: Video
    }
  ];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Atividade Recente</CardTitle>
        <CardDescription>
          Últimas ações no sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-64">
          <div className="space-y-4">
            {activities.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div key={index} className="flex items-start space-x-3">
                  <div className="p-2 bg-gray-100 rounded-full">
                    <Icon className="h-4 w-4 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      <span className="font-medium">{activity.user}</span>
                      {' '}{activity.action}
                    </p>
                    <p className="text-xs text-gray-600">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

function QuickActionsCard() {
  const actions = [
    {
      title: 'Novo Módulo',
      description: 'Criar módulo de treinamento',
      icon: Plus,
      color: 'text-blue-600'
    },
    {
      title: 'Upload de Vídeo',
      description: 'Adicionar novo conteúdo',
      icon: Upload,
      color: 'text-green-600'
    },
    {
      title: 'Relatório',
      description: 'Gerar relatório de progresso',
      icon: FileText,
      color: 'text-purple-600'
    },
    {
      title: 'Backup',
      description: 'Fazer backup do sistema',
      icon: Database,
      color: 'text-orange-600'
    }
  ];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Ações Rápidas</CardTitle>
        <CardDescription>
          Acesso rápido às principais funcionalidades
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => {
            const Icon = action.icon;
            return (
              <Button
                key={index}
                variant="outline"
                className="h-auto p-4 flex flex-col items-center space-y-2"
              >
                <Icon className={`h-6 w-6 ${action.color}`} />
                <div className="text-center">
                  <p className="font-medium text-sm">{action.title}</p>
                  <p className="text-xs text-gray-600">{action.description}</p>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function AlertsCard() {
  const alerts = [
    {
      type: 'warning',
      title: 'Espaço em disco baixo',
      description: 'O servidor de vídeos está com 85% de capacidade utilizada.',
      time: '30 min atrás'
    },
    {
      type: 'info',
      title: 'Atualização disponível',
      description: 'Nova versão do sistema disponível para instalação.',
      time: '2 horas atrás'
    }
  ];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Alertas do Sistema</CardTitle>
        <CardDescription>
          Notificações importantes que requerem atenção
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {alerts.map((alert, index) => (
          <Alert key={index} className={alert.type === 'warning' ? 'border-orange-200' : 'border-blue-200'}>
            {alert.type === 'warning' ? (
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            ) : (
              <Bell className="h-4 w-4 text-blue-600" />
            )}
            <AlertTitle>{alert.title}</AlertTitle>
            <AlertDescription>
              {alert.description}
              <span className="block text-xs text-gray-500 mt-1">{alert.time}</span>
            </AlertDescription>
          </Alert>
        ))}
      </CardContent>
    </Card>
  );
}

// Placeholder components for other cards
function ContentStatsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Estatísticas de Conteúdo</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Total de Vídeos</span>
            <span className="font-semibold">156</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Documentos</span>
            <span className="font-semibold">89</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Quizzes</span>
            <span className="font-semibold">45</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function VideoManagementCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Vídeos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Processando</span>
            <span className="font-semibold text-orange-600">3</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Armazenamento</span>
            <span className="font-semibold">12.5 GB</span>
          </div>
          <Progress value={65} className="h-2" />
          <p className="text-xs text-gray-600">65% do limite utilizado</p>
        </div>
      </CardContent>
    </Card>
  );
}

function ContentModerationCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Moderação</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Pendente Revisão</span>
            <span className="font-semibold text-yellow-600">7</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Aprovados</span>
            <span className="font-semibold text-green-600">234</span>
          </div>
          <Button size="sm" className="w-full">
            Revisar Conteúdo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function ContentListCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Lista de Conteúdo</CardTitle>
        <CardDescription>
          Gerenciar todo o conteúdo do sistema
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Lista de conteúdo será implementada aqui...</p>
      </CardContent>
    </Card>
  );
}

// Placeholder para outros componentes...
function EngagementMetricsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Métricas de Engajamento</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Gráficos de engajamento...</p>
      </CardContent>
    </Card>
  );
}

function CompletionRatesCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Taxa de Conclusão</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Gráficos de conclusão...</p>
      </CardContent>
    </Card>
  );
}

function PopularContentCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Conteúdo Popular</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Lista de conteúdo mais acessado...</p>
      </CardContent>
    </Card>
  );
}

function UserBehaviorCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Comportamento do Usuário</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-gray-600">Analytics de comportamento...</p>
      </CardContent>
    </Card>
  );
}

function SystemResourcesCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recursos do Sistema</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">CPU</span>
              <span className="text-sm font-medium">45%</span>
            </div>
            <Progress value={45} className="h-2" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Memória</span>
              <span className="text-sm font-medium">67%</span>
            </div>
            <Progress value={67} className="h-2" />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">Disco</span>
              <span className="text-sm font-medium">82%</span>
            </div>
            <Progress value={82} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DatabaseStatusCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Status do Banco de Dados</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Conexões Ativas</span>
            <span className="font-semibold">23/100</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Tamanho do DB</span>
            <span className="font-semibold">2.4 GB</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Último Backup</span>
            <span className="font-semibold">Hoje, 03:00</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function BackupStatusCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Status de Backup</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Último Backup</span>
            <span className="font-semibold text-green-600">Sucesso</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">Próximo Backup</span>
            <span className="font-semibold">Amanhã, 03:00</span>
          </div>
          <Button size="sm" className="w-full">
            Fazer Backup Agora
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SecurityLogsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Logs de Segurança</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="text-sm">
            <span className="text-gray-600">Login suspeito detectado</span>
            <span className="block text-xs text-gray-500">IP: 192.168.1.100 - 2h atrás</span>
          </div>
          <div className="text-sm">
            <span className="text-gray-600">Tentativa de acesso negada</span>
            <span className="block text-xs text-gray-500">IP: 10.0.0.50 - 4h atrás</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function GeneralSettingsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações Gerais</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Modo de Manutenção</p>
            <p className="text-sm text-gray-600">Desabilitar acesso ao sistema</p>
          </div>
          <Switch />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Registro Automático</p>
            <p className="text-sm text-gray-600">Permitir auto-registro de usuários</p>
          </div>
          <Switch defaultChecked />
        </div>
      </CardContent>
    </Card>
  );
}

function NotificationSettingsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações de Notificação</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Email de Conclusão</p>
            <p className="text-sm text-gray-600">Enviar email ao concluir módulo</p>
          </div>
          <Switch defaultChecked />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Lembretes de Prazo</p>
            <p className="text-sm text-gray-600">Notificar sobre prazos próximos</p>
          </div>
          <Switch defaultChecked />
        </div>
      </CardContent>
    </Card>
  );
}

function SecuritySettingsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Configurações de Segurança</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Autenticação 2FA</p>
            <p className="text-sm text-gray-600">Exigir autenticação de dois fatores</p>
          </div>
          <Switch />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Sessão Única</p>
            <p className="text-sm text-gray-600">Permitir apenas uma sessão por usuário</p>
          </div>
          <Switch defaultChecked />
        </div>
      </CardContent>
    </Card>
  );
}

function IntegrationSettingsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Integrações</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">API Externa</p>
            <p className="text-sm text-gray-600">Conectar com sistemas externos</p>
          </div>
          <Switch />
        </div>
        <Separator />
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium">Webhook</p>
            <p className="text-sm text-gray-600">Enviar eventos para URL externa</p>
          </div>
          <Switch />
        </div>
      </CardContent>
    </Card>
  );
}

export default AdminPage;