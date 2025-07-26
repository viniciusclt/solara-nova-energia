import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Sun, Zap, Database, TrendingUp, AlertTriangle, CheckCircle, Settings, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SolarModule } from "@/types";
import { EquipmentManager } from "./EquipmentManager";
import { PVSolImporter } from "./PVSolImporter";
import { DemoDataService } from "@/services/DemoDataService";

interface SimulationData {
  desvioAzimutal: number;
  inclinacao: number;
  modeloModulo: string;
  potenciaModulo: number;
  quantidadeModulos: number;
  modeloInversor: string;
  potenciaInversor: number;
  quantidadeInversores: number;
  pr: number; // Performance Ratio
  geracaoNecessaria: number;
  tamanhoSistema: number;
  areaUtilizada: number;
  geracaoMediaMensal: number;
  geracaoAnual: number;
  oversize: number;
  hsp: number; // Horas Sol Pico
  irradianciaAnual: number;
  tipoTelhado: string;
  temperaturaMaxima: number;
}

interface TechnicalSimulationProps {
  currentLead: Record<string, unknown> | null;
}

export function TechnicalSimulation({ currentLead }: TechnicalSimulationProps) {
  const { toast } = useToast();
  const [simulationLevel, setSimulationLevel] = useState<"basico" | "preciso">("basico");
  const [showEquipmentManager, setShowEquipmentManager] = useState(false);
  const [equipmentManagerTab, setEquipmentManagerTab] = useState<"modules" | "inverters">("modules");
  const [showPVSolImporter, setShowPVSolImporter] = useState(false);
  const [pvsolData, setPvsolData] = useState<Array<Record<string, unknown>>>([]);
  const [simulation, setSimulation] = useState<SimulationData>({
    desvioAzimutal: 15,
    inclinacao: 15,
    modeloModulo: "ASTRONERGY 600W",
    potenciaModulo: 600,
    quantidadeModulos: 12,
    modeloInversor: "QI-2500-E",
    potenciaInversor: 2500,
    quantidadeInversores: 1,
    pr: 0,
    geracaoNecessaria: 0,
    tamanhoSistema: 0,
    areaUtilizada: 0,
    geracaoMediaMensal: 0,
    geracaoAnual: 0,
    oversize: 0,
    hsp: 5.3,
    irradianciaAnual: 1789.6,
    tipoTelhado: "ceramico",
    temperaturaMaxima: 35
  });

  // Usar dados de demonstração em localhost, senão usar presets padrão
  const demoDataService = DemoDataService.getInstance();
  const shouldUseDemoData = demoDataService.shouldUseDemoData();
  
  const moduloPresets = shouldUseDemoData 
    ? demoDataService.getModules().map(module => ({
        nome: `${module.manufacturer} ${module.model}`,
        potencia: module.power,
        area: module.area
      }))
    : [
        { nome: "ASTRONERGY 600W", potencia: 600, area: 2.7 },
        { nome: "CANADIAN 545W", potencia: 545, area: 2.56 },
        { nome: "JINKO 550W", potencia: 550, area: 2.59 },
        { nome: "TRINA 545W", potencia: 545, area: 2.52 }
      ];

  const inversorPresets = shouldUseDemoData
    ? demoDataService.getInverters().map(inverter => ({
        nome: `${inverter.manufacturer} ${inverter.model}`,
        potencia: inverter.power
      }))
    : [
        { nome: "QI-2500-E", potencia: 2500 },
        { nome: "QI-3000-E", potencia: 3000 },
        { nome: "GROWATT MIN 2500TL-X", potencia: 2500 },
        { nome: "FRONIUS PRIMO 3.0-1", potencia: 3000 }
      ];

  const calcularPerdas = () => {
    const perdas = {
      orientacao: simulation.desvioAzimutal > 30 ? 0.05 : simulation.desvioAzimutal * 0.001,
      inclinacao: Math.abs(simulation.inclinacao - 23) * 0.002,
      sombreamento: 0.03, // 3% padrão
      temperatura: 0.08, // 8% padrão
      mismatch: 0.02, // 2% padrão
      sujidade: 0.02, // 2% padrão
      cabos: 0.015, // 1.5% padrão
      inversor: 0.03, // 3% padrão
      outros: 0.01 // 1% outros
    };

    const perdaTotal = Object.values(perdas).reduce((sum, perda) => sum + perda, 0);
    const pr = (1 - perdaTotal) * 100;
    
    return { perdas, pr };
  };

  const calcularSimulacao = () => {
    const consumoMedio = currentLead?.consumoMedio || 780;
    const incremento = currentLead?.incrementoConsumo || 4.5;
    const consumoComIncremento = consumoMedio * (1 + incremento / 100);
    
    // Cálculo das perdas e PR
    const { perdas, pr } = calcularPerdas();
    
    // Potência do sistema
    const potenciaTotal = simulation.quantidadeModulos * simulation.potenciaModulo;
    
    // Geração estimada
    const geracaoAnual = (potenciaTotal * simulation.hsp * 365 * (pr / 100)) / 1000; // kWh/ano
    const geracaoMensalMedia = geracaoAnual / 12;
    
    // Oversize (considerando múltiplos inversores)
    const potenciaTotalInversores = simulation.potenciaInversor * simulation.quantidadeInversores;
    const oversizeCalc = (potenciaTotal / potenciaTotalInversores) * 100;
    
    // Área utilizada
    const moduloSelecionado = moduloPresets.find(m => m.nome === simulation.modeloModulo);
    const area = simulation.quantidadeModulos * (moduloSelecionado?.area || 2.6);
    
    const novaSimulacao = {
      ...simulation,
      pr: pr,
      geracaoNecessaria: consumoComIncremento * 12, // kWh/ano
      tamanhoSistema: potenciaTotal / 1000, // kWp
      areaUtilizada: area,
      geracaoMediaMensal: geracaoMensalMedia,
      geracaoAnual: geracaoAnual,
      oversize: oversizeCalc
    };
    
    setSimulation(novaSimulacao);
    
    toast({
      title: "Simulação Calculada",
      description: `Sistema de ${(potenciaTotal/1000).toFixed(1)}kWp com PR de ${pr.toFixed(1)}%`
    });
  };

  const isOversizeOptimal = simulation.oversize >= 100 && simulation.oversize <= 138;
  const isGeracaoSuficiente = simulation.geracaoAnual >= simulation.geracaoNecessaria * 0.9;

  const handleOpenEquipmentManager = (tab: "modules" | "inverters") => {
    setEquipmentManagerTab(tab);
    setShowEquipmentManager(true);
  };

  const handleCloseEquipmentManager = () => {
    setShowEquipmentManager(false);
  };

  const handlePVSolDataImported = (data: Array<Record<string, unknown>>) => {
    setPvsolData(data);
    setShowPVSolImporter(false);
    
    // Calcular geração anual a partir dos dados PV*Sol
    const geracaoAnual = data.reduce((sum, month) => sum + month.generation, 0);
    const geracaoMensalMedia = geracaoAnual / 12;
    
    // Atualizar simulação com dados PV*Sol
    setSimulation(prev => ({
      ...prev,
      geracaoAnual,
      geracaoMediaMensal: geracaoMensalMedia
    }));

    toast({
      title: "Dados PV*Sol Importados",
      description: `Simulação atualizada com ${data.length} meses de dados precisos`
    });
  };

  const handleClosePVSolImporter = () => {
    setShowPVSolImporter(false);
  };

  if (showEquipmentManager) {
    return (
      <EquipmentManager 
        onBack={handleCloseEquipmentManager}
        defaultTab={equipmentManagerTab}
      />
    );
  }

  if (showPVSolImporter) {
    return (
      <PVSolImporter 
        onDataImported={handlePVSolDataImported}
        onClose={handleClosePVSolImporter}
      />
    );
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sun className="h-5 w-5 text-primary" />
                Simulação Técnica
              </CardTitle>
              <CardDescription>
                Configure os parâmetros do sistema fotovoltaico
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant={simulationLevel === "basico" ? "default" : "outline"}
                size="sm"
                onClick={() => setSimulationLevel("basico")}
              >
                Nível 1 - Básico
              </Button>
              <Button 
                variant={simulationLevel === "preciso" ? "default" : "outline"}
                size="sm"
                onClick={() => setSimulationLevel("preciso")}
              >
                Nível 2 - Preciso
              </Button>
              {simulationLevel === "preciso" && (
                <Button 
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPVSolImporter(true)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Importar PV*Sol
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Indicadores de Status */}
      {simulation.tamanhoSistema > 0 && (
        <Card className="shadow-card">
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{simulation.tamanhoSistema.toFixed(1)} kWp</div>
                <div className="text-sm text-muted-foreground">Tamanho do Sistema</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">{simulation.pr.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Performance Ratio</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">{simulation.geracaoMediaMensal.toFixed(0)}</div>
                <div className="text-sm text-muted-foreground">kWh/mês gerados</div>
              </div>
              <div className="text-center">
                <div className={`text-2xl font-bold ${isOversizeOptimal ? 'text-success' : 'text-warning'}`}>
                  {simulation.oversize.toFixed(0)}%
                </div>
                <div className="text-sm text-muted-foreground">Oversize</div>
              </div>
            </div>
            
            <div className="mt-4 flex items-center justify-center gap-4">
              <Badge variant={isGeracaoSuficiente ? "default" : "destructive"} className="bg-success/10 text-success border-success/20">
                {isGeracaoSuficiente ? (
                  <><CheckCircle className="h-3 w-3 mr-1" /> Geração Suficiente</>
                ) : (
                  <><AlertTriangle className="h-3 w-3 mr-1" /> Geração Insuficiente</>
                )}
              </Badge>
              <Badge variant={isOversizeOptimal ? "default" : "secondary"} className={isOversizeOptimal ? "bg-success/10 text-success border-success/20" : ""}>
                {isOversizeOptimal ? (
                  <><CheckCircle className="h-3 w-3 mr-1" /> Oversize Ideal</>
                ) : (
                  <><AlertTriangle className="h-3 w-3 mr-1" /> Oversize fora do ideal</>
                )}
              </Badge>
              {pvsolData.length > 0 && (
                <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                  <FileText className="h-3 w-3 mr-1" />
                  Dados PV*Sol ({pvsolData.length} meses)
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="orientacao" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="orientacao">Orientação</TabsTrigger>
          <TabsTrigger value="equipamentos">Equipamentos</TabsTrigger>
          <TabsTrigger value="perdas">Perdas</TabsTrigger>
          <TabsTrigger value="resultados">Resultados</TabsTrigger>
        </TabsList>

        <TabsContent value="orientacao">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Parâmetros de Orientação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="desvioAzimutal">Desvio Azimutal (°)</Label>
                    <Input
                      id="desvioAzimutal"
                      type="number"
                      value={simulation.desvioAzimutal}
                      onChange={(e) => setSimulation(prev => ({ ...prev, desvioAzimutal: Number(e.target.value) }))}
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      0° = Norte, 90° = Leste, -90° = Oeste
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="inclinacao">Inclinação (°)</Label>
                    <Input
                      id="inclinacao"
                      type="number"
                      value={simulation.inclinacao}
                      onChange={(e) => setSimulation(prev => ({ ...prev, inclinacao: Number(e.target.value) }))}
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      Ideal: latitude local (±23°)
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="tipoTelhado">Tipo de Telhado</Label>
                  <Select value={simulation.tipoTelhado} onValueChange={(value) => setSimulation(prev => ({ ...prev, tipoTelhado: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ceramico">Cerâmico</SelectItem>
                      <SelectItem value="fibrocimento">Fibrocimento</SelectItem>
                      <SelectItem value="metalico">Metálico</SelectItem>
                      <SelectItem value="laje">Laje</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Dados Climáticos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="hsp">HSP (h/dia)</Label>
                    <Input
                      id="hsp"
                      type="number"
                      step="0.1"
                      value={simulation.hsp}
                      onChange={(e) => setSimulation(prev => ({ ...prev, hsp: Number(e.target.value) }))}
                    />
                    <div className="text-xs text-muted-foreground mt-1">
                      Horas de Sol Pico (CRESESB)
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="irradianciaAnual">Irradiância (kWh/m²/ano)</Label>
                    <Input
                      id="irradianciaAnual"
                      type="number"
                      step="0.1"
                      value={simulation.irradianciaAnual}
                      onChange={(e) => setSimulation(prev => ({ ...prev, irradianciaAnual: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="temperaturaMaxima">Temperatura Máxima (°C)</Label>
                  <Input
                    id="temperaturaMaxima"
                    type="number"
                    value={simulation.temperaturaMaxima}
                    onChange={(e) => setSimulation(prev => ({ ...prev, temperaturaMaxima: Number(e.target.value) }))}
                  />
                </div>

                <Button variant="secondary" className="w-full">
                  <Database className="h-4 w-4" />
                  Importar dados CRESESB
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="equipamentos">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Módulos Fotovoltaicos</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => handleOpenEquipmentManager("modules")}>
                    <Settings className="h-4 w-4 mr-2" />
                    Gerenciar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="modeloModulo">Modelo do Módulo</Label>
                  <Select value={simulation.modeloModulo} onValueChange={(value) => {
                    const modulo = moduloPresets.find(m => m.nome === value);
                    setSimulation(prev => ({ 
                      ...prev, 
                      modeloModulo: value,
                      potenciaModulo: modulo?.potencia || prev.potenciaModulo
                    }));
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {moduloPresets.map(modulo => (
                        <SelectItem key={modulo.nome} value={modulo.nome}>
                          {modulo.nome} - {modulo.potencia}W
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="potenciaModulo">Potência (W)</Label>
                    <Input
                      id="potenciaModulo"
                      type="number"
                      value={simulation.potenciaModulo}
                      onChange={(e) => setSimulation(prev => ({ ...prev, potenciaModulo: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="quantidadeModulos">Quantidade</Label>
                    <Input
                      id="quantidadeModulos"
                      type="number"
                      value={simulation.quantidadeModulos}
                      onChange={(e) => setSimulation(prev => ({ ...prev, quantidadeModulos: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-sm font-medium">Potência Total do Array</div>
                  <div className="text-xl font-bold text-primary">
                    {((simulation.quantidadeModulos * simulation.potenciaModulo) / 1000).toFixed(2)} kWp
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Inversor</CardTitle>
                  <Button variant="outline" size="sm" onClick={() => handleOpenEquipmentManager("inverters")}>
                    <Settings className="h-4 w-4 mr-2" />
                    Gerenciar
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="modeloInversor">Modelo do Inversor</Label>
                  <Select value={simulation.modeloInversor} onValueChange={(value) => {
                    const inversor = inversorPresets.find(i => i.nome === value);
                    setSimulation(prev => ({ 
                      ...prev, 
                      modeloInversor: value,
                      potenciaInversor: inversor?.potencia || prev.potenciaInversor
                    }));
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {inversorPresets.map(inversor => (
                        <SelectItem key={inversor.nome} value={inversor.nome}>
                          {inversor.nome} - {inversor.potencia}W
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="potenciaInversor">Potência (W)</Label>
                    <Input
                      id="potenciaInversor"
                      type="number"
                      value={simulation.potenciaInversor}
                      onChange={(e) => setSimulation(prev => ({ ...prev, potenciaInversor: Number(e.target.value) }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="quantidadeInversores">Quantidade</Label>
                    <Input
                      id="quantidadeInversores"
                      type="number"
                      min="1"
                      value={simulation.quantidadeInversores}
                      onChange={(e) => setSimulation(prev => ({ ...prev, quantidadeInversores: Number(e.target.value) }))}
                    />
                  </div>
                </div>

                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-sm font-medium">Potência Total dos Inversores</div>
                  <div className="text-xl font-bold text-secondary">
                    {((simulation.quantidadeInversores * simulation.potenciaInversor) / 1000).toFixed(2)} kWp
                  </div>
                </div>

                <div className="bg-muted/50 p-3 rounded-lg">
                  <div className="text-sm font-medium">Oversize Calculado</div>
                  <div className={`text-xl font-bold ${
                    simulation.oversize >= 100 && simulation.oversize <= 138 ? 'text-success' : 'text-warning'
                  }`}>
                    {((simulation.quantidadeModulos * simulation.potenciaModulo) / (simulation.potenciaInversor * simulation.quantidadeInversores) * 100).toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Ideal: 100% - 138%
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="perdas">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Análise de Perdas</CardTitle>
              <CardDescription>
                Fatores que afetam o Performance Ratio (PR) do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(calcularPerdas().perdas).map(([tipo, valor]) => (
                  <div key={tipo} className="bg-muted/50 p-3 rounded-lg">
                    <div className="text-sm font-medium capitalize">{tipo.replace(/([A-Z])/g, ' $1')}</div>
                    <div className="text-lg font-bold text-destructive">-{(valor * 100).toFixed(1)}%</div>
                    <Progress value={valor * 100} className="mt-2" />
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              <div className="text-center">
                <div className="text-sm text-muted-foreground">Performance Ratio Final</div>
                <div className="text-4xl font-bold text-primary">{calcularPerdas().pr.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground mt-1">
                  {calcularPerdas().pr > 75 ? "Excelente" : calcularPerdas().pr > 70 ? "Bom" : "Necessita otimização"}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="resultados">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Resultados da Simulação</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gradient-card p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">Geração Anual</div>
                    <div className="text-xl font-bold text-primary">{simulation.geracaoAnual.toFixed(0)} kWh</div>
                  </div>
                  <div className="bg-gradient-card p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">Geração Mensal</div>
                    <div className="text-xl font-bold text-secondary">{simulation.geracaoMediaMensal.toFixed(0)} kWh</div>
                  </div>
                  <div className="bg-gradient-card p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">Área Utilizada</div>
                    <div className="text-xl font-bold text-accent">{simulation.areaUtilizada.toFixed(1)} m²</div>
                  </div>
                  <div className="bg-gradient-card p-3 rounded-lg">
                    <div className="text-sm text-muted-foreground">Potência Instalada</div>
                    <div className="text-xl font-bold text-success">{simulation.tamanhoSistema.toFixed(1)} kWp</div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span>Consumo Atual (kWh/ano):</span>
                    <span className="font-medium">{((currentLead?.consumoMedio || 0) * 12).toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Geração Estimada (kWh/ano):</span>
                    <span className="font-medium text-primary">{simulation.geracaoAnual.toFixed(0)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Cobertura do Consumo:</span>
                    <span className={`font-medium ${
                      isGeracaoSuficiente ? 'text-success' : 'text-warning'
                    }`}>
                      {currentLead ? ((simulation.geracaoAnual / ((currentLead.consumoMedio || 1) * 12)) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Validações do Sistema</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className={`flex items-center gap-2 p-3 rounded-lg ${
                  isGeracaoSuficiente ? 'bg-success/10 border border-success/20' : 'bg-warning/10 border border-warning/20'
                }`}>
                  {isGeracaoSuficiente ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-warning" />
                  )}
                  <div>
                    <div className="font-medium">Geração vs Consumo</div>
                    <div className="text-sm text-muted-foreground">
                      {isGeracaoSuficiente ? 
                        "Sistema gera energia suficiente para cobrir o consumo" :
                        "Geração insuficiente. Considere aumentar o sistema"
                      }
                    </div>
                  </div>
                </div>

                <div className={`flex items-center gap-2 p-3 rounded-lg ${
                  isOversizeOptimal ? 'bg-success/10 border border-success/20' : 'bg-warning/10 border border-warning/20'
                }`}>
                  {isOversizeOptimal ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-warning" />
                  )}
                  <div>
                    <div className="font-medium">Oversize do Sistema</div>
                    <div className="text-sm text-muted-foreground">
                      {isOversizeOptimal ? 
                        "Oversize dentro da faixa ideal (100-138%)" :
                        "Oversize fora da faixa ideal. Ajuste os equipamentos"
                      }
                    </div>
                  </div>
                </div>

                <div className={`flex items-center gap-2 p-3 rounded-lg ${
                  simulation.pr > 75 ? 'bg-success/10 border border-success/20' : 'bg-warning/10 border border-warning/20'
                }`}>
                  {simulation.pr > 75 ? (
                    <CheckCircle className="h-5 w-5 text-success" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-warning" />
                  )}
                  <div>
                    <div className="font-medium">Performance Ratio</div>
                    <div className="text-sm text-muted-foreground">
                      {simulation.pr > 75 ? 
                        "PR excelente, sistema bem otimizado" :
                        "PR baixo, revise orientação e perdas"
                      }
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-center">
        <Button onClick={calcularSimulacao} size="lg" className="shadow-solar">
          <TrendingUp className="h-4 w-4" />
          Calcular Simulação
        </Button>
      </div>
    </div>
  );
}