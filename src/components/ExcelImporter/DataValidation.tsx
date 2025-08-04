import React, { useState, useCallback, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, AlertTriangle, XCircle, Download, Filter } from 'lucide-react';
import { ValidationResult, ValidationError, ProcessedProduct } from './types';

interface DataValidationProps {
  validationResult: ValidationResult | null;
  onDownloadValid: () => void;
  onDownloadErrors: () => void;
  onRetry: () => void;
}

export const DataValidation: React.FC<DataValidationProps> = ({
  validationResult,
  onDownloadValid,
  onDownloadErrors,
  onRetry
}) => {
  const [selectedTab, setSelectedTab] = useState('summary');
  const [errorFilter, setErrorFilter] = useState<string>('all');

  // Estatísticas de validação
  const stats = useMemo(() => {
    if (!validationResult) return null;

    const total = validationResult.validProducts.length + validationResult.errors.length;
    const valid = validationResult.validProducts.length;
    const invalid = validationResult.errors.length;
    const successRate = total > 0 ? (valid / total) * 100 : 0;

    // Agrupar erros por tipo
    const errorsByType = validationResult.errors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total,
      valid,
      invalid,
      successRate,
      errorsByType
    };
  }, [validationResult]);

  // Filtrar erros por tipo
  const filteredErrors = useMemo(() => {
    if (!validationResult || errorFilter === 'all') {
      return validationResult?.errors || [];
    }
    return validationResult.errors.filter(error => error.type === errorFilter);
  }, [validationResult, errorFilter]);

  const getErrorIcon = (type: string) => {
    switch (type) {
      case 'required':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'format':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'duplicate':
        return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getErrorTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      required: 'Campo Obrigatório',
      format: 'Formato Inválido',
      duplicate: 'Duplicado',
      range: 'Fora do Intervalo'
    };
    return labels[type] || type;
  };

  const getErrorSeverityColor = (type: string) => {
    switch (type) {
      case 'required':
        return 'destructive';
      case 'format':
        return 'secondary';
      case 'duplicate':
        return 'outline';
      default:
        return 'secondary';
    }
  };

  if (!validationResult) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Aguardando validação</h3>
          <p className="text-muted-foreground">
            Configure o mapeamento e execute a importação para ver os resultados
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Resumo da validação */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Resultado da Validação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Barra de progresso */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Taxa de Sucesso</span>
                <span className="font-medium">{stats?.successRate.toFixed(1)}%</span>
              </div>
              <Progress value={stats?.successRate || 0} className="h-2" />
            </div>

            {/* Estatísticas */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats?.valid}</div>
                <div className="text-sm text-green-700">Válidos</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{stats?.invalid}</div>
                <div className="text-sm text-red-700">Com Erros</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats?.total}</div>
                <div className="text-sm text-blue-700">Total</div>
              </div>
            </div>

            {/* Ações */}
            <div className="flex gap-2 pt-4">
              <Button
                onClick={onDownloadValid}
                disabled={!stats?.valid}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar Válidos ({stats?.valid})
              </Button>
              <Button
                variant="outline"
                onClick={onDownloadErrors}
                disabled={!stats?.invalid}
                className="flex-1"
              >
                <Download className="h-4 w-4 mr-2" />
                Baixar Erros ({stats?.invalid})
              </Button>
              <Button
                variant="secondary"
                onClick={onRetry}
              >
                Tentar Novamente
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detalhes da validação */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhes da Validação</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedTab} onValueChange={setSelectedTab}>
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="summary">Resumo</TabsTrigger>
              <TabsTrigger value="errors">Erros ({stats?.invalid})</TabsTrigger>
              <TabsTrigger value="valid">Válidos ({stats?.valid})</TabsTrigger>
            </TabsList>

            <TabsContent value="summary" className="space-y-4">
              {/* Resumo por tipo de erro */}
              {stats?.errorsByType && Object.keys(stats.errorsByType).length > 0 && (
                <div className="space-y-3">
                  <h4 className="font-semibold">Erros por Tipo</h4>
                  <div className="space-y-2">
                    {Object.entries(stats.errorsByType).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-2">
                          {getErrorIcon(type)}
                          <span className="font-medium">{getErrorTypeLabel(type)}</span>
                        </div>
                        <Badge variant={getErrorSeverityColor(type)}>
                          {count} erro{count !== 1 ? 's' : ''}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Alertas importantes */}
              {stats?.invalid > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    {stats.invalid} produto{stats.invalid !== 1 ? 's' : ''} não passou{stats.invalid === 1 ? 'u' : 'ram'} na validação.
                    Verifique os erros na aba "Erros" e corrija os dados antes de importar.
                  </AlertDescription>
                </Alert>
              )}
            </TabsContent>

            <TabsContent value="errors" className="space-y-4">
              {/* Filtro de erros */}
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <select
                  value={errorFilter}
                  onChange={(e) => setErrorFilter(e.target.value)}
                  className="px-3 py-1 border rounded-md text-sm"
                >
                  <option value="all">Todos os erros</option>
                  {Object.keys(stats?.errorsByType || {}).map(type => (
                    <option key={type} value={type}>
                      {getErrorTypeLabel(type)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Lista de erros */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">Linha</TableHead>
                      <TableHead>Campo</TableHead>
                      <TableHead>Tipo</TableHead>
                      <TableHead>Mensagem</TableHead>
                      <TableHead>Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredErrors.map((error, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-xs">
                          {error.row + 1}
                        </TableCell>
                        <TableCell className="font-medium">
                          {error.field}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getErrorIcon(error.type)}
                            <Badge variant={getErrorSeverityColor(error.type)} className="text-xs">
                              {getErrorTypeLabel(error.type)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-64">
                          <span className="text-sm text-muted-foreground">
                            {error.message}
                          </span>
                        </TableCell>
                        <TableCell className="max-w-32 truncate font-mono text-xs">
                          {String(error.value || '-')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {filteredErrors.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum erro encontrado para o filtro selecionado
                </div>
              )}
            </TabsContent>

            <TabsContent value="valid" className="space-y-4">
              {/* Lista de produtos válidos */}
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-16">#</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Potência</TableHead>
                      <TableHead>Preço</TableHead>
                      <TableHead>Fabricante</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {validationResult.validProducts.slice(0, 50).map((product, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-mono text-xs">
                          {index + 1}
                        </TableCell>
                        <TableCell className="font-medium max-w-48 truncate">
                          {product.nome}
                        </TableCell>
                        <TableCell>
                          {product.potencia}W
                        </TableCell>
                        <TableCell>
                          R$ {product.preco?.toFixed(2)}
                        </TableCell>
                        <TableCell className="max-w-32 truncate">
                          {product.fabricante}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {validationResult.validProducts.length > 50 && (
                <p className="text-sm text-muted-foreground text-center">
                  Mostrando 50 de {validationResult.validProducts.length} produtos válidos
                </p>
              )}

              {validationResult.validProducts.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum produto válido encontrado
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};