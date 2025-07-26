import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Calculator, DollarSign, TrendingUp, Calendar, Building2, Star, Info, Download, FileText } from 'lucide-react';
import { FinancialInstitution } from './InstitutionManager';

interface FinancingCalculation {
  institution: FinancialInstitution;
  principal: number;
  interestRate: number;
  termMonths: number;
  monthlyPayment: number;
  totalPayment: number;
  totalInterest: number;
  paymentSchedule: PaymentScheduleItem[];
}

interface PaymentScheduleItem {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

interface CalculatorInputs {
  projectValue: number;
  downPayment: number;
  termMonths: number;
  selectedInstitutions: string[];
}

const FinancialCalculator: React.FC = () => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [institutions, setInstitutions] = useState<FinancialInstitution[]>([]);
  const [calculations, setCalculations] = useState<FinancingCalculation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [inputs, setInputs] = useState<CalculatorInputs>({
    projectValue: 0,
    downPayment: 0,
    termMonths: 120,
    selectedInstitutions: []
  });

  // Load institutions
  const loadInstitutions = async () => {
    if (!user || !profile?.empresa_id) return;

    try {
      const { data, error } = await supabase
        .from('instituicoes_financeiras')
        .select('*')
        .eq('empresa_id', profile.empresa_id)
        .eq('ativo', true)
        .order('favorito', { ascending: false })
        .order('nome');

      if (error) throw error;

      setInstitutions(data || []);
    } catch (error: unknown) {
      toast({
        title: 'Erro ao carregar instituições',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });
    }
  };

  useEffect(() => {
    loadInstitutions();
  }, [user, profile]);

  // Calculate PMT (monthly payment)
  const calculatePMT = (principal: number, rate: number, nper: number): number => {
    if (rate === 0) return principal / nper;
    const monthlyRate = rate / 100 / 12;
    return principal * (monthlyRate * Math.pow(1 + monthlyRate, nper)) / (Math.pow(1 + monthlyRate, nper) - 1);
  };

  // Generate payment schedule
  const generatePaymentSchedule = (principal: number, rate: number, nper: number): PaymentScheduleItem[] => {
    const monthlyRate = rate / 100 / 12;
    const monthlyPayment = calculatePMT(principal, rate, nper);
    const schedule: PaymentScheduleItem[] = [];
    let balance = principal;

    for (let month = 1; month <= nper; month++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = monthlyPayment - interestPayment;
      balance -= principalPayment;

      schedule.push({
        month,
        payment: monthlyPayment,
        principal: principalPayment,
        interest: interestPayment,
        balance: Math.max(0, balance)
      });
    }

    return schedule;
  };

