import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { DollarSign, TrendingUp, Percent, Save, Shield } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface FinancialParameters {
  taxa_desconto_anual: number;
  inflacao_anual: number;
  reajuste_tarifario_anual: number;
  custo_om_anual: number;
  taxa_juros_financiamento: number;
  prazo_financiamento_anos: number;
}

const DEFAULT_PARAMETERS: FinancialParameters = {
  taxa_desconto_anual: 0.08, // 8%
  inflacao_anual: 0.045, // 4.5%
  reajuste_tarifario_anual: 0.06, // 6%
  custo_om_anual: 200, // R$ 200
  taxa_juros_financiamento: 0.12, // 12%
  prazo_financiamento_anos: 15
};

export const FinancialSettings: React.FC = () => {
  const { profile, hasPermission } = useAuth();
  const { toast } = useToast();
  const [parameters, setParameters] = useState<FinancialParameters>(DEFAULT_PARAMETERS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Verificar se o usuário tem permissão
  const hasAccess = hasPermission('manage_financial_settings') || 
                   profile?.access_type === 'admin' || 
                   profile?.access_type === 'super_admin';

  useEffect(() => {
    if (hasAccess) {
      loadFinancialParameters();
    }
  }, [hasAccess]);

  const loadFinancialParameters = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('financial_parameters')
        .select('*')
        .eq('company_id', profile?.company_id)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        throw error;
      }

      if (data) {
        setParameters({
          taxa_desconto_anual: data.taxa_desconto_anual || DEFAULT_PARAMETERS.taxa_desconto_anual,
          inflacao_anual: data.inflacao_anual || DEFAULT_PARAMETERS.inflacao_anual,
          reajuste_tarifario_anual: data.reajuste_tarifario_anual || DEFAULT_PARAMETERS.reajuste_tarifario_anual,
          custo_om_anual: data.custo_om_anual || DEFAULT_PARAMETERS.custo_om_anual,
          taxa_juros_financiamento: data.taxa_juros_financiamento || DEFAULT_PARAMETERS.taxa_juros_financiamento,
          prazo_financiamento_anos: data.prazo_financiamento_anos || DEFAULT_PARAMETERS.prazo_financiamento_anos
        });
      }
    } catch (error) {
      console.error('Erro ao carregar parâmetros financeiros:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao carregar parâmetros financeiros. Usando valores padrão.',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const saveFinancialParameters = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('financial_parameters')
        .upsert({
          company_id: profile?.company_id,
          ...parameters,
          updated_at: new Date().toISOString(),
          updated_by: profile?.id
        });

      if (error) throw error;

      toast({
        title: 'Sucesso',
        description: 'Parâmetros financeiros salvos com sucesso!'
      });
    } catch (error) {
      console.error('Erro ao salvar parâmetros financeiros:', error);
      toast({
        title: 'Erro',
        description: 'Erro ao salvar parâmetros financeiros.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const updateParameter = <K extends keyof FinancialParameters>(
    key: K,
    value: FinancialParameters[K]
  ) => {
    setParameters(prev => ({ ...prev, [key]: value }));
  };

  if (!hasAccess) {
    return (
      <div className="space-y-6">
        <Alert>
          <Shield className="h-4 w-4" />
          <AlertDescription>
            Acesso restrito. Apenas administradores e gerentes podem configurar parâmetros financeiros.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">Parâmetros Financeiros</h3>
          <p className="text-sm text-muted-foreground">
            Configure os parâmetros padrão para análises financeiras
          </p>
        </div>
        <Button onClick={saveFinancialParameters} disabled={saving}>
          {saving ? (
            <>
              <Save className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Parâmetros Econômicos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Cenário Econômico
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="taxa_desconto">Taxa de Desconto Anual (%)</Label>
              <Input
                id="taxa_desconto"
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={parameters.taxa_desconto_anual * 100}
                onChange={(e) => updateParameter('taxa_desconto_anual', Number(e.target.value) / 100)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Taxa utilizada para calcular o VPL
              </p>
            </div>
            
            <div>
              <Label htmlFor="inflacao">Inflação Anual (%)</Label>
              <Input
                id="inflacao"
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={parameters.inflacao_anual * 100}
                onChange={(e) => updateParameter('inflacao_anual', Number(e.target.value) / 100)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Inflação esperada para correção de valores
              </p>
            </div>
            
            <div>
              <Label htmlFor="reajuste_tarifario">Reajuste Tarifário Anual (%)</Label>
              <Input
                id="reajuste_tarifario"
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={parameters.reajuste_tarifario_anual * 100}
                onChange={(e) => updateParameter('reajuste_tarifario_anual', Number(e.target.value) / 100)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Reajuste anual da tarifa de energia elétrica
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Parâmetros Operacionais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Custos Operacionais
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="custo_om">Custo O&M Anual (R$)</Label>
              <Input
                id="custo_om"
                type="number"
                min="0"
                value={parameters.custo_om_anual}
                onChange={(e) => updateParameter('custo_om_anual', Number(e.target.value))}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Custo anual de operação e manutenção
              </p>
            </div>
            
            <div>
              <Label htmlFor="taxa_juros">Taxa de Juros Financiamento (%)</Label>
              <Input
                id="taxa_juros"
                type="number"
                step="0.01"
                min="0"
                max="1"
                value={parameters.taxa_juros_financiamento * 100}
                onChange={(e) => updateParameter('taxa_juros_financiamento', Number(e.target.value) / 100)}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Taxa de juros para financiamento do sistema
              </p>
            </div>
            
            <div>
              <Label htmlFor="prazo_financiamento">Prazo Financiamento (anos)</Label>
              <Input
                id="prazo_financiamento"
                type="number"
                min="1"
                max="30"
                value={parameters.prazo_financiamento_anos}
                onChange={(e) => updateParameter('prazo_financiamento_anos', Number(e.target.value))}
                disabled={loading}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Prazo padrão para financiamento em anos
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Alert>
        <Percent className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> Estes parâmetros serão utilizados como valores padrão em todas as análises financeiras. 
          Os usuários poderão ajustar estes valores individualmente em cada simulação, mas estes serão os valores iniciais.
        </AlertDescription>
      </Alert>
    </div>
  );
};