import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';
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
  Cell
} from 'recharts';
import { FinancialData } from './types';

interface FinancialChartsProps {
  financialData: FinancialData;
}

export const FinancialCharts: React.FC<FinancialChartsProps> = ({ financialData }) => {
  // Dados para gráfico de fluxo de caixa
  const fluxoCaixaData = useMemo(() => {
    const data = [];
    let fluxoAcumulado = -financialData.valorFinal;
    const consumoAnual = financialData.consumoMensal * 12;
    const geracaoAnual = consumoAnual * 0.95; // 95% de offset
    
    for (let ano = 0; ano <= 25; ano++) {
      if (ano === 0) {
        data.push({
          ano,
          fluxoAnual: -financialData.valorFinal,
          fluxoAcumulado,
          economia: 0,
          tarifaAno: financialData.tarifaEletrica
        });
      } else {
        const tarifaAno = financialData.tarifaEletrica * Math.pow(1 + financialData.reajusteTarifario / 100, ano - 1);
        const economiaAno = geracaoAnual * tarifaAno;
        fluxoAcumulado += economiaAno;
        
        data.push({
          ano,
          fluxoAnual: economiaAno,
          fluxoAcumulado,
          economia: economiaAno,
          tarifaAno
        });
      }
    }
    
    return data;
  }, [financialData]);

  // Dados para gráfico de composição de custos
  const custosData = useMemo(() => {
    const valorBase = financialData.valorSistema;
    const bdiValor = valorBase * (financialData.bdi / 100);
    const markupValor = (valorBase + bdiValor) * (financialData.markup / 100);
    const margemValor = (valorBase + bdiValor + markupValor) * (financialData.margem / 100);
    const comissaoValor = financialData.comissaoExterna;
    const outrosValor = financialData.outrosGastos;
    
    return [
      { name: 'Sistema Base', value: valorBase, color: '#8884d8' },
      { name: 'BDI', value: bdiValor, color: '#82ca9d' },
      { name: 'Markup', value: markupValor, color: '#ffc658' },
      { name: 'Margem', value: margemValor, color: '#ff7300' },
      { name: 'Comissão Externa', value: comissaoValor, color: '#00ff00' },
      { name: 'Outros Gastos', value: outrosValor, color: '#ff0000' }
    ].filter(item => item.value > 0);
  }, [financialData]);

  // Dados para comparação de cenários
  const cenariosData = useMemo(() => {
    const cenarios = [
      { nome: 'Conservador', reajuste: financialData.reajusteTarifario - 2 },
      { nome: 'Atual', reajuste: financialData.reajusteTarifario },
      { nome: 'Otimista', reajuste: financialData.reajusteTarifario + 2 }
    ];
    
    return cenarios.map(cenario => {
      const consumoAnual = financialData.consumoMensal * 12;
      const geracaoAnual = consumoAnual * 0.95;
      let economia25Anos = 0;
      
      for (let ano = 1; ano <= 25; ano++) {
        const tarifaAno = financialData.tarifaEletrica * Math.pow(1 + cenario.reajuste / 100, ano - 1);
        economia25Anos += geracaoAnual * tarifaAno;
      }
      
      const payback = financialData.valorFinal / (geracaoAnual * financialData.tarifaEletrica);
      
      return {
        cenario: cenario.nome,
        economia25Anos,
        payback,
        roi: ((economia25Anos - financialData.valorFinal) / financialData.valorFinal) * 100
      };
    });
  }, [financialData]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Fluxo de Caixa */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Fluxo de Caixa (25 anos)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={fluxoCaixaData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="ano" 
                  label={{ value: 'Anos', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  tickFormatter={formatCurrency}
                  label={{ value: 'Valor (R$)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value: number, name: string) => [
                    formatCurrency(value), 
                    name === 'fluxoAcumulado' ? 'Fluxo Acumulado' : 'Fluxo Anual'
                  ]}
                  labelFormatter={(label) => `Ano ${label}`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="fluxoAcumulado" 
                  stroke="#8884d8" 
                  strokeWidth={3}
                  name="Fluxo Acumulado"
                />
                <Line 
                  type="monotone" 
                  dataKey="fluxoAnual" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  name="Fluxo Anual"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Composição de Custos */}
        <Card>
          <CardHeader>
            <CardTitle>Composição de Custos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={custosData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {custosData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Comparação de Cenários */}
        <Card>
          <CardHeader>
            <CardTitle>Análise de Cenários</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={cenariosData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="cenario" />
                  <YAxis tickFormatter={formatNumber} />
                  <Tooltip 
                    formatter={(value: number, name: string) => {
                      if (name === 'economia25Anos') return [formatCurrency(value), 'Economia 25 anos'];
                      if (name === 'payback') return [`${formatNumber(value)} anos`, 'Payback'];
                      if (name === 'roi') return [`${formatNumber(value)}%`, 'ROI'];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Bar dataKey="payback" fill="#8884d8" name="Payback (anos)" />
                  <Bar dataKey="roi" fill="#82ca9d" name="ROI (%)" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Evolução da Tarifa */}
      <Card>
        <CardHeader>
          <CardTitle>Evolução da Tarifa Elétrica</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={fluxoCaixaData.slice(1, 11)}> {/* Primeiros 10 anos */}
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="ano" 
                  label={{ value: 'Anos', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  tickFormatter={(value) => `R$ ${formatNumber(value)}`}
                  label={{ value: 'Tarifa (R$/kWh)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value: number) => [`R$ ${formatNumber(value, 3)}`, 'Tarifa']}
                  labelFormatter={(label) => `Ano ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="tarifaAno" 
                  stroke="#ff7300" 
                  strokeWidth={3}
                  name="Tarifa Elétrica"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};