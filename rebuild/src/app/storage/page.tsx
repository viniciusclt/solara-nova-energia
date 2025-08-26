export const dynamic = "force-dynamic";

import React from "react";
import FileUploader from "@/app/_components/FileUploader";

export default function StoragePage() {
  const hasClerk = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Arquivos</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Faça upload de arquivos para o bucket configurado no MinIO. Os uploads geram URLs temporárias de download.
        </p>
      </div>

      {!hasClerk && (
        <div className="rounded-md border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-900">
          Clerk desabilitado. As rotas de presign estão abertas somente enquanto o projeto não exige autenticação. Configure as variáveis do Clerk para proteger o acesso.
        </div>
      )}

      <FileUploader prefix="uploads" accept="image/*,application/pdf,video/*" />

      <div className="text-xs text-neutral-600 dark:text-neutral-400">
        <p>
          Variáveis necessárias: MINIO_ENDPOINT, MINIO_PORT, MINIO_USE_SSL, MINIO_REGION, MINIO_ACCESS_KEY, MINIO_SECRET_KEY, MINIO_BUCKET.
        </p>
      </div>
    </div>
  );
}