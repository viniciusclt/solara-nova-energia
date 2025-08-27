"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { api } from "@/lib/api";
import dynamic from "next/dynamic";
const ContactForm = dynamic(() => import("../_components/ContactForm").then(m => m.default), { ssr: false });
const OpportunityForm = dynamic(() => import("../../opportunities/_components/OpportunityForm").then(m => m.OpportunityForm), { ssr: false });
import type { Contact } from "../_components/ContactForm";

// Tipagem mínima para oportunidades nesta página
type Opportunity = {
  id: string;
  title: string;
  status?: string | null;
  amount?: number | null;
  createdAt?: string;
};

export default function EditContactPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const router = useRouter();

  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Estado e carregamento de oportunidades do contato
  const [opps, setOpps] = useState<Opportunity[]>([]);
  const [loadingOpps, setLoadingOpps] = useState(true);
  const [oppError, setOppError] = useState<string | null>(null);
  const [showOppForm, setShowOppForm] = useState(false);

  async function loadOpps() {
    if (!id) return;
    setLoadingOpps(true);
    setOppError(null);
    try {
      const data = await api.get<{ data: Opportunity[]; total: number; page: number; limit: number }>(
        "/api/opportunities",
        { params: { contactId: id, limit: 100 } }
      );
      setOpps(Array.isArray(data?.data) ? data.data : []);
    } catch (err: unknown) {
      setOppError(err instanceof Error ? err.message : "Erro inesperado");
    } finally {
      setLoadingOpps(false);
    }
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await api.get<{ data: Contact }>(`/api/contacts/${id}`);
        setContact((data?.data as Contact) ?? (data as unknown as Contact));
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Erro inesperado");
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  useEffect(() => {
    if (id) loadOpps();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  function handleSuccess() {
    router.push("/contacts");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Editar Contato</h1>
        <Link href="/contacts" className="rounded-md border border-sidebar-border bg-sidebar-accent px-3 py-1 hover:bg-sidebar-accent/70">Voltar</Link>
      </div>

      {loading && <p>Carregando...</p>}
      {error && <p className="text-red-700">{error}</p>}
      {!loading && !error && contact && (
        <ContactForm initialData={contact} onSuccess={handleSuccess} />
      )}

      {/* Oportunidades relacionadas ao contato */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">Oportunidades do Contato</h2>
          <div className="flex items-center gap-2">
            <button onClick={loadOpps} className="rounded-md border border-sidebar-border bg-sidebar-accent px-3 py-1 hover:bg-sidebar-accent/70">Recarregar</button>
            <button onClick={() => setShowOppForm((v) => !v)} className="rounded-md bg-primary px-3 py-1 text-primary-foreground">
              {showOppForm ? "Cancelar" : "Nova Oportunidade"}
            </button>
          </div>
        </div>

        {showOppForm && id && (
          <div className="rounded-md border border-sidebar-border p-4">
            <OpportunityForm
              initialData={{ title: "", contactId: id } as any}
              onSuccess={() => {
                setShowOppForm(false);
                loadOpps();
              }}
            />
          </div>
        )}

        {loadingOpps && <p>Carregando oportunidades...</p>}
        {oppError && <p className="text-red-700">{oppError}</p>}

        {!loadingOpps && !oppError && (
          <div className="overflow-auto">
            <table className="min-w-full border border-sidebar-border text-sm">
              <thead className="bg-sidebar-accent">
                <tr>
                  <th className="border border-sidebar-border px-2 py-1 text-left">Título</th>
                  <th className="border border-sidebar-border px-2 py-1 text-left">Status</th>
                  <th className="border border-sidebar-border px-2 py-1 text-left">Valor (R$)</th>
                  <th className="border border-sidebar-border px-2 py-1 text-left">Criado em</th>
                  <th className="border border-sidebar-border px-2 py-1">Ações</th>
                </tr>
              </thead>
              <tbody>
                {opps.map((o) => (
                  <tr key={o.id} className="hover:bg-sidebar-accent/60">
                    <td className="border border-sidebar-border px-2 py-1">{o.title}</td>
                    <td className="border border-sidebar-border px-2 py-1">{o.status ?? "open"}</td>
                    <td className="border border-sidebar-border px-2 py-1">{typeof o.amount === "number" ? o.amount.toLocaleString(undefined, { style: "currency", currency: "BRL" }).replace("R$", "R$") : "-"}</td>
                    <td className="border border-sidebar-border px-2 py-1">{o.createdAt ? new Date(o.createdAt).toLocaleString() : "-"}</td>
                    <td className="border border-sidebar-border px-2 py-1 text-center">
                      <Link href={`/opportunities/${o.id}`} className="text-primary underline">Editar</Link>
                    </td>
                  </tr>
                ))}
                {opps.length === 0 && (
                  <tr>
                    <td className="border border-sidebar-border px-2 py-4 text-center" colSpan={5}>Nenhuma oportunidade encontrada</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}