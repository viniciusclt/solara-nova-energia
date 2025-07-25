import React, { useState, useCallback } from 'react';
import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Eye, Download, RefreshCw, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Configurar o worker do PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

interface ExtractedData {
  potencia?: string;
  tensaoVoc?: string;
  tensaoVmp?: string;
  correnteIsc?: string;
  correnteImp?: string;
  eficiencia?: string;
  dimensoes?: {
    comprimento?: string;
    largura?: string;
    espessura?: string;
  };
  peso?: string;
  garantiasProduto?: string;
  garantiasPerformance?: string;
  certificacoes?: string[];
  fabricante?: string;
  modelo?: string;
  tecnologia?: string;
  [key: string]: any;
}

interface OCRProcessorProps {
  file: File;
  onDataExtracted: (data: ExtractedData) => void;
  onProgress: (progress: number) => void;
  onError: (error: string) => void;
  equipmentType: 'module' | 'inverter' | 'battery';
}

export const OCRProcessor: React.FC<OCRProcessorProps> = ({
  file,
  onDataExtracted,
  onProgress,
  onError,
  equipmentType
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedText, setExtractedText] = useState<string>('');
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [currentStep, setCurrentStep] = useState<string>('');
  const [confidence, setConfidence] = useState<number>(0);
  const { toast } = useToast();

  // Patterns de reconhecimento para diferentes tipos de equipamentos
  const getPatterns = (type: 'module' | 'inverter' | 'battery') => {
    const basePatterns = {
      potencia: [
        /(?:potência|power|puissance)\s*:?\s*([0-9,\.]+)\s*(?:w|wp|watt|watts)/gi,
        /([0-9,\.]+)\s*(?:w|wp|watt|watts)\s*(?:potência|power|puissance)/gi,
        /(?:pmax|p-max|maximum power)\s*:?\s*([0-9,\.]+)\s*(?:w|wp)/gi
      ],
      tensaoVoc: [
        /(?:voc|v-oc|open circuit voltage|tensão circuito aberto)\s*:?\s*([0-9,\.]+)\s*(?:v|volt|volts)/gi,
        /([0-9,\.]+)\s*(?:v|volt|volts)\s*(?:voc|v-oc)/gi
      ],
      tensaoVmp: [
        /(?:vmp|v-mp|vmpp|voltage at maximum power|tensão potência máxima)\s*:?\s*([0-9,\.]+)\s*(?:v|volt|volts)/gi,
        /([0-9,\.]+)\s*(?:v|volt|volts)\s*(?:vmp|v-mp|vmpp)/gi
      ],
      correnteIsc: [
        /(?:isc|i-sc|short circuit current|corrente curto circuito)\s*:?\s*([0-9,\.]+)\s*(?:a|amp|ampere|amperes)/gi,
        /([0-9,\.]+)\s*(?:a|amp|ampere|amperes)\s*(?:isc|i-sc)/gi
      ],
      correnteImp: [
        /(?:imp|i-mp|impp|current at maximum power|corrente potência máxima)\s*:?\s*([0-9,\.]+)\s*(?:a|amp|ampere|amperes)/gi,
        /([0-9,\.]+)\s*(?:a|amp|ampere|amperes)\s*(?:imp|i-mp|impp)/gi
      ],
      eficiencia: [
        /(?:eficiência|efficiency|rendement)\s*:?\s*([0-9,\.]+)\s*%/gi,
        /([0-9,\.]+)\s*%\s*(?:eficiência|efficiency|rendement)/gi
      ],
      peso: [
        /(?:peso|weight|poids)\s*:?\s*([0-9,\.]+)\s*(?:kg|kilogram|kilograms)/gi,
        /([0-9,\.]+)\s*(?:kg|kilogram|kilograms)\s*(?:peso|weight|poids)/gi
      ],
      dimensoes: [
        /(?:dimensões|dimensions|taille)\s*:?\s*([0-9,\.]+)\s*(?:x|×)\s*([0-9,\.]+)\s*(?:x|×)\s*([0-9,\.]+)\s*(?:mm|cm|m)/gi,
        /([0-9,\.]+)\s*(?:mm|cm|m)\s*(?:x|×)\s*([0-9,\.]+)\s*(?:mm|cm|m)\s*(?:x|×)\s*([0-9,\.]+)\s*(?:mm|cm|m)/gi
      ],
      garantiasProduto: [
        /(?:garantia produto|product warranty|garantie produit)\s*:?\s*([0-9]+)\s*(?:anos|years|ans)/gi,
        /([0-9]+)\s*(?:anos|years|ans)\s*(?:garantia produto|product warranty|garantie produit)/gi
      ],
      garantiasPerformance: [
        /(?:garantia performance|performance warranty|garantie performance)\s*:?\s*([0-9]+)\s*(?:anos|years|ans)/gi,
        /([0-9]+)\s*(?:anos|years|ans)\s*(?:garantia performance|performance warranty|garantie performance)/gi
      ],
      certificacoes: [
        /(?:iec|ul|ce|inmetro|aneel|tuv|cec)\s*[0-9\-\s]*/gi
      ],
      fabricante: [
        /(?:fabricante|manufacturer|fabricant)\s*:?\s*([a-zA-Z\s]+)/gi,
        /(?:marca|brand|marque)\s*:?\s*([a-zA-Z\s]+)/gi
      ],
      modelo: [
        /(?:modelo|model|modèle)\s*:?\s*([a-zA-Z0-9\-\s]+)/gi,
        /(?:tipo|type)\s*:?\s*([a-zA-Z0-9\-\s]+)/gi
      ],
      tecnologia: [
        /(?:tecnologia|technology|technologie)\s*:?\s*([a-zA-Z\s]+)/gi,
        /(?:monocristalino|policristalino|amorfo|mono|poly|crystalline|silicon)/gi
      ]
    };

    // Patterns específicos para inversores
    if (type === 'inverter') {
      return {
        ...basePatterns,
        potenciaDC: [
          /(?:potência dc|dc power|puissance dc)\s*:?\s*([0-9,\.]+)\s*(?:w|wp|kw|kwp)/gi
        ],
        potenciaAC: [
          /(?:potência ac|ac power|puissance ac)\s*:?\s*([0-9,\.]+)\s*(?:w|wp|kw|kwp)/gi
        ],
        tensaoDC: [
          /(?:tensão dc|dc voltage|tension dc)\s*:?\s*([0-9,\.\-]+)\s*(?:v|volt|volts)/gi
        ],
        tensaoAC: [
          /(?:tensão ac|ac voltage|tension ac)\s*:?\s*([0-9,\.]+)\s*(?:v|volt|volts)/gi
        ],
        frequencia: [
          /(?:frequência|frequency|fréquence)\s*:?\s*([0-9,\.]+)\s*(?:hz|hertz)/gi
        ],
        fases: [
          /(?:fases|phases|phase)\s*:?\s*([0-9]+)/gi,
          /(monofásico|bifásico|trifásico|single phase|three phase)/gi
        ]
      };
    }

    // Patterns específicos para baterias
    if (type === 'battery') {
      return {
        ...basePatterns,
        capacidade: [
          /(?:capacidade|capacity|capacité)\s*:?\s*([0-9,\.]+)\s*(?:ah|kwh|wh)/gi
        ],
        tensaoNominal: [
          /(?:tensão nominal|nominal voltage|tension nominale)\s*:?\s*([0-9,\.]+)\s*(?:v|volt|volts)/gi
        ],
        ciclosVida: [
          /(?:ciclos vida|life cycles|cycles de vie)\s*:?\s*([0-9,\.]+)/gi
        ],
        profundidadeDescarga: [
          /(?:dod|depth of discharge|profondeur décharge)\s*:?\s*([0-9,\.]+)\s*%/gi
        ]
      };
    }

    return basePatterns;
  };

  const extractDataFromText = (text: string): ExtractedData => {
    const patterns = getPatterns(equipmentType);
    const data: ExtractedData = {};
    let totalMatches = 0;
    let successfulMatches = 0;

    Object.entries(patterns).forEach(([key, regexArray]) => {
      for (const regex of regexArray) {
        totalMatches++;
        const matches = text.match(regex);
        if (matches && matches.length > 0) {
          successfulMatches++;
          
          if (key === 'dimensoes') {
            // Processar dimensões especialmente
            const dimensionMatch = text.match(/([0-9,\.]+)\s*(?:x|×)\s*([0-9,\.]+)\s*(?:x|×)\s*([0-9,\.]+)/gi);
            if (dimensionMatch) {
              const parts = dimensionMatch[0].split(/(?:x|×)/);
              data.dimensoes = {
                comprimento: parts[0]?.trim(),
                largura: parts[1]?.trim(),
                espessura: parts[2]?.trim()
              };
            }
          } else if (key === 'certificacoes') {
            data[key] = matches;
          } else {
            // Extrair o primeiro grupo de captura ou o match completo
            const match = matches[0];
            const numberMatch = match.match(/([0-9,\.]+)/);
            data[key] = numberMatch ? numberMatch[1] : match.trim();
          }
          break; // Parar no primeiro match bem-sucedido
        }
      }
    });

    // Calcular confiança baseada na taxa de sucesso
    const confidenceScore = totalMatches > 0 ? (successfulMatches / totalMatches) * 100 : 0;
    setConfidence(Math.round(confidenceScore));

    return data;
  };

  const convertPDFToImages = async (file: File): Promise<string[]> => {
    setCurrentStep('Convertendo PDF para imagens...');
    
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const images: string[] = [];
    
    for (let i = 1; i <= Math.min(pdf.numPages, 5); i++) { // Limitar a 5 páginas
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await page.render({ canvasContext: context, viewport }).promise;
      images.push(canvas.toDataURL('image/png'));
      
      onProgress((i / pdf.numPages) * 30); // 30% para conversão
    }
    
    return images;
  };

  const processOCR = async (images: string[]): Promise<string> => {
    setCurrentStep('Processando OCR...');
    
    const worker = await createWorker('por+eng', 1, {
      logger: m => {
        if (m.status === 'recognizing text') {
          const progress = 30 + (m.progress * 60); // 30-90% para OCR
          onProgress(progress);
        }
      }
    });
    
    let fullText = '';
    
    for (let i = 0; i < images.length; i++) {
      const { data: { text } } = await worker.recognize(images[i]);
      fullText += text + '\n\n';
    }
    
    await worker.terminate();
    return fullText;
  };

  const processFile = async () => {
    if (!file) return;
    
    setIsProcessing(true);
    setCurrentStep('Iniciando processamento...');
    onProgress(0);
    
    try {
      // Converter PDF para imagens
      const images = await convertPDFToImages(file);
      
      // Processar OCR
      const text = await processOCR(images);
      setExtractedText(text);
      
      // Extrair dados estruturados
      setCurrentStep('Extraindo dados estruturados...');
      onProgress(90);
      
      const data = extractDataFromText(text);
      setExtractedData(data);
      
      onProgress(100);
      setCurrentStep('Processamento concluído!');
      
      onDataExtracted(data);
      
      toast({
        title: "OCR Concluído",
        description: `Dados extraídos com ${confidence}% de confiança.`
      });
      
    } catch (error: any) {
      console.error('Erro no processamento OCR:', error);
      onError(`Erro no processamento: ${error.message}`);
      
      toast({
        title: "Erro no OCR",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const downloadExtractedData = () => {
    if (!extractedData) return;
    
    const dataStr = JSON.stringify(extractedData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `${file.name.replace('.pdf', '')}_extracted_data.json`;
    link.click();
    
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      {/* Controles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Processamento OCR</span>
            <Badge variant={confidence > 70 ? 'default' : confidence > 40 ? 'secondary' : 'destructive'}>
              {confidence > 0 && `${confidence}% confiança`}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isProcessing && !extractedData && (
            <Button onClick={processFile} className="w-full">
              <Eye className="mr-2 h-4 w-4" />
              Iniciar Processamento OCR
            </Button>
          )}
          
          {isProcessing && (
            <div className="space-y-2">
              <Progress value={onProgress} className="w-full" />
              <p className="text-sm text-gray-600 text-center">
                {currentStep}
              </p>
            </div>
          )}
          
          {extractedData && (
            <div className="flex space-x-2">
              <Button onClick={processFile} variant="outline" className="flex-1">
                <RefreshCw className="mr-2 h-4 w-4" />
                Reprocessar
              </Button>
              <Button onClick={downloadExtractedData} variant="outline" className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Baixar Dados
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Dados Extraídos */}
      {extractedData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
              Dados Extraídos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(extractedData).map(([key, value]) => {
                if (!value) return null;
                
                return (
                  <div key={key} className="space-y-1">
                    <label className="text-sm font-medium text-gray-700 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </label>
                    <div className="text-sm text-gray-900 bg-gray-50 p-2 rounded">
                      {typeof value === 'object' ? JSON.stringify(value, null, 2) : value}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Texto Extraído (Collapsible) */}
      {extractedText && (
        <Card>
          <CardHeader>
            <CardTitle>Texto Extraído (OCR)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-h-40 overflow-y-auto bg-gray-50 p-3 rounded text-xs font-mono">
              <pre className="whitespace-pre-wrap">{extractedText}</pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default OCRProcessor;