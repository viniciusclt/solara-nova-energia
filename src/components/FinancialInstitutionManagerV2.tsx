import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/utils/supabase/client';
import {
  Building2,
  Plus,
  Search,
  Filter,
  Star,
  StarOff,
  Edit,
  Trash2,
  Phone,
  Mail,
  Globe,
  MapPin,
  Calculator,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  DollarSign,
  Calendar,
  CheckCircle2,
  AlertCircle,
  Info,
  Download,
  Upload,
  RefreshCw,
  Eye,
  Compare
} from 'lucide-react';

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
  documentos_necessarios?: string;
  tempo_aprovacao_dias?: number;
  empresa_id: string;
  created_at: string;
  updated_at: string;
}

interface SimulationParams {
  valorFinanciamento: number;
  prazoMeses: number;
  tipoCliente: 'pf' | 'pj';
  valorEntrada?: number;
  rendaMensal?: number;
}

interface SimulationResult {
  institutionId: string;
  institutionName: string;
  taxaJuros: number;
  valorParcela: number;
  valorTotal: number;
  valorJuros: number;
  aprovado: boolean;
  observacoes: string[];
  score: number;
}

interface ComparisonMetrics {
  melhorTaxa: FinancialInstitution;
  menorParcela: FinancialInstitution;
  maiorPrazo: FinancialInstitution;
  menorTempo: FinancialInstitution;
  mediaGeral: {
    taxa: number;
    prazo: number;
    tempo: number;
  };
}

interface FinancialInstitutionManagerV2Props {
  onInstitutionSelected?: (institution: FinancialInstitution) => void;
  selectionMode?: boolean;
}

