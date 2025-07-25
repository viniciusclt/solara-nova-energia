import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { DatePickerWithRange } from '@/components/ui/date-range-picker';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import {
  FileText,
  Download,
  Calendar,
  Filter,
  BarChart3,
  PieChart as PieChartIcon,
  TrendingUp,
  Users,
  DollarSign,
  Target,
  Clock,
  Mail,
  Share2,
  Settings,
  Plus,
  Eye,
  Edit,
  Trash2,
  RefreshCw,
  Search,
  FileSpreadsheet,
  Printer
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { DateRange } from 'react-day-picker';

interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  type: 'leads' | 'sales' | 'financial' | 'performance' | 'custom';
  category: 'operational' | 'strategic' | 'financial' | 'compliance';
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly' | 'custom';
  format: 'pdf' | 'excel' | 'csv' | 'json';
  fields: string[];
  filters: Record<string, any>;
  charts: ChartConfig[];
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
  is_scheduled: boolean;
  schedule_config?: ScheduleConfig;
}

interface ChartConfig {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'area';
  title: string;
  data_source: string;
  x_axis: string;
  y_axis: string;
  color_scheme: string[];
}

interface ScheduleConfig {
  frequency: 'daily' | 'weekly' | 'monthly';
  time: string;
  day_of_week?: number;
  day_of_month?: number;
  recipients: string[];
  auto_send: boolean;
}

interface GeneratedReport {
  id: string;
  template_id: string;
  template_name: string;
  generated_at: string;
  generated_by: string;
  file_url: string;
  file_size: number;
  format: string;
  status: 'generating' | 'completed' | 'failed';
  error_message?: string;
  download_count: number;
}

interface ReportData {
  leads_summary: {
    total: number;
    new_this_month: number;
    converted: number;
    conversion_rate: number;
    by_source: Array<{ source: string; count: number; }>;
    by_status: Array<{ status: string; count: number; }>;
  };
  sales_summary: {
    total_value: number;
    total_deals: number;
    average_deal_size: number;
    monthly_trend: Array<{ month: string; value: number; deals: number; }>;
  };
  performance_metrics: {
    response_time: number;
    uptime: number;
    active_users: number;
    system_health: 'good' | 'warning' | 'critical';
  };
}

