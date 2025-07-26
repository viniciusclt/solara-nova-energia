import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FileText,
  CheckCircle,
  AlertTriangle,
  Eye,
  Edit3,
  Save,
  Download,
  Upload,
  Zap,
  Battery,
  Sun,
  TrendingUp,
  Award,
  Shield,
  Ruler,
  Weight
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import PDFUploaderAdvanced, { ProcessedFile } from './PDFUploader/PDFUploaderAdvanced';

interface ExtractedProduct {
  id: string;
  sourceFile: string;
  equipmentType: 'module' | 'inverter' | 'battery';
  confidence: number;
  data: {
    // Dados básicos
    nome?: string;
    fabricante?: string;
    modelo?: string;
    
    // Especificações elétricas
    potencia?: string;
    tensaoVoc?: string;
    tensaoVmp?: string;
    correnteIsc?: string;
    correnteImp?: string;
    eficiencia?: string;
    
    // Especificações específicas do inversor
    potenciaDC?: string;
    potenciaAC?: string;
    tensaoDC?: string;
    tensaoAC?: string;
    frequencia?: string;
    fases?: string;
    
    // Especificações específicas da bateria
    capacidade?: string;
    tensaoNominal?: string;
    ciclosVida?: string;
    profundidadeDescarga?: string;
    
    // Especificações físicas
    peso?: string;
    dimensoes?: {
      comprimento?: string;
      largura?: string;
      espessura?: string;
    };
    
    // Garantias e certificações
    garantiasProduto?: string;
    garantiasPerformance?: string;
    certificacoes?: string[];
    tecnologia?: string;
    
    // Metadados
    rawText?: string;
    extractedFields?: Record<string, unknown>[];
  };
  editedData?: Partial<typeof data>;
  isEditing: boolean;
  validationStatus: 'pending' | 'valid' | 'invalid';
  validationErrors: string[];
}

interface DatasheetAnalyzerProps {
  onProductsExtracted?: (products: ExtractedProduct[]) => void;
  showUploader?: boolean;
  maxFiles?: number;
}

