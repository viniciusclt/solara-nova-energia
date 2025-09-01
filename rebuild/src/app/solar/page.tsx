"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Sun, Users, Settings, CheckCircle, AlertTriangle, Zap, TrendingUp, Target, DollarSign, PiggyBank, FileText, AlertCircle, Calculator, BarChart3, Wrench, CheckSquare } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogFooter, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import EquipmentConsumption from "./components/EquipmentConsumption";
import type { EquipItem } from "./components/EquipmentConsumption";
// Removido LeadSelector (busca inline)
import TariffForm from "./components/TariffForm";
import type { ContactOption } from "./components/LeadSelector";
import { api } from "@/lib/api";
import { simulate as runSimulation } from "@/core/services/CalculationService";
import type { SimulationInput, SimulationLevel } from "@/core/types/solar";
import FileUploader from "@/app/_components/FileUploader";
import Link from "next/link";
import SimulationSummary from "./components/SimulationSummary";
import { cardBase, inputBase } from "@/styles/tokens";

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
];

function Page() {
  const [mounted, setMounted] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [leadName, setLeadName] = useState("");
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadCpf, setLeadCpf] = useState("");
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null);
  const [addressStreet, setAddressStreet] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [addressComplement, setAddressComplement] = useState("");
  const [addressNeighborhood, setAddressNeighborhood] = useState("");
  const [addressCity, setAddressCity] = useState("");
  const [addressState, setAddressState] = useState("");
  const [addressZip, setAddressZip] = useState("");
  const [leadType, setLeadType] = useState("residencial");
  const [simulationLevel, setSimulationLevel] = useState<SimulationLevel>('basic');
  const [showPvsolImport, setShowPvsolImport] = useState(false);
  const [pvsolUploadInfo, setPvsolUploadInfo] = useState("");

  // Estados de equipamentos (controlados)
  const [modulesBrand, setModulesBrand] = useState("");
const [modulesModel, setModulesModel] = useState("");
  const [modulesPower, setModulesPower] = useState("450");
  const [modulesQuantity, setModulesQuantity] = useState("12");
  const [modulesEfficiency, setModulesEfficiency] = useState("21.2");

  const [inverterBrand, setInverterBrand] = useState("");
  const [inverterModel, setInverterModel] = useState("");
  const [inverterPowerAC, setInverterPowerAC] = useState("5.0");
  const [inverterPowerDC, setInverterPowerDC] = useState("7.5");
  const [inverterEfficiency, setInverterEfficiency] = useState("97.1");
  const [inverterQuantity, setInverterQuantity] = useState("1");

  // CRUD — create (catálogo) Módulos
  const [newModuleManufacturer, setNewModuleManufacturer] = useState("");
  const [newModuleModel, setNewModuleModel] = useState("");
  const [newModulePowerW, setNewModulePowerW] = useState<string>("");
  const [creatingModule, setCreatingModule] = useState(false);
  const [moduleCreateError, setModuleCreateError] = useState<string | null>(null);

  // CRUD — create (catálogo) Inversores
  const [newInverterManufacturer, setNewInverterManufacturer] = useState("");
  const [newInverterModel, setNewInverterModel] = useState("");
  const [newInverterPowerKW, setNewInverterPowerKW] = useState<string>("");
  const [newInverterMppt, setNewInverterMppt] = useState<string>("");
  const [newInverterEfficiency, setNewInverterEfficiency] = useState<string>("");
  const [newInverterPhases, setNewInverterPhases] = useState<'MONO' | 'TRIF'>('MONO');
  const [creatingInverter, setCreatingInverter] = useState(false);
  const [inverterCreateError, setInverterCreateError] = useState<string | null>(null);

  const [batteryEnabled, setBatteryEnabled] = useState(false);
  const [batteryTechnology, setBatteryTechnology] = useState("lithium");
  const [batteryCapacity, setBatteryCapacity] = useState("10");
  const [batteryVoltage, setBatteryVoltage] = useState("48");
  const [batteryDOD, setBatteryDOD] = useState("80");

  // Handlers — criação de catálogo
  const handleCreateModule = useCallback(async () => {
    setModuleCreateError(null);
    setCreatingModule(true);
    try {
      const body: any = {
        manufacturer: newModuleManufacturer.trim(),
        model: newModuleModel.trim(),
        powerW: Number(newModulePowerW),
      };
      if (!body.manufacturer || !body.model || !Number.isFinite(body.powerW) || body.powerW <= 0) {
        throw new Error("Preencha fabricante, modelo e potência válida (W).");
      }
      const res = await fetch('/api/solar/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error || 'Erro ao criar módulo';
        throw new Error(typeof msg === 'string' ? msg : 'Erro ao criar módulo');
      }
      setModuleOptions(prev => [data, ...prev]);
      setModulesBrand(data.manufacturer);
      setModulesModel(data.model);
      setNewModuleManufacturer("");
      setNewModuleModel("");
      setNewModulePowerW("");
    } catch (e: any) {
      setModuleCreateError(e?.message || 'Falha ao criar módulo');
    } finally {
      setCreatingModule(false);
    }
  }, [newModuleManufacturer, newModuleModel, newModulePowerW]);

  const handleCreateInverter = useCallback(async () => {
    setInverterCreateError(null);
    setCreatingInverter(true);
    try {
      const powerKW = Number(newInverterPowerKW);
      const body: any = {
        manufacturer: newInverterManufacturer.trim(),
        model: newInverterModel.trim(),
        powerW: Number.isFinite(powerKW) && powerKW > 0 ? Math.round(powerKW * 1000) : NaN,
        mpptCount: newInverterMppt ? Number(newInverterMppt) : undefined,
        efficiencyPerc: newInverterEfficiency ? Number(newInverterEfficiency) : undefined,
        phases: newInverterPhases,
      };
      if (!body.manufacturer || !body.model || !Number.isFinite(body.powerW) || body.powerW <= 0) {
        throw new Error("Preencha fabricante, modelo e potência válida (kW).");
      }
      const res = await fetch('/api/solar/inverters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error || 'Erro ao criar inversor';
        throw new Error(typeof msg === 'string' ? msg : 'Erro ao criar inversor');
      }
      setInverterOptions(prev => [data, ...prev]);
      setInverterBrand(data.manufacturer);
      setInverterModel(data.model);
      setNewInverterManufacturer("");
      setNewInverterModel("");
      setNewInverterPowerKW("");
      setNewInverterMppt("");
      setNewInverterEfficiency("");
      setNewInverterPhases('MONO');
    } catch (e: any) {
      setInverterCreateError(e?.message || 'Falha ao criar inversor');
    } finally {
      setCreatingInverter(false);
    }
  }, [newInverterManufacturer, newInverterModel, newInverterPowerKW, newInverterMppt, newInverterEfficiency, newInverterPhases]);

  // Catálogo de equipamentos (via API)
  type ApiList<T> = { total: number; data: T[] };
  type ModuleItem = { id: string; manufacturer: string; model: string; powerW: number; efficiencyPerc?: any };
  type InverterItem = { id: string; manufacturer: string; model: string; powerW: number; efficiencyPerc?: any; mpptCount?: number; phases?: string };
  const [moduleOptions, setModuleOptions] = useState<ModuleItem[]>([]);
  const [inverterOptions, setInverterOptions] = useState<InverterItem[]>([]);

  // Listas derivadas
  const moduleBrands = useMemo(() => Array.from(new Set(moduleOptions.map(m => m.manufacturer))).sort(), [moduleOptions]);
  const moduleModels = useMemo(() => moduleOptions.filter(m => !modulesBrand || m.manufacturer === modulesBrand), [moduleOptions, modulesBrand]);
  const inverterBrands = useMemo(() => Array.from(new Set(inverterOptions.map(i => i.manufacturer))).sort(), [inverterOptions]);
  const inverterModels = useMemo(() => inverterOptions.filter(i => !inverterBrand || i.manufacturer === inverterBrand), [inverterOptions, inverterBrand]);

  // Carregar catálogos ao montar
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/solar/modules?limit=100');
        if (res.ok) {
          const json = (await res.json()) as ApiList<ModuleItem>;
          setModuleOptions(Array.isArray(json?.data) ? json.data : []);
        }
      } catch {}
      try {
        const res = await fetch('/api/solar/inverters?limit=100');
        if (res.ok) {
          const json = (await res.json()) as ApiList<InverterItem>;
          setInverterOptions(Array.isArray(json?.data) ? json.data : []);
        }
      } catch {}
    })();
  }, []);

  // Ao trocar módulo selecionado, preencher potência/eficiência
  useEffect(() => {
    const sel = moduleOptions.find(m => m.manufacturer === modulesBrand && m.model === modulesModel);
    if (sel) {
      if (sel.powerW != null) setModulesPower(String(sel.powerW));
      if (sel.efficiencyPerc != null) setModulesEfficiency(String(Number(sel.efficiencyPerc)));
    }
  }, [modulesBrand, modulesModel, moduleOptions]);

  // Ao trocar inversor selecionado, preencher PAC/PDC e eficiência (kW derivados de W)
  useEffect(() => {
    const sel = inverterOptions.find(i => i.manufacturer === inverterBrand && i.model === inverterModel);
    if (sel) {
      const kW = sel.powerW != null ? sel.powerW / 1000 : undefined;
      if (kW != null && !Number.isNaN(kW)) {
        setInverterPowerAC(String(kW));
        setInverterPowerDC(String(kW));
      }
      if (sel.efficiencyPerc != null) setInverterEfficiency(String(Number(sel.efficiencyPerc)));
    }
  }, [inverterBrand, inverterModel, inverterOptions]);

  // Resetar modelo quando a marca mudar e o modelo atual não pertencer à marca
  useEffect(() => {
    if (modulesModel && !moduleOptions.some(m => m.manufacturer === modulesBrand && m.model === modulesModel)) {
      setModulesModel("");
    }
  }, [modulesBrand, moduleOptions]);
  useEffect(() => {
    if (inverterModel && !inverterOptions.some(i => i.manufacturer === inverterBrand && i.model === inverterModel)) {
      setInverterModel("");
    }
  }, [inverterBrand, inverterOptions]);

  // Toggle de exibição (Gerenciar)
  const [showModulesManager, setShowModulesManager] = useState(false);
  const [showInvertersManager, setShowInvertersManager] = useState(false);
  const [showBatteriesManager, setShowBatteriesManager] = useState(false);

  const [consumo, setConsumo] = useState("");
  const [pr, setPr] = useState("0.75");
  const [perdas, setPerdas] = useState("15");
  const [metaCompensacao, setMetaCompensacao] = useState("95");
  const [enableExtraConsumption, setEnableExtraConsumption] = useState(false);
  const [extraConsumptionKWhMonth, setExtraConsumptionKWhMonth] = useState(0);
  const [showConsumptionModal, setShowConsumptionModal] = useState(false);
  // Estados de equipamentos extras (persistência/resumo)
  const [equipItems, setEquipItems] = useState<EquipItem[]>([]);
  const [equipItemsCount, setEquipItemsCount] = useState(0);
  const [equipItemsKWh, setEquipItemsKWh] = useState(0);
  const [equipQuickExtra, setEquipQuickExtra] = useState(0);

  // Parâmetros tarifários (R$/kWh e %)
  const [tariffTE, setTariffTE] = useState("");
  const [tariffTUSD, setTariffTUSD] = useState("");
  const [tariffICMS, setTariffICMS] = useState("");
  const [tariffPIS, setTariffPIS] = useState("");
  const [tariffCOFINS, setTariffCOFINS] = useState("");
  // Consumo mensal (histórico)
  const [useMonthlySeries, setUseMonthlySeries] = useState(false);
  const [monthlyConsumptionInputs, setMonthlyConsumptionInputs] = useState<string[]>(Array(12).fill(""));
  const [lastSimulatedMonthlyConsumption, setLastSimulatedMonthlyConsumption] = useState<number[]>(Array(12).fill(0));
  const [lastSimulationHash, setLastSimulationHash] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SimulationResult | null>(null);
  const [showProposalPreview, setShowProposalPreview] = useState(false);
// Estados de salvamento de proposta
const [savingProposal, setSavingProposal] = useState(false);
const [proposalSavedId, setProposalSavedId] = useState<string | null>(null);
const [proposalSaveError, setProposalSaveError] = useState<string | null>(null);
  // Inline lead search
  const [leadSearch, setLeadSearch] = useState("");
  const [leadResults, setLeadResults] = useState<ContactOption[]>([]);
  const [leadSearching, setLeadSearching] = useState(false);
  const [leadSearchError, setLeadSearchError] = useState<string | null>(null);
  // CEP auto-fill (ViaCEP)
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState<string | null>(null);
  const [lastCepFetched, setLastCepFetched] = useState<string>("");

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

  // Salvar proposta na API a partir da simulação e do lead selecionado
  const saveProposal = useCallback(async () => {
    if (!result) {
      setProposalSaveError("Simulação não realizada.");
      return;
    }
    if (!selectedLeadId) {
      setProposalSaveError("Selecione ou crie um lead antes de salvar a proposta.");
      return;
    }
    try {
      setSavingProposal(true);
      setProposalSaveError(null);
      setProposalSavedId(null);

      const title = `Proposta - ${leadName || "Lead"} - ${new Date().toLocaleDateString()}`;
      const payload = {
        title,
        leadId: selectedLeadId,
        data: {
          simulation: result,
          lead: {
            name: leadName,
            email: leadEmail,
            phone: leadPhone,
            cpf: leadCpf,
            type: leadType,
            address: {
              street: addressStreet,
              number: addressNumber,
              complement: addressComplement,
              neighborhood: addressNeighborhood,
              city: addressCity,
              state: addressState,
              zip: addressZip,
            },
          },
          equipment: {
            modules: {
              brand: modulesBrand,
              model: modulesModel,
              powerW: Number(modulesPower) || null,
              efficiency: Number(modulesEfficiency) || null,
              quantity: Number(modulesQuantity) || null,
            },
            inverter: {
              brand: inverterBrand,
              model: inverterModel,
              powerACkW: Number(inverterPowerAC) || null,
              powerDCkW: Number(inverterPowerDC) || null,
              efficiency: Number(inverterEfficiency) || null,
              quantity: Number(inverterQuantity) || null,
            },
          },
          extras: {
            enableExtraConsumption,
            extraConsumptionKWhMonth,
          },
        },
      } as const;

      const created = await api.post<any>("/api/proposals", payload);
      const newId = (created && (created as any).id) || ((created as any)?.data?.id) || null;
      setProposalSavedId(newId);
    } catch (err: any) {
      setProposalSaveError(err?.message || "Falha ao salvar proposta.");
    } finally {
      setSavingProposal(false);
    }
  }, [
    result,
    selectedLeadId,
    leadName,
    leadEmail,
    leadPhone,
    leadCpf,
    leadType,
    addressStreet,
    addressNumber,
    addressComplement,
    addressNeighborhood,
    addressCity,
    addressState,
    addressZip,
    modulesBrand,
    modulesModel,
    modulesPower,
    modulesEfficiency,
    modulesQuantity,
    inverterBrand,
    inverterModel,
    inverterPowerAC,
    inverterPowerDC,
    inverterEfficiency,
    inverterQuantity,
    enableExtraConsumption,
    extraConsumptionKWhMonth,
  ]);

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

  // Busca inline de leads (debounced)
  useEffect(() => {
    if (!leadSearch.trim()) { setLeadResults([]); return; }
    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        setLeadSearching(true);
        setLeadSearchError(null);
        const url = `/api/contacts?q=${encodeURIComponent(leadSearch)}&limit=8`;
        const resp = await api.get<{ data: ContactOption[]; total: number; page?: number; limit?: number }>(url, { signal: controller.signal } as any);
        setLeadResults(resp?.data ?? []);
      } catch (e: any) {
        if (e?.name !== 'AbortError') setLeadSearchError(e?.message || 'Falha ao buscar contatos');
      } finally {
        setLeadSearching(false);
      }
    }, 300);
    return () => { controller.abort(); clearTimeout(t); };
  }, [leadSearch]);

  // Auto-preenchimento por CEP (ViaCEP) com debounce
  useEffect(() => {
    const raw = (addressZip || '').replace(/\D/g, '');
    if (raw.length !== 8 || raw === lastCepFetched) { return; }
    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        setCepLoading(true);
        setCepError(null);
        const res = await fetch(`https://viacep.com.br/ws/${raw}/json/`, { signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        if (data?.erro) throw new Error('CEP não encontrado');
        setAddressStreet(data.logradouro || '');
        setAddressNeighborhood(data.bairro || '');
        setAddressCity(data.localidade || '');
        setAddressState(data.uf || '');
        setLastCepFetched(raw);
      } catch (e: any) {
        if (e?.name !== 'AbortError') setCepError(e?.message || 'Falha ao buscar CEP');
      } finally {
        setCepLoading(false);
      }
    }, 400);
    return () => { controller.abort(); clearTimeout(t); };
  }, [addressZip, lastCepFetched]);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handlePvsolUploaded = useCallback(async (item: { key: string; downloadUrl?: string }) => {
    try {
      const url = item.downloadUrl || (await (async () => {
        const res = await fetch("/api/storage/presign-download", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ key: item.key }),
        });
        if (!res.ok) throw new Error(`Falha ao gerar URL de download: HTTP ${res.status}`);
        const data = (await res.json()) as { url?: string };
        if (!data?.url) throw new Error("Resposta inválida da API de presign-download");
        return data.url as string;
      })());

      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`Falha ao baixar arquivo: HTTP ${resp.status}`);
      const text = await resp.text();

      let obj: any | null = null;
      try { obj = JSON.parse(text); } catch {}

      if (!obj) {
        setPvsolUploadInfo(
          "Arquivo recebido, mas o formato ainda não é suportado para parsing automático. Utilize JSON com schema compatível."
        );
        return;
      }

      const modules = obj.modules || obj.modulos || obj.pvModules || {};
      const inverter = obj.inverter || obj.inversor || obj.pvInverter || {};
      const perdasNum = obj.perdasNum ?? obj.perdas ?? obj.losses;
      const monthlyVals = obj.monthlyVals || obj.consumoMensal || obj.monthlyConsumption;
      const battery = obj.battery || obj.bateria || {};

      if (modules) {
        if (modules.brand) setModulesBrand(String(modules.brand));
        if (modules.model) setModulesModel(String(modules.model));
        if (modules.power) setModulesPower(String(modules.power));
        if (modules.qty ?? modules.quantity) setModulesQuantity(String(modules.qty ?? modules.quantity));
        if (modules.eff ?? modules.efficiency) setModulesEfficiency(String(modules.eff ?? modules.efficiency));
      }

      if (inverter) {
        if (inverter.brand) setInverterBrand(String(inverter.brand));
        if (inverter.model) setInverterModel(String(inverter.model));
        if (inverter.pac ?? inverter.powerAC) setInverterPowerAC(String(inverter.pac ?? inverter.powerAC));
        if (inverter.pdc ?? inverter.powerDC) setInverterPowerDC(String(inverter.pdc ?? inverter.powerDC));
        if (inverter.eff ?? inverter.efficiency) setInverterEfficiency(String(inverter.eff ?? inverter.efficiency));
        if (inverter.qty ?? inverter.quantity) setInverterQuantity(String(inverter.qty ?? inverter.quantity));
      }

      if (battery && (battery.enabled || battery.tech || battery.capacity)) {
        setBatteryEnabled(Boolean(battery.enabled));
        if (battery.tech) setBatteryTechnology(String(battery.tech));
        if (battery.capacity) setBatteryCapacity(String(battery.capacity));
        if (battery.voltage) setBatteryVoltage(String(battery.voltage));
        if (battery.DOD ?? battery.dod) setBatteryDOD(String(battery.DOD ?? battery.dod));
      }

      if (typeof perdasNum === "number" || typeof perdasNum === "string") {
        setPerdas(String(perdasNum));
      }

      if (Array.isArray(monthlyVals) && monthlyVals.length) {
        const arr = monthlyVals.slice(0, 12).map((v: any) => String(Number(v) || 0));
        setUseMonthlySeries(true);
        setMonthlyConsumptionInputs(arr);
        setLastSimulatedMonthlyConsumption(Array(12).fill(0));
      }

      setPvsolUploadInfo("Dados do arquivo importado e aplicados. Revise e execute a simulação.");
    } catch (err) {
      setPvsolUploadInfo(err instanceof Error ? `Falha ao processar: ${err.message}` : "Falha ao processar arquivo.");
    }
  }, []);


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
    if (useMonthlySeries) {
      const monthlyVals = monthlyConsumptionInputs.map((s) => Number(String(s).replace(",", ".")) || 0);
      const hasAny = monthlyVals.some((v) => v > 0);
      if (!hasAny) {
        setError("Preencha ao menos um mês de consumo");
        return;
      }
    } else {
      if (!consumo) {
        setError("Preencha o consumo mensal");
        return;
      }
    }

    setLoading(true);
    setError("");

    try {
      const prNum = Number(pr);
      const perdasNum = Number(perdas);
      const metaNum = Number(metaCompensacao);
      const extraConsumo = enableExtraConsumption ? extraConsumptionKWhMonth : 0;
      const extraUsed = simulationLevel === 'basic' ? 0 : extraConsumo;

      const monthlyVals = useMonthlySeries
        ? monthlyConsumptionInputs.map((s) => Number(String(s).replace(",", ".")) || 0)
        : [];

      const consumoNum = useMonthlySeries ? 0 : Number(consumo.replace(",", "."));

      // Tarifas opcionais informadas pelo usuário
      const te = Number(String(tariffTE).replace(",", ".")) || 0;
      const tusd = Number(String(tariffTUSD).replace(",", ".")) || 0;
      const icms = Number(String(tariffICMS).replace(",", ".")) || 0;
      const pis = Number(String(tariffPIS).replace(",", ".")) || 0;
      const cofins = Number(String(tariffCOFINS).replace(",", ".")) || 0;
      const tariffData = (te || tusd || icms || pis || cofins)
        ? { TE: te || undefined, TUSD: tusd || undefined, taxes: { ICMS_pct: icms || undefined, PIS_pct: pis || undefined, COFINS_pct: cofins || undefined } }
        : undefined;

      const input: SimulationInput = {
        level: simulationLevel,
        lead: {
          id: selectedLeadId ?? undefined,
          name: leadName || undefined,
          email: leadEmail || undefined,
          phone: leadPhone || undefined,
          address: [addressStreet, addressNumber].filter(Boolean).join(", ") || undefined,
          city: addressCity || undefined,
          state: addressState || undefined,
          consumerClass: (leadType === "residencial" ? "residential" : leadType === "comercial" ? "commercial" : undefined) as any,
        },
        consumption: useMonthlySeries
          ? { monthly_kWh: monthlyVals }
          : { averageMonthly_kWh: consumoNum },
        consumptionDeltas: extraConsumo > 0 ? [{ label: "Novas cargas", estimated_kWh_per_month: extraUsed }] : undefined,
        technical: {
          performanceRatio_pct: prNum,
          lossesEnvironmental_pct: 0,
          lossesTechnical_pct: perdasNum,
          targetCompensation_pct: metaNum,
        },
        tariff: tariffData,
      };

      const sim = runSimulation(input);

      const monthlyForChart = (useMonthlySeries ? monthlyVals : Array(12).fill(consumoNum)).map((v) => v + extraUsed);
      setLastSimulatedMonthlyConsumption(monthlyForChart);

      const annualConsumptionUsed = monthlyForChart.reduce((a, b) => a + b, 0);
      const oversize = annualConsumptionUsed > 0
        ? Math.max(0, ((sim.annualGeneration_kWh - annualConsumptionUsed) / annualConsumptionUsed) * 100)
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
      setLastSimulationHash(currentConsumptionHash);
    } catch (err) {
      setError("Erro na simulação. Verifique os dados inseridos.");
    } finally {
      setLoading(false);
    }
  };


  const baseConsumoNum = useMemo(
    () => (consumo?.replace?.(",", ".") ? Number(consumo.replace(",", ".")) : 0),
    [consumo]
  );

  const aumentoPercent = useMemo(
    () => (baseConsumoNum > 0 ? (extraConsumptionKWhMonth / baseConsumoNum) * 100 : null),
    [baseConsumoNum, extraConsumptionKWhMonth]
  );

  const consumoTotalKWhMes = useMemo(() => baseConsumoNum + (enableExtraConsumption ? extraConsumptionKWhMonth : 0), [baseConsumoNum, enableExtraConsumption, extraConsumptionKWhMonth]);

  const currentConsumptionHash = useMemo(() => {
    const prNum = Number(pr);
    const perdasNum = Number(perdas);
    const metaNum = Number(metaCompensacao);
    const extra = enableExtraConsumption ? extraConsumptionKWhMonth : 0;
    const monthlyVals = useMonthlySeries
      ? monthlyConsumptionInputs.map((s) => Number(String(s).replace(",", ".")) || 0)
      : Array(12).fill(baseConsumoNum);

    const modules = {
      brand: modulesBrand,
      model: modulesModel,
      power: Number(modulesPower),
      qty: Number(modulesQuantity),
      eff: Number(modulesEfficiency),
    };

    const inverter = {
      brand: inverterBrand,
      model: inverterModel,
      pac: Number(inverterPowerAC),
      pdc: Number(inverterPowerDC),
      eff: Number(inverterEfficiency),
      qty: Number(inverterQuantity),
    };

    const battery = {
      enabled: Boolean(batteryEnabled),
      tech: batteryTechnology,
      capacity: Number(batteryCapacity),
      voltage: Number(batteryVoltage),
      DOD: Number(batteryDOD),
    };

    // Tarifas que impactam a simulação
    const tariff = {
      te: Number(String(tariffTE).replace(",", ".")) || 0,
      tusd: Number(String(tariffTUSD).replace(",", ".")) || 0,
      icms: Number(String(tariffICMS).replace(",", ".")) || 0,
      pis: Number(String(tariffPIS).replace(",", ".")) || 0,
      cofins: Number(String(tariffCOFINS).replace(",", ".")) || 0,
    };

    return JSON.stringify({ prNum, perdasNum, metaNum, extra, monthlyVals, modules, inverter, battery, tariff, level: simulationLevel });
  }, [pr, perdas, metaCompensacao, enableExtraConsumption, extraConsumptionKWhMonth, useMonthlySeries, monthlyConsumptionInputs, baseConsumoNum,
      modulesBrand, modulesModel, modulesPower, modulesQuantity, modulesEfficiency,
      inverterBrand, inverterModel, inverterPowerAC, inverterPowerDC, inverterEfficiency, inverterQuantity,
      batteryEnabled, batteryTechnology, batteryCapacity, batteryVoltage, batteryDOD,
      tariffTE, tariffTUSD, tariffICMS, tariffPIS, tariffCOFINS, simulationLevel]);

  const needsResimulate = useMemo(
    () => Boolean(lastSimulationHash) && currentConsumptionHash !== lastSimulationHash,
    [currentConsumptionHash, lastSimulationHash]
  );

  const monthlyConsumptionSeries = useMemo(() => {
    const extra = enableExtraConsumption ? extraConsumptionKWhMonth : 0;
    const effectiveExtra = simulationLevel === 'basic' ? 0 : extra;
    if (lastSimulatedMonthlyConsumption?.some?.((v) => v > 0)) {
      return lastSimulatedMonthlyConsumption.map((v) => v + 0); // já inclui extraUsed ao simular
    }
    const base = baseConsumoNum > 0 ? Array(12).fill(baseConsumoNum) : Array(12).fill(0);
    return base.map((v) => v + effectiveExtra);
  }, [baseConsumoNum, enableExtraConsumption, extraConsumptionKWhMonth, lastSimulatedMonthlyConsumption, simulationLevel]);

  const monthlyConsumptionTotal = useMemo(
    () => (monthlyConsumptionSeries.length ? monthlyConsumptionSeries[0] : 0),
    [monthlyConsumptionSeries]
  );

  const annualConsumptionTotal = useMemo(
    () => monthlyConsumptionSeries.reduce((a, b) => a + b, 0),
    [monthlyConsumptionSeries]
  );

  const computedOversize = useMemo(() => {
    if (!result) return null;
    const annualGen = (result.energiaGeradaMensalKWh || 0) * 12;
    if (annualConsumptionTotal <= 0) return 0;
    return Math.max(0, ((annualGen - annualConsumptionTotal) / annualConsumptionTotal) * 100);
  }, [result, annualConsumptionTotal]);

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-6">
      <div className="flex items-center gap-4">
        <div className="size-10 rounded-xl bg-[radial-gradient(circle_at_30%_30%,hsl(var(--accent)),hsl(var(--primary)))] shadow-[var(--shadow-solar)] grid place-items-center text-background">
          <Sun className="size-6" />
        </div>
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Módulo Fotovoltaico</h1>
          <p className="text-base text-muted-foreground mt-1">Experiência inspirada no projeto anterior. Simule rapidamente seu sistema solar.</p>
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2">
            <div className={cardBase}>
          <div className="mb-3">
            <h2 className="text-sm font-semibold">Dados do Lead</h2>
            <p className="text-xs text-sidebar-fg/70">Preencha dados básicos do lead (opcional). Você pode prosseguir sem preencher.</p>
          </div>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-3">
            {selectedLeadId ? (
              <div className="flex items-center gap-2 text-xs">
                <span className="inline-flex items-center gap-2 rounded-md border px-2 py-1 bg-sidebar-accent/10">
                  <span className="font-medium">Lead vinculado</span>
                  <span className="text-sidebar-fg/70">{leadName ? `${leadName}` : `(ID: ${selectedLeadId})`}</span>
                </span>
                <button
                  type="button"
                  onClick={() => { setSelectedLeadId(null); setLeadSearch(""); setLeadResults([]); setEquipItems([]); setEquipItemsCount(0); setEquipItemsKWh(0); setEquipQuickExtra(0); setEnableExtraConsumption(false); setExtraConsumptionKWhMonth(0); }}
                  className="rounded-md border px-2 py-1 text-[11px] hover:bg-sidebar-accent/10"
                >
                  Limpar vínculo
                </button>
              </div>
            ) : <div />}
            <div className="md:w-1/2 hidden">
              <label htmlFor="leadSearch" className="sr-only">Buscar lead existente</label>
              <div className="relative">
                <input
                  id="leadSearch"
                  value={leadSearch}
                  onChange={(e) => setLeadSearch(e.target.value)}
                  placeholder="Buscar lead por nome, email ou telefone"
                  className="w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent))]"
                />
                {(leadSearching || leadSearchError || leadResults.length > 0) && (
                  <div className="absolute z-20 mt-1 w-full rounded-md border bg-background shadow-lg">
                    {leadSearching && <div className="p-2 text-xs text-neutral-600">Carregando...</div>}
                    {leadSearchError && <div className="p-2 text-xs text-red-600">{leadSearchError}</div>}
                    {!leadSearching && !leadSearchError && leadResults.length > 0 && (
                      <ul className="max-h-64 overflow-auto divide-y">
                        {leadResults.map((c) => {
                          const city = (c as any)?.address?.city ?? (c as any)?.address?.addressCity ?? (c as any)?.address?.cidade ?? null;
                          const state = (c as any)?.address?.state ?? (c as any)?.address?.addressState ?? (c as any)?.address?.uf ?? null;
                          return (
                            <li key={c.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  setLeadName(c?.name ?? "");
                                  setLeadEmail(c?.email ?? "");
                                  setLeadPhone(c?.phone ?? "");
                                  setSelectedLeadId(c?.id || null);
                                  if (!consumo) {
                                    const cm: any = (c as any)?.consumoMedio;
                                    if (cm !== null && cm !== undefined && cm !== "") {
                                      setConsumo(String(cm));
                                    }
                                  }
                                  // Autopreencher série mensal a partir do consumo médio (se existir)
                                  {
                                    const cm: any = (c as any)?.consumoMedio;
                                    if (cm !== null && cm !== undefined && cm !== "") {
                                      const cmStr = String(cm);
                                      setMonthlyConsumptionInputs(Array(12).fill(cmStr));
                                    }
                                  }
                                  const addr: any = (c as any)?.address ?? {};
                                  setAddressStreet(addr.street ?? addr.logradouro ?? addr.addressStreet ?? addr.rua ?? "");
                                  setAddressNumber((addr.number ?? addr.numero ?? addr.addressNumber ?? "")?.toString?.() ?? "");
                                  setAddressComplement(addr.complement ?? addr.complemento ?? addr.addressComplement ?? "");
                                  setAddressNeighborhood(addr.neighborhood ?? addr.bairro ?? addr.addressNeighborhood ?? "");
                                  setAddressCity(addr.city ?? addr.cidade ?? addr.addressCity ?? "");
                                  setAddressState(addr.state ?? addr.uf ?? addr.addressState ?? "");
                                  setAddressZip(addr.zip ?? addr.cep ?? addr.postalCode ?? addr.addressZip ?? "");
                                  const cpfVal = (c as any)?.cpf ?? (c as any)?.document ?? (c as any)?.taxId ?? addr.cpf ?? null;
                                  if (cpfVal) setLeadCpf(String(cpfVal));
                                  setLeadSearch("");
                                  setLeadResults([]);
                                }}
                                className="w-full text-left p-2 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                              >
                                <div className="text-sm font-medium truncate">{c.name || "(Sem nome)"}</div>
                                <div className="text-xs text-neutral-600 truncate">{c.email || "—"} • {c.phone || "—"}</div>
                                {(city || state) && <div className="text-[11px] text-neutral-500 truncate">{[city, state].filter(Boolean).join(" / ")}</div>}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 mb-3">
            <button type="button" onClick={() => setShowConsumptionModal(true)} className="rounded-md border px-3 py-2 text-xs bg-sidebar-accent hover:bg-sidebar-accent/70">{enableExtraConsumption && (equipItemsCount > 0 || extraConsumptionKWhMonth > 0) ? `Aumento de Consumo (${equipItemsCount} item${equipItemsCount !== 1 ? 's' : ''} • ${extraConsumptionKWhMonth.toFixed(2)} kWh/mês)` : 'Aumento de Consumo'}</button>
            {enableExtraConsumption && (
              <span className="text-xs text-neutral-700">Extra: {extraConsumptionKWhMonth.toFixed(2)} kWh/mês</span>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col gap-1 md:col-span-2">
              <label htmlFor="leadName" className="text-sm font-medium">Nome</label>
              <div className="relative">
                <input id="leadName" className={inputBase} placeholder="Ex.: Ana Souza, email ou telefone" value={leadName} onChange={(e) => { setLeadName(e.target.value); setLeadSearch(e.target.value); }} />
                {(leadSearching || leadSearchError || leadResults.length > 0) && (
                  <div className="absolute z-20 mt-1 w-full rounded-md border bg-background shadow-lg">
                    {leadSearching && <div className="p-2 text-xs text-neutral-600">Carregando...</div>}
                    {leadSearchError && <div className="p-2 text-xs text-red-600">{leadSearchError}</div>}
                    {!leadSearching && !leadSearchError && leadResults.length > 0 && (
                      <ul className="max-h-64 overflow-auto divide-y">
                        {leadResults.map((c) => {
                          const city = (c as any)?.address?.city ?? (c as any)?.address?.addressCity ?? (c as any)?.address?.cidade ?? null;
                          const state = (c as any)?.address?.state ?? (c as any)?.address?.addressState ?? (c as any)?.address?.uf ?? null;
                          return (
                            <li key={c.id}>
                              <button
                                type="button"
                                onClick={() => {
                                  setLeadName(c?.name ?? "");
                                  setLeadEmail(c?.email ?? "");
                                  setLeadPhone(c?.phone ?? "");
                                  setSelectedLeadId(c?.id || null);
                                  if (!consumo) {
                                    const cm: any = (c as any)?.consumoMedio;
                                    if (cm !== null && cm !== undefined && cm !== "") {
                                      setConsumo(String(cm));
                                    }
                                  }
                                  {
                                    const cm: any = (c as any)?.consumoMedio;
                                    if (cm !== null && cm !== undefined && cm !== "") {
                                      const cmStr = String(cm);
                                      setMonthlyConsumptionInputs(Array(12).fill(cmStr));
                                    }
                                  }
                                  const addr: any = (c as any)?.address ?? {};
                                  setAddressStreet(addr.street ?? addr.logradouro ?? addr.addressStreet ?? addr.rua ?? "");
                                  setAddressNumber((addr.number ?? addr.numero ?? addr.addressNumber ?? "")?.toString?.() ?? "");
                                  setAddressComplement(addr.complement ?? addr.complemento ?? addr.addressComplement ?? "");
                                  setAddressNeighborhood(addr.neighborhood ?? addr.bairro ?? addr.addressNeighborhood ?? "");
                                  setAddressCity(addr.city ?? addr.cidade ?? addr.addressCity ?? "");
                                  setAddressState(addr.state ?? addr.uf ?? addr.addressState ?? "");
                                  setAddressZip(addr.zip ?? addr.cep ?? addr.postalCode ?? addr.addressZip ?? "");
                                  const cpfVal = (c as any)?.cpf ?? (c as any)?.document ?? (c as any)?.taxId ?? addr.cpf ?? null;
                                  if (cpfVal) setLeadCpf(String(cpfVal));
                                  // Carregar consumo extra de equipamentos persistido no lead
                                  const solarMeta: any = addr?.solar ?? addr?.meta?.solar ?? null;
                                  const equip = solarMeta?.equipmentConsumption ?? solarMeta?.equipConsumption ?? null;
                                  let initialItems: EquipItem[] = [];
                                  let initialQuick = 0;
                                  if (equip) {
                                    initialItems = Array.isArray(equip.items)
                                      ? equip.items.map((it: any) => ({
                                          id: it.id || Math.random().toString(36).slice(2),
                                          nome: String(it.nome || ""),
                                          potenciaW: Number(it.potenciaW) || 0,
                                          horasDia: Number(it.horasDia) || 0,
                                          diasMes: Number(it.diasMes) || 0,
                                          quantidade: Number(it.quantidade) || 0,
                                        }))
                                      : [];
                                    initialQuick = Number(equip.quickExtra) || 0;
                                  }
                                  const computedItemsKWh = initialItems.reduce(
                                    (acc, it) => acc + (it.potenciaW * it.horasDia * it.diasMes * it.quantidade) / 1000,
                                    0
                                  );
                                  setEquipItems(initialItems);
                                  setEquipItemsCount(initialItems.length);
                                  setEquipItemsKWh(computedItemsKWh);
                                  setEquipQuickExtra(initialQuick);
                                  const total = computedItemsKWh + initialQuick;
                                  setExtraConsumptionKWhMonth(total);
                                  setEnableExtraConsumption(total > 0);
                                  setLeadSearch("");
                                  setLeadResults([]);
                                }}
                                className="w-full text-left p-2 hover:bg-neutral-50 dark:hover:bg-neutral-800"
                              >
                                <div className="text-sm font-medium truncate">{c.name || "(Sem nome)"}</div>
                                <div className="text-xs text-neutral-600 truncate">{c.email || "—"} • {c.phone || "—"}</div>
                                {(city || state) && <div className="text-[11px] text-neutral-500 truncate">{[city, state].filter(Boolean).join(" / ")}</div>}
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </div>
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div className="flex flex-col gap-1">
              <label htmlFor="leadCpf" className="text-sm font-medium">CPF</label>
              <input id="leadCpf" className={inputBase} placeholder="000.000.000-00" value={leadCpf} onChange={(e) => setLeadCpf(e.target.value)} />
            </div>
          </div>
          <div className="mt-4">
            <h3 className="text-sm font-semibold mb-2">Endereço</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="flex flex-col gap-1">
                <label htmlFor="addressZip" className="text-sm font-medium">CEP</label>
              <input
                id="addressZip"
                className={inputBase}
                placeholder="00000-000"
                value={addressZip}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 8);
                  const masked = v.length > 5 ? `${v.slice(0,5)}-${v.slice(5)}` : v;
                  setAddressZip(masked);
                }}
                aria-describedby="cepHelp"
              />
              <div id="cepHelp" className="text-[11px] text-neutral-600 mt-1">
                {cepLoading ? 'Buscando endereço pelo CEP…' : (cepError ? `Erro: ${cepError}` : 'Informe o CEP para preencher endereço automaticamente')}
              </div>
              </div>
              <div className="flex flex-col gap-1 md:col-span-2">
                <label htmlFor="addressStreet" className="text-sm font-medium">Logradouro</label>
                <input id="addressStreet" className={inputBase} placeholder="Rua/Av." value={addressStreet} onChange={(e) => setAddressStreet(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="addressNumber" className="text-sm font-medium">Número</label>
                <input id="addressNumber" className={inputBase} placeholder="Nº" value={addressNumber} onChange={(e) => setAddressNumber(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1 md:col-span-2">
                <label htmlFor="addressComplement" className="text-sm font-medium">Complemento</label>
                <input id="addressComplement" className={inputBase} placeholder="Apto, Bloco, Referência" value={addressComplement} onChange={(e) => setAddressComplement(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="addressNeighborhood" className="text-sm font-medium">Bairro</label>
                <input id="addressNeighborhood" className={inputBase} placeholder="Bairro" value={addressNeighborhood} onChange={(e) => setAddressNeighborhood(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="addressCity" className="text-sm font-medium">Cidade</label>
                <input id="addressCity" className={inputBase} placeholder="Cidade" value={addressCity} onChange={(e) => setAddressCity(e.target.value)} />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="addressState" className="text-sm font-medium">Estado</label>
                <input id="addressState" className={inputBase} placeholder="UF" value={addressState} onChange={(e) => setAddressState(e.target.value)} />
              </div>
            </div>
          </div>
          <div className="flex justify-between mt-4">
            <button onClick={() => { setLeadName("" ); setLeadEmail("" ); setLeadPhone("" ); setLeadCpf("" ); setSelectedLeadId(null); setAddressStreet("" ); setAddressNumber("" ); setAddressComplement("" ); setAddressNeighborhood("" ); setAddressCity("" ); setAddressState("" ); setAddressZip("" ); setLeadType("residencial"); }} className="rounded-lg border px-4 py-2 bg-background hover:bg-sidebar-accent/10 transition-all duration-200 hover:shadow-sm">Limpar</button>
            <button onClick={handleStepComplete} className="rounded-lg border px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md flex items-center gap-2">
              <Users className="size-4" />
              Próxima
            </button>
          </div>
            </div>
          </div>
          <div className="md:col-span-1">
            <SimulationSummary
              result={result as any}
              consumoTotalKWhMes={consumoTotalKWhMes}
              needsResimulate={needsResimulate}
              currentStep={currentStep}
              stepsTotal={steps.length}
            />
          </div>
        </div>
      )}

      {currentStep === 1 && (
        <>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Coluna esquerda: Simulação Técnica */}
          <div className="md:col-span-2 space-y-6">
            {/* Card Principal: Simulação Técnica */}
            <Card className="shadow-sm border-l-4 border-l-blue-500">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    <div className="p-2 rounded-md bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                      <Settings className="size-4" />
                    </div>
                    Simulação Técnica
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => { setSimulationLevel('basic'); setShowPvsolImport(false); }}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                        simulationLevel === 'basic'
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm'
                          : 'bg-background border hover:bg-sidebar-accent/10'
                      }`}
                    >
                      Básico
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSimulationLevel('precise'); setShowPvsolImport(false); }}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all duration-200 ${
                        simulationLevel === 'precise'
                          ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-sm'
                          : 'bg-background border hover:bg-sidebar-accent/10'
                      }`}
                    >
                      Preciso
                    </button>
                    <button
                      type="button"
                      onClick={() => { setSimulationLevel('pvsol_import'); setShowPvsolImport(true); }}
                      className="px-3 py-1.5 rounded-md text-xs font-medium bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 transition-all duration-200 shadow-sm flex items-center gap-1"
                    >
                      <FileText className="size-3" />
                      Importar PV*Sol
                    </button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {showPvsolImport && (
                  <Card className="border-green-200 bg-green-50/50 dark:border-green-800 dark:bg-green-900/20">
                    <CardContent className="pt-6">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="text-sm text-muted-foreground">
                          Importe seu arquivo do PV*Sol para preencher parâmetros técnicos com maior precisão.
                        </p>
                        <button
                          type="button"
                          onClick={() => setShowPvsolImport(false)}
                          className="px-2 py-1 rounded-md text-xs font-medium bg-background border hover:bg-sidebar-accent/10"
                          aria-label="Fechar importação PV*Sol"
                        >
                          Fechar
                        </button>
                      </div>
                      {pvsolUploadInfo && (
                        <div className="mb-3 text-xs text-green-700 dark:text-green-300">
                          {pvsolUploadInfo}
                        </div>
                      )}
                      <FileUploader
                        prefix="pvsol"
                        accept=".json,.xml,.csv,.zip,application/json,text/xml,text/csv,application/zip,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
                        onUploaded={(item) => {
                          void handlePvsolUploaded(item);
                        }}
                      />
                    </CardContent>
                  </Card>
                )}

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
                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">Configuração dos Módulos Solares</CardTitle>
                            <button type="button" className="text-xs px-2 py-1 rounded border hover:bg-accent/10" onClick={() => setShowModulesManager(true)}>
                              Gerenciar
                            </button>
                          </div>
                        </CardHeader>
                        <CardContent>

                        {/* Resumo compacto */}
                        <div className="text-xs text-sidebar-fg/70 mb-3">
                          {modulesQuantity}× {modulesBrand ? modulesBrand : 'Fabricante'} {modulesModel ? modulesModel : ''} • {modulesPower} Wp • Total ≈ {((Number(modulesPower)||0)*(Number(modulesQuantity)||0)/1000).toFixed(2)} kWp
                        </div>

                        <Dialog open={showModulesManager} onOpenChange={setShowModulesManager}>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Gerenciar Módulos Solares</DialogTitle>
                              <DialogClose>Fechar</DialogClose>
                            </DialogHeader>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                  <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium">Fabricante</label>
                                    <select className={inputBase} value={modulesBrand} onChange={(e) => setModulesBrand(e.target.value)}>
                                      <option value="">Selecione o fabricante</option>
                                      {moduleBrands.map((b) => (
                                        <option key={b} value={b}>{b}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium">Modelo</label>
                                    <select className={inputBase} value={modulesModel} onChange={(e) => setModulesModel(e.target.value)}>
                                      <option value="">Selecione o modelo</option>
                                      {moduleModels.map((m) => (
                                        <option key={m.id} value={m.model}>{m.model}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium">Potência Unitária (Wp)</label>
                                    <input className={inputBase} placeholder="450" value={modulesPower} onChange={(e) => setModulesPower(e.target.value)} />
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium">Quantidade de Módulos</label>
                                    <input className={inputBase} placeholder="12" value={modulesQuantity} onChange={(e) => setModulesQuantity(e.target.value)} />
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium">Eficiência (%)</label>
                                    <input className={inputBase} placeholder="21.2" value={modulesEfficiency} readOnly />
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium">Potência Total (kWp)</label>
                                    <input className={inputBase} placeholder="5.4" value={((Number(modulesPower)||0)*(Number(modulesQuantity)||0)/1000).toFixed(2)} readOnly />
                                  </div>
                                </div>
                              </div>
                              {/* Catálogo + Criar Módulo */}
                              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h5 className="text-xs font-semibold mb-2">Catálogo de Módulos</h5>
                                  <div className="max-h-56 overflow-auto border rounded-md divide-y">
                                    {moduleOptions.length === 0 && (
                                      <div className="p-3 text-xs text-muted-foreground">Nenhum módulo cadastrado ainda.</div>
                                    )}
                                    {moduleOptions.map((m) => (
                                      <button
                                        key={m.id}
                                        type="button"
                                        className="w-full text-left p-3 hover:bg-accent/10 text-xs"
                                        onClick={() => { setModulesBrand(m.manufacturer); setModulesModel(m.model); }}
                                      >
                                        <div className="font-medium">{m.manufacturer} — {m.model}</div>
                                        <div className="text-muted-foreground">{m.powerW} Wp {m.efficiencyPerc ? `• ${Number(m.efficiencyPerc)}%` : ''}</div>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <h5 className="text-xs font-semibold mb-2">Novo Módulo</h5>
                                  <div className="space-y-2">
                                    {moduleCreateError && <div className="text-xs text-red-600">{moduleCreateError}</div>}
                                    <input className={inputBase} placeholder="Fabricante" value={newModuleManufacturer} onChange={(e)=>setNewModuleManufacturer(e.target.value)} />
                                    <input className={inputBase} placeholder="Modelo" value={newModuleModel} onChange={(e)=>setNewModuleModel(e.target.value)} />
                                    <input className={inputBase} placeholder="Potência (Wp)" value={newModulePowerW} onChange={(e)=>setNewModulePowerW(e.target.value)} />
                                    <button disabled={creatingModule} onClick={handleCreateModule} className="px-3 py-1.5 text-xs rounded-md bg-blue-600 text-white disabled:opacity-50">
                                      {creatingModule ? 'Criando…' : 'Cadastrar'}
                                    </button>
                                  </div>
                                </div>
                              </div>

                              <DialogFooter>
                                <button className="px-3 py-1.5 text-xs rounded-md bg-gradient-to-r from-blue-600 to-blue-700 text-white" onClick={() => setShowModulesManager(false)}>Concluir</button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                          <div className="flex items-center gap-2 text-sm text-blue-700 dark:text-blue-300">
                            <CheckCircle className="size-4" />
                            <span>Configuração validada: {modulesQuantity} módulos de {modulesPower}Wp = {((Number(modulesPower)||0)*(Number(modulesQuantity)||0)/1000).toFixed(2)}kWp</span>
                          </div>
                        </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="inversores" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">Configuração dos Inversores</CardTitle>
                            <button type="button" className="text-xs px-2 py-1 rounded border hover:bg-accent/10" onClick={() => setShowInvertersManager(true)}>
                              Gerenciar
                            </button>
                          </div>
                        </CardHeader>
                        <CardContent>

                        {/* Resumo compacto */}
                        <div className="text-xs text-sidebar-fg/70 mb-3">
                          {(inverterQuantity || '—')}× {(inverterBrand || 'Fabricante')} {(inverterModel || '')} • {(inverterPowerAC || '—')} kW AC • Oversize máx CC {(inverterPowerDC || '—')} kW
                        </div>

                        <Dialog open={showInvertersManager} onOpenChange={setShowInvertersManager}>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Gerenciar Inversores</DialogTitle>
                              <DialogClose>Fechar</DialogClose>
                            </DialogHeader>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-3">
                                  <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium">Fabricante</label>
                                    <select className={inputBase} value={inverterBrand} onChange={(e)=>setInverterBrand(e.target.value)}>
                                      <option value="">Selecione o fabricante</option>
                                      {inverterBrands.map((b) => (
                                        <option key={b} value={b}>{b}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium">Modelo</label>
                                    <select className={inputBase} value={inverterModel} onChange={(e)=>setInverterModel(e.target.value)}>
                                      <option value="">Selecione o modelo</option>
                                      {inverterModels.map((i) => (
                                        <option key={i.id} value={i.model}>{i.model}</option>
                                      ))}
                                    </select>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium">Potência CA (kW)</label>
                                    <input className={inputBase} placeholder="5.0" value={inverterPowerAC} onChange={(e)=>setInverterPowerAC(e.target.value)} />
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium">Potência CC Máx (kW)</label>
                                    <input className={inputBase} placeholder="7.5" value={inverterPowerDC} readOnly />
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium">Eficiência (%)</label>
                                    <input className={inputBase} placeholder="97.1" value={inverterEfficiency} readOnly />
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium">Quantidade</label>
                                    <input className={inputBase} placeholder="1" value={inverterQuantity} onChange={(e)=>setInverterQuantity(e.target.value)} />
                                  </div>
                                </div>
                              </div>
                              {/* Catálogo + Criar Inversor */}
                              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h5 className="text-xs font-semibold mb-2">Catálogo de Inversores</h5>
                                  <div className="max-h-56 overflow-auto border rounded-md divide-y">
                                    {inverterOptions.length === 0 && (
                                      <div className="p-3 text-xs text-muted-foreground">Nenhum inversor cadastrado ainda.</div>
                                    )}
                                    {inverterOptions.map((i) => (
                                      <button
                                        key={i.id}
                                        type="button"
                                        className="w-full text-left p-3 hover:bg-accent/10 text-xs"
                                        onClick={() => { setInverterBrand(i.manufacturer); setInverterModel(i.model); }}
                                      >
                                        <div className="font-medium">{i.manufacturer} — {i.model}</div>
                                        <div className="text-muted-foreground">{(i.powerW/1000).toFixed(2)} kW {i.efficiencyPerc ? `• ${Number(i.efficiencyPerc)}%` : ''} {i.mpptCount ? `• ${i.mpptCount} MPPT` : ''} {i.phases ? `• ${i.phases}` : ''}</div>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <h5 className="text-xs font-semibold mb-2">Novo Inversor</h5>
                                  <div className="space-y-2">
                                    {inverterCreateError && <div className="text-xs text-red-600">{inverterCreateError}</div>}
                                    <input className={inputBase} placeholder="Fabricante" value={newInverterManufacturer} onChange={(e)=>setNewInverterManufacturer(e.target.value)} />
                                    <input className={inputBase} placeholder="Modelo" value={newInverterModel} onChange={(e)=>setNewInverterModel(e.target.value)} />
                                    <input className={inputBase} placeholder="Potência (kW)" value={newInverterPowerKW} onChange={(e)=>setNewInverterPowerKW(e.target.value)} />
                                    <div className="grid grid-cols-3 gap-2">
                                      <input className={inputBase} placeholder="MPPTs (opcional)" value={newInverterMppt} onChange={(e)=>setNewInverterMppt(e.target.value)} />
                                      <input className={inputBase} placeholder="Eficiência % (opcional)" value={newInverterEfficiency} onChange={(e)=>setNewInverterEfficiency(e.target.value)} />
                                      <select className={inputBase} value={newInverterPhases} onChange={(e)=>setNewInverterPhases(e.target.value as any)}>
                                        <option value="MONO">MONO</option>
                                        <option value="TRIF">TRIF</option>
                                      </select>
                                    </div>
                                    <button disabled={creatingInverter} onClick={handleCreateInverter} className="px-3 py-1.5 text-xs rounded-md bg-blue-600 text-white disabled:opacity-50">
                                      {creatingInverter ? 'Criando…' : 'Cadastrar'}
                                    </button>
                                  </div>
                                </div>
                              </div>

                              <DialogFooter>
                                <button className="px-3 py-1.5 text-xs rounded-md bg-gradient-to-r from-blue-600 to-blue-700 text-white" onClick={() => setShowInvertersManager(false)}>Concluir</button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>
                        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                          <div className="flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                            <CheckCircle className="size-4" />
                            <span>Dimensionamento adequado: Oversize de 1.08 (ideal entre 1.0 - 1.3)</span>
                          </div>
                        </div>
                        </CardContent>
                      </Card>
                    </TabsContent>

                    <TabsContent value="baterias" className="space-y-4">
                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">Sistema de Armazenamento (Opcional)</CardTitle>
                            <button type="button" className="text-xs px-2 py-1 rounded border hover:bg-accent/10" onClick={() => setShowBatteriesManager(true)}>
                              Gerenciar
                            </button>
                          </div>
                        </CardHeader>
                        <CardContent>
                          {/* Resumo compacto */}
                          <div className="text-xs text-sidebar-fg/70 mb-3">
                            {batteryEnabled ? (
                              <span>
                                Resumo: {batteryTechnology || '—'} • {batteryCapacity || '—'} kWh • {batteryVoltage || '—'} V • DOD {batteryDOD || '—'}%
                              </span>
                            ) : (
                              <span>Resumo: Baterias desativadas</span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mb-3">
                            <input type="checkbox" id="enableBattery" className="rounded" checked={batteryEnabled} onChange={(e)=>setBatteryEnabled(e.target.checked)} />
                            <label htmlFor="enableBattery" className="text-sm font-medium">Incluir sistema de baterias</label>
                          </div>

                          <Dialog open={showBatteriesManager} onOpenChange={setShowBatteriesManager}>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle>Gerenciar Baterias</DialogTitle>
                                <DialogClose>Fechar</DialogClose>
                              </DialogHeader>
                              <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${batteryEnabled ? '' : 'opacity-50'}`}>
                                <div className="space-y-3">
                                  <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium">Tecnologia</label>
                                    <select className={inputBase} value={batteryTechnology} onChange={(e)=>setBatteryTechnology(e.target.value)} disabled={!batteryEnabled}>
                                      <option value="">Selecione a tecnologia</option>
                                      <option value="lithium">Lítio (LiFePO4)</option>
                                      <option value="lead-acid">Chumbo-ácido</option>
                                      <option value="gel">Gel</option>
                                    </select>
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium">Capacidade (kWh)</label>
                                    <input className={inputBase} placeholder="10" value={batteryCapacity} onChange={(e)=>setBatteryCapacity(e.target.value)} disabled={!batteryEnabled} />
                                  </div>
                                  <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium">Tensão (V)</label>
                                    <input className={inputBase} placeholder="48" value={batteryVoltage} onChange={(e)=>setBatteryVoltage(e.target.value)} disabled={!batteryEnabled} />
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  <div className="flex flex-col gap-1">
                                    <label className="text-sm font-medium">Profundidade de Descarga (%)</label>
                                    <input className={inputBase} placeholder="80" value={batteryDOD} onChange={(e)=>setBatteryDOD(e.target.value)} disabled={!batteryEnabled} />
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
                              <DialogFooter>
                                <button className="px-3 py-1.5 text-xs rounded-md bg-gradient-to-r from-blue-600 to-blue-700 text-white" onClick={() => setShowBatteriesManager(false)}>Concluir</button>
                              </DialogFooter>
                            </DialogContent>
                          </Dialog>

                          <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                            <div className="flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
                              <AlertTriangle className="size-4" />
                              <span>Sistema de baterias aumentará significativamente o investimento inicial</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
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

                  {/* Estrutura Tarifária (Opcional) */}
                  <TariffForm
                    cardClass={cardBase}
                    inputClass={inputBase}
                    values={{
                      TE: tariffTE,
                      TUSD: tariffTUSD,
                      ICMS: tariffICMS,
                      PIS: tariffPIS,
                      COFINS: tariffCOFINS,
                    }}
                    onChange={(field, val) => {
                      if (field === "TE") setTariffTE(val);
                      else if (field === "TUSD") setTariffTUSD(val);
                      else if (field === "ICMS") setTariffICMS(val);
                      else if (field === "PIS") setTariffPIS(val);
                      else if (field === "COFINS") setTariffCOFINS(val);
                    }}
                  />

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
                      {needsResimulate && (
                        <div role="status" className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">Os dados de consumo foram alterados após a última simulação. Clique em “Simular” para atualizar os resultados e os gráficos.</div>
                      )}
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="useMonthlySeries" checked={useMonthlySeries} onChange={(e) => setUseMonthlySeries(e.target.checked)} className="rounded" />
                        <label htmlFor="useMonthlySeries" className="text-sm font-medium">Usar histórico mensal (12 meses)</label>
                      </div>

                      {!useMonthlySeries ? (
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
                      ) : (
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                            {['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'].map((m, idx) => (
                              <div key={m} className="flex flex-col gap-1">
                                <label className="text-xs font-medium">{m}</label>
                                <input
                                  type="number"
                                  className={inputBase}
                                  placeholder="0"
                                  value={monthlyConsumptionInputs[idx]}
                                  onChange={(e) => {
                                    const next = [...monthlyConsumptionInputs];
                                    next[idx] = e.target.value;
                                    setMonthlyConsumptionInputs(next);
                                  }}
                                  min="0"
                                />
                              </div>
                            ))}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1">
                              <label htmlFor="pr" className="text-sm font-medium">Performance Ratio</label>
                              <input id="pr" className={inputBase} placeholder="0.75" value={pr} onChange={(e) => setPr(e.target.value)} />
                            </div>
                            <div className="flex flex-col gap-1">
                              <label htmlFor="metaCompensacao" className="text-sm font-medium">Meta de Compensação (%)</label>
                              <input id="metaCompensacao" className={inputBase} placeholder="95" value={metaCompensacao} onChange={(e) => setMetaCompensacao(e.target.value)} />
                            </div>
                          </div>
                        </div>
                      )}

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
                        <button type="button" onClick={() => { setConsumo(""); setPr("0.75"); setPerdas("15"); setMetaCompensacao("95"); setResult(null); setError(""); setUseMonthlySeries(false); setMonthlyConsumptionInputs(Array(12).fill("")); setLastSimulatedMonthlyConsumption(Array(12).fill(0)); setEnableExtraConsumption(false); setExtraConsumptionKWhMonth(0); }} className="rounded-lg border px-4 py-2 bg-background hover:bg-sidebar-accent/10 transition-all duration-200 hover:shadow-sm">Limpar</button>
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
                            <div className="flex items-center gap-1">
                              <span className="inline-block h-2 w-2 rounded-full bg-blue-500" aria-hidden />
                              Consumo (última simulação)
                              {needsResimulate && (
                                <span className="ml-1 rounded bg-amber-100 text-amber-800 px-1.5 py-0.5">dados alterados</span>
                              )}
                            </div>
                          </div>
                          <div className="grid grid-cols-12 gap-2 items-end" aria-label="Comparação mensal de geração e consumo" role="img">
                            {Array.from({ length: 12 }).map((_, idx) => {
                              const gen = result.energiaGeradaMensalKWh; // geração média mensal (modelo atual)
                              const cons = monthlyConsumptionSeries[idx] ?? 0;
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
            </CardContent>
          </Card>
            </div>

          {/* Coluna direita: Resumo da Simulação */}
          <div className="md:col-span-1">
            <SimulationSummary
              result={result as any}
              consumoTotalKWhMes={consumoTotalKWhMes}
              needsResimulate={needsResimulate}
              currentStep={currentStep}
              stepsTotal={steps.length}
            />
          </div>
        </div>

        <div className="flex justify-between mt-4">
          <button onClick={() => setCurrentStep(0)} className="rounded-md border px-4 py-2 bg-background hover:bg-sidebar-accent/10">Anterior</button>
          <button onClick={handleStepComplete} className="rounded-md border px-4 py-2 bg-sidebar-accent hover:bg-sidebar-accent/70">Próxima</button>
        </div>
         </>
       )}

       {currentStep === 2 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className="md:col-span-2">
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
            <button
              onClick={saveProposal}
              className="rounded-md border px-3 py-1.5 bg-emerald-600 text-white text-xs disabled:opacity-60"
              disabled={!result || !selectedLeadId || savingProposal}
              aria-disabled={!result || !selectedLeadId || savingProposal}
            >
              {savingProposal ? "Salvando..." : "Salvar Proposta"}
            </button>
            {selectedLeadId && (
              <Link href={`/leads/${selectedLeadId}`} target="_blank" rel="noopener noreferrer" className="rounded-md border px-3 py-1.5 bg-background text-xs">
                Abrir ficha do lead
              </Link>
            )}
            {!result && (
              <span className="text-[11px] text-sidebar-fg/70">Realize uma simulação para habilitar a proposta.</span>
            )}
          </div>
          {proposalSaveError && (
            <div role="alert" className="text-[12px] text-red-600 mb-2">{proposalSaveError}</div>
          )}
          {proposalSavedId && (
            <div className="text-[12px] text-emerald-700 mb-2">Proposta salva com sucesso! {proposalSavedId ? `ID: ${proposalSavedId}` : ""}</div>
          )}

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
      </div>
      <div className="md:col-span-1">
        <SimulationSummary
          result={result as any}
          consumoTotalKWhMes={consumoTotalKWhMes}
          needsResimulate={needsResimulate}
          currentStep={currentStep}
          stepsTotal={steps.length}
        />
      </div>
    </div>
  )}


    {showConsumptionModal && (
        <Dialog open={showConsumptionModal} onOpenChange={setShowConsumptionModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Aumento de Consumo</DialogTitle>
              <DialogClose />
            </DialogHeader>
            <EquipmentConsumption
              title="Aumento de Consumo"
              initialQuickExtra={equipQuickExtra}
              initialItems={equipItems}
              onChange={(kwh) => { setExtraConsumptionKWhMonth(kwh); setEnableExtraConsumption(kwh > 0); }}
              onChangeDetails={(details) => {
                setEquipItems(details.items);
                setEquipItemsCount(details.itemsCount);
                setEquipItemsKWh(details.totalItemsKWh);
                setEquipQuickExtra(details.quickExtra);
              }}
            />
            <DialogFooter>
              <button
                className="px-3 py-1.5 text-sm rounded-md border hover:bg-neutral-50 dark:hover:bg-neutral-800"
                onClick={() => {
                  // Zerar tudo
                  setEquipItems([]);
                  setEquipItemsCount(0);
                  setEquipItemsKWh(0);
                  setEquipQuickExtra(0);
                  setExtraConsumptionKWhMonth(0);
                  setEnableExtraConsumption(false);
                }}
              >Limpar</button>
              <button
                className="px-3 py-1.5 text-sm rounded-md bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
                onClick={async () => {
                  try {
                    setShowConsumptionModal(false);
                    if (selectedLeadId) {
                      const addressPayload: any = {
                        street: addressStreet,
                        number: addressNumber,
                        complement: addressComplement,
                        neighborhood: addressNeighborhood,
                        city: addressCity,
                        state: addressState,
                        zip: addressZip,
                        solar: {
                          equipmentConsumption: {
                            items: equipItems,
                            quickExtra: equipQuickExtra,
                          },
                        },
                      };
                      const payload: any = { address: addressPayload };
                      await fetch(`/api/contacts/${selectedLeadId}`, {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload),
                      });
                    }
                  } catch (e) {
                    console.error('Erro ao persistir equipamentos no contato', e);
                  } finally {
                    // nada a fazer
                  }
                }}
              >Concluir</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
 
     </div>
   )
 }
 
 export default Page