import { useState, useEffect, useCallback } from "react";
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

interface Lead {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  concessionaria: string | null;
  grupo: string | null;
  consumo_medio: number | null;
  created_at: string;
  updated_at: string;
}

interface LeadListProps {
  onLeadSelect: (lead: Lead) => void;
  selectedLeadId: string | null;
  onNewLead: () => void;
}

export function LeadList({ onLeadSelect, selectedLeadId, onNewLead }: LeadListProps) {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [allConcessionarias, setAllConcessionarias] = useState<string[]>([]);
  const [allGrupos, setAllGrupos] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterConcessionaria, setFilterConcessionaria] = useState("");
  const [filterGrupo, setFilterGrupo] = useState("");
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
  }, [currentPage, sortBy, sortOrder, searchTerm, filterConcessionaria, filterGrupo]);

  // Resetar página quando filtros mudarem
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [searchTerm, filterConcessionaria, filterGrupo]);

  const fetchFilterOptions = async () => {
    try {
      // Buscar todas as concessionárias únicas
      const { data: concessionariaData } = await supabase
        .from('leads')
        .select('concessionaria')
        .not('concessionaria', 'is', null)
        .neq('concessionaria', '');

      const concessionarias = Array.from(
        new Set(concessionariaData?.map(item => item.concessionaria).filter(Boolean))
      ).sort();

      // Buscar todos os grupos únicos
      const { data: grupoData } = await supabase
        .from('leads')
        .select('grupo')
        .not('grupo', 'is', null)
        .neq('grupo', '');

      const grupos = Array.from(
        new Set(grupoData?.map(item => item.grupo).filter(Boolean))
      ).sort();

      setAllConcessionarias(concessionarias);
      setAllGrupos(grupos);
    } catch (error) {
      console.error('Error fetching filter options:', error);
    }
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('leads')
        .select('id, name, email, phone, concessionaria, grupo, consumo_medio, created_at, updated_at', { count: 'exact' })
        .order(sortBy, { ascending: sortOrder === 'asc' });

      // Aplicar filtros na query
      if (searchTerm) {
        query = query.or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,phone.ilike.%${searchTerm}%`);
      }

      if (filterConcessionaria) {
        query = query.eq('concessionaria', filterConcessionaria);
      }

      if (filterGrupo) {
        query = query.eq('grupo', filterGrupo);
      }

      // Aplicar paginação
      query = query.range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      setLeads(data || []);
      setTotalCount(count || 0);
      setTotalPages(Math.ceil((count || 0) / pageSize));
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: "Erro",
        description: "Erro ao carregar leads",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = useCallback((type: 'concessionaria' | 'grupo', value: string) => {
    const newValue = value === "none" ? "" : value;
    
    if (type === 'concessionaria') {
      setFilterConcessionaria(newValue);
    } else {
      setFilterGrupo(newValue);
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
        .select('*')
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
      console.error('Error duplicating lead:', error);
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
      console.error('Error deleting lead:', error);
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

  const getFilterCount = () => {
    const hasFilters = searchTerm || filterConcessionaria || filterGrupo;
    if (!hasFilters) return `Total: ${totalCount} leads`;
    
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalCount);
    return `Mostrando ${start}-${end} de ${totalCount} leads`;
  };

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
          {getFilterCount()}
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
              />
            </div>
          </div>

          <div>
            <Label htmlFor="concessionaria">Concessionária</Label>
            <Select value={filterConcessionaria || "none"} onValueChange={(value) => handleFilterChange('concessionaria', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todas" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Todas</SelectItem>
                {allConcessionarias.map(value => (
                  <SelectItem key={value} value={value}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="grupo">Grupo</Label>
            <Select value={filterGrupo || "none"} onValueChange={(value) => handleFilterChange('grupo', value)}>
              <SelectTrigger>
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Todos</SelectItem>
                {allGrupos.map(value => (
                  <SelectItem key={value} value={value}>{value}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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
                <TableHead>Concessionária</TableHead>
                <TableHead>Consumo Médio</TableHead>
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
                  <TableCell>{lead.concessionaria || "-"}</TableCell>
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
}