const DatasheetAnalyzer: React.FC<DatasheetAnalyzerProps> = ({
  onProductsExtracted,
  showUploader = true,
  maxFiles = 10
}) => {
  const { toast } = useToast();
  const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
  const [extractedProducts, setExtractedProducts] = useState<ExtractedProduct[]>([]);
  const [activeTab, setActiveTab] = useState('upload');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<string | null>(null);

  const handleFilesProcessed = useCallback((files: ProcessedFile[]) => {
    setProcessedFiles(files);
    
    // Converter arquivos processados em produtos extraídos
    const products: ExtractedProduct[] = files
      .filter(file => file.status === 'completed' && file.ocrResult)
      .map(file => ({
        id: file.id,
        sourceFile: file.file.name,
        equipmentType: file.equipmentType,
        confidence: file.ocrResult!.confidence,
        data: file.ocrResult!.extractedData,
        isEditing: false,
        validationStatus: validateProduct(file.ocrResult!.extractedData, file.equipmentType).isValid ? 'valid' : 'invalid',
        validationErrors: validateProduct(file.ocrResult!.extractedData, file.equipmentType).errors
      }));
    
    setExtractedProducts(products);
    
    if (products.length > 0) {
      setActiveTab('analysis');
    }
    
    onProductsExtracted?.(products);
  }, [onProductsExtracted]);

  const validateProduct = (data: Record<string, unknown>, type: string) => {
    const errors: string[] = [];
    
    // Validações básicas
    if (!data.nome && !data.modelo) {
      errors.push('Nome ou modelo é obrigatório');
    }
    if (!data.fabricante) {
      errors.push('Fabricante é obrigatório');
    }
    if (!data.potencia) {
      errors.push('Potência é obrigatória');
    }
    
    // Validações específicas por tipo
    if (type === 'module') {
      if (!data.tensaoVoc) errors.push('Tensão Voc é obrigatória para módulos');
      if (!data.correnteIsc) errors.push('Corrente Isc é obrigatória para módulos');
    } else if (type === 'inverter') {
      if (!data.tensaoAC && !data.tensaoDC) errors.push('Tensão AC ou DC é obrigatória para inversores');
      if (!data.fases) errors.push('Número de fases é obrigatório para inversores');
    } else if (type === 'battery') {
      if (!data.capacidade) errors.push('Capacidade é obrigatória para baterias');
      if (!data.tensaoNominal) errors.push('Tensão nominal é obrigatória para baterias');
    }
    
    return {
      isValid: errors.length === 0,
      errors
    };
  };

  const startEditing = (productId: string) => {
    setExtractedProducts(prev => prev.map(product => 
      product.id === productId 
        ? { ...product, isEditing: true, editedData: { ...product.data } }
        : product
    ));
    setSelectedProduct(productId);
  };

  const cancelEditing = (productId: string) => {
    setExtractedProducts(prev => prev.map(product => 
      product.id === productId 
        ? { ...product, isEditing: false, editedData: undefined }
        : product
    ));
    setSelectedProduct(null);
  };

  const saveEditing = (productId: string) => {
    setExtractedProducts(prev => prev.map(product => {
      if (product.id === productId && product.editedData) {
        const newData = { ...product.data, ...product.editedData };
        const validation = validateProduct(newData, product.equipmentType);
        
        return {
          ...product,
          data: newData,
          isEditing: false,
          editedData: undefined,
          validationStatus: validation.isValid ? 'valid' : 'invalid',
          validationErrors: validation.errors
        };
      }
      return product;
    }));
    setSelectedProduct(null);
  };

  const updateEditedData = (productId: string, field: string, value: unknown) => {
    setExtractedProducts(prev => prev.map(product => 
      product.id === productId 
        ? { 
            ...product, 
            editedData: { 
              ...product.editedData, 
              [field]: value 
            } 
          }
        : product
    ));
  };

  const saveToDatabase = async () => {
    const validProducts = extractedProducts.filter(p => p.validationStatus === 'valid');
    
    if (validProducts.length === 0) {
      toast({
        title: "Nenhum produto válido",
        description: "Corrija os erros de validação antes de salvar",
        variant: "destructive"
      });
      return;
    }

    setIsSaving(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Preparar dados para inserção
      const productsToInsert = validProducts.map(product => {
        const baseData = {
          empresa_id: user.id,
          nome: product.data.nome || product.data.modelo || 'Produto sem nome',
          fabricante: product.data.fabricante || 'Fabricante não informado',
          tipo: product.equipmentType,
          especificacoes: product.data,
          fonte_dados: 'ocr_datasheet',
          arquivo_origem: product.sourceFile,
          confianca_ocr: product.confidence,
          created_at: new Date().toISOString()
        };

        // Adicionar campos específicos baseados no tipo
        if (product.equipmentType === 'module') {
          return {
            ...baseData,
            potencia: parseFloat(product.data.potencia?.replace(/[^0-9.]/g, '') || '0'),
            tensao_voc: parseFloat(product.data.tensaoVoc?.replace(/[^0-9.]/g, '') || '0'),
            corrente_isc: parseFloat(product.data.correnteIsc?.replace(/[^0-9.]/g, '') || '0'),
            eficiencia: parseFloat(product.data.eficiencia?.replace(/[^0-9.]/g, '') || '0')
          };
        } else if (product.equipmentType === 'inverter') {
          return {
            ...baseData,
            potencia_ac: parseFloat(product.data.potenciaAC?.replace(/[^0-9.]/g, '') || '0'),
            potencia_dc: parseFloat(product.data.potenciaDC?.replace(/[^0-9.]/g, '') || '0'),
            tensao_ac: parseFloat(product.data.tensaoAC?.replace(/[^0-9.]/g, '') || '0'),
            fases: parseInt(product.data.fases?.replace(/[^0-9]/g, '') || '1')
          };
        } else {
          return {
            ...baseData,
            capacidade: parseFloat(product.data.capacidade?.replace(/[^0-9.]/g, '') || '0'),
            tensao_nominal: parseFloat(product.data.tensaoNominal?.replace(/[^0-9.]/g, '') || '0'),
            ciclos_vida: parseInt(product.data.ciclosVida?.replace(/[^0-9]/g, '') || '0')
          };
        }
      });

      // Determinar tabela baseada no tipo
      const moduleProducts = productsToInsert.filter(p => p.tipo === 'module');
      const inverterProducts = productsToInsert.filter(p => p.tipo === 'inverter');
      const batteryProducts = productsToInsert.filter(p => p.tipo === 'battery');

      // Inserir em tabelas específicas
      const promises = [];
      
      if (moduleProducts.length > 0) {
        promises.push(
          supabase.from('modulos_solares').insert(moduleProducts)
        );
      }
      
      if (inverterProducts.length > 0) {
        promises.push(
          supabase.from('inversores').insert(inverterProducts)
        );
      }
      
      if (batteryProducts.length > 0) {
        promises.push(
          supabase.from('baterias').insert(batteryProducts)
        );
      }

      await Promise.all(promises);

      toast({
        title: "Produtos salvos",
        description: `${validProducts.length} produtos foram salvos no banco de dados`
      });

      // Limpar dados após salvar
      setExtractedProducts([]);
      setProcessedFiles([]);
      setActiveTab('upload');

    } catch (error: unknown) {
      console.error('Erro ao salvar produtos:', error);
      toast({
        title: "Erro ao salvar",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };

  const exportData = () => {
    const dataToExport = extractedProducts.map(product => ({
      arquivo: product.sourceFile,
      tipo: product.equipmentType,
      confianca: product.confidence,
      status: product.validationStatus,
      erros: product.validationErrors,
      dados: product.data
    }));

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `datasheet-analysis-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getEquipmentIcon = (type: string) => {
    switch (type) {
      case 'inverter': return <Zap className="h-4 w-4" />;
      case 'battery': return <Battery className="h-4 w-4" />;
      default: return <Sun className="h-4 w-4" />;
    }
  };

  const getValidationBadge = (status: string) => {
    switch (status) {
      case 'valid':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="h-3 w-3 mr-1" />Válido</Badge>;
      case 'invalid':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />Inválido</Badge>;
      default:
        return <Badge variant="outline">Pendente</Badge>;
    }
  };

  const renderFieldEditor = (product: ExtractedProduct, field: string, label: string, type: 'text' | 'number' | 'textarea' = 'text') => {
    const currentValue = product.editedData?.[field] ?? product.data[field] ?? '';
    
    if (type === 'textarea') {
      return (
        <div>
          <Label>{label}</Label>
          <Textarea
            value={currentValue}
            onChange={(e) => updateEditedData(product.id, field, e.target.value)}
            className="mt-1"
          />
        </div>
      );
    }
    
    return (
      <div>
        <Label>{label}</Label>
        <Input
          type={type}
          value={currentValue}
          onChange={(e) => updateEditedData(product.id, field, e.target.value)}
          className="mt-1"
        />
      </div>
    );
  };

  const validProducts = extractedProducts.filter(p => p.validationStatus === 'valid');
  const invalidProducts = extractedProducts.filter(p => p.validationStatus === 'invalid');

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload & Processamento</TabsTrigger>
          <TabsTrigger value="analysis">Análise & Edição</TabsTrigger>
          <TabsTrigger value="validation">Validação & Salvamento</TabsTrigger>
        </TabsList>

        <TabsContent value="upload">
          {showUploader && (
            <PDFUploaderAdvanced
              onFilesProcessed={handleFilesProcessed}
              maxFiles={maxFiles}
              autoProcess={true}
              showPreview={true}
            />
          )}
        </TabsContent>

        <TabsContent value="analysis" className="space-y-4">
          {extractedProducts.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-lg font-medium text-gray-900 mb-2">
                  Nenhum produto extraído
                </p>
                <p className="text-gray-500">
                  Faça upload de datasheets para começar a análise
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {/* Estatísticas */}
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold">{extractedProducts.length}</div>
                    <p className="text-xs text-gray-500">Produtos extraídos</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-green-600">{validProducts.length}</div>
                    <p className="text-xs text-gray-500">Válidos</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="text-2xl font-bold text-red-600">{invalidProducts.length}</div>
                    <p className="text-xs text-gray-500">Com erros</p>
                  </CardContent>
                </Card>
              </div>

              {/* Lista de produtos */}
              <div className="space-y-4">
                {extractedProducts.map((product) => (
                  <Card key={product.id}>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div className="flex items-center gap-3">
                        {getEquipmentIcon(product.equipmentType)}
                        <div>
                          <CardTitle className="text-lg">
                            {product.data.nome || product.data.modelo || 'Produto sem nome'}
                          </CardTitle>
                          <p className="text-sm text-gray-500">
                            {product.sourceFile} • Confiança: {product.confidence.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getValidationBadge(product.validationStatus)}
                        {!product.isEditing ? (
                          <Button
                            onClick={() => startEditing(product.id)}
                            size="sm"
                            variant="outline"
                          >
                            <Edit3 className="h-4 w-4 mr-2" />
                            Editar
                          </Button>
                        ) : (
                          <div className="flex gap-2">
                            <Button
                              onClick={() => saveEditing(product.id)}
                              size="sm"
                            >
                              <Save className="h-4 w-4 mr-2" />
                              Salvar
                            </Button>
                            <Button
                              onClick={() => cancelEditing(product.id)}
                              size="sm"
                              variant="outline"
                            >
                              Cancelar
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardHeader>
                    
                    <CardContent>
                      {product.validationErrors.length > 0 && (
                        <Alert className="mb-4">
                          <AlertTriangle className="h-4 w-4" />
                          <AlertDescription>
                            <strong>Erros de validação:</strong>
                            <ul className="list-disc list-inside mt-1">
                              {product.validationErrors.map((error, index) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </AlertDescription>
                        </Alert>
                      )}
                      
                      {product.isEditing ? (
                        <div className="grid gap-4 md:grid-cols-2">
                          {/* Campos básicos */}
                          {renderFieldEditor(product, 'nome', 'Nome/Modelo')}
                          {renderFieldEditor(product, 'fabricante', 'Fabricante')}
                          {renderFieldEditor(product, 'potencia', 'Potência')}
                          {renderFieldEditor(product, 'eficiencia', 'Eficiência (%)')}
                          
                          {/* Campos específicos por tipo */}
                          {product.equipmentType === 'module' && (
                            <>
                              {renderFieldEditor(product, 'tensaoVoc', 'Tensão Voc (V)')}
                              {renderFieldEditor(product, 'tensaoVmp', 'Tensão Vmp (V)')}
                              {renderFieldEditor(product, 'correnteIsc', 'Corrente Isc (A)')}
                              {renderFieldEditor(product, 'correnteImp', 'Corrente Imp (A)')}
                              {renderFieldEditor(product, 'tecnologia', 'Tecnologia')}
                            </>
                          )}
                          
                          {product.equipmentType === 'inverter' && (
                            <>
                              {renderFieldEditor(product, 'potenciaAC', 'Potência AC (W)')}
                              {renderFieldEditor(product, 'potenciaDC', 'Potência DC (W)')}
                              {renderFieldEditor(product, 'tensaoAC', 'Tensão AC (V)')}
                              {renderFieldEditor(product, 'tensaoDC', 'Tensão DC (V)')}
                              {renderFieldEditor(product, 'fases', 'Fases')}
                              {renderFieldEditor(product, 'frequencia', 'Frequência (Hz)')}
                            </>
                          )}
                          
                          {product.equipmentType === 'battery' && (
                            <>
                              {renderFieldEditor(product, 'capacidade', 'Capacidade (Ah/kWh)')}
                              {renderFieldEditor(product, 'tensaoNominal', 'Tensão Nominal (V)')}
                              {renderFieldEditor(product, 'ciclosVida', 'Ciclos de Vida')}
                              {renderFieldEditor(product, 'profundidadeDescarga', 'Profundidade de Descarga (%)')}
                            </>
                          )}
                          
                          {/* Campos físicos */}
                          {renderFieldEditor(product, 'peso', 'Peso (kg)')}
                          {renderFieldEditor(product, 'garantiasProduto', 'Garantia do Produto')}
                          {renderFieldEditor(product, 'garantiasPerformance', 'Garantia de Performance')}
                        </div>
                      ) : (
                        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                          {Object.entries(product.data)
                            .filter(([key]) => !['rawText', 'extractedFields', 'confidence', 'processedAt'].includes(key))
                            .map(([key, value]) => (
                              <div key={key} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <span className="text-sm font-medium text-gray-600 capitalize">
                                  {key.replace(/([A-Z])/g, ' $1')}
                                </span>
                                <span className="text-sm text-gray-900">
                                  {typeof value === 'object' 
                                    ? JSON.stringify(value) 
                                    : value || 'N/A'
                                  }
                                </span>
                              </div>
                            ))
                          }
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="validation" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Validação e Salvamento</CardTitle>
              <div className="flex gap-2">
                <Button
                  onClick={exportData}
                  variant="outline"
                  disabled={extractedProducts.length === 0}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
                <Button
                  onClick={saveToDatabase}
                  disabled={validProducts.length === 0 || isSaving}
                >
                  {isSaving ? (
                    <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Salvar no Banco
                </Button>
              </div>
            </CardHeader>
            
            <CardContent>
              {extractedProducts.length === 0 ? (
                <div className="text-center py-8">
                  <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                  <p className="text-gray-500">Nenhum produto para validar</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Resumo de validação */}
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="p-4 bg-green-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <span className="font-medium text-green-800">Produtos Válidos</span>
                      </div>
                      <div className="text-2xl font-bold text-green-600">{validProducts.length}</div>
                      <p className="text-sm text-green-600">Prontos para salvar</p>
                    </div>
                    
                    <div className="p-4 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                        <span className="font-medium text-red-800">Produtos com Erros</span>
                      </div>
                      <div className="text-2xl font-bold text-red-600">{invalidProducts.length}</div>
                      <p className="text-sm text-red-600">Necessitam correção</p>
                    </div>
                  </div>
                  
                  {/* Lista de produtos com erros */}
                  {invalidProducts.length > 0 && (
                    <div>
                      <h3 className="font-medium mb-3">Produtos que necessitam correção:</h3>
                      <div className="space-y-2">
                        {invalidProducts.map((product) => (
                          <div key={product.id} className="p-3 border border-red-200 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium">
                                {product.data.nome || product.data.modelo || 'Produto sem nome'}
                              </span>
                              <Button
                                onClick={() => {
                                  setActiveTab('analysis');
                                  startEditing(product.id);
                                }}
                                size="sm"
                                variant="outline"
                              >
                                Corrigir
                              </Button>
                            </div>
                            <ul className="text-sm text-red-600 list-disc list-inside">
                              {product.validationErrors.map((error, index) => (
                                <li key={index}>{error}</li>
                              ))}
                            </ul>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DatasheetAnalyzer;