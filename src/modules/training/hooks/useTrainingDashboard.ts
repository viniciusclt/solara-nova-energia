// hooks/useTrainingDashboard.ts
import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  VideoMetadata,
  VideoCategory,
  VideoComment,
  VideoNote,
  VideoAnalytics,
  VideoSearchFilters,
  VideoSortBy,
  VideoSearchOrder,
} from '../types/video';
import { VideoUploadService } from '../services/videoUploadService';
import { toast } from 'sonner';

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

interface UseTrainingDashboardOptions {
  autoRefresh?: boolean;
  refreshInterval?: number;
  enableAnalytics?: boolean;
  enableOfflineMode?: boolean;
}

interface UseTrainingDashboardReturn {
  // Data
  videos: VideoMetadata[];
  courses: CourseProgress[];
  stats: TrainingStats;
  comments: VideoComment[];
  notes: VideoNote[];
  
  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  isUploadingVideo: boolean;
  
  // Search and filters
  searchQuery: string;
  categoryFilter: VideoCategory | 'all';
  sortBy: VideoSortBy;
  sortOrder: VideoSearchOrder;
  filteredVideos: VideoMetadata[];
  
  // Actions
  setSearchQuery: (query: string) => void;
  setCategoryFilter: (category: VideoCategory | 'all') => void;
  setSortBy: (sortBy: VideoSortBy) => void;
  setSortOrder: (order: VideoSearchOrder) => void;
  
  // Video management
  uploadVideo: (file: File, metadata?: Partial<VideoMetadata>) => Promise<VideoMetadata>;
  updateVideo: (id: string, updates: Partial<VideoMetadata>) => Promise<void>;
  deleteVideo: (id: string) => Promise<void>;
  favoriteVideo: (id: string) => Promise<void>;
  unfavoriteVideo: (id: string) => Promise<void>;
  
  // Comments and notes
  addComment: (videoId: string, comment: Omit<VideoComment, 'id' | 'createdAt'>) => Promise<void>;
  updateComment: (commentId: string, updates: Partial<VideoComment>) => Promise<void>;
  deleteComment: (commentId: string) => Promise<void>;
  addNote: (videoId: string, note: Omit<VideoNote, 'id' | 'createdAt'>) => Promise<void>;
  updateNote: (noteId: string, updates: Partial<VideoNote>) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  
  // Analytics
  trackVideoView: (videoId: string, watchTime: number) => Promise<void>;
  trackVideoInteraction: (videoId: string, interaction: string) => Promise<void>;
  getVideoAnalytics: (videoId: string) => Promise<VideoAnalytics>;
  
  // Course management
  enrollInCourse: (courseId: string) => Promise<void>;
  updateCourseProgress: (courseId: string, progress: number) => Promise<void>;
  completeCourse: (courseId: string) => Promise<void>;
  
  // Utility functions
  refreshData: () => Promise<void>;
  exportData: (format: 'json' | 'csv' | 'xlsx') => Promise<void>;
  clearCache: () => void;
}

const STORAGE_KEYS = {
  VIDEOS: 'training_videos',
  COURSES: 'training_courses',
  STATS: 'training_stats',
  COMMENTS: 'training_comments',
  NOTES: 'training_notes',
  FILTERS: 'training_filters',
} as const;

