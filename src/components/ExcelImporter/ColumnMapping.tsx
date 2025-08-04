import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Settings, Eye, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';
import { ExcelFile, ColumnMapping as ColumnMappingType, ImportSettings } from './types';

interface ColumnMappingProps {
  selectedFile: ExcelFile | null;
  columnMapping: ColumnMappingType;
  onMappingChange: (mapping: ColumnMappingType) => void;
  settings: ImportSettings;
  onPreview: () => void;
}

export const ColumnMapping: React.FC<ColumnMappingProps> = ({
  selectedFile,
  columnMapping,
  onMappingChange,
  settings,
  onPreview
}) => {
  const [autoMappingApplied, setAutoMappingApplied] = useState(false);

  // Auto-detectar mapeamento baseado nos nomes das colunas
  const autoDetectMapping = useCallback(() => {
    if (!selectedFile) return;

    const newMapping: ColumnMappingType = { ...columnMapping };
    const headers = selectedFile.headers.map(h => h.toLowerCase());

    // Mapeamentos comuns
    const mappings = {
      nome: ['nome', 'produto', 'name', 'description', 'descricao', 'modelo'],
      potencia: ['potencia', 'power', 'watts', 'wp', 'w', 'pot'],
      preco: ['preco', 'price', 'valor', 'cost', 'custo', 'preço'],
      fabricante: ['fabricante', 'manufacturer', 'marca', 'brand', 'fab'],
      categoria: ['categoria', 'category', 'tipo', 'type', 'cat'],
      descricao: ['descricao', 'description', 'desc', 'detalhes', 'details']
    };

    Object.entries(mappings).forEach(([field, keywords]) => {
      const matchedIndex = headers.findIndex(header => 
        keywords.some(keyword => header.includes(keyword))
      );
      
      if (matchedIndex !== -1) {
        newMapping[field] = matchedIndex;
      }
    });

    onMappingChange(newMapping);
    setAutoMappingApplied(true);
  }, [selectedFile, columnMapping, onMappingChange]);

  const handleMappingChange = useCallback((field: string, value: string) => {
    const newMapping = { ...columnMapping };
    
    if (value === 'none') {
      delete newMapping[field];
    } else {
      newMapping[field] = isNaN(Number(value)) ? value : Number(value);
    }
    
    onMappingChange(newMapping);
  }, [columnMapping, onMappingChange]);

  const getMappingStatus = () => {
    const requiredMapped = settings.requiredFields.every(field => 
      columnMapping[field] !== undefined && columnMapping[field] !== ''
    );
    const totalMapped = Object.keys(columnMapping).length;
    
    return {
      requiredMapped,
      totalMapped,
      isComplete: requiredMapped
    };
  };

  const getPreviewData = () => {
    if (!selectedFile || selectedFile.data.length === 0) return [];
    
    return selectedFile.data.slice(0, settings.previewRows).map((row, index) => {
      const mappedRow: Record<string, unknown> = { _index: index };
      
      Object.entries(columnMapping).forEach(([field, columnIndex]) => {
        if (typeof columnIndex === 'number' && row[columnIndex] !== undefined) {
          mappedRow[field] = row[columnIndex];
        }
      });
      
      return mappedRow;
    });
  };

  const status = getMappingStatus();
  const previewData = getPreviewData();

  if (!selectedFile) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Settings className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Selecione um arquivo</h3>
          <p className="text-muted-foreground">
            Carregue um arquivo Excel para configurar o mapeamento de colunas
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com status */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Mapeamento de Colunas
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={status.isComplete ? 'default' : 'secondary'}>
                {status.totalMapped} campos mapeados
              </Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={autoDetectMapping}
                disabled={autoMappingApplied}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Auto-detectar
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Status do mapeamento */}
          <Alert className={status.isComplete ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'}>
            {status.isComplete ? (
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-yellow-600" />
            )}
            <AlertDescription>
              {status.isComplete 
                ? 'Todos os campos obrigatórios foram mapeados'
                : `Mapeie os campos obrigatórios: ${settings.requiredFields.filter(f => !columnMapping[f]).join(', ')}`
              }
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

      {/* Configuração de mapeamento */}
      <Card>
        <CardHeader>
          <CardTitle>Configurar Mapeamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Campos obrigatórios */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Campos Obrigatórios
              </h4>
              {settings.requiredFields.map((field) => (
                <div key={field} className="space-y-2">
                  <label className="text-sm font-medium capitalize">
                    {field} *
                  </label>
                  <Select
                    value={columnMapping[field]?.toString() || 'none'}
                    onValueChange={(value) => handleMappingChange(field, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma coluna" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não mapear</SelectItem>
                      {selectedFile.headers.map((header, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {header || `Coluna ${index + 1}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            {/* Campos opcionais */}
            <div className="space-y-4">
              <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                Campos Opcionais
              </h4>
              {['categoria', 'descricao'].map((field) => (
                <div key={field} className="space-y-2">
                  <label className="text-sm font-medium capitalize">
                    {field}
                  </label>
                  <Select
                    value={columnMapping[field]?.toString() || 'none'}
                    onValueChange={(value) => handleMappingChange(field, value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma coluna" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Não mapear</SelectItem>
                      {selectedFile.headers.map((header, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {header || `Coluna ${index + 1}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview dos dados mapeados */}
      {previewData.length > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                Preview dos Dados Mapeados
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={onPreview}
                disabled={!status.isComplete}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview Completo
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-16">#</TableHead>
                    {Object.keys(columnMapping).map((field) => (
                      <TableHead key={field} className="capitalize">
                        {field}
                        {settings.requiredFields.includes(field) && (
                          <span className="text-red-500 ml-1">*</span>
                        )}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {previewData.map((row, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-xs">
                        {(row._index as number) + 1}
                      </TableCell>
                      {Object.keys(columnMapping).map((field) => (
                        <TableCell key={field} className="max-w-32 truncate">
                          {String(row[field] || '-')}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            {previewData.length >= settings.previewRows && (
              <p className="text-sm text-muted-foreground mt-2">
                Mostrando {settings.previewRows} de {selectedFile.data.length} linhas
              </p>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};