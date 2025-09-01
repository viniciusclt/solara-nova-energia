"use client";

export const dynamic = "force-dynamic";

import React, { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

type Proposal = {
  id: string;
  title: string;
  status: string;
  createdAt?: string;
  lead?: { id: string; name?: string | null; email?: string | null } | null;
  author?: { id: string; name?: string | null; email?: string | null } | null;
};

const STATUS_OPTIONS: { value: string; label: string }[] = [
  { value: "", label: "Todos" },
  { value: "draft", label: "Rascunho" },
  { value: "sent", label: "Enviada" },
  { value: "accepted", label: "Aceita" },
  { value: "rejected", label: "Rejeitada" },
  { value: "archived", label: "Arquivada" },
];

function ProposalsContent() {
   const router = useRouter();
   const searchParams = useSearchParams();

   const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
   const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit") ?? "10")));
   const status = searchParams.get("status") ?? "";
   const q = (searchParams.get("q") ?? "").trim();

   const [proposals, setProposals] = useState<Proposal[]>([]);
   const [total, setTotal] = useState(0);
   const [loading, setLoading] = useState(true);
   const [error, setError] = useState<string | null>(null);

   const [qInput, setQInput] = useState(q);
   useEffect(() => {
     setQInput(q);
   }, [q]);

   async function load() {
     setLoading(true);
     setError(null);
     try {
       const data = await api.get<{ data: Proposal[]; total: number; page: number; limit: number }>(
         "/api/proposals",
         { params: { page, limit, status: status || undefined, q: q || undefined } }
       );
       setProposals(data.data);
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
     router.replace(`/proposals?${qs.toString()}`);
   }

   const totalPages = Math.max(1, Math.ceil(total / limit));
   const startItem = total === 0 ? 0 : (page - 1) * limit + 1;
   const endItem = Math.min(total, page * limit);

   return (
     <div className="space-y-6">
       <div className="flex items-center justify-between">
         <h1 className="text-2xl font-semibold">Propostas</h1>
         <div className="flex items-center gap-2">
           <button onClick={load} className="rounded-md border border-sidebar-border bg-sidebar-accent px-3 py-1 hover:bg-sidebar-accent/70">Recarregar</button>
           <Link href="/solar" className="rounded-md bg-primary px-3 py-1 text-primary-foreground">Nova Proposta</Link>
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
               placeholder="Título ou Lead"
               className="mt-1 w-64 rounded border border-neutral-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
             />
           </div>
         </div>
         {(status || limit !== 10 || page !== 1 || q) && (
           <button
             onClick={() => router.replace("/proposals")}
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
                 <th className="border border-sidebar-border px-2 py-1 text-left">Lead</th>
                 <th className="border border-sidebar-border px-2 py-1 text-left">Status</th>
                 <th className="border border-sidebar-border px-2 py-1 text-left">Autor</th>
                 <th className="border border-sidebar-border px-2 py-1 text-left">Criado em</th>
               </tr>
             </thead>
             <tbody>
               {proposals.map((p) => (
                 <tr key={p.id} className="hover:bg-sidebar-accent/60">
                   <td className="px-3 py-2">
                     <Link href={`/proposals/${p.id}`} className="text-blue-600 underline">
                       {p.title}
                     </Link>
                   </td>
                   <td className="border border-sidebar-border px-2 py-1">{p.lead?.name || p.lead?.email || p.lead?.id || "-"}</td>
                   <td className="border border-sidebar-border px-2 py-1">{p.status}</td>
                   <td className="border border-sidebar-border px-2 py-1">{p.author?.name || p.author?.email || "-"}</td>
                   <td className="border border-sidebar-border px-2 py-1">{p.createdAt ? new Date(p.createdAt).toLocaleString() : "-"}</td>
                 </tr>
               ))}
               {proposals.length === 0 && (
                 <tr>
                   <td className="border border-sidebar-border px-2 py-4 text-center" colSpan={5}>Nenhuma proposta encontrada</td>
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

export default function ProposalsPage() {
  return (
    <Suspense fallback={<p>Carregando...</p>}>
      <ProposalsContent />
    </Suspense>
  );
}