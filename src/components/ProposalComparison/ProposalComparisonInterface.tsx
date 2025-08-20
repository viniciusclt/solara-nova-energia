import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Separator } from '../ui/separator';
import { ScrollArea } from '../ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Slider } from '../ui/slider';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
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
  Settings,
  Eye,
  EyeOff,
  Crown,
  Medal,
  Trophy
} from 'lucide-react';
import { type ProposalData, type ComparisonResult, type RankingResult } from '../../services/ProposalComparisonService';
import { formatCurrency, formatPercentage } from '../../utils/formatters';

interface ProposalComparisonInterfaceProps {
  proposals: ProposalData[];
  comparisonResults: ComparisonResult[];
  ranking: RankingResult[];
  onCriteriaChange: (criteria: ComparisonCriteria) => void;
  onExport: (format: 'csv' | 'pdf') => void;
}

interface ComparisonCriteria {
  vpl_weight: number;
  tir_weight: number;
  payback_weight: number;
  roi_weight: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const getRankingIcon = (position: number) => {
  switch (position) {
    case 1:
      return <Crown className="h-5 w-5 text-yellow-500" />;
    case 2:
      return <Medal className="h-5 w-5 text-gray-400" />;
    case 3:
      return <Trophy className="h-5 w-5 text-amber-600" />;
    default:
      return <span className="h-5 w-5 flex items-center justify-center text-sm font-bold text-muted-foreground">{position}</span>;
  }
};

const getRankingBadgeColor = (position: number) => {
  switch (position) {
    case 1:
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 2:
      return 'bg-gray-100 text-gray-800 border-gray-300';
    case 3:
      return 'bg-amber-100 text-amber-800 border-amber-300';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export function ProposalComparisonInterface({
  proposals,
  comparisonResults,
  ranking,
  onCriteriaChange,
  onExport
}: ProposalComparisonInterfaceProps) {
  const [criteria, setCriteria] = useState<ComparisonCriteria>({
    vpl_weight: 0.3,
    tir_weight: 0.25,
    payback_weight: 0.25,
    roi_weight: 0.2
  });
  const [showCriteriaPanel, setShowCriteriaPanel] = useState(false);
  const [selectedMetrics, setSelectedMetrics] = useState({
    vpl: true,
    tir: true,
    payback: true,
    roi: true,
    economia: true
  });

  const handleCriteriaChange = (key: keyof ComparisonCriteria, value: number) => {
    const newCriteria = { ...criteria, [key]: value / 100 };
    setCriteria(newCriteria);
    onCriteriaChange(newCriteria);
  };

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

  const radarData = useMemo(() => {
    return comparisonResults.map(result => {
      const rankingItem = ranking.find(r => r.proposalId === result.proposal.id);
      return {
        name: result.proposal.name,
        VPL: Math.min(100, (result.results.vpl / Math.max(...comparisonResults.map(r => r.results.vpl))) * 100),
        TIR: Math.min(100, (result.results.tir / Math.max(...comparisonResults.map(r => r.results.tir))) * 100),
        Payback: Math.min(100, 100 - (result.results.payback / Math.max(...comparisonResults.map(r => r.results.payback))) * 100),
        ROI: Math.min(100, (result.results.roi / Math.max(...comparisonResults.map(r => r.results.roi))) * 100),
        Score: rankingItem ? rankingItem.score * 100 : 0
      };
    });
  }, [comparisonResults, ranking]);

  const bestMetrics = useMemo(() => {
    if (comparisonResults.length === 0) return {};
    
    const bestVPL = comparisonResults.reduce((best, current) => 
      current.results.vpl > best.results.vpl ? current : best
    );
    const bestTIR = comparisonResults.reduce((best, current) => 
      current.results.tir > best.results.tir ? current : best
    );
    const bestPayback = comparisonResults.reduce((best, current) => 
      current.results.payback < best.results.payback ? current : best
    );
    const bestROI = comparisonResults.reduce((best, current) => 
      current.results.roi > best.results.roi ? current : best
    );

    return { bestVPL, bestTIR, bestPayback, bestROI };
  }, [comparisonResults]);

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Comparação de Propostas</h2>
          <p className="text-muted-foreground">
            Comparando {comparisonResults.length} propostas com ranking automático
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCriteriaPanel(!showCriteriaPanel)}
          >
            <Settings className="h-4 w-4 mr-2" />
            Critérios
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport('csv')}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar CSV
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onExport('pdf')}
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar PDF
          </Button>
        </div>
      </div>

