import React, { useState, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Download,
  FileText,
  Presentation,
  Image,
  Settings,
  X,
  Check,
  AlertCircle,
  Loader2,
  Eye,
  Share2,
  Mail,
  Link,
  Printer,
  Layers,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
} from 'lucide-react';
import { useProposalEditor } from '../../hooks/useProposalEditor';
import { ExportFormat, ExportOptions, ExportResult } from '../../types/proposal';
import { cn } from '../../utils/cn';
import { toast } from 'sonner';

// =====================================================================================
// INTERFACES
// =====================================================================================

interface ExportSystemProps {
  className?: string;
  onExportComplete?: (result: ExportResult) => void;
  onClose?: () => void;
}

interface ExportProgress {
  stage: string;
  progress: number;
  message: string;
}

// =====================================================================================
// COMPONENTE PRINCIPAL
// =====================================================================================

export const ExportSystem: React.FC<ExportSystemProps> = ({
  className,
  onExportComplete,
  onClose,
}) => {
  const { canvasState, elements, canvasConfig } = useProposalEditor();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // =====================================================================================
  // ESTADO
  // =====================================================================================

  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf');
  const [showOptions, setShowOptions] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [exportResult, setExportResult] = useState<ExportResult | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [previewMode, setPreviewMode] = useState<'static' | 'animated'>('static');
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: 'pdf',
    quality: 'high',
    includeAnimations: true,
    includeNotes: false,
    pageSize: 'A4',
    orientation: 'landscape',
    margins: { top: 20, right: 20, bottom: 20, left: 20 },
    resolution: 300,
    compression: 'medium',
    watermark: {
      enabled: false,
      text: '',
      opacity: 0.3,
      position: 'bottom-right',
    },
    metadata: {
      title: '',
      author: '',
      subject: '',
      keywords: [],
    },
  });

  // =====================================================================================
  // FORMATOS DE EXPORTAÇÃO
  // =====================================================================================

  const exportFormats = [
    {
      format: 'pdf' as ExportFormat,
      label: 'PDF',
      description: 'Documento portátil para impressão e compartilhamento',
      icon: FileText,
      features: ['Layout preservado', 'Compatibilidade universal', 'Compressão otimizada'],
      recommended: true,
    },
    {
      format: 'pptx' as ExportFormat,
      label: 'PowerPoint',
      description: 'Apresentação editável com animações',
      icon: Presentation,
      features: ['Animações preservadas', 'Editável', 'Transições suaves'],
      recommended: false,
    },
    {
      format: 'png' as ExportFormat,
      label: 'PNG',
      description: 'Imagem de alta qualidade',
      icon: Image,
      features: ['Alta resolução', 'Transparência', 'Qualidade visual'],
      recommended: false,
    },
    {
      format: 'jpg' as ExportFormat,
      label: 'JPEG',
      description: 'Imagem comprimida para web',
      icon: Image,
      features: ['Arquivo menor', 'Compatibilidade web', 'Carregamento rápido'],
      recommended: false,
    },
  ];

  // =====================================================================================
  // HANDLERS
  // =====================================================================================

  const updateExportOptions = useCallback((updates: Partial<ExportOptions>) => {
    setExportOptions(prev => ({ ...prev, ...updates }));
  }, []);

  const generateCanvas = useCallback(async (): Promise<HTMLCanvasElement> => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    
    // Configurar dimensões baseadas na resolução
    const scale = exportOptions.resolution / 96; // 96 DPI base
    canvas.width = canvasConfig.width * scale;
    canvas.height = canvasConfig.height * scale;
    
    // Escalar contexto
    ctx.scale(scale, scale);
    
    // Fundo
    ctx.fillStyle = canvasConfig.backgroundColor || '#ffffff';
    ctx.fillRect(0, 0, canvasConfig.width, canvasConfig.height);
    
    // Renderizar elementos
    for (const element of elements) {
      if (!element.visible) continue;
      
      const { transform } = element;
      
      ctx.save();
      
      // Aplicar transformações
      ctx.translate(
        transform.position.x + transform.size.width / 2,
        transform.position.y + transform.size.height / 2
      );
      ctx.rotate((transform.rotation * Math.PI) / 180);
      ctx.scale(transform.scale, transform.scale);
      ctx.globalAlpha = element.opacity;
      
      // Renderizar baseado no tipo
      switch (element.type) {
        case 'text':
          ctx.font = `${element.fontWeight || 'normal'} ${element.fontSize || 16}px ${element.fontFamily || 'Arial'}`;
          ctx.fillStyle = element.color || '#000000';
          ctx.textAlign = (element.textAlign as CanvasTextAlign) || 'left';
          ctx.textBaseline = 'middle';
          
          const lines = (element.content || '').split('\n');
          const lineHeight = (element.fontSize || 16) * 1.2;
          const startY = -(lines.length - 1) * lineHeight / 2;
          
          lines.forEach((line, index) => {
            ctx.fillText(
              line,
              -transform.size.width / 2,
              startY + index * lineHeight
            );
          });
          break;
          
        case 'image':
          if (element.src) {
            const img = new Image();
            img.crossOrigin = 'anonymous';
            await new Promise((resolve, reject) => {
              img.onload = resolve;
              img.onerror = reject;
              img.src = element.src!;
            });
            
            ctx.drawImage(
              img,
              -transform.size.width / 2,
              -transform.size.height / 2,
              transform.size.width,
              transform.size.height
            );
          }
          break;
          
        case 'shape':
          ctx.fillStyle = element.fill || '#cccccc';
          ctx.strokeStyle = element.stroke || '#000000';
          ctx.lineWidth = element.strokeWidth || 1;
          
          const halfWidth = transform.size.width / 2;
          const halfHeight = transform.size.height / 2;
          
          switch (element.shapeType) {
            case 'rectangle':
              ctx.fillRect(-halfWidth, -halfHeight, transform.size.width, transform.size.height);
              if (element.stroke) {
                ctx.strokeRect(-halfWidth, -halfHeight, transform.size.width, transform.size.height);
              }
              break;
              
            case 'circle':
              ctx.beginPath();
              ctx.ellipse(0, 0, halfWidth, halfHeight, 0, 0, 2 * Math.PI);
              ctx.fill();
              if (element.stroke) {
                ctx.stroke();
              }
              break;
              
            case 'triangle':
              ctx.beginPath();
              ctx.moveTo(0, -halfHeight);
              ctx.lineTo(-halfWidth, halfHeight);
              ctx.lineTo(halfWidth, halfHeight);
              ctx.closePath();
              ctx.fill();
              if (element.stroke) {
                ctx.stroke();
              }
              break;
          }
          break;
      }
      
      ctx.restore();
    }
    
    // Watermark
    if (exportOptions.watermark?.enabled && exportOptions.watermark.text) {
      ctx.save();
      ctx.globalAlpha = exportOptions.watermark.opacity;
      ctx.font = '14px Arial';
      ctx.fillStyle = '#666666';
      
      const watermarkText = exportOptions.watermark.text;
      const textMetrics = ctx.measureText(watermarkText);
      
      let x, y;
      switch (exportOptions.watermark.position) {
        case 'top-left':
          x = 20;
          y = 30;
          break;
        case 'top-right':
          x = canvasConfig.width - textMetrics.width - 20;
          y = 30;
          break;
        case 'bottom-left':
          x = 20;
          y = canvasConfig.height - 20;
          break;
        case 'bottom-right':
        default:
          x = canvasConfig.width - textMetrics.width - 20;
          y = canvasConfig.height - 20;
          break;
      }
      
      ctx.fillText(watermarkText, x, y);
      ctx.restore();
    }
    
    return canvas;
  }, [elements, canvasConfig, exportOptions]);

  const exportToPDF = useCallback(async (canvas: HTMLCanvasElement): Promise<Blob> => {
    // Em uma implementação real, usaríamos uma biblioteca como jsPDF
    // Por agora, vamos simular a geração do PDF
    
    setExportProgress({ stage: 'Gerando PDF', progress: 50, message: 'Convertendo canvas para PDF...' });
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Simular criação do PDF
    const pdfData = canvas.toDataURL('image/png');
    const blob = await fetch(pdfData).then(r => r.blob());
    
    return blob;
  }, []);

  const exportToPPTX = useCallback(async (canvas: HTMLCanvasElement): Promise<Blob> => {
    // Em uma implementação real, usaríamos uma biblioteca como PptxGenJS
    // Por agora, vamos simular a geração do PPTX
    
    setExportProgress({ stage: 'Gerando PowerPoint', progress: 50, message: 'Criando apresentação...' });
    
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simular criação do PPTX
    const pptxData = canvas.toDataURL('image/png');
    const blob = await fetch(pptxData).then(r => r.blob());
    
    return blob;
  }, []);

  const exportToImage = useCallback(async (canvas: HTMLCanvasElement, format: 'png' | 'jpg'): Promise<Blob> => {
    setExportProgress({ stage: 'Gerando imagem', progress: 50, message: `Convertendo para ${format.toUpperCase()}...` });
    
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const mimeType = format === 'png' ? 'image/png' : 'image/jpeg';
    const quality = format === 'jpg' ? 0.9 : undefined;
    
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob!);
      }, mimeType, quality);
    });
  }, []);

  const handleExport = useCallback(async () => {
    if (isExporting) return;
    
    setIsExporting(true);
    setExportProgress({ stage: 'Preparando', progress: 0, message: 'Iniciando exportação...' });
    
    try {
      // Gerar canvas
      setExportProgress({ stage: 'Renderizando', progress: 20, message: 'Renderizando elementos...' });
      const canvas = await generateCanvas();
      
      // Exportar baseado no formato
      let blob: Blob;
      let filename: string;
      
      switch (selectedFormat) {
        case 'pdf':
          blob = await exportToPDF(canvas);
          filename = `proposta_${Date.now()}.pdf`;
          break;
          
        case 'pptx':
          blob = await exportToPPTX(canvas);
          filename = `proposta_${Date.now()}.pptx`;
          break;
          
        case 'png':
          blob = await exportToImage(canvas, 'png');
          filename = `proposta_${Date.now()}.png`;
          break;
          
        case 'jpg':
          blob = await exportToImage(canvas, 'jpg');
          filename = `proposta_${Date.now()}.jpg`;
          break;
          
        default:
          throw new Error('Formato não suportado');
      }
      
      setExportProgress({ stage: 'Finalizando', progress: 90, message: 'Preparando download...' });
      
      // Criar resultado
      const result: ExportResult = {
        success: true,
        format: selectedFormat,
        filename,
        size: blob.size,
        url: URL.createObjectURL(blob),
        downloadUrl: URL.createObjectURL(blob),
      };
      
      setExportProgress({ stage: 'Concluído', progress: 100, message: 'Exportação concluída!' });
      setExportResult(result);
      
      // Callback
      onExportComplete?.(result);
      
      // Download automático
      const link = document.createElement('a');
      link.href = result.downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`Arquivo exportado como ${filename}`);
      
    } catch (error) {
      console.error('Erro na exportação:', error);
      
      const result: ExportResult = {
        success: false,
        format: selectedFormat,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      };
      
      setExportResult(result);
      toast.error('Erro ao exportar arquivo');
    } finally {
      setIsExporting(false);
      setTimeout(() => {
        setExportProgress(null);
      }, 2000);
    }
  }, [selectedFormat, generateCanvas, exportToPDF, exportToPPTX, exportToImage, onExportComplete, isExporting]);

  const handlePreview = useCallback(() => {
    setShowPreview(true);
  }, []);

  const togglePlayback = useCallback(() => {
    setIsPlaying(!isPlaying);
  }, [isPlaying]);

  const nextSlide = useCallback(() => {
    setCurrentSlide(prev => Math.min(prev + 1, elements.length - 1));
  }, [elements.length]);

  const prevSlide = useCallback(() => {
    setCurrentSlide(prev => Math.max(prev - 1, 0));
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!isFullscreen) {
      document.documentElement.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  // =====================================================================================
  // COMPONENTES
  // =====================================================================================

  const FormatSelector = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Escolha o formato</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {exportFormats.map(({ format, label, description, icon: Icon, features, recommended }) => (
          <motion.div
            key={format}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "relative p-4 border-2 rounded-lg cursor-pointer transition-all",
              selectedFormat === format
                ? "border-blue-500 bg-blue-50"
                : "border-gray-200 hover:border-gray-300"
            )}
            onClick={() => {
              setSelectedFormat(format);
              updateExportOptions({ format });
            }}
          >
            {recommended && (
              <div className="absolute -top-2 -right-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full">
                Recomendado
              </div>
            )}
            
            <div className="flex items-start space-x-3">
              <div className={cn(
                "p-2 rounded-lg",
                selectedFormat === format ? "bg-blue-100" : "bg-gray-100"
              )}>
                <Icon className={cn(
                  "w-6 h-6",
                  selectedFormat === format ? "text-blue-600" : "text-gray-600"
                )} />
              </div>
              
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 mb-1">{label}</h4>
                <p className="text-sm text-gray-600 mb-3">{description}</p>
                
                <ul className="space-y-1">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-center space-x-2 text-xs text-gray-500">
                      <Check className="w-3 h-3 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            
            {selectedFormat === format && (
              <div className="absolute top-2 right-2">
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              </div>
            )}
          </motion.div>
        ))}
      </div>
    </div>
  );

  const OptionsPanel = () => (
    <AnimatePresence>
      {showOptions && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-gray-200 p-4 space-y-6"
        >
          {/* Qualidade */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Qualidade
            </label>
            <select
              value={exportOptions.quality}
              onChange={(e) => updateExportOptions({ quality: e.target.value as 'low' | 'medium' | 'high' | 'ultra' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="low">Baixa (Arquivo menor)</option>
              <option value="medium">Média (Balanceado)</option>
              <option value="high">Alta (Melhor qualidade)</option>
            </select>
          </div>

          {/* Resolução */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Resolução (DPI)
            </label>
            <select
              value={exportOptions.resolution}
              onChange={(e) => updateExportOptions({ resolution: parseInt(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value={150}>150 DPI (Web)</option>
              <option value={300}>300 DPI (Impressão)</option>
              <option value={600}>600 DPI (Alta qualidade)</option>
            </select>
          </div>

          {/* Orientação */}
          {(selectedFormat === 'pdf' || selectedFormat === 'pptx') && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Orientação
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="landscape"
                    checked={exportOptions.orientation === 'landscape'}
                    onChange={(e) => updateExportOptions({ orientation: e.target.value as 'portrait' | 'landscape' })}
                    className="mr-2"
                  />
                  Paisagem
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="portrait"
                    checked={exportOptions.orientation === 'portrait'}
                    onChange={(e) => updateExportOptions({ orientation: e.target.value as 'portrait' | 'landscape' })}
                    className="mr-2"
                  />
                  Retrato
                </label>
              </div>
            </div>
          )}

          {/* Animações */}
          {selectedFormat === 'pptx' && (
            <div>
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={exportOptions.includeAnimations}
                  onChange={(e) => updateExportOptions({ includeAnimations: e.target.checked })}
                  className="mr-2"
                />
                Incluir animações
              </label>
            </div>
          )}

          {/* Watermark */}
          <div>
            <label className="flex items-center mb-2">
              <input
                type="checkbox"
                checked={exportOptions.watermark?.enabled}
                onChange={(e) => updateExportOptions({
                  watermark: { ...exportOptions.watermark!, enabled: e.target.checked }
                })}
                className="mr-2"
              />
              Adicionar marca d'água
            </label>
            
            {exportOptions.watermark?.enabled && (
              <div className="ml-6 space-y-3">
                <input
                  type="text"
                  placeholder="Texto da marca d'água"
                  value={exportOptions.watermark.text}
                  onChange={(e) => updateExportOptions({
                    watermark: { ...exportOptions.watermark!, text: e.target.value }
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
                
                <div className="flex items-center space-x-4">
                  <label className="text-sm text-gray-700">Opacidade:</label>
                  <input
                    type="range"
                    min="0.1"
                    max="1"
                    step="0.1"
                    value={exportOptions.watermark.opacity}
                    onChange={(e) => updateExportOptions({
                      watermark: { ...exportOptions.watermark!, opacity: parseFloat(e.target.value) }
                    })}
                    className="flex-1"
                  />
                  <span className="text-sm text-gray-500">
                    {Math.round(exportOptions.watermark.opacity * 100)}%
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Metadados */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-3">Metadados</h4>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Título"
                value={exportOptions.metadata?.title || ''}
                onChange={(e) => updateExportOptions({
                  metadata: { ...exportOptions.metadata!, title: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
              
              <input
                type="text"
                placeholder="Autor"
                value={exportOptions.metadata?.author || ''}
                onChange={(e) => updateExportOptions({
                  metadata: { ...exportOptions.metadata!, author: e.target.value }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const ProgressIndicator = () => (
    <AnimatePresence>
      {exportProgress && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
        >
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="text-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin mx-auto mb-4" />
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {exportProgress.stage}
              </h3>
              
              <p className="text-sm text-gray-600 mb-4">
                {exportProgress.message}
              </p>
              
              <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                <motion.div
                  className="bg-blue-600 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${exportProgress.progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
              
              <p className="text-xs text-gray-500">
                {exportProgress.progress}% concluído
              </p>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  const PreviewModal = () => (
    <AnimatePresence>
      {showPreview && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50"
        >
          <div className="w-full h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 bg-black bg-opacity-50">
              <div className="flex items-center space-x-4">
                <h3 className="text-white font-semibold">Preview da Apresentação</h3>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPreviewMode('static')}
                    className={cn(
                      "px-3 py-1 rounded text-sm",
                      previewMode === 'static'
                        ? "bg-white text-black"
                        : "bg-gray-700 text-white hover:bg-gray-600"
                    )}
                  >
                    Estático
                  </button>
                  
                  <button
                    onClick={() => setPreviewMode('animated')}
                    className={cn(
                      "px-3 py-1 rounded text-sm",
                      previewMode === 'animated'
                        ? "bg-white text-black"
                        : "bg-gray-700 text-white hover:bg-gray-600"
                    )}
                  >
                    Animado
                  </button>
                </div>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={toggleFullscreen}
                  className="p-2 text-white hover:bg-gray-700 rounded"
                >
                  {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
                </button>
                
                <button
                  onClick={() => setShowPreview(false)}
                  className="p-2 text-white hover:bg-gray-700 rounded"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Conteúdo */}
            <div className="flex-1 flex items-center justify-center p-4">
              <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full aspect-video">
                <canvas
                  ref={canvasRef}
                  className="w-full h-full rounded-lg"
                />
              </div>
            </div>
            
            {/* Controles */}
            {previewMode === 'animated' && (
              <div className="p-4 bg-black bg-opacity-50">
                <div className="flex items-center justify-center space-x-4">
                  <button
                    onClick={prevSlide}
                    disabled={currentSlide === 0}
                    className="p-2 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                  >
                    <SkipBack className="w-5 h-5" />
                  </button>
                  
                  <button
                    onClick={togglePlayback}
                    className="p-3 bg-blue-600 text-white hover:bg-blue-700 rounded-full"
                  >
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                  </button>
                  
                  <button
                    onClick={nextSlide}
                    disabled={currentSlide === elements.length - 1}
                    className="p-2 text-white hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed rounded"
                  >
                    <SkipForward className="w-5 h-5" />
                  </button>
                  
                  <div className="flex items-center space-x-2 ml-8">
                    <button
                      onClick={() => setVolume(volume > 0 ? 0 : 1)}
                      className="p-2 text-white hover:bg-gray-700 rounded"
                    >
                      {volume > 0 ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                    </button>
                    
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      value={volume}
                      onChange={(e) => setVolume(parseFloat(e.target.value))}
                      className="w-20"
                    />
                  </div>
                  
                  <div className="text-white text-sm ml-8">
                    {currentSlide + 1} / {elements.length}
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // =====================================================================================
  // RENDER
  // =====================================================================================

  return (
    <>
      <div className={cn("bg-white border border-gray-200 rounded-lg overflow-hidden", className)}>
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Download className="w-5 h-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">Exportar Proposta</h2>
            </div>
            
            {onClose && (
              <button
                onClick={onClose}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* Conteúdo */}
        <div className="p-6">
          <FormatSelector />
          
          {/* Opções avançadas */}
          <div className="mt-6">
            <button
              onClick={() => setShowOptions(!showOptions)}
              className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Opções avançadas</span>
              <motion.div
                animate={{ rotate: showOptions ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4" />
              </motion.div>
            </button>
          </div>
          
          <OptionsPanel />
          
          {/* Resultado */}
          {exportResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "mt-6 p-4 rounded-lg border",
                exportResult.success
                  ? "bg-green-50 border-green-200"
                  : "bg-red-50 border-red-200"
              )}
            >
              <div className="flex items-start space-x-3">
                {exportResult.success ? (
                  <Check className="w-5 h-5 text-green-600 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-red-600 mt-0.5" />
                )}
                
                <div className="flex-1">
                  <h4 className={cn(
                    "font-medium",
                    exportResult.success ? "text-green-900" : "text-red-900"
                  )}>
                    {exportResult.success ? 'Exportação concluída!' : 'Erro na exportação'}
                  </h4>
                  
                  {exportResult.success ? (
                    <div className="mt-2 space-y-1 text-sm text-green-700">
                      <p>Arquivo: {exportResult.filename}</p>
                      <p>Tamanho: {(exportResult.size! / 1024 / 1024).toFixed(2)} MB</p>
                      
                      <div className="flex items-center space-x-2 mt-3">
                        <a
                          href={exportResult.downloadUrl}
                          download={exportResult.filename}
                          className="inline-flex items-center space-x-1 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download</span>
                        </a>
                        
                        <button
                          onClick={() => {
                            navigator.share?.({
                              title: 'Proposta',
                              files: [new File([exportResult.url!], exportResult.filename!)],
                            });
                          }}
                          className="inline-flex items-center space-x-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                        >
                          <Share2 className="w-4 h-4" />
                          <span>Compartilhar</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1 text-sm text-red-700">
                      {exportResult.error}
                    </p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Ações */}
        <div className="p-4 border-t border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <button
              onClick={handlePreview}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <Eye className="w-4 h-4" />
              <span>Visualizar</span>
            </button>
            
            <div className="flex items-center space-x-3">
              {onClose && (
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancelar
                </button>
              )}
              
              <button
                onClick={handleExport}
                disabled={isExporting || elements.length === 0}
                className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isExporting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>{isExporting ? 'Exportando...' : 'Exportar'}</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modais */}
      <ProgressIndicator />
      <PreviewModal />
    </>
  );
};

export default ExportSystem;