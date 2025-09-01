"use client";

import React from "react";
import { DollarSign } from "lucide-react";

export type TariffFields = "TE" | "TUSD" | "ICMS" | "PIS" | "COFINS";

type TariffFormProps = {
  cardClass: string;
  inputClass: string;
  values: {
    TE: string;
    TUSD: string;
    ICMS: string;
    PIS: string;
    COFINS: string;
  };
  onChange: (field: TariffFields, value: string) => void;
};

export default function TariffForm({ cardClass, inputClass, values, onChange }: TariffFormProps) {
  return (
    <div className={cardClass}>
      <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
        <DollarSign className="size-4 text-emerald-600" />
        Estrutura Tarifária (Opcional)
      </h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">TE (R$/kWh)</label>
            <input
              className={inputClass}
              placeholder="0,45"
              value={values.TE}
              onChange={(e) => onChange("TE", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">TUSD (R$/kWh)</label>
            <input
              className={inputClass}
              placeholder="0,20"
              value={values.TUSD}
              onChange={(e) => onChange("TUSD", e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">ICMS (%)</label>
            <input
              className={inputClass}
              placeholder="25"
              value={values.ICMS}
              onChange={(e) => onChange("ICMS", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">PIS (%)</label>
            <input
              className={inputClass}
              placeholder="1,65"
              value={values.PIS}
              onChange={(e) => onChange("PIS", e.target.value)}
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">COFINS (%)</label>
            <input
              className={inputClass}
              placeholder="7,60"
              value={values.COFINS}
              onChange={(e) => onChange("COFINS", e.target.value)}
            />
          </div>
        </div>
      </div>
      <p className="text-xs text-sidebar-fg/70 mt-2">
        Preencha apenas se desejar personalizar a tarifa efetiva. Se deixado em branco, utilizaremos um valor padrão.
      </p>
    </div>
  );
}