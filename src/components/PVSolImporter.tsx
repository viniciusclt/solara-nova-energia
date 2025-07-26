import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Upload, AlertCircle, CheckCircle, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface PVSolData {
  month: string;
  monthNumber: number;
  generation: number; // kWh
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

  const monthNames = [
    "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
    "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
  ];

  const sampleData = `Mês	Geração (kWh)
Janeiro	850.5
Fevereiro	780.2
Março	920.8
Abril	875.3
Maio	810.7
Junho	750.4
Julho	790.6
Agosto	825.9
Setembro	860.2
Outubro	890.1
Novembro	870.3
Dezembro	840.7`;

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

        // Find month number
        let monthNumber = -1;
        const monthLower = monthStr.toLowerCase();
        
        for (let i = 0; i < monthNames.length; i++) {
          if (monthNames[i].toLowerCase().includes(monthLower) || 
              monthLower.includes(monthNames[i].toLowerCase()) ||
              monthLower === (i + 1).toString().padStart(2, '0') ||
              monthLower === (i + 1).toString()) {
            monthNumber = i + 1;
            break;
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

  const handleDataChange = (value: string) => {
    setRawData(value);
    setError(null);
    setParsedData([]);
    setIsValid(false);

    if (!value.trim()) return;

    try {
      const parsed = parseData(value);
      const validationError = validateData(parsed);

      if (validationError) {
        setError(validationError);
        return;
      }

      setParsedData(parsed);
      setIsValid(true);
    } catch (error: unknown) {
      setError((error as Error).message || 'Erro ao processar os dados');
    }
  };

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
    setRawData(sampleData);
    handleDataChange(sampleData);
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
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadSampleData}>
              <Download className="h-4 w-4 mr-2" />
              Carregar Exemplo
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pvsolData">Dados PV*Sol (Mês x Geração)</Label>
            <Textarea
              id="pvsolData"
              placeholder="Cole aqui os dados do PV*Sol no formato:&#10;Janeiro	850.5&#10;Fevereiro	780.2&#10;..."
              value={rawData}
              onChange={(e) => handleDataChange(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Formatos aceitos: separados por tab, vírgula, ponto-e-vírgula ou espaço
            </p>
          </div>

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