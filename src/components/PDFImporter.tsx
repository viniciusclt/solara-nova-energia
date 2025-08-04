import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Upload, 
  Brain, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Download,
  Settings
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logInfo, logError } from '@/utils/secureLogger';
import PDFUploader from './PDFUploader';
import OCRProcessor from './OCRProcessor';

interface PDFFile {
  id: string;
  file: File;
  preview?: string;
  uploadProgress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  ocrData?: { text: string; confidence: number; extractedFields: Record<string, string | number> };
  downloadUrl?: string;
}

interface OCRData {
  id: string;
  fileName: string;
  rawText: string;
  confidence: number;
  extractedFields: Record<string, string | number>;
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

interface PDFImporterProps {
  onProductsImported?: (products: ProcessedProduct[]) => void;
  maxFiles?: number;
  maxFileSize?: number;
}

const PDFImporter: React.FC<PDFImporterProps> = ({
  onProductsImported,
  maxFiles = 10,
  maxFileSize = 10
}) => {
  const [currentTab, setCurrentTab] = useState('upload');
  const [processedFiles, setProcessedFiles] = useState<PDFFile[]>([]);
  const [ocrData, setOcrData] = useState<OCRData[]>([]);
  const [finalProducts, setFinalProducts] = useState<ProcessedProduct[]>([]);
  const [isImporting, setIsImporting] = useState(false);

  // Callback quando arquivos são processados no PDFUploader
  const handleFilesProcessed = useCallback((files: PDFFile[]) => {
    logInfo('Arquivos processados no PDFImporter', 'PDFImporter', { 
      filesCount: files.length 
    });
    setProcessedFiles(files);
    
    // Converter dados OCR dos arquivos processados
    const ocrDataArray: OCRData[] = files
      .filter(file => file.status === 'completed' && file.ocrData)
      .map(file => ({
        id: file.id,
        fileName: file.file.name,
        rawText: file.ocrData.text || '',
        confidence: file.ocrData.confidence || 0,
        extractedFields: file.ocrData.extractedFields || {},
        processedAt: new Date()
      }));
    
    setOcrData(ocrDataArray);
    
    // Avançar para a próxima aba se houver dados OCR
    if (ocrDataArray.length > 0) {
      setCurrentTab('process');
    }
  }, []);

  // Callback quando produtos são processados no OCRProcessor
  const handleProductsProcessed = useCallback((products: ProcessedProduct[]) => {
    logInfo('Produtos processados no PDFImporter', 'PDFImporter', { 
      productsCount: products.length 
    });
    setFinalProducts(products);
    setCurrentTab('review');
  }, []);

  // Função para salvar produtos no banco de dados
  const saveProductsToDatabase = async (products: ProcessedProduct[]): Promise<void> => {
    logInfo('Salvando produtos no banco de dados', 'PDFImporter', { 
      productsCount: products.length 
    });
    
    try {
      // Obter usuário atual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      // Obter perfil do usuário para pegar empresa_id
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        throw new Error('Perfil do usuário não encontrado');
      }

      // Preparar dados para inserção
      const productsToInsert = products.map(product => ({
        nome: product.nome,
        potencia: product.potencia,
        preco: parseFloat(product.preco) || 0,
        fabricante: product.fabricante,
        categoria: product.categoria,
        descricao: product.descricao,
        empresa_id: profile.empresa_id,
        created_by: user.id,
        // Campos técnicos adicionais
        eficiencia: product.eficiencia,
        tensao: product.tensao,
        corrente: product.corrente,
        dimensoes: product.dimensoes,
        peso: product.peso,
        garantia: product.garantia,
        certificacoes: product.certificacoes,
        // Metadados da importação
        fonte_importacao: 'PDF_OCR',
        arquivo_origem: product.sourceFile,
        confianca_ocr: product.confidence,
        verificado: product.verified
      }));

      // Inserir produtos no banco
      const { data, error } = await supabase
        .from('kits_financeiros')
        .insert(productsToInsert)
        .select();

      if (error) {
        logError('Erro ao inserir produtos no banco', 'PDFImporter', { 
          error: error.message 
        });
        throw new Error(`Erro ao salvar produtos: ${error.message}`);
      }

      logInfo('Produtos salvos com sucesso no banco', 'PDFImporter', { 
        savedCount: data?.length || 0 
      });
      
      // Notificar componente pai
      if (onProductsImported) {
        onProductsImported(products);
      }

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      logError('Erro ao salvar produtos', 'PDFImporter', { 
        error: errorMessage 
      });
      throw error;
    }
  };

