"use client";

export const dynamic = "force-dynamic";

import React, { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { OpportunityForm } from "../_components/OpportunityForm";

function NewOpportunityInner() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const contactId = searchParams.get("contactId") || undefined;

  function handleSuccess() {
    router.push("/opportunities");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Nova Oportunidade</h1>
        <Link href="/opportunities" className="rounded-md border border-sidebar-border bg-sidebar-accent px-3 py-1 hover:bg-sidebar-accent/70">Voltar</Link>
      </div>
      <OpportunityForm onSuccess={handleSuccess} initialData={contactId ? ({ title: "", contactId } as any) : undefined} />
    </div>
  );
}

export default function NewOpportunityPage() {
  return (
    <Suspense fallback={<div>Carregando...</div>}>
      <NewOpportunityInner />
    </Suspense>
  );
}