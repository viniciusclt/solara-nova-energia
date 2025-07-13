import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Download, Upload, MapPin, User, Building, Zap } from "lucide-react";
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

  useEffect(() => {
    if (currentLead) {
      setLeadData(currentLead);
    }
  }, [currentLead]);

  const handleInputChange = (field: string, value: any) => {
    // Sanitize string inputs
    const sanitizedValue = typeof value === 'string' ? sanitizeInput(value) : value;
    
    // Validate specific fields
    let isValid = true;
    let errorMessage = '';
    
    switch (field) {
      case 'name':
        const nameValidation = validateName(sanitizedValue);
        isValid = nameValidation.isValid;
        errorMessage = nameValidation.message || '';
        break;
      case 'email':
        isValid = validateEmail(sanitizedValue);
        errorMessage = 'Email inválido';
        break;
      case 'phone':
        const phoneValidation = validatePhone(sanitizedValue);
        isValid = phoneValidation.isValid;
        errorMessage = phoneValidation.message || '';
        break;
      case 'birthDate':
        const dateValidation = validateDate(sanitizedValue);
        isValid = dateValidation.isValid;
        errorMessage = dateValidation.message || '';
        break;
      case 'consumoMedio':
        const consumoValidation = validateNumericRange(Number(sanitizedValue), 0, 10000, 'Consumo médio');
        isValid = consumoValidation.isValid;
        errorMessage = consumoValidation.message || '';
        break;
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
      case 'cep':
        const cepValidation = validateCEP(sanitizedValue);
        isValid = cepValidation.isValid;
        errorMessage = cepValidation.message || '';
        break;
      case 'street':
        const addressValidation = validateAddress(sanitizedValue);
        isValid = addressValidation.isValid;
        errorMessage = addressValidation.message || '';
        break;
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
    const newConsumo = [...leadData.consumoMensal];
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
      // Simulação de importação do Google Sheets
      const dadosSimulados = {
        name: "VIEIRA",
        cpfCnpj: "123.456.789-00",
        rg: "12.345.678-9",
        email: "vieira@email.com",
        phone: "(21) 99999-9999",
        address: {
          state: "RJ",
          city: "Rio de Janeiro",
          neighborhood: "Anil",
          cep: "22750-001",
          street: "R. Flordelice",
          number: "467",
        },
        concessionaria: "Light",
        grupo: "B1",
        tipoFornecimento: "Monofásico",
        consumoMensal: [1123, 1050, 980, 920, 850, 780, 720, 750, 820, 890, 950, 936],
        consumoMedio: 856,
        incrementoConsumo: 4.5,
        comentarios: "Cliente interessado em sistema residencial"
      };

      setLeadData(prev => ({ ...prev, ...dadosSimulados }));
      onLeadUpdate({ ...leadData, ...dadosSimulados });
      
      toast({
        title: "Dados Importados",
        description: "Dados do lead importados com sucesso do Google Sheets."
      });
    } catch (error) {
      toast({
        title: "Erro na Importação",
        description: "Erro ao importar dados. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const salvarLead = () => {
    // Log data export for security audit
    logDataExport('lead_data', 1);
    
    onLeadUpdate(leadData);
    toast({
      title: "Lead Salvo",
      description: "Dados do lead salvos com sucesso!"
    });
  };

  const meses = [
    "Jan", "Fev", "Mar", "Abr", "Mai", "Jun",
    "Jul", "Ago", "Set", "Out", "Nov", "Dez"
  ];

  return (
    <div className="space-y-6">
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
                <Input
                  id="cep"
                  value={leadData.address.cep}
                  onChange={(e) => handleAddressChange("cep", e.target.value)}
                  placeholder="22750-001"
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
                  value={leadData.consumoMensal[index]}
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