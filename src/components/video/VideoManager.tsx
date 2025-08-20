// =====================================================================================
// GERENCIADOR DE VÍDEOS - SOLARA NOVA ENERGIA
// =====================================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Upload, 
  Play, 
  BarChart3, 
  Settings, 
  Search, 
  Filter,
  Grid,
  List,
  Plus,
  Eye,
  Download,
  Share2,
  Trash2,
  Edit,
  Lock,
  Unlock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { VideoUploader } from './VideoUploader';
import { AdvancedVideoPlayer } from './AdvancedVideoPlayer';
import { VideoAnalytics } from './VideoAnalytics';
import { 
  VideoMetadata, 
  VideoError,
  VideoProgress,
  VideoInteraction
} from '../../types/video';
import { videoUploadService } from '../../services/videoUploadService';
import { secureStreamingService } from '../../services/secureStreamingService';
import { supabase } from '../../integrations/supabase/client';
import { toast } from 'sonner';

interface VideoManagerProps {
  className?: string;
  mode?: 'upload' | 'library' | 'analytics';
  onModeChange?: (mode: 'upload' | 'library' | 'analytics') => void;
}

interface VideoWithPermissions extends VideoMetadata {
  canEdit: boolean;
  canDelete: boolean;
  canShare: boolean;
  isSecure: boolean;
}

