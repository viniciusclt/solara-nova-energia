// ============================================================================
// Export Dialog - Modal de exportação de diagramas
// ============================================================================
// Interface completa para configuração e exportação de diagramas
// ============================================================================

import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Switch } from '../ui/switch';
import { Slider } from '../ui/slider';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import {
  Download,
  Settings,
  Image,
  FileText,
  Palette,
  Layout,
  Eye,
  Save,
  Trash2,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import {
  ExportFormat,
  ExportConfig,
  ExportPreset,
  DiagramExportData,
  ExportResult,
  ImageExportConfig,
  SVGExportConfig,
  PDFExportConfig,
  JSONExportConfig,
  HTMLExportConfig,
  MarkdownExportConfig,
  QUALITY_SETTINGS,
  PAPER_SIZES
} from '../../types/diagramExport';
import diagramExportService from '../../services/DiagramExportService';

// ============================================================================
// TIPOS E INTERFACES
// ============================================================================

interface ExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  diagramData: DiagramExportData;
  onExport?: (result: ExportResult) => void;
}

interface ExportProgress {
  stage: 'preparing' | 'processing' | 'generating' | 'complete';
  progress: number;
  message: string;
}

// ============================================================================
// COMPONENTE PRINCIPAL
// ============================================================================

export const ExportDialog: React.FC<ExportDialogProps> = ({
  isOpen,
  onClose,
  diagramData,
  onExport
}) => {
  // ========================================================================
  // ESTADO
  // ========================================================================

  const [activeTab, setActiveTab] = useState<'config' | 'presets' | 'preview'>('config');
  const [format, setFormat] = useState<ExportFormat>('png');
  const [config, setConfig] = useState<ExportConfig>({ format: 'png' });
  const [presets, setPresets] = useState<ExportPreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState<ExportProgress | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [estimatedSize, setEstimatedSize] = useState<number>(0);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // ========================================================================
  // EFEITOS
  // ========================================================================

  useEffect(() => {
    if (isOpen) {
      loadPresets();
      updateConfig({ format });
    }
  }, [isOpen, format]);

  useEffect(() => {
    if (config) {
      validateConfig();
      estimateFileSize();
    }
  }, [config]);

  // ========================================================================
  // FUNÇÕES AUXILIARES
  // ========================================================================

  const loadPresets = async () => {
    try {
      const loadedPresets = diagramExportService.getPresets();
      setPresets(loadedPresets);
    } catch (error) {
      console.error('Erro ao carregar presets:', error);
    }
  };

  const updateConfig = (updates: Partial<ExportConfig>) => {
    const newConfig = { ...config, ...updates };
    
    // Aplicar configurações padrão baseadas no formato
    if (updates.format && updates.format !== config.format) {
      const defaultConfig = diagramExportService.getDefaultConfig(updates.format);
      setConfig({ ...defaultConfig, ...updates });
    } else {
      setConfig(newConfig);
    }
  };

  const validateConfig = async () => {
    try {
      const validation = diagramExportService.validateConfig(config);
      setValidationErrors(validation.errors);
    } catch (error) {
      setValidationErrors(['Erro na validação da configuração']);
    }
  };

  const estimateFileSize = async () => {
    try {
      const size = await diagramExportService.estimateFileSize(diagramData, config);
      setEstimatedSize(size);
    } catch (error) {
      setEstimatedSize(0);
    }
  };

  const generatePreview = async () => {
    try {
      const preview = await diagramExportService.generatePreview(diagramData, config);
      setPreviewUrl(preview);
    } catch (error) {
      console.error('Erro ao gerar preview:', error);
      setPreviewUrl(null);
    }
  };

  // ========================================================================
  // HANDLERS
  // ========================================================================

  const handleExport = async () => {
    if (validationErrors.length > 0) {
      return;
    }

    setIsExporting(true);
    setExportProgress({ stage: 'preparing', progress: 0, message: 'Preparando exportação...' });

    try {
      // Simular progresso
      setExportProgress({ stage: 'processing', progress: 25, message: 'Processando diagrama...' });
      await new Promise(resolve => setTimeout(resolve, 500));

      setExportProgress({ stage: 'generating', progress: 75, message: 'Gerando arquivo...' });
      
      const result = await diagramExportService.exportDiagram(diagramData, config);
      
      setExportProgress({ stage: 'complete', progress: 100, message: 'Exportação concluída!' });
      
      if (result.success && result.data) {
        // Download do arquivo
        const url = URL.createObjectURL(result.data as Blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = result.filename || `diagram.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        onExport?.(result);
        
        // Fechar dialog após sucesso
        setTimeout(() => {
          onClose();
        }, 1000);
      } else {
        throw new Error(result.error || 'Erro na exportação');
      }
    } catch (error) {
      console.error('Erro na exportação:', error);
      setExportProgress(null);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePresetSelect = (presetId: string) => {
    const preset = presets.find(p => p.id === presetId);
    if (preset) {
      setSelectedPreset(presetId);
      setFormat(preset.config.format);
      setConfig(preset.config);
    }
  };

  const handleSavePreset = async () => {
    try {
      const name = prompt('Nome do preset:');
      if (!name) return;
      
      await diagramExportService.createPreset({
        name,
        description: `Preset personalizado para ${format.toUpperCase()}`,
        config,
        isDefault: false
      });
      
      await loadPresets();
    } catch (error) {
      console.error('Erro ao salvar preset:', error);
    }
  };

  const handleDeletePreset = async (presetId: string) => {
    try {
      await diagramExportService.deletePreset(presetId);
      await loadPresets();
      
      if (selectedPreset === presetId) {
        setSelectedPreset(null);
      }
    } catch (error) {
      console.error('Erro ao deletar preset:', error);
    }
  };

  // ========================================================================
  // RENDERIZAÇÃO DE CONFIGURAÇÕES
  // ========================================================================

  const renderFormatConfig = () => {
    switch (format) {
      case 'png':
      case 'jpeg':
      case 'webp':
        return renderImageConfig();
      case 'svg':
        return renderSVGConfig();
      case 'pdf':
        return renderPDFConfig();
      case 'json':
        return renderJSONConfig();
      case 'html':
        return renderHTMLConfig();
      case 'markdown':
        return renderMarkdownConfig();
      default:
        return null;
    }
  };

  const renderImageConfig = () => {
    const imageConfig = config as ImageExportConfig;
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="width">Largura (px)</Label>
            <Input
              id="width"
              type="number"
              value={imageConfig.width || ''}
              onChange={(e) => updateConfig({ width: parseInt(e.target.value) || undefined })}
              placeholder="Auto"
            />
          </div>
          <div>
            <Label htmlFor="height">Altura (px)</Label>
            <Input
              id="height"
              type="number"
              value={imageConfig.height || ''}
              onChange={(e) => updateConfig({ height: parseInt(e.target.value) || undefined })}
              placeholder="Auto"
            />
          </div>
        </div>
        
        <div>
          <Label>Qualidade</Label>
          <Select
            value={imageConfig.quality || 'medium'}
            onValueChange={(value) => updateConfig({ quality: value as keyof typeof QUALITY_SETTINGS })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Baixa (Rápida)</SelectItem>
              <SelectItem value="medium">Média (Balanceada)</SelectItem>
              <SelectItem value="high">Alta (Lenta)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label>Escala</Label>
          <div className="px-3">
            <Slider
              value={[imageConfig.scale || 1]}
              onValueChange={([value]) => updateConfig({ scale: value })}
              max={4}
              min={0.5}
              step={0.1}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-muted-foreground mt-1">
              <span>0.5x</span>
              <span>{imageConfig.scale || 1}x</span>
              <span>4x</span>
            </div>
          </div>
        </div>
        
        {format === 'jpeg' && (
          <div>
            <Label>Compressão (%)</Label>
            <div className="px-3">
              <Slider
                value={[imageConfig.compression || 90]}
                onValueChange={([value]) => updateConfig({ compression: value })}
                max={100}
                min={10}
                step={5}
                className="w-full"
              />
              <div className="flex justify-between text-sm text-muted-foreground mt-1">
                <span>10%</span>
                <span>{imageConfig.compression || 90}%</span>
                <span>100%</span>
              </div>
            </div>
          </div>
        )}
        
        <div className="flex items-center space-x-2">
          <Switch
            id="includeBackground"
            checked={imageConfig.includeBackground ?? true}
            onCheckedChange={(checked) => updateConfig({ includeBackground: checked })}
          />
          <Label htmlFor="includeBackground">Incluir fundo</Label>
        </div>
        
        {imageConfig.includeBackground && (
          <div>
            <Label htmlFor="backgroundColor">Cor de fundo</Label>
            <Input
              id="backgroundColor"
              type="color"
              value={imageConfig.backgroundColor || '#ffffff'}
              onChange={(e) => updateConfig({ backgroundColor: e.target.value })}
            />
          </div>
        )}
      </div>
    );
  };

  const renderHTMLConfig = () => {
    const htmlConfig = config as HTMLExportConfig;
    
    return (
      <div className="space-y-4">
        <div>
          <Label>Template HTML</Label>
          <Select 
            value={htmlConfig.template || 'basic'} 
            onValueChange={(value: 'basic' | 'interactive' | 'standalone') => updateConfig({ template: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="basic">Básico</SelectItem>
              <SelectItem value="interactive">Interativo</SelectItem>
              <SelectItem value="standalone">Standalone</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="includeCSS"
              checked={htmlConfig.includeCSS ?? true}
              onCheckedChange={(checked) => updateConfig({ includeCSS: checked })}
            />
            <Label htmlFor="includeCSS">Incluir CSS</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="includeJS"
              checked={htmlConfig.includeJS ?? false}
              onCheckedChange={(checked) => updateConfig({ includeJS: checked })}
            />
            <Label htmlFor="includeJS">Incluir JavaScript</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="embedImages"
              checked={htmlConfig.embedImages ?? true}
              onCheckedChange={(checked) => updateConfig({ embedImages: checked })}
            />
            <Label htmlFor="embedImages">Incorporar imagens</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="responsive"
              checked={htmlConfig.responsive ?? true}
              onCheckedChange={(checked) => updateConfig({ responsive: checked })}
            />
            <Label htmlFor="responsive">Design responsivo</Label>
          </div>
        </div>
        
        <div>
          <Label htmlFor="title">Título</Label>
          <Input
            id="title"
            value={htmlConfig.title || ''}
            onChange={(e) => updateConfig({ title: e.target.value })}
            placeholder="Título do documento"
          />
        </div>
        
        <div>
          <Label htmlFor="description">Descrição</Label>
          <Textarea
            id="description"
            value={htmlConfig.description || ''}
            onChange={(e) => updateConfig({ description: e.target.value })}
            placeholder="Descrição do diagrama"
            rows={3}
          />
        </div>
      </div>
    );
  };

  const renderMarkdownConfig = () => {
    const markdownConfig = config as MarkdownExportConfig;
    
    return (
      <div className="space-y-4">
        <div>
          <Label>Nível do cabeçalho</Label>
          <Select 
            value={String(markdownConfig.headingLevel || 2)} 
            onValueChange={(value) => updateConfig({ headingLevel: Number(value) as 1 | 2 | 3 | 4 | 5 | 6 })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">H1 (#)</SelectItem>
              <SelectItem value="2">H2 (##)</SelectItem>
              <SelectItem value="3">H3 (###)</SelectItem>
              <SelectItem value="4">H4 (####)</SelectItem>
              <SelectItem value="5">H5 (#####)</SelectItem>
              <SelectItem value="6">H6 (######)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label>Formato de imagem</Label>
          <Select 
            value={markdownConfig.imageFormat || 'png'} 
            onValueChange={(value: 'png' | 'svg') => updateConfig({ imageFormat: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="png">PNG</SelectItem>
              <SelectItem value="svg">SVG</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label>Formato de tabela</Label>
          <Select 
            value={markdownConfig.tableFormat || 'github'} 
            onValueChange={(value: 'github' | 'standard') => updateConfig({ tableFormat: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="github">GitHub</SelectItem>
              <SelectItem value="standard">Padrão</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="includeMetadata"
              checked={markdownConfig.includeMetadata ?? true}
              onCheckedChange={(checked) => updateConfig({ includeMetadata: checked })}
            />
            <Label htmlFor="includeMetadata">Incluir metadados</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="includeImages"
              checked={markdownConfig.includeImages ?? true}
              onCheckedChange={(checked) => updateConfig({ includeImages: checked })}
            />
            <Label htmlFor="includeImages">Incluir imagens</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="linkImages"
              checked={markdownConfig.linkImages ?? false}
              onCheckedChange={(checked) => updateConfig({ linkImages: checked })}
            />
            <Label htmlFor="linkImages">Links para imagens</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="includeNodeDetails"
              checked={markdownConfig.includeNodeDetails ?? true}
              onCheckedChange={(checked) => updateConfig({ includeNodeDetails: checked })}
            />
            <Label htmlFor="includeNodeDetails">Detalhes dos nós</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="includeEdgeDetails"
              checked={markdownConfig.includeEdgeDetails ?? false}
              onCheckedChange={(checked) => updateConfig({ includeEdgeDetails: checked })}
            />
            <Label htmlFor="includeEdgeDetails">Detalhes das conexões</Label>
          </div>
        </div>
      </div>
    );
  };

  const renderSVGConfig = () => {
    const svgConfig = config as SVGExportConfig;
    
    return (
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="embedFonts"
            checked={svgConfig.embedFonts ?? false}
            onCheckedChange={(checked) => updateConfig({ embedFonts: checked })}
          />
          <Label htmlFor="embedFonts">Incorporar fontes</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="optimized"
            checked={svgConfig.optimized ?? true}
            onCheckedChange={(checked) => updateConfig({ optimized: checked })}
          />
          <Label htmlFor="optimized">Otimizar SVG</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="includeCSS"
            checked={svgConfig.includeCSS ?? false}
            onCheckedChange={(checked) => updateConfig({ includeCSS: checked })}
          />
          <Label htmlFor="includeCSS">Incluir CSS customizado</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="includeBackground"
            checked={svgConfig.includeBackground ?? true}
            onCheckedChange={(checked) => updateConfig({ includeBackground: checked })}
          />
          <Label htmlFor="includeBackground">Incluir fundo</Label>
        </div>
      </div>
    );
  };

  const renderPDFConfig = () => {
    const pdfConfig = config as PDFExportConfig;
    
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Tamanho do papel</Label>
            <Select
              value={pdfConfig.paperSize || 'a4'}
              onValueChange={(value) => updateConfig({ paperSize: value as keyof typeof PAPER_SIZES })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="a4">A4</SelectItem>
                <SelectItem value="a3">A3</SelectItem>
                <SelectItem value="letter">Carta</SelectItem>
                <SelectItem value="legal">Ofício</SelectItem>
                <SelectItem value="custom">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label>Orientação</Label>
            <Select
              value={pdfConfig.orientation || 'portrait'}
              onValueChange={(value) => updateConfig({ orientation: value as 'portrait' | 'landscape' })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="portrait">Retrato</SelectItem>
                <SelectItem value="landscape">Paisagem</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="fitToPage"
            checked={pdfConfig.fitToPage ?? true}
            onCheckedChange={(checked) => updateConfig({ fitToPage: checked })}
          />
          <Label htmlFor="fitToPage">Ajustar à página</Label>
        </div>
        
        <div>
          <Label htmlFor="headerText">Cabeçalho (opcional)</Label>
          <Input
            id="headerText"
            value={pdfConfig.header?.text || ''}
            onChange={(e) => updateConfig({ 
              header: { 
                ...pdfConfig.header, 
                text: e.target.value,
                fontSize: pdfConfig.header?.fontSize || 12,
                alignment: pdfConfig.header?.alignment || 'center'
              } 
            })}
            placeholder="Título do documento"
          />
        </div>
        
        <div>
          <Label htmlFor="footerText">Rodapé (opcional)</Label>
          <Input
            id="footerText"
            value={pdfConfig.footer?.text || ''}
            onChange={(e) => updateConfig({ 
              footer: { 
                ...pdfConfig.footer, 
                text: e.target.value,
                fontSize: pdfConfig.footer?.fontSize || 10,
                alignment: pdfConfig.footer?.alignment || 'center',
                includePageNumber: pdfConfig.footer?.includePageNumber ?? false
              } 
            })}
            placeholder="Informações adicionais"
          />
        </div>
      </div>
    );
  };

  const renderJSONConfig = () => {
    const jsonConfig = config as JSONExportConfig;
    
    return (
      <div className="space-y-4">
        <div>
          <Label htmlFor="schema">Schema</Label>
          <Select
            value={jsonConfig.schema || 'reactflow'}
            onValueChange={(value) => updateConfig({ schema: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="reactflow">ReactFlow</SelectItem>
              <SelectItem value="custom">Personalizado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="minified"
            checked={jsonConfig.minified ?? false}
            onCheckedChange={(checked) => updateConfig({ minified: checked })}
          />
          <Label htmlFor="minified">JSON minificado</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="includePositions"
            checked={jsonConfig.includePositions ?? true}
            onCheckedChange={(checked) => updateConfig({ includePositions: checked })}
          />
          <Label htmlFor="includePositions">Incluir posições</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="includeMetadata"
            checked={jsonConfig.includeMetadata ?? true}
            onCheckedChange={(checked) => updateConfig({ includeMetadata: checked })}
          />
          <Label htmlFor="includeMetadata">Incluir metadados</Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Switch
            id="includeStyles"
            checked={jsonConfig.includeStyles ?? false}
            onCheckedChange={(checked) => updateConfig({ includeStyles: checked })}
          />
          <Label htmlFor="includeStyles">Incluir estilos</Label>
        </div>
      </div>
    );
  };

  // ========================================================================
  // RENDERIZAÇÃO PRINCIPAL
  // ========================================================================

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Diagrama
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="h-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="config" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Configuração
              </TabsTrigger>
              <TabsTrigger value="presets" className="flex items-center gap-2">
                <Save className="h-4 w-4" />
                Presets
              </TabsTrigger>
              <TabsTrigger value="preview" className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                Preview
              </TabsTrigger>
            </TabsList>
            
            <div className="mt-4 h-[500px] overflow-y-auto">
              <TabsContent value="config" className="space-y-6">
                {/* Seleção de formato */}
                <div>
                  <Label>Formato de exportação</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {(['png', 'jpeg', 'webp', 'svg', 'pdf', 'json', 'html', 'markdown'] as ExportFormat[]).map((fmt) => (
                      <Button
                        key={fmt}
                        variant={format === fmt ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFormat(fmt)}
                        className="flex items-center gap-2"
                      >
                        {fmt === 'png' || fmt === 'jpeg' || fmt === 'webp' ? (
                          <Image className="h-4 w-4" />
                        ) : fmt === 'svg' ? (
                          <Palette className="h-4 w-4" />
                        ) : fmt === 'pdf' ? (
                          <FileText className="h-4 w-4" />
                        ) : (
                          <Layout className="h-4 w-4" />
                        )}
                        {fmt.toUpperCase()}
                      </Button>
                    ))}
                  </div>
                </div>
                
                {/* Nome do arquivo */}
                <div>
                  <Label htmlFor="filename">Nome do arquivo</Label>
                  <Input
                    id="filename"
                    value={config.filename || ''}
                    onChange={(e) => updateConfig({ filename: e.target.value })}
                    placeholder={`diagrama.${format}`}
                  />
                </div>
                
                {/* Configurações específicas do formato */}
                {renderFormatConfig()}
                
                {/* Informações */}
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Tamanho estimado:</span>
                    <Badge variant="secondary">
                      {estimatedSize > 1024 * 1024 
                        ? `${(estimatedSize / (1024 * 1024)).toFixed(1)} MB`
                        : `${(estimatedSize / 1024).toFixed(0)} KB`
                      }
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Elementos:</span>
                    <span>{diagramData.nodes.length} nós, {diagramData.edges.length} arestas</span>
                  </div>
                </div>
                
                {/* Erros de validação */}
                {validationErrors.length > 0 && (
                  <div className="bg-destructive/10 border border-destructive/20 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-destructive mb-2">
                      <AlertCircle className="h-4 w-4" />
                      <span className="font-medium">Erros de configuração:</span>
                    </div>
                    <ul className="list-disc list-inside text-sm text-destructive space-y-1">
                      {validationErrors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="presets" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Presets salvos</h3>
                  <Button onClick={handleSavePreset} size="sm">
                    <Save className="h-4 w-4 mr-2" />
                    Salvar atual
                  </Button>
                </div>
                
                <div className="grid gap-3">
                  {presets.map((preset) => (
                    <div
                      key={preset.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedPreset === preset.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => handlePresetSelect(preset.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{preset.name}</h4>
                          <p className="text-sm text-muted-foreground">{preset.description}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <Badge variant="outline">{preset.config.format.toUpperCase()}</Badge>
                            {preset.isDefault && <Badge>Padrão</Badge>}
                          </div>
                        </div>
                        {!preset.isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeletePreset(preset.id);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="preview" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-medium">Preview da exportação</h3>
                  <Button onClick={generatePreview} size="sm">
                    <Eye className="h-4 w-4 mr-2" />
                    Gerar preview
                  </Button>
                </div>
                
                {previewUrl ? (
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <img 
                      src={previewUrl} 
                      alt="Preview" 
                      className="max-w-full max-h-96 mx-auto rounded border"
                    />
                  </div>
                ) : (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                    <Eye className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                    <p className="text-muted-foreground">Clique em "Gerar preview" para visualizar</p>
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </div>
        
        {/* Progress durante exportação */}
        {exportProgress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>{exportProgress.message}</span>
              <span>{exportProgress.progress}%</span>
            </div>
            <Progress value={exportProgress.progress} className="w-full" />
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isExporting}>
            Cancelar
          </Button>
          <Button 
            onClick={handleExport} 
            disabled={isExporting || validationErrors.length > 0}
            className="flex items-center gap-2"
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Download className="h-4 w-4" />
            )}
            {isExporting ? 'Exportando...' : 'Exportar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ExportDialog;