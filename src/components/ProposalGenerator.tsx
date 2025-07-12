import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { 
  FileText, 
  Download, 
  Send, 
  Eye, 
  Share2, 
  Printer,
  CheckCircle,
  Leaf,
  Shield,
  Zap,
  TrendingUp
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ProposalData {
  tipoInvestimento: string;
  incluirFinanciamento: boolean;
  incluirSustentabilidade: boolean;
  incluirGarantias: boolean;
  incluirEtapas: boolean;
  observacoes: string;
  prazoValidade: number;
  condicoesComerciais: string;
}

interface ProposalGeneratorProps {
  currentLead: any;
}

export function ProposalGenerator({ currentLead }: ProposalGeneratorProps) {
  const { toast } = useToast();
  const [proposalData, setProposalData] = useState<ProposalData>({
    tipoInvestimento: "investimento",
    incluirFinanciamento: true,
    incluirSustentabilidade: true,
    incluirGarantias: true,
    incluirEtapas: true,
    observacoes: "",
    prazoValidade: 30,
    condicoesComerciais: "Proposta válida por 30 dias. Preços sujeitos a alteração sem aviso prévio."
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [proposalGenerated, setProposalGenerated] = useState(false);

  const sustentabilityData = {
    reducaoCO2: 3.2, // toneladas/ano
    arvoresEquivalentes: 45,
    casasAlimentadas: 1.2,
    autoSuficiencia: 95
  };

  const garantias = [
    { item: "Módulos Fotovoltaicos", tempo: "25 anos", tipo: "Garantia de Performance" },
    { item: "Inversor", tempo: "5 anos", tipo: "Garantia do Fabricante" },
    { item: "Estrutura de Fixação", tempo: "10 anos", tipo: "Garantia contra Corrosão" },
    { item: "Instalação", tempo: "2 anos", tipo: "Garantia de Mão de Obra" },
    { item: "Projeto", tempo: "Vitalício", tipo: "Garantia de Funcionamento" }
  ];

  const etapasProjeto = [
    { etapa: "1. Análise Técnica", prazo: "2-3 dias", descricao: "Análise da viabilidade e dimensionamento" },
    { etapa: "2. Projeto Executivo", prazo: "5-7 dias", descricao: "Desenvolvimento do projeto detalhado" },
    { etapa: "3. Aprovação na Concessionária", prazo: "30-45 dias", descricao: "Aprovação do projeto pela distribuidora" },
    { etapa: "4. Instalação", prazo: "1-2 dias", descricao: "Instalação completa do sistema" },
    { etapa: "5. Conexão e Comissionamento", prazo: "7-15 dias", descricao: "Vistoria e ligação do sistema" }
  ];

  const itensInclusos = [
    "Módulos fotovoltaicos de alta eficiência",
    "Inversor string com monitoramento",
    "Estrutura de fixação em alumínio",
    "Cabeamento CC e CA",
    "Proteções e dispositivos de segurança",
    "Projeto executivo",
    "Instalação completa",
    "Comissionamento do sistema",
    "Treinamento operacional",
    "Documentação técnica completa"
  ];

  const generatePDF = async () => {
    setIsGenerating(true);
    try {
      // Simulação da geração de PDF
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setProposalGenerated(true);
      toast({
        title: "Proposta Gerada",
        description: "PDF da proposta comercial criado com sucesso!"
      });
    } catch (error) {
      toast({
        title: "Erro na Geração",
        description: "Erro ao gerar PDF. Tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const sendProposal = () => {
    if (currentLead?.email) {
      toast({
        title: "Proposta Enviada",
        description: `Proposta enviada para ${currentLead.email}`
      });
    } else {
      toast({
        title: "Email não encontrado",
        description: "Configure o email do cliente primeiro",
        variant: "destructive"
      });
    }
  };

  const shareProposal = async () => {
    const link = `https://app.solarcalc.com/proposta/12345`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Proposta Sistema Solar',
          text: 'Confira sua proposta personalizada de energia solar',
          url: link,
        });
      } catch (error) {
        console.log('Erro ao compartilhar:', error);
      }
    } else {
      // Fallback para copiar para clipboard
      navigator.clipboard.writeText(link);
      toast({
        title: "Link Copiado",
        description: "Link da proposta copiado para a área de transferência"
      });
    }
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Gerador de Propostas
              </CardTitle>
              <CardDescription>
                Configure e gere propostas comerciais personalizadas
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={generatePDF}
                disabled={isGenerating}
                variant="gradient"
                size="sm"
              >
                {isGenerating ? (
                  "Gerando..."
                ) : (
                  <>
                    <Download className="h-4 w-4" />
                    Gerar PDF
                  </>
                )}
              </Button>
              {proposalGenerated && (
                <Button onClick={sendProposal} variant="secondary" size="sm">
                  <Send className="h-4 w-4" />
                  Enviar
                </Button>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Preview da Proposta */}
      {currentLead && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle>Preview da Proposta</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
              <div className="text-center">
                <div className="text-lg font-bold text-primary">
                  {currentLead.name || "Cliente"}
                </div>
                <div className="text-sm text-muted-foreground">Cliente</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-secondary">7.2 kWp</div>
                <div className="text-sm text-muted-foreground">Potência</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-accent">95%</div>
                <div className="text-sm text-muted-foreground">Offset</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-success">2.1 anos</div>
                <div className="text-sm text-muted-foreground">Payback</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="configuracao" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="configuracao">Configuração</TabsTrigger>
          <TabsTrigger value="sustentabilidade">Sustentabilidade</TabsTrigger>
          <TabsTrigger value="garantias">Garantias</TabsTrigger>
          <TabsTrigger value="etapas">Etapas</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        <TabsContent value="configuracao">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Configurações Gerais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="prazoValidade">Prazo de Validade (dias)</Label>
                  <Input
                    id="prazoValidade"
                    type="number"
                    value={proposalData.prazoValidade}
                    onChange={(e) => setProposalData(prev => ({ ...prev, prazoValidade: Number(e.target.value) }))}
                  />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="incluirFinanciamento">Incluir Simulação de Financiamento</Label>
                    <Switch
                      id="incluirFinanciamento"
                      checked={proposalData.incluirFinanciamento}
                      onCheckedChange={(checked) => setProposalData(prev => ({ ...prev, incluirFinanciamento: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="incluirSustentabilidade">Incluir Dados de Sustentabilidade</Label>
                    <Switch
                      id="incluirSustentabilidade"
                      checked={proposalData.incluirSustentabilidade}
                      onCheckedChange={(checked) => setProposalData(prev => ({ ...prev, incluirSustentabilidade: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="incluirGarantias">Incluir Seção de Garantias</Label>
                    <Switch
                      id="incluirGarantias"
                      checked={proposalData.incluirGarantias}
                      onCheckedChange={(checked) => setProposalData(prev => ({ ...prev, incluirGarantias: checked }))}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label htmlFor="incluirEtapas">Incluir Etapas do Projeto</Label>
                    <Switch
                      id="incluirEtapas"
                      checked={proposalData.incluirEtapas}
                      onCheckedChange={(checked) => setProposalData(prev => ({ ...prev, incluirEtapas: checked }))}
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="observacoes">Observações Especiais</Label>
                  <Textarea
                    id="observacoes"
                    value={proposalData.observacoes}
                    onChange={(e) => setProposalData(prev => ({ ...prev, observacoes: e.target.value }))}
                    placeholder="Informações adicionais para incluir na proposta..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-card">
              <CardHeader>
                <CardTitle>Itens Inclusos no Sistema</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {itensInclusos.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-success" />
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="sustentabilidade">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Leaf className="h-5 w-5 text-success" />
                Impacto Ambiental
              </CardTitle>
              <CardDescription>
                Dados de sustentabilidade para incluir na proposta
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="text-center bg-gradient-card p-4 rounded-lg">
                  <div className="text-2xl font-bold text-success mb-2">{sustentabilityData.reducaoCO2}</div>
                  <div className="text-sm text-muted-foreground">Toneladas CO₂/ano</div>
                  <div className="text-xs text-muted-foreground mt-1">evitadas</div>
                </div>
                
                <div className="text-center bg-gradient-card p-4 rounded-lg">
                  <div className="text-2xl font-bold text-success mb-2">{sustentabilityData.arvoresEquivalentes}</div>
                  <div className="text-sm text-muted-foreground">Árvores plantadas</div>
                  <div className="text-xs text-muted-foreground mt-1">equivalente/ano</div>
                </div>
                
                <div className="text-center bg-gradient-card p-4 rounded-lg">
                  <div className="text-2xl font-bold text-success mb-2">{sustentabilityData.casasAlimentadas}</div>
                  <div className="text-sm text-muted-foreground">Casas alimentadas</div>
                  <div className="text-xs text-muted-foreground mt-1">energia limpa</div>
                </div>
                
                <div className="text-center bg-gradient-card p-4 rounded-lg">
                  <div className="text-2xl font-bold text-success mb-2">{sustentabilityData.autoSuficiencia}%</div>
                  <div className="text-sm text-muted-foreground">Autossuficiência</div>
                  <div className="text-xs text-muted-foreground mt-1">energética</div>
                </div>
              </div>

              <Separator className="my-6" />

              <div className="space-y-4">
                <h4 className="font-semibold">Benefícios Ambientais Destacados</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <Leaf className="h-5 w-5 text-success mt-0.5" />
                    <div>
                      <div className="font-medium">Energia 100% Renovável</div>
                      <div className="text-sm text-muted-foreground">
                        Contribuição direta para a matriz energética limpa do Brasil
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-3 p-3 bg-muted/50 rounded-lg">
                    <Shield className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <div className="font-medium">Independência Energética</div>
                      <div className="text-sm text-muted-foreground">
                        Redução da dependência de fontes não renováveis
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="garantias">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-primary" />
                Garantias e Certificações
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {garantias.map((garantia, index) => (
                  <div key={index} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{garantia.item}</h4>
                      <Badge variant="outline">{garantia.tempo}</Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">{garantia.tipo}</div>
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              <div className="space-y-3">
                <h4 className="font-semibold">Certificações e Normas</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm">ABNT NBR 16149 - Instalações</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm">ABNT NBR 16150 - Projeto</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm">IEC 61215 - Módulos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm">IEC 62109 - Inversores</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="etapas">
          <Card className="shadow-card">
            <CardHeader>
              <CardTitle>Etapas do Projeto</CardTitle>
              <CardDescription>
                Cronograma detalhado da implementação do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {etapasProjeto.map((etapa, index) => (
                  <div key={index} className="flex items-start gap-4 p-4 border border-border rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{etapa.etapa}</h4>
                        <Badge variant="secondary">{etapa.prazo}</Badge>
                      </div>
                      <div className="text-sm text-muted-foreground">{etapa.descricao}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-6 p-4 bg-gradient-card rounded-lg">
                <div className="text-center">
                  <div className="font-semibold">Prazo Total Estimado</div>
                  <div className="text-2xl font-bold text-primary">45-60 dias</div>
                  <div className="text-sm text-muted-foreground">
                    Da assinatura do contrato até a conexão do sistema
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preview">
          <Card className="shadow-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Preview da Proposta</CardTitle>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4" />
                    Visualizar
                  </Button>
                  <Button variant="outline" size="sm" onClick={shareProposal}>
                    <Share2 className="h-4 w-4" />
                    Compartilhar
                  </Button>
                  <Button variant="outline" size="sm">
                    <Printer className="h-4 w-4" />
                    Imprimir
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="bg-muted/30 p-6 rounded-lg border-2 border-dashed border-border">
                <div className="text-center space-y-4">
                  <div className="text-4xl">📄</div>
                  <div>
                    <h3 className="text-lg font-semibold">Proposta Comercial</h3>
                    <p className="text-muted-foreground">Sistema Fotovoltaico Residencial</p>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <div className="font-medium">Cliente:</div>
                      <div className="text-muted-foreground">{currentLead?.name || "Nome do Cliente"}</div>
                    </div>
                    <div>
                      <div className="font-medium">Sistema:</div>
                      <div className="text-muted-foreground">7.2 kWp</div>
                    </div>
                    <div>
                      <div className="font-medium">Valor:</div>
                      <div className="text-muted-foreground">R$ 20.150</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-4 pt-4">
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                      <Zap className="h-3 w-3 mr-1" />
                      Sistema Dimensionado
                    </Badge>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                      <TrendingUp className="h-3 w-3 mr-1" />
                      ROI 18.5%
                    </Badge>
                    <Badge variant="outline" className="bg-success/10 text-success border-success/20">
                      <Leaf className="h-3 w-3 mr-1" />
                      Sustentável
                    </Badge>
                  </div>

                  <div className="text-xs text-muted-foreground">
                    Proposta válida por {proposalData.prazoValidade} dias
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}