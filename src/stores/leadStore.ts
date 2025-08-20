import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { supabase } from '@/integrations/supabase/client';
import { logError, logInfo } from '@/utils/secureLogger';

// Interface para dados de lead
export interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  consumo_medio?: number;
  status?: string;
  created_at?: string;
  updated_at?: string;
  address?: string | Record<string, unknown>;
  user_id?: string;
}

// Interface para o store
interface LeadStore {
  // Estado
  leads: Lead[];
  selectedLead: Lead | null;
  isLoading: boolean;
  lastSync: string | null;
  searchTerm: string;
  filterStatus: string;
  
  // Ações
  setLeads: (leads: Lead[]) => void;
  addLead: (lead: Lead) => void;
  updateLead: (leadId: string, updates: Partial<Lead>) => void;
  removeLead: (leadId: string) => void;
  setSelectedLead: (lead: Lead | null) => void;
  setLoading: (loading: boolean) => void;
  setSearchTerm: (term: string) => void;
  setFilterStatus: (status: string) => void;
  
  // Ações assíncronas
  fetchLeads: () => Promise<void>;
  refreshLeads: () => Promise<void>;
  syncCompleted: () => void;
  
  // Getters
  getFilteredLeads: () => Lead[];
  getLeadById: (id: string) => Lead | undefined;
}

