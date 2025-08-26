"use client";

import React, { useMemo, useState } from "react";
import { api } from "@/lib/api";

export type Contact = {
  id?: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  consumoMedio?: number | null;
  status?: ContactStatus;
  address?: unknown;
  ownerId?: string | null;
};

export type ContactStatus =
  | "new"
  | "contacted"
  | "qualified"
  | "proposal_won"
  | "proposal_lost"
  | "archived";

const STATUS_OPTIONS: { value: ContactStatus; label: string }[] = [
  { value: "new", label: "Novo" },
  { value: "contacted", label: "Contactado" },
  { value: "qualified", label: "Qualificado" },
  { value: "proposal_won", label: "Proposta Ganha" },
  { value: "proposal_lost", label: "Proposta Perdida" },
  { value: "archived", label: "Arquivado" },
];

export function ContactForm({
  initialData,
  onSuccess,
}: {
  initialData?: Contact | null;
  onSuccess?: (contact: Contact) => void;
}) {
  const [form, setForm] = useState<Contact>(() => ({
    name: initialData?.name ?? "",
    email: initialData?.email ?? "",
    phone: initialData?.phone ?? "",
    consumoMedio:
      typeof initialData?.consumoMedio === "number"
        ? initialData?.consumoMedio
        : initialData?.consumoMedio
        ? Number(initialData?.consumoMedio)
        : undefined,
    status: (initialData?.status as ContactStatus | undefined) ?? "new",
    address: initialData?.address ?? undefined,
    ownerId: initialData?.ownerId ?? undefined,
  }));

  const isEdit = Boolean(initialData?.id);

  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return form.name.trim().length > 0 && !submitting;
  }, [form.name, submitting]);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    if (name === "consumoMedio") {
      setForm((prev) => ({ ...prev, [name]: value === "" ? undefined : Number(value) }));
      return;
    }
    setForm((prev) => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setMessage(null);

    try {
      const payload: Partial<Contact> = {
        name: form.name.trim(),
        email: form.email || undefined,
        phone: form.phone || undefined,
        consumoMedio: typeof form.consumoMedio === "number" ? form.consumoMedio : undefined,
        status: form.status,
        address: form.address,
        ownerId: form.ownerId || undefined,
      };

      const resp = await (isEdit
        ? api.patch<{ data: Contact }>(`/api/contacts/${initialData?.id}`, payload)
        : api.post<{ data: Contact }>("/api/contacts", payload));

      setMessage(isEdit ? "Contato atualizado com sucesso" : "Contato criado com sucesso");
      onSuccess?.(resp.data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!initialData?.id) return;
    if (!confirm("Tem certeza que deseja deletar este contato?")) return;

    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      await api.del<{ success: boolean }>(`/api/contacts/${initialData.id}`);
      setMessage("Contato deletado com sucesso");
      onSuccess?.(initialData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl" aria-busy={submitting}>
      <div>
        <label htmlFor="name" className="block text-sm font-medium">Nome *</label>
        <input
          id="name"
          name="name"
          type="text"
          required
          value={form.name}
          onChange={handleChange}
          className="mt-1 w-full rounded border border-neutral-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email ?? ""}
            onChange={handleChange}
            className="mt-1 w-full rounded border border-neutral-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-medium">Telefone</label>
          <input
            id="phone"
            name="phone"
            type="text"
            value={form.phone ?? ""}
            onChange={handleChange}
            className="mt-1 w-full rounded border border-neutral-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="consumoMedio" className="block text-sm font-medium">Consumo Médio (kWh)</label>
          <input
            id="consumoMedio"
            name="consumoMedio"
            type="number"
            step="0.01"
            value={form.consumoMedio ?? ""}
            onChange={handleChange}
            className="mt-1 w-full rounded border border-neutral-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium">Status</label>
          <select
            id="status"
            name="status"
            value={form.status ?? "new"}
            onChange={handleChange}
            className="mt-1 w-full rounded border border-neutral-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="submit"
          disabled={!canSubmit}
          className="inline-flex items-center rounded bg-blue-600 px-4 py-2 text-white disabled:opacity-50"
        >
          {submitting ? (isEdit ? "Salvando..." : "Criando...") : isEdit ? "Salvar" : "Criar"}
        </button>
        {isEdit && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={submitting}
            className="inline-flex items-center rounded bg-red-600 px-4 py-2 text-white disabled:opacity-50"
          >
            Deletar
          </button>
        )}
      </div>

      <div className="min-h-6" aria-live="polite">
        {message && <p className="text-green-700 text-sm">{message}</p>}
        {error && <p className="text-red-700 text-sm">{error}</p>}
      </div>
    </form>
  );
}