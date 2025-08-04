import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { logError } from '@/utils/secureLogger';
import { 
  FileText, 
  Download, 
  Eye, 
  Calendar,
  User,
  Zap,
  TrendingUp,
  Leaf,
  Shield,
  DollarSign,
  Clock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { proposalSharingService, SharedProposal } from "@/services/proposalSharingService";
import { proposalPDFGenerator } from "@/services/proposalPDFGenerator";

export function SharedProposalView() {
  const { shareToken } = useParams<{ shareToken: string }>();
  const { toast } = useToast();
  const [proposal, setProposal] = useState<SharedProposal | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessionStartTime] = useState(Date.now());

  useEffect(() => {
    if (shareToken) {
      loadProposal();
      recordView();
    }
  }, [shareToken]);

  useEffect(() => {
    // Registrar duração da sessão quando o usuário sair da página
    const handleBeforeUnload = () => {
      if (shareToken) {
        const sessionDuration = Math.floor((Date.now() - sessionStartTime) / 1000);
        proposalSharingService.updateSessionDuration(shareToken, sessionDuration);
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      handleBeforeUnload(); // Também registra quando o componente é desmontado
    };
  }, [shareToken, sessionStartTime]);

  const loadProposal = async () => {
    if (!shareToken) return;

    try {
      setLoading(true);
      const data = await proposalSharingService.getSharedProposal(shareToken);
      
      if (!data) {
        setError('Proposta não encontrada ou expirada');
        return;
      }

      setProposal(data);
    } catch (err) {
      logError('Erro ao carregar proposta compartilhada', {
        service: 'SharedProposalView',
        error: err instanceof Error ? err.message : 'Erro desconhecido',
        shareToken,
        action: 'loadProposal'
      });
      setError('Erro ao carregar proposta');
    } finally {
      setLoading(false);
    }
  };

  const recordView = async () => {
    if (!shareToken) return;

    try {
      const userAgent = navigator.userAgent;
      const referrer = document.referrer;
      
      await proposalSharingService.recordView(
        shareToken,
        undefined, // IP será capturado no backend
        userAgent,
        referrer
      );
    } catch (err) {
      logError('Erro ao registrar visualização da proposta compartilhada', {
        service: 'SharedProposalView',
        error: err instanceof Error ? err.message : 'Erro desconhecido',
        shareToken,
        action: 'recordView'
      });
    }
  };

  const downloadPDF = async () => {
    if (!proposal) return;

    try {
      const proposalData = proposal.proposal_data;
      proposalPDFGenerator.downloadPDF(proposalData, `Proposta_${proposal.lead_name.replace(/\s+/g, '_')}.pdf`);
      
      toast({
        title: "Download Iniciado",
        description: "O PDF da proposta está sendo baixado"
      });
    } catch (error) {
      logError('Erro ao baixar PDF da proposta compartilhada', {
        service: 'SharedProposalView',
        error: error instanceof Error ? error.message : 'Erro desconhecido',
        shareToken,
        leadName: proposal.lead_name,
        action: 'downloadPDF'
      });
      toast({
        title: "Erro no Download",
        description: "Não foi possível baixar o PDF",
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando proposta...</p>
        </div>
      </div>
    );
  }

  if (error || !proposal) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="text-center py-8">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Proposta não encontrada
            </h2>
            <p className="text-gray-600 mb-4">
              {error || 'Esta proposta pode ter expirado ou não existe.'}
            </p>
            <Button onClick={() => window.location.href = '/'}>
              Voltar ao início
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const proposalData = proposal.proposal_data;
  const expirationDate = new Date(proposal.expires_at);
  const isExpiringSoon = expirationDate.getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000; // 7 dias

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Zap className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Proposta de Energia Solar
                </h1>
                <p className="text-gray-600">
                  Para {proposal.lead_name}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button onClick={downloadPDF} className="bg-blue-600 hover:bg-blue-700">
                <Download className="h-4 w-4 mr-2" />
                Baixar PDF
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Aviso de expiração */}
        {isExpiringSoon && (
          <Card className="mb-6 border-amber-200 bg-amber-50">
            <CardContent className="py-4">
              <div className="flex items-center gap-2 text-amber-800">
                <Clock className="h-4 w-4" />
                <span className="font-medium">
                  Esta proposta expira em {Math.ceil((expirationDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))} dias
                </span>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Resumo da Proposta */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-600" />
              Resumo da Proposta
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {proposalData.simulation?.potencia || '7.2'} kWp
                </div>
                <div className="text-sm text-gray-600">Potência do Sistema</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  R$ {(proposalData.simulation?.economia || 9180).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Economia Anual</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {proposalData.simulation?.payback || '2.1'} anos
                </div>
                <div className="text-sm text-gray-600">Payback</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  {proposalData.simulation?.tir || '18.5'}%
                </div>
                <div className="text-sm text-gray-600">TIR</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Dados do Cliente */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5 text-blue-600" />
                Dados do Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="font-medium">Nome:</span>
                <span className="ml-2">{proposalData.lead?.name || proposal.lead_name}</span>
              </div>
              {proposalData.lead?.email && (
                <div>
                  <span className="font-medium">Email:</span>
                  <span className="ml-2">{proposalData.lead.email}</span>
                </div>
              )}
              {proposalData.lead?.phone && (
                <div>
                  <span className="font-medium">Telefone:</span>
                  <span className="ml-2">{proposalData.lead.phone}</span>
                </div>
              )}
              {proposalData.lead?.consumoMedio && (
                <div>
                  <span className="font-medium">Consumo Médio:</span>
                  <span className="ml-2">{proposalData.lead.consumoMedio} kWh/mês</span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Sistema Proposto */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-blue-600" />
                Sistema Proposto
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {proposalData.kit && (
                <div>
                  <span className="font-medium">Kit:</span>
                  <span className="ml-2">{proposalData.kit.nome}</span>
                </div>
              )}
              <div>
                <span className="font-medium">Potência:</span>
                <span className="ml-2">{proposalData.simulation?.potencia || '7.2'} kWp</span>
              </div>
              <div>
                <span className="font-medium">Geração Anual:</span>
                <span className="ml-2">{(proposalData.simulation?.geracaoAnual || 10800).toLocaleString()} kWh</span>
              </div>
              <div>
                <span className="font-medium">Valor do Sistema:</span>
                <span className="ml-2 font-bold text-green-600">
                  R$ {(proposalData.financial?.valorFinal || 20150).toLocaleString()}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Análise Financeira */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-blue-600" />
              Análise Financeira
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-green-600 mb-1">
                  R$ {(proposalData.financial?.economiaAnual || 9180).toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">Economia Anual</div>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-blue-600 mb-1">
                  {proposalData.simulation?.payback || '2.1'} anos
                </div>
                <div className="text-sm text-gray-600">Tempo de Retorno</div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-purple-600 mb-1">
                  {proposalData.simulation?.tir || '18.5'}%
                </div>
                <div className="text-sm text-gray-600">Taxa Interna de Retorno</div>
              </div>
              <div className="bg-orange-50 p-4 rounded-lg">
                <div className="text-2xl font-bold text-orange-600 mb-1">
                  R$ {((proposalData.financial?.economia25Anos || 275400) / 1000).toFixed(0)}k
                </div>
                <div className="text-sm text-gray-600">Economia em 25 anos</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Benefícios */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-green-600" />
              Benefícios da Energia Solar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <div className="font-medium">Economia Garantida</div>
                  <div className="text-sm text-gray-600">
                    Redução de até 95% na conta de energia elétrica
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Shield className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <div className="font-medium">Proteção contra Inflação</div>
                  <div className="text-sm text-gray-600">
                    Proteção contra aumentos na tarifa elétrica
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Leaf className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <div className="font-medium">Energia Limpa</div>
                  <div className="text-sm text-gray-600">
                    100% renovável e sustentável
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <DollarSign className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <div className="font-medium">Valorização do Imóvel</div>
                  <div className="text-sm text-gray-600">
                    Valorização de até 8% no valor do imóvel
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <Card className="mt-6">
          <CardContent className="py-4">
            <div className="flex items-center justify-between text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                <span>
                  Proposta válida até {expirationDate.toLocaleDateString('pt-BR')}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span>{proposal.view_count} visualizações</span>
              </div>
            </div>
            <Separator className="my-3" />
            <div className="text-center text-xs text-gray-500">
              Esta proposta foi gerada pelo SolarCalc Pro - Sistema de Gestão para Energia Solar
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}