export const VideoManager: React.FC<VideoManagerProps> = ({
  className = '',
  mode = 'library',
  onModeChange
}) => {
  const [currentMode, setCurrentMode] = useState(mode);
  const [videos, setVideos] = useState<VideoWithPermissions[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<VideoWithPermissions | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'processing' | 'completed' | 'error'>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [showUploader, setShowUploader] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);

  /**
   * Carregar usuário atual
   */
  useEffect(() => {
    const getCurrentUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);
    };
    getCurrentUser();
  }, []);

  /**
   * Carregar vídeos
   */
  const loadVideos = useCallback(async () => {
    try {
      setLoading(true);
      const videoList = await videoUploadService.getUserVideos(currentUser?.id);
      
      // Adicionar informações de permissão
      const videosWithPermissions: VideoWithPermissions[] = videoList.map(video => ({
        ...video,
        canEdit: video.uploadedBy === currentUser?.id,
        canDelete: video.uploadedBy === currentUser?.id,
        canShare: true,
        isSecure: !!video.streamingUrl
      }));
      
      setVideos(videosWithPermissions);
    } catch (error) {
      console.error('Erro ao carregar vídeos:', error);
      toast.error('Erro ao carregar vídeos');
    } finally {
      setLoading(false);
    }
  }, [currentUser?.id]);

  /**
   * Filtrar vídeos
   */
  const filteredVideos = videos.filter(video => {
    const matchesSearch = video.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         video.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = filterStatus === 'all' || video.status === filterStatus;
    
    return matchesSearch && matchesFilter;
  });

  /**
   * Manipular upload completo
   */
  const handleUploadComplete = useCallback((video: VideoMetadata) => {
    toast.success('Vídeo enviado com sucesso!');
    loadVideos();
  }, [loadVideos]);

  /**
   * Manipular erro de upload
   */
  const handleUploadError = useCallback((error: VideoError) => {
    toast.error(`Erro no upload: ${error.message}`);
  }, []);

  /**
   * Reproduzir vídeo
   */
  const playVideo = useCallback(async (video: VideoWithPermissions) => {
    try {
      if (video.isSecure && currentUser) {
        // Gerar URL segura
        const secureUrl = await secureStreamingService.getSecureStreamingUrl(
          video.id,
          currentUser.id,
          '720p',
          `${currentUser.email} - ${new Date().toLocaleDateString()}`
        );
        
        setSelectedVideo({
          ...video,
          streamingUrl: secureUrl
        });
      } else {
        setSelectedVideo(video);
      }
      
      setShowPlayer(true);
    } catch (error) {
      toast.error('Erro ao carregar vídeo');
    }
  }, [currentUser]);

  /**
   * Deletar vídeo
   */
  const deleteVideo = useCallback(async (videoId: string) => {
    if (!confirm('Tem certeza que deseja deletar este vídeo?')) {
      return;
    }
    
    try {
      await videoUploadService.deleteVideo(videoId);
      toast.success('Vídeo deletado com sucesso');
      loadVideos();
    } catch (error) {
      toast.error('Erro ao deletar vídeo');
    }
  }, [loadVideos]);

  /**
   * Compartilhar vídeo
   */
  const shareVideo = useCallback(async (video: VideoWithPermissions) => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: video.title,
          text: video.description,
          url: window.location.href
        });
      } else {
        // Fallback: copiar para clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast.success('Link copiado para a área de transferência');
      }
    } catch (error) {
      toast.error('Erro ao compartilhar vídeo');
    }
  }, []);

  /**
   * Manipular progresso do vídeo
   */
  const handleVideoProgress = useCallback((progress: VideoProgress) => {
    // Salvar progresso no banco se necessário
    console.log('Progresso do vídeo:', progress);
  }, []);

  /**
   * Manipular interação do vídeo
   */
  const handleVideoInteraction = useCallback((interaction: VideoInteraction) => {
    // Registrar interação para analytics
    console.log('Interação do vídeo:', interaction);
  }, []);

  /**
   * Formatar duração
   */
  const formatDuration = useCallback((seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  /**
   * Formatar tamanho do arquivo
   */
  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  /**
   * Obter cor do status
   */
  const getStatusColor = useCallback((status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20';
      case 'processing':
        return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20';
      case 'uploading':
        return 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/20';
      case 'error':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20';
      default:
        return 'text-gray-600 bg-gray-100 dark:text-gray-400 dark:bg-gray-900/20';
    }
  }, []);

  /**
   * Alterar modo
   */
  const changeMode = useCallback((newMode: 'upload' | 'library' | 'analytics') => {
    setCurrentMode(newMode);
    if (onModeChange) {
      onModeChange(newMode);
    }
  }, [onModeChange]);

  useEffect(() => {
    if (currentUser) {
      loadVideos();
    }
  }, [currentUser, loadVideos]);

  return (
    <div className={`w-full ${className}`}>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Gerenciador de Vídeos
          </h1>
          <button
            onClick={() => setShowUploader(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Vídeo</span>
          </button>
        </div>
        
        {/* Navegação */}
        <div className="flex items-center space-x-1 bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {[
            { key: 'library', label: 'Biblioteca', icon: Grid },
            { key: 'upload', label: 'Upload', icon: Upload },
            { key: 'analytics', label: 'Analytics', icon: BarChart3 }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => changeMode(key as 'upload' | 'library' | 'analytics')}
              className={`
                flex items-center space-x-2 px-4 py-2 rounded-md transition-colors
                ${currentMode === key
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Conteúdo */}
      <AnimatePresence mode="wait">
        {currentMode === 'library' && (
          <motion.div
            key="library"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            {/* Filtros */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="text"
                    placeholder="Buscar vídeos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option value="all">Todos os status</option>
                  <option value="completed">Concluído</option>
                  <option value="processing">Processando</option>
                  <option value="uploading">Enviando</option>
                  <option value="error">Erro</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${
                    viewMode === 'list'
                      ? 'bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400'
                      : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Lista de vídeos */}
            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              </div>
            ) : filteredVideos.length === 0 ? (
              <div className="text-center py-12">
                <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                  Nenhum vídeo encontrado
                </h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {searchTerm || filterStatus !== 'all' 
                    ? 'Tente ajustar os filtros de busca'
                    : 'Comece enviando seu primeiro vídeo'
                  }
                </p>
                <button
                  onClick={() => setShowUploader(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Enviar Vídeo
                </button>
              </div>
            ) : (
              <div className={`
                ${viewMode === 'grid' 
                  ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
                  : 'space-y-4'
                }
              `}>
                {filteredVideos.map((video) => (
                  <motion.div
                    key={video.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className={`
                      bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow
                      ${viewMode === 'list' ? 'flex items-center p-4' : ''}
                    `}
                  >
                    {viewMode === 'grid' ? (
                      <>
                        {/* Thumbnail */}
                        <div className="relative aspect-video bg-gray-100 dark:bg-gray-700">
                          {video.thumbnails?.[0] ? (
                            <img 
                              src={video.thumbnails[0]} 
                              alt={video.title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="w-12 h-12 text-gray-400" />
                            </div>
                          )}
                          
                          {/* Status badge */}
                          <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(video.status)}`}>
                            {video.status === 'completed' && 'Concluído'}
                            {video.status === 'processing' && 'Processando'}
                            {video.status === 'uploading' && 'Enviando'}
                            {video.status === 'error' && 'Erro'}
                          </div>
                          
                          {/* Security badge */}
                          {video.isSecure && (
                            <div className="absolute top-2 left-2 p-1 bg-black/50 rounded">
                              <Lock className="w-3 h-3 text-white" />
                            </div>
                          )}
                          
                          {/* Play overlay */}
                          <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 hover:opacity-100">
                            <button
                              onClick={() => playVideo(video)}
                              className="p-3 bg-white/90 rounded-full hover:bg-white transition-colors"
                            >
                              <Play className="w-6 h-6 text-gray-900" />
                            </button>
                          </div>
                        </div>
                        
                        {/* Informações */}
                        <div className="p-4">
                          <h3 className="font-medium text-gray-900 dark:text-white mb-1 truncate">
                            {video.title}
                          </h3>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 line-clamp-2">
                            {video.description}
                          </p>
                          <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-3">
                            <span>{formatDuration(video.duration)}</span>
                            <span>{formatFileSize(video.size)}</span>
                          </div>
                          
                          {/* Ações */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => playVideo(video)}
                                className="p-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                title="Reproduzir"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => shareVideo(video)}
                                className="p-1 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                                title="Compartilhar"
                              >
                                <Share2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedVideo(video);
                                  setShowAnalytics(true);
                                }}
                                className="p-1 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                                title="Analytics"
                              >
                                <BarChart3 className="w-4 h-4" />
                              </button>
                            </div>
                            
                            {video.canDelete && (
                              <button
                                onClick={() => deleteVideo(video.id)}
                                className="p-1 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                title="Deletar"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        {/* Thumbnail (list view) */}
                        <div className="w-24 h-16 bg-gray-100 dark:bg-gray-700 rounded flex-shrink-0 mr-4">
                          {video.thumbnails?.[0] ? (
                            <img 
                              src={video.thumbnails[0]} 
                              alt={video.title}
                              className="w-full h-full object-cover rounded"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Play className="w-6 h-6 text-gray-400" />
                            </div>
                          )}
                        </div>
                        
                        {/* Informações (list view) */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="font-medium text-gray-900 dark:text-white truncate">
                              {video.title}
                            </h3>
                            <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(video.status)}`}>
                              {video.status === 'completed' && 'Concluído'}
                              {video.status === 'processing' && 'Processando'}
                              {video.status === 'uploading' && 'Enviando'}
                              {video.status === 'error' && 'Erro'}
                            </div>
                          </div>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mb-2 truncate">
                            {video.description}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-4 text-xs text-gray-500 dark:text-gray-400">
                              <span>{formatDuration(video.duration)}</span>
                              <span>{formatFileSize(video.size)}</span>
                              <span>{video.uploadedAt.toLocaleDateString('pt-BR')}</span>
                            </div>
                            
                            {/* Ações (list view) */}
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => playVideo(video)}
                                className="p-1 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                title="Reproduzir"
                              >
                                <Play className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => shareVideo(video)}
                                className="p-1 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                                title="Compartilhar"
                              >
                                <Share2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedVideo(video);
                                  setShowAnalytics(true);
                                }}
                                className="p-1 text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                                title="Analytics"
                              >
                                <BarChart3 className="w-4 h-4" />
                              </button>
                              {video.canDelete && (
                                <button
                                  onClick={() => deleteVideo(video.id)}
                                  className="p-1 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                  title="Deletar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {currentMode === 'upload' && (
          <motion.div
            key="upload"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <VideoUploader
              onUploadComplete={handleUploadComplete}
              onUploadError={handleUploadError}
              maxFiles={10}
            />
          </motion.div>
        )}

        {currentMode === 'analytics' && (
          <motion.div
            key="analytics"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <VideoAnalytics />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal do Uploader */}
      <AnimatePresence>
        {showUploader && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowUploader(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Upload de Vídeos
                </h2>
                <button
                  onClick={() => setShowUploader(false)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  ×
                </button>
              </div>
              <VideoUploader
                onUploadComplete={(video) => {
                  handleUploadComplete(video);
                  setShowUploader(false);
                }}
                onUploadError={handleUploadError}
                maxFiles={5}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal do Player */}
      <AnimatePresence>
        {showPlayer && selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4"
            onClick={() => setShowPlayer(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="w-full max-w-6xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xl font-bold text-white">
                  {selectedVideo.title}
                </h2>
                <button
                  onClick={() => setShowPlayer(false)}
                  className="text-white hover:text-gray-300 text-2xl"
                >
                  ×
                </button>
              </div>
              <AdvancedVideoPlayer
                video={selectedVideo}
                onProgress={handleVideoProgress}
                onInteraction={handleVideoInteraction}
                onComplete={() => {
                  toast.success('Vídeo concluído!');
                  setShowPlayer(false);
                }}
                watermarkText={currentUser?.email}
                autoPlay
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal do Analytics */}
      <AnimatePresence>
        {showAnalytics && selectedVideo && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowAnalytics(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                  Analytics - {selectedVideo.title}
                </h2>
                <button
                  onClick={() => setShowAnalytics(false)}
                  className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  ×
                </button>
              </div>
              <VideoAnalytics videoId={selectedVideo.id} />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default VideoManager;