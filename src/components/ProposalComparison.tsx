import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { ScrollArea } from './ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription } from './ui/alert';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Zap, 
  Award,
  Download,
  Share2,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Settings,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Plus,
  X
} from 'lucide-react';
import { type ProposalData } from '../services/ProposalComparisonService';
import { ProposalComparisonInterface } from './ProposalComparison/ProposalComparisonInterface';
import { useProposalComparison, useValidateCriteria, useComparisonPerformance } from '../hooks/useProposalComparison';
import { formatCurrency, formatPercentage } from '../utils/formatters';
import { useFinancialWorker } from '../hooks/useFinancialWorker';
import { logError } from '@/utils/secureLogger';

interface ProposalComparisonProps {
  proposals: ProposalData[];
  onAddProposal?: () => void;
  onRemoveProposal?: (id: string) => void;
  onExport?: (format: 'csv' | 'pdf') => void;
  useWorker?: boolean;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const MetricCard = ({ 
  title, 
  value, 
  unit, 
  trend, 
  description, 
  highlight = false 
}: {
  title: string;
  value: number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  description?: string;
  highlight?: boolean;
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case 'down':
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return null;
    }
  };

  const formatValue = () => {
    if (unit === 'currency') {
      return formatCurrency(value);
    }
    if (unit === 'percentage') {
      return formatPercentage(value);
    }
    if (unit === 'years') {
      return `${value.toFixed(1)} anos`;
    }
    return value.toLocaleString('pt-BR');
  };

  return (
    <div className={`p-3 rounded-lg border ${highlight ? 'border-primary bg-primary/5' : 'border-border'}`}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        {getTrendIcon()}
      </div>
      <div className="text-lg font-bold">{formatValue()}</div>
      {description && (
        <p className="text-xs text-muted-foreground mt-1">{description}</p>
      )}
    </div>
  );
};

export function ProposalComparison({ 
  proposals, 
  onAddProposal, 
  onRemoveProposal, 
  onExport,
  useWorker = true
}: ProposalComparisonProps) {
  const [selectedProposals, setSelectedProposals] = useState<string[]>(
    proposals.slice(0, 3).map(p => p.id)
  );
  const [viewMode, setViewMode] = useState<'advanced' | 'simple'>('advanced');
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie'>('bar');

  const selectedProposalData = useMemo(() => 
    proposals.filter(p => selectedProposals.includes(p.id)),
    [proposals, selectedProposals]
  );

  const {
    comparisonResults,
    ranking,
    criteria,
    isLoading,
    error,
    updateCriteria,
    recalculate,
    exportData,
    bestProposals,
    statistics
  } = useProposalComparison({
    proposals: selectedProposalData,
    useWorker
  });

  const criteriaValidation = useValidateCriteria(criteria);
  const performanceStats = useComparisonPerformance(comparisonResults);



  const chartData = useMemo(() => {
    return comparisonResults.map((result, index) => ({
      name: result.proposal.name,
      VPL: result.results.vpl,
      TIR: result.results.tir * 100,
      Payback: result.results.payback,
      ROI: result.results.roi * 100,
      Economia: result.results.totalSavings || result.results.economiaTotal,
      color: COLORS[index % COLORS.length]
    }));
  }, [comparisonResults]);

  const handleProposalToggle = (proposalId: string) => {
    setSelectedProposals(prev => {
      if (prev.includes(proposalId)) {
        return prev.filter(id => id !== proposalId);
      } else if (prev.length < 4) {
        return [...prev, proposalId];
      }
      return prev;
    });
  };

  const handleExport = async (format: 'csv' | 'pdf') => {
    try {
      await exportData(format);
      if (onExport) {
        onExport(format);
      }
    } catch (error) {
      logError('Erro na exportação', 'ProposalComparison', { error: error instanceof Error ? error.message : String(error) });
    }
  };

  const handleCriteriaChange = (newCriteria: Record<string, unknown>) => {
    updateCriteria(newCriteria);
  };

  const renderChart = () => {
    if (chartData.length === 0) return null;

    switch (chartType) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value, name) => {
                if (name === 'VPL' || name === 'Economia') {
                  return [formatCurrency(value as number), name];
                }
                if (name === 'TIR' || name === 'ROI') {
                  return [formatPercentage((value as number) / 100), name];
                }
                if (name === 'Payback') {
                  return [`${(value as number).toFixed(1)} anos`, name];
                }
                return [value, name];
              }} />
              <Bar dataKey="VPL" fill={COLORS[0]} name="VPL" />
              <Bar dataKey="TIR" fill={COLORS[1]} name="TIR (%)" />
              <Bar dataKey="Payback" fill={COLORS[2]} name="Payback" />
            </BarChart>
          </ResponsiveContainer>
        );
      
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value, name) => {
                if (name === 'VPL' || name === 'Economia') {
                  return [formatCurrency(value as number), name];
                }
                if (name === 'TIR' || name === 'ROI') {
                  return [formatPercentage((value as number) / 100), name];
                }
                return [value, name];
              }} />
              <Line type="monotone" dataKey="VPL" stroke={COLORS[0]} strokeWidth={2} />
              <Line type="monotone" dataKey="ROI" stroke={COLORS[1]} strokeWidth={2} />
              <Line type="monotone" dataKey="Economia" stroke={COLORS[2]} strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
      
      case 'pie': {
        const pieData = chartData.map((item, index) => ({
          name: item.name,
          value: item.VPL,
          fill: COLORS[index % COLORS.length]
        }));
        
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [formatCurrency(value as number), 'VPL']} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        );
      }
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Comparação de Propostas</h2>
          <p className="text-muted-foreground">
            Compare até 4 propostas lado a lado
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => recalculate()}
            disabled={isLoading}
          >
            <Settings className="h-4 w-4 mr-2" />
            Recalcular
          </Button>
          
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExport('csv')}
            disabled={selectedProposalData.length === 0 || isLoading}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          
          {onAddProposal && (
            <Button onClick={onAddProposal} size="sm" disabled={isLoading}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Proposta
            </Button>
          )}
        </div>
      </div>

      {/* Proposal Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Selecionar Propostas</CardTitle>
          <CardDescription>
            Escolha até 4 propostas para comparar ({selectedProposals.length}/4 selecionadas)
            {isLoading && (
              <div className="mt-2 flex items-center gap-2 text-sm text-blue-600">
                <Loader2 className="h-4 w-4 animate-spin" />
                Calculando comparação...
              </div>
            )}
            {error && (
              <Alert className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {criteriaValidation && !criteriaValidation.isValid && (
              <Alert className="mt-2">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Critérios inválidos: {criteriaValidation.errors.join(', ')}
                </AlertDescription>
              </Alert>
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {proposals.map((proposal) => {
              const isSelected = selectedProposals.includes(proposal.id);
              const canSelect = selectedProposals.length < 4 || isSelected;
              
              return (
                <div
                  key={proposal.id}
                  className={`p-3 border rounded-lg cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-primary bg-primary/5' 
                      : canSelect 
                        ? 'border-border hover:border-primary/50' 
                        : 'border-border opacity-50 cursor-not-allowed'
                  }`}
                  onClick={() => canSelect && handleProposalToggle(proposal.id)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium truncate">{proposal.name}</h4>
                    <div className="flex items-center gap-1">
                      {isSelected && (
                        <Badge variant="default" className="text-xs">
                          Selecionada
                        </Badge>
                      )}
                      {onRemoveProposal && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveProposal(proposal.id);
                          }}
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  
                  <div className="text-sm text-muted-foreground">
                      <div>Potência: {proposal.systemPower.toFixed(1)} kWp</div>
                      <div>Investimento: {formatCurrency(proposal.totalInvestment)}</div>
                    </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {selectedProposalData.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">Nenhuma proposta selecionada</h3>
            <p className="text-muted-foreground">
              Selecione pelo menos uma proposta para visualizar a comparação
            </p>
          </CardContent>
        </Card>
      ) : viewMode === 'advanced' ? (
        <ProposalComparisonInterface
          proposals={selectedProposalData}
          comparisonResults={comparisonResults}
          ranking={ranking}
          onCriteriaChange={handleCriteriaChange}
          onExport={handleExport}
        />
      ) : (
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="financial">Análise Financeira</TabsTrigger>
            <TabsTrigger value="technical">Dados Técnicos</TabsTrigger>
            <TabsTrigger value="ranking">Ranking</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* Charts */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Comparação Visual</CardTitle>
                    <CardDescription>
                      Análise gráfica dos principais indicadores
                    </CardDescription>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Button
                      variant={chartType === 'bar' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setChartType('bar')}
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={chartType === 'line' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setChartType('line')}
                    >
                      <LineChartIcon className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={chartType === 'pie' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setChartType('pie')}
                    >
                      <PieChartIcon className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {renderChart()}
              </CardContent>
            </Card>

            {/* Quick Comparison Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {comparisonResults.map((result, index) => (
                <Card key={result.proposal.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg truncate">
                        {result.proposal.name}
                      </CardTitle>
                      {index === 0 && (
                        <Badge variant="default" className="text-xs">
                          <Award className="h-3 w-3 mr-1" />
                          Melhor
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <MetricCard
                      title="VPL"
                      value={result.results.vpl}
                      unit="currency"
                      highlight={index === 0}
                    />
                    <MetricCard
                      title="TIR"
                      value={result.results.tir}
                      unit="percentage"
                    />
                    <MetricCard
                      title="Payback"
                      value={result.results.payback}
                      unit="years"
                    />
                    <MetricCard
                      title="Economia Total"
                      value={result.results.totalSavings || result.results.economiaTotal}
                      unit="currency"
                    />
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="financial" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Análise Financeira Detalhada</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Métrica</th>
                        {selectedProposalData.map(proposal => (
                          <th key={proposal.id} className="text-center p-3 font-medium">
                            {proposal.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-3 font-medium">Investimento Total</td>
                        {comparisonResults.map(result => (
                          <td key={result.proposal.id} className="text-center p-3">
                            {formatCurrency(result.proposal.totalInvestment)}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 font-medium">VPL (20 anos)</td>
                        {comparisonResults.map(result => (
                          <td key={result.proposal.id} className="text-center p-3">
                            {formatCurrency(result.results.vpl)}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 font-medium">TIR</td>
                        {comparisonResults.map(result => (
                          <td key={result.proposal.id} className="text-center p-3">
                            {formatPercentage(result.results.tir)}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 font-medium">Payback</td>
                        {comparisonResults.map(result => (
                          <td key={result.proposal.id} className="text-center p-3">
                            {result.results.payback.toFixed(1)} anos
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 font-medium">ROI (20 anos)</td>
                        {comparisonResults.map(result => (
                          <td key={result.proposal.id} className="text-center p-3">
                            {formatPercentage(result.results.roi)}
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 font-medium">Economia Total</td>
                        {comparisonResults.map(result => (
                          <td key={result.proposal.id} className="text-center p-3">
                            {formatCurrency(result.results.totalSavings || result.results.economiaTotal)}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="technical" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Especificações Técnicas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 font-medium">Especificação</th>
                        {selectedProposalData.map(proposal => (
                          <th key={proposal.id} className="text-center p-3 font-medium">
                            {proposal.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="p-3 font-medium">Potência do Sistema</td>
                        {selectedProposalData.map(proposal => (
                          <td key={proposal.id} className="text-center p-3">
                            {proposal.systemPower.toFixed(1)} kWp
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 font-medium">Geração Anual Estimada</td>
                        {selectedProposalData.map(proposal => (
                          <td key={proposal.id} className="text-center p-3">
                            {proposal.annualGeneration.toLocaleString('pt-BR')} kWh
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 font-medium">Área Necessária</td>
                        {selectedProposalData.map(proposal => (
                          <td key={proposal.id} className="text-center p-3">
                            {proposal.roofArea?.toFixed(1) || 'N/A'} m²
                          </td>
                        ))}
                      </tr>
                      <tr className="border-b">
                        <td className="p-3 font-medium">Economia Mensal</td>
                        {selectedProposalData.map(proposal => (
                          <td key={proposal.id} className="text-center p-3">
                            {formatCurrency(proposal.monthlySavings)}
                          </td>
                        ))}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ranking" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ranking das Propostas</CardTitle>
                <CardDescription>
                  Classificação baseada em critérios ponderados
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ranking.map((item, index) => (
                    <div key={item.proposal.id} className="flex items-center gap-4 p-4 border rounded-lg">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold">
                        {index + 1}
                      </div>
                      
                      <div className="flex-1">
                        <h4 className="font-medium">{item.proposal.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          Score: {item.score.toFixed(2)} | VPL: {formatCurrency(item.vpl)} | TIR: {formatPercentage(item.tir)}
                        </p>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-lg font-bold">
                          {formatPercentage(item.score / 100)}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Score Total
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}