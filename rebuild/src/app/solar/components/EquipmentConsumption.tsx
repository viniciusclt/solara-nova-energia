"use client";

import React from "react";
import { PlugZap } from "lucide-react";

/**
 * Componente placeholder para Consumo de Equipamentos
 * Mantém a aplicação funcional enquanto o módulo completo é implementado.
 */
export default function EquipmentConsumption(): JSX.Element {
  return (
    <section className="w-full rounded-xl border border-neutral-200 bg-white p-6 shadow-sm dark:border-neutral-800 dark:bg-neutral-900">
      <header className="mb-4 flex items-center gap-2">
        <PlugZap className="h-5 w-5 text-amber-500" aria-hidden="true" />
        <h2 className="text-lg font-semibold">Consumo de Equipamentos</h2>
      </header>

      <p className="text-sm text-neutral-600 dark:text-neutral-300">
        Este é um componente temporário para exibir o consumo de equipamentos. Em breve,
        será substituído pela versão completa com cadastro de cargas, potência, horas de uso e
        integração com a simulação.
      </p>

      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <div className="text-xs text-neutral-500">Total de Equipamentos</div>
          <div className="text-xl font-semibold">—</div>
        </div>
        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <div className="text-xs text-neutral-500">Consumo Diário Estimado</div>
          <div className="text-xl font-semibold">— kWh/dia</div>
        </div>
        <div className="rounded-lg border border-neutral-200 p-4 dark:border-neutral-800">
          <div className="text-xs text-neutral-500">Consumo Mensal Estimado</div>
          <div className="text-xl font-semibold">— kWh/mês</div>
        </div>
      </div>
    </section>
  );
}