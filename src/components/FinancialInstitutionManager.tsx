import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  Building2, 
  Plus, 
  Edit3, 
  Trash2, 
  Search, 
  Filter,
  CheckCircle2, 
  AlertCircle,
  Eye,
  Download,
  Upload,
  Settings,
  Star,
  StarOff
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface FinancialInstitution {
  id: string;
  nome: string;
  tipo: 'banco' | 'financeira' | 'cooperativa' | 'fintech';
  cnpj?: string;
  telefone?: string;
  email?: string;
  website?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  contato_principal?: string;
  cargo_contato?: string;
  telefone_contato?: string;
  email_contato?: string;
  observacoes?: string;
  ativo: boolean;
  favorito: boolean;
  taxa_juros_min?: number;
  taxa_juros_max?: number;
  prazo_min_meses?: number;
  prazo_max_meses?: number;
  valor_min_financiamento?: number;
  valor_max_financiamento?: number;
  aceita_pessoa_fisica: boolean;
  aceita_pessoa_juridica: boolean;
  documentos_necessarios?: string[];
  tempo_aprovacao_dias?: number;
  created_at: string;
  updated_at: string;
  empresa_id: string;
}

interface FinancialInstitutionFormData {
  nome: string;
  tipo: 'banco' | 'financeira' | 'cooperativa' | 'fintech';
  cnpj: string;
  telefone: string;
  email: string;
  website: string;
  endereco: string;
  cidade: string;
  estado: string;
  cep: string;
  contato_principal: string;
  cargo_contato: string;
  telefone_contato: string;
  email_contato: string;
  observacoes: string;
  ativo: boolean;
  favorito: boolean;
  taxa_juros_min: string;
  taxa_juros_max: string;
  prazo_min_meses: string;
  prazo_max_meses: string;
  valor_min_financiamento: string;
  valor_max_financiamento: string;
  aceita_pessoa_fisica: boolean;
  aceita_pessoa_juridica: boolean;
  documentos_necessarios: string;
  tempo_aprovacao_dias: string;
}

interface FinancialInstitutionManagerProps {
  onInstitutionSelected?: (institution: FinancialInstitution) => void;
  selectionMode?: boolean;
}

