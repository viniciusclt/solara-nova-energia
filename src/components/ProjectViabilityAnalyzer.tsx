import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Zap,
  Sun,
  Leaf,
  BarChart3,
  PieChart,
  Calendar,
  Target,
  AlertTriangle,
  CheckCircle2,
  Info,
  Download,
  RefreshCw,
  Lightbulb,
  Battery,
  Home,
  Factory,
  MapPin,
  Clock
} from 'lucide-react';

interface ProjectData {
  // Dados básicos do projeto
  nomeCliente: string;
  tipoCliente: 'residencial' | 'comercial' | 'industrial' | 'rural';
  localizacao: {
    cidade: string;
    estado: string;
    latitude?: number;
    longitude?: number;
    irradiacao: number; // kWh/m²/dia
  };
  
  // Dados de consumo
  consumoMensalKwh: number;
  tarifaEnergia: number; // R$/kWh
  bandeiraTarifaria: number; // R$/kWh adicional
  aumentoAnualTarifa: number; // %
  
  // Dados do sistema
  potenciaInstalada: number; // kWp
  geracaoEstimada: number; // kWh/mês
  eficienciaInversor: number; // %
  perdaSistema: number; // %
  vidaUtilSistema: number; // anos
  
  // Dados financeiros
  investimentoTotal: number;
  custoManutencao: number; // R$/ano
  aumentoManutencao: number; // % ao ano
  
  // Financiamento (opcional)
  financiamento?: {
    valorFinanciado: number;
    taxaJuros: number; // % ao mês
    prazoMeses: number;
    valorEntrada: number;
  };
  
  // Incentivos
  compensacaoEnergia: boolean;
  descontoICMS: number; // %
  outrosIncentivos: number; // R$
}

interface ViabilityMetrics {
  // Métricas financeiras
  payback: number; // anos
  vpl: number; // Valor Presente Líquido
  tir: number; // Taxa Interna de Retorno (%)
  roi: number; // Return on Investment (%)
  
  // Economia
  economiaAnual: number;
  economiaTotal25Anos: number;
  economiaComFinanciamento?: number;
  
  // Produção
  producaoAnual: number;
  producaoTotal25Anos: number;
  autoconsumo: number; // %
  injecaoRede: number; // %
  
  // Sustentabilidade
  co2Evitado: number; // toneladas em 25 anos
  arvoresEquivalentes: number;
  
  // Análise de risco
  sensibilidade: {
    tarifaEnergia: { pessimista: number; otimista: number };
    irradiacao: { pessimista: number; otimista: number };
    custoSistema: { pessimista: number; otimista: number };
  };
  
  // Classificação
  classificacao: 'excelente' | 'muito_bom' | 'bom' | 'regular' | 'ruim';
  score: number; // 0-100
}

interface ProjectViabilityAnalyzerProps {
  initialData?: Partial<ProjectData>;
  onAnalysisComplete?: (metrics: ViabilityMetrics) => void;
}

