import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Upload, AlertCircle, CheckCircle, Download, Plus, Trash2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PVSolData {
  month: string;
  monthNumber: number;
  generation: number; // kWh
  inverters?: { [key: string]: number }; // Geração por inversor
}

interface PVSolImporterProps {
  onDataImported: (data: PVSolData[]) => void;
  onClose: () => void;
}

export function PVSolImporter({ onDataImported, onClose }: PVSolImporterProps) {
  const { toast } = useToast();
  const [rawData, setRawData] = useState("");
  const [parsedData, setParsedData] = useState<PVSolData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);
  const [inverterColumns, setInverterColumns] = useState<string[]>(['Inversor 1', 'Inversor 2']);
  const [useTableMode, setUseTableMode] = useState(true);

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const sampleData = `Janeiro	850.5
Fevereiro	780.2
Março	920.8
Abril	1050.3
Maio	1180.7
Junho	1220.4
Julho	1250.9
Agosto	1190.6
Setembro	1080.2
Outubro	950.8
Novembro	820.3
Dezembro	780.1`;

  // Inicializar dados da tabela
  const initializeTableData = () => {
    const initialData: PVSolData[] = monthNames.map((month, index) => ({
      month,
      monthNumber: index + 1,
      generation: 0,
      inverters: inverterColumns.reduce((acc, inv) => ({ ...acc, [inv]: 0 }), {})
    }));
    setParsedData(initialData);
    setIsValid(false);
  };

  const parseData = (data: string): PVSolData[] => {
    try {
      const lines = data.trim().split('\n');
      
      // Remove header line if present
      const dataLines = lines.filter(line => 
        line.trim() && 
        !line.toLowerCase().includes('mês') && 
        !line.toLowerCase().includes('geração')
      );

      const parsed: PVSolData[] = [];

      for (const line of dataLines) {
        // Try different separators (tab, semicolon, comma, space)
        const separators = ['\t', ';', ',', ' '];
        let parts: string[] = [];
        
        for (const sep of separators) {
          const testParts = line.split(sep).map(p => p.trim()).filter(p => p);
          if (testParts.length >= 2) {
            parts = testParts;
            break;
          }
        }

        if (parts.length < 2) continue;

        const monthStr = parts[0].trim();
        const generationStr = parts[1].trim();

        // Try to match month name or number
        let monthNumber = 0;
        
        // Check if it's a month name
        const monthIndex = monthNames.findIndex(name => 
          name.toLowerCase().includes(monthStr.toLowerCase()) ||
          monthStr.toLowerCase().includes(name.toLowerCase())
        );
        
        if (monthIndex >= 0) {
          monthNumber = monthIndex + 1;
        } else {
          // Try to parse as month number
          const num = parseInt(monthStr);
          if (num >= 1 && num <= 12) {
            monthNumber = num;
          }
        }

        // Parse generation value
        const generation = parseFloat(generationStr.replace(',', '.'));

        if (monthNumber > 0 && !isNaN(generation) && generation > 0) {
          parsed.push({
            month: monthNames[monthNumber - 1],
            monthNumber,
            generation
          });
        }
      }

      // Sort by month number
      parsed.sort((a, b) => a.monthNumber - b.monthNumber);

      return parsed;
    } catch (error) {
      throw new Error('Erro ao processar os dados. Verifique o formato.');
    }
  };

  // Funções para gerenciar colunas de inversores
  const addInverterColumn = () => {
    const newInverter = `Inversor ${inverterColumns.length + 1}`;
    setInverterColumns([...inverterColumns, newInverter]);
    
    // Adicionar coluna aos dados existentes
    setParsedData(prev => prev.map(row => ({
      ...row,
      inverters: { ...row.inverters, [newInverter]: 0 }
    })));
  };

  const removeInverterColumn = (inverterName: string) => {
    if (inverterColumns.length <= 1) {
      toast({
        title: "Erro",
        description: "Deve haver pelo menos um inversor",
        variant: "destructive"
      });
      return;
    }
    
    setInverterColumns(prev => prev.filter(inv => inv !== inverterName));
    
    // Remover coluna dos dados
    setParsedData(prev => prev.map(row => {
      const newInverters = { ...row.inverters };
      delete newInverters[inverterName];
      return { ...row, inverters: newInverters };
    }));
  };

  // Atualizar valor na tabela
  const updateCellValue = (monthNumber: number, field: string, value: number) => {
    setParsedData(prev => prev.map(row => {
      if (row.monthNumber === monthNumber) {
        if (field === 'generation') {
          return { ...row, generation: value };
        } else {
          return {
            ...row,
            inverters: { ...row.inverters, [field]: value }
          };
        }
      }
      return row;
    }));
    
    // Revalidar dados
    validateTableData();
  };

  const validateTableData = () => {
    const totalGeneration = parsedData.reduce((sum, row) => sum + row.generation, 0);
    const hasValidData = parsedData.some(row => row.generation > 0);
    
    if (!hasValidData) {
      setError("Insira valores de geração válidos");
      setIsValid(false);
      return;
    }
    
    if (totalGeneration < 100 || totalGeneration > 50000) {
      setError("Valores de geração parecem incorretos (muito baixos ou muito altos)");
      setIsValid(false);
      return;
    }
    
    setError(null);
    setIsValid(true);
  };

  // Copiar dados da planilha
  const handlePasteData = async () => {
    try {
      const text = await navigator.clipboard.readText();
      const parsed = parseData(text);
      
      // Atualizar dados da tabela com os dados colados
      setParsedData(prev => prev.map(row => {
        const matchedData = parsed.find(p => p.monthNumber === row.monthNumber);
        if (matchedData) {
          return { ...row, generation: matchedData.generation };
        }
        return row;
      }));
      
      validateTableData();
      
      toast({
        title: "Dados Colados",
        description: `${parsed.length} meses de dados foram colados na tabela`
      });
    } catch (error) {
      toast({
        title: "Erro ao Colar",
        description: "Não foi possível colar os dados da área de transferência",
        variant: "destructive"
      });
    }
  };

  const validateData = (data: PVSolData[]): string | null => {
    if (data.length === 0) {
      return "Nenhum dado válido encontrado";
    }

    if (data.length !== 12) {
      return `Dados incompletos: encontrados ${data.length} meses, esperados 12`;
    }

    // Check for duplicate months
    const months = data.map(d => d.monthNumber);
    const uniqueMonths = new Set(months);
    if (uniqueMonths.size !== 12) {
      return "Dados duplicados ou meses faltando";
    }

    // Check for reasonable generation values
    const totalGeneration = data.reduce((sum, d) => sum + d.generation, 0);
    if (totalGeneration < 100 || totalGeneration > 50000) {
      return "Valores de geração parecem incorretos (muito baixos ou muito altos)";
    }

    return null;
  };

  // Inicializar dados quando o componente carrega
  useEffect(() => {
    if (useTableMode) {
      initializeTableData();
    }
  }, [useTableMode, inverterColumns.length]);

  const handleImport = () => {
    if (!isValid || parsedData.length === 0) {
      toast({
        title: "Dados Inválidos",
        description: "Corrija os erros antes de importar",
        variant: "destructive"
      });
      return;
    }

    onDataImported(parsedData);
    toast({
      title: "Dados Importados",
      description: `${parsedData.length} meses de dados PV*Sol importados com sucesso`
    });
  };

  const loadSampleData = () => {
    if (useTableMode) {
      // Carregar dados de exemplo na tabela
      const sampleValues = [850.5, 780.2, 920.8, 1050.3, 1180.7, 1220.4, 1250.9, 1190.6, 1080.2, 950.8, 820.3, 780.1];
      setParsedData(prev => prev.map((row, index) => ({
        ...row,
        generation: sampleValues[index] || 0
      })));
      validateTableData();
    } else {
      const parsed = parseData(sampleData);
      setParsedData(parsed);
      setIsValid(true);
    }
  };

  const totalGeneration = parsedData.reduce((sum, d) => sum + d.generation, 0);
  const avgMonthlyGeneration = parsedData.length > 0 ? totalGeneration / parsedData.length : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Importar Dados PV*Sol
          </CardTitle>
          <CardDescription>
            Importe dados de simulação do PV*Sol para usar na simulação Nível 2
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {useTableMode && inverterColumns.length > 0 && (
            <div className="mb-4">
              <h4 className="text-sm font-medium mb-2">Inversores Configurados:</h4>
              <div className="flex flex-wrap gap-2">
                {inverterColumns.map((inverter) => (
                  <Badge key={inverter} variant="outline">{inverter}</Badge>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" onClick={loadSampleData}>
              <Download className="h-4 w-4 mr-2" />
              Carregar Exemplo
            </Button>
            {useTableMode && (
              <>
                <Button variant="outline" onClick={handlePasteData}>
                  <Copy className="h-4 w-4 mr-2" />
                  Colar Dados
                </Button>
                <Button variant="outline" onClick={addInverterColumn}>
                  <Plus className="h-4 w-4 mr-2" />
                  Adicionar Inversor
                </Button>
              </>
            )}
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </div>

          {useTableMode ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Tabela de Dados PV*Sol</Label>
                <Badge variant="outline">{parsedData.length} meses</Badge>
              </div>
              
              <div className="border rounded-lg overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-32">Mês</TableHead>
                      <TableHead className="text-right">Geração Total (kWh)</TableHead>
                      {inverterColumns.map((inverter) => (
                        <TableHead key={inverter} className="text-right">
                          <div className="flex items-center justify-between">
                            <span>{inverter}</span>
                            {inverterColumns.length > 1 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => removeInverterColumn(inverter)}
                                className="h-6 w-6 p-0 ml-2"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            )}
                          </div>
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {parsedData.map((row) => (
                      <TableRow key={row.monthNumber}>
                        <TableCell className="font-medium">{row.month}</TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            step="0.1"
                            value={row.generation}
                            onChange={(e) => updateCellValue(row.monthNumber, 'generation', parseFloat(e.target.value) || 0)}
                            className="text-right"
                          />
                        </TableCell>
                        {inverterColumns.map((inverter) => (
                          <TableCell key={inverter}>
                            <Input
                              type="number"
                              step="0.1"
                              value={row.inverters?.[inverter] || 0}
                              onChange={(e) => updateCellValue(row.monthNumber, inverter, parseFloat(e.target.value) || 0)}
                              className="text-right"
                            />
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <p className="text-xs text-muted-foreground">
                💡 Dica: Use Ctrl+V para colar dados diretamente do Excel/PV*Sol ou preencha manualmente
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="pvsolData">Dados PV*Sol (Mês x Geração)</Label>
              <Textarea
                 id="pvsolData"
                 placeholder="Cole aqui os dados do PV*Sol no formato:&#10;Janeiro	850.5&#10;Fevereiro	780.2&#10;..."
                 rows={8}
                 className="font-mono text-sm"
               />
              <p className="text-xs text-muted-foreground">
                Formatos aceitos: separados por tab, vírgula, ponto-e-vírgula ou espaço
              </p>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isValid && (
            <Alert>
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                Dados válidos! {parsedData.length} meses encontrados.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {parsedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview dos Dados</CardTitle>
            <CardDescription>
              Verifique se os dados estão corretos antes de importar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{parsedData.length}</div>
                <div className="text-sm text-muted-foreground">Meses</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">{totalGeneration.toFixed(0)}</div>
                <div className="text-sm text-muted-foreground">kWh/ano</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">{avgMonthlyGeneration.toFixed(0)}</div>
                <div className="text-sm text-muted-foreground">kWh/mês médio</div>
              </div>
              <div className="text-center">
                <Badge variant={isValid ? "default" : "destructive"} className="text-lg px-3 py-1">
                  {isValid ? "Válido" : "Inválido"}
                </Badge>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Mês</TableHead>
                    <TableHead className="text-right">Geração (kWh)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.map((data) => (
                    <TableRow key={data.monthNumber}>
                      <TableCell className="font-medium">{data.month}</TableCell>
                      <TableCell className="text-right">{data.generation.toFixed(1)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button onClick={handleImport} disabled={!isValid}>
                <Upload className="h-4 w-4 mr-2" />
                Importar Dados
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}