const FinancialInstitutionManagerV2: React.FC<FinancialInstitutionManagerV2Props> = ({
  onInstitutionSelected,
  selectionMode = false
}) => {
  const { toast } = useToast();
  const supabase = createClient();
  
  // Estados principais
  const [institutions, setInstitutions] = useState<FinancialInstitution[]>([]);
  const [filteredInstitutions, setFilteredInstitutions] = useState<FinancialInstitution[]>([]);
  const [selectedInstitutions, setSelectedInstitutions] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState('list');
  
  // Estados de filtro e busca
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('nome');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Estados de simulação
  const [simulationParams, setSimulationParams] = useState<SimulationParams>({
    valorFinanciamento: 50000,
    prazoMeses: 60,
    tipoCliente: 'pf',
    valorEntrada: 0,
    rendaMensal: 5000
  });
  const [simulationResults, setSimulationResults] = useState<SimulationResult[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  
  // Estados de comparação
  const [comparisonMetrics, setComparisonMetrics] = useState<ComparisonMetrics | null>(null);
  
  // Tipos de instituição
  const tiposInstituicao = [
    { value: 'banco', label: 'Banco', icon: Building2 },
    { value: 'financeira', label: 'Financeira', icon: DollarSign },
    { value: 'cooperativa', label: 'Cooperativa', icon: PieChart },
    { value: 'fintech', label: 'Fintech', icon: TrendingUp }
  ];
  
  // Carregar instituições
  useEffect(() => {
    loadInstitutions();
  }, []);
  
  // Filtrar instituições
  useEffect(() => {
    filterAndSortInstitutions();
  }, [institutions, searchTerm, filterType, filterStatus, sortBy, sortOrder]);
  
  // Calcular métricas de comparação
  useEffect(() => {
    if (filteredInstitutions.length > 0) {
      calculateComparisonMetrics();
    }
  }, [filteredInstitutions]);
  
  const loadInstitutions = async () => {
    try {
      setIsLoading(true);
      
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }
      
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', user.id)
        .single();
      
      if (profileError || !profile) {
        throw new Error('Perfil do usuário não encontrado');
      }
      
      const { data, error } = await supabase
        .from('instituicoes_financeiras')
        .select('*')
        .eq('empresa_id', profile.empresa_id)
        .order('favorito', { ascending: false })
        .order('nome', { ascending: true });
      
      if (error) {
        throw new Error(`Erro ao carregar instituições: ${error.message}`);
      }
      
      setInstitutions(data || []);
      
    } catch (error: any) {
      console.error('Erro ao carregar instituições:', error);
      toast({
        title: 'Erro ao Carregar',
        description: error.message || 'Erro desconhecido',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const filterAndSortInstitutions = useCallback(() => {
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
    
    // Ordenação
    filtered.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'nome':
          aValue = a.nome;
          bValue = b.nome;
          break;
        case 'taxa':
          aValue = a.taxa_juros_min || 999;
          bValue = b.taxa_juros_min || 999;
          break;
        case 'prazo':
          aValue = a.prazo_max_meses || 0;
          bValue = b.prazo_max_meses || 0;
          break;
        case 'tempo':
          aValue = a.tempo_aprovacao_dias || 999;
          bValue = b.tempo_aprovacao_dias || 999;
          break;
        default:
          aValue = a.nome;
          bValue = b.nome;
      }
      
      if (typeof aValue === 'string') {
        return sortOrder === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      } else {
        return sortOrder === 'asc' 
          ? aValue - bValue
          : bValue - aValue;
      }
    });
    
    setFilteredInstitutions(filtered);
  }, [institutions, searchTerm, filterType, filterStatus, sortBy, sortOrder]);
  
  const calculateComparisonMetrics = useCallback(() => {
    const activeInstitutions = filteredInstitutions.filter(inst => inst.ativo);
    
    if (activeInstitutions.length === 0) {
      setComparisonMetrics(null);
      return;
    }
    
    const melhorTaxa = activeInstitutions.reduce((prev, current) => 
      (current.taxa_juros_min || 999) < (prev.taxa_juros_min || 999) ? current : prev
    );
    
    const menorParcela = activeInstitutions.reduce((prev, current) => {
      const prevParcela = calcularParcela(simulationParams.valorFinanciamento, prev.taxa_juros_min || 0, simulationParams.prazoMeses);
      const currentParcela = calcularParcela(simulationParams.valorFinanciamento, current.taxa_juros_min || 0, simulationParams.prazoMeses);
      return currentParcela < prevParcela ? current : prev;
    });
    
    const maiorPrazo = activeInstitutions.reduce((prev, current) => 
      (current.prazo_max_meses || 0) > (prev.prazo_max_meses || 0) ? current : prev
    );
    
    const menorTempo = activeInstitutions.reduce((prev, current) => 
      (current.tempo_aprovacao_dias || 999) < (prev.tempo_aprovacao_dias || 999) ? current : prev
    );
    
    const mediaGeral = {
      taxa: activeInstitutions.reduce((sum, inst) => sum + (inst.taxa_juros_min || 0), 0) / activeInstitutions.length,
      prazo: activeInstitutions.reduce((sum, inst) => sum + (inst.prazo_max_meses || 0), 0) / activeInstitutions.length,
      tempo: activeInstitutions.reduce((sum, inst) => sum + (inst.tempo_aprovacao_dias || 0), 0) / activeInstitutions.length
    };
    
    setComparisonMetrics({
      melhorTaxa,
      menorParcela,
      maiorPrazo,
      menorTempo,
      mediaGeral
    });
  }, [filteredInstitutions, simulationParams]);
  
  const calcularParcela = (valor: number, taxa: number, prazo: number): number => {
    if (taxa === 0) return valor / prazo;
    const taxaMensal = taxa / 100 / 12;
    return valor * (taxaMensal * Math.pow(1 + taxaMensal, prazo)) / (Math.pow(1 + taxaMensal, prazo) - 1);
  };
  
  const runSimulation = async () => {
    setIsSimulating(true);
    
    try {
      const results: SimulationResult[] = [];
      
      for (const institution of filteredInstitutions.filter(inst => inst.ativo)) {
        const observacoes: string[] = [];
        let aprovado = true;
        let score = 100;
        
        // Verificar se aceita o tipo de cliente
        if (simulationParams.tipoCliente === 'pf' && !institution.aceita_pessoa_fisica) {
          aprovado = false;
          observacoes.push('Não aceita pessoa física');
          score -= 50;
        }
        
        if (simulationParams.tipoCliente === 'pj' && !institution.aceita_pessoa_juridica) {
          aprovado = false;
          observacoes.push('Não aceita pessoa jurídica');
          score -= 50;
        }
        
        // Verificar limites de valor
        if (institution.valor_min_financiamento && simulationParams.valorFinanciamento < institution.valor_min_financiamento) {
          aprovado = false;
          observacoes.push(`Valor mínimo: R$ ${institution.valor_min_financiamento.toLocaleString()}`);
          score -= 30;
        }
        
        if (institution.valor_max_financiamento && simulationParams.valorFinanciamento > institution.valor_max_financiamento) {
          aprovado = false;
          observacoes.push(`Valor máximo: R$ ${institution.valor_max_financiamento.toLocaleString()}`);
          score -= 30;
        }
        
        // Verificar limites de prazo
        if (institution.prazo_min_meses && simulationParams.prazoMeses < institution.prazo_min_meses) {
          aprovado = false;
          observacoes.push(`Prazo mínimo: ${institution.prazo_min_meses} meses`);
          score -= 20;
        }
        
        if (institution.prazo_max_meses && simulationParams.prazoMeses > institution.prazo_max_meses) {
          aprovado = false;
          observacoes.push(`Prazo máximo: ${institution.prazo_max_meses} meses`);
          score -= 20;
        }
        
        // Calcular taxa de juros (usar média entre min e max)
        const taxaJuros = institution.taxa_juros_min && institution.taxa_juros_max 
          ? (institution.taxa_juros_min + institution.taxa_juros_max) / 2
          : institution.taxa_juros_min || institution.taxa_juros_max || 2.5;
        
        const valorParcela = calcularParcela(simulationParams.valorFinanciamento, taxaJuros, simulationParams.prazoMeses);
        const valorTotal = valorParcela * simulationParams.prazoMeses;
        const valorJuros = valorTotal - simulationParams.valorFinanciamento;
        
        // Verificar capacidade de pagamento
        if (simulationParams.rendaMensal && valorParcela > simulationParams.rendaMensal * 0.3) {
          observacoes.push('Parcela excede 30% da renda');
          score -= 15;
        }
        
        // Bonificações
        if (institution.favorito) score += 10;
        if (institution.tempo_aprovacao_dias && institution.tempo_aprovacao_dias <= 7) score += 5;
        
        results.push({
          institutionId: institution.id,
          institutionName: institution.nome,
          taxaJuros,
          valorParcela,
          valorTotal,
          valorJuros,
          aprovado,
          observacoes,
          score: Math.max(0, Math.min(100, score))
        });
      }
      
      // Ordenar por score
      results.sort((a, b) => b.score - a.score);
      setSimulationResults(results);
      setCurrentTab('simulation');
      
    } catch (error) {
      console.error('Erro na simulação:', error);
      toast({
        title: 'Erro na Simulação',
        description: 'Erro ao executar simulação de financiamento',
        variant: 'destructive'
      });
    } finally {
      setIsSimulating(false);
    }
  };
  
  const toggleFavorite = async (institutionId: string) => {
    try {
      const institution = institutions.find(inst => inst.id === institutionId);
      if (!institution) return;
      
      const { error } = await supabase
        .from('instituicoes_financeiras')
        .update({ favorito: !institution.favorito })
        .eq('id', institutionId);
      
      if (error) throw error;
      
      setInstitutions(prev => prev.map(inst => 
        inst.id === institutionId 
          ? { ...inst, favorito: !inst.favorito }
          : inst
      ));
      
      toast({
        title: institution.favorito ? 'Removido dos favoritos' : 'Adicionado aos favoritos',
        description: institution.nome
      });
      
    } catch (error: any) {
      toast({
        title: 'Erro',
        description: error.message,
        variant: 'destructive'
      });
    }
  };
  
  const exportComparison = () => {
    const data = filteredInstitutions.map(inst => ({
      Nome: inst.nome,
      Tipo: inst.tipo,
      'Taxa Mín (%)': inst.taxa_juros_min,
      'Taxa Máx (%)': inst.taxa_juros_max,
      'Prazo Mín (meses)': inst.prazo_min_meses,
      'Prazo Máx (meses)': inst.prazo_max_meses,
      'Valor Mín': inst.valor_min_financiamento,
      'Valor Máx': inst.valor_max_financiamento,
      'Tempo Aprovação (dias)': inst.tempo_aprovacao_dias,
      'Pessoa Física': inst.aceita_pessoa_fisica ? 'Sim' : 'Não',
      'Pessoa Jurídica': inst.aceita_pessoa_juridica ? 'Sim' : 'Não',
      Ativo: inst.ativo ? 'Sim' : 'Não',
      Favorito: inst.favorito ? 'Sim' : 'Não'
    }));
    
    const csv = [
      Object.keys(data[0]).join(','),
      ...data.map(row => Object.values(row).join(','))
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `comparacao-instituicoes-${Date.now()}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };
  
  if (isLoading) {
    return (
      <Card className="w-full max-w-6xl mx-auto">
        <CardContent className="p-8">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            <span>Carregando instituições financeiras...</span>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full max-w-6xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Gerenciador de Instituições Financeiras V2
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportComparison}>
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
            <Button variant="outline" size="sm" onClick={loadInstitutions}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Atualizar
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={currentTab} onValueChange={setCurrentTab}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="list">Lista</TabsTrigger>
            <TabsTrigger value="comparison">Comparação</TabsTrigger>
            <TabsTrigger value="simulation">Simulação</TabsTrigger>
            <TabsTrigger value="analytics">Análise</TabsTrigger>
          </TabsList>
          
          {/* Tab Lista */}
          <TabsContent value="list" className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar instituições..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8 w-64"
                  />
                </div>
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-40">
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
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="ativo">Ativos</SelectItem>
                    <SelectItem value="inativo">Inativos</SelectItem>
                    <SelectItem value="favorito">Favoritos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex items-center gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nome">Nome</SelectItem>
                    <SelectItem value="taxa">Taxa</SelectItem>
                    <SelectItem value="prazo">Prazo</SelectItem>
                    <SelectItem value="tempo">Tempo</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                >
                  {sortOrder === 'asc' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredInstitutions.map(institution => {
                const TipoIcon = tiposInstituicao.find(t => t.value === institution.tipo)?.icon || Building2;
                
                return (
                  <Card key={institution.id} className={`relative ${!institution.ativo ? 'opacity-60' : ''}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <TipoIcon className="h-5 w-5" />
                          <div>
                            <h3 className="font-semibold text-sm">{institution.nome}</h3>
                            <Badge variant="secondary" className="text-xs">
                              {tiposInstituicao.find(t => t.value === institution.tipo)?.label}
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleFavorite(institution.id)}
                        >
                          {institution.favorito ? (
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          ) : (
                            <StarOff className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="pt-0 space-y-2">
                      {institution.taxa_juros_min && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Taxa:</span>
                          <span className="font-medium">
                            {institution.taxa_juros_min}%
                            {institution.taxa_juros_max && institution.taxa_juros_max !== institution.taxa_juros_min 
                              ? ` - ${institution.taxa_juros_max}%` 
                              : ''}
                          </span>
                        </div>
                      )}
                      
                      {institution.prazo_max_meses && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Prazo:</span>
                          <span className="font-medium">
                            {institution.prazo_min_meses && institution.prazo_min_meses !== institution.prazo_max_meses
                              ? `${institution.prazo_min_meses} - `
                              : ''}
                            {institution.prazo_max_meses} meses
                          </span>
                        </div>
                      )}
                      
                      {institution.tempo_aprovacao_dias && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Aprovação:</span>
                          <span className="font-medium">{institution.tempo_aprovacao_dias} dias</span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-1 text-xs">
                        {institution.aceita_pessoa_fisica && (
                          <Badge variant="outline">PF</Badge>
                        )}
                        {institution.aceita_pessoa_juridica && (
                          <Badge variant="outline">PJ</Badge>
                        )}
                        {!institution.ativo && (
                          <Badge variant="destructive">Inativo</Badge>
                        )}
                      </div>
                      
                      {institution.contato_principal && (
                        <div className="text-xs text-muted-foreground">
                          Contato: {institution.contato_principal}
                        </div>
                      )}
                      
                      {selectionMode && (
                        <div className="pt-2">
                          <Checkbox
                            checked={selectedInstitutions.has(institution.id)}
                            onCheckedChange={(checked) => {
                              const newSelected = new Set(selectedInstitutions);
                              if (checked) {
                                newSelected.add(institution.id);
                              } else {
                                newSelected.delete(institution.id);
                              }
                              setSelectedInstitutions(newSelected);
                            }}
                          />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            {filteredInstitutions.length === 0 && (
              <div className="text-center py-8">
                <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">Nenhuma instituição encontrada</p>
              </div>
            )}
          </TabsContent>
          
          {/* Tab Comparação */}
          <TabsContent value="comparison" className="space-y-4">
            {comparisonMetrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium">Melhor Taxa</span>
                    </div>
                    <div className="text-lg font-bold">{comparisonMetrics.melhorTaxa.nome}</div>
                    <div className="text-sm text-muted-foreground">
                      {comparisonMetrics.melhorTaxa.taxa_juros_min}% a.m.
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium">Menor Parcela</span>
                    </div>
                    <div className="text-lg font-bold">{comparisonMetrics.menorParcela.nome}</div>
                    <div className="text-sm text-muted-foreground">
                      R$ {calcularParcela(
                        simulationParams.valorFinanciamento,
                        comparisonMetrics.menorParcela.taxa_juros_min || 0,
                        simulationParams.prazoMeses
                      ).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium">Maior Prazo</span>
                    </div>
                    <div className="text-lg font-bold">{comparisonMetrics.maiorPrazo.nome}</div>
                    <div className="text-sm text-muted-foreground">
                      {comparisonMetrics.maiorPrazo.prazo_max_meses} meses
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <CheckCircle2 className="h-4 w-4 text-orange-600" />
                      <span className="text-sm font-medium">Mais Rápido</span>
                    </div>
                    <div className="text-lg font-bold">{comparisonMetrics.menorTempo.nome}</div>
                    <div className="text-sm text-muted-foreground">
                      {comparisonMetrics.menorTempo.tempo_aprovacao_dias} dias
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Comparação Detalhada</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-2">Instituição</th>
                        <th className="text-left p-2">Tipo</th>
                        <th className="text-left p-2">Taxa (%)</th>
                        <th className="text-left p-2">Prazo (meses)</th>
                        <th className="text-left p-2">Valor Mín</th>
                        <th className="text-left p-2">Valor Máx</th>
                        <th className="text-left p-2">Aprovação</th>
                        <th className="text-left p-2">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredInstitutions.map(institution => (
                        <tr key={institution.id} className="border-b hover:bg-muted/50">
                          <td className="p-2">
                            <div className="flex items-center gap-2">
                              {institution.favorito && <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />}
                              {institution.nome}
                            </div>
                          </td>
                          <td className="p-2">
                            <Badge variant="secondary">
                              {tiposInstituicao.find(t => t.value === institution.tipo)?.label}
                            </Badge>
                          </td>
                          <td className="p-2">
                            {institution.taxa_juros_min}
                            {institution.taxa_juros_max && institution.taxa_juros_max !== institution.taxa_juros_min 
                              ? ` - ${institution.taxa_juros_max}` 
                              : ''}
                          </td>
                          <td className="p-2">
                            {institution.prazo_min_meses && institution.prazo_min_meses !== institution.prazo_max_meses
                              ? `${institution.prazo_min_meses} - `
                              : ''}
                            {institution.prazo_max_meses}
                          </td>
                          <td className="p-2">
                            {institution.valor_min_financiamento
                              ? `R$ ${institution.valor_min_financiamento.toLocaleString()}`
                              : '-'}
                          </td>
                          <td className="p-2">
                            {institution.valor_max_financiamento
                              ? `R$ ${institution.valor_max_financiamento.toLocaleString()}`
                              : '-'}
                          </td>
                          <td className="p-2">
                            {institution.tempo_aprovacao_dias ? `${institution.tempo_aprovacao_dias} dias` : '-'}
                          </td>
                          <td className="p-2">
                            <div className="flex items-center gap-1">
                              {institution.aceita_pessoa_fisica && <Badge variant="outline" className="text-xs">PF</Badge>}
                              {institution.aceita_pessoa_juridica && <Badge variant="outline" className="text-xs">PJ</Badge>}
                              {!institution.ativo && <Badge variant="destructive" className="text-xs">Inativo</Badge>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Tab Simulação */}
          <TabsContent value="simulation" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5" />
                  Simulação de Financiamento
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Valor do Financiamento</Label>
                    <Input
                      type="number"
                      value={simulationParams.valorFinanciamento}
                      onChange={(e) => setSimulationParams(prev => ({
                        ...prev,
                        valorFinanciamento: Number(e.target.value)
                      }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Prazo (meses)</Label>
                    <Input
                      type="number"
                      value={simulationParams.prazoMeses}
                      onChange={(e) => setSimulationParams(prev => ({
                        ...prev,
                        prazoMeses: Number(e.target.value)
                      }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Tipo de Cliente</Label>
                    <Select 
                      value={simulationParams.tipoCliente} 
                      onValueChange={(value: 'pf' | 'pj') => setSimulationParams(prev => ({
                        ...prev,
                        tipoCliente: value
                      }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pf">Pessoa Física</SelectItem>
                        <SelectItem value="pj">Pessoa Jurídica</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Valor de Entrada (opcional)</Label>
                    <Input
                      type="number"
                      value={simulationParams.valorEntrada || ''}
                      onChange={(e) => setSimulationParams(prev => ({
                        ...prev,
                        valorEntrada: Number(e.target.value) || 0
                      }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Renda Mensal (opcional)</Label>
                    <Input
                      type="number"
                      value={simulationParams.rendaMensal || ''}
                      onChange={(e) => setSimulationParams(prev => ({
                        ...prev,
                        rendaMensal: Number(e.target.value) || 0
                      }))}
                    />
                  </div>
                  
                  <div className="flex items-end">
                    <Button 
                      onClick={runSimulation} 
                      disabled={isSimulating}
                      className="w-full"
                    >
                      {isSimulating ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Simulando...
                        </>
                      ) : (
                        <>
                          <Calculator className="h-4 w-4 mr-2" />
                          Simular
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            {simulationResults.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Resultados da Simulação</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {simulationResults.map(result => (
                      <Card key={result.institutionId} className={`${!result.aprovado ? 'opacity-60' : ''}`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-3">
                            <div>
                              <h3 className="font-semibold">{result.institutionName}</h3>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge variant={result.aprovado ? 'default' : 'destructive'}>
                                  {result.aprovado ? 'Aprovado' : 'Reprovado'}
                                </Badge>
                                <div className="flex items-center gap-1">
                                  <span className="text-sm text-muted-foreground">Score:</span>
                                  <Progress value={result.score} className="w-16 h-2" />
                                  <span className="text-sm font-medium">{result.score}%</span>
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="text-lg font-bold">
                                R$ {result.valorParcela.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </div>
                              <div className="text-sm text-muted-foreground">por mês</div>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <span className="text-muted-foreground">Taxa:</span>
                              <div className="font-medium">{result.taxaJuros.toFixed(2)}% a.m.</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Total:</span>
                              <div className="font-medium">
                                R$ {result.valorTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Juros:</span>
                              <div className="font-medium">
                                R$ {result.valorJuros.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">% da Renda:</span>
                              <div className="font-medium">
                                {simulationParams.rendaMensal 
                                  ? `${((result.valorParcela / simulationParams.rendaMensal) * 100).toFixed(1)}%`
                                  : '-'}
                              </div>
                            </div>
                          </div>
                          
                          {result.observacoes.length > 0 && (
                            <div className="mt-3 pt-3 border-t">
                              <div className="text-sm text-muted-foreground mb-1">Observações:</div>
                              <div className="flex flex-wrap gap-1">
                                {result.observacoes.map((obs, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {obs}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          {/* Tab Análise */}
          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{institutions.length}</div>
                  <div className="text-sm text-muted-foreground">Total de Instituições</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-green-600">
                    {institutions.filter(inst => inst.ativo).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Instituições Ativas</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold text-yellow-600">
                    {institutions.filter(inst => inst.favorito).length}
                  </div>
                  <div className="text-sm text-muted-foreground">Favoritas</div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">
                    {comparisonMetrics ? comparisonMetrics.mediaGeral.taxa.toFixed(2) : '0'}%
                  </div>
                  <div className="text-sm text-muted-foreground">Taxa Média</div>
                </CardContent>
              </Card>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Distribuição por Tipo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {tiposInstituicao.map(tipo => {
                      const count = institutions.filter(inst => inst.tipo === tipo.value).length;
                      const percentage = institutions.length > 0 ? (count / institutions.length) * 100 : 0;
                      
                      return (
                        <div key={tipo.value} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <tipo.icon className="h-4 w-4" />
                            <span className="text-sm">{tipo.label}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Progress value={percentage} className="w-20 h-2" />
                            <span className="text-sm font-medium w-8">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Faixas de Taxa de Juros</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {[
                      { label: '0% - 1%', min: 0, max: 1 },
                      { label: '1% - 2%', min: 1, max: 2 },
                      { label: '2% - 3%', min: 2, max: 3 },
                      { label: '3% - 4%', min: 3, max: 4 },
                      { label: '4%+', min: 4, max: 999 }
                    ].map(faixa => {
                      const count = institutions.filter(inst => 
                        inst.taxa_juros_min && 
                        inst.taxa_juros_min >= faixa.min && 
                        inst.taxa_juros_min < faixa.max
                      ).length;
                      const percentage = institutions.length > 0 ? (count / institutions.length) * 100 : 0;
                      
                      return (
                        <div key={faixa.label} className="flex items-center justify-between">
                          <span className="text-sm">{faixa.label}</span>
                          <div className="flex items-center gap-2">
                            <Progress value={percentage} className="w-20 h-2" />
                            <span className="text-sm font-medium w-8">{count}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default FinancialInstitutionManagerV2;