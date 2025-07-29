import React, { useState, useCallback, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FileText,
  Upload,
  Download,
  Eye,
  Edit,
  Copy,
  Trash2,
  Plus,
  RotateCcw,
  RotateCw,
  Save,
  FileImage,
  BarChart3,
  Table,
  Type,
  Image,
  Calculator,
  TrendingUp,
  Calendar,
  Shield,
  Monitor,
  Printer,
  Settings,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Lead } from '@/types/database';

interface ProposalWorkspaceProps {
  currentLead: Lead | null;
}

interface ProposalSection {
  id: string;
  type: 'header' | 'text' | 'table' | 'chart' | 'image' | 'financial' | 'technical' | 'sustainability' | 'guarantees' | 'timeline' | 'variables';
  title: string;
  content: any;
  position: { x: number; y: number };
  size: { width: number; height: number };
  style?: {
    backgroundColor?: string;
    textColor?: string;
    fontSize?: number;
    fontWeight?: string;
    borderColor?: string;
    borderWidth?: number;
  };
}

interface ProposalTemplate {
  id: string;
  name: string;
  description: string;
  sections: ProposalSection[];
  layout: 'free' | 'grid' | 'vertical';
  pageSize: 'A4' | 'Letter' | '16:9';
  orientation: 'portrait' | 'landscape';
  category: string;
  isCustom?: boolean;
}

const predefinedTemplates: ProposalTemplate[] = [
  {
    id: 'standard',
    name: 'Padrão',
    description: 'Template padrão com todas as seções essenciais',
    layout: 'vertical',
    pageSize: 'A4',
    orientation: 'portrait',
    category: 'standard',
    sections: [
      {
        id: 'header',
        type: 'header',
        title: 'Cabeçalho',
        content: { title: 'Proposta Comercial - Energia Solar', subtitle: 'Sistema Fotovoltaico Residencial' },
        position: { x: 0, y: 0 },
        size: { width: 100, height: 15 }
      },
      {
        id: 'technical',
        type: 'technical',
        title: 'Dados Técnicos',
        content: { modules: 0, inverters: 0, power: 0 },
        position: { x: 0, y: 20 },
        size: { width: 100, height: 25 }
      },
      {
        id: 'financial',
        type: 'financial',
        title: 'Análise Financeira',
        content: { investment: 0, payback: 0, savings: 0 },
        position: { x: 0, y: 50 },
        size: { width: 100, height: 30 }
      }
    ]
  },
  {
    id: 'presentation',
    name: 'Apresentação 16:9',
    description: 'Template otimizado para apresentações em formato widescreen',
    layout: 'free',
    pageSize: '16:9',
    orientation: 'landscape',
    category: 'presentation',
    sections: [
      {
        id: 'title-slide',
        type: 'header',
        title: 'Slide Título',
        content: { title: 'Energia Solar', subtitle: 'Sua solução sustentável' },
        position: { x: 10, y: 30 },
        size: { width: 80, height: 40 }
      }
    ]
  }
];

const sectionTypes = [
  { type: 'header', label: 'Cabeçalho', icon: Type },
  { type: 'text', label: 'Texto', icon: FileText },
  { type: 'table', label: 'Tabela', icon: Table },
  { type: 'chart', label: 'Gráfico', icon: BarChart3 },
  { type: 'image', label: 'Imagem', icon: Image },
  { type: 'financial', label: 'Financeiro', icon: Calculator },
  { type: 'technical', label: 'Técnico', icon: Zap },
  { type: 'variables', label: 'Variáveis', icon: Settings },
  { type: 'timeline', label: 'Cronograma', icon: Calendar },
  { type: 'guarantees', label: 'Garantias', icon: Shield }
];

const availableVariables = [
  { key: 'modules_count', label: 'Quantidade de Módulos', type: 'number' },
  { key: 'inverters_count', label: 'Quantidade de Inversores', type: 'number' },
  { key: 'module_power', label: 'Potência do Módulo (W)', type: 'number' },
  { key: 'total_power', label: 'Potência Total (kWp)', type: 'number' },
  { key: 'payback_time', label: 'Tempo de Payback (anos)', type: 'number' },
  { key: 'monthly_generation', label: 'Geração Mensal (kWh)', type: 'number' },
  { key: 'annual_savings', label: 'Economia Anual (R$)', type: 'currency' },
  { key: 'investment_value', label: 'Valor do Investimento (R$)', type: 'currency' }
];

