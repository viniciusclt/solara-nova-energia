/**
 * Página Principal do Roadmap
 * 
 * Página que integra todos os componentes do roadmap,
 * incluindo dashboard, sugestões e gerenciamento de funcionalidades
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  RoadmapDashboard, 
  FeatureSuggestion, 
  VotingInterface, 
  StatusManager 
} from '@/components/roadmap';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { 
  ArrowLeft, 
  Plus, 
  Target, 
  TrendingUp, 
  MessageSquare,
  Settings,
  Users,
  BarChart3
} from 'lucide-react';
import { useRoadmapData } from '@/hooks/useRoadmapData';
import { useNotifications } from '@/hooks/useNotifications';
import type { RoadmapFeature } from '@/types/roadmap';

export default function RoadmapPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showSuggestionModal, setShowSuggestionModal] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<RoadmapFeature | null>(null);
  const [showFeatureModal, setShowFeatureModal] = useState(false);
  
  const { addNotification } = useNotifications();
  const { refresh } = useRoadmapData();
  
  // Simular usuário atual (em produção, viria do contexto de autenticação)
  const currentUserId = 'user-123'; // TODO: Integrar com sistema de autenticação
  const isAdmin = true; // TODO: Verificar permissões do usuário
  
  // Voltar para o menu principal
  const handleGoBack = () => {
    navigate('/');
  };
  
  // Abrir modal de sugestão
  const handleCreateFeature = () => {
    setShowSuggestionModal(true);
  };
  
  // Sucesso na criação de funcionalidade
  const handleFeatureCreated = (featureId: string) => {
    setShowSuggestionModal(false);
    refresh();
    addNotification({
      type: 'success',
      title: 'Funcionalidade criada!',
      message: 'Sua sugestão foi enviada com sucesso'
    });
  };
  
  // Cancelar criação de funcionalidade
  const handleCancelSuggestion = () => {
    setShowSuggestionModal(false);
  };
  
  // Abrir detalhes da funcionalidade
  const handleFeatureClick = (featureId: string) => {
    // TODO: Buscar funcionalidade por ID
    // Por enquanto, simular dados
    const mockFeature: RoadmapFeature = {
      id: featureId,
      title: 'Funcionalidade de Exemplo',
      description: 'Descrição da funcionalidade',
      category: 'frontend',
      status: 'in_progress',
      priority: 'high',
      votes_count: 25,
      comments_count: 8,
      progress_percentage: 60,
      tags: ['ui', 'ux'],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: 'user-456',
      metadata: {
        business_value: 'Alto impacto na experiência do usuário'
      }
    };
    
    setSelectedFeature(mockFeature);
    setShowFeatureModal(true);
  };
  
  // Fechar modal de funcionalidade
  const handleCloseFeatureModal = () => {
    setSelectedFeature(null);
    setShowFeatureModal(false);
  };
  
  // Atualizar contadores quando houver mudanças
  const handleVoteChange = (newVoteCount: number) => {
    if (selectedFeature) {
      setSelectedFeature(prev => prev ? {
        ...prev,
        votes_count: newVoteCount
      } : null);
    }
  };
  
  const handleCommentChange = (newCommentCount: number) => {
    if (selectedFeature) {
      setSelectedFeature(prev => prev ? {
        ...prev,
        comments_count: newCommentCount
      } : null);
    }
  };
  
  const handleStatusChange = (newStatus: string) => {
    if (selectedFeature) {
      setSelectedFeature(prev => prev ? {
        ...prev,
        status: newStatus
      } : null);
    }
    refresh(); // Atualizar dados do dashboard
  };
  
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleGoBack}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Voltar</span>
              </Button>
              
              <div className="flex items-center space-x-2">
                <Target className="h-6 w-6 text-primary" />
                <div>
                  <h1 className="text-2xl font-bold">Roadmap</h1>
                  <p className="text-sm text-muted-foreground">
                    Acompanhe e participe do desenvolvimento da plataforma
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                onClick={handleCreateFeature}
                size="sm"
                className="flex items-center space-x-2"
              >
                <Plus className="h-4 w-4" />
                <span>Sugerir Funcionalidade</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Conteúdo principal */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <BarChart3 className="h-4 w-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="suggest" className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Sugerir</span>
            </TabsTrigger>
            <TabsTrigger value="community" className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>Comunidade</span>
            </TabsTrigger>
            <TabsTrigger value="admin" className="flex items-center space-x-2">
              <Settings className="h-4 w-4" />
              <span>Admin</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="dashboard">
            <RoadmapDashboard 
              onCreateFeature={handleCreateFeature}
              onFeatureClick={handleFeatureClick}
            />
          </TabsContent>
          
          <TabsContent value="suggest">
            <div className="max-w-4xl mx-auto">
              <FeatureSuggestion 
                onSuccess={handleFeatureCreated}
                isModal={false}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="community">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Users className="h-5 w-5" />
                    <span>Participação da Comunidade</span>
                  </CardTitle>
                  <CardDescription>
                    Veja como a comunidade está participando do roadmap
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Estatísticas da Comunidade</h3>
                    <p className="text-muted-foreground">
                      Funcionalidade em desenvolvimento. Em breve você poderá ver estatísticas
                      detalhadas sobre a participação da comunidade.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          <TabsContent value="admin">
            <div className="space-y-6">
              {isAdmin ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="h-5 w-5" />
                      <span>Painel Administrativo</span>
                    </CardTitle>
                    <CardDescription>
                      Gerencie funcionalidades e configurações do roadmap
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Painel Administrativo</h3>
                      <p className="text-muted-foreground">
                        Funcionalidade em desenvolvimento. Em breve você terá acesso a
                        ferramentas avançadas de administração do roadmap.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardHeader>
                    <CardTitle>Acesso Restrito</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center py-8">
                      <Settings className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold mb-2">Acesso Negado</h3>
                      <p className="text-muted-foreground">
                        Você não tem permissão para acessar o painel administrativo.
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      
      {/* Modal de Sugestão de Funcionalidade */}
      <Dialog open={showSuggestionModal} onOpenChange={setShowSuggestionModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Sugerir Nova Funcionalidade</DialogTitle>
            <DialogDescription>
              Compartilhe sua ideia para melhorar a plataforma
            </DialogDescription>
          </DialogHeader>
          
          <FeatureSuggestion 
            onSuccess={handleFeatureCreated}
            onCancel={handleCancelSuggestion}
            isModal={true}
          />
        </DialogContent>
      </Dialog>
      
      {/* Modal de Detalhes da Funcionalidade */}
      <Dialog open={showFeatureModal} onOpenChange={setShowFeatureModal}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>{selectedFeature?.title}</span>
            </DialogTitle>
            <DialogDescription>
              {selectedFeature?.description}
            </DialogDescription>
          </DialogHeader>
          
          {selectedFeature && (
            <div className="space-y-6">
              <Tabs defaultValue="voting" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="voting" className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4" />
                    <span>Votação &amp; Comentários</span>
                  </TabsTrigger>
                  <TabsTrigger value="status" className="flex items-center space-x-2">
                    <Settings className="h-4 w-4" />
                    <span>Status &amp; Progresso</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="voting">
                  <VotingInterface 
                    feature={selectedFeature}
                    currentUserId={currentUserId}
                    onVoteChange={handleVoteChange}
                    onCommentChange={handleCommentChange}
                  />
                </TabsContent>
                
                <TabsContent value="status">
                  <StatusManager 
                    feature={selectedFeature}
                    currentUserId={currentUserId}
                    isAdmin={isAdmin}
                    onStatusChange={handleStatusChange}
                  />
                </TabsContent>
              </Tabs>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}