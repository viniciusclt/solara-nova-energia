"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";

import { api } from "@/lib/api";

type Contact = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
  createdAt?: string;
  owner?: { id: string; name?: string | null; email?: string | null } | null;
};

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "new", label: "Novo" },
  { value: "contacted", label: "Contactado" },
  { value: "qualified", label: "Qualificado" },
  { value: "proposal_won", label: "Proposta Ganha" },
  { value: "proposal_lost", label: "Proposta Perdida" },
  { value: "archived", label: "Arquivado" },
];

export default function ContactsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "10")));
  const status = searchParams.get("status") ?? "";
  const q = (searchParams.get("q") ?? "").trim();

  const [contacts, setContacts] = useState<Contact[]>([]);
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
      const data = await api.get<{ data: Contact[]; total: number; page: number; limit: number }>(
        "/api/contacts",
        { params: { page, limit, status: status || undefined, q: q || undefined } }
      );
      setContacts(data.data);
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
    router.replace(`/contacts?${qs.toString()}`);
  }

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
  const endItem = Math.min(total, page * limit);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Contatos</h1>
        <div className="flex items-center gap-2">
          <button onClick={load} className="rounded-md border border-sidebar-border bg-sidebar-accent px-3 py-1 hover:bg-sidebar-accent/70">Recarregar</button>
          <Link href="/contacts/new" className="rounded-md bg-primary px-3 py-1 text-primary-foreground">Novo Contato</Link>
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
              placeholder="Nome, email ou telefone"
              className="mt-1 w-64 rounded border border-neutral-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
        {(status || limit !== 10 || page !== 1 || q) && (
          <button
            onClick={() => router.replace("/contacts")}
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
                <th className="border border-sidebar-border px-2 py-1 text-left">Responsável</th>
                <th className="border border-sidebar-border px-2 py-1 text-left">Criado em</th>
                <th className="border border-sidebar-border px-2 py-1">Ações</th>
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id} className="hover:bg-sidebar-accent/60">
                  <td className="border border-sidebar-border px-2 py-1">{c.name}</td>
                  <td className="border border-sidebar-border px-2 py-1">{c.email ?? "-"}</td>
                  <td className="border border-sidebar-border px-2 py-1">{c.phone ?? "-"}</td>
                  <td className="border border-sidebar-border px-2 py-1">{c.status ?? "new"}</td>
                  <td className="border border-sidebar-border px-2 py-1">{c.owner?.name || c.owner?.email || "-"}</td>
                  <td className="border border-sidebar-border px-2 py-1">{c.createdAt ? new Date(c.createdAt).toLocaleString() : "-"}</td>
                  <td className="border border-sidebar-border px-2 py-1 text-center">
                    <Link href={`/contacts/${c.id}`} className="text-primary underline">Editar</Link>
                  </td>
                </tr>
              ))}
              {contacts.length === 0 && (
                <tr>
                  <td className="border border-sidebar-border px-2 py-4 text-center" colSpan={7}>Nenhum contato encontrado</td>
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