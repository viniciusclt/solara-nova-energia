import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  FileText,
  Calendar,
  User,
  Building,
  Save,
  Share2,
  Download,
  Settings,
  Clock,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { ProposalEditor } from '../components/proposal/ProposalEditor';
import { cn } from '../utils/cn';
import { toast } from 'sonner';

// =====================================================================================
// INTERFACES
// =====================================================================================

interface ProposalMetadata {
  id: string;
  title: string;
  description?: string;
  clientName: string;
  clientCompany?: string;
  createdAt: string;
  updatedAt: string;
  status: 'draft' | 'review' | 'approved' | 'sent';
  version: number;
  tags?: string[];
}

interface ProposalData {
  metadata: ProposalMetadata;
  canvasData: {
    elements: ProposalElement[];
    config: {
      width: number;
      height: number;
      backgroundColor: string;
    };
  };
}

// =====================================================================================
// COMPONENTE DA PÁGINA
// =====================================================================================

export const ProposalEditorPage: React.FC = () => {
  const { proposalId } = useParams<{ proposalId: string }>();
  const navigate = useNavigate();
  
  // =====================================================================================
  // ESTADO
  // =====================================================================================
  
  const [proposal, setProposal] = useState<ProposalData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showMetadataModal, setShowMetadataModal] = useState(false);

  // =====================================================================================
  // EFEITOS
  // =====================================================================================

  useEffect(() => {
    loadProposal();
  }, [proposalId]);

  // Detectar mudanças não salvas
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'Você tem alterações não salvas. Deseja realmente sair?';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  // =====================================================================================
  // FUNÇÕES
  // =====================================================================================

  const loadProposal = async () => {
    setLoading(true);
    try {
      // Simular carregamento da proposta
      // Em uma aplicação real, isso viria de uma API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      if (proposalId === 'new') {
        // Criar nova proposta
        const newProposal: ProposalData = {
          metadata: {
            id: `prop_${Date.now()}`,
            title: 'Nova Proposta',
            clientName: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            status: 'draft',
            version: 1,
          },
          canvasData: {
            elements: [],
            config: {
              width: 1920,
              height: 1080,
              backgroundColor: '#ffffff',
            },
          },
        };
        setProposal(newProposal);
      } else {
        // Carregar proposta existente
        const existingProposal: ProposalData = {
          metadata: {
            id: proposalId || '',
            title: 'Proposta Solar Residencial',
            description: 'Sistema fotovoltaico para residência de 150m²',
            clientName: 'João Silva',
            clientCompany: 'Silva & Associados',
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-16T14:30:00Z',
            status: 'draft',
            version: 3,
            tags: ['residencial', 'solar', 'economia'],
          },
          canvasData: {
            elements: [],
            config: {
              width: 1920,
              height: 1080,
              backgroundColor: '#ffffff',
            },
          },
        };
        setProposal(existingProposal);
        setLastSaved(new Date(existingProposal.metadata.updatedAt));
      }
    } catch (error) {
      console.error('Erro ao carregar proposta:', error);
      toast.error('Erro ao carregar a proposta');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (canvasData: ProposalData['canvasData']) => {
    if (!proposal) return;
    
    setSaving(true);
    try {
      // Simular salvamento
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const updatedProposal = {
        ...proposal,
        metadata: {
          ...proposal.metadata,
          updatedAt: new Date().toISOString(),
          version: proposal.metadata.version + 1,
        },
        canvasData,
      };
      
      setProposal(updatedProposal);
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
      
      toast.success('Proposta salva com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
      toast.error('Erro ao salvar a proposta');
    } finally {
      setSaving(false);
    }
  };

  const handleExport = async (format: 'pdf' | 'pptx' | 'png') => {
    if (!proposal) return;
    
    try {
      // Simular exportação
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success(`Proposta exportada como ${format.toUpperCase()}!`);
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast.error('Erro ao exportar a proposta');
    }
  };

  const handleShare = async (shareData: { permissions: string[]; expiresAt?: string }) => {
    if (!proposal) return;
    
    try {
      // Simular compartilhamento
      const shareUrl = `${window.location.origin}/proposal/view/${proposal.metadata.id}`;
      await navigator.clipboard.writeText(shareUrl);
      
      toast.success('Link de compartilhamento copiado para a área de transferência!');
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      toast.error('Erro ao gerar link de compartilhamento');
    }
  };

  const updateMetadata = (updates: Partial<ProposalMetadata>) => {
    if (!proposal) return;
    
    setProposal({
      ...proposal,
      metadata: {
        ...proposal.metadata,
        ...updates,
        updatedAt: new Date().toISOString(),
      },
    });
    setHasUnsavedChanges(true);
  };

  const getStatusColor = (status: ProposalMetadata['status']) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-700';
      case 'review': return 'bg-yellow-100 text-yellow-700';
      case 'approved': return 'bg-green-100 text-green-700';
      case 'sent': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusIcon = (status: ProposalMetadata['status']) => {
    switch (status) {
      case 'draft': return FileText;
      case 'review': return AlertCircle;
      case 'approved': return CheckCircle;
      case 'sent': return Share2;
      default: return FileText;
    }
  };

  // =====================================================================================
  // COMPONENTES
  // =====================================================================================

  const MetadataModal = () => {
    if (!proposal || !showMetadataModal) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4"
        >
          <div className="p-6">
            <h3 className="text-lg font-semibold mb-4">Informações da Proposta</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Título
                </label>
                <input
                  type="text"
                  value={proposal.metadata.title}
                  onChange={(e) => updateMetadata({ title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descrição
                </label>
                <textarea
                  value={proposal.metadata.description || ''}
                  onChange={(e) => updateMetadata({ description: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cliente
                  </label>
                  <input
                    type="text"
                    value={proposal.metadata.clientName}
                    onChange={(e) => updateMetadata({ clientName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Empresa
                  </label>
                  <input
                    type="text"
                    value={proposal.metadata.clientCompany || ''}
                    onChange={(e) => updateMetadata({ clientCompany: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={proposal.metadata.status}
                  onChange={(e) => updateMetadata({ status: e.target.value as ProposalMetadata['status'] })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="draft">Rascunho</option>
                  <option value="review">Em Revisão</option>
                  <option value="approved">Aprovado</option>
                  <option value="sent">Enviado</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowMetadataModal(false)}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() => setShowMetadataModal(false)}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                Salvar
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  };

  // =====================================================================================
  // RENDER
  // =====================================================================================

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando proposta...</p>
        </div>
      </div>
    );
  }

  if (!proposal) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Proposta não encontrada</h2>
          <p className="text-gray-600 mb-4">A proposta solicitada não pôde ser carregada.</p>
          <button
            onClick={() => navigate('/fv')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Voltar às Propostas
          </button>
        </div>
      </div>
    );
  }

  const StatusIcon = getStatusIcon(proposal.metadata.status);

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/fv')}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Voltar"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            
            <div>
              <div className="flex items-center space-x-3">
                <h1 className="text-xl font-semibold text-gray-900">
                  {proposal.metadata.title}
                </h1>
                
                <div className={cn(
                  "flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium",
                  getStatusColor(proposal.metadata.status)
                )}>
                  <StatusIcon className="w-3 h-3" />
                  <span className="capitalize">{proposal.metadata.status}</span>
                </div>
                
                {hasUnsavedChanges && (
                  <div className="flex items-center space-x-1 text-xs text-amber-600">
                    <Clock className="w-3 h-3" />
                    <span>Não salvo</span>
                  </div>
                )}
              </div>
              
              <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                <div className="flex items-center space-x-1">
                  <User className="w-4 h-4" />
                  <span>{proposal.metadata.clientName}</span>
                  {proposal.metadata.clientCompany && (
                    <>
                      <span>•</span>
                      <Building className="w-4 h-4" />
                      <span>{proposal.metadata.clientCompany}</span>
                    </>
                  )}
                </div>
                
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>v{proposal.metadata.version}</span>
                </div>
                
                {lastSaved && (
                  <div className="flex items-center space-x-1">
                    <Save className="w-4 h-4" />
                    <span>Salvo às {lastSaved.toLocaleTimeString()}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowMetadataModal(true)}
              className="flex items-center space-x-2 px-3 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              <Settings className="w-4 h-4" />
              <span>Configurações</span>
            </button>
          </div>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1">
        <ProposalEditor
          proposalId={proposal.metadata.id}
          onSave={handleSave}
          onExport={handleExport}
          onShare={handleShare}
        />
      </div>

      {/* Modal de Metadados */}
      <MetadataModal />
    </div>
  );
};

export default ProposalEditorPage;