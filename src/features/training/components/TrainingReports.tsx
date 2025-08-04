// =====================================================
// RELATÓRIOS DE TREINAMENTOS
// Sistema de Treinamentos Corporativos - Solara Nova Energia
// Versão: 1.0
// Data: 2024-12-12
// =====================================================

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Users,
  BookOpen,
  Clock,
  Trophy,
  Target,
  Calendar,
  Download,
  Filter,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  AlertCircle,
  Star,
  Award,
  Zap,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  FileText,
  Mail,
  Share2,
  Settings,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronRight,
  Info,
  HelpCircle,
  ExternalLink,
  Maximize2,
  Minimize2,
  MoreVertical,
  Plus,
  Search,
  SlidersHorizontal
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { DatePicker } from '../../../components/ui/date-picker';
import { Separator } from '../../../components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../components/ui/tooltip';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Input } from '../../../components/ui/input';
import { Label } from '../../../components/ui/label';
import { Checkbox } from '../../../components/ui/checkbox';
import { Progress } from '../../../components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { useAuth } from '../../../contexts/AuthContext';
import { useTrainingReports } from '../hooks/useTraining';
import type { TrainingReport, ModuleReport } from '../types';

// =====================================================
// INTERFACES
// =====================================================

interface TrainingReportsProps {
  companyId?: string;
  moduleId?: string;
  userId?: string;
  dateRange?: {
    start: Date;
    end: Date;
  };
}

interface ReportFilter {
  dateRange: 'week' | 'month' | 'quarter' | 'year' | 'custom';
  customDateRange?: {
    start: Date;
    end: Date;
  };
  departments: string[];
  roles: string[];
  modules: string[];
  status: 'all' | 'completed' | 'in_progress' | 'not_started';
}

interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'area';
  metric: string;
  groupBy: string;
  showTrend: boolean;
}

// =====================================================
// DADOS MOCK
// =====================================================

const MOCK_OVERVIEW_DATA = {
  totalUsers: 156,
  activeUsers: 89,
  completedModules: 234,
  totalHours: 1247,
  averageScore: 87.5,
  certificatesIssued: 67,
  engagementRate: 76.3,
  completionRate: 68.2
};

const MOCK_PROGRESS_DATA = [
  { month: 'Jan', completed: 12, inProgress: 8, notStarted: 15 },
  { month: 'Fev', completed: 18, inProgress: 12, notStarted: 10 },
  { month: 'Mar', completed: 25, inProgress: 15, notStarted: 8 },
  { month: 'Abr', completed: 32, inProgress: 18, notStarted: 6 },
  { month: 'Mai', completed: 28, inProgress: 22, notStarted: 4 },
  { month: 'Jun', completed: 35, inProgress: 16, notStarted: 3 }
];

const MOCK_ENGAGEMENT_DATA = [
  { day: 'Seg', sessions: 45, duration: 120 },
  { day: 'Ter', sessions: 52, duration: 135 },
  { day: 'Qua', sessions: 38, duration: 98 },
  { day: 'Qui', sessions: 61, duration: 156 },
  { day: 'Sex', sessions: 48, duration: 142 },
  { day: 'Sáb', sessions: 23, duration: 67 },
  { day: 'Dom', sessions: 18, duration: 45 }
];

const MOCK_MODULE_PERFORMANCE = [
  { name: 'Fundamentos de Energia Solar', completion: 85, avgScore: 92, participants: 45 },
  { name: 'Segurança no Trabalho', completion: 78, avgScore: 88, participants: 52 },
  { name: 'Vendas Técnicas', completion: 92, avgScore: 85, participants: 38 },
  { name: 'Instalação de Sistemas', completion: 67, avgScore: 90, participants: 41 },
  { name: 'Manutenção Preventiva', completion: 73, avgScore: 87, participants: 29 }
];

const MOCK_DEPARTMENT_DATA = [
  { name: 'Vendas', value: 35, color: '#3B82F6' },
  { name: 'Técnico', value: 28, color: '#10B981' },
  { name: 'Suporte', value: 22, color: '#F59E0B' },
  { name: 'Administrativo', value: 15, color: '#EF4444' }
];

const MOCK_TOP_PERFORMERS = [
  { id: '1', name: 'João Silva', department: 'Vendas', score: 98, modules: 12, hours: 45 },
  { id: '2', name: 'Maria Santos', department: 'Técnico', score: 96, modules: 10, hours: 38 },
  { id: '3', name: 'Pedro Costa', department: 'Suporte', score: 94, modules: 8, hours: 32 },
  { id: '4', name: 'Ana Oliveira', department: 'Vendas', score: 92, modules: 9, hours: 28 },
  { id: '5', name: 'Carlos Lima', department: 'Técnico', score: 90, modules: 7, hours: 25 }
];

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function TrainingReports({ 
  companyId, 
  moduleId, 
  userId, 
  dateRange 
}: TrainingReportsProps) {
  const { user } = useAuth();
  const [filter, setFilter] = useState<ReportFilter>({
    dateRange: 'month',
    departments: [],
    roles: [],
    modules: [],
    status: 'all'
  });
  const [chartConfigs, setChartConfigs] = useState<Record<string, ChartConfig>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['completion', 'engagement', 'performance']);
  
  // Hooks
  const { 
    data: reportsData, 
    isLoading: reportsLoading, 
    refetch 
  } = useTrainingReports({
    companyId: companyId || user?.company_id,
    moduleId,
    userId,
    dateRange: filter.customDateRange || {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      end: new Date()
    }
  });
  
  // Handlers
  const handleExportReport = (format: 'pdf' | 'excel' | 'csv') => {
    console.log('Exporting report as:', format);
    // Implementar exportação
  };
  
  const handleRefreshData = () => {
    setIsLoading(true);
    refetch().finally(() => setIsLoading(false));
  };
  
  const handleFilterChange = (newFilter: Partial<ReportFilter>) => {
    setFilter(prev => ({ ...prev, ...newFilter }));
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Relatórios de Treinamentos</h2>
          <p className="text-gray-600">
            Análise detalhada do desempenho e engajamento nos treinamentos
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefreshData}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          
          <ExportMenu onExport={handleExportReport} />
          
          <FilterDialog filter={filter} onFilterChange={handleFilterChange} />
        </div>
      </div>
      
      {/* Filtros Rápidos */}
      <QuickFilters filter={filter} onFilterChange={handleFilterChange} />
      
      {/* Métricas Principais */}
      <OverviewMetrics data={MOCK_OVERVIEW_DATA} />
      
      {/* Abas de Relatórios */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="progress">Progresso</TabsTrigger>
          <TabsTrigger value="engagement">Engajamento</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          <OverviewTab />
        </TabsContent>
        
        <TabsContent value="progress" className="space-y-6">
          <ProgressTab />
        </TabsContent>
        
        <TabsContent value="engagement" className="space-y-6">
          <EngagementTab />
        </TabsContent>
        
        <TabsContent value="performance" className="space-y-6">
          <PerformanceTab />
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-6">
          <AnalyticsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// =====================================================
// COMPONENTE: MÉTRICAS PRINCIPAIS
// =====================================================

function OverviewMetrics({ data }: { data: typeof MOCK_OVERVIEW_DATA }) {
  const metrics = [
    {
      title: 'Usuários Ativos',
      value: data.activeUsers,
      total: data.totalUsers,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      trend: '+12%',
      trendUp: true
    },
    {
      title: 'Módulos Concluídos',
      value: data.completedModules,
      icon: BookOpen,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      trend: '+8%',
      trendUp: true
    },
    {
      title: 'Horas de Estudo',
      value: data.totalHours,
      icon: Clock,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      trend: '+15%',
      trendUp: true
    },
    {
      title: 'Nota Média',
      value: `${data.averageScore}%`,
      icon: Star,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      trend: '+3%',
      trendUp: true
    },
    {
      title: 'Certificados',
      value: data.certificatesIssued,
      icon: Award,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      trend: '+22%',
      trendUp: true
    },
    {
      title: 'Taxa de Engajamento',
      value: `${data.engagementRate}%`,
      icon: Activity,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      trend: '-2%',
      trendUp: false
    }
  ];
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {metrics.map((metric, index) => {
        const Icon = metric.icon;
        return (
          <motion.div
            key={metric.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                    <Icon className={`h-5 w-5 ${metric.color}`} />
                  </div>
                  
                  <div className={`flex items-center text-sm ${
                    metric.trendUp ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {metric.trendUp ? (
                      <TrendingUp className="h-4 w-4 mr-1" />
                    ) : (
                      <TrendingDown className="h-4 w-4 mr-1" />
                    )}
                    {metric.trend}
                  </div>
                </div>
                
                <div className="mt-3">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-2xl font-bold text-gray-900">
                      {metric.value}
                    </span>
                    {metric.total && (
                      <span className="text-sm text-gray-500">/ {metric.total}</span>
                    )}
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-1">{metric.title}</p>
                  
                  {metric.total && (
                    <Progress 
                      value={(Number(metric.value) / metric.total) * 100} 
                      className="mt-2 h-1"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}

// =====================================================
// COMPONENTE: FILTROS RÁPIDOS
// =====================================================

function QuickFilters({ 
  filter, 
  onFilterChange 
}: {
  filter: ReportFilter;
  onFilterChange: (filter: Partial<ReportFilter>) => void;
}) {
  const dateRangeOptions = [
    { value: 'week', label: 'Última semana' },
    { value: 'month', label: 'Último mês' },
    { value: 'quarter', label: 'Último trimestre' },
    { value: 'year', label: 'Último ano' },
    { value: 'custom', label: 'Personalizado' }
  ];
  
  const statusOptions = [
    { value: 'all', label: 'Todos os status' },
    { value: 'completed', label: 'Concluídos' },
    { value: 'in_progress', label: 'Em andamento' },
    { value: 'not_started', label: 'Não iniciados' }
  ];
  
  return (
    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
      <div className="flex items-center space-x-2">
        <SlidersHorizontal className="h-4 w-4 text-gray-600" />
        <span className="text-sm font-medium text-gray-700">Filtros:</span>
      </div>
      
      <Select 
        value={filter.dateRange} 
        onValueChange={(value: any) => onFilterChange({ dateRange: value })}
      >
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {dateRangeOptions.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      <Select 
        value={filter.status} 
        onValueChange={(value: any) => onFilterChange({ status: value })}
      >
        <SelectTrigger className="w-40">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {statusOptions.map(option => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      
      {filter.dateRange === 'custom' && (
        <div className="flex items-center space-x-2">
          <DatePicker
            selected={filter.customDateRange?.start}
            onSelect={(date) => 
              onFilterChange({
                customDateRange: {
                  start: date || new Date(),
                  end: filter.customDateRange?.end || new Date()
                }
              })
            }
            placeholderText="Data inicial"
          />
          
          <span className="text-gray-500">até</span>
          
          <DatePicker
            selected={filter.customDateRange?.end}
            onSelect={(date) => 
              onFilterChange({
                customDateRange: {
                  start: filter.customDateRange?.start || new Date(),
                  end: date || new Date()
                }
              })
            }
            placeholderText="Data final"
          />
        </div>
      )}
    </div>
  );
}

// =====================================================
// COMPONENTE: ABA VISÃO GERAL
// =====================================================

function OverviewTab() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Progresso por Mês */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5" />
            <span>Progresso Mensal</span>
          </CardTitle>
          <CardDescription>
            Evolução dos treinamentos nos últimos 6 meses
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={MOCK_PROGRESS_DATA}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="completed" stackId="a" fill="#10B981" name="Concluídos" />
              <Bar dataKey="inProgress" stackId="a" fill="#F59E0B" name="Em Andamento" />
              <Bar dataKey="notStarted" stackId="a" fill="#EF4444" name="Não Iniciados" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* Distribuição por Departamento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <PieChartIcon className="h-5 w-5" />
            <span>Participação por Departamento</span>
          </CardTitle>
          <CardDescription>
            Distribuição de usuários ativos por departamento
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={MOCK_DEPARTMENT_DATA}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {MOCK_DEPARTMENT_DATA.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* Performance dos Módulos */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Target className="h-5 w-5" />
            <span>Performance dos Módulos</span>
          </CardTitle>
          <CardDescription>
            Taxa de conclusão e nota média por módulo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {MOCK_MODULE_PERFORMANCE.map((module, index) => (
              <div key={index} className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{module.name}</h4>
                  <div className="flex items-center space-x-4 mt-2">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Conclusão:</span>
                      <Progress value={module.completion} className="w-20 h-2" />
                      <span className="text-sm font-medium">{module.completion}%</span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-gray-600">Nota média:</span>
                      <Badge variant="outline">{module.avgScore}%</Badge>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Users className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">{module.participants} participantes</span>
                    </div>
                  </div>
                </div>
                
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =====================================================
// COMPONENTE: ABA PROGRESSO
// =====================================================

function ProgressTab() {
  return (
    <div className="space-y-6">
      {/* Gráfico de Progresso */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução do Progresso</CardTitle>
          <CardDescription>
            Acompanhamento detalhado do progresso dos treinamentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={MOCK_PROGRESS_DATA}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="completed" 
                stackId="1" 
                stroke="#10B981" 
                fill="#10B981" 
                name="Concluídos"
              />
              <Area 
                type="monotone" 
                dataKey="inProgress" 
                stackId="1" 
                stroke="#F59E0B" 
                fill="#F59E0B" 
                name="Em Andamento"
              />
              <Area 
                type="monotone" 
                dataKey="notStarted" 
                stackId="1" 
                stroke="#EF4444" 
                fill="#EF4444" 
                name="Não Iniciados"
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Trophy className="h-5 w-5" />
            <span>Top Performers</span>
          </CardTitle>
          <CardDescription>
            Colaboradores com melhor desempenho nos treinamentos
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {MOCK_TOP_PERFORMERS.map((performer, index) => (
              <div key={performer.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0 ? 'bg-yellow-100 text-yellow-800' :
                    index === 1 ? 'bg-gray-100 text-gray-800' :
                    index === 2 ? 'bg-orange-100 text-orange-800' :
                    'bg-blue-100 text-blue-800'
                  }`}>
                    {index + 1}
                  </div>
                  
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>
                      {performer.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                </div>
                
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{performer.name}</h4>
                  <p className="text-sm text-gray-600">{performer.department}</p>
                </div>
                
                <div className="flex items-center space-x-6 text-sm">
                  <div className="text-center">
                    <div className="font-bold text-gray-900">{performer.score}%</div>
                    <div className="text-gray-600">Nota</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="font-bold text-gray-900">{performer.modules}</div>
                    <div className="text-gray-600">Módulos</div>
                  </div>
                  
                  <div className="text-center">
                    <div className="font-bold text-gray-900">{performer.hours}h</div>
                    <div className="text-gray-600">Estudo</div>
                  </div>
                </div>
                
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =====================================================
// COMPONENTE: ABA ENGAJAMENTO
// =====================================================

function EngagementTab() {
  return (
    <div className="space-y-6">
      {/* Engajamento Semanal */}
      <Card>
        <CardHeader>
          <CardTitle>Engajamento Semanal</CardTitle>
          <CardDescription>
            Sessões de estudo e tempo médio por dia da semana
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={MOCK_ENGAGEMENT_DATA}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="day" />
              <YAxis yAxisId="left" />
              <YAxis yAxisId="right" orientation="right" />
              <Tooltip />
              <Legend />
              <Bar yAxisId="left" dataKey="sessions" fill="#3B82F6" name="Sessões" />
              <Line 
                yAxisId="right" 
                type="monotone" 
                dataKey="duration" 
                stroke="#10B981" 
                strokeWidth={3}
                name="Duração (min)"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      
      {/* Métricas de Engajamento */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Taxa de Retenção</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600 mb-2">84.2%</div>
            <p className="text-sm text-gray-600">
              Usuários que retornaram nos últimos 7 dias
            </p>
            <Progress value={84.2} className="mt-3" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Tempo Médio de Sessão</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600 mb-2">23min</div>
            <p className="text-sm text-gray-600">
              Duração média das sessões de estudo
            </p>
            <div className="flex items-center mt-3 text-sm text-green-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              +5% vs. mês anterior
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Frequência de Acesso</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-600 mb-2">4.2x</div>
            <p className="text-sm text-gray-600">
              Acessos médios por usuário por semana
            </p>
            <div className="flex items-center mt-3 text-sm text-green-600">
              <TrendingUp className="h-4 w-4 mr-1" />
              +12% vs. mês anterior
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// =====================================================
// COMPONENTE: ABA PERFORMANCE
// =====================================================

function PerformanceTab() {
  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Relatórios de Performance
        </h3>
        <p className="text-gray-600 mb-4">
          Análises detalhadas de performance em desenvolvimento.
        </p>
        <Button variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Solicitar Relatório Personalizado
        </Button>
      </div>
    </div>
  );
}

// =====================================================
// COMPONENTE: ABA ANALYTICS
// =====================================================

function AnalyticsTab() {
  return (
    <div className="space-y-6">
      <div className="text-center py-12">
        <Activity className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Analytics Avançado
        </h3>
        <p className="text-gray-600 mb-4">
          Ferramentas de análise avançada em desenvolvimento.
        </p>
        <Button variant="outline">
          <Zap className="h-4 w-4 mr-2" />
          Ativar Analytics Pro
        </Button>
      </div>
    </div>
  );
}

// =====================================================
// COMPONENTE: MENU DE EXPORTAÇÃO
// =====================================================

function ExportMenu({ 
  onExport 
}: {
  onExport: (format: 'pdf' | 'excel' | 'csv') => void;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm">
          <Download className="h-4 w-4 mr-2" />
          Exportar
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-48" align="end">
        <div className="space-y-1">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => onExport('pdf')}
          >
            <FileText className="h-4 w-4 mr-2" />
            Exportar como PDF
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => onExport('excel')}
          >
            <BarChart3 className="h-4 w-4 mr-2" />
            Exportar como Excel
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => onExport('csv')}
          >
            <FileText className="h-4 w-4 mr-2" />
            Exportar como CSV
          </Button>
          
          <Separator />
          
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start"
            onClick={() => {
              // Implementar compartilhamento
            }}
          >
            <Share2 className="h-4 w-4 mr-2" />
            Compartilhar Relatório
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// =====================================================
// COMPONENTE: DIALOG DE FILTROS
// =====================================================

function FilterDialog({ 
  filter, 
  onFilterChange 
}: {
  filter: ReportFilter;
  onFilterChange: (filter: Partial<ReportFilter>) => void;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filtros Avançados
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Filtros Avançados</DialogTitle>
          <DialogDescription>
            Configure filtros detalhados para os relatórios
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label>Departamentos</Label>
            <div className="mt-2 space-y-2">
              {['Vendas', 'Técnico', 'Suporte', 'Administrativo'].map(dept => (
                <div key={dept} className="flex items-center space-x-2">
                  <Checkbox 
                    id={dept}
                    checked={filter.departments.includes(dept)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onFilterChange({ departments: [...filter.departments, dept] });
                      } else {
                        onFilterChange({ 
                          departments: filter.departments.filter(d => d !== dept) 
                        });
                      }
                    }}
                  />
                  <Label htmlFor={dept}>{dept}</Label>
                </div>
              ))}
            </div>
          </div>
          
          <div>
            <Label>Cargos</Label>
            <div className="mt-2 space-y-2">
              {['Vendedor', 'Técnico', 'Supervisor', 'Gerente'].map(role => (
                <div key={role} className="flex items-center space-x-2">
                  <Checkbox 
                    id={role}
                    checked={filter.roles.includes(role)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        onFilterChange({ roles: [...filter.roles, role] });
                      } else {
                        onFilterChange({ 
                          roles: filter.roles.filter(r => r !== role) 
                        });
                      }
                    }}
                  />
                  <Label htmlFor={role}>{role}</Label>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline">
            Limpar Filtros
          </Button>
          <Button>
            Aplicar Filtros
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default TrainingReports;