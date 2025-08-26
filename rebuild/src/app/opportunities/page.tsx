"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

type Opportunity = {
  id: string;
  title: string;
  status?: string | null;
  amount?: number | null;
  contact?: { id: string; name: string } | null;
  createdAt?: string;
};

export default function OpportunitiesPage() {
  const [items, setItems] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<{ data: Opportunity[]; total: number; page: number; limit: number }>("/api/opportunities");
      setItems(Array.isArray(data?.data) ? data.data : []);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Oportunidades</h1>
        <div className="flex items-center gap-2">
          <button onClick={load} className="rounded-md border border-sidebar-border bg-sidebar-accent px-3 py-1 hover:bg-sidebar-accent/70">Recarregar</button>
          <Link href="/opportunities/new" className="rounded-md bg-primary px-3 py-1 text-primary-foreground">Nova Oportunidade</Link>
        </div>
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
                  <td className="border border-sidebar-border px-2 py-1">{typeof it.amount === "number" ? it.amount.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "-"}</td>
                  <td className="border border-sidebar-border px-2 py-1">{it.createdAt ? new Date(it.createdAt).toLocaleString() : "-"}</td>
                  <td className="border border-sidebar-border px-2 py-1 text-center">
                    <Link href={`/opportunities/${it.id}`} className="text-primary underline">Editar</Link>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td className="border border-sidebar-border px-2 py-4 text-center" colSpan={6}>Nenhuma oportunidade encontrada</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}