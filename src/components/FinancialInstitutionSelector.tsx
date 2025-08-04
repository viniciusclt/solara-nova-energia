import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { toast } from './ui/use-toast';
import { Plus, Building2, Percent, Calendar, AlertCircle } from 'lucide-react';
import { logError } from '../utils/secureLogger';

interface FinancialInstitution {
  id: string;
  name: string;
  type: 'bank' | 'fintech' | 'cooperative';
  interest_rate: number;
  max_financing_percentage: number;
  min_amount: number;
  max_amount: number;
  max_term_months: number;
  requirements: string[];
  documentation: string[];
  processing_time_days: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface FinancialInstitutionSelectorProps {
  selectedInstitutionId?: string;
  onInstitutionSelect: (institution: FinancialInstitution | null) => void;
  projectValue?: number;
  className?: string;
}

export function FinancialInstitutionSelector({
  selectedInstitutionId,
  onInstitutionSelect,
  projectValue = 0,
  className
}: FinancialInstitutionSelectorProps) {
  const [institutions, setInstitutions] = useState<FinancialInstitution[]>([]);
  const [selectedInstitution, setSelectedInstitution] = useState<FinancialInstitution | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [newInstitution, setNewInstitution] = useState<Partial<FinancialInstitution>>({
    name: '',
    type: 'bank',
    interest_rate: 0,
    max_financing_percentage: 80,
    min_amount: 10000,
    max_amount: 1000000,
    max_term_months: 120,
    requirements: [],
    documentation: [],
    processing_time_days: 30,
    is_active: true
  });

  useEffect(() => {
    loadInstitutions();
  }, []);

  useEffect(() => {
    if (selectedInstitutionId && institutions.length > 0) {
      const institution = institutions.find(inst => inst.id === selectedInstitutionId);
      if (institution) {
        setSelectedInstitution(institution);
        onInstitutionSelect(institution);
      }
    }
  }, [selectedInstitutionId, institutions, onInstitutionSelect]);

  const loadInstitutions = async () => {
    try {
      setIsLoading(true);
      
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', userData.user?.id)
        .single();

      if (profileError) throw profileError;

      const { data, error } = await supabase
        .from('financial_institutions')
        .select('*')
        .eq('company_id', profile.company_id)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      setInstitutions(data || []);
    } catch (error) {
      logError({
        service: 'FinancialInstitutionSelector',
        action: 'loadInstitutions',
        error: error instanceof Error ? error.message : 'Erro desconhecido'
      });
      toast({
        title: "Erro",
        description: "Erro ao carregar instituições financeiras.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInstitutionSelect = (institutionId: string) => {
    if (institutionId === 'none') {
      setSelectedInstitution(null);
      onInstitutionSelect(null);
      return;
    }

    const institution = institutions.find(inst => inst.id === institutionId);
    if (institution) {
      setSelectedInstitution(institution);
      onInstitutionSelect(institution);
    }
  };

  const addInstitution = async () => {
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('company_id')
        .eq('id', userData.user?.id)
        .single();

      if (profileError) throw profileError;

      const { data, error } = await supabase
        .from('financial_institutions')
        .insert({
          ...newInstitution,
          company_id: profile.company_id
        })
        .select()
        .single();

      if (error) throw error;

      setInstitutions(prev => [...prev, data]);
      setShowAddDialog(false);
      setNewInstitution({
        name: '',
        type: 'bank',
        interest_rate: 0,
        max_financing_percentage: 80,
        min_amount: 10000,
        max_amount: 1000000,
        max_term_months: 120,
        requirements: [],
        documentation: [],
        processing_time_days: 30,
        is_active: true
      });

      toast({
        title: "Sucesso",
        description: "Instituição financeira adicionada com sucesso."
      });
    } catch (error) {
      logError({
        service: 'FinancialInstitutionSelector',
        action: 'addInstitution',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        details: {
          institutionName: newInstitution.name,
          institutionType: newInstitution.type
        }
      });
      toast({
        title: "Erro",
        description: "Erro ao adicionar instituição financeira.",
        variant: "destructive"
      });
    }
  };

  const getFinancingDetails = (institution: FinancialInstitution) => {
    if (!projectValue || projectValue <= 0) return null;

    const maxFinancing = (projectValue * institution.max_financing_percentage) / 100;
    const monthlyRate = institution.interest_rate / 100 / 12;
    const maxTermMonths = institution.max_term_months;
    
    // Cálculo da parcela usando fórmula de financiamento
    const monthlyPayment = maxFinancing * (monthlyRate * Math.pow(1 + monthlyRate, maxTermMonths)) / 
                          (Math.pow(1 + monthlyRate, maxTermMonths) - 1);

    return {
      maxFinancing,
      monthlyPayment,
      totalAmount: monthlyPayment * maxTermMonths,
      totalInterest: (monthlyPayment * maxTermMonths) - maxFinancing
    };
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getTypeLabel = (type: string) => {
    const types = {
      bank: 'Banco',
      fintech: 'Fintech',
      cooperative: 'Cooperativa'
    };
    return types[type as keyof typeof types] || type;
  };

  const getTypeColor = (type: string) => {
    const colors = {
      bank: 'bg-blue-100 text-blue-800',
      fintech: 'bg-green-100 text-green-800',
      cooperative: 'bg-purple-100 text-purple-800'
    };
    return colors[type as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className={className}>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Instituição Financeira</Label>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Adicionar Instituição Financeira</DialogTitle>
                <DialogDescription>
                  Cadastre uma nova instituição financeira para oferecer aos seus clientes.
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome da Instituição</Label>
                  <Input
                    id="name"
                    value={newInstitution.name}
                    onChange={(e) => setNewInstitution(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Ex: Banco do Brasil"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="type">Tipo</Label>
                  <Select
                    value={newInstitution.type}
                    onValueChange={(value: string) => setNewInstitution(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bank">Banco</SelectItem>
                      <SelectItem value="fintech">Fintech</SelectItem>
                      <SelectItem value="cooperative">Cooperativa</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="interest_rate">Taxa de Juros (% a.a.)</Label>
                  <Input
                    id="interest_rate"
                    type="number"
                    step="0.01"
                    value={newInstitution.interest_rate}
                    onChange={(e) => setNewInstitution(prev => ({ ...prev, interest_rate: parseFloat(e.target.value) || 0 }))}
                    placeholder="12.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_financing_percentage">% Máximo de Financiamento</Label>
                  <Input
                    id="max_financing_percentage"
                    type="number"
                    value={newInstitution.max_financing_percentage}
                    onChange={(e) => setNewInstitution(prev => ({ ...prev, max_financing_percentage: parseInt(e.target.value) || 0 }))}
                    placeholder="80"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="min_amount">Valor Mínimo</Label>
                  <Input
                    id="min_amount"
                    type="number"
                    value={newInstitution.min_amount}
                    onChange={(e) => setNewInstitution(prev => ({ ...prev, min_amount: parseFloat(e.target.value) || 0 }))}
                    placeholder="10000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_amount">Valor Máximo</Label>
                  <Input
                    id="max_amount"
                    type="number"
                    value={newInstitution.max_amount}
                    onChange={(e) => setNewInstitution(prev => ({ ...prev, max_amount: parseFloat(e.target.value) || 0 }))}
                    placeholder="1000000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="max_term_months">Prazo Máximo (meses)</Label>
                  <Input
                    id="max_term_months"
                    type="number"
                    value={newInstitution.max_term_months}
                    onChange={(e) => setNewInstitution(prev => ({ ...prev, max_term_months: parseInt(e.target.value) || 0 }))}
                    placeholder="120"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="processing_time_days">Tempo de Processamento (dias)</Label>
                  <Input
                    id="processing_time_days"
                    type="number"
                    value={newInstitution.processing_time_days}
                    onChange={(e) => setNewInstitution(prev => ({ ...prev, processing_time_days: parseInt(e.target.value) || 0 }))}
                    placeholder="30"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={addInstitution} disabled={!newInstitution.name}>
                  Adicionar Instituição
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <Select
          value={selectedInstitution?.id || 'none'}
          onValueChange={handleInstitutionSelect}
          disabled={isLoading}
        >
          <SelectTrigger>
            <SelectValue placeholder={isLoading ? "Carregando..." : "Selecione uma instituição"} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Nenhuma instituição</SelectItem>
            {institutions.map((institution) => (
              <SelectItem key={institution.id} value={institution.id}>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  <span>{institution.name}</span>
                  <Badge className={getTypeColor(institution.type)} variant="secondary">
                    {getTypeLabel(institution.type)}
                  </Badge>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {selectedInstitution && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {selectedInstitution.name}
                <Badge className={getTypeColor(selectedInstitution.type)}>
                  {getTypeLabel(selectedInstitution.type)}
                </Badge>
              </CardTitle>
              <CardDescription>
                Condições de financiamento disponíveis
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
                    <Percent className="h-4 w-4" />
                    Taxa de Juros
                  </div>
                  <div className="text-lg font-semibold">
                    {selectedInstitution.interest_rate}% a.a.
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
                    <Percent className="h-4 w-4" />
                    Financiamento
                  </div>
                  <div className="text-lg font-semibold">
                    {selectedInstitution.max_financing_percentage}%
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
                    <Calendar className="h-4 w-4" />
                    Prazo Máximo
                  </div>
                  <div className="text-lg font-semibold">
                    {selectedInstitution.max_term_months} meses
                  </div>
                </div>
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground mb-1">
                    <AlertCircle className="h-4 w-4" />
                    Processamento
                  </div>
                  <div className="text-lg font-semibold">
                    {selectedInstitution.processing_time_days} dias
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <div className="text-sm font-medium">Limites de Financiamento:</div>
                <div className="text-sm text-muted-foreground">
                  Mínimo: {formatCurrency(selectedInstitution.min_amount)} • 
                  Máximo: {formatCurrency(selectedInstitution.max_amount)}
                </div>
              </div>

              {projectValue > 0 && (() => {
                const details = getFinancingDetails(selectedInstitution);
                if (!details) return null;

                return (
                  <>
                    <Separator />
                    <div className="space-y-3">
                      <div className="text-sm font-medium">Simulação para este projeto:</div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Valor do projeto:</span>
                          <div className="font-medium">{formatCurrency(projectValue)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Valor financiado:</span>
                          <div className="font-medium">{formatCurrency(details.maxFinancing)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Parcela mensal:</span>
                          <div className="font-medium">{formatCurrency(details.monthlyPayment)}</div>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total a pagar:</span>
                          <div className="font-medium">{formatCurrency(details.totalAmount)}</div>
                        </div>
                      </div>
                    </div>
                  </>
                );
              })()}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}