  // Função para finalizar importação
  const finalizeImport = async () => {
    if (finalProducts.length === 0) {
      toast({
        title: "Nenhum Produto",
        description: "Não há produtos para importar.",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    
    try {
      await saveProductsToDatabase(finalProducts);
      
      toast({
        title: "Importação Concluída",
        description: `${finalProducts.length} produto(s) importado(s) com sucesso.`
      });

      // Reset do estado
      setProcessedFiles([]);
      setOcrData([]);
      setFinalProducts([]);
      setCurrentTab('upload');

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      logError('Erro na importação final', 'PDFImporter', { 
        error: errorMessage 
      });
      toast({
        title: "Erro na Importação",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Função para exportar produtos como JSON
  const exportProducts = () => {
    if (finalProducts.length === 0) return;

    const dataStr = JSON.stringify(finalProducts, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `produtos_importados_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
    
    toast({
      title: "Exportação Concluída",
      description: "Produtos exportados como JSON."
    });
  };

  const getTabStatus = (tab: string) => {
    switch (tab) {
      case 'upload':
        return processedFiles.length > 0 ? 'completed' : 'current';
      case 'process':
        if (processedFiles.length === 0) return 'disabled';
        return finalProducts.length > 0 ? 'completed' : 'current';
      case 'review':
        if (finalProducts.length === 0) return 'disabled';
        return 'current';
      default:
        return 'disabled';
    }
  };

  const getTabIcon = (tab: string, status: string) => {
    if (status === 'completed') {
      return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    }
    
    switch (tab) {
      case 'upload':
        return <Upload className="h-4 w-4" />;
      case 'process':
        return <Brain className="h-4 w-4" />;
      case 'review':
        return <FileText className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Importação de PDF com OCR Inteligente
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              Importe datasheets em PDF e extraia automaticamente informações de produtos
            </p>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  {processedFiles.length} arquivo(s)
                </Badge>
                <Badge variant="outline">
                  {finalProducts.length} produto(s)
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Processo em Abas */}
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger 
            value="upload" 
            disabled={getTabStatus('upload') === 'disabled'}
            className="flex items-center gap-2"
          >
            {getTabIcon('upload', getTabStatus('upload'))}
            1. Upload de PDFs
          </TabsTrigger>
          <TabsTrigger 
            value="process" 
            disabled={getTabStatus('process') === 'disabled'}
            className="flex items-center gap-2"
          >
            {getTabIcon('process', getTabStatus('process'))}
            2. Processamento OCR
          </TabsTrigger>
          <TabsTrigger 
            value="review" 
            disabled={getTabStatus('review') === 'disabled'}
            className="flex items-center gap-2"
          >
            {getTabIcon('review', getTabStatus('review'))}
            3. Revisão e Importação
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="mt-6">
          <PDFUploader
            onFilesProcessed={handleFilesProcessed}
            maxFiles={maxFiles}
            maxFileSize={maxFileSize}
          />
          
          {processedFiles.length > 0 && (
            <div className="mt-6 flex justify-end">
              <Button 
                onClick={() => setCurrentTab('process')}
                className="flex items-center gap-2"
              >
                Próximo: Processamento OCR
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="process" className="mt-6">
          <OCRProcessor
            ocrData={ocrData}
            onProductsProcessed={handleProductsProcessed}
            onSaveProducts={saveProductsToDatabase}
          />
          
          {finalProducts.length > 0 && (
            <div className="mt-6 flex justify-end">
              <Button 
                onClick={() => setCurrentTab('review')}
                className="flex items-center gap-2"
              >
                Próximo: Revisão Final
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          )}
        </TabsContent>

        <TabsContent value="review" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Revisão Final e Importação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Resumo */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{processedFiles.length}</div>
                  <div className="text-sm text-blue-600">Arquivos Processados</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{finalProducts.length}</div>
                  <div className="text-sm text-green-600">Produtos Extraídos</div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">
                    {finalProducts.filter(p => p.verified).length}
                  </div>
                  <div className="text-sm text-purple-600">Produtos Verificados</div>
                </div>
              </div>

              {/* Lista de Produtos */}
              {finalProducts.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-lg font-medium">Produtos a Importar</h3>
                  <div className="space-y-2 max-h-60 overflow-y-auto">
                    {finalProducts.map((product) => (
                      <div key={product.id} className="flex items-center justify-between p-3 border rounded">
                        <div className="flex items-center gap-3">
                          <FileText className="h-4 w-4 text-gray-500" />
                          <div>
                            <p className="font-medium">{product.nome}</p>
                            <p className="text-sm text-gray-500">
                              {product.fabricante} • {product.potencia} • R$ {product.preco}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={product.verified ? 'default' : 'secondary'}>
                            {product.verified ? 'Verificado' : 'Pendente'}
                          </Badge>
                          <Badge variant="outline">
                            {product.confidence}%
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Ações */}
              <div className="flex items-center justify-between pt-4 border-t">
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentTab('process')}
                  >
                    Voltar ao Processamento
                  </Button>
                  <Button
                    variant="outline"
                    onClick={exportProducts}
                    disabled={finalProducts.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar JSON
                  </Button>
                </div>
                <Button
                  onClick={finalizeImport}
                  disabled={isImporting || finalProducts.length === 0}
                  size="lg"
                >
                  {isImporting ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                  )}
                  {isImporting ? 'Importando...' : `Importar ${finalProducts.length} Produto(s)`}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Alertas */}
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Revise cuidadosamente os produtos antes de importar. Produtos não verificados 
              podem conter informações incorretas extraídas pelo OCR. Você pode voltar ao 
              processamento para fazer ajustes.
            </AlertDescription>
          </Alert>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PDFImporter;