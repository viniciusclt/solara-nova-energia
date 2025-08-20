import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TrendingUp, DollarSign, Calculator, CreditCard, PiggyBank, Target, Settings, Zap, Shield, BarChart3, FileText, Info, AlertTriangle, Loader2, Calendar, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { CalculadoraSolarServiceEnhanced, ParametrosSistemaEnhanced, ResultadoFinanceiroEnhanced, TabelaMensal } from '@/services/CalculadoraSolarServiceEnhanced';
import { TarifaService } from '@/services/TarifaService';
import { useSimulationData } from '@/stores/simulationStore';

// Interfaces para os dados financeiros
interface FinancialData {
  vpl: number;
  tir: number;
  payback: number;
  economia_anual: number;
  economia_total: number;
  reducao_co2: number;
}

interface FinancingOption {
  id: string;
  name: string;
  rate: number;
  term: number;
  monthly_payment: number;
}

const FinancialAnalysis: React.FC = () => {
  const { toast } = useToast();
  const { simulationData, isValid, hasValidData } = useSimulationData();
  const [loading, setLoading] = useState(false);
  const [calculadoraService] = useState(() => new CalculadoraSolarServiceEnhanced());
  const [resultado, setResultado] = useState<ResultadoFinanceiroEnhanced | null>(null);
  const [activeTab, setActiveTab] = useState('configuracao');
  
  // Preencher automaticamente com dados da simulação técnica
  useEffect(() => {
    if (hasValidData && simulationData) {
      setParametros(prev => ({
        ...prev,
        potencia_sistema_kwp: simulationData.potencia_sistema_kwp || prev.potencia_sistema_kwp,
        geracao_anual_kwh: simulationData.geracao_anual_kwh || prev.geracao_anual_kwh,
        ano_instalacao: new Date().getFullYear()
      }));
      
      toast({
        title: 'Dados Carregados',
        description: 'Dados da simulação técnica foram carregados automaticamente.',
      });
    }
  }, [hasValidData, simulationData, toast]);

  // Parâmetros do sistema
  const [parametros, setParametros] = useState<ParametrosSistemaEnhanced>({
    custo_sistema: 50000,
    potencia_sistema_kwp: 10,
    geracao_anual_kwh: 15000,
    consumo_mensal_kwh: 1000,
    incremento_consumo_anual: 0.02, // 2%
    fator_simultaneidade: 0.4, // 40%
    concessionaria_id: 'enel-rj',
    tipo_ligacao: 'bifasico',
    ano_instalacao: 2024,
    periodo_projecao_anos: 25,
    inflacao_anual: 0.04, // 4%
    taxa_desconto_anual: 0.08, // 8%
    depreciacao_anual_fv: 0.005, // 0.5%
    custo_om_anual: 500,
    reajuste_tarifario_anual: 0.06, // 6%
    perfil_consumo_diurno: 0.3, // 30%
    eficiencia_inversor: 0.97, // 97%
    perdas_sistema: 0.15 // 15%
  });

  // Função para calcular análise financeira
  const calcularAnalise = useCallback(async () => {
    setLoading(true);
    try {
      const resultado = await calculadoraService.calcularEconomiaFluxoCaixaEnhanced(parametros);
      setResultado(resultado);
      setActiveTab('resultados');
      
      toast({
        title: 'Análise Concluída',
        description: 'Cálculos financeiros realizados com sucesso!',
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
  }, [parametros, calculadoraService, toast]);

  // Função para exportar dados
  const exportarDados = useCallback(() => {
    if (!resultado) return;
    
    const csv = calculadoraService.exportarTabelaMensal(resultado.tabela_mensal);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `analise_financeira_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'Dados Exportados',
      description: 'Tabela mensal exportada com sucesso!',
    });
  }, [resultado, calculadoraService, toast]);

  // Preparar dados para gráficos
  const dadosGraficos = React.useMemo(() => {
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
      { name: 'Autoconsumo', value: resultado.autoconsumo_total_25_anos, color: '#10b981' },
      { name: 'Energia Injetada', value: resultado.energia_injetada_total_25_anos, color: '#3b82f6' },
      { name: 'Créditos Não Utilizados', value: resultado.creditos_nao_utilizados_25_anos, color: '#f59e0b' }
    ];
    
    return { dadosAnuais, dadosPizza };
  }, [resultado]);

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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Parâmetros do Sistema */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Sistema Fotovoltaico</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="custo_sistema">Custo do Sistema (R$)</Label>
                  <Input
                    id="custo_sistema"
                    type="number"
                    value={parametros.custo_sistema}
                    onChange={(e) => setParametros(prev => ({ ...prev, custo_sistema: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="potencia_sistema" className="flex items-center gap-2">
                    Potência (kWp)
                    {hasValidData && simulationData?.potencia_sistema_kwp && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        Da simulação
                      </span>
                    )}
                  </Label>
                  <Input
                    id="potencia_sistema"
                    type="number"
                    step="0.1"
                    value={parametros.potencia_sistema_kwp}
                    onChange={(e) => setParametros(prev => ({ ...prev, potencia_sistema_kwp: Number(e.target.value) }))}
                    className={hasValidData && simulationData?.potencia_sistema_kwp ? "border-green-300 bg-green-50" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="geracao_anual" className="flex items-center gap-2">
                    Geração Anual (kWh)
                    {hasValidData && simulationData?.geracao_anual_kwh && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">
                        Da simulação
                      </span>
                    )}
                  </Label>
                  <Input
                    id="geracao_anual"
                    type="number"
                    value={parametros.geracao_anual_kwh}
                    onChange={(e) => setParametros(prev => ({ ...prev, geracao_anual_kwh: Number(e.target.value) }))}
                    className={hasValidData && simulationData?.geracao_anual_kwh ? "border-green-300 bg-green-50" : ""}
                  />
                </div>
                <div>
                  <Label htmlFor="ano_instalacao">Ano de Instalação</Label>
                  <Input
                    id="ano_instalacao"
                    type="number"
                    value={parametros.ano_instalacao}
                    onChange={(e) => setParametros(prev => ({ ...prev, ano_instalacao: Number(e.target.value) }))}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Parâmetros de Consumo */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Consumo e Simultaneidade</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="consumo_mensal">Consumo Mensal (kWh)</Label>
                  <Input
                    id="consumo_mensal"
                    type="number"
                    value={parametros.consumo_mensal_kwh}
                    onChange={(e) => setParametros(prev => ({ ...prev, consumo_mensal_kwh: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="fator_simultaneidade">Fator de Simultaneidade (%)</Label>
                  <Input
                    id="fator_simultaneidade"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={parametros.fator_simultaneidade}
                    onChange={(e) => setParametros(prev => ({ ...prev, fator_simultaneidade: Number(e.target.value) }))}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Percentual do consumo que ocorre durante a geração solar
                  </p>
                </div>
                <div>
                  <Label htmlFor="perfil_consumo_diurno">Perfil Consumo Diurno (%)</Label>
                  <Input
                    id="perfil_consumo_diurno"
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    value={parametros.perfil_consumo_diurno}
                    onChange={(e) => setParametros(prev => ({ ...prev, perfil_consumo_diurno: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <Label htmlFor="tipo_ligacao">Tipo de Ligação</Label>
                  <Select
                    value={parametros.tipo_ligacao}
                    onValueChange={(value: 'monofasico' | 'bifasico' | 'trifasico') => 
                      setParametros(prev => ({ ...prev, tipo_ligacao: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monofasico">Monofásico</SelectItem>
                      <SelectItem value="bifasico">Bifásico</SelectItem>
                      <SelectItem value="trifasico">Trifásico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Parâmetros Financeiros */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Parâmetros Financeiros</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="taxa_desconto">Taxa de Desconto Anual (%)</Label>
                  <Input
                    id="taxa_desconto"
                    type="number"
                    step="0.01"
                    value={parametros.taxa_desconto_anual * 100}
                    onChange={(e) => setParametros(prev => ({ ...prev, taxa_desconto_anual: Number(e.target.value) / 100 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="inflacao">Inflação Anual (%)</Label>
                  <Input
                    id="inflacao"
                    type="number"
                    step="0.01"
                    value={parametros.inflacao_anual * 100}
                    onChange={(e) => setParametros(prev => ({ ...prev, inflacao_anual: Number(e.target.value) / 100 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="reajuste_tarifario">Reajuste Tarifário Anual (%)</Label>
                  <Input
                    id="reajuste_tarifario"
                    type="number"
                    step="0.01"
                    value={parametros.reajuste_tarifario_anual * 100}
                    onChange={(e) => setParametros(prev => ({ ...prev, reajuste_tarifario_anual: Number(e.target.value) / 100 }))}
                  />
                </div>
                <div>
                  <Label htmlFor="custo_om">Custo O&M Anual (R$)</Label>
                  <Input
                    id="custo_om"
                    type="number"
                    value={parametros.custo_om_anual}
                    onChange={(e) => setParametros(prev => ({ ...prev, custo_om_anual: Number(e.target.value) }))}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-center">
             <Button 
               onClick={calcularAnalise} 
               disabled={loading}
               size="lg"
               className="min-w-48"
             >
               {loading ? (
                 <>
                   <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                   Calculando...
                 </>
               ) : (
                 <>
                   <Calculator className="mr-2 h-4 w-4" />
                   Calcular Análise
                 </>
               )}
             </Button>
           </div>
         </TabsContent>

         {/* Aba de Resultados */}
         <TabsContent value="resultados" className="space-y-6">
           {!resultado ? (
             <Card>
               <CardContent className="flex items-center justify-center py-12">
                 <div className="text-center space-y-4">
                   <Info className="h-12 w-12 text-muted-foreground mx-auto" />
                   <p className="text-muted-foreground">
                     Execute o cálculo na aba Configuração para ver os resultados
                   </p>
                 </div>
               </CardContent>
             </Card>
           ) : (
             <>
               {/* Indicadores Principais */}
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                 <Card>
                   <CardContent className="p-6">
                     <div className="flex items-center space-x-2">
                       <TrendingUp className="h-5 w-5 text-green-600" />
                       <div>
                         <p className="text-sm font-medium text-muted-foreground">VPL</p>
                         <p className="text-2xl font-bold text-green-600">
                           R$ {resultado.vpl.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                         </p>
                       </div>
                     </div>
                   </CardContent>
                 </Card>

                 <Card>
                   <CardContent className="p-6">
                     <div className="flex items-center space-x-2">
                       <DollarSign className="h-5 w-5 text-blue-600" />
                       <div>
                         <p className="text-sm font-medium text-muted-foreground">TIR</p>
                         <p className="text-2xl font-bold text-blue-600">
                           {resultado.tir.toFixed(1)}%
                         </p>
                       </div>
                     </div>
                   </CardContent>
                 </Card>

                 <Card>
                   <CardContent className="p-6">
                     <div className="flex items-center space-x-2">
                       <Calendar className="h-5 w-5 text-orange-600" />
                       <div>
                         <p className="text-sm font-medium text-muted-foreground">Payback</p>
                         <p className="text-2xl font-bold text-orange-600">
                           {resultado.payback_simples_anos.toFixed(1)} anos
                         </p>
                       </div>
                     </div>
                   </CardContent>
                 </Card>

                 <Card>
                   <CardContent className="p-6">
                     <div className="flex items-center space-x-2">
                       <PiggyBank className="h-5 w-5 text-purple-600" />
                       <div>
                         <p className="text-sm font-medium text-muted-foreground">ROI 25 anos</p>
                         <p className="text-2xl font-bold text-purple-600">
                           {resultado.roi_25_anos.toFixed(0)}%
                         </p>
                       </div>
                     </div>
                   </CardContent>
                 </Card>
               </div>

               {/* Economia e Energia */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Card>
                   <CardHeader>
                     <CardTitle className="flex items-center gap-2">
                       <DollarSign className="h-5 w-5" />
                       Economia Financeira
                     </CardTitle>
                   </CardHeader>
                   <CardContent className="space-y-4">
                     <div className="flex justify-between">
                       <span className="text-muted-foreground">Economia Total (25 anos):</span>
                       <span className="font-semibold text-green-600">
                         R$ {resultado.economia_total_25_anos.toLocaleString('pt-BR')}
                       </span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-muted-foreground">Economia Primeiro Ano:</span>
                       <span className="font-semibold">
                         R$ {resultado.economia_primeiro_ano.toLocaleString('pt-BR')}
                       </span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-muted-foreground">Economia Média Anual:</span>
                       <span className="font-semibold">
                         R$ {resultado.economia_media_anual.toLocaleString('pt-BR')}
                       </span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-muted-foreground">Economia 10 anos:</span>
                       <span className="font-semibold">
                         R$ {resultado.economia_acumulada_10_anos.toLocaleString('pt-BR')}
                       </span>
                     </div>
                   </CardContent>
                 </Card>

                 <Card>
                   <CardHeader>
                     <CardTitle className="flex items-center gap-2">
                       <Zap className="h-5 w-5" />
                       Energia e Sustentabilidade
                     </CardTitle>
                   </CardHeader>
                   <CardContent className="space-y-4">
                     <div className="flex justify-between">
                       <span className="text-muted-foreground">Geração Total (25 anos):</span>
                       <span className="font-semibold">
                         {(resultado.geracao_total_25_anos / 1000).toFixed(0)} MWh
                       </span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-muted-foreground">Autoconsumo Total:</span>
                       <span className="font-semibold">
                         {(resultado.autoconsumo_total_25_anos / 1000).toFixed(0)} MWh
                       </span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-muted-foreground">Energia Injetada:</span>
                       <span className="font-semibold">
                         {(resultado.energia_injetada_total_25_anos / 1000).toFixed(0)} MWh
                       </span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-muted-foreground">Redução CO₂:</span>
                       <span className="font-semibold text-green-600">
                         {(resultado.reducao_co2_kg / 1000).toFixed(1)} ton
                       </span>
                     </div>
                     <div className="flex justify-between">
                       <span className="text-muted-foreground">Árvores Equivalentes:</span>
                       <span className="font-semibold text-green-600">
                         {resultado.arvores_equivalentes.toFixed(0)} árvores
                       </span>
                     </div>
                   </CardContent>
                 </Card>
               </div>

               {/* Lei 14.300 Info */}
               <Alert>
                 <AlertTriangle className="h-4 w-4" />
                 <AlertTitle>Lei 14.300 - Fio B</AlertTitle>
                 <AlertDescription>
                   {parametros.ano_instalacao < 2023 ? (
                     `Sistema isento da cobrança do Fio B por 25 anos (instalado antes de 2023).`
                   ) : parametros.ano_instalacao <= 2028 ? (
                     `Sistema sujeito à regra de transição da Lei 14.300. Cobrança progressiva do Fio B por 7 anos.`
                   ) : (
                     `Sistema sujeito à cobrança integral do Fio B desde a instalação (100%).`
                   )}
                 </AlertDescription>
               </Alert>

               {/* Botão de Exportar */}
               <div className="flex justify-center">
                 <Button onClick={exportarDados} variant="outline" size="lg">
                   <Download className="mr-2 h-4 w-4" />
                   Exportar Dados (CSV)
                 </Button>
               </div>
             </>
           )}
         </TabsContent>

         {/* Aba de Gráficos */}
         <TabsContent value="graficos" className="space-y-6">
           {!dadosGraficos ? (
             <Card>
               <CardContent className="flex items-center justify-center py-12">
                 <div className="text-center space-y-4">
                   <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto" />
                   <p className="text-muted-foreground">
                     Execute o cálculo para visualizar os gráficos
                   </p>
                 </div>
               </CardContent>
             </Card>
           ) : (
             <>
               {/* Gráfico de Economia Anual */}
               <Card>
                 <CardHeader>
                   <CardTitle>Economia Anual ao Longo dos Anos</CardTitle>
                   <CardDescription>
                     Evolução da economia financeira considerando inflação e reajustes tarifários
                   </CardDescription>
                 </CardHeader>
                 <CardContent>
                   <div className="h-80">
                     <ResponsiveContainer width="100%" height="100%">
                       <LineChart data={dadosGraficos.dadosAnuais}>
                         <CartesianGrid strokeDasharray="3 3" />
                         <XAxis dataKey="ano" />
                         <YAxis />
                         <Tooltip 
                           formatter={(value: number) => [
                             `R$ ${value.toLocaleString('pt-BR')}`, 
                             'Economia'
                           ]}
                         />
                         <Legend />
                         <Line 
                           type="monotone" 
                           dataKey="economia" 
                           stroke="#10b981" 
                           strokeWidth={2}
                           name="Economia Anual (R$)"
                         />
                       </LineChart>
                     </ResponsiveContainer>
                   </div>
                 </CardContent>
               </Card>

               {/* Gráfico de Fluxo de Caixa Acumulado */}
               <Card>
                 <CardHeader>
                   <CardTitle>Fluxo de Caixa Acumulado</CardTitle>
                   <CardDescription>
                     Evolução do retorno do investimento ao longo do tempo
                   </CardDescription>
                 </CardHeader>
                 <CardContent>
                   <div className="h-80">
                     <ResponsiveContainer width="100%" height="100%">
                       <LineChart data={dadosGraficos.dadosAnuais}>
                         <CartesianGrid strokeDasharray="3 3" />
                         <XAxis dataKey="ano" />
                         <YAxis />
                         <Tooltip 
                           formatter={(value: number) => [
                             `R$ ${value.toLocaleString('pt-BR')}`, 
                             'Fluxo Acumulado'
                           ]}
                         />
                         <Legend />
                         <Line 
                           type="monotone" 
                           dataKey="fluxo_acumulado" 
                           stroke="#3b82f6" 
                           strokeWidth={2}
                           name="Fluxo de Caixa Acumulado (R$)"
                         />
                       </LineChart>
                     </ResponsiveContainer>
                   </div>
                 </CardContent>
               </Card>

               {/* Gráfico de Barras - Geração vs Autoconsumo */}
               <Card>
                 <CardHeader>
                   <CardTitle>Geração vs Autoconsumo vs Injeção</CardTitle>
                   <CardDescription>
                     Distribuição anual da energia gerada entre autoconsumo e injeção na rede
                   </CardDescription>
                 </CardHeader>
                 <CardContent>
                   <div className="h-80">
                     <ResponsiveContainer width="100%" height="100%">
                       <BarChart data={dadosGraficos.dadosAnuais.slice(0, 10)}>
                         <CartesianGrid strokeDasharray="3 3" />
                         <XAxis dataKey="ano" />
                         <YAxis />
                         <Tooltip 
                           formatter={(value: number) => [
                             `${value.toLocaleString('pt-BR')} kWh`, 
                             ''
                           ]}
                         />
                         <Legend />
                         <Bar dataKey="autoconsumo" fill="#10b981" name="Autoconsumo (kWh)" />
                         <Bar dataKey="injecao" fill="#3b82f6" name="Injeção (kWh)" />
                       </BarChart>
                     </ResponsiveContainer>
                   </div>
                 </CardContent>
               </Card>

               {/* Gráfico de Pizza - Distribuição de Energia */}
               <Card>
                 <CardHeader>
                   <CardTitle>Distribuição de Energia (25 anos)</CardTitle>
                   <CardDescription>
                     Como a energia gerada é utilizada ao longo dos 25 anos
                   </CardDescription>
                 </CardHeader>
                 <CardContent>
                   <div className="h-80">
                     <ResponsiveContainer width="100%" height="100%">
                       <PieChart>
                         <Pie
                           data={dadosGraficos.dadosPizza}
                           cx="50%"
                           cy="50%"
                           labelLine={false}
                           label={({ name, percent }) => `${name} ${(percent * 100).toFixed(1)}%`}
                           outerRadius={80}
                           fill="#8884d8"
                           dataKey="value"
                         >
                           {dadosGraficos.dadosPizza.map((entry, index) => (
                             <Cell key={`cell-${index}`} fill={entry.color} />
                           ))}
                         </Pie>
                         <Tooltip 
                           formatter={(value: number) => [
                             `${(value / 1000).toFixed(1)} MWh`, 
                             'Energia'
                           ]}
                         />
                       </PieChart>
                     </ResponsiveContainer>
                   </div>
                 </CardContent>
               </Card>
             </>
           )}
         </TabsContent>

         {/* Aba de Relatório */}
         <TabsContent value="relatorio" className="space-y-6">
           {!resultado ? (
             <Card>
               <CardContent className="flex items-center justify-center py-12">
                 <div className="text-center space-y-4">
                   <FileText className="h-12 w-12 text-muted-foreground mx-auto" />
                   <p className="text-muted-foreground">
                     Execute o cálculo para gerar o relatório detalhado
                   </p>
                 </div>
               </CardContent>
             </Card>
           ) : (
             <Card>
               <CardHeader>
                 <CardTitle>Relatório Detalhado de Viabilidade</CardTitle>
                 <CardDescription>
                   Análise completa do investimento em energia solar fotovoltaica
                 </CardDescription>
               </CardHeader>
               <CardContent>
                 <ScrollArea className="h-96 w-full">
                   <div className="space-y-6 pr-4">
                     {/* Resumo Executivo */}
                     <div>
                       <h3 className="text-lg font-semibold mb-3">Resumo Executivo</h3>
                       <div className="space-y-2 text-sm">
                         <p>
                           <strong>Investimento:</strong> R$ {resultado.investimento_inicial.toLocaleString('pt-BR')}
                         </p>
                         <p>
                           <strong>Potência do Sistema:</strong> {parametros.potencia_sistema_kwp} kWp
                         </p>
                         <p>
                           <strong>Geração Anual Estimada:</strong> {parametros.geracao_anual_kwh.toLocaleString('pt-BR')} kWh
                         </p>
                         <p>
                           <strong>Fator de Simultaneidade:</strong> {(parametros.fator_simultaneidade * 100).toFixed(0)}%
                         </p>
                       </div>
                     </div>

                     <Separator />

                     {/* Indicadores Financeiros */}
                     <div>
                       <h3 className="text-lg font-semibold mb-3">Indicadores Financeiros</h3>
                       <div className="grid grid-cols-2 gap-4 text-sm">
                         <div>
                           <p><strong>VPL:</strong> R$ {resultado.vpl.toLocaleString('pt-BR')}</p>
                           <p><strong>TIR:</strong> {resultado.tir.toFixed(2)}% a.a.</p>
                           <p><strong>Payback Simples:</strong> {resultado.payback_simples_anos.toFixed(1)} anos</p>
                         </div>
                         <div>
                           <p><strong>Payback Descontado:</strong> {resultado.payback_descontado_anos.toFixed(1)} anos</p>
                           <p><strong>ROI (25 anos):</strong> {resultado.roi_25_anos.toFixed(0)}%</p>
                         </div>
                       </div>
                     </div>

                     <Separator />

                     {/* Lei 14.300 */}
                     <div>
                       <h3 className="text-lg font-semibold mb-3">Lei 14.300 - Marco Legal da Geração Distribuída</h3>
                       <div className="space-y-2 text-sm">
                         <p>
                           <strong>Ano de Instalação:</strong> {parametros.ano_instalacao}
                         </p>
                         {parametros.ano_instalacao < 2023 ? (
                           <p className="text-green-600">
                             ✅ Sistema <strong>ISENTO</strong> da cobrança do Fio B por 25 anos (instalado antes de 2023)
                           </p>
                         ) : parametros.ano_instalacao <= 2028 ? (
                           <div>
                             <p className="text-orange-600">
                               ⚠️ Sistema sujeito à <strong>regra de transição</strong> da Lei 14.300
                             </p>
                             <p className="text-sm text-muted-foreground ml-4">
                               • Primeiros 7 anos: cobrança progressiva do Fio B<br/>
                               • Após 7 anos: cobrança integral (100%)
                             </p>
                           </div>
                         ) : (
                           <p className="text-red-600">
                             ❌ Sistema sujeito à <strong>cobrança integral</strong> do Fio B desde a instalação
                           </p>
                         )}
                       </div>
                     </div>

                     <Separator />

                     {/* Sustentabilidade */}
                     <div>
                       <h3 className="text-lg font-semibold mb-3">Impacto Ambiental</h3>
                       <div className="space-y-2 text-sm">
                         <p>
                           <strong>Redução de CO₂:</strong> {(resultado.reducao_co2_kg / 1000).toFixed(1)} toneladas
                         </p>
                         <p>
                           <strong>Equivalente a:</strong> {resultado.arvores_equivalentes.toFixed(0)} árvores plantadas
                         </p>
                         <p>
                           <strong>Energia Limpa Gerada:</strong> {(resultado.geracao_total_25_anos / 1000).toFixed(0)} MWh em 25 anos
                         </p>
                       </div>
                     </div>

                     <Separator />

                     {/* Resumo dos Primeiros 5 Anos */}
                     <div>
                       <h3 className="text-lg font-semibold mb-3">Projeção dos Primeiros 5 Anos</h3>
                       <div className="space-y-2">
                         {resultado.resumo_anual.slice(0, 5).map((ano, index) => (
                           <div key={ano.ano} className="flex justify-between text-sm">
                             <span>Ano {index + 1} ({ano.ano}):</span>
                             <span className="font-medium">
                               R$ {ano.economia_anual.toLocaleString('pt-BR')}
                             </span>
                           </div>
                         ))}
                       </div>
                     </div>

                     <Separator />

                     {/* Conclusão */}
                     <div>
                       <h3 className="text-lg font-semibold mb-3">Conclusão</h3>
                       <div className="space-y-2 text-sm">
                         {resultado.vpl > 0 ? (
                           <p className="text-green-600">
                             ✅ <strong>Investimento VIÁVEL:</strong> O projeto apresenta VPL positivo e TIR superior à taxa de desconto.
                           </p>
                         ) : (
                           <p className="text-red-600">
                             ❌ <strong>Investimento NÃO VIÁVEL:</strong> O projeto apresenta VPL negativo.
                           </p>
                         )}
                         
                         {resultado.payback_simples_anos <= 10 ? (
                           <p className="text-green-600">
                             ✅ <strong>Payback atrativo:</strong> Retorno do investimento em {resultado.payback_simples_anos.toFixed(1)} anos.
                           </p>
                         ) : (
                           <p className="text-orange-600">
                             ⚠️ <strong>Payback longo:</strong> Retorno do investimento em {resultado.payback_simples_anos.toFixed(1)} anos.
                           </p>
                         )}
                         
                         <p>
                           O sistema gerará uma economia total de <strong>R$ {resultado.economia_total_25_anos.toLocaleString('pt-BR')}</strong> 
                           ao longo de 25 anos, considerando os impactos da Lei 14.300 e o fator de simultaneidade de {(parametros.fator_simultaneidade * 100).toFixed(0)}%.
                         </p>
                       </div>
                     </div>
                   </div>
                 </ScrollArea>
               </CardContent>
             </Card>
           )}
         </TabsContent>
       </Tabs>
     </div>
   );
 };
 
 export default FinancialAnalysis;
export { FinancialAnalysis };