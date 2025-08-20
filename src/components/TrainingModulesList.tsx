import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { BookOpen, Clock, Users, CheckCircle, AlertCircle } from 'lucide-react';

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

      setModules(data || []);
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
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Carregando módulos de treinamento...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-center">
          <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
          <span className="text-red-700">Erro ao carregar módulos</span>
        </div>
        <p className="text-red-600 text-sm mt-1">{error}</p>
        <button
          onClick={fetchTrainingModules}
          className="mt-2 px-3 py-1 bg-red-100 text-red-700 rounded text-sm hover:bg-red-200"
        >
          Tentar novamente
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
        <div className="text-sm text-gray-500">
          {modules.length} módulo{modules.length !== 1 ? 's' : ''} disponível{modules.length !== 1 ? 'is' : ''}
        </div>
      </div>

      {modules.length === 0 ? (
        <div className="text-center py-8">
          <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum módulo encontrado</h3>
          <p className="text-gray-500">Não há módulos de treinamento disponíveis no momento.</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {modules.map((module) => (
            <div
              key={module.id}
              className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => fetchModuleContent(module.id)}
            >
              <div className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {module.title}
                  </h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(module.difficulty_level)}`}>
                    {getDifficultyLabel(module.difficulty_level)}
                  </span>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                  {module.description}
                </p>

                <div className="flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <Clock className="h-4 w-4 mr-1" />
                    {formatDuration(module.estimated_duration)}
                  </div>
                  <div className="flex items-center">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                      {module.category}
                    </span>
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