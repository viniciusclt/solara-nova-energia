"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { LeadForm } from "../_components/LeadForm";

export default function NewLeadPage() {
  const router = useRouter();

  function handleSuccess() {
    router.push("/leads");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Novo Lead</h1>
        <Link href="/leads" className="rounded-md border border-sidebar-border bg-sidebar-accent px-3 py-1 hover:bg-sidebar-accent/70">Voltar</Link>
      </div>
      <LeadForm onSuccess={handleSuccess} />
    </div>
  );
}