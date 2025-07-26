import { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, User, Plus, Table } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useDebounce } from "@/hooks/useDebounce";

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

interface LeadSearchDropdownProps {
  onLeadSelect: (lead: Lead) => void;
  selectedLeadId: string | null;
  onNewLead: () => void;
  onViewTable: () => void;
  placeholder?: string;
  maxResults?: number;
}

export function LeadSearchDropdown({ 
  onLeadSelect, 
  selectedLeadId, 
  onNewLead,
  onViewTable,
  placeholder = "Buscar lead por nome, email ou telefone...",
  maxResults = 8
}: LeadSearchDropdownProps) {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Debounce da busca para evitar requisições excessivas
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Buscar leads quando o termo de busca mudar
  useEffect(() => {
    if (debouncedSearchTerm && debouncedSearchTerm.length >= 2) {
      fetchLeads(debouncedSearchTerm);
    } else {
      setLeads([]);
      setShowDropdown(false);
    }
  }, [debouncedSearchTerm, fetchLeads]);

  // Carregar lead selecionado na inicialização
  useEffect(() => {
    if (selectedLeadId && !selectedLead) {
      loadSelectedLead(selectedLeadId);
    }
  }, [selectedLeadId, selectedLead]);

  // Fechar dropdown ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadSelectedLead = async (leadId: string) => {
    try {
      const { data: lead, error } = await supabase
        .from('leads')
        .select('id, name, email, phone, concessionaria, grupo, consumo_medio, created_at, updated_at')
        .eq('id', leadId)
        .single();

      if (error) throw error;

      if (lead) {
        setSelectedLead(lead);
        setSearchTerm(lead.name);
      }
    } catch (error) {
      console.error('Error loading selected lead:', error);
    }
  };

  const fetchLeads = async (term: string) => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('leads')
        .select('id, name, email, phone, concessionaria, grupo, consumo_medio, created_at, updated_at')
        .or(`name.ilike.%${term}%,email.ilike.%${term}%,phone.ilike.%${term}%`)
        .order('updated_at', { ascending: false })
        .limit(maxResults);

      if (error) throw error;

      setLeads(data || []);
      setShowDropdown(true);
    } catch (error) {
      console.error('Error fetching leads:', error);
      toast({
        title: "Erro",
        description: "Erro ao buscar leads",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLeadSelect = (lead: Lead) => {
    setSelectedLead(lead);
    setSearchTerm(lead.name);
    setShowDropdown(false);
    onLeadSelect(lead);
    
    // Salvar no localStorage
    localStorage.setItem('selectedLeadId', lead.id);
    
    toast({
      title: "Lead selecionado",
      description: `${lead.name} foi selecionado`,
    });
  };

  const handleInputChange = (value: string) => {
    setSearchTerm(value);
    
    // Se limpar o campo, limpar seleção
    if (!value) {
      setSelectedLead(null);
      setShowDropdown(false);
    }
  };

  const handleInputFocus = () => {
    if (searchTerm.length >= 2) {
      setShowDropdown(true);
    }
  };

  const clearSelection = () => {
    setSelectedLead(null);
    setSearchTerm("");
    setShowDropdown(false);
    localStorage.removeItem('selectedLeadId');
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <div className="space-y-4">
      {/* Campo de busca */}
      <div className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            ref={inputRef}
            placeholder={placeholder}
            value={searchTerm}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={handleInputFocus}
            className="pl-10 pr-4"
          />
          {loading && (
            <div className="absolute right-3 top-3">
              <div className="animate-spin h-4 w-4 border-2 border-primary border-t-transparent rounded-full" />
            </div>
          )}
        </div>

        {/* Dropdown com resultados */}
        {showDropdown && (
          <Card 
            ref={dropdownRef}
            className="absolute top-full left-0 right-0 z-50 mt-1 max-h-96 overflow-y-auto shadow-lg"
          >
            <CardContent className="p-2">
              {leads.length > 0 ? (
                <div className="space-y-1">
                  {leads.map((lead) => (
                    <div
                      key={lead.id}
                      className="flex items-center justify-between p-3 rounded-lg hover:bg-muted cursor-pointer transition-colors"
                      onClick={() => handleLeadSelect(lead)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <span className="font-medium truncate">{lead.name}</span>
                          {selectedLeadId === lead.id && (
                            <Badge variant="default" className="text-xs">Selecionado</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          <div className="flex items-center gap-4">
                            {lead.email && (
                              <span className="truncate">{lead.email}</span>
                            )}
                            {lead.phone && (
                              <span>{lead.phone}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1">
                            {lead.concessionaria && (
                              <Badge variant="outline" className="text-xs">
                                {lead.concessionaria}
                              </Badge>
                            )}
                            {lead.consumo_medio && (
                              <span className="text-xs">
                                {lead.consumo_medio} kWh/mês
                              </span>
                            )}
                            <span className="text-xs">
                              Atualizado: {formatDate(lead.updated_at)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-muted-foreground">
                  {loading ? "Buscando..." : "Nenhum lead encontrado"}
                </div>
              )}
              
              {/* Ações do dropdown */}
              <div className="border-t mt-2 pt-2 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowDropdown(false);
                    onViewTable();
                  }}
                  className="flex-1"
                >
                  <Table className="h-4 w-4 mr-2" />
                  Ver Tabela Completa
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setShowDropdown(false);
                    onNewLead();
                  }}
                  className="flex-1"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Lead
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Lead selecionado */}
      {selectedLead && (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium">{selectedLead.name}</div>
                  <div className="text-sm text-muted-foreground">
                    {selectedLead.email} • {selectedLead.phone}
                  </div>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearSelection}
              >
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}