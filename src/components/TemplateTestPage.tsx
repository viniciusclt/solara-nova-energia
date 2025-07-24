import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileText, FileImage, Monitor, Download, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { proposalTemplateManager } from '@/services/proposalTemplateManager';
import type { ProposalData } from '@/services/proposalTemplates';

// Mock data para teste dos templates
const mockProposalData: ProposalData = {
  lead: {
    name: "João Silva",
    email: "joao@exemplo.com",
    phone: "(11) 99999-9999",
    address: {
      street: "Rua das Flores, 123",
      city: "São Paulo",
      state: "SP",
      zipCode: "01234-567"
    },
    consumoMedio: 450
  },
  simulation: {
    potencia: 5.4,
    geracaoAnual: 8100,
    economia: 85,
    payback: 4.2,
    tir: 18.5,
    vpl: 45000
  },
  financial: {
    valorSistema: 25000,
    valorFinal: 22500,
    margem: 15,
    economiaAnual: 5400,
    economia25Anos: 135000
  },
  kit: {
    nome: "Kit Solar Residencial 5,4kWp",
    potencia: 5.4,
    preco: 22500,
    fabricante: "Canadian Solar",
    categoria: "Residencial"
  }
};

export function TemplateTestPage() {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  const templates = proposalTemplateManager.getAvailableTemplates();
  const newTemplates = templates.filter(t => 
    t.id === 'professional-a4' || t.id === 'presentation-16x9'
  );

  const handlePreview = async (templateId: string) => {
    setIsGenerating(true);
    setSelectedTemplate(templateId);
    
    try {
      const previewUrl = await proposalTemplateManager.previewPDF(templateId, mockProposalData);
      if (previewUrl) {
        window.open(previewUrl, '_blank');
        toast({
          title: "Preview gerado",
          description: "O template foi aberto em uma nova aba."
        });
      } else {
        toast({
          title: "Erro no preview",
          description: "Não foi possível gerar o preview do template.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error previewing template:', error);
      toast({
        title: "Erro no preview",
        description: "Ocorreu um erro ao gerar o preview.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      setSelectedTemplate(null);
    }
  };

  const handleDownload = (templateId: string) => {
    setIsGenerating(true);
    setSelectedTemplate(templateId);
    
    try {
      const success = proposalTemplateManager.downloadPDF(templateId, mockProposalData, `Teste_${templateId}.pdf`);
      if (success) {
        toast({
          title: "Download iniciado",
          description: "O arquivo PDF está sendo baixado."
        });
      } else {
        toast({
          title: "Erro no download",
          description: "Não foi possível gerar o arquivo PDF.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error downloading template:', error);
      toast({
        title: "Erro no download",
        description: "Ocorreu um erro ao gerar o PDF.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
      setSelectedTemplate(null);
    }
  };

  const getTemplateIcon = (templateId: string) => {
    switch (templateId) {
      case 'professional-a4':
        return <FileImage className="h-6 w-6" />;
      case 'presentation-16x9':
        return <Monitor className="h-6 w-6" />;
      default:
        return <FileText className="h-6 w-6" />;
    }
  };

  const getTemplateColor = (category: string) => {
    switch (category) {
      case 'professional':
        return 'bg-emerald-100 text-emerald-800';
      case 'presentation':
        return 'bg-indigo-100 text-indigo-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">Teste dos Novos Templates</h1>
        <p className="text-muted-foreground">
          Teste os novos templates profissionais implementados no SolarCalc Pro
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {newTemplates.map((template) => (
          <Card key={template.id} className="relative">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {getTemplateIcon(template.id)}
                </div>
                <div className="flex-1">
                  <CardTitle className="flex items-center gap-2">
                    {template.name}
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${getTemplateColor(template.category)}`}
                    >
                      {template.category}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {template.description}
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="text-sm text-muted-foreground">
                <p><strong>Características:</strong></p>
                <ul className="list-disc list-inside space-y-1 mt-2">
                  {template.id === 'professional-a4' && (
                    <>
                      <li>Formato A4 otimizado para impressão</li>
                      <li>Layout profissional com múltiplas páginas</li>
                      <li>Análise técnica e econômica detalhada</li>
                      <li>Gráficos e tabelas profissionais</li>
                    </>
                  )}
                  {template.id === 'presentation-16x9' && (
                    <>
                      <li>Formato 16:9 para apresentações</li>
                      <li>Slides otimizados para projetores</li>
                      <li>Design moderno e visual</li>
                      <li>Ideal para reuniões comerciais</li>
                    </>
                  )}
                </ul>
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePreview(template.id)}
                  disabled={isGenerating && selectedTemplate === template.id}
                  className="flex-1"
                >
                  <Eye className="h-4 w-4 mr-1" />
                  {isGenerating && selectedTemplate === template.id ? 'Gerando...' : 'Preview'}
                </Button>
                
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => handleDownload(template.id)}
                  disabled={isGenerating && selectedTemplate === template.id}
                  className="flex-1"
                >
                  <Download className="h-4 w-4 mr-1" />
                  {isGenerating && selectedTemplate === template.id ? 'Gerando...' : 'Download'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados de Teste</CardTitle>
          <CardDescription>
            Os templates estão sendo testados com os seguintes dados simulados:
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <h4 className="font-semibold mb-2">Cliente</h4>
              <ul className="text-sm space-y-1">
                <li>Nome: {mockProposalData.lead.name}</li>
                <li>Email: {mockProposalData.lead.email}</li>
                <li>Telefone: {mockProposalData.lead.phone}</li>
                <li>Consumo: {mockProposalData.lead.consumoMedio} kWh/mês</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Sistema</h4>
              <ul className="text-sm space-y-1">
                <li>Potência: {mockProposalData.simulation.potencia} kWp</li>
                <li>Geração Anual: {mockProposalData.simulation.geracaoAnual.toLocaleString()} kWh</li>
                <li>Economia: {mockProposalData.simulation.economia}%</li>
                <li>Payback: {mockProposalData.simulation.payback} anos</li>
              </ul>
            </div>
            
            <div>
              <h4 className="font-semibold mb-2">Financeiro</h4>
              <ul className="text-sm space-y-1">
                <li>Valor: R$ {mockProposalData.financial.valorFinal.toLocaleString()}</li>
                <li>TIR: {mockProposalData.simulation.tir}%</li>
                <li>VPL: R$ {mockProposalData.simulation.vpl.toLocaleString()}</li>
                <li>Economia 25 anos: R$ {mockProposalData.financial.economia25Anos.toLocaleString()}</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}