import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calculator, Plus, Trash2, AirVent, Refrigerator, Lightbulb, Car, Settings, ChefHat, Zap } from "lucide-react";
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
  };

  const applyPreset = (preset: { name: string; power: number }) => {
    setNewEquipment(prev => ({
      ...prev,
      name: preset.name,
      power: preset.power
    }));
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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-primary" />
                Calculadora de Incremento de Consumo
              </CardTitle>
              <CardDescription>
                Adicione equipamentos para calcular o aumento no consumo elétrico
              </CardDescription>
            </div>
            <Dialog open={showManageModal} onOpenChange={setShowManageModal}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Gerenciar
                </Button>
              </DialogTrigger>
            </Dialog>
          </div>
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
              <CardTitle>Adicionar Equipamento</CardTitle>
              <Dialog open={showManageModal} onOpenChange={setShowManageModal}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Gerenciar
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Gerenciar Tipos de Equipamentos</DialogTitle>
                    <DialogDescription>
                      Visualize e gerencie os tipos de equipamentos disponíveis na calculadora
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    {equipmentTypes.map(type => {
                      const IconComponent = type.icon;
                      return (
                        <Card key={type.id} className="p-4">
                          <div className="flex items-center gap-3 mb-3">
                            <IconComponent className="h-5 w-5 text-primary" />
                            <h3 className="font-semibold">{type.name}</h3>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm text-muted-foreground mb-2">Presets disponíveis:</p>
                            {type.presets.map(preset => (
                              <div key={preset.name} className="flex justify-between items-center text-sm">
                                <span>{preset.name}</span>
                                <Badge variant="outline">{preset.power}W</Badge>
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

            <Button onClick={addEquipment} className="w-full">
              <Plus className="h-4 w-4" />
              Adicionar Equipamento
            </Button>
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
    </div>
  );
}