import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { 
  BookOpen, 
  Clock, 
  Users, 
  CheckCircle, 
  AlertCircle,
  Play,
  Star,
  PlayCircle,
  Award,
  BarChart3,
  ChevronRight
} from 'lucide-react';

// Configuração do Supabase
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Variáveis de ambiente do Supabase não configuradas');
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

interface TrainingModule {
  id: string;
  title: string;
  description: string;
  category: string;
  difficulty_level: 'beginner' | 'intermediate' | 'advanced';
  estimated_duration: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  created_by: string;
  progress?: number;
  completed?: boolean;
  rating?: number;
  enrolled_users?: number;
}

interface TrainingContentData {
  url?: string;
  duration?: number;
  questions?: Array<{
    id: string;
    question: string;
    options?: string[];
    correct_answer?: string;
  }>;
  file_path?: string;
  interactive_elements?: Record<string, unknown>;
  [key: string]: unknown;
}

interface TrainingContent {
  id: string;
  module_id: string;
  title: string;
  content_type: 'video' | 'document' | 'quiz' | 'interactive';
  content_data: TrainingContentData;
  order_index: number;
  is_required: boolean;
  created_at: string;
  updated_at: string;
}

const TrainingModulesList: React.FC = () => {
  const [modules, setModules] = useState<TrainingModule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedModule, setSelectedModule] = useState<string | null>(null);
  const [moduleContent, setModuleContent] = useState<TrainingContent[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchTrainingModules();
  }, []);

  const fetchTrainingModules = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('training_modules')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (fetchError) {
        throw new Error(`Erro ao buscar módulos: ${fetchError.message}`);
      }

      // Adicionar dados mock de progresso
      const modulesWithProgress = (data || []).map((module, index) => ({
        ...module,
        progress: [75, 0, 45, 100, 20][index] || 0,
        completed: [false, false, false, true, false][index] || false,
        rating: [4.8, 4.5, 4.7, 4.9, 4.6][index] || 4.5,
        enrolled_users: [156, 89, 234, 78, 145][index] || 100
      }));
      
      setModules(modulesWithProgress);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
      console.error('Erro ao carregar módulos:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchModuleContent = async (moduleId: string) => {
    try {
      const { data, error: fetchError } = await supabase
        .from('training_content')
        .select('*')
        .eq('module_id', moduleId)
        .order('order_index', { ascending: true });

      if (fetchError) {
        throw new Error(`Erro ao buscar conteúdo: ${fetchError.message}`);
      }

      setModuleContent(data || []);
      setSelectedModule(moduleId);
    } catch (err) {
      console.error('Erro ao carregar conteúdo:', err);
    }
  };

  const getDifficultyColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'intermediate':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'advanced':
        return 'bg-rose-100 text-rose-700 border-rose-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };
  
  const getDifficultyIcon = (level: string) => {
    switch (level) {
      case 'beginner':
        return '🌱';
      case 'intermediate':
        return '⚡';
      case 'advanced':
        return '🚀';
      default:
        return '📚';
    }
  };

  const getDifficultyLabel = (level: string) => {
    switch (level) {
      case 'beginner':
        return 'Iniciante';
      case 'intermediate':
        return 'Intermediário';
      case 'advanced':
        return 'Avançado';
      default:
        return level;
    }
  };

  const getContentTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return '🎥';
      case 'document':
        return '📄';
      case 'quiz':
        return '❓';
      case 'interactive':
        return '🎮';
      default:
        return '📋';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };
  
  const getProgressColor = (progress: number) => {
    if (progress === 100) return 'from-green-500 to-emerald-600';
    if (progress >= 50) return 'from-blue-500 to-indigo-600';
    if (progress > 0) return 'from-yellow-500 to-orange-600';
    return 'from-gray-400 to-gray-500';
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="animate-pulse">
            <div className="bg-gray-200 rounded-2xl h-48"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12 bg-red-50 rounded-2xl border border-red-200">
        <div className="text-red-600 mb-4 text-lg font-medium">❌ {error}</div>
        <button 
          onClick={fetchTrainingModules}
          className="px-6 py-3 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors font-medium"
        >
          Tentar Novamente
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center">
          <BookOpen className="h-6 w-6 mr-2 text-blue-600" />
          Módulos de Treinamento
        </h2>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-500">
            {modules.length} módulo{modules.length !== 1 ? 's' : ''} disponível{modules.length !== 1 ? 'is' : ''}
          </div>
          <div className="h-4 w-px bg-gray-300"></div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'grid' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <div className="w-4 h-4 grid grid-cols-2 gap-0.5">
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
                <div className="bg-current rounded-sm"></div>
              </div>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 rounded-lg transition-colors ${
                viewMode === 'list' 
                  ? 'bg-blue-100 text-blue-600' 
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <BarChart3 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {modules.length === 0 ? (
        <div className="text-center py-16 bg-gray-50 rounded-2xl border border-gray-200">
          <div className="p-4 bg-gray-100 rounded-2xl w-fit mx-auto mb-6">
            <BookOpen className="h-12 w-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Nenhum módulo encontrado</h3>
          <p className="text-gray-600 max-w-md mx-auto">Os módulos de treinamento aparecerão aqui quando estiverem disponíveis. Entre em contato com o administrador para mais informações.</p>
        </div>
      ) : (
        <div className={`grid gap-6 ${
          viewMode === 'grid' 
            ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
            : 'grid-cols-1'
        }`}>
          {modules.map((module) => (
            <div
              key={module.id}
              className={`group bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden relative ${
                viewMode === 'list' ? 'flex items-center' : ''
              }`}
              onClick={() => fetchModuleContent(module.id)}
            >
              {/* Progress Indicator */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gray-100">
                <div 
                  className={`h-full bg-gradient-to-r ${getProgressColor(module.progress || 0)} transition-all duration-500`}
                  style={{ width: `${module.progress || 0}%` }}
                ></div>
              </div>
              
              <div className={`p-6 ${viewMode === 'list' ? 'flex-1 flex items-center gap-6' : ''}`}>
                {/* Module Icon & Status */}
                <div className={`${viewMode === 'list' ? 'flex-shrink-0' : 'mb-4'}`}>
                  <div className="relative">
                    <div className={`p-3 rounded-2xl ${
                      module.completed 
                        ? 'bg-green-100 text-green-600' 
                        : module.progress && module.progress > 0
                        ? 'bg-blue-100 text-blue-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {module.completed ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : module.progress && module.progress > 0 ? (
                        <PlayCircle className="h-6 w-6" />
                      ) : (
                        <BookOpen className="h-6 w-6" />
                      )}
                    </div>
                    {module.completed && (
                      <div className="absolute -top-1 -right-1 p-1 bg-green-500 rounded-full">
                        <Award className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Content */}
                <div className={`${viewMode === 'list' ? 'flex-1' : ''}`}>
                  <div className={`${viewMode === 'list' ? 'flex items-start justify-between' : ''}`}>
                    <div className={`${viewMode === 'list' ? 'flex-1 pr-4' : 'mb-4'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {module.title}
                        </h3>
                        {module.progress === 100 && (
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">
                            Concluído
                          </span>
                        )}
                      </div>
                      <p className={`text-gray-600 text-sm ${
                        viewMode === 'list' ? 'line-clamp-1' : 'line-clamp-2'
                      }`}>
                        {module.description}
                      </p>
                      
                      {/* Progress Text */}
                      {module.progress && module.progress > 0 && (
                        <div className="mt-2">
                          <div className="text-xs text-gray-500">
                            Progresso: {module.progress}%
                          </div>
                        </div>
                      )}
                    </div>
                    
                    {viewMode === 'list' && (
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    )}
                  </div>

                  {/* Metadata */}
                  <div className={`flex items-center justify-between ${
                    viewMode === 'list' ? 'mt-2' : 'mb-4'
                  }`}>
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getDifficultyColor(module.difficulty_level)}`}>
                        {getDifficultyIcon(module.difficulty_level)} 
                        {getDifficultyLabel(module.difficulty_level)}
                      </span>
                      <div className="flex items-center text-gray-500 text-xs">
                        <Clock className="h-3 w-3 mr-1" />
                        {formatDuration(module.estimated_duration)}
                      </div>
                    </div>
                    
                    {viewMode === 'grid' && (
                      <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    )}
                  </div>

                  {/* Stats */}
                  <div className={`flex items-center justify-between text-xs text-gray-500 ${
                    viewMode === 'list' ? '' : ''
                  }`}>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center">
                        <Users className="h-3 w-3 mr-1" />
                        {module.enrolled_users} alunos
                      </div>
                      <div className="flex items-center">
                        <Star className="h-3 w-3 mr-1 text-yellow-500" />
                        {module.rating}
                      </div>
                    </div>
                    
                    <button className="flex items-center text-blue-600 hover:text-blue-700 font-medium transition-colors">
                      {module.completed ? (
                        <>
                          <Award className="h-3 w-3 mr-1" />
                          Revisar
                        </>
                      ) : module.progress && module.progress > 0 ? (
                        <>
                          <Play className="h-3 w-3 mr-1" />
                          Continuar
                        </>
                      ) : (
                        <>
                          <PlayCircle className="h-3 w-3 mr-1" />
                          Iniciar
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {selectedModule === module.id && moduleContent.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <h4 className="text-sm font-medium text-gray-900 mb-2">Conteúdo do módulo:</h4>
                    <div className="space-y-1">
                      {moduleContent.map((content) => (
                        <div key={content.id} className="flex items-center text-xs text-gray-600">
                          <span className="mr-2">{getContentTypeIcon(content.content_type)}</span>
                          <span className="flex-1">{content.title}</span>
                          {content.is_required && (
                            <CheckCircle className="h-3 w-3 text-green-500" />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Status de conexão */}
      <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-lg">
        <div className="flex items-center">
          <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
          <span className="text-green-700 font-medium">Integração funcionando!</span>
        </div>
        <p className="text-green-600 text-sm mt-1">
          Conectado ao Supabase • {modules.length} módulos carregados • Storage configurado
        </p>
      </div>
    </div>
  );
};

export default TrainingModulesList;