  // Calculate financing options
  const calculateFinancing = () => {
    if (!inputs.projectValue || inputs.projectValue <= 0) {
      toast({
        title: 'Valor do projeto obrigatório',
        description: 'Informe o valor total do projeto.',
        variant: 'destructive'
      });
      return;
    }

    if (inputs.selectedInstitutions.length === 0) {
      toast({
        title: 'Selecione instituições',
        description: 'Selecione pelo menos uma instituição para calcular.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);

    try {
      const financingAmount = inputs.projectValue - inputs.downPayment;
      const newCalculations: FinancingCalculation[] = [];

      inputs.selectedInstitutions.forEach(institutionId => {
        const institution = institutions.find(inst => inst.id === institutionId);
        if (!institution) return;

        // Check if financing amount is within institution limits
        if (institution.valor_min_financiamento && financingAmount < institution.valor_min_financiamento) {
          return;
        }
        if (institution.valor_max_financiamento && financingAmount > institution.valor_max_financiamento) {
          return;
        }

        // Check if term is within institution limits
        if (institution.prazo_min_meses && inputs.termMonths < institution.prazo_min_meses) {
          return;
        }
        if (institution.prazo_max_meses && inputs.termMonths > institution.prazo_max_meses) {
          return;
        }

        // Calculate with minimum and maximum rates
        const rates = [];
        if (institution.taxa_juros_min) rates.push(institution.taxa_juros_min);
        if (institution.taxa_juros_max && institution.taxa_juros_max !== institution.taxa_juros_min) {
          rates.push(institution.taxa_juros_max);
        }
        if (rates.length === 0) rates.push(2.5); // Default rate

        rates.forEach(rate => {
          const monthlyPayment = calculatePMT(financingAmount, rate, inputs.termMonths);
          const totalPayment = monthlyPayment * inputs.termMonths;
          const totalInterest = totalPayment - financingAmount;
          const paymentSchedule = generatePaymentSchedule(financingAmount, rate, inputs.termMonths);

          newCalculations.push({
            institution,
            principal: financingAmount,
            interestRate: rate,
            termMonths: inputs.termMonths,
            monthlyPayment,
            totalPayment,
            totalInterest,
            paymentSchedule
          });
        });
      });

      // Sort by monthly payment
      newCalculations.sort((a, b) => a.monthlyPayment - b.monthlyPayment);
      setCalculations(newCalculations);

      if (newCalculations.length === 0) {
        toast({
          title: 'Nenhuma opção disponível',
          description: 'Nenhuma instituição atende aos critérios informados.',
          variant: 'destructive'
        });
      }
    } catch (error: unknown) {
      toast({
        title: 'Erro no cálculo',
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Export calculation to PDF
  const exportToPDF = (calculation: FinancingCalculation) => {
    // Implementation for PDF export
    toast({
      title: 'Exportação em desenvolvimento',
      description: 'A funcionalidade de exportação será implementada em breve.',
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getInstitutionBadgeColor = (type: string) => {
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
            <Calculator className="h-6 w-6" />
            Calculadora Financeira
          </h2>
          <p className="text-muted-foreground">
            Simule financiamentos com diferentes instituições financeiras
          </p>
        </div>
      </div>

      {/* Input Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Dados do Financiamento
          </CardTitle>
          <CardDescription>
            Informe os dados do projeto para calcular as opções de financiamento
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="projectValue">Valor Total do Projeto (R$)</Label>
              <Input
                id="projectValue"
                type="number"
                step="0.01"
                value={inputs.projectValue}
                onChange={(e) => setInputs(prev => ({ ...prev, projectValue: parseFloat(e.target.value) || 0 }))}
                placeholder="150000.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="downPayment">Entrada (R$)</Label>
              <Input
                id="downPayment"
                type="number"
                step="0.01"
                value={inputs.downPayment}
                onChange={(e) => setInputs(prev => ({ ...prev, downPayment: parseFloat(e.target.value) || 0 }))}
                placeholder="30000.00"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="termMonths">Prazo (meses)</Label>
              <Input
                id="termMonths"
                type="number"
                value={inputs.termMonths}
                onChange={(e) => setInputs(prev => ({ ...prev, termMonths: parseInt(e.target.value) || 120 }))}
                placeholder="120"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Instituições para Comparar</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {institutions.map(institution => (
                <div key={institution.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`inst-${institution.id}`}
                    checked={inputs.selectedInstitutions.includes(institution.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setInputs(prev => ({
                          ...prev,
                          selectedInstitutions: [...prev.selectedInstitutions, institution.id]
                        }));
                      } else {
                        setInputs(prev => ({
                          ...prev,
                          selectedInstitutions: prev.selectedInstitutions.filter(id => id !== institution.id)
                        }));
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                  <label htmlFor={`inst-${institution.id}`} className="flex items-center gap-2 text-sm">
                    {institution.nome}
                    {institution.favorito && <Star className="h-3 w-3 text-yellow-500 fill-current" />}
                    <Badge className={getInstitutionBadgeColor(institution.tipo)} variant="secondary">
                      {institution.tipo}
                    </Badge>
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-between items-center pt-4">
            <div className="text-sm text-muted-foreground">
              Valor a Financiar: <strong>{formatCurrency(inputs.projectValue - inputs.downPayment)}</strong>
            </div>
            <Button onClick={calculateFinancing} disabled={isLoading}>
              {isLoading ? 'Calculando...' : 'Calcular Financiamento'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {calculations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Opções de Financiamento ({calculations.length})
            </CardTitle>
            <CardDescription>
              Comparação das melhores opções disponíveis
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="comparison" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="comparison">Comparação</TabsTrigger>
                <TabsTrigger value="details">Detalhes</TabsTrigger>
              </TabsList>

              <TabsContent value="comparison" className="space-y-4">
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Instituição</TableHead>
                        <TableHead>Taxa (%)</TableHead>
                        <TableHead>Parcela Mensal</TableHead>
                        <TableHead>Total a Pagar</TableHead>
                        <TableHead>Total de Juros</TableHead>
                        <TableHead>Aprovação</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {calculations.map((calc, index) => (
                        <TableRow key={`${calc.institution.id}-${calc.interestRate}`}>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="font-medium flex items-center gap-2">
                                  {calc.institution.nome}
                                  {calc.institution.favorito && (
                                    <Star className="h-3 w-3 text-yellow-500 fill-current" />
                                  )}
                                </div>
                                <Badge className={getInstitutionBadgeColor(calc.institution.tipo)} variant="secondary">
                                  {calc.institution.tipo}
                                </Badge>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{calc.interestRate.toFixed(2)}%</div>
                            <div className="text-xs text-muted-foreground">ao ano</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-green-600">
                              {formatCurrency(calc.monthlyPayment)}
                            </div>
                            {index === 0 && (
                              <Badge variant="default" className="text-xs mt-1">
                                Melhor opção
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{formatCurrency(calc.totalPayment)}</div>
                          </TableCell>
                          <TableCell>
                            <div className="font-medium text-red-600">
                              {formatCurrency(calc.totalInterest)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {((calc.totalInterest / calc.principal) * 100).toFixed(1)}% do principal
                            </div>
                          </TableCell>
                          <TableCell>
                            {calc.institution.tempo_aprovacao_dias && (
                              <div className="flex items-center gap-1 text-sm">
                                <Calendar className="h-3 w-3" />
                                {calc.institution.tempo_aprovacao_dias} dias
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => exportToPDF(calc)}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  // Show detailed info
                                  toast({
                                    title: calc.institution.nome,
                                    description: `Contato: ${calc.institution.contato_principal || 'N/A'}`,
                                  });
                                }}
                              >
                                <Info className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </TabsContent>

              <TabsContent value="details" className="space-y-4">
                {calculations.map((calc, index) => (
                  <Card key={`${calc.institution.id}-${calc.interestRate}`}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-5 w-5" />
                          {calc.institution.nome}
                          {calc.institution.favorito && (
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          )}
                          <Badge className={getInstitutionBadgeColor(calc.institution.tipo)}>
                            {calc.institution.tipo}
                          </Badge>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-green-600">
                            {formatCurrency(calc.monthlyPayment)}/mês
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Taxa: {calc.interestRate.toFixed(2)}% a.a.
                          </div>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <div className="text-sm text-muted-foreground">Valor Financiado</div>
                          <div className="font-medium">{formatCurrency(calc.principal)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Total a Pagar</div>
                          <div className="font-medium">{formatCurrency(calc.totalPayment)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Total de Juros</div>
                          <div className="font-medium text-red-600">{formatCurrency(calc.totalInterest)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-muted-foreground">Prazo</div>
                          <div className="font-medium">{calc.termMonths} meses</div>
                        </div>
                      </div>

                      {calc.institution.contato_principal && (
                        <div className="border-t pt-4">
                          <div className="text-sm text-muted-foreground mb-2">Informações de Contato</div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                            <div>
                              <strong>Contato:</strong> {calc.institution.contato_principal}
                              {calc.institution.cargo_contato && (
                                <div className="text-muted-foreground">{calc.institution.cargo_contato}</div>
                              )}
                            </div>
                            {calc.institution.telefone_contato && (
                              <div>
                                <strong>Telefone:</strong> {calc.institution.telefone_contato}
                              </div>
                            )}
                            {calc.institution.email_contato && (
                              <div>
                                <strong>Email:</strong> {calc.institution.email_contato}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {calc.institution.documentos_necessarios && calc.institution.documentos_necessarios.length > 0 && (
                        <div className="border-t pt-4">
                          <div className="text-sm text-muted-foreground mb-2">Documentos Necessários</div>
                          <div className="flex flex-wrap gap-2">
                            {calc.institution.documentos_necessarios.map((doc, docIndex) => (
                              <Badge key={docIndex} variant="outline">
                                <FileText className="h-3 w-3 mr-1" />
                                {doc}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {calculations.length === 0 && !isLoading && (
        <Card>
          <CardContent className="text-center py-8">
            <Calculator className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum cálculo realizado</h3>
            <p className="text-muted-foreground mb-4">
              Preencha os dados do projeto e selecione as instituições para comparar opções de financiamento.
            </p>
            {institutions.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Você precisa cadastrar pelo menos uma instituição financeira primeiro.
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default FinancialCalculator;