export function ReportsManager() {
  const { user, profile, hasPermission } = useAuth();
  const [templates, setTemplates] = useState<ReportTemplate[]>([]);
  const [generatedReports, setGeneratedReports] = useState<GeneratedReport[]>([]);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ReportTemplate | null>(null);

  // Verificar permissões
  if (!hasPermission('admin') && !hasPermission('view_reports')) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Acesso Restrito</h3>
            <p className="text-muted-foreground">
              Você não tem permissão para acessar os relatórios.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Gerar dados mock
  const generateMockData = useCallback((): ReportData => {
    return {
      leads_summary: {
        total: 1250,
        new_this_month: 180,
        converted: 95,
        conversion_rate: 7.6,
        by_source: [
          { source: 'Website', count: 450 },
          { source: 'Indicação', count: 320 },
          { source: 'Redes Sociais', count: 280 },
          { source: 'Google Ads', count: 200 }
        ],
        by_status: [
          { status: 'Novo', count: 380 },
          { status: 'Contato', count: 290 },
          { status: 'Proposta', count: 185 },
          { status: 'Negociação', count: 125 },
          { status: 'Fechado', count: 95 },
          { status: 'Perdido', count: 175 }
        ]
      },
      sales_summary: {
        total_value: 2850000,
        total_deals: 95,
        average_deal_size: 30000,
        monthly_trend: [
          { month: 'Jan', value: 180000, deals: 6 },
          { month: 'Fev', value: 220000, deals: 8 },
          { month: 'Mar', value: 350000, deals: 12 },
          { month: 'Abr', value: 280000, deals: 9 },
          { month: 'Mai', value: 420000, deals: 14 },
          { month: 'Jun', value: 380000, deals: 13 },
          { month: 'Jul', value: 450000, deals: 15 },
          { month: 'Ago', value: 320000, deals: 11 },
          { month: 'Set', value: 380000, deals: 13 },
          { month: 'Out', value: 420000, deals: 14 }
        ]
      },
      performance_metrics: {
        response_time: 245,
        uptime: 99.8,
        active_users: 42,
        system_health: 'good'
      }
    };
  }, []);

  const generateMockTemplates = useCallback((): ReportTemplate[] => {
    return [
      {
        id: 'template_1',
        name: 'Relatório de Leads Mensal',
        description: 'Relatório completo de leads gerados no mês',
        type: 'leads',
        category: 'operational',
        frequency: 'monthly',
        format: 'pdf',
        fields: ['name', 'email', 'phone', 'source', 'status', 'created_at'],
        filters: { status: 'all', source: 'all' },
        charts: [
          {
            id: 'chart_1',
            type: 'pie',
            title: 'Leads por Fonte',
            data_source: 'leads',
            x_axis: 'source',
            y_axis: 'count',
            color_scheme: ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']
          }
        ],
        created_by: user?.id || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
        is_scheduled: true,
        schedule_config: {
          frequency: 'monthly',
          time: '09:00',
          day_of_month: 1,
          recipients: ['admin@empresa.com'],
          auto_send: true
        }
      },
      {
        id: 'template_2',
        name: 'Dashboard Executivo',
        description: 'Visão geral dos KPIs principais',
        type: 'performance',
        category: 'strategic',
        frequency: 'weekly',
        format: 'pdf',
        fields: ['leads_total', 'conversion_rate', 'revenue', 'active_users'],
        filters: {},
        charts: [
          {
            id: 'chart_2',
            type: 'line',
            title: 'Tendência de Vendas',
            data_source: 'sales',
            x_axis: 'month',
            y_axis: 'value',
            color_scheme: ['#3b82f6']
          }
        ],
        created_by: user?.id || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
        is_scheduled: false
      },
      {
        id: 'template_3',
        name: 'Análise Financeira',
        description: 'Relatório detalhado de performance financeira',
        type: 'financial',
        category: 'financial',
        frequency: 'quarterly',
        format: 'excel',
        fields: ['revenue', 'costs', 'profit', 'roi'],
        filters: {},
        charts: [
          {
            id: 'chart_3',
            type: 'bar',
            title: 'Receita vs Custos',
            data_source: 'financial',
            x_axis: 'month',
            y_axis: 'value',
            color_scheme: ['#10b981', '#ef4444']
          }
        ],
        created_by: user?.id || '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        is_active: true,
        is_scheduled: false
      }
    ];
  }, [user]);

  const generateMockReports = useCallback((): GeneratedReport[] => {
    return [
      {
        id: 'report_1',
        template_id: 'template_1',
        template_name: 'Relatório de Leads Mensal',
        generated_at: new Date().toISOString(),
        generated_by: user?.id || '',
        file_url: '/reports/leads_monthly_2024_10.pdf',
        file_size: 2048576,
        format: 'pdf',
        status: 'completed',
        download_count: 5
      },
      {
        id: 'report_2',
        template_id: 'template_2',
        template_name: 'Dashboard Executivo',
        generated_at: subDays(new Date(), 1).toISOString(),
        generated_by: user?.id || '',
        file_url: '/reports/executive_dashboard_2024_10_30.pdf',
        file_size: 1536000,
        format: 'pdf',
        status: 'completed',
        download_count: 12
      },
      {
        id: 'report_3',
        template_id: 'template_3',
        template_name: 'Análise Financeira',
        generated_at: subDays(new Date(), 7).toISOString(),
        generated_by: user?.id || '',
        file_url: '/reports/financial_analysis_q3_2024.xlsx',
        file_size: 3072000,
        format: 'excel',
        status: 'completed',
        download_count: 8
      }
    ];
  }, [user]);

  // Carregar dados
  const loadData = useCallback(async () => {
    if (!user || !profile?.company_id) return;

    try {
      setLoading(true);

      // Simular carregamento de dados
      await new Promise(resolve => setTimeout(resolve, 1000));

      setTemplates(generateMockTemplates());
      setGeneratedReports(generateMockReports());
      setReportData(generateMockData());
    } catch (error) {
      console.error('Erro ao carregar relatórios:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os relatórios',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, profile, generateMockTemplates, generateMockReports, generateMockData]);

  // Gerar relatório
  const generateReport = async (templateId: string) => {
    try {
      setLoading(true);
      
      // Simular geração de relatório
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({
        title: 'Sucesso',
        description: 'Relatório gerado com sucesso!',
      });
      
      // Recarregar lista de relatórios
      loadData();
    } catch (error) {
      console.error('Erro ao gerar relatório:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível gerar o relatório',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  // Baixar relatório
  const downloadReport = (report: GeneratedReport) => {
    // Simular download
    toast({
      title: 'Download iniciado',
      description: `Baixando ${report.template_name}...`,
    });
  };

  // Filtrar templates
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Carregar dados iniciais
  useEffect(() => {
    loadData();
  }, [loadData]);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'leads': return <Users className="h-4 w-4" />;
      case 'sales': return <DollarSign className="h-4 w-4" />;
      case 'financial': return <TrendingUp className="h-4 w-4" />;
      case 'performance': return <BarChart3 className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case 'pdf': return <FileText className="h-4 w-4" />;
      case 'excel': return <FileSpreadsheet className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Relatórios</h2>
          <p className="text-muted-foreground">
            Geração e gerenciamento de relatórios personalizados
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
          {hasPermission('admin') && (
            <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Criar Template de Relatório</DialogTitle>
                  <DialogDescription>
                    Configure um novo template para geração automática de relatórios
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <Alert>
                    <Settings className="h-4 w-4" />
                    <AlertDescription>
                      A criação de templates personalizados está em desenvolvimento.
                      Por enquanto, use os templates pré-definidos.
                    </AlertDescription>
                  </Alert>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
                    Cancelar
                  </Button>
                  <Button disabled>
                    Criar Template
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Estatísticas rápidas */}
      {reportData && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Leads</p>
                  <p className="text-2xl font-bold">{reportData.leads_summary.total.toLocaleString()}</p>
                  <p className="text-sm text-green-600">+{reportData.leads_summary.new_this_month} este mês</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 text-green-600 rounded-lg">
                  <Target className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Taxa de Conversão</p>
                  <p className="text-2xl font-bold">{reportData.leads_summary.conversion_rate}%</p>
                  <p className="text-sm text-muted-foreground">{reportData.leads_summary.converted} convertidos</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Receita Total</p>
                  <p className="text-2xl font-bold">R$ {(reportData.sales_summary.total_value / 1000000).toFixed(1)}M</p>
                  <p className="text-sm text-muted-foreground">{reportData.sales_summary.total_deals} negócios</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 text-purple-600 rounded-lg">
                  <Clock className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Uptime do Sistema</p>
                  <p className="text-2xl font-bold">{reportData.performance_metrics.uptime}%</p>
                  <p className="text-sm text-muted-foreground">{reportData.performance_metrics.active_users} usuários ativos</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="templates" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="generated">Relatórios Gerados</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        {/* Templates */}
        <TabsContent value="templates" className="space-y-4">
          {/* Filtros */}
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                <SelectItem value="operational">Operacional</SelectItem>
                <SelectItem value="strategic">Estratégico</SelectItem>
                <SelectItem value="financial">Financeiro</SelectItem>
                <SelectItem value="compliance">Compliance</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Lista de templates */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTemplates.map((template) => (
              <Card key={template.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(template.type)}
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                    </div>
                    <Badge variant={template.is_active ? 'default' : 'secondary'}>
                      {template.is_active ? 'Ativo' : 'Inativo'}
                    </Badge>
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Categoria:</span>
                    <Badge variant="outline">{template.category}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Frequência:</span>
                    <span>{template.frequency}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Formato:</span>
                    <div className="flex items-center gap-1">
                      {getFormatIcon(template.format)}
                      <span>{template.format.toUpperCase()}</span>
                    </div>
                  </div>
                  {template.is_scheduled && (
                    <div className="flex items-center gap-2 text-sm text-green-600">
                      <Calendar className="h-4 w-4" />
                      <span>Agendado</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 pt-2">
                    <Button
                      size="sm"
                      onClick={() => generateReport(template.id)}
                      disabled={loading}
                      className="flex-1"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Gerar
                    </Button>
                    {hasPermission('admin') && (
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Relatórios Gerados */}
        <TabsContent value="generated" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Relatórios Gerados Recentemente</CardTitle>
              <CardDescription>
                Histórico de relatórios gerados e disponíveis para download
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {generatedReports.map((report) => (
                  <div key={report.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      {getFormatIcon(report.format)}
                      <div>
                        <h4 className="font-medium">{report.template_name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Gerado em {format(new Date(report.generated_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(report.file_size)} • {report.download_count} downloads
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={report.status === 'completed' ? 'default' : report.status === 'generating' ? 'secondary' : 'destructive'}>
                        {report.status === 'completed' ? 'Concluído' :
                         report.status === 'generating' ? 'Gerando...' : 'Erro'}
                      </Badge>
                      {report.status === 'completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadReport(report)}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Baixar
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics */}
        <TabsContent value="analytics" className="space-y-4">
          {reportData && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Leads por Fonte */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="h-5 w-5" />
                    Leads por Fonte
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={reportData.leads_summary.by_source}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ source, percent }) => `${source} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {reportData.leads_summary.by_source.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][index % 4]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Tendência de Vendas */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Tendência de Vendas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={reportData.sales_summary.monthly_trend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`} />
                      <Tooltip 
                        formatter={(value: number) => [`R$ ${value.toLocaleString()}`, 'Receita']}
                        labelFormatter={(label) => `Mês: ${label}`}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Status dos Leads */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Status dos Leads
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={reportData.leads_summary.by_status}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="status" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#3b82f6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Negócios por Mês */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Negócios Fechados
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={reportData.sales_summary.monthly_trend}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip 
                        formatter={(value: number) => [`${value} negócios`, 'Fechados']}
                        labelFormatter={(label) => `Mês: ${label}`}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="deals" 
                        stroke="#10b981" 
                        fill="#10b981"
                        fillOpacity={0.3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}