export default function Page() {
  return (
    <main className="min-h-dvh flex flex-col items-center justify-center gap-4 p-6">
      <h1 className="text-2xl font-semibold">Solara Nova Energia</h1>
      <p className="text-sm text-neutral-500">Rebuild minimal em Next.js + Tailwind</p>
      <a href="/api/health" className="text-blue-600 underline" target="_blank" rel="noreferrer">/api/health</a>
      {/* Link para Leads */}
      <a href="/leads" className="text-blue-600 underline">/leads</a>
    </main>
  );
}
