"use client";

import React, { useCallback, useMemo, useState } from "react";

type UploadedItem = {
  key: string;
  downloadUrl?: string;
};

type FileUploaderProps = {
  prefix?: string; // pasta/prefixo no bucket
  onUploaded?: (item: UploadedItem) => void;
  accept?: string; // ex: "image/*,application/pdf"
};

function slugifyName(name: string) {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9.]+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase();
}

export default function FileUploader({ prefix = "uploads", onUploaded, accept }: FileUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [folder, setFolder] = useState<string>(prefix);
  const [status, setStatus] = useState<"idle" | "presigning" | "uploading" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<UploadedItem[]>([]);

  const disabled = status === "presigning" || status === "uploading";

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files && e.target.files[0];
    setFile(f ?? null);
  }, []);

  const key = useMemo(() => {
    if (!file) return "";
    const ts = Date.now();
    const safeFolder = (folder || "uploads").replace(/^\/+|\/+$/g, "");
    const name = slugifyName(file.name);
    return `${safeFolder}/${ts}-${name}`;
  }, [file, folder]);

  const generateDownloadUrl = useCallback(async (k: string) => {
    const res = await fetch("/api/storage/presign-download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: k }),
    });
    if (!res.ok) throw new Error(`Falha ao gerar URL de download: HTTP ${res.status}`);
    const data = (await res.json()) as { url?: string };
    if (!data?.url) throw new Error("Resposta inválida da API de presign-download");
    return data.url;
  }, []);

  const handleUpload = useCallback(async () => {
    if (!file) return;
    setStatus("presigning");
    setError(null);
    try {
      const res = await fetch("/api/storage/presign-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, contentType: file.type || "application/octet-stream" }),
      });
      if (!res.ok) {
        let msg = `Falha ao presign: HTTP ${res.status}`;
        try {
          const body = await res.json();
          msg = body?.error || msg;
        } catch {}
        throw new Error(msg);
      }
      const data = (await res.json()) as { url?: string };
      if (!data?.url) throw new Error("Resposta inválida da API de presign-upload");

      setStatus("uploading");
      const put = await fetch(data.url, {
        method: "PUT",
        headers: { "Content-Type": file.type || "application/octet-stream" },
        body: file,
      });
      if (!put.ok && put.status !== 200 && put.status !== 201 && put.status !== 204) {
        throw new Error(`Falha no upload: HTTP ${put.status}`);
      }

      // Tenta gerar link de download temporário
      let downloadUrl: string | undefined;
      try {
        downloadUrl = await generateDownloadUrl(key);
      } catch (_) {
        // opcional
      }

      const item: UploadedItem = { key, downloadUrl };
      setItems((prev) => [item, ...prev]);
      onUploaded?.(item);
      setStatus("done");
      setFile(null);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Erro inesperado no upload");
    } finally {
      // retorna para idle após breve delay para UX
      setTimeout(() => setStatus("idle"), 400);
    }
  }, [file, key, onUploaded, generateDownloadUrl]);

  const handleRegenerateLink = useCallback(async (k: string) => {
    try {
      const url = await generateDownloadUrl(k);
      setItems((prev) => prev.map((it) => (it.key === k ? { ...it, downloadUrl: url } : it)));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao gerar link");
    }
  }, [generateDownloadUrl]);

  const handleCopy = useCallback(async (url?: string) => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
    } catch (_) {
      // noop
    }
  }, []);

  return (
    <div className="space-y-4">
      <div className="rounded-md border border-neutral-200 p-4 bg-white dark:bg-neutral-900">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label htmlFor="folder" className="block text-sm font-medium">Pasta (prefixo)</label>
            <input
              id="folder"
              type="text"
              placeholder="uploads"
              value={folder}
              onChange={(e) => setFolder(e.target.value)}
              className="mt-1 w-full rounded border border-neutral-300 p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="file" className="block text-sm font-medium">Arquivo</label>
            <input
              id="file"
              type="file"
              onChange={handleFileChange}
              accept={accept}
              className="mt-1 w-full rounded border border-neutral-300 p-2 file:mr-4 file:rounded file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-blue-100"
            />
          </div>
        </div>

        <div className="mt-3 text-xs text-neutral-600 dark:text-neutral-400 break-all">
          <p><span className="font-medium">Chave gerada:</span> {key || "—"}</p>
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button
            type="button"
            onClick={handleUpload}
            disabled={!file || disabled}
            className="inline-flex items-center justify-center rounded-md border border-neutral-300 bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {status === "presigning" ? "Gerando URL..." : status === "uploading" ? "Enviando..." : "Enviar"}
          </button>
          {error ? <span className="text-sm text-red-600">{error}</span> : null}
        </div>
      </div>

      {items.length > 0 && (
        <div className="rounded-md border border-neutral-200 p-4 bg-white dark:bg-neutral-900">
          <h3 className="text-sm font-semibold mb-2">Uploads recentes</h3>
          <ul className="space-y-2">
            {items.map((it) => (
              <li key={it.key} className="flex flex-col sm:flex-row sm:items-center gap-2 justify-between rounded border border-neutral-200 p-2">
                <div className="text-xs break-all">
                  <div className="font-medium">{it.key}</div>
                  {it.downloadUrl ? (
                    <a href={it.downloadUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">
                      Abrir link temporário
                    </a>
                  ) : (
                    <span className="text-neutral-500">Sem link gerado</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleRegenerateLink(it.key)}
                    className="rounded-md border border-neutral-300 bg-neutral-50 px-3 py-1.5 text-xs hover:bg-neutral-100"
                  >
                    Gerar novo link
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCopy(it.downloadUrl)}
                    disabled={!it.downloadUrl}
                    className="rounded-md border border-neutral-300 bg-neutral-50 px-3 py-1.5 text-xs hover:bg-neutral-100 disabled:opacity-50"
                  >
                    Copiar URL
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}