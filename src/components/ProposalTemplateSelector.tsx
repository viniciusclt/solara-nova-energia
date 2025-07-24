import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { 
  FileText, 
  Eye, 
  Download, 
  Sparkles, 
  BarChart3, 
  BookOpen, 
  Building2, 
  Zap,
  Star,
  Palette,
  Copy,
  Settings,
  FileImage,
  Monitor
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { proposalTemplateManager } from '@/services/proposalTemplateManager';
import { ProposalPDFGenerator } from '@/services/proposalPDFGenerator';
import { TemplateCustomizer } from '@/components/TemplateCustomizer';
import type { ProposalData, ProposalTemplate } from '@/services/proposalTemplates';

// Create a singleton instance of the PDF generator
const proposalPDFGenerator = new ProposalPDFGenerator();

interface ProposalTemplateSelectorProps {
  data: ProposalData;
  onTemplateSelect?: (templateId: string) => void;
  onPreview?: (templateId: string) => void;
  onDownload?: (templateId: string) => void;
  selectedTemplateId?: string;
  showPreview?: boolean;
  showDownload?: boolean;
}

const templateIcons = {
  'prototype-replica': Building2,
  'standard': FileText,
  'aida': Zap,
  'data-focused': BarChart3,
  'storytelling': BookOpen,
  'premium-corporate': Building2,
  'professional-a4': FileImage,
  'presentation-16x9': Monitor
};

const categoryColors = {
  'standard': 'bg-blue-100 text-blue-800',
  'premium': 'bg-purple-100 text-purple-800',
  'corporate': 'bg-gray-100 text-gray-800',
  'minimal': 'bg-green-100 text-green-800',
  'data-focused': 'bg-orange-100 text-orange-800',
  'professional': 'bg-emerald-100 text-emerald-800',
  'presentation': 'bg-indigo-100 text-indigo-800'
};

export function ProposalTemplateSelector({
  data,
  onTemplateSelect,
  onPreview,
  onDownload,
  selectedTemplateId = 'standard',
  showPreview = true,
  showDownload = true
}: ProposalTemplateSelectorProps) {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<ProposalTemplate[]>([]);
  const [recommendedTemplates, setRecommendedTemplates] = useState<ProposalTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState(selectedTemplateId);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [customizationDialogOpen, setCustomizationDialogOpen] = useState(false);
  const [selectedTemplateForCustomization, setSelectedTemplateForCustomization] = useState<ProposalTemplate | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  useEffect(() => {
    // Load available templates
    const availableTemplates = proposalTemplateManager.getAvailableTemplates();
    setTemplates(availableTemplates);

    // Get recommendations based on data
    const recommendations = proposalTemplateManager.getRecommendedTemplates(data);
    setRecommendedTemplates(recommendations);
  }, [data]);

  const handleTemplateSelect = (templateId: string) => {
    setSelectedTemplate(templateId);
    onTemplateSelect?.(templateId);
  };

  const handlePreview = async (templateId: string) => {
    setIsGenerating(true);
    try {
      const previewUrl = await proposalPDFGenerator.previewPDFWithTemplate(templateId, data);
      if (previewUrl) {
        window.open(previewUrl, '_blank');
        onPreview?.(templateId);
      } else {
        toast({
          title: "Erro na visualização",
          description: "Não foi possível gerar a visualização do template",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error previewing template:', error);
      toast({
        title: "Erro na visualização",
        description: "Ocorreu um erro ao gerar a visualização",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (templateId: string) => {
    setIsGenerating(true);
    try {
      const success = proposalPDFGenerator.downloadPDFWithTemplate(templateId, data);
      if (success) {
        toast({
          title: "Download iniciado",
          description: "O arquivo PDF está sendo baixado"
        });
        onDownload?.(templateId);
      } else {
        toast({
          title: "Erro no download",
          description: "Não foi possível gerar o arquivo PDF",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error downloading template:', error);
      toast({
        title: "Erro no download",
        description: "Ocorreu um erro ao gerar o PDF",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCustomizeTemplate = (template: ProposalTemplate) => {
    setSelectedTemplateForCustomization(template);
    setCustomizationDialogOpen(true);
  };

  const handleCustomizationSave = (customization: any) => {
    // Here you would save the customization to localStorage or backend
    const customizationKey = `template_customization_${selectedTemplateForCustomization?.id}`;
    localStorage.setItem(customizationKey, JSON.stringify(customization));
    
    toast({
      title: "Customização salva",
      description: "As configurações do template foram salvas com sucesso.",
    });
    
    setCustomizationDialogOpen(false);
  };

  const getTemplateCustomization = (templateId: string) => {
    const customizationKey = `template_customization_${templateId}`;
    const saved = localStorage.getItem(customizationKey);
    return saved ? JSON.parse(saved) : null;
  };

  const renderTemplateCard = (template: ProposalTemplate, isRecommended: boolean = false) => {
    const IconComponent = templateIcons[template.id as keyof typeof templateIcons] || FileText;
    const isSelected = selectedTemplate === template.id;

    return (
      <Card 
        key={template.id} 
        className={`cursor-pointer transition-all hover:shadow-md ${
          isSelected ? 'ring-2 ring-primary border-primary' : ''
        }`}
        onClick={() => handleTemplateSelect(template.id)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                <IconComponent className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  {template.name}
                  {isRecommended && (
                    <Badge variant="secondary" className="text-xs">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Recomendado
                    </Badge>
                  )}
                </CardTitle>
                <Badge 
                  variant="outline" 
                  className={`text-xs mt-1 ${categoryColors[template.category] || 'bg-gray-100 text-gray-800'}`}
                >
                  {template.category}
                </Badge>
              </div>
            </div>
            <RadioGroupItem value={template.id} />
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <CardDescription className="text-sm mb-4">
            {template.description}
          </CardDescription>
          
          {(showPreview || showDownload) && (
            <div className="flex gap-2">
              {showPreview && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreview(template.id);
                  }}
                  disabled={isGenerating}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  Visualizar
                </Button>
              )}
              {showDownload && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDownload(template.id);
                  }}
                  disabled={isGenerating}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Baixar
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCustomizeTemplate(template);
                }}
                className="px-2"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const groupedTemplates = templates.reduce((acc, template) => {
    if (!acc[template.category]) {
      acc[template.category] = [];
    }
    acc[template.category].push(template);
    return acc;
  }, {} as Record<string, ProposalTemplate[]>);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold mb-2">Escolha o Template da Proposta</h3>
        <p className="text-muted-foreground text-sm">
          Selecione o template que melhor se adequa ao seu cliente e tipo de proposta
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="recommended">
            <Sparkles className="h-4 w-4 mr-2" />
            Recomendados
          </TabsTrigger>
          <TabsTrigger value="all">Todos os Templates</TabsTrigger>
          <TabsTrigger value="categories">Por Categoria</TabsTrigger>
        </TabsList>

        <TabsContent value="recommended" className="space-y-4">
          {recommendedTemplates.length > 0 ? (
            <RadioGroup value={selectedTemplate} onValueChange={handleTemplateSelect}>
              <div className="grid gap-4 md:grid-cols-2">
                {recommendedTemplates.map(template => renderTemplateCard(template, true))}
              </div>
            </RadioGroup>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">
                  Nenhuma recomendação específica. Todos os templates são adequados para sua proposta.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          <RadioGroup value={selectedTemplate} onValueChange={handleTemplateSelect}>
            <div className="grid gap-4 md:grid-cols-2">
              {templates.map(template => renderTemplateCard(template))}
            </div>
          </RadioGroup>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <RadioGroup value={selectedTemplate} onValueChange={handleTemplateSelect}>
            {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
              <div key={category} className="space-y-3">
                <h4 className="font-medium text-sm uppercase tracking-wide text-muted-foreground">
                  {category}
                </h4>
                <div className="grid gap-4 md:grid-cols-2">
                  {categoryTemplates.map(template => renderTemplateCard(template))}
                </div>
              </div>
            ))}
          </RadioGroup>
        </TabsContent>
      </Tabs>

      {/* Template Statistics */}
      <Card className="bg-muted/50">
        <CardContent className="pt-4">
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>{templates.length} templates disponíveis</span>
            <span>Template selecionado: {templates.find(t => t.id === selectedTemplate)?.name}</span>
          </div>
        </CardContent>
      </Card>

      {/* Template Customization Dialog */}
      <Dialog open={customizationDialogOpen} onOpenChange={setCustomizationDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Customizar Template: {selectedTemplateForCustomization?.name}
            </DialogTitle>
          </DialogHeader>
          {selectedTemplateForCustomization && (
             <TemplateCustomizer
               templateId={selectedTemplateForCustomization.id}
               templateName={selectedTemplateForCustomization.name}
               initialCustomization={getTemplateCustomization(selectedTemplateForCustomization.id)}
               onSave={handleCustomizationSave}
               onCustomizationChange={() => {}}
             />
           )}
        </DialogContent>
      </Dialog>
    </div>
  );
}