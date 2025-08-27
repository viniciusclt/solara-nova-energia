"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

type Opportunity = {
  id: string;
  title: string;
  status?: string | null;
  amount?: number | null;
  contact?: { id: string; name: string } | null;
  owner?: { id: string; name?: string | null; email?: string | null } | null;
  createdAt?: string;
};

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "open", label: "Aberta" },
  { value: "won", label: "Ganha" },
  { value: "lost", label: "Perdida" },
  { value: "archived", label: "Arquivada" },
];

export default function OpportunitiesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "10")));
  const status = searchParams.get("status") ?? "";
  const q = (searchParams.get("q") ?? "").trim();

  const [items, setItems] = useState<Opportunity[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // estado local para input de busca com debounce
  const [qInput, setQInput] = useState(q);
  useEffect(() => {
    setQInput(q);
  }, [q]);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<{ data: Opportunity[]; total: number; page: number; limit: number }>(
        "/api/opportunities",
        { params: { page, limit, status: status || undefined, q: q || undefined } }
      );
      setItems(Array.isArray(data?.data) ? data.data : []);
      setTotal(data.total ?? 0);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit, status, q]);

  // aplicar debounce para atualizar q na URL
  useEffect(() => {
    const handle = setTimeout(() => {
      updateQuery({ q: qInput, page: 1 });
    }, 400);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qInput]);

  function updateQuery(next: Partial<{ page: number; limit: number; status: string; q: string }> = {}) {
    const qs = new URLSearchParams(searchParams.toString());
    if (next.page !== undefined) qs.set("page", String(next.page));
    if (next.limit !== undefined) qs.set("limit", String(next.limit));
    if (next.status !== undefined) {
      if (next.status) qs.set("status", next.status);
      else qs.delete("status");
      qs.set("page", "1");
    }
    if (next.q !== undefined) {
      const val = (next.q ?? "").trim();
      if (val) qs.set("q", val);
      else qs.delete("q");
      qs.set("page", "1");
    }
    router.replace(`/opportunities?${qs.toString()}`);
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(total, page * limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Oportunidades</h1>
        <div className="flex items-center gap-2">
          <button onClick={load} className="rounded-md border border-sidebar-border bg-sidebar-accent px-3 py-1 hover:bg-sidebar-accent/70">Recarregar</button>
          <Link href="/opportunities/new" className="rounded-md bg-primary px-3 py-1 text-primary-foreground">Nova Oportunidade</Link>
        </div>
      </div>

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
          <div>
            <label htmlFor="q" className="block text-sm font-medium">Buscar</label>
            <input
              id="q"
              type="text"
              value={qInput}
              onChange={(e) => setQInput(e.target.value)}
              placeholder="Título ou contato"
              className="mt-1 w-64 rounded border border-neutral-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        {(status || limit !== 10 || page !== 1 || q) && (
          <button
            onClick={() => router.replace("/opportunities")}
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
                <th className="border border-sidebar-border px-2 py-1 text-left">Título</th>
                <th className="border border-sidebar-border px-2 py-1 text-left">Contato</th>
                <th className="border border-sidebar-border px-2 py-1 text-left">Status</th>
                <th className="border border-sidebar-border px-2 py-1 text-left">Responsável</th>
                <th className="border border-sidebar-border px-2 py-1 text-left">Valor</th>
                <th className="border border-sidebar-border px-2 py-1 text-left">Criado em</th>
                <th className="border border-sidebar-border px-2 py-1">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((it) => (
                <tr key={it.id} className="hover:bg-sidebar-accent/60">
                  <td className="border border-sidebar-border px-2 py-1">{it.title}</td>
                  <td className="border border-sidebar-border px-2 py-1">{it.contact?.name ?? "-"}</td>
                  <td className="border border-sidebar-border px-2 py-1">{it.status ?? "open"}</td>
                  <td className="border border-sidebar-border px-2 py-1">{it.owner?.name || it.owner?.email || "-"}</td>
                  <td className="border border-sidebar-border px-2 py-1">{typeof it.amount === "number" ? it.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "-"}</td>
                  <td className="border border-sidebar-border px-2 py-1">{it.createdAt ? new Date(it.createdAt).toLocaleString() : "-"}</td>
                  <td className="border border-sidebar-border px-2 py-1 text-center">
                    <Link href={`/opportunities/${it.id}`} className="text-primary underline">Editar</Link>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td className="border border-sidebar-border px-2 py-4 text-center" colSpan={7}>Nenhuma oportunidade encontrada</td>
                </tr>
              )}
            </tbody>
          </table>

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