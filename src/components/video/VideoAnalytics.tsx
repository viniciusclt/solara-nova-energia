// =====================================================================================
// COMPONENTE DE ANALYTICS DE VÍDEOS - SOLARA NOVA ENERGIA
// =====================================================================================

import React, { useState, useEffect, useCallback } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from 'recharts';
import { 
  Eye, 
  Users, 
  Clock, 
  TrendingUp, 
  Download, 
  Share2, 
  Play,
  Pause,
  Calendar,
  Filter,
  RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { 
  VideoDashboard, 
  VideoStats, 
  VideoActivity,
  VideoAnalytics as VideoAnalyticsType
} from '../../types/video';
import { secureStreamingService } from '../../services/secureStreamingService';
import { supabase } from '../../integrations/supabase/client';
import { toast } from 'sonner';

interface VideoAnalyticsProps {
  videoId?: string;
  timeRange?: 'day' | 'week' | 'month' | 'year';
  className?: string;
}

interface AnalyticsData {
  overview: VideoStats;
  viewsOverTime: { date: string; views: number; uniqueViews: number }[];
  qualityDistribution: { quality: string; count: number; percentage: number }[];
  deviceTypes: { device: string; count: number; percentage: number }[];
  watchTimeDistribution: { range: string; count: number }[];
  topVideos: { id: string; title: string; views: number; duration: number }[];
  recentActivity: VideoActivity[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#06B6D4'];

export const VideoAnalytics: React.FC<VideoAnalyticsProps> = ({
  videoId,
  timeRange = 'week',
  className = ''
}) => {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedMetric, setSelectedMetric] = useState<'views' | 'duration' | 'engagement'>('views');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    end: new Date()
  });

  /**
   * Carregar dados de analytics
   */
  const loadAnalyticsData = useCallback(async () => {
    try {
      setLoading(true);
      
      if (videoId) {
        // Analytics para vídeo específico
        const videoData = await loadVideoAnalytics(videoId);
        setData(videoData);
      } else {
        // Analytics gerais
        const generalData = await loadGeneralAnalytics();
        setData(generalData);
      }
    } catch (error) {
      console.error('Erro ao carregar analytics:', error);
      toast.error('Erro ao carregar dados de analytics');
    } finally {
      setLoading(false);
    }
  }, [videoId, timeRange, dateRange]);

  /**
   * Carregar analytics de vídeo específico
   */
  const loadVideoAnalytics = async (videoId: string): Promise<AnalyticsData> => {
    // Obter estatísticas básicas
    const accessStats = await secureStreamingService.getAccessStats(videoId);
    
    // Obter dados detalhados do banco
    const { data: logs } = await supabase
      .from('video_access_logs')
      .select('*')
      .eq('video_id', videoId)
      .gte('accessed_at', dateRange.start.toISOString())
      .lte('accessed_at', dateRange.end.toISOString())
      .order('accessed_at', { ascending: true });

    const { data: video } = await supabase
      .from('training_videos')
      .select('*')
      .eq('id', videoId)
      .single();

    // Processar dados
    const viewsOverTime = processViewsOverTime(logs || []);
    const qualityDistribution = processQualityDistribution(logs || []);
    const deviceTypes = processDeviceTypes(logs || []);
    const watchTimeDistribution = processWatchTimeDistribution(logs || []);
    const recentActivity = processRecentActivity(logs || []);

    return {
      overview: {
        totalViews: accessStats.totalViews,
        uniqueViewers: accessStats.uniqueViewers,
        averageWatchTime: accessStats.averageDuration,
        completionRate: calculateCompletionRate(logs || [], video?.duration || 0),
        engagementScore: calculateEngagementScore(logs || []),
        totalWatchTime: (logs || []).reduce((sum, log) => sum + (log.duration || 0), 0)
      },
      viewsOverTime,
      qualityDistribution,
      deviceTypes,
      watchTimeDistribution,
      topVideos: [{
        id: videoId,
        title: video?.title || 'Vídeo',
        views: accessStats.totalViews,
        duration: video?.duration || 0
      }],
      recentActivity
    };
  };

  /**
   * Carregar analytics gerais
   */
  const loadGeneralAnalytics = async (): Promise<AnalyticsData> => {
    // Obter todos os logs no período
    const { data: logs } = await supabase
      .from('video_access_logs')
      .select(`
        *,
        training_videos!inner(id, title, duration)
      `)
      .gte('accessed_at', dateRange.start.toISOString())
      .lte('accessed_at', dateRange.end.toISOString())
      .order('accessed_at', { ascending: true });

    // Obter estatísticas gerais
    const { data: videos } = await supabase
      .from('training_videos')
      .select('*');

    // Processar dados
    const viewsOverTime = processViewsOverTime(logs || []);
    const qualityDistribution = processQualityDistribution(logs || []);
    const deviceTypes = processDeviceTypes(logs || []);
    const watchTimeDistribution = processWatchTimeDistribution(logs || []);
    const topVideos = processTopVideos(logs || [], videos || []);
    const recentActivity = processRecentActivity(logs || []);

    const totalViews = logs?.length || 0;
    const uniqueViewers = new Set(logs?.map(log => log.user_id) || []).size;
    const totalWatchTime = (logs || []).reduce((sum, log) => sum + (log.duration || 0), 0);
    const averageWatchTime = totalViews > 0 ? totalWatchTime / totalViews : 0;

    return {
      overview: {
        totalViews,
        uniqueViewers,
        averageWatchTime,
        completionRate: calculateOverallCompletionRate(logs || []),
        engagementScore: calculateEngagementScore(logs || []),
        totalWatchTime
      },
      viewsOverTime,
      qualityDistribution,
      deviceTypes,
      watchTimeDistribution,
      topVideos,
      recentActivity
    };
  };

  /**
   * Processar visualizações ao longo do tempo
   */
  const processViewsOverTime = (logs: VideoLog[]) => {
    const groupedByDate = logs.reduce((acc, log) => {
      const date = new Date(log.accessed_at).toISOString().split('T')[0];
      if (!acc[date]) {
        acc[date] = { views: 0, uniqueUsers: new Set() };
      }
      acc[date].views++;
      acc[date].uniqueUsers.add(log.user_id);
      return acc;
    }, {} as Record<string, { views: number; uniqueUsers: Set<string> }>);

    return Object.entries(groupedByDate)
      .map(([date, data]) => ({
        date,
        views: data.views,
        uniqueViews: data.uniqueUsers.size
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  };

  /**
   * Processar distribuição de qualidade
   */
  const processQualityDistribution = (logs: VideoLog[]) => {
    const qualityCounts = logs.reduce((acc, log) => {
      const quality = log.quality || 'auto';
      acc[quality] = (acc[quality] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = logs.length;
    return Object.entries(qualityCounts)
      .map(([quality, count]) => ({
        quality,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
  };

  /**
   * Processar tipos de dispositivo
   */
  const processDeviceTypes = (logs: VideoLog[]) => {
    const deviceCounts = logs.reduce((acc, log) => {
      const userAgent = log.user_agent || '';
      let device = 'Desktop';
      
      if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
        device = 'Mobile';
      } else if (/Tablet|iPad/.test(userAgent)) {
        device = 'Tablet';
      }
      
      acc[device] = (acc[device] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const total = logs.length;
    return Object.entries(deviceCounts)
      .map(([device, count]) => ({
        device,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0
      }))
      .sort((a, b) => b.count - a.count);
  };

  /**
   * Processar distribuição de tempo de visualização
   */
  const processWatchTimeDistribution = (logs: VideoLog[]) => {
    const ranges = [
      { label: '0-30s', min: 0, max: 30 },
      { label: '30s-2m', min: 30, max: 120 },
      { label: '2-5m', min: 120, max: 300 },
      { label: '5-10m', min: 300, max: 600 },
      { label: '10m+', min: 600, max: Infinity }
    ];

    const distribution = ranges.map(range => ({
      range: range.label,
      count: logs.filter(log => {
        const duration = log.duration || 0;
        return duration >= range.min && duration < range.max;
      }).length
    }));

    return distribution;
  };

  /**
   * Processar top vídeos
   */
  const processTopVideos = (logs: VideoLog[], videos: VideoUpload[]) => {
    const videoCounts = logs.reduce((acc, log) => {
      acc[log.video_id] = (acc[log.video_id] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(videoCounts)
      .map(([videoId, views]) => {
        const video = videos.find(v => v.id === videoId);
        return {
          id: videoId,
          title: video?.title || 'Vídeo Desconhecido',
          views,
          duration: video?.duration || 0
        };
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);
  };

  /**
   * Processar atividade recente
   */
  const processRecentActivity = (logs: VideoLog[]): VideoActivity[] => {
    return logs
      .slice(-20)
      .reverse()
      .map(log => ({
        id: log.id,
        type: 'view',
        userId: log.user_id,
        videoId: log.video_id,
        timestamp: new Date(log.accessed_at),
        metadata: {
          quality: log.quality,
          duration: log.duration,
          ip: log.ip_address
        }
      }));
  };

  /**
   * Calcular taxa de conclusão
   */
  const calculateCompletionRate = (logs: VideoLog[], videoDuration: number) => {
    if (!videoDuration || logs.length === 0) return 0;
    
    const completedViews = logs.filter(log => 
      (log.duration || 0) >= videoDuration * 0.8
    ).length;
    
    return (completedViews / logs.length) * 100;
  };

  /**
   * Calcular taxa de conclusão geral
   */
  const calculateOverallCompletionRate = (logs: VideoLog[]) => {
    if (logs.length === 0) return 0;
    
    // Assumir que vídeos com mais de 80% do tempo assistido são "completos"
    const avgCompletionRate = logs.reduce((sum, log) => {
      const duration = log.duration || 0;
      const videoDuration = log.training_videos?.duration || 1;
      return sum + Math.min(duration / videoDuration, 1);
    }, 0) / logs.length;
    
    return avgCompletionRate * 100;
  };

  /**
   * Calcular score de engajamento
   */
  const calculateEngagementScore = (logs: VideoLog[]) => {
    if (logs.length === 0) return 0;
    
    // Score baseado em tempo de visualização, frequência e distribuição
    const avgWatchTime = logs.reduce((sum, log) => sum + (log.duration || 0), 0) / logs.length;
    const uniqueUsers = new Set(logs.map(log => log.user_id)).size;
    const repeatViewers = logs.length - uniqueUsers;
    
    // Normalizar para 0-100
    const timeScore = Math.min(avgWatchTime / 300, 1) * 40; // Max 40 pontos para tempo
    const repeatScore = Math.min(repeatViewers / logs.length, 0.5) * 30; // Max 30 pontos para repetição
    const volumeScore = Math.min(logs.length / 100, 1) * 30; // Max 30 pontos para volume
    
    return Math.round(timeScore + repeatScore + volumeScore);
  };

  /**
   * Formatar duração
   */
  const formatDuration = (seconds: number): string => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  /**
   * Formatar número
   */
  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  useEffect(() => {
    loadAnalyticsData();
  }, [loadAnalyticsData]);

  if (loading) {
    return (
      <div className={`flex items-center justify-center h-64 ${className}`}>
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <p className="text-gray-500 dark:text-gray-400">Nenhum dado disponível</p>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
          {videoId ? 'Analytics do Vídeo' : 'Analytics Gerais'}
        </h2>
        <div className="flex items-center space-x-4">
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value as 'views' | 'duration' | 'engagement')}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="views">Visualizações</option>
            <option value="duration">Duração</option>
            <option value="engagement">Engajamento</option>
          </select>
          <button
            onClick={loadAnalyticsData}
            className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Cards de Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Visualizações</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(data.overview.totalViews)}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/20 rounded-full">
              <Eye className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Visualizadores Únicos</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatNumber(data.overview.uniqueViewers)}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-full">
              <Users className="w-6 h-6 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tempo Médio</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {formatDuration(data.overview.averageWatchTime)}
              </p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-full">
              <Clock className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Taxa de Conclusão</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {data.overview.completionRate.toFixed(1)}%
              </p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-full">
              <TrendingUp className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Visualizações ao longo do tempo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Visualizações ao Longo do Tempo
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.viewsOverTime}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis 
                dataKey="date" 
                tick={{ fontSize: 12 }}
                tickFormatter={(value) => new Date(value).toLocaleDateString('pt-BR', { month: 'short', day: 'numeric' })}
              />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString('pt-BR')}
                formatter={(value, name) => [value, name === 'views' ? 'Visualizações' : 'Únicos']}
              />
              <Area 
                type="monotone" 
                dataKey="views" 
                stackId="1" 
                stroke="#3B82F6" 
                fill="#3B82F6" 
                fillOpacity={0.6}
              />
              <Area 
                type="monotone" 
                dataKey="uniqueViews" 
                stackId="2" 
                stroke="#10B981" 
                fill="#10B981" 
                fillOpacity={0.6}
              />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Distribuição de qualidade */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Distribuição de Qualidade
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data.qualityDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ quality, percentage }) => `${quality} (${percentage.toFixed(1)}%)`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {data.qualityDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => [value, 'Visualizações']} />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      {/* Tabelas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top vídeos */}
        {!videoId && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Vídeos Mais Assistidos
            </h3>
            <div className="space-y-3">
              {data.topVideos.slice(0, 5).map((video, index) => (
                <div key={video.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                      <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {index + 1}
                      </span>
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white truncate max-w-48">
                        {video.title}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {formatDuration(video.duration)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-gray-900 dark:text-white">
                      {formatNumber(video.views)}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">visualizações</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Atividade recente */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700"
        >
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Atividade Recente
          </h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {data.recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-center space-x-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                  <Play className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white">
                    Usuário assistiu vídeo
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {activity.timestamp.toLocaleString('pt-BR')} • 
                    {activity.metadata?.quality} • 
                    {formatDuration(activity.metadata?.duration || 0)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default VideoAnalytics;