// Store Zustand com devtools
export const useLeadStore = create<LeadStore>()(devtools(
    (set, get) => ({
      // Estado inicial
      leads: [],
      selectedLead: null,
      isLoading: false,
      lastSync: null,
      searchTerm: '',
      filterStatus: 'all',
      
      // Definir lista de leads
      setLeads: (leads: Lead[]) => {
        set({ leads }, false, 'setLeads');
      },
      
      // Adicionar novo lead
      addLead: (lead: Lead) => {
        const currentLeads = get().leads;
        set({ leads: [lead, ...currentLeads] }, false, 'addLead');
      },
      
      // Atualizar lead existente
      updateLead: (leadId: string, updates: Partial<Lead>) => {
        const currentLeads = get().leads;
        const updatedLeads = currentLeads.map(lead => 
          lead.id === leadId ? { ...lead, ...updates } : lead
        );
        set({ leads: updatedLeads }, false, 'updateLead');
        
        // Atualizar lead selecionado se for o mesmo
        const selectedLead = get().selectedLead;
        if (selectedLead && selectedLead.id === leadId) {
          set({ selectedLead: { ...selectedLead, ...updates } }, false, 'updateSelectedLead');
        }
      },
      
      // Remover lead
      removeLead: (leadId: string) => {
        const currentLeads = get().leads;
        const filteredLeads = currentLeads.filter(lead => lead.id !== leadId);
        set({ leads: filteredLeads }, false, 'removeLead');
        
        // Limpar lead selecionado se for o mesmo
        const selectedLead = get().selectedLead;
        if (selectedLead && selectedLead.id === leadId) {
          set({ selectedLead: null }, false, 'clearSelectedLead');
        }
      },
      
      // Definir lead selecionado
      setSelectedLead: (lead: Lead | null) => {
        set({ selectedLead: lead }, false, 'setSelectedLead');
      },
      
      // Definir estado de carregamento
      setLoading: (loading: boolean) => {
        set({ isLoading: loading }, false, 'setLoading');
      },
      
      // Definir termo de busca
      setSearchTerm: (term: string) => {
        set({ searchTerm: term }, false, 'setSearchTerm');
      },
      
      // Definir filtro de status
      setFilterStatus: (status: string) => {
        set({ filterStatus: status }, false, 'setFilterStatus');
      },
      
      // Buscar leads do Supabase com fallback
      fetchLeads: async () => {
        const { setLoading, setLeads } = get();
        
        setLoading(true);
        try {
          const { data: leads, error } = await supabase
            .from('leads')
            .select('id, name, email, phone, consumo_medio, status, created_at, updated_at, address, user_id')
            .order('created_at', { ascending: false });
          
          if (error) {
            // Se a tabela não existir, usar dados de fallback
            if (error.code === '42P01' || error.message?.includes('does not exist')) {
              console.warn('Tabela leads não existe, usando dados de fallback');
              const fallbackLeads = [
                {
                  id: 'demo-1',
                  name: 'João Silva (Demo)',
                  email: 'joao.silva@demo.com',
                  phone: '(11) 99999-9999',
                  consumo_medio: 350,
                  status: 'novo',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  address: 'Rua Demo, 123',
                  user_id: 'demo-user'
                },
                {
                  id: 'demo-2',
                  name: 'Maria Santos (Demo)',
                  email: 'maria.santos@demo.com',
                  phone: '(11) 88888-8888',
                  consumo_medio: 420,
                  status: 'contato',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  address: 'Rua Demo, 456',
                  user_id: 'demo-user'
                }
              ];
              setLeads(fallbackLeads);
              logInfo('Dados de fallback carregados', {
                count: fallbackLeads.length,
                service: 'LeadStore'
              });
              return;
            }
            throw error;
          }
          
          setLeads(leads || []);
          logInfo('Leads carregados com sucesso', {
            count: leads?.length || 0,
            service: 'LeadStore'
          });
        } catch (error) {
          logError('Erro ao carregar leads', {
            error: error instanceof Error ? error.message : String(error),
            service: 'LeadStore'
          });
          
          // Em caso de erro, definir lista vazia para evitar crashes
          setLeads([]);
        } finally {
          setLoading(false);
        }
      },
      
      // Atualizar lista de leads (força reload)
      refreshLeads: async () => {
        const { fetchLeads } = get();
        await fetchLeads();
      },
      
      // Marcar sincronização como concluída
      syncCompleted: () => {
        set({ lastSync: new Date().toISOString() }, false, 'syncCompleted');
        
        // Atualizar lista de leads após sincronização com retry
        const { refreshLeads } = get();
        const attemptRefresh = async (retries = 3) => {
          try {
            await refreshLeads();
            logInfo('Leads atualizados após sincronização', {
              service: 'LeadStore'
            });
          } catch (error) {
            if (retries > 0) {
              console.warn(`Tentativa de atualização falhou, tentando novamente... (${retries} tentativas restantes)`);
              setTimeout(() => attemptRefresh(retries - 1), 2000);
            } else {
              logError('Erro ao atualizar leads após sincronização', {
                error: error instanceof Error ? error.message : String(error),
                service: 'LeadStore'
              });
            }
          }
        };
        
        // Aguardar um pouco antes de tentar atualizar
        setTimeout(() => attemptRefresh(), 1000);
      },
      
      // Obter leads filtrados
      getFilteredLeads: () => {
        const { leads, searchTerm, filterStatus } = get();
        
        return leads.filter(lead => {
          // Filtro por termo de busca
          const matchesSearch = !searchTerm || 
            lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (lead.phone && lead.phone.includes(searchTerm));
          
          // Filtro por status
          const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;
          
          return matchesSearch && matchesStatus;
        });
      },
      
      // Obter lead por ID
      getLeadById: (id: string) => {
        const { leads } = get();
        return leads.find(lead => lead.id === id);
      }
    }),
    {
      name: 'lead-store'
    }
  ));

// Hook personalizado para facilitar o uso
export const useLeads = () => {
  const store = useLeadStore();
  
  return {
    // Estado
    leads: store.leads,
    selectedLead: store.selectedLead,
    isLoading: store.isLoading,
    lastSync: store.lastSync,
    searchTerm: store.searchTerm,
    filterStatus: store.filterStatus,
    
    // Ações
    setLeads: store.setLeads,
    addLead: store.addLead,
    updateLead: store.updateLead,
    removeLead: store.removeLead,
    setSelectedLead: store.setSelectedLead,
    setLoading: store.setLoading,
    setSearchTerm: store.setSearchTerm,
    setFilterStatus: store.setFilterStatus,
    
    // Ações assíncronas
    fetchLeads: store.fetchLeads,
    refreshLeads: store.refreshLeads,
    syncCompleted: store.syncCompleted,
    
    // Getters
    filteredLeads: store.getFilteredLeads(),
    getLeadById: store.getLeadById,
    
    // Helpers
    hasLeads: () => store.leads.length > 0,
    getLeadCount: () => store.leads.length,
    getFilteredCount: () => store.getFilteredLeads().length
  };
};

// Tipos exportados
export type { LeadStore };