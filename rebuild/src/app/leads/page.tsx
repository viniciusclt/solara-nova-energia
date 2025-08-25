"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

type Lead = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
  createdAt?: string;
};

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/leads", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Falha ao carregar leads");
      setLeads(Array.isArray(data?.data) ? data.data : data);
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
    <main className="min-h-dvh p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Leads</h1>
        <div className="flex items-center gap-2">
          <button onClick={load} className="rounded border px-3 py-1">Recarregar</button>
          <Link href="/leads/new" className="rounded bg-blue-600 px-3 py-1 text-white">Novo Lead</Link>
        </div>
      </div>

      {loading && <p>Carregando...</p>}
      {error && <p className="text-red-700">{error}</p>}

      {!loading && !error && (
        <div className="overflow-auto">
          <table className="min-w-full border text-sm">
            <thead className="bg-neutral-100">
              <tr>
                <th className="border px-2 py-1 text-left">Nome</th>
                <th className="border px-2 py-1 text-left">Email</th>
                <th className="border px-2 py-1 text-left">Telefone</th>
                <th className="border px-2 py-1 text-left">Status</th>
                <th className="border px-2 py-1 text-left">Criado em</th>
                <th className="border px-2 py-1">Ações</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="hover:bg-neutral-50">
                  <td className="border px-2 py-1">{lead.name}</td>
                  <td className="border px-2 py-1">{lead.email ?? "-"}</td>
                  <td className="border px-2 py-1">{lead.phone ?? "-"}</td>
                  <td className="border px-2 py-1">{lead.status ?? "new"}</td>
                  <td className="border px-2 py-1">{lead.createdAt ? new Date(lead.createdAt).toLocaleString() : "-"}</td>
                  <td className="border px-2 py-1 text-center">
                    <Link href={`/leads/${lead.id}`} className="text-blue-600 underline">Editar</Link>
                  </td>
                </tr>
              ))}
              {leads.length === 0 && (
                <tr>
                  <td className="border px-2 py-4 text-center" colSpan={6}>Nenhum lead encontrado</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </main>
  );
}