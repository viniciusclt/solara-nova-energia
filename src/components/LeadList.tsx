import { useState, useEffect, useCallback, useMemo, memo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Search, Filter, Plus, Copy, Trash2, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DemoDataService } from "@/services/DemoDataService";
import { logError } from "@/utils/secureLogger";

interface Address {
  street?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  country?: string;
  [key: string]: string | undefined;
}

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  consumo_medio: number | null;
  status: string;
  created_at: string;
  updated_at: string;
  address?: Address | string | null;
  user_id?: string;
}

interface LeadListProps {
  onLeadSelect: (lead: Lead) => void;
  selectedLeadId: string | null;
  onNewLead: () => void;
}

export const LeadList = memo(function LeadList({ onLeadSelect, selectedLeadId, onNewLead }: LeadListProps) {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [allStatuses, setAllStatuses] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "created_at" | "updated_at">("updated_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 10;

  // Carregar opções de filtro na inicialização
  useEffect(() => {
    fetchFilterOptions();
  }, []);

  // Buscar leads quando filtros ou página mudarem
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchLeads();
    }, searchTerm ? 300 : 0); // Debounce para busca por texto

    return () => clearTimeout(timer);
  }, [fetchLeads, searchTerm]);

  // Resetar página quando filtros mudarem
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [currentPage, searchTerm, filterStatus]);

  const fetchFilterOptions = async () => {
    try {
      // Buscar todos os status únicos
      const { data: statusData } = await supabase
        .from('leads')
        .select('status')
        .not('status', 'is', null)
        .neq('status', '');

      const statuses = Array.from(
        new Set(statusData?.map(item => item.status).filter(Boolean))
      ).sort();

      setAllStatuses(statuses);
    } catch (error) {
      logError('Erro ao carregar opções de filtro', {
        error: error instanceof Error ? error.message : String(error),
        service: 'LeadList'
      });
    }
  };

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      
      // Verificar se deve usar dados demo
      const demoService = DemoDataService.getInstance();
      if (demoService.shouldUseDemoData()) {
        const demoLeads = demoService.getLeads().map(lead => ({
          id: lead.id!,
          name: lead.name,
          email: lead.email,
          phone: lead.phone,
          consumo_medio: lead.consumoMedio,
          status: 'Novo',
          created_at: lead.created_at!,
          updated_at: lead.updated_at!
        }));
        
        // Aplicar filtros localmente para dados demo
        let filteredLeads = demoLeads;
        
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          filteredLeads = filteredLeads.filter(lead => 
            lead.name.toLowerCase().includes(term) ||
            (lead.email && lead.email.toLowerCase().includes(term)) ||
            (lead.phone && lead.phone.includes(term))
          );
        }
        
        if (filterStatus) {
          filteredLeads = filteredLeads.filter(lead => lead.status === filterStatus);
        }
        
        // Aplicar ordenação
        filteredLeads.sort((a, b) => {
          const aValue = a[sortBy as keyof typeof a] || '';
          const bValue = b[sortBy as keyof typeof b] || '';
          const comparison = aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
          return sortOrder === 'asc' ? comparison : -comparison;
        });
        
        // Aplicar paginação
        const startIndex = (currentPage - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        const paginatedLeads = filteredLeads.slice(startIndex, endIndex);
        
        setLeads(paginatedLeads);
        setTotalCount(filteredLeads.length);
        setTotalPages(Math.ceil(filteredLeads.length / pageSize));
        return;
      }
      
      // Código original para produção
      let query = supabase
        .from('leads')
        .select('id, name, email, phone, consumo_medio, status, created_at, updated_at', { count: 'exact' })
        .order(sortBy, { ascending: sortOrder === 'asc' });

      // Aplicar filtros na query
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
      }

      if (filterStatus) {
        query = query.eq('status', filterStatus);
      }

      // Aplicar paginação
      query = query.range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      setLeads(data || []);
      setTotalCount(count || 0);
      setTotalPages(Math.ceil((count || 0) / pageSize));
    } catch (error) {
      logError('Erro ao carregar leads', {
        error: error instanceof Error ? error.message : String(error),
        searchTerm,
        filterStatus,
        currentPage,
        service: 'LeadList'
      });
      toast({
        title: "Erro",
        description: "Erro ao carregar leads",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [currentPage, sortBy, sortOrder, searchTerm, filterStatus, toast]);

  const handleFilterChange = useCallback((type: 'status', value: string) => {
    const newValue = value === "none" ? "" : value;
    
    if (type === 'status') {
      setFilterStatus(newValue);
    }
  }, []);

  const handleLeadSelect = (lead: Lead) => {
    onLeadSelect(lead);
    // Salvar no localStorage para persistir entre sessões
    localStorage.setItem('selectedLeadId', lead.id);
    toast({
      title: "Lead selecionado",
      description: `${lead.name} foi selecionado`,
    });
  };

  const handleDuplicateLead = async (lead: Lead) => {
    try {
      // Buscar dados completos do lead
      const { data: fullLead, error } = await supabase
        .from('leads')
        .select('id, name, email, phone, consumo_medio, status, created_at, updated_at, address, user_id')
        .eq('id', lead.id)
        .single();

      if (error) throw error;

      // Criar cópia sem o ID
      const { id, created_at, updated_at, ...leadData } = fullLead;
      const duplicatedLead = {
        ...leadData,
        name: `${leadData.name} (Cópia)`,
        user_id: profile?.id
      };

      const { error: insertError } = await supabase
        .from('leads')
        .insert(duplicatedLead);

      if (insertError) throw insertError;

      toast({
        title: "Lead duplicado",
        description: "Lead foi duplicado com sucesso",
      });

      fetchLeads();
    } catch (error) {
      logError('Erro ao duplicar lead', {
        error: error instanceof Error ? error.message : String(error),
        leadId: lead.id,
        leadName: lead.name,
        service: 'LeadList'
      });
      toast({
        title: "Erro",
        description: "Erro ao duplicar lead",
        variant: "destructive"
      });
    }
  };

  const handleDeleteLead = async (leadId: string) => {
    if (!confirm('Tem certeza que deseja excluir este lead?')) return;

    try {
      const { error } = await supabase
        .from('leads')
        .delete()
        .eq('id', leadId);

      if (error) throw error;

      toast({
        title: "Lead excluído",
        description: "Lead foi excluído com sucesso",
      });

      fetchLeads();
    } catch (error) {
      logError('Erro ao excluir lead', {
        error: error instanceof Error ? error.message : String(error),
        leadId,
        service: 'LeadList'
      });
      toast({
        title: "Erro",
        description: "Erro ao excluir lead",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getFilterCount = useMemo(() => {
    const hasFilters = searchTerm || filterStatus;
    if (!hasFilters) return `Total: ${totalCount} leads`;
    
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalCount);
    return `Mostrando ${start}-${end} de ${totalCount} leads`;
  }, [searchTerm, filterStatus, totalCount, currentPage, pageSize]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Carregando leads...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Selecionar Lead
        </CardTitle>
        <CardDescription>
          {getFilterCount}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filtros e busca */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label htmlFor="search">Buscar</Label>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="Nome, email ou telefone..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                aria-label="Buscar leads por nome, email ou telefone"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="status">Status</Label>
            <Select value={filterStatus || "none"} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Todos</SelectItem>
                {allStatuses.map(value => (
                  <SelectItem key={value} value={value}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div></div>

          <div className="flex items-end">
            <Button onClick={onNewLead} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Novo Lead
            </Button>
          </div>
        </div>

        {/* Tabela de leads */}
        <div className="border rounded-lg">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Telefone</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Consumo (kWh)</TableHead>
                <TableHead>Atualizado em</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leads.map((lead) => (
                <TableRow 
                  key={lead.id}
                  className={selectedLeadId === lead.id ? "bg-muted" : ""}
                >
                  <TableCell className="font-medium">{lead.name}</TableCell>
                  <TableCell>{lead.email || "-"}</TableCell>
                  <TableCell>{lead.phone || "-"}</TableCell>
                  <TableCell>{lead.status || "-"}</TableCell>
                  <TableCell>
                    {lead.consumo_medio ? `${lead.consumo_medio} kWh` : "-"}
                  </TableCell>
                  <TableCell>{formatDate(lead.updated_at)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant={selectedLeadId === lead.id ? "default" : "outline"}
                        onClick={() => handleLeadSelect(lead)}
                      >
                        {selectedLeadId === lead.id ? "Selecionado" : "Selecionar"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDuplicateLead(lead)}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteLead(lead.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Paginação */}
        {totalPages > 1 && (
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious 
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
              
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <PaginationItem key={page}>
                  <PaginationLink
                    onClick={() => setCurrentPage(page)}
                    isActive={currentPage === page}
                  >
                    {page}
                  </PaginationLink>
                </PaginationItem>
              ))}
              
              <PaginationItem>
                <PaginationNext 
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  className={currentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}

        {leads.length === 0 && !loading && (
          <div className="text-center py-8 text-muted-foreground">
            Nenhum lead encontrado
          </div>
        )}
      </CardContent>
    </Card>
  );
});