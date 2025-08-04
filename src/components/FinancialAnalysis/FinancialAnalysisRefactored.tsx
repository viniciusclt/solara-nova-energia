import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Calculator, Settings, BarChart3, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { TarifaService, TarifaConcessionaria } from '@/services/TarifaService';
import { logError } from '@/utils/secureLogger';
import { FinancialKitManager } from '../FinancialKitManager';

// Componentes modulares
import { FinancialConfiguration } from './FinancialConfiguration';
import { FinancialResults } from './FinancialResults';
import { FinancialCharts } from './FinancialCharts';
import { useFinancialCalculations } from './useFinancialCalculations';
import { FinancialAnalysisProps, FinancialData } from './types';

export const FinancialAnalysisRefactored: React.FC<FinancialAnalysisProps> = ({ currentLead }) => {
  const { toast } = useToast();
  const [tarifaService] = useState(() => TarifaService.getInstance());
  const [concessionarias, setConcessionarias] = useState<TarifaConcessionaria[]>([]);
  const [isKitManagerOpen, setIsKitManagerOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('configuration');

  // Dados iniciais baseados no lead atual
  const initialFinancialData: FinancialData = {
    valorSistema: 20150,
    valorFinal: 20150,
    custoWp: 2.8,
    bdi: 15,
    markup: 20,
    margem: 25,
    comissaoExterna: 0,
    outrosGastos: 0,
    tipoVenda: "direta",
    inflacao: 4.5,
    tarifaEletrica: 0.85,
    reajusteTarifario: 6.2,
    payback: 0,
    tir: 0,
    vpl: 0,
    economiaAnual: 0,
    economia25Anos: 0,
    // Dados do lead ou valores padrão
    potenciaSistema: (currentLead as any)?.potenciaSistema || 7.2,
    geracaoAnual: (currentLead as any)?.geracaoAnual || 11000,
    consumoMensal: (currentLead as any)?.consumoMedio || 780,
    incrementoConsumo: (currentLead as any)?.incrementoConsumo || 4.5,
    fatorSimultaneidade: 30,
    concessionariaId: 'enel-rj',
    tipoLigacao: 'monofasico',
    anoInstalacao: new Date().getFullYear(),
    depreciacao: 0.7
  };

  // Hook personalizado para cálculos financeiros
  const {
    financialData,
    updateFinancialData,
    calcularComServico,
    calculando,
    validarDados,
    exportarDados
  } = useFinancialCalculations(initialFinancialData);

  // Carregar concessionárias disponíveis
  useEffect(() => {
    const carregarConcessionarias = async () => {
      try {
        const lista = await tarifaService.getConcessionarias();
        setConcessionarias(lista);
      } catch (error) {
        logError('Erro ao carregar concessionárias', {
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          service: 'FinancialAnalysisRefactored',
          action: 'carregarConcessionarias'
        });
        toast({
          title: "Erro",
          description: "Não foi possível carregar as concessionárias",
          variant: "destructive"
        });
      }
    };
    carregarConcessionarias();
  }, [tarifaService, toast]);

  // Recalcular com serviço avançado
  const handleRecalcular = useCallback(async () => {
    const validacao = validarDados(financialData);
    
    if (!validacao.isValid) {
      toast({
        title: "Dados Inválidos",
        description: validacao.errors.join(', '),
        variant: "destructive"
      });
      return;
    }

    try {
      await calcularComServico(financialData);
      toast({
        title: "Cálculo Atualizado",
        description: "Análise financeira recalculada com sucesso",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Erro no Cálculo",
        description: "Não foi possível recalcular a análise",
        variant: "destructive"
      });
    }
  }, [financialData, validarDados, calcularComServico, toast]);

  // Exportar relatório
  const handleExportar = useCallback(() => {
    try {
      const dados = exportarDados();
      const blob = new Blob([JSON.stringify(dados, null, 2)], {
        type: 'application/json'
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `analise-financeira-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Relatório Exportado",
        description: "Análise financeira exportada com sucesso",
        variant: "default"
      });
    } catch (error) {
      toast({
        title: "Erro na Exportação",
        description: "Não foi possível exportar o relatório",
        variant: "destructive"
      });
    }
  }, [exportarDados, toast]);

  return (
    <div className="space-y-6">
      {/* Header com ações */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-6 w-6" />
              Análise Financeira
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRecalcular}
                disabled={calculando}
              >
                <Calculator className="h-4 w-4 mr-2" />
                {calculando ? 'Calculando...' : 'Recalcular'}
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportar}
              >
                Exportar
              </Button>
              
              <Dialog open={isKitManagerOpen} onOpenChange={setIsKitManagerOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Zap className="h-4 w-4 mr-2" />
                    Kits
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Gerenciar Kits Financeiros</DialogTitle>
                    <DialogDescription>
                      Gerencie os kits de equipamentos disponíveis para análise financeira
                    </DialogDescription>
                  </DialogHeader>
                  <FinancialKitManager />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Tabs principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="configuration" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Configuração
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <Calculator className="h-4 w-4" />
            Resultados
          </TabsTrigger>
          <TabsTrigger value="charts" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Gráficos
          </TabsTrigger>
        </TabsList>

        {/* Configuração */}
        <TabsContent value="configuration" className="space-y-6">
          <FinancialConfiguration
            financialData={financialData}
            onDataChange={updateFinancialData}
            concessionarias={concessionarias}
          />
        </TabsContent>

        {/* Resultados */}
        <TabsContent value="results" className="space-y-6">
          <FinancialResults financialData={financialData} />
        </TabsContent>

        {/* Gráficos */}
        <TabsContent value="charts" className="space-y-6">
          <FinancialCharts financialData={financialData} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default FinancialAnalysisRefactored;