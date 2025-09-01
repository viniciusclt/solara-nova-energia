"use client";

import React, { useEffect, useMemo, useState } from "react";
import { PlugZap, Plus, Trash2 } from "lucide-react";

// Catálogo de equipamentos padrão com categorização
export type EquipItemPreset = {
  nome: string;
  categoria:
    | "Climatização"
    | "Cozinha"
    | "Entretenimento"
    | "Iluminação"
    | "Escritório"
    | "Lavanderia"
    | "Outros";
  potenciaW: number;
  horasDia: number;
  diasMes: number;
  quantidade?: number;
};

const EQUIP_CATEGORIES: EquipItemPreset["categoria"][] = [
  "Climatização",
  "Cozinha",
  "Entretenimento",
  "Iluminação",
  "Escritório",
  "Lavanderia",
  "Outros",
];

const EQUIP_CATALOG: EquipItemPreset[] = [
  { nome: "Ar-condicionado Split 9000 BTU", categoria: "Climatização", potenciaW: 900, horasDia: 8, diasMes: 22 },
  { nome: "Ar-condicionado Split 12000 BTU", categoria: "Climatização", potenciaW: 1200, horasDia: 6, diasMes: 22 },
  { nome: "Ventilador de teto", categoria: "Climatização", potenciaW: 120, horasDia: 6, diasMes: 30 },

  { nome: "Geladeira frost-free", categoria: "Cozinha", potenciaW: 120, horasDia: 24, diasMes: 30 },
  { nome: "Micro-ondas", categoria: "Cozinha", potenciaW: 1400, horasDia: 0.5, diasMes: 30 },
  { nome: "Cooktop elétrico (boca)", categoria: "Cozinha", potenciaW: 1500, horasDia: 0.7, diasMes: 30 },

  { nome: "TV LED 50 pol", categoria: "Entretenimento", potenciaW: 120, horasDia: 4, diasMes: 30 },
  { nome: "Videogame/Console", categoria: "Entretenimento", potenciaW: 180, horasDia: 2, diasMes: 20 },
  { nome: "Soundbar", categoria: "Entretenimento", potenciaW: 60, horasDia: 2, diasMes: 20 },

  { nome: "Lâmpada LED 9W", categoria: "Iluminação", potenciaW: 9, horasDia: 5, diasMes: 30, quantidade: 6 },
  { nome: "Refletor LED 50W", categoria: "Iluminação", potenciaW: 50, horasDia: 4, diasMes: 30 },

  { nome: "Notebook", categoria: "Escritório", potenciaW: 65, horasDia: 6, diasMes: 22 },
  { nome: "Desktop + Monitor", categoria: "Escritório", potenciaW: 200, horasDia: 8, diasMes: 22 },
  { nome: "Impressora", categoria: "Escritório", potenciaW: 25, horasDia: 1, diasMes: 15 },

  { nome: "Máquina de lavar roupa", categoria: "Lavanderia", potenciaW: 500, horasDia: 1, diasMes: 15 },
  { nome: "Secadora de roupas", categoria: "Lavanderia", potenciaW: 1500, horasDia: 1, diasMes: 10 },

  { nome: "Carregador de celular", categoria: "Outros", potenciaW: 12, horasDia: 2, diasMes: 30, quantidade: 2 },
  { nome: "Bomba d'água", categoria: "Outros", potenciaW: 750, horasDia: 1, diasMes: 30 },
];

/**
 * Componente placeholder para Consumo de Equipamentos
 * Mantém a aplicação funcional enquanto o módulo completo é implementado.
 */
export type EquipItem = {
  id: string;
  nome: string;
  potenciaW: number;
  horasDia: number;
  diasMes: number;
  quantidade: number;
};

