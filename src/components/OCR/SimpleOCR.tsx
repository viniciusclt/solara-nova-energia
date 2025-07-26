import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { 
  FileText, 
  Upload, 
  Eye, 
  Download,
  Loader2,
  CheckCircle,
  AlertCircle,
  Copy,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/useToast';
import { useDropzone } from 'react-dropzone';

interface ExtractedData {
  cliente?: string;
  valor?: string;
  potencia?: string;
  endereco?: string;
  telefone?: string;
  email?: string;
  dataVencimento?: string;
  observacoes?: string;
}

interface OCRResult {
  id: string;
  fileName: string;
  fileSize: number;
  extractedText: string;
  extractedData: ExtractedData;
  confidence: number;
  processedAt: string;
  status: 'processing' | 'completed' | 'error';
}

interface SimpleOCRProps {
  onDataExtracted?: (data: ExtractedData) => void;
  className?: string;
}

export const SimpleOCR: React.FC<SimpleOCRProps> = ({
  onDataExtracted,
  className
}) => {
  const { toast } = useToast();
  const [results, setResults] = useState<OCRResult[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedResult, setSelectedResult] = useState<string>('');

  // Patterns para extração de dados específicos
  const extractionPatterns = useMemo(() => ({
    cliente: [
      /Cliente:\s*(.+?)(?:\n|$)/gi,
      /Nome:\s*(.+?)(?:\n|$)/gi,
      /Razão Social:\s*(.+?)(?:\n|$)/gi
    ],
    valor: [
      /R\$\s*([\d.,]+)/g,
      /Valor:\s*R\$\s*([\d.,]+)/gi,
      /Total:\s*R\$\s*([\d.,]+)/gi,
      /Preço:\s*R\$\s*([\d.,]+)/gi
    ],
    potencia: [
      /(\d+(?:,\d+)?)\s*kWp?/gi,
      /Potência:\s*(\d+(?:,\d+)?)\s*kW/gi,
      /(\d+(?:,\d+)?)\s*W/gi
    ],
    endereco: [
      /Endereço:\s*(.+?)(?:\n|$)/gi,
      /Rua\s+(.+?)(?:\n|$)/gi,
      /Av\.?\s+(.+?)(?:\n|$)/gi
    ],
    telefone: [
      /\(?\d{2}\)?\s*\d{4,5}-?\d{4}/g,
      /Telefone:\s*([\d\s()-]+)/gi,
      /Celular:\s*([\d\s()-]+)/gi
    ],
    email: [
      /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
      /E-mail:\s*([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi
    ],
    dataVencimento: [
      /\d{1,2}\/\d{1,2}\/\d{4}/g,
      /Vencimento:\s*(\d{1,2}\/\d{1,2}\/\d{4})/gi,
      /Validade:\s*(\d{1,2}\/\d{1,2}\/\d{4})/gi
    ]
  }), []);

  // Simular OCR (em produção, usaria Tesseract.js ou API externa)
  const simulateOCR = async (file: File): Promise<string> => {
    // Simular processamento com delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Texto simulado baseado no nome do arquivo
    const mockTexts = {
      'proposta': `
        PROPOSTA COMERCIAL
        Cliente: João Silva Santos
        Endereço: Rua das Flores, 123 - São Paulo/SP
        Telefone: (11) 99999-9999
        E-mail: joao.silva@email.com
        
        SISTEMA FOTOVOLTAICO
        Potência: 10,5 kWp
        Valor Total: R$ 45.000,00
        Prazo de Instalação: 30 dias
        Validade: 15/03/2025
        
        Observações:
        - Inclui projeto, instalação e homologação
        - Garantia de 25 anos nos módulos
        - Monitoramento remoto incluído
      `,
      'orcamento': `
        ORÇAMENTO Nº 2025001
        
        Razão Social: Maria Oliveira ME
        Endereço: Av. Paulista, 1000 - São Paulo/SP
        Telefone: (11) 88888-8888
        E-mail: maria@empresa.com.br
        
        SISTEMA SOLAR
        Potência: 15 kWp
        Preço: R$ 67.500,00
        Vencimento: 28/02/2025
        
        Detalhes:
        - 40 módulos de 375W
        - 1 inversor de 15kW
        - Estrutura de fixação incluída
      `,
      'contrato': `
        CONTRATO DE PRESTAÇÃO DE SERVIÇOS
        
        Contratante: Pedro Costa Ltda
        Endereço: Rua do Comércio, 456 - Rio de Janeiro/RJ
        Celular: (21) 77777-7777
        E-mail: pedro@costa.com.br
        
        PROJETO SOLAR
        Potência: 8,2 kWp
        Valor: R$ 35.800,00
        Data de Vencimento: 10/04/2025
        
        Observações:
        Sistema residencial com backup
        Monitoramento via app móvel
      `
    };
    
    // Selecionar texto baseado no nome do arquivo
    const fileName = file.name.toLowerCase();
    if (fileName.includes('proposta')) return mockTexts.proposta;
    if (fileName.includes('orcamento') || fileName.includes('orçamento')) return mockTexts.orcamento;
    if (fileName.includes('contrato')) return mockTexts.contrato;
    
    // Texto padrão
    return mockTexts.proposta;
  };

  // Extrair dados estruturados do texto
  const extractStructuredData = useCallback((text: string): ExtractedData => {
    const extracted: ExtractedData = {};
    
    Object.entries(extractionPatterns).forEach(([key, patterns]) => {
      for (const pattern of patterns) {
        const matches = text.match(pattern);
        if (matches && matches.length > 0) {
          // Limpar e formatar o resultado
          let value = matches[0];
          
          // Remover prefixos comuns
          value = value.replace(/^(Cliente:|Nome:|Valor:|Potência:|Endereço:|Telefone:|E-mail:|Vencimento:|Validade:)\s*/gi, '');
          value = value.trim();
          
          extracted[key as keyof ExtractedData] = value;
          break; // Usar apenas a primeira correspondência
        }
      }
    });
    
    return extracted;
  }, [extractionPatterns]);

  // Processar arquivo
  const processFile = useCallback(async (file: File) => {
    if (!file) return;
    
    // Validar tipo de arquivo
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Tipo de arquivo não suportado",
        description: "Apenas PDF, JPG e PNG são aceitos",
        variant: "destructive"
      });
      return;
    }
    
    // Validar tamanho (máximo 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 10MB",
        variant: "destructive"
      });
      return;
    }
    
    const resultId = `ocr-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Criar resultado inicial
    const initialResult: OCRResult = {
      id: resultId,
      fileName: file.name,
      fileSize: file.size,
      extractedText: '',
      extractedData: {},
      confidence: 0,
      processedAt: new Date().toISOString(),
      status: 'processing'
    };
    
    setResults(prev => [initialResult, ...prev]);
    setIsProcessing(true);
    setProgress(0);
    
    try {
      // Simular progresso
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);
      
      // Processar OCR
      const extractedText = await simulateOCR(file);
      const extractedData = extractStructuredData(extractedText);
      
      // Calcular confiança baseada na quantidade de dados extraídos
      const dataKeys = Object.keys(extractedData).length;
      const confidence = Math.min(95, Math.max(60, dataKeys * 15));
      
      clearInterval(progressInterval);
      setProgress(100);
      
      // Atualizar resultado
      const completedResult: OCRResult = {
        ...initialResult,
        extractedText,
        extractedData,
        confidence,
        status: 'completed'
      };
      
      setResults(prev => prev.map(r => r.id === resultId ? completedResult : r));
      
      // Callback com dados extraídos
      if (onDataExtracted) {
        onDataExtracted(extractedData);
      }
      
      toast({
        title: "OCR Concluído",
        description: `${dataKeys} campos extraídos com ${confidence}% de confiança`,
        variant: "default"
      });
      
    } catch (error) {
      console.error('❌ Erro no OCR:', error);
      
      setResults(prev => prev.map(r => 
        r.id === resultId 
          ? { ...r, status: 'error' as const }
          : r
      ));
      
      toast({
        title: "Erro no OCR",
        description: "Falha ao processar o arquivo",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
      setProgress(0);
    }
  }, [onDataExtracted, toast, extractStructuredData]);

  // Configurar dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop: (acceptedFiles) => {
      if (acceptedFiles.length > 0) {
        processFile(acceptedFiles[0]);
      }
    },
    accept: {
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png']
    },
    multiple: false,
    disabled: isProcessing
  });

  // Copiar dados extraídos
  const copyExtractedData = (data: ExtractedData) => {
    const formatted = Object.entries(data)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
    
    navigator.clipboard.writeText(formatted);
    
    toast({
      title: "Dados Copiados",
      description: "Dados extraídos copiados para a área de transferência",
      variant: "default"
    });
  };

  // Remover resultado
  const removeResult = (id: string) => {
    setResults(prev => prev.filter(r => r.id !== id));
    if (selectedResult === id) {
      setSelectedResult('');
    }
  };

  // Exportar resultados
  const exportResults = () => {
    const exportData = {
      results,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocr-results-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedResultData = results.find(r => r.id === selectedResult);

  return (
    <div className={`w-full h-full ${className}`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            <h2 className="text-lg font-semibold">OCR para Propostas</h2>
          </div>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={exportResults}
              disabled={results.length === 0}
            >
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar - Upload e Resultados */}
          <div className="w-80 border-r bg-gray-50 p-4 overflow-y-auto">
            {/* Upload Area */}
            <Card className="mb-4">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Upload de Arquivo</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  {...getRootProps()}
                  className={`
                    border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors
                    ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
                    ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
                  `}
                >
                  <input {...getInputProps()} />
                  
                  {isProcessing ? (
                    <div className="space-y-2">
                      <Loader2 className="h-8 w-8 mx-auto animate-spin text-blue-500" />
                      <p className="text-sm text-gray-600">Processando...</p>
                      <Progress value={progress} className="w-full" />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <Upload className="h-8 w-8 mx-auto text-gray-400" />
                      <p className="text-sm text-gray-600">
                        {isDragActive
                          ? 'Solte o arquivo aqui'
                          : 'Arraste um arquivo ou clique para selecionar'
                        }
                      </p>
                      <p className="text-xs text-gray-500">
                        PDF, JPG, PNG (máx. 10MB)
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Lista de Resultados */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Resultados ({results.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {results.length === 0 ? (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Nenhum arquivo processado ainda
                  </p>
                ) : (
                  results.map(result => (
                    <div
                      key={result.id}
                      className={`
                        p-3 rounded-lg border cursor-pointer transition-colors
                        ${selectedResult === result.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                      `}
                      onClick={() => setSelectedResult(result.id)}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate">
                          {result.fileName}
                        </span>
                        
                        <div className="flex items-center gap-1">
                          {result.status === 'processing' && (
                            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
                          )}
                          {result.status === 'completed' && (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          )}
                          {result.status === 'error' && (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                          )}
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeResult(result.id);
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{(result.fileSize / 1024).toFixed(1)} KB</span>
                        {result.status === 'completed' && (
                          <Badge variant="outline" className="text-xs">
                            {result.confidence}% confiança
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          {/* Área Principal - Detalhes do Resultado */}
          <div className="flex-1 p-4 overflow-auto">
            {selectedResultData ? (
              <div className="space-y-4">
                {/* Cabeçalho do Resultado */}
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold">{selectedResultData.fileName}</h3>
                    <p className="text-sm text-gray-600">
                      Processado em {new Date(selectedResultData.processedAt).toLocaleString()}
                    </p>
                  </div>
                  
                  {selectedResultData.status === 'completed' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyExtractedData(selectedResultData.extractedData)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copiar Dados
                    </Button>
                  )}
                </div>

                {/* Dados Extraídos */}
                {selectedResultData.status === 'completed' && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Dados Extraídos</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {Object.entries(selectedResultData.extractedData).map(([key, value]) => (
                        <div key={key}>
                          <Label className="text-xs font-medium text-gray-600 uppercase">
                            {key}
                          </Label>
                          <Input
                            value={value || ''}
                            readOnly
                            className="mt-1"
                          />
                        </div>
                      ))}
                      
                      {Object.keys(selectedResultData.extractedData).length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-4">
                          Nenhum dado estruturado foi extraído
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Texto Completo */}
                {selectedResultData.status === 'completed' && selectedResultData.extractedText && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Texto Extraído</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <Textarea
                        value={selectedResultData.extractedText}
                        readOnly
                        className="min-h-[300px] font-mono text-sm"
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Status de Erro */}
                {selectedResultData.status === 'error' && (
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center py-8">
                        <AlertCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
                        <h3 className="text-lg font-semibold text-red-700 mb-2">
                          Erro no Processamento
                        </h3>
                        <p className="text-gray-600">
                          Não foi possível processar este arquivo. Tente novamente ou use um arquivo diferente.
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Eye className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    Selecione um Resultado
                  </h3>
                  <p className="text-gray-600">
                    Faça upload de um arquivo ou selecione um resultado da lista para visualizar os detalhes.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleOCR;