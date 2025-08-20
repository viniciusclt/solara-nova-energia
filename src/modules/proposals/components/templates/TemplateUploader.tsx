import React, { useState, useCallback, useRef } from 'react';
import { Upload, FileText, AlertCircle, CheckCircle, X, Loader2 } from 'lucide-react';
import { Button } from '../../../../shared/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../shared/ui/card';
import { Progress } from '../../../../shared/ui/progress';
import { Badge } from '../../../../shared/ui/badge';
import { Alert, AlertDescription } from '../../../../shared/ui/alert';
import { Input } from '../../../../shared/ui/input';
import { Label } from '../../../../shared/ui/label';
import { Textarea } from '../../../../shared/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../shared/ui/select';
import { Checkbox } from '../../../../shared/ui/checkbox';
import { fileConverter } from '../../services/fileConverter';
import { 
  SupportedFileFormat, 
  ConversionStatus, 
  TemplateCategory, 
  UploadProgress,
  ConversionResult,
  FileValidationResult,
  TemplateMetadata
} from '../../types/template';
import { logInfo, logError } from '../../../../core/utils/logger';

interface TemplateUploaderProps {
  onUploadComplete?: (result: ConversionResult) => void;
  onUploadError?: (error: string) => void;
  maxFileSize?: number;
  allowedFormats?: SupportedFileFormat[];
  className?: string;
}

interface UploadState {
  status: ConversionStatus;
  progress: UploadProgress | null;
  validation: FileValidationResult | null;
  result: ConversionResult | null;
  selectedFile: File | null;
}

const SUPPORTED_FORMATS: Record<SupportedFileFormat, { label: string; icon: string; description: string }> = {
  doc: { label: 'Word 97-2003', icon: '📄', description: 'Documento Word legado' },
  docx: { label: 'Word Document', icon: '📄', description: 'Documento Word moderno' },
  pdf: { label: 'PDF Document', icon: '📕', description: 'Documento PDF' },
  ppt: { label: 'PowerPoint 97-2003', icon: '📊', description: 'Apresentação PowerPoint legado' },
  pptx: { label: 'PowerPoint', icon: '📊', description: 'Apresentação PowerPoint moderna' },
  xls: { label: 'Excel 97-2003', icon: '📈', description: 'Planilha Excel legado' },
  xlsx: { label: 'Excel Spreadsheet', icon: '📈', description: 'Planilha Excel moderna' }
};

const TEMPLATE_CATEGORIES: Record<TemplateCategory, string> = {
  commercial: 'Comercial',
  technical: 'Técnico',
  financial: 'Financeiro',
  presentation: 'Apresentação',
  report: 'Relatório',
  custom: 'Personalizado'
};

export const TemplateUploader: React.FC<TemplateUploaderProps> = ({
  onUploadComplete,
  onUploadError,
  maxFileSize = 50 * 1024 * 1024, // 50MB
  allowedFormats = ['doc', 'docx', 'pdf', 'ppt', 'pptx'],
  className
}) => {
  const [uploadState, setUploadState] = useState<UploadState>({
    status: 'idle',
    progress: null,
    validation: null,
    result: null,
    selectedFile: null
  });

  const [templateMetadata, setTemplateMetadata] = useState<Partial<TemplateMetadata>>({
    name: '',
    description: '',
    category: 'custom',
    tags: [],
    isPublic: false
  });

  const [tagInput, setTagInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((file: File) => {
    logInfo('Arquivo selecionado para upload', 'TemplateUploader', { fileName: file.name, size: file.size });

    // Validar arquivo
    const validation = fileConverter.validateFile(file);
    
    setUploadState(prev => ({
      ...prev,
      selectedFile: file,
      validation,
      status: validation.isValid ? 'idle' : 'error'
    }));

    // Preencher nome automaticamente se vazio
    if (!templateMetadata.name) {
      const nameWithoutExtension = file.name.replace(/\.[^/.]+$/, '');
      setTemplateMetadata(prev => ({
        ...prev,
        name: nameWithoutExtension,
        originalFormat: validation.fileInfo.format
      }));
    }
  }, [templateMetadata.name]);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  }, []);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleUpload = useCallback(async () => {
    if (!uploadState.selectedFile || !uploadState.validation?.isValid) {
      return;
    }

    try {
      setUploadState(prev => ({ ...prev, status: 'uploading' }));

      // Upload do arquivo
      const { url } = await fileConverter.uploadFile(
        uploadState.selectedFile,
        (progress) => {
          setUploadState(prev => ({ ...prev, progress }));
        }
      );

      setUploadState(prev => ({ ...prev, status: 'converting' }));

      // Conversão para template
      const result = await fileConverter.convertToTemplate(
        url,
        {
          ...templateMetadata,
          uploadedBy: 'current-user', // TODO: pegar do contexto de auth
          uploadedAt: new Date()
        },
        {
          preserveFormatting: true,
          extractImages: true,
          extractTables: true,
          extractCharts: true,
          targetFormat: 'proposal',
          quality: 'high'
        },
        (progress) => {
          setUploadState(prev => ({ ...prev, progress }));
        }
      );

      setUploadState(prev => ({
        ...prev,
        status: result.success ? 'completed' : 'error',
        result
      }));

      if (result.success) {
        onUploadComplete?.(result);
        logInfo('Upload e conversão concluídos com sucesso', 'TemplateUploader', { templateId: result.template?.id });
      } else {
        onUploadError?.(result.error || 'Erro na conversão');
        logError('Erro na conversão do template', 'TemplateUploader', result.error);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      setUploadState(prev => ({ ...prev, status: 'error' }));
      onUploadError?.(errorMessage);
      logError('Erro no upload do template', 'TemplateUploader', error);
    }
  }, [uploadState.selectedFile, uploadState.validation, templateMetadata, onUploadComplete, onUploadError]);

  const handleAddTag = useCallback(() => {
    if (tagInput.trim() && !templateMetadata.tags?.includes(tagInput.trim())) {
      setTemplateMetadata(prev => ({
        ...prev,
        tags: [...(prev.tags || []), tagInput.trim()]
      }));
      setTagInput('');
    }
  }, [tagInput, templateMetadata.tags]);

  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setTemplateMetadata(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }));
  }, []);

  const handleReset = useCallback(() => {
    setUploadState({
      status: 'idle',
      progress: null,
      validation: null,
      result: null,
      selectedFile: null
    });
    setTemplateMetadata({
      name: '',
      description: '',
      category: 'custom',
      tags: [],
      isPublic: false
    });
    setTagInput('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  const isUploading = uploadState.status === 'uploading' || uploadState.status === 'converting';
  const canUpload = uploadState.selectedFile && uploadState.validation?.isValid && templateMetadata.name && !isUploading;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload de Template
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Drop Zone */}
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center transition-colors
              ${uploadState.selectedFile ? 'border-green-300 bg-green-50' : 'border-gray-300 hover:border-gray-400'}
              ${isUploading ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
            `}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={allowedFormats.map(format => `.${format}`).join(',')}
              onChange={handleFileInputChange}
              className="hidden"
              disabled={isUploading}
            />

            {uploadState.selectedFile ? (
              <div className="space-y-2">
                <FileText className="h-12 w-12 mx-auto text-green-600" />
                <p className="font-medium text-green-800">{uploadState.selectedFile.name}</p>
                <p className="text-sm text-green-600">
                  {(uploadState.selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-12 w-12 mx-auto text-gray-400" />
                <p className="text-lg font-medium text-gray-700">
                  Arraste um arquivo aqui ou clique para selecionar
                </p>
                <p className="text-sm text-gray-500">
                  Formatos suportados: {allowedFormats.map(format => format.toUpperCase()).join(', ')}
                </p>
                <p className="text-xs text-gray-400">
                  Tamanho máximo: {(maxFileSize / 1024 / 1024).toFixed(0)}MB
                </p>
              </div>
            )}
          </div>

          {/* Validation Messages */}
          {uploadState.validation && (
            <div className="mt-4 space-y-2">
              {uploadState.validation.errors.map((error, index) => (
                <Alert key={index} variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              ))}
              {uploadState.validation.warnings.map((warning, index) => (
                <Alert key={index}>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{warning}</AlertDescription>
                </Alert>
              ))}
            </div>
          )}

          {/* Supported Formats */}
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-700 mb-3">Formatos Suportados:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {allowedFormats.map((format) => {
                const formatInfo = SUPPORTED_FORMATS[format];
                return (
                  <div key={format} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                    <span className="text-lg">{formatInfo.icon}</span>
                    <div>
                      <p className="text-xs font-medium">{formatInfo.label}</p>
                      <p className="text-xs text-gray-500">{formatInfo.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Template Metadata */}
      {uploadState.selectedFile && uploadState.validation?.isValid && (
        <Card>
          <CardHeader>
            <CardTitle>Informações do Template</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Nome */}
            <div>
              <Label htmlFor="template-name">Nome do Template *</Label>
              <Input
                id="template-name"
                value={templateMetadata.name || ''}
                onChange={(e) => setTemplateMetadata(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Digite o nome do template"
                disabled={isUploading}
              />
            </div>

            {/* Descrição */}
            <div>
              <Label htmlFor="template-description">Descrição</Label>
              <Textarea
                id="template-description"
                value={templateMetadata.description || ''}
                onChange={(e) => setTemplateMetadata(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Descreva o propósito e conteúdo do template"
                rows={3}
                disabled={isUploading}
              />
            </div>

            {/* Categoria */}
            <div>
              <Label htmlFor="template-category">Categoria</Label>
              <Select
                value={templateMetadata.category}
                onValueChange={(value: TemplateCategory) => 
                  setTemplateMetadata(prev => ({ ...prev, category: value }))
                }
                disabled={isUploading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(TEMPLATE_CATEGORIES).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Tags */}
            <div>
              <Label>Tags</Label>
              <div className="flex gap-2 mb-2">
                <Input
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  placeholder="Adicionar tag"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddTag()}
                  disabled={isUploading}
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={handleAddTag}
                  disabled={!tagInput.trim() || isUploading}
                >
                  Adicionar
                </Button>
              </div>
              {templateMetadata.tags && templateMetadata.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {templateMetadata.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => handleRemoveTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Público */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="template-public"
                checked={templateMetadata.isPublic}
                onCheckedChange={(checked) => 
                  setTemplateMetadata(prev => ({ ...prev, isPublic: !!checked }))
                }
                disabled={isUploading}
              />
              <Label htmlFor="template-public">Tornar template público</Label>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress */}
      {uploadState.progress && (
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">
                  {uploadState.progress.message || 'Processando...'}
                </span>
                <span className="text-sm text-gray-500">
                  {uploadState.progress.percentage}%
                </span>
              </div>
              <Progress value={uploadState.progress.percentage} className="w-full" />
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <Loader2 className="h-3 w-3 animate-spin" />
                Estágio: {uploadState.progress.stage}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Result */}
      {uploadState.result && (
        <Card>
          <CardContent className="pt-6">
            {uploadState.result.success ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Template criado com sucesso!</span>
                </div>
                <div className="text-sm text-gray-600">
                  <p>Elementos extraídos:</p>
                  <ul className="list-disc list-inside ml-4 space-y-1">
                    <li>{uploadState.result.extractedElements.textBlocks} blocos de texto</li>
                    <li>{uploadState.result.extractedElements.images} imagens</li>
                    <li>{uploadState.result.extractedElements.tables} tabelas</li>
                    <li>{uploadState.result.extractedElements.charts} gráficos</li>
                  </ul>
                  <p className="mt-2">
                    Tempo de processamento: {(uploadState.result.processingTime / 1000).toFixed(1)}s
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">Erro na conversão</span>
                </div>
                <p className="text-sm text-red-600">{uploadState.result.error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button
          onClick={handleUpload}
          disabled={!canUpload}
          className="flex-1"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              {uploadState.status === 'uploading' ? 'Enviando...' : 'Convertendo...'}
            </>
          ) : (
            <>
              <Upload className="h-4 w-4 mr-2" />
              Converter Template
            </>
          )}
        </Button>
        
        {(uploadState.selectedFile || uploadState.result) && (
          <Button
            variant="outline"
            onClick={handleReset}
            disabled={isUploading}
          >
            Novo Upload
          </Button>
        )}
      </div>
    </div>
  );
};

export default TemplateUploader;