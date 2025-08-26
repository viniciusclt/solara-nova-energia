"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { OpportunityForm, type Opportunity } from "../_components/OpportunityForm";
import { api } from "@/lib/api";

export default function EditOpportunityPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string | undefined;

  const [item, setItem] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<{ data: Opportunity }>(`/api/opportunities/${id}`);
      setItem(data?.data ?? null);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Editar Oportunidade</h1>
        <div className="flex items-center gap-2">
          <button onClick={load} className="rounded-md border border-sidebar-border bg-sidebar-accent px-3 py-1 hover:bg-sidebar-accent/70">Recarregar</button>
          <Link href="/opportunities" className="rounded-md border border-sidebar-border bg-sidebar-accent px-3 py-1 hover:bg-sidebar-accent/70">Voltar</Link>
        </div>
      </div>

      {loading && <p>Carregando...</p>}
      {error && <p className="text-red-700">{error}</p>}
      {!loading && !error && item && (
        <OpportunityForm initialData={item} onSuccess={setItem} />
      )}
    </div>
  );
}