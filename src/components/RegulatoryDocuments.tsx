import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  FileText,
  Download,
  Eye,
  Copy,
  Trash2,
  CheckCircle,
  AlertTriangle,
  XCircle,
  FileCheck,
  Settings,
  Zap,
  Calendar,
  User,
  Building,
  MapPin
} from 'lucide-react';
import {
  useRegulatoryTemplates,
  type TemplateGenerationOptions,
  type DocumentExportOptions
} from '@/hooks/useRegulatoryTemplates';
import {
  type DocumentTemplate,
  type DadosProjeto,
  type CalculosEnergeticos
} from '@/services/RegulatoryTemplateService';

// ===== INTERFACES =====

interface RegulatoryDocumentsProps {
  projectData?: DadosProjeto;
  calculosEnergeticos?: CalculosEnergeticos;
  onDocumentGenerated?: (documentId: string) => void;
  className?: string;
}

interface DocumentPreviewProps {
  content: string;
  onClose: () => void;
}

interface ValidationDisplayProps {
  validation: {
    isValid: boolean;
    missingFields: string[];
    warnings: string[];
    score: number;
  };
}

// ===== COMPONENTES AUXILIARES =====

const DocumentPreview: React.FC<DocumentPreviewProps> = ({ content, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold">Pré-visualização do Documento</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            ×
          </Button>
        </div>
        <div className="p-6 overflow-auto max-h-[70vh]">
          <div 
            className="prose max-w-none"
            dangerouslySetInnerHTML={{ __html: content.replace(/\n/g, '<br>') }}
          />
        </div>
        <div className="flex justify-end gap-2 p-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </div>
    </div>
  );
};

const ValidationDisplay: React.FC<ValidationDisplayProps> = ({ validation }) => {
  const getValidationIcon = () => {
    if (validation.score >= 90) return <CheckCircle className="h-5 w-5 text-green-500" />;
    if (validation.score >= 70) return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
    return <XCircle className="h-5 w-5 text-red-500" />;
  };

  const getValidationColor = () => {
    if (validation.score >= 90) return 'text-green-700 bg-green-50 border-green-200';
    if (validation.score >= 70) return 'text-yellow-700 bg-yellow-50 border-yellow-200';
    return 'text-red-700 bg-red-50 border-red-200';
  };

  return (
    <Alert className={getValidationColor()}>
      <div className="flex items-center gap-2">
        {getValidationIcon()}
        <AlertTitle>Validação do Projeto</AlertTitle>
      </div>
      <AlertDescription className="mt-2">
        <div className="flex items-center gap-2 mb-2">
          <span>Score de Conformidade:</span>
          <Badge variant={validation.score >= 90 ? 'default' : validation.score >= 70 ? 'secondary' : 'destructive'}>
            {validation.score}%
          </Badge>
        </div>
        
        {validation.missingFields.length > 0 && (
          <div className="mb-2">
            <p className="font-medium text-sm mb-1">Campos obrigatórios ausentes:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              {validation.missingFields.map((field, index) => (
                <li key={index}>{field}</li>
              ))}
            </ul>
          </div>
        )}
        
        {validation.warnings.length > 0 && (
          <div>
            <p className="font-medium text-sm mb-1">Avisos:</p>
            <ul className="list-disc list-inside text-sm space-y-1">
              {validation.warnings.map((warning, index) => (
                <li key={index}>{warning}</li>
              ))}
            </ul>
          </div>
        )}
      </AlertDescription>
    </Alert>
  );
};

// ===== COMPONENTE PRINCIPAL =====