const FinancialInstitutionManager: React.FC<FinancialInstitutionManagerProps> = ({
  onInstitutionSelected,
  selectionMode = false
}) => {
  const [institutions, setInstitutions] = useState<FinancialInstitution[]>([]);
  const [filteredInstitutions, setFilteredInstitutions] = useState<FinancialInstitution[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInstitution, setEditingInstitution] = useState<FinancialInstitution | null>(null);
  const [currentTab, setCurrentTab] = useState('list');

  const [formData, setFormData] = useState<FinancialInstitutionFormData>({
    nome: '',
    tipo: 'banco',
    cnpj: '',
    telefone: '',
    email: '',
    website: '',
    endereco: '',
    cidade: '',
    estado: '',
    cep: '',
    contato_principal: '',
    cargo_contato: '',
    telefone_contato: '',
    email_contato: '',
    observacoes: '',
    ativo: true,
    favorito: false,
    taxa_juros_min: '',
    taxa_juros_max: '',
    prazo_min_meses: '',
    prazo_max_meses: '',
    valor_min_financiamento: '',
    valor_max_financiamento: '',
    aceita_pessoa_fisica: true,
    aceita_pessoa_juridica: true,
    documentos_necessarios: '',
    tempo_aprovacao_dias: ''
  });

  const tiposInstituicao = [
    { value: 'banco', label: 'Banco' },
    { value: 'financeira', label: 'Financeira' },
    { value: 'cooperativa', label: 'Cooperativa de Crédito' },
    { value: 'fintech', label: 'Fintech' }
  ];

  const estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
    'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
    'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  useEffect(() => {
    loadInstitutions();
  }, []);

  const filterInstitutions = useCallback(() => {
    let filtered = [...institutions];

    // Filtro por termo de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(inst => 
        inst.nome.toLowerCase().includes(term) ||
        inst.cnpj?.toLowerCase().includes(term) ||
        inst.cidade?.toLowerCase().includes(term) ||
        inst.contato_principal?.toLowerCase().includes(term)
      );
    }

    // Filtro por tipo
    if (filterType !== 'all') {
      filtered = filtered.filter(inst => inst.tipo === filterType);
    }

    // Filtro por status
    if (filterStatus === 'ativo') {
      filtered = filtered.filter(inst => inst.ativo);
    } else if (filterStatus === 'inativo') {
      filtered = filtered.filter(inst => !inst.ativo);
    } else if (filterStatus === 'favorito') {
      filtered = filtered.filter(inst => inst.favorito);
    }

    setFilteredInstitutions(filtered);
  }, [institutions, searchTerm, filterType, filterStatus]);

  useEffect(() => {
    filterInstitutions();
  }, [filterInstitutions]);

  const loadInstitutions = async () => {
    try {
      console.log('[FinancialInstitutionManager] Carregando instituições financeiras');
      setIsLoading(true);

      // Obter usuário atual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      // Obter perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        throw new Error('Perfil do usuário não encontrado');
      }

      // Carregar instituições da empresa
      const { data, error } = await supabase
        .from('instituicoes_financeiras')
        .select('*')
        .eq('empresa_id', profile.empresa_id)
        .order('favorito', { ascending: false })
        .order('nome', { ascending: true });

      if (error) {
        throw new Error(`Erro ao carregar instituições: ${error.message}`);
      }

      console.log('[FinancialInstitutionManager] Instituições carregadas:', data);
      setInstitutions(data || []);

    } catch (error: unknown) {
      console.error('[FinancialInstitutionManager] Erro ao carregar instituições:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro ao Carregar",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      tipo: 'banco',
      cnpj: '',
      telefone: '',
      email: '',
      website: '',
      endereco: '',
      cidade: '',
      estado: '',
      cep: '',
      contato_principal: '',
      cargo_contato: '',
      telefone_contato: '',
      email_contato: '',
      observacoes: '',
      ativo: true,
      favorito: false,
      taxa_juros_min: '',
      taxa_juros_max: '',
      prazo_min_meses: '',
      prazo_max_meses: '',
      valor_min_financiamento: '',
      valor_max_financiamento: '',
      aceita_pessoa_fisica: true,
      aceita_pessoa_juridica: true,
      documentos_necessarios: '',
      tempo_aprovacao_dias: ''
    });
    setEditingInstitution(null);
  };

  const openCreateDialog = () => {
    resetForm();
    setIsDialogOpen(true);
  };

  const openEditDialog = (institution: FinancialInstitution) => {
    setFormData({
      nome: institution.nome,
      tipo: institution.tipo,
      cnpj: institution.cnpj || '',
      telefone: institution.telefone || '',
      email: institution.email || '',
      website: institution.website || '',
      endereco: institution.endereco || '',
      cidade: institution.cidade || '',
      estado: institution.estado || '',
      cep: institution.cep || '',
      contato_principal: institution.contato_principal || '',
      cargo_contato: institution.cargo_contato || '',
      telefone_contato: institution.telefone_contato || '',
      email_contato: institution.email_contato || '',
      observacoes: institution.observacoes || '',
      ativo: institution.ativo,
      favorito: institution.favorito,
      taxa_juros_min: institution.taxa_juros_min?.toString() || '',
      taxa_juros_max: institution.taxa_juros_max?.toString() || '',
      prazo_min_meses: institution.prazo_min_meses?.toString() || '',
      prazo_max_meses: institution.prazo_max_meses?.toString() || '',
      valor_min_financiamento: institution.valor_min_financiamento?.toString() || '',
      valor_max_financiamento: institution.valor_max_financiamento?.toString() || '',
      aceita_pessoa_fisica: institution.aceita_pessoa_fisica,
      aceita_pessoa_juridica: institution.aceita_pessoa_juridica,
      documentos_necessarios: institution.documentos_necessarios?.join(', ') || '',
      tempo_aprovacao_dias: institution.tempo_aprovacao_dias?.toString() || ''
    });
    setEditingInstitution(institution);
    setIsDialogOpen(true);
  };

  const saveInstitution = async () => {
    try {
      console.log('[FinancialInstitutionManager] Salvando instituição:', formData);

      // Validações básicas
      if (!formData.nome.trim()) {
        throw new Error('Nome é obrigatório');
      }

      // Obter usuário atual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      // Obter perfil do usuário
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        throw new Error('Perfil do usuário não encontrado');
      }

      // Preparar dados para salvamento
      const institutionData = {
        nome: formData.nome.trim(),
        tipo: formData.tipo,
        cnpj: formData.cnpj.trim() || null,
        telefone: formData.telefone.trim() || null,
        email: formData.email.trim() || null,
        website: formData.website.trim() || null,
        endereco: formData.endereco.trim() || null,
        cidade: formData.cidade.trim() || null,
        estado: formData.estado || null,
        cep: formData.cep.trim() || null,
        contato_principal: formData.contato_principal.trim() || null,
        cargo_contato: formData.cargo_contato.trim() || null,
        telefone_contato: formData.telefone_contato.trim() || null,
        email_contato: formData.email_contato.trim() || null,
        observacoes: formData.observacoes.trim() || null,
        ativo: formData.ativo,
        favorito: formData.favorito,
        taxa_juros_min: formData.taxa_juros_min ? parseFloat(formData.taxa_juros_min) : null,
        taxa_juros_max: formData.taxa_juros_max ? parseFloat(formData.taxa_juros_max) : null,
        prazo_min_meses: formData.prazo_min_meses ? parseInt(formData.prazo_min_meses) : null,
        prazo_max_meses: formData.prazo_max_meses ? parseInt(formData.prazo_max_meses) : null,
        valor_min_financiamento: formData.valor_min_financiamento ? parseFloat(formData.valor_min_financiamento) : null,
        valor_max_financiamento: formData.valor_max_financiamento ? parseFloat(formData.valor_max_financiamento) : null,
        aceita_pessoa_fisica: formData.aceita_pessoa_fisica,
        aceita_pessoa_juridica: formData.aceita_pessoa_juridica,
        documentos_necessarios: formData.documentos_necessarios 
          ? formData.documentos_necessarios.split(',').map(doc => doc.trim()).filter(doc => doc)
          : null,
        tempo_aprovacao_dias: formData.tempo_aprovacao_dias ? parseInt(formData.tempo_aprovacao_dias) : null,
        empresa_id: profile.empresa_id
      };

      let result;
      if (editingInstitution) {
        // Atualizar instituição existente
        result = await supabase
          .from('instituicoes_financeiras')
          .update(institutionData)
          .eq('id', editingInstitution.id)
          .select()
          .single();
      } else {
        // Criar nova instituição
        result = await supabase
          .from('instituicoes_financeiras')
          .insert(institutionData)
          .select()
          .single();
      }

      if (result.error) {
        throw new Error(`Erro ao salvar: ${result.error.message}`);
      }

      console.log('[FinancialInstitutionManager] Instituição salva:', result.data);

      toast({
        title: editingInstitution ? "Instituição Atualizada" : "Instituição Criada",
        description: `${formData.nome} foi ${editingInstitution ? 'atualizada' : 'criada'} com sucesso.`
      });

      setIsDialogOpen(false);
      resetForm();
      await loadInstitutions();

    } catch (error: unknown) {
      console.error('[FinancialInstitutionManager] Erro ao salvar:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro ao Salvar",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const deleteInstitution = async (institution: FinancialInstitution) => {
    if (!confirm(`Tem certeza que deseja excluir "${institution.nome}"?`)) {
      return;
    }

    try {
      console.log('[FinancialInstitutionManager] Excluindo instituição:', institution.id);

      const { error } = await supabase
        .from('instituicoes_financeiras')
        .delete()
        .eq('id', institution.id);

      if (error) {
        throw new Error(`Erro ao excluir: ${error.message}`);
      }

      toast({
        title: "Instituição Excluída",
        description: `${institution.nome} foi excluída com sucesso.`
      });

      await loadInstitutions();

    } catch (error: unknown) {
      console.error('[FinancialInstitutionManager] Erro ao excluir:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro ao Excluir",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const toggleFavorite = async (institution: FinancialInstitution) => {
    try {
      const { error } = await supabase
        .from('instituicoes_financeiras')
        .update({ favorito: !institution.favorito })
        .eq('id', institution.id);

      if (error) {
        throw new Error(`Erro ao atualizar favorito: ${error.message}`);
      }

      await loadInstitutions();

    } catch (error: unknown) {
      console.error('[FinancialInstitutionManager] Erro ao atualizar favorito:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const toggleStatus = async (institution: FinancialInstitution) => {
    try {
      const { error } = await supabase
        .from('instituicoes_financeiras')
        .update({ ativo: !institution.ativo })
        .eq('id', institution.id);

      if (error) {
        throw new Error(`Erro ao atualizar status: ${error.message}`);
      }

      await loadInstitutions();

    } catch (error: unknown) {
      console.error('[FinancialInstitutionManager] Erro ao atualizar status:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro",
        description: errorMessage,
        variant: "destructive"
      });
    }
  };

  const exportInstitutions = () => {
    const dataStr = JSON.stringify(filteredInstitutions, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `instituicoes_financeiras_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    toast({
      title: "Exportação Concluída",
      description: "Instituições exportadas como JSON."
    });
  };

  const getTipoLabel = (tipo: string) => {
    const tipoObj = tiposInstituicao.find(t => t.value === tipo);
    return tipoObj ? tipoObj.label : tipo;
  };

  const getTipoBadgeVariant = (tipo: string) => {
    switch (tipo) {
      case 'banco': return 'default';
      case 'financeira': return 'secondary';
      case 'cooperativa': return 'outline';
      case 'fintech': return 'destructive';
      default: return 'outline';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando instituições financeiras...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Gerenciamento de Instituições Financeiras
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              Gerencie bancos, financeiras e outras instituições para financiamento de projetos
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="outline">
                {filteredInstitutions.length} de {institutions.length}
              </Badge>
              <Button onClick={exportInstitutions} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
              {!selectionMode && (
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Instituição
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-4 gap-4">
            <div>
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Nome, CNPJ, cidade..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="filterType">Tipo</Label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os tipos</SelectItem>
                  {tiposInstituicao.map(tipo => (
                    <SelectItem key={tipo.value} value={tipo.value}>
                      {tipo.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="filterStatus">Status</Label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="ativo">Ativo</SelectItem>
                  <SelectItem value="inativo">Inativo</SelectItem>
                  <SelectItem value="favorito">Favoritos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button 
                variant="outline" 
                onClick={() => {
                  setSearchTerm('');
                  setFilterType('all');
                  setFilterStatus('all');
                }}
                className="w-full"
              >
                <Filter className="h-4 w-4 mr-2" />
                Limpar Filtros
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Instituições */}
      <div className="grid gap-4">
        {filteredInstitutions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Building2 className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-gray-600 mb-4">
                {institutions.length === 0 
                  ? 'Nenhuma instituição financeira cadastrada'
                  : 'Nenhuma instituição encontrada com os filtros aplicados'
                }
              </p>
              {institutions.length === 0 && !selectionMode && (
                <Button onClick={openCreateDialog}>
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Primeira Instituição
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredInstitutions.map((institution) => (
            <Card key={institution.id} className={`${!institution.ativo ? 'opacity-60' : ''}`}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{institution.nome}</h3>
                      <Badge variant={getTipoBadgeVariant(institution.tipo)}>
                        {getTipoLabel(institution.tipo)}
                      </Badge>
                      {institution.favorito && (
                        <Badge variant="outline" className="text-yellow-600">
                          <Star className="h-3 w-3 mr-1 fill-current" />
                          Favorito
                        </Badge>
                      )}
                      <Badge variant={institution.ativo ? 'default' : 'secondary'}>
                        {institution.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                      <div>
                        {institution.cnpj && (
                          <p><strong>CNPJ:</strong> {institution.cnpj}</p>
                        )}
                        {institution.telefone && (
                          <p><strong>Telefone:</strong> {institution.telefone}</p>
                        )}
                        {institution.email && (
                          <p><strong>Email:</strong> {institution.email}</p>
                        )}
                        {institution.cidade && institution.estado && (
                          <p><strong>Localização:</strong> {institution.cidade}/{institution.estado}</p>
                        )}
                      </div>
                      <div>
                        {institution.contato_principal && (
                          <p><strong>Contato:</strong> {institution.contato_principal}</p>
                        )}
                        {institution.cargo_contato && (
                          <p><strong>Cargo:</strong> {institution.cargo_contato}</p>
                        )}
                        {institution.telefone_contato && (
                          <p><strong>Tel. Contato:</strong> {institution.telefone_contato}</p>
                        )}
                        {institution.tempo_aprovacao_dias && (
                          <p><strong>Tempo Aprovação:</strong> {institution.tempo_aprovacao_dias} dias</p>
                        )}
                      </div>
                    </div>

                    {/* Informações Financeiras */}
                    {(institution.taxa_juros_min || institution.taxa_juros_max || 
                      institution.valor_min_financiamento || institution.valor_max_financiamento) && (
                      <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-950 rounded border">
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                          Condições Financeiras
                        </p>
                        <div className="grid grid-cols-2 gap-2 text-xs text-blue-700 dark:text-blue-300">
                          {(institution.taxa_juros_min || institution.taxa_juros_max) && (
                            <div>
                              <strong>Taxa de Juros:</strong> 
                              {institution.taxa_juros_min && institution.taxa_juros_max
                                ? ` ${institution.taxa_juros_min}% - ${institution.taxa_juros_max}%`
                                : institution.taxa_juros_min
                                ? ` A partir de ${institution.taxa_juros_min}%`
                                : ` Até ${institution.taxa_juros_max}%`
                              }
                            </div>
                          )}
                          {(institution.valor_min_financiamento || institution.valor_max_financiamento) && (
                            <div>
                              <strong>Valor:</strong>
                              {institution.valor_min_financiamento && institution.valor_max_financiamento
                                ? ` R$ ${institution.valor_min_financiamento.toLocaleString()} - R$ ${institution.valor_max_financiamento.toLocaleString()}`
                                : institution.valor_min_financiamento
                                ? ` A partir de R$ ${institution.valor_min_financiamento.toLocaleString()}`
                                : ` Até R$ ${institution.valor_max_financiamento?.toLocaleString()}`
                              }
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-2 ml-4">
                    {selectionMode ? (
                      <Button
                        onClick={() => onInstitutionSelected?.(institution)}
                        size="sm"
                      >
                        Selecionar
                      </Button>
                    ) : (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavorite(institution)}
                        >
                          {institution.favorito ? (
                            <Star className="h-4 w-4 fill-current text-yellow-500" />
                          ) : (
                            <StarOff className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleStatus(institution)}
                        >
                          {institution.ativo ? (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(institution)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteInstitution(institution)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Dialog de Criação/Edição */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingInstitution ? 'Editar Instituição' : 'Nova Instituição Financeira'}
            </DialogTitle>
          </DialogHeader>
          
          <Tabs defaultValue="basico" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="basico">Dados Básicos</TabsTrigger>
              <TabsTrigger value="contato">Contato</TabsTrigger>
              <TabsTrigger value="financeiro">Condições Financeiras</TabsTrigger>
            </TabsList>
            
            <TabsContent value="basico" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="nome">Nome da Instituição *</Label>
                  <Input
                    id="nome"
                    value={formData.nome}
                    onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                    placeholder="Ex: Banco do Brasil"
                  />
                </div>
                <div>
                  <Label htmlFor="tipo">Tipo *</Label>
                  <Select
                    value={formData.tipo}
                    onValueChange={(value: string) => setFormData(prev => ({ ...prev, tipo: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposInstituicao.map(tipo => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="cnpj">CNPJ</Label>
                  <Input
                    id="cnpj"
                    value={formData.cnpj}
                    onChange={(e) => setFormData(prev => ({ ...prev, cnpj: e.target.value }))}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div>
                  <Label htmlFor="website">Website</Label>
                  <Input
                    id="website"
                    value={formData.website}
                    onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                    placeholder="https://www.exemplo.com.br"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input
                    id="cidade"
                    value={formData.cidade}
                    onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="estado">Estado</Label>
                  <Select
                    value={formData.estado}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, estado: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar" />
                    </SelectTrigger>
                    <SelectContent>
                      {estados.map(estado => (
                        <SelectItem key={estado} value={estado}>{estado}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    value={formData.cep}
                    onChange={(e) => setFormData(prev => ({ ...prev, cep: e.target.value }))}
                    placeholder="00000-000"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="endereco">Endereço</Label>
                <Input
                  id="endereco"
                  value={formData.endereco}
                  onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                  placeholder="Rua, número, bairro"
                />
              </div>
              
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="ativo"
                    checked={formData.ativo}
                    onChange={(e) => setFormData(prev => ({ ...prev, ativo: e.target.checked }))}
                  />
                  <Label htmlFor="ativo">Instituição Ativa</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="favorito"
                    checked={formData.favorito}
                    onChange={(e) => setFormData(prev => ({ ...prev, favorito: e.target.checked }))}
                  />
                  <Label htmlFor="favorito">Marcar como Favorito</Label>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="contato" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="telefone">Telefone Principal</Label>
                  <Input
                    id="telefone"
                    value={formData.telefone}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                    placeholder="(11) 1234-5678"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email Principal</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    placeholder="contato@instituicao.com.br"
                  />
                </div>
                <div>
                  <Label htmlFor="contato_principal">Nome do Contato</Label>
                  <Input
                    id="contato_principal"
                    value={formData.contato_principal}
                    onChange={(e) => setFormData(prev => ({ ...prev, contato_principal: e.target.value }))}
                    placeholder="João Silva"
                  />
                </div>
                <div>
                  <Label htmlFor="cargo_contato">Cargo do Contato</Label>
                  <Input
                    id="cargo_contato"
                    value={formData.cargo_contato}
                    onChange={(e) => setFormData(prev => ({ ...prev, cargo_contato: e.target.value }))}
                    placeholder="Gerente Comercial"
                  />
                </div>
                <div>
                  <Label htmlFor="telefone_contato">Telefone do Contato</Label>
                  <Input
                    id="telefone_contato"
                    value={formData.telefone_contato}
                    onChange={(e) => setFormData(prev => ({ ...prev, telefone_contato: e.target.value }))}
                    placeholder="(11) 9999-8888"
                  />
                </div>
                <div>
                  <Label htmlFor="email_contato">Email do Contato</Label>
                  <Input
                    id="email_contato"
                    type="email"
                    value={formData.email_contato}
                    onChange={(e) => setFormData(prev => ({ ...prev, email_contato: e.target.value }))}
                    placeholder="joao.silva@instituicao.com.br"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="observacoes">Observações</Label>
                <Textarea
                  id="observacoes"
                  value={formData.observacoes}
                  onChange={(e) => setFormData(prev => ({ ...prev, observacoes: e.target.value }))}
                  placeholder="Informações adicionais sobre a instituição..."
                  rows={4}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="financeiro" className="space-y-4 mt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="taxa_juros_min">Taxa de Juros Mínima (%)</Label>
                  <Input
                    id="taxa_juros_min"
                    type="number"
                    step="0.01"
                    value={formData.taxa_juros_min}
                    onChange={(e) => setFormData(prev => ({ ...prev, taxa_juros_min: e.target.value }))}
                    placeholder="1.5"
                  />
                </div>
                <div>
                  <Label htmlFor="taxa_juros_max">Taxa de Juros Máxima (%)</Label>
                  <Input
                    id="taxa_juros_max"
                    type="number"
                    step="0.01"
                    value={formData.taxa_juros_max}
                    onChange={(e) => setFormData(prev => ({ ...prev, taxa_juros_max: e.target.value }))}
                    placeholder="3.5"
                  />
                </div>
                <div>
                  <Label htmlFor="prazo_min_meses">Prazo Mínimo (meses)</Label>
                  <Input
                    id="prazo_min_meses"
                    type="number"
                    value={formData.prazo_min_meses}
                    onChange={(e) => setFormData(prev => ({ ...prev, prazo_min_meses: e.target.value }))}
                    placeholder="12"
                  />
                </div>
                <div>
                  <Label htmlFor="prazo_max_meses">Prazo Máximo (meses)</Label>
                  <Input
                    id="prazo_max_meses"
                    type="number"
                    value={formData.prazo_max_meses}
                    onChange={(e) => setFormData(prev => ({ ...prev, prazo_max_meses: e.target.value }))}
                    placeholder="120"
                  />
                </div>
                <div>
                  <Label htmlFor="valor_min_financiamento">Valor Mínimo (R$)</Label>
                  <Input
                    id="valor_min_financiamento"
                    type="number"
                    step="0.01"
                    value={formData.valor_min_financiamento}
                    onChange={(e) => setFormData(prev => ({ ...prev, valor_min_financiamento: e.target.value }))}
                    placeholder="10000"
                  />
                </div>
                <div>
                  <Label htmlFor="valor_max_financiamento">Valor Máximo (R$)</Label>
                  <Input
                    id="valor_max_financiamento"
                    type="number"
                    step="0.01"
                    value={formData.valor_max_financiamento}
                    onChange={(e) => setFormData(prev => ({ ...prev, valor_max_financiamento: e.target.value }))}
                    placeholder="1000000"
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="tempo_aprovacao_dias">Tempo de Aprovação (dias)</Label>
                <Input
                  id="tempo_aprovacao_dias"
                  type="number"
                  value={formData.tempo_aprovacao_dias}
                  onChange={(e) => setFormData(prev => ({ ...prev, tempo_aprovacao_dias: e.target.value }))}
                  placeholder="15"
                />
              </div>
              
              <div className="flex items-center space-x-6">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="aceita_pessoa_fisica"
                    checked={formData.aceita_pessoa_fisica}
                    onChange={(e) => setFormData(prev => ({ ...prev, aceita_pessoa_fisica: e.target.checked }))}
                  />
                  <Label htmlFor="aceita_pessoa_fisica">Aceita Pessoa Física</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="aceita_pessoa_juridica"
                    checked={formData.aceita_pessoa_juridica}
                    onChange={(e) => setFormData(prev => ({ ...prev, aceita_pessoa_juridica: e.target.checked }))}
                  />
                  <Label htmlFor="aceita_pessoa_juridica">Aceita Pessoa Jurídica</Label>
                </div>
              </div>
              
              <div>
                <Label htmlFor="documentos_necessarios">Documentos Necessários</Label>
                <Textarea
                  id="documentos_necessarios"
                  value={formData.documentos_necessarios}
                  onChange={(e) => setFormData(prev => ({ ...prev, documentos_necessarios: e.target.value }))}
                  placeholder="CPF, RG, Comprovante de renda, Comprovante de residência (separar por vírgula)"
                  rows={3}
                />
              </div>
            </TabsContent>
          </Tabs>
          
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={saveInstitution}>
              {editingInstitution ? 'Atualizar' : 'Criar'} Instituição
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FinancialInstitutionManager;