/**
 * Componente de Relatório da Análise Financeira
 * Carregado de forma lazy para otimizar performance
 */

import React, { useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  FileText, 
  Download, 
  Printer, 
  Share2, 
  Info,
  Calendar,
  DollarSign,
  Zap,
  TrendingUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ResultadoFinanceiroEnhanced, ParametrosSistemaEnhanced } from '@/services/CalculadoraSolarServiceEnhanced';
import { TableSkeleton } from '@/components/ui/LoadingBoundary';

interface FinancialReportProps {
  resultado: ResultadoFinanceiroEnhanced | null;
  parametros: ParametrosSistemaEnhanced;
}

export const FinancialReport: React.FC<FinancialReportProps> = ({
  resultado,
  parametros
}) => {
  const { toast } = useToast();

  // Função para exportar dados
  const exportarDados = useCallback(() => {
    if (!resultado) return;
    
    // Criar CSV com dados mensais
    const headers = [
      'Ano',
      'Mês',
      'Geração (kWh)',
      'Autoconsumo (kWh)',
      'Injeção (kWh)',
      'Economia (R$)',
      'Fluxo Acumulado (R$)'
    ];
    
    const csvData = resultado.tabela_mensal.map(item => [
      item.ano,
      item.mes,
      item.geracao_mensal.toFixed(2),
      item.autoconsumo_mensal.toFixed(2),
      item.injecao_mensal.toFixed(2),
      item.economia_mensal.toFixed(2),
      item.fluxo_caixa_acumulado.toFixed(2)
    ]);
    
    const csv = [headers, ...csvData]
      .map(row => row.join(','))
      .join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `analise_financeira_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: 'Dados Exportados',
      description: 'Relatório exportado com sucesso!',
    });
  }, [resultado, toast]);

  // Função para imprimir relatório
  const imprimirRelatorio = useCallback(() => {
    window.print();
  }, []);

  // Função para compartilhar
  const compartilharRelatorio = useCallback(async () => {
    if (!resultado) return;
    
    const shareData = {
      title: 'Análise Financeira - Sistema Fotovoltaico',
      text: `VPL: R$ ${resultado.vpl.toLocaleString('pt-BR')} | TIR: ${(resultado.tir * 100).toFixed(2)}% | Payback: ${resultado.payback_simples_anos.toFixed(1)} anos`,
      url: window.location.href
    };
    
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback para clipboard
        await navigator.clipboard.writeText(
          `${shareData.title}\n${shareData.text}\n${shareData.url}`
        );
        toast({
          title: 'Copiado!',
          description: 'Dados copiados para a área de transferência.',
        });
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
    }
  }, [resultado, toast]);

  if (!resultado) {
    return (
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Execute a análise financeira para gerar o relatório detalhado.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Relatório */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Relatório de Análise Financeira
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-2">
                Gerado em {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={exportarDados}>
                <Download className="h-4 w-4 mr-2" />
                Exportar CSV
              </Button>
              <Button variant="outline" size="sm" onClick={imprimirRelatorio}>
                <Printer className="h-4 w-4 mr-2" />
                Imprimir
              </Button>
              <Button variant="outline" size="sm" onClick={compartilharRelatorio}>
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Resumo Executivo */}
      <Card>
        <CardHeader>
          <CardTitle>Resumo Executivo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold mb-2">Parâmetros do Sistema</h4>
              <ul className="space-y-1 text-sm">
                <li>• Potência: {parametros.potencia_sistema_kwp} kWp</li>
                <li>• Investimento: R$ {parametros.custo_sistema.toLocaleString('pt-BR')}</li>
                <li>• Geração Anual: {parametros.geracao_anual_kwh.toLocaleString('pt-BR')} kWh</li>
                <li>• Consumo Mensal: {parametros.consumo_mensal_kwh} kWh</li>
                <li>• Concessionária: {parametros.concessionaria_id.toUpperCase()}</li>
                <li>• Tipo de Ligação: {parametros.tipo_ligacao}</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Resultados Principais</h4>
              <ul className="space-y-1 text-sm">
                <li>• VPL: R$ {resultado.vpl.toLocaleString('pt-BR')}</li>
                <li>• TIR: {(resultado.tir * 100).toFixed(2)}%</li>
                <li>• Payback: {resultado.payback_simples_anos.toFixed(1)} anos</li>
                <li>• Economia Total: R$ {resultado.economia_total_25_anos.toLocaleString('pt-BR')}</li>
                <li>• ROI: {(((resultado.economia_total_25_anos - parametros.custo_sistema) / parametros.custo_sistema) * 100).toFixed(1)}%</li>
                <li>• Redução CO₂: {(resultado.reducao_co2_25_anos / 1000).toFixed(1)} toneladas</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabela Anual Resumida */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Projeção Anual (Primeiros 10 Anos)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-80">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Ano</th>
                    <th className="text-right p-2">Geração (kWh)</th>
                    <th className="text-right p-2">Autoconsumo (kWh)</th>
                    <th className="text-right p-2">Injeção (kWh)</th>
                    <th className="text-right p-2">Economia (R$)</th>
                    <th className="text-right p-2">Fluxo Acumulado (R$)</th>
                  </tr>
                </thead>
                <tbody>
                  {resultado.resumo_anual.slice(0, 10).map((ano, index) => (
                    <tr key={index} className="border-b hover:bg-muted/50">
                      <td className="p-2 font-medium">{ano.ano}</td>
                      <td className="p-2 text-right">{ano.geracao_anual.toLocaleString('pt-BR')}</td>
                      <td className="p-2 text-right">{ano.autoconsumo_anual.toLocaleString('pt-BR')}</td>
                      <td className="p-2 text-right">{ano.injecao_anual.toLocaleString('pt-BR')}</td>
                      <td className="p-2 text-right text-green-600 font-medium">
                        R$ {ano.economia_anual.toLocaleString('pt-BR')}
                      </td>
                      <td className="p-2 text-right font-medium">
                        R$ {ano.fluxo_caixa_acumulado.toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Análise Detalhada */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Análise Financeira
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Viabilidade Econômica</h4>
              <p className="text-sm text-muted-foreground mb-2">
                {resultado.vpl > 0 && resultado.tir > parametros.taxa_desconto_anual
                  ? 'O projeto apresenta viabilidade econômica positiva.'
                  : 'O projeto requer revisão dos parâmetros para melhor viabilidade.'
                }
              </p>
              <ul className="space-y-1 text-sm">
                <li>• VPL {resultado.vpl > 0 ? 'positivo' : 'negativo'} indica {resultado.vpl > 0 ? 'criação' : 'destruição'} de valor</li>
                <li>• TIR de {(resultado.tir * 100).toFixed(2)}% {resultado.tir > parametros.taxa_desconto_anual ? 'supera' : 'não supera'} a taxa de desconto</li>
                <li>• Payback de {resultado.payback_simples_anos.toFixed(1)} anos é {resultado.payback_simples_anos <= 8 ? 'atrativo' : 'elevado'}</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Fluxo de Caixa</h4>
              <ul className="space-y-1 text-sm">
                <li>• Investimento inicial: R$ {parametros.custo_sistema.toLocaleString('pt-BR')}</li>
                <li>• Economia anual média: R$ {(resultado.economia_total_25_anos / 25).toLocaleString('pt-BR')}</li>
                <li>• Retorno total: R$ {resultado.economia_total_25_anos.toLocaleString('pt-BR')}</li>
                <li>• Lucro líquido: R$ {(resultado.economia_total_25_anos - parametros.custo_sistema).toLocaleString('pt-BR')}</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Análise Energética
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Performance do Sistema</h4>
              <ul className="space-y-1 text-sm">
                <li>• Geração total: {(resultado.geracao_total_25_anos / 1000).toFixed(1)} MWh</li>
                <li>• Taxa de autoconsumo: {((resultado.autoconsumo_total_25_anos / resultado.geracao_total_25_anos) * 100).toFixed(1)}%</li>
                <li>• Energia injetada: {(resultado.energia_injetada_total_25_anos / 1000).toFixed(1)} MWh</li>
                <li>• Fator de simultaneidade: {(parametros.fator_simultaneidade * 100).toFixed(1)}%</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Impacto Ambiental</h4>
              <ul className="space-y-1 text-sm">
                <li>• CO₂ evitado: {(resultado.reducao_co2_25_anos / 1000).toFixed(1)} toneladas</li>
                <li>• Equivalente a plantar {Math.round(resultado.reducao_co2_25_anos / 2.3)} árvores</li>
                <li>• Energia limpa para {Math.round(resultado.geracao_total_25_anos / 1000 / 8.5)} carros elétricos/ano</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Considerações e Recomendações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Considerações e Recomendações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Premissas Utilizadas</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Inflação anual: {(parametros.inflacao_anual * 100).toFixed(1)}%</li>
                <li>• Taxa de desconto: {(parametros.taxa_desconto_anual * 100).toFixed(1)}%</li>
                <li>• Depreciação anual do sistema: {(parametros.depreciacao_anual_fv * 100).toFixed(2)}%</li>
                <li>• Reajuste tarifário anual: {(parametros.reajuste_tarifario_anual * 100).toFixed(1)}%</li>
                <li>• Incremento de consumo anual: {(parametros.incremento_consumo_anual * 100).toFixed(1)}%</li>
                <li>• Período de análise: {parametros.periodo_projecao_anos} anos</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Recomendações</h4>
              <ul className="space-y-1 text-sm">
                {resultado.vpl > 0 ? (
                  <>
                    <li>• ✅ Projeto recomendado para implementação</li>
                    <li>• ✅ Indicadores financeiros positivos</li>
                    <li>• ✅ Contribuição significativa para sustentabilidade</li>
                  </>
                ) : (
                  <>
                    <li>• ⚠️ Revisar dimensionamento do sistema</li>
                    <li>• ⚠️ Considerar redução de custos ou aumento de geração</li>
                    <li>• ⚠️ Avaliar diferentes cenários econômicos</li>
                  </>
                )}
                <li>• 📊 Monitorar performance real vs. projetada</li>
                <li>• 🔄 Revisar análise anualmente</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialReport;