// components/TrainingDashboard.tsx
import React, { useState, useEffect } from 'react';
import {
  Upload,
  Play,
  Grid3X3,
  List,
  Search,
  Filter,
  Plus,
  BookOpen,
  Video,
  FileText,
  BarChart3,
  Settings,
  Users,
  Clock,
  Star,
  TrendingUp,
  Award,
  Target,
  Calendar,
  Download,
  Share2,
} from 'lucide-react';
import {
  VideoMetadata,
  VideoCategory,
  VideoVisibility,
  VideoComment,
  VideoNote,
  VideoWatermarkSettings,
  VideoSecuritySettings,
  DEFAULT_WATERMARK_SETTINGS,
  DEFAULT_SECURITY_SETTINGS,
} from '../types/video';
import { VideoUpload } from './video/VideoUpload';
import { VideoList } from './video/VideoList';
import { VideoCard } from './video/VideoCard';
import { AdvancedVideoPlayer } from './video/AdvancedVideoPlayer';
import { useVideoUpload } from '../hooks/useVideoUpload';
import { cn } from '@/lib/utils';
import { Button } from '@/shared/ui/button';
import { Input } from '@/shared/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/shared/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/shared/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/shared/ui/sheet';
import { Progress } from '@/shared/ui/progress';
import { Separator } from '@/shared/ui/separator';
import { toast } from 'sonner';

interface TrainingDashboardProps {
  className?: string;
}

interface TrainingStats {
  totalVideos: number;
  totalWatchTime: number;
  completedCourses: number;
  averageRating: number;
  recentActivity: {
    uploads: number;
    views: number;
    comments: number;
  };
}

interface CourseProgress {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  progress: number;
  totalVideos: number;
  completedVideos: number;
  estimatedTime: number;
  category: VideoCategory;
  instructor: string;
  rating: number;
  lastAccessed: Date;
}

// Mock data - Em produção, isso viria de uma API
const mockVideos: VideoMetadata[] = [
  {
    id: '1',
    title: 'Introdução à Energia Solar',
    description: 'Conceitos básicos sobre energia solar fotovoltaica',
    thumbnailUrl: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=solar%20panels%20on%20roof%20modern%20house%20blue%20sky&image_size=landscape_16_9',
    streamUrl: '/videos/intro-solar.mp4',
    duration: 1800, // 30 minutes
    fileSize: 524288000, // 500MB
    category: 'tutorial',
    visibility: 'public',
    tags: ['energia solar', 'fotovoltaica', 'sustentabilidade'],
    author: {
      id: 'instructor-1',
      name: 'Dr. Carlos Silva',
      avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20instructor%20portrait%20solar%20energy%20expert&image_size=square',
    },
    uploadedAt: new Date('2024-01-15'),
    qualities: ['720p', '1080p', '4k'],
    analytics: {
      views: 1250,
      likes: 89,
      dislikes: 3,
      comments: 24,
      shares: 15,
      averageWatchTime: 1440, // 24 minutes
      completionRate: 0.8,
      engagementRate: 0.75,
    },
    processingStatus: 'completed',
  },
  {
    id: '2',
    title: 'Dimensionamento de Sistemas Fotovoltaicos',
    description: 'Como calcular e dimensionar sistemas solares residenciais',
    thumbnailUrl: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=solar%20system%20calculation%20blueprint%20technical%20drawing&image_size=landscape_16_9',
    streamUrl: '/videos/dimensionamento.mp4',
    duration: 2700, // 45 minutes
    fileSize: 786432000, // 750MB
    category: 'course',
    visibility: 'public',
    tags: ['dimensionamento', 'cálculo', 'projeto'],
    author: {
      id: 'instructor-2',
      name: 'Eng. Maria Santos',
      avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=female%20engineer%20solar%20energy%20professional%20portrait&image_size=square',
    },
    uploadedAt: new Date('2024-01-20'),
    qualities: ['720p', '1080p'],
    analytics: {
      views: 890,
      likes: 67,
      dislikes: 2,
      comments: 18,
      shares: 12,
      averageWatchTime: 2160, // 36 minutes
      completionRate: 0.85,
      engagementRate: 0.82,
    },
    processingStatus: 'completed',
  },
  {
    id: '3',
    title: 'Instalação e Manutenção de Painéis Solares',
    description: 'Procedimentos práticos para instalação segura',
    thumbnailUrl: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=solar%20panel%20installation%20workers%20on%20roof%20safety%20equipment&image_size=landscape_16_9',
    streamUrl: '/videos/instalacao.mp4',
    duration: 3600, // 60 minutes
    fileSize: 1073741824, // 1GB
    category: 'demo',
    visibility: 'public',
    tags: ['instalação', 'manutenção', 'segurança'],
    author: {
      id: 'instructor-1',
      name: 'Dr. Carlos Silva',
      avatar: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=professional%20instructor%20portrait%20solar%20energy%20expert&image_size=square',
    },
    uploadedAt: new Date('2024-01-25'),
    qualities: ['720p', '1080p', '4k'],
    analytics: {
      views: 2100,
      likes: 156,
      dislikes: 8,
      comments: 42,
      shares: 28,
      averageWatchTime: 2880, // 48 minutes
      completionRate: 0.75,
      engagementRate: 0.88,
    },
    processingStatus: 'completed',
  },
];

