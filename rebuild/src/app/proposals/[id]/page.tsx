"use client";

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import AppShell from '@/app/_components/AppShell';
import { api } from '@/lib/api';

type Proposal = {
  id: string;
  title: string;
  status: string;
  leadId: string;
  contactId?: string | null;
  data: any;
  authorId: string | null;
  createdAt: string;
  updatedAt: string;
  lead?: { id: string; name: string | null; email: string | null } | null;
  contact?: { id: string; name: string | null; email: string | null } | null;
  author?: { id: string; email: string | null } | null;
};

export default function ProposalDetailsPage() {
  const params = useParams();
  const id = useMemo(() => (Array.isArray(params?.id) ? params.id[0] : (params?.id as string)), [params]);
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [proposal, setProposal] = useState<Proposal | null>(null);

  const [form, setForm] = useState({
    title: '',
    status: 'draft',
    data: '',
    contactId: '' as string,
  });

  const contactLink = useMemo(() => {
    const q = proposal?.contact?.email || proposal?.contact?.name || proposal?.lead?.email || proposal?.lead?.name || '';
    return `/contacts${q ? `?q=${encodeURIComponent(q)}` : ''}`;
  }, [proposal]);

  useEffect(() => {
    if (!id) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    api.get<{ data: Proposal }>(`/api/proposals/${id}`)
      .then((res) => {
        if (cancelled) return;
        setProposal(res.data);
        setForm({
          title: res.data.title ?? '',
          status: res.data.status ?? 'draft',
          data: JSON.stringify(res.data.data ?? {}, null, 2),
          contactId: res.data.contactId ?? '',
        });
      })
      .catch((e) => setError(e?.message ?? 'Erro ao carregar'))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  };

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    setError(null);
    try {
      let parsedData: any = undefined;
      if (form.data.trim()) {
        try { parsedData = JSON.parse(form.data); } catch (e) {
          setError('JSON de dados inválido.');
          setSaving(false);
          return;
        }
      }
      const payload: any = { title: form.title, status: form.status };
      if (parsedData !== undefined) payload.data = parsedData;
      if (form.contactId !== undefined) payload.contactId = form.contactId || null;
      const res = await api.patch<{ data: Proposal }>(`/api/proposals/${id}`, payload);
      setProposal(res.data);
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao salvar');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!id) return;
    if (!confirm('Tem certeza que deseja excluir esta proposta?')) return;
    try {
      await api.del(`/api/proposals/${id}`);
      router.push('/proposals');
    } catch (e: any) {
      setError(e?.message ?? 'Erro ao excluir');
    }
  };

  return (
    <AppShell>
      <div className="p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="space-x-2 text-sm text-gray-500">
            <Link href="/proposals" className="underline">Propostas</Link>
            <span>/</span>
            <span>{id}</span>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-2 rounded bg-gray-100" onClick={() => router.refresh()} disabled={loading || saving}>Recarregar</button>
            <button className="px-3 py-2 rounded bg-red-600 text-white" onClick={handleDelete} disabled={saving}>Excluir</button>
            <button className="px-3 py-2 rounded bg-blue-600 text-white" onClick={handleSave} disabled={saving}>{saving ? 'Salvando...' : 'Salvar'}</button>
          </div>
        </div>

        {error && (
          <div className="mb-4 text-sm text-red-600">{error}</div>
        )}

        {loading ? (
          <div>Carregando...</div>
        ) : !proposal ? (
          <div>Proposta não encontrada.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium">Título</label>
                <input name="title" value={form.title} onChange={handleChange} className="mt-1 w-full rounded border p-2" placeholder="Título da proposta" />
              </div>
              <div>
                <label className="block text-sm font-medium">Status</label>
                <select name="status" value={form.status} onChange={handleChange} className="mt-1 w-full rounded border p-2">
                  <option value="draft">Rascunho</option>
                  <option value="sent">Enviada</option>
                  <option value="accepted">Aprovada</option>
                  <option value="rejected">Rejeitada</option>
                  <option value="archived">Arquivada</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium">Lead</label>
                <div className="mt-1 flex flex-col gap-1">
                  <input value={`${proposal.lead?.name ?? '—'} (${proposal.lead?.email ?? 'sem e-mail'})`} readOnly className="w-full rounded border p-2 bg-gray-50" />
                  <div>
                    <Link href={contactLink} className="text-blue-600 underline text-sm">Abrir contato/lead</Link>
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium">Contato (opcional)</label>
                <div className="mt-1 flex flex-col gap-1">
                  <input name="contactId" value={form.contactId} onChange={handleChange} className="w-full rounded border p-2" placeholder="ID do contato vinculado (opcional)" />
                  <input value={`${proposal?.contact?.name ?? '—'} (${proposal?.contact?.email ?? 'sem e-mail'})`} readOnly className="w-full rounded border p-2 bg-gray-50" />
                  <div>
                    <Link href={contactLink} className="text-blue-600 underline text-sm">Abrir contato/lead</Link>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium">Dados (JSON)</label>
              <textarea name="data" value={form.data} onChange={handleChange} className="mt-1 w-full min-h-[280px] rounded border p-2 font-mono text-sm" placeholder={`{\n  "chave": "valor"\n}`}></textarea>
              <p className="text-xs text-gray-500 mt-1">Cole aqui os dados técnicos/financeiros da proposta. Deve ser um JSON válido.</p>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}