export const RegulatoryDocuments: React.FC<RegulatoryDocumentsProps> = ({
  projectData,
  calculosEnergeticos,
  onDocumentGenerated,
  className = ''
}) => {
  // ===== HOOKS =====
  
  const {
    templates,
    selectedTemplate,
    generatedDocuments,
    currentDocument,
    isLoading,
    isGenerating,
    isExporting,
    validationResult,
    error,
    stats,
    selectTemplate,
    getTemplatesByType,
    generateDocument,
    validateProjectData,
    previewDocument,
    exportDocument,
    deleteDocument,
    clearDocuments,
    downloadDocument,
    copyDocumentToClipboard,
    clearError
  } = useRegulatoryTemplates();

  // ===== ESTADO LOCAL =====
  
  const [activeTab, setActiveTab] = useState('generate');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [previewContent, setPreviewContent] = useState<string | null>(null);
  const [exportFormat, setExportFormat] = useState<'html' | 'pdf' | 'docx'>('html');
  const [sampleProjectData, setSampleProjectData] = useState<Partial<DadosProjeto>>({
    numero_projeto: 'PROJ-2024-001',
    data_elaboracao: new Date(),
    versao: '1.0',
    cliente: {
      nome: 'João Silva',
      cpf_cnpj: '123.456.789-00',
      endereco: {
        logradouro: 'Rua das Flores',
        numero: '123',
        bairro: 'Centro',
        cidade: 'Rio de Janeiro',
        uf: 'RJ',
        cep: '20000-000'
      },
      telefone: '(21) 99999-9999',
      email: 'joao@email.com',
      tipo_pessoa: 'fisica'
    },
    sistema_fv: {
      tipo: 'microgeracao',
      potencia_modulos_wp: 5000,
      potencia_inversores_w: 5000,
      quantidade_modulos: 12,
      quantidade_inversores: 1,
      area_ocupada_m2: 30,
      orientacao_azimute: 180,
      inclinacao_graus: 23,
      fator_sombreamento: 0.05,
      modulos: [{
        fabricante: 'Canadian Solar',
        modelo: 'CS3W-420P',
        potencia_wp: 420,
        quantidade: 12,
        certificacao: 'INMETRO'
      }],
      inversores: [{
        fabricante: 'Fronius',
        modelo: 'Primo 5.0-1',
        potencia_w: 5000,
        quantidade: 1,
        certificacao: 'INMETRO'
      }],
      outros_equipamentos: []
    },
    responsavel_tecnico: {
      nome: 'Eng. Maria Santos',
      registro_profissional: '12345',
      conselho: 'CREA',
      uf_registro: 'RJ',
      telefone: '(21) 88888-8888',
      email: 'maria@engenharia.com'
    }
  });

  // ===== EFEITOS =====
  
  useEffect(() => {
    if (projectData) {
      setSampleProjectData(projectData);
    }
  }, [projectData]);

  useEffect(() => {
    if (selectedTemplateId && sampleProjectData) {
      validateProjectData(selectedTemplateId, sampleProjectData as DadosProjeto);
    }
  }, [selectedTemplateId, sampleProjectData, validateProjectData]);

  // ===== HANDLERS =====
  
  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplateId(templateId);
    selectTemplate(templateId);
  };

  const handleGenerateDocument = async () => {
    if (!selectedTemplateId || !sampleProjectData) return;

    const options: TemplateGenerationOptions = {
      templateId: selectedTemplateId,
      projectData: sampleProjectData as DadosProjeto,
      calculosEnergeticos,
      autoDownload: false
    };

    const document = await generateDocument(options);
    
    if (document && onDocumentGenerated) {
      onDocumentGenerated(document.id);
    }
  };

  const handlePreviewDocument = async () => {
    if (!selectedTemplateId || !sampleProjectData) return;

    const options: TemplateGenerationOptions = {
      templateId: selectedTemplateId,
      projectData: sampleProjectData as DadosProjeto,
      calculosEnergeticos
    };

    const content = await previewDocument(options);
    if (content) {
      setPreviewContent(content);
    }
  };

  const handleExportDocument = async (documentId: string) => {
    const options: DocumentExportOptions = {
      format: exportFormat,
      includeMetadata: true
    };

    await exportDocument(documentId, options);
  };

  const handleCopyDocument = async (documentId: string) => {
    const success = await copyDocumentToClipboard(documentId);
    if (success) {
      // Mostrar notificação de sucesso
    }
  };

  // ===== RENDER =====
  
  if (isLoading) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Documentos Regulamentares</h2>
          <p className="text-gray-600 mt-1">
            Gere documentos em conformidade com a Lei 14.300/2022 e REN ANEEL 1000/2021
          </p>
        </div>
        
        {stats.totalGenerated > 0 && (
          <div className="text-right">
            <div className="text-sm text-gray-600">
              {stats.totalGenerated} documentos gerados
            </div>
            <div className="text-sm text-gray-600">
              Score médio: {stats.averageComplianceScore}%
            </div>
          </div>
        )}
      </div>

      {/* Error Alert */}
      {error && (
        <Alert className="border-red-200 bg-red-50">
          <XCircle className="h-4 w-4 text-red-500" />
          <AlertTitle className="text-red-700">Erro</AlertTitle>
          <AlertDescription className="text-red-600">
            {error}
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearError}
              className="ml-2 text-red-600 hover:text-red-700"
            >
              Dispensar
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Gerar Documentos
          </TabsTrigger>
          <TabsTrigger value="documents" className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Documentos Gerados
            {generatedDocuments.length > 0 && (
              <Badge variant="secondary" className="ml-1">
                {generatedDocuments.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Templates
          </TabsTrigger>
        </TabsList>

        {/* Tab: Gerar Documentos */}
        <TabsContent value="generate" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Seleção de Template */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Selecionar Template
                </CardTitle>
                <CardDescription>
                  Escolha o tipo de documento que deseja gerar
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="template-select">Template</Label>
                  <Select value={selectedTemplateId} onValueChange={handleTemplateSelect}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center gap-2">
                            <FileText className="h-4 w-4" />
                            <div>
                              <div className="font-medium">{template.name}</div>
                              <div className="text-sm text-gray-500">{template.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedTemplate && (
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Base Regulamentar:</h4>
                      <div className="flex flex-wrap gap-1">
                        {selectedTemplate.regulatory_basis.map((basis, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {basis}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button 
                        onClick={handlePreviewDocument}
                        variant="outline"
                        size="sm"
                        disabled={!sampleProjectData}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        Pré-visualizar
                      </Button>
                      
                      <Button 
                        onClick={handleGenerateDocument}
                        disabled={!sampleProjectData || isGenerating}
                        size="sm"
                        className="flex items-center gap-2"
                      >
                        {isGenerating ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        ) : (
                          <Zap className="h-4 w-4" />
                        )}
                        Gerar Documento
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Validação */}
            {validationResult && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    Validação
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ValidationDisplay validation={validationResult} />
                </CardContent>
              </Card>
            )}
          </div>

          {/* Dados do Projeto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building className="h-5 w-5" />
                Dados do Projeto
              </CardTitle>
              <CardDescription>
                Informações utilizadas para gerar os documentos
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="projeto-numero">Número do Projeto</Label>
                  <Input
                    id="projeto-numero"
                    value={sampleProjectData.numero_projeto || ''}
                    onChange={(e) => setSampleProjectData(prev => ({
                      ...prev,
                      numero_projeto: e.target.value
                    }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="cliente-nome">Nome do Cliente</Label>
                  <Input
                    id="cliente-nome"
                    value={sampleProjectData.cliente?.nome || ''}
                    onChange={(e) => setSampleProjectData(prev => ({
                      ...prev,
                      cliente: {
                        ...prev.cliente!,
                        nome: e.target.value
                      }
                    }))}
                  />
                </div>
                
                <div>
                  <Label htmlFor="sistema-potencia">Potência do Sistema (Wp)</Label>
                  <Input
                    id="sistema-potencia"
                    type="number"
                    value={sampleProjectData.sistema_fv?.potencia_modulos_wp || ''}
                    onChange={(e) => setSampleProjectData(prev => ({
                      ...prev,
                      sistema_fv: {
                        ...prev.sistema_fv!,
                        potencia_modulos_wp: Number(e.target.value)
                      }
                    }))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab: Documentos Gerados */}
        <TabsContent value="documents" className="space-y-6">
          {generatedDocuments.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <FileText className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum documento gerado</h3>
                <p className="text-gray-600 text-center mb-4">
                  Gere seu primeiro documento na aba "Gerar Documentos"
                </p>
                <Button onClick={() => setActiveTab('generate')}>
                  Gerar Documento
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">Documentos Gerados ({generatedDocuments.length})</h3>
                <div className="flex items-center gap-2">
                  <Select value={exportFormat} onValueChange={(value: any) => setExportFormat(value)}>
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="html">HTML</SelectItem>
                      <SelectItem value="pdf">PDF</SelectItem>
                      <SelectItem value="docx">DOCX</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearDocuments}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Limpar Todos
                  </Button>
                </div>
              </div>
              
              <div className="grid gap-4">
                {generatedDocuments.map((document) => {
                  const template = templates.find(t => t.id === document.template_id);
                  
                  return (
                    <Card key={document.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FileText className="h-8 w-8 text-blue-600" />
                            <div>
                              <h4 className="font-medium">{template?.name || 'Documento'}</h4>
                              <p className="text-sm text-gray-600">
                                Projeto: {document.project_id} • 
                                Gerado em {document.metadata.generated_at.toLocaleDateString('pt-BR')}
                              </p>
                              <div className="flex items-center gap-2 mt-1">
                                <Badge 
                                  variant={document.validation.compliance_score >= 90 ? 'default' : 
                                          document.validation.compliance_score >= 70 ? 'secondary' : 'destructive'}
                                >
                                  {document.validation.compliance_score}% conformidade
                                </Badge>
                                {document.validation.issues.length > 0 && (
                                  <Badge variant="outline">
                                    {document.validation.issues.length} {document.validation.issues.length === 1 ? 'issue' : 'issues'}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setPreviewContent(document.content)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyDocument(document.id)}
                            >
                              <Copy className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => downloadDocument(document)}
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                            
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => deleteDocument(document.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          )}
        </TabsContent>

        {/* Tab: Templates */}
        <TabsContent value="templates" className="space-y-6">
          <div className="grid gap-4">
            {templates.map((template) => (
              <Card key={template.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        {template.name}
                      </CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </div>
                    <Badge variant="outline">{template.type}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-sm mb-2">Base Regulamentar:</h4>
                      <div className="flex flex-wrap gap-1">
                        {template.regulatory_basis.map((basis, index) => (
                          <Badge key={index} variant="secondary" className="text-xs">
                            {basis}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm mb-2">Dados Necessários:</h4>
                      <div className="flex flex-wrap gap-1">
                        {template.required_data.map((data, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {data}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium text-sm mb-2">Variáveis ({Object.keys(template.variables).length}):</h4>
                      <div className="text-sm text-gray-600">
                        {Object.entries(template.variables).slice(0, 3).map(([key, config]) => (
                          <div key={key} className="flex items-center gap-2">
                            <span className="font-mono text-xs bg-gray-100 px-1 rounded">{key}</span>
                            <span>{config.description}</span>
                            {config.required && <Badge variant="destructive" className="text-xs">obrigatório</Badge>}
                          </div>
                        ))}
                        {Object.keys(template.variables).length > 3 && (
                          <div className="text-xs text-gray-500 mt-1">
                            +{Object.keys(template.variables).length - 3} mais variáveis
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Preview Modal */}
      {previewContent && (
        <DocumentPreview 
          content={previewContent} 
          onClose={() => setPreviewContent(null)} 
        />
      )}
    </div>
  );
};

export default RegulatoryDocuments;