"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { api } from "@/lib/api";

type Lead = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
  createdAt?: string;
};

// Status suportados na API
const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "new", label: "Novo" },
  { value: "contacted", label: "Contactado" },
  { value: "qualified", label: "Qualificado" },
  { value: "proposal_won", label: "Proposta Ganha" },
  { value: "proposal_lost", label: "Proposta Perdida" },
  { value: "archived", label: "Arquivado" },
];

export default function LeadsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "10")));
  const status = searchParams.get("status") ?? "";

  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<{ data: Lead[]; total: number; page: number; limit: number }>(
        "/api/leads",
        { params: { page, limit, status: status || undefined } }
      );
      setLeads(data.data);
      setTotal(data.total);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, status]);

  function updateQuery(next: Partial<{ page: number; limit: number; status: string }> = {}) {
    const qs = new URLSearchParams(searchParams.toString());
    if (next.page !== undefined) qs.set("page", String(next.page));
    if (next.limit !== undefined) qs.set("limit", String(next.limit));
    if (next.status !== undefined) {
      if (next.status) qs.set("status", next.status);
      else qs.delete("status");
      // reset pagina quando mudar filtro
      qs.set("page", "1");
    }
    router.replace(`/leads?${qs.toString()}`);
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(total, page * limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Leads</h1>
        <div className="flex items-center gap-2">
          <button onClick={load} className="rounded-md border border-sidebar-border bg-sidebar-accent px-3 py-1 hover:bg-sidebar-accent/70">Recarregar</button>
          <Link href="/leads/new" className="rounded-md bg-primary px-3 py-1 text-primary-foreground">Novo Contato</Link>
        </div>
      </div>

      {/* Filtros */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-wrap gap-3">
          <div>
            <label htmlFor="status" className="block text-sm font-medium">Status</label>
            <select
              id="status"
              value={status}
              onChange={(e) => updateQuery({ status: e.target.value })}
              className="mt-1 w-52 rounded border border-neutral-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="limit" className="block text-sm font-medium">Itens por página</label>
            <select
              id="limit"
              value={limit}
              onChange={(e) => updateQuery({ limit: Number(e.target.value), page: 1 })}
              className="mt-1 w-44 rounded border border-neutral-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {[10, 20, 50, 100].map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </div>
        {(status || limit !== 10 || page !== 1) && (
          <button
            onClick={() => router.replace("/leads")}
            className="h-9 rounded-md border border-sidebar-border bg-sidebar-accent px-3 hover:bg-sidebar-accent/70"
          >
            Limpar filtros
          </button>
        )}
      </div>

      {loading && <p>Carregando...</p>}
      {error && <p className="text-red-700">{error}</p>}

      {!loading && !error && (
        <div className="overflow-auto">
          <table className="min-w-full border border-sidebar-border text-sm">
            <thead className="bg-sidebar-accent">
              <tr>
                <th className="border border-sidebar-border px-2 py-1 text-left">Nome</th>
                <th className="border border-sidebar-border px-2 py-1 text-left">Email</th>
                <th className="border border-sidebar-border px-2 py-1 text-left">Telefone</th>
                <th className="border border-sidebar-border px-2 py-1 text-left">Status</th>
                <th className="border border-sidebar-border px-2 py-1 text-left">Criado em</th>
                <th className="border border-sidebar-border px-2 py-1">Ações</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-sidebar-accent/60">
                  <td className="border border-sidebar-border px-2 py-1">{lead.name}</td>
                  <td className="border border-sidebar-border px-2 py-1">{lead.email ?? "-"}</td>
                  <td className="border border-sidebar-border px-2 py-1">{lead.phone ?? "-"}</td>
                  <td className="border border-sidebar-border px-2 py-1">{lead.status ?? "new"}</td>
                  <td className="border border-sidebar-border px-2 py-1">{lead.createdAt ? new Date(lead.createdAt).toLocaleString() : "-"}</td>
                  <td className="border border-sidebar-border px-2 py-1 text-center">
                    <Link href={`/leads/${lead.id}`} className="text-primary underline">Editar</Link>
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td className="border border-sidebar-border px-2 py-4 text-center" colSpan={6}>Nenhum contato encontrado</td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Paginação */}
          <div className="mt-3 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <p className="text-sm text-neutral-700">
              Mostrando {startItem}-{endItem} de {total}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuery({ page: Math.max(1, page - 1) })}
                disabled={page <= 1}
                className="rounded-md border border-sidebar-border bg-sidebar-accent px-3 py-1 disabled:opacity-50"
              >
                Anterior
              </button>
              <span className="text-sm">Página {page} de {totalPages}</span>
              <button
                onClick={() => updateQuery({ page: Math.min(totalPages, page + 1) })}
                disabled={page >= totalPages}
                className="rounded-md border border-sidebar-border bg-sidebar-accent px-3 py-1 disabled:opacity-50"
              >
                Próxima
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}