import React, { useState, useEffect, Suspense, lazy, useCallback, useMemo } from 'react';
import TrainingModulesList from '../components/TrainingModulesList';
import { 
  GraduationCap, 
  Target, 
  TrendingUp, 
  Play, 
  Clock, 
  Award, 
  Users, 
  BookOpen, 
  Star,
  Filter,
  Search,
  Plus,
  Settings,
  Edit3,
  Video,
  FileText,
  Share2,
  BarChart3,
  Zap,
  Brain,
  Network,
  Workflow,
  Upload,
  Download,
  Eye,
  ChevronRight,
  Calendar,
  Trophy,
  Flame,
  CheckCircle,
  X,
  Wrench
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// Lazy loading dos componentes pesados para melhor performance
const ContentEditor = lazy(() => import('../features/training/components/ContentEditor'));
const DiagramEditor = lazy(() => import('../components/diagrams/UnifiedDiagramEditor').then(m => ({ default: m.UnifiedDiagramEditor })));

// Loading component para Suspense
const LoadingSpinner = React.memo(() => (
  <div className="flex items-center justify-center p-8">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
    <span className="ml-3 text-gray-600">Carregando...</span>
  </div>
));

// Componente otimizado para cards de estatísticas
const StatCard = React.memo(({ icon: Icon, title, value, change, color }: {
  icon: any;
  title: string;
  value: string;
  change: string;
  color: string;
}) => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div className="flex items-center">
        <div className={`p-2 sm:p-3 rounded-xl ${color} mr-3 sm:mr-4`}>
          <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
        </div>
        <div>
          <p className="text-xs sm:text-sm font-medium text-gray-600">{title}</p>
          <p className="text-lg sm:text-2xl font-bold text-gray-900">{value}</p>
        </div>
      </div>
      <div className="text-right">
        <span className="text-xs sm:text-sm font-medium text-green-600">{change}</span>
      </div>
    </div>
  </div>
));

// Componente ModuleCard otimizado com React.memo
const ModuleCard = React.memo(({ module, onStart, IconComponent }: {
  module: {
    id: number;
    title: string;
    subtitle: string;
    level: string;
    levelColor: string;
    gradient: string;
    duration: string;
    students: string;
    rating: number;
    reviews: number;
    description: string;
    progress: number;
  };
  onStart: () => void;
  IconComponent: React.ComponentType<any>;
}) => (
  <div className="group bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
    <div className={`relative h-48 bg-gradient-to-br ${module.gradient} overflow-hidden`}>
      <div className="absolute inset-0 bg-black/20"></div>
      <div className="absolute top-4 left-4">
        <span className={`${module.levelColor} text-white px-2 py-1 rounded-full text-xs font-medium`}>
          {module.level}
        </span>
      </div>
      <div className="absolute bottom-4 left-4 text-white">
        <h3 className="text-xl font-bold mb-1">{module.title}</h3>
        <p className="text-sm opacity-90">{module.subtitle}</p>
      </div>
      <div className="absolute top-4 right-4">
        <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
          <IconComponent className="h-6 w-6 text-white" />
        </div>
      </div>
      {module.progress > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
          <div 
            className="h-full bg-white transition-all duration-500"
            style={{ width: `${module.progress}%` }}
          ></div>
        </div>
      )}
    </div>
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Clock className="h-4 w-4" />
          <span>{module.duration}</span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Users className="h-4 w-4" />
          <span>{module.students}</span>
        </div>
      </div>
      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
        {module.description}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Star className="h-4 w-4 text-yellow-400 fill-current" />
          <span className="text-sm font-medium">{module.rating}</span>
          <span className="text-xs text-gray-500">({module.reviews})</span>
        </div>
        <button 
          onClick={onStart}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            module.progress > 0 
              ? 'bg-primary text-white hover:bg-primary/90' 
              : module.progress === 0 && module.id <= 2
                ? 'bg-primary text-white hover:bg-primary/90'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          {module.progress > 0 ? 'Continuar' : module.id <= 2 ? 'Iniciar' : 'Em Breve'}
        </button>
      </div>
    </div>
  </div>
));

