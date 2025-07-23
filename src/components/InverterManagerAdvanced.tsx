import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, Save, X, FileText, Zap, Settings, Shield, Gauge } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Inverter } from "@/types";
import { DemoDataService } from "@/services/DemoDataService";
import { FileUpload } from "@/components/ui/file-upload";

export function InverterManagerAdvanced() {
  const { toast } = useToast();
  const [inverters, setInverters] = useState<Inverter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedProtections, setSelectedProtections] = useState<string[]>([]);
  const [selectedCertifications, setSelectedCertifications] = useState<string[]>([]);
  const [selectedCommunicationInterfaces, setSelectedCommunicationInterfaces] = useState<string[]>([]);

  const [currentInverter, setCurrentInverter] = useState<Inverter>({
    name: "",
    manufacturer: "",
    model: "",
    power: 0,
    maxDcPower: 0,
    maxDcVoltage: 0,
    startupVoltage: 0,
    nominalDcVoltage: 0,
    maxDcCurrent: 0,
    mpptChannels: 2,
    maxInputsPerMppt: 1,
    nominalAcPower: 0,
    maxAcPower: 0,
    nominalAcVoltage: 220,
    acVoltageRange: "180-264V",
    nominalFrequency: 60,
    frequencyRange: "59.3-60.5Hz",
    phases: 1,
    maxAcCurrent: 0,
    powerFactor: 0.99,
    maxEfficiency: 97.5,
    europeanEfficiency: 97.0,
    mpptEfficiency: 99.9,
    protections: [],
    dimensions: {
      length: 0,
      width: 0,
      height: 0
    },
    weight: 0,
    operatingTemperature: "-25°C a +60°C",
    storageTemperature: "-40°C a +70°C",
    humidity: "0-95% (sem condensação)",
    altitude: 2000,
    coolingMethod: "Convecção natural",
    enclosureRating: "IP65",
    productWarranty: 10,
    performanceWarranty: 10,
    designLife: 20,
    certifications: [],
    communicationInterfaces: [],
    monitoringCapability: true,
    topology: "Transformerless",
    displayType: "LCD",
    active: true
  });

  const availableProtections = [
    "Sobretensão DC", "Subtensão DC", "Sobrecorrente DC", "Polaridade reversa",
    "Sobretensão AC", "Subtensão AC", "Sobrefrequência", "Subfrequência",
    "Proteção de ilhamento", "Proteção térmica", "Proteção AFCI", "Proteção RCMU"
  ];

  const availableCertifications = [
    "IEC 62109", "IEC 61727", "IEC 62116", "UL 1741", "IEEE 1547",
    "VDE 0126", "G83/2", "AS 4777", "INMETRO", "CEC", "MCS"
  ];

  const availableCommunicationInterfaces = [
    "WiFi", "Ethernet", "RS485", "Bluetooth", "4G/LTE", "Zigbee", "LoRa", "USB"
  ];

  useEffect(() => {
    fetchInverters();
  }, []);

  const fetchInverters = async () => {
    setIsLoading(true);
    try {
      const demoDataService = DemoDataService.getInstance();
      
      if (demoDataService.shouldUseDemoData()) {
        // Usar dados de demonstração em localhost
        const demoInverters = demoDataService.getInverters();
        setInverters(demoInverters);
      } else {
        // Usar dados do Supabase em produção
        const { data, error } = await supabase
          .from('inverters')
          .select('*')
          .order('name');

        if (error) throw error;
        setInverters(data || []);
      }
    } catch (error) {
      console.error('Error fetching inverters:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os inversores",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveInverter = async () => {
    try {
      // Preparar o inversor com os dados atualizados
      const inverterToSave: Inverter = {
        ...currentInverter,
        protections: selectedProtections,
        certifications: selectedCertifications,
        communicationInterfaces: selectedCommunicationInterfaces
      };

      let result;
      
      if (isEditing && currentInverter.id) {
        // Atualizar inversor existente
        result = await supabase
          .from('inverters')
          .update(inverterToSave)
          .eq('id', currentInverter.id);
      } else {
        // Criar novo inversor
        result = await supabase
          .from('inverters')
          .insert(inverterToSave);
      }

      if (result.error) throw result.error;

      toast({
        title: isEditing ? "Inversor Atualizado" : "Inversor Criado",
        description: `${inverterToSave.name} foi ${isEditing ? 'atualizado' : 'adicionado'} com sucesso`,
      });

      setIsDialogOpen(false);
      fetchInverters();
    } catch (error) {
      console.error('Error saving inverter:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o inversor",
        variant: "destructive"
      });
    }
  };

  const handleDeleteInverter = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este inversor?")) return;

    try {
      const { error } = await supabase
        .from('inverters')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Inversor Excluído",
        description: "O inversor foi excluído com sucesso",
      });

      fetchInverters();
    } catch (error) {
      console.error('Error deleting inverter:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o inversor",
        variant: "destructive"
      });
    }
  };

  const handleEditInverter = (inverter: Inverter) => {
    setCurrentInverter(inverter);
    setSelectedProtections(inverter.protections || []);
    setSelectedCertifications(inverter.certifications || []);
    setSelectedCommunicationInterfaces(inverter.communicationInterfaces || []);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleNewInverter = () => {
    setCurrentInverter({
      name: "",
      manufacturer: "",
      model: "",
      power: 0,
      maxDcPower: 0,
      maxDcVoltage: 0,
      startupVoltage: 0,
      nominalDcVoltage: 0,
      maxDcCurrent: 0,
      mpptChannels: 2,
      maxInputsPerMppt: 1,
      nominalAcPower: 0,
      maxAcPower: 0,
      nominalAcVoltage: 220,
      acVoltageRange: "180-264V",
      nominalFrequency: 60,
      frequencyRange: "59.3-60.5Hz",
      phases: 1,
      maxAcCurrent: 0,
      powerFactor: 0.99,
      maxEfficiency: 97.5,
      europeanEfficiency: 97.0,
      mpptEfficiency: 99.9,
      protections: [],
      dimensions: {
        length: 0,
        width: 0,
        height: 0
      },
      weight: 0,
      operatingTemperature: "-25°C a +60°C",
      storageTemperature: "-40°C a +70°C",
      humidity: "0-95% (sem condensação)",
      altitude: 2000,
      coolingMethod: "Convecção natural",
      enclosureRating: "IP65",
      productWarranty: 10,
      performanceWarranty: 10,
      designLife: 20,
      certifications: [],
      communicationInterfaces: [],
      monitoringCapability: true,
      topology: "Transformerless",
      displayType: "LCD",
      active: true
    });
    setSelectedProtections([]);
    setSelectedCertifications([]);
    setSelectedCommunicationInterfaces([]);
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const handleProtectionToggle = (protection: string) => {
    if (selectedProtections.includes(protection)) {
      setSelectedProtections(selectedProtections.filter(p => p !== protection));
    } else {
      setSelectedProtections([...selectedProtections, protection]);
    }
  };

  const handleCertificationToggle = (cert: string) => {
    if (selectedCertifications.includes(cert)) {
      setSelectedCertifications(selectedCertifications.filter(c => c !== cert));
    } else {
      setSelectedCertifications([...selectedCertifications, cert]);
    }
  };

  const handleCommunicationToggle = (comm: string) => {
    if (selectedCommunicationInterfaces.includes(comm)) {
      setSelectedCommunicationInterfaces(selectedCommunicationInterfaces.filter(c => c !== comm));
    } else {
      setSelectedCommunicationInterfaces([...selectedCommunicationInterfaces, comm]);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-primary" />
                Gerenciador de Inversores
              </CardTitle>
              <CardDescription>
                Gerencie os inversores disponíveis para simulação
              </CardDescription>
            </div>
            <Button onClick={handleNewInverter}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Inversor
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando inversores...</p>
            </div>
          ) : inverters.length === 0 ? (
            <div className="text-center py-8 border rounded-lg">
              <Zap className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Nenhum inversor cadastrado</p>
              <Button onClick={handleNewInverter} variant="outline" className="mt-4">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Inversor
              </Button>
            </div>
          ) : (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Fabricante</TableHead>
                    <TableHead>Potência</TableHead>
                    <TableHead>Fases</TableHead>
                    <TableHead>Eficiência</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {inverters.map((inverter) => (
                    <TableRow key={inverter.id}>
                      <TableCell className="font-medium">{inverter.name}</TableCell>
                      <TableCell>{inverter.manufacturer}</TableCell>
                      <TableCell>{inverter.power}W</TableCell>
                      <TableCell>{inverter.phases === 1 ? "Monofásico" : "Trifásico"}</TableCell>
                      <TableCell>{inverter.maxEfficiency}%</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {inverter.datasheet && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => window.open(inverter.datasheet, '_blank')}
                              title="Ver datasheet"
                            >
                              <FileText className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEditInverter(inverter)}
                            title="Editar inversor"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteInverter(inverter.id!)}
                            title="Excluir inversor"
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
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Inversor" : "Novo Inversor"}</DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Atualize as informações do inversor" 
                : "Preencha as informações para adicionar um novo inversor"}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="dc">DC</TabsTrigger>
              <TabsTrigger value="ac">AC</TabsTrigger>
              <TabsTrigger value="physical">Físico</TabsTrigger>
              <TabsTrigger value="protections">Proteções</TabsTrigger>
              <TabsTrigger value="warranty">Garantias</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Inversor</Label>
                  <Input
                    id="name"
                    value={currentInverter.name}
                    onChange={(e) => setCurrentInverter({ ...currentInverter, name: e.target.value })}
                    placeholder="Ex: Fronius Primo 5.0-1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Fabricante</Label>
                  <Input
                    id="manufacturer"
                    value={currentInverter.manufacturer}
                    onChange={(e) => setCurrentInverter({ ...currentInverter, manufacturer: e.target.value })}
                    placeholder="Ex: Fronius"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Modelo</Label>
                  <Input
                    id="model"
                    value={currentInverter.model}
                    onChange={(e) => setCurrentInverter({ ...currentInverter, model: e.target.value })}
                    placeholder="Ex: Primo 5.0-1"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="power">Potência Nominal (W)</Label>
                  <Input
                    id="power"
                    type="number"
                    value={currentInverter.power}
                    onChange={(e) => setCurrentInverter({ ...currentInverter, power: Number(e.target.value) })}
                    placeholder="Ex: 5000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="topology">Topologia</Label>
                  <Select 
                    value={currentInverter.topology} 
                    onValueChange={(value) => setCurrentInverter({ ...currentInverter, topology: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a topologia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Transformerless">Transformerless</SelectItem>
                      <SelectItem value="HF Transformer">HF Transformer</SelectItem>
                      <SelectItem value="LF Transformer">LF Transformer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="displayType">Tipo de Display</Label>
                  <Select 
                    value={currentInverter.displayType} 
                    onValueChange={(value) => setCurrentInverter({ ...currentInverter, displayType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de display" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LCD">LCD</SelectItem>
                      <SelectItem value="LED">LED</SelectItem>
                      <SelectItem value="OLED">OLED</SelectItem>
                      <SelectItem value="Sem Display">Sem Display</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-medium">Eficiência</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="maxEfficiency">Eficiência Máxima (%)</Label>
                    <Input
                      id="maxEfficiency"
                      type="number"
                      step="0.1"
                      value={currentInverter.maxEfficiency}
                      onChange={(e) => setCurrentInverter({ ...currentInverter, maxEfficiency: Number(e.target.value) })}
                      placeholder="Ex: 97.5"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="europeanEfficiency">Eficiência Europeia (%)</Label>
                    <Input
                      id="europeanEfficiency"
                      type="number"
                      step="0.1"
                      value={currentInverter.europeanEfficiency}
                      onChange={(e) => setCurrentInverter({ ...currentInverter, europeanEfficiency: Number(e.target.value) })}
                      placeholder="Ex: 97.0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="mpptEfficiency">Eficiência MPPT (%)</Label>
                    <Input
                      id="mpptEfficiency"
                      type="number"
                      step="0.1"
                      value={currentInverter.mpptEfficiency}
                      onChange={(e) => setCurrentInverter({ ...currentInverter, mpptEfficiency: Number(e.target.value) })}
                      placeholder="Ex: 99.9"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>        
    <TabsContent value="dc" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="maxDcPower">Potência Máxima DC (W)</Label>
                  <Input
                    id="maxDcPower"
                    type="number"
                    value={currentInverter.maxDcPower}
                    onChange={(e) => setCurrentInverter({ ...currentInverter, maxDcPower: Number(e.target.value) })}
                    placeholder="Ex: 7500"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxDcVoltage">Tensão Máxima DC (V)</Label>
                  <Input
                    id="maxDcVoltage"
                    type="number"
                    value={currentInverter.maxDcVoltage}
                    onChange={(e) => setCurrentInverter({ ...currentInverter, maxDcVoltage: Number(e.target.value) })}
                    placeholder="Ex: 1000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="startupVoltage">Tensão de Partida (V)</Label>
                  <Input
                    id="startupVoltage"
                    type="number"
                    value={currentInverter.startupVoltage}
                    onChange={(e) => setCurrentInverter({ ...currentInverter, startupVoltage: Number(e.target.value) })}
                    placeholder="Ex: 80"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nominalDcVoltage">Tensão Nominal DC (V)</Label>
                  <Input
                    id="nominalDcVoltage"
                    type="number"
                    value={currentInverter.nominalDcVoltage}
                    onChange={(e) => setCurrentInverter({ ...currentInverter, nominalDcVoltage: Number(e.target.value) })}
                    placeholder="Ex: 580"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxDcCurrent">Corrente Máxima DC (A)</Label>
                  <Input
                    id="maxDcCurrent"
                    type="number"
                    step="0.1"
                    value={currentInverter.maxDcCurrent}
                    onChange={(e) => setCurrentInverter({ ...currentInverter, maxDcCurrent: Number(e.target.value) })}
                    placeholder="Ex: 12.9"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mpptChannels">Canais MPPT</Label>
                  <Input
                    id="mpptChannels"
                    type="number"
                    value={currentInverter.mpptChannels}
                    onChange={(e) => setCurrentInverter({ ...currentInverter, mpptChannels: Number(e.target.value) })}
                    placeholder="Ex: 2"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxInputsPerMppt">Máx. Entradas por MPPT</Label>
                  <Input
                    id="maxInputsPerMppt"
                    type="number"
                    value={currentInverter.maxInputsPerMppt}
                    onChange={(e) => setCurrentInverter({ ...currentInverter, maxInputsPerMppt: Number(e.target.value) })}
                    placeholder="Ex: 1"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="ac" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nominalAcPower">Potência Nominal AC (W)</Label>
                  <Input
                    id="nominalAcPower"
                    type="number"
                    value={currentInverter.nominalAcPower}
                    onChange={(e) => setCurrentInverter({ ...currentInverter, nominalAcPower: Number(e.target.value) })}
                    placeholder="Ex: 5000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxAcPower">Potência Máxima AC (W)</Label>
                  <Input
                    id="maxAcPower"
                    type="number"
                    value={currentInverter.maxAcPower}
                    onChange={(e) => setCurrentInverter({ ...currentInverter, maxAcPower: Number(e.target.value) })}
                    placeholder="Ex: 5000"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nominalAcVoltage">Tensão Nominal AC (V)</Label>
                  <Input
                    id="nominalAcVoltage"
                    type="number"
                    value={currentInverter.nominalAcVoltage}
                    onChange={(e) => setCurrentInverter({ ...currentInverter, nominalAcVoltage: Number(e.target.value) })}
                    placeholder="Ex: 220"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="acVoltageRange">Faixa de Tensão AC</Label>
                  <Input
                    id="acVoltageRange"
                    value={currentInverter.acVoltageRange}
                    onChange={(e) => setCurrentInverter({ ...currentInverter, acVoltageRange: e.target.value })}
                    placeholder="Ex: 180-264V"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nominalFrequency">Frequência Nominal (Hz)</Label>
                  <Input
                    id="nominalFrequency"
                    type="number"
                    value={currentInverter.nominalFrequency}
                    onChange={(e) => setCurrentInverter({ ...currentInverter, nominalFrequency: Number(e.target.value) })}
                    placeholder="Ex: 60"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="frequencyRange">Faixa de Frequência</Label>
                  <Input
                    id="frequencyRange"
                    value={currentInverter.frequencyRange}
                    onChange={(e) => setCurrentInverter({ ...currentInverter, frequencyRange: e.target.value })}
                    placeholder="Ex: 59.3-60.5Hz"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phases">Número de Fases</Label>
                  <Select 
                    value={currentInverter.phases.toString()} 
                    onValueChange={(value) => setCurrentInverter({ ...currentInverter, phases: Number(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o número de fases" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 (Monofásico)</SelectItem>
                      <SelectItem value="3">3 (Trifásico)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxAcCurrent">Corrente Máxima AC (A)</Label>
                  <Input
                    id="maxAcCurrent"
                    type="number"
                    step="0.1"
                    value={currentInverter.maxAcCurrent}
                    onChange={(e) => setCurrentInverter({ ...currentInverter, maxAcCurrent: Number(e.target.value) })}
                    placeholder="Ex: 22.7"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="powerFactor">Fator de Potência</Label>
                  <Input
                    id="powerFactor"
                    type="number"
                    step="0.01"
                    value={currentInverter.powerFactor}
                    onChange={(e) => setCurrentInverter({ ...currentInverter, powerFactor: Number(e.target.value) })}
                    placeholder="Ex: 0.99"
                  />
                </div>
              </div>
            </TabsContent>

            <TabsContent value="physical" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base font-medium">Dimensões</Label>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="length">Comprimento (mm)</Label>
                      <Input
                        id="length"
                        type="number"
                        value={currentInverter.dimensions.length}
                        onChange={(e) => setCurrentInverter({ 
                          ...currentInverter, 
                          dimensions: { ...currentInverter.dimensions, length: Number(e.target.value) }
                        })}
                        placeholder="Ex: 645"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="width">Largura (mm)</Label>
                      <Input
                        id="width"
                        type="number"
                        value={currentInverter.dimensions.width}
                        onChange={(e) => setCurrentInverter({ 
                          ...currentInverter, 
                          dimensions: { ...currentInverter.dimensions, width: Number(e.target.value) }
                        })}
                        placeholder="Ex: 431"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="height">Altura (mm)</Label>
                      <Input
                        id="height"
                        type="number"
                        value={currentInverter.dimensions.height}
                        onChange={(e) => setCurrentInverter({ 
                          ...currentInverter, 
                          dimensions: { ...currentInverter.dimensions, height: Number(e.target.value) }
                        })}
                        placeholder="Ex: 204"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="weight">Peso (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      step="0.1"
                      value={currentInverter.weight}
                      onChange={(e) => setCurrentInverter({ ...currentInverter, weight: Number(e.target.value) })}
                      placeholder="Ex: 22.0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="enclosureRating">Grau de Proteção</Label>
                    <Select 
                      value={currentInverter.enclosureRating} 
                      onValueChange={(value) => setCurrentInverter({ ...currentInverter, enclosureRating: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o grau de proteção" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="IP65">IP65</SelectItem>
                        <SelectItem value="IP54">IP54</SelectItem>
                        <SelectItem value="IP20">IP20</SelectItem>
                        <SelectItem value="NEMA 4X">NEMA 4X</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-base font-medium">Especificações Ambientais</Label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="operatingTemperature">Temperatura Operacional</Label>
                      <Input
                        id="operatingTemperature"
                        value={currentInverter.operatingTemperature}
                        onChange={(e) => setCurrentInverter({ ...currentInverter, operatingTemperature: e.target.value })}
                        placeholder="Ex: -25°C a +60°C"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="storageTemperature">Temperatura de Armazenamento</Label>
                      <Input
                        id="storageTemperature"
                        value={currentInverter.storageTemperature}
                        onChange={(e) => setCurrentInverter({ ...currentInverter, storageTemperature: e.target.value })}
                        placeholder="Ex: -40°C a +70°C"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="humidity">Umidade Relativa</Label>
                      <Input
                        id="humidity"
                        value={currentInverter.humidity}
                        onChange={(e) => setCurrentInverter({ ...currentInverter, humidity: e.target.value })}
                        placeholder="Ex: 0-95% (sem condensação)"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="altitude">Altitude Máxima (m)</Label>
                      <Input
                        id="altitude"
                        type="number"
                        value={currentInverter.altitude}
                        onChange={(e) => setCurrentInverter({ ...currentInverter, altitude: Number(e.target.value) })}
                        placeholder="Ex: 2000"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="coolingMethod">Método de Resfriamento</Label>
                      <Select 
                        value={currentInverter.coolingMethod} 
                        onValueChange={(value) => setCurrentInverter({ ...currentInverter, coolingMethod: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o método de resfriamento" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Convecção natural">Convecção Natural</SelectItem>
                          <SelectItem value="Ventilação forçada">Ventilação Forçada</SelectItem>
                          <SelectItem value="Líquido">Resfriamento Líquido</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="protections" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base font-medium">Proteções</Label>
                  <p className="text-sm text-muted-foreground">
                    Selecione as proteções que o inversor possui
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                    {availableProtections.map((protection) => (
                      <div key={protection} className="flex items-center space-x-2 border rounded-md p-3 hover:bg-muted/50 transition-colors">
                        <Checkbox 
                          id={`protection-${protection}`} 
                          checked={selectedProtections.includes(protection)}
                          onCheckedChange={() => handleProtectionToggle(protection)}
                        />
                        <Label htmlFor={`protection-${protection}`} className="text-sm">{protection}</Label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label className="text-base font-medium">Certificações</Label>
                  <p className="text-sm text-muted-foreground">
                    Selecione as certificações que o inversor possui
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                    {availableCertifications.map((cert) => (
                      <div key={cert} className="flex items-center space-x-2 border rounded-md p-3 hover:bg-muted/50 transition-colors">
                        <Checkbox 
                          id={`cert-${cert}`} 
                          checked={selectedCertifications.includes(cert)}
                          onCheckedChange={() => handleCertificationToggle(cert)}
                        />
                        <Label htmlFor={`cert-${cert}`} className="text-sm">{cert}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label className="text-base font-medium">Interfaces de Comunicação</Label>
                  <p className="text-sm text-muted-foreground">
                    Selecione as interfaces de comunicação disponíveis
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                    {availableCommunicationInterfaces.map((comm) => (
                      <div key={comm} className="flex items-center space-x-2 border rounded-md p-3 hover:bg-muted/50 transition-colors">
                        <Checkbox 
                          id={`comm-${comm}`} 
                          checked={selectedCommunicationInterfaces.includes(comm)}
                          onCheckedChange={() => handleCommunicationToggle(comm)}
                        />
                        <Label htmlFor={`comm-${comm}`} className="text-sm">{comm}</Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="monitoringCapability" 
                    checked={currentInverter.monitoringCapability}
                    onCheckedChange={(checked) => setCurrentInverter({ ...currentInverter, monitoringCapability: !!checked })}
                  />
                  <Label htmlFor="monitoringCapability">Capacidade de Monitoramento</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="warranty" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="productWarranty">Garantia do Produto (anos)</Label>
                  <Input
                    id="productWarranty"
                    type="number"
                    value={currentInverter.productWarranty}
                    onChange={(e) => setCurrentInverter({ ...currentInverter, productWarranty: Number(e.target.value) })}
                    placeholder="Ex: 10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="performanceWarranty">Garantia de Performance (anos)</Label>
                  <Input
                    id="performanceWarranty"
                    type="number"
                    value={currentInverter.performanceWarranty}
                    onChange={(e) => setCurrentInverter({ ...currentInverter, performanceWarranty: Number(e.target.value) })}
                    placeholder="Ex: 10"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="designLife">Vida Útil de Projeto (anos)</Label>
                  <Input
                    id="designLife"
                    type="number"
                    value={currentInverter.designLife}
                    onChange={(e) => setCurrentInverter({ ...currentInverter, designLife: Number(e.target.value) })}
                    placeholder="Ex: 20"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-medium">Datasheet PDF</Label>
                <FileUpload
                  bucketName="datasheets"
                  folderPath="inverters"
                  fileTypes={['application/pdf']}
                  maxSize={10}
                  currentFileUrl={currentInverter.datasheet || ""}
                  onUploadComplete={(url) => setCurrentInverter({ ...currentInverter, datasheet: url })}
                  onError={(error) => toast({
                    title: "Erro no Upload",
                    description: error,
                    variant: "destructive"
                  })}
                />
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveInverter}>
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? "Atualizar" : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}