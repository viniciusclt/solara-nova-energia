import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Plus,
  Settings,
  Trash2,
  Zap,
  Calculator,
  Info
} from 'lucide-react';

interface Equipment {
  id: string;
  type: string;
  name: string;
  power: number;
  hoursPerDay: number;
  daysPerMonth: number;
  monthsPerYear: number;
  consumptionKwhMonth: number;
  consumptionKwhYear: number;
}

interface SystemConfig {
  systemType: string;
  installationType: string;
}

interface EquipmentConfigurationProps {
  onEquipmentChange?: (equipment: Equipment[], totalConsumption: { monthly: number; yearly: number }) => void;
}

const equipmentTypes = [
  'Ar Condicionado',
  'Geladeira',
  'Chuveiro Elétrico',
  'Televisão',
  'Computador',
  'Lâmpadas LED',
  'Micro-ondas',
  'Máquina de Lavar',
  'Bomba d\'água',
  'Outros'
];

const systemTypes = [
  'Residencial',
  'Comercial',
  'Industrial',
  'Rural'
];

const installationTypes = [
  'Telhado',
  'Solo',
  'Carport',
  'Fachada'
];

export function EquipmentConfiguration({ onEquipmentChange }: EquipmentConfigurationProps) {
  const [equipmentList, setEquipmentList] = useState<Equipment[]>([]);
  const [systemConfig, setSystemConfig] = useState<SystemConfig>({
    systemType: '',
    installationType: ''
  });
  
  const [currentEquipment, setCurrentEquipment] = useState({
    type: '',
    name: '',
    power: 0,
    hoursPerDay: 0,
    daysPerMonth: 0,
    monthsPerYear: 0
  });

  const calculateConsumption = (power: number, hoursPerDay: number, daysPerMonth: number, monthsPerYear: number) => {
    const monthlyConsumption = (power * hoursPerDay * daysPerMonth) / 1000; // kWh/mês
    const yearlyConsumption = monthlyConsumption * monthsPerYear; // kWh/ano
    return {
      monthly: Math.round(monthlyConsumption * 100) / 100,
      yearly: Math.round(yearlyConsumption * 100) / 100
    };
  };

  const addEquipment = () => {
    if (!currentEquipment.type || !currentEquipment.name || currentEquipment.power <= 0) {
      return;
    }

    const consumption = calculateConsumption(
      currentEquipment.power,
      currentEquipment.hoursPerDay,
      currentEquipment.daysPerMonth,
      currentEquipment.monthsPerYear
    );

    const newEquipment: Equipment = {
      id: Date.now().toString(),
      type: currentEquipment.type,
      name: currentEquipment.name,
      power: currentEquipment.power,
      hoursPerDay: currentEquipment.hoursPerDay,
      daysPerMonth: currentEquipment.daysPerMonth,
      monthsPerYear: currentEquipment.monthsPerYear,
      consumptionKwhMonth: consumption.monthly,
      consumptionKwhYear: consumption.yearly
    };

    const updatedList = [...equipmentList, newEquipment];
    setEquipmentList(updatedList);
    
    // Reset form
    setCurrentEquipment({
      type: '',
      name: '',
      power: 0,
      hoursPerDay: 0,
      daysPerMonth: 0,
      monthsPerYear: 0
    });

    // Calculate totals and notify parent
    const totalMonthly = updatedList.reduce((sum, eq) => sum + eq.consumptionKwhMonth, 0);
    const totalYearly = updatedList.reduce((sum, eq) => sum + eq.consumptionKwhYear, 0);
    
    onEquipmentChange?.(updatedList, {
      monthly: Math.round(totalMonthly * 100) / 100,
      yearly: Math.round(totalYearly * 100) / 100
    });
  };

  const removeEquipment = (id: string) => {
    const updatedList = equipmentList.filter(eq => eq.id !== id);
    setEquipmentList(updatedList);
    
    // Calculate totals and notify parent
    const totalMonthly = updatedList.reduce((sum, eq) => sum + eq.consumptionKwhMonth, 0);
    const totalYearly = updatedList.reduce((sum, eq) => sum + eq.consumptionKwhYear, 0);
    
    onEquipmentChange?.(updatedList, {
      monthly: Math.round(totalMonthly * 100) / 100,
      yearly: Math.round(totalYearly * 100) / 100
    });
  };

  const currentConsumption = calculateConsumption(
    currentEquipment.power,
    currentEquipment.hoursPerDay,
    currentEquipment.daysPerMonth,
    currentEquipment.monthsPerYear
  );

  const totalConsumption = {
    monthly: equipmentList.reduce((sum, eq) => sum + eq.consumptionKwhMonth, 0),
    yearly: equipmentList.reduce((sum, eq) => sum + eq.consumptionKwhYear, 0)
  };

  return (
    <div className="space-y-6">
      {/* Calculadora de Incremento de Consumo - Header */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Calculadora de Incremento de Consumo
          </CardTitle>
          <p className="text-muted-foreground">
            Adicione equipamentos para calcular o aumento no consumo elétrico
          </p>
        </CardHeader>
      </Card>

      {/* Configuração de Equipamentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Adicionar Equipamento
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Configure os equipamentos do sistema
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Formulário de Equipamento */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Equipamento</Label>
              <Select
                value={currentEquipment.type}
                onValueChange={(value) => setCurrentEquipment(prev => ({ ...prev, type: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  {equipmentTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Nome/Descrição</Label>
              <Input
                placeholder="Ex: Ar Split Sala"
                value={currentEquipment.name}
                onChange={(e) => setCurrentEquipment(prev => ({ ...prev, name: e.target.value }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Potência (W)</Label>
              <Input
                type="number"
                placeholder="1500"
                value={currentEquipment.power || ''}
                onChange={(e) => setCurrentEquipment(prev => ({ ...prev, power: parseInt(e.target.value) || 0 }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Horas/Dia</Label>
              <Input
                type="number"
                placeholder="8"
                value={currentEquipment.hoursPerDay || ''}
                onChange={(e) => setCurrentEquipment(prev => ({ ...prev, hoursPerDay: parseInt(e.target.value) || 0 }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Dias/Mês</Label>
              <Input
                type="number"
                placeholder="30"
                value={currentEquipment.daysPerMonth || ''}
                onChange={(e) => setCurrentEquipment(prev => ({ ...prev, daysPerMonth: parseInt(e.target.value) || 0 }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Meses/Ano</Label>
              <Input
                type="number"
                placeholder="12"
                value={currentEquipment.monthsPerYear || ''}
                onChange={(e) => setCurrentEquipment(prev => ({ ...prev, monthsPerYear: parseInt(e.target.value) || 0 }))}
              />
            </div>
          </div>

          {/* Consumo Estimado */}
          {currentEquipment.power > 0 && (
            <div className="bg-muted/50 p-4 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="h-4 w-4" />
                <span className="font-medium">Consumo Estimado</span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">kWh/mês:</span>
                  <span className="ml-2 font-medium">{currentConsumption.monthly}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">kWh/ano:</span>
                  <span className="ml-2 font-medium">{currentConsumption.yearly}</span>
                </div>
              </div>
            </div>
          )}

          {/* Botões */}
          <div className="flex gap-2">
            <Button 
              onClick={addEquipment}
              disabled={!currentEquipment.type || !currentEquipment.name || currentEquipment.power <= 0}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Adicionar Equipamento
            </Button>
            <Button variant="outline" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Gerenciar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Equipamentos Adicionados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5" />
            Equipamentos Adicionados
          </CardTitle>
          <div className="flex items-center gap-4 text-sm">
            <div>
              <span className="text-muted-foreground">Total mensal:</span>
              <Badge variant="secondary" className="ml-2">
                {totalConsumption.monthly.toFixed(2)} kWh/mês
              </Badge>
            </div>
            <div>
              <span className="text-muted-foreground">Total anual:</span>
              <Badge variant="secondary" className="ml-2">
                {totalConsumption.yearly.toFixed(2)} kWh/ano
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {equipmentList.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum equipamento adicionado ainda</p>
            </div>
          ) : (
            <div className="space-y-3">
              {equipmentList.map((equipment) => (
                <div key={equipment.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant="outline">{equipment.type}</Badge>
                      <span className="font-medium">{equipment.name}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {equipment.power}W • {equipment.hoursPerDay}h/dia • {equipment.daysPerMonth}d/mês • {equipment.monthsPerYear}m/ano
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right text-sm">
                      <div className="font-medium">{equipment.consumptionKwhMonth} kWh/mês</div>
                      <div className="text-muted-foreground">{equipment.consumptionKwhYear} kWh/ano</div>
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
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuração Básica do Sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Configuração Básica do Sistema</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Sistema</Label>
              <Select
                value={systemConfig.systemType}
                onValueChange={(value) => setSystemConfig(prev => ({ ...prev, systemType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ex: Residencial, Comercial, Industrial" />
                </SelectTrigger>
                <SelectContent>
                  {systemTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Tipo de Instalação</Label>
              <Select
                value={systemConfig.installationType}
                onValueChange={(value) => setSystemConfig(prev => ({ ...prev, installationType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Ex: Telhado, Solo, Carport" />
                </SelectTrigger>
                <SelectContent>
                  {installationTypes.map(type => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              O gerenciamento detalhado de módulos, inversores e baterias será feito na etapa de Simulação Técnica.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  );
}