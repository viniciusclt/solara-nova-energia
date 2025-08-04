import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { 
  FileText, 
  Upload, 
  Brain, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  Download,
  Settings,
  Eye,
  RefreshCw,
  Trash2,
  Plus,
  Save,
  X
} from 'lucide-react';
import { useDropzone } from 'react-dropzone';
import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import { Document, Page, pdfjs } from 'react-pdf';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logError } from '@/utils/secureLogger';

// Configurar workers
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;
pdfjs.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js`;

interface PDFFile {
  id: string;
  file: File;
  preview?: string;
  uploadProgress: number;
  ocrProgress: number;
  status: 'pending' | 'uploading' | 'processing' | 'completed' | 'error';
  error?: string;
  extractedData?: ExtractedData;
  downloadUrl?: string;
  confidence: number;
  pages: number;
  processedPages: number;
}

interface ExtractedData {
  // Dados básicos
  nome?: string;
  modelo?: string;
  fabricante?: string;
  categoria?: string;
  
  // Especificações técnicas
  potencia?: string;
  tensaoVoc?: string;
  tensaoVmp?: string;
  correnteIsc?: string;
  correnteImp?: string;
  eficiencia?: string;
  
  // Dimensões e peso
  dimensoes?: {
    comprimento?: string;
    largura?: string;
    espessura?: string;
  };
  peso?: string;
  
  // Garantias e certificações
  garantiasProduto?: string;
  garantiasPerformance?: string;
  certificacoes?: string[];
  
  // Tecnologia
  tecnologia?: string;
  
  // Dados específicos para inversores
  potenciaDC?: string;
  potenciaAC?: string;
  tensaoDC?: string;
  tensaoAC?: string;
  frequencia?: string;
  fases?: string;
  
  // Dados específicos para baterias
  capacidade?: string;
  tensaoNominal?: string;
  ciclosVida?: string;
  profundidadeDescarga?: string;
  
  // Metadados
  confidence: number;
  rawText?: string;
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
  extractedData: ExtractedData;
}

interface PDFImporterV3Props {
  onProductsImported?: (products: ProcessedProduct[]) => void;
  maxFiles?: number;
  maxFileSize?: number;
  equipmentType?: 'module' | 'inverter' | 'battery';
}

const PDFImporterV3: React.FC<PDFImporterV3Props> = ({
  onProductsImported,
  maxFiles = 10,
  maxFileSize = 10,
  equipmentType = 'module'
}) => {
  const [currentTab, setCurrentTab] = useState('upload');
  const [files, setFiles] = useState<PDFFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<PDFFile | null>(null);
  const [finalProducts, setFinalProducts] = useState<ProcessedProduct[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [ocrSettings, setOcrSettings] = useState({
    language: 'por+eng',
    psm: 6,
    oem: 3
  });
  const [previewPage, setPreviewPage] = useState(1);
  const [numPages, setNumPages] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Patterns de reconhecimento otimizados
  const getPatterns = (type: 'module' | 'inverter' | 'battery') => {
    const basePatterns = {
      nome: [
        /(?:model|modelo|type|tipo)\s*:?\s*([A-Z0-9][A-Z0-9-\s]{2,30})/gi,
        /^([A-Z0-9][A-Z0-9-\s]{2,30})(?:\s|$)/gm
      ],
      fabricante: [
        /(?:manufacturer|fabricante|marca|brand)\s*:?\s*([A-Za-z\s]{2,30})/gi,
        /(?:jinko|canadian solar|trina|ja solar|longi|risen|astronergy|seraphim|hanwha|rec|lg|panasonic|sunpower|first solar|yingli|sharp|kyocera|sanyo|mitsubishi|bp solar|shell|siemens|abb|sma|fronius|huawei|growatt|goodwe|solaredge|enphase|power one|schneider|delta|kaco|kostal|refusol|sungrow|ginlong|omnik|samil|zeversolar|chint|tbea|kehua|east group|saj|sofar|must|voltronic|victron|outback|magnum|xantrex|morningstar|midnite|schneider|studer|selectronic|sma|fronius|victron|outback|magnum|xantrex|morningstar|midnite|schneider|studer|selectronic)\b/gi
      ],
      potencia: [
        /(?:power|potência|puissance|pmax|p-max|maximum power|rated power)\s*:?\s*([0-9,.]+)\s*(?:w|wp|watt|watts|kw|kwp)/gi,
        /([0-9,.]+)\s*(?:w|wp|watt|watts|kw|kwp)\s*(?:power|potência|puissance|pmax|p-max)/gi,
        /([0-9,.]+)\s*(?:w|wp)(?!\w)/gi
      ],
      tensaoVoc: [
        /(?:voc|v-oc|open circuit voltage|tensão circuito aberto|tension circuit ouvert)\s*:?\s*([0-9,.]+)\s*(?:v|volt|volts)/gi,
        /([0-9,.]+)\s*(?:v|volt|volts)\s*(?:voc|v-oc)/gi
      ],
      tensaoVmp: [
        /(?:vmp|v-mp|vmpp|voltage at maximum power|tensão potência máxima|tension puissance maximale)\s*:?\s*([0-9,.]+)\s*(?:v|volt|volts)/gi,
        /([0-9,.]+)\s*(?:v|volt|volts)\s*(?:vmp|v-mp|vmpp)/gi
      ],
      correnteIsc: [
        /(?:isc|i-sc|short circuit current|corrente curto circuito|courant court-circuit)\s*:?\s*([0-9,.]+)\s*(?:a|amp|ampere|amperes)/gi,
        /([0-9,.]+)\s*(?:a|amp|ampere|amperes)\s*(?:isc|i-sc)/gi
      ],
      correnteImp: [
        /(?:imp|i-mp|impp|current at maximum power|corrente potência máxima|courant puissance maximale)\s*:?\s*([0-9,.]+)\s*(?:a|amp|ampere|amperes)/gi,
        /([0-9,.]+)\s*(?:a|amp|ampere|amperes)\s*(?:imp|i-mp|impp)/gi
      ],
      eficiencia: [
        /(?:efficiency|eficiência|rendement|η)\s*:?\s*([0-9,.]+)\s*%/gi,
        /([0-9,.]+)\s*%\s*(?:efficiency|eficiência|rendement)/gi
      ],
      peso: [
        /(?:weight|peso|poids|mass|massa)\s*:?\s*([0-9,.]+)\s*(?:kg|kilogram|kilograms)/gi,
        /([0-9,.]+)\s*(?:kg|kilogram|kilograms)\s*(?:weight|peso|poids)/gi
      ],
      dimensoes: [
        /(?:dimensions|dimensões|taille|size)\s*:?\s*([0-9,.]+)\s*(?:x|×|\*)\s*([0-9,.]+)\s*(?:x|×|\*)\s*([0-9,.]+)\s*(?:mm|cm|m)/gi,
        /([0-9,.]+)\s*(?:mm|cm|m)\s*(?:x|×|\*)\s*([0-9,.]+)\s*(?:mm|cm|m)\s*(?:x|×|\*)\s*([0-9,.]+)\s*(?:mm|cm|m)/gi
      ],
      garantiasProduto: [
        /(?:product warranty|garantia produto|garantie produit)\s*:?\s*([0-9]+)\s*(?:years|anos|ans)/gi,
        /([0-9]+)\s*(?:years|anos|ans)\s*(?:product warranty|garantia produto|garantie produit)/gi
      ],
      garantiasPerformance: [
        /(?:performance warranty|garantia performance|garantie performance|linear warranty)\s*:?\s*([0-9]+)\s*(?:years|anos|ans)/gi,
        /([0-9]+)\s*(?:years|anos|ans)\s*(?:performance warranty|garantia performance|garantie performance)/gi
      ],
      certificacoes: [
        /(?:iec|ul|ce|inmetro|aneel|tuv|cec|csa|mcs|pvqt|esti|jis|cnca|cgc|bis|soncap|sabs|kc|psc|ncc|as\/nzs)\s*[0-9-\s]*/gi
      ],
      tecnologia: [
        /(?:monocrystalline|polycrystalline|mono|poly|crystalline|silicon|monocristalino|policristalino|amorfo|perc|topcon|hjt|heterojunction|bifacial)/gi
      ]
    };

    if (type === 'inverter') {
      return {
        ...basePatterns,
        potenciaDC: [
          /(?:dc power|potência dc|puissance dc|max dc power)\s*:?\s*([0-9,.]+)\s*(?:w|wp|kw|kwp)/gi
        ],
        potenciaAC: [
          /(?:ac power|potência ac|puissance ac|rated ac power)\s*:?\s*([0-9,.]+)\s*(?:w|wp|kw|kwp)/gi
        ],
        tensaoDC: [
          /(?:dc voltage|tensão dc|tension dc|max dc voltage|mppt range)\s*:?\s*([0-9,.-]+)\s*(?:v|volt|volts)/gi
        ],
        tensaoAC: [
          /(?:ac voltage|tensão ac|tension ac|nominal ac voltage)\s*:?\s*([0-9,.]+)\s*(?:v|volt|volts)/gi
        ],
        frequencia: [
          /(?:frequency|frequência|fréquence)\s*:?\s*([0-9,.]+)\s*(?:hz|hertz)/gi
        ],
        fases: [
          /(?:phases|fases|phase)\s*:?\s*([0-9]+)/gi,
          /(single phase|three phase|monofásico|bifásico|trifásico|1ph|3ph)/gi
        ]
      };
    }

    if (type === 'battery') {
      return {
        ...basePatterns,
        capacidade: [
          /(?:capacity|capacidade|capacité)\s*:?\s*([0-9,.]+)\s*(?:ah|kwh|wh)/gi
        ],
        tensaoNominal: [
          /(?:nominal voltage|tensão nominal|tension nominale)\s*:?\s*([0-9,.]+)\s*(?:v|volt|volts)/gi
        ],
        ciclosVida: [
          /(?:cycle life|ciclos vida|cycles de vie|life cycles)\s*:?\s*([0-9,.]+)/gi
        ],
        profundidadeDescarga: [
          /(?:dod|depth of discharge|profundidade descarga|profondeur décharge)\s*:?\s*([0-9,.]+)\s*%/gi
        ]
      };
    }

    return basePatterns;
  };

  // Função para extrair dados do texto OCR
  const extractDataFromText = (text: string): ExtractedData => {
    const patterns = getPatterns(equipmentType);
    const data: ExtractedData = {
      confidence: 0,
      processedAt: new Date(),
      rawText: text
    };
    
    let totalMatches = 0;
    let successfulMatches = 0;

    Object.entries(patterns).forEach(([key, regexArray]) => {
      for (const regex of regexArray) {
        totalMatches++;
        const matches = text.match(regex);
        if (matches && matches.length > 0) {
          successfulMatches++;
          
          if (key === 'dimensoes') {
            const dimensionMatch = text.match(/([0-9,.]+)\s*(?:x|×|\*)\s*([0-9,.]+)\s*(?:x|×|\*)\s*([0-9,.]+)/gi);
            if (dimensionMatch) {
              const parts = dimensionMatch[0].split(/(?:x|×|\*)/);
              data.dimensoes = {
                comprimento: parts[0]?.trim(),
                largura: parts[1]?.trim(),
                espessura: parts[2]?.trim()
              };
            }
          } else if (key === 'certificacoes') {
            data[key] = matches;
          } else {
            const match = matches[0];
            const numberMatch = match.match(/([0-9,.]+)/);
            data[key as keyof ExtractedData] = numberMatch ? numberMatch[1] : match.trim();
          }
          break;
        }
      }
    });

    data.confidence = totalMatches > 0 ? (successfulMatches / totalMatches) * 100 : 0;
    return data;
  };

  // Função para converter PDF em imagens
  const convertPDFToImages = async (file: File): Promise<HTMLCanvasElement[]> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const images: HTMLCanvasElement[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;
      
      await page.render({
        canvasContext: context,
        viewport: viewport
      }).promise;
      
      images.push(canvas);
    }

    return images;
  };

  // Função para processar OCR
  const processOCR = async (images: HTMLCanvasElement[], fileId: string): Promise<string> => {
    const worker = await createWorker({
      logger: m => {
        if (m.status === 'recognizing text') {
          const progress = Math.round(m.progress * 100);
          setFiles(prev => prev.map(f => 
            f.id === fileId 
              ? { ...f, ocrProgress: progress }
              : f
          ));
        }
      }
    });

    try {
      await worker.loadLanguage(ocrSettings.language);
      await worker.initialize(ocrSettings.language);
      await worker.setParameters({
        tessedit_pageseg_mode: ocrSettings.psm.toString(),
        tessedit_ocr_engine_mode: ocrSettings.oem.toString()
      });

      let fullText = '';
      
      for (let i = 0; i < images.length; i++) {
        const { data } = await worker.recognize(images[i]);
        fullText += data.text + '\n';
        
        setFiles(prev => prev.map(f => 
          f.id === fileId 
            ? { ...f, processedPages: i + 1 }
            : f
        ));
      }

      await worker.terminate();
      return fullText;
    } catch (error) {
      await worker.terminate();
      throw error;
    }
  };

  // Função para processar arquivo
  const processFile = async (file: PDFFile) => {
    try {
      setFiles(prev => prev.map(f => 
        f.id === file.id 
          ? { ...f, status: 'processing', ocrProgress: 0, processedPages: 0 }
          : f
      ));

      // Converter PDF para imagens
      const images = await convertPDFToImages(file.file);
      
      setFiles(prev => prev.map(f => 
        f.id === file.id 
          ? { ...f, pages: images.length }
          : f
      ));

      // Processar OCR
      const extractedText = await processOCR(images, file.id);
      
      // Extrair dados estruturados
      const extractedData = extractDataFromText(extractedText);
      
      setFiles(prev => prev.map(f => 
        f.id === file.id 
          ? { 
              ...f, 
              status: 'completed', 
              extractedData,
              confidence: extractedData.confidence,
              ocrProgress: 100
            }
          : f
      ));

      toast({
        title: "Processamento Concluído",
        description: `Arquivo ${file.file.name} processado com ${extractedData.confidence.toFixed(1)}% de confiança.`
      });

    } catch (error: unknown) {
      logError('Erro no processamento de PDF', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        service: 'PDFImporterV3',
        action: 'processFile',
        fileName: file.file.name,
        fileSize: file.file.size
      });
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setFiles(prev => prev.map(f => 
        f.id === file.id 
          ? { ...f, status: 'error', error: errorMessage }
          : f
      ));
      
      toast({
        title: "Erro no Processamento",
        description: `Falha ao processar ${file.file.name}: ${errorMessage}`,
        variant: "destructive"
      });
    }
  };

  // Configuração do dropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles,
    maxSize: maxFileSize * 1024 * 1024,
    onDrop: (acceptedFiles, rejectedFiles) => {
      if (rejectedFiles.length > 0) {
        toast({
          title: "Arquivos Rejeitados",
          description: `${rejectedFiles.length} arquivo(s) foram rejeitados. Verifique o formato e tamanho.`,
          variant: "destructive"
        });
      }

      const newFiles: PDFFile[] = acceptedFiles.map(file => ({
        id: Math.random().toString(36).substr(2, 9),
        file,
        uploadProgress: 100,
        ocrProgress: 0,
        status: 'pending',
        confidence: 0,
        pages: 0,
        processedPages: 0
      }));

      setFiles(prev => [...prev, ...newFiles]);
      
      if (newFiles.length > 0) {
        toast({
          title: "Arquivos Adicionados",
          description: `${newFiles.length} arquivo(s) PDF adicionado(s) com sucesso.`
        });
      }
    }
  });

  // Função para remover arquivo
  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    if (selectedFile?.id === fileId) {
      setSelectedFile(null);
    }
  };

  // Função para processar todos os arquivos
  const processAllFiles = async () => {
    const pendingFiles = files.filter(f => f.status === 'pending');
    
    if (pendingFiles.length === 0) {
      toast({
        title: "Nenhum Arquivo",
        description: "Não há arquivos pendentes para processar.",
        variant: "destructive"
      });
      return;
    }

    for (const file of pendingFiles) {
      await processFile(file);
    }

    setCurrentTab('review');
  };

  // Função para gerar produtos finais
  const generateProducts = () => {
    const completedFiles = files.filter(f => f.status === 'completed' && f.extractedData);
    
    const products: ProcessedProduct[] = completedFiles.map(file => {
      const data = file.extractedData!;
      return {
        id: file.id,
        sourceFile: file.file.name,
        nome: data.nome || data.modelo || 'Produto Importado',
        potencia: data.potencia || '0',
        preco: '0', // Será preenchido manualmente
        fabricante: data.fabricante || 'Não identificado',
        categoria: equipmentType === 'module' ? 'Módulo Solar' : 
                  equipmentType === 'inverter' ? 'Inversor' : 'Bateria',
        descricao: `Importado de ${file.file.name}`,
        eficiencia: data.eficiencia,
        tensao: data.tensaoVoc || data.tensaoNominal,
        corrente: data.correnteIsc,
        dimensoes: data.dimensoes ? 
          `${data.dimensoes.comprimento}x${data.dimensoes.largura}x${data.dimensoes.espessura}` : undefined,
        peso: data.peso,
        garantia: data.garantiasProduto,
        certificacoes: data.certificacoes?.join(', '),
        confidence: data.confidence,
        verified: false,
        extractedData: data
      };
    });

    setFinalProducts(products);
    setCurrentTab('finalize');
  };

  // Função para salvar produtos
  const saveProducts = async () => {
    if (finalProducts.length === 0) {
      toast({
        title: "Nenhum Produto",
        description: "Não há produtos para salvar.",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('Usuário não autenticado');
      }

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('empresa_id')
        .eq('id', user.id)
        .single();

      if (profileError || !profile) {
        throw new Error('Perfil do usuário não encontrado');
      }

      // Determinar tabela de destino
      const tableName = equipmentType === 'module' ? 'solar_modules' : 
                       equipmentType === 'inverter' ? 'inverters' : 'kits_financeiros';

      const productsToInsert = finalProducts.map(product => ({
        nome: product.nome,
        potencia: parseFloat(product.potencia) || 0,
        preco: parseFloat(product.preco) || 0,
        fabricante: product.fabricante,
        categoria: product.categoria,
        descricao: product.descricao,
        empresa_id: profile.empresa_id,
        created_by: user.id,
        eficiencia: product.eficiencia ? parseFloat(product.eficiencia) : null,
        tensao: product.tensao ? parseFloat(product.tensao) : null,
        corrente: product.corrente ? parseFloat(product.corrente) : null,
        dimensoes: product.dimensoes,
        peso: product.peso ? parseFloat(product.peso) : null,
        garantia: product.garantia,
        certificacoes: product.certificacoes,
        fonte_importacao: 'PDF_OCR',
        arquivo_origem: product.sourceFile,
        confianca_ocr: product.confidence,
        verificado: product.verified,
        dados_extraidos: product.extractedData
      }));

      const { data, error } = await supabase
        .from(tableName)
        .insert(productsToInsert)
        .select();

      if (error) {
        throw new Error(`Erro ao salvar produtos: ${error.message}`);
      }

      toast({
        title: "Importação Concluída",
        description: `${finalProducts.length} produto(s) importado(s) com sucesso.`
      });

      if (onProductsImported) {
        onProductsImported(finalProducts);
      }

      // Reset
      setFiles([]);
      setFinalProducts([]);
      setCurrentTab('upload');

    } catch (error: unknown) {
      logError('Erro ao salvar produtos importados', {
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        service: 'PDFImporterV3',
        action: 'saveProducts',
        productCount: finalProducts.length,
        equipmentType
      });
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast({
        title: "Erro na Importação",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Função para atualizar produto
  const updateProduct = (productId: string, field: string, value: string) => {
    setFinalProducts(prev => prev.map(p => 
      p.id === productId 
        ? { ...p, [field]: value, verified: true }
        : p
    ));
  };

  // Status das abas
  const getTabStatus = (tab: string) => {
    switch (tab) {
      case 'upload':
        return 'active';
      case 'process':
        return files.length > 0 ? 'active' : 'disabled';
      case 'review':
        return files.some(f => f.status === 'completed') ? 'active' : 'disabled';
      case 'finalize':
        return finalProducts.length > 0 ? 'active' : 'disabled';
      default:
        return 'disabled';
    }
  };

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Importação de PDF com OCR Inteligente
            <Badge variant="outline">
              {equipmentType === 'module' ? 'Módulos Solares' : 
               equipmentType === 'inverter' ? 'Inversores' : 'Baterias'}
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Tabs */}
      <Tabs value={currentTab} onValueChange={setCurrentTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger 
            value="upload" 
            className="flex items-center gap-2"
          >
            <Upload className="h-4 w-4" />
            1. Upload
          </TabsTrigger>
          <TabsTrigger 
            value="process" 
            disabled={getTabStatus('process') === 'disabled'}
            className="flex items-center gap-2"
          >
            <Brain className="h-4 w-4" />
            2. Processamento
          </TabsTrigger>
          <TabsTrigger 
            value="review" 
            disabled={getTabStatus('review') === 'disabled'}
            className="flex items-center gap-2"
          >
            <Eye className="h-4 w-4" />
            3. Revisão
          </TabsTrigger>
          <TabsTrigger 
            value="finalize" 
            disabled={getTabStatus('finalize') === 'disabled'}
            className="flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            4. Finalizar
          </TabsTrigger>
        </TabsList>

        {/* Tab Content - Upload */}
        <TabsContent value="upload" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload de Arquivos PDF</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Dropzone */}
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
                  isDragActive 
                    ? 'border-primary bg-primary/5' 
                    : 'border-gray-300 hover:border-primary'
                }`}
              >
                <input {...getInputProps()} ref={fileInputRef} aria-label="Selecionar arquivos PDF para importação" />
                <Upload className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">
                  {isDragActive 
                    ? 'Solte os arquivos aqui...' 
                    : 'Arraste arquivos PDF ou clique para selecionar'
                  }
                </p>
                <p className="text-sm text-gray-500">
                  Máximo {maxFiles} arquivos, até {maxFileSize}MB cada
                </p>
              </div>

              {/* Lista de arquivos */}
              {files.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium">Arquivos Carregados ({files.length})</h3>
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5" />
                        <div>
                          <p className="font-medium">{file.file.name}</p>
                          <p className="text-sm text-gray-500">
                            {(file.file.size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge 
                          variant={file.status === 'completed' ? 'default' : 
                                  file.status === 'error' ? 'destructive' : 'secondary'}
                        >
                          {file.status === 'pending' ? 'Pendente' :
                           file.status === 'processing' ? 'Processando' :
                           file.status === 'completed' ? 'Concluído' : 'Erro'}
                        </Badge>
                        {file.status === 'completed' && (
                          <Badge variant="outline">
                            {file.confidence.toFixed(1)}% confiança
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(file.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Configurações OCR */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5" />
                    Configurações OCR
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-3 gap-4">
                  <div>
                    <Label>Idioma</Label>
                    <Select value={ocrSettings.language} onValueChange={(value) => 
                      setOcrSettings(prev => ({ ...prev, language: value }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="por+eng">Português + Inglês</SelectItem>
                        <SelectItem value="eng">Inglês</SelectItem>
                        <SelectItem value="por">Português</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Modo de Segmentação</Label>
                    <Select value={ocrSettings.psm.toString()} onValueChange={(value) => 
                      setOcrSettings(prev => ({ ...prev, psm: parseInt(value) }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6">Bloco de texto uniforme</SelectItem>
                        <SelectItem value="8">Palavra única</SelectItem>
                        <SelectItem value="13">Linha de texto</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Motor OCR</Label>
                    <Select value={ocrSettings.oem.toString()} onValueChange={(value) => 
                      setOcrSettings(prev => ({ ...prev, oem: parseInt(value) }))
                    }>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">Padrão</SelectItem>
                        <SelectItem value="1">LSTM</SelectItem>
                        <SelectItem value="2">Legado + LSTM</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Botão para processar */}
              {files.length > 0 && (
                <div className="flex justify-end">
                  <Button onClick={processAllFiles} className="flex items-center gap-2">
                    <Brain className="h-4 w-4" />
                    Processar Arquivos ({files.filter(f => f.status === 'pending').length})
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Content - Process */}
        <TabsContent value="process" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Processamento OCR</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {files.map((file) => (
                <div key={file.id} className="p-4 border rounded-lg space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5" />
                      <div>
                        <p className="font-medium">{file.file.name}</p>
                        <p className="text-sm text-gray-500">
                          {file.pages > 0 && `${file.processedPages}/${file.pages} páginas processadas`}
                        </p>
                      </div>
                    </div>
                    <Badge 
                      variant={file.status === 'completed' ? 'default' : 
                              file.status === 'error' ? 'destructive' : 'secondary'}
                    >
                      {file.status === 'pending' ? 'Pendente' :
                       file.status === 'processing' ? 'Processando' :
                       file.status === 'completed' ? 'Concluído' : 'Erro'}
                    </Badge>
                  </div>
                  
                  {file.status === 'processing' && (
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progresso OCR</span>
                        <span>{file.ocrProgress}%</span>
                      </div>
                      <Progress value={file.ocrProgress} />
                    </div>
                  )}
                  
                  {file.status === 'completed' && file.extractedData && (
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Dados Extraídos:</strong>
                        <ul className="mt-1 space-y-1">
                          {file.extractedData.nome && <li>Nome: {file.extractedData.nome}</li>}
                          {file.extractedData.fabricante && <li>Fabricante: {file.extractedData.fabricante}</li>}
                          {file.extractedData.potencia && <li>Potência: {file.extractedData.potencia}</li>}
                          {file.extractedData.eficiencia && <li>Eficiência: {file.extractedData.eficiencia}%</li>}
                        </ul>
                      </div>
                      <div>
                        <strong>Confiança:</strong> {file.confidence.toFixed(1)}%
                        <div className="mt-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedFile(file)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Ver Detalhes
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {file.status === 'error' && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{file.error}</AlertDescription>
                    </Alert>
                  )}
                </div>
              ))}
              
              {files.some(f => f.status === 'completed') && (
                <div className="flex justify-end">
                  <Button onClick={generateProducts} className="flex items-center gap-2">
                    <ArrowRight className="h-4 w-4" />
                    Gerar Produtos
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Content - Review */}
        <TabsContent value="review" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Revisão de Dados Extraídos</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedFile && selectedFile.extractedData && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">{selectedFile.file.name}</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedFile(null)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Dados Estruturados</h4>
                      <div className="space-y-3">
                        {Object.entries(selectedFile.extractedData)
                          .filter(([key, value]) => value && key !== 'rawText' && key !== 'processedAt')
                          .map(([key, value]) => (
                            <div key={key} className="grid grid-cols-3 gap-2 items-center">
                              <Label className="text-sm font-medium capitalize">
                                {key.replace(/([A-Z])/g, ' $1').trim()}
                              </Label>
                              <div className="col-span-2">
                                {typeof value === 'object' ? (
                                  <pre className="text-xs bg-gray-100 p-2 rounded">
                                    {JSON.stringify(value, null, 2)}
                                  </pre>
                                ) : (
                                  <Input 
                                    value={value.toString()} 
                                    readOnly 
                                    className="text-sm"
                                    aria-label={`Valor do campo ${key.replace(/([A-Z])/g, ' $1').trim()}`}
                                  />
                                )}
                              </div>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-3">Texto Bruto Extraído</h4>
                      <Textarea 
                        value={selectedFile.extractedData.rawText || ''}
                        readOnly
                        className="h-96 text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
              
              {!selectedFile && (
                <div className="text-center py-8">
                  <p className="text-gray-500">Selecione um arquivo processado para ver os detalhes</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Content - Finalize */}
        <TabsContent value="finalize" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Produtos para Importação</CardTitle>
            </CardHeader>
            <CardContent>
              {finalProducts.length > 0 ? (
                <div className="space-y-4">
                  {finalProducts.map((product) => (
                    <div key={product.id} className="p-4 border rounded-lg space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium">{product.nome}</h3>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">
                            {product.confidence.toFixed(1)}% confiança
                          </Badge>
                          {product.verified && (
                            <Badge variant="default">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Verificado
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <Label>Nome</Label>
                          <Input 
                            value={product.nome}
                            onChange={(e) => updateProduct(product.id, 'nome', e.target.value)}
                            aria-label="Nome do produto"
                          />
                        </div>
                        <div>
                          <Label>Fabricante</Label>
                          <Input 
                            value={product.fabricante}
                            onChange={(e) => updateProduct(product.id, 'fabricante', e.target.value)}
                            aria-label="Fabricante do produto"
                          />
                        </div>
                        <div>
                          <Label>Potência</Label>
                          <Input 
                            value={product.potencia}
                            onChange={(e) => updateProduct(product.id, 'potencia', e.target.value)}
                            aria-label="Potência do produto"
                          />
                        </div>
                        <div>
                          <Label>Preço (R$)</Label>
                          <Input 
                            type="number"
                            step="0.01"
                            value={product.preco}
                            onChange={(e) => updateProduct(product.id, 'preco', e.target.value)}
                            placeholder="0.00"
                            aria-label="Preço do produto em reais"
                          />
                        </div>
                        <div>
                          <Label>Eficiência (%)</Label>
                          <Input 
                            value={product.eficiencia || ''}
                            onChange={(e) => updateProduct(product.id, 'eficiencia', e.target.value)}
                            aria-label="Eficiência do produto em porcentagem"
                          />
                        </div>
                        <div>
                          <Label>Garantia</Label>
                          <Input 
                            value={product.garantia || ''}
                            onChange={(e) => updateProduct(product.id, 'garantia', e.target.value)}
                            aria-label="Garantia do produto"
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label>Descrição</Label>
                        <Textarea 
                          value={product.descricao}
                          onChange={(e) => updateProduct(product.id, 'descricao', e.target.value)}
                          rows={2}
                          aria-label="Descrição do produto"
                        />
                      </div>
                    </div>
                  ))}
                  
                  <div className="flex justify-between items-center pt-4">
                    <div>
                      <p className="text-sm text-gray-600">
                        {finalProducts.length} produto(s) para importar
                      </p>
                    </div>
                    <Button 
                      onClick={saveProducts}
                      disabled={isImporting}
                      className="flex items-center gap-2"
                    >
                      {isImporting ? (
                        <RefreshCw className="h-4 w-4 animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                      {isImporting ? 'Importando...' : 'Finalizar Importação'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <p className="text-gray-500">Nenhum produto gerado ainda</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PDFImporterV3;