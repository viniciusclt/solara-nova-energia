"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

type Contact = {
  id: string;
  name: string;
  email?: string | null;
  phone?: string | null;
  status?: string | null;
  createdAt?: string;
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<{ data: Contact[]; total: number; page: number; limit: number }>("/api/contacts");
      setContacts(Array.isArray(data?.data) ? data.data : []);
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
        <h1 className="text-2xl font-semibold">Contatos</h1>
        <div className="flex items-center gap-2">
          <button onClick={load} className="rounded-md border border-sidebar-border bg-sidebar-accent px-3 py-1 hover:bg-sidebar-accent/70">Recarregar</button>
          <Link href="/contacts/new" className="rounded-md bg-primary px-3 py-1 text-primary-foreground">Novo Contato</Link>
        </div>
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
              {contacts.map((c) => (
                <tr key={c.id} className="hover:bg-sidebar-accent/60">
                  <td className="border border-sidebar-border px-2 py-1">{c.name}</td>
                  <td className="border border-sidebar-border px-2 py-1">{c.email ?? "-"}</td>
                  <td className="border border-sidebar-border px-2 py-1">{c.phone ?? "-"}</td>
                  <td className="border border-sidebar-border px-2 py-1">{c.status ?? "new"}</td>
                  <td className="border border-sidebar-border px-2 py-1">{c.createdAt ? new Date(c.createdAt).toLocaleString() : "-"}</td>
                  <td className="border border-sidebar-border px-2 py-1 text-center">
                    <Link href={`/contacts/${c.id}`} className="text-primary underline">Editar</Link>
                  </td>
                </tr>
              ))}
              {contacts.length === 0 && (
                <tr>
                  <td className="border border-sidebar-border px-2 py-4 text-center" colSpan={6}>Nenhum contato encontrado</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}