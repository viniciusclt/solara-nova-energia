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
import { Checkbox } from '@/components/ui/checkbox';
import { 
  Upload, 
  FileText, 
  Eye, 
  Zap, 
  CheckCircle2, 
  AlertCircle,
  Download,
  Trash2,
  RotateCcw,
  Settings,
  Image,
  FileImage
} from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useDropzone } from 'react-dropzone';
import Tesseract from 'tesseract.js';
import { PDFDocument } from 'pdf-lib';
import { Document, Page, pdfjs } from 'react-pdf';
import { logError, logInfo } from '@/utils/secureLogger';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Configurar worker do PDF.js
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

interface UploadedFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  numPages?: number;
  ocrResults?: OCRPageResult[];
  extractedData?: ExtractedData;
  error?: string;
}

interface OCRPageResult {
  pageNumber: number;
  text: string;
  confidence: number;
  processingTime: number;
  words: Array<{
    text: string;
    confidence: number;
    bbox: {
      x0: number;
      y0: number;
      x1: number;
      y1: number;
    };
  }>;
}

interface ExtractedData {
  customerInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    cpf?: string;
    cnpj?: string;
  };
  consumptionData?: Array<{
    month: string;
    consumption: number;
    cost?: number;
  }>;
  equipmentData?: Array<{
    type: string;
    model: string;
    quantity: number;
    power?: number;
    manufacturer?: string;
  }>;
  financialData?: {
    totalValue?: number;
    installments?: number;
    monthlyPayment?: number;
    downPayment?: number;
  };
  technicalData?: {
    roofArea?: number;
    orientation?: string;
    inclination?: number;
    shading?: string;
  };
}

interface OCRSettings {
  language: string;
  psm: string; // Page segmentation mode
  oem: string; // OCR Engine mode
  dpi: number;
  preprocessImage: boolean;
  enhanceContrast: boolean;
  removeNoise: boolean;
}

interface PDFUploaderV2Props {
  onFilesProcessed?: (files: UploadedFile[]) => void;
  onDataExtracted?: (data: ExtractedData[]) => void;
  maxFiles?: number;
  maxFileSize?: number;
  allowedTypes?: string[];
}

