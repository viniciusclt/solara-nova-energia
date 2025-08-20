/**
 * Dashboard do Roadmap
 * 
 * Componente principal que exibe uma visão geral do roadmap,
 * incluindo estatísticas, funcionalidades em destaque e filtros
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  MessageSquare, 
  Plus, 
  Filter, 
  Search,
  Calendar,
  Target,
  Lightbulb,
  Zap,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import { useRoadmapData } from '@/hooks/useRoadmapData';
import { useNotifications } from '@/hooks/useNotifications';
import type {
  FeatureCategory,
  FeatureStatus,
  FeaturePriority,
  RoadmapFilters
} from '@/types/roadmap';
import { 
  FEATURE_CATEGORY_LABELS,
  FEATURE_STATUS_LABELS,
  FEATURE_PRIORITY_LABELS,
  FEATURE_STATUS_COLORS,
  FEATURE_PRIORITY_COLORS
} from '@/types/roadmap';

export interface RoadmapDashboardProps {
  onCreateFeature?: () => void;
  onFeatureClick?: (featureId: string) => void;
  className?: string;
}

const COLORS = {
  primary: '#10b981',
  secondary: '#3b82f6',
  accent: '#f59e0b',
  danger: '#ef4444',
  success: '#22c55e',
  warning: '#f59e0b',
  muted: '#6b7280'
};

export function RoadmapDashboard({ onCreateFeature, onFeatureClick, className }: RoadmapDashboardProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<FeatureCategory | 'all'>('all');
  const [selectedStatus, setSelectedStatus] = useState<FeatureStatus | 'all'>('all');
  const [selectedPriority, setSelectedPriority] = useState<FeaturePriority | 'all'>('all');
  const [activeTab, setActiveTab] = useState('overview');
  
  const { addNotification } = useNotifications();
  
  // Construir filtros baseados no estado
  const filters = useMemo((): RoadmapFilters => {
    const baseFilters: RoadmapFilters = {
      limit: 20,
      offset: 0,
      sort_by: 'votes_count',
      sort_order: 'desc'
    };
    
    if (searchTerm) {
      baseFilters.search = searchTerm;
    }
    
    if (selectedCategory !== 'all') {
      baseFilters.category = [selectedCategory as FeatureCategory];
    }
    
    if (selectedStatus !== 'all') {
      baseFilters.status = [selectedStatus as FeatureStatus];
    }
    
    if (selectedPriority !== 'all') {
      baseFilters.priority = [selectedPriority as FeaturePriority];
    }
    
    return baseFilters;
  }, [searchTerm, selectedCategory, selectedStatus, selectedPriority]);
  
  const {
    features,
    stats,
    isLoading,
    isLoadingStats,
    error,
    pagination,
    refresh
  } = useRoadmapData({ 
    autoFetch: true,
    initialFilters: filters
  });
  
  // Funcionalidades em destaque (mais votadas)
  const featuredFeatures = useMemo(() => {
    return features
      .filter(f => f.status !== 'completed' && f.status !== 'cancelled')
      .slice(0, 3);
  }, [features]);
  
  // Estatísticas por status para gráfico
  const statusStats = useMemo(() => {
    if (!stats) return [];
    
    return Object.entries(stats.by_status).map(([status, count]) => ({
      status: status as FeatureStatus,
      count,
      label: FEATURE_STATUS_LABELS[status as FeatureStatus],
      color: FEATURE_STATUS_COLORS[status as FeatureStatus]
    }));
  }, [stats]);
  
  // Estatísticas por categoria
  const categoryStats = useMemo(() => {
    if (!stats) return [];
    
    return Object.entries(stats.by_category).map(([category, count]) => ({
      category: category as FeatureCategory,
      count,
      label: FEATURE_CATEGORY_LABELS[category as FeatureCategory]
    }));
  }, [stats]);
  
  // Limpar filtros
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setSelectedStatus('all');
    setSelectedPriority('all');
  };
  
  // Componente de métrica
  const MetricCard = ({ 
    title, 
    value, 
    subtitle, 
    icon: Icon, 
    color = 'default',
    trend
  }: {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ElementType;
    color?: 'default' | 'success' | 'warning' | 'danger';
    trend?: 'up' | 'down' | 'neutral';
  }) => {
    const colorClasses = {
      default: 'text-foreground',
      success: 'text-green-600',
      warning: 'text-yellow-600',
      danger: 'text-red-600'
    };
    
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Icon className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">{title}</span>
            </div>
            {trend && (
              <TrendingUp className={`h-4 w-4 ${
                trend === 'up' ? 'text-green-500' : 
                trend === 'down' ? 'text-red-500' : 'text-gray-500'
              }`} />
            )}
          </div>
          <div className="mt-2">
            <div className={`text-2xl font-bold ${colorClasses[color]}`}>
              {typeof value === 'number' ? value.toLocaleString() : value}
            </div>
            {subtitle && (
              <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };
  
  // Componente de funcionalidade em destaque
  const FeatureCard = ({ feature }: { feature: { id: string; title: string; description: string; status: string; priority: string; category: string; votes: number; createdAt: string; estimatedCompletion?: string } }) => {
    return (
      <Card 
        className="cursor-pointer hover:shadow-md transition-shadow"
        onClick={() => onFeatureClick?.(feature.id)}
      >
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg line-clamp-2">{feature.title}</CardTitle>
              <CardDescription className="mt-1 line-clamp-2">
                {feature.description}
              </CardDescription>
            </div>
            <Badge 
              variant="outline" 
              className={`ml-2 ${FEATURE_STATUS_COLORS[feature.status]}`}
            >
              {FEATURE_STATUS_LABELS[feature.status]}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
              <div className="flex items-center space-x-1">
                <TrendingUp className="h-4 w-4" />
                <span>{feature.votes_count || 0} votos</span>
              </div>
              <div className="flex items-center space-x-1">
                <MessageSquare className="h-4 w-4" />
                <span>{feature.comments_count || 0} comentários</span>
              </div>
            </div>
            <Badge 
              variant="secondary"
              className={FEATURE_PRIORITY_COLORS[feature.priority]}
            >
              {FEATURE_PRIORITY_LABELS[feature.priority]}
            </Badge>
          </div>
          <div className="mt-3">
            <Badge variant="outline">
              {FEATURE_CATEGORY_LABELS[feature.category]}
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  };
  
  if (error) {
    return (
      <div className={`p-6 ${className}`}>
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Erro ao carregar roadmap</h3>
              <p className="text-muted-foreground mb-4">{error}</p>
              <Button onClick={refresh} variant="outline">
                Tentar novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Roadmap</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe o desenvolvimento de novas funcionalidades e vote nas suas favoritas
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={refresh} variant="outline" size="sm">
            <BarChart3 className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          {onCreateFeature && (
            <Button onClick={onCreateFeature} size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Nova Funcionalidade
            </Button>
          )}
        </div>
      </div>
      
      {/* Métricas principais */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard
            title="Total de Funcionalidades"
            value={stats.total_features}
            subtitle="Todas as funcionalidades"
            icon={Target}
            color="default"
          />
          <MetricCard
            title="Total de Votos"
            value={stats.total_votes}
            subtitle="Votos da comunidade"
            icon={TrendingUp}
            color="success"
          />
          <MetricCard
            title="Comentários"
            value={stats.total_comments}
            subtitle="Discussões ativas"
            icon={MessageSquare}
            color="default"
          />
          <MetricCard
            title="Contribuidores"
            value={stats.active_contributors}
            subtitle="Usuários ativos"
            icon={Users}
            color="default"
          />
        </div>
      )}
      
      {/* Filtros */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">Filtros</CardTitle>
              <CardDescription>Filtre funcionalidades por categoria, status e prioridade</CardDescription>
            </div>
            <Button onClick={clearFilters} variant="outline" size="sm">
              <Filter className="h-4 w-4 mr-2" />
              Limpar Filtros
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">Buscar</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="search"
                  placeholder="Buscar funcionalidades..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as categorias" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as categorias</SelectItem>
                  {Object.entries(FEATURE_CATEGORY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os status</SelectItem>
                  {Object.entries(FEATURE_STATUS_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Prioridade</Label>
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas as prioridades" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas as prioridades</SelectItem>
                  {Object.entries(FEATURE_PRIORITY_LABELS).map(([value, label]) => (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Tabs principais */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="features">Funcionalidades</TabsTrigger>
          <TabsTrigger value="stats">Estatísticas</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-6">
          {/* Funcionalidades em destaque */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Lightbulb className="h-5 w-5" />
                <span>Funcionalidades em Destaque</span>
              </CardTitle>
              <CardDescription>
                As funcionalidades mais votadas pela comunidade
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : featuredFeatures.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {featuredFeatures.map((feature) => (
                    <FeatureCard key={feature.id} feature={feature} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma funcionalidade encontrada</h3>
                  <p className="text-muted-foreground">Ajuste os filtros ou crie uma nova funcionalidade</p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {/* Status overview */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Status das Funcionalidades</CardTitle>
                  <CardDescription>Distribuição por status de desenvolvimento</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {statusStats.map((stat) => (
                      <div key={stat.status} className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className={`w-3 h-3 rounded-full ${stat.color}`} />
                          <span className="text-sm font-medium">{stat.label}</span>
                        </div>
                        <Badge variant="secondary">{stat.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Categorias</CardTitle>
                  <CardDescription>Funcionalidades por categoria</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {categoryStats.map((stat) => (
                      <div key={stat.category} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{stat.label}</span>
                        <Badge variant="outline">{stat.count}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="features">
          <Card>
            <CardHeader>
              <CardTitle>Todas as Funcionalidades</CardTitle>
              <CardDescription>
                {pagination.total} funcionalidades encontradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
                  ))}
                </div>
              ) : features.length > 0 ? (
                <div className="space-y-4">
                  {features.map((feature) => (
                    <FeatureCard key={feature.id} feature={feature} />
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold mb-2">Nenhuma funcionalidade encontrada</h3>
                  <p className="text-muted-foreground">Ajuste os filtros ou crie uma nova funcionalidade</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="stats">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Estatísticas detalhadas */}
            {stats && (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Estatísticas Gerais</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Total de funcionalidades:</span>
                        <span className="font-semibold">{stats.total_features}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total de votos:</span>
                        <span className="font-semibold">{stats.total_votes}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total de comentários:</span>
                        <span className="font-semibold">{stats.total_comments}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Contribuidores ativos:</span>
                        <span className="font-semibold">{stats.active_contributors}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Distribuição por Prioridade</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {Object.entries(stats.by_priority).map(([priority, count]) => (
                        <div key={priority} className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className={`w-3 h-3 rounded-full ${
                              FEATURE_PRIORITY_COLORS[priority as FeaturePriority]
                            }`} />
                            <span className="text-sm font-medium">
                              {FEATURE_PRIORITY_LABELS[priority as FeaturePriority]}
                            </span>
                          </div>
                          <Badge variant="secondary">{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}