const ProjectViabilityAnalyzer: React.FC<ProjectViabilityAnalyzerProps> = ({
  initialData,
  onAnalysisComplete
}) => {
  const { toast } = useToast();
  
  // Estados principais
  const [projectData, setProjectData] = useState<ProjectData>({
    nomeCliente: '',
    tipoCliente: 'residencial',
    localizacao: {
      cidade: '',
      estado: '',
      irradiacao: 5.5
    },
    consumoMensalKwh: 300,
    tarifaEnergia: 0.75,
    bandeiraTarifaria: 0.05,
    aumentoAnualTarifa: 8,
    potenciaInstalada: 3,
    geracaoEstimada: 450,
    eficienciaInversor: 97,
    perdaSistema: 15,
    vidaUtilSistema: 25,
    investimentoTotal: 18000,
    custoManutencao: 200,
    aumentoManutencao: 5,
    compensacaoEnergia: true,
    descontoICMS: 18,
    outrosIncentivos: 0,
    ...initialData
  });
  
  const [viabilityMetrics, setViabilityMetrics] = useState<ViabilityMetrics | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentTab, setCurrentTab] = useState('dados');
  
  // Dados de referência
  const tiposCliente = [
    { value: 'residencial', label: 'Residencial', icon: Home },
    { value: 'comercial', label: 'Comercial', icon: Factory },
    { value: 'industrial', label: 'Industrial', icon: Factory },
    { value: 'rural', label: 'Rural', icon: Leaf }
  ];
  
  const estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];
  
  // Irradiação média por estado (kWh/m²/dia)
  const irradiacaoEstados: Record<string, number> = {
    'AC': 4.8, 'AL': 5.8, 'AP': 5.2, 'AM': 4.9, 'BA': 6.2, 'CE': 6.0,
    'DF': 5.7, 'ES': 5.5, 'GO': 5.8, 'MA': 5.5, 'MT': 5.9, 'MS': 5.7,
    'MG': 5.6, 'PA': 5.1, 'PB': 6.1, 'PR': 5.2, 'PE': 6.0, 'PI': 5.9,
    'RJ': 5.3, 'RN': 6.2, 'RS': 4.9, 'RO': 5.0, 'RR': 5.3, 'SC': 4.8,
    'SP': 5.4, 'SE': 5.9, 'TO': 5.8
  };
  
  // Calcular métricas automaticamente quando os dados mudarem
  useEffect(() => {
    if (projectData.nomeCliente && projectData.investimentoTotal > 0) {
      calculateViability();
    }
  }, [projectData]);
  
  // Atualizar irradiação quando o estado mudar
  useEffect(() => {
    if (projectData.localizacao.estado && irradiacaoEstados[projectData.localizacao.estado]) {
      setProjectData(prev => ({
        ...prev,
        localizacao: {
          ...prev.localizacao,
          irradiacao: irradiacaoEstados[prev.localizacao.estado]
        }
      }));
    }
  }, [projectData.localizacao.estado]);
  
  const calculateViability = useCallback(async () => {
    setIsAnalyzing(true);
    
    try {
      // Simular delay para análise
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const metrics = performViabilityAnalysis(projectData);
      setViabilityMetrics(metrics);
      
      if (onAnalysisComplete) {
        onAnalysisComplete(metrics);
      }
      
    } catch (error) {
      console.error('Erro na análise:', error);
      toast({
        title: 'Erro na Análise',
        description: 'Erro ao calcular viabilidade do projeto',
        variant: 'destructive'
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [projectData, onAnalysisComplete, toast]);
  
  const performViabilityAnalysis = (data: ProjectData): ViabilityMetrics => {
    // Cálculos básicos
    const geracaoAnual = data.geracaoEstimada * 12;
    const consumoAnual = data.consumoMensalKwh * 12;
    const autoconsumo = Math.min(geracaoAnual / consumoAnual * 100, 100);
    const injecaoRede = Math.max(0, 100 - autoconsumo);
    
    // Economia anual
    const tarifaTotal = data.tarifaEnergia + data.bandeiraTarifaria;
    const economiaEnergia = Math.min(geracaoAnual, consumoAnual) * tarifaTotal;
    const creditoInjecao = Math.max(0, geracaoAnual - consumoAnual) * data.tarifaEnergia * 0.95; // 5% de perda
    const economiaAnual = economiaEnergia + creditoInjecao - data.custoManutencao;
    
    // Fluxo de caixa para 25 anos
    const fluxoCaixa: number[] = [];
    let economiaAcumulada = 0;
    let custoManutencaoAtual = data.custoManutencao;
    let tarifaAtual = tarifaTotal;
    
    for (let ano = 0; ano <= 25; ano++) {
      if (ano === 0) {
        // Investimento inicial
        fluxoCaixa.push(-data.investimentoTotal);
      } else {
        // Economia anual com degradação do sistema (0.5% ao ano)
        const degradacao = Math.pow(0.995, ano - 1);
        const geracaoAnoAtual = geracaoAnual * degradacao;
        const economiaEnergia = Math.min(geracaoAnoAtual, consumoAnual) * tarifaAtual;
        const creditoInjecao = Math.max(0, geracaoAnoAtual - consumoAnual) * tarifaAtual * 0.95;
        const economiaAno = economiaEnergia + creditoInjecao - custoManutencaoAtual;
        
        fluxoCaixa.push(economiaAno);
        economiaAcumulada += economiaAno;
        
        // Atualizar tarifa e custo de manutenção
        tarifaAtual *= (1 + data.aumentoAnualTarifa / 100);
        custoManutencaoAtual *= (1 + data.aumentoManutencao / 100);
      }
    }
    
    // Cálculo do Payback
    let payback = 0;
    let acumulado = 0;
    for (let i = 0; i < fluxoCaixa.length; i++) {
      acumulado += fluxoCaixa[i];
      if (acumulado >= 0 && payback === 0) {
        payback = i + (Math.abs(acumulado - fluxoCaixa[i]) / fluxoCaixa[i]);
        break;
      }
    }
    
    // Cálculo do VPL (taxa de desconto 10%)
    const taxaDesconto = 0.10;
    const vpl = fluxoCaixa.reduce((acc, valor, index) => {
      return acc + valor / Math.pow(1 + taxaDesconto, index);
    }, 0);
    
    // Cálculo da TIR (aproximação)
    const tir = calculateTIR(fluxoCaixa);
    
    // ROI
    const roi = (economiaAcumulada / data.investimentoTotal) * 100;
    
    // Sustentabilidade
    const producaoTotal25Anos = geracaoAnual * 25 * 0.9; // Considerando degradação média
    const co2Evitado = producaoTotal25Anos * 0.0847; // 84.7g CO2/kWh (fator Brasil)
    const arvoresEquivalentes = co2Evitado / 0.022; // 22kg CO2/árvore/ano
    
    // Análise de sensibilidade
    const sensibilidade = {
      tarifaEnergia: {
        pessimista: calculateVPLWithTariff(data, tarifaTotal * 0.8),
        otimista: calculateVPLWithTariff(data, tarifaTotal * 1.2)
      },
      irradiacao: {
        pessimista: calculateVPLWithIrradiation(data, data.localizacao.irradiacao * 0.9),
        otimista: calculateVPLWithIrradiation(data, data.localizacao.irradiacao * 1.1)
      },
      custoSistema: {
        pessimista: calculateVPLWithCost(data, data.investimentoTotal * 1.2),
        otimista: calculateVPLWithCost(data, data.investimentoTotal * 0.8)
      }
    };
    
    // Classificação e score
    let score = 0;
    
    // Payback (30 pontos)
    if (payback <= 5) score += 30;
    else if (payback <= 7) score += 25;
    else if (payback <= 10) score += 20;
    else if (payback <= 15) score += 10;
    
    // VPL (25 pontos)
    if (vpl >= data.investimentoTotal) score += 25;
    else if (vpl >= data.investimentoTotal * 0.5) score += 20;
    else if (vpl >= 0) score += 15;
    else if (vpl >= -data.investimentoTotal * 0.2) score += 5;
    
    // TIR (20 pontos)
    if (tir >= 20) score += 20;
    else if (tir >= 15) score += 15;
    else if (tir >= 12) score += 10;
    else if (tir >= 8) score += 5;
    
    // Autoconsumo (15 pontos)
    if (autoconsumo >= 90) score += 15;
    else if (autoconsumo >= 70) score += 12;
    else if (autoconsumo >= 50) score += 8;
    else if (autoconsumo >= 30) score += 4;
    
    // Localização (10 pontos)
    if (data.localizacao.irradiacao >= 6) score += 10;
    else if (data.localizacao.irradiacao >= 5.5) score += 8;
    else if (data.localizacao.irradiacao >= 5) score += 6;
    else if (data.localizacao.irradiacao >= 4.5) score += 4;
    
    let classificacao: ViabilityMetrics['classificacao'];
    if (score >= 85) classificacao = 'excelente';
    else if (score >= 70) classificacao = 'muito_bom';
    else if (score >= 55) classificacao = 'bom';
    else if (score >= 40) classificacao = 'regular';
    else classificacao = 'ruim';
    
    return {
      payback,
      vpl,
      tir,
      roi,
      economiaAnual,
      economiaTotal25Anos: economiaAcumulada,
      producaoAnual: geracaoAnual,
      producaoTotal25Anos,
      autoconsumo,
      injecaoRede,
      co2Evitado,
      arvoresEquivalentes,
      sensibilidade,
      classificacao,
      score
    };
  };
  
  const calculateTIR = (fluxoCaixa: number[]): number => {
    // Método de Newton-Raphson simplificado
    let taxa = 0.1; // Chute inicial de 10%
    
    for (let i = 0; i < 100; i++) {
      let vpl = 0;
      let derivada = 0;
      
      for (let j = 0; j < fluxoCaixa.length; j++) {
        vpl += fluxoCaixa[j] / Math.pow(1 + taxa, j);
        derivada -= j * fluxoCaixa[j] / Math.pow(1 + taxa, j + 1);
      }
      
      if (Math.abs(vpl) < 0.01) break;
      
      taxa = taxa - vpl / derivada;
      
      if (taxa < -0.99) taxa = -0.99;
      if (taxa > 10) taxa = 10;
    }
    
    return taxa * 100;
  };
  
  const calculateVPLWithTariff = (data: ProjectData, newTariff: number): number => {
    const tempData = { ...data, tarifaEnergia: newTariff - data.bandeiraTarifaria };
    const metrics = performViabilityAnalysis(tempData);
    return metrics.vpl;
  };
  
  const calculateVPLWithIrradiation = (data: ProjectData, newIrradiation: number): number => {
    const factor = newIrradiation / data.localizacao.irradiacao;
    const tempData = { 
      ...data, 
      geracaoEstimada: data.geracaoEstimada * factor,
      localizacao: { ...data.localizacao, irradiacao: newIrradiation }
    };
    const metrics = performViabilityAnalysis(tempData);
    return metrics.vpl;
  };
  
  const calculateVPLWithCost = (data: ProjectData, newCost: number): number => {
    const tempData = { ...data, investimentoTotal: newCost };
    const metrics = performViabilityAnalysis(tempData);
    return metrics.vpl;
  };
  
  const exportAnalysis = () => {
    if (!viabilityMetrics) return;
    
    const report = {
      projeto: {
        cliente: projectData.nomeCliente,
        tipo: projectData.tipoCliente,
        localizacao: `${projectData.localizacao.cidade}, ${projectData.localizacao.estado}`,
        data_analise: new Date().toLocaleDateString('pt-BR')
      },
      sistema: {
        potencia_instalada_kwp: projectData.potenciaInstalada,
        geracao_estimada_kwh_mes: projectData.geracaoEstimada,
        investimento_total: projectData.investimentoTotal,
        vida_util_anos: projectData.vidaUtilSistema
      },
      viabilidade: {
        classificacao: viabilityMetrics.classificacao,
        score: viabilityMetrics.score,
        payback_anos: viabilityMetrics.payback.toFixed(1),
        vpl_reais: viabilityMetrics.vpl.toFixed(2),
        tir_percentual: viabilityMetrics.tir.toFixed(1),
        roi_percentual: viabilityMetrics.roi.toFixed(1)
      },
      economia: {
        economia_anual_reais: viabilityMetrics.economiaAnual.toFixed(2),
        economia_25_anos_reais: viabilityMetrics.economiaTotal25Anos.toFixed(2),
        autoconsumo_percentual: viabilityMetrics.autoconsumo.toFixed(1)
      },
      sustentabilidade: {
        co2_evitado_toneladas: viabilityMetrics.co2Evitado.toFixed(2),
        arvores_equivalentes: Math.round(viabilityMetrics.arvoresEquivalentes),
        producao_25_anos_kwh: viabilityMetrics.producaoTotal25Anos.toFixed(0)
      }
    };
    
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analise-viabilidade-${projectData.nomeCliente.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  const getClassificationColor = (classification: string) => {
    switch (classification) {
      case 'excelente': return 'text-green-600 bg-green-50';
      case 'muito_bom': return 'text-blue-600 bg-blue-50';
      case 'bom': return 'text-yellow-600 bg-yellow-50';
      case 'regular': return 'text-orange-600 bg-orange-50';
      case 'ruim': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };
  
  const getClassificationLabel = (classification: string) => {
    switch (classification) {
      case 'excelente': return 'Excelente';
      case 'muito_bom': return 'Muito Bom';
      case 'bom': return 'Bom';
      case 'regular': return 'Regular';
      case 'ruim': return 'Ruim';
      default: return 'Não Avaliado';
    }
  };
  
  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="h-5 w-5" />
            Análise de Viabilidade de Projetos Solares
          </div>
          <div className="flex items-center gap-2">
            {viabilityMetrics && (
              <Button variant="outline" size="sm" onClick={exportAnalysis}>
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={calculateViability} disabled={isAnalyzing}>
              {isAnalyzing ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Calculator className="h-4 w-4 mr-2" />
              )}
              {isAnalyzing ? 'Analisando...' : 'Analisar'}
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dados">Dados</TabsTrigger>
            <TabsTrigger value="resultados">Resultados</TabsTrigger>
            <TabsTrigger value="financeiro">Financeiro</TabsTrigger>
            <TabsTrigger value="sustentabilidade">Sustentabilidade</TabsTrigger>
            <TabsTrigger value="sensibilidade">Sensibilidade</TabsTrigger>
          </TabsList>
          
          {/* Tab Dados */}
          <TabsContent value="dados" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Dados do Cliente */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    Dados do Cliente
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Nome do Cliente</Label>
                    <Input
                      value={projectData.nomeCliente}
                      onChange={(e) => setProjectData(prev => ({ ...prev, nomeCliente: e.target.value }))}
                      placeholder="Nome do cliente"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Tipo de Cliente</Label>
                    <Select 
                      value={projectData.tipoCliente} 
                      onValueChange={(value: any) => setProjectData(prev => ({ ...prev, tipoCliente: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposCliente.map(tipo => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            <div className="flex items-center gap-2">
                              <tipo.icon className="h-4 w-4" />
                              {tipo.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label>Cidade</Label>
                      <Input
                        value={projectData.localizacao.cidade}
                        onChange={(e) => setProjectData(prev => ({
                          ...prev,
                          localizacao: { ...prev.localizacao, cidade: e.target.value }
                        }))}
                        placeholder="Cidade"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Estado</Label>
                      <Select 
                        value={projectData.localizacao.estado} 
                        onValueChange={(value) => setProjectData(prev => ({
                          ...prev,
                          localizacao: { ...prev.localizacao, estado: value }
                        }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="UF" />
                        </SelectTrigger>
                        <SelectContent>
                          {estados.map(estado => (
                            <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Irradiação Solar (kWh/m²/dia)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={projectData.localizacao.irradiacao}
                      onChange={(e) => setProjectData(prev => ({
                        ...prev,
                        localizacao: { ...prev.localizacao, irradiacao: Number(e.target.value) }
                      }))}
                    />
                  </div>
                </CardContent>
              </Card>
              
              {/* Dados de Consumo */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Zap className="h-5 w-5" />
                    Dados de Consumo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Consumo Mensal (kWh)</Label>
                    <Input
                      type="number"
                      value={projectData.consumoMensalKwh}
                      onChange={(e) => setProjectData(prev => ({ ...prev, consumoMensalKwh: Number(e.target.value) }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Tarifa de Energia (R$/kWh)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={projectData.tarifaEnergia}
                      onChange={(e) => setProjectData(prev => ({ ...prev, tarifaEnergia: Number(e.target.value) }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Bandeira Tarifária (R$/kWh)</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={projectData.bandeiraTarifaria}
                      onChange={(e) => setProjectData(prev => ({ ...prev, bandeiraTarifaria: Number(e.target.value) }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Aumento Anual da Tarifa (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={projectData.aumentoAnualTarifa}
                      onChange={(e) => setProjectData(prev => ({ ...prev, aumentoAnualTarifa: Number(e.target.value) }))}
                    />
                  </div>
                </CardContent>
              </Card>
              
              {/* Dados do Sistema */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Sun className="h-5 w-5" />
                    Dados do Sistema
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Potência Instalada (kWp)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={projectData.potenciaInstalada}
                      onChange={(e) => setProjectData(prev => ({ ...prev, potenciaInstalada: Number(e.target.value) }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Geração Estimada (kWh/mês)</Label>
                    <Input
                      type="number"
                      value={projectData.geracaoEstimada}
                      onChange={(e) => setProjectData(prev => ({ ...prev, geracaoEstimada: Number(e.target.value) }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Eficiência do Inversor (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={projectData.eficienciaInversor}
                      onChange={(e) => setProjectData(prev => ({ ...prev, eficienciaInversor: Number(e.target.value) }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Perda do Sistema (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={projectData.perdaSistema}
                      onChange={(e) => setProjectData(prev => ({ ...prev, perdaSistema: Number(e.target.value) }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Vida Útil do Sistema (anos)</Label>
                    <Input
                      type="number"
                      value={projectData.vidaUtilSistema}
                      onChange={(e) => setProjectData(prev => ({ ...prev, vidaUtilSistema: Number(e.target.value) }))}
                    />
                  </div>
                </CardContent>
              </Card>
              
              {/* Dados Financeiros */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Dados Financeiros
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Investimento Total (R$)</Label>
                    <Input
                      type="number"
                      value={projectData.investimentoTotal}
                      onChange={(e) => setProjectData(prev => ({ ...prev, investimentoTotal: Number(e.target.value) }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Custo de Manutenção Anual (R$)</Label>
                    <Input
                      type="number"
                      value={projectData.custoManutencao}
                      onChange={(e) => setProjectData(prev => ({ ...prev, custoManutencao: Number(e.target.value) }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Aumento Anual da Manutenção (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={projectData.aumentoManutencao}
                      onChange={(e) => setProjectData(prev => ({ ...prev, aumentoManutencao: Number(e.target.value) }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Desconto ICMS (%)</Label>
                    <Input
                      type="number"
                      step="0.1"
                      value={projectData.descontoICMS}
                      onChange={(e) => setProjectData(prev => ({ ...prev, descontoICMS: Number(e.target.value) }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Outros Incentivos (R$)</Label>
                    <Input
                      type="number"
                      value={projectData.outrosIncentivos}
                      onChange={(e) => setProjectData(prev => ({ ...prev, outrosIncentivos: Number(e.target.value) }))}
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Tab Resultados */}
          <TabsContent value="resultados" className="space-y-4">
            {viabilityMetrics ? (
              <>
                {/* Resumo Executivo */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Target className="h-5 w-5" />
                        Resumo Executivo
                      </div>
                      <Badge className={`px-3 py-1 ${getClassificationColor(viabilityMetrics.classificacao)}`}>
                        {getClassificationLabel(viabilityMetrics.classificacao)}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">
                          {viabilityMetrics.payback.toFixed(1)}
                        </div>
                        <div className="text-sm text-muted-foreground">anos</div>
                        <div className="text-xs font-medium">Payback</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">
                          {viabilityMetrics.tir.toFixed(1)}%
                        </div>
                        <div className="text-sm text-muted-foreground">ao ano</div>
                        <div className="text-xs font-medium">TIR</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">
                          R$ {(viabilityMetrics.vpl / 1000).toFixed(0)}k
                        </div>
                        <div className="text-sm text-muted-foreground">em 25 anos</div>
                        <div className="text-xs font-medium">VPL</div>
                      </div>
                      
                      <div className="text-center">
                        <div className="text-2xl font-bold text-orange-600">
                          {viabilityMetrics.score}
                        </div>
                        <div className="text-sm text-muted-foreground">de 100</div>
                        <div className="text-xs font-medium">Score</div>
                      </div>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="text-center">
                      <Progress value={viabilityMetrics.score} className="w-full h-3 mb-2" />
                      <div className="text-sm text-muted-foreground">
                        Score de Viabilidade: {viabilityMetrics.score}/100
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Métricas Detalhadas */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <DollarSign className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium">Economia Anual</span>
                      </div>
                      <div className="text-lg font-bold">
                        R$ {viabilityMetrics.economiaAnual.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Total em 25 anos: R$ {(viabilityMetrics.economiaTotal25Anos / 1000).toFixed(0)}k
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Zap className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium">Produção Anual</span>
                      </div>
                      <div className="text-lg font-bold">
                        {viabilityMetrics.producaoAnual.toLocaleString()} kWh
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Total em 25 anos: {(viabilityMetrics.producaoTotal25Anos / 1000).toFixed(0)}k kWh
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Home className="h-4 w-4 text-blue-600" />
                        <span className="text-sm font-medium">Autoconsumo</span>
                      </div>
                      <div className="text-lg font-bold">
                        {viabilityMetrics.autoconsumo.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Injeção na rede: {viabilityMetrics.injecaoRede.toFixed(1)}%
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <TrendingUp className="h-4 w-4 text-purple-600" />
                        <span className="text-sm font-medium">ROI</span>
                      </div>
                      <div className="text-lg font-bold">
                        {viabilityMetrics.roi.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Retorno sobre investimento
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-orange-600" />
                        <span className="text-sm font-medium">Payback</span>
                      </div>
                      <div className="text-lg font-bold">
                        {viabilityMetrics.payback.toFixed(1)} anos
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Tempo de retorno do investimento
                      </div>
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <BarChart3 className="h-4 w-4 text-red-600" />
                        <span className="text-sm font-medium">TIR</span>
                      </div>
                      <div className="text-lg font-bold">
                        {viabilityMetrics.tir.toFixed(1)}%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Taxa interna de retorno
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Calculator className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Preencha os dados do projeto e clique em "Analisar" para ver os resultados
                  </p>
                  <Button onClick={calculateViability} disabled={isAnalyzing}>
                    {isAnalyzing ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Analisando...
                      </>
                    ) : (
                      <>
                        <Calculator className="h-4 w-4 mr-2" />
                        Analisar Viabilidade
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Tab Financeiro */}
          <TabsContent value="financeiro" className="space-y-4">
            {viabilityMetrics ? (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Fluxo de Caixa Projetado</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between font-medium border-b pb-2">
                        <span>Ano</span>
                        <span>Economia Anual</span>
                        <span>Acumulado</span>
                      </div>
                      {Array.from({ length: 6 }, (_, i) => {
                        const ano = i;
                        const economia = ano === 0 ? -projectData.investimentoTotal : viabilityMetrics.economiaAnual * Math.pow(0.995, ano - 1);
                        const acumulado = ano === 0 ? economia : economia * ano - projectData.investimentoTotal;
                        
                        return (
                          <div key={ano} className="flex justify-between py-1">
                            <span>{ano}</span>
                            <span className={economia >= 0 ? 'text-green-600' : 'text-red-600'}>
                              R$ {economia.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                            </span>
                            <span className={acumulado >= 0 ? 'text-green-600' : 'text-red-600'}>
                              R$ {acumulado.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                            </span>
                          </div>
                        );
                      })}
                      <div className="text-xs text-muted-foreground pt-2">
                        * Valores considerando degradação de 0,5% ao ano
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Indicadores Financeiros</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Valor Presente Líquido (VPL)</span>
                        <span className={`font-medium ${viabilityMetrics.vpl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          R$ {viabilityMetrics.vpl.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Taxa Interna de Retorno (TIR)</span>
                        <span className="font-medium text-blue-600">
                          {viabilityMetrics.tir.toFixed(2)}% a.a.
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Return on Investment (ROI)</span>
                        <span className="font-medium text-purple-600">
                          {viabilityMetrics.roi.toFixed(1)}%
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Payback Simples</span>
                        <span className="font-medium text-orange-600">
                          {viabilityMetrics.payback.toFixed(1)} anos
                        </span>
                      </div>
                      
                      <Separator />
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Investimento Total</span>
                        <span className="font-medium">
                          R$ {projectData.investimentoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Economia Total (25 anos)</span>
                        <span className="font-medium text-green-600">
                          R$ {viabilityMetrics.economiaTotal25Anos.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Lucro Líquido (25 anos)</span>
                        <span className={`font-medium ${(viabilityMetrics.economiaTotal25Anos - projectData.investimentoTotal) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          R$ {(viabilityMetrics.economiaTotal25Anos - projectData.investimentoTotal).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Execute a análise para ver as métricas financeiras
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Tab Sustentabilidade */}
          <TabsContent value="sustentabilidade" className="space-y-4">
            {viabilityMetrics ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Leaf className="h-5 w-5 text-green-600" />
                      Impacto Ambiental
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">
                        {viabilityMetrics.co2Evitado.toFixed(1)}
                      </div>
                      <div className="text-sm text-muted-foreground">toneladas de CO₂ evitadas</div>
                      <div className="text-xs text-muted-foreground">em 25 anos</div>
                    </div>
                    
                    <Separator />
                    
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {Math.round(viabilityMetrics.arvoresEquivalentes)}
                      </div>
                      <div className="text-sm text-muted-foreground">árvores plantadas equivalentes</div>
                      <div className="text-xs text-muted-foreground">absorção de CO₂</div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Produção total (25 anos):</span>
                        <span className="font-medium">
                          {(viabilityMetrics.producaoTotal25Anos / 1000).toFixed(0)}k kWh
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span>Equivale a:</span>
                        <span className="font-medium">
                          {(viabilityMetrics.producaoTotal25Anos / 1000000).toFixed(1)} MWh
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span>Fator de emissão evitado:</span>
                        <span className="font-medium">84.7g CO₂/kWh</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Sun className="h-5 w-5 text-yellow-600" />
                      Benefícios Energéticos
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm">Autoconsumo</span>
                          <span className="text-sm font-medium">{viabilityMetrics.autoconsumo.toFixed(1)}%</span>
                        </div>
                        <Progress value={viabilityMetrics.autoconsumo} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm">Injeção na rede</span>
                          <span className="text-sm font-medium">{viabilityMetrics.injecaoRede.toFixed(1)}%</span>
                        </div>
                        <Progress value={viabilityMetrics.injecaoRede} className="h-2" />
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Produção anual:</span>
                        <span className="font-medium">
                          {viabilityMetrics.producaoAnual.toLocaleString()} kWh
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span>Consumo anual:</span>
                        <span className="font-medium">
                          {(projectData.consumoMensalKwh * 12).toLocaleString()} kWh
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span>Cobertura do consumo:</span>
                        <span className="font-medium text-green-600">
                          {((viabilityMetrics.producaoAnual / (projectData.consumoMensalKwh * 12)) * 100).toFixed(1)}%
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span>Irradiação local:</span>
                        <span className="font-medium">
                          {projectData.localizacao.irradiacao} kWh/m²/dia
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <Leaf className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Execute a análise para ver o impacto ambiental
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Tab Sensibilidade */}
          <TabsContent value="sensibilidade" className="space-y-4">
            {viabilityMetrics ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-orange-600" />
                      Análise de Sensibilidade
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                          Esta análise mostra como variações nos principais parâmetros afetam a viabilidade do projeto.
                          Os cenários pessimista e otimista consideram variações de ±20% nos valores base.
                        </AlertDescription>
                      </Alert>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Sensibilidade Tarifa */}
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">Tarifa de Energia</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="text-center">
                              <div className="text-lg font-bold">Base</div>
                              <div className="text-sm text-muted-foreground">
                                R$ {viabilityMetrics.vpl.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                              </div>
                            </div>
                            
                            <Separator className="my-2" />
                            
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span>Pessimista (-20%):</span>
                                <span className={viabilityMetrics.sensibilidade.tarifaEnergia.pessimista >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  R$ {viabilityMetrics.sensibilidade.tarifaEnergia.pessimista.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Otimista (+20%):</span>
                                <span className={viabilityMetrics.sensibilidade.tarifaEnergia.otimista >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  R$ {viabilityMetrics.sensibilidade.tarifaEnergia.otimista.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        {/* Sensibilidade Irradiação */}
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">Irradiação Solar</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="text-center">
                              <div className="text-lg font-bold">Base</div>
                              <div className="text-sm text-muted-foreground">
                                R$ {viabilityMetrics.vpl.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                              </div>
                            </div>
                            
                            <Separator className="my-2" />
                            
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span>Pessimista (-10%):</span>
                                <span className={viabilityMetrics.sensibilidade.irradiacao.pessimista >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  R$ {viabilityMetrics.sensibilidade.irradiacao.pessimista.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Otimista (+10%):</span>
                                <span className={viabilityMetrics.sensibilidade.irradiacao.otimista >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  R$ {viabilityMetrics.sensibilidade.irradiacao.otimista.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                        
                        {/* Sensibilidade Custo */}
                        <Card>
                          <CardHeader className="pb-3">
                            <CardTitle className="text-base">Custo do Sistema</CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2">
                            <div className="text-center">
                              <div className="text-lg font-bold">Base</div>
                              <div className="text-sm text-muted-foreground">
                                R$ {viabilityMetrics.vpl.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                              </div>
                            </div>
                            
                            <Separator className="my-2" />
                            
                            <div className="space-y-1 text-xs">
                              <div className="flex justify-between">
                                <span>Pessimista (+20%):</span>
                                <span className={viabilityMetrics.sensibilidade.custoSistema.pessimista >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  R$ {viabilityMetrics.sensibilidade.custoSistema.pessimista.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Otimista (-20%):</span>
                                <span className={viabilityMetrics.sensibilidade.custoSistema.otimista >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  R$ {viabilityMetrics.sensibilidade.custoSistema.otimista.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                                </span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                {/* Matriz de Risco */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Matriz de Risco</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                            Fatores Positivos
                          </h4>
                          <ul className="space-y-1 text-sm text-muted-foreground">
                            {projectData.localizacao.irradiacao >= 5.5 && (
                              <li>• Boa irradiação solar na região</li>
                            )}
                            {viabilityMetrics.autoconsumo >= 70 && (
                              <li>• Alto percentual de autoconsumo</li>
                            )}
                            {viabilityMetrics.payback <= 8 && (
                              <li>• Payback atrativo</li>
                            )}
                            {viabilityMetrics.tir >= 12 && (
                              <li>• TIR superior à taxa básica de juros</li>
                            )}
                            {projectData.compensacaoEnergia && (
                              <li>• Sistema de compensação ativo</li>
                            )}
                          </ul>
                        </div>
                        
                        <div>
                          <h4 className="font-medium mb-2 flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-orange-600" />
                            Fatores de Risco
                          </h4>
                          <ul className="space-y-1 text-sm text-muted-foreground">
                            {projectData.localizacao.irradiacao < 5 && (
                              <li>• Irradiação solar abaixo da média</li>
                            )}
                            {viabilityMetrics.autoconsumo < 50 && (
                              <li>• Baixo percentual de autoconsumo</li>
                            )}
                            {viabilityMetrics.payback > 10 && (
                              <li>• Payback elevado</li>
                            )}
                            {viabilityMetrics.tir < 10 && (
                              <li>• TIR abaixo do esperado</li>
                            )}
                            {projectData.aumentoAnualTarifa < 5 && (
                              <li>• Baixo reajuste tarifário projetado</li>
                            )}
                          </ul>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <Card>
                <CardContent className="p-8 text-center">
                  <AlertTriangle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">
                    Execute a análise para ver a análise de sensibilidade
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default ProjectViabilityAnalyzer;