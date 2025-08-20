/**
 * Dashboard Interativo para o Módulo Fotovoltaico
 * 
 * Componente que exibe visualizações interativas dos dados financeiros
 * e de energia do sistema fotovoltaico
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, TrendingDown, Zap, DollarSign, Calendar, BarChart3, Download, RefreshCw } from 'lucide-react';
import { ResultadoFinanceiro } from '@/services/CalculadoraSolarService';
import { formatCurrency, formatNumber, formatPercentage } from '@/utils/formatters';
import { useNotifications } from '@/hooks/useNotifications';

export interface DashboardData {
  resultadoFinanceiro: ResultadoFinanceiro;
  fluxoCaixa: Array<{
    ano: number;
    economia: number;
    economiaAcumulada: number;
    custoSemSolar: number;
    custoComSolar: number;
    geracaoKwh: number;
    consumoKwh: number;
  }>;
  geracaoMensal: Array<{
    mes: string;
    geracao: number;
    consumo: number;
    economia: number;
    injecao: number;
    autoconsumo: number;
  }>;
  parametros: {
    custoSistema: number;
    potenciaKwp: number;
    areaOcupada: number;
    concessionaria: string;
    tipoLigacao: string;
  };
}

export interface InteractiveDashboardProps {
  data: DashboardData;
  onRefresh?: () => void;
  onExport?: (format: 'pdf' | 'excel' | 'csv') => void;
  className?: string;
}

const COLORS = {
  primary: '#10b981',
  secondary: '#3b82f6',
  accent: '#f59e0b',
  danger: '#ef4444',
  success: '#22c55e',
  warning: '#f59e0b',
  muted: '#6b7280'
};

const CHART_COLORS = [COLORS.primary, COLORS.secondary, COLORS.accent, COLORS.warning, COLORS.danger];

export function InteractiveDashboard({ data, onRefresh, onExport, className }: InteractiveDashboardProps) {
  const [selectedPeriod, setSelectedPeriod] = useState<'5' | '10' | '25'>('25');
  const [showProjections, setShowProjections] = useState(true);
  const [chartType, setChartType] = useState<'line' | 'area' | 'bar'>('area');
  const [activeTab, setActiveTab] = useState('overview');
  const { notifySuccess, notifyError } = useNotifications();

  // Filtrar dados por período selecionado
  const filteredFluxoCaixa = useMemo(() => {
    const years = parseInt(selectedPeriod);
    return data.fluxoCaixa.slice(0, years);
  }, [data.fluxoCaixa, selectedPeriod]);

  // Métricas principais calculadas
  const metrics = useMemo(() => {
    const resultado = data.resultadoFinanceiro;
    const ultimoAno = filteredFluxoCaixa[filteredFluxoCaixa.length - 1];
    
    return {
      vpl: resultado.vpl,
      tir: resultado.tir,
      payback: resultado.payback_simples_anos,
      economiaAnual: resultado.economia_anual,
      economiaTotal: ultimoAno?.economiaAcumulada || 0,
      geracaoAnual: data.fluxoCaixa[0]?.geracaoKwh * 12 || 0,
      autoconsumo: data.geracaoMensal.reduce((acc, mes) => acc + mes.autoconsumo, 0) / 12,
      injecaoMedia: data.geracaoMensal.reduce((acc, mes) => acc + mes.injecao, 0) / 12
    };
  }, [data, filteredFluxoCaixa]);

  // Dados para gráfico de pizza (distribuição de energia)
  const energyDistribution = useMemo(() => [
    { name: 'Autoconsumo', value: metrics.autoconsumo, color: COLORS.primary },
    { name: 'Injeção na Rede', value: metrics.injecaoMedia, color: COLORS.secondary }
  ], [metrics]);

  // Dados para comparação mensal
  const monthlyComparison = useMemo(() => {
    return data.geracaoMensal.map(mes => ({
      ...mes,
      saldoEnergia: mes.geracao - mes.consumo,
      percentualEconomia: mes.consumo > 0 ? (mes.economia / (mes.economia + mes.consumo)) * 100 : 0
    }));
  }, [data.geracaoMensal]);

  // Função para exportar dados
  const handleExport = async (format: 'pdf' | 'excel' | 'csv') => {
    try {
      if (onExport) {
        await onExport(format);
        notifySuccess(
          'Exportação Concluída',
          `Relatório exportado em formato ${format.toUpperCase()} com sucesso.`
        );
      }
    } catch (error) {
      notifyError(
        'Erro na Exportação',
        `Não foi possível exportar o relatório em formato ${format.toUpperCase()}.`
      );
    }
  };

  // Função para atualizar dados
  const handleRefresh = async () => {
    try {
      if (onRefresh) {
        await onRefresh();
        notifySuccess('Dados Atualizados', 'Dashboard atualizado com sucesso.');
      }
    } catch (error) {
      notifyError('Erro na Atualização', 'Não foi possível atualizar os dados.');
    }
  };

  // Componente de métrica
  const MetricCard = ({ title, value, subtitle, icon: Icon, trend, color = 'default' }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ElementType;
    trend?: 'up' | 'down' | 'neutral';
    color?: 'default' | 'success' | 'warning' | 'danger';
  }) => {
    const colorClasses = {
      default: 'text-foreground',
      success: 'text-green-600',
      warning: 'text-yellow-600',
      danger: 'text-red-600'
    };

    const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : null;

    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">{title}</span>
            </div>
            {TrendIcon && (
              <TrendIcon className={`h-4 w-4 ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`} />
            )}
          </div>
          <div className="mt-2">
            <div className={`text-2xl font-bold ${colorClasses[color]}`}>
              {typeof value === 'number' ? formatNumber(value) : value}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Interface para dados do gráfico
  interface ChartData {
    ano: number;
    economia: number;
    economiaAcumulada: number;
  }

  // Componente de gráfico customizado
  const CustomChart = ({ data, type }: { data: ChartData[]; type: 'line' | 'area' | 'bar' }) => {
    const commonProps = {
      data,
      margin: { top: 5, right: 30, left: 20, bottom: 5 }
    };

    switch (type) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="ano" />
            <YAxis />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
            <Line type="monotone" dataKey="economia" stroke={COLORS.primary} strokeWidth={2} />
            <Line type="monotone" dataKey="economiaAcumulada" stroke={COLORS.secondary} strokeWidth={2} />
          </LineChart>
        );
      case 'area':
        return (
          <AreaChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="ano" />
            <YAxis />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
            <Area type="monotone" dataKey="economia" stackId="1" stroke={COLORS.primary} fill={COLORS.primary} fillOpacity={0.6} />
            <Area type="monotone" dataKey="economiaAcumulada" stackId="2" stroke={COLORS.secondary} fill={COLORS.secondary} fillOpacity={0.6} />
          </AreaChart>
        );
      case 'bar':
        return (
          <BarChart {...commonProps}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="ano" />
            <YAxis />
            <Tooltip formatter={(value: number) => formatCurrency(value)} />
            <Legend />
            <Bar dataKey="economia" fill={COLORS.primary} />
            <Bar dataKey="economiaAcumulada" fill={COLORS.secondary} />
          </BarChart>
        );
      default:
        return null;
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header com controles */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Dashboard Financeiro</h2>
          <p className="text-muted-foreground">
            Análise detalhada do sistema fotovoltaico - {data.parametros.potenciaKwp} kWp
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Select value={selectedPeriod} onValueChange={(value: '5' | '10' | '25') => setSelectedPeriod(value)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">5 anos</SelectItem>
              <SelectItem value="10">10 anos</SelectItem>
              <SelectItem value="25">25 anos</SelectItem>
            </SelectContent>
          </Select>
          
          <Button variant="outline" size="sm" onClick={handleRefresh}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          
          <Select onValueChange={(value: 'pdf' | 'excel' | 'csv') => handleExport(value)}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Exportar" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Métricas principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="VPL"
          value={formatCurrency(metrics.vpl)}
          subtitle={`Taxa de desconto aplicada`}
          icon={DollarSign}
          trend={metrics.vpl > 0 ? 'up' : 'down'}
          color={metrics.vpl > 0 ? 'success' : 'danger'}
        />
        
        <MetricCard
          title="TIR"
          value={formatPercentage(metrics.tir)}
          subtitle="Taxa Interna de Retorno"
          icon={TrendingUp}
          trend={metrics.tir > 0.1 ? 'up' : 'neutral'}
          color={metrics.tir > 0.1 ? 'success' : 'warning'}
        />
        
        <MetricCard
          title="Payback"
          value={`${metrics.payback.toFixed(1)} anos`}
          subtitle="Tempo de retorno do investimento"
          icon={Calendar}
          trend={metrics.payback < 8 ? 'up' : 'down'}
          color={metrics.payback < 8 ? 'success' : 'warning'}
        />
        
        <MetricCard
          title="Economia Anual"
          value={formatCurrency(metrics.economiaAnual)}
          subtitle={`${formatNumber(metrics.geracaoAnual)} kWh/ano`}
          icon={Zap}
          trend="up"
          color="success"
        />
      </div>

      {/* Tabs com diferentes visualizações */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="financial">Financeiro</TabsTrigger>
          <TabsTrigger value="energy">Energia</TabsTrigger>
          <TabsTrigger value="comparison">Comparação</TabsTrigger>
        </TabsList>

        {/* Aba Visão Geral */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fluxo de Caixa */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Fluxo de Caixa</CardTitle>
                    <CardDescription>Economia ao longo do tempo</CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Label htmlFor="chart-type">Tipo:</Label>
                    <Select value={chartType} onValueChange={(value: 'line' | 'area' | 'bar') => setChartType(value)}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="line">Linha</SelectItem>
                        <SelectItem value="area">Área</SelectItem>
                        <SelectItem value="bar">Barra</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <CustomChart data={filteredFluxoCaixa} type={chartType} />
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Distribuição de Energia */}
            <Card>
              <CardHeader>
                <CardTitle>Distribuição de Energia</CardTitle>
                <CardDescription>Como a energia é utilizada</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={energyDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {energyDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${formatNumber(value)} kWh`} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Resumo do Sistema */}
          <Card>
            <CardHeader>
              <CardTitle>Resumo do Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Especificações Técnicas</Label>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Potência:</span>
                      <span>{data.parametros.potenciaKwp} kWp</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Área Ocupada:</span>
                      <span>{data.parametros.areaOcupada} m²</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Tipo de Ligação:</span>
                      <span>{data.parametros.tipoLigacao}</span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Dados Financeiros</Label>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Investimento:</span>
                      <span>{formatCurrency(data.parametros.custoSistema)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Economia Total:</span>
                      <span className="text-green-600">{formatCurrency(metrics.economiaTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">ROI:</span>
                      <span className="text-green-600">
                        {formatPercentage((metrics.economiaTotal - data.parametros.custoSistema) / data.parametros.custoSistema)}
                      </span>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Concessionária</Label>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Empresa:</span>
                      <span>{data.parametros.concessionaria}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Geração Anual:</span>
                      <span>{formatNumber(metrics.geracaoAnual)} kWh</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Autoconsumo Médio:</span>
                      <span>{formatNumber(metrics.autoconsumo)} kWh/mês</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Financeiro */}
        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Análise Financeira Detalhada</CardTitle>
              <CardDescription>Comparação de custos com e sem sistema fotovoltaico</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={filteredFluxoCaixa}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="ano" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="custoSemSolar"
                    stackId="1"
                    stroke={COLORS.danger}
                    fill={COLORS.danger}
                    fillOpacity={0.6}
                    name="Custo sem Solar"
                  />
                  <Area
                    type="monotone"
                    dataKey="custoComSolar"
                    stackId="2"
                    stroke={COLORS.primary}
                    fill={COLORS.primary}
                    fillOpacity={0.6}
                    name="Custo com Solar"
                  />
                  <ReferenceLine y={data.parametros.custoSistema} stroke={COLORS.warning} strokeDasharray="5 5" label="Investimento Inicial" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Energia */}
        <TabsContent value="energy" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Geração vs Consumo Mensal</CardTitle>
              <CardDescription>Análise mensal de energia</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <BarChart data={monthlyComparison}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mes" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `${formatNumber(value)} kWh`} />
                  <Legend />
                  <Bar dataKey="geracao" fill={COLORS.primary} name="Geração" />
                  <Bar dataKey="consumo" fill={COLORS.secondary} name="Consumo" />
                  <Bar dataKey="saldoEnergia" fill={COLORS.accent} name="Saldo" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aba Comparação */}
        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Comparação de Cenários</CardTitle>
              <CardDescription>Análise de diferentes períodos de retorno</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {['5', '10', '25'].map((period) => {
                  const periodData = data.fluxoCaixa.slice(0, parseInt(period));
                  const totalEconomia = periodData[periodData.length - 1]?.economiaAcumulada || 0;
                  const roi = (totalEconomia - data.parametros.custoSistema) / data.parametros.custoSistema;
                  
                  return (
                    <Card key={period} className={selectedPeriod === period ? 'ring-2 ring-primary' : ''}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg">{period} Anos</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Economia Total:</span>
                          <span className="font-medium">{formatCurrency(totalEconomia)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">ROI:</span>
                          <span className={`font-medium ${roi > 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {formatPercentage(roi)}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Status:</span>
                          <Badge variant={roi > 0 ? 'default' : 'secondary'}>
                            {roi > 0 ? 'Lucrativo' : 'Em Retorno'}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default InteractiveDashboard;