const mockCourses: CourseProgress[] = [
  {
    id: 'course-1',
    title: 'Fundamentos da Energia Solar',
    description: 'Curso completo sobre os princípios básicos da energia solar',
    thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=solar%20energy%20course%20cover%20educational%20modern&image_size=landscape_4_3',
    progress: 65,
    totalVideos: 12,
    completedVideos: 8,
    estimatedTime: 480, // 8 hours
    category: 'course',
    instructor: 'Dr. Carlos Silva',
    rating: 4.8,
    lastAccessed: new Date('2024-01-28'),
  },
  {
    id: 'course-2',
    title: 'Projeto e Instalação de Sistemas Fotovoltaicos',
    description: 'Aprenda a projetar e instalar sistemas solares completos',
    thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=solar%20installation%20project%20technical%20course&image_size=landscape_4_3',
    progress: 30,
    totalVideos: 18,
    completedVideos: 5,
    estimatedTime: 720, // 12 hours
    category: 'course',
    instructor: 'Eng. Maria Santos',
    rating: 4.9,
    lastAccessed: new Date('2024-01-26'),
  },
  {
    id: 'course-3',
    title: 'Manutenção e Troubleshooting',
    description: 'Técnicas avançadas de manutenção e resolução de problemas',
    thumbnail: 'https://trae-api-us.mchost.guru/api/ide/v1/text_to_image?prompt=solar%20maintenance%20troubleshooting%20technical%20course&image_size=landscape_4_3',
    progress: 0,
    totalVideos: 15,
    completedVideos: 0,
    estimatedTime: 600, // 10 hours
    category: 'course',
    instructor: 'Téc. João Oliveira',
    rating: 4.7,
    lastAccessed: new Date('2024-01-20'),
  },
];

const mockStats: TrainingStats = {
  totalVideos: 45,
  totalWatchTime: 28800, // 8 hours
  completedCourses: 3,
  averageRating: 4.8,
  recentActivity: {
    uploads: 5,
    views: 1250,
    comments: 89,
  },
};

