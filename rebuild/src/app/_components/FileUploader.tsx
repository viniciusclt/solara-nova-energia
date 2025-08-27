"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";

type UploadedItem = {
  key: string;
  downloadUrl?: string;
};

type FileUploaderProps = {
  prefix?: string; // pasta/prefixo no bucket
  onUploaded?: (item: UploadedItem) => void;
  accept?: string; // ex: "image/*,application/pdf"
};

type UploadStatus = "queued" | "presigning" | "uploading" | "done" | "error";

type UploadItem = {
  id: string;
  file: File;
  key: string;
  progress: number; // 0..100
  status: UploadStatus;
  downloadUrl?: string;
  error?: string;
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
  const [folder, setFolder] = useState<string>(prefix);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const [globalError, setGlobalError] = useState<string | null>(null);
  const processingRef = useRef(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const processQueueRef = useRef<() => void>(() => {});

  const safeFolder = useMemo(() => (folder || "uploads").replace(/^\/+|\/+$/g, ""), [folder]);

  const buildKey = useCallback(
    (f: File) => {
      const ts = Date.now();
      const name = slugifyName(f.name);
      return `${safeFolder}/${ts}-${name}`;
    },
    [safeFolder]
  );

  const addFiles = useCallback(
    (files: FileList | File[]) => {
      const list = Array.from(files);
      if (!list.length) return;
      const items: UploadItem[] = list.map((f, idx) => ({
        id: `${Date.now()}-${idx}-${f.name}`,
        file: f,
        key: buildKey(f),
        progress: 0,
        status: "queued",
      }));
      setUploads((prev) => [...items, ...prev]);
      // Auto-inicia processamento
      void processQueueRef.current();
    },
    [buildKey]
  );

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    addFiles(e.target.files);
    // limpa para permitir re-seleção do mesmo arquivo
    e.target.value = "";
  }, [addFiles]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const dt = e.dataTransfer;
    if (dt?.files && dt.files.length > 0) {
      addFiles(dt.files);
      dt.clearData();
    }
  }, [addFiles]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

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

  async function uploadWithProgress(url: string, itemId: string, file: File): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          const percent = Math.round((e.loaded / e.total) * 100);
          setUploads((prev) => prev.map((u) => (u.id === itemId ? { ...u, progress: percent } : u)));
        }
      };
      xhr.onload = () => {
        if ((xhr.status >= 200 && xhr.status < 300) || xhr.status === 204) {
          setUploads((prev) => prev.map((u) => (u.id === itemId ? { ...u, progress: 100 } : u)));
          resolve();
        } else {
          reject(new Error(`Falha no upload: HTTP ${xhr.status}`));
        }
      };
      xhr.onerror = () => reject(new Error("Erro de rede no upload"));
      xhr.open("PUT", url, true);
      xhr.setRequestHeader("Content-Type", file.type || "application/octet-stream");
      xhr.send(file);
    });
  }

  const processQueue = useCallback(async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setGlobalError(null);
    try {
      while (true) {
        const next = (() => {
          const q = uploads.find((u) => u.status === "queued");
          return q;
        })();
        if (!next) break;

        // marca como presigning
        setUploads((prev) => prev.map((u) => (u.id === next.id ? { ...u, status: "presigning" } : u)));

        try {
          const presignRes = await fetch("/api/storage/presign-upload", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ key: next.key, contentType: next.file.type || "application/octet-stream" }),
          });
          if (!presignRes.ok) {
            let msg = `Falha ao presign: HTTP ${presignRes.status}`;
            try {
              const body = await presignRes.json();
              msg = body?.error || msg;
            } catch {}
            throw new Error(msg);
          }
          const data = (await presignRes.json()) as { url?: string };
          if (!data?.url) throw new Error("Resposta inválida da API de presign-upload");

          // uploading
          setUploads((prev) => prev.map((u) => (u.id === next.id ? { ...u, status: "uploading", progress: 0 } : u)));
          await uploadWithProgress(data.url, next.id, next.file);

          // tenta gerar link de download
          let downloadUrl: string | undefined;
          try {
            downloadUrl = await generateDownloadUrl(next.key);
          } catch {}

          setUploads((prev) => prev.map((u) => (u.id === next.id ? { ...u, status: "done", downloadUrl } : u)));

          onUploaded?.({ key: next.key, downloadUrl });
        } catch (err) {
          const message = err instanceof Error ? err.message : "Erro inesperado no upload";
          setUploads((prev) => prev.map((u) => (u.id === next.id ? { ...u, status: "error", error: message } : u)));
          setGlobalError((prev) => prev || message);
        }
      }
    } finally {
      processingRef.current = false;
    }
  }, [uploads, generateDownloadUrl, onUploaded]);

  // mantêm a referência atualizada para evitar TDZ ao chamar no addFiles
  React.useEffect(() => {
    processQueueRef.current = () => {
      void processQueue();
    };
  }, [processQueue]);

  const handleRegenerateLink = useCallback(async (k: string) => {
    try {
      const url = await generateDownloadUrl(k);
      setUploads((prev) => prev.map((it) => (it.key === k ? { ...it, downloadUrl: url } : it)));
    } catch (err) {
      setGlobalError(err instanceof Error ? err.message : "Erro ao gerar link");
    }
  }, [generateDownloadUrl]);

  const handleCopy = useCallback(async (url?: string) => {
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
    } catch {}
  }, []);

  const hasItems = uploads.length > 0;

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
            <label htmlFor="file" className="block text-sm font-medium">Arquivos</label>
            <input
              id="file"
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleInputChange}
              accept={accept}
              className="mt-1 w-full rounded border border-neutral-300 p-2 file:mr-4 file:rounded file:border-0 file:bg-blue-50 file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-blue-100"
            />
          </div>
        </div>

        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
          className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-neutral-300 bg-neutral-50 p-6 text-center hover:bg-neutral-100 dark:bg-neutral-800 dark:hover:bg-neutral-700"
          aria-label="Arraste e solte arquivos aqui ou clique para selecionar"
        >
          <span className="text-sm font-medium">Arraste e solte arquivos aqui</span>
          <span className="text-xs text-neutral-600 dark:text-neutral-400">ou clique para selecionar</span>
        </div>

        <div className="mt-3 text-xs text-neutral-600 dark:text-neutral-400 break-all">
          <p><span className="font-medium">Pasta destino:</span> {safeFolder || "—"}</p>
        </div>

        {globalError ? <div className="mt-3 text-sm text-red-600">{globalError}</div> : null}
      </div>

      {hasItems && (
        <div className="rounded-md border border-neutral-200 p-4 bg-white dark:bg-neutral-900">
          <h3 className="text-sm font-semibold mb-2">Fila de uploads</h3>
          <ul className="space-y-2">
            {uploads.map((it) => (
              <li key={it.id} className="rounded border border-neutral-200 p-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div className="text-xs break-all">
                    <div className="font-medium">{it.file.name}</div>
                    <div className="text-neutral-500">{it.key}</div>
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
                </div>
                <div className="mt-2">
                  <div className="h-2 w-full rounded bg-neutral-200 dark:bg-neutral-800">
                    <div
                      className={`h-2 rounded ${it.status === "error" ? "bg-red-500" : it.status === "done" ? "bg-green-600" : "bg-blue-600"}`}
                      style={{ width: `${it.progress}%` }}
                    />
                  </div>
                  <div className="mt-1 text-[10px] text-neutral-600 dark:text-neutral-400">
                    {it.status === "queued" && "Na fila"}
                    {it.status === "presigning" && "Gerando URL..."}
                    {it.status === "uploading" && `Enviando... ${it.progress}%`}
                    {it.status === "done" && "Concluído"}
                    {it.status === "error" && (it.error || "Erro")}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}