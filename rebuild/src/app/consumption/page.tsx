"use client";

import { useMemo, useState } from "react";

type Device = {
  id: string;
  type: string;
  powerWatts: number; // W
  hoursPerDay: number; // h/day
  daysPerMonth: number; // days/month
  monthsPerYear: number; // months/year
};

const uid = () => Math.random().toString(36).slice(2, 10);

const createDefaultDevice = (): Device => ({
  id: uid(),
  type: "",
  powerWatts: 0,
  hoursPerDay: 0,
  daysPerMonth: 30,
  monthsPerYear: 12,
});

function clampNonNegative(n: number) {
  if (Number.isNaN(n) || !Number.isFinite(n)) return 0;
  return n < 0 ? 0 : n;
}

function asNumber(value: string, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function computeKWhPerDay(device: Device) {
  // kWh/day = (W * h/day) / 1000
  return (device.powerWatts * device.hoursPerDay) / 1000;
}

function computeKWhPerMonth(device: Device) {
  return computeKWhPerDay(device) * device.daysPerMonth;
}

function computeKWhPerYear(device: Device) {
  return computeKWhPerMonth(device) * device.monthsPerYear;
}

function numberInputProps(min = 0, step = 1) {
  return {
    inputMode: "decimal" as const,
    min,
    step,
    className:
      "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200",
  };
}

function textInputProps() {
  return {
    className:
      "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-200",
  };
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <h2 className="mb-3 text-lg font-semibold text-gray-800">{title}</h2>
      <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">{children}</div>
    </section>
  );
}

function DeviceRow({
  device,
  onChange,
  onRemove,
  index,
}: {
  device: Device;
  index: number;
  onChange: (next: Device) => void;
  onRemove: () => void;
}) {
  const kwhDay = useMemo(() => computeKWhPerDay(device), [device]);
  const kwhMonth = useMemo(() => computeKWhPerMonth(device), [device]);
  const kwhYear = useMemo(() => computeKWhPerYear(device), [device]);

  const idPrefix = `device-${device.id}`;

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-7 md:items-end">
      <div>
        <label htmlFor={`${idPrefix}-type`} className="mb-1 block text-xs font-medium text-gray-700">
          Tipo do dispositivo
        </label>
        <input
          id={`${idPrefix}-type`}
          aria-label={`Tipo do dispositivo #${index + 1}`}
          {...textInputProps()}
          placeholder="Ex.: Ar-condicionado"
          value={device.type}
          onChange={(e) => onChange({ ...device, type: e.target.value })}
        />
      </div>

      <div>
        <label htmlFor={`${idPrefix}-power`} className="mb-1 block text-xs font-medium text-gray-700">
          Potência (W)
        </label>
        <input
          id={`${idPrefix}-power`}
          aria-label={`Potência em watts do dispositivo #${index + 1}`}
          type="number"
          {...numberInputProps(0, 1)}
          value={device.powerWatts}
          onChange={(e) =>
            onChange({ ...device, powerWatts: clampNonNegative(asNumber(e.target.value)) })
          }
        />
      </div>

      <div>
        <label htmlFor={`${idPrefix}-hours`} className="mb-1 block text-xs font-medium text-gray-700">
          Horas/dia
        </label>
        <input
          id={`${idPrefix}-hours`}
          aria-label={`Horas por dia do dispositivo #${index + 1}`}
          type="number"
          {...numberInputProps(0, 0.25)}
          value={device.hoursPerDay}
          onChange={(e) =>
            onChange({ ...device, hoursPerDay: clampNonNegative(asNumber(e.target.value)) })
          }
        />
      </div>

      <div>
        <label htmlFor={`${idPrefix}-days`} className="mb-1 block text-xs font-medium text-gray-700">
          Dias/mês
        </label>
        <input
          id={`${idPrefix}-days`}
          aria-label={`Dias por mês do dispositivo #${index + 1}`}
          type="number"
          {...numberInputProps(0, 1)}
          value={device.daysPerMonth}
          onChange={(e) =>
            onChange({ ...device, daysPerMonth: clampNonNegative(asNumber(e.target.value)) })
          }
        />
      </div>

      <div>
        <label htmlFor={`${idPrefix}-months`} className="mb-1 block text-xs font-medium text-gray-700">
          Meses/ano
        </label>
        <input
          id={`${idPrefix}-months`}
          aria-label={`Meses por ano do dispositivo #${index + 1}`}
          type="number"
          {...numberInputProps(0, 1)}
          value={device.monthsPerYear}
          onChange={(e) =>
            onChange({ ...device, monthsPerYear: clampNonNegative(asNumber(e.target.value)) })
          }
        />
      </div>

      <div className="md:col-span-2">
        <div className="grid grid-cols-3 gap-2 text-center text-xs">
          <div className="rounded-md bg-gray-50 p-2">
            <div className="text-[10px] uppercase text-gray-500">kWh/dia</div>
            <div className="font-semibold text-gray-800">{kwhDay.toFixed(2)}</div>
          </div>
          <div className="rounded-md bg-gray-50 p-2">
            <div className="text-[10px] uppercase text-gray-500">kWh/mês</div>
            <div className="font-semibold text-gray-800">{kwhMonth.toFixed(2)}</div>
          </div>
          <div className="rounded-md bg-gray-50 p-2">
            <div className="text-[10px] uppercase text-gray-500">kWh/ano</div>
            <div className="font-semibold text-gray-800">{kwhYear.toFixed(2)}</div>
          </div>
        </div>
      </div>

      <div className="md:col-span-7">
        <button
          type="button"
          onClick={onRemove}
          className="mt-2 inline-flex items-center justify-center rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-red-200"
          aria-label={`Remover dispositivo #${index + 1}`}
        >
          Remover dispositivo
        </button>
      </div>

      <div className="md:col-span-7 h-px bg-gray-200" aria-hidden="true" />
    </div>
  );
}

