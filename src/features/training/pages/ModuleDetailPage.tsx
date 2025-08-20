// =====================================================
// PÁGINA DE DETALHES DO MÓDULO
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
  Clock,
  Users,
  Star,
  BookOpen,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trophy,
  Target,
  Calendar,
  Edit,
  Share2,
  Download,
  MoreVertical,
  Eye,
  FileText,
  Video,
  HelpCircle,
  Award,
  Zap,
  TrendingUp,
  BarChart3,
  Settings,
  Plus,
  ChevronRight,
  ChevronDown,
  Info,
  ExternalLink,
  Bookmark,
  BookmarkCheck,
  Heart,
  MessageSquare,
  ThumbsUp,
  Flag,
  Upload,
  GitBranch,
  Award,
  ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Progress } from '../../../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Separator } from '../../../components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '../../../components/ui/popover';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../components/ui/tooltip';
import { ScrollArea } from '../../../components/ui/scroll-area';
import { Textarea } from '../../../components/ui/textarea';
import { useAuth } from '../../../contexts/AuthContext';
import { useTrainingModule, useModuleContent, useUserProgress } from '../hooks/useTraining';
import { SidebarToggle } from '../../../core/components/layout/SidebarToggle';
import VideoPlayer from '../components/VideoPlayer';
import AssessmentViewer from '../components/AssessmentViewer';
import { VideoUploader, DiagramEditor, CertificateGenerator, PlaybookViewer } from '../components';
import type { TrainingModule, ModuleContent } from '../types';

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function ModuleDetailPage() {
  const { moduleId } = useParams<{ moduleId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeContent, setActiveContent] = useState<string | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [userNotes, setUserNotes] = useState('');
  const [isBookmarked, setIsBookmarked] = useState(false);
  
  // Hooks
  const { 
    data: module, 
    isLoading: moduleLoading, 
    error: moduleError 
  } = useTrainingModule(moduleId!);
  
  const { 
    data: contents, 
    isLoading: contentsLoading 
  } = useModuleContent(moduleId!);
  
  const { 
    data: userProgress, 
    updateProgress 
  } = useUserProgress();
  
  // Estados derivados
  const moduleProgress = userProgress?.find(p => p.module_id === moduleId);
  const completedContents = contents?.filter(c => 
    userProgress?.some(p => p.content_id === c.id && p.completed)
  ) || [];
  const progressPercentage = contents?.length ? 
    (completedContents.length / contents.length) * 100 : 0;
  
  // Handlers
  const handleStartModule = () => {
    if (contents && contents.length > 0) {
      const firstContent = contents.sort((a, b) => a.order - b.order)[0];
      setActiveContent(firstContent.id);
    }
  };
  
  const handleContentComplete = (contentId: string) => {
    updateProgress.mutate({
      contentId,
      completed: true,
      timeSpent: 0 // Será calculado pelo componente de conteúdo
    });
  };
  
  const handleBookmarkToggle = () => {
    setIsBookmarked(!isBookmarked);
    // Implementar salvamento do bookmark
  };
  
  if (moduleLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando módulo...</p>
        </div>
      </div>
    );
  }
  
  if (moduleError || !module) {
    return (
      <div className="text-center py-12">
        <XCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">
          Módulo não encontrado
        </h2>
        <p className="text-gray-600 mb-4">
          O módulo solicitado não existe ou você não tem permissão para acessá-lo.
        </p>
        <Button onClick={() => navigate('/training')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar ao Dashboard
        </Button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <SidebarToggle />
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/training')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{module.title}</h1>
            <div className="flex items-center space-x-4 mt-1">
              <Badge variant="outline">{module.category}</Badge>
              <Badge 
                variant={module.difficulty === 'beginner' ? 'default' : 
                        module.difficulty === 'intermediate' ? 'secondary' : 'destructive'}
              >
                {module.difficulty === 'beginner' ? 'Iniciante' :
                 module.difficulty === 'intermediate' ? 'Intermediário' : 'Avançado'}
              </Badge>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-1" />
                {module.estimated_duration} min
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={handleBookmarkToggle}
                >
                  {isBookmarked ? (
                    <BookmarkCheck className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isBookmarked ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <Button variant="ghost" size="sm">
            <Share2 className="h-4 w-4" />
          </Button>
          
          {user?.role === 'admin' && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => navigate(`/training/modules/${moduleId}/edit`)}
            >
              <Edit className="h-4 w-4" />
            </Button>
          )}
          
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-48" align="end">
              <div className="space-y-1">
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <Download className="h-4 w-4 mr-2" />
                  Baixar material
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <Flag className="h-4 w-4 mr-2" />
                  Reportar problema
                </Button>
                <Button variant="ghost" size="sm" className="w-full justify-start">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Deixar feedback
                </Button>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      
      {/* Progress Bar */}
      {moduleProgress && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Progresso do Módulo
              </span>
              <span className="text-sm text-gray-600">
                {completedContents.length} de {contents?.length || 0} concluídos
              </span>
            </div>
            <Progress value={progressPercentage} className="h-2" />
            <div className="flex items-center justify-between mt-2 text-xs text-gray-600">
              <span>{Math.round(progressPercentage)}% concluído</span>
              {moduleProgress.completed && (
                <div className="flex items-center text-green-600">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Módulo concluído
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      
      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Content Area */}
        <div className="lg:col-span-2 space-y-6">
          {activeContent ? (
            <ContentViewer 
              contentId={activeContent}
              onComplete={handleContentComplete}
              onClose={() => setActiveContent(null)}
            />
          ) : (
            <ModuleOverview 
              module={module}
              onStart={handleStartModule}
              progressPercentage={progressPercentage}
            />
          )}
        </div>
        
        {/* Sidebar */}
        <div className="space-y-6">
          {/* Module Info */}
          <ModuleInfoCard module={module} />
          
          {/* Content List */}
          <ContentListCard 
            contents={contents || []}
            userProgress={userProgress || []}
            activeContent={activeContent}
            onContentSelect={setActiveContent}
          />
          
          {/* Notes */}
          <NotesCard 
            notes={userNotes}
            onNotesChange={setUserNotes}
            show={showNotes}
            onToggle={() => setShowNotes(!showNotes)}
          />
        </div>
      </div>
    </div>
  );
}

// =====================================================
// COMPONENTE: VISÃO GERAL DO MÓDULO
// =====================================================

function ModuleOverview({ 
  module, 
  onStart, 
  progressPercentage 
}: {
  module: TrainingModule;
  onStart: () => void;
  progressPercentage: number;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl">{module.title}</CardTitle>
            <CardDescription className="mt-2">
              {module.description}
            </CardDescription>
          </div>
          
          {module.thumbnail_url && (
            <img 
              src={module.thumbnail_url} 
              alt={module.title}
              className="w-24 h-24 object-cover rounded-lg"
            />
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Objetivos de Aprendizagem */}
        {module.learning_objectives && module.learning_objectives.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <Target className="h-5 w-5 mr-2 text-blue-600" />
              Objetivos de Aprendizagem
            </h3>
            <ul className="space-y-2">
              {module.learning_objectives.map((objective, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <CheckCircle className="h-4 w-4 text-green-600 mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{objective}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Pré-requisitos */}
        {module.prerequisites && module.prerequisites.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-orange-600" />
              Pré-requisitos
            </h3>
            <ul className="space-y-2">
              {module.prerequisites.map((prerequisite, index) => (
                <li key={index} className="flex items-start space-x-2">
                  <div className="w-2 h-2 bg-orange-600 rounded-full mt-2 flex-shrink-0" />
                  <span className="text-sm text-gray-700">{prerequisite}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Tags */}
        {module.tags && module.tags.length > 0 && (
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Tags</h3>
            <div className="flex flex-wrap gap-2">
              {module.tags.map((tag, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          </div>
        )}
        
        {/* Action Button */}
        <div className="pt-4">
          <Button 
            onClick={onStart} 
            className="w-full" 
            size="lg"
          >
            <Play className="h-5 w-5 mr-2" />
            {progressPercentage > 0 ? 'Continuar Treinamento' : 'Iniciar Treinamento'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// =====================================================
// COMPONENTE: CARD DE INFORMAÇÕES
// =====================================================

function ModuleInfoCard({ module }: { module: TrainingModule }) {
  const stats = [
    {
      icon: Clock,
      label: 'Duração',
      value: `${module.estimated_duration} min`,
      color: 'text-blue-600'
    },
    {
      icon: Users,
      label: 'Participantes',
      value: '45', // Mock data
      color: 'text-green-600'
    },
    {
      icon: Star,
      label: 'Avaliação',
      value: '4.8/5', // Mock data
      color: 'text-yellow-600'
    },
    {
      icon: Trophy,
      label: 'Certificado',
      value: module.certificate_template ? 'Sim' : 'Não',
      color: 'text-purple-600'
    }
  ];
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Informações do Módulo</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="flex items-center space-x-3">
              <div className={`p-2 rounded-lg bg-gray-50`}>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="font-medium text-gray-900">{stat.value}</p>
              </div>
            </div>
          );
        })}
        
        <Separator />
        
        <div>
          <p className="text-sm text-gray-600 mb-2">Criado em</p>
          <p className="font-medium text-gray-900">
            {new Date(module.created_at).toLocaleDateString('pt-BR')}
          </p>
        </div>
        
        {module.updated_at !== module.created_at && (
          <div>
            <p className="text-sm text-gray-600 mb-2">Última atualização</p>
            <p className="font-medium text-gray-900">
              {new Date(module.updated_at).toLocaleDateString('pt-BR')}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =====================================================
// COMPONENTE: LISTA DE CONTEÚDO
// =====================================================

function ContentListCard({ 
  contents, 
  userProgress, 
  activeContent, 
  onContentSelect 
}: {
  contents: ModuleContent[];
  userProgress: { content_id: string; completed: boolean; progress_percentage?: number }[];
  activeContent: string | null;
  onContentSelect: (contentId: string) => void;
}) {
  const sortedContents = contents.sort((a, b) => a.order - b.order);
  
  const getContentIcon = (type: string) => {
    switch (type) {
      case 'video':
        return Video;
      case 'document':
        return FileText;
      case 'quiz':
        return HelpCircle;
      case 'interactive':
        return Zap;
      case 'video_upload':
        return Upload;
      case 'diagram':
        return GitBranch;
      case 'certificate':
        return Award;
      case 'playbook':
        return BookOpen;
      default:
        return BookOpen;
    }
  };
  
  const isContentCompleted = (contentId: string) => {
    return userProgress.some(p => p.content_id === contentId && p.completed);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Conteúdo do Módulo</CardTitle>
        <CardDescription>
          {contents.length} item{contents.length !== 1 ? 's' : ''} de conteúdo
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-80">
          <div className="space-y-2">
            {sortedContents.map((content, index) => {
              const Icon = getContentIcon(content.type);
              const isCompleted = isContentCompleted(content.id);
              const isActive = activeContent === content.id;
              
              return (
                <motion.div
                  key={content.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <button
                    onClick={() => onContentSelect(content.id)}
                    className={`w-full p-3 rounded-lg border text-left transition-colors ${
                      isActive 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-500 w-6">
                          {index + 1}
                        </span>
                        <Icon className={`h-4 w-4 ${
                          isCompleted ? 'text-green-600' : 'text-gray-600'
                        }`} />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <h4 className={`font-medium truncate ${
                          isCompleted ? 'text-green-900' : 'text-gray-900'
                        }`}>
                          {content.title}
                        </h4>
                        <div className="flex items-center space-x-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {content.type === 'video' ? 'Vídeo' :
                             content.type === 'document' ? 'Documento' :
                             content.type === 'quiz' ? 'Quiz' :
                             content.type === 'video_upload' ? 'Upload de Vídeo' :
                             content.type === 'diagram' ? 'Diagrama' :
                             content.type === 'certificate' ? 'Certificado' :
                             content.type === 'playbook' ? 'Playbook' : 'Interativo'}
                          </Badge>
                          {content.estimated_duration && (
                            <span className="text-xs text-gray-500">
                              {content.estimated_duration} min
                            </span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-shrink-0">
                        {isCompleted ? (
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </button>
                </motion.div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// =====================================================
// COMPONENTE: NOTAS
// =====================================================

function NotesCard({ 
  notes, 
  onNotesChange, 
  show, 
  onToggle 
}: {
  notes: string;
  onNotesChange: (notes: string) => void;
  show: boolean;
  onToggle: () => void;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Minhas Notas</CardTitle>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            {show ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      {show && (
        <CardContent>
          <Textarea
            placeholder="Adicione suas anotações sobre este módulo..."
            value={notes}
            onChange={(e) => onNotesChange(e.target.value)}
            className="min-h-[120px] resize-none"
          />
          <Button size="sm" className="mt-3 w-full">
            Salvar Notas
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

// =====================================================
// COMPONENTE: VISUALIZADOR DE CONTEÚDO
// =====================================================

function ContentViewer({ 
  contentId, 
  onComplete, 
  onClose 
}: {
  contentId: string;
  onComplete: (contentId: string) => void;
  onClose: () => void;
}) {
  // Mock content data - em produção, buscar do hook
  const content = {
    id: contentId,
    type: 'video',
    title: 'Introdução à Energia Solar',
    video_url: 'https://example.com/video.mp4'
  };
  
  const renderContentByType = () => {
    switch (content.type) {
      case 'video':
        return (
          <VideoPlayer 
            videoId={contentId}
            onComplete={() => onComplete(contentId)}
          />
        );
      
      case 'quiz':
        return (
          <AssessmentViewer 
            assessmentId={contentId}
            onComplete={() => onComplete(contentId)}
          />
        );
      
      case 'video_upload':
        return (
          <VideoUploader 
            onUploadComplete={(videoData) => {
              console.log('Vídeo enviado:', videoData);
              onComplete(contentId);
            }}
          />
        );
      
      case 'diagram':
        return (
          <DiagramEditor 
            diagramId={contentId}
            onSave={(diagramData) => {
              console.log('Diagrama salvo:', diagramData);
              onComplete(contentId);
            }}
          />
        );
      
      case 'certificate':
        return (
          <CertificateGenerator 
            moduleId={contentId}
            onGenerate={(certificateData) => {
              console.log('Certificado gerado:', certificateData);
              onComplete(contentId);
            }}
          />
        );
      
      case 'playbook':
        return (
          <PlaybookViewer 
            playbookId={contentId}
            onView={(playbookData) => {
              console.log('Playbook visualizado:', playbookData);
              onComplete(contentId);
            }}
          />
        );
      
      default:
        return (
          <div className="p-8 text-center">
            <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Tipo de conteúdo não suportado
            </h3>
            <p className="text-gray-600">
              O tipo de conteúdo "{content.type}" ainda não é suportado.
            </p>
          </div>
        );
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{content.title}</CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <XCircle className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {renderContentByType()}
      </CardContent>
    </Card>
  );
}

export default ModuleDetailPage;