export const TrainingDashboard: React.FC<TrainingDashboardProps> = ({ className }) => {
  const [videos, setVideos] = useState<VideoMetadata[]>(mockVideos);
  const [courses, setCourses] = useState<CourseProgress[]>(mockCourses);
  const [stats, setStats] = useState<TrainingStats>(mockStats);
  const [selectedVideo, setSelectedVideo] = useState<VideoMetadata | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<VideoCategory | 'all'>('all');
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showPlayerDialog, setShowPlayerDialog] = useState(false);
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [notes, setNotes] = useState<VideoNote[]>([]);

  const {
    files: uploadFiles,
    isUploading,
    stats: uploadStats,
    addFiles,
    startAllUploads,
    removeAllFiles,
  } = useVideoUpload({
    maxFiles: 5,
    allowMultiple: true,
    autoStart: false,
    onUploadComplete: (metadata) => {
      setVideos(prev => [...prev, metadata]);
      toast.success('Vídeo enviado com sucesso!');
    },
    onUploadError: (error) => {
      toast.error(`Erro no upload: ${error}`);
    },
  });

  // Filter videos based on search and category
  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         video.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         video.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = categoryFilter === 'all' || video.category === categoryFilter;
    
    return matchesSearch && matchesCategory;
  });

  // Handle video actions
  const handleVideoPlay = (video: VideoMetadata) => {
    setSelectedVideo(video);
    setShowPlayerDialog(true);
  };

  const handleVideoEdit = (video: VideoMetadata) => {
    toast.info('Funcionalidade de edição em desenvolvimento');
  };

  const handleVideoDelete = (video: VideoMetadata) => {
    setVideos(prev => prev.filter(v => v.id !== video.id));
    toast.success('Vídeo removido com sucesso');
  };

  const handleVideoDownload = (video: VideoMetadata) => {
    if (video.downloadUrl) {
      const link = document.createElement('a');
      link.href = video.downloadUrl;
      link.download = video.title;
      link.click();
      toast.success('Download iniciado');
    } else {
      toast.error('Download não disponível para este vídeo');
    }
  };

  const handleVideoShare = (video: VideoMetadata) => {
    const shareUrl = `${window.location.origin}/training/video/${video.id}`;
    if (navigator.share) {
      navigator.share({
        title: video.title,
        text: video.description,
        url: shareUrl,
      });
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success('Link copiado para a área de transferência');
    }
  };

  const handleCommentAdd = (comment: Omit<VideoComment, 'id' | 'createdAt'>) => {
    const newComment: VideoComment = {
      ...comment,
      id: `comment-${Date.now()}`,
      createdAt: new Date(),
    };
    setComments(prev => [...prev, newComment]);
  };

  const handleNoteAdd = (note: Omit<VideoNote, 'id' | 'createdAt'>) => {
    const newNote: VideoNote = {
      ...note,
      id: `note-${Date.now()}`,
      createdAt: new Date(),
    };
    setNotes(prev => [...prev, newNote]);
  };

  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Treinamentos</h1>
          <p className="text-muted-foreground">
            Gerencie e assista aos conteúdos de treinamento em energia solar
          </p>
        </div>
        
        <div className="flex items-center space-x-2">
          <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
            <DialogTrigger asChild>
              <Button>
                <Upload className="h-4 w-4 mr-2" />
                Enviar Vídeo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Enviar Novo Vídeo</DialogTitle>
              </DialogHeader>
              <VideoUpload
                onUploadComplete={(metadata) => {
                  setVideos(prev => [...prev, metadata]);
                  setShowUploadDialog(false);
                }}
                maxFiles={5}
                allowMultiple={true}
                showAdvancedSettings={true}
              />
            </DialogContent>
          </Dialog>
          
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Configurações
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Video className="h-5 w-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total de Vídeos</p>
                <p className="text-2xl font-bold">{stats.totalVideos}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Clock className="h-5 w-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Tempo Assistido</p>
                <p className="text-2xl font-bold">{formatDuration(stats.totalWatchTime)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Award className="h-5 w-5 text-yellow-500" />
              <div>
                <p className="text-sm text-muted-foreground">Cursos Concluídos</p>
                <p className="text-2xl font-bold">{stats.completedCourses}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Star className="h-5 w-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Avaliação Média</p>
                <p className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="videos" className="space-y-6">
        <TabsList>
          <TabsTrigger value="videos">Vídeos</TabsTrigger>
          <TabsTrigger value="courses">Cursos</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>
        
        <TabsContent value="videos" className="space-y-4">
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar vídeos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value as VideoCategory | 'all')}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as categorias</SelectItem>
                <SelectItem value="tutorial">Tutorial</SelectItem>
                <SelectItem value="course">Curso</SelectItem>
                <SelectItem value="demo">Demo</SelectItem>
                <SelectItem value="webinar">Webinar</SelectItem>
                <SelectItem value="presentation">Apresentação</SelectItem>
              </SelectContent>
            </Select>
            
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'grid' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('grid')}
              >
                <Grid3X3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Video List */}
          <VideoList
            videos={filteredVideos}
            variant={viewMode}
            onVideoPlay={handleVideoPlay}
            onVideoEdit={handleVideoEdit}
            onVideoDelete={handleVideoDelete}
            onVideoDownload={handleVideoDownload}
            onVideoShare={handleVideoShare}
            showStats={true}
            showActions={true}
            className="min-h-[400px]"
          />
        </TabsContent>
        
        <TabsContent value="courses" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((course) => (
              <Card key={course.id} className="overflow-hidden">
                <div className="aspect-video relative">
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                    <Button size="lg" className="rounded-full">
                      <Play className="h-6 w-6 ml-1" />
                    </Button>
                  </div>
                </div>
                
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold line-clamp-1">{course.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {course.description}
                      </p>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">{course.instructor}</span>
                      <div className="flex items-center space-x-1">
                        <Star className="h-3 w-3 text-yellow-500 fill-current" />
                        <span>{course.rating}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Progresso</span>
                        <span>{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} className="h-2" />
                      <div className="flex justify-between text-xs text-muted-foreground">
                        <span>{course.completedVideos}/{course.totalVideos} vídeos</span>
                        <span>{formatDuration(course.estimatedTime)}</span>
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <Button className="flex-1">
                        {course.progress > 0 ? 'Continuar' : 'Iniciar'}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Bookmark className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5" />
                  <span>Atividade Recente</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Uploads</span>
                  <span className="font-medium">{stats.recentActivity.uploads}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Visualizações</span>
                  <span className="font-medium">{stats.recentActivity.views.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Comentários</span>
                  <span className="font-medium">{stats.recentActivity.comments}</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Engajamento</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Taxa de Conclusão</span>
                    <span>78%</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Tempo Médio de Visualização</span>
                    <span>85%</span>
                  </div>
                  <Progress value={85} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Taxa de Interação</span>
                    <span>92%</span>
                  </div>
                  <Progress value={92} className="h-2" />
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Target className="h-5 w-5" />
                  <span>Metas</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Vídeos este mês</span>
                    <span>8/10</span>
                  </div>
                  <Progress value={80} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Horas de conteúdo</span>
                    <span>12/15</span>
                  </div>
                  <Progress value={80} className="h-2" />
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Cursos concluídos</span>
                    <span>3/5</span>
                  </div>
                  <Progress value={60} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Video Player Dialog */}
      <Dialog open={showPlayerDialog} onOpenChange={setShowPlayerDialog}>
        <DialogContent className="max-w-6xl max-h-[90vh] p-0">
          {selectedVideo && (
            <AdvancedVideoPlayer
              video={selectedVideo}
              autoPlay={true}
              watermark={{
                ...DEFAULT_WATERMARK_SETTINGS,
                enabled: true,
                text: 'Solara Nova Energia',
                position: 'bottom-right',
              }}
              security={{
                ...DEFAULT_SECURITY_SETTINGS,
                preventDownload: true,
                enableDRM: false,
              }}
              comments={comments}
              notes={notes}
              onCommentAdd={handleCommentAdd}
              onNoteAdd={handleNoteAdd}
              allowDownload={false}
              allowSharing={true}
              showComments={true}
              showNotes={true}
              showAnalytics={true}
              className="rounded-lg"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TrainingDashboard;