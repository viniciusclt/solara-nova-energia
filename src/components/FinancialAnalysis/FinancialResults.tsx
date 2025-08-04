import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { TrendingUp, DollarSign, Calculator, PiggyBank, Target } from 'lucide-react';
import { FinancialData } from './types';

interface FinancialResultsProps {
  financialData: FinancialData;
}

export const FinancialResults: React.FC<FinancialResultsProps> = ({ financialData }) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value: number, decimals = 1) => {
    return new Intl.NumberFormat('pt-BR', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    }).format(value);
  };

  const getPaybackStatus = (payback: number) => {
    if (payback <= 4) return { color: 'bg-green-500', text: 'Excelente', variant: 'default' as const };
    if (payback <= 6) return { color: 'bg-blue-500', text: 'Muito Bom', variant: 'secondary' as const };
    if (payback <= 8) return { color: 'bg-yellow-500', text: 'Bom', variant: 'outline' as const };
    return { color: 'bg-red-500', text: 'Atenção', variant: 'destructive' as const };
  };

  const getTirStatus = (tir: number) => {
    if (tir >= 20) return { color: 'bg-green-500', text: 'Excelente', variant: 'default' as const };
    if (tir >= 15) return { color: 'bg-blue-500', text: 'Muito Bom', variant: 'secondary' as const };
    if (tir >= 10) return { color: 'bg-yellow-500', text: 'Bom', variant: 'outline' as const };
    return { color: 'bg-red-500', text: 'Baixo', variant: 'destructive' as const };
  };

  const paybackStatus = getPaybackStatus(financialData.payback);
  const tirStatus = getTirStatus(financialData.tir);

  return (
    <div className="space-y-6">
      {/* Métricas Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Payback */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Payback</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{formatNumber(financialData.payback)}</p>
                  <span className="text-sm text-muted-foreground">anos</span>
                </div>
                <Badge variant={paybackStatus.variant} className="mt-2">
                  {paybackStatus.text}
                </Badge>
              </div>
              <Target className="h-8 w-8 text-muted-foreground" />
            </div>
            <Progress 
              value={Math.min((8 / financialData.payback) * 100, 100)} 
              className="mt-3" 
            />
          </CardContent>
        </Card>

        {/* TIR */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">TIR</p>
                <div className="flex items-center gap-2">
                  <p className="text-2xl font-bold">{formatNumber(financialData.tir)}</p>
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
                <Badge variant={tirStatus.variant} className="mt-2">
                  {tirStatus.text}
                </Badge>
              </div>
              <TrendingUp className="h-8 w-8 text-muted-foreground" />
            </div>
            <Progress 
              value={Math.min((financialData.tir / 25) * 100, 100)} 
              className="mt-3" 
            />
          </CardContent>
        </Card>

        {/* VPL */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">VPL</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(financialData.vpl)}
                </p>
                <Badge variant={financialData.vpl > 0 ? 'default' : 'destructive'} className="mt-2">
                  {financialData.vpl > 0 ? 'Positivo' : 'Negativo'}
                </Badge>
              </div>
              <DollarSign className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Economia Anual */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Economia Anual</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(financialData.economiaAnual)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatCurrency(financialData.economiaAnual / 12)}/mês
                </p>
              </div>
              <PiggyBank className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Resumo Financeiro */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Resumo Financeiro
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Investimento */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Investimento</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor do Sistema:</span>
                  <span className="font-medium">{formatCurrency(financialData.valorSistema)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Valor Final:</span>
                  <span className="font-medium">{formatCurrency(financialData.valorFinal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Custo por Wp:</span>
                  <span className="font-medium">R$ {formatNumber(financialData.custoWp, 2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Potência:</span>
                  <span className="font-medium">{formatNumber(financialData.potenciaSistema)} kWp</span>
                </div>
              </div>
            </div>

            {/* Retorno */}
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Retorno</h4>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Economia em 25 anos:</span>
                  <span className="font-medium text-green-600">{formatCurrency(financialData.economia25Anos)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Geração Anual:</span>
                  <span className="font-medium">{formatNumber(financialData.geracaoAnual, 0)} kWh</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tarifa Elétrica:</span>
                  <span className="font-medium">R$ {formatNumber(financialData.tarifaEletrica, 3)}/kWh</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Reajuste Anual:</span>
                  <span className="font-medium">{formatNumber(financialData.reajusteTarifario)}%</span>
                </div>
              </div>
            </div>
          </div>

          {/* Indicadores de Performance */}
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-semibold text-lg mb-4">Indicadores de Performance</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {formatNumber((financialData.economia25Anos / financialData.valorFinal) * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">Retorno Total</div>
              </div>
              
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {formatNumber(financialData.geracaoAnual / financialData.potenciaSistema, 0)}
                </div>
                <div className="text-sm text-muted-foreground">kWh/kWp/ano</div>
              </div>
              
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {formatNumber((financialData.geracaoAnual * 12) / (financialData.consumoMensal * 12) * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">Offset Energético</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};