"use client";

import React from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ContactForm } from "../_components/ContactForm";

export default function NewContactPage() {
  const router = useRouter();

  function handleSuccess() {
    router.push("/contacts");
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Novo Contato</h1>
        <Link href="/contacts" className="rounded-md border border-sidebar-border bg-sidebar-accent px-3 py-1 hover:bg-sidebar-accent/70">Voltar</Link>
      </div>
      <ContactForm onSuccess={handleSuccess} />
    </div>
  );
}