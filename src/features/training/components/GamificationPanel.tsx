// =====================================================
// PAINEL DE GAMIFICAÇÃO
// Sistema de Treinamentos Corporativos - Solara Nova Energia
// Versão: 1.0
// Data: 2024-12-12
// =====================================================

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy,
  Medal,
  Award,
  Star,
  Zap,
  Target,
  Crown,
  Flame,
  TrendingUp,
  Users,
  Calendar,
  Clock,
  CheckCircle,
  Gift,
  Sparkles,
  BarChart3,
  PieChart,
  Activity,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  Filter,
  Download,
  Share2,
  Eye,
  RefreshCw,
  Plus,
  Minus,
  Info,
  AlertCircle,
  BookOpen,
  PlayCircle,
  FileText,
  Video,
  Brain,
  Lightbulb,
  Rocket,
  Shield,
  Heart,
  Coffee,
  Mountain,
  Sunrise
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Progress } from '../../../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '../../../components/ui/avatar';
import { Separator } from '../../../components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '../../../components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../../../components/ui/tooltip';
import { useGamification } from '../hooks/useTraining';
import { useAuth } from '../../../contexts/AuthContext';
import type { GamificationData, Badge as BadgeType, UserRanking } from '../types';

// =====================================================
// INTERFACES
// =====================================================

interface GamificationPanelProps {
  showLeaderboard?: boolean;
  compactMode?: boolean;
  period?: 'week' | 'month' | 'quarter' | 'year';
}

interface BadgeCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  progress: number;
  maxProgress: number;
  unlocked: boolean;
  unlockedAt?: Date;
  points: number;
}

// =====================================================
// DADOS ESTÁTICOS
// =====================================================

const BADGE_CATEGORIES: BadgeCategory[] = [
  {
    id: 'learning',
    name: 'Aprendizado',
    description: 'Badges relacionados ao progresso nos estudos',
    icon: BookOpen,
    color: 'blue'
  },
  {
    id: 'completion',
    name: 'Conclusão',
    description: 'Badges por completar módulos e cursos',
    icon: CheckCircle,
    color: 'green'
  },
  {
    id: 'streak',
    name: 'Consistência',
    description: 'Badges por manter sequências de estudo',
    icon: Flame,
    color: 'orange'
  },
  {
    id: 'excellence',
    name: 'Excelência',
    description: 'Badges por altas pontuações e desempenho',
    icon: Star,
    color: 'yellow'
  },
  {
    id: 'social',
    name: 'Social',
    description: 'Badges por interação e colaboração',
    icon: Users,
    color: 'purple'
  },
  {
    id: 'special',
    name: 'Especiais',
    description: 'Badges únicos e eventos especiais',
    icon: Crown,
    color: 'pink'
  }
];

const SAMPLE_ACHIEVEMENTS: Achievement[] = [
  {
    id: '1',
    title: 'Primeiro Passo',
    description: 'Complete seu primeiro módulo de treinamento',
    icon: Rocket,
    rarity: 'common',
    progress: 1,
    maxProgress: 1,
    unlocked: true,
    unlockedAt: new Date('2024-12-01'),
    points: 50
  },
  {
    id: '2',
    title: 'Maratonista',
    description: 'Estude por 7 dias consecutivos',
    icon: Flame,
    rarity: 'rare',
    progress: 5,
    maxProgress: 7,
    unlocked: false,
    points: 200
  },
  {
    id: '3',
    title: 'Perfeccionista',
    description: 'Obtenha 100% em 5 avaliações',
    icon: Target,
    rarity: 'epic',
    progress: 2,
    maxProgress: 5,
    unlocked: false,
    points: 500
  },
  {
    id: '4',
    title: 'Mestre Solar',
    description: 'Complete todos os módulos de energia solar',
    icon: Sunrise,
    rarity: 'legendary',
    progress: 3,
    maxProgress: 10,
    unlocked: false,
    points: 1000
  }
];

// =====================================================
// COMPONENTE PRINCIPAL
// =====================================================

