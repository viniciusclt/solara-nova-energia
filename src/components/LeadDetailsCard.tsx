import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Calculator, MapPin, Zap, Building, Phone, Mail, Calendar } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Lead {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  cpf?: string;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  concessionaria?: string;
  grupo?: string;
  subgrupo?: string;
  averageConsumption?: number;
  monthlyConsumption?: number[];
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface LeadDetailsCardProps {
  lead: Lead | null;
  onLeadUpdate?: (updatedLead: Lead) => void;
}

export function LeadDetailsCard({ lead, onLeadUpdate }: LeadDetailsCardProps) {
  const { toast } = useToast();
  const [isEditingConsumption, setIsEditingConsumption] = useState(false);
  const [averageConsumption, setAverageConsumption] = useState<number>(0);
  const [monthlyConsumption, setMonthlyConsumption] = useState<number[]>(new Array(12).fill(0));
  const [calculationMode, setCalculationMode] = useState<'average' | 'monthly'>('average');

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  useEffect(() => {
    if (lead) {
      setAverageConsumption(lead.averageConsumption || 0);
      setMonthlyConsumption(lead.monthlyConsumption || new Array(12).fill(0));
    }
  }, [lead]);

  const calculateAverageFromMonthly = () => {
    const validMonths = monthlyConsumption.filter(value => value > 0);
    if (validMonths.length === 0) return 0;
    return Math.round(validMonths.reduce((sum, value) => sum + value, 0) / validMonths.length);
  };

  const distributeAverageToMonthly = () => {
    const newMonthlyConsumption = new Array(12).fill(averageConsumption);
    setMonthlyConsumption(newMonthlyConsumption);
  };

  const handleSaveConsumption = () => {
    if (!lead) return;

    let updatedLead: Lead;
    
    if (calculationMode === 'average') {
      distributeAverageToMonthly();
      updatedLead = {
        ...lead,
        averageConsumption,
        monthlyConsumption: new Array(12).fill(averageConsumption)
      };
    } else {
      const calculatedAverage = calculateAverageFromMonthly();
      updatedLead = {
        ...lead,
        averageConsumption: calculatedAverage,
        monthlyConsumption
      };
      setAverageConsumption(calculatedAverage);
    }

    onLeadUpdate?.(updatedLead);
    setIsEditingConsumption(false);
    
    toast({
      title: "Consumo atualizado!",
      description: `Consumo médio: ${updatedLead.averageConsumption} kWh/mês`
    });
  };

  const handleMonthlyChange = (monthIndex: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    const newMonthlyConsumption = [...monthlyConsumption];
    newMonthlyConsumption[monthIndex] = numValue;
    setMonthlyConsumption(newMonthlyConsumption);
  };

  if (!lead) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">
            <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Selecione um lead para ver os detalhes</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Informações do Cliente
            </CardTitle>
            <CardDescription>
              Dados detalhados do lead selecionado
            </CardDescription>
          </div>
          <Badge variant={lead.status === 'active' ? 'default' : 'secondary'}>
            {lead.status || 'Novo'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informações Básicas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Nome</Label>
            <p className="text-sm bg-muted p-2 rounded">{lead.name}</p>
          </div>
          
          {lead.email && (
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1">
                <Mail className="h-3 w-3" />
                Email
              </Label>
              <p className="text-sm bg-muted p-2 rounded">{lead.email}</p>
            </div>
          )}
          
          {lead.phone && (
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1">
                <Phone className="h-3 w-3" />
                Telefone
              </Label>
              <p className="text-sm bg-muted p-2 rounded">{lead.phone}</p>
            </div>
          )}
          
          {lead.cpf && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">CPF</Label>
              <p className="text-sm bg-muted p-2 rounded">{lead.cpf}</p>
            </div>
          )}
          
          {lead.concessionaria && (
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-1">
                <Building className="h-3 w-3" />
                Concessionária
              </Label>
              <p className="text-sm bg-muted p-2 rounded">{lead.concessionaria}</p>
            </div>
          )}
          
          {lead.grupo && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Grupo Tarifário</Label>
              <p className="text-sm bg-muted p-2 rounded">{lead.grupo}</p>
            </div>
          )}
          
          {lead.subgrupo && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">Subgrupo Tarifário</Label>
              <p className="text-sm bg-muted p-2 rounded">{lead.subgrupo}</p>
            </div>
          )}
        </div>

        <Separator />

        {/* Endereço */}
        <div className="space-y-4">
          <h4 className="font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Endereço
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {lead.address && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Endereço</Label>
                <p className="text-sm bg-muted p-2 rounded">{lead.address}</p>
              </div>
            )}
            
            {lead.city && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Cidade</Label>
                <p className="text-sm bg-muted p-2 rounded">{lead.city}</p>
              </div>
            )}
            
            {lead.state && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">Estado</Label>
                <p className="text-sm bg-muted p-2 rounded">{lead.state}</p>
              </div>
            )}
            
            {lead.zipCode && (
              <div className="space-y-2">
                <Label className="text-sm font-medium">CEP</Label>
                <p className="text-sm bg-muted p-2 rounded">{lead.zipCode}</p>
              </div>
            )}
          </div>
        </div>

        <Separator />

        {/* Consumo de Energia */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Consumo de Energia
            </h4>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditingConsumption(!isEditingConsumption)}
              className="flex items-center gap-2"
            >
              <Calculator className="h-3 w-3" />
              {isEditingConsumption ? 'Cancelar' : 'Editar'}
            </Button>
          </div>

          {!isEditingConsumption ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Consumo Médio</Label>
                <p className="text-sm bg-muted p-2 rounded">
                  {averageConsumption > 0 ? `${averageConsumption} kWh/mês` : 'Não informado'}
                </p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Consumo Anual</Label>
                <p className="text-sm bg-muted p-2 rounded">
                  {averageConsumption > 0 ? `${averageConsumption * 12} kWh/ano` : 'Não informado'}
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex gap-2 mb-4">
                <Button
                  variant={calculationMode === 'average' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCalculationMode('average')}
                >
                  Consumo Médio
                </Button>
                <Button
                  variant={calculationMode === 'monthly' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCalculationMode('monthly')}
                >
                  Consumo Mensal
                </Button>
              </div>

              {calculationMode === 'average' ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="averageConsumption">Consumo Médio (kWh/mês)</Label>
                    <Input
                      id="averageConsumption"
                      type="number"
                      value={averageConsumption}
                      onChange={(e) => setAverageConsumption(parseFloat(e.target.value) || 0)}
                      placeholder="Ex: 350"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    O valor será distribuído automaticamente para todos os meses
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {monthNames.map((month, index) => (
                      <div key={month} className="space-y-1">
                        <Label className="text-xs">{month}</Label>
                        <Input
                          type="number"
                          value={monthlyConsumption[index]}
                          onChange={(e) => handleMonthlyChange(index, e.target.value)}
                          placeholder="kWh"
                          className="text-xs"
                        />
                      </div>
                    ))}
                  </div>
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-sm text-blue-800">
                      Média calculada: {calculateAverageFromMonthly()} kWh/mês
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button onClick={handleSaveConsumption} size="sm">
                  Salvar Consumo
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setIsEditingConsumption(false)}
                >
                  Cancelar
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Datas */}
        {(lead.createdAt || lead.updatedAt) && (
          <>
            <Separator />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {lead.createdAt && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Criado em
                  </Label>
                  <p className="text-sm bg-muted p-2 rounded">
                    {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
              
              {lead.updatedAt && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Atualizado em
                  </Label>
                  <p className="text-sm bg-muted p-2 rounded">
                    {new Date(lead.updatedAt).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}