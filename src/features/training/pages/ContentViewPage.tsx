// =====================================================
// PÁGINA DE VISUALIZAÇÃO DE CONTEÚDO
// Sistema de Treinamentos Corporativos - Solara Nova Energia
// Versão: 1.0
// Data: 2024-12-12
// =====================================================

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  FileText,
  Download,
  CheckCircle,
  Clock
} from 'lucide-react';
import { Button } from '../../../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card';
import { Badge } from '../../../components/ui/badge';
import { Progress } from '../../../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { useAuth } from '../../../contexts/AuthContext';
import { useModuleContent, useUserProgress } from '../hooks/useTraining';
import { SidebarToggle } from '../../../components/sidebar';
import VideoPlayer from '../components/VideoPlayer';
import type { ModuleContent } from '../types';

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

const ContentViewPage: React.FC = () => {
  const { contentId, moduleId } = useParams<{ contentId: string; moduleId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [currentProgress, setCurrentProgress] = useState(0);

  const {
    data: content,
    isLoading,
    error
  } = useModuleContent(moduleId!, contentId!);

  const {
    data: userProgress,
    updateProgress
  } = useUserProgress(moduleId!);

  // =====================================================
  // HANDLERS
  // =====================================================

  const handleProgressUpdate = (progress: number) => {
    setCurrentProgress(progress);
    if (progress >= 90) {
      updateProgress.mutate({
        moduleId: moduleId!,
        contentId: contentId!,
        progress: 100,
        completed: true
      });
    }
  };

  const handleBackToModule = () => {
    navigate(`/training/modules/${moduleId}`);
  };

  const handleNextContent = () => {
    // Lógica para próximo conteúdo
    console.log('Próximo conteúdo');
  };

  const handlePreviousContent = () => {
    // Lógica para conteúdo anterior
    console.log('Conteúdo anterior');
  };

  // =====================================================
  // LOADING E ERROR STATES
  // =====================================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !content) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="h-16 w-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Conteúdo não encontrado</h2>
              <p className="text-gray-600 mb-6">O conteúdo solicitado não foi encontrado ou você não tem permissão para acessá-lo.</p>
              <Button onClick={handleBackToModule}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar ao Módulo
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // =====================================================
  // RENDER PRINCIPAL
  // =====================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <SidebarToggle />
                  <div>
                    <CardTitle className="text-2xl">{content.title}</CardTitle>
                    <p className="text-gray-600 mt-2">{content.description}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button onClick={handleBackToModule} variant="outline">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Voltar ao Módulo
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <Badge variant="secondary" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  {content.duration} minutos
                </Badge>
                <Badge variant={content.type === 'video' ? 'default' : 'outline'}>
                  {content.type === 'video' ? 'Vídeo' : content.type === 'document' ? 'Documento' : 'Texto'}
                </Badge>
                {userProgress?.completed && (
                  <Badge variant="default" className="bg-green-600">
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Concluído
                  </Badge>
                )}
              </div>
              
              {/* Progress Bar */}
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progresso</span>
                  <span>{Math.round(currentProgress)}%</span>
                </div>
                <Progress value={currentProgress} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-0">
                  {content.type === 'video' && content.videoUrl && (
                    <VideoPlayer
                      src={content.videoUrl}
                      title={content.title}
                      onProgress={handleProgressUpdate}
                      watermark={content.watermark}
                      securitySettings={content.securitySettings}
                    />
                  )}
                  
                  {content.type === 'document' && (
                    <div className="p-6">
                      <div className="prose max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: content.content || '' }} />
                      </div>
                      
                      {content.attachments && content.attachments.length > 0 && (
                        <div className="mt-6 pt-6 border-t">
                          <h4 className="font-semibold mb-3">Anexos</h4>
                          <div className="space-y-2">
                            {content.attachments.map((attachment, index) => (
                              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-3">
                                  <FileText className="h-5 w-5 text-gray-500" />
                                  <span className="font-medium">{attachment.name}</span>
                                </div>
                                <Button size="sm" variant="outline">
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </Button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {content.type === 'text' && (
                    <div className="p-6">
                      <div className="prose max-w-none">
                        <div dangerouslySetInnerHTML={{ __html: content.content || '' }} />
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Navigation */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Navegação</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button 
                    onClick={handlePreviousContent} 
                    variant="outline" 
                    className="w-full"
                    disabled
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Conteúdo Anterior
                  </Button>
                  <Button 
                    onClick={handleNextContent} 
                    className="w-full"
                    disabled
                  >
                    Próximo Conteúdo
                    <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
                  </Button>
                </CardContent>
              </Card>

              {/* Content Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Informações</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duração:</span>
                    <span className="font-medium">{content.duration} min</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Tipo:</span>
                    <span className="font-medium capitalize">{content.type}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <Badge variant={userProgress?.completed ? 'default' : 'secondary'}>
                      {userProgress?.completed ? 'Concluído' : 'Em andamento'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ContentViewPage;