export function GamificationPanel({ 
  showLeaderboard = true, 
  compactMode = false, 
  period = 'month' 
}: GamificationPanelProps) {
  const { user } = useAuth();
  const { gamificationData, ranking, isLoading } = useGamification();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [currentTab, setCurrentTab] = useState('overview');
  const [showBadgeDetails, setShowBadgeDetails] = useState<string | null>(null);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }
  
  if (compactMode) {
    return <CompactGamificationView gamificationData={gamificationData} />;
  }
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
            <Trophy className="h-6 w-6 text-yellow-600" />
            <span>Gamificação</span>
          </h2>
          <p className="text-gray-600">
            Acompanhe suas conquistas e compare com outros colaboradores
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Atualizar
          </Button>
          
          <Button variant="outline" size="sm">
            <Share2 className="h-4 w-4 mr-2" />
            Compartilhar
          </Button>
        </div>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <GamificationStatsCard
          title="Pontos Totais"
          value={gamificationData?.total_points || 0}
          icon={Zap}
          color="purple"
          trend="+120 esta semana"
        />
        
        <GamificationStatsCard
          title="Nível Atual"
          value={gamificationData?.level || 1}
          icon={TrendingUp}
          color="blue"
          progress={gamificationData?.level_progress}
          maxProgress={gamificationData?.points_to_next_level}
        />
        
        <GamificationStatsCard
          title="Badges Conquistados"
          value={gamificationData?.badges?.length || 0}
          icon={Medal}
          color="yellow"
          total={20}
        />
        
        <GamificationStatsCard
          title="Posição no Ranking"
          value={gamificationData?.ranking_position || 0}
          icon={Crown}
          color="orange"
          suffix="º"
        />
      </div>
      
      {/* Main Content */}
      <Tabs value={currentTab} onValueChange={setCurrentTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="badges">Badges</TabsTrigger>
          <TabsTrigger value="achievements">Conquistas</TabsTrigger>
          <TabsTrigger value="leaderboard">Ranking</TabsTrigger>
        </TabsList>
        
        {/* Aba: Visão Geral */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Level Progress */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  <span>Progresso de Nível</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LevelProgressCard gamificationData={gamificationData} />
              </CardContent>
            </Card>
            
            {/* Recent Achievements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <span>Conquistas Recentes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RecentAchievements achievements={SAMPLE_ACHIEVEMENTS} />
              </CardContent>
            </Card>
          </div>
          
          {/* Activity Streak */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Flame className="h-5 w-5 text-orange-600" />
                <span>Sequência de Atividade</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityStreakCard gamificationData={gamificationData} />
            </CardContent>
          </Card>
        </TabsContent>
        
        {/* Aba: Badges */}
        <TabsContent value="badges" className="space-y-6">
          <BadgesSection 
            badges={gamificationData?.badges || []} 
            selectedCategory={selectedCategory}
            onCategoryChange={setSelectedCategory}
            onBadgeClick={setShowBadgeDetails}
          />
        </TabsContent>
        
        {/* Aba: Conquistas */}
        <TabsContent value="achievements" className="space-y-6">
          <AchievementsSection achievements={SAMPLE_ACHIEVEMENTS} />
        </TabsContent>
        
        {/* Aba: Ranking */}
        <TabsContent value="leaderboard" className="space-y-6">
          {showLeaderboard && (
            <LeaderboardSection ranking={ranking || []} currentUser={user} />
          )}
        </TabsContent>
      </Tabs>
      
      {/* Badge Details Modal */}
      <BadgeDetailsModal 
        badgeId={showBadgeDetails}
        badges={gamificationData?.badges || []}
        onClose={() => setShowBadgeDetails(null)}
      />
    </div>
  );
}

// =====================================================
// COMPONENTE: CARD DE ESTATÍSTICAS
// =====================================================

function GamificationStatsCard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  trend, 
  progress, 
  maxProgress, 
  total, 
  suffix = '' 
}: {
  title: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  color: 'purple' | 'blue' | 'yellow' | 'orange';
  trend?: string;
  progress?: number;
  maxProgress?: number;
  total?: number;
  suffix?: string;
}) {
  const colorClasses = {
    purple: 'text-purple-600 bg-purple-100',
    blue: 'text-blue-600 bg-blue-100',
    yellow: 'text-yellow-600 bg-yellow-100',
    orange: 'text-orange-600 bg-orange-100'
  };
  
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <div className="flex items-baseline space-x-1">
              <p className="text-2xl font-bold text-gray-900">
                {value.toLocaleString()}{suffix}
              </p>
              {total && (
                <p className="text-sm text-gray-500">/ {total}</p>
              )}
            </div>
            {trend && (
              <p className="text-xs text-green-600 mt-1">{trend}</p>
            )}
          </div>
          
          <div className={`p-3 rounded-full ${colorClasses[color]}`}>
            <Icon className="h-6 w-6" />
          </div>
        </div>
        
        {progress !== undefined && maxProgress && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span>Progresso</span>
              <span>{progress} / {maxProgress}</span>
            </div>
            <Progress value={(progress / maxProgress) * 100} className="w-full" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// =====================================================
// COMPONENTE: PROGRESSO DE NÍVEL
// =====================================================

function LevelProgressCard({ gamificationData }: { gamificationData: GamificationData }) {
  const currentLevel = gamificationData?.level || 1;
  const currentPoints = gamificationData?.total_points || 0;
  const pointsToNext = gamificationData?.points_to_next_level || 1000;
  const levelProgress = gamificationData?.level_progress || 0;
  
  const progressPercentage = (levelProgress / pointsToNext) * 100;
  
  return (
    <div className="space-y-6">
      {/* Current Level */}
      <div className="text-center">
        <div className="relative inline-block">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4">
            {currentLevel}
          </div>
          <div className="absolute -top-2 -right-2 w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center">
            <Crown className="h-4 w-4 text-white" />
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900">
          Nível {currentLevel}
        </h3>
        <p className="text-sm text-gray-600">
          {currentPoints.toLocaleString()} pontos totais
        </p>
      </div>
      
      {/* Progress to Next Level */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">Progresso para o nível {currentLevel + 1}</span>
          <span className="font-medium">
            {levelProgress.toLocaleString()} / {pointsToNext.toLocaleString()}
          </span>
        </div>
        
        <Progress value={progressPercentage} className="w-full h-3" />
        
        <p className="text-xs text-gray-600 text-center">
          Faltam {(pointsToNext - levelProgress).toLocaleString()} pontos para o próximo nível
        </p>
      </div>
      
      {/* Level Benefits */}
      <div className="bg-blue-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-blue-900 mb-2">
          Benefícios do Nível {currentLevel + 1}
        </h4>
        <ul className="text-xs text-blue-800 space-y-1">
          <li>• Acesso a módulos avançados</li>
          <li>• Badge exclusivo de nível</li>
          <li>• Multiplicador de pontos +10%</li>
        </ul>
      </div>
    </div>
  );
}

// =====================================================
// COMPONENTE: CONQUISTAS RECENTES
// =====================================================

function RecentAchievements({ achievements }: { achievements: Achievement[] }) {
  const recentUnlocked = achievements
    .filter(a => a.unlocked && a.unlockedAt)
    .sort((a, b) => (b.unlockedAt?.getTime() || 0) - (a.unlockedAt?.getTime() || 0))
    .slice(0, 3);
  
  if (recentUnlocked.length === 0) {
    return (
      <div className="text-center py-8">
        <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Nenhuma conquista recente
        </h3>
        <p className="text-gray-600">
          Continue estudando para desbloquear conquistas!
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {recentUnlocked.map((achievement) => {
        const Icon = achievement.icon;
        return (
          <motion.div
            key={achievement.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center space-x-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200"
          >
            <div className="p-2 bg-yellow-100 rounded-full">
              <Icon className="h-5 w-5 text-yellow-600" />
            </div>
            
            <div className="flex-1">
              <h4 className="font-medium text-gray-900">
                {achievement.title}
              </h4>
              <p className="text-sm text-gray-600">
                {achievement.description}
              </p>
              <p className="text-xs text-yellow-600 font-medium">
                +{achievement.points} pontos
              </p>
            </div>
            
            <div className="text-right">
              <Badge 
                variant="secondary" 
                className={`${
                  achievement.rarity === 'legendary' ? 'bg-purple-100 text-purple-800' :
                  achievement.rarity === 'epic' ? 'bg-blue-100 text-blue-800' :
                  achievement.rarity === 'rare' ? 'bg-green-100 text-green-800' :
                  'bg-gray-100 text-gray-800'
                }`}
              >
                {achievement.rarity === 'legendary' ? 'Lendário' :
                 achievement.rarity === 'epic' ? 'Épico' :
                 achievement.rarity === 'rare' ? 'Raro' : 'Comum'}
              </Badge>
              
              <p className="text-xs text-gray-500 mt-1">
                {achievement.unlockedAt?.toLocaleDateString('pt-BR')}
              </p>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}

// =====================================================
// COMPONENTE: SEQUÊNCIA DE ATIVIDADE
// =====================================================

function ActivityStreakCard({ gamificationData }: { gamificationData: GamificationData }) {
  const currentStreak = gamificationData?.current_streak || 0;
  const longestStreak = gamificationData?.longest_streak || 0;
  
  // Simular dados dos últimos 7 dias
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    return {
      date,
      active: i >= (7 - currentStreak) // Últimos dias da sequência atual
    };
  });
  
  return (
    <div className="space-y-6">
      {/* Current Streak */}
      <div className="text-center">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <Flame className="h-8 w-8 text-orange-600" />
          <div className="text-4xl font-bold text-orange-600">
            {currentStreak}
          </div>
        </div>
        
        <h3 className="text-lg font-semibold text-gray-900">
          Dias Consecutivos
        </h3>
        <p className="text-sm text-gray-600">
          Continue estudando para manter sua sequência!
        </p>
      </div>
      
      {/* Weekly Activity */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-gray-900">
          Atividade dos Últimos 7 Dias
        </h4>
        
        <div className="flex items-center justify-between">
          {last7Days.map((day, index) => (
            <TooltipProvider key={index}>
              <Tooltip>
                <TooltipTrigger>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    day.active 
                      ? 'bg-orange-500 text-white' 
                      : 'bg-gray-200 text-gray-400'
                  }`}>
                    {day.active ? (
                      <Flame className="h-4 w-4" />
                    ) : (
                      <div className="w-2 h-2 bg-current rounded-full" />
                    )}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>
                    {day.date.toLocaleDateString('pt-BR', { 
                      weekday: 'short', 
                      day: 'numeric', 
                      month: 'short' 
                    })}
                  </p>
                  <p className="text-xs">
                    {day.active ? 'Ativo' : 'Inativo'}
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
        
        <div className="flex items-center justify-center space-x-1 text-xs text-gray-500">
          <span>Dom</span>
          <span>Seg</span>
          <span>Ter</span>
          <span>Qua</span>
          <span>Qui</span>
          <span>Sex</span>
          <span>Sáb</span>
        </div>
      </div>
      
      {/* Streak Stats */}
      <div className="grid grid-cols-2 gap-4">
        <div className="text-center p-3 bg-orange-50 rounded-lg">
          <div className="text-lg font-bold text-orange-600">
            {currentStreak}
          </div>
          <p className="text-xs text-orange-800">Sequência Atual</p>
        </div>
        
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="text-lg font-bold text-yellow-600">
            {longestStreak}
          </div>
          <p className="text-xs text-yellow-800">Melhor Sequência</p>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// COMPONENTE: SEÇÃO DE BADGES
// =====================================================

function BadgesSection({ 
  badges, 
  selectedCategory, 
  onCategoryChange, 
  onBadgeClick 
}: {
  badges: BadgeType[];
  selectedCategory: string;
  onCategoryChange: (category: string) => void;
  onBadgeClick: (badgeId: string) => void;
}) {
  const filteredBadges = selectedCategory === 'all' 
    ? badges 
    : badges.filter(badge => badge.category === selectedCategory);
  
  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        <Button
          variant={selectedCategory === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => onCategoryChange('all')}
        >
          Todos
        </Button>
        
        {BADGE_CATEGORIES.map((category) => {
          const Icon = category.icon;
          return (
            <Button
              key={category.id}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => onCategoryChange(category.id)}
              className="flex items-center space-x-1 whitespace-nowrap"
            >
              <Icon className="h-4 w-4" />
              <span>{category.name}</span>
            </Button>
          );
        })}
      </div>
      
      {/* Badges Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
        {filteredBadges.map((badge) => (
          <motion.div
            key={badge.id}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="cursor-pointer"
            onClick={() => onBadgeClick(badge.id)}
          >
            <Card className="text-center p-4 hover:shadow-lg transition-shadow">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Medal className="h-8 w-8 text-yellow-600" />
              </div>
              
              <h4 className="font-medium text-gray-900 text-sm mb-1">
                {badge.name}
              </h4>
              
              <p className="text-xs text-gray-600 mb-2">
                {badge.description}
              </p>
              
              <Badge variant="secondary" className="text-xs">
                {badge.earned_at ? 'Conquistado' : 'Bloqueado'}
              </Badge>
              
              {badge.earned_at && (
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(badge.earned_at).toLocaleDateString('pt-BR')}
                </p>
              )}
            </Card>
          </motion.div>
        ))}
      </div>
      
      {filteredBadges.length === 0 && (
        <div className="text-center py-12">
          <Medal className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Nenhum badge encontrado
          </h3>
          <p className="text-gray-600">
            {selectedCategory === 'all' 
              ? 'Você ainda não possui badges. Continue estudando!' 
              : 'Nenhum badge nesta categoria ainda.'}
          </p>
        </div>
      )}
    </div>
  );
}

// =====================================================
// COMPONENTE: SEÇÃO DE CONQUISTAS
// =====================================================

function AchievementsSection({ achievements }: { achievements: Achievement[] }) {
  const [filter, setFilter] = useState<'all' | 'unlocked' | 'locked'>('all');
  
  const filteredAchievements = achievements.filter(achievement => {
    if (filter === 'unlocked') return achievement.unlocked;
    if (filter === 'locked') return !achievement.unlocked;
    return true;
  });
  
  return (
    <div className="space-y-6">
      {/* Filter */}
      <div className="flex items-center space-x-2">
        <Button
          variant={filter === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          Todas
        </Button>
        <Button
          variant={filter === 'unlocked' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('unlocked')}
        >
          Conquistadas
        </Button>
        <Button
          variant={filter === 'locked' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setFilter('locked')}
        >
          Bloqueadas
        </Button>
      </div>
      
      {/* Achievements List */}
      <div className="space-y-4">
        {filteredAchievements.map((achievement) => {
          const Icon = achievement.icon;
          const progressPercentage = (achievement.progress / achievement.maxProgress) * 100;
          
          return (
            <Card key={achievement.id} className={`p-4 ${
              achievement.unlocked ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200' : ''
            }`}>
              <div className="flex items-center space-x-4">
                <div className={`p-3 rounded-full ${
                  achievement.unlocked 
                    ? 'bg-yellow-100 text-yellow-600' 
                    : 'bg-gray-100 text-gray-400'
                }`}>
                  <Icon className="h-6 w-6" />
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">
                      {achievement.title}
                    </h4>
                    
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant="secondary" 
                        className={`${
                          achievement.rarity === 'legendary' ? 'bg-purple-100 text-purple-800' :
                          achievement.rarity === 'epic' ? 'bg-blue-100 text-blue-800' :
                          achievement.rarity === 'rare' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {achievement.rarity === 'legendary' ? 'Lendário' :
                         achievement.rarity === 'epic' ? 'Épico' :
                         achievement.rarity === 'rare' ? 'Raro' : 'Comum'}
                      </Badge>
                      
                      <span className="text-sm font-medium text-yellow-600">
                        +{achievement.points} pts
                      </span>
                    </div>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">
                    {achievement.description}
                  </p>
                  
                  {!achievement.unlocked && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Progresso</span>
                        <span>{achievement.progress} / {achievement.maxProgress}</span>
                      </div>
                      <Progress value={progressPercentage} className="w-full" />
                    </div>
                  )}
                  
                  {achievement.unlocked && achievement.unlockedAt && (
                    <p className="text-xs text-green-600 font-medium">
                      Conquistado em {achievement.unlockedAt.toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

// =====================================================
// COMPONENTE: SEÇÃO DE RANKING
// =====================================================

function LeaderboardSection({ 
  ranking, 
  currentUser 
}: {
  ranking: UserRanking[];
  currentUser: {
    id: string;
    name?: string;
    avatar_url?: string;
  } | null;
}) {
  const [period, setPeriod] = useState<'week' | 'month' | 'all'>('month');
  
  const topUsers = ranking.slice(0, 10);
  const currentUserRank = ranking.findIndex(user => user.id === currentUser?.id) + 1;
  
  return (
    <div className="space-y-6">
      {/* Period Filter */}
      <div className="flex items-center space-x-2">
        <Button
          variant={period === 'week' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPeriod('week')}
        >
          Esta Semana
        </Button>
        <Button
          variant={period === 'month' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPeriod('month')}
        >
          Este Mês
        </Button>
        <Button
          variant={period === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setPeriod('all')}
        >
          Geral
        </Button>
      </div>
      
      {/* Top 3 Podium */}
      <Card>
        <CardHeader>
          <CardTitle className="text-center">🏆 Top 3 do Ranking</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-end justify-center space-x-8">
            {/* 2nd Place */}
            {topUsers[1] && (
              <div className="text-center">
                <div className="w-16 h-20 bg-gray-200 rounded-t-lg flex items-end justify-center pb-2">
                  <span className="text-2xl font-bold text-gray-600">2</span>
                </div>
                <Avatar className="w-12 h-12 mx-auto -mt-6 border-4 border-white">
                  <AvatarImage src={topUsers[1].avatar_url} />
                  <AvatarFallback>{topUsers[1].name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="text-sm font-medium mt-2">{topUsers[1].name}</p>
                <p className="text-xs text-gray-600">{topUsers[1].total_points} pts</p>
              </div>
            )}
            
            {/* 1st Place */}
            {topUsers[0] && (
              <div className="text-center">
                <div className="w-16 h-24 bg-yellow-400 rounded-t-lg flex items-end justify-center pb-2">
                  <Crown className="h-6 w-6 text-yellow-800" />
                </div>
                <Avatar className="w-16 h-16 mx-auto -mt-8 border-4 border-white">
                  <AvatarImage src={topUsers[0].avatar_url} />
                  <AvatarFallback>{topUsers[0].name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="text-sm font-medium mt-2">{topUsers[0].name}</p>
                <p className="text-xs text-gray-600">{topUsers[0].total_points} pts</p>
              </div>
            )}
            
            {/* 3rd Place */}
            {topUsers[2] && (
              <div className="text-center">
                <div className="w-16 h-16 bg-orange-300 rounded-t-lg flex items-end justify-center pb-2">
                  <span className="text-2xl font-bold text-orange-800">3</span>
                </div>
                <Avatar className="w-12 h-12 mx-auto -mt-6 border-4 border-white">
                  <AvatarImage src={topUsers[2].avatar_url} />
                  <AvatarFallback>{topUsers[2].name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <p className="text-sm font-medium mt-2">{topUsers[2].name}</p>
                <p className="text-xs text-gray-600">{topUsers[2].total_points} pts</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* Full Ranking */}
      <Card>
        <CardHeader>
          <CardTitle>Ranking Completo</CardTitle>
          {currentUserRank > 0 && (
            <CardDescription>
              Sua posição: {currentUserRank}º lugar
            </CardDescription>
          )}
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topUsers.map((user, index) => (
              <div 
                key={user.id} 
                className={`flex items-center space-x-3 p-3 rounded-lg ${
                  user.id === currentUser?.id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-50'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  index === 0 ? 'bg-yellow-100 text-yellow-800' :
                  index === 1 ? 'bg-gray-100 text-gray-800' :
                  index === 2 ? 'bg-orange-100 text-orange-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {index + 1}
                </div>
                
                <Avatar className="h-10 w-10">
                  <AvatarImage src={user.avatar_url} />
                  <AvatarFallback>{user.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                
                <div className="flex-1">
                  <p className="font-medium text-gray-900">
                    {user.name}
                    {user.id === currentUser?.id && (
                      <Badge variant="outline" className="ml-2 text-xs">
                        Você
                      </Badge>
                    )}
                  </p>
                  <p className="text-sm text-gray-600">
                    Nível {user.level} • {user.completed_modules} módulos concluídos
                  </p>
                </div>
                
                <div className="text-right">
                  <p className="font-bold text-gray-900">
                    {user.total_points.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-600">pontos</p>
                </div>
                
                {index < 3 && (
                  <div className="text-right">
                    {index === 0 && <Trophy className="h-5 w-5 text-yellow-600" />}
                    {index === 1 && <Medal className="h-5 w-5 text-gray-600" />}
                    {index === 2 && <Award className="h-5 w-5 text-orange-600" />}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// =====================================================
// COMPONENTE: MODAL DE DETALHES DO BADGE
// =====================================================

function BadgeDetailsModal({ 
  badgeId, 
  badges, 
  onClose 
}: {
  badgeId: string | null;
  badges: BadgeType[];
  onClose: () => void;
}) {
  const badge = badges.find(b => b.id === badgeId);
  
  if (!badge) return null;
  
  return (
    <Dialog open={!!badgeId} onOpenChange={onClose}>
      <DialogContent className="w-[70vw] max-w-xl h-[60vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center">
            Detalhes do Badge
          </DialogTitle>
        </DialogHeader>
        
        <div className="text-center space-y-4">
          <div className="w-24 h-24 bg-yellow-100 rounded-full flex items-center justify-center mx-auto">
            <Medal className="h-12 w-12 text-yellow-600" />
          </div>
          
          <div>
            <h3 className="text-xl font-bold text-gray-900">
              {badge.name}
            </h3>
            <p className="text-gray-600 mt-2">
              {badge.description}
            </p>
          </div>
          
          <div className="space-y-2">
            <Badge 
              variant="secondary" 
              className={badge.earned_at ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}
            >
              {badge.earned_at ? 'Conquistado' : 'Bloqueado'}
            </Badge>
            
            {badge.earned_at && (
              <p className="text-sm text-gray-600">
                Conquistado em {new Date(badge.earned_at).toLocaleDateString('pt-BR')}
              </p>
            )}
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-900 mb-2">
              Como conquistar este badge:
            </h4>
            <p className="text-sm text-gray-600">
              {badge.requirements || 'Complete os requisitos específicos para este badge.'}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// =====================================================
// COMPONENTE: VISÃO COMPACTA
// =====================================================

function CompactGamificationView({ gamificationData }: { gamificationData: GamificationData }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="p-4">
        <div className="flex items-center space-x-2">
          <Zap className="h-5 w-5 text-purple-600" />
          <div>
            <p className="text-sm text-gray-600">Pontos</p>
            <p className="font-bold">{gamificationData?.total_points || 0}</p>
          </div>
        </div>
      </Card>
      
      <Card className="p-4">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          <div>
            <p className="text-sm text-gray-600">Nível</p>
            <p className="font-bold">{gamificationData?.level || 1}</p>
          </div>
        </div>
      </Card>
      
      <Card className="p-4">
        <div className="flex items-center space-x-2">
          <Medal className="h-5 w-5 text-yellow-600" />
          <div>
            <p className="text-sm text-gray-600">Badges</p>
            <p className="font-bold">{gamificationData?.badges?.length || 0}</p>
          </div>
        </div>
      </Card>
      
      <Card className="p-4">
        <div className="flex items-center space-x-2">
          <Flame className="h-5 w-5 text-orange-600" />
          <div>
            <p className="text-sm text-gray-600">Sequência</p>
            <p className="font-bold">{gamificationData?.current_streak || 0}</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default GamificationPanel;