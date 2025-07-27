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
import { TrendingUp, DollarSign, Calculator, CreditCard, PiggyBank, Target, Settings } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { FinancialKitManager } from "./FinancialKitManager";

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
    economia25Anos: 0
  });

  const [financingOptions] = useState<FinancingOption[]>([
    { banco: "BV Financeira", taxa: 1.2, parcelas: 60, carencia: 0, valorParcela: 0 },
    { banco: "Santander", taxa: 1.35, parcelas: 72, carencia: 3, valorParcela: 0 },
    { banco: "Sicredi", taxa: 1.15, parcelas: 84, carencia: 6, valorParcela: 0 },
    { banco: "CrediSIS", taxa: 0.99, parcelas: 120, carencia: 12, valorParcela: 0 }
  ]);

  const [kitsDisponiveis, setKitsDisponiveis] = useState<unknown[]>([]);
  const [isKitManagerOpen, setIsKitManagerOpen] = useState(false);

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
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Análise Financeira
          </CardTitle>
          <CardDescription>
            Calcule retorno, payback e simulações de financiamento
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Indicadores Principais */}
      <Card className="shadow-card">
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-primary">
                R$ {financialData.valorFinal.toLocaleString()}
              </div>
              <div className="text-sm text-muted-foreground">Valor Final</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-success">
                {financialData.payback.toFixed(1)} anos
              </div>
              <div className="text-sm text-muted-foreground">Payback</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-secondary">
                {financialData.tir.toFixed(1)}%
              </div>
              <div className="text-sm text-muted-foreground">TIR</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-accent">
                R$ {(financialData.vpl / 1000).toFixed(0)}k
              </div>
              <div className="text-sm text-muted-foreground">VPL</div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="kits" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="kits">Kits & Preços</TabsTrigger>
          <TabsTrigger value="calculos">Cálculos</TabsTrigger>
          <TabsTrigger value="analise">Análise ROI</TabsTrigger>
          <TabsTrigger value="financiamento">Financiamento</TabsTrigger>
        </TabsList>

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