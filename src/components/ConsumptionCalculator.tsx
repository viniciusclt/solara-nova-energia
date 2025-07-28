import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calculator, Plus, Trash2, AirVent, Refrigerator, Lightbulb, Car, Settings, ChefHat, Zap, Check, X, Edit } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Equipment {
  id: string;
  type: string;
  name: string;
  power: number; // Watts
  hoursPerDay: number;
  daysPerMonth: number;
  monthsPerYear: number;
  consumptionKwh: number;
}

interface ConsumptionCalculatorProps {
  currentLead: Record<string, unknown> | null;
}

export function ConsumptionCalculator({ currentLead }: ConsumptionCalculatorProps) {
  const { toast } = useToast();
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [showManageModal, setShowManageModal] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<Equipment | null>(null);
  const [editingPreset, setEditingPreset] = useState<{type: string, preset: any} | null>(null);
  const [newEquipmentType, setNewEquipmentType] = useState('');
  const [showAddTypeModal, setShowAddTypeModal] = useState(false);
  const [newEquipment, setNewEquipment] = useState({
    type: "",
    name: "",
    power: 0,
    hoursPerDay: 8,
    daysPerMonth: 30,
    monthsPerYear: 12
  });

  const equipmentTypes = [
    { 
      id: "ar-condicionado", 
      name: "Ar Condicionado", 
      icon: AirVent, 
      presets: [
        { name: "9.000 BTUs", power: 800 },
        { name: "12.000 BTUs", power: 1200 },
        { name: "18.000 BTUs", power: 1800 },
        { name: "24.000 BTUs", power: 2400 }
      ]
    },
    { 
      id: "geladeira", 
      name: "Geladeira/Freezer", 
      icon: Refrigerator, 
      presets: [
        { name: "Geladeira Comum", power: 350 },
        { name: "Geladeira Duplex", power: 450 },
        { name: "Freezer Horizontal", power: 200 }
      ]
    },
    { 
      id: "iluminacao", 
      name: "Iluminação", 
      icon: Lightbulb, 
      presets: [
        { name: "LED 9W", power: 9 },
        { name: "LED 12W", power: 12 },
        { name: "LED 18W", power: 18 }
      ]
    },
    { 
      id: "veiculo-eletrico", 
      name: "Veículo Elétrico", 
      icon: Car, 
      presets: [
        { name: "Carro Compacto", power: 3300 },
        { name: "SUV Elétrico", power: 7400 }
      ]
    },
    { 
      id: "airfryer", 
      name: "Air Fryer", 
      icon: ChefHat, 
      presets: [
        { name: "Air Fryer 3L", power: 1200 },
        { name: "Air Fryer 5L", power: 1500 },
        { name: "Air Fryer 7L", power: 1800 }
      ]
    },
    { 
      id: "fogao-inducao", 
      name: "Fogão de Indução", 
      icon: Zap, 
      presets: [
        { name: "Cooktop 1 Boca", power: 2000 },
        { name: "Cooktop 2 Bocas", power: 3500 },
        { name: "Fogão Indução 4 Bocas", power: 7000 }
      ]
    },
    { 
      id: "forno-eletrico", 
      name: "Forno Elétrico", 
      icon: ChefHat, 
      presets: [
        { name: "Forno Elétrico 30L", power: 1500 },
        { name: "Forno Elétrico 45L", power: 2200 },
        { name: "Forno Elétrico 60L", power: 3000 }
      ]
    }
  ];

  const calculateConsumption = (power: number, hoursPerDay: number, daysPerMonth: number, monthsPerYear: number) => {
    return (power * hoursPerDay * daysPerMonth * monthsPerYear) / 1000; // kWh/ano
  };

  const addEquipment = () => {
    if (!newEquipment.name || !newEquipment.power) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o nome e potência do equipamento",
        variant: "destructive"
      });
      return;
    }

    const consumption = calculateConsumption(
      newEquipment.power,
      newEquipment.hoursPerDay,
      newEquipment.daysPerMonth,
      newEquipment.monthsPerYear
    );

    const equipment: Equipment = {
      id: Date.now().toString(),
      type: newEquipment.type,
      name: newEquipment.name,
      power: newEquipment.power,
      hoursPerDay: newEquipment.hoursPerDay,
      daysPerMonth: newEquipment.daysPerMonth,
      monthsPerYear: newEquipment.monthsPerYear,
      consumptionKwh: consumption
    };

    setEquipments([...equipments, equipment]);
    setNewEquipment({
      type: "",
      name: "",
      power: 0,
      hoursPerDay: 8,
      daysPerMonth: 30,
      monthsPerYear: 12
    });

    toast({
      title: "Equipamento Adicionado",
      description: `${equipment.name} adicionado com sucesso!`
    });
  };

  const removeEquipment = (id: string) => {
    setEquipments(equipments.filter(eq => eq.id !== id));
    toast({
      title: "Equipamento Removido",
      description: "Equipamento removido com sucesso!"
    });
  };

  const startEditEquipment = (equipment: Equipment) => {
    setEditingEquipment(equipment);
    setNewEquipment({
      type: equipment.type,
      name: equipment.name,
      power: equipment.power,
      hoursPerDay: equipment.hoursPerDay,
      daysPerMonth: equipment.daysPerMonth,
      monthsPerYear: equipment.monthsPerYear
    });
  };

  const saveEditEquipment = () => {
    if (!editingEquipment || !newEquipment.name || !newEquipment.power) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o nome e potência do equipamento",
        variant: "destructive"
      });
      return;
    }

    const consumption = calculateConsumption(
      newEquipment.power,
      newEquipment.hoursPerDay,
      newEquipment.daysPerMonth,
      newEquipment.monthsPerYear
    );

    const updatedEquipment: Equipment = {
      ...editingEquipment,
      type: newEquipment.type,
      name: newEquipment.name,
      power: newEquipment.power,
      hoursPerDay: newEquipment.hoursPerDay,
      daysPerMonth: newEquipment.daysPerMonth,
      monthsPerYear: newEquipment.monthsPerYear,
      consumptionKwh: consumption
    };

    setEquipments(equipments.map(eq => eq.id === editingEquipment.id ? updatedEquipment : eq));
    setEditingEquipment(null);
    setNewEquipment({
      type: "",
      name: "",
      power: 0,
      hoursPerDay: 8,
      daysPerMonth: 30,
      monthsPerYear: 12
    });

    toast({
      title: "Equipamento Atualizado",
      description: `${updatedEquipment.name} atualizado com sucesso!`
    });
  };

  const cancelEdit = () => {
    setEditingEquipment(null);
    setNewEquipment({
      type: "",
      name: "",
      power: 0,
      hoursPerDay: 8,
      daysPerMonth: 30,
      monthsPerYear: 12
    });
  };

  const applyPreset = (preset: { name: string; power: number }) => {
    setNewEquipment(prev => ({
      ...prev,
      name: preset.name,
      power: preset.power
    }));
  };

  const addNewEquipmentType = () => {
    if (newEquipmentType.trim()) {
      const newType = {
        [newEquipmentType]: {
          icon: "⚡",
          presets: [
            {
              name: `${newEquipmentType} Padrão`,
              power: 100,
              hoursPerDay: 8,
              daysPerMonth: 30,
              monthsPerYear: 12
            }
          ]
        }
      };
      
      // Aqui você pode salvar no localStorage ou estado global
      Object.assign(equipmentTypes, newType);
      setNewEquipmentType('');
      setShowAddTypeModal(false);
      toast({
        title: "Tipo adicionado",
        description: `Tipo de equipamento "${newEquipmentType}" foi adicionado com sucesso.`
      });
    }
  };

  const editPreset = (type: string, presetIndex: number) => {
    const preset = equipmentTypes[type].presets[presetIndex];
    setEditingPreset({ type, preset: { ...preset, index: presetIndex } });
  };

  const savePreset = () => {
    if (editingPreset) {
      const { type, preset } = editingPreset;
      if (preset.index !== undefined) {
        // Editar preset existente
        equipmentTypes[type].presets[preset.index] = {
          name: preset.name,
          power: preset.power,
          hoursPerDay: preset.hoursPerDay,
          daysPerMonth: preset.daysPerMonth,
          monthsPerYear: preset.monthsPerYear
        };
      } else {
        // Adicionar novo preset
        equipmentTypes[type].presets.push({
          name: preset.name,
          power: preset.power,
          hoursPerDay: preset.hoursPerDay,
          daysPerMonth: preset.daysPerMonth,
          monthsPerYear: preset.monthsPerYear
        });
      }
      
      setEditingPreset(null);
      toast({
        title: "Preset salvo",
        description: "Preset foi salvo com sucesso."
      });
    }
  };

  const addNewPreset = (type: string) => {
    setEditingPreset({
      type,
      preset: {
        name: '',
        power: 100,
        hoursPerDay: 8,
        daysPerMonth: 30,
        monthsPerYear: 12
      }
    });
  };

  const deletePreset = (type: string, presetIndex: number) => {
    equipmentTypes[type].presets.splice(presetIndex, 1);
    toast({
      title: "Preset removido",
      description: "Preset foi removido com sucesso."
    });
  };

  const totalConsumptionIncrease = equipments.reduce((sum, eq) => sum + eq.consumptionKwh, 0);
  const monthlyIncrease = totalConsumptionIncrease / 12;
  const currentConsumption = currentLead?.consumoMedio || 0;
  const newTotalConsumption = currentConsumption + monthlyIncrease;
  const percentageIncrease = currentConsumption > 0 ? ((monthlyIncrease / currentConsumption) * 100) : 0;

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Calculadora de Incremento de Consumo
          </CardTitle>
          <CardDescription>
            Adicione equipamentos para calcular o aumento no consumo elétrico
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Resumo do Consumo Atual */}
      {currentLead && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Consumo Atual</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{currentConsumption}</div>
                <div className="text-sm text-muted-foreground">kWh/mês atual</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">{Math.round(monthlyIncrease)}</div>
                <div className="text-sm text-muted-foreground">kWh/mês incremento</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">{Math.round(newTotalConsumption)}</div>
                <div className="text-sm text-muted-foreground">kWh/mês novo total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-success">+{percentageIncrease.toFixed(1)}%</div>
                <div className="text-sm text-muted-foreground">Aumento percentual</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Adicionar Equipamento */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>{editingEquipment ? 'Editar Equipamento' : 'Adicionar Equipamento'}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="equipmentType">Tipo de Equipamento</Label>
              <Select value={newEquipment.type} onValueChange={(value) => setNewEquipment(prev => ({ ...prev, type: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {equipmentTypes.map(type => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Presets */}
            {newEquipment.type && (
              <div>
                <Label>Presets Comuns</Label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {equipmentTypes
                    .find(t => t.id === newEquipment.type)
                    ?.presets.map(preset => (
                      <Button
                        key={preset.name}
                        variant="outline"
                        size="sm"
                        onClick={() => applyPreset(preset)}
                        className="justify-start"
                      >
                        {preset.name}
                      </Button>
                    ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="equipmentName">Nome/Descrição</Label>
                <Input
                  id="equipmentName"
                  value={newEquipment.name}
                  onChange={(e) => setNewEquipment(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Ar Split Sala"
                />
              </div>
              <div>
                <Label htmlFor="equipmentPower">Potência (W)</Label>
                <Input
                  id="equipmentPower"
                  type="number"
                  value={newEquipment.power}
                  onChange={(e) => setNewEquipment(prev => ({ ...prev, power: Number(e.target.value) }))}
                  placeholder="1200"
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="hoursPerDay">Horas/Dia</Label>
                <Input
                  id="hoursPerDay"
                  type="number"
                  value={newEquipment.hoursPerDay}
                  onChange={(e) => setNewEquipment(prev => ({ ...prev, hoursPerDay: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="daysPerMonth">Dias/Mês</Label>
                <Input
                  id="daysPerMonth"
                  type="number"
                  value={newEquipment.daysPerMonth}
                  onChange={(e) => setNewEquipment(prev => ({ ...prev, daysPerMonth: Number(e.target.value) }))}
                />
              </div>
              <div>
                <Label htmlFor="monthsPerYear">Meses/Ano</Label>
                <Input
                  id="monthsPerYear"
                  type="number"
                  value={newEquipment.monthsPerYear}
                  onChange={(e) => setNewEquipment(prev => ({ ...prev, monthsPerYear: Number(e.target.value) }))}
                />
              </div>
            </div>

            <div className="bg-muted/50 p-3 rounded-lg">
              <div className="text-sm text-muted-foreground">Consumo estimado:</div>
              <div className="text-lg font-semibold text-primary">
                {calculateConsumption(
                  newEquipment.power,
                  newEquipment.hoursPerDay,
                  newEquipment.daysPerMonth,
                  newEquipment.monthsPerYear
                ).toFixed(1)} kWh/ano
              </div>
              <div className="text-sm text-muted-foreground">
                ({(calculateConsumption(
                  newEquipment.power,
                  newEquipment.hoursPerDay,
                  newEquipment.daysPerMonth,
                  newEquipment.monthsPerYear
                ) / 12).toFixed(1)} kWh/mês)
              </div>
            </div>

            {editingEquipment ? (
              <div className="flex gap-2">
                <Button onClick={saveEditEquipment} className="flex-1">
                  <Check className="h-4 w-4" />
                  Salvar Alterações
                </Button>
                <Button onClick={cancelEdit} variant="outline" className="flex-1">
                  <X className="h-4 w-4" />
                  Cancelar
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button onClick={addEquipment} className="flex-1">
                  <Plus className="h-4 w-4" />
                  Adicionar Equipamento
                </Button>
                <Dialog open={showManageModal} onOpenChange={setShowManageModal}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <Settings className="h-4 w-4 mr-2" />
                      Gerenciar
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                      <div className="flex items-center justify-between">
                        <div>
                          <DialogTitle>Gerenciar Tipos de Equipamentos</DialogTitle>
                          <DialogDescription>
                            Visualize, edite e gerencie todos os tipos de equipamento e seus presets
                          </DialogDescription>
                        </div>
                        <Button onClick={() => setShowAddTypeModal(true)} size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Novo Tipo
                        </Button>
                      </div>
                    </DialogHeader>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      {equipmentTypes.map(type => {
                        const IconComponent = type.icon;
                        return (
                          <Card key={type.id} className="p-4">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <IconComponent className="h-5 w-5 text-primary" />
                                <h3 className="font-semibold">{type.name}</h3>
                              </div>
                              <Button onClick={() => addNewPreset(type.id)} size="sm" variant="outline">
                                <Plus className="h-4 w-4 mr-2" />
                                Novo Preset
                              </Button>
                            </div>
                            <div className="space-y-2">
                              <p className="text-sm text-muted-foreground mb-2">Presets disponíveis:</p>
                              {type.presets.map((preset, index) => (
                                <div key={preset.name} className="bg-muted/50 rounded p-3 text-sm flex items-center justify-between">
                                  <div>
                                    <div className="font-medium">{preset.name}</div>
                                    <div className="text-muted-foreground mt-1">
                                      {preset.power}W
                                    </div>
                                  </div>
                                  <div className="flex gap-2">
                                    <Button onClick={() => editPreset(type.id, index)} size="sm" variant="ghost">
                                      <Edit className="h-4 w-4" />
                                    </Button>
                                    <Button onClick={() => deletePreset(type.id, index)} size="sm" variant="ghost" className="text-red-600 hover:text-red-700">
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                    <div className="flex justify-end mt-6">
                      <Button onClick={() => setShowManageModal(false)}>
                        Fechar
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Lista de Equipamentos */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Equipamentos Adicionados</CardTitle>
            <CardDescription>
              Total de incremento: {totalConsumptionIncrease.toFixed(1)} kWh/ano
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {equipments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum equipamento adicionado ainda
                </div>
              ) : (
                equipments.map(equipment => (
                  <div key={equipment.id} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{equipment.name}</h4>
                          <Badge variant="outline">{equipment.power}W</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {equipment.hoursPerDay}h/dia × {equipment.daysPerMonth}d/mês × {equipment.monthsPerYear}m/ano
                        </div>
                        <div className="text-sm font-medium text-primary mt-1">
                          {equipment.consumptionKwh.toFixed(1)} kWh/ano ({(equipment.consumptionKwh / 12).toFixed(1)} kWh/mês)
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditEquipment(equipment)}
                          className="text-muted-foreground hover:text-primary"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeEquipment(equipment.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {equipments.length > 0 && (
              <>
                <Separator className="my-4" />
                <div className="bg-gradient-card p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Resumo do Incremento</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Total anual:</span>
                      <div className="font-semibold text-primary">{totalConsumptionIncrease.toFixed(1)} kWh</div>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Total mensal:</span>
                      <div className="font-semibold text-primary">{monthlyIncrease.toFixed(1)} kWh</div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal para adicionar novo tipo de equipamento */}
      <Dialog open={showAddTypeModal} onOpenChange={setShowAddTypeModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adicionar Novo Tipo de Equipamento</DialogTitle>
            <DialogDescription>
              Crie um novo tipo de equipamento com preset padrão
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="newTypeName">Nome do Tipo</Label>
              <Input
                id="newTypeName"
                value={newEquipmentType}
                onChange={(e) => setNewEquipmentType(e.target.value)}
                placeholder="Ex: Ar Condicionado Split"
              />
            </div>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddTypeModal(false)}>
              Cancelar
            </Button>
            <Button onClick={addNewEquipmentType} disabled={!newEquipmentType.trim()}>
              Adicionar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal para editar preset */}
      <Dialog open={!!editingPreset} onOpenChange={() => setEditingPreset(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPreset?.preset.index !== undefined ? 'Editar Preset' : 'Novo Preset'}
            </DialogTitle>
            <DialogDescription>
              {editingPreset?.preset.index !== undefined 
                ? 'Modifique as configurações do preset'
                : 'Configure um novo preset para este tipo de equipamento'
              }
            </DialogDescription>
          </DialogHeader>
          
          {editingPreset && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="presetName">Nome do Preset</Label>
                <Input
                  id="presetName"
                  value={editingPreset.preset.name}
                  onChange={(e) => setEditingPreset({
                    ...editingPreset,
                    preset: { ...editingPreset.preset, name: e.target.value }
                  })}
                  placeholder="Ex: Modelo Econômico"
                />
              </div>
              
              <div>
                <Label htmlFor="presetPower">Potência (W)</Label>
                <Input
                  id="presetPower"
                  type="number"
                  value={editingPreset.preset.power}
                  onChange={(e) => setEditingPreset({
                    ...editingPreset,
                    preset: { ...editingPreset.preset, power: Number(e.target.value) }
                  })}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="presetHours">Horas por dia</Label>
                  <Input
                    id="presetHours"
                    type="number"
                    value={editingPreset.preset.hoursPerDay}
                    onChange={(e) => setEditingPreset({
                      ...editingPreset,
                      preset: { ...editingPreset.preset, hoursPerDay: Number(e.target.value) }
                    })}
                  />
                </div>
                
                <div>
                  <Label htmlFor="presetDays">Dias por mês</Label>
                  <Input
                    id="presetDays"
                    type="number"
                    value={editingPreset.preset.daysPerMonth}
                    onChange={(e) => setEditingPreset({
                      ...editingPreset,
                      preset: { ...editingPreset.preset, daysPerMonth: Number(e.target.value) }
                    })}
                  />
                </div>
              </div>
              
              <div>
                <Label htmlFor="presetMonths">Meses por ano</Label>
                <Input
                  id="presetMonths"
                  type="number"
                  value={editingPreset.preset.monthsPerYear}
                  onChange={(e) => setEditingPreset({
                    ...editingPreset,
                    preset: { ...editingPreset.preset, monthsPerYear: Number(e.target.value) }
                  })}
                />
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setEditingPreset(null)}>
              Cancelar
            </Button>
            <Button onClick={savePreset} disabled={!editingPreset?.preset.name.trim()}>
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}