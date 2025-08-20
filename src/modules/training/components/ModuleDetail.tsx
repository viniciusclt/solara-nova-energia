import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { VideoPlayer } from './VideoPlayer';
import { PlaybookViewer } from './PlaybookViewer';
import { DiagramEditor } from './DiagramEditor';
import { AssessmentForm } from './AssessmentForm';
import { useTrainingProgress } from '@/hooks/useTrainingProgress';
import { ModuleWithContent, TrainingVideo, AssessmentResult } from '@/types/training';
import { 
  ArrowLeft, 
  Play, 
  CheckCircle, 
  Clock, 
  Video, 
  FileText, 
  Share2, 
  Target,
  BookOpen
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModuleDetailProps {
  module: ModuleWithContent;
  onBack: () => void;
  onVideoSelect?: (video: TrainingVideo) => void;
}

export function ModuleDetail({ module, onBack, onVideoSelect }: ModuleDetailProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedVideo, setSelectedVideo] = useState<TrainingVideo | null>(null);
  const [showAssessment, setShowAssessment] = useState(false);
  const { getModuleProgress, isVideoCompleted } = useTrainingProgress(module.id);

  const moduleProgress = getModuleProgress(module.id);
  const completedVideos = module.videos?.filter(video => isVideoCompleted(video.id)).length || 0;

  useEffect(() => {
    // Se há vídeos e nenhum está selecionado, selecionar o primeiro não concluído
    if (module.videos?.length > 0 && !selectedVideo) {
      const firstIncomplete = module.videos.find(video => !isVideoCompleted(video.id));
      setSelectedVideo(firstIncomplete || module.videos[0]);
    }
  }, [module.videos, selectedVideo, isVideoCompleted]);

  const handleVideoSelect = (video: TrainingVideo) => {
    setSelectedVideo(video);
    setActiveTab('videos');
    onVideoSelect?.(video);
  };

  const handleAssessmentComplete = (result: AssessmentResult) => {
    setShowAssessment(false);
    // Recarregar progresso ou mostrar certificado se passou
    if (result.passed) {
      // Lógica para gerar certificado
    }
  };

  const canTakeAssessment = (): boolean => {
    // Verificar se todos os vídeos foram assistidos
    return module.videos?.every(video => isVideoCompleted(video.id)) || false;
  };

  const getEstimatedDuration = (): string => {
    const totalSeconds = module.videos?.reduce((sum, video) => sum + (video.duration_seconds || 0), 0) || 0;
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{module.title}</h1>
            {module.category && (
              <Badge variant="secondary" className="mt-1">
                {module.category}
              </Badge>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          {moduleProgress >= 100 && (
            <Badge variant="default" className="bg-green-500">
              <CheckCircle className="h-3 w-3 mr-1" />
              Concluído
            </Badge>
          )}
          <div className="text-right">
            <div className="text-sm text-gray-600">Progresso</div>
            <div className="text-lg font-semibold">{moduleProgress}%</div>
          </div>
        </div>
      </div>

      {/* Progresso geral */}
      <Card>
        <CardContent className="p-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso do módulo</span>
              <span>{moduleProgress}%</span>
            </div>
            <Progress value={moduleProgress} className="w-full" />
            <div className="flex justify-between text-xs text-gray-600">
              <span>{completedVideos}/{module.videos?.length || 0} vídeos assistidos</span>
              <span>Duração estimada: {getEstimatedDuration()}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Conteúdo principal */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="videos">Vídeos</TabsTrigger>
          <TabsTrigger value="playbooks">Playbooks</TabsTrigger>
          <TabsTrigger value="diagrams">Diagramas</TabsTrigger>
          <TabsTrigger value="assessment">Avaliação</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Descrição do módulo */}
          {module.description && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="h-5 w-5 mr-2" />
                  Sobre este módulo
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{module.description}</p>
              </CardContent>
            </Card>
          )}

          {/* Estatísticas do módulo */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Video className="h-5 w-5 text-purple-500" />
                  <div>
                    <div className="text-2xl font-bold">{module.videos?.length || 0}</div>
                    <div className="text-sm text-gray-600">Vídeos</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <div>
                    <div className="text-2xl font-bold">{module.playbooks?.length || 0}</div>
                    <div className="text-sm text-gray-600">Playbooks</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Share2 className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold">{module.diagrams?.length || 0}</div>
                    <div className="text-sm text-gray-600">Diagramas</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Target className="h-5 w-5 text-red-500" />
                  <div>
                    <div className="text-2xl font-bold">{module.assessments?.length || 0}</div>
                    <div className="text-sm text-gray-600">Avaliações</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Lista de vídeos com progresso */}
          <Card>
            <CardHeader>
              <CardTitle>Conteúdo do Módulo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {module.videos?.map((video, index) => {
                  const isCompleted = isVideoCompleted(video.id);
                  
                  return (
                    <div
                      key={video.id}
                      className={cn(
                        "flex items-center justify-between p-3 rounded-lg border cursor-pointer hover:bg-gray-50 transition-colors",
                        selectedVideo?.id === video.id && "border-blue-500 bg-blue-50"
                      )}
                      onClick={() => handleVideoSelect(video)}
                    >
                      <div className="flex items-center space-x-3">
                        <div className={cn(
                          "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                          isCompleted 
                            ? "bg-green-500 text-white" 
                            : "bg-gray-200 text-gray-600"
                        )}>
                          {isCompleted ? <CheckCircle className="h-4 w-4" /> : index + 1}
                        </div>
                        <div>
                          <h4 className="font-medium">{video.title}</h4>
                          {video.description && (
                            <p className="text-sm text-gray-600 line-clamp-1">
                              {video.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {video.duration_seconds && (
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="h-3 w-3 mr-1" />
                            {Math.round(video.duration_seconds / 60)}min
                          </div>
                        )}
                        <Button size="sm" variant="ghost">
                          <Play className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="videos" className="space-y-4">
          {selectedVideo ? (
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>{selectedVideo.title}</CardTitle>
                  {selectedVideo.description && (
                    <p className="text-gray-600">{selectedVideo.description}</p>
                  )}
                </CardHeader>
                <CardContent>
                  <VideoPlayer
                    src={selectedVideo.video_url}
                    videoId={selectedVideo.id}
                    moduleId={module.id}
                    title={selectedVideo.title}
                    poster={selectedVideo.thumbnail_url}
                    className="aspect-video"
                  />
                </CardContent>
              </Card>

              {/* Lista de vídeos lateral */}
              <Card>
                <CardHeader>
                  <CardTitle>Outros vídeos do módulo</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {module.videos?.map((video) => (
                      <div
                        key={video.id}
                        className={cn(
                          "flex items-center space-x-3 p-2 rounded cursor-pointer hover:bg-gray-50",
                          selectedVideo.id === video.id && "bg-blue-50 border border-blue-200"
                        )}
                        onClick={() => setSelectedVideo(video)}
                      >
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center text-xs",
                          isVideoCompleted(video.id) 
                            ? "bg-green-500 text-white" 
                            : "bg-gray-200 text-gray-600"
                        )}>
                          {isVideoCompleted(video.id) ? '✓' : '▶'}
                        </div>
                        <div className="flex-1">
                          <div className="text-sm font-medium line-clamp-1">
                            {video.title}
                          </div>
                          {video.duration_seconds && (
                            <div className="text-xs text-gray-500">
                              {Math.round(video.duration_seconds / 60)}min
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum vídeo selecionado</h3>
                <p className="text-gray-600">
                  Selecione um vídeo da lista para começar a assistir.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="playbooks">
          <PlaybookViewer playbooks={module.playbooks} />
        </TabsContent>

        <TabsContent value="diagrams">
          <DiagramEditor 
            diagrams={module.diagrams} 
            moduleId={module.id}
            readOnly={true}
          />
        </TabsContent>

        <TabsContent value="assessment" className="space-y-4">
          {(module.assessments?.length || 0) === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhuma avaliação disponível</h3>
                <p className="text-gray-600">
                  Este módulo não possui avaliações.
                </p>
              </CardContent>
            </Card>
          ) : !canTakeAssessment() ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Clock className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">Avaliação bloqueada</h3>
                <p className="text-gray-600 mb-4">
                  Complete todos os vídeos do módulo para liberar a avaliação.
                </p>
                <div className="text-sm text-gray-500">
                  Progresso: {completedVideos}/{module.videos?.length || 0} vídeos assistidos
                </div>
              </CardContent>
            </Card>
          ) : showAssessment ? (
            <AssessmentForm
              assessment={module.assessments?.[0]}
              onComplete={handleAssessmentComplete}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="h-5 w-5 mr-2" />
                  Avaliação do Módulo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold">{module.assessments?.[0]?.title}</h3>
                  {module.assessments?.[0]?.description && (
                    <p className="text-gray-600 mt-1">{module.assessments[0].description}</p>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Questões:</span> {module.assessments?.[0]?.questions?.length || 0}
                  </div>
                  <div>
                    <span className="font-medium">Pontuação mínima:</span> {module.assessments?.[0]?.passing_score || 0}%
                  </div>
                  {module.assessments?.[0]?.time_limit_minutes && (
                    <div>
                      <span className="font-medium">Tempo limite:</span> {module.assessments[0].time_limit_minutes} minutos
                    </div>
                  )}
                </div>

                <Button 
                  onClick={() => setShowAssessment(true)}
                  className="w-full"
                >
                  <Target className="h-4 w-4 mr-2" />
                  Iniciar Avaliação
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default ModuleDetail;