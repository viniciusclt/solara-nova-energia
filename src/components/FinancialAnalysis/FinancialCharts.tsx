/**
 * Componente de Gráficos da Análise Financeira
 * Carregado de forma lazy para otimizar performance
 */

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { BarChart3, TrendingUp, PieChart as PieChartIcon, Info } from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { ResultadoFinanceiroEnhanced, ParametrosSistemaEnhanced } from '@/services/CalculadoraSolarServiceEnhanced';
import { ChartSkeleton } from '@/components/ui/LoadingBoundary';

interface FinancialChartsProps {
  resultado: ResultadoFinanceiroEnhanced | null;
  parametros: ParametrosSistemaEnhanced;
}

// Cores para os gráficos
const COLORS = {
  primary: '#10b981',
  secondary: '#3b82f6',
  accent: '#f59e0b',
  danger: '#ef4444',
  success: '#22c55e',
  warning: '#f97316'
};

export const FinancialCharts: React.FC<FinancialChartsProps> = ({
  resultado,
  parametros
}) => {
  // Preparar dados para gráficos
  const chartData = useMemo(() => {
    if (!resultado) return null;
    
    // Dados anuais para gráfico de linha
    const dadosAnuais = resultado.resumo_anual.map(ano => ({
      ano: ano.ano,
      economia: Math.round(ano.economia_anual),
      geracao: Math.round(ano.geracao_anual),
      autoconsumo: Math.round(ano.autoconsumo_anual),
      injecao: Math.round(ano.injecao_anual),
      fluxo_acumulado: Math.round(ano.fluxo_caixa_acumulado)
    }));
    
    // Dados para gráfico de pizza (distribuição de energia)
    const dadosPizza = [
      { 
        name: 'Autoconsumo', 
        value: resultado.autoconsumo_total_25_anos, 
        color: COLORS.primary,
        percentage: ((resultado.autoconsumo_total_25_anos / resultado.geracao_total_25_anos) * 100).toFixed(1)
      },
      { 
        name: 'Energia Injetada', 
        value: resultado.energia_injetada_total_25_anos, 
        color: COLORS.secondary,
        percentage: ((resultado.energia_injetada_total_25_anos / resultado.geracao_total_25_anos) * 100).toFixed(1)
      },
      { 
        name: 'Créditos Não Utilizados', 
        value: resultado.creditos_nao_utilizados_25_anos, 
        color: COLORS.accent,
        percentage: ((resultado.creditos_nao_utilizados_25_anos / resultado.geracao_total_25_anos) * 100).toFixed(1)
      }
    ];
    
    // Dados para gráfico de fluxo de caixa
    const dadosFluxoCaixa = resultado.resumo_anual.map(ano => ({
      ano: ano.ano,
      fluxo_anual: Math.round(ano.economia_anual - (ano.ano === parametros.ano_instalacao ? parametros.custo_sistema : 0)),
      fluxo_acumulado: Math.round(ano.fluxo_caixa_acumulado),
      economia_acumulada: Math.round(ano.economia_acumulada)
    }));
    
    // Dados para gráfico de barras (economia vs geração)
    const dadosBarras = resultado.resumo_anual.slice(0, 10).map(ano => ({
      ano: ano.ano,
      economia: Math.round(ano.economia_anual / 1000), // Em milhares
      geracao: Math.round(ano.geracao_anual / 1000), // Em MWh
      autoconsumo: Math.round(ano.autoconsumo_anual / 1000)
    }));
    
    return { dadosAnuais, dadosPizza, dadosFluxoCaixa, dadosBarras };
  }, [resultado, parametros]);

  if (!resultado) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Execute a análise financeira para visualizar os gráficos.
        </AlertDescription>
      </Alert>
    );
  }

  if (!chartData) {
    return <ChartSkeleton />;
  }

  const { dadosAnuais, dadosPizza, dadosFluxoCaixa, dadosBarras } = chartData;

  return (
    <div className="space-y-6">
      {/* Gráfico de Fluxo de Caixa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Fluxo de Caixa Acumulado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dadosFluxoCaixa}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ano" />
                <YAxis 
                  tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    `R$ ${value.toLocaleString('pt-BR')}`,
                    name === 'fluxo_acumulado' ? 'Fluxo Acumulado' :
                    name === 'economia_acumulada' ? 'Economia Acumulada' : 'Fluxo Anual'
                  ]}
                  labelFormatter={(label) => `Ano: ${label}`}
                />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="fluxo_acumulado"
                  stackId="1"
                  stroke={COLORS.primary}
                  fill={COLORS.primary}
                  fillOpacity={0.6}
                  name="Fluxo Acumulado"
                />
                <Area
                  type="monotone"
                  dataKey="economia_acumulada"
                  stackId="2"
                  stroke={COLORS.secondary}
                  fill={COLORS.secondary}
                  fillOpacity={0.4}
                  name="Economia Acumulada"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gráfico de Distribuição de Energia */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Distribuição de Energia (25 anos)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={dadosPizza}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name}: ${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {dadosPizza.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [
                      `${(value / 1000).toFixed(1)} MWh`,
                      'Energia'
                    ]}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Gráfico de Barras - Economia vs Geração */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Economia vs Geração (10 anos)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dadosBarras}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="ano" />
                  <YAxis 
                    yAxisId="left"
                    tickFormatter={(value) => `R$ ${value}k`}
                  />
                  <YAxis 
                    yAxisId="right"
                    orientation="right"
                    tickFormatter={(value) => `${value} MWh`}
                  />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      if (name === 'economia') {
                        return [`R$ ${(value * 1000).toLocaleString('pt-BR')}`, 'Economia Anual'];
                      }
                      return [`${value} MWh`, name === 'geracao' ? 'Geração' : 'Autoconsumo'];
                    }}
                    labelFormatter={(label) => `Ano: ${label}`}
                  />
                  <Legend />
                  <Bar 
                    yAxisId="left"
                    dataKey="economia" 
                    fill={COLORS.success} 
                    name="Economia (R$ mil)"
                  />
                  <Bar 
                    yAxisId="right"
                    dataKey="geracao" 
                    fill={COLORS.primary} 
                    name="Geração (MWh)"
                  />
                  <Bar 
                    yAxisId="right"
                    dataKey="autoconsumo" 
                    fill={COLORS.secondary} 
                    name="Autoconsumo (MWh)"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Linha - Evolução Anual */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Evolução Anual de Indicadores
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dadosAnuais}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="ano" />
                <YAxis 
                  tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => {
                    const labels: Record<string, string> = {
                      economia: 'Economia Anual',
                      geracao: 'Geração Anual',
                      autoconsumo: 'Autoconsumo',
                      injecao: 'Energia Injetada'
                    };
                    return [
                      name === 'economia' 
                        ? `R$ ${value.toLocaleString('pt-BR')}`
                        : `${value.toLocaleString('pt-BR')} kWh`,
                      labels[name] || name
                    ];
                  }}
                  labelFormatter={(label) => `Ano: ${label}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="economia"
                  stroke={COLORS.success}
                  strokeWidth={3}
                  name="Economia (R$)"
                />
                <Line
                  type="monotone"
                  dataKey="geracao"
                  stroke={COLORS.primary}
                  strokeWidth={2}
                  name="Geração (kWh)"
                />
                <Line
                  type="monotone"
                  dataKey="autoconsumo"
                  stroke={COLORS.secondary}
                  strokeWidth={2}
                  name="Autoconsumo (kWh)"
                />
                <Line
                  type="monotone"
                  dataKey="injecao"
                  stroke={COLORS.accent}
                  strokeWidth={2}
                  name="Injeção (kWh)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialCharts;