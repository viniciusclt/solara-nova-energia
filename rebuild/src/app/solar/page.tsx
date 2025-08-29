"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Sun, Users, Settings, CheckCircle, AlertTriangle, Zap, TrendingUp, Target, DollarSign, PiggyBank, FileText, AlertCircle, Calculator, BarChart3, Wrench, CheckSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import EquipmentConsumption from "./components/EquipmentConsumption";
import LeadSelector from "./components/LeadSelector";
import { simulate as runSimulation } from "@/core/services/CalculationService";
import type { SimulationInput } from "@/core/types/solar";

interface SimulationResult {
  potenciaRecomendadaKwp: number;
  energiaGeradaMensalKWh: number;
  compensacaoPercent: number;
  economiaMensalReais: string;
  economiaAnualReais: string;
  detalhes?: {
    oversizePercent?: number;
    fioBPercentYear1?: number;
    notas?: string[];
  };
}

const steps = [
  { id: "lead", title: "Lead", icon: Users },
  { id: "simulation", title: "Simulação", icon: Calculator },
  { id: "proposals", title: "Propostas", icon: BarChart3 },
  { id: "finalization", title: "Finalização", icon: CheckSquare },
];

function Page() {
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadType, setLeadType] = useState("residencial");
  const [simulationLevel, setSimulationLevel] = useState('basico');
  const [showPvsolImport, setShowPvsolImport] = useState(false);
  const [consumo, setConsumo] = useState("");
  const [pr, setPr] = useState("0.75");
  const [perdas, setPerdas] = useState("15");
  const [metaCompensacao, setMetaCompensacao] = useState("95");
  const [enableExtraConsumption, setEnableExtraConsumption] = useState(false);
  const [extraConsumptionKWhMonth, setExtraConsumptionKWhMonth] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [saving, setSaving] = useState(false);
  const [showProposalPreview, setShowProposalPreview] = useState(false);
  const [showLeadSelector, setShowLeadSelector] = useState(false);

  const handlePreviewToggle = useCallback(() => {
    if (!result) {
      setError("Preencha e simule antes de pré-visualizar a proposta.");
      return;
    }
    setShowProposalPreview((v) => !v);
  }, [result]);

  const handleExportPdf = useCallback(() => {
    if (!result) {
      setError("Preencha e simule antes de exportar a proposta.");
      return;
    }
    setShowProposalPreview(true);
    setTimeout(() => {
      try { window.print(); } catch {}
    }, 100);
  }, [result]);

  useEffect(() => {
    const onAfterPrint = () => setShowProposalPreview(false);
    if (typeof window !== 'undefined') {
      window.addEventListener('afterprint', onAfterPrint);
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('afterprint', onAfterPrint);
      }
    };
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const cardBase = "rounded-lg border bg-background p-4 shadow-sm";
  const inputBase = "rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent))] disabled:opacity-50";

  const getStepStatus = (stepIndex: number) => {
    if (stepIndex < currentStep) return "completed";
    if (stepIndex === currentStep) return "current";
    return "pending";
  };

  const handleStepChange = (stepIndex: number) => {
    setCurrentStep(stepIndex);
  };

  const handleStepComplete = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSimulate = async () => {
    if (!consumo) {
      setError("Preencha o consumo mensal");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const consumoNum = Number(consumo.replace(",", "."));
      const prNum = Number(pr);
      const perdasNum = Number(perdas);
      const metaNum = Number(metaCompensacao);
      const extraConsumo = enableExtraConsumption ? extraConsumptionKWhMonth : 0;

      const input: SimulationInput = {
        consumption: {
          averageMonthly_kWh: consumoNum,
        },
        consumptionDeltas: extraConsumo > 0 ? [{ label: "Novas cargas", estimated_kWh_per_month: extraConsumo }] : undefined,
        technical: {
          performanceRatio_pct: prNum,
          lossesEnvironmental_pct: 0,
          lossesTechnical_pct: perdasNum,
          targetCompensation_pct: metaNum,
        },
      };

      const sim = runSimulation(input);

      const monthlyConsumptionTotal = consumoNum + extraConsumo;
      const annualConsumptionTotal = monthlyConsumptionTotal * 12;
      const oversize = annualConsumptionTotal > 0
        ? Math.max(0, ((sim.annualGeneration_kWh - annualConsumptionTotal) / annualConsumptionTotal) * 100)
        : 0;

      const simulationResult: SimulationResult = {
        potenciaRecomendadaKwp: sim.recommendedPower_kWp,
        energiaGeradaMensalKWh: Math.round(sim.annualGeneration_kWh / 12),
        compensacaoPercent: sim.compensation_pct,
        economiaMensalReais: sim.estimatedSavings_monthly_BRL.toFixed(2),
        economiaAnualReais: sim.estimatedSavings_annual_BRL.toFixed(2),
        detalhes: {
          oversizePercent: Number(oversize.toFixed(1)),
          fioBPercentYear1: 15,
          notas: [
            ...(sim.electrical?.notes ?? []),
            "Cálculo realizado pelo CalculationService v1 (modelo simplificado).",
          ],
        },
      };

      setResult(simulationResult);
    } catch (err) {
      setError("Erro na simulação. Verifique os dados inseridos.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinalize = async () => {
    setSaving(true);
    // Simular salvamento
    await new Promise(resolve => setTimeout(resolve, 2000));
    setSaving(false);
    alert("Proposta finalizada com sucesso!");
  };

  const baseConsumoNum = useMemo(
    () => (consumo?.replace?.(",", ".") ? Number(consumo.replace(",", ".")) : 0),
    [consumo]
  );

  const aumentoPercent = useMemo(
    () => (baseConsumoNum > 0 ? (extraConsumptionKWhMonth / baseConsumoNum) * 100 : null),
    [baseConsumoNum, extraConsumptionKWhMonth]
  );

  const monthlyConsumptionTotal = useMemo(
    () => baseConsumoNum + (enableExtraConsumption ? extraConsumptionKWhMonth : 0),
    [baseConsumoNum, enableExtraConsumption, extraConsumptionKWhMonth]
  );

  const annualConsumptionTotal = useMemo(
    () => monthlyConsumptionTotal * 12,
    [monthlyConsumptionTotal]
  );

  const computedOversize = useMemo(() => {
    if (!result) return null;
    const annualGen = (result.energiaGeradaMensalKWh || 0) * 12;
    if (annualConsumptionTotal <= 0) return 0;
    return Math.max(0, ((annualGen - annualConsumptionTotal) / annualConsumptionTotal) * 100);
  }, [result, annualConsumptionTotal]);

  return (
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <div className="size-8 rounded-md bg-[radial-gradient(circle_at_30%_30%,hsl(var(--accent)),hsl(var(--primary)))] shadow-[var(--shadow-solar)] grid place-items-center text-background">
          <Sun className="size-5" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Módulo Fotovoltaico</h1>
          <p className="text-sm text-sidebar-fg/80">Experiência inspirada no projeto anterior. Simule rapidamente seu sistema solar.</p>
        </div>
      </div>

      {/* Stepper Top */}
      <nav aria-label="Etapas" className={`rounded-lg border bg-background p-4 shadow-sm ${mounted ? "opacity-100" : "opacity-0"} transition-opacity`}>
        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {steps.map((s, index) => {
            const status = getStepStatus(index);
            const Icon = s.icon;
            const base = "flex items-center gap-3 rounded-lg border p-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent))] transition-all duration-200";
            const cls = status === "completed"
              ? "bg-gradient-to-r from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/10 border-green-200 dark:border-green-800 text-green-700 dark:text-green-200 hover:shadow-md"
              : status === "current"
              ? "bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/10 border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-200 shadow-md"
              : "bg-background text-sidebar-fg/80 hover:bg-sidebar-accent/40 hover:shadow-sm";
            return (
              <li key={s.id}>
                <button
                  type="button"
                  aria-current={status === "current" ? "step" : undefined}
                  className={`${base} ${cls} w-full text-left disabled:opacity-60`}
                  onClick={() => handleStepChange(index)}
                >
                  <div className={`p-1.5 rounded-md ${status === "completed" ? "bg-green-200 dark:bg-green-800" : status === "current" ? "bg-blue-200 dark:bg-blue-800" : "bg-sidebar-accent/20"}`}>
                    <span className={`inline-grid size-5 place-items-center rounded-full text-xs font-medium ${status === "completed" ? "bg-green-600 text-white" : status === "current" ? "text-white bg-[radial-gradient(circle_at_30%_30%,hsl(var(--accent)),hsl(var(--primary)))]" : "bg-muted text-foreground"}`}>
                      {status === "completed" ? <CheckCircle className="size-3" /> : index + 1}
                    </span>
                  </div>
                  <div className="flex flex-col items-start min-w-0">
                    <div className="flex items-center gap-2">
                      <Icon className="size-4 flex-shrink-0" />
                      <span className="truncate font-medium">{s.title}</span>
                    </div>
                    {status === "completed" && (
                      <span className="text-xs text-green-600 dark:text-green-400">Concluída</span>
                    )}
                    {status === "current" && (
                      <span className="text-xs text-blue-600 dark:text-blue-400">Em andamento</span>
                    )}
                  </div>
                  {status === "completed" && (
                    <CheckCircle className="size-4 text-green-600 dark:text-green-400 ml-auto flex-shrink-0" />
                  )}
                </button>
              </li>
            );
          })}
        </ol>
        <div className="mt-3 flex items-center justify-between">
          <div className="text-xs text-sidebar-fg/70">Etapa {currentStep + 1} de {steps.length}</div>
          <div className="flex items-center gap-1">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-1.5 w-6 rounded-full transition-colors ${
                  getStepStatus(index) === "completed"
                    ? "bg-green-500"
                    : getStepStatus(index) === "current"
                    ? "bg-blue-500"
                    : "bg-sidebar-accent/30"
                }`}
              />
            ))}
          </div>
        </div>
      </nav>

      {/* Conteúdo da etapa atual */}
      {currentStep === 0 && (
        <div className={cardBase}>
          <div className="mb-3">
            <h2 className="text-sm font-semibold">Dados do Lead</h2>
            <p className="text-xs text-sidebar-fg/70">Preencha dados básicos do lead (opcional). Você pode prosseguir sem preencher.</p>
          </div>
          <div className="flex justify-end mb-3">
            <button
              type="button"
              onClick={() => setShowLeadSelector(true)}
              className="rounded-md border px-3 py-1.5 text-xs font-medium hover:bg-sidebar-accent/10"
            >
              Selecionar lead existente
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1 md:col-span-2">
              <label htmlFor="leadName" className="text-sm font-medium">Nome</label>
              <input id="leadName" className={inputBase} placeholder="Ex.: Ana Souza" value={leadName} onChange={(e) => setLeadName(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="leadEmail" className="text-sm font-medium">Email</label>
              <input id="leadEmail" type="email" className={inputBase} placeholder="ana@email.com" value={leadEmail} onChange={(e) => setLeadEmail(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="leadPhone" className="text-sm font-medium">Telefone</label>
              <input id="leadPhone" className={inputBase} placeholder="(11) 99999-9999" value={leadPhone} onChange={(e) => setLeadPhone(e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label htmlFor="leadType" className="text-sm font-medium">Tipo de cliente</label>
              <select id="leadType" className={inputBase} value={leadType} onChange={(e) => setLeadType(e.target.value)}>
                <option value="residencial">Residencial</option>
                <option value="comercial">Comercial</option>
              </select>
            </div>
          </div>
          <div className="flex justify-between mt-4">
            <button onClick={() => { setLeadName(""); setLeadEmail(""); setLeadPhone(""); setLeadType("residencial"); }} className="rounded-lg border px-4 py-2 bg-background hover:bg-sidebar-accent/10 transition-all duration-200 hover:shadow-sm">Limpar</button>
            <button onClick={handleStepComplete} className="rounded-lg border px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2">
              <Users className="size-4" />
              Próxima
            </button>
          </div>
        </div>
      )}

      {currentStep === 1 && (
        <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Coluna esquerda: Simulação Técnica */}
          <div className="md:col-span-2 space-y-4">
            {/* Card Principal: Simulação Técnica */}
            <div className={`${cardBase} shadow-card`}>
              {/* Header com botões de nível de simulação */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-md bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                    <Settings className="size-4" />
                  </div>
                  <h2 className="text-lg font-semibold">Simulação Técnica</h2>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSimulationLevel('basico')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                      simulationLevel === 'basico'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm'
                        : 'bg-background border hover:bg-sidebar-accent/10'
                    }`}
                  >
                    Básico
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimulationLevel('preciso')}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                      simulationLevel === 'preciso'
                        ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm'
                        : 'bg-background border hover:bg-sidebar-accent/10'
                    }`}
                  >
                    Preciso
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPvsolImport(!showPvsolImport)}
                    className="px-3 py-1.5 rounded-md text-xs font-medium bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-sm flex items-center gap-1"
                  >
                    <FileText className="size-3" />
                    Importar PV*Sol
                  </button>
                </div>
              </div>

              {/* Tabs de Simulação */}
              <Tabs defaultValue="orientacao" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="orientacao">Orientação</TabsTrigger>
                  <TabsTrigger value="equipamentos">Equipamentos</TabsTrigger>
                  <TabsTrigger value="perdas">Perdas</TabsTrigger>
                  <TabsTrigger value="resultados">Resultados</TabsTrigger>
                </TabsList>

                <TabsContent value="orientacao" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className={cardBase}>
                      <h3 className="text-sm font-semibold mb-3">Parâmetros de Orientação</h3>
                      <div className="space-y-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-sm font-medium">Azimute (°)</label>
                          <input className={inputBase} placeholder="180" defaultValue="180" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-sm font-medium">Inclinação (°)</label>
                          <input className={inputBase} placeholder="23" defaultValue="23" />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-sm font-medium">Sombreamento (%)</label>
                          <input className={inputBase} placeholder="0" defaultValue="0" />
                        </div>
                      </div>
                    </div>
                    <div className={cardBase}>
                      <h3 className="text-sm font-semibold mb-3">Dados Climáticos</h3>
                      <div className="space-y-3">
                        <div className="flex flex-col gap-1">
                          <label className="text-sm font-medium">Irradiação Média (kWh/m²/dia)</label>
                          <input className={inputBase} placeholder="4.5" defaultValue="4.5" readOnly />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-sm font-medium">Temperatura Ambiente (°C)</label>
                          <input className={inputBase} placeholder="25" defaultValue="25" readOnly />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-sm font-medium">Localização</label>
                          <input className={inputBase} placeholder="São Paulo, SP" defaultValue="São Paulo, SP" readOnly />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="equipamentos" className="space-y-4">
                  {/* Tabs aninhadas para equipamentos */}
                  <Tabs defaultValue="modulos" className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                      <TabsTrigger value="modulos">Módulos Solares</TabsTrigger>
                      <TabsTrigger value="inversores">Inversores</TabsTrigger>
                      <TabsTrigger value="baterias">Baterias</TabsTrigger>
                    </TabsList>

                    <TabsContent value="modulos" className="space-y-4">
                      <div className={cardBase}>
                        <h3 className="text-sm font-semibold mb-3">Configuração dos Módulos Solares</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <div className="flex flex-col gap-1">
                              <label className="text-sm font-medium">Fabricante</label>
                              <select className={inputBase}>
                                <option value="">Selecione o fabricante</option>
                                <option value="canadian">Canadian Solar</option>
                                <option value="jinko">Jinko Solar</option>
                                <option value="trina">Trina Solar</option>
                                <option value="ja">JA Solar</option>
                              </select>
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-sm font-medium">Modelo</label>
                              <select className={inputBase}>
                                <option value="">Selecione o modelo</option>
                                <option value="cs3w-400p">CS3W-400P</option>
                                <option value="cs3w-450p">CS3W-450P</option>
                                <option value="cs3w-500p">CS3W-500P</option>
                              </select>
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-sm font-medium">Potência Unitária (Wp)</label>
                              <input className={inputBase} placeholder="450" defaultValue="450" />
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex flex-col gap-1">
                              <label className="text-sm font-medium">Quantidade de Módulos</label>
                              <input className={inputBase} placeholder="12" defaultValue="12" />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-sm font-medium">Eficiência (%)</label>
                              <input className={inputBase} placeholder="21.2" defaultValue="21.2" readOnly />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-sm font-medium">Potência Total (kWp)</label>
                              <input className={inputBase} placeholder="5.4" defaultValue="5.4" readOnly />
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                            <CheckCircle className="size-4" />
                            <span>Configuração validada: 12 módulos de 450Wp = 5.4kWp</span>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="inversores" className="space-y-4">
                      <div className={cardBase}>
                        <h3 className="text-sm font-semibold mb-3">Configuração dos Inversores</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <div className="flex flex-col gap-1">
                              <label className="text-sm font-medium">Fabricante</label>
                              <select className={inputBase}>
                                <option value="">Selecione o fabricante</option>
                                <option value="fronius">Fronius</option>
                                <option value="sma">SMA</option>
                                <option value="abb">ABB</option>
                                <option value="growatt">Growatt</option>
                              </select>
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-sm font-medium">Modelo</label>
                              <select className={inputBase}>
                                <option value="">Selecione o modelo</option>
                                <option value="primo-5.0-1">Primo 5.0-1</option>
                                <option value="primo-6.0-1">Primo 6.0-1</option>
                                <option value="primo-8.2-1">Primo 8.2-1</option>
                              </select>
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-sm font-medium">Potência CA (kW)</label>
                              <input className={inputBase} placeholder="5.0" defaultValue="5.0" />
                            </div>
                          </div>
                          <div className="space-y-3">
                            <div className="flex flex-col gap-1">
                              <label className="text-sm font-medium">Potência CC Máx (kW)</label>
                              <input className={inputBase} placeholder="7.5" defaultValue="7.5" readOnly />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-sm font-medium">Eficiência (%)</label>
                              <input className={inputBase} placeholder="97.1" defaultValue="97.1" readOnly />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label className="text-sm font-medium">Quantidade</label>
                              <input className={inputBase} placeholder="1" defaultValue="1" />
                            </div>
                          </div>
                        </div>
                        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                            <CheckCircle className="size-4" />
                            <span>Dimensionamento adequado: Oversize de 1.08 (ideal entre 1.0 - 1.3)</span>
                          </div>
                        </div>
                      </div>
                    </TabsContent>

                    <TabsContent value="baterias" className="space-y-4">
                      <div className={cardBase}>
                        <h3 className="text-sm font-semibold mb-3">Sistema de Armazenamento (Opcional)</h3>
                        <div className="space-y-4">
                          <div className="flex items-center gap-2">
                            <input type="checkbox" id="enableBattery" className="rounded" />
                            <label htmlFor="enableBattery" className="text-sm font-medium">Incluir sistema de baterias</label>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 opacity-50">
                            <div className="space-y-3">
                              <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium">Tecnologia</label>
                                <select className={inputBase} disabled>
                                  <option value="">Selecione a tecnologia</option>
                                  <option value="lithium">Lítio (LiFePO4)</option>
                                  <option value="lead-acid">Chumbo-ácido</option>
                                  <option value="gel">Gel</option>
                                </select>
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium">Capacidade (kWh)</label>
                                <input className={inputBase} placeholder="10" disabled />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium">Tensão (V)</label>
                                <input className={inputBase} placeholder="48" disabled />
                              </div>
                            </div>
                            <div className="space-y-3">
                              <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium">Profundidade de Descarga (%)</label>
                                <input className={inputBase} placeholder="80" disabled />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium">Ciclos de Vida</label>
                                <input className={inputBase} placeholder="6000" disabled readOnly />
                              </div>
                              <div className="flex flex-col gap-1">
                                <label className="text-sm font-medium">Autonomia (horas)</label>
                                <input className={inputBase} placeholder="8" disabled readOnly />
                              </div>
                            </div>
                          </div>
                          
                          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                            <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
                              <AlertTriangle className="size-4" />
                              <span>Sistema de baterias aumentará significativamente o investimento inicial</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Consumo de equipamentos extras */}
                      <div className={cardBase}>
                        <h3 className="text-sm font-semibold mb-3">Consumo de Equipamentos Extras</h3>
                        <EquipmentConsumption />
                      </div>
                    </TabsContent>
                  </Tabs>
                </TabsContent>

                <TabsContent value="perdas" className="space-y-4">
                  {/* Resumo das Perdas */}
                  <div className={cardBase}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold">Análise Detalhada de Perdas</h3>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-sidebar-fg/70">Perdas Totais:</span>
                        <span className="text-sm font-bold text-red-600">{perdas}%</span>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium">Perdas Totais Estimadas (%)</label>
                        <input className={inputBase} placeholder="15" value={perdas} onChange={(e) => setPerdas(e.target.value)} />
                      </div>
                      <div className="flex flex-col gap-1">
                        <label className="text-sm font-medium">Performance Ratio Resultante</label>
                        <input className={inputBase} placeholder="0.85" value={(1 - Number(perdas || 0) / 100).toFixed(2)} readOnly />
                      </div>
                    </div>

                    {/* Indicador visual das perdas totais */}
                    <div className="p-3 rounded-lg border">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm font-medium">Impacto Total das Perdas</span>
                        <span className="text-sm font-bold">{perdas}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-red-500 to-red-600 h-3 rounded-full transition-all duration-500" 
                          style={{width: `${Math.min(Number(perdas || 0), 100)}%`}}
                        ></div>
                        <div className="absolute inset-0 flex items-center justify-center text-xs font-medium text-white">
                          {Number(perdas || 0) > 0 && `${perdas}% de perdas`}
                        </div>
                      </div>
                      <div className="flex justify-between text-xs text-sidebar-fg/70 mt-1">
                        <span>Excelente (≤10%)</span>
                        <span>Bom (≤15%)</span>
                        <span>Aceitável (≤20%)</span>
                        <span>Alto (&gt;20%)</span>
                      </div>
                    </div>
                  </div>

                  {/* Detalhamento por Categoria */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Perdas Ambientais */}
                    <div className={cardBase}>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-500"></div>
                        Perdas Ambientais
                      </h4>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Sombreamento</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">2.0%</span>
                              <AlertTriangle className="size-3 text-red-500" />
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-red-500 h-2 rounded-full transition-all duration-300" style={{width: '20%'}}></div>
                          </div>
                          <p className="text-xs text-sidebar-fg/70">Sombras de objetos próximos, árvores ou construções</p>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Temperatura</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">4.5%</span>
                              <AlertTriangle className="size-3 text-orange-500" />
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-orange-500 h-2 rounded-full transition-all duration-300" style={{width: '45%'}}></div>
                          </div>
                          <p className="text-xs text-sidebar-fg/70">Redução de eficiência com aumento da temperatura</p>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Sujeira/Poeira</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">1.5%</span>
                              <CheckCircle className="size-3 text-green-500" />
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-yellow-500 h-2 rounded-full transition-all duration-300" style={{width: '15%'}}></div>
                          </div>
                          <p className="text-xs text-sidebar-fg/70">Acúmulo de sujeira na superfície dos módulos</p>
                        </div>
                      </div>
                    </div>

                    {/* Perdas Técnicas */}
                    <div className={cardBase}>
                      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        Perdas Técnicas
                      </h4>
                      <div className="space-y-3">
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Cabeamento CC</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">1.5%</span>
                              <CheckCircle className="size-3 text-green-500" />
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{width: '15%'}}></div>
                          </div>
                          <p className="text-xs text-sidebar-fg/70">Perdas resistivas nos cabos de corrente contínua</p>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Inversor</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">3.0%</span>
                              <CheckCircle className="size-3 text-green-500" />
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-purple-500 h-2 rounded-full transition-all duration-300" style={{width: '30%'}}></div>
                          </div>
                          <p className="text-xs text-sidebar-fg/70">Eficiência de conversão CC/CA do inversor</p>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Cabeamento CA</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">1.0%</span>
                              <CheckCircle className="size-3 text-green-500" />
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-indigo-500 h-2 rounded-full transition-all duration-300" style={{width: '10%'}}></div>
                          </div>
                          <p className="text-xs text-sidebar-fg/70">Perdas resistivas nos cabos de corrente alternada</p>
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <span className="text-sm">Mismatch</span>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium">1.5%</span>
                              <CheckCircle className="size-3 text-green-500" />
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-pink-500 h-2 rounded-full transition-all duration-300" style={{width: '15%'}}></div>
                          </div>
                          <p className="text-xs text-sidebar-fg/70">Diferenças entre módulos e strings</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Recomendações */}
                  <div className={cardBase}>
                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Wrench className="size-4 text-blue-600" />
                      Recomendações para Otimização
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-green-700">
                          <CheckSquare className="size-4" />
                          Boas Práticas Implementadas
                        </div>
                        <ul className="text-xs text-sidebar-fg/70 space-y-1 ml-6">
                          <li>• Dimensionamento adequado do cabeamento</li>
                          <li>• Inversor de alta eficiência selecionado</li>
                          <li>• Módulos de mesma especificação</li>
                        </ul>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-sm font-medium text-amber-700">
                          <AlertTriangle className="size-4" />
                          Pontos de Atenção
                        </div>
                        <ul className="text-xs text-sidebar-fg/70 space-y-1 ml-6">
                          <li>• Verificar sombreamentos no local</li>
                          <li>• Planejar limpeza periódica dos módulos</li>
                          <li>• Considerar ventilação adequada</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="resultados" className="space-y-4">
                  {/* Parâmetros de Simulação */}
                  <div className={cardBase}>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <Calculator className="size-4 text-blue-600" />
                      Parâmetros de Simulação
                    </h3>
                    <form onSubmit={(e) => { e.preventDefault(); handleSimulate(); }} className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="flex flex-col gap-1">
                          <label htmlFor="consumo" className="text-sm font-medium">Consumo mensal (kWh)</label>
                          <input id="consumo" className={inputBase} placeholder="500" value={consumo} onChange={(e) => setConsumo(e.target.value)} required />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label htmlFor="pr" className="text-sm font-medium">Performance Ratio</label>
                          <input id="pr" className={inputBase} placeholder="0.75" value={pr} onChange={(e) => setPr(e.target.value)} />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label htmlFor="metaCompensacao" className="text-sm font-medium">Meta de Compensação (%)</label>
                          <input id="metaCompensacao" className={inputBase} placeholder="95" value={metaCompensacao} onChange={(e) => setMetaCompensacao(e.target.value)} />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <input type="checkbox" id="enableExtra" checked={enableExtraConsumption} onChange={(e) => setEnableExtraConsumption(e.target.checked)} className="rounded" />
                          <label htmlFor="enableExtra" className="text-sm font-medium">Habilitar consumo extra</label>
                        </div>
                        {enableExtraConsumption && (
                          <div className="flex flex-col gap-1">
                            <label htmlFor="extraConsumption" className="text-sm font-medium">Consumo extra mensal (kWh)</label>
                            <input id="extraConsumption" type="number" className={inputBase} placeholder="100" value={extraConsumptionKWhMonth} onChange={(e) => setExtraConsumptionKWhMonth(Number(e.target.value))} />
                            {aumentoPercent && (
                              <p className="text-xs text-sidebar-fg/70">Aumento de {aumentoPercent.toFixed(1)}% no consumo base</p>
                            )}
                          </div>
                        )}
                      </div>

                      <div className="flex justify-between">
                        <button type="button" onClick={() => { setConsumo(""); setPr("0.75"); setPerdas("15"); setMetaCompensacao("95"); setResult(null); setError(""); }} className="rounded-lg border px-4 py-2 bg-background hover:bg-sidebar-accent/10 transition-all duration-200 hover:shadow-sm">Limpar</button>
                        <button type="submit" disabled={loading} className="rounded-lg border px-4 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2 disabled:opacity-60">
                          {loading ? (
                            <div className="size-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <Calculator className="size-4" />
                          )}
                          {loading ? "Simulando..." : "Simular"}
                        </button>
                      </div>

                      {error && (
                        <div className="mt-3 text-xs text-red-600 flex items-center gap-1"><AlertCircle className="size-3" />{error}</div>
                      )}
                    </form>
                  </div>

                  {/* Resultados Detalhados */}
                  {result && (
                    <div className="space-y-4">
                      {/* Resumo dos Resultados */}
                      <div className={cardBase}>
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <BarChart3 className="size-4 text-green-600" />
                          Resumo dos Resultados
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                          <div className="rounded-lg border bg-background p-3">
                            <div className="text-xs text-sidebar-fg/70">Potência Recomendada</div>
                            <div className="text-xl font-semibold">{result.potenciaRecomendadaKwp.toFixed(1)} kWp</div>
                          </div>
                          <div className="rounded-lg border bg-background p-3">
                            <div className="text-xs text-sidebar-fg/70">Geração Mensal</div>
                            <div className="text-xl font-semibold">{Math.round(result.energiaGeradaMensalKWh).toLocaleString()} kWh</div>
                          </div>
                          <div className="rounded-lg border bg-background p-3">
                            <div className="text-xs text-sidebar-fg/70">Compensação</div>
                            <div className="text-xl font-semibold">{Number(result.compensacaoPercent).toFixed(0)}%</div>
                          </div>
                          <div className="rounded-lg border bg-background p-3">
                            <div className="text-xs text-sidebar-fg/70">Oversize (estimado)</div>
                            <div className="text-xl font-semibold">{computedOversize !== null ? `${computedOversize.toFixed(1)}%` : "—"}</div>
                          </div>
                        </div>
                      </div>

                      {/* Geração x Consumo Mensal */}
                      <div className={cardBase}>
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <TrendingUp className="size-4 text-orange-600" />
                          Geração x Consumo Mensal
                        </h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-4 text-xs text-sidebar-fg/70">
                            <div className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-green-500" aria-hidden /> Geração</div>
                            <div className="flex items-center gap-1"><span className="inline-block h-2 w-2 rounded-full bg-blue-500" aria-hidden /> Consumo</div>
                          </div>
                          <div className="grid grid-cols-12 gap-2 items-end" aria-label="Comparação mensal de geração e consumo" role="img">
                            {Array.from({ length: 12 }).map((_, idx) => {
                              const gen = result.energiaGeradaMensalKWh;
                              const cons = monthlyConsumptionTotal;
                              const max = Math.max(gen, cons, 1);
                              const genH = (gen / max) * 100;
                              const consH = (cons / max) * 100;
                              return (
                                <div key={idx} className="flex flex-col items-center gap-1">
                                  <div className="flex items-end gap-1 h-36 w-full">
                                    <div className="w-1/2 bg-green-500/80 rounded-sm" style={{ height: `${genH}%` }} title={`Geração: ${Math.round(gen)} kWh`} aria-label={`Mês ${idx + 1} geração ${Math.round(gen)} kWh`} />
                                    <div className="w-1/2 bg-blue-500/80 rounded-sm" style={{ height: `${consH}%` }} title={`Consumo: ${Math.round(cons)} kWh`} aria-label={`Mês ${idx + 1} consumo ${Math.round(cons)} kWh`} />
                                  </div>
                                  <span className="text-[10px] text-sidebar-fg/60">{idx + 1}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>

                      {/* Análise de Viabilidade */}
                      <div className={cardBase}>
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <BarChart3 className="size-4 text-green-600" />
                          Análise de Viabilidade
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Payback Estimado</span>
                              <span className="text-sm font-bold text-green-600">4.2 anos</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-green-500 h-2 rounded-full" style={{width: '42%'}}></div>
                            </div>
                            <p className="text-xs text-sidebar-fg/70">Retorno do investimento em 4.2 anos</p>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">TIR (Taxa Interna de Retorno)</span>
                              <span className="text-sm font-bold text-blue-600">18.5%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-blue-500 h-2 rounded-full" style={{width: '74%'}}></div>
                            </div>
                            <p className="text-xs text-sidebar-fg/70">Rentabilidade anual do investimento</p>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">VPL (25 anos)</span>
                              <span className="text-sm font-bold text-purple-600">R$ 89.450</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div className="bg-purple-500 h-2 rounded-full" style={{width: '85%'}}></div>
                            </div>
                            <p className="text-xs text-sidebar-fg/70">Valor presente líquido em 25 anos</p>
                          </div>
                        </div>
                      </div>

                      {/* Projeção de Performance */}
                      <div className={cardBase}>
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <TrendingUp className="size-4 text-orange-600" />
                          Projeção de Performance (25 anos)
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium text-sidebar-fg/80">Geração Anual Estimada</h4>
                            <div className="space-y-2">
                              {[
                                { ano: 'Ano 1', geracao: result.energiaGeradaMensalKWh * 12, degradacao: 0 },
                                { ano: 'Ano 5', geracao: result.energiaGeradaMensalKWh * 12 * 0.97, degradacao: 3 },
                                { ano: 'Ano 10', geracao: result.energiaGeradaMensalKWh * 12 * 0.92, degradacao: 8 },
                                { ano: 'Ano 15', geracao: result.energiaGeradaMensalKWh * 12 * 0.87, degradacao: 13 },
                                { ano: 'Ano 20', geracao: result.energiaGeradaMensalKWh * 12 * 0.82, degradacao: 18 },
                                { ano: 'Ano 25', geracao: result.energiaGeradaMensalKWh * 12 * 0.77, degradacao: 23 }
                              ].map((item, index) => (
                                <div key={index} className="flex justify-between items-center">
                                  <span className="text-sm">{item.ano}</span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm font-medium">{Math.round(item.geracao).toLocaleString()} kWh</span>
                                    <span className="text-xs text-sidebar-fg/70">(-{item.degradacao}%)</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <h4 className="text-sm font-medium text-sidebar-fg/80">Economia Acumulada</h4>
                            <div className="space-y-2">
                              {[
                                { periodo: '1 ano', economia: Number(result.economiaAnualReais) },
                                { periodo: '5 anos', economia: Number(result.economiaAnualReais) * 4.8 },
                                { periodo: '10 anos', economia: Number(result.economiaAnualReais) * 9.2 },
                                { periodo: '15 anos', economia: Number(result.economiaAnualReais) * 13.1 },
                                { periodo: '20 anos', economia: Number(result.economiaAnualReais) * 16.5 },
                                { periodo: '25 anos', economia: Number(result.economiaAnualReais) * 19.2 }
                              ].map((item, index) => (
                                <div key={index} className="flex justify-between items-center">
                                  <span className="text-sm">{item.periodo}</span>
                                  <span className="text-sm font-medium text-green-600">R$ {item.economia.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Comparação de Cenários */}
                      <div className={cardBase}>
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <Target className="size-4 text-indigo-600" />
                          Comparação de Cenários
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="p-3 rounded-lg border bg-gradient-to-br from-red-50 to-red-100 border-red-200">
                            <h4 className="text-sm font-medium text-red-700 mb-2">Sem Sistema Solar</h4>
                            <div className="space-y-1">
                              <div className="text-xs text-red-600">Gasto anual com energia:</div>
                              <div className="text-lg font-bold text-red-800">R$ {(Number(consumo || 0) * 12 * 0.65).toLocaleString('pt-BR')}</div>
                              <div className="text-xs text-red-600">Gasto em 25 anos:</div>
                              <div className="text-sm font-medium text-red-700">R$ {(Number(consumo || 0) * 12 * 0.65 * 25 * 1.05).toLocaleString('pt-BR', { maximumFractionDigits: 0 })}</div>
                            </div>
                          </div>
                          
                          <div className="p-3 rounded-lg border bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
                            <h4 className="text-sm font-medium text-yellow-700 mb-2">Sistema Menor (80%)</h4>
                            <div className="space-y-1">
                              <div className="text-xs text-yellow-600">Potência:</div>
                              <div className="text-lg font-bold text-yellow-800">{(result.potenciaRecomendadaKwp * 0.8).toFixed(1)} kWp</div>
                              <div className="text-xs text-yellow-600">Compensação:</div>
                              <div className="text-sm font-medium text-yellow-700">{(result.compensacaoPercent * 0.8).toFixed(0)}%</div>
                            </div>
                          </div>
                          
                          <div className="p-3 rounded-lg border bg-gradient-to-br from-green-50 to-green-100 border-green-200">
                            <h4 className="text-sm font-medium text-green-700 mb-2">Sistema Recomendado</h4>
                            <div className="space-y-1">
                              <div className="text-xs text-green-600">Potência:</div>
                              <div className="text-lg font-bold text-green-800">{result.potenciaRecomendadaKwp} kWp</div>
                              <div className="text-xs text-green-600">Compensação:</div>
                              <div className="text-sm font-medium text-green-700">{result.compensacaoPercent}%</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Indicadores de Sustentabilidade */}
                      <div className={cardBase}>
                        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                          <Sun className="size-4 text-green-600" />
                          Impacto Ambiental
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                          <div className="text-center p-3 rounded-lg bg-green-50 border border-green-200">
                            <div className="text-2xl font-bold text-green-700">{(result.energiaGeradaMensalKWh * 12 * 25 * 0.0004).toFixed(1)}</div>
                            <div className="text-xs text-green-600 font-medium">Toneladas de CO₂</div>
                            <div className="text-xs text-sidebar-fg/70">evitadas em 25 anos</div>
                          </div>
                          
                          <div className="text-center p-3 rounded-lg bg-blue-50 border border-blue-200">
                            <div className="text-2xl font-bold text-blue-700">{Math.round(result.energiaGeradaMensalKWh * 12 * 25 * 0.0004 * 2.5)}</div>
                            <div className="text-xs text-blue-600 font-medium">Árvores</div>
                            <div className="text-xs text-sidebar-fg/70">equivalente plantado</div>
                          </div>
                          
                          <div className="text-center p-3 rounded-lg bg-purple-50 border border-purple-200">
                            <div className="text-2xl font-bold text-purple-700">{Math.round(result.energiaGeradaMensalKWh * 12 * 25 / 1000)}</div>
                            <div className="text-xs text-purple-600 font-medium">MWh</div>
                            <div className="text-xs text-sidebar-fg/70">energia limpa gerada</div>
                          </div>
                          
                          <div className="text-center p-3 rounded-lg bg-orange-50 border border-orange-200">
                            <div className="text-2xl font-bold text-orange-700">{Math.round(result.energiaGeradaMensalKWh * 12 * 25 * 0.0004 * 1200)}</div>
                            <div className="text-xs text-orange-600 font-medium">Km rodados</div>
                            <div className="text-xs text-sidebar-fg/70">equivalente em carro</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>

          {/* Coluna direita: Resumo da Simulação */}
          <div className="md:col-span-1">
            {result ? (
              <div className={`${cardBase}`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-1.5 rounded-md bg-amber-100 dark:bg-amber-900/30">
                    <Sun className="size-4 text-amber-600 dark:text-amber-400" />
                  </div>
                  <h2 className="text-sm font-semibold">Resumo da Simulação</h2>
                </div>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm text-blue-600 font-medium">Potência recomendada</div>
                        <div className="p-1.5 rounded-md bg-blue-600 text-white">
                          <Zap className="size-3" />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-blue-900">{result.potenciaRecomendadaKwp} kWp</div>
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Sistema Dimensionado
                        </span>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-green-100 border border-green-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm text-green-600 font-medium">Geração mensal</div>
                        <div className="p-1.5 rounded-md bg-green-600 text-white">
                          <TrendingUp className="size-3" />
                        </div>
                      </div>
                      <div className="text-2xl font-bold text-green-900">{result.energiaGeradaMensalKWh} kWh</div>
                      <div className="mt-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          result.compensacaoPercent >= 95 ? 'bg-green-100 text-green-800' : 
                          result.compensacaoPercent >= 80 ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {result.compensacaoPercent >= 95 ? 'Geração Ideal' : 
                           result.compensacaoPercent >= 80 ? 'Geração Boa' : 
                           'Geração Baixa'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-gradient-to-br from-yellow-50 to-yellow-100 border border-yellow-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm text-yellow-600 font-medium">Compensação</div>
                        <div className="p-1.5 rounded-md bg-yellow-600 text-white">
                          <Target className="size-3" />
                        </div>
                      </div>
                      <div className="text-xl font-bold text-yellow-900">{result.compensacaoPercent}%</div>
                      <div className="mt-1">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          result.compensacaoPercent >= 95 ? 'bg-green-100 text-green-800' : 
                          result.compensacaoPercent >= 80 ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {result.compensacaoPercent >= 95 ? 'Excelente' : 
                           result.compensacaoPercent >= 80 ? 'Bom' : 
                           'Insuficiente'}
                        </span>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm text-purple-600 font-medium">Economia mensal</div>
                        <div className="p-1.5 rounded-md bg-purple-600 text-white">
                          <DollarSign className="size-3" />
                        </div>
                      </div>
                      <div className="text-xl font-bold text-purple-900">R$ {result.economiaMensalReais}</div>
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          Por mês
                        </span>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-gradient-to-br from-indigo-50 to-indigo-100 border border-indigo-200 shadow-sm hover:shadow-md transition-shadow duration-200">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-sm text-indigo-600 font-medium">Economia anual</div>
                        <div className="p-1.5 rounded-md bg-indigo-600 text-white">
                          <PiggyBank className="size-3" />
                        </div>
                      </div>
                      <div className="text-xl font-bold text-indigo-900">R$ {result.economiaAnualReais}</div>
                      <div className="mt-1">
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                          12 meses
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
                      <div className="text-xs text-gray-600 font-medium">Consumo base + extra</div>
                      <div className="text-base font-bold text-gray-900">{(((consumo?.replace?.(",", ".") ? Number(consumo.replace(",", ".")) : 0)) + (enableExtraConsumption ? extraConsumptionKWhMonth : 0)).toFixed(2)} kWh/mês</div>
                    </div>
                    <div className="p-3 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
                      <div className="text-xs text-gray-600 font-medium">Fio B (Ano 1)</div>
                      <div className="text-base font-bold text-gray-900">{result.detalhes?.fioBPercentYear1}%</div>
                    </div>
                  </div>
                </div>
                {Array.isArray(result?.detalhes?.notas) && result.detalhes.notas.length > 0 && (
                  <ul className="mt-3 list-disc pl-5 text-xs text-sidebar-fg/70">
                    {result.detalhes.notas.map((n: string, i: number) => (
                      <li key={i}>{n}</li>
                    ))}
                  </ul>
                )}
              </div>
            ) : (
              <div className={`${cardBase} text-sm text-sidebar-fg/80`}>
                <p>Preencha os dados e clique em Simular para ver o resumo aqui.</p>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-between mt-4">
          <button onClick={() => setCurrentStep(0)} className="rounded-md border px-4 py-2 bg-background hover:bg-sidebar-accent/10">Anterior</button>
          <button onClick={handleStepComplete} className="rounded-md border px-4 py-2 bg-sidebar-accent hover:bg-sidebar-accent/70">Próxima</button>
        </div>
         </>
       )}

       {currentStep === 2 && (
        <div className={cardBase}>
          <div className="mb-2">
            <h2 className="text-sm font-semibold">Propostas</h2>
            <p className="text-xs text-sidebar-fg/70">Escolha um template para gerar a proposta. Em breve integraremos geração e prévia.</p>
          </div>

          <div className="mb-3 flex items-center gap-2">
            <button onClick={handlePreviewToggle} className="rounded-md border px-3 py-1.5 bg-background text-xs disabled:opacity-60" disabled={!result}>
              {showProposalPreview ? "Ocultar Prévia" : "Pré-visualizar"}
            </button>
            <button onClick={handleExportPdf} className="rounded-md border px-3 py-1.5 bg-sidebar-accent text-xs disabled:opacity-60" disabled={!result}>
              Exportar PDF
            </button>
            {!result && (
              <span className="text-[11px] text-sidebar-fg/70">Realize uma simulação para habilitar a proposta.</span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {["Template Econômico","Apresentação Comercial","Relatório Técnico"].map((title) => (
              <div key={title} className="rounded-md border bg-background p-3 flex flex-col justify-between hover:border-[hsl(var(--accent))] transition-colors">
                <div>
                  <h3 className="text-sm font-semibold">{title}</h3>
                  <p className="text-xs text-sidebar-fg/70">Estrutura base pronta. Personalização virá nas próximas sprints.</p>
                </div>
                <div className="mt-3 flex gap-2">
                  <button disabled className="rounded-md border px-3 py-1.5 bg-background text-xs opacity-60">Pré-visualizar</button>
                  <button disabled className="rounded-md border px-3 py-1.5 bg-background text-xs opacity-60">Gerar</button>
                </div>
              </div>
            ))}
          </div>

          {showProposalPreview && result && (
            <div id="proposal-print" className="mt-4 bg-white text-black rounded-md border p-6">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-xl font-bold">Proposta Comercial — Sistema Fotovoltaico</h1>
                  <p className="text-xs text-neutral-600">Gerada automaticamente pela plataforma</p>
                </div>
                <div className="text-right text-xs">
                  <div>{new Date().toLocaleDateString()}</div>
                  <div className="font-medium">Nova Energia</div>
                </div>
              </div>

              <hr className="my-4" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="rounded border bg-white p-3">
                  <h3 className="font-semibold mb-2">Dados do Lead</h3>
                  <dl className="grid grid-cols-3 gap-y-1">
                    <dt className="text-neutral-600">Nome</dt><dd className="col-span-2 font-medium">{leadName || "Não informado"}</dd>
                    <dt className="text-neutral-600">Email</dt><dd className="col-span-2 font-medium">{leadEmail || "Não informado"}</dd>
                    <dt className="text-neutral-600">Telefone</dt><dd className="col-span-2 font-medium">{leadPhone || "Não informado"}</dd>
                    <dt className="text-neutral-600">Tipo</dt><dd className="col-span-2 font-medium">{leadType}</dd>
                  </dl>
                </div>

                <div className="rounded border bg-white p-3">
                  <h3 className="font-semibold mb-2">Resumo da Simulação</h3>
                  <dl className="grid grid-cols-2 gap-y-1">
                    <dt className="text-neutral-600">Potência Recomendada</dt><dd className="font-medium">{result.potenciaRecomendadaKwp} kWp</dd>
                    <dt className="text-neutral-600">Geração Mensal</dt><dd className="font-medium">{result.energiaGeradaMensalKWh} kWh</dd>
                    <dt className="text-neutral-600">Compensação</dt><dd className="font-medium">{result.compensacaoPercent}%</dd>
                    <dt className="text-neutral-600">Economia Mensal</dt><dd className="font-medium">R$ {result.economiaMensalReais}</dd>
                    <dt className="text-neutral-600">Economia Anual</dt><dd className="font-medium">R$ {result.economiaAnualReais}</dd>
                    {typeof result.detalhes?.oversizePercent === 'number' && (
                      <>
                        <dt className="text-neutral-600">Oversize</dt><dd className="font-medium">{result.detalhes.oversizePercent}%</dd>
                      </>
                    )}
                  </dl>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                <div className="rounded border p-3">
                  <h4 className="font-semibold mb-1">Condições Comerciais</h4>
                  <ul className="list-disc pl-5 text-[12px] leading-relaxed">
                    <li>Validade desta proposta: 7 dias.</li>
                    <li>Prazos de entrega: 60 a 90 dias após aprovação.</li>
                    <li>Garantias conforme fabricante e normas vigentes.</li>
                  </ul>
                </div>
                <div className="rounded border p-3">
                  <h4 className="font-semibold mb-1">Observações</h4>
                  <ul className="list-disc pl-5 text-[12px] leading-relaxed">
                    <li>Valores e especificações sujeitos a visita técnica.</li>
                    <li>Projeto executivo detalhado após contratação.</li>
                  </ul>
                </div>
                <div className="rounded border p-3">
                  <h4 className="font-semibold mb-1">Contato</h4>
                  <p className="text-[12px] leading-relaxed">comercial@novaenergia.com.br<br/>+55 (11) 99999-9999</p>
                </div>
              </div>

              <div className="mt-6 text-[11px] text-neutral-500">
                Esta proposta foi gerada automaticamente a partir da simulação realizada na plataforma. Para dúvidas, entre em contato com nosso time.
              </div>
            </div>
          )}

          <div className="flex justify-end mt-4">
            <button onClick={handleStepComplete} className="rounded-md border px-4 py-2 bg-sidebar-accent hover:bg-sidebar-accent/70">Próxima</button>
          </div>
        </div>
      )}

      {currentStep === 3 && (
        <div className={cardBase}>
          <div className="mb-2">
            <h2 className="text-sm font-semibold">Finalização</h2>
            <p className="text-xs text-sidebar-fg/70">Revise as informações antes de concluir.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-md border bg-background p-3">
              <h3 className="text-sm font-semibold mb-2">Lead</h3>
              <dl className="text-sm grid grid-cols-2 gap-x-4 gap-y-1">
                <dt className="text-sidebar-fg/70">Nome</dt><dd className="font-medium">{leadName || "Não informado"}</dd>
                <dt className="text-sidebar-fg/70">Email</dt><dd className="font-medium">{leadEmail || "Não informado"}</dd>
                <dt className="text-sidebar-fg/70">Telefone</dt><dd className="font-medium">{leadPhone || "Não informado"}</dd>
                <dt className="text-sidebar-fg/70">Tipo</dt><dd className="font-medium">{leadType}</dd>
              </dl>
            </div>
            <div className="rounded-md border bg-background p-3">
              <h3 className="text-sm font-semibold mb-2">Resumo da Simulação</h3>
              {result ? (
                <dl className="text-sm grid grid-cols-2 gap-x-4 gap-y-1">
                  <dt className="text-sidebar-fg/70">Potência</dt><dd className="font-medium">{result.potenciaRecomendadaKwp} kWp</dd>
                  <dt className="text-sidebar-fg/70">Geração mensal</dt><dd className="font-medium">{result.energiaGeradaMensalKWh} kWh</dd>
                  <dt className="text-sidebar-fg/70">Compensação</dt><dd className="font-medium">{result.compensacaoPercent}%</dd>
                  <dt className="text-sidebar-fg/70">Economia mensal</dt><dd className="font-medium">R$ {result.economiaMensalReais}</dd>
                </dl>
              ) : (
                <p className="text-xs text-sidebar-fg/70">Sem simulação realizada.</p>
              )}
            </div>
          </div>
          <div className="flex items-center justify-between mt-4">
            <button onClick={() => setCurrentStep(2)} className="rounded-md border px-4 py-2 bg-background hover:bg-sidebar-accent/10">Anterior</button>
            <button onClick={handleFinalize} disabled={saving} className="rounded-md border px-4 py-2 bg-green-600 text-white hover:bg-green-700 disabled:opacity-60">{saving ? "Salvando..." : "Finalizar Proposta"}</button>
          </div>
        </div>
      )}
      <LeadSelector
        isOpen={showLeadSelector}
        onClose={() => setShowLeadSelector(false)}
        onSelect={(c: import("./components/LeadSelector").ContactOption) => {
          setLeadName(c?.name ?? "");
          setLeadEmail(c?.email ?? "");
          setLeadPhone(c?.phone ?? "");
          if (!consumo) {
            const cm = c?.consumoMedio as any;
            if (cm !== null && cm !== undefined && cm !== "") {
              setConsumo(String(cm));
            }
          }
          setShowLeadSelector(false);
        }}
      />
    </div>
  )
}

export default Page