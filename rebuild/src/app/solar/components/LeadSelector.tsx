"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Search, User, MapPin, X } from "lucide-react";
import { api } from "@/lib/api";

export type ContactOption = {
  id: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: any;
  consumoMedio?: number | string | null;
};

type LeadSelectorProps = {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (contact: ContactOption) => void;
};

export default function LeadSelector({ isOpen, onClose, onSelect }: LeadSelectorProps) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ContactOption[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    let ignore = false;
    const controller = new AbortController();
    const t = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);
        const url = `/api/contacts?q=${encodeURIComponent(q)}&limit=10`;
        const resp = await api.get<{ data: ContactOption[]; total: number; page: number; limit: number }>(url, { signal: controller.signal } as any);
        if (!ignore) setItems(resp.data ?? []);
      } catch (err: any) {
        if (!ignore) setError(err?.message ?? "Erro ao buscar contatos");
      } finally {
        if (!ignore) setLoading(false);
      }
    }, 300);

    return () => {
      ignore = true;
      controller.abort();
      clearTimeout(t);
    };
  }, [q, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-2xl rounded-xl border border-neutral-200 bg-white p-4 shadow-xl dark:border-neutral-800 dark:bg-neutral-900">
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-base font-semibold">Selecionar Lead</h3>
          <button onClick={onClose} aria-label="Fechar" className="rounded-md border px-2 py-1 text-xs hover:bg-neutral-50 dark:hover:bg-neutral-800">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-3 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-500" />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por nome, email ou telefone"
              className="w-full rounded-md border bg-background px-8 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[hsl(var(--accent))]"
            />
          </div>
          <button onClick={() => setQ("")} className="rounded-md border px-3 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800">Limpar</button>
        </div>

        {error && <div className="mb-2 text-xs text-red-600">{error}</div>}

        <div className="max-h-80 overflow-auto rounded-md border border-neutral-200 dark:border-neutral-800">
          {loading ? (
            <div className="p-4 text-sm text-neutral-600">Carregando...</div>
          ) : items.length === 0 ? (
            <div className="p-4 text-sm text-neutral-600">Nenhum contato encontrado</div>
          ) : (
            <ul className="divide-y divide-neutral-200 dark:divide-neutral-800">
              {items.map((c) => {
                const city = c.address?.city ?? c.address?.addressCity ?? c.address?.cidade ?? null;
                const state = c.address?.state ?? c.address?.addressState ?? c.address?.uf ?? null;
                return (
                  <li key={c.id} className="flex items-center justify-between gap-3 p-3 hover:bg-neutral-50 dark:hover:bg-neutral-800/50">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-blue-600" />
                        <span className="truncate text-sm font-medium">{c.name || "(Sem nome)"}</span>
                      </div>
                      <div className="mt-0.5 grid grid-cols-1 gap-1 text-xs text-neutral-600 sm:grid-cols-2 dark:text-neutral-300">
                        <div className="truncate">{c.email || "—"}</div>
                        <div className="truncate">{c.phone || "—"}</div>
                        {(city || state) && (
                          <div className="col-span-2 flex items-center gap-1 truncate">
                            <MapPin className="h-3 w-3" />
                            <span className="truncate">{[city, state].filter(Boolean).join(" / ")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        onSelect(c);
                        onClose();
                      }}
                      className="shrink-0 rounded-md border bg-sidebar-accent px-3 py-1 text-xs hover:bg-sidebar-accent/70"
                    >
                      Selecionar
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}