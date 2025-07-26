import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Brain, 
  CheckCircle2, 
  AlertCircle, 
  Edit3, 
  Save, 
  RefreshCw, 
  FileText,
  Zap,
  Settings,
  Download
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ExtractedField {
  key: string;
  value: string;
  confidence: number;
  verified: boolean;
  edited: boolean;
}

interface OCRData {
  id: string;
  fileName: string;
  rawText: string;
  confidence: number;
  extractedFields: Record<string, unknown>;
  processedAt: Date;
}

interface ProcessedProduct {
  id: string;
  sourceFile: string;
  nome: string;
  potencia: string;
  preco: string;
  fabricante: string;
  categoria: string;
  descricao: string;
  eficiencia?: string;
  tensao?: string;
  corrente?: string;
  dimensoes?: string;
  peso?: string;
  garantia?: string;
  certificacoes?: string;
  confidence: number;
  verified: boolean;
}

interface OCRProcessorProps {
  ocrData: OCRData[];
  onProductsProcessed?: (products: ProcessedProduct[]) => void;
  onSaveProducts?: (products: ProcessedProduct[]) => Promise<void>;
}

const OCRProcessor: React.FC<OCRProcessorProps> = ({
  ocrData,
  onProductsProcessed,
  onSaveProducts
}) => {
  const [processedProducts, setProcessedProducts] = useState<ProcessedProduct[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);
  const [processingProgress, setProcessingProgress] = useState(0);

  // Categorias disponíveis para seleção
  const categorias = [
    'Módulo Fotovoltaico',
    'Inversor',
    'Estrutura de Fixação',
    'Cabo Solar',
    'Conector MC4',
    'String Box',
    'Medidor Bidirecional',
    'Outros'
  ];

  // Fabricantes conhecidos
  const fabricantesConhecidos = [
    'Canadian Solar',
    'Jinko Solar',
    'Trina Solar',
    'JA Solar',
    'LONGi Solar',
    'Risen Energy',
    'Fronius',
    'SMA',
    'ABB',
    'Growatt',
    'Sungrow',
    'Huawei'
  ];

  useEffect(() => {
    if (ocrData.length > 0 && processedProducts.length === 0) {
      processOCRData();
    }
  }, [ocrData]);

  const processOCRData = async () => {
    if (ocrData.length === 0) return;

    setIsProcessing(true);
    setProcessingProgress(0);
    console.log('[OCRProcessor] Iniciando processamento de', ocrData.length, 'arquivos OCR');

    try {
      const products: ProcessedProduct[] = [];

      for (let i = 0; i < ocrData.length; i++) {
        const data = ocrData[i];
        console.log(`[OCRProcessor] Processando arquivo: ${data.fileName}`);

        // Simular processamento inteligente
        await new Promise(resolve => setTimeout(resolve, 1000));

        const product = await extractProductFromOCR(data);
        products.push(product);

        setProcessingProgress(((i + 1) / ocrData.length) * 100);
      }

      setProcessedProducts(products);
      
      if (onProductsProcessed) {
        onProductsProcessed(products);
      }

      toast({
        title: "Processamento Concluído",
        description: `${products.length} produto(s) extraído(s) com sucesso.`
      });

    } catch (error: unknown) {
      console.error('[OCRProcessor] Erro no processamento:', error);
      toast({
        title: "Erro no Processamento",
        description: (error as Error).message || 'Erro desconhecido',
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const extractProductFromOCR = async (data: OCRData): Promise<ProcessedProduct> => {
    // Simulação de extração inteligente de dados
    const text = data.rawText.toLowerCase();
    
    // Extrair nome/modelo
    const nome = data.extractedFields.modelo || 
               data.extractedFields.model || 
               data.fileName.replace('.pdf', '').replace(/[^a-zA-Z0-9\s]/g, '');
    
    // Extrair potência
    let potencia = data.extractedFields.potencia || data.extractedFields.power || '';
    if (!potencia) {
      const potenciaMatch = text.match(/(\d+)\s*w(?:att)?/i);
      if (potenciaMatch) {
        potencia = `${potenciaMatch[1]}W`;
      }
    }

    // Extrair fabricante
    let fabricante = data.extractedFields.fabricante || data.extractedFields.manufacturer || '';
    if (!fabricante) {
      for (const fab of fabricantesConhecidos) {
        if (text.includes(fab.toLowerCase())) {
          fabricante = fab;
          break;
        }
      }
    }

    // Determinar categoria baseada no conteúdo
    let categoria = 'Módulo Fotovoltaico'; // padrão
    if (text.includes('inversor') || text.includes('inverter')) {
      categoria = 'Inversor';
    } else if (text.includes('estrutura') || text.includes('mounting')) {
      categoria = 'Estrutura de Fixação';
    } else if (text.includes('cabo') || text.includes('cable')) {
      categoria = 'Cabo Solar';
    }

    // Extrair eficiência
    let eficiencia = data.extractedFields.eficiencia || '';
    if (!eficiencia) {
      const eficienciaMatch = text.match(/(\d+\.?\d*)\s*%/);
      if (eficienciaMatch) {
        eficiencia = `${eficienciaMatch[1]}%`;
      }
    }

    // Gerar preço estimado (simulação)
    const precoEstimado = potencia ? 
      (parseInt(potencia.replace(/\D/g, '')) * 1.5).toFixed(2) : 
      '0.00';

    return {
      id: `product-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sourceFile: data.fileName,
      nome: nome || 'Produto Sem Nome',
      potencia: potencia || 'N/A',
      preco: precoEstimado,
      fabricante: fabricante || 'Fabricante Desconhecido',
      categoria,
      descricao: `Produto extraído automaticamente de ${data.fileName}`,
      eficiencia,
      confidence: data.confidence,
      verified: false
    };
  };

  const updateProduct = (productId: string, field: string, value: string) => {
    setProcessedProducts(prev => 
      prev.map(product => 
        product.id === productId 
          ? { ...product, [field]: value, verified: true }
          : product
      )
    );
  };

  const verifyProduct = (productId: string) => {
    setProcessedProducts(prev => 
      prev.map(product => 
        product.id === productId 
          ? { ...product, verified: true }
          : product
      )
    );
  };

  const saveProducts = async () => {
    if (!onSaveProducts) {
      toast({
        title: "Função de Salvamento",
        description: "Função de salvamento não configurada.",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    console.log('[OCRProcessor] Salvando', processedProducts.length, 'produtos');

    try {
      await onSaveProducts(processedProducts);
      
      toast({
        title: "Produtos Salvos",
        description: `${processedProducts.length} produto(s) salvo(s) com sucesso.`
      });

    } catch (error: unknown) {
      console.error('[OCRProcessor] Erro ao salvar produtos:', error);
      toast({
        title: "Erro ao Salvar",
        description: error instanceof Error ? error.message : 'Erro desconhecido',
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return 'text-green-600';
    if (confidence >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConfidenceBadge = (confidence: number) => {
    if (confidence >= 80) return 'default';
    if (confidence >= 60) return 'secondary';
    return 'destructive';
  };

  if (ocrData.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Nenhum dado OCR para processar</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Processamento Inteligente OCR
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isProcessing ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <span>Processando dados OCR...</span>
              </div>
              <Progress value={processingProgress} className="h-2" />
              <p className="text-sm text-gray-500">
                {Math.round(processingProgress)}% concluído
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-lg font-medium">
                  {processedProducts.length} produto(s) processado(s)
                </p>
                <p className="text-sm text-gray-500">
                  {processedProducts.filter(p => p.verified).length} verificado(s)
                </p>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={processOCRData}
                  disabled={isProcessing}
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reprocessar
                </Button>
                <Button
                  onClick={saveProducts}
                  disabled={isSaving || processedProducts.length === 0}
                >
                  {isSaving ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  {isSaving ? 'Salvando...' : 'Salvar Produtos'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Lista de Produtos */}
      {processedProducts.length > 0 && (
        <div className="grid gap-4">
          {processedProducts.map((product) => (
            <Card key={product.id} className={`${product.verified ? 'border-green-200' : 'border-yellow-200'}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-500" />
                    <div>
                      <h3 className="font-medium">{product.nome}</h3>
                      <p className="text-sm text-gray-500">Fonte: {product.sourceFile}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={getConfidenceBadge(product.confidence)}
                      className={getConfidenceColor(product.confidence)}
                    >
                      {product.confidence}% confiança
                    </Badge>
                    {product.verified ? (
                      <Badge variant="default">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Verificado
                      </Badge>
                    ) : (
                      <Badge variant="secondary">
                        <AlertCircle className="h-3 w-3 mr-1" />
                        Pendente
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="basico" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="basico">Dados Básicos</TabsTrigger>
                    <TabsTrigger value="tecnico">Dados Técnicos</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="basico" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`nome-${product.id}`}>Nome/Modelo</Label>
                        <Input
                          id={`nome-${product.id}`}
                          value={product.nome}
                          onChange={(e) => updateProduct(product.id, 'nome', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`fabricante-${product.id}`}>Fabricante</Label>
                        <Select
                          value={product.fabricante}
                          onValueChange={(value) => updateProduct(product.id, 'fabricante', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {fabricantesConhecidos.map(fab => (
                              <SelectItem key={fab} value={fab}>{fab}</SelectItem>
                            ))}
                            <SelectItem value="outro">Outro</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor={`categoria-${product.id}`}>Categoria</Label>
                        <Select
                          value={product.categoria}
                          onValueChange={(value) => updateProduct(product.id, 'categoria', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {categorias.map(cat => (
                              <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor={`preco-${product.id}`}>Preço (R$)</Label>
                        <Input
                          id={`preco-${product.id}`}
                          value={product.preco}
                          onChange={(e) => updateProduct(product.id, 'preco', e.target.value)}
                          type="number"
                          step="0.01"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor={`descricao-${product.id}`}>Descrição</Label>
                      <Textarea
                        id={`descricao-${product.id}`}
                        value={product.descricao}
                        onChange={(e) => updateProduct(product.id, 'descricao', e.target.value)}
                        rows={3}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="tecnico" className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor={`potencia-${product.id}`}>Potência</Label>
                        <Input
                          id={`potencia-${product.id}`}
                          value={product.potencia}
                          onChange={(e) => updateProduct(product.id, 'potencia', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`eficiencia-${product.id}`}>Eficiência</Label>
                        <Input
                          id={`eficiencia-${product.id}`}
                          value={product.eficiencia || ''}
                          onChange={(e) => updateProduct(product.id, 'eficiencia', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`tensao-${product.id}`}>Tensão</Label>
                        <Input
                          id={`tensao-${product.id}`}
                          value={product.tensao || ''}
                          onChange={(e) => updateProduct(product.id, 'tensao', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label htmlFor={`garantia-${product.id}`}>Garantia</Label>
                        <Input
                          id={`garantia-${product.id}`}
                          value={product.garantia || ''}
                          onChange={(e) => updateProduct(product.id, 'garantia', e.target.value)}
                        />
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
                
                <div className="flex justify-end mt-4">
                  {!product.verified && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => verifyProduct(product.id)}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Verificar Dados
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Alertas */}
      {processedProducts.length > 0 && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Revise os dados extraídos antes de salvar. Produtos com baixa confiança (abaixo de 60%) 
            devem ser verificados manualmente. Clique em "Verificar Dados" após revisar cada produto.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default OCRProcessor;