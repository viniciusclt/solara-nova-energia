export default function Page() {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">Solara Nova Energia</h1>
      <p className="text-sm text-neutral-500">Rebuild minimal em Next.js + Tailwind</p>
      <a href="/api/health" className="text-blue-600 underline" target="_blank" rel="noreferrer">/api/health</a>
      <a href="/leads" className="text-blue-600 underline">/leads</a>
    </div>
  );
}
