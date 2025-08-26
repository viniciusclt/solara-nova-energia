"use client";

import React from "react";
import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

  if (!hasClerk) {
    return (
      <div className="mx-auto max-w-md space-y-4 rounded-md border p-6">
        <h1 className="text-xl font-semibold">Autenticação desabilitada</h1>
        <p className="text-sm text-muted-foreground">
          Para usar a página de login, configure as variáveis do Clerk no seu .env
          (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY e CLERK_SECRET_KEY) e reinicie o servidor de desenvolvimento.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md py-10">
      <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
    </div>
  );
}