export default function ConsumptionPage() {
  const [devices, setDevices] = useState<Device[]>([createDefaultDevice()]);

  const totals = useMemo(() => {
    const totalDay = devices.reduce((acc, d) => acc + computeKWhPerDay(d), 0);
    const totalMonth = devices.reduce((acc, d) => acc + computeKWhPerMonth(d), 0);
    const totalYear = devices.reduce((acc, d) => acc + computeKWhPerYear(d), 0);
    return { totalDay, totalMonth, totalYear };
  }, [devices]);

  const updateDevice = (id: string, updater: (d: Device) => Device) => {
    setDevices((prev) => prev.map((d) => (d.id === id ? updater(d) : d)));
  };

  const removeDevice = (id: string) => {
    setDevices((prev) => (prev.length === 1 ? prev : prev.filter((d) => d.id !== id)));
  };

  const addDevice = () => setDevices((prev) => [...prev, createDefaultDevice()]);

  return (
    <main className="mx-auto max-w-5xl px-4 py-6">
      <h1 className="mb-6 text-2xl font-bold tracking-tight text-gray-900">
        Rastreamento de Consumo de Equipamentos
      </h1>

      <Section title="Dispositivos">
        <div className="space-y-4">
          {devices.map((device, idx) => (
            <DeviceRow
              key={device.id}
              device={device}
              index={idx}
              onChange={(next) => updateDevice(device.id, () => next)}
              onRemove={() => removeDevice(device.id)}
            />
          ))}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={addDevice}
              className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-200"
            >
              Adicionar dispositivo
            </button>
          </div>
        </div>
      </Section>

      <Section title="Resumo">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <div className="rounded-md bg-blue-50 p-4">
            <div className="text-xs uppercase text-blue-700">Total kWh/dia</div>
            <div className="text-2xl font-semibold text-blue-900">{totals.totalDay.toFixed(2)}</div>
          </div>
          <div className="rounded-md bg-emerald-50 p-4">
            <div className="text-xs uppercase text-emerald-700">Total kWh/mês</div>
            <div className="text-2xl font-semibold text-emerald-900">{totals.totalMonth.toFixed(2)}</div>
          </div>
          <div className="rounded-md bg-amber-50 p-4">
            <div className="text-xs uppercase text-amber-700">Total kWh/ano</div>
            <div className="text-2xl font-semibold text-amber-900">{totals.totalYear.toFixed(2)}</div>
          </div>
        </div>
      </Section>

      <p className="mt-4 text-xs text-gray-500">
        Dica: Preencha os campos de potência (W) e uso para ver os cálculos atualizarem em tempo real.
      </p>
    </main>
  );
}