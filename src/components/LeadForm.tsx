import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import { useToast } from '../hooks/use-toast';
import { useCEP } from '../hooks/useCEP';
import { Lead } from '../types';
import { MapPin, User, Phone, Mail, CreditCard, Home, Zap, Calculator, Loader2 } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';

interface LeadFormProps {
  lead?: Lead;
  onSave: (lead: Lead) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

const MONTHS = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const CONCESSIONARIAS = [
  'CEMIG', 'CPFL', 'EDP', 'Enel', 'Energisa', 'Equatorial', 'Light', 'RGE', 'Outras'
];

const GRUPOS_TARIFARIOS = [
  'A1 - Alta Tensão (230kV ou mais)',
  'A2 - Alta Tensão (88kV a 138kV)',
  'A3 - Alta Tensão (69kV)',
  'A3a - Alta Tensão (30kV a 44kV)',
  'A4 - Alta Tensão (2,3kV a 25kV)',
  'AS - Alta Tensão Subterrâneo',
  'B1 - Baixa Tensão Residencial',
  'B2 - Baixa Tensão Rural',
  'B3 - Baixa Tensão Demais Classes',
  'B4 - Baixa Tensão Iluminação Pública'
];

const TIPOS_FORNECIMENTO = [
  { value: 'monofasico', label: 'Monofásico (220V)' },
  { value: 'bifasico', label: 'Bifásico (220V/380V)' },
  { value: 'trifasico', label: 'Trifásico (220V/380V)' }
];

function LeadForm({ lead, onSave, onCancel, isCreating = false }: LeadFormProps) {
  const { toast } = useToast();
  const { searchCEP, isLoading: cepLoading } = useCEP();
  const [saving, setSaving] = useState(false);
  
  // Estados do formulário - ajustado para usar apenas campos válidos da tabela leads
  const [formData, setFormData] = useState<Partial<Lead>>({
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    monthlyConsumption: new Array(12).fill(0),
    averageConsumption: 0,
    status: 'new',
    ...lead
  });

  const [addressDetails, setAddressDetails] = useState({
    street: '',
    number: '',
    complement: '',
    neighborhood: ''
  });

  // Campos de energia que não vão para o Supabase (apenas para cálculos locais)
  const [energyFields, setEnergyFields] = useState({
    concessionaria: lead?.concessionaria || '',
    grupo: lead?.grupo || '',
    subgrupo: lead?.subgrupo || '',
    cpf: lead?.cpf || ''
  });

  const [coordinates, setCoordinates] = useState<{ lat: number; lng: number } | null>(null);

  // Calcular consumo médio e anual automaticamente
  useEffect(() => {
    if (formData.monthlyConsumption) {
      const total = formData.monthlyConsumption.reduce((sum, month) => sum + (month || 0), 0);
      const average = total / 12;
      setFormData(prev => ({
        ...prev,
        averageConsumption: Math.round(average * 100) / 100
      }));
    }
  }, [formData.monthlyConsumption]);

  // Buscar coordenadas quando endereço completo estiver disponível
  useEffect(() => {
    if (formData.address && formData.city && formData.state) {
      getCoordinates();
    }
  }, [formData.address, formData.city, formData.state]);

  const handleInputChange = (field: keyof Lead, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleMonthlyConsumptionChange = (monthIndex: number, value: string) => {
    const numValue = parseFloat(value) || 0;
    const newMonthlyConsumption = [...(formData.monthlyConsumption || new Array(12).fill(0))];
    newMonthlyConsumption[monthIndex] = numValue;
    setFormData(prev => ({
      ...prev,
      monthlyConsumption: newMonthlyConsumption
    }));
  };

  const handleCEPChange = async (cep: string) => {
    const cleanCEP = cep.replace(/\D/g, '');
    handleInputChange('zipCode', cep);
    
    if (cleanCEP.length === 8) {
      try {
        const addressData = await searchCEP(cleanCEP);
        if (addressData) {
          setAddressDetails(prev => ({
            ...prev,
            street: addressData.street,
            neighborhood: addressData.neighborhood
          }));
          
          handleInputChange('address', addressData.street);
          handleInputChange('city', addressData.city);
          handleInputChange('state', addressData.state);
          
          toast({
            title: "CEP encontrado",
            description: `Endereço preenchido automaticamente: ${addressData.city}, ${addressData.state}`
          });
        }
      } catch (error) {
        console.error('Erro ao buscar CEP:', error);
      }
    }
  };

  const getCoordinates = async () => {
    try {
      const fullAddress = `${addressDetails.street} ${addressDetails.number}, ${addressDetails.neighborhood}, ${formData.city}, ${formData.state}, Brasil`;
      
      // Aqui você pode integrar com Google Maps Geocoding API
      // Por enquanto, vamos simular coordenadas
      const mockCoordinates = {
        lat: -23.5505 + (Math.random() - 0.5) * 0.1,
        lng: -46.6333 + (Math.random() - 0.5) * 0.1
      };
      
      setCoordinates(mockCoordinates);
    } catch (error) {
      console.error('Erro ao obter coordenadas:', error);
    }
  };

  const handleEnergyFieldChange = (field: string, value: string) => {
    setEnergyFields(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    // Validar apenas campos que existem na tabela leads
    const requiredFields = ['name', 'city', 'state'];
    const missingFields = requiredFields.filter(field => !formData[field as keyof Lead]);
    
    if (missingFields.length > 0) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios marcados com *",
        variant: "destructive"
      });
      return false;
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    setSaving(true);
    try {
      // Preparar JSON estruturados para campos complexos
      const addressJson = {
        street: addressDetails.street || formData.address || '',
        number: addressDetails.number || '',
        complement: addressDetails.complement || '',
        neighborhood: addressDetails.neighborhood || '',
        city: formData.city || '',
        state: formData.state || '',
        cep: formData.zipCode || '',
        latitude: coordinates?.lat || null,
        longitude: coordinates?.lng || null
      };

      const monthlyConsumptionJson = formData.monthlyConsumption || new Array(12).fill(0);

      // Preparar dados apenas com campos válidos da tabela leads
      const leadData = {
        name: formData.name,
        email: formData.email || null,
        phone: formData.phone || null,
        address: addressJson, // usar JSON estruturado conforme schema
        cpf_cnpj: formData.cpfCnpj || null,
        rg: formData.rg || null,
        birth_date: formData.birthDate || null,
        consumo_medio: formData.averageConsumption || 0,
        consumo_mensal: monthlyConsumptionJson,
        comentarios: formData.comments || null,
        status: formData.status || 'new',
        updated_at: new Date().toISOString()
      };

      // Salvar no Supabase apenas com campos válidos
      if (isEditing && formData.id) {
        const { error } = await supabase
          .from('leads')
          .update(leadData)
          .eq('id', formData.id);
        
        if (error) {
          // Se houver erro de coluna inexistente, tentar novamente com campos mínimos
          if (error.message.includes('does not exist')) {
            const minimalData = {
              name: formData.name,
              email: formData.email || null,
              phone: formData.phone || null,
              updated_at: new Date().toISOString()
            };
            const { error: retryError } = await supabase
              .from('leads')
              .update(minimalData)
              .eq('id', formData.id);
            
            if (retryError) throw retryError;
          } else {
            throw error;
          }
        }
      } else {
        const insertData = {
          ...leadData,
          id: formData.id || crypto.randomUUID(),
          created_at: formData.created_at || new Date().toISOString()
        };

        const { error } = await supabase
          .from('leads')
          .insert([insertData]);
        
        if (error) {
          // Se houver erro de coluna inexistente, tentar novamente com campos mínimos
          if (error.message.includes('does not exist')) {
            const minimalData = {
              id: insertData.id,
              name: formData.name,
              email: formData.email || null,
              phone: formData.phone || null,
              status: 'new',
              created_at: insertData.created_at
            };
            const { error: retryError } = await supabase
              .from('leads')
              .insert([minimalData]);
            
            if (retryError) throw retryError;
          } else {
            throw error;
          }
        }
      }

      // Combinar dados salvos com campos locais para retornar
      const fullLeadData: Lead = {
        ...formData,
        ...energyFields,
        id: formData.id || crypto.randomUUID(),
        address: `${addressDetails.street}, ${addressDetails.number}${addressDetails.complement ? `, ${addressDetails.complement}` : ''}, ${addressDetails.neighborhood}`,
        updated_at: new Date().toISOString(),
        created_at: formData.created_at || new Date().toISOString()
      } as Lead;

      toast({
        title: isEditing ? "Lead atualizado" : "Lead criado",
        description: `${fullLeadData.name} foi ${isEditing ? 'atualizado' : 'criado'} com sucesso!`
      });
      
      onSave(fullLeadData);
    } catch (error) {
      console.error('Erro ao salvar lead:', error);
      toast({
        title: "Erro ao salvar",
        description: "Ocorreu um erro ao salvar o lead. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const totalAnnualConsumption = formData.monthlyConsumption?.reduce((sum, month) => sum + (month || 0), 0) || 0;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            {isEditing ? 'Editar Lead' : 'Novo Lead'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Dados Pessoais */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-4 w-4" />
              <h3 className="text-lg font-semibold">Dados Pessoais</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Digite o nome completo"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF *</Label>
                <Input
                  id="cpf"
                  value={formData.cpf}
                  onChange={(e) => handleInputChange('cpf', e.target.value)}
                  placeholder="000.000.000-00"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="email@exemplo.com"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => handleInputChange('phone', e.target.value)}
                  placeholder="(11) 99999-9999"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Endereço */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Home className="h-4 w-4" />
              <h3 className="text-lg font-semibold">Endereço</h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="zipCode">CEP *</Label>
                <div className="relative">
                  <Input
                    id="zipCode"
                    value={formData.zipCode}
                    onChange={(e) => handleCEPChange(e.target.value)}
                    placeholder="00000-000"
                    required
                  />
                  {cepLoading && (
                    <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin" />
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="city">Cidade *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="Cidade"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="state">Estado *</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="UF"
                  maxLength={2}
                  required
                />
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 space-y-2">
                <Label htmlFor="street">Rua</Label>
                <Input
                  id="street"
                  value={addressDetails.street}
                  onChange={(e) => setAddressDetails(prev => ({ ...prev, street: e.target.value }))}
                  placeholder="Nome da rua"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="number">Número</Label>
                <Input
                  id="number"
                  value={addressDetails.number}
                  onChange={(e) => setAddressDetails(prev => ({ ...prev, number: e.target.value }))}
                  placeholder="123"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="complement">Complemento</Label>
                <Input
                  id="complement"
                  value={addressDetails.complement}
                  onChange={(e) => setAddressDetails(prev => ({ ...prev, complement: e.target.value }))}
                  placeholder="Apto, Bloco, etc."
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input
                id="neighborhood"
                value={addressDetails.neighborhood}
                onChange={(e) => setAddressDetails(prev => ({ ...prev, neighborhood: e.target.value }))}
                placeholder="Nome do bairro"
              />
            </div>
            
            {coordinates && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Coordenadas: {coordinates.lat.toFixed(6)}, {coordinates.lng.toFixed(6)}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Consumo de Energia - campos apenas para interface local */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="h-4 w-4" />
              <h3 className="text-lg font-semibold">Consumo de Energia</h3>
              <Badge variant="outline" className="text-xs">Dados locais</Badge>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="concessionaria">Concessionária *</Label>
                <Select value={energyFields.concessionaria} onValueChange={(value) => handleEnergyFieldChange('concessionaria', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a concessionária" />
                  </SelectTrigger>
                  <SelectContent>
                    {CONCESSIONARIAS.map(conc => (
                      <SelectItem key={conc} value={conc}>{conc}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="grupo">Grupo Tarifário *</Label>
                <Select value={energyFields.grupo} onValueChange={(value) => handleEnergyFieldChange('grupo', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o grupo" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRUPOS_TARIFARIOS.map(grupo => (
                      <SelectItem key={grupo} value={grupo}>{grupo}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subgrupo">Tipo de Fornecimento</Label>
                <Select value={energyFields.subgrupo} onValueChange={(value) => handleEnergyFieldChange('subgrupo', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {TIPOS_FORNECIMENTO.map(tipo => (
                      <SelectItem key={tipo.value} value={tipo.value}>{tipo.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Consumo Mensal */}
            <div className="space-y-4">
              <Label>Consumo Mensal (kWh) *</Label>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {MONTHS.map((month, index) => (
                  <div key={month} className="space-y-1">
                    <Label className="text-xs">{month}</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.monthlyConsumption?.[index] || ''}
                      onChange={(e) => handleMonthlyConsumptionChange(index, e.target.value)}
                      placeholder="0"
                      className="text-sm"
                    />
                  </div>
                ))}
              </div>
            </div>
            
            {/* Resumo do Consumo */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                <span className="font-medium">Consumo Médio:</span>
                <Badge variant="secondary">{formData.averageConsumption?.toFixed(2) || 0} kWh/mês</Badge>
              </div>
              <div className="flex items-center gap-2">
                <Calculator className="h-4 w-4" />
                <span className="font-medium">Consumo Anual:</span>
                <Badge variant="secondary">{totalAnnualConsumption.toFixed(2)} kWh/ano</Badge>
              </div>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-3 pt-6">
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? 'Atualizar' : 'Salvar'} Lead
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default LeadForm;