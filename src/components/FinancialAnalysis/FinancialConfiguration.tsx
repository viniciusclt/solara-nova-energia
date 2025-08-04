import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings } from 'lucide-react';
import { FinancialData } from './types';
import { TarifaConcessionaria } from '@/services/TarifaService';

interface FinancialConfigurationProps {
  financialData: FinancialData;
  onDataChange: (data: Partial<FinancialData>) => void;
  concessionarias: TarifaConcessionaria[];
}

export const FinancialConfiguration: React.FC<FinancialConfigurationProps> = ({
  financialData,
  onDataChange,
  concessionarias
}) => {
  const handleInputChange = (field: keyof FinancialData, value: string | number) => {
    onDataChange({ [field]: value });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Configurações Financeiras
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Configurações do Sistema */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="valorSistema">Valor do Sistema (R$)</Label>
            <Input
              id="valorSistema"
              type="number"
              value={financialData.valorSistema}
              onChange={(e) => handleInputChange('valorSistema', parseFloat(e.target.value) || 0)}
              placeholder="20.150"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="custoWp">Custo por Wp (R$/Wp)</Label>
            <Input
              id="custoWp"
              type="number"
              step="0.01"
              value={financialData.custoWp}
              onChange={(e) => handleInputChange('custoWp', parseFloat(e.target.value) || 0)}
              placeholder="2.80"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="potenciaSistema">Potência do Sistema (kWp)</Label>
            <Input
              id="potenciaSistema"
              type="number"
              step="0.1"
              value={financialData.potenciaSistema}
              onChange={(e) => handleInputChange('potenciaSistema', parseFloat(e.target.value) || 0)}
              placeholder="7.2"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="geracaoAnual">Geração Anual (kWh)</Label>
            <Input
              id="geracaoAnual"
              type="number"
              value={financialData.geracaoAnual}
              onChange={(e) => handleInputChange('geracaoAnual', parseFloat(e.target.value) || 0)}
              placeholder="11.000"
            />
          </div>
        </div>

        {/* Configurações Comerciais */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="bdi">BDI (%)</Label>
            <Input
              id="bdi"
              type="number"
              step="0.1"
              value={financialData.bdi}
              onChange={(e) => handleInputChange('bdi', parseFloat(e.target.value) || 0)}
              placeholder="15"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="markup">Markup (%)</Label>
            <Input
              id="markup"
              type="number"
              step="0.1"
              value={financialData.markup}
              onChange={(e) => handleInputChange('markup', parseFloat(e.target.value) || 0)}
              placeholder="20"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="margem">Margem (%)</Label>
            <Input
              id="margem"
              type="number"
              step="0.1"
              value={financialData.margem}
              onChange={(e) => handleInputChange('margem', parseFloat(e.target.value) || 0)}
              placeholder="25"
            />
          </div>
        </div>

        {/* Configurações Tarifárias */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="concessionaria">Concessionária</Label>
            <Select
              value={financialData.concessionariaId}
              onValueChange={(value) => handleInputChange('concessionariaId', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a concessionária" />
              </SelectTrigger>
              <SelectContent>
                {concessionarias.map((concessionaria) => (
                  <SelectItem key={concessionaria.id} value={concessionaria.id}>
                    {concessionaria.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tipoLigacao">Tipo de Ligação</Label>
            <Select
              value={financialData.tipoLigacao}
              onValueChange={(value) => handleInputChange('tipoLigacao', value as 'monofasico' | 'bifasico' | 'trifasico')}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monofasico">Monofásico</SelectItem>
                <SelectItem value="bifasico">Bifásico</SelectItem>
                <SelectItem value="trifasico">Trifásico</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="tarifaEletrica">Tarifa Elétrica (R$/kWh)</Label>
            <Input
              id="tarifaEletrica"
              type="number"
              step="0.001"
              value={financialData.tarifaEletrica}
              onChange={(e) => handleInputChange('tarifaEletrica', parseFloat(e.target.value) || 0)}
              placeholder="0.85"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="reajusteTarifario">Reajuste Tarifário (%/ano)</Label>
            <Input
              id="reajusteTarifario"
              type="number"
              step="0.1"
              value={financialData.reajusteTarifario}
              onChange={(e) => handleInputChange('reajusteTarifario', parseFloat(e.target.value) || 0)}
              placeholder="6.2"
            />
          </div>
        </div>

        {/* Configurações Econômicas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="inflacao">Inflação (%/ano)</Label>
            <Input
              id="inflacao"
              type="number"
              step="0.1"
              value={financialData.inflacao}
              onChange={(e) => handleInputChange('inflacao', parseFloat(e.target.value) || 0)}
              placeholder="4.5"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="consumoMensal">Consumo Mensal (kWh)</Label>
            <Input
              id="consumoMensal"
              type="number"
              value={financialData.consumoMensal}
              onChange={(e) => handleInputChange('consumoMensal', parseFloat(e.target.value) || 0)}
              placeholder="780"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};