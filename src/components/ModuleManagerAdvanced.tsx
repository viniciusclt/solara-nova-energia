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
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Edit, Trash2, Save, X, FileText, Sun, Zap, Ruler, Scale, Shield, Tag, FileUp, Upload, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { SolarModule } from "@/types";
import { FileUpload } from "@/components/ui/file-upload";
import { DemoDataService } from "@/services/DemoDataService";
import DatasheetAnalyzer from "@/components/DatasheetAnalyzer";

export function ModuleManagerAdvanced() {
  const { toast } = useToast();
  const [modules, setModules] = useState<SolarModule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTechnologies, setSelectedTechnologies] = useState<string[]>([]);
  const [selectedCertifications, setSelectedCertifications] = useState<string[]>([]);
  const [performanceWarranties, setPerformanceWarranties] = useState<{years: number, percentage: number}[]>([
    { years: 25, percentage: 80 }
  ]);
  const [activeTab, setActiveTab] = useState('modules');

  const [currentModule, setCurrentModule] = useState<SolarModule>({
    name: "",
    manufacturer: "",
    model: "",
    power: 0,
    voc: 0,
    isc: 0,
    vmp: 0,
    imp: 0,
    efficiency: 0,
    tempCoeffPmax: -0.35,
    tempCoeffVoc: -0.27,
    tempCoeffIsc: 0.04,
    length: 0,
    width: 0,
    thickness: 0,
    weight: 0,
    area: 0,
    cellType: "Mono PERC",
    cellCount: 144,
    technology: [],
    productWarranty: 12,
    performanceWarranty: [{ years: 25, percentage: 80 }],
    certifications: [],
    active: true
  });

  const availableTechnologies = [
    "Mono PERC", "Bifacial", "Half-cell", "Multi-busbar", "Shingled", "TOPCon", "HJT", "IBC"
  ];

  const availableCertifications = [
    "IEC 61215", "IEC 61730", "UL 1703", "MCS", "CEC", "INMETRO", "PID Free", "Salt Mist", "Ammonia", "Fire Class 1"
  ];

  useEffect(() => {
    fetchModules();
  }, []);

  const fetchModules = async () => {
    setIsLoading(true);
    try {
      const demoDataService = DemoDataService.getInstance();
      
      if (demoDataService.shouldUseDemoData()) {
        // Usar dados de demonstração em localhost
        const demoModules = demoDataService.getModules();
        setModules(demoModules);
      } else {
        // Usar dados do Supabase em produção
        const { data, error } = await supabase
          .from('modules' as never)
          .select('*')
          .order('name');

        if (error) throw error;
        setModules(((data as unknown) as SolarModule[]) || []);
      }
    } catch (error) {
      console.error('Error fetching modules:', error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os módulos",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveModule = async () => {
    try {
      // Calcular a área automaticamente
      const area = (currentModule.length * currentModule.width) / 1000000; // mm² para m²
      
      // Preparar o módulo com os dados atualizados
      const moduleToSave: SolarModule = {
        ...currentModule,
        area,
        technology: selectedTechnologies,
        certifications: selectedCertifications,
        performanceWarranty: performanceWarranties
      };

      let result;
      
      if (isEditing && currentModule.id) {
        // Atualizar módulo existente
        result = await supabase
          .from('modules' as never)
          .update(moduleToSave as any)
          .eq('id', currentModule.id);
      } else {
        // Criar novo módulo
        result = await supabase
          .from('modules' as never)
          .insert(moduleToSave as any);
      }

      if (result.error) throw result.error;

      toast({
        title: isEditing ? "Módulo Atualizado" : "Módulo Criado",
        description: `${moduleToSave.name} foi ${isEditing ? 'atualizado' : 'adicionado'} com sucesso`,
      });

      setIsDialogOpen(false);
      fetchModules();
    } catch (error) {
      console.error('Error saving module:', error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o módulo",
        variant: "destructive"
      });
    }
  };

  const handleDeleteModule = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir este módulo?")) return;

    try {
      const { error } = await supabase
        .from('modules' as never)
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Módulo Excluído",
        description: "O módulo foi excluído com sucesso",
      });

      fetchModules();
    } catch (error) {
      console.error('Error deleting module:', error);
      toast({
        title: "Erro",
        description: "Não foi possível excluir o módulo",
        variant: "destructive"
      });
    }
  };

  const handleEditModule = (module: SolarModule) => {
    setCurrentModule(module);
    setSelectedTechnologies(module.technology || []);
    setSelectedCertifications(module.certifications || []);
    setPerformanceWarranties(module.performanceWarranty || [{ years: 25, percentage: 80 }]);
    setIsEditing(true);
    setIsDialogOpen(true);
  };

  const handleNewModule = () => {
    setCurrentModule({
      name: "",
      manufacturer: "",
      model: "",
      power: 0,
      voc: 0,
      isc: 0,
      vmp: 0,
      imp: 0,
      efficiency: 0,
      tempCoeffPmax: -0.35,
      tempCoeffVoc: -0.27,
      tempCoeffIsc: 0.04,
      length: 0,
      width: 0,
      thickness: 0,
      weight: 0,
      area: 0,
      cellType: "Mono PERC",
      cellCount: 144,
      technology: [],
      productWarranty: 12,
      performanceWarranty: [{ years: 25, percentage: 80 }],
      certifications: [],
      active: true
    });
    setSelectedTechnologies([]);
    setSelectedCertifications([]);
    setPerformanceWarranties([{ years: 25, percentage: 80 }]);
    setIsEditing(false);
    setIsDialogOpen(true);
  };

  const handleTechnologyToggle = (tech: string) => {
    if (selectedTechnologies.includes(tech)) {
      setSelectedTechnologies(selectedTechnologies.filter(t => t !== tech));
    } else {
      setSelectedTechnologies([...selectedTechnologies, tech]);
    }
  };

  const handleCertificationToggle = (cert: string) => {
    if (selectedCertifications.includes(cert)) {
      setSelectedCertifications(selectedCertifications.filter(c => c !== cert));
    } else {
      setSelectedCertifications([...selectedCertifications, cert]);
    }
  };

  const addPerformanceWarranty = () => {
    setPerformanceWarranties([...performanceWarranties, { years: 0, percentage: 0 }]);
  };

  const removePerformanceWarranty = (index: number) => {
    setPerformanceWarranties(performanceWarranties.filter((_, i) => i !== index));
  };

  const updatePerformanceWarranty = (index: number, field: 'years' | 'percentage', value: number) => {
    const updated = [...performanceWarranties];
    updated[index][field] = value;
    setPerformanceWarranties(updated);
  };

  const handleProductsExtracted = async (extractedProducts: any[]) => {
    const moduleProducts = extractedProducts.filter(p => p.equipmentType === 'module');
    
    if (moduleProducts.length === 0) {
      toast({
        title: "Nenhum módulo encontrado",
        description: "Os arquivos processados não contêm dados de módulos solares",
        variant: "destructive"
      });
      return;
    }

    // Converter produtos extraídos em módulos
    const convertedModules = moduleProducts.map(product => {
      const data = product.data;
      
      return {
        name: data.nome || data.modelo || 'Módulo Importado',
        manufacturer: data.fabricante || 'Fabricante não informado',
        model: data.modelo || data.nome || '',
        power: parseFloat(data.potencia?.replace(/[^0-9.]/g, '') || '0'),
        voc: parseFloat(data.tensaoVoc?.replace(/[^0-9.]/g, '') || '0'),
        isc: parseFloat(data.correnteIsc?.replace(/[^0-9.]/g, '') || '0'),
        vmp: parseFloat(data.tensaoVmp?.replace(/[^0-9.]/g, '') || '0'),
        imp: parseFloat(data.correnteImp?.replace(/[^0-9.]/g, '') || '0'),
        efficiency: parseFloat(data.eficiencia?.replace(/[^0-9.]/g, '') || '0'),
        tempCoeffPmax: -0.35, // Valor padrão
        tempCoeffVoc: -0.27,  // Valor padrão
        tempCoeffIsc: 0.04,   // Valor padrão
        length: data.dimensoes?.comprimento ? parseFloat(data.dimensoes.comprimento.replace(/[^0-9.]/g, '') || '0') : 0,
        width: data.dimensoes?.largura ? parseFloat(data.dimensoes.largura.replace(/[^0-9.]/g, '') || '0') : 0,
        thickness: data.dimensoes?.espessura ? parseFloat(data.dimensoes.espessura.replace(/[^0-9.]/g, '') || '0') : 0,
        weight: parseFloat(data.peso?.replace(/[^0-9.]/g, '') || '0'),
        area: 0, // Será calculado automaticamente
        cellType: data.tecnologia || 'Mono PERC',
        cellCount: 144, // Valor padrão
        technology: data.tecnologia ? [data.tecnologia] : [],
        productWarranty: parseInt(data.garantiasProduto?.replace(/[^0-9]/g, '') || '12'),
        performanceWarranty: [{ 
          years: parseInt(data.garantiasPerformance?.replace(/[^0-9]/g, '') || '25'), 
          percentage: 80 
        }],
        certifications: data.certificacoes || [],
        active: true,
        datasheet: product.sourceFile, // Referência ao arquivo original
        ocrData: {
          confidence: product.confidence,
          extractedAt: new Date().toISOString(),
          rawData: data
        }
      };
    });

    // Salvar módulos no banco de dados
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      const modulesToInsert = convertedModules.map(module => ({
        ...module,
        empresa_id: user.id,
        area: (module.length * module.width) / 1000000, // mm² para m²
        created_at: new Date().toISOString()
      }));

      const { error } = await supabase
        .from('modulos_solares')
        .insert(modulesToInsert);

      if (error) throw error;

      toast({
        title: "Módulos importados",
        description: `${convertedModules.length} módulos foram importados com sucesso`
      });

      // Atualizar lista de módulos
      fetchModules();
      setActiveTab('modules');

    } catch (error: any) {
      console.error('Erro ao salvar módulos:', error);
      toast({
        title: "Erro ao importar",
        description: error.message,
        variant: "destructive"
      });
    }
  };
  
  const getCertificationDescription = (cert: string): string => {
    const descriptions: Record<string, string> = {
      "IEC 61215": "Padrão internacional para qualificação de módulos fotovoltaicos",
      "IEC 61730": "Padrão de segurança para módulos fotovoltaicos",
      "UL 1703": "Padrão de segurança para módulos nos EUA",
      "MCS": "Certificação para o mercado do Reino Unido",
      "CEC": "Certificação para o mercado australiano",
      "INMETRO": "Certificação brasileira de qualidade",
      "PID Free": "Resistente à degradação induzida por potencial",
      "Salt Mist": "Resistente à corrosão por névoa salina",
      "Ammonia": "Resistente à corrosão por amônia",
      "Fire Class 1": "Classificação de resistência ao fogo"
    };
    
    return descriptions[cert] || "Certificação de qualidade e segurança";
  };
  
  const getTechnologyDescription = (tech: string): string => {
    const descriptions: Record<string, string> = {
      "Mono PERC": "Células monocristalinas com camada refletora traseira",
      "Bifacial": "Captação de luz em ambos os lados do módulo",
      "Half-cell": "Células divididas para reduzir perdas resistivas",
      "Multi-busbar": "Múltiplas barras coletoras para melhor eficiência",
      "Shingled": "Células sobrepostas para maior densidade de potência",
      "TOPCon": "Tecnologia de contato passivado com óxido fino",
      "HJT": "Heterojunção com camadas de silício amorfo e cristalino",
      "IBC": "Contatos traseiros interdigitados para maior eficiência"
    };
    
    return descriptions[tech] || "Tecnologia avançada de células solares";
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sun className="h-5 w-5 text-primary" />
                Gerenciador de Módulos Solares
              </CardTitle>
              <CardDescription>
                Gerencie os módulos fotovoltaicos disponíveis para simulação
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={() => setActiveTab('import')}
                variant="outline"
              >
                <Upload className="h-4 w-4 mr-2" />
                Importar PDF
              </Button>
              <Button onClick={handleNewModule}>
                <Plus className="h-4 w-4 mr-2" />
                Novo Módulo
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="modules">Módulos Cadastrados</TabsTrigger>
              <TabsTrigger value="import">Importar Datasheets</TabsTrigger>
            </TabsList>
            
            <TabsContent value="modules" className="mt-6">
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Carregando módulos...</p>
                </div>
              ) : modules.length === 0 ? (
                <div className="text-center py-8 border rounded-lg">
                  <Sun className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <p className="text-muted-foreground">Nenhum módulo cadastrado</p>
                  <Button onClick={handleNewModule} variant="outline" className="mt-4">
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Módulo
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
                        <TableHead>Tecnologia</TableHead>
                        <TableHead>Eficiência</TableHead>
                        <TableHead>Ações</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {modules.map((module) => (
                        <TableRow key={module.id}>
                          <TableCell className="font-medium">{module.name}</TableCell>
                          <TableCell>{module.manufacturer}</TableCell>
                          <TableCell>{module.power}W</TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {module.technology?.map((tech) => (
                                <Badge key={tech} variant="outline" className="text-xs">
                                  {tech}
                                </Badge>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell>{module.efficiency}%</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {module.datasheet && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => window.open(module.datasheet, '_blank')}
                                  title="Ver datasheet"
                                >
                                  <FileText className="h-4 w-4" />
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEditModule(module)}
                                title="Editar módulo"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleDeleteModule(module.id!)}
                                title="Excluir módulo"
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
            </TabsContent>
            
            <TabsContent value="import" className="mt-6">
              <DatasheetAnalyzer 
                onProductsExtracted={handleProductsExtracted}
                equipmentTypes={['module']}
              />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Editar Módulo" : "Novo Módulo"}</DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Atualize as informações do módulo solar" 
                : "Preencha as informações para adicionar um novo módulo solar"}
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="basic">Básico</TabsTrigger>
              <TabsTrigger value="electrical">Elétrico</TabsTrigger>
              <TabsTrigger value="physical">Físico</TabsTrigger>
              <TabsTrigger value="warranty">Garantias</TabsTrigger>
              <TabsTrigger value="certifications">Certificações</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Módulo</Label>
                  <Input
                    id="name"
                    value={currentModule.name}
                    onChange={(e) => setCurrentModule({ ...currentModule, name: e.target.value })}
                    placeholder="Ex: ASTRONERGY ASTRO 6 600W"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Fabricante</Label>
                  <Input
                    id="manufacturer"
                    value={currentModule.manufacturer}
                    onChange={(e) => setCurrentModule({ ...currentModule, manufacturer: e.target.value })}
                    placeholder="Ex: ASTRONERGY"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="model">Modelo</Label>
                  <Input
                    id="model"
                    value={currentModule.model}
                    onChange={(e) => setCurrentModule({ ...currentModule, model: e.target.value })}
                    placeholder="Ex: ASTRO 6 600W"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="power">Potência (W)</Label>
                  <Input
                    id="power"
                    type="number"
                    value={currentModule.power}
                    onChange={(e) => setCurrentModule({ ...currentModule, power: Number(e.target.value) })}
                    placeholder="Ex: 600"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cellType">Tipo de Célula</Label>
                  <Select 
                    value={currentModule.cellType} 
                    onValueChange={(value) => setCurrentModule({ ...currentModule, cellType: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de célula" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Mono PERC">Mono PERC</SelectItem>
                      <SelectItem value="Poly">Policristalino</SelectItem>
                      <SelectItem value="Mono">Monocristalino</SelectItem>
                      <SelectItem value="Thin Film">Filme Fino</SelectItem>
                      <SelectItem value="HJT">HJT (Heterojunction)</SelectItem>
                      <SelectItem value="TOPCon">TOPCon</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="cellCount">Número de Células</Label>
                  <Input
                    id="cellCount"
                    type="number"
                    value={currentModule.cellCount}
                    onChange={(e) => setCurrentModule({ ...currentModule, cellCount: Number(e.target.value) })}
                    placeholder="Ex: 144"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Tecnologias</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {availableTechnologies.map((tech) => (
                    <div key={tech} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`tech-${tech}`} 
                        checked={selectedTechnologies.includes(tech)}
                        onCheckedChange={() => handleTechnologyToggle(tech)}
                      />
                      <Label htmlFor={`tech-${tech}`} className="text-sm">{tech}</Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Certificações</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {availableCertifications.map((cert) => (
                    <div key={cert} className="flex items-center space-x-2">
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
            </TabsContent>

            <TabsContent value="electrical" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="voc">Tensão de Circuito Aberto - Voc (V)</Label>
                  <Input
                    id="voc"
                    type="number"
                    step="0.01"
                    value={currentModule.voc}
                    onChange={(e) => setCurrentModule({ ...currentModule, voc: Number(e.target.value) })}
                    placeholder="Ex: 41.5"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="isc">Corrente de Curto-Circuito - Isc (A)</Label>
                  <Input
                    id="isc"
                    type="number"
                    step="0.01"
                    value={currentModule.isc}
                    onChange={(e) => setCurrentModule({ ...currentModule, isc: Number(e.target.value) })}
                    placeholder="Ex: 18.35"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="vmp">Tensão de Máxima Potência - Vmp (V)</Label>
                  <Input
                    id="vmp"
                    type="number"
                    step="0.01"
                    value={currentModule.vmp}
                    onChange={(e) => setCurrentModule({ ...currentModule, vmp: Number(e.target.value) })}
                    placeholder="Ex: 34.8"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imp">Corrente de Máxima Potência - Imp (A)</Label>
                  <Input
                    id="imp"
                    type="number"
                    step="0.01"
                    value={currentModule.imp}
                    onChange={(e) => setCurrentModule({ ...currentModule, imp: Number(e.target.value) })}
                    placeholder="Ex: 17.25"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="efficiency">Eficiência (%)</Label>
                  <Input
                    id="efficiency"
                    type="number"
                    step="0.01"
                    value={currentModule.efficiency}
                    onChange={(e) => setCurrentModule({ ...currentModule, efficiency: Number(e.target.value) })}
                    placeholder="Ex: 21.3"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label className="text-base font-medium">Coeficientes de Temperatura</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="tempCoeffPmax">Pmax (%/°C)</Label>
                    <Input
                      id="tempCoeffPmax"
                      type="number"
                      step="0.01"
                      value={currentModule.tempCoeffPmax}
                      onChange={(e) => setCurrentModule({ ...currentModule, tempCoeffPmax: Number(e.target.value) })}
                      placeholder="Ex: -0.35"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tempCoeffVoc">Voc (%/°C)</Label>
                    <Input
                      id="tempCoeffVoc"
                      type="number"
                      step="0.01"
                      value={currentModule.tempCoeffVoc}
                      onChange={(e) => setCurrentModule({ ...currentModule, tempCoeffVoc: Number(e.target.value) })}
                      placeholder="Ex: -0.27"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="tempCoeffIsc">Isc (%/°C)</Label>
                    <Input
                      id="tempCoeffIsc"
                      type="number"
                      step="0.01"
                      value={currentModule.tempCoeffIsc}
                      onChange={(e) => setCurrentModule({ ...currentModule, tempCoeffIsc: Number(e.target.value) })}
                      placeholder="Ex: 0.04"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="physical" className="space-y-4 mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="length">Comprimento (mm)</Label>
                  <Input
                    id="length"
                    type="number"
                    value={currentModule.length}
                    onChange={(e) => setCurrentModule({ ...currentModule, length: Number(e.target.value) })}
                    placeholder="Ex: 2384"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="width">Largura (mm)</Label>
                  <Input
                    id="width"
                    type="number"
                    value={currentModule.width}
                    onChange={(e) => setCurrentModule({ ...currentModule, width: Number(e.target.value) })}
                    placeholder="Ex: 1134"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="thickness">Espessura (mm)</Label>
                  <Input
                    id="thickness"
                    type="number"
                    step="0.1"
                    value={currentModule.thickness}
                    onChange={(e) => setCurrentModule({ ...currentModule, thickness: Number(e.target.value) })}
                    placeholder="Ex: 35"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="weight">Peso (kg)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    value={currentModule.weight}
                    onChange={(e) => setCurrentModule({ ...currentModule, weight: Number(e.target.value) })}
                    placeholder="Ex: 32.6"
                  />
                </div>
              </div>

              <div className="bg-muted/50 p-3 rounded-lg">
                <div className="text-sm font-medium">Área Calculada</div>
                <div className="text-xl font-bold text-primary">
                  {((currentModule.length * currentModule.width) / 1000000).toFixed(2)} m²
                </div>
                <div className="text-xs text-muted-foreground">
                  Calculada automaticamente com base nas dimensões
                </div>
              </div>
            </TabsContent>

            <TabsContent value="warranty" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="productWarranty">Garantia do Produto (anos)</Label>
                <Input
                  id="productWarranty"
                  type="number"
                  value={currentModule.productWarranty}
                  onChange={(e) => setCurrentModule({ ...currentModule, productWarranty: Number(e.target.value) })}
                  placeholder="Ex: 12"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-base font-medium">Garantia de Performance</Label>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={addPerformanceWarranty}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Adicionar Etapa
                  </Button>
                </div>
                
                <div className="space-y-2">
                  {performanceWarranties.map((warranty, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={warranty.years}
                        onChange={(e) => updatePerformanceWarranty(index, 'years', Number(e.target.value))}
                        placeholder="Anos"
                        className="w-24"
                      />
                      <span>anos a</span>
                      <Input
                        type="number"
                        value={warranty.percentage}
                        onChange={(e) => updatePerformanceWarranty(index, 'percentage', Number(e.target.value))}
                        placeholder="%"
                        className="w-24"
                      />
                      <span>%</span>
                      {performanceWarranties.length > 1 && (
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => removePerformanceWarranty(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-base font-medium">Datasheet PDF</Label>
                <FileUpload
                  bucketName="datasheets"
                  folderPath="modules"
                  fileTypes={['application/pdf']}
                  maxSize={10}
                  currentFileUrl={currentModule.datasheet || ""}
                  onUploadComplete={(url) => setCurrentModule({ ...currentModule, datasheet: url })}
                  onError={(error) => toast({
                    title: "Erro no Upload",
                    description: error,
                    variant: "destructive"
                  })}
                />
              </div>
            </TabsContent>
            
            <TabsContent value="certifications" className="space-y-4 mt-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-base font-medium">Certificações</Label>
                  <p className="text-sm text-muted-foreground">
                    Selecione as certificações que o módulo possui
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                    {availableCertifications.map((cert) => (
                      <div key={cert} className="flex items-center space-x-2 border rounded-md p-3 hover:bg-muted/50 transition-colors">
                        <Checkbox 
                          id={`cert-detail-${cert}`} 
                          checked={selectedCertifications.includes(cert)}
                          onCheckedChange={() => handleCertificationToggle(cert)}
                        />
                        <div>
                          <Label htmlFor={`cert-detail-${cert}`} className="font-medium">{cert}</Label>
                          <p className="text-xs text-muted-foreground">
                            {getCertificationDescription(cert)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Separator />
                
                <div className="space-y-2">
                  <Label className="text-base font-medium">Tecnologias Avançadas</Label>
                  <p className="text-sm text-muted-foreground">
                    Selecione as tecnologias avançadas que o módulo utiliza
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
                    {availableTechnologies.map((tech) => (
                      <div key={tech} className="flex items-center space-x-2 border rounded-md p-3 hover:bg-muted/50 transition-colors">
                        <Checkbox 
                          id={`tech-detail-${tech}`} 
                          checked={selectedTechnologies.includes(tech)}
                          onCheckedChange={() => handleTechnologyToggle(tech)}
                        />
                        <div>
                          <Label htmlFor={`tech-detail-${tech}`} className="font-medium">{tech}</Label>
                          <p className="text-xs text-muted-foreground">
                            {getTechnologyDescription(tech)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSaveModule}>
              <Save className="h-4 w-4 mr-2" />
              {isEditing ? "Atualizar" : "Salvar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}