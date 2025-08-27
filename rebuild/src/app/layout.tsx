import type { Metadata } from "next";
import "./globals.css";
import AppShell from "@/app/_components/AppShell";
import { ClerkProvider, SignedIn, SignedOut, RedirectToSignIn } from "@clerk/nextjs";

export const metadata: Metadata = {
  title: "Solara Nova Energia",
  description: "Rebuild minimal em Next.js + Tailwind",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  const publicRoutes = ["/sign-in", "/sign-up"];

  if (!hasClerk) {
    return (
      <html lang="pt-BR">
        <body>
          <AppShell>
            <div className="bg-yellow-50 text-yellow-900 text-sm p-2 text-center">
              Auth desabilitada (NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ausente).
            </div>
            {children}
          </AppShell>
        </body>
      </html>
    );
  }

  return (
    <html lang="pt-BR">
      <body>
        <ClerkProvider>
          <SignedIn>
            <AppShell>{children}</AppShell>
          </SignedIn>
          <SignedOut>
            {publicRoutes.some((p) => typeof window !== "undefined" && window.location.pathname.startsWith(p)) ? (
              children
            ) : (
              <RedirectToSignIn />)
            }
          </SignedOut>
        </ClerkProvider>
      </body>
    </html>
  );
}

// Removidas importações de fontes não utilizadas (Inter, JetBrains_Mono)
