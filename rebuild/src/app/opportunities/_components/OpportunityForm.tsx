"use client";

import React, { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";

export type OpportunityStatus = "open" | "won" | "lost" | "archived";

export type Opportunity = {
  id?: string;
  title: string;
  status?: OpportunityStatus;
  amount?: number | null;
  contactId: string;
  ownerId?: string | null;
};

const STATUS_OPTIONS: { value: OpportunityStatus; label: string }[] = [
  { value: "open", label: "Aberta" },
  { value: "won", label: "Ganha" },
  { value: "lost", label: "Perdida" },
  { value: "archived", label: "Arquivada" },
];

type ContactOption = { id: string; name: string };

export function OpportunityForm({
  initialData,
  onSuccess,
}: {
  initialData?: Opportunity | null;
  onSuccess?: (opp: Opportunity) => void;
}) {
  const [form, setForm] = useState<Opportunity>(() => ({
    title: initialData?.title ?? "",
    status: (initialData?.status as OpportunityStatus | undefined) ?? "open",
    amount: typeof initialData?.amount === "number" ? initialData?.amount : initialData?.amount ? Number(initialData.amount) : undefined,
    contactId: initialData?.contactId ?? "",
    ownerId: initialData?.ownerId ?? undefined,
  }));

  const [contacts, setContacts] = useState<ContactOption[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);

  const isEdit = Boolean(initialData?.id);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = useMemo(() => {
    return form.title.trim().length > 0 && form.contactId && !submitting;
  }, [form.title, form.contactId, submitting]);

  useEffect(() => {
    async function loadContacts() {
      setLoadingContacts(true);
      try {
        const data = await api.get<{ data: ContactOption[]; total: number; page: number; limit: number }>(
          "/api/contacts",
          { params: { limit: 100 } }
        );
        const arr = Array.isArray(data?.data) ? data.data : [];
        setContacts(arr.map((c: any) => ({ id: (c as any).id, name: (c as any).name })));
      } catch (_) {
        setContacts([]);
      } finally {
        setLoadingContacts(false);
      }
    }
    loadContacts();
  }, []);

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) {
    const { name, value } = e.target;
    if (name === "amount") {
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
      const payload: Partial<Opportunity> = {
        title: form.title.trim(),
        status: form.status,
        amount: typeof form.amount === "number" ? form.amount : undefined,
        contactId: form.contactId,
        ownerId: form.ownerId || undefined,
      };

      const resp = await (isEdit
        ? api.patch<{ data: Opportunity }>(`/api/opportunities/${initialData?.id}`, payload)
        : api.post<{ data: Opportunity }>("/api/opportunities", payload));

      setMessage(isEdit ? "Oportunidade atualizada com sucesso" : "Oportunidade criada com sucesso");
      onSuccess?.(resp.data ?? ({} as Opportunity));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!initialData?.id) return;
    if (!confirm("Tem certeza que deseja deletar esta oportunidade?")) return;

    setSubmitting(true);
    setError(null);
    setMessage(null);
    try {
      await api.del<{ success: boolean }>(`/api/opportunities/${initialData.id}`);
      setMessage("Oportunidade deletada com sucesso");
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
        <label htmlFor="title" className="block text-sm font-medium">Título *</label>
        <input
          id="title"
          name="title"
          type="text"
          required
          value={form.title}
          onChange={handleChange}
          className="mt-1 w-full rounded border border-neutral-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="contactId" className="block text-sm font-medium">Contato *</label>
          <select
            id="contactId"
            name="contactId"
            value={form.contactId}
            onChange={handleChange}
            required
            className="mt-1 w-full rounded border border-neutral-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="" disabled>{loadingContacts ? "Carregando..." : "Selecione um contato"}</option>
            {contacts.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="status" className="block text-sm font-medium">Status</label>
          <select
            id="status"
            name="status"
            value={form.status ?? "open"}
            onChange={handleChange}
            className="mt-1 w-full rounded border border-neutral-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="amount" className="block text-sm font-medium">Valor (R$)</label>
        <input
          id="amount"
          name="amount"
          type="number"
          step="0.01"
          value={form.amount ?? ""}
          onChange={handleChange}
          className="mt-1 w-full rounded border border-neutral-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
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