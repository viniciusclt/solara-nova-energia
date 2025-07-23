import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { FileSpreadsheet, Upload, AlertCircle, CheckCircle, Download } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface KitData {
  nome: string;
  potencia: number;
  preco: number;
  precoWp: number;
  fabricante?: string;
  categoria?: string;
  descricao?: string;
}

interface ExcelImporterProps {
  onDataImported: (data: KitData[]) => void;
  onClose: () => void;
}

export function ExcelImporter({ onDataImported, onClose }: ExcelImporterProps) {
  const { toast } = useToast();
  const [rawData, setRawData] = useState("");
  const [parsedData, setParsedData] = useState<KitData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);

  const templateData = `Nome	Potência (kWp)	Preço (R$)	Fabricante	Categoria	Descrição
Kit 5.4kWp - Astronergy	5.4	15500	Astronergy	Residencial	Kit completo para residência pequena
Kit 7.2kWp - Canadian	7.2	18500	Canadian Solar	Residencial	Kit padrão residencial
Kit 8.4kWp - Jinko	8.4	22000	Jinko Solar	Residencial	Kit residencial premium
Kit 10.8kWp - Trina	10.8	28200	Trina Solar	Comercial	Kit para pequeno comércio
Kit 15.6kWp - LONGi	15.6	38500	LONGi Solar	Comercial	Kit comercial médio porte
Kit 20.4kWp - JA Solar	20.4	48200	JA Solar	Industrial	Kit para indústria pequena`;

  const parseData = (data: string): KitData[] => {
    try {
      const lines = data.trim().split('\n');
      
      // Remove header line if present
      const dataLines = lines.filter(line => 
        line.trim() && 
        !line.toLowerCase().includes('nome') && 
        !line.toLowerCase().includes('potência')
      );

      const parsed: KitData[] = [];

      for (const line of dataLines) {
        // Try different separators (tab, semicolon, comma)
        const separators = ['\t', ';', ','];
        let parts: string[] = [];
        
        for (const sep of separators) {
          const testParts = line.split(sep).map(p => p.trim()).filter(p => p);
          if (testParts.length >= 3) {
            parts = testParts;
            break;
          }
        }

        if (parts.length < 3) continue;

        const nome = parts[0]?.trim();
        const potenciaStr = parts[1]?.trim();
        const precoStr = parts[2]?.trim();
        const fabricante = parts[3]?.trim() || "";
        const categoria = parts[4]?.trim() || "";
        const descricao = parts[5]?.trim() || "";

        // Parse numeric values
        const potencia = parseFloat(potenciaStr.replace(',', '.'));
        const preco = parseFloat(precoStr.replace(/[^\d,.-]/g, '').replace(',', '.'));

        if (nome && !isNaN(potencia) && !isNaN(preco) && potencia > 0 && preco > 0) {
          const precoWp = preco / (potencia * 1000); // Converter kWp para Wp

          parsed.push({
            nome,
            potencia,
            preco,
            precoWp,
            fabricante,
            categoria,
            descricao
          });
        }
      }

      return parsed;
    } catch (error) {
      throw new Error('Erro ao processar os dados. Verifique o formato.');
    }
  };

  const validateData = (data: KitData[]): string | null => {
    if (data.length === 0) {
      return "Nenhum dado válido encontrado";
    }

    // Check for duplicate names
    const names = data.map(d => d.nome.toLowerCase());
    const uniqueNames = new Set(names);
    if (uniqueNames.size !== names.length) {
      return "Nomes de kits duplicados encontrados";
    }

    // Check for reasonable values
    const invalidKits = data.filter(kit => 
      kit.potencia < 0.5 || kit.potencia > 100 || 
      kit.preco < 1000 || kit.preco > 500000 ||
      kit.precoWp < 1 || kit.precoWp > 10
    );

    if (invalidKits.length > 0) {
      return `${invalidKits.length} kit(s) com valores fora da faixa esperada`;
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
        setParsedData(parsed); // Still show data for review
        return;
      }

      setParsedData(parsed);
      setIsValid(true);
    } catch (error: any) {
      setError(error.message || 'Erro ao processar os dados');
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
      title: "Kits Importados",
      description: `${parsedData.length} kits importados com sucesso`
    });
  };

  const loadTemplateData = () => {
    setRawData(templateData);
    handleDataChange(templateData);
  };

  const downloadTemplate = () => {
    const csvContent = templateData.replace(/\t/g, ',');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_kits_financeiros.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const totalValue = parsedData.reduce((sum, kit) => sum + kit.preco, 0);
  const avgPricePerWp = parsedData.length > 0 ? 
    parsedData.reduce((sum, kit) => sum + kit.precoWp, 0) / parsedData.length : 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-primary" />
            Importar Kits Financeiros
          </CardTitle>
          <CardDescription>
            Importe kits em massa a partir de dados Excel/CSV
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" onClick={loadTemplateData}>
              <Upload className="h-4 w-4 mr-2" />
              Carregar Exemplo
            </Button>
            <Button variant="outline" onClick={downloadTemplate}>
              <Download className="h-4 w-4 mr-2" />
              Baixar Template
            </Button>
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
          </div>

          <div className="space-y-2">
            <Label htmlFor="excelData">Dados dos Kits (Excel/CSV)</Label>
            <Textarea
              id="excelData"
              placeholder="Cole aqui os dados copiados do Excel no formato:&#10;Nome	Potência (kWp)	Preço (R$)	Fabricante	Categoria	Descrição&#10;Kit 5.4kWp - Astronergy	5.4	15500	Astronergy	Residencial	Kit completo..."
              value={rawData}
              onChange={(e) => handleDataChange(e.target.value)}
              rows={8}
              className="font-mono text-sm"
            />
            <p className="text-xs text-muted-foreground">
              Formatos aceitos: separados por tab (Excel), vírgula (CSV) ou ponto-e-vírgula
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
                Dados válidos! {parsedData.length} kits encontrados.
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {parsedData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Preview dos Kits</CardTitle>
            <CardDescription>
              Verifique se os dados estão corretos antes de importar
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary">{parsedData.length}</div>
                <div className="text-sm text-muted-foreground">Kits</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-secondary">R$ {(totalValue / 1000).toFixed(0)}k</div>
                <div className="text-sm text-muted-foreground">Valor Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-accent">R$ {avgPricePerWp.toFixed(2)}</div>
                <div className="text-sm text-muted-foreground">Preço/Wp Médio</div>
              </div>
              <div className="text-center">
                <Badge variant={isValid ? "default" : "destructive"} className="text-lg px-3 py-1">
                  {isValid ? "Válido" : "Atenção"}
                </Badge>
              </div>
            </div>

            <div className="border rounded-lg overflow-hidden max-h-96 overflow-y-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Potência</TableHead>
                    <TableHead>Preço</TableHead>
                    <TableHead>R$/Wp</TableHead>
                    <TableHead>Fabricante</TableHead>
                    <TableHead>Categoria</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {parsedData.map((kit, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{kit.nome}</TableCell>
                      <TableCell>{kit.potencia} kWp</TableCell>
                      <TableCell>R$ {kit.preco.toLocaleString()}</TableCell>
                      <TableCell>R$ {kit.precoWp.toFixed(2)}</TableCell>
                      <TableCell>{kit.fabricante}</TableCell>
                      <TableCell>
                        {kit.categoria && (
                          <Badge variant="outline">{kit.categoria}</Badge>
                        )}
                      </TableCell>
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
                Importar {parsedData.length} Kits
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}