export function ProposalWorkspace({ currentLead }: ProposalWorkspaceProps) {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [activeTemplate, setActiveTemplate] = useState<ProposalTemplate>(predefinedTemplates[0]);
  const [selectedSection, setSelectedSection] = useState<string | null>(null);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showVariablesDialog, setShowVariablesDialog] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [importType, setImportType] = useState<'pdf' | 'word'>('pdf');
  
  // Dados calculados do lead atual
  const leadData = currentLead ? {
    modules_count: 20,
    inverters_count: 1,
    module_power: 550,
    total_power: 11.0,
    payback_time: 4.2,
    monthly_generation: 1450,
    annual_savings: 8500,
    investment_value: 35000
  } : {};

  const handleTemplateSelect = useCallback((template: ProposalTemplate) => {
    setActiveTemplate(template);
    setShowTemplateDialog(false);
    toast({
      title: 'Template selecionado',
      description: `Template "${template.name}" aplicado com sucesso.`
    });
  }, [toast]);

  const handlePageSizeToggle = useCallback(() => {
    const newPageSize = activeTemplate.pageSize === 'A4' ? '16:9' : 'A4';
    const newOrientation = newPageSize === 'A4' ? 'portrait' : 'landscape';
    
    setActiveTemplate(prev => ({
      ...prev,
      pageSize: newPageSize,
      orientation: newOrientation
    }));
    
    toast({
      title: 'Formato alterado',
      description: `Documento convertido para ${newPageSize === 'A4' ? 'A4 (Retrato)' : '16:9 (Paisagem)'}.`
    });
  }, [activeTemplate.pageSize, toast]);

  const handleFileImport = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const fileType = file.type;
    const fileName = file.name;

    if (importType === 'pdf' && fileType === 'application/pdf') {
      // Simular importação de PDF com OCR
      toast({
        title: 'Importando PDF',
        description: 'Processando documento com OCR...',
      });
      
      setTimeout(() => {
        toast({
          title: 'PDF importado',
          description: 'Conteúdo extraído e adicionado ao documento.',
        });
      }, 2000);
    } else if (importType === 'word' && (fileType.includes('document') || fileName.endsWith('.doc') || fileName.endsWith('.docx'))) {
      // Simular importação de Word
      toast({
        title: 'Importando Word',
        description: 'Processando documento...',
      });
      
      setTimeout(() => {
        toast({
          title: 'Documento importado',
          description: 'Conteúdo do Word adicionado com sucesso.',
        });
      }, 1500);
    } else {
      toast({
        title: 'Formato inválido',
        description: `Selecione um arquivo ${importType === 'pdf' ? 'PDF' : 'Word (.doc/.docx)'}.`,
        variant: 'destructive'
      });
    }

    setShowImportDialog(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [importType, toast]);

  const addSection = useCallback((sectionType: ProposalSection['type']) => {
    const newSection: ProposalSection = {
      id: `section-${Date.now()}`,
      type: sectionType,
      title: `Nova Seção ${sectionType}`,
      content: {},
      position: { x: 0, y: activeTemplate.sections.length * 30 },
      size: { width: 100, height: 25 }
    };

    setActiveTemplate(prev => ({
      ...prev,
      sections: [...prev.sections, newSection]
    }));

    toast({
      title: 'Seção adicionada',
      description: `Seção "${sectionType}" adicionada ao documento.`
    });
  }, [activeTemplate.sections.length, toast]);

  const removeSection = useCallback((sectionId: string) => {
    setActiveTemplate(prev => ({
      ...prev,
      sections: prev.sections.filter(section => section.id !== sectionId)
    }));

    if (selectedSection === sectionId) {
      setSelectedSection(null);
    }

    toast({
      title: 'Seção removida',
      description: 'Seção removida do documento.'
    });
  }, [selectedSection, toast]);

  const insertVariable = useCallback((variableKey: string) => {
    if (!selectedSection) {
      toast({
        title: 'Selecione uma seção',
        description: 'Selecione uma seção para inserir a variável.',
        variant: 'destructive'
      });
      return;
    }

    const variable = availableVariables.find(v => v.key === variableKey);
    if (!variable) return;

    const value = leadData[variableKey as keyof typeof leadData] || 0;
    
    toast({
      title: 'Variável inserida',
      description: `${variable.label}: ${value}${variable.type === 'currency' ? ' R$' : ''}`
    });

    setShowVariablesDialog(false);
  }, [selectedSection, leadData, toast]);

  if (!currentLead) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum lead selecionado</h3>
          <p className="text-muted-foreground mb-4">
            Selecione um lead na aba "Dados do Lead" para criar propostas
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Barra de Ferramentas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-6 w-6" />
            Workspace de Propostas
          </CardTitle>
          <CardDescription>
            Crie, edite e gerencie propostas com templates personalizáveis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {/* Botão Importar */}
            <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Upload className="h-4 w-4" />
                  Importar
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Importar Documento</DialogTitle>
                  <DialogDescription>
                    Importe conteúdo de PDF (com OCR) ou documentos Word
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tipo de Arquivo</Label>
                    <Select value={importType} onValueChange={(value: 'pdf' | 'word') => setImportType(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF (com OCR)</SelectItem>
                        <SelectItem value="word">Word (.doc/.docx)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Arquivo</Label>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      accept={importType === 'pdf' ? '.pdf' : '.doc,.docx'}
                      onChange={handleFileImport}
                    />
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            {/* Botão Template */}
            <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <FileImage className="h-4 w-4" />
                  Template
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl">
                <DialogHeader>
                  <DialogTitle>Selecionar Template</DialogTitle>
                  <DialogDescription>
                    Escolha um template para sua proposta
                  </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {predefinedTemplates.map(template => (
                    <Card key={template.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => handleTemplateSelect(template)}>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          {template.pageSize === 'A4' ? <Printer className="h-4 w-4" /> : <Monitor className="h-4 w-4" />}
                          {template.name}
                        </CardTitle>
                        <CardDescription>{template.description}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2">
                          <Badge variant="secondary">{template.pageSize}</Badge>
                          <Badge variant="outline">{template.category}</Badge>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </DialogContent>
            </Dialog>

            {/* Conversão A4/16:9 */}
            <Button variant="outline" onClick={handlePageSizeToggle} className="flex items-center gap-2">
              {activeTemplate.pageSize === 'A4' ? <Monitor className="h-4 w-4" /> : <Printer className="h-4 w-4" />}
              Converter para {activeTemplate.pageSize === 'A4' ? '16:9' : 'A4'}
            </Button>

            {/* Botão Variáveis */}
            <Dialog open={showVariablesDialog} onOpenChange={setShowVariablesDialog}>
              <DialogTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Variáveis
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Inserir Variáveis</DialogTitle>
                  <DialogDescription>
                    Adicione variáveis dinâmicas baseadas nos dados do lead
                  </DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-64">
                  <div className="space-y-2">
                    {availableVariables.map(variable => (
                      <div key={variable.key} className="flex items-center justify-between p-2 border rounded">
                        <div>
                          <p className="font-medium">{variable.label}</p>
                          <p className="text-sm text-muted-foreground">
                            Valor atual: {leadData[variable.key as keyof typeof leadData] || 0}
                            {variable.type === 'currency' ? ' R$' : ''}
                          </p>
                        </div>
                        <Button size="sm" onClick={() => insertVariable(variable.key)}>
                          Inserir
                        </Button>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </DialogContent>
            </Dialog>

            <Separator orientation="vertical" className="h-8" />

            {/* Botões de Edição */}
            <Button variant={isEditing ? "default" : "outline"} onClick={() => setIsEditing(!isEditing)} className="flex items-center gap-2">
              <Edit className="h-4 w-4" />
              {isEditing ? 'Visualizar' : 'Editar'}
            </Button>

            <Button variant="outline" className="flex items-center gap-2">
              <Save className="h-4 w-4" />
              Salvar
            </Button>

            <Button variant="outline" className="flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Área Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Painel Lateral - Seções */}
        {isEditing && (
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="text-sm">Adicionar Seções</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-96">
                <div className="space-y-2">
                  {sectionTypes.map(({ type, label, icon: Icon }) => (
                    <Button
                      key={type}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start"
                      onClick={() => addSection(type as ProposalSection['type'])}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {label}
                    </Button>
                  ))}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        )}

        {/* Canvas Principal */}
        <Card className={isEditing ? "lg:col-span-3" : "lg:col-span-4"}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>{activeTemplate.name}</CardTitle>
                <CardDescription>
                  {activeTemplate.pageSize} • {activeTemplate.orientation} • {activeTemplate.sections.length} seções
                </CardDescription>
              </div>
              <div className="flex gap-2">
                <Badge variant="secondary">{activeTemplate.pageSize}</Badge>
                <Badge variant="outline">{activeTemplate.category}</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className={`border-2 border-dashed border-muted-foreground/20 rounded-lg p-4 min-h-96 ${
              activeTemplate.pageSize === 'A4' ? 'aspect-[210/297]' : 'aspect-video'
            }`}>
              {activeTemplate.sections.length === 0 ? (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  <div className="text-center">
                    <FileText className="h-12 w-12 mx-auto mb-4" />
                    <p>Nenhuma seção adicionada</p>
                    <p className="text-sm">Use o painel lateral para adicionar conteúdo</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeTemplate.sections.map(section => (
                    <div
                      key={section.id}
                      className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                        selectedSection === section.id ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                      }`}
                      onClick={() => setSelectedSection(section.id)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{section.title}</h4>
                        {isEditing && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); /* Edit section */ }}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={(e) => { e.stopPropagation(); removeSection(section.id); }}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {section.type === 'header' && 'Cabeçalho da proposta'}
                        {section.type === 'text' && 'Conteúdo de texto'}
                        {section.type === 'table' && 'Tabela de dados'}
                        {section.type === 'chart' && 'Gráfico ou visualização'}
                        {section.type === 'financial' && 'Análise financeira'}
                        {section.type === 'technical' && 'Especificações técnicas'}
                        {section.type === 'variables' && 'Variáveis dinâmicas'}
                        {section.type === 'timeline' && 'Cronograma de execução'}
                        {section.type === 'guarantees' && 'Garantias e certificações'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabelas Predefinidas */}
      <Card>
        <CardHeader>
          <CardTitle>Tabelas e Gráficos Disponíveis</CardTitle>
          <CardDescription>
            Elementos prontos para adicionar à sua proposta
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => addSection('table')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Table className="h-4 w-4" />
                  Consumo vs Geração
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Tabela comparativa mensal de consumo e geração de energia</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => addSection('chart')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Retorno do Investimento
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Comparativo: Energia Solar vs CDI vs Poupança</p>
              </CardContent>
            </Card>

            <Card className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => addSection('financial')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Fluxo de Caixa
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Projeção de economia ao longo dos anos</p>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}