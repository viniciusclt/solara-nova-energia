import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  Download, 
  RefreshCw,
  Shield,
  BarChart3,
  Clock,
  Users
} from 'lucide-react';
import { generateComplianceReport, exportLogs, searchLogs } from '@/utils/secureLogger';
import { REGULATORY_CONSTANTS } from '@/constants/regulatory';

interface ComplianceMetrics {
  total_logs: number;
  compliance_summary: {
    compliant: number;
    non_compliant: number;
    pending: number;
  };
  validation_summary: {
    total_validations: number;
    passed: number;
    failed: number;
    warnings: number;
  };
  recent_activities: any[];
  integrity_check: boolean;
}

interface ComplianceAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  regulatory_context?: {
    lei_aplicavel: string[];
    ren_aplicavel: string[];
  };
}

const ComplianceDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<ComplianceMetrics | null>(null);
  const [alerts, setAlerts] = useState<ComplianceAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [activeTab, setActiveTab] = useState('overview');

  // Carregar dados do dashboard
  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Gerar relatório de conformidade
      const complianceReport = generateComplianceReport();
      setMetrics(complianceReport);

      // Buscar alertas recentes (últimas 24 horas)
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const recentLogs = searchLogs({
        start_date: yesterday,
        level: 'error'
      });

      // Converter logs em alertas
      const newAlerts: ComplianceAlert[] = recentLogs.map(log => ({
        id: log.id,
        type: log.level === 'error' ? 'error' : log.level === 'warn' ? 'warning' : 'info',
        title: `${log.category.toUpperCase()}: ${log.operation}`,
        message: log.message,
        timestamp: log.timestamp,
        regulatory_context: log.regulatory_context
      }));

      setAlerts(newAlerts);
      setLastUpdate(new Date());
    } catch (error) {
      console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  // Carregar dados na inicialização
  useEffect(() => {
    loadDashboardData();
    
    // Atualizar a cada 5 minutos
    const interval = setInterval(loadDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  // Calcular score de conformidade
  const calculateComplianceScore = (): number => {
    if (!metrics) return 0;
    
    const { compliant, non_compliant, pending } = metrics.compliance_summary;
    const total = compliant + non_compliant + pending;
    
    if (total === 0) return 100;
    return Math.round((compliant / total) * 100);
  };

  // Exportar relatório
  const handleExportReport = (format: 'json' | 'csv') => {
    try {
      const data = exportLogs(format);
      const blob = new Blob([data], { 
        type: format === 'json' ? 'application/json' : 'text/csv' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `compliance-report-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Erro ao exportar relatório:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">Carregando dashboard...</span>
      </div>
    );
  }

  const complianceScore = calculateComplianceScore();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Dashboard de Conformidade</h1>
          <p className="text-muted-foreground">
            Monitoramento em tempo real da conformidade regulamentar
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={loadDashboardData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          <Button onClick={() => handleExportReport('csv')} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button onClick={() => handleExportReport('json')} variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Exportar JSON
          </Button>
        </div>
      </div>

      {/* Alertas Críticos */}
      {alerts.length > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            <strong>{alerts.length} alerta(s) crítico(s)</strong> detectado(s) nas últimas 24 horas.
            Verifique a aba "Alertas" para mais detalhes.
          </AlertDescription>
        </Alert>
      )}

      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Score de Conformidade</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complianceScore}%</div>
            <Progress value={complianceScore} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">
              {complianceScore >= 90 ? 'Excelente' : complianceScore >= 70 ? 'Bom' : 'Requer atenção'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Validações ANEEL</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metrics?.validation_summary.passed || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              de {metrics?.validation_summary.total_validations || 0} validações
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Logs de Auditoria</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.total_logs || 0}</div>
            <p className="text-xs text-muted-foreground">
              registros de auditoria
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Integridade</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-2">
              {metrics?.integrity_check ? (
                <CheckCircle className="h-6 w-6 text-green-500" />
              ) : (
                <XCircle className="h-6 w-6 text-red-500" />
              )}
              <span className="text-sm font-medium">
                {metrics?.integrity_check ? 'Verificada' : 'Comprometida'}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs de Detalhes */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="compliance">Conformidade</TabsTrigger>
          <TabsTrigger value="validations">Validações</TabsTrigger>
          <TabsTrigger value="alerts">Alertas</TabsTrigger>
          <TabsTrigger value="regulatory">Marco Regulatório</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Resumo de Conformidade</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                      Conformes
                    </span>
                    <Badge variant="secondary">
                      {metrics?.compliance_summary.compliant || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center">
                      <XCircle className="h-4 w-4 text-red-500 mr-2" />
                      Não Conformes
                    </span>
                    <Badge variant="destructive">
                      {metrics?.compliance_summary.non_compliant || 0}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="flex items-center">
                      <Clock className="h-4 w-4 text-yellow-500 mr-2" />
                      Pendentes
                    </span>
                    <Badge variant="outline">
                      {metrics?.compliance_summary.pending || 0}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Atividades Recentes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {metrics?.recent_activities.slice(0, 5).map((activity, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <span className="truncate">{activity.message}</span>
                      <span className="text-muted-foreground text-xs">
                        {new Date(activity.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  )) || (
                    <p className="text-muted-foreground text-sm">Nenhuma atividade recente</p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="compliance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Status de Conformidade por Categoria</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 border rounded-lg">
                    <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-green-600">
                      {metrics?.compliance_summary.compliant || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Conformes</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <XCircle className="h-8 w-8 text-red-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-red-600">
                      {metrics?.compliance_summary.non_compliant || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Não Conformes</div>
                  </div>
                  <div className="text-center p-4 border rounded-lg">
                    <Clock className="h-8 w-8 text-yellow-500 mx-auto mb-2" />
                    <div className="text-2xl font-bold text-yellow-600">
                      {metrics?.compliance_summary.pending || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">Pendentes</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="validations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumo de Validações ANEEL</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold">
                    {metrics?.validation_summary.total_validations || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {metrics?.validation_summary.passed || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Aprovadas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-600">
                    {metrics?.validation_summary.failed || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Reprovadas</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {metrics?.validation_summary.warnings || 0}
                  </div>
                  <div className="text-sm text-muted-foreground">Avisos</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Alertas e Notificações</CardTitle>
            </CardHeader>
            <CardContent>
              {alerts.length > 0 ? (
                <div className="space-y-3">
                  {alerts.map((alert) => (
                    <Alert key={alert.id} className={
                      alert.type === 'error' ? 'border-red-200 bg-red-50' :
                      alert.type === 'warning' ? 'border-yellow-200 bg-yellow-50' :
                      'border-blue-200 bg-blue-50'
                    }>
                      {alert.type === 'error' ? <XCircle className="h-4 w-4" /> :
                       alert.type === 'warning' ? <AlertTriangle className="h-4 w-4" /> :
                       <CheckCircle className="h-4 w-4" />}
                      <AlertDescription>
                        <div className="flex justify-between items-start">
                          <div>
                            <strong>{alert.title}</strong>
                            <p className="mt-1">{alert.message}</p>
                            {alert.regulatory_context && (
                              <div className="mt-2 text-xs">
                                <strong>Marco Legal:</strong> {alert.regulatory_context.lei_aplicavel.join(', ')}
                                <br />
                                <strong>RENs:</strong> {alert.regulatory_context.ren_aplicavel.join(', ')}
                              </div>
                            )}
                          </div>
                          <span className="text-xs text-muted-foreground">
                            {alert.timestamp.toLocaleString()}
                          </span>
                        </div>
                      </AlertDescription>
                    </Alert>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum alerta nas últimas 24 horas
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="regulatory" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Marco Regulatório Aplicável</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Lei 14.300/2022</h4>
                  <p className="text-sm text-muted-foreground mb-2">
                    {REGULATORY_CONSTANTS.LEI_14300.descricao}
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                    <div>
                      <strong>Artigos Aplicáveis:</strong>
                      <ul className="list-disc list-inside mt-1">
                        {REGULATORY_CONSTANTS.LEI_14300.artigos_aplicaveis.map((artigo, index) => (
                          <li key={index}>{artigo}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <strong>Período de Aplicação:</strong>
                      <p className="mt-1">
                        {REGULATORY_CONSTANTS.LEI_14300.periodo_aplicacao.inicio} - 
                        {REGULATORY_CONSTANTS.LEI_14300.periodo_aplicacao.fim}
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold mb-2">RENs ANEEL</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {Object.entries(REGULATORY_CONSTANTS.RENS_ANEEL).map(([key, ren]) => (
                      <div key={key} className="border rounded-lg p-3">
                        <h5 className="font-medium">{ren.numero}</h5>
                        <p className="text-sm text-muted-foreground mt-1">
                          {ren.descricao}
                        </p>
                        <p className="text-xs text-muted-foreground mt-2">
                          Vigência: {ren.vigencia}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Footer com informações de atualização */}
      <div className="text-center text-sm text-muted-foreground">
        Última atualização: {lastUpdate.toLocaleString()}
      </div>
    </div>
  );
};

export default ComplianceDashboard;