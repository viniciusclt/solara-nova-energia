import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { TrendingUp, DollarSign, Calculator, CreditCard, PiggyBank, Target, Settings, Zap, Shield, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FinancialKitManager } from "./FinancialKitManager";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell } from 'recharts';
import { CalculadoraSolarService, ParametrosSistema, ResultadoFinanceiro } from '@/services/CalculadoraSolarService';
import { TarifaService, TarifaConcessionaria } from '@/services/TarifaService';
import { logError } from '@/utils/secureLogger';

interface FinancialData {
  valorSistema: number;
  valorFinal: number;
  custoWp: number;
  bdi: number;
  markup: number;
  margem: number;
  comissaoExterna: number;
  outrosGastos: number;
  tipoVenda: string;
  inflacao: number;
  tarifaEletrica: number;
  reajusteTarifario: number;
  payback: number;
  tir: number;
  vpl: number;
  economiaAnual: number;
  economia25Anos: number;
  // Novos campos para Lei 14.300
  potenciaSistema: number;
  geracaoAnual: number;
  consumoMensal: number;
  incrementoConsumo: number;
  fatorSimultaneidade: number;
  concessionariaId: string;
  tipoLigacao: 'monofasico' | 'bifasico' | 'trifasico';
  anoInstalacao: number;
  depreciacao: number;
}

interface FinancingOption {
  banco: string;
  taxa: number;
  parcelas: number;
  carencia: number;
  valorParcela: number;
}

interface FinancialAnalysisProps {
  currentLead: unknown;
}