export const useTrainingDashboard = (options: UseTrainingDashboardOptions = {}): UseTrainingDashboardReturn => {
  const {
    autoRefresh = false,
    refreshInterval = 30000, // 30 seconds
    enableAnalytics = true,
    enableOfflineMode = true,
  } = options;

  // State
  const [videos, setVideos] = useState<VideoMetadata[]>([]);
  const [courses, setCourses] = useState<CourseProgress[]>([]);
  const [stats, setStats] = useState<TrainingStats>({
    totalVideos: 0,
    totalWatchTime: 0,
    completedCourses: 0,
    averageRating: 0,
    recentActivity: {
      uploads: 0,
      views: 0,
      comments: 0,
    },
  });
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [notes, setNotes] = useState<VideoNote[]>([]);
  
  // Loading states
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  
  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<VideoCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<VideoSortBy>('uploadDate');
  const [sortOrder, setSortOrder] = useState<VideoSearchOrder>('desc');
  
  // Services
  const uploadService = useMemo(() => new VideoUploadService(), []);

  // Load data from localStorage if offline mode is enabled
  const loadFromStorage = useCallback(() => {
    if (!enableOfflineMode) return;
    
    try {
      const storedVideos = localStorage.getItem(STORAGE_KEYS.VIDEOS);
      const storedCourses = localStorage.getItem(STORAGE_KEYS.COURSES);
      const storedStats = localStorage.getItem(STORAGE_KEYS.STATS);
      const storedComments = localStorage.getItem(STORAGE_KEYS.COMMENTS);
      const storedNotes = localStorage.getItem(STORAGE_KEYS.NOTES);
      const storedFilters = localStorage.getItem(STORAGE_KEYS.FILTERS);
      
      if (storedVideos) setVideos(JSON.parse(storedVideos));
      if (storedCourses) setCourses(JSON.parse(storedCourses));
      if (storedStats) setStats(JSON.parse(storedStats));
      if (storedComments) setComments(JSON.parse(storedComments));
      if (storedNotes) setNotes(JSON.parse(storedNotes));
      
      if (storedFilters) {
        const filters = JSON.parse(storedFilters);
        setSearchQuery(filters.searchQuery || '');
        setCategoryFilter(filters.categoryFilter || 'all');
        setSortBy(filters.sortBy || 'uploadDate');
        setSortOrder(filters.sortOrder || 'desc');
      }
    } catch (error) {
      console.error('Error loading data from storage:', error);
    }
  }, [enableOfflineMode]);

  // Save data to localStorage
  const saveToStorage = useCallback((key: string, data: unknown) => {
    if (!enableOfflineMode) return;
    
    try {
      localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
      console.error('Error saving data to storage:', error);
    }
  }, [enableOfflineMode]);

  // Fetch data from API
  const fetchData = useCallback(async () => {
    try {
      // In a real implementation, these would be API calls
      // For now, we'll use mock data or existing data
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock data would be fetched here
      // setVideos(await api.getVideos());
      // setCourses(await api.getCourses());
      // setStats(await api.getStats());
      
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    }
  }, []);

  // Refresh data
  const refreshData = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchData();
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchData]);

  // Filter videos based on search and category
  const filteredVideos = useMemo(() => {
    const filtered = videos.filter(video => {
      const matchesSearch = searchQuery === '' || 
        video.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        video.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (video.tags && video.tags.some(tag => tag?.toLowerCase().includes(searchQuery.toLowerCase())));
      
      const matchesCategory = categoryFilter === 'all' || video.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    });

    // Sort videos
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'uploadDate':
          comparison = new Date(a.uploadedAt).getTime() - new Date(b.uploadedAt).getTime();
          break;
        case 'duration':
          comparison = a.duration - b.duration;
          break;
        case 'views':
          comparison = (a.analytics?.views || 0) - (b.analytics?.views || 0);
          break;
        case 'rating': {
          const aRating = a.analytics ? (a.analytics.likes / (a.analytics.likes + a.analytics.dislikes)) : 0;
          const bRating = b.analytics ? (b.analytics.likes / (b.analytics.likes + b.analytics.dislikes)) : 0;
          comparison = aRating - bRating;
          break;
        }
        default:
          comparison = 0;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [videos, searchQuery, categoryFilter, sortBy, sortOrder]);

  // Video management functions
  const uploadVideo = useCallback(async (file: File, metadata?: Partial<VideoMetadata>): Promise<VideoMetadata> => {
    setIsUploadingVideo(true);
    try {
      const uploadedVideo = await uploadService.uploadVideo(file, {
        title: metadata?.title || file.name,
        description: metadata?.description || '',
        category: metadata?.category || 'tutorial',
        visibility: metadata?.visibility || 'public',
        tags: metadata?.tags || [],
        ...metadata,
      });
      
      setVideos(prev => {
        const updated = [...prev, uploadedVideo];
        saveToStorage(STORAGE_KEYS.VIDEOS, updated);
        return updated;
      });
      
      // Update stats
      setStats(prev => {
        const updated = {
          ...prev,
          totalVideos: prev.totalVideos + 1,
          recentActivity: {
            ...prev.recentActivity,
            uploads: prev.recentActivity.uploads + 1,
          },
        };
        saveToStorage(STORAGE_KEYS.STATS, updated);
        return updated;
      });
      
      toast.success('Vídeo enviado com sucesso!');
      return uploadedVideo;
    } catch (error) {
      console.error('Error uploading video:', error);
      toast.error('Erro ao enviar vídeo');
      throw error;
    } finally {
      setIsUploadingVideo(false);
    }
  }, [uploadService, saveToStorage]);

  const updateVideo = useCallback(async (id: string, updates: Partial<VideoMetadata>): Promise<void> => {
    try {
      // In a real implementation, this would be an API call
      // await api.updateVideo(id, updates);
      
      setVideos(prev => {
        const updated = prev.map(video => 
          video.id === id ? { ...video, ...updates } : video
        );
        saveToStorage(STORAGE_KEYS.VIDEOS, updated);
        return updated;
      });
      
      toast.success('Vídeo atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating video:', error);
      toast.error('Erro ao atualizar vídeo');
      throw error;
    }
  }, [saveToStorage]);

  const deleteVideo = useCallback(async (id: string): Promise<void> => {
    try {
      // In a real implementation, this would be an API call
      // await api.deleteVideo(id);
      
      setVideos(prev => {
        const updated = prev.filter(video => video.id !== id);
        saveToStorage(STORAGE_KEYS.VIDEOS, updated);
        return updated;
      });
      
      // Update stats
      setStats(prev => {
        const updated = {
          ...prev,
          totalVideos: Math.max(0, prev.totalVideos - 1),
        };
        saveToStorage(STORAGE_KEYS.STATS, updated);
        return updated;
      });
      
      toast.success('Vídeo removido com sucesso!');
    } catch (error) {
      console.error('Error deleting video:', error);
      toast.error('Erro ao remover vídeo');
      throw error;
    }
  }, [saveToStorage]);

  const favoriteVideo = useCallback(async (id: string): Promise<void> => {
    try {
      await updateVideo(id, { isFavorited: true });
    } catch (error) {
      console.error('Error favoriting video:', error);
      throw error;
    }
  }, [updateVideo]);

  const unfavoriteVideo = useCallback(async (id: string): Promise<void> => {
    try {
      await updateVideo(id, { isFavorited: false });
    } catch (error) {
      console.error('Error unfavoriting video:', error);
      throw error;
    }
  }, [updateVideo]);

  // Comments management
  const addComment = useCallback(async (videoId: string, comment: Omit<VideoComment, 'id' | 'createdAt'>): Promise<void> => {
    try {
      const newComment: VideoComment = {
        ...comment,
        id: `comment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
      };
      
      setComments(prev => {
        const updated = [...prev, newComment];
        saveToStorage(STORAGE_KEYS.COMMENTS, updated);
        return updated;
      });
      
      // Update stats
      setStats(prev => {
        const updated = {
          ...prev,
          recentActivity: {
            ...prev.recentActivity,
            comments: prev.recentActivity.comments + 1,
          },
        };
        saveToStorage(STORAGE_KEYS.STATS, updated);
        return updated;
      });
      
      toast.success('Comentário adicionado!');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Erro ao adicionar comentário');
      throw error;
    }
  }, [saveToStorage]);

  const updateComment = useCallback(async (commentId: string, updates: Partial<VideoComment>): Promise<void> => {
    try {
      setComments(prev => {
        const updated = prev.map(comment => 
          comment.id === commentId ? { ...comment, ...updates } : comment
        );
        saveToStorage(STORAGE_KEYS.COMMENTS, updated);
        return updated;
      });
      
      toast.success('Comentário atualizado!');
    } catch (error) {
      console.error('Error updating comment:', error);
      toast.error('Erro ao atualizar comentário');
      throw error;
    }
  }, [saveToStorage]);

  const deleteComment = useCallback(async (commentId: string): Promise<void> => {
    try {
      setComments(prev => {
        const updated = prev.filter(comment => comment.id !== commentId);
        saveToStorage(STORAGE_KEYS.COMMENTS, updated);
        return updated;
      });
      
      toast.success('Comentário removido!');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Erro ao remover comentário');
      throw error;
    }
  }, [saveToStorage]);

  // Notes management
  const addNote = useCallback(async (videoId: string, note: Omit<VideoNote, 'id' | 'createdAt'>): Promise<void> => {
    try {
      const newNote: VideoNote = {
        ...note,
        id: `note-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        createdAt: new Date(),
      };
      
      setNotes(prev => {
        const updated = [...prev, newNote];
        saveToStorage(STORAGE_KEYS.NOTES, updated);
        return updated;
      });
      
      toast.success('Nota adicionada!');
    } catch (error) {
      console.error('Error adding note:', error);
      toast.error('Erro ao adicionar nota');
      throw error;
    }
  }, [saveToStorage]);

  const updateNote = useCallback(async (noteId: string, updates: Partial<VideoNote>): Promise<void> => {
    try {
      setNotes(prev => {
        const updated = prev.map(note => 
          note.id === noteId ? { ...note, ...updates } : note
        );
        saveToStorage(STORAGE_KEYS.NOTES, updated);
        return updated;
      });
      
      toast.success('Nota atualizada!');
    } catch (error) {
      console.error('Error updating note:', error);
      toast.error('Erro ao atualizar nota');
      throw error;
    }
  }, [saveToStorage]);

  const deleteNote = useCallback(async (noteId: string): Promise<void> => {
    try {
      setNotes(prev => {
        const updated = prev.filter(note => note.id !== noteId);
        saveToStorage(STORAGE_KEYS.NOTES, updated);
        return updated;
      });
      
      toast.success('Nota removida!');
    } catch (error) {
      console.error('Error deleting note:', error);
      toast.error('Erro ao remover nota');
      throw error;
    }
  }, [saveToStorage]);

  // Analytics functions
  const trackVideoView = useCallback(async (videoId: string, watchTime: number): Promise<void> => {
    if (!enableAnalytics) return;
    
    try {
      // In a real implementation, this would be an API call
      // await api.trackVideoView(videoId, watchTime);
      
      setVideos(prev => {
        const updated = prev.map(video => {
          if (video.id === videoId && video.analytics) {
            return {
              ...video,
              analytics: {
                ...video.analytics,
                views: video.analytics.views + 1,
                averageWatchTime: Math.round(
                  (video.analytics.averageWatchTime * video.analytics.views + watchTime) / 
                  (video.analytics.views + 1)
                ),
              },
            };
          }
          return video;
        });
        saveToStorage(STORAGE_KEYS.VIDEOS, updated);
        return updated;
      });
      
      // Update global stats
      setStats(prev => {
        const updated = {
          ...prev,
          totalWatchTime: prev.totalWatchTime + watchTime,
          recentActivity: {
            ...prev.recentActivity,
            views: prev.recentActivity.views + 1,
          },
        };
        saveToStorage(STORAGE_KEYS.STATS, updated);
        return updated;
      });
    } catch (error) {
      console.error('Error tracking video view:', error);
    }
  }, [enableAnalytics, saveToStorage]);

  const trackVideoInteraction = useCallback(async (videoId: string, interaction: string): Promise<void> => {
    if (!enableAnalytics) return;
    
    try {
      // In a real implementation, this would be an API call
      // await api.trackVideoInteraction(videoId, interaction);
      
      console.log(`Tracked interaction: ${interaction} for video: ${videoId}`);
    } catch (error) {
      console.error('Error tracking video interaction:', error);
    }
  }, [enableAnalytics]);

  const getVideoAnalytics = useCallback(async (videoId: string): Promise<VideoAnalytics> => {
    try {
      const video = videos.find(v => v.id === videoId);
      if (!video?.analytics) {
        throw new Error('Analytics not found for video');
      }
      return video.analytics;
    } catch (error) {
      console.error('Error getting video analytics:', error);
      throw error;
    }
  }, [videos]);

  // Course management
  const enrollInCourse = useCallback(async (courseId: string): Promise<void> => {
    try {
      // In a real implementation, this would be an API call
      // await api.enrollInCourse(courseId);
      
      toast.success('Inscrito no curso com sucesso!');
    } catch (error) {
      console.error('Error enrolling in course:', error);
      toast.error('Erro ao se inscrever no curso');
      throw error;
    }
  }, []);

  const updateCourseProgress = useCallback(async (courseId: string, progress: number): Promise<void> => {
    try {
      setCourses(prev => {
        const updated = prev.map(course => 
          course.id === courseId ? { ...course, progress } : course
        );
        saveToStorage(STORAGE_KEYS.COURSES, updated);
        return updated;
      });
    } catch (error) {
      console.error('Error updating course progress:', error);
      throw error;
    }
  }, [saveToStorage]);

  const completeCourse = useCallback(async (courseId: string): Promise<void> => {
    try {
      await updateCourseProgress(courseId, 100);
      
      setStats(prev => {
        const updated = {
          ...prev,
          completedCourses: prev.completedCourses + 1,
        };
        saveToStorage(STORAGE_KEYS.STATS, updated);
        return updated;
      });
      
      toast.success('Parabéns! Curso concluído!');
    } catch (error) {
      console.error('Error completing course:', error);
      toast.error('Erro ao concluir curso');
      throw error;
    }
  }, [updateCourseProgress, saveToStorage]);

  // Utility functions
  const exportData = useCallback(async (format: 'json' | 'csv' | 'xlsx'): Promise<void> => {
    try {
      const data = {
        videos,
        courses,
        stats,
        comments,
        notes,
        exportedAt: new Date().toISOString(),
      };
      
      let content: string;
      let mimeType: string;
      let filename: string;
      
      switch (format) {
        case 'json':
          content = JSON.stringify(data, null, 2);
          mimeType = 'application/json';
          filename = `training-data-${Date.now()}.json`;
          break;
        case 'csv':
          // Simple CSV export for videos
          const csvHeaders = 'ID,Title,Category,Duration,Views,Likes,Upload Date\n';
          const csvRows = videos.map(video => 
            `${video.id},"${video.title}",${video.category},${video.duration},${video.analytics?.views || 0},${video.analytics?.likes || 0},${video.uploadedAt.toISOString()}`
          ).join('\n');
          content = csvHeaders + csvRows;
          mimeType = 'text/csv';
          filename = `training-videos-${Date.now()}.csv`;
          break;
        default:
          throw new Error(`Unsupported export format: ${format}`);
      }
      
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      
      toast.success('Dados exportados com sucesso!');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Erro ao exportar dados');
      throw error;
    }
  }, [videos, courses, stats, comments, notes]);

  const clearCache = useCallback(() => {
    if (!enableOfflineMode) return;
    
    try {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      toast.success('Cache limpo com sucesso!');
    } catch (error) {
      console.error('Error clearing cache:', error);
      toast.error('Erro ao limpar cache');
    }
  }, [enableOfflineMode]);

  // Save filters to storage when they change
  useEffect(() => {
    const filters = {
      searchQuery,
      categoryFilter,
      sortBy,
      sortOrder,
    };
    saveToStorage(STORAGE_KEYS.FILTERS, filters);
  }, [searchQuery, categoryFilter, sortBy, sortOrder, saveToStorage]);

  // Load data on mount
  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      try {
        loadFromStorage();
        await fetchData();
      } finally {
        setIsLoading(false);
      }
    };
    
    initializeData();
  }, [loadFromStorage, fetchData]);

  // Auto-refresh data
  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      refreshData();
    }, refreshInterval);
    
    return () => clearInterval(interval);
  }, [autoRefresh, refreshInterval, refreshData]);

  return {
    // Data
    videos,
    courses,
    stats,
    comments,
    notes,
    
    // Loading states
    isLoading,
    isRefreshing,
    isUploadingVideo,
    
    // Search and filters
    searchQuery,
    categoryFilter,
    sortBy,
    sortOrder,
    filteredVideos,
    
    // Actions
    setSearchQuery,
    setCategoryFilter,
    setSortBy,
    setSortOrder,
    
    // Video management
    uploadVideo,
    updateVideo,
    deleteVideo,
    favoriteVideo,
    unfavoriteVideo,
    
    // Comments and notes
    addComment,
    updateComment,
    deleteComment,
    addNote,
    updateNote,
    deleteNote,
    
    // Analytics
    trackVideoView,
    trackVideoInteraction,
    getVideoAnalytics,
    
    // Course management
    enrollInCourse,
    updateCourseProgress,
    completeCourse,
    
    // Utility functions
    refreshData,
    exportData,
    clearCache,
  };
};

export default useTrainingDashboard;