import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useDebounce } from "@/hooks/useDebounce";
import { supabase } from "@/integrations/supabase/client";
import { DemoDataService } from "@/services/DemoDataService";
import { logError } from "@/utils/secureLogger";

export interface LeadSearchDropdownProps {
  onLeadSelect: (lead: Record<string, unknown>) => void;
  selectedLeadId?: string | null;
  onNewLead?: () => void;
  onViewTable?: () => void;
  placeholder?: string;
  maxResults?: number;
  className?: string;
}

interface Address {
  state?: string;
  city?: string;
  neighborhood?: string;
  cep?: string;
  street?: string;
  number?: string;
}

interface LeadPreview {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  address?: Address;
  consumoMedio?: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
}

export function LeadSearchDropdown({
  onLeadSelect,
  selectedLeadId = null,
  onNewLead,
  onViewTable,
  placeholder = "Digite nome, email ou telefone...",
  maxResults = 8,
  className
}: LeadSearchDropdownProps) {
  const { toast } = useToast();
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<LeadPreview[]>([]);
  const [selected, setSelected] = useState<LeadPreview | null>(null);
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [comentarios, setComentarios] = useState("");
  const [consumoMedio, setConsumoMedio] = useState<number>(0);
  const [address, setAddress] = useState<Address>({});

  // Circuit breaker simples para evitar loops de retry quando Supabase está indisponível
  const [demoUntilTs, setDemoUntilTs] = useState<number | null>(null);

  const debouncedQuery = useDebounce(query, 300);

  const demoService = useMemo(() => DemoDataService.getInstance(), []);

  const mapFromDB = useCallback((row: any): LeadPreview => ({
    id: row.id,
    name: row.name,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    address: typeof row.address === "object" && row.address !== null ? (row.address as Address) : undefined,
    consumoMedio: typeof row.consumo_medio === "number" ? row.consumo_medio : undefined,
    status: row.status ?? undefined,
    created_at: row.created_at ?? undefined,
    updated_at: row.updated_at ?? undefined,
  }), []);

  const fetchFromSupabase = useCallback(async (term: string) => {
    const like = `%${term}%`;
    const { data, error } = await supabase
      .from("leads")
      .select("id, name, email, phone, address, consumo_medio, status, created_at, updated_at")
      .or(`name.ilike.${like},email.ilike.${like},phone.ilike.${like}`)
      .order("updated_at", { ascending: false })
      .limit(maxResults);

    if (error) throw error;
    return (data ?? []).map(mapFromDB);
  }, [mapFromDB, maxResults]);

  const fetchFromDemo = useCallback((term: string) => {
    const all = demoService.getLeads();
    const lower = term.toLowerCase();
    return all
      .filter((l) => l.name.toLowerCase().includes(lower) || (l.email ?? "").toLowerCase().includes(lower) || (l.phone ?? "").includes(term))
      .slice(0, maxResults)
      .map((l) => ({
        id: l.id!,
        name: l.name,
        email: l.email,
        phone: l.phone,
        address: l.address,
        consumoMedio: l.consumoMedio,
        status: l.status,
        created_at: l.created_at,
        updated_at: l.updated_at,
      } satisfies LeadPreview));
  }, [demoService, maxResults]);

  useEffect(() => {
    let active = true;

    const run = async () => {
      if (!debouncedQuery) {
        setResults([]);
        return;
      }
      setLoading(true);
      try {
        const now = Date.now();
        const circuitOpen = demoUntilTs !== null && now < demoUntilTs;
        const useDemo = circuitOpen || demoService.shouldUseDemoData();
        const list = useDemo ? fetchFromDemo(debouncedQuery) : await fetchFromSupabase(debouncedQuery);
        if (!active) return;
        setResults(list);
      } catch (err: any) {
        logError("Erro ao buscar leads", { service: "LeadSearchDropdown", error: err?.message || String(err) });
        // Abrir "circuit breaker" por 60s para evitar loops de retry
        const until = Date.now() + 60_000;
        setDemoUntilTs(until);
        const list = fetchFromDemo(debouncedQuery);
        if (!active) return;
        setResults(list);
        toast({ title: "Modo offline", description: "Exibindo dados de exemplo devido à indisponibilidade do Supabase." });
      } finally {
        if (active) setLoading(false);
      }
    };

    run();
    return () => {
      active = false;
    };
  }, [debouncedQuery, fetchFromDemo, fetchFromSupabase, demoService, demoUntilTs]);

  // Atualiza seção de detalhes quando muda o selecionado
  useEffect(() => {
    if (selected) {
      setCpfCnpj(""); // não exibir valor sensível salvo inadvertidamente
      setComentarios("");
      setConsumoMedio(selected.consumoMedio ?? 0);
      setAddress(selected.address ?? {});
    }
  }, [selected]);

  const handleSelect = (lead: LeadPreview) => {
    setSelected(lead);
    onLeadSelect({
      id: lead.id,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      address: lead.address,
      consumoMedio: lead.consumoMedio,
      status: lead.status,
      updated_at: lead.updated_at,
      created_at: lead.created_at,
    });
  };

  const saveCleanPayload = async () => {
    if (!selected) return;

    try {
      const payload = {
        name: selected.name,
        email: selected.email ?? null,
        phone: selected.phone ?? null,
        address: address && Object.keys(address).length > 0 ? address : null,
        cpf_cnpj: cpfCnpj || null,
        consumo_medio: typeof consumoMedio === "number" ? consumoMedio : null,
        comentarios: comentarios || null,
        updated_at: new Date().toISOString(),
      };

      const { data, error } = selected.id
        ? await supabase.from("leads").update(payload).eq("id", selected.id).select().single()
        : await supabase.from("leads").insert(payload).select().single();

      if (error) throw error;

      toast({ title: "Lead salvo", description: "As informações foram salvas com sucesso." });
      // Atualiza estado local com dados retornados
      const refreshed = mapFromDB(data);
      setSelected(refreshed);
      onLeadSelect({ ...refreshed });
    } catch (err: any) {
      logError("Erro ao salvar lead", { service: "LeadSearchDropdown", error: err?.message || String(err) });
      toast({ title: "Erro ao salvar", description: "Não foi possível salvar no Supabase.", variant: "destructive" });
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={placeholder} />
        {onNewLead && <Button variant="outline" onClick={onNewLead}>Novo</Button>}
        {onViewTable && <Button variant="outline" onClick={onViewTable}>Ver Tabela</Button>}
      </div>

      {/* Lista de resultados */}
      {debouncedQuery && (
        <Card className="mt-3">
          <CardContent className="p-2">
            {loading && <div className="text-sm text-muted-foreground p-2">Buscando...</div>}
            {!loading && results.length === 0 && (
              <div className="text-sm text-muted-foreground p-2">Nenhum resultado encontrado</div>
            )}
            <div className="max-h-72 overflow-auto divide-y">
              {results.map((lead) => (
                <div
                  key={lead.id}
                  onClick={() => handleSelect(lead)}
                  className={`p-2 cursor-pointer hover:bg-accent rounded-sm ${selectedLeadId === lead.id ? "bg-accent/50" : ""}`}
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium truncate">{lead.name}</div>
                    {lead.status && <Badge variant="secondary">{lead.status}</Badge>}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">{lead.email || lead.phone || "Sem contato"}</div>
                  {lead.address?.city && (
                    <div className="text-xs text-muted-foreground truncate">
                      {lead.address.city} {lead.address.state ? `- ${lead.address.state}` : ""}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seção de detalhes e edição local */}
      {selected && (
        <Card className="mt-4">
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{selected.name}</div>
                <div className="text-xs text-muted-foreground">ID: {selected.id}</div>
              </div>
              {selected.status && <Badge variant="outline">{selected.status}</Badge>}
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">CPF/CNPJ (local)</label>
                <Input value={cpfCnpj} onChange={(e) => setCpfCnpj(e.target.value)} placeholder="000.000.000-00" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Consumo médio (kWh)</label>
                <Input type="number" value={consumoMedio} onChange={(e) => setConsumoMedio(Number(e.target.value) || 0)} />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-muted-foreground">Comentários</label>
                <Input value={comentarios} onChange={(e) => setComentarios(e.target.value)} placeholder="Observações" />
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-muted-foreground">CEP</label>
                <Input value={address.cep ?? ""} onChange={(e) => setAddress({ ...address, cep: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Estado</label>
                <Input value={address.state ?? ""} onChange={(e) => setAddress({ ...address, state: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Cidade</label>
                <Input value={address.city ?? ""} onChange={(e) => setAddress({ ...address, city: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Bairro</label>
                <Input value={address.neighborhood ?? ""} onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })} />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs text-muted-foreground">Rua</label>
                <Input value={address.street ?? ""} onChange={(e) => setAddress({ ...address, street: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Número</label>
                <Input value={address.number ?? ""} onChange={(e) => setAddress({ ...address, number: e.target.value })} />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => onViewTable?.()}>Ver Tabela</Button>
              <Button onClick={saveCleanPayload}>Salvar</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}