const TrainingPage: React.FC = () => {
  const { user, profile } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showContentEditor, setShowContentEditor] = useState(false);
  const [showDiagramEditor, setShowDiagramEditor] = useState(false);
  const [activeAdminTab, setActiveAdminTab] = useState('content');
  
  // Memoização da verificação de admin para evitar recálculos
  const isAdmin = useMemo(() => {
    return profile?.access_type === 'admin' || profile?.access_type === 'super_admin' || profile?.access_type === 'engenheiro';
  }, [profile?.access_type]);


  
  // Callbacks otimizados para evitar re-renders desnecessários
  const handleStartModule = useCallback((moduleId: string) => {
    console.log('Iniciando módulo:', moduleId);
    // Lógica para iniciar módulo
  }, []);
  
  const handleCloseContentEditor = useCallback(() => {
    setShowContentEditor(false);
  }, []);
  
  const handleCloseDiagramEditor = useCallback(() => {
    setShowDiagramEditor(false);
  }, []);
  
  const handleSaveContent = useCallback((content: any) => {
    console.log('Salvando conteúdo:', content);
    setShowContentEditor(false);
  }, []);
  
  const handleTabChange = useCallback((tab: string) => {
    setActiveAdminTab(tab);
  }, []);
  
  // Enhanced mock data with more detailed progress tracking - memoizado
  const userProgress = useMemo(() => ({
    completedModules: 2,
    totalModules: 8,
    totalHours: 24,
    completedHours: 6,
    certificates: 1,
    currentStreak: 5,
    weeklyGoal: 10,
    weeklyProgress: 6,
    monthlyPoints: 1250,
    rank: 'Especialista Solar',
    nextMilestone: 'Mestre em Energia Solar',
    pointsToNextRank: 750,
    recentAchievements: [
      { id: 1, title: 'Primeira Semana Completa', icon: '🔥', date: '2024-01-15' },
      { id: 2, title: 'Módulo Básico Concluído', icon: '🎯', date: '2024-01-10' }
    ],
    upcomingDeadlines: [
      { id: 1, title: 'Avaliação Intermediária', date: '2024-01-25', type: 'assessment' },
      { id: 2, title: 'Projeto Final', date: '2024-02-01', type: 'project' }
    ]
  }), []);
  
  // Cálculos de progresso memoizados para evitar recálculos desnecessários
  const progressStats = useMemo(() => {
    const progressPercentage = Math.round((userProgress.completedModules / userProgress.totalModules) * 100);
    const hoursPercentage = Math.round((userProgress.completedHours / userProgress.totalHours) * 100);
    const weeklyPercentage = Math.round((userProgress.weeklyProgress / userProgress.weeklyGoal) * 100);
    const rankProgress = Math.round(((userProgress.monthlyPoints % 1000) / 1000) * 100);
    
    return { progressPercentage, hoursPercentage, weeklyPercentage, rankProgress };
  }, [userProgress]);

  // Dados dos módulos memoizados para evitar recriação a cada render
  const trainingModules = useMemo(() => [
    {
      id: 1,
      title: 'Fundamentos de Energia Solar',
      subtitle: 'Conceitos básicos e introdução',
      level: 'Básico',
      levelColor: 'bg-green-500',
      gradient: 'from-blue-500 to-blue-600',
      icon: GraduationCap,
      duration: '4h 30min',
      students: '1.2k alunos',
      rating: 4.8,
      reviews: 324,
      description: 'Aprenda os conceitos fundamentais da energia solar fotovoltaica, desde a física básica até as aplicações práticas.',
      progress: 75
    },
    {
      id: 2,
      title: 'Dimensionamento de Sistemas',
      subtitle: 'Cálculos e projetos',
      level: 'Intermediário',
      levelColor: 'bg-orange-500',
      gradient: 'from-orange-500 to-red-500',
      icon: Target,
      duration: '6h 15min',
      students: '890 alunos',
      rating: 4.9,
      reviews: 156,
      description: 'Domine os cálculos e metodologias para dimensionar sistemas fotovoltaicos residenciais e comerciais.',
      progress: 45
    },
    {
      id: 3,
      title: 'Instalação e Manutenção',
      subtitle: 'Práticas de campo',
      level: 'Avançado',
      levelColor: 'bg-purple-500',
      gradient: 'from-purple-500 to-indigo-600',
      icon: Wrench,
      duration: '8h 45min',
      students: '567 alunos',
      rating: 4.7,
      reviews: 89,
      description: 'Técnicas avançadas de instalação, comissionamento e manutenção preventiva de sistemas solares.',
      progress: 0
    }
  ], []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-yellow-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden" style={{ background: 'var(--gradient-hero)' }}>
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl shadow-solar">
                <GraduationCap className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Centro de <span className="text-accent">Treinamentos</span>
            </h1>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              Transforme seu conhecimento em energia solar com nossa plataforma de aprendizado premium
            </p>
            
            {/* Enhanced Progress Overview */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-5xl mx-auto">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 hover:bg-white/15 transition-all duration-300 shadow-energy">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xl sm:text-2xl font-bold text-white">{progressStats.progressPercentage}%</div>
                  <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5 text-white/80" />
                </div>
                <div className="text-xs sm:text-sm text-white/90">Progresso Geral</div>
                <div className="w-full bg-white/20 rounded-full h-1.5 mt-2">
                  <div className="bg-accent h-1.5 rounded-full transition-all duration-500" style={{ width: `${progressStats.progressPercentage}%` }}></div>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 hover:bg-white/15 transition-all duration-300 shadow-energy">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xl sm:text-2xl font-bold text-white">{userProgress.completedModules}</div>
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-white/80" />
                </div>
                <div className="text-xs sm:text-sm text-white/90">Módulos Concluídos</div>
                <div className="text-xs text-white/70 mt-1">{userProgress.totalModules - userProgress.completedModules} restantes</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 hover:bg-white/15 transition-all duration-300 shadow-energy">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xl sm:text-2xl font-bold text-white">{userProgress.completedHours}h</div>
                  <Clock className="h-4 w-4 sm:h-5 sm:w-5 text-white/80" />
                </div>
                <div className="text-xs sm:text-sm text-white/90">Horas de Estudo</div>
                <div className="text-xs text-white/70 mt-1">{userProgress.totalHours - userProgress.completedHours}h restantes</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 hover:bg-white/15 transition-all duration-300 shadow-energy">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xl sm:text-2xl font-bold text-white">{userProgress.currentStreak}</div>
                  <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
                </div>
                <div className="text-xs sm:text-sm text-white/90">Dias Consecutivos</div>
                <div className="text-xs text-white/70 mt-1">Sequência ativa</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Quick Actions & Search */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div className="flex-1 w-full sm:max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar treinamentos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent bg-white shadow-sm"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 border border-primary/20 rounded-lg hover:bg-primary/5 hover:border-primary/40 transition-colors">
              <Filter className="h-4 w-4 text-primary" />
              <span className="text-sm sm:text-base">Filtros</span>
            </button>
            
            {isAdmin && (
              <button className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors shadow-solar">
                <Plus className="h-4 w-4" />
                <span className="text-sm sm:text-base">Novo Módulo</span>
              </button>
            )}
          </div>
        </div>
        
        {/* Enhanced Progress Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">
          {/* Main Progress Card */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Dashboard de Progresso</h3>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Clock className="h-4 w-4" />
                Última atividade: hoje
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Overall Progress */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Progresso Geral</span>
                  <span className="text-sm font-bold text-blue-600">{progressStats.progressPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="h-4 rounded-full transition-all duration-500 relative overflow-hidden"
                    style={{ width: `${progressStats.progressPercentage}%`, background: 'var(--gradient-solar)' }}
                  >
                    <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {userProgress.completedModules} de {userProgress.totalModules} módulos concluídos
                </p>
              </div>
              
              {/* Hours Progress */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Horas de Estudo</span>
                  <span className="text-sm font-bold text-green-600">{progressStats.hoursPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-success h-4 rounded-full transition-all duration-500"
                    style={{ width: `${progressStats.hoursPercentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {userProgress.completedHours}h de {userProgress.totalHours}h totais
                </p>
              </div>
              
              {/* Weekly Goal Progress */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium text-gray-700">Meta Semanal</span>
                  <span className="text-sm font-bold text-orange-600">{progressStats.weeklyPercentage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4">
                  <div 
                    className="bg-warning h-4 rounded-full transition-all duration-500"
                    style={{ width: `${progressStats.weeklyPercentage}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {userProgress.weeklyProgress}h de {userProgress.weeklyGoal}h esta semana
                </p>
              </div>
            </div>
          </div>
          
          {/* Enhanced Stats Cards */}
          <div className="space-y-3 sm:space-y-4">
            <div className="rounded-2xl p-4 sm:p-6 text-white shadow-energy" style={{ background: 'var(--gradient-energy)' }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-xs sm:text-sm">Sequência Atual</p>
                  <p className="text-xl sm:text-2xl font-bold">{userProgress.currentStreak} dias</p>
                  <p className="text-xs text-white/70 mt-1">Mantenha o ritmo!</p>
                </div>
                <div className="p-2 sm:p-3 bg-white/20 rounded-xl">
                  <Flame className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
              </div>
            </div>
            
            <div className="bg-primary rounded-2xl p-4 sm:p-6 text-white shadow-solar">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-xs sm:text-sm">Rank Atual</p>
                  <p className="text-base sm:text-lg font-bold">{userProgress.rank}</p>
                  <p className="text-xs text-white/70 mt-1">{userProgress.pointsToNextRank} pts para {userProgress.nextMilestone}</p>
                </div>
                <div className="p-2 sm:p-3 bg-white/20 rounded-xl">
                  <Trophy className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
              </div>
              <div className="w-full bg-white/20 rounded-full h-2 mt-3">
                <div 
                  className="bg-accent h-2 rounded-full transition-all duration-500"
                  style={{ width: `${progressStats.rankProgress}%` }}
                ></div>
              </div>
            </div>
            
            <div className="bg-success rounded-2xl p-4 sm:p-6 text-white shadow-glow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-xs sm:text-sm">Pontos do Mês</p>
                  <p className="text-xl sm:text-2xl font-bold">{userProgress.monthlyPoints}</p>
                  <p className="text-xs text-white/70 mt-1">+150 esta semana</p>
                </div>
                <div className="p-2 sm:p-3 bg-white/20 rounded-xl">
                  <Zap className="h-5 w-5 sm:h-6 sm:w-6" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Recent Achievements & Upcoming Deadlines */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-8">
          {/* Recent Achievements */}
          <div className="bg-white rounded-2xl shadow-solar border border-gray-100 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Star className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-accent" />
              <span className="text-base sm:text-lg">Conquistas Recentes</span>
            </h3>
            <div className="space-y-3">
              {userProgress.recentAchievements.map((achievement) => (
                <div key={achievement.id} className="flex items-center gap-2 sm:gap-3 p-3 bg-accent/5 rounded-lg">
                  <span className="text-xl sm:text-2xl flex-shrink-0">{achievement.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-medium text-gray-900 truncate">{achievement.title}</p>
                    <p className="text-xs sm:text-sm text-gray-500">{achievement.date}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Upcoming Deadlines */}
          <div className="bg-white rounded-2xl shadow-energy border border-gray-100 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Calendar className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-primary" />
              <span className="text-base sm:text-lg">Próximos Prazos</span>
            </h3>
            <div className="space-y-3">
              {userProgress.upcomingDeadlines.map((deadline) => (
                <div key={deadline.id} className="flex items-center gap-2 sm:gap-3 p-3 bg-primary/5 rounded-lg">
                  <div className={`p-2 rounded-lg flex-shrink-0 ${
                    deadline.type === 'assessment' ? 'bg-warning/10 text-warning' : 'bg-primary/10 text-primary'
                  }`}>
                    {deadline.type === 'assessment' ? <Target className="h-3 w-3 sm:h-4 sm:w-4" /> : <BookOpen className="h-3 w-3 sm:h-4 sm:w-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm sm:text-base font-medium text-gray-900 truncate">{deadline.title}</p>
                    <p className="text-xs sm:text-sm text-gray-500">{deadline.date}</p>
                  </div>
                  <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Enhanced Admin Panel for Super Admins */}
        {isAdmin && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-4 sm:mb-6">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center">
                <Settings className="h-5 w-5 sm:h-6 sm:w-6 mr-2 sm:mr-3 text-primary" />
                <span className="hidden sm:inline">Painel Administrativo</span>
                <span className="sm:hidden">Admin</span>
              </h2>
              <div className="flex items-center gap-2">
                <span className="px-2 sm:px-3 py-1 bg-purple-100 text-purple-700 text-xs sm:text-sm font-medium rounded-full">
                  Super Admin
                </span>
                <span className="px-2 sm:px-3 py-1 bg-green-100 text-green-700 text-xs sm:text-sm font-medium rounded-full">
                  {user?.email}
                </span>
              </div>
            </div>
            
            {/* Admin Tabs */}
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-4 sm:mb-6">
              <button
                onClick={() => setActiveAdminTab('content')}
                className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
                  activeAdminTab === 'content'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Edit3 className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Editor de Conteúdo</span>
                <span className="sm:hidden">Editor</span>
              </button>
              <button
                onClick={() => setActiveAdminTab('media')}
                className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
                  activeAdminTab === 'media'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Video className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Mídia & Playbooks</span>
                <span className="sm:hidden">Mídia</span>
              </button>
              <button
                onClick={() => setActiveAdminTab('diagrams')}
                className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
                  activeAdminTab === 'diagrams'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Network className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Diagramas</span>
                <span className="sm:hidden">Diag.</span>
              </button>
              <button
                onClick={() => setActiveAdminTab('analytics')}
                className={`flex-1 flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-md text-xs sm:text-sm font-medium transition-all ${
                  activeAdminTab === 'analytics'
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Analytics</span>
                <span className="sm:hidden">Stats</span>
              </button>
            </div>
            
            {/* Admin Content */}
            <div className="min-h-[200px]">
              {activeAdminTab === 'content' && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <button
                      onClick={() => setShowContentEditor(true)}
                      className="p-4 sm:p-6 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group"
                    >
                      <div className="text-center">
                        <div className="p-3 bg-white/20 rounded-xl mb-4 group-hover:scale-110 transition-transform mx-auto w-fit">
                          <Edit3 className="h-6 w-6" />
                        </div>
                        <h3 className="text-base font-semibold mb-2">Novo Módulo</h3>
                        <p className="text-sm text-white/80">Criar módulo de treinamento completo</p>
                      </div>
                    </button>
                    
                    <button className="p-4 sm:p-6 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
                      <div className="text-center">
                        <div className="p-3 bg-white/20 rounded-xl mb-4 group-hover:scale-110 transition-transform mx-auto w-fit">
                          <FileText className="h-6 w-6" />
                        </div>
                        <h3 className="text-base font-semibold mb-2">Playbook</h3>
                        <p className="text-sm text-white/80">Criar guias e manuais interativos</p>
                      </div>
                    </button>
                    
                    <button className="p-4 sm:p-6 bg-gradient-to-br from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
                      <div className="text-center">
                        <div className="p-3 bg-white/20 rounded-xl mb-4 group-hover:scale-110 transition-transform mx-auto w-fit">
                          <Brain className="h-6 w-6" />
                        </div>
                        <h3 className="text-base font-semibold mb-2">Quiz/Avaliação</h3>
                        <p className="text-sm text-white/80">Criar avaliações e certificações</p>
                      </div>
                    </button>
                  </div>
                </div>
              )}
              
              {activeAdminTab === 'media' && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <button className="p-4 sm:p-6 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
                      <div className="text-center">
                        <div className="p-3 bg-white/20 rounded-xl mb-4 group-hover:scale-110 transition-transform mx-auto w-fit">
                          <Video className="h-6 w-6" />
                        </div>
                        <h3 className="text-base font-semibold mb-2">Upload de Vídeo</h3>
                        <p className="text-sm text-white/80">Vídeos com watermark e proteção</p>
                      </div>
                    </button>
                    
                    <button className="p-4 sm:p-6 bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
                      <div className="text-center">
                        <div className="p-3 bg-white/20 rounded-xl mb-4 group-hover:scale-110 transition-transform mx-auto w-fit">
                          <Upload className="h-6 w-6" />
                        </div>
                        <h3 className="text-base font-semibold mb-2">Upload de Arquivo</h3>
                        <p className="text-sm text-white/80">PDFs, documentos e apresentações</p>
                      </div>
                    </button>
                    
                    <button className="p-4 sm:p-6 bg-gradient-to-br from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
                      <div className="text-center">
                        <div className="p-3 bg-white/20 rounded-xl mb-4 group-hover:scale-110 transition-transform mx-auto w-fit">
                          <Eye className="h-6 w-6" />
                        </div>
                        <h3 className="text-base font-semibold mb-2">Biblioteca de Mídia</h3>
                        <p className="text-sm text-white/80">Gerenciar arquivos existentes</p>
                      </div>
                    </button>
                  </div>
                  
                  <div className="p-3 sm:p-4 bg-gray-50 rounded-lg">
                    <h4 className="text-sm sm:text-base font-medium text-gray-900 mb-2">Arquivos Recentes</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 sm:gap-3">
                      {[1, 2, 3, 4].map((item) => (
                        <div key={item} className="aspect-video bg-gray-200 rounded-lg flex items-center justify-center">
                          <Play className="h-4 w-4 sm:h-6 sm:w-6 text-gray-400" />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {activeAdminTab === 'diagrams' && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <button
                      onClick={() => setShowDiagramEditor(true)}
                      className="p-4 sm:p-6 bg-gradient-to-br from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group"
                    >
                      <div className="text-center">
                        <div className="p-3 bg-white/20 rounded-xl mb-4 group-hover:scale-110 transition-transform mx-auto w-fit">
                          <Workflow className="h-6 w-6" />
                        </div>
                        <h3 className="text-base font-semibold mb-2">Fluxograma</h3>
                        <p className="text-sm text-white/80">Criar fluxos de processo</p>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => setShowDiagramEditor(true)}
                      className="p-4 sm:p-6 bg-gradient-to-br from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700 text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group"
                    >
                      <div className="text-center">
                        <div className="p-3 bg-white/20 rounded-xl mb-4 group-hover:scale-110 transition-transform mx-auto w-fit">
                          <Network className="h-6 w-6" />
                        </div>
                        <h3 className="text-base font-semibold mb-2">Organograma</h3>
                        <p className="text-sm text-white/80">Estruturas organizacionais</p>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => setShowDiagramEditor(true)}
                      className="p-4 sm:p-6 bg-gradient-to-br from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group"
                    >
                      <div className="text-center">
                        <div className="p-3 bg-white/20 rounded-xl mb-4 group-hover:scale-110 transition-transform mx-auto w-fit">
                          <Brain className="h-6 w-6" />
                        </div>
                        <h3 className="text-base font-semibold mb-2">Mind Map</h3>
                        <p className="text-sm text-white/80">Mapas mentais interativos</p>
                      </div>
                    </button>
                  </div>
                  
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Diagramas Recentes</h4>
                      <button className="text-sm text-blue-600 hover:text-blue-700">Ver todos</button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { title: 'Processo de Instalação Solar', type: 'Fluxograma', date: '2024-01-15' },
                        { title: 'Estrutura da Equipe', type: 'Organograma', date: '2024-01-12' }
                      ].map((diagram, index) => (
                        <div key={index} className="p-3 bg-white rounded-lg border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <h5 className="font-medium text-gray-900 text-sm">{diagram.title}</h5>
                              <p className="text-xs text-gray-500">{diagram.type} • {diagram.date}</p>
                            </div>
                            <div className="flex items-center gap-1">
                              <button className="p-1 text-gray-400 hover:text-blue-600">
                                <Eye className="h-4 w-4" />
                              </button>
                              <button className="p-1 text-gray-400 hover:text-green-600">
                                <Edit3 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
              
              {activeAdminTab === 'analytics' && (
                <div className="space-y-3 sm:space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                    <button className="p-4 sm:p-6 bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
                      <div className="text-center">
                        <div className="p-3 bg-white/20 rounded-xl mb-4 group-hover:scale-110 transition-transform mx-auto w-fit">
                          <BarChart3 className="h-6 w-6" />
                        </div>
                        <h3 className="text-base font-semibold mb-2">Relatórios</h3>
                        <p className="text-sm text-white/80">Analytics detalhados de progresso</p>
                      </div>
                    </button>
                    
                    <button className="p-4 sm:p-6 bg-gradient-to-br from-cyan-500 to-cyan-600 hover:from-cyan-600 hover:to-cyan-700 text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
                      <div className="text-center">
                        <div className="p-3 bg-white/20 rounded-xl mb-4 group-hover:scale-110 transition-transform mx-auto w-fit">
                          <Users className="h-6 w-6" />
                        </div>
                        <h3 className="text-base font-semibold mb-2">Usuários</h3>
                        <p className="text-sm text-white/80">Gerenciar usuários e permissões</p>
                      </div>
                    </button>
                    
                    <button className="p-4 sm:p-6 bg-gradient-to-br from-slate-500 to-slate-600 hover:from-slate-600 hover:to-slate-700 text-white rounded-xl transition-all duration-300 hover:shadow-lg hover:-translate-y-1 group">
                      <div className="text-center">
                        <div className="p-3 bg-white/20 rounded-xl mb-4 group-hover:scale-110 transition-transform mx-auto w-fit">
                          <Settings className="h-6 w-6" />
                        </div>
                        <h3 className="text-base font-semibold mb-2">Configurações</h3>
                        <p className="text-sm text-white/80">Configurações do sistema</p>
                      </div>
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-3">Estatísticas Rápidas</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Total de Usuários</span>
                          <span className="text-sm font-medium">1,234</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Módulos Ativos</span>
                          <span className="text-sm font-medium">{userProgress.totalModules}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Taxa de Conclusão</span>
                          <span className="text-sm font-medium">78%</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-3">Atividade Recente</h4>
                      <div className="space-y-2">
                        <div className="text-sm text-gray-600">• 15 novos usuários hoje</div>
                        <div className="text-sm text-gray-600">• 3 módulos concluídos</div>
                        <div className="text-sm text-gray-600">• 2 certificados emitidos</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        {/* Training Modules - Astron Members Style */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center">
              <BookOpen className="h-6 w-6 mr-3 text-primary" />
              Módulos de Treinamento
            </h2>
            {isAdmin && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowContentEditor(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Novo Módulo</span>
                </button>
                <button className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-primary transition-colors">
                  <BarChart3 className="h-4 w-4" />
                  <span className="hidden sm:inline">Analytics</span>
                </button>
                <button className="flex items-center gap-2 px-3 py-2 text-gray-600 hover:text-primary transition-colors">
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline">Gerenciar</span>
                </button>
              </div>
            )}
          </div>
          
          {/* Astron Members Style Cards - Renderizados dinamicamente */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trainingModules.map((module) => {
              const IconComponent = module.icon;
              return (
                <ModuleCard
                  key={module.id}
                  module={module}
                  onStart={() => handleStartModule(module.id.toString())}
                  IconComponent={IconComponent}
                />
              );
            })}
          </div>
        </div>

        {/* Enhanced System Status */}
        <div className="mt-8 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div className="p-2 bg-green-100 rounded-xl mr-4">
                <GraduationCap className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-900">Sistema Operacional</h3>
                <p className="text-sm text-green-700">Plataforma de treinamentos funcionando perfeitamente</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-green-600">
                  <span>• 99.9% Uptime</span>
                  <span>• {userProgress.totalModules} Módulos Ativos</span>
                  <span>• Última atualização: hoje</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-green-700">Online</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content Editor Modal */}
      {showContentEditor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Editor de Conteúdo Notion</h2>
              <button
                onClick={() => setShowContentEditor(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
              <Suspense fallback={<LoadingSpinner />}>
                <ContentEditor
                  moduleId="new"
                  onSave={() => setShowContentEditor(false)}
                  onCancel={() => setShowContentEditor(false)}
                  isOpen={showContentEditor}
                />
              </Suspense>
            </div>
          </div>
        </div>
      )}
      
      {/* Diagram Editor Modal */}
      {showDiagramEditor && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-2">
          <div className="bg-white rounded-2xl shadow-2xl w-[95vw] h-[95vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 flex-shrink-0">
              <h2 className="text-xl font-semibold text-gray-900">Editor de Diagramas</h2>
              <button
                onClick={() => setShowDiagramEditor(false)}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <Suspense fallback={<LoadingSpinner />}>
                <DiagramEditor />
              </Suspense>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TrainingPage;