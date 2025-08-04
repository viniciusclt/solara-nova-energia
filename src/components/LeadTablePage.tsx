import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Search, Filter, Plus, Copy, Trash2, User, ArrowLeft, Calendar, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useDebounce } from "@/hooks/useDebounce";
import { logError } from "@/utils/secureLogger";

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
  address?: {
    city?: string;
    state?: string;
  };
}

interface LeadTablePageProps {
  onLeadSelect?: (lead: Lead) => void;
  selectedLeadId?: string | null;
  onNewLead?: () => void;
  onBack?: () => void;
  searchQuery?: string;
  showActions?: boolean;
}

interface LeadFilters {
  status?: string[];
  dateRange?: {
    start: string;
    end: string;
  };
  consumptionRange?: {
    min: number;
    max: number;
  };
  city?: string[];
}

export function LeadTablePage({ 
  onLeadSelect, 
  selectedLeadId, 
  onNewLead,
  onBack,
  searchQuery = "",
  showActions = true
}: LeadTablePageProps) {
  const { toast } = useToast();
  const { profile } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [allConcessionarias, setAllConcessionarias] = useState<string[]>([]);
  const [allGrupos, setAllGrupos] = useState<string[]>([]);
  const [allCities, setAllCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchQuery);
  const [filterConcessionaria, setFilterConcessionaria] = useState("");
  const [filterGrupo, setFilterGrupo] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [filterDateStart, setFilterDateStart] = useState("");
  const [filterDateEnd, setFilterDateEnd] = useState("");
  const [filterConsumoMin, setFilterConsumoMin] = useState("");
  const [filterConsumoMax, setFilterConsumoMax] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "created_at" | "updated_at" | "consumo_medio">("updated_at");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 15;

  // Debounce da busca
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Carregar opções de filtro na inicialização
  useEffect(() => {
    fetchFilterOptions();
  }, []);

  // Buscar leads quando filtros mudarem
  useEffect(() => {
    fetchLeads();
  }, [
    currentPage, 
    sortBy, 
    sortOrder, 
    debouncedSearchTerm, 
    filterConcessionaria, 
    filterGrupo,
    filterCity,
    filterDateStart,
    filterDateEnd,
    filterConsumoMin,
    filterConsumoMax,
    fetchLeads
  ]);

  // Resetar página quando filtros mudarem
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [
    debouncedSearchTerm, 
    filterConcessionaria, 
    filterGrupo, 
    filterCity,
    filterDateStart,
    filterDateEnd,
    filterConsumoMin,
    filterConsumoMax,
    currentPage
  ]);

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

      // Buscar todas as cidades únicas
      const { data: addressData } = await supabase
        .from('leads')
        .select('address')
        .not('address', 'is', null);

      const cities = Array.from(
        new Set(
          addressData
            ?.map(item => item.address?.city)
            .filter(Boolean)
        )
      ).sort();

      setAllConcessionarias(concessionarias);
      setAllGrupos(grupos);
      setAllCities(cities);
    } catch (error) {
      logError('Erro ao carregar opções de filtro de leads', {
        service: 'LeadTablePage',
        error: (error as Error).message || 'Erro desconhecido'
      });
    }
  };

  const fetchLeads = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('leads')
        .select('id, name, email, phone, concessionaria, grupo, consumo_medio, created_at, updated_at, address', { count: 'exact' })
        .order(sortBy, { ascending: sortOrder === 'asc' });

      // Aplicar filtros na query
      if (debouncedSearchTerm) {
        query = query.or(`name.ilike.%${debouncedSearchTerm}%,email.ilike.%${debouncedSearchTerm}%,phone.ilike.%${debouncedSearchTerm}%`);
      }

      if (filterConcessionaria) {
        query = query.eq('concessionaria', filterConcessionaria);
      }

      if (filterGrupo) {
        query = query.eq('grupo', filterGrupo);
      }

      if (filterDateStart) {
        query = query.gte('created_at', filterDateStart);
      }

      if (filterDateEnd) {
        query = query.lte('created_at', filterDateEnd + 'T23:59:59');
      }

      if (filterConsumoMin) {
        query = query.gte('consumo_medio', parseInt(filterConsumoMin));
      }

      if (filterConsumoMax) {
        query = query.lte('consumo_medio', parseInt(filterConsumoMax));
      }

      // Aplicar paginação
      query = query.range((currentPage - 1) * pageSize, currentPage * pageSize - 1);

      const { data, error, count } = await query;

      if (error) throw error;

      // Filtrar por cidade se necessário (filtro no frontend devido à estrutura JSON)
      let filteredData = data || [];
      if (filterCity) {
        filteredData = filteredData.filter(lead => 
          lead.address && lead.address.city === filterCity
        );
      }

      setLeads(filteredData);
      setTotalCount(count || 0);
      setTotalPages(Math.ceil((count || 0) / pageSize));
    } catch (error) {
      logError('Erro ao carregar leads', {
        service: 'LeadTablePage',
        error: (error as Error).message || 'Erro desconhecido',
        filters: {
          searchTerm: debouncedSearchTerm,
          concessionaria: filterConcessionaria,
          grupo: filterGrupo,
          city: filterCity
        }
      });
      toast({
        title: "Erro",
        description: "Erro ao carregar leads",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = useCallback((type: string, value: string) => {
    const newValue = value === "none" ? "" : value;
    
    switch (type) {
      case 'concessionaria':
        setFilterConcessionaria(newValue);
        break;
      case 'grupo':
        setFilterGrupo(newValue);
        break;
      case 'city':
        setFilterCity(newValue);
        break;
    }
  }, []);

  const handleLeadSelect = (lead: Lead) => {
    if (onLeadSelect) {
      onLeadSelect(lead);
      // Salvar no localStorage para persistir entre sessões
      localStorage.setItem('selectedLeadId', lead.id);
      toast({
        title: "Lead selecionado",
        description: `${lead.name} foi selecionado`,
      });
    }
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
      logError('Erro ao duplicar lead', {
        service: 'LeadTablePage',
        error: (error as Error).message || 'Erro desconhecido',
        leadId: lead.id,
        leadName: lead.name
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
        service: 'LeadTablePage',
        error: (error as Error).message || 'Erro desconhecido',
        leadId: leadId
      });
      toast({
        title: "Erro",
        description: "Erro ao excluir lead",
        variant: "destructive"
      });
    }
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setFilterConcessionaria("");
    setFilterGrupo("");
    setFilterCity("");
    setFilterDateStart("");
    setFilterDateEnd("");
    setFilterConsumoMin("");
    setFilterConsumoMax("");
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getFilterCount = () => {
    const hasFilters = debouncedSearchTerm || filterConcessionaria || filterGrupo || filterCity || 
                      filterDateStart || filterDateEnd || filterConsumoMin || filterConsumoMax;
    if (!hasFilters) return `Total: ${totalCount} leads`;
    
    const start = (currentPage - 1) * pageSize + 1;
    const end = Math.min(currentPage * pageSize, totalCount);
    return `Mostrando ${start}-${end} de ${totalCount} leads filtrados`;
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
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Tabela Completa de Leads
              </CardTitle>
              <CardDescription>
                {getFilterCount()}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              {onBack && (
                <Button variant="outline" onClick={onBack}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              )}
              {onNewLead && (
                <Button onClick={onNewLead}>
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Lead
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Filtros avançados */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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

            <div>
              <Label htmlFor="city">Cidade</Label>
              <Select value={filterCity || "none"} onValueChange={(value) => handleFilterChange('city', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Todas</SelectItem>
                  {allCities.map(value => (
                    <SelectItem key={value} value={value}>{value}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="dateStart">Data Início</Label>
              <Input
                id="dateStart"
                type="date"
                value={filterDateStart}
                onChange={(e) => setFilterDateStart(e.target.value)}
                aria-label="Data de início para filtrar leads"
              />
            </div>

            <div>
              <Label htmlFor="dateEnd">Data Fim</Label>
              <Input
                id="dateEnd"
                type="date"
                value={filterDateEnd}
                onChange={(e) => setFilterDateEnd(e.target.value)}
                aria-label="Data de fim para filtrar leads"
              />
            </div>

            <div>
              <Label htmlFor="consumoMin">Consumo Mín (kWh)</Label>
              <Input
                id="consumoMin"
                type="number"
                placeholder="0"
                value={filterConsumoMin}
                onChange={(e) => setFilterConsumoMin(e.target.value)}
                aria-label="Consumo mínimo em kWh para filtrar leads"
              />
            </div>

            <div>
              <Label htmlFor="consumoMax">Consumo Máx (kWh)</Label>
              <Input
                id="consumoMax"
                type="number"
                placeholder="10000"
                value={filterConsumoMax}
                onChange={(e) => setFilterConsumoMax(e.target.value)}
                aria-label="Consumo máximo em kWh para filtrar leads"
              />
            </div>
          </div>

          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={clearAllFilters}>
              <Filter className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
          </div>

          {/* Tabela de leads */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => {
                      setSortBy("name");
                      setSortOrder(sortBy === "name" && sortOrder === "asc" ? "desc" : "asc");
                    }}
                  >
                    Nome {sortBy === "name" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Concessionária</TableHead>
                  <TableHead>Cidade</TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => {
                      setSortBy("consumo_medio");
                      setSortOrder(sortBy === "consumo_medio" && sortOrder === "asc" ? "desc" : "asc");
                    }}
                  >
                    Consumo {sortBy === "consumo_medio" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  <TableHead 
                    className="cursor-pointer hover:bg-muted"
                    onClick={() => {
                      setSortBy("updated_at");
                      setSortOrder(sortBy === "updated_at" && sortOrder === "asc" ? "desc" : "asc");
                    }}
                  >
                    Atualizado {sortBy === "updated_at" && (sortOrder === "asc" ? "↑" : "↓")}
                  </TableHead>
                  {showActions && <TableHead>Ações</TableHead>}
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
                      {lead.address?.city ? (
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {lead.address.city}
                        </div>
                      ) : "-"}
                    </TableCell>
                    <TableCell>
                      {lead.consumo_medio ? `${lead.consumo_medio} kWh` : "-"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(lead.updated_at)}
                      </div>
                    </TableCell>
                    {showActions && (
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {onLeadSelect && (
                            <Button
                              size="sm"
                              variant={selectedLeadId === lead.id ? "default" : "outline"}
                              onClick={() => handleLeadSelect(lead)}
                            >
                              {selectedLeadId === lead.id ? "Selecionado" : "Selecionar"}
                            </Button>
                          )}
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
                    )}
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
                    className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
                
                {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                  let page;
                  if (totalPages <= 5) {
                    page = i + 1;
                  } else if (currentPage <= 3) {
                    page = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    page = totalPages - 4 + i;
                  } else {
                    page = currentPage - 2 + i;
                  }
                  
                  return (
                    <PaginationItem key={page}>
                      <PaginationLink
                        onClick={() => setCurrentPage(page)}
                        isActive={currentPage === page}
                        className="cursor-pointer"
                      >
                        {page}
                      </PaginationLink>
                    </PaginationItem>
                  );
                })}
                
                <PaginationItem>
                  <PaginationNext 
                    onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                    className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>
          )}

          {leads.length === 0 && !loading && (
            <div className="text-center py-8 text-muted-foreground">
              <User className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum lead encontrado</p>
              {(debouncedSearchTerm || filterConcessionaria || filterGrupo) && (
                <Button variant="outline" onClick={clearAllFilters} className="mt-4">
                  Limpar filtros
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}