export function FinancialAnalysis({ currentLead }: FinancialAnalysisProps) {
  const { toast } = useToast();
  const [calculadoraService] = useState(() => new CalculadoraSolarService());
  const [tarifaService] = useState(() => TarifaService.getInstance());
  const [concessionarias, setConcessionarias] = useState<TarifaConcessionaria[]>([]);
  const [resultadoFinanceiro, setResultadoFinanceiro] = useState<ResultadoFinanceiro | null>(null);
  const [calculando, setCalculando] = useState(false);
  
  const [financialData, setFinancialData] = useState<FinancialData>({
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
    // Novos campos para Lei 14.300
    potenciaSistema: currentLead?.potenciaSistema || 7.2,
    geracaoAnual: currentLead?.geracaoAnual || 11000,
    consumoMensal: currentLead?.consumoMedio || 780,
    incrementoConsumo: currentLead?.incrementoConsumo || 4.5,
    fatorSimultaneidade: 30,
    concessionariaId: 'enel-rj',
    tipoLigacao: 'monofasico',
    anoInstalacao: new Date().getFullYear(),
    depreciacao: 0.7
  });

  const [financingOptions] = useState<FinancingOption[]>([
    { banco: "BV Financeira", taxa: 1.2, parcelas: 60, carencia: 0, valorParcela: 0 },
    { banco: "Santander", taxa: 1.35, parcelas: 72, carencia: 3, valorParcela: 0 },
    { banco: "Sicredi", taxa: 1.15, parcelas: 84, carencia: 6, valorParcela: 0 },
    { banco: "CrediSIS", taxa: 0.99, parcelas: 120, carencia: 12, valorParcela: 0 }
  ]);

  const [kitsDisponiveis, setKitsDisponiveis] = useState<unknown[]>([]);
  const [isKitManagerOpen, setIsKitManagerOpen] = useState(false);

  // Carregar concessionárias disponíveis
  useEffect(() => {
    const carregarConcessionarias = async () => {
      try {
        const lista = await tarifaService.getConcessionarias();
        setConcessionarias(lista);
      } catch (error) {
        logError('Erro ao carregar concessionárias', {
          error: error instanceof Error ? error.message : 'Erro desconhecido',
          service: 'FinancialAnalysis_backup',
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

  const fetchKits = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('financial_kits')
        .select('*')
        .eq('ativo', true)
        .order('potencia', { ascending: true });

      if (error) throw error;
      
      // Transform database format to component format
      const transformedKits = (data || []).map(kit => ({
        id: kit.id,
        nome: kit.nome,
        potencia: kit.potencia,
        preco: kit.preco,
        precoWp: kit.preco_wp,
        fabricante: kit.fabricante,
        categoria: kit.categoria,
        descricao: kit.descricao
      }));
      
      setKitsDisponiveis(transformedKits);
    } catch (error: unknown) {
      toast({
        title: "Erro ao carregar kits",
        description: (error as Error).message,
        variant: "destructive"
      });
    }
  }, [toast]);

  useEffect(() => {
    fetchKits();
  }, [fetchKits]);

  const calcularEconomia = () => {
    const consumoAnual = (currentLead?.consumoMedio || 780) * 12;
    const geracaoAnual = consumoAnual * 0.95; // Assumindo 95% de offset
    const economiaAnualAtual = geracaoAnual * financialData.tarifaEletrica;
    
    let economiaAcumulada = 0;
    let fluxoCaixa = -financialData.valorFinal;
    let paybackAnos = 0;
    
    // Cálculo ano a ano considerando inflação
    for (let ano = 1; ano <= 25; ano++) {
      const tarifaAno = financialData.tarifaEletrica * Math.pow(1 + financialData.reajusteTarifario / 100, ano - 1);
      const economiaAno = geracaoAnual * tarifaAno;
      economiaAcumulada += economiaAno;
      fluxoCaixa += economiaAno;
      
      if (paybackAnos === 0 && fluxoCaixa > 0) {
        paybackAnos = ano - 1 + (Math.abs(fluxoCaixa - economiaAno) / economiaAno);
      }
    }
    
    // Cálculo do VPL e TIR
    const taxaDesconto = 0.08; // 8% ao ano (CDI médio)
    let vpl = -financialData.valorFinal;
    
    for (let ano = 1; ano <= 25; ano++) {
      const tarifaAno = financialData.tarifaEletrica * Math.pow(1 + financialData.reajusteTarifario / 100, ano - 1);
      const economiaAno = geracaoAnual * tarifaAno;
      vpl += economiaAno / Math.pow(1 + taxaDesconto, ano);
    }
    
    // TIR aproximada (simplificada)
    const investimentoInicial = financialData.valorFinal;
    const economiaMedia = economiaAcumulada / 25;
    const tir = ((economiaMedia / investimentoInicial) * 100);
    
    setFinancialData(prev => ({
      ...prev,
      payback: paybackAnos,
      vpl: vpl,
      tir: tir,
      economiaAnual: economiaAnualAtual,
      economia25Anos: economiaAcumulada
    }));
  };

  // Nova função de cálculo baseada na Lei 14.300
  const calcularViabilidadeLei14300 = async () => {
    setCalculando(true);
    try {
      const parametros: ParametrosSistema = {
        custo_sistema: financialData.valorSistema * (1 + financialData.bdi / 100),
        potencia_sistema_kwp: financialData.potenciaSistema,
        geracao_anual_kwh: financialData.geracaoAnual,
        consumo_mensal_kwh: financialData.consumoMensal,
        incremento_consumo_anual: financialData.incrementoConsumo / 100,
        fator_simultaneidade: financialData.fatorSimultaneidade / 100,
        concessionaria_id: financialData.concessionariaId,
        tipo_ligacao: financialData.tipoLigacao,
        ano_instalacao: financialData.anoInstalacao,
        periodo_projecao_anos: 25,
        inflacao_anual: financialData.inflacao / 100,
        taxa_desconto_anual: 0.08,
        depreciacao_anual_fv: financialData.depreciacao / 100,
        custo_om_anual: (financialData.valorSistema * 0.5 / 100),
        reajuste_tarifario_anual: financialData.reajusteTarifario / 100
      };

      const resultado = await calculadoraService.calcularEconomiaFluxoCaixa(parametros);
      setResultadoFinanceiro(resultado);

      // Atualizar dados financeiros com os resultados
      setFinancialData(prev => ({
        ...prev,
        economiaAnual: resultado.economia_primeiro_ano,
        economia25Anos: resultado.economia_total_25_anos,
        vpl: resultado.vpl,
        tir: resultado.tir,
        payback: resultado.payback_simples_anos
      }));

      toast({
        title: "Cálculo Realizado com Sucesso",
        description: `VPL: R$ ${resultado.vpl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} | TIR: ${resultado.tir.toFixed(1)}% | Payback: ${resultado.payback_simples_anos.toFixed(1)} anos`
      });
    } catch (error) {
      logError('Erro no cálculo de viabilidade Lei 14.300', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        service: 'FinancialAnalysis_backup',
        action: 'calcularViabilidadeLei14300',
        potenciaSistema: financialData.potenciaSistema,
        valorSistema: financialData.valorSistema
      });
      toast({
        title: "Erro no Cálculo",
        description: "Não foi possível realizar o cálculo. Verifique os dados inseridos.",
        variant: "destructive"
      });
    } finally {
      setCalculando(false);
    }
  };

  const calcularFinanciamento = (opcao: FinancingOption) => {
    const valorFinanciado = financialData.valorFinal;
    const taxaMensal = opcao.taxa / 100;
    const parcelas = opcao.parcelas;
    
    // PMT - Cálculo da prestação
    const valorParcela = valorFinanciado * (taxaMensal * Math.pow(1 + taxaMensal, parcelas)) / 
                        (Math.pow(1 + taxaMensal, parcelas) - 1);
    
    return valorParcela;
  };

  const handleInputChange = (field: string, value: number) => {
    setFinancialData(prev => ({ ...prev, [field]: value }));
  };

  const selecionarKit = (kit: Record<string, unknown>) => {
    setFinancialData(prev => ({
      ...prev,
      valorSistema: kit.preco,
      valorFinal: kit.preco,
      custoWp: kit.precoWp
    }));
    
    toast({
      title: "Kit Selecionado",
      description: `${kit.nome} - R$ ${kit.preco.toLocaleString()}`
    });
  };

  const aplicarBDI = () => {
    const valorComBDI = financialData.valorSistema * (1 + financialData.bdi / 100);
    setFinancialData(prev => ({
      ...prev,
      valorFinal: valorComBDI,
      margem: ((valorComBDI - financialData.valorSistema) / financialData.valorSistema) * 100
    }));
  };

  const aplicarMarkup = () => {
    const valorComMarkup = financialData.valorSistema * (1 + financialData.markup / 100);
    setFinancialData(prev => ({
      ...prev,
      valorFinal: valorComMarkup,
      margem: financialData.markup
    }));
  };

  return (
    <div className="space-y-8">
      {/* Header Modernizado */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/10 p-8 border border-border/50">
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Análise Financeira
              </h1>
              <p className="text-lg text-muted-foreground max-w-2xl">
                Calcule a viabilidade econômica completa do seu projeto solar com análises avançadas
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="shadow-sm hover:shadow-md transition-all duration-200">
                <TrendingUp className="h-4 w-4 mr-2" />
                Exportar Relatório
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-primary/20 to-transparent rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-tr from-secondary/20 to-transparent rounded-full blur-2xl" />
      </div>

      {/* Indicadores Principais Modernizados */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-primary/5 to-primary/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Valor Final</p>
                <p className="text-2xl font-bold text-primary">
                  R$ {financialData.valorFinal.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-primary/10 rounded-full">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-green-500/5 to-green-500/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Payback</p>
                <p className="text-2xl font-bold text-green-600">
                  {financialData.payback.toFixed(1)} anos
                </p>
              </div>
              <div className="p-3 bg-green-500/10 rounded-full">
                <Target className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-secondary/5 to-secondary/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">TIR</p>
                <p className="text-2xl font-bold text-secondary">
                  {financialData.tir.toFixed(1)}%
                </p>
              </div>
              <div className="p-3 bg-secondary/10 rounded-full">
                <TrendingUp className="h-6 w-6 text-secondary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-to-br from-accent/5 to-accent/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">VPL (25 anos)</p>
                <p className="text-2xl font-bold text-accent">
                  R$ {(financialData.vpl / 1000).toFixed(0)}k
                </p>
              </div>
              <div className="p-3 bg-accent/10 rounded-full">
                <PiggyBank className="h-6 w-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Abas Principais Reorganizadas */}
      <Tabs defaultValue="viabilidade" className="space-y-8">
        <div className="flex justify-center">
          <TabsList className="inline-flex h-12 items-center justify-center rounded-xl bg-muted/50 p-1 text-muted-foreground shadow-sm">
            <TabsTrigger 
              value="viabilidade" 
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              Análise de Viabilidade
            </TabsTrigger>
            <TabsTrigger 
              value="simulador" 
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              Simulador de Financiamento
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="viabilidade">
          {/* Sub-abas da Análise de Viabilidade */}
          <Tabs defaultValue="kits" className="space-y-6">
            <div className="flex justify-center">
              <TabsList className="inline-flex h-10 items-center justify-center rounded-lg bg-muted/30 p-1 text-muted-foreground">
                <TabsTrigger value="kits" className="px-3 py-1.5 text-sm">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Kits & Preços
                </TabsTrigger>
                <TabsTrigger value="calculos" className="px-3 py-1.5 text-sm">
                  <Calculator className="h-4 w-4 mr-2" />
                  Cálculos
                </TabsTrigger>
                <TabsTrigger value="lei14300" className="px-3 py-1.5 text-sm">
                  <Shield className="h-4 w-4 mr-2" />
                  Lei 14.300
                </TabsTrigger>
                <TabsTrigger value="graficos" className="px-3 py-1.5 text-sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Gráficos
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="kits">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-card">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Kits Disponíveis</CardTitle>
                        <CardDescription>Selecione um kit base para o orçamento</CardDescription>
                      </div>
                      <Dialog open={isKitManagerOpen} onOpenChange={setIsKitManagerOpen}>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Settings className="h-4 w-4 mr-2" />
                            Gerenciar
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Gerenciar Kits Financeiros</DialogTitle>
                            <DialogDescription>
                              Adicione, edite ou importe kits financeiros
                            </DialogDescription>
                          </DialogHeader>
                          <FinancialKitManager />
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {kitsDisponiveis.map((kit, index) => (
                      <div key={index} className="border border-border rounded-lg p-4 hover:shadow-card transition-smooth">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-medium">{kit.nome}</h4>
                            <div className="text-sm text-muted-foreground">
                              {kit.potencia}kWp • R$ {kit.precoWp.toFixed(2)}/Wp
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-lg font-bold text-primary">
                              R$ {kit.preco.toLocaleString()}
                            </div>
                            <Button 
                              size="sm" 
                              onClick={() => selecionarKit(kit)}
                              variant="outline"
                            >
                              Selecionar
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle>Composição do Preço</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="valorSistema">Valor Base do Sistema</Label>
                        <Input
                          id="valorSistema"
                          type="number"
                          value={financialData.valorSistema}
                          onChange={(e) => handleInputChange("valorSistema", Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <Label htmlFor="custoWp">Custo por Wp</Label>
                        <Input
                          id="custoWp"
                          type="number"
                          step="0.01"
                          value={financialData.custoWp}
                          onChange={(e) => handleInputChange("custoWp", Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="outrosGastos">Outros Gastos</Label>
                        <Input
                          id="outrosGastos"
                          type="number"
                          value={financialData.outrosGastos}
                          onChange={(e) => handleInputChange("outrosGastos", Number(e.target.value))}
                          placeholder="Hospedagem, materiais extras"
                        />
                      </div>
                      <div>
                        <Label htmlFor="comissaoExterna">Comissão Externa</Label>
                        <Input
                          id="comissaoExterna"
                          type="number"
                          value={financialData.comissaoExterna}
                          onChange={(e) => handleInputChange("comissaoExterna", Number(e.target.value))}
                        />
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Label>Método de Precificação:</Label>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2">
                        <Button 
                          variant="outline" 
                          onClick={aplicarBDI}
                          className="flex flex-col items-center p-4 h-auto"
                        >
                          <span className="font-medium">BDI</span>
                          <Input
                            type="number"
                            value={financialData.bdi}
                            onChange={(e) => handleInputChange("bdi", Number(e.target.value))}
                            className="w-16 text-center mt-2"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="text-xs">%</span>
                        </Button>
                        
                        <Button 
                          variant="outline" 
                          onClick={aplicarMarkup}
                          className="flex flex-col items-center p-4 h-auto"
                        >
                          <span className="font-medium">Markup</span>
                          <Input
                            type="number"
                            value={financialData.markup}
                            onChange={(e) => handleInputChange("markup", Number(e.target.value))}
                            className="w-16 text-center mt-2"
                            onClick={(e) => e.stopPropagation()}
                          />
                          <span className="text-xs">%</span>
                        </Button>
                      </div>
                    </div>

                    <div className="bg-gradient-card p-4 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium">Valor Final:</span>
                        <span className="text-xl font-bold text-primary">
                          R$ {financialData.valorFinal.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-1">
                        <span className="text-sm text-muted-foreground">Margem:</span>
                        <span className="text-sm font-medium text-success">
                          {financialData.margem.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="calculos">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card className="shadow-card">
                   <CardHeader>
                     <CardTitle>Parâmetros Econômicos</CardTitle>
                   </CardHeader>
                   <CardContent className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                       <div>
                         <Label htmlFor="inflacao">Inflação Anual (%)</Label>
                         <Input
                           id="inflacao"
                           type="number"
                           step="0.1"
                           value={financialData.inflacao}
                           onChange={(e) => handleInputChange("inflacao", Number(e.target.value))}
                         />
                       </div>
                       <div>
                         <Label htmlFor="reajusteTarifario">Reajuste Tarifário (%)</Label>
                         <Input
                           id="reajusteTarifario"
                           type="number"
                           step="0.1"
                           value={financialData.reajusteTarifario}
                           onChange={(e) => handleInputChange("reajusteTarifario", Number(e.target.value))}
                         />
                       </div>
                     </div>

                     <div>
                       <Label htmlFor="tarifaEletrica">Tarifa Elétrica (R$/kWh)</Label>
                       <Input
                         id="tarifaEletrica"
                         type="number"
                         step="0.01"
                         value={financialData.tarifaEletrica}
                         onChange={(e) => handleInputChange("tarifaEletrica", Number(e.target.value))}
                       />
                     </div>

                     <Button onClick={calcularEconomia} className="w-full">
                       <Calculator className="h-4 w-4" />
                       Calcular Análise Econômica
                     </Button>
                   </CardContent>
                 </Card>

                 <Card className="shadow-card">
                   <CardHeader>
                     <CardTitle>Resultados</CardTitle>
                   </CardHeader>
                   <CardContent className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                       <div className="bg-muted/50 p-3 rounded-lg">
                         <div className="text-sm text-muted-foreground">Payback</div>
                         <div className="text-xl font-bold text-success">
                           {financialData.payback.toFixed(1)} anos
                         </div>
                       </div>
                       <div className="bg-muted/50 p-3 rounded-lg">
                         <div className="text-sm text-muted-foreground">TIR</div>
                         <div className="text-xl font-bold text-primary">
                           {financialData.tir.toFixed(1)}%
                         </div>
                       </div>
                     </div>

                     <div className="bg-muted/50 p-3 rounded-lg">
                       <div className="text-sm text-muted-foreground">VPL (25 anos)</div>
                       <div className="text-xl font-bold text-secondary">
                         R$ {financialData.vpl.toLocaleString()}
                       </div>
                     </div>

                     <Separator />

                     <div className="space-y-2">
                       <div className="flex justify-between">
                         <span className="text-sm">Economia Anual:</span>
                         <span className="font-medium">R$ {financialData.economiaAnual.toLocaleString()}</span>
                       </div>
                       <div className="flex justify-between">
                         <span className="text-sm">Economia 25 anos:</span>
                         <span className="font-medium text-success">R$ {financialData.economia25Anos.toLocaleString()}</span>
                       </div>
                     </div>

                     <div className="bg-gradient-card p-3 rounded-lg">
                       <div className="text-center">
                         <div className="text-sm text-muted-foreground">Comparativo CDI (8% a.a.)</div>
                         <div className="text-lg font-bold text-primary">
                           {(financialData.tir - 8).toFixed(1)} p.p. superior
                         </div>
                       </div>
                     </div>
                   </CardContent>
                 </Card>
               </div>
             </TabsContent>

             <TabsContent value="lei14300">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card className="shadow-card">
                   <CardHeader>
                     <CardTitle className="flex items-center gap-2">
                       <Shield className="h-5 w-5 text-primary" />
                       Parâmetros Lei 14.300
                     </CardTitle>
                     <CardDescription>
                       Configurações específicas para cálculo conforme Lei 14.300/2022
                     </CardDescription>
                   </CardHeader>
                   <CardContent className="space-y-4">
                     <div className="grid grid-cols-2 gap-4">
                       <div>
                         <Label htmlFor="potenciaSistema">Potência do Sistema (kWp)</Label>
                         <Input
                           id="potenciaSistema"
                           type="number"
                           step="0.1"
                           value={financialData.potenciaSistema}
                           onChange={(e) => handleInputChange("potenciaSistema", Number(e.target.value))}
                         />
                       </div>
                       <div>
                         <Label htmlFor="geracaoAnual">Geração Anual (kWh)</Label>
                         <Input
                           id="geracaoAnual"
                           type="number"
                           value={financialData.geracaoAnual}
                           onChange={(e) => handleInputChange("geracaoAnual", Number(e.target.value))}
                         />
                       </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                       <div>
                         <Label htmlFor="consumoMensal">Consumo Mensal (kWh)</Label>
                         <Input
                           id="consumoMensal"
                           type="number"
                           value={financialData.consumoMensal}
                           onChange={(e) => handleInputChange("consumoMensal", Number(e.target.value))}
                         />
                       </div>
                       <div>
                         <Label htmlFor="incrementoConsumo">Incremento Consumo (%/ano)</Label>
                         <Input
                           id="incrementoConsumo"
                           type="number"
                           step="0.1"
                           value={financialData.incrementoConsumo}
                           onChange={(e) => handleInputChange("incrementoConsumo", Number(e.target.value))}
                         />
                       </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                       <div>
                         <Label htmlFor="fatorSimultaneidade">Fator Simultaneidade (%)</Label>
                         <Input
                           id="fatorSimultaneidade"
                           type="number"
                           step="1"
                           value={financialData.fatorSimultaneidade}
                           onChange={(e) => handleInputChange("fatorSimultaneidade", Number(e.target.value))}
                         />
                       </div>
                       <div>
                         <Label htmlFor="depreciacao">Depreciação Anual (%)</Label>
                         <Input
                           id="depreciacao"
                           type="number"
                           step="0.1"
                           value={financialData.depreciacao}
                           onChange={(e) => handleInputChange("depreciacao", Number(e.target.value))}
                         />
                       </div>
                     </div>

                     <div className="grid grid-cols-2 gap-4">
                       <div>
                         <Label htmlFor="concessionariaId">Concessionária</Label>
                         <Select 
                           value={financialData.concessionariaId} 
                           onValueChange={(value) => handleInputChange("concessionariaId", value)}
                         >
                           <SelectTrigger>
                             <SelectValue placeholder="Selecione a concessionária" />
                           </SelectTrigger>
                           <SelectContent>
                             {concessionarias.map((conc) => (
                               <SelectItem key={conc.id} value={conc.id}>
                                 {conc.nome}
                               </SelectItem>
                             ))}
                           </SelectContent>
                         </Select>
                       </div>
                       <div>
                         <Label htmlFor="tipoLigacao">Tipo de Ligação</Label>
                         <Select 
                           value={financialData.tipoLigacao} 
                           onValueChange={(value) => handleInputChange("tipoLigacao", value)}
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
                     </div>

                     <div>
                       <Label htmlFor="anoInstalacao">Ano de Instalação</Label>
                       <Input
                         id="anoInstalacao"
                         type="number"
                         value={financialData.anoInstalacao}
                         onChange={(e) => handleInputChange("anoInstalacao", Number(e.target.value))}
                       />
                     </div>

                     <Button 
                       onClick={calcularViabilidadeLei14300} 
                       className="w-full"
                       disabled={calculando}
                     >
                       {calculando ? (
                         <>
                           <Zap className="h-4 w-4 mr-2 animate-spin" />
                           Calculando...
                         </>
                       ) : (
                         <>
                           <Calculator className="h-4 w-4 mr-2" />
                           Calcular Lei 14.300
                         </>
                       )}
                     </Button>
                   </CardContent>
                 </Card>

                  <Card className="shadow-card">
                    <CardHeader>
                      <CardTitle>Resultados Lei 14.300</CardTitle>
                      <CardDescription>
                        Análise considerando as regras de compensação
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {resultadoFinanceiro ? (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-muted/50 p-3 rounded-lg">
                              <div className="text-sm text-muted-foreground">Payback Simples</div>
                              <div className="text-xl font-bold text-success">
                                {resultadoFinanceiro.payback_simples_anos.toFixed(1)} anos
                              </div>
                            </div>
                            <div className="bg-muted/50 p-3 rounded-lg">
                              <div className="text-sm text-muted-foreground">Payback Descontado</div>
                              <div className="text-xl font-bold text-primary">
                                {resultadoFinanceiro.payback_descontado_anos.toFixed(1)} anos
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div className="bg-muted/50 p-3 rounded-lg">
                              <div className="text-sm text-muted-foreground">TIR</div>
                              <div className="text-xl font-bold text-secondary">
                                {resultadoFinanceiro.tir.toFixed(1)}%
                              </div>
                            </div>
                            <div className="bg-muted/50 p-3 rounded-lg">
                              <div className="text-sm text-muted-foreground">VPL</div>
                              <div className="text-xl font-bold text-accent">
                                R$ {resultadoFinanceiro.vpl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </div>
                            </div>
                          </div>

                          <Separator />

                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm">Economia 1º Ano:</span>
                              <span className="font-medium">R$ {resultadoFinanceiro.economia_primeiro_ano.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Economia 25 Anos:</span>
                              <span className="font-medium text-success">R$ {resultadoFinanceiro.economia_total_25_anos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Energia Injetada (Ano 1):</span>
                              <span className="font-medium">{resultadoFinanceiro.energia_injetada_ano1.toLocaleString('pt-BR', { minimumFractionDigits: 0 })} kWh</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm">Energia Compensada (Ano 1):</span>
                              <span className="font-medium">{resultadoFinanceiro.energia_compensada_ano1.toLocaleString('pt-BR', { minimumFractionDigits: 0 })} kWh</span>
                            </div>
                          </div>

                          <div className="bg-gradient-card p-3 rounded-lg">
                            <div className="text-center">
                              <div className="text-sm text-muted-foreground">Viabilidade do Projeto</div>
                              <div className="text-lg font-bold text-primary">
                                {resultadoFinanceiro.vpl > 0 && resultadoFinanceiro.tir > 8 ? "VIÁVEL" : "REVISAR"}
                              </div>
                              <div className="text-xs text-muted-foreground mt-1">
                                {resultadoFinanceiro.vpl > 0 ? "VPL Positivo" : "VPL Negativo"} • 
                                {resultadoFinanceiro.tir > 8 ? "TIR > CDI" : "TIR < CDI"}
                              </div>
                            </div>
                          </div>
                        </>
                      ) : (
                        <div className="text-center py-8">
                          <div className="text-muted-foreground mb-4">
                            <Calculator className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            Execute o cálculo para ver os resultados
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Configure os parâmetros e clique em "Calcular Lei 14.300"
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

               <TabsContent value="graficos">
                 <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                   {resultadoFinanceiro ? (
              <>
                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle>Fluxo de Caixa Lei 14.300</CardTitle>
                    <CardDescription>Evolução do retorno financeiro ao longo de 25 anos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={resultadoFinanceiro.resumo_anual}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="ano" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value, name) => [
                            `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`, 
                            name === 'fluxo_caixa_acumulado' ? 'Fluxo Acumulado' : 'Economia Anual'
                          ]} 
                        />
                        <Legend />
                        <Line 
                          type="monotone" 
                          dataKey="fluxo_caixa_acumulado" 
                          stroke="#8884d8" 
                          name="Fluxo Acumulado" 
                          strokeWidth={2}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="economia_anual" 
                          stroke="#82ca9d" 
                          name="Economia Anual" 
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle>Energia: Geração vs Consumo</CardTitle>
                    <CardDescription>Comparativo anual de energia gerada e consumida</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={resultadoFinanceiro.resumo_anual}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="ano" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value, name) => [
                            `${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 0 })} kWh`, 
                            name === 'geracao_total' ? 'Geração' : name === 'consumo_total' ? 'Consumo' : 'Autoconsumo'
                          ]} 
                        />
                        <Legend />
                        <Bar dataKey="geracao_total" fill="#ffc658" name="Geração" />
                        <Bar dataKey="consumo_total" fill="#ff7300" name="Consumo" />
                        <Bar dataKey="autoconsumo_total" fill="#00ff00" name="Autoconsumo" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle>Impacto da Lei 14.300</CardTitle>
                    <CardDescription>Evolução da cobrança do Fio B ao longo dos anos</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={resultadoFinanceiro.resumo_anual.map((ano, index) => ({
                        ...ano,
                        percentual_fio_b: resultadoFinanceiro.resultados_mensais
                          .filter(m => m.ano === ano.ano)
                          .reduce((acc, m) => acc + m.percentual_fio_b, 0) / 12 * 100,
                        custo_fio_b_anual: resultadoFinanceiro.resultados_mensais
                          .filter(m => m.ano === ano.ano)
                          .reduce((acc, m) => acc + m.custo_fio_b, 0)
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="ano" />
                        <YAxis yAxisId="left" />
                        <YAxis yAxisId="right" orientation="right" />
                        <Tooltip 
                          formatter={(value, name) => [
                            name === 'percentual_fio_b' ? `${Number(value).toFixed(1)}%` : `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
                            name === 'percentual_fio_b' ? 'Percentual Fio B' : 'Custo Fio B Anual'
                          ]} 
                        />
                        <Legend />
                        <Line 
                          yAxisId="left"
                          type="monotone" 
                          dataKey="percentual_fio_b" 
                          stroke="#ff0000" 
                          name="% Fio B" 
                          strokeWidth={2}
                        />
                        <Line 
                          yAxisId="right"
                          type="monotone" 
                          dataKey="custo_fio_b_anual" 
                          stroke="#ff7300" 
                          name="Custo Fio B" 
                          strokeWidth={2}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="shadow-card">
                  <CardHeader>
                    <CardTitle>Distribuição de Custos</CardTitle>
                    <CardDescription>Breakdown dos custos no primeiro ano</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <RechartsPieChart>
                        <Pie
                          data={[
                            {
                              name: 'Energia da Rede',
                              value: resultadoFinanceiro.resultados_mensais
                                .filter(m => m.ano === resultadoFinanceiro.resumo_anual[0]?.ano)
                                .reduce((acc, m) => acc + (m.custo_com_fv - m.custo_fio_b - m.custo_disponibilidade), 0),
                              fill: '#8884d8'
                            },
                            {
                              name: 'Fio B (Lei 14.300)',
                              value: resultadoFinanceiro.resultados_mensais
                                .filter(m => m.ano === resultadoFinanceiro.resumo_anual[0]?.ano)
                                .reduce((acc, m) => acc + m.custo_fio_b, 0),
                              fill: '#ff0000'
                            },
                            {
                              name: 'Custo Disponibilidade',
                              value: resultadoFinanceiro.resultados_mensais
                                .filter(m => m.ano === resultadoFinanceiro.resumo_anual[0]?.ano)
                                .reduce((acc, m) => acc + m.custo_disponibilidade, 0),
                              fill: '#ffc658'
                            }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {[
                            { fill: '#8884d8' },
                            { fill: '#ff0000' },
                            { fill: '#ffc658' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.fill} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => `R$ ${Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`} />
                      </RechartsPieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            ) : (
              <Card className="shadow-card col-span-2">
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <div className="text-muted-foreground mb-4">
                       <BarChart3 className="h-12 w-12 mx-auto mb-2 opacity-50" />
                       Gráficos não disponíveis
                     </div>
                    <p className="text-sm text-muted-foreground">
                      Execute o cálculo da Lei 14.300 para visualizar os gráficos detalhados
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
                 </div>
               </TabsContent>
             </Tabs>
           </TabsContent>

        <TabsContent value="analise">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Análise de Retorno sobre Investimento</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-gradient-card p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Target className="h-5 w-5 text-primary" />
                    <h4 className="font-semibold">Payback</h4>
                  </div>
                  <div className="text-3xl font-bold text-primary mb-2">
                    {financialData.payback.toFixed(1)} anos
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Tempo para recuperar investimento
                  </div>
                  <Progress 
                    value={Math.min((8 / financialData.payback) * 100, 100)} 
                    className="mt-2" 
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    {financialData.payback <= 6 ? "Excelente" : 
                     financialData.payback <= 8 ? "Bom" : "Regular"}
                  </div>
                </div>

                <div className="bg-gradient-card p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="h-5 w-5 text-secondary" />
                    <h4 className="font-semibold">TIR</h4>
                  </div>
                  <div className="text-3xl font-bold text-secondary mb-2">
                    {financialData.tir.toFixed(1)}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Taxa Interna de Retorno
                  </div>
                  <Progress 
                    value={Math.min(financialData.tir * 2, 100)} 
                    className="mt-2" 
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    {financialData.tir > 15 ? "Excelente" : 
                     financialData.tir > 10 ? "Bom" : "Regular"}
                  </div>
                </div>

                <div className="bg-gradient-card p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <PiggyBank className="h-5 w-5 text-accent" />
                    <h4 className="font-semibold">Economia Total</h4>
                  </div>
                  <div className="text-3xl font-bold text-accent mb-2">
                    R$ {(financialData.economia25Anos / 1000).toFixed(0)}k
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Economia em 25 anos
                  </div>
                  <div className="text-xs text-success mt-2">
                    {((financialData.economia25Anos / financialData.valorFinal) - 1).toFixed(1)}x o investimento
                  </div>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                <h4 className="font-semibold">Comparativo de Investimentos</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border border-border rounded-lg p-3">
                    <div className="font-medium">Sistema Solar</div>
                    <div className="text-lg font-bold text-primary">{financialData.tir.toFixed(1)}% a.a.</div>
                    <div className="text-sm text-success">Recomendado</div>
                  </div>
                  <div className="border border-border rounded-lg p-3">
                    <div className="font-medium">CDI (Conservador)</div>
                    <div className="text-lg font-bold text-muted-foreground">8.0% a.a.</div>
                    <div className="text-sm text-muted-foreground">Baixo risco</div>
                  </div>
                  <div className="border border-border rounded-lg p-3">
                    <div className="font-medium">Poupança</div>
                    <div className="text-lg font-bold text-muted-foreground">6.2% a.a.</div>
                    <div className="text-sm text-muted-foreground">Muito conservador</div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="financiamento">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Simulações de Financiamento
              </CardTitle>
              <CardDescription>
                Compare opções de financiamento disponíveis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {financingOptions.map((opcao, index) => {
                  const valorParcela = calcularFinanciamento(opcao);
                  const valorTotal = valorParcela * opcao.parcelas;
                  const jurosTotal = valorTotal - financialData.valorFinal;
                  
                  return (
                    <div key={index} className="border border-border rounded-lg p-4 hover:shadow-card transition-smooth">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold">{opcao.banco}</h4>
                        <Badge variant="outline">{opcao.taxa}% a.m.</Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Parcelas:</span>
                          <span className="font-medium">{opcao.parcelas}x</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Carência:</span>
                          <span className="font-medium">{opcao.carencia} meses</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Valor da Parcela:</span>
                          <span className="font-medium text-primary">R$ {valorParcela.toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Total de Juros:</span>
                          <span className="font-medium text-warning">R$ {jurosTotal.toLocaleString()}</span>
                        </div>
                      </div>
                      
                      <Separator className="my-3" />
                      
                      <div className="text-center">
                        <div className="text-lg font-bold">R$ {valorTotal.toLocaleString()}</div>
                        <div className="text-sm text-muted-foreground">Valor Total</div>
                      </div>
                      
                      <Button variant="outline" className="w-full mt-3">
                        Simular {opcao.banco}
                      </Button>
                    </div>
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