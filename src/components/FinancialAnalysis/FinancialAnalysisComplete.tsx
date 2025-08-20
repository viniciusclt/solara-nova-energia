/**
 * Componente completo de Análise Financeira com lazy loading otimizado
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Calculator, TrendingUp, BarChart3, FileText, Settings, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { LoadingBoundary } from '@/components/ui/LoadingBoundary';
import { CalculadoraSolarServiceEnhanced, ParametrosSistemaEnhanced, ResultadoFinanceiroEnhanced } from '@/services/CalculadoraSolarServiceEnhanced';
import { useFinancialWorker } from '@/hooks/useFinancialWorker';

// Lazy loading dos componentes pesados
const FinancialConfiguration = React.lazy(() => 
  import('./FinancialConfiguration').then(module => ({
    default: module.FinancialConfiguration
  }))
);

const FinancialResults = React.lazy(() => 
  import('./FinancialResults').then(module => ({
    default: module.FinancialResults
  }))
);

const FinancialCharts = React.lazy(() => 
  import('./FinancialCharts').then(module => ({
    default: module.FinancialCharts
  }))
);

const FinancialReport = React.lazy(() => 
  import('./FinancialReport').then(module => ({
    default: module.FinancialReport
  }))
);

interface FinancialAnalysisCompleteProps {
  initialParams?: Partial<ParametrosSistemaEnhanced>;
  onResultChange?: (result: ResultadoFinanceiroEnhanced | null) => void;
}

export const FinancialAnalysisComplete: React.FC<FinancialAnalysisCompleteProps> = ({
  initialParams,
  onResultChange
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [calculadoraService] = useState(() => new CalculadoraSolarServiceEnhanced());
  const [resultado, setResultado] = useState<ResultadoFinanceiroEnhanced | null>(null);
  const [activeTab, setActiveTab] = useState('configuracao');
  
  // Hook para Web Workers de cálculos financeiros
  const {
    calculateFinancial,
    calculateVPL,
    calculateTIR,
    cancelCalculation,
    state: workerState,
    isWorkerSupported
  } = useFinancialWorker();
  
  // Parâmetros do sistema com valores padrão
  const [parametros, setParametros] = useState<ParametrosSistemaEnhanced>({
    custo_sistema: 50000,
    potencia_sistema_kwp: 10,
    geracao_anual_kwh: 15000,
    consumo_mensal_kwh: 1000,
    incremento_consumo_anual: 0.02,
    fator_simultaneidade: 0.4,
    concessionaria_id: 'enel-rj',
    tipo_ligacao: 'bifasico',
    ano_instalacao: 2024,
    periodo_projecao_anos: 25,
    inflacao_anual: 0.04,
    taxa_desconto_anual: 0.08,
    depreciacao_anual_fv: 0.005,
    custo_om_anual: 500,
    reajuste_tarifario_anual: 0.06,
    perfil_consumo_diurno: 0.3,
    eficiencia_inversor: 0.97,
    perdas_sistema: 0.15,
    ...initialParams
  });

  // Função para calcular análise financeira
  const calcularAnalise = useCallback(async () => {
    setLoading(true);
    try {
      let resultado;
      
      // Usar Web Worker para cálculos pesados se disponível
      if (isWorkerSupported && parametros.custo_sistema > 30000) {
        resultado = await calculateFinancial({
          custoSistema: parametros.custo_sistema,
          geracaoAnual: parametros.geracao_anual_kwh,
          tarifaEletrica: 0.8, // Valor padrão, pode ser parametrizado
          inflacao: parametros.inflacao_anual,
          taxaDesconto: parametros.taxa_desconto_anual,
          periodoAnalise: parametros.periodo_projecao_anos,
          reajusteTarifario: parametros.reajuste_tarifario_anual,
          custoOM: parametros.custo_om_anual / parametros.custo_sistema,
          depreciacao: parametros.depreciacao_anual_fv
        });
      } else {
        // Fallback para cálculo tradicional
        resultado = await calculadoraService.calcularEconomiaFluxoCaixaEnhanced(parametros);
      }
      
      setResultado(resultado);
      onResultChange?.(resultado);
      setActiveTab('resultados');
      
      toast({
        title: 'Análise Concluída',
        description: isWorkerSupported ? 'Cálculos realizados com Web Worker!' : 'Cálculos financeiros realizados com sucesso!',
      });
    } catch (error) {
      console.error('Erro no cálculo:', error);
      toast({
        title: 'Erro no Cálculo',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [parametros, calculadoraService, toast, onResultChange, calculateFinancial, isWorkerSupported]);

  // Atualizar resultado quando parâmetros mudarem
  useEffect(() => {
    onResultChange?.(resultado);
  }, [resultado, onResultChange]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Análise Financeira Avançada
          </CardTitle>
          <CardDescription>
            Simulação completa com Lei 14.300, fator de simultaneidade e projeção de 25 anos
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="configuracao" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuração
          </TabsTrigger>
          <TabsTrigger value="resultados" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Resultados
          </TabsTrigger>
          <TabsTrigger value="graficos" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Gráficos
          </TabsTrigger>
          <TabsTrigger value="relatorio" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Relatório
          </TabsTrigger>
        </TabsList>

        {/* Aba de Configuração */}
        <TabsContent value="configuracao" className="space-y-6">
          <LoadingBoundary fallback="Carregando configurações...">
            <FinancialConfiguration
              parametros={parametros}
              setParametros={setParametros}
              onCalculate={calcularAnalise}
              loading={loading || workerState.loading}
            />
            
            {/* Informações sobre Web Worker */}
            {workerState.loading && (
              <Card className="mt-4">
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">
                        {workerState.stage || 'Processando...'}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={cancelCalculation}
                      >
                        Cancelar
                      </Button>
                    </div>
                    
                    {workerState.progress > 0 && (
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                          style={{ width: `${workerState.progress}%` }}
                        />
                      </div>
                    )}
                    
                    <p className="text-xs text-muted-foreground">
                      {isWorkerSupported ? 'Usando Web Worker para melhor performance' : 'Processamento tradicional'}
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </LoadingBoundary>
        </TabsContent>

        {/* Aba de Resultados */}
        <TabsContent value="resultados" className="space-y-6">
          <LoadingBoundary fallback="Carregando resultados...">
            <FinancialResults
              resultado={resultado}
              parametros={parametros}
              loading={loading}
            />
          </LoadingBoundary>
        </TabsContent>

        {/* Aba de Gráficos */}
        <TabsContent value="graficos" className="space-y-6">
          <LoadingBoundary fallback="Carregando gráficos...">
            <FinancialCharts
              resultado={resultado}
              parametros={parametros}
            />
          </LoadingBoundary>
        </TabsContent>

        {/* Aba de Relatório */}
        <TabsContent value="relatorio" className="space-y-6">
          <LoadingBoundary fallback="Carregando relatório...">
            <FinancialReport
              resultado={resultado}
              parametros={parametros}
            />
          </LoadingBoundary>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialAnalysisComplete;