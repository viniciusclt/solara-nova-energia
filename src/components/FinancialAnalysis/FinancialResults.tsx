/**
 * Componente de Resultados da Análise Financeira
 * Carregado de forma lazy para otimizar performance
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Zap, 
  Target, 
  PiggyBank, 
  Shield,
  Info,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { ResultadoFinanceiroEnhanced, ParametrosSistemaEnhanced } from '@/services/CalculadoraSolarServiceEnhanced';
import { FinancialCardSkeleton } from '@/components/ui/LoadingBoundary';

interface FinancialResultsProps {
  resultado: ResultadoFinanceiroEnhanced | null;
  parametros: ParametrosSistemaEnhanced;
  loading: boolean;
}

export const FinancialResults: React.FC<FinancialResultsProps> = ({
  resultado,
  parametros,
  loading
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <FinancialCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!resultado) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Configure os parâmetros e execute a análise para visualizar os resultados.
        </AlertDescription>
      </Alert>
    );
  }

  // Determinar viabilidade do projeto
  const isViable = resultado.vpl > 0 && resultado.tir > parametros.taxa_desconto_anual;
  const paybackYears = resultado.payback_simples_anos;
  const roiPercentage = ((resultado.economia_total_25_anos - parametros.custo_sistema) / parametros.custo_sistema) * 100;

  return (
    <div className="space-y-6">
      {/* Indicador de Viabilidade */}
      <Alert className={isViable ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
        {isViable ? (
          <CheckCircle className="h-4 w-4 text-green-600" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
        )}
        <AlertDescription className={isViable ? 'text-green-800' : 'text-yellow-800'}>
          <strong>
            {isViable 
              ? 'Projeto Viável: ' 
              : 'Atenção: '
            }
          </strong>
          {isViable 
            ? `VPL positivo de R$ ${resultado.vpl.toLocaleString('pt-BR')} e TIR de ${(resultado.tir * 100).toFixed(2)}%`
            : `VPL de R$ ${resultado.vpl.toLocaleString('pt-BR')} e TIR de ${(resultado.tir * 100).toFixed(2)}% - Revisar parâmetros`
          }
        </AlertDescription>
      </Alert>

      {/* Indicadores Principais */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* VPL */}
        <Card className={resultado.vpl > 0 ? 'border-green-200' : 'border-red-200'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Valor Presente Líquido</CardTitle>
            <TrendingUp className={`h-4 w-4 ${resultado.vpl > 0 ? 'text-green-600' : 'text-red-600'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              R$ {resultado.vpl.toLocaleString('pt-BR')}
            </div>
            <Badge variant={resultado.vpl > 0 ? 'default' : 'destructive'} className="mt-2">
              {resultado.vpl > 0 ? 'Positivo' : 'Negativo'}
            </Badge>
          </CardContent>
        </Card>

        {/* TIR */}
        <Card className={resultado.tir > parametros.taxa_desconto_anual ? 'border-green-200' : 'border-yellow-200'}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taxa Interna de Retorno</CardTitle>
            <Target className={`h-4 w-4 ${
              resultado.tir > parametros.taxa_desconto_anual ? 'text-green-600' : 'text-yellow-600'
            }`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(resultado.tir * 100).toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Taxa de desconto: {(parametros.taxa_desconto_anual * 100).toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        {/* Payback */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payback Simples</CardTitle>
            <Calendar className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              {paybackYears.toFixed(1)} anos
            </div>
            <Progress 
              value={Math.min((paybackYears / 10) * 100, 100)} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        {/* ROI */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">ROI (25 anos)</CardTitle>
            <PiggyBank className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {roiPercentage.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Retorno sobre investimento
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Resumo Financeiro */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Resumo Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Investimento Inicial:</span>
              <span className="font-bold">R$ {parametros.custo_sistema.toLocaleString('pt-BR')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Economia Total (25 anos):</span>
              <span className="font-bold text-green-600">
                R$ {resultado.economia_total_25_anos.toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Economia Anual Média:</span>
              <span className="font-bold">
                R$ {(resultado.economia_total_25_anos / 25).toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Lucro Líquido:</span>
              <span className={`font-bold ${
                resultado.economia_total_25_anos > parametros.custo_sistema 
                  ? 'text-green-600' 
                  : 'text-red-600'
              }`}>
                R$ {(resultado.economia_total_25_anos - parametros.custo_sistema).toLocaleString('pt-BR')}
              </span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Resumo Energético
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Geração Total (25 anos):</span>
              <span className="font-bold">
                {(resultado.geracao_total_25_anos / 1000).toFixed(1)} MWh
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Autoconsumo Total:</span>
              <span className="font-bold text-green-600">
                {(resultado.autoconsumo_total_25_anos / 1000).toFixed(1)} MWh
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Energia Injetada:</span>
              <span className="font-bold text-blue-600">
                {(resultado.energia_injetada_total_25_anos / 1000).toFixed(1)} MWh
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Taxa de Autoconsumo:</span>
              <span className="font-bold">
                {((resultado.autoconsumo_total_25_anos / resultado.geracao_total_25_anos) * 100).toFixed(1)}%
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Impacto Ambiental */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Impacto Ambiental
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {(resultado.reducao_co2_25_anos / 1000).toFixed(1)}
              </div>
              <p className="text-sm text-muted-foreground">Toneladas de CO₂ evitadas</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {Math.round(resultado.reducao_co2_25_anos / 2.3)}
              </div>
              <p className="text-sm text-muted-foreground">Árvores equivalentes plantadas</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(resultado.geracao_total_25_anos / 1000 / 8.5)}
              </div>
              <p className="text-sm text-muted-foreground">Carros elétricos abastecidos/ano</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Análise de Sensibilidade */}
      <Card>
        <CardHeader>
          <CardTitle>Análise de Sensibilidade</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Sensibilidade ao Custo (+10%):</span>
                <span className="text-sm">
                  VPL: R$ {(resultado.vpl - parametros.custo_sistema * 0.1).toLocaleString('pt-BR')}
                </span>
              </div>
              <Progress 
                value={Math.max(0, Math.min(100, ((resultado.vpl - parametros.custo_sistema * 0.1) / resultado.vpl) * 100))}
                className="h-2"
              />
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Sensibilidade à Geração (-10%):</span>
                <span className="text-sm">
                  Economia: R$ {(resultado.economia_total_25_anos * 0.9).toLocaleString('pt-BR')}
                </span>
              </div>
              <Progress 
                value={90}
                className="h-2"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialResults;