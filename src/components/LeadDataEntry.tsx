import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, Upload, MapPin, User, Building, Zap, ArrowLeft, List } from "lucide-react";
import { CEPInput } from "@/components/ui/cep-input";
import { LeadList } from "./LeadList";
import { LeadSearchDropdown } from "./LeadSearchDropdown";
import { LeadTablePage } from "./LeadTablePage";
import { SelectedLeadBreadcrumb } from "./SelectedLeadBreadcrumb";
import { useToast } from "@/hooks/use-toast";
import { 
  validateEmail, 
  validatePhone, 
  validateDate, 
  validateCEP, 
  validateAddress, 
  validateName,
  validateNumericRange,
  sanitizeInput 
} from "@/lib/validation";
import { useSecurityAudit } from "@/hooks/useSecurityAudit";
import { supabase } from "@/integrations/supabase/client";
import { DemoDataService } from "@/services/DemoDataService";

interface LeadData {
  id?: string;
  name: string;
  cpfCnpj: string;
  rg: string;
  birthDate: string;
  email: string;
  phone: string;
  address: {
    state: string;
    city: string;
    neighborhood: string;
    cep: string;
    street: string;
    number: string;
    latitude?: number;
    longitude?: number;
  };
  concessionaria: string;
  grupo: string;
  tipoFornecimento: string;
  cdd: number;
  tensaoAlimentacao: string;
  modalidadeTarifaria: string;
  numeroCliente: string;
  numeroInstalacao: string;
  consumoMensal: number[];
  consumoMedio: number;
  incrementoConsumo: number;
  comentarios: string;
}

interface LeadDataEntryProps {
  currentLead: LeadData | null;
  onLeadUpdate: (lead: LeadData) => void;
}

export function LeadDataEntry({ currentLead, onLeadUpdate }: LeadDataEntryProps) {
  const { toast } = useToast();
  const { logFailedValidation, logDataExport } = useSecurityAudit();
  const [leadData, setLeadData] = useState<LeadData>({
    name: "",
    cpfCnpj: "",
    rg: "",
    birthDate: "",
    email: "",
    phone: "",
    address: {
      state: "RJ",
      city: "",
      neighborhood: "",
      cep: "",
      street: "",
      number: "",
    },
    concessionaria: "",
    grupo: "",
    tipoFornecimento: "",
    cdd: 0,
    tensaoAlimentacao: "",
    modalidadeTarifaria: "",
    numeroCliente: "",
    numeroInstalacao: "",
    consumoMensal: new Array(12).fill(0),
    consumoMedio: 0,
    incrementoConsumo: 0,
    comentarios: ""
  });

  const [isLoading, setIsLoading] = useState(false);
  const [showLeadList, setShowLeadList] = useState(!currentLead);
  const [showTableView, setShowTableView] = useState(false);

  const loadLeadById = useCallback(async (leadId: string) => {
    try {
      const { data: lead, error } = await supabase
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (error) throw error;

      if (lead) {
        const formattedLead = formatLeadFromDB(lead);
        setLeadData(formattedLead);
        onLeadUpdate(formattedLead);
        setShowLeadList(false);
      }
    } catch (error) {
      console.error('Error loading lead:', error);
      localStorage.removeItem('selectedLeadId');
    }
  }, [onLeadUpdate]);

  useEffect(() => {
    if (currentLead) {
      setLeadData(currentLead);
      setShowLeadList(false);
    }
  }, [currentLead]);

  useEffect(() => {
    // Verificar se há um lead selecionado no localStorage
    const savedLeadId = localStorage.getItem('selectedLeadId');
    if (savedLeadId && !currentLead) {
      loadLeadById(savedLeadId);
    } else {
      // Carregar dados de demonstração em localhost se não há lead atual
      const demoDataService = DemoDataService.getInstance();
      if (demoDataService.shouldUseDemoData() && !currentLead) {
        const demoLeads = demoDataService.getLeads();
        if (demoLeads.length > 0) {
          const firstDemoLead = demoLeads[0];
          setLeadData(firstDemoLead);
          onLeadUpdate(firstDemoLead);
          setShowLeadList(false);
        }
      }
    }
  }, [currentLead, loadLeadById, onLeadUpdate]);

  const formatLeadFromDB = (dbLead: Record<string, unknown>): LeadData => {
    return {
      id: dbLead.id,
      name: dbLead.name || "",
      cpfCnpj: dbLead.cpf_cnpj || "",
      rg: dbLead.rg || "",
      birthDate: dbLead.birth_date || "",
      email: dbLead.email || "",
      phone: dbLead.phone || "",
      address: dbLead.address || {
        state: "RJ",
        city: "",
        neighborhood: "",
        cep: "",
        street: "",
        number: "",
      },
      concessionaria: dbLead.concessionaria || "",
      grupo: dbLead.grupo || "",
      tipoFornecimento: dbLead.tipo_fornecimento || "",
      cdd: dbLead.cdd || 0,
      tensaoAlimentacao: dbLead.tensao_alimentacao || "",
      modalidadeTarifaria: dbLead.modalidade_tarifaria || "",
      numeroCliente: dbLead.numero_cliente || "",
      numeroInstalacao: dbLead.numero_instalacao || "",
      consumoMensal: dbLead.consumo_mensal || new Array(12).fill(0),
      consumoMedio: dbLead.consumo_medio || 0,
      incrementoConsumo: dbLead.incremento_consumo || 0,
      comentarios: dbLead.comentarios || ""
    };
  };

  const handleLeadSelect = (lead: Record<string, unknown>) => {
    const formattedLead = formatLeadFromDB(lead);
    setLeadData(formattedLead);
    onLeadUpdate(formattedLead);
    setShowLeadList(false);
  };

  const handleNewLead = () => {
    const emptyLead: LeadData = {
      name: "",
      cpfCnpj: "",
      rg: "",
      birthDate: "",
      email: "",
      phone: "",
      address: {
        state: "RJ",
        city: "",
        neighborhood: "",
        cep: "",
        street: "",
        number: "",
      },
      concessionaria: "",
      grupo: "",
      tipoFornecimento: "",
      cdd: 0,
      tensaoAlimentacao: "",
      modalidadeTarifaria: "",
      numeroCliente: "",
      numeroInstalacao: "",
      consumoMensal: new Array(12).fill(0),
      consumoMedio: 0,
      incrementoConsumo: 0,
      comentarios: ""
    };
    
    setLeadData(emptyLead);
    onLeadUpdate(emptyLead);
    setShowLeadList(false);
    localStorage.removeItem('selectedLeadId');
  };

  const handleBackToList = () => {
    setShowLeadList(true);
  };

  const handleInputChange = (field: string, value: unknown) => {
    // Sanitize string inputs
    const sanitizedValue = typeof value === 'string' ? sanitizeInput(value) : value;
    
    // Validate specific fields
    let isValid = true;
    let errorMessage = '';
    
    switch (field) {
      case 'name': {
        const nameValidation = validateName(sanitizedValue);
        isValid = nameValidation.isValid;
        errorMessage = nameValidation.message || '';
        break;
      }
      case 'email':
        isValid = validateEmail(sanitizedValue);
        errorMessage = 'Email inválido';
        break;
      case 'phone': {
        const phoneValidation = validatePhone(sanitizedValue);
        isValid = phoneValidation.isValid;
        errorMessage = phoneValidation.message || '';
        break;
      }
      case 'birthDate': {
        const dateValidation = validateDate(sanitizedValue);
        isValid = dateValidation.isValid;
        errorMessage = dateValidation.message || '';
        break;
      }
      case 'consumoMedio': {
        const consumoValidation = validateNumericRange(Number(sanitizedValue), 0, 10000, 'Consumo médio');
        isValid = consumoValidation.isValid;
        errorMessage = consumoValidation.message || '';
        break;
      }
    }
    
    if (!isValid) {
      logFailedValidation(field, String(value), errorMessage);
      toast({
        title: "Erro de Validação",
        description: errorMessage,
        variant: "destructive"
      });
      return;
    }
    
    setLeadData(prev => ({
      ...prev,
      [field]: sanitizedValue
    }));
  };

  const handleAddressChange = (field: string, value: string) => {
    const sanitizedValue = sanitizeInput(value);
    
    // Validate address fields
    let isValid = true;
    let errorMessage = '';
    
    switch (field) {
      case 'cep': {
        const cepValidation = validateCEP(sanitizedValue);
        isValid = cepValidation.isValid;
        errorMessage = cepValidation.message || '';
        break;
      }
      case 'street': {
        const addressValidation = validateAddress(sanitizedValue);
        isValid = addressValidation.isValid;
        errorMessage = addressValidation.message || '';
        break;
      }
    }
    
    if (!isValid) {
      logFailedValidation(`address.${field}`, value, errorMessage);
      toast({
        title: "Erro de Validação",
        description: errorMessage,
        variant: "destructive"
      });
      return;
    }
    
    setLeadData(prev => ({
      ...prev,
      address: {
        ...prev.address,
        [field]: sanitizedValue
      }
    }));
  };

  const handleConsumoMensalChange = (month: number, value: number) => {
    // Garantir que consumoMensal existe e tem 12 elementos
    const currentConsumo = leadData.consumoMensal || new Array(12).fill(0);
    const newConsumo = [...currentConsumo];
    newConsumo[month] = value;
    
    const media = newConsumo.reduce((sum, val) => sum + val, 0) / 12;
    
    setLeadData(prev => ({
      ...prev,
      consumoMensal: newConsumo,
      consumoMedio: Math.round(media)
    }));
  };

  const autoDistribuirConsumo = () => {
    if (leadData.consumoMedio > 0) {
      // Distribuição baseada no padrão sazonal brasileiro
      const fatoresSazonais = [1.05, 1.1, 1.0, 0.95, 0.9, 0.85, 0.8, 0.85, 0.9, 0.95, 1.0, 1.1];
      const novoConsumo = fatoresSazonais.map(fator => 
        Math.round(leadData.consumoMedio * fator)
      );
      
      setLeadData(prev => ({
        ...prev,
        consumoMensal: novoConsumo
      }));

      toast({
        title: "Distribuição Automática",
        description: "Consumo mensal distribuído automaticamente baseado no padrão sazonal."
      });
    }
  };

  const importarGoogleSheets = async () => {
    setIsLoading(true);
    try {
      // Get the latest settings
      const { data: settings, error } = await supabase
        .from('integration_settings')
        .select('settings')
        .eq('integration_type', 'google_sheets')
        .single();

      if (error || !settings) {
        toast({
          title: "Configuração Necessária",
          description: "Configure o Google Sheets nas configurações antes de importar.",
          variant: "destructive"
        });
        return;
      }

      // Call the sync function
      const { data, error: syncError } = await supabase.functions.invoke('sync-google-sheets', {
        body: { settings: settings.settings }
      });

      if (syncError) throw syncError;

      toast({
        title: "Importação Concluída",
        description: `${data.successfulImports} leads importados com sucesso.`
      });

      // Load a sample lead for demonstration
      if (data.successfulImports > 0) {
        const { data: leads } = await supabase
          .from('leads')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1);

        if (leads && leads.length > 0) {
          const lead = leads[0];
          const formattedLead: LeadData = {
            name: lead.name,
            cpfCnpj: lead.cpf_cnpj || "",
            rg: lead.rg || "",
            birthDate: lead.birth_date || "",
            email: lead.email || "",
            phone: lead.phone || "",
            address: (typeof lead.address === 'object' && lead.address !== null) ? {
              state: (lead.address as Record<string, unknown>).state as string || "RJ",
              city: (lead.address as Record<string, unknown>).city as string || "",
              neighborhood: (lead.address as Record<string, unknown>).neighborhood as string || "",
              cep: (lead.address as Record<string, unknown>).cep as string || "",
              street: (lead.address as Record<string, unknown>).street as string || "",
              number: (lead.address as Record<string, unknown>).number as string || ""
            } : {
              state: "RJ",
              city: "",
              neighborhood: "",
              cep: "",
              street: "",
              number: ""
            },
            concessionaria: lead.concessionaria || "Light",
            grupo: lead.grupo || "B1",
            tipoFornecimento: lead.tipo_fornecimento || "Monofásico",
            cdd: lead.cdd || 0,
            tensaoAlimentacao: lead.tensao_alimentacao || "220V",
            modalidadeTarifaria: lead.modalidade_tarifaria || "Convencional",
            numeroCliente: lead.numero_cliente || "",
            numeroInstalacao: lead.numero_instalacao || "",
            consumoMensal: Array.isArray(lead.consumo_mensal) ? lead.consumo_mensal as number[] : Array(12).fill(0),
            consumoMedio: lead.consumo_medio || 0,
            incrementoConsumo: lead.incremento_consumo || 0,
            comentarios: lead.comentarios || ""
          };

          setLeadData(formattedLead);
          onLeadUpdate(formattedLead);
        }
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Erro na Importação",
        description: "Erro ao importar dados. Verifique as configurações.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const salvarLead = async () => {
    try {
      // Log data export for security audit
      logDataExport('lead_data', 1);
      
      const leadToSave = {
        name: leadData.name,
        cpf_cnpj: leadData.cpfCnpj,
        rg: leadData.rg,
        birth_date: leadData.birthDate,
        email: leadData.email,
        phone: leadData.phone,
        address: leadData.address,
        concessionaria: leadData.concessionaria,
        grupo: leadData.grupo,
        tipo_fornecimento: leadData.tipoFornecimento,
        cdd: leadData.cdd,
        tensao_alimentacao: leadData.tensaoAlimentacao,
        modalidade_tarifaria: leadData.modalidadeTarifaria,
        numero_cliente: leadData.numeroCliente,
        numero_instalacao: leadData.numeroInstalacao,
        consumo_mensal: leadData.consumoMensal,
        consumo_medio: leadData.consumoMedio,
        incremento_consumo: leadData.incrementoConsumo,
        comentarios: leadData.comentarios,
        user_id: leadData.id ? undefined : await supabase.auth.getUser().then(res => res.data.user?.id),
        company_id: await supabase.auth.getUser().then(res => res.data.user?.id).then(async userId => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('company_id')
            .eq('id', userId)
            .single();
          return profile?.company_id;
        })
      };

      let result;
      if (leadData.id) {
        // Atualizar lead existente
        result = await supabase
          .from('leads')
          .update(leadToSave)
          .eq('id', leadData.id)
          .select()
          .single();
      } else {
        // Criar novo lead
        result = await supabase
          .from('leads')
          .insert(leadToSave)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      // Atualizar o estado local com o ID do lead salvo
      const savedLead = { ...leadData, id: result.data.id };
      setLeadData(savedLead);
      onLeadUpdate(savedLead);
      localStorage.setItem('selectedLeadId', result.data.id);

      toast({
        title: "Lead Salvo",
        description: "Dados do lead salvos com sucesso!"
      });
    } catch (error) {
      console.error('Error saving lead:', error);
      toast({
        title: "Erro",
        description: "Erro ao salvar lead",
        variant: "destructive"
      });
    }
  };

  const meses = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez"
  ];

  // Se deve mostrar a tabela completa de leads
  if (showTableView) {
    return (
      <div className="space-y-6">
        <LeadTablePage 
          onLeadSelect={handleLeadSelect}
          selectedLeadId={leadData.id || null}
          onNewLead={handleNewLead}
          onBack={() => setShowTableView(false)}
          showActions={true}
        />
      </div>
    );
  }

  // Se deve mostrar a busca de leads
  if (showLeadList) {
    return (
      <div className="space-y-6">
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Selecionar Lead
            </CardTitle>
            <CardDescription>
              Busque por nome, email ou telefone para encontrar um lead existente
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LeadSearchDropdown 
              onLeadSelect={handleLeadSelect}
              selectedLeadId={leadData.id || null}
              onNewLead={handleNewLead}
              onViewTable={() => setShowTableView(true)}
              placeholder="Digite o nome, email ou telefone do lead..."
              maxResults={8}
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb do lead selecionado */}
      <div className="flex items-center justify-between">
        <SelectedLeadBreadcrumb 
          leadName={leadData.name || null}
          onClearSelection={handleBackToList}
        />
        <Button 
          variant="outline" 
          onClick={handleBackToList}
          className="flex items-center gap-2"
        >
          <List className="h-4 w-4" />
          Ver Lista de Leads
        </Button>
      </div>

      {/* Header com ações */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-primary" />
                Dados do Lead
              </CardTitle>
              <CardDescription>
                Importe ou insira manualmente os dados do cliente
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                onClick={importarGoogleSheets}
                disabled={isLoading}
              >
                <Upload className="h-4 w-4" />
                {isLoading ? "Importando..." : "Importar Google Sheets"}
              </Button>
              <Button onClick={salvarLead}>
                <Download className="h-4 w-4" />
                Salvar Lead
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Dados Pessoais */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Dados Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  value={leadData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="Nome do cliente"
                />
              </div>
              <div>
                <Label htmlFor="cpfCnpj">CPF/CNPJ</Label>
                <Input
                  id="cpfCnpj"
                  value={leadData.cpfCnpj}
                  onChange={(e) => handleInputChange("cpfCnpj", e.target.value)}
                  placeholder="000.000.000-00"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="rg">RG</Label>
                <Input
                  id="rg"
                  value={leadData.rg}
                  onChange={(e) => handleInputChange("rg", e.target.value)}
                  placeholder="00.000.000-0"
                />
              </div>
              <div>
                <Label htmlFor="birthDate">Data de Nascimento</Label>
                <Input
                  id="birthDate"
                  type="date"
                  value={leadData.birthDate}
                  onChange={(e) => handleInputChange("birthDate", e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={leadData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="cliente@email.com"
                />
              </div>
              <div>
                <Label htmlFor="phone">Telefone</Label>
                <Input
                  id="phone"
                  value={leadData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="(21) 99999-9999"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Endereço
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="state">Estado</Label>
                <Select value={leadData.address.state} onValueChange={(value) => handleAddressChange("state", value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                    <SelectItem value="SP">São Paulo</SelectItem>
                    <SelectItem value="MG">Minas Gerais</SelectItem>
                    <SelectItem value="ES">Espírito Santo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="city">Cidade</Label>
                <Input
                  id="city"
                  value={leadData.address.city}
                  onChange={(e) => handleAddressChange("city", e.target.value)}
                  placeholder="Rio de Janeiro"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="neighborhood">Bairro</Label>
                <Input
                  id="neighborhood"
                  value={leadData.address.neighborhood}
                  onChange={(e) => handleAddressChange("neighborhood", e.target.value)}
                  placeholder="Anil"
                />
              </div>
              <div>
                <Label htmlFor="cep">CEP</Label>
                <CEPInput
                  value={leadData.address.cep}
                  onChange={(value) => handleAddressChange("cep", value)}
                  onAddressFound={(address) => {
                    setLeadData(prev => ({
                      ...prev,
                      address: {
                        ...prev.address,
                        cep: address.cep,
                        street: address.street,
                        neighborhood: address.neighborhood,
                        city: address.city,
                        state: address.state
                      }
                    }));
                  }}
                  placeholder="00000-000"
                  autoSearch={true}
                  showSearchButton={true}
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label htmlFor="street">Rua</Label>
                <Input
                  id="street"
                  value={leadData.address.street}
                  onChange={(e) => handleAddressChange("street", e.target.value)}
                  placeholder="R. Flordelice"
                />
              </div>
              <div>
                <Label htmlFor="number">Número</Label>
                <Input
                  id="number"
                  value={leadData.address.number}
                  onChange={(e) => handleAddressChange("number", e.target.value)}
                  placeholder="467"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dados Elétricos */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Dados Elétricos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="concessionaria">Concessionária</Label>
              <Select value={leadData.concessionaria} onValueChange={(value) => handleInputChange("concessionaria", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Light">Light</SelectItem>
                  <SelectItem value="Enel-RJ">Enel-RJ</SelectItem>
                  <SelectItem value="Cemig">Cemig</SelectItem>
                  <SelectItem value="CPFL">CPFL</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="grupo">Grupo</Label>
              <Select value={leadData.grupo} onValueChange={(value) => handleInputChange("grupo", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="B1">B1 - Residencial</SelectItem>
                  <SelectItem value="B3">B3 - Comercial</SelectItem>
                  <SelectItem value="A4">A4 - Industrial</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tipoFornecimento">Tipo Fornecimento</Label>
              <Select value={leadData.tipoFornecimento} onValueChange={(value) => handleInputChange("tipoFornecimento", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Monofásico">Monofásico</SelectItem>
                  <SelectItem value="Bifásico">Bifásico</SelectItem>
                  <SelectItem value="Trifásico">Trifásico</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="modalidadeTarifaria">Modalidade Tarifária</Label>
              <Select value={leadData.modalidadeTarifaria} onValueChange={(value) => handleInputChange("modalidadeTarifaria", value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Convencional">Convencional</SelectItem>
                  <SelectItem value="Branca">Branca</SelectItem>
                  <SelectItem value="Verde">Verde</SelectItem>
                  <SelectItem value="Azul">Azul</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Consumo Elétrico */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Consumo Elétrico</CardTitle>
              <CardDescription>
                Insira o consumo mensal ou médio para distribuição automática
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="bg-primary/10">
                Média: {leadData.consumoMedio} kWh
              </Badge>
              <Button variant="secondary" size="sm" onClick={autoDistribuirConsumo}>
                Distribuir Automaticamente
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="consumoMedio">Consumo Médio (kWh)</Label>
              <Input
                id="consumoMedio"
                type="number"
                value={leadData.consumoMedio}
                onChange={(e) => handleInputChange("consumoMedio", Number(e.target.value))}
                placeholder="780"
              />
            </div>
            <div>
              <Label htmlFor="incrementoConsumo">Incremento Consumo (%)</Label>
              <Input
                id="incrementoConsumo"
                type="number"
                step="0.1"
                value={leadData.incrementoConsumo}
                onChange={(e) => handleInputChange("incrementoConsumo", Number(e.target.value))}
                placeholder="4.5"
              />
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-3 md:grid-cols-6 lg:grid-cols-12 gap-2">
            {meses.map((mes, index) => (
              <div key={mes}>
                <Label htmlFor={`consumo-${index}`} className="text-xs">
                  {mes}
                </Label>
                <Input
                  id={`consumo-${index}`}
                  type="number"
                  value={leadData.consumoMensal?.[index] || 0}
                  onChange={(e) => handleConsumoMensalChange(index, Number(e.target.value))}
                  className="text-sm"
                />
              </div>
            ))}
          </div>

          <div>
            <Label htmlFor="comentarios">Comentários</Label>
            <Textarea
              id="comentarios"
              value={leadData.comentarios}
              onChange={(e) => handleInputChange("comentarios", e.target.value)}
              placeholder="Observações sobre o cliente ou projeto..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}