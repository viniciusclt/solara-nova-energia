"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sun, Zap, TrendingUp, Target, DollarSign, PiggyBank, AlertTriangle } from "lucide-react";
import { cardBase, semantic } from "@/styles/tokens";
import React from "react";

export interface SimulationResultUI {
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

interface Props {
  result: SimulationResultUI | null;
  consumoTotalKWhMes: number;
  needsResimulate?: boolean;
  currentStep?: number;
  stepsTotal?: number;
}

export default function SimulationSummary({ result, consumoTotalKWhMes, needsResimulate, currentStep, stepsTotal }: Props) {
  if (!result) {
    return (
      <div className={`${cardBase} text-sm text-sidebar-fg/80`}>
        <p>Preencha os dados e clique em Simular para ver o resumo aqui.</p>
      </div>
    );
  }

  const progressPct = typeof currentStep === "number" && typeof stepsTotal === "number" && stepsTotal > 0
    ? Math.min(100, Math.round(((currentStep + 1) / stepsTotal) * 100))
    : undefined;

  const genQuality = result.compensacaoPercent >= 95 ? {
    label: "Geração Ideal",
    cls: semantic.successBadge,
  } : result.compensacaoPercent >= 80 ? {
    label: "Geração Boa",
    cls: semantic.warningBadge,
  } : {
    label: "Geração Baixa",
    cls: semantic.dangerBadge,
  };

  const compQuality = result.compensacaoPercent >= 95 ? {
    label: "Excelente",
    cls: semantic.successBadge,
  } : result.compensacaoPercent >= 80 ? {
    label: "Bom",
    cls: semantic.warningBadge,
  } : {
    label: "Insuficiente",
    cls: semantic.dangerBadge,
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-md bg-amber-100 dark:bg-amber-900/30">
              <Sun className="size-4 text-amber-600 dark:text-amber-400" />
            </div>
            <CardTitle className="text-base">Resumo da Simulação</CardTitle>
          </div>
          {typeof progressPct === "number" && (
            <div className="min-w-24 text-right">
              <div className="text-[10px] font-medium text-sidebar-fg/60">Progresso</div>
              <div className="h-1.5 w-24 bg-neutral-200 dark:bg-neutral-800 rounded-full overflow-hidden" aria-label="Progresso das etapas">
                <div
                  className="h-full bg-blue-600 dark:bg-blue-500"
                  style={{ width: `${progressPct}%` }}
                  role="progressbar"
                  aria-valuenow={progressPct}
                  aria-valuemin={0}
                  aria-valuemax={100}
                />
              </div>
              <div className="text-[10px] text-sidebar-fg/60 mt-1" aria-hidden>{progressPct}%</div>
            </div>
          )}
        </div>
        {needsResimulate && (
          <div role="status" className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-2 text-xs text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200 flex items-center gap-2">
            <AlertTriangle className="size-3" />
            Os dados de consumo foram alterados após a última simulação. Clique em “Simular” para atualizar os resultados e os gráficos.
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
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
              <span className={semantic.infoBadge}>Sistema Dimensionado</span>
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
              <span className={genQuality.cls}>{genQuality.label}</span>
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
              <span className={compQuality.cls}>{compQuality.label}</span>
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
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">Por mês</span>
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
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">12 meses</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="p-3 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
            <div className="text-xs text-gray-600 font-medium">Consumo base + extra</div>
            <div className="text-base font-bold text-gray-900">{consumoTotalKWhMes.toFixed(2)} kWh/mês</div>
          </div>
          <div className="p-3 rounded-lg bg-gradient-to-br from-gray-50 to-gray-100 border border-gray-200">
            <div className="text-xs text-gray-600 font-medium">Fio B (Ano 1)</div>
            <div className="text-base font-bold text-gray-900">{result.detalhes?.fioBPercentYear1}%</div>
          </div>
        </div>

        {Array.isArray(result?.detalhes?.notas) && result.detalhes!.notas!.length > 0 && (
          <ul className="mt-3 list-disc pl-5 text-xs text-sidebar-fg/70">
            {result.detalhes!.notas!.map((n: string, i: number) => (
              <li key={i}>{n}</li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}