const PDFUploaderV2: React.FC<PDFUploaderV2Props> = ({
  onFilesProcessed,
  onDataExtracted,
  maxFiles = 10,
  maxFileSize = 50, // MB
  allowedTypes = ['.pdf', '.png', '.jpg', '.jpeg']
}) => {
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [scale, setScale] = useState(1.0);
  const [showSettings, setShowSettings] = useState(false);
  
  // Configurações de OCR
  const [ocrSettings, setOcrSettings] = useState<OCRSettings>({
    language: 'por+eng',
    psm: '6',
    oem: '3',
    dpi: 300,
    preprocessImage: true,
    enhanceContrast: true,
    removeNoise: true
  });
  
  // Padrões regex para extração de dados
  const extractionPatterns = {
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    phone: /\(?\d{2}\)?\s?\d{4,5}-?\d{4}/g,
    cpf: /\d{3}\.\d{3}\.\d{3}-\d{2}/g,
    cnpj: /\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}/g,
    currency: /R\$\s?\d{1,3}(?:\.\d{3})*(?:,\d{2})?/g,
    consumption: /\d{1,4}\s?kWh/gi,
    power: /\d{1,4}(?:,\d{1,2})?\s?kWp?/gi,
    percentage: /\d{1,3}(?:,\d{1,2})?\s?%/g,
    area: /\d{1,4}(?:,\d{1,2})?\s?m[²2]/gi
  };
  
  // Configuração do dropzone
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (uploadedFiles.length + acceptedFiles.length > maxFiles) {
      toast({
        title: "Limite Excedido",
        description: `Máximo de ${maxFiles} arquivos permitidos.`,
        variant: "destructive"
      });
      return;
    }
    
    const newFiles: UploadedFile[] = acceptedFiles.map(file => ({
      id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending',
      progress: 0
    }));
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
    
    // Processar arquivos automaticamente
    for (const uploadedFile of newFiles) {
      await processFile(uploadedFile.id);
    }
  }, [uploadedFiles.length, maxFiles]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'image/png': ['.png'],
      'image/jpeg': ['.jpg', '.jpeg']
    },
    maxSize: maxFileSize * 1024 * 1024,
    multiple: true
  });
  
  // Processar arquivo individual
  const processFile = async (fileId: string) => {
    const file = uploadedFiles.find(f => f.id === fileId);
    if (!file) return;
    
    setUploadedFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, status: 'processing', progress: 0 } : f
    ));
    
    try {
      if (file.type === 'application/pdf') {
        await processPDF(fileId);
      } else {
        await processImage(fileId);
      }
    } catch (error: unknown) {
      logError('Erro ao processar arquivo', {
        error: error instanceof Error ? error.message : String(error),
        fileId,
        fileName: file.name,
        fileType: file.type,
        service: 'PDFUploaderV2'
      });
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId ? { 
          ...f, 
          status: 'error', 
          error: (error as Error).message || 'Erro desconhecido'
        } : f
      ));
    }
  };
  
  // Processar PDF
  const processPDF = async (fileId: string) => {
    const uploadedFile = uploadedFiles.find(f => f.id === fileId);
    if (!uploadedFile) return;
    
    // Carregar PDF
    const arrayBuffer = await uploadedFile.file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    const numPages = pdfDoc.getPageCount();
    
    setUploadedFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, numPages, progress: 10 } : f
    ));
    
    const ocrResults: OCRPageResult[] = [];
    
    // Processar cada página
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const startTime = Date.now();
      
      // Converter página para canvas
      const canvas = await convertPDFPageToCanvas(arrayBuffer, pageNum);
      
      // Pré-processar imagem se habilitado
      const processedCanvas = ocrSettings.preprocessImage ? 
        await preprocessImage(canvas) : canvas;
      
      // Executar OCR
      const ocrResult = await performOCR(processedCanvas, pageNum);
      ocrResult.processingTime = Date.now() - startTime;
      
      ocrResults.push(ocrResult);
      
      // Atualizar progresso
      const progress = 10 + (pageNum / numPages) * 70;
      setUploadedFiles(prev => prev.map(f => 
        f.id === fileId ? { ...f, progress } : f
      ));
    }
    
    // Extrair dados estruturados
    const extractedData = extractStructuredData(ocrResults);
    
    // Finalizar processamento
    setUploadedFiles(prev => prev.map(f => 
      f.id === fileId ? { 
        ...f, 
        status: 'completed', 
        progress: 100,
        ocrResults,
        extractedData
      } : f
    ));
    
    toast({
      title: "PDF Processado",
      description: `${numPages} página(s) processada(s) com sucesso.`
    });
  };
  
  // Processar imagem
  const processImage = async (fileId: string) => {
    const uploadedFile = uploadedFiles.find(f => f.id === fileId);
    if (!uploadedFile) return;
    
    setUploadedFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, progress: 20 } : f
    ));
    
    // Criar canvas da imagem
    const canvas = await createCanvasFromImage(uploadedFile.file);
    
    // Pré-processar se habilitado
    const processedCanvas = ocrSettings.preprocessImage ? 
      await preprocessImage(canvas) : canvas;
    
    setUploadedFiles(prev => prev.map(f => 
      f.id === fileId ? { ...f, progress: 50 } : f
    ));
    
    // Executar OCR
    const startTime = Date.now();
    const ocrResult = await performOCR(processedCanvas, 1);
    ocrResult.processingTime = Date.now() - startTime;
    
    // Extrair dados estruturados
    const extractedData = extractStructuredData([ocrResult]);
    
    // Finalizar
    setUploadedFiles(prev => prev.map(f => 
      f.id === fileId ? { 
        ...f, 
        status: 'completed', 
        progress: 100,
        numPages: 1,
        ocrResults: [ocrResult],
        extractedData
      } : f
    ));
    
    toast({
      title: "Imagem Processada",
      description: "OCR concluído com sucesso."
    });
  };
  
  // Converter página PDF para canvas
  const convertPDFPageToCanvas = async (pdfBuffer: ArrayBuffer, pageNumber: number): Promise<HTMLCanvasElement> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) {
        reject(new Error('Não foi possível obter contexto do canvas'));
        return;
      }
      
      const loadingTask = pdfjs.getDocument({ data: pdfBuffer });
      
      loadingTask.promise.then(pdf => {
        pdf.getPage(pageNumber).then(page => {
          const viewport = page.getViewport({ scale: ocrSettings.dpi / 72 });
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          
          const renderContext = {
            canvasContext: context,
            viewport: viewport
          };
          
          page.render(renderContext).promise.then(() => {
            resolve(canvas);
          }).catch(reject);
        }).catch(reject);
      }).catch(reject);
    });
  };
  
  // Criar canvas de imagem
  const createCanvasFromImage = async (file: File): Promise<HTMLCanvasElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Não foi possível obter contexto do canvas'));
        return;
      }
      
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        resolve(canvas);
      };
      
      img.onerror = () => reject(new Error('Erro ao carregar imagem'));
      img.src = URL.createObjectURL(file);
    });
  };
  
  // Pré-processar imagem
  const preprocessImage = async (canvas: HTMLCanvasElement): Promise<HTMLCanvasElement> => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return canvas;
    
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Aplicar filtros baseados nas configurações
    for (let i = 0; i < data.length; i += 4) {
      let r = data[i];
      let g = data[i + 1];
      let b = data[i + 2];
      
      // Aumentar contraste
      if (ocrSettings.enhanceContrast) {
        const factor = 1.5;
        r = Math.min(255, Math.max(0, (r - 128) * factor + 128));
        g = Math.min(255, Math.max(0, (g - 128) * factor + 128));
        b = Math.min(255, Math.max(0, (b - 128) * factor + 128));
      }
      
      // Remover ruído (conversão para escala de cinza)
      if (ocrSettings.removeNoise) {
        const gray = 0.299 * r + 0.587 * g + 0.114 * b;
        r = g = b = gray;
      }
      
      data[i] = r;
      data[i + 1] = g;
      data[i + 2] = b;
    }
    
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  };
  
  // Executar OCR
  const performOCR = async (canvas: HTMLCanvasElement, pageNumber: number): Promise<OCRPageResult> => {
    const worker = await Tesseract.createWorker({
      logger: m => {
        // Log do progresso interno do Tesseract
        if (m.status === 'recognizing text') {
          logInfo('Progresso do OCR', {
            progress: Math.round(m.progress * 100),
            pageNumber,
            service: 'PDFUploaderV2'
          });
        }
      }
    });
    
    try {
      await worker.loadLanguage(ocrSettings.language);
      await worker.initialize(ocrSettings.language);
      await worker.setParameters({
        tessedit_pageseg_mode: ocrSettings.psm,
        tessedit_ocr_engine_mode: ocrSettings.oem
      });
      
      const { data } = await worker.recognize(canvas);
      
      return {
        pageNumber,
        text: data.text,
        confidence: data.confidence,
        processingTime: 0, // Será definido externamente
        words: data.words.map(word => ({
          text: word.text,
          confidence: word.confidence,
          bbox: word.bbox
        }))
      };
    } finally {
      await worker.terminate();
    }
  };
  
  // Extrair dados estruturados
  const extractStructuredData = (ocrResults: OCRPageResult[]): ExtractedData => {
    const allText = ocrResults.map(r => r.text).join('\n\n');
    const data: ExtractedData = {};
    
    // Extrair informações do cliente
    data.customerInfo = {};
    
    const emails = allText.match(extractionPatterns.email);
    if (emails) data.customerInfo.email = emails[0];
    
    const phones = allText.match(extractionPatterns.phone);
    if (phones) data.customerInfo.phone = phones[0];
    
    const cpfs = allText.match(extractionPatterns.cpf);
    if (cpfs) data.customerInfo.cpf = cpfs[0];
    
    const cnpjs = allText.match(extractionPatterns.cnpj);
    if (cnpjs) data.customerInfo.cnpj = cnpjs[0];
    
    // Extrair dados de consumo
    const consumptionMatches = allText.match(extractionPatterns.consumption);
    if (consumptionMatches) {
      data.consumptionData = consumptionMatches.map((match, index) => ({
        month: `Mês ${index + 1}`,
        consumption: parseInt(match.replace(/[^\d]/g, ''))
      }));
    }
    
    // Extrair dados financeiros
    const currencyMatches = allText.match(extractionPatterns.currency);
    if (currencyMatches) {
      data.financialData = {
        totalValue: parseFloat(currencyMatches[0].replace(/[^\d,]/g, '').replace(',', '.'))
      };
    }
    
    // Extrair dados técnicos
    const areaMatches = allText.match(extractionPatterns.area);
    if (areaMatches) {
      data.technicalData = {
        roofArea: parseFloat(areaMatches[0].replace(/[^\d,]/g, '').replace(',', '.'))
      };
    }
    
    return data;
  };
  
  // Remover arquivo
  const removeFile = (fileId: string) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    if (selectedFile === fileId) {
      setSelectedFile(null);
    }
  };
  
  // Reprocessar arquivo
  const reprocessFile = async (fileId: string) => {
    await processFile(fileId);
  };
  
  // Exportar resultados
  const exportResults = () => {
    const results = uploadedFiles
      .filter(f => f.status === 'completed')
      .map(f => ({
        fileName: f.name,
        extractedData: f.extractedData,
        ocrResults: f.ocrResults?.map(r => ({
          pageNumber: r.pageNumber,
          text: r.text,
          confidence: r.confidence,
          processingTime: r.processingTime
        }))
      }));
    
    const blob = new Blob([JSON.stringify(results, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocr_results_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Exportação Concluída",
      description: "Resultados exportados com sucesso."
    });
  };
  
  const selectedFileData = selectedFile ? uploadedFiles.find(f => f.id === selectedFile) : null;
  const completedFiles = uploadedFiles.filter(f => f.status === 'completed');
  
  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload de Arquivos para OCR
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
            }`}
          >
            <input {...getInputProps()} aria-label="Selecionar arquivos PDF para upload" />
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium mb-2">
              {isDragActive ? 'Solte os arquivos aqui' : 'Arraste arquivos ou clique para selecionar'}
            </p>
            <p className="text-sm text-gray-500">
              Suporte para PDF, PNG, JPG (máx. {maxFileSize}MB cada, {maxFiles} arquivos)
            </p>
          </div>
          
          {/* Configurações */}
          <div className="mt-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowSettings(!showSettings)}
              >
                <Settings className="h-4 w-4" />
                Configurações OCR
              </Button>
              
              {completedFiles.length > 0 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportResults}
                >
                  <Download className="h-4 w-4" />
                  Exportar Resultados
                </Button>
              )}
            </div>
            
            <div className="text-sm text-gray-500">
              {uploadedFiles.length} / {maxFiles} arquivos
            </div>
          </div>
          
          {/* Painel de Configurações */}
          {showSettings && (
            <Card className="mt-4">
              <CardHeader>
                <CardTitle className="text-sm">Configurações de OCR</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Idioma</Label>
                    <Select
                      value={ocrSettings.language}
                      onValueChange={(value) => setOcrSettings(prev => ({ ...prev, language: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="por">Português</SelectItem>
                        <SelectItem value="eng">Inglês</SelectItem>
                        <SelectItem value="por+eng">Português + Inglês</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div>
                    <Label>DPI</Label>
                    <Select
                      value={ocrSettings.dpi.toString()}
                      onValueChange={(value) => setOcrSettings(prev => ({ ...prev, dpi: parseInt(value) }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="150">150 DPI</SelectItem>
                        <SelectItem value="300">300 DPI</SelectItem>
                        <SelectItem value="600">600 DPI</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="preprocess"
                      checked={ocrSettings.preprocessImage}
                      onCheckedChange={(checked) => 
                        setOcrSettings(prev => ({ ...prev, preprocessImage: checked as boolean }))
                      }
                    />
                    <Label htmlFor="preprocess">Pré-processar imagem</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="contrast"
                      checked={ocrSettings.enhanceContrast}
                      onCheckedChange={(checked) => 
                        setOcrSettings(prev => ({ ...prev, enhanceContrast: checked as boolean }))
                      }
                    />
                    <Label htmlFor="contrast">Aumentar contraste</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="noise"
                      checked={ocrSettings.removeNoise}
                      onCheckedChange={(checked) => 
                        setOcrSettings(prev => ({ ...prev, removeNoise: checked as boolean }))
                      }
                    />
                    <Label htmlFor="noise">Remover ruído</Label>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
      
      {/* Lista de Arquivos */}
      {uploadedFiles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Arquivos Processados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {uploadedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-3">
                    {file.type === 'application/pdf' ? (
                      <FileText className="h-5 w-5 text-red-500" />
                    ) : (
                      <FileImage className="h-5 w-5 text-blue-500" />
                    )}
                    
                    <div>
                      <div className="font-medium">{file.name}</div>
                      <div className="text-sm text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                        {file.numPages && ` • ${file.numPages} página(s)`}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {file.status === 'processing' && (
                      <div className="flex items-center gap-2">
                        <Progress value={file.progress} className="w-20" />
                        <span className="text-sm">{Math.round(file.progress)}%</span>
                      </div>
                    )}
                    
                    <Badge
                      variant={
                        file.status === 'completed' ? 'default' :
                        file.status === 'processing' ? 'secondary' :
                        file.status === 'error' ? 'destructive' : 'outline'
                      }
                    >
                      {file.status === 'completed' && <CheckCircle2 className="h-3 w-3 mr-1" />}
                      {file.status === 'error' && <AlertCircle className="h-3 w-3 mr-1" />}
                      {file.status === 'completed' ? 'Concluído' :
                       file.status === 'processing' ? 'Processando' :
                       file.status === 'error' ? 'Erro' : 'Pendente'}
                    </Badge>
                    
                    {file.status === 'completed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedFile(file.id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    )}
                    
                    {file.status === 'error' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => reprocessFile(file.id)}
                      >
                        <RotateCcw className="h-4 w-4" />
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => removeFile(file.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Visualização de Resultados */}
      {selectedFileData && selectedFileData.status === 'completed' && (
        <Card>
          <CardHeader>
            <CardTitle>Resultados: {selectedFileData.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="extracted" className="w-full">
              <TabsList>
                <TabsTrigger value="extracted">Dados Extraídos</TabsTrigger>
                <TabsTrigger value="text">Texto Completo</TabsTrigger>
                <TabsTrigger value="confidence">Confiança</TabsTrigger>
              </TabsList>
              
              <TabsContent value="extracted" className="space-y-4">
                {selectedFileData.extractedData && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Dados do Cliente */}
                    {selectedFileData.extractedData.customerInfo && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Informações do Cliente</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {Object.entries(selectedFileData.extractedData.customerInfo)
                            .filter(([_, value]) => value)
                            .map(([key, value]) => (
                              <div key={key}>
                                <Label className="text-xs text-gray-500 capitalize">{key}</Label>
                                <div className="text-sm">{value}</div>
                              </div>
                            ))
                          }
                        </CardContent>
                      </Card>
                    )}
                    
                    {/* Dados Financeiros */}
                    {selectedFileData.extractedData.financialData && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="text-sm">Dados Financeiros</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {Object.entries(selectedFileData.extractedData.financialData)
                            .filter(([_, value]) => value)
                            .map(([key, value]) => (
                              <div key={key}>
                                <Label className="text-xs text-gray-500 capitalize">{key}</Label>
                                <div className="text-sm">
                                  {typeof value === 'number' ? 
                                    `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : 
                                    value
                                  }
                                </div>
                              </div>
                            ))
                          }
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
                
                {/* Dados de Consumo */}
                {selectedFileData.extractedData?.consumptionData && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Dados de Consumo</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                        {selectedFileData.extractedData.consumptionData.map((item, index) => (
                          <div key={index} className="text-center p-2 border rounded">
                            <div className="text-xs text-gray-500">{item.month}</div>
                            <div className="text-sm font-medium">{item.consumption} kWh</div>
                            {item.cost && (
                              <div className="text-xs text-gray-500">R$ {item.cost.toFixed(2)}</div>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
              
              <TabsContent value="text">
                <div className="space-y-4">
                  {selectedFileData.ocrResults?.map((result, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="text-sm">Página {result.pageNumber}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <pre className="text-sm whitespace-pre-wrap max-h-64 overflow-auto border rounded p-3">
                          {result.text}
                        </pre>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="confidence">
                <div className="space-y-2">
                  {selectedFileData.ocrResults?.map((result, index) => (
                    <Card key={index}>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          Página {result.pageNumber}
                          <Badge 
                            variant={
                              result.confidence > 80 ? 'default' : 
                              result.confidence > 60 ? 'secondary' : 'destructive'
                            }
                          >
                            {Math.round(result.confidence)}% confiança
                          </Badge>
                          <Badge variant="outline">
                            {result.processingTime}ms
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-sm text-gray-600">
                          {result.words.length} palavras reconhecidas
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PDFUploaderV2;