/**
 * Componente de Configuração da Análise Financeira
 * Carregado de forma lazy para otimizar performance
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Switch } from '@/components/ui/switch';
import { Loader2, Zap, DollarSign, Settings, Info, Cpu } from 'lucide-react';
import { useFinancialWorker } from '@/hooks/useFinancialWorker';
import { ParametrosSistemaEnhanced } from '@/services/CalculadoraSolarServiceEnhanced';

interface FinancialConfigurationProps {
  parametros: ParametrosSistemaEnhanced;
  setParametros: React.Dispatch<React.SetStateAction<ParametrosSistemaEnhanced>>;
  onCalculate: () => Promise<void>;
  loading: boolean;
}

export const FinancialConfiguration: React.FC<FinancialConfigurationProps> = ({
  parametros,
  setParametros,
  onCalculate,
  loading
}) => {
  const { isWorkerSupported } = useFinancialWorker();
  const updateParametro = <K extends keyof ParametrosSistemaEnhanced>(
    key: K,
    value: ParametrosSistemaEnhanced[K]
  ) => {
    setParametros(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Configure os parâmetros do sistema fotovoltaico e cenário econômico para realizar a análise financeira.
        </AlertDescription>
      </Alert>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Parâmetros do Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Sistema Fotovoltaico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="custo_sistema">Custo do Sistema (R$)</Label>
              <Input
                id="custo_sistema"
                type="number"
                value={parametros.custo_sistema}
                onChange={(e) => updateParametro('custo_sistema', Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="potencia_sistema">Potência (kWp)</Label>
              <Input
                id="potencia_sistema"
                type="number"
                step="0.1"
                value={parametros.potencia_sistema_kwp}
                onChange={(e) => updateParametro('potencia_sistema_kwp', Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="geracao_anual">Geração Anual (kWh)</Label>
              <Input
                id="geracao_anual"
                type="number"
                value={parametros.geracao_anual_kwh}
                onChange={(e) => updateParametro('geracao_anual_kwh', Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="eficiencia_inversor">Eficiência do Inversor (%)</Label>
              <Input
                id="eficiencia_inversor"
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={parametros.eficiencia_inversor}
                onChange={(e) => updateParametro('eficiencia_inversor', Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="perdas_sistema">Perdas do Sistema (%)</Label>
              <Input
                id="perdas_sistema"
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={parametros.perdas_sistema}
                onChange={(e) => updateParametro('perdas_sistema', Number(e.target.value))}
              />
            </div>
          </CardContent>
        </Card>

        {/* Parâmetros de Consumo */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Consumo e Tarifas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="consumo_mensal">Consumo Mensal (kWh)</Label>
              <Input
                id="consumo_mensal"
                type="number"
                value={parametros.consumo_mensal_kwh}
                onChange={(e) => updateParametro('consumo_mensal_kwh', Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="incremento_consumo">Incremento Anual do Consumo (%)</Label>
              <Input
                id="incremento_consumo"
                type="number"
                step="0.01"
                value={parametros.incremento_consumo_anual * 100}
                onChange={(e) => updateParametro('incremento_consumo_anual', Number(e.target.value) / 100)}
              />
            </div>
            <div>
              <Label htmlFor="fator_simultaneidade">Fator de Simultaneidade (%)</Label>
              <Input
                id="fator_simultaneidade"
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={parametros.fator_simultaneidade * 100}
                onChange={(e) => updateParametro('fator_simultaneidade', Number(e.target.value) / 100)}
              />
            </div>
            <div>
              <Label htmlFor="perfil_consumo_diurno">Perfil Consumo Diurno (%)</Label>
              <Input
                id="perfil_consumo_diurno"
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={parametros.perfil_consumo_diurno * 100}
                onChange={(e) => updateParametro('perfil_consumo_diurno', Number(e.target.value) / 100)}
              />
            </div>
            <div>
              <Label htmlFor="concessionaria">Concessionária</Label>
              <Select
                value={parametros.concessionaria_id}
                onValueChange={(value) => updateParametro('concessionaria_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a concessionária" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="enel-rj">Enel Distribuição Rio</SelectItem>
                  <SelectItem value="light">Light SESA</SelectItem>
                  <SelectItem value="ceral">Ceral</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tipo_ligacao">Tipo de Ligação</Label>
              <Select
                value={parametros.tipo_ligacao}
                onValueChange={(value: 'monofasico' | 'bifasico' | 'trifasico') => 
                  updateParametro('tipo_ligacao', value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monofasico">Monofásico</SelectItem>
                  <SelectItem value="bifasico">Bifásico</SelectItem>
                  <SelectItem value="trifasico">Trifásico</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Parâmetros Econômicos */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Cenário Econômico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="ano_instalacao">Ano de Instalação</Label>
              <Input
                id="ano_instalacao"
                type="number"
                value={parametros.ano_instalacao}
                onChange={(e) => updateParametro('ano_instalacao', Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="periodo_projecao">Período de Projeção (anos)</Label>
              <Input
                id="periodo_projecao"
                type="number"
                value={parametros.periodo_projecao_anos}
                onChange={(e) => updateParametro('periodo_projecao_anos', Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="inflacao_anual">Inflação Anual (%)</Label>
              <Input
                id="inflacao_anual"
                type="number"
                step="0.01"
                value={parametros.inflacao_anual * 100}
                onChange={(e) => updateParametro('inflacao_anual', Number(e.target.value) / 100)}
              />
            </div>
            <div>
              <Label htmlFor="taxa_desconto">Taxa de Desconto (%)</Label>
              <Input
                id="taxa_desconto"
                type="number"
                step="0.01"
                value={parametros.taxa_desconto_anual * 100}
                onChange={(e) => updateParametro('taxa_desconto_anual', Number(e.target.value) / 100)}
              />
            </div>
            <div>
              <Label htmlFor="depreciacao_fv">Depreciação Anual FV (%)</Label>
              <Input
                id="depreciacao_fv"
                type="number"
                step="0.001"
                value={parametros.depreciacao_anual_fv * 100}
                onChange={(e) => updateParametro('depreciacao_anual_fv', Number(e.target.value) / 100)}
              />
            </div>
            <div>
              <Label htmlFor="custo_om">Custo O&M Anual (R$)</Label>
              <Input
                id="custo_om"
                type="number"
                value={parametros.custo_om_anual}
                onChange={(e) => updateParametro('custo_om_anual', Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="reajuste_tarifario">Reajuste Tarifário Anual (%)</Label>
              <Input
                id="reajuste_tarifario"
                type="number"
                step="0.01"
                value={parametros.reajuste_tarifario_anual * 100}
                onChange={(e) => updateParametro('reajuste_tarifario_anual', Number(e.target.value) / 100)}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <Separator />

      {/* Configurações de Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Cpu className="h-5 w-5" />
            Configurações de Performance
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Usar Web Workers</Label>
              <p className="text-sm text-muted-foreground">
                {isWorkerSupported 
                  ? 'Processa cálculos em thread separada para melhor performance'
                  : 'Web Workers não suportados neste navegador'
                }
              </p>
            </div>
            <Switch
              checked={parametros.useWorker && isWorkerSupported}
              onCheckedChange={(checked) => 
                updateParametro('useWorker', checked)
              }
              disabled={!isWorkerSupported}
            />
          </div>
          
          {parametros.custo_sistema > 30000 && isWorkerSupported && (
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-800">
                💡 Sistema de alto valor detectado. Web Workers recomendados para melhor performance.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-center">
        <Button
          onClick={onCalculate}
          disabled={loading}
          size="lg"
          className="min-w-[200px]"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Calculando...
            </>
          ) : (
            <>
              Calcular Análise Financeira
              {parametros.useWorker && isWorkerSupported && (
                <span className="ml-2 text-xs opacity-75">(Web Worker)</span>
              )}
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default FinancialConfiguration;