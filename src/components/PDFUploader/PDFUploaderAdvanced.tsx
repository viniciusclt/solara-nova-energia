import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { logWarn } from '@/utils/secureLogger';
import {
  Upload,
  FileText,
  CheckCircle,
  XCircle,
  Eye,
  Settings,
  Zap,
  Battery,
  Sun,
  AlertTriangle,
  Download,
  Trash2,
  RotateCcw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ocrService, OCRSettings, OCRProgress } from '@/services/ocrService';

export interface ProcessedFile {
  id: string;
  file: File;
  status: 'pending' | 'processing' | 'completed' | 'error';
  progress: number;
  ocrResult?: {
    text: string;
    confidence: number;
    extractedData: Record<string, string | number>;
    processingTime: number;
    pages: number;
  };
  error?: string;
  equipmentType: 'module' | 'inverter' | 'battery';
  preview?: string;
}

interface PDFUploaderAdvancedProps {
  onFilesProcessed: (files: ProcessedFile[]) => void;
  maxFiles?: number;
  acceptedTypes?: string[];
  autoProcess?: boolean;
  showPreview?: boolean;
}

const PDFUploaderAdvanced: React.FC<PDFUploaderAdvancedProps> = ({
  onFilesProcessed,
  maxFiles = 10,
  acceptedTypes = ['application/pdf'],
  autoProcess = true,
  showPreview = true
}) => {
  const { toast } = useToast();
  const [files, setFiles] = useState<ProcessedFile[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeTab, setActiveTab] = useState('upload');
  const [ocrSettings, setOcrSettings] = useState<OCRSettings>({
    language: 'eng+por',
    psm: 6,
    oem: 3
  });
  const [batchSettings, setBatchSettings] = useState({
    autoDetectType: true,
    optimizeImages: true,
    parallelProcessing: false,
    maxConcurrent: 2
  });
  const processingRef = useRef<boolean>(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (files.length + acceptedFiles.length > maxFiles) {
      toast({
        title: "Limite excedido",
        description: `Máximo de ${maxFiles} arquivos permitidos`,
        variant: "destructive"
      });
      return;
    }

    const newFiles: ProcessedFile[] = [];
    
    for (const file of acceptedFiles) {
      // Validar PDF
      const validation = await ocrService.validatePDF(file);
      
      if (!validation.valid) {
        toast({
          title: "Arquivo inválido",
          description: `${file.name}: ${validation.error}`,
          variant: "destructive"
        });
        continue;
      }

      const processedFile: ProcessedFile = {
        id: Math.random().toString(36).substr(2, 9),
        file,
        status: 'pending',
        progress: 0,
        equipmentType: detectEquipmentType(file.name)
      };

      // Gerar preview se habilitado
      if (showPreview) {
        try {
          const images = await ocrService.convertPDFToImages(file, 1.0);
          if (images.length > 0) {
            processedFile.preview = images[0].toDataURL('image/jpeg', 0.8);
          }
        } catch (error) {
          logWarn('Erro ao gerar preview do PDF', {
            service: 'PDFUploaderAdvanced',
            error: error instanceof Error ? error.message : 'Erro desconhecido',
            fileName: file.name,
            fileSize: file.size,
            action: 'generatePreview'
          });
        }
      }

      newFiles.push(processedFile);
    }

    setFiles(prev => [...prev, ...newFiles]);

    if (autoProcess && newFiles.length > 0) {
      processFiles(newFiles);
    }
  }, [files.length, maxFiles, autoProcess, showPreview, toast]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf']
    },
    maxFiles,
    disabled: isProcessing
  });

  const detectEquipmentType = (filename: string): 'module' | 'inverter' | 'battery' => {
    const name = filename.toLowerCase();
    
    if (name.includes('inverter') || name.includes('inversor')) {
      return 'inverter';
    }
    if (name.includes('battery') || name.includes('bateria') || name.includes('storage')) {
      return 'battery';
    }
    return 'module'; // Default
  };

  const processFiles = async (filesToProcess: ProcessedFile[] = files.filter(f => f.status === 'pending')) => {
    if (processingRef.current || filesToProcess.length === 0) return;
    
    processingRef.current = true;
    setIsProcessing(true);

    try {
      if (batchSettings.parallelProcessing) {
        // Processamento paralelo
        const chunks = [];
        for (let i = 0; i < filesToProcess.length; i += batchSettings.maxConcurrent) {
          chunks.push(filesToProcess.slice(i, i + batchSettings.maxConcurrent));
        }

        for (const chunk of chunks) {
          await Promise.all(chunk.map(file => processFile(file)));
        }
      } else {
        // Processamento sequencial
        for (const file of filesToProcess) {
          await processFile(file);
        }
      }
    } finally {
      processingRef.current = false;
      setIsProcessing(false);
    }
  };

  const processFile = async (fileToProcess: ProcessedFile) => {
    const updateFile = (updates: Partial<ProcessedFile>) => {
      setFiles(prev => prev.map(f => 
        f.id === fileToProcess.id ? { ...f, ...updates } : f
      ));
    };

    updateFile({ status: 'processing', progress: 0 });

    try {
      const onProgress = (progress: OCRProgress) => {
        updateFile({ progress: progress.progress });
      };

      const result = await ocrService.processEquipmentDatasheet(
        fileToProcess.file,
        fileToProcess.equipmentType,
        ocrSettings,
        onProgress
      );

      updateFile({
        status: 'completed',
        progress: 100,
        ocrResult: result
      });

      toast({
        title: "Processamento concluído",
        description: `${fileToProcess.file.name} processado com ${result.confidence.toFixed(1)}% de confiança`
      });

    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      updateFile({
        status: 'error',
        progress: 0,
        error: errorMessage
      });

      toast({
        title: "Erro no processamento",
        description: `${fileToProcess.file.name}: ${errorMessage}`,
        variant: "destructive"
      });
    }
  };

  const removeFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const retryFile = (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (file) {
      const updatedFile = { ...file, status: 'pending' as const, error: undefined };
      setFiles(prev => prev.map(f => f.id === fileId ? updatedFile : f));
      processFiles([updatedFile]);
    }
  };

  const exportResults = () => {
    const completedFiles = files.filter(f => f.status === 'completed' && f.ocrResult);
    
    if (completedFiles.length === 0) {
      toast({
        title: "Nenhum resultado",
        description: "Não há arquivos processados para exportar",
        variant: "destructive"
      });
      return;
    }

    const results = completedFiles.map(f => ({
      filename: f.file.name,
      equipmentType: f.equipmentType,
      confidence: f.ocrResult!.confidence,
      processingTime: f.ocrResult!.processingTime,
      pages: f.ocrResult!.pages,
      extractedData: f.ocrResult!.extractedData
    }));

    const blob = new Blob([JSON.stringify(results, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ocr-results-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (status: ProcessedFile['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'processing':
        return <div className="h-5 w-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />;
      default:
        return <FileText className="h-5 w-5 text-gray-400" />;
    }
  };

  const getEquipmentIcon = (type: ProcessedFile['equipmentType']) => {
    switch (type) {
      case 'inverter':
        return <Zap className="h-4 w-4" />;
      case 'battery':
        return <Battery className="h-4 w-4" />;
      default:
        return <Sun className="h-4 w-4" />;
    }
  };

  const completedFiles = files.filter(f => f.status === 'completed');
  const processingFiles = files.filter(f => f.status === 'processing');
  const errorFiles = files.filter(f => f.status === 'error');

  React.useEffect(() => {
    onFilesProcessed(files);
  }, [files, onFilesProcessed]);

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
          <TabsTrigger value="results">Resultados</TabsTrigger>
        </TabsList>

        <TabsContent value="upload" className="space-y-4">
          {/* Área de Upload */}
          <Card>
            <CardContent className="p-6">
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragActive
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-300 hover:border-gray-400'
                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  {isDragActive
                    ? 'Solte os arquivos aqui...'
                    : 'Arraste PDFs aqui ou clique para selecionar'}
                </p>
                <p className="text-sm text-gray-500">
                  Máximo {maxFiles} arquivos • Apenas PDFs • Datasheets de equipamentos
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Arquivos */}
          {files.length > 0 && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Arquivos ({files.length})</CardTitle>
                <div className="flex gap-2">
                  {!autoProcess && (
                    <Button
                      onClick={() => processFiles()}
                      disabled={isProcessing || files.filter(f => f.status === 'pending').length === 0}
                      size="sm"
                    >
                      Processar Pendentes
                    </Button>
                  )}
                  <Button
                    onClick={exportResults}
                    disabled={completedFiles.length === 0}
                    size="sm"
                    variant="outline"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Exportar
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {files.map((file) => (
                    <div key={file.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      {/* Preview */}
                      {file.preview && (
                        <div className="flex-shrink-0">
                          <img
                            src={file.preview}
                            alt={`Preview do arquivo ${file.file.name}`}
                            className="w-12 h-12 object-cover rounded border"
                          />
                        </div>
                      )}
                      
                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {getStatusIcon(file.status)}
                          <span className="font-medium truncate">{file.file.name}</span>
                          <Badge variant="outline" className="flex items-center gap-1">
                            {getEquipmentIcon(file.equipmentType)}
                            {file.equipmentType}
                          </Badge>
                        </div>
                        
                        {file.status === 'processing' && (
                          <Progress value={file.progress} className="h-2" />
                        )}
                        
                        {file.status === 'completed' && file.ocrResult && (
                          <div className="text-sm text-gray-600">
                            Confiança: {file.ocrResult.confidence.toFixed(1)}% • 
                            {file.ocrResult.pages} páginas • 
                            {(file.ocrResult.processingTime / 1000).toFixed(1)}s
                          </div>
                        )}
                        
                        {file.status === 'error' && (
                          <div className="text-sm text-red-600">
                            {file.error}
                          </div>
                        )}
                      </div>
                      
                      {/* Ações */}
                      <div className="flex gap-1">
                        {file.status === 'error' && (
                          <Button
                            onClick={() => retryFile(file.id)}
                            size="sm"
                            variant="outline"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          onClick={() => removeFile(file.id)}
                          size="sm"
                          variant="outline"
                          disabled={file.status === 'processing'}
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
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Configurações OCR */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configurações OCR
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
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
                      <SelectItem value="eng">Inglês</SelectItem>
                      <SelectItem value="por">Português</SelectItem>
                      <SelectItem value="eng+por">Inglês + Português</SelectItem>
                      <SelectItem value="spa">Espanhol</SelectItem>
                      <SelectItem value="fra">Francês</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <Label>Modo de Segmentação (PSM): {ocrSettings.psm}</Label>
                  <Slider
                    value={[ocrSettings.psm]}
                    onValueChange={([value]) => setOcrSettings(prev => ({ ...prev, psm: value }))}
                    min={0}
                    max={13}
                    step={1}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    6: Bloco uniforme de texto (recomendado)
                  </p>
                </div>
                
                <div>
                  <Label>Motor OCR (OEM): {ocrSettings.oem}</Label>
                  <Slider
                    value={[ocrSettings.oem]}
                    onValueChange={([value]) => setOcrSettings(prev => ({ ...prev, oem: value }))}
                    min={0}
                    max={3}
                    step={1}
                    className="mt-2"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    3: LSTM + Legacy (recomendado)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Configurações de Lote */}
            <Card>
              <CardHeader>
                <CardTitle>Processamento em Lote</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Detectar tipo automaticamente</Label>
                  <Switch
                    checked={batchSettings.autoDetectType}
                    onCheckedChange={(checked) => setBatchSettings(prev => ({ ...prev, autoDetectType: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Otimizar imagens</Label>
                  <Switch
                    checked={batchSettings.optimizeImages}
                    onCheckedChange={(checked) => setBatchSettings(prev => ({ ...prev, optimizeImages: checked }))}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <Label>Processamento paralelo</Label>
                  <Switch
                    checked={batchSettings.parallelProcessing}
                    onCheckedChange={(checked) => setBatchSettings(prev => ({ ...prev, parallelProcessing: checked }))}
                  />
                </div>
                
                {batchSettings.parallelProcessing && (
                  <div>
                    <Label>Máximo simultâneo: {batchSettings.maxConcurrent}</Label>
                    <Slider
                      value={[batchSettings.maxConcurrent]}
                      onValueChange={([value]) => setBatchSettings(prev => ({ ...prev, maxConcurrent: value }))}
                      min={1}
                      max={5}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          {/* Estatísticas */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{files.length}</div>
                <p className="text-xs text-gray-500">Total de arquivos</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-green-600">{completedFiles.length}</div>
                <p className="text-xs text-gray-500">Processados</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-blue-600">{processingFiles.length}</div>
                <p className="text-xs text-gray-500">Processando</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold text-red-600">{errorFiles.length}</div>
                <p className="text-xs text-gray-500">Com erro</p>
              </CardContent>
            </Card>
          </div>

          {/* Resultados Detalhados */}
          {completedFiles.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Dados Extraídos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {completedFiles.map((file) => (
                    <div key={file.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium">{file.file.name}</h4>
                        <Badge variant="outline">
                          {file.ocrResult!.confidence.toFixed(1)}% confiança
                        </Badge>
                      </div>
                      
                      <div className="grid gap-2 text-sm">
                        {Object.entries(file.ocrResult!.extractedData)
                          .filter(([key]) => !['confidence', 'extractedFields', 'processedAt', 'rawText'].includes(key))
                          .map(([key, value]) => (
                            <div key={key} className="flex justify-between">
                              <span className="text-gray-600 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                              <span className="font-medium">
                                {typeof value === 'object' ? JSON.stringify(value) : value || 'N/A'}
                              </span>
                            </div>
                          ))
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default PDFUploaderAdvanced;