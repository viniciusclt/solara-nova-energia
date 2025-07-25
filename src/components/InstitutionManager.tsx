import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Building2, Plus, Edit, Trash2, Star, StarOff, Phone, Mail, Globe, MapPin, User, Briefcase, Calendar, DollarSign, FileText, Filter, Search, Download, Upload } from 'lucide-react';

export interface FinancialInstitution {
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
  empresa_id: string;
  created_at: string;
  updated_at: string;
}

const InstitutionManager: React.FC = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [institutions, setInstitutions] = useState<FinancialInstitution[]>([]);
  const [filteredInstitutions, setFilteredInstitutions] = useState<FinancialInstitution[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingInstitution, setEditingInstitution] = useState<FinancialInstitution | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [favoriteFilter, setFavoriteFilter] = useState<string>('all');

  // Form state
  const [formData, setFormData] = useState<Partial<FinancialInstitution>>({
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
    taxa_juros_min: 0,
    taxa_juros_max: 0,
    prazo_min_meses: 12,
    prazo_max_meses: 120,
    valor_min_financiamento: 0,
    valor_max_financiamento: 0,
    aceita_pessoa_fisica: true,
    aceita_pessoa_juridica: true,
    documentos_necessarios: [],
    tempo_aprovacao_dias: 30
  });

  const [documentInput, setDocumentInput] = useState('');

  // Load institutions
  const loadInstitutions = async () => {
    if (!user || !profile?.empresa_id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('instituicoes_financeiras')
        .select('*')
        .eq('empresa_id', profile.empresa_id)
        .order('nome');

      if (error) throw error;

      setInstitutions(data || []);
      setFilteredInstitutions(data || []);
    } catch (error: any) {
      toast({
        title: 'Erro ao carregar instituições',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Filter institutions
  useEffect(() => {
    let filtered = institutions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(inst => 
        inst.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inst.cnpj?.includes(searchTerm) ||
        inst.contato_principal?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(inst => inst.tipo === typeFilter);
    }

    // Active filter
    if (activeFilter !== 'all') {
      filtered = filtered.filter(inst => 
        activeFilter === 'active' ? inst.ativo : !inst.ativo
      );
    }

    // Favorite filter
    if (favoriteFilter !== 'all') {
      filtered = filtered.filter(inst => 
        favoriteFilter === 'favorite' ? inst.favorito : !inst.favorito
      );
    }

    setFilteredInstitutions(filtered);
  }, [institutions, searchTerm, typeFilter, activeFilter, favoriteFilter]);

  useEffect(() => {
    loadInstitutions();
  }, [user, profile]);

  // Save institution
  const saveInstitution = async () => {
    if (!user || !profile?.empresa_id) return;

    if (!formData.nome?.trim()) {
      toast({
        title: 'Nome obrigatório',
        description: 'O nome da instituição é obrigatório.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    try {
      const institutionData = {
        ...formData,
        empresa_id: profile.empresa_id,
        documentos_necessarios: formData.documentos_necessarios || []
      };

      if (editingInstitution) {
        const { error } = await supabase
          .from('instituicoes_financeiras')
          .update(institutionData)
          .eq('id', editingInstitution.id);

        if (error) throw error;

        toast({
          title: 'Instituição atualizada',
          description: 'A instituição foi atualizada com sucesso.'
        });
      } else {
        const { error } = await supabase
          .from('instituicoes_financeiras')
          .insert([institutionData]);

        if (error) throw error;

        toast({
          title: 'Instituição criada',
          description: 'A instituição foi criada com sucesso.'
        });
      }

      resetForm();
      setIsDialogOpen(false);
      loadInstitutions();
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar instituição',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Delete institution
  const deleteInstitution = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta instituição?')) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('instituicoes_financeiras')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Instituição excluída',
        description: 'A instituição foi excluída com sucesso.'
      });

      loadInstitutions();
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir instituição',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle favorite
  const toggleFavorite = async (institution: FinancialInstitution) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('instituicoes_financeiras')
        .update({ favorito: !institution.favorito })
        .eq('id', institution.id);

      if (error) throw error;

      loadInstitutions();
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar favorito',
        description: error.message,
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Reset form
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
      taxa_juros_min: 0,
      taxa_juros_max: 0,
      prazo_min_meses: 12,
      prazo_max_meses: 120,
      valor_min_financiamento: 0,
      valor_max_financiamento: 0,
      aceita_pessoa_fisica: true,
      aceita_pessoa_juridica: true,
      documentos_necessarios: [],
      tempo_aprovacao_dias: 30
    });
    setEditingInstitution(null);
    setDocumentInput('');
  };

  // Edit institution
  const editInstitution = (institution: FinancialInstitution) => {
    setFormData(institution);
    setEditingInstitution(institution);
    setIsDialogOpen(true);
  };

  // Add document
  const addDocument = () => {
    if (documentInput.trim()) {
      setFormData(prev => ({
        ...prev,
        documentos_necessarios: [...(prev.documentos_necessarios || []), documentInput.trim()]
      }));
      setDocumentInput('');
    }
  };

  // Remove document
  const removeDocument = (index: number) => {
    setFormData(prev => ({
      ...prev,
      documentos_necessarios: prev.documentos_necessarios?.filter((_, i) => i !== index) || []
    }));
  };

  const getTypeLabel = (type: string) => {
    const types = {
      banco: 'Banco',
      financeira: 'Financeira',
      cooperativa: 'Cooperativa',
      fintech: 'Fintech'
    };
    return types[type as keyof typeof types] || type;
  };

  const getTypeBadgeColor = (type: string) => {
    const colors = {
      banco: 'bg-blue-100 text-blue-800',
      financeira: 'bg-green-100 text-green-800',
      cooperativa: 'bg-purple-100 text-purple-800',
      fintech: 'bg-orange-100 text-orange-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Instituições Financeiras
          </h2>
          <p className="text-muted-foreground">
            Gerencie as instituições financeiras para financiamento de projetos
          </p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Instituição
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingInstitution ? 'Editar Instituição' : 'Nova Instituição'}
              </DialogTitle>
              <DialogDescription>
                {editingInstitution 
                  ? 'Atualize as informações da instituição financeira'
                  : 'Cadastre uma nova instituição financeira'
                }
              </DialogDescription>
            </DialogHeader>

            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="basic">Básico</TabsTrigger>
                <TabsTrigger value="contact">Contato</TabsTrigger>
                <TabsTrigger value="financial">Financeiro</TabsTrigger>
                <TabsTrigger value="documents">Documentos</TabsTrigger>
              </TabsList>

              <TabsContent value="basic" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nome">Nome da Instituição *</Label>
                    <Input
                      id="nome"
                      value={formData.nome}
                      onChange={(e) => setFormData(prev => ({ ...prev, nome: e.target.value }))}
                      placeholder="Ex: Banco do Brasil"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tipo">Tipo</Label>
                    <Select
                      value={formData.tipo}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, tipo: value as any }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="banco">Banco</SelectItem>
                        <SelectItem value="financeira">Financeira</SelectItem>
                        <SelectItem value="cooperativa">Cooperativa</SelectItem>
                        <SelectItem value="fintech">Fintech</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ</Label>
                    <Input
                      id="cnpj"
                      value={formData.cnpj}
                      onChange={(e) => setFormData(prev => ({ ...prev, cnpj: e.target.value }))}
                      placeholder="00.000.000/0001-00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="website">Website</Label>
                    <Input
                      id="website"
                      value={formData.website}
                      onChange={(e) => setFormData(prev => ({ ...prev, website: e.target.value }))}
                      placeholder="https://www.exemplo.com.br"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço</Label>
                  <Input
                    id="endereco"
                    value={formData.endereco}
                    onChange={(e) => setFormData(prev => ({ ...prev, endereco: e.target.value }))}
                    placeholder="Rua, número, bairro"
                  />
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="cidade">Cidade</Label>
                    <Input
                      id="cidade"
                      value={formData.cidade}
                      onChange={(e) => setFormData(prev => ({ ...prev, cidade: e.target.value }))}
                      placeholder="São Paulo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="estado">Estado</Label>
                    <Input
                      id="estado"
                      value={formData.estado}
                      onChange={(e) => setFormData(prev => ({ ...prev, estado: e.target.value }))}
                      placeholder="SP"
                      maxLength={2}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cep">CEP</Label>
                    <Input
                      id="cep"
                      value={formData.cep}
                      onChange={(e) => setFormData(prev => ({ ...prev, cep: e.target.value }))}
                      placeholder="00000-000"
                    />
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="ativo"
                      checked={formData.ativo}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, ativo: checked }))}
                    />
                    <Label htmlFor="ativo">Ativo</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="favorito"
                      checked={formData.favorito}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, favorito: checked }))}
                    />
                    <Label htmlFor="favorito">Favorito</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="contact" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefone">Telefone Geral</Label>
                    <Input
                      id="telefone"
                      value={formData.telefone}
                      onChange={(e) => setFormData(prev => ({ ...prev, telefone: e.target.value }))}
                      placeholder="(11) 1234-5678"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Geral</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="contato@instituicao.com.br"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contato_principal">Contato Principal</Label>
                    <Input
                      id="contato_principal"
                      value={formData.contato_principal}
                      onChange={(e) => setFormData(prev => ({ ...prev, contato_principal: e.target.value }))}
                      placeholder="Nome do responsável"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cargo_contato">Cargo</Label>
                    <Input
                      id="cargo_contato"
                      value={formData.cargo_contato}
                      onChange={(e) => setFormData(prev => ({ ...prev, cargo_contato: e.target.value }))}
                      placeholder="Gerente de Energia Renovável"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="telefone_contato">Telefone do Contato</Label>
                    <Input
                      id="telefone_contato"
                      value={formData.telefone_contato}
                      onChange={(e) => setFormData(prev => ({ ...prev, telefone_contato: e.target.value }))}
                      placeholder="(11) 9999-8888"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email_contato">Email do Contato</Label>
                    <Input
                      id="email_contato"
                      type="email"
                      value={formData.email_contato}
                      onChange={(e) => setFormData(prev => ({ ...prev, email_contato: e.target.value }))}
                      placeholder="responsavel@instituicao.com.br"
                    />
                  </div>
                </div>

                <div className="space-y-2">
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

              <TabsContent value="financial" className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="taxa_juros_min">Taxa de Juros Mínima (%)</Label>
                    <Input
                      id="taxa_juros_min"
                      type="number"
                      step="0.01"
                      value={formData.taxa_juros_min}
                      onChange={(e) => setFormData(prev => ({ ...prev, taxa_juros_min: parseFloat(e.target.value) || 0 }))}
                      placeholder="1.5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="taxa_juros_max">Taxa de Juros Máxima (%)</Label>
                    <Input
                      id="taxa_juros_max"
                      type="number"
                      step="0.01"
                      value={formData.taxa_juros_max}
                      onChange={(e) => setFormData(prev => ({ ...prev, taxa_juros_max: parseFloat(e.target.value) || 0 }))}
                      placeholder="3.5"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="prazo_min_meses">Prazo Mínimo (meses)</Label>
                    <Input
                      id="prazo_min_meses"
                      type="number"
                      value={formData.prazo_min_meses}
                      onChange={(e) => setFormData(prev => ({ ...prev, prazo_min_meses: parseInt(e.target.value) || 0 }))}
                      placeholder="12"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="prazo_max_meses">Prazo Máximo (meses)</Label>
                    <Input
                      id="prazo_max_meses"
                      type="number"
                      value={formData.prazo_max_meses}
                      onChange={(e) => setFormData(prev => ({ ...prev, prazo_max_meses: parseInt(e.target.value) || 0 }))}
                      placeholder="120"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="valor_min_financiamento">Valor Mínimo (R$)</Label>
                    <Input
                      id="valor_min_financiamento"
                      type="number"
                      step="0.01"
                      value={formData.valor_min_financiamento}
                      onChange={(e) => setFormData(prev => ({ ...prev, valor_min_financiamento: parseFloat(e.target.value) || 0 }))}
                      placeholder="50000.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="valor_max_financiamento">Valor Máximo (R$)</Label>
                    <Input
                      id="valor_max_financiamento"
                      type="number"
                      step="0.01"
                      value={formData.valor_max_financiamento}
                      onChange={(e) => setFormData(prev => ({ ...prev, valor_max_financiamento: parseFloat(e.target.value) || 0 }))}
                      placeholder="2000000.00"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tempo_aprovacao_dias">Tempo de Aprovação (dias)</Label>
                  <Input
                    id="tempo_aprovacao_dias"
                    type="number"
                    value={formData.tempo_aprovacao_dias}
                    onChange={(e) => setFormData(prev => ({ ...prev, tempo_aprovacao_dias: parseInt(e.target.value) || 0 }))}
                    placeholder="30"
                  />
                </div>

                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="aceita_pessoa_fisica"
                      checked={formData.aceita_pessoa_fisica}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, aceita_pessoa_fisica: checked }))}
                    />
                    <Label htmlFor="aceita_pessoa_fisica">Aceita Pessoa Física</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Switch
                      id="aceita_pessoa_juridica"
                      checked={formData.aceita_pessoa_juridica}
                      onCheckedChange={(checked) => setFormData(prev => ({ ...prev, aceita_pessoa_juridica: checked }))}
                    />
                    <Label htmlFor="aceita_pessoa_juridica">Aceita Pessoa Jurídica</Label>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="documents" className="space-y-4">
                <div className="space-y-2">
                  <Label>Documentos Necessários</Label>
                  <div className="flex gap-2">
                    <Input
                      value={documentInput}
                      onChange={(e) => setDocumentInput(e.target.value)}
                      placeholder="Ex: CPF/CNPJ"
                      onKeyPress={(e) => e.key === 'Enter' && addDocument()}
                    />
                    <Button type="button" onClick={addDocument}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  {formData.documentos_necessarios?.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span>{doc}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeDocument(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-2 pt-4">
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={saveInstitution} disabled={isLoading}>
                {isLoading ? 'Salvando...' : editingInstitution ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtros
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Nome, CNPJ ou contato..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="banco">Banco</SelectItem>
                  <SelectItem value="financeira">Financeira</SelectItem>
                  <SelectItem value="cooperativa">Cooperativa</SelectItem>
                  <SelectItem value="fintech">Fintech</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={activeFilter} onValueChange={setActiveFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="active">Ativos</SelectItem>
                  <SelectItem value="inactive">Inativos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Favoritos</Label>
              <Select value={favoriteFilter} onValueChange={setFavoriteFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="favorite">Favoritos</SelectItem>
                  <SelectItem value="not-favorite">Não Favoritos</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ações</Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm">
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Institutions Table */}
      <Card>
        <CardHeader>
          <CardTitle>Instituições Cadastradas ({filteredInstitutions.length})</CardTitle>
          <CardDescription>
            Lista de todas as instituições financeiras cadastradas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Contato</TableHead>
                  <TableHead>Taxa (%)</TableHead>
                  <TableHead>Prazo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredInstitutions.map((institution) => (
                  <TableRow key={institution.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div>
                          <div className="font-medium">{institution.nome}</div>
                          {institution.cnpj && (
                            <div className="text-sm text-muted-foreground">{institution.cnpj}</div>
                          )}
                        </div>
                        {institution.favorito && (
                          <Star className="h-4 w-4 text-yellow-500 fill-current" />
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getTypeBadgeColor(institution.tipo)}>
                        {getTypeLabel(institution.tipo)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        {institution.contato_principal && (
                          <div className="flex items-center gap-1 text-sm">
                            <User className="h-3 w-3" />
                            {institution.contato_principal}
                          </div>
                        )}
                        {institution.telefone_contato && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Phone className="h-3 w-3" />
                            {institution.telefone_contato}
                          </div>
                        )}
                        {institution.email_contato && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Mail className="h-3 w-3" />
                            {institution.email_contato}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {institution.taxa_juros_min && institution.taxa_juros_max ? (
                        <div className="text-sm">
                          {institution.taxa_juros_min}% - {institution.taxa_juros_max}%
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {institution.prazo_min_meses && institution.prazo_max_meses ? (
                        <div className="text-sm">
                          {institution.prazo_min_meses} - {institution.prazo_max_meses} meses
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {institution.valor_min_financiamento && institution.valor_max_financiamento ? (
                        <div className="text-sm">
                          R$ {institution.valor_min_financiamento.toLocaleString()} - 
                          R$ {institution.valor_max_financiamento.toLocaleString()}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Badge variant={institution.ativo ? 'default' : 'secondary'}>
                          {institution.ativo ? 'Ativo' : 'Inativo'}
                        </Badge>
                        {institution.tempo_aprovacao_dias && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {institution.tempo_aprovacao_dias}d
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavorite(institution)}
                        >
                          {institution.favorito ? (
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          ) : (
                            <StarOff className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => editInstitution(institution)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteInstitution(institution.id)}
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

          {filteredInstitutions.length === 0 && (
            <div className="text-center py-8">
              <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma instituição encontrada</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm || typeFilter !== 'all' || activeFilter !== 'all' || favoriteFilter !== 'all'
                  ? 'Tente ajustar os filtros para encontrar instituições.'
                  : 'Comece cadastrando sua primeira instituição financeira.'
                }
              </p>
              {!searchTerm && typeFilter === 'all' && activeFilter === 'all' && favoriteFilter === 'all' && (
                <Button onClick={() => setIsDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Cadastrar Primeira Instituição
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InstitutionManager;