export default function EquipmentConsumption({
  onChange,
  onChangeDetails,
  title = "Consumo de Equipamentos",
  initialQuickExtra = 0,
  initialItems = [],
}: {
  onChange?: (kwhPerMonth: number) => void;
  onChangeDetails?: (details: {
    totalExtra: number;
    itemsCount: number;
    items: EquipItem[];
    quickExtra: number;
    totalItemsKWh: number;
  }) => void;
  title?: string;
  initialQuickExtra?: number;
  initialItems?: EquipItem[];
}): JSX.Element {
  // Estado para estimativa rápida (kWh/mês)
  const [quickExtra, setQuickExtra] = useState<number>(0);

  // Estado para formulário de nova carga
  const [nome, setNome] = useState("");
  const [potenciaW, setPotenciaW] = useState<string>("");
  const [horasDia, setHorasDia] = useState<string>("");
  const [diasMes, setDiasMes] = useState<string>("");
  const [quantidade, setQuantidade] = useState<string>("1");

  const [items, setItems] = useState<EquipItem[]>([]);

  // Catálogo: filtros e busca
  const [categoriaAtiva, setCategoriaAtiva] = useState<EquipItemPreset["categoria"] | null>(null);
  const [busca, setBusca] = useState("");

  const catalogoFiltrado = useMemo(() => {
    const byCat = categoriaAtiva ? EQUIP_CATALOG.filter((c) => c.categoria === categoriaAtiva) : EQUIP_CATALOG;
    const term = busca.trim().toLowerCase();
    if (!term) return byCat;
    return byCat.filter((c) => c.nome.toLowerCase().includes(term));
  }, [categoriaAtiva, busca]);

  function addPreset(p: EquipItemPreset) {
    setItems((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).slice(2),
        nome: p.nome,
        potenciaW: p.potenciaW,
        horasDia: p.horasDia,
        diasMes: p.diasMes,
        quantidade: p.quantidade ?? 1,
      },
    ]);
  }

  // Inicialização a partir das props (quando lead mudar ou modal abrir)
  useEffect(() => {
    setQuickExtra(Number.isFinite(initialQuickExtra) ? Number(initialQuickExtra) : 0);
    setItems(Array.isArray(initialItems) ? initialItems : []);
  }, [initialQuickExtra, initialItems]);

  const itemsMonthlyKWh = useMemo(
    () =>
      items.map((it) => ({
        id: it.id,
        kwh: (it.potenciaW * it.horasDia * it.diasMes * it.quantidade) / 1000,
      })),
    [items]
  );

  const totalItemsKWh = useMemo(() => itemsMonthlyKWh.reduce((acc, cur) => acc + cur.kwh, 0), [itemsMonthlyKWh]);
  const totalExtra = useMemo(() => Math.max(0, (Number.isFinite(quickExtra) ? quickExtra : 0) + totalItemsKWh), [quickExtra, totalItemsKWh]);

  useEffect(() => {
    onChange?.(totalExtra);
    onChangeDetails?.({
      totalExtra,
      itemsCount: items.length,
      items,
      quickExtra: Number.isFinite(quickExtra) ? quickExtra : 0,
      totalItemsKWh,
    });
  }, [totalExtra, totalItemsKWh, items, quickExtra, onChange, onChangeDetails]);

  function addItem() {
    if (!nome.trim()) return;
    const p = Number(potenciaW.replace(",", "."));
    const h = Number(horasDia.replace(",", "."));
    const d = Number(diasMes.replace(",", "."));
    const q = Number(quantidade.replace(",", "."));
    if (!Number.isFinite(p) || !Number.isFinite(h) || !Number.isFinite(d) || !Number.isFinite(q)) return;
    setItems((prev) => [
      ...prev,
      { id: Math.random().toString(36).slice(2), nome, potenciaW: p, horasDia: h, diasMes: d, quantidade: q },
    ]);
    setNome("");
    setPotenciaW("");
    setHorasDia("");
    setDiasMes("");
    setQuantidade("1");
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  function clearAllItems() {
    setItems([]);
  }

  function clearAll() {
    setQuickExtra(0);
    setItems([]);
  }

  return (
    <section className="w-full rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <header className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <PlugZap className="h-5 w-5 text-[hsl(var(--accent))]" aria-hidden="true" />
          <h2 className="text-lg font-semibold">{title}</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-sm font-medium">Extra total: {totalExtra.toFixed(2)} kWh/mês</div>
          <button type="button" onClick={clearAll} className="text-xs rounded-md border px-2 py-1 hover:bg-neutral-50 dark:hover:bg-neutral-800">Limpar</button>
        </div>
      </header>

      <p className="text-sm text-neutral-600 dark:text-neutral-300">
        Você pode usar a estimativa rápida (kWh/mês) ou cadastrar cargas para obter um cálculo mais preciso. Ambos são somados no extra mensal.
      </p>

      {/* Cards resumo */}
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <div className="text-xs text-neutral-500">Total de Equipamentos</div>
          <div className="text-xl font-semibold">{items.length}</div>
        </div>
        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <div className="text-xs text-neutral-500">kWh/mês (cargas)</div>
          <div className="text-xl font-semibold">{totalItemsKWh.toFixed(2)}</div>
        </div>
        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <div className="text-xs text-neutral-500">Estimativa rápida</div>
          <div className="text-xl font-semibold">{quickExtra.toFixed(2)} kWh/mês</div>
        </div>
      </div>

      {/* Estimativa rápida */}
      <div className="mt-6">
        <label htmlFor="equip-extra" className="text-sm font-medium">Estimativa rápida (kWh/mês)</label>
        <input
          id="equip-extra"
          type="number"
          step="0.01"
          className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent))]"
          value={Number.isFinite(quickExtra) ? quickExtra : 0}
          onChange={(e) => setQuickExtra(Number(e.target.value))}
          placeholder="Ex.: 120"
          aria-describedby="equip-extra-help"
        />
        <div id="equip-extra-help" className="mt-1 text-[11px] text-neutral-600">Informe um valor estimado do aumento de consumo mensal.</div>
      </div>

      {/* Catálogo de equipamentos com grid responsiva e filtros */}
      <div className="mt-6">
        <h3 className="text-sm font-semibold mb-2">Catálogo de equipamentos</h3>
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {EQUIP_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategoriaAtiva(cat)}
                className={
                  `rounded-full border px-3 py-1 text-xs ${categoriaAtiva === cat ? "bg-[hsl(var(--accent))] text-white border-[hsl(var(--accent))]" : "hover:bg-neutral-50 dark:hover:bg-neutral-800"}`
                }
              >{cat}</button>
            ))}
            <button type="button" onClick={() => setCategoriaAtiva(null)} className="rounded-full border px-3 py-1 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800">Todas</button>
          </div>
          <div className="max-w-xs w-full">
            <input
              type="text"
              className="w-full rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="Buscar equipamento..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
            />
          </div>
        </div>

        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
          {catalogoFiltrado.map((preset) => {
            const qtd = preset.quantidade ?? 1;
            const kwh = (preset.potenciaW * preset.horasDia * preset.diasMes * qtd) / 1000;
            // Indicador de impacto: baixo (<30), médio (30-100), alto (>100) kWh/mês
            const impacto = kwh > 100 ? "alto" : kwh > 30 ? "medio" : "baixo";
            return (
              <div key={`${preset.nome}-${preset.categoria}`} className="rounded-lg border p-3 hover:shadow-sm">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-medium">{preset.nome}</div>
                    <div className="text-[11px] text-neutral-600">{preset.categoria} • {preset.potenciaW} W • {preset.horasDia} h/d • {preset.diasMes} d/mês</div>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${impacto === "alto" ? "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" : impacto === "medio" ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300" : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300"}`}>
                    {impacto === "alto" ? "Alto" : impacto === "medio" ? "Médio" : "Baixo"}
                  </span>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-sm font-semibold">{kwh.toFixed(2)} kWh/mês</div>
                  <button
                    type="button"
                    onClick={() => addPreset(preset)}
                    className="inline-flex items-center gap-1 rounded-md border bg-sidebar-accent px-2 py-1 text-xs hover:bg-sidebar-accent/70"
                  >
                    <Plus className="h-3 w-3" /> Adicionar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Cadastro de cargas manual */}
      <div className="mt-8">
        <h3 className="text-sm font-semibold mb-2">Cadastrar cargas manualmente</h3>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
          <div className="md:col-span-2">
            <label className="text-sm">Nome</label>
            <input className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex.: Ar-condicionado" />
          </div>
          <div>
            <label className="text-sm">Potência (W)</label>
            <input className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={potenciaW} onChange={(e) => setPotenciaW(e.target.value)} placeholder="900" />
          </div>
          <div>
            <label className="text-sm">Horas/dia</label>
            <input className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={horasDia} onChange={(e) => setHorasDia(e.target.value)} placeholder="8" />
          </div>
          <div>
            <label className="text-sm">Dias/mês</label>
            <input className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={diasMes} onChange={(e) => setDiasMes(e.target.value)} placeholder="22" />
          </div>
          <div>
            <label className="text-sm">Quantidade</label>
            <input className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} placeholder="1" />
          </div>
          <div className="md:col-span-5 flex items-center gap-2">
            <button type="button" onClick={addItem} className="inline-flex items-center gap-1 rounded-md border bg-sidebar-accent px-3 py-2 text-sm hover:bg-sidebar-accent/70">
              <Plus className="h-4 w-4" /> Adicionar
            </button>
            {items.length > 0 && (
              <button type="button" onClick={clearAllItems} className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800">
                Limpar todos
              </button>
            )}
          </div>
        </div>

        {items.length > 0 && (
          <div className="mt-4">
            <h4 className="mb-2 text-sm font-medium">Itens</h4>
            <ul className="divide-y divide-neutral-200 rounded-md border border-neutral-200 dark:divide-neutral-800 dark:border-neutral-800">
              {items.map((it) => (
                <li key={it.id} className="flex items-center justify-between gap-2 p-2">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{it.nome}</div>
                    <div className="text-xs text-neutral-600">{it.quantidade}x • {it.potenciaW} W • {it.horasDia} h/dia • {it.diasMes} d/mês</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-sm font-semibold">{((it.potenciaW * it.horasDia * it.diasMes * it.quantidade) / 1000).toFixed(2)} kWh/mês</div>
                    <button onClick={() => removeItem(it.id)} className="rounded-md border px-2 py-1 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800" aria-label="Remover">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </section>
  );
}