      {/* Painel de critérios */}
      {showCriteriaPanel && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Critérios de Comparação
            </CardTitle>
            <CardDescription>
              Ajuste os pesos para cada métrica no cálculo do ranking
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="space-y-2">
                <Label>VPL ({Math.round(criteria.vpl_weight * 100)}%)</Label>
                <Slider
                  value={[criteria.vpl_weight * 100]}
                  onValueChange={([value]) => handleCriteriaChange('vpl_weight', value)}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label>TIR ({Math.round(criteria.tir_weight * 100)}%)</Label>
                <Slider
                  value={[criteria.tir_weight * 100]}
                  onValueChange={([value]) => handleCriteriaChange('tir_weight', value)}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label>Payback ({Math.round(criteria.payback_weight * 100)}%)</Label>
                <Slider
                  value={[criteria.payback_weight * 100]}
                  onValueChange={([value]) => handleCriteriaChange('payback_weight', value)}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label>ROI ({Math.round(criteria.roi_weight * 100)}%)</Label>
                <Slider
                  value={[criteria.roi_weight * 100]}
                  onValueChange={([value]) => handleCriteriaChange('roi_weight', value)}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            </div>
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">
                Total: {Math.round((criteria.vpl_weight + criteria.tir_weight + criteria.payback_weight + criteria.roi_weight) * 100)}%
                {Math.abs((criteria.vpl_weight + criteria.tir_weight + criteria.payback_weight + criteria.roi_weight) - 1) > 0.01 && (
                  <span className="text-orange-600 ml-2">
                    ⚠️ Recomendado: 100%
                  </span>
                )}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Ranking das propostas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            Ranking das Propostas
          </CardTitle>
          <CardDescription>
            Classificação baseada nos critérios ponderados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {ranking.map((item, index) => {
              const proposal = proposals.find(p => p.id === item.proposalId);
              const result = comparisonResults.find(r => r.proposal.id === item.proposalId);
              if (!proposal || !result) return null;

              return (
                <div
                  key={item.proposalId}
                  className={`flex items-center justify-between p-4 rounded-lg border ${
                    index === 0 ? 'border-yellow-300 bg-yellow-50' : 'border-border'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {getRankingIcon(item.position)}
                    <div>
                      <h4 className="font-semibold">{proposal.name}</h4>
                      <p className="text-sm text-muted-foreground">
                        Score: {(item.score * 100).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        VPL: {formatCurrency(result.results.vpl)}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        TIR: {formatPercentage(result.results.tir)}
                      </p>
                    </div>
                    <Badge className={getRankingBadgeColor(item.position)}>
                      #{item.position}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Visualizações */}
      <Tabs defaultValue="comparison" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="comparison">Comparação</TabsTrigger>
          <TabsTrigger value="radar">Análise Radar</TabsTrigger>
          <TabsTrigger value="details">Detalhes</TabsTrigger>
        </TabsList>

        <TabsContent value="comparison" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Gráfico de barras */}
            <Card>
              <CardHeader>
                <CardTitle>Comparação de Métricas</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value, name) => {
                      if (name === 'VPL' || name === 'Economia') {
                        return formatCurrency(value as number);
                      }
                      if (name === 'TIR' || name === 'ROI') {
                        return formatPercentage((value as number) / 100);
                      }
                      return `${value} anos`;
                    }} />
                    <Legend />
                    {selectedMetrics.vpl && <Bar dataKey="VPL" fill={COLORS[0]} />}
                    {selectedMetrics.tir && <Bar dataKey="TIR" fill={COLORS[1]} />}
                    {selectedMetrics.payback && <Bar dataKey="Payback" fill={COLORS[2]} />}
                    {selectedMetrics.roi && <Bar dataKey="ROI" fill={COLORS[3]} />}
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Melhores métricas */}
            <Card>
              <CardHeader>
                <CardTitle>Melhores em Cada Categoria</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {bestMetrics.bestVPL && (
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium text-blue-900">Melhor VPL</p>
                      <p className="text-sm text-blue-700">{bestMetrics.bestVPL.proposal.name}</p>
                    </div>
                    <p className="font-bold text-blue-900">
                      {formatCurrency(bestMetrics.bestVPL.results.vpl)}
                    </p>
                  </div>
                )}
                {bestMetrics.bestTIR && (
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <div>
                      <p className="font-medium text-green-900">Melhor TIR</p>
                      <p className="text-sm text-green-700">{bestMetrics.bestTIR.proposal.name}</p>
                    </div>
                    <p className="font-bold text-green-900">
                      {formatPercentage(bestMetrics.bestTIR.results.tir)}
                    </p>
                  </div>
                )}
                {bestMetrics.bestPayback && (
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <div>
                      <p className="font-medium text-orange-900">Melhor Payback</p>
                      <p className="text-sm text-orange-700">{bestMetrics.bestPayback.proposal.name}</p>
                    </div>
                    <p className="font-bold text-orange-900">
                      {bestMetrics.bestPayback.results.payback.toFixed(1)} anos
                    </p>
                  </div>
                )}
                {bestMetrics.bestROI && (
                  <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
                    <div>
                      <p className="font-medium text-purple-900">Melhor ROI</p>
                      <p className="text-sm text-purple-700">{bestMetrics.bestROI.proposal.name}</p>
                    </div>
                    <p className="font-bold text-purple-900">
                      {formatPercentage(bestMetrics.bestROI.results.roi)}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="radar">
          <Card>
            <CardHeader>
              <CardTitle>Análise Radar - Performance Normalizada</CardTitle>
              <CardDescription>
                Comparação visual das propostas em todas as métricas (0-100%)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={radarData}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="name" />
                  <PolarRadiusAxis angle={90} domain={[0, 100]} />
                  {comparisonResults.map((_, index) => (
                    <Radar
                      key={index}
                      name={comparisonResults[index].proposal.name}
                      dataKey={comparisonResults[index].proposal.name}
                      stroke={COLORS[index % COLORS.length]}
                      fill={COLORS[index % COLORS.length]}
                      fillOpacity={0.1}
                    />
                  ))}
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="details">
          <div className="grid grid-cols-1 gap-4">
            {comparisonResults.map((result, index) => {
              const rankingItem = ranking.find(r => r.proposalId === result.proposal.id);
              return (
                <Card key={result.proposal.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {rankingItem && getRankingIcon(rankingItem.position)}
                        {result.proposal.name}
                      </CardTitle>
                      {rankingItem && (
                        <Badge className={getRankingBadgeColor(rankingItem.position)}>
                          Score: {(rankingItem.score * 100).toFixed(1)}%
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-3 bg-blue-50 rounded-lg">
                        <DollarSign className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                        <p className="text-sm text-blue-600 font-medium">VPL</p>
                        <p className="text-lg font-bold text-blue-900">
                          {formatCurrency(result.results.vpl)}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded-lg">
                        <TrendingUp className="h-6 w-6 mx-auto mb-2 text-green-600" />
                        <p className="text-sm text-green-600 font-medium">TIR</p>
                        <p className="text-lg font-bold text-green-900">
                          {formatPercentage(result.results.tir)}
                        </p>
                      </div>
                      <div className="text-center p-3 bg-orange-50 rounded-lg">
                        <Calendar className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                        <p className="text-sm text-orange-600 font-medium">Payback</p>
                        <p className="text-lg font-bold text-orange-900">
                          {result.results.payback.toFixed(1)} anos
                        </p>
                      </div>
                      <div className="text-center p-3 bg-purple-50 rounded-lg">
                        <Zap className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                        <p className="text-sm text-purple-600 font-medium">ROI</p>
                        <p className="text-lg font-bold text-purple-900">
